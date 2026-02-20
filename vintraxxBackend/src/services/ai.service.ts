import OpenAI from 'openai';
import { env } from '../config/env';
import { APP_CONSTANTS, AI_SYSTEM_PROMPT } from '../config/constants';
import { AiAnalysisOutput } from '../types';
import { aiAnalysisOutputSchema } from '../schemas/ai-output.schema';
import logger from '../utils/logger';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const AI_JSON_SCHEMA = {
  name: 'vehicle_diagnostic_analysis',
  strict: true,
  schema: {
    type: 'object' as const,
    properties: {
      dtcAnalysis: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            code: { type: 'string' as const },
            description: { type: 'string' as const },
            module: { type: 'string' as const },
            severity: { type: 'string' as const, enum: ['critical', 'moderate', 'minor'] },
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
            urgency: { type: 'string' as const, enum: ['immediate', 'soon', 'monitor'] },
          },
          required: ['code', 'description', 'module', 'severity', 'possibleCauses', 'repair', 'urgency'],
          additionalProperties: false,
        },
      },
      emissionsCheck: {
        type: 'object' as const,
        properties: {
          status: { type: 'string' as const, enum: ['pass', 'fail'] },
          testsPassed: { type: 'integer' as const },
          testsFailed: { type: 'integer' as const },
          monitorStatusText: { type: 'string' as const },
        },
        required: ['status', 'testsPassed', 'testsFailed', 'monitorStatusText'],
        additionalProperties: false,
      },
      mileageRiskAssessment: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            issue: { type: 'string' as const },
            costEstimateLow: { type: 'number' as const },
            costEstimateHigh: { type: 'number' as const },
            mileageEstimate: { type: 'integer' as const },
          },
          required: ['issue', 'costEstimateLow', 'costEstimateHigh', 'mileageEstimate'],
          additionalProperties: false,
        },
      },
      modulesScanned: { type: 'array' as const, items: { type: 'string' as const } },
      datapointsScanned: { type: 'integer' as const },
      aiSummary: { type: 'string' as const },
    },
    required: ['dtcAnalysis', 'emissionsCheck', 'mileageRiskAssessment', 'modulesScanned', 'datapointsScanned', 'aiSummary'],
    additionalProperties: false,
  },
};

interface AiScanInput {
  vin: string;
  year: number | null;
  make: string | null;
  model: string | null;
  mileage: number | null;
  milOn: boolean;
  dtcCount: number;
  distanceSinceCleared: number | null;
  warmupsSinceCleared: number | null;
  storedDtcCodes: string[];
  pendingDtcCodes: string[];
  permanentDtcCodes: string[];
}

function buildUserPrompt(input: AiScanInput): string {
  const vehicleStr = input.year && input.make && input.model
    ? `${input.year} ${input.make} ${input.model}`
    : 'Unknown Vehicle';
  const mileageStr = input.mileage !== null ? `${input.mileage} miles` : 'Unknown';
  const distStr = input.distanceSinceCleared !== null ? `${input.distanceSinceCleared} miles` : 'Unknown';
  const warmupStr = input.warmupsSinceCleared !== null ? `${input.warmupsSinceCleared}` : 'Unknown';

  return `Analyze this vehicle diagnostic scan:

Vehicle: ${vehicleStr}
VIN: ${input.vin}
Current Mileage: ${mileageStr}
MIL (Check Engine Light): ${input.milOn ? 'ON' : 'OFF'}
DTC Count Reported: ${input.dtcCount}
Distance Since Codes Last Cleared: ${distStr}
Warmup Cycles Since Cleared: ${warmupStr}

Stored DTCs: ${input.storedDtcCodes.length > 0 ? input.storedDtcCodes.join(', ') : 'None'}
Pending DTCs: ${input.pendingDtcCodes.length > 0 ? input.pendingDtcCodes.join(', ') : 'None'}
Permanent DTCs: ${input.permanentDtcCodes.length > 0 ? input.permanentDtcCodes.join(', ') : 'None'}

Provide your complete analysis.`;
}

async function callOpenAI(userPrompt: string): Promise<AiAnalysisOutput> {
  const response = await openai.chat.completions.create({
    model: env.OPENAI_MODEL,
    temperature: APP_CONSTANTS.AI_TEMPERATURE,
    max_tokens: APP_CONSTANTS.AI_MAX_TOKENS,
    response_format: {
      type: 'json_schema',
      json_schema: AI_JSON_SCHEMA,
    },
    messages: [
      { role: 'system', content: AI_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  const parsed = JSON.parse(content);
  return parsed as AiAnalysisOutput;
}

export async function analyzeWithAI(input: AiScanInput): Promise<AiAnalysisOutput> {
  const userPrompt = buildUserPrompt(input);

  logger.info('Calling OpenAI for vehicle diagnostic analysis', {
    vin: input.vin,
    dtcCount: input.dtcCount,
  });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= APP_CONSTANTS.AI_MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        logger.info(`Retrying OpenAI call (attempt ${attempt + 1})`);
        await new Promise((resolve) => setTimeout(resolve, APP_CONSTANTS.AI_RETRY_DELAY_MS));
      }

      const result = await callOpenAI(userPrompt);

      const validated = aiAnalysisOutputSchema.parse(result);
      logger.info('OpenAI analysis completed successfully', {
        dtcCount: validated.dtcAnalysis.length,
        emissionsStatus: validated.emissionsCheck.status,
      });

      return validated;
    } catch (error) {
      lastError = error as Error;
      logger.error(`OpenAI call failed (attempt ${attempt + 1})`, {
        error: (error as Error).message,
      });
    }
  }

  throw new Error(`AI analysis failed after ${APP_CONSTANTS.AI_MAX_RETRIES + 1} attempts: ${lastError?.message}`);
}
