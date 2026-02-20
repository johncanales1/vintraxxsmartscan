// ELM327 OBD-II Adapter Service for VinTraxx SmartScan

import { BleManager } from '../ble/BleManager';
import { logger, LogCategory } from '../../utils/Logger';
import { ObdResponse, ELM327_INIT_COMMANDS, ELM327_RESPONSES } from './types';
import { normalizeResponse, isErrorResponse } from './parsers';

export class Elm327Service {
  private static instance: Elm327Service;
  private bleManager: BleManager;
  private initialized = false;
  private protocol: string | null = null;

  private constructor(bleManager: BleManager) {
    this.bleManager = bleManager;
  }

  static getInstance(bleManager: BleManager): Elm327Service {
    if (!Elm327Service.instance) {
      Elm327Service.instance = new Elm327Service(bleManager);
    }
    return Elm327Service.instance;
  }

  async initialize(): Promise<boolean> {
    logger.info(LogCategory.OBD, 'Initializing ELM327 adapter');

    if (!this.bleManager.isConnected()) {
      throw new Error('BLE device not connected');
    }

    try {
      // Execute initialization sequence
      for (const initCmd of ELM327_INIT_COMMANDS) {
        logger.debug(LogCategory.OBD, `Sending: ${initCmd.cmd} (${initCmd.desc})`);
        
        const response = await this.sendRawCommand(initCmd.cmd);
        
        logger.debug(LogCategory.OBD, `Response: ${response.normalized}`);

        // For ATZ, we expect to see ELM327 version
        if (initCmd.cmd === 'ATZ') {
          if (!response.normalized.includes('ELM327') && !response.normalized.includes('ELM')) {
            logger.warn(LogCategory.OBD, 'ATZ response does not contain ELM327 identifier', {
              response: response.normalized,
            });
          }
          // Wait longer after reset for adapter to stabilize
          await this.delay(1500);
        } else {
          // Check for expected response - be more lenient for initialization
          if (!response.success && !response.normalized.includes('OK')) {
            logger.warn(LogCategory.OBD, `Init command failed: ${initCmd.cmd}`, {
              response: response.normalized,
              error: response.error,
            });
            // Don't throw immediately for non-critical init commands
            if (initCmd.cmd === 'ATZ') {
              throw new Error(`ELM327 reset failed: ${response.error}`);
            }
          }
          // Small delay between commands
          await this.delay(100);
        }
      }

      // Detect protocol
      await this.detectProtocol();
      
      // Wait for protocol to stabilize
      await this.delay(500);
      
      // Warm-up command: Send 0100 and wait for '>' prompt before proceeding
      // This establishes communication with the ECU before VIN/DTC reads
      logger.info(LogCategory.OBD, 'Sending warm-up command 0100...');
      const warmupResponse = await this.sendRawCommand('0100');
      
      if (!warmupResponse.success) {
        logger.warn(LogCategory.OBD, 'Warm-up command 0100 failed', {
          response: warmupResponse.normalized,
          error: warmupResponse.error,
        });
        // Don't fail initialization - vehicle might be off or not responding to this specific PID
        // But log it so we know there might be issues
      } else {
        logger.info(LogCategory.OBD, 'Warm-up command 0100 successful - ECU communication established');
      }

      this.initialized = true;
      logger.info(LogCategory.OBD, 'ELM327 initialized successfully', { protocol: this.protocol });
      return true;
    } catch (error) {
      logger.error(LogCategory.OBD, 'ELM327 initialization failed', error);
      this.initialized = false;
      throw error;
    }
  }

  private async detectProtocol(): Promise<void> {
    try {
      const response = await this.sendRawCommand('ATDPN');
      if (response.success) {
        this.protocol = response.normalized.replace('A', '').trim();
        logger.info(LogCategory.OBD, `Detected protocol: ${this.protocol}`);
      } else {
        logger.warn(LogCategory.OBD, 'Could not detect protocol');
        this.protocol = 'AUTO';
      }
    } catch (error) {
      logger.warn(LogCategory.OBD, 'Protocol detection failed', error);
      this.protocol = 'AUTO';
    }
  }

  async sendCommand(command: string): Promise<ObdResponse> {
    if (!this.initialized) {
      throw new Error('ELM327 not initialized. Call initialize() first.');
    }

    return this.sendRawCommand(command);
  }

  private async sendRawCommand(command: string): Promise<ObdResponse> {
    try {
      logger.debug(LogCategory.OBD, `Sending command: ${command}`);
      
      const raw = await this.bleManager.sendCommand(command);
      const normalized = normalizeResponse(raw);
      
      logger.debug(LogCategory.OBD, `Received response`, { raw, normalized });

      const success = !isErrorResponse(normalized);
      const error = success ? undefined : this.extractError(normalized);

      return {
        raw,
        normalized,
        success,
        error,
      };
    } catch (error) {
      logger.error(LogCategory.OBD, `Command failed: ${command}`, error);
      return {
        raw: '',
        normalized: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private extractError(response: string): string {
    const upper = response.toUpperCase();
    
    if (upper.includes('NO DATA')) {
      return ELM327_RESPONSES.NO_DATA;
    }
    if (upper.includes('UNABLE TO CONNECT')) {
      return ELM327_RESPONSES.UNABLE_TO_CONNECT;
    }
    if (upper.includes('BUS INIT')) {
      return ELM327_RESPONSES.BUS_INIT_ERROR;
    }
    if (upper.includes('CAN ERROR')) {
      return ELM327_RESPONSES.CAN_ERROR;
    }
    if (upper.includes('ERROR')) {
      return ELM327_RESPONSES.ERROR;
    }
    if (upper.includes('STOPPED')) {
      return ELM327_RESPONSES.STOPPED;
    }

    return 'Unknown error';
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getProtocol(): string | null {
    return this.protocol;
  }

  reset(): void {
    this.initialized = false;
    this.protocol = null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
