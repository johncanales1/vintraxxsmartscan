/**
 * ScanDetailContext — single source of truth for the final-report modal.
 *
 * Both the existing Overview OBD-scan list AND the new GPS-DTC AI bridge
 * call `useScanDetail().openByScanId(scanId)`. The provider owns:
 *   • selectedScanId   \u2014 modal visibility + which scan to show
 *   • scanDetail       \u2014 fetched FullReportData
 *   • loading          \u2014 spinner state
 *   • progressLabel    \u2014 optional caption shown while AI is still running
 *
 * `openByScanId` accepts an optional `progress` flag. When true, the provider
 * keeps the modal open in the loading state and POLLS the scan/report
 * endpoint until it completes \u2014 matching the AI bridge UX. Existing OBD
 * scans (already completed) skip polling and just fetch once.
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { gpsApi } from "../_lib/gpsApi";
import type { FullReportData } from "../_lib/types";
import { ScanDetailModal } from "./ScanDetailModal";

interface OpenOptions {
  /** When true, keeps polling until completed (used by AI bridge). */
  pollUntilComplete?: boolean;
}

interface ScanDetailContextValue {
  openByScanId: (scanId: string, options?: OpenOptions) => void;
  close: () => void;
  isOpen: boolean;
}

const ctx = createContext<ScanDetailContextValue | null>(null);

const POLL_INTERVAL_MS = 5_000;
const MAX_POLL_ATTEMPTS = 60; // ~5 minutes

export function ScanDetailProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanDetail, setScanDetail] = useState<FullReportData | null>(null);
  const cancelRef = useRef<{ cancelled: boolean; controller?: AbortController }>(
    {
      cancelled: false,
    },
  );

  const close = useCallback(() => {
    cancelRef.current.cancelled = true;
    cancelRef.current.controller?.abort();
    setOpen(false);
    setScanDetail(null);
    setLoading(false);
  }, []);

  const openByScanId = useCallback(
    async (scanId: string, options?: OpenOptions) => {
      // Reset cancellation state for the new request.
      cancelRef.current.cancelled = false;
      cancelRef.current.controller?.abort();
      const controller = new AbortController();
      cancelRef.current.controller = controller;

      setOpen(true);
      setLoading(true);
      setScanDetail(null);

      const pollOnce = async () => {
        const res = await gpsApi.getScanReport(scanId, controller.signal);
        return res;
      };

      // Single-shot fetch first.
      const initial = await pollOnce();
      if (cancelRef.current.cancelled) return;
      if (initial.success) {
        if (initial.status === "completed" && initial.data) {
          setScanDetail(initial.data);
          setLoading(false);
          return;
        }
        if (initial.status === "failed") {
          setLoading(false);
          return;
        }
      }

      // Either we're polling intentionally OR the report came back as
      // 'processing' (or with an unexpected/undefined status — we treat
      // that as "still working" so the user gets the spinner instead of an
      // empty modal). Otherwise we give up rather than polling forever.
      const looksProcessing =
        initial.status === "processing" || initial.status === undefined;
      if (!options?.pollUntilComplete && !looksProcessing) {
        setLoading(false);
        return;
      }

      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
        if (cancelRef.current.cancelled) return;
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        if (cancelRef.current.cancelled) return;
        const res = await pollOnce();
        if (!res.success) continue;
        if (res.status === "completed" && res.data) {
          setScanDetail(res.data);
          setLoading(false);
          return;
        }
        if (res.status === "failed") {
          setLoading(false);
          return;
        }
      }
      // Timed out.
      setLoading(false);
    },
    [],
  );

  // Cancel on unmount.
  useEffect(() => {
    return () => {
      cancelRef.current.cancelled = true;
      cancelRef.current.controller?.abort();
    };
  }, []);

  const value = useMemo<ScanDetailContextValue>(
    () => ({ openByScanId, close, isOpen: open }),
    [openByScanId, close, open],
  );

  return (
    <ctx.Provider value={value}>
      {children}
      {open && (
        <ScanDetailModal
          loading={loading}
          scanDetail={scanDetail}
          onClose={close}
        />
      )}
    </ctx.Provider>
  );
}

export function useScanDetail(): ScanDetailContextValue {
  const v = useContext(ctx);
  if (!v)
    throw new Error("useScanDetail must be used within ScanDetailProvider");
  return v;
}
