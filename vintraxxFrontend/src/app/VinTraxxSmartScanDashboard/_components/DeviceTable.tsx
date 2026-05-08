/**
 * DeviceTable \u2014 reusable terminal table. Mounted in:
 *   \u2022 /devices              (full-width fleet list)
 *   \u2022 /map drawer           (filtered to map viewport)
 *
 * Click a row \u2192 navigates to /devices/[id]?sub=live.
 */

"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { GpsTerminal } from "../_lib/types";
import {
  formatRelativeOrAbsolute,
  vehicleLabel,
  formatMph,
} from "../_lib/format";

const STATUS_DOT: Record<GpsTerminal["status"], string> = {
  ONLINE: "bg-emerald-500",
  OFFLINE: "bg-slate-400",
  NEVER_CONNECTED: "bg-slate-300",
  SUSPENDED: "bg-rose-500",
};

interface Props {
  terminals: GpsTerminal[];
  loading: boolean;
  /** Optional latest-speed lookup; rendered if supplied. */
  latestSpeedKmh?: Record<string, number | null | undefined>;
  /** Per-row alarm count override. Defaults to 0 since the list endpoint
   *  doesn't include alarm aggregates today. */
  alarmCounts?: Record<string, number>;
  /** Optional row-click handler. If omitted, rows are <Link>s to detail. */
  onRowClick?: (terminal: GpsTerminal) => void;
}

export function DeviceTable({
  terminals,
  loading,
  latestSpeedKmh,
  alarmCounts,
  onRowClick,
}: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">Loading fleet...</p>
      </div>
    );
  }
  if (terminals.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-sm text-slate-500">
          No GPS terminals are paired with your account yet.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Pairing is admin-only \u2014 share your device identifier with your
          administrator to provision a new device.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Vehicle</th>
              <th className="px-4 py-3 text-left">VIN</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Speed</th>
              <th className="px-4 py-3 text-left">Last seen</th>
              <th className="px-4 py-3 text-left">Battery</th>
              <th className="px-4 py-3 text-left">Alarms</th>
              <th className="px-4 py-3 text-right" aria-label="Open" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {terminals.map((t) => {
              const dot = STATUS_DOT[t.status];
              const speed =
                latestSpeedKmh && latestSpeedKmh[t.id] !== undefined
                  ? latestSpeedKmh[t.id]
                  : null;
              const alarms = alarmCounts?.[t.id] ?? 0;
              const inner = (
                <>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {vehicleLabel(t)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {t.vehicleVin ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-xs text-slate-600">
                      <span className={`w-2 h-2 rounded-full ${dot}`} />
                      {t.status === "ONLINE"
                        ? "Online"
                        : t.status === "OFFLINE"
                          ? "Offline"
                          : t.status === "SUSPENDED"
                            ? "Suspended"
                            : "Never connected"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatMph(speed ?? null)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatRelativeOrAbsolute(t.lastHeartbeatAt)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">—</td>
                  <td className="px-4 py-3">
                    {alarms > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold">
                        {alarms}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRight className="w-4 h-4 text-slate-400 inline" />
                  </td>
                </>
              );
              if (onRowClick) {
                return (
                  <tr
                    key={t.id}
                    onClick={() => onRowClick(t)}
                    className="hover:bg-slate-50 cursor-pointer"
                  >
                    {inner}
                  </tr>
                );
              }
              return (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td colSpan={8} className="p-0">
                    <Link
                      href={`/VinTraxxSmartScanDashboard/devices/${t.id}?sub=live`}
                      className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_0.5fr_auto] items-center gap-0"
                    >
                      <span className="px-4 py-3 font-medium text-slate-900 truncate">
                        {vehicleLabel(t)}
                      </span>
                      <span className="px-4 py-3 font-mono text-xs text-slate-500 truncate">
                        {t.vehicleVin ?? "—"}
                      </span>
                      <span className="px-4 py-3">
                        <span className="inline-flex items-center gap-2 text-xs text-slate-600">
                          <span className={`w-2 h-2 rounded-full ${dot}`} />
                          {t.status === "ONLINE"
                            ? "Online"
                            : t.status === "OFFLINE"
                              ? "Offline"
                              : t.status === "SUSPENDED"
                                ? "Suspended"
                                : "Never"}
                        </span>
                      </span>
                      <span className="px-4 py-3 text-slate-600">
                        {formatMph(speed ?? null)}
                      </span>
                      <span className="px-4 py-3 text-slate-600">
                        {formatRelativeOrAbsolute(t.lastHeartbeatAt)}
                      </span>
                      <span className="px-4 py-3 text-slate-600">—</span>
                      <span className="px-4 py-3">
                        {alarms > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold">
                            {alarms}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">0</span>
                        )}
                      </span>
                      <span className="px-4 py-3 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </span>
                    </Link>
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
