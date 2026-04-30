/**
 * 0x8104 — Query Terminal Parameters (§3.10 JT/T 808-2013).
 *
 * Body: empty — semantics of "query ALL parameters". The device replies with
 * a 0x0104 frame carrying a TLV list of every parameter it knows.
 *
 * NOTE: JT/T 808-2019 keeps 0x8104 as the query-all variant and adds 0x8106
 * for "query specific by id". We don't implement 0x8106 yet because the
 * dealer UI currently has no reason to request a single id — they fetch the
 * full set, edit, and write back via 0x8103.
 */

export function encode(): Buffer {
  return Buffer.alloc(0);
}
