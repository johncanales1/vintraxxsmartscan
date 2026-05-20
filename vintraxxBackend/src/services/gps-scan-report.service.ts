/**
 * GpsScanReport orchestrator.
 *
 * Drives the user-initiated "Run full scan" workflow:
 *
 *   1. `requestFullScan(terminalId, requester)`
 *        - Inserts a GpsScanReport row in PENDING.
 *        - Enqueues two commands against the terminal via the existing
 *          `gps-command.service`:
 *            • set-params  → [{ id: 0x2017, value: 1 }, { id: 0x201A, value: 1 }]
 *              (Spec §3.8: 0x2017 enables the OBD feature; 0x201A=1 asks the
 *              device to read fault codes and reply via 0x0900/0xF2.)
 *            • read-params  → 0x8104 query (kicks the device into reporting
 *              its current 0x20xx configuration so the UI can flag a stale
 *              install).
 *        - Emits `scan.requested` over pg_notify.
 *
 *   2. The gateway process picks up the QUEUED rows, writes them to the
 *      device socket, and as the device replies the codec layer fires:
 *        • `onDtcArrived(terminalId, decodedDtc)` from `handlePassThrough.ts`
 *          when a 0x0900/0xF2 frame is decoded.
 *        • `onObdLiveArrived(terminalId, obd, location)` from
 *          `handleLocation.ts` when a 0x0200 frame with extended OBD PIDs
 *          is decoded.
 *      Each callback updates the PENDING GpsScanReport in place; once we've
 *      seen at least one of {F2, OBD-live} we complete the report (anything
 *      missing stays null in the row — the BLE flow has the same partial
 *      reporting semantics).
 *
 *   3. A 30-second inactivity window flips the row to TIMED_OUT if neither
 *      callback ever fires (device offline, OBD adapter disconnected, etc.).
 *
 * Cross-process coordination: the orchestrator runs INSIDE the REST process
 * and the gateway runs as a separate node. They share the database, so the
 * callbacks invoked by the gateway must walk the DB to find the pending
 * row — that's what `onDtcArrived` / `onObdLiveArrived` do, with no
 * in-memory coupling. The 30s timer is run by whichever process called
 * `requestFullScan`; if the REST process crashes mid-request, the row is
 * cleaned up by a periodic sweep below (`sweepStaleScanReports`).
 */

import prisma from '../config/db';
import { Prisma, type GpsScanReport, type GpsTerminal, type GpsObdSnapshot } from '@prisma/client';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { emit as emitNotify } from '../realtime/notify';
import * as commandService from './gps-command.service';
import { processScanInBackground } from '../controllers/scan.controller';
import type { DecodedDtc } from '../gateway/codec/messages/m0900-pass-through';
import type {
  DecodedLocation,
  DecodedObdLive,
} from '../gateway/codec/messages/m0200-location';
import type { DecodedObdConfig } from '../gateway/codec/messages/m0104-query-params-response';

// ── Constants ──────────────────────────────────────────────────────────────

/**
 * How long to wait between requesting the scan and forcibly TIMING_OUT the
 * row if neither F2 nor 0x0200 extended PIDs have arrived. Default is 45s,
 * but this is adjusted based on the device's OBD interval settings from 0x0104.
 */
const DEFAULT_SCAN_TIMEOUT_MS = 45_000;

/**
 * Debounce window: prevent multiple scan requests within 20 seconds for the
 * same terminal. This protects against double-taps and rapid retry loops.
 */
const SCAN_DEBOUNCE_MS = 20_000;

/**
 * A second window after the FIRST piece of telemetry arrives, used to wait
 * for the OTHER piece. We don't block forever — if F2 arrived but no OBD
 * PID burst is going to come (some ECUs don't report 0x6014 at all), we
 * complete as PARTIAL instead of COMPLETED.
 */
const SECOND_SIGNAL_WAIT_MS = 8_000;

/**
 * Maximum age of a cached GpsObdSnapshot to consider it fresh enough for
 * a scan report. The GPS terminal reports OBD data approximately every 30
 * seconds, so 60 seconds gives us a 2-packet buffer.
 */
const CACHED_OBD_FRESHNESS_MS = 60_000;

/**
 * Calculate scan timeout based on terminal's OBD interval settings.
 * If the device is configured with long OBD upload intervals, we need to wait longer.
 */
function calculateScanTimeout(terminal: GpsTerminal): number {
  const params = terminal.parameters as Record<string, unknown> | null;
  if (!params) {
    return DEFAULT_SCAN_TIMEOUT_MS;
  }

  const largePacketIntervalSec = params.obdLargePacketIntervalSec as number | undefined;
  const uploadIntervalSec = params.obdUploadIntervalSec as number | undefined;

  // Use the larger of the two intervals (whichever controls OBD live data)
  const intervalSec = Math.max(
    largePacketIntervalSec ?? 0,
    uploadIntervalSec ?? 0,
  );

  if (intervalSec === 0) {
    return DEFAULT_SCAN_TIMEOUT_MS;
  }

  // Add 5 seconds buffer on top of the configured interval
  // If interval is 70s, wait 75s
  const timeoutMs = (intervalSec + 5) * 1000;

  // Cap at 120 seconds to avoid excessively long waits
  return Math.min(timeoutMs, 120_000);
}

