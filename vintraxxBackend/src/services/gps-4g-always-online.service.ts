/**
 * gps-4g-always-online.service — manages the 4G Always-Online toggle
 * for GPS terminals (D450/HOLLOO).
 *
 * Sends a JT/T 808 0x8300 Text Message Delivery with the supplier-confirmed
 * enable command. The disable command is configurable via env and defaults
 * to unconfigured (supplier has not yet confirmed it).
 *
 * Two-layer state flow:
 *
 *   toggle ON  → PENDING_ENABLE
 *              → (0x0001 result=0) → JT808_ACKED          (layer-1: transport ACK)
 *              → (0x6006 received) → RESPONSE_RECEIVED     (layer-2: vendor text reply)
 *              → (0x6006 timeout)  → VENDOR_RESPONSE_TIMEOUT
 *              → (0x0001 timeout)  → FAILED
 *
 *   toggle OFF → PENDING_DISABLE  (same two-layer flow)
 *
 *   0xF3 sleep after command → SLEPT_AFTER_COMMAND (stored alongside current status)
 *
 * TODO: Supplier must confirm the 0x6006 body format and success/failure
 * codes/text for <HL&P:HOLLOO&7K:1>. Until confirmed, we only capture,
 * decode, and display 0x6006. We do NOT infer final success from unknown text.
 */

import prisma from '../config/db';
import logger from '../utils/logger';
import { env } from '../config/env';
import { enqueueCommand } from './gps-command.service';
import { AppError } from '../middleware/errorHandler';

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Enable 4G always-online for a terminal.
 * Creates a GpsCommand of kind 'enable-4g-always-online' using the
 * supplier-confirmed text payload and updates the terminal state.
 */
export async function enableAlwaysOnline(args: {
  terminalId: string;
  adminId: string;
  force?: boolean;
}) {
  const terminal = await prisma.gpsTerminal.findUnique({
    where: { id: args.terminalId },
    select: {
      id: true,
      deviceIdentifier: true,
      status: true,
      fourGAlwaysOnlineStatus: true,
      fourGAlwaysOnlineLastCommandId: true,
    },
  });
  if (!terminal) throw new AppError('Terminal not found', 404);

  // Dedup: if a command is already pending, return it unless force=true.
  if (
    !args.force &&
    (terminal.fourGAlwaysOnlineStatus === 'PENDING_ENABLE' ||
      terminal.fourGAlwaysOnlineStatus === 'PENDING_DISABLE') &&
    terminal.fourGAlwaysOnlineLastCommandId
  ) {
    const existing = await prisma.gpsCommand.findUnique({
      where: { id: terminal.fourGAlwaysOnlineLastCommandId },
      select: { id: true, status: true, createdAt: true },
    });
    if (existing && (existing.status === 'QUEUED' || existing.status === 'SENT')) {
      logger.info('4G always-online: returning existing pending command', {
        terminalId: args.terminalId,
        commandId: existing.id,
        commandStatus: existing.status,
      });
      return { command: existing, reused: true };
    }
  }

  const enableCommand = env.GPS_4G_ALWAYS_ONLINE_ENABLE_COMMAND;

  const cmd = await enqueueCommand({
    terminalId: args.terminalId,
    adminId: args.adminId,
    kind: 'enable-4g-always-online',
    textPayload: enableCommand,
  });

  // Update terminal state
  await prisma.gpsTerminal.update({
    where: { id: args.terminalId },
    data: {
      fourGAlwaysOnlineDesired: true,
      fourGAlwaysOnlineStatus: 'PENDING_ENABLE',
      fourGAlwaysOnlineLastCommandId: cmd.id,
      fourGAlwaysOnlineLastError: null,
      fourGAlwaysOnlineUpdatedAt: new Date(),
    },
  });

  logger.info('4G always-online: enable command enqueued', {
    terminalId: args.terminalId,
    deviceIdentifier: terminal.deviceIdentifier,
    commandId: cmd.id,
    commandType: 'ENABLE_4G_ALWAYS_ONLINE',
    payloadText: enableCommand,
    transport: 'JT808_8300_TEXT',
    queued: cmd.status === 'QUEUED',
  });

  return { command: cmd, reused: false };
}

/**
 * Disable 4G always-online for a terminal.
 * Only works if GPS_4G_ALWAYS_ONLINE_DISABLE_COMMAND is configured.
 */
