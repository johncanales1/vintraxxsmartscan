/**
 * dispatch — central inbound-message router.
 *
 * `dispatchFrame` is called once per fully-decoded frame. It:
 *   1. Captures phoneBcd on the session if not yet set.
 *   2. Enforces the auth gate: any message OTHER than 0x0100 / 0x0102 from an
 *      unauthenticated session is dropped (and logged).
 *   3. Body-decodes per msgId and forwards to the appropriate handler.
 *   4. Sends 0x8001 (platform general response) for messages that need one.
 *
 * Phase 0 only knows about the registration / auth / heartbeat path. Unknown
 * msgIds are acked with `result=UNSUPPORTED` (3) so the device stops retrying
 * but the socket stays alive — required by spec §1.7.
 */

import { MsgId, PlatformResult } from '../codec/constants';
import * as m0001 from '../codec/messages/m0001-terminal-general-response';
import * as m0002 from '../codec/messages/m0002-heartbeat';
import * as m0100 from '../codec/messages/m0100-register';
import * as m0102 from '../codec/messages/m0102-auth';
import { handleRegister } from './handleRegister';
import { handleAuth } from './handleAuth';
import { handleHeartbeat } from './handleHeartbeat';
import { handleTerminalGeneralResponse } from './handleTerminalGeneralResponse';
import * as m0104 from '../codec/messages/m0104-query-params-response';
import { handleLocation, handleBatchLocation } from './handleLocation';
import { handlePassThrough } from './handlePassThrough';
import { handleVersionInfo } from './handleVersionInfo';
import * as m0205 from '../codec/messages/m0205-version-info';
import iconv from 'iconv-lite';
import prisma from '../../config/db';
import { Prisma } from '@prisma/client';
import * as commandService from '../../services/gps-command.service';
import type { Session } from '../session/Session';
import type { DecodedFrame } from '../codec';

/**
 * Messages the device may legally send before authenticating.
 */
const PRE_AUTH_ALLOWED = new Set<number>([
  MsgId.TERMINAL_REGISTER,
  MsgId.TERMINAL_AUTH,
  // Some firmwares emit a heartbeat right after TCP connect, before register.
  // Be lenient: ack it but don't act on it until auth completes.
  MsgId.TERMINAL_HEARTBEAT,
]);

