/**
 * useGpsTerminals — REST seed + WS deltas for the dealer's fleet.
 *
 * On mount: fetches /gps/terminals once. Then subscribes to:
 *   • `terminal.online` / `terminal.offline` — flip status + lastHeartbeatAt.
 *   • `location.update`                       — best-effort heartbeat refresh.
 *
 * Exposes `{ terminals, loading, error, refetch }`. The terminals array is
 * sorted by `lastHeartbeatAt desc` (matching mobile + admin conventions).
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gpsApi } from "./gpsApi";
import { gpsWs } from "./gpsWs";
import type { GpsTerminal } from "./types";

function sortByLastSeen(a: GpsTerminal, b: GpsTerminal): number {
  const ai = a.lastHeartbeatAt ? Date.parse(a.lastHeartbeatAt) : 0;
  const bi = b.lastHeartbeatAt ? Date.parse(b.lastHeartbeatAt) : 0;
  return bi - ai;
}

export function useGpsTerminals() {
  const [terminals, setTerminals] = useState<GpsTerminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    const res = await gpsApi.listTerminals(controller.signal);
    if (controller.signal.aborted) return;
    if (res.success && res.data) {
      const list = (res.data.terminals ?? []).slice().sort(sortByLastSeen);
      setTerminals(list);
    } else if (res.message !== "aborted") {
      setError(res.message ?? "Failed to load terminals");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
    return () => abortRef.current?.abort();
  }, [refetch]);

  // WS deltas: flip status / refresh lastHeartbeatAt without a refetch.
  useEffect(() => {
    const offOnline = gpsWs.on("terminal.online", (e) => {
      setTerminals((prev) =>
        prev
          .map<GpsTerminal>((t) =>
            t.id === e.terminalId
              ? {
                  ...t,
                  status: "ONLINE",
                  connectedAt: e.at,
                  lastHeartbeatAt: e.at,
                }
              : t,
          )
          .sort(sortByLastSeen),
      );
    });
    const offOffline = gpsWs.on("terminal.offline", (e) => {
      setTerminals((prev) =>
        prev.map<GpsTerminal>((t) =>
          t.id === e.terminalId
            ? { ...t, status: "OFFLINE", disconnectedAt: e.at }
            : t,
        ),
      );
    });
    const offLoc = gpsWs.on("location.update", (e) => {
      // Refresh heartbeat ts so "last seen" sorting stays fresh during live
      // tracking. We deliberately don't update the terminal's coords here —
      // the latest-location hook owns that.
      setTerminals((prev) =>
        prev
          .map<GpsTerminal>((t) =>
            t.id === e.terminalId
              ? { ...t, lastHeartbeatAt: e.data.reportedAt, status: "ONLINE" }
              : t,
          )
          .sort(sortByLastSeen),
      );
    });
    return () => {
      offOnline();
      offOffline();
      offLoc();
    };
  }, []);

  return { terminals, loading, error, refetch };
}
