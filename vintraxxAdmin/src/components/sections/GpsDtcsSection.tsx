'use client';

/**
 * GpsDtcsSection — admin DTC event console.
 *
 * Each row is a single DTC snapshot reported by the gateway. The
 * "Analyze with AI" button fetches a lightweight AI explanation of the
 * detected codes (description, severity, repair cost) and displays it
 * in a modal — no Scan row, PDF, or email is created.
 *
 * Live updates: subscribes to `dtc.detected` events and refetches the
 * page when one fires.
 */

import { useState, useEffect, useCallback } from 'react';
import { api, GpsDtcEvent, DtcExplanation } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { gpsAdminWs } from '@/lib/gpsAdminWs';
import { fmtRelative, vehicleLabel } from '@/lib/gpsHelpers';
import ConfirmPasswordModal from '@/components/modals/ConfirmPasswordModal';
import BulkActionBar from '@/components/shared/BulkActionBar';
import { useMultiSelect } from '@/lib/useMultiSelect';
import {
  Search, RefreshCw, AlertTriangle, Zap, ChevronLeft, ChevronRight,
  X as XIcon, DollarSign, Wrench, ShieldAlert, Clock, AlertCircle, Info,
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  /**
   * Optional drill-in from a per-terminal view. The chip stays visible
   * and is dismissible via `onClearInitialTerminal`.
   */
  initialTerminalId?: string;
  onClearInitialTerminal?: () => void;
}

