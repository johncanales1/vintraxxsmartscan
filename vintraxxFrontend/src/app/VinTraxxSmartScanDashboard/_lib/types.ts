/**
 * Types for the dealer GPS dashboard. Mirror the backend Prisma row shapes
 * AFTER the BigInt/Decimal serialisation polyfill (see
 * vintraxxBackend/src/utils/json-bigint-decimal-polyfill.ts) — therefore
 * `Decimal` columns arrive as `number` and `BigInt` columns as `number`.
 *
 * These types intentionally mirror the mobile types in vintraxxMobile/src/types
 * so a developer can read either side without a translation layer.
 */

// ── Terminal ────────────────────────────────────────────────────────────────

export type GpsTerminalStatus =
  | "NEVER_CONNECTED"
  | "ONLINE"
  | "OFFLINE"
  | "REVOKED";

export interface GpsTerminal {
  id: string;
  /**
   * Canonical JT/T 808 terminal identifier — the value the device transmits
   * in the BCD[6] header of every packet. Always present.
   */
  deviceIdentifier: string;
  /**
   * Optional 15-digit IMEI metadata (only populated for devices that emit
   * it via the 2019-spec 0x0102 auth body or were provisioned with one).
   * Never the gateway lookup key — see `deviceIdentifier`.
   */
  imei: string | null;
  phoneNumber: string | null;
  iccid: string | null;
  manufacturerId: string | null;
  terminalModel: string | null;
  hardwareVersion: string | null;
  firmwareVersion: string | null;
  ownerUserId: string | null;
  vehicleVin: string | null;
  vehicleYear: number | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  nickname: string | null;
  status: GpsTerminalStatus;
  connectedAt: string | null;
  disconnectedAt: string | null;
  lastHeartbeatAt: string | null;
  /** uint32, but emitted as Number by the backend polyfill. */
  lastAlarmBits: number;
  reportIntervalSec: number | null;
  heartbeatIntervalSec: number | null;
  tcpReconnectSec: number | null;
  tcpReplySec: number | null;
  parameters: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// ── Location ────────────────────────────────────────────────────────────────

export interface GpsLocation {
  id: string;
  terminalId: string;
  alarmBits: number;
  statusBits: number;
  latitude: number;
  longitude: number;
  altitudeM: number | null;
  speedKmh: number | null;
  heading: number | null;
  reportedAt: string;
  serverReceivedAt: string;
  accOn: boolean | null;
  gpsFix: boolean | null;
  satelliteCount: number | null;
  signalStrength: number | null;
  odometerKm: number | null;
  fuelLevelPct: number | null;
  externalVoltageMv: number | null;
  batteryVoltageMv: number | null;
  mcc: number | null;
  mnc: number | null;
  lac: number | null;
  cellId: number | null;
}

// ── OBD Snapshot ─────────────────────────────────────────────────────────────

/**
 * Mirrors the Prisma `GpsObdSnapshot` columns. Contains OBD-II data
 * reported by the D450/similar GPS tracker.
 */
export interface GpsObdSnapshot {
  id: string;
  terminalId: string;
  reportedAt: string;
  serverReceivedAt?: string;
  vin: string | null;
  rpm: number | null;
  /** Vehicle-bus speed reported by the OBD ECU (PID 0x0D). Km/h. */
  vehicleSpeedKmh: number | string | null;
  coolantTempC: number | null;
  intakeAirTempC: number | null;
  throttlePct: number | string | null;
  enginePowerKw: number | string | null;
  engineLoadPct: number | string | null;
  fuelPressureKpa: number | null;
  fuelRateLph: number | string | null;
  fuelConsumedL: number | string | null;
  /** External system voltage (Control-Module Voltage, PID 0x42), mV. */
  batteryVoltageMv: number | null;
  odometerKm: number | string | null;
  mafGps: number | string | null;
  o2Voltage: number | string | null;
  milOn: boolean | null;
  milDistanceKm: number | string | null;
  /** Vendor-specific PIDs not natively decoded — key is hex ("0x21"). */
  extraPidsJson: Record<string, unknown> | null;
}

// ── Alarms ──────────────────────────────────────────────────────────────────

export type GpsAlarmSeverity = "INFO" | "WARNING" | "CRITICAL";

export type GpsAlarmType =
  | "EMERGENCY_PANIC"
  | "OVERSPEED"
  | "FATIGUE_DRIVING"
  | "DANGEROUS"
  | "GNSS_FAULT"
  | "GNSS_ANTENNA_OPEN"
  | "GNSS_ANTENNA_SHORT"
  | "MAIN_POWER_UNDERVOLT"
  | "MAIN_POWER_LOSS"
  | "DISPLAY_FAULT"
  | "TTS_FAULT"
  | "CAMERA_FAULT"
  | "ICON_FAULT"
  | "DOWNLOAD_FAILURE"
  | "EXCEED_DAILY_DRIVE_TIME"
  | "TIMEOUT_PARKING"
  | "DOOR_AREA_VIOLATION"
  | "ROUTE_VIOLATION"
  | "DRIVE_TIME_EXCEEDED"
  | "OFFLINE"
  | "ENGINE_FAULT_LIGHT"
  | "OTHER";

export interface GpsAlarm {
  id: string;
  terminalId: string;
  ownerUserId: string | null;
  type: GpsAlarmType;
  severity: GpsAlarmSeverity;
  openedAt: string;
  closedAt: string | null;
  locationId: string | null;
  latitude: number | null;
  longitude: number | null;
  speedKmh: number | null;
  extraData: Record<string, unknown> | null;
  acknowledged: boolean;
  acknowledgedByAdminId: string | null;
  acknowledgedByUserId: string | null;
  acknowledgedAt: string | null;
  ackNote: string | null;
  serviceAppointmentId: string | null;
  createdAt: string;
}

// ── DTC events ──────────────────────────────────────────────────────────────

export interface GpsDtcEvent {
  id: string;
  terminalId: string;
  ownerUserId: string | null;
  vin: string | null;
  mileageKm: number | null;
  milOn: boolean;
  dtcCount: number;
  storedDtcCodes: string[];
  pendingDtcCodes: string[];
  permanentDtcCodes: string[];
  protocol: string | null;
  latitude: number | null;
  longitude: number | null;
  reportedAt: string;
  createdAt: string;
}

// ── GPS Full Scan Report (D450 Refresh flow) ────────────────────────────────

export type GpsScanReportStatus = "PENDING" | "COMPLETED" | "PARTIAL" | "FAILED" | "TIMED_OUT";

/**
 * Aggregated D450 scan result. Mirrors the BLE Scan shape but stays raw —
 * the AI write-up is produced separately by promoting this row into a Scan
 * via `POST /scan-reports/:id/promote-ai`.
 */
export interface GpsScanReport {
  id: string;
  terminalId: string;
  ownerUserId: string | null;
  requestedByAdminId: string | null;
  requestedByUserId: string | null;
  status: GpsScanReportStatus;
  requestedAt: string;
  completedAt: string | null;
  errorText: string | null;

