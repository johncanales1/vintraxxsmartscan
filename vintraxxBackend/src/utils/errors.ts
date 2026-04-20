import { AppError } from '../middleware/errorHandler';

/**
 * Raised when the email provider (SendGrid SMTP) is unavailable due to
 * authentication / credit exhaustion / connection failure. Maps to HTTP 503
 * so the mobile client can display a friendly "email temporarily unavailable"
 * message instead of a generic "Internal server error".
 */
export class EmailServiceUnavailableError extends AppError {
  code = 'EMAIL_UNAVAILABLE';
  originalMessage: string;

  constructor(originalMessage: string) {
    super(
      'Email service is temporarily unavailable. Please try again in a few minutes.',
      503,
      true,
    );
    this.originalMessage = originalMessage;
    Object.setPrototypeOf(this, EmailServiceUnavailableError.prototype);
  }
}

const SMTP_AUTH_PATTERNS = [
  /invalid login/i,
  /maximum credits exceeded/i,
  /authentication failed/i,
  /ehostunreach/i,
  /econnrefused/i,
  /etimedout/i,
  /unauthenticated senders/i,
  /550 .*unauthenticated/i,
  /451 /,
  /535 /,
];

/**
 * Returns true when an error looks like a provider-side (SMTP) outage.
 */
export function isSmtpAvailabilityError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return SMTP_AUTH_PATTERNS.some((re) => re.test(msg));
}
