import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { AppraisalSummaryData } from '../types';
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
    logger.info('Appraisal SMTP transporter verified');
  } catch (error) {
    logger.error('Appraisal SMTP transporter verification failed', {
      error: (error as Error).message,
    });
    throw error;
  }
}

export async function sendAppraisalEmail(
  toEmail: string,
  appraisal: AppraisalSummaryData,
  pdfPath?: string | null,
): Promise<void> {
  const { vehicle, valuation, condition } = appraisal;
  const vehicleStr = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`;
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const subject = `VinTraxx Trade-In Appraisal - ${vehicleStr} - ${dateStr}`;

  const pdfNote = pdfPath
    ? 'See attached PDF for the full appraisal report.'
    : 'Open the VinTraxx SmartScan app to view the full appraisal.';

  const conditionLabel = condition.charAt(0).toUpperCase() + condition.slice(1);
  const confidenceLabel = valuation.confidenceLevel.charAt(0).toUpperCase() + valuation.confidenceLevel.slice(1);

  // Build source anchors HTML
  let sourceAnchorsHtml = '';
  for (const src of valuation.comparableSources) {
    sourceAnchorsHtml += `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-weight: bold;">${src.sourceName}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">${formatCurrency(src.tradeInLow)} - ${formatCurrency(src.tradeInHigh)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">${formatCurrency(src.retailLow)} - ${formatCurrency(src.retailHigh)}</td>
      </tr>`;
  }

  // Build adjustments HTML
  let adjustmentsHtml = '';
  for (const adj of valuation.adjustments) {
    const sign = adj.impact >= 0 ? '+' : '';
    adjustmentsHtml += `
      <tr>
        <td style="padding: 6px 12px; border-bottom: 1px solid #eee;">${adj.factor}</td>
        <td style="padding: 6px 12px; border-bottom: 1px solid #eee; text-align: right; color: ${adj.impact >= 0 ? '#2E7D32' : '#D32F2F'}; font-weight: bold;">${sign}${formatCurrency(adj.impact)}</td>
        <td style="padding: 6px 12px; border-bottom: 1px solid #eee; font-size: 12px; color: #666;">${adj.explanation}</td>
      </tr>`;
  }

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; }
    .container { max-width: 650px; margin: 0 auto; padding: 0; }
    .header { background: #1a1a2e; color: #fff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; }
    .header p { margin: 5px 0 0; opacity: 0.8; font-size: 14px; }
    .content { background: #f9f9f9; padding: 24px; border: 1px solid #ddd; }
    .vehicle-info { background: #fff; border-radius: 8px; padding: 16px; margin-bottom: 20px; border: 1px solid #eee; }
    .vehicle-name { font-size: 20px; font-weight: bold; color: #1a1a2e; margin-bottom: 4px; }
    .vehicle-detail { font-size: 13px; color: #666; }
    .valuation-box { background: #fff; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 2px solid #2E7D32; text-align: center; }
    .valuation-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .valuation-range { font-size: 28px; font-weight: bold; color: #2E7D32; }
    .stat-row { display: flex; gap: 12px; margin-bottom: 20px; }
    .stat { flex: 1; background: #fff; border-radius: 8px; padding: 14px; text-align: center; border: 1px solid #eee; }
    .stat-value { font-size: 18px; font-weight: bold; color: #1a1a2e; }
    .stat-label { font-size: 11px; color: #666; text-transform: uppercase; }
    .section-title { font-size: 14px; font-weight: bold; color: #1a1a2e; margin: 20px 0 10px; border-bottom: 2px solid #1a1a2e; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; }
    th { background: #f5f5f5; padding: 8px 12px; text-align: left; font-size: 12px; color: #666; text-transform: uppercase; }
    .summary-text { background: #fff; border-radius: 8px; padding: 16px; border-left: 4px solid #1a1a2e; margin: 16px 0; font-size: 14px; color: #444; }
    .footer { text-align: center; padding: 16px; color: #999; font-size: 11px; }
    .confidence-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    ${getEmailLogoHeaderHtml('Trade-In Appraisal', 'VinTraxx SmartScan Report')}
    <div class="content">
      <div class="vehicle-info">
        <div class="vehicle-name">${vehicleStr}</div>
        <div class="vehicle-detail">VIN: ${vehicle.vin} | Mileage: ${vehicle.mileage.toLocaleString('en-US')} mi | Condition: ${conditionLabel}</div>
      </div>

      <div class="valuation-box">
        <div class="valuation-label">SmartScan Estimated Trade-In Range</div>
        <div class="valuation-range">${formatCurrency(valuation.estimatedTradeInLow)} – ${formatCurrency(valuation.estimatedTradeInHigh)}</div>
      </div>

      <div style="text-align: center; margin-bottom: 20px;">
        <table style="margin: 0 auto;">
          <tr>
            ${valuation.estimatedWholesaleLow ? `<td style="padding: 8px 14px; text-align: center;">
              <div style="font-size: 10px; color: #666; text-transform: uppercase;">Wholesale (Auction)</div>
              <div style="font-size: 14px; font-weight: bold; color: #1a1a2e;">${formatCurrency(valuation.estimatedWholesaleLow)} – ${formatCurrency(valuation.estimatedWholesaleHigh)}</div>
            </td>` : ''}
            <td style="padding: 8px 14px; text-align: center;">
              <div style="font-size: 10px; color: #666; text-transform: uppercase;">Retail Value</div>
              <div style="font-size: 14px; font-weight: bold; color: #1a1a2e;">${formatCurrency(valuation.estimatedRetailLow)} – ${formatCurrency(valuation.estimatedRetailHigh)}</div>
            </td>
            <td style="padding: 8px 14px; text-align: center;">
              <div style="font-size: 10px; color: #666; text-transform: uppercase;">Private Party</div>
              <div style="font-size: 14px; font-weight: bold; color: #1a1a2e;">${formatCurrency(valuation.estimatedPrivatePartyLow)} – ${formatCurrency(valuation.estimatedPrivatePartyHigh)}</div>
            </td>
            <td style="padding: 8px 14px; text-align: center;">
              <div style="font-size: 10px; color: #666; text-transform: uppercase;">Confidence</div>
              <div style="font-size: 14px; font-weight: bold; color: #1565C0;">${confidenceLabel}</div>
            </td>
          </tr>
        </table>
      </div>

      <div class="section-title">Source Anchors</div>
      <table>
        <tr>
          <th>Source</th>
          <th style="text-align: center;">Trade-In</th>
          <th style="text-align: center;">Retail</th>
        </tr>
        ${sourceAnchorsHtml}
      </table>

      <div class="section-title">Value Adjustments</div>
      <table>
        <tr>
          <th>Factor</th>
          <th style="text-align: right;">Impact</th>
          <th>Explanation</th>
        </tr>
        ${adjustmentsHtml}
      </table>

      <div class="section-title">AI Summary</div>
      <div class="summary-text">${valuation.aiSummary}</div>

      ${appraisal.photos && appraisal.photos.length > 0 ? `
      <div class="section-title">Vehicle Photos</div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
        ${appraisal.photos.map((photoDataUri: string, idx: number) => `
          <img src="${photoDataUri}" alt="Vehicle photo ${idx + 1}" style="width: 48%; max-width: 300px; height: auto; border-radius: 8px; border: 1px solid #eee;" />
        `).join('')}
      </div>
      ` : ''}

      <p style="text-align: center; margin-top: 20px; font-size: 13px; color: #666;">${pdfNote}</p>
      <p style="text-align: center; font-size: 11px; color: #999;">Data as of: ${valuation.dataAsOf} | Market Trend: ${valuation.marketTrend}</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} VinTraxx SmartScan. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await ensureTransporterVerified();

    logger.info('Sending appraisal email', {
      appraisalId: appraisal.appraisalId,
      vin: vehicle.vin,
      to: toEmail,
      hasPdf: Boolean(pdfPath),
    });

    const info = await transporter.sendMail({
      from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
      to: toEmail,
      subject,
      html: htmlBody,
      attachments: pdfPath
        ? [
            {
              filename: `VinTraxx-Appraisal-${vehicle.vin}.pdf`,
              path: pdfPath,
            },
          ]
        : [],
    });

    logger.info('Appraisal email sent', {
      appraisalId: appraisal.appraisalId,
      to: toEmail,
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
    });
  } catch (error) {
    logger.error('Failed to send appraisal email', {
      appraisalId: appraisal.appraisalId,
      to: toEmail,
      error: (error as Error).message,
    });
    throw error;
  }
}
