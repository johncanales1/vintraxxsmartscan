import bcrypt from 'bcrypt';
import crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { APP_CONSTANTS } from '../config/constants';
import { JwtPayload } from '../types';
import { AppError } from '../middleware/errorHandler';
import { generateOtpCode } from '../utils/helpers';
import logger from '../utils/logger';
import prisma from '../config/db';

// Directories for dealer assets
const LOGO_DIR = path.join(__dirname, '../assets/dealer-logos');
const QR_CODE_DIR = path.join(__dirname, '../assets/dealer-qrcodes');

// Ensure directories exist
if (!fs.existsSync(LOGO_DIR)) {
  fs.mkdirSync(LOGO_DIR, { recursive: true });
}
if (!fs.existsSync(QR_CODE_DIR)) {
  fs.mkdirSync(QR_CODE_DIR, { recursive: true });
}

export async function checkEmail(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { email } });
  return !!user;
}

export async function sendOtp(email: string): Promise<void> {
  const startMs = Date.now();
  const code = generateOtpCode(APP_CONSTANTS.OTP_LENGTH);
  const expiresAt = new Date(Date.now() + APP_CONSTANTS.OTP_TTL_MINUTES * 60 * 1000);

  const deleted = await prisma.otp.deleteMany({ where: { email } });
  logger.info('OTP: cleared previous codes', { email, deletedCount: deleted.count });

  const otpRecord = await prisma.otp.create({
    data: { email, code, expiresAt },
  });
  logger.info('OTP: code created in DB', { email, otpId: otpRecord.id, expiresAt: expiresAt.toISOString() });

  try {
    if (env.NODE_ENV !== 'test') {
      const { sendOtpEmail } = await import('./email.service');
      await sendOtpEmail(email, code);
      logger.info('OTP: email dispatch completed', { email, durationMs: Date.now() - startMs });
    }
  } catch (error) {
    logger.error('OTP: email dispatch failed, rolling back DB record', {
      email,
      error: (error as Error).message,
      durationMs: Date.now() - startMs,
    });
    await prisma.otp.deleteMany({ where: { email, code } });
    throw new AppError('Failed to send verification code. Please try again later.', 502);
  }

  if (env.NODE_ENV !== 'production') {
    logger.info(`[DEV] OTP for ${email}: ${code}`);
  }
}

