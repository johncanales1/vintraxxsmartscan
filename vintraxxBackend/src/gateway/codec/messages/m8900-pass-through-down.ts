/**
 * 0x8900 — Data Pass-through (down-link), §3.31 of JT/T 808.
 *
 * Mirror of the up-link 0x0900: 1-byte subtype + opaque vendor payload.
 * Subtypes used by the OBD scanners we support:
 *
 *   0xF6  DTC clear command — 1-byte payload (0x01 = clear stored DTCs)
 *
 * The device replies with a 0x0001 (terminal general response) ack to confirm
 * the message was received, and AFTER it has actually executed the action
 * also sends an up-link 0x0900/0xF6 carrying the result code (handled by
 * `handlePassThrough.handleDtcClearAck`).
 *
 * Adding new vendor subtypes: extend with another small `encodeXxx()` helper
 * — keep one function per subtype rather than a generic catch-all so the
 * call-site is always typed.
 */

const SUBTYPE_DTC_CLEAR = 0xf6;

/**
 * Build the body for a DTC-clear request. Concox / Jimi convention is to
 * send a 2-byte body: subtype (0xF6) + 1-byte action code (0x01 = clear all
 * stored, 0x02 = clear pending only — we only expose 0x01 today).
 */
export function encodeDtcClear(): Buffer {
  return Buffer.from([SUBTYPE_DTC_CLEAR, 0x01]);
}

/**
 * Generic builder for any pass-through subtype. Useful for tests and for
 * vendor extensions added later without touching this file.
 */
export function encodeRaw(subtype: number, payload: Buffer): Buffer {
  if (subtype < 0 || subtype > 0xff) {
    throw new Error('0x8900 subtype must be a single byte');
  }
  const out = Buffer.alloc(1 + payload.length);
  out.writeUInt8(subtype, 0);
  payload.copy(out, 1);
  return out;
}
