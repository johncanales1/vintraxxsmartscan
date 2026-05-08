/**
 * vintraxx-gateway — JT/T 808 TCP server.
 *
 * Process lifecycle:
 *   1. Boot: read env, ensure Prisma is reachable, bind TCP listener on
 *      GPS_TCP_PORT (and TLS on GPS_TLS_PORT when configured).
 *   2. Per connection: create a Session, attach data/error/close handlers.
 *   3. On `data`: append to session.inboundBuffer, run splitFrames, decode
 *      each complete frame, dispatch.
 *   4. On `close`/`error`: mark terminal OFFLINE, remove from registry.
 *   5. On SIGTERM/SIGINT: stop accepting new connections, end all live
 *      sockets, disconnect Prisma, exit.
 *
 * This file is an INDEPENDENT entry point — it is NOT imported by the
 * Express server. PM2 launches it as a separate process from
 * dist/gateway/index.js.
 */

// Install BigInt/Decimal JSON serialisers before any Prisma import. The
// gateway emits pg_notify payloads that may include such values; without
// the polyfill `JSON.stringify` would throw on a BigInt and silently corrupt
// a Decimal. See utils/json-bigint-decimal-polyfill.ts.
import '../utils/json-bigint-decimal-polyfill';

import net from 'net';
import tls from 'tls';
import fs from 'fs';
import { randomUUID } from 'crypto';

import { env } from '../config/env';
import prisma from '../config/db';
import logger from '../utils/logger';

import { splitFrames } from './codec/framing';
import { decodeFrame } from './codec';
import { Session } from './session/Session';
import { SessionRegistry } from './session/SessionRegistry';
import { dispatchFrame } from './handlers/dispatch';
import { emit as emitNotify } from '../realtime/notify';
import {
  startCommandDispatcher,
  stopCommandDispatcher,
} from './services/command-dispatcher';

const MAX_INBOUND_BUFFER_BYTES = 64 * 1024; // 64 KiB. JT/T 808 frames are far smaller.
const MAX_CONSECUTIVE_BAD_FRAMES = 10;

