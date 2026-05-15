import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const terminal = await prisma.gpsTerminal.findUnique({
    where: { deviceIdentifier: '18940726930' },
    select: { id: true, deviceIdentifier: true, status: true, vehicleVin: true },
  });
  
  if (!terminal) {
    console.log('Terminal not found');
    return;
  }
  
  console.log('=== TERMINAL INFO ===');
  console.log('ID:', terminal.id);
  console.log('Device Identifier:', terminal.deviceIdentifier);
  console.log('Status:', terminal.status);
  console.log('Vehicle VIN:', terminal.vehicleVin);
  
  const reports = await prisma.gpsScanReport.findMany({
    where: { terminalId: terminal.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  
  console.log('\n=== RECENT SCAN REPORTS ===');
  console.log('Count:', reports.length);
  if (reports.length === 0) {
    console.log('No scan reports found for this terminal');
  } else {
    reports.forEach(r => {
      console.log(`- ${r.id}: ${r.status} at ${r.createdAt.toISOString()}`);
      if (r.errorText) console.log(`  Error: ${r.errorText}`);
      if (r.rawObdJson) console.log(`  Has OBD data: ${Object.keys(r.rawObdJson || {}).length > 0}`);
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