export async function disableAlwaysOnline(args: {
  terminalId: string;
  adminId: string;
  force?: boolean;
}) {
  const disableCommand = env.GPS_4G_ALWAYS_ONLINE_DISABLE_COMMAND;
  if (!disableCommand) {
    throw new AppError(
      'Disable command not configured — the supplier has not yet confirmed the disable payload. ' +
        'Set GPS_4G_ALWAYS_ONLINE_DISABLE_COMMAND in the environment to enable this action.',
      422,
    );
  }

  const terminal = await prisma.gpsTerminal.findUnique({
    where: { id: args.terminalId },
    select: {
      id: true,
      deviceIdentifier: true,
      status: true,
      fourGAlwaysOnlineStatus: true,
      fourGAlwaysOnlineLastCommandId: true,
    },
  });
  if (!terminal) throw new AppError('Terminal not found', 404);

  // Dedup
  if (
    !args.force &&
    (terminal.fourGAlwaysOnlineStatus === 'PENDING_ENABLE' ||
      terminal.fourGAlwaysOnlineStatus === 'PENDING_DISABLE') &&
    terminal.fourGAlwaysOnlineLastCommandId
  ) {
    const existing = await prisma.gpsCommand.findUnique({
      where: { id: terminal.fourGAlwaysOnlineLastCommandId },
      select: { id: true, status: true, createdAt: true },
    });
    if (existing && (existing.status === 'QUEUED' || existing.status === 'SENT')) {
      logger.info('4G always-online: returning existing pending command', {
        terminalId: args.terminalId,
        commandId: existing.id,
        commandStatus: existing.status,
      });
      return { command: existing, reused: true };
    }
  }

  const cmd = await enqueueCommand({
    terminalId: args.terminalId,
    adminId: args.adminId,
    kind: 'disable-4g-always-online',
    textPayload: disableCommand,
  });

  await prisma.gpsTerminal.update({
    where: { id: args.terminalId },
    data: {
      fourGAlwaysOnlineDesired: false,
      fourGAlwaysOnlineStatus: 'PENDING_DISABLE',
      fourGAlwaysOnlineLastCommandId: cmd.id,
      fourGAlwaysOnlineLastError: null,
      fourGAlwaysOnlineUpdatedAt: new Date(),
    },
  });

  logger.info('4G always-online: disable command enqueued', {
    terminalId: args.terminalId,
    deviceIdentifier: terminal.deviceIdentifier,
    commandId: cmd.id,
    commandType: 'DISABLE_4G_ALWAYS_ONLINE',
    payloadText: disableCommand,
    transport: 'JT808_8300_TEXT',
    queued: cmd.status === 'QUEUED',
  });

  return { command: cmd, reused: false };
}

/**
 * Returns whether the disable command is configured (so the frontend can
 * decide whether to show the switch-off action as disabled).
 */
export function isDisableConfigured(): boolean {
  return !!env.GPS_4G_ALWAYS_ONLINE_DISABLE_COMMAND;
}

// ── Lifecycle callbacks ──────────────────────────────────────────────────────

/**
 * Layer-1: Called when the terminal sends 0x0001 (JT/T 808 transport ACK).
 * result=0 means the message was delivered — NOT that the setting was applied.
 * Moves terminal status to JT808_ACKED and waits for the 0x6006 vendor reply.
 */
export async function onCommandJt808Acked(args: {
  commandId: string;
  kind: 'enable-4g-always-online' | 'disable-4g-always-online';
  terminalId: string;
  result: number;
}) {
  const now = new Date();
  const resultMeaning = resultCodeToString(args.result);

  if (args.result === 0) {
    await prisma.gpsTerminal.update({
      where: { id: args.terminalId },
      data: {
        fourGAlwaysOnlineStatus: 'JT808_ACKED',
        fourGAlwaysOnlineLastAckAt: now,
        fourGAlwaysOnlineLastError: null,
        fourGAlwaysOnlineUpdatedAt: now,
      },
    });
    logger.info('GPS command JT808 ACK received', {
      commandId: args.commandId,
      terminalId: args.terminalId,
      responseId: '0x0001',
      kind: args.kind,
      result: args.result,
      resultMeaning,
      note: '0x0001 confirms message delivery only. Awaiting 0x6006 vendor response.',
    });
  } else {
    const reason = resultCodeToString(args.result);
    await prisma.gpsTerminal.update({
      where: { id: args.terminalId },
      data: {
        fourGAlwaysOnlineStatus: 'FAILED',
        fourGAlwaysOnlineLastAckAt: now,
        fourGAlwaysOnlineLastError: `Transport rejected: ${reason} (result=${args.result})`,
        fourGAlwaysOnlineUpdatedAt: now,
      },
    });
    logger.warn('GPS command JT808 ACK: rejected at transport layer', {
      commandId: args.commandId,
      terminalId: args.terminalId,
      responseId: '0x0001',
      kind: args.kind,
      result: args.result,
      resultMeaning,
    });
  }
}

