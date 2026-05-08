/**
 * /VinTraxxSmartScanDashboard/devices \u2014 fleet list.
 */

"use client";

import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { useGpsTerminals } from "../_lib/useGpsTerminals";
import { DeviceTable } from "../_components/DeviceTable";
import { PairDeviceModal } from "../_components/PairDeviceModal";

export default function DevicesPage() {
  const { terminals, loading, refetch } = useGpsTerminals();
  const [pairOpen, setPairOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = terminals.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (t.nickname ?? "").toLowerCase().includes(q) ||
      (t.vehicleVin ?? "").toLowerCase().includes(q) ||
      (t.vehicleMake ?? "").toLowerCase().includes(q) ||
      (t.vehicleModel ?? "").toLowerCase().includes(q) ||
      t.deviceIdentifier.toLowerCase().includes(q) ||
      (t.imei ?? "").toLowerCase().includes(q)
    );
  });

  const onlineCount = terminals.filter((t) => t.status === "ONLINE").length;
  const offlineCount = terminals.filter((t) => t.status === "OFFLINE").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fleet</h1>
          <p className="text-sm text-slate-500 mt-1">
            {terminals.length} device{terminals.length === 1 ? "" : "s"} \u2022{" "}
            <span className="text-emerald-600 font-semibold">
              {onlineCount} online
            </span>{" "}
            \u2022 <span className="text-slate-500">{offlineCount} offline</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setPairOpen(true)}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-[#1B3A5F] hover:bg-[#2d5278] text-white text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Pair Device
          </button>
        </div>
      </div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by VIN, device ID, IMEI, or vehicle..."
        className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5F]"
      />
      <DeviceTable terminals={filtered} loading={loading} />
      <PairDeviceModal open={pairOpen} onClose={() => setPairOpen(false)} />
    </div>
  );
}
