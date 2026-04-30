/**
 * gps-command.service — admin-issued downstream command lifecycle.
 *
 * State machine (mirrors GpsCommandStatus enum):
 *
 *   QUEUED ──(gateway picks up + writes to socket)──> SENT
 *                                                     │
 *                                                     ├─ device 0x0001 ack ──> ACKED
 *                                                     ├─ command timeout    ─> FAILED
 *                                                     └─ socket error       ─> FAILED
 *   QUEUED ──(no live session for too long)─────────> EXPIRED
 *
 * Only the REST process calls `enqueueCommand`. Only the gateway process
 * calls `markSent / markAcked / markFailed`. The cron (in the backend
 * process) calls `expireStaleCommands` and `timeoutSentCommands`.
 *
 * Idempotency: every status mutator scopes its update to the previous status
 * via a guard so a command can't accidentally jump backwards (e.g. ACKED →
 * FAILED) on a late-arriving message.
 */

import prisma from '../config/db';
import { Prisma, type GpsCommand } from '@prisma/client';
import logger from '../utils/logger';
import { emitCommandQueued } from '../realtime/notify-command';
import { AppError } from '../middleware/errorHandler';
import { MsgId } from '../gateway/codec/constants';
import { SUPPORTED_CONTROL_TYPES } from '../gateway/codec/messages/m8105-terminal-control';

// ── Public command kinds ────────────────────────────────────────────────────

/**
 * The REST API exposes a SMALL, AUDITED set of commands. Each maps to one
 * JT/T 808 message id and a typed `payload` JSON we persist on GpsCommand
 * so the gateway can rebuild the wire bytes without re-parsing the API
 * request.
 */
export type CommandKind =
  | 'locate'
  | 'read-params'
  | 'set-params'
  | 'clear-dtcs'
  | 'terminal-control';

export interface SetParamsItem {
  /** JT/T 808 parameter id (e.g. 0x0001 = heartbeat interval). */
  id: number;
  /** Encoded as uint32 BE if number, UTF-8 if string, opaque if Buffer-like. */
  value: number | string;
}

export interface EnqueueInput {
  terminalId: string;
  /**
   * Originator. Exactly ONE of `adminId` or `userId` should be set per call;
   * if both are set we keep both (the schema permits it but the API layer
   * should normally pass one). Both null is reserved for system-issued
   * commands and currently unused.
   */
  adminId?: string | null;
  userId?: string | null;
  kind: CommandKind;
  /** Required for `set-params`; ignored otherwise. */
  setParams?: SetParamsItem[];
  /**
   * Required for `terminal-control`; ignored otherwise. One of
   * SUPPORTED_CONTROL_TYPES (3, 4, 5, 6, 7) per the m8105 codec.
   */
  controlType?: number;
}

const KIND_TO_FUNCTION_CODE: Record<CommandKind, number> = {
  'locate':           MsgId.LOCATION_QUERY,        // 0x8201
  'read-params':      MsgId.QUERY_TERMINAL_PARAMS, // 0x8104
  'set-params':       MsgId.SET_TERMINAL_PARAMS,   // 0x8103
  'clear-dtcs':       MsgId.DATA_PASSTHROUGH_DOWN, // 0x8900 (subtype 0xF6)
  'terminal-control': MsgId.TERMINAL_CONTROL,      // 0x8105
};

// ── Enqueue (REST side) ─────────────────────────────────────────────────────

/**
 * Validate the request, persist a QUEUED row, fire pg_notify so the gateway
 * can pick it up. Returns the row.
 *
 * Rejects with 4xx if the terminal doesn't exist OR the kind is `set-params`
 * but the param list is empty.
 */
