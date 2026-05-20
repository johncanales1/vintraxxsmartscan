/**
 * gps-bulk-delete.service — admin-only bulk DELETE helpers for the GPS
 * Telemetry surface.
 *
 * Each function takes an array of row ids and issues a single
 * `prisma.<model>.deleteMany({ where: { id: { in: ids } } })`. The Zod schema
 * upstream caps `ids.length ≤ 1000`, so even a worst-case bulk fits in one
 * round-trip without exceeding the Postgres parameter limit.
 *
 * Failure modes:
 *   - `ids` empty → returns `{ deleted: 0 }` without hitting the DB.
 *   - Some ids don't exist → silently skipped by `deleteMany`; we report
 *     the actual delete count, which the UI surfaces in the toast.
 *   - DB-level cascade rules in `schema.prisma` (`onDelete: Cascade` on the
 *     parent → child relations) handle child rows automatically. We do NOT
 *     manually cascade here.
 *
 * NOT exposed on user-scoped routes — the controller wires these up under
 * `/admin/gps/<resource>/bulk-delete` only, behind `requireSuperAdmin`.
 */

import prisma from '../config/db';

export interface BulkDeleteResult {
  /** Actual number of rows deleted. May be < ids.length if some didn't exist. */
  deleted: number;
}

/** No-op shortcut so callers don't have to repeat the empty-array guard. */
function emptyResult(): BulkDeleteResult {
  return { deleted: 0 };
}

export async function bulkDeleteLocations(ids: string[]): Promise<BulkDeleteResult> {
  if (ids.length === 0) return emptyResult();
  const r = await prisma.gpsLocation.deleteMany({ where: { id: { in: ids } } });
  return { deleted: r.count };
}

export async function bulkDeleteObd(ids: string[]): Promise<BulkDeleteResult> {
  if (ids.length === 0) return emptyResult();
  const r = await prisma.gpsObdSnapshot.deleteMany({ where: { id: { in: ids } } });
  return { deleted: r.count };
}

export async function bulkDeleteAlarms(ids: string[]): Promise<BulkDeleteResult> {
  if (ids.length === 0) return emptyResult();
  const r = await prisma.gpsAlarm.deleteMany({ where: { id: { in: ids } } });
  return { deleted: r.count };
}

export async function bulkDeleteDtcEvents(ids: string[]): Promise<BulkDeleteResult> {
  if (ids.length === 0) return emptyResult();
  // Cascades to promoted Scan rows via the FK ON DELETE rules in schema.prisma.
  const r = await prisma.gpsDtcEvent.deleteMany({ where: { id: { in: ids } } });
  return { deleted: r.count };
}

export async function bulkDeleteTrips(ids: string[]): Promise<BulkDeleteResult> {
  if (ids.length === 0) return emptyResult();
  const r = await prisma.gpsTrip.deleteMany({ where: { id: { in: ids } } });
  return { deleted: r.count };
}

export async function bulkDeleteCommands(ids: string[]): Promise<BulkDeleteResult> {
  if (ids.length === 0) return emptyResult();
  const r = await prisma.gpsCommand.deleteMany({ where: { id: { in: ids } } });
  return { deleted: r.count };
}

/**
 * Bulk terminal delete. Each terminal row cascades to its locations / OBD /
 * alarms / DTC events / trips / commands / dailyStats via `onDelete: Cascade`
 * declared on the schema relations. Single SQL statement, atomic per row,
 * not per batch — partial failure (FK violation against a NOT-cascading FK
 * we may add later) returns the count actually removed.
 */
export async function bulkDeleteTerminals(ids: string[]): Promise<BulkDeleteResult> {
  if (ids.length === 0) return emptyResult();
  const r = await prisma.gpsTerminal.deleteMany({ where: { id: { in: ids } } });
  return { deleted: r.count };
}

export async function bulkDeleteScanReports(ids: string[]): Promise<BulkDeleteResult> {
  if (ids.length === 0) return emptyResult();
  const r = await prisma.gpsScanReport.deleteMany({ where: { id: { in: ids } } });
  return { deleted: r.count };
}
