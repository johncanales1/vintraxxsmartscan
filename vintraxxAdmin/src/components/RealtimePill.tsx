'use client';

/**
 * RealtimePill — top-bar status indicator for the admin GPS WebSocket.
 *
 * Drives off two sources:
 *   • `gpsAdminWs.onState` for the socket connection state. Drives the
 *     dot color (green/amber/grey) and the label.
 *   • A 60-second poll of `/admin/gps/stats/overview` for the count
 *     summary that shows "127 online" next to the dot. WS terminal
 *     online/offline events bump the count locally between polls so the
 *     pill never gets stale by more than 60 seconds.
 *
 * Click → popover with online / offline / unacked counts and a manual
 * Reconnect button if the socket is closed.
 */

import { useEffect, useRef, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { gpsAdminWs, type WsState } from '@/lib/gpsAdminWs';
import { api, type GpsOverviewStats } from '@/lib/api';

export default function RealtimePill() {
  const [state, setState] = useState<WsState>('idle');
  const [stats, setStats] = useState<GpsOverviewStats | null>(null);
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Connect on mount, listen for state, listen for terminal up/down to
  // bump the online count locally. We do NOT disconnect on unmount —
  // the singleton survives section navigation and only tears down on
  // logout (see auth.tsx::logout).
  useEffect(() => {
    gpsAdminWs.connect();
    const offState = gpsAdminWs.onState(setState);
    const offUp = gpsAdminWs.on('terminal.online', () => {
      setStats((s) =>
        s
          ? {
              ...s,
              terminals: {
                ...s.terminals,
                online: s.terminals.online + 1,
                offline: Math.max(0, s.terminals.offline - 1),
              },
            }
          : s,
      );
    });
    const offDown = gpsAdminWs.on('terminal.offline', () => {
      setStats((s) =>
        s
          ? {
              ...s,
              terminals: {
                ...s.terminals,
                online: Math.max(0, s.terminals.online - 1),
                offline: s.terminals.offline + 1,
              },
            }
          : s,
      );
    });
    const offAlarm = gpsAdminWs.on('alarm.opened', () => {
      setStats((s) =>
        s
          ? {
              ...s,
              alarms: {
                ...s.alarms,
                last24h: s.alarms.last24h + 1,
                unacknowledged: s.alarms.unacknowledged + 1,
              },
            }
          : s,
      );
    });
    return () => {
      offState();
      offUp();
      offDown();
      offAlarm();
    };
  }, []);

  // 60-second poll for the authoritative counts. Aborts on unmount.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.getGpsOverview();
        if (!cancelled) setStats(res.stats);
      } catch {
        /* keep prior stats; the pill will recover on next poll */
      }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Click-outside handler for the popover.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!popoverRef.current) return;
      if (!popoverRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const dotClass =
    state === 'open'
      ? 'bg-emerald-500 animate-pulse'
      : state === 'connecting'
        ? 'bg-amber-400 animate-pulse'
        : 'bg-gray-400';

  const label =
    state === 'open' ? 'Live' : state === 'connecting' ? 'Connecting' : 'Offline';

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
      >
        <span className={`w-2 h-2 rounded-full ${dotClass}`} />
        <span className="text-gray-700 dark:text-gray-200">{label}</span>
        {stats && state === 'open' && (
          <span className="text-gray-400 dark:text-gray-500">
            · {stats.terminals.online} online
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-black/20 p-4 z-50">
          <div className="flex items-center gap-2 mb-3">
            {state === 'open' ? (
              <Wifi size={16} className="text-emerald-500" />
            ) : (
              <WifiOff size={16} className="text-gray-400" />
            )}
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Realtime Status
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <Row label="Connection" value={label} />
            <Row label="Online terminals" value={stats?.terminals.online ?? '—'} />
            <Row label="Offline" value={stats?.terminals.offline ?? '—'} />
            <Row label="Never connected" value={stats?.terminals.neverConnected ?? '—'} />
            <Row
              label="Unacknowledged alarms"
              value={stats?.alarms.unacknowledged ?? '—'}
              accent={
                stats && stats.alarms.unacknowledged > 0 ? 'text-red-500' : undefined
              }
            />
            <Row label="Critical 24h" value={stats?.alarms.criticalLast24h ?? '—'} />
          </div>

          {state !== 'open' && (
            <button
              onClick={() => {
                gpsAdminWs.connect();
              }}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all"
            >
              <RefreshCw size={14} />
              Reconnect
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span
        className={`font-semibold ${accent ?? 'text-gray-900 dark:text-white'}`}
      >
        {value}
      </span>
    </div>
  );
}
