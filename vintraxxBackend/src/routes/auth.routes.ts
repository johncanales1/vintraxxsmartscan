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
  forgotPasswordSchema,
  resetPasswordSchema,
  googleAuthSchema,
  microsoftAuthSchema,
} from '../schemas/auth.schema';

const router = Router();

router.post('/check-email', authRateLimiter, validateRequest(checkEmailSchema), authController.checkEmail);
router.post('/send-otp', authRateLimiter, validateRequest(sendOtpSchema), authController.sendOtp);
router.post('/verify-otp', authRateLimiter, validateRequest(verifyOtpSchema), authController.verifyOtp);
router.post('/register', authRateLimiter, validateRequest(registerSchema), authController.register);
router.post('/login', authRateLimiter, validateRequest(loginSchema), authController.login);
router.post('/forgot-password', authRateLimiter, validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authRateLimiter, validateRequest(resetPasswordSchema), authController.resetPassword);
router.post('/google', authRateLimiter, validateRequest(googleAuthSchema), authController.googleAuth);
router.post('/microsoft', authRateLimiter, validateRequest(microsoftAuthSchema), authController.microsoftAuth);

export default router;
