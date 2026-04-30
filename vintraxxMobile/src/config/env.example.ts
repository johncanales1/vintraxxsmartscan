// VinTraxx SmartScan — environment template (committed). Bug #M4 / #M5.
//
// HOW TO USE
// ──────────
// 1. Copy this file to `src/config/env.ts` (which is git-ignored).
// 2. Replace each placeholder with the real value for the environment you
//    are building (development, staging, production).
// 3. `src/config/api.ts` imports the runtime values from `./env`, so a
//    fresh clone without an `env.ts` will fail to compile — this is by
//    design, so misconfigured builds fail loud and early.
//
// FIELDS
// ──────
// - API_BASE_URL     — REST API base, no trailing slash. e.g. https://api.vintraxx.com
// - WS_BASE_URL      — WebSocket base, scheme `wss://` (or `ws://` in dev).
//                       e.g. wss://api.vintraxx.com
// - GOOGLE_*_CLIENT_ID — OAuth 2.0 client IDs from Google Cloud Console.
//                       The Android & iOS values MUST be different — each is
//                       tied to that platform's bundle id / SHA fingerprint.
//                       Using the Android id for iOS will cause `signIn()`
//                       to fail with INVALID_AUDIENCE on a real iPhone.

export const ENV = {
  API_BASE_URL: 'https://api.vintraxx.com',
  WS_BASE_URL: 'wss://api.vintraxx.com',
  GOOGLE_WEB_CLIENT_ID: 'REPLACE_ME-web.apps.googleusercontent.com',
  GOOGLE_ANDROID_CLIENT_ID: 'REPLACE_ME-android.apps.googleusercontent.com',
  GOOGLE_IOS_CLIENT_ID: 'REPLACE_ME-ios.apps.googleusercontent.com',
} as const;
