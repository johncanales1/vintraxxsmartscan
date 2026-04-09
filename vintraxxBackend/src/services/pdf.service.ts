import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { FullReportData } from '../types';
import { APP_CONSTANTS } from '../config/constants';
import logger from '../utils/logger';

// Helper formatters
function fmtCurrency(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}

function fmtNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return 'N/A';
  return Math.round(num).toLocaleString('en-US');
}

function fmtMileage(num: number | null | undefined): string {
  if (num === null || num === undefined) return 'N/A';
  return `~ ${Math.round(num).toLocaleString('en-US')} mi`;
}

function fmtCostRange(low: number, high: number): string {
  return `$${Math.round(low).toLocaleString('en-US')} - $${Math.round(high).toLocaleString('en-US')}`;
}

// Colors
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
  checkGreen: '#4CAF50',
};

// Draw a bordered box with title and content callback
function drawHeaderBox(
  doc: PDFKit.PDFDocument,
  x: number, y: number, w: number, h: number,
  titleColor: string, title: string,
  contentFn: (doc: PDFKit.PDFDocument, cx: number, cy: number, cw: number) => void,
): void {
  doc.save();
  doc.lineWidth(1).strokeColor(C.border).rect(x, y, w, h).stroke();
  doc.fontSize(11).font('Helvetica-Bold').fillColor(titleColor).text(title, x + 10, y + 10, { width: w - 20 });
  contentFn(doc, x + 10, y + 26, w - 20);
  doc.restore();
}

// Draw a table
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

  // Header
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

  // Rows
  if (rows.length === 0 && emptyMessage) {
    doc.save();
    doc.rect(startX, y, totalWidth, rowHeight).stroke();
    doc.fontSize(9).font('Helvetica').fillColor(C.lightGray)
      .text(emptyMessage, startX + padding, y + 5, { width: totalWidth - padding * 2, align: 'center' });
    doc.restore();
    y += rowHeight;
  } else {
    for (const row of rows) {
      // Check page break
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
        const fontName = i === 0 && cellText.match(/^[PCBU]\d/) ? 'Courier' : 'Helvetica';
        const color = i === 0 && cellText.match(/^[PCBU]\d/) ? C.blue : C.darkGray;
        doc.fontSize(9).font(fontName).fillColor(color)
          .text(cellText, rx + padding, y + 5, { width: h.width - padding * 2, align: (h.align as any) || 'left' });
        rx += h.width;
      }
      doc.restore();
      y += rowHeight;
    }
  }
  return y;
}