// ── In-memory pending-timer registry ───────────────────────────────────────

/**
 * Map of `scanReportId → cleanup`. Used to cancel a pending timeout if the
 * scan completes early, or to track when we're waiting on a second signal.
 *
 * Cross-process note: this registry only lives in the REST process that
 * called `requestFullScan`. The gateway-side callbacks update the row via
 * Prisma and emit a notify; the REST process re-finds the row by id when
 * the second-signal window elapses. If the REST node restarts mid-scan,
 * `sweepStaleScanReports` (a cron in `cron/gps-cron.ts`) finishes the job.
 */
interface PendingScan {
  scanReportId: string;
  terminalId: string;
  timeoutAt: number;
  /** Cancels the OUTER 30 s timeout. */
  cancelTimeout: () => void;
  /** Cancels the 8 s second-signal window timer, if one is armed. */
  cancelSecondSignalTimer?: () => void;
  /** Resolved when the in-process orchestrator has flipped status away from PENDING. */
  done: Promise<void>;
}

const pending = new Map<string, PendingScan>();

// ── Public API: REST handlers ──────────────────────────────────────────────

export interface RequestFullScanInput {
  terminalId: string;
  /** Exactly one of these should be set. */
  requestedByUserId?: string | null;
  requestedByAdminId?: string | null;
}

export interface RequestFullScanResult {
  scanReportId: string;
  /** True if we returned a still-in-progress scan rather than starting a new one. */
  reused: boolean;
}

/**
 * Kick off a Full Scan. If a PENDING report already exists for the same
 * terminal we re-use it (idempotency — protects against a double-tap on
 * the Refresh button creating two parallel scans).
 */
export async function requestFullScan(
  input: RequestFullScanInput,
): Promise<RequestFullScanResult> {
  const terminal = await prisma.gpsTerminal.findUnique({
    where: { id: input.terminalId },
  });
  if (!terminal) throw new AppError('Terminal not found', 404);

  // Reject pre-emptively if the device is offline. Saves enqueuing two
  // commands the gateway will never get to deliver.
  if (terminal.status === 'OFFLINE' || terminal.status === 'NEVER_CONNECTED') {
    // Persist a FAILED row so the UI can show the user-friendly reason
    // (instead of just bouncing the request — the dashboard wants to render
    // a record either way).
    const failed = await prisma.gpsScanReport.create({
      data: {
        terminalId: terminal.id,
        ownerUserId: terminal.ownerUserId,
        requestedByUserId: input.requestedByUserId ?? null,
        requestedByAdminId: input.requestedByAdminId ?? null,
        vin: terminal.vehicleVin,
        vehicleYear: terminal.vehicleYear,
        vehicleMake: terminal.vehicleMake,
        vehicleModel: terminal.vehicleModel,
        status: 'FAILED',
        completedAt: new Date(),
        errorText: 'Device is offline. Reconnect the GPS scanner and try again.',
      },
    });
    void emitNotify({
      type: 'scan.failed',
      terminalId: terminal.id,
      ownerUserId: terminal.ownerUserId,
      scanReportId: failed.id,
      status: 'FAILED',
      reason: failed.errorText ?? undefined,
      at: failed.completedAt!.toISOString(),
    });
    return { scanReportId: failed.id, reused: false };
  }

  // Idempotency/debounce: reject if ANY scan (PENDING, PARTIAL, or recent COMPLETED)
  // exists within the last 20 seconds. This prevents rapid retry loops and
  // double-taps from creating multiple parallel scans.
  const recentScan = await prisma.gpsScanReport.findFirst({
    where: {
      terminalId: terminal.id,
      requestedAt: { gt: new Date(Date.now() - SCAN_DEBOUNCE_MS) },
    },
    orderBy: { requestedAt: 'desc' },
  });
  if (recentScan) {
    logger.info('Re-using recent GpsScanReport within debounce window', {
      scanReportId: recentScan.id,
      terminalId: terminal.id,
      status: recentScan.status,
      ageMs: Date.now() - recentScan.requestedAt.getTime(),
    });
    return { scanReportId: recentScan.id, reused: true };
  }

  const report = await prisma.gpsScanReport.create({
    data: {
      terminalId: terminal.id,
      ownerUserId: terminal.ownerUserId,
      requestedByUserId: input.requestedByUserId ?? null,
      requestedByAdminId: input.requestedByAdminId ?? null,
      vin: terminal.vehicleVin,
      vehicleYear: terminal.vehicleYear,
      vehicleMake: terminal.vehicleMake,
      vehicleModel: terminal.vehicleModel,
      status: 'PENDING',
    },
  });

  logger.info('GPS scan: started', {
    scanReportId: report.id,
    terminalId: terminal.id,
    deviceIdentifier: terminal.deviceIdentifier,
    requestedByUserId: input.requestedByUserId,
    requestedByAdminId: input.requestedByAdminId,
  });

  // Check for fresh cached OBD data immediately after creating the report.
  // If found, copy it into the report but do not complete until DTC arrives or timeout.
  const cachedObd = await fetchFreshCachedObd(terminal.id);
  if (cachedObd) {
    logger.info('GPS scan: cached OBD attached at scan start', {
      scanReportId: report.id,
      terminalId: terminal.id,
      cachedAgeMs: Date.now() - cachedObd.reportedAt.getTime(),
    });
    const data = buildScanReportUpdateFromCachedObd(cachedObd);
    await prisma.gpsScanReport.update({
      where: { id: report.id },
      data,
    });
  }

  // Enqueue the OBD-enable + DTC-read commands. Both go via the existing
  // command service so the gateway picks them up exactly like any other
  // platform-initiated command. Errors here MUST flip the report to FAILED.
  try {
    await commandService.enqueueCommand({
      terminalId: terminal.id,
      userId: input.requestedByUserId ?? null,
      adminId: input.requestedByAdminId ?? null,
      kind: 'set-params',
      setParams: [
        // 0x2017 — enable OBD function (spec type: BYTE). Idempotent: writes 1 if already 1.
        { id: 0x2017, value: 1, byteWidth: 1 },
        // 0x201A — read fault codes (spec type: BYTE, one-shot). Device clears this flag
        // after responding so the next 8103 won't re-trigger unintentionally.
        { id: 0x201a, value: 1, byteWidth: 1 },
      ],
    });
    await commandService.enqueueCommand({
      terminalId: terminal.id,
      userId: input.requestedByUserId ?? null,
      adminId: input.requestedByAdminId ?? null,
      kind: 'read-params',
    });
  } catch (err) {
    await failScanReport(report.id, `Could not queue scan commands: ${(err as Error).message}`);
    return { scanReportId: report.id, reused: false };
  }

  // Register the timeout. Calculate based on terminal's OBD interval settings.
  const scanTimeoutMs = calculateScanTimeout(terminal);
  logger.info('GPS scan timeout calculated', {
    terminalId: terminal.id,
    timeoutMs: scanTimeoutMs,
    timeoutSec: scanTimeoutMs / 1000,
    obdUploadInterval: (terminal.parameters as Record<string, unknown> | null)?.obdUploadIntervalSec,
    obdLargePacketInterval: (terminal.parameters as Record<string, unknown> | null)?.obdLargePacketIntervalSec,
  });
  registerTimeout(report, scanTimeoutMs);

  void emitNotify({
    type: 'scan.requested',
    terminalId: terminal.id,
    ownerUserId: terminal.ownerUserId,
    scanReportId: report.id,
    status: 'PENDING',
    at: report.requestedAt.toISOString(),
  });

  return { scanReportId: report.id, reused: false };
}

