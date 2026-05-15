import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const terminal = await prisma.gpsTerminal.findUnique({
    where: { deviceIdentifier: '18940726930' },
    select: { id: true },
  });
  
  if (!terminal) {
    console.log('Terminal not found');
    return;
  }
  
  const report = await prisma.gpsScanReport.findFirst({
    where: { terminalId: terminal.id },
    orderBy: { createdAt: 'desc' },
  });
  
  if (!report) {
    console.log('No scan report found');
    return;
  }
  
  console.log('=== LATEST SCAN REPORT ===');
  console.log('ID:', report.id);
  console.log('Status:', report.status);
  console.log('Created:', report.createdAt.toISOString());
  console.log('Requested At:', report.requestedAt.toISOString());
  console.log('Completed At:', report.completedAt?.toISOString());
  console.log('VIN:', report.vin);
  console.log('MIL On:', report.milOn);
  console.log('DTC Count:', report.dtcCount);
  console.log('RPM:', report.rpm);
  console.log('Coolant Temp:', report.coolantTempC);
  
  console.log('\n=== RAW OBD JSON ===');
  console.log(JSON.stringify(report.rawObdJson, null, 2));
  
  if (report.errorText) {
    console.log('\n=== ERROR ===');
    console.log(report.errorText);
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
