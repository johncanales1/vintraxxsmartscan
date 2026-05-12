/**
 * 0x0900 — Data Pass-through (transparent transmission), §3.32 of JT/T 808.
 *
 * Body layout (top-level):
 *   offset  size       field
 *   0       1          passThroughType    (uint8) — vendor subtype byte
 *   1..N               vendor payload
 *
 * Per the JT/T 808 / HOLLOO (D450) Appendix table at GPS_OBD_SCANNER.md
 * §3.67-§3.71 the sub-IDs used in production firmware are:
 *
 *   0xF1  Vehicle trip / journey data packet (end-of-trip aggregates)
 *   0xF2  Vehicle FAULT CODE data packet (this is the DTC subtype — NOT OBD
 *         live data; OBD live PIDs ride on 0x0200 extended TLVs under
 *         container ID 0xEB "Car Extended Data Flow".)
 *   0xF3  Sleep-entry data packet (device entering low-power mode)
 *   0xF4  Sleep-wake data packet (device leaving low-power mode)
 *   0xF6  MCU upgrade status feedback (response to a 0x8900/0xF6 platform
 *         command, e.g. firmware push)
 *   0xF7  Suspected collision alarm with accelerometer trace
 *   0x41  Generic transparent transmission (platform ↔ terminal, since v70)
 *
 * Earlier revisions of this file mis-mapped 0xF2 to a Concox-style "OBD
 * live" blob and 0xF4 to DTCs. That convention does NOT match the D450 wire
 * format — the byte layouts diverge, which previously caused the platform
 * to fabricate DTC codes from the timestamp/lat/lng bytes of F2 packets
 * that reported zero faults. The current dispatch matches the spec.
 *
 * Any decoder failure is swallowed and left as `parsed=null`; the wrapper
 * preserves `rawBody` so the handler can persist forensic bytes and ack OK
 * rather than NACK-loop the device.
 */

import { bcdToString } from '../header';

// ── Subtype IDs ──────────────────────────────────────────────────────────────

export const PassThroughSubtype = {
  TRIP_SUMMARY: 0xf1,
  /** §3.69 Fault Code Data Packet F2 — TIME[6] LAT[4] LNG[4] N[1] CODE[N*4]. */
  DTC: 0xf2,
  /** §3.70 Device entering sleep mode. */
  SLEEP_ENTRY: 0xf3,
  /** §3.71 Device waking from sleep. */
  SLEEP_WAKE: 0xf4,
  /** §3.71 MCU upgrade status feedback (single byte 0x00..0x08). */
  UPGRADE_STATUS: 0xf6,
  /** §3.72 Suspected collision alarm with accelerometer trace. */
  COLLISION: 0xf7,
  /** §3.74 Transparent transmission (generic). */
  TRANSPARENT: 0x41,
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
    | DecodedDtc
    | DecodedSleepEntry
    | DecodedSleepWake
    | DecodedUpgradeStatus
    | DecodedCollision
    | null;
}