  vin: string | null;
  vehicleYear: number | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  /** Decimal string from the backend; convert via Number() when rendering. */
  mileageKm: string | number | null;

  milOn: boolean | null;
  dtcCount: number | null;
  storedDtcCodes: string[];
  pendingDtcCodes: string[];
  permanentDtcCodes: string[];

  fuelSystemStatus: string | null;
  secondaryAirStatus: string | null;
  distanceWithMilKm: string | number | null;
  distanceSinceClearKm: string | number | null;
  warmupsSinceClear: number | null;
  runtimeSinceStartSec: number | null;

  rpm: number | null;
  vehicleSpeedKmh: string | number | null;
  coolantTempC: number | null;
  intakeAirTempC: number | null;
  throttlePct: string | number | null;
  engineLoadPct: string | number | null;
  mafGps: string | number | null;
  fuelLevelPct: string | number | null;
  fuelRailPressureKpa: number | null;
  batteryVoltageMv: number | null;
  ambientTempC: number | null;
  barometricKpa: number | null;
  acceleratorPct: string | number | null;
  intakeManifoldKpa: number | null;

  protocol: string | null;
  rawObdJson: {
    obdLive?: {
      timingAdvanceDeg?: number;
      longTermFuelTrimPct?: number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  } | null;

  promotedScanId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RequestScanReportResponse {
  scanReportId: string;
  reused: boolean;
}

export interface ScanReportEmailResponse {
  sentTo: string;
  pdfPath: string;
}

// ── Trips + stats ───────────────────────────────────────────────────────────

export type GpsTripStatus = "OPEN" | "CLOSED";

export interface GpsTrip {
  id: string;
  terminalId: string;
  ownerUserId: string | null;
  vin: string | null;
  status: GpsTripStatus;
  startAt: string;
  endAt: string | null;
  startLat: number | null;
  startLng: number | null;
  endLat: number | null;
  endLng: number | null;
  distanceKm: number | null;
  durationSec: number | null;
  maxSpeedKmh: number | null;
  avgSpeedKmh: number | null;
  harshAccelCount: number;
  harshBrakeCount: number;
  harshTurnCount: number;
  overspeedCount: number;
  idleDurationSec: number | null;
  fuelConsumedL: number | null;
  score: number | null;
  rawSummary: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface GpsTerminalDailyStat {
  id: string;
  terminalId: string;
  ownerUserId: string | null;
  day: string;
  distanceKm: number;
  tripCount: number;
  drivingSec: number;
  idleSec: number;
  alarmCount: number;
  harshEventCount: number;
  maxSpeedKmh: number | null;
  avgScore: number | null;
  createdAt: string;
}

// ── WebSocket events (mirror backend GpsEvent union) ────────────────────────

export interface WsLocationUpdate {
  type: "location.update";
  terminalId: string;
  ownerUserId: string | null;
  data: {
    reportedAt: string;
    latitude: number;
    longitude: number;
    speedKmh: number;
    heading: number;
    altitudeM: number;
    accOn: boolean;
    gpsFix: boolean;
    alarmBits: number;
    statusBits: number;
  };
}

// Each WS domain event uses a LITERAL `type` so TS' `Extract<U,{type:K}>`
// narrows correctly inside `gpsWs.on("...", handler)`. Avoid union-typed
// discriminators here.
interface WsTerminalStatusBase {
  terminalId: string;
  ownerUserId: string | null;
  at: string;
}
export interface WsTerminalOnline extends WsTerminalStatusBase {
  type: "terminal.online";
}
export interface WsTerminalOffline extends WsTerminalStatusBase {
  type: "terminal.offline";
}
export type WsTerminalStatus = WsTerminalOnline | WsTerminalOffline;

interface WsAlarmEventBase {
  terminalId: string;
  ownerUserId: string | null;
  alarmId: string;
  alarmType: string;
  severity: GpsAlarmSeverity;
  at: string;
}
export interface WsAlarmOpened extends WsAlarmEventBase {
  type: "alarm.opened";
}
export interface WsAlarmClosed extends WsAlarmEventBase {
  type: "alarm.closed";
}
export interface WsAlarmAcknowledged extends WsAlarmEventBase {
  type: "alarm.acknowledged";
}
export type WsAlarmEvent = WsAlarmOpened | WsAlarmClosed | WsAlarmAcknowledged;

export interface WsDtcEvent {
  type: "dtc.detected";
  terminalId: string;
  ownerUserId: string | null;
  dtcEventId: string;
  dtcCount: number;
  vin: string | null;
  at: string;
}

interface WsTripEventBase {
  terminalId: string;
  ownerUserId: string | null;
  tripId: string;
  at: string;
}
export interface WsTripOpened extends WsTripEventBase {
  type: "trip.opened";
}
export interface WsTripClosed extends WsTripEventBase {
  type: "trip.closed";
}
export type WsTripEvent = WsTripOpened | WsTripClosed;

export type WsDomainEvent =
  | WsLocationUpdate
  | WsTerminalOnline
  | WsTerminalOffline
  | WsAlarmOpened
  | WsAlarmClosed
  | WsAlarmAcknowledged
  | WsDtcEvent
  | WsTripOpened
  | WsTripClosed;

export interface WsWelcome {
  type: "welcome";
  userId: string;
  isAdmin: boolean;
  autoChannels: string[];
}

export interface WsSubscribed {
  type: "subscribed" | "unsubscribed";
  channels: string[];
  denied?: string[];
}

export interface WsPong {
  type: "pong";
}

export interface WsServerError {
  type: "error";
  /** Backend (`wsServer.ts`) sends the human description in `error`, not
   *  `reason`. Match the on-the-wire shape so consumers don't read undefined. */
  error: string;
}

export type WsInbound =
  | WsWelcome
  | WsSubscribed
  | WsPong
  | WsServerError
  | WsDomainEvent;

// ── REST envelopes ──────────────────────────────────────────────────────────

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface ListAlarmsResult {
  alarms: GpsAlarm[];
  total: number;
}

export interface ListDtcEventsResult {
  events: GpsDtcEvent[];
  total: number;
}

export interface ListTripsResult {
  trips: GpsTrip[];
  total: number;
}

export interface ListLocationsResult {
  locations: GpsLocation[];
}

// ── Final scan/report shape (already used by Overview's existing modal) ─────

export interface FullReportData {
  scanId: string;
  vehicle: {
    vin: string;
    year: number | null;
    make: string | null;
    model: string | null;
    mileage: number | null;
  };
  healthScore: number;
  overallStatus: "healthy" | "attention_needed" | "critical";
  dtcAnalysis: Array<{
    code: string;
    description: string;
    severity: "critical" | "moderate" | "minor" | "info";
    category: string;
    possibleCauses: string[];
    repairEstimate: { low: number; high: number };
    urgency: "immediate" | "soon" | "monitor";
  }>;
  repairRecommendations: Array<{
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    estimatedCost: { labor: number; parts: number; total: number };
  }>;
  emissionsAnalysis: {
    status: "pass" | "fail" | "incomplete";
    summary: string;
  };
  totalEstimatedRepairCost: number;
  additionalRepairs?: unknown[];
  additionalRepairsTotalCost?: number;
  grandTotalCost?: number;
  aiSummary: string;
  stockNumber?: string;
}

export interface AnalyzeDtcResponse {
  scanId: string;
  reused: boolean;
}
