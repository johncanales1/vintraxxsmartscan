import OpenAI from 'openai';
import { env } from '../config/env';
import { AdditionalRepairItem } from '../types';
import logger from '../utils/logger';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const ADDITIONAL_REPAIR_TYPES = [
  'Tire Inspection & Replacement',
  'Battery Diagnostics & Replacement',
  'Windshield Replacement Services',
  'Windshield Chip & Crack Repair',
  'Interior & Exterior Detailing',
  'Auto Body & Collision Repair',
  'Interior Odor Elimination',
  'Seat & Upholstery Restoration',
  'Missing Spare Key',
];

const AI_ADDITIONAL_REPAIRS_SCHEMA = {
  name: 'additional_repairs_estimate',
  strict: true,
  schema: {
    type: 'object' as const,
    properties: {
      repairs: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            name: { type: 'string' as const },
            description: { type: 'string' as const },
            laborHours: { type: 'number' as const },
            partsCost: { type: 'number' as const },
          },
          required: ['name', 'description', 'laborHours', 'partsCost'],
          additionalProperties: false,
        },
      },
    },
    required: ['repairs'],
    additionalProperties: false,
  },
};

interface AdditionalRepairsInput {
  selectedRepairs: string[];
  year: number | null;
  make: string | null;
  model: string | null;
  pricePerLaborHour: number;
}

function buildAdditionalRepairsPrompt(input: AdditionalRepairsInput): string {
  const vehicleStr = input.year && input.make && input.model
    ? `${input.year} ${input.make} ${input.model}`
    : 'a standard vehicle';

  return `You are an expert automotive repair cost estimator. Estimate the labor hours and parts cost for the following additional repairs on ${vehicleStr}.

For each repair, provide:
- name: The repair name exactly as given
- description: A brief description of the work involved
- laborHours: Estimated labor hours (as a decimal number, e.g., 1.5)
- partsCost: Estimated parts/materials cost in USD (as a number)

The labor rate will be applied separately, so only provide labor HOURS, not labor cost.

Repairs to estimate:
${input.selectedRepairs.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Provide realistic 2024-2026 US market average estimates specific to the vehicle. Be accurate and professional.`;
}

export async function analyzeAdditionalRepairs(input: AdditionalRepairsInput): Promise<AdditionalRepairItem[]> {
  if (!input.selectedRepairs || input.selectedRepairs.length === 0) {
    return [];
  }

  // Validate selected repairs against known types
  const validRepairs = input.selectedRepairs.filter(r => ADDITIONAL_REPAIR_TYPES.includes(r));
  if (validRepairs.length === 0) {
    logger.warn('No valid additional repair types selected', { selectedRepairs: input.selectedRepairs });
    return [];
  }

  logger.info('Analyzing additional repairs with OpenAI', {
    repairCount: validRepairs.length,
    repairs: validRepairs,
    pricePerLaborHour: input.pricePerLaborHour,
  });

  const userPrompt = buildAdditionalRepairsPrompt({ ...input, selectedRepairs: validRepairs });

  try {
    const response = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      temperature: 0.2,
      max_tokens: 2000,
      response_format: {
        type: 'json_schema',
        json_schema: AI_ADDITIONAL_REPAIRS_SCHEMA,
      },
      messages: [
        {
          role: 'system',
          content: 'You are an expert automotive repair cost estimator. Provide accurate labor hour and parts cost estimates for vehicle repairs.',
        },
        { role: 'user', content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI for additional repairs');
    }

    const parsed = JSON.parse(content) as { repairs: Array<{ name: string; description: string; laborHours: number; partsCost: number }> };

    // Calculate costs using the provided labor rate
    const results: AdditionalRepairItem[] = parsed.repairs.map((repair) => {
      const laborCost = Math.round(repair.laborHours * input.pricePerLaborHour);
      const partsCost = Math.round(repair.partsCost);
      return {
        name: repair.name,
        description: repair.description,
        laborHours: repair.laborHours,
        laborCost,
        partsCost,
        totalCost: laborCost + partsCost,
      };
    });

    logger.info('Additional repairs analysis completed', {
      repairCount: results.length,
      totalCost: results.reduce((sum, r) => sum + r.totalCost, 0),
    });

    return results;
  } catch (error) {
    logger.error('Additional repairs AI analysis failed', { error: (error as Error).message });
    throw new Error(`Additional repairs analysis failed: ${(error as Error).message}`);
  }
}

export { ADDITIONAL_REPAIR_TYPES };
