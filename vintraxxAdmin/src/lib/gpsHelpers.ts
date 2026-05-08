/**
 * gpsHelpers — shared formatting + small derivation helpers used across
 * every GPS-related admin component.
 *
 * Kept dependency-free so it can be imported from server components and
 * client components alike. Numeric inputs accept the `number | string`
 * shape returned by Prisma's Decimal serialiser without surprising the
 * caller.
 */

export function toNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function kmToMi(km: number | string | null | undefined): number | null {
  const n = toNumber(km);
  if (n === null) return null;
  return n * 0.621371;
}

export function fmtMiles(km: number | string | null | undefined, digits = 0): string {
  const mi = kmToMi(km);
  if (mi === null) return '—';
  return `${mi.toLocaleString(undefined, { maximumFractionDigits: digits })} mi`;
}

export function fmtKmh(kmh: number | string | null | undefined): string {
  const n = toNumber(kmh);
  if (n === null) return '—';
  return `${Math.round(n)} km/h`;
}

export function fmtVolts(mv: number | null | undefined): string {
  if (mv === null || mv === undefined) return '—';
  return `${(mv / 1000).toFixed(1)} V`;
}

export function fmtPct(p: number | string | null | undefined): string {
  const n = toNumber(p);
  if (n === null) return '—';
  return `${Math.round(n)}%`;
}

/**
 * "2m ago" / "5h ago" / "Apr 30" style relative time. Falls back to the
 * locale date when older than 30 days.
 */
export function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return new Date(iso).toLocaleString();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

/**
 * Canonical short label for a terminal. Prefers the JT/T 808 device
 * identifier (the value the device transmits in its packet header — the
 * gateway's runtime lookup key), falls back to the optional 15-digit IMEI
 * metadata for legacy callers that haven't been redeployed against the
 * new schema, then finally em-dash.
 *
 * Use this instead of reading `t.imei` directly so the UI keeps working
 * for terminals provisioned without an IMEI (registration-body terminal
 * IDs, MSISDN-only devices, etc.).
 */
export function terminalLabel(t: {
  deviceIdentifier?: string | null;
  imei?: string | null;
}): string {
  return t.deviceIdentifier ?? t.imei ?? '—';
}

/**
 * Best-effort vehicle label. Falls back through year-make-model → VIN →
 * nickname → device identifier so the admin always sees something
 * recognisable on a row without sprawling conditionals at the call site.
 */
export function vehicleLabel(t: {
  vehicleYear?: number | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehicleVin?: string | null;
  nickname?: string | null;
  deviceIdentifier?: string | null;
  imei?: string | null;
}): string {
  if (t.vehicleYear && t.vehicleMake) {
    return `${t.vehicleYear} ${t.vehicleMake}${t.vehicleModel ? ' ' + t.vehicleModel : ''}`;
  }
  if (t.vehicleVin) return t.vehicleVin;
  if (t.nickname) return t.nickname;
  return terminalLabel(t);
}

export function severityColor(sev: 'INFO' | 'WARNING' | 'CRITICAL'): {
  bg: string;
  text: string;
  ring: string;
} {
  switch (sev) {
    case 'CRITICAL':
      return {
        bg: 'bg-red-50 dark:bg-red-500/10',
        text: 'text-red-700 dark:text-red-400',
        ring: 'ring-red-200 dark:ring-red-500/30',
      };
    case 'WARNING':
      return {
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        text: 'text-amber-700 dark:text-amber-400',
        ring: 'ring-amber-200 dark:ring-amber-500/30',
      };
    default:
      return {
        bg: 'bg-blue-50 dark:bg-blue-500/10',
        text: 'text-blue-700 dark:text-blue-400',
        ring: 'ring-blue-200 dark:ring-blue-500/30',
      };
  }
}

export function statusDotClasses(status: string): string {
  switch (status) {
    case 'ONLINE':
      return 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-500/30';
    case 'OFFLINE':
      return 'bg-gray-400 ring-2 ring-gray-200 dark:ring-gray-500/30';
    case 'NEVER_CONNECTED':
      return 'bg-amber-400 ring-2 ring-amber-200 dark:ring-amber-500/30';
    case 'REVOKED':
      return 'bg-red-500 ring-2 ring-red-200 dark:ring-red-500/30';
    case 'SUSPENDED':
      return 'bg-violet-500 ring-2 ring-violet-200 dark:ring-violet-500/30';
    default:
      return 'bg-gray-400';
  }
}

/**
 * Pretty-prints a JT/T 808 alarm type code into a human label. Backend
 * already maps to enum values, but we add spaces and friendlier wording
 * for the table cells.
 */
export function alarmTypeLabel(t: string): string {
  return t
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}
