/**
 * 0x0100 — Terminal Registration (§2.4 + §3.3).
 *
 * Body layout (variable, ASCII fields are NUL-padded):
 *
 *   offset  size  field
 *   0       2     provinceId       (uint16, BE)
 *   2       2     cityId           (uint16, BE)
 *   4       5     manufacturerId   (5 ASCII bytes)
 *   9       20    terminalModel    (20 ASCII bytes; 30 for the 2019 spec — we
 *                                   detect by remaining length below)
 *  29       7     terminalId       (7 ASCII bytes;  30 for the 2019 spec)
 *  36       1     plateColor       (uint8)         — 0 = unbound, 1..5 = color
 *  37       N     plateNumber      (remaining bytes, GBK/ASCII)
 *
 * The 2019 revision of the spec widens terminalModel to 30 bytes and
 * terminalId to 30 bytes, giving a fixed offset to plateColor of 67. We
 * support both by sniffing the body length.
 */

import type { DecodedRegister } from '../types';

const HEADER_2013_LEN = 37; // through plateColor, before plateNumber
const HEADER_2019_LEN = 67;

export function decode(body: Buffer): DecodedRegister {
  if (body.length < HEADER_2013_LEN) {
    throw new Error(`0x0100 body too short: ${body.length} bytes`);
  }

  const provinceId = body.readUInt16BE(0);
  const cityId = body.readUInt16BE(2);
  const manufacturerId = readAscii(body, 4, 5);

  // Heuristic: 2019-spec frames are at least 67 bytes BEFORE the plate number.
  // Anything shorter is the 2013 layout.
  const is2019 = body.length >= HEADER_2019_LEN;

  let cursor = 9;
  const modelLen = is2019 ? 30 : 20;
  const terminalModel = readAscii(body, cursor, modelLen);
  cursor += modelLen;

  const idLen = is2019 ? 30 : 7;
  const terminalId = readAscii(body, cursor, idLen);
  cursor += idLen;

  const plateColor = body.readUInt8(cursor);
  cursor += 1;

  const plateNumber = body.length > cursor ? readAscii(body, cursor, body.length - cursor) : '';

  return {
    provinceId,
    cityId,
    manufacturerId,
    terminalModel,
    terminalId,
    plateColor,
    plateNumber,
  };
}

/**
 * Read a fixed-length ASCII field, trimming trailing NUL bytes and surrounding
 * whitespace. Non-ASCII bytes are passed through latin-1 to avoid throwing.
 */
function readAscii(buf: Buffer, offset: number, length: number): string {
  const slice = buf.subarray(offset, offset + length);
  // Find first NUL to trim NUL-padded fields.
  let end = slice.length;
  for (let i = 0; i < slice.length; i++) {
    if (slice[i] === 0x00) {
      end = i;
      break;
    }
  }
  return slice.toString('latin1', 0, end).trim();
}
