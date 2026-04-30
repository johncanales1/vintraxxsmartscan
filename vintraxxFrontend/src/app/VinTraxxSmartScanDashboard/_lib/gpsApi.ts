/**
 * gpsApi.ts — typed REST client for /api/v1/gps/* (and the
 * /api/v1/scan/report/:id polling endpoint reused by the AI bridge).
 *
 * Mirrors the mobile `GpsApiService` so the two clients can be read side by
 * side. Every method:
 *   • Reads `dealer_token` from localStorage on each call (so a re-login
 *     during the session takes effect immediately).
 *   • Returns `{ success, data?, message? }` — same shape the dashboard
 *     already expects from its existing /dealer/* endpoints.
 *   • On HTTP 401/403 boots the user back to /login (matches the existing
 *     dashboard behaviour at page.tsx:198-203).
 *
 * `API_BASE` is duplicated here from page.tsx so the GPS code can be lifted
 * out without touching the existing dashboard. Future PR can centralise.
 */

import type {
  ApiEnvelope,
  AnalyzeDtcResponse,
  FullReportData,
  GpsAlarm,
  GpsDtcEvent,
  GpsLocation,
  GpsTerminal,
  GpsTerminalDailyStat,
  GpsTrip,
  ListAlarmsResult,
  ListDtcEventsResult,
  ListLocationsResult,
  ListTripsResult,
} from "./types";
import { API_BASE } from "@/lib/api-config";
import { gpsWs } from "./gpsWs";

/**
 * Where to send the user when a 401/403 comes back. The existing dashboard
 * also uses /login, so we stay consistent. Browser-side only.
 */
function bootToLogin(): void {
  if (typeof window === "undefined") return;
  try {
    gpsWs.disconnect();
  } catch {
    /* WS already torn down — best-effort */
  }
  try {
    localStorage.removeItem("dealer_token");
    localStorage.removeItem("dealer_user");
  } catch {
    /* localStorage unavailable — best-effort */
  }
  window.location.href = "/login";
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("dealer_token");
  } catch {
    return null;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, string | number | undefined | null>;
  body?: unknown;
  /** AbortSignal for cancellation (used by hooks on unmount). */
  signal?: AbortSignal;
}

/**
 * Centralised request helper. Wraps the response in an ApiEnvelope so callers
 * never have to check `res.ok` directly.
 */
async function request<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<ApiEnvelope<T>> {
  const token = getToken();
  if (!token) {
    bootToLogin();
    return { success: false, message: "Not authenticated" };
  }

  const url = new URL(`${API_BASE}${path}`);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch (err) {
    // AbortError is part of the contract; surface as a soft failure so hooks
    // can ignore it.
    if (err instanceof DOMException && err.name === "AbortError") {
      return { success: false, message: "aborted" };
    }
    return { success: false, message: "Network error" };
  }

  if (res.status === 401 || res.status === 403) {
    bootToLogin();
    return { success: false, message: "Unauthorised" };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return { success: false, message: `Invalid response (${res.status})` };
  }

  // The backend returns `{success, ...}` envelopes. We re-package the rest
  // of the row into `data` based on convention so callers see a uniform shape
  // regardless of how a particular controller chose to nest its fields.
  if (typeof json === "object" && json !== null) {
    const envelope = json as Record<string, unknown> & { success?: boolean };
    if (envelope.success === false) {
      return {
        success: false,
        message:
          (envelope.message as string | undefined) ??
          (envelope.error as string | undefined) ??
          `Request failed (${res.status})`,
      };
    }
  }

  return { success: true, data: extractData<T>(json, res.status) };
}

/**
 * Backend controllers vary in field naming: some return `{success, data}`,
 * others `{success, terminals}`/`{success, alarms}`/`{success, locations}`.
 * We keep the typed return shape uniform by passing the WHOLE rest of the
 * envelope back as `data`, so callers can pluck what they need.
 */
function extractData<T>(json: unknown, _status: number): T {
  if (typeof json !== "object" || json === null) return undefined as T;
  // If `data` is set, use it; otherwise return the rest of the envelope
  // sans `success`/`message`. Both shapes are common in this codebase.
  const obj = json as Record<string, unknown>;
  if ("data" in obj) return obj.data as T;
  const { success: _ok, message: _m, ...rest } = obj;
  return rest as T;
}

// ── Endpoints ──────────────────────────────────────────────────────────────

