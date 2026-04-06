import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import prisma from '../config/db';
import logger from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { env } from '../config/env';

const API_BASE_URL = 'https://api.vintraxx.com';

function toPublicPdfUrl(filePath: string | null | undefined): string | null {
  if (!filePath) return null;
  const filename = path.basename(filePath);
  return `${API_BASE_URL}/reports/${filename}`;
}

const LOGO_DIR = path.join(__dirname, '..', 'assets', 'dealer-logos');
const QR_CODE_DIR = path.join(__dirname, '..', 'assets', 'dealer-qrcodes');

// Ensure logo and QR code directories exist
if (!fs.existsSync(LOGO_DIR)) {
  fs.mkdirSync(LOGO_DIR, { recursive: true });
}
if (!fs.existsSync(QR_CODE_DIR)) {
  fs.mkdirSync(QR_CODE_DIR, { recursive: true });
}

export async function dealerLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    logger.info('Dealer login attempt', { email, hasPassword: !!password, passwordLength: password?.length });
    const result = await authService.login(email, password);

    if (!result.user.isDealer) {
      res.status(403).json({ success: false, error: 'This account is not a dealer account.' });
      return;
    }

    res.json({ success: true, user: result.user, token: result.token });
  } catch (error) {
    next(error);
  }
}

export async function getDealerProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isDealer: true,
        pricePerLaborHour: true,
        logoUrl: true,
        originalLogoUrl: true,
        qrCodeUrl: true,
        createdAt: true,
      },
    });

    if (!user || !user.isDealer) {
      res.status(403).json({ success: false, error: 'Dealer access required.' });
      return;
    }

    res.json({ success: true, dealer: user });
  } catch (error) {
    next(error);
  }
}

export async function updateDealerProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { pricePerLaborHour, logoImage, originalLogoImage, qrCodeImage, password } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isDealer) {
      res.status(403).json({ success: false, error: 'Dealer access required.' });
      return;
    }

    // If updating QR code, require password verification
    if (qrCodeImage) {
      if (!password) {
        res.status(400).json({ success: false, error: 'Password is required to update QR code.' });
        return;
      }
      if (!user.passwordHash) {
        res.status(400).json({ success: false, error: 'Cannot verify password for OAuth users.' });
        return;
      }
      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        res.status(401).json({ success: false, error: 'Invalid password.' });
        return;
      }
    }

    const updateData: { pricePerLaborHour?: number; logoUrl?: string; originalLogoUrl?: string; qrCodeUrl?: string } = {};

    if (pricePerLaborHour !== undefined && typeof pricePerLaborHour === 'number' && pricePerLaborHour > 0) {
      updateData.pricePerLaborHour = pricePerLaborHour;
    }

    const apiBase = process.env.NODE_ENV === 'production' 
      ? 'https://api.vintraxx.com' 
      : 'http://localhost:3000';

    // Handle original logo image (unedited version for crop editor)
    if (originalLogoImage && typeof originalLogoImage === 'string' && originalLogoImage.startsWith('data:image/')) {
      // Delete old original logo file if it exists
      if (user.originalLogoUrl && !user.originalLogoUrl.startsWith('data:') && user.originalLogoUrl.includes('/dealer-logos/')) {
        const oldFilename = user.originalLogoUrl.split('/dealer-logos/').pop();
        if (oldFilename) {
          const oldFilePath = path.join(LOGO_DIR, oldFilename);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            logger.info(`Deleted old original logo file: ${oldFilename}`);
          }
        }
      }

      // Parse base64 image and save original to file
      const origMatches = originalLogoImage.match(/^data:image\/(\w+);base64,(.+)$/);
      if (origMatches) {
        const ext = origMatches[1] === 'jpeg' ? 'jpg' : origMatches[1];
        const base64Data = origMatches[2];
        const filename = `original-${userId}-${Date.now()}.${ext}`;
        const filePath = path.join(LOGO_DIR, filename);
        
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        updateData.originalLogoUrl = `${apiBase}/assets/dealer-logos/${filename}`;
        
        logger.info(`Saved new original logo file: ${filename}`);
      }
    }

    if (logoImage && typeof logoImage === 'string' && logoImage.startsWith('data:image/')) {
      // Delete old logo file if it exists (not a base64 string)
      if (user.logoUrl && !user.logoUrl.startsWith('data:') && user.logoUrl.includes('/dealer-logos/')) {
        const oldFilename = user.logoUrl.split('/dealer-logos/').pop();
        if (oldFilename) {
          const oldFilePath = path.join(LOGO_DIR, oldFilename);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            logger.info(`Deleted old logo file: ${oldFilename}`);
          }
        }
      }

      // Parse base64 image and save to file
      const matches = logoImage.match(/^data:image\/(\w+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        const base64Data = matches[2];
        const filename = `${userId}-${Date.now()}.${ext}`;
        const filePath = path.join(LOGO_DIR, filename);
        
        // Write file to disk
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        
        // Store URL path instead of base64
        updateData.logoUrl = `${apiBase}/assets/dealer-logos/${filename}`;
        
        logger.info(`Saved new logo file: ${filename}`);
      } else {
        // If not valid base64, store as-is (could be a URL)
        updateData.logoUrl = logoImage;
      }
    } else if (logoImage && typeof logoImage === 'string') {
      // Store URL directly if not base64
      updateData.logoUrl = logoImage;
    }

    // Handle QR code image
    if (qrCodeImage && typeof qrCodeImage === 'string' && qrCodeImage.startsWith('data:image/')) {
      // Delete old QR code file if it exists
      if (user.qrCodeUrl && !user.qrCodeUrl.startsWith('data:') && user.qrCodeUrl.includes('/dealer-qrcodes/')) {
        const oldFilename = user.qrCodeUrl.split('/dealer-qrcodes/').pop();
        if (oldFilename) {
          const oldFilePath = path.join(QR_CODE_DIR, oldFilename);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            logger.info(`Deleted old QR code file: ${oldFilename}`);
          }
        }
      }

      // Parse base64 image and save to file
      const matches = qrCodeImage.match(/^data:image\/(\w+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        const base64Data = matches[2];
        const filename = `qr-${userId}-${Date.now()}.${ext}`;
        const filePath = path.join(QR_CODE_DIR, filename);
        
        // Write file to disk
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        
        // Store URL path instead of base64
        const apiBase = process.env.NODE_ENV === 'production' 
          ? 'https://api.vintraxx.com' 
          : 'http://localhost:3000';
        updateData.qrCodeUrl = `${apiBase}/assets/dealer-qrcodes/${filename}`;
        
        logger.info(`Saved new QR code file: ${filename}`);
      } else {
        updateData.qrCodeUrl = qrCodeImage;
      }
    } else if (qrCodeImage && typeof qrCodeImage === 'string') {
      updateData.qrCodeUrl = qrCodeImage;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        isDealer: true,
        pricePerLaborHour: true,
        logoUrl: true,
        qrCodeUrl: true,
      },
    });

    logger.info(`Dealer profile updated: ${user.email}`, {
      pricePerLaborHour: updated.pricePerLaborHour,
      hasLogo: !!updated.logoUrl,
      hasQrCode: !!updated.qrCodeUrl,
    });

    res.json({ success: true, dealer: updated });
  } catch (error) {
    next(error);
  }
}

