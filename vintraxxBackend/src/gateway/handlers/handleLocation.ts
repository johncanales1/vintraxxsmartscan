/**
 * 0x0200 / 0x0704 — Location report handler.
 *
 * Steps (Phase 2):
 *   1. Reject if session isn't authenticated (defence-in-depth; dispatch.ts
 *      already enforces the auth gate, but a stray call here would be bad).
 *   2. Read the terminal once (we need ownerUserId + lastAlarmBits below).
 *   3. Insert one GpsLocation row per decoded entry. We use createMany() for
 *      0x0704 batch dumps so a 60-entry blind-area catch-up is one round-trip.
 *   4. Run alarm bit-diff against `lastAlarmBits` and the LATEST entry. For
 *      each newly-opened bit: open a GpsAlarm row + emit alarm.opened. For
 *      each newly-closed bit: close the open GpsAlarm + emit alarm.closed.
 *      CRITICAL alarms additionally trigger the alarm→appointment bridge.
 *   5. Update GpsTerminal: status ONLINE, lastHeartbeatAt now, lastAlarmBits
 *      set to the latest entry's bits.
 *   6. Ack with 0x8001 result=OK.
 *   7. Fire-and-forget pg_notify('gps_event', { type:'location.update', ... })
 *      with the LATEST entry only — older points in a back-fill batch don't
 *      need real-time fan-out.
 */

import prisma from '../../config/db';
import { Prisma, type GpsTerminal } from '@prisma/client';
import { MsgId } from '../codec/constants';
import { decode as decodeLocation, type DecodedLocation } from '../codec/messages/m0200-location';
import { decode as decodeBatch } from '../codec/messages/m0704-batch-location';
import { emit as emitNotify } from '../../realtime/notify';
import { diffAlarms } from '../services/alarm-diff';
import {
  maybeCreateAppointmentForAlarm,
  maybeSendCriticalAlarmPush,
} from '../../services/gps-alarm-bridge.service';
import {
  processTripForBatch,
  bumpOverspeedForOpenTrip,
  type TripLocationPoint,
} from '../../services/gps-trip.service';
import { ALARM_BITS } from '../codec/messages/m0200-location';
import type { Session } from '../session/Session';

export async function handleLocation(
  session: Session,
  body: Buffer,
  msgSerial: number,
  rawFrameSnippet: Buffer,
): Promise<void> {
  if (!session.terminalId) {
    session.log.warn('Location report from unbound session — should be impossible');
    return;
  }

  let decoded: DecodedLocation;
  try {
    decoded = decodeLocation(body);
  } catch (err) {
    session.log.warn('Failed to decode 0x0200', { err: (err as Error).message });
    session.ack(MsgId.LOCATION_REPORT, msgSerial, 1 /* failure */);
    return;
  }

  const terminal = await prisma.gpsTerminal.findUnique({
    where: { id: session.terminalId },
  });
  if (!terminal) {
    session.log.warn('Terminal vanished mid-session');
    session.ack(MsgId.LOCATION_REPORT, msgSerial, 1);
    return;
  }

  // CRITICAL #5: a REVOKED terminal must not keep persisting telemetry —
  // including the GpsTerminal.status=ONLINE update at the end of this
  // handler, which would silently un-revoke the row. Drop the packet and
  // close the socket; the device retries via register/auth where REVOKED
  // is properly rejected.
  if (terminal.status === 'REVOKED') {
    session.log.warn('Location report from REVOKED terminal — closing', {
      terminalId: terminal.id,
    });
    session.ack(MsgId.LOCATION_REPORT, msgSerial, 1);
    session.close('terminal revoked mid-session');
    return;
  }

  await persistLocations(session.terminalId, [decoded], rawFrameSnippet);

  const alarmTransitions = await processAlarmTransitions(terminal, decoded);
  await processTrips(terminal, [decoded], alarmTransitions.openedOverspeed);

  await prisma.gpsTerminal.update({
    where: { id: session.terminalId },
    data: {
      status: 'ONLINE',
      lastHeartbeatAt: new Date(),
      lastAlarmBits: BigInt(decoded.alarmBits >>> 0),
    },
  });

  session.ack(MsgId.LOCATION_REPORT, msgSerial);

  void emitNotify({
    type: 'location.update',
    terminalId: session.terminalId,
    ownerUserId: terminal.ownerUserId,
    data: {
      reportedAt: decoded.reportedAt.toISOString(),
      latitude: decoded.latitude,
      longitude: decoded.longitude,
      speedKmh: decoded.speedKmh,
      heading: decoded.heading,
      altitudeM: decoded.altitudeM,
      accOn: decoded.accOn,
      gpsFix: decoded.gpsFix,
      alarmBits: decoded.alarmBits,
      statusBits: decoded.statusBits,
    },
  });
}

