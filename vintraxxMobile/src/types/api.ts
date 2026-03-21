// Shared API types matching backend exactly
// These interfaces define the contract between mobile app and backend

// ================================================================
// AUTH TYPES
// ================================================================

export interface CheckEmailResponse {
  success: boolean;
  isRegistered: boolean;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
}

export interface AuthUser {
  id: string;
  email: string;
  isDealer?: boolean;
  pricePerLaborHour?: number | null;
}

export interface RegisterResponse {
  success: boolean;
  user: AuthUser;
  token: string;
  message?: string;
}

export interface AdditionalRepairItem {
  name: string;
  description: string;
  laborHours: number;
  laborCost: number;
  partsCost: number;
  totalCost: number;
}

export interface LoginResponse {
  success: boolean;
  user: AuthUser;
  token: string;
  message?: string;
}

// ================================================================
// SCAN SUBMISSION PAYLOAD (sent FROM mobile TO backend)
// ================================================================

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
  scanDate: string; // ISO 8601
  stockNumber?: string;
  additionalRepairs?: string[];
  scannerDeviceId?: string;
}

export interface ScanSubmitResponse {
  success: boolean;
  scanId: string;
  message: string;
}

// ================================================================
// FULL REPORT DATA (sent FROM backend TO mobile)
// ================================================================

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
  dtcAnalysis: DtcAnalysisItem[];
  repairRecommendations: RepairRecommendation[];
  emissionsAnalysis: {
    status: 'pass' | 'fail' | 'incomplete';
    summary: string;
  };
  totalEstimatedRepairCost: number;
  additionalRepairs?: AdditionalRepairItem[];
  additionalRepairsTotalCost?: number;
  grandTotalCost?: number;
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
  mileageRiskAssessment: MileageRiskItem[];
  modulesScanned: string[];
  datapointsScanned: number;
  reportMetadata: {
    reportId: string;
    reportVersion: string;
    generatedAt: string; // ISO 8601
    userEmail: string;
  };
  stockNumber?: string;
}

export interface DtcAnalysisItem {
  code: string;
  description: string;
  severity: 'critical' | 'moderate' | 'minor' | 'info';
  category: string;
  possibleCauses: string[];
  repairEstimate: { low: number; high: number };
  urgency: 'immediate' | 'soon' | 'monitor';
}

export interface RepairRecommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedCost: { labor: number; parts: number; total: number };
}

export interface MileageRiskItem {
  issue: string;
  costEstimateLow: number;
  costEstimateHigh: number;
  mileageEstimate: number;
}

// ================================================================
// REPORT POLLING
// ================================================================

export type ReportStatus = 'processing' | 'completed' | 'failed';

export interface ReportPollResponse {
  success: boolean;
  status: ReportStatus;
  data?: FullReportData;
  message?: string;
}

// ================================================================
// SCAN HISTORY
// ================================================================

export interface ScanHistoryItem {
  scanId: string;
  vin: string;
  vehicleYear: number | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  status: string;
  scanDate: string;
}

export interface ScanHistoryResponse {
  success: boolean;
  scans: ScanHistoryItem[];
}

// ================================================================
// APPRAISAL TYPES
// ================================================================

export interface AppraisalValuationRequest {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage: number;
  condition: 'clean' | 'average' | 'rough';
  zipCode?: string;
  notes?: string;
}

export interface AppraisalValuationSource {
  sourceName: string;
  wholesaleLow: number;
  wholesaleHigh: number;
  tradeInLow: number;
  tradeInHigh: number;
  retailLow: number;
  retailHigh: number;
  privatePartyLow: number;
  privatePartyHigh: number;
}

export interface AiValuationOutput {
  estimatedWholesaleLow: number;
  estimatedWholesaleHigh: number;
  estimatedTradeInLow: number;
  estimatedTradeInHigh: number;
  estimatedRetailLow: number;
  estimatedRetailHigh: number;
  estimatedPrivatePartyLow: number;
  estimatedPrivatePartyHigh: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  confidenceExplanation: string;
  marketTrend: 'appreciating' | 'stable' | 'depreciating';
  marketTrendExplanation: string;
  comparableSources: AppraisalValuationSource[];
  adjustments: Array<{
    factor: string;
    impact: number;
    explanation: string;
  }>;
  aiSummary: string;
  dataAsOf: string;
}

export interface AppraisalValuationResponse {
  success: boolean;
  appraisalId?: string;
  valuation?: AiValuationOutput;
  vehicle?: {
    year: number;
    make: string;
    model: string;
    trim?: string;
  };
  message?: string;
}

export interface AppraisalSummaryData {
  appraisalId: string;
  vehicle: {
    vin: string;
    year: number;
    make: string;
    model: string;
    trim?: string;
    mileage: number;
  };
  condition: 'clean' | 'average' | 'rough';
  zipCode?: string;
  notes?: string;
  valuation: AiValuationOutput;
  healthScore?: number;
  diagnosticsSummary?: string;
  photoCount: number;
  photos?: string[];
  createdAt: string;
  userEmail: string;
}

export interface AppraisalEmailRequest {
  toEmail: string;
  appraisalData: AppraisalSummaryData;
}

export interface AppraisalPdfRequest {
  toEmail: string;
  appraisalData: AppraisalSummaryData;
}

export interface AppraisalActionResponse {
  success: boolean;
  message?: string;
}

// ================================================================
// GENERIC API ERROR
// ================================================================

export interface ApiErrorResponse {
  success: false;
  message: string;
}
