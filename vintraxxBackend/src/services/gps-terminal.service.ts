/**
 * gps-terminal.service — admin-scoped CRUD for GpsTerminal rows.
 *
 * No request/response objects here — these helpers are the database boundary.
 * Controllers translate HTTP into calls into this module.
 */

import prisma from '../config/db';
import { AppError } from '../middleware/errorHandler';

interface ProvisionInput {
  /**
   * Canonical JT/T 808 terminal identifier — the value the device transmits
   * in the BCD[6] header field of every packet. Required. See the
   * `provisionTerminalSchema` Zod schema for the validation regex.
   */
  deviceIdentifier: string;
  /** Optional 15-digit IMEI (2019-spec metadata only). */
  imei?: string;
  phoneNumber?: string;
  iccid?: string;
  manufacturerId?: string;
  terminalModel?: string;
  hardwareVersion?: string;
  firmwareVersion?: string;
  vehicleVin?: string;
  vehicleYear?: number;
  vehicleMake?: string;
  vehicleModel?: string;
  nickname?: string;
  /** License plate text. Persisted on the GpsTerminal row; surfaced in the
   *  admin terminal list and the search filter. */
  plateNumber?: string;
  ownerUserId?: string | null;
}

/**
 * Pre-create a GpsTerminal row before the physical device first connects.
 * The actual auth code is generated later, in the gateway, when the device
 * sends its 0x0100 — we deliberately leave it null here so the value on disk
 * is never stale.
 *
 * Throws 409 if the device identifier (or, when provided, the IMEI) already
 * exists; 404 if `ownerUserId` is set but the user can't be found.
 */
export async function provisionTerminal(input: ProvisionInput) {
  const existingByIdentifier = await prisma.gpsTerminal.findUnique({
    where: { deviceIdentifier: input.deviceIdentifier },
  });
  if (existingByIdentifier) {
    throw new AppError(
      `Terminal with device identifier ${input.deviceIdentifier} already exists`,
      409,
    );
  }

  // IMEI is no longer the unique key, but if the operator provides one we
  // still want to prevent two rows from claiming the same physical IMEI.
  if (input.imei) {
    const existingByImei = await prisma.gpsTerminal.findFirst({
      where: { imei: input.imei },
    });
    if (existingByImei) {
      throw new AppError(`Terminal with IMEI ${input.imei} already exists`, 409);
    }
  }

  // phoneNumber is @unique — prevent a P2002 generic 500 by pre-checking.
  if (input.phoneNumber) {
    const existingByPhone = await prisma.gpsTerminal.findFirst({
      where: { phoneNumber: input.phoneNumber },
    });
    if (existingByPhone) {
      throw new AppError(
        `Terminal with phone number ${input.phoneNumber} already exists`,
        409,
      );
    }
  }

  if (input.ownerUserId) {
    const user = await prisma.user.findUnique({ where: { id: input.ownerUserId } });
    if (!user) throw new AppError('Owner user not found', 404);
  }

  return prisma.gpsTerminal.create({
    data: {
      deviceIdentifier: input.deviceIdentifier,
      imei: input.imei ?? null,
      phoneNumber: input.phoneNumber ?? null,
      iccid: input.iccid ?? null,
      manufacturerId: input.manufacturerId ?? null,
      terminalModel: input.terminalModel ?? null,
      hardwareVersion: input.hardwareVersion ?? null,
      firmwareVersion: input.firmwareVersion ?? null,
      vehicleVin: input.vehicleVin ?? null,
      vehicleYear: input.vehicleYear ?? null,
      vehicleMake: input.vehicleMake ?? null,
      vehicleModel: input.vehicleModel ?? null,
      nickname: input.nickname ?? null,
      plateNumber: input.plateNumber ?? null,
      ownerUserId: input.ownerUserId ?? null,
      status: 'NEVER_CONNECTED',
    },
  });
}

interface ListOptions {
  page: number;
  limit: number;
  filter?: 'online' | 'offline' | 'unpaired' | 'never_connected' | 'revoked';
  search?: string;
  /** Admin-only: scope the list to a specific owner. Used by the admin
   *  UserDetailModal "GPS Devices" section. The route schema validates the
   *  uuid shape so we can pass it straight to Prisma. */
  ownerUserId?: string;
}

