/**
 * DtcTable \u2014 list of GPS-detected DTC events. Each row exposes a
 * [Generate AI Report] button that hits POST /gps/dtc-events/:id/analyze and
 * polls the resulting Scan via the shared ScanDetailContext, so the final
 * report shows up in the SAME modal as the Overview OBD scan list.
 */

"use client";

import { useState } from "react";
import { Sparkles, AlertTriangle } from "lucide-react";
import { gpsApi } from "../_lib/gpsApi";
import { useScanDetail } from "./ScanDetailContext";
import type { GpsDtcEvent, GpsTerminal } from "../_lib/types";
import { formatRelativeOrAbsolute, vehicleLabel } from "../_lib/format";

interface Props {
  events: GpsDtcEvent[];
  terminals: GpsTerminal[];
  loading: boolean;
}

export function DtcTable({ events, terminals, loading }: Props) {
  const { openByScanId } = useScanDetail();
  /** Per-event request state: idle | submitting | running */
  const [stateById, setStateById] = useState<Record<string, "idle" | "submitting" | "running">>({});
  const [errorById, setErrorById] = useState<Record<string, string | undefined>>({});

  const onAnalyze = async (eventId: string) => {
    setErrorById((prev) => ({ ...prev, [eventId]: undefined }));
    setStateById((prev) => ({ ...prev, [eventId]: "submitting" }));
    const res = await gpsApi.analyzeDtcEvent(eventId);
    if (!res.success || !res.data) {
      setStateById((prev) => ({ ...prev, [eventId]: "idle" }));
      setErrorById((prev) => ({
        ...prev,
        [eventId]: res.message ?? "Failed to start analysis",
      }));
      return;
    }
    setStateById((prev) => ({ ...prev, [eventId]: "running" }));
    // Open the modal in the loading state and let the context poll until
    // the report is ready.
    openByScanId(res.data.scanId, { pollUntilComplete: true });
    // We leave state="running" so the row keeps showing the spinner; if the
    // user closes the modal we can safely reset on next click.
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">Loading DTC events...</p>
      </div>
    );
  }
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500">
          No DTC events have been reported yet.
        </p>
      </div>
    );
  }

  const terminalById = new Map(terminals.map((t) => [t.id, t]));

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Vehicle</th>
              <th className="px-4 py-3 text-left">VIN</th>
              <th className="px-4 py-3 text-left">Codes</th>
              <th className="px-4 py-3 text-left">MIL</th>
              <th className="px-4 py-3 text-left">Reported</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.map((event) => {
              const t = terminalById.get(event.terminalId);
              const state = stateById[event.id] ?? "idle";
              const err = errorById[event.id];
              return (
                <tr key={event.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-900">
                    {t ? vehicleLabel(t) : event.terminalId.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {event.vin ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div className="flex flex-wrap gap-1">
                      {event.storedDtcCodes.slice(0, 4).map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-rose-50 text-rose-700"
                        >
                          {c}
                        </span>
                      ))}
                      {event.storedDtcCodes.length > 4 && (
                        <span className="text-xs text-slate-500">
                          +{event.storedDtcCodes.length - 4}
                        </span>
                      )}
                      {event.storedDtcCodes.length === 0 && "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {event.milOn ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                        ON
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">off</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatRelativeOrAbsolute(event.reportedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onAnalyze(event.id)}
                      disabled={state !== "idle"}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#1B3A5F] hover:bg-[#2d5278] disabled:bg-slate-300 text-white text-xs font-semibold"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {state === "idle"
                        ? "Generate AI Report"
                        : state === "submitting"
                          ? "Starting..."
                          : "Running"}
                    </button>
                    {err && (
                      <p className="text-xs text-rose-600 mt-1">{err}</p>
                    )}
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