/**
 * Fetch a single GpsScanReport by id. Authorisation lives in the route
 * layer; this is a thin DB read.
 */
export async function getScanReport(id: string): Promise<GpsScanReport | null> {
  return prisma.gpsScanReport.findUnique({ where: { id } });
}

/**
 * List recent scan reports for one terminal. Newest first.
 */
export async function listScanReports(args: {
  terminalId: string;
  limit?: number;
}): Promise<GpsScanReport[]> {
  return prisma.gpsScanReport.findMany({
    where: { terminalId: args.terminalId },
    orderBy: { requestedAt: 'desc' },
    take: Math.min(args.limit ?? 20, 100),
  });
}

// ── Gateway-side callbacks ─────────────────────────────────────────────────

/**
 * Called by `handlePassThrough.ts` whenever a 0x0900/0xF2 fault-code frame
 * arrives — including healthy reports (DtcNum=0). We merge the DTC fields
 * into the most-recent PENDING GpsScanReport for the same terminal. If no
 * scan is pending, this is a passive observation and we drop the data.
 */
export async function onDtcArrived(
  terminalId: string,
  parsed: DecodedDtc,
): Promise<void> {
  logger.info('GPS scan: searching pending scan for DTC attach', {
    terminalId,
    dtcCount: parsed.dtcCount,
    milOn: parsed.milOn,
  });

  const report = await prisma.gpsScanReport.findFirst({
    where: {
      terminalId,
      status: 'PENDING',
      requestedAt: { gte: new Date(Date.now() - 300_000) }, // Within last 5 minutes
    },
    orderBy: { requestedAt: 'desc' },
  });

  if (!report) {
    logger.info('GPS scan: no pending scan found for DTC attach', { terminalId });
    return;
  }

  logger.info('GPS scan: found pending scan for DTC attach', {
    scanReportId: report.id,
    terminalId,
  });

  logger.info('GPS scan: DTC fields copied to scan report', {
    scanReportId: report.id,
    terminalId,
    dtcCount: parsed.dtcCount,
    milOn: parsed.milOn,
  });

  await prisma.gpsScanReport.update({
    where: { id: report.id },
    data: {
      milOn: parsed.milOn,
      dtcCount: parsed.dtcCount,
      storedDtcCodes: parsed.storedDtcCodes,
      pendingDtcCodes: parsed.pendingDtcCodes,
      permanentDtcCodes: parsed.permanentDtcCodes,
      protocol: parsed.protocol ?? 'OBD-II',
    },
  });

  await maybeCompleteScan(report.id, 'dtc');
}

