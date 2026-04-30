/**
 * 0x0100 — Terminal Registration handler.
 *
 * Flow:
 *   1. Decode the body to get manufacturerId / model / terminalId / plate.
 *   2. Resolve the terminal's IMEI:
 *        • IMEI is sent later in 0x0102 (2019 spec) but we need a stable
 *          identity NOW for the auth-code response.
 *        • For 2013-spec devices the only stable identity is the BCD phone
 *          number from the message header. We treat phoneBcd as the IMEI key.
 *        • For 2019-spec devices the phoneBcd is the IMEI by design.
 *   3. Look up GpsTerminal by IMEI:
 *        • Found + REVOKED → reply NO_SUCH_TERMINAL, close.
 *        • Not found + GPS_AUTO_PROVISION=false → reply NO_SUCH_TERMINAL, close.
 *        • Not found + GPS_AUTO_PROVISION=true  → upsert + reply OK + new auth code.
 *        • Found → update metadata, rotate auth code, reply OK.
 *   4. Update GpsTerminal.status = NEVER_CONNECTED (waiting for 0x0102).
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

  const imei = session.phoneBcd?.replace(/^0+/, '') ?? '';
  if (!imei) {
    session.log.warn('0x0100 received with empty phoneBcd; closing');
    session.close('register without phone identity');
    return;
  }

  // The phoneBcd is 12 BCD digits, left-padded with zeros if the actual IMEI
  // is shorter. Strip leading zeros to get the canonical 15-digit IMEI (or
  // shorter for legacy SIM-MSISDN-based identities).
  let terminal = await prisma.gpsTerminal.findUnique({ where: { imei } });

  if (terminal && terminal.status === 'REVOKED') {
    session.log.warn('Registration attempt from REVOKED terminal', { imei });
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
      session.log.warn('Unknown IMEI and auto-provisioning disabled', {
        imei,
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
        imei,
        phoneNumber: session.phoneBcd ?? null,
        manufacturerId: body.manufacturerId || null,
        terminalModel: body.terminalModel || null,
        provinceId: body.provinceId || null,
        cityId: body.cityId || null,
        plateColor: body.plateColor || null,
        plateNumber: body.plateNumber || null,
        status: 'NEVER_CONNECTED',
      },
    });
    session.log.info('Auto-provisioned new GpsTerminal', { terminalId: terminal.id, imei });
  } else {
    // Refresh metadata fields — manufacturers occasionally bump model/firmware
    // and we want the latest from the device, not whatever the admin typed in.
    terminal = await prisma.gpsTerminal.update({
      where: { id: terminal.id },
      data: {
        phoneNumber: session.phoneBcd ?? terminal.phoneNumber,
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
