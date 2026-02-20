import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { FullReportData } from '../types';
import { formatCurrency } from '../utils/helpers';
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

export async function sendReportEmail(
  toEmail: string,
  report: FullReportData,
  pdfPath: string
): Promise<void> {
  const { vehicle, healthScore, dtcAnalysis, totalEstimatedRepairCost } = report;
  const vehicleStr = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subject = `VinTraxx SmartScan Report - ${vehicleStr} - ${dateStr}`;

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
    <div class="header">
      <h1>VinTraxx SmartScan</h1>
      <p style="margin: 5px 0 0; opacity: 0.8;">Vehicle Diagnostic Report</p>
    </div>
    <div class="content">
      <p>Your vehicle scan report for your <strong>${vehicleStr}</strong> (VIN: ${vehicle.vin}) is ready.</p>
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
          <div class="stat-label">Total Estimated Repair Cost</div>
        </div>
      </div>
      <p style="text-align: center; margin-top: 20px;">See attached PDF for the full report.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} VinTraxx SmartScan. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
      to: toEmail,
      subject,
      html: htmlBody,
      attachments: [
        {
          filename: `VinTraxx-Report-${vehicle.vin}.pdf`,
          path: pdfPath,
        },
      ],
    });

    logger.info(`Report email sent to ${toEmail}`);
  } catch (error) {
    logger.error('Failed to send report email', {
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
    await transporter.sendMail({
      from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
      to: toEmail,
      subject: 'VinTraxx SmartScan - Verification Code',
      html: htmlBody,
    });

    logger.info(`OTP email sent to ${toEmail}`);
  } catch (error) {
    logger.error('Failed to send OTP email', {
      to: toEmail,
      error: (error as Error).message,
    });
    throw error;
  }
}
