import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';
import { FullReportData } from '../types';
import { APP_CONSTANTS } from '../config/constants';
import logger from '../utils/logger';

let templateCache: HandlebarsTemplateDelegate | null = null;

function getTemplate(): HandlebarsTemplateDelegate {
  if (templateCache) return templateCache;

  const templatePath = path.join(__dirname, '..', 'templates', 'report.html');
  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  templateCache = Handlebars.compile(templateSource);
  return templateCache;
}

Handlebars.registerHelper('eq', function (a: unknown, b: unknown) {
  return a === b;
});

Handlebars.registerHelper('formatCurrency', function (amount: number) {
  return `$${Math.round(amount).toLocaleString('en-US')}`;
});

Handlebars.registerHelper('formatNumber', function (num: number) {
  if (num === null || num === undefined) return 'N/A';
  return Math.round(num).toLocaleString('en-US');
});

Handlebars.registerHelper('formatMileage', function (num: number) {
  if (num === null || num === undefined) return 'N/A';
  return `~ ${Math.round(num).toLocaleString('en-US')} mi`;
});

Handlebars.registerHelper('costRange', function (low: number, high: number) {
  return `$${Math.round(low).toLocaleString('en-US')} - $${Math.round(high).toLocaleString('en-US')}`;
});

Handlebars.registerHelper('isCritical', function (severity: string) {
  return severity === 'critical';
});

export async function generatePdf(report: FullReportData): Promise<string> {
  const reportsDir = path.resolve(APP_CONSTANTS.PDF_DIR);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const filename = `report-${report.scanId}-${Date.now()}.pdf`;
  const filePath = path.join(reportsDir, filename);

  const template = getTemplate();
  const html = template({
    ...report,
    generatedDate: new Date(report.reportMetadata.generatedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }),
    vehicleDisplay: `${report.vehicle.year} ${report.vehicle.make} ${report.vehicle.model}`,
    mileageDisplay: report.vehicle.mileage
      ? `${Math.round(report.vehicle.mileage).toLocaleString('en-US')} miles`
      : 'N/A',
    distanceDisplay: report.codesLastReset.distanceMiles
      ? `${Math.round(report.codesLastReset.distanceMiles).toLocaleString('en-US')} miles ago`
      : 'N/A',
    modulesDisplay: report.modulesScanned.join(', '),
  });

  let browser;
  try {
    logger.info('Launching Puppeteer for PDF generation');
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: filePath,
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.5in',
        bottom: '0.5in',
        left: '0.75in',
        right: '0.75in',
      },
    });

    logger.info(`PDF generated: ${filePath}`);
    return filePath;
  } catch (error) {
    logger.error('PDF generation failed', { error: (error as Error).message });
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
