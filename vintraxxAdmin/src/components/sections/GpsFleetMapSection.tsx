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

import { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import { GoogleMap, InfoWindowF, useLoadScript, type Libraries } from '@react-google-maps/api';
// Side-effect import: filters one inherent Google Maps warning that fires
// when a `mapId` is present AND the user picks the Satellite/Hybrid map
// type. See the module header for the full rationale. Must be imported
// before useLoadScript runs so the patch is in place when the API loads.
import '@/lib/suppressMapsWarnings';
import { AdvancedMarkerWrapper } from '@/components/shared/AdvancedMarkerWrapper';
import { api, GpsTerminal, GpsLocation, GpsObdSnapshot } from '@/lib/api';
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
import TerminalInfoCard from '@/components/shared/TerminalInfoCard';

interface FleetEntry {
  terminal: GpsTerminal;
  location: GpsLocation | null;
  /**
   * Additional payload fetched from `getGpsTerminalLatest` so the
   * <TerminalInfoCard/> rendered in the InfoWindow has everything it
   * needs without a second request when the marker is clicked.
   */
  obd: GpsObdSnapshot | null;
  stockNumber: string | null;
  lastTripEndedAt: string | null;
}

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

// Default center: continental US so the map renders something sensible
// before the bounds-fit happens. Picked roughly Lawrence, KS.
const DEFAULT_CENTER = { lat: 39.0, lng: -97.0 };
const DEFAULT_ZOOM = 4;

// "marker" loads google.maps.marker.AdvancedMarkerElement. The Libraries
// type from @react-google-maps/api hasn't added "marker" yet, so we widen
// with `as any`. Array is pinned outside the component so the reference
// stays stable across renders (useLoadScript warns about identity changes).
const GMAPS_LIBRARIES = ['marker'] as any;

export default function GpsFleetMapSection() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
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
  // Strategy update (May 2026): we now render BOTH online AND offline
  // terminals on the map. Offline terminals use their last-known position
  // (red → gray marker) so the operator can answer "where did this
  // vehicle finally come to rest?" even though the device is asleep with
  // the ignition. Revoked / never-connected entries are skipped
  // server-side or filtered out below (they have no useful coordinates).
  const load = useCallback(async () => {
    setLoading(true);
    // Allow the next effect to re-fit bounds on this fresh data set.
    fittedRef.current = false;
    try {
      const tRes = await api.listGpsTerminals(1, 200);
      // Drop REVOKED rows entirely — they're an admin tombstone and
      // shouldn't appear on a live fleet view.
      const visible = tRes.terminals.filter((t) => t.status !== 'REVOKED');
      const settled = await Promise.allSettled(
        visible.map(async (t) => {
          const r = await api.getGpsTerminalLatest(t.id);
          return {
            terminal: t,
            location: r.location,
            obd: r.obd,
            stockNumber: r.stockNumber,
            lastTripEndedAt: r.lastTripEndedAt,
          } as FleetEntry;
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
            ...cur,
            // A live frame implies the terminal is up. Reflect that on the
            // local copy so the marker color flips green/red within the
            // same render rather than waiting for the next list refetch.
            terminal: { ...cur.terminal, status: 'ONLINE' as const },
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

  // Quick online/offline tally for the toolbar + sidebar header. Driven
  // off the located list so the numbers match what's actually rendered
  // on the map (terminals without a fix are silently dropped above).
  const onlineCount = useMemo(
    () => located.filter(({ entry }) => entry.terminal.status === 'ONLINE').length,
    [located],
  );
  const offlineCount = located.length - onlineCount;

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
            {located.length} on map · {onlineCount} online · {offlineCount} offline
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
                // mapId is REQUIRED for google.maps.marker.AdvancedMarkerElement
                // to render. Without it the API throws
                //   "The map is initialized without a valid Map ID, which will
                //    prevent use of Advanced Markers."
                // The trade-off is that Google fires an informational console
                // warning when the user picks the Satellite / Hybrid map type
                // because cloud-console map styles can't apply to satellite
                // imagery — that warning is suppressed in
                // src/lib/suppressMapsWarnings.ts which runs on app boot.
                mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined,
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
              {/* AdvancedMarkerElement — non-deprecated replacement for
                  google.maps.Marker. Marker color is driven by terminal.status
                  so an offline vehicle's last-known position renders gray and
                  visually distinguishes "parked / scanner asleep" from "live". */}
              {located.map(({ entry, lat, lng }) => {
                const isSelected = selectedId === entry.terminal.id;
                return (
                  <Fragment key={entry.terminal.id}>
                    <AdvancedMarkerWrapper
                      position={{ lat, lng }}
                      title={vehicleLabel({
                        vehicleYear: entry.terminal.vehicleYear,
                        vehicleMake: entry.terminal.vehicleMake,
                        vehicleModel: entry.terminal.vehicleModel,
                        vehicleVin: entry.terminal.vehicleVin,
                        nickname: entry.terminal.nickname,
                        deviceIdentifier: entry.terminal.deviceIdentifier,
                        imei: entry.terminal.imei,
                      })}
                      fillColor={getStatusColor(entry.terminal.status)}
                      onClick={() => setSelectedId(entry.terminal.id)}
                    />
                    {isSelected && (
                      <InfoWindowF
                        position={{ lat, lng }}
                        onCloseClick={() => setSelectedId(null)}
                        options={{
                          pixelOffset:
                            typeof google !== 'undefined' && google.maps
                              ? new google.maps.Size(0, -34)
                              : undefined,
                        }}
                      >
                        <TerminalInfoCard
                          terminal={entry.terminal}
                          location={entry.location}
                          obd={entry.obd}
                          stockNumber={entry.stockNumber}
                          lastTripEndedAt={entry.lastTripEndedAt}
                          compact
                          onClose={() => setSelectedId(null)}
                        />
                      </InfoWindowF>
                    )}
                  </Fragment>
                );
              })}
            </GoogleMap>
          )}
        </div>

        {/* Sidebar */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Fleet</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
              {onlineCount} online · {offlineCount} offline
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredList.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                {Object.keys(entries).length === 0 ? 'No terminals' : 'No matches'}
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
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
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

/** Return the pin fill color for a terminal status. */
function getStatusColor(status: GpsTerminal['status']): string {
  return status === 'ONLINE'
    ? '#16A34A' // green — online
    : status === 'OFFLINE'
      ? '#DC2626' // red — offline / sleeping
      : status === 'NEVER_CONNECTED'
        ? '#9CA3AF' // grey — never connected
        : status === 'SUSPENDED'
          ? '#8b5cf6' // violet
          : '#9CA3AF'; // grey fallback
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

