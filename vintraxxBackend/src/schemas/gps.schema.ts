/**
 * Zod request schemas for GPS endpoints (admin + dealer + user scopes).
 *
 * Validation runs via the shared `validateRequest` middleware
 * (`src/middleware/validateRequest.ts`). Every schema is shaped as
 * `{ body, query, params }` per that middleware's contract.
 */

import { z } from 'zod';

// ── Admin: terminal CRUD + assignment ────────────────────────────────────────

/** 15-digit IMEI per the JT/T 808 2019 spec. We allow 10..15 to support some
 * 2013-spec devices that still use a shorter SIM-MSISDN-derived identifier. */
const imeiSchema = z
  .string()
  .regex(/^\d{10,15}$/, 'IMEI must be 10–15 digits');

export const provisionTerminalSchema = z.object({
  body: z.object({
    imei: imeiSchema,
    phoneNumber: z.string().regex(/^\d{1,15}$/).optional(),
    iccid: z.string().min(1).max(32).optional(),
    manufacturerId: z.string().max(8).optional(),
    terminalModel: z.string().max(32).optional(),
    hardwareVersion: z.string().max(32).optional(),
    firmwareVersion: z.string().max(32).optional(),
    vehicleVin: z.string().regex(/^[A-HJ-NPR-Z0-9]{17}$/i).optional(),
    vehicleYear: z.number().int().min(1980).max(2100).optional(),
    vehicleMake: z.string().max(32).optional(),
    vehicleModel: z.string().max(64).optional(),
    nickname: z.string().max(64).optional(),
    /**
     * License plate (free-form). The Prisma model has been carrying this
     * field since the original migration but the schema was missing it,
     * causing the admin Provision modal's value to be silently stripped
     * by Zod before reaching the service. Capped at 16 to comfortably
     * cover any worldwide plate format including spaces and dashes.
     */
    plateNumber: z.string().max(16).optional(),
    ownerUserId: z.string().uuid().nullable().optional(),
  }),
});

export const reassignTerminalSchema = z.object({
  body: z.object({
    ownerUserId: z.string().uuid().nullable(),
  }),
  params: z.object({ id: z.string().uuid() }),
});

export const terminalIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const listTerminalsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50).optional(),
    filter: z.enum(['online', 'offline', 'unpaired', 'never_connected', 'revoked']).optional(),
    search: z.string().max(64).optional(),
    /** Admin-only: scope the list to a specific owner. Used by the
     *  UserDetailModal "GPS Devices" section. Validated UUID so a typo
     *  doesn't leak unbounded results. */
    ownerUserId: z.string().uuid().optional(),
  }),
});

// ── User: own fleet + location history ──────────────────────────────────────

/** ISO 8601 datetime, e.g. `2026-04-30T05:17:00.000Z`. */
const isoDateString = z.string().datetime({ offset: true });

export const locationHistoryQuerySchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  query: z.object({
    since: isoDateString.optional(),
    until: isoDateString.optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(5000).default(500).optional(),
    /** Optional minimum km/h filter for "show only where the car was actually moving". */
    minSpeedKmh: z.coerce.number().min(0).max(300).optional(),
  }),
});

export const userTerminalIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

// ── Phase 2: alarms + DTC events ─────────────────────────────────────────────

const isoDate = z.string().datetime({ offset: true });

export const listAlarmsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50).optional(),
    terminalId: z.string().uuid().optional(),
    severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional(),
    /**
     * Specific alarm type filter (admin console). The set is intentionally
     * loose-typed here because the Prisma enum changes occasionally and we
     * don't want a schema deploy to lag a backend deploy. The service layer
     * casts it to the GpsAlarmType enum.
     */
    alarmType: z.string().optional(),
    state: z.enum(['open', 'closed']).optional(),
    /** "true"/"false" string from query — we coerce manually in the controller. */
    ack: z.enum(['true', 'false']).optional(),
    /**
     * Admin-only convenience filter. Restricts results to terminals owned by
     * a single user. User-scoped routes ignore this (their userId already
     * scopes the query).
     */
    ownerUserId: z.string().uuid().optional(),
    /**
     * Free-text search across terminal.imei / terminal.vehicleVin /
     * owner.email. Admin-only; user-scoped routes ignore it.
     */
    search: z.string().min(1).max(200).optional(),
    since: isoDate.optional(),
    until: isoDate.optional(),
  }),
});

export const alarmIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const ackAlarmBodySchema = z.object({
  body: z.object({
    note: z.string().max(500).optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
});

export const listDtcEventsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50).optional(),
    terminalId: z.string().uuid().optional(),
    vin: z.string().regex(/^[A-HJ-NPR-Z0-9]{17}$/i).optional(),
    milOnly: z.enum(['true', 'false']).optional(),
    since: isoDate.optional(),
    until: isoDate.optional(),
  }),
});

