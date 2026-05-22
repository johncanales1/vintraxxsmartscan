/**
 * gps-command.service — admin-issued downstream command lifecycle.
 *
 * State machine (mirrors GpsCommandStatus enum):
 *
 *   Standard commands (locate, set-params, …):
 *   QUEUED ──(gateway dispatches)──> SENT
 *     ├─ 0x0001 ACK (result=0)   ──> ACKED
 *     ├─ command timeout          ─> FAILED
 *     └─ socket error             ─> FAILED
 *   QUEUED ──(no live session)   ──> EXPIRED
 *
 *   Vendor-specific commands (4G always-online 0x8300):
 *   QUEUED ──(gateway dispatches)──> SENT
 *     ├─ 0x0001 ACK               ──> JT808_ACKED      (layer-1 transport ACK)
 *     │    ├─ 0x6006 text reply   ──> VENDOR_RESPONSE_RECEIVED  (layer-2 result)
 *     │    └─ timeout             ──> VENDOR_RESPONSE_TIMEOUT
 *     └─ 0x0001 timeout           ──> JT808_ACK_TIMEOUT
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
import * as alwaysOnlineService from './gps-4g-always-online.service';

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
  | 'terminal-control'
  | 'enable-4g-always-online'
  | 'disable-4g-always-online';

export interface SetParamsItem {
  /** JT/T 808 parameter id (e.g. 0x0001 = heartbeat interval). */
  id: number;
  /** Encoded as uint32 BE if number, UTF-8 if string, opaque if Buffer-like. */
  value: number | string;
  /**
   * Wire byte width for numeric values: 1 = BYTE, 2 = WORD, 4 = DWORD
   * (default). MUST match the param-type table in the device spec — a
   * wrong length causes the device to silently misinterpret the value.
   */
  byteWidth?: 1 | 2 | 4;
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
  /** Text payload for 0x8300 text-distribution commands (4G always-online). */
  textPayload?: string;
}

