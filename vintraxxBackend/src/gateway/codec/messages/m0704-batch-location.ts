/**
 * 0x0704 — Batch Location Upload (§3.39).
 *
 * Used by terminals to back-fill location reports captured while the network
 * was unavailable.
 *
 * Body layout:
 *   offset  size      field
 *   0       2         itemCount       (uint16 BE)         — number of entries
 *   2       1         locationType    (uint8)             — 0 normal, 1 blind-area supplementary
 *   3..end            packed entries: each entry = uint16 BE length, then a
 *                     standalone 0x0200 body of that length.
 *
 * We delegate the per-entry decode to m0200.decode().
 */

import { decode as decodeLocation, type DecodedLocation } from './m0200-location';

export interface DecodedBatchLocation {
  itemCount: number;
  /** 0 = normal upload, 1 = blind-area supplement (catch-up dump). */
  locationType: number;
  entries: DecodedLocation[];
}

export function decode(body: Buffer): DecodedBatchLocation {
  if (body.length < 3) {
    throw new Error(`0x0704 body too short: ${body.length} bytes`);
  }
  const itemCount = body.readUInt16BE(0);
  const locationType = body.readUInt8(2);

  const entries: DecodedLocation[] = [];
  let cursor = 3;
  for (let i = 0; i < itemCount; i++) {
    if (cursor + 2 > body.length) {
      throw new Error(
        `0x0704 truncated at item ${i + 1}/${itemCount}: missing length prefix`,
      );
    }
    const entryLen = body.readUInt16BE(cursor);
    cursor += 2;
    if (cursor + entryLen > body.length) {
      throw new Error(
        `0x0704 truncated at item ${i + 1}/${itemCount}: entry length ${entryLen} > ${body.length - cursor} remaining`,
      );
    }
    const entryBody = body.subarray(cursor, cursor + entryLen);
    cursor += entryLen;
    entries.push(decodeLocation(entryBody));
  }

  return { itemCount, locationType, entries };
}
