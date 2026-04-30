import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file but don't override existing environment variables
dotenv.config({ override: false });

const optionalNonEmptyString = z.preprocess(
  value => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().min(1).optional(),
);

const envSchema = z.object({
  PORT: z.string().default('4000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('7d'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default('gpt-4o'),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.string().default('587').transform(Number),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  EMAIL_FROM: z.string().email(),
  EMAIL_FROM_NAME: z.string().default('VinTraxx SmartScan'),
  BLACKBOOK_CUSTOMER_ID: z.string().default('test'),
  BLACKBOOK_BASE_URL: z.string().default('https://service.blackbookcloud.com/UsedCarWS/UsedCarWS'),
  BLACKBOOK_USERNAME: optionalNonEmptyString,
  BLACKBOOK_PASSWORD: optionalNonEmptyString,
  REPORT_VERSION: z.string().default('5.1'),
  APP_URL: z.string().url().default('https://app.vintraxx.com'),
  GOOGLE_CLIENT_ID: optionalNonEmptyString,
  /**
   * LOW #1: Google OAuth client IDs for the mobile + web flows. These are
   * PUBLIC values (baked into compiled mobile binaries; visible in any
   * `.aab`/`.ipa`) — not secrets. They live in env for two reasons:
   *   • a future project rename / OAuth-app rotation doesn't require a
   *     code change, and
   *   • staging / dev deployments can point at separate OAuth clients.
   *
   * Defaults preserve current production behaviour exactly so a deploy
   * without these vars set behaves identically to before.
   */
  GOOGLE_CLIENT_ID_WEB: z
    .string()
    .default('701476871517-for6b5esr0itht4cltqh2vmfhb07mjac.apps.googleusercontent.com'),
  GOOGLE_CLIENT_ID_MOBILE: z
    .string()
    .default('701476871517-2h0qbn3hiovpp5mjlqu907op6rgktnf0.apps.googleusercontent.com'),
  MICROSOFT_CLIENT_ID: optionalNonEmptyString,
  MICROSOFT_TENANT_ID: z.string().default('common'),

  // GPS OBD scanner gateway (JT/T 808). Read by both the Express process
  // (for REST endpoints) and the standalone vintraxx-gateway process.
  GPS_TCP_PORT: z.string().default('7808').transform(Number),
  GPS_TLS_PORT: z.string().default('0').transform(Number),
  GPS_TLS_CERT_PATH: optionalNonEmptyString,
  GPS_TLS_KEY_PATH: optionalNonEmptyString,
  GPS_AUTO_PROVISION: z
    .enum(['true', 'false'])
    .default('false')
    .transform(v => v === 'true'),
  GPS_HEARTBEAT_TIMEOUT_SEC: z.string().default('180').transform(Number),
  GPS_LOCATION_RETENTION_MONTHS: z.string().default('12').transform(Number),
  GPS_MAX_LOCATIONS_PER_QUERY: z.string().default('5000').transform(Number),
  GPS_WS_PATH: z.string().default('/ws'),

  // Mobile push notifications (FCM / APNs via Firebase). Off by default so
  // dev environments don't try to authenticate with Google without creds.
  // Set FCM_ENABLED=true and provide FCM_SERVICE_ACCOUNT_JSON (base64-encoded
  // service-account JSON) in production.
  FCM_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform(v => v === 'true'),
  FCM_SERVICE_ACCOUNT_JSON: optionalNonEmptyString,
  /// Per-user, per-5-minute push budget. We keep an in-memory token-bucket
  /// keyed by userId so a runaway alarm storm can't spam a single device.
  FCM_PUSH_THROTTLE_PER_USER_PER_5MIN: z.string().default('10').transform(Number),

  /**
   * MEDIUM #28: CORS allow-list moved out of source code. Comma-separated
   * list of origins that get a permissive CORS response. Trailing slashes
   * are not stripped — match the exact origin header shape sent by the
   * browser. The default below is the production list (5 origins) so a
   * deploy without this var set behaves identically to before.
   *
   * For development, src/index.ts ALSO appends localhost origins on top of
   * this set when NODE_ENV === 'development', so you don't have to manage
   * those here.
   */
  CORS_ALLOWED_ORIGINS: z
    .string()
    .default(
      'https://dev.vintraxx.com,https://admin.vintraxx.com,https://api.vintraxx.com,https://capital.vintraxx.com,https://dealer.vintraxx.com',
    )
    .transform((s) =>
      s
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
