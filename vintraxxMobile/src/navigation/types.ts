// Navigation types for VinTraxx SmartScan
import { ConditionReport } from '../models/ConditionReport';
import { Vehicle } from '../models/Vehicle';
import type { FullReportData, ScanSubmissionPayload } from '../types/api';
import { ScanResult } from '../services/scanner/ScannerService';

// Legacy unified Tab param list — kept for backward compatibility.
export type TabParamList = {
  Devices: { autoConnect?: boolean; autoScan?: boolean; segment?: 'bluetooth' | 'gps' } | undefined;
  History: undefined;
  Scan: { vehicle?: Vehicle; autoStart?: boolean } | undefined;
  AppraisalTab: undefined;
  Schedule: { vin?: string; vehicle?: string; additionalNotes?: string } | undefined;
};

// ── BLE Tab Navigator (5 tabs — no GPS) ─────────────────────────────────
export type BleTabParamList = {
  Devices: { autoConnect?: boolean; autoScan?: boolean } | undefined;
  Scan: { vehicle?: Vehicle; autoStart?: boolean } | undefined;
  AppraisalTab: undefined;
  Schedule: { vin?: string; vehicle?: string; additionalNotes?: string } | undefined;
  History: undefined;
};

// ── GPS Tab Navigator (3 tabs) ──────────────────────────────────────────
export type GpsTabParamList = {
  GpsScanTab: undefined;
  GpsLiveMap: undefined;
  GpsHistory: undefined;
};

// Root Stack Navigator param list (includes tabs + modal screens)
export type RootStackParamList = {
  Login: undefined;
  WorkflowSelector: undefined;
  DeviceSetup: undefined;
  BleMain: {
    screen?: keyof BleTabParamList;
    params?: BleTabParamList[keyof BleTabParamList];
  } | undefined;
  GpsMain: {
    screen?: keyof GpsTabParamList;
    params?: GpsTabParamList[keyof GpsTabParamList];
  } | undefined;
  // Legacy — kept so existing deep-links don't break during migration.
  Main: { 
    screen?: keyof TabParamList;
    params?: TabParamList[keyof TabParamList];
  } | undefined;
  Report: { report?: ConditionReport };
  // FullReport accepts two distinct shapes (BLE scan flow vs. GPS-DTC AI
  // bridge). We list every field optional and rely on the screen to
  // discriminate via `prefetchedReport`. See FullReportScreen for the
  // contract.
  FullReport: {
    scanResult?: ScanResult;
    vehicle?: Vehicle;
    conditionReport?: ConditionReport;
    stockNumber?: string;
    additionalRepairs?: string[];
    vehicleOwnerName?: string;
    scannerOwnerName?: string;
    /** Pre-fetched final report (Phase 5 GPS-DTC AI bridge). */
    prefetchedReport?: FullReportData;
    /** ScanId the prefetched report came from (enables retry). */
    prefetchedScanId?: string;
  };
  // (Bug #M3) `FullReportView` removed — it was declared but never registered
  // in any navigator and never navigated to from any screen.
  Appraiser: { scanResult?: ScanResult; vehicle?: Vehicle; conditionReport?: ConditionReport } | undefined;
  VinScanner: { onVinScanned: (vin: string) => void };

  // ── GPS / Phase 5 stack screens ──────────────────────────────────────
  /** Live tracking screen for a single GPS terminal. */
  LiveTrack: { terminalId: string };
  /** Read-only device parameters + Request Live Position + Unpair stub. */
  DeviceSettings: { terminalId: string };
  /** Alerts inbox; optional terminalId filter when entered from a vehicle card. */
  Alerts: { terminalId?: string } | undefined;
  /** Single alarm detail (deep-link target for FCM taps).
   *  `terminalId` is forwarded from the FCM data payload so the screen can
   *  pre-populate optimistically without an extra API round-trip. */
  AlertDetail: { alarmId: string; terminalId?: string };
  /** Trips list for a terminal. */
  Trips: { terminalId: string };
  /** Single trip with map polyline, scrubber, and event pins. */
  TripDetail: { terminalId: string; tripId: string };
  /** GPS-detected DTC events (filterable by terminal). */
  DtcEvents: { terminalId?: string } | undefined;
  /** Single DTC event + "Run AI analysis" CTA. */
  DtcEventDetail: { dtcEventId: string };
  /** Full Scan Report — Refresh / Email / AI promotion. */
  GpsScanReport: { terminalId: string };
  /** GPS terminal detail with Run Full Scan / View Report / Email actions. */
  GpsTerminalDetail: { terminalId: string };
};

// Combined navigation prop types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
