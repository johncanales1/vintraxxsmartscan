// GPS API service — REST client for /api/v1/gps/* endpoints.
//
// Mirrors the structure of `ApiService.ts`: singleton, JWT auth headers via
// `authService`, X-Request-Id propagation, structured logging through the
// shared logger. We don't depend on `apiService` directly so a future split
// of GPS into its own bundle is trivial.

import { logger, LogCategory } from '../../utils/Logger';
import { authService } from '../auth/AuthService';
import { API_CONFIG, GPS_ENDPOINTS } from '../../config/api';
import type {
  GpsTerminal,
  GpsLocation,
  GpsAlarm,
  GpsDtcEvent,
  GpsTrip,
  GpsTripDetail,
  ListTerminalsResponse,
  TerminalDetailResponse,
  LatestLocationResponse,
  LocationHistoryResponse,
  ListAlarmsResponse,
  AlarmDetailResponse,
  AckAlarmResponse,
  ListDtcEventsResponse,
  DtcEventDetailResponse,
  ListTripsResponse,
  TripDetailResponse,
  DailyStatsResponse,
  RegisterPushTokenRequest,
  SimpleSuccessResponse,
  RenameTerminalRequest,
  LocateCommandResponse,
  AnalyzeDtcEventResponse,
} from '../../types/gps';

interface ApiResult<T> {
  success: boolean;
  data?: T;
  message?: string;
  /** HTTP status code when the call reached the server. */
  status?: number;
}

class GpsApiService {
  private static instance: GpsApiService;

  static getInstance(): GpsApiService {
    if (!GpsApiService.instance) GpsApiService.instance = new GpsApiService();
    return GpsApiService.instance;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = authService.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const rid = logger.getRequestId();
    if (rid) headers['X-Request-Id'] = rid;
    return headers;
  }

  /**
   * Replace `:name` placeholders in a path template with URL-encoded values.
   * Throws if a key has no value — surfaces caller bugs instead of sending
   * "/terminals/undefined/latest" to the backend.
   */
  private interpolate(
    template: string,
    params: Record<string, string>,
  ): string {
    return template.replace(/:([a-zA-Z]+)/g, (_, key: string) => {
      const value = params[key];
      if (value === undefined || value === null) {
        throw new Error(`GpsApiService: missing path param "${key}" for ${template}`);
      }
      return encodeURIComponent(value);
    });
  }

  /**
   * Generic JSON request helper. Returns a typed envelope so screens don't
   * have to re-implement try/catch + error-message extraction at every call.
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    options: { body?: unknown; query?: Record<string, string | number | undefined> } = {},
  ): Promise<ApiResult<T>> {
    if (!authService.isAuthenticated()) {
      return { success: false, message: 'Not authenticated' };
    }

    let url = `${API_CONFIG.BASE_URL}${path}`;
    if (options.query) {
      const qs = Object.entries(options.query)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
      if (qs) url += `?${qs}`;
    }

    const headers = this.getAuthHeaders();
    const init: RequestInit = { method, headers };
    if (options.body !== undefined) init.body = JSON.stringify(options.body);

    let response: Response;
    try {
      logger.debug(LogCategory.API, `[GPS] → ${method} ${path}`, {
        url,
        hasBody: options.body !== undefined,
      });
      response = await fetch(url, init);
    } catch (err) {
      logger.error(LogCategory.API, `[GPS] ✗ ${method} ${path} - network error`, err);
      return {
        success: false,
        message: 'Unable to reach server. Check your connection.',
      };
    }

    let body: any = null;
    try {
      body = await response.json();
    } catch {
      // Non-JSON response (502 page, etc).
    }

    logger.debug(LogCategory.API, `[GPS] ← ${method} ${path} [${response.status}]`, {
      ok: response.ok,
    });

    if (!response.ok) {
      const message =
        (typeof body?.message === 'string' && body.message) ||
        (typeof body?.error === 'string' && body.error) ||
        (response.status === 401
          ? 'Session expired. Please log in again.'
          : response.status >= 500
          ? 'Server is temporarily unavailable.'
          : `Request failed (HTTP ${response.status})`);
      return { success: false, message, status: response.status };
    }

    return { success: true, data: body as T, status: response.status };
  }

  // ── Terminals ─────────────────────────────────────────────────────────────

  async listTerminals(): Promise<ApiResult<{ terminals: GpsTerminal[] }>> {
    return this.request<ListTerminalsResponse>('GET', GPS_ENDPOINTS.TERMINALS);
  }

  async getTerminal(id: string): Promise<ApiResult<{ terminal: GpsTerminal }>> {
    return this.request<TerminalDetailResponse>(
      'GET',
      this.interpolate(GPS_ENDPOINTS.TERMINAL_DETAIL, { id }),
    );
  }

  async getLatestLocation(
    id: string,
  ): Promise<ApiResult<{ location: GpsLocation | null }>> {
    return this.request<LatestLocationResponse>(
      'GET',
      this.interpolate(GPS_ENDPOINTS.TERMINAL_LATEST, { id }),
    );
  }

  async getLocationHistory(
    id: string,
    opts: {
      since?: string;
      until?: string;
      page?: number;
      limit?: number;
      minSpeedKmh?: number;
    } = {},
  ) {
    return this.request<LocationHistoryResponse>(
      'GET',
      this.interpolate(GPS_ENDPOINTS.TERMINAL_LOCATIONS, { id }),
      { query: opts },
    );
  }

  async renameTerminal(
    id: string,
    body: RenameTerminalRequest,
  ): Promise<ApiResult<{ terminal: GpsTerminal }>> {
    return this.request<TerminalDetailResponse>(
      'PATCH',
      this.interpolate(GPS_ENDPOINTS.TERMINAL_RENAME, { id }),
      { body },
    );
  }

  /**
   * Owner-only "request live position" (0x8201 wrapper). Returns the
   * enqueued GpsCommand row; the actual location update arrives later via
   * WebSocket as a `location.update` event.
   */
  async requestLocate(id: string): Promise<ApiResult<LocateCommandResponse>> {
    return this.request<LocateCommandResponse>(
      'POST',
      this.interpolate(GPS_ENDPOINTS.TERMINAL_LOCATE, { id }),
    );
  }

