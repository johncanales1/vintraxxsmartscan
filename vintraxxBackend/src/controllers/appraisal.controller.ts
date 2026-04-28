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
import { EmailServiceUnavailableError } from '../utils/errors';

// In-memory store for appraisals (would be DB in production)
const appraisalStore = new Map<string, AppraisalSummaryData>();

// ================================================================
// POST /api/v1/appraisal/valuate
// Get AI-based vehicle market valuation
// ================================================================
export async function valuateVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as AppraisalValuationRequest & { vehicleOwnerName?: string };
    const userEmail = req.user!.email;
    const userId = req.user!.userId;

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
          vehicleOwnerName: input.vehicleOwnerName ?? null,
        },
      });
    } catch (dbErr) {
      logger.warn('Failed to persist appraisal to DB', { appraisalId, error: (dbErr as Error).message });
    }

    // Fire-and-forget: generate a baseline PDF for every new appraisal so the
    // frontend and admin dashboard always have a "View PDF" link — matches
    // how OBD scan reports work. The /email and /pdf endpoints will reuse
    // this file instead of re-rendering. Photos are added later when the
    // user emails a photo-enriched PDF via /pdf.
    setImmediate(() => {
      generateAppraisalPdf(appraisalData)
        .then(async (pdfPath) => {
          try {
            await prisma.appraisal.update({
              where: { id: appraisalId },
              data: { pdfUrl: pdfPath },
            });
            logger.info('Baseline appraisal PDF generated', { appraisalId, pdfPath });
          } catch (updateErr) {
            logger.warn('Failed to store baseline appraisal pdfUrl', {
              appraisalId,
              error: (updateErr as Error).message,
            });
          }
        })
        .catch((pdfErr) => {
          logger.warn('Baseline appraisal PDF generation failed (non-fatal)', {
            appraisalId,
            error: (pdfErr as Error).message,
          });
        });
    });

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

    // Reuse the baseline PDF that /valuate generated in the background so the
    // "Email Appraisal" flow always attaches a PDF. If /valuate's background
    // job hasn't finished yet (race on very fast re-send) we generate one now
    // so we never send a PDF-less email for a row that should have one.
    let pdfPath: string | null = null;
    try {
      const existing = await prisma.appraisal.findUnique({
        where: { id: appraisalData.appraisalId },
        select: { pdfUrl: true },
      });
      if (existing?.pdfUrl && fs.existsSync(existing.pdfUrl)) {
        pdfPath = existing.pdfUrl;
      } else {
        pdfPath = await generateAppraisalPdf(appraisalData);
        await prisma.appraisal.update({
          where: { id: appraisalData.appraisalId },
          data: { pdfUrl: pdfPath },
        }).catch((dbErr) => {
          logger.warn('emailAppraisal: could not persist late-generated pdfUrl', {
            appraisalId: appraisalData.appraisalId,
            error: (dbErr as Error).message,
          });
        });
      }
    } catch (pdfErr) {
      // Non-fatal: we still send the email (HTML-only) if PDF generation fails.
      logger.warn('emailAppraisal: PDF generation failed, falling back to HTML-only email', {
        appraisalId: appraisalData.appraisalId,
        error: (pdfErr as Error).message,
      });
      pdfPath = null;
    }

    await sendAppraisalEmail(toEmail, appraisalData, pdfPath);

    logger.info('Appraisal email sent successfully', {
      appraisalId: appraisalData.appraisalId,
      toEmail,
      hasPdf: Boolean(pdfPath),
    });

    res.json({
      success: true,
      message: 'Appraisal email sent successfully',
    });
  } catch (error) {
    const msg = (error as Error).message;
    logger.error('Appraisal email failed', {
      error: msg,
      toEmail: req.body?.toEmail,
      classified: error instanceof EmailServiceUnavailableError ? 'EMAIL_UNAVAILABLE' : 'UNKNOWN',
    });
    if (error instanceof EmailServiceUnavailableError) {
      res.status(503).json({
        success: false,
        code: error.code,
        message: error.message,
      });
      return;
    }
    res.status(500).json({
      success: false,
      code: 'APPRAISAL_EMAIL_FAILED',
      message: 'Could not send the appraisal email. Please try again shortly.',
    });
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

    // If the user didn't add photos and /valuate already produced a baseline
    // PDF we reuse that file to avoid writing duplicates. When photos ARE
    // attached the PDF is content-different, so we regenerate.
    const hasPhotos = Array.isArray(appraisalData.photos) && appraisalData.photos.length > 0;
    let pdfPath: string;
    if (!hasPhotos) {
      const existing = await prisma.appraisal.findUnique({
        where: { id: appraisalData.appraisalId },
        select: { pdfUrl: true },
      }).catch(() => null);
      if (existing?.pdfUrl && fs.existsSync(existing.pdfUrl)) {
        pdfPath = existing.pdfUrl;
        logger.info('Reusing baseline appraisal PDF (no photos attached)', {
          appraisalId: appraisalData.appraisalId,
          pdfPath,
        });
      } else {
        pdfPath = await generateAppraisalPdf(appraisalData);
      }
    } else {
      pdfPath = await generateAppraisalPdf(appraisalData);
    }

    logger.info('Appraisal PDF ready', {
      appraisalId: appraisalData.appraisalId,
      pdfPath,
      hasPhotos,
      photoCount: appraisalData.photos?.length || 0,
    });

    // Update DB record with pdfUrl (and photoCount when photos are present)
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

    // Keep PDF file on disk so dealers can view it later via PDF View link

    logger.info('Appraisal PDF email sent successfully', {
      appraisalId: appraisalData.appraisalId,
      toEmail,
    });

    res.json({
      success: true,
      message: 'Appraisal PDF sent to your email',
    });
  } catch (error) {
    const msg = (error as Error).message;
    logger.error('Appraisal PDF failed', {
      error: msg,
      toEmail: req.body?.toEmail,
      classified: error instanceof EmailServiceUnavailableError ? 'EMAIL_UNAVAILABLE' : 'UNKNOWN',
    });
    if (error instanceof EmailServiceUnavailableError) {
      res.status(503).json({
        success: false,
        code: error.code,
        message: error.message,
      });
      return;
    }
    res.status(500).json({
      success: false,
      code: 'APPRAISAL_PDF_FAILED',
      message: 'Could not generate or send the appraisal PDF. Please try again shortly.',
    });
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

    const a = await prisma.appraisal.findFirst({
      where: { id: appraisalId, userId: req.user!.userId },
    });

    if (!a) {
      logger.warn('Dashboard appraisal not found', { appraisalId });
      res.status(404).json({
        success: false,
        error: 'Appraisal not found',
      });
      return;
    }

    const v = (a.valuationData ?? {}) as any;
    const wholesale = Math.round(((v.estimatedWholesaleLow ?? 0) + (v.estimatedWholesaleHigh ?? 0)) / 2);
    const retail = Math.round(((v.estimatedRetailLow ?? 0) + (v.estimatedRetailHigh ?? 0)) / 2);
    const tradeIn = Math.round(((v.estimatedTradeInLow ?? 0) + (v.estimatedTradeInHigh ?? 0)) / 2);

    const appraisalData = {
      appraisalId: a.id,
      vin: a.vin,
      vehicle: {
        year: a.vehicleYear ?? 0,
        make: a.vehicleMake ?? '',
        model: a.vehicleModel ?? '',
        trim: a.vehicleTrim ?? undefined,
        mileage: a.mileage ?? 0,
      },
      valuation: { wholesale, retail, tradeIn },
      createdAt: a.createdAt.toISOString(),
      userEmail: a.userEmail ?? req.user!.email,
    };

    logger.info('Dashboard appraisal data returned', {
      appraisalId,
      vin: a.vin,
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
    const userId = req.user!.userId;
    const userEmail = req.user!.email;

    logger.info('Dashboard appraisal list requested', { userId, userEmail });

    const rows = await prisma.appraisal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const data = rows.map((a) => {
      const v = (a.valuationData ?? {}) as any;
      const wholesale = Math.round(((v.estimatedWholesaleLow ?? 0) + (v.estimatedWholesaleHigh ?? 0)) / 2);
      const retail = Math.round(((v.estimatedRetailLow ?? 0) + (v.estimatedRetailHigh ?? 0)) / 2);
      const tradeIn = Math.round(((v.estimatedTradeInLow ?? 0) + (v.estimatedTradeInHigh ?? 0)) / 2);
      return {
        appraisalId: a.id,
        vin: a.vin,
        vehicle: {
          year: a.vehicleYear ?? 0,
          make: a.vehicleMake ?? '',
          model: a.vehicleModel ?? '',
          trim: a.vehicleTrim ?? undefined,
          mileage: a.mileage ?? 0,
        },
        valuation: { wholesale, retail, tradeIn },
        createdAt: a.createdAt.toISOString(),
        userEmail: a.userEmail ?? userEmail,
        userFullName: a.userFullName ?? undefined,
        vehicleOwnerName: a.vehicleOwnerName ?? undefined,
      };
    });

    logger.info('Dashboard appraisal list returned', { userId, count: data.length });

    res.json({ success: true, data });
  } catch (error) {
    logger.error('Dashboard appraisal list failed', { error: (error as Error).message });
    next(error);
  }
}
