/**
 * 0x0200 — Location Information Report (§3.18 + Appendix C of JT/T 808-2019).
 *
 * Body layout — fixed 28-byte basic info, then optional TLV list:
 *
 *   offset  size  field
 *   0       4     alarmFlag    (uint32 BE) — alarm bit-field, see ALARM_BITS
 *   4       4     statusFlag   (uint32 BE) — status bit-field, see STATUS_BITS
 *   8       4     latitude     (uint32 BE, value = degrees × 10^6)
 *  12       4     longitude    (uint32 BE, value = degrees × 10^6)
 *  16       2     altitude     (int16  BE, metres above sea level — signed!)
 *  18       2     speed        (uint16 BE, value = km/h × 10)
 *  20       2     direction    (uint16 BE, 0..359 degrees clockwise from north)
 *  22       6     bcdTime      (BCD: YY MM DD hh mm ss in CHINA STANDARD TIME, UTC+8)
 *  28..N           TLV additional-info items (1-byte id, 1-byte length, value)
 *
 * Sign of latitude/longitude is encoded in statusFlag bits 2 (south) and 3
 * (west). The numeric fields are always positive magnitudes — we negate them
 * here based on those bits so callers can store signed decimal degrees
 * directly.
 *
 * Time interpretation: the spec mandates GMT+8 (China Standard Time). We
 * convert to a JS `Date` (UTC) in the decoder so all downstream code can
 * treat reportedAt uniformly.
 */

import { bcdToString } from '../header';

/**
 * Symbolic names for the alarm bit-field. Only listed bits are interpreted.
 * Phase 2 turns transitions on these bits into GpsAlarm rows.
 */
export const ALARM_BITS = {
  SOS: 1 << 0,
  OVERSPEED: 1 << 1,
  FATIGUE: 1 << 2,
  DANGEROUS_WARNING: 1 << 3,
  GNSS_MODULE_FAULT: 1 << 4,
  GNSS_ANTENNA_DISCONNECT: 1 << 5,
  GNSS_ANTENNA_SHORT: 1 << 6,
  POWER_LOW_VOLT: 1 << 7,
  POWER_CUT: 1 << 8,
  DISPLAY_FAULT: 1 << 9,
  TTS_FAULT: 1 << 10,
  CAMERA_FAULT: 1 << 11,
  IC_CARD_FAULT: 1 << 12,
  OVERSPEED_WARN: 1 << 13,
  FATIGUE_WARN: 1 << 14,
  ROUTE_VIOLATION: 1 << 15,
  CUMULATIVE_DRIVING_OVERTIME: 1 << 18,
  STOP_OVERTIME: 1 << 19,
  ZONE_VIOLATION: 1 << 20,
  ROUTE_DEVIATION: 1 << 21,
  VSS_FAULT: 1 << 22,
  FUEL_ABNORMAL: 1 << 23,
  VEHICLE_THEFT: 1 << 24,
  ILLEGAL_IGNITION: 1 << 25,
  ILLEGAL_DISPLACEMENT: 1 << 26,
  COLLISION_WARNING: 1 << 27,
  ROLLOVER_WARNING: 1 << 28,
  ILLEGAL_DOOR_OPEN: 1 << 29,
} as const;

/**
 * Status bit-field. Bits 2 and 3 are sign bits for lat/lng — handled directly
 * in the decoder, not exposed.
 */
export const STATUS_BITS = {
  ACC_ON: 1 << 0,
  GPS_FIX: 1 << 1,
  // bit 2: 1 = southern hemisphere (latitude is negative)
  // bit 3: 1 = western hemisphere (longitude is negative)
  OUT_OF_SERVICE: 1 << 4,
  ENCRYPTED: 1 << 5,
  // bits 6..7 reserved
  // bits 8..9 cargo status
  OIL_DISCONNECT: 1 << 10,
  POWER_DISCONNECT: 1 << 11,
  DOOR_LOCKED: 1 << 12,
  DOOR_1_OPEN: 1 << 13,
  DOOR_2_OPEN: 1 << 14,
  DOOR_3_OPEN: 1 << 15,
  DOOR_4_OPEN: 1 << 16,
  DOOR_5_OPEN: 1 << 17,
  GPS_POSITIONING_VALID: 1 << 18,
  BEIDOU_POSITIONING_VALID: 1 << 19,
  GLONASS_POSITIONING_VALID: 1 << 20,
  GALILEO_POSITIONING_VALID: 1 << 21,
} as const;

/** Result of decoding one 0x0200 (or one entry inside an 0x0704 batch). */
export interface DecodedLocation {
  /** Raw 32-bit alarm flags. */
  alarmBits: number;
  /** Raw 32-bit status flags. */
  statusBits: number;
  /** Signed decimal degrees, sign already applied from status bit 2. */
  latitude: number;
  /** Signed decimal degrees, sign already applied from status bit 3. */
  longitude: number;
  /** Metres above sea level, signed. */
  altitudeM: number;
  /** Decimal km/h with 1 fractional digit. */
  speedKmh: number;
  /** Heading 0..359 degrees, clockwise from north. */
  heading: number;
  /** Reported time in UTC (the BCD time on the wire is GMT+8). */
  reportedAt: Date;
  /** Convenience flags pulled from statusBits. */
  accOn: boolean;
  gpsFix: boolean;
  /** Decoded TLV additional info (only known IDs, see DecodedAdditional). */
  additional: DecodedAdditional;
  /** Raw TLV map for IDs we don't natively decode (vendor extensions). */
  rawAdditional: Map<number, Buffer>;
}

