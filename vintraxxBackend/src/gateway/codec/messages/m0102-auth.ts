/**
 * 0x0102 — Terminal Authentication (§2.6 + §3.5).
 *
 * 2013-spec body:
 *   N bytes of ASCII auth code (length = body length).
 *
 * 2019-spec body:
 *   uint8           authCodeLength
 *   N bytes ASCII   authCode
 *   15 bytes ASCII  IMEI
 *   20 bytes ASCII  softwareVersion
 *
 * We detect the 2019 layout by reading the leading length byte and verifying
 * that the remaining bytes match the expected fixed-size tail.
 */

import type { DecodedAuth } from '../types';

const IMEI_LEN = 15;
const SW_VER_LEN = 20;

export function decode(body: Buffer): DecodedAuth {
  if (body.length === 0) {
    throw new Error('0x0102 body is empty');
  }

  // 2019 layout? First byte = code length, then code, then 15+20 fixed tail.
  const firstByte = body.readUInt8(0);
  const expected2019Len = 1 + firstByte + IMEI_LEN + SW_VER_LEN;
  // authCodeLength == 0 is valid (some devices send empty auth code in 2019
  // mode but still include the IMEI+software tail).
  if (firstByte >= 0 && firstByte < 64 && body.length === expected2019Len) {
    const authCode = body.toString('latin1', 1, 1 + firstByte).trim();
    const imei = body.toString('latin1', 1 + firstByte, 1 + firstByte + IMEI_LEN).trim();
    const softwareVersion = body
      .toString('latin1', 1 + firstByte + IMEI_LEN, body.length)
      .replace(/\0+$/, '')
      .trim();
    return { authCode, imei, softwareVersion };
  }

  // Fall back to the 2013 layout — entire body is the auth code.
  return { authCode: body.toString('latin1').trim() };
}
