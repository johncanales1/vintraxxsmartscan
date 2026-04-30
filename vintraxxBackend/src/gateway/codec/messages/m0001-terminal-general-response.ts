/**
 * 0x0001 — Terminal General Response (§3.1).
 *
 * Body layout (5 bytes):
 *   offset  size  field
 *   0       2     replyToSerial   (uint16, BE)   — serial of the platform message being acked
 *   2       2     replyToMsgId    (uint16, BE)   — id     of the platform message being acked
 *   4       1     result          (uint8)        — 0 OK, 1 fail, 2 msg-error, 3 unsupported
 *
 * Used by the device to confirm receipt of platform-issued commands such as
 * 0x8201 (location query). Phase 4 wires this into the GpsCommand audit table.
 */

export interface DecodedTerminalGeneralResponse {
  replyToSerial: number;
  replyToMsgId: number;
  result: number;
}

export function decode(body: Buffer): DecodedTerminalGeneralResponse {
  if (body.length < 5) {
    throw new Error(`0x0001 body too short: ${body.length} bytes (expected 5)`);
  }
  return {
    replyToSerial: body.readUInt16BE(0),
    replyToMsgId: body.readUInt16BE(2),
    result: body.readUInt8(4),
  };
}
