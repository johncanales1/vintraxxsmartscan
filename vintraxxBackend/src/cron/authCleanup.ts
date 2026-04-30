/**
 * authCleanup — periodic prune for expired auth artefacts.
 *
 * MEDIUM #23: previously expired OTPs and used / expired
 * PasswordResetToken rows lingered forever. The auth.service flow already
 * deletes per-email OTPs on resend / register-completion, but rows from
 * abandoned flows (user starts OTP, never finishes) accumulate. Same
 * story for password reset tokens — they're invalidated on use but the
 * row sticks around.
 *
 * Both cleanups are idempotent and safe to run as often as you like; the
 * cron schedules them once a day.
 *
 * Retention policy:
 *   • OTPs:       deleted 7 days after expiresAt. The actual TTL is
 *                 ~10 minutes, so 7d is purely a forensics buffer.
 *   • PasswordResetToken expired-but-unused: deleted 7 days after expiresAt.
 *   • PasswordResetToken used: deleted 30 days after usedAt so audit trails
 *                              can correlate password changes with sessions.
 */

import prisma from '../config/db';
import logger from '../utils/logger';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const OTP_GRACE_DAYS = 7;
const RESET_EXPIRED_GRACE_DAYS = 7;
const RESET_USED_GRACE_DAYS = 30;

/**
 * Delete OTP rows whose `expiresAt` is older than now − OTP_GRACE_DAYS.
 * Returns the deleted count.
 */
export async function runOtpCleanup(): Promise<number> {
  const cutoff = new Date(Date.now() - OTP_GRACE_DAYS * ONE_DAY_MS);
  const result = await prisma.otp.deleteMany({
    where: { expiresAt: { lt: cutoff } },
  });
  if (result.count > 0) {
    logger.info('authCleanup: pruned expired OTPs', {
      count: result.count,
      cutoff: cutoff.toISOString(),
    });
  }
  return result.count;
}

/**
 * Delete PasswordResetToken rows that are either:
 *   • unused and expired more than RESET_EXPIRED_GRACE_DAYS ago, OR
 *   • used (usedAt set) more than RESET_USED_GRACE_DAYS ago.
 *
 * The two predicates are issued as a single OR query to keep this to one
 * round-trip.
 */
export async function runPasswordResetCleanup(): Promise<number> {
  const now = Date.now();
  const expiredCutoff = new Date(now - RESET_EXPIRED_GRACE_DAYS * ONE_DAY_MS);
  const usedCutoff = new Date(now - RESET_USED_GRACE_DAYS * ONE_DAY_MS);

  const result = await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        // expired and never used
        { usedAt: null, expiresAt: { lt: expiredCutoff } },
        // used long enough ago that we no longer need the audit row
        { usedAt: { lt: usedCutoff } },
      ],
    },
  });
  if (result.count > 0) {
    logger.info('authCleanup: pruned password reset tokens', {
      count: result.count,
      expiredCutoff: expiredCutoff.toISOString(),
      usedCutoff: usedCutoff.toISOString(),
    });
  }
  return result.count;
}
