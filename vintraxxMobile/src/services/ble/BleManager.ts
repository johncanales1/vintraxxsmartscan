// BLE Manager for VinTraxx SmartScan
// Handles device discovery, connection, characteristic discovery, and message framing

import { BleManager as RNBleManager, Device, Characteristic, State, Subscription } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';
import { logger, LogCategory } from '../../utils/Logger';
import { debugLogger } from '../debug/DebugLogger';
import {
  BleDevice,
  BleConnectionState,
  BleCommand,
  BleManagerConfig,
  DEFAULT_BLE_CONFIG,
  SelectedCharacteristics,
  BleServiceInfo,
  BleCharacteristicInfo,
  KNOWN_OBD_PATTERNS,
  COMMAND_TIMEOUTS,
} from './types';

export class BleManager {
  private static instance: BleManager;
  private manager: RNBleManager;
  private config: BleManagerConfig;
  
  private connectedDevice: Device | null = null;
  private selectedCharacteristics: SelectedCharacteristics | null = null;
  private connectionState: BleConnectionState = BleConnectionState.DISCONNECTED;
  
  private commandQueue: BleCommand[] = [];
  private currentCommand: BleCommand | null = null;
  private responseBuffer: string = '';
  
  private scanCallback: ((devices: BleDevice[]) => void) | null = null;
  private discoveredDevices: Map<string, BleDevice> = new Map();
  private scanTimeout: NodeJS.Timeout | null = null;
  
  private connectionStateListeners: Set<(state: BleConnectionState) => void> = new Set();
  private notificationSubscription: Subscription | null = null;
  
  private lastConnectedDeviceId: string | null = null;
  private reconnectAttempts: number = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isReconnecting: boolean = false;

  private constructor(config: Partial<BleManagerConfig> = {}) {
    this.config = { ...DEFAULT_BLE_CONFIG, ...config };
    this.manager = new RNBleManager();
    this.setupBleManager();
  }

  static getInstance(config?: Partial<BleManagerConfig>): BleManager {
    if (!BleManager.instance) {
      BleManager.instance = new BleManager(config);
    }
    return BleManager.instance;
  }

  private setupBleManager() {
    this.manager.onStateChange((state: State) => {
      logger.info(LogCategory.BLE, `Bluetooth state changed: ${state}`);
      if (state === State.PoweredOn) {
        logger.info(LogCategory.BLE, 'Bluetooth is ready');
      }
    }, true);
  }

  private setConnectionState(state: BleConnectionState) {
    this.connectionState = state;
    logger.info(LogCategory.BLE, `Connection state: ${state}`);
    this.connectionStateListeners.forEach(listener => listener(state));
  }

  onConnectionStateChange(listener: (state: BleConnectionState) => void): () => void {
    this.connectionStateListeners.add(listener);
    return () => this.connectionStateListeners.delete(listener);
  }

  getConnectionState(): BleConnectionState {
    return this.connectionState;
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);
        return (
          granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true;
  }

  async startScan(
    onDeviceFound: (devices: BleDevice[]) => void,
    filterByName?: string
  ): Promise<void> {
    logger.info(LogCategory.BLE, 'Starting BLE scan', { filterByName });

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Bluetooth permissions not granted');
    }

    const state = await this.manager.state();
    if (state !== State.PoweredOn) {
      throw new Error(`Bluetooth is not powered on. Current state: ${state}`);
    }

    this.discoveredDevices.clear();
    this.scanCallback = onDeviceFound;

    this.manager.startDeviceScan(null, null, (error: any, device: Device | null) => {
      if (error) {
        logger.error(LogCategory.BLE, 'Scan error', error);
        this.stopScan();
        return;
      }

      if (device && device.name) {
        const shouldInclude = !filterByName || 
          device.name.toUpperCase().includes(filterByName.toUpperCase());

        if (shouldInclude) {
          const bleDevice: BleDevice = {
            id: device.id,
            name: device.name,
            rssi: device.rssi,
            isConnectable: device.isConnectable ?? true,
          };

          this.discoveredDevices.set(device.id, bleDevice);
          logger.debug(LogCategory.BLE, `Found device: ${device.name}`, {
            id: device.id,
            rssi: device.rssi,
          });

          if (this.scanCallback) {
            this.scanCallback(Array.from(this.discoveredDevices.values()));
          }
        }
      }
    });

