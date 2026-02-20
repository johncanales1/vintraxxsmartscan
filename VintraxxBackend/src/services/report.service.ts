import { AiAnalysisOutput, FullReportData } from '../types';
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
  aiOutput: AiAnalysisOutput;
}

export function assembleFullReport(input: ReportAssemblyInput): FullReportData {
  const { scanId, reportId, vin, year, make, model, mileage, milOn, distanceSinceCleared, userEmail, aiOutput } = input;

  const healthScore = calculateHealthScore(aiOutput, milOn);
  const overallStatus = determineOverallStatus(healthScore);
  const totalEstimatedRepairCost = calculateTotalRepairCost(aiOutput);

  const dtcAnalysis = aiOutput.dtcAnalysis.map((dtc) => ({
    code: dtc.code,
    description: dtc.description,
    severity: dtc.severity as 'critical' | 'moderate' | 'minor' | 'info',
    category: dtc.module,
    possibleCauses: dtc.possibleCauses,
    repairEstimate: {
      low: dtc.repair.partsCost,
      high: dtc.repair.partsCost + dtc.repair.laborCost,
    },
    urgency: dtc.urgency,
  }));

  const repairRecommendations = aiOutput.dtcAnalysis.map((dtc) => ({
    title: truncateString(dtc.repair.description, 80),
    description: dtc.repair.description,
    priority: mapSeverityToPriority(dtc.severity),
    estimatedCost: {
      labor: dtc.repair.laborCost,
      parts: dtc.repair.partsCost,
      total: dtc.repair.laborCost + dtc.repair.partsCost,
    },
  }));

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
    },
  };

  logger.info('Report assembled', {
    scanId,
    healthScore,
    overallStatus,
    dtcCount: dtcAnalysis.length,
    totalCost: totalEstimatedRepairCost,
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