/**
 * Paginated list. Filters and search are mutually composable. The result
 * shape mirrors the existing admin-list endpoints (scans/appraisals/users).
 */
export async function listTerminals(opts: ListOptions) {
  const where: Record<string, unknown> = {};
  switch (opts.filter) {
    case 'online':
      where.status = 'ONLINE';
      break;
    case 'offline':
      where.status = 'OFFLINE';
      break;
    case 'never_connected':
      where.status = 'NEVER_CONNECTED';
      break;
    case 'revoked':
      where.status = 'REVOKED';
      break;
    case 'unpaired':
      where.ownerUserId = null;
      break;
    default:
      break;
  }

  // ownerUserId narrowing wins over the `unpaired` filter — the admin asked
  // for a specific owner. If they pass both, prefer ownerUserId so the
  // UserDetailModal's GPS Devices section returns this user's rows even
  // when the global filter chip is set to Unpaired.
  if (opts.ownerUserId) {
    where.ownerUserId = opts.ownerUserId;
  }

  if (opts.search && opts.search.length > 0) {
    // deviceIdentifier is the canonical JT/T 808 identity the gateway keys
    // on; surface it to admin search first. We keep `imei` in the OR for
    // back-compat — operators commonly paste an IMEI that happens to match
    // the legacy column.
    where.OR = [
      { deviceIdentifier: { contains: opts.search, mode: 'insensitive' } },
      { imei: { contains: opts.search, mode: 'insensitive' } },
      { phoneNumber: { contains: opts.search, mode: 'insensitive' } },
      { vehicleVin: { contains: opts.search, mode: 'insensitive' } },
      { nickname: { contains: opts.search, mode: 'insensitive' } },
      { plateNumber: { contains: opts.search, mode: 'insensitive' } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.gpsTerminal.count({ where }),
    prisma.gpsTerminal.findMany({
      where,
      orderBy: [{ status: 'asc' }, { lastHeartbeatAt: 'desc' }, { createdAt: 'desc' }],
      take: opts.limit,
      skip: (opts.page - 1) * opts.limit,
      include: {
        ownerUser: { select: { id: true, email: true, fullName: true, isDealer: true } },
      },
    }),
  ]);

  return {
    terminals: rows,
    page: opts.page,
    limit: opts.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / opts.limit)),
  };
}

export async function getTerminalDetail(id: string) {
  const terminal = await prisma.gpsTerminal.findUnique({
    where: { id },
    include: {
      ownerUser: { select: { id: true, email: true, fullName: true, isDealer: true } },
      _count: { select: { locations: true, alarms: true, dtcEvents: true, trips: true } },
    },
  });
  if (!terminal) throw new AppError('Terminal not found', 404);
  return terminal;
}

export async function reassignTerminalOwner(id: string, ownerUserId: string | null) {
  const terminal = await prisma.gpsTerminal.findUnique({ where: { id } });
  if (!terminal) throw new AppError('Terminal not found', 404);

  if (ownerUserId) {
    const user = await prisma.user.findUnique({ where: { id: ownerUserId } });
    if (!user) throw new AppError('Owner user not found', 404);
  }

  return prisma.gpsTerminal.update({ where: { id }, data: { ownerUserId } });
}

/**
 * Unpair = set ownerUserId to null AND mark REVOKED so the gateway rejects
 * any future auth attempts until the admin re-provisions / reassigns.
 *
 * The gateway closes any live socket for the terminal as a side-effect on its
 * next heartbeat (handleHeartbeat sees REVOKED → drops). For instant effect
 * we'd need an in-process signal, deferred to Phase 4 when commands ship.
 */
export async function unpairTerminal(id: string) {
  const terminal = await prisma.gpsTerminal.findUnique({ where: { id } });
  if (!terminal) throw new AppError('Terminal not found', 404);

  return prisma.gpsTerminal.update({
    where: { id },
    data: { ownerUserId: null, status: 'REVOKED' },
  });
}

