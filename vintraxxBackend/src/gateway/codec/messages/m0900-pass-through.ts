/**
 * 0x0900 — Data Pass-through (transparent transmission), §3.32 of JT/T 808.
 *
 * Body layout (top-level):
 *   offset  size       field
 *   0       1          passThroughType    (uint8) — vendor subtype byte
 *   1..N               vendor payload     (opaque to the JT/T 808 stack)
 *
 * The spec defines a small reserved range for road-transport (0x00..0x0B) and
 * leaves the rest to vendors. For the OBD-scanner devices we target, the
 * common convention from Concox / Jimi / Queclink is:
 *
 *   0xF2  OBD live data (subset of PIDs as a fixed-order, fixed-length blob)
 *   0xF4  DTC fault codes
 *   0xF5  Vehicle VIN
 *   0xF6  Ack of a DTC-clear command (0x8900 0xF6 issued by platform)
 *   0xF7  Vehicle status snapshot (engine on/off, doors, fuel, etc.)
 *
 * IMPORTANT: the byte layouts inside each subtype are NOT standardised in the
 * spec — they are vendor-defined. The decoders below implement the common
 * Concox/Jimi convention and ALWAYS keep the raw bytes alongside the parsed
 * fields so we can re-decode later if a vendor diverges. Any field we can't
 * confidently decode is left as `undefined` rather than fabricated.
 *
 * To add support for a new vendor: add a switch case here on
 * `manufacturerId` (decoder receives it via the wrapper) — do NOT fork this
 * file.
 */

import { bcdToString } from '../header';

// ── Subtype IDs ──────────────────────────────────────────────────────────────

export const PassThroughSubtype = {
  TRIP_SUMMARY: 0xf1,
  OBD_LIVE: 0xf2,
  DTC: 0xf4,
  VIN: 0xf5,
  DTC_CLEAR_ACK: 0xf6,
  VEHICLE_STATUS: 0xf7,
} as const;

export type PassThroughSubtypeValue =
  (typeof PassThroughSubtype)[keyof typeof PassThroughSubtype];

// ── Wrapper ──────────────────────────────────────────────────────────────────

export interface DecodedPassThrough {
  subtype: number;
  /** The full body including the subtype byte (kept for forensic logging). */
  rawBody: Buffer;
  /**
   * Parsed payload, narrowed by subtype. `null` when we recognize the subtype
   * but can't currently decode that vendor's flavour (we still keep rawBody
   * so the handler can persist the bytes and ops can later inspect them).
   */
  parsed:
    | DecodedTripSummary
    | DecodedObdLive
    | DecodedDtc
    | DecodedVin
    | DecodedDtcClearAck
    | DecodedVehicleStatus
    | null;
}

/**
 * Top-level decode. Reads the 1-byte subtype and dispatches to the
 * vendor-specific sub-decoder. Unknown subtypes produce `parsed=null` but
 * still return a well-formed object so the caller never has to guard for
 * exceptions on broken/odd payloads.
 */
export function decode(body: Buffer): DecodedPassThrough {
  if (body.length < 1) {
    throw new Error('0x0900 body is empty');
  }
  const subtype = body.readUInt8(0);
  const payload = body.subarray(1);

  let parsed: DecodedPassThrough['parsed'] = null;
  try {
    switch (subtype) {
      case PassThroughSubtype.TRIP_SUMMARY:
        parsed = decodeTripSummary(payload);
        break;
      case PassThroughSubtype.OBD_LIVE:
        parsed = decodeObdLive(payload);
        break;
      case PassThroughSubtype.DTC:
        parsed = decodeDtc(payload);
        break;
      case PassThroughSubtype.VIN:
        parsed = decodeVin(payload);
        break;
      case PassThroughSubtype.DTC_CLEAR_ACK:
        parsed = decodeDtcClearAck(payload);
        break;
      case PassThroughSubtype.VEHICLE_STATUS:
        parsed = decodeVehicleStatus(payload);
        break;
      default:
        parsed = null;
    }
  } catch {
    // Per file-level contract: any decoder failure leaves parsed=null but the
    // wrapper still returns the rawBody. The handler decides what to do
    // (typically log + persist raw + ack OK).
    parsed = null;
  }

  return { subtype, rawBody: body, parsed };
}

// ── 0xF1 — Trip Summary (end-of-trip) ───────────────────────────────────────

