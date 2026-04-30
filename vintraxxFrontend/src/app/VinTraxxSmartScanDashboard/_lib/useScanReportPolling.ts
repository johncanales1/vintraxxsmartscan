/**
 * useScanReportPolling — poll /scan/report/:scanId until the AI bridge
 * reports completed or failed. Mirrors the BLE-flow pollReport in
 * vintraxxMobile/src/services/api/ApiService.ts so behaviour is identical.
 *
 * Usage:
 *   const { start, status, data, error } = useScanReportPolling();
 *   start(scanId);
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gpsApi } from "./gpsApi";
import type { FullReportData } from "./types";

const POLL_INTERVAL_MS = 5_000;
const MAX_ATTEMPTS = 60; // ~5 minutes at 5s/attempt

export type PollStatus =
  | "idle"
  | "submitting"
  | "processing"
  | "completed"
  | "failed";

export function useScanReportPolling() {
  const [status, setStatus] = useState<PollStatus>("idle");
  const [data, setData] = useState<FullReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);

  const start = useCallback(async (scanId: string) => {
    cancelledRef.current = false;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setStatus("processing");
    setData(null);
    setError(null);

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      if (cancelledRef.current || controller.signal.aborted) return;
      const res = await gpsApi.getScanReport(scanId, controller.signal);
      if (cancelledRef.current) return;
      if (!res.success) {
        if (res.error === "aborted") return;
        // Transient failure — retry.
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        continue;
      }
      if (res.status === "completed" && res.data) {
        setData(res.data);
        setStatus("completed");
        return;
      }
      if (res.status === "failed") {
        setStatus("failed");
        setError(res.error ?? "Report failed");
        return;
      }
      // status === 'processing' (or undefined while transitioning) — wait.
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
    if (!cancelledRef.current) {
      setStatus("failed");
      setError("Timed out waiting for report");
    }
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    controllerRef.current?.abort();
    setStatus("idle");
  }, []);

  // Cancel on unmount.
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      controllerRef.current?.abort();
    };
  }, []);

  return { status, data, error, start, cancel };
}
