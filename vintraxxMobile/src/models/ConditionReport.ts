// Condition Report model for VinTraxx SmartScan
// This is the main data model for a full vehicle scan report

import { Vehicle, mockVehicles } from './Vehicle';
import { DtcCode, mockDtcCodes, mockClearedCodes } from './DtcCode';
import { RepairItem, mockRepairItems, calculateTotalRepairCost } from './RepairItem';

export type EmissionsStatus = 'passed' | 'failed' | 'incomplete';

export interface EmissionsCheck {
  status: EmissionsStatus;
  totalMonitors: number;
  readyMonitors: number;
  notReadyMonitors: number;
  monitors: {
    name: string;
    status: 'ready' | 'not_ready' | 'not_applicable';
  }[];
}

export interface CodesLastReset {
  milesSinceReset: number;
  daysSinceReset: number;
  status: 'clear' | 'codes_present';
  note?: string;
}

export interface ConditionReport {
  id: string;
  vehicle: Vehicle;
  scanDate: Date;
  scanMileage: number | null;
  odometerEcu?: string; // ECU that provided odometer (e.g., "77E" for cluster)
  
  // Codes Last Reset section
  codesLastReset: CodesLastReset;
  
  // Diagnostic Trouble Codes
  activeDtcCodes: DtcCode[];
  pendingDtcCodes: DtcCode[];
  clearedDtcCodes: DtcCode[];
  
  // Emissions Check
  emissionsCheck: EmissionsCheck;
  
  // Repairs
  repairsNeeded: RepairItem[];
  totalRepairCost: number;
  topRepairCost: number;
  otherRepairsCost: number;
  
  // Additional scan data from OBD PIDs
  warmupsSinceCleared?: number;
  milesWithMILOn?: number; // in miles (converted from km)
  loopStatus?: string;
  secondaryAirStatus?: string;
  celStatus?: boolean; // from PID 0101 milOn
  dtcCountFromECU?: number; // from PID 0101 dtcCount
  
  // Per-ECU data for FIXD-style display (e.g., "07E8: Off")
  milStatusByEcu?: Record<string, { milOn: boolean; dtcCount: number }>;
  distanceWithMILOnByEcu?: Record<string, number>; // in miles (converted from km)
  fuelSystemStatusByEcu?: Record<string, { system1: number; system2: number }>;
  secondaryAirStatusByEcu?: Record<string, number>;
  
  // Additional metadata
  scannerSerialNumber?: string;
  technicianNotes?: string;
  additionalNotes?: string;
}


