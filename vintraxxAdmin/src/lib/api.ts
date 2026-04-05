const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.vintraxx.com/api/v1/admin';
const API_BASE = API_URL.replace(/\/api\/v1\/admin$/, '');

export function normalizePdfUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  const match = raw.match(/reports\/(.+)$/);
  if (match) return `${API_BASE}/reports/${match[1]}`;
  return raw;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

// Auth
export const api = {
  login: (email: string, password: string) =>
    request<{ success: boolean; admin: { id: string; email: string }; token: string }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getProfile: () =>
    request<{ success: boolean; admin: { id: string; email: string; createdAt: string } }>('/profile'),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean }>('/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  sendEmailChangeOtp: (newEmail: string) =>
    request<{ success: boolean }>('/email-change/send-otp', {
      method: 'POST',
      body: JSON.stringify({ newEmail }),
    }),

  verifyEmailChange: (newEmail: string, otp: string) =>
    request<{ success: boolean; admin: { id: string; email: string }; token: string }>('/email-change/verify', {
      method: 'POST',
      body: JSON.stringify({ newEmail, otp }),
    }),

  // Dashboard
  getDashboard: () =>
    request<{ success: boolean; stats: DashboardStats }>('/dashboard'),

  // Users
  getUsers: (type?: 'dealer' | 'regular') =>
    request<{ success: boolean; users: User[] }>(`/users${type ? `?type=${type}` : ''}`),

  getUserDetail: (id: string) =>
    request<{ success: boolean; user: UserDetail }>(`/users/${id}`),

  createUser: (data: CreateUserData) =>
    request<{ success: boolean; user: User }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUser: (id: string, data: Partial<CreateUserData>) =>
    request<{ success: boolean; user: User }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteUser: (id: string) =>
    request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' }),

  // Scans
  getScans: (page = 1, limit = 50) =>
    request<{ success: boolean; scans: Scan[]; total: number; page: number; totalPages: number }>(
      `/scans?page=${page}&limit=${limit}`
    ),

  getScanDetail: (id: string) =>
    request<{ success: boolean; scan: ScanDetail }>(`/scans/${id}`),

  deleteScan: (id: string) =>
    request<{ success: boolean }>(`/scans/${id}`, { method: 'DELETE' }),

  // Inspections
  getInspections: (page = 1, limit = 50) =>
    request<{ success: boolean; inspections: Inspection[]; total: number; page: number; totalPages: number }>(
      `/inspections?page=${page}&limit=${limit}`
    ),

  deleteInspection: (id: string) =>
    request<{ success: boolean }>(`/inspections/${id}`, { method: 'DELETE' }),

  // Appraisals
  getAppraisals: (page = 1, limit = 50) =>
    request<{ success: boolean; appraisals: Appraisal[]; total: number; page: number; totalPages: number }>(
      `/appraisals?page=${page}&limit=${limit}`
    ),

  deleteAppraisal: (id: string) =>
    request<{ success: boolean }>(`/appraisals/${id}`, { method: 'DELETE' }),

  // Verify Password
  verifyPassword: (password: string) =>
    request<{ success: boolean }>('/verify-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  // Backup
  getBackupUrl: () => `${API_URL}/backup`,
};

// Types
export interface DashboardStats {
  totalUsers: number;
  totalDealers: number;
  totalRegular: number;
  totalScans: number;
  totalReports: number;
  totalInspections: number;
  recentScans: Array<{
    id: string;
    vin: string;
    status: string;
    receivedAt: string;
    user: { email: string; isDealer: boolean };
  }>;
}

export interface User {
  id: string;
  email: string;
  authProvider: string;
  isDealer: boolean;
  pricePerLaborHour: number | null;
  logoUrl: string | null;
  qrCodeUrl: string | null;
  maxScannerDevices: number | null;
  maxVins: number | null;
  createdAt: string;
  updatedAt: string;
  _count: { scans: number; usedScannerDevices: number; usedVins: number };
}

export interface UserDetail extends Omit<User, '_count'> {
  passwordHash: string | null;
  googleId: string | null;
  microsoftId: string | null;
  originalLogoUrl: string | null;
  scans: ScanDetail[];
  usedScannerDevices: ScannerDevice[];
  usedVins: VinUsage[];
}

export interface ScannerDevice {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string | null;
  firstUsedAt: string;
  lastUsedAt: string;
}

export interface VinUsage {
  id: string;
  userId: string;
  vin: string;
  firstUsedAt: string;
  lastUsedAt: string;
  scanCount: number;
}

export interface Scan {
  id: string;
  userId: string;
  vin: string;
  mileage: number | null;
  milOn: boolean;
  dtcCount: number;
  storedDtcCodes: string[];
  pendingDtcCodes: string[];
  permanentDtcCodes: string[];
  stockNumber: string | null;
  additionalRepairs: string[];
  scannerDeviceId: string | null;
  vehicleYear: number | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleEngine: string | null;
  status: string;
  errorMessage: string | null;
  scanDate: string;
  receivedAt: string;
  processedAt: string | null;
  user?: { id: string; email: string; isDealer: boolean };
  fullReport?: FullReportSummary | null;
}

export interface FullReportSummary {
  id: string;
  pdfUrl: string | null;
  totalReconditioningCost: number;
  additionalRepairsCost: number;
  createdAt: string;
}

export interface ScanDetail extends Scan {
  distanceSinceCleared: number | null;
  timeSinceCleared: number | null;
  warmupsSinceCleared: number | null;
  distanceWithMilOn: number | null;
  fuelSystemStatus: any;
  secondaryAirStatus: number | null;
  milStatusByEcu: any;
  rawPayload: any;
  fullReport?: FullReport | null;
}

export interface FullReport {
  id: string;
  scanId: string;
  aiRawResponse: any;
  dtcAnalysis: any;
  emissionsCheck: any;
  mileageRiskAssessment: any;
  repairRecommendations: any;
  modulesScanned: string[];
  datapointsScanned: number;
  totalReconditioningCost: number;
  additionalRepairsCost: number;
  additionalRepairsData: any;
  reportVersion: string;
  pdfUrl: string | null;
  pdfGeneratedAt: string | null;
  emailSentAt: string | null;
  createdAt: string;
}

export interface Inspection {
  id: string;
  userId: string;
  vehicleInfo: string | null;
  vin: string | null;
  mileage: string | null;
  color: string | null;
  inspector: string | null;
  date: string;
  ratings: any;
  damageMarks: any;
  createdAt: string;
  updatedAt: string;
}

export interface Appraisal {
  id: string;
  userId: string;
  vin: string;
  vehicleYear: number | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleTrim: string | null;
  mileage: number | null;
  condition: string | null;
  zipCode: string | null;
  notes: string | null;
  valuationData: any;
  pdfUrl: string | null;
  photoCount: number;
  userEmail: string | null;
  createdAt: string;
}

export interface CreateUserData {
  email: string;
  password?: string;
  isDealer?: boolean;
  pricePerLaborHour?: number;
  logoUrl?: string;
  qrCodeUrl?: string;
  maxScannerDevices?: number | null;
  maxVins?: number | null;
}
