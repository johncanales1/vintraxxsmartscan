import { Request, Response, NextFunction } from 'express';
import { ScanSubmissionPayload, FullReportData } from '../types';
import { decodeVin } from '../services/vin.service';
import { analyzeWithAI } from '../services/ai.service';
import { assembleFullReport } from '../services/report.service';
import { generatePdf } from '../services/pdf.service';
import { sendReportEmail } from '../services/email.service';
import { env } from '../config/env';
import logger from '../utils/logger';
import prisma from '../config/db';

export async function submitScan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = req.body as ScanSubmissionPayload;
    const userId = req.user!.userId;
    const userEmail = req.user!.email;

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
        rawPayload: payload as any,
        scanDate: new Date(payload.scanDate),
        status: 'RECEIVED',
      },
    });

    logger.info(`Scan received: ${scan.id} for VIN ${payload.vin}`);

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
  try {
    const scan = await prisma.scan.findUniqueOrThrow({ where: { id: scanId } });

    // Step 1: Decode VIN
    await prisma.scan.update({ where: { id: scanId }, data: { status: 'DECODING_VIN' } });
    logger.info(`[${scanId}] Decoding VIN: ${scan.vin}`);

    const vinData = await decodeVin(scan.vin);
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        vehicleYear: vinData.year,
        vehicleMake: vinData.make,
        vehicleModel: vinData.model,
        vehicleEngine: vinData.engine,
      },
    });

    // Step 2: AI Analysis
    await prisma.scan.update({ where: { id: scanId }, data: { status: 'ANALYZING' } });
    logger.info(`[${scanId}] Running AI analysis`);

    const aiOutput = await analyzeWithAI({
      vin: scan.vin,
      year: vinData.year,
      make: vinData.make,
      model: vinData.model,
      mileage: scan.mileage,
      milOn: scan.milOn,
      dtcCount: scan.dtcCount,
      distanceSinceCleared: scan.distanceSinceCleared,
      warmupsSinceCleared: scan.warmupsSinceCleared,
      storedDtcCodes: scan.storedDtcCodes,
      pendingDtcCodes: scan.pendingDtcCodes,
      permanentDtcCodes: scan.permanentDtcCodes,
    });

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
    });

    // Step 4: Generate PDF
    await prisma.scan.update({ where: { id: scanId }, data: { status: 'GENERATING_PDF' } });
    logger.info(`[${scanId}] Generating PDF`);

    let pdfPath: string | null = null;
    try {
      pdfPath = await generatePdf(reportData);
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
      if (pdfPath) {
        await sendReportEmail(userEmail, reportData, pdfPath);
        await prisma.fullReport.update({
          where: { id: fullReport.id },
          data: { emailSentAt: new Date() },
        });
      } else {
        logger.warn(`[${scanId}] Skipping email - no PDF available`);
      }
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

    logger.info(`[${scanId}] Processing completed successfully`);
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
