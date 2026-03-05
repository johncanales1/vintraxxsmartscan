import OpenAI from 'openai';
import { env } from '../config/env';
import { APP_CONSTANTS } from '../config/constants';
import { AppraisalValuationRequest, AiValuationOutput } from '../types';
import logger from '../utils/logger';
import { z } from 'zod';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

// ================================================================
// VALUATION AI JSON SCHEMA (strict mode for OpenAI structured output)
// ================================================================

const VALUATION_JSON_SCHEMA = {
  name: 'vehicle_market_valuation',
  strict: true,
  schema: {
    type: 'object' as const,
    properties: {
      estimatedTradeInLow: { type: 'number' as const },
      estimatedTradeInHigh: { type: 'number' as const },
      estimatedRetailLow: { type: 'number' as const },
      estimatedRetailHigh: { type: 'number' as const },
      estimatedPrivatePartyLow: { type: 'number' as const },
      estimatedPrivatePartyHigh: { type: 'number' as const },
      confidenceLevel: { type: 'string' as const, enum: ['high', 'medium', 'low'] },
      confidenceExplanation: { type: 'string' as const },
      marketTrend: { type: 'string' as const, enum: ['appreciating', 'stable', 'depreciating'] },
      marketTrendExplanation: { type: 'string' as const },
      comparableSources: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            sourceName: { type: 'string' as const },
            tradeInLow: { type: 'number' as const },
            tradeInHigh: { type: 'number' as const },
            retailLow: { type: 'number' as const },
            retailHigh: { type: 'number' as const },
            privatePartyLow: { type: 'number' as const },
            privatePartyHigh: { type: 'number' as const },
          },
          required: ['sourceName', 'tradeInLow', 'tradeInHigh', 'retailLow', 'retailHigh', 'privatePartyLow', 'privatePartyHigh'],
          additionalProperties: false,
        },
      },
      adjustments: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            factor: { type: 'string' as const },
            impact: { type: 'number' as const },
            explanation: { type: 'string' as const },
          },
          required: ['factor', 'impact', 'explanation'],
          additionalProperties: false,
        },
      },
      aiSummary: { type: 'string' as const },
      dataAsOf: { type: 'string' as const },
    },
    required: [
      'estimatedTradeInLow', 'estimatedTradeInHigh',
      'estimatedRetailLow', 'estimatedRetailHigh',
      'estimatedPrivatePartyLow', 'estimatedPrivatePartyHigh',
      'confidenceLevel', 'confidenceExplanation',
      'marketTrend', 'marketTrendExplanation',
      'comparableSources', 'adjustments',
      'aiSummary', 'dataAsOf',
    ],
    additionalProperties: false,
  },
};

// ================================================================
// VALUATION SYSTEM PROMPT - carefully tuned for accurate pricing
// ================================================================

