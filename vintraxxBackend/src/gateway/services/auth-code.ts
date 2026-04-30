/**
 * Auth-code helpers used during the registration / authentication handshake.
 *
 * The platform issues an opaque random string in 0x8100. The terminal echoes
 * it back in 0x0102. We persist it on GpsTerminal.authCode so that across
 * gateway restarts (or future cluster nodes) we can still authenticate the
 * same device without forcing it to re-register.
 */

import { randomBytes } from 'crypto';

const AUTH_CODE_BYTES = 16; // 16 random bytes → 32 hex chars

/**
 * Generate a fresh random auth code. 32 hex characters fits comfortably in
 * the 0x8100 ASCII body and is short enough that resource-constrained 2013
 * terminals don't choke on it.
 */
export function generateAuthCode(): string {
  return randomBytes(AUTH_CODE_BYTES).toString('hex');
}

/**
 * Constant-time-ish comparison so we don't leak timing info on auth-code
 * checks. Both inputs are short (≤64 chars) so a JS-level loop is fine.
 */
export function authCodeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let acc = 0;
  for (let i = 0; i < a.length; i++) {
    acc |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return acc === 0;
}
