/**
 * 0x0900 — Pass-through (transparent transmission) handler.
 *
 * Multiplexes on the 1-byte subtype per the JT/T 808 / D450 spec at
 * `docs/GPS_OBD_SCANNER.md` §3.67-§3.74. Each branch is independent:
 *
 *   0xF1  Trip summary   → close OPEN GpsTrip with vendor aggregates
 *   0xF2  FAULT CODE     → GpsDtcEvent row (only when count > 0)
 *                          + resolves any pending GpsScanReport for the
 *                          terminal so the Refresh UI sees the result
 *   0xF3  Sleep entry    → log + mark terminal idle
 *   0xF4  Sleep wake     → log + treat as activity
 *   0xF6  Upgrade status → log + mark the pending upgrade command
 *   0xF7  Collision      → stash for the alarm pipeline (Phase 2)
 *
 * Live OBD telemetry (RPM, coolant, fuel level, etc.) is NOT carried in
 * 0x0900 — the D450 reports it through 0x0200 extended TLVs under container
 * IDs 0xEA/0xEB. See `m0200-location.ts` for the decoder.
 *
 * Persistence failures are logged. The platform ACK (0x8001) is always
 * emitted with result=OK as long as we can decode the wrapper byte; a
 * stuck NACK loop is worse than a one-off lost record.
 */

import prisma from '../../config/db';
import type { GpsTerminal } from '@prisma/client';
import { MsgId } from '../codec/constants';
import {
  decode as decodePassThrough,
  PassThroughSubtype,
  type DecodedDtc,
  type DecodedTripSummary,
  type DecodedSleepEntry,
  type DecodedSleepWake,
  type DecodedUpgradeStatus,
  type DecodedCollision,
} from '../codec/messages/m0900-pass-through';
import { onDtcArrived as scanOrchestratorOnDtc } from '../../services/gps-scan-report.service';
import {
  closeWithVendorSummary,
  type TripLocationPoint,
} from '../../services/gps-trip.service';
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
    case PassThroughSubtype.DTC:
      await handleDtcReport(terminal, decoded.parsed as DecodedDtc | null, session);
      break;
    case PassThroughSubtype.SLEEP_ENTRY:
      handleSleepEntry(terminal, decoded.parsed as DecodedSleepEntry | null, session);
      break;
    case PassThroughSubtype.SLEEP_WAKE:
      handleSleepWake(terminal, decoded.parsed as DecodedSleepWake | null, session);
      break;
    case PassThroughSubtype.UPGRADE_STATUS:
      handleUpgradeStatus(terminal, decoded.parsed as DecodedUpgradeStatus | null, session);
      break;
    case PassThroughSubtype.COLLISION:
      handleCollision(terminal, decoded.parsed as DecodedCollision | null, session);
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

// ── 0xF2 — DTC Report (spec §3.69 Fault Code Data Packet) ─────────────────────

async function handleDtcReport(
  terminal: GpsTerminal,
  parsed: DecodedDtc | null,
  session: Session,
): Promise<void> {
  if (!parsed) {
    session.log.warn('0x0900/0xF2 decoded as null payload', { terminalId: terminal.id });
    return;
  }

  const allCodes = [
    ...parsed.storedDtcCodes,
    ...parsed.pendingDtcCodes,
    ...parsed.permanentDtcCodes,
  ];

  // Always tell the scan orchestrator so a pending Refresh request resolves
  // even when the car is healthy (DTC count = 0). Pass through the actual
  // counts — the orchestrator wraps them into the GpsScanReport.
  void scanOrchestratorOnDtc(terminal.id, parsed);

  // We deliberately do NOT persist a GpsDtcEvent for healthy reports. The
  // dashboard's DTC feed only shows real faults; an empty F2 is purely a
  // "I checked, nothing's wrong" handshake and would otherwise spam the
  // feed with empty rows on every Refresh.
  if (allCodes.length === 0) {
    session.log.info('0x0900/0xF2 reports no fault codes', { terminalId: terminal.id });
    return;
  }

  try {
    await prisma.gpsDtcEvent.create({
      data: {
        terminalId: terminal.id,
        ownerUserId: terminal.ownerUserId,
        vin: terminal.vehicleVin,
        milOn: parsed.milOn,
        dtcCount: allCodes.length,
        storedDtcCodes: parsed.storedDtcCodes,
        pendingDtcCodes: parsed.pendingDtcCodes,
        permanentDtcCodes: parsed.permanentDtcCodes,
        protocol: parsed.protocol ?? 'OBD-II',
        latitude:
          Number.isFinite(parsed.latitude) && parsed.latitude !== 0
            ? parsed.latitude.toFixed(7)
            : null,
        longitude:
          Number.isFinite(parsed.longitude) && parsed.longitude !== 0
            ? parsed.longitude.toFixed(7)
            : null,
        reportedAt: parsed.reportedAt,
      },
    });

    // No automatic AI promotion. The Full Scan Report page is the single
    // entry-point into the AI pipeline for GPS-sourced data — users opt in
    // explicitly via "Generate AI Report". This avoids burning AI tokens on
    // background reports the user may never look at, and keeps a clear 1:1
    // mapping between a user action and an AI invocation.
  } catch (err) {
    session.log.error('Failed to persist GpsDtcEvent from 0xF2', {
      err: (err as Error).message,
    });
  }
}

// ── 0xF3 — Sleep Entry ──────────────────────────────────────────────────────

function handleSleepEntry(
  terminal: GpsTerminal,
  parsed: DecodedSleepEntry | null,
  session: Session,
): void {
  session.log.info('Device entered sleep mode (0xF3)', {
    terminalId: terminal.id,
    reportedAt: parsed?.reportedAt?.toISOString() ?? null,
  });
}

// ── 0xF4 — Sleep Wake ─────────────────────────────────────────────────────────

function handleSleepWake(
  terminal: GpsTerminal,
  parsed: DecodedSleepWake | null,
  session: Session,
): void {
  session.log.info('Device woke from sleep (0xF4)', {
    terminalId: terminal.id,
    reportedAt: parsed?.reportedAt?.toISOString() ?? null,
    wakeType: parsed?.wakeType ?? null,
  });
}

// ── 0xF6 — MCU upgrade status ─────────────────────────────────────────────────

function handleUpgradeStatus(
  terminal: GpsTerminal,
  parsed: DecodedUpgradeStatus | null,
  session: Session,
): void {
  session.log.info('MCU upgrade status (0xF6)', {
    terminalId: terminal.id,
    status: parsed?.status ?? 'unknown',
    rawStatus: parsed?.rawStatus ?? null,
  });
}

// ── 0xF7 — Suspected collision alarm ─────────────────────────────────────────

function handleCollision(
  terminal: GpsTerminal,
  parsed: DecodedCollision | null,
  session: Session,
): void {
  if (!parsed) return;
  session.log.warn('Suspected collision (0xF7)', {
    terminalId: terminal.id,
    level: parsed.level,
    latitude: parsed.latitude,
    longitude: parsed.longitude,
    reportedAt: parsed.reportedAt.toISOString(),
  });
  // Phase 2 alarm pipeline takes over from here; for now we surface the
  // event on the real-time bus so dashboards can flash.
  void emitNotify({
    type: 'alarm.opened',
    terminalId: terminal.id,
    ownerUserId: terminal.ownerUserId,
    alarmId: '',
    alarmType: 'COLLISION_WARNING',
    severity: parsed.level >= 2 ? 'CRITICAL' : 'WARNING',
    at: parsed.reportedAt.toISOString(),
  });
}