export const dtcEventIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

// ── Phase 3: trips + daily stats ────────────────────────────────────────────

export const listTripsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50).optional(),
    terminalId: z.string().uuid().optional(),
    status: z.enum(['OPEN', 'CLOSED']).optional(),
    since: isoDate.optional(),
    until: isoDate.optional(),
  }),
});

export const tripIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

/**
 * Daily-stats range. We default to "last 30 days" when no `since` is given
 * so a naked GET behaves like a sensible mobile-dashboard request without
 * pulling all-history.
 */
export const dailyStatsQuerySchema = z.object({
  query: z.object({
    terminalId: z.string().uuid().optional(),
    since: isoDate.optional(),
    until: isoDate.optional(),
  }),
});

/**
 * User-scoped trip lookups always carry the terminal id in the URL so we can
 * enforce ownership at the route layer. Same shape as the location-history
 * params.
 */
export const userTerminalTripsParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50).optional(),
    status: z.enum(['OPEN', 'CLOSED']).optional(),
    since: isoDate.optional(),
    until: isoDate.optional(),
  }),
});

export const userTerminalTripDetailParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    tripId: z.string().uuid(),
  }),
});

export const userTerminalStatsParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  query: z.object({
    since: isoDate.optional(),
    until: isoDate.optional(),
  }),
});

// ── Phase 4: commands ───────────────────────────────────────────────────────

/**
 * Set-params item shape. `id` is a uint32 JT/T 808 parameter id (e.g. 0x0001
 * = heartbeat interval). `value` is either an integer that fits in uint32 or
 * a UTF-8 string ≤ 255 bytes — same constraints the codec enforces.
 */
const setParamsItemSchema = z.object({
  id: z.number().int().min(0).max(0xffffffff),
  value: z.union([
    z.number().int().min(0).max(0xffffffff),
    z.string().max(1024), // byte length re-checked in the service
  ]),
});

/**
 * POST /admin/gps/terminals/:id/commands body. Discriminated by `kind`.
 * - `locate`: no params; sends 0x8201
 * - `read-params`: no params; sends 0x8104
 * - `set-params`: `setParams` array required; sends 0x8103
 * - `clear-dtcs`: no params; sends 0x8900/0xF6
 */
export const enqueueCommandBodySchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('locate') }),
    z.object({ kind: z.literal('read-params') }),
    z.object({ kind: z.literal('clear-dtcs') }),
    z.object({
      kind: z.literal('set-params'),
      setParams: z.array(setParamsItemSchema).min(1).max(255),
    }),
    z.object({
      kind: z.literal('terminal-control'),
      // Allowed: 3 SHUTDOWN, 4 RESET, 5 FACTORY_RESET, 6 CLOSE_LINK, 7 OPEN_LINK.
      // 1 (firmware OTA) and 2 (server move) require structured params we
      // don't expose yet.
      controlType: z.union([
        z.literal(3),
        z.literal(4),
        z.literal(5),
        z.literal(6),
        z.literal(7),
      ]),
    }),
  ]),
});

export const listCommandsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50).optional(),
    terminalId: z.string().uuid().optional(),
    status: z.enum(['QUEUED', 'SENT', 'ACKED', 'FAILED', 'EXPIRED']).optional(),
    adminId: z.string().uuid().optional(),
    since: isoDate.optional(),
    until: isoDate.optional(),
  }),
});

export const commandIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

// ── Phase 5 (mobile): push tokens, owner actions, AI bridge ─────────────────

/**
 * Mobile push-token registration. Token strings can be long (FCM ≈ 200
 * chars, APNs is 64 hex). We allow up to 4096 to leave headroom for future
 * formats without forcing a schema change.
 */
export const registerPushTokenSchema = z.object({
  body: z.object({
    platform: z.enum(['ios', 'android']),
    token: z.string().min(10).max(4096),
    provider: z.enum(['fcm']).optional(),
    appVersion: z.string().max(64).optional(),
  }),
});

/** Logout-time soft-disable. Body-bound (not param) so the token never
 *  appears in URLs / nginx access logs. */
export const deletePushTokenSchema = z.object({
  body: z.object({
    token: z.string().min(10).max(4096),
  }),
});

/** Mobile rename of a terminal's nickname/label. Owner-only at the route. */
export const renameTerminalSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    nickname: z.string().min(1).max(64),
  }),
});

/** Owner-only "request live position" wrapper around a `locate` command. */
export const userLocateTerminalSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

/** Owner-only DTC-event → Scan promotion (AI bridge). */
export const userAnalyzeDtcEventSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
