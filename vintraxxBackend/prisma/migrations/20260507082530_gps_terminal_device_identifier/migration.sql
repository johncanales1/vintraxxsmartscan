-- Add the canonical JT/T 808 terminal identifier column. The runtime gateway
-- (handleRegister, handleAuth, SessionRegistry) keys on this value, derived
-- from the BCD[6] "end phone number" field of every JT/T 808 message header.
-- Up to now the same value was being stored in the misnamed `imei` column;
-- this migration introduces the correctly-named column and demotes `imei` to
-- optional metadata.

-- Step 1: add the new column as nullable so the backfill can run.
ALTER TABLE "GpsTerminal" ADD COLUMN "deviceIdentifier" TEXT;

-- Step 2: backfill from the existing imei column. Every existing row's imei
-- value is, in fact, the runtime header identifier (see commit history for
-- handleRegister.ts which has been writing phoneBcd into imei since day 1).
UPDATE "GpsTerminal" SET "deviceIdentifier" = "imei" WHERE "deviceIdentifier" IS NULL;

-- Step 3: now that every row has a value, enforce NOT NULL.
ALTER TABLE "GpsTerminal" ALTER COLUMN "deviceIdentifier" SET NOT NULL;

-- Step 4: add the unique index that replaces the old imei unique index.
CREATE UNIQUE INDEX "GpsTerminal_deviceIdentifier_key" ON "GpsTerminal"("deviceIdentifier");

-- Step 5: drop the old imei unique index — multiple devices may legitimately
-- share a NULL imei (admins won't always know it at provisioning time).
DROP INDEX IF EXISTS "GpsTerminal_imei_key";

-- Step 6: relax the imei NOT NULL constraint. From this point forward imei
-- is optional metadata; deviceIdentifier is the canonical identity column.
ALTER TABLE "GpsTerminal" ALTER COLUMN "imei" DROP NOT NULL;
