/**
 * TripsTable \u2014 list of trips for one terminal OR fleet-wide. Reused by:
 *   \u2022 /trips                         (fleet-wide)
 *   \u2022 /devices/[id]?sub=trips       (single terminal)
 */

"use client";

import { Route as RouteIcon } from "lucide-react";
import type { GpsTerminal, GpsTrip } from "../_lib/types";
import {
  formatDuration,
  formatMiles,
  formatMph,
  vehicleLabel,
} from "../_lib/format";

interface Props {
  trips: GpsTrip[];
  terminals: GpsTerminal[];
  loading: boolean;
  onRowClick?: (trip: GpsTrip) => void;
}

export function TripsTable({ trips, terminals, loading, onRowClick }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">Loading trips...</p>
      </div>
    );
  }
  if (trips.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <RouteIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500">No trips in this view.</p>
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
              <th className="px-4 py-3 text-left">Start</th>
              <th className="px-4 py-3 text-left">End</th>
              <th className="px-4 py-3 text-left">Distance</th>
              <th className="px-4 py-3 text-left">Duration</th>
              <th className="px-4 py-3 text-left">Max</th>
              <th className="px-4 py-3 text-left">Harsh</th>
              <th className="px-4 py-3 text-left">Idle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {trips.map((trip) => {
              const t = terminalById.get(trip.terminalId);
              const harsh =
                trip.harshAccelCount + trip.harshBrakeCount + trip.harshTurnCount;
              return (
                <tr
                  key={trip.id}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => onRowClick?.(trip)}
                >
                  <td className="px-4 py-3 text-slate-900">
                    {t ? vehicleLabel(t) : trip.terminalId.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">
                    {new Date(trip.startAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">
                    {trip.endAt
                      ? new Date(trip.endAt).toLocaleString()
                      : (
                        <span className="text-emerald-600 font-semibold">
                          In progress
                        </span>
                      )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatMiles(trip.distanceKm)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDuration(trip.durationSec)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatMph(trip.maxSpeedKmh)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {harsh > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                        {harsh}
                      </span>
                    ) : (
                      "0"
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {trip.idleDurationSec
                      ? formatDuration(trip.idleDurationSec)
                      : "—"}
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
