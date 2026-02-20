-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('RECEIVED', 'DECODING_VIN', 'ANALYZING', 'GENERATING_PDF', 'EMAILING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Otp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "mileage" DOUBLE PRECISION,
    "milOn" BOOLEAN NOT NULL,
    "dtcCount" INTEGER NOT NULL,
    "storedDtcCodes" TEXT[],
    "pendingDtcCodes" TEXT[],
    "permanentDtcCodes" TEXT[],
    "distanceSinceCleared" DOUBLE PRECISION,
    "timeSinceCleared" DOUBLE PRECISION,
    "warmupsSinceCleared" INTEGER,
    "distanceWithMilOn" DOUBLE PRECISION,
    "fuelSystemStatus" JSONB,
    "secondaryAirStatus" INTEGER,
    "milStatusByEcu" JSONB,
    "rawPayload" JSONB NOT NULL,
    "vehicleYear" INTEGER,
    "vehicleMake" TEXT,
    "vehicleModel" TEXT,
    "vehicleEngine" TEXT,
    "status" "ScanStatus" NOT NULL DEFAULT 'RECEIVED',
    "errorMessage" TEXT,
    "scanDate" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FullReport" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "aiRawResponse" JSONB NOT NULL,
    "dtcAnalysis" JSONB NOT NULL,
    "emissionsCheck" JSONB NOT NULL,
    "mileageRiskAssessment" JSONB NOT NULL,
    "repairRecommendations" JSONB NOT NULL,
    "modulesScanned" TEXT[],
    "datapointsScanned" INTEGER NOT NULL,
    "totalReconditioningCost" DOUBLE PRECISION NOT NULL,
    "reportVersion" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "pdfGeneratedAt" TIMESTAMP(3),
    "emailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FullReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Otp_email_code_idx" ON "Otp"("email", "code");

-- CreateIndex
CREATE INDEX "Scan_userId_idx" ON "Scan"("userId");

-- CreateIndex
CREATE INDEX "Scan_vin_idx" ON "Scan"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "FullReport_scanId_key" ON "FullReport"("scanId");

-- CreateIndex
CREATE INDEX "FullReport_scanId_idx" ON "FullReport"("scanId");

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FullReport" ADD CONSTRAINT "FullReport_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