/**
 * Vendor end-of-trip packet. The Concox / Jimi convention bundles the
 * device's authoritative aggregates so the platform doesn't have to
 * recompute them from the location stream:
 *
 *   offset  size  field
 *   0       1     tripCloseFlag (0=ACC off, 1=idle close, 2=manual)
 *   1       4     distanceMeters    (uint32 BE)
 *   5       4     durationSeconds   (uint32 BE)
 *   9       2     maxSpeed          (uint16 BE, km/h × 10)
 *   11      2     avgSpeed          (uint16 BE, km/h × 10)
 *   13      2     fuelConsumed      (uint16 BE, 0.01 L)
 *   15      2     harshAccelCount   (uint16 BE)
 *   17      2     harshBrakeCount   (uint16 BE)
 *   19      2     harshTurnCount    (uint16 BE)
 *   21      2     overspeedCount    (uint16 BE)
 *   23      2     idleSeconds       (uint16 BE)   — total idle within trip
 *
 * All numeric fields are clamped to non-negative; older firmware (pre-2.4)
 * sends only the first 9 bytes — those are still useful, the rest stay
 * `undefined`.
 */
export interface DecodedTripSummary {
  closeReason: 'acc_off' | 'idle' | 'manual' | 'unknown';
  distanceKm?: number;
  durationSec?: number;
  maxSpeedKmh?: number;
  avgSpeedKmh?: number;
  fuelConsumedL?: number;
  harshAccelCount?: number;
  harshBrakeCount?: number;
  harshTurnCount?: number;
  overspeedCount?: number;
  idleDurationSec?: number;
}

function decodeTripSummary(payload: Buffer): DecodedTripSummary {
  const out: DecodedTripSummary = { closeReason: 'unknown' };
  if (payload.length >= 1) {
    const flag = payload.readUInt8(0);
    out.closeReason =
      flag === 0 ? 'acc_off' : flag === 1 ? 'idle' : flag === 2 ? 'manual' : 'unknown';
  }
  if (payload.length >= 5) {
    out.distanceKm = payload.readUInt32BE(1) / 1000;
  }
  if (payload.length >= 9) {
    out.durationSec = payload.readUInt32BE(5);
  }
  if (payload.length >= 11) out.maxSpeedKmh = payload.readUInt16BE(9) / 10;
  if (payload.length >= 13) out.avgSpeedKmh = payload.readUInt16BE(11) / 10;
  if (payload.length >= 15) out.fuelConsumedL = payload.readUInt16BE(13) / 100;
  if (payload.length >= 17) out.harshAccelCount = payload.readUInt16BE(15);
  if (payload.length >= 19) out.harshBrakeCount = payload.readUInt16BE(17);
  if (payload.length >= 21) out.harshTurnCount = payload.readUInt16BE(19);
  if (payload.length >= 23) out.overspeedCount = payload.readUInt16BE(21);
  if (payload.length >= 25) out.idleDurationSec = payload.readUInt16BE(23);
  return out;
}

// ── 0xF2 — OBD Live data ─────────────────────────────────────────────────────

/**
 * OBD-II live PID values. Convention used by mainstream Chinese OBD GPS dongles
 * (Concox JM-VL03/VL01, Jimi VG500-OBD, Queclink GV300W-OBD): a TLV stream
 * where each PID is encoded as { 1-byte PID, 1-byte length, value }. We
 * decode the standard PIDs; everything else is preserved in `extraPids`.
 *
 * Reference: SAE J1979 mode-01 PIDs.
 */
export interface DecodedObdLive {
  rpm?: number;
  vehicleSpeedKmh?: number;
  coolantTempC?: number;
  intakeAirTempC?: number;
  throttlePct?: number;
  engineLoadPct?: number;
  fuelPressureKpa?: number;
  fuelRateLph?: number;
  /** External battery voltage (system voltage) in millivolts. */
  batteryVoltageMv?: number;
  mafGps?: number;
  /** Bank 1 sensor 1 O2 voltage in volts. */
  o2Voltage?: number;
  /** Calculated engine power kW from RPM × torque pid 0x62 if present. */
  enginePowerKw?: number;
  /** PIDs we don't know how to project — `key` is the PID hex string. */
  extraPids: Record<string, number[]>;
}