/**
 * Called by `handleLocation.ts` whenever a 0x0200 frame is decoded with
 * extended OBD PIDs. We merge the live telemetry into the most-recent
 * PENDING or PARTIAL GpsScanReport for the same terminal.
 */
export async function onObdLiveArrived(
  terminalId: string,
  obd: DecodedObdLive,
  location: DecodedLocation | null,
): Promise<void> {
  logger.info('0x0200 OBD live data arrived', {
    terminalId,
    hasRpm: obd.rpm !== null,
    hasCoolantTemp: obd.coolantTempC !== null,
    hasVin: obd.vin !== null,
  });

  // First try to find a PENDING scan
  let report = await prisma.gpsScanReport.findFirst({
    where: {
      terminalId,
      status: 'PENDING',
      requestedAt: { gte: new Date(Date.now() - 300_000) }, // Within last 5 minutes
    },
    orderBy: { requestedAt: 'desc' },
  });

  if (!report) {
    logger.info('GPS scan: no pending scan found for OBD attach', { terminalId });

    // Check PARTIAL and COMPLETED recent scans for late arrival
    const recentPartial = await prisma.gpsScanReport.findFirst({
      where: {
        terminalId,
        status: 'PARTIAL',
        completedAt: { gt: new Date(Date.now() - 60_000) }, // Within last 60 seconds
      },
      orderBy: { requestedAt: 'desc' },
    });
    if (recentPartial && !hasLiveObdData(recentPartial)) {
      logger.info('GPS scan: late-arrival - upgrading PARTIAL to COMPLETED with OBD live data', {
        scanReportId: recentPartial.id,
        terminalId,
      });
      report = recentPartial;
      // Upgrade status from PARTIAL to COMPLETED since we now have live data
      await prisma.gpsScanReport.update({
        where: { id: report.id },
        data: {
          status: 'COMPLETED',
          errorText: null, // Clear the partial error text
        },
      });
    }
  }

  // If no PENDING or PARTIAL scan, check for a recent COMPLETED scan (late-arrival handling)
  // This handles the case where DTC data arrives first, scan completes, then OBD live data arrives later
  if (!report) {
    logger.info('GPS scan: late-arrival check for COMPLETED scan', {
      terminalId,
      timeWindowMs: 60_000,
    });
    const recentCompleted = await prisma.gpsScanReport.findFirst({
      where: {
        terminalId,
        status: 'COMPLETED',
        completedAt: { gt: new Date(Date.now() - 60_000) }, // Within last 60 seconds
      },
      orderBy: { requestedAt: 'desc' },
    });
    if (recentCompleted && !hasLiveObdData(recentCompleted)) {
      logger.info('GPS scan: late-arrival - updating COMPLETED scan with OBD live data', {
        scanReportId: recentCompleted.id,
        terminalId,
      });
      report = recentCompleted;
    } else {
      logger.info('GPS scan: late-arrival - no recent COMPLETED scan found to update', {
        terminalId,
      });
    }
  }

  if (!report) {
    logger.info('GPS scan: no scan found to attach OBD data', { terminalId });
    return;
  }

  logger.info('GPS scan: found pending scan for OBD attach', {
    scanReportId: report.id,
    terminalId,
  });

  const data: Prisma.GpsScanReportUncheckedUpdateInput = {
    rpm: obd.rpm,
    coolantTempC: obd.coolantTempC,
    intakeAirTempC: obd.intakeAirTempC,
    throttlePct: obd.throttlePct,
    engineLoadPct: obd.engineLoadPct,
    mafGps: obd.mafGps,
    fuelRailPressureKpa: obd.fuelRailPressureKpa,
    vehicleSpeedKmh: obd.vehicleSpeedKmh,
    runtimeSinceStartSec: obd.runtimeSinceStartSec,
    acceleratorPct: obd.acceleratorPct,
    intakeManifoldKpa: obd.intakeManifoldKpa,
    barometricKpa: obd.barometricKpa,
    ambientTempC: obd.ambientTempC,
    distanceWithMilKm: obd.distanceWithMilKm,
    fuelLevelPct: obd.fuelLevelPct,
  };

  if (obd.vehicleSpeedKmh !== undefined) {
    data.vehicleSpeedKmh = new Prisma.Decimal(obd.vehicleSpeedKmh.toFixed(1));
  }
  if (obd.acceleratorPct !== undefined) {
    data.acceleratorPct = new Prisma.Decimal(obd.acceleratorPct.toFixed(1));
  }
  if (obd.throttlePct !== undefined) {
    data.throttlePct = new Prisma.Decimal(obd.throttlePct.toFixed(1));
  }
  if (obd.engineLoadPct !== undefined) {
    data.engineLoadPct = new Prisma.Decimal(obd.engineLoadPct.toFixed(1));
  }
  if (obd.mafGps !== undefined) {
    data.mafGps = new Prisma.Decimal(obd.mafGps.toFixed(2));
  }
  if (obd.fuelLevelPct !== undefined) {
    data.fuelLevelPct = new Prisma.Decimal(obd.fuelLevelPct.toFixed(1));
  }
  if (obd.distanceWithMilKm !== undefined) {
    data.distanceWithMilKm = new Prisma.Decimal(obd.distanceWithMilKm.toFixed(1));
  }
  if (obd.totalMileageKm !== undefined && report.mileageKm === null) {
    data.mileageKm = new Prisma.Decimal(obd.totalMileageKm.toFixed(1));
  }
  if (obd.vehicleVoltageV !== undefined) {
    data.batteryVoltageMv = Math.round(obd.vehicleVoltageV * 1000);
  }
  if (obd.milOn !== undefined && report.milOn === null) {
    // F2 takes priority; only fill in if we haven't seen a fault report yet.
    data.milOn = obd.milOn;
  }
  if (obd.vin && !report.vin) {
    data.vin = obd.vin;
  }
  if (obd.diagnosticProtocol && !report.protocol) {
    data.protocol = obd.diagnosticProtocol;
  }

  // Capture the raw TLV dump for forensic debugging. Merge with whatever's
  // already there so subsequent location packets don't clobber the F2 bytes.
  const existingRaw = (report.rawObdJson ?? {}) as Record<string, unknown>;
  data.rawObdJson = {
    ...existingRaw,
    obdLive: {
      ...((existingRaw.obdLive ?? {}) as Record<string, unknown>),
      ...obd,
    },
    ...(location
      ? {
          location: {
            reportedAt: location.reportedAt.toISOString(),
            latitude: location.latitude,
            longitude: location.longitude,
            speedKmh: location.speedKmh,
          },
        }
      : {}),
  } satisfies Prisma.InputJsonValue;

  await prisma.gpsScanReport.update({
    where: { id: report.id },
    data,
  });

  await maybeCompleteScan(report.id, 'obd');
}

