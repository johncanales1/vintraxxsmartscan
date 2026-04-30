/**
 * cron/index.ts — single bootstrap that schedules every recurring backend job.
 *
 * Currently only the heartbeat watchdog. Future Phase 1 work (location
 * retention pruning) and Phase 3 (nightly trip rollups) live alongside.
 *
 * Why we put the cron in the BACKEND process (and not the gateway):
 *   • The gateway is mostly idle most of the time, but when it ISN'T (a fleet
 *     of 5k devices each sending every 30s) we don't want a cron job stealing
 *     that event loop tick.
 *   • Crons need DB write access only — no protocol state. Backend has it.
 *   • Single-process scope matches our deploy: only one Express instance at
 *     a time, so node-cron doesn't double-fire.
 */

import cron from 'node-cron';
import logger from '../utils/logger';
import { runHeartbeatWatchdog } from './heartbeatWatchdog';
import { closeStaleOpenTrips } from '../services/gps-trip.service';
import { runDailyRollupForYesterday } from '../services/gps-daily-rollup.service';
import {
  timeoutSentCommands,
  expireStaleQueuedCommands,
} from '../services/gps-command.service';
import { runOtpCleanup, runPasswordResetCleanup } from './authCleanup';

// 60 s — slightly longer than the gateway's per-command 30 s timeout to act
// as a safety net for commands the gateway picked up but crashed before
// resolving.
const COMMAND_SENT_TIMEOUT_MS = 60_000;

// 1 hour — QUEUED commands whose terminal never came online get expired.
// Operators can re-issue manually if they still want the action.
const COMMAND_QUEUE_MAX_MS = 60 * 60_000;

const tasks: cron.ScheduledTask[] = [];

export function startCronJobs(): void {
  // Every minute: scan for silent terminals and flip them OFFLINE.
  tasks.push(
    cron.schedule('* * * * *', () => {
      void runHeartbeatWatchdog().catch((err) => {
        logger.error('heartbeatWatchdog crashed', {
          err: (err as Error).message,
          stack: (err as Error).stack,
        });
      });
    }),
  );

  // Every 5 minutes: close OPEN trips whose terminal has gone silent past
  // IDLE_CLOSE_MS. Cleans up trips for vehicles that lost their uplink
  // (parked underground, device unplugged) so daily rollups don't see
  // never-ending trips.
  tasks.push(
    cron.schedule('*/5 * * * *', () => {
      void closeStaleOpenTrips().catch((err) => {
        logger.error('closeStaleOpenTrips crashed', {
          err: (err as Error).message,
          stack: (err as Error).stack,
        });
      });
    }),
  );

  // 00:15 UTC every day: aggregate yesterday into GpsTerminalDailyStats. We
  // pick :15 (not :00) so that any trips that closed at 23:59:30 yesterday
  // have time to be persisted by their TCP retry, before we read them.
  tasks.push(
    cron.schedule('15 0 * * *', () => {
      void runDailyRollupForYesterday().catch((err) => {
        logger.error('runDailyRollupForYesterday crashed', {
          err: (err as Error).message,
          stack: (err as Error).stack,
        });
      });
    }, { timezone: 'UTC' }),
  );

  // Every minute: timeout SENT commands that haven't been ACKED. Belt &
  // braces — the gateway has its own per-command timer; this catches rows
  // orphaned by gateway crashes.
  //
  // LOW #3: staggered to fire at :30 of every minute (6-field cron syntax,
  // supported by node-cron) so it doesn't overlap with the heartbeat
  // watchdog above (which runs at :00). Different tables, but separating
  // them keeps the log timeline readable and avoids contending for the
  // same DB connection slot every minute on the dot.
  tasks.push(
    cron.schedule('30 * * * * *', () => {
      void timeoutSentCommands(COMMAND_SENT_TIMEOUT_MS).catch((err) => {
        logger.error('timeoutSentCommands crashed', {
          err: (err as Error).message,
        });
      });
    }),
  );

  // Every 15 minutes: expire QUEUED commands whose terminal never came
  // online within COMMAND_QUEUE_MAX_MS.
  tasks.push(
    cron.schedule('*/15 * * * *', () => {
      void expireStaleQueuedCommands(COMMAND_QUEUE_MAX_MS).catch((err) => {
        logger.error('expireStaleQueuedCommands crashed', {
          err: (err as Error).message,
        });
      });
    }),
  );

  // MEDIUM #23: 03:30 UTC every day — prune expired OTPs and used /
  // long-expired PasswordResetToken rows. Both functions return the deleted
  // count and log non-zero deletions; misconfiguration / DB issues never
  // crash the process (caught here).
  tasks.push(
    cron.schedule(
      '30 3 * * *',
      () => {
        void runOtpCleanup().catch((err) => {
          logger.error('runOtpCleanup crashed', {
            err: (err as Error).message,
          });
        });
        void runPasswordResetCleanup().catch((err) => {
          logger.error('runPasswordResetCleanup crashed', {
            err: (err as Error).message,
          });
        });
      },
      { timezone: 'UTC' },
    ),
  );

  logger.info('Cron jobs scheduled', { count: tasks.length });
}

export function stopCronJobs(): void {
  for (const t of tasks) {
    try {
      t.stop();
    } catch (err) {
      logger.warn('Failed to stop cron task', { err: (err as Error).message });
    }
  }
  tasks.length = 0;
}
