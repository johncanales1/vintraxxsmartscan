/**
 * gps-trip-query.service — read-side queries for GpsTrip rows.
 *
 * Mirror of gps-alarm.service / gps-dtc.service: same scope discriminator
 * (`admin: true` bypasses the owner filter), same pagination shape, same
 * 404-leak-protection behaviour (a user requesting another user's trip
 * gets `not found` rather than `forbidden`).
 *
 * Trips themselves are mutated by `gps-trip.service`; this file is read
 * only.
 */

import prisma from '../config/db';
import { Prisma, type GpsTripStatus } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

interface ListOptions {
  userId?: string;
  admin?: boolean;
  page: number;
  limit: number;
  terminalId?: string;
  status?: GpsTripStatus;
  since?: Date;
  until?: Date;
}

export async function listTrips(opts: ListOptions) {
  if (!opts.admin && !opts.userId) {
    throw new AppError('Either admin or userId must be set', 500);
  }

  const where: Prisma.GpsTripWhereInput = {};
  if (!opts.admin) where.ownerUserId = opts.userId;
  if (opts.terminalId) where.terminalId = opts.terminalId;
  if (opts.status) where.status = opts.status;
  if (opts.since || opts.until) {
    where.startAt = {};
    if (opts.since) (where.startAt as Record<string, unknown>).gte = opts.since;
    if (opts.until) (where.startAt as Record<string, unknown>).lte = opts.until;
  }

  const [total, trips] = await Promise.all([
    prisma.gpsTrip.count({ where }),
    prisma.gpsTrip.findMany({
      where,
      orderBy: { startAt: 'desc' },
      take: opts.limit,
      skip: (opts.page - 1) * opts.limit,
      include: {
        terminal: {
          select: { id: true, deviceIdentifier: true, imei: true, nickname: true, vehicleVin: true },
        },
      },
    }),
  ]);

  return {
    trips,
    page: opts.page,
    limit: opts.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / opts.limit)),
  };
}

export async function getTripDetail(opts: {
  tripId: string;
  userId?: string;
  admin?: boolean;
}) {
  const trip = await prisma.gpsTrip.findUnique({
    where: { id: opts.tripId },
    include: { terminal: true },
  });
  if (!trip) throw new AppError('Trip not found', 404);

  if (!opts.admin && trip.ownerUserId !== opts.userId) {
    throw new AppError('Trip not found', 404);
  }
  return trip;
}

interface DailyStatsOptions {
  userId?: string;
  admin?: boolean;
  terminalId?: string;
  since: Date;
  until: Date;
}

/**
 * Range query against GpsTerminalDailyStats. Inclusive on both ends. The
 * `day` column is `Date` (no time-of-day) so we compare against UTC midnight
 * boundaries derived from `since`/`until`.
 *
 * Uses the `[ownerUserId, day]` and `[terminalId, day]` indexes the schema
 * already declares.
 */
export async function listDailyStats(opts: DailyStatsOptions) {
  if (!opts.admin && !opts.userId) {
    throw new AppError('Either admin or userId must be set', 500);
  }
  if (opts.since > opts.until) {
    throw new AppError('`since` must be earlier than `until`', 400);
  }

  // Truncate to UTC midnights to align with the day column's resolution.
  const sinceDay = new Date(
    Date.UTC(
      opts.since.getUTCFullYear(),
      opts.since.getUTCMonth(),
      opts.since.getUTCDate(),
    ),
  );
  const untilDay = new Date(
    Date.UTC(
      opts.until.getUTCFullYear(),
      opts.until.getUTCMonth(),
      opts.until.getUTCDate(),
    ),
  );

  const where: Prisma.GpsTerminalDailyStatsWhereInput = {
    day: { gte: sinceDay, lte: untilDay },
  };
  if (!opts.admin) where.ownerUserId = opts.userId;
  if (opts.terminalId) where.terminalId = opts.terminalId;

  const days = await prisma.gpsTerminalDailyStats.findMany({
    where,
    orderBy: [{ day: 'asc' }, { terminalId: 'asc' }],
    include: {
      terminal: {
        select: { id: true, deviceIdentifier: true, imei: true, nickname: true, vehicleVin: true },
      },
    },
  });

  return { days, since: sinceDay.toISOString(), until: untilDay.toISOString() };
}
