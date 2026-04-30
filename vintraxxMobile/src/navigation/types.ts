// Navigation types for VinTraxx SmartScan
import { ConditionReport } from '../models/ConditionReport';
import { Vehicle } from '../models/Vehicle';
import type { FullReportData, ScanSubmissionPayload } from '../types/api';
import { ScanResult } from '../services/scanner/ScannerService';

// Tab Navigator param list (Option B: 5 slots, centre is Scan).
// "Devices" replaces the old "Connect" tab and unifies BLE + GPS via an
// internal segmented control.
export type TabParamList = {
  Devices: { autoConnect?: boolean; autoScan?: boolean; segment?: 'bluetooth' | 'gps' } | undefined;
  History: undefined;
  // Center elevated button → routes to the existing `Scan` screen, but
  // smart-default may also send the user to LiveTrack or Appraisal.
  Scan: { vehicle?: Vehicle; autoStart?: boolean } | undefined;
  AppraisalTab: undefined;
  Schedule: { vin?: string; vehicle?: string; additionalNotes?: string } | undefined;
};

// Root Stack Navigator param list (includes tabs + modal screens)
export type RootStackParamList = {
  Login: undefined;
  DeviceSetup: undefined;
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
  /** Single alarm detail (deep-link target for FCM taps). */
  AlertDetail: { alarmId: string };
  /** Trips list for a terminal. */
  Trips: { terminalId: string };
  /** Single trip with map polyline, scrubber, and event pins. */
  TripDetail: { terminalId: string; tripId: string };
  /** GPS-detected DTC events (filterable by terminal). */
  DtcEvents: { terminalId?: string } | undefined;
  /** Single DTC event + "Run AI analysis" CTA. */
  DtcEventDetail: { dtcEventId: string };
};

// Combined navigation prop types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
