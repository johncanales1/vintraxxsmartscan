-- Mobile push tokens (FCM/APNs) and per-alarm push-dedup guard.
-- Adds an optional userId attribution column to GpsCommand so the new
-- mobile owner-only `locate` wrapper can persist who issued the command
-- without forcing it through the admin column.

-- ── MobilePushToken ────────────────────────────────────────────────────────
CREATE TABLE "MobilePushToken" (
    "id"         TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "platform"   TEXT NOT NULL,
    "token"      TEXT NOT NULL,
    "appVersion" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disabledAt" TIMESTAMP(3),
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MobilePushToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MobilePushToken_token_key" ON "MobilePushToken"("token");
CREATE INDEX "MobilePushToken_userId_idx" ON "MobilePushToken"("userId");
CREATE INDEX "MobilePushToken_disabledAt_idx" ON "MobilePushToken"("disabledAt");

ALTER TABLE "MobilePushToken"
    ADD CONSTRAINT "MobilePushToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ── GpsAlarmPushDedup ──────────────────────────────────────────────────────
CREATE TABLE "GpsAlarmPushDedup" (
    "id"      TEXT NOT NULL,
    "alarmId" TEXT NOT NULL,
    "sentAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GpsAlarmPushDedup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GpsAlarmPushDedup_alarmId_key" ON "GpsAlarmPushDedup"("alarmId");

-- ── GpsCommand.userId (optional attribution) ───────────────────────────────
ALTER TABLE "GpsCommand" ADD COLUMN "userId" TEXT;

CREATE INDEX "GpsCommand_userId_idx" ON "GpsCommand"("userId");

ALTER TABLE "GpsCommand"
    ADD CONSTRAINT "GpsCommand_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
