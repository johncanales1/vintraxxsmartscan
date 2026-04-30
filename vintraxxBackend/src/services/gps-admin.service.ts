/**
 * gps-admin.service — admin-only GPS service helpers.
 *
 * Wraps the user-scoped helpers (`getLatestLocation`, `getLocationHistory`)
 * for callers who already passed the global admin auth middleware. The
 * difference is the OWNERSHIP CHECK: admin variants never enforce
 * `ownerUserId === userId`, while still returning the same row shape so
 * the frontend can reuse the existing dealer dashboard types.
 *
 * Also hosts:
 *   • OBD snapshot listing per terminal (admin only — there is no user-
 *     facing variant yet because the dealer Live tab reads telemetry from
 *     the WS stream).
 *   • Bulk alarm acknowledgement (loops the existing acknowledgeAlarm
 *     under one transaction so partial failure rolls back).
 *   • Audit-log read for the Settings → Audit Log tab.
 *
 * Every helper here is intended to be called from an admin-authenticated
 * route. None of them filter by ownerUserId.
 */

import prisma from '../config/db';
import type { Prisma } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { acknowledgeAlarm } from './gps-alarm.service';

// ── Latest / locations / OBD (admin scope, no ownership check) ──────────────

/**
 * Return the most recent GpsLocation row for any terminal, or null when no
 * row exists yet (NEVER_CONNECTED terminal). Throws 404 only when the
 * terminal id itself is unknown — distinguishing "no telemetry yet" from
 * "no such terminal".
 */
export async function adminGetLatestLocation(terminalId: string) {
  const terminal = await prisma.gpsTerminal.findUnique({
    where: { id: terminalId },
    select: { id: true },
  });
  if (!terminal) throw new AppError('Terminal not found', 404);

  return prisma.gpsLocation.findFirst({
    where: { terminalId },
    orderBy: { reportedAt: 'desc' },
  });
}

interface AdminLocationHistoryOptions {
  terminalId: string;
  since?: Date;
  until?: Date;
  page: number;
  limit: number;
  minSpeedKmh?: number;
}

/**
 * Paginated location history for any terminal. Default window is the last
 * 24h. Admin variant of `getLocationHistory` with no ownership check.
 */
export async function adminGetLocationHistory(opts: AdminLocationHistoryOptions) {
  const terminal = await prisma.gpsTerminal.findUnique({
    where: { id: opts.terminalId },
    select: { id: true },
  });
  if (!terminal) throw new AppError('Terminal not found', 404);

  const since = opts.since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
  const until = opts.until ?? new Date();
  if (since >= until) {
    throw new AppError('`since` must be earlier than `until`', 400);
  }

  const where: Prisma.GpsLocationWhereInput = {
    terminalId: opts.terminalId,
    reportedAt: { gte: since, lte: until },
  };
  if (opts.minSpeedKmh !== undefined) {
    where.speedKmh = { gte: opts.minSpeedKmh };
  }

  const [total, locations] = await Promise.all([
    prisma.gpsLocation.count({ where }),
    prisma.gpsLocation.findMany({
      where,
      orderBy: { reportedAt: 'desc' },
      take: opts.limit,
      skip: (opts.page - 1) * opts.limit,
      // rawPayload is large and only useful for forensic ops — drop it
      // from the admin payload too, mirror the user-scoped behaviour.
      select: {
        id: true,
        terminalId: true,
        reportedAt: true,
        latitude: true,
        longitude: true,
        altitudeM: true,
        speedKmh: true,
        heading: true,
        accOn: true,
        gpsFix: true,
        satelliteCount: true,
        signalStrength: true,
        odometerKm: true,
        fuelLevelPct: true,
        externalVoltageMv: true,
        batteryVoltageMv: true,
        alarmBits: true,
        statusBits: true,
      },
    }),
  ]);

  return {
    locations,
    page: opts.page,
    limit: opts.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / opts.limit)),
    since: since.toISOString(),
    until: until.toISOString(),
  };
}

interface AdminObdHistoryOptions {
  terminalId: string;
  since?: Date;
  until?: Date;
  page: number;
  limit: number;
}

/**
 * Paginated OBD snapshots for any terminal. Default window is 24h.
 * Returns snapshots newest-first because the Detail modal's chart strip
 * is most useful with the freshest 50 points loaded first.
 */