  // ── Trips + stats ─────────────────────────────────────────────────────────

  async listTrips(
    terminalId: string,
    opts: {
      page?: number;
      limit?: number;
      status?: 'OPEN' | 'CLOSED';
      since?: string;
      until?: string;
    } = {},
  ) {
    return this.request<ListTripsResponse>(
      'GET',
      this.interpolate(GPS_ENDPOINTS.TERMINAL_TRIPS, { id: terminalId }),
      { query: opts },
    );
  }

  async getTrip(
    terminalId: string,
    tripId: string,
  ): Promise<ApiResult<{ trip: GpsTripDetail }>> {
    return this.request<TripDetailResponse>(
      'GET',
      this.interpolate(GPS_ENDPOINTS.TERMINAL_TRIP_DETAIL, {
        id: terminalId,
        tripId,
      }),
    );
  }

  async getDailyStats(
    terminalId: string,
    opts: { since?: string; until?: string } = {},
  ): Promise<ApiResult<DailyStatsResponse>> {
    return this.request<DailyStatsResponse>(
      'GET',
      this.interpolate(GPS_ENDPOINTS.TERMINAL_STATS, { id: terminalId }),
      { query: opts },
    );
  }

  // ── Alarms ────────────────────────────────────────────────────────────────

  async listAlarms(
    opts: {
      page?: number;
      limit?: number;
      terminalId?: string;
      severity?: 'INFO' | 'WARNING' | 'CRITICAL';
      state?: 'open' | 'closed';
      ack?: 'true' | 'false';
      since?: string;
      until?: string;
    } = {},
  ) {
    return this.request<ListAlarmsResponse>('GET', GPS_ENDPOINTS.ALARMS, {
      query: opts,
    });
  }

  async getAlarm(id: string): Promise<ApiResult<{ alarm: GpsAlarm }>> {
    return this.request<AlarmDetailResponse>(
      'GET',
      this.interpolate(GPS_ENDPOINTS.ALARM_DETAIL, { id }),
    );
  }

  async ackAlarm(
    id: string,
    note?: string,
  ): Promise<ApiResult<{ alarm: GpsAlarm }>> {
    return this.request<AckAlarmResponse>(
      'POST',
      this.interpolate(GPS_ENDPOINTS.ALARM_ACK, { id }),
      { body: note ? { note } : {} },
    );
  }

  // ── DTC events ────────────────────────────────────────────────────────────

  async listDtcEvents(
    opts: {
      page?: number;
      limit?: number;
      terminalId?: string;
      vin?: string;
      milOnly?: 'true' | 'false';
      since?: string;
      until?: string;
    } = {},
  ) {
    return this.request<ListDtcEventsResponse>(
      'GET',
      GPS_ENDPOINTS.DTC_EVENTS,
      { query: opts },
    );
  }

  async getDtcEvent(id: string): Promise<ApiResult<{ event: GpsDtcEvent }>> {
    return this.request<DtcEventDetailResponse>(
      'GET',
      this.interpolate(GPS_ENDPOINTS.DTC_EVENT_DETAIL, { id }),
    );
  }

  /**
   * AI bridge: promote a GPS-DTC event into a Scan + AI report. Returns
   * `{ scanId, reused }`. Mobile then polls `/scan/report/:scanId` via
   * the existing `apiService.pollReport` helper to land on FullReportScreen.
   */
  async analyzeDtcEvent(id: string): Promise<ApiResult<AnalyzeDtcEventResponse>> {
    return this.request<AnalyzeDtcEventResponse>(
      'POST',
      this.interpolate(GPS_ENDPOINTS.DTC_EVENT_ANALYZE, { id }),
    );
  }

  // ── Push tokens ───────────────────────────────────────────────────────────

  async registerPushToken(
    body: RegisterPushTokenRequest,
  ): Promise<ApiResult<SimpleSuccessResponse>> {
    return this.request<SimpleSuccessResponse>(
      'POST',
      GPS_ENDPOINTS.PUSH_TOKEN,
      { body },
    );
  }

  async unregisterPushToken(
    token: string,
  ): Promise<ApiResult<SimpleSuccessResponse>> {
    return this.request<SimpleSuccessResponse>(
      'DELETE',
      GPS_ENDPOINTS.PUSH_TOKEN,
      { body: { token } },
    );
  }

  // ── Convenience: build a wss:// URL for the auth-aware WS client ──────────

  /**
   * Build the WebSocket URL (no token in the query string). Bug #M4 + #M7:
   * the URL now comes from the env-driven `WS_BASE_URL` and authentication
   * is performed via the `Sec-WebSocket-Protocol` header instead of a
   * `?token=` query string — keeping JWTs out of nginx access logs and any
   * downstream HTTP-layer log scrapers.
   */
  buildWsUrl(path = '/ws'): string {
    return `${API_CONFIG.WS_BASE_URL}${path}`;
  }

  /**
   * Build the value passed to `new WebSocket(url, [protocol])` so the
   * backend's `authenticateUpgrade()` can pull the JWT off the
   * `Sec-WebSocket-Protocol` header (Bug #M7). The leading `Bearer.` matches
   * the convention the server already accepts.
   */
  buildWsSubprotocol(token: string): string {
    return `Bearer.${token}`;
  }
}

export const gpsApi = GpsApiService.getInstance();
