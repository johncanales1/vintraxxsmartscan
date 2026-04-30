/**
 * gps-dtc.service — query GpsDtcEvent rows with the same scope rules as the
 * alarm service (user-scoped via ownerUserId, admin-scoped is unrestricted).
 *
 * The promote-to-Scan flow lives in gps-dtc-bridge.service; this file is the
 * read side only.
 */

import prisma from '../config/db';
import { Prisma } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

interface ListOptions {
  userId?: string;
  admin?: boolean;
  page: number;
  limit: number;
  terminalId?: string;
  vin?: string;
  /** Limit to events whose MIL was on at report time. */
  milOnly?: boolean;
  since?: Date;
  until?: Date;
}

export async function listDtcEvents(opts: ListOptions) {
  if (!opts.admin && !opts.userId) {
    throw new AppError('Either admin or userId must be set', 500);
  }

  const where: Prisma.GpsDtcEventWhereInput = {};
  if (!opts.admin) where.ownerUserId = opts.userId;
  if (opts.terminalId) where.terminalId = opts.terminalId;
  if (opts.vin) where.vin = opts.vin;
  if (opts.milOnly) where.milOn = true;
  if (opts.since || opts.until) {
    where.reportedAt = {};
    if (opts.since) (where.reportedAt as Record<string, unknown>).gte = opts.since;
    if (opts.until) (where.reportedAt as Record<string, unknown>).lte = opts.until;
  }

  const [total, events] = await Promise.all([
    prisma.gpsDtcEvent.count({ where }),
    prisma.gpsDtcEvent.findMany({
      where,
      orderBy: { reportedAt: 'desc' },
      take: opts.limit,
      skip: (opts.page - 1) * opts.limit,
      include: {
        terminal: {
          select: { id: true, imei: true, nickname: true, vehicleVin: true },
        },
        // The bridge sets `Scan.gpsDtcEventId` so each DTC event can carry the
        // resulting Scan id (and current status) in the response. No FullReport
        // here — that's a separate hydrate when the user opens the detail.
        promotedScans: {
          select: { id: true, status: true, processedAt: true },
          orderBy: { receivedAt: 'desc' },
          take: 1,
        },
      },
    }),
  ]);

  return {
    events,
    page: opts.page,
    limit: opts.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / opts.limit)),
  };
}

export async function getDtcEventDetail(opts: {
  dtcEventId: string;
  userId?: string;
  admin?: boolean;
}) {
  const event = await prisma.gpsDtcEvent.findUnique({
    where: { id: opts.dtcEventId },
    include: {
      terminal: true,
      promotedScans: {
        select: { id: true, status: true, processedAt: true, receivedAt: true },
        orderBy: { receivedAt: 'desc' },
      },
    },
  });
  if (!event) throw new AppError('DTC event not found', 404);

  if (!opts.admin && event.ownerUserId !== opts.userId) {
    throw new AppError('DTC event not found', 404);
  }
  return event;
}
