/**
 * 0x0205 — Proactive Version Information Report (non-ministerial standard).
 *
 * The device sends this proactively after authentication. It contains key
 * data such as firmware version, IMEI, VIN, total mileage, and total fuel
 * consumption. This is the ONLY reliable source of VIN from the D450.
 *
 * Body layout (per spec §58, Appendix Version Information Package):
 *   offset  size   field
 *   0       14     Terminal software version  (STRING[14])
 *   14      10     Terminal software version date (STRING[10])
 *   24      12     CPU ID (BYTE[12])
 *   36      15     GSM TYPE Name (STRING[15])
 *   51      15     GSM IMEI (STRING[15])
 *   66      15     SIM card IMSI number (STRING[15])
 *   81      20     SIM card ICCID (STRING[20])
 *   101     2      Car Type (WORD)
 *   103     17     VIN (STRING[17])
 *   120     4      Total mileage (DWORD, meters)
 *   124     4      Cumulative fuel consumption (DWORD, milliliters)
 *   ────────────── total: 128 bytes ──────────────
 *
 * Response: platform sends 0x8205 (NOT the generic 0x8001).
 *
 * 0x8205 response body (per spec §59):
 *   offset  size   field
 *   0       6      Current platform time (BCD[6], Beijing Time)
 *   6       2      Vehicle type ID (WORD, 0 if not required)
 *   8       2      Displacement (WORD, milliliters, 0 if not specified)
 *   10      1      Upgrade flag (BYTE, 0x55 = upgrade, otherwise no upgrade)
 */

export interface DecodedVersionInfo {
  softwareVersion: string;
  softwareDate: string;
  cpuId: string;
  gsmModel: string;
  imei: string;
  imsi: string;
  iccid: string;
  carTypeId: number;
  vin: string | null;
  totalMileageKm: number;
  totalFuelL: number;
}

/**
 * Decode 0x0205 body. Tolerant of short payloads — fields that fall past the
 * end of the buffer are left at defaults.
 */
export function decode(body: Buffer): DecodedVersionInfo {
  const readStr = (offset: number, len: number): string => {
    if (offset + len > body.length) return '';
    return body.subarray(offset, offset + len)
      .toString('ascii')
      .replace(/[\0\s]+$/, '');
  };

  const softwareVersion = readStr(0, 14);
  const softwareDate = readStr(14, 10);
  const cpuId = body.length >= 36
    ? body.subarray(24, 36).toString('hex')
    : '';
  const gsmModel = readStr(36, 15);
  const imei = readStr(51, 15);
  const imsi = readStr(66, 15);
  const iccid = readStr(81, 20);
  const carTypeId = body.length >= 103 ? body.readUInt16BE(101) : 0;

  // VIN: 17 ASCII characters. Validate it's a proper VIN.
  const rawVin = readStr(103, 17);
  const vin = /^[A-HJ-NPR-Z0-9]{17}$/i.test(rawVin)
    ? rawVin.toUpperCase()
    : null;

  // Total mileage in meters → km
  const totalMileageKm = body.length >= 124
    ? body.readUInt32BE(120) / 1000
    : 0;

  // Cumulative fuel in milliliters → liters
  const totalFuelL = body.length >= 128
    ? body.readUInt32BE(124) / 1000
    : 0;

  return {
    softwareVersion,
    softwareDate,
    cpuId,
    gsmModel,
    imei,
    imsi,
    iccid,
    carTypeId,
    vin,
    totalMileageKm,
    totalFuelL,
  };
}

/**
 * Encode the 0x8205 Version Information Response.
 * The platform replies with current time + optional vehicle info.
 */
export function encodeResponse(opts?: {
  vehicleTypeId?: number;
  displacementMl?: number;
  upgrade?: boolean;
}): Buffer {
  const buf = Buffer.alloc(11);

  // BCD time: YY MM DD hh mm ss in Beijing Time (UTC+8)
  const now = new Date();
  const bj = new Date(now.getTime() + 8 * 3600_000);
  buf[0] = toBcd(bj.getUTCFullYear() % 100);
  buf[1] = toBcd(bj.getUTCMonth() + 1);
  buf[2] = toBcd(bj.getUTCDate());
  buf[3] = toBcd(bj.getUTCHours());
  buf[4] = toBcd(bj.getUTCMinutes());
  buf[5] = toBcd(bj.getUTCSeconds());

  buf.writeUInt16BE(opts?.vehicleTypeId ?? 0, 6);
  buf.writeUInt16BE(opts?.displacementMl ?? 0, 8);
  buf[10] = opts?.upgrade ? 0x55 : 0x00;

  return buf;
}

function toBcd(n: number): number {
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return (tens << 4) | ones;
}
