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
import { randomUUID } from 'crypto';
import { EmailServiceUnavailableError } from '../utils/errors';

// HIGH #15: in-memory `appraisalStore` removed — it was dead code that
// confused ops on multi-process deploys (each PM2 worker had its own copy)
// and never got cleared. The DB row is the only source of truth; the
// CRITICAL #10 server-overwrite path reads it directly.

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

    // MEDIUM #31: appraisal IDs were `appr-<ms>-<6 base36 chars>` from
    // Math.random — only ~36^6 random bits and not cryptographic. Use
    // crypto.randomUUID() for collision-free, opaque ids. Existing rows
    // keep their old shape because Appraisal.id is `String` — no migration.
    const appraisalId = randomUUID();

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
    // MEDIUM #27: defensive try wrapper around the setImmediate body so a
    // synchronous throw inside the lambda (e.g. a future contributor adds
    // code BEFORE the .then chain that throws) can't escape as an
    // unhandledRejection.
    setImmediate(() => {
      try {
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
      } catch (err) {
        logger.error('Baseline appraisal PDF setImmediate threw synchronously', {
          appraisalId,
          err: (err as Error).message,
        });
      }
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

/**
 * CRITICAL #10: rebuild a canonical, trusted AppraisalSummaryData from the
 * DB row — NEVER trust the client-supplied `appraisalData`. The previous
 * code allowed any authenticated user to send fake appraisal emails with
 * arbitrary numbers / VINs. We honour only:
 *   - `toEmail` (validated as an email by zod / route layer)
 *   - `appraisalData.photos` (transient; not persisted in DB; passed
 *     through processPhotosForEmbedding before use)
 * Everything else (vehicle, valuation, condition, zip, notes, photoCount)
 * is read from the prisma.appraisal row scoped to the authenticated user.
 */
async function loadTrustedAppraisalData(
  appraisalId: string,
  userId: string,
  fallbackUserEmail: string,
  clientPhotos: string[] | undefined,
): Promise<AppraisalSummaryData | null> {
  const row = await prisma.appraisal.findFirst({
    where: { id: appraisalId, userId },
  });
  if (!row) return null;

  // valuationData is stored as Prisma Json (broad union); we know it
  // matches AiValuationOutput because /valuate is the only writer. Cast
  // via `unknown` so TS doesn't complain about the structural mismatch.
  const valuation = (row.valuationData ?? {}) as unknown as AiValuationOutput;

  // Photos are not persisted on the appraisal row (they're embedded into the
  // PDF/email at send-time and discarded). We accept them from the body but
  // re-validate via processPhotosForEmbedding.
  const photos = processPhotosForEmbedding(clientPhotos);

  // Cast condition string to the union type. Older rows may have any string
  // here so default to 'average' for safety; the AI prompt + UI both treat
  // it as a label only.
  const cond = (row.condition === 'clean' || row.condition === 'rough')
    ? row.condition
    : 'average';

  return {
    appraisalId: row.id,
    vehicle: {
      vin: row.vin,
      year: row.vehicleYear ?? 0,
      make: row.vehicleMake ?? '',
      model: row.vehicleModel ?? '',
      trim: row.vehicleTrim ?? undefined,
      mileage: row.mileage ?? 0,
    },
    condition: cond,
    zipCode: row.zipCode ?? undefined,
    notes: row.notes ?? undefined,
    valuation,
    photoCount: photos.length || row.photoCount,
    photos,
    createdAt: row.createdAt.toISOString(),
    userEmail: row.userEmail ?? fallbackUserEmail,
    userFullName: row.userFullName ?? undefined,
  };
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
    const userId = req.user!.userId;

    // CRITICAL #10: rebuild the appraisal payload from the DB row, scoped
    // to the authenticated user. The body's `appraisalData` is treated as
    // untrusted — only `appraisalId` (lookup key) and `photos` are honoured.
    const trusted = await loadTrustedAppraisalData(
      appraisalData?.appraisalId,
      userId,
      req.user!.email,
      appraisalData?.photos,
    );
    if (!trusted) {
      res.status(404).json({ success: false, error: 'Appraisal not found' });
      return;
    }

    logger.info('Appraisal email requested', {
      userId,
      appraisalId: trusted.appraisalId,
      toEmail,
      vin: trusted.vehicle.vin,
    });

    // Reuse the baseline PDF that /valuate generated in the background so the
    // "Email Appraisal" flow always attaches a PDF. If /valuate's background
    // job hasn't finished yet (race on very fast re-send) we generate one now
    // so we never send a PDF-less email for a row that should have one.
    let pdfPath: string | null = null;
    try {
      const existing = await prisma.appraisal.findUnique({
        where: { id: trusted.appraisalId },
        select: { pdfUrl: true },
      });
      if (existing?.pdfUrl && fs.existsSync(existing.pdfUrl)) {
        pdfPath = existing.pdfUrl;
      } else {
        pdfPath = await generateAppraisalPdf(trusted);
        await prisma.appraisal.update({
          where: { id: trusted.appraisalId },
          data: { pdfUrl: pdfPath },
        }).catch((dbErr) => {
          logger.warn('emailAppraisal: could not persist late-generated pdfUrl', {
            appraisalId: trusted.appraisalId,
            error: (dbErr as Error).message,
          });
        });
      }
    } catch (pdfErr) {
      // Non-fatal: we still send the email (HTML-only) if PDF generation fails.
      logger.warn('emailAppraisal: PDF generation failed, falling back to HTML-only email', {
        appraisalId: trusted.appraisalId,
        error: (pdfErr as Error).message,
      });
      pdfPath = null;
    }

    await sendAppraisalEmail(toEmail, trusted, pdfPath);

    logger.info('Appraisal email sent successfully', {
      appraisalId: trusted.appraisalId,
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
    const userId = req.user!.userId;

    // CRITICAL #10: same server-overwrite as emailAppraisal — only
    // appraisalId + photos are honoured from the body; vehicle/valuation
    // come from the DB row.
    const trusted = await loadTrustedAppraisalData(
      appraisalData?.appraisalId,
      userId,
      req.user!.email,
      appraisalData?.photos,
    );
    if (!trusted) {
      res.status(404).json({ success: false, error: 'Appraisal not found' });
      return;
    }

    logger.info('Appraisal PDF requested', {
      userId,
      appraisalId: trusted.appraisalId,
      toEmail,
      vin: trusted.vehicle.vin,
    });

    // If the user didn't add photos and /valuate already produced a baseline
    // PDF we reuse that file to avoid writing duplicates. When photos ARE
    // attached the PDF is content-different, so we regenerate.
    const hasPhotos = Array.isArray(trusted.photos) && trusted.photos.length > 0;
    let pdfPath: string;
    if (!hasPhotos) {
      const existing = await prisma.appraisal.findUnique({
        where: { id: trusted.appraisalId },
        select: { pdfUrl: true },
      }).catch(() => null);
      if (existing?.pdfUrl && fs.existsSync(existing.pdfUrl)) {
        pdfPath = existing.pdfUrl;
        logger.info('Reusing baseline appraisal PDF (no photos attached)', {
          appraisalId: trusted.appraisalId,
          pdfPath,
        });
      } else {
        pdfPath = await generateAppraisalPdf(trusted);
      }
    } else {
      pdfPath = await generateAppraisalPdf(trusted);
    }

    logger.info('Appraisal PDF ready', {
      appraisalId: trusted.appraisalId,
      pdfPath,
      hasPhotos,
      photoCount: trusted.photos?.length || 0,
    });

    // Update DB record with pdfUrl (and photoCount when photos are present)
    try {
      await prisma.appraisal.update({
        where: { id: trusted.appraisalId },
        data: { pdfUrl: pdfPath, photoCount: trusted.photos?.length || 0 },
      });
    } catch (dbErr) {
      logger.warn('Failed to update appraisal pdfUrl in DB', { error: (dbErr as Error).message });
    }

    // Send email with PDF attachment
    await sendAppraisalEmail(toEmail, trusted, pdfPath);

    // Keep PDF file on disk so dealers can view it later via PDF View link

    logger.info('Appraisal PDF email sent successfully', {
      appraisalId: trusted.appraisalId,
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
