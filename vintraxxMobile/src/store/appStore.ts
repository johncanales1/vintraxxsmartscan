// Global App State Management using Zustand

import { create } from 'zustand';
import { Vehicle } from '../models/Vehicle';
import { ConditionReport } from '../models/ConditionReport';
import { BleDevice, BleConnectionState } from '../services/ble/types';
import { User, OBDDevice } from '../services/auth/AuthService';

export interface ScanProgress {
  step: string;
  progress: number;
  message: string;
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

  // DEV Actions
  setDevModeActivated: (activated) => set({ devModeActivated: activated }),

  // Reset
  reset: () => set(initialState),
}));
