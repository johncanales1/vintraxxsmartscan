/**
 * 0x0900 — Pass-through (transparent transmission) handler.
 *
 * Multiplexes on the 1-byte subtype. Each branch is independent:
 *
 *   0xF2  OBD live   → GpsObdSnapshot row
 *   0xF4  DTC report → GpsDtcEvent row + DTC→Scan bridge (AI pipeline)
 *   0xF5  VIN        → set GpsTerminal.vehicleVin
 *   0xF6  Clear ack  → log + emit (Phase 4 will resolve a pending GpsCommand)
 *   0xF7  Status     → GpsObdSnapshot row (subset of fields F2 covers)
 *
 * Persistence failures are logged. The platform ACK (0x8001) is always
 * emitted with result=OK as long as we can decode the wrapper byte; a
 * stuck NACK loop is worse than a one-off lost record.
 */

import prisma from '../../config/db';
import { Prisma, type GpsTerminal } from '@prisma/client';
import { MsgId } from '../codec/constants';
import {
  decode as decodePassThrough,
  PassThroughSubtype,
  type DecodedDtc,
  type DecodedObdLive,
  type DecodedTripSummary,
  type DecodedVehicleStatus,
  type DecodedVin,
  type DecodedDtcClearAck,
} from '../codec/messages/m0900-pass-through';
import { promoteDtcEventToScan } from '../../services/gps-dtc-bridge.service';
import {
  closeWithVendorSummary,
  type TripLocationPoint,
} from '../../services/gps-trip.service';
import * as commandService from '../../services/gps-command.service';
import { emit as emitNotify } from '../../realtime/notify';
import type { Session } from '../session/Session';

export async function handlePassThrough(
  session: Session,
  body: Buffer,
  msgSerial: number,
): Promise<void> {
  if (!session.terminalId) {
    session.log.warn('Pass-through from unbound session — should be impossible');
    return;
  }

  let decoded: ReturnType<typeof decodePassThrough>;
  try {
    decoded = decodePassThrough(body);
  } catch (err) {
    session.log.warn('Failed to decode 0x0900 wrapper', {
      err: (err as Error).message,
    });
    session.ack(MsgId.DATA_UPLINK, msgSerial, 1);
    return;
  }

  const terminal = await prisma.gpsTerminal.findUnique({
    where: { id: session.terminalId },
  });
  if (!terminal) {
    session.log.warn('Terminal vanished mid-session');
    session.ack(MsgId.DATA_UPLINK, msgSerial, 1);
    return;
  }

  // CRITICAL #5: do not silently un-revoke. If admin revoked the terminal
  // while this socket was still authenticated, refuse and tear down. The
  // device's next reconnect will fail register/auth.
  if (terminal.status === 'REVOKED') {
    session.log.warn('Pass-through from REVOKED terminal — closing', {
      terminalId: terminal.id,
    });
    session.ack(MsgId.DATA_UPLINK, msgSerial, 1);
    session.close('terminal revoked mid-session');
    return;
  }

  // Bump heartbeat — pass-through messages count as activity.
  await prisma.gpsTerminal.update({
    where: { id: terminal.id },
    data: { lastHeartbeatAt: new Date(), status: 'ONLINE' },
  });

  switch (decoded.subtype) {
    case PassThroughSubtype.TRIP_SUMMARY:
      await handleTripSummary(terminal, decoded.parsed as DecodedTripSummary | null, session);
      break;
    case PassThroughSubtype.OBD_LIVE:
      await handleObdLive(terminal, decoded.parsed as DecodedObdLive | null, session);
      break;
    case PassThroughSubtype.DTC:
      await handleDtcReport(terminal, decoded.parsed as DecodedDtc | null, session);
      break;
    case PassThroughSubtype.VIN:
      await handleVinReport(terminal, decoded.parsed as DecodedVin | null, session);
      break;
    case PassThroughSubtype.DTC_CLEAR_ACK:
      await handleDtcClearAck(terminal, decoded.parsed as DecodedDtcClearAck | null, session);
      break;
    case PassThroughSubtype.VEHICLE_STATUS:
      await handleVehicleStatus(
        terminal,
        decoded.parsed as DecodedVehicleStatus | null,
        session,
      );
      break;
    default:
      session.log.info('Pass-through subtype not implemented', {
        subtype: `0x${decoded.subtype.toString(16).padStart(2, '0')}`,
        bodyLen: body.length,
      });
  }

  session.ack(MsgId.DATA_UPLINK, msgSerial);
}

// ── 0xF1 — Trip Summary (vendor end-of-trip aggregates) ─────────────────────

