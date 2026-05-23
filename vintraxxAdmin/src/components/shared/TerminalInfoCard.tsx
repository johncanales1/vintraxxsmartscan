'use client';

/**
 * TerminalInfoCard — compact rich-info panel describing a GPS terminal's
 * current/last-known state.
 *
 * Used in two places today:
 *   1. <InfoWindow/> on the admin Fleet Map (GpsFleetMapSection) when an
 *      admin clicks a marker — gives the parked-vehicle context the
 *      operator needs without leaving the map.
 *   2. Overview tab of GpsTerminalDetailModal — the same fields rendered
 *      inline so a "drill into a terminal" flow surfaces parity info.
 *
 * Field selection mirrors the data ChatGPT-style telematics dashboards
 * surface for a parked vehicle:
 *   • Status (Live vs Parked / Not in Use)
 *   • Last known address (reverse-geocoded client-side — best-effort)
 *   • Last GPS ping / Time parked / Ignition off since
 *   • Vehicle battery + device backup battery
 *   • GPS satellites + cellular CSQ
 *   • Odometer + fuel level
 *   • VIN / Stock # / Plate / Year-Make-Model / IMEI
 *
 * Reverse-geocoding is cached per `terminalId` in a module-level Map so
 * the same address isn't re-fetched every time the popup re-opens, and
 * doesn't fire at all until Google Maps' JS API is actually loaded
 * (`window.google?.maps?.Geocoder` exists). The Geocoder is part of the
 * core Maps JS bundle — no extra `libraries` entry is required on
 * `useLoadScript`.
 */

import { useEffect, useState } from 'react';
import {
  fmtRelative,
  fmtKmh,
  fmtMiles,
  fmtPct,
  fmtVolts,
  terminalLabel,
  toNumber,
} from '@/lib/gpsHelpers';
import type { GpsTerminal, GpsLocation, GpsObdSnapshot } from '@/lib/api';

/**
 * Module-scoped cache so repeated InfoWindow open/close cycles don't burn
 * Google Geocoder quota. Keyed by `terminalId` because the same vehicle
 * may move (and we DO want to refresh after a move) — see invalidation
 * below.
 */
const addressCache: Map<string, { lat: number; lng: number; address: string }> = new Map();

function reverseGeocode(
  terminalId: string,
  lat: number,
  lng: number,
): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null);
    const g = (window as unknown as { google?: typeof google }).google;
    if (!g?.maps?.Geocoder) return resolve(null);

    // Cache hit only if the coordinates are within ~10 m of the cached
    // ones (≈ 4 decimals). Vehicles in a parking lot don't actually move,
    // so this is virtually always a hit.
    const cached = addressCache.get(terminalId);
    if (
      cached &&
      Math.abs(cached.lat - lat) < 0.0001 &&
      Math.abs(cached.lng - lng) < 0.0001
    ) {
      return resolve(cached.address);
    }

    new g.maps.Geocoder().geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status !== 'OK' || !results || results.length === 0) {
          return resolve(null);
        }
        const address = results[0].formatted_address || null;
        if (address) addressCache.set(terminalId, { lat, lng, address });
        resolve(address);
      },
    );
  });
}

interface Props {
  terminal: GpsTerminal;
  location: GpsLocation | null;
  obd: GpsObdSnapshot | null;
  /** Best-effort lookup of last `Scan.stockNumber` matching the terminal VIN. */
  stockNumber?: string | null;
  /** Most recent CLOSED trip end timestamp — fallback for "Ignition off since". */
  lastTripEndedAt?: string | null;
  /**
   * When true, render the more compact "inside an InfoWindow" variant
   * (smaller padding, no surrounding card chrome). When false, render
   * as a standalone card suitable for inline use inside a modal pane.
   */
  compact?: boolean;
}

