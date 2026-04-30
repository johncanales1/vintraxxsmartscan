/**
 * alarm-diff — translates raw 32-bit alarmFlag transitions into typed alarm
 * events.
 *
 * Driver model:
 *   • The gateway tracks `lastAlarmBits` per terminal (denormalized onto
 *     GpsTerminal so each location report is one read + one update).
 *   • Each incoming 0x0200 carries a fresh `alarmBits`.
 *   • Bits that flipped 0→1 are NEW alarms — open a GpsAlarm row.
 *   • Bits that flipped 1→0 are CLEARED — close any matching open row.
 *
 * The same logic runs for batch (0x0704) reports — the gateway compares the
 * LATEST entry against `lastAlarmBits` and ignores intermediate flapping
 * inside the batch (back-fills from blind-area dumps shouldn't generate a
 * stutter of open/close pairs in the alarm table).
 *
 * Bit→AlarmType mapping uses ALARM_BITS from m0200-location.ts as the source
 * of truth for which bit is which.
 */

import { GpsAlarmSeverity, GpsAlarmType } from '@prisma/client';
import { ALARM_BITS } from '../codec/messages/m0200-location';

interface AlarmDescriptor {
  bit: number;
  type: GpsAlarmType;
  severity: GpsAlarmSeverity;
}

/**
 * Single source of truth for which JT/T 808 alarm bit corresponds to which
 * domain-level GpsAlarmType + severity. Bits not listed here are ignored —
 * the device may still set them and we keep the raw value on GpsLocation,
 * but we don't promote them to alarm rows.
 *
 * Severity choices follow operations practice:
 *   • CRITICAL: anything that demands an immediate human follow-up
 *     (collision, rollover, SOS, vehicle theft, fuel theft).
 *   • WARNING:  driving-policy violations and component faults the user
 *     should know about but that don't necessarily mean an outage.
 *   • INFO:     informational/redundant warnings that the device fires
 *     alongside their CRITICAL twin (e.g. OVERSPEED_WARN vs OVERSPEED).
 */
export const ALARM_DESCRIPTORS: readonly AlarmDescriptor[] = [
  { bit: ALARM_BITS.SOS,                     type: 'SOS',                severity: 'CRITICAL' },
  { bit: ALARM_BITS.OVERSPEED,               type: 'OVERSPEED',          severity: 'WARNING'  },
  { bit: ALARM_BITS.FATIGUE,                 type: 'FATIGUE',            severity: 'WARNING'  },
  { bit: ALARM_BITS.GNSS_ANTENNA_DISCONNECT, type: 'ANTENNA_DISCONNECT', severity: 'WARNING'  },
  { bit: ALARM_BITS.GNSS_ANTENNA_SHORT,      type: 'ANTENNA_DISCONNECT', severity: 'WARNING'  },
  { bit: ALARM_BITS.POWER_LOW_VOLT,          type: 'POWER_LOW_VOLT',     severity: 'WARNING'  },
  { bit: ALARM_BITS.POWER_CUT,               type: 'POWER_LOST',         severity: 'CRITICAL' },
  { bit: ALARM_BITS.OVERSPEED_WARN,          type: 'OVERSPEED',          severity: 'INFO'     },
  { bit: ALARM_BITS.FATIGUE_WARN,            type: 'FATIGUE',            severity: 'INFO'     },
  { bit: ALARM_BITS.ROUTE_VIOLATION,         type: 'OTHER',              severity: 'WARNING'  },
  { bit: ALARM_BITS.ZONE_VIOLATION,          type: 'GEOFENCE_OUT',       severity: 'WARNING'  },
  { bit: ALARM_BITS.ROUTE_DEVIATION,         type: 'OTHER',              severity: 'WARNING'  },
  { bit: ALARM_BITS.FUEL_ABNORMAL,           type: 'OTHER',              severity: 'WARNING'  },
  { bit: ALARM_BITS.VEHICLE_THEFT,           type: 'TOW',                severity: 'CRITICAL' },
  { bit: ALARM_BITS.ILLEGAL_IGNITION,        type: 'OTHER',              severity: 'CRITICAL' },
  { bit: ALARM_BITS.ILLEGAL_DISPLACEMENT,    type: 'TOW',                severity: 'CRITICAL' },
  { bit: ALARM_BITS.COLLISION_WARNING,       type: 'COLLISION',          severity: 'CRITICAL' },
  { bit: ALARM_BITS.ROLLOVER_WARNING,        type: 'ROLLOVER',           severity: 'CRITICAL' },
  { bit: ALARM_BITS.ILLEGAL_DOOR_OPEN,       type: 'OTHER',              severity: 'WARNING'  },
];

export interface AlarmTransitions {
  /** Descriptors whose bit went 0→1 in this report. */
  opened: AlarmDescriptor[];
  /** Descriptors whose bit went 1→0 in this report. */
  closed: AlarmDescriptor[];
}

/**
 * Compute opened/closed alarm descriptors given previous and current alarm
 * bit-fields. Bit-fields are passed as `number` (the codec returns 32-bit
 * uints already coerced via `>>> 0`); we widen to bigint internally to avoid
 * sign issues on bit 31, since JS bitwise ops are signed-32.
 *
 * Pure function — no I/O, no Prisma. Easy to unit-test.
 */
export function diffAlarms(prevBits: number | bigint, currentBits: number | bigint): AlarmTransitions {
  const prev = typeof prevBits === 'bigint' ? prevBits : BigInt(prevBits >>> 0);
  const curr = typeof currentBits === 'bigint' ? currentBits : BigInt(currentBits >>> 0);

  const newlyOn = curr & ~prev;   // bit set in curr but not in prev
  const newlyOff = prev & ~curr;  // bit set in prev but not in curr

  const opened: AlarmDescriptor[] = [];
  const closed: AlarmDescriptor[] = [];

  for (const desc of ALARM_DESCRIPTORS) {
    const mask = BigInt(desc.bit);
    if ((newlyOn & mask) !== 0n) opened.push(desc);
    if ((newlyOff & mask) !== 0n) closed.push(desc);
  }

  return { opened, closed };
}
