# Phase 5 — VinTraxx GPS Integration Runbook

This document is the canonical "how do I bring all this online" cheat-sheet.
Each step is idempotent and safe to re-run.

---

## 0. Prerequisites

- Node 20+
- pnpm or npm (the rest of the codebase uses npm; commands below use npm)
- Postgres 14+ reachable via the `DATABASE_URL` already configured for
  `vintraxxBackend`
- Firebase project with Cloud Messaging enabled (for push)
- React Native dev environment (Android Studio + Xcode) for `vintraxxMobile`

---

## 1. Backend

### 1.1 Install new dependencies

```powershell
cd d:\Work\vintraxxsmartscan\vintraxxBackend
npm install firebase-admin@^12
```

`firebase-admin` is the only new runtime dep. Everything else (zod,
prisma, express) is already in `package.json`.

### 1.2 Configure environment

Add the following to `.env` (or your secret manager). The variable names
match the schema in `vintraxxBackend/src/config/env.ts`:

```
# Master switch for mobile push. Off by default so dev environments don't
# try to authenticate with Google without credentials.
FCM_ENABLED=true

# Service-account JSON, base64-encoded.  We accept raw JSON too as a
# fallback for local dev:
#   PowerShell:  $env:FCM_SERVICE_ACCOUNT_JSON = \
#     [Convert]::ToBase64String([IO.File]::ReadAllBytes("./firebase-sa.json"))
FCM_SERVICE_ACCOUNT_JSON=<base64-encoded service account JSON>

# Optional: per-user, per-5-minute push budget. Default 10. The token-bucket
# is in-memory so a process restart resets it; that's acceptable for short
# alarm storms.
FCM_PUSH_THROTTLE_PER_USER_PER_5MIN=10

# Optional: WebSocket mount path. Default /ws.
# Mobile builds wss://<host><GPS_WS_PATH>?token=... so changing this here
# requires no mobile rebuild as long as the path stays under the same host.
GPS_WS_PATH=/ws
```

The Firebase service account must have the `cloudmessaging.messages.create`
permission. The simplest grant is the predefined `Firebase Admin SDK
Administrator Service Agent` role on the Firebase project.

### 1.3 Generate Prisma client + run migration

```powershell
cd d:\Work\vintraxxsmartscan\vintraxxBackend
npx prisma generate
npx prisma migrate dev --name phase5_gps_mobile
```

This creates two new tables:

- `MobilePushToken` — one row per device-token (token is globally unique
  because FCM can rotate the same token between users on a shared device).
  Soft-disable is recorded in `disabledAt`; the row is preserved for
  analytics rather than hard-deleted.
- `GpsAlarmPushDedup` — exactly-once guard for push fan-out, keyed by the
  unique `alarmId` column. The bridge service uses a CAS insert
  (`prisma.gpsAlarmPushDedup.create`) — a P2002 unique-violation tells us
  another worker already sent the push.

The migration also adds `lastAlarmBits BigInt` to `GpsTerminal` and a
`userId` column to `GpsCommand` for owner-issued (locate) commands.

If you've already run a migration with this name, regenerate it under
a new name:

```powershell
npx prisma migrate dev --name phase5_gps_mobile_v2
```

### 1.4 Run tests

```powershell
cd d:\Work\vintraxxsmartscan\vintraxxBackend
npm test -- --runTestsByPath src/services/__tests__/push.service.test.ts
npm test -- --runTestsByPath src/services/__tests__/gps-alarm-bridge.service.test.ts
npm test -- --runTestsByPath src/routes/__tests__/gps-mobile.routes.test.ts
```

Expected outcome: all suites pass, no skipped tests.

### 1.5 Smoke-test the new routes

```powershell
# Replace <TOKEN> with a valid mobile JWT.
curl -X POST http://localhost:3000/api/v1/gps/devices/push-token `
  -H "Authorization: Bearer <TOKEN>" `
  -H "Content-Type: application/json" `
  -d '{"platform":"android","token":"test-fcm-token-of-at-least-10-chars"}'

# Should return 200 with { success: true }.

curl -X POST http://localhost:3000/api/v1/gps/dtc-events/<EVENT_ID>/analyze `
  -H "Authorization: Bearer <TOKEN>"

# Should return { success: true, scanId: "...", reused: false }.
```

Note the route prefixes use `/api/v1/gps/...` (the `gpsRoutes` Express
router is mounted at `/api/v1/gps`).

---

## 2. Mobile

### 2.1 Install new dependencies

```powershell
cd d:\Work\vintraxxsmartscan\vintraxxMobile
npm install `
  @react-native-firebase/app@^21 `
  @react-native-firebase/messaging@^21 `
  react-native-maps@^1.18 `
  @react-native-async-storage/async-storage@^2