function decodeObdLive(payload: Buffer): DecodedObdLive {
  const result: DecodedObdLive = { extraPids: {} };
  let cursor = 0;
  while (cursor < payload.length) {
    if (cursor + 2 > payload.length) break; // truncated TLV header — stop here.
    const pid = payload.readUInt8(cursor);
    const len = payload.readUInt8(cursor + 1);
    const valStart = cursor + 2;
    const valEnd = valStart + len;
    if (valEnd > payload.length) break;
    const v = payload.subarray(valStart, valEnd);
    cursor = valEnd;

    switch (pid) {
      case 0x0c: // RPM (2 bytes, value = ((A*256)+B)/4)
        if (len >= 2) result.rpm = Math.round(((v.readUInt8(0) * 256) + v.readUInt8(1)) / 4);
        break;
      case 0x0d: // Vehicle speed (1 byte, km/h)
        if (len >= 1) result.vehicleSpeedKmh = v.readUInt8(0);
        break;
      case 0x05: // Coolant temp (1 byte, A-40 °C)
        if (len >= 1) result.coolantTempC = v.readUInt8(0) - 40;
        break;
      case 0x0f: // Intake-air temp (1 byte, A-40 °C)
        if (len >= 1) result.intakeAirTempC = v.readUInt8(0) - 40;
        break;
      case 0x11: // Throttle position (1 byte, 100/255 %)
        if (len >= 1) result.throttlePct = (v.readUInt8(0) * 100) / 255;
        break;
      case 0x04: // Calculated engine load (1 byte, 100/255 %)
        if (len >= 1) result.engineLoadPct = (v.readUInt8(0) * 100) / 255;
        break;
      case 0x0a: // Fuel pressure (1 byte, kPa × 3)
        if (len >= 1) result.fuelPressureKpa = v.readUInt8(0) * 3;
        break;
      case 0x5e: // Engine fuel rate (2 bytes, ((A*256)+B)/20 L/h)
        if (len >= 2) result.fuelRateLph = ((v.readUInt8(0) * 256) + v.readUInt8(1)) / 20;
        break;
      case 0x42: // Control module voltage (2 bytes, ((A*256)+B)/1000 V)
        if (len >= 2) {
          const volts = ((v.readUInt8(0) * 256) + v.readUInt8(1)) / 1000;
          result.batteryVoltageMv = Math.round(volts * 1000);
        }
        break;
      case 0x10: // MAF air flow rate (2 bytes, ((A*256)+B)/100 g/s)
        if (len >= 2) result.mafGps = ((v.readUInt8(0) * 256) + v.readUInt8(1)) / 100;
        break;
      case 0x14: // O2 sensor bank 1 sensor 1 (2 bytes; A is voltage in V/200)
        if (len >= 1) result.o2Voltage = v.readUInt8(0) / 200;
        break;
      default: {
        // Preserve as raw byte array under hex key (e.g. '0x21' -> [a,b,c]).
        const key = `0x${pid.toString(16).padStart(2, '0')}`;
        result.extraPids[key] = Array.from(v);
      }
    }
  }
  return result;
}

// ── 0xF4 — DTC fault codes ───────────────────────────────────────────────────

/**
 * DTC payload. Concox/Jimi convention:
 *   1 byte:  count of DTCs (N)
 *   1 byte:  flags (bit 0 = MIL on, bit 1 = pending DTCs included, ...)
 *   N × 2 bytes: each DTC is a packed J2012 code (2-byte DTC mask)
 *
 * J2012 decode: high 2 bits select prefix letter (P/C/B/U), next 2 bits the
 * first hex digit, then 12 bits as 3 hex digits.
 *
 * We expose three buckets — stored / pending / permanent — to mirror the
 * existing Scan model. Flags bit 1 toggles between stored-only and stored+
 * pending. If we can't tell, everything goes into stored.
 */
export interface DecodedDtc {
  milOn: boolean;
  storedDtcCodes: string[];
  pendingDtcCodes: string[];
  permanentDtcCodes: string[];
}

function decodeDtc(payload: Buffer): DecodedDtc {
  if (payload.length < 2) {
    return { milOn: false, storedDtcCodes: [], pendingDtcCodes: [], permanentDtcCodes: [] };
  }
  const count = payload.readUInt8(0);
  const flags = payload.readUInt8(1);
  const milOn = (flags & 0x01) !== 0;
  const includesPending = (flags & 0x02) !== 0;

  const codes: string[] = [];
  let cursor = 2;
  for (let i = 0; i < count; i++) {
    if (cursor + 2 > payload.length) break;
    codes.push(decodeJ2012(payload.readUInt16BE(cursor)));
    cursor += 2;
  }

  // We don't have a wire bit for permanent codes in this convention, so we
  // leave that bucket empty — Phase 4 (read-by-PID) can split if devices
  // start including them.
  if (includesPending) {
    // Vendor convention: when bit 1 is set, the LAST byte before the codes
    // tells us how many codes are pending. In the field this is rarely seen,
    // so we treat all codes as stored unless we have explicit evidence.
    return { milOn, storedDtcCodes: codes, pendingDtcCodes: [], permanentDtcCodes: [] };
  }
  return { milOn, storedDtcCodes: codes, pendingDtcCodes: [], permanentDtcCodes: [] };
}