export async function generatePdf(report: FullReportData): Promise<string> {
  const reportsDir = path.resolve(APP_CONSTANTS.PDF_DIR);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const filename = `report-${report.scanId}-${Date.now()}.pdf`;
  const filePath = path.join(reportsDir, filename);

  const vehicleDisplay = `${report.vehicle.year} ${report.vehicle.make} ${report.vehicle.model}`;
  const mileageDisplay = report.vehicle.mileage
    ? `${Math.round(report.vehicle.mileage).toLocaleString('en-US')} miles`
    : 'N/A';
  const distanceDisplay = report.codesLastReset.distanceMiles
    ? `${Math.round(report.codesLastReset.distanceMiles).toLocaleString('en-US')} miles ago`
    : 'N/A';
  const generatedDate = new Date(report.reportMetadata.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });

  return new Promise<string>((resolve, reject) => {
    try {
      logger.info('Generating PDF with PDFKit', { scanId: report.scanId, filePath });

      const doc = new PDFDocument({
        size: 'letter',
        margins: { top: 36, bottom: 36, left: 54, right: 54 },
        info: {
          Title: `VinTraxx SmartScan Report - ${vehicleDisplay}`,
          Author: 'VinTraxx SmartScan',
        },
      });

      logger.info('Generating PDF with stock number', {
        scanId: report.scanId,
        stockNumber: report.stockNumber || undefined,
        hasStockNumber: Boolean(report.stockNumber),
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const leftMargin = doc.page.margins.left;
      let y = doc.page.margins.top;

      // ============ LOGO HEADER ============
      const logoHeaderH = 70;
      doc.save();
      doc.rect(leftMargin, y, pageWidth, logoHeaderH).fill('#1a1a2e');

      const logoH = 40;
      const logoW = 90;
      const logoY = y + (logoHeaderH - logoH) / 2;
      const vintraxxLogoPath = path.resolve(process.cwd(), 'src/assets/VinTraxxLOGO.jpeg');

      // VinTraxx logo on the left
      try {
        if (fs.existsSync(vintraxxLogoPath)) {
          doc.image(vintraxxLogoPath, leftMargin + 12, logoY, { width: logoW, height: logoH, fit: [logoW, logoH] });
        }
      } catch (logoErr) {
        logger.warn('Failed to load VinTraxx logo for scan PDF', { error: (logoErr as Error).message });
      }

      // Load dealer logo on the right (or fall back to Motors logo)
      let rightLogoLoaded = false;
      if (report.dealerLogoUrl) {
        try {
          if (report.dealerLogoUrl.startsWith('data:image/')) {
            const base64Match = report.dealerLogoUrl.match(/^data:image\/\w+;base64,(.+)$/);
            if (base64Match) {
              const imgBuffer = Buffer.from(base64Match[1], 'base64');
              doc.image(imgBuffer, leftMargin + pageWidth - logoW - 12, logoY, { width: logoW, height: logoH, fit: [logoW, logoH] });
              rightLogoLoaded = true;
            }
          } else if (report.dealerLogoUrl.includes('/dealer-logos/')) {
            const dlFilename = report.dealerLogoUrl.split('/dealer-logos/').pop();
            if (dlFilename) {
              const logoPath = path.resolve(process.cwd(), 'src/assets/dealer-logos', dlFilename);
              if (fs.existsSync(logoPath)) {
                doc.image(logoPath, leftMargin + pageWidth - logoW - 12, logoY, { width: logoW, height: logoH, fit: [logoW, logoH] });
                rightLogoLoaded = true;
              }
            }
          }
        } catch (logoErr) {
          logger.warn('Failed to load dealer logo for scan PDF', { error: (logoErr as Error).message });
        }
      }

      // Fall back to 35Motors logo on right if no dealer logo
      if (!rightLogoLoaded) {
        const motorsLogoPath = path.resolve(process.cwd(), 'src/assets/35MotorsLOGO.jpeg');
        try {
          if (fs.existsSync(motorsLogoPath)) {
            doc.image(motorsLogoPath, leftMargin + pageWidth - logoW - 12, logoY, { width: logoW, height: logoH, fit: [logoW, logoH] });
          }
        } catch (logoErr) {
          logger.warn('Failed to load 35Motors logo for scan PDF', { error: (logoErr as Error).message });
        }
      }

      doc.fontSize(18).font('Helvetica-Bold').fillColor('#FFFFFF')
        .text('Diagnostic Scan Report', leftMargin + logoW + 20, y + 14, { width: pageWidth - (logoW + 20) * 2, align: 'center' });
      doc.fontSize(11).font('Helvetica').fillColor('#CCCCCC')
        .text('VinTraxx SmartScan', leftMargin + logoW + 20, y + 38, { width: pageWidth - (logoW + 20) * 2, align: 'center' });
      doc.restore();
      y += logoHeaderH + 12;

      // ============ HEADER ROW: 3 columns ============
      const boxW = Math.floor((pageWidth - 16) / 3);
      const boxH = 80;
      const gap = 8;

      // Codes Last Reset
      drawHeaderBox(doc, leftMargin, y, boxW, boxH, C.green, 'Codes Last Reset', (d, cx, cy, cw) => {
        d.fontSize(12).font('Helvetica-Bold').fillColor(C.black).text(distanceDisplay, cx, cy, { width: cw });
        d.fontSize(8).font('Helvetica').fillColor(C.medGray)
          .text('Emissions Monitors are set and codes shown accurately reflect the status of the vehicle.', cx, cy + 18, { width: cw });
      });

      // Emissions Check
      drawHeaderBox(doc, leftMargin + boxW + gap, y, boxW, boxH, C.blue, 'Emissions Check', (d, cx, cy, cw) => {
        const passed = report.emissionsCheck.status === 'pass';
        d.fontSize(10).font('Helvetica-Bold').fillColor(passed ? C.green : C.red)
          .text(passed ? 'Emissions Passed' : 'Emissions Failed', cx, cy, { width: cw });
        d.fontSize(9).font('Helvetica').fillColor(C.darkGray)
          .text(`✔ ${report.emissionsCheck.testsPassed} Tests Passed`, cx, cy + 16, { width: cw })
          .text(`${report.emissionsCheck.testsFailed > 0 ? '✘' : '✔'} ${report.emissionsCheck.testsFailed} Tests Failed`, cx, cy + 30, { width: cw });
      });

      // Vehicle Information
      drawHeaderBox(doc, leftMargin + (boxW + gap) * 2, y, boxW, boxH, C.orange, 'Vehicle Information', (d, cx, cy, cw) => {
        d.fontSize(10).font('Helvetica-Bold').fillColor(C.black).text(report.vehicle.vin, cx, cy, { width: cw });
        d.fontSize(9).font('Helvetica').fillColor(C.gray)
          .text(vehicleDisplay, cx, cy + 16, { width: cw })
          .text(mileageDisplay, cx, cy + 30, { width: cw });
        if (report.stockNumber) {
          d.fontSize(9).font('Helvetica-Bold').fillColor(C.blue)
            .text(`Stock #: ${report.stockNumber}`, cx, cy + 44, { width: cw });
        }
      });

      y += boxH + 8;

      // ============ USER INFORMATION BLOCK ============
      const userBoxH = 60;
      doc.save();
      doc.lineWidth(1).strokeColor(C.border).rect(leftMargin, y, pageWidth, userBoxH).stroke();
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#8B2332').text('User Information', leftMargin + 10, y + 8, { width: pageWidth - 20 });
      const uiY = y + 22;
      const uiColW = Math.floor(pageWidth / 2);
      doc.fontSize(8).font('Helvetica').fillColor(C.medGray);
      doc.text(`Email Owner: ${report.reportMetadata.userFullName || 'N/A'}`, leftMargin + 10, uiY, { width: uiColW - 20 });
      doc.text(`Email: ${report.reportMetadata.userEmail}`, leftMargin + uiColW + 10, uiY, { width: uiColW - 20 });
      doc.text(`Scanner Owner: ${report.reportMetadata.scannerOwnerName || 'N/A'}`, leftMargin + 10, uiY + 14, { width: uiColW - 20 });
      doc.text(`Vehicle Owner: ${report.reportMetadata.vehicleOwnerName || 'N/A'}`, leftMargin + uiColW + 10, uiY + 14, { width: uiColW - 20 });
      doc.restore();
      y += userBoxH + 12;

      // ============ ESTIMATED RECONDITIONING COSTS ============
      doc.fontSize(13).font('Helvetica-Bold').fillColor(C.darkGray).text('Estimated Reconditioning Costs', leftMargin, y);
      y += 16;
      doc.strokeColor(C.darkGray).lineWidth(2).moveTo(leftMargin, y).lineTo(leftMargin + pageWidth, y).stroke();
      y += 10;

      // Cost summary box (full width)
      const costBoxH = 44;
      doc.save();
      doc.rect(leftMargin, y, pageWidth, costBoxH).fill('#F8F8F8');
      doc.strokeColor(C.tableBorder).lineWidth(1).rect(leftMargin, y, pageWidth, costBoxH).stroke();
      doc.fontSize(9).font('Helvetica').fillColor(C.medGray)
        .text('Estimated Reconditioning Cost', leftMargin + 14, y + 8, { width: 200 });
      doc.fontSize(22).font('Helvetica-Bold').fillColor(C.black)
        .text(fmtCurrency(report.totalEstimatedRepairCost), leftMargin + 14, y + 20, { width: 200 });
      doc.restore();
      y += costBoxH + 10;

      // Repairs table (full width)
      const repairHeaders = [
        { label: 'Repairs', width: pageWidth - 140 },
        { label: 'Parts', width: 70, align: 'right' },
        { label: 'Labor', width: 70, align: 'right' },
      ];
      const repairRows = report.repairRecommendations.map(r => [
        r.description.length > 70 ? r.description.substring(0, 67) + '...' : r.description,
        fmtCurrency(r.estimatedCost.parts),
        fmtCurrency(r.estimatedCost.labor),
      ]);
      const tableEndY = drawTable(doc, leftMargin, y, pageWidth, repairHeaders, repairRows, 'No repairs needed');
      y = tableEndY + 20;

      // ============ DIAGNOSTIC TROUBLE CODES ============
      if (y + 60 > doc.page.height - 60) { doc.addPage(); y = 50; }
      doc.fontSize(13).font('Helvetica-Bold').fillColor(C.darkGray).text('Diagnostic Trouble Codes', leftMargin, y);
      y += 16;
      doc.strokeColor(C.darkGray).lineWidth(2).moveTo(leftMargin, y).lineTo(leftMargin + pageWidth, y).stroke();
      y += 8;

      doc.fontSize(9).font('Helvetica').fillColor(C.gray)
        .text(`${fmtNumber(report.datapointsScanned)} datapoints were scanned across the ${report.modulesScanned.join(', ')}`, leftMargin, y, { width: pageWidth });
      y += 16;

      const dtcHeaders = [
        { label: 'Code', width: 80 },
        { label: 'Module', width: 130 },
        { label: 'Details', width: pageWidth - 210 },
      ];
      const dtcRows = report.dtcAnalysis.map(dtc => [
        dtc.code,
        dtc.category,
        dtc.description.length > 70 ? dtc.description.substring(0, 67) + '...' : dtc.description,
      ]);
      y = drawTable(doc, leftMargin, y, pageWidth, dtcHeaders, dtcRows, 'No diagnostic trouble codes found');
      y += 20;

      // ============ MILEAGE BASED RISK ASSESSMENT ============
      if (y + 60 > doc.page.height - 60) { doc.addPage(); y = 50; }
      doc.fontSize(13).font('Helvetica-Bold').fillColor(C.darkGray).text('Mileage Based Risk Assessment', leftMargin, y);
      y += 16;
      doc.strokeColor(C.darkGray).lineWidth(2).moveTo(leftMargin, y).lineTo(leftMargin + pageWidth, y).stroke();
      y += 8;

      const riskHeaders = [
        { label: 'Potential Issue', width: pageWidth - 240 },
        { label: 'Cost Estimates', width: 130 },
        { label: 'Mileage Estimate', width: 110 },
      ];
      const riskRows = report.mileageRiskAssessment.map(r => [
        r.issue,
        fmtCostRange(r.costEstimateLow, r.costEstimateHigh),
        fmtMileage(r.mileageEstimate),
      ]);
      y = drawTable(doc, leftMargin, y, pageWidth, riskHeaders, riskRows, 'No mileage-based risks identified');
      y += 20;

      // ============ ADDITIONAL REPAIRS (if any) ============
      if (report.additionalRepairs && report.additionalRepairs.length > 0) {
        if (y + 60 > doc.page.height - 60) { doc.addPage(); y = 50; }
        doc.fontSize(13).font('Helvetica-Bold').fillColor(C.darkGray).text('Additional Repairs', leftMargin, y);
        y += 16;
        doc.strokeColor(C.darkGray).lineWidth(2).moveTo(leftMargin, y).lineTo(leftMargin + pageWidth, y).stroke();
        y += 8;

        const addRepairHeaders = [
          { label: 'Repair', width: pageWidth - 210 },
          { label: 'Parts', width: 70, align: 'right' },
          { label: 'Labor', width: 70, align: 'right' },
          { label: 'Total', width: 70, align: 'right' },
        ];
        const addRepairRows = report.additionalRepairs.map(r => [
          r.name.length > 50 ? r.name.substring(0, 47) + '...' : r.name,
          fmtCurrency(r.partsCost),
          fmtCurrency(r.laborCost),
          fmtCurrency(r.totalCost),
        ]);
        y = drawTable(doc, leftMargin, y, pageWidth, addRepairHeaders, addRepairRows);
        y += 8;

        // Additional repairs total
        doc.fontSize(11).font('Helvetica-Bold').fillColor(C.darkGray)
          .text(`Additional Repairs Total: ${fmtCurrency(report.additionalRepairsTotalCost || 0)}`, leftMargin, y, { width: pageWidth, align: 'right' });
        y += 20;

        // Grand total box
        if (report.grandTotalCost !== undefined) {
          const grandTotalBoxH = 40;
          doc.save();
          doc.rect(leftMargin, y, pageWidth, grandTotalBoxH).fill('#1a1a2e');
          doc.fontSize(14).font('Helvetica-Bold').fillColor('#FFFFFF')
            .text(`Grand Total: ${fmtCurrency(report.grandTotalCost)}`, leftMargin + 14, y + 12, { width: pageWidth - 28, align: 'center' });
          doc.restore();
          y += grandTotalBoxH + 10;
        }
      }

      // ============ REPAIRS TOTAL COST (always shown) ============
      if (y + 50 > doc.page.height - 60) { doc.addPage(); y = 50; }
      const repairsTotalBoxH = 44;
      doc.save();
      doc.rect(leftMargin, y, pageWidth, repairsTotalBoxH).fill('#F0F4FF');
      doc.strokeColor(C.blue).lineWidth(1).rect(leftMargin, y, pageWidth, repairsTotalBoxH).stroke();
      doc.fontSize(9).font('Helvetica').fillColor(C.medGray)
        .text('Repairs Total Cost', leftMargin + 14, y + 8, { width: 200 });
      const grandTotal = (report.grandTotalCost !== undefined) ? report.grandTotalCost : report.totalEstimatedRepairCost;
      doc.fontSize(22).font('Helvetica-Bold').fillColor('#1a1a2e')
        .text(fmtCurrency(grandTotal), leftMargin + 14, y + 20, { width: 200 });
      doc.restore();
      y += repairsTotalBoxH + 4;

      // ============ VINTRAXX CAPITAL ADVERTISEMENT + QR CODE ============
      if (report.dealerQrCodeUrl) {
        // Calculate total height needed: header(60) + description(40) + steps(80) + scan-to-apply(20) + qr(120) + footer(30) = ~350
        const adTotalH = 350;
        if (y + adTotalH > doc.page.height - 60) { doc.addPage(); y = 50; }

        // --- Advertisement header ---
        doc.save();
        // VinTraxx Capital logo area
        const vinCapLogoPath = path.resolve(process.cwd(), 'src/assets/VinTraxxLOGO.jpeg');
        try {
          if (fs.existsSync(vinCapLogoPath)) {
            doc.image(vinCapLogoPath, leftMargin + 10, y + 4, { width: 60, height: 28, fit: [60, 28] });
          }
        } catch (_e) { /* ignore */ }
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#1a1a2e')
          .text('VinTraxx', leftMargin + 75, y + 6, { width: 80 });
        doc.fontSize(7).font('Helvetica').fillColor(C.medGray)
          .text('CAPITAL', leftMargin + 75, y + 16, { width: 80 });
        doc.restore();
        y += 36;

        // --- Heading ---
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#1a1a2e')
          .text('Your Next Step: Apply for Vehicle Repair Financing', leftMargin, y, { width: pageWidth, align: 'center' });
        y += 22;
        doc.fontSize(9).font('Helvetica').fillColor(C.gray)
          .text('You just completed a self diagnostic scan with VinTraxx Automotive. If your scan identified recommended repairs, VinTraxx Capital makes it easy to apply for financing right from your phone.', leftMargin + 20, y, { width: pageWidth - 40, align: 'center' });
        y += 36;

        // --- 3 Steps ---
        const stepW = Math.floor((pageWidth - 40) / 3);
        const stepsX = leftMargin + 20;
        const stepsData = [
          { num: '1', title: 'Review Your Scan Results', desc: 'Confirm the recommended repairs identified during your VinTraxx Automotive self scan.' },
          { num: '2', title: 'Scan the QR Code', desc: 'Use your phone camera to open the secure application and complete a quick request.' },
          { num: '3', title: 'Get Your Approval Options', desc: 'Receive a fast decision and move forward with financing for eligible repair costs.' },
        ];
        for (let si = 0; si < stepsData.length; si++) {
          const sx = stepsX + si * stepW;
          const step = stepsData[si];
          // Circle with number
          doc.save();
          doc.circle(sx + stepW / 2, y + 12, 14).fill('#1a1a2e');
          doc.fontSize(12).font('Helvetica-Bold').fillColor('#FFFFFF')
            .text(step.num, sx + stepW / 2 - 5, y + 6, { width: 10, align: 'center' });
          doc.restore();
          doc.fontSize(9).font('Helvetica-Bold').fillColor(C.darkGray)
            .text(step.title, sx + 4, y + 30, { width: stepW - 8, align: 'center' });
          doc.fontSize(7).font('Helvetica').fillColor(C.gray)
            .text(step.desc, sx + 4, y + 44, { width: stepW - 8, align: 'center' });
        }
        y += 76;

        // --- Scan to Apply ---
        doc.fontSize(13).font('Helvetica-Bold').fillColor(C.darkGray)
          .text('Scan to Apply', leftMargin, y, { width: pageWidth, align: 'center' });
        y += 16;
        doc.fontSize(8).font('Helvetica').fillColor(C.gray)
          .text('The QR code below takes the customer directly to the VinTraxx Capital application so they can request financing to help cover recommended vehicle service repairs.', leftMargin + 30, y, { width: pageWidth - 60, align: 'center' });
        y += 26;

        // --- QR Code Box ---
        const qrSize = 100;
        const qrBoxH = qrSize + 50;
        doc.save();
        doc.rect(leftMargin + 40, y, pageWidth - 80, qrBoxH).fill('#F8F8F8');
        doc.strokeColor(C.border).lineWidth(1).rect(leftMargin + 40, y, pageWidth - 80, qrBoxH).stroke();
        doc.restore();

        const qrX = leftMargin + (pageWidth - qrSize) / 2;
        const qrY = y + 8;
        let qrLoaded = false;

        try {
          if (report.dealerQrCodeUrl.startsWith('data:image/')) {
            const base64Match = report.dealerQrCodeUrl.match(/^data:image\/\w+;base64,(.+)$/);
            if (base64Match) {
              const imgBuffer = Buffer.from(base64Match[1], 'base64');
              doc.image(imgBuffer, qrX, qrY, { width: qrSize, height: qrSize, fit: [qrSize, qrSize] });
              qrLoaded = true;
            }
          } else if (report.dealerQrCodeUrl.includes('/dealer-qrcodes/')) {
            const qrFilename = report.dealerQrCodeUrl.split('/dealer-qrcodes/').pop();
            if (qrFilename) {
              const qrCodePath = path.resolve(process.cwd(), 'src/assets/dealer-qrcodes', qrFilename);
              if (fs.existsSync(qrCodePath)) {
                doc.image(qrCodePath, qrX, qrY, { width: qrSize, height: qrSize, fit: [qrSize, qrSize] });
                qrLoaded = true;
              }
            }
          }
        } catch (qrErr) {
          logger.warn('Failed to load dealer QR code for CTA section', { error: (qrErr as Error).message });
        }

        if (qrLoaded) {
          const textBelowQr = qrY + qrSize + 6;
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a2e')
            .text('Scan Here for Instant Repair Approval', leftMargin + 40, textBelowQr, { width: pageWidth - 80, align: 'center' });
          doc.fontSize(7).font('Helvetica').fillColor(C.gray)
            .text('Get a fast, hassle-free approval for all recommended repairs. Scan the QR code above to get started.', leftMargin + 40, textBelowQr + 14, { width: pageWidth - 80, align: 'center' });
        }
        y += qrBoxH + 8;

        // --- Advertisement footer ---
        doc.fontSize(7).font('Helvetica').fillColor(C.lightGray)
          .text('Fast mobile application. Quick decisioning. A simple next step after the diagnostic scan.', leftMargin, y, { width: pageWidth, align: 'center' });
        y += 14;
        doc.fontSize(7).font('Helvetica').fillColor(C.lightGray)
          .text('VinTraxx Capital  |  Repair Financing Next Step', leftMargin, y, { width: pageWidth, align: 'center' });
        y += 14;
      }

      // ============ FOOTER ============
      const footerY = doc.page.height - doc.page.margins.bottom - 22;
      doc.strokeColor(C.border).lineWidth(0.5).moveTo(leftMargin, footerY).lineTo(leftMargin + pageWidth, footerY).stroke();
      const footerColW = Math.floor(pageWidth / 3);
      doc.fontSize(8).font('Helvetica').fillColor(C.lightGray);
      const userDisplay = report.reportMetadata.userFullName 
        ? `${report.reportMetadata.userFullName} (${report.reportMetadata.userEmail})`
        : report.reportMetadata.userEmail;
      doc.text(`User: ${userDisplay}`, leftMargin, footerY + 8, { width: footerColW, align: 'left' });
      doc.text(`${report.reportMetadata.reportId} v:${report.reportMetadata.reportVersion}`, leftMargin + footerColW, footerY + 8, { width: footerColW, align: 'center' });
      doc.text(`Date: ${generatedDate}`, leftMargin + footerColW * 2, footerY + 8, { width: footerColW, align: 'right' });

      doc.end();

      stream.on('finish', () => {
        logger.info('PDF generated successfully', { scanId: report.scanId, filePath });
        resolve(filePath);
      });
      stream.on('error', (err) => {
        logger.error('PDF write stream error', { scanId: report.scanId, error: err.message });
        reject(err);
      });
    } catch (error) {
      logger.error('PDF generation failed', {
        scanId: report.scanId,
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      reject(error);
    }
  });
}
