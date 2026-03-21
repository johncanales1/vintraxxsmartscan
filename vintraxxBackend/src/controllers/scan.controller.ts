import { Request, Response, NextFunction } from 'express';
import { ScanSubmissionPayload, FullReportData } from '../types';
import { decodeVin } from '../services/vin.service';
import { fetchBlackBookByVin } from '../services/blackbook.service';
import { analyzeWithAI } from '../services/ai.service';
import { analyzeAdditionalRepairs } from '../services/additional-repairs.service';
import { assembleFullReport } from '../services/report.service';
import { generatePdf } from '../services/pdf.service';
import { sendReportEmail } from '../services/email.service';
import { env } from '../config/env';
import logger from '../utils/logger';
import prisma from '../config/db';
import fs from 'fs';

const REGULAR_USER_MAX_SCANNER_DEVICES = 2;
const REGULAR_USER_MAX_VINS = 5;
const DEFAULT_LABOR_RATE = 199;

export async function submitScan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.body as ScanSubmissionPayload;
    const userId = req.user!.userId;
    const userEmail = req.user!.email;

    // Fetch user to check dealer status
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }

    // Regular user limits: check scanner device and VIN usage
    if (!user.isDealer) {
      // Check scanner device limit
      if (payload.scannerDeviceId) {
        const existingDevice = await prisma.userScannerDevice.findUnique({
          where: { userId_deviceId: { userId, deviceId: payload.scannerDeviceId } },
        });
        if (!existingDevice) {
          const deviceCount = await prisma.userScannerDevice.count({ where: { userId } });
          if (deviceCount >= REGULAR_USER_MAX_SCANNER_DEVICES) {
            logger.warn('Regular user exceeded scanner device limit', { userId, deviceCount });
            res.status(403).json({
              success: false,
              error: `Regular users are limited to ${REGULAR_USER_MAX_SCANNER_DEVICES} scanner devices. Upgrade to Dealer for unlimited access.`,
            });
            return;
          }
          await prisma.userScannerDevice.create({
            data: { userId, deviceId: payload.scannerDeviceId },
          });
        } else {
          await prisma.userScannerDevice.update({
            where: { id: existingDevice.id },
            data: { lastUsedAt: new Date() },
          });
        }
      }

      // Check VIN usage limit
      const existingVin = await prisma.userVinUsage.findUnique({
        where: { userId_vin: { userId, vin: payload.vin } },
      });
      if (!existingVin) {
        const vinCount = await prisma.userVinUsage.count({ where: { userId } });
        if (vinCount >= REGULAR_USER_MAX_VINS) {
          logger.warn('Regular user exceeded VIN limit', { userId, vinCount });
          res.status(403).json({
            success: false,
            error: `Regular users are limited to ${REGULAR_USER_MAX_VINS} different vehicles. Upgrade to Dealer for unlimited access.`,
          });
          return;
        }
        await prisma.userVinUsage.create({
          data: { userId, vin: payload.vin },
        });
      } else {
        await prisma.userVinUsage.update({
          where: { id: existingVin.id },
          data: { lastUsedAt: new Date(), scanCount: { increment: 1 } },
        });
      }
    } else {
      // Dealer: track scanner devices and VINs without limits
      if (payload.scannerDeviceId) {
        await prisma.userScannerDevice.upsert({
          where: { userId_deviceId: { userId, deviceId: payload.scannerDeviceId } },
          create: { userId, deviceId: payload.scannerDeviceId },
          update: { lastUsedAt: new Date() },
        });
      }
      await prisma.userVinUsage.upsert({
        where: { userId_vin: { userId, vin: payload.vin } },
        create: { userId, vin: payload.vin },
        update: { lastUsedAt: new Date(), scanCount: { increment: 1 } },
      });
    }

    // Validate stockNumber if provided (must be exactly 10 digits)
    const stockNumber = payload.stockNumber?.trim();
    if (stockNumber && (stockNumber.length !== 10 || !/^\d{10}$/.test(stockNumber))) {
      logger.warn('Invalid stock number received', { stockNumber, length: stockNumber?.length });
    }
    const validStockNumber = stockNumber && stockNumber.length === 10 && /^\d{10}$/.test(stockNumber)
      ? stockNumber : undefined;

    const scan = await prisma.scan.create({
      data: {
        userId,
        vin: payload.vin,
        mileage: payload.mileage,
        milOn: payload.milStatus.milOn,
        dtcCount: payload.milStatus.dtcCount,
        storedDtcCodes: payload.storedDtcCodes,
        pendingDtcCodes: payload.pendingDtcCodes,
        permanentDtcCodes: payload.permanentDtcCodes,
        distanceSinceCleared: payload.distanceSinceCleared,
        timeSinceCleared: payload.timeSinceCleared,
        warmupsSinceCleared: payload.warmupsSinceCleared,
        distanceWithMilOn: payload.distanceWithMILOn,
        fuelSystemStatus: payload.fuelSystemStatus ?? undefined,
        secondaryAirStatus: payload.secondaryAirStatus,
        milStatusByEcu: payload.milStatus.byEcu ?? undefined,
        stockNumber: validStockNumber ?? null,
        additionalRepairs: payload.additionalRepairs ?? [],
        scannerDeviceId: payload.scannerDeviceId ?? null,
        rawPayload: payload as any,
        scanDate: new Date(payload.scanDate),
        status: 'RECEIVED',
      },
    });

    logger.info('Scan received', {
      scanId: scan.id,
      userId,
      userEmail,
      vin: payload.vin,
      dtcCount: payload.milStatus?.dtcCount,
      stockNumber: validStockNumber || undefined,
      additionalRepairs: payload.additionalRepairs || [],
      isDealer: user.isDealer,
    });

    res.status(202).json({
      success: true,
      scanId: scan.id,
      message: 'Scan received, processing...',
    });

    processScanInBackground(scan.id, userId, userEmail).catch((error) => {
      logger.error(`Background processing failed for scan ${scan.id}`, {
        error: (error as Error).message,
      });
    });
  } catch (error) {
    next(error);
  }
}

