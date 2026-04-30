/**
 * gps-trip.service — manages the GpsTrip lifecycle and per-trip rollups.
 *
 * Driver model (matches GpsTrip schema):
 *   • OPEN trip is created when ACC goes 0→1 (or, for ACC-less firmwares,
 *     when speed goes from 0 to >5 km/h with no open trip).
 *   • Each subsequent location while the trip is OPEN updates the running
 *     aggregates: distanceKm (Haversine), maxSpeedKmh, idleDurationSec,
 *     durationSec.
 *   • Harsh-driving events are DERIVED here from consecutive locations:
 *     accel/brake by Δspeed/Δt; turn by Δheading/Δt at non-trivial speed.
 *     The standard JT/T 808 alarm flag-set has no canonical bits for these,
 *     so we don't pretend the device reported them. If the firmware sends a
 *     vendor `0x0900/0xF1` trip-summary at end-of-trip with its own counters,
 *     `closeWithVendorSummary` overrides our derived numbers (the device's
 *     accelerometer is more accurate than speed-delta math).
 *   • CLOSED is set when ACC goes 1→0 OR by the idle-trip-closer cron when
 *     a trip has been silent + speed=0 for >IDLE_CLOSE_MS.
 *
 * The service is the SINGLE place that mutates GpsTrip rows. handleLocation
 * and handlePassThrough call into it; the cron calls closeIdleTrips().
 */

import prisma from '../config/db';
import { Prisma, type GpsTrip, type GpsTerminal } from '@prisma/client';
import logger from '../utils/logger';
import { emit as emitNotify } from '../realtime/notify';

// ── Tunables ────────────────────────────────────────────────────────────────

/**
 * Speed (km/h) above which a vehicle counts as "moving" for ACC-less trip
 * auto-open. Set above typical urban GPS noise floor.
 */
const MOVING_SPEED_THRESHOLD_KMH = 5;

/**
 * If a trip has had no fix for this long, the cron auto-closes it. 6 minutes
 * is a balance between "cellular tower hand-off pause" (~1-2 min) and "user
 * drove into a tunnel and parked" (close it).
 */
export const IDLE_CLOSE_MS = 6 * 60 * 1000;

/**
 * Speed change ≥ this many km/h between consecutive points crossed in ≤ 2s
 * is a harsh-accel/brake event. 14 km/h/s ≈ 0.4 g — common fleet threshold.
 */
const HARSH_ACCEL_DELTA_KMH = 14;
const HARSH_ACCEL_MAX_DT_SEC = 2;

/**
 * Heading change ≥ this many degrees between consecutive points at speed
 * ≥ this much km/h is a harsh turn. Avoids GPS-noise false positives at
 * standstill (heading is meaningless when stationary).
 */
const HARSH_TURN_DELTA_DEG = 30;
const HARSH_TURN_MIN_SPEED_KMH = 25;

/**
 * Speed below which a sample counts as idling for the idle-time aggregate.
 */
const IDLE_SPEED_THRESHOLD_KMH = 1;

// ── Types ───────────────────────────────────────────────────────────────────

/**
 * Minimal location shape the trip service needs. Both handleLocation and the
 * idle cron build this shape from their respective sources, so the service
 * doesn't depend on the codec or Prisma row types directly.
 */
export interface TripLocationPoint {
  reportedAt: Date;
  latitude: number;
  longitude: number;
  speedKmh: number;
  heading: number;
  accOn: boolean | null;
}

export interface VendorTripSummary {
  distanceKm?: number;
  durationSec?: number;
  maxSpeedKmh?: number;
  avgSpeedKmh?: number;
  harshAccelCount?: number;
  harshBrakeCount?: number;
  harshTurnCount?: number;
  overspeedCount?: number;
  fuelConsumedL?: number;
  idleDurationSec?: number;
}

// ── Public entry: process a chronological run of points ─────────────────────

/**
 * Apply trip lifecycle to a CHRONOLOGICALLY-SORTED batch of points (ascending
 * by reportedAt). The caller passes:
 *   • the terminal row (we read ownerUserId and vehicleVin off it)
 *   • a list of points fresh off the wire
 *   • optional `prevPoint` — the most-recent location strictly before the
 *     batch; used to seed Δ-calcs for the first point in the batch. Pass null
 *     to skip prev-point math (acceptable for the very first 0x0200 we ever
 *     see for a terminal).
 *
 * The function is the SINGLE place where the trip OPEN/APPEND/CLOSE state
 * machine runs — keeping it in one place prevents drift between the single-
 * report path (0x0200) and the batch path (0x0704).
 *
 * Errors here are LOGGED, never thrown. A failed trip update must not block
 * location persistence (which is the source of truth).
 */