// ── Cron sweep ─────────────────────────────────────────────────────────────

/**
 * Idempotent sweep that flips abandoned PENDING reports to TIMED_OUT.
 * Called from the gps cron loop every minute. Catches the case where the
 * REST node that started the scan crashed before the in-process timeout
 * could fire.
 */
export async function sweepStaleScanReports(): Promise<number> {
  const cutoff = new Date(Date.now() - DEFAULT_SCAN_TIMEOUT_MS - 5_000);
  const stale = await prisma.gpsScanReport.findMany({
    where: { status: 'PENDING', requestedAt: { lt: cutoff } },
    select: { id: true, terminalId: true, ownerUserId: true },
  });
  let count = 0;
  for (const row of stale) {
    const updated = await prisma.gpsScanReport.updateMany({
      where: { id: row.id, status: 'PENDING' },
      data: {
        status: 'TIMED_OUT',
        completedAt: new Date(),
        errorText: `No response from device within ${DEFAULT_SCAN_TIMEOUT_MS / 1000} seconds.`,
      },
    });
    if (updated.count > 0) {
      count++;
      void emitNotify({
        type: 'scan.failed',
        terminalId: row.terminalId,
        ownerUserId: row.ownerUserId,
        scanReportId: row.id,
        status: 'TIMED_OUT',
        reason: `No response from device within ${DEFAULT_SCAN_TIMEOUT_MS / 1000} seconds.`,
        at: new Date().toISOString(),
      });
    }
  }
  return count;
}

// ── Internal helpers ───────────────────────────────────────────────────────

/**
 * Detect whether a scan report has real live OBD telemetry data.
 * VIN, vehicleYear/make/model, milOn, and dtcCount are metadata/DTC fields,
 * NOT live OBD telemetry. This helper only checks actual sensor readings.
 */
function hasLiveObdData(
  row: Pick<
    GpsScanReport,
    | 'rpm'
    | 'coolantTempC'
    | 'vehicleSpeedKmh'
    | 'batteryVoltageMv'
    | 'intakeAirTempC'
    | 'ambientTempC'
    | 'intakeManifoldKpa'
    | 'barometricKpa'
    | 'fuelRailPressureKpa'
    | 'runtimeSinceStartSec'
    | 'acceleratorPct'
    | 'throttlePct'
    | 'engineLoadPct'
    | 'mafGps'
    | 'fuelLevelPct'
    | 'distanceWithMilKm'
  >,
): boolean {
  return (
    row.rpm !== null ||
    row.coolantTempC !== null ||
    row.vehicleSpeedKmh !== null ||
    row.batteryVoltageMv !== null ||
    row.intakeAirTempC !== null ||
    row.ambientTempC !== null ||
    row.intakeManifoldKpa !== null ||
    row.barometricKpa !== null ||
    row.fuelRailPressureKpa !== null ||
    row.runtimeSinceStartSec !== null ||
    row.acceleratorPct !== null ||
    row.throttlePct !== null ||
    row.engineLoadPct !== null ||
    row.mafGps !== null ||
    row.fuelLevelPct !== null ||
    row.distanceWithMilKm !== null
  );
}

