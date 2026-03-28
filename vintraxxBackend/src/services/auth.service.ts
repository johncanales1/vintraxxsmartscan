import bcrypt from 'bcrypt';
import crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { APP_CONSTANTS } from '../config/constants';
import { JwtPayload } from '../types';
import { AppError } from '../middleware/errorHandler';
import { generateOtpCode } from '../utils/helpers';
import logger from '../utils/logger';
import prisma from '../config/db';

export async function checkEmail(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { email } });
  return !!user;
}

export async function sendOtp(email: string): Promise<void> {
  const code = generateOtpCode(APP_CONSTANTS.OTP_LENGTH);
  const expiresAt = new Date(Date.now() + APP_CONSTANTS.OTP_TTL_MINUTES * 60 * 1000);

  await prisma.otp.deleteMany({ where: { email } });

  await prisma.otp.create({
    data: { email, code, expiresAt },
  });

  try {
    if (env.NODE_ENV !== 'test') {
      const { sendOtpEmail } = await import('./email.service');
      await sendOtpEmail(email, code);
    }
  } catch (error) {
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
): Promise<{ user: { id: string; email: string; isDealer: boolean; pricePerLaborHour: number | null; logoUrl: string | null }; token: string }> {
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
  const logo = dealer && logoUrl ? logoUrl : null;

  const user = await prisma.user.create({
    data: { email, passwordHash, isDealer: dealer, pricePerLaborHour: laborHourPrice, logoUrl: logo },
  });

  await prisma.otp.deleteMany({ where: { email } });

  const token = generateToken({ userId: user.id, email: user.email });

  logger.info(`User registered: ${user.email}, isDealer: ${dealer}`);

  return {
    user: { id: user.id, email: user.email, isDealer: user.isDealer, pricePerLaborHour: user.pricePerLaborHour, logoUrl: user.logoUrl },
    token,
  };
}

export async function login(email: string, password: string, isDealer?: boolean, pricePerLaborHour?: number): Promise<{ user: { id: string; email: string; isDealer: boolean; pricePerLaborHour: number | null; logoUrl: string | null }; token: string }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.passwordHash) {
    throw new AppError('This account uses social login. Please sign in with Google or Microsoft.', 401);
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
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
    user: { id: user.id, email: user.email, isDealer: user.isDealer, pricePerLaborHour: user.pricePerLaborHour, logoUrl: user.logoUrl },
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

export async function googleAuth(idToken: string): Promise<{ user: { id: string; email: string; isDealer: boolean; pricePerLaborHour: number | null; logoUrl: string | null }; token: string }> {
  if (!env.GOOGLE_CLIENT_ID) {
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

    // Verify audience matches our client ID
    if ((payload as any).aud !== env.GOOGLE_CLIENT_ID) {
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
    user: { id: user.id, email: user.email, isDealer: user.isDealer, pricePerLaborHour: user.pricePerLaborHour, logoUrl: user.logoUrl },
    token,
  };
}

export async function microsoftAuth(accessToken: string): Promise<{ user: { id: string; email: string; isDealer: boolean; pricePerLaborHour: number | null; logoUrl: string | null }; token: string }> {
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
    user: { id: user.id, email: user.email, isDealer: user.isDealer, pricePerLaborHour: user.pricePerLaborHour, logoUrl: user.logoUrl },
    token,
  };
}

function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY } as jwt.SignOptions);
}
