-- Manual migration: add GpsScanReport + GpsScanReportStatus enum.
-- Applied via `npx prisma db execute --file ... --schema prisma/schema.prisma`
-- because the dev DB user has no CREATEDB and Prisma's shadow-DB workflow
-- can't run here. After applying, `prisma generate` regenerates the client.

-- 1. Enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GpsScanReportStatus') THEN
    CREATE TYPE "GpsScanReportStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'TIMED_OUT');
  END IF;
END
$$;

-- 2. Table
CREATE TABLE IF NOT EXISTS "GpsScanReport" (
  "id"                    TEXT PRIMARY KEY,
  "terminalId"            TEXT NOT NULL REFERENCES "GpsTerminal"("id") ON DELETE CASCADE,
  "ownerUserId"           TEXT,
  "requestedByAdminId"    TEXT,
  "requestedByUserId"     TEXT,
  "status"                "GpsScanReportStatus" NOT NULL DEFAULT 'PENDING',
  "requestedAt"           TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "completedAt"           TIMESTAMP(3),
  "errorText"             TEXT,
  "vin"                   TEXT,
  "vehicleYear"           INTEGER,
  "vehicleMake"           TEXT,
  "vehicleModel"          TEXT,
  "mileageKm"             DECIMAL(10, 1),
  "milOn"                 BOOLEAN,
  "dtcCount"              INTEGER,
  "storedDtcCodes"        TEXT[] NOT NULL DEFAULT '{}',
  "pendingDtcCodes"       TEXT[] NOT NULL DEFAULT '{}',
  "permanentDtcCodes"     TEXT[] NOT NULL DEFAULT '{}',
  "fuelSystemStatus"      TEXT,
  "secondaryAirStatus"    TEXT,
  "distanceWithMilKm"     DECIMAL(8, 1),
  "distanceSinceClearKm"  DECIMAL(8, 1),
  "warmupsSinceClear"     INTEGER,
  "runtimeSinceStartSec"  INTEGER,
  "rpm"                   INTEGER,
  "vehicleSpeedKmh"       DECIMAL(5, 1),
  "coolantTempC"          INTEGER,
  "intakeAirTempC"        INTEGER,
  "throttlePct"           DECIMAL(4, 1),
  "engineLoadPct"         DECIMAL(4, 1),
  "mafGps"                DECIMAL(6, 2),
  "fuelLevelPct"          DECIMAL(4, 1),
  "fuelRailPressureKpa"   INTEGER,
  "batteryVoltageMv"      INTEGER,
  "ambientTempC"          INTEGER,
  "barometricKpa"         INTEGER,
  "acceleratorPct"        DECIMAL(4, 1),
  "intakeManifoldKpa"     INTEGER,
  "protocol"              TEXT,
  "rawObdJson"            JSONB,
  "promotedScanId"        TEXT UNIQUE REFERENCES "Scan"("id") ON DELETE SET NULL,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "GpsScanReport_terminalId_createdAt_idx"
  ON "GpsScanReport" ("terminalId", "createdAt");
CREATE INDEX IF NOT EXISTS "GpsScanReport_ownerUserId_createdAt_idx"
  ON "GpsScanReport" ("ownerUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "GpsScanReport_status_idx"
  ON "GpsScanReport" ("status");

-- 3. Cleanup of historical fake D450 / HOLLOO DTC events (one-shot purge).
--    Per the implementation plan §5.5, the old 0xF4 decoder fabricated DTC
--    codes from time/lat/lng bytes of F2 packets that actually reported zero
--    faults. We delete every GpsDtcEvent on a terminal whose model is "D450"
--    OR whose manufacturer is "HOLLOO" so the dashboard reflects the truth
--    on next reload. The corrected codec (this same deploy) will only ever
--    persist GpsDtcEvent rows with real codes going forward.
DELETE FROM "GpsDtcEvent" e
USING "GpsTerminal" t
WHERE e."terminalId" = t."id"
  AND (t."terminalModel" = 'D450' OR t."manufacturerId" = 'HOLLOO');

-- Mark the migration as applied in _prisma_migrations so a future `migrate
-- dev` doesn't try to re-create the same objects.
INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at",
  "started_at", "applied_steps_count"
) VALUES (
  gen_random_uuid()::text,
  'manual-add-gps-scan-report-and-purge-fake-dtcs',
  NOW(),
  'manual_add_gps_scan_report_and_purge_fake_dtcs',
  NULL,
  NULL,
  NOW(),
  1
) ON CONFLICT DO NOTHING;
