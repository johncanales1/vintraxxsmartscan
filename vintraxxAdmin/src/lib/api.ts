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

/**
 * Internal error thrown for HTTP 401. Consumers can narrow via `name` when
 * they want to distinguish "token expired / invalid" from a generic error.
 */
export class UnauthorizedError extends Error {
  name = 'UnauthorizedError';
}

/**
 * Force-log-out handler. Invoked once when `request<T>` receives a 401 so
 * the admin isn't left in a broken-session UI where every subsequent toast
 * says "Unauthorized". Uses a guard flag to ensure only one reload fires
 * even if a burst of requests all 401 at once.
 */
let authFailureHandled = false;
function forceLogoutOn401() {
  if (typeof window === 'undefined') return;
  if (authFailureHandled) return;
  authFailureHandled = true;
  try {
    localStorage.removeItem('admin_token');
  } catch {
    // ignore
  }
  // Hard reload — simpler and safer than trying to notify the AuthProvider
  // via a context from a plain function. The next mount will see no token
  // and render the LoginPage.
  window.location.reload();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (err) {
    // Network / CORS / DNS failures surface here. Keep the original message
    // so the developer console retains context, but present something
    // readable to the user.
    throw new Error(`Network error — check your connection (${(err as Error).message})`);
  }

  // Read the body as text first so we can gracefully handle non-JSON
  // responses (e.g. an nginx 502 page, a load-balancer 504, or an empty
  // 204). `res.json()` on non-JSON throws a cryptic SyntaxError otherwise.
  const text = await res.text();
  let data: any = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text.slice(0, 500) };
    }
  }

  if (!res.ok) {
    // Join Zod `details` into the surfaced message so the admin actually
    // sees which field failed validation.
    let message: string = data.error || `Request failed: ${res.status}`;
    if (Array.isArray(data.details) && data.details.length) {
      message = `${message}: ${data.details.join(', ')}`;
    }
    if (res.status === 401) {
      forceLogoutOn401();
      throw new UnauthorizedError(message);
    }
    throw new Error(message);
  }
  return data;
}