export default function GpsDtcsSection({
  initialTerminalId,
  onClearInitialTerminal,
}: Props) {
  const { admin } = useAuth();
  // Bulk delete is gated by `requireSuperAdmin` on the backend.
  const canDelete = !!admin?.superAdmin;
  const [events, setEvents] = useState<GpsDtcEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [vinQuery, setVinQuery] = useState('');
  // Debounce the VIN filter so each keystroke doesn't fire a /admin/gps/dtcs
  // round-trip. The visible input still updates instantly.
  const [debouncedVin, setDebouncedVin] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebouncedVin(vinQuery), 350);
    return () => clearTimeout(id);
  }, [vinQuery]);
  const [milOnly, setMilOnly] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [explainResult, setExplainResult] = useState<{
    eventId: string;
    explanations: DtcExplanation[];
    aiSummary: string;
  } | null>(null);

  const sel = useMultiSelect();
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listGpsDtcEvents(page, 30, {
        terminalId: initialTerminalId,
        // The backend's `vin` filter is exact-match upper-cased - we let
        // the user type any case and trim, the controller normalises it.
        vin: debouncedVin.trim() || undefined,
        // Note the field name is `milOnly`, NOT `milOn`. See api.ts.
        milOnly: milOnly || undefined,
      });
      setEvents(res.events);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load DTC events');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedVin, milOnly, initialTerminalId]);

  useEffect(() => {
    load();
  }, [load]);

  // Live refresh on `dtc.detected`. Throttle to avoid hammering the API
  // when a fleet of terminals reports simultaneously.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const queue = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        load();
      }, 1500);
    };
    const off = gpsAdminWs.on('dtc.detected', queue);
    return () => {
      off();
      if (timer) clearTimeout(timer);
    };
  }, [load]);

  const handleExplain = async (id: string) => {
    setAnalyzingId(id);
    try {
      const res = await api.explainGpsDtcEvent(id);
      setExplainResult({
        eventId: id,
        explanations: res.explanations,
        aiSummary: res.aiSummary,
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to analyze');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(sel.selectedIds);
    try {
      const res = await api.bulkDeleteGpsDtcEvents(ids);
      toast.success(`Deleted ${res.deleted} DTC event${res.deleted === 1 ? '' : 's'}`);
      sel.clear();
      setBulkDeleteOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete DTC events');
      setBulkDeleteOpen(false);
    }
  };

  const visibleIds = events.map((e) => e.id);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Filter by VIN..."
            value={vinQuery}
            onChange={(e) => {
              setVinQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500 dark:text-gray-400">{total.toLocaleString()} events</span>
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            <input
              type="checkbox"
              checked={milOnly}
              onChange={(e) => {
                setMilOnly(e.target.checked);
                setPage(1);
              }}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-600 dark:text-gray-300">MIL only</span>
          </label>
          <button onClick={load} className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Drill-in chip */}
      {initialTerminalId && onClearInitialTerminal && (
        <div>
          <button
            onClick={onClearInitialTerminal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-all"
          >
            Terminal: {initialTerminalId.substring(0, 8)}…
            <XIcon size={12} />
          </button>
        </div>
      )}

      {/* Bulk-action bar (only super-admins can delete; renders only when
          at least one row is selected). */}
      {canDelete && (
        <BulkActionBar
          count={sel.selectedIds.size}
          total={visibleIds.length}
          allSelected={sel.allSelected(visibleIds)}
          onDelete={() => setBulkDeleteOpen(true)}
          onCancel={sel.clear}
          onToggleAll={() => sel.toggleAll(visibleIds)}
          itemLabel="DTC event"
        />
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <AlertTriangle size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {vinQuery || milOnly || initialTerminalId ? 'No DTC events match your filters' : 'No DTC events reported yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((e) => (
            <DtcEventRow
              key={e.id}
              event={e}
              selectable={canDelete}
              selected={sel.isSelected(e.id)}
              onToggleSelect={() => sel.toggle(e.id)}
              onAnalyze={() => handleExplain(e.id)}
              analyzing={analyzingId === e.id}
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

      {bulkDeleteOpen && (
        <ConfirmPasswordModal
          title="Delete DTC Events"
          message={
            <span>
              Permanently delete <span className="font-semibold">{sel.selectedIds.size}</span>{' '}
              selected DTC event{sel.selectedIds.size === 1 ? '' : 's'}? Linked AI scans
              are unaffected; only the raw event rows are removed.
            </span>
          }
          onConfirm={handleBulkDelete}
          onClose={() => setBulkDeleteOpen(false)}
        />
      )}

      {/* AI Explain Modal */}
      {explainResult && (
        <DtcExplainModal
          explanations={explainResult.explanations}
          aiSummary={explainResult.aiSummary}
          onClose={() => setExplainResult(null)}
        />
      )}
    </div>
  );
}

function DtcEventRow({
  event,
  selectable,
  selected,
  onToggleSelect,
  onAnalyze,
  analyzing,
}: {
  event: GpsDtcEvent;
  /** When true, render the leading checkbox (only super-admins). */
  selectable: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onAnalyze: () => void;
  analyzing: boolean;
}) {
  const label = event.terminal
    ? vehicleLabel({
        vehicleYear: null,
        vehicleMake: null,
        vehicleModel: null,
        vehicleVin: event.vin,
        nickname: event.terminal.nickname,
        deviceIdentifier: event.terminal.deviceIdentifier,
        imei: event.terminal.imei,
      })
    : event.vin;

  return (
    <div className={`px-4 py-3 rounded-xl border transition-all ${
      selected
        ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/40'
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
    }`}>
      <div className="flex items-start justify-between gap-3">
        {selectable && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 flex-shrink-0"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-mono text-gray-900 dark:text-white truncate">{label}</p>
            {event.milOn && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300">
                MIL ON
              </span>
            )}
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {event.dtcCount} DTC{event.dtcCount === 1 ? '' : 's'}
            </span>
            {event.protocol && (
              <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {event.protocol}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
            VIN: {event.vin}
            {event.mileageKm && ` · ${Number(event.mileageKm).toFixed(0)} km`}
            {' · '}
            {fmtRelative(event.reportedAt)}
          </p>

          {/* Code chips */}
          {(event.storedDtcCodes.length > 0 ||
            event.pendingDtcCodes.length > 0 ||
            event.permanentDtcCodes.length > 0) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {event.storedDtcCodes.map((c) => (
                <span
                  key={`s-${c}`}
                  className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                  title="Stored"
                >
                  {c}
                </span>
              ))}
              {event.pendingDtcCodes.map((c) => (
                <span
                  key={`p-${c}`}
                  className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  title="Pending"
                >
                  {c}P
                </span>
              ))}
              {event.permanentDtcCodes.map((c) => (
                <span
                  key={`pe-${c}`}
                  className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  title="Permanent"
                >
                  {c}!
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onAnalyze}
            disabled={analyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium transition-all"
          >
            {analyzing ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap size={12} />
            )}
            Analyze with AI
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DTC Explain Modal ─────────────────────────────────────────────────────────

const SEVERITY_CFG = {
  critical: { label: 'Critical', bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-300', icon: ShieldAlert },
  moderate: { label: 'Moderate', bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-300', icon: AlertCircle },
  minor: { label: 'Minor', bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-700 dark:text-green-300', icon: Info },
} as const;

const URGENCY_CFG = {
  immediate: { label: 'Fix Immediately', bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400' },
  soon: { label: 'Fix Soon', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  monitor: { label: 'Monitor', bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
} as const;

const CATEGORY_CFG = {
  stored: { label: 'Stored', bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400' },
  pending: { label: 'Pending', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
  permanent: { label: 'Permanent', bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400' },
} as const;

function DtcExplainModal({
  explanations,
  aiSummary,
  onClose,
}: {
  explanations: DtcExplanation[];
  aiSummary: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-white" />
            <h2 className="text-lg font-bold text-white">AI DTC Analysis</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 transition-colors">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Summary */}
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30">
            <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">{aiSummary}</p>
          </div>

          {/* Code explanations */}
          {explanations.map((ex, i) => {
            const sev = SEVERITY_CFG[ex.severity] ?? SEVERITY_CFG.minor;
            const urg = URGENCY_CFG[ex.urgency] ?? URGENCY_CFG.monitor;
            const cat = CATEGORY_CFG[ex.category] ?? CATEGORY_CFG.stored;
            const SevIcon = sev.icon;
            const totalCost = ex.repair.partsCost + ex.repair.laborCost;

            return (
              <div
                key={`${ex.code}-${i}`}
                className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Code header */}
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-mono font-bold text-gray-900 dark:text-white">
                      {ex.code}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${cat.bg} ${cat.text}`}>
                      {cat.label}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{ex.module}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md ${sev.bg} ${sev.text}`}>
                      <SevIcon size={10} />
                      {sev.label}
                    </span>
                    <span className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md ${urg.bg} ${urg.text}`}>
                      <Clock size={10} />
                      {urg.label}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {ex.description}
                  </p>

                  {/* Possible causes */}
                  {ex.possibleCauses.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                        Possible Causes
                      </p>
                      <ul className="space-y-1">
                        {ex.possibleCauses.map((cause, ci) => (
                          <li key={ci} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" />
                            {cause}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Repair + Cost */}
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-start gap-2 mb-2">
                      <Wrench size={14} className="mt-0.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">{ex.repair.description}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <DollarSign size={12} />
                        Parts: <span className="font-semibold text-gray-700 dark:text-gray-200">${ex.repair.partsCost.toLocaleString()}</span>
                      </span>
                      <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <DollarSign size={12} />
                        Labor: <span className="font-semibold text-gray-700 dark:text-gray-200">${ex.repair.laborCost.toLocaleString()}</span>
                      </span>
                      <span className="flex items-center gap-1 font-bold text-gray-900 dark:text-white">
                        <DollarSign size={12} />
                        Total: ${totalCost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {explanations.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No DTC codes to analyze.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
