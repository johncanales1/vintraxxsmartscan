import { randomInt } from 'crypto';

export function kmToMiles(km: number): number {
  return Math.round(km * 0.621371 * 10) / 10;
}

export function milesToKm(miles: number): number {
  return Math.round(miles * 1.60934 * 10) / 10;
}

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Generate a numeric OTP. HIGH #11: uses `crypto.randomInt` (CSPRNG) so the
 * output is unpredictable. The previous Math.random() was fast but seeded
 * by V8 and trivially predictable across calls — unacceptable for an
 * authentication artefact.
 */
export function generateOtpCode(length: number = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += randomInt(0, 10).toString();
  }
  return code;
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}
