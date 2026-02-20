import { z } from 'zod';

export const aiDtcAnalysisSchema = z.object({
  code: z.string(),
  description: z.string(),
  module: z.string(),
  severity: z.enum(['critical', 'moderate', 'minor']),
  possibleCauses: z.array(z.string()),
  repair: z.object({
    description: z.string(),
    partsCost: z.number(),
    laborCost: z.number(),
  }),
  urgency: z.enum(['immediate', 'soon', 'monitor']),
});

export const aiEmissionsCheckSchema = z.object({
  status: z.enum(['pass', 'fail']),
  testsPassed: z.number().int(),
  testsFailed: z.number().int(),
  monitorStatusText: z.string(),
});

export const aiMileageRiskItemSchema = z.object({
  issue: z.string(),
  costEstimateLow: z.number(),
  costEstimateHigh: z.number(),
  mileageEstimate: z.number().int(),
});

export const aiAnalysisOutputSchema = z.object({
  dtcAnalysis: z.array(aiDtcAnalysisSchema),
  emissionsCheck: aiEmissionsCheckSchema,
  mileageRiskAssessment: z.array(aiMileageRiskItemSchema),
  modulesScanned: z.array(z.string()),
  datapointsScanned: z.number().int(),
  aiSummary: z.string(),
});

export type AiAnalysisOutputZod = z.infer<typeof aiAnalysisOutputSchema>;
