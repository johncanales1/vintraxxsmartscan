/**
 * Render a GpsScanReport row as a clean diagnostic PDF.
 *
 * This is the "raw OBD" PDF — same shape the BLE scanner exposes BEFORE
 * the AI write-up. It's intended for ad-hoc share / email by an owner who
 * just wants a clean printable record without burning AI tokens.
 *
 * To get the full AI-analysed PDF the user taps "Generate AI Report" on
 * the same screen; that path goes through `promoteToAi` and re-uses the
 * existing `pdf.service.generatePdf(FullReportData)` flow.
 */

import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { APP_CONSTANTS } from '../config/constants';
import logger from '../utils/logger';
import type { GpsScanReport, GpsTerminal } from '@prisma/client';

const COLORS = {
  navy: '#1B3A5F',
  navyLight: '#2D5278',
  red: '#DC2626',
  amber: '#D97706',
  green: '#16A34A',
  slate: '#475569',
  slateLight: '#94A3B8',
  border: '#E2E8F0',
  bg: '#F1F5F9',
  bgLight: '#F8FAFC',
} as const;

/** Height of the section title bar drawn by drawSection. */
const TITLE_BAR_H = 30;

interface RenderInput {
  report: GpsScanReport;
  terminal: GpsTerminal;
  ownerName?: string | null;
  ownerEmail?: string | null;
}