export async function handleBatchLocation(
  session: Session,
  body: Buffer,
  msgSerial: number,
): Promise<void> {
  if (!session.terminalId) return;

  let batch: ReturnType<typeof decodeBatch>;
  try {
    batch = decodeBatch(body);
  } catch (err) {
    session.log.warn('Failed to decode 0x0704', { err: (err as Error).message });
    session.ack(MsgId.BATCH_LOCATION_REPORT, msgSerial, 1);
    return;
  }

  if (batch.entries.length === 0) {
    session.ack(MsgId.BATCH_LOCATION_REPORT, msgSerial);
    return;
  }

  const terminal = await prisma.gpsTerminal.findUnique({
    where: { id: session.terminalId },
  });
  if (!terminal) {
    session.log.warn('Terminal vanished mid-session');
    session.ack(MsgId.BATCH_LOCATION_REPORT, msgSerial, 1);
    return;
  }

  // CRITICAL #5: same REVOKED gate as the single-report path — refuse to
  // persist (and refuse to flip status back to ONLINE) for a revoked
  // terminal, then close.
  if (terminal.status === 'REVOKED') {
    session.log.warn('Batch location from REVOKED terminal — closing', {
      terminalId: terminal.id,
    });
    session.ack(MsgId.BATCH_LOCATION_REPORT, msgSerial, 1);
    session.close('terminal revoked mid-session');
    return;
  }

  await persistLocations(session.terminalId, batch.entries, body);

  // Sort entries chronologically before any per-pair derivations (trip
  // distance, harsh-event detection). Devices send oldest→newest most of
  // the time but we don't want to bet on it.
  const sortedAsc = [...batch.entries].sort(
    (a, b) => a.reportedAt.getTime() - b.reportedAt.getTime(),
  );
  const latest = sortedAsc[sortedAsc.length - 1];

  // Diff alarm bits only against the LATEST entry — back-fill batches must
  // not generate a flap of open/close events for transient states the
  // device already resolved before the network came back.
  const alarmTransitions = await processAlarmTransitions(terminal, latest);
  await processTrips(terminal, sortedAsc, alarmTransitions.openedOverspeed);

  await prisma.gpsTerminal.update({
    where: { id: session.terminalId },
    data: {
      status: 'ONLINE',
      lastHeartbeatAt: new Date(),
      lastAlarmBits: BigInt(latest.alarmBits >>> 0),
    },
  });

  session.ack(MsgId.BATCH_LOCATION_REPORT, msgSerial);

  void emitNotify({
    type: 'location.update',
    terminalId: session.terminalId,
    ownerUserId: terminal.ownerUserId,
    data: {
      reportedAt: latest.reportedAt.toISOString(),
      latitude: latest.latitude,
      longitude: latest.longitude,
      speedKmh: latest.speedKmh,
      heading: latest.heading,
      altitudeM: latest.altitudeM,
      accOn: latest.accOn,
      gpsFix: latest.gpsFix,
      alarmBits: latest.alarmBits,
      statusBits: latest.statusBits,
    },
  });
}

/**
 * Diff the latest decoded alarm bits against the terminal's lastAlarmBits,
 * then create / close GpsAlarm rows accordingly. Each transition fires a
 * pg_notify event; CRITICAL alarms ALSO go through the alarm-bridge so a
 * draft ServiceAppointment lands in the dealer's queue immediately.
 *
 * A failure inside the bridge or notify step is logged but never thrown —
 * the upstream caller has already persisted the GpsLocation row, which is
 * the source of truth.
 */
interface AlarmTransitionsResult {
  /** True iff the OVERSPEED alarm bit went 0→1 in this report. */
  openedOverspeed: boolean;
}

async function processAlarmTransitions(
  terminal: GpsTerminal,
  decoded: DecodedLocation,
): Promise<AlarmTransitionsResult> {
  const { opened, closed } = diffAlarms(terminal.lastAlarmBits, decoded.alarmBits);
  const openedOverspeed = opened.some((d) => d.bit === ALARM_BITS.OVERSPEED);
  if (opened.length === 0 && closed.length === 0) return { openedOverspeed };

  const now = new Date();
  const latitude = new Prisma.Decimal(decoded.latitude.toFixed(7));
  const longitude = new Prisma.Decimal(decoded.longitude.toFixed(7));
  const speedKmh = new Prisma.Decimal(decoded.speedKmh.toFixed(1));

  for (const desc of opened) {
    try {
      const alarm = await prisma.gpsAlarm.create({
        data: {
          terminalId: terminal.id,
          ownerUserId: terminal.ownerUserId,
          type: desc.type,
          severity: desc.severity,
          openedAt: decoded.reportedAt,
          latitude,
          longitude,
          speedKmh,
          extraData: { sourceBit: desc.bit },
        },
      });

      void emitNotify({
        type: 'alarm.opened',
        terminalId: terminal.id,
        ownerUserId: terminal.ownerUserId,
        alarmId: alarm.id,
        alarmType: alarm.type,
        severity: alarm.severity,
        at: alarm.openedAt.toISOString(),
      });

      // CRITICAL alarms attempt to spin up a ServiceAppointment draft.
      // Errors there are swallowed inside the bridge.
      void maybeCreateAppointmentForAlarm({ alarm, terminal });
      // … and fan out a CRITICAL push to the owner's mobile devices.
      // Same swallow-all-errors contract; dedup via GpsAlarmPushDedup keeps
      // it exactly-once across multiple bridge invocations.
      void maybeSendCriticalAlarmPush({ alarm, terminal });
    } catch (err) {
      // A single failed write must not stop us processing the rest.
      // (Most realistic cause: DB connection blip.)
      // eslint-disable-next-line no-console
      console.warn('[handleLocation] failed to open alarm row', {
        bit: desc.bit,
        type: desc.type,
        err: (err as Error).message,
      });
    }
  }

  for (const desc of closed) {
    try {
      const result = await prisma.gpsAlarm.updateMany({
        where: {
          terminalId: terminal.id,
          type: desc.type,
          severity: desc.severity,
          closedAt: null,
        },
        data: { closedAt: now },
      });

      if (result.count > 0) {
        void emitNotify({
          type: 'alarm.closed',
          terminalId: terminal.id,
          ownerUserId: terminal.ownerUserId,
          // We don't know which row(s) was closed without an extra read; the
          // listener side just refetches by terminal+type to refresh the UI.
          alarmId: '',
          alarmType: desc.type,
          severity: desc.severity,
          at: now.toISOString(),
        });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[handleLocation] failed to close alarm row', {
        bit: desc.bit,
        type: desc.type,
        err: (err as Error).message,
      });
    }
  }

  return { openedOverspeed };
}

