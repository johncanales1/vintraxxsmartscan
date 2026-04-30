'use client';

/**
 * GpsAlarmsSection — admin alarm console.
 *
 * Filter by severity / type / status, search by terminal, bulk
 * acknowledge selected alarms, drill into per-alarm details. Live
 * updates from `alarm.opened` / `alarm.closed` / `alarm.ack` events.
 */

import { useState, useEffect, useCallback } from 'react';
import { api, GpsAlarm, GpsAlarmSeverity, GpsAlarmStatus, GpsAlarmType } from '@/lib/api';
import { gpsAdminWs } from '@/lib/gpsAdminWs';
import { fmtRelative, vehicleLabel, severityColor, alarmTypeLabel } from '@/lib/gpsHelpers';
import GpsAlarmDetailModal from '@/components/modals/GpsAlarmDetailModal';
import {
  Search, RefreshCw, CheckCircle, Bell, AlertTriangle, ChevronLeft, ChevronRight, Filter,
} from 'lucide-react';
import { toast } from 'sonner';

const SEVERITIES: GpsAlarmSeverity[] = ['INFO', 'WARNING', 'CRITICAL'];
const STATUSES: GpsAlarmStatus[] = ['OPEN', 'ACKNOWLEDGED', 'CLOSED'];

// Surface the alarm types most commonly seen in the field. The full
// enum lives in api.ts (`GpsAlarmType`) — adding more values here is
// non-breaking, the backend accepts any string and the service casts it.
const TYPES: GpsAlarmType[] = [
  'SOS', 'COLLISION', 'OVERSPEED', 'IDLING',
  'GEOFENCE_IN', 'GEOFENCE_OUT',
  'HARSH_BRAKE', 'HARSH_ACCEL', 'HARSH_TURN',
  'POWER_LOSS', 'POWER_LOW',
  'IGNITION_ON', 'IGNITION_OFF',
  'TAMPER', 'GPS_BLOCKED', 'OTHER',
];

/**
 * Map UI tri-state status to the backend's (state + ack) tuple.
 *   OPEN          → not closed, not acknowledged (active alarm)
 *   ACKNOWLEDGED  → not closed, acknowledged (open but seen)
 *   CLOSED        → closed (regardless of ack)
 */
function statusToFilters(s: GpsAlarmStatus | undefined): {
  state?: 'open' | 'closed';
  ack?: boolean;
} {
  if (!s) return {};
  if (s === 'OPEN') return { state: 'open', ack: false };
  if (s === 'ACKNOWLEDGED') return { state: 'open', ack: true };
  return { state: 'closed' };
}

interface Props {
  /** Drill-in from UserDetail / Dashboard owner cards. */
  initialOwnerUserId?: string;
  onClearInitialOwner?: () => void;
  /**
   * Drill-in from a per-terminal "View alarms" link. Ignored if
   * `initialOwnerUserId` is also set (the union would be both, but the
   * UI only surfaces one chip at a time to keep the toolbar simple).
   */
  initialTerminalId?: string;
  onClearInitialTerminal?: () => void;
}

