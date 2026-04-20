// OBD-II Response Parsers for VinTraxx SmartScan

import { logger, LogCategory } from '../../utils/Logger';
import { ParsedVin, ParsedDtc } from './types';

/**
 * Strip CAN headers from a single OBD response line.
 * Handles both standard 11-bit CAN ("7E8 ...") and extended 29-bit CAN ("18 DA F1 XX ...").
 * Returns only the data bytes as a hex string.
 */
export function stripCanHeader(line: string): string {
  const trimmed = line.trim().toUpperCase();

  // Extended 29-bit CAN addressing: "18 DA F1 XX ..."
  // Pattern: starts with "18 DA" followed by two more hex byte-pairs
  const extMatch = trimmed.match(/^18\s+DA\s+[0-9A-F]{2}\s+[0-9A-F]{2}\s+(.*)$/);
  if (extMatch) {
    return extMatch[1].trim();
  }

  // Standard 11-bit CAN header: 3 hex chars like "7E8", "7E0", "7EA"
  const stdMatch = trimmed.match(/^[0-9A-F]{3}\s+(.*)$/);
  if (stdMatch) {
    return stdMatch[1].trim();
  }

  // ISO-TP line number format: "0: ...", "1: ..."
  const isoMatch = trimmed.match(/^\d+:\s*(.*)$/);
  if (isoMatch) {
    return isoMatch[1].trim();
  }

  return trimmed;
}

/**
 * Extract hex byte-pairs from a data string.
 * Handles both spaced ("49 02 01") and compact ("490201") formats.
 */
export function extractHexBytes(data: string): string[] {
  const bytes: string[] = [];
  if (data.includes(' ')) {
    for (const part of data.split(/\s+/)) {
      if (/^[0-9A-F]{2}$/.test(part)) {
        bytes.push(part);
      }
    }
  } else {
    for (let i = 0; i < data.length; i += 2) {
      const pair = data.substring(i, i + 2);
      if (/^[0-9A-F]{2}$/.test(pair)) {
        bytes.push(pair);
      }
    }
  }
  return bytes;
}

