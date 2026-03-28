import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { FullReportData } from '../types';
import { formatCurrency } from '../utils/helpers';
import { getEmailLogoHeaderHtml } from '../utils/logos';
import logger from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

 let transporterVerified = false;

 async function ensureTransporterVerified(): Promise<void> {
   if (transporterVerified) return;
   try {
     await transporter.verify();
     transporterVerified = true;
     logger.info('SMTP transporter verified', {
       host: env.SMTP_HOST,
       port: env.SMTP_PORT,
       user: env.SMTP_USER,
     });
   } catch (error) {
     logger.error('SMTP transporter verification failed', {
       host: env.SMTP_HOST,
       port: env.SMTP_PORT,
       user: env.SMTP_USER,
       error: (error as Error).message,
     });
     throw error;
   }
 }

export async function sendReportEmail(
  toEmail: string,
  report: FullReportData,
  pdfPath?: string | null
): Promise<void> {
  const { vehicle, healthScore, dtcAnalysis, totalEstimatedRepairCost } = report;
  const vehicleStr = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subject = `VinTraxx SmartScan Report - ${vehicleStr} - ${dateStr}`;

  const pdfNote = pdfPath
    ? 'See attached PDF for the full report.'
    : 'Open the VinTraxx SmartScan app to view the full report.';

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a2e; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .stat { display: inline-block; width: 45%; margin: 10px 2%; text-align: center; padding: 15px; background: #fff; border-radius: 8px; border: 1px solid #eee; }
    .stat-value { font-size: 28px; font-weight: bold; color: #1a1a2e; }
    .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .footer { text-align: center; padding: 15px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    ${getEmailLogoHeaderHtml('Diagnostic Scan Report', 'VinTraxx SmartScan')}
    <div class="content">
      <p>Your vehicle scan report for your <strong>${vehicleStr}</strong> (VIN: ${vehicle.vin}) is ready.</p>
      ${report.stockNumber ? `<p style="text-align: center; margin: 10px 0;"><strong>Stock #:</strong> ${report.stockNumber}</p>` : ''}
      <div style="text-align: center; margin: 20px 0;">
        <div class="stat">
          <div class="stat-value">${healthScore}</div>
          <div class="stat-label">Health Score</div>
        </div>
        <div class="stat">
          <div class="stat-value">${dtcAnalysis.length}</div>
          <div class="stat-label">DTCs Found</div>
        </div>
      </div>
      <div style="text-align: center; margin: 20px 0;">
        <div class="stat" style="width: 92%;">
          <div class="stat-value">${formatCurrency(totalEstimatedRepairCost)}</div>
          <div class="stat-label">DTC Repair Cost</div>
        </div>
      </div>
      ${report.additionalRepairs && report.additionalRepairs.length > 0 ? `
      <div style="text-align: center; margin: 20px 0;">
        <div class="stat" style="width: 92%;">
          <div class="stat-value">${formatCurrency(report.additionalRepairsTotalCost || 0)}</div>
          <div class="stat-label">Additional Repairs Cost</div>
        </div>
      </div>
      ${report.grandTotalCost !== undefined ? `
      <div style="text-align: center; margin: 20px 0;">
        <div class="stat" style="width: 92%; background: #1a1a2e; color: #fff;">
          <div class="stat-value" style="color: #fff;">${formatCurrency(report.grandTotalCost)}</div>
          <div class="stat-label" style="color: #ccc;">Grand Total</div>
        </div>
      </div>
      ` : ''}
      ` : ''}
      <p style="text-align: center; margin-top: 20px;">${pdfNote}</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} VinTraxx SmartScan. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await ensureTransporterVerified();

    logger.info('Sending report email', {
      scanId: report.scanId,
      vin: vehicle.vin,
      to: toEmail,
      subject,
      hasPdfAttachment: Boolean(pdfPath),
    });

    const info = await transporter.sendMail({
      from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
      to: toEmail,
      subject,
      html: htmlBody,
      attachments: pdfPath
        ? [
            {
              filename: `VinTraxx-Report-${vehicle.vin}.pdf`,
              path: pdfPath,
            },
          ]
        : [],
    });

    logger.info('Report email sent', {
      scanId: report.scanId,
      vin: vehicle.vin,
      to: toEmail,
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
      pending: (info as any).pending,
    });
  } catch (error) {
    logger.error('Failed to send report email', {
      to: toEmail,
      error: (error as Error).message,
    });
    throw error;
  }
}

export async function sendPasswordResetEmail(toEmail: string, resetLink: string): Promise<void> {
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a2e; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .btn { display: inline-block; background: #1a1a2e; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>VinTraxx SmartScan</h1>
    </div>
    <div style="padding: 20px; background: #f9f9f9; border: 1px solid #ddd;">
      <h2 style="margin-top: 0;">Reset your password</h2>
      <p>We received a request to reset your password. Click the button below to set a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" class="btn" style="color: #fff;">Reset Password</a>
      </div>
      <p>This link will expire in 1 hour.</p>
      <p style="color: #999; font-size: 12px;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await ensureTransporterVerified();
    const info = await transporter.sendMail({
      from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
      to: toEmail,
      subject: 'VinTraxx SmartScan - Reset Your Password',
      html: htmlBody,
    });

    logger.info('Password reset email sent', {
      to: toEmail,
      messageId: info.messageId,
    });
  } catch (error) {
    logger.error('Failed to send password reset email', {
      to: toEmail,
      error: (error as Error).message,
    });
    throw error;
  }
}

export async function sendOtpEmail(toEmail: string, otp: string): Promise<void> {
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a2e; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .otp-box { background: #f0f0f0; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; margin: 20px 0; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>VinTraxx SmartScan</h1>
    </div>
    <div style="padding: 20px; background: #f9f9f9; border: 1px solid #ddd;">
      <p>Your verification code is:</p>
      <div class="otp-box">${otp}</div>
      <p>This code expires in 10 minutes.</p>
      <p style="color: #999; font-size: 12px;">If you did not request this code, please ignore this email.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await ensureTransporterVerified();
    const info = await transporter.sendMail({
      from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
      to: toEmail,
      subject: 'VinTraxx SmartScan - Verification Code',
      html: htmlBody,
    });

    logger.info('OTP email sent', {
      to: toEmail,
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
      pending: (info as any).pending,
    });
  } catch (error) {
    logger.error('Failed to send OTP email', {
      to: toEmail,
      error: (error as Error).message,
    });
    throw error;
  }
}
