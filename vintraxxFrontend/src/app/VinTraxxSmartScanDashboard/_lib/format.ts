/**
 * Shared formatting helpers for the GPS dashboard tabs. Centralised so every
 * table/panel renders dates, durations, distances and currency identically.
 */

/**
 * Always en-US, always 2 fraction digits. "—" for null/undefined.
 * Used by the dashboard summary cards, ScanDetailModal, etc.
 */
export const formatCurrency = (val: number | null | undefined): string =>
  val !== null && val !== undefined
    ? `$${val.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "—";

/** "Just now" / "5m ago" / "Mar 12, 3:45 PM" */
export function formatRelativeOrAbsolute(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = Date.now() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatKm(km: number | null | undefined): string {
  if (km === null || km === undefined) return "—";
  if (km >= 100) return `${km.toFixed(0)} km`;
  return `${km.toFixed(1)} km`;
}

export function formatKmh(kmh: number | null | undefined): string {
  if (kmh === null || kmh === undefined) return "—";
  return `${kmh.toFixed(0)} km/h`;
}

export function formatMph(kmh: number | null | undefined): string {
  if (kmh === null || kmh === undefined) return "—";
  return `${(kmh * 0.621371).toFixed(0)} mph`;
}

export function formatMiles(km: number | null | undefined): string {
  if (km === null || km === undefined) return "—";
  return `${(km * 0.621371).toFixed(0)} mi`;
}

/** Duration HH:MM:SS for trips (under 1 day). */
export function formatDuration(sec: number | null | undefined): string {
  if (sec === null || sec === undefined) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function vehicleLabel(t: {
  nickname?: string | null;
  vehicleYear?: number | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehicleVin?: string | null;
  /** Canonical JT/T 808 device identifier — always present. */
  deviceIdentifier?: string | null;
  /** Optional 15-digit IMEI metadata. Falls back to deviceIdentifier. */
  imei?: string | null;
}): string {
  if (t.nickname && t.nickname.trim()) return t.nickname;
  const ymm = [t.vehicleYear, t.vehicleMake, t.vehicleModel]
    .filter(Boolean)
    .join(" ");
  if (ymm.length > 0) return ymm;
  if (t.vehicleVin) return t.vehicleVin;
  return t.deviceIdentifier ?? t.imei ?? "—";
}

/**
 * Safe number coercion. Returns null for non-finite values, undefined,
 * or unparsable strings. Handles Decimal serialised as string from Prisma.
 */
export function toNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Format millivolts as "X.X V". Returns "—" for null/undefined. */
export function fmtVolts(mv: number | null | undefined): string {
  if (mv === null || mv === undefined) return "—";
  return `${(mv / 1000).toFixed(1)} V`;
}

/** Format percentage as "X%". Returns "—" for null/undefined. */
export function fmtPct(p: number | string | null | undefined): string {
  const n = toNumber(p);
  if (n === null) return "—";
  return `${Math.round(n)}%`;
}

/**
 * Canonical short label for a terminal. Prefers deviceIdentifier,
 * falls back to IMEI, then em-dash.
 */
export function terminalLabel(t: {
  deviceIdentifier?: string | null;
  imei?: string | null;
}): string {
  return t.deviceIdentifier ?? t.imei ?? "—";
}

/**
 * Tailwind classes for status dot (online/offline indicator).
 * Green for ONLINE, gray for OFFLINE/other statuses.
 */
export function statusDotClasses(status: string): string {
  switch (status) {
    case "ONLINE":
      return "bg-[#16A34A] ring-2 ring-green-200";
    case "OFFLINE":
      return "bg-[#DC2626] ring-2 ring-red-200";
    case "NEVER_CONNECTED":
      return "bg-[#9CA3AF] ring-2 ring-gray-200";
    case "REVOKED":
      return "bg-red-500 ring-2 ring-red-200";
    default:
      return "bg-gray-400";
  }
}