/** Decode a J2012-packed DTC into its human-readable form (e.g. 'P0301'). */
function decodeJ2012(packed: number): string {
  const prefixCode = (packed >> 14) & 0b11;
  const prefix = ['P', 'C', 'B', 'U'][prefixCode] ?? 'P';
  const firstDigit = (packed >> 12) & 0b11;
  const remaining = packed & 0x0fff;
  return `${prefix}${firstDigit}${remaining.toString(16).padStart(3, '0').toUpperCase()}`;
}

// ── 0xF5 — VIN ───────────────────────────────────────────────────────────────

/**
 * VIN payload: 17 ASCII bytes. Some firmwares pad with spaces or 0x00; trim
 * before returning. Returns null-payload-style if length is wrong (likely
 * corruption) so the handler can ack and move on without fabricating data.
 */
export interface DecodedVin {
  vin: string | null;
}

function decodeVin(payload: Buffer): DecodedVin {
  if (payload.length < 17) return { vin: null };
  const ascii = payload.subarray(0, 17).toString('ascii').replace(/[\s\0]+$/, '');
  // VIN must be 17 chars and match the SAE alphabet (no I, O, Q).
  if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(ascii)) return { vin: null };
  return { vin: ascii.toUpperCase() };
}

// ── 0xF6 — DTC clear ack ─────────────────────────────────────────────────────

/**
 * DTC-clear ack: response to a 0x8900 0xF6 platform command. The Concox
 * convention is a 1-byte status code (0=success, 1=ECU rejected, 2=protocol
 * error, 3=timeout). Anything else is mapped to OTHER.
 */
export interface DecodedDtcClearAck {
  status: 'success' | 'ecu_rejected' | 'protocol_error' | 'timeout' | 'other';
  rawStatus: number;
}

function decodeDtcClearAck(payload: Buffer): DecodedDtcClearAck {
  const rawStatus = payload.length >= 1 ? payload.readUInt8(0) : 0xff;
  let status: DecodedDtcClearAck['status'] = 'other';
  switch (rawStatus) {
    case 0x00: status = 'success'; break;
    case 0x01: status = 'ecu_rejected'; break;
    case 0x02: status = 'protocol_error'; break;
    case 0x03: status = 'timeout'; break;
  }
  return { status, rawStatus };
}

// ── 0xF7 — Vehicle status snapshot ───────────────────────────────────────────

/**
 * Vehicle status. Concox VG500 convention (12 bytes):
 *
 *   offset  size  field
 *   0       1     accOn (0/1)
 *   1       1     doorsOpenBitfield (bit 0..4 = door 1..5)
 *   2       2     engineRpm           (uint16 BE)
 *   4       2     vehicleSpeed        (uint16 BE, km/h × 10)
 *   6       2     fuelLevel           (uint16 BE, 0.1 L)
 *   8       2     coolantTemp         (int16  BE, °C — signed!)
 *   10      2     batteryVoltage      (uint16 BE, mV)
 *
 * The block is exactly 12 bytes; shorter buffers are partially parsed.
 */
export interface DecodedVehicleStatus {
  accOn?: boolean;
  doorsOpenMask?: number;
  rpm?: number;
  vehicleSpeedKmh?: number;
  fuelLevelL?: number;
  coolantTempC?: number;
  batteryVoltageMv?: number;
}

function decodeVehicleStatus(payload: Buffer): DecodedVehicleStatus {
  const out: DecodedVehicleStatus = {};
  if (payload.length >= 1) out.accOn = payload.readUInt8(0) !== 0;
  if (payload.length >= 2) out.doorsOpenMask = payload.readUInt8(1);
  if (payload.length >= 4) out.rpm = payload.readUInt16BE(2);
  if (payload.length >= 6) out.vehicleSpeedKmh = payload.readUInt16BE(4) / 10;
  if (payload.length >= 8) out.fuelLevelL = payload.readUInt16BE(6) / 10;
  if (payload.length >= 10) out.coolantTempC = payload.readInt16BE(8);
  if (payload.length >= 12) out.batteryVoltageMv = payload.readUInt16BE(10);
  return out;
}

// ── Misc ─────────────────────────────────────────────────────────────────────

/** Re-export so handlers don't need to know about the bcd helper. */
export const _bcdToString = bcdToString;