/**
 * The device reports its own authoritative trip summary at end-of-trip. We
 * close any OPEN GpsTrip for this terminal using the vendor-supplied numbers
 * (which override our derived speed-delta math). The end-point coords come
 * from the most-recent GpsLocation row — devices send 0xF1 within the same
 * TCP session as the last 0x0200, so a fresh row is essentially guaranteed.
 *
 * If no OPEN trip exists, we log and drop — happens if the device crashes
 * mid-trip and reboots into a fresh session.
 */
async function handleTripSummary(
  terminal: GpsTerminal,
  parsed: DecodedTripSummary | null,
  session: Session,
): Promise<void> {
  if (!parsed) {
    session.log.warn('0x0900/0xF1 decoded as null payload', { terminalId: terminal.id });
    return;
  }

  const lastLoc = await prisma.gpsLocation.findFirst({
    where: { terminalId: terminal.id },
    orderBy: { reportedAt: 'desc' },
    select: {
      reportedAt: true,
      latitude: true,
      longitude: true,
      speedKmh: true,
      heading: true,
      accOn: true,
    },
  });

  const endPoint: TripLocationPoint = {
    reportedAt: lastLoc?.reportedAt ?? new Date(),
    latitude: lastLoc ? Number(lastLoc.latitude) : 0,
    longitude: lastLoc ? Number(lastLoc.longitude) : 0,
    speedKmh: lastLoc ? Number(lastLoc.speedKmh ?? 0) : 0,
    heading: lastLoc?.heading ?? 0,
    accOn: lastLoc?.accOn ?? null,
  };

  try {
    const closed = await closeWithVendorSummary(terminal.id, endPoint, parsed);
    if (!closed) {
      session.log.info('0xF1 received but no OPEN trip to close', {
        terminalId: terminal.id,
      });
    }
  } catch (err) {
    session.log.warn('Failed to apply vendor trip summary', {
      err: (err as Error).message,
    });
  }
}

// ── 0xF2 — OBD Live ──────────────────────────────────────────────────────────

async function handleObdLive(
  terminal: GpsTerminal,
  parsed: DecodedObdLive | null,
  session: Session,
): Promise<void> {
  if (!parsed) {
    session.log.warn('0x0900/0xF2 decoded as null payload', { terminalId: terminal.id });
    return;
  }
  const reportedAt = new Date();
  try {
    await prisma.gpsObdSnapshot.create({
      data: {
        terminalId: terminal.id,
        reportedAt,
        vin: terminal.vehicleVin,
        rpm: parsed.rpm,
        vehicleSpeedKmh:
          parsed.vehicleSpeedKmh !== undefined
            ? new Prisma.Decimal(parsed.vehicleSpeedKmh.toFixed(1))
            : null,
        coolantTempC: parsed.coolantTempC,
        intakeAirTempC: parsed.intakeAirTempC,
        throttlePct:
          parsed.throttlePct !== undefined
            ? new Prisma.Decimal(parsed.throttlePct.toFixed(1))
            : null,
        engineLoadPct:
          parsed.engineLoadPct !== undefined
            ? new Prisma.Decimal(parsed.engineLoadPct.toFixed(1))
            : null,
        fuelPressureKpa: parsed.fuelPressureKpa,
        fuelRateLph:
          parsed.fuelRateLph !== undefined
            ? new Prisma.Decimal(parsed.fuelRateLph.toFixed(2))
            : null,
        batteryVoltageMv: parsed.batteryVoltageMv,
        mafGps:
          parsed.mafGps !== undefined ? new Prisma.Decimal(parsed.mafGps.toFixed(2)) : null,
        o2Voltage:
          parsed.o2Voltage !== undefined
            ? new Prisma.Decimal(parsed.o2Voltage.toFixed(3))
            : null,
        enginePowerKw:
          parsed.enginePowerKw !== undefined
            ? new Prisma.Decimal(parsed.enginePowerKw.toFixed(1))
            : null,
        extraPidsJson:
          Object.keys(parsed.extraPids).length > 0 ? parsed.extraPids : undefined,
      },
    });
  } catch (err) {
    session.log.warn('Failed to persist GpsObdSnapshot from 0xF2', {
      err: (err as Error).message,
    });
  }
}

// ── 0xF4 — DTC Report ────────────────────────────────────────────────────────