const KIND_TO_FUNCTION_CODE: Record<CommandKind, number> = {
  'locate':                    MsgId.LOCATION_QUERY,        // 0x8201
  'read-params':               MsgId.QUERY_TERMINAL_PARAMS, // 0x8104
  'set-params':                MsgId.SET_TERMINAL_PARAMS,   // 0x8103
  'clear-dtcs':                MsgId.DATA_PASSTHROUGH_DOWN, // 0x8900 (subtype 0xF6)
  'terminal-control':          MsgId.TERMINAL_CONTROL,      // 0x8105
  'enable-4g-always-online':   MsgId.TEXT_DISTRIBUTION,     // 0x8300
  'disable-4g-always-online':  MsgId.TEXT_DISTRIBUTION,     // 0x8300
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
    case 'enable-4g-always-online':
    case 'disable-4g-always-online': {
      if (!input.textPayload || input.textPayload.length === 0) {
        throw new AppError('`textPayload` is required for 4G always-online commands', 400);
      }
      payload = { kind: input.kind, textPayload: input.textPayload };
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
  // For 4G always-online commands the JT/T 808 0x0001 is only layer-1
  // (transport delivery confirmation). Detect the kind before writing so we
  // use JT808_ACKED instead of ACKED and record the jt808Ack* fields.
  const cmd = await prisma.gpsCommand.findUnique({
    where: { id: args.commandId },
    select: { payload: true, status: true },
  });
  if (!cmd || cmd.status !== 'SENT') return false;

  const payload = cmd.payload as { kind?: string } | null;
  const is4g =
    payload?.kind === 'enable-4g-always-online' ||
    payload?.kind === 'disable-4g-always-online';

  const now = new Date();
  const result = await prisma.gpsCommand.updateMany({
    where: { id: args.commandId, status: 'SENT' },
    data: {
      status: is4g ? 'JT808_ACKED' : 'ACKED',
      ackAt: now,
      jt808AckAt: is4g ? now : undefined,
      jt808AckResult: is4g ? args.result : undefined,
      response: args.response ?? { result: args.result },
    },
  });
  if (result.count === 1) {
    void fire4gAlwaysOnlineJt808Ack(args.commandId, args.result, is4g).catch((err) =>
      logger.warn('markAcked: 4G always-online callback failed', {
        commandId: args.commandId,
        err: (err as Error).message,
      }),
    );
  }
  return result.count === 1;
}

/**
 * Mark a 4G command as having received the vendor 0x6006 text response.
 * Moves JT808_ACKED → VENDOR_RESPONSE_RECEIVED.
 */
export async function markVendorResponseReceived(args: {
  commandId: string;
  messageId: string;
  rawHex: string;
  decodedText: string;
  parseStatus: string;
  responseJson?: Prisma.InputJsonValue;
}): Promise<boolean> {
  const now = new Date();
  const result = await prisma.gpsCommand.updateMany({
    where: { id: args.commandId, status: 'JT808_ACKED' },
    data: {
      status: 'VENDOR_RESPONSE_RECEIVED',
      vendorResponseAt: now,
      vendorResponseMessageId: args.messageId,
      vendorResponseRawHex: args.rawHex,
      vendorResponseDecodedText: args.decodedText,
      vendorResponseParseStatus: args.parseStatus,
      vendorResponseJson: args.responseJson ?? Prisma.JsonNull,
    },
  });
  if (result.count === 1) {
    void fire4gAlwaysOnlineVendorResponse(args.commandId, {
      rawHex: args.rawHex,
      decodedText: args.decodedText,
      parseStatus: args.parseStatus,
    }).catch((err) =>
      logger.warn('markVendorResponseReceived: 4G callback failed', {
        commandId: args.commandId,
        err: (err as Error).message,
      }),
    );
  }
  return result.count === 1;
}

/**
 * Mark a JT808_ACKED command as VENDOR_RESPONSE_TIMEOUT when the 0x6006 does
 * not arrive within the allotted window. Called by the cron sweeper.
 */
export async function markVendorResponseTimeout(args: {
  commandId: string;
}): Promise<boolean> {
  const result = await prisma.gpsCommand.updateMany({
    where: { id: args.commandId, status: 'JT808_ACKED' },
    data: {
      status: 'VENDOR_RESPONSE_TIMEOUT',
      errorText: 'timeout: 0x6006 vendor response not received within window',
    },
  });
  if (result.count === 1) {
    void fire4gAlwaysOnlineVendorTimeout(args.commandId).catch((err) =>
      logger.warn('markVendorResponseTimeout: 4G callback failed', {
        commandId: args.commandId,
        err: (err as Error).message,
      }),
    );
  }
  return result.count === 1;
}

/**
 * Record a 0xF3 sleep event against the most-recent 4G always-online command
 * for the given terminal. No-ops if no recent command is found.
 */
export async function updateSleepEvent(args: {
  terminalId: string;
  sleepAt: Date;
  rawHex: string;
}): Promise<string | null> {
  const cmd = await findLatest4gAlwaysOnlineCommand({
    terminalId: args.terminalId,
    withinMs: 10 * 60_000,
  });
  if (!cmd) return null;

  const secondsSinceCommand = cmd.sentAt
    ? Math.round((args.sleepAt.getTime() - cmd.sentAt.getTime()) / 1000)
    : null;
  const note =
    `Device entered sleep mode ${secondsSinceCommand != null ? secondsSinceCommand + 's' : ''} after command was sent. ` +
    `Command was accepted by terminal (0x0001 ACK), but device still entered sleep. ` +
    `Review vendor 0x6006 response to understand sleep behaviour.`;

  await prisma.gpsCommand.updateMany({
    where: { id: cmd.id },
    data: { sleepEventAt: args.sleepAt, sleepEventNote: note },
  });

  void fire4gAlwaysOnlineSleepEvent(cmd.id, {
    terminalId: args.terminalId,
    sleepAt: args.sleepAt,
    secondsSinceCommand,
  }).catch((err) =>
    logger.warn('updateSleepEvent: 4G sleep callback failed', {
      commandId: cmd.id,
      err: (err as Error).message,
    }),
  );

  return cmd.id;
}

/**
 * Find the most-recently-sent 4G always-online command for a terminal within
 * the given time window. Returns the row or null.
 */
export async function findLatest4gAlwaysOnlineCommand(args: {
  terminalId: string;
  withinMs: number;
}) {
  const cutoff = new Date(Date.now() - args.withinMs);
  return prisma.gpsCommand.findFirst({
    where: {
      terminalId: args.terminalId,
      functionCode: 0x8300,
      status: { in: ['SENT', 'JT808_ACKED', 'VENDOR_RESPONSE_RECEIVED', 'VENDOR_RESPONSE_TIMEOUT'] },
      sentAt: { gte: cutoff },
    },
    orderBy: { sentAt: 'desc' },
    select: {
      id: true,
      status: true,
      sentAt: true,
      jt808AckAt: true,
      jt808AckResult: true,
      payload: true,
    },
  });
}

export async function markFailed(args: {
  commandId: string;
  errorText: string;
  /** Allowed previous statuses — defaults to ['QUEUED','SENT']. */
  fromStatus?: ('QUEUED' | 'SENT' | 'JT808_ACKED')[];
}): Promise<boolean> {
  const allowed = args.fromStatus ?? ['QUEUED', 'SENT'];
  const result = await prisma.gpsCommand.updateMany({
    where: { id: args.commandId, status: { in: allowed } },
    data: { status: 'FAILED', errorText: args.errorText, ackAt: new Date() },
  });
  if (result.count === 1) {
    // Fire 4G always-online failure callback if applicable.
    void fire4gAlwaysOnlineFail(args.commandId, args.errorText).catch((err) =>
      logger.warn('markFailed: 4G always-online callback failed', {
        commandId: args.commandId,
        err: (err as Error).message,
      }),
    );
  }
  return result.count === 1;
}

// ── 4G Always-Online lifecycle hooks ────────────────────────────────────────

async function fire4gAlwaysOnlineJt808Ack(
  commandId: string,
  result: number,
  is4g: boolean,
) {
  if (!is4g) return;
  const cmd = await prisma.gpsCommand.findUnique({
    where: { id: commandId },
    select: { id: true, terminalId: true, payload: true },
  });
  if (!cmd) return;
  const payload = cmd.payload as { kind?: string } | null;
  if (
    payload?.kind !== 'enable-4g-always-online' &&
    payload?.kind !== 'disable-4g-always-online'
  ) return;

  await alwaysOnlineService.onCommandJt808Acked({
    commandId,
    kind: payload.kind as 'enable-4g-always-online' | 'disable-4g-always-online',
    terminalId: cmd.terminalId,
    result,
  });
}

async function fire4gAlwaysOnlineVendorResponse(
  commandId: string,
  response: { rawHex: string; decodedText: string; parseStatus: string },
) {
  const cmd = await prisma.gpsCommand.findUnique({
    where: { id: commandId },
    select: { id: true, terminalId: true, payload: true },
  });
  if (!cmd) return;
  const payload = cmd.payload as { kind?: string } | null;
  if (
    payload?.kind !== 'enable-4g-always-online' &&
    payload?.kind !== 'disable-4g-always-online'
  ) return;

  await alwaysOnlineService.onVendorResponseReceived({
    commandId,
    kind: payload.kind as 'enable-4g-always-online' | 'disable-4g-always-online',
    terminalId: cmd.terminalId,
    ...response,
  });
}

async function fire4gAlwaysOnlineVendorTimeout(commandId: string) {
  const cmd = await prisma.gpsCommand.findUnique({
    where: { id: commandId },
    select: { id: true, terminalId: true, payload: true },
  });
  if (!cmd) return;
  const payload = cmd.payload as { kind?: string } | null;
  if (
    payload?.kind !== 'enable-4g-always-online' &&
    payload?.kind !== 'disable-4g-always-online'
  ) return;

  await alwaysOnlineService.onVendorResponseTimeout({
    commandId,
    terminalId: cmd.terminalId,
  });
}

async function fire4gAlwaysOnlineSleepEvent(
  commandId: string,
  args: { terminalId: string; sleepAt: Date; secondsSinceCommand: number | null },
) {
  const cmd = await prisma.gpsCommand.findUnique({
    where: { id: commandId },
    select: { id: true, terminalId: true, payload: true },
  });
  if (!cmd) return;
  const payload = cmd.payload as { kind?: string } | null;
  if (
    payload?.kind !== 'enable-4g-always-online' &&
    payload?.kind !== 'disable-4g-always-online'
  ) return;

  await alwaysOnlineService.onSleepAfterCommand({
    commandId,
    kind: payload.kind as 'enable-4g-always-online' | 'disable-4g-always-online',
    terminalId: cmd.terminalId,
    sleepAt: args.sleepAt,
    secondsSinceCommand: args.secondsSinceCommand,
  });
}

async function fire4gAlwaysOnlineFail(commandId: string, errorText: string) {
  const cmd = await prisma.gpsCommand.findUnique({
    where: { id: commandId },
    select: { id: true, terminalId: true, payload: true },
  });
  if (!cmd) return;
  const payload = cmd.payload as { kind?: string } | null;
  if (
    payload?.kind !== 'enable-4g-always-online' &&
    payload?.kind !== 'disable-4g-always-online'
  ) return;

  await alwaysOnlineService.onCommandFailed({
    commandId,
    terminalId: cmd.terminalId,
    errorText,
  });
}

// ── Cron sweeps ─────────────────────────────────────────────────────────────

/** SENT commands that haven't been ACKED within `ms` get marked FAILED (JT808_ACK_TIMEOUT for 4G commands). */
export async function timeoutSentCommands(ms: number): Promise<number> {
  const cutoff = new Date(Date.now() - ms);
  const stale = await prisma.gpsCommand.findMany({
    where: { status: 'SENT', sentAt: { lt: cutoff } },
    select: { id: true, payload: true },
  });
  let n = 0;
  for (const row of stale) {
    const payload = row.payload as { kind?: string } | null;
    const is4g =
      payload?.kind === 'enable-4g-always-online' ||
      payload?.kind === 'disable-4g-always-online';
    if (is4g) {
      const res = await prisma.gpsCommand.updateMany({
        where: { id: row.id, status: 'SENT' },
        data: { status: 'JT808_ACK_TIMEOUT', errorText: 'timeout: 0x0001 ACK not received within window' },
      });
      if (res.count === 1) {
        n++;
        void fire4gAlwaysOnlineFail(row.id, 'timeout: 0x0001 ACK not received within window');
      }
    } else {
      const ok = await markFailed({
        commandId: row.id,
        errorText: 'timeout: no 0x0001 ack within window',
        fromStatus: ['SENT'],
      });
      if (ok) n++;
    }
  }
  if (n > 0) logger.info('timeoutSentCommands: timed out N commands', { count: n });
  return n;
}

/** JT808_ACKED 4G commands that haven't received a 0x6006 vendor response within `ms`. */
export async function timeoutVendorResponseCommands(ms: number): Promise<number> {
  const cutoff = new Date(Date.now() - ms);
  const stale = await prisma.gpsCommand.findMany({
    where: { status: 'JT808_ACKED', jt808AckAt: { lt: cutoff } },
    select: { id: true },
  });
  let n = 0;
  for (const row of stale) {
    const ok = await markVendorResponseTimeout({ commandId: row.id });
    if (ok) n++;
  }
  if (n > 0) logger.info('timeoutVendorResponseCommands: timed out N commands', { count: n });
  return n;
}

/** QUEUED commands older than `ms` get marked EXPIRED. */
export async function expireStaleQueuedCommands(ms: number): Promise<number> {
  const cutoff = new Date(Date.now() - ms);

  // First, find 4G always-online commands that will expire so we can update terminal status
  const fourGCommands = await prisma.gpsCommand.findMany({
    where: {
      status: 'QUEUED',
      createdAt: { lt: cutoff },
      payload: {
        path: ['kind'],
        string_contains: '4g-always-online',
      },
    },
    select: { id: true, terminalId: true, payload: true },
  });

  // Update terminal status for each 4G command that's expiring
  for (const cmd of fourGCommands) {
    try {
      await alwaysOnlineService.onCommandFailed({
        commandId: cmd.id,
        terminalId: cmd.terminalId,
        errorText: 'expired: no live session in window',
      });
    } catch (err) {
      logger.warn('expireStaleQueuedCommands: failed to update terminal 4G status', {
        commandId: cmd.id,
        terminalId: cmd.terminalId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const result = await prisma.gpsCommand.updateMany({
    where: { status: 'QUEUED', createdAt: { lt: cutoff } },
    data: { status: 'EXPIRED', errorText: 'expired: no live session in window' },
  });
  if (result.count > 0) {
    logger.info('expireStaleQueuedCommands: expired N commands', {
      count: result.count,
      fourGCommandsUpdated: fourGCommands.length,
    });
  }
  return result.count;
}

// ── Read-side (admin REST) ──────────────────────────────────────────────────

interface ListOptions {
  page: number;
  limit: number;
  terminalId?: string;
  status?: 'QUEUED' | 'SENT' | 'ACKED' | 'FAILED' | 'EXPIRED' | 'JT808_ACKED' | 'VENDOR_RESPONSE_RECEIVED' | 'JT808_ACK_TIMEOUT' | 'VENDOR_RESPONSE_TIMEOUT';
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
          select: { id: true, deviceIdentifier: true, imei: true, nickname: true, vehicleVin: true },
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
      payload: true,
      status: true,
      response: true,
      errorText: true,
      serialNumber: true,
      sentAt: true,
      ackAt: true,
      jt808AckAt: true,
      jt808AckResult: true,
      vendorResponseAt: true,
      vendorResponseMessageId: true,
      vendorResponseRawHex: true,
      vendorResponseDecodedText: true,
      vendorResponseParseStatus: true,
      sleepEventAt: true,
      sleepEventNote: true,
      createdAt: true,
      terminal: {
        select: {
          id: true,
          deviceIdentifier: true,
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
