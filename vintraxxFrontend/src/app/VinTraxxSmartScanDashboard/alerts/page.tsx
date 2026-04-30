/**
 * /VinTraxxSmartScanDashboard/alerts \u2014 fleet-wide alarms.
 */

"use client";

import { useMemo, useState } from "react";
import { useGpsAlarms } from "../_lib/useGpsAlarms";
import { useGpsTerminals } from "../_lib/useGpsTerminals";
import { AlertsTable } from "../_components/AlertsTable";

export default function AlertsPage() {
  const { terminals } = useGpsTerminals();
  const [severity, setSeverity] = useState<"" | "INFO" | "WARNING" | "CRITICAL">(
    "",
  );
  const [period, setPeriod] = useState<"24h" | "7d" | "30d">("7d");
  const [showAcked, setShowAcked] = useState(false);

  const sinceIso = useMemo(() => {
    const ms =
      period === "24h"
        ? 24 * 60 * 60 * 1000
        : period === "7d"
          ? 7 * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000;
    return new Date(Date.now() - ms).toISOString();
  }, [period]);

  const { alarms, loading, refetch } = useGpsAlarms({
    since: sinceIso,
    severity: severity || undefined,
    acknowledged: showAcked ? undefined : false,
    limit: 500,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Alerts</h1>
        <p className="text-sm text-slate-500 mt-1">
          Real-time alerts across your fleet.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          value={period}
          onChange={(v) => setPeriod(v as typeof period)}
          options={[
            { value: "24h", label: "24h" },
            { value: "7d", label: "7d" },
            { value: "30d", label: "30d" },
          ]}
        />
        <Segmented
          value={severity}
          onChange={(v) => setSeverity(v as typeof severity)}
          options={[
            { value: "", label: "All" },
            { value: "CRITICAL", label: "Critical" },
            { value: "WARNING", label: "Warning" },
            { value: "INFO", label: "Info" },
          ]}
        />
        <label className="inline-flex items-center gap-2 text-sm text-slate-600 ml-auto">
          <input
            type="checkbox"
            checked={showAcked}
            onChange={(e) => setShowAcked(e.target.checked)}
            className="rounded border-slate-300"
          />
          Include acknowledged
        </label>
      </div>
      <AlertsTable
        alarms={alarms}
        terminals={terminals}
        loading={loading}
        onChange={refetch}
      />
    </div>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`h-8 px-3 rounded-md text-xs font-semibold ${
            value === opt.value
              ? "bg-[#1B3A5F] text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
