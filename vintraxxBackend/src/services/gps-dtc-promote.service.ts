/**
 * gps-dtc-promote — convert a GpsDtcEvent into a real Scan + AI report.
 *
 * The mobile app calls this when the user taps "Run AI analysis" on a GPS-
 * detected DTC event in the History tab. We reuse the existing scan
 * pipeline — the result is indistinguishable from a BLE-scan-originated
 * report, which is the whole point of the bridge: GPS-detected codes feed
 * into the same AI/PDF/email flow the user already trusts.
 *
 * Idempotency: at most ONE Scan is promoted per GpsDtcEvent. Repeated calls
 * return the existing scanId so the client can poll `/scan/report/:scanId`
 * without creating a second AI charge.
 *
 * Authorisation lives in the controller — this service trusts that the
 * caller has already verified ownership of the source event.
 */

import prisma from '../config/db';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { processScanInBackground } from '../controllers/scan.controller';

interface PromoteInput {
  dtcEventId: string;
  /** Owner of the terminal; becomes Scan.userId. */
  userId: string;
}

interface PromoteResult {
  scanId: string;
  /** True if we found an existing Scan and skipped creating a new one. */
  reused: boolean;
}

/**
 * Promote a GPS-DTC event into a Scan and kick off background AI analysis.
 * Returns the scanId so the mobile client can reuse `apiService.pollReport`.
 */
export async function promoteDtcEventToScan(
  input: PromoteInput,
): Promise<PromoteResult> {
  const event = await prisma.gpsDtcEvent.findUnique({
    where: { id: input.dtcEventId },
    select: {
      id: true,
      terminalId: true,
      ownerUserId: true,
      vin: true,
      mileageKm: true,
      milOn: true,
      dtcCount: true,
      storedDtcCodes: true,
      pendingDtcCodes: true,
      permanentDtcCodes: true,
      latitude: true,
      longitude: true,
      reportedAt: true,
    },
  });
  if (!event) throw new AppError('DTC event not found', 404);
  if (event.ownerUserId !== input.userId) {
    // 404 not 403 to avoid leaking IDs of other users' events.
    throw new AppError('DTC event not found', 404);
  }
  if (!event.vin) {
    throw new AppError(
      'DTC event has no VIN; cannot promote to AI report',
      400,
    );
  }

  // Idempotency: if we already promoted this event, return the existing scan.
  const existing = await prisma.scan.findFirst({
    where: { gpsDtcEventId: event.id },
    select: { id: true, userId: true, status: true },
  });
  if (existing) {
    if (existing.userId !== input.userId) {
      throw new AppError('DTC event already promoted under another user', 409);
    }
    logger.info('DTC promote: returning existing scan (idempotent)', {
      dtcEventId: event.id,
      scanId: existing.id,
      status: existing.status,
    });
    return { scanId: existing.id, reused: true };
  }

  // Fetch the user once for the email + dealer flags downstream.
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, email: true, fullName: true },
  });
  if (!user) throw new AppError('User not found', 404);

  // Convert km → miles to match the existing Scan.mileage convention (BLE
  // scans store miles). 1 km ≈ 0.621371 mi.
  const mileageMiles =
    event.mileageKm !== null && event.mileageKm !== undefined
      ? Math.round(Number(event.mileageKm) * 0.621371)
      : null;

  // CRITICAL #3: race-safe insert. Scan.gpsDtcEventId is now @unique, so
  // a concurrent caller that wins the race causes us to land on P2002. We
  // re-fetch the existing row and report `reused: true` so the second caller
  // observes the idempotent semantic the API contract promises.
  let scan: { id: string };
  try {
    scan = await prisma.scan.create({
      data: {
        userId: input.userId,
        vin: event.vin,
        mileage: mileageMiles,
        milOn: event.milOn,
        dtcCount: event.dtcCount,
        storedDtcCodes: event.storedDtcCodes ?? [],
        pendingDtcCodes: event.pendingDtcCodes ?? [],
        permanentDtcCodes: event.permanentDtcCodes ?? [],
        // Telemetry-derived events don't include "since cleared" telemetry —
        // leave the BLE-only fields null so the AI prompt knows it's missing.
        distanceSinceCleared: null,
        timeSinceCleared: null,
        warmupsSinceCleared: null,
        distanceWithMilOn: null,
        fuelSystemStatus: undefined,
        secondaryAirStatus: null,
        milStatusByEcu: undefined,
        additionalRepairs: [],
        scannerDeviceId: null,
        userFullName: user.fullName ?? null,
        vehicleOwnerName: null,
        // rawPayload stores the original GPS-DTC event for traceability so
        // ops can audit how a Scan came into being.
        rawPayload: {
          source: 'gps-dtc-event',
          dtcEventId: event.id,
          terminalId: event.terminalId,
          latitude: event.latitude?.toString() ?? null,
          longitude: event.longitude?.toString() ?? null,
          reportedAt: event.reportedAt.toISOString(),
        } as object,
        scanDate: event.reportedAt,
        status: 'RECEIVED',
        gpsDtcEventId: event.id,
      },
      select: { id: true },
    });
  } catch (err) {
    if ((err as { code?: string })?.code === 'P2002') {
      const winner = await prisma.scan.findFirst({
        where: { gpsDtcEventId: event.id },
        select: { id: true, userId: true },
      });
      if (winner) {
        if (winner.userId !== input.userId) {
          throw new AppError('DTC event already promoted under another user', 409);
        }
        logger.info('DTC promote: lost create race, returning winner', {
          dtcEventId: event.id,
          scanId: winner.id,
        });
        return { scanId: winner.id, reused: true };
      }
    }
    throw err;
  }

  logger.info('DTC promote: created Scan from GPS-DTC event', {
    dtcEventId: event.id,
    scanId: scan.id,
    userId: input.userId,
    vin: event.vin,
    dtcCount: event.dtcCount,
  });

  // Kick off the existing background pipeline (decode VIN → AI → PDF → email).
  // Errors are caught inside the helper and reflected on the Scan row.
  void processScanInBackground(scan.id, input.userId, user.email).catch(
    (err) => {
      logger.error(`Background AI processing failed for promoted scan ${scan.id}`, {
        error: (err as Error).message,
        dtcEventId: event.id,
      });
    },
  );

  return { scanId: scan.id, reused: false };
}
