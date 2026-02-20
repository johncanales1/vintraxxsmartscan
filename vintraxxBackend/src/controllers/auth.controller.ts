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
    const { email, password } = req.body;
    const result = await authService.register(email, password);
    logger.info(`User registered: ${email}`);
    res.status(201).json({ success: true, user: result.user, token: result.token });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, user: result.user, token: result.token });
  } catch (error) {
    next(error);
  }
}
