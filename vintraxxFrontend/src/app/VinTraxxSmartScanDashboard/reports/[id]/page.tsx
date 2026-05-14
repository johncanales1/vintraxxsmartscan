/**
 * /VinTraxxSmartScanDashboard/reports/[id] — Full Scan Report for one terminal.
 *
 * Resolves the terminal from the shared useGpsTerminals hook, then renders
 * the GpsScanReportPanel which owns Refresh + View Full Report buttons.
 * Reached from the /reports online-terminal cards grid.
 */

"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { BackLink } from "../../_components/BackLink";
import { GpsScanReportPanel } from "../../_components/GpsScanReportPanel";
import { useGpsTerminals } from "../../_lib/useGpsTerminals";
import { vehicleLabel, formatRelativeOrAbsolute } from "../../_lib/format";
import type { GpsTerminalStatus } from "../../_lib/types";

const STATUS_MAP: Record<GpsTerminalStatus, { dot: string; label: string; text: string }> = {
  ONLINE:          { dot: "bg-emerald-500", label: "text-emerald-700", text: "Online" },
  OFFLINE:         { dot: "bg-slate-400",   label: "text-slate-500",   text: "Offline" },
  NEVER_CONNECTED: { dot: "bg-slate-300",   label: "text-slate-400",   text: "Never connected" },
  REVOKED:         { dot: "bg-rose-500",    label: "text-rose-600",    text: "Revoked" },
};

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { terminals, loading } = useGpsTerminals();
  const terminal = useMemo(
    () => terminals.find((t) => t.id === id) ?? null,
    [terminals, id],
  );

  const statusStyle = terminal ? STATUS_MAP[terminal.status] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <BackLink
        href="/VinTraxxSmartScanDashboard/reports"
        label="Back to Reports"
      />

      {/* Terminal header */}
      {loading && !terminal ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 animate-pulse">
          <div className="h-5 w-48 bg-slate-200 rounded mb-2" />
          <div className="h-3 w-32 bg-slate-100 rounded" />
        </div>
      ) : terminal && statusStyle ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {vehicleLabel(terminal)}
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              {terminal.deviceIdentifier} &bull; {terminal.vehicleVin ?? "VIN —"}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className={`inline-flex items-center gap-1.5 font-semibold ${statusStyle.label}`}>
              <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
              {statusStyle.text}
            </span>
            <span className="text-slate-500">
              Last seen {formatRelativeOrAbsolute(terminal.lastHeartbeatAt)}
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Terminal not found, or not paired with your account.
        </div>
      )}

      {/* Full Scan Report panel */}
      {terminal && <GpsScanReportPanel terminal={terminal} />}
    </div>
  );
}