// Auth
export const api = {
  login: (email: string, password: string) =>
    request<{ success: boolean; admin: { id: string; email: string; superAdmin?: boolean }; token: string }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getProfile: () =>
    request<{ success: boolean; admin: { id: string; email: string; createdAt: string; superAdmin?: boolean } }>('/profile'),

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
    request<{ success: boolean; admin: { id: string; email: string; superAdmin?: boolean }; token: string }>('/email-change/verify', {
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

  updateUser: (id: string, data: UpdateUserData) =>
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

  // Service Appointments
  getServiceAppointments: (page = 1, limit = 50) =>
    request<{ success: boolean; appointments: ServiceAppointment[]; total: number; page: number; totalPages: number }>(
      `/service-appointments?page=${page}&limit=${limit}`
    ),

  deleteServiceAppointment: (id: string) =>
    request<{ success: boolean }>(`/service-appointments/${id}`, { method: 'DELETE' }),

  completeServiceAppointment: (id: string) =>
    request<{ success: boolean; appointment: ServiceAppointment }>(`/service-appointments/${id}/complete`, { method: 'PATCH' }),

  getAppraisalDetail: (id: string) =>
    request<{ success: boolean; appraisal: AppraisalDetail }>(`/appraisals/${id}`),

  sendEmail: (to: string, subject: string, body: string) =>
    request<{ success: boolean }>('/send-email', {
      method: 'POST',
      body: JSON.stringify({ to, subject, body }),
    }),

  // Verify Password
  verifyPassword: (password: string) =>
    request<{ success: boolean }>('/verify-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  // Backup
  getBackupUrl: () => `${API_URL}/backup`,

  // ── GPS Telemetry (admin scope — no ownerUserId filter unless requested) ──

  getGpsOverview: () =>
    request<{ success: boolean; stats: GpsOverviewStats }>('/gps/stats/overview'),

  listGpsTerminals: (
    page = 1,
    limit = 50,
    opts: {
      filter?: 'online' | 'offline' | 'unpaired' | 'never_connected' | 'revoked';
      search?: string;
      ownerUserId?: string;
    } = {},
  ) =>
    request<{
      success: boolean;
      terminals: GpsTerminal[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }>(
      `/gps/terminals?${buildQuery({ page, limit, ...opts })}`,
    ),

  getGpsTerminal: (id: string) =>
    request<{ success: boolean; terminal: GpsTerminalDetail }>(`/gps/terminals/${id}`),

  provisionGpsTerminal: (body: ProvisionTerminalBody) =>
    request<{ success: boolean; terminal: GpsTerminal }>('/gps/terminals', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  reassignGpsTerminal: (id: string, ownerUserId: string | null) =>
    request<{ success: boolean; terminal: GpsTerminal }>(`/gps/terminals/${id}/owner`, {
      method: 'PATCH',
      body: JSON.stringify({ ownerUserId }),
    }),

  unpairGpsTerminal: (id: string) =>
    request<{ success: boolean; terminal: GpsTerminal }>(`/gps/terminals/${id}/unpair`, {
      method: 'POST',
    }),

  deleteGpsTerminal: (id: string) =>
    request<{ success: boolean; message?: string }>(`/gps/terminals/${id}`, {
      method: 'DELETE',
    }),

  /**
   * Most-recent GpsLocation for a terminal. `location` is null when the
   * terminal has never reported (NEVER_CONNECTED). Throws 404 if the
   * terminal id itself is unknown.
   */
  getGpsTerminalLatest: (id: string) =>
    request<{ success: boolean; location: GpsLocation | null }>(
      `/gps/terminals/${id}/latest`,
    ),

  getGpsLocations: (
    id: string,
    opts: { since?: string; until?: string; page?: number; limit?: number; minSpeedKmh?: number } = {},
  ) =>
    request<{
      success: boolean;
      locations: GpsLocation[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      since: string;
      until: string;
    }>(`/gps/terminals/${id}/locations?${buildQuery(opts)}`),

  getGpsObdSnapshots: (
    id: string,
    opts: { since?: string; until?: string; page?: number; limit?: number } = {},
  ) =>
    request<{
      success: boolean;
      snapshots: GpsObdSnapshot[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      since: string;
      until: string;
    }>(`/gps/terminals/${id}/obd?${buildQuery(opts)}`),

  // Alarms
  /**
   * List alarms (admin scope). Supports the canonical filter triplet from
   * the backend (severity/state/ack) plus the admin-only convenience
   * filters (alarmType/ownerUserId/search). The UI maps a higher-level
   * "status" tri-state (OPEN | ACKNOWLEDGED | CLOSED) onto state+ack
   * before calling here — that mapping is intentionally kept in the UI to
   * keep the wire shape minimal and unambiguous.
   */
  listGpsAlarms: (
    page = 1,
    limit = 50,
    filters: {
      terminalId?: string;
      severity?: GpsAlarmSeverity;
      alarmType?: GpsAlarmType;
      state?: 'open' | 'closed';
      ack?: boolean;
      ownerUserId?: string;
      search?: string;
      since?: string;
      until?: string;
    } = {},
  ) =>
    request<{
      success: boolean;
      alarms: GpsAlarm[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }>(`/gps/alarms?${buildQuery({ page, limit, ...filters })}`),

  getGpsAlarm: (id: string) =>
    request<{ success: boolean; alarm: GpsAlarm }>(`/gps/alarms/${id}`),

  acknowledgeGpsAlarm: (id: string, note?: string) =>
    request<{ success: boolean; alarm: GpsAlarm }>(`/gps/alarms/${id}/ack`, {
      method: 'POST',
      body: JSON.stringify(note ? { note } : {}),
    }),

  bulkAcknowledgeGpsAlarms: (ids: string[], note?: string) =>
    request<{
      success: boolean;
      count: number;
      acknowledged: string[];
      skipped: string[];
    }>('/gps/alarms/ack-bulk', {
      method: 'POST',
      body: JSON.stringify({ ids, ...(note ? { note } : {}) }),
    }),

  // DTC events
  /**
   * `milOnly` is the canonical filter name on the backend (see
   * `listDtcEventsQuerySchema`). The Zod middleware accepts the literal
   * strings `"true"` / `"false"` and the controller does the boolean
   * coercion. Earlier this filter was named `milOn` on the client which
   * never reached the controller and silently no-op'd - always send
   * `milOnly` so the backend filter is actually applied.
   */
  listGpsDtcEvents: (
    page = 1,
    limit = 50,
    filters: {
      terminalId?: string;
      vin?: string;
      milOnly?: boolean;
      since?: string;
      until?: string;
    } = {},
  ) =>
    request<{
      success: boolean;
      events: GpsDtcEvent[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }>(`/gps/dtc-events?${buildQuery({ page, limit, ...filters })}`),

  getGpsDtcEvent: (id: string) =>
    request<{ success: boolean; event: GpsDtcEvent }>(`/gps/dtc-events/${id}`),

  /**
   * Promote a DTC event into a Scan and run the AI pipeline on the owner's
   * behalf. Returns `scanId` (poll `getScanDetail(scanId)` to wait for
   * COMPLETED) and `reused:true` if a Scan already existed for this event.
   */
  analyzeGpsDtcEvent: (id: string) =>
    request<{ success: boolean; scanId: string; reused: boolean }>(
      `/gps/dtc-events/${id}/analyze`,
      { method: 'POST', body: JSON.stringify({}) },
    ),

  // Trips + daily stats
  listGpsTrips: (
    page = 1,
    limit = 50,
    filters: {
      terminalId?: string;
      status?: 'OPEN' | 'CLOSED';
      since?: string;
      until?: string;
    } = {},
  ) =>
    request<{
      success: boolean;
      trips: GpsTrip[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }>(`/gps/trips?${buildQuery({ page, limit, ...filters })}`),

  getGpsTrip: (id: string) =>
    request<{ success: boolean; trip: GpsTrip }>(`/gps/trips/${id}`),

  // Commands (read-only in v1)
  listGpsCommands: (
    page = 1,
    limit = 50,
    filters: {
      terminalId?: string;
      status?: GpsCommandStatus;
      adminId?: string;
      since?: string;
      until?: string;
    } = {},
  ) =>
    request<{
      success: boolean;
      commands: GpsCommand[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }>(`/gps/commands?${buildQuery({ page, limit, ...filters })}`),

  getGpsCommand: (id: string) =>
    request<{ success: boolean; command: GpsCommand }>(`/gps/commands/${id}`),

  // Audit log
  listAdminAuditLogs: (
    page = 1,
    limit = 50,
    filters: {
      adminId?: string;
      targetType?: string;
      targetId?: string;
      action?: string;
      statusClass?: 1 | 2 | 3 | 4 | 5;
      since?: string;
      until?: string;
    } = {},
  ) =>
    request<{
      success: boolean;
      entries: AdminAuditEntry[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }>(`/audit-logs?${buildQuery({ page, limit, ...filters })}`),
};

/**
 * Builds a URL query string from a flat object, dropping undefined/null/''.
 * Booleans are stringified ("true"/"false") because the backend Zod
 * schemas use `z.coerce.boolean()` which accepts both.
 */
function buildQuery(params: Record<string, unknown>): string {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    out.append(k, String(v));
  }
  return out.toString();
}

// Types
export interface DashboardStats {
  totalUsers: number;
  totalDealers: number;
  totalRegular: number;
  totalScans: number;
  totalReports: number;
  totalInspections: number;
  totalAppraisals: number;
  totalServiceAppointments: number;
  recentScans: Array<{
    id: string;
    vin: string;
    status: string;
    receivedAt: string;
    user: { email: string; fullName: string | null; isDealer: boolean };
  }>;
}

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  authProvider: string;
  isDealer: boolean;
  pricePerLaborHour: number | null;
  logoUrl: string | null;
  qrCodeUrl: string | null;
  maxScannerDevices: number | null;
  maxVins: number | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    scans: number;
    usedScannerDevices: number;
    usedVins: number;
    /** Optional — populated by the admin `getUsers` endpoint after the
     *  GPS-integration backfill. Treated as 0 when missing for older
     *  payloads. */
    gpsTerminals?: number;
  };
}

export interface UserDetail extends Omit<User, '_count'> {
  // `passwordHash`, `googleId`, `microsoftId`, `originalLogoUrl` used to be
  // here but the backend now strips them from the payload (admin service
  // SAFE_USER_SELECT). Leaving them off the type forces any stale UI code
  // that relied on them to fail at compile time.
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
  userFullName: string | null;
  vehicleOwnerName: string | null;
  vehicleYear: number | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleEngine: string | null;
  status: string;
  errorMessage: string | null;
  scanDate: string;
  receivedAt: string;
  processedAt: string | null;
  user?: { id: string; email: string; fullName: string | null; isDealer: boolean };
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
  userFullName: string | null;
  vehicleOwnerName: string | null;
  createdAt: string;
}

export interface AppraisalDetail extends Appraisal {
  // Full detail includes all fields from Appraisal
}

export interface ServiceAppointment {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  dealership: string | null;
  vehicle: string | null;
  vin: string | null;
  serviceType: string;
  preferredDate: string;
  preferredTime: string | null;
  additionalNotes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; email: string; fullName: string | null; isDealer: boolean };
}

export interface CreateUserData {
  email: string;
  password: string;
  fullName?: string;
  isDealer?: boolean;
  pricePerLaborHour?: number;
  logoUrl?: string;
  qrCodeUrl?: string;
  maxScannerDevices?: number | null;
  maxVins?: number | null;
}

/**
 * `PUT /admin/users/:id` does NOT accept a `password`. The backend used to
 * silently drop it — which made the admin think they had changed the
 * password when nothing had happened. Password changes require a dedicated
 * flow (forgot-password reset or the user's own settings), so keep the
 * payload shape honest here.
 */
export type UpdateUserData = Omit<Partial<CreateUserData>, 'password'>;

// ── GPS Telemetry types ─────────────────────────────────────────────────────
//
// These mirror the Prisma models exactly (with BigInt/Decimal serialised as
// `number` by the backend's BigInt polyfill). New fields the backend adds
// later are forward-compatible because the frontend only reads the fields
// it knows about and ignores the rest.

export type GpsTerminalStatus =
  | 'NEVER_CONNECTED'
  | 'ONLINE'
  | 'OFFLINE'
  | 'SUSPENDED'
  | 'REVOKED';

export interface GpsTerminal {
  id: string;
  imei: string;
  phoneNumber: string | null;
  iccid: string | null;
  manufacturerId: string | null;
  terminalModel: string | null;
  hardwareVersion: string | null;
  firmwareVersion: string | null;

  ownerUserId: string | null;
  ownerUser?: {
    id: string;
    email: string;
    fullName: string | null;
    isDealer: boolean;
  } | null;

  vehicleVin: string | null;
  vehicleYear: number | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  nickname: string | null;
  plateNumber: string | null;

  status: GpsTerminalStatus;
  connectedAt: string | null;
  disconnectedAt: string | null;
  lastHeartbeatAt: string | null;

  reportIntervalSec: number | null;
  heartbeatIntervalSec: number | null;
  tcpReconnectSec: number | null;
  tcpReplySec: number | null;
  parameters: Record<string, unknown> | null;

  createdAt: string;
  updatedAt: string;
}

export interface GpsTerminalDetail extends GpsTerminal {
  _count?: {
    locations: number;
    alarms: number;
    dtcEvents: number;
    trips: number;
  };
}

export interface ProvisionTerminalBody {
  imei: string;
  phoneNumber?: string;
  iccid?: string;
  manufacturerId?: string;
  terminalModel?: string;
  hardwareVersion?: string;
  firmwareVersion?: string;
  vehicleVin?: string;
  vehicleYear?: number;
  vehicleMake?: string;
  vehicleModel?: string;
  nickname?: string;
  plateNumber?: string;
  ownerUserId?: string | null;
}

export interface GpsLocation {
  id: string;
  terminalId: string;
  reportedAt: string;
  serverReceivedAt?: string;
  latitude: number | string;   // Decimal serialises as string in some configs
  longitude: number | string;
  altitudeM: number | null;
  speedKmh: number | string | null;
  heading: number | null;
  accOn: boolean | null;
  gpsFix: boolean | null;
  satelliteCount: number | null;
  signalStrength: number | null;
  odometerKm: number | string | null;
  fuelLevelPct: number | string | null;
  externalVoltageMv: number | null;
  batteryVoltageMv: number | null;
  alarmBits: number | string;
  statusBits: number | string;
}

export interface GpsObdSnapshot {
  id: string;
  terminalId: string;
  reportedAt: string;
  vin: string | null;
  protocol: string | null;
  rpm: number | null;
  engineLoadPct: number | string | null;
  coolantTempC: number | null;
  intakeTempC: number | null;
  throttlePct: number | string | null;
  fuelLevelPct: number | string | null;
  speedKmh: number | string | null;
  batteryVoltageMv: number | null;
  milOn: boolean;
  dtcCount: number;
  storedDtcCodes: string[];
  pendingDtcCodes: string[];
  permanentDtcCodes: string[];
}

export type GpsAlarmSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type GpsAlarmType =
  | 'COLLISION'
  | 'SOS'
  | 'GEOFENCE_IN'
  | 'GEOFENCE_OUT'
  | 'OVERSPEED'
  | 'IDLING'
  | 'HARSH_BRAKE'
  | 'HARSH_ACCEL'
  | 'HARSH_TURN'
  | 'POWER_LOSS'
  | 'POWER_LOW'
  | 'TAMPER'
  | 'IGNITION_ON'
  | 'IGNITION_OFF'
  | 'GPS_BLOCKED'
  | 'OTHER';

/**
 * UI-side tri-state derived from `state` + `ack`. Not a backend type;
 * the section maps it to query params before calling listGpsAlarms.
 *   OPEN          → state='open',   ack=false  (active, needs attention)
 *   ACKNOWLEDGED  → state='open',   ack=true   (still open but seen)
 *   CLOSED        → state='closed'             (auto-closed by gateway)
 */
export type GpsAlarmStatus = 'OPEN' | 'ACKNOWLEDGED' | 'CLOSED';

export interface GpsAlarm {
  id: string;
  terminalId: string;
  ownerUserId: string | null;
  /**
   * The Prisma column is `type`. The backend serialises it to `alarmType`
   * on the wire; we keep the same name on the client so that filter
   * params, response objects, and WS events all use one identifier.
   */
  alarmType: GpsAlarmType;
  severity: GpsAlarmSeverity;
  openedAt: string;
  closedAt: string | null;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  acknowledgedByAdminId: string | null;
  acknowledgedByUserId: string | null;
  /**
   * Populated by the admin-scoped `listAlarms` / `getAlarmDetail` only,
   * via Prisma `include`. Either field can be set (rarely both) when an
   * alarm has been acknowledged. User-scoped routes don't include these
   * to keep the payload tight, so guard with optional access in the UI.
   */
  acknowledgedByAdmin?: { id: string; email: string } | null;
  acknowledgedByUser?: { id: string; email: string; fullName: string | null } | null;
  ackNote: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  speedKmh: number | string | null;
  vin: string | null;
  extraData: Record<string, unknown> | null;
  serviceAppointmentId: string | null;
  /**
   * Admin-scoped lists return a richer terminal block with vehicle
   * descriptors and the owner user — used by GpsAlarmsSection to render
   * vehicle labels and owner chips. User-scoped lists return only the
   * slim id/imei/nickname/vin fields.
   */
  terminal?: {
    id: string;
    imei: string;
    nickname: string | null;
    vehicleVin: string | null;
    vehicleYear?: number | null;
    vehicleMake?: string | null;
    vehicleModel?: string | null;
    ownerUser?: {
      id: string;
      email: string;
      fullName: string | null;
      isDealer: boolean;
    } | null;
  };
}

export interface GpsDtcEvent {
  id: string;
  terminalId: string;
  ownerUserId: string | null;
  reportedAt: string;
  vin: string;
  mileageKm: number | string | null;
  milOn: boolean;
  dtcCount: number;
  storedDtcCodes: string[];
  pendingDtcCodes: string[];
  permanentDtcCodes: string[];
  protocol: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  scanId?: string | null;       // populated when a Scan was promoted
  terminal?: {
    id: string;
    imei: string;
    nickname: string | null;
  };
}

export type GpsTripStatus = 'OPEN' | 'CLOSED';

export interface GpsTrip {
  id: string;
  terminalId: string;
  ownerUserId: string | null;
  status: GpsTripStatus;
  startAt: string;
  endAt: string | null;
  startLatitude: number | string | null;
  startLongitude: number | string | null;
  endLatitude: number | string | null;
  endLongitude: number | string | null;
  distanceKm: number | string;
  drivingSec: number;
  idleSec: number;
  maxSpeedKmh: number | string | null;
  avgSpeedKmh: number | string | null;
  harshEventCount: number;
  driverScore: number | null;
}

/**
 * Mirrors the Prisma `GpsCommandStatus` enum exactly. The backend Zod
 * schema (`listCommandsQuerySchema`) only accepts these literal values
 * for the `?status=` filter; anything else (e.g. the older `PENDING`)
 * returns 400 from the validator. Initial state is `QUEUED` (the gateway
 * hasn't yet picked up the row), and `EXPIRED` is set by the cron when a
 * QUEUED row sits too long without a live session to dispatch it on.
 */
export type GpsCommandStatus = 'QUEUED' | 'SENT' | 'ACKED' | 'FAILED' | 'EXPIRED';

export interface GpsCommand {
  id: string;
  terminalId: string;
  adminId: string | null;
  status: GpsCommandStatus;
  messageId: number | string | null;
  functionCode: number | null;
  kind: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
  sentAt: string | null;
  ackAt: string | null;
  errorText: string | null;
  terminal?: {
    id: string;
    imei: string;
    nickname: string | null;
  };
  admin?: { id: string; email: string } | null;
}

/**
 * NESTED shape returned by `/admin/gps/stats/overview`. Confirmed in
 * `gps-stats.service.ts:66-80`. The frontend reads nested fields directly
 * (e.g. `stats.terminals.online`, `stats.alarms.last24h`).
 */
export interface GpsOverviewStats {
  terminals: {
    total: number;
    online: number;
    offline: number;
    neverConnected: number;
    revoked: number;
    unpaired: number;
  };
  alarms: {
    last24h: number;
    criticalLast24h: number;
    unacknowledged: number;
  };
  dtcEvents: { last24h: number };
  trips: {
    open: number;
    closedLast24h: number;
    distanceKmLast24h: number;
    distanceKmLast7d: number;
  };
}

export interface AdminAuditEntry {
  id: string;
  adminId: string | null;
  admin?: { id: string; email: string } | null;
  method: string;
  path: string;
  statusCode: number;
  action: string;
  targetType: string | null;
  targetId: string | null;
  ip: string | null;
  userAgent: string | null;
  payload: Record<string, unknown> | null;
  errorText: string | null;
  createdAt: string;
}
