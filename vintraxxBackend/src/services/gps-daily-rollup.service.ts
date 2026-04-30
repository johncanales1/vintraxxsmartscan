/**
 * gps-daily-rollup.service — aggregates yesterday's GpsTrip + GpsAlarm rows
 * into GpsTerminalDailyStats so the user/admin "trends" UI can render
 * dashboards from a small, indexed table instead of scanning the partitioned
 * telemetry every time.
 *
 * Idempotent: re-running the same day's rollup overwrites the row via
 * `upsert` keyed on `[terminalId, day]`. This means the cron can safely
 * re-process a day if the previous run failed mid-way.
 *
 * The rollup runs against trips that CLOSED within the day window. Trips
 * that opened on day N-1 and closed on day N are counted on day N (when
 * they actually wrapped up) — this aligns with how human users think
 * about "yesterday's drives".
 */

import prisma from '../config/db';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';

interface RolloverWindow {
  /** Inclusive lower bound (UTC). */
  startUtc: Date;
  /** Exclusive upper bound (UTC). */
  endUtc: Date;
  /** The Postgres `date` value to write into GpsTerminalDailyStats.day. */
  dayDate: Date;
}

/** Build the UTC window for a target day (00:00 → next 00:00). */
function windowForDay(day: Date): RolloverWindow {
  const startUtc = new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 0, 0, 0, 0),
  );
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  return { startUtc, endUtc, dayDate: startUtc };
}

/**
 * Run the rollup for ONE specific day. Aggregates by terminal across:
 *   • CLOSED GpsTrip rows whose endAt falls in the window — for tripCount,
 *     distanceKm, drivingSec, idleSec, harshEventCount, maxSpeedKmh, avgScore.
 *   • All GpsAlarm rows whose openedAt falls in the window — for alarmCount.
 *
 * Returns count of terminals processed.
 */
