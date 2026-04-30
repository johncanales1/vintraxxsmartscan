// GPS WebSocket client — live event stream from /ws.
//
// Connects to wss://api.vintraxx.com/ws?token=<jwt> (JWT comes from
// authService) and exposes a typed listener API for screens that need
// real-time updates (LiveTrackScreen, AlertsScreen, FleetScreen, etc.).
//
// Resilience:
//   • Exponential back-off + jitter on reconnect (1 s → 30 s).
//   • 25 s app-level pings; backend disconnects after 90 s of silence.
//   • Auto-rebinds on auth-token rotation (callers don't have to recreate
//     subscriptions when the token refreshes).
//   • All work is no-ops when the user isn't authenticated yet — the next
//     login will kick off `connect()` if anyone called it earlier.
//
// We deliberately keep this dependency-free (no `events`, no `mitt`) so the
// React Native bundler doesn't have to ship anything extra. The custom
// listener map is ~30 lines and gives us proper TypeScript discrimination
// over `WsInboundEvent`.

import { logger, LogCategory } from '../../utils/Logger';
import { authService } from '../auth/AuthService';
import { gpsApi } from './GpsApiService';
import { GPS_WS_CONFIG } from '../../config/api';
import type {
  WsInboundEvent,
  WsLocationUpdate,
  WsAlarmEvent,
  WsDtcEvent,
  WsTripEvent,
  WsTerminalStatus,
} from '../../types/gps';

/** Connection state visible to UI for "Live / Reconnecting / Offline" banners. */
export type GpsWsState = 'idle' | 'connecting' | 'open' | 'closed';

/**
 * Discriminated event map. Listener callbacks are typed against the matching
 * WS frame so screens get full IntelliSense.
 */
type EventHandlerMap = {
  state: (state: GpsWsState) => void;
  any: (event: WsInboundEvent) => void;
  'location.update': (event: WsLocationUpdate) => void;
  'alarm.opened': (event: WsAlarmEvent) => void;
  'alarm.closed': (event: WsAlarmEvent) => void;
  'alarm.acknowledged': (event: WsAlarmEvent) => void;
  'dtc.detected': (event: WsDtcEvent) => void;
  'trip.opened': (event: WsTripEvent) => void;
  'trip.closed': (event: WsTripEvent) => void;
  'terminal.online': (event: WsTerminalStatus) => void;
  'terminal.offline': (event: WsTerminalStatus) => void;
};

type EventName = keyof EventHandlerMap;

class GpsWsClient {
  private static instance: GpsWsClient;

  private ws: WebSocket | null = null;
  private state: GpsWsState = 'idle';
  /** Channels we want subscribed *once connected*. Replayed on reconnect. */
  private desiredChannels = new Set<string>();
  /** Channels currently confirmed by the server. */
  private subscribedChannels = new Set<string>();
  /** Token used for the current/last connection — detect rotation. */
  private lastTokenUsed: string | null = null;

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private idleWatchdog: ReturnType<typeof setTimeout> | null = null;
  /** Increases on every consecutive failure for back-off; reset on success. */
  private reconnectAttempt = 0;
  /** True when the user explicitly called `disconnect()`. Stops auto-retry. */
  private stopped = true;

  private listeners: Map<EventName, Set<(...args: any[]) => void>> = new Map();

