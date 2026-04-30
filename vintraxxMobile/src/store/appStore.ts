// Global App State Management using Zustand

import { create } from 'zustand';
import { Vehicle } from '../models/Vehicle';
import { ConditionReport } from '../models/ConditionReport';
import { BleDevice, BleConnectionState } from '../services/ble/types';
import { User, OBDDevice } from '../services/auth/AuthService';
import type { AiValuationOutput } from '../types/api';
import type {
  GpsTerminal,
  GpsLocation,
  GpsAlarm,
  GpsDtcEvent,
  WsLocationUpdate,
} from '../types/gps';

export interface ScanProgress {
  step: string;
  progress: number;
  message: string;
}

export interface SavedAppraisal {
  id: string;
  vehicle: Vehicle;
  mileage: number;
  condition: 'clean' | 'average' | 'rough';
  zipCode?: string;
  notes?: string;
  valuation: AiValuationOutput;
  healthScore?: number;
  photoUris: string[];
  createdAt: Date;
}

interface AppState {
  // User & Auth State
  user: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  userDevice: OBDDevice | null;
  deviceSetupCompleted: boolean;
  
  // BLE State
  selectedBleDevice: BleDevice | null;
  connectionState: BleConnectionState;
  isScanning: boolean;
  discoveredDevices: BleDevice[];

  // Vehicle State
  selectedVehicle: Vehicle | null;
  
  // Scan State
  isPerformingScan: boolean;
  scanProgress: ScanProgress | null;
  currentReport: ConditionReport | null;
  
  // History
  savedReports: ConditionReport[];
  savedAppraisals: SavedAppraisal[];

  // GPS State (Phase 5: live fleet)
  gpsTerminals: GpsTerminal[];
  /** Currently focused terminal — drives LiveTrack default + smart-scan
   *  default for the elevated tab-bar button. */
  selectedTerminalId: string | null;
  /** Latest known location per terminal, kept fresh by WebSocket. */
  gpsLatestLocations: Record<string, GpsLocation>;
  /** Open + recent alarms — the Alerts tab reads from this. WS appends. */
  gpsAlarms: GpsAlarm[];
  /** Recent GPS-detected DTC events for the History tab. */
  gpsDtcEvents: GpsDtcEvent[];
  /** Tracks the last action a user took with the elevated Scan button so
   *  the smart-default points back at it on subsequent taps. */
  lastPrimaryAction: 'ble-scan' | 'go-live' | 'appraisal' | null;
  
  // DEV Settings
  devModeActivated: boolean;
  
  // Actions
  // Auth Actions
  setUser: (user: User | null) => void;
  setIsAuthenticated: (authenticated: boolean) => void;
  setIsAuthLoading: (loading: boolean) => void;
  setUserDevice: (device: OBDDevice | null) => void;
  setDeviceSetupCompleted: (completed: boolean) => void;
  
  // BLE Actions
  setSelectedBleDevice: (device: BleDevice | null) => void;
  setConnectionState: (state: BleConnectionState) => void;
  setIsScanning: (scanning: boolean) => void;
  setDiscoveredDevices: (devices: BleDevice[]) => void;
  addDiscoveredDevice: (device: BleDevice) => void;
  
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  
  setIsPerformingScan: (scanning: boolean) => void;
  setScanProgress: (progress: ScanProgress | null) => void;
  setCurrentReport: (report: ConditionReport | null) => void;
  
  setSavedReports: (reports: ConditionReport[]) => void;
  addSavedReport: (report: ConditionReport) => void;
  updateSavedReport: (reportId: string, updatedReport: ConditionReport) => void;
  removeSavedReport: (reportId: string) => void;
  
  addSavedAppraisal: (appraisal: SavedAppraisal) => void;
  removeSavedAppraisal: (appraisalId: string) => void;

  // GPS Actions
  setGpsTerminals: (terminals: GpsTerminal[]) => void;
  upsertGpsTerminal: (terminal: GpsTerminal) => void;
  setSelectedTerminalId: (id: string | null) => void;
  applyLocationUpdate: (event: WsLocationUpdate) => void;
  setGpsLatestLocation: (terminalId: string, location: GpsLocation) => void;
  setGpsAlarms: (alarms: GpsAlarm[]) => void;
  addGpsAlarm: (alarm: GpsAlarm) => void;
  updateGpsAlarm: (alarmId: string, patch: Partial<GpsAlarm>) => void;
  setGpsDtcEvents: (events: GpsDtcEvent[]) => void;
  addGpsDtcEvent: (event: GpsDtcEvent) => void;
  setLastPrimaryAction: (action: AppState['lastPrimaryAction']) => void;
  
  // DEV Actions
  setDevModeActivated: (activated: boolean) => void;
  
  reset: () => void;
}

