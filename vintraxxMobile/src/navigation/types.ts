// Navigation types for VinTraxx SmartScan
import { ConditionReport } from '../models/ConditionReport';
import { Vehicle } from '../models/Vehicle';
import type { FullReportData, ScanSubmissionPayload } from '../types/api';
import { ScanResult } from '../services/scanner/ScannerService';

// Tab Navigator param list
export type TabParamList = {
  Connect: { autoConnect?: boolean; autoScan?: boolean } | undefined;
  Scan: { vehicle?: Vehicle; autoStart?: boolean } | undefined;
  History: undefined;
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
  FullReport: { scanResult: ScanResult; vehicle: Vehicle; conditionReport?: ConditionReport };
  FullReportView: { reportData: FullReportData };
};

// Combined navigation prop types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
