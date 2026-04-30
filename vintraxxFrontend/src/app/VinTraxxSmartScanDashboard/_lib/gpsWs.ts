/**
 * gpsWs.ts — singleton WebSocket client for the dealer dashboard.
 *
 * Connects to `${WS_BASE}/ws?token=<dealer_token>`. WS_BASE is derived from
 * `NEXT_PUBLIC_API_BASE_URL` via @/lib/api-config (e.g.
 * `wss://api.vintraxx.com` or `ws://localhost:4000`). Backend mounts at
 * GPS_WS_PATH which defaults to `/ws`.
 *
 * Protocol (matches vintraxxBackend/src/realtime/wsServer.ts):
 *   ←  { op:"subscribe",   channels:["terminal:<uuid>"] }
 *   →  { type:"welcome", userId, isAdmin, autoChannels:["user"] }
 *   →  { type:"subscribed"|"unsubscribed", channels }
 *   →  { type:"location.update"|"alarm.opened"|... }
 *
 * The connection auto-subscribes to the `user` scope (events for terminals
 * the dealer owns), so we don't have to subscribe per-terminal for the
 * fleet-wide tabs (Alerts/Trips/DTCs). Per-terminal subscriptions are still
 * useful for narrower views (LiveTrack-style).
 *
 * Reconnect strategy: exponential backoff with jitter, capped at 30s.
 * Heartbeat: client sends `{op:"ping"}` every 25s; server replies `pong`.
 */

import type { WsDomainEvent, WsInbound } from "./types";
import { WS_BASE } from "@/lib/api-config";

type WsState =
  | "idle"
  | "connecting"
  | "open"
  | "reconnecting"
  | "offline";

type EventHandler<T> = (event: T) => void;

const WS_PATH = "/ws";

function buildWsUrl(token: string): string {
  // Driven by the centralised api-config. WS_BASE already has the correct
  // ws/wss scheme and host:port. Append the WS path + token.
  return `${WS_BASE}${WS_PATH}?token=${encodeURIComponent(token)}`;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("dealer_token");
  } catch {
    return null;
  }
}

class GpsWsClient {
  private ws: WebSocket | null = null;
  private state: WsState = "idle";
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private explicitlyClosed = false;

  /**
   * Per-channel refcount of consumers that have asked us to subscribe.
   * The actual `op:"subscribe"` is only sent on the 0→1 transition, and
   * `op:"unsubscribe"` is only sent on 1→0. This is what lets multiple
   * components (Live Map's bulk subscribe + a Device Detail page's
   * useGpsLatest) safely share the same `terminal:<id>` channel.
   */
  private channelRefCounts = new Map<string, number>();
  /**
   * Channels with refcount > 0 that we want to be subscribed to.
   * Re-applied to the server after every reconnect.
   */
  private desiredChannels = new Set<string>();
  /** Channels actually confirmed by the server. */
  private confirmedChannels = new Set<string>();

  // Listeners keyed by event-type. We use a private discriminator so callers
  // can subscribe to either a specific event type or the special "state"
  // pseudo-event for connection status.
  private domainListeners = new Map<
    WsDomainEvent["type"] | "*",
    Set<EventHandler<WsDomainEvent>>
  >();
  private stateListeners = new Set<EventHandler<WsState>>();

  /**
   * Open the connection. Idempotent — safe to call multiple times. The
   * dashboard's layout calls this once on mount with the dealer's token in
   * localStorage.
   */
  connect(): void {
    if (typeof window === "undefined") return; // SSR safety
    if (this.ws && (this.state === "open" || this.state === "connecting")) {
      return;
    }
    const token = getToken();
    if (!token) {
      this.setState("offline");
      return;
    }
    this.explicitlyClosed = false;
    this.openSocket(token);
  }

