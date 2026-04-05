import { Request, Response, NextFunction } from 'express';
import { AppraisalValuationRequest, AppraisalSummaryData, AiValuationOutput } from '../types';
import { getAiValuation } from '../services/appraisal.service';
import { fetchBlackBookByVin, mapBlackBookToValuation } from '../services/blackbook.service';
import { generateAppraisalPdf } from '../services/appraisal-pdf.service';
import { sendAppraisalEmail } from '../services/appraisal-email.service';
import { processPhotosForEmbedding } from '../utils/imageCompressor';
import { env } from '../config/env';
import logger from '../utils/logger';
import prisma from '../config/db';
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

    // ---- 1. Fetch Black Book data (primary pricing source) ----
    const bbResult = await fetchBlackBookByVin(input.vin, input.mileage);

    let valuation: AiValuationOutput;
    let vehicleYear = input.year;
    let vehicleMake = input.make;
    let vehicleModel = input.model;
    let vehicleTrim = input.trim;

    if (bbResult.success && bbResult.pricing && bbResult.vehicle) {
      // Use Black Book vehicle info (more accurate than local decode)
      const bbVehicle = bbResult.vehicle;
      if (bbVehicle.year) vehicleYear = bbVehicle.year;
      if (bbVehicle.make) vehicleMake = bbVehicle.make;
      if (bbVehicle.model) vehicleModel = bbVehicle.model;
      if (bbVehicle.series) vehicleTrim = bbVehicle.series;

      // Map BB pricing to our valuation structure
      const bbPrices = mapBlackBookToValuation(bbResult.pricing, input.condition);

      logger.info('Black Book pricing mapped', {
        vin: input.vin,
        condition: input.condition,
        bbPrices,
      });

      // Build Black Book comparable source
      const bbSource = {
        sourceName: 'Black Book',
        wholesaleLow: bbPrices.wholesaleLow,
        wholesaleHigh: bbPrices.wholesaleHigh,
        tradeInLow: bbPrices.tradeInLow,
        tradeInHigh: bbPrices.tradeInHigh,
        retailLow: bbPrices.retailLow,
        retailHigh: bbPrices.retailHigh,
        privatePartyLow: bbPrices.privatePartyLow,
        privatePartyHigh: bbPrices.privatePartyHigh,
      };

      // ---- 2. Call AI for supplementary analysis (trend, adjustments, summary) ----
      let aiValuation: AiValuationOutput | null = null;
      try {
        aiValuation = await getAiValuation({
          ...input,
          year: vehicleYear,
          make: vehicleMake,
          model: vehicleModel,
          trim: vehicleTrim,
        });
      } catch (aiError) {
        logger.warn('AI valuation failed, using Black Book data only', {
          error: (aiError as Error).message,
        });
      }

      // Build AI-derived sources (if available)
      const aiSources = aiValuation?.comparableSources?.filter(
        s => s.sourceName !== 'Black Book'
      ) || [];

      // Combine: BB source first, then AI sources
      const comparableSources = [bbSource, ...aiSources.slice(0, 2)];

      // Use BB for primary prices, AI for analysis context
      const now = new Date();
      const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      valuation = {
        estimatedWholesaleLow: bbPrices.wholesaleLow,
        estimatedWholesaleHigh: bbPrices.wholesaleHigh,
        estimatedTradeInLow: bbPrices.tradeInLow,
        estimatedTradeInHigh: bbPrices.tradeInHigh,
        estimatedRetailLow: bbPrices.retailLow,
        estimatedRetailHigh: bbPrices.retailHigh,
        estimatedPrivatePartyLow: bbPrices.privatePartyLow,
        estimatedPrivatePartyHigh: bbPrices.privatePartyHigh,
        confidenceLevel: 'high',
        confidenceExplanation: aiValuation?.confidenceExplanation || 'Pricing sourced from Black Book with mileage and condition adjustments.',
        marketTrend: aiValuation?.marketTrend || 'stable',
        marketTrendExplanation: aiValuation?.marketTrendExplanation || 'Market trend based on current wholesale market conditions.',
        comparableSources,
        adjustments: aiValuation?.adjustments || [
          { factor: 'Mileage', impact: 0, explanation: 'Mileage adjustment applied by Black Book.' },
          { factor: 'Condition', impact: 0, explanation: `Vehicle condition rated as ${input.condition}.` },
        ],
        aiSummary: aiValuation?.aiSummary || `Black Book valuation for ${vehicleYear} ${vehicleMake} ${vehicleModel} with ${input.mileage.toLocaleString()} miles in ${input.condition} condition. Trade-in range: $${bbPrices.tradeInLow.toLocaleString()}-$${bbPrices.tradeInHigh.toLocaleString()}, Retail range: $${bbPrices.retailLow.toLocaleString()}-$${bbPrices.retailHigh.toLocaleString()}.`,
        dataAsOf: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
      };
    } else {
      // Black Book failed — fallback to AI-only valuation
      logger.warn('Black Book unavailable, falling back to AI valuation', {
        vin: input.vin,
        bbError: bbResult.error,
      });
      valuation = await getAiValuation(input);
    }

    // Generate an appraisal ID
    const appraisalId = `appr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Build appraisal summary and store it
    const appraisalData: AppraisalSummaryData = {
      appraisalId,
      vehicle: {
        vin: input.vin,
        year: vehicleYear,
        make: vehicleMake,
        model: vehicleModel,
        trim: vehicleTrim,
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

    // Persist to database
    try {
      await prisma.appraisal.create({
        data: {
          id: appraisalId,
          userId: req.user!.userId,
          vin: input.vin,
          vehicleYear: vehicleYear,
          vehicleMake: vehicleMake,
          vehicleModel: vehicleModel,
          vehicleTrim: vehicleTrim,
          mileage: input.mileage,
          condition: input.condition,
          zipCode: input.zipCode,
          notes: input.notes,
          valuationData: valuation as any,
          photoCount: 0,
          userEmail,
        },
      });
    } catch (dbErr) {
      logger.warn('Failed to persist appraisal to DB', { appraisalId, error: (dbErr as Error).message });
    }

    logger.info('Appraisal valuation completed and stored', {
      appraisalId,
      vin: input.vin,
      source: bbResult.success ? 'BlackBook+AI' : 'AI-only',
      wholesaleRange: `$${valuation.estimatedWholesaleLow} - $${valuation.estimatedWholesaleHigh}`,
      tradeInRange: `$${valuation.estimatedTradeInLow} - $${valuation.estimatedTradeInHigh}`,
      retailRange: `$${valuation.estimatedRetailLow} - $${valuation.estimatedRetailHigh}`,
      confidence: valuation.confidenceLevel,
    });

    res.json({
      success: true,
      appraisalId,
      valuation,
      // Include BB vehicle info so frontend can update display
      vehicle: {
        year: vehicleYear,
        make: vehicleMake,
        model: vehicleModel,
        trim: vehicleTrim,
      },
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

    // Process photos for embedding (compress/validate)
    appraisalData.photos = processPhotosForEmbedding(appraisalData.photos);

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

    // Process photos for embedding (compress/validate)
    appraisalData.photos = processPhotosForEmbedding(appraisalData.photos);

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

    // Update DB record with pdfUrl
    try {
      await prisma.appraisal.update({
        where: { id: appraisalData.appraisalId },
        data: { pdfUrl: pdfPath, photoCount: appraisalData.photos?.length || 0 },
      });
    } catch (dbErr) {
      logger.warn('Failed to update appraisal pdfUrl in DB', { error: (dbErr as Error).message });
    }

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
