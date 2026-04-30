import { z } from 'zod';

export const appraisalValuationSchema = z.object({
  body: z.object({
    vin: z.string().min(11).max(17),
    year: z.number().int().min(1980).max(2030),
    make: z.string().min(1),
    model: z.string().min(1),
    trim: z.string().optional(),
    mileage: z.number().min(0),
    condition: z.enum(['clean', 'average', 'rough']),
    zipCode: z.string().max(10).optional(),
    notes: z.string().max(1000).optional(),
    // HIGH #12: the controller reads `vehicleOwnerName` off the body and
    // persists it on Appraisal.vehicleOwnerName. Declare it here so the
    // schema matches reality.
    vehicleOwnerName: z.string().max(120).optional(),
  }),
});

export const appraisalEmailSchema = z.object({
  body: z.object({
    toEmail: z.string().email(),
    appraisalData: z.object({
      appraisalId: z.string(),
      vehicle: z.object({
        vin: z.string(),
        year: z.number(),
        make: z.string(),
        model: z.string(),
        trim: z.string().optional(),
        mileage: z.number(),
      }),
      condition: z.enum(['clean', 'average', 'rough']),
      zipCode: z.string().optional(),
      notes: z.string().optional(),
      valuation: z.object({
        estimatedWholesaleLow: z.number(),
        estimatedWholesaleHigh: z.number(),
        estimatedTradeInLow: z.number(),
        estimatedTradeInHigh: z.number(),
        estimatedRetailLow: z.number(),
        estimatedRetailHigh: z.number(),
        estimatedPrivatePartyLow: z.number(),
        estimatedPrivatePartyHigh: z.number(),
        confidenceLevel: z.enum(['high', 'medium', 'low']),
        confidenceExplanation: z.string(),
        marketTrend: z.enum(['appreciating', 'stable', 'depreciating']),
        marketTrendExplanation: z.string(),
        comparableSources: z.array(z.object({
          sourceName: z.string(),
          wholesaleLow: z.number(),
          wholesaleHigh: z.number(),
          tradeInLow: z.number(),
          tradeInHigh: z.number(),
          retailLow: z.number(),
          retailHigh: z.number(),
          privatePartyLow: z.number(),
          privatePartyHigh: z.number(),
        })),
        adjustments: z.array(z.object({
          factor: z.string(),
          impact: z.number(),
          explanation: z.string(),
        })),
        aiSummary: z.string(),
        dataAsOf: z.string(),
      }),
      healthScore: z.number().optional(),
      diagnosticsSummary: z.string().optional(),
      photoCount: z.number(),
      photos: z.array(z.string()).optional(),
      createdAt: z.string(),
      userEmail: z.string(),
    }),
  }),
});

export const appraisalPdfSchema = z.object({
  body: z.object({
    toEmail: z.string().email(),
    appraisalData: z.object({
      appraisalId: z.string(),
      vehicle: z.object({
        vin: z.string(),
        year: z.number(),
        make: z.string(),
        model: z.string(),
        trim: z.string().optional(),
        mileage: z.number(),
      }),
      condition: z.enum(['clean', 'average', 'rough']),
      zipCode: z.string().optional(),
      notes: z.string().optional(),
      valuation: z.object({
        estimatedWholesaleLow: z.number(),
        estimatedWholesaleHigh: z.number(),
        estimatedTradeInLow: z.number(),
        estimatedTradeInHigh: z.number(),
        estimatedRetailLow: z.number(),
        estimatedRetailHigh: z.number(),
        estimatedPrivatePartyLow: z.number(),
        estimatedPrivatePartyHigh: z.number(),
        confidenceLevel: z.enum(['high', 'medium', 'low']),
        confidenceExplanation: z.string(),
        marketTrend: z.enum(['appreciating', 'stable', 'depreciating']),
        marketTrendExplanation: z.string(),
        comparableSources: z.array(z.object({
          sourceName: z.string(),
          wholesaleLow: z.number(),
          wholesaleHigh: z.number(),
          tradeInLow: z.number(),
          tradeInHigh: z.number(),
          retailLow: z.number(),
          retailHigh: z.number(),
          privatePartyLow: z.number(),
          privatePartyHigh: z.number(),
        })),
        adjustments: z.array(z.object({
          factor: z.string(),
          impact: z.number(),
          explanation: z.string(),
        })),
        aiSummary: z.string(),
        dataAsOf: z.string(),
      }),
      healthScore: z.number().optional(),
      diagnosticsSummary: z.string().optional(),
      photoCount: z.number(),
      photos: z.array(z.string()).optional(),
      createdAt: z.string(),
      userEmail: z.string(),
    }),
  }),
});

export const appraisalDashboardSchema = z.object({
  params: z.object({
    appraisalId: z.string().min(1),
  }),
});