/**
 * Parse VIN from Mode 09 PID 02 response
 * Handles:
 * - Standard CAN (7E8 headers) and extended CAN (18 DA F1 XX headers)
 * - ISO-TP multi-frame: first frame (1X), consecutive frames (2X)
 * - Single-frame responses
 * - No spaces format
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
    const cleaned = rawResponse
      .replace(/>/g, '')
      .replace(/SEARCHING\.\.\./gi, '')
      .replace(/\r/g, '\n')
      .trim();

    logger.debug(LogCategory.OBD, 'Cleaned response', { cleaned });

    // Split into lines, strip CAN headers, extract hex bytes per line
    const lines = cleaned.split('\n').filter(line => line.trim().length > 0);
    
    // Process each line: strip CAN header, then extract data bytes
    const frameDataLines: string[][] = [];
    for (const line of lines) {
      const trimmedLine = line.trim().toUpperCase();
      
      // Skip empty lines and AT command echoes
      if (!trimmedLine || trimmedLine.startsWith('AT') || trimmedLine === 'OK') {
        continue;
      }

      const dataOnly = stripCanHeader(trimmedLine);
      const bytes = extractHexBytes(dataOnly);
      if (bytes.length > 0) {
        frameDataLines.push(bytes);
      }
    }

    logger.info(LogCategory.OBD, 'Frames after header stripping', {
      frameCount: frameDataLines.length,
      frames: frameDataLines.map(f => f.join(' ')),
    });

    // Reassemble ISO-TP multi-frame data
    // After stripping CAN headers, each line's first byte(s) are ISO-TP framing:
    //   First Frame:       1X LL (X=high nibble of length, LL=low byte) then data
    //   Consecutive Frame: 2X (X=sequence number) then data
    //   Single Frame:      0X (X=data length) then data
    // We need to strip these ISO-TP bytes and concatenate only the payload.

    let payloadBytes: string[] = [];
    let isMultiFrame = false;

    for (const frameBytes of frameDataLines) {
      if (frameBytes.length === 0) continue;

      const firstByte = parseInt(frameBytes[0], 16);
      const frameType = (firstByte >> 4) & 0x0F;

      if (frameType === 1) {
        // First Frame: 1X LL DATA...
        // Skip first 2 bytes (1X and LL)
        isMultiFrame = true;
        payloadBytes = payloadBytes.concat(frameBytes.slice(2));
      } else if (frameType === 2) {
        // Consecutive Frame: 2X DATA...
        // Skip first byte (2X sequence number)
        payloadBytes = payloadBytes.concat(frameBytes.slice(1));
      } else if (frameType === 0) {
        // Single Frame: 0X DATA...
        // Skip first byte (0X length)
        payloadBytes = payloadBytes.concat(frameBytes.slice(1));
      } else {
        // Unknown frame type - include all bytes as-is
        // This handles non-ISO-TP responses (e.g., already-assembled data)
        payloadBytes = payloadBytes.concat(frameBytes);
      }
    }

    logger.info(LogCategory.OBD, 'Reassembled ISO-TP payload', {
      isMultiFrame,
      count: payloadBytes.length,
      bytes: payloadBytes.join(' '),
    });

    // Now payloadBytes should be the service response: 49 02 01 <VIN bytes>
    // Find "49 02" marker
    let vinStartIndex = -1;
    for (let i = 0; i < payloadBytes.length - 1; i++) {
      if (payloadBytes[i] === '49' && payloadBytes[i + 1] === '02') {
        vinStartIndex = i + 2; // Skip 49 02
        break;
      }
    }

    if (vinStartIndex === -1) {
      logger.warn(LogCategory.OBD, 'Could not find 49 02 marker, trying raw payload');
      vinStartIndex = 0;
    }

    let vinBytes = payloadBytes.slice(vinStartIndex);

    // Skip message count byte (usually 01 for single VIN)
    if (vinBytes.length > 0) {
      const countByte = parseInt(vinBytes[0], 16);
      if (countByte >= 0x01 && countByte <= 0x05) {
        vinBytes = vinBytes.slice(1);
      }
    }

    logger.info(LogCategory.OBD, 'VIN hex bytes', {
      count: vinBytes.length,
      bytes: vinBytes.join(' '),
    });

    // Convert hex bytes to ASCII characters
    let vin = '';
    for (const byte of vinBytes) {
      const charCode = parseInt(byte, 16);
      // Valid VIN characters: 0-9 (0x30-0x39), A-Z (0x41-0x5A)
      if ((charCode >= 0x30 && charCode <= 0x39) || (charCode >= 0x41 && charCode <= 0x5A)) {
        vin += String.fromCharCode(charCode);
      } else if (charCode >= 0x61 && charCode <= 0x7A) {
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
      if (/[IOQ]/i.test(vin)) {
        logger.warn(LogCategory.OBD, 'VIN contains invalid characters (I, O, or Q)', { vin });
      }
      logger.info(LogCategory.OBD, 'VIN parsed successfully', { vin });
      return { vin, valid: true };
    } else if (vin.length > 0) {
      logger.warn(LogCategory.OBD, 'VIN length invalid', { vin, length: vin.length });
      return { vin, valid: false, error: `Invalid VIN length: ${vin.length}` };
    } else {
      logger.warn(LogCategory.OBD, 'No VIN data found in response', {
        payloadBytes: payloadBytes.join(' '),
        cleaned,
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
      
      // Extract CAN header and ECU ID
      // Extended 29-bit CAN: "18 DA F1 58 ..." → ECU from 4th byte (58→7E8 mapping)
      const extHeaderMatch = dataLine.match(/^18\s+DA\s+F1\s+([0-9A-F]{2})\s+(.*)$/);
      if (extHeaderMatch) {
        // Map extended address byte to standard ECU ID
        // 58→7E8(PCM), 59→7E9(TCM), 5A→7EA, 87→7E0(hybrid)
        const addrByte = extHeaderMatch[1];
        const addrMap: Record<string, string> = {
          '58': '7E8', '59': '7E9', '5A': '7EA', '5B': '7EB',
          '5C': '7EC', '5D': '7ED', '5E': '7EE', '5F': '7EF',
          '87': '7E0', '88': '7E1',
        };
        ecuId = addrMap[addrByte] || addrByte;
        dataLine = extHeaderMatch[2].trim();
      } else if (/^[0-9A-F]{3}\s/.test(dataLine)) {
        // Standard 11-bit CAN: "7E8 ..."
        ecuId = dataLine.substring(0, 3);
        dataLine = dataLine.substring(4).trim();
      }
      
      // Extract hex bytes from this line
      const lineBytes = extractHexBytes(dataLine);
      
      if (lineBytes.length > 0) {
        ecuResponses.push({ ecu: ecuId, bytes: lineBytes });
        logger.debug(LogCategory.OBD, `ECU ${ecuId} response`, { bytes: lineBytes.join(' ') });
      }
    }

    // Group all frames by ECU and reassemble ISO-TP multi-frame responses
    const ecuGrouped: Record<string, string[][]> = {};
    for (const resp of ecuResponses) {
      if (!ecuGrouped[resp.ecu]) ecuGrouped[resp.ecu] = [];
      ecuGrouped[resp.ecu].push(resp.bytes);
    }

    // Reassemble: merge first-frame + continuation-frame data for each ECU
    const reassembled: Array<{ ecu: string; bytes: string[] }> = [];
    for (const [ecu, frames] of Object.entries(ecuGrouped)) {
      if (frames.length === 1) {
        // Single-frame response
        const fb = frames[0];
        const firstByteVal = parseInt(fb[0], 16);
        if ((firstByteVal & 0xF0) === 0x00 && fb.length > 1) {
          // Single frame: first nibble 0, low nibble = payload length
          reassembled.push({ ecu, bytes: fb.slice(1) });
        } else {
          reassembled.push({ ecu, bytes: fb });
        }
      } else {
        // Multi-frame ISO-TP: first byte of first frame starts with 1x
        const firstFrame = frames[0];
        const firstByteVal = parseInt(firstFrame[0], 16);
        if ((firstByteVal & 0xF0) === 0x10) {
          // First Frame: bytes [10 LL] [data...]
          // Skip first 2 bytes (PCI: type + length)
          const payload: string[] = firstFrame.slice(2);
          // Continuation frames: first byte is 2x (sequence), skip it
          for (let fi = 1; fi < frames.length; fi++) {
            const cf = frames[fi];
            const cfFirstByte = parseInt(cf[0], 16);
            if ((cfFirstByte & 0xF0) === 0x20) {
              // Strip sequence byte, add remaining data (skip padding AA bytes)
              for (let bi = 1; bi < cf.length; bi++) {
                if (cf[bi] !== 'AA') {
                  payload.push(cf[bi]);
                }
              }
            } else {
              payload.push(...cf);
            }
          }
          reassembled.push({ ecu, bytes: payload });
          logger.info(LogCategory.OBD, `Reassembled multi-frame for ECU ${ecu}`, { bytes: payload.join(' ') });
        } else {
          // Not ISO-TP multi-frame, just use first frame
          reassembled.push({ ecu, bytes: firstFrame });
        }
      }
    }

    // Prefer 7E8 (primary ECU) if available
    const preferredEcu = reassembled.find(r => r.ecu === '7E8') || reassembled[0];
    
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
    'P0351': 'Ignition Coil A Primary/Secondary Circuit',
    'P0352': 'Ignition Coil B Primary/Secondary Circuit',
    'P0353': 'Ignition Coil C Primary/Secondary Circuit',
    'P0354': 'Ignition Coil D Primary/Secondary Circuit',
    'P0355': 'Ignition Coil E Primary/Secondary Circuit',
    'P0356': 'Ignition Coil F Primary/Secondary Circuit',
    
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

/**
 * ISO 14229 (UDS) Negative Response Codes — subset most common on OBD-II
 * adapters. Used when the ECU answers `7F <svc> <nrc>` instead of a positive
 * response, to surface a human-meaningful reason up to the UI layer.
 */
