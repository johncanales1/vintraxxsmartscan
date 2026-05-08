/**
 * PairDeviceModal — read-only modal explaining the admin-only pairing flow.
 *
 * Per the dealer/mobile audit: there is no dealer-facing pairing endpoint.
 * Provisioning a new device happens through the admin web console using the
 * device's JT/T 808 device identifier (the value printed on the unit's label
 * — may be an IMEI, MSISDN, or a manufacturer-assigned terminal ID). This
 * modal gives the dealer a copy-to-clipboard helper + escalation guidance.
 */

"use client";

import { Copy, X, Smartphone } from "lucide-react";
import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PairDeviceModal({ open, onClose }: Props) {
  const [deviceId, setDeviceId] = useState("");
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const onCopy = async () => {
    if (!deviceId.trim()) return;
    try {
      await navigator.clipboard.writeText(deviceId.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — user can copy manually */
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#1B3A5F] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <Smartphone className="w-5 h-5" />
            <h2 className="text-lg font-bold">Pair a GPS Device</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
            Pairing is performed by your VinTraxx administrator. Share the
            device identifier printed on the unit’s label so they can
            provision it to your account.
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Device Identifier
            </label>
            <div className="flex gap-2">
              <input
                value={deviceId}
                onChange={(e) =>
                  // JT/T 808 §1.5.2 / §3.3 permits 1–30 alphanumeric chars
                  // (uppercase letters + digits for the registration-body
                  // terminal ID; pure digits for BCD MSISDN/IMEI). We accept
                  // mixed-case input — the operator pastes whatever is on
                  // the label.
                  setDeviceId(
                    e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 30),
                  )
                }
                placeholder="e.g. IMEI, MSISDN, or terminal ID"
                className="flex-1 h-10 rounded-lg border border-slate-300 px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1B3A5F]"
              />
              <button
                onClick={onCopy}
                disabled={!deviceId.trim()}
                className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg bg-slate-900 hover:bg-slate-700 disabled:bg-slate-300 text-white text-sm font-medium"
              >
                <Copy className="w-4 h-4" />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              The identifier is printed on the device label. It may be an IMEI,
              MSISDN, or manufacturer-assigned terminal ID. Once your
              administrator provisions the terminal, it will appear
              automatically in the Fleet tab — no further action is needed.
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="h-10 px-4 rounded-lg bg-[#1B3A5F] hover:bg-[#2d5278] text-white text-sm font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
