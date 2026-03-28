import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const optionalNonEmptyString = z.preprocess(
  value => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().min(1).optional(),
);

const envSchema = z.object({
  PORT: z.string().default('3000').transform(Number),
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
  MICROSOFT_CLIENT_ID: optionalNonEmptyString,
  MICROSOFT_TENANT_ID: z.string().default('common'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
