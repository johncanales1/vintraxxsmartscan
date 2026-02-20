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

};



// Scan endpoints (prefix: /api/v1/scan) - all require auth

export const SCAN_ENDPOINTS = {

  SUBMIT: '/api/v1/scan/submit',

  REPORT: '/api/v1/scan/report', // append /:scanId

  HISTORY: '/api/v1/scan/history',

};