function attachSocket(socket: net.Socket): void {
  // Discourage Nagle on small frames — most JT/T 808 messages are < 200 bytes
  // and we want platform acks delivered immediately.
  socket.setNoDelay(true);
  // Application-level keepalive lives in the protocol (0x0002 heartbeats),
  // but TCP keepalive helps catch half-open sockets behind carrier NAT.
  socket.setKeepAlive(true, 60_000);

  const session = new Session({ id: randomUUID(), socket });
  SessionRegistry.add(session);
  session.log.info('TCP connection accepted');

  socket.on('data', async (chunk) => {
    // Cap the buffer to defend against attackers / misbehaving devices that
    // never emit a 0x7E.
    if (session.inboundBuffer.length + chunk.length > MAX_INBOUND_BUFFER_BYTES) {
      session.log.warn('Inbound buffer overflow; closing socket', {
        bufLen: session.inboundBuffer.length,
        chunkLen: chunk.length,
      });
      session.close('inbound buffer overflow');
      return;
    }
    session.inboundBuffer = Buffer.concat([session.inboundBuffer, chunk]);

    const { frames, rest } = splitFrames(session.inboundBuffer);
    session.inboundBuffer = rest;

    for (const frame of frames) {
      try {
        const decoded = decodeFrame(frame);
        session.touchHealthy();
        await dispatchFrame(session, decoded);
      } catch (err) {
        session.consecutiveBadFrames += 1;
        session.log.warn('Failed to decode frame', {
          err: (err as Error).message,
          consecutiveBadFrames: session.consecutiveBadFrames,
          frameLen: frame.length,
        });
        if (session.consecutiveBadFrames >= MAX_CONSECUTIVE_BAD_FRAMES) {
          session.close('too many consecutive bad frames');
          break;
        }
      }
    }
  });

  socket.on('error', (err) => {
    session.log.warn('Socket error', { err: err.message });
  });

  socket.on('close', async (hadError) => {
    session.log.info('TCP connection closed', { hadError });

    // Capture replacement state BEFORE we remove ourselves: if a NEW session
    // for the same terminal is in the registry, we were superseded by
    // `SessionRegistry.bind()` and must NOT flip the terminal OFFLINE — the
    // newer session is now the source of truth.
    const currentForTerminal = session.terminalId
      ? SessionRegistry.getByTerminalId(session.terminalId)
      : undefined;
    const replaced =
      session.terminalId !== null &&
      currentForTerminal !== undefined &&
      currentForTerminal !== session;

    SessionRegistry.remove(session);

    if (replaced) {
      session.log.info('Skipping OFFLINE write — session was replaced', {
        terminalId: session.terminalId,
      });
      return;
    }

    // Mark the terminal OFFLINE if we'd successfully bound it.
    //
    // MEDIUM #29: previously this was an unconditional `update`. If a NEW
    // session for the same terminal had bound between our `replaced` check
    // above and this DB write, we'd clobber the new session's ONLINE row
    // with our stale OFFLINE. Use `updateMany` with a CAS guard:
    // only flip to OFFLINE if status is still ONLINE *and* the row's
    // lastHeartbeatAt is no newer than the heartbeat the closing session
    // actually saw. The new session's handleHeartbeat / handleAuth will
    // have bumped lastHeartbeatAt past this threshold, so the update no-ops
    // for that race — exactly what we want.
    if (session.terminalId) {
      const offlineAt = new Date();
      const lastSeenByThisSession =
        session.lastHeartbeatAt ?? session.connectedAt;
      try {
        const result = await prisma.gpsTerminal.updateMany({
          where: {
            id: session.terminalId,
            status: 'ONLINE',
            OR: [
              { lastHeartbeatAt: null },
              { lastHeartbeatAt: { lte: lastSeenByThisSession } },
            ],
          },
          data: { status: 'OFFLINE', disconnectedAt: offlineAt },
        });
        if (result.count > 0) {
          // Re-read to get the ownerUserId for the notify (updateMany
          // doesn't return rows). One extra round-trip but only on the
          // happy path; the racy path skips this entirely.
          const row = await prisma.gpsTerminal.findUnique({
            where: { id: session.terminalId },
            select: { ownerUserId: true },
          });
          void emitNotify({
            type: 'terminal.offline',
            terminalId: session.terminalId,
            ownerUserId: row?.ownerUserId ?? null,
            at: offlineAt.toISOString(),
          });
        } else {
          session.log.info('OFFLINE write skipped — terminal already moved on', {
            terminalId: session.terminalId,
          });
        }
      } catch (e) {
        session.log.warn('Failed to mark terminal OFFLINE on disconnect', {
          err: (e as Error).message,
        });
      }
    }
  });
}

function startTcpListener(): net.Server {
  const server = net.createServer({ allowHalfOpen: false }, attachSocket);
  server.on('error', (err) => {
    logger.error('TCP listener error', { err: err.message });
  });
  server.listen(env.GPS_TCP_PORT, '0.0.0.0', () => {
    logger.info(`vintraxx-gateway listening (TCP) on 0.0.0.0:${env.GPS_TCP_PORT}`);
  });
  return server;
}

/**
 * Optional TLS-terminating listener for carriers requiring SIM-PKI / VPC-
 * native encryption. Activated only when GPS_TLS_PORT > 0 AND both
 * GPS_TLS_CERT_PATH and GPS_TLS_KEY_PATH are set.
 *
 * The TLS server hands clean Sockets to the SAME `attachSocket` pipeline,
 * so the protocol code is identical for cleartext and TLS clients —
 * downstream code never has to special-case the transport.
 *
 * Returns `null` when TLS is disabled or misconfigured (we log the reason
 * but never throw — the cleartext listener is the production fallback).
 */
