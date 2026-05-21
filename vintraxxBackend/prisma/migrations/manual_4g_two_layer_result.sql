-- Manual migration: two-layer result for 4G always-online commands.
-- Adds new GpsCommandStatus enum values and two-layer fields to GpsCommand.
-- Applied with: npx prisma db execute --file prisma/migrations/manual_4g_two_layer_result.sql

-- 1. New enum values (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'JT808_ACKED'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'GpsCommandStatus')
  ) THEN
    ALTER TYPE "GpsCommandStatus" ADD VALUE 'JT808_ACKED';
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'VENDOR_RESPONSE_RECEIVED'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'GpsCommandStatus')
  ) THEN
    ALTER TYPE "GpsCommandStatus" ADD VALUE 'VENDOR_RESPONSE_RECEIVED';
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'JT808_ACK_TIMEOUT'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'GpsCommandStatus')
  ) THEN
    ALTER TYPE "GpsCommandStatus" ADD VALUE 'JT808_ACK_TIMEOUT';
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'VENDOR_RESPONSE_TIMEOUT'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'GpsCommandStatus')
  ) THEN
    ALTER TYPE "GpsCommandStatus" ADD VALUE 'VENDOR_RESPONSE_TIMEOUT';
  END IF;
END;
$$;

-- 2. New columns on GpsCommand (all idempotent)
ALTER TABLE "GpsCommand"
  ADD COLUMN IF NOT EXISTS "jt808AckAt"                 TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "jt808AckResult"             INTEGER,
  ADD COLUMN IF NOT EXISTS "vendorResponseAt"           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "vendorResponseMessageId"    TEXT,
  ADD COLUMN IF NOT EXISTS "vendorResponseRawHex"       TEXT,
  ADD COLUMN IF NOT EXISTS "vendorResponseDecodedText"  TEXT,
  ADD COLUMN IF NOT EXISTS "vendorResponseJson"         JSONB,
  ADD COLUMN IF NOT EXISTS "vendorResponseParseStatus"  TEXT,
  ADD COLUMN IF NOT EXISTS "sleepEventAt"               TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "sleepEventNote"             TEXT;
