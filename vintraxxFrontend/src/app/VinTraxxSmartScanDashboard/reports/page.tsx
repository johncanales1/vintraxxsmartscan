/**
 * /VinTraxxSmartScanDashboard/reports — GPS Scan Reports hub.
 *
 * Shows only ONLINE terminals as clickable cards. Selecting a terminal
 * navigates to /reports/[id] where the Full Scan Report panel lives.
 */

"use client";

import Link from "next/link";
import { Cpu, FileText, RefreshCw, Wifi } from "lucide-react";
import { useGpsTerminals } from "../_lib/useGpsTerminals";
import { vehicleLabel, formatRelativeOrAbsolute } from "../_lib/format";

export default function ReportsPage() {
  const { terminals, loading, error, refetch } = useGpsTerminals();
  const onlineTerminals = terminals.filter((t) => t.status === "ONLINE");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Scan Reports</h1>
          <p className="text-sm text-slate-500 mt-1">
            Select an online terminal to run or view a full diagnostic report.
            Only active LTE-connected devices can be scanned.
          </p>
        </div>
        <button
          onClick={() => void refetch()}
          disabled={loading}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 animate-pulse"
            >
              <div className="h-4 w-3/4 bg-slate-200 rounded" />
              <div className="h-3 w-1/2 bg-slate-100 rounded" />
              <div className="h-3 w-2/3 bg-slate-100 rounded" />
              <div className="h-9 w-full bg-slate-100 rounded-md mt-4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state — no online terminals */}
      {!loading && !error && onlineTerminals.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-16 text-center">
          <Wifi className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-700">
            No online terminals found.
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Scan reports require an active LTE connection. Make sure the
            ignition is on and the GPS device is communicating.
          </p>
          {terminals.length > 0 && (
            <p className="text-xs text-slate-400 mt-3">
              {terminals.length} device{terminals.length === 1 ? "" : "s"}{" "}
              paired — {terminals.length === 1 ? "it is" : "all are"} currently
              offline.
            </p>
          )}
        </div>
      )}

      {/* Online terminal cards */}
      {!loading && onlineTerminals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {onlineTerminals.map((terminal) => (
            <div
              key={terminal.id}
              className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col gap-3 hover:border-[#1B3A5F]/40 hover:shadow-md transition-all"
            >
              {/* Status badge */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
                <span className="text-[11px] text-slate-400">
                  {formatRelativeOrAbsolute(terminal.lastHeartbeatAt)}
                </span>
              </div>

              {/* Vehicle info */}
              <div>
                <p className="text-base font-bold text-slate-900 leading-tight">
                  {vehicleLabel(terminal)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  {terminal.vehicleVin ?? "VIN —"}
                </p>
              </div>

              {/* Device identifier */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono truncate">
                  {terminal.deviceIdentifier}
                </span>
              </div>

              {/* CTA */}
              <Link
                href={`/VinTraxxSmartScanDashboard/reports/${terminal.id}`}
                className="mt-1 inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-[#1B3A5F] hover:bg-[#2d5278] text-white text-sm font-semibold transition-colors"
              >
                <FileText className="w-4 h-4" />
                View Scan Report
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
