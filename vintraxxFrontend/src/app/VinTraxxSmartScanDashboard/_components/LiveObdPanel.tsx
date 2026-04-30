/**
 * LiveObdPanel \u2014 displays the most recent vehicle telemetry from
 * GpsLocation (the dealer\u2010visible subset). Subscribes to per-terminal WS
 * via `useGpsLatest` so values tick in real time when the device sends a
 * 0x0200 location report.
 *
 * Note: rich OBD PIDs (RPM, coolant temp, etc.) live in `GpsObdSnapshot`
 * which today only exposes through the admin namespace. When a user-facing
 * /terminals/:id/obd endpoint ships, this panel can layer it on top of the
 * fields already shown here.
 */

"use client";

import { Activity, Battery, Compass, Fuel, Gauge, Satellite } from "lucide-react";
import { useGpsLatest } from "../_lib/useGpsLatest";
import { formatRelativeOrAbsolute, formatMph } from "../_lib/format";

interface Props {
  terminalId: string;
}

export function LiveObdPanel({ terminalId }: Props) {
  const { location, loading } = useGpsLatest(terminalId);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Vehicle Telemetry</h3>
        <span className="text-xs text-slate-500">
          {location
            ? formatRelativeOrAbsolute(location.reportedAt)
            : loading
              ? "Loading..."
              : "No data"}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat
          icon={<Gauge className="w-4 h-4" />}
          label="Speed"
          value={formatMph(location?.speedKmh ?? null)}
        />
        <Stat
          icon={<Compass className="w-4 h-4" />}
          label="Heading"
          value={
            location?.heading !== null && location?.heading !== undefined
              ? `${location.heading}\u00b0`
              : "—"
          }
        />
        <Stat
          icon={<Activity className="w-4 h-4" />}
          label="Ignition"
          value={
            location
              ? location.accOn === true
                ? "ON"
                : location.accOn === false
                  ? "OFF"
                  : "—"
              : "—"
          }
          accent={
            location?.accOn ? "text-emerald-600" : "text-slate-500"
          }
        />
        <Stat
          icon={<Satellite className="w-4 h-4" />}
          label="GPS"
          value={location?.gpsFix ? "Fixed" : location ? "No fix" : "—"}
          accent={location?.gpsFix ? "text-emerald-600" : "text-amber-600"}
        />
        <Stat
          icon={<Activity className="w-4 h-4" />}
          label="Odometer"
          value={
            location?.odometerKm !== null && location?.odometerKm !== undefined
              ? `${(location.odometerKm * 0.621371).toFixed(0)} mi`
              : "—"
          }
        />
        <Stat
          icon={<Fuel className="w-4 h-4" />}
          label="Fuel"
          value={
            location?.fuelLevelPct !== null &&
            location?.fuelLevelPct !== undefined
              ? `${location.fuelLevelPct.toFixed(0)}%`
              : "—"
          }
        />
        <Stat
          icon={<Battery className="w-4 h-4" />}
          label="Vehicle Battery"
          value={
            location?.externalVoltageMv
              ? `${(location.externalVoltageMv / 1000).toFixed(1)}V`
              : "—"
          }
        />
        <Stat
          icon={<Battery className="w-4 h-4" />}
          label="Backup Battery"
          value={
            location?.batteryVoltageMv
              ? `${(location.batteryVoltageMv / 1000).toFixed(1)}V`
              : "—"
          }
        />
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <p className={`text-lg font-bold text-slate-900 ${accent ?? ""}`}>
        {value}
      </p>
    </div>
  );
}
