/**
 * GpsScanReportPanel — the dashboard view of the Full Scan Report.
 *
 * Renders one of three states:
 *   • Empty   — no scan has ever been run for this terminal. Shows a CTA.
 *   • Pending — a scan is in flight. Shows a spinner + 30 s countdown.
 *   • Settled — COMPLETED / FAILED / TIMED_OUT — shows the diagnostic tiles.
 *
 * Settled-COMPLETED additionally offers:
 *   • Email PDF  — POST /scan-reports/:id/email
 *   • Generate AI Report — POST /scan-reports/:id/promote-ai then opens the
 *     existing scan-detail modal via `useScanDetail.openByScanId`.
 *
 * The visual hierarchy mirrors the BLE Scan summary so the two reports
 * read identically: top KPI row (MIL / DTC count / mileage / distance with
 * MIL), DTC list, OBD live grid.
 */

"use client";

import { useState } from "react";
import {
  RefreshCw,
  Mail,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useGpsScanReport } from "../_lib/useGpsScanReport";
import { useScanDetail } from "./ScanDetailContext";
import type { GpsScanReport, GpsTerminal } from "../_lib/types";
import { vehicleLabel, formatRelativeOrAbsolute } from "../_lib/format";

interface Props {
  terminal: GpsTerminal;
}

