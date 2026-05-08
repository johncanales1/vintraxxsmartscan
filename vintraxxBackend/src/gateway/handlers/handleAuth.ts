/**
 * 0x0102 — Terminal Authentication handler.
 *
 * Looks up the terminal by `deviceIdentifier` (the JT/T 808 header BCD
 * value, leading zeros stripped) and verifies the auth code the device
 * sends matches the one the platform issued in the previous 0x8100
 * response. On success:
 *   • binds the session to the GpsTerminal id
 *   • flips status → ONLINE, sets connectedAt
 *   • registers the session in SessionRegistry (closes any stale session
 *     for the same terminal)
 *   • when the 2019-spec auth body carries an IMEI, persists it to the
 *     `imei` metadata column (NOT used as the lookup key)
 *   • acks with 0x8001 result=0
 *
 * On failure: 0x8001 result=1 (failure), close socket. The device retries
 * the full register → auth dance.
 */

import prisma from '../../config/db';
import { MsgId, PlatformResult } from '../codec/constants';
import { authCodeEquals } from '../services/auth-code';
import { SessionRegistry } from '../session/SessionRegistry';
import { emit as emitNotify } from '../../realtime/notify';
import { dispatchQueuedForTerminal } from '../services/command-dispatcher';
import { authCodeLimiter } from '../services/rate-limit';
import type { Session } from '../session/Session';
import type { DecodedAuth } from '../codec/types';

export async function handleAuth(
  session: Session,
  body: DecodedAuth,
  msgSerial: number,
): Promise<void> {
  // The header's BCD identifier is the only thing every JT/T 808 packet
  // carries, so it's the only stable lookup key. The 2019-spec body IMEI
  // is metadata we record on success — never the match key. This matches
  // what handleRegister wrote when the device first registered.
  const deviceIdentifier = session.phoneBcd?.replace(/^0+/, '') ?? '';

  if (!deviceIdentifier) {
    session.log.warn('0x0102 with no resolvable device identifier; failing auth');
    session.ack(MsgId.TERMINAL_AUTH, msgSerial, PlatformResult.FAILURE);
    session.close('auth without identity');
    return;
  }

  // Rate-limit failed-auth attempts per device identifier. The bucket is
  // incremented on EVERY attempt (success or fail) and reset on success —
  // this caps a brute-forcer to `capacity` attempts per window without
  // burdening a legitimate device that occasionally reconnects.
  if (!authCodeLimiter.tryConsume(deviceIdentifier)) {
    session.log.warn('Auth rate-limit exceeded; closing', { deviceIdentifier });
    session.ack(MsgId.TERMINAL_AUTH, msgSerial, PlatformResult.FAILURE);
    session.close('auth rate limit');
    return;
  }

  const terminal = await prisma.gpsTerminal.findUnique({
    where: { deviceIdentifier },
  });

  if (!terminal) {
    session.log.warn('Auth attempt for unknown terminal', { deviceIdentifier });
    session.ack(MsgId.TERMINAL_AUTH, msgSerial, PlatformResult.FAILURE);
    session.close('terminal not found at auth');
    return;
  }

  if (terminal.status === 'REVOKED') {
    session.log.warn('Auth attempt for REVOKED terminal', { terminalId: terminal.id });
    session.ack(MsgId.TERMINAL_AUTH, msgSerial, PlatformResult.FAILURE);
    session.close('terminal revoked at auth');
    return;
  }

  if (!terminal.authCode || !authCodeEquals(terminal.authCode, body.authCode)) {
    session.log.warn('Auth code mismatch', {
      terminalId: terminal.id,
      received: body.authCode.length,
      expected: terminal.authCode?.length ?? 0,
    });
    session.ack(MsgId.TERMINAL_AUTH, msgSerial, PlatformResult.FAILURE);
    session.close('bad auth code');
    return;
  }

  // Success — record metadata, bind session, register globally.
  // Persist the 2019-spec body IMEI when (a) the device sent one and
  // (b) we either have nothing on file yet OR the value has changed.
  const incomingImei = body.imei && body.imei.length > 0 ? body.imei : null;
  const shouldUpdateImei = incomingImei !== null && incomingImei !== terminal.imei;

  const now = new Date();
  await prisma.gpsTerminal.update({
    where: { id: terminal.id },
    data: {
      status: 'ONLINE',
      connectedAt: now,
      disconnectedAt: null,
      lastHeartbeatAt: now,
      firmwareVersion: body.softwareVersion || terminal.firmwareVersion,
      ...(shouldUpdateImei ? { imei: incomingImei } : {}),
      // Reset alarm bits so the first 0x0200 after reconnect re-evaluates
      // the full alarm state from scratch instead of diffing against stale
      // latched bits from the previous session.
      lastAlarmBits: 0,
    },
  });

  session.bindTerminal({ terminalId: terminal.id, deviceIdentifier });
  session.authenticated = true;
  SessionRegistry.bind(session, terminal.id, deviceIdentifier);

  // Successful auth — clear the brute-force bucket.
  authCodeLimiter.reset(deviceIdentifier);

  session.ack(MsgId.TERMINAL_AUTH, msgSerial, PlatformResult.OK);

  session.log.info('Terminal authenticated', {
    terminalId: terminal.id,
    deviceIdentifier,
    imei: incomingImei ?? terminal.imei ?? null,
  });

  void emitNotify({
    type: 'terminal.online',
    terminalId: terminal.id,
    ownerUserId: terminal.ownerUserId,
    at: now.toISOString(),
  });

  // Drain any QUEUED commands that piled up while the device was offline.
  // The dispatcher itself swallows errors and logs them.
  void dispatchQueuedForTerminal(terminal.id);
}
