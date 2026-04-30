/**
 * gpsAdminWs — admin WebSocket client for the realtime firehose.
 *
 * One connection per browser tab, lazily opened on first subscriber. The
 * admin auto-subscribes to channel `admin` after the welcome frame so it
 * receives every event in the system (`@d:/Work/vintraxxsmartscan/vintraxxBackend/src/realtime/wsServer.ts:299-304`).
 *
 * Per-channel refcounting lets multiple components subscribe to the same
 * narrower scope (e.g. `terminal:<id>` from the Detail modal) without
 * duplicate frames. The client survives section navigation and tears
 * down on logout (called from `auth.tsx::logout`).
 *
 * Bug fixes baked in from the dealer-dashboard audit:
 *   • Reads server error frames from `msg.error` (NOT `reason`).
 *   • State events are emitted whenever the connection flips, so the
 *     RealtimePill stays in sync without polling.
 *   • Backoff is exponential with jitter, capped at 30 s.
 */

'use client';

const HEARTBEAT_MS = 25_000;
const MAX_BACKOFF_MS = 30_000;
const INITIAL_BACKOFF_MS = 500;

export type WsState = 'idle' | 'connecting' | 'open' | 'closing' | 'closed';

/**
 * Backend wire shape for `location.update` is:
 *   { type, terminalId, ownerUserId, data: { reportedAt, latitude, ... } }
 *
 * The payload key is `data` (NOT `location`) — see
 * `vintraxxBackEnd/src/realtime/notify.ts::LocationUpdateEvent` and the
 * matching dealer-side `WsLocationUpdate` in
 * `vintraxxFrontend/.../_lib/types.ts`. Renaming this on the client would
 * silently drop telemetry, so we mirror the wire field name here and the
 * consumers read `e.data.*`.
 */
export interface WsLocationUpdate {
  type: 'location.update';
  terminalId: string;
  ownerUserId?: string | null;
  data: {
    latitude: number;
    longitude: number;
    speedKmh: number | null;
    heading: number | null;
    altitudeM: number | null;
    accOn: boolean | null;
    gpsFix: boolean | null;
    reportedAt: string;
    alarmBits?: number;
    statusBits?: number;
  };
}

/**
 * Each terminal-state / alarm / trip event must use a single literal `type`
 * so that `Extract<WsDomainEvent, { type: T }>` (used by `on<T>(...)`) can
 * narrow correctly. Earlier we declared union-typed `type` fields here,
 * which made Extract collapse to `never` and produced spurious "Property
 * 'terminalId' does not exist on type 'never'" errors at every consumer.
 * The compatible-shape interfaces share their fields and re-export under
 * the original group names so existing consumers stay backward-compatible.
 */
interface WsTerminalStateBase {
  terminalId: string;
  at: string;
}
export interface WsTerminalOnline extends WsTerminalStateBase {
  type: 'terminal.online';
}
export interface WsTerminalOffline extends WsTerminalStateBase {
  type: 'terminal.offline';
}
export type WsTerminalState = WsTerminalOnline | WsTerminalOffline;

interface WsAlarmEventBase {
  alarmId: string;
  terminalId: string;
  alarmType: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  at: string;
}
export interface WsAlarmOpened extends WsAlarmEventBase {
  type: 'alarm.opened';
}
export interface WsAlarmClosed extends WsAlarmEventBase {
  type: 'alarm.closed';
}
export interface WsAlarmAcknowledged extends WsAlarmEventBase {
  type: 'alarm.acknowledged';
}
export type WsAlarmEvent = WsAlarmOpened | WsAlarmClosed | WsAlarmAcknowledged;

/**
 * Mirrors backend `DtcEvent` exactly. Note: `vin` may be null (the gateway
 * fires this even when VIN decoding hasn't completed yet), and there is
 * NO `milOn` field on the wire — the bridge service intentionally keeps
 * the WS event small and the UI refetches /gps/dtc-events for richer
 * detail.
 */
export interface WsDtcEvent {
  type: 'dtc.detected';
  terminalId: string;
  ownerUserId?: string | null;
  dtcEventId: string;
  vin: string | null;
  dtcCount: number;
  at: string;
}

