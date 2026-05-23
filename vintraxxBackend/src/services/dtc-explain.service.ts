/**
 * dtc-explain — lightweight AI-powered DTC code explanation.
 *
 * Unlike the full scan pipeline (VIN decode → AI → PDF → email), this service
 * simply sends the DTC codes to OpenAI and returns human-readable explanations
 * with severity ratings and repair cost estimates. No Scan row is created, no
 * PDF is generated, and no email is sent.
 *
 * Used by the "Analyze with AI" button on the admin DTC Events page and the
 * mobile DTC event detail screen.
 */

import OpenAI from 'openai';
import { env } from '../config/env';
import { APP_CONSTANTS } from '../config/constants';
import logger from '../utils/logger';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

// ── Types ────────────────────────────────────────────────────────────────────

export interface DtcExplainInput {
  storedDtcCodes: string[];
  pendingDtcCodes: string[];
  permanentDtcCodes: string[];
  /** Optional vehicle context — improves cost accuracy when available. */
  vehicleYear?: number | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vin?: string | null;
}

export interface DtcExplanation {
  code: string;
  category: 'stored' | 'pending' | 'permanent';
  description: string;
  module: string;
  severity: 'critical' | 'moderate' | 'minor';
  urgency: 'immediate' | 'soon' | 'monitor';
  possibleCauses: string[];
  repair: {
    description: string;
    partsCost: number;
    laborCost: number;
  };
}

export interface DtcExplainResult {
  explanations: DtcExplanation[];
  aiSummary: string;
}

// ── JSON Schema for structured output ────────────────────────────────────────

const EXPLAIN_JSON_SCHEMA = {
  name: 'dtc_code_explanations',
  strict: true,
  schema: {
    type: 'object' as const,
    properties: {
      explanations: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            code: { type: 'string' as const },
            category: { type: 'string' as const, enum: ['stored', 'pending', 'permanent'] },
            description: { type: 'string' as const },
            module: { type: 'string' as const },
            severity: { type: 'string' as const, enum: ['critical', 'moderate', 'minor'] },
            urgency: { type: 'string' as const, enum: ['immediate', 'soon', 'monitor'] },
            possibleCauses: { type: 'array' as const, items: { type: 'string' as const } },
            repair: {
              type: 'object' as const,
              properties: {
                description: { type: 'string' as const },
                partsCost: { type: 'number' as const },
                laborCost: { type: 'number' as const },
              },
              required: ['description', 'partsCost', 'laborCost'],
              additionalProperties: false,
            },
          },
          required: ['code', 'category', 'description', 'module', 'severity', 'urgency', 'possibleCauses', 'repair'],
          additionalProperties: false,
        },
      },
      aiSummary: { type: 'string' as const },
    },
    required: ['explanations', 'aiSummary'],
    additionalProperties: false,
  },
};

const SYSTEM_PROMPT = `You are an expert automotive diagnostic analyst. You explain OBD-II Diagnostic Trouble Codes (DTCs) in clear, professional language.

For each DTC code provided:
1. DESCRIBE what the code means in plain language
2. IDENTIFY which vehicle module it belongs to (Engine, Transmission, ABS, Body Control Module, etc.)
3. RATE severity: "critical" (safety risk or causes further damage), "moderate" (affects performance, fix soon), "minor" (monitor, not urgent)
4. RATE urgency: "immediate" (fix now), "soon" (within 1-2 weeks), "monitor" (watch for changes)
5. LIST 2-4 possible root causes
6. RECOMMEND a specific repair with realistic 2024-2026 US market average costs for parts and labor

Rules:
- Costs must be realistic US market averages. If vehicle info is provided, tailor to that specific vehicle.
- Module names must be exact: "Engine", "Transmission", "Anti-lock Braking System", "Body Control Module", "Powertrain Control Module", etc.
- Repair descriptions must be specific and actionable
- Provide a brief overall summary of the vehicle's health situation`;

// ── Core function ────────────────────────────────────────────────────────────

function buildPrompt(input: DtcExplainInput): string {
  const vehicleStr =
    input.vehicleYear && input.vehicleMake && input.vehicleModel
      ? `${input.vehicleYear} ${input.vehicleMake} ${input.vehicleModel}`
      : 'Unknown Vehicle';

  const lines: string[] = [
    `Explain the following DTC codes detected on a vehicle:`,
    ``,
    `Vehicle: ${vehicleStr}`,
  ];
  if (input.vin) lines.push(`VIN: ${input.vin}`);
  lines.push('');

  if (input.storedDtcCodes.length > 0) {
    lines.push(`Stored DTCs: ${input.storedDtcCodes.join(', ')}`);
  }
  if (input.pendingDtcCodes.length > 0) {
    lines.push(`Pending DTCs: ${input.pendingDtcCodes.join(', ')}`);
  }
  if (input.permanentDtcCodes.length > 0) {
    lines.push(`Permanent DTCs: ${input.permanentDtcCodes.join(', ')}`);
  }

  lines.push('');
  lines.push('Provide explanations for each code with the category (stored/pending/permanent) it was found in.');

  return lines.join('\n');
}

export async function explainDtcCodes(input: DtcExplainInput): Promise<DtcExplainResult> {
  const allCodes = [
    ...input.storedDtcCodes,
    ...input.pendingDtcCodes,
    ...input.permanentDtcCodes,
  ];

  if (allCodes.length === 0) {
    return { explanations: [], aiSummary: 'No DTC codes to analyze.' };
  }

  const userPrompt = buildPrompt(input);

  logger.info('Calling OpenAI for DTC code explanation', {
    totalCodes: allCodes.length,
    stored: input.storedDtcCodes.length,
    pending: input.pendingDtcCodes.length,
    permanent: input.permanentDtcCodes.length,
  });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= APP_CONSTANTS.AI_MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        logger.info(`Retrying DTC explain call (attempt ${attempt + 1})`);
        await new Promise((resolve) => setTimeout(resolve, APP_CONSTANTS.AI_RETRY_DELAY_MS));
      }

      const response = await openai.chat.completions.create({
        model: env.OPENAI_MODEL,
        temperature: APP_CONSTANTS.AI_TEMPERATURE,
        max_tokens: APP_CONSTANTS.AI_MAX_TOKENS,
        response_format: {
          type: 'json_schema',
          json_schema: EXPLAIN_JSON_SCHEMA,
        },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI');

      const parsed = JSON.parse(content) as DtcExplainResult;

      logger.info('DTC explanation completed successfully', {
        explanationCount: parsed.explanations.length,
      });

      return parsed;
    } catch (error) {
      lastError = error as Error;
      logger.error(`DTC explain call failed (attempt ${attempt + 1})`, {
        error: (error as Error).message,
      });
    }
  }

  throw new Error(
    `DTC explanation failed after ${APP_CONSTANTS.AI_MAX_RETRIES + 1} attempts: ${lastError?.message}`,
  );
}
