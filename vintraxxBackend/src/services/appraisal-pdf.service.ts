import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { AppraisalSummaryData } from '../types';
import { APP_CONSTANTS } from '../config/constants';
import logger from '../utils/logger';

function fmtCurrency(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}

const C = {
  black: '#222222',
  darkGray: '#333333',
  gray: '#555555',
  medGray: '#666666',
  lightGray: '#999999',
  border: '#CCCCCC',
  tableBorder: '#DDDDDD',
  tableHeaderBg: '#F5F5F5',
  green: '#2E7D32',
  blue: '#1565C0',
  orange: '#E65100',
  red: '#D32F2F',
  navy: '#1a1a2e',
};

function drawTable(
  doc: PDFKit.PDFDocument,
  startX: number, startY: number, totalWidth: number,
  headers: { label: string; width: number; align?: string }[],
  rows: string[][],
  emptyMessage?: string,
): number {
  const rowHeight = 20;
  const headerHeight = 22;
  const padding = 6;
  let y = startY;

  doc.save();
  doc.rect(startX, y, totalWidth, headerHeight).fill(C.tableHeaderBg);
  doc.strokeColor(C.tableBorder).lineWidth(0.5);
  let hx = startX;
  for (const h of headers) {
    doc.rect(hx, y, h.width, headerHeight).stroke();
    doc.fontSize(9).font('Helvetica-Bold').fillColor(C.darkGray)
      .text(h.label, hx + padding, y + 6, { width: h.width - padding * 2, align: (h.align as any) || 'left' });
    hx += h.width;
  }
  y += headerHeight;
  doc.restore();

  if (rows.length === 0 && emptyMessage) {
    doc.save();
    doc.rect(startX, y, totalWidth, rowHeight).stroke();
    doc.fontSize(9).font('Helvetica').fillColor(C.lightGray)
      .text(emptyMessage, startX + padding, y + 5, { width: totalWidth - padding * 2, align: 'center' });
    doc.restore();
    y += rowHeight;
  } else {
    for (const row of rows) {
      if (y + rowHeight > doc.page.height - 60) {
        doc.addPage();
        y = 50;
      }
      doc.save();
      let rx = startX;
      for (let i = 0; i < headers.length; i++) {
        const h = headers[i];
        const cellText = row[i] || '';
        doc.strokeColor(C.tableBorder).lineWidth(0.5).rect(rx, y, h.width, rowHeight).stroke();
        doc.fontSize(9).font('Helvetica').fillColor(C.darkGray)
          .text(cellText, rx + padding, y + 5, { width: h.width - padding * 2, align: (h.align as any) || 'left' });
        rx += h.width;
      }
      doc.restore();
      y += rowHeight;
    }
  }
  return y;
}

