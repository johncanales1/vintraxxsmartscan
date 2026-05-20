/**
 * gps.controller — HTTP-shape adapter for GPS endpoints.
 *
 * Following the project convention (see `admin.controller.ts`), every handler
 * is thin: validate, delegate to a service, format the response. Errors flow
 * through `next(err)` to the shared `errorHandler`.
 */

import { Request, Response, NextFunction } from 'express';
import * as terminalService from '../services/gps-terminal.service';
import * as statsService from '../services/gps-stats.service';
import * as alarmService from '../services/gps-alarm.service';
import * as dtcService from '../services/gps-dtc.service';
import * as tripService from '../services/gps-trip-query.service';
import * as commandService from '../services/gps-command.service';
import * as pushService from '../services/push.service';
import * as gpsAdminService from '../services/gps-admin.service';
import * as bulkDeleteService from '../services/gps-bulk-delete.service';
import { promoteDtcEventToScan } from '../services/gps-dtc-promote.service';
import * as scanReportService from '../services/gps-scan-report.service';
import { generateGpsScanReportPdf } from '../services/gps-scan-report-pdf.service';
import { sendGpsScanReportEmail } from '../services/email.service';
import { AppError } from '../middleware/errorHandler';
import prisma from '../config/db';

// ── Admin: terminals ────────────────────────────────────────────────────────

