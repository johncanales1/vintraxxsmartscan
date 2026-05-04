'use client';

/**
 * GpsAuditLogSection — read-only audit-log viewer.
 *
 * The backend appends one row per successful admin write (POST/PATCH/
 * PUT/DELETE under /api/v1/admin/*) plus selected service-level writes
 * (alarm ack, terminal provision, etc.). Filter by admin, action,
 * target, HTTP status class, and date range.
 *
 * Each row is collapsible — click to reveal the raw payload, IP, and
 * user agent for forensic investigation.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { api, AdminAuditEntry } from '@/lib/api';
import { fmtRelative } from '@/lib/gpsHelpers';
import {
  Search, RefreshCw, ChevronDown, ChevronRight, Filter, ShieldCheck,
  ChevronLeft, ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CLASSES: { value: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { value: 2, label: '2xx Success' },
  { value: 3, label: '3xx Redirect' },
  { value: 4, label: '4xx Client error' },
  { value: 5, label: '5xx Server error' },
];

export default function GpsAuditLogSection() {
  const [entries, setEntries] = useState<AdminAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const [statusClass, setStatusClass] = useState<1 | 2 | 3 | 4 | 5 | undefined>();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listAdminAuditLogs(page, 50, {
        action: action.trim() || undefined,
        targetType: targetType.trim() || undefined,
        statusClass,
      });
      // Free-text search is purely client-side (the audit endpoint exposes
      // no `q` param). Keep the full page in state and derive the filtered
      // view in `useMemo` so each keystroke doesn't fire a new round-trip.
      setEntries(res.entries);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [page, action, targetType, statusClass]);

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      (e.path || '').toLowerCase().includes(q) ||
      (e.admin?.email || '').toLowerCase().includes(q) ||
      (e.targetId || '').toLowerCase().includes(q),
    );
  }, [entries, search]);

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
            placeholder="Search path, admin, or target id..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {search.trim()
              ? `${filteredEntries.length.toLocaleString()} of ${total.toLocaleString()}`
              : `${total.toLocaleString()} entries`}
          </span>
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

      {/* Filters */}
      {filtersOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Action</label>
            <input
              type="text"
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              placeholder="e.g. terminal.provision"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Target type</label>
            <input
              type="text"
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value);
                setPage(1);
              }}
              placeholder="e.g. GpsTerminal"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status class</label>
            <select
              value={statusClass ?? ''}
              onChange={(e) => {
                const v = e.target.value === '' ? undefined : (parseInt(e.target.value, 10) as 1 | 2 | 3 | 4 | 5);
                setStatusClass(v);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any</option>
              {STATUS_CLASSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-16">
          <ShieldCheck size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No audit entries match your filters</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredEntries.map((entry) => (
            <AuditRow
              key={entry.id}
              entry={entry}
              expanded={expandedId === entry.id}
              onToggle={() => setExpandedId((cur) => (cur === entry.id ? null : entry.id))}
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
              <ChevronRightIcon size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditRow({
  entry,
  expanded,
  onToggle,
}: {
  entry: AdminAuditEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const statusBgClass = statusBucket(entry.statusCode);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all text-left"
      >
        <span className="flex-shrink-0 text-gray-400">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span className={`flex-shrink-0 w-12 text-center px-1.5 py-0.5 text-[10px] font-bold rounded-md ${statusBgClass}`}>
          {entry.statusCode}
        </span>
        <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          {entry.method}
        </span>
        <span className="text-sm text-gray-900 dark:text-white font-mono truncate flex-1">{entry.path}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:inline">
          {entry.action || '—'}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 hidden md:inline">
          {entry.admin?.email?.split('@')[0] || 'system'}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">
          {fmtRelative(entry.createdAt)}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-700 text-xs space-y-2 bg-gray-50/50 dark:bg-gray-900/30">
          <KV label="Admin" value={entry.admin?.email || (entry.adminId ? `(deleted) ${entry.adminId}` : 'system')} />
          <KV label="Action" value={entry.action || '—'} mono />
          <KV
            label="Target"
            value={entry.targetType ? `${entry.targetType}${entry.targetId ? ` · ${entry.targetId}` : ''}` : '—'}
            mono
          />
          {entry.ip && <KV label="IP" value={entry.ip} mono />}
          {entry.userAgent && <KV label="User agent" value={entry.userAgent} truncate />}
          {entry.errorText && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Error</p>
              <p className="text-red-500 dark:text-red-400">{entry.errorText}</p>
            </div>
          )}
          {entry.payload && Object.keys(entry.payload).length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Payload</p>
              <pre className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 font-mono overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(entry.payload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function statusBucket(code: number): string {
  if (code >= 500) return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300';
  if (code >= 400) return 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300';
  if (code >= 300) return 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300';
  return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300';
}

function KV({
  label,
  value,
  mono,
  truncate,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 w-24 flex-shrink-0">{label}</span>
      <span className={`text-gray-700 dark:text-gray-200 flex-1 ${mono ? 'font-mono' : ''} ${truncate ? 'truncate' : 'break-all'}`}>
        {value}
      </span>
    </div>
  );
}
