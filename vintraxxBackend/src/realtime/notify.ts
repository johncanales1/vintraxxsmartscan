/**
 * notify.ts — fire-and-forget pg_notify helper.
 *
 * Both processes write here:
 *   • the gateway calls notifyLocation()/notifyAlarm()/notifyTerminalStatus()
 *     after committing telemetry to Postgres
 *   • the backend Express process calls them too when it needs to push UI
 *     events (e.g. an admin force-disconnects a terminal)
 *
 * The matching listener lives in `./listener.ts` (backend process only) and
 * forwards events to subscribed WebSocket clients.
 *
 * Channel: `gps_event`
 * Payload: JSON, with a discriminating `type` field.
 *
 * IMPORTANT: pg_notify silently truncates payloads >8000 bytes. We keep events
 * tiny (no full row dumps) and rely on the listener to refetch from Prisma
 * when more detail is needed.
 */

import prisma from '../config/db';
import logger from '../utils/logger';

export type GpsEvent =
  | LocationUpdateEvent
  | TerminalStatusEvent
  | AlarmEvent
  | DtcEvent
  | TripEvent;

export interface LocationUpdateEvent {
  type: 'location.update';
  terminalId: string;
  ownerUserId: string | null;
  data: {
    /** ISO 8601 UTC timestamp. */
    reportedAt: string;
    latitude: number;
    longitude: number;
    speedKmh: number;
    heading: number;
    altitudeM: number;
    accOn: boolean;
    gpsFix: boolean;
    /** Raw alarmBits — clients render badges based on which bits are set. */
    alarmBits: number;
    statusBits: number;
  };
}

export interface TerminalStatusEvent {
  type: 'terminal.online' | 'terminal.offline';
  terminalId: string;
  ownerUserId: string | null;
  /** ISO 8601 UTC. */
  at: string;
}

/**
 * LOW #4: alarm WS event shape.
 *
 * Note the asymmetry with REST responses (see
 * `src/services/gps-alarm.service.ts:serializeAlarm` JSDoc): REST sends
 * BOTH `type` and `alarmType` on alarm rows for legacy-client back-compat,
 * but the WS path emits ONLY `alarmType`. The `type` field on this
 * interface is the **event** discriminator (`alarm.opened` | …), NOT the
 * GpsAlarmType enum. A WS consumer that wants the alarm category MUST
 * read `alarmType`.
 */
export interface AlarmEvent {
  /**
   * Event discriminator — distinguishes opened / closed / acknowledged.
   * Do NOT confuse this with the GpsAlarmType (use `alarmType` for that).
   */
  type: 'alarm.opened' | 'alarm.closed' | 'alarm.acknowledged';
  terminalId: string;
  ownerUserId: string | null;
  alarmId: string;
  /** Canonical GpsAlarmType value (e.g. "OVERSPEED", "FATIGUE_DRIVING"). */
  alarmType: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  at: string;
}

export interface DtcEvent {
  type: 'dtc.detected';
  terminalId: string;
  ownerUserId: string | null;
  dtcEventId: string;
  dtcCount: number;
  vin: string | null;
  at: string;
}

export interface TripEvent {
  type: 'trip.opened' | 'trip.closed';
  terminalId: string;
  ownerUserId: string | null;
  tripId: string;
  at: string;
}

/**
 * Emit a Postgres NOTIFY on the `gps_event` channel.
 *
 * Errors here NEVER bubble up — telemetry must commit even if NOTIFY fails
 * (admin clients just miss a real-time update; refresh recovers).
 */
export async function emit(event: GpsEvent): Promise<void> {
  try {
    const payload = JSON.stringify(event);
    if (payload.length > 7900) {
      // Hard guard. We don't ship payloads remotely close to this — log if
      // we ever do, since silent truncation breaks JSON.parse on the listener.
      logger.warn('pg_notify payload too large; dropping', {
        type: event.type,
        bytes: payload.length,
      });
      return;
    }
    // pg_notify(text, text). Use raw query so Prisma doesn't try to escape
    // the channel name as an identifier.
    await prisma.$queryRaw`SELECT pg_notify('gps_event', ${payload}::text)`;
  } catch (err) {
    logger.warn('pg_notify failed (non-fatal)', {
      err: (err as Error).message,
      type: event.type,
    });
  }
}
