/**
 * push.service — FCM / APNs delivery for mobile clients.
 *
 * Wired in two places:
 *   1. `gps-alarm-bridge.service.maybeSendCriticalAlarmPush()` — fan-out for
 *      CRITICAL alarms (deduped via GpsAlarmPushDedup, throttled per user).
 *   2. `gps.controller.myRegisterPushToken / myDeletePushToken` — token
 *      lifecycle endpoints owned by the mobile auth context.
 *
 * Design:
 *   • Lazy-init `firebase-admin` so dev/test boots don't need credentials.
 *     `FCM_ENABLED=false` → all sends become no-ops with a debug log line.
 *   • Service-account JSON is provided as a single base64-encoded env var
 *     (`FCM_SERVICE_ACCOUNT_JSON`) to avoid line-break headaches in `.env`.
 *   • Failures NEVER bubble — alarm persistence and the bridge service must
 *     never depend on Google's availability. Errors are logged + swallowed.
 *   • In-memory throttle (per-user, per 5-minute window) caps abuse.
 *     Restart-resets-the-counter is acceptable: alarm storms are short.
 *   • Tokens that FCM tells us are dead (`registration-token-not-registered`,
 *     `invalid-argument`) get soft-disabled in Postgres so the next send
 *     skips them automatically.
 */

import prisma from '../config/db';
import logger from '../utils/logger';
import { env } from '../config/env';
import type { GpsAlarm, GpsTerminal } from '@prisma/client';

// firebase-admin is required lazily so an unconfigured dev env doesn't crash
// the process at import time. Type-only import keeps the bundler honest.
import type { app as adminApp, messaging } from 'firebase-admin';

let firebaseApp: adminApp.App | null = null;
let firebaseInitTried = false;

/**
 * Idempotent init. Returns the messaging instance or null if FCM is disabled
 * / mis-configured. Subsequent calls reuse the cached app.
 */
function getMessaging(): messaging.Messaging | null {
  if (!env.FCM_ENABLED) return null;
  if (firebaseApp) {
    // Late import is fine — by the time getMessaging() is called the
    // process has long since loaded modules.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const admin = require('firebase-admin') as typeof import('firebase-admin');
    return admin.messaging(firebaseApp);
  }
  if (firebaseInitTried) return null; // failed once, don't retry every send

  firebaseInitTried = true;
  if (!env.FCM_SERVICE_ACCOUNT_JSON) {
    logger.warn(
      'FCM_ENABLED=true but FCM_SERVICE_ACCOUNT_JSON is empty; push disabled',
    );
    return null;
  }

  try {
    // Decode base64 → JSON. We accept raw JSON too in case the operator
    // forgot to encode it; trying base64 first is cheap.
    const raw = env.FCM_SERVICE_ACCOUNT_JSON;
    let json: string;
    try {
      json = Buffer.from(raw, 'base64').toString('utf8');
      // If it doesn't smell like JSON, fall through to raw.
      if (!json.trim().startsWith('{')) json = raw;
    } catch {
      json = raw;
    }
    const serviceAccount = JSON.parse(json);

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const admin = require('firebase-admin') as typeof import('firebase-admin');
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    logger.info('Firebase Admin initialised for FCM push', {
      projectId: serviceAccount.project_id,
    });
    return admin.messaging(firebaseApp);
  } catch (err) {
    logger.error('Failed to initialise Firebase Admin for FCM', {
      err: (err as Error).message,
    });
    return null;
  }
}

// ── Per-user throttle ───────────────────────────────────────────────────────

interface Bucket {
  /** Unix-ms timestamps of recent pushes; older than 5min are pruned lazily. */
  events: number[];
}

const FIVE_MIN_MS = 5 * 60 * 1000;
const buckets = new Map<string, Bucket>();

/**
 * Returns true if `userId` is under the per-5-min cap. As a side effect
 * records the event so the next call sees it.
 *
 * HIGH #15: when a bucket prunes down to zero events we delete the entry
 * entirely so the Map doesn't grow monotonically with the active-user set
 * over the process lifetime. Long-running pods that touch every user once
 * a day used to accumulate empty buckets indefinitely.
 */
