-- 4G Always-Online feature: add state tracking fields to GpsTerminal
-- Applied via: npx prisma db execute --file prisma/migrations/manual_4g_always_online.sql --schema prisma/schema.prisma

ALTER TABLE "GpsTerminal"
  ADD COLUMN IF NOT EXISTS "fourGAlwaysOnlineDesired"       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "fourGAlwaysOnlineStatus"        TEXT,
  ADD COLUMN IF NOT EXISTS "fourGAlwaysOnlineLastCommandId" TEXT,
  ADD COLUMN IF NOT EXISTS "fourGAlwaysOnlineLastAckAt"     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "fourGAlwaysOnlineLastError"     TEXT,
  ADD COLUMN IF NOT EXISTS "fourGAlwaysOnlineUpdatedAt"     TIMESTAMPTZ;
