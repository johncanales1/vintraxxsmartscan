import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const terminal = await prisma.gpsTerminal.findUnique({
    where: { deviceIdentifier: '18940726930' },
    select: { id: true, deviceIdentifier: true, status: true, ownerUserId: true },
  });
  
  if (!terminal) {
    console.log('Terminal not found');
    return;
  }
  
  console.log('=== TERMINAL INFO ===');
  console.log('ID:', terminal.id);
  console.log('Device Identifier:', terminal.deviceIdentifier);
  console.log('Status:', terminal.status);
  console.log('Owner User ID:', terminal.ownerUserId);
  
  if (!terminal.ownerUserId) {
    console.log('Terminal has no owner - cannot trigger scan');
    return;
  }
  
  // Import the scan report service
  const { requestFullScan } = await import('../src/services/gps-scan-report.service');
  
  console.log('\n=== TRIGGERING SCAN ===');
  const result = await requestFullScan({
    terminalId: terminal.id,
    requestedByUserId: terminal.ownerUserId,
  });
  
  console.log('Scan triggered successfully');
  console.log('Scan Report ID:', result.scanReportId);
  console.log('Reused:', result.reused);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