  /**
   * Tear down the socket and stop reconnecting. Used on logout / when the
   * dashboard layout unmounts.
   */
  disconnect(): void {
    this.explicitlyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close(1000, "client disconnect");
      } catch {
        /* already closed */
      }
      this.ws = null;
    }
    this.confirmedChannels.clear();
    this.desiredChannels.clear();
    this.channelRefCounts.clear();
    this.setState("idle");
  }

  /**
   * Add a per-terminal subscription. Refcount-aware: every call must be
   * balanced by a matching `unsubscribeTerminal`. The actual server-side
   * subscribe is only sent on the 0→1 transition, so two components asking
   * for the same terminal won't double-subscribe and one component
   * releasing won't yank the channel from the other.
   *
   * Safe to call before the socket is open; pending channels are flushed
   * on the next `welcome` (see `openSocket`).
   */
  subscribeTerminal(terminalId: string): void {
    const channel = `terminal:${terminalId}`;
    const next = (this.channelRefCounts.get(channel) ?? 0) + 1;
    this.channelRefCounts.set(channel, next);
    if (next === 1) {
      this.desiredChannels.add(channel);
      if (this.state === "open") this.sendSubscribe([channel]);
    }
  }

  unsubscribeTerminal(terminalId: string): void {
    const channel = `terminal:${terminalId}`;
    const current = this.channelRefCounts.get(channel) ?? 0;
    if (current <= 0) return; // unbalanced unsubscribe — ignore safely
    const next = current - 1;
    if (next === 0) {
      this.channelRefCounts.delete(channel);
      this.desiredChannels.delete(channel);
      if (this.state === "open") this.sendUnsubscribe([channel]);
    } else {
      this.channelRefCounts.set(channel, next);
    }
  }

  /** Subscribe to a particular WS domain-event type, or "*" for all. */
  on<T extends WsDomainEvent["type"]>(
    type: T,
    handler: (event: Extract<WsDomainEvent, { type: T }>) => void,
  ): () => void;
  on(type: "*", handler: EventHandler<WsDomainEvent>): () => void;
  on(
    type: WsDomainEvent["type"] | "*",
    handler: EventHandler<WsDomainEvent>,
  ): () => void {
    let set = this.domainListeners.get(type);
    if (!set) {
      set = new Set();
      this.domainListeners.set(type, set);
    }
    set.add(handler);
    return () => set!.delete(handler);
  }

  /** Subscribe to connection-state transitions. */
  onState(handler: EventHandler<WsState>): () => void {
    this.stateListeners.add(handler);
    // Fire current state immediately so consumers paint the right pill on
    // mount.
    try {
      handler(this.state);
    } catch {
      /* listener threw; ignore */
    }
    return () => this.stateListeners.delete(handler);
  }

  getState(): WsState {
    return this.state;
  }

  // ── Internals ──────────────────────────────────────────────────────────

  private openSocket(token: string): void {
    this.setState("connecting");
    let ws: WebSocket;
    try {
      ws = new WebSocket(buildWsUrl(token));
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;

    ws.addEventListener("open", () => {
      this.reconnectAttempt = 0;
      this.setState("open");
      // Re-apply any desired channels (initial subscribe or post-reconnect
      // resync).
      if (this.desiredChannels.size > 0) {
        this.sendSubscribe(Array.from(this.desiredChannels));
      }
      // Heartbeat. The server's idle-timeout is 60s; 25s is safely under it.
      if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({ op: "ping" }));
          } catch {
            /* will close + reconnect */
          }
        }
      }, 25_000);
    });

    ws.addEventListener("message", (ev) => {
      let parsed: WsInbound;
      try {
        parsed = JSON.parse(ev.data as string) as WsInbound;
      } catch {
        return;
      }
      this.handleInbound(parsed);
    });

    ws.addEventListener("close", () => {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
      this.confirmedChannels.clear();
      this.ws = null;
      if (this.explicitlyClosed) {
        this.setState("idle");
        return;
      }
      this.scheduleReconnect();
    });

    ws.addEventListener("error", () => {
      // The 'close' handler will fire next; let it manage state.
    });
  }

  private handleInbound(msg: WsInbound): void {
    switch (msg.type) {
      case "welcome":
        // Auto channel is "user" — fleet-wide events are already on the way.
        return;
      case "subscribed":
        for (const ch of msg.channels) this.confirmedChannels.add(ch);
        return;
      case "unsubscribed":
        for (const ch of msg.channels) this.confirmedChannels.delete(ch);
        return;
      case "pong":
        return;
      case "error":
        // Server-side rejected an op. We log to console for ops; the UI
        // simply gets no event so timing-sensitive logic must rely on the
        // `state` pseudo-event for connection health. Backend uses `error`
        // (NOT `reason`) — see `wsServer.ts:safeSend` calls.
        // eslint-disable-next-line no-console
        console.warn("[gpsWs] server error:", msg.error);
        return;
      default:
        this.dispatchDomain(msg);
    }
  }

  private dispatchDomain(event: WsDomainEvent): void {
    const typed = this.domainListeners.get(event.type);
    if (typed) {
      for (const fn of typed) {
        try {
          fn(event);
        } catch {
          /* listener threw; ignore */
        }
      }
    }
    const wildcard = this.domainListeners.get("*");
    if (wildcard) {
      for (const fn of wildcard) {
        try {
          fn(event);
        } catch {
          /* listener threw; ignore */
        }
      }
    }
  }

  private sendSubscribe(channels: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.send(JSON.stringify({ op: "subscribe", channels }));
    } catch {
      /* will reconnect */
    }
  }

  private sendUnsubscribe(channels: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.send(JSON.stringify({ op: "unsubscribe", channels }));
    } catch {
      /* will reconnect */
    }
  }

  private scheduleReconnect(): void {
    if (this.explicitlyClosed) return;
    this.setState("reconnecting");
    this.reconnectAttempt += 1;
    // Exp backoff: 1s, 2s, 4s, 8s, 16s, capped at 30s. Add up to 1s jitter.
    const base = Math.min(1000 * 2 ** (this.reconnectAttempt - 1), 30_000);
    const jitter = Math.floor(Math.random() * 1000);
    const delay = base + jitter;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      const token = getToken();
      if (!token) {
        this.setState("offline");
        return;
      }
      this.openSocket(token);
    }, delay);
  }

  private setState(next: WsState): void {
    if (next === this.state) return;
    this.state = next;
    for (const fn of this.stateListeners) {
      try {
        fn(next);
      } catch {
        /* listener threw; ignore */
      }
    }
  }
}

/**
 * Process-singleton. Importing this module repeatedly is cheap and always
 * returns the same instance. Next.js dev mode HMR may briefly create a second
 * one — that's fine, the old instance just becomes garbage and its socket
 * gets `close`d when the GC runs.
 */
export const gpsWs = new GpsWsClient();
export type { WsState };
