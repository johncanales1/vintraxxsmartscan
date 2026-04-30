/**
 * 0x8100 — Terminal Registration Response (§3.4).
 *
 * Body layout (variable):
 *   offset  size  field
 *   0       2     replyToSerial   (uint16, BE)   — serial of the 0x0100 we're answering
 *   2       1     result          (uint8)        — see RegisterResult
 *   [3]     N     authCode        (ASCII, only when result === OK)
 *
 * The auth code we issue here MUST be echoed back by the terminal in its next
 * 0x0102 (Terminal Authentication) message. Anything else (mismatched code,
 * unknown IMEI…) results in the platform closing the socket.
 */

import { RegisterResult } from '../constants';
import type { EncodeRegisterResponseInput } from '../types';

export function encode(input: EncodeRegisterResponseInput): Buffer {
  if (input.result === RegisterResult.OK) {
    if (!input.authCode || input.authCode.length === 0) {
      throw new Error('encode(0x8100): authCode is required when result === OK');
    }
    const codeBytes = Buffer.from(input.authCode, 'ascii');
    const buf = Buffer.alloc(3 + codeBytes.length);
    buf.writeUInt16BE(input.replyToSerial & 0xffff, 0);
    buf.writeUInt8(input.result & 0xff, 2);
    codeBytes.copy(buf, 3);
    return buf;
  }

  // Failure response — no auth code.
  const buf = Buffer.alloc(3);
  buf.writeUInt16BE(input.replyToSerial & 0xffff, 0);
  buf.writeUInt8(input.result & 0xff, 2);
  return buf;
}