const initialState = {
  user: null,
  isAuthenticated: false,
  isAuthLoading: true,
  userDevice: null,
  deviceSetupCompleted: false,
  selectedBleDevice: null,
  connectionState: BleConnectionState.DISCONNECTED,
  isScanning: false,
  discoveredDevices: [],
  selectedVehicle: null,
  isPerformingScan: false,
  scanProgress: null,
  currentReport: null,
  savedReports: [],
  savedAppraisals: [],
  // GPS slice
  gpsTerminals: [] as GpsTerminal[],
  selectedTerminalId: null as string | null,
  gpsLatestLocations: {} as Record<string, GpsLocation>,
  gpsAlarms: [] as GpsAlarm[],
  gpsDtcEvents: [] as GpsDtcEvent[],
  lastPrimaryAction: null as AppState['lastPrimaryAction'],
  devModeActivated: false,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  // Auth Actions
  setUser: (user) => set({ user, isAuthenticated: user !== null }),
  setIsAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  setIsAuthLoading: (loading) => set({ isAuthLoading: loading }),
  setUserDevice: (device) => set({ userDevice: device }),
  setDeviceSetupCompleted: (completed) => set({ deviceSetupCompleted: completed }),

  // BLE Actions
  setSelectedBleDevice: (device) => set({ selectedBleDevice: device }),
  
  setConnectionState: (state) => set({ connectionState: state }),
  
  setIsScanning: (scanning) => set({ isScanning: scanning }),
  
  setDiscoveredDevices: (devices) => set({ discoveredDevices: devices }),
  
  addDiscoveredDevice: (device) =>
    set((state) => {
      const exists = state.discoveredDevices.find((d) => d.id === device.id);
      if (exists) {
        return {
          discoveredDevices: state.discoveredDevices.map((d) =>
            d.id === device.id ? device : d
          ),
        };
      }
      return {
        discoveredDevices: [...state.discoveredDevices, device],
      };
    }),

  // Vehicle Actions
  setSelectedVehicle: (vehicle) => set({ selectedVehicle: vehicle }),

  // Scan Actions
  setIsPerformingScan: (scanning) => set({ isPerformingScan: scanning }),
  
  setScanProgress: (progress) => set({ scanProgress: progress }),
  
  setCurrentReport: (report) => set({ currentReport: report }),

  // History Actions
  setSavedReports: (reports) => set({ savedReports: reports }),
  
  addSavedReport: (report) =>
    set((state) => ({
      savedReports: [report, ...state.savedReports],
    })),

  updateSavedReport: (reportId, updatedReport) =>
    set((state) => ({
      savedReports: state.savedReports.map((r) =>
        r.id === reportId ? updatedReport : r
      ),
    })),

  removeSavedReport: (reportId) =>
    set((state) => ({
      savedReports: state.savedReports.filter((r) => r.id !== reportId),
    })),

  addSavedAppraisal: (appraisal) =>
    set((state) => ({
      savedAppraisals: [appraisal, ...state.savedAppraisals],
    })),

  removeSavedAppraisal: (appraisalId) =>
    set((state) => ({
      savedAppraisals: state.savedAppraisals.filter((a) => a.id !== appraisalId),
    })),

  // GPS Actions
  setGpsTerminals: (terminals) => set({ gpsTerminals: terminals }),

  upsertGpsTerminal: (terminal) =>
    set((state) => {
      const idx = state.gpsTerminals.findIndex((t) => t.id === terminal.id);
      if (idx === -1) {
        return { gpsTerminals: [terminal, ...state.gpsTerminals] };
      }
      const next = [...state.gpsTerminals];
      next[idx] = { ...next[idx], ...terminal };
      return { gpsTerminals: next };
    }),

  setSelectedTerminalId: (id) => set({ selectedTerminalId: id }),

  applyLocationUpdate: (event) =>
    set((state) => {
      // Synthesize a partial GpsLocation from the WS payload so callers
      // can render gauges without a re-fetch. WS frames omit some fields
      // that REST returns (no `id`, no DB-side received-at) — we patch
      // those with a synthetic id and "now" so the type stays satisfied.
      const synthetic: GpsLocation = {
        id: `ws-${event.terminalId}-${event.data.reportedAt}`,
        terminalId: event.terminalId,
        reportedAt: event.data.reportedAt,
        serverReceivedAt: new Date().toISOString(),
        latitude: event.data.latitude,
        longitude: event.data.longitude,
        altitudeM: event.data.altitudeM,
        speedKmh: event.data.speedKmh,
        heading: event.data.heading,
        alarmBits: event.data.alarmBits,
        statusBits: event.data.statusBits,
        accOn: event.data.accOn,
        gpsFix: event.data.gpsFix,
        satelliteCount: null,
        signalStrength: null,
        odometerKm: null,
        fuelLevelPct: null,
        externalVoltageMv: null,
        batteryVoltageMv: null,
      };
      return {
        gpsLatestLocations: {
          ...state.gpsLatestLocations,
          [event.terminalId]: synthetic,
        },
      };
    }),

  setGpsLatestLocation: (terminalId, location) =>
    set((state) => ({
      gpsLatestLocations: { ...state.gpsLatestLocations, [terminalId]: location },
    })),

  setGpsAlarms: (alarms) => set({ gpsAlarms: alarms }),

  addGpsAlarm: (alarm) =>
    set((state) => {
      // Dedup on id — WS may push the same alarm again on reconnect/replay.
      if (state.gpsAlarms.some((a) => a.id === alarm.id)) return {};
      return { gpsAlarms: [alarm, ...state.gpsAlarms] };
    }),

  updateGpsAlarm: (alarmId, patch) =>
    set((state) => ({
      gpsAlarms: state.gpsAlarms.map((a) =>
        a.id === alarmId ? { ...a, ...patch } : a,
      ),
    })),

  setGpsDtcEvents: (events) => set({ gpsDtcEvents: events }),

  addGpsDtcEvent: (event) =>
    set((state) => {
      if (state.gpsDtcEvents.some((e) => e.id === event.id)) return {};
      return { gpsDtcEvents: [event, ...state.gpsDtcEvents] };
    }),

  setLastPrimaryAction: (action) => set({ lastPrimaryAction: action }),

  // DEV Actions
  setDevModeActivated: (activated) => set({ devModeActivated: activated }),

  // Reset
  reset: () => set(initialState),
}));
