// Integrated Scanner Service for VinTraxx SmartScan
// Orchestrates BLE connection, ELM327 initialization, and OBD commands

import { bleManager, BleManager } from '../ble/BleManager';
import { Elm327Service } from '../obd/Elm327';
import { ObdCommands } from '../obd/commands';
import { logger, LogCategory } from '../../utils/Logger';
import { debugLogger } from '../debug/DebugLogger';
import { BleDevice, BleConnectionState } from '../ble/types';
import { ParsedVin, ParsedDtc } from '../obd/types';
import { parseVIN, parseDTCs } from '../obd/parsers';

export interface ScanResult {
  vin: ParsedVin;
  storedDtcs: ParsedDtc[];
  pendingDtcs: ParsedDtc[];
  permanentDtcs: ParsedDtc[];
  milStatus: {
    milOn: boolean;
    dtcCount: number;
    raw: string;
  };
  distanceSinceCleared: number | null; // km
  timeSinceCleared: number | null; // minutes
  warmupsSinceCleared: number | null; // count
  distanceWithMILOn: number | null; // km
  fuelSystemStatus: { system1: number; system2: number } | null;
  secondaryAirStatus: number | null;
  odometer: number | null; // km
  odometerEcu?: string; // ECU that provided odometer (e.g., "77E" for cluster)
  // Per-ECU responses for FIXD-style display (e.g., "07E8: Off")
  milStatusByEcu?: Record<string, { milOn: boolean; dtcCount: number }>;
  distanceWithMILOnByEcu?: Record<string, number>; // km
  fuelSystemStatusByEcu?: Record<string, { system1: number; system2: number }>;
  secondaryAirStatusByEcu?: Record<string, number>;
  // Debug data - raw responses from scanner
  debugData?: {
    vinRaw: string;
    vinNormalized: string;
    storedDtcsRaw: string;
    storedDtcsNormalized: string;
    pendingDtcsRaw: string;
    pendingDtcsNormalized: string;
    milStatusRaw: string;
    milStatusNormalized: string;
    distanceRaw: string;
    distanceNormalized: string;
    timeRaw: string;
    timeNormalized: string;
    initCommands: Array<{ cmd: string; response: string; normalized: string }>;
  };
}

export type ScanStep = 
  | 'connecting'
  | 'initializing'
  | 'reading_vin'
  | 'reading_dtcs'
  | 'reading_mil'
  | 'reading_distance'
  | 'reading_time'
  | 'complete';

export interface ScanProgressCallback {
  (step: ScanStep, progress: number, message: string): void;
}

export class ScannerService {
  private static instance: ScannerService;
  private bleManager: BleManager;
  private elm327: Elm327Service | null = null;
  private obdCommands: ObdCommands | null = null;
  private scanCancelled: boolean = false;

  private constructor() {
    this.bleManager = bleManager;
  }

  static getInstance(): ScannerService {
    if (!ScannerService.instance) {
      ScannerService.instance = new ScannerService();
    }
    return ScannerService.instance;
  }

  /**
   * Start scanning for BLE devices
   */
  async startDeviceScan(
    onDeviceFound: (devices: BleDevice[]) => void,
    filterByName?: string
  ): Promise<void> {
    logger.info(LogCategory.APP, 'Starting device scan', { filterByName });
    await this.bleManager.startScan(onDeviceFound, filterByName);
  }

  /**
   * Stop scanning for BLE devices
   */
  stopDeviceScan(): void {
    logger.info(LogCategory.APP, 'Stopping device scan');
    this.bleManager.stopScan();
  }

  /**
   * Connect to a BLE device
   */
  async connectToDevice(deviceId: string): Promise<void> {
    logger.info(LogCategory.APP, `Connecting to device: ${deviceId}`);
    await this.bleManager.connect(deviceId);
  }

  /**
   * Disconnect from current device
   */
  async disconnect(): Promise<void> {
    logger.info(LogCategory.APP, 'Disconnecting from device');
    
    if (this.elm327) {
      this.elm327.reset();
      this.elm327 = null;
    }
    
    this.obdCommands = null;
    await this.bleManager.disconnect();
  }

