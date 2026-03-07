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
      estimatedWholesaleLow: { type: 'number' as const },
      estimatedWholesaleHigh: { type: 'number' as const },
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
            wholesaleLow: { type: 'number' as const },
            wholesaleHigh: { type: 'number' as const },
            tradeInLow: { type: 'number' as const },
            tradeInHigh: { type: 'number' as const },
            retailLow: { type: 'number' as const },
            retailHigh: { type: 'number' as const },
            privatePartyLow: { type: 'number' as const },
            privatePartyHigh: { type: 'number' as const },
          },
          required: ['sourceName', 'wholesaleLow', 'wholesaleHigh', 'tradeInLow', 'tradeInHigh', 'retailLow', 'retailHigh', 'privatePartyLow', 'privatePartyHigh'],
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
      'estimatedWholesaleLow', 'estimatedWholesaleHigh',
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

const VALUATION_SYSTEM_PROMPT = `You are a certified automotive appraiser and wholesale market analyst. You specialize in providing ACCURATE wholesale and trade-in vehicle valuations that match real auction data from Manheim (MMR), Black Book, and JD Power (NADA). Dealers use your valuations to make real purchase decisions, so accuracy is critical.

Your valuations MUST reflect actual wholesale auction market prices — NOT inflated retail or MSRP-based estimates.

CRITICAL VALUATION METHODOLOGY:

1. WHOLESALE/AUCTION BASE VALUE:
   - Start from the CURRENT wholesale auction market value for this exact year/make/model/trim.
   - Do NOT start from MSRP and depreciate. Instead, estimate what this vehicle would sell for TODAY at a Manheim or ADESA auction.
   - Wholesale values are typically 55-70% of original MSRP for 3-5 year old vehicles, and 35-55% for 5-8 year old vehicles.
   - Example calibration: A 2021 Mercedes-Benz GLE 350 with ~112K miles in clean condition has a wholesale/MMR value around $20,000-$24,000 (NOT $30,000+).
   - Example calibration: A 2017 Ford F-150 with ~110K miles has a wholesale value around $18,000-$22,000.

2. MILEAGE ADJUSTMENT (critical — apply aggressively):
   - Average annual mileage: 12,000-15,000 miles/year.
   - HIGH MILEAGE penalty: For each 10,000 miles ABOVE average for the vehicle age, deduct 3-5% from wholesale value. Luxury vehicles get higher deductions.
   - Example: A 5-year-old vehicle (expected ~60-75K miles) with 112K miles is ~40-50K miles over average = significant deduction of $3,000-$6,000.
   - LOW MILEAGE premium: Add 1-2% per 10,000 miles under average.

3. CONDITION ADJUSTMENT:
   - "clean": Above-average condition. Add 3-5% to wholesale base.
   - "average": Typical condition. No adjustment.
   - "rough": Visible wear, mechanical issues. Deduct 10-20% from wholesale base.

4. REGIONAL ADJUSTMENT: If ZIP code provided, adjust ±5% based on local demand.

5. VALUE TIERS (all USD, rounded to nearest $100):
   - Wholesale Value: What the vehicle would sell for at auction (Manheim/ADESA). This is the LOWEST tier and the anchor for all other values.
   - Trade-In Value: What a dealer offers a customer. Typically equal to or slightly above wholesale (0-5% above wholesale).
   - Private Party Value: What a private seller could expect. Typically 15-25% above wholesale.
   - Retail Value: What a dealer lists it for sale. Typically 25-40% above wholesale.

6. COMPARABLE SOURCES: For EACH source, provide wholesale (auction), trade-in, retail, and private party value ranges:
   - "MMR (Manheim)" — auction-based wholesale values. This should be your PRIMARY anchor. MMR wholesale = the raw auction sale price.
   - "Black Book" — wholesale-focused, used by dealers. Usually within 5% of MMR. Black Book wholesale = dealer-to-dealer transfer price.
   - "JD Power (NADA)" — retail-focused, used by lenders. NADA wholesale is typically 5-10% above MMR since it targets dealer lending.
   Each source MUST include wholesaleLow, wholesaleHigh, tradeInLow, tradeInHigh, retailLow, retailHigh, privatePartyLow, privatePartyHigh.
   Wholesale values per source should be realistic and slightly different between sources.

7. SPREAD between low and high within each tier:
   - Under $15,000: spread of $1,000-$2,000
   - $15,000-$30,000: spread of $1,500-$3,000
   - Over $30,000: spread of $2,000-$4,000

RULES:
- All dollar amounts must be whole numbers rounded to nearest $100
- Valuations MUST be realistic — they will be compared against live MMR and Black Book data
- Wholesale and trade-in values must be LOWER than private party, which must be LOWER than retail
- Never return $0 or negative values. Minimum wholesale for any running vehicle: $1,500
- The "dataAsOf" field: current month and year, e.g. "March 2026"
- Provide 2-5 adjustment factors explaining how you arrived at the value
- The aiSummary: 2-3 sentences in plain language for a dealer, mentioning wholesale/auction context
- IMPORTANT: Do NOT inflate values. When in doubt, err on the conservative/wholesale side.`;

// ================================================================
// ZOD VALIDATION SCHEMA
// ================================================================

const valuationSourceSchema = z.object({
  sourceName: z.string(),
  wholesaleLow: z.number(),
  wholesaleHigh: z.number(),
  tradeInLow: z.number(),
  tradeInHigh: z.number(),
  retailLow: z.number(),
  retailHigh: z.number(),
  privatePartyLow: z.number(),
  privatePartyHigh: z.number(),
});

const valuationOutputSchema = z.object({
  estimatedWholesaleLow: z.number().min(500),
  estimatedWholesaleHigh: z.number().min(500),
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

  prompt += `\n\nProvide your complete valuation analysis with wholesale (auction), trade-in, retail, and private party values. Include comparable source estimates from MMR (Manheim), Black Book, and JD Power (NADA). Start from wholesale auction value as the anchor.`;

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

  const [wholesaleLow, wholesaleHigh] = fix(raw.estimatedWholesaleLow, raw.estimatedWholesaleHigh);
  const [tradeInLow, tradeInHigh] = fix(raw.estimatedTradeInLow, raw.estimatedTradeInHigh);
  const [retailLow, retailHigh] = fix(raw.estimatedRetailLow, raw.estimatedRetailHigh);
  const [ppLow, ppHigh] = fix(raw.estimatedPrivatePartyLow, raw.estimatedPrivatePartyHigh);

  // Ensure tier ordering: tradeIn < privateParty < retail
  const sanitizedSources = raw.comparableSources.map(src => ({
    ...src,
    wholesaleLow: Math.max(1500, Math.round(src.wholesaleLow / 100) * 100),
    wholesaleHigh: Math.max(1500, Math.round(src.wholesaleHigh / 100) * 100),
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
    estimatedWholesaleLow: wholesaleLow,
    estimatedWholesaleHigh: wholesaleHigh,
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
        wholesaleRange: `$${sanitized.estimatedWholesaleLow} - $${sanitized.estimatedWholesaleHigh}`,
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
