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

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const leftMargin = doc.page.margins.left;
      let y = doc.page.margins.top;

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
      });

      y += boxH + 20;

      // ============ ESTIMATED RECONDITIONING COSTS ============
      doc.fontSize(13).font('Helvetica-Bold').fillColor(C.darkGray).text('Estimated Reconditioning Costs', leftMargin, y);
      y += 16;
      doc.strokeColor(C.darkGray).lineWidth(2).moveTo(leftMargin, y).lineTo(leftMargin + pageWidth, y).stroke();
      y += 10;

      // Cost box on left
      const costBoxW = 140;
      const costBoxH = 60;
      doc.save();
      doc.strokeColor(C.tableBorder).lineWidth(1).rect(leftMargin, y, costBoxW, costBoxH).stroke();
      doc.fontSize(8).font('Helvetica').fillColor(C.medGray)
        .text('Reconditioning Cost', leftMargin, y + 8, { width: costBoxW, align: 'center' });
      doc.fontSize(22).font('Helvetica-Bold').fillColor(C.black)
        .text(fmtCurrency(report.totalEstimatedRepairCost), leftMargin, y + 24, { width: costBoxW, align: 'center' });
      doc.restore();

      // Repairs table on right
      const tableX = leftMargin + costBoxW + 16;
      const tableW = pageWidth - costBoxW - 16;
      const repairHeaders = [
        { label: 'Repairs', width: tableW - 140 },
        { label: 'Parts', width: 70, align: 'right' },
        { label: 'Labor', width: 70, align: 'right' },
      ];
      const repairRows = report.repairRecommendations.map(r => [
        r.description.length > 60 ? r.description.substring(0, 57) + '...' : r.description,
        fmtCurrency(r.estimatedCost.parts),
        fmtCurrency(r.estimatedCost.labor),
      ]);
      const tableEndY = drawTable(doc, tableX, y, tableW, repairHeaders, repairRows, 'No repairs needed');
      y = Math.max(y + costBoxH, tableEndY) + 20;

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
      y += 30;

      // ============ FOOTER ============
      if (y + 30 > doc.page.height - 36) { doc.addPage(); y = doc.page.height - 70; }
      doc.strokeColor(C.border).lineWidth(0.5).moveTo(leftMargin, y).lineTo(leftMargin + pageWidth, y).stroke();
      y += 8;
      doc.fontSize(8).font('Helvetica').fillColor(C.lightGray);
      doc.text(`User: ${report.reportMetadata.userEmail}`, leftMargin, y, { width: pageWidth / 3, align: 'left' });
      doc.text(`${report.reportMetadata.reportId} v:${report.reportMetadata.reportVersion}`, leftMargin + pageWidth / 3, y, { width: pageWidth / 3, align: 'center' });
      doc.text(`Date: ${generatedDate}`, leftMargin + (pageWidth / 3) * 2, y, { width: pageWidth / 3, align: 'right' });

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
