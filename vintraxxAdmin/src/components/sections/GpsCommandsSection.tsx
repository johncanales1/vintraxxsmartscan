'use client';

/**
 * GpsCommandsSection — read-only audit of every JT/T-808 command issued
 * to a terminal.
 *
 * v1 of the admin app does not enqueue commands directly (the
 * `/admin/gps/commands` POST endpoint exists but issuing commands is
 * gated behind an explicit `superAdmin` flag and a separate UX that
 * isn't part of this milestone). This section therefore reads the
 * command history with status filter, pagination, and a status pill
 * so an operator can verify that the gateway dispatched the right
 * commands during incidents.
 */

import { useState, useEffect, useCallback } from 'react';
import { api, GpsCommand, GpsCommandStatus } from '@/lib/api';
import { fmtRelative } from '@/lib/gpsHelpers';
import {
  Search, RefreshCw, Send, ChevronLeft, ChevronRight, Filter,
  X as XIcon,
} from 'lucide-react';
import { toast } from 'sonner';

// Order chosen to match the natural lifecycle: QUEUED -> SENT -> ACKED, with
// the two terminal failure states grouped at the end. The Prisma enum is the
// source of truth (see GpsCommandStatus in api.ts).
const STATUSES: GpsCommandStatus[] = ['QUEUED', 'SENT', 'ACKED', 'FAILED', 'EXPIRED'];

interface Props {
  initialTerminalId?: string;
  onClearInitialTerminal?: () => void;
}

export default function GpsCommandsSection({
  initialTerminalId,
  onClearInitialTerminal,
}: Props) {
  const [commands, setCommands] = useState<GpsCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [status, setStatus] = useState<GpsCommandStatus | undefined>();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listGpsCommands(page, 30, {
        terminalId: initialTerminalId,
        status,
      });
      // Local search by command kind / admin email — the backend's
      // command list endpoint doesn't expose a free-text filter (the
      // table is small enough that paginated client-side filtering is
      // fine for the admin console).
      const q = search.trim().toLowerCase();
      const filtered = q
        ? res.commands.filter((c) =>
            (c.kind || '').toLowerCase().includes(q) ||
            (c.admin?.email || '').toLowerCase().includes(q) ||
            (c.terminal?.imei || '').toLowerCase().includes(q),
          )
        : res.commands;
      setCommands(filtered);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load commands');
    } finally {
      setLoading(false);
    }
  }, [page, status, initialTerminalId, search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by kind, admin, or IMEI..."
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

      {/* Filters */}
      {filtersOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
            <select
              value={status || ''}
              onChange={(e) => {
                setStatus((e.target.value as GpsCommandStatus) || undefined);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
          ))}
        </div>
      ) : commands.length === 0 ? (
        <div className="text-center py-16">
          <Send size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {search || status || initialTerminalId ? 'No commands match your filters' : 'No commands have been issued yet'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Kind</th>
                <th className="px-4 py-3 text-left">Terminal</th>
                <th className="px-4 py-3 text-left">By</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Sent / Acked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {commands.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3"><CommandStatusPill status={c.status} /></td>
                  <td className="px-4 py-3">
                    <p className="text-gray-900 dark:text-white font-medium">{c.kind || '—'}</p>
                    {c.functionCode != null && (
                      <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
                        0x{c.functionCode.toString(16).toUpperCase().padStart(4, '0')}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                    {c.terminal?.nickname || c.terminal?.imei || c.terminalId.substring(0, 8) + '…'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 truncate max-w-[160px]">
                    {c.admin?.email || 'system'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {fmtRelative(c.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {c.sentAt ? `sent ${fmtRelative(c.sentAt)}` : c.errorText ? <span className="text-red-500">{c.errorText}</span> : '—'}
                    {c.ackAt && <span className="text-emerald-600 dark:text-emerald-400"> · acked {fmtRelative(c.ackAt)}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  );
}

function CommandStatusPill({ status }: { status: GpsCommandStatus }) {
  // Five-state palette - separates terminal-success (ACKED, emerald) from
  // terminal-failure (FAILED red, EXPIRED gray) and in-flight states
  // (QUEUED amber, SENT blue) so an operator can scan the table at a
  // glance for outliers.
  let cls: string;
  switch (status) {
    case 'ACKED':
      cls = 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300';
      break;
    case 'SENT':
      cls = 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300';
      break;
    case 'FAILED':
      cls = 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300';
      break;
    case 'EXPIRED':
      cls = 'bg-gray-200 dark:bg-gray-600/40 text-gray-600 dark:text-gray-300';
      break;
    case 'QUEUED':
    default:
      cls = 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300';
      break;
  }
  return <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${cls}`}>{status}</span>;
}