export async function adminListTerminals(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 50);
    const filter = req.query.filter as
      | 'online'
      | 'offline'
      | 'unpaired'
      | 'never_connected'
      | 'revoked'
      | undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    // The UserDetailModal "GPS Devices" section uses ?ownerUserId=<uuid> to
    // scope the list to a specific owner. Schema-validated upstream so we
    // can pass it straight through.
    const ownerUserId =
      typeof req.query.ownerUserId === 'string' ? req.query.ownerUserId : undefined;

    const result = await terminalService.listTerminals({
      page,
      limit,
      filter,
      search,
      ownerUserId,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function adminGetTerminal(req: Request, res: Response, next: NextFunction) {
  try {
    const terminal = await terminalService.getTerminalDetail(req.params.id as string);
    res.json({ success: true, terminal });
  } catch (err) {
    next(err);
  }
}

export async function adminProvisionTerminal(req: Request, res: Response, next: NextFunction) {
  try {
    const terminal = await terminalService.provisionTerminal(req.body);
    res.status(201).json({ success: true, terminal });
  } catch (err) {
    next(err);
  }
}

export async function adminReassignTerminal(req: Request, res: Response, next: NextFunction) {
  try {
    const { ownerUserId } = req.body as { ownerUserId: string | null };
    const terminal = await terminalService.reassignTerminalOwner(
      req.params.id as string,
      ownerUserId,
    );
    res.json({ success: true, terminal });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /admin/gps/terminals/:id — edit terminal metadata.
 * Request body is validated by `updateTerminalSchema`, so anything that
 * reaches here is already type-shaped for the service layer.
 */
export async function adminUpdateTerminal(req: Request, res: Response, next: NextFunction) {
  try {
    const terminal = await terminalService.updateTerminalMetadata(
      req.params.id as string,
      req.body,
    );
    res.json({ success: true, terminal });
  } catch (err) {
    next(err);
  }
}

export async function adminUnpairTerminal(req: Request, res: Response, next: NextFunction) {
  try {
    const terminal = await terminalService.unpairTerminal(req.params.id as string);
    res.json({ success: true, terminal });
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteTerminal(req: Request, res: Response, next: NextFunction) {
  try {
    await terminalService.deleteTerminal(req.params.id as string);
    res.json({ success: true, message: 'Terminal deleted' });
  } catch (err) {
    next(err);
  }
}

// ── Admin: per-terminal latest / locations / OBD ────────────────────────────

/**
 * Latest known location for any terminal. Returns `null` when the terminal
 * has never reported (NEVER_CONNECTED). Powers both the FleetMap markers
 * and the TerminalDetailModal Live tab.
 */
export async function adminGetTerminalLatest(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // Service now returns `{ location, obd }`. The legacy admin clients only
    // read `.location`; the new Overview pane reads both. Spreading keeps
    // the response shape forward-compatible with future fields.
    const result = await gpsAdminService.adminGetLatestLocation(
      req.params.id as string,
    );
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function adminListTerminalLocations(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await gpsAdminService.adminGetLocationHistory({
      terminalId: req.params.id as string,
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 500),
      since: typeof req.query.since === 'string' ? new Date(req.query.since) : undefined,
      until: typeof req.query.until === 'string' ? new Date(req.query.until) : undefined,
      minSpeedKmh:
        typeof req.query.minSpeedKmh === 'string'
          ? Number(req.query.minSpeedKmh)
          : undefined,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function adminListTerminalObd(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await gpsAdminService.adminGetObdHistory({
      terminalId: req.params.id as string,
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 500),
      since: typeof req.query.since === 'string' ? new Date(req.query.since) : undefined,
      until: typeof req.query.until === 'string' ? new Date(req.query.until) : undefined,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

// ── Admin: overview stats ───────────────────────────────────────────────────

export async function adminOverviewStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await statsService.getOverviewCounts();
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
}

// ── User: own fleet + telemetry (Phase 1) ───────────────────────────────────

export async function myTerminals(req: Request, res: Response, next: NextFunction) {
  try {
    const terminals = await terminalService.getMyTerminals(req.user!.userId);
    res.json({ success: true, terminals });
  } catch (err) {
    next(err);
  }
}

export async function myTerminalDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const terminal = await terminalService.getMyTerminalDetail(
      req.user!.userId,
      req.params.id as string,
    );
    res.json({ success: true, terminal });
  } catch (err) {
    next(err);
  }
}

export async function myLatestLocation(req: Request, res: Response, next: NextFunction) {
  try {
    const location = await terminalService.getLatestLocation(
      req.user!.userId,
      req.params.id as string,
    );
    res.json({ success: true, location });
  } catch (err) {
    next(err);
  }
}

export async function myLocationHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const since = typeof req.query.since === 'string' ? new Date(req.query.since) : undefined;
    const until = typeof req.query.until === 'string' ? new Date(req.query.until) : undefined;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 500);
    const minSpeedKmh =
      typeof req.query.minSpeedKmh === 'string'
        ? Number(req.query.minSpeedKmh)
        : undefined;

    const result = await terminalService.getLocationHistory({
      userId: req.user!.userId,
      terminalId: req.params.id as string,
      since,
      until,
      page,
      limit,
      minSpeedKmh,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

// ── Phase 2: alarms + DTC events ─────────────────────────────────────────────

/**
 * Shared query parser; both user and admin lists accept the same params.
 * The admin-only fields (alarmType, ownerUserId, search) are accepted on
 * the user route too but the service layer ignores them — keeping a single
 * parser avoids drift and the cost is just a few unused string copies.
 */
function parseAlarmListQuery(req: Request) {
  return {
    page: Number(req.query.page ?? 1),
    limit: Number(req.query.limit ?? 50),
    terminalId:
      typeof req.query.terminalId === 'string' ? req.query.terminalId : undefined,
    severity: req.query.severity as
      | 'INFO'
      | 'WARNING'
      | 'CRITICAL'
      | undefined,
    alarmType: typeof req.query.alarmType === 'string' ? req.query.alarmType : undefined,
    state: req.query.state as 'open' | 'closed' | undefined,
    ack:
      req.query.ack === 'true' ? true : req.query.ack === 'false' ? false : undefined,
    ownerUserId:
      typeof req.query.ownerUserId === 'string' ? req.query.ownerUserId : undefined,
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    since: typeof req.query.since === 'string' ? new Date(req.query.since) : undefined,
    until: typeof req.query.until === 'string' ? new Date(req.query.until) : undefined,
  };
}

function parseDtcListQuery(req: Request) {
  return {
    page: Number(req.query.page ?? 1),
    limit: Number(req.query.limit ?? 50),
    terminalId:
      typeof req.query.terminalId === 'string' ? req.query.terminalId : undefined,
    vin: typeof req.query.vin === 'string' ? req.query.vin.toUpperCase() : undefined,
    milOnly: req.query.milOnly === 'true',
    since: typeof req.query.since === 'string' ? new Date(req.query.since) : undefined,
    until: typeof req.query.until === 'string' ? new Date(req.query.until) : undefined,
  };
}

// ── User-scoped ─────────────────────────────────────────────────────────────

export async function myAlarms(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await alarmService.listAlarms({
      ...parseAlarmListQuery(req),
      userId: req.user!.userId,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function myAlarmDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const alarm = await alarmService.getAlarmDetail({
      alarmId: req.params.id as string,
      userId: req.user!.userId,
    });
    res.json({ success: true, alarm });
  } catch (err) {
    next(err);
  }
}

export async function myAckAlarm(req: Request, res: Response, next: NextFunction) {
  try {
    const note = (req.body?.note as string | undefined) ?? undefined;
    const alarm = await alarmService.acknowledgeAlarm({
      alarmId: req.params.id as string,
      userId: req.user!.userId,
      note,
    });
    res.json({ success: true, alarm });
  } catch (err) {
    next(err);
  }
}

export async function myDtcEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await dtcService.listDtcEvents({
      ...parseDtcListQuery(req),
      userId: req.user!.userId,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function myDtcEventDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const event = await dtcService.getDtcEventDetail({
      dtcEventId: req.params.id as string,
      userId: req.user!.userId,
    });
    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
}

// ── Admin-scoped ────────────────────────────────────────────────────────────

export async function adminListAlarms(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await alarmService.listAlarms({
      ...parseAlarmListQuery(req),
      admin: true,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function adminGetAlarm(req: Request, res: Response, next: NextFunction) {
  try {
    const alarm = await alarmService.getAlarmDetail({
      alarmId: req.params.id as string,
      admin: true,
    });
    res.json({ success: true, alarm });
  } catch (err) {
    next(err);
  }
}

export async function adminAckAlarm(req: Request, res: Response, next: NextFunction) {
  try {
    const note = (req.body?.note as string | undefined) ?? undefined;
    const alarm = await alarmService.acknowledgeAlarm({
      alarmId: req.params.id as string,
      adminId: req.admin!.adminId,
      note,
    });
    res.json({ success: true, alarm });
  } catch (err) {
    next(err);
  }
}

/**
 * Bulk-acknowledge alarms in one round-trip. Best-effort — partial failure
 * returns 200 with `count` reflecting the actual number ack'd and the
 * skipped ids enumerated for client-side retry. The audit middleware
 * records ONE row for the bulk POST; per-alarm provenance still goes
 * onto each GpsAlarm row's `acknowledgedByAdminId`.
 */
export async function adminBulkAckAlarms(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { ids, note } = req.body as { ids: string[]; note?: string };
    const result = await gpsAdminService.bulkAcknowledgeAlarms({
      ids,
      adminId: req.admin!.adminId,
      note,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

// Admin-scoped: analyze DTC event and run the AI pipeline.
export async function adminListDtcEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await dtcService.listDtcEvents({
      ...parseDtcListQuery(req),
      admin: true,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function adminGetDtcEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const event = await dtcService.getDtcEventDetail({
      dtcEventId: req.params.id as string,
      admin: true,
    });
    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
}

/**
 * Promote a GPS DTC event into a Scan and run the AI pipeline on the
 * owner's behalf. The admin equivalent of `analyzeDtcEvent` — the
 * underlying service is already idempotent, so re-clicking returns the
 * existing scanId with `reused:true`.
 *
 * The event MUST have a known owner (ownerUserId set). Unowned events
 * (terminal that's never been provisioned) return 422 because we'd have
 * nowhere to attribute the resulting Scan row.
 */
export async function adminAnalyzeDtcEvent(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const dtcEventId = req.params.id as string;

    const event = await prisma.gpsDtcEvent.findUnique({
      where: { id: dtcEventId },
      select: { id: true, ownerUserId: true },
    });
    if (!event) throw new AppError('DTC event not found', 404);
    if (!event.ownerUserId) {
      throw new AppError(
        'DTC event has no owner — re-assign the terminal before analysing',
        422,
      );
    }

    // CRITICAL #3: trust the promoter's `reused` flag (now race-safe via
    // the @unique on Scan.gpsDtcEventId + P2002 catch). The previous
    // pre-check was non-atomic — two simultaneous admin clicks could both
    // see existing===null and create duplicate scans.
    const result = await promoteDtcEventToScan({
      dtcEventId,
      userId: event.ownerUserId,
    });

    res.json({
      success: true,
      scanId: result.scanId,
      reused: result.reused,
    });
  } catch (err) {
    next(err);
  }
}

// ── Phase 3: trips + daily stats ────────────────────────────────────────────

function parseTripListQuery(req: Request) {
  return {
    page: Number(req.query.page ?? 1),
    limit: Number(req.query.limit ?? 50),
    terminalId:
      typeof req.query.terminalId === 'string' ? req.query.terminalId : undefined,
    status: req.query.status as 'OPEN' | 'CLOSED' | undefined,
    since: typeof req.query.since === 'string' ? new Date(req.query.since) : undefined,
    until: typeof req.query.until === 'string' ? new Date(req.query.until) : undefined,
  };
}

/**
 * Reusable ownership check for the user-scoped per-terminal endpoints. Throws
 * 404 (not 403) so we don't leak existence of terminal IDs the user doesn't
 * own.
 */
async function assertTerminalOwnership(userId: string, terminalId: string) {
  const owns = await prisma.gpsTerminal.findFirst({
    where: { id: terminalId, ownerUserId: userId },
    select: { id: true },
  });
  if (!owns) throw new AppError('Terminal not found', 404);
}

// User-scoped: trips for a single terminal owned by the caller.
export async function myTerminalTrips(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const terminalId = req.params.id as string;
    await assertTerminalOwnership(userId, terminalId);

    const result = await tripService.listTrips({
      userId,
      terminalId,
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 50),
      status: req.query.status as 'OPEN' | 'CLOSED' | undefined,
      since: typeof req.query.since === 'string' ? new Date(req.query.since) : undefined,
      until: typeof req.query.until === 'string' ? new Date(req.query.until) : undefined,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function myTerminalTripDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const terminalId = req.params.id as string;
    const tripId = req.params.tripId as string;
    await assertTerminalOwnership(userId, terminalId);

    const trip = await tripService.getTripDetail({ tripId, userId });
    // Defence in depth: if a malicious id-guesser supplies a trip from a
    // different terminal, refuse it (would otherwise leak that the trip
    // exists for some terminal).
    if (trip.terminalId !== terminalId) {
      throw new AppError('Trip not found', 404);
    }
    res.json({ success: true, trip });
  } catch (err) {
    next(err);
  }
}

// User-scoped: daily stats range for a single terminal owned by the caller.
export async function myTerminalDailyStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const terminalId = req.params.id as string;
    await assertTerminalOwnership(userId, terminalId);

    const since =
      typeof req.query.since === 'string'
        ? new Date(req.query.since)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const until =
      typeof req.query.until === 'string' ? new Date(req.query.until) : new Date();

    const result = await tripService.listDailyStats({
      userId,
      terminalId,
      since,
      until,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

// Admin-scoped: trips across all terminals.
export async function adminListTrips(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await tripService.listTrips({
      ...parseTripListQuery(req),
      admin: true,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function adminGetTrip(req: Request, res: Response, next: NextFunction) {
  try {
    const trip = await tripService.getTripDetail({
      tripId: req.params.id as string,
      admin: true,
    });
    res.json({ success: true, trip });
  } catch (err) {
    next(err);
  }
}

// Admin-scoped: enqueue a downstream command for one terminal.
export async function adminEnqueueCommand(req: Request, res: Response, next: NextFunction) {
  try {
    const terminalId = req.params.id as string;
    const adminId = req.admin!.adminId;
    const body = req.body as
      | { kind: 'locate' }
      | { kind: 'read-params' }
      | { kind: 'clear-dtcs' }
      | { kind: 'set-params'; setParams: Array<{ id: number; value: number | string }> }
      | { kind: 'terminal-control'; controlType: number };

    // Destructive control commands (0x8105) are super-admin only. We gate
    // here rather than at the route layer because all other command kinds
    // share this same URL and the discriminator only resolves after Zod.
    if (body.kind === 'terminal-control' && !req.admin?.superAdmin) {
      throw new AppError('Super-admin privilege required for terminal-control', 403);
    }

    const cmd = await commandService.enqueueCommand({
      terminalId,
      adminId,
      kind: body.kind,
      setParams: body.kind === 'set-params' ? body.setParams : undefined,
      controlType:
        body.kind === 'terminal-control' ? body.controlType : undefined,
    });
    res.status(201).json({ success: true, command: cmd });
  } catch (err) {
    next(err);
  }
}

export async function adminListCommands(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await commandService.listCommands({
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 50),
      terminalId:
        typeof req.query.terminalId === 'string' ? req.query.terminalId : undefined,
      status: req.query.status as
        | 'QUEUED' | 'SENT' | 'ACKED' | 'FAILED' | 'EXPIRED' | undefined,
      adminId: typeof req.query.adminId === 'string' ? req.query.adminId : undefined,
      since: typeof req.query.since === 'string' ? new Date(req.query.since) : undefined,
      until: typeof req.query.until === 'string' ? new Date(req.query.until) : undefined,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function adminGetCommand(req: Request, res: Response, next: NextFunction) {
  try {
    const cmd = await commandService.getCommandDetail(req.params.id as string);
    res.json({ success: true, command: cmd });
  } catch (err) {
    next(err);
  }
}

// Admin-scoped: daily stats across all terminals (or one if filter is set).
export async function adminListDailyStats(req: Request, res: Response, next: NextFunction) {
  try {
    const since =
      typeof req.query.since === 'string'
        ? new Date(req.query.since)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const until =
      typeof req.query.until === 'string' ? new Date(req.query.until) : new Date();

    const result = await tripService.listDailyStats({
      admin: true,
      terminalId:
        typeof req.query.terminalId === 'string' ? req.query.terminalId : undefined,
      since,
      until,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

// ── Phase 5 (mobile): push tokens, owner actions, AI bridge ─────────────────

/**
 * Mobile push-token registration. Idempotent — re-calling with the same
 * token simply bumps `lastSeenAt` and clears `disabledAt`.
 */
export async function myRegisterPushToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.userId;
    const { platform, token, appVersion } = req.body as {
      platform: 'ios' | 'android';
      token: string;
      appVersion?: string;
    };
    await pushService.registerPushToken({ userId, platform, token, appVersion });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/**
 * Soft-disable a token (logout-time). Always 200 even if the token wasn't
 * found — the mobile client should treat both cases the same way.
 */
export async function myDeletePushToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.userId;
    const { token } = req.body as { token: string };
    const removed = await pushService.disablePushToken({ userId, token });
    res.json({ success: true, removed });
  } catch (err) {
    next(err);
  }
}

/**
 * Owner-only rename of a terminal's nickname. We trust the schema regex on
 * `id` and use updateMany to enforce `ownerUserId` in the same SQL — no
 * separate "is the owner?" round-trip.
 */
export async function myRenameTerminal(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const { nickname } = req.body as { nickname: string };

    const result = await prisma.gpsTerminal.updateMany({
      where: { id, ownerUserId: userId },
      data: { nickname },
    });
    if (result.count === 0) {
      throw new AppError('Terminal not found', 404);
    }
    const terminal = await prisma.gpsTerminal.findFirst({
      where: { id, ownerUserId: userId },
    });
    res.json({ success: true, terminal });
  } catch (err) {
    next(err);
  }
}

/**
 * Owner-only "request live position" — enqueues a `locate` (0x8201) command
 * on behalf of the calling user. The gateway picks it up via pg_notify the
 * same way it picks up admin-issued commands.
 */
export async function myLocateTerminal(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    // Ownership pre-check so we 404 instead of leaking IDs.
    const owns = await prisma.gpsTerminal.findFirst({
      where: { id, ownerUserId: userId },
      select: { id: true },
    });
    if (!owns) throw new AppError('Terminal not found', 404);

    const cmd = await commandService.enqueueCommand({
      terminalId: id,
      userId,
      kind: 'locate',
    });
    res.status(202).json({
      success: true,
      command: { id: cmd.id, status: cmd.status, createdAt: cmd.createdAt },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Owner-only DTC-event → Scan promotion (the AI bridge). Returns
 * `{ scanId }`; the mobile client then polls `/scan/report/:scanId` using
 * the existing flow. `reused: true` means another request already promoted
 * this event and we returned the existing scan's id (idempotent).
 */
export async function myAnalyzeDtcEvent(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const result = await promoteDtcEventToScan({ dtcEventId: id, userId });
    // Always 202: even reused scans may still be in `processing` state and
    // the client must poll `/scan/report/:scanId` regardless.
    res.status(202).json({
      success: true,
      scanId: result.scanId,
      reused: result.reused,
    });
  } catch (err) {
    next(err);
  }
}

// ── Admin: audit log read ──────────────────────────────────────────────────

/**
 * Paginated read of the AdminAuditLog table that the audit middleware
 * already populates on every admin write. Powers the Settings → Audit Log
 * tab. Filters: adminId, targetType, targetId, action substring, status
 * class (1xx..5xx), date range.
 */
export async function adminListAuditLogs(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await gpsAdminService.listAuditLogs({
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 50),
      adminId:
        typeof req.query.adminId === 'string' ? req.query.adminId : undefined,
      targetType:
        typeof req.query.targetType === 'string'
          ? req.query.targetType
          : undefined,
      targetId:
        typeof req.query.targetId === 'string' ? req.query.targetId : undefined,
      action:
        typeof req.query.action === 'string' ? req.query.action : undefined,
      statusClass:
        typeof req.query.statusClass === 'string'
          ? Number(req.query.statusClass)
          : undefined,
      since:
        typeof req.query.since === 'string' ? new Date(req.query.since) : undefined,
      until:
        typeof req.query.until === 'string' ? new Date(req.query.until) : undefined,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /admin/audit-logs/:id — wipe a single audit entry.
 *
 * Intentionally destructive. The adminAuditMiddleware records THIS delete
 * too (see its `res.on('finish')` hook), so a super-admin can't silently
 * erase history — the wipe itself gets logged with its target id in the
 * path. Still footgun-y enough that we gate it behind `requireSuperAdmin`
 * at the route layer.
 */
export async function adminDeleteAuditLog(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;
    const existing = await prisma.adminAuditLog.findUnique({ where: { id } });
    if (!existing) throw new AppError('Audit log entry not found', 404);
    await prisma.adminAuditLog.delete({ where: { id } });
    res.json({ success: true, message: 'Audit log entry deleted' });
  } catch (err) {
    next(err);
  }
}

// ── Admin: bulk-delete handlers (super-admin only) ──────────────────────────

/**
 * Shared body-shape for every bulk-delete handler:
 *   request:  POST  /admin/gps/<resource>/bulk-delete  { ids: string[] }
 *   response: { success: true, deleted: number }
 *
 * The Zod validator (`adminBulkDeleteSchema`) caps `ids.length ≤ 1000` and
 * enforces UUID shape, so the controllers can read straight off `req.body`
 * without re-validating.
 */
function pickIds(req: Request): string[] {
  const body = (req.body as { ids?: unknown }) ?? {};
  return Array.isArray(body.ids) ? (body.ids as string[]) : [];
}

export async function adminBulkDeleteLocations(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await bulkDeleteService.bulkDeleteLocations(pickIds(req));
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function adminBulkDeleteObd(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await bulkDeleteService.bulkDeleteObd(pickIds(req));
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function adminBulkDeleteAlarms(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await bulkDeleteService.bulkDeleteAlarms(pickIds(req));
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function adminBulkDeleteDtcEvents(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await bulkDeleteService.bulkDeleteDtcEvents(pickIds(req));
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function adminBulkDeleteTrips(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await bulkDeleteService.bulkDeleteTrips(pickIds(req));
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function adminBulkDeleteCommands(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await bulkDeleteService.bulkDeleteCommands(pickIds(req));
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function adminBulkDeleteTerminals(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await bulkDeleteService.bulkDeleteTerminals(pickIds(req));
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

// ── GPS Full Scan Report (Refresh / Email / AI promotion) ───────────────────

/**
 * Owner-only "Run full scan" trigger. Creates a PENDING GpsScanReport, fires
 * 0x8103 set-params + 0x8104 query against the terminal, and returns the
 * scanReportId so the client can poll / subscribe.
 */
export async function myRequestScanReport(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.userId;
    const terminalId = req.params.id as string;
    await assertTerminalOwnership(userId, terminalId);

    const result = await scanReportService.requestFullScan({
      terminalId,
      requestedByUserId: userId,
    });
    res.status(202).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

/**
 * Owner-only read of a single GpsScanReport row. 404 on cross-user access.
 * Returns the row verbatim — Prisma serialises Decimal fields as strings, so
 * the client converts them when it renders the KPI tiles.
 */
export async function myGetScanReport(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const report = await scanReportService.getScanReport(id);
    if (!report || report.ownerUserId !== userId) {
      throw new AppError('Scan report not found', 404);
    }
    res.json({ success: true, report });
  } catch (err) {
    next(err);
  }
}

/**
 * Owner-only list of recent scan reports for a terminal (newest first).
 * Used to populate the "previous scans" rail on the Full Report screen.
 */
export async function myListScanReports(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.userId;
    const terminalId = req.params.id as string;
    await assertTerminalOwnership(userId, terminalId);

    const limit = Number(req.query.limit ?? 20);
    const reports = await scanReportService.listScanReports({ terminalId, limit });
    res.json({ success: true, reports });
  } catch (err) {
    next(err);
  }
}

/**
 * Owner-only "Email PDF" — renders the GPS scan report to a PDF and emails
 * it to the calling user's account (or an override address). The PDF is
 * deliberately the raw-OBD shape (no AI write-up); the user can still tap
 * "Generate AI Report" if they want the deeper analysis.
 */
export async function myEmailScanReport(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const overrideEmail = (req.body as { email?: string } | undefined)?.email;

    const report = await scanReportService.getScanReport(id);
    if (!report || report.ownerUserId !== userId) {
      throw new AppError('Scan report not found', 404);
    }
    if (report.status !== 'COMPLETED' && report.status !== 'PARTIAL') {
      throw new AppError('Scan is not yet complete', 409);
    }

    const [terminal, user] = await Promise.all([
      prisma.gpsTerminal.findUnique({ where: { id: report.terminalId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, fullName: true },
      }),
    ]);
    if (!terminal) throw new AppError('Terminal not found', 404);

    const toEmail = overrideEmail ?? user?.email;
    if (!toEmail) {
      throw new AppError('No email address on file', 400);
    }

    const pdfPath = await generateGpsScanReportPdf({
      report,
      terminal,
      ownerName: user?.fullName ?? null,
      ownerEmail: toEmail,
    });

    const vehicleLabel =
      [report.vehicleYear, report.vehicleMake, report.vehicleModel].filter(Boolean).join(' ') ||
      terminal.nickname ||
      `Device ${(terminal.deviceIdentifier ?? '').slice(-6)}`;

    await sendGpsScanReportEmail({
      toEmail,
      pdfPath,
      vehicleLabel,
      vin: report.vin,
      reportedAt: report.completedAt ?? report.requestedAt,
      dtcCount: report.dtcCount ?? 0,
      milOn: report.milOn === true,
    });

    res.json({
      success: true,
      sentTo: toEmail,
      // Path is server-local — the client never opens it directly, but it's
      // useful for the success toast ("PDF ready") if a future endpoint
      // serves the file via signed URL.
      pdfPath,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Owner-only "Generate AI Report" — promote a COMPLETED GpsScanReport into
 * the BLE Scan pipeline so the existing AI worker can analyse it. The mobile
 * client then polls `/scan/report/:scanId` like any other AI report.
 */
export async function myPromoteScanToAi(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const report = await scanReportService.getScanReport(id);
    if (!report || report.ownerUserId !== userId) {
      throw new AppError('Scan report not found', 404);
    }
    const result = await scanReportService.promoteToAi(id, userId);
    res.status(202).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

// ── Admin: GPS Full Scan Reports ──────────────────────────────────────────────

/**
 * Admin "Run full scan" trigger — no ownership check. Passes the admin's id
 * as `requestedByAdminId` so the audit trail reflects who initiated it.
 */
export async function adminRequestScanReport(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const adminId = req.admin!.adminId;
    const terminalId = req.params.id as string;
    const result = await scanReportService.requestFullScan({
      terminalId,
      requestedByAdminId: adminId,
    });
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin list of scan reports for a terminal (newest first). No ownership filter.
 */
export async function adminListScanReports(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const terminalId = req.params.id as string;
    const limit = Number(req.query.limit ?? 20);
    const reports = await scanReportService.listScanReports({ terminalId, limit });
    res.json({ success: true, reports });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin read of a single GpsScanReport — no ownership guard.
 */
export async function adminGetScanReport(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;
    const report = await scanReportService.getScanReport(id);
    if (!report) throw new AppError('Scan report not found', 404);
    res.json({ success: true, report });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin "Email PDF" — renders + emails the raw GPS scan PDF. Sends to the
 * terminal owner or an override email address.
 */
export async function adminEmailScanReport(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;
    const overrideEmail = (req.body as { email?: string } | undefined)?.email;

    const report = await scanReportService.getScanReport(id);
    if (!report) throw new AppError('Scan report not found', 404);
    if (report.status !== 'COMPLETED' && report.status !== 'PARTIAL') {
      throw new AppError('Scan report is not yet complete', 400);
    }

    const terminal = await prisma.gpsTerminal.findUnique({
      where: { id: report.terminalId },
    });
    if (!terminal) throw new AppError('Terminal not found', 404);

    const user = report.ownerUserId
      ? await prisma.user.findUnique({
          where: { id: report.ownerUserId },
          select: { email: true, fullName: true },
        })
      : null;

    const toEmail = overrideEmail || user?.email;
    if (!toEmail) throw new AppError('No email address on file', 400);

    const pdfPath = await generateGpsScanReportPdf({
      report,
      terminal,
      ownerName: user?.fullName ?? null,
      ownerEmail: toEmail,
    });

    const vehicleLabel =
      [report.vehicleYear, report.vehicleMake, report.vehicleModel]
        .filter(Boolean)
        .join(' ') ||
      terminal.nickname ||
      `Device ${(terminal.deviceIdentifier ?? '').slice(-6)}`;

    await sendGpsScanReportEmail({
      toEmail,
      pdfPath,
      vehicleLabel,
      vin: report.vin,
      reportedAt: report.completedAt ?? report.requestedAt,
      dtcCount: report.dtcCount ?? 0,
      milOn: report.milOn === true,
    });

    res.json({ success: true, sentTo: toEmail, pdfPath });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin "Generate AI Report" — promote a COMPLETED GpsScanReport into the
 * BLE Scan pipeline. Uses the terminal ownerUserId for the Scan row but
 * emails the resulting PDF to the admin who initiated the action.
 */
export async function adminPromoteScanToAi(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;
    const adminId = req.admin!.adminId;

    const report = await scanReportService.getScanReport(id);
    if (!report) throw new AppError('Scan report not found', 404);
    if (report.status !== 'COMPLETED' && report.status !== 'PARTIAL') {
      throw new AppError('Scan report is not yet complete', 400);
    }
    if (!report.ownerUserId) {
      throw new AppError('Terminal has no owner — cannot promote to AI', 400);
    }

    // Look up the admin's email so the PDF goes to them, not the vehicle owner.
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { email: true },
    });
    const adminEmail = admin?.email ?? undefined;

    const result = await scanReportService.promoteToAi(id, report.ownerUserId, adminEmail);
    res.status(202).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin bulk-delete scan reports (super-admin only).
 */
export async function adminBulkDeleteScanReports(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { ids } = req.body as { ids: string[] };
    const deleted = await bulkDeleteService.bulkDeleteScanReports(ids);
    res.json({ success: true, deleted });
  } catch (err) {
    next(err);
  }
}