export async function dispatchFrame(session: Session, frame: DecodedFrame): Promise<void> {
  const { header, body } = frame;

  // Capture phone identity on first frame.
  if (!session.phoneBcd) {
    session.phoneBcd = header.phoneBcd;
  }

  // Auth gate.
  if (!session.authenticated && !PRE_AUTH_ALLOWED.has(header.msgId)) {
    session.log.warn('Dropping pre-auth message', {
      msgId: `0x${header.msgId.toString(16).padStart(4, '0')}`,
    });
    session.ack(header.msgId, header.msgSerial, PlatformResult.FAILURE);
    return;
  }

  switch (header.msgId) {
    case MsgId.TERMINAL_REGISTER: {
      const decoded = m0100.decode(body);
      await handleRegister(session, decoded, header.msgSerial);
      // handleRegister itself sends 0x8100 — no 0x8001 ack here.
      return;
    }

    case MsgId.TERMINAL_AUTH: {
      const decoded = m0102.decode(body);
      await handleAuth(session, decoded, header.msgSerial);
      return;
    }

    case MsgId.TERMINAL_HEARTBEAT: {
      m0002.decode(body); // empty, but call for symmetry / future logging
      await handleHeartbeat(session, header.msgSerial);
      return;
    }

    case MsgId.TERMINAL_GENERAL_RESPONSE: {
      // Ack of one of OUR previously-sent commands. Spec §1.7 says NOT to ack
      // a 0x0001 (would create an infinite ack loop).
      const decoded = m0001.decode(body);
      handleTerminalGeneralResponse(session, decoded);
      return;
    }

    case MsgId.QUERY_TERMINAL_PARAMS_RESPONSE: {
      // 0x0104 — dedicated response to our 0x8104 query. The device replies
      // with a TLV dump of ALL its parameters. We resolve the pending command
      // so it doesn't time out, and do NOT send 0x8001 (it's a response msg).
      const decoded0104 = m0104.decode(body);
      session.log.info('Received 0x0104 param query response', {
        replyToSerial: decoded0104.replyToSerial,
        paramCount: decoded0104.paramCount,
        actualParams: decoded0104.params.length,
      });
      // Resolve the pending 0x8104 command keyed by replyToSerial.
      const pending0104 = session.pendingCommands.get(decoded0104.replyToSerial);
      if (pending0104) {
        clearTimeout(pending0104.timeoutHandle);
        session.pendingCommands.delete(decoded0104.replyToSerial);
        pending0104.resolve(0); // 0 = success
      }
      // Extract OBD-relevant config params and persist on the terminal row.
      if (session.terminalId) {
        const obdConfig: Record<string, unknown> = {};
        for (const p of decoded0104.params) {
          if (p.id === 0x2017 && p.raw.length >= 1) obdConfig.obdEnabled = p.raw.readUInt8(0);
          if (p.id === 0x201a && p.raw.length >= 1) obdConfig.dtcReadFlag = p.raw.readUInt8(0);
          if (p.id === 0x2012 && p.raw.length >= 1) obdConfig.mileageAndFuelType = p.raw.readUInt8(0);
          if (p.id === 0x2013 && p.raw.length >= 4) obdConfig.mileageCoefficient = p.raw.readUInt32BE(0);
          if (p.id === 0x2014 && p.raw.length >= 4) obdConfig.fuelCoefficient = p.raw.readUInt32BE(0);
          if (p.id === 0x2015 && p.raw.length >= 4) obdConfig.fuelDensity = p.raw.readUInt32BE(0);
          if (p.id === 0x2016 && p.raw.length >= 4) obdConfig.idleFuelCoefficient = p.raw.readUInt32BE(0);
          // OBD interval parameters for scan timeout adjustment
          if (p.id === 0x201b && p.raw.length >= 4) obdConfig.obdUploadIntervalSec = p.raw.readUInt32BE(0); // &3Z
          if (p.id === 0x201c && p.raw.length >= 4) obdConfig.obdLargePacketIntervalSec = p.raw.readUInt32BE(0); // &5R
          if (p.id === 0x201d && p.raw.length >= 1) obdConfig.obdDiagLogSetting = p.raw.readUInt8(0); // &5P
        }
        if (Object.keys(obdConfig).length > 0) {
          session.log.info('OBD config from 0x0104 (decoded)', obdConfig);
          void prisma.gpsTerminal.update({
            where: { id: session.terminalId },
            data: { parameters: obdConfig as Prisma.InputJsonValue },
          }).catch(() => { /* best-effort */ });
        }
      }
      return;
    }

    case MsgId.PROACTIVE_VERSION_INFO: {
      // 0x0205 — proactive version report containing VIN, firmware, mileage.
      // Handler sends 0x8205 reply (NOT 0x8001).
      const decoded0205 = m0205.decode(body);
      session.log.info('0x0205 proactive version info received', {
        hasVin: !!decoded0205.vin,
        hasMileage: decoded0205.totalMileageKm > 0,
        softwareVersion: decoded0205.softwareVersion,
      });
      await handleVersionInfo(session, decoded0205, header.msgSerial);
      return;
    }

    case MsgId.LOCATION_REPORT: {
      // Pass the raw body so persistLocations can stash it on rawPayload.
      await handleLocation(session, body, header.msgSerial, body);
      return;
    }

    case 0x0201: {
      // 0x0201 — Location Information Query Response. Body is:
      //   replyToSerial (uint16 BE) + standard 0x0200 location body.
      // We skip the 2-byte serial prefix and decode the rest as a 0x0200.
      if (body.length > 2) {
        const locationBody = body.subarray(2);
        await handleLocation(session, locationBody, header.msgSerial, body);
      } else {
        session.ack(0x0201, header.msgSerial, PlatformResult.FAILURE);
      }
      return;
    }

    case MsgId.BATCH_LOCATION_REPORT: {
      await handleBatchLocation(session, body, header.msgSerial);
      return;
    }

    case MsgId.DATA_UPLINK: {
      // 0x0900 — pass-through; the handler multiplexes on the inner subtype byte.
      await handlePassThrough(session, body, header.msgSerial);
      return;
    }

    case MsgId.TEXT_REPLY: {
      // 0x6006 — device's text reply to a platform 0x8300 SMS command.
      // Capture everything without guessing business meaning; the full
      // raw + decoded data is what lets the supplier confirm the format.
      await handle6006TextReply(session, body, header.msgSerial, frame.rawUnescaped);
      // 0x6006 does not require a platform general response (spec §1.7).
      return;
    }

    default: {
      // Phase 1+ handlers will land here. For now just log + tell the device
      // we don't support it so it stops retrying.
      session.log.info('Unhandled msgId (will be implemented in a later phase)', {
        msgId: `0x${header.msgId.toString(16).padStart(4, '0')}`,
        bodyLen: body.length,
      });
      session.ack(header.msgId, header.msgSerial, PlatformResult.UNSUPPORTED);
      return;
    }
  }
}

// ── 0x6006 — Device text reply ───────────────────────────────────────────────

