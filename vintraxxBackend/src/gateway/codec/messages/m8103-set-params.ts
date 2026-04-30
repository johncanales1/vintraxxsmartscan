/**
 * 0x8103 — Set Terminal Parameters (§3.9 JT/T 808-2019).
 *
 * Body layout:
 *   offset  size  field
 *   0       1     paramCount (uint8) — number of TLV entries
 *   1..N           paramCount × { id (uint32 BE) | length (uint8) | value (bytes) }
 *
 * Caller passes a typed list of `{ id, value }`. We encode `length` ourselves
 * based on the value's serialised form. Three forms are supported:
 *
 *   • number  → encoded as uint32 BE (4 bytes). The vast majority of JT/T 808
 *               parameter ids are uint32 (e.g. 0x0001 = heartbeat interval in
 *               seconds, 0x0010 = APN), so this is the common case.
 *   • string  → UTF-8 encoded; length is the byte count. Used for APN, server
 *               address, etc.
 *   • Buffer  → opaque bytes; caller decides the layout. Used for vendor-
 *               specific ids that don't fit either of the above shapes.
 *
 * Each value's encoded length must fit in one byte (≤ 255). The spec doesn't
 * support multi-byte length fields here, so over-long values throw.
 *
 * Reference table of common parameter ids (incomplete — see §C of the spec):
 *   0x0001  uint32  heartbeat interval (s)
 *   0x0010  string  APN
 *   0x0013  string  server IP
 *   0x0018  uint32  server TCP port
 *   0x0029  uint32  default location report interval (s)
 *   0x0055  uint32  max speed (km/h)
 *   0x0056  uint32  overspeed duration before alarm (s)
 */

export interface ParamValueNumber {
  id: number;
  /** Encoded as uint32 BE. Caller is responsible for choosing values < 2^32. */
  value: number;
}

export interface ParamValueString {
  id: number;
  /** UTF-8 string. Encoded length must be ≤ 255 bytes. */
  value: string;
}

export interface ParamValueBytes {
  id: number;
  /** Pre-encoded byte payload. Length must be ≤ 255 bytes. */
  value: Buffer;
}

export type ParamEntry = ParamValueNumber | ParamValueString | ParamValueBytes;

export function encode(params: ParamEntry[]): Buffer {
  if (params.length === 0) {
    throw new Error('0x8103 requires at least one parameter');
  }
  if (params.length > 255) {
    throw new Error('0x8103 supports at most 255 parameters per frame');
  }

  // Serialise each entry first so we can size-check before allocating.
  const segments: Buffer[] = [];
  for (const p of params) {
    let valueBuf: Buffer;
    if (typeof p.value === 'number') {
      if (!Number.isInteger(p.value) || p.value < 0 || p.value > 0xffffffff) {
        throw new Error(
          `0x8103 numeric param 0x${p.id.toString(16)} out of uint32 range`,
        );
      }
      valueBuf = Buffer.alloc(4);
      valueBuf.writeUInt32BE(p.value, 0);
    } else if (typeof p.value === 'string') {
      valueBuf = Buffer.from(p.value, 'utf8');
    } else {
      valueBuf = p.value;
    }

    if (valueBuf.length > 255) {
      throw new Error(
        `0x8103 param 0x${p.id.toString(16)} value too long (${valueBuf.length} > 255)`,
      );
    }

    const seg = Buffer.alloc(4 + 1 + valueBuf.length);
    seg.writeUInt32BE(p.id >>> 0, 0);
    seg.writeUInt8(valueBuf.length, 4);
    valueBuf.copy(seg, 5);
    segments.push(seg);
  }

  const totalLen = 1 + segments.reduce((acc, s) => acc + s.length, 0);
  const out = Buffer.alloc(totalLen);
  out.writeUInt8(params.length, 0);
  let cursor = 1;
  for (const seg of segments) {
    seg.copy(out, cursor);
    cursor += seg.length;
  }
  return out;
}
