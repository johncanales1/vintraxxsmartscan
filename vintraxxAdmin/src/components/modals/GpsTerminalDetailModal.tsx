'use client';

/**
 * GpsTerminalDetailModal — full per-terminal admin view with tabs:
 * Overview · Track · OBD · Alarms · DTC · Trips · Commands.
 *
 * Subscribes to the per-terminal WebSocket channel so location updates
 * and alarm/DTC events refresh the relevant tab without polling.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  api,
  GpsTerminalDetail,
  GpsLocation,
  GpsObdSnapshot,
  GpsAlarm,
  GpsDtcEvent,
  GpsTrip,
  GpsCommand,
} from '@/lib/api';
import { gpsAdminWs } from '@/lib/gpsAdminWs';
import {
  fmtRelative,
  fmtKmh,
  fmtMiles,
  fmtVolts,
  fmtPct,
  vehicleLabel,
  terminalLabel,
  statusDotClasses,
  severityColor,
  alarmTypeLabel,
  toNumber,
} from '@/lib/gpsHelpers';
import {
  X, MapPin, Activity, AlertTriangle, Bell, Route, Send,
  Hash, Cpu, Calendar, RefreshCw, Smartphone, Car, Globe,
  CheckCircle, ExternalLink, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import BulkBar from '../shared/BulkBar';

interface Props {
  terminalId: string;
  onClose: () => void;
  onMutated?: () => void;
}

type Tab = 'overview' | 'track' | 'obd' | 'alarms' | 'dtcs' | 'trips' | 'commands';

export default function GpsTerminalDetailModal({ terminalId, onClose, onMutated }: Props) {
  const [terminal, setTerminal] = useState<GpsTerminalDetail | null>(null);
  const [latest, setLatest] = useState<GpsLocation | null>(null);
  // Most-recent OBD snapshot — separate from the GpsLocation `latest` so the
  // Overview pane can show OBD-derived speed + battery alongside the GPS-
  // derived ones (relevant for bench testing where GPS speed = 0 but the
  // OBD bus shows non-zero vehicle speed). Populated by the same `latest`
  // endpoint, refreshed on tab open.
  const [latestObd, setLatestObd] = useState<GpsObdSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');

  // Tab data caches — loaded lazily on tab open.
  const [locations, setLocations] = useState<GpsLocation[] | null>(null);
  const [obd, setObd] = useState<GpsObdSnapshot[] | null>(null);
  const [alarms, setAlarms] = useState<GpsAlarm[] | null>(null);
  const [dtcs, setDtcs] = useState<GpsDtcEvent[] | null>(null);
  const [trips, setTrips] = useState<GpsTrip[] | null>(null);
  const [commands, setCommands] = useState<GpsCommand[] | null>(null);

  const liveUnsubRef = useRef<(() => void) | null>(null);

  const loadTerminal = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, lRes] = await Promise.allSettled([
        api.getGpsTerminal(terminalId),
        api.getGpsTerminalLatest(terminalId),
      ]);
      if (tRes.status === 'fulfilled') setTerminal(tRes.value.terminal);
      else toast.error('Failed to load terminal');
      if (lRes.status === 'fulfilled') {
        setLatest(lRes.value.location);
        setLatestObd(lRes.value.obd);
      }
    } finally {
      setLoading(false);
    }
  }, [terminalId]);

  useEffect(() => {
    loadTerminal();
  }, [loadTerminal]);

  // Subscribe to per-terminal channel + admin firehose listeners filtered
  // to this terminal id. Refcounted subscribe/unsubscribe is handled by
  // gpsAdminWs.
  useEffect(() => {
    const unsubChannel = gpsAdminWs.subscribeTerminal(terminalId);
    const offLoc = gpsAdminWs.on('location.update', (e) => {
      if (e.terminalId !== terminalId) return;
      // Wire payload is `e.data`, not `e.location` — see gpsAdminWs.ts.
      const d = e.data;
      setLatest((prev) => ({
        // Preserve any field the WS frame doesn't include (e.g.
        // serverReceivedAt) by spreading the previous value first.
        ...(prev ?? ({} as GpsLocation)),
        id: prev?.id ?? `live:${d.reportedAt}`,
        terminalId: e.terminalId,
        reportedAt: d.reportedAt,
        latitude: d.latitude,
        longitude: d.longitude,
        speedKmh: d.speedKmh,
        heading: d.heading,
        altitudeM: d.altitudeM,
        accOn: d.accOn,
        gpsFix: d.gpsFix,
        alarmBits: d.alarmBits ?? prev?.alarmBits ?? 0,
        statusBits: d.statusBits ?? prev?.statusBits ?? 0,
        satelliteCount: prev?.satelliteCount ?? null,
        signalStrength: prev?.signalStrength ?? null,
        odometerKm: prev?.odometerKm ?? null,
        fuelLevelPct: prev?.fuelLevelPct ?? null,
        externalVoltageMv: prev?.externalVoltageMv ?? null,
        batteryVoltageMv: prev?.batteryVoltageMv ?? null,
      }));
      // Prepend to the track-tab buffer if it's been hydrated. We reuse the
      // previous head's metadata (e.g. signalStrength) because the WS frame
      // is intentionally minimal.
      setLocations((prev) =>
        prev
          ? [
              {
                ...((prev[0] ?? null) as any),
                ...d,
                terminalId,
                id: `live:${d.reportedAt}`,
              },
              ...prev,
            ].slice(0, 200)
          : prev,
      );
    });
    const offState = gpsAdminWs.on('terminal.online', (e) => {
      if (e.terminalId === terminalId) loadTerminal();
    });
    const offState2 = gpsAdminWs.on('terminal.offline', (e) => {
      if (e.terminalId === terminalId) loadTerminal();
    });
    const offAlarm = gpsAdminWs.on('alarm.opened', (e) => {
      // Only reload the list when the Alarms tab is visible — otherwise
      // we let the next tab-open re-hydrate from scratch. Previously there
      // was a dead `setAlarms((p) => (p ? p : p))` statement here that did
      // nothing; removed.
      if (e.terminalId === terminalId && tab === 'alarms') {
        reloadAlarms();
      }
    });
    const offDtc = gpsAdminWs.on('dtc.detected', (e) => {
      if (e.terminalId === terminalId && tab === 'dtcs') reloadDtcs();
    });
    liveUnsubRef.current = () => {
      unsubChannel();
      offLoc();
      offState();
      offState2();
      offAlarm();
      offDtc();
    };
    return () => {
      liveUnsubRef.current?.();
      liveUnsubRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminalId]);

  // ── Lazy-loaders per tab ────────────────────────────────────────────────
  const reloadLocations = async () => {
    try {
      const res = await api.getGpsLocations(terminalId, { limit: 100 });
      setLocations(res.locations);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load locations');
    }
  };
  const reloadObd = async () => {
    try {
      const res = await api.getGpsObdSnapshots(terminalId, { limit: 100 });
      setObd(res.snapshots);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load OBD snapshots');
    }
  };
  const reloadAlarms = async () => {
    try {
      const res = await api.listGpsAlarms(1, 100, { terminalId });
      setAlarms(res.alarms);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load alarms');
    }
  };
  const reloadDtcs = async () => {
    try {
      const res = await api.listGpsDtcEvents(1, 100, { terminalId });
      setDtcs(res.events);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load DTC events');
    }
  };
  const reloadTrips = async () => {
    try {
      const res = await api.listGpsTrips(1, 100, { terminalId });
      setTrips(res.trips);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load trips');
    }
  };
  const reloadCommands = async () => {
    try {
      const res = await api.listGpsCommands(1, 100, { terminalId });
      setCommands(res.commands);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load commands');
    }
  };

  useEffect(() => {
    if (tab === 'track' && !locations) reloadLocations();
    if (tab === 'obd' && !obd) reloadObd();
    if (tab === 'alarms' && !alarms) reloadAlarms();
    if (tab === 'dtcs' && !dtcs) reloadDtcs();
    if (tab === 'trips' && !trips) reloadTrips();
    if (tab === 'commands' && !commands) reloadCommands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleAck = async (alarmId: string) => {
    try {
      await api.acknowledgeGpsAlarm(alarmId);
      toast.success('Alarm acknowledged');
      reloadAlarms();
      onMutated?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to acknowledge');
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Activity size={14} /> },
    { id: 'track', label: 'Track', icon: <MapPin size={14} /> },
    { id: 'obd', label: 'OBD', icon: <Cpu size={14} /> },
    { id: 'alarms', label: 'Alarms', icon: <Bell size={14} /> },
    { id: 'dtcs', label: 'DTC', icon: <AlertTriangle size={14} /> },
    { id: 'trips', label: 'Trips', icon: <Route size={14} /> },
    { id: 'commands', label: 'Commands', icon: <Send size={14} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl animate-scale-in max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 relative">
                <Smartphone size={20} />
                {terminal && (
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${statusDotClasses(terminal.status)}`} />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {terminal
                    ? vehicleLabel({
                        vehicleYear: terminal.vehicleYear,
                        vehicleMake: terminal.vehicleMake,
                        vehicleModel: terminal.vehicleModel,
                        vehicleVin: terminal.vehicleVin,
                        nickname: terminal.nickname,
                        deviceIdentifier: terminal.deviceIdentifier,
                        imei: terminal.imei,
                      })
                    : 'Loading…'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">{terminal ? terminalLabel(terminal) : ''}</p>
                {terminal && (
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-0.5">
                    {terminal.status.replace(/_/g, ' ')} · {terminal.ownerUser?.email || 'Unpaired'}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={loadTerminal} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-all" title="Refresh">
                <RefreshCw size={16} />
              </button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 overflow-x-auto pb-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  tab === t.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading || !terminal ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tab === 'overview' ? (
            <OverviewPane terminal={terminal} latest={latest} latestObd={latestObd} />
          ) : tab === 'track' ? (
            <TrackPane locations={locations} onReload={reloadLocations} onMutated={onMutated} />
          ) : tab === 'obd' ? (
            <ObdPane snapshots={obd} onReload={reloadObd} onMutated={onMutated} />
          ) : tab === 'alarms' ? (
            <AlarmsPane
              alarms={alarms}
              onAck={handleAck}
              onReload={reloadAlarms}
              onMutated={onMutated}
            />
          ) : tab === 'dtcs' ? (
            <DtcsPane events={dtcs} onReload={reloadDtcs} onMutated={onMutated} />
          ) : tab === 'trips' ? (
            <TripsPane trips={trips} onReload={reloadTrips} onMutated={onMutated} />
          ) : tab === 'commands' ? (
            <CommandsPane commands={commands} onReload={reloadCommands} onMutated={onMutated} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Panes ──────────────────────────────────────────────────────────────────

function OverviewPane({
  terminal,
  latest,
  latestObd,
}: {
  terminal: GpsTerminalDetail;
  latest: GpsLocation | null;
  latestObd: GpsObdSnapshot | null;
}) {
  // Battery comes from the OBD snapshot in practice — the gateway never
  // populates GpsLocation.batteryVoltageMv (no JT/T 808 TLV maps to it).
  // Prefer OBD; fall back to whatever GpsLocation has just in case.
  const batteryMv =
    latest?.batteryVoltageMv ?? latestObd?.batteryVoltageMv ?? null;
  return (
    <div className="space-y-6">
      {/* Quick stats — speed shown twice on purpose: GPS-derived (from
          the location report) vs OBD-bus-derived (from the live OBD
          pass-through). Bench-test kits drive the OBD speed but the
          device itself isn't moving, so the two diverge legitimately. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat icon={<Activity size={14} />} label="Status" value={terminal.status.replace(/_/g, ' ')} />
        <Stat icon={<Calendar size={14} />} label="Last heartbeat" value={fmtRelative(terminal.lastHeartbeatAt)} />
        <Stat icon={<MapPin size={14} />} label="Last fix" value={latest ? fmtRelative(latest.reportedAt) : '—'} />
        <Stat icon={<Zap size={14} />} label="GPS speed" value={latest ? fmtKmh(latest.speedKmh) : '—'} />
        <Stat icon={<Zap size={14} />} label="OBD speed" value={latestObd ? fmtKmh(latestObd.vehicleSpeedKmh) : '—'} />
      </div>

      {/* Latest location */}
      {latest ? (
        <Section title="Latest Location" icon={<MapPin size={14} />}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Latitude" value={String(latest.latitude)} mono />
            <Stat label="Longitude" value={String(latest.longitude)} mono />
            <Stat label="Heading" value={latest.heading != null ? `${latest.heading}°` : '—'} />
            <Stat label="Altitude" value={latest.altitudeM != null ? `${latest.altitudeM} m` : '—'} />
            <Stat label="Satellites" value={latest.satelliteCount != null ? String(latest.satelliteCount) : '—'} />
            <Stat label="GPS fix" value={latest.gpsFix ? 'Yes' : 'No'} />
            <Stat label="Ignition" value={latest.accOn ? 'On' : 'Off'} />
            <Stat label="Battery" value={fmtVolts(batteryMv)} />
          </div>
          {(toNumber(latest.latitude) !== null && toNumber(latest.longitude) !== null) && (
            <a
              href={`https://www.google.com/maps?q=${latest.latitude},${latest.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink size={14} />
              Open in Google Maps
            </a>
          )}
        </Section>
      ) : (
        <Section title="Latest Location" icon={<MapPin size={14} />}>
          <p className="text-sm text-gray-500 dark:text-gray-400">No location reports yet.</p>
        </Section>
      )}

      {/* Identity */}
      <Section title="Identification" icon={<Hash size={14} />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Stat label="Device Identifier" value={terminal.deviceIdentifier} mono />
          <Stat label="IMEI" value={terminal.imei || '—'} mono />
          <Stat label="Phone" value={terminal.phoneNumber || '—'} mono />
          <Stat label="ICCID" value={terminal.iccid || '—'} mono />
          <Stat label="Manufacturer" value={terminal.manufacturerId || '—'} />
          <Stat label="Model" value={terminal.terminalModel || '—'} />
          <Stat label="Firmware" value={terminal.firmwareVersion || '—'} />
          <Stat label="Hardware" value={terminal.hardwareVersion || '—'} />
          <Stat label="Created" value={new Date(terminal.createdAt).toLocaleDateString()} />
        </div>
      </Section>

      {/* Vehicle */}
      <Section title="Vehicle" icon={<Car size={14} />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Stat label="VIN" value={terminal.vehicleVin || '—'} mono />
          <Stat label="Plate" value={terminal.plateNumber || '—'} />
          <Stat label="Year" value={terminal.vehicleYear ? String(terminal.vehicleYear) : '—'} />
          <Stat label="Make" value={terminal.vehicleMake || '—'} />
          <Stat label="Model" value={terminal.vehicleModel || '—'} />
          <Stat label="Nickname" value={terminal.nickname || '—'} />
        </div>
      </Section>

      {/* Owner */}
      <Section title="Owner" icon={<Globe size={14} />}>
        {terminal.ownerUser ? (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {terminal.ownerUser.fullName || terminal.ownerUser.email}
              </p>
              {terminal.ownerUser.fullName && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{terminal.ownerUser.email}</p>
              )}
            </div>
            {terminal.ownerUser.isDealer && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                DEALER
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-amber-600 dark:text-amber-400">Unpaired — assign an owner from the section list.</p>
        )}
      </Section>

      {/* Counts */}
      {terminal._count && (
        <Section title="Activity" icon={<Activity size={14} />}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Locations" value={terminal._count.locations.toLocaleString()} />
            <Stat label="Alarms" value={terminal._count.alarms.toLocaleString()} />
            <Stat label="DTC events" value={terminal._count.dtcEvents.toLocaleString()} />
            <Stat label="Trips" value={terminal._count.trips.toLocaleString()} />
          </div>
        </Section>
      )}
    </div>
  );
}

function TrackPane({
  locations,
  onReload,
  onMutated,
}: {
  locations: GpsLocation[] | null;
  onReload: () => void;
  onMutated?: () => void;
}) {
  const { selectedIds, toggle, setAll, clear } = useBulkSelect();
  // Live-WS rows have ids prefixed with `live:` and aren't in the DB yet —
  // exclude them from selection so a bulk-delete can't try to remove a
  // synthetic id (the backend would silently drop it but the count would
  // mislead the user). Real DB rows have UUIDs.
  const isPersistedId = (id: string) => !id.startsWith('live:');

  if (locations === null) return <Loading />;
  if (locations.length === 0) return <Empty icon={<MapPin />} text="No location reports" onReload={onReload} />;

  const selectableIds = locations.map((l) => l.id).filter(isPersistedId);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));

  const handleToggleAll = () => {
    if (allSelected) clear();
    else setAll(selectableIds);
  };

  const handleConfirmDelete = async () => {
    const ids = Array.from(selectedIds).filter(isPersistedId);
    try {
      const res = await api.bulkDeleteGpsLocations(ids);
      toast.success(`Deleted ${res.deleted} location${res.deleted === 1 ? '' : 's'}`);
      clear();
      onReload();
      onMutated?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete locations');
    }
  };

  return (
    <div className="space-y-3">
      <BulkBar
        total={locations.length}
        selected={selectedIds.size}
        allSelected={allSelected}
        resourceLabel="locations"
        onToggleAll={handleToggleAll}
        onReload={onReload}
        onConfirmDelete={handleConfirmDelete}
      />
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400 tracking-wider">
            <tr>
              <th className="px-3 py-2 w-8" />
              <th className="px-4 py-2 text-left">Time</th>
              <th className="px-4 py-2 text-left">Lat / Lng</th>
              <th className="px-4 py-2 text-left">Speed</th>
              <th className="px-4 py-2 text-left">Heading</th>
              <th className="px-4 py-2 text-left">Ign</th>
              <th className="px-4 py-2 text-left">Sats</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {locations.map((l) => {
              const persisted = isPersistedId(l.id);
              return (
                <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(l.id)}
                      disabled={!persisted}
                      onChange={() => toggle(l.id)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 disabled:opacity-30"
                    />
                  </td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmtRelative(l.reportedAt)}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-900 dark:text-gray-100">
                    <a
                      href={`https://www.google.com/maps?q=${l.latitude},${l.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-500 hover:underline"
                    >
                      {Number(l.latitude).toFixed(5)}, {Number(l.longitude).toFixed(5)}
                    </a>
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{fmtKmh(l.speedKmh)}</td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{l.heading != null ? `${l.heading}°` : '—'}</td>
                  <td className="px-4 py-2">{l.accOn ? 'On' : 'Off'}</td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{l.satelliteCount ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ObdPane({
  snapshots,
  onReload,
  onMutated,
}: {
  snapshots: GpsObdSnapshot[] | null;
  onReload: () => void;
  onMutated?: () => void;
}) {
  const { selectedIds, toggle, setAll, clear } = useBulkSelect();

  if (snapshots === null) return <Loading />;
  if (snapshots.length === 0) return <Empty icon={<Cpu />} text="No OBD snapshots" onReload={onReload} />;

  const allIds = snapshots.map((s) => s.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

  const handleToggleAll = () => {
    if (allSelected) clear();
    else setAll(allIds);
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await api.bulkDeleteGpsObd(Array.from(selectedIds));
      toast.success(`Deleted ${res.deleted} OBD snapshot${res.deleted === 1 ? '' : 's'}`);
      clear();
      onReload();
      onMutated?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete OBD snapshots');
    }
  };

  return (
    <div className="space-y-3">
      <BulkBar
        total={snapshots.length}
        selected={selectedIds.size}
        allSelected={allSelected}
        resourceLabel="OBD snapshots"
        onToggleAll={handleToggleAll}
        onReload={onReload}
        onConfirmDelete={handleConfirmDelete}
      />
      <div className="space-y-2">
        {snapshots.map((s) => (
          <div
            key={s.id}
            className={`flex gap-3 px-4 py-3 rounded-xl border transition-all ${
              selectedIds.has(s.id)
                ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/40'
                : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedIds.has(s.id)}
              onChange={() => toggle(s.id)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                <p className="text-xs text-gray-500 dark:text-gray-400">{fmtRelative(s.reportedAt)}</p>
                <div className="flex items-center gap-2">
                  {s.milOn === true && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300">
                      MIL ON
                    </span>
                  )}
                  {s.vin && (
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300">
                      {s.vin}
                    </span>
                  )}
                </div>
              </div>
              {/* Real Prisma columns only — DTC info lives on GpsDtcEvent (DTC tab). */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <ObdField label="RPM" value={s.rpm != null ? s.rpm.toLocaleString() : '—'} />
                <ObdField label="Vehicle speed" value={fmtKmh(s.vehicleSpeedKmh)} />
                <ObdField label="Coolant" value={s.coolantTempC != null ? `${s.coolantTempC}°C` : '—'} />
                <ObdField label="Intake air" value={s.intakeAirTempC != null ? `${s.intakeAirTempC}°C` : '—'} />
                <ObdField label="Throttle" value={fmtPct(s.throttlePct)} />
                <ObdField label="Engine load" value={fmtPct(s.engineLoadPct)} />
                <ObdField label="Engine power" value={s.enginePowerKw != null ? `${Number(s.enginePowerKw).toFixed(1)} kW` : '—'} />
                <ObdField label="Battery" value={fmtVolts(s.batteryVoltageMv)} />
                <ObdField label="Fuel rate" value={s.fuelRateLph != null ? `${Number(s.fuelRateLph).toFixed(2)} L/h` : '—'} />
                <ObdField label="Fuel pressure" value={s.fuelPressureKpa != null ? `${s.fuelPressureKpa} kPa` : '—'} />
                <ObdField label="MAF" value={s.mafGps != null ? `${Number(s.mafGps).toFixed(2)} g/s` : '—'} />
                <ObdField label="O₂ sensor" value={s.o2Voltage != null ? `${Number(s.o2Voltage).toFixed(3)} V` : '—'} />
                <ObdField label="Odometer" value={s.odometerKm != null ? `${Number(s.odometerKm).toFixed(1)} km` : '—'} />
                <ObdField label="MIL distance" value={s.milDistanceKm != null ? `${Number(s.milDistanceKm).toFixed(1)} km` : '—'} />
              </div>
              {s.extraPidsJson && Object.keys(s.extraPidsJson).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                  {Object.keys(s.extraPidsJson).map((k) => (
                    <span key={k} className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-600/50 text-gray-600 dark:text-gray-300 font-mono">
                      {k}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlarmsPane({
  alarms,
  onAck,
  onReload,
  onMutated,
}: {
  alarms: GpsAlarm[] | null;
  onAck: (id: string) => void;
  onReload: () => void;
  onMutated?: () => void;
}) {
  const { selectedIds, toggle, setAll, clear } = useBulkSelect();

  if (alarms === null) return <Loading />;
  if (alarms.length === 0) return <Empty icon={<Bell />} text="No alarms" onReload={onReload} />;

  const allIds = alarms.map((a) => a.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

  const handleToggleAll = () => {
    if (allSelected) clear();
    else setAll(allIds);
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await api.bulkDeleteGpsAlarms(Array.from(selectedIds));
      toast.success(`Deleted ${res.deleted} alarm${res.deleted === 1 ? '' : 's'}`);
      clear();
      onReload();
      onMutated?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete alarms');
    }
  };

  return (
    <div className="space-y-3">
      <BulkBar
        total={alarms.length}
        selected={selectedIds.size}
        allSelected={allSelected}
        resourceLabel="alarms"
        onToggleAll={handleToggleAll}
        onReload={onReload}
        onConfirmDelete={handleConfirmDelete}
      />
      <div className="space-y-2">
        {alarms.map((a) => {
          const sev = severityColor(a.severity);
          return (
            <div
              key={a.id}
              className={`flex gap-3 px-4 py-3 rounded-xl border transition-all ${
                selectedIds.has(a.id)
                  ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/40'
                  : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(a.id)}
                onChange={() => toggle(a.id)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 flex-shrink-0"
              />
              <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${sev.bg} ${sev.text}`}>{a.severity}</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{alarmTypeLabel(a.alarmType)}</p>
                    {a.acknowledged && <CheckCircle size={14} className="text-emerald-500" />}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Opened {fmtRelative(a.openedAt)}
                    {a.closedAt && ` · Closed ${fmtRelative(a.closedAt)}`}
                  </p>
                  {a.ackNote && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 italic">"{a.ackNote}"</p>
                  )}
                </div>
                {!a.acknowledged && (
                  <button
                    onClick={() => onAck(a.id)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-all"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DtcsPane({
  events,
  onReload,
  onMutated,
}: {
  events: GpsDtcEvent[] | null;
  onReload: () => void;
  onMutated?: () => void;
}) {
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const { selectedIds, toggle, setAll, clear } = useBulkSelect();

  if (events === null) return <Loading />;
  if (events.length === 0) return <Empty icon={<AlertTriangle />} text="No DTC events" onReload={onReload} />;

  const allIds = events.map((e) => e.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

  const handleToggleAll = () => {
    if (allSelected) clear();
    else setAll(allIds);
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await api.bulkDeleteGpsDtcEvents(Array.from(selectedIds));
      toast.success(`Deleted ${res.deleted} DTC event${res.deleted === 1 ? '' : 's'}`);
      clear();
      onReload();
      onMutated?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete DTC events');
    }
  };

  const handleAnalyze = async (id: string) => {
    setAnalyzingId(id);
    try {
      const res = await api.analyzeGpsDtcEvent(id);
      toast.success(res.reused ? 'Existing scan reused' : 'AI analysis started');
      onReload();
      onMutated?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to analyze');
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <BulkBar
        total={events.length}
        selected={selectedIds.size}
        allSelected={allSelected}
        resourceLabel="DTC events"
        onToggleAll={handleToggleAll}
        onReload={onReload}
        onConfirmDelete={handleConfirmDelete}
      />
      <div className="space-y-2">
        {events.map((e) => (
          <div
            key={e.id}
            className={`flex gap-3 px-4 py-3 rounded-xl border transition-all ${
              selectedIds.has(e.id)
                ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/40'
                : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedIds.has(e.id)}
              onChange={() => toggle(e.id)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 flex-shrink-0"
            />
            <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-mono text-gray-900 dark:text-white">{e.vin}</p>
                  {e.milOn && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300">
                      MIL ON
                    </span>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400">DTCs: {e.dtcCount}</span>
                  {e.scanId && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                      SCAN
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{fmtRelative(e.reportedAt)}</p>
                {e.storedDtcCodes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                    {e.storedDtcCodes.map((c) => (
                      <span key={c} className="px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-mono">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleAnalyze(e.id)}
                disabled={analyzingId === e.id}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                {analyzingId === e.id ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Zap size={12} />
                )}
                {e.scanId ? 'Re-analyze' : 'Analyze with AI'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TripsPane({
  trips,
  onReload,
  onMutated,
}: {
  trips: GpsTrip[] | null;
  onReload: () => void;
  onMutated?: () => void;
}) {
  const { selectedIds, toggle, setAll, clear } = useBulkSelect();

  if (trips === null) return <Loading />;
  if (trips.length === 0) return <Empty icon={<Route />} text="No trips" onReload={onReload} />;

  const allIds = trips.map((t) => t.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

  const handleToggleAll = () => {
    if (allSelected) clear();
    else setAll(allIds);
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await api.bulkDeleteGpsTrips(Array.from(selectedIds));
      toast.success(`Deleted ${res.deleted} trip${res.deleted === 1 ? '' : 's'}`);
      clear();
      onReload();
      onMutated?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete trips');
    }
  };

  return (
    <div className="space-y-3">
      <BulkBar
        total={trips.length}
        selected={selectedIds.size}
        allSelected={allSelected}
        resourceLabel="trips"
        onToggleAll={handleToggleAll}
        onReload={onReload}
        onConfirmDelete={handleConfirmDelete}
      />
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400 tracking-wider">
            <tr>
              <th className="px-3 py-2 w-8" />
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Start</th>
              <th className="px-4 py-2 text-left">End</th>
              <th className="px-4 py-2 text-left">Distance</th>
              <th className="px-4 py-2 text-left">Drive / Idle</th>
              <th className="px-4 py-2 text-left">Avg / Max</th>
              <th className="px-4 py-2 text-left">Harsh</th>
              <th className="px-4 py-2 text-left">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {trips.map((t) => {
              // GpsTrip stores `durationSec` (total) and `idleDurationSec`.
              // Drive time = total − idle, clamped at 0 in case of bad data.
              const totalSec = Number(t.durationSec ?? 0);
              const idleSec = Number(t.idleDurationSec ?? 0);
              const driveSec = Math.max(0, totalSec - idleSec);
              const harshTotal =
                (t.harshAccelCount ?? 0) +
                (t.harshBrakeCount ?? 0) +
                (t.harshTurnCount ?? 0) +
                (t.overspeedCount ?? 0);
              return (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(t.id)}
                      onChange={() => toggle(t.id)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      t.status === 'OPEN'
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmtRelative(t.startAt)}</td>
                  <td className="px-4 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">{t.endAt ? fmtRelative(t.endAt) : '—'}</td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{t.distanceKm != null ? fmtMiles(t.distanceKm, 1) : '—'}</td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-200 text-xs whitespace-nowrap">
                    {Math.round(driveSec / 60)}m / {Math.round(idleSec / 60)}m
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-200 text-xs whitespace-nowrap">
                    {fmtKmh(t.avgSpeedKmh)} / {fmtKmh(t.maxSpeedKmh)}
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{harshTotal}</td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{t.score ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CommandsPane({
  commands,
  onReload,
  onMutated,
}: {
  commands: GpsCommand[] | null;
  onReload: () => void;
  onMutated?: () => void;
}) {
  const { selectedIds, toggle, setAll, clear } = useBulkSelect();

  if (commands === null) return <Loading />;
  if (commands.length === 0) return <Empty icon={<Send />} text="No commands sent" onReload={onReload} />;

  const allIds = commands.map((c) => c.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

  const handleToggleAll = () => {
    if (allSelected) clear();
    else setAll(allIds);
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await api.bulkDeleteGpsCommands(Array.from(selectedIds));
      toast.success(`Deleted ${res.deleted} command${res.deleted === 1 ? '' : 's'}`);
      clear();
      onReload();
      onMutated?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete commands');
    }
  };

  return (
    <div className="space-y-3">
      <BulkBar
        total={commands.length}
        selected={selectedIds.size}
        allSelected={allSelected}
        resourceLabel="commands"
        onToggleAll={handleToggleAll}
        onReload={onReload}
        onConfirmDelete={handleConfirmDelete}
      />
      <div className="space-y-2">
        {commands.map((c) => (
          <div
            key={c.id}
            className={`flex gap-3 px-4 py-3 rounded-xl border transition-all ${
              selectedIds.has(c.id)
                ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/40'
                : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedIds.has(c.id)}
              onChange={() => toggle(c.id)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.kind}</p>
                  <CommandStatusPill status={c.status} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmtRelative(c.createdAt)}</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">By {c.admin?.email || 'system'}</p>
              {c.errorText && (
                <p className="text-xs text-red-500 mt-1">{c.errorText}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommandStatusPill({ status }: { status: GpsCommand['status'] }) {
  const cls =
    status === 'ACKED'
      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
      : status === 'FAILED'
        ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
        : status === 'SENT'
          ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
          : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300';
  return <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${cls}`}>{status}</span>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  mono,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
      <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className={`text-sm font-medium text-gray-900 dark:text-white truncate mt-0.5 ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </p>
    </div>
  );
}

function ObdField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
      <p className={`text-gray-900 dark:text-white truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Empty({ icon, text, onReload }: { icon: React.ReactNode; text: string; onReload: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="mx-auto w-12 h-12 text-gray-300 dark:text-gray-600 mb-4 flex items-center justify-center">
        {icon}
      </div>
      <p className="text-gray-500 dark:text-gray-400">{text}</p>
      <button onClick={onReload} className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
        <RefreshCw size={14} />
        Refresh
      </button>
    </div>
  );
}

// ─── Bulk-select primitives (shared by every pane) ───────────────────────────

/**
 * Lightweight selection state. Each pane owns its own instance — selection
 * does NOT persist across tab switches (we wipe the cache on reload anyway).
 */
function useBulkSelect() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  return { selectedIds, toggle, setAll, clear };
}

// `BulkBar` is imported from `../shared/BulkBar` — same widget powers
// every list pane in this modal AND every GPS Telemetry section.