export async function generateGpsScanReportPdf(input: RenderInput): Promise<string> {
  const reportsDir = path.resolve(APP_CONSTANTS.PDF_DIR);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  const fileName = `gps-scan-${input.report.id}.pdf`;
  const filePath = path.join(reportsDir, fileName);

  return new Promise<string>((resolve, reject) => {
    try {
      logger.info('Generating GPS Scan PDF', {
        scanReportId: input.report.id,
        filePath,
      });

      const doc = new PDFDocument({
        size: 'letter',
        margins: { top: 48, bottom: 48, left: 54, right: 54 },
        info: {
          Title: `VinTraxx GPS Scan Report ${input.report.id.slice(0, 8)}`,
          Author: 'VinTraxx SmartScan',
        },
      });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      drawHeader(doc, input);
      drawVehicleBlock(doc, input);
      drawSummaryBlock(doc, input);
      drawDtcBlock(doc, input);
      drawObdLiveBlock(doc, input);
      drawFooter(doc, input);

      doc.end();
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

function drawHeader(doc: PDFKit.PDFDocument, input: RenderInput) {
  const x = 54;
  const w = doc.page.width - 108;
  const boxH = 70;
  doc.save();
  doc.rect(x, 48, w, boxH).fill(COLORS.navy);
  doc.fill('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('VinTraxx', x + 16, 60);
  doc.fontSize(11).font('Helvetica').text('GPS Smart-Scan Diagnostic', x + 16, 84);
  doc.fontSize(9).fill('#CBD5E1').text(
    new Date(input.report.completedAt ?? input.report.requestedAt).toLocaleString(),
    x + 16,
    100,
  );
  doc.restore();
  doc.y = 48 + boxH + 14;
}

function drawVehicleBlock(doc: PDFKit.PDFDocument, input: RenderInput) {
  const { report, terminal } = input;
  const x = 54;
  const w = doc.page.width - 108;
  const y = doc.y;
  const blockH = 96;

  doc.save();
  doc.rect(x, y, w, blockH).lineWidth(1).strokeColor(COLORS.border).stroke();

  doc.fontSize(10).font('Helvetica-Bold').fill(COLORS.slate).text('VEHICLE', x + 16, y + 12);

  const vehicleLabel =
    [report.vehicleYear, report.vehicleMake, report.vehicleModel].filter(Boolean).join(' ') ||
    terminal.nickname ||
    `Device ${(terminal.deviceIdentifier ?? terminal.imei ?? '').slice(-6)}`;

  doc.fontSize(16).font('Helvetica-Bold').fill(COLORS.navy).text(vehicleLabel, x + 16, y + 30);
  doc.fontSize(10).font('Helvetica').fill(COLORS.slate);
  doc.text(`VIN: ${report.vin ?? '\u2014'}`, x + 16, y + 54);
  doc.text(`Mileage: ${formatMiles(report.mileageKm)}`, x + 16, y + 72);
  doc.text(`Plate: ${terminal.plateNumber ?? '\u2014'}`, x + w / 2, y + 54);
  doc.text(`Device: ${terminal.deviceIdentifier}`, x + w / 2, y + 72);
  doc.restore();
  doc.y = y + blockH + 10;
}

function drawSummaryBlock(doc: PDFKit.PDFDocument, input: RenderInput) {
  const { report } = input;
  const x = 54;
  const w = doc.page.width - 108;
  const y = doc.y;
  const blockH = TITLE_BAR_H + 68;

  doc.save();

  // Title bar
  doc.rect(x, y, w, TITLE_BAR_H).fill(COLORS.bg);
  doc.rect(x, y, w, blockH).lineWidth(1).strokeColor(COLORS.border).stroke();
  doc.moveTo(x, y + TITLE_BAR_H).lineTo(x + w, y + TITLE_BAR_H)
    .lineWidth(0.5).strokeColor(COLORS.border).stroke();
  doc.fontSize(10).font('Helvetica-Bold').fill(COLORS.navy).text('SUMMARY', x + 16, y + 9);

  const cy = y + TITLE_BAR_H;

  // MIL light
  const milOn = report.milOn === true;
  doc.circle(x + 24, cy + 22, 7).fill(milOn ? COLORS.amber : COLORS.green);
  doc.fontSize(12).font('Helvetica-Bold').fill('#0F172A').text(
    `MIL ${milOn ? 'ON' : 'OFF'}`,
    x + 38,
    cy + 14,
  );
  doc.font('Helvetica').fill(COLORS.slate).fontSize(9).text(
    milOn
      ? 'Check Engine indicator is illuminated.'
      : 'Check Engine indicator is not illuminated.',
    x + 38,
    cy + 32,
  );

  // DTC count + distance
  const total = report.dtcCount ?? 0;
  doc.fontSize(12).font('Helvetica-Bold').fill('#0F172A').text(
    `${total} stored DTC${total === 1 ? '' : 's'}`,
    x + w / 2,
    cy + 14,
  );
  doc.font('Helvetica').fill(COLORS.slate).fontSize(9).text(
    `Distance w/ MIL: ${formatMiles(report.distanceWithMilKm)}`,
    x + w / 2,
    cy + 32,
  );
  doc.text(
    `Warm-ups since clear: ${report.warmupsSinceClear ?? '\u2014'}`,
    x + w / 2,
    cy + 46,
  );

  doc.restore();
  doc.y = y + blockH + 10;
}

function drawDtcBlock(doc: PDFKit.PDFDocument, input: RenderInput) {
  const codes = [
    ...input.report.storedDtcCodes.map((c) => ({ code: c, bucket: 'Stored' })),
    ...input.report.pendingDtcCodes.map((c) => ({ code: c, bucket: 'Pending' })),
    ...input.report.permanentDtcCodes.map((c) => ({ code: c, bucket: 'Permanent' })),
  ];

  if (codes.length === 0) {
    drawSection(doc, 'DIAGNOSTIC TROUBLE CODES', (cx, cy, cw) => {
      // cy is already below the title bar
      doc.save();
      doc.circle(cx + 24, cy + 18, 6).fill(COLORS.green);
      doc.fontSize(11).font('Helvetica-Bold').fill(COLORS.green).text(
        'No fault codes reported.',
        cx + 36,
        cy + 12,
      );
      doc.fontSize(9).font('Helvetica').fill(COLORS.slate).text(
        'The ECU did not report any stored, pending, or permanent codes.',
        cx + 16,
        cy + 34,
      );
      doc.restore();
    }, 52);
    return;
  }

  const rowHeight = 24;
  const contentH = 12 + 16 + 8 + codes.length * rowHeight + 10;

  drawSection(doc, 'DIAGNOSTIC TROUBLE CODES', (cx, cy, cw) => {
    let yy = cy + 12;
    doc.fontSize(9).font('Helvetica-Bold').fill(COLORS.slate);
    doc.text('CODE', cx + 16, yy);
    doc.text('STATUS', cx + 160, yy);
    doc.text('PROTOCOL', cx + 280, yy);
    yy += 16;
    doc.lineWidth(0.5).strokeColor(COLORS.border)
      .moveTo(cx + 16, yy).lineTo(cx + cw - 16, yy).stroke();
    yy += 8;

    for (const c of codes) {
      doc.fontSize(11).font('Courier-Bold').fill(COLORS.red).text(c.code, cx + 16, yy);
      doc.fontSize(10).font('Helvetica').fill('#0F172A').text(c.bucket, cx + 160, yy);
      doc.fill(COLORS.slate).text(input.report.protocol ?? 'OBD-II', cx + 280, yy);
      yy += rowHeight;
    }
  }, contentH);
}

function drawObdLiveBlock(doc: PDFKit.PDFDocument, input: RenderInput) {
  const { report } = input;
  const rows: Array<[string, string]> = [
    ['Engine RPM', report.rpm != null ? `${report.rpm} rpm` : '\u2014'],
    ['Vehicle Speed', report.vehicleSpeedKmh != null ? `${Math.round(Number(report.vehicleSpeedKmh) * 0.621371)} mph` : '\u2014'],
    ['Coolant Temp', report.coolantTempC != null ? `${report.coolantTempC} \u00B0C` : '\u2014'],
    ['Intake Temp', report.intakeAirTempC != null ? `${report.intakeAirTempC} \u00B0C` : '\u2014'],
    ['Engine Load', report.engineLoadPct != null ? `${report.engineLoadPct}%` : '\u2014'],
    ['Throttle', report.throttlePct != null ? `${report.throttlePct}%` : '\u2014'],
    ['MAF', report.mafGps != null ? `${report.mafGps} g/s` : '\u2014'],
    ['Fuel Level', report.fuelLevelPct != null ? `${report.fuelLevelPct}%` : '\u2014'],
    ['Battery', report.batteryVoltageMv != null ? `${(report.batteryVoltageMv / 1000).toFixed(1)} V` : '\u2014'],
    ['Fuel System', report.fuelSystemStatus ?? '\u2014'],
    ['Secondary Air', report.secondaryAirStatus ?? '\u2014'],
    ['Dist. Since Clear', formatMiles(report.distanceSinceClearKm)],
    ['Runtime', report.runtimeSinceStartSec != null ? `${report.runtimeSinceStartSec} s` : '\u2014'],
  ];

  const rowH = 22;
  const numRows = Math.ceil(rows.length / 2);
  const contentH = 10 + numRows * rowH + 10;

  drawSection(doc, 'OBD LIVE DATA', (cx, cy, cw) => {
    let yy = cy + 10;
    const halfW = Math.floor(cw / 2);
    const labelW = 110;
    const valueX1 = cx + 16 + labelW;
    const labelX2 = cx + halfW + 8;
    const valueX2 = labelX2 + labelW;

    // Alternating row backgrounds for readability
    for (let i = 0; i < rows.length; i += 2) {
      const rowIdx = i / 2;
      if (rowIdx % 2 === 0) {
        doc.save();
        doc.rect(cx + 1, yy - 2, cw - 2, rowH).fill(COLORS.bgLight);
        doc.restore();
      }

      doc.fontSize(9).font('Helvetica').fill(COLORS.slate);
      doc.text(rows[i][0], cx + 16, yy, { width: labelW - 8, lineBreak: false });
      doc.font('Helvetica-Bold').fill('#0F172A');
      doc.text(rows[i][1], valueX1, yy, { width: halfW - labelW - 16, lineBreak: false });

      if (rows[i + 1]) {
        doc.fontSize(9).font('Helvetica').fill(COLORS.slate);
        doc.text(rows[i + 1][0], labelX2, yy, { width: labelW - 8, lineBreak: false });
        doc.font('Helvetica-Bold').fill('#0F172A');
        doc.text(rows[i + 1][1], valueX2, yy, { width: halfW - labelW - 16, lineBreak: false });
      }
      yy += rowH;
    }
  }, contentH);
}

function drawFooter(doc: PDFKit.PDFDocument, input: RenderInput) {
  const y = doc.page.height - 64;
  doc
    .fontSize(8)
    .font('Helvetica')
    .fill(COLORS.slateLight)
    .text(
      `Generated for ${input.ownerEmail ?? 'VinTraxx user'} • Report ${input.report.id} • VinTraxx SmartScan`,
      54,
      y,
      { width: doc.page.width - 108, align: 'center' },
    );
}

/**
 * Draw a bordered section with a dedicated title bar. `contentHeight` is the
 * height of the content area BELOW the title bar. `contentFn` receives the
 * content-area top Y so callers never have to account for the title.
 */
function drawSection(
  doc: PDFKit.PDFDocument,
  title: string,
  contentFn: (cx: number, cy: number, cw: number) => void,
  contentHeight: number,
) {
  const totalH = TITLE_BAR_H + contentHeight;
  if (doc.y + totalH > doc.page.height - 80) doc.addPage();
  const x = 54;
  const w = doc.page.width - 108;
  const y = doc.y;

  doc.save();

  // Title bar background
  doc.rect(x, y, w, TITLE_BAR_H).fill(COLORS.bg);

  // Full section border
  doc.rect(x, y, w, totalH).lineWidth(1).strokeColor(COLORS.border).stroke();

  // Divider between title bar and content
  doc.moveTo(x, y + TITLE_BAR_H).lineTo(x + w, y + TITLE_BAR_H)
    .lineWidth(0.5).strokeColor(COLORS.border).stroke();

  // Title text — vertically centred in the title bar
  doc.fontSize(10).font('Helvetica-Bold').fill(COLORS.navy)
    .text(title, x + 16, y + 9);

  doc.restore();

  // Content area starts BELOW the title bar
  contentFn(x, y + TITLE_BAR_H, w);
  doc.y = y + totalH + 10;
}

function formatMiles(km: unknown): string {
  if (km === null || km === undefined) return '\u2014';
  const numeric = typeof km === 'number' ? km : Number(km);
  if (!Number.isFinite(numeric)) return '\u2014';
  return `${Math.round(numeric * 0.621371).toLocaleString()} mi`;
}