  /**
   * Check if connected to a device
   */
  isConnected(): boolean {
    return this.bleManager.isConnected();
  }

  /**
   * Get current connection state
   */
  getConnectionState(): BleConnectionState {
    return this.bleManager.getConnectionState();
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionStateChange(listener: (state: BleConnectionState) => void): () => void {
    return this.bleManager.onConnectionStateChange(listener);
  }

  /**
   * Perform a complete vehicle scan
   */
  async performScan(
    onProgress?: ScanProgressCallback,
    collectDebugData: boolean = true
  ): Promise<ScanResult> {
    // Reset cancellation flag
    this.scanCancelled = false;
    
    // Start debug logging session
    debugLogger.startSession();
    debugLogger.logEvent('Scan started', { collectDebugData });
    
    logger.info(LogCategory.APP, 'Starting vehicle scan', { collectDebugData });

    if (!this.bleManager.isConnected()) {
      debugLogger.logError('Scan failed: No device connected');
      throw new Error('No device connected. Connect to a BLE device first.');
    }

    // Initialize debug data collection
    const debugData = collectDebugData ? {
      vinRaw: '',
      vinNormalized: '',
      storedDtcsRaw: '',
      storedDtcsNormalized: '',
      pendingDtcsRaw: '',
      pendingDtcsNormalized: '',
      milStatusRaw: '',
      milStatusNormalized: '',
      distanceRaw: '',
      distanceNormalized: '',
      timeRaw: '',
      timeNormalized: '',
      initCommands: [] as Array<{ cmd: string; response: string; normalized: string }>,
    } : undefined;

    try {
      // Step 1: Initialize ELM327
      debugLogger.logEvent('Step 1: Initializing ELM327');
      onProgress?.('initializing', 10, 'Initializing OBD adapter...');
      
      if (!this.elm327) {
        this.elm327 = Elm327Service.getInstance(this.bleManager);
      }
      
      if (!this.elm327.isInitialized()) {
        await this.elm327.initialize();
      }
      
      debugLogger.logEvent('ELM327 initialized successfully');
      this.obdCommands = new ObdCommands(this.elm327);

      // Check for cancellation
      if (this.scanCancelled) {
        debugLogger.logEvent('Scan cancelled by user');
        throw new Error('Scan cancelled by user');
      }

      // Step 2: Read VIN
      debugLogger.logEvent('Step 2: Reading VIN');
      onProgress?.('reading_vin', 25, 'Reading Vehicle Identification Number...');
      const vinResult = await this.obdCommands.readVINWithRaw();
      const vin = vinResult.parsed;
      debugLogger.logEvent('VIN read complete', { valid: vin.valid, vin: vin.vin });
      
      if (debugData && vinResult.raw) {
        debugData.vinRaw = vinResult.raw.raw;
        debugData.vinNormalized = vinResult.raw.normalized;
      }
      
      if (!vin.valid) {
        logger.warn(LogCategory.APP, 'VIN read failed or invalid', { vin });
      }

      // Check for cancellation
      if (this.scanCancelled) {
        debugLogger.logEvent('Scan cancelled by user');
        throw new Error('Scan cancelled by user');
      }

      // Step 3: Read MIL status and DTC count
      onProgress?.('reading_mil', 70, 'Reading MIL status...');
      const milResult = await this.obdCommands.readMILStatusWithRaw();
      const milStatus = { milOn: milResult.parsed.milOn, dtcCount: milResult.parsed.dtcCount, raw: milResult.parsed.raw };
      const milStatusByEcu = milResult.parsed.byEcu;
      
      if (debugData && milResult.raw) {
        debugData.milStatusRaw = milResult.raw.raw;
        debugData.milStatusNormalized = milResult.raw.normalized;
      }

      // Check for cancellation
      if (this.scanCancelled) {
        debugLogger.logEvent('Scan cancelled by user');
        throw new Error('Scan cancelled by user');
      }

      // Step 4: Read stored DTCs
      onProgress?.('reading_dtcs', 55, 'Reading stored diagnostic codes...');
      const storedDtcsResult = await this.obdCommands.readStoredDTCsWithRaw();
      const storedDtcs = storedDtcsResult.parsed;
      
      if (debugData && storedDtcsResult.raw) {
        debugData.storedDtcsRaw = storedDtcsResult.raw.raw;
        debugData.storedDtcsNormalized = storedDtcsResult.raw.normalized;
      }

      // Step 5: Read pending DTCs
      onProgress?.('reading_dtcs', 65, 'Reading pending diagnostic codes...');
      const pendingDtcsResult = await this.obdCommands.readPendingDTCsWithRaw();
      const pendingDtcs = pendingDtcsResult.parsed;
      
      if (debugData && pendingDtcsResult.raw) {
        debugData.pendingDtcsRaw = pendingDtcsResult.raw.raw;
        debugData.pendingDtcsNormalized = pendingDtcsResult.raw.normalized;
      }

      // Step 6: Read permanent DTCs (optional, may not be supported)
      onProgress?.('reading_dtcs', 75, 'Reading permanent diagnostic codes...');
      let permanentDtcs: ParsedDtc[] = [];
      try {
        permanentDtcs = await this.obdCommands.readPermanentDTCs();
      } catch (error) {
        logger.warn(LogCategory.APP, 'Permanent DTCs not supported or failed', error);
      }

      // Step 7: Read distance since codes cleared
      onProgress?.('reading_distance', 85, 'Reading distance since codes cleared...');
      const distanceResult = await this.obdCommands.readDistanceSinceClearedWithRaw();
      const distanceSinceCleared = distanceResult.parsed;
      
      if (debugData && distanceResult.raw) {
        debugData.distanceRaw = distanceResult.raw.raw;
        debugData.distanceNormalized = distanceResult.raw.normalized;
      }

      // Step 8: Read time since codes cleared
      onProgress?.('reading_time', 90, 'Reading time since codes cleared...');
      const timeResult = await this.obdCommands.readTimeSinceClearedWithRaw();
      const timeSinceCleared = timeResult.parsed;
      
      if (debugData && timeResult.raw) {
        debugData.timeRaw = timeResult.raw.raw;
        debugData.timeNormalized = timeResult.raw.normalized;
      }

      // Step 9: Read warmups since codes cleared
      debugLogger.logEvent('Step 9: Reading warmups since codes cleared');
      let warmupsSinceCleared: number | null = null;
      try {
        warmupsSinceCleared = await this.obdCommands.readWarmupsSinceCleared();
        if (warmupsSinceCleared !== null) {
          debugLogger.logEvent('Warmups read successfully', { warmups: warmupsSinceCleared });
        }
      } catch (error) {
        debugLogger.logError('Warmups read failed', error);
        logger.warn(LogCategory.APP, 'Warmups not supported or failed', error);
      }

      // Step 10: Read distance with MIL on
      debugLogger.logEvent('Step 10: Reading distance with MIL on');
      let distanceWithMILOn: number | null = null;
      let distanceWithMILOnByEcu: Record<string, number> = {};
      try {
        const distWithMilResult = await this.obdCommands.readDistanceWithMILOn();
        distanceWithMILOn = distWithMilResult.overall;
        distanceWithMILOnByEcu = distWithMilResult.byEcu;
        if (distanceWithMILOn !== null) {
          debugLogger.logEvent('Distance with MIL on read successfully', { km: distanceWithMILOn });
        }
      } catch (error) {
        debugLogger.logError('Distance with MIL on read failed', error);
        logger.warn(LogCategory.APP, 'Distance with MIL on not supported or failed', error);
      }

      // Step 11: Read fuel system status (Loop Status)
      debugLogger.logEvent('Step 11: Reading fuel system status');
      let fuelSystemStatus: { system1: number; system2: number } | null = null;
      let fuelSystemStatusByEcu: Record<string, { system1: number; system2: number }> = {};
      try {
        const fuelSysResult = await this.obdCommands.readFuelSystemStatus();
        fuelSystemStatus = fuelSysResult.overall;
        fuelSystemStatusByEcu = fuelSysResult.byEcu;
        if (fuelSystemStatus !== null) {
          debugLogger.logEvent('Fuel system status read successfully', fuelSystemStatus);
        }
      } catch (error) {
        debugLogger.logError('Fuel system status read failed', error);
        logger.warn(LogCategory.APP, 'Fuel system status not supported or failed', error);
      }

      // Step 12: Read secondary air status
      debugLogger.logEvent('Step 12: Reading secondary air status');
      let secondaryAirStatus: number | null = null;
      let secondaryAirStatusByEcu: Record<string, number> = {};
      try {
        const secAirResult = await this.obdCommands.readSecondaryAirStatus();
        secondaryAirStatus = secAirResult.overall;
        secondaryAirStatusByEcu = secAirResult.byEcu;
        if (secondaryAirStatus !== null) {
          debugLogger.logEvent('Secondary air status read successfully', { status: secondaryAirStatus });
        }
      } catch (error) {
        debugLogger.logError('Secondary air status read failed', error);
        logger.warn(LogCategory.APP, 'Secondary air status not supported or failed', error);
      }

      // Step 13: Read odometer (optional, may not be supported)
      // Pass VIN to enable manufacturer-specific DID filtering
      debugLogger.logEvent('Step 13: Reading odometer');
      onProgress?.('reading_distance', 95, 'Reading odometer...');
      let odometer: number | null = null;
      let odometerEcu: string | undefined = undefined;
      try {
        const odometerResult = await this.obdCommands.readOdometer(vin.valid ? vin.vin : undefined);
        if (odometerResult !== null) {
          odometer = odometerResult.km;
          odometerEcu = odometerResult.ecu;
          debugLogger.logEvent('Odometer read successfully', { km: odometer, ecu: odometerEcu });
        } else {
          debugLogger.logEvent('Odometer not supported by vehicle');
        }
      } catch (error) {
        debugLogger.logError('Odometer read failed', error);
        logger.warn(LogCategory.APP, 'Odometer not supported or failed', error);
      }

      // Complete
      onProgress?.('complete', 100, 'Scan complete!');

      const result: ScanResult = {
        vin,
        storedDtcs,
        pendingDtcs,
        permanentDtcs,
        milStatus,
        distanceSinceCleared,
        timeSinceCleared,
        warmupsSinceCleared,
        distanceWithMILOn,
        fuelSystemStatus,
        secondaryAirStatus,
        odometer,
        odometerEcu,
        milStatusByEcu,
        distanceWithMILOnByEcu,
        fuelSystemStatusByEcu,
        secondaryAirStatusByEcu,
        debugData,
      };

      logger.info(LogCategory.APP, 'Scan completed successfully', {
        vinValid: vin.valid,
        storedDtcCount: storedDtcs.length,
        pendingDtcCount: pendingDtcs.length,
        milOn: milStatus.milOn,
      });

      debugLogger.logEvent('Scan completed successfully');
      return result;
    } catch (error) {
      debugLogger.logError('Scan failed', error);
      logger.error(LogCategory.APP, 'Scan failed', error);
      throw error;
    }
  }

  /**
   * Cancel ongoing scan
   */
  cancelScan(): void {
    logger.info(LogCategory.APP, 'Cancelling scan');
    debugLogger.logEvent('Scan cancellation requested');
    this.scanCancelled = true;
  }

  /**
   * Clear diagnostic trouble codes
   */
  async clearDTCs(): Promise<boolean> {
    logger.info(LogCategory.APP, 'Clearing DTCs');

    if (!this.obdCommands) {
      throw new Error('OBD commands not initialized. Perform a scan first.');
    }

    return await this.obdCommands.clearDTCs();
  }

  /**
   * Get discovered BLE services (for diagnostics)
   */
  async getDiscoveredServices() {
    return await this.bleManager.getDiscoveredServices();
  }

  /**
   * Get connected device info
   */
  getConnectedDevice() {
    return this.bleManager.getConnectedDevice();
  }

  /**
   * Get ELM327 protocol info
   */
  getProtocolInfo(): string | null {
    return this.elm327?.getProtocol() || null;
  }
}

export const scannerService = ScannerService.getInstance();
