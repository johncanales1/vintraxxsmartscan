/**
 * RealtimePill — tiny status indicator + popover summarising offline
 * terminals. The pill reflects *actual device state* (not just the WS
 * socket state), so a green "Live" pill only appears when at least one
 * paired GPS terminal is reporting ONLINE.
 *
 *   \u25cf Live          (green)  \u2014 WS open AND at least one terminal ONLINE
 *   \u25cf Offline       (red)    \u2014 WS open but all paired terminals OFFLINE
 *   \u25cf No Devices    (grey)   \u2014 WS open but no terminals are paired yet
 *   \u25cf Connecting    (amber)  \u2014 WS is connecting / reconnecting
 *   \u25cf Offline (WS)  (grey)   \u2014 socket idle (e.g. logged out)
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { gpsWs } from "../_lib/gpsWs";
import type { WsState } from "../_lib/gpsWs";
import { useGpsTerminals } from "../_lib/useGpsTerminals";
import { ChevronDown } from "lucide-react";

/**
 * Effective state surfaced to the user. Derived from WS state +
 * terminals[] in render, never stored so it always tracks live data.
 */
type EffectiveState =
  | "wsOffline"
  | "connecting"
  | "noDevices"
  | "allOffline"
  | "live";

const PILL_STYLES: Record<EffectiveState, { dot: string; label: string; text: string; pulse: boolean }> = {
  wsOffline: { dot: "bg-slate-400", label: "Offline", text: "text-slate-600", pulse: false },
  connecting: { dot: "bg-amber-500", label: "Connecting", text: "text-amber-700", pulse: false },
  noDevices: { dot: "bg-slate-400", label: "No Devices", text: "text-slate-600", pulse: false },
  allOffline: { dot: "bg-rose-500", label: "Offline", text: "text-rose-700", pulse: false },
  live: { dot: "bg-emerald-500", label: "Live", text: "text-emerald-700", pulse: true },
};

function deriveEffectiveState(
  ws: WsState,
  hasAnyTerminal: boolean,
  hasOnlineTerminal: boolean,
): EffectiveState {
  if (ws === "connecting" || ws === "reconnecting") return "connecting";
  if (ws !== "open") return "wsOffline";
  if (!hasAnyTerminal) return "noDevices";
  if (!hasOnlineTerminal) return "allOffline";
  return "live";
}

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

  const total = terminals.length;
  const online = terminals.filter((t) => t.status === "ONLINE");
  const offline = terminals.filter((t) => t.status === "OFFLINE");
  const effective = deriveEffectiveState(state, total > 0, online.length > 0);
  const style = PILL_STYLES[effective];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-2 h-8 px-3 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold ${style.text}`}
        title={`Fleet: ${style.label}`}
      >
        <span
          className={`w-2 h-2 rounded-full ${style.dot} ${
            style.pulse ? "animate-pulse" : ""
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
          {total === 0 ? (
            <div className="text-xs text-slate-500">No devices paired.</div>
          ) : online.length === total ? (
            <div className="text-xs text-slate-500">
              {total} of {total} device{total === 1 ? "" : "s"} online.
            </div>
          ) : (
            <>
              <div className="text-xs text-slate-500 mb-1">
                {online.length} of {total} device{total === 1 ? "" : "s"} online
                {offline.length > 0 ? ` \u00b7 ${offline.length} offline` : ""}
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
