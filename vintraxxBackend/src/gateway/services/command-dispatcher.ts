/**
 * command-dispatcher — gateway-side consumer of QUEUED GpsCommand rows.
 *
 * How it works:
 *   1. A dedicated `pg.Client` listens on the `gps_command` channel.
 *   2. On each notification (or every 30s sweep, whichever comes first),
 *      we pull QUEUED commands whose terminal has a live session in the
 *      LOCAL SessionRegistry. Other gateway pods (if any) handle the rest.
 *   3. For each picked command:
 *        a. Build the wire body via the appropriate codec.
 *        b. Reserve a fresh msgSerial via session.writeFrame.
 *        c. Mark the row SENT (atomic CAS on QUEUED → SENT).
 *        d. Register a PendingCommand on the session keyed by msgSerial.
 *        e. When the device sends 0x0001 acking that serial,
 *           handleTerminalGeneralResponse resolves the pending future →
 *           we mark the row ACKED.
 *        f. If the timeout fires first, mark FAILED.
 *
 * If the database step (markSent) fails — e.g. another pod beat us to it —
 * we DON'T write to the socket. This guarantees a single command is sent at
 * most once, even with multiple gateway pods.
 *
 * On reconnect after a device-side restart we also do a sweep so commands
 * queued while the device was offline get delivered when it comes back.
 *
 * The dispatcher is OPTIONAL — if the LISTEN client fails to connect, it
 * keeps retrying with exponential backoff but the gateway continues to
 * accept inbound traffic. Operators can issue commands via the periodic
 * 30-second poll in that case.
 */

import { Client } from 'pg';
import prisma from '../../config/db';
import logger from '../../utils/logger';
import { env } from '../../config/env';

import { SessionRegistry } from '../session/SessionRegistry';
import { MsgId } from '../codec/constants';
import { encodeFrame } from '../codec';
import * as m8201 from '../codec/messages/m8201-location-query';
import * as m8104 from '../codec/messages/m8104-query-params';
import * as m8103 from '../codec/messages/m8103-set-params';
import * as m8105 from '../codec/messages/m8105-terminal-control';
import * as m8900 from '../codec/messages/m8900-pass-through-down';
import * as commandService from '../../services/gps-command.service';

import type { Session, PendingCommand } from '../session/Session';

// ── Tunables ────────────────────────────────────────────────────────────────

/** How long we wait for a 0x0001 ack before timing out a SENT command. */
const COMMAND_ACK_TIMEOUT_MS = 30_000;

/** Periodic sweep interval — picks up commands queued during a LISTEN drop. */
const PERIODIC_SWEEP_MS = 30_000;

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

let listenClient: Client | null = null;
let sweepTimer: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
let stopped = false;

// ── Public lifecycle ────────────────────────────────────────────────────────

export async function startCommandDispatcher(): Promise<void> {
  stopped = false;
  await connectListenClient();
  if (sweepTimer === null) {
    sweepTimer = setInterval(() => {
      void sweepQueuedCommands().catch((err) => {
        logger.warn('command-dispatcher sweep failed', {
          err: (err as Error).message,
        });
      });
    }, PERIODIC_SWEEP_MS);
    sweepTimer.unref();
  }
  logger.info('command-dispatcher started');
}

export async function stopCommandDispatcher(): Promise<void> {
  stopped = true;
  // MEDIUM #30: reset the backoff counter so a future re-start of the
  // dispatcher begins at the base 1-second delay instead of inheriting
  // whatever exponential value we were at when stopped. Mirrors the same
  // fix in src/realtime/listener.ts.
  reconnectAttempts = 0;
  if (sweepTimer) {
    clearInterval(sweepTimer);
    sweepTimer = null;
  }
  if (listenClient) {
    try {
      await listenClient.end();
    } catch (err) {
      logger.warn('command-dispatcher: error closing LISTEN client', {
        err: (err as Error).message,
      });
    }
    listenClient = null;
  }
}

/**
 * Public hook: when a session finishes auth and binds to a terminal, the auth
 * handler can call this to drain any queued commands for that terminal that
 * arrived while the device was offline.
 */
export async function dispatchQueuedForTerminal(terminalId: string): Promise<void> {
  const session = SessionRegistry.getByTerminalId(terminalId);
  if (!session || !session.authenticated) return;
  await pickAndDispatch({ terminalIds: [terminalId] });
}

// ── LISTEN client ───────────────────────────────────────────────────────────

