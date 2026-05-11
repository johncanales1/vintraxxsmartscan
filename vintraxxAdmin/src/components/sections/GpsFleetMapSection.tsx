'use client';

/**
 * GpsFleetMapSection — live admin fleet map.
 *
 * Strategy:
 *   1. Fetch the list of online terminals (limit 200 — a single page is
 *      enough for any realistic fleet; tune if it grows).
 *   2. Fetch each terminal's latest location in parallel via
 *      `getGpsTerminalLatest`. We use Promise.allSettled so a single
 *      failure doesn't poison the map.
 *   3. Refcount-subscribe to each terminal's WS channel; the singleton
 *      gpsAdminWs deduplicates, so per-terminal subscriptions are cheap.
 *   4. On `location.update` events, mutate the corresponding marker in
 *      place — no full refetch.
 *
 * The map auto-fits its bounds to the markers on first load. The
 * sidebar lists the same fleet with a click-to-pan affordance.
 *
 * Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to be set; without it the
 * component shows a friendly message rather than crashing.
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { GoogleMap, useLoadScript, type Libraries } from '@react-google-maps/api';
import { api, GpsTerminal, GpsLocation } from '@/lib/api';
import { gpsAdminWs } from '@/lib/gpsAdminWs';
import {
  fmtRelative,
  fmtKmh,
  vehicleLabel,
  statusDotClasses,
  toNumber,
} from '@/lib/gpsHelpers';
import {
  RefreshCw, MapPin, Locate, AlertCircle, Search,
} from 'lucide-react';
import { toast } from 'sonner';

interface FleetEntry {
  terminal: GpsTerminal;
  location: GpsLocation | null;
}

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

// Default center: continental US so the map renders something sensible
// before the bounds-fit happens. Picked roughly Lawrence, KS.
const DEFAULT_CENTER = { lat: 39.0, lng: -97.0 };
const DEFAULT_ZOOM = 4;

// Required for `google.maps.marker.AdvancedMarkerElement` — must be loaded
// at script-tag time, not lazily, otherwise the constructor throws
// "AdvancedMarkerView is not loaded". `Libraries` is the typed string-array
// alias from @react-google-maps/api; pinned outside the component so the
// reference stays stable across renders (otherwise useLoadScript warns).
const GMAPS_LIBRARIES: Libraries = ['marker'];

export default function GpsFleetMapSection() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  // `mapId` enables the new vector-rendering pipeline that AdvancedMarker
  // requires. Operators set it in their Google Cloud Console; we soft-fall
  // back to the default raster-only map if unset (markers still render via
  // the fallback HTMLOverlay path inside `AdvancedMarker`).
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined;
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries: GMAPS_LIBRARIES,
  });

  const [entries, setEntries] = useState<Record<string, FleetEntry>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mapRef = useRef<google.maps.Map | null>(null);
  const subscriptionsRef = useRef<Map<string, () => void>>(new Map());

  // Track whether we've already fitted once so the live location stream
  // doesn't keep snapping the map back to the same bounds every second.
  // Cleared on manual refresh so the operator's "Refresh" click re-frames
  // the fleet when vehicles have moved out of the current viewport.
  const fittedRef = useRef(false);

  // ── Load: terminals + latest locations in parallel ──────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    // Allow the next effect to re-fit bounds on this fresh data set.
    fittedRef.current = false;
    try {
      const tRes = await api.listGpsTerminals(1, 200, { filter: 'online' });
      const settled = await Promise.allSettled(
        tRes.terminals.map(async (t) => {
          const r = await api.getGpsTerminalLatest(t.id);
          return { terminal: t, location: r.location } as FleetEntry;
        }),
      );
      const next: Record<string, FleetEntry> = {};
      for (const s of settled) {
        if (s.status === 'fulfilled') next[s.value.terminal.id] = s.value;
      }
      setEntries(next);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load fleet');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── WS: per-terminal subscribe + live location updates ──────────────────
  useEffect(() => {
    // Reconcile subscriptions: subscribe to any new ids and unsubscribe
    // from any that fell out of the fleet.
    const desired = new Set(Object.keys(entries));
    const current = subscriptionsRef.current;
    desired.forEach((id) => {
      if (!current.has(id)) {
        current.set(id, gpsAdminWs.subscribeTerminal(id));
      }
    });
    current.forEach((unsub, id) => {
      if (!desired.has(id)) {
        unsub();
        current.delete(id);
      }
    });
  }, [entries]);

  useEffect(() => {
    // Only one global location.update listener; we filter by terminalId.
    const off = gpsAdminWs.on('location.update', (e) => {
      // The wire payload puts coordinates under `data` (matches the backend
      // `LocationUpdateEvent`). See gpsAdminWs.ts for the contract.
      const d = e.data;
      setEntries((prev) => {
        const cur = prev[e.terminalId];
        if (!cur) return prev; // not part of our fleet — ignore
        return {
          ...prev,
          [e.terminalId]: {
            terminal: cur.terminal,
            location: {
              ...((cur.location ?? {}) as GpsLocation),
              id: cur.location?.id ?? `live:${d.reportedAt}`,
              terminalId: e.terminalId,
              reportedAt: d.reportedAt,
              latitude: d.latitude,
              longitude: d.longitude,
              speedKmh: d.speedKmh,
              heading: d.heading,
              altitudeM: d.altitudeM,
              accOn: d.accOn,
              gpsFix: d.gpsFix,
              alarmBits: d.alarmBits ?? cur.location?.alarmBits ?? 0,
              statusBits: d.statusBits ?? cur.location?.statusBits ?? 0,
              satelliteCount: cur.location?.satelliteCount ?? null,
              signalStrength: cur.location?.signalStrength ?? null,
              odometerKm: cur.location?.odometerKm ?? null,
              fuelLevelPct: cur.location?.fuelLevelPct ?? null,
              externalVoltageMv: cur.location?.externalVoltageMv ?? null,
              batteryVoltageMv: cur.location?.batteryVoltageMv ?? null,
            },
          },
        };
      });
    });
    return () => {
      off();
    };
  }, []);

  // Cleanup all subscriptions on unmount.
  useEffect(() => {
    const subs = subscriptionsRef.current;
    return () => {
      subs.forEach((unsub) => unsub());
      subs.clear();
    };
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────
  const located = useMemo(() => {
    const list: { entry: FleetEntry; lat: number; lng: number }[] = [];
    Object.values(entries).forEach((e) => {
      const lat = toNumber(e.location?.latitude ?? null);
      const lng = toNumber(e.location?.longitude ?? null);
      if (lat !== null && lng !== null) list.push({ entry: e, lat, lng });
    });
    return list;
  }, [entries]);

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return located;
    return located.filter(({ entry }) => {
      const t = entry.terminal;
      return (
        t.deviceIdentifier.toLowerCase().includes(q) ||
        (t.imei || '').toLowerCase().includes(q) ||
        (t.vehicleVin || '').toLowerCase().includes(q) ||
        (t.nickname || '').toLowerCase().includes(q) ||
        (t.ownerUser?.email || '').toLowerCase().includes(q) ||
        (t.ownerUser?.fullName || '').toLowerCase().includes(q)
      );
    });
  }, [located, search]);

  // Auto-fit bounds when the located set first becomes non-empty. The
  // `fittedRef` flag is reset inside `load()` on manual refresh so the
  // operator gets a fresh frame, but live WS updates do NOT re-fit.
  useEffect(() => {
    if (fittedRef.current) return;
    if (!mapRef.current || located.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    located.forEach(({ lat, lng }) => bounds.extend({ lat, lng }));
    mapRef.current.fitBounds(bounds, 64);
    fittedRef.current = true;
  }, [located]);

  const handlePan = (lat: number, lng: number) => {
    if (!mapRef.current) return;
    mapRef.current.panTo({ lat, lng });
    if ((mapRef.current.getZoom() ?? 0) < 12) mapRef.current.setZoom(13);
  };

  // ── Render ──────────────────────────────────────────────────────────────
  if (loadError) {
    return <ApiKeyMissing reason="Failed to load Google Maps. Check the API key and billing." />;
  }
  if (!apiKey) {
    return <ApiKeyMissing reason="Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment to render the fleet map." />;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search fleet by device ID, IMEI, VIN, nickname, owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {located.length} on map · {Object.keys(entries).length} online
          </span>
          <button onClick={load} className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Map + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 h-[68vh] min-h-[480px]">
        <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
          {!isLoaded || loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER_STYLE}
              center={DEFAULT_CENTER}
              zoom={DEFAULT_ZOOM}
              options={{
                // mapId is REQUIRED for AdvancedMarkerElement to render in
                // its native (non-fallback) form. When unset, AdvancedMarker
                // still works but Google logs a one-time warning.
                mapId,
                disableDefaultUI: false,
                streetViewControl: false,
                fullscreenControl: true,
                mapTypeControl: true,
                clickableIcons: false,
              }}
              onLoad={(m) => {
                mapRef.current = m;
              }}
              onUnmount={() => {
                mapRef.current = null;
              }}
            >
              {/* AdvancedMarker replaces the deprecated google.maps.Marker
                  (warning issued by Google as of 2024-02-21). The component
                  is a thin imperative wrapper because @react-google-maps/api
                  v2 doesn't yet expose an <AdvancedMarkerF /> declaratively. */}
              {located.map(({ entry, lat, lng }) => (
                <AdvancedMarker
                  key={entry.terminal.id}
                  map={mapRef.current}
                  lat={lat}
                  lng={lng}
                  title={vehicleLabel({
                    vehicleYear: entry.terminal.vehicleYear,
                    vehicleMake: entry.terminal.vehicleMake,
                    vehicleModel: entry.terminal.vehicleModel,
                    vehicleVin: entry.terminal.vehicleVin,
                    nickname: entry.terminal.nickname,
                    deviceIdentifier: entry.terminal.deviceIdentifier,
                    imei: entry.terminal.imei,
                  })}
                  onClick={() => setSelectedId(entry.terminal.id)}
                />
              ))}
            </GoogleMap>
          )}
        </div>

        {/* Sidebar */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Online terminals</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredList.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-gray-400">
                {Object.keys(entries).length === 0 ? 'No online terminals' : 'No matches'}
              </div>
            ) : (
              filteredList.map(({ entry, lat, lng }) => (
                <button
                  key={entry.terminal.id}
                  onClick={() => {
                    setSelectedId(entry.terminal.id);
                    handlePan(lat, lng);
                  }}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all ${
                    selectedId === entry.terminal.id ? 'bg-blue-50 dark:bg-blue-500/10' : ''
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${statusDotClasses(entry.terminal.status)}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 dark:text-white truncate">
                      {vehicleLabel({
                        vehicleYear: entry.terminal.vehicleYear,
                        vehicleMake: entry.terminal.vehicleMake,
                        vehicleModel: entry.terminal.vehicleModel,
                        vehicleVin: entry.terminal.vehicleVin,
                        nickname: entry.terminal.nickname,
                        deviceIdentifier: entry.terminal.deviceIdentifier,
                        imei: entry.terminal.imei,
                      })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {entry.terminal.ownerUser?.email || 'Unpaired'}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {fmtKmh(entry.location?.speedKmh ?? null)} · {fmtRelative(entry.location?.reportedAt ?? null)}
                    </p>
                  </div>
                  <Locate size={14} className="text-gray-300 group-hover:text-blue-500 mt-1.5 flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ApiKeyMissing({ reason }: { reason: string }) {
  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-8 flex flex-col items-center text-center gap-3 animate-fade-in">
      <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
        <AlertCircle size={24} />
      </div>
      <div className="space-y-1 max-w-md">
        <p className="text-sm font-bold text-amber-900 dark:text-amber-200">Fleet map unavailable</p>
        <p className="text-xs text-amber-800 dark:text-amber-300">{reason}</p>
      </div>
      <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-2 flex items-center gap-1">
        <MapPin size={10} />
        Live admin data is still flowing — only the map view is gated by the API key.
      </p>
    </div>
  );
}

/**
 * Imperative wrapper around `google.maps.marker.AdvancedMarkerElement`.
 *
 * @react-google-maps/api v2.20.x doesn't expose a declarative
 * <AdvancedMarkerF /> yet — its `MarkerF` still wraps the deprecated
 * `google.maps.Marker` constructor (logged as deprecated by Google as of
 * 2024-02-21). Migration guide:
 *   https://developers.google.com/maps/documentation/javascript/advanced-markers/migration
 *
 * This component constructs the marker on mount, mutates `position` /
 * `title` on prop change, and removes itself on unmount. Click handler
 * is wired via `gmp-click` (the AdvancedMarkerElement custom event).
 */
function AdvancedMarker({
  map,
  lat,
  lng,
  title,
  onClick,
}: {
  map: google.maps.Map | null;
  lat: number;
  lng: number;
  title: string;
  onClick?: () => void;
}) {
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  // Keep `onClick` in a ref so we don't have to tear down + rebuild the
  // listener every time the parent re-renders with a new closure.
  const clickRef = useRef(onClick);
  useEffect(() => {
    clickRef.current = onClick;
  }, [onClick]);

  // Create / destroy the marker. We intentionally exclude `lat/lng/title`
  // from the deps array — those are mutated in the second effect so we
  // don't tear the marker down on every position update.
  useEffect(() => {
    if (!map) return;
    // The `marker` library is loaded via `useLoadScript({ libraries: ['marker'] })`.
    // If google.maps.marker isn't available, fall through silently — the
    // map still renders, just without our overlay.
    if (typeof google === 'undefined' || !google.maps?.marker?.AdvancedMarkerElement) {
      return;
    }
    const marker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: { lat, lng },
      title,
      gmpClickable: !!onClick,
    });
    const clickListener = marker.addListener('gmp-click', () => {
      clickRef.current?.();
    });
    markerRef.current = marker;
    return () => {
      clickListener.remove();
      // Detach the marker element from the map. Setting `map = null` is
      // the documented teardown step for AdvancedMarkerElement.
      marker.map = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Mutate position + title in place when they change. Cheaper than
  // tearing down and recreating the marker for every WS update.
  useEffect(() => {
    const m = markerRef.current;
    if (!m) return;
    m.position = { lat, lng };
  }, [lat, lng]);

  useEffect(() => {
    const m = markerRef.current;
    if (!m) return;
    m.title = title;
  }, [title]);

  return null;
}
