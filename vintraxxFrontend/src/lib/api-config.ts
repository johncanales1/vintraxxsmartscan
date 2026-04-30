/**
 * Single source of truth for the backend REST + WebSocket URLs.
 *
 * Resolution order:
 *   1. `NEXT_PUBLIC_API_BASE_URL` env var if set (e.g. http://localhost:4000/api/v1)
 *   2. `https://api.vintraxx.com/api/v1` in production
 *   3. `http://localhost:4000/api/v1` in development
 *
 * `WS_BASE` is derived from `API_BASE`:
 *   - swap http(s) → ws(s)
 *   - strip the trailing `/api/v1`
 *   The dashboard appends `/ws?token=...` itself.
 *
 * NOTE: NEXT_PUBLIC_* env vars are inlined at build time. Restart the dev
 * server after changing `.env.local`.
 */

const fallbackApiBase =
  process.env.NODE_ENV === "production"
    ? "https://api.vintraxx.com/api/v1"
    : "http://localhost:4000/api/v1";

export const API_BASE: string =
  process.env.NEXT_PUBLIC_API_BASE_URL || fallbackApiBase;

/**
 * WebSocket base URL (no trailing slash, no path). The GPS WS client will
 * append `/ws?token=<jwt>` to this.
 *
 * Examples:
 *   API_BASE  http://localhost:4000/api/v1   →  WS_BASE  ws://localhost:4000
 *   API_BASE  https://api.vintraxx.com/api/v1 →  WS_BASE  wss://api.vintraxx.com
 */
export const WS_BASE: string = API_BASE
  .replace(/\/api\/v1\/?$/, "")
  .replace(/^http/, "ws");