async function connectListenClient(): Promise<void> {
  if (stopped) return;

  const c = new Client({ connectionString: env.DATABASE_URL });

  c.on('error', (err) => {
    logger.warn('command-dispatcher LISTEN error', { err: err.message });
  });

  c.on('end', () => {
    if (stopped) return;
    const delay = Math.min(
      RECONNECT_MAX_MS,
      RECONNECT_BASE_MS * Math.pow(2, reconnectAttempts),
    );
    reconnectAttempts += 1;
    logger.warn('command-dispatcher LISTEN dropped; reconnecting', { delayMs: delay });
    setTimeout(() => void connectListenClient(), delay).unref();
  });

  c.on('notification', (msg) => {
    if (msg.channel !== 'gps_command' || !msg.payload) return;
    let parsed: { commandId: string };
    try {
      parsed = JSON.parse(msg.payload) as { commandId: string };
    } catch (err) {
      logger.warn('command-dispatcher: bad payload (non-JSON)', {
        err: (err as Error).message,
      });
      return;
    }
    void pickAndDispatch({ commandIds: [parsed.commandId] }).catch((err) => {
      logger.error('command-dispatcher: dispatch failed', {
        commandId: parsed.commandId,
        err: (err as Error).message,
      });
    });
  });

  try {
    await c.connect();
    await c.query('LISTEN gps_command');
    listenClient = c;
    reconnectAttempts = 0;
    logger.info('command-dispatcher: LISTEN ready');
    // First sweep immediately — picks up anything queued before we connected.
    void sweepQueuedCommands();
  } catch (err) {
    logger.warn('command-dispatcher: LISTEN connect failed; retrying', {
      err: (err as Error).message,
    });
    try { await c.end(); } catch { /* ignore */ }
  }
}

// ── Pickers ─────────────────────────────────────────────────────────────────

/** Periodic sweep: any QUEUED command whose terminal is online here. */
async function sweepQueuedCommands(): Promise<void> {
  const liveTerminalIds: string[] = [];
  for (const s of SessionRegistry.iter()) {
    if (s.authenticated && s.terminalId) liveTerminalIds.push(s.terminalId);
  }
  if (liveTerminalIds.length === 0) return;

  await pickAndDispatch({ terminalIds: liveTerminalIds });
}

/**
 * Common picker. Loads candidate QUEUED commands from the DB filtered by
 * terminalId or commandId, then loops them through `dispatchOne`. We DON'T
 * mark SENT here — that happens inside dispatchOne, atomically right before
 * the socket write so a row never sits in SENT without bytes on the wire.
 */
async function pickAndDispatch(args: {
  terminalIds?: string[];
  commandIds?: string[];
}): Promise<void> {
  const where: Record<string, unknown> = { status: 'QUEUED' };
  if (args.terminalIds) where.terminalId = { in: args.terminalIds };
  if (args.commandIds) where.id = { in: args.commandIds };

  const rows = await prisma.gpsCommand.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    take: 50, // soft cap to avoid a giant in-memory pump on first sweep
  });

  for (const row of rows) {
    await dispatchOne(row.id);
  }
}

// ── Dispatch one command ────────────────────────────────────────────────────

interface DispatchableRow {
  id: string;
  terminalId: string;
  functionCode: number;
  payload: unknown;
}

async function dispatchOne(commandId: string): Promise<void> {
  const cmd = (await prisma.gpsCommand.findUnique({
    where: { id: commandId },
    select: { id: true, terminalId: true, functionCode: true, payload: true, status: true },
  })) as
    | (DispatchableRow & { status: string })
    | null;

  if (!cmd || cmd.status !== 'QUEUED') return;

  const session = SessionRegistry.getByTerminalId(cmd.terminalId);
  if (!session || !session.authenticated) {
    // No live session here — leave it QUEUED for another pod or for the next
    // sweep when the device reconnects.
    return;
  }

  let body: Buffer;
  try {
    body = buildBody(cmd);
  } catch (err) {
    logger.warn('command-dispatcher: failed to build body', {
      commandId: cmd.id,
      functionCode: `0x${cmd.functionCode.toString(16).padStart(4, '0')}`,
      err: (err as Error).message,
    });
    await commandService.markFailed({
      commandId: cmd.id,
      errorText: `body build error: ${(err as Error).message}`,
      fromStatus: ['QUEUED'],
    });
    return;
  }

  // Reserve a fresh outbound serial WITHOUT writing yet. We need to know the
  // serial so we can register the pending callback before bytes hit the wire
  // (otherwise the device could in theory ack before we install the handler).
  const msgSerial = session.nextSerial();

  // Pre-build the encoded frame so we can record exact bytes to the audit
  // log even if the socket write fails.
  let rawFrame: Buffer;
  try {
    rawFrame = buildFrameForRecord(session, cmd.functionCode, body, msgSerial);
  } catch (err) {
    await commandService.markFailed({
      commandId: cmd.id,
      errorText: `frame encode error: ${(err as Error).message}`,
      fromStatus: ['QUEUED'],
    });
    return;
  }

  // Atomic QUEUED→SENT — this is the contention point with other gateway
  // pods. If it returns false we lost the race; abort silently.
  const claimed = await commandService.markSent({
    commandId: cmd.id,
    rawBytes: rawFrame,
    serialNumber: msgSerial,
  });
  if (!claimed) {
    session.log.info('command-dispatcher: lost claim race (another pod sent it)', {
      commandId: cmd.id,
    });
    return;
  }

  // Install the pending-command handler BEFORE writing.
  installPending(session, msgSerial, cmd.functionCode, cmd.id);

  // Write. Errors here transition SENT→FAILED.
  try {
    session.socket.write(rawFrame);
    session.log.info('command-dispatcher: sent command', {
      commandId: cmd.id,
      msgSerial,
      functionCode: `0x${cmd.functionCode.toString(16).padStart(4, '0')}`,
    });
  } catch (err) {
    // Tear down the pending callback we installed pre-write — clearTimeout
    // is essential: leaving the 30s timer armed just means a delayed no-op
    // markFailed (the row is already FAILED, so the status guard rejects)
    // but it's a leaked Node timer reference for half a minute every time.
    const pending = session.pendingCommands.get(msgSerial);
    if (pending) {
      clearTimeout(pending.timeoutHandle);
      session.pendingCommands.delete(msgSerial);
    }
    await commandService.markFailed({
      commandId: cmd.id,
      errorText: `socket write error: ${(err as Error).message}`,
      fromStatus: ['SENT'],
    });
  }
}

