/**
 * JT/T 808 message header decoder/encoder.
 *
 * Header layout (12 bytes for plain messages, 16 bytes when isSubpackage = 1):
 *
 *   offset  size  field
 *   0       2     msgId            (uint16, big-endian)
 *   2       2     bodyProperties   (uint16, big-endian)
 *   4       6     phoneNumber/IMEI (BCD, 12 digits)
 *  10       2     msgSerial        (uint16, big-endian)
 * [12       4     subpackage info  (count: u16, index: u16) — only when bit 13 of bodyProperties = 1]
 *
 * bodyProperties layout (bit 0 = LSB):
 *   bits  0..9   body length (max 1023)
 *   bits 10..12  encryption type
 *   bit  13      subpackage flag
 *   bits 14..15  reserved (must be 0)
 */

import { BODY_PROPS } from './constants';
import type { MessageHeader } from './types';

const HEADER_BASE_LEN = 12;
const HEADER_SUBPACKAGE_LEN = 16;

/**
 * Decode a message header from the start of an unescaped frame body.
 *
 * `frame` here is the unescaped bytes INSIDE the 0x7E delimiters, i.e. it
 * starts with the msgId word.
 */
export function decodeHeader(frame: Buffer): { header: MessageHeader; headerLength: number } {
  if (frame.length < HEADER_BASE_LEN) {
    throw new Error(`Frame too short for header: ${frame.length} bytes`);
  }

  const msgId = frame.readUInt16BE(0);
  const bodyProps = frame.readUInt16BE(2);

  // JT/T 808-2019 uses bit 14 as a version flag. When set, the header layout
  // is 17 bytes (adds 1-byte protocolVersion + 10-byte BCD instead of 6).
  // This codec only supports the 2013 12-byte layout. Reject early with a
  // clear error rather than silently misaligning all subsequent fields.
  if ((bodyProps & 0x4000) !== 0) {
    throw new Error(
      'JT/T 808-2019 extended header (version flag bit 14 set) is not supported by this codec',
    );
  }

  const bodyLength = bodyProps & BODY_PROPS.BODY_LENGTH_MASK;
  const encryptType = (bodyProps & BODY_PROPS.ENCRYPT_MASK) >> BODY_PROPS.ENCRYPT_SHIFT;
  const isSubpackage = (bodyProps & BODY_PROPS.SUBPACKAGE_BIT) !== 0;

  const phoneBcd = bcdToString(frame.subarray(4, 10));
  const msgSerial = frame.readUInt16BE(10);

  const header: MessageHeader = {
    msgId,
    bodyLength,
    encryptType,
    isSubpackage,
    phoneBcd,
    msgSerial,
  };

  let headerLength = HEADER_BASE_LEN;

  if (isSubpackage) {
    if (frame.length < HEADER_SUBPACKAGE_LEN) {
      throw new Error(
        `Subpackaged frame too short for extended header: ${frame.length} bytes`,
      );
    }
    header.subpackageTotal = frame.readUInt16BE(12);
    header.subpackageIndex = frame.readUInt16BE(14);
    headerLength = HEADER_SUBPACKAGE_LEN;
  }

  return { header, headerLength };
}

/**
 * Encode a header into a 12- or 16-byte buffer. `bodyLength` is the length of
 * the body that will follow, NOT including the checksum byte.
 */
export function encodeHeader(args: {
  msgId: number;
  bodyLength: number;
  encryptType?: number;
  phoneBcd: string;
  msgSerial: number;
  subpackage?: { total: number; index: number };
}): Buffer {
  const encryptType = args.encryptType ?? 0;
  if (args.bodyLength < 0 || args.bodyLength > BODY_PROPS.BODY_LENGTH_MASK) {
    throw new Error(`bodyLength out of range: ${args.bodyLength}`);
  }
  if (encryptType < 0 || encryptType > 7) {
    throw new Error(`encryptType out of range: ${encryptType}`);
  }

  const isSubpackage = !!args.subpackage;
  const headerLen = isSubpackage ? HEADER_SUBPACKAGE_LEN : HEADER_BASE_LEN;
  const buf = Buffer.alloc(headerLen);

  buf.writeUInt16BE(args.msgId & 0xffff, 0);

  let bodyProps = args.bodyLength & BODY_PROPS.BODY_LENGTH_MASK;
  bodyProps |= (encryptType << BODY_PROPS.ENCRYPT_SHIFT) & BODY_PROPS.ENCRYPT_MASK;
  if (isSubpackage) bodyProps |= BODY_PROPS.SUBPACKAGE_BIT;
  buf.writeUInt16BE(bodyProps, 2);

  stringToBcd(args.phoneBcd, 6).copy(buf, 4);
  buf.writeUInt16BE(args.msgSerial & 0xffff, 10);

  if (isSubpackage) {
    buf.writeUInt16BE(args.subpackage!.total & 0xffff, 12);
    buf.writeUInt16BE(args.subpackage!.index & 0xffff, 14);
  }

  return buf;
}

/**
 * Convert N bytes of BCD-encoded digits into a string of 2N decimal characters.
 * Each byte holds two BCD nibbles, high-nibble first.
 *
 * Example: Buffer<[0x01, 0x35, 0x79]> → "013579".
 */
export function bcdToString(buf: Buffer): string {
  let out = '';
  for (let i = 0; i < buf.length; i++) {
    const hi = (buf[i] >> 4) & 0x0f;
    const lo = buf[i] & 0x0f;
    out += hi.toString(10);
    out += lo.toString(10);
  }
  return out;
}

/**
 * Encode a decimal-digit string as BCD into a fixed-length buffer. The string
 * is left-padded with zeros to fill `byteLength * 2` digits. Throws on any
 * non-digit character.
 */
export function stringToBcd(s: string, byteLength: number): Buffer {
  const targetDigits = byteLength * 2;
  const padded = s.padStart(targetDigits, '0').slice(-targetDigits);
  const out = Buffer.alloc(byteLength);
  for (let i = 0; i < byteLength; i++) {
    const hiCh = padded[i * 2];
    const loCh = padded[i * 2 + 1];
    const hi = parseInt(hiCh, 10);
    const lo = parseInt(loCh, 10);
    if (Number.isNaN(hi) || Number.isNaN(lo)) {
      throw new Error(`stringToBcd: non-digit character in "${s}"`);
    }
    out[i] = (hi << 4) | lo;
  }
  return out;
}
