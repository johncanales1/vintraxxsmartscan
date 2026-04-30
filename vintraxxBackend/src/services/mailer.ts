/**
 * mailer — single owner of the SMTP transporter and verify-cache.
 *
 * MEDIUM #21: previously each email-emitting module (email.service,
 * appraisal-email.service, dealer.controller, schedule.controller,
 * admin.service) created its OWN nodemailer transporter. That meant:
 *   • redundant TCP/TLS handshakes on cold paths,
 *   • the verify-cache logic was copy-pasted in two places (drift risk),
 *   • per-request `nodemailer.createTransport(...)` calls in
 *     dealer.controller leaked socket descriptors over time.
 *
 * Centralising here gives the process exactly ONE transporter and ONE
 * cache. All consumers MUST import from this module — direct
 * `nodemailer.createTransport(...)` is now a code smell.
 */

import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env';
import logger from '../utils/logger';
import { EmailServiceUnavailableError, isSmtpAvailabilityError } from '../utils/errors';

export const transporter: Transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

// ── Verify cache ────────────────────────────────────────────────────────────
//
// A successful verify is sticky for the lifetime of the process; a failed
// verify is cached for VERIFY_FAIL_TTL_MS so we don't hammer SendGrid (or
// hold the user waiting for a TCP timeout) when SMTP is in a bad state.

const VERIFY_FAIL_TTL_MS = 60 * 1000;

let verifiedAt: number | null = null;
let lastVerifyFailAt: number | null = null;
let lastVerifyError: string | null = null;

export async function ensureTransporterVerified(): Promise<void> {
  if (verifiedAt !== null) return;

  const now = Date.now();
  if (lastVerifyFailAt && now - lastVerifyFailAt < VERIFY_FAIL_TTL_MS && lastVerifyError) {
    // Fail fast with the cached classification so callers translate to 503.
    throw new EmailServiceUnavailableError(lastVerifyError);
  }

  try {
    await transporter.verify();
    verifiedAt = now;
    lastVerifyFailAt = null;
    lastVerifyError = null;
    logger.info('SMTP transporter verified', {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
    });
  } catch (error) {
    const msg = (error as Error).message;
    lastVerifyFailAt = now;
    lastVerifyError = msg;
    logger.error('SMTP transporter verification failed', {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      error: msg,
    });
    if (isSmtpAvailabilityError(error)) {
      throw new EmailServiceUnavailableError(msg);
    }
    throw error;
  }
}

/**
 * /health probe — returns the cached verify outcome without sending mail.
 */
export async function getSmtpHealth(): Promise<{
  ok: boolean;
  error?: string;
  checkedAt: number;
}> {
  try {
    await ensureTransporterVerified();
    return { ok: true, checkedAt: verifiedAt ?? Date.now() };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      checkedAt: lastVerifyFailAt ?? Date.now(),
    };
  }
}

/**
 * Forced verify at process boot. Called once from src/index.ts so we log
 * SMTP readiness at startup. Bypasses the cache.
 */
export async function verifyTransporterAtBoot(): Promise<boolean> {
  verifiedAt = null;
  lastVerifyFailAt = null;
  lastVerifyError = null;
  try {
    await ensureTransporterVerified();
    return true;
  } catch (err) {
    logger.warn(
      'SMTP not ready at boot (emails will fail until provider is healthy)',
      { error: err instanceof Error ? err.message : String(err) },
    );
    return false;
  }
}

/**
 * Translate raw SMTP errors into a classified EmailServiceUnavailableError
 * so HTTP layers can return 503 instead of leaking provider strings.
 */
export function rethrowAsEmailServiceError(error: unknown): never {
  if (error instanceof EmailServiceUnavailableError) throw error;
  if (isSmtpAvailabilityError(error)) {
    throw new EmailServiceUnavailableError(
      error instanceof Error ? error.message : String(error),
    );
  }
  throw error;
}