/**
 * Encode the full frame (with header + checksum + escaping) so we can store
 * the exact bytes-on-the-wire on the GpsCommand row before we even write.
 *
 * `Session.writeFrame` is the usual helper but it always allocates a fresh
 * msgSerial — we already reserved ours up-front (so we can install the
 * pending-command callback before the bytes hit the wire) so we call
 * `encodeFrame` directly here.
 */
function buildFrameForRecord(
  session: Session,
  msgId: number,
  body: Buffer,
  msgSerial: number,
): Buffer {
  if (!session.phoneBcd) {
    throw new Error('session has no phoneBcd');
  }
  return encodeFrame({
    msgId,
    phoneBcd: session.phoneBcd,
    msgSerial,
    body,
  });
}

function buildBody(cmd: DispatchableRow): Buffer {
  switch (cmd.functionCode) {
    case MsgId.LOCATION_QUERY:
      return m8201.encode();
    case MsgId.QUERY_TERMINAL_PARAMS:
      return m8104.encode();
    case MsgId.SET_TERMINAL_PARAMS: {
      const payload = cmd.payload as { kind: string; items: unknown };
      if (!Array.isArray(payload.items)) {
        throw new Error('set-params payload missing `items` array');
      }
      // The persisted items have shape { id:number, value:number|string|hex }.
      // Convert to the codec's ParamEntry union — strings/numbers pass through;
      // anything else is rejected (the REST validator already enforces this).
      const entries: m8103.ParamEntry[] = (
        payload.items as Array<{ id: number; value: unknown }>
      ).map((p) => {
        if (typeof p.value === 'number') {
          return { id: p.id, value: p.value };
        }
        if (typeof p.value === 'string') {
          return { id: p.id, value: p.value };
        }
        throw new Error(`set-params item id=0x${p.id.toString(16)} has unsupported value type`);
      });
      return m8103.encode(entries);
    }
    case MsgId.DATA_PASSTHROUGH_DOWN: {
      const payload = cmd.payload as { kind: string };
      if (payload.kind === 'clear-dtcs') {
        return m8900.encodeDtcClear();
      }
      throw new Error(`Unsupported pass-through kind: ${String(payload.kind)}`);
    }
    case MsgId.TERMINAL_CONTROL: {
      const payload = cmd.payload as { kind: string; controlType?: number };
      if (payload.kind !== 'terminal-control' || typeof payload.controlType !== 'number') {
        throw new Error('terminal-control payload missing controlType');
      }
      return m8105.encode({ controlType: payload.controlType });
    }
    default:
      throw new Error(`Unsupported function code: 0x${cmd.functionCode.toString(16)}`);
  }
}

/**
 * Register a PendingCommand on the session whose resolution updates the
 * GpsCommand row. We DON'T need to keep a JS Promise here — the session's
 * `pendingCommands` map already plays that role for this msgSerial.
 */
function installPending(
  session: Session,
  msgSerial: number,
  functionCode: number,
  commandId: string,
): void {
  const timeoutHandle = setTimeout(() => {
    session.pendingCommands.delete(msgSerial);
    void commandService
      .markFailed({
        commandId,
        errorText: 'timeout: 0x0001 ack not received',
        fromStatus: ['SENT'],
      })
      .catch((err) =>
        logger.warn('command-dispatcher: markFailed(timeout) raced', {
          commandId,
          err: (err as Error).message,
        }),
      );
  }, COMMAND_ACK_TIMEOUT_MS);

  const pending: PendingCommand = {
    msgId: functionCode,
    msgSerial,
    sentAt: new Date(),
    resolve: (result: number) => {
      void commandService
        .markAcked({ commandId, result })
        .catch((err) =>
          logger.warn('command-dispatcher: markAcked failed', {
            commandId,
            err: (err as Error).message,
          }),
        );
    },
    reject: (err: Error) => {
      void commandService
        .markFailed({
          commandId,
          errorText: err.message,
          fromStatus: ['SENT'],
        })
        .catch((failErr) =>
          logger.warn('command-dispatcher: markFailed(reject) raced', {
            commandId,
            err: (failErr as Error).message,
          }),
        );
    },
    timeoutHandle,
  };

  session.pendingCommands.set(msgSerial, pending);
}