export async function verifyOtp(email: string, otp: string): Promise<boolean> {
  const record = await prisma.otp.findFirst({
    where: {
      email,
      code: otp,
      verified: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    throw new AppError('Invalid or expired OTP', 400);
  }

  await prisma.otp.update({
    where: { id: record.id },
    data: { verified: true },
  });

  return true;
}

export async function register(
  email: string,
  password: string,
  isDealer?: boolean,
  pricePerLaborHour?: number,
  logoUrl?: string,
  qrCodeUrl?: string,
): Promise<{ user: { id: string; email: string; isDealer: boolean; pricePerLaborHour: number | null; logoUrl: string | null; originalLogoUrl: string | null; qrCodeUrl: string | null }; token: string }> {
  const verifiedOtp = await prisma.otp.findFirst({
    where: {
      email,
      verified: true,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!verifiedOtp) {
    throw new AppError('Email not verified. Please verify OTP first.', 400);
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(password, APP_CONSTANTS.BCRYPT_SALT_ROUNDS);

  const dealer = isDealer === true;
  const laborHourPrice = dealer && pricePerLaborHour ? pricePerLaborHour : null;
  
  // Process base64 images into files (like dealer.controller.ts does)
  const apiBase = env.NODE_ENV === 'production' 
    ? 'https://api.vintraxx.com' 
    : 'http://localhost:3000';
  
  let processedLogoUrl: string | null = null;
  let processedQrCodeUrl: string | null = null;
  
  // Generate a temporary user ID for file naming (will use actual ID after creation)
  const tempId = crypto.randomUUID();
  
  // Process logo image if provided as base64
  if (dealer && logoUrl && typeof logoUrl === 'string' && logoUrl.startsWith('data:image/')) {
    const matches = logoUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (matches) {
      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const base64Data = matches[2];
      const filename = `${tempId}-${Date.now()}.${ext}`;
      const filePath = path.join(LOGO_DIR, filename);
      
      try {
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        processedLogoUrl = `${apiBase}/assets/dealer-logos/${filename}`;
        logger.info(`Registration: Saved logo file: ${filename}`);
      } catch (err) {
        logger.error('Registration: Failed to save logo file', err);
      }
    }
  } else if (dealer && logoUrl) {
    // If it's already a URL, use it as-is
    processedLogoUrl = logoUrl;
  }
  
  // Process QR code image if provided as base64
  if (dealer && qrCodeUrl && typeof qrCodeUrl === 'string' && qrCodeUrl.startsWith('data:image/')) {
    const matches = qrCodeUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (matches) {
      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const base64Data = matches[2];
      const filename = `qr-${tempId}-${Date.now()}.${ext}`;
      const filePath = path.join(QR_CODE_DIR, filename);
      
      try {
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        processedQrCodeUrl = `${apiBase}/assets/dealer-qrcodes/${filename}`;
        logger.info(`Registration: Saved QR code file: ${filename}`);
      } catch (err) {
        logger.error('Registration: Failed to save QR code file', err);
      }
    }
  } else if (dealer && qrCodeUrl) {
    // If it's already a URL, use it as-is
    processedQrCodeUrl = qrCodeUrl;
  }

  const user = await prisma.user.create({
    data: { email, passwordHash, isDealer: dealer, pricePerLaborHour: laborHourPrice, logoUrl: processedLogoUrl, qrCodeUrl: processedQrCodeUrl },
  });

  await prisma.otp.deleteMany({ where: { email } });

  const token = generateToken({ userId: user.id, email: user.email });

  logger.info(`User registered: ${user.email}, isDealer: ${dealer}`);

  return {
    user: { id: user.id, email: user.email, isDealer: user.isDealer, pricePerLaborHour: user.pricePerLaborHour, logoUrl: user.logoUrl, originalLogoUrl: user.originalLogoUrl, qrCodeUrl: user.qrCodeUrl },
    token,
  };
}

export async function login(email: string, password: string, isDealer?: boolean, pricePerLaborHour?: number): Promise<{ user: { id: string; email: string; isDealer: boolean; pricePerLaborHour: number | null; logoUrl: string | null; originalLogoUrl: string | null; qrCodeUrl: string | null }; token: string }> {
  logger.info('User login attempt', { email, hasPassword: !!password });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    logger.warn('User login failed: email not found', { email });
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.passwordHash) {
    logger.warn('User login failed: no password hash (OAuth account)', { email });
    throw new AppError('This account uses social login. Please sign in with Google or Microsoft.', 401);
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    logger.warn('User login failed: wrong password', { email });
    throw new AppError('Invalid email or password', 401);
  }

  // If user is signing in as dealer and providing pricePerLaborHour, update their profile
  if (isDealer === true) {
    const updateData: { isDealer: boolean; pricePerLaborHour?: number } = { isDealer: true };
    if (pricePerLaborHour) {
      updateData.pricePerLaborHour = pricePerLaborHour;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });
    user.isDealer = true;
    if (pricePerLaborHour) {
      user.pricePerLaborHour = pricePerLaborHour;
    }
  }

  const token = generateToken({ userId: user.id, email: user.email });

  logger.info(`User logged in: ${user.email}, isDealer: ${user.isDealer}`);

  return {
    user: { id: user.id, email: user.email, isDealer: user.isDealer, pricePerLaborHour: user.pricePerLaborHour, logoUrl: user.logoUrl, originalLogoUrl: user.originalLogoUrl, qrCodeUrl: user.qrCodeUrl },
    token,
  };
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Don't reveal whether email exists - always return success
    logger.info(`Password reset requested for non-existent email: ${email}`);
    return;
  }

  if (!user.passwordHash) {
    // User registered via OAuth, no password to reset
    logger.info(`Password reset requested for OAuth user: ${email}`);
    return;
  }

  // Invalidate previous reset tokens
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token: resetToken, expiresAt },
  });

  const resetLink = `${env.APP_URL}/reset-password?token=${resetToken}`;

  try {
    if (env.NODE_ENV !== 'test') {
      const { sendPasswordResetEmail } = await import('./email.service');
      await sendPasswordResetEmail(email, resetLink);
    }
  } catch (error) {
    logger.error('Failed to send password reset email', { email, error: (error as Error).message });
    throw new AppError('Failed to send reset email. Please try again later.', 502);
  }

  if (env.NODE_ENV !== 'production') {
    logger.info(`[DEV] Password reset link for ${email}: ${resetLink}`);
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken) {
    throw new AppError('Invalid or expired reset link.', 400);
  }

  if (resetToken.usedAt) {
    throw new AppError('This reset link has already been used.', 400);
  }

  if (resetToken.expiresAt < new Date()) {
    throw new AppError('This reset link has expired. Please request a new one.', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, APP_CONSTANTS.BCRYPT_SALT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  logger.info(`Password reset successful for user: ${resetToken.user.email}`);
}

export async function googleAuth(idToken: string): Promise<{ user: { id: string; email: string; isDealer: boolean; pricePerLaborHour: number | null; logoUrl: string | null; originalLogoUrl: string | null; qrCodeUrl: string | null }; token: string }> {
  // Valid Google OAuth client IDs for this project (Web, iOS, Android)
  const VALID_GOOGLE_CLIENT_IDS = [
    env.GOOGLE_CLIENT_ID, // Backend/Web client ID from env
    '701476871517-for6b5esr0itht4cltqh2vmfhb07mjac.apps.googleusercontent.com', // Web client ID (used as webClientId in mobile)
    '701476871517-2h0qbn3hiovpp5mjlqu907op6rgktnf0.apps.googleusercontent.com', // iOS/Android client ID
  ].filter(Boolean) as string[];

  if (VALID_GOOGLE_CLIENT_IDS.length === 0) {
    throw new AppError('Google authentication is not configured.', 500);
  }

  // Verify the Google ID token by calling Google's tokeninfo endpoint
  let payload: { sub: string; email: string; email_verified: boolean };
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!response.ok) {
      throw new Error('Invalid token');
    }
    payload = await response.json() as { sub: string; email: string; email_verified: boolean; aud: string };

    // Verify audience matches one of our valid client IDs
    const tokenAud = (payload as any).aud;
    if (!VALID_GOOGLE_CLIENT_IDS.includes(tokenAud)) {
      logger.warn('Google token audience mismatch', { received: tokenAud, expected: VALID_GOOGLE_CLIENT_IDS });
      throw new Error('Token audience mismatch');
    }
  } catch (error) {
    logger.warn('Google token verification failed', { error: (error as Error).message });
    throw new AppError('Invalid Google credentials.', 401);
  }

  if (!payload.email || !payload.email_verified) {
    throw new AppError('Google account email not verified.', 401);
  }

  // Find user by googleId or email
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: payload.sub }, { email: payload.email }] },
  });

  if (user) {
    // Link Google ID if not already linked
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: payload.sub, authProvider: user.authProvider === 'email' ? 'email,google' : user.authProvider.includes('google') ? user.authProvider : `${user.authProvider},google` },
      });
    }
  } else {
    // Create new dealer user
    user = await prisma.user.create({
      data: {
        email: payload.email,
        googleId: payload.sub,
        authProvider: 'google',
        isDealer: true,
      },
    });
    logger.info(`New user registered via Google: ${user.email}`);
  }

  const token = generateToken({ userId: user.id, email: user.email });

  logger.info(`User logged in via Google: ${user.email}`);

  return {
    user: { id: user.id, email: user.email, isDealer: user.isDealer, pricePerLaborHour: user.pricePerLaborHour, logoUrl: user.logoUrl, originalLogoUrl: user.originalLogoUrl, qrCodeUrl: user.qrCodeUrl },
    token,
  };
}

