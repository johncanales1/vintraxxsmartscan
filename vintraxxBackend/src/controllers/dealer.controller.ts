import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import prisma from '../config/db';
import logger from '../utils/logger';

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

    if (logoImage && typeof logoImage === 'string') {
      // Store base64 logo image directly (or URL if provided)
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