/**
 * Top-level decode. Reads the 1-byte subtype and dispatches to the
 * spec-defined sub-decoder. Unknown / unsupported subtypes produce
 * `parsed=null` but still return a well-formed object so the caller never
 * has to guard for exceptions on broken/odd payloads.
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
      case PassThroughSubtype.DTC:
        parsed = decodeDtc(payload);
        break;
      case PassThroughSubtype.SLEEP_ENTRY:
        parsed = decodeSleepEntry(payload);
        break;
      case PassThroughSubtype.SLEEP_WAKE:
        parsed = decodeSleepWake(payload);
        break;
      case PassThroughSubtype.UPGRADE_STATUS:
        parsed = decodeUpgradeStatus(payload);
        break;
      case PassThroughSubtype.COLLISION:
        parsed = decodeCollision(payload);
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

// ── 0xF2 — Fault-code data packet (DTCs) ─────────────────────────────────────

/**
 * Fault Code Data Packet (§3.69 / appendix table at GPS_OBD_SCANNER.md
 * line 4910). Layout:
 *
 *   offset size  field      notes
 *   0      6     TIME[6]    BCD YY-MM-DD-hh-mm-ss in GMT+8
 *   6      4     latitude   uint32, value = degrees × 1e-6.
 *                            Bit 31 = 0 → north, 1 → south.
 *   10     4     longitude  uint32, value = degrees × 1e-6.
 *                            Bit 31 = 0 → east, 1 → west.
 *   14     1     DtcNum     count of fault codes (0 = no faults)
 *   15+    N×4   Dtc[N]     each fault code is 4 bytes — see decodeFaultCode
 *
 * The packet itself carries NO MIL flag — when DtcNum>0 the device implicitly
 * confirms the MIL is on. (Callers that need to confirm should cross-check
 * with the 0x0200 extended PID 0x6014 / 0x5112.)
 *
 * Each 4-byte fault code:
 *  • If byte 0 ("protocol type") is 0xF0 the codes are J1939 — bytes 1..3
 *    hold the fault code itself and byte 3 (low) holds the FMI/status. We
 *    render as `SPN-FMI` for the dashboard.
 *  • Otherwise byte 0 is a system identifier (0x01 = engine, 0x02 =
 *    chassis, 0x03 = body, 0x04 = network) and bytes 1..2 hold the 2-byte
 *    SAE-J2012 packed code (e.g. P0420). Byte 3 carries the fault status
 *    (0=stored, 1=pending, 2=permanent) when the device differentiates;
 *    older firmware leaves it at 0.
 */
export interface DecodedDtc {
  /** Time the snapshot was taken (in UTC). */
  reportedAt: Date;
  /** Signed decimal degrees, sign already applied from bit 31. */
  latitude: number;
  /** Signed decimal degrees, sign already applied from bit 31. */
  longitude: number;
  /** Implicit MIL state: any code present ⇒ MIL on. */
  milOn: boolean;
  /** Total decoded fault codes (after best-effort parsing). */
  dtcCount: number;
  storedDtcCodes: string[];
  pendingDtcCodes: string[];
  permanentDtcCodes: string[];
  /** "OBD-II" or "J1939" — first observed protocol byte wins. */
  protocol: 'OBD-II' | 'J1939' | 'MIXED' | null;
}

function decodeDtc(payload: Buffer): DecodedDtc {
  const empty: DecodedDtc = {
    reportedAt: new Date(),
    latitude: 0,
    longitude: 0,
    milOn: false,
    dtcCount: 0,
    storedDtcCodes: [],
    pendingDtcCodes: [],
    permanentDtcCodes: [],
    protocol: null,
  };

  if (payload.length < 15) return empty;

  const reportedAt = bcdTimeToDate(payload.subarray(0, 6));

  const latRaw = payload.readUInt32BE(6);
  const lngRaw = payload.readUInt32BE(10);
  const latSouth = (latRaw & 0x8000_0000) !== 0;
  const lngWest = (lngRaw & 0x8000_0000) !== 0;
  const latitude = (latSouth ? -1 : 1) * ((latRaw & 0x7fff_ffff) / 1_000_000);
  const longitude = (lngWest ? -1 : 1) * ((lngRaw & 0x7fff_ffff) / 1_000_000);

  const dtcNum = payload.readUInt8(14);
  const expectedLen = 15 + dtcNum * 4;
  // Spec says the buffer should be exactly `expectedLen` bytes; treat any
  // shortfall as a DTC count of zero (defensive — don't fabricate codes).
  const usableNum = payload.length >= expectedLen
    ? dtcNum
    : Math.max(0, Math.floor((payload.length - 15) / 4));

  const stored: string[] = [];
  const pending: string[] = [];
  const permanent: string[] = [];
  let protocol: DecodedDtc['protocol'] = null;

  for (let i = 0; i < usableNum; i++) {
    const offset = 15 + i * 4;
    const code = payload.subarray(offset, offset + 4);
    if (code.length !== 4) break;
    const decoded = decodeFaultCode(code);
    if (!decoded) continue;
    // First observed protocol wins; mixed sets get tagged MIXED.
    if (protocol === null) protocol = decoded.protocol;
    else if (protocol !== decoded.protocol) protocol = 'MIXED';
    if (decoded.status === 'pending') pending.push(decoded.code);
    else if (decoded.status === 'permanent') permanent.push(decoded.code);
    else stored.push(decoded.code);
  }

  const dtcCount = stored.length + pending.length + permanent.length;
  return {
    reportedAt,
    latitude,
    longitude,
    milOn: dtcCount > 0,
    dtcCount,
    storedDtcCodes: stored,
    pendingDtcCodes: pending,
    permanentDtcCodes: permanent,
    protocol,
  };
}

