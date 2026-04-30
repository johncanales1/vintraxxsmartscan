/**
 * gps-stats.service — read-only counters for the admin Overview KPI strip.
 *
 * Phase 0 only had terminal-level counts. Phase 2 added 24h alarm/DTC counts.
 * Phase 3 adds trip + distance numbers driven off GpsTrip and the rolled-up
 * GpsTerminalDailyStats table.
 *
 * All counts run as a single Promise.all → one round-trip's worth of latency
 * regardless of how many KPIs the dashboard needs. New fields are PURELY
 * ADDITIVE — clients pin to specific keys and ignore the rest.
 */

import prisma from '../config/db';

export async function getOverviewCounts() {
  const now = new Date();
  const day1Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const day7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    total,
    online,
    offline,
    neverConnected,
    revoked,
    unpaired,
    alarms24h,
    criticalAlarms24h,
    unackedAlarms,
    dtcEvents24h,
    tripsOpen,
    tripsClosed24h,
    distance24hAgg,
    distance7dAgg,
  ] = await Promise.all([
    prisma.gpsTerminal.count(),
    prisma.gpsTerminal.count({ where: { status: 'ONLINE' } }),
    prisma.gpsTerminal.count({ where: { status: 'OFFLINE' } }),
    prisma.gpsTerminal.count({ where: { status: 'NEVER_CONNECTED' } }),
    prisma.gpsTerminal.count({ where: { status: 'REVOKED' } }),
    prisma.gpsTerminal.count({ where: { ownerUserId: null } }),
    prisma.gpsAlarm.count({ where: { openedAt: { gte: day1Ago } } }),
    prisma.gpsAlarm.count({
      where: { openedAt: { gte: day1Ago }, severity: 'CRITICAL' },
    }),
    prisma.gpsAlarm.count({ where: { acknowledged: false, closedAt: null } }),
    prisma.gpsDtcEvent.count({ where: { reportedAt: { gte: day1Ago } } }),
    prisma.gpsTrip.count({ where: { status: 'OPEN' } }),
    prisma.gpsTrip.count({
      where: { status: 'CLOSED', endAt: { gte: day1Ago } },
    }),
    // 24h distance comes from GpsTrip rows that closed within the window.
    // Using sum-distance-on-closed-trips rather than the daily-stats row so
    // it stays accurate intraday before the 00:15 rollup runs.
    prisma.gpsTrip.aggregate({
      where: { status: 'CLOSED', endAt: { gte: day1Ago } },
      _sum: { distanceKm: true },
    }),
    // 7d distance comes from the rolled-up table — fast, single-table read.
    prisma.gpsTerminalDailyStats.aggregate({
      where: { day: { gte: day7Ago } },
      _sum: { distanceKm: true },
    }),
  ]);

  return {
    terminals: { total, online, offline, neverConnected, revoked, unpaired },
    alarms: {
      last24h: alarms24h,
      criticalLast24h: criticalAlarms24h,
      unacknowledged: unackedAlarms,
    },
    dtcEvents: { last24h: dtcEvents24h },
    trips: {
      open: tripsOpen,
      closedLast24h: tripsClosed24h,
      distanceKmLast24h: Number(distance24hAgg._sum.distanceKm ?? 0),
      distanceKmLast7d: Number(distance7dAgg._sum.distanceKm ?? 0),
    },
  };
}
