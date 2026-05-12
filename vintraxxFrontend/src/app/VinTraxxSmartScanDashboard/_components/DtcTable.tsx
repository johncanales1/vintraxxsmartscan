/**
 * DtcTable \u2014 passive feed of decoded F2 fault-code events.
 *
 * Each row used to expose a [Generate AI Report] button that hit the
 * /gps/dtc-events/:id/analyze bridge. That control has been removed: the
 * Full Scan Report workflow at `/devices/[id]/scan` is now the single
 * entry-point into the AI pipeline for GPS-sourced data. This page is
 * intentionally read-only \u2014 it lists the actual fault-code events the
 * corrected D450 decoder has surfaced, nothing more.
 */

"use client";

import { AlertTriangle } from "lucide-react";
import type { GpsDtcEvent, GpsTerminal } from "../_lib/types";
import { formatRelativeOrAbsolute, vehicleLabel } from "../_lib/format";

interface Props {
  events: GpsDtcEvent[];
  terminals: GpsTerminal[];
  loading: boolean;
}

export function DtcTable({ events, terminals, loading }: Props) {
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
              <th className="px-4 py-3 text-left">Protocol</th>
              <th className="px-4 py-3 text-right">Reported</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.map((event) => {
              const t = terminalById.get(event.terminalId);
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
                  <td className="px-4 py-3 text-xs font-mono text-slate-500">
                    {event.protocol ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-right">
                    {formatRelativeOrAbsolute(event.reportedAt)}
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