    this.scanTimeout = setTimeout(() => {
      logger.info(LogCategory.BLE, 'Scan timeout reached');
      this.stopScan();
    }, this.config.scanTimeoutMs);
  }

  stopScan(): void {
    logger.info(LogCategory.BLE, 'Stopping BLE scan');
    this.manager.stopDeviceScan();
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
  }

  async connect(deviceId: string): Promise<void> {
    logger.info(LogCategory.BLE, `Connecting to device: ${deviceId}`);
    // Start debug session when BLE connection begins (preserves existing logs)
    debugLogger.startSession();
    debugLogger.logEvent('BLE connection initiated', { deviceId });
    this.setConnectionState(BleConnectionState.CONNECTING);

    try {
      this.stopScan();

      const device = await this.manager.connectToDevice(deviceId, {
        timeout: this.config.connectionTimeoutMs,
      });

      this.connectedDevice = device;
      this.lastConnectedDeviceId = deviceId;
      this.reconnectAttempts = 0;
      logger.info(LogCategory.BLE, `Connected to ${device.name || device.id}`);
      debugLogger.logEvent('BLE connected', { deviceName: device.name, deviceId: device.id });

      device.onDisconnected((error: any, disconnectedDevice: Device | null) => {
        logger.warn(LogCategory.BLE, 'Device disconnected', {
          name: disconnectedDevice?.name,
          error: error?.message,
        });
        this.handleDisconnection();
        
        // Attempt auto-reconnect if enabled and not user-initiated disconnect
        if (this.config.autoReconnect && this.lastConnectedDeviceId && !this.isReconnecting) {
          this.attemptReconnect();
        }
      });

      this.setConnectionState(BleConnectionState.DISCOVERING);
      await this.discoverServicesAndCharacteristics();

      this.setConnectionState(BleConnectionState.CONNECTED);
      logger.info(LogCategory.BLE, 'Device ready for communication');
    } catch (error) {
      logger.error(LogCategory.BLE, 'Connection failed', error);
      this.setConnectionState(BleConnectionState.DISCONNECTED);
      throw error;
    }
  }

  private async discoverServicesAndCharacteristics(): Promise<void> {
    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }

    logger.info(LogCategory.BLE, 'Discovering services and characteristics');

    await this.connectedDevice.discoverAllServicesAndCharacteristics();
    const services = await this.connectedDevice.services();

    logger.info(LogCategory.BLE, `Found ${services.length} services`);

    const serviceInfos: BleServiceInfo[] = [];

    for (const service of services) {
      const characteristics = await service.characteristics();
      const charInfos: BleCharacteristicInfo[] = characteristics.map((char: Characteristic) => ({
        uuid: char.uuid.toLowerCase(),
        serviceUUID: service.uuid.toLowerCase(),
        isReadable: char.isReadable,
        isWritableWithResponse: char.isWritableWithResponse,
        isWritableWithoutResponse: char.isWritableWithoutResponse,
        isNotifiable: char.isNotifiable,
        isIndicatable: char.isIndicatable,
      }));

      serviceInfos.push({
        uuid: service.uuid.toLowerCase(),
        isPrimary: service.isPrimary,
        characteristics: charInfos,
      });

      // Log each service and its characteristics with properties
      logger.info(LogCategory.BLE, `Service: ${service.uuid}`, {
        isPrimary: service.isPrimary,
        characteristicCount: charInfos.length,
      });
      
      for (const charInfo of charInfos) {
        const props: string[] = [];
        if (charInfo.isReadable) props.push('R');
        if (charInfo.isWritableWithResponse) props.push('W');
        if (charInfo.isWritableWithoutResponse) props.push('WNR');
        if (charInfo.isNotifiable) props.push('N');
        if (charInfo.isIndicatable) props.push('I');
        
        logger.info(LogCategory.BLE, `  Char: ${charInfo.uuid} [${props.join(',')}]`);
      }
    }

    this.selectedCharacteristics = this.selectCharacteristics(serviceInfos);

    if (!this.selectedCharacteristics) {
      logger.error(LogCategory.BLE, 'No suitable characteristics found. Available services:', {
        services: serviceInfos.map(s => ({
          uuid: s.uuid,
          chars: s.characteristics.map(c => c.uuid),
        })),
      });
      throw new Error('Could not find suitable write and notify characteristics. Check logs for available services.');
    }

    logger.info(LogCategory.BLE, 'Selected characteristics for OBD communication', {
      writeUUID: this.selectedCharacteristics.write.uuid,
      writeService: this.selectedCharacteristics.write.serviceUUID,
      notifyUUID: this.selectedCharacteristics.notify.uuid,
      notifyService: this.selectedCharacteristics.notify.serviceUUID,
      writeWithResponse: this.selectedCharacteristics.writeWithResponse,
    });

    await this.setupNotifications();
  }

  private selectCharacteristics(services: BleServiceInfo[]): SelectedCharacteristics | null {
    logger.info(LogCategory.BLE, 'Selecting characteristics from discovered services');
    
    // Known OBD/ELM327 service UUIDs to look for (case insensitive)
    const knownServicePatterns = [
      'fff0',           // Common ELM327 service
      'ffe0',           // Alternative ELM327 service  
      '18f0',           // Some OBD adapters
      'e7810a71',       // Veepeak specific
      '0000ffe0',       // Full UUID format
      '0000fff0',       // Full UUID format
    ];
    
    // Known characteristic patterns
    const knownWritePatterns = ['fff1', 'ffe1', 'fff2'];
    const knownNotifyPatterns = ['fff1', 'ffe1', 'fff2'];

    // Strategy 1: Try known OBD patterns first
    for (const service of services) {
      const serviceUuid = service.uuid.toLowerCase();
      const isKnownService = knownServicePatterns.some(p => serviceUuid.includes(p)) ||
                             serviceUuid.includes(KNOWN_OBD_PATTERNS.UART_SERVICE) ||
                             serviceUuid === KNOWN_OBD_PATTERNS.SERIAL_SERVICE.toLowerCase();
      
      if (isKnownService) {
        logger.info(LogCategory.BLE, `Found potential OBD service: ${serviceUuid}`);
        
        // Look for notify characteristic
        let notifyChar = service.characteristics.find(c =>
          (c.isNotifiable || c.isIndicatable) &&
          (knownNotifyPatterns.some(p => c.uuid.includes(p)) ||
           c.uuid.includes(KNOWN_OBD_PATTERNS.UART_TX) ||
           c.uuid === KNOWN_OBD_PATTERNS.SERIAL_TX.toLowerCase())
        );
        
        // Fallback: any notifiable characteristic in this service
        if (!notifyChar) {
          notifyChar = service.characteristics.find(c => c.isNotifiable || c.isIndicatable);
        }

        // Look for write characteristic
        let writeChar = service.characteristics.find(c =>
          (c.isWritableWithResponse || c.isWritableWithoutResponse) &&
          (knownWritePatterns.some(p => c.uuid.includes(p)) ||
           c.uuid.includes(KNOWN_OBD_PATTERNS.UART_RX))
        );
        
        // Fallback: any writable characteristic in this service
        if (!writeChar) {
          writeChar = service.characteristics.find(c => 
            c.isWritableWithResponse || c.isWritableWithoutResponse
          );
        }

        if (notifyChar && writeChar && this.connectedDevice) {
          logger.info(LogCategory.BLE, 'Using known OBD service pattern', {
            service: serviceUuid,
            notify: notifyChar.uuid,
            write: writeChar.uuid,
          });

          return this.createSelectedCharacteristics(service.uuid, writeChar, notifyChar);
        }
      }
    }

    // Strategy 2: Find any service with both write and notify characteristics
    // Prefer services where write and notify are in the same service
    logger.info(LogCategory.BLE, 'No known OBD pattern found, trying generic discovery');
    
    for (const service of services) {
      const notifyChar = service.characteristics.find(c =>
        c.isNotifiable || c.isIndicatable
      );

      const writeChar = service.characteristics.find(c =>
        c.isWritableWithResponse || c.isWritableWithoutResponse
      );

      if (notifyChar && writeChar && this.connectedDevice) {
        logger.info(LogCategory.BLE, 'Using generic discovered characteristics', {
          service: service.uuid,
          notify: notifyChar.uuid,
          write: writeChar.uuid,
        });

        return this.createSelectedCharacteristics(service.uuid, writeChar, notifyChar);
      }
    }

    // Strategy 3: Cross-service matching (write in one service, notify in another)
    logger.info(LogCategory.BLE, 'Trying cross-service characteristic matching');
    
    let foundNotify: BleCharacteristicInfo | null = null;
    let foundWrite: BleCharacteristicInfo | null = null;
    let notifyServiceUuid = '';
    let writeServiceUuid = '';
    
    for (const service of services) {
      if (!foundNotify) {
        const notify = service.characteristics.find(c => c.isNotifiable || c.isIndicatable);
        if (notify) {
          foundNotify = notify;
          notifyServiceUuid = service.uuid;
        }
      }
      if (!foundWrite) {
        const write = service.characteristics.find(c => 
          c.isWritableWithResponse || c.isWritableWithoutResponse
        );
        if (write) {
          foundWrite = write;
          writeServiceUuid = service.uuid;
        }
      }
    }
    
    if (foundNotify && foundWrite && this.connectedDevice) {
      logger.warn(LogCategory.BLE, 'Using cross-service characteristics (may not work)', {
        notifyService: notifyServiceUuid,
        notify: foundNotify.uuid,
        writeService: writeServiceUuid,
        write: foundWrite.uuid,
      });
      
      // Update serviceUUID for cross-service case
      const writeInfo: BleCharacteristicInfo = { ...foundWrite, serviceUUID: writeServiceUuid };
      const notifyInfo: BleCharacteristicInfo = { ...foundNotify, serviceUUID: notifyServiceUuid };
      
      return {
        write: writeInfo,
        notify: notifyInfo,
        writeWithResponse: foundWrite.isWritableWithResponse,
      };
    }

    return null;
  }
  
  private createSelectedCharacteristics(
    serviceUuid: string,
    writeChar: BleCharacteristicInfo,
    notifyChar: BleCharacteristicInfo
  ): SelectedCharacteristics {
    return {
      write: { ...writeChar, serviceUUID: serviceUuid },
      notify: { ...notifyChar, serviceUUID: serviceUuid },
      writeWithResponse: writeChar.isWritableWithResponse,
    };
  }

  private async setupNotifications(): Promise<void> {
    if (!this.selectedCharacteristics || !this.connectedDevice) {
      throw new Error('Cannot setup notifications without characteristics');
    }

    logger.info(LogCategory.BLE, 'Setting up notifications', {
      serviceUUID: this.selectedCharacteristics.notify.serviceUUID,
      charUUID: this.selectedCharacteristics.notify.uuid,
    });

    // Cancel any existing subscription
    if (this.notificationSubscription) {
      this.notificationSubscription.remove();
      this.notificationSubscription = null;
    }

    this.notificationSubscription = this.connectedDevice.monitorCharacteristicForService(
      this.selectedCharacteristics.notify.serviceUUID,
      this.selectedCharacteristics.notify.uuid,
      this.handleCharacteristicUpdate
    );
  }

  private handleCharacteristicUpdate = (
    error: any,
    characteristic: Characteristic | null
  ) => {
    if (error) {
      logger.error(LogCategory.BLE, 'Characteristic update error', error);
      return;
    }

    if (!characteristic?.value) {
      return;
    }

    try {
      const decoded = Buffer.from(characteristic.value, 'base64').toString('utf-8');
      
      // Enhanced debugging: log SEARCHING phase with timestamp
      const upperDecoded = decoded.toUpperCase();
      if (upperDecoded.includes('SEARCHING')) {
        const timestamp = new Date().toISOString();
        logger.debug(LogCategory.BLE, `SEARCHING phase detected at ${timestamp}`, {
          command: this.currentCommand?.command,
          elapsed: this.currentCommand ? `${Date.now() - this.currentCommand.sentAt}ms` : 'N/A',
        });
      }

      this.handleReceivedData(decoded);
    } catch (error) {
      logger.error(LogCategory.BLE, 'Failed to process characteristic update', error);
    }
  };

  private handleReceivedData(data: string): void {
    this.responseBuffer += data;
    
    // Log to debug logger
    debugLogger.logRX(data, { 
      bufferLength: this.responseBuffer.length,
      isComplete: this.isResponseComplete(this.responseBuffer)
    });
    
    // Log raw data for debugging (truncate if too long)
    const truncatedBuffer = this.responseBuffer.length > 200 
      ? this.responseBuffer.substring(0, 200) + '...' 
      : this.responseBuffer;
    logger.debug(LogCategory.BLE, 'Response buffer', { 
      newData: data.replace(/\r/g, '\\r').replace(/\n/g, '\\n'),
      bufferLength: this.responseBuffer.length,
      buffer: truncatedBuffer.replace(/\r/g, '\\r').replace(/\n/g, '\\n'),
    });

    // Check if we have a complete response (ends with '>' prompt or contains specific markers)
    if (this.isResponseComplete(this.responseBuffer)) {
      const response = this.responseBuffer.trim();
      this.responseBuffer = '';

      if (this.currentCommand) {
        const duration = Date.now() - this.currentCommand.sentAt;
        logger.info(LogCategory.BLE, `Command response received`, {
          command: this.currentCommand.command,
          responseLength: response.length,
          durationMs: duration,
          response: response.length > 100 ? response.substring(0, 100) + '...' : response,
        });
        
        clearTimeout(this.currentCommand.timeout);
        this.currentCommand.resolve(response);
        this.currentCommand = null;
        this.processNextCommand();
      }
    }
  }

  private isResponseComplete(buffer: string): boolean {
    // ELM327 responses ALWAYS end with '>' prompt - this is the definitive marker
    // We must wait for this prompt to ensure we have the complete response
    // NEVER treat SEARCHING... as a final response
    if (buffer.includes('>')) {
      return true;
    }

    // For error responses that might not include '>', check for terminal error markers
    // These are only checked if we DON'T have the '>' prompt yet
    const upperBuffer = buffer.toUpperCase();
    
    // Only consider complete if we have a terminal error AND a line ending after it
    const terminalErrors = [
      'UNABLE TO CONNECT',
      'CAN ERROR',
      'BUS INIT: ...ERROR',
      'BUS ERROR',
      'STOPPED', // Add STOPPED as terminal error
    ];
    
    for (const error of terminalErrors) {
      if (upperBuffer.includes(error)) {
        // Make sure the error is followed by a line ending (complete message)
        const errorIndex = upperBuffer.indexOf(error);
        const afterError = buffer.substring(errorIndex + error.length);
        if (afterError.includes('\r') || afterError.includes('\n')) {
          return true;
        }
      }
    }

    // NEVER treat SEARCHING... as complete - always wait for '>' prompt
    return false;
  }

  async sendCommand(command: string, retryCount: number = 0): Promise<string> {
    if (!this.isConnected()) {
      throw new Error('Device not connected');
    }
    
    return new Promise((resolve, reject) => {
      const commandId = `${Date.now()}-${Math.random()}`;
      const maxRetries = 0; // Disable retries - retrying while ELM327 is searching causes STOPPED
      
      // Use per-command timeout instead of default
      const commandTimeout = this.getCommandTimeout(command);
      
      const timeout = setTimeout(() => {
        logger.error(LogCategory.BLE, `Command timeout: ${command}`, { retryCount, timeoutMs: commandTimeout });
        
        if (this.currentCommand?.id === commandId) {
          this.currentCommand = null;
        }
        
        // Don't retry - just fail with timeout
        // Retrying sends a new command which stops the ELM327 search
        reject(new Error(`Command timeout after ${commandTimeout}ms: ${command}`));
        this.processNextCommand();
      }, commandTimeout);

      const bleCommand: BleCommand = {
        id: commandId,
        command,
        resolve,
        reject,
        timeout,
        sentAt: Date.now(),
      };

      this.commandQueue.push(bleCommand);
      logger.info(LogCategory.BLE, `Queued command: ${command}`, {
        queueLength: this.commandQueue.length,
        retryCount,
      });

      if (!this.currentCommand) {
        this.processNextCommand();
      }
    });
  }

  private async processNextCommand(): Promise<void> {
    if (this.currentCommand || this.commandQueue.length === 0) {
      return;
    }

    const command = this.commandQueue.shift();
    if (!command) {
      return;
    }

    this.currentCommand = command;
    this.responseBuffer = '';

    try {
      // Add throttle delay before sending command to prevent overwhelming scanner
      if (this.config.commandThrottleMs > 0) {
        await this.delay(this.config.commandThrottleMs);
      }
      
      await this.writeCommand(command.command);
    } catch (error) {
      logger.error(LogCategory.BLE, 'Write command failed', error);
      clearTimeout(command.timeout);
      command.reject(error as Error);
      this.currentCommand = null;
      this.processNextCommand();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get appropriate timeout for a specific OBD command
   */
  private getCommandTimeout(command: string): number {
    const cmd = command.toUpperCase().trim();

    // Fast AT commands used during header/filter switching
    if (cmd.startsWith('ATSH') || cmd.startsWith('AT CRA') || cmd.startsWith('ATCRA')) {
      return 1500;
    }
    
    // VIN command
    if (cmd === '0902') {
      return COMMAND_TIMEOUTS.vin;
    }
    
    // DTC commands
    if (cmd === '03' || cmd === '07' || cmd === '0A') {
      return COMMAND_TIMEOUTS.dtc;
    }
    
    // Mode 01 PIDs
    if (cmd === '0101' || cmd === '0131' || cmd === '014D' || cmd === '01A6') {
      if (cmd === '01A6') {
        return 8000;
      }
      return COMMAND_TIMEOUTS.mode01;
    }

    // UDS ReadDataByIdentifier requests (manufacturer-specific)
    if (cmd.startsWith('22') && cmd.length >= 6) {
      return 5000;
    }
    
    // Warm-up command
    if (cmd === '0100') {
      return COMMAND_TIMEOUTS.warmup;
    }
    
    // Default timeout for other commands (AT commands, etc.)
    return COMMAND_TIMEOUTS.default;
  }

  private async writeCommand(command: string): Promise<void> {
    if (!this.selectedCharacteristics || !this.connectedDevice) {
      throw new Error('Device not connected or characteristics not selected');
    }

    const commandWithCR = command.endsWith('\r') ? command : `${command}\r`;
    const base64Data = Buffer.from(commandWithCR, 'ascii').toString('base64');
    
    // Generate unique transactionId for this write operation (ble-plx best practice)
    const transactionId = `write-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Log to debug logger
    debugLogger.logTX(command, {
      serviceUUID: this.selectedCharacteristics.write.serviceUUID,
      charUUID: this.selectedCharacteristics.write.uuid,
      withResponse: this.selectedCharacteristics.writeWithResponse,
      transactionId,
    });

    logger.info(LogCategory.BLE, `Writing command: ${command}`, {
      serviceUUID: this.selectedCharacteristics.write.serviceUUID,
      charUUID: this.selectedCharacteristics.write.uuid,
      withResponse: this.selectedCharacteristics.writeWithResponse,
      transactionId,
    });

    try {
      if (this.selectedCharacteristics.writeWithResponse) {
        await this.connectedDevice.writeCharacteristicWithResponseForService(
          this.selectedCharacteristics.write.serviceUUID,
          this.selectedCharacteristics.write.uuid,
          base64Data,
          transactionId
        );
      } else {
        await this.connectedDevice.writeCharacteristicWithoutResponseForService(
          this.selectedCharacteristics.write.serviceUUID,
          this.selectedCharacteristics.write.uuid,
          base64Data,
          transactionId
        );
      }
      logger.debug(LogCategory.BLE, 'Command written successfully', { transactionId });
    } catch (error) {
      logger.error(LogCategory.BLE, 'Write command error', error);
      throw error;
    }
  }

  private async attemptReconnect(): Promise<void> {
    if (!this.lastConnectedDeviceId || this.isReconnecting) {
      return;
    }

    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      logger.warn(LogCategory.BLE, 'Max reconnect attempts reached', {
        attempts: this.reconnectAttempts,
      });
      debugLogger.logError('Auto-reconnect failed: Max attempts reached', null, {
        attempts: this.reconnectAttempts,
      });
      this.reconnectAttempts = 0;
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    logger.info(LogCategory.BLE, 'Attempting auto-reconnect', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.config.maxReconnectAttempts,
      deviceId: this.lastConnectedDeviceId,
    });
    debugLogger.logEvent('Auto-reconnect attempt started', {
      attempt: this.reconnectAttempts,
      deviceId: this.lastConnectedDeviceId,
    });

    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connect(this.lastConnectedDeviceId!);
        logger.info(LogCategory.BLE, 'Auto-reconnect successful');
        debugLogger.logEvent('Auto-reconnect successful');
        this.reconnectAttempts = 0;
      } catch (error) {
        logger.error(LogCategory.BLE, 'Auto-reconnect failed', error);
        debugLogger.logError('Auto-reconnect attempt failed', error, {
          attempt: this.reconnectAttempts,
        });
        // Try again if we haven't hit max attempts
        if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      } finally {
        this.isReconnecting = false;
      }
    }, this.config.reconnectDelayMs);
  }

  private handleDisconnection(): void {
    // Cancel notification subscription
    if (this.notificationSubscription) {
      this.notificationSubscription.remove();
      this.notificationSubscription = null;
    }
    
    this.connectedDevice = null;
    this.selectedCharacteristics = null;
    this.responseBuffer = '';
    
    if (this.currentCommand) {
      clearTimeout(this.currentCommand.timeout);
      this.currentCommand.reject(new Error('Device disconnected'));
      this.currentCommand = null;
    }

    this.commandQueue.forEach(cmd => {
      clearTimeout(cmd.timeout);
      cmd.reject(new Error('Device disconnected'));
    });
    this.commandQueue = [];

    this.setConnectionState(BleConnectionState.DISCONNECTED);
  }

  async disconnect(): Promise<void> {
    if (!this.connectedDevice) {
      return;
    }

    logger.info(LogCategory.BLE, 'Disconnecting device');
    
    // Clear reconnect state to prevent auto-reconnect on user-initiated disconnect
    this.lastConnectedDeviceId = null;
    this.reconnectAttempts = 0;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.setConnectionState(BleConnectionState.DISCONNECTING);

    try {
      await this.manager.cancelDeviceConnection(this.connectedDevice.id);
    } catch (error) {
      logger.error(LogCategory.BLE, 'Disconnect error', error);
    }

    this.handleDisconnection();
  }

  isConnected(): boolean {
    return this.connectionState === BleConnectionState.CONNECTED;
  }

  getConnectedDevice(): Device | null {
    return this.connectedDevice;
  }

  async getDiscoveredServices(): Promise<BleServiceInfo[]> {
    if (!this.connectedDevice) {
      return [];
    }

    const services = await this.connectedDevice.services();
    const serviceInfos: BleServiceInfo[] = [];

    for (const service of services) {
      const characteristics = await service.characteristics();
      const charInfos: BleCharacteristicInfo[] = characteristics.map((char: Characteristic) => ({
        uuid: char.uuid.toLowerCase(),
        serviceUUID: service.uuid.toLowerCase(),
        isReadable: char.isReadable,
        isWritableWithResponse: char.isWritableWithResponse,
        isWritableWithoutResponse: char.isWritableWithoutResponse,
        isNotifiable: char.isNotifiable,
        isIndicatable: char.isIndicatable,
      }));

      serviceInfos.push({
        uuid: service.uuid.toLowerCase(),
        isPrimary: service.isPrimary,
        characteristics: charInfos,
      });
    }

    return serviceInfos;
  }

  destroy(): void {
    this.disconnect();
    this.manager.destroy();
  }
}

export const bleManager = BleManager.getInstance();