/**
 * Fetch the most recent GpsObdSnapshot for a terminal, if it's fresh enough.
 * Returns null if no snapshot exists or if it's older than CACHED_OBD_FRESHNESS_MS.
 */
async function fetchFreshCachedObd(terminalId: string): Promise<GpsObdSnapshot | null> {
  const cutoff = new Date(Date.now() - CACHED_OBD_FRESHNESS_MS);
  const snapshot = await prisma.gpsObdSnapshot.findFirst({
    where: {
      terminalId,
      reportedAt: { gt: cutoff },
    },
    orderBy: { reportedAt: 'desc' },
  });
  return snapshot;
}

/**
 * Build a Prisma update object from cached OBD snapshot data.
 * This is reused in both requestFullScan (initial backfill) and maybeCompleteScan (fallback).
 */
function buildScanReportUpdateFromCachedObd(cachedObd: GpsObdSnapshot): Prisma.GpsScanReportUncheckedUpdateInput {
  const data: Prisma.GpsScanReportUncheckedUpdateInput = {
    rpm: cachedObd.rpm,
    coolantTempC: cachedObd.coolantTempC,
    intakeAirTempC: cachedObd.intakeAirTempC,
    throttlePct: cachedObd.throttlePct,
    engineLoadPct: cachedObd.engineLoadPct,
    mafGps: cachedObd.mafGps,
    fuelRailPressureKpa: cachedObd.fuelPressureKpa,
    batteryVoltageMv: cachedObd.batteryVoltageMv,
    vehicleSpeedKmh: cachedObd.vehicleSpeedKmh,
  };
  if (cachedObd.extraPidsJson) {
    const extra = cachedObd.extraPidsJson as Record<string, unknown>;
    if (extra.fuelLevelPct !== undefined) {
      data.fuelLevelPct = new Prisma.Decimal(Number(extra.fuelLevelPct).toFixed(1));
    }
    if (extra.acceleratorPct !== undefined) {
      data.acceleratorPct = new Prisma.Decimal(Number(extra.acceleratorPct).toFixed(1));
    }
    if (extra.intakeManifoldKpa !== undefined) {
      data.intakeManifoldKpa = extra.intakeManifoldKpa as number;
    }
    if (extra.barometricKpa !== undefined) {
      data.barometricKpa = extra.barometricKpa as number;
    }
    if (extra.ambientTempC !== undefined) {
      data.ambientTempC = extra.ambientTempC as number;
    }
  }
  return data;
}

/**
 * Schedule the outer timeout. Cancelled by `maybeCompleteScan` when the
 * row transitions to COMPLETED or PARTIAL.
 */
function registerTimeout(report: GpsScanReport, timeoutMs: number): void {
  const handle = setTimeout(async () => {
    pending.delete(report.id);
    const updated = await prisma.gpsScanReport.updateMany({
      where: { id: report.id, status: 'PENDING' },
      data: {
        status: 'TIMED_OUT',
        completedAt: new Date(),
        errorText: `No response from device within ${timeoutMs / 1000} seconds.`,
      },
    });
    if (updated.count > 0) {
      void emitNotify({
        type: 'scan.failed',
        terminalId: report.terminalId,
        ownerUserId: report.ownerUserId,
        scanReportId: report.id,
        status: 'TIMED_OUT',
        reason: `No response from device within ${timeoutMs / 1000} seconds.`,
        at: new Date().toISOString(),
      });
    }
  }, timeoutMs);
  handle.unref?.();

  pending.set(report.id, {
    scanReportId: report.id,
    terminalId: report.terminalId,
    timeoutAt: Date.now() + timeoutMs,
    cancelTimeout: () => clearTimeout(handle),
    done: Promise.resolve(),
  });
}

/**
 * Decide whether we have enough data to flip the row to COMPLETED or PARTIAL. Strategy:
 *  - If we have BOTH DTC and OBD live data: complete immediately as COMPLETED
 *  - If we have ONLY DTC data: wait SECOND_SIGNAL_WAIT_MS, then check for cached OBD data
 *    - If cached OBD is fresh: use it and complete as COMPLETED
 *    - If no cached OBD: complete as PARTIAL
 *  - If we have ONLY OBD live data: wait SECOND_SIGNAL_WAIT_MS, then complete as COMPLETED
 *    (OBD live data is sufficient for a useful report even without DTC)
 *  - On outer timeout: TIMED_OUT
 */