/**
 * Full handler for 0x6006 (Text Message Reply).
 *
 * Captures the raw body + full frame bytes, attempts multi-encoding decode
 * (ASCII, UTF-8, GBK), correlates with the most-recent 4G always-online
 * command, updates the command record, and emits structured logs.
 *
 * We do NOT infer business success/failure from the text: the supplier must
 * first confirm the exact 0x6006 body format and pass/fail strings.
 */
async function handle6006TextReply(
  session: Session,
  body: Buffer,
  msgSerial: number,
  rawUnescaped: Buffer,
): Promise<void> {
  const receivedAt = new Date();
  const terminalId = session.terminalId ?? 'unknown';
  const deviceIdentifier = session.canonicalDeviceId ?? 'unknown';

  // ── Multi-encoding decode ────────────────────────────────────────────────

  const bodyHex = body.toString('hex');
  const fullFrameHex = rawUnescaped.toString('hex');

  let decodedTextAscii: string | null = null;
  let decodedTextUtf8: string | null = null;
  let decodedTextGbk: string | null = null;
  let printableTextExtract = '';
  let parseError: string | null = null;
  let parseStatus = 'UNKNOWN';

  try {
    // ASCII (printable range 0x20–0x7E + common controls)
    const asciiStr = body.toString('ascii').replace(/\0/g, '');
    const isPrintableAscii = /^[\x20-\x7E\t\r\n]*$/.test(asciiStr);
    if (isPrintableAscii && asciiStr.trim().length > 0) {
      decodedTextAscii = asciiStr.trim();
      parseStatus = 'ASCII_OK';
    }

    // UTF-8
    try {
      const utf8Str = body.toString('utf8').replace(/\0/g, '').trim();
      if (utf8Str.length > 0) {
        decodedTextUtf8 = utf8Str;
        if (parseStatus === 'UNKNOWN') parseStatus = 'UTF8_OK';
      }
    } catch {
      // fall through
    }

    // GBK via iconv-lite
    try {
      const gbkStr = iconv.decode(body, 'gbk').replace(/\0/g, '').trim();
      if (gbkStr.length > 0) {
        decodedTextGbk = gbkStr;
        if (parseStatus === 'UNKNOWN') parseStatus = 'GBK_OK';
      }
    } catch {
      // iconv-lite may not have the charset — ignore
    }

    // Printable extract: strip non-printable bytes, keep runs of printable chars
    printableTextExtract = body
      .toString('latin1')
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (parseStatus === 'UNKNOWN') {
      parseStatus = printableTextExtract.length > 0 ? 'NON_PRINTABLE_PARTIAL' : 'NON_PRINTABLE';
    }
  } catch (err) {
    parseError = (err as Error).message;
    parseStatus = 'DECODE_ERROR';
  }

  const bestText = decodedTextAscii ?? decodedTextUtf8 ?? decodedTextGbk ?? printableTextExtract;

  // ── Structured log ───────────────────────────────────────────────────────

  session.log.info('GPS command vendor response (0x6006)', {
    terminalId,
    deviceIdentifier,
    messageId: '0x6006',
    serial: msgSerial,
    receivedAt: receivedAt.toISOString(),
    bodyLength: body.length,
    rawBodyHex: bodyHex,
    rawFullFrameHex: fullFrameHex,
    decodedTextAscii,
    decodedTextUtf8,
    decodedTextGbk,
    printableTextExtract,
    parseStatus,
    parseError,
  });

  // ── Command correlation ──────────────────────────────────────────────────

  if (!session.terminalId) return;

  const latestCmd = await commandService.findLatest4gAlwaysOnlineCommand({
    terminalId: session.terminalId,
    withinMs: 5 * 60_000,
  });

  if (!latestCmd) {
    session.log.info('0x6006 received but no recent 4G always-online command found to correlate', {
      terminalId,
      deviceIdentifier,
    });
    return;
  }

  const ok = await commandService.markVendorResponseReceived({
    commandId: latestCmd.id,
    messageId: '0x6006',
    rawHex: bodyHex,
    decodedText: bestText,
    parseStatus,
    responseJson: {
      serial: msgSerial,
      receivedAt: receivedAt.toISOString(),
      bodyLength: body.length,
      decodedTextAscii,
      decodedTextUtf8,
      decodedTextGbk,
      printableTextExtract,
      parseError,
    } as Prisma.InputJsonValue,
  });

  session.log.info('GPS command vendor response correlated', {
    commandId: latestCmd.id,
    terminalId,
    deviceIdentifier,
    messageId: '0x6006',
    bodyLength: body.length,
    decodedText: bestText,
    parseStatus,
    correlated: ok,
  });
}
