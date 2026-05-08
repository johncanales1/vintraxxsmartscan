/**
 * /VinTraxxSmartScanDashboard/gps — GPS Fleet Overview tab.
 *
 * Renders:
 *   • 4-card KPI strip (devices paired / online now / 24h alerts / 7d miles)
 *   • Recent activity feed: latest 5 alerts + latest 5 trips
 *
 * The shared dashboard layout already injects <GpsTabBar/> on this route, so
 * this page only renders its own content.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    Activity,
    AlertTriangle,
    Cpu,
    Route as RouteIcon,
    ArrowRight,
} from "lucide-react";
import { useGpsTerminals } from "../_lib/useGpsTerminals";
import { useFleetKpis } from "../_lib/useFleetKpis";
import { useGpsAlarms } from "../_lib/useGpsAlarms";
import { gpsApi } from "../_lib/gpsApi";
import {
    formatRelativeOrAbsolute,
    formatMiles,
    formatDuration,
    vehicleLabel,
} from "../_lib/format";
import type { GpsTrip } from "../_lib/types";

const ROOT = "/VinTraxxSmartScanDashboard";

export default function GpsFleetOverviewPage() {
    const { terminals } = useGpsTerminals();
    const fleetKpis = useFleetKpis(terminals);

    const sinceIso = useMemo(
        () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        [],
    );
    const { alarms, loading: alarmsLoading } = useGpsAlarms({
        since: sinceIso,
        limit: 5,
    });

    // Fleet-wide trips (latest 5) — same fan-out pattern as /trips page.
    const [trips, setTrips] = useState<GpsTrip[]>([]);
    const [tripsLoading, setTripsLoading] = useState(true);
    const terminalIdsKey = terminals
        .map((t) => t.id)
        .sort()
        .join(",");

    useEffect(() => {
        if (!terminalIdsKey) {
            setTrips([]);
            setTripsLoading(false);
            return;
        }
        const controller = new AbortController();
        let cancelled = false;
        setTripsLoading(true);
        (async () => {
            const ids = terminalIdsKey.split(",");
            const results = await Promise.all(
                ids.map((id) =>
                    gpsApi.listTrips(
                        id,
                        { since: sinceIso, limit: 5 },
                        controller.signal,
                    ),
                ),
            );
            if (cancelled) return;
            const merged: GpsTrip[] = [];
            for (const res of results) {
                if (res.success && res.data?.trips) merged.push(...res.data.trips);
            }
            merged.sort((a, b) => Date.parse(b.startAt) - Date.parse(a.startAt));
            setTrips(merged.slice(0, 5));
            setTripsLoading(false);
        })();
        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [terminalIdsKey, sinceIso]);

    const terminalById = useMemo(() => {
        const m = new Map<string, (typeof terminals)[number]>();
        for (const t of terminals) m.set(t.id, t);
        return m;
    }, [terminals]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1B3A5F] flex items-center gap-2">
                    <Cpu className="w-6 h-6 sm:w-7 sm:h-7" />
                    GPS Fleet Overview
                </h1>
                <p className="text-sm sm:text-base text-slate-600 mt-1">
                    Live status, alerts and trips across your paired devices.
                </p>
            </div>

            {/* KPI strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Link
                    href={`${ROOT}/devices`}
                    className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 hover:shadow-md hover:border-slate-300 transition-all"
                >
                    <div className="flex items-center justify-between">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#1B3A5F]">
                            <Cpu className="w-5 h-5" />
                        </span>
                        <span className="text-xs text-slate-400">Total</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3">
                        {fleetKpis.devicesTotal}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Devices paired</p>
                </Link>
                <Link
                    href={`${ROOT}/map`}
                    className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 hover:shadow-md hover:border-slate-300 transition-all"
                >
                    <div className="flex items-center justify-between">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <Activity className="w-5 h-5" />
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live
                        </span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3">
                        {fleetKpis.devicesOnline}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Online now</p>
                </Link>
                <Link
                    href={`${ROOT}/alerts`}
                    className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 hover:shadow-md hover:border-slate-300 transition-all"
                >
                    <div className="flex items-center justify-between">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                            <AlertTriangle className="w-5 h-5" />
                        </span>
                        <span className="text-xs text-slate-400">24h</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3">
                        {fleetKpis.alarms24h}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Alerts</p>
                </Link>
                <Link
                    href={`${ROOT}/trips`}
                    className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 hover:shadow-md hover:border-slate-300 transition-all"
                >
                    <div className="flex items-center justify-between">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-[#1B3A5F]">
                            <RouteIcon className="w-5 h-5" />
                        </span>
                        <span className="text-xs text-slate-400">7d</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3">
                        {(fleetKpis.distance7dKm * 0.621371).toFixed(0)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Miles driven</p>
                </Link>
            </div>

            {/* Activity feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Recent alerts */}
                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <header className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-100">
                        <h2 className="flex items-center gap-2 text-sm sm:text-base font-semibold text-[#1B3A5F]">
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                            Recent Alerts
                        </h2>
                        <Link
                            href={`${ROOT}/alerts`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#1B3A5F] hover:text-blue-600"
                        >
                            View all
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </header>
                    <ul className="divide-y divide-slate-100">
                        {alarmsLoading ? (
                            <li className="px-5 py-6 text-sm text-slate-400">
                                Loading…
                            </li>
                        ) : alarms.length === 0 ? (
                            <li className="px-5 py-8 text-center text-sm text-slate-400">
                                No alerts in the last 7 days
                            </li>
                        ) : (
                            alarms.slice(0, 5).map((a) => {
                                const t = terminalById.get(a.terminalId);
                                const sevColor =
                                    a.severity === "CRITICAL"
                                        ? "bg-rose-100 text-rose-700"
                                        : a.severity === "WARNING"
                                          ? "bg-amber-100 text-amber-700"
                                          : "bg-sky-100 text-sky-700";
                                return (
                                    <li key={a.id} className="px-4 sm:px-5 py-3">
                                        <div className="flex items-start gap-3">
                                            <span
                                                className={`mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${sevColor}`}
                                            >
                                                {a.severity}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 truncate">
                                                    {a.type.replace(/_/g, " ")}
                                                </p>
                                                <p className="text-xs text-slate-500 truncate">
                                                    {t ? vehicleLabel(t) : "Unknown vehicle"}
                                                </p>
                                            </div>
                                            <span className="text-xs text-slate-400 whitespace-nowrap">
                                                {formatRelativeOrAbsolute(a.openedAt)}
                                            </span>
                                        </div>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </section>

                {/* Recent trips */}
                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <header className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-100">
                        <h2 className="flex items-center gap-2 text-sm sm:text-base font-semibold text-[#1B3A5F]">
                            <RouteIcon className="w-4 h-4 text-[#1B3A5F]" />
                            Recent Trips
                        </h2>
                        <Link
                            href={`${ROOT}/trips`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#1B3A5F] hover:text-blue-600"
                        >
                            View all
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </header>
                    <ul className="divide-y divide-slate-100">
                        {tripsLoading ? (
                            <li className="px-5 py-6 text-sm text-slate-400">
                                Loading…
                            </li>
                        ) : trips.length === 0 ? (
                            <li className="px-5 py-8 text-center text-sm text-slate-400">
                                No trips in the last 7 days
                            </li>
                        ) : (
                            trips.map((trip) => {
                                const t = terminalById.get(trip.terminalId);
                                return (
                                    <li key={trip.id} className="px-4 sm:px-5 py-3">
                                        <div className="flex items-start gap-3">
                                            <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-[#1B3A5F]">
                                                <RouteIcon className="w-3.5 h-3.5" />
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 truncate">
                                                    {t ? vehicleLabel(t) : "Unknown vehicle"}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {formatMiles(trip.distanceKm)} ·{" "}
                                                    {formatDuration(trip.durationSec)}
                                                </p>
                                            </div>
                                            <span className="text-xs text-slate-400 whitespace-nowrap">
                                                {formatRelativeOrAbsolute(trip.startAt)}
                                            </span>
                                        </div>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </section>
            </div>
        </div>
    );
}
