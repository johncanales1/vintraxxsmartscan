/**
 * wsServer.ts — WebSocket fan-out for GPS events.
 *
 * Mounts on the existing Express HTTP server at GPS_WS_PATH (default `/ws`).
 *
 * Authentication: the client passes a JWT either as `?token=...` query string
 * or inside the `Sec-WebSocket-Protocol` subprotocol header. Rejected during
 * the HTTP UPGRADE handshake — we never accept an anonymous WS.
 *
 * Channel model after auth:
 *   • `user`               (auto-subscribed) — events for terminals owned by
 *                          the authenticated user. Filtering by ownerUserId
 *                          happens server-side; clients can't widen scope.
 *   • `terminal:<uuid>`    explicit subscribe to a single terminal. Server
 *                          verifies the client is the owner OR an admin.
 *   • `admin`              admin-only firehose of every event. Rejected for
 *                          non-admin tokens (the JwtPayload.role is checked).
 *
 * Wire protocol (text JSON frames):
 *   ←  { op:"subscribe",   channels:["terminal:abc"] }
 *   →  { type:"subscribed", channels:[...] }
 *   ←  { op:"unsubscribe", channels:["terminal:abc"] }
 *   ←  { op:"ping" }
 *   →  { type:"pong" }
 *   →  { type:"location.update"|"alarm.opened"|... ,  ... }   ← from listener
 */

import type { IncomingMessage, Server as HttpServer } from 'http';
import type { Socket } from 'net';
import { WebSocketServer, WebSocket, RawData } from 'ws';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import logger from '../utils/logger';
import prisma from '../config/db';
import { gpsEventBus } from './listener';
import type { GpsEvent } from './notify';
import type { JwtPayload } from '../types';
import type { AdminJwtPayload } from '../middleware/adminAuth';

/**
 * Normalized identity placed on every connected client. We accept BOTH user
 * JWTs (`{userId, email}`) and admin JWTs (`{adminId, email, role:'admin'}`)
 * because both API surfaces sign with the same JWT_SECRET. The shape
 * difference is what we use to decide isAdmin.
 *
 * `userId` here means "scope id" — for admins we set it to the adminId so the
 * client-side fan-out logic can still key off a single field, but isAdmin
 * differentiates ownership-based filtering from the firehose.
 */
interface AuthContext {
  userId: string;
  email: string;
  isAdmin: boolean;
}

interface AuthedClient {
  ws: WebSocket;
  userId: string;
  isAdmin: boolean;
  /** Channels this client has explicitly opted into (beyond the auto `user`). */
  subscriptions: Set<string>;
  /** Last activity (ping or message). Closed if idle > IDLE_TIMEOUT_MS. */
  lastSeen: number;
}

const PING_INTERVAL_MS = 30_000;
const IDLE_TIMEOUT_MS = 90_000;

const clients = new Set<AuthedClient>();

/**
 * Attach a WS server to the given HTTP server. Returns the WS server so the
 * caller can shut it down on SIGTERM.
 */
export function attachGpsWebSocket(httpServer: HttpServer): WebSocketServer {
  // We DON'T use { server } here — we want to manually handle 'upgrade' so
  // we can authenticate before ws decides to send a 101 response.
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (req, socket, head) => {
    if (!isOurUpgrade(req)) return; // some other ws server in the future may share the port

    const auth = authenticateUpgrade(req);
    if (!auth) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket as Socket, head, (ws: WebSocket) => {
      wss.emit('connection', ws, req, auth);
    });
  });

  wss.on('connection', (ws: WebSocket, _req: IncomingMessage, auth: AuthContext) => {
    const client: AuthedClient = {
      ws,
      userId: auth.userId,
      isAdmin: auth.isAdmin,
      subscriptions: new Set(),
      lastSeen: Date.now(),
    };
    clients.add(client);
    logger.info('GPS WebSocket client connected', {
      userId: client.userId,
      isAdmin: client.isAdmin,
      total: clients.size,
    });

    // Welcome frame includes the auto-applied scope so clients don't have to
    // guess. They're free to .subscribe() to narrower channels afterwards.
    safeSend(ws, {
      type: 'welcome',
      userId: client.userId,
      isAdmin: client.isAdmin,
      autoChannels: ['user'],
    });

    ws.on('message', (data: RawData) => {
      void handleClientMessage(client, data);
    });
    ws.on('pong', () => {
      client.lastSeen = Date.now();
    });
    ws.on('close', () => {
      clients.delete(client);
      logger.info('GPS WebSocket client disconnected', {
        userId: client.userId,
        total: clients.size,
      });
    });
    ws.on('error', (err: Error) => {
      logger.warn('GPS WebSocket client error', {
        userId: client.userId,
        err: err.message,
      });
    });
  });

  // Heartbeat — drop anyone who hasn't responded to a ping in IDLE_TIMEOUT_MS.
  // Bonus: keeps NAT idle-timers from killing the socket.
  const heartbeat = setInterval(() => {
    const now = Date.now();
    for (const c of clients) {
      if (now - c.lastSeen > IDLE_TIMEOUT_MS) {
        logger.info('Closing idle WS client', { userId: c.userId });
        try { c.ws.terminate(); } catch { /* ignore */ }
        clients.delete(c);
        continue;
      }
      try {
        c.ws.ping();
      } catch {
        clients.delete(c);
      }
    }
  }, PING_INTERVAL_MS);
  heartbeat.unref();

  // Subscribe to the in-process bus for outbound fan-out.
  gpsEventBus.on('event', (e: GpsEvent) => fanOut(e));

  return wss;
}

