/**
 * useGpsLatest — per-terminal latest location with WS deltas. Used by
 * LiveTrack-style views (Device detail Live tab, Live Map markers).
 *
 * The per-terminal `terminal:<id>` WS subscription is acquired and released
 * via `gpsWs.{subscribe,unsubscribe}Terminal`, which is internally
 * refcount-aware. Multiple consumers of the same terminal share one
 * server-side subscription; the channel is only torn down when the last
 * consumer unmounts.
 */

"use client";

import { useEffect, useState } from "react";
import { gpsApi } from "./gpsApi";
import { gpsWs } from "./gpsWs";
import type { GpsLocation } from "./types";

export function useGpsLatest(terminalId: string | null | undefined) {
  const [location, setLocation] = useState<GpsLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!terminalId) return;
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    gpsWs.subscribeTerminal(terminalId);

    (async () => {
      const res = await gpsApi.getLatestLocation(terminalId, controller.signal);
      if (cancelled) return;
      if (res.success && res.data) {
        setLocation(res.data.location);
      }
      setLoading(false);
    })();

    const offLoc = gpsWs.on("location.update", (e) => {
      if (e.terminalId !== terminalId) return;
      // The WS payload carries only lat/lng/speed/heading/altitude/acc/gps
      // and alarm+status bits. Richer telemetry (odometer, fuelLevelPct,
      // voltages, satelliteCount, cell info) is NOT in the event but IS in
      // the row we already fetched via REST. We MERGE on top of the previous
      // state so those fields don't flicker to "—" on every WS tick.
      setLocation((prev) => ({
        ...(prev ?? {
          satelliteCount: null,
          signalStrength: null,
          odometerKm: null,
          fuelLevelPct: null,
          externalVoltageMv: null,
          batteryVoltageMv: null,
          mcc: null,
          mnc: null,
          lac: null,
          cellId: null,
        }),
        id: `ws-${e.terminalId}-${e.data.reportedAt}`,
        terminalId: e.terminalId,
        alarmBits: e.data.alarmBits,
        statusBits: e.data.statusBits,
        latitude: e.data.latitude,
        longitude: e.data.longitude,
        altitudeM: e.data.altitudeM,
        speedKmh: e.data.speedKmh,
        heading: e.data.heading,
        reportedAt: e.data.reportedAt,
        serverReceivedAt: new Date().toISOString(),
        accOn: e.data.accOn,
        gpsFix: e.data.gpsFix,
      }));
    });

    return () => {
      cancelled = true;
      controller.abort();
      offLoc();
      gpsWs.unsubscribeTerminal(terminalId);
    };
  }, [terminalId]);

  return { location, loading };
}
