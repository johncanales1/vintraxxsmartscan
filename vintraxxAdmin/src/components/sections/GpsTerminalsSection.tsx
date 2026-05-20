'use client';

/**
 * GpsTerminalsSection — admin terminals list. Filter, search, provision,
 * edit, reassign, unpair, delete (single + bulk), drill into a per-terminal
 * detail modal.
 *
 * Live updates: subscribes to `terminal.online`/`terminal.offline` events
 * from the admin firehose. Rather than mutate state in-place we re-fetch
 * the current page so paginated counts and filters stay coherent (cheap
 * and simple).
 *
 * The optional `initialOwnerUserId` prop lets the Dashboard route into a
 * pre-filtered list (e.g. from a UserDetail "View GPS Terminals" link).
 *
 * Destructive actions (single + bulk delete) now route through
 * `ConfirmPasswordModal` so the admin re-enters their password before any
 * row is removed — same pattern used by the backup download flow.
 */

import { useState, useEffect, useCallback } from 'react';
import { api, GpsTerminal } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { gpsAdminWs } from '@/lib/gpsAdminWs';
import {
  fmtRelative,
  vehicleLabel,
  terminalLabel,
  statusDotClasses,
} from '@/lib/gpsHelpers';
import GpsTerminalDetailModal from '@/components/modals/GpsTerminalDetailModal';
import ProvisionTerminalModal from '@/components/modals/ProvisionTerminalModal';
import EditTerminalModal from '@/components/modals/EditTerminalModal';
import ReassignTerminalModal from '@/components/modals/ReassignTerminalModal';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import ConfirmPasswordModal from '@/components/modals/ConfirmPasswordModal';
import BulkActionBar from '@/components/shared/BulkActionBar';
import { useMultiSelect } from '@/lib/useMultiSelect';
import {
  Search, Plus, RefreshCw, Radio, Eye, UserPlus, Unlink, Trash2, Pencil,
  ChevronLeft, ChevronRight, X as XIcon, CheckSquare, Square,
  Loader2, AlertCircle, Signal,
} from 'lucide-react';
import { toast } from 'sonner';

type Filter = 'all' | 'online' | 'offline' | 'unpaired' | 'never_connected' | 'revoked';

interface Props {
  initialOwnerUserId?: string;
  onClearInitialOwner?: () => void;
}