export default function GpsAlarmsSection({
  initialOwnerUserId,
  onClearInitialOwner,
  initialTerminalId,
  onClearInitialTerminal,
}: Props) {
  const [alarms, setAlarms] = useState<GpsAlarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState<GpsAlarmSeverity | undefined>();
  const [status, setStatus] = useState<GpsAlarmStatus | undefined>('OPEN');
  const [alarmType, setAlarmType] = useState<GpsAlarmType | undefined>();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [bulkAcking, setBulkAcking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listGpsAlarms(page, 30, {
        severity,
        ...statusToFilters(status),
        alarmType,
        ownerUserId: initialOwnerUserId,
        terminalId: initialTerminalId,
        search: search.trim() || undefined,
      });
      setAlarms(res.alarms);
      setTotalPages(res.totalPages);
      setTotal(res.total);
      // Drop selections that are no longer visible — keeps the bulk
      // ack count honest and avoids "ghost" selected ids.
      setSelectedIds((prev) => {
        const next = new Set<string>();
        const visible = new Set(res.alarms.map((a) => a.id));
        prev.forEach((id) => {
          if (visible.has(id)) next.add(id);
        });
        return next;
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to load alarms');
    } finally {
      setLoading(false);
    }
  }, [page, severity, status, alarmType, initialOwnerUserId, initialTerminalId, search]);

  useEffect(() => {
    load();
  }, [load]);

  // Live refresh on relevant alarm events. Throttle bursts of opens.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const queue = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        load();
      }, 1500);
    };
    const offs = [
      gpsAdminWs.on('alarm.opened', queue),
      gpsAdminWs.on('alarm.closed', queue),
      gpsAdminWs.on('alarm.acknowledged', queue),
    ];
    return () => {
      offs.forEach((o) => o());
      if (timer) clearTimeout(timer);
    };
  }, [load]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      // If everything currently visible is already selected, clear.
      // Otherwise select everything visible.
      const visibleIds = alarms.filter((a) => !a.acknowledged).map((a) => a.id);
      const allSelected = visibleIds.length > 0 && visibleIds.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(visibleIds);
    });
  };

  const handleBulkAck = async () => {
    if (selectedIds.size === 0) return;
    setBulkAcking(true);
    try {
      const ids: string[] = [];
      selectedIds.forEach((id) => ids.push(id));
      const res = await api.bulkAcknowledgeGpsAlarms(ids);
      // Backend returns { count, acknowledged: string[], skipped: string[] }.
      // We use `count` for the user-facing toast — `acknowledged` is the
      // array of ids actually mutated, useful for debugging but not display.
      toast.success(`Acknowledged ${res.count} alarm${res.count === 1 ? '' : 's'}`);
      setSelectedIds(new Set());
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to acknowledge');
    } finally {
      setBulkAcking(false);
    }
  };

  const unackVisibleCount = alarms.filter((a) => !a.acknowledged).length;
  const selectedCount = selectedIds.size;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by IMEI, VIN, owner..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500 dark:text-gray-400">{total.toLocaleString()} total</span>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
              filtersOpen
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Filter size={14} />
            Filters
          </button>
          <button onClick={load} className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            <RefreshCw size={18} />
          </button>
          {selectedCount > 0 && (
            <button
              onClick={handleBulkAck}
              disabled={bulkAcking}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium transition-all shadow-sm"
            >
              {bulkAcking ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
              Acknowledge {selectedCount}
            </button>
          )}
        </div>
      </div>

      {/* Drill-in chips. Cleared via parent to keep the route source of truth. */}
      {(initialOwnerUserId || initialTerminalId) && (
        <div className="flex flex-wrap gap-2">
          {initialOwnerUserId && onClearInitialOwner && (
            <button
              onClick={onClearInitialOwner}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-500/30 transition-all"
            >
              Owner: {initialOwnerUserId.substring(0, 8)}… ✕
            </button>
          )}
          {initialTerminalId && onClearInitialTerminal && (
            <button
              onClick={onClearInitialTerminal}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-all"
            >
              Terminal: {initialTerminalId.substring(0, 8)}… ✕
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      {filtersOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <FilterSelect
            label="Status"
            value={status || ''}
            onChange={(v) => {
              setStatus((v as GpsAlarmStatus) || undefined);
              setPage(1);
            }}
            options={[{ value: '', label: 'Any' }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
          />
          <FilterSelect
            label="Severity"
            value={severity || ''}
            onChange={(v) => {
              setSeverity((v as GpsAlarmSeverity) || undefined);
              setPage(1);
            }}
            options={[{ value: '', label: 'Any' }, ...SEVERITIES.map((s) => ({ value: s, label: s }))]}
          />
          <FilterSelect
            label="Type"
            value={alarmType || ''}
            onChange={(v) => {
              setAlarmType((v as GpsAlarmType) || undefined);
              setPage(1);
            }}
            options={[{ value: '', label: 'Any' }, ...TYPES.map((t) => ({ value: t, label: alarmTypeLabel(t) }))]}
          />
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
          ))}
        </div>
      ) : alarms.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No alarms match your filters</p>
        </div>
      ) : (
        <>
          {/* Select-all bar */}
          {unackVisibleCount > 0 && (
            <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    unackVisibleCount > 0 &&
                    alarms.filter((a) => !a.acknowledged).every((a) => selectedIds.has(a.id))
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                Select all unacknowledged on this page ({unackVisibleCount})
              </label>
              {selectedCount > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">{selectedCount} selected</span>
              )}
            </div>
          )}
          <div className="space-y-2">
            {alarms.map((a) => (
              <AlarmRow
                key={a.id}
                alarm={a}
                selected={selectedIds.has(a.id)}
                onToggleSelect={() => toggleSelect(a.id)}
                onClick={() => setDetailId(a.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {detailId && (
        <GpsAlarmDetailModal
          alarmId={detailId}
          onClose={() => setDetailId(null)}
          onAcknowledged={() => {
            setDetailId(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function AlarmRow({
  alarm,
  selected,
  onToggleSelect,
  onClick,
}: {
  alarm: GpsAlarm;
  selected: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
}) {
  const sev = severityColor(alarm.severity);
  const label = alarm.terminal
    ? vehicleLabel({
        vehicleYear: alarm.terminal.vehicleYear,
        vehicleMake: alarm.terminal.vehicleMake,
        vehicleModel: alarm.terminal.vehicleModel,
        vehicleVin: alarm.terminal.vehicleVin,
        nickname: alarm.terminal.nickname,
        imei: alarm.terminal.imei,
      })
    : '—';
  const owner = alarm.terminal?.ownerUser?.email || 'Unpaired';

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer ${
        selected
          ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/40'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      onClick={onClick}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          disabled={alarm.acknowledged}
          onChange={onToggleSelect}
          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 disabled:opacity-30"
        />
      </div>
      <div className={`w-10 h-10 rounded-xl ${sev.bg} flex items-center justify-center ${sev.text} flex-shrink-0`}>
        <AlertTriangle size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${sev.bg} ${sev.text}`}>{alarm.severity}</span>
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{alarmTypeLabel(alarm.alarmType)}</p>
          {alarm.acknowledged && <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />}
          {alarm.closedAt && <span className="text-[10px] uppercase tracking-wider text-gray-400">CLOSED</span>}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
          {label} · {owner}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{fmtRelative(alarm.openedAt)}</p>
        {(alarm.acknowledgedByAdmin || alarm.acknowledgedByUser) && (
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
            acked by {(alarm.acknowledgedByAdmin?.email || alarm.acknowledgedByUser?.email || '').split('@')[0]}
          </p>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
