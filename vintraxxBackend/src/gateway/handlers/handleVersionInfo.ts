/**
 * 0x0205 — Proactive Version Information handler.
 *
 * The device sends this shortly after authentication. The payload contains
 * firmware version, IMEI, VIN, total mileage, and total fuel consumption.
 *
 * We:
 *   1. Decode the body.
 *   2. Persist VIN + mileage onto the GpsTerminal row (backfill).
 *   3. Reply with 0x8205 (NOT the generic 0x8001).
 *   4. If a PENDING GpsScanReport exists for this terminal, backfill VIN.
 */

import prisma from '../../config/db';
import type { Session } from '../session/Session';
import type { DecodedVersionInfo } from '../codec/messages/m0205-version-info';
import { encodeResponse } from '../codec/messages/m0205-version-info';

const VERSION_INFO_RESPONSE = 0x8205;

export async function handleVersionInfo(
  session: Session,
  decoded: DecodedVersionInfo,
  msgSerial: number,
): Promise<void> {
  session.log.info('Received 0x0205 version info', {
    softwareVersion: decoded.softwareVersion,
    vin: decoded.vin ?? '(none)',
    imei: decoded.imei,
    totalMileageKm: decoded.totalMileageKm,
    totalFuelL: decoded.totalFuelL,
  });

  // Reply with 0x8205 (version info response) — NOT generic 0x8001.
  session.writeFrame({
    msgId: VERSION_INFO_RESPONSE,
    body: encodeResponse(),
  });

  if (!session.terminalId) return;

  // Backfill VIN + metadata onto the terminal row.
  const update: Record<string, unknown> = {};
  if (decoded.vin) update.vehicleVin = decoded.vin;
  if (decoded.imei && decoded.imei.length >= 14) update.imei = decoded.imei;
  if (decoded.softwareVersion) update.firmwareVersion = decoded.softwareVersion;

  if (Object.keys(update).length > 0) {
    await prisma.gpsTerminal.update({
      where: { id: session.terminalId },
      data: update,
    }).catch((err) => {
      session.log.warn('Failed to update terminal from 0x0205', {
        err: (err as Error).message,
      });
    });
  }

  // If a scan report is PENDING, backfill VIN there too.
  if (decoded.vin) {
    await prisma.gpsScanReport.updateMany({
      where: {
        terminalId: session.terminalId,
        status: 'PENDING',
        vin: null,
      },
      data: { vin: decoded.vin },
    }).catch(() => { /* best-effort */ });
  }
}