export default function GpsTerminalsSection({
  initialOwnerUserId,
  onClearInitialOwner,
}: Props) {
  const { admin } = useAuth();
  // Terminal delete is gated by `requireSuperAdmin` on the backend — hide the
  // button for non-super admins instead of surfacing a 403 after they click.
  const canDelete = !!admin?.superAdmin;
  const [terminals, setTerminals] = useState<GpsTerminal[]>([]);
  const [search, setSearch] = useState('');
  // Debounced mirror — `search` updates on every keystroke so the input
  // stays responsive, but the network request only fires after 350ms of
  // idle. Without this every keystroke hit `/admin/gps/terminals` once.
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(id);
  }, [search]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [ownerUserId, setOwnerUserId] = useState<string | undefined>(initialOwnerUserId);
  const [ownerUserName, setOwnerUserName] = useState<string | null>(null);

  const sel = useMultiSelect();

  // Mirror prop changes into state. Without this, re-navigating from e.g.
  // DealerA's card → Terminals → Dealers → DealerB's card → Terminals would
  // keep the section filtered on DealerA because `useState` seeds only once.
  useEffect(() => {
    setOwnerUserId(initialOwnerUserId);
    if (!initialOwnerUserId) setOwnerUserName(null);
    if (initialOwnerUserId) setPage(1);
  }, [initialOwnerUserId]);

  const [showProvision, setShowProvision] = useState(false);
  const [editTarget, setEditTarget] = useState<GpsTerminal | null>(null);
  const [reassignTarget, setReassignTarget] = useState<GpsTerminal | null>(null);
  const [unpairTarget, setUnpairTarget] = useState<GpsTerminal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GpsTerminal | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  // 4G Always-Online: fetch whether disable command is configured once.
  const [disableConfigured, setDisableConfigured] = useState(false);
  useEffect(() => {
    api.get4gAlwaysOnlineConfig()
      .then((r) => setDisableConfigured(r.disableConfigured))
      .catch(() => { /* best-effort */ });
  }, []);

  // Resolve owner display name when an initialOwnerUserId is provided so
  // the chip label is recognisable. Fail silently — the chip will fall
  // back to the raw id.
  useEffect(() => {
    if (!ownerUserId) {
      setOwnerUserName(null);
      return;
    }
    let cancelled = false;
    api.getUserDetail(ownerUserId)
      .then((res) => {
        if (!cancelled) setOwnerUserName(res.user.fullName || res.user.email);
      })
      .catch(() => {
        if (!cancelled) setOwnerUserName(null);
      });
    return () => {
      cancelled = true;
    };
  }, [ownerUserId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listGpsTerminals(page, 30, {
        filter: filter === 'all' ? undefined : filter,
        search: debouncedSearch.trim() || undefined,
        ownerUserId,
      });
      setTerminals(res.terminals);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load terminals');
    } finally {
      setLoading(false);
    }
  }, [page, filter, debouncedSearch, ownerUserId]);

  useEffect(() => {
    load();
  }, [load]);

  // Clear selection when the visible page changes out from under us.
  useEffect(() => {
    sel.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter, debouncedSearch, ownerUserId]);

  // Refresh on relevant WS events. Throttle to avoid hammering the API
  // when the firehose is busy.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const queueRefresh = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        load();
      }, 1500);
    };
    const offUp = gpsAdminWs.on('terminal.online', queueRefresh);
    const offDown = gpsAdminWs.on('terminal.offline', queueRefresh);
    return () => {
      offUp();
      offDown();
      if (timer) clearTimeout(timer);
    };
  }, [load]);

  const clearOwnerFilter = () => {
    setOwnerUserId(undefined);
    onClearInitialOwner?.();
    setPage(1);
  };

  const handleUnpair = async () => {
    if (!unpairTarget) return;
    try {
      await api.unpairGpsTerminal(unpairTarget.id);
      toast.success('Terminal unpaired');
      setUnpairTarget(null);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to unpair terminal');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.deleteGpsTerminal(deleteTarget.id);
    toast.success('Terminal deleted');
    setDeleteTarget(null);
    load();
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(sel.selectedIds);
    try {
      // Single round-trip via the dedicated bulk endpoint — replaces the
      // earlier `runBulkDelete` fan-out which fired N parallel DELETEs.
      // Cascades through GpsLocation/GpsObdSnapshot/GpsAlarm/GpsDtcEvent/
      // GpsTrip/GpsCommand/GpsTerminalDailyStats via the schema's
      // `onDelete: Cascade`, so a single terminal removal still wipes all
      // its telemetry server-side.
      const res = await api.bulkDeleteGpsTerminals(ids);
      toast.success(`Deleted ${res.deleted} of ${ids.length} terminal${ids.length === 1 ? '' : 's'}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete terminals');
    }
    sel.clear();
    load();
  };

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'online', label: 'Online' },
    { id: 'offline', label: 'Offline' },
    { id: 'unpaired', label: 'Unpaired' },
    { id: 'never_connected', label: 'Never Connected' },
    { id: 'revoked', label: 'Revoked' },
  ];

  const visibleIds = terminals.map((t) => t.id);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by device ID, IMEI, VIN, nickname, owner..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">{total.toLocaleString()} total</span>
          {canDelete && terminals.length > 0 && (
            <button
              onClick={() => sel.toggleAll(visibleIds)}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              title={sel.allSelected(visibleIds) ? 'Clear selection' : `Select all ${visibleIds.length} visible`}
            >
              {sel.allSelected(visibleIds) ? <CheckSquare size={18} /> : <Square size={18} />}
            </button>
          )}
          <button onClick={load} className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setShowProvision(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-sm"
          >
            <Plus size={18} />
            Provision Terminal
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => {
              setFilter(f.id);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f.id
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}

        {/* Owner filter chip */}
        {ownerUserId && (
          <button
            onClick={clearOwnerFilter}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-500/30 transition-all"
          >
            Owner: {ownerUserName || ownerUserId.substring(0, 8) + '…'}
            <XIcon size={12} />
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      <BulkActionBar
        count={sel.selectedIds.size}
        total={visibleIds.length}
        allSelected={sel.allSelected(visibleIds)}
        onDelete={() => setBulkDeleteOpen(true)}
        onCancel={sel.clear}
        onToggleAll={() => sel.toggleAll(visibleIds)}
        itemLabel="terminal"
      />

      {/* Terminal grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
          ))}
        </div>
      ) : terminals.length === 0 ? (
        <div className="text-center py-16">
          <Radio size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {search || filter !== 'all' || ownerUserId
              ? 'No terminals match your filters'
              : 'No GPS terminals provisioned yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {terminals.map((t) => (
            <TerminalCard
              key={t.id}
              terminal={t}
              selectable={canDelete}
              selected={sel.isSelected(t.id)}
              onToggleSelect={() => sel.toggle(t.id)}
              onView={() => setDetailId(t.id)}
              onEdit={() => setEditTarget(t)}
              onReassign={() => setReassignTarget(t)}
              onUnpair={() => setUnpairTarget(t)}
              onDelete={canDelete ? () => setDeleteTarget(t) : undefined}
              disableConfigured={disableConfigured}
              onTerminalUpdated={load}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {showProvision && (
        <ProvisionTerminalModal
          onClose={() => setShowProvision(false)}
          onCreated={() => {
            setShowProvision(false);
            load();
          }}
        />
      )}

      {editTarget && (
        <EditTerminalModal
          terminal={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={() => {
            setEditTarget(null);
            load();
          }}
        />
      )}

      {reassignTarget && (
        <ReassignTerminalModal
          terminal={reassignTarget}
          onClose={() => setReassignTarget(null)}
          onUpdated={() => {
            setReassignTarget(null);
            load();
          }}
        />
      )}

      {unpairTarget && (
        <ConfirmDeleteModal
          title="Unpair Terminal"
          message={`Unpair terminal ${terminalLabel(unpairTarget)} from ${unpairTarget.ownerUser?.email || 'its owner'}? The device will keep its history but be detached.`}
          onConfirm={handleUnpair}
          onCancel={() => setUnpairTarget(null)}
          destructive={false}
          actionLabel="Unpair"
        />
      )}

      {deleteTarget && (
        <ConfirmPasswordModal
          title="Delete Terminal"
          message={
            <span>
              Permanently delete terminal <span className="font-semibold">{terminalLabel(deleteTarget)}</span>{' '}
              and all its locations, alarms, DTC events, trips, and commands?
            </span>
          }
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {bulkDeleteOpen && (
        <ConfirmPasswordModal
          title="Delete Terminals"
          message={
            <span>
              Permanently delete <span className="font-semibold">{sel.selectedIds.size}</span>{' '}
              selected terminals and all their telemetry?
            </span>
          }
          onConfirm={handleBulkDelete}
          onClose={() => setBulkDeleteOpen(false)}
        />
      )}

      {detailId && (
        <GpsTerminalDetailModal
          terminalId={detailId}
          onClose={() => setDetailId(null)}
          onMutated={load}
        />
      )}
    </div>
  );
}

function TerminalCard({
  terminal,
  selectable,
  selected,
  onToggleSelect,
  onView,
  onEdit,
  onReassign,
  onUnpair,
  onDelete,
  disableConfigured,
  onTerminalUpdated,
}: {
  terminal: GpsTerminal;
  selectable: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
  onEdit: () => void;
  onReassign: () => void;
  onUnpair: () => void;
  /** `undefined` when the current admin isn't a super-admin — hides the button. */
  onDelete?: () => void;
  disableConfigured: boolean;
  onTerminalUpdated: () => void;
}) {
  const ownerLabel = terminal.ownerUser?.fullName || terminal.ownerUser?.email || 'Unpaired';

  // 4G Always-Online toggle state
  const [toggling, setToggling] = useState(false);
  const aoStatus = terminal.fourGAlwaysOnlineStatus;
  const aoDesired = terminal.fourGAlwaysOnlineDesired;
  const isPending = aoStatus === 'PENDING_ENABLE' || aoStatus === 'PENDING_DISABLE';
  const isOn = aoStatus === 'ENABLED';
  const isFailed = aoStatus === 'FAILED';

  const handle4gToggle = async () => {
    if (toggling || isPending) return;
    setToggling(true);
    try {
      if (isOn || aoDesired) {
        // Want to turn OFF
        if (!disableConfigured) {
          toast.error('Disable command not configured — the supplier has not confirmed the disable payload yet.');
          return;
        }
        await api.disable4gAlwaysOnline(terminal.id);
        toast.success('4G Always-Online disable command sent');
      } else {
        // Want to turn ON
        await api.enable4gAlwaysOnline(terminal.id);
        toast.success('4G Always-Online enable command sent');
      }
      onTerminalUpdated();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to toggle 4G Always-Online');
    } finally {
      setToggling(false);
    }
  };

  // Determine toggle visual state
  const toggleChecked = isOn || aoDesired;
  const toggleDisabled = toggling || isPending;

  // Tooltip
  let aoTooltip =
    '4G Always-Online keeps the terminal\u2019s cellular connection active after ACC/ignition off. ' +
    'It does not force the vehicle ECU to keep producing live OBD data while the engine is off.';
  if (isPending) aoTooltip = `Sending\u2026 (${aoStatus?.replace(/_/g, ' ').toLowerCase()})`;
  if (isFailed) aoTooltip = `Failed: ${terminal.fourGAlwaysOnlineLastError || 'unknown error'}`;
  if (toggleChecked && !disableConfigured && !isPending) {
    aoTooltip += '\nDisable command not yet configured by supplier.';
  }

  return (
    <div
      className={`relative bg-white dark:bg-gray-800 rounded-2xl border p-5 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20 transition-all group ${
        selected
          ? 'border-blue-500 ring-2 ring-blue-500/30'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {selectable && (
        <button
          type="button"
          onClick={onToggleSelect}
          className={`absolute top-3 left-3 z-10 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
            selected
              ? 'bg-blue-600 border-blue-600 text-white opacity-100'
              : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-transparent opacity-0 group-hover:opacity-100'
          }`}
          title={selected ? 'Deselect' : 'Select'}
          aria-label={selected ? 'Deselect terminal' : 'Select terminal'}
        >
          {selected && <CheckSquare size={14} />}
        </button>
      )}
      <div className="flex items-start justify-between mb-3">
        <div className={`flex items-start gap-3 min-w-0 ${selectable ? 'ml-6' : ''}`}>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 relative">
            <Radio size={18} />
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${statusDotClasses(terminal.status)}`} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {vehicleLabel({
                vehicleYear: terminal.vehicleYear,
                vehicleMake: terminal.vehicleMake,
                vehicleModel: terminal.vehicleModel,
                vehicleVin: terminal.vehicleVin,
                nickname: terminal.nickname,
                deviceIdentifier: terminal.deviceIdentifier,
                imei: terminal.imei,
              })}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">{terminalLabel(terminal)}</p>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-0.5">{terminal.status.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onView} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-all" title="View">
            <Eye size={16} />
          </button>
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-emerald-500 transition-all" title="Edit metadata">
            <Pencil size={16} />
          </button>
          <button onClick={onReassign} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-violet-500 transition-all" title="Reassign owner">
            <UserPlus size={16} />
          </button>
          {terminal.ownerUserId && (
            <button onClick={onUnpair} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-amber-500 transition-all" title="Unpair">
              <Unlink size={16} />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-all" title="Delete">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1.5 text-xs">
        <Row label="Owner" value={ownerLabel} mono={!terminal.ownerUser} />
        <Row label="VIN" value={terminal.vehicleVin || '—'} mono />
        <Row label="Last heartbeat" value={fmtRelative(terminal.lastHeartbeatAt)} />
        <Row
          label="Connection"
          value={
            terminal.status === 'ONLINE'
              ? `since ${fmtRelative(terminal.connectedAt)}`
              : terminal.disconnectedAt
                ? `lost ${fmtRelative(terminal.disconnectedAt)}`
                : '—'
          }
        />
      </div>

      {/* 4G Always-Online toggle */}
      <div className="mt-3 flex items-center justify-between gap-2 px-1" title={aoTooltip}>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Signal size={13} className={isOn ? 'text-emerald-500' : isFailed ? 'text-red-400' : ''} />
          <span>4G Always-On</span>
          {isPending && <Loader2 size={12} className="animate-spin text-blue-500" />}
          {isFailed && <AlertCircle size={12} className="text-red-400" />}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={toggleChecked}
          disabled={toggleDisabled}
          onClick={handle4gToggle}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
            toggleDisabled
              ? 'cursor-not-allowed opacity-50'
              : 'cursor-pointer'
          } ${
            toggleChecked
              ? isFailed
                ? 'bg-red-400'
                : 'bg-emerald-500'
              : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              toggleChecked ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <button
        onClick={onView}
        className="w-full mt-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
      >
        View Telemetry
      </button>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">{label}</span>
      <span className={`text-gray-900 dark:text-gray-200 truncate text-right ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}