export async function getDealerReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isDealer) {
      res.status(403).json({ success: false, error: 'Dealer access required.' });
      return;
    }

    const scans = await prisma.scan.findMany({
      where: { userId },
      orderBy: { receivedAt: 'desc' },
      include: { fullReport: true },
    });

    const reports = scans.map((scan) => ({
      scanId: scan.id,
      vin: scan.vin,
      vehicleYear: scan.vehicleYear,
      vehicleMake: scan.vehicleMake,
      vehicleModel: scan.vehicleModel,
      status: scan.status,
      scanDate: scan.scanDate.toISOString(),
      stockNumber: scan.stockNumber,
      additionalRepairs: scan.additionalRepairs,
      totalReconditioningCost: scan.fullReport?.totalReconditioningCost ?? null,
      additionalRepairsCost: scan.fullReport?.additionalRepairsCost ?? null,
      pdfUrl: toPublicPdfUrl(scan.fullReport?.pdfUrl),
      emailSentAt: scan.fullReport?.emailSentAt?.toISOString() ?? null,
    }));

    res.json({ success: true, reports });
  } catch (error) {
    next(error);
  }
}

// ================================================================
// GET /api/v1/dealer/scan-history
// Get OBD scan history with statistics for dashboard charts
// ================================================================
export async function getDealerScanHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isDealer) {
      res.status(403).json({ success: false, error: 'Dealer access required.' });
      return;
    }

    const scans = await prisma.scan.findMany({
      where: { userId, status: 'COMPLETED' },
      orderBy: { scanDate: 'desc' },
      include: { fullReport: true },
    });

    // Calculate health scores and build report list
    const reports = scans.map((scan) => {
      const fr = scan.fullReport;
      let healthScore = 100;
      
      if (fr) {
        const aiRaw = fr.aiRawResponse as any;
        if (aiRaw?.dtcAnalysis) {
          for (const dtc of aiRaw.dtcAnalysis) {
            switch (dtc.severity) {
              case 'critical': healthScore -= 20; break;
              case 'moderate': healthScore -= 10; break;
              case 'minor': healthScore -= 5; break;
            }
          }
        }
        if (scan.milOn) healthScore -= 10;
        const emCheck = aiRaw?.emissionsCheck;
        if (emCheck?.status === 'fail') healthScore -= 10;
      }
      healthScore = Math.max(0, Math.min(100, healthScore));

      const totalCost = (fr?.totalReconditioningCost ?? 0) + (fr?.additionalRepairsCost ?? 0);

      return {
        scanId: scan.id,
        vin: scan.vin,
        vehicleYear: scan.vehicleYear,
        vehicleMake: scan.vehicleMake,
        vehicleModel: scan.vehicleModel,
        mileage: scan.mileage,
        stockNumber: scan.stockNumber,
        scanDate: scan.scanDate.toISOString(),
        healthScore,
        totalRepairCost: totalCost,
        dtcCount: scan.dtcCount,
        status: scan.status,
        pdfUrl: toPublicPdfUrl(fr?.pdfUrl),
      };
    });

    // Calculate statistics
    const totalScans = reports.length;
    const totalRepairCosts = reports.reduce((sum, r) => sum + r.totalRepairCost, 0);
    const scansWithRepairs = reports.filter(r => r.healthScore < 100).length;

    // Health score distribution
    const healthScoreDistribution = {
      excellent: reports.filter(r => r.healthScore >= 90).length,
      good: reports.filter(r => r.healthScore >= 70 && r.healthScore < 90).length,
      fair: reports.filter(r => r.healthScore >= 50 && r.healthScore < 70).length,
      poor: reports.filter(r => r.healthScore < 50).length,
    };

    // Monthly scan activity (last 12 months)
    const now = new Date();
    const monthlyActivity: { month: string; scans: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString('en-US', { month: 'short' });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      const count = reports.filter(r => {
        const scanDate = new Date(r.scanDate);
        return scanDate >= monthStart && scanDate <= monthEnd;
      }).length;
      monthlyActivity.push({ month: monthName, scans: count });
    }

    res.json({
      success: true,
      statistics: {
        totalScans,
        totalRepairCosts,
        scansWithRepairs,
        healthScoreDistribution,
        monthlyActivity,
      },
      reports,
    });
  } catch (error) {
    logger.error('Dealer scan history failed', { error: (error as Error).message });
    next(error);
  }
}