export async function processTripForBatch(
  terminal: GpsTerminal,
  points: TripLocationPoint[],
  prevPoint: TripLocationPoint | null,
): Promise<void> {
  if (points.length === 0) return;

  let openTrip = await prisma.gpsTrip.findFirst({
    where: { terminalId: terminal.id, status: 'OPEN' },
    orderBy: { startAt: 'desc' },
  });

  let prev = prevPoint;

  for (const p of points) {
    try {
      // ── Decide on transitions ───────────────────────────────────────────
      const accWentOn = prev !== null && prev.accOn === false && p.accOn === true;
      const accWentOff = prev !== null && prev.accOn === true && p.accOn === false;
      const isMoving = p.speedKmh > MOVING_SPEED_THRESHOLD_KMH;

      // OPEN
      if (!openTrip && (accWentOn || (p.accOn === true && isMoving) || (p.accOn === null && isMoving))) {
        openTrip = await openNewTrip(terminal, p);
      }

      // APPEND aggregates while the trip is OPEN.
      if (openTrip) {
        openTrip = await appendPoint(openTrip, prev, p);
      }

      // CLOSE on ACC-off transition.
      if (openTrip && accWentOff) {
        await closeOpenTrip(openTrip, p, 'acc_off');
        openTrip = null;
      }
    } catch (err) {
      logger.warn('Trip lifecycle step failed (continuing)', {
        terminalId: terminal.id,
        err: (err as Error).message,
      });
    }

    prev = p;
  }
}

// ── Internals: open / append / close ────────────────────────────────────────

async function openNewTrip(
  terminal: GpsTerminal,
  startPoint: TripLocationPoint,
): Promise<GpsTrip> {
  const trip = await prisma.gpsTrip.create({
    data: {
      terminalId: terminal.id,
      ownerUserId: terminal.ownerUserId,
      vin: terminal.vehicleVin,
      status: 'OPEN',
      startAt: startPoint.reportedAt,
      startLat: new Prisma.Decimal(startPoint.latitude.toFixed(7)),
      startLng: new Prisma.Decimal(startPoint.longitude.toFixed(7)),
      distanceKm: new Prisma.Decimal('0.00'),
      durationSec: 0,
      maxSpeedKmh: new Prisma.Decimal(startPoint.speedKmh.toFixed(1)),
      avgSpeedKmh: new Prisma.Decimal('0.0'),
      idleDurationSec: 0,
    },
  });

  void emitNotify({
    type: 'trip.opened',
    terminalId: terminal.id,
    ownerUserId: terminal.ownerUserId,
    tripId: trip.id,
    at: trip.startAt.toISOString(),
  });

  return trip;
}

/**
 * Apply per-point updates to an open trip and return the refreshed row.
 *
 * Aggregations:
 *   distanceKm    += Haversine(prev → curr)         (only if prev exists)
 *   durationSec    = curr.reportedAt − trip.startAt (recomputed each tick)
 *   maxSpeedKmh    = max(maxSpeedKmh, curr.speedKmh)
 *   avgSpeedKmh    = distanceKm / durationSec       (skipped if duration 0)
 *   idleDurationSec += Δt when curr.speed < IDLE_SPEED_THRESHOLD_KMH
 *   harsh{Accel,Brake,Turn}Count++ when thresholds crossed (prev required)
 *   overspeedCount++ if alarm bit OVERSPEED transitioned on (caller supplies
 *     this via processOverspeedTransition — we don't know alarm bits here)
 */