export function GpsScanReportPanel({ terminal }: Props) {
  const { report, busy, scanning, error, runScan, emailReport, promoteToAi } =
    useGpsScanReport(terminal.id);
  const { openByScanId } = useScanDetail();

  const [emailing, setEmailing] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  const onEmail = async () => {
    setEmailing(true);
    setEmailMsg(null);
    const res = await emailReport();
    setEmailing(false);
    setEmailMsg(res.ok ? (res.message ?? "Sent.") : (res.message ?? "Failed."));
  };

  const onAi = async () => {
    if (!report) return;
    setAiBusy(true);
    if (report.promotedScanId) {
      openByScanId(report.promotedScanId, { pollUntilComplete: true });
      setAiBusy(false);
      return;
    }
    const res = await promoteToAi();
    setAiBusy(false);
    if (res.ok && res.scanId) {
      openByScanId(res.scanId, { pollUntilComplete: true });
    }
  };

  if (busy && !report) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">Loading scan history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Full Scan Report</h2>
          <p className="text-xs text-slate-500 mt-1">
            One-tap diagnostic over the LTE link. Same data the BLE scanner
            captures, no cable needed.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => void runScan()}
            disabled={scanning}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-[#1B3A5F] hover:bg-[#2d5278] disabled:opacity-50 text-white text-sm font-semibold"
          >
            <RefreshCw
              className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`}
            />
            {scanning ? "Scanning..." : report ? "Refresh" : "Run Full Scan"}
          </button>
          {report?.status === "COMPLETED" && (
            <>
              <button
                onClick={onEmail}
                disabled={emailing}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-800 text-sm font-semibold"
              >
                <Mail className="w-4 h-4" />
                {emailing ? "Sending..." : "Email PDF"}
              </button>
              <button
                onClick={onAi}
                disabled={aiBusy}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-[#8B2332] hover:bg-[#a12d3e] disabled:opacity-50 text-white text-sm font-semibold"
              >
                <Sparkles className="w-4 h-4" />
                {aiBusy
                  ? "Working..."
                  : report.promotedScanId
                    ? "View AI Report"
                    : "Generate AI Report"}
              </button>
            </>
          )}
        </div>
      </div>

      {emailMsg && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {emailMsg}
        </div>
      )}
      {error && (
        <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {!report && !scanning && (
        <EmptyState terminal={terminal} />
      )}

      {report && <ReportBody report={report} />}
    </div>
  );
}

function EmptyState({ terminal }: { terminal: GpsTerminal }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <RefreshCw className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p className="text-sm text-slate-700 font-semibold">
        No scan reports yet for {vehicleLabel(terminal)}.
      </p>
      <p className="text-xs text-slate-500 mt-1">
        Tap <span className="font-semibold">Run Full Scan</span> to query the
        ECU and capture a fresh report.
      </p>
    </div>
  );
}

function ReportBody({ report }: { report: GpsScanReport }) {
  return (
    <div className="space-y-4">
      <StatusBanner report={report} />
      {report.status === "COMPLETED" && (
        <>
          <KpiRow report={report} />
          <DtcSection report={report} />
          <ObdLiveGrid report={report} />
        </>
      )}
    </div>
  );
}

function StatusBanner({ report }: { report: GpsScanReport }) {
  if (report.status === "PENDING") {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <div>
          <p className="font-semibold">Scan in progress…</p>
          <p className="text-xs text-blue-800 mt-0.5">
            Querying the ECU. This usually takes 5–15 seconds.
          </p>
        </div>
      </div>
    );
  }
  if (report.status === "FAILED" || report.status === "TIMED_OUT") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Scan {report.status === "TIMED_OUT" ? "timed out" : "failed"}
        </p>
        <p className="text-xs text-amber-800 mt-1">
          {report.errorText ??
            "We couldn't reach the device. Make sure ignition is on and the LTE link is connected, then try again."}
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 flex items-center gap-2">
      <CheckCircle2 className="w-4 h-4" />
      <span className="font-semibold">Scan complete.</span>
      <span className="text-xs text-emerald-800">
        Captured {formatRelativeOrAbsolute(report.completedAt ?? report.requestedAt)}
      </span>
    </div>
  );
}

function KpiRow({ report }: { report: GpsScanReport }) {
  const tiles: Array<{ label: string; value: string; tone?: "amber" | "green" }> = [
    {
      label: "Check Engine",
      value: report.milOn === true ? "ON" : report.milOn === false ? "OFF" : "—",
      tone: report.milOn === true ? "amber" : "green",
    },
    {
      label: "Stored DTCs",
      value: report.dtcCount != null ? String(report.dtcCount) : "—",
      tone: (report.dtcCount ?? 0) > 0 ? "amber" : "green",
    },
    {
      label: "Distance w/ MIL",
      value: formatMiles(report.distanceWithMilKm),
    },
    {
      label: "Warm-ups since clear",
      value: report.warmupsSinceClear != null ? String(report.warmupsSinceClear) : "—",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {tiles.map((t) => (
        <div
          key={t.label}
          className={`rounded-xl border p-4 ${
            t.tone === "amber"
              ? "border-amber-200 bg-amber-50"
              : t.tone === "green"
                ? "border-emerald-200 bg-emerald-50"
                : "border-slate-200 bg-white"
          }`}
        >
          <p className="text-[11px] uppercase font-semibold text-slate-500 tracking-wide">
            {t.label}
          </p>
          <p
            className={`text-xl font-bold mt-1 ${
              t.tone === "amber"
                ? "text-amber-900"
                : t.tone === "green"
                  ? "text-emerald-900"
                  : "text-slate-900"
            }`}
          >
            {t.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function DtcSection({ report }: { report: GpsScanReport }) {
  const buckets = [
    { name: "Stored", codes: report.storedDtcCodes },
    { name: "Pending", codes: report.pendingDtcCodes },
    { name: "Permanent", codes: report.permanentDtcCodes },
  ].filter((b) => b.codes.length > 0);

  if (buckets.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900">
        <p className="font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          No fault codes reported by the ECU.
        </p>
        <p className="text-xs text-emerald-800 mt-1">
          {report.protocol
            ? `Protocol: ${report.protocol}.`
            : "All readiness monitors checked in clean."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <h3 className="text-sm font-bold text-slate-900 mb-3">
        Diagnostic Trouble Codes
      </h3>
      <div className="space-y-3">
        {buckets.map((b) => (
          <div key={b.name}>
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
              {b.name}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {b.codes.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ObdLiveGrid({ report }: { report: GpsScanReport }) {
  const rows: Array<[string, string]> = [
    ["Engine RPM", report.rpm != null ? `${report.rpm} rpm` : "—"],
    [
      "Vehicle speed",
      report.vehicleSpeedKmh != null
        ? `${Math.round(Number(report.vehicleSpeedKmh) * 0.621371)} mph`
        : "—",
    ],
    ["Coolant", report.coolantTempC != null ? `${report.coolantTempC} °C` : "—"],
    ["Intake air", report.intakeAirTempC != null ? `${report.intakeAirTempC} °C` : "—"],
    ["Engine load", report.engineLoadPct != null ? `${report.engineLoadPct}%` : "—"],
    ["Throttle", report.throttlePct != null ? `${report.throttlePct}%` : "—"],
    ["MAF", report.mafGps != null ? `${report.mafGps} g/s` : "—"],
    ["Fuel level", report.fuelLevelPct != null ? `${report.fuelLevelPct}%` : "—"],
    [
      "Battery",
      report.batteryVoltageMv != null
        ? `${(report.batteryVoltageMv / 1000).toFixed(1)} V`
        : "—",
    ],
    ["Fuel-system status", report.fuelSystemStatus ?? "—"],
    ["Secondary-air status", report.secondaryAirStatus ?? "—"],
    [
      "Distance since clear",
      formatMiles(report.distanceSinceClearKm),
    ],
    [
      "Runtime since start",
      report.runtimeSinceStartSec != null ? `${report.runtimeSinceStartSec} s` : "—",
    ],
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <h3 className="text-sm font-bold text-slate-900 mb-3">OBD Live Data</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between text-sm border-b border-slate-100 py-1.5"
          >
            <span className="text-slate-500">{label}</span>
            <span className="font-semibold text-slate-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatMiles(km: string | number | null | undefined): string {
  if (km === null || km === undefined) return "—";
  const numeric = typeof km === "number" ? km : Number(km);
  if (!Number.isFinite(numeric)) return "—";
  return `${Math.round(numeric * 0.621371).toLocaleString()} mi`;
}
