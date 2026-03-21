import bcrypt from 'bcrypt';
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

export async function register(email: string, password: string, isDealer?: boolean, pricePerLaborHour?: number): Promise<{ user: { id: string; email: string; isDealer: boolean; pricePerLaborHour: number | null }; token: string }> {
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

  const user = await prisma.user.create({
    data: { email, passwordHash, isDealer: dealer, pricePerLaborHour: laborHourPrice },
  });

  await prisma.otp.deleteMany({ where: { email } });

  const token = generateToken({ userId: user.id, email: user.email });

  logger.info(`User registered: ${user.email}, isDealer: ${dealer}`);

  return {
    user: { id: user.id, email: user.email, isDealer: user.isDealer, pricePerLaborHour: user.pricePerLaborHour },
    token,
  };
}

export async function login(email: string, password: string, isDealer?: boolean, pricePerLaborHour?: number): Promise<{ user: { id: string; email: string; isDealer: boolean; pricePerLaborHour: number | null }; token: string }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
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
    user: { id: user.id, email: user.email, isDealer: user.isDealer, pricePerLaborHour: user.pricePerLaborHour },
    token,
  };
}

function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY } as jwt.SignOptions);
}
