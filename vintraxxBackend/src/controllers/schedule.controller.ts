import { Request, Response } from 'express';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { env } from '../config/env';
import logger from '../utils/logger';
import { getEmailLogoHeaderHtml } from '../utils/logos';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

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

async function sendScheduleEmailToAdmin(data: ScheduleRequestData): Promise<void> {
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const preferredDateFormatted = new Date(data.preferredDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subject = `New Service Appointment Request - ${data.name} - ${data.serviceType}`;

  const htmlBody = `
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
        <div class="field-value">${data.name}</div>
      </div>
      <div class="field">
        <div class="field-label">Email</div>
        <div class="field-value"><a href="mailto:${data.email}">${data.email}</a></div>
      </div>
      <div class="field">
        <div class="field-label">Phone</div>
        <div class="field-value"><a href="tel:${data.phone}">${data.phone}</a></div>
      </div>
      <div class="field">
        <div class="field-label">Dealership</div>
        <div class="field-value">${data.dealership}</div>
      </div>

      <div class="section-title">Vehicle Information</div>
      <div class="field">
        <div class="field-label">Vehicle</div>
        <div class="field-value">${data.vehicle}</div>
      </div>
      <div class="field">
        <div class="field-label">VIN</div>
        <div class="field-value">${data.vin}</div>
      </div>

      <div class="highlight-box">
        <div class="field">
          <div class="field-label">Service Type</div>
          <div class="field-value">${data.serviceType}</div>
        </div>
        <div class="field" style="margin-bottom: 0;">
          <div class="field-label">Preferred Date & Time</div>
          <div class="field-value">${preferredDateFormatted} at ${data.preferredTime}</div>
        </div>
      </div>

      ${data.additionalNotes ? `
      <div class="section-title">Additional Notes</div>
      <div class="notes-box">
        ${data.additionalNotes}
      </div>
      ` : ''}

    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} VinTraxx SmartScan. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
    to: 'john@vintraxx.com',
    subject,
    html: htmlBody,
  });

  logger.info('Schedule request email sent to admin', {
    customerName: data.name,
    serviceType: data.serviceType,
    preferredDate: data.preferredDate,
  });
}

async function sendConfirmationEmailToUser(data: ScheduleRequestData): Promise<void> {
  const preferredDateFormatted = new Date(data.preferredDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subject = `Service Appointment Request Confirmation - ${data.serviceType}`;

  const htmlBody = `
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
      <p>Dear <strong>${data.name}</strong>,</p>
      <p>Thank you for submitting your service appointment request. We have received your request and will contact you shortly to confirm your appointment.</p>
      
      <div class="highlight-box">
        <div class="field">
          <div class="field-label">Service Type</div>
          <div class="field-value">${data.serviceType}</div>
        </div>
        <div class="field">
          <div class="field-label">Vehicle</div>
          <div class="field-value">${data.vehicle}</div>
        </div>
        <div class="field" style="margin-bottom: 0;">
          <div class="field-label">Requested Date & Time</div>
          <div class="field-value">${preferredDateFormatted} at ${data.preferredTime}</div>
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

  await transporter.sendMail({
    from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
    to: data.email,
    subject,
    html: htmlBody,
  });

  logger.info('Schedule confirmation email sent to user', {
    customerEmail: data.email,
    serviceType: data.serviceType,
  });
}

export async function submitScheduleRequest(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const parseResult = scheduleRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.errors.map(e => e.message).join(', ');
      logger.warn('Schedule request validation failed', { errors: errorMessages, userId });
      res.status(400).json({ success: false, message: errorMessages });
      return;
    }

    const data = parseResult.data;

    logger.info('Processing schedule request', {
      userId,
      customerName: data.name,
      serviceType: data.serviceType,
      vehicle: data.vehicle,
    });

    // Send email to admin (john@vintraxx.com)
    await sendScheduleEmailToAdmin(data);

    // Send confirmation email to user
    await sendConfirmationEmailToUser(data);

    logger.info('Schedule request processed successfully', {
      userId,
      customerName: data.name,
      serviceType: data.serviceType,
    });

    res.status(200).json({
      success: true,
      message: 'Your appointment request has been submitted successfully. You will receive a confirmation email shortly.',
    });
  } catch (error) {
    logger.error('Schedule request error', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    res.status(500).json({
      success: false,
      message: 'Failed to process your request. Please try again later.',
    });
  }
}
