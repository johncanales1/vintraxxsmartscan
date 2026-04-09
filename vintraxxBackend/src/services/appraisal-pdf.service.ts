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

      // ============ HEADER WITH LOGOS ============
      const headerH = 70;
      doc.save();
      doc.rect(leftMargin, y, pageWidth, headerH).fill(C.navy);

      // Logos
      const logoH = 40;
      const logoW = 90;
      const logoY = y + (headerH - logoH) / 2;

      // Try multiple paths for logo resolution (works in both dev and production)
      const findLogoPath = (filename: string): string | null => {
        const candidates = [
          path.resolve(__dirname, '../assets', filename),
          path.resolve(__dirname, '../../src/assets', filename),
          path.resolve(process.cwd(), 'src/assets', filename),
          path.resolve(process.cwd(), 'dist/assets', filename),
        ];
        for (const p of candidates) {
          if (fs.existsSync(p)) {
            logger.info('Logo found', { filename, path: p });
            return p;
          }
        }
        logger.warn('Logo not found in any candidate path', { filename, candidates });
        return null;
      };

      const vintraxxLogoPath = findLogoPath('VinTraxxLOGO.jpeg');

      // For appraisal reports: VinTraxx logo on left, Dealer logo on right
      // VinTraxx logo always on the left
      try {
        if (vintraxxLogoPath) {
          doc.image(vintraxxLogoPath, leftMargin + 12, logoY, { width: logoW, height: logoH, fit: [logoW, logoH] });
        }
      } catch (logoErr) {
        logger.warn('Failed to load VinTraxx logo for PDF', { error: (logoErr as Error).message });
      }

      // Load dealer logo on the right (or fall back to Motors logo)
      let rightLogoLoaded = false;
      if (appraisal.dealerLogoUrl) {
        try {
          if (appraisal.dealerLogoUrl.startsWith('data:image/')) {
            // Base64 image
            const base64Match = appraisal.dealerLogoUrl.match(/^data:image\/\w+;base64,(.+)$/);
            if (base64Match) {
              const imgBuffer = Buffer.from(base64Match[1], 'base64');
              doc.image(imgBuffer, leftMargin + pageWidth - logoW - 12, logoY, { width: logoW, height: logoH, fit: [logoW, logoH] });
              rightLogoLoaded = true;
            }
          } else if (appraisal.dealerLogoUrl.includes('/dealer-logos/')) {
            // File path - extract filename and load from disk
            const filename = appraisal.dealerLogoUrl.split('/dealer-logos/').pop();
            if (filename) {
              const logoPath = path.resolve(process.cwd(), 'src/assets/dealer-logos', filename);
              if (fs.existsSync(logoPath)) {
                doc.image(logoPath, leftMargin + pageWidth - logoW - 12, logoY, { width: logoW, height: logoH, fit: [logoW, logoH] });
                rightLogoLoaded = true;
              }
            }
          }
        } catch (logoErr) {
          logger.warn('Failed to load dealer logo for appraisal PDF', { error: (logoErr as Error).message });
        }
      }

      // Fall back to 35Motors logo on right if no dealer logo
      if (!rightLogoLoaded) {
        const motorsLogoPath = findLogoPath('35MotorsLOGO.jpeg');
        try {
          if (motorsLogoPath) {
            doc.image(motorsLogoPath, leftMargin + pageWidth - logoW - 12, logoY, { width: logoW, height: logoH, fit: [logoW, logoH] });
          }
        } catch (logoErr) {
          logger.warn('Failed to load 35Motors logo for PDF', { error: (logoErr as Error).message });
        }
      }

      // Center title
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#FFFFFF')
        .text('Trade-In Appraisal', leftMargin + logoW + 20, y + 14, { width: pageWidth - (logoW + 20) * 2, align: 'center' });
      doc.fontSize(11).font('Helvetica').fillColor('#CCCCCC')
        .text('VinTraxx SmartScan Report', leftMargin + logoW + 20, y + 38, { width: pageWidth - (logoW + 20) * 2, align: 'center' });
      doc.restore();
      y += headerH + 12;

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

      // ============ VALUE TIERS ROW (4 columns) ============
      const tierBoxW = Math.floor((pageWidth - 18) / 4);
      const tierBoxH = 50;
      const gap = 6;

      // Wholesale Value
      doc.save();
      doc.strokeColor(C.border).lineWidth(1).rect(leftMargin, y, tierBoxW, tierBoxH).stroke();
      doc.fontSize(7).font('Helvetica').fillColor(C.medGray)
        .text('WHOLESALE (AUCTION)', leftMargin, y + 6, { width: tierBoxW, align: 'center' });
      doc.fontSize(11).font('Helvetica-Bold').fillColor(C.black)
        .text(`${fmtCurrency(valuation.estimatedWholesaleLow)} – ${fmtCurrency(valuation.estimatedWholesaleHigh)}`, leftMargin, y + 24, { width: tierBoxW, align: 'center' });
      doc.restore();

      // Retail Value
      doc.save();
      doc.strokeColor(C.border).lineWidth(1).rect(leftMargin + (tierBoxW + gap), y, tierBoxW, tierBoxH).stroke();
      doc.fontSize(7).font('Helvetica').fillColor(C.medGray)
        .text('RETAIL VALUE', leftMargin + (tierBoxW + gap), y + 6, { width: tierBoxW, align: 'center' });
      doc.fontSize(11).font('Helvetica-Bold').fillColor(C.black)
        .text(`${fmtCurrency(valuation.estimatedRetailLow)} – ${fmtCurrency(valuation.estimatedRetailHigh)}`, leftMargin + (tierBoxW + gap), y + 24, { width: tierBoxW, align: 'center' });
      doc.restore();

      // Private Party Value
      doc.save();
      doc.strokeColor(C.border).lineWidth(1).rect(leftMargin + (tierBoxW + gap) * 2, y, tierBoxW, tierBoxH).stroke();
      doc.fontSize(7).font('Helvetica').fillColor(C.medGray)
        .text('PRIVATE PARTY', leftMargin + (tierBoxW + gap) * 2, y + 6, { width: tierBoxW, align: 'center' });
      doc.fontSize(11).font('Helvetica-Bold').fillColor(C.black)
        .text(`${fmtCurrency(valuation.estimatedPrivatePartyLow)} – ${fmtCurrency(valuation.estimatedPrivatePartyHigh)}`, leftMargin + (tierBoxW + gap) * 2, y + 24, { width: tierBoxW, align: 'center' });
      doc.restore();

      // Confidence & Trend
      doc.save();
      doc.strokeColor(C.border).lineWidth(1).rect(leftMargin + (tierBoxW + gap) * 3, y, tierBoxW, tierBoxH).stroke();
      doc.fontSize(7).font('Helvetica').fillColor(C.medGray)
        .text('CONFIDENCE / TREND', leftMargin + (tierBoxW + gap) * 3, y + 6, { width: tierBoxW, align: 'center' });
      const confColor = valuation.confidenceLevel === 'high' ? C.green : valuation.confidenceLevel === 'medium' ? C.orange : C.red;
      doc.fontSize(11).font('Helvetica-Bold').fillColor(confColor)
        .text(`${valuation.confidenceLevel.toUpperCase()} / ${valuation.marketTrend.toUpperCase()}`, leftMargin + (tierBoxW + gap) * 3, y + 24, { width: tierBoxW, align: 'center' });
      doc.restore();

      y += tierBoxH + 20;

      // ============ SOURCE ANCHORS TABLE ============
      doc.fontSize(13).font('Helvetica-Bold').fillColor(C.darkGray).text('Source Anchors', leftMargin, y);
      y += 16;
      doc.strokeColor(C.darkGray).lineWidth(2).moveTo(leftMargin, y).lineTo(leftMargin + pageWidth, y).stroke();
      y += 8;

      const sourceHeaders = [
        { label: 'Source', width: Math.floor(pageWidth * 0.20) },
        { label: 'Wholesale', width: Math.floor(pageWidth * 0.20), align: 'center' },
        { label: 'Trade-In', width: Math.floor(pageWidth * 0.20), align: 'center' },
        { label: 'Retail', width: Math.floor(pageWidth * 0.20), align: 'center' },
        { label: 'Private Party', width: Math.floor(pageWidth * 0.20), align: 'center' },
      ];
      const sourceRows = valuation.comparableSources.map(src => [
        src.sourceName,
        `${fmtCurrency(src.wholesaleLow)} - ${fmtCurrency(src.wholesaleHigh)}`,
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

      // ============ VEHICLE PHOTOS ============
      logger.info('PDF photo embedding check', {
        appraisalId: appraisal.appraisalId,
        hasPhotos: !!(appraisal.photos && appraisal.photos.length > 0),
        photoCount: appraisal.photos?.length || 0,
      });

      if (appraisal.photos && appraisal.photos.length > 0) {
        if (y + 80 > doc.page.height - 60) { doc.addPage(); y = 50; }
        doc.fontSize(13).font('Helvetica-Bold').fillColor(C.darkGray).text('Vehicle Photos', leftMargin, y);
        y += 16;
        doc.strokeColor(C.darkGray).lineWidth(2).moveTo(leftMargin, y).lineTo(leftMargin + pageWidth, y).stroke();
        y += 10;

        const photoW = Math.floor((pageWidth - 12) / 2);
        const photoH = 150;
        let col = 0;
        let embeddedCount = 0;

        for (let idx = 0; idx < appraisal.photos.length; idx++) {
          const photoDataUri = appraisal.photos[idx];
          if (y + photoH + 10 > doc.page.height - 60) {
            doc.addPage();
            y = 50;
            col = 0;
          }

          try {
            // Extract base64 data from data URI
            const base64Match = photoDataUri.match(/^data:image\/\w+;base64,(.+)$/);
            if (base64Match) {
              const imgBuffer = Buffer.from(base64Match[1], 'base64');
              logger.debug('Embedding photo in PDF', {
                index: idx,
                bufferSizeKB: Math.round(imgBuffer.length / 1024),
              });
              const x = leftMargin + col * (photoW + 12);
              doc.image(imgBuffer, x, y, { width: photoW, height: photoH, fit: [photoW, photoH] });
              embeddedCount++;
              col++;
              if (col >= 2) {
                col = 0;
                y += photoH + 10;
              }
            } else {
              logger.warn('Photo data URI format invalid, skipping', { index: idx });
            }
          } catch (photoErr) {
            logger.warn('Failed to embed photo in PDF', { index: idx, error: (photoErr as Error).message });
          }
        }

        logger.info('PDF photos embedded', {
          appraisalId: appraisal.appraisalId,
          attempted: appraisal.photos.length,
          embedded: embeddedCount,
        });

        if (col > 0) y += photoH + 10;
        y += 10;
      }

      // ============ FOOTER ============
      if (y + 30 > doc.page.height - 36) { doc.addPage(); y = doc.page.height - 70; }
      doc.strokeColor(C.border).lineWidth(0.5).moveTo(leftMargin, y).lineTo(leftMargin + pageWidth, y).stroke();
      y += 8;
      doc.fontSize(8).font('Helvetica').fillColor(C.lightGray);
      const userDisplay = appraisal.userFullName
        ? `${appraisal.userFullName} (${appraisal.userEmail})`
        : appraisal.userEmail;
      doc.text(`User: ${userDisplay}`, leftMargin, y, { width: pageWidth / 3, align: 'left' });
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
