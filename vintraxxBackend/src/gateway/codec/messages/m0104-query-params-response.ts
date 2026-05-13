/**
 * 0x0104 — Query Terminal Parameters Response (§3.11 JT/T 808-2013).
 *
 * This is the device's reply to a 0x8104 "query all params" command.
 * Body layout:
 *   offset  size  field
 *   0       2     replyToSerial (uint16 BE) — serial of the 0x8104 we sent
 *   2       1     paramCount    (uint8)     — number of TLV entries
 *   3..N          paramCount × { id (uint32 BE) | length (uint8) | value (bytes) }
 *
 * NOTE: The platform must NOT send 0x8001 in response to 0x0104 — it is
 * itself a response message.
 */

export interface DecodedParam {
  id: number;
  /** Raw bytes of the value; caller interprets per the param-type table. */
  raw: Buffer;
}

export interface DecodedQueryParamsResponse {
  replyToSerial: number;
  paramCount: number;
  params: DecodedParam[];
}

/**
 * D450 OBD-related parameter IDs (from device specification):
 * 0x2017 — OBD function enable (BYTE, 0=off, 1=on)
 * 0x201A — Read fault codes flag (BYTE, one-shot)
 * 0x201B — OBD upload interval (DWORD, seconds) — &3Z in some docs
 * 0x201C — OBD large packet upload interval (DWORD, seconds) — &5R in some docs
 * 0x201D — Diagnostic/OBD log setting (BYTE) — &5P in some docs
 */
export const OBD_PARAM_IDS = {
  ENABLE: 0x2017,
  READ_FAULT_CODES: 0x201a,
  UPLOAD_INTERVAL: 0x201b, // &3Z
  LARGE_PACKET_INTERVAL: 0x201c, // &5R
  DIAG_LOG_SETTING: 0x201d, // &5P
} as const;

export interface DecodedObdConfig {
  obdEnabled: boolean;
  uploadIntervalSec: number | null;
  largePacketIntervalSec: number | null;
  diagLogSetting: number | null;
}

export function decode(body: Buffer): DecodedQueryParamsResponse {
  if (body.length < 3) {
    throw new Error(`0x0104 body too short (${body.length} < 3)`);
  }

  const replyToSerial = body.readUInt16BE(0);
  const paramCount = body.readUInt8(2);
  const params: DecodedParam[] = [];

  let cursor = 3;
  for (let i = 0; i < paramCount && cursor < body.length; i++) {
    if (cursor + 5 > body.length) break; // need at least id(4) + len(1)
    const id = body.readUInt32BE(cursor);
    cursor += 4;
    const len = body.readUInt8(cursor);
    cursor += 1;
    if (cursor + len > body.length) break;
    const raw = body.subarray(cursor, cursor + len);
    cursor += len;
    params.push({ id, raw });
  }

  return { replyToSerial, paramCount, params };
}

/**
 * Extract OBD configuration from decoded 0x0104 parameters.
 * Returns null if OBD params are not present.
 */
export function extractObdConfig(params: DecodedParam[]): DecodedObdConfig | null {
  let obdEnabled: boolean | null = null;
  let uploadIntervalSec: number | null = null;
  let largePacketIntervalSec: number | null = null;
  let diagLogSetting: number | null = null;

  for (const param of params) {
    if (param.id === OBD_PARAM_IDS.ENABLE && param.raw.length >= 1) {
      obdEnabled = param.raw.readUInt8(0) === 1;
    } else if (param.id === OBD_PARAM_IDS.UPLOAD_INTERVAL && param.raw.length >= 4) {
      uploadIntervalSec = param.raw.readUInt32BE(0);
    } else if (param.id === OBD_PARAM_IDS.LARGE_PACKET_INTERVAL && param.raw.length >= 4) {
      largePacketIntervalSec = param.raw.readUInt32BE(0);
    } else if (param.id === OBD_PARAM_IDS.DIAG_LOG_SETTING && param.raw.length >= 1) {
      diagLogSetting = param.raw.readUInt8(0);
    }
  }

  if (obdEnabled === null) {
    return null; // OBD params not present
  }

  return {
    obdEnabled,
    uploadIntervalSec,
    largePacketIntervalSec,
    diagLogSetting,
  };
}
