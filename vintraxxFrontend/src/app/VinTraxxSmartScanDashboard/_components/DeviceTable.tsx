/**
 * DeviceTable — reusable terminal table. Mounted in:
 *   • /devices              (full-width fleet list)
 *   • /map drawer           (filtered to map viewport, via onRowClick)
 *
 * Click a row → navigates to /devices/[id]?sub=live (or fires onRowClick).
 *
 * Visual style matches the OBD / Appraisal tables on the dashboard:
 * blue (`#1B3A5F`) header, gradient `Cpu` avatars, status pills, hover
 * highlight. The first column is labelled "Device" rather than "Vehicle"
 * because `vehicleLabel(t)` falls back through nickname → year/make/model
 * → VIN → JT/T 808 device identifier — i.e. the value identifies the
 * fleet item, not always a vehicle.
 */

"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, Cpu } from "lucide-react";
import type { GpsTerminal } from "../_lib/types";
import {
  formatRelativeOrAbsolute,
  vehicleLabel,
  formatMph,
} from "../_lib/format";

const STATUS_PILL: Record<GpsTerminal["status"], { label: string; classes: string; dot: string }> = {
  ONLINE: {
    label: "Online",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  OFFLINE: {
    label: "Offline",
    classes: "bg-slate-50 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
  NEVER_CONNECTED: {
    label: "Never connected",
    classes: "bg-slate-50 text-slate-500 border-slate-200",
    dot: "bg-slate-300",
  },
  REVOKED: {
    label: "Revoked",
    classes: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
};

interface Props {
  terminals: GpsTerminal[];
  loading: boolean;
  /** Optional latest-speed lookup; rendered if supplied. */
  latestSpeedKmh?: Record<string, number | null | undefined>;
  /** Per-row alarm count override. Defaults to 0 since the list endpoint
   *  doesn't include alarm aggregates today. */
  alarmCounts?: Record<string, number>;
  /** Optional row-click handler. If omitted, rows route to the device
   *  detail page via next/navigation. */
  onRowClick?: (terminal: GpsTerminal) => void;
}

export function DeviceTable({
  terminals,
  loading,
  latestSpeedKmh,
  alarmCounts,
  onRowClick,
}: Props) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">Loading fleet...</p>
      </div>
    );
  }
  if (terminals.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Cpu className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500 font-medium">
          No GPS terminals are paired with your account yet.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Pairing is admin-only — share your device identifier with your
          administrator to provision a new device.
        </p>
      </div>
    );
  }

  const handleRowClick = (t: GpsTerminal) => {
    if (onRowClick) {
      onRowClick(t);
    } else {
      router.push(`/VinTraxxSmartScanDashboard/devices/${t.id}?sub=live`);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full caption-bottom text-sm">
          <thead>
            <tr className="bg-[#1B3A5F]">
              <th className="text-white px-4 py-3 font-semibold text-left">Device</th>
              <th className="text-white px-4 py-3 font-semibold text-left">VIN</th>
              <th className="text-white px-4 py-3 font-semibold text-left">Status</th>
              <th className="text-white px-4 py-3 font-semibold text-left">Speed</th>
              <th className="text-white px-4 py-3 font-semibold text-left">Last Seen</th>
              <th className="text-white px-4 py-3 font-semibold text-left">Battery</th>
              <th className="text-white px-4 py-3 font-semibold text-left">Alarms</th>
              <th className="text-white px-4 py-3 font-semibold text-right w-10" aria-label="Open" />
            </tr>
          </thead>
          <tbody>
            {terminals.map((t) => {
              const status = STATUS_PILL[t.status];
              const speed =
                latestSpeedKmh && latestSpeedKmh[t.id] !== undefined
                  ? latestSpeedKmh[t.id]
                  : null;
              const alarms = alarmCounts?.[t.id] ?? 0;
              return (
                <tr
                  key={t.id}
                  onClick={() => handleRowClick(t)}
                  className="border-b border-slate-100 hover:bg-blue-50/40 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-gradient-to-br from-[#1B3A5F] to-[#2d5278] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Cpu className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">
                          {vehicleLabel(t)}
                        </p>
                        {t.deviceIdentifier && t.deviceIdentifier !== vehicleLabel(t) && (
                          <p className="text-xs text-slate-400 font-mono truncate">
                            ID: {t.deviceIdentifier}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                    {t.vehicleVin ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${status.classes}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 text-sm font-medium tabular-nums">
                    {speed != null ? (
                      formatMph(speed)
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 text-sm">
                    {t.lastHeartbeatAt ? (
                      formatRelativeOrAbsolute(t.lastHeartbeatAt)
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 text-sm">—</td>
                  <td className="px-4 py-3.5">
                    {alarms > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold">
                        {alarms}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <ChevronRight className="w-4 h-4 text-slate-400 inline" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
