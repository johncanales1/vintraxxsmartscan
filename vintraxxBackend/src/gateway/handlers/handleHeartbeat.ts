/**
 * 0x0002 — Heartbeat handler.
 *
 * Empty body. We update lastHeartbeatAt on the terminal row and ack with
 * 0x8001. The watchdog cron (Phase 1) reads lastHeartbeatAt to flip terminals
 * to OFFLINE when they go silent.
 *
 * CRITICAL #5: if the terminal has been REVOKED by an admin while the socket
 * was still alive, we MUST NOT flip status back to ONLINE. We refuse the ack
 * and close the session so the device performs a fresh register/auth and
 * gets rejected at handleAuth (which already gates on REVOKED).
 */

import prisma from '../../config/db';
import { MsgId, PlatformResult } from '../codec/constants';
import type { Session } from '../session/Session';

export async function handleHeartbeat(session: Session, msgSerial: number): Promise<void> {
  const now = new Date();
  session.lastHeartbeatAt = now;

  if (session.terminalId && session.authenticated) {
    const terminal = await prisma.gpsTerminal.findUnique({
      where: { id: session.terminalId },
      select: { status: true },
    });
    if (!terminal || terminal.status === 'REVOKED') {
      session.log.warn('Heartbeat from REVOKED/missing terminal — closing', {
        terminalId: session.terminalId,
        status: terminal?.status,
      });
      session.ack(MsgId.TERMINAL_HEARTBEAT, msgSerial, PlatformResult.FAILURE);
      session.close('terminal revoked mid-session');
      return;
    }
    await prisma.gpsTerminal.update({
      where: { id: session.terminalId },
      data: { lastHeartbeatAt: now, status: 'ONLINE' },
    });
  }

  session.ack(MsgId.TERMINAL_HEARTBEAT, msgSerial);
}
