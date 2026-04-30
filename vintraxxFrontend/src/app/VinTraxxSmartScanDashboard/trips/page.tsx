/**
 * /VinTraxxSmartScanDashboard/trips \u2014 fleet-wide trips.
 *
 * Strategy: fan-out gpsApi.listTrips per terminal, then merge + sort by
 * start time desc client-side. The /gps/trips fleet aggregate isn't exposed
 * yet; this matches the mobile pattern.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useGpsTerminals } from "../_lib/useGpsTerminals";
import { gpsApi } from "../_lib/gpsApi";
import { TripsTable } from "../_components/TripsTable";
import type { GpsTrip } from "../_lib/types";

export default function TripsPage() {
  const { terminals } = useGpsTerminals();
  const [trips, setTrips] = useState<GpsTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");

  const sinceIso = useMemo(() => {
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  }, [period]);

  const terminalIdsKey = terminals
    .map((t) => t.id)
    .sort()
    .join(",");

  useEffect(() => {
    if (!terminalIdsKey) {
      setTrips([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    (async () => {
      const ids = terminalIdsKey.split(",");
      const results = await Promise.all(
        ids.map((id) =>
          gpsApi.listTrips(
            id,
            { since: sinceIso, limit: 50 },
            controller.signal,
          ),
        ),
      );
      if (cancelled) return;
      const merged: GpsTrip[] = [];
      for (const res of results) {
        if (res.success && res.data?.trips) merged.push(...res.data.trips);
      }
      merged.sort(
        (a, b) => Date.parse(b.startAt) - Date.parse(a.startAt),
      );
      setTrips(merged);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [terminalIdsKey, sinceIso]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trips</h1>
          <p className="text-sm text-slate-500 mt-1">
            {trips.length} trip{trips.length === 1 ? "" : "s"} in the last{" "}
            {period}
          </p>
        </div>
        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
          {(["7d", "30d", "90d"] as const).map((p) => (
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
      <TripsTable trips={trips} terminals={terminals} loading={loading} />
    </div>
  );
}
