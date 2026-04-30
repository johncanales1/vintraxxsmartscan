/**
 * gps-alarm.service — query and acknowledge GpsAlarm rows.
 *
 * Two access scopes:
 *   • User-scoped: caller passes their userId; results are filtered by
 *     `GpsAlarm.ownerUserId === userId`. Acknowledging an alarm requires the
 *     terminal to belong to the requesting user (verified via the join).
 *   • Admin-scoped: no ownership filter; can ack any alarm in the system.
 *
 * Listing supports time-range, terminal-id filter, severity filter, and
 * acknowledged/open filter. Sorted newest first.
 */

import prisma from '../config/db';
import { Prisma, type GpsAlarmSeverity, type GpsAlarmType } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

/**
 * The Prisma column is `type` (reserved-keyword-adjacent but legal), but
 * the public API exposes it as `alarmType` so the field name reads more
 * naturally on the wire. This helper maps in one place — every service
 * function that returns alarm rows pipes through here.
 *
 * LOW #4 — wire-shape contract for new code:
 *   • `alarmType` is the **canonical** public field. All new clients
 *     (mobile, admin, frontend) MUST read `alarmType`.
 *   • `type` is **legacy-only** — kept on the response so v1 mobile
 *     clients (shipped before the rename) don't break. The two fields
 *     are guaranteed to hold the **same** GpsAlarmType value within any
 *     single response. Do not write code that branches on one vs the
 *     other.
 *   • The realtime WS path (src/realtime/notify.ts) does NOT go through
 *     this helper — its event payload only ever carries `alarmType`. So
 *     `type` exists on REST responses but not on WS events. New clients
 *     reading `alarmType` in both places will Just Work; old clients
 *     reading `type` still work for REST and were never wired to WS.
 *
 * Removing `type` from the response is a coordinated mobile + backend
 * release; not in scope here.
 */
function serializeAlarm<T extends { type: GpsAlarmType }>(a: T): T & { alarmType: GpsAlarmType } {
  return { ...a, alarmType: a.type };
}

interface ListOptions {
  /** When set, only return alarms for terminals owned by this user. */
  userId?: string;
  /** When true, the call is from an admin (bypasses owner filter). */
  admin?: boolean;
  page: number;
  limit: number;
  /** Restrict to a single terminal id. */
  terminalId?: string;
  severity?: GpsAlarmSeverity;
  /**
   * Restrict to a single alarm type. Admin-only; user-scoped routes pass
   * undefined here (it's harmless either way). Loosely typed because the
   * controller already shape-validated via zod and we don't want a strict
   * cast to break on a transient Prisma enum drift during deploy.
   */
  alarmType?: string;
  /** 'open' = closedAt null; 'closed' = closedAt not null; undefined = both. */
  state?: 'open' | 'closed';
  /** ack=true keeps only acknowledged; ack=false keeps only un-acked. */
  ack?: boolean;
  /**
   * Admin-only filter — restricts to alarms whose `ownerUserId` matches.
   * For user-scoped calls, the implicit ownerUserId scope already does this,
   * so passing it here is a no-op but accepted to keep the option object
   * uniform between scopes.
   */
  ownerUserId?: string;
  /**
   * Admin-only free-text search across terminal IMEI / VIN / owner email.
   * Implemented with a Prisma `OR` over related fields. Only applied when
   * `admin` is true so we never broaden a user-scoped query.
   */
  search?: string;
  since?: Date;
  until?: Date;
}