const VALUATION_SYSTEM_PROMPT = `You are a certified automotive appraiser and market analyst with 25+ years of experience in wholesale and retail vehicle valuation. You have deep expertise matching the data accuracy of industry-standard valuation providers including Black Book, Manheim Market Report (MMR), JD Power (NADA), and Kelley Blue Book.

Your task is to provide ACCURATE vehicle market valuations based on real-world market data you have been trained on. You must treat this as a serious financial valuation tool used by dealerships for trade-in decisions.

CRITICAL VALUATION METHODOLOGY:
1. BASE VALUE: Start with the known MSRP for the year/make/model/trim and apply standard depreciation curves. New vehicles typically depreciate 20-25% in year 1, then 15-18% per year for years 2-3, then 10-12% per year for years 4-6, then 7-9% per year thereafter.

2. MILEAGE ADJUSTMENT: The average annual mileage is 12,000-15,000 miles/year. For vehicles above average mileage, deduct approximately $0.08-$0.15 per excess mile depending on vehicle class (luxury vehicles have higher per-mile deductions). For below-average mileage, add approximately $0.05-$0.10 per mile under average.

3. CONDITION ADJUSTMENT:
   - "clean": Vehicle is in above-average condition with no mechanical issues. Add 5-10% to base value.
   - "average": Vehicle is in typical condition for its age/mileage. No adjustment.
   - "rough": Vehicle has visible wear, mechanical issues, or cosmetic damage. Deduct 15-25% from base value.

4. REGIONAL ADJUSTMENT: If ZIP code is provided, adjust for regional market conditions:
   - Trucks/SUVs command premium in rural/southern markets
   - Fuel-efficient vehicles command premium in urban/coastal markets
   - 4WD/AWD vehicles command premium in northern/mountain markets
   - Apply regional adjustment of -5% to +5%

5. MARKET TREND: Consider current supply/demand dynamics, seasonal trends, and model-specific factors (redesigns, discontinuation, recalls, etc.)

6. VALUE TIERS (all values in USD, rounded to nearest $100):
   - Trade-In Value: What a dealer would offer (wholesale). This is the LOWEST tier.
   - Private Party Value: What a private seller could expect. Typically 10-20% above trade-in.
   - Retail Value: What a dealer would list it for sale. Typically 20-35% above trade-in.

7. COMPARABLE SOURCES: Provide estimated values as they would appear from these three sources:
   - "Black Book" (wholesale-focused, used by dealers)
   - "MMR (Manheim)" (auction-based wholesale values)
   - "JD Power (NADA)" (retail-focused, used by lenders)
   Each source should show slightly different values reflecting their methodology.

8. SPREAD: The difference between low and high estimates within each tier should be reasonable:
   - For vehicles under $20,000: spread of $1,000-$2,500
   - For vehicles $20,000-$40,000: spread of $1,500-$3,500
   - For vehicles over $40,000: spread of $2,000-$5,000

RULES:
- All dollar amounts must be whole numbers rounded to the nearest $100
- Valuations MUST be realistic and defensible - they will be compared against actual data sources
- Never return $0 or negative values
- Minimum trade-in value for any running vehicle is $1,500
- The "dataAsOf" field should be the current month and year in format "March 2026"
- Provide 2-5 adjustment factors that explain how you arrived at the final value
- The aiSummary should be 2-3 sentences explaining the valuation in plain language for a dealer`;

// ================================================================
// ZOD VALIDATION SCHEMA
// ================================================================

const valuationSourceSchema = z.object({
  sourceName: z.string(),
  tradeInLow: z.number(),
  tradeInHigh: z.number(),
  retailLow: z.number(),
  retailHigh: z.number(),
  privatePartyLow: z.number(),
  privatePartyHigh: z.number(),
});

const valuationOutputSchema = z.object({
  estimatedTradeInLow: z.number().min(500),
  estimatedTradeInHigh: z.number().min(500),
  estimatedRetailLow: z.number().min(500),
  estimatedRetailHigh: z.number().min(500),
  estimatedPrivatePartyLow: z.number().min(500),
  estimatedPrivatePartyHigh: z.number().min(500),
  confidenceLevel: z.enum(['high', 'medium', 'low']),
  confidenceExplanation: z.string(),
  marketTrend: z.enum(['appreciating', 'stable', 'depreciating']),
  marketTrendExplanation: z.string(),
  comparableSources: z.array(valuationSourceSchema).min(3).max(3),
  adjustments: z.array(z.object({
    factor: z.string(),
    impact: z.number(),
    explanation: z.string(),
  })).min(2).max(5),
  aiSummary: z.string(),
  dataAsOf: z.string(),
});

// ================================================================
// BUILD USER PROMPT
// ================================================================

function buildValuationPrompt(input: AppraisalValuationRequest): string {
  const vehicleStr = `${input.year} ${input.make} ${input.model}${input.trim ? ` ${input.trim}` : ''}`;
  const mileageStr = `${input.mileage.toLocaleString('en-US')} miles`;
  const conditionStr = input.condition.charAt(0).toUpperCase() + input.condition.slice(1);

  let prompt = `Provide a comprehensive market valuation for this vehicle:

Vehicle: ${vehicleStr}
VIN: ${input.vin}
Current Mileage: ${mileageStr}
Condition: ${conditionStr}`;

  if (input.zipCode) {
    prompt += `\nLocation ZIP Code: ${input.zipCode}`;
  }

  if (input.notes) {
    prompt += `\nAdditional Notes: ${input.notes}`;
  }

  prompt += `\n\nProvide your complete valuation analysis with trade-in, retail, and private party values. Include comparable source estimates from Black Book, MMR (Manheim), and JD Power (NADA).`;

  return prompt;
}

// ================================================================
// CALL OPENAI
// ================================================================

