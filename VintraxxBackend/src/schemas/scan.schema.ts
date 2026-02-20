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
  }),
});

export const scanReportParamsSchema = z.object({
  params: z.object({
    scanId: z.string().uuid(),
  }),
});