export const gpsApi = {
  // Terminals
  listTerminals(signal?: AbortSignal) {
    return request<{ terminals: GpsTerminal[] }>("/gps/terminals", { signal });
  },
  getTerminal(id: string, signal?: AbortSignal) {
    return request<{ terminal: GpsTerminal }>(`/gps/terminals/${id}`, {
      signal,
    });
  },
  getLatestLocation(id: string, signal?: AbortSignal) {
    return request<{ location: GpsLocation | null }>(
      `/gps/terminals/${id}/latest`,
      { signal },
    );
  },
  getLocationHistory(
    id: string,
    opts: { since?: string; until?: string; limit?: number } = {},
    signal?: AbortSignal,
  ) {
    return request<ListLocationsResult>(`/gps/terminals/${id}/locations`, {
      query: opts,
      signal,
    });
  },
  renameTerminal(id: string, label: string) {
    return request<{ terminal: GpsTerminal }>(`/gps/terminals/${id}/label`, {
      method: "PATCH",
      body: { nickname: label },
    });
  },
  locateTerminal(id: string) {
    // Backend returns `{ command: { id, status, createdAt } }` — match it
    // verbatim so future callers reading `.data.command.id` aren't surprised.
    return request<{
      command: { id: string; status: string; createdAt: string };
    }>(`/gps/terminals/${id}/locate`, {
      method: "POST",
      body: {},
    });
  },

  // Trips + stats
  listTrips(
    id: string,
    opts: { since?: string; until?: string; page?: number; limit?: number } = {},
    signal?: AbortSignal,
  ) {
    return request<ListTripsResult>(`/gps/terminals/${id}/trips`, {
      query: opts,
      signal,
    });
  },
  getTrip(id: string, tripId: string, signal?: AbortSignal) {
    // Backend (`gps.controller.ts:myTerminalTripDetail`) returns just
    // `{ trip }`. Locations for a trip are NOT bundled — fetch them
    // separately via getLocationHistory({ since: trip.startAt, until: trip.endAt }).
    return request<{ trip: GpsTrip }>(
      `/gps/terminals/${id}/trips/${tripId}`,
      { signal },
    );
  },
  getDailyStats(
    id: string,
    opts: { since?: string; until?: string } = {},
    signal?: AbortSignal,
  ) {
    // Backend (`gps.controller.ts:myTerminalDailyStats`) returns
    // `{ days, since, until }` — NOT `{ stats }`. Match the field name so the
    // Fleet KPI strip's "Miles driven 7d" tile actually computes a non-zero.
    return request<{
      days: GpsTerminalDailyStat[];
      since: string;
      until: string;
    }>(`/gps/terminals/${id}/stats`, { query: opts, signal });
  },

  // Alarms
  listAlarms(
    opts: {
      since?: string;
      until?: string;
      severity?: string;
      terminalId?: string;
      /** Filter by acknowledged state. Sent over the wire as `ack=true|false`
       *  to match the backend schema (`gps.schema.ts:listAlarmsQuerySchema`). */
      acknowledged?: boolean;
      /** Filter by open/closed state. */
      state?: "open" | "closed";
      page?: number;
      limit?: number;
    } = {},
    signal?: AbortSignal,
  ) {
    const { acknowledged, ...rest } = opts;
    return request<ListAlarmsResult>("/gps/alarms", {
      query: {
        ...rest,
        // Backend reads `ack`, NOT `acknowledged`. Sending the wrong key here
        // silently no-ops the filter (Zod strips unknown keys), which would
        // make the Alerts tab's "Include acknowledged" toggle a no-op.
        ack: acknowledged === undefined ? undefined : String(acknowledged),
      },
      signal,
    });
  },
  getAlarm(id: string, signal?: AbortSignal) {
    return request<{ alarm: GpsAlarm }>(`/gps/alarms/${id}`, { signal });
  },
  ackAlarm(id: string, body: { note?: string } = {}) {
    return request<{ alarm: GpsAlarm }>(`/gps/alarms/${id}/ack`, {
      method: "POST",
      body,
    });
  },

  // DTC events
  listDtcEvents(
    opts: {
      terminalId?: string;
      since?: string;
      until?: string;
      page?: number;
      limit?: number;
    } = {},
    signal?: AbortSignal,
  ) {
    return request<ListDtcEventsResult>("/gps/dtc-events", {
      query: opts,
      signal,
    });
  },
  getDtcEvent(id: string, signal?: AbortSignal) {
    return request<{ event: GpsDtcEvent }>(`/gps/dtc-events/${id}`, { signal });
  },
  /** AI bridge: promote a GPS-DTC event into a Scan + queue background
   *  AI processing. Returns the Scan id for polling. */
  analyzeDtcEvent(id: string) {
    return request<AnalyzeDtcResponse>(`/gps/dtc-events/${id}/analyze`, {
      method: "POST",
      body: {},
    });
  },

  // Final-report polling — same endpoint the existing OBD scan list modal
  // already polls. The dashboard scan-detail modal accepts the `data` shape
  // verbatim.
  getScanReport(
    scanId: string,
    signal?: AbortSignal,
  ): Promise<{
    success: boolean;
    status?: "processing" | "completed" | "failed";
    data?: FullReportData;
    error?: string;
  }> {
    const token = getToken();
    if (!token) {
      bootToLogin();
      return Promise.resolve({ success: false, error: "Not authenticated" });
    }
    return fetch(`${API_BASE}/scan/report/${scanId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          bootToLogin();
          return { success: false, error: "Unauthorised" };
        }
        try {
          return (await res.json()) as {
            success: boolean;
            status?: "processing" | "completed" | "failed";
            data?: FullReportData;
            error?: string;
          };
        } catch {
          return { success: false, error: `Invalid response (${res.status})` };
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          return { success: false, error: "aborted" };
        }
        return { success: false, error: "Network error" };
      });
  },
};
