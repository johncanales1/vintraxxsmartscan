import { z } from 'zod';

/**
 * Two-step admin login validation:
 *   step 1 — POST /admin/login            → email + password
 *   step 2 — POST /admin/login/verify-otp → email + 6-digit code
 *
 * The OTP itself is created server-side after step 1 succeeds and is
 * delivered out-of-band (email). Always-on per product decision: every
 * admin login requires a fresh code, no "remember device" trust.
 */

const emailField = z.string().email('Invalid email address').max(254);

export const adminLoginBodySchema = z.object({
  body: z.object({
    email: emailField,
    password: z.string().min(1, 'Password is required'),
  }),
});

export const adminLoginVerifyOtpBodySchema = z.object({
  body: z.object({
    email: emailField,
    code: z
      .string()
      .regex(/^\d{6}$/, 'OTP must be a 6-digit numeric code'),
  }),
});
