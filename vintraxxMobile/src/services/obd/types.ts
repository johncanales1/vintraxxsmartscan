// OBD-II Type definitions for VinTraxx SmartScan

export enum ObdMode {
  SHOW_CURRENT_DATA = '01',
  SHOW_FREEZE_FRAME = '02',
  SHOW_STORED_DTC = '03',
  CLEAR_DTC = '04',
  TEST_RESULTS_O2 = '05',
  TEST_RESULTS_OTHER = '06',
  SHOW_PENDING_DTC = '07',
  CONTROL_OPERATION = '08',
  REQUEST_VEHICLE_INFO = '09',
  PERMANENT_DTC = '0A',
}

export enum ObdPid {
  VIN = '02',
  CALIBRATION_ID = '04',
  CVN = '06',
}

export interface ObdCommand {
  mode: ObdMode | string;
  pid?: string;
  description: string;
}

export interface ObdResponse {
  raw: string;
  normalized: string;
  success: boolean;
  error?: string;
}

export interface ParsedVin {
  vin: string;
  valid: boolean;
  error?: string;
}

export interface ParsedDtc {
  code: string;
  description: string;
  type: 'P' | 'C' | 'B' | 'U';
  category: string;
}

export const ELM327_RESPONSES = {
  OK: 'OK',
  ERROR: 'ERROR',
  NO_DATA: 'NO DATA',
  SEARCHING: 'SEARCHING',
  UNABLE_TO_CONNECT: 'UNABLE TO CONNECT',
  BUS_INIT_ERROR: 'BUS INIT',
  CAN_ERROR: 'CAN ERROR',
  STOPPED: 'STOPPED',
};

export const ELM327_INIT_COMMANDS = [
  { cmd: 'ATZ', desc: 'Reset adapter', expectedResponse: 'ELM327' },
  { cmd: 'ATE0', desc: 'Echo off', expectedResponse: 'OK' },
  { cmd: 'ATL0', desc: 'Linefeeds off', expectedResponse: 'OK' },
  { cmd: 'ATH1', desc: 'Headers on (needed for multi-frame parsing)', expectedResponse: 'OK' },
  { cmd: 'ATS1', desc: 'Spaces on (needed for parsing)', expectedResponse: 'OK' },
  { cmd: 'ATST FF', desc: 'Set timeout to maximum (255 * 4ms = 1020ms)', expectedResponse: 'OK' },
  { cmd: 'ATAT1', desc: 'Enable adaptive timing for better compatibility', expectedResponse: 'OK' },
  { cmd: 'ATSP0', desc: 'Auto protocol detection', expectedResponse: 'OK' },
];
