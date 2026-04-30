/**
 * JT/T 808 framing (escape / unescape / split / checksum).
 *
 * Spec reference: GPS_OBD_SCANNER.md §1.5 (Composition of Messages) and the
 * appendix that lists the byte-stuffing algorithm.
 *
 * Wire format of one frame (after escape):
 *   0x7E | header(12 or 16 bytes) | body(0..1023 bytes) | checksum(1) | 0x7E
 *
 * Escape rules (applied to every byte BETWEEN the two 0x7E delimiters):
 *   0x7E → 0x7D 0x02
 *   0x7D → 0x7D 0x01
 *
 * Checksum: XOR of every byte from the start of the header to the byte
 * immediately before the checksum (i.e. the un-escaped middle).
 */

import { FRAME_DELIMITER, ESCAPE_INTRODUCER } from './constants';
import type { FrameSplitResult } from './types';

/**
 * Apply byte-stuffing to a payload (header + body + checksum, no delimiters).
 * Used when sending downstream messages.
 */
export function escape(buf: Buffer): Buffer {
  // Worst case: every byte expands to two. Allocate upper bound, copy in once,
  // then slice so we don't pay for two allocations.
  const out = Buffer.allocUnsafe(buf.length * 2);
  let writePos = 0;
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    if (b === FRAME_DELIMITER) {
      out[writePos++] = ESCAPE_INTRODUCER;
      out[writePos++] = 0x02;
    } else if (b === ESCAPE_INTRODUCER) {
      out[writePos++] = ESCAPE_INTRODUCER;
      out[writePos++] = 0x01;
    } else {
      out[writePos++] = b;
    }
  }
  return out.subarray(0, writePos);
}

/**
 * Reverse byte-stuffing.
 *
 * Throws on malformed escape sequences (`0x7D` followed by anything other
 * than `0x01` / `0x02`). Callers should treat this as a frame-level fault and
 * close the socket — the device is either misbehaving or the stream is out of
 * sync.
 */
export function unescape(buf: Buffer): Buffer {
  const out = Buffer.allocUnsafe(buf.length);
  let writePos = 0;
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    if (b === ESCAPE_INTRODUCER) {
      const next = buf[i + 1];
      if (next === 0x02) {
        out[writePos++] = FRAME_DELIMITER;
      } else if (next === 0x01) {
        out[writePos++] = ESCAPE_INTRODUCER;
      } else {
        throw new Error(
          `Invalid escape sequence at offset ${i}: 0x7D followed by 0x${(next ?? 0)
            .toString(16)
            .padStart(2, '0')}`,
        );
      }
      i++; // consume the second escape byte
    } else {
      out[writePos++] = b;
    }
  }
  return out.subarray(0, writePos);
}

/**
 * XOR checksum over `[start, end)` bytes of `buf`. The spec calls for XOR of
 * every byte from the first byte of the header through the byte before the
 * checksum field.
 */
export function xorChecksum(buf: Buffer, start = 0, end = buf.length): number {
  let acc = 0;
  for (let i = start; i < end; i++) {
    acc ^= buf[i];
  }
  return acc & 0xff;
}

/**
 * Split an inbound TCP buffer into complete frames (still escaped, including
 * the leading/trailing 0x7E delimiters). Any trailing partial frame is
 * returned in `rest` so the caller can prepend it to the next socket read.
 *
 * Tolerates:
 *   • leading garbage before the first 0x7E (silently skipped)
 *   • idle 0x7E pairs between frames (the original 2013-spec recommendation
 *     of `... 0x7E 0x7E ...` as a heartbeat marker — empty 2-byte runs are
 *     skipped via the `len < 4` branch below)
 *
 * NOT supported: shared-boundary framing where one 0x7E byte serves as
 * both the END of one frame and the START of the next (`F1 0x7E F2`). No
 * spec-compliant device emits that shape — each frame owns its leading
 * and trailing delimiters — so we don't bother handling it. (HIGH #17:
 * the previous comment incorrectly claimed support; clarified here.)
 *
 * Does NOT verify checksum or unescape — those happen one layer up.
 */
export function splitFrames(input: Buffer): FrameSplitResult {
  const frames: Buffer[] = [];
  let cursor = 0;

  while (cursor < input.length) {
    // Find the next start delimiter.
    const start = input.indexOf(FRAME_DELIMITER, cursor);
    if (start === -1) {
      // No 0x7E in remainder → all noise, drop it.
      return { frames, rest: Buffer.alloc(0) };
    }

    // Look for the closing delimiter strictly after the opener.
    const end = input.indexOf(FRAME_DELIMITER, start + 1);
    if (end === -1) {
      // Incomplete frame; preserve from `start` onward for next read.
      return { frames, rest: input.subarray(start) };
    }

    const len = end - start + 1;
    if (len < 4) {
      // Two delimiters with no useful payload between them. Skip the opener
      // and keep scanning — common when devices emit `0x7E 0x7E` as a heartbeat
      // boundary marker.
      cursor = end;
      continue;
    }

    // Slice INCLUDES both delimiters; downstream layers strip them.
    frames.push(input.subarray(start, end + 1));
    cursor = end + 1;
  }

  return { frames, rest: Buffer.alloc(0) };
}
