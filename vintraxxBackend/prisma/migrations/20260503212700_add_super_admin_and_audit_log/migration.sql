-- DropForeignKey
ALTER TABLE "GpsDtcEvent" DROP CONSTRAINT "GpsDtcEvent_gpsDtcEventId_fkey";

-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "superAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "payload" JSONB,
    "errorText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminId_createdAt_idx" ON "AdminAuditLog"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetType_targetId_idx" ON "AdminAuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_gpsDtcEventId_fkey" FOREIGN KEY ("gpsDtcEventId") REFERENCES "GpsDtcEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GpsAlarm" ADD CONSTRAINT "GpsAlarm_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "GpsLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

