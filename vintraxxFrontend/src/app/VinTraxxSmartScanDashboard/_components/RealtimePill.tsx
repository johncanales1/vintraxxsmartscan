/**
 * RealtimePill — tiny status indicator + popover summarising offline
 * terminals. Reads WebSocket state via gpsWs.onState.
 *
 *   \u25cf Live          (green)  \u2014 socket open, fleet receiving updates
 *   \u25cf Reconnecting  (amber)  \u2014 backoff loop active
 *   \u25cf Offline       (grey)   \u2014 socket idle / never opened (e.g. logged out)
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { gpsWs } from "../_lib/gpsWs";
import type { WsState } from "../_lib/gpsWs";
import { useGpsTerminals } from "../_lib/useGpsTerminals";
import { ChevronDown } from "lucide-react";

const PILL_STYLES: Record<WsState, { dot: string; label: string; text: string }> = {
  idle: { dot: "bg-slate-400", label: "Offline", text: "text-slate-600" },
  offline: { dot: "bg-slate-400", label: "Offline", text: "text-slate-600" },
  connecting: { dot: "bg-amber-500", label: "Connecting", text: "text-amber-700" },
  reconnecting: { dot: "bg-amber-500", label: "Reconnecting", text: "text-amber-700" },
  open: { dot: "bg-emerald-500", label: "Live", text: "text-emerald-700" },
};

export function RealtimePill() {
  const [state, setState] = useState<WsState>("idle");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const { terminals } = useGpsTerminals();

  useEffect(() => {
    const off = gpsWs.onState((s) => setState(s));
    return off;
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const style = PILL_STYLES[state];
  const offline = terminals.filter((t) => t.status === "OFFLINE");

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-2 h-8 px-3 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold ${style.text}`}
        title={`WebSocket: ${style.label}`}
      >
        <span
          className={`w-2 h-2 rounded-full ${style.dot} ${
            state === "open" ? "animate-pulse" : ""
          }`}
        />
        <span className="hidden sm:inline">{style.label}</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl z-50 p-3">
          <div className="text-xs font-semibold text-slate-700 mb-2">
            Connection: {style.label}
          </div>
          {offline.length === 0 ? (
            <div className="text-xs text-slate-500">All devices online.</div>
          ) : (
            <>
              <div className="text-xs text-slate-500 mb-1">
                {offline.length} offline device{offline.length === 1 ? "" : "s"}
              </div>
              <ul className="space-y-1">
                {offline.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="truncate">
                      {t.nickname || t.vehicleVin || t.deviceIdentifier || t.imei}
                    </span>
                    <span className="text-slate-400 ml-2 flex-shrink-0">
                      {t.lastHeartbeatAt
                        ? new Date(t.lastHeartbeatAt).toLocaleString()
                        : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
