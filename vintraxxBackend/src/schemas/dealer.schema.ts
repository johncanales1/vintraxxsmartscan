/**
 * dealer.schema — Zod schemas for the /api/v1/dealer/* endpoints.
 *
 * Currently used by:
 *   POST /dealer/send-email — see CRITICAL #7. Without an explicit schema
 *   the route blindly accepted arbitrary `{ to, subject, body }` from any
 *   authenticated user, turning the SMTP transporter into an open relay.
 */

import { z } from 'zod';

export const sendDealerEmailSchema = z.object({
  body: z.object({
    /** Recipient. Single address only (no comma-separated lists) so a
     *  single dealer message can't fan out to a list of contacts the
     *  authenticated user assembled. */
    to: z.string().email('Recipient must be a valid email address'),
    /** Subject line. Cap at 200 chars to keep the audit row sensible. */
    subject: z.string().min(1, 'Subject is required').max(200),
    /** Free-form HTML/text body. 20 kB cap so a malicious caller can't
     *  spool 5 MB into every send. */
    body: z.string().max(20_000).optional(),
  }),
});

/**
 * MEDIUM #22: schema for POST /api/v1/dealer/schedule-appointment.
 * Mirrors the fields the controller already destructures + persists into
 * ServiceAppointment. Columns that are nullable in Prisma get `.optional()`
 * here; required ones (name/email/serviceType/preferredDate) reject empty.
 */
export const scheduleAppointmentSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(200),
    email: z.string().email('Valid email is required'),
    phone: z.string().max(64).optional(),
    dealership: z.string().max(200).optional(),
    vehicle: z.string().max(200).optional(),
    vin: z.string().max(32).optional(),
    serviceType: z.string().min(1, 'Service type is required').max(120),
    preferredDate: z.string().min(1, 'Preferred date is required').max(64),
    preferredTime: z.string().max(64).optional(),
    additionalNotes: z.string().max(2000).optional(),
  }),
});
