'use client';

/**
 * GpsTerminalsSection — admin terminals list. Filter, search, provision,
 * reassign, unpair, and drill into a per-terminal detail modal.
 *
 * Live updates: subscribes to `terminal.online`/`terminal.offline` events
 * from the admin firehose. Rather than mutate state in-place we re-fetch
 * the current page so paginated counts and filters stay coherent (cheap
 * and simple).
 *
 * The optional `initialOwnerUserId` prop lets the Dashboard route into a
 * pre-filtered list (e.g. from a UserDetail "View GPS Terminals" link).
 */

import { useState, useEffect, useCallback } from 'react';
import { api, GpsTerminal } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { gpsAdminWs } from '@/lib/gpsAdminWs';
import {
  fmtRelative,
  vehicleLabel,
  statusDotClasses,
} from '@/lib/gpsHelpers';
import GpsTerminalDetailModal from '@/components/modals/GpsTerminalDetailModal';
import ProvisionTerminalModal from '@/components/modals/ProvisionTerminalModal';
import ReassignTerminalModal from '@/components/modals/ReassignTerminalModal';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import {
  Search, Plus, RefreshCw, Radio, Eye, UserPlus, Unlink, Trash2,
  ChevronLeft, ChevronRight, X as XIcon,
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

  // Mirror prop changes into state. Without this, re-navigating from e.g.
  // DealerA's card → Terminals → Dealers → DealerB's card → Terminals would
  // keep the section filtered on DealerA because `useState` seeds only once.
  useEffect(() => {
    setOwnerUserId(initialOwnerUserId);
    if (!initialOwnerUserId) setOwnerUserName(null);
    if (initialOwnerUserId) setPage(1);
  }, [initialOwnerUserId]);

  const [showProvision, setShowProvision] = useState(false);
  const [reassignTarget, setReassignTarget] = useState<GpsTerminal | null>(null);
  const [unpairTarget, setUnpairTarget] = useState<GpsTerminal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GpsTerminal | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

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
    try {
      await api.deleteGpsTerminal(deleteTarget.id);
      toast.success('Terminal deleted');
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete terminal');
    }
  };

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'online', label: 'Online' },
    { id: 'offline', label: 'Offline' },
    { id: 'unpaired', label: 'Unpaired' },
    { id: 'never_connected', label: 'Never Connected' },
    { id: 'revoked', label: 'Revoked' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by IMEI, VIN, nickname, owner..."
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
              onView={() => setDetailId(t.id)}
              onReassign={() => setReassignTarget(t)}
              onUnpair={() => setUnpairTarget(t)}
              onDelete={canDelete ? () => setDeleteTarget(t) : undefined}
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
          message={`Unpair terminal ${unpairTarget.imei} from ${unpairTarget.ownerUser?.email || 'its owner'}? The device will keep its history but be detached.`}
          onConfirm={handleUnpair}
          onCancel={() => setUnpairTarget(null)}
          destructive={false}
          actionLabel="Unpair"
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          title="Delete Terminal"
          message={`Permanently delete terminal ${deleteTarget.imei} and all its locations, alarms, DTC events, trips, and commands? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
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
  onView,
  onReassign,
  onUnpair,
  onDelete,
}: {
  terminal: GpsTerminal;
  onView: () => void;
  onReassign: () => void;
  onUnpair: () => void;
  /** `undefined` when the current admin isn't a super-admin — hides the button. */
  onDelete?: () => void;
}) {
  const ownerLabel = terminal.ownerUser?.fullName || terminal.ownerUser?.email || 'Unpaired';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 min-w-0">
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
                imei: terminal.imei,
              })}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">{terminal.imei}</p>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-0.5">{terminal.status.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onView} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-all" title="View">
            <Eye size={16} />
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
