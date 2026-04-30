/**
 * listener.ts — long-lived Postgres LISTEN client (backend process only).
 *
 * Prisma's connection pool reaps idle connections, so it's not safe to issue
 * LISTEN through it. We open one dedicated `pg.Client` (separate from the
 * Prisma pool) and keep it pinned to the `gps_event` channel for the lifetime
 * of the Express process.
 *
 * Auto-reconnect on socket loss with exponential backoff capped at 30s.
 *
 * Consumers subscribe via `gpsEventBus`:
 *   gpsEventBus.on('event', (e: GpsEvent) => { ... })
 *
 * The WebSocket server is the primary consumer. Tests can also wire in a
 * second consumer (e.g. an in-process pubsub bridge for analytics) without
 * touching the gateway code.
 */

import { Client } from 'pg';
import { EventEmitter } from 'events';
import { env } from '../config/env';
import logger from '../utils/logger';
import type { GpsEvent } from './notify';

class GpsEventBus extends EventEmitter {}
export const gpsEventBus = new GpsEventBus();

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30_000;

let client: Client | null = null;
let reconnectAttempts = 0;
let stopped = false;

async function connectAndListen(): Promise<void> {
  if (stopped) return;

  const c = new Client({ connectionString: env.DATABASE_URL });

  c.on('error', (err) => {
    // Don't reconnect from the error handler directly — `end` event fires
    // immediately after and that's where we schedule reconnection.
    logger.warn('GPS LISTEN client error', { err: err.message });
  });

  c.on('end', () => {
    if (stopped) return;
    const delay = Math.min(
      RECONNECT_MAX_MS,
      RECONNECT_BASE_MS * Math.pow(2, reconnectAttempts),
    );
    reconnectAttempts += 1;
    logger.warn('GPS LISTEN client disconnected; reconnecting', { delayMs: delay });
    setTimeout(() => {
      void connectAndListen();
    }, delay).unref();
  });

  c.on('notification', (msg) => {
    if (msg.channel !== 'gps_event' || !msg.payload) return;
    let parsed: GpsEvent;
    try {
      parsed = JSON.parse(msg.payload) as GpsEvent;
    } catch (err) {
      logger.warn('Bad gps_event payload (non-JSON); ignoring', {
        bytes: msg.payload.length,
        err: (err as Error).message,
      });
      return;
    }
    gpsEventBus.emit('event', parsed);
  });

  try {
    await c.connect();
    await c.query('LISTEN gps_event');
    client = c;
    reconnectAttempts = 0;
    logger.info('GPS LISTEN client connected and subscribed to gps_event');
  } catch (err) {
    logger.warn('GPS LISTEN connect failed; retrying', { err: (err as Error).message });
    // Trigger the same reconnect path as a runtime drop.
    try { await c.end(); } catch { /* ignore */ }
  }
}

/** Start the listener. Call once from src/index.ts on boot. */
export async function startGpsEventListener(): Promise<void> {
  if (client) return; // already running
  stopped = false;
  await connectAndListen();
}

/** Stop the listener (e.g. during graceful shutdown). */
export async function stopGpsEventListener(): Promise<void> {
  stopped = true;
  // MEDIUM #30: reset the backoff counter so a future re-start (e.g. in
  // tests, or a hot-reload of the backend module) begins at the base
  // 1-second delay instead of inheriting whatever exponential value we
  // were at when stopped.
  reconnectAttempts = 0;
  if (client) {
    try {
      await client.end();
    } catch (err) {
      logger.warn('Error closing GPS LISTEN client', { err: (err as Error).message });
    }
    client = null;
  }
}
