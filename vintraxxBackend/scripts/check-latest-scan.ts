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
  
  const latest = await prisma.gpsScanReport.findFirst({
    where: { terminalId: terminal.id },
    orderBy: { requestedAt: 'desc' },
  });
  
  if (!latest) {
    console.log('No scan found');
    return;
  }
  
  console.log('=== LATEST SCAN ===');
  console.log('ID:', latest.id);
  console.log('Status:', latest.status);
  console.log('Requested At:', latest.requestedAt.toISOString());
  console.log('Completed At:', latest.completedAt?.toISOString());
  console.log('Raw OBD JSON:', latest.rawObdJson);
  console.log('Raw OBD JSON type:', typeof latest.rawObdJson);
  console.log('RPM:', latest.rpm);
  console.log('Coolant Temp:', latest.coolantTempC);
  
  // Test if the scan would be found by my query
  const timeSinceCompleted = latest.completedAt ? Date.now() - latest.completedAt.getTime() : 0;
  console.log('\n=== QUERY CHECK ===');
  console.log('Time since completed (ms):', timeSinceCompleted);
  console.log('Within 60s window:', timeSinceCompleted < 60_000);
  console.log('rawObdJson is Prisma.JsonNull:', latest.rawObdJson === Prisma.JsonNull);
  console.log('rawObdJson is null:', latest.rawObdJson === null);
  
  const testQuery = await prisma.gpsScanReport.findFirst({
    where: {
      terminalId: terminal.id,
      status: 'COMPLETED',
      completedAt: { gt: new Date(Date.now() - 120_000) }, // 2 minute window
      rawObdJson: { equals: Prisma.JsonNull },
    },
  });
  console.log('Query with 120s window + Prisma.JsonNull:', testQuery ? 'FOUND' : 'NOT FOUND');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