export async function listAlarms(opts: ListOptions) {
  if (!opts.admin && !opts.userId) {
    throw new AppError('Either admin or userId must be set', 500);
  }

  const where: Prisma.GpsAlarmWhereInput = {};
  if (!opts.admin) where.ownerUserId = opts.userId;
  if (opts.admin && opts.ownerUserId) where.ownerUserId = opts.ownerUserId;
  if (opts.terminalId) where.terminalId = opts.terminalId;
  if (opts.severity) where.severity = opts.severity;
  // The Prisma column is `type`; the public API renames it to `alarmType`
  // on output via `serializeAlarm`. Filter inputs use `alarmType` for
  // symmetry with the response field but we translate to `type` here.
  if (opts.alarmType) where.type = opts.alarmType as GpsAlarmType;
  if (opts.state === 'open') where.closedAt = null;
  if (opts.state === 'closed') where.closedAt = { not: null };
  if (opts.ack !== undefined) where.acknowledged = opts.ack;
  if (opts.since || opts.until) {
    where.openedAt = {};
    if (opts.since) (where.openedAt as Record<string, unknown>).gte = opts.since;
    if (opts.until) (where.openedAt as Record<string, unknown>).lte = opts.until;
  }
  if (opts.admin && opts.search) {
    // GpsAlarm has no direct `ownerUser` relation (the column is a
    // denormalised String snapshot). To search by owner we hop through
    // `terminal.ownerUser`. Alarm lists are paginated to 50 by default,
    // and the FK-side filters above (severity / state / ack) usually
    // narrow the candidate set before this OR runs, so the slightly
    // less-indexable shape is acceptable.
    const q = opts.search.trim();
    where.OR = [
      { terminal: { imei: { contains: q, mode: 'insensitive' } } },
      { terminal: { vehicleVin: { contains: q, mode: 'insensitive' } } },
      { terminal: { nickname: { contains: q, mode: 'insensitive' } } },
      { terminal: { ownerUser: { email: { contains: q, mode: 'insensitive' } } } },
      { terminal: { ownerUser: { fullName: { contains: q, mode: 'insensitive' } } } },
    ];
  }

  // Admin lists carry richer relations so the console can render owner
  // chips and "acked by" without N+1 fetches. User lists keep the slim
  // include to minimise payload. Note: the Admin model only has `email`
  // (no fullName), unlike User.
  const include: Prisma.GpsAlarmInclude = opts.admin
    ? {
        terminal: {
          select: {
            id: true,
            imei: true,
            nickname: true,
            vehicleVin: true,
            vehicleYear: true,
            vehicleMake: true,
            vehicleModel: true,
            ownerUser: { select: { id: true, email: true, fullName: true, isDealer: true } },
          },
        },
        acknowledgedByAdmin: { select: { id: true, email: true } },
        acknowledgedByUser: { select: { id: true, email: true, fullName: true } },
      }
    : {
        terminal: {
          select: { id: true, imei: true, nickname: true, vehicleVin: true },
        },
      };

  const [total, alarms] = await Promise.all([
    prisma.gpsAlarm.count({ where }),
    prisma.gpsAlarm.findMany({
      where,
      orderBy: [{ openedAt: 'desc' }, { id: 'desc' }],
      take: opts.limit,
      skip: (opts.page - 1) * opts.limit,
      include,
    }),
  ]);

  return {
    alarms: alarms.map(serializeAlarm),
    page: opts.page,
    limit: opts.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / opts.limit)),
  };
}

export async function getAlarmDetail(opts: {
  alarmId: string;
  userId?: string;
  admin?: boolean;
}) {
  const alarm = await prisma.gpsAlarm.findUnique({
    where: { id: opts.alarmId },
    include: {
      terminal: true,
      serviceAppointment: true,
    },
  });
  if (!alarm) throw new AppError('Alarm not found', 404);

  // For non-admins, only return alarms whose owner matches.
  if (!opts.admin && alarm.ownerUserId !== opts.userId) {
    throw new AppError('Alarm not found', 404); // hide existence
  }
  return serializeAlarm(alarm);
}

interface AckInput {
  alarmId: string;
  /** When the actor is an admin, set this; mutually exclusive with userId. */
  adminId?: string;
  /** When the actor is a user, set this; mutually exclusive with adminId. */
  userId?: string;
  note?: string;
}

/**
 * Acknowledge an alarm. Idempotent — calling on an already-acked alarm just
 * returns it unchanged. The actor's id is recorded on the
 * acknowledgedByAdminId or acknowledgedByUserId column depending on scope.
 *
 * Owner-side ack is gated by ownerUserId match — a user can't ack another
 * user's alarm even if they somehow learn the id.
 */
export async function acknowledgeAlarm(input: AckInput) {
  const alarm = await prisma.gpsAlarm.findUnique({ where: { id: input.alarmId } });
  if (!alarm) throw new AppError('Alarm not found', 404);

  if (input.userId && alarm.ownerUserId !== input.userId) {
    throw new AppError('Alarm not found', 404);
  }

  if (alarm.acknowledged) return serializeAlarm(alarm); // idempotent

  const updated = await prisma.gpsAlarm.update({
    where: { id: input.alarmId },
    data: {
      acknowledged: true,
      acknowledgedAt: new Date(),
      acknowledgedByAdminId: input.adminId ?? null,
      acknowledgedByUserId: input.userId ?? null,
      ackNote: input.note ?? null,
    },
  });

  return serializeAlarm(updated);
}