export async function adminGetObdHistory(opts: AdminObdHistoryOptions) {
  const terminal = await prisma.gpsTerminal.findUnique({
    where: { id: opts.terminalId },
    select: { id: true },
  });
  if (!terminal) throw new AppError('Terminal not found', 404);

  const since = opts.since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
  const until = opts.until ?? new Date();
  if (since >= until) {
    throw new AppError('`since` must be earlier than `until`', 400);
  }

  const where: Prisma.GpsObdSnapshotWhereInput = {
    terminalId: opts.terminalId,
    reportedAt: { gte: since, lte: until },
  };

  const [total, snapshots] = await Promise.all([
    prisma.gpsObdSnapshot.count({ where }),
    prisma.gpsObdSnapshot.findMany({
      where,
      orderBy: { reportedAt: 'desc' },
      take: opts.limit,
      skip: (opts.page - 1) * opts.limit,
    }),
  ]);

  return {
    snapshots,
    page: opts.page,
    limit: opts.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / opts.limit)),
    since: since.toISOString(),
    until: until.toISOString(),
  };
}

// ── Bulk alarm acknowledge ──────────────────────────────────────────────────

interface BulkAckInput {
  ids: string[];
  adminId: string;
  note?: string;
}

interface BulkAckResult {
  count: number;
  acknowledged: string[];
  skipped: string[];
}

/**
 * Acknowledge many alarms in one round-trip. Idempotent — already-ack'd
 * alarms are reported in `skipped` and don't change. We use `acknowledgeAlarm`
 * per-id (which is itself idempotent) so admins also get the ack-by-admin
 * audit trail on each row. The whole batch runs sequentially to keep the
 * write rate sensible — typical bulk-ack is dozens, not thousands.
 *
 * NOTE: We deliberately do NOT wrap this in a transaction. A single bad id
 * shouldn't poison the rest — admins want best-effort behaviour, and
 * `acknowledgeAlarm` already throws 404 for missing ids which we trap.
 */
export async function bulkAcknowledgeAlarms(input: BulkAckInput): Promise<BulkAckResult> {
  const acknowledged: string[] = [];
  const skipped: string[] = [];

  for (const id of input.ids) {
    try {
      const before = await prisma.gpsAlarm.findUnique({
        where: { id },
        select: { id: true, acknowledged: true },
      });
      if (!before) {
        skipped.push(id);
        continue;
      }
      if (before.acknowledged) {
        skipped.push(id);
        continue;
      }
      await acknowledgeAlarm({
        alarmId: id,
        adminId: input.adminId,
        note: input.note,
      });
      acknowledged.push(id);
    } catch {
      // Best-effort: a transient failure on one alarm doesn't fail the
      // whole batch. The frontend reports {count, skipped} so the admin
      // can re-try the skipped ids.
      skipped.push(id);
    }
  }

  return {
    count: acknowledged.length,
    acknowledged,
    skipped,
  };
}

// ── Audit log read ──────────────────────────────────────────────────────────

interface ListAuditLogsOptions {
  page: number;
  limit: number;
  adminId?: string;
  targetType?: string;
  targetId?: string;
  action?: string;
  /** 1..5 — filter rows whose statusCode is in [class*100, class*100+100). */
  statusClass?: number;
  since?: Date;
  until?: Date;
}

/**
 * Paginated read of the AdminAuditLog table that the audit middleware
 * already populates on every admin write. Sorted newest-first so the
 * Settings → Audit Log tab's default view shows the latest activity.
 */
export async function listAuditLogs(opts: ListAuditLogsOptions) {
  const where: Prisma.AdminAuditLogWhereInput = {};
  if (opts.adminId) where.adminId = opts.adminId;
  if (opts.targetType) where.targetType = opts.targetType;
  if (opts.targetId) where.targetId = opts.targetId;
  if (opts.action) where.action = { contains: opts.action, mode: 'insensitive' };
  if (opts.statusClass !== undefined) {
    const lo = opts.statusClass * 100;
    where.statusCode = { gte: lo, lt: lo + 100 };
  }
  if (opts.since || opts.until) {
    where.createdAt = {};
    if (opts.since) (where.createdAt as Record<string, unknown>).gte = opts.since;
    if (opts.until) (where.createdAt as Record<string, unknown>).lte = opts.until;
  }

  const [total, entries] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: opts.limit,
      skip: (opts.page - 1) * opts.limit,
      include: {
        admin: { select: { id: true, email: true } },
      },
    }),
  ]);

  return {
    entries,
    page: opts.page,
    limit: opts.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / opts.limit)),
  };
}
