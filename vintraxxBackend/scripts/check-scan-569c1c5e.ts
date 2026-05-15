import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const report = await prisma.gpsScanReport.findUnique({
    where: { id: '569c1c5e-e096-4e96-acb6-0a7f7c2c1a10' },
  });
  
  if (!report) {
    console.log('Report not found');
    return;
  }
  
  console.log('=== SCAN REPORT ===');
  console.log('ID:', report.id);
  console.log('Status:', report.status);
  console.log('Requested At:', report.requestedAt.toISOString());
  console.log('Completed At:', report.completedAt?.toISOString());
  console.log('RPM:', report.rpm);
  console.log('Coolant Temp:', report.coolantTempC);
  console.log('Raw OBD JSON:', report.rawObdJson);
  
  const timeSinceCompleted = report.completedAt ? Date.now() - report.completedAt.getTime() : 0;
  console.log('\n=== QUERY CHECK ===');
  console.log('Time since completed (ms):', timeSinceCompleted);
  console.log('Within 60s window:', timeSinceCompleted < 60_000);
  console.log('RPM is null:', report.rpm === null);
  
  // Test if this scan would be found by my query
  const testQuery = await prisma.gpsScanReport.findFirst({
    where: {
      terminalId: report.terminalId,
      status: 'COMPLETED',
      completedAt: { gt: new Date(Date.now() - 120_000) }, // 2 minute window
      rpm: null,
    },
  });
  console.log('Query with 120s window + rpm: null:', testQuery ? 'FOUND' : 'NOT FOUND');
  if (testQuery) {
    console.log('Found scan ID:', testQuery.id);
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
