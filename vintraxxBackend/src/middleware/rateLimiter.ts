import rateLimit from 'express-rate-limit';
import { APP_CONSTANTS } from '../config/constants';

export const authRateLimiter = rateLimit({
  windowMs: APP_CONSTANTS.AUTH_RATE_LIMIT.windowMs,
  max: APP_CONSTANTS.AUTH_RATE_LIMIT.max,
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const scanRateLimiter = rateLimit({
  windowMs: APP_CONSTANTS.SCAN_RATE_LIMIT.windowMs,
  max: APP_CONSTANTS.SCAN_RATE_LIMIT.max,
  message: { success: false, error: 'Too many scan requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
