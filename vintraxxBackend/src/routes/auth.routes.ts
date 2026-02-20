import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authRateLimiter } from '../middleware/rateLimiter';
import {
  checkEmailSchema,
  sendOtpSchema,
  verifyOtpSchema,
  registerSchema,
  loginSchema,
} from '../schemas/auth.schema';

const router = Router();

router.post('/check-email', authRateLimiter, validateRequest(checkEmailSchema), authController.checkEmail);
router.post('/send-otp', authRateLimiter, validateRequest(sendOtpSchema), authController.sendOtp);
router.post('/verify-otp', authRateLimiter, validateRequest(verifyOtpSchema), authController.verifyOtp);
router.post('/register', authRateLimiter, validateRequest(registerSchema), authController.register);
router.post('/login', authRateLimiter, validateRequest(loginSchema), authController.login);

export default router;
