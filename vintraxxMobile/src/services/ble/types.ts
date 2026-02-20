// BLE Type definitions for VinTraxx SmartScan

export interface BleDevice {
  id: string;
  name: string | null;
  rssi: number | null;
  isConnectable: boolean;
}

export interface BleCharacteristicInfo {
  uuid: string;
  serviceUUID: string;
  isReadable: boolean;
  isWritableWithResponse: boolean;
  isWritableWithoutResponse: boolean;
  isNotifiable: boolean;
  isIndicatable: boolean;
}

export interface BleServiceInfo {
  uuid: string;
  isPrimary: boolean;
  characteristics: BleCharacteristicInfo[];
}

export interface SelectedCharacteristics {
  write: BleCharacteristicInfo;
  notify: BleCharacteristicInfo;
  writeWithResponse: boolean;
}

export enum BleConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  DISCOVERING = 'DISCOVERING',
  CONNECTED = 'CONNECTED',
  DISCONNECTING = 'DISCONNECTING',
}

export interface BleCommand {
  id: string;
  command: string;
  resolve: (response: string) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
  sentAt: number;
}

export interface BleManagerConfig {
  commandTimeoutMs: number;
  maxRetries: number;
  scanTimeoutMs: number;
  connectionTimeoutMs: number;
  commandThrottleMs: number;
  autoReconnect: boolean;
  maxReconnectAttempts: number;
  reconnectDelayMs: number;
}

// Per-command timeout configuration
export interface CommandTimeouts {
  vin: number;        // VIN 0902: 25-30s
  dtc: number;        // DTCs 03, 07, 0A: 15s
  mode01: number;     // Mode 01 PIDs: 10-12s
  warmup: number;     // Warm-up 0100: 20s
  default: number;    // Default for other commands
}

export const DEFAULT_BLE_CONFIG: BleManagerConfig = {
  commandTimeoutMs: 15000, // Increased to 15s to allow ELM327 time to search for ECU
  maxRetries: 2,
  scanTimeoutMs: 10000,
  connectionTimeoutMs: 10000,
  commandThrottleMs: 300, // Increased to 300ms to prevent overwhelming scanner
  autoReconnect: true,
  maxReconnectAttempts: 3,
  reconnectDelayMs: 2000,
};

export const COMMAND_TIMEOUTS: CommandTimeouts = {
  vin: 30000,        // VIN 0902: 30s
  dtc: 15000,        // DTCs 03, 07, 0A: 15s
  mode01: 12000,     // Mode 01 PIDs (0101, 0131, 014D, 01A6): 12s
  warmup: 20000,     // Warm-up 0100: 20s
  default: 15000,    // Default for other commands
};

// Known OBD-II BLE service patterns
export const KNOWN_OBD_PATTERNS = {
  // Common UART-like service used by many BLE OBD adapters
  UART_SERVICE: 'fff0',
  UART_TX: 'fff1', // Notify characteristic
  UART_RX: 'fff2', // Write characteristic
  
  // Alternative patterns
  SERIAL_SERVICE: '0000ffe0-0000-1000-8000-00805f9b34fb',
  SERIAL_TX: '0000ffe1-0000-1000-8000-00805f9b34fb',
};