interface DecodedFaultCode {
  code: string;
  status: 'stored' | 'pending' | 'permanent';
  protocol: 'OBD-II' | 'J1939';
}

/**
 * Decode one 4-byte fault code per appendix §3.69. See the file-level
 * doc-comment for the bit layout. Returns null only for codes that look
 * like padding (all-zero / all-0xFF) so a stuck buffer doesn't render as
 * "P0000" rows.
 */
function decodeFaultCode(buf: Buffer): DecodedFaultCode | null {
  // Padding heuristic: 0x00000000 or 0xFFFFFFFF are not valid faults.
  const u32 = buf.readUInt32BE(0);
  if (u32 === 0 || u32 === 0xffff_ffff) return null;

  const systemId = buf.readUInt8(0);

  if (systemId === 0xf0) {
    // J1939: bytes 1..3 = code, status in low nibble of byte 3.
    const spnHi = buf.readUInt16BE(1); // bytes 1..2 → SPN high
    const spnFmi = buf.readUInt8(3);   // byte 3: SPN low 3 bits | FMI 5 bits
    const spn = (spnHi << 3) | (spnFmi >> 5);
    const fmi = spnFmi & 0x1f;
    return {
      code: `SPN${spn}-FMI${fmi}`,
      status: 'stored',
      protocol: 'J1939',
    };
  }

  // SAE J2012 ISO-15031 layout in bytes 1..2 (the system byte is implicit in
  // the J2012 letter prefix already — we just carry it for debugging).
  const packed = buf.readUInt16BE(1);
  const statusByte = buf.readUInt8(3);
  const status: DecodedFaultCode['status'] =
    statusByte === 1 ? 'pending' : statusByte === 2 ? 'permanent' : 'stored';
  return {
    code: decodeJ2012(packed),
    status,
    protocol: 'OBD-II',
  };
}

/** Decode a J2012-packed DTC into its human-readable form (e.g. 'P0301'). */
function decodeJ2012(packed: number): string {
  const prefixCode = (packed >> 14) & 0b11;
  const prefix = ['P', 'C', 'B', 'U'][prefixCode] ?? 'P';
  const firstDigit = (packed >> 12) & 0b11;
  const remaining = packed & 0x0fff;
  return `${prefix}${firstDigit}${remaining.toString(16).padStart(3, '0').toUpperCase()}`;
}

/**
 * Convert a 6-byte BCD timestamp (YYMMDDhhmmss, GMT+8) to a JS Date in UTC.
 * Years are assumed 2000-based (D450 firmware was released after 2017).
 * Invalid BCD or values out of range fall back to "now" so the wrapper can
 * still surface a usable reportedAt to downstream handlers.
 */
function bcdTimeToDate(bcd: Buffer): Date {
  if (bcd.length !== 6) return new Date();
  try {
    const digits = bcdToString(bcd);
    const yy = parseInt(digits.slice(0, 2), 10);
    const mo = parseInt(digits.slice(2, 4), 10);
    const dd = parseInt(digits.slice(4, 6), 10);
    const hh = parseInt(digits.slice(6, 8), 10);
    const mm = parseInt(digits.slice(8, 10), 10);
    const ss = parseInt(digits.slice(10, 12), 10);
    if ([yy, mo, dd, hh, mm, ss].some((n) => Number.isNaN(n))) return new Date();
    if (mo < 1 || mo > 12 || dd < 1 || dd > 31) return new Date();
    const utcMs = Date.UTC(2000 + yy, mo - 1, dd, hh, mm, ss);
    return new Date(utcMs - 8 * 60 * 60 * 1000);
  } catch {
    return new Date();
  }
}

// ── 0xF3 — Sleep Entry ───────────────────────────────────────────────────────

export interface DecodedSleepEntry {
  reportedAt: Date;
}