export async function runDailyRollupForDay(day: Date): Promise<number> {
  const { startUtc, endUtc, dayDate } = windowForDay(day);

  logger.info('Daily rollup: starting', {
    dayUtc: dayDate.toISOString(),
    windowStart: startUtc.toISOString(),
    windowEnd: endUtc.toISOString(),
  });

  // Trip aggregates per terminal. We use Prisma groupBy with sum/max/avg
  // aggregations — these run in-database so even a 100k-row day is one
  // round-trip.
  const tripAggs = await prisma.gpsTrip.groupBy({
    by: ['terminalId', 'ownerUserId'],
    where: {
      status: 'CLOSED',
      endAt: { gte: startUtc, lt: endUtc },
    },
    _sum: {
      distanceKm: true,
      durationSec: true,
      idleDurationSec: true,
      harshAccelCount: true,
      harshBrakeCount: true,
      harshTurnCount: true,
      overspeedCount: true,
    },
    _max: { maxSpeedKmh: true },
    _avg: { score: true },
    _count: { _all: true },
  });

  // Alarm counts per terminal in the same window.
  const alarmCounts = await prisma.gpsAlarm.groupBy({
    by: ['terminalId'],
    where: { openedAt: { gte: startUtc, lt: endUtc } },
    _count: { _all: true },
  });
  const alarmCountByTerminal = new Map<string, number>(
    alarmCounts.map((row) => [row.terminalId, row._count._all]),
  );

  // Some terminals had alarms but NO trips in the window. We still want to
  // record their daily row so the UI doesn't show a gap on the alarm chart.
  const seenTerminalIds = new Set(tripAggs.map((r) => r.terminalId));
  const alarmOnlyIds = alarmCounts
    .map((r) => r.terminalId)
    .filter((id) => !seenTerminalIds.has(id));

  // Owner lookup for alarm-only terminals (trip aggs already carry it).
  const alarmOnlyOwners = alarmOnlyIds.length
    ? new Map(
        (
          await prisma.gpsTerminal.findMany({
            where: { id: { in: alarmOnlyIds } },
            select: { id: true, ownerUserId: true },
          })
        ).map((t) => [t.id, t.ownerUserId]),
      )
    : new Map<string, string | null>();

  let processed = 0;

  for (const agg of tripAggs) {
    try {
      const harshTotal =
        (agg._sum.harshAccelCount ?? 0) +
        (agg._sum.harshBrakeCount ?? 0) +
        (agg._sum.harshTurnCount ?? 0) +
        (agg._sum.overspeedCount ?? 0);

      // We don't have a column-level "drivingSec vs idleSec" split — derive
      // drivingSec by subtracting idle from total trip duration. Negative
      // results would indicate a corrupt row; clamp to 0.
      const totalDur = agg._sum.durationSec ?? 0;
      const idle = agg._sum.idleDurationSec ?? 0;
      const drivingSec = Math.max(0, totalDur - idle);

      await prisma.gpsTerminalDailyStats.upsert({
        where: { terminalId_day: { terminalId: agg.terminalId, day: dayDate } },
        update: {
          ownerUserId: agg.ownerUserId,
          distanceKm: new Prisma.Decimal(
            (agg._sum.distanceKm !== null ? Number(agg._sum.distanceKm) : 0).toFixed(2),
          ),
          tripCount: agg._count._all,
          drivingSec,
          idleSec: idle,
          alarmCount: alarmCountByTerminal.get(agg.terminalId) ?? 0,
          harshEventCount: harshTotal,
          maxSpeedKmh:
            agg._max.maxSpeedKmh !== null
              ? new Prisma.Decimal(Number(agg._max.maxSpeedKmh).toFixed(1))
              : null,
          avgScore:
            agg._avg.score !== null && agg._avg.score !== undefined
              ? Math.round(Number(agg._avg.score))
              : null,
        },
        create: {
          terminalId: agg.terminalId,
          ownerUserId: agg.ownerUserId,
          day: dayDate,
          distanceKm: new Prisma.Decimal(
            (agg._sum.distanceKm !== null ? Number(agg._sum.distanceKm) : 0).toFixed(2),
          ),
          tripCount: agg._count._all,
          drivingSec,
          idleSec: idle,
          alarmCount: alarmCountByTerminal.get(agg.terminalId) ?? 0,
          harshEventCount: harshTotal,
          maxSpeedKmh:
            agg._max.maxSpeedKmh !== null
              ? new Prisma.Decimal(Number(agg._max.maxSpeedKmh).toFixed(1))
              : null,
          avgScore:
            agg._avg.score !== null && agg._avg.score !== undefined
              ? Math.round(Number(agg._avg.score))
              : null,
        },
      });
      processed++;
    } catch (err) {
      logger.error('Daily rollup: failed to upsert trip-aggregate row', {
        terminalId: agg.terminalId,
        err: (err as Error).message,
      });
    }
  }

  for (const terminalId of alarmOnlyIds) {
    try {
      await prisma.gpsTerminalDailyStats.upsert({
        where: { terminalId_day: { terminalId, day: dayDate } },
        update: {
          alarmCount: alarmCountByTerminal.get(terminalId) ?? 0,
          ownerUserId: alarmOnlyOwners.get(terminalId) ?? null,
        },
        create: {
          terminalId,
          ownerUserId: alarmOnlyOwners.get(terminalId) ?? null,
          day: dayDate,
          alarmCount: alarmCountByTerminal.get(terminalId) ?? 0,
          // distanceKm + tripCount stay at their default 0.
        },
      });
      processed++;
    } catch (err) {
      logger.error('Daily rollup: failed to upsert alarm-only row', {
        terminalId,
        err: (err as Error).message,
      });
    }
  }

  logger.info('Daily rollup: done', {
    dayUtc: dayDate.toISOString(),
    terminalsProcessed: processed,
  });
  return processed;
}

/**
 * Convenience: run the rollup for "yesterday" (UTC). The cron schedules this
 * at 00:15 UTC so the previous-day window is fully closed.
 */
export async function runDailyRollupForYesterday(): Promise<number> {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return runDailyRollupForDay(yesterday);
}