function startTlsListener(): tls.Server | null {
  const port = env.GPS_TLS_PORT;
  if (!port || port <= 0) return null;

  const certPath = env.GPS_TLS_CERT_PATH;
  const keyPath = env.GPS_TLS_KEY_PATH;
  if (!certPath || !keyPath) {
    logger.warn(
      'GPS_TLS_PORT set but GPS_TLS_CERT_PATH / GPS_TLS_KEY_PATH missing; TLS disabled',
    );
    return null;
  }

  let cert: Buffer;
  let key: Buffer;
  try {
    cert = fs.readFileSync(certPath);
    key = fs.readFileSync(keyPath);
  } catch (err) {
    logger.error('Failed to read TLS cert/key; TLS disabled', {
      certPath,
      keyPath,
      err: (err as Error).message,
    });
    return null;
  }

  const server = tls.createServer(
    {
      cert,
      key,
      // We don't require client certs by default — most cellular carriers
      // give devices a server-only TLS endpoint. Operators who DO want
      // mTLS can flip this to true and supply `ca` once we add an env hook.
      requestCert: false,
      // Devices in the field run old TLS stacks; require at least 1.2.
      minVersion: 'TLSv1.2',
    },
    attachSocket,
  );

  server.on('tlsClientError', (err, socket) => {
    logger.warn('TLS handshake error', {
      err: err.message,
      remote: `${socket.remoteAddress ?? '?'}:${socket.remotePort ?? 0}`,
    });
  });

  server.on('error', (err) => {
    logger.error('TLS listener error', { err: err.message });
  });

  server.listen(port, '0.0.0.0', () => {
    logger.info(`vintraxx-gateway listening (TLS) on 0.0.0.0:${port}`);
  });
  return server;
}

async function bootstrap(): Promise<void> {
  // Sanity-check Prisma connectivity before accepting devices. If the DB is
  // unreachable we'd just queue write failures forever.
  await prisma.$queryRawUnsafe('SELECT 1');
  logger.info('vintraxx-gateway: Prisma connection healthy');

  // Reconcile: any terminal still marked ONLINE from a prior crash/SIGKILL
  // (where the socket-close handler never ran) should be flipped to OFFLINE.
  // Without this, the admin dashboard's "online count" would lie until each
  // device reconnects and re-auths.
  const staleOnline = await prisma.gpsTerminal.updateMany({
    where: { status: 'ONLINE' },
    data: { status: 'OFFLINE', disconnectedAt: new Date() },
  });
  if (staleOnline.count > 0) {
    logger.info(`vintraxx-gateway: reconciled ${staleOnline.count} stale ONLINE terminals → OFFLINE`);
  }

  // Start the downstream-command dispatcher (LISTEN gps_command + 30s sweep).
  // Failure to connect is non-fatal — the dispatcher retries, and inbound
  // traffic continues unaffected.
  await startCommandDispatcher();

  const tcpServer = startTcpListener();
  const tlsServer = startTlsListener();

  // Periodic health log (every 60s).
  const healthTimer = setInterval(() => {
    const snap = SessionRegistry.snapshot();
    logger.info('gateway-health', {
      sessions: snap,
      bufferedSockets: tcpServer.listening,
      tlsListening: tlsServer?.listening ?? false,
    });
  }, 60_000);
  // Don't keep the event loop alive on this alone.
  healthTimer.unref();

  // Graceful shutdown.
  const shutdown = async (signal: string) => {
    logger.info(`vintraxx-gateway: received ${signal}, shutting down`);
    tcpServer.close();
    tlsServer?.close();
    // Stop accepting new commands first so we don't open new pending entries
    // on sessions we're about to tear down.
    await stopCommandDispatcher();
    for (const s of SessionRegistry.iter()) {
      s.close(`process shutdown (${signal})`);
    }
    try {
      await prisma.$disconnect();
    } catch (e) {
      logger.warn('Prisma disconnect failed', { err: (e as Error).message });
    }
    // Give in-flight callbacks a beat to flush before exiting.
    setTimeout(() => process.exit(0), 1000).unref();
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    logger.error('uncaughtException', { err: err.message, stack: err.stack });
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('unhandledRejection', { reason: String(reason) });
  });
}

bootstrap().catch((err) => {
  logger.error('vintraxx-gateway bootstrap failed', {
    err: (err as Error).message,
    stack: (err as Error).stack,
  });
  process.exit(1);
});