async function appendPoint(
  trip: GpsTrip,
  prev: TripLocationPoint | null,
  curr: TripLocationPoint,
): Promise<GpsTrip> {
  const updates: Prisma.GpsTripUpdateInput = {};

  // Always-on counters.
  const durationSec = Math.max(
    0,
    Math.round((curr.reportedAt.getTime() - trip.startAt.getTime()) / 1000),
  );
  updates.durationSec = durationSec;

  if (curr.speedKmh > Number(trip.maxSpeedKmh ?? 0)) {
    updates.maxSpeedKmh = new Prisma.Decimal(curr.speedKmh.toFixed(1));
  }

  if (prev) {
    const dtSec = (curr.reportedAt.getTime() - prev.reportedAt.getTime()) / 1000;
    if (dtSec > 0) {
      // Distance.
      const segKm = haversineKm(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude,
      );
      // Filter implausible jumps — > 60 km in <2 min would be 1800 km/h.
      // Likely a GPS lock blip rather than real travel.
      if (segKm < 60 && dtSec < 120) {
        const newDistance = Number(trip.distanceKm ?? 0) + segKm;
        updates.distanceKm = new Prisma.Decimal(newDistance.toFixed(2));
      }

      // Idle accumulation.
      if (curr.speedKmh < IDLE_SPEED_THRESHOLD_KMH) {
        updates.idleDurationSec = (trip.idleDurationSec ?? 0) + Math.round(dtSec);
      }

      // Harsh accel / brake (speed-derived).
      if (dtSec <= HARSH_ACCEL_MAX_DT_SEC) {
        const dv = curr.speedKmh - prev.speedKmh; // km/h
        if (dv >= HARSH_ACCEL_DELTA_KMH) {
          updates.harshAccelCount = { increment: 1 };
        } else if (dv <= -HARSH_ACCEL_DELTA_KMH) {
          updates.harshBrakeCount = { increment: 1 };
        }
      }

      // Harsh turn — significant heading change at non-trivial speed.
      if (curr.speedKmh >= HARSH_TURN_MIN_SPEED_KMH && prev.speedKmh >= HARSH_TURN_MIN_SPEED_KMH) {
        const dh = headingDeltaDeg(prev.heading, curr.heading);
        if (dh >= HARSH_TURN_DELTA_DEG) {
          updates.harshTurnCount = { increment: 1 };
        }
      }
    }
  }

  // Recompute avgSpeedKmh from the (possibly-updated) distance.
  // We use the in-memory candidate `updates.distanceKm` if set, else the
  // trip's previous value; same for durationSec. The result is rounded to
  // one decimal to match the column's scale.
  const newDistance =
    updates.distanceKm !== undefined && updates.distanceKm instanceof Prisma.Decimal
      ? Number(updates.distanceKm)
      : Number(trip.distanceKm ?? 0);
  if (durationSec > 0 && newDistance > 0) {
    const avg = (newDistance / (durationSec / 3600));
    updates.avgSpeedKmh = new Prisma.Decimal(avg.toFixed(1));
  }

  if (Object.keys(updates).length === 0) return trip;

  return prisma.gpsTrip.update({ where: { id: trip.id }, data: updates });
}

/**
 * Close an open trip with our DERIVED aggregates (set during appendPoint).
 * Computes a score and fires the trip.closed notify.
 *
 * `endPoint` is the last point seen — we use its coords for endLat/Lng and
 * its timestamp as the closing time. For the cron-driven idle close, the
 * caller passes a synthetic point built from the last GpsLocation row.
 *
 * Returns the closed trip on success, or `null` if the row was already
 * CLOSED by another path between the caller's read and our update (e.g. a
 * vendor-summary close fired concurrently). The status:OPEN guard is the
 * critical piece — without it, this function could clobber vendor numbers.
 */