// ================================================================
// GET /api/v1/dealer/report/:scanId
// Get single OBD scan report detail
// ================================================================
export async function getDealerReportDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const scanId = req.params.scanId as string;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isDealer) {
      res.status(403).json({ success: false, error: 'Dealer access required.' });
      return;
    }

    const scan: any = await prisma.scan.findFirst({
      where: { id: scanId, userId },
      include: { fullReport: true },
    });

    if (!scan) {
      res.status(404).json({ success: false, error: 'Scan not found' });
      return;
    }

    if (scan.status !== 'COMPLETED' || !scan.fullReport) {
      res.json({ success: true, status: 'processing' });
      return;
    }

    const fr = scan.fullReport;
    const aiRaw = fr.aiRawResponse as any;

    // Calculate health score
    let healthScore = 100;
    if (aiRaw?.dtcAnalysis) {
      for (const dtc of aiRaw.dtcAnalysis) {
        switch (dtc.severity) {
          case 'critical': healthScore -= 20; break;
          case 'moderate': healthScore -= 10; break;
          case 'minor': healthScore -= 5; break;
        }
      }
    }
    if (scan.milOn) healthScore -= 10;
    if (aiRaw?.emissionsCheck?.status === 'fail') healthScore -= 10;
    healthScore = Math.max(0, Math.min(100, healthScore));

    const report = {
      scanId: scan.id,
      vin: scan.vin,
      vehicleYear: scan.vehicleYear,
      vehicleMake: scan.vehicleMake,
      vehicleModel: scan.vehicleModel,
      vehicleEngine: scan.vehicleEngine,
      mileage: scan.mileage,
      stockNumber: scan.stockNumber,
      scanDate: scan.scanDate.toISOString(),
      healthScore,
      overallStatus: healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'attention_needed' : 'critical',
      milOn: scan.milOn,
      dtcCount: scan.dtcCount,
      storedDtcCodes: scan.storedDtcCodes,
      pendingDtcCodes: scan.pendingDtcCodes,
      permanentDtcCodes: scan.permanentDtcCodes,
      distanceSinceCleared: scan.distanceSinceCleared,
      dtcAnalysis: aiRaw?.dtcAnalysis || [],
      emissionsCheck: aiRaw?.emissionsCheck || null,
      mileageRiskAssessment: aiRaw?.mileageRiskAssessment || [],
      repairRecommendations: fr.repairRecommendations || [],
      modulesScanned: fr.modulesScanned || [],
      datapointsScanned: fr.datapointsScanned || 0,
      totalReconditioningCost: fr.totalReconditioningCost || 0,
      additionalRepairsCost: fr.additionalRepairsCost || 0,
      additionalRepairsData: fr.additionalRepairsData || null,
      grandTotalCost: (fr.totalReconditioningCost || 0) + (fr.additionalRepairsCost || 0),
      aiSummary: aiRaw?.aiSummary || '',
      pdfUrl: toPublicPdfUrl(fr.pdfUrl),
      createdAt: fr.createdAt.toISOString(),
    };

    res.json({ success: true, status: 'completed', report });
  } catch (error) {
    logger.error('Dealer report detail failed', { error: (error as Error).message });
    next(error);
  }
}

