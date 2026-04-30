/**
 * AlertsTable \u2014 fleet-wide or per-terminal alarms with multi-select +
 * bulk-acknowledge. Used by /alerts and /devices/[id]?sub=alarms.
 */

"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import type { GpsAlarm, GpsTerminal } from "../_lib/types";
import { formatRelativeOrAbsolute, vehicleLabel } from "../_lib/format";
import { gpsApi } from "../_lib/gpsApi";

const SEVERITY_STYLES: Record<
  GpsAlarm["severity"],
  { bg: string; text: string; label: string }
> = {
  CRITICAL: { bg: "bg-rose-100", text: "text-rose-800", label: "Critical" },
  WARNING: { bg: "bg-amber-100", text: "text-amber-800", label: "Warning" },
  INFO: { bg: "bg-sky-100", text: "text-sky-800", label: "Info" },
};

interface Props {
  alarms: GpsAlarm[];
  terminals: GpsTerminal[];
  loading: boolean;
  /** Called after a successful bulk-ack so the parent can refetch. */
  onChange?: () => void;
  onRowClick?: (alarm: GpsAlarm) => void;
}

export function AlertsTable({
  alarms,
  terminals,
  loading,
  onChange,
  onRowClick,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [acking, setAcking] = useState(false);

  const terminalById = useMemo(() => {
    const m = new Map<string, GpsTerminal>();
    for (const t of terminals) m.set(t.id, t);
    return m;
  }, [terminals]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected =
    alarms.length > 0 && alarms.every((a) => selected.has(a.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(alarms.map((a) => a.id)));
  };

  const onBulkAck = async () => {
    if (selected.size === 0) return;
    setAcking(true);
    const ids = Array.from(selected);
    // Limit concurrency to avoid hammering the server. 5 is plenty for a
    // dashboard scenario.
    const concurrency = 5;
    for (let i = 0; i < ids.length; i += concurrency) {
      const batch = ids.slice(i, i + concurrency);
      await Promise.all(batch.map((id) => gpsApi.ackAlarm(id)));
    }
    setAcking(false);
    setSelected(new Set());
    onChange?.();
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">Loading alerts...</p>
      </div>
    );
  }
  if (alarms.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500">No alerts in this view.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-slate-900 px-4 py-2 text-white text-sm">
          <span className="font-semibold">
            {selected.size} selected
          </span>
          <button
            onClick={onBulkAck}
            disabled={acking}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-600/50 text-white text-xs font-semibold"
          >
            <Check className="w-4 h-4" />
            {acking ? "Acknowledging..." : "Acknowledge"}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-slate-300 hover:text-white"
          >
            Clear
          </button>
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-3 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="px-4 py-3 text-left">Vehicle</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Severity</th>
                <th className="px-4 py-3 text-left">Opened</th>
                <th className="px-4 py-3 text-left">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alarms.map((alarm) => {
                const t = terminalById.get(alarm.terminalId);
                const sev = SEVERITY_STYLES[alarm.severity];
                return (
                  <tr
                    key={alarm.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => onRowClick?.(alarm)}
                  >
                    <td
                      className="px-3 py-3 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(alarm.id)}
                        onChange={() => toggle(alarm.id)}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-900">
                      {t
                        ? vehicleLabel(t)
                        : (
                            <span className="text-slate-400 font-mono text-xs">
                              {alarm.terminalId.slice(0, 8)}
                            </span>
                          )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 capitalize">
                      {alarm.type.toLowerCase().replaceAll("_", " ")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${sev.bg} ${sev.text}`}
                      >
                        {sev.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatRelativeOrAbsolute(alarm.openedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {alarm.acknowledged ? (
                        <span className="text-xs text-emerald-700 font-semibold">
                          Acknowledged
                        </span>
                      ) : alarm.closedAt ? (
                        <span className="text-xs text-slate-500">Closed</span>
                      ) : (
                        <span className="text-xs text-rose-700 font-semibold">
                          Open
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
