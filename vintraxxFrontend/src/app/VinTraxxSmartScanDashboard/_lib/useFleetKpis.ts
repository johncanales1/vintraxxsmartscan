/**
 * useFleetKpis — derive 4 GPS KPIs for the Overview row from existing
 * user-scoped endpoints. No new backend endpoint is required.
 *
 *   • devicesTotal   — terminals.length
 *   • devicesOnline  — terminals.filter(s === "ONLINE").length
 *   • alarms24h      — gpsApi.listAlarms({since: 24h ago}).length
 *   • distance7dKm   — sum(getDailyStats(t.id, since=7d)) per terminal
 *
 * The per-terminal stats fan-out is acceptable for typical dealer fleets
 * (\u2264 50 terminals). Future PR can add a single /gps/stats/overview endpoint.
 */

"use client";

import { useEffect, useState } from "react";
import { gpsApi } from "./gpsApi";
import type { GpsTerminal } from "./types";

export interface FleetKpis {
  devicesTotal: number;
  devicesOnline: number;
  alarms24h: number;
  distance7dKm: number;
  loading: boolean;
}

export function useFleetKpis(terminals: GpsTerminal[]): FleetKpis {
  const [alarms24h, setAlarms24h] = useState(0);
  const [distance7dKm, setDistance7dKm] = useState(0);
  const [loading, setLoading] = useState(true);

  // Stable key for terminal ids so the effect re-runs only when membership
  // changes (not on every status flip).
  const terminalIdsKey = terminals
    .map((t) => t.id)
    .sort()
    .join(",");

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const since7d = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString();

      // Alarms: one round-trip.
      const alarmsRes = await gpsApi.listAlarms(
        { since: since24h, limit: 500 },
        controller.signal,
      );
      if (cancelled) return;
      const alarmsCount =
        alarmsRes.success && alarmsRes.data
          ? alarmsRes.data.alarms?.length ?? 0
          : 0;
      setAlarms24h(alarmsCount);

      // Distance: per-terminal stats fan-out. Cap concurrency at 5 so a
      // 50-terminal fleet doesn't fire 50 simultaneous requests on every
      // dashboard mount/refresh (which would saturate the backend daily-
      // stats handler and the browser's per-host connection budget).
      // On any per-terminal error we treat the contribution as 0 to keep
      // the KPI useful.
      const ids = terminalIdsKey ? terminalIdsKey.split(",") : [];
      if (ids.length === 0) {
        setDistance7dKm(0);
      } else {
        const CONCURRENCY = 5;
        let total = 0;
        for (let i = 0; i < ids.length; i += CONCURRENCY) {
          if (cancelled) return;
          const batch = ids.slice(i, i + CONCURRENCY);
          const results = await Promise.all(
            batch.map((id) =>
              gpsApi.getDailyStats(id, { since: since7d }, controller.signal),
            ),
          );
          if (cancelled) return;
          for (const res of results) {
            // Backend returns `days`, not `stats` — see gpsApi.getDailyStats.
            if (!res.success || !res.data?.days) continue;
            total += res.data.days.reduce(
              (s, row) => s + (row.distanceKm ?? 0),
              0,
            );
          }
        }
        setDistance7dKm(total);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [terminalIdsKey]);

  return {
    devicesTotal: terminals.length,
    devicesOnline: terminals.filter((t) => t.status === "ONLINE").length,
    alarms24h,
    distance7dKm,
    loading,
  };
}
