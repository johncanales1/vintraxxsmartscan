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
 *   4. If a PENDING GpsScanReport exists for this terminal, backfill VIN/mileage.
 */

import prisma from '../../config/db';
import { Prisma } from '@prisma/client';
import type { Session } from '../session/Session';
import type { DecodedVersionInfo } from '../codec/messages/m0205-version-info';
import { encodeResponse } from '../codec/messages/m0205-version-info';

const VERSION_INFO_RESPONSE = 0x8205;
const RECENT_SCAN_BACKFILL_MS = 2 * 60 * 1000;

function normalizeVin(value?: string | null): string | undefined {
  const vin = value?.trim().toUpperCase();
  if (!vin) return undefined;
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return undefined;
  return vin;
}

function normalizeImei(value?: string | null): string | undefined {
  const imei = value?.replace(/\D/g, '');
  if (!imei || imei.length < 14 || imei.length > 17) return undefined;
  return imei;
}

function positiveNumber(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export async function handleVersionInfo(
  session: Session,
  decoded: DecodedVersionInfo,
  msgSerial: number,
): Promise<void> {
  const vin = normalizeVin(decoded.vin);
  const imei = normalizeImei(decoded.imei);
  const softwareVersion = decoded.softwareVersion?.trim() || undefined;
  const totalMileageKm = positiveNumber(decoded.totalMileageKm);

  session.log.info('Received 0x0205 version info', {
    msgSerial,
    softwareVersion: softwareVersion ?? '(none)',
    vin: vin ?? '(none)',
    rawVin: decoded.vin ?? null,
    imei: imei ?? '(none)',
    rawImei: decoded.imei ?? null,
    totalMileageKm: totalMileageKm ?? null,
    totalFuelL: decoded.totalFuelL ?? null,
  });

  try {
    session.writeFrame({
      msgId: VERSION_INFO_RESPONSE,
      body: encodeResponse(),
    });
  } catch (err) {
    session.log.warn('Failed to send 0x8205 version info response', {
      msgSerial,
      err: (err as Error).message,
    });
  }

  if (!session.terminalId) return;

  const terminalUpdate: Prisma.GpsTerminalUpdateInput = {};
  if (vin) terminalUpdate.vehicleVin = vin;
  if (imei) terminalUpdate.imei = imei;
  if (softwareVersion) terminalUpdate.firmwareVersion = softwareVersion;

  if (Object.keys(terminalUpdate).length > 0) {
    await prisma.gpsTerminal.update({
      where: { id: session.terminalId },
      data: terminalUpdate,
    }).catch((err) => {
      session.log.warn('Failed to update terminal from 0x0205', {
        terminalId: session.terminalId,
        err: (err as Error).message,
      });
    });
  }

  const scanUpdate: Prisma.GpsScanReportUpdateManyMutationInput = {};
  if (vin) scanUpdate.vin = vin;
  if (totalMileageKm !== undefined) {
    scanUpdate.mileageKm = new Prisma.Decimal(totalMileageKm.toFixed(1));
  }

  if (Object.keys(scanUpdate).length === 0) return;

  await prisma.gpsScanReport.updateMany({
    where: {
      terminalId: session.terminalId,
      OR: [
        { status: 'PENDING' },
        {
          completedAt: {
            gte: new Date(Date.now() - RECENT_SCAN_BACKFILL_MS),
          },
          OR: [{ vin: null }, { mileageKm: null }],
        },
      ],
    },
    data: scanUpdate,
  }).catch((err) => {
    session.log.warn('Failed to backfill scan report from 0x0205', {
      terminalId: session.terminalId,
      err: (err as Error).message,
    });
  });
}
