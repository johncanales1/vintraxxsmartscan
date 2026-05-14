import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const latestReport = await prisma.gpsScanReport.findFirst({
    orderBy: { requestedAt: 'desc' },
    include: { terminal: true },
  });

  if (!latestReport) {
    console.log('No GPS scan reports found');
    return;
  }

  console.log('=== LATEST GPS SCAN REPORT ===');
  console.log('ID:', latestReport.id);
  console.log('Terminal ID:', latestReport.terminalId);
  console.log('Terminal Device Identifier:', latestReport.terminal?.deviceIdentifier);
  console.log('Status:', latestReport.status);
  console.log('Requested At:', latestReport.requestedAt.toISOString());
  console.log('Completed At:', latestReport.completedAt?.toISOString());
  console.log('VIN:', latestReport.vin);
  console.log('\n=== RAW OBD JSON ===');
  console.log(JSON.stringify(latestReport.rawObdJson, null, 2));
  console.log('\n=== DECODED FIELDS ===');
  console.log('VIN:', latestReport.vin);
  console.log('MIL On:', latestReport.milOn);
  console.log('DTC Count:', latestReport.dtcCount);
  console.log('Stored DTCs:', latestReport.storedDtcCodes);
  console.log('Pending DTCs:', latestReport.pendingDtcCodes);
  console.log('Permanent DTCs:', latestReport.permanentDtcCodes);
  console.log('Fuel System Status:', latestReport.fuelSystemStatus);
  console.log('Secondary Air Status:', latestReport.secondaryAirStatus);
  console.log('Distance with MIL (km):', latestReport.distanceWithMilKm?.toString());
  console.log('Distance Since Clear (km):', latestReport.distanceSinceClearKm?.toString());
  console.log('Warmups Since Clear:', latestReport.warmupsSinceClear);
  console.log('Runtime Since Start (sec):', latestReport.runtimeSinceStartSec);
  console.log('\n=== LIVE DATA ===');
  console.log('RPM:', latestReport.rpm);
  console.log('Vehicle Speed (km/h):', latestReport.vehicleSpeedKmh?.toString());
  console.log('Coolant Temp (C):', latestReport.coolantTempC);
  console.log('Intake Air Temp (C):', latestReport.intakeAirTempC);
  console.log('Throttle (%):', latestReport.throttlePct?.toString());
  console.log('Engine Load (%):', latestReport.engineLoadPct?.toString());
  console.log('MAF (g/s):', latestReport.mafGps?.toString());
  console.log('Fuel Level (%):', latestReport.fuelLevelPct?.toString());
  console.log('Fuel Rail Pressure (kPa):', latestReport.fuelRailPressureKpa);
  console.log('Battery Voltage (mV):', latestReport.batteryVoltageMv);
  console.log('Ambient Temp (C):', latestReport.ambientTempC);
  console.log('Barometric (kPa):', latestReport.barometricKpa);
  console.log('Accelerator (%):', latestReport.acceleratorPct?.toString());
  console.log('Intake Manifold (kPa):', latestReport.intakeManifoldKpa);
  console.log('Protocol:', latestReport.protocol);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