export async function microsoftAuth(accessToken: string): Promise<{ user: { id: string; email: string; isDealer: boolean; pricePerLaborHour: number | null; logoUrl: string | null; originalLogoUrl: string | null; qrCodeUrl: string | null }; token: string }> {
  if (!env.MICROSOFT_CLIENT_ID) {
    throw new AppError('Microsoft authentication is not configured.', 500);
  }

  // Use the access token to get user info from Microsoft Graph
  let msUser: { id: string; mail?: string; userPrincipalName: string };
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error('Invalid token');
    }
    msUser = await response.json() as { id: string; mail?: string; userPrincipalName: string };
  } catch (error) {
    logger.warn('Microsoft token verification failed', { error: (error as Error).message });
    throw new AppError('Invalid Microsoft credentials.', 401);
  }

  const email = msUser.mail || msUser.userPrincipalName;
  if (!email) {
    throw new AppError('Could not retrieve email from Microsoft account.', 401);
  }

  // Find user by microsoftId or email
  let user = await prisma.user.findFirst({
    where: { OR: [{ microsoftId: msUser.id }, { email }] },
  });

  if (user) {
    // Link Microsoft ID if not already linked
    if (!user.microsoftId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { microsoftId: msUser.id, authProvider: user.authProvider === 'email' ? 'email,microsoft' : user.authProvider.includes('microsoft') ? user.authProvider : `${user.authProvider},microsoft` },
      });
    }
  } else {
    // Create new dealer user
    user = await prisma.user.create({
      data: {
        email,
        microsoftId: msUser.id,
        authProvider: 'microsoft',
        isDealer: true,
      },
    });
    logger.info(`New user registered via Microsoft: ${user.email}`);
  }

  const token = generateToken({ userId: user.id, email: user.email });

  logger.info(`User logged in via Microsoft: ${user.email}`);

  return {
    user: { id: user.id, email: user.email, isDealer: user.isDealer, pricePerLaborHour: user.pricePerLaborHour, logoUrl: user.logoUrl, originalLogoUrl: user.originalLogoUrl, qrCodeUrl: user.qrCodeUrl },
    token,
  };
}

function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY } as jwt.SignOptions);
}
