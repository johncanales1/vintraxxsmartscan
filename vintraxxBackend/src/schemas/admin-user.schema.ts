import { z } from 'zod';

/**
 * Zod body shapes for the admin Users CRUD endpoints. Previously the routes
 * had no validation, so a malformed body (e.g. missing `password` on
 * create, or a numeric field passed as a string) would either throw deep
 * inside Prisma with an unfriendly 500 or silently no-op.
 *
 * `.strict()` is NOT used — the admin UI hits these endpoints with some
 * extra client-only fields from `Partial<CreateUserData>`. Unknown keys
 * are stripped silently by default which is what we want.
 */

const emailField = z.string().email('Invalid email address').max(254);
const passwordField = z.string().min(6, 'Password must be at least 6 characters');
const laborRateField = z.number().positive('Labor rate must be positive');
const positiveIntField = z.number().int().min(0);

/**
 * Image fields accept either:
 *   • an http(s) URL that the admin service will store as-is, or
 *   • a `data:image/…;base64,<payload>` string that `processBase64Image`
 *     will decode and persist to disk.
 * The regex is intentionally loose — `processBase64Image` owns the
 * strict validation of the payload bytes.
 */
const imageField = z
  .string()
  .max(8 * 1024 * 1024, 'Image too large — must be under 8MB')
  .refine(
    (v) => v.startsWith('data:image/') || v.startsWith('http://') || v.startsWith('https://'),
    'Must be a data:image/... URL or an http(s) URL',
  )
  .optional()
  .nullable();

export const createUserBodySchema = z.object({
  body: z.object({
    email: emailField,
    password: passwordField,
    fullName: z.string().min(1).max(120).optional(),
    isDealer: z.boolean().optional(),
    pricePerLaborHour: laborRateField.optional(),
    logoUrl: imageField,
    qrCodeUrl: imageField,
    maxScannerDevices: positiveIntField.optional().nullable(),
    maxVins: positiveIntField.optional().nullable(),
  }),
});

/**
 * Update schema mirrors create but all fields optional. `password` is
 * deliberately omitted — there is a separate password-reset flow and the
 * prior silent-drop behaviour was a footgun.
 */
export const updateUserBodySchema = z.object({
  body: z.object({
    email: emailField.optional(),
    fullName: z.string().min(1).max(120).optional().nullable(),
    isDealer: z.boolean().optional(),
    pricePerLaborHour: laborRateField.optional().nullable(),
    logoUrl: imageField,
    qrCodeUrl: imageField,
    maxScannerDevices: positiveIntField.optional().nullable(),
    maxVins: positiveIntField.optional().nullable(),
  }),
});