export async function enqueueCommand(input: EnqueueInput): Promise<GpsCommand> {
  const terminal = await prisma.gpsTerminal.findUnique({
    where: { id: input.terminalId },
    select: { id: true, status: true },
  });
  if (!terminal) throw new AppError('Terminal not found', 404);

  const functionCode = KIND_TO_FUNCTION_CODE[input.kind];
  if (functionCode === undefined) {
    throw new AppError(`Unsupported command kind: ${input.kind}`, 400);
  }

  // Per-kind validation. We persist the typed payload so the gateway can
  // reconstruct the wire body without re-validating.
  let payload: Prisma.InputJsonValue;
  switch (input.kind) {
    case 'locate':
    case 'read-params':
    case 'clear-dtcs':
      payload = { kind: input.kind };
      break;
    case 'set-params': {
      if (!input.setParams || input.setParams.length === 0) {
        throw new AppError('`setParams` is required and must be non-empty', 400);
      }
      // Sanity-check value shapes here so the API client gets a 4xx, not a
      // 5xx from the gateway.
      for (const p of input.setParams) {
        if (!Number.isInteger(p.id) || p.id < 0 || p.id > 0xffffffff) {
          throw new AppError(`param.id must be a uint32 (got ${p.id})`, 400);
        }
        if (typeof p.value === 'number') {
          if (!Number.isInteger(p.value) || p.value < 0 || p.value > 0xffffffff) {
            throw new AppError(
              `param 0x${p.id.toString(16)}: numeric value out of uint32 range`,
              400,
            );
          }
        } else if (typeof p.value === 'string') {
          if (Buffer.byteLength(p.value, 'utf8') > 255) {
            throw new AppError(
              `param 0x${p.id.toString(16)}: string value exceeds 255 UTF-8 bytes`,
              400,
            );
          }
        } else {
          throw new AppError(
            `param 0x${p.id.toString(16)}: value must be number or string`,
            400,
          );
        }
      }
      payload = { kind: 'set-params', items: input.setParams as unknown as Prisma.InputJsonValue };
      break;
    }
    case 'terminal-control': {
      if (input.controlType === undefined) {
        throw new AppError('`controlType` is required for terminal-control', 400);
      }
      if (!SUPPORTED_CONTROL_TYPES.has(input.controlType)) {
        throw new AppError(
          `controlType ${input.controlType} not in allow-list (${[
            ...SUPPORTED_CONTROL_TYPES,
          ].join(',')})`,
          400,
        );
      }
      payload = { kind: 'terminal-control', controlType: input.controlType };
      break;
    }
    default:
      throw new AppError(`Unsupported command kind: ${input.kind}`, 400);
  }

  const cmd = await prisma.gpsCommand.create({
    data: {
      terminalId: input.terminalId,
      adminId: input.adminId ?? null,
      userId: input.userId ?? null,
      functionCode,
      payload,
      status: 'QUEUED',
    },
  });

  void emitCommandQueued({ commandId: cmd.id });

  logger.info('Command enqueued', {
    commandId: cmd.id,
    terminalId: cmd.terminalId,
    adminId: cmd.adminId,
    userId: cmd.userId,
    functionCode: `0x${functionCode.toString(16).padStart(4, '0')}`,
    kind: input.kind,
  });
  return cmd;
}

// ── State transitions (gateway side) ────────────────────────────────────────

/**
 * Mark a command as SENT after the gateway successfully wrote it to the
 * device's socket. Only succeeds if the row is currently QUEUED — protects
 * against a second gateway pod racing on the same row.
 */
export async function markSent(args: {
  commandId: string;
  rawBytes: Buffer;
  serialNumber: number;
}): Promise<boolean> {
  const result = await prisma.gpsCommand.updateMany({
    where: { id: args.commandId, status: 'QUEUED' },
    data: {
      status: 'SENT',
      sentAt: new Date(),
      rawBytesSent: args.rawBytes,
      serialNumber: args.serialNumber,
    },
  });
  return result.count === 1;
}

/**
 * Mark a command as ACKED. `result` is the JT/T 808 result code from the
 * device's 0x0001 (0 = success). For 0x8900 commands, we expose this for
 * the inbound 0x0900/0xF6 ack which carries a richer status code.
 */
export async function markAcked(args: {
  commandId: string;
  result: number;
  response?: Prisma.InputJsonValue;
}): Promise<boolean> {
  const result = await prisma.gpsCommand.updateMany({
    where: { id: args.commandId, status: 'SENT' },
    data: {
      status: 'ACKED',
      ackAt: new Date(),
      response:
        args.response ?? { result: args.result },
    },
  });
  return result.count === 1;
}