async function processScanInBackground(scanId: string, userId: string, userEmail: string): Promise<void> {
  const startedAtMs = Date.now();
  try {
    const scan = await prisma.scan.findUniqueOrThrow({ where: { id: scanId } });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    logger.info('Background scan processing started', {
      scanId,
      userId,
      userEmail,
      vin: scan.vin,
    });

    // Step 1: Decode VIN (NHTSA for engine info, Black Book for accurate year/make/model)
    await prisma.scan.update({ where: { id: scanId }, data: { status: 'DECODING_VIN' } });
    logger.info(`[${scanId}] Decoding VIN: ${scan.vin}`);

    const vinData = await decodeVin(scan.vin);

    // Try Black Book for more accurate vehicle info
    let bbYear = vinData.year;
    let bbMake = vinData.make;
    let bbModel = vinData.model;
    try {
      const bbResult = await fetchBlackBookByVin(scan.vin, scan.mileage ?? 0);
      if (bbResult.success && bbResult.vehicle) {
        if (bbResult.vehicle.year) bbYear = bbResult.vehicle.year;
        if (bbResult.vehicle.make) bbMake = bbResult.vehicle.make;
        if (bbResult.vehicle.model) bbModel = bbResult.vehicle.model;
        logger.info(`[${scanId}] Black Book vehicle info: ${bbYear} ${bbMake} ${bbModel}`);
      }
    } catch (bbErr) {
      logger.warn(`[${scanId}] Black Book lookup failed, using NHTSA data`, {
        error: (bbErr as Error).message,
      });
    }

    await prisma.scan.update({
      where: { id: scanId },
      data: {
        vehicleYear: bbYear,
        vehicleMake: bbMake,
        vehicleModel: bbModel,
        vehicleEngine: vinData.engine,
      },
    });

    // Step 2: AI Analysis
    await prisma.scan.update({ where: { id: scanId }, data: { status: 'ANALYZING' } });
    logger.info(`[${scanId}] Running AI analysis`);

    const aiOutput = await analyzeWithAI({
      vin: scan.vin,
      year: bbYear,
      make: bbMake,
      model: bbModel,
      mileage: scan.mileage,
      milOn: scan.milOn,
      dtcCount: scan.dtcCount,
      distanceSinceCleared: scan.distanceSinceCleared,
      warmupsSinceCleared: scan.warmupsSinceCleared,
      storedDtcCodes: scan.storedDtcCodes,
      pendingDtcCodes: scan.pendingDtcCodes,
      permanentDtcCodes: scan.permanentDtcCodes,
    });

    // Step 2b: Analyze additional repairs if any were selected
    const pricePerLaborHour = user.isDealer && user.pricePerLaborHour
      ? user.pricePerLaborHour
      : DEFAULT_LABOR_RATE;

    let additionalRepairItems: import('../types').AdditionalRepairItem[] = [];
    let additionalRepairsTotalCost = 0;

    if (scan.additionalRepairs && scan.additionalRepairs.length > 0) {
      logger.info(`[${scanId}] Analyzing ${scan.additionalRepairs.length} additional repairs`);
      try {
        additionalRepairItems = await analyzeAdditionalRepairs({
          selectedRepairs: scan.additionalRepairs,
          year: bbYear,
          make: bbMake,
          model: bbModel,
          pricePerLaborHour,
        });
        additionalRepairsTotalCost = additionalRepairItems.reduce((sum, r) => sum + r.totalCost, 0);
        logger.info(`[${scanId}] Additional repairs analyzed`, {
          count: additionalRepairItems.length,
          totalCost: additionalRepairsTotalCost,
          pricePerLaborHour,
        });
      } catch (addRepairErr) {
        logger.error(`[${scanId}] Additional repairs analysis failed, continuing`, {
          error: (addRepairErr as Error).message,
        });
      }
    }

    // Create FullReport record
    const totalCost = aiOutput.dtcAnalysis.reduce(
      (sum, dtc) => sum + dtc.repair.partsCost + dtc.repair.laborCost,
      0
    );

    const repairRecs = aiOutput.dtcAnalysis.map((dtc) => ({
      title: dtc.repair.description.substring(0, 80),
      description: dtc.repair.description,
      priority: dtc.severity === 'critical' ? 'high' : dtc.severity === 'moderate' ? 'medium' : 'low',
      estimatedCost: {
        labor: dtc.repair.laborCost,
        parts: dtc.repair.partsCost,
        total: dtc.repair.laborCost + dtc.repair.partsCost,
      },
    }));

    const fullReport = await prisma.fullReport.create({
      data: {
        scanId,
        aiRawResponse: aiOutput as any,
        dtcAnalysis: aiOutput.dtcAnalysis as any,
        emissionsCheck: aiOutput.emissionsCheck as any,
        mileageRiskAssessment: aiOutput.mileageRiskAssessment as any,
        repairRecommendations: repairRecs as any,
        modulesScanned: aiOutput.modulesScanned,
        datapointsScanned: aiOutput.datapointsScanned,
        totalReconditioningCost: totalCost,
        additionalRepairsCost: additionalRepairsTotalCost,
        additionalRepairsData: additionalRepairItems.length > 0 ? (additionalRepairItems as any) : undefined,
        reportVersion: env.REPORT_VERSION,
      },
    });

    // Step 3: Assemble report data
    const reportData = assembleFullReport({
      scanId,
      reportId: fullReport.id,
      vin: scan.vin,
      year: vinData.year,
      make: vinData.make,
      model: vinData.model,
      mileage: scan.mileage,
      milOn: scan.milOn,
      distanceSinceCleared: scan.distanceSinceCleared,
      userEmail,
      aiOutput,
      stockNumber: scan.stockNumber ?? undefined,
      additionalRepairs: additionalRepairItems,
      additionalRepairsTotalCost,
    });

    // Step 4: Generate PDF
    await prisma.scan.update({ where: { id: scanId }, data: { status: 'GENERATING_PDF' } });
    logger.info(`[${scanId}] Generating PDF`);

    let pdfPath: string | null = null;
    try {
      pdfPath = await generatePdf(reportData);
      if (pdfPath && !fs.existsSync(pdfPath)) {
        logger.error(`[${scanId}] PDF path returned but file does not exist`, { pdfPath });
        pdfPath = null;
      }
      await prisma.fullReport.update({
        where: { id: fullReport.id },
        data: { pdfUrl: pdfPath, pdfGeneratedAt: new Date() },
      });
    } catch (pdfError) {
      logger.error(`[${scanId}] PDF generation failed, continuing`, {
        error: (pdfError as Error).message,
      });
    }

    // Step 5: Send email
    await prisma.scan.update({ where: { id: scanId }, data: { status: 'EMAILING' } });
    logger.info(`[${scanId}] Sending email to ${userEmail}`);

    try {
      await sendReportEmail(userEmail, reportData, pdfPath);
      await prisma.fullReport.update({
        where: { id: fullReport.id },
        data: { emailSentAt: new Date() },
      });
    } catch (emailError) {
      logger.error(`[${scanId}] Email sending failed, continuing`, {
        error: (emailError as Error).message,
      });
    }

    // Step 6: Mark completed
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'COMPLETED', processedAt: new Date() },
    });

    logger.info('Background scan processing completed', {
      scanId,
      durationMs: Date.now() - startedAtMs,
      isDealer: user.isDealer,
      additionalRepairsCount: additionalRepairItems.length,
      additionalRepairsTotalCost,
      pricePerLaborHour,
      totalDtcCost: totalCost,
      grandTotal: totalCost + additionalRepairsTotalCost,
    });
  } catch (error) {
    logger.error(`[${scanId}] Processing failed`, { error: (error as Error).message });
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'FAILED',
        errorMessage: (error as Error).message,
      },
    });
  }
}