function admitForThrottle(userId: string): boolean {
  const now = Date.now();
  const cap = env.FCM_PUSH_THROTTLE_PER_USER_PER_5MIN;
  let bucket = buckets.get(userId);
  if (!bucket) {
    bucket = { events: [] };
    buckets.set(userId, bucket);
  }
  // Drop entries older than 5 min.
  bucket.events = bucket.events.filter((t) => now - t < FIVE_MIN_MS);
  if (bucket.events.length >= cap) {
    // Don't delete here even if zero — caller is being rate-limited,
    // bucket may grow back next millisecond.
    return false;
  }
  bucket.events.push(now);
  // The cleanup pass runs only when we *would* admit; if the bucket is
  // now near-empty AND we just hit the cap floor, no special action is
  // needed because we just appended one event.
  return true;
}

/**
 * Periodically prune fully-empty buckets. Runs once a minute; cheap (M map
 * iterations where M is the number of recently-active users).
 */
const BUCKET_GC_MS = 60_000;
setInterval(() => {
  const now = Date.now();
  for (const [userId, bucket] of buckets) {
    bucket.events = bucket.events.filter((t) => now - t < FIVE_MIN_MS);
    if (bucket.events.length === 0) buckets.delete(userId);
  }
}, BUCKET_GC_MS).unref();

// ── Public API ──────────────────────────────────────────────────────────────

interface CriticalAlarmPushInput {
  userId: string;
  alarm: GpsAlarm;
  terminal: GpsTerminal;
}

/**
 * Build a short, human-readable title from an alarm row. Mirrors the labels
 * the mobile app shows, so the tray notification + in-app banner read the
 * same. Keep <= 60 chars to fit notification UIs.
 */
function buildTitle(alarm: GpsAlarm, terminal: GpsTerminal): string {
  const vehicle =
    terminal.nickname ||
    [terminal.vehicleYear, terminal.vehicleMake, terminal.vehicleModel]
      .filter(Boolean)
      .join(' ') ||
    'your vehicle';
  switch (alarm.type) {
    case 'COLLISION':
      return `Collision detected on ${vehicle}`;
    case 'ROLLOVER':
      return `Rollover detected on ${vehicle}`;
    case 'TOW':
      return `Possible tow / theft on ${vehicle}`;
    case 'POWER_LOST':
      return `GPS device unplugged on ${vehicle}`;
    case 'SOS':
      return `SOS triggered on ${vehicle}`;
    case 'DTC_DETECTED':
    case 'MIL_ON':
      return `Critical engine fault on ${vehicle}`;
    default:
      return `Critical alert on ${vehicle}`;
  }
}

/**
 * Send a CRITICAL-alarm push to all of `userId`'s active devices. Caller
 * must have already passed the dedup CAS (GpsAlarmPushDedup); we don't
 * re-check here so a manual "resend" tool can bypass it if needed.
 *
 * Returns the count of tokens we actually attempted to deliver to (post
 * throttle + post token-fetch). Mostly useful for tests.
 */
