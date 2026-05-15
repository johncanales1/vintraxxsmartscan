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
  
  const recentCompleted = await prisma.gpsScanReport.findFirst({
    where: {
      terminalId: terminal.id,
      status: 'COMPLETED',
      completedAt: { gt: new Date(Date.now() - 60_000) },
    },
    orderBy: { requestedAt: 'desc' },
  });
  
  if (!recentCompleted) {
    console.log('No recent COMPLETED scan found');
    return;
  }
  
  console.log('=== RECENT COMPLETED SCAN ===');
  console.log('ID:', recentCompleted.id);
  console.log('Status:', recentCompleted.status);
  console.log('Completed At:', recentCompleted.completedAt?.toISOString());
  console.log('Raw OBD JSON:', recentCompleted.rawObdJson);
  console.log('Raw OBD JSON type:', typeof recentCompleted.rawObdJson);
  console.log('Raw OBD JSON === null:', recentCompleted.rawObdJson === null);
  console.log('Raw OBD JSON === Prisma.JsonNull:', recentCompleted.rawObdJson === prisma.jsonNull());
  
  // Test the query with different conditions
  console.log('\n=== TESTING QUERIES ===');
  
  const test1 = await prisma.gpsScanReport.findFirst({
    where: {
      terminalId: terminal.id,
      status: 'COMPLETED',
      completedAt: { gt: new Date(Date.now() - 60_000) },
      rawObdJson: { equals: Prisma.JsonNull },
    },
  });
  console.log('Query with Prisma.JsonNull:', test1 ? 'FOUND' : 'NOT FOUND');
  
  const test2 = await prisma.gpsScanReport.findFirst({
    where: {
      terminalId: terminal.id,
      status: 'COMPLETED',
      completedAt: { gt: new Date(Date.now() - 60_000) },
      rawObdJson: null,
    },
  });
  console.log('Query with null:', test2 ? 'FOUND' : 'NOT FOUND');
  
  const test3 = await prisma.gpsScanReport.findFirst({
    where: {
      terminalId: terminal.id,
      status: 'COMPLETED',
      completedAt: { gt: new Date(Date.now() - 60_000) },
      NOT: { rawObdJson: { equals: Prisma.DbNull } },
    },
  });
  console.log('Query with NOT DbNull:', test3 ? 'FOUND' : 'NOT FOUND');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