export async function closeOpenTrip(
  trip: GpsTrip,
  endPoint: TripLocationPoint,
  reason: 'acc_off' | 'idle_timeout' | 'vendor_summary',
): Promise<GpsTrip | null> {
  const durationSec = Math.max(
    0,
    Math.round((endPoint.reportedAt.getTime() - trip.startAt.getTime()) / 1000),
  );

  const closeData = {
    status: 'CLOSED' as const,
    endAt: endPoint.reportedAt,
    endLat: new Prisma.Decimal(endPoint.latitude.toFixed(7)),
    endLng: new Prisma.Decimal(endPoint.longitude.toFixed(7)),
    durationSec,
    score: scoreTripPure({
      distanceKm: Number(trip.distanceKm ?? 0),
      durationSec,
      harshAccelCount: trip.harshAccelCount,
      harshBrakeCount: trip.harshBrakeCount,
      harshTurnCount: trip.harshTurnCount,
      overspeedCount: trip.overspeedCount,
    }),
    rawSummary: { closeReason: reason } as Prisma.InputJsonValue,
  };

  // Atomic CAS — only close if still OPEN. Prevents the cron from clobbering
  // a concurrent vendor-summary close.
  const updateResult = await prisma.gpsTrip.updateMany({
    where: { id: trip.id, status: 'OPEN' },
    data: closeData,
  });
  if (updateResult.count === 0) {
    logger.info('closeOpenTrip: trip was already CLOSED (race against vendor close)', {
      tripId: trip.id,
      attemptedReason: reason,
    });
    return null;
  }

  // Re-read for the canonical row (updateMany doesn't return the record).
  const closed = await prisma.gpsTrip.findUnique({ where: { id: trip.id } });
  if (!closed) return null;

  void emitNotify({
    type: 'trip.closed',
    terminalId: trip.terminalId,
    ownerUserId: trip.ownerUserId,
    tripId: trip.id,
    at: closed.endAt!.toISOString(),
  });

  logger.info('Trip closed', {
    tripId: trip.id,
    terminalId: trip.terminalId,
    reason,
    distanceKm: Number(closed.distanceKm ?? 0),
    durationSec,
    score: closed.score,
  });

  return closed;
}

/**
 * Close an open trip using a vendor-supplied summary (0x0900/0xF1). We
 * prefer vendor numbers over our derived ones because the device has direct
 * accelerometer + speedometer access and is more accurate than our fixed-
 * threshold speed-delta detector.
 */
export async function closeWithVendorSummary(
  terminalId: string,
  endPoint: TripLocationPoint,
  summary: VendorTripSummary,
): Promise<GpsTrip | null> {
  const trip = await prisma.gpsTrip.findFirst({
    where: { terminalId, status: 'OPEN' },
    orderBy: { startAt: 'desc' },
  });
  if (!trip) return null; // no open trip to close

  const merged: Prisma.GpsTripUpdateInput = {
    status: 'CLOSED',
    endAt: endPoint.reportedAt,
    endLat: new Prisma.Decimal(endPoint.latitude.toFixed(7)),
    endLng: new Prisma.Decimal(endPoint.longitude.toFixed(7)),
    rawSummary: { closeReason: 'vendor_summary', vendor: summary as unknown as Prisma.InputJsonValue },
  };
  if (summary.distanceKm !== undefined)
    merged.distanceKm = new Prisma.Decimal(summary.distanceKm.toFixed(2));
  if (summary.durationSec !== undefined) merged.durationSec = summary.durationSec;
  if (summary.maxSpeedKmh !== undefined)
    merged.maxSpeedKmh = new Prisma.Decimal(summary.maxSpeedKmh.toFixed(1));
  if (summary.avgSpeedKmh !== undefined)
    merged.avgSpeedKmh = new Prisma.Decimal(summary.avgSpeedKmh.toFixed(1));
  if (summary.harshAccelCount !== undefined) merged.harshAccelCount = summary.harshAccelCount;
  if (summary.harshBrakeCount !== undefined) merged.harshBrakeCount = summary.harshBrakeCount;
  if (summary.harshTurnCount !== undefined) merged.harshTurnCount = summary.harshTurnCount;
  if (summary.overspeedCount !== undefined) merged.overspeedCount = summary.overspeedCount;
  if (summary.fuelConsumedL !== undefined)
    merged.fuelConsumedL = new Prisma.Decimal(summary.fuelConsumedL.toFixed(2));
  if (summary.idleDurationSec !== undefined) merged.idleDurationSec = summary.idleDurationSec;

  // Compute score from the merged numbers (vendor-provided when available).
  merged.score = scoreTripPure({
    distanceKm: summary.distanceKm ?? Number(trip.distanceKm ?? 0),
    durationSec: summary.durationSec ?? trip.durationSec ?? 0,
    harshAccelCount: summary.harshAccelCount ?? trip.harshAccelCount,
    harshBrakeCount: summary.harshBrakeCount ?? trip.harshBrakeCount,
    harshTurnCount: summary.harshTurnCount ?? trip.harshTurnCount,
    overspeedCount: summary.overspeedCount ?? trip.overspeedCount,
  });

  const closed = await prisma.gpsTrip.update({ where: { id: trip.id }, data: merged });

  void emitNotify({
    type: 'trip.closed',
    terminalId: trip.terminalId,
    ownerUserId: trip.ownerUserId,
    tripId: trip.id,
    at: closed.endAt!.toISOString(),
  });

  return closed;
}