/**
 * Drive the GpsTrip state machine for a chronologically-sorted run of
 * decoded entries. We seed the trip processor with the most-recent prior
 * GpsLocation row so that the very FIRST entry in the run can compute
 * Δt-based aggregates (distance, harsh accel/brake) correctly.
 *
 * The seed query is a single indexed lookup (`@@index([terminalId,
 * reportedAt(sort: Desc)])`) and only runs once per packet — cheap.
 *
 * If `openedOverspeed` is true, we also bump the per-trip overspeed counter
 * for whatever trip is currently OPEN — this is the trip module's only
 * dependency on alarm-bit semantics.
 */
async function processTrips(
  terminal: GpsTerminal,
  entriesAsc: DecodedLocation[],
  openedOverspeed: boolean,
): Promise<void> {
  if (entriesAsc.length === 0) return;

  const earliest = entriesAsc[0].reportedAt;
  const seed = await prisma.gpsLocation.findFirst({
    where: { terminalId: terminal.id, reportedAt: { lt: earliest } },
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

  const points: TripLocationPoint[] = entriesAsc.map((e) => ({
    reportedAt: e.reportedAt,
    latitude: e.latitude,
    longitude: e.longitude,
    speedKmh: e.speedKmh,
    heading: e.heading,
    accOn: e.accOn,
  }));

  const seedPoint: TripLocationPoint | null = seed
    ? {
        reportedAt: seed.reportedAt,
        latitude: Number(seed.latitude),
        longitude: Number(seed.longitude),
        speedKmh: Number(seed.speedKmh ?? 0),
        heading: seed.heading ?? 0,
        accOn: seed.accOn,
      }
    : null;

  await processTripForBatch(terminal, points, seedPoint);

  if (openedOverspeed) {
    await bumpOverspeedForOpenTrip(terminal.id);
  }
}

/**
 * Bulk persist. Uses Prisma createMany so a 0x0704 batch is one round-trip;
 * we lose the individual generated IDs but those aren't needed for the
 * real-time path (alarm linkage in Phase 2 will require a different write
 * shape and is the only consumer of the IDs).
 */
async function persistLocations(
  terminalId: string,
  entries: DecodedLocation[],
  rawPayloadHint: Buffer,
): Promise<void> {
  const data = entries.map((e) => ({
    terminalId,
    alarmBits: BigInt(e.alarmBits >>> 0),
    statusBits: BigInt(e.statusBits >>> 0),
    latitude: new Prisma.Decimal(e.latitude.toFixed(7)),
    longitude: new Prisma.Decimal(e.longitude.toFixed(7)),
    altitudeM: e.altitudeM,
    speedKmh: new Prisma.Decimal(e.speedKmh.toFixed(1)),
    heading: e.heading,
    reportedAt: e.reportedAt,
    accOn: e.accOn,
    gpsFix: e.gpsFix,
    satelliteCount: e.additional.satelliteCount ?? null,
    signalStrength: e.additional.signalStrength ?? null,
    odometerKm:
      e.additional.mileageKm !== undefined
        ? new Prisma.Decimal(e.additional.mileageKm.toFixed(1))
        : null,
    fuelLevelPct:
      e.additional.fuelLevelL !== undefined
        ? new Prisma.Decimal(e.additional.fuelLevelL.toFixed(1))
        : null,
    // We only attach the raw frame to the FIRST decoded entry — the buffer is
    // the wire bytes for the whole message, not per entry. Storing it once
    // for forensic replay is enough.
    rawPayload: entries.length === 1 ? rawPayloadHint : null,
  }));

  await prisma.gpsLocation.createMany({ data });
}