function isOurUpgrade(req: IncomingMessage): boolean {
  if (!req.url) return false;
  // Strip query string for the path comparison.
  const path = req.url.split('?')[0];
  return path === env.GPS_WS_PATH;
}

function authenticateUpgrade(req: IncomingMessage): AuthContext | null {
  // Token may live in the query string, the Authorization header, or the
  // Sec-WebSocket-Protocol header (browsers can't set Authorization on WS).
  let token: string | undefined;

  if (req.url) {
    const qIdx = req.url.indexOf('?');
    if (qIdx !== -1) {
      const params = new URLSearchParams(req.url.slice(qIdx + 1));
      token = params.get('token') ?? undefined;
    }
  }
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }
  if (!token) {
    const subproto = req.headers['sec-websocket-protocol'];
    if (typeof subproto === 'string') {
      // Convention: `Bearer.<jwt>` or just `<jwt>`.
      const cleaned = subproto.replace(/^Bearer\.?/i, '').trim();
      if (cleaned) token = cleaned;
    }
  }

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload | AdminJwtPayload;
    // Discriminate by shape: admin tokens have `adminId` + `role:'admin'`,
    // user tokens have `userId`. Anything else is malformed.
    if ('adminId' in decoded && decoded.role === 'admin') {
      return { userId: decoded.adminId, email: decoded.email, isAdmin: true };
    }
    if ('userId' in decoded) {
      return { userId: decoded.userId, email: decoded.email, isAdmin: false };
    }
    logger.warn('GPS WS auth: token has unexpected shape');
    return null;
  } catch (err) {
    logger.warn('GPS WS auth failed', { err: (err as Error).message });
    return null;
  }
}

interface ClientOp {
  op: 'subscribe' | 'unsubscribe' | 'ping';
  channels?: string[];
}

async function handleClientMessage(client: AuthedClient, data: RawData): Promise<void> {
  client.lastSeen = Date.now();
  let msg: ClientOp;
  try {
    msg = JSON.parse(typeof data === 'string' ? data : data.toString('utf8')) as ClientOp;
  } catch {
    safeSend(client.ws, { type: 'error', error: 'Invalid JSON' });
    return;
  }

  if (msg.op === 'ping') {
    safeSend(client.ws, { type: 'pong' });
    return;
  }

  if (msg.op === 'subscribe' || msg.op === 'unsubscribe') {
    const requested = Array.isArray(msg.channels) ? msg.channels : [];
    const allowed: string[] = [];
    const denied: string[] = [];

    for (const ch of requested) {
      const ok = await canAccessChannel(client, ch);
      if (ok) allowed.push(ch);
      else denied.push(ch);
    }

    if (msg.op === 'subscribe') {
      for (const ch of allowed) client.subscriptions.add(ch);
      safeSend(client.ws, {
        type: 'subscribed',
        channels: allowed,
        ...(denied.length > 0 ? { denied } : {}),
      });
    } else {
      for (const ch of allowed) client.subscriptions.delete(ch);
      safeSend(client.ws, { type: 'unsubscribed', channels: allowed });
    }
    return;
  }

  safeSend(client.ws, { type: 'error', error: `Unknown op: ${String((msg as ClientOp).op)}` });
}

/**
 * A user may subscribe to:
 *   • `admin`              — only admins
 *   • `terminal:<uuid>`    — only the owner OR any admin
 *   • anything else        — denied
 *
 * `user` is auto-subscribed at connection time and is not requestable
 * (forbidding it here keeps the protocol simple).
 */
async function canAccessChannel(client: AuthedClient, channel: string): Promise<boolean> {
  if (channel === 'admin') return client.isAdmin;
  if (channel.startsWith('terminal:')) {
    const terminalId = channel.slice('terminal:'.length);
    if (client.isAdmin) return true;
    const t = await prisma.gpsTerminal.findUnique({
      where: { id: terminalId },
      select: { ownerUserId: true },
    });
    return t?.ownerUserId === client.userId;
  }
  return false;
}

/**
 * Decide whether `event` should reach `client`. Rules:
 *   • admin firehose → all clients with `admin` subscription.
 *   • user scope     → events whose ownerUserId === client.userId.
 *   • per-terminal   → events whose terminalId is in client.subscriptions.
 *
 * A single event can match multiple rules; the client just gets one copy.
 */
function shouldDeliver(client: AuthedClient, e: GpsEvent): boolean {
  if (client.isAdmin && client.subscriptions.has('admin')) return true;
  if (e.ownerUserId && e.ownerUserId === client.userId) return true;
  if (client.subscriptions.has(`terminal:${e.terminalId}`)) return true;
  return false;
}

function fanOut(e: GpsEvent): void {
  for (const c of clients) {
    if (shouldDeliver(c, e)) {
      safeSend(c.ws, e);
    }
  }
}

function safeSend(ws: WebSocket, payload: unknown): void {
  if (ws.readyState !== WebSocket.OPEN) return;
  try {
    ws.send(JSON.stringify(payload));
  } catch (err) {
    logger.warn('Failed to send WS frame', { err: (err as Error).message });
  }
}

/** Snapshot for /health. */
export function wsHealth(): { connectedClients: number } {
  return { connectedClients: clients.size };
}
