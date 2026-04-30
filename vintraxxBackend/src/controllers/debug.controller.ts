import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import logger from '../utils/logger';

const CLIENT_LOG_DIR = path.join(process.cwd(), 'logs', 'client');

// Ensure the directory exists once at module load (sync is fine — tiny cost).
try {
  fs.mkdirSync(CLIENT_LOG_DIR, { recursive: true });
} catch (err) {
  logger.warn('Failed to create client log directory', {
    dir: CLIENT_LOG_DIR,
    error: (err as Error).message,
  });
}

const clientLogSchema = z.object({
  clientVersion: z.string().optional(),
  platform: z.string().optional(),
  deviceModel: z.string().optional(),
  // Free-form entries. The mobile side batches Logger + DebugLogger entries.
  entries: z
    .array(
      z.object({
        timestamp: z.string().optional(),
        level: z.string().optional(),
        category: z.string().optional(),
        message: z.string(),
        meta: z.any().optional(),
      }),
    )
    .max(5000),
});

/**
 * POST /api/v1/debug/client-log
 *
 * Accepts a batch of mobile-side log entries and writes them to
 * `logs/client/<userId>-<YYYY-MM-DD>.log` so we can correlate mobile issues
 * with backend logs using the shared `requestId`. Auth-gated so only the
 * owning user can upload their logs.
 */
export async function uploadClientLog(req: Request, res: Response): Promise<void> {
  const requestId = req.requestId ?? 'unknown';
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  const parsed = clientLogSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: 'Invalid log payload',
      errors: parsed.error.errors.map((e) => e.message),
    });
    return;
  }

  const { clientVersion, platform, deviceModel, entries } = parsed.data;
  const date = new Date().toISOString().slice(0, 10);
  const filename = path.join(CLIENT_LOG_DIR, `${userId}-${date}.log`);

  const header = {
    receivedAt: new Date().toISOString(),
    requestId,
    userId,
    userEmail: req.user?.email,
    clientVersion,
    platform,
    deviceModel,
    entryCount: entries.length,
  };

  const lines: string[] = [];
  lines.push(`==== BATCH ${JSON.stringify(header)} ====`);
  for (const entry of entries) {
    lines.push(JSON.stringify(entry));
  }
  lines.push('');

  try {
    await fs.promises.appendFile(filename, lines.join('\n'), 'utf8');
    // HIGH #14: do not echo the absolute server path back to the client.
    // We still log the filename server-side for ops correlation.
    logger.info('Client log batch received', {
      requestId,
      userId,
      clientVersion,
      platform,
      entryCount: entries.length,
      filename,
    });
    res.json({ success: true, received: entries.length });
  } catch (err) {
    logger.error('Failed to write client log batch', {
      requestId,
      userId,
      error: (err as Error).message,
    });
    res.status(500).json({ success: false, message: 'Failed to store log batch' });
  }
}
