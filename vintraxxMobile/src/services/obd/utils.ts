// OBD-II Utility functions for conversions and mappings

/**
 * Convert kilometers to miles
 */
export function kmToMiles(km: number): number {
  return km * 0.621371;
}

/**
 * Convert miles to kilometers
 */
export function milesToKm(miles: number): number {
  return miles / 0.621371;
}

/**
 * Map fuel system status code to human-readable string
 * Based on OBD-II PID 03 specification
 */
export function getFuelSystemStatusLabel(statusCode: number): string {
  const statusMap: Record<number, string> = {
    0x00: 'Motor Off',
    0x01: 'Open Loop',
    0x02: 'Closed Loop',
    0x04: 'Closed Oxygen Sensor',
    0x08: 'Open Loop',
    0x10: 'Closed Loop Fault',
  };

  return statusMap[statusCode] || `Unknown (0x${statusCode.toString(16).toUpperCase()})`;
}

/**
 * Map secondary air status code to human-readable string
 * Based on OBD-II PID 12 specification
 */
export function getSecondaryAirStatusLabel(statusCode: number): string {
  const statusMap: Record<number, string> = {
    0x01: 'Upstream',
    0x02: 'Downstream',
    0x04: 'Outside or Off',
    0x08: 'Pump On',
  };

  return statusMap[statusCode] || `Unknown (0x${statusCode.toString(16).toUpperCase()})`;
}

/**
 * Format distance value with unit conversion
 */
export function formatDistance(km: number | null, unit: 'km' | 'mi' = 'mi'): string {
  if (km === null) return 'N/A';
  
  if (unit === 'mi') {
    const miles = kmToMiles(km);
    return `${miles.toFixed(1)} mi`;
  }
  
  return `${km.toFixed(1)} km`;
}

/**
 * Format time in minutes to human-readable format
 */
export function formatTime(minutes: number | null): string {
  if (minutes === null) return 'N/A';
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (remainingHours > 0) {
    return `${days}d ${remainingHours}h`;
  }
  
  return `${days} days`;
}