export async function generateAppraisalPdf(appraisal: AppraisalSummaryData): Promise<string> {
  const reportsDir = path.resolve(APP_CONSTANTS.PDF_DIR);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const filename = `appraisal-${appraisal.appraisalId}-${Date.now()}.pdf`;
  const filePath = path.join(reportsDir, filename);

  const { vehicle, valuation, condition } = appraisal;
  const vehicleDisplay = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`;
  const mileageDisplay = `${vehicle.mileage.toLocaleString('en-US')} miles`;
  const conditionLabel = condition.charAt(0).toUpperCase() + condition.slice(1);
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });

  return new Promise<string>((resolve, reject) => {
    try {
      logger.info('Generating Appraisal PDF', { appraisalId: appraisal.appraisalId, filePath });

      const doc = new PDFDocument({
        size: 'letter',
        margins: { top: 36, bottom: 36, left: 54, right: 54 },
        info: {
          Title: `VinTraxx Trade-In Appraisal - ${vehicleDisplay}`,
          Author: 'VinTraxx SmartScan',
        },
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const leftMargin = doc.page.margins.left;
      let y = doc.page.margins.top;

      // ============ HEADER ============
      doc.save();
      doc.rect(leftMargin, y, pageWidth, 60).fill(C.navy);
      doc.fontSize(20).font('Helvetica-Bold').fillColor('#FFFFFF')
        .text('VinTraxx SmartScan', leftMargin + 16, y + 12, { width: pageWidth - 32 });
      doc.fontSize(12).font('Helvetica').fillColor('#CCCCCC')
        .text('Trade-In Appraisal Report', leftMargin + 16, y + 36, { width: pageWidth - 32 });
      doc.restore();
      y += 72;

      // ============ VEHICLE INFO ============
      doc.save();
      doc.strokeColor(C.border).lineWidth(1).rect(leftMargin, y, pageWidth, 55).stroke();
      doc.fontSize(14).font('Helvetica-Bold').fillColor(C.black)
        .text(vehicleDisplay, leftMargin + 12, y + 10, { width: pageWidth - 24 });
      doc.fontSize(10).font('Helvetica').fillColor(C.gray)
        .text(`VIN: ${vehicle.vin}  |  Mileage: ${mileageDisplay}  |  Condition: ${conditionLabel}`, leftMargin + 12, y + 30, { width: pageWidth - 24 });
      doc.restore();
      y += 68;

      // ============ TRADE-IN VALUATION BOX ============
      doc.save();
      doc.strokeColor(C.green).lineWidth(2).rect(leftMargin, y, pageWidth, 65).stroke();
      doc.fontSize(10).font('Helvetica').fillColor(C.medGray)
        .text('SMARTSCAN ESTIMATED TRADE-IN RANGE', leftMargin, y + 10, { width: pageWidth, align: 'center' });
      doc.fontSize(24).font('Helvetica-Bold').fillColor(C.green)
        .text(`${fmtCurrency(valuation.estimatedTradeInLow)} – ${fmtCurrency(valuation.estimatedTradeInHigh)}`, leftMargin, y + 28, { width: pageWidth, align: 'center' });
      doc.restore();
      y += 78;

      // ============ VALUE TIERS ROW ============
      const tierBoxW = Math.floor((pageWidth - 16) / 3);
      const tierBoxH = 50;
      const gap = 8;

      // Retail Value
      doc.save();
      doc.strokeColor(C.border).lineWidth(1).rect(leftMargin, y, tierBoxW, tierBoxH).stroke();
      doc.fontSize(8).font('Helvetica').fillColor(C.medGray)
        .text('RETAIL VALUE', leftMargin, y + 8, { width: tierBoxW, align: 'center' });
      doc.fontSize(13).font('Helvetica-Bold').fillColor(C.black)
        .text(`${fmtCurrency(valuation.estimatedRetailLow)} – ${fmtCurrency(valuation.estimatedRetailHigh)}`, leftMargin, y + 24, { width: tierBoxW, align: 'center' });
      doc.restore();

      // Private Party Value
      doc.save();
      doc.strokeColor(C.border).lineWidth(1).rect(leftMargin + tierBoxW + gap, y, tierBoxW, tierBoxH).stroke();
      doc.fontSize(8).font('Helvetica').fillColor(C.medGray)
        .text('PRIVATE PARTY VALUE', leftMargin + tierBoxW + gap, y + 8, { width: tierBoxW, align: 'center' });
      doc.fontSize(13).font('Helvetica-Bold').fillColor(C.black)
        .text(`${fmtCurrency(valuation.estimatedPrivatePartyLow)} – ${fmtCurrency(valuation.estimatedPrivatePartyHigh)}`, leftMargin + tierBoxW + gap, y + 24, { width: tierBoxW, align: 'center' });
      doc.restore();

      // Confidence & Trend
      doc.save();
      doc.strokeColor(C.border).lineWidth(1).rect(leftMargin + (tierBoxW + gap) * 2, y, tierBoxW, tierBoxH).stroke();
      doc.fontSize(8).font('Helvetica').fillColor(C.medGray)
        .text('CONFIDENCE / TREND', leftMargin + (tierBoxW + gap) * 2, y + 8, { width: tierBoxW, align: 'center' });
      const confColor = valuation.confidenceLevel === 'high' ? C.green : valuation.confidenceLevel === 'medium' ? C.orange : C.red;
      doc.fontSize(13).font('Helvetica-Bold').fillColor(confColor)
        .text(`${valuation.confidenceLevel.toUpperCase()} / ${valuation.marketTrend.toUpperCase()}`, leftMargin + (tierBoxW + gap) * 2, y + 24, { width: tierBoxW, align: 'center' });
      doc.restore();

      y += tierBoxH + 20;

      // ============ SOURCE ANCHORS TABLE ============
      doc.fontSize(13).font('Helvetica-Bold').fillColor(C.darkGray).text('Source Anchors', leftMargin, y);
      y += 16;
      doc.strokeColor(C.darkGray).lineWidth(2).moveTo(leftMargin, y).lineTo(leftMargin + pageWidth, y).stroke();
      y += 8;

      const sourceHeaders = [
        { label: 'Source', width: Math.floor(pageWidth * 0.25) },
        { label: 'Trade-In', width: Math.floor(pageWidth * 0.25), align: 'center' },
        { label: 'Retail', width: Math.floor(pageWidth * 0.25), align: 'center' },
        { label: 'Private Party', width: Math.floor(pageWidth * 0.25), align: 'center' },
      ];
      const sourceRows = valuation.comparableSources.map(src => [
        src.sourceName,
        `${fmtCurrency(src.tradeInLow)} - ${fmtCurrency(src.tradeInHigh)}`,
        `${fmtCurrency(src.retailLow)} - ${fmtCurrency(src.retailHigh)}`,
        `${fmtCurrency(src.privatePartyLow)} - ${fmtCurrency(src.privatePartyHigh)}`,
      ]);
      y = drawTable(doc, leftMargin, y, pageWidth, sourceHeaders, sourceRows);
      y += 20;

      // ============ ADJUSTMENTS TABLE ============
      if (y + 60 > doc.page.height - 60) { doc.addPage(); y = 50; }
      doc.fontSize(13).font('Helvetica-Bold').fillColor(C.darkGray).text('Value Adjustments', leftMargin, y);
      y += 16;
      doc.strokeColor(C.darkGray).lineWidth(2).moveTo(leftMargin, y).lineTo(leftMargin + pageWidth, y).stroke();
      y += 8;

      const adjHeaders = [
        { label: 'Factor', width: Math.floor(pageWidth * 0.25) },
        { label: 'Impact', width: Math.floor(pageWidth * 0.20), align: 'right' },
        { label: 'Explanation', width: Math.floor(pageWidth * 0.55) },
      ];
      const adjRows = valuation.adjustments.map(adj => {
        const sign = adj.impact >= 0 ? '+' : '';
        return [adj.factor, `${sign}${fmtCurrency(adj.impact)}`, adj.explanation];
      });
      y = drawTable(doc, leftMargin, y, pageWidth, adjHeaders, adjRows);
      y += 20;

      // ============ AI SUMMARY ============
      if (y + 60 > doc.page.height - 60) { doc.addPage(); y = 50; }
      doc.fontSize(13).font('Helvetica-Bold').fillColor(C.darkGray).text('AI Summary', leftMargin, y);
      y += 16;
      doc.strokeColor(C.darkGray).lineWidth(2).moveTo(leftMargin, y).lineTo(leftMargin + pageWidth, y).stroke();
      y += 10;

      doc.save();
      doc.strokeColor(C.navy).lineWidth(3).moveTo(leftMargin, y).lineTo(leftMargin, y + 50).stroke();
      doc.fontSize(10).font('Helvetica').fillColor(C.gray)
        .text(valuation.aiSummary, leftMargin + 12, y + 4, { width: pageWidth - 20 });
      doc.restore();
      y += 70;

      // ============ FOOTER ============
      if (y + 30 > doc.page.height - 36) { doc.addPage(); y = doc.page.height - 70; }
      doc.strokeColor(C.border).lineWidth(0.5).moveTo(leftMargin, y).lineTo(leftMargin + pageWidth, y).stroke();
      y += 8;
      doc.fontSize(8).font('Helvetica').fillColor(C.lightGray);
      doc.text(`User: ${appraisal.userEmail}`, leftMargin, y, { width: pageWidth / 3, align: 'left' });
      doc.text(`${appraisal.appraisalId}`, leftMargin + pageWidth / 3, y, { width: pageWidth / 3, align: 'center' });
      doc.text(`Date: ${generatedDate}  |  Data: ${valuation.dataAsOf}`, leftMargin + (pageWidth / 3) * 2, y, { width: pageWidth / 3, align: 'right' });

      doc.end();

      stream.on('finish', () => {
        logger.info('Appraisal PDF generated successfully', { appraisalId: appraisal.appraisalId, filePath });
        resolve(filePath);
      });
      stream.on('error', (err) => {
        logger.error('Appraisal PDF write stream error', { appraisalId: appraisal.appraisalId, error: err.message });
        reject(err);
      });
    } catch (error) {
      logger.error('Appraisal PDF generation failed', {
        appraisalId: appraisal.appraisalId,
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      reject(error);
    }
  });
}
