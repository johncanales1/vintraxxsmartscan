/**
 * gps-admin.schema — Zod schemas for the new admin-only GPS endpoints
 * added on top of the existing `gps.schema.ts`. Kept in a separate file so
 * the user-scoped + admin-shared schemas don't have to import these.
 *
 * Endpoints validated here:
 *   GET    /admin/gps/terminals/:id/latest
 *   GET    /admin/gps/terminals/:id/locations
 *   GET    /admin/gps/terminals/:id/obd
 *   POST   /admin/gps/dtc-events/:id/analyze
 *   POST   /admin/gps/alarms/ack-bulk
 *   GET    /admin/audit-logs
 *
 * The `?ownerUserId=` filter on `GET /admin/gps/terminals` reuses the
 * existing `listTerminalsQuerySchema` extended in-place — see
 * `gps.schema.ts` modifications.
 */

import { z } from 'zod';

const isoDate = z.string().datetime({ offset: true });

export const adminTerminalLocationsQuerySchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  query: z.object({
    since: isoDate.optional(),
    until: isoDate.optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(5000).default(500).optional(),
    minSpeedKmh: z.coerce.number().min(0).max(300).optional(),
  }),
});

export const adminTerminalObdQuerySchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  query: z.object({
    since: isoDate.optional(),
    until: isoDate.optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(2000).default(500).optional(),
  }),
});

export const adminAnalyzeDtcEventSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const adminBulkAckAlarmsSchema = z.object({
  body: z.object({
    ids: z.array(z.string().uuid()).min(1).max(500),
    note: z.string().max(500).optional(),
  }),
});

export const adminListAuditLogsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50).optional(),
    adminId: z.string().uuid().optional(),
    targetType: z.string().max(64).optional(),
    targetId: z.string().max(128).optional(),
    /** Substring match on the `action` column (e.g. "POST /admin/gps"). */
    action: z.string().max(128).optional(),
    /** Filter by HTTP status code class (e.g. 2 → 200..299). */
    statusClass: z.coerce.number().int().min(1).max(5).optional(),
    since: isoDate.optional(),
    until: isoDate.optional(),
  }),
});
