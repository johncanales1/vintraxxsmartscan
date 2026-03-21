-- AlterTable: Add dealer fields to User
ALTER TABLE "User" ADD COLUMN "isDealer" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "pricePerLaborHour" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN "logoUrl" TEXT;

-- AlterTable: Add additionalRepairs and scannerDeviceId to Scan
ALTER TABLE "Scan" ADD COLUMN "additionalRepairs" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Scan" ADD COLUMN "scannerDeviceId" TEXT;

-- AlterTable: Add additionalRepairsCost and additionalRepairsData to FullReport
ALTER TABLE "FullReport" ADD COLUMN "additionalRepairsCost" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "FullReport" ADD COLUMN "additionalRepairsData" JSONB;

-- CreateTable: UserScannerDevice
CREATE TABLE "UserScannerDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT,
    "firstUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserScannerDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserVinUsage
CREATE TABLE "UserVinUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "firstUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scanCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "UserVinUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserScannerDevice_userId_idx" ON "UserScannerDevice"("userId");
CREATE UNIQUE INDEX "UserScannerDevice_userId_deviceId_key" ON "UserScannerDevice"("userId", "deviceId");

CREATE INDEX "UserVinUsage_userId_idx" ON "UserVinUsage"("userId");
CREATE UNIQUE INDEX "UserVinUsage_userId_vin_key" ON "UserVinUsage"("userId", "vin");

-- AddForeignKey
ALTER TABLE "UserScannerDevice" ADD CONSTRAINT "UserScannerDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserVinUsage" ADD CONSTRAINT "UserVinUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
