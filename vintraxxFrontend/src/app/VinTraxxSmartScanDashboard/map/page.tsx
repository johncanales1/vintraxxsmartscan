/**
 * /VinTraxxSmartScanDashboard/map \u2014 fleet-wide live map.
 *
 * For each terminal we pull the latest location once on mount, then layer WS
 * `location.update` events on top via individual `useGpsLatest` subscriptions.
 * To keep the WS subscription count bounded, we ONLY subscribe to terminals
 * that are currently online \u2014 offline ones get a static last-known marker.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGpsTerminals } from "../_lib/useGpsTerminals";
import { gpsApi } from "../_lib/gpsApi";
import { gpsWs } from "../_lib/gpsWs";
import { DeviceMapPanel } from "../_components/DeviceMapPanel";
import type { GpsLocation } from "../_lib/types";
import { vehicleLabel, formatRelativeOrAbsolute } from "../_lib/format";

export default function MapPage() {
  const router = useRouter();
  const { terminals, loading } = useGpsTerminals();
  const [locations, setLocations] = useState<Record<string, GpsLocation | null>>(
    {},
  );

  // Seed: fetch latest for every terminal in parallel.
  useEffect(() => {
    if (terminals.length === 0) return;
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      const results = await Promise.all(
        terminals.map((t) =>
          gpsApi
            .getLatestLocation(t.id, controller.signal)
            .then((res) => ({ id: t.id, loc: res.data?.location ?? null })),
        ),
      );
      if (cancelled) return;
      const next: Record<string, GpsLocation | null> = {};
      for (const { id, loc } of results) next[id] = loc;
      setLocations(next);
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [terminals]);

  // Per-terminal subscriptions for ONLINE devices (so the map ticks live).
  // Acquire/release via the same refcount-aware path that useGpsLatest uses.
  useEffect(() => {
    const online = terminals.filter((t) => t.status === "ONLINE");
    for (const t of online) gpsWs.subscribeTerminal(t.id);
    const offLoc = gpsWs.on("location.update", (e) => {
      setLocations((prev) => ({
        ...prev,
        [e.terminalId]: {
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
        },
      }));
    });
    return () => {
      offLoc();
      for (const t of online) gpsWs.unsubscribeTerminal(t.id);
    };
  }, [terminals]);

  const points = terminals
    .map((t) => {
      const loc = locations[t.id];
      if (!loc) return null;
      return {
        id: t.id,
        lat: loc.latitude,
        lng: loc.longitude,
        label: vehicleLabel(t),
        caption: `${t.status === "ONLINE" ? "Online" : "Offline"} \u2022 ${formatRelativeOrAbsolute(loc.reportedAt)}`,
        color: (t.status === "ONLINE"
          ? "online"
          : t.status === "OFFLINE"
            ? "offline"
            : "primary") as "online" | "offline" | "primary",
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live Map</h1>
          <p className="text-sm text-slate-500 mt-1">
            {points.length} of {terminals.length} device
            {terminals.length === 1 ? "" : "s"} on the map
          </p>
        </div>
      </div>
      <DeviceMapPanel points={points} heightClass="h-[60vh] min-h-[420px]" />
      {!loading && terminals.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Vehicle</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Last position</th>
                  <th className="px-4 py-3 text-left">Reported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {terminals.map((t) => {
                  const loc = locations[t.id];
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() =>
                        router.push(
                          `/VinTraxxSmartScanDashboard/devices/${t.id}?sub=live`,
                        )
                      }
                    >
                      <td className="px-4 py-3 text-slate-900">
                        {vehicleLabel(t)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {t.status === "ONLINE" ? "Online" : "Offline"}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs font-mono">
                        {loc
                          ? `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {loc ? formatRelativeOrAbsolute(loc.reportedAt) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
