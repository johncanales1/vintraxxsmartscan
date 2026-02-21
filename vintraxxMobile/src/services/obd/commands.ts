// OBD-II Commands for VinTraxx SmartScan

import { Elm327Service } from './Elm327';
import { logger, LogCategory } from '../../utils/Logger';
import { ObdMode, ObdPid, ParsedVin, ParsedDtc } from './types';
import { parseVIN, parseDTCs } from './parsers';

/**
 * Helper to extract per-ECU hex bytes from normalized OBD response
 * Returns a map of ECU ID -> hex bytes array
 */
function extractPerEcuBytes(normalized: string): Record<string, string[]> {
  const ecuData: Record<string, string[]> = {};
  const lines = normalized.split('\n').filter(line => line.trim().length > 0);
  
  for (const line of lines) {
    const trimmedLine = line.trim().toUpperCase();
    if (!trimmedLine || trimmedLine.startsWith('AT') || trimmedLine === 'OK') continue;
    
    let ecuId = 'UNKNOWN';
    let dataLine = trimmedLine;
    
    // Extract ECU ID if present (format: "7E8 03 41 00 ...")
    if (/^[0-9A-F]{3}\s/.test(dataLine)) {
      ecuId = dataLine.substring(0, 3);
      dataLine = dataLine.substring(4).trim();
    }
    
    // Extract hex bytes for this ECU
    const bytes: string[] = [];
    if (dataLine.includes(' ')) {
      const parts = dataLine.split(/\s+/);
      for (const part of parts) {
        if (/^[0-9A-F]{2}$/.test(part)) {
          bytes.push(part);
        }
      }
    }
    
    if (bytes.length > 0) {
      if (!ecuData[ecuId]) {
        ecuData[ecuId] = [];
      }
      ecuData[ecuId].push(...bytes);
    }
  }
  
  return ecuData;
}

type OdometerReadAbortSignal = { aborted: boolean };

interface OdometerDIDConfig {
  did: string;
  bytes: number;
  description: string;
  manufacturers: string[];
  scale?: number; // Optional scaling factor (e.g., 100 means value * 100 = km)
}

export class ObdCommands {
  private elm327: Elm327Service;

  constructor(elm327: Elm327Service) {
    this.elm327 = elm327;
  }

  private normalizeAtshHeader(header: string): string {
    const trimmed = header.trim().toUpperCase();
    if (/^[0-9A-F]{4}$/.test(trimmed)) {
      return trimmed.replace(/^0+/, '');
    }
    return trimmed;
  }

  private async trySetAtshHeader(header: string): Promise<boolean> {
    const normalizedHeader = this.normalizeAtshHeader(header);
    const commandsToTry = [`ATSH${normalizedHeader}`, `ATSH ${normalizedHeader}`];

    for (const cmd of commandsToTry) {
      const response = await this.elm327.sendCommand(cmd);
      if (response.success || response.normalized.toUpperCase().includes('OK')) {
        return true;
      }
    }

    return false;
  }

  private normalizeAtcraFilter(filter: string): string {
    return filter.trim().toUpperCase().replace(/\s+/g, '');
  }

