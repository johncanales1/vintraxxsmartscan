/**
 * /VinTraxxSmartScanDashboard/devices/[id] \u2014 single-device detail.
 *
 * Sub-tab navigation via `?sub=live|trips|alarms|dtcs|settings`. Default
 * is `live`. Settings tab includes the rename action (PATCH /label) and a
 * read-only summary of the device's IMEI, model, parameters.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Edit3, Locate, Save } from "lucide-react";
import { gpsApi } from "../../_lib/gpsApi";
import { useGpsTerminals } from "../../_lib/useGpsTerminals";
import { useGpsLatest } from "../../_lib/useGpsLatest";
import { useGpsAlarms } from "../../_lib/useGpsAlarms";
import type {
  GpsDtcEvent,
  GpsTerminal,
  GpsTrip,
} from "../../_lib/types";
import { BackLink } from "../../_components/DashboardTabBar";
import { DeviceMapPanel } from "../../_components/DeviceMapPanel";
import { LiveObdPanel } from "../../_components/LiveObdPanel";
import { TripsTable } from "../../_components/TripsTable";
import { DtcTable } from "../../_components/DtcTable";
import { AlertsTable } from "../../_components/AlertsTable";
import { vehicleLabel, formatRelativeOrAbsolute } from "../../_lib/format";

const SUB_TABS = ["live", "trips", "alarms", "dtcs", "settings"] as const;
type SubTab = (typeof SUB_TABS)[number];

export default function DeviceDetailPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const id = params.id;
  const subRaw = search?.get("sub") as SubTab | null;
  const sub: SubTab =
    subRaw && (SUB_TABS as readonly string[]).includes(subRaw)
      ? subRaw
      : "live";

  const { terminals } = useGpsTerminals();
  const terminal = useMemo(
    () => terminals.find((t) => t.id === id) ?? null,
    [terminals, id],
  );

  const setSub = (next: SubTab) => {
    router.replace(`/VinTraxxSmartScanDashboard/devices/${id}?sub=${next}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      <BackLink
        href="/VinTraxxSmartScanDashboard/devices"
        label="Back to Fleet"
      />
      <DeviceHeader terminal={terminal} />
      <SubTabNav sub={sub} setSub={setSub} />
      {sub === "live" && terminal && <LiveTab terminal={terminal} />}
      {sub === "trips" && terminal && <TripsTab terminal={terminal} />}
      {sub === "alarms" && terminal && <AlarmsTab terminal={terminal} />}
      {sub === "dtcs" && terminal && <DtcsTab terminal={terminal} />}
      {sub === "settings" && terminal && <SettingsTab terminal={terminal} />}
      {!terminal && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Device not found, or not paired with your account.
        </div>
      )}
    </div>
  );
}

function DeviceHeader({ terminal }: { terminal: GpsTerminal | null }) {
  if (!terminal) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        Loading device...
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {vehicleLabel(terminal)}
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-mono">
          IMEI {terminal.imei} \u2022 {terminal.vehicleVin ?? "VIN —"}
        </p>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <StatusPill status={terminal.status} />
        <span className="text-slate-500">
          Last seen {formatRelativeOrAbsolute(terminal.lastHeartbeatAt)}
        </span>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: GpsTerminal["status"] }) {
  const map: Record<GpsTerminal["status"], { dot: string; label: string }> = {
    ONLINE: { dot: "bg-emerald-500", label: "Online" },
    OFFLINE: { dot: "bg-slate-400", label: "Offline" },
    NEVER_CONNECTED: { dot: "bg-slate-300", label: "Never connected" },
    SUSPENDED: { dot: "bg-rose-500", label: "Suspended" },
  };
  const s = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-slate-700">
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function SubTabNav({ sub, setSub }: { sub: SubTab; setSub: (s: SubTab) => void }) {
  const labels: Record<SubTab, string> = {
    live: "Live",
    trips: "Trips",
    alarms: "Alarms",
    dtcs: "DTCs",
    settings: "Settings",
  };
  return (
    <div className="border-b border-slate-200">
      <div className="flex items-center gap-1 -mb-px">
        {SUB_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setSub(t)}
            className={`px-3 sm:px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              sub === t
                ? "border-[#1B3A5F] text-[#1B3A5F]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {labels[t]}
          </button>
        ))}
      </div>
    </div>
  );
}

function LiveTab({ terminal }: { terminal: GpsTerminal }) {
  const { location, loading } = useGpsLatest(terminal.id);
  const [locating, setLocating] = useState(false);
  const [locateMsg, setLocateMsg] = useState<string | null>(null);

  const onLocate = async () => {
    setLocating(true);
    setLocateMsg(null);
    const res = await gpsApi.locateTerminal(terminal.id);
    setLocating(false);
    setLocateMsg(
      res.success
        ? "Locate request queued. The device will respond shortly."
        : res.message ?? "Failed to queue locate request.",
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onLocate}
          disabled={locating}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-[#8B2332] hover:bg-[#a12d3e] disabled:opacity-50 text-white text-sm font-semibold"
        >
          <Locate className="w-4 h-4" />
          {locating ? "Locating..." : "Request Locate"}
        </button>
      </div>
      {locateMsg && (
        <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
          {locateMsg}
        </div>
      )}
      <DeviceMapPanel
        points={
          location
            ? [
                {
                  id: terminal.id,
                  lat: location.latitude,
                  lng: location.longitude,
                  label: vehicleLabel(terminal),
                  caption: `${formatRelativeOrAbsolute(location.reportedAt)}`,
                  color:
                    terminal.status === "ONLINE" ? "online" : "offline",
                },
              ]
            : []
        }
        highlightId={terminal.id}
        heightClass="h-[320px] sm:h-[420px]"
      />
      {!location && !loading && (
        <p className="text-xs text-center text-slate-500">
          No location reports received yet.
        </p>
      )}
      <LiveObdPanel terminalId={terminal.id} />
    </div>
  );
}

function TripsTab({ terminal }: { terminal: GpsTerminal }) {
  const [trips, setTrips] = useState<GpsTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const since = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const res = await gpsApi.listTrips(terminal.id, { since, limit: 100 });
      if (cancelled) return;
      if (res.success && res.data) setTrips(res.data.trips ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [terminal.id]);

  return (
    <TripsTable trips={trips} terminals={[terminal]} loading={loading} />
  );
}

function AlarmsTab({ terminal }: { terminal: GpsTerminal }) {
  const { alarms, loading, refetch } = useGpsAlarms({
    terminalId: terminal.id,
    limit: 100,
  });
  return (
    <AlertsTable
      alarms={alarms}
      terminals={[terminal]}
      loading={loading}
      onChange={refetch}
    />
  );
}

function DtcsTab({ terminal }: { terminal: GpsTerminal }) {
  const [events, setEvents] = useState<GpsDtcEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await gpsApi.listDtcEvents({
        terminalId: terminal.id,
        limit: 100,
      });
      if (cancelled) return;
      if (res.success && res.data) setEvents(res.data.events ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [terminal.id]);

  return <DtcTable events={events} terminals={[terminal]} loading={loading} />;
}

function SettingsTab({ terminal }: { terminal: GpsTerminal }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(terminal.nickname ?? "");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const onSave = async () => {
    setSaving(true);
    const res = await gpsApi.renameTerminal(terminal.id, name.trim());
    setSaving(false);
    if (res.success) {
      setSavedAt(Date.now());
      setEditing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
            Nickname
          </label>
          {editing ? (
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lot 12 \u2014 2024 F-150"
                className="flex-1 h-10 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5F]"
              />
              <button
                onClick={onSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 h-10 px-3 rounded-md bg-[#1B3A5F] hover:bg-[#2d5278] disabled:opacity-50 text-white text-sm font-semibold"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setName(terminal.nickname ?? "");
                }}
                className="h-10 px-3 rounded-md text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-base text-slate-900">
                {terminal.nickname ?? "—"}
              </span>
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 text-xs text-[#1B3A5F] hover:underline"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
              {savedAt !== null && Date.now() - savedAt < 3000 && (
                <span className="text-xs text-emerald-600">Saved</span>
              )}
            </div>
          )}
        </div>
        <SettingsRow label="IMEI" value={terminal.imei} mono />
        <SettingsRow label="Phone" value={terminal.phoneNumber ?? "—"} />
        <SettingsRow label="Model" value={terminal.terminalModel ?? "—"} />
        <SettingsRow label="Firmware" value={terminal.firmwareVersion ?? "—"} />
        <SettingsRow label="VIN" value={terminal.vehicleVin ?? "—"} mono />
        <SettingsRow
          label="Vehicle"
          value={
            [
              terminal.vehicleYear,
              terminal.vehicleMake,
              terminal.vehicleModel,
            ]
              .filter(Boolean)
              .join(" ") || "—"
          }
        />
        <SettingsRow
          label="Report interval"
          value={
            terminal.reportIntervalSec
              ? `${terminal.reportIntervalSec}s`
              : "—"
          }
        />
        <SettingsRow
          label="Heartbeat"
          value={
            terminal.heartbeatIntervalSec
              ? `${terminal.heartbeatIntervalSec}s`
              : "—"
          }
        />
      </div>
    </div>
  );
}

function SettingsRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-t border-slate-100">
      <span className="text-xs font-semibold text-slate-500 uppercase">
        {label}
      </span>
      <span
        className={`text-sm text-slate-900 text-right ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
