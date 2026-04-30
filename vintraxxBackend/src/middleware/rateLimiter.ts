import rateLimit from 'express-rate-limit';
import { APP_CONSTANTS } from '../config/constants';

export const authRateLimiter = rateLimit({
  windowMs: APP_CONSTANTS.AUTH_RATE_LIMIT.windowMs,
  max: APP_CONSTANTS.AUTH_RATE_LIMIT.max,
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for OPTIONS preflight requests to allow CORS
  skip: (req) => req.method === 'OPTIONS',
});

export const scanRateLimiter = rateLimit({
  windowMs: APP_CONSTANTS.SCAN_RATE_LIMIT.windowMs,
  max: APP_CONSTANTS.SCAN_RATE_LIMIT.max,
  message: { success: false, error: 'Too many scan requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for OPTIONS preflight requests to allow CORS
  skip: (req) => req.method === 'OPTIONS',
});

/**
 * CRITICAL #7: per-IP cap on /dealer/send-email so even an authenticated
 * dealer can't be used as an open relay (10 messages / minute / IP). The
 * route also enforces isDealer + zod validation; this is the third line of
 * defence in case either gets bypassed by a future refactor.
 */
export const dealerEmailRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many email requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
});