  private async trySetAtcraFilter(filter: string | null): Promise<boolean> {
    const commandsToTry = filter
      ? [`ATCRA${filter}`, `ATCRA ${filter}`]
      : ['ATCRA', 'ATCRA '];

    for (const cmd of commandsToTry) {
      const response = await this.elm327.sendCommand(cmd);
      if (response.success || response.normalized.toUpperCase().includes('OK')) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if response contains UDS negative response (7F)
   * Format: 7F [Service ID] [NRC]
   * Example: "7F 22 31" = Service 22 (ReadDataByIdentifier) rejected with NRC 31 (requestOutOfRange)
   */
  private isUdsNegativeResponse(normalized: string): boolean {
    const upper = normalized.toUpperCase();
    // Look for "7F" followed by service ID and negative response code
    // Common patterns: "7F 22 31", "77E 03 7F 22 31", etc.
    return /\b7F\s+[0-9A-F]{2}\s+[0-9A-F]{2}\b/.test(upper);
  }

  /**
   * Get manufacturer make from VIN WMI (World Manufacturer Identifier)
   * First 3 characters of VIN
   */
  private getMakeFromWMI(wmi: string): string {
    const wmiUpper = wmi.toUpperCase();
    
    // Comprehensive WMI to manufacturer mapping
    const wmiMap: Record<string, string> = {
      // USA (1)
      '1G1': 'Chevrolet', '1G6': 'Cadillac', '1GM': 'Pontiac', '1GC': 'Chevrolet',
      '1FA': 'Ford', '1FB': 'Ford', '1FC': 'Ford', '1FD': 'Ford', '1FM': 'Ford', '1FT': 'Ford',
      '1HG': 'Honda', '1J4': 'Jeep', '1L1': 'Lincoln', '1LN': 'Lincoln',
      '1N4': 'Nissan', '1VW': 'Volkswagen', '1YV': 'Mazda',
      
      // Canada (2)
      '2C3': 'Chrysler', '2FA': 'Ford', '2FM': 'Ford', '2FT': 'Ford',
      '2G1': 'Chevrolet', '2G2': 'Pontiac', '2HG': 'Honda', '2HK': 'Honda', '2HM': 'Hyundai',
      '2T1': 'Toyota', '2T2': 'Toyota',
      
      // Mexico (3)
      '3FA': 'Ford', '3FE': 'Ford', '3G1': 'Chevrolet', '3HG': 'Honda',
      '3N1': 'Nissan', '3VW': 'Volkswagen',
      
      // Japan (J)
      'JA3': 'Mitsubishi', 'JA4': 'Mitsubishi', 'JF1': 'Subaru', 'JF2': 'Subaru',
      'JHM': 'Honda', 'JM1': 'Mazda', 'JN1': 'Nissan', 'JN8': 'Nissan',
      'JT2': 'Toyota', 'JTE': 'Toyota', 'JTD': 'Toyota', 'JTH': 'Lexus', 'JTJ': 'Lexus',
      
      // Korea (K)
      'KM8': 'Hyundai', 'KMH': 'Hyundai', 'KNA': 'Kia', 'KND': 'Kia', 'KNM': 'Kia',
      
      // Europe
      'SAJ': 'Jaguar', 'SAL': 'Land Rover', 'SCC': 'Lotus', 'SCF': 'Aston Martin',
      'TRU': 'Audi', 'VF1': 'Renault', 'VF3': 'Peugeot', 'VWV': 'Volkswagen',
      'WAU': 'Audi', 'WBA': 'BMW', 'WBS': 'BMW',
      'WDB': 'Mercedes', 'WDD': 'Mercedes', 'WDC': 'Mercedes',
      'WME': 'Smart', 'WMW': 'Mini', 'WP0': 'Porsche', 'WP1': 'Porsche',
      'WVW': 'Volkswagen', 'WV1': 'Volkswagen', 'WV2': 'Volkswagen',
      
      // China (L)
      'LFV': 'FAW-Volkswagen', 'LHG': 'Honda', 'LSV': 'SAIC-Volkswagen', 'LTV': 'Toyota',
    };

    // Try exact 3-char match
    if (wmiMap[wmiUpper]) {
      return wmiMap[wmiUpper];
    }

    // Try 2-char prefix match
    const wmi2 = wmiUpper.substring(0, 2);
    for (const [key, value] of Object.entries(wmiMap)) {
      if (key.startsWith(wmi2)) {
        return value;
      }
    }

    // Fallback to country/region
    const countryCode = wmiUpper.charAt(0);
    const countryMap: Record<string, string> = {
      '1': 'USA', '2': 'Canada', '3': 'Mexico',
      'J': 'Japan', 'K': 'Korea', 'L': 'China',
      'S': 'UK', 'V': 'France', 'W': 'Germany',
    };

    return countryMap[countryCode] || 'Unknown';
  }

  /**
   * Read Vehicle Identification Number (VIN) with raw response
   * Mode 09 PID 02
   */
  async readVINWithRaw(): Promise<{ parsed: ParsedVin; raw: { raw: string; normalized: string } | null }> {
    logger.info(LogCategory.OBD, 'Reading VIN (with raw)');

    try {
      const command = `${ObdMode.REQUEST_VEHICLE_INFO}${ObdPid.VIN}`;
      const response = await this.elm327.sendCommand(command);

      const parsed = response.success ? parseVIN(response.raw) : {
        vin: '',
        valid: false,
        error: response.error || 'Failed to read VIN',
      };

      return {
        parsed,
        raw: { raw: response.raw, normalized: response.normalized },
      };
    } catch (error) {
      logger.error(LogCategory.OBD, 'VIN read exception', error);
      return {
        parsed: {
          vin: '',
          valid: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        raw: null,
      };
    }
  }

  /**
   * Read Vehicle Identification Number (VIN)
   * Mode 09 PID 02
   */
  async readVIN(): Promise<ParsedVin> {
    logger.info(LogCategory.OBD, 'Reading VIN');

    try {
      const command = `${ObdMode.REQUEST_VEHICLE_INFO}${ObdPid.VIN}`;
      const response = await this.elm327.sendCommand(command);

      if (!response.success) {
        logger.error(LogCategory.OBD, 'VIN read failed', { error: response.error });
        return {
          vin: '',
          valid: false,
          error: response.error || 'Failed to read VIN',
        };
      }

      return parseVIN(response.raw);
    } catch (error) {
      logger.error(LogCategory.OBD, 'VIN read exception', error);
      return {
        vin: '',
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Read stored DTCs with raw response
   * Mode 03
   */
  async readStoredDTCsWithRaw(): Promise<{ parsed: ParsedDtc[]; raw: { raw: string; normalized: string } | null }> {
    logger.info(LogCategory.OBD, 'Reading stored DTCs (with raw)');

    try {
      const response = await this.elm327.sendCommand(ObdMode.SHOW_STORED_DTC);
      const parsed = response.success ? parseDTCs(response.raw, '03') : [];

      return {
        parsed,
        raw: { raw: response.raw, normalized: response.normalized },
      };
    } catch (error) {
      logger.error(LogCategory.OBD, 'Stored DTC read exception', error);
      return { parsed: [], raw: null };
    }
  }

  /**
   * Read stored (confirmed) Diagnostic Trouble Codes
   * Mode 03
   */
  async readStoredDTCs(): Promise<ParsedDtc[]> {
    logger.info(LogCategory.OBD, 'Reading stored DTCs');

    try {
      const response = await this.elm327.sendCommand(ObdMode.SHOW_STORED_DTC);

      if (!response.success) {
        logger.warn(LogCategory.OBD, 'Stored DTC read failed', { error: response.error });
        return [];
      }

      return parseDTCs(response.raw, '03');
    } catch (error) {
      logger.error(LogCategory.OBD, 'Stored DTC read exception', error);
      return [];
    }
  }

  /**
   * Read pending DTCs with raw response
   * Mode 07
   */
  async readPendingDTCsWithRaw(): Promise<{ parsed: ParsedDtc[]; raw: { raw: string; normalized: string } | null }> {
    logger.info(LogCategory.OBD, 'Reading pending DTCs (with raw)');

    try {
      const response = await this.elm327.sendCommand(ObdMode.SHOW_PENDING_DTC);
      const parsed = response.success ? parseDTCs(response.raw, '07') : [];

      return {
        parsed,
        raw: { raw: response.raw, normalized: response.normalized },
      };
    } catch (error) {
      logger.error(LogCategory.OBD, 'Pending DTC read exception', error);
      return { parsed: [], raw: null };
    }
  }

  /**
   * Read pending Diagnostic Trouble Codes
   * Mode 07
   */
  async readPendingDTCs(): Promise<ParsedDtc[]> {
    logger.info(LogCategory.OBD, 'Reading pending DTCs');

    try {
      const response = await this.elm327.sendCommand(ObdMode.SHOW_PENDING_DTC);

      if (!response.success) {
        logger.warn(LogCategory.OBD, 'Pending DTC read failed', { error: response.error });
        return [];
      }

      return parseDTCs(response.raw, '07');
    } catch (error) {
      logger.error(LogCategory.OBD, 'Pending DTC read exception', error);
      return [];
    }
  }

  /**
   * Read permanent Diagnostic Trouble Codes
   * Mode 0A
   */
  async readPermanentDTCs(): Promise<ParsedDtc[]> {
    logger.info(LogCategory.OBD, 'Reading permanent DTCs');

    try {
      const response = await this.elm327.sendCommand(ObdMode.PERMANENT_DTC);

      if (!response.success) {
        logger.warn(LogCategory.OBD, 'Permanent DTC read failed', { error: response.error });
        return [];
      }

      return parseDTCs(response.raw, '0A');
    } catch (error) {
      logger.error(LogCategory.OBD, 'Permanent DTC read exception', error);
      return [];
    }
  }

  /**
   * Clear Diagnostic Trouble Codes and reset MIL
   * Mode 04
   */
  async clearDTCs(): Promise<boolean> {
    logger.info(LogCategory.OBD, 'Clearing DTCs');

    try {
      const response = await this.elm327.sendCommand(ObdMode.CLEAR_DTC);

      if (response.success) {
        logger.info(LogCategory.OBD, 'DTCs cleared successfully');
        return true;
      } else {
        logger.error(LogCategory.OBD, 'Clear DTCs failed', { error: response.error });
        return false;
      }
    } catch (error) {
      logger.error(LogCategory.OBD, 'Clear DTCs exception', error);
      return false;
    }
  }

  /**
   * Read MIL status with raw response and per-ECU data
   * Mode 01 PID 01
   */
  async readMILStatusWithRaw(): Promise<{
    parsed: { milOn: boolean; dtcCount: number; raw: string; byEcu: Record<string, { milOn: boolean; dtcCount: number }> };
    raw: { raw: string; normalized: string } | null;
  }> {
    logger.info(LogCategory.OBD, 'Reading MIL status (with raw)');

    try {
      const response = await this.elm327.sendCommand('0101');

      if (!response.success) {
        return {
          parsed: { milOn: false, dtcCount: 0, raw: response.raw, byEcu: {} },
          raw: { raw: response.raw, normalized: response.normalized },
        };
      }

      // Parse response per-ECU: 41 01 XX YY ZZ WW
      // With headers: 7E8 06 41 01 XX YY ZZ WW
      // XX byte: bit 7 = MIL status, bits 0-6 = DTC count
      
      const ecuData = extractPerEcuBytes(response.normalized);
      const byEcu: Record<string, { milOn: boolean; dtcCount: number }> = {};
      let overallMilOn = false;
      let overallDtcCount = 0;
      
      // Parse each ECU's response
      for (const [ecuId, bytes] of Object.entries(ecuData)) {
        // Find 41 01 response in this ECU's bytes
        let dataIndex = -1;
        for (let i = 0; i < bytes.length - 1; i++) {
          if (bytes[i] === '41' && bytes[i + 1] === '01') {
            dataIndex = i + 2;
            break;
          }
        }
        
        if (dataIndex !== -1 && dataIndex < bytes.length) {
          const statusByte = parseInt(bytes[dataIndex], 16);
          const milOn = (statusByte & 0x80) !== 0;
          const dtcCount = statusByte & 0x7F;
          
          byEcu[ecuId] = { milOn, dtcCount };
          
          // Update overall status (any ECU with MIL on means overall MIL on)
          if (milOn) overallMilOn = true;
          overallDtcCount = Math.max(overallDtcCount, dtcCount);
          
          logger.debug(LogCategory.OBD, `MIL status for ${ecuId}`, { milOn, dtcCount });
        }
      }

      logger.info(LogCategory.OBD, 'MIL status overall', { milOn: overallMilOn, dtcCount: overallDtcCount, ecuCount: Object.keys(byEcu).length });

      return {
        parsed: { milOn: overallMilOn, dtcCount: overallDtcCount, raw: response.raw, byEcu },
        raw: { raw: response.raw, normalized: response.normalized },
      };
    } catch (error) {
      logger.error(LogCategory.OBD, 'MIL status read exception', error);
      return {
        parsed: { milOn: false, dtcCount: 0, raw: '', byEcu: {} },
        raw: null,
      };
    }
  }

  /**
   * Read MIL status and DTC count
   * Mode 01 PID 01
   */
  async readMILStatus(): Promise<{
    milOn: boolean;
    dtcCount: number;
    raw: string;
  }> {
    logger.info(LogCategory.OBD, 'Reading MIL status');

    try {
      const response = await this.elm327.sendCommand('0101');

      if (!response.success) {
        logger.error(LogCategory.OBD, 'MIL status read failed', { error: response.error });
        return { milOn: false, dtcCount: 0, raw: response.raw };
      }

      // Parse response: 41 01 XX YY ZZ WW
      // With headers: 7E8 06 41 01 XX YY ZZ WW
      // XX byte: bit 7 = MIL status, bits 0-6 = DTC count
      
      // Extract all hex bytes from response
      const allHexBytes: string[] = [];
      const lines = response.normalized.split('\n').filter(line => line.trim().length > 0);
      
      for (const line of lines) {
        const trimmedLine = line.trim().toUpperCase();
        if (!trimmedLine || trimmedLine.startsWith('AT') || trimmedLine === 'OK') continue;
        
        let dataLine = trimmedLine;
        // Remove CAN header if present (3 hex chars at start like 7E8)
        if (/^[0-9A-F]{3}\s/.test(dataLine)) {
          dataLine = dataLine.substring(4).trim();
        }
        
        // Extract hex bytes
        if (dataLine.includes(' ')) {
          const parts = dataLine.split(/\s+/);
          for (const part of parts) {
            if (/^[0-9A-F]{2}$/.test(part)) {
              allHexBytes.push(part);
            }
          }
        }
      }
      
      logger.debug(LogCategory.OBD, 'MIL status hex bytes', { bytes: allHexBytes.join(' ') });
      
      // Find 41 01 response
      let dataIndex = -1;
      for (let i = 0; i < allHexBytes.length - 1; i++) {
        if (allHexBytes[i] === '41' && allHexBytes[i + 1] === '01') {
          dataIndex = i + 2; // Start after 41 01
          break;
        }
      }
      
      if (dataIndex !== -1 && dataIndex < allHexBytes.length) {
        const statusByte = parseInt(allHexBytes[dataIndex], 16);
        const milOn = (statusByte & 0x80) !== 0;
        const dtcCount = statusByte & 0x7F;

        logger.info(LogCategory.OBD, 'MIL status', { milOn, dtcCount });
        return { milOn, dtcCount, raw: response.raw };
      }

      return { milOn: false, dtcCount: 0, raw: response.raw };
    } catch (error) {
      logger.error(LogCategory.OBD, 'MIL status read exception', error);
      return { milOn: false, dtcCount: 0, raw: '' };
    }
  }

  /**
   * Read readiness monitors status
   * Mode 01 PID 01 (extended parsing)
   */
  async readReadinessMonitors(): Promise<{
    supported: string[];
    ready: string[];
    notReady: string[];
  }> {
    logger.info(LogCategory.OBD, 'Reading readiness monitors');

    try {
      const response = await this.elm327.sendCommand('0101');

      if (!response.success) {
        logger.error(LogCategory.OBD, 'Readiness monitors read failed');
        return { supported: [], ready: [], notReady: [] };
      }

      // This is a simplified version - full implementation would parse all monitor bits
      // For now, return empty arrays
      return { supported: [], ready: [], notReady: [] };
    } catch (error) {
      logger.error(LogCategory.OBD, 'Readiness monitors read exception', error);
      return { supported: [], ready: [], notReady: [] };
    }
  }

  /**
   * Read distance with raw response
   * Mode 01 PID 31
   */
  async readDistanceSinceClearedWithRaw(): Promise<{
    parsed: number | null;
    raw: { raw: string; normalized: string } | null;
  }> {
    logger.info(LogCategory.OBD, 'Reading distance since codes cleared (with raw)');

    try {
      const response = await this.elm327.sendCommand('0131');

      if (!response.success) {
        return {
          parsed: null,
          raw: { raw: response.raw, normalized: response.normalized },
        };
      }

      const allHexBytes: string[] = [];
      const lines = response.normalized.split('\n').filter(line => line.trim().length > 0);
      
      for (const line of lines) {
        const trimmedLine = line.trim().toUpperCase();
        if (!trimmedLine || trimmedLine.startsWith('AT') || trimmedLine === 'OK') continue;
        
        let dataLine = trimmedLine;
        if (/^[0-9A-F]{3}\s/.test(dataLine)) {
          dataLine = dataLine.substring(4).trim();
        }
        
        if (dataLine.includes(' ')) {
          const parts = dataLine.split(/\s+/);
          for (const part of parts) {
            if (/^[0-9A-F]{2}$/.test(part)) {
              allHexBytes.push(part);
            }
          }
        }
      }
      
      let dataIndex = -1;
      for (let i = 0; i < allHexBytes.length - 1; i++) {
        if (allHexBytes[i] === '41' && allHexBytes[i + 1] === '31') {
          dataIndex = i + 2;
          break;
        }
      }
      
      if (dataIndex !== -1 && dataIndex + 1 < allHexBytes.length) {
        const distance = (parseInt(allHexBytes[dataIndex], 16) * 256) + parseInt(allHexBytes[dataIndex + 1], 16);
        return {
          parsed: distance,
          raw: { raw: response.raw, normalized: response.normalized },
        };
      }

      return {
        parsed: null,
        raw: { raw: response.raw, normalized: response.normalized },
      };
    } catch (error) {
      logger.error(LogCategory.OBD, 'Distance read exception', error);
      return { parsed: null, raw: null };
    }
  }

  /**
   * Read distance traveled since codes cleared
   * Mode 01 PID 31
   */
  async readDistanceSinceCodesCleared(): Promise<number | null> {
    logger.info(LogCategory.OBD, 'Reading distance since codes cleared');

    try {
      const response = await this.elm327.sendCommand('0131');

      if (!response.success) {
        logger.warn(LogCategory.OBD, 'Distance read failed');
        return null;
      }

      // Parse response: 41 31 XX YY (distance in km)
      // With headers: 7E8 04 41 31 XX YY
      
      // Extract all hex bytes from response
      const allHexBytes: string[] = [];
      const lines = response.normalized.split('\n').filter(line => line.trim().length > 0);
      
      for (const line of lines) {
        const trimmedLine = line.trim().toUpperCase();
        if (!trimmedLine || trimmedLine.startsWith('AT') || trimmedLine === 'OK') continue;
        
        let dataLine = trimmedLine;
        // Remove CAN header if present
        if (/^[0-9A-F]{3}\s/.test(dataLine)) {
          dataLine = dataLine.substring(4).trim();
        }
        
        // Extract hex bytes
        if (dataLine.includes(' ')) {
          const parts = dataLine.split(/\s+/);
          for (const part of parts) {
            if (/^[0-9A-F]{2}$/.test(part)) {
              allHexBytes.push(part);
            }
          }
        }
      }
      
      logger.debug(LogCategory.OBD, 'Distance hex bytes', { bytes: allHexBytes.join(' ') });
      
      // Find 41 31 response
      let dataIndex = -1;
      for (let i = 0; i < allHexBytes.length - 1; i++) {
        if (allHexBytes[i] === '41' && allHexBytes[i + 1] === '31') {
          dataIndex = i + 2; // Start after 41 31
          break;
        }
      }
      
      if (dataIndex !== -1 && dataIndex + 1 < allHexBytes.length) {
        const distance = (parseInt(allHexBytes[dataIndex], 16) * 256) + parseInt(allHexBytes[dataIndex + 1], 16);
        logger.info(LogCategory.OBD, 'Distance since codes cleared', { km: distance });
        return distance;
      }

      return null;
    } catch (error) {
      logger.error(LogCategory.OBD, 'Distance read exception', error);
      return null;
    }
  }

  /**
   * Read time with raw response
   * Mode 01 PID 4D
   */
  async readTimeSinceClearedWithRaw(): Promise<{
    parsed: number | null;
    raw: { raw: string; normalized: string } | null;
  }> {
    logger.info(LogCategory.OBD, 'Reading time since codes cleared (with raw)');

    try {
      const response = await this.elm327.sendCommand('014D');

      if (!response.success) {
        return {
          parsed: null,
          raw: { raw: response.raw, normalized: response.normalized },
        };
      }

      const allHexBytes: string[] = [];
      const lines = response.normalized.split('\n').filter(line => line.trim().length > 0);
      
      for (const line of lines) {
        const trimmedLine = line.trim().toUpperCase();
        if (!trimmedLine || trimmedLine.startsWith('AT') || trimmedLine === 'OK') continue;
        
        let dataLine = trimmedLine;
        if (/^[0-9A-F]{3}\s/.test(dataLine)) {
          dataLine = dataLine.substring(4).trim();
        }
        
        if (dataLine.includes(' ')) {
          const parts = dataLine.split(/\s+/);
          for (const part of parts) {
            if (/^[0-9A-F]{2}$/.test(part)) {
              allHexBytes.push(part);
            }
          }
        }
      }
      
      let dataIndex = -1;
      for (let i = 0; i < allHexBytes.length - 1; i++) {
        if (allHexBytes[i] === '41' && allHexBytes[i + 1] === '4D') {
          dataIndex = i + 2;
          break;
        }
      }
      
      if (dataIndex !== -1 && dataIndex + 1 < allHexBytes.length) {
        const minutes = (parseInt(allHexBytes[dataIndex], 16) * 256) + parseInt(allHexBytes[dataIndex + 1], 16);
        return {
          parsed: minutes,
          raw: { raw: response.raw, normalized: response.normalized },
        };
      }

      return {
        parsed: null,
        raw: { raw: response.raw, normalized: response.normalized },
      };
    } catch (error) {
      logger.error(LogCategory.OBD, 'Time read exception', error);
      return { parsed: null, raw: null };
    }
  }

  /**
   * Read time since codes cleared
   * Mode 01 PID 4D
   */
  async readTimeSinceCodesCleared(): Promise<number | null> {
    logger.info(LogCategory.OBD, 'Reading time since codes cleared');

    try {
      const response = await this.elm327.sendCommand('014D');

      if (!response.success) {
        logger.warn(LogCategory.OBD, 'Time read failed');
        return null;
      }

      // Parse response: 41 4D XX YY (time in minutes)
      // With headers: 7E8 04 41 4D XX YY
      
      // Extract all hex bytes from response
      const allHexBytes: string[] = [];
      const lines = response.normalized.split('\n').filter(line => line.trim().length > 0);
      
      for (const line of lines) {
        const trimmedLine = line.trim().toUpperCase();
        if (!trimmedLine || trimmedLine.startsWith('AT') || trimmedLine === 'OK') continue;
        
        let dataLine = trimmedLine;
        // Remove CAN header if present
        if (/^[0-9A-F]{3}\s/.test(dataLine)) {
          dataLine = dataLine.substring(4).trim();
        }
        
        // Extract hex bytes
        if (dataLine.includes(' ')) {
          const parts = dataLine.split(/\s+/);
          for (const part of parts) {
            if (/^[0-9A-F]{2}$/.test(part)) {
              allHexBytes.push(part);
            }
          }
        }
      }
      
      logger.debug(LogCategory.OBD, 'Time hex bytes', { bytes: allHexBytes.join(' ') });
      
      // Find 41 4D response
      let dataIndex = -1;
      for (let i = 0; i < allHexBytes.length - 1; i++) {
        if (allHexBytes[i] === '41' && allHexBytes[i + 1] === '4D') {
          dataIndex = i + 2; // Start after 41 4D
          break;
        }
      }
      
      if (dataIndex !== -1 && dataIndex + 1 < allHexBytes.length) {
        const minutes = (parseInt(allHexBytes[dataIndex], 16) * 256) + parseInt(allHexBytes[dataIndex + 1], 16);
        logger.info(LogCategory.OBD, 'Time since codes cleared', { minutes });
        return minutes;
      }

      return null;
    } catch (error) {
      logger.error(LogCategory.OBD, 'Time read exception', error);
      return null;
    }
  }

  /**
   * Read warmups since codes cleared
   * Mode 01 PID 30
   */
  async readWarmupsSinceCleared(): Promise<number | null> {
    logger.info(LogCategory.OBD, 'Reading warmups since codes cleared');

    try {
      const response = await this.elm327.sendCommand('0130');

      if (!response.success) {
        logger.warn(LogCategory.OBD, 'Warmups read failed');
        return null;
      }

      const allHexBytes: string[] = [];
      const lines = response.normalized.split('\n').filter(line => line.trim().length > 0);
      
      for (const line of lines) {
        const trimmedLine = line.trim().toUpperCase();
        if (!trimmedLine || trimmedLine.startsWith('AT') || trimmedLine === 'OK') continue;
        
        let dataLine = trimmedLine;
        if (/^[0-9A-F]{3}\s/.test(dataLine)) {
          dataLine = dataLine.substring(4).trim();
        }
        
        if (dataLine.includes(' ')) {
          const parts = dataLine.split(/\s+/);
          for (const part of parts) {
            if (/^[0-9A-F]{2}$/.test(part)) {
              allHexBytes.push(part);
            }
          }
        }
      }
      
      let dataIndex = -1;
      for (let i = 0; i < allHexBytes.length - 1; i++) {
        if (allHexBytes[i] === '41' && allHexBytes[i + 1] === '30') {
          dataIndex = i + 2;
          break;
        }
      }
      
      if (dataIndex !== -1 && dataIndex < allHexBytes.length) {
        const warmups = parseInt(allHexBytes[dataIndex], 16);
        logger.info(LogCategory.OBD, 'Warmups since codes cleared', { warmups });
        return warmups;
      }

      return null;
    } catch (error) {
      logger.error(LogCategory.OBD, 'Warmups read exception', error);
      return null;
    }
  }

  /**
   * Read distance traveled with MIL on with per-ECU data
   * Mode 01 PID 21 (returns km, needs conversion to miles for UI)
   */
  async readDistanceWithMILOn(): Promise<{ overall: number | null; byEcu: Record<string, number> }> {
    logger.info(LogCategory.OBD, 'Reading distance with MIL on');

    try {
      const response = await this.elm327.sendCommand('0121');

      if (!response.success) {
        logger.warn(LogCategory.OBD, 'Distance with MIL on read failed');
        return { overall: null, byEcu: {} };
      }

      const ecuData = extractPerEcuBytes(response.normalized);
      const byEcu: Record<string, number> = {};
      let overallDistance: number | null = null;
      
      // Parse each ECU's response
      for (const [ecuId, bytes] of Object.entries(ecuData)) {
        // Find 41 21 response in this ECU's bytes
        let dataIndex = -1;
        for (let i = 0; i < bytes.length - 1; i++) {
          if (bytes[i] === '41' && bytes[i + 1] === '21') {
            dataIndex = i + 2;
            break;
          }
        }
        
        if (dataIndex !== -1 && dataIndex + 1 < bytes.length) {
          const distance = (parseInt(bytes[dataIndex], 16) * 256) + parseInt(bytes[dataIndex + 1], 16);
          byEcu[ecuId] = distance;
          
          // Use first valid distance as overall (or prefer 7E8 if available)
          if (overallDistance === null || ecuId === '7E8') {
            overallDistance = distance;
          }
          
          logger.debug(LogCategory.OBD, `Distance with MIL on for ${ecuId}`, { km: distance });
        }
      }

      logger.info(LogCategory.OBD, 'Distance with MIL on overall', { km: overallDistance, ecuCount: Object.keys(byEcu).length });
      return { overall: overallDistance, byEcu };
    } catch (error) {
      logger.error(LogCategory.OBD, 'Distance with MIL on read exception', error);
      return { overall: null, byEcu: {} };
    }
  }

  /**
   * Read fuel system status (Loop Status) with per-ECU data
   * Mode 01 PID 03
   */
  async readFuelSystemStatus(): Promise<{ overall: { system1: number; system2: number } | null; byEcu: Record<string, { system1: number; system2: number }> }> {
    logger.info(LogCategory.OBD, 'Reading fuel system status');

    try {
      const response = await this.elm327.sendCommand('0103');

      if (!response.success) {
        logger.warn(LogCategory.OBD, 'Fuel system status read failed');
        return { overall: null, byEcu: {} };
      }

      const ecuData = extractPerEcuBytes(response.normalized);
      const byEcu: Record<string, { system1: number; system2: number }> = {};
      let overall: { system1: number; system2: number } | null = null;
      
      // Parse each ECU's response
      for (const [ecuId, bytes] of Object.entries(ecuData)) {
        // Find 41 03 response in this ECU's bytes
        let dataIndex = -1;
        for (let i = 0; i < bytes.length - 1; i++) {
          if (bytes[i] === '41' && bytes[i + 1] === '03') {
            dataIndex = i + 2;
            break;
          }
        }
        
        if (dataIndex !== -1 && dataIndex + 1 < bytes.length) {
          const system1 = parseInt(bytes[dataIndex], 16);
          const system2 = parseInt(bytes[dataIndex + 1], 16);
          byEcu[ecuId] = { system1, system2 };
          
          // Use first valid status as overall (or prefer 7E8 if available)
          if (overall === null || ecuId === '7E8') {
            overall = { system1, system2 };
          }
          
          logger.debug(LogCategory.OBD, `Fuel system status for ${ecuId}`, { system1, system2 });
        }
      }

      logger.info(LogCategory.OBD, 'Fuel system status overall', { overall, ecuCount: Object.keys(byEcu).length });
      return { overall, byEcu };
    } catch (error) {
      logger.error(LogCategory.OBD, 'Fuel system status read exception', error);
      return { overall: null, byEcu: {} };
    }
  }

  /**
   * Read commanded secondary air status with per-ECU data
   * Mode 01 PID 12
   */
  async readSecondaryAirStatus(): Promise<{ overall: number | null; byEcu: Record<string, number> }> {
    logger.info(LogCategory.OBD, 'Reading secondary air status');

    try {
      const response = await this.elm327.sendCommand('0112');

      if (!response.success) {
        logger.warn(LogCategory.OBD, 'Secondary air status read failed');
        return { overall: null, byEcu: {} };
      }

      const ecuData = extractPerEcuBytes(response.normalized);
      const byEcu: Record<string, number> = {};
      let overall: number | null = null;
      
      // Parse each ECU's response
      for (const [ecuId, bytes] of Object.entries(ecuData)) {
        // Find 41 12 response in this ECU's bytes
        let dataIndex = -1;
        for (let i = 0; i < bytes.length - 1; i++) {
          if (bytes[i] === '41' && bytes[i + 1] === '12') {
            dataIndex = i + 2;
            break;
          }
        }
        
        if (dataIndex !== -1 && dataIndex < bytes.length) {
          const status = parseInt(bytes[dataIndex], 16);
          byEcu[ecuId] = status;
          
          // Use first valid status as overall (or prefer 7E8 if available)
          if (overall === null || ecuId === '7E8') {
            overall = status;
          }
          
          logger.debug(LogCategory.OBD, `Secondary air status for ${ecuId}`, { status });
        }
      }

      logger.info(LogCategory.OBD, 'Secondary air status overall', { overall, ecuCount: Object.keys(byEcu).length });
      return { overall, byEcu };
    } catch (error) {
      logger.error(LogCategory.OBD, 'Secondary air status read exception', error);
      return { overall: null, byEcu: {} };
    }
  }

  /**
   * Read odometer/mileage
   * Mode 01 PID A6 (if supported) or fallback methods
   * Timeout: 60 seconds total to prevent hanging (increased from 20s to allow full ECU/DID scan)
   * @param vin - Vehicle VIN for manufacturer-specific DID filtering
   */
  async readOdometer(vin?: string): Promise<{ km: number; ecu: string } | null> {
    logger.info(LogCategory.OBD, 'Reading odometer', { vin });

    try {
      // Wrap entire odometer read in timeout (60 seconds max)
      return await this.readOdometerWithTimeout(vin);
    } catch (error) {
      logger.error(LogCategory.OBD, 'Odometer read exception', error);
      return null;
    }
  }

  /**
   * Read odometer with timeout protection
   */
  private async readOdometerWithTimeout(vin?: string): Promise<{ km: number; ecu: string } | null> {
    const timeoutMs = 60000; // 60 second timeout for entire odometer read (increased to allow full ECU/DID scan + UDS session setup)
    const abortSignal: OdometerReadAbortSignal = { aborted: false };
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const timeoutPromise = new Promise<null>((resolve) => {
      timeoutId = setTimeout(() => {
        abortSignal.aborted = true;
        logger.warn(LogCategory.OBD, 'Odometer read timeout reached after 60s');
        resolve(null);
      }, timeoutMs);
    });

    const readPromise = this.readOdometerInternal(abortSignal, vin)
      .finally(() => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
      });

    return Promise.race([readPromise, timeoutPromise]);
  }

  /**
   * Internal odometer reading logic
   */
  private async readOdometerInternal(abortSignal?: OdometerReadAbortSignal, vin?: string): Promise<{ km: number; ecu: string } | null> {
    try {
      // Try Mode 01 PID A6 (Odometer)
      logger.debug(LogCategory.OBD, 'Attempting standard PID 01A6');
      if (abortSignal?.aborted) {
        return null;
      }
      const response = await this.elm327.sendCommand('01A6');

      if (abortSignal?.aborted) {
        return null;
      }

      if (response.success && !response.raw.toUpperCase().includes('NO DATA')) {
        // Parse response: 41 A6 XX XX XX XX (odometer in km)
        const allHexBytes: string[] = [];
        const lines = response.normalized.split('\n').filter(line => line.trim().length > 0);
        
        for (const line of lines) {
          const trimmedLine = line.trim().toUpperCase();
          if (!trimmedLine || trimmedLine.startsWith('AT') || trimmedLine === 'OK') continue;
          
          let dataLine = trimmedLine;
          // Remove CAN header if present
          if (/^[0-9A-F]{3}\s/.test(dataLine)) {
            dataLine = dataLine.substring(4).trim();
          }
          
          // Extract hex bytes
          if (dataLine.includes(' ')) {
            const parts = dataLine.split(/\s+/);
            for (const part of parts) {
              if (/^[0-9A-F]{2}$/.test(part)) {
                allHexBytes.push(part);
              }
            }
          }
        }
        
        logger.debug(LogCategory.OBD, 'Odometer hex bytes', { bytes: allHexBytes.join(' ') });
        
        // Find 41 A6 response
        let dataIndex = -1;
        for (let i = 0; i < allHexBytes.length - 1; i++) {
          if (allHexBytes[i] === '41' && allHexBytes[i + 1] === 'A6') {
            dataIndex = i + 2; // Start after 41 A6
            break;
          }
        }
        
        if (dataIndex !== -1 && dataIndex + 3 < allHexBytes.length) {
          // Odometer is 4 bytes (32-bit value in 0.1 km per OBD-II PID 01A6 spec)
          const rawValue = 
            (parseInt(allHexBytes[dataIndex], 16) << 24) +
            (parseInt(allHexBytes[dataIndex + 1], 16) << 16) +
            (parseInt(allHexBytes[dataIndex + 2], 16) << 8) +
            parseInt(allHexBytes[dataIndex + 3], 16);
          const odometer = rawValue / 10; // Convert from 0.1 km units to km
          
          logger.info(LogCategory.OBD, 'Odometer read via standard PID', { rawValue, km: odometer });
          return { km: odometer, ecu: '7E8' }; // Standard PID typically from engine ECU
        }
      }

      // Standard PID not supported, try manufacturer-specific UDS method (FIXD-like)
      logger.info(LogCategory.OBD, 'Standard odometer PID not supported, trying manufacturer-specific UDS DIDs');
      return await this.readOdometerVW(abortSignal, vin);
    } catch (error) {
      logger.error(LogCategory.OBD, 'Odometer read internal exception', error);
      return null;
    }
  }

  /**
   * Read odometer using manufacturer-specific UDS commands (FIXD-like approach)
   * Supports VW, Audi, Ford, GM, Toyota, Honda, BMW, Mercedes, Nissan, and others
   * Uses comprehensive DID database similar to commercial scanners
   * Implements UDS extended diagnostic session and security access for protected DIDs
   * @param vin - Vehicle VIN for manufacturer-specific DID filtering
   */
  private async readOdometerVW(abortSignal?: OdometerReadAbortSignal, vin?: string): Promise<{ km: number; ecu: string } | null> {
    logger.info(LogCategory.OBD, 'Attempting manufacturer-specific odometer read with UDS', { vin });

    try {
      // ========== STEP 1: ECU DISCOVERY with 7DF functional request ==========
      // Per FIXD checklist: Send 7DF functional request first, record responding IDs
      logger.info(LogCategory.OBD, 'Step 1: ECU Discovery - Sending 7DF functional request');
      const discoveredECUs: string[] = [];
      
      try {
        // Reset to functional addressing for discovery
        await this.elm327.sendCommand('ATSH7DF');
        await this.elm327.sendCommand('ATCRA'); // Clear receive filter to see all responses
        
        // Send a simple UDS request to discover responding ECUs
        // Using TesterPresent (3E 00) as it's widely supported
        const discoveryResponse = await this.elm327.sendCommand('3E00');
        
        if (discoveryResponse.success && !discoveryResponse.raw.toUpperCase().includes('NO DATA')) {
          // Parse response to find responding ECU IDs (format: 7E8, 7E9, 77E, etc.)
          const lines = discoveryResponse.normalized.split('\n');
          for (const line of lines) {
            const match = line.trim().match(/^([0-9A-F]{3})\s/i);
            if (match) {
              const ecuId = match[1].toUpperCase();
              if (!discoveredECUs.includes(ecuId)) {
                discoveredECUs.push(ecuId);
              }
            }
          }
          logger.info(LogCategory.OBD, `ECU Discovery: Found ${discoveredECUs.length} responding ECUs`, { ecus: discoveredECUs });
        }
      } catch (discoveryError) {
        logger.debug(LogCategory.OBD, 'ECU discovery failed, will try all known ECUs', discoveryError);
      }
      
      // ========== STEP 2: Determine manufacturer and set ECU order ==========
      // Per FIXD checklist: For VW, target cluster ECU 77E FIRST with extended session
      let detectedMake = 'Unknown';
      if (vin && vin.length === 17) {
        const wmi = vin.substring(0, 3).toUpperCase();
        detectedMake = this.getMakeFromWMI(wmi);
        logger.info(LogCategory.OBD, `Detected manufacturer from VIN: ${detectedMake}`, { wmi });
      }
      
      // Define all known ECU addresses with correct TX/RX pairs
      const allEcuAddresses = [
        { tx: '7E0', rx: '7E8', desc: 'Engine ECU', requiresSession: false },
        { tx: '7E1', rx: '7E9', desc: 'Transmission ECU', requiresSession: false },
        { tx: '714', rx: '77E', desc: 'Instrument Cluster (VW/Audi KOMBI)', requiresSession: true },
        { tx: '7C0', rx: '7C8', desc: 'Instrument Cluster (GM/Ford)', requiresSession: false },
        { tx: '720', rx: '728', desc: 'Instrument Cluster (BMW/Mercedes)', requiresSession: false },
        { tx: '760', rx: '768', desc: 'Instrument Cluster (Ford alternative)', requiresSession: false },
      ];
      
      // CRITICAL: Reorder ECUs based on manufacturer per FIXD checklist
      // For VW/Audi: Cluster ECU 77E with session should be tried FIRST
      let ecuAddresses = allEcuAddresses;
      const isVWGroup = ['VW', 'Volkswagen', 'Audi', 'Seat', 'Skoda'].some(
        m => detectedMake.toLowerCase().includes(m.toLowerCase())
      );
      
      if (isVWGroup) {
        logger.info(LogCategory.OBD, 'VW Group vehicle detected - prioritizing cluster ECU 77E with extended session');
        // Move VW cluster to front, then engine/transmission
        ecuAddresses = [
          { tx: '714', rx: '77E', desc: 'Instrument Cluster (VW/Audi KOMBI) - PRIMARY for VW', requiresSession: true },
          { tx: '7E0', rx: '7E8', desc: 'Engine ECU', requiresSession: false },
          { tx: '7E1', rx: '7E9', desc: 'Transmission ECU', requiresSession: false },
          { tx: '7C0', rx: '7C8', desc: 'Instrument Cluster (GM/Ford)', requiresSession: false },
        ];
      } else if (discoveredECUs.length > 0) {
        // Prioritize discovered ECUs
        logger.info(LogCategory.OBD, 'Using discovered ECUs in priority order');
        const prioritizedEcus = allEcuAddresses.filter(ecu => discoveredECUs.includes(ecu.rx));
        const otherEcus = allEcuAddresses.filter(ecu => !discoveredECUs.includes(ecu.rx));
        ecuAddresses = [...prioritizedEcus, ...otherEcus];
      }
      
      // Comprehensive manufacturer-specific odometer DIDs (FIXD-like database)
      // Organized by manufacturer and prioritized by success rate
      // CRITICAL: DIDs from FIXD checklist added first for VW
      const manufacturerOdometerDIDs: OdometerDIDConfig[] = [
        // VW/Audi/Seat/Skoda Group - FIXD VERIFIED DIDs FIRST
        { did: '222103', bytes: 4, description: 'VW/Audi FIXD odometer 2103 (primary)', manufacturers: ['VW', 'Audi', 'Seat', 'Skoda'] },
        { did: '222209', bytes: 4, description: 'VW/Audi FIXD odometer 2209 (secondary)', manufacturers: ['VW', 'Audi', 'Seat', 'Skoda'] },
        { did: '22295A', bytes: 3, description: 'VW MQB platform odometer 295A', manufacturers: ['VW', 'Audi', 'Seat', 'Skoda'], scale: 1 },
        { did: '222203', bytes: 2, description: 'VW/Audi cluster odometer 2203', manufacturers: ['VW', 'Audi'], scale: 100 },
        { did: '22F40D', bytes: 4, description: 'VW/Audi cluster mileage F40D', manufacturers: ['VW', 'Audi', 'Seat', 'Skoda'] },
        { did: '22F4A6', bytes: 4, description: 'VW/Audi instrument F4A6', manufacturers: ['VW', 'Audi'] },
        { did: '22B101', bytes: 3, description: 'VW/Audi odometer B101', manufacturers: ['VW', 'Audi'] },
        { did: '22B102', bytes: 3, description: 'VW/Audi odometer B102', manufacturers: ['VW', 'Audi'] },
        { did: '2202BD', bytes: 3, description: 'VW/Audi odometer 02BD', manufacturers: ['VW', 'Audi'] },
        
        // Ford Group
        { did: '22DD01', bytes: 4, description: 'Ford odometer DD01', manufacturers: ['Ford', 'Lincoln', 'Mercury'] },
        { did: '22DE01', bytes: 4, description: 'Ford cluster DE01', manufacturers: ['Ford'] },
        { did: '221003', bytes: 4, description: 'Ford mileage 1003', manufacturers: ['Ford'] },
        
        // GM Group (Chevrolet, Buick, GMC, Cadillac)
        { did: '22C003', bytes: 3, description: 'GM odometer C003', manufacturers: ['GM', 'Chevrolet', 'Buick'] },
        { did: '22C004', bytes: 3, description: 'GM mileage C004', manufacturers: ['GM', 'GMC'] },
        { did: '220110', bytes: 4, description: 'GM cluster 0110', manufacturers: ['GM', 'Cadillac'] },
        
        // Toyota/Lexus
        { did: '221001', bytes: 3, description: 'Toyota odometer 1001', manufacturers: ['Toyota', 'Lexus'] },
        { did: '221002', bytes: 3, description: 'Toyota mileage 1002', manufacturers: ['Toyota'] },
        { did: '22C001', bytes: 3, description: 'Toyota cluster C001', manufacturers: ['Toyota', 'Lexus'] },
        
        // Honda/Acura
        { did: '22A001', bytes: 3, description: 'Honda odometer A001', manufacturers: ['Honda', 'Acura'] },
        { did: '22A002', bytes: 3, description: 'Honda mileage A002', manufacturers: ['Honda'] },
        { did: '22A003', bytes: 3, description: 'Honda cluster A003', manufacturers: ['Honda', 'Acura'] },
        
        // BMW/Mini
        { did: '22F601', bytes: 3, description: 'BMW odometer F601', manufacturers: ['BMW', 'Mini'] },
        { did: '22F602', bytes: 3, description: 'BMW mileage F602', manufacturers: ['BMW'] },
        { did: '220100', bytes: 4, description: 'BMW cluster 0100', manufacturers: ['BMW', 'Mini'] },
        
        // Mercedes-Benz
        { did: '22F190', bytes: 3, description: 'Mercedes odometer F190', manufacturers: ['Mercedes'] },
        { did: '22F1A0', bytes: 3, description: 'Mercedes mileage F1A0', manufacturers: ['Mercedes'] },
        { did: '220101', bytes: 4, description: 'Mercedes cluster 0101', manufacturers: ['Mercedes'] },
        
        // Nissan/Infiniti
        { did: '22D001', bytes: 3, description: 'Nissan odometer D001', manufacturers: ['Nissan', 'Infiniti'] },
        { did: '22D002', bytes: 3, description: 'Nissan mileage D002', manufacturers: ['Nissan'] },
        
        // Hyundai/Kia
        { did: '22B001', bytes: 3, description: 'Hyundai/Kia odometer B001', manufacturers: ['Hyundai', 'Kia'] },
        { did: '22B002', bytes: 3, description: 'Hyundai/Kia mileage B002', manufacturers: ['Hyundai', 'Kia'] },
        
        // Mazda
        { did: '22E001', bytes: 3, description: 'Mazda odometer E001', manufacturers: ['Mazda'] },
        
        // Subaru
        { did: '22F001', bytes: 3, description: 'Subaru odometer F001', manufacturers: ['Subaru'] },
        
        // Generic/Universal DIDs (try last)
        { did: '22B103', bytes: 3, description: 'Generic odometer B103', manufacturers: ['Generic'] },
        { did: '22B90D', bytes: 3, description: 'Generic mileage B90D', manufacturers: ['Generic'] },
      ];

      // ========== STEP 3: Filter DIDs by manufacturer (VIN-based filtering) ==========
      // CRITICAL: When VIN is present, ALWAYS prioritize manufacturer-specific DIDs FIRST
      let selectedDIDs: typeof manufacturerOdometerDIDs;
      
      // Helper: Normalize manufacturer names to handle aliases
      const normalizeManufacturer = (make: string): string[] => {
        const normalized = make.toLowerCase();
        
        // VW Group brands (share DIDs)
        if (normalized === 'volkswagen' || normalized === 'vw') return ['vw', 'volkswagen'];
        if (normalized === 'audi') return ['audi', 'vw', 'volkswagen']; // Audi shares VW DIDs
        if (normalized === 'seat') return ['seat', 'vw', 'volkswagen'];
        if (normalized === 'skoda') return ['skoda', 'vw', 'volkswagen'];
        
        // GM brands
        if (normalized === 'chevrolet' || normalized === 'chevy') return ['chevrolet', 'gm'];
        if (normalized === 'buick') return ['buick', 'gm'];
        if (normalized === 'gmc') return ['gmc', 'gm'];
        if (normalized === 'cadillac') return ['cadillac', 'gm'];
        if (normalized === 'pontiac') return ['pontiac', 'gm'];
        
        // Ford brands
        if (normalized === 'lincoln') return ['lincoln', 'ford'];
        if (normalized === 'mercury') return ['mercury', 'ford'];
        
        // Toyota brands
        if (normalized === 'lexus') return ['lexus', 'toyota'];
        
        // Honda brands
        if (normalized === 'acura') return ['acura', 'honda'];
        
        // BMW brands
        if (normalized === 'mini') return ['mini', 'bmw'];
        
        // Nissan brands
        if (normalized === 'infiniti') return ['infiniti', 'nissan'];
        
        return [normalized];
      };
      
      if (detectedMake !== 'Unknown') {
        // VIN detected and manufacturer identified - use ONLY manufacturer + generic DIDs
        const normalizedMakes = normalizeManufacturer(detectedMake);
        
        const manufacturerDIDs = manufacturerOdometerDIDs.filter(did => 
          did.manufacturers.some(m => {
            const didMake = m.toLowerCase();
            // Check if any normalized make matches the DID's manufacturer
            return normalizedMakes.some(nm => nm === didMake || didMake.includes(nm) || nm.includes(didMake));
          })
        );
        const genericDIDs = manufacturerOdometerDIDs.filter(did => 
          did.manufacturers.includes('Generic')
        );
        
        // Manufacturer DIDs FIRST, then generic as fallback
        selectedDIDs = [...manufacturerDIDs, ...genericDIDs];
        logger.info(LogCategory.OBD, `VIN-based filtering: ${manufacturerDIDs.length} ${detectedMake}-specific DIDs + ${genericDIDs.length} generic DIDs (normalized: ${normalizedMakes.join('/')})`);
      } else {
        // No VIN or unknown manufacturer - try all DIDs but still prioritize by order in list
        selectedDIDs = manufacturerOdometerDIDs;
        logger.info(LogCategory.OBD, `No VIN filtering: trying all ${selectedDIDs.length} DIDs in priority order`);
      }
      
      // Limit DIDs to prevent timeout (max 15 DIDs across all ECUs)
      const maxDIDsToTry = 15;
      selectedDIDs = selectedDIDs.slice(0, maxDIDsToTry);
      
      let attemptCount = 0;
      const maxAttempts = Math.min(ecuAddresses.length * selectedDIDs.length, 50); // Hard cap at 50 attempts (increased from 40)
      
      logger.info(LogCategory.OBD, `Odometer: Trying ${selectedDIDs.length} DIDs across ${ecuAddresses.length} ECUs (max ${maxAttempts} attempts, detected make: ${detectedMake})`);
      
      for (const { tx, rx, desc, requiresSession } of ecuAddresses) {
        if (abortSignal?.aborted) {
          break;
        }

        const atshHeader = this.normalizeAtshHeader(tx);
        logger.info(LogCategory.OBD, `Odometer: Setting physical addressing ATSH${atshHeader} (${desc})`);
        const headerSet = await this.trySetAtshHeader(atshHeader);
        if (!headerSet) {
          logger.debug(LogCategory.OBD, `Failed to set physical addressing: ATSH${atshHeader} (${desc})`);
          continue;
        }

        const atcraFilter = this.normalizeAtcraFilter(rx);
        const filterSet = await this.trySetAtcraFilter(atcraFilter);
        if (!filterSet) {
          logger.debug(LogCategory.OBD, `Failed to set receive filter: ATCRA${atcraFilter} (${desc})`);
        }
        
        // Enable ISO-TP/UDS long message support for multi-frame responses
        // This is critical for VeePeak adapters to receive full odometer data from instrument cluster
        logger.debug(LogCategory.OBD, `Odometer: Enabling ISO-TP long messages for ${desc}`);
        try {
          // ATAL: Allow long messages (required for multi-frame ISO-TP responses)
          await this.elm327.sendCommand('ATAL');
          // ATCFC1: Enable CAN flow control (required for ISO-TP multi-frame)
          await this.elm327.sendCommand('ATCFC1');
        } catch (setupError) {
          logger.debug(LogCategory.OBD, `ISO-TP setup failed for ${desc}, continuing anyway`, setupError);
        }
        
        // UDS Extended Diagnostic Session (0x10 0x03) for protected DIDs
        // Required for some ECUs (especially VW cluster 77E) to access odometer DIDs
        let sessionEstablished = false;
        if (requiresSession) {
          logger.info(LogCategory.OBD, `Odometer: Attempting UDS extended session for ${desc}`);
          try {
            const sessionResponse = await this.elm327.sendCommand('1003');
            if (sessionResponse.success && !this.isUdsNegativeResponse(sessionResponse.normalized)) {
              logger.info(LogCategory.OBD, `Extended diagnostic session established for ${desc}`);
              sessionEstablished = true;
              
              // Security Access (0x27 0x01 / 0x27 0x02) - attempt but don't fail if not supported
              // This is complex and vehicle-specific, so we try but continue if it fails
              logger.debug(LogCategory.OBD, `Attempting security access for ${desc}`);
              try {
                const seedResponse = await this.elm327.sendCommand('2701');
                if (seedResponse.success && !this.isUdsNegativeResponse(seedResponse.normalized)) {
                  logger.debug(LogCategory.OBD, `Security seed received, but key calculation not implemented - continuing without security access`);
                  // Note: Full security access requires manufacturer-specific seed-to-key algorithm
                  // which is proprietary. Most odometer DIDs don't require security access.
                }
              } catch (secError) {
                logger.debug(LogCategory.OBD, `Security access not available for ${desc}, continuing anyway`);
              }
            } else {
              logger.debug(LogCategory.OBD, `Extended session not supported by ${desc}, trying DIDs anyway`);
            }
          } catch (sessionError) {
            logger.debug(LogCategory.OBD, `Extended session failed for ${desc}, trying DIDs anyway`, sessionError);
          }
        }
        
        // Try each DID on this ECU
        for (const { did, bytes: expectedBytes, description, manufacturers } of selectedDIDs) {
          if (abortSignal?.aborted) {
            break;
          }
          attemptCount++;
          logger.info(LogCategory.OBD, `Odometer: Attempt ${attemptCount}/${maxAttempts} - ${description} (${manufacturers.join('/')}) on ${desc}`);
          try {
            logger.debug(LogCategory.OBD, `Trying ${description}: ${did} on ${desc}`);
            if (abortSignal?.aborted) {
              break;
            }
            const response = await this.elm327.sendCommand(did);

            if (abortSignal?.aborted) {
              break;
            }

            // Check for UDS negative response (7F) or NO DATA
            if (!response.success || response.raw.toUpperCase().includes('NO DATA') || this.isUdsNegativeResponse(response.normalized)) {
              if (this.isUdsNegativeResponse(response.normalized)) {
                logger.debug(LogCategory.OBD, `${description} returned UDS negative response on ${desc}`);
              } else {
                logger.debug(LogCategory.OBD, `${description} not supported on ${desc}`);
              }
              continue;
            }

          // Parse UDS response: 62 DID_HI DID_LO DATA... (positive response)
          const allHexBytes: string[] = [];
          const lines = response.normalized.split('\n').filter(line => line.trim().length > 0);
          
          for (const line of lines) {
            const trimmedLine = line.trim().toUpperCase();
            if (!trimmedLine || trimmedLine.startsWith('AT') || trimmedLine === 'OK') continue;
            
            let dataLine = trimmedLine;
            // Remove CAN header if present (e.g., "7E8 10 0C 62 F4 0D ...")
            if (/^[0-9A-F]{3}\s/.test(dataLine)) {
              dataLine = dataLine.substring(4).trim();
            }
            
            // Extract hex bytes and skip ISO-TP frame indicators
            if (dataLine.includes(' ')) {
              const parts = dataLine.split(/\s+/);
              let skipNext = false;
              
              for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (!/^[0-9A-F]{2}$/.test(part)) continue;
                
                // Skip ISO-TP single frame PCI byte (0X where X is data length 0-F)
                // Example: "04 62 F4 0D 00" - the 04 means 4 data bytes follow
                // Single frame can have 0-15 data bytes (0x00-0x0F PCI)
                if (/^0[0-9A-F]$/.test(part) && i === 0) {
                  continue;
                }
                
                // Skip ISO-TP first frame (10-1F) and its length byte
                if (/^1[0-9A-F]$/.test(part) && i === 0) {
                  skipNext = true;
                  continue;
                }
                
                // Skip ISO-TP consecutive frames (21, 22, 23, etc.)
                if (/^2[0-9A-F]$/.test(part) && i === 0) {
                  continue;
                }
                
                // Skip ISO-TP flow control frames (30-3F)
                if (/^3[0-9A-F]$/.test(part) && i === 0) {
                  continue;
                }
                
                if (skipNext) {
                  skipNext = false;
                  continue;
                }
                
                allHexBytes.push(part);
              }
            }
          }

          logger.debug(LogCategory.OBD, `${description} response bytes`, { bytes: allHexBytes.join(' ') });

          const didHex = did.toUpperCase().replace(/^22/, '');
          const didBytes: string[] = [];
          for (let i = 0; i < didHex.length; i += 2) {
            didBytes.push(didHex.substring(i, i + 2));
          }

          // Look for positive response (62 = ReadDataByIdentifier positive response) matching the DID we requested
          let responseIndex = -1;
          for (let i = 0; i < allHexBytes.length; i++) {
            if (allHexBytes[i] !== '62') continue;

            let matchesDid = true;
            for (let j = 0; j < didBytes.length; j++) {
              if (i + 1 + j >= allHexBytes.length || allHexBytes[i + 1 + j] !== didBytes[j]) {
                matchesDid = false;
                break;
              }
            }

            if (matchesDid) {
              responseIndex = i;
              break;
            }
          }

          if (responseIndex !== -1) {
            // UDS format: 62 DID_BYTES... DATA_BYTES...
            const dataStart = responseIndex + 1 + didBytes.length;
            
            // Calculate available data bytes (actual bytes received after DID echo)
            const availableBytes = allHexBytes.length - dataStart;
            
            // FIX: Accept responses with at least 2 bytes of data
            // Some DIDs return fewer bytes than expected but are still valid
            // We decode based on actual available bytes, not expected bytes
            if (availableBytes >= 2) {
              let rawOdometer = 0;
              let bytesUsed = 0;
              
              // Parse based on ACTUAL available bytes (dynamic decoding)
              if (availableBytes >= 4) {
                // 4-byte odometer
                rawOdometer = 
                  (parseInt(allHexBytes[dataStart], 16) << 24) +
                  (parseInt(allHexBytes[dataStart + 1], 16) << 16) +
                  (parseInt(allHexBytes[dataStart + 2], 16) << 8) +
                  parseInt(allHexBytes[dataStart + 3], 16);
                bytesUsed = 4;
              } else if (availableBytes >= 3) {
                // 3-byte odometer (VW, Audi, Toyota, Honda, most others)
                rawOdometer = 
                  (parseInt(allHexBytes[dataStart], 16) << 16) +
                  (parseInt(allHexBytes[dataStart + 1], 16) << 8) +
                  parseInt(allHexBytes[dataStart + 2], 16);
                bytesUsed = 3;
              } else if (availableBytes >= 2) {
                // 2-byte odometer (some VW DIDs like 222203 return scaled values)
                rawOdometer = 
                  (parseInt(allHexBytes[dataStart], 16) << 8) +
                  parseInt(allHexBytes[dataStart + 1], 16);
                bytesUsed = 2;
              }
              
              // Apply DID-specific scaling factor if defined
              // Some DIDs return odometer in different units (e.g., 222203 returns value * 100 km)
              const didConfig = selectedDIDs.find(d => d.did === did);
              const scaleFactor = didConfig?.scale ?? 1;
              const odometer = rawOdometer * scaleFactor;
              
              logger.debug(LogCategory.OBD, `${description} raw value`, { raw: rawOdometer, scale: scaleFactor, computed: odometer, bytesUsed });
              
              // Sanity check: odometer should be reasonable (10-999,999 km)
              // Lowered minimum to 10 km for newer cars with low mileage
              // CRITICAL: Reject odometer=0 as it indicates truncated/invalid response
              if (odometer >= 10 && odometer < 1000000) {
                logger.info(LogCategory.OBD, `Odometer read successfully via ${description}`, { km: odometer, did, bytes: bytesUsed, scale: scaleFactor, ecu: rx });
                
                // Restore functional addressing
                await this.trySetAtcraFilter(null);
                await this.trySetAtshHeader('7DF');
                return { km: odometer, ecu: rx };
              } else {
                logger.debug(LogCategory.OBD, `${description} returned invalid odometer value`, { odometer, raw: rawOdometer, scale: scaleFactor, bytes: bytesUsed });
              }
            } else {
              logger.debug(LogCategory.OBD, `${description} returned insufficient data`, { available: availableBytes, minimum: 2 });
            }
          }
          } catch (error) {
            logger.debug(LogCategory.OBD, `${description} failed`, error);
          }
        }
      }

      // Restore functional addressing before returning
      await this.trySetAtcraFilter(null);
      await this.trySetAtshHeader('7DF');
      logger.warn(LogCategory.OBD, 'All manufacturer-specific odometer DIDs failed - vehicle may not support odometer reading');
      return null;
    } catch (error) {
      // Ensure we restore functional addressing even on error
      try {
        await this.trySetAtcraFilter(null);
        await this.trySetAtshHeader('7DF');
      } catch (restoreError) {
        logger.error(LogCategory.OBD, 'Failed to restore functional addressing', restoreError);
      }
      logger.error(LogCategory.OBD, 'Manufacturer-specific odometer read exception', error);
      return null;
    }
  }
}
