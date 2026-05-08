'use client';

/**
 * GpsDtcsSection — admin DTC event console.
 *
 * Each row is a single DTC snapshot promoted by the gateway. From here an
 * admin can trigger an AI analysis ("Analyze with AI"), which calls the
 * existing scan-promoter pipeline and returns a `scanId`. The button
 * shows "Re-analyze" when a scan is already linked and offers to
 * navigate to that scan's detail in the History tab.
 *
 * Live updates: subscribes to `dtc.detected` events and refetches the
 * page when one fires.
 */

import { useState, useEffect, useCallback } from 'react';
import { api, GpsDtcEvent } from '@/lib/api';
import { gpsAdminWs } from '@/lib/gpsAdminWs';
import { fmtRelative, vehicleLabel } from '@/lib/gpsHelpers';
import {
  Search, RefreshCw, AlertTriangle, Zap, ChevronLeft, ChevronRight,
  ExternalLink, X as XIcon,
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

  const handleAnalyze = async (id: string) => {
    setAnalyzingId(id);
    try {
      const res = await api.analyzeGpsDtcEvent(id);
      toast.success(
        res.reused
          ? 'Analysis reused — opening existing scan'
          : 'AI analysis started — refresh in a moment',
      );
      // Refresh so the row shows the new scanId chip.
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to analyze');
    } finally {
      setAnalyzingId(null);
    }
  };

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
              onAnalyze={() => handleAnalyze(e.id)}
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
    </div>
  );
}

function DtcEventRow({
  event,
  onAnalyze,
  analyzing,
}: {
  event: GpsDtcEvent;
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
    <div className="px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
      <div className="flex items-start justify-between gap-3">
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
            {event.scanId && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                ANALYZED
              </span>
            )}
            {event.protocol && (
              <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
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
          {event.scanId && (
            <a
              // The Admin app's scan detail lives under the History tab; the
              // canonical deep-link is /admin?tab=history&scanId=…. We surface
              // the raw id here for copy-paste, and link to the History tab.
              href="#"
              onClick={(e) => {
                e.preventDefault();
                // Ideally we'd push state — Dashboard manages tabs in
                // local state and doesn't expose a router. Falling back to
                // a hash for visibility; the History tab will read it on
                // mount.
                window.location.hash = `scan=${event.scanId}`;
                toast.info('Scan ID copied to URL hash — open History tab');
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-all"
              title="Open scan in History tab"
            >
              <ExternalLink size={14} />
            </a>
          )}
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
            {event.scanId ? 'Re-analyze' : 'Analyze with AI'}
          </button>
        </div>
      </div>
    </div>
  );
}
