/**
 * @format
 */

// Polyfill Buffer for React Native (required for BLE base64 operations)
import { Buffer } from 'buffer';
global.Buffer = Buffer;

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// ── FCM background message handler ──────────────────────────────────────────
// Must be registered here (the app entry file) BEFORE AppRegistry.
// When the app is in the background or killed, FCM delivers notification-only
// messages automatically via the OS. Data-only messages (or foreground
// overrides) come here. We only act on CRITICAL GPS/OBD alarms — everything
// else is a no-op because location updates must not produce in-app alerts.
//
// Note: `messaging().setBackgroundMessageHandler` is a synchronous call that
// registers a callback; the actual handler runs asynchronously on a headless
// JS task when a message arrives in the background.
//
// Wrapped in try-catch so that any Firebase initialisation failure (e.g. a
// misconfigured native build) does NOT prevent AppRegistry.registerComponent
// from being called — which would leave the app with a blank white screen.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const messaging = require('@react-native-firebase/messaging').default;

  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    const data = remoteMessage?.data ?? {};
    const severity = data.severity;
    const alarmId = data.alarmId;
    const terminalId = data.terminalId;
    const alarmType = data.alarmType;

    if (severity !== 'CRITICAL') {
      // Non-critical background messages are intentionally ignored.
      return;
    }

    // Log to console only (logger singleton is not available in headless JS
    // context — module state is isolated from the foreground JS bundle).
    console.info(
      '[Push][BG] CRITICAL alarm received',
      JSON.stringify({ alarmId, terminalId, alarmType, severity }),
    );

    // The OS notification (title + body) is already displayed by FCM from
    // the `notification` block the backend sends. No additional action needed
    // here — when the user taps the notification, `onNotificationOpenedApp`
    // or `getInitialNotification` in PushService handles the deep-link.
  });
} catch (e) {
  console.warn('[Push][BG] Failed to register background message handler', e);
}

AppRegistry.registerComponent(appName, () => App);
