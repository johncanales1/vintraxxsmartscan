import { env } from '../config/env';
import { AppraisalSummaryData } from '../types';
import { formatCurrency } from '../utils/helpers';
import { getEmailLogoHeaderHtml } from '../utils/logos';
import logger from '../utils/logger';
import { EmailServiceUnavailableError, isSmtpAvailabilityError } from '../utils/errors';
// MEDIUM #21: transporter + verify-cache + health helpers now live in
// ../services/mailer. Re-export here so existing import sites in
// src/index.ts keep working without churn.
import { transporter, ensureTransporterVerified } from './mailer';

export { getSmtpHealth, verifyTransporterAtBoot } from './mailer';

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
        <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">${formatCurrency(src.wholesaleLow)} - ${formatCurrency(src.wholesaleHigh)}</td>
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
            <td style="padding: 8px 14px; text-align: center;">
              <div style="font-size: 10px; color: #666; text-transform: uppercase;">Wholesale (Auction)</div>
              <div style="font-size: 14px; font-weight: bold; color: #1a1a2e;">${formatCurrency(valuation.estimatedWholesaleLow)} – ${formatCurrency(valuation.estimatedWholesaleHigh)}</div>
            </td>
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
          <th style="text-align: center;">Wholesale</th>
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
      <div style="margin-bottom: 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        ${appraisal.photos.map((photoDataUri: string, idx: number) => `
          ${idx > 0 && idx % 2 === 0 ? '</tr><tr>' : ''}
          <td style="padding: 4px; width: 50%;">
            <img src="cid:photo${idx}" alt="Vehicle photo ${idx + 1}" style="width: 100%; max-width: 300px; height: auto; border-radius: 8px; border: 1px solid #eee;" />
          </td>
        `).join('')}
        </tr></table>
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

    // Build attachments: PDF (if any) + photo CID attachments
    const attachments: Array<{ filename: string; path?: string; content?: Buffer; cid?: string; contentType?: string }> = [];

    if (pdfPath) {
      attachments.push({
        filename: `VinTraxx-Appraisal-${vehicle.vin}.pdf`,
        path: pdfPath,
      });
    }

    // Add photos as CID attachments for inline embedding
    if (appraisal.photos && appraisal.photos.length > 0) {
      for (let idx = 0; idx < appraisal.photos.length; idx++) {
        const photoDataUri = appraisal.photos[idx];
        const base64Match = photoDataUri.match(/^data:image\/(\w+);base64,(.+)$/);
        if (base64Match) {
          const ext = base64Match[1] === 'jpeg' ? 'jpg' : base64Match[1];
          attachments.push({
            filename: `photo${idx}.${ext}`,
            content: Buffer.from(base64Match[2], 'base64'),
            cid: `photo${idx}`,
            contentType: `image/${base64Match[1]}`,
          });
        }
      }
      logger.info('Email photo attachments prepared', {
        appraisalId: appraisal.appraisalId,
        photoAttachments: attachments.length - (pdfPath ? 1 : 0),
      });
    }

    const info = await transporter.sendMail({
      from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
      to: toEmail,
      subject,
      html: htmlBody,
      attachments,
    });

    logger.info('Appraisal email sent', {
      appraisalId: appraisal.appraisalId,
      to: toEmail,
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
      envelopeFrom: info.envelope?.from,
      envelopeTo: info.envelope?.to,
      hasPdf: Boolean(pdfPath),
    });
  } catch (error) {
    const msg = (error as Error).message;
    logger.error('Failed to send appraisal email', {
      appraisalId: appraisal.appraisalId,
      to: toEmail,
      error: msg,
    });
    // If already classified upstream, pass through.
    if (error instanceof EmailServiceUnavailableError) {
      throw error;
    }
    if (isSmtpAvailabilityError(error)) {
      throw new EmailServiceUnavailableError(msg);
    }
    throw error;
  }
}
