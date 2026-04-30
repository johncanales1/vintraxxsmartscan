import { AiAnalysisOutput, FullReportData, AdditionalRepairItem } from '../types';
import { truncateString } from '../utils/helpers';
import { env } from '../config/env';
import logger from '../utils/logger';

interface ReportAssemblyInput {
  scanId: string;
  reportId: string;
  vin: string;
  year: number | null;
  make: string | null;
  model: string | null;
  mileage: number | null;
  milOn: boolean;
  distanceSinceCleared: number | null;
  userEmail: string;
  userFullName?: string;
  scannerOwnerName?: string;
  vehicleOwnerName?: string;
  aiOutput: AiAnalysisOutput;
  stockNumber?: string;
  additionalRepairs?: AdditionalRepairItem[];
  additionalRepairsTotalCost?: number;
  dealerLogoUrl?: string;
  dealerQrCodeUrl?: string;
}

export function assembleFullReport(input: ReportAssemblyInput): FullReportData {
  const { scanId, reportId, vin, year, make, model, mileage, milOn, distanceSinceCleared, userEmail, userFullName, scannerOwnerName, vehicleOwnerName, aiOutput, stockNumber, additionalRepairs, additionalRepairsTotalCost, dealerLogoUrl, dealerQrCodeUrl } = input;

  const healthScore = calculateHealthScore(aiOutput, milOn);
  const overallStatus = determineOverallStatus(healthScore);
  const totalEstimatedRepairCost = calculateTotalRepairCost(aiOutput);

  // LOW #5: single-pass build of dtcAnalysis + repairRecommendations.
  // Previously the same `aiOutput.dtcAnalysis` array was iterated twice,
  // each pass touching the same `dtc.repair.{description,laborCost,partsCost}`
  // and `dtc.severity`. With 20+ DTCs that's 2× the closure allocations
  // and 2× the array growth. Output is byte-identical to the old shape.
  const dtcAnalysis: FullReportData['dtcAnalysis'] = [];
  const repairRecommendations: FullReportData['repairRecommendations'] = [];
  for (const dtc of aiOutput.dtcAnalysis) {
    const labor = dtc.repair.laborCost;
    const parts = dtc.repair.partsCost;
    const total = parts + labor;

    // HIGH #19: build a meaningful low/high range. Previously low=parts and
    // high=parts+labor, which isn't a range at all (it's parts vs total).
    // Mobile/dealer dashboards render this as a min/max repair quote, so
    // we use a ±10% band around the labor portion to honour that contract.
    dtcAnalysis.push({
      code: dtc.code,
      description: dtc.description,
      severity: dtc.severity as 'critical' | 'moderate' | 'minor' | 'info',
      category: dtc.module,
      possibleCauses: dtc.possibleCauses,
      repairEstimate: {
        low: Math.round(parts + labor * 0.9),
        high: Math.round(parts + labor * 1.1),
        // Keep the AI point estimate available for clients that want it
        // without needing to do (low+high)/2 math themselves.
        total: Math.round(total),
      },
      urgency: dtc.urgency,
    });

    repairRecommendations.push({
      title: truncateString(dtc.repair.description, 80),
      description: dtc.repair.description,
      priority: mapSeverityToPriority(dtc.severity),
      estimatedCost: {
        labor,
        parts,
        total,
      },
    });
  }

  const report: FullReportData = {
    scanId,
    vehicle: {
      vin,
      year: year || 0,
      make: make || 'Unknown',
      model: model || 'Unknown',
      mileage,
    },
    healthScore,
    overallStatus,
    dtcAnalysis,
    repairRecommendations,
    emissionsAnalysis: {
      status: aiOutput.emissionsCheck.status,
      summary: aiOutput.emissionsCheck.monitorStatusText,
    },
    totalEstimatedRepairCost,
    aiSummary: aiOutput.aiSummary,
    codesLastReset: {
      distanceMiles: distanceSinceCleared,
      monitorStatusText: aiOutput.emissionsCheck.monitorStatusText,
    },
    emissionsCheck: {
      status: aiOutput.emissionsCheck.status,
      testsPassed: aiOutput.emissionsCheck.testsPassed,
      testsFailed: aiOutput.emissionsCheck.testsFailed,
    },
    mileageRiskAssessment: aiOutput.mileageRiskAssessment,
    modulesScanned: aiOutput.modulesScanned,
    datapointsScanned: aiOutput.datapointsScanned,
    reportMetadata: {
      reportId,
      reportVersion: env.REPORT_VERSION,
      generatedAt: new Date().toISOString(),
      userEmail,
      userFullName: userFullName || undefined,
      scannerOwnerName: scannerOwnerName || undefined,
      vehicleOwnerName: vehicleOwnerName || undefined,
    },
    stockNumber,
    additionalRepairs: additionalRepairs || undefined,
    additionalRepairsTotalCost: additionalRepairsTotalCost || 0,
    grandTotalCost: totalEstimatedRepairCost + (additionalRepairsTotalCost || 0),
    dealerLogoUrl,
    dealerQrCodeUrl,
  };

  logger.info('Report assembled', {
    scanId,
    healthScore,
    overallStatus,
    dtcCount: dtcAnalysis.length,
    totalCost: totalEstimatedRepairCost,
    stockNumber: stockNumber || undefined,
  });

  return report;
}

function calculateHealthScore(aiOutput: AiAnalysisOutput, milOn: boolean): number {
  let score = 100;

  for (const dtc of aiOutput.dtcAnalysis) {
    switch (dtc.severity) {
      case 'critical':
        score -= 20;
        break;
      case 'moderate':
        score -= 10;
        break;
      case 'minor':
        score -= 5;
        break;
    }
  }

  if (milOn) score -= 10;
  if (aiOutput.emissionsCheck.status === 'fail') score -= 10;

  return Math.max(0, Math.min(100, score));
}

function determineOverallStatus(healthScore: number): 'healthy' | 'attention_needed' | 'critical' {
  if (healthScore >= 80) return 'healthy';
  if (healthScore >= 50) return 'attention_needed';
  return 'critical';
}

function calculateTotalRepairCost(aiOutput: AiAnalysisOutput): number {
  return aiOutput.dtcAnalysis.reduce(
    (total, dtc) => total + dtc.repair.partsCost + dtc.repair.laborCost,
    0
  );
}

function mapSeverityToPriority(severity: string): 'high' | 'medium' | 'low' {
  switch (severity) {
    case 'critical':
      return 'high';
    case 'moderate':
      return 'medium';
    default:
      return 'low';
  }
}