export async function deleteTerminal(id: string) {
  const terminal = await prisma.gpsTerminal.findUnique({ where: { id } });
  if (!terminal) throw new AppError('Terminal not found', 404);
  // Cascade rules in the schema (`onDelete: Cascade` on locations/obd/alarms/
  // dtcEvents/trips/commands/dailyStats) mean this clears all telemetry too.
  await prisma.gpsTerminal.delete({ where: { id } });
}

// ── User-scoped helpers (Phase 1) ───────────────────────────────────────────

/**
 * Return the authenticated user's terminals. Sorted: ONLINE first (by most-
 * recent heartbeat), then OFFLINE / NEVER_CONNECTED / REVOKED.
 */
export async function getMyTerminals(userId: string) {
  return prisma.gpsTerminal.findMany({
    where: { ownerUserId: userId },
    orderBy: [{ status: 'asc' }, { lastHeartbeatAt: 'desc' }, { createdAt: 'desc' }],
  });
}

/**
 * Detail for a single terminal that MUST belong to the authenticated user.
 * Throws 404 instead of 403 to avoid leaking existence of other users'
 * terminal ids.
 */
export async function getMyTerminalDetail(userId: string, terminalId: string) {
  const terminal = await prisma.gpsTerminal.findFirst({
    where: { id: terminalId, ownerUserId: userId },
    include: {
      _count: { select: { locations: true, alarms: true, dtcEvents: true, trips: true } },
    },
  });
  if (!terminal) throw new AppError('Terminal not found', 404);
  return terminal;
}

/**
 * Latest known location for a terminal owned by the user. Used for the
 * "where is my car right now" widget.
 */
export async function getLatestLocation(userId: string, terminalId: string) {
  // Cheap ownership check — one row, indexed.
  const terminal = await prisma.gpsTerminal.findFirst({
    where: { id: terminalId, ownerUserId: userId },
    select: { id: true },
  });
  if (!terminal) throw new AppError('Terminal not found', 404);

  return prisma.gpsLocation.findFirst({
    where: { terminalId },
    orderBy: { reportedAt: 'desc' },
  });
}

interface LocationHistoryOptions {
  userId: string;
  terminalId: string;
  since?: Date;
  until?: Date;
  page: number;
  limit: number;
  minSpeedKmh?: number;
}

/**
 * Paginated location history for one user-owned terminal. Default time
 * window is the last 24h when neither `since` nor `until` is given —
 * keeps the default page light enough for mobile.
 */
export async function getLocationHistory(opts: LocationHistoryOptions) {
  const owns = await prisma.gpsTerminal.findFirst({
    where: { id: opts.terminalId, ownerUserId: opts.userId },
    select: { id: true },
  });
  if (!owns) throw new AppError('Terminal not found', 404);

  const since = opts.since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
  const until = opts.until ?? new Date();

  if (since >= until) {
    throw new AppError('`since` must be earlier than `until`', 400);
  }

  const where: Record<string, unknown> = {
    terminalId: opts.terminalId,
    reportedAt: { gte: since, lte: until },
  };
  if (opts.minSpeedKmh !== undefined) {
    where.speedKmh = { gte: opts.minSpeedKmh };
  }

  const [total, locations] = await Promise.all([
    prisma.gpsLocation.count({ where }),
    prisma.gpsLocation.findMany({
      where,
      orderBy: { reportedAt: 'desc' },
      take: opts.limit,
      skip: (opts.page - 1) * opts.limit,
      // rawPayload is large and only useful for forensic ops — drop it from
      // the user-facing payload to keep responses small.
      select: {
        id: true,
        terminalId: true,
        reportedAt: true,
        latitude: true,
        longitude: true,
        altitudeM: true,
        speedKmh: true,
        heading: true,
        accOn: true,
        gpsFix: true,
        satelliteCount: true,
        signalStrength: true,
        odometerKm: true,
        fuelLevelPct: true,
        alarmBits: true,
        statusBits: true,
      },
    }),
  ]);

  return {
    locations,
    page: opts.page,
    limit: opts.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / opts.limit)),
    since: since.toISOString(),
    until: until.toISOString(),
  };
}
