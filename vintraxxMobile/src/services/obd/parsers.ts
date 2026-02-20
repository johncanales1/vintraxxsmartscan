// OBD-II Response Parsers for VinTraxx SmartScan

import { logger, LogCategory } from '../../utils/Logger';
import { ParsedVin, ParsedDtc } from './types';

/**
 * Parse VIN from Mode 09 PID 02 response
 * Handles multiple formats:
 * - CAN with headers: "7E8 10 14 49 02 01 XX XX XX XX\r\n7E8 21 XX XX XX XX XX XX XX\r\n..."
 * - CAN without headers: "49 02 01 XX XX XX..."
 * - ISO-TP multi-line: "0: 49 02 01 XX\r\n1: XX XX XX..."
 * - No spaces format: "490201XXXXXX..."
 */
export function parseVIN(rawResponse: string): ParsedVin {
  try {
    logger.info(LogCategory.OBD, 'Parsing VIN from raw response', { 
      raw: rawResponse,
      length: rawResponse.length 
    });

    // Check for error responses
    if (rawResponse.toUpperCase().includes('NO DATA') || 
        rawResponse.toUpperCase().includes('ERROR') ||
        rawResponse.toUpperCase().includes('UNABLE TO CONNECT')) {
      logger.warn(LogCategory.OBD, 'VIN response contains error', { raw: rawResponse });
      return {
        vin: '',
        valid: false,
        error: 'Vehicle did not respond to VIN request',
      };
    }

    // Remove common ELM327 artifacts
    let cleaned = rawResponse
      .replace(/>/g, '')
      .replace(/SEARCHING\.\.\./gi, '')
      .replace(/\r/g, '\n')
      .trim();

    logger.debug(LogCategory.OBD, 'Cleaned response', { cleaned });

    // Collect all hex bytes from the response
    const allHexBytes: string[] = [];
    
    // Split into lines and process each
    const lines = cleaned.split('\n').filter(line => line.trim().length > 0);
    
    for (const line of lines) {
      const trimmedLine = line.trim().toUpperCase();
      
      // Skip empty lines and AT command echoes
      if (!trimmedLine || trimmedLine.startsWith('AT') || trimmedLine === 'OK') {
        continue;
      }
      
      // Handle CAN format with headers (e.g., "7E8 10 14 49 02 01 XX XX XX XX")
      // CAN headers are 3 hex chars (7E8, 7E0, etc.)
      let dataLine = trimmedLine;
      
      // Remove CAN header if present (3 hex chars at start)
      if (/^[0-9A-F]{3}\s/.test(dataLine)) {
        dataLine = dataLine.substring(4).trim();
      }
      
      // Remove ISO-TP line numbers (0:, 1:, 2:)
      if (/^\d+:/.test(dataLine)) {
        dataLine = dataLine.replace(/^\d+:\s*/, '');
      }
      
      // Extract hex bytes from this line
      // Handle both spaced format "49 02 01" and no-space format "490201"
      if (dataLine.includes(' ')) {
        // Spaced format
        const parts = dataLine.split(/\s+/);
        for (const part of parts) {
          if (/^[0-9A-F]{2}$/.test(part)) {
            allHexBytes.push(part);
          }
        }
      } else {
        // No-space format - split into pairs
        for (let i = 0; i < dataLine.length; i += 2) {
          const pair = dataLine.substring(i, i + 2);
          if (/^[0-9A-F]{2}$/.test(pair)) {
            allHexBytes.push(pair);
          }
        }
      }
    }

    logger.info(LogCategory.OBD, 'Extracted all hex bytes', { 
      count: allHexBytes.length,
      bytes: allHexBytes.join(' ')
    });

    // Find the VIN data start - look for "49 02" (Mode 09 response for PID 02)
    let vinStartIndex = -1;
    for (let i = 0; i < allHexBytes.length - 1; i++) {
      if (allHexBytes[i] === '49' && allHexBytes[i + 1] === '02') {
        vinStartIndex = i + 2; // Skip 49 02
        break;
      }
    }

    if (vinStartIndex === -1) {
      // Try alternate: just look for sequence of printable ASCII after any header
      logger.warn(LogCategory.OBD, 'Could not find 49 02 marker, trying alternate parsing');
      vinStartIndex = 0;
    }

    // Extract VIN bytes - skip the first byte after 49 02 (message count byte)
    let vinBytes = allHexBytes.slice(vinStartIndex);
    
    // Skip ISO-TP frame bytes if present (10, 14 for first frame; 21, 22 for consecutive)
    // First frame format: 10 LL (where LL is length)
    if (vinBytes.length > 2 && vinBytes[0] === '10') {
      vinBytes = vinBytes.slice(2); // Skip 10 LL
    }
    
    // Skip message count byte (usually 01 for single VIN)
    if (vinBytes.length > 0 && (vinBytes[0] === '01' || parseInt(vinBytes[0], 16) <= 5)) {
      vinBytes = vinBytes.slice(1);
    }
    
    // Remove consecutive frame markers (21, 22, 23...)
    vinBytes = vinBytes.filter((byte, index) => {
      // Check if this looks like a consecutive frame marker
      const val = parseInt(byte, 16);
      // Consecutive frame markers are 21-2F
      if (val >= 0x21 && val <= 0x2F) {
        // Only filter if it's at a position that makes sense for a frame marker
        // (every 7-8 bytes in the sequence)
        return false;
      }
      return true;
    });

    logger.info(LogCategory.OBD, 'VIN bytes after filtering', { 
      count: vinBytes.length,
      bytes: vinBytes.join(' ')
    });

    // Convert hex bytes to ASCII characters
    let vin = '';
    for (const byte of vinBytes) {
      const charCode = parseInt(byte, 16);
      // Valid VIN characters are alphanumeric ASCII (0-9, A-Z, excluding I, O, Q)
      // ASCII range: 48-57 (0-9), 65-90 (A-Z)
      if ((charCode >= 48 && charCode <= 57) || (charCode >= 65 && charCode <= 90)) {
        vin += String.fromCharCode(charCode);
      } else if (charCode >= 97 && charCode <= 122) {
        // Convert lowercase to uppercase
        vin += String.fromCharCode(charCode - 32);
      }
      
      // Stop if we have 17 characters
      if (vin.length >= 17) {
        break;
      }
    }

    vin = vin.trim();
    
    logger.info(LogCategory.OBD, 'Parsed VIN result', { vin, length: vin.length });

    // Validate VIN (should be 17 characters)
    if (vin.length === 17) {
      // Additional VIN validation - check for invalid characters (I, O, Q)
      if (/[IOQ]/i.test(vin)) {
        logger.warn(LogCategory.OBD, 'VIN contains invalid characters', { vin });
      }
      logger.info(LogCategory.OBD, 'VIN parsed successfully', { vin });
      return { vin, valid: true };
    } else if (vin.length > 0) {
      logger.warn(LogCategory.OBD, 'VIN length invalid', { vin, length: vin.length });
      return { vin, valid: false, error: `Invalid VIN length: ${vin.length}` };
    } else {
      logger.warn(LogCategory.OBD, 'No VIN data found in response', { 
        allHexBytes: allHexBytes.join(' '), 
        cleaned 
      });
      return {
        vin: '',
        valid: false,
        error: 'No VIN data found in response',
      };
    }
  } catch (error) {
    logger.error(LogCategory.OBD, 'VIN parsing failed', error);
    return {
      vin: '',
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Parse DTCs from Mode 03 (stored), 07 (pending), or 0A (permanent) response
 * Handles multiple formats:
 * - CAN with headers: "7E8 06 43 01 33 00 00 00 00"
 * - CAN without headers: "43 01 33 00 00 00 00"
 * - No spaces format: "430133000000"
 */
export function parseDTCs(rawResponse: string, mode: '03' | '07' | '0A' = '03'): ParsedDtc[] {
  try {
    logger.info(LogCategory.OBD, `Parsing DTCs (Mode ${mode})`, { raw: rawResponse });

    // Check for "NO DATA" response - means no DTCs stored
    if (rawResponse.toUpperCase().includes('NO DATA')) {
      logger.info(LogCategory.OBD, 'No DTCs found (NO DATA response)');
      return [];
    }

    // Check for error responses
    if (rawResponse.toUpperCase().includes('ERROR') ||
        rawResponse.toUpperCase().includes('UNABLE TO CONNECT')) {
      logger.warn(LogCategory.OBD, 'DTC response contains error', { raw: rawResponse });
      return [];
    }

    // Mode response byte mapping
    const modeResponseMap: Record<string, string> = {
      '03': '43',
      '07': '47',
      '0A': '4A',
    };
    const expectedModeResponse = modeResponseMap[mode];

    // Remove common ELM327 artifacts
    let cleaned = rawResponse
      .replace(/>/g, '')
      .replace(/SEARCHING\.\.\./gi, '')
      .replace(/\r/g, '\n')
      .trim();

    logger.debug(LogCategory.OBD, 'Cleaned DTC response', { cleaned });

    // Split into lines and process each ECU response separately
    const lines = cleaned.split('\n').filter(line => line.trim().length > 0);
    
    // Parse each ECU line separately (prefer 7E8 - primary ECU)
    const ecuResponses: Array<{ ecu: string; bytes: string[] }> = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim().toUpperCase();
      
      // Skip empty lines and AT command echoes
      if (!trimmedLine || trimmedLine.startsWith('AT') || trimmedLine === 'OK') {
        continue;
      }
      
      let ecuId = 'UNKNOWN';
      let dataLine = trimmedLine;
      
      // Extract CAN header if present (3 hex chars at start like 7E8)
      if (/^[0-9A-F]{3}\s/.test(dataLine)) {
        ecuId = dataLine.substring(0, 3);
        dataLine = dataLine.substring(4).trim();
      }
      
      // Extract hex bytes from this line
      const lineBytes: string[] = [];
      if (dataLine.includes(' ')) {
        // Spaced format
        const parts = dataLine.split(/\s+/);
        for (const part of parts) {
          if (/^[0-9A-F]{2}$/.test(part)) {
            lineBytes.push(part);
          }
        }
      } else {
        // No-space format - split into pairs
        for (let i = 0; i < dataLine.length; i += 2) {
          const pair = dataLine.substring(i, i + 2);
          if (/^[0-9A-F]{2}$/.test(pair)) {
            lineBytes.push(pair);
          }
        }
      }
      
      if (lineBytes.length > 0) {
        ecuResponses.push({ ecu: ecuId, bytes: lineBytes });
        logger.debug(LogCategory.OBD, `ECU ${ecuId} response`, { bytes: lineBytes.join(' ') });
      }
    }

    // Prefer 7E8 (primary ECU) if available
    const preferredEcu = ecuResponses.find(r => r.ecu === '7E8') || ecuResponses[0];
    
    if (!preferredEcu) {
      logger.warn(LogCategory.OBD, 'No valid ECU responses found');
      return [];
    }

    logger.info(LogCategory.OBD, `Using ECU ${preferredEcu.ecu} for DTC parsing`, { 
      bytes: preferredEcu.bytes.join(' ')
    });

    const allHexBytes = preferredEcu.bytes;

    // Find the mode response byte (43, 47, or 4A)
    let dataStartIndex = -1;
    for (let i = 0; i < allHexBytes.length; i++) {
      if (allHexBytes[i] === expectedModeResponse) {
        dataStartIndex = i + 1; // Start after the mode response byte
        break;
      }
    }

    if (dataStartIndex === -1) {
      logger.warn(LogCategory.OBD, `Could not find mode response byte ${expectedModeResponse}`);
      return [];
    }

    // Skip CAN DLC/length byte if present (first byte after mode response)
    // CAN DLC is typically 02-08 for DTC responses
    let dtcDataStart = dataStartIndex;
    if (dataStartIndex < allHexBytes.length) {
      const possibleDlc = parseInt(allHexBytes[dataStartIndex], 16);
      // If the byte looks like a DLC (0x02-0x08), skip it
      if (possibleDlc >= 0x02 && possibleDlc <= 0x08) {
        dtcDataStart = dataStartIndex + 1;
        logger.debug(LogCategory.OBD, `Skipping CAN DLC byte: ${allHexBytes[dataStartIndex]}`);
      }
    }

    // Check for "no codes" response (00 after mode response or DLC)
    if (dtcDataStart < allHexBytes.length && allHexBytes[dtcDataStart] === '00') {
      logger.info(LogCategory.OBD, 'No DTCs found (00 response)');
      return [];
    }

    // Extract DTC bytes - the bytes after the mode response (and DLC if present)
    // Format: [DTC1_high] [DTC1_low] [DTC2_high] [DTC2_low] ...
    const dtcBytes = allHexBytes.slice(dtcDataStart);
    const dtcs: ParsedDtc[] = [];

    logger.info(LogCategory.OBD, 'DTC bytes to process', { bytes: dtcBytes.join(' ') });

    // Process DTCs in pairs
    for (let i = 0; i < dtcBytes.length; i += 2) {
      if (i + 1 >= dtcBytes.length) break;

      const highByte = parseInt(dtcBytes[i], 16);
      const lowByte = parseInt(dtcBytes[i + 1], 16);

      // Check if this is a valid DTC (not 0x0000 and not padding)
      if (highByte === 0 && lowByte === 0) {
        continue;
      }

      const dtc = decodeDTC(highByte, lowByte);
      if (dtc) {
        dtcs.push(dtc);
        logger.info(LogCategory.OBD, `Decoded DTC: ${dtc.code}`, { 
          highByte: dtcBytes[i], 
          lowByte: dtcBytes[i + 1],
          description: dtc.description
        });
      }
    }

    logger.info(LogCategory.OBD, `Parsed ${dtcs.length} DTCs`, { codes: dtcs.map(d => d.code) });
    return dtcs;
  } catch (error) {
    logger.error(LogCategory.OBD, 'DTC parsing failed', error);
    return [];
  }
}

/**
 * Decode DTC from two bytes
 */
function decodeDTC(highByte: number, lowByte: number): ParsedDtc | null {
  // First 2 bits of high byte determine the type
  const typeCode = (highByte >> 6) & 0x03;
  const types = ['P', 'C', 'B', 'U'] as const;
  const type = types[typeCode];

  // Next 2 bits are first digit
  const firstDigit = (highByte >> 4) & 0x03;

  // Last 4 bits of high byte are second digit
  const secondDigit = highByte & 0x0F;

  // Low byte contains third and fourth digits
  const thirdDigit = (lowByte >> 4) & 0x0F;
  const fourthDigit = lowByte & 0x0F;

  const code = `${type}${firstDigit}${secondDigit.toString(16).toUpperCase()}${thirdDigit.toString(16).toUpperCase()}${fourthDigit.toString(16).toUpperCase()}`;

  const description = getDTCDescription(code);
  const category = getDTCCategory(type);

  return {
    code,
    description,
    type,
    category,
  };
}

/**
 * Get DTC category based on type
 */
function getDTCCategory(type: 'P' | 'C' | 'B' | 'U'): string {
  switch (type) {
    case 'P':
      return 'Powertrain';
    case 'C':
      return 'Chassis';
    case 'B':
      return 'Body';
    case 'U':
      return 'Network';
    default:
      return 'Unknown';
  }
}

/**
 * Get DTC description from code
 * This is a minimal offline dictionary for common codes
 */
function getDTCDescription(code: string): string {
  const descriptions: Record<string, string> = {
    // Common Powertrain codes
    'P0000': 'No fault detected',
    'P0100': 'Mass or Volume Air Flow Circuit Malfunction',
    'P0101': 'Mass or Volume Air Flow Circuit Range/Performance Problem',
    'P0102': 'Mass or Volume Air Flow Circuit Low Input',
    'P0103': 'Mass or Volume Air Flow Circuit High Input',
    'P0171': 'System Too Lean (Bank 1)',
    'P0172': 'System Too Rich (Bank 1)',
    'P0174': 'System Too Lean (Bank 2)',
    'P0175': 'System Too Rich (Bank 2)',
    'P0300': 'Random/Multiple Cylinder Misfire Detected',
    'P0301': 'Cylinder 1 Misfire Detected',
    'P0302': 'Cylinder 2 Misfire Detected',
    'P0303': 'Cylinder 3 Misfire Detected',
    'P0304': 'Cylinder 4 Misfire Detected',
    'P0305': 'Cylinder 5 Misfire Detected',
    'P0306': 'Cylinder 6 Misfire Detected',
    'P0420': 'Catalyst System Efficiency Below Threshold (Bank 1)',
    'P0430': 'Catalyst System Efficiency Below Threshold (Bank 2)',
    'P0440': 'Evaporative Emission Control System Malfunction',
    'P0442': 'Evaporative Emission Control System Leak Detected (Small Leak)',
    'P0443': 'Evaporative Emission Control System Purge Control Valve Circuit Malfunction',
    'P0455': 'Evaporative Emission Control System Leak Detected (Large Leak)',
    'P0500': 'Vehicle Speed Sensor Malfunction',
    'P0505': 'Idle Control System Malfunction',
    'P0506': 'Idle Control System RPM Lower Than Expected',
    'P0507': 'Idle Control System RPM Higher Than Expected',
    'P0700': 'Transmission Control System Malfunction',
    'P0715': 'Input/Turbine Speed Sensor Circuit Malfunction',
    'P0720': 'Output Speed Sensor Circuit Malfunction',
    'P0725': 'Engine Speed Input Circuit Malfunction',
    'P0730': 'Incorrect Gear Ratio',
    'P0740': 'Torque Converter Clutch Circuit Malfunction',
    
    // Common Chassis codes
    'C0035': 'Left Front Wheel Speed Circuit Malfunction',
    'C0040': 'Right Front Wheel Speed Circuit Malfunction',
    'C0045': 'Left Rear Wheel Speed Circuit Malfunction',
    'C0050': 'Right Rear Wheel Speed Circuit Malfunction',
    
    // Common Body codes
    'B0001': 'Driver Airbag Circuit',
    'B0002': 'Passenger Airbag Circuit',
    
    // Common Network codes
    'U0001': 'High Speed CAN Communication Bus',
    'U0100': 'Lost Communication With ECM/PCM',
    'U0101': 'Lost Communication With TCM',
    'U0121': 'Lost Communication With ABS Control Module',
  };

  return descriptions[code] || 'Unknown DTC - Consult service manual';
}

/**
 * Normalize OBD response by removing common artifacts
 */
export function normalizeResponse(raw: string): string {
  return raw
    .replace(/>/g, '')
    .replace(/SEARCHING\.\.\./g, '')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

/**
 * Check if response indicates an error
 */
export function isErrorResponse(response: string): boolean {
  const upper = response.toUpperCase();
  
  const errorPatterns = [
    'ERROR',
    'NO DATA',
    'UNABLE TO CONNECT',
    'BUS INIT',
    'CAN ERROR',
    'STOPPED', // Vehicle not responding or search interrupted
    '?',
  ];

  // Check standard error patterns
  if (errorPatterns.some(pattern => upper.includes(pattern))) {
    return true;
  }
  
  // Check for UDS negative response (7F)
  // Format: 7F [Service ID] [NRC]
  // Example: "7F 22 31" = Service 22 (ReadDataByIdentifier) rejected with NRC 31 (requestOutOfRange)
  if (/\b7F\s+[0-9A-F]{2}\s+[0-9A-F]{2}\b/.test(upper)) {
    return true;
  }
  
  return false;
}