  static getInstance(): GpsWsClient {
    if (!GpsWsClient.instance) GpsWsClient.instance = new GpsWsClient();
    return GpsWsClient.instance;
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /**
   * Open (or reuse) the WebSocket. Idempotent — calling while already
   * connected just resolves immediately. Call this after login.
   */
  connect(): void {
    this.stopped = false;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.openSocket();
  }

  /**
   * Cleanly close the connection (logout). Cancels any pending reconnect
   * and clears all subscriptions so the next `connect()` starts fresh.
   */
  disconnect(): void {
    this.stopped = true;
    this.clearTimers();
    this.desiredChannels.clear();
    this.subscribedChannels.clear();
    if (this.ws) {
      try {
        this.ws.close(1000, 'client disconnect');
      } catch {
        /* ignore */
      }
      this.ws = null;
    }
    this.setState('idle');
  }

  /**
   * Subscribe to one or more channels (`terminal:<uuid>` or `admin`). The
   * `user` channel is auto-subscribed by the server at connection time.
   * Subscriptions are remembered across reconnects.
   */
  subscribe(channels: string[]): void {
    for (const ch of channels) this.desiredChannels.add(ch);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ op: 'subscribe', channels });
    }
  }

  /** Subscribe to a specific terminal's live stream. Convenience helper. */
  subscribeToTerminal(terminalId: string): void {
    this.subscribe([`terminal:${terminalId}`]);
  }

  unsubscribe(channels: string[]): void {
    for (const ch of channels) this.desiredChannels.delete(ch);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ op: 'unsubscribe', channels });
    }
    for (const ch of channels) this.subscribedChannels.delete(ch);
  }

  unsubscribeFromTerminal(terminalId: string): void {
    this.unsubscribe([`terminal:${terminalId}`]);
  }

  getState(): GpsWsState {
    return this.state;
  }

  on<E extends EventName>(event: E, listener: EventHandlerMap[E]): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener as (...args: any[]) => void);
    // Return an unsubscribe function so callers in `useEffect` can clean up
    // without re-importing the same handler reference.
    return () => this.off(event, listener);
  }

  off<E extends EventName>(event: E, listener: EventHandlerMap[E]): void {
    this.listeners.get(event)?.delete(listener as (...args: any[]) => void);
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private openSocket(): void {
    const token = authService.getAuthToken();
    if (!token) {
      logger.warn(LogCategory.API, '[GPS-WS] No auth token; deferring connect');
      this.setState('idle');
      return;
    }

    this.lastTokenUsed = token;
    const url = gpsApi.buildWsUrl(GPS_WS_CONFIG.PATH);
    logger.info(LogCategory.API, '[GPS-WS] Opening connection', {
      attempt: this.reconnectAttempt,
    });
    this.setState('connecting');

    let socket: WebSocket;
    try {
      // Bug #M7: pass the JWT via the `Sec-WebSocket-Protocol` subprotocol
      // header (RN's WebSocket constructor accepts protocols as the second
      // arg). The backend's `authenticateUpgrade()` accepts both the
      // subprotocol and the legacy `?token=` query, so this is a clean
      // upgrade — no breaking change. Keeping JWTs out of the URL keeps
      // them out of nginx access logs.
      socket = new WebSocket(url, [gpsApi.buildWsSubprotocol(token)]);
    } catch (err) {
      logger.error(LogCategory.API, '[GPS-WS] Failed to construct WebSocket', err);
      this.scheduleReconnect();
      return;
    }
    this.ws = socket;

    socket.onopen = () => {
      logger.info(LogCategory.API, '[GPS-WS] Connection open');
      this.reconnectAttempt = 0;
      this.setState('open');
      this.startPingLoop();
      this.armIdleWatchdog();
      // Replay desired subscriptions (everything except `user`, which the
      // server auto-subscribes for us).
      const channels = Array.from(this.desiredChannels);
      if (channels.length > 0) {
        this.send({ op: 'subscribe', channels });
      }
    };

    socket.onmessage = (msg) => {
      this.armIdleWatchdog(); // any traffic resets the watchdog
      this.handleMessage(msg.data);
    };

    socket.onerror = (err) => {
      logger.warn(LogCategory.API, '[GPS-WS] Socket error', err);
      // onclose follows; reconnect is scheduled there.
    };

    socket.onclose = (ev) => {
      logger.info(LogCategory.API, '[GPS-WS] Connection closed', {
        code: (ev as { code?: number }).code,
        reason: (ev as { reason?: string }).reason,
      });
      this.clearTimers();
      this.subscribedChannels.clear();
      this.ws = null;
      this.setState('closed');
      if (!this.stopped) this.scheduleReconnect();
    };
  }

  private handleMessage(data: unknown): void {
    let parsed: WsInboundEvent | null = null;
    try {
      const text = typeof data === 'string' ? data : String(data);
      parsed = JSON.parse(text) as WsInboundEvent;
    } catch {
      logger.warn(LogCategory.API, '[GPS-WS] Failed to parse frame', { data });
      return;
    }
    if (!parsed?.type) return;

    // Special handling for control frames; everything else is fanned out.
    if (parsed.type === 'subscribed' || parsed.type === 'unsubscribed') {
      if (parsed.type === 'subscribed') {
        for (const ch of parsed.channels) this.subscribedChannels.add(ch);
        if (parsed.denied?.length) {
          logger.warn(LogCategory.API, '[GPS-WS] Subscriptions denied', {
            denied: parsed.denied,
          });
        }
      } else {
        for (const ch of parsed.channels) this.subscribedChannels.delete(ch);
      }
      return;
    }
    if (parsed.type === 'pong') return;
    if (parsed.type === 'welcome') {
      logger.info(LogCategory.API, '[GPS-WS] Welcome', {
        userId: parsed.userId,
        isAdmin: parsed.isAdmin,
      });
      return;
    }
    if (parsed.type === 'error') {
      logger.warn(LogCategory.API, '[GPS-WS] Server error frame', { error: parsed.error });
      return;
    }

    // Domain event — fan out to typed listeners + the catch-all `any`.
    this.emit(parsed.type as EventName, parsed);
    this.emit('any', parsed);
  }

  private emit(event: EventName, payload: unknown): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const fn of set) {
      try {
        (fn as (p: unknown) => void)(payload);
      } catch (err) {
        // A buggy screen handler must never break the WS loop.
        logger.error(LogCategory.API, '[GPS-WS] Listener threw', {
          event,
          err: (err as Error).message,
        });
      }
    }
  }

  private send(frame: object): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.send(JSON.stringify(frame));
    } catch (err) {
      logger.warn(LogCategory.API, '[GPS-WS] Send failed', err);
    }
  }

  private startPingLoop(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => {
      this.send({ op: 'ping' });
    }, GPS_WS_CONFIG.PING_INTERVAL_MS);
  }

  /** If we don't see any frame within the idle window, force a reconnect. */
  private armIdleWatchdog(): void {
    if (this.idleWatchdog) clearTimeout(this.idleWatchdog);
    this.idleWatchdog = setTimeout(() => {
      logger.warn(LogCategory.API, '[GPS-WS] Idle watchdog fired; tearing down');
      try {
        this.ws?.close(4000, 'idle');
      } catch {
        /* ignore */
      }
    }, GPS_WS_CONFIG.IDLE_TIMEOUT_MS);
  }

  private clearTimers(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.idleWatchdog) {
      clearTimeout(this.idleWatchdog);
      this.idleWatchdog = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.stopped) return;
    if (this.reconnectTimer) return;

    const base = GPS_WS_CONFIG.RECONNECT_BASE_MS;
    const max = GPS_WS_CONFIG.RECONNECT_MAX_MS;
    const exp = Math.min(max, base * 2 ** this.reconnectAttempt);
    // Full jitter — between 0 and `exp` — avoids reconnect storms when many
    // clients lose the same backend at once.
    const delay = Math.floor(Math.random() * exp);
    this.reconnectAttempt += 1;
    logger.info(LogCategory.API, '[GPS-WS] Reconnect scheduled', {
      delayMs: delay,
      attempt: this.reconnectAttempt,
    });
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      // Re-check token (might have rotated while we were waiting).
      const current = authService.getAuthToken();
      if (!current) {
        this.setState('idle');
        return;
      }
      if (current !== this.lastTokenUsed) {
        logger.info(LogCategory.API, '[GPS-WS] Auth token rotated; using new token');
      }
      this.openSocket();
    }, delay);
  }

  private setState(state: GpsWsState): void {
    if (this.state === state) return;
    this.state = state;
    const set = this.listeners.get('state');
    if (!set) return;
    for (const fn of set) {
      try {
        (fn as (s: GpsWsState) => void)(state);
      } catch {
        /* ignore */
      }
    }
  }
}

export const gpsWs = GpsWsClient.getInstance();
