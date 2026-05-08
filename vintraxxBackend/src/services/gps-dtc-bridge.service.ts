/**
 * gps-dtc-bridge — promotes a GpsDtcEvent into a full Scan + AI report.
 *
 * The Scan model is the authoritative DTC analysis surface in this codebase
 * (PDF, email, dealer pricing, additional repairs, ...). When the GPS device
 * reports DTCs via 0x0900/0xF4, we want the SAME pipeline kicked off so the
 * vehicle owner gets the same report a BLE-scan would produce.
 *
 * What this bridge does:
 *   1. Refuse if terminal is unpaired, owner missing, VIN unknown, or no DTCs.
 *   2. Refuse (idempotent) if the DTC event already has a promoted Scan.
 *   3. Create a Scan row in RECEIVED state populated from the DTC event.
 *   4. Fire processScanInBackground(scanId, userId, email) — the same function
 *      submitScan() uses. This handles VIN decode, AI analysis, PDF, email.
 *   5. Emit a `dtc.detected` notify event for the realtime UI.
 *
 * Errors here are LOGGED ONLY — the GpsDtcEvent row already exists and the
 * admin UI lets ops manually re-promote later. Telemetry must never fail
 * because of an AI-pipeline hiccup.
 */

import prisma from '../config/db';
import logger from '../utils/logger';
import { processScanInBackground } from '../controllers/scan.controller';
import { emit as emitNotify } from '../realtime/notify';
import type { GpsDtcEvent, GpsTerminal } from '@prisma/client';

interface BridgeContext {
  dtcEvent: GpsDtcEvent;
  terminal: GpsTerminal;
}

/**
 * Promote the DTC event into a Scan and start the AI pipeline. Returns the
 * created Scan id, or `null` if the bridge no-op'd (unpaired terminal,
 * missing VIN, no codes, etc.) so the caller can log the reason it was
 * skipped without re-deriving the gating logic.
 */
