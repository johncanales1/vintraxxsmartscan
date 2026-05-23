"use client";

/**
 * TerminalInfoCard — compact rich-info panel describing a GPS terminal's
 * current/last-known state. Used in InfoWindow popups on the map.
 *
 * Field selection mirrors the admin dashboard's TerminalInfoCard:
 *   • Status (Live vs Parked / Not in Use)
 *   • Last known address (reverse-geocoded client-side — best-effort)
 *   • Last GPS ping / Time parked / Ignition off since
 *   • Vehicle battery + device backup battery
 *   • GPS satellites + cellular CSQ
 *   • Odometer + fuel level
 *   • VIN / Stock # / Plate / Year-Make-Model / IMEI
 *
 * Reverse-geocoding is cached per `terminalId` so the same address isn't
 * re-fetched every time the popup re-opens.
 */

import { useEffect, useState } from "react";
import {
  formatRelativeOrAbsolute,
  formatKmh,
  formatMiles,
  fmtPct,
  fmtVolts,
  terminalLabel,
  toNumber,
} from "../_lib/format";
import type { GpsTerminal, GpsLocation, GpsObdSnapshot } from "../_lib/types";

/**
 * Module-scoped cache so repeated InfoWindow open/close cycles don't burn
 * Google Geocoder quota.
 */
const addressCache: Map<string, { lat: number; lng: number; address: string }> =
  new Map();

function reverseGeocode(
  terminalId: string,
  lat: number,
  lng: number
): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(null);
    const g = (window as unknown as { google?: typeof google }).google;
    if (!g?.maps?.Geocoder) return resolve(null);

    // Cache hit only if the coordinates are within ~10 m of the cached ones.
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
        if (status !== "OK" || !results || results.length === 0) {
          return resolve(null);
        }
        const address = results[0].formatted_address || null;
        if (address) addressCache.set(terminalId, { lat, lng, address });
        resolve(address);
      }
    );
  });
}

interface Props {
  terminal: GpsTerminal;
  location: GpsLocation | null;
  obd: GpsObdSnapshot | null;
  stockNumber?: string | null;
  lastTripEndedAt?: string | null;
  /**
   * When true, render the more compact "inside an InfoWindow" variant
   * (smaller padding, light mode only). When false, render as a standalone
   * card suitable for inline use.
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
  const isOnline = terminal.status === "ONLINE";
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
  const yearMakeModel = [
    terminal.vehicleYear,
    terminal.vehicleMake,
    terminal.vehicleModel,
  ]
    .filter((v) => v !== null && v !== undefined && v !== "")
    .join(" ");

  // Coordinates string with 6-decimal precision (~11 cm).
  const coordsLabel =
    lat !== null && lng !== null
      ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      : null;

  const cellularCsq = location?.signalStrength ?? null;
  const cellularLabel =
    cellularCsq === null || cellularCsq === undefined
      ? null
      : cellularCsq === 99
        ? "Unknown"
        : `${cellularCsq}/31`;

  // Vehicle battery prefers GpsLocation.externalVoltageMv, falls back to OBD.
  const vehicleBatteryMv =
    location?.externalVoltageMv ?? obd?.batteryVoltageMv ?? null;
  const deviceBatteryMv = location?.batteryVoltageMv ?? null;

  // Odometer prefers the GPS additional-info mileage, else OBD distance-with-MIL.
  const odometerKm = location?.odometerKm ?? obd?.milDistanceKm ?? null;

  // Fuel level prefers the GPS additional-info.
  const obdFuelPct =
    obd?.extraPidsJson && typeof obd.extraPidsJson === "object"
      ? toNumber((obd.extraPidsJson as Record<string, unknown>).fuelLevelPct)
      : null;
  const fuelPct = location?.fuelLevelPct ?? obdFuelPct;

  // "Time parked" / "Ignition off since" — only meaningful when offline.
  const parkedSince = isOnline
    ? null
    : terminal.disconnectedAt ?? lastTripEndedAt ?? location?.reportedAt ?? null;

  const containerClass = compact
    ? "min-w-[280px] max-w-[340px] p-1"
    : "rounded-xl border border-slate-200 bg-white p-4";

  return (
    <div className={`${containerClass} text-[12px]`}>
      {/* Header */}
      <div className="flex items-start gap-2 pb-2 mb-2 border-b border-slate-200">
        <span
          className={`mt-1 inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            isOnline ? "bg-emerald-500" : "bg-gray-400"
          }`}
        />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-900 truncate">
            {yearMakeModel ||
              terminal.vehicleVin ||
              terminal.nickname ||
              terminalLabel(terminal)}
          </div>
          <div className="text-[11px] text-slate-600">
            {isOnline ? "Live · Online" : "Parked / Not in Use · Offline"}
          </div>
        </div>
      </div>

      {/* Vehicle identity */}
      <Section title="Vehicle">
        <Row label="VIN" value={terminal.vehicleVin} mono />
        <Row label="Year / Make / Model" value={yearMakeModel || null} />
        <Row label="Stock #" value={stockNumber} />
      </Section>

      {/* Location */}
      <Section title="Location">
        <Row label="Address" value={address} />
        <Row label="Coordinates" value={coordsLabel} mono />
        <Row
          label="Last GPS ping"
          value={
            location?.reportedAt
              ? formatRelativeOrAbsolute(location.reportedAt)
              : null
          }
        />
        {!isOnline && (
          <Row
            label="Time parked"
            value={parkedSince ? formatRelativeOrAbsolute(parkedSince) : null}
          />
        )}
        {isOnline &&
          location?.speedKmh !== null &&
          location?.speedKmh !== undefined && (
            <Row label="Current speed" value={formatKmh(location.speedKmh)} />
          )}
      </Section>

      {/* Vehicle telemetry */}
      <Section title="Vehicle Telemetry">
        <Row
          label="Vehicle battery"
          value={vehicleBatteryMv !== null ? fmtVolts(vehicleBatteryMv) : null}
        />
        <Row
          label="Device backup battery"
          value={deviceBatteryMv !== null ? fmtVolts(deviceBatteryMv) : null}
        />
        <Row
          label="Odometer"
          value={odometerKm !== null ? formatMiles(toNumber(odometerKm)) : null}
        />
        <Row
          label="Fuel level"
          value={fuelPct !== null && fuelPct !== undefined ? fmtPct(fuelPct) : null}
        />
      </Section>

      {/* Signal */}
      <Section title="Signal">
        <Row
          label="GPS satellites"
          value={
            location?.satelliteCount !== null &&
            location?.satelliteCount !== undefined
              ? String(location.satelliteCount)
              : null
          }
        />
        <Row label="Cellular (CSQ)" value={cellularLabel} />
      </Section>

      {/* Device */}
      <Section title="Device" last>
        <Row label="IMEI" value={terminal.imei} mono />
        <Row label="Device ID" value={terminal.deviceIdentifier} mono />
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
  last,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`${last ? "" : "mb-2 pb-2 border-b border-slate-100"}`}>
      <div className="text-[9px] uppercase tracking-wider font-semibold mb-1 text-slate-500">
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
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  // Hide rows with no data instead of rendering "—"
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex-shrink-0 text-slate-500">{label}</span>
      <span
        className={`text-right break-all text-slate-900 ${
          mono ? "font-mono text-[11px]" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