/**
 * Layer-2: Called when the device sends 0x6006 text reply.
 *
 * TODO: Supplier must confirm the exact 0x6006 body format and the
 * success/failure text pattern for <HL&P:HOLLOO&7K:1>. Until confirmed,
 * status is set to RESPONSE_RECEIVED — we do NOT infer ENABLED/DISABLED.
 */
export async function onVendorResponseReceived(args: {
  commandId: string;
  kind: 'enable-4g-always-online' | 'disable-4g-always-online';
  terminalId: string;
  rawHex: string;
  decodedText: string;
  parseStatus: string;
}) {
  await prisma.gpsTerminal.update({
    where: { id: args.terminalId },
    data: {
      fourGAlwaysOnlineStatus: 'RESPONSE_RECEIVED',
      fourGAlwaysOnlineLastError: null,
      fourGAlwaysOnlineUpdatedAt: new Date(),
    },
  });
  logger.info('GPS command vendor response received (0x6006)', {
    commandId: args.commandId,
    terminalId: args.terminalId,
    messageId: '0x6006',
    kind: args.kind,
    bodyLength: Math.floor(args.rawHex.length / 2),
    rawHex: args.rawHex,
    decodedText: args.decodedText,
    parseStatus: args.parseStatus,
    note: 'TODO: Supplier must confirm success/failure text. Status RESPONSE_RECEIVED pending confirmation.',
  });
}

/**
 * Called when 0x6006 vendor response was not received within the timeout
 * window after 0x0001 ACK.
 */
export async function onVendorResponseTimeout(args: {
  commandId: string;
  terminalId: string;
}) {
  await prisma.gpsTerminal.update({
    where: { id: args.terminalId },
    data: {
      fourGAlwaysOnlineStatus: 'VENDOR_RESPONSE_TIMEOUT',
      fourGAlwaysOnlineLastError: 'Vendor 0x6006 response not received within timeout window',
      fourGAlwaysOnlineUpdatedAt: new Date(),
    },
  });
  logger.warn('4G always-online: vendor response timeout', {
    commandId: args.commandId,
    terminalId: args.terminalId,
    note: '0x0001 ACK received but device did not send 0x6006 within timeout.',
  });
}

/**
 * Called when 0xF3 sleep entry arrives after a 4G always-online command.
 * The command was delivered (0x0001) but the device still slept.
 */
export async function onSleepAfterCommand(args: {
  commandId: string;
  kind: 'enable-4g-always-online' | 'disable-4g-always-online';
  terminalId: string;
  sleepAt: Date;
  secondsSinceCommand: number | null;
}) {
  await prisma.gpsTerminal.update({
    where: { id: args.terminalId },
    data: {
      fourGAlwaysOnlineStatus: 'SLEPT_AFTER_COMMAND',
      fourGAlwaysOnlineLastError:
        `Device entered sleep mode ${
          args.secondsSinceCommand != null ? args.secondsSinceCommand + 's' : ''
        } after command was sent. ` +
        `0x0001 ACK was received but device still entered sleep. ` +
        `Review vendor 0x6006 response to understand sleep behaviour.`,
      fourGAlwaysOnlineUpdatedAt: new Date(),
    },
  });
  logger.warn('GPS terminal sleep notification after 4G always-online command', {
    commandId: args.commandId,
    terminalId: args.terminalId,
    kind: args.kind,
    sleepAt: args.sleepAt.toISOString(),
    secondsSinceCommand: args.secondsSinceCommand,
    note: 'Command was accepted by terminal (0x0001 ACK), but device still entered sleep mode.',
  });
}

/**
 * Called when a 4G always-online command fails (timeout, socket error, etc.).
 */
export async function onCommandFailed(args: {
  commandId: string;
  terminalId: string;
  errorText: string;
}) {
  await prisma.gpsTerminal.update({
    where: { id: args.terminalId },
    data: {
      fourGAlwaysOnlineStatus: 'FAILED',
      fourGAlwaysOnlineLastError: args.errorText,
      fourGAlwaysOnlineUpdatedAt: new Date(),
    },
  });
  logger.warn('4G always-online: command failed', {
    terminalId: args.terminalId,
    commandId: args.commandId,
    reason: args.errorText,
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function resultCodeToString(code: number): string {
  switch (code) {
    case 0x00: return 'success';
    case 0x01: return 'failure';
    case 0x02: return 'message incorrect';
    case 0x03: return 'not supported';
    case 0x04: return 'executing previous operation';
    default: return `unknown (0x${code.toString(16).padStart(2, '0')})`;
  }
}