/**
 * Bump the overspeed counter on the (possibly current) open trip for a
 * terminal. Called from handleLocation when alarm-diff flags an OVERSPEED
 * transition, so we don't have to also expose alarm bits to the trip path.
 */
export async function bumpOverspeedForOpenTrip(terminalId: string): Promise<void> {
  await prisma.gpsTrip.updateMany({
    where: { terminalId, status: 'OPEN' },
    data: { overspeedCount: { increment: 1 } },
  });
}

// ── Idle cron — close trips that lost their device ──────────────────────────

/**
 * Find OPEN trips whose last GpsLocation is older than IDLE_CLOSE_MS and
 * close them. Runs from the cron every few minutes so a vehicle that lost
 * its uplink (device unplugged, parked underground) doesn't sit "in trip"
 * forever and skew daily rollups.
 *
 * Returns number of trips closed.
 */
export async function closeStaleOpenTrips(): Promise<number> {
  const cutoff = new Date(Date.now() - IDLE_CLOSE_MS);

  const openTrips = await prisma.gpsTrip.findMany({
    where: { status: 'OPEN' },
    select: { id: true, terminalId: true, startAt: true, ownerUserId: true },
  });

  let closedCount = 0;
  for (const t of openTrips) {
    const lastLoc = await prisma.gpsLocation.findFirst({
      where: { terminalId: t.terminalId },
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

    // No locations at all? Trip is stale by definition; close it now.
    const lastSeen = lastLoc?.reportedAt ?? t.startAt;
    if (lastSeen > cutoff) continue;

    // Reload the full trip row so closeOpenTrip can produce a sensible score.
    const full = await prisma.gpsTrip.findUnique({ where: { id: t.id } });
    if (!full) continue;

    const endPoint: TripLocationPoint = {
      reportedAt: lastSeen,
      latitude: lastLoc ? Number(lastLoc.latitude) : 0,
      longitude: lastLoc ? Number(lastLoc.longitude) : 0,
      speedKmh: lastLoc ? Number(lastLoc.speedKmh ?? 0) : 0,
      heading: lastLoc?.heading ?? 0,
      accOn: lastLoc?.accOn ?? null,
    };

    try {
      const closed = await closeOpenTrip(full, endPoint, 'idle_timeout');
      if (closed) closedCount++;
    } catch (err) {
      logger.warn('Failed to close stale trip', {
        tripId: t.id,
        err: (err as Error).message,
      });
    }
  }

  if (closedCount > 0) {
    logger.info('closeStaleOpenTrips: closed N idle trips', { closedCount });
  }
  return closedCount;
}

// ── Pure helpers ────────────────────────────────────────────────────────────

/** Haversine great-circle distance in kilometres. */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Smallest absolute heading delta accounting for the 0/360° wrap. */
export function headingDeltaDeg(prev: number, curr: number): number {
  const raw = Math.abs(curr - prev) % 360;
  return raw > 180 ? 360 - raw : raw;
}

interface ScoreInput {
  distanceKm: number;
  durationSec: number;
  harshAccelCount: number;
  harshBrakeCount: number;
  harshTurnCount: number;
  overspeedCount: number;
}

/**
 * Pure, deterministic score formula — stays unchanged when the device replays
 * the same trip on a different process/region. Range 0..100, higher = better.
 *
 * Start at 100; subtract weighted penalties per harsh event normalised by
 * driving time so a 4-hour trip with 4 harsh events doesn't get clobbered
 * the same as a 10-min trip with the same count.
 */
export function scoreTripPure(input: ScoreInput): number {
  const hours = Math.max(input.durationSec / 3600, 0.0001);
  const accelRate = input.harshAccelCount / hours;
  const brakeRate = input.harshBrakeCount / hours;
  const turnRate = input.harshTurnCount / hours;
  const overspeedRate = input.overspeedCount / hours;

  let score = 100;
  score -= Math.min(40, accelRate * 4);
  score -= Math.min(40, brakeRate * 6);    // braking weighed higher than accel
  score -= Math.min(30, turnRate * 5);
  score -= Math.min(30, overspeedRate * 8); // policy violation, big penalty

  return Math.max(0, Math.min(100, Math.round(score)));
}
