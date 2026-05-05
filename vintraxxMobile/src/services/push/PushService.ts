// Push notification service — FCM/APNs lifecycle for the mobile client.
//
// Responsibilities:
//   • Request OS-level notification permissions (iOS opt-in; Android 13+ also
//     prompts).
//   • Fetch the current FCM device token + register it with the backend
//     (`POST /api/v1/gps/devices/push-token`).
//   • Listen for token refreshes and re-register.
//   • Foreground messages → in-app banner via `onForegroundAlarm` listeners
//     (UI registers handlers in `useEffect`).
//   • Tap-to-open routing: `onNotificationOpenedApp` + `getInitialNotification`
//     deep-link the user into AlertDetail using `data.alarmId`.
//   • On logout, unregister the token (soft-disable on backend).
//
// Firebase modules are imported lazily so the bundler doesn't choke during
// CI on machines without `google-services.json` configured. If init fails,
// the service degrades silently — the rest of the app still works.

import { Platform } from 'react-native';
import { logger, LogCategory } from '../../utils/Logger';
import { authService } from '../auth/AuthService';
import { gpsApi } from '../gps/GpsApiService';

/**
 * Lightweight shape we accept from foreground/data-only messages. Matches
 * `pushService.sendCriticalAlarmPush` on the backend (`data.alarmId`,
 * `data.terminalId`, `data.severity`, `data.alarmType`, `data.openedAt`).
 */
export interface PushAlarmPayload {
  alarmId?: string;
  terminalId?: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  alarmType?: string;
  openedAt?: string;
  /** Notification title set by the backend; useful for in-app banners. */
  title?: string;
  /** Notification body set by the backend. */
  body?: string;
}

type ForegroundHandler = (payload: PushAlarmPayload) => void;
type DeepLinkHandler = (alarmId: string, terminalId?: string) => void;

class PushService {
  private static instance: PushService;
  private currentToken: string | null = null;
  private foregroundHandlers = new Set<ForegroundHandler>();
  private deepLinkHandlers = new Set<DeepLinkHandler>();
  private unsubscribeFns: Array<() => void> = [];
  private initialised = false;

  static getInstance(): PushService {
    if (!PushService.instance) PushService.instance = new PushService();
    return PushService.instance;
  }

  /**
   * Initialise the service. Idempotent — safe to call from multiple places
   * (e.g. on every login). Only the first call wires up listeners; later
   * calls just refresh the token registration.
   */
  async initialise(): Promise<void> {
    try {
      if (!authService.isAuthenticated()) {
        logger.debug(LogCategory.PUSH, '[Push] Not authenticated; skipping init');
        return;
      }

      const messaging = await this.loadMessaging();
      if (!messaging) return;

      // Permissions: iOS shows a system prompt; Android <13 is implicit;
      // Android 13+ shows POST_NOTIFICATIONS prompt.
      try {
        const status = await messaging.requestPermission();
        // 1 = AUTHORIZED, 2 = PROVISIONAL on iOS; on Android any non-zero
        // value means the user accepted (or it's auto-granted).
        const granted = status === 1 || status === 2;
        if (!granted) {
          logger.warn(LogCategory.PUSH, '[Push] Permission denied', { status });
          return;
        }
      } catch (err) {
        logger.warn(LogCategory.PUSH, '[Push] requestPermission failed', err);
      }

      // Fetch token + register. On iOS we also wait for the APNs token to
      // appear so FCM can wrap it — `getToken` blocks until that's ready.
      let token: string | null = null;
      try {
        token = await messaging.getToken();
      } catch (err) {
        logger.error(LogCategory.PUSH, '[Push] getToken failed', err);
        return;
      }
      if (!token) return;
      await this.registerToken(token);

      // Wire listeners only once.
      if (!this.initialised) {
        this.initialised = true;
        this.attachListeners(messaging);
      }
    } catch (err) {
      logger.error(LogCategory.PUSH, '[Push] initialise threw', err);
    }
  }

  /**
   * Soft-disable the current token on the backend (logout flow). Safe to
   * call when nothing is registered — backend returns success either way.
   */
  async unregisterCurrent(): Promise<void> {
    if (!this.currentToken) return;
    try {
      await gpsApi.unregisterPushToken(this.currentToken);
    } catch (err) {
      // Backend cleanup is best-effort. The token will eventually expire on
      // FCM's side anyway.
      logger.warn(LogCategory.PUSH, '[Push] unregister failed (non-fatal)', err);
    }
    this.currentToken = null;
  }

  /** Tear down listeners (only used in tests / during teardown). */
  shutdown(): void {
    for (const fn of this.unsubscribeFns) {
      try {
        fn();
      } catch {
        /* ignore */
      }
    }
    this.unsubscribeFns = [];
    this.initialised = false;
  }

  // ── UI hooks ────────────────────────────────────────────────────────────

  /** Listen for foreground push alarms (in-app banner / toast). */
  onForegroundAlarm(handler: ForegroundHandler): () => void {
    this.foregroundHandlers.add(handler);
    return () => this.foregroundHandlers.delete(handler);
  }

  /** Listen for tap-to-open events (deep-link to AlertDetail). */
  onDeepLink(handler: DeepLinkHandler): () => void {
    this.deepLinkHandlers.add(handler);
    return () => this.deepLinkHandlers.delete(handler);
  }

