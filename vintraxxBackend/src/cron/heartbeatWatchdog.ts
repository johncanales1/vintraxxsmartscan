/**
 * heartbeatWatchdog — flips silent ONLINE terminals to OFFLINE.
 *
 * The gateway sets status=ONLINE on auth + every heartbeat / location
 * update. If a device drops off the network without a clean FIN (battery
 * pulled, carrier outage), the TCP socket may hang half-open for minutes,
 * during which the row stays ONLINE.
 *
 * This cron sweeps for ONLINE rows whose lastHeartbeatAt is older than
 * GPS_HEARTBEAT_TIMEOUT_SEC and demotes them to OFFLINE. Each demotion also
 * fires a `terminal.offline` notify so connected admin/user UIs see the
 * status change without refresh.
 */

import prisma from '../config/db';
import { env } from '../config/env';
import logger from '../utils/logger';
import { emit as emitNotify } from '../realtime/notify';

export async function runHeartbeatWatchdog(): Promise<void> {
  const cutoff = new Date(Date.now() - env.GPS_HEARTBEAT_TIMEOUT_SEC * 1000);

  // Fetch ids first so we can emit per-row notify after the bulk update.
  const stale = await prisma.gpsTerminal.findMany({
    where: {
      status: 'ONLINE',
      OR: [{ lastHeartbeatAt: null }, { lastHeartbeatAt: { lt: cutoff } }],
    },
    select: { id: true, ownerUserId: true },
    take: 500, // Guard against pathological bursts; next tick picks up the rest.
  });

  if (stale.length === 0) return;

  const offlineAt = new Date();
  await prisma.gpsTerminal.updateMany({
    where: { id: { in: stale.map((s) => s.id) } },
    data: { status: 'OFFLINE', disconnectedAt: offlineAt },
  });

  for (const t of stale) {
    void emitNotify({
      type: 'terminal.offline',
      terminalId: t.id,
      ownerUserId: t.ownerUserId,
      at: offlineAt.toISOString(),
    });
  }

  logger.info('heartbeatWatchdog flipped terminals OFFLINE', {
    count: stale.length,
    cutoffSec: env.GPS_HEARTBEAT_TIMEOUT_SEC,
  });
}
