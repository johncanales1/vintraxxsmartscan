/**
 * gps-4g-always-online.service — manages the 4G Always-Online toggle
 * for GPS terminals (D450/HOLLOO).
 *
 * Sends a JT/T 808 0x8300 Text Message Delivery with the supplier-confirmed
 * enable command. The disable command is configurable via env and defaults
 * to unconfigured (supplier has not yet confirmed it).
 *
 * State flow:
 *   toggle ON  → PENDING_ENABLE  → (ACK 0x00) → ENABLED
 *   toggle OFF → PENDING_DISABLE → (ACK 0x00) → DISABLED
 *                                → (ACK !0x00 or timeout) → FAILED
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

// ── Lifecycle callbacks (called from gps-command.service markAcked/markFailed) ──

/**
 * Called when a 4G always-online command is successfully acked by the terminal
 * (0x0001 result = 0x00).
 */
export async function onCommandAcked(args: {
  commandId: string;
  kind: 'enable-4g-always-online' | 'disable-4g-always-online';
  terminalId: string;
  result: number;
}) {
  const now = new Date();

  if (args.result === 0) {
    // Success
    const isEnable = args.kind === 'enable-4g-always-online';
    await prisma.gpsTerminal.update({
      where: { id: args.terminalId },
      data: {
        fourGAlwaysOnlineStatus: isEnable ? 'ENABLED' : 'DISABLED',
        fourGAlwaysOnlineDesired: isEnable,
        fourGAlwaysOnlineLastAckAt: now,
        fourGAlwaysOnlineLastError: null,
        fourGAlwaysOnlineUpdatedAt: now,
      },
    });

    logger.info('4G always-online: command acked successfully', {
      terminalId: args.terminalId,
      commandId: args.commandId,
      kind: args.kind,
      result: args.result,
      newStatus: isEnable ? 'ENABLED' : 'DISABLED',
    });
  } else {
    // Non-zero result — device rejected
    const reason = resultCodeToString(args.result);
    await prisma.gpsTerminal.update({
      where: { id: args.terminalId },
      data: {
        fourGAlwaysOnlineStatus: 'FAILED',
        fourGAlwaysOnlineLastAckAt: now,
        fourGAlwaysOnlineLastError: `Device rejected: ${reason} (result=${args.result})`,
        fourGAlwaysOnlineUpdatedAt: now,
      },
    });

    logger.warn('4G always-online: command rejected by device', {
      terminalId: args.terminalId,
      commandId: args.commandId,
      kind: args.kind,
      result: args.result,
      reason,
    });
  }
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
