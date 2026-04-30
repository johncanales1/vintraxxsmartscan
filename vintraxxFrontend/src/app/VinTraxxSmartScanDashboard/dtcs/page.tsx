/**
 * /VinTraxxSmartScanDashboard/dtcs \u2014 fleet-wide DTC events.
 *
 * Each row exposes [Generate AI Report] which calls the AI bridge
 * (POST /gps/dtc-events/:id/analyze) and routes the resulting Scan into the
 * shared scan-detail modal.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useGpsTerminals } from "../_lib/useGpsTerminals";
import { gpsApi } from "../_lib/gpsApi";
import { DtcTable } from "../_components/DtcTable";
import type { GpsDtcEvent } from "../_lib/types";

export default function DtcsPage() {
  const { terminals } = useGpsTerminals();
  const [events, setEvents] = useState<GpsDtcEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"24h" | "7d" | "30d">("30d");

  const sinceIso = useMemo(() => {
    const ms =
      period === "24h"
        ? 24 * 60 * 60 * 1000
        : period === "7d"
          ? 7 * 24 * 60 * 60 * 1000
          : 30 * 24 * 60 * 60 * 1000;
    return new Date(Date.now() - ms).toISOString();
  }, [period]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    (async () => {
      const res = await gpsApi.listDtcEvents(
        { since: sinceIso, limit: 200 },
        controller.signal,
      );
      if (cancelled) return;
      if (res.success && res.data) setEvents(res.data.events ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [sinceIso]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">DTC Events</h1>
          <p className="text-sm text-slate-500 mt-1">
            Diagnostic trouble codes detected by the connected OBD adapters.
          </p>
        </div>
        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
          {(["24h", "7d", "30d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`h-8 px-3 rounded-md text-xs font-semibold ${
                period === p
                  ? "bg-[#1B3A5F] text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <DtcTable events={events} terminals={terminals} loading={loading} />
    </div>
  );
}
