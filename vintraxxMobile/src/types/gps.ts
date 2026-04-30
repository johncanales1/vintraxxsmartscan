// GPS API types — mirror backend response shapes from /api/v1/gps/*
// Single source of truth referenced by GpsApiService, GpsWsClient, and screens.

// ================================================================
// CORE ENTITIES
// ================================================================

export type GpsTerminalStatus =
  | 'NEVER_CONNECTED'
  | 'ONLINE'
  | 'OFFLINE'
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
  vehicleVin: string | null;
  vehicleYear: number | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  nickname: string | null;
  /** License plate (free-form, varies by jurisdiction). Backend column. */
  plateNumber: string | null;
  status: GpsTerminalStatus;
  connectedAt: string | null;
  disconnectedAt: string | null;
  lastHeartbeatAt: string | null;
  reportIntervalSec: number | null;
  heartbeatIntervalSec: number | null;
  parameters?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface GpsLocation {
  id: string;
  terminalId: string;
  reportedAt: string;
  serverReceivedAt: string;
  latitude: number;
  longitude: number;
  altitudeM: number | null;
  speedKmh: number | null;
  heading: number | null;
  alarmBits: number;
  statusBits: number;
  accOn: boolean | null;
  gpsFix: boolean | null;
  satelliteCount: number | null;
  signalStrength: number | null;
  odometerKm: number | null;
  fuelLevelPct: number | null;
  externalVoltageMv: number | null;
  batteryVoltageMv: number | null;
}

export type GpsAlarmSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type GpsAlarmType =
  | 'COLLISION'
  | 'ROLLOVER'
  | 'TOW'
  | 'POWER_LOST'
  | 'SOS'
  | 'OVERSPEED'
  | 'GEOFENCE_ENTER'
  | 'GEOFENCE_EXIT'
  | 'HARSH_ACCEL'
  | 'HARSH_BRAKE'
  | 'HARSH_TURN'
  | 'IDLE'
  | 'LOW_VOLTAGE'
  | 'DTC_DETECTED'
  | 'MIL_ON'
  | 'TAMPER'
  | 'OTHER';

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
  /** Free-form JSON the gateway captured at alarm time (sensor values,
   *  raw alarm bits, vendor-specific extension data). Shape varies by
   *  alarm type. */
  extraData?: Record<string, unknown> | null;
  acknowledged: boolean;
  acknowledgedByAdminId: string | null;
  acknowledgedByUserId: string | null;
  acknowledgedAt: string | null;
  ackNote: string | null;
  serviceAppointmentId: string | null;
  createdAt: string;
  // Optional populated relation when the backend `include`s it.
  terminal?: Pick<
    GpsTerminal,
    'id' | 'nickname' | 'vehicleVin' | 'vehicleYear' | 'vehicleMake' | 'vehicleModel'
  >;
}

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
  terminal?: Pick<
    GpsTerminal,
    'id' | 'nickname' | 'vehicleVin' | 'vehicleYear' | 'vehicleMake' | 'vehicleModel'
  >;
}

export type GpsTripStatus = 'OPEN' | 'CLOSED';

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
  createdAt: string;
  updatedAt: string;
}

export interface GpsTripDetail extends GpsTrip {
  /** Optional polyline points returned by /trips/:tripId — backend may
   *  include a thinned-down location array for map rendering. */
  locations?: Array<{
    reportedAt: string;
    latitude: number;
    longitude: number;
    speedKmh: number | null;
    heading: number | null;
  }>;
}

export interface GpsDailyStats {
  id: string;
  terminalId: string;
  ownerUserId: string | null;
  day: string; // YYYY-MM-DD
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

// ================================================================
// LIST / DETAIL ENVELOPES
// ================================================================
// The backend uses {success, page, limit, total, totalPages, <items>} for
// paged responses where the array property is named after the entity. We
// declare each shape explicitly below for type-safety in the API client.

export interface ListTerminalsResponse {
  success: boolean;
  terminals: GpsTerminal[];
}

export interface TerminalDetailResponse {
  success: boolean;
  terminal: GpsTerminal;
}

export interface LatestLocationResponse {
  success: boolean;
  location: GpsLocation | null;
}

export interface LocationHistoryResponse {
  success: boolean;
  locations: GpsLocation[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListAlarmsResponse {
  success: boolean;
  alarms: GpsAlarm[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AlarmDetailResponse {
  success: boolean;
  alarm: GpsAlarm;
}

export interface AckAlarmResponse {
  success: boolean;
  alarm: GpsAlarm;
}

export interface ListDtcEventsResponse {
  success: boolean;
  events: GpsDtcEvent[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DtcEventDetailResponse {
  success: boolean;
  event: GpsDtcEvent;
}

export interface ListTripsResponse {
  success: boolean;
  trips: GpsTrip[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TripDetailResponse {
  success: boolean;
  trip: GpsTripDetail;
}

export interface DailyStatsResponse {
  success: boolean;
  /** Backend returns rows under `days` (inherited from `listDailyStats` in
   *  `gps-trip-query.service.ts`). The previous `stats` field name produced
   *  `undefined` at runtime. (Bug #H6) */
  days: GpsDailyStats[];
  /** UTC-midnight ISO timestamps of the requested range (inclusive). */
  since: string;
  until: string;
}

// ================================================================
// MOBILE-ONLY ENDPOINTS (Phase 5)
// ================================================================

export interface RegisterPushTokenRequest {
  platform: 'ios' | 'android';
  token: string;
  appVersion?: string;
}

export interface SimpleSuccessResponse {
  success: boolean;
  message?: string;
  removed?: boolean;
}

export interface RenameTerminalRequest {
  nickname: string;
}

export interface LocateCommandResponse {
  success: boolean;
  command: { id: string; status: string; createdAt: string };
}

export interface AnalyzeDtcEventResponse {
  success: boolean;
  scanId: string;
  reused: boolean;
}

// ================================================================
// WEBSOCKET EVENT UNION
// ================================================================

export interface WsLocationUpdate {
  type: 'location.update';
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

export interface WsTerminalStatus {
  type: 'terminal.online' | 'terminal.offline';
  terminalId: string;
  ownerUserId: string | null;
  at: string;
}

export interface WsAlarmEvent {
  type: 'alarm.opened' | 'alarm.closed' | 'alarm.acknowledged';
  terminalId: string;
  ownerUserId: string | null;
  alarmId: string;
  alarmType: string;
  severity: GpsAlarmSeverity;
  at: string;
}

export interface WsDtcEvent {
  type: 'dtc.detected';
  terminalId: string;
  ownerUserId: string | null;
  dtcEventId: string;
  dtcCount: number;
  vin: string | null;
  at: string;
}

export interface WsTripEvent {
  type: 'trip.opened' | 'trip.closed';
  terminalId: string;
  ownerUserId: string | null;
  tripId: string;
  at: string;
}

export interface WsWelcome {
  type: 'welcome';
  userId: string;
  isAdmin: boolean;
  autoChannels: string[];
}

export interface WsSubscribed {
  type: 'subscribed' | 'unsubscribed';
  channels: string[];
  denied?: string[];
}

export interface WsPong {
  type: 'pong';
}

export interface WsErrorFrame {
  type: 'error';
  error: string;
}

export type WsInboundEvent =
  | WsWelcome
  | WsSubscribed
  | WsPong
  | WsErrorFrame
  | WsLocationUpdate
  | WsTerminalStatus
  | WsAlarmEvent
  | WsDtcEvent
  | WsTripEvent;
