/**
 * useGpsScanReport — manages the lifecycle of a "Run full scan" request
 * for one terminal.
 *
 * Responsibilities:
 *   • Load the most-recent scan report for the terminal on mount (so a
 *     return visit re-renders the previous result without a refetch).
 *   • Expose `runScan()` which fires POST /gps/terminals/:id/scan and then
 *     polls GET /gps/scan-reports/:id every 2 s until the row leaves
 *     PENDING (or the backend's 30 s outer timeout flips it to TIMED_OUT).
 *   • Expose `emailReport(email?)` and `promoteToAi()` thin wrappers.
 *
 * Cancellation semantics: every fetch is wrapped in an AbortController so
 * navigating away mid-poll doesn't leave a fetch in flight. The polling
 * loop checks `cancelledRef.current` between turns.
 *
 * NOTE: This hook intentionally doesn't subscribe to the realtime WS feed
 * yet. The 2 s polling cadence is more than sufficient for the 5–30 s
 * scan window and avoids coupling the page to the WS reconnect logic.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gpsApi } from "./gpsApi";
import type { GpsScanReport } from "./types";

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 25; // 25 * 2 s = 50 s — comfortably > backend's 30 s

export interface UseGpsScanReportResult {
  /** Most-recent scan report, or null until at least one has been loaded. */
  report: GpsScanReport | null;
  /** True while the initial fetch or `runScan` is in flight. */
  busy: boolean;
  /** True while a scan request is PENDING. */
  scanning: boolean;
  /** Last error from the API client, or null. */
  error: string | null;
  /** Kick off a new scan. Resolves when the report leaves PENDING. */
  runScan: () => Promise<GpsScanReport | null>;
  /** Email the current (COMPLETED) report. */
  emailReport: (email?: string) => Promise<{ ok: boolean; message?: string }>;
  /** Promote the current (COMPLETED) report into a Scan + queue AI. */
  promoteToAi: () => Promise<{ ok: boolean; scanId?: string; message?: string }>;
}

export function useGpsScanReport(terminalId: string): UseGpsScanReportResult {
  const [report, setReport] = useState<GpsScanReport | null>(null);
  const [busy, setBusy] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelledRef = useRef(false);

  // Initial load: pull the most-recent report (if any) so the page paints
  // historical state immediately instead of an empty shell.
  useEffect(() => {
    cancelledRef.current = false;
    const controller = new AbortController();
    (async () => {
      setBusy(true);
      setError(null);
      const res = await gpsApi.listGpsScanReports(
        terminalId,
        { limit: 1 },
        controller.signal,
      );
      if (cancelledRef.current) return;
      if (!res.success) {
        setError(res.message ?? "Could not load scan history");
        setBusy(false);
        return;
      }
      const first = res.data?.reports?.[0] ?? null;
      setReport(first);
      // If we landed on a PENDING report (e.g. user reloaded the page
      // mid-scan), start polling.
      if (first?.status === "PENDING") {
        setScanning(true);
        void pollUntilSettled(first.id);
      }
      setBusy(false);
    })();
    return () => {
      cancelledRef.current = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminalId]);

  /** Poll until status leaves PENDING. Updates `report` on each tick. */
  const pollUntilSettled = useCallback(
    async (scanReportId: string): Promise<GpsScanReport | null> => {
      for (let i = 0; i < POLL_MAX_ATTEMPTS; i += 1) {
        if (cancelledRef.current) return null;
        await sleep(POLL_INTERVAL_MS);
        if (cancelledRef.current) return null;
        const res = await gpsApi.getGpsScanReport(scanReportId);
        if (!res.success || !res.data) {
          // Transient — keep polling unless we've burned our budget.
          continue;
        }
        const next = res.data.report;
        if (cancelledRef.current) return null;
        setReport(next);
        if (next.status !== "PENDING") {
          setScanning(false);
          if (next.status !== "COMPLETED" && next.status !== "PARTIAL") {
            setError(next.errorText ?? `Scan ${next.status.toLowerCase()}`);
          }
          return next;
        }
      }
      setScanning(false);
      setError("Scan timed out — please try again.");
      return null;
    },
    [],
  );

  const runScan = useCallback(async (): Promise<GpsScanReport | null> => {
    setError(null);
    setScanning(true);
    const res = await gpsApi.requestGpsScan(terminalId);
    if (!res.success || !res.data) {
      setScanning(false);
      const msg = res.message ?? "Failed to start scan";
      setError(msg);
      return null;
    }
    // Optimistically reflect a PENDING shell so the UI flips immediately.
    // The first poll tick will replace this with the real row.
    const pendingShell = await gpsApi.getGpsScanReport(res.data.scanReportId);
    if (pendingShell.success && pendingShell.data) {
      setReport(pendingShell.data.report);
    }
    return pollUntilSettled(res.data.scanReportId);
  }, [terminalId, pollUntilSettled]);

  const emailReport = useCallback(
    async (email?: string): Promise<{ ok: boolean; message?: string }> => {
      if (!report || (report.status !== "COMPLETED" && report.status !== "PARTIAL")) {
        return { ok: false, message: "Scan is not yet complete" };
      }
      const res = await gpsApi.emailGpsScanReport(
        report.id,
        email ? { email } : {},
      );
      if (!res.success) return { ok: false, message: res.message };
      return { ok: true, message: `Sent to ${res.data?.sentTo ?? "you"}` };
    },
    [report],
  );

  const promoteToAi = useCallback(async () => {
    if (!report || (report.status !== "COMPLETED" && report.status !== "PARTIAL")) {
      return { ok: false, message: "Scan is not yet complete" };
    }
    const res = await gpsApi.promoteGpsScanToAi(report.id);
    if (!res.success || !res.data) {
      return { ok: false, message: res.message };
    }
    // Stamp the promotedScanId locally so the button can flip to
    // "View AI Report" without a refetch.
    setReport((prev) =>
      prev ? { ...prev, promotedScanId: res.data!.scanId } : prev,
    );
    return { ok: true, scanId: res.data.scanId };
  }, [report]);

  return { report, busy, scanning, error, runScan, emailReport, promoteToAi };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