export default function TerminalInfoCard({
  terminal,
  location,
  obd,
  stockNumber = null,
  lastTripEndedAt = null,
  compact = false,
}: Props) {
  const isOnline = terminal.status === 'ONLINE';
  const lat = toNumber(location?.latitude ?? null);
  const lng = toNumber(location?.longitude ?? null);

  const [address, setAddress] = useState<string | null>(() => {
    if (lat === null || lng === null) return null;
    return addressCache.get(terminal.id)?.address ?? null;
  });

  useEffect(() => {
    if (lat === null || lng === null) return;
    let cancelled = false;
    void reverseGeocode(terminal.id, lat, lng).then((addr) => {
      if (!cancelled && addr) setAddress(addr);
    });
    return () => {
      cancelled = true;
    };
  }, [terminal.id, lat, lng]);

  // ── Derived fields ────────────────────────────────────────────────────
  const yearMakeModel = [terminal.vehicleYear, terminal.vehicleMake, terminal.vehicleModel]
    .filter((v) => v !== null && v !== undefined && v !== '')
    .join(' ');

  // Coordinates string with 6-decimal precision (~11 cm) — what a fleet
  // operator typically copy-pastes into another tool.
  const coordsLabel =
    lat !== null && lng !== null ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : null;

  const cellularCsq = location?.signalStrength ?? null;
  const cellularLabel =
    cellularCsq === null || cellularCsq === undefined
      ? null
      : cellularCsq === 99
        ? 'Unknown'
        : `${cellularCsq}/31`;

  // Vehicle battery prefers GpsLocation.externalVoltageMv (sampled from
  // the JT/T 808 0x0200 additional-info), falls back to the OBD
  // snapshot's control-module voltage when the device didn't ship
  // additional-info 0x29 in the latest packet.
  const vehicleBatteryMv =
    location?.externalVoltageMv ?? obd?.batteryVoltageMv ?? null;
  const deviceBatteryMv = location?.batteryVoltageMv ?? null;

  // Odometer prefers the GPS additional-info mileage when available, else
  // the OBD distance-with-MIL value (which is close enough for a "last
  // known" hint).
  const odometerKm =
    location?.odometerKm ?? obd?.milDistanceKm ?? null;

  // Fuel level prefers the GPS additional-info, falls back to a vendor
  // PID surfaced through the OBD snapshot's extras (see backend's
  // persistObdSnapshot — pid 0x002F maps to `fuelLevelPct`).
  const obdFuelPct =
    obd?.extraPidsJson && typeof obd.extraPidsJson === 'object'
      ? toNumber((obd.extraPidsJson as Record<string, unknown>).fuelLevelPct)
      : null;
  const fuelPct = location?.fuelLevelPct ?? obdFuelPct;

  // "Time parked" / "Ignition off since" — only meaningful when offline.
  // We prefer terminal.disconnectedAt (TCP-level), then the most recent
  // closed-trip end (movement-level), then the last GPS ping itself.
  const parkedSince = isOnline
    ? null
    : terminal.disconnectedAt ?? lastTripEndedAt ?? location?.reportedAt ?? null;

  const padClass = compact ? 'p-1' : 'p-4';
  const headerSizeClass = compact ? 'text-sm' : 'text-base';
  const containerClass = compact
    ? 'min-w-[280px] max-w-[340px]'
    : 'rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800';

  return (
    <div className={`${containerClass} ${padClass} text-[12px]`}>
      {/* Header */}
      <div className={`flex items-start gap-2 pb-2 mb-2 border-b ${compact ? 'border-gray-200' : 'border-gray-200 dark:border-gray-700'}`}>
        <span
          className={`mt-1 inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            isOnline ? 'bg-emerald-500' : 'bg-gray-400'
          }`}
        />
        <div className="min-w-0 flex-1">
          <div className={`${headerSizeClass} font-semibold ${compact ? 'text-gray-900' : 'text-gray-900 dark:text-white'} truncate`}>
            {yearMakeModel || terminal.vehicleVin || terminal.nickname || terminalLabel(terminal)}
          </div>
          <div className={`text-[11px] ${compact ? 'text-gray-600' : 'text-gray-500 dark:text-gray-400'}`}>
            {isOnline ? 'Live · Online' : 'Parked / Not in Use · Offline'}
          </div>
        </div>
      </div>

      {/* Vehicle identity */}
      <Section title="Vehicle" forceLight={compact}>
        <Row label="VIN" value={terminal.vehicleVin} mono forceLight={compact} />
        <Row label="Year / Make / Model" value={yearMakeModel || null} forceLight={compact} />
        <Row label="Plate #" value={terminal.plateNumber} forceLight={compact} />
        <Row label="Stock #" value={stockNumber} forceLight={compact} />
      </Section>

      {/* Location */}
      <Section title="Location" forceLight={compact}>
        <Row label="Address" value={address} forceLight={compact} />
        <Row label="Coordinates" value={coordsLabel} mono forceLight={compact} />
        <Row label="Last GPS ping" value={location?.reportedAt ? fmtRelative(location.reportedAt) : null} forceLight={compact} />
        {!isOnline && (
          <>
            <Row label="Time parked" value={parkedSince ? fmtRelative(parkedSince) : null} forceLight={compact} />
            <Row label="Ignition off since" value={parkedSince ? fmtRelative(parkedSince) : null} forceLight={compact} />
          </>
        )}
        {isOnline && location?.speedKmh !== null && location?.speedKmh !== undefined && (
          <Row label="Current speed" value={fmtKmh(location.speedKmh)} forceLight={compact} />
        )}
      </Section>

      {/* Vehicle telemetry */}
      <Section title="Vehicle telemetry" forceLight={compact}>
        <Row label="Vehicle battery" value={vehicleBatteryMv !== null ? fmtVolts(vehicleBatteryMv) : null} forceLight={compact} />
        <Row label="Device backup battery" value={deviceBatteryMv !== null ? fmtVolts(deviceBatteryMv) : null} forceLight={compact} />
        <Row label="Odometer" value={odometerKm !== null ? fmtMiles(odometerKm) : null} forceLight={compact} />
        <Row label="Fuel level" value={fuelPct !== null && fuelPct !== undefined ? fmtPct(fuelPct) : null} forceLight={compact} />
      </Section>

      {/* Signal */}
      <Section title="Signal" forceLight={compact}>
        <Row label="GPS satellites" value={location?.satelliteCount !== null && location?.satelliteCount !== undefined ? String(location.satelliteCount) : null} forceLight={compact} />
        <Row label="Cellular (CSQ)" value={cellularLabel} forceLight={compact} />
      </Section>

      {/* Device */}
      <Section title="Device" last forceLight={compact}>
        <Row label="Owner" value={terminal.ownerUser?.email ?? null} forceLight={compact} />
        <Row label="IMEI" value={terminal.imei} mono forceLight={compact} />
        <Row label="Device ID" value={terminal.deviceIdentifier} mono forceLight={compact} />
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
  last,
  forceLight,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
  forceLight?: boolean;
}) {
  // Filter out rows whose value is null/empty so we don't render whole
  // sections that say "— — — —". `children` is a fragment of <Row/>
  // elements; each Row already self-suppresses when value is empty.
  return (
    <div className={`${last ? '' : `mb-2 pb-2 border-b ${forceLight ? 'border-gray-100' : 'border-gray-100 dark:border-gray-700/50'}`}`}>
      <div className={`text-[9px] uppercase tracking-wider font-semibold mb-1 ${forceLight ? 'text-gray-800' : 'text-gray-500 dark:text-gray-400'}`}>
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  forceLight,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  forceLight?: boolean;
}) {
  // Hide rows with no data instead of rendering "—" so the popup stays
  // compact for parked vehicles missing OBD telemetry.
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex items-start justify-between gap-3">
      <span className={`flex-shrink-0 ${forceLight ? 'text-gray-700' : 'text-gray-500 dark:text-gray-400'}`}>{label}</span>
      <span
        className={`text-right break-all ${forceLight ? 'text-gray-900' : 'text-gray-900 dark:text-gray-200'} ${
          mono ? 'font-mono text-[11px]' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}
