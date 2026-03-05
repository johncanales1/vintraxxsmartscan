import { Request, Response, NextFunction } from 'express';
import { AppraisalValuationRequest, AppraisalSummaryData } from '../types';
import { getAiValuation } from '../services/appraisal.service';
import { generateAppraisalPdf } from '../services/appraisal-pdf.service';
import { sendAppraisalEmail } from '../services/appraisal-email.service';
import { env } from '../config/env';
import logger from '../utils/logger';
import fs from 'fs';

// In-memory store for appraisals (would be DB in production)
const appraisalStore = new Map<string, AppraisalSummaryData>();

// ================================================================
// POST /api/v1/appraisal/valuate
// Get AI-based vehicle market valuation
// ================================================================
export async function valuateVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as AppraisalValuationRequest;
    const userEmail = req.user!.email;

    logger.info('Appraisal valuation requested', {
      userId: req.user!.userId,
      userEmail,
      vin: input.vin,
      year: input.year,
      make: input.make,
      model: input.model,
      mileage: input.mileage,
      condition: input.condition,
      zipCode: input.zipCode,
    });

    const valuation = await getAiValuation(input);

    // Generate an appraisal ID
    const appraisalId = `appr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Build appraisal summary and store it
    const appraisalData: AppraisalSummaryData = {
      appraisalId,
      vehicle: {
        vin: input.vin,
        year: input.year,
        make: input.make,
        model: input.model,
        trim: input.trim,
        mileage: input.mileage,
      },
      condition: input.condition,
      zipCode: input.zipCode,
      notes: input.notes,
      valuation,
      photoCount: 0,
      createdAt: new Date().toISOString(),
      userEmail,
    };

    appraisalStore.set(appraisalId, appraisalData);

    logger.info('Appraisal valuation completed and stored', {
      appraisalId,
      vin: input.vin,
      tradeInRange: `$${valuation.estimatedTradeInLow} - $${valuation.estimatedTradeInHigh}`,
      confidence: valuation.confidenceLevel,
    });

    res.json({
      success: true,
      appraisalId,
      valuation,
    });
  } catch (error) {
    logger.error('Appraisal valuation failed', {
      error: (error as Error).message,
      stack: (error as Error).stack,
      vin: req.body?.vin,
    });
    next(error);
  }
}

// ================================================================
// POST /api/v1/appraisal/email
// Send appraisal summary via email
// ================================================================
export async function emailAppraisal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { toEmail, appraisalData } = req.body as {
      toEmail: string;
      appraisalData: AppraisalSummaryData;
    };

    logger.info('Appraisal email requested', {
      userId: req.user!.userId,
      appraisalId: appraisalData.appraisalId,
      toEmail,
      vin: appraisalData.vehicle.vin,
    });

    // Store appraisal data if not already stored
    if (!appraisalStore.has(appraisalData.appraisalId)) {
      appraisalStore.set(appraisalData.appraisalId, appraisalData);
    }

    await sendAppraisalEmail(toEmail, appraisalData);

    logger.info('Appraisal email sent successfully', {
      appraisalId: appraisalData.appraisalId,
      toEmail,
    });

    res.json({
      success: true,
      message: 'Appraisal email sent successfully',
    });
  } catch (error) {
    logger.error('Appraisal email failed', {
      error: (error as Error).message,
      toEmail: req.body?.toEmail,
    });
    next(error);
  }
}

// ================================================================
// POST /api/v1/appraisal/pdf
// Generate PDF and send via email
// ================================================================
export async function pdfAppraisal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { toEmail, appraisalData } = req.body as {
      toEmail: string;
      appraisalData: AppraisalSummaryData;
    };

    logger.info('Appraisal PDF requested', {
      userId: req.user!.userId,
      appraisalId: appraisalData.appraisalId,
      toEmail,
      vin: appraisalData.vehicle.vin,
    });

    // Store appraisal data if not already stored
    if (!appraisalStore.has(appraisalData.appraisalId)) {
      appraisalStore.set(appraisalData.appraisalId, appraisalData);
    }

    // Generate PDF
    const pdfPath = await generateAppraisalPdf(appraisalData);

    logger.info('Appraisal PDF generated', {
      appraisalId: appraisalData.appraisalId,
      pdfPath,
    });

    // Send email with PDF attachment
    await sendAppraisalEmail(toEmail, appraisalData, pdfPath);

    // Clean up PDF file after sending
    try {
      if (pdfPath && fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
        logger.debug('Appraisal PDF file cleaned up', { pdfPath });
      }
    } catch (cleanupErr) {
      logger.warn('Failed to cleanup appraisal PDF file', { pdfPath, error: (cleanupErr as Error).message });
    }

    logger.info('Appraisal PDF email sent successfully', {
      appraisalId: appraisalData.appraisalId,
      toEmail,
    });

    res.json({
      success: true,
      message: 'Appraisal PDF sent to your email',
    });
  } catch (error) {
    logger.error('Appraisal PDF failed', {
      error: (error as Error).message,
      toEmail: req.body?.toEmail,
    });
    next(error);
  }
}

// ================================================================
// GET /api/v1/appraisal/dashboard/:appraisalId
// Get appraisal summary data for dashboard display
// ================================================================
export async function getDashboardAppraisal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const appraisalId = req.params.appraisalId as string;

    logger.info('Dashboard appraisal data requested', {
      userId: req.user!.userId,
      appraisalId,
    });

    const appraisalData = appraisalStore.get(appraisalId);

    if (!appraisalData) {
      logger.warn('Dashboard appraisal not found', { appraisalId });
      res.status(404).json({
        success: false,
        error: 'Appraisal not found',
      });
      return;
    }

    // Verify the appraisal belongs to the requesting user
    if (appraisalData.userEmail !== req.user!.email) {
      logger.warn('Dashboard appraisal access denied - email mismatch', {
        appraisalId,
        requestingEmail: req.user!.email,
        appraisalEmail: appraisalData.userEmail,
      });
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    logger.info('Dashboard appraisal data returned', {
      appraisalId,
      vin: appraisalData.vehicle.vin,
    });

    res.json({
      success: true,
      data: appraisalData,
    });
  } catch (error) {
    logger.error('Dashboard appraisal fetch failed', {
      error: (error as Error).message,
      appraisalId: req.params?.appraisalId,
    });
    next(error);
  }
}

// ================================================================
// GET /api/v1/appraisal/dashboard
// Get all appraisals for dashboard (list)
// ================================================================
export async function listDashboardAppraisals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userEmail = req.user!.email;

    logger.info('Dashboard appraisal list requested', {
      userId: req.user!.userId,
      userEmail,
    });

    const userAppraisals: AppraisalSummaryData[] = [];
    appraisalStore.forEach((data) => {
      if (data.userEmail === userEmail) {
        userAppraisals.push(data);
      }
    });

    // Sort by createdAt descending
    userAppraisals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    logger.info('Dashboard appraisal list returned', {
      userEmail,
      count: userAppraisals.length,
    });

    res.json({
      success: true,
      data: userAppraisals,
    });
  } catch (error) {
    logger.error('Dashboard appraisal list failed', {
      error: (error as Error).message,
    });
    next(error);
  }
}