export async function getReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { scanId } = req.params as { scanId: string };
    const userId = req.user!.userId;

    const scan = await prisma.scan.findFirst({
      where: { 
        id: scanId as string,
        userId: userId as string
      },
      include: { 
        fullReport: true, 
        user: true 
      },
    }) as any;

    if (!scan) {
      res.status(404).json({ success: false, error: 'Scan not found' });
      return;
    }

    if (scan.status === 'FAILED') {
      res.json({ success: true, status: 'failed', error: scan.errorMessage });
      return;
    }

    if (scan.status !== 'COMPLETED' || !scan.fullReport) {
      res.json({ success: true, status: 'processing' });
      return;
    }

    const fr = scan.fullReport;
    const aiOutput = fr.aiRawResponse as any;

    const additionalRepairsData = fr.additionalRepairsData as any[] | null;
    const reportData = assembleFullReport({
      scanId: scan.id,
      reportId: fr.id,
      vin: scan.vin,
      year: scan.vehicleYear,
      make: scan.vehicleMake,
      model: scan.vehicleModel,
      mileage: scan.mileage,
      milOn: scan.milOn,
      distanceSinceCleared: scan.distanceSinceCleared,
      userEmail: scan.user.email,
      aiOutput,
      stockNumber: scan.stockNumber ?? undefined,
      additionalRepairs: additionalRepairsData ?? undefined,
      additionalRepairsTotalCost: fr.additionalRepairsCost ?? 0,
    });

    res.json({ success: true, status: 'completed', data: reportData });
  } catch (error) {
    next(error);
  }
}

export async function getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const scans = await prisma.scan.findMany({
      where: { userId: userId },
      orderBy: { receivedAt: 'desc' },
      select: {
        id: true,
        vin: true,
        vehicleYear: true,
        vehicleMake: true,
        vehicleModel: true,
        status: true,
        scanDate: true,
      },
    });

    const result = scans.map((s) => ({
      scanId: s.id,
      vin: s.vin,
      vehicleYear: s.vehicleYear,
      vehicleMake: s.vehicleMake,
      vehicleModel: s.vehicleModel,
      status: s.status,
      scanDate: s.scanDate.toISOString(),
    }));

    res.json({ success: true, scans: result });
  } catch (error) {
    next(error);
  }
}
