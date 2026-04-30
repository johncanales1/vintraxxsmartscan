/**
 * inspection.schema — Zod validators for /api/v1/inspection/*.
 *
 * MEDIUM #22: previously the inspection routes had no input validation —
 * the controller blindly accepted any JSON body. Adding schemas here makes
 * the contract explicit (and the audit log meaningful).
 *
 * `ratings` and `damageMarks` stay loose (`record/array of unknown`) because
 * the mobile app evolves their shape independently and the columns are
 * Json-typed in Prisma. The cap at JSON-string length 50 KB is enforced via
 * the global `express.json({ limit: '50mb' })` and a per-field `.refine` on
 * deeply nested arrays would be a maintenance burden.
 */

import { z } from 'zod';

export const createInspectionSchema = z.object({
  body: z.object({
    /** Free-form vehicle description e.g. "2019 Toyota Camry SE Black". */
    vehicleInfo: z.string().max(200).optional(),
    /** Stored as plain string (no regex) — older inspection rows include
     *  partial / non-canonical VINs that we don't want to reject here. */
    vin: z.string().max(32).optional(),
    /** Mileage is a STRING column on Prisma to preserve user-entered
     *  formatting like "12,500 mi". Cap at 32 chars. */
    mileage: z.string().max(32).optional(),
    color: z.string().max(64).optional(),
    inspector: z.string().max(120).optional(),
    /** Date as a free-form display string ("Jan 5, 2026") — server
     *  doesn't parse it, only stores. Cap at 64. */
    date: z.string().max(64).optional(),
    /** Free-shape JSON object. The mobile app's UI maps category → score. */
    ratings: z.record(z.unknown()).optional(),
    /** Free-shape JSON array of damage-marker objects. */
    damageMarks: z.array(z.unknown()).optional(),
  }),
});

export const inspectionIdParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid inspection id'),
  }),
});
