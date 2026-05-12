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
  border: '#E5E7EB',
  bg: '#F8FAFC',
} as const;

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
  const w = doc.page.width - 108;
  doc.save();
  doc.rect(54, 48, w, 60).fill(COLORS.navy);
  doc.fill('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('VinTraxx', 70, 64);
  doc.fontSize(12).font('Helvetica').text('GPS Smart-Scan Diagnostic', 70, 90);
  doc.fontSize(10).fill('#CBD5E1').text(
    new Date(input.report.completedAt ?? input.report.requestedAt).toLocaleString(),
    70,
    104,
  );
  doc.restore();
  doc.moveDown(2);
  doc.y = 130;
}

function drawVehicleBlock(doc: PDFKit.PDFDocument, input: RenderInput) {
  const { report, terminal } = input;
  const x = 54;
  const w = doc.page.width - 108;
  const y = doc.y;

  doc.save();
  doc.rect(x, y, w, 90).lineWidth(1).strokeColor(COLORS.border).stroke();

  doc.fontSize(10).font('Helvetica-Bold').fill(COLORS.slate).text('VEHICLE', x + 16, y + 12);

  const vehicleLabel =
    [report.vehicleYear, report.vehicleMake, report.vehicleModel].filter(Boolean).join(' ') ||
    terminal.nickname ||
    `Device ${(terminal.deviceIdentifier ?? terminal.imei ?? '').slice(-6)}`;

  doc.fontSize(16).font('Helvetica-Bold').fill(COLORS.navy).text(vehicleLabel, x + 16, y + 28);
  doc.fontSize(10).font('Helvetica').fill(COLORS.slate);
  doc.text(`VIN: ${report.vin ?? '—'}`, x + 16, y + 52);
  doc.text(`Mileage: ${formatMiles(report.mileageKm)}`, x + 16, y + 68);
  doc.text(`Plate: ${terminal.plateNumber ?? '—'}`, x + w / 2, y + 52);
  doc.text(`Device: ${terminal.deviceIdentifier}`, x + w / 2, y + 68);
  doc.restore();
  doc.y = y + 100;
}

function drawSummaryBlock(doc: PDFKit.PDFDocument, input: RenderInput) {
  const { report } = input;
  const x = 54;
  const w = doc.page.width - 108;
  const y = doc.y;

  doc.save();
  doc.rect(x, y, w, 92).lineWidth(1).strokeColor(COLORS.border).stroke();
  doc.fontSize(10).font('Helvetica-Bold').fill(COLORS.slate).text('SUMMARY', x + 16, y + 12);

  // MIL light
  const milOn = report.milOn === true;
  doc.circle(x + 24, y + 50, 7).fill(milOn ? COLORS.amber : COLORS.green);
  doc.fontSize(11).font('Helvetica-Bold').fill('#0F172A').text(
    `MIL ${milOn ? 'ON' : 'OFF'}`,
    x + 36,
    y + 44,
  );
  doc.font('Helvetica').fill(COLORS.slate).fontSize(9).text(
    milOn
      ? 'Check Engine indicator is illuminated.'
      : 'Check Engine indicator is not illuminated.',
    x + 36,
    y + 60,
  );

  // DTC count + distance
  const total = report.dtcCount ?? 0;
  doc.fontSize(11).font('Helvetica-Bold').fill('#0F172A').text(
    `${total} stored DTC${total === 1 ? '' : 's'}`,
    x + w / 2,
    y + 44,
  );
  doc.font('Helvetica').fill(COLORS.slate).fontSize(9).text(
    `Distance w/ MIL: ${formatMiles(report.distanceWithMilKm)}`,
    x + w / 2,
    y + 60,
  );
  doc.text(
    `Warm-ups since clear: ${report.warmupsSinceClear ?? '—'}`,
    x + w / 2,
    y + 74,
  );

  doc.restore();
  doc.y = y + 102;
}

