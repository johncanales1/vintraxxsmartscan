import { z } from 'zod';

export const checkEmailSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const sendOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    isDealer: z.boolean().optional(),
    pricePerLaborHour: z.number().positive().optional(),
    logoUrl: z.string().optional(),
    qrCodeUrl: z.string().optional(),
    // HIGH #12: the controller already reads `fullName` off the body and
    // persists it; without this it was technically allowed because zod
    // strips unknown keys silently, but a future tightening to .strict()
    // would have broken registration. Make the contract honest.
    fullName: z.string().min(1).max(120).optional(),
  }),
});

export const loginSchema = z.object({
  // CRITICAL #1: isDealer / pricePerLaborHour intentionally NOT accepted here.
  // Dealer promotion is admin-controlled. A client that still sends them gets
  // a normal 200 — Zod strips unknown keys silently — but the controller no
  // longer reads them either way.
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

export const googleAuthSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, 'Google ID token is required'),
  }),
});

export const microsoftAuthSchema = z.object({
  body: z.object({
    accessToken: z.string().min(1, 'Microsoft access token is required'),
  }),
});
