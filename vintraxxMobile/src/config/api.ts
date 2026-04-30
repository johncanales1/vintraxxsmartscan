// API Configuration for VinTraxx SmartScan
//
// Bug #M4 / #M5: runtime URLs and OAuth client IDs are read from the
// gitignored `./env.ts` (copy `./env.example.ts` and replace placeholders).
// This lets the same code build against dev / staging / prod without edits
// and keeps OAuth client IDs out of version control.

import { ENV } from './env';

export const API_CONFIG = {

  BASE_URL: ENV.API_BASE_URL,

  /** WebSocket base, e.g. `wss://api.vintraxx.com`. Consumed by GpsWsClient. */
  WS_BASE_URL: ENV.WS_BASE_URL,

  TIMEOUT: 30000, // 30 seconds

  POLL_INTERVAL: 3000, // 3 seconds for report polling

  MAX_POLL_ATTEMPTS: 120, // 6 minutes max polling (120 * 3s)

};



// Auth endpoints (prefix: /api/v1/auth)

export const AUTH_ENDPOINTS = {

  CHECK_EMAIL: '/api/v1/auth/check-email',

  SEND_OTP: '/api/v1/auth/send-otp',

  VERIFY_OTP: '/api/v1/auth/verify-otp',

  REGISTER: '/api/v1/auth/register',

  LOGIN: '/api/v1/auth/login',

  FORGOT_PASSWORD: '/api/v1/auth/forgot-password',

  RESET_PASSWORD: '/api/v1/auth/reset-password',

  GOOGLE: '/api/v1/auth/google',

};

// Google OAuth configuration. Sourced from `./env.ts` (Bug #M4).
// Note: WEB_CLIENT_ID (client_type: 3) is used for token verification on backend.
// IOS_CLIENT_ID should match CLIENT_ID in GoogleService-Info.plist and MUST
// be a different OAuth client than ANDROID_CLIENT_ID (each is tied to that
// platform's bundle id / SHA fingerprint).
export const GOOGLE_CONFIG = {
  WEB_CLIENT_ID: ENV.GOOGLE_WEB_CLIENT_ID,
  ANDROID_CLIENT_ID: ENV.GOOGLE_ANDROID_CLIENT_ID,
  IOS_CLIENT_ID: ENV.GOOGLE_IOS_CLIENT_ID,
};



// Scan endpoints (prefix: /api/v1/scan) - all require auth

export const SCAN_ENDPOINTS = {

  SUBMIT: '/api/v1/scan/submit',

  REPORT: '/api/v1/scan/report', // append /:scanId

  HISTORY: '/api/v1/scan/history',

};

// Appraisal endpoints (prefix: /api/v1/appraisal) - all require auth

export const APPRAISAL_ENDPOINTS = {

  VALUATE: '/api/v1/appraisal/valuate',

  EMAIL: '/api/v1/appraisal/email',

  PDF: '/api/v1/appraisal/pdf',

  DASHBOARD: '/api/v1/appraisal/dashboard', // GET for list, GET /:appraisalId for single

};

// Schedule endpoints (prefix: /api/v1/schedule) - requires auth

export const SCHEDULE_ENDPOINTS = {

  SUBMIT: '/api/v1/schedule/submit',

};

// GPS endpoints (prefix: /api/v1/gps) - all require auth.
// Paths with `:param` placeholders are interpolated at call-site.
export const GPS_ENDPOINTS = {
  TERMINALS:                '/api/v1/gps/terminals',
  TERMINAL_DETAIL:          '/api/v1/gps/terminals/:id',
  TERMINAL_LATEST:          '/api/v1/gps/terminals/:id/latest',
  TERMINAL_LOCATIONS:       '/api/v1/gps/terminals/:id/locations',
  TERMINAL_RENAME:          '/api/v1/gps/terminals/:id/label',
  TERMINAL_LOCATE:          '/api/v1/gps/terminals/:id/locate',
  TERMINAL_TRIPS:           '/api/v1/gps/terminals/:id/trips',
  TERMINAL_TRIP_DETAIL:     '/api/v1/gps/terminals/:id/trips/:tripId',
  TERMINAL_STATS:           '/api/v1/gps/terminals/:id/stats',
  ALARMS:                   '/api/v1/gps/alarms',
  ALARM_DETAIL:             '/api/v1/gps/alarms/:id',
  ALARM_ACK:                '/api/v1/gps/alarms/:id/ack',
  DTC_EVENTS:               '/api/v1/gps/dtc-events',
  DTC_EVENT_DETAIL:         '/api/v1/gps/dtc-events/:id',
  DTC_EVENT_ANALYZE:        '/api/v1/gps/dtc-events/:id/analyze',
  PUSH_TOKEN:               '/api/v1/gps/devices/push-token',
};

// WebSocket configuration for live GPS events.
// Backend mounts at GPS_WS_PATH (default `/ws`) on the same host as the API.
// Token is passed via the `?token=` query string per `wsServer.authenticateUpgrade`.
export const GPS_WS_CONFIG = {
  // Derived once at use-site by replacing `https://` → `wss://`.
  PATH: '/ws',
  PING_INTERVAL_MS: 25_000,
  IDLE_TIMEOUT_MS: 90_000,
  RECONNECT_BASE_MS: 1_000,
  RECONNECT_MAX_MS: 30_000,
};

