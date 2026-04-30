/**
 * 0x8201 — Location Information Query (§3.21 JT/T 808-2019).
 *
 * Body: empty.
 *
 * The platform asks the device to send back its CURRENT location as a single
 * 0x0200 frame (NOT through the standard reporting interval). The device's
 * 0x0001 ack confirms the request was received; the actual position arrives
 * as a regular 0x0200 right after.
 */

export function encode(): Buffer {
  return Buffer.alloc(0);
}