export async function markFailed(args: {
  commandId: string;
  errorText: string;
  /** Allowed previous statuses — defaults to ['QUEUED','SENT']. */
  fromStatus?: ('QUEUED' | 'SENT')[];
}): Promise<boolean> {
  const allowed = args.fromStatus ?? ['QUEUED', 'SENT'];
  const result = await prisma.gpsCommand.updateMany({
    where: { id: args.commandId, status: { in: allowed } },
    data: { status: 'FAILED', errorText: args.errorText, ackAt: new Date() },
  });
  return result.count === 1;
}

// ── Cron sweeps ─────────────────────────────────────────────────────────────

/** SENT commands that haven't been ACKED within `ms` get marked FAILED. */
export async function timeoutSentCommands(ms: number): Promise<number> {
  const cutoff = new Date(Date.now() - ms);
  const stale = await prisma.gpsCommand.findMany({
    where: { status: 'SENT', sentAt: { lt: cutoff } },
    select: { id: true },
  });
  let n = 0;
  for (const row of stale) {
    const ok = await markFailed({
      commandId: row.id,
      errorText: 'timeout: no 0x0001 ack within window',
      fromStatus: ['SENT'],
    });
    if (ok) n++;
  }
  if (n > 0) logger.info('timeoutSentCommands: timed out N commands', { count: n });
  return n;
}

/** QUEUED commands older than `ms` get marked EXPIRED. */
export async function expireStaleQueuedCommands(ms: number): Promise<number> {
  const cutoff = new Date(Date.now() - ms);
  const result = await prisma.gpsCommand.updateMany({
    where: { status: 'QUEUED', createdAt: { lt: cutoff } },
    data: { status: 'EXPIRED', errorText: 'expired: no live session in window' },
  });
  if (result.count > 0) {
    logger.info('expireStaleQueuedCommands: expired N commands', { count: result.count });
  }
  return result.count;
}

// ── Read-side (admin REST) ──────────────────────────────────────────────────

interface ListOptions {
  page: number;
  limit: number;
  terminalId?: string;
  status?: 'QUEUED' | 'SENT' | 'ACKED' | 'FAILED' | 'EXPIRED';
  adminId?: string;
  since?: Date;
  until?: Date;
}

export async function listCommands(opts: ListOptions) {
  const where: Prisma.GpsCommandWhereInput = {};
  if (opts.terminalId) where.terminalId = opts.terminalId;
  if (opts.status) where.status = opts.status;
  if (opts.adminId) where.adminId = opts.adminId;
  if (opts.since || opts.until) {
    where.createdAt = {};
    if (opts.since) (where.createdAt as Record<string, unknown>).gte = opts.since;
    if (opts.until) (where.createdAt as Record<string, unknown>).lte = opts.until;
  }

  const [total, commands] = await Promise.all([
    prisma.gpsCommand.count({ where }),
    prisma.gpsCommand.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: opts.limit,
      skip: (opts.page - 1) * opts.limit,
      include: {
        terminal: {
          select: { id: true, imei: true, nickname: true, vehicleVin: true },
        },
        admin: {
          select: { id: true, email: true },
        },
      },
    }),
  ]);
  return {
    commands,
    page: opts.page,
    limit: opts.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / opts.limit)),
  };
}

/**
 * MEDIUM #26: explicit `select` instead of `include: { terminal: true }` so
 * we can omit `rawBytesSent` (the on-the-wire bytes — not useful to API
 * clients and just bloats the response with base64) AND `payload` (the
 * server-internal command JSON). Audit clients that need the wire bytes
 * should query the DB directly with credentials, not the REST API.
 */
export async function getCommandDetail(commandId: string) {
  const cmd = await prisma.gpsCommand.findUnique({
    where: { id: commandId },
    select: {
      id: true,
      terminalId: true,
      adminId: true,
      userId: true,
      functionCode: true,
      status: true,
      response: true,
      errorText: true,
      serialNumber: true,
      sentAt: true,
      ackAt: true,
      createdAt: true,
      terminal: {
        select: {
          id: true,
          imei: true,
          nickname: true,
          vehicleVin: true,
          vehicleYear: true,
          vehicleMake: true,
          vehicleModel: true,
          status: true,
        },
      },
      admin: { select: { id: true, email: true } },
    },
  });
  if (!cmd) throw new AppError('Command not found', 404);
  return cmd;
}
