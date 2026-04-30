/**
 * 0x0102 — Terminal Authentication handler.
 *
 * Verifies the auth code the device sends matches the one the platform issued
 * in the previous 0x8100 response. On success:
 *   • binds the session to the GpsTerminal id
 *   • flips status → ONLINE, sets connectedAt
 *   • registers the session in SessionRegistry (closes any stale session for
 *     the same terminal)
 *   • acks with 0x8001 result=0
 *   • TODO Phase 1: pg_notify('gps_event', {type:'terminal.online', ...})
 *
 * On failure: 0x8001 result=1 (failure), close socket. The device retries the
 * full register → auth dance.
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
  // Prefer the IMEI sent inside the auth body (2019 spec), fall back to the
  // phoneBcd from the header (2013 spec).
  const imei =
    (body.imei && body.imei.length > 0 ? body.imei : session.phoneBcd?.replace(/^0+/, '')) ?? '';

  if (!imei) {
    session.log.warn('0x0102 with no resolvable IMEI; failing auth');
    session.ack(MsgId.TERMINAL_AUTH, msgSerial, PlatformResult.FAILURE);
    session.close('auth without identity');
    return;
  }

  // Rate-limit failed-auth attempts per IMEI. The bucket is incremented on
  // EVERY attempt (success or fail) and reset on success — this caps a
  // brute-forcer to `capacity` attempts per window without burdening a
  // legitimate device that occasionally reconnects.
  if (!authCodeLimiter.tryConsume(imei)) {
    session.log.warn('Auth rate-limit exceeded; closing', { imei });
    session.ack(MsgId.TERMINAL_AUTH, msgSerial, PlatformResult.FAILURE);
    session.close('auth rate limit');
    return;
  }

  const terminal = await prisma.gpsTerminal.findUnique({ where: { imei } });

  if (!terminal) {
    session.log.warn('Auth attempt for unknown terminal', { imei });
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
  const now = new Date();
  await prisma.gpsTerminal.update({
    where: { id: terminal.id },
    data: {
      status: 'ONLINE',
      connectedAt: now,
      disconnectedAt: null,
      lastHeartbeatAt: now,
      firmwareVersion: body.softwareVersion || terminal.firmwareVersion,
    },
  });

  session.bindTerminal({ terminalId: terminal.id, imei });
  session.authenticated = true;
  SessionRegistry.bind(session, terminal.id, imei);

  // Successful auth — clear the brute-force bucket for this IMEI.
  authCodeLimiter.reset(imei);

  session.ack(MsgId.TERMINAL_AUTH, msgSerial, PlatformResult.OK);

  session.log.info('Terminal authenticated', { terminalId: terminal.id, imei });

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
