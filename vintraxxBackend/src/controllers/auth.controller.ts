import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import logger from '../utils/logger';

export async function checkEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;
    const isRegistered = await authService.checkEmail(email);
    res.json({ success: true, isRegistered });
  } catch (error) {
    next(error);
  }
}

export async function sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;
    await authService.sendOtp(email);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    next(error);
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, otp } = req.body;
    await authService.verifyOtp(email, otp);
    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    next(error);
  }
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, isDealer, pricePerLaborHour, logoUrl, qrCodeUrl, fullName } = req.body;
    const result = await authService.register(email, password, isDealer, pricePerLaborHour, logoUrl, qrCodeUrl, fullName);
    logger.info(`User registered: ${email}, isDealer: ${isDealer || false}`);
    res.status(201).json({ success: true, user: result.user, token: result.token });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    // CRITICAL #1: do NOT accept isDealer / pricePerLaborHour from the body.
    // Allowing the client to flip its own dealer flag at login was a privilege
    // escalation. Dealer status is now granted only at registration or via
    // /admin/users/:id. The schema rejects extra fields with a validation error.
    const result = await authService.login(email, password);
    res.json({ success: true, user: result.user, token: result.token });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    res.json({ success: true, message: 'If an account exists with that email, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { idToken } = req.body;
    const result = await authService.googleAuth(idToken);
    res.json({ success: true, user: result.user, token: result.token });
  } catch (error) {
    next(error);
  }
}

export async function microsoftAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { accessToken } = req.body;
    const result = await authService.microsoftAuth(accessToken);
    res.json({ success: true, user: result.user, token: result.token });
  } catch (error) {
    next(error);
  }
}
