// API Configuration for VinTraxx SmartScan

export const API_CONFIG = {

  BASE_URL: 'https://api.vintraxx.com',

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

// Google OAuth configuration
export const GOOGLE_CONFIG = {
  WEB_CLIENT_ID: '701476871517-2h0qbn3hiovpp5mjlqu907op6rgktnf0.apps.googleusercontent.com',
  ANDROID_CLIENT_ID: '701476871517-for6b5esr0itht4cltqh2vmfhb07mjac.apps.googleusercontent.com',
  IOS_CLIENT_ID: '701476871517-2h0qbn3hiovpp5mjlqu907op6rgktnf0.apps.googleusercontent.com',
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

