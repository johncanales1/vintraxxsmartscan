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
