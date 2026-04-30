/**
 * Top-level codec entry points used by the session/handler layers.
 *
 * `decodeFrame` takes one full escaped frame (with leading/trailing 0x7E) and
 * returns the parsed header + raw unescaped body, after verifying the XOR
 * checksum. Per-message body decoding is delegated to the files under
 * `./messages/` and is invoked by the dispatch layer based on the msgId.
 *
 * `encodeFrame` takes a header description + an already-encoded body buffer
 * and produces the complete on-the-wire bytes (escaped, with delimiters).
 */

import { unescape, escape, xorChecksum } from './framing';
import { decodeHeader, encodeHeader } from './header';
import { FRAME_DELIMITER } from './constants';
import type { MessageHeader } from './types';

/** Result of decoding one wire frame. */
export interface DecodedFrame {
  header: MessageHeader;
  /** Raw unescaped body bytes (after the header, before the checksum). */
  body: Buffer;
  /** Original unescaped bytes of header + body (useful for raw-frame logging). */
  rawUnescaped: Buffer;
}

/**
 * Decode one complete frame. The `frame` argument MUST start with 0x7E and end
 * with 0x7E — splitFrames() guarantees this.
 *
 * Throws on:
 *   • missing/wrong delimiters
 *   • body length under-flow vs header.bodyLength
 *   • XOR checksum mismatch
 *   • encryption type other than 0 (we don't support RSA)
 */
export function decodeFrame(frame: Buffer): DecodedFrame {
  if (frame.length < 4) {
    throw new Error(`Frame too short: ${frame.length} bytes`);
  }
  if (frame[0] !== FRAME_DELIMITER || frame[frame.length - 1] !== FRAME_DELIMITER) {
    throw new Error('Frame missing 0x7E delimiters');
  }

  // Strip delimiters and unescape.
  const escaped = frame.subarray(1, frame.length - 1);
  const unescaped = unescape(escaped);

  if (unescaped.length < 13) {
    throw new Error(`Unescaped frame too short: ${unescaped.length} bytes`);
  }

  // Last byte is XOR checksum over the rest.
  const checksumByte = unescaped[unescaped.length - 1];
  const computed = xorChecksum(unescaped, 0, unescaped.length - 1);
  if (checksumByte !== computed) {
    throw new Error(
      `Checksum mismatch: got 0x${checksumByte.toString(16)}, expected 0x${computed.toString(16)}`,
    );
  }

  const headerAndBody = unescaped.subarray(0, unescaped.length - 1);
  const { header, headerLength } = decodeHeader(headerAndBody);

  if (header.encryptType !== 0) {
    throw new Error(`Unsupported encryption type: ${header.encryptType}`);
  }

  // The bodyLength advertised in the header is authoritative.
  const expectedTotal = headerLength + header.bodyLength;
  if (headerAndBody.length < expectedTotal) {
    throw new Error(
      `Frame body shorter than declared: have ${headerAndBody.length} bytes, header claims ${expectedTotal}`,
    );
  }

  const body = headerAndBody.subarray(headerLength, expectedTotal);
  return { header, body, rawUnescaped: headerAndBody };
}

/**
 * Encode a downstream message into the bytes we'll send over the socket.
 * `bodyEncoder` produces the body-only bytes; we wrap them with header,
 * checksum, escape, and 0x7E delimiters.
 */
export function encodeFrame(args: {
  msgId: number;
  phoneBcd: string;
  msgSerial: number;
  body: Buffer;
  encryptType?: number;
  subpackage?: { total: number; index: number };
}): Buffer {
  const header = encodeHeader({
    msgId: args.msgId,
    bodyLength: args.body.length,
    encryptType: args.encryptType ?? 0,
    phoneBcd: args.phoneBcd,
    msgSerial: args.msgSerial,
    subpackage: args.subpackage,
  });

  const headerAndBody = Buffer.concat([header, args.body]);
  const checksum = xorChecksum(headerAndBody);
  const middle = Buffer.concat([headerAndBody, Buffer.from([checksum])]);
  const escaped = escape(middle);

  return Buffer.concat([Buffer.from([FRAME_DELIMITER]), escaped, Buffer.from([FRAME_DELIMITER])]);
}