async function handleDtcReport(
  terminal: GpsTerminal,
  parsed: DecodedDtc | null,
  session: Session,
): Promise<void> {
  if (!parsed) {
    session.log.warn('0x0900/0xF4 decoded as null payload', { terminalId: terminal.id });
    return;
  }
  const reportedAt = new Date();
  const allCodes = [
    ...parsed.storedDtcCodes,
    ...parsed.pendingDtcCodes,
    ...parsed.permanentDtcCodes,
  ];

  try {
    const dtcEvent = await prisma.gpsDtcEvent.create({
      data: {
        terminalId: terminal.id,
        ownerUserId: terminal.ownerUserId,
        vin: terminal.vehicleVin,
        milOn: parsed.milOn,
        dtcCount: allCodes.length,
        storedDtcCodes: parsed.storedDtcCodes,
        pendingDtcCodes: parsed.pendingDtcCodes,
        permanentDtcCodes: parsed.permanentDtcCodes,
        protocol: 'OBD-II',
        reportedAt,
      },
    });

    // Promote to a Scan + AI report. Bridge is fully fault-tolerant — its
    // failures are already logged inside the service.
    void promoteDtcEventToScan({ dtcEvent, terminal });

    // The bridge emits its own `dtc.detected` notify. We don't double-fire.
  } catch (err) {
    session.log.error('Failed to persist GpsDtcEvent from 0xF4', {
      err: (err as Error).message,
    });
  }
}

// ── 0xF5 — VIN Report ────────────────────────────────────────────────────────

async function handleVinReport(
  terminal: GpsTerminal,
  parsed: DecodedVin | null,
  session: Session,
): Promise<void> {
  if (!parsed?.vin) {
    session.log.info('0x0900/0xF5 had no usable VIN', { terminalId: terminal.id });
    return;
  }
  if (terminal.vehicleVin === parsed.vin) {
    return; // already known, no-op
  }
  try {
    await prisma.gpsTerminal.update({
      where: { id: terminal.id },
      data: { vehicleVin: parsed.vin },
    });
    session.log.info('Updated terminal VIN from 0xF5', {
      terminalId: terminal.id,
      vin: parsed.vin,
    });
  } catch (err) {
    session.log.warn('Failed to update terminal VIN from 0xF5', {
      err: (err as Error).message,
    });
  }
}

// ── 0xF6 — DTC Clear Ack ────────────────────────────────────────────────────

async function handleDtcClearAck(
  terminal: GpsTerminal,
  parsed: DecodedDtcClearAck | null,
  session: Session,
): Promise<void> {
  if (!parsed) return;
  session.log.info('Received DTC clear ack (0xF6)', {
    terminalId: terminal.id,
    status: parsed.status,
    rawStatus: parsed.rawStatus,
  });

  // Find the most-recent SENT 0x8900 (DATA_PASSTHROUGH_DOWN) command for
  // this terminal and mark it ACKED with the rich vendor status. Devices
  // typically also fire a 0x0001 carrying the generic OK/FAIL — that may
  // have already moved the row to ACKED, in which case markAcked is a
  // no-op (status guard). Either way the audit trail is complete.
  const recent = await prisma.gpsCommand.findFirst({
    where: {
      terminalId: terminal.id,
      functionCode: MsgId.DATA_PASSTHROUGH_DOWN,
      status: 'SENT',
    },
    orderBy: { sentAt: 'desc' },
    select: { id: true },
  });
  if (recent) {
    const result = parsed.status === 'success' ? 0 : 1;
    await commandService.markAcked({
      commandId: recent.id,
      result,
      response: { status: parsed.status, rawStatus: parsed.rawStatus },
    });
  }

  void emitNotify({
    type: 'dtc.detected', // reuse channel; UI shows banner cleared
    terminalId: terminal.id,
    ownerUserId: terminal.ownerUserId,
    dtcEventId: '',
    dtcCount: 0,
    vin: terminal.vehicleVin ?? null,
    at: new Date().toISOString(),
  });
}

// ── 0xF7 — Vehicle Status ───────────────────────────────────────────────────

async function handleVehicleStatus(
  terminal: GpsTerminal,
  parsed: DecodedVehicleStatus | null,
  session: Session,
): Promise<void> {
  if (!parsed) return;
  const reportedAt = new Date();
  try {
    await prisma.gpsObdSnapshot.create({
      data: {
        terminalId: terminal.id,
        reportedAt,
        vin: terminal.vehicleVin,
        rpm: parsed.rpm,
        vehicleSpeedKmh:
          parsed.vehicleSpeedKmh !== undefined
            ? new Prisma.Decimal(parsed.vehicleSpeedKmh.toFixed(1))
            : null,
        coolantTempC: parsed.coolantTempC,
        batteryVoltageMv: parsed.batteryVoltageMv,
        // Fuel level and door mask aren't first-class columns on the snapshot
        // table — stash in extraPidsJson under namespaced keys.
        extraPidsJson: {
          ...(parsed.fuelLevelL !== undefined ? { fuelLevelL: parsed.fuelLevelL } : {}),
          ...(parsed.doorsOpenMask !== undefined
            ? { doorsOpenMask: parsed.doorsOpenMask }
            : {}),
          ...(parsed.accOn !== undefined ? { accOn: parsed.accOn } : {}),
        },
      },
    });
  } catch (err) {
    session.log.warn('Failed to persist GpsObdSnapshot from 0xF7', {
      err: (err as Error).message,
    });
  }
}
