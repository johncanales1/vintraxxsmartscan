/**
 * 0x0100 — Terminal Registration handler.
 *
 * Flow:
 *   1. Decode the body to get manufacturerId / model / terminalId / plate.
 *   2. Resolve the terminal's canonical identifier from the JT/T 808 message
 *      header. Per spec §1.5.2 every packet's header carries a BCD[6] "end
 *      phone number" — this is the identity the gateway keys lookups on.
 *      For 2013-spec devices that's an MSISDN; for 2019-spec it's commonly
 *      the IMEI. The protocol itself never says "IMEI"; we just use whatever
 *      the device sent in its header (leading zeros stripped).
 *   3. Look up GpsTerminal by deviceIdentifier:
 *        • Found + REVOKED → reply NO_SUCH_TERMINAL, close.
 *        • Not found + GPS_AUTO_PROVISION=false → reply NO_SUCH_TERMINAL, close.
 *        • Not found + GPS_AUTO_PROVISION=true  → create + reply OK + new auth code.
 *        • Found → update metadata, rotate auth code, reply OK.
 *   4. Leave GpsTerminal.status = NEVER_CONNECTED (waiting for 0x0102).
 *
 * Note: we DO NOT mark the terminal ONLINE here. ONLINE happens after a
 * successful 0x0102 in handleAuth.
 */

import prisma from '../../config/db';
import { env } from '../../config/env';
import { encode as encodeRegisterResponse } from '../codec/messages/m8100-register-response';
import { MsgId, RegisterResult } from '../codec/constants';
import { generateAuthCode } from '../services/auth-code';
import { registrationLimiter } from '../services/rate-limit';
import type { Session } from '../session/Session';
import type { DecodedRegister } from '../codec/types';

export async function handleRegister(
  session: Session,
  body: DecodedRegister,
  msgSerial: number,
): Promise<void> {
  // Per-IP storm protection. The remoteAddress is the carrier NAT exit IP
  // for cellular devices, so a single legitimate fleet shares one bucket;
  // capacity is sized for that. A device stuck in a register loop burns
  // the bucket and gets dropped without a response.
  const remoteIp = session.socket.remoteAddress ?? 'unknown';
  if (!registrationLimiter.tryConsume(remoteIp)) {
    session.log.warn('Registration rate-limit exceeded; dropping', { remoteIp });
    session.close('registration rate limit');
    return;
  }

  // The phoneBcd is 12 BCD digits, left-padded with zeros if the actual
  // identifier is shorter. Strip leading zeros to get the canonical
  // identifier the device transmits — for 2013-spec devices that's an
  // MSISDN, for 2019-spec it's commonly an IMEI. Either way, this is the
  // value the admin must have provisioned in `deviceIdentifier`.
  const deviceIdentifier = session.phoneBcd?.replace(/^0+/, '') ?? '';
  if (!deviceIdentifier) {
    session.log.warn('0x0100 received with empty phoneBcd; closing');
    session.close('register without phone identity');
    return;
  }

  let terminal = await prisma.gpsTerminal.findUnique({
    where: { deviceIdentifier },
  });

  if (terminal && terminal.status === 'REVOKED') {
    session.log.warn('Registration attempt from REVOKED terminal', { deviceIdentifier });
    session.writeFrame({
      msgId: MsgId.REGISTER_RESPONSE,
      body: encodeRegisterResponse({
        replyToSerial: msgSerial,
        result: RegisterResult.NO_SUCH_TERMINAL,
      }),
    });
    session.close('terminal revoked');
    return;
  }

  if (!terminal) {
    if (!env.GPS_AUTO_PROVISION) {
      session.log.warn('Unknown device identifier and auto-provisioning disabled', {
        deviceIdentifier,
        manufacturerId: body.manufacturerId,
        model: body.terminalModel,
      });
      session.writeFrame({
        msgId: MsgId.REGISTER_RESPONSE,
        body: encodeRegisterResponse({
          replyToSerial: msgSerial,
          result: RegisterResult.NO_SUCH_TERMINAL,
        }),
      });
      session.close('terminal not provisioned');
      return;
    }

    terminal = await prisma.gpsTerminal.create({
      data: {
        deviceIdentifier,
        // imei is left null on auto-provision: the JT/T 808 protocol never
        // confirms the BCD-header value is actually an IMEI. The 2019-spec
        // 0x0102 auth body carries the real IMEI explicitly — handleAuth
        // will populate this field from there if it arrives.
        imei: null,
        // phoneNumber is admin-managed (MSISDN). Do NOT write the raw BCD
        // header here — it's an opaque identifier, not a phone number.
        phoneNumber: null,
        manufacturerId: body.manufacturerId || null,
        terminalModel: body.terminalModel || null,
        provinceId: body.provinceId || null,
        cityId: body.cityId || null,
        plateColor: body.plateColor || null,
        plateNumber: body.plateNumber || null,
        status: 'NEVER_CONNECTED',
      },
    });
    session.log.info('Auto-provisioned new GpsTerminal', {
      terminalId: terminal.id,
      deviceIdentifier,
    });
  } else {
    // Refresh metadata fields — manufacturers occasionally bump model/firmware
    // and we want the latest from the device, not whatever the admin typed in.
    terminal = await prisma.gpsTerminal.update({
      where: { id: terminal.id },
      data: {
        // phoneNumber is admin-managed — never overwrite with raw BCD.
        manufacturerId: body.manufacturerId || terminal.manufacturerId,
        terminalModel: body.terminalModel || terminal.terminalModel,
        provinceId: body.provinceId || terminal.provinceId,
        cityId: body.cityId || terminal.cityId,
        plateColor: body.plateColor || terminal.plateColor,
        plateNumber: body.plateNumber || terminal.plateNumber,
      },
    });
  }

  // Issue a fresh auth code and persist it. The terminal will echo this back
  // in its 0x0102 message — handleAuth verifies the round-trip.
  const authCode = generateAuthCode();
  await prisma.gpsTerminal.update({
    where: { id: terminal.id },
    data: { authCode, authCodeIssuedAt: new Date() },
  });

  session.writeFrame({
    msgId: MsgId.REGISTER_RESPONSE,
    body: encodeRegisterResponse({
      replyToSerial: msgSerial,
      result: RegisterResult.OK,
      authCode,
    }),
  });

  session.log.info('Issued auth code in 0x8100 response', { terminalId: terminal.id });
}
