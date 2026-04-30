/**
 * gps-alarm-bridge — turns a freshly-opened CRITICAL GpsAlarm into a draft
 * ServiceAppointment row so the dealer's queue picks it up immediately.
 *
 * Why a bridge service and not inline in handleLocation:
 *   • The same logic must run when an alarm comes from a 0x0900 OBD pass-
 *     through (Phase 2) AND from a status-bit transition on 0x0200.
 *     Centralising prevents two slightly-different versions.
 *   • Tests can mock this single boundary instead of the whole flow.
 *
 * Behaviour:
 *   • Only CRITICAL severity triggers the bridge — WARNING/INFO are noise
 *     and would flood dealers.
 *   • If the terminal is unpaired (ownerUserId null) we skip — no user means
 *     no dealer reaches out yet. The alarm row still exists for admin review.
 *   • Idempotent: if the alarm already has a serviceAppointmentId we don't
 *     create a second one (handles retries on transient DB errors).
 */

import prisma from '../config/db';
import logger from '../utils/logger';
import { sendCriticalAlarmPush } from './push.service';
import type { GpsAlarm, GpsTerminal, User } from '@prisma/client';

interface BridgeContext {
  alarm: GpsAlarm;
  terminal: GpsTerminal;
  /** Pre-fetched owner if the caller already has it; we re-fetch otherwise. */
  owner?: User | null;
}

/**
 * Map the alarm type to the dealer-facing service-type label that the
 * existing scheduling system understands. The schedule controller stores
 * `serviceType` as a free-form string today; we deliberately reuse a small
 * set so dashboards can group on it.
 */
function deriveServiceType(alarm: GpsAlarm): string {
  switch (alarm.type) {
    case 'COLLISION':
      return 'gps-alert-collision';
    case 'ROLLOVER':
      return 'gps-alert-rollover';
    case 'TOW':
      return 'gps-alert-theft-or-tow';
    case 'POWER_LOST':
      return 'gps-alert-power-cut';
    case 'SOS':
      return 'gps-alert-sos';
    case 'DTC_DETECTED':
    case 'MIL_ON':
      return 'gps-alert-engine-fault';
    default:
      return 'gps-alert-other';
  }
}

function deriveCustomerNotes(alarm: GpsAlarm, terminal: GpsTerminal): string {
  const lat = alarm.latitude?.toString() ?? 'unknown';
  const lng = alarm.longitude?.toString() ?? 'unknown';
  const vehicle = [terminal.vehicleYear, terminal.vehicleMake, terminal.vehicleModel]
    .filter(Boolean)
    .join(' ') || terminal.nickname || 'Unknown vehicle';
  return [
    `Auto-generated from GPS alert: ${alarm.type} (severity ${alarm.severity}).`,
    `Vehicle: ${vehicle}${terminal.vehicleVin ? ` (VIN ${terminal.vehicleVin})` : ''}.`,
    `Last known location at alert time: ${lat}, ${lng}.`,
    `Alert opened at ${alarm.openedAt.toISOString()}.`,
  ].join(' ');
}

export async function maybeCreateAppointmentForAlarm(ctx: BridgeContext): Promise<void> {
  const { alarm, terminal } = ctx;

  if (alarm.severity !== 'CRITICAL') return;
  if (alarm.serviceAppointmentId) return; // already bridged
  if (!terminal.ownerUserId) {
    logger.info('Skipping alarm→appointment bridge: terminal unpaired', {
      alarmId: alarm.id,
      terminalId: terminal.id,
    });
    return;
  }

  const owner =
    ctx.owner ??
    (await prisma.user.findUnique({ where: { id: terminal.ownerUserId } }));
  if (!owner) {
    logger.warn('Skipping alarm→appointment bridge: owner not found', {
      alarmId: alarm.id,
      ownerUserId: terminal.ownerUserId,
    });
    return;
  }

  // ServiceAppointment.preferredDate is a STRING column (the human-typed
  // calendar date from the dealer scheduling form). For the auto-bridged
  // row we use today's date in ISO yyyy-mm-dd form so it sorts correctly
  // alongside human-submitted ones. Dealers re-confirm the actual slot when
  // they reach out to the customer.
  const today = new Date();
  const preferredDate = today.toISOString().slice(0, 10);

  try {
    const appointment = await prisma.serviceAppointment.create({
      data: {
        userId: owner.id,
        name: owner.fullName ?? owner.email,
        email: owner.email,
        phone: null,
        dealership: null,
        vehicle:
          [terminal.vehicleYear, terminal.vehicleMake, terminal.vehicleModel]
            .filter(Boolean)
            .join(' ') || null,
        vin: terminal.vehicleVin ?? null,
        serviceType: deriveServiceType(alarm),
        preferredDate,
        preferredTime: null,
        additionalNotes: deriveCustomerNotes(alarm, terminal),
        status: 'pending',
      },
    });

    await prisma.gpsAlarm.update({
      where: { id: alarm.id },
      data: { serviceAppointmentId: appointment.id },
    });

    logger.info('Created ServiceAppointment from CRITICAL GPS alarm', {
      alarmId: alarm.id,
      appointmentId: appointment.id,
      ownerUserId: owner.id,
      type: alarm.type,
    });
  } catch (err) {
    // Bridge failure must never bubble up — the alarm row is the source of
    // truth and ops can re-bridge later from admin UI. Log loud and move on.
    logger.error('alarm→appointment bridge failed', {
      alarmId: alarm.id,
      terminalId: terminal.id,
      err: (err as Error).message,
    });
  }
}

/**
 * Fan-out a CRITICAL alarm to the owner's mobile devices via FCM/APNs.
 *
 * Idempotency is enforced by inserting into `GpsAlarmPushDedup` BEFORE we
 * call `sendCriticalAlarmPush`. The `alarmId` column is unique, so a second
 * caller (different worker, or a retried gateway pass) gets a P2002 and we
 * skip. This keeps push exactly-once even if the bridge fires twice.
 *
 * Errors NEVER bubble — the gateway's primary job is persisting telemetry,
 * not delighting users with notifications.
 */
export async function maybeSendCriticalAlarmPush(
  ctx: BridgeContext,
): Promise<void> {
  const { alarm, terminal } = ctx;
  if (alarm.severity !== 'CRITICAL') return;
  if (!terminal.ownerUserId) return; // unpaired → nobody to notify

  // CAS via unique-key insert. P2002 = "already pushed for this alarm".
  try {
    await prisma.gpsAlarmPushDedup.create({
      data: { alarmId: alarm.id },
    });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2002') {
      logger.debug('Push dedup hit; another worker already notified', {
        alarmId: alarm.id,
      });
      return;
    }
    logger.warn('Push dedup CAS failed (non-fatal); skipping push', {
      alarmId: alarm.id,
      err: (err as Error).message,
    });
    return;
  }

  // Fire-and-forget. The push service catches its own errors.
  void sendCriticalAlarmPush({
    userId: terminal.ownerUserId,
    alarm,
    terminal,
  }).catch((err) => {
    logger.error('sendCriticalAlarmPush threw despite internal catch', {
      alarmId: alarm.id,
      err: (err as Error).message,
    });
  });
}