// ================================================================
// POST /api/v1/dealer/schedule-appointment
// Send service appointment request email to john@vintraxx.com
// ================================================================
export async function scheduleAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      name,
      email,
      phone,
      dealership,
      vehicle,
      vin,
      serviceType,
      preferredDate,
      preferredTime,
      additionalNotes,
    } = req.body;

    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    const submittedAt = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; background: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #8B2332; color: #fff; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 22px; }
    .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.85; }
    .content { background: #ffffff; padding: 28px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 16px; }
    .label { font-size: 12px; text-transform: uppercase; color: #888; font-weight: bold; letter-spacing: 0.5px; }
    .value { font-size: 15px; color: #1a1a2e; margin-top: 2px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .divider { border: none; border-top: 1px solid #eee; margin: 20px 0; }
    .notes-box { background: #f9f9f9; border: 1px solid #eee; border-radius: 6px; padding: 12px; margin-top: 4px; font-size: 14px; color: #555; }
    .footer { text-align: center; padding: 16px; color: #999; font-size: 12px; }
    .badge { display: inline-block; background: #8B2332; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>VinTraxx SmartScan</h1>
      <p>New Service Appointment Request</p>
    </div>
    <div class="content">
      <p style="margin-top:0;">A new service appointment has been submitted on <strong>${submittedAt}</strong>.</p>
      <hr class="divider" />
      <div class="grid">
        <div class="field">
          <div class="label">Name</div>
          <div class="value">${name}</div>
        </div>
        <div class="field">
          <div class="label">Email</div>
          <div class="value"><a href="mailto:${email}" style="color:#8B2332;">${email}</a></div>
        </div>
        <div class="field">
          <div class="label">Phone</div>
          <div class="value">${phone || '—'}</div>
        </div>
        <div class="field">
          <div class="label">Dealership</div>
          <div class="value">${dealership || '—'}</div>
        </div>
        <div class="field">
          <div class="label">Vehicle</div>
          <div class="value">${vehicle || '—'}</div>
        </div>
        <div class="field">
          <div class="label">VIN</div>
          <div class="value" style="font-family: monospace;">${vin || '—'}</div>
        </div>
      </div>
      <hr class="divider" />
      <div class="field">
        <div class="label">Service Type</div>
        <div class="value"><span class="badge">${serviceType}</span></div>
      </div>
      <div class="grid" style="margin-top:16px;">
        <div class="field">
          <div class="label">Preferred Date</div>
          <div class="value">${preferredDate}</div>
        </div>
        <div class="field">
          <div class="label">Preferred Time</div>
          <div class="value">${preferredTime || '—'}</div>
        </div>
      </div>
      ${additionalNotes ? `
      <hr class="divider" />
      <div class="field">
        <div class="label">Additional Notes</div>
        <div class="notes-box">${additionalNotes}</div>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} VinTraxx SmartScan. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
      to: 'john@vintraxx.com',
      replyTo: email,
      subject: `Service Appointment Request — ${name} — ${serviceType}`,
      html: htmlBody,
    });

    logger.info('Schedule appointment email sent', { name, email, serviceType, preferredDate });

    res.json({ success: true, message: 'Appointment request submitted successfully.' });
  } catch (error) {
    logger.error('Schedule appointment email failed', { error: (error as Error).message });
    next(error);
  }
}