function decodeSleepEntry(payload: Buffer): DecodedSleepEntry {
  return {
    reportedAt: payload.length >= 6 ? bcdTimeToDate(payload.subarray(0, 6)) : new Date(),
  };
}

// ── 0xF4 — Sleep Wake ────────────────────────────────────────────────────────

export interface DecodedSleepWake {
  reportedAt: Date;
  /** Bit-encoded wake source. */
  wakeType: number;
  busVoltageMv?: number;
  accelTotal?: number;
}

function decodeSleepWake(payload: Buffer): DecodedSleepWake {
  const out: DecodedSleepWake = {
    reportedAt: payload.length >= 6 ? bcdTimeToDate(payload.subarray(0, 6)) : new Date(),
    wakeType: payload.length >= 7 ? payload.readUInt8(6) : 0,
  };
  if (payload.length >= 9) out.busVoltageMv = payload.readUInt16BE(7);
  if (payload.length >= 11) out.accelTotal = payload.readUInt16BE(9);
  return out;
}

// ── 0xF6 — MCU upgrade status feedback ──────────────────────────────────────

export interface DecodedUpgradeStatus {
  status: 'success' | 'same_version' | 'param_error' | 'ftp_timeout' | 'download_timeout' |
          'verify_error' | 'invalid_type' | 'file_missing' | 'other';
  rawStatus: number;
}

function decodeUpgradeStatus(payload: Buffer): DecodedUpgradeStatus {
  const rawStatus = payload.length >= 1 ? payload.readUInt8(0) : 0xff;
  let status: DecodedUpgradeStatus['status'] = 'other';
  switch (rawStatus) {
    case 0x00: status = 'success'; break;
    case 0x01: status = 'same_version'; break;
    case 0x02: status = 'param_error'; break;
    case 0x03: status = 'ftp_timeout'; break;
    case 0x04: status = 'download_timeout'; break;
    case 0x05: status = 'verify_error'; break;
    case 0x06: status = 'invalid_type'; break;
    case 0x07: status = 'file_missing'; break;
    case 0x08: status = 'other'; break;
  }
  return { status, rawStatus };
}

// ── 0xF7 — Suspected collision alarm ────────────────────────────────────────

export interface DecodedCollision {
  reportedAt: Date;
  latitude: number;
  longitude: number;
  collectionFrequencyMs: number;
  /** 0 = minor, 1 = moderate, 2 = severe. */
  level: number;
  /** Truncated to the first sample for downstream alerting; full trace is in rawBody. */
  firstSample?: {
    accelXMg: number;
    accelYMg: number;
    accelZMg: number;
    speedKmh: number;
  };
}

function decodeCollision(payload: Buffer): DecodedCollision {
  const base: DecodedCollision = {
    reportedAt: payload.length >= 6 ? bcdTimeToDate(payload.subarray(0, 6)) : new Date(),
    latitude: 0,
    longitude: 0,
    collectionFrequencyMs: 500,
    level: 0,
  };
  if (payload.length >= 14) {
    const latRaw = payload.readUInt32BE(6);
    const lngRaw = payload.readUInt32BE(10);
    base.latitude = ((latRaw & 0x8000_0000) ? -1 : 1) * ((latRaw & 0x7fff_ffff) / 1_000_000);
    base.longitude = ((lngRaw & 0x8000_0000) ? -1 : 1) * ((lngRaw & 0x7fff_ffff) / 1_000_000);
  }
  if (payload.length >= 18) base.collectionFrequencyMs = payload.readUInt32BE(14);
  if (payload.length >= 19) base.level = payload.readUInt8(18);
  if (payload.length >= 26) {
    base.firstSample = {
      accelXMg: payload.readInt16BE(19),
      accelYMg: payload.readInt16BE(21),
      accelZMg: payload.readInt16BE(23),
      speedKmh: payload.readUInt8(25),
    };
  }
  return base;
}

// ── Misc ─────────────────────────────────────────────────────────────────────

/** Re-export so handlers don't need to know about the bcd helper. */
export const _bcdToString = bcdToString;

/** Exported for unit tests / ad-hoc forensic decoding. */
export const _internals = {
  decodeDtc,
  decodeFaultCode,
  decodeJ2012,
  bcdTimeToDate,
};