async function maybeCompleteScan(
  scanReportId: string,
  arrived: 'dtc' | 'obd',
): Promise<void> {
  const row = await prisma.gpsScanReport.findUnique({ where: { id: scanReportId } });
  if (!row || row.status !== 'PENDING') return;

  const hasDtc = row.dtcCount !== null;
  const hasObd = hasLiveObdData(row);

  // Log that VIN alone does not count as live OBD data
  if (!hasObd && row.vin !== null) {
    logger.info('GPS scan: VIN is metadata only and is not counted as live OBD', {
      scanReportId,
      terminalId: row.terminalId,
      hasVin: true,
      hasLiveObd: false,
    });
  }

  if (hasDtc && hasObd) {
    // Full data: complete immediately as COMPLETED
    logger.info('GPS scan: completed with DTC + live OBD', {
      scanReportId,
      terminalId: row.terminalId,
    });
    await completeScan(scanReportId, 'COMPLETED');
    return;
  }

  // Partial: arm/refresh the "wait briefly for the other signal" timer.
  const entry = pending.get(scanReportId);

  // Cancel any existing second-signal timer before arming a new one.
  // Without this, duplicate F2 or OBD packets would stack multiple
  // overlapping 8 s timers all trying to complete the same scan.
  if (entry) {
    entry.cancelSecondSignalTimer?.();
    entry.cancelSecondSignalTimer = undefined;
  }

  const handle = setTimeout(async () => {
    const fresh = await prisma.gpsScanReport.findUnique({ where: { id: scanReportId } });
    if (!fresh || fresh.status !== 'PENDING') return;

    // Determine final status based on what we have
    const finalHasDtc = fresh.dtcCount !== null;
    const finalHasObd = hasLiveObdData(fresh);

    if (finalHasDtc && finalHasObd) {
      logger.info('GPS scan: completed with DTC + live OBD (after wait)', {
        scanReportId,
        terminalId: fresh.terminalId,
      });
      await completeScan(scanReportId, 'COMPLETED');
    } else if (finalHasObd) {
      // OBD live data alone is sufficient for a useful report
      logger.info('GPS scan: completed with live OBD only', {
        scanReportId,
        terminalId: fresh.terminalId,
      });
      await completeScan(scanReportId, 'COMPLETED');
    } else if (finalHasDtc) {
      // Only DTC data: check for cached OBD before marking as PARTIAL
      logger.info('GPS scan: checking for cached OBD data', {
        scanReportId,
        terminalId: fresh.terminalId,
      });
      const cachedObd = await fetchFreshCachedObd(fresh.terminalId);
      if (cachedObd) {
        logger.info('GPS scan: using cached OBD data before completing', {
          scanReportId,
          terminalId: fresh.terminalId,
          cachedAgeMs: Date.now() - cachedObd.reportedAt.getTime(),
        });
        const data = buildScanReportUpdateFromCachedObd(cachedObd);
        await prisma.gpsScanReport.update({
          where: { id: scanReportId },
          data,
        });
        await completeScan(scanReportId, 'COMPLETED');
      } else {
        logger.info('GPS scan: completed PARTIAL because no live OBD was available', {
          scanReportId,
          terminalId: fresh.terminalId,
        });
        await completeScan(scanReportId, 'PARTIAL');
      }
    } else {
      // Should not happen, but fail-safe
      logger.info('GPS scan: completing as PARTIAL (fail-safe)', {
        scanReportId,
        terminalId: fresh.terminalId,
      });
      await completeScan(scanReportId, 'PARTIAL');
    }
  }, SECOND_SIGNAL_WAIT_MS);
  handle.unref?.();

  // Store timer reference if entry exists (backend process)
  if (entry) {
    entry.cancelSecondSignalTimer = () => clearTimeout(handle);
  }

  logger.info('GPS scan: DTC attached, waiting for live OBD', {
    scanReportId,
    terminalId: row.terminalId,
    arrived,
    hasDtc,
    hasObd,
    waitMs: SECOND_SIGNAL_WAIT_MS,
    hasPendingEntry: !!entry,
  });
}

async function completeScan(scanReportId: string, status: 'COMPLETED' | 'PARTIAL' = 'COMPLETED'): Promise<void> {
  const result = await prisma.gpsScanReport.update({
    where: { id: scanReportId },
    data: {
      status,
      completedAt: new Date(),
      errorText: status === 'PARTIAL' ? 'Partial scan: no live OBD telemetry received. Only DTC/VIN data available.' : null,
    },
  });

  const entry = pending.get(scanReportId);
  entry?.cancelSecondSignalTimer?.();
  entry?.cancelTimeout();
  pending.delete(scanReportId);

  void emitNotify({
    type: status === 'PARTIAL' ? 'scan.partial' : 'scan.completed',
    terminalId: result.terminalId,
    ownerUserId: result.ownerUserId,
    scanReportId: result.id,
    status,
    promotedScanId: result.promotedScanId,
    at: result.completedAt!.toISOString(),
  });
}

async function failScanReport(scanReportId: string, reason: string): Promise<void> {
  const result = await prisma.gpsScanReport.updateMany({
    where: { id: scanReportId, status: 'PENDING' },
    data: {
      status: 'FAILED',
      completedAt: new Date(),
      errorText: reason,
    },
  });
  const entry = pending.get(scanReportId);
  entry?.cancelSecondSignalTimer?.();
  entry?.cancelTimeout();
  pending.delete(scanReportId);

  if (result.count > 0) {
    const row = await prisma.gpsScanReport.findUnique({ where: { id: scanReportId } });
    if (row) {
      void emitNotify({
        type: 'scan.failed',
        terminalId: row.terminalId,
        ownerUserId: row.ownerUserId,
        scanReportId: row.id,
        status: 'FAILED',
        reason,
        at: (row.completedAt ?? new Date()).toISOString(),
      });
    }
  }
}