interface WsTripEventBase {
  tripId: string;
  terminalId: string;
  at: string;
}
export interface WsTripOpened extends WsTripEventBase {
  type: 'trip.opened';
}
export interface WsTripClosed extends WsTripEventBase {
  type: 'trip.closed';
}
export type WsTripEvent = WsTripOpened | WsTripClosed;

export type WsDomainEvent =
  | WsLocationUpdate
  | WsTerminalOnline
  | WsTerminalOffline
  | WsAlarmOpened
  | WsAlarmClosed
  | WsAlarmAcknowledged
  | WsDtcEvent
  | WsTripOpened
  | WsTripClosed;

interface WsWelcome {
  type: 'welcome';
  userId?: string;
  isAdmin?: boolean;
}

interface WsSubscribed {
  type: 'subscribed' | 'unsubscribed';
  channels: string[];
  denied?: string[];
}

interface WsServerError {
  type: 'error';
  /** Backend uses `error`, not `reason` — see wsServer.ts:safeSend. */
  error: string;
}

type WsInbound =
  | WsWelcome
  | WsSubscribed
  | { type: 'pong' }
  | WsServerError
  | WsDomainEvent;

type DomainListener<T extends WsDomainEvent['type']> = (
  event: Extract<WsDomainEvent, { type: T }>,
) => void;
type StateListener = (state: WsState) => void;

class GpsAdminWs {
  private socket: WebSocket | null = null;
  private state: WsState = 'idle';
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private backoffMs = INITIAL_BACKOFF_MS;
  private explicitClose = false;

  // Listeners
  private domainListeners = new Map<string, Set<(e: WsDomainEvent) => void>>();
  private stateListeners = new Set<StateListener>();

