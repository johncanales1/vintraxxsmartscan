// OBD2 Scanner Detection Utility for VinTraxx SmartScan

/**
 * Common OBD2 scanner device name patterns
 * Based on research of popular OBD2 adapters
 */
export const OBD2_DEVICE_PATTERNS = {
  // Exact device names (case insensitive)
  EXACT_NAMES: [
    'VEEPEAK',
    'KONNWEI', 
    'BAFX',
    'VGATE',
    'ICAR',
    'ELM327',
    'V-LINKER',
    'VLINKER',
    'LELINK',
    'OBDLINK',
    'SCANMASTER',
    'CARSCANNER',
    'TORQUE',
    'OBD',
    'OBDII',
    'OBD2',
    'DIAG',
    'DIAGNOSTIC',
    'ADAPTER',
    'SCANNER',
    'VCI',
    'INTERFACE',
  ],
  
  // Partial name patterns (case insensitive)
  PARTIAL_PATTERNS: [
    'VEEPEAK',
    'KONNWEI',
    'BAFX', 
    'VGATE',
    'ICAR',
    'ELM',
    'V-LINK',
    'V-LINKER',
    'VLINKER',
    'LELINK',
    'OBDLINK',
    'OBD',
    'SCAN',
    'DIAG',
    'ADAPT',
  ],
  
  // Common OBD2 scanner prefixes
  PREFIXES: [
    'OBD',
    'ELM',
    'VAG',
    'BMW',
    'MERCEDES',
    'FORD',
    'GM',
    'HONDA',
    'TOYOTA',
    'NISSAN',
  ],
};

/**
 * Check if a device name matches OBD2 scanner patterns
 * @param deviceName - The BLE device name
 * @returns true if the device appears to be an OBD2 scanner
 */
export function isObd2Scanner(deviceName: string | null): boolean {
  if (!deviceName || typeof deviceName !== 'string') {
    return false;
  }

  const name = deviceName.toUpperCase().trim();
  
  // Check for empty or very short names
  if (name.length < 2) {
    return false;
  }

  // Check exact matches first
  for (const exactName of OBD2_DEVICE_PATTERNS.EXACT_NAMES) {
    if (name === exactName) {
      return true;
    }
  }

  // Check partial matches
  for (const pattern of OBD2_DEVICE_PATTERNS.PARTIAL_PATTERNS) {
    if (name.includes(pattern)) {
      return true;
    }
  }

  // Check prefixes
  for (const prefix of OBD2_DEVICE_PATTERNS.PREFIXES) {
    if (name.startsWith(prefix)) {
      return true;
    }
  }

  // Additional heuristics for common OBD2 naming patterns
  const obd2Patterns = [
    /\bOBD[-_]?II?\b/i,           // OBD, OBD-II, OBD2
    /\bELM\d{1,4}\b/i,           // ELM327, ELM327v1.5, etc.
    /\bV[-_]?LINK\b/i,           // V-LINK, VLINK
    /\bSCAN[-_]?MASTER\b/i,       // SCANMASTER
    /\bCAR[-_]?SCANNER\b/i,       // CAR-SCANNER
    /\bDIAG[-_]?NOSTIC?\b/i,      // DIAGNOSTIC
    /\bADAPT[-_]?ER?\b/i,         // ADAPTER
    /\bINTERFACE\b/i,             // INTERFACE
    /\bVCI\b/i,                   // VCI
  ];

  for (const pattern of obd2Patterns) {
    if (pattern.test(name)) {
      return true;
    }
  }

  return false;
}

/**
 * Get the display name for a BLE device
 * @param deviceName - The original device name
 * @returns "VinTraxx" if it's an OBD2 scanner, otherwise the original name
 */
export function getDeviceDisplayName(deviceName: string | null): string {
  if (isObd2Scanner(deviceName)) {
    return 'VinTraxx';
  }
  
  return deviceName || 'Unknown Device';
}

/**
 * Enhanced device detection that considers both name patterns and service UUIDs
 * This can be used in the future when we have service discovery during scanning
 * @param deviceName - The BLE device name
 * @param serviceUuids - Array of service UUIDs (if available during scan)
 * @returns true if the device appears to be an OBD2 scanner
 */
export function isObd2ScannerEnhanced(
  deviceName: string | null, 
  serviceUuids?: string[]
): boolean {
  // First check name-based detection
  if (isObd2Scanner(deviceName)) {
    return true;
  }

  // If service UUIDs are available, check for known OBD2 service patterns
  if (serviceUuids && serviceUuids.length > 0) {
    const knownObd2Services = [
      'fff0',           // Common ELM327 service
      'ffe0',           // Alternative ELM327 service  
      '18f0',           // Some OBD adapters
      'e7810a71',       // Veepeak specific
      '0000ffe0',       // Full UUID format
      '0000fff0',       // Full UUID format
      '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART
    ];

    for (const serviceUuid of serviceUuids) {
      const normalizedUuid = serviceUuid.toLowerCase();
      for (const knownService of knownObd2Services) {
        if (normalizedUuid.includes(knownService)) {
          return true;
        }
      }
    }
  }

  return false;
}
