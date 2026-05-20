/**
 * 0x8300 — Text Message Delivery (platform → terminal).
 *
 * Body layout:
 *   offset  size          field
 *   0       1             textFlag  (BYTE)  — bit-field; 0x01 = service message
 *   1       variable      textInfo  (STRING) — GBK-encoded text
 *
 * For ASCII-range payloads (which all confirmed D450/HOLLOO commands are),
 * GBK encoding is identical to ASCII, so we encode with 'ascii'. If future
 * commands require non-ASCII characters we can swap in an `iconv-lite`
 * GBK encoder.
 *
 * The terminal responds with 0x0001 (Terminal General Response).
 */

export interface TextDistributionArgs {
  /** Text flag byte. 0x01 = service message (default). */
  textFlag?: number;
  /** The text command string to send. */
  text: string;
}

export function encode(args: TextDistributionArgs): Buffer {
  const flag = args.textFlag ?? 0x01;
  const textBytes = Buffer.from(args.text, 'ascii');
  const buf = Buffer.allocUnsafe(1 + textBytes.length);
  buf.writeUInt8(flag, 0);
  textBytes.copy(buf, 1);
  return buf;
}
