import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const vin = '5NPD84LF3LH535851';
  
  const bleScans = await prisma.scan.findMany({
    where: { vin },
    orderBy: { scanDate: 'desc' },
    take: 3,
  });

  if (bleScans.length === 0) {
    console.log('No BLE scans found for VIN:', vin);
    return;
  }

  console.log(`=== BLE SCANS FOR VIN: ${vin} ===`);
  console.log(`Found ${bleScans.length} scan(s)\n`);

  bleScans.forEach((scan, idx) => {
    console.log(`--- SCAN #${idx + 1} ---`);
    console.log('ID:', scan.id);
    console.log('Scan Date:', scan.scanDate.toISOString());
    console.log('Status:', scan.status);
    console.log('MIL On:', scan.milOn);
    console.log('DTC Count:', scan.dtcCount);
    console.log('Stored DTCs:', scan.storedDtcCodes);
    console.log('Pending DTCs:', scan.pendingDtcCodes);
    console.log('Permanent DTCs:', scan.permanentDtcCodes);
    console.log('Distance Since Cleared:', scan.distanceSinceCleared);
    console.log('Time Since Cleared:', scan.timeSinceCleared);
    console.log('Warmups Since Cleared:', scan.warmupsSinceCleared);
    console.log('Distance with MIL On:', scan.distanceWithMilOn);
    console.log('Fuel System Status:', JSON.stringify(scan.fuelSystemStatus));
    console.log('Secondary Air Status:', scan.secondaryAirStatus);
    console.log('MIL Status by ECU:', JSON.stringify(scan.milStatusByEcu));
    console.log('\n--- RAW PAYLOAD ---');
    console.log(JSON.stringify(scan.rawPayload, null, 2));
    console.log('\n');
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