function drawDtcBlock(doc: PDFKit.PDFDocument, input: RenderInput) {
  const codes = [
    ...input.report.storedDtcCodes.map((c) => ({ code: c, bucket: 'Stored' })),
    ...input.report.pendingDtcCodes.map((c) => ({ code: c, bucket: 'Pending' })),
    ...input.report.permanentDtcCodes.map((c) => ({ code: c, bucket: 'Permanent' })),
  ];
  if (codes.length === 0) {
    drawSection(doc, 'DIAGNOSTIC TROUBLE CODES', (cx, cy, cw) => {
      doc.fontSize(11).font('Helvetica').fill(COLORS.green).text(
        '✓ No fault codes reported.',
        cx + 16,
        cy + 16,
      );
      doc.fontSize(9).fill(COLORS.slate).text(
        'The ECU did not report any stored, pending, or permanent codes.',
        cx + 16,
        cy + 34,
      );
    }, 68);
    return;
  }

  const rowHeight = 22;
  const headerHeight = 28;
  const blockHeight = headerHeight + 16 + codes.length * rowHeight + 16;

  drawSection(doc, 'DIAGNOSTIC TROUBLE CODES', (cx, cy, cw) => {
    let yy = cy + 16;
    doc.fontSize(9).font('Helvetica-Bold').fill(COLORS.slate);
    doc.text('CODE', cx + 16, yy);
    doc.text('BUCKET', cx + 140, yy);
    doc.text('PROTOCOL', cx + 240, yy);
    yy += 16;
    doc.lineWidth(0.5).strokeColor(COLORS.border).moveTo(cx + 16, yy).lineTo(cx + cw - 16, yy).stroke();
    yy += 6;

    doc.fontSize(11).font('Courier-Bold').fill(COLORS.red);
    for (const c of codes) {
      doc.text(c.code, cx + 16, yy);
      doc.font('Helvetica').fill('#0F172A').text(c.bucket, cx + 140, yy);
      doc.fill(COLORS.slate).text(input.report.protocol ?? 'OBD-II', cx + 240, yy);
      doc.font('Courier-Bold').fill(COLORS.red);
      yy += rowHeight;
    }
  }, blockHeight);
}

function drawObdLiveBlock(doc: PDFKit.PDFDocument, input: RenderInput) {
  const { report } = input;
  const rows: Array<[string, string]> = [
    ['Engine RPM', report.rpm != null ? `${report.rpm} rpm` : '—'],
    ['Vehicle Speed', report.vehicleSpeedKmh != null ? `${Math.round(Number(report.vehicleSpeedKmh) * 0.621371)} mph` : '—'],
    ['Coolant Temp', report.coolantTempC != null ? `${report.coolantTempC} °C` : '—'],
    ['Intake Temp', report.intakeAirTempC != null ? `${report.intakeAirTempC} °C` : '—'],
    ['Engine Load', report.engineLoadPct != null ? `${report.engineLoadPct}%` : '—'],
    ['Throttle', report.throttlePct != null ? `${report.throttlePct}%` : '—'],
    ['MAF', report.mafGps != null ? `${report.mafGps} g/s` : '—'],
    ['Fuel Level', report.fuelLevelPct != null ? `${report.fuelLevelPct}%` : '—'],
    ['Battery', report.batteryVoltageMv != null ? `${(report.batteryVoltageMv / 1000).toFixed(1)} V` : '—'],
    ['Fuel-system status', report.fuelSystemStatus ?? '—'],
    ['Secondary-air status', report.secondaryAirStatus ?? '—'],
    ['Distance since clear', formatMiles(report.distanceSinceClearKm)],
    ['Runtime since start', report.runtimeSinceStartSec != null ? `${report.runtimeSinceStartSec} s` : '—'],
  ];

  const rowH = 20;
  const blockH = 28 + 12 + Math.ceil(rows.length / 2) * rowH + 20;

  drawSection(doc, 'OBD LIVE DATA', (cx, cy, cw) => {
    let yy = cy + 16;
    const colW = (cw - 32) / 2;
    for (let i = 0; i < rows.length; i += 2) {
      doc.fontSize(9).font('Helvetica').fill(COLORS.slate);
      doc.text(rows[i][0], cx + 16, yy);
      doc.font('Helvetica-Bold').fill('#0F172A').text(rows[i][1], cx + 16 + 110, yy);
      if (rows[i + 1]) {
        doc.fontSize(9).font('Helvetica').fill(COLORS.slate);
        doc.text(rows[i + 1][0], cx + 16 + colW, yy);
        doc.font('Helvetica-Bold').fill('#0F172A').text(rows[i + 1][1], cx + 16 + colW + 110, yy);
      }
      yy += rowH;
    }
  }, blockH);
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

function drawSection(
  doc: PDFKit.PDFDocument,
  title: string,
  contentFn: (cx: number, cy: number, cw: number) => void,
  height: number,
) {
  if (doc.y + height > doc.page.height - 80) doc.addPage();
  const x = 54;
  const w = doc.page.width - 108;
  const y = doc.y;
  doc.save();
  doc.rect(x, y, w, height).lineWidth(1).strokeColor(COLORS.border).stroke();
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fill(COLORS.slate)
    .text(title, x + 16, y + 12);
  doc.restore();
  contentFn(x, y, w);
  doc.y = y + height + 12;
}

function formatMiles(km: unknown): string {
  if (km === null || km === undefined) return '—';
  const numeric = typeof km === 'number' ? km : Number(km);
  if (!Number.isFinite(numeric)) return '—';
  return `${Math.round(numeric * 0.621371).toLocaleString()} mi`;
}