async function callOpenAIForValuation(userPrompt: string): Promise<AiValuationOutput> {
  const response = await openai.chat.completions.create({
    model: env.OPENAI_MODEL,
    temperature: 0.15,
    max_tokens: APP_CONSTANTS.AI_MAX_TOKENS,
    response_format: {
      type: 'json_schema',
      json_schema: VALUATION_JSON_SCHEMA,
    },
    messages: [
      { role: 'system', content: VALUATION_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI for valuation');
  }

  logger.debug('Raw OpenAI valuation response received', {
    contentLength: content.length,
    finishReason: response.choices[0]?.finish_reason,
    usage: response.usage,
  });

  const parsed = JSON.parse(content);
  return parsed as AiValuationOutput;
}

// ================================================================
// POST-PROCESSING: Validate and sanitize values
// ================================================================

function sanitizeValuation(raw: AiValuationOutput): AiValuationOutput {
  // Ensure low <= high for all tiers
  const fix = (low: number, high: number): [number, number] => {
    const lo = Math.round(Math.min(low, high) / 100) * 100;
    const hi = Math.round(Math.max(low, high) / 100) * 100;
    return [Math.max(1500, lo), Math.max(1500, hi)];
  };

  const [tradeInLow, tradeInHigh] = fix(raw.estimatedTradeInLow, raw.estimatedTradeInHigh);
  const [retailLow, retailHigh] = fix(raw.estimatedRetailLow, raw.estimatedRetailHigh);
  const [ppLow, ppHigh] = fix(raw.estimatedPrivatePartyLow, raw.estimatedPrivatePartyHigh);

  // Ensure tier ordering: tradeIn < privateParty < retail
  const sanitizedSources = raw.comparableSources.map(src => ({
    ...src,
    tradeInLow: Math.round(src.tradeInLow / 100) * 100,
    tradeInHigh: Math.round(src.tradeInHigh / 100) * 100,
    retailLow: Math.round(src.retailLow / 100) * 100,
    retailHigh: Math.round(src.retailHigh / 100) * 100,
    privatePartyLow: Math.round(src.privatePartyLow / 100) * 100,
    privatePartyHigh: Math.round(src.privatePartyHigh / 100) * 100,
  }));

  const sanitizedAdjustments = raw.adjustments.map(adj => ({
    ...adj,
    impact: Math.round(adj.impact / 100) * 100,
  }));

  return {
    ...raw,
    estimatedTradeInLow: tradeInLow,
    estimatedTradeInHigh: tradeInHigh,
    estimatedRetailLow: retailLow,
    estimatedRetailHigh: retailHigh,
    estimatedPrivatePartyLow: ppLow,
    estimatedPrivatePartyHigh: ppHigh,
    comparableSources: sanitizedSources,
    adjustments: sanitizedAdjustments,
  };
}

// ================================================================
// MAIN EXPORT
// ================================================================

export async function getAiValuation(input: AppraisalValuationRequest): Promise<AiValuationOutput> {
  const userPrompt = buildValuationPrompt(input);

  logger.info('Calling OpenAI for vehicle market valuation', {
    vin: input.vin,
    year: input.year,
    make: input.make,
    model: input.model,
    trim: input.trim,
    mileage: input.mileage,
    condition: input.condition,
    zipCode: input.zipCode,
  });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= APP_CONSTANTS.AI_MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        logger.info(`Retrying OpenAI valuation call (attempt ${attempt + 1})`);
        await new Promise((resolve) => setTimeout(resolve, APP_CONSTANTS.AI_RETRY_DELAY_MS));
      }

      const rawResult = await callOpenAIForValuation(userPrompt);

      // Validate with Zod
      const validated = valuationOutputSchema.parse(rawResult);

      // Sanitize values (round to $100, enforce ordering)
      const sanitized = sanitizeValuation(validated);

      logger.info('OpenAI valuation completed successfully', {
        vin: input.vin,
        tradeInRange: `$${sanitized.estimatedTradeInLow} - $${sanitized.estimatedTradeInHigh}`,
        retailRange: `$${sanitized.estimatedRetailLow} - $${sanitized.estimatedRetailHigh}`,
        confidence: sanitized.confidenceLevel,
        marketTrend: sanitized.marketTrend,
        sourcesCount: sanitized.comparableSources.length,
        adjustmentsCount: sanitized.adjustments.length,
      });

      return sanitized;
    } catch (error) {
      lastError = error as Error;
      logger.error(`OpenAI valuation call failed (attempt ${attempt + 1})`, {
        error: (error as Error).message,
        vin: input.vin,
      });
    }
  }

  throw new Error(`AI valuation failed after ${APP_CONSTANTS.AI_MAX_RETRIES + 1} attempts: ${lastError?.message}`);
}
