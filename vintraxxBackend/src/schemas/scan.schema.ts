import { z } from 'zod';

export const scanSubmissionSchema = z.object({
  body: z.object({
    vin: z.string().min(11).max(17),
    mileage: z.number().nullable(),
    milStatus: z.object({
      milOn: z.boolean(),
      dtcCount: z.number().int().min(0),
      byEcu: z.record(z.object({
        milOn: z.boolean(),
        dtcCount: z.number().int().min(0),
      })).optional(),
    }),
    storedDtcCodes: z.array(z.string()),
    pendingDtcCodes: z.array(z.string()),
    permanentDtcCodes: z.array(z.string()),
    distanceSinceCleared: z.number().nullable(),
    timeSinceCleared: z.number().nullable(),
    warmupsSinceCleared: z.number().int().nullable(),
    distanceWithMILOn: z.number().nullable(),
    fuelSystemStatus: z.object({
      system1: z.number(),
      system2: z.number(),
    }).nullable(),
    secondaryAirStatus: z.number().int().nullable(),
    scanDate: z.string().datetime(),
    stockNumber: z.string().optional(),
    additionalRepairs: z.array(z.string()).optional(),
    scannerDeviceId: z.string().optional(),
    // HIGH #12: the controller already destructures these fields and writes
    // them to Scan.userFullName / Scan.vehicleOwnerName. Declaring them here
    // keeps the schema authoritative and prevents accidental data loss if
    // anyone tightens validation to .strict() later.
    userFullName: z.string().max(120).optional(),
    vehicleOwnerName: z.string().max(120).optional(),
  }),
});

export const scanReportParamsSchema = z.object({
  params: z.object({
    scanId: z.string().uuid(),
  }),
});
