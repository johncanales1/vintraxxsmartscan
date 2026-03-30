import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import prisma from '../config/db';
import logger from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const LOGO_DIR = path.join(__dirname, '..', 'assets', 'dealer-logos');

// Ensure logo directory exists
if (!fs.existsSync(LOGO_DIR)) {
  fs.mkdirSync(LOGO_DIR, { recursive: true });
}

export async function dealerLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
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
    const { pricePerLaborHour, logoImage } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isDealer) {
      res.status(403).json({ success: false, error: 'Dealer access required.' });
      return;
    }

    const updateData: { pricePerLaborHour?: number; logoUrl?: string } = {};

    if (pricePerLaborHour !== undefined && typeof pricePerLaborHour === 'number' && pricePerLaborHour > 0) {
      updateData.pricePerLaborHour = pricePerLaborHour;
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
        const apiBase = process.env.NODE_ENV === 'production' 
          ? 'https://api.vintraxx.com' 
          : 'http://localhost:3000';
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

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        isDealer: true,
        pricePerLaborHour: true,
        logoUrl: true,
      },
    });

    logger.info(`Dealer profile updated: ${user.email}`, {
      pricePerLaborHour: updated.pricePerLaborHour,
      hasLogo: !!updated.logoUrl,
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
      pdfUrl: scan.fullReport?.pdfUrl ?? null,
      emailSentAt: scan.fullReport?.emailSentAt?.toISOString() ?? null,
    }));

    res.json({ success: true, reports });
  } catch (error) {
    next(error);
  }
}