  // ── Internals ───────────────────────────────────────────────────────────

  /**
   * Lazy-load `@react-native-firebase/messaging`. Returns the messaging()
   * instance or null if the module isn't installed / can't init.
   */
  private async loadMessaging(): Promise<any | null> {
    try {
      // Dynamic require so a CI env without google-services.json can still
      // bundle. The module is required at runtime when the user logs in.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('@react-native-firebase/messaging');
      const messaging = mod.default ? mod.default() : mod();
      return messaging;
    } catch (err) {
      logger.warn(LogCategory.PUSH, '[Push] Firebase messaging unavailable', err);
      return null;
    }
  }

  private async registerToken(token: string): Promise<void> {
    if (token === this.currentToken) return;
    this.currentToken = token;
    const platform: 'ios' | 'android' =
      Platform.OS === 'ios' ? 'ios' : 'android';
    const result = await gpsApi.registerPushToken({
      platform,
      token,
      provider: 'fcm',
      // App version is best-effort: read from a `react-native-version-info`
      // helper if the host has it, otherwise omit. We deliberately don't
      // hard-require it.
      appVersion: undefined,
    });
    if (result.success) {
      logger.info(LogCategory.PUSH, '[Push] Token registered', {
        platform,
        provider: 'fcm',
        tokenPrefix: token.slice(0, 12) + '…',
      });
    } else {
      logger.warn(LogCategory.PUSH, '[Push] Token registration failed', {
        message: result.message,
      });
    }
  }

  private attachListeners(messaging: any): void {
    // Token refresh — FCM rotates tokens on app reinstall, data wipe, etc.
    const offRefresh = messaging.onTokenRefresh(async (token: string) => {
      logger.info(LogCategory.PUSH, '[Push] Token refreshed');
      await this.registerToken(token);
    });
    this.unsubscribeFns.push(offRefresh);

    // Foreground message — fire UI handlers ONLY for CRITICAL alarms.
    // Non-critical location updates and INFO/WARNING alarms are logged at
    // DEBUG level and discarded; they must not produce in-app banners.
    const offMessage = messaging.onMessage(async (msg: any) => {
      const payload = this.extractPayload(msg);
      if (payload.severity !== 'CRITICAL') {
        logger.debug(LogCategory.PUSH, '[Push] Foreground message ignored (non-critical)', {
          alarmId: payload.alarmId,
          severity: payload.severity,
        });
        return;
      }
      logger.info(LogCategory.PUSH, '[Push] Foreground CRITICAL alarm', {
        alarmId: payload.alarmId,
        alarmType: payload.alarmType,
        terminalId: payload.terminalId,
      });
      for (const fn of this.foregroundHandlers) {
        try {
          fn(payload);
        } catch (err) {
          logger.warn(LogCategory.PUSH, '[Push] foreground handler threw', err);
        }
      }
    });
    this.unsubscribeFns.push(offMessage);

    // User tapped a notification while the app was backgrounded.
    // Only CRITICAL alarms produce tap-able notifications (backend guards
    // this at send time), but we guard again here for safety.
    const offOpened = messaging.onNotificationOpenedApp((msg: any) => {
      const payload = this.extractPayload(msg);
      if (payload.severity !== 'CRITICAL') {
        logger.debug(LogCategory.PUSH, '[Push] onNotificationOpenedApp ignored (non-critical)', {
          severity: payload.severity,
        });
        return;
      }
      this.deliverDeepLink(payload);
    });
    this.unsubscribeFns.push(offOpened);

    // App was launched from a quit state via a notification tap.
    messaging
      .getInitialNotification()
      .then((msg: any) => {
        if (!msg) return;
        const payload = this.extractPayload(msg);
        if (payload.severity !== 'CRITICAL') {
          logger.debug(LogCategory.PUSH, '[Push] getInitialNotification ignored (non-critical)', {
            severity: payload.severity,
          });
          return;
        }
        logger.info(LogCategory.PUSH, '[Push] App launched from notification tap', {
          alarmId: payload.alarmId,
          terminalId: payload.terminalId,
        });
        this.deliverDeepLink(payload);
      })
      .catch(() => {
        /* ignore */
      });
  }

  private deliverDeepLink(payload: PushAlarmPayload): void {
    if (!payload.alarmId) return;
    logger.info(LogCategory.PUSH, '[Push] Deep-link tap', {
      alarmId: payload.alarmId,
      terminalId: payload.terminalId,
    });
    for (const fn of this.deepLinkHandlers) {
      try {
        fn(payload.alarmId, payload.terminalId);
      } catch (err) {
        logger.warn(LogCategory.PUSH, '[Push] deep-link handler threw', err);
      }
    }
  }

  private extractPayload(msg: any): PushAlarmPayload {
    const data = (msg?.data ?? {}) as Record<string, string>;
    const notif = msg?.notification ?? {};
    return {
      alarmId: data.alarmId,
      terminalId: data.terminalId,
      severity: data.severity as PushAlarmPayload['severity'],
      alarmType: data.alarmType,
      openedAt: data.openedAt,
      title: notif.title,
      body: notif.body,
    };
  }
}

export const pushService = PushService.getInstance();
