/**
 * 0x8001 — Platform General Response (§3.2).
 *
 * Body layout (5 bytes):
 *   offset  size  field
 *   0       2     replyToSerial   (uint16, BE)
 *   2       2     replyToMsgId    (uint16, BE)
 *   4       1     result          (uint8)         — see PlatformResult
 *
 * The platform MUST emit one of these in response to every up-link message
 * from the terminal (spec §1.7), unless that message itself is a 0x0001
 * (terminal general response) — never ack an ack.
 */

import type { EncodePlatformResponseInput } from '../types';

export function encode(input: EncodePlatformResponseInput): Buffer {
  const buf = Buffer.alloc(5);
  buf.writeUInt16BE(input.replyToSerial & 0xffff, 0);
  buf.writeUInt16BE(input.replyToMsgId & 0xffff, 2);
  buf.writeUInt8(input.result & 0xff, 4);
  return buf;
}