export async function sendCriticalAlarmPush(
  input: CriticalAlarmPushInput,
): Promise<number> {
  const { userId, alarm, terminal } = input;

  if (!admitForThrottle(userId)) {
    logger.warn('Push throttled for user; skipping', {
      userId,
      alarmId: alarm.id,
      cap: env.FCM_PUSH_THROTTLE_PER_USER_PER_5MIN,
    });
    return 0;
  }

  const tokens = await prisma.mobilePushToken.findMany({
    where: { userId, disabledAt: null },
    select: { id: true, token: true, platform: true },
  });
  if (tokens.length === 0) {
    logger.info('No active push tokens for user; skipping', {
      userId,
      alarmId: alarm.id,
    });
    return 0;
  }

  const messaging = getMessaging();
  if (!messaging) {
    logger.debug('FCM disabled or not initialised; skipping send', {
      userId,
      alarmId: alarm.id,
      tokenCount: tokens.length,
    });
    return 0;
  }

  const title = buildTitle(alarm, terminal);
  const body =
    alarm.severity === 'CRITICAL'
      ? `Severity: CRITICAL · ${new Date(alarm.openedAt).toLocaleTimeString()}`
      : `Severity: ${alarm.severity}`;

  // Data-only fields are coerced to strings by FCM regardless of source type
  // — keep them stringly-typed here so the mobile receiver doesn't have to
  // guess.
  const data: Record<string, string> = {
    type: 'alarm',
    alarmId: alarm.id,
    terminalId: terminal.id,
    severity: alarm.severity,
    alarmType: String(alarm.type),
    openedAt: alarm.openedAt.toISOString(),
  };

  try {
    const response = await messaging.sendEachForMulticast({
      tokens: tokens.map((t) => t.token),
      notification: { title, body },
      data,
      android: {
        priority: 'high',
        notification: {
          channelId: 'critical-alarms',
          sound: 'default',
          // Tap → mobile reads `data.alarmId` and routes to AlertDetail.
          clickAction: 'OPEN_ALARM',
        },
      },
      apns: {
        headers: { 'apns-priority': '10' },
        payload: {
          aps: {
            alert: { title, body },
            sound: 'default',
            badge: 1,
          },
        },
      },
    });

    // Cleanup: any token FCM rejects with "not-registered" or
    // "invalid-argument" gets soft-disabled so we don't keep retrying.
    const dead: string[] = [];
    response.responses.forEach((r, idx) => {
      if (r.success) return;
      const code = r.error?.code ?? '';
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-argument' ||
        code === 'messaging/invalid-registration-token'
      ) {
        dead.push(tokens[idx]!.id);
      } else {
        logger.warn('FCM send failed for token (non-fatal)', {
          tokenId: tokens[idx]!.id,
          code,
          err: r.error?.message,
        });
      }
    });

    if (dead.length > 0) {
      await prisma.mobilePushToken.updateMany({
        where: { id: { in: dead } },
        data: { disabledAt: new Date() },
      });
      logger.info('Soft-disabled dead push tokens', {
        userId,
        count: dead.length,
      });
    }

    logger.info('CRITICAL alarm push dispatched', {
      userId,
      alarmId: alarm.id,
      attempted: tokens.length,
      success: response.successCount,
      failure: response.failureCount,
    });
    return tokens.length;
  } catch (err) {
    // Never let push failures bubble — the alarm row is the source of truth.
    logger.error('FCM multicast send threw (non-fatal)', {
      userId,
      alarmId: alarm.id,
      err: (err as Error).message,
    });
    return 0;
  }
}

// ── Token lifecycle (REST endpoints) ────────────────────────────────────────

interface RegisterTokenInput {
  userId: string;
  platform: 'ios' | 'android';
  token: string;
  appVersion?: string;
}

/**
 * Idempotent upsert. If the token already exists under a different user
 * (device handed off, or FCM rotated the same token between accounts) we
 * re-point it to the new userId and clear `disabledAt`.
 */
export async function registerPushToken(input: RegisterTokenInput) {
  const { userId, platform, token, appVersion } = input;
  const row = await prisma.mobilePushToken.upsert({
    where: { token },
    create: {
      userId,
      platform,
      token,
      appVersion: appVersion ?? null,
    },
    update: {
      userId,
      platform,
      appVersion: appVersion ?? undefined,
      lastSeenAt: new Date(),
      disabledAt: null,
    },
  });
  logger.info('Mobile push token registered', {
    userId,
    platform,
    tokenId: row.id,
  });
  return row;
}

/**
 * Soft-disable a token (typically called on logout). Returns true if a row
 * was actually updated; false if the token wasn't on file (already gone).
 */
export async function disablePushToken(input: {
  userId: string;
  token: string;
}): Promise<boolean> {
  const result = await prisma.mobilePushToken.updateMany({
    where: { token: input.token, userId: input.userId, disabledAt: null },
    data: { disabledAt: new Date() },
  });
  return result.count > 0;
}
