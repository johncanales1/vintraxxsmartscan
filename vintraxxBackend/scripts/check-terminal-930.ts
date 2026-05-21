import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const terminal = await prisma.gpsTerminal.findUnique({
    where: { deviceIdentifier: '18940726930' },
    select: { id: true, deviceIdentifier: true, status: true, connectedAt: true, disconnectedAt: true, lastHeartbeatAt: true },
  });
  
  if (!terminal) {
    console.log('Terminal 930 not found');
    return;
  }
  
  console.log('=== TERMINAL 930 ===');
  console.log('ID:', terminal.id);
  console.log('Device Identifier:', terminal.deviceIdentifier);
  console.log('Status:', terminal.status);
  console.log('Connected At:', terminal.connectedAt?.toISOString());
  console.log('Disconnected At:', terminal.disconnectedAt?.toISOString());
  console.log('Last Heartbeat:', terminal.lastHeartbeatAt?.toISOString());
  
  const report = await prisma.gpsScanReport.findFirst({
    where: { terminalId: terminal.id },
    orderBy: { createdAt: 'desc' },
  });
  
  if (report) {
    console.log('\n=== LATEST SCAN REPORT ===');
    console.log('ID:', report.id);
    console.log('Status:', report.status);
    console.log('Created:', report.createdAt.toISOString());
    console.log('Requested At:', report.requestedAt?.toISOString());
    console.log('Completed At:', report.completedAt?.toISOString());
    console.log('VIN:', report.vin);
    console.log('MIL On:', report.milOn);
    console.log('DTC Count:', report.dtcCount);
    
    if (report.errorText) {
      console.log('\n=== ERROR ===');
      console.log(report.errorText);
    }
  }
  
  console.log('\n=== QUEUED COMMANDS ===');
  const commands = await prisma.gpsCommand.findMany({
    where: { terminalId: terminal.id, status: 'QUEUED' },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  console.log('Count:', commands.length);
  commands.forEach(c => {
    console.log('- ID:', c.id, '| Type:', c.commandType, '| Created:', c.createdAt.toISOString());
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
