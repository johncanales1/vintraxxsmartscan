import { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import logger from '../utils/logger';
import prisma from '../config/db';
import { getEmailLogoHeaderHtml } from '../utils/logos';
import { isSmtpAvailabilityError } from '../utils/errors';
import { escapeHtml as e } from '../utils/escape-html';
// MEDIUM #21: shared transporter (was a module-level
// nodemailer.createTransport here previously).
import { transporter } from '../services/mailer';

const scheduleRequestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone is required'),
  dealership: z.string().min(1, 'Dealership is required'),
  vehicle: z.string().min(1, 'Vehicle is required'),
  vin: z.string().min(1, 'VIN is required'),
  serviceType: z.string().min(1, 'Service type is required'),
  preferredDate: z.string().min(1, 'Preferred date is required'),
  preferredTime: z.string().min(1, 'Preferred time is required'),
  additionalNotes: z.string().optional(),
});

type ScheduleRequestData = z.infer<typeof scheduleRequestSchema>;

// ──────────────────────────────────────────────────────────────────────
// Email template helpers (unchanged markup — extracted so the controller
// body stays focused on the persist-first flow).
// ──────────────────────────────────────────────────────────────────────

function buildAdminEmail(data: ScheduleRequestData): { subject: string; html: string } {
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // `preferredDate` is MM/DD/YYYY from mobile; `new Date(...)` accepts both
  // that and ISO, so this is safe.
  const preferredDateFormatted = new Date(data.preferredDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subject = `New Service Appointment Request - ${data.name} - ${data.serviceType}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 15px; }
    .field-label { font-weight: bold; color: #1a1a2e; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
    .field-value { font-size: 16px; color: #333; }
    .section-title { font-size: 18px; font-weight: bold; color: #1a1a2e; margin: 20px 0 10px; border-bottom: 2px solid #1a1a2e; padding-bottom: 5px; }
    .highlight-box { background: #1a1a2e; color: #fff; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .highlight-box .field-label { color: #ccc; }
    .highlight-box .field-value { color: #fff; }
    .footer { text-align: center; padding: 15px; color: #999; font-size: 12px; }
    .notes-box { background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; }
  </style>
</head>
<body>
  <div class="container">
    ${getEmailLogoHeaderHtml('New Service Appointment Request', 'VinTraxx SmartScan')}
    <div class="content">
      <p>A new service appointment request has been submitted on <strong>${dateStr}</strong>.</p>

      <div class="section-title">Customer Information</div>
      <div class="field">
        <div class="field-label">Name</div>
        <div class="field-value">${e(data.name)}</div>
      </div>
      <div class="field">
        <div class="field-label">Email</div>
        <div class="field-value"><a href="mailto:${e(data.email)}">${e(data.email)}</a></div>
      </div>
      <div class="field">
        <div class="field-label">Phone</div>
        <div class="field-value"><a href="tel:${e(data.phone)}">${e(data.phone)}</a></div>
      </div>
      <div class="field">
        <div class="field-label">Dealership</div>
        <div class="field-value">${e(data.dealership)}</div>
      </div>

      <div class="section-title">Vehicle Information</div>
      <div class="field">
        <div class="field-label">Vehicle</div>
        <div class="field-value">${e(data.vehicle)}</div>
      </div>
      <div class="field">
        <div class="field-label">VIN</div>
        <div class="field-value">${e(data.vin)}</div>
      </div>

      <div class="highlight-box">
        <div class="field">
          <div class="field-label">Service Type</div>
          <div class="field-value">${e(data.serviceType)}</div>
        </div>
        <div class="field" style="margin-bottom: 0;">
          <div class="field-label">Preferred Date & Time</div>
          <div class="field-value">${e(preferredDateFormatted)} at ${e(data.preferredTime)}</div>
        </div>
      </div>

      ${data.additionalNotes ? `
      <div class="section-title">Additional Notes</div>
      <div class="notes-box">
        ${e(data.additionalNotes).replace(/\n/g, '<br/>')}
      </div>
      ` : ''}

    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} VinTraxx SmartScan. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}

function buildUserConfirmationEmail(data: ScheduleRequestData): { subject: string; html: string } {
  const preferredDateFormatted = new Date(data.preferredDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subject = `Service Appointment Request Confirmation - ${data.serviceType}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 15px; }
    .field-label { font-weight: bold; color: #1a1a2e; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
    .field-value { font-size: 16px; color: #333; }
    .highlight-box { background: #1a1a2e; color: #fff; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .highlight-box .field-label { color: #ccc; }
    .highlight-box .field-value { color: #fff; }
    .footer { text-align: center; padding: 15px; color: #999; font-size: 12px; }
    .success-icon { text-align: center; font-size: 48px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    ${getEmailLogoHeaderHtml('Appointment Request Received', 'VinTraxx SmartScan')}
    <div class="content">
      <div class="success-icon">✅</div>
      <p>Dear <strong>${e(data.name)}</strong>,</p>
      <p>Thank you for submitting your service appointment request. We have received your request and will contact you shortly to confirm your appointment.</p>

      <div class="highlight-box">
        <div class="field">
          <div class="field-label">Service Type</div>
          <div class="field-value">${e(data.serviceType)}</div>
        </div>
        <div class="field">
          <div class="field-label">Vehicle</div>
          <div class="field-value">${e(data.vehicle)}</div>
        </div>
        <div class="field" style="margin-bottom: 0;">
          <div class="field-label">Requested Date & Time</div>
          <div class="field-value">${e(preferredDateFormatted)} at ${e(data.preferredTime)}</div>
        </div>
      </div>

      <p><strong>What's Next?</strong></p>
      <ul>
        <li>Our team will review your request</li>
        <li>We will contact you to confirm availability</li>
        <li>You will receive a final confirmation with appointment details</li>
      </ul>

      <p>If you have any questions, please don't hesitate to contact us.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} VinTraxx SmartScan. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}

// ──────────────────────────────────────────────────────────────────────
// Controller
// ──────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/schedule/submit
 *
 * Persist-first / fire-and-forget email flow:
 *   1. Validate input.
 *   2. Save a `ServiceAppointment` row (single source of truth; never lost).
 *   3. Attempt admin + user emails; record outcome per message in the same row.
 *   4. Return HTTP 200 with `emailStatus` = 'sent' | 'partial' | 'failed'.
 *      The request is considered SUCCESSFUL as long as it is persisted —
 *      SMTP downtime no longer fails the user-facing submission.
 */
export async function submitScheduleRequest(req: Request, res: Response): Promise<void> {
  const requestId = req.requestId ?? 'unknown';
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  const parseResult = scheduleRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorMessages = parseResult.error.errors.map((e) => e.message).join(', ');
    logger.warn('Schedule request validation failed', { requestId, errors: errorMessages, userId });
    res.status(400).json({ success: false, message: errorMessages });
    return;
  }

  const data = parseResult.data;

  // ── 1. Persist the request first — this is the source of truth ──────
  let appointmentId: string;
  try {
    const saved = await prisma.serviceAppointment.create({
      data: {
        userId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        dealership: data.dealership,
        vehicle: data.vehicle,
        vin: data.vin,
        serviceType: data.serviceType,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        additionalNotes: data.additionalNotes ?? null,
        status: 'pending',
      },
    });
    appointmentId = saved.id;
    logger.info('Schedule request persisted', {
      requestId,
      appointmentId,
      userId,
      customerName: data.name,
      serviceType: data.serviceType,
      vehicle: data.vehicle,
      vin: data.vin,
    });
  } catch (dbErr) {
    logger.error('Schedule request DB insert failed', {
      requestId,
      userId,
      error: (dbErr as Error).message,
    });
    res.status(500).json({
      success: false,
      code: 'SCHEDULE_SAVE_FAILED',
      message: 'Could not save your appointment request. Please try again.',
    });
    return;
  }

  // ── 2. Fire emails in the background — never block the response ─────
  // Use setImmediate so the response is flushed before the (potentially slow)
  // SMTP round trips start. Results are written back to the appointment row.
  // MEDIUM #27: explicit .catch on the deliverScheduleEmails promise so a
  // future change inside that helper that omits its own try/catch can't
  // surface as a process-level unhandledRejection.
  setImmediate(() => {
    deliverScheduleEmails(appointmentId, data, requestId).catch((err) => {
      logger.error('deliverScheduleEmails threw unexpectedly', {
        requestId,
        appointmentId,
        err: (err as Error).message,
      });
    });
  });

  // ── 3. Respond success immediately ──────────────────────────────────
  res.status(200).json({
    success: true,
    appointmentId,
    message:
      'Your appointment request has been received. A confirmation email will follow shortly.',
    emailStatus: 'queued',
  });
}

async function deliverScheduleEmails(
  appointmentId: string,
  data: ScheduleRequestData,
  requestId: string,
): Promise<void> {
  const adminRecipient = 'john@vintraxx.com';
  let adminSentAt: Date | null = null;
  let userSentAt: Date | null = null;
  const errors: string[] = [];

  // ── Admin email ────────────────────────────────────────────────────
  try {
    const { subject, html } = buildAdminEmail(data);
    await transporter.sendMail({
      from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
      to: adminRecipient,
      subject,
      html,
    });
    adminSentAt = new Date();
    logger.info('Schedule admin email sent', {
      requestId,
      appointmentId,
      adminRecipient,
      customerName: data.name,
      serviceType: data.serviceType,
    });
  } catch (err) {
    const msg = (err as Error).message;
    errors.push(`admin: ${msg}`);
    logger.error('Schedule admin email failed', {
      requestId,
      appointmentId,
      smtpDown: isSmtpAvailabilityError(err),
      error: msg,
    });
  }

  // ── User confirmation email ────────────────────────────────────────
  try {
    const { subject, html } = buildUserConfirmationEmail(data);
    await transporter.sendMail({
      from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
      to: data.email,
      subject,
      html,
    });
    userSentAt = new Date();
    logger.info('Schedule user email sent', {
      requestId,
      appointmentId,
      to: data.email,
    });
  } catch (err) {
    const msg = (err as Error).message;
    errors.push(`user: ${msg}`);
    logger.error('Schedule user email failed', {
      requestId,
      appointmentId,
      smtpDown: isSmtpAvailabilityError(err),
      error: msg,
    });
  }

  // ── Record outcome back to the appointment row ─────────────────────
  const newStatus =
    adminSentAt && userSentAt
      ? 'confirmed'
      : adminSentAt || userSentAt
        ? 'partial_email'
        : 'email_queued';

  try {
    await prisma.serviceAppointment.update({
      where: { id: appointmentId },
      data: {
        adminEmailSentAt: adminSentAt,
        userEmailSentAt: userSentAt,
        emailLastError: errors.length ? errors.join(' | ').slice(0, 1000) : null,
        emailAttempts: { increment: 1 },
        status: newStatus,
      },
    });
  } catch (updateErr) {
    logger.error('Schedule appointment email-status update failed', {
      requestId,
      appointmentId,
      error: (updateErr as Error).message,
    });
  }

  if (errors.length === 0) {
    logger.info('Schedule request emails delivered', { requestId, appointmentId });
  } else {
    logger.warn('Schedule request emails completed with errors', {
      requestId,
      appointmentId,
      errorCount: errors.length,
    });
  }
}