export const NRC_LABELS: Record<string, string> = {
  '10': 'General Reject',
  '11': 'Service Not Supported',
  '12': 'Sub-Function Not Supported',
  '13': 'Incorrect Message Length Or Invalid Format',
  '14': 'Response Too Long',
  '21': 'Busy - Repeat Request',
  '22': 'Conditions Not Correct',
  '24': 'Request Sequence Error',
  '25': 'No Response From Subnet Component',
  '26': 'Failure Prevents Execution Of Requested Action',
  '31': 'Request Out Of Range',
  '33': 'Security Access Denied',
  '35': 'Invalid Key',
  '36': 'Exceeded Number Of Attempts',
  '37': 'Required Time Delay Not Expired',
  '70': 'Upload/Download Not Accepted',
  '71': 'Transfer Data Suspended',
  '72': 'General Programming Failure',
  '73': 'Wrong Block Sequence Counter',
  '78': 'Response Pending',
  '7E': 'Sub-Function Not Supported In Active Session',
  '7F': 'Service Not Supported In Active Session',
};

/**
 * Parse the first UDS negative response found in the normalized adapter
 * response, returning a structured payload or null if none is present.
 * Example input: "7F 04 22" → `{ serviceId: '04', nrc: '22', label: 'Conditions Not Correct' }`.
 */
export function parseNegativeResponse(
  normalized: string,
): { serviceId: string; nrc: string; label: string } | null {
  const match = normalized.toUpperCase().match(/\b7F\s+([0-9A-F]{2})\s+([0-9A-F]{2})\b/);
  if (!match) return null;
  const [, serviceId, nrc] = match;
  const label = NRC_LABELS[nrc] ?? `Unknown NRC 0x${nrc}`;
  return { serviceId, nrc, label };
}
