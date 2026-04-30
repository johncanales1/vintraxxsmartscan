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
import { handleLocation, handleBatchLocation } from './handleLocation';
import { handlePassThrough } from './handlePassThrough';
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

    case MsgId.LOCATION_REPORT: {
      // Pass the raw body so persistLocations can stash it on rawPayload.
      await handleLocation(session, body, header.msgSerial, body);
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