/** Selected additional-info TLVs decoded into typed fields. */
export interface DecodedAdditional {
  /** 0x01 — total mileage in km (1/10 km units on the wire). */
  mileageKm?: number;
  /** 0x02 — fuel level in litres (1/10 L on the wire). */
  fuelLevelL?: number;
  /** 0x03 — vehicle-bus speed (km/h × 10 on the wire). */
  vehicleBusSpeedKmh?: number;
  /** 0x04 — count of currently-active alarm events. */
  activeAlarmCount?: number;
  /** 0x25 — extended vehicle status word (uint32). */
  extendedVehicleStatus?: number;
  /** 0x2A — I/O state (uint16). */
  ioState?: number;
  /** 0x2B — analog (uint32). */
  analog?: number;
  /** 0x30 — wireless network signal strength (0..31, 99 = unknown). */
  signalStrength?: number;
  /** 0x31 — GNSS satellite count. */
  satelliteCount?: number;
}

/**
 * Decode the 28-byte basic body + optional TLV tail.
 *
 * Permissive: unknown TLV IDs are stashed into `rawAdditional` rather than
 * causing the whole frame to fail. Length-overrun TLVs throw.
 */
export function decode(body: Buffer): DecodedLocation {
  if (body.length < 28) {
    throw new Error(`0x0200 body too short: ${body.length} bytes (need 28)`);
  }

  const alarmBits = body.readUInt32BE(0);
  const statusBits = body.readUInt32BE(4);
  const rawLat = body.readUInt32BE(8);
  const rawLng = body.readUInt32BE(12);
  const altitudeM = body.readInt16BE(16);
  const speedRaw = body.readUInt16BE(18);
  const heading = body.readUInt16BE(20);

  const isSouth = (statusBits & (1 << 2)) !== 0;
  const isWest = (statusBits & (1 << 3)) !== 0;

  const latitude = (isSouth ? -1 : 1) * (rawLat / 1_000_000);
  const longitude = (isWest ? -1 : 1) * (rawLng / 1_000_000);
  const speedKmh = speedRaw / 10;

  const reportedAt = bcdTimeToDate(body.subarray(22, 28));

  // ── TLV tail ───────────────────────────────────────────────────────────────
  const additional: DecodedAdditional = {};
  const rawAdditional = new Map<number, Buffer>();

  let cursor = 28;
  while (cursor < body.length) {
    if (cursor + 2 > body.length) {
      // Truncated TLV header — devices occasionally pad with stray bytes.
      // Stop parsing rather than throw; we already have the basic fix.
      break;
    }
    const id = body.readUInt8(cursor);
    const len = body.readUInt8(cursor + 1);
    const valStart = cursor + 2;
    const valEnd = valStart + len;
    if (valEnd > body.length) {
      throw new Error(
        `0x0200 TLV id=0x${id.toString(16)} declares len=${len} but only ${body.length - valStart} bytes remain`,
      );
    }
    const value = body.subarray(valStart, valEnd);

    switch (id) {
      case 0x01:
        if (len === 4) additional.mileageKm = value.readUInt32BE(0) / 10;
        break;
      case 0x02:
        if (len === 2) additional.fuelLevelL = value.readUInt16BE(0) / 10;
        break;
      case 0x03:
        if (len === 2) additional.vehicleBusSpeedKmh = value.readUInt16BE(0) / 10;
        break;
      case 0x04:
        if (len === 2) additional.activeAlarmCount = value.readUInt16BE(0);
        break;
      case 0x25:
        if (len === 4) additional.extendedVehicleStatus = value.readUInt32BE(0);
        break;
      case 0x2a:
        if (len === 2) additional.ioState = value.readUInt16BE(0);
        break;
      case 0x2b:
        if (len === 4) additional.analog = value.readUInt32BE(0);
        break;
      case 0x30:
        if (len === 1) additional.signalStrength = value.readUInt8(0);
        break;
      case 0x31:
        if (len === 1) additional.satelliteCount = value.readUInt8(0);
        break;
      default:
        // Vendor / unsupported — keep raw bytes for forensic logging.
        rawAdditional.set(id, Buffer.from(value));
    }

    cursor = valEnd;
  }

  return {
    alarmBits,
    statusBits,
    latitude,
    longitude,
    altitudeM,
    speedKmh,
    heading,
    reportedAt,
    accOn: (statusBits & STATUS_BITS.ACC_ON) !== 0,
    gpsFix: (statusBits & STATUS_BITS.GPS_FIX) !== 0,
    additional,
    rawAdditional,
  };
}

/**
 * Convert a 6-byte BCD timestamp (YYMMDDhhmmss, GMT+8) to a JS Date in UTC.
 * Years are assumed 2000-based (ie. `25` → 2025) — JT/T 808 was published in
 * 2011 and contains no devices reporting pre-2000 timestamps in the wild.
 */
function bcdTimeToDate(bcd: Buffer): Date {
  if (bcd.length !== 6) {
    throw new Error(`bcdTimeToDate: expected 6 bytes, got ${bcd.length}`);
  }
  const digits = bcdToString(bcd);
  const yy = parseInt(digits.slice(0, 2), 10);
  const mo = parseInt(digits.slice(2, 4), 10);
  const dd = parseInt(digits.slice(4, 6), 10);
  const hh = parseInt(digits.slice(6, 8), 10);
  const mm = parseInt(digits.slice(8, 10), 10);
  const ss = parseInt(digits.slice(10, 12), 10);

  // Build the date in UTC, then subtract 8 hours because the wire value is
  // China Standard Time. `Date.UTC` returns ms since epoch.
  const utcMs = Date.UTC(2000 + yy, mo - 1, dd, hh, mm, ss);
  return new Date(utcMs - 8 * 60 * 60 * 1000);
}