```

If `async-storage` is already in `package.json`, npm will skip it.

### 2.2 iOS extra step

```powershell
cd d:\Work\vintraxxsmartscan\vintraxxMobile\ios
pod install
```

You also need:

1. `GoogleService-Info.plist` from Firebase, placed at
   `vintraxxMobile/ios/vintraxxMobile/GoogleService-Info.plist`
2. Push Notifications + Background Modes (Remote notifications)
   capability enabled in Xcode for the `vintraxxMobile` target.

### 2.3 Android extra step

1. `google-services.json` from Firebase, placed at
   `vintraxxMobile/android/app/google-services.json`
2. Confirm `android/build.gradle` has the `com.google.gms:google-services`
   classpath and `android/app/build.gradle` applies the
   `com.google.gms.google-services` plugin (these are added automatically
   by `@react-native-firebase/app`'s post-install).
3. For `react-native-maps` to render Google tiles, set
   `GOOGLE_MAPS_API_KEY` in `android/app/src/main/AndroidManifest.xml`:

```xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_KEY_HERE"/>
```

### 2.4 Run the app

```powershell
cd d:\Work\vintraxxsmartscan\vintraxxMobile
npm start            # in one terminal
npm run android      # or: npm run ios
```

After login you should see:

- The **new tab bar** with a centred red Scan button and four side tabs
  (Devices, History, Appraisal, Schedule).
- The **Devices** tab with the segmented Bluetooth / GPS Vehicles control.
- The **dealer badge** in the Devices header (top-right).

If the GPS Vehicles segment is empty, that's expected for a brand-new
account: a fleet admin needs to register a terminal to it first.

### 2.5 Push token registration

The mobile app will automatically request notification permission on first
launch (post-login) and POST the token to
`/api/v1/gps/devices/push-token`. Verify in the backend logs:

```
Mobile push token registered  { userId, platform, tokenId }
```

To force a refresh during development, sign out + sign in.

---

## 3. Triggering a test alarm

To verify the end-to-end pipeline (gateway → DB → push → mobile → AckUI):

1. From the admin web console, manually open a `GpsAlarm` row with
   `severity = 'WARNING'` for a terminal that's owned by your test user.
2. Within ~2 seconds the mobile app should:
   - Display a heads-up FCM notification
   - Append the alarm to the `Alerts` inbox via the WS `alarm.opened` event
   - Increment the badge on the History and Devices tabs
3. Tapping the notification should deep-link to `AlertDetail`.

If step 2 fails:

- Check `MobilePushToken` table — does the row exist with `disabledAt IS NULL`?
- Check the backend logs for `CRITICAL alarm push dispatched` — did it
  find tokens? If `tokenCount=0` the user simply has no registered devices.
- Check `GpsAlarmPushDedup` — does a row exist for this `alarmId`? If yes,
  another worker already sent the push (idempotent CAS); restart the test
  with a fresh alarm.
- Check the per-user throttle: the bridge silently drops pushes once the
  user exceeds `FCM_PUSH_THROTTLE_PER_USER_PER_5MIN` (default 10) within
  a rolling 5-minute window. Restart the backend process to reset.
- Confirm `FCM_ENABLED=true` and `FCM_SERVICE_ACCOUNT_JSON` is set; on
  boot you should see `Firebase Admin initialised for FCM push`.

---

## 4. Rolling back

The mobile changes are fully backwards-compatible: with no Phase 5
backend deployed, the GPS panels will simply show their empty states and
the WS client will stay in `connecting` mode (it logs a warning but does
not crash the app).

The backend changes can be rolled back via:

```powershell
cd d:\Work\vintraxxsmartscan\vintraxxBackend
npx prisma migrate resolve --rolled-back phase5_gps_mobile
```

(Manually drop the two new tables in production environments where
`migrate resolve` is not authorised.)

---

## 5. Notes

- **Read-only pairing:** the mobile app intentionally exposes no
  pair/unpair flow. Pairing is admin-only via the web console; users see
  devices auto-appear.
- **AI bridge:** GPS-side DTC analysis reuses the same `Scan` →
  `pollReport` pipeline as the BLE flow. The `DtcEventDetailScreen`
  promotes the GPS-DTC event to a Scan via `POST /gps/dtc-events/:id/analyze`,
  polls `/scan/report/:scanId`, then navigates to `FullReport` with the
  pre-fetched `FullReportData`. There is *no* second AI endpoint to
  maintain.
- **Map fallback:** if `react-native-maps` is not installed, the
  `LiveTrackScreen` and `TripDetailScreen` render a graceful "Map not
  available" placeholder rather than crashing. This means the rest of the
  app still functions during local development without Google Maps API
  keys configured.
- **JSON serialisation:** Prisma `Decimal` and `BigInt` are handled by
  `vintraxxBackend/src/utils/json-bigint-decimal-polyfill.ts`, which is
  imported at the very top of both the REST and gateway entry points.
  Without that polyfill `res.json()` would either throw on a BigInt or
  return Decimal coordinates as strings (which silently break
  `react-native-maps`).