  // Refcounted subscriptions (channel name -> refcount)
  private subscriptions = new Map<string, number>();
  private confirmedChannels = new Set<string>();

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('admin_token');
  }

  private buildUrl(): string | null {
    const token = this.getToken();
    if (!token) return null;
    // The same /ws path the dealer dashboard uses. Accepts either a user
    // or admin JWT; the server sets isAdmin=true on the welcome frame
    // when the token came from the Admin model.
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.vintraxx.com/api/v1/admin';
    const base = apiUrl.replace(/\/api\/v1\/admin$/, '').replace(/\/api\/v1$/, '');
    const wsBase = base.replace(/^http/, 'ws');
    return `${wsBase}/ws?token=${encodeURIComponent(token)}`;
  }

  /** Opens the connection if not already open. Idempotent. */
  connect(): void {
    if (typeof window === 'undefined') return;
    if (this.state === 'connecting' || this.state === 'open') return;

    const url = this.buildUrl();
    if (!url) return;
    this.explicitClose = false;
    this.setState('connecting');

    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[gpsAdminWs] socket constructor failed', err);
      this.scheduleReconnect();
      return;
    }
    this.socket = socket;

    socket.onopen = () => {
      this.backoffMs = INITIAL_BACKOFF_MS;
      this.setState('open');
      // Auto-subscribe to the admin firehose. We send this BEFORE we wait
      // for the welcome frame because the server tolerates early ops.
      this.sendRaw({ op: 'subscribe', channels: ['admin'] });
      // Re-send any per-terminal subscriptions that were registered while
      // the socket was closed.
      const allChannels: string[] = [];
      this.subscriptions.forEach((_count, c) => {
        if (c !== 'admin' && !this.confirmedChannels.has(c)) allChannels.push(c);
      });
      const channelsToReplay = allChannels;
      if (channelsToReplay.length > 0) {
        this.sendRaw({ op: 'subscribe', channels: channelsToReplay });
      }
      this.startHeartbeat();
    };

    socket.onmessage = (ev) => {
      let parsed: WsInbound;
      try {
        parsed = JSON.parse(typeof ev.data === 'string' ? ev.data : '');
      } catch {
        return;
      }
      this.handleInbound(parsed);
    };

    socket.onclose = () => {
      this.cleanupSocket();
      this.setState('closed');
      this.confirmedChannels.clear();
      if (!this.explicitClose) this.scheduleReconnect();
    };

    socket.onerror = () => {
      // The 'close' event will follow — let it drive the reconnect.
    };
  }

  /** Closes the connection permanently (call from auth.tsx::logout). */
  disconnect(): void {
    this.explicitClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.setState('closing');
      try {
        this.socket.close(1000, 'logout');
      } catch {
        /* noop */
      }
    }
    this.subscriptions.clear();
    this.confirmedChannels.clear();
  }

  private cleanupSocket() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.socket = null;
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    const jitter = Math.random() * 250;
    const delay = Math.min(this.backoffMs + jitter, MAX_BACKOFF_MS);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.backoffMs = Math.min(this.backoffMs * 2, MAX_BACKOFF_MS);
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      this.sendRaw({ op: 'ping' });
    }, HEARTBEAT_MS);
  }

  private sendRaw(payload: unknown) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    try {
      this.socket.send(JSON.stringify(payload));
    } catch {
      /* noop — onclose will handle reconnect */
    }
  }

  private handleInbound(msg: WsInbound) {
    switch (msg.type) {
      case 'welcome':
        return;
      case 'subscribed':
        for (const ch of msg.channels) this.confirmedChannels.add(ch);
        return;
      case 'unsubscribed':
        for (const ch of msg.channels) this.confirmedChannels.delete(ch);
        return;
      case 'pong':
        return;
      case 'error':
        // Server-side rejected an op. Log to the console and move on —
        // there's no recoverable action at the dispatch layer.
        // eslint-disable-next-line no-console
        console.warn('[gpsAdminWs] server error:', msg.error);
        return;
      default:
        this.dispatchDomain(msg);
    }
  }

  private dispatchDomain(event: WsDomainEvent) {
    const typed = this.domainListeners.get(event.type);
    if (typed) {
      // Use forEach — the project's tsconfig targets ES5 and direct
      // for…of over Sets requires downlevelIteration.
      typed.forEach((fn) => {
        try {
          fn(event);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[gpsAdminWs] listener threw', err);
        }
      });
    }
  }

  private setState(s: WsState) {
    if (this.state === s) return;
    this.state = s;
    this.stateListeners.forEach((fn) => {
      try {
        fn(s);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[gpsAdminWs] state listener threw', err);
      }
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────

  getState(): WsState {
    return this.state;
  }

  /** Listen for connection-state transitions. Returns an unsubscribe fn. */
  onState(fn: StateListener): () => void {
    this.stateListeners.add(fn);
    // Fire current state synchronously so callers don't race the first
    // transition.
    queueMicrotask(() => fn(this.state));
    return () => {
      this.stateListeners.delete(fn);
    };
  }

  /** Listen for a specific domain event type. Returns an unsubscribe fn. */
  on<T extends WsDomainEvent['type']>(type: T, fn: DomainListener<T>): () => void {
    let set = this.domainListeners.get(type);
    if (!set) {
      set = new Set();
      this.domainListeners.set(type, set);
    }
    const wrapped = fn as (e: WsDomainEvent) => void;
    set.add(wrapped);
    return () => {
      set?.delete(wrapped);
    };
  }

  /**
   * Refcounted subscribe to a per-terminal stream. Multiple consumers can
   * share the same subscription; the unsubscribe returned only triggers a
   * server unsubscribe when the refcount drops to zero.
   */
  subscribeTerminal(terminalId: string): () => void {
    const channel = `terminal:${terminalId}`;
    const next = (this.subscriptions.get(channel) ?? 0) + 1;
    this.subscriptions.set(channel, next);
    if (next === 1 && this.state === 'open') {
      // Only push the subscribe op when the socket is open. If we're
      // currently disconnected, the channel is already in `subscriptions`
      // and `onopen` will replay it.
      this.sendRaw({ op: 'subscribe', channels: [channel] });
    }
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const cur = (this.subscriptions.get(channel) ?? 1) - 1;
      if (cur <= 0) {
        this.subscriptions.delete(channel);
        this.sendRaw({ op: 'unsubscribe', channels: [channel] });
        this.confirmedChannels.delete(channel);
      } else {
        this.subscriptions.set(channel, cur);
      }
    };
  }
}

export const gpsAdminWs = new GpsAdminWs();
