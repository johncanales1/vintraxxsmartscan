import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';

export async function listInspections(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const inspections = await prisma.inspection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      inspections: inspections.map((i: any) => ({
        id: i.id,
        vehicleInfo: i.vehicleInfo,
        vin: i.vin,
        mileage: i.mileage,
        color: i.color,
        inspector: i.inspector,
        date: i.date,
        createdAt: i.createdAt.toISOString(),
        ratings: i.ratings,
        damageMarks: i.damageMarks,
      })),
    });
  } catch (error) {
    next(error);
  }
}

export async function createInspection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { vehicleInfo, vin, mileage, color, inspector, date, ratings, damageMarks } = req.body;

    const inspection = await prisma.inspection.create({
      data: {
        userId,
        vehicleInfo: vehicleInfo || null,
        vin: vin || null,
        mileage: mileage || null,
        color: color || null,
        inspector: inspector || null,
        date: date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        ratings: ratings || {},
        damageMarks: damageMarks || [],
      },
    });

    res.json({
      success: true,
      inspection: {
        id: inspection.id,
        vehicleInfo: inspection.vehicleInfo,
        vin: inspection.vin,
        mileage: inspection.mileage,
        color: inspection.color,
        inspector: inspection.inspector,
        date: inspection.date,
        createdAt: inspection.createdAt.toISOString(),
        ratings: inspection.ratings,
        damageMarks: inspection.damageMarks,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getInspection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const inspection = await prisma.inspection.findFirst({
      where: { id, userId },
    });

    if (!inspection) {
      res.status(404).json({ success: false, error: 'Inspection not found' });
      return;
    }

    res.json({
      success: true,
      inspection: {
        id: inspection.id,
        vehicleInfo: inspection.vehicleInfo,
        vin: inspection.vin,
        mileage: inspection.mileage,
        color: inspection.color,
        inspector: inspection.inspector,
        date: inspection.date,
        createdAt: inspection.createdAt.toISOString(),
        ratings: inspection.ratings,
        damageMarks: inspection.damageMarks,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteInspection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const inspection = await prisma.inspection.findFirst({
      where: { id, userId },
    });

    if (!inspection) {
      res.status(404).json({ success: false, error: 'Inspection not found' });
      return;
    }

    await prisma.inspection.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