// ── Used by the optional AI promotion route ────────────────────────────────

/**
 * Promote a COMPLETED GpsScanReport into a Scan + queue AI processing.
 *
 * Re-uses the existing BLE Scan pipeline by inserting a Scan row whose
 * `rawPayload` mirrors the BLE scanner's wire format. The background AI
 * worker that already watches the Scan table will pick it up.
 *
 * Idempotency: the unique constraint on `GpsScanReport.promotedScanId`
 * guarantees at most one Scan per GpsScanReport. On duplicate calls we
 * return the existing scanId with `reused=true`.
 */
export interface PromoteScanResult {
  scanId: string;
  reused: boolean;
}

export async function promoteToAi(
  scanReportId: string,
  requesterUserId: string,
  emailOverride?: string,
): Promise<PromoteScanResult> {
  const report = await prisma.gpsScanReport.findUnique({
    where: { id: scanReportId },
    include: { terminal: true },
  });
  if (!report) throw new AppError('Scan report not found', 404);
  if (report.status !== 'COMPLETED' && report.status !== 'PARTIAL') {
    throw new AppError('Scan is not yet complete', 409);
  }
  if (report.promotedScanId) {
    return { scanId: report.promotedScanId, reused: true };
  }
  if (!report.vin) {
    throw new AppError('Cannot run AI report without a VIN', 400);
  }

  // We need an email so the background pipeline can mail the resulting PDF.
  // If an emailOverride is supplied (e.g. admin requesting the report) we
  // use that directly; otherwise we look up the requester's profile email.
  let recipientEmail = emailOverride;
  if (!recipientEmail) {
    const user = await prisma.user.findUnique({
      where: { id: requesterUserId },
      select: { email: true },
    });
    if (!user?.email) {
      throw new AppError('No email address on file for this account', 400);
    }
    recipientEmail = user.email;
  }

  // Mirror the BLE scanner's rawPayload shape so the worker can re-use the
  // same parser path. We omit fields we genuinely don't have rather than
  // fabricating zeros.
  const rawPayload = {
    vin: report.vin,
    mileage: report.mileageKm ? Number(report.mileageKm) * 0.621371 : null,
    milOn: report.milOn ?? false,
    dtcCount: report.dtcCount ?? 0,
    storedDtcCodes: report.storedDtcCodes,
    pendingDtcCodes: report.pendingDtcCodes,
    permanentDtcCodes: report.permanentDtcCodes,
    distanceSinceCleared: null,
    timeSinceCleared: report.runtimeSinceStartSec,
    warmupsSinceCleared: report.warmupsSinceClear,
    distanceWithMilOn: report.distanceWithMilKm ? Number(report.distanceWithMilKm) : null,
    fuelSystemStatus: report.fuelSystemStatus,
    secondaryAirStatus: report.secondaryAirStatus,
    milStatusByEcu: null,
    rpm: report.rpm,
    coolantTempC: report.coolantTempC,
    fuelLevelPct: report.fuelLevelPct ? Number(report.fuelLevelPct) : null,
    source: 'gps-d450',
    scanReportId: report.id,
  };

  const scan = await prisma.scan.create({
    data: {
      userId: requesterUserId,
      vin: report.vin,
      mileage: rawPayload.mileage ?? undefined,
      milOn: report.milOn ?? false,
      dtcCount: report.dtcCount ?? 0,
      storedDtcCodes: report.storedDtcCodes,
      pendingDtcCodes: report.pendingDtcCodes,
      permanentDtcCodes: report.permanentDtcCodes,
      distanceWithMilOn: report.distanceWithMilKm ? Number(report.distanceWithMilKm) : undefined,
      warmupsSinceCleared: report.warmupsSinceClear ?? undefined,
      vehicleYear: report.vehicleYear ?? undefined,
      vehicleMake: report.vehicleMake ?? undefined,
      vehicleModel: report.vehicleModel ?? undefined,
      scanDate: report.completedAt ?? new Date(),
      rawPayload,
      status: 'RECEIVED',
    },
  });

  await prisma.gpsScanReport.update({
    where: { id: report.id },
    data: { promotedScanId: scan.id },
  });

  // Kick off the existing BLE background pipeline (decode VIN → AI → PDF →
  // email). Errors land in the Scan row's status; we deliberately don't
  // await — the user is polling the Scan row from the mobile/dashboard side.
  void processScanInBackground(scan.id, requesterUserId, recipientEmail).catch((err) => {
    logger.error('Background AI processing failed for promoted GPS scan', {
      scanId: scan.id,
      scanReportId: report.id,
      error: (err as Error).message,
    });
  });

  return { scanId: scan.id, reused: false };
}