export async function promoteDtcEventToScan(
  ctx: BridgeContext,
): Promise<string | null> {
  const { dtcEvent, terminal } = ctx;

  if (!terminal.ownerUserId) {
    logger.info('Skipping DTC→Scan bridge: terminal unpaired', {
      dtcEventId: dtcEvent.id,
      terminalId: terminal.id,
    });
    return null;
  }

  // VIN is mandatory for the AI pipeline (decodeVin / Black Book lookup
  // both key off it). If the device hasn't reported a VIN yet, skip — the
  // event is preserved and the next 0x0900/0xF5 will populate it.
  const vin = dtcEvent.vin ?? terminal.vehicleVin;
  if (!vin) {
    logger.info('Skipping DTC→Scan bridge: no VIN known yet', {
      dtcEventId: dtcEvent.id,
      terminalId: terminal.id,
    });
    return null;
  }

  const allCodes = [
    ...dtcEvent.storedDtcCodes,
    ...dtcEvent.pendingDtcCodes,
    ...dtcEvent.permanentDtcCodes,
  ];
  if (allCodes.length === 0) {
    logger.info('Skipping DTC→Scan bridge: empty DTC code list', {
      dtcEventId: dtcEvent.id,
    });
    return null;
  }

  // Idempotency guard — re-promoting on retry duplicates emails and PDFs.
  const existing = await prisma.scan.findFirst({
    where: { gpsDtcEventId: dtcEvent.id },
    select: { id: true },
  });
  if (existing) {
    logger.info('DTC→Scan bridge: scan already exists, skipping', {
      dtcEventId: dtcEvent.id,
      existingScanId: existing.id,
    });
    return existing.id;
  }

  const owner = await prisma.user.findUnique({
    where: { id: terminal.ownerUserId },
  });
  if (!owner) {
    logger.warn('DTC→Scan bridge: owner not found', {
      ownerUserId: terminal.ownerUserId,
    });
    return null;
  }

  // CRITICAL #2: Scan.mileage stores MILES (BLE scans always do), but
  // GpsDtcEvent.mileageKm is — as the column name says — kilometres.
  // Mirror the same conversion used in src/services/gps-dtc-promote.service.ts.
  const mileage =
    dtcEvent.mileageKm !== null && dtcEvent.mileageKm !== undefined
      ? Math.round(Number(dtcEvent.mileageKm) * 0.621371)
      : null;

  // CRITICAL #3: race-safe insert. Scan.gpsDtcEventId is @unique; a P2002
  // means the owner-driven promote (or another bridge invocation) already
  // created the row. We adopt the existing scan id and continue silently
  // — re-emitting the dtc.detected notify is harmless.
  let scanId: string;
  try {
    const scan = await prisma.scan.create({
      data: {
        userId: owner.id,
        vin,
        mileage,
        milOn: dtcEvent.milOn,
        dtcCount: allCodes.length,
        storedDtcCodes: dtcEvent.storedDtcCodes,
        pendingDtcCodes: dtcEvent.pendingDtcCodes,
        permanentDtcCodes: dtcEvent.permanentDtcCodes,
        distanceSinceCleared: null,
        timeSinceCleared: null,
        warmupsSinceCleared: null,
        distanceWithMilOn: null,
        fuelSystemStatus: undefined,
        secondaryAirStatus: null,
        milStatusByEcu: undefined,
        stockNumber: null,
        additionalRepairs: [],
        // Provenance — the JT/T 808 device identifier the scanner transmits
        // in every header. Falls back to the (possibly null) IMEI metadata
        // only if the row predates the deviceIdentifier migration; in
        // practice the backfill ensures deviceIdentifier is always set.
        scannerDeviceId: terminal.deviceIdentifier ?? terminal.imei,
        userFullName: owner.fullName ?? null,
        vehicleOwnerName: null,
        // rawPayload is required (non-null) — store the source DTC-event JSON
        // so forensic ops can re-derive the scan if the AI run is bad.
        rawPayload: {
          source: 'gps_terminal',
          terminalId: terminal.id,
          deviceIdentifier: terminal.deviceIdentifier,
          imei: terminal.imei,
          dtcEventId: dtcEvent.id,
          reportedAt: dtcEvent.reportedAt.toISOString(),
          storedDtcCodes: dtcEvent.storedDtcCodes,
          pendingDtcCodes: dtcEvent.pendingDtcCodes,
          permanentDtcCodes: dtcEvent.permanentDtcCodes,
        },
        vehicleYear: terminal.vehicleYear,
        vehicleMake: terminal.vehicleMake,
        vehicleModel: terminal.vehicleModel,
        scanDate: dtcEvent.reportedAt,
        status: 'RECEIVED',
        gpsDtcEventId: dtcEvent.id,
      },
    });
    scanId = scan.id;
  } catch (err) {
    if ((err as { code?: string })?.code === 'P2002') {
      const winner = await prisma.scan.findFirst({
        where: { gpsDtcEventId: dtcEvent.id },
        select: { id: true },
      });
      if (winner) {
        logger.info('DTC→Scan bridge: scan already exists (P2002 race winner)', {
          dtcEventId: dtcEvent.id,
          existingScanId: winner.id,
        });
        return winner.id;
      }
    }
    logger.error('DTC→Scan bridge: failed to create Scan row', {
      dtcEventId: dtcEvent.id,
      err: (err as Error).message,
    });
    return null;
  }

  void emitNotify({
    type: 'dtc.detected',
    terminalId: terminal.id,
    ownerUserId: terminal.ownerUserId,
    dtcEventId: dtcEvent.id,
    dtcCount: allCodes.length,
    vin,
    at: dtcEvent.reportedAt.toISOString(),
  });

  // Kick off the AI / PDF / email pipeline. This already swallows its own
  // errors and updates the Scan row to FAILED state if anything blows up.
  void processScanInBackground(scanId, owner.id, owner.email).catch((err) => {
    logger.error('DTC→Scan bridge: processScanInBackground rejected', {
      scanId,
      dtcEventId: dtcEvent.id,
      err: (err as Error).message,
    });
  });

  logger.info('DTC→Scan bridge: scan promoted, AI pipeline started', {
    scanId,
    dtcEventId: dtcEvent.id,
    terminalId: terminal.id,
    ownerUserId: owner.id,
    dtcCount: allCodes.length,
  });

  return scanId;
}
