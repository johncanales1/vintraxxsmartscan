export interface ScanSubmissionPayload {
  vin: string;
  mileage: number | null;
  milStatus: {
    milOn: boolean;
    dtcCount: number;
    byEcu?: Record<string, { milOn: boolean; dtcCount: number }>;
  };
  storedDtcCodes: string[];
  pendingDtcCodes: string[];
  permanentDtcCodes: string[];
  distanceSinceCleared: number | null;
  timeSinceCleared: number | null;
  warmupsSinceCleared: number | null;
  distanceWithMILOn: number | null;
  fuelSystemStatus: { system1: number; system2: number } | null;
  secondaryAirStatus: number | null;
  scanDate: string;
}

export interface VinDecodeResult {
  year: number | null;
  make: string | null;
  model: string | null;
  engine: string | null;
}

export interface AiDtcAnalysis {
  code: string;
  description: string;
  module: string;
  severity: 'critical' | 'moderate' | 'minor';
  possibleCauses: string[];
  repair: {
    description: string;
    partsCost: number;
    laborCost: number;
  };
  urgency: 'immediate' | 'soon' | 'monitor';
}

export interface AiEmissionsCheck {
  status: 'pass' | 'fail';
  testsPassed: number;
  testsFailed: number;
  monitorStatusText: string;
}

export interface AiMileageRiskItem {
  issue: string;
  costEstimateLow: number;
  costEstimateHigh: number;
  mileageEstimate: number;
}

export interface AiAnalysisOutput {
  dtcAnalysis: AiDtcAnalysis[];
  emissionsCheck: AiEmissionsCheck;
  mileageRiskAssessment: AiMileageRiskItem[];
  modulesScanned: string[];
  datapointsScanned: number;
  aiSummary: string;
}

export interface FullReportData {
  scanId: string;
  vehicle: {
    vin: string;
    year: number;
    make: string;
    model: string;
    mileage: number | null;
  };
  healthScore: number;
  overallStatus: 'healthy' | 'attention_needed' | 'critical';
  dtcAnalysis: Array<{
    code: string;
    description: string;
    severity: 'critical' | 'moderate' | 'minor' | 'info';
    category: string;
    possibleCauses: string[];
    repairEstimate: { low: number; high: number };
    urgency: 'immediate' | 'soon' | 'monitor';
  }>;
  repairRecommendations: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    estimatedCost: { labor: number; parts: number; total: number };
  }>;
  emissionsAnalysis: {
    status: 'pass' | 'fail' | 'incomplete';
    summary: string;
  };
  totalEstimatedRepairCost: number;
  aiSummary: string;
  codesLastReset: {
    distanceMiles: number | null;
    monitorStatusText: string;
  };
  emissionsCheck: {
    status: 'pass' | 'fail';
    testsPassed: number;
    testsFailed: number;
  };
  mileageRiskAssessment: Array<{
    issue: string;
    costEstimateLow: number;
    costEstimateHigh: number;
    mileageEstimate: number;
  }>;
  modulesScanned: string[];
  datapointsScanned: number;
  reportMetadata: {
    reportId: string;
    reportVersion: string;
    generatedAt: string;
    userEmail: string;
  };
}

export interface JwtPayload {
  userId: string;
  email: string;
}
