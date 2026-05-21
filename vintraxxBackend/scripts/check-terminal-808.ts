import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const terminalById = await prisma.gpsTerminal.findUnique({
    where: { id: '30ee57a1-996d-49b6-a641-21bac38e0b0a' },
    select: { id: true, deviceIdentifier: true, authCode: true, status: true, connectedAt: true, disconnectedAt: true, lastHeartbeatAt: true, createdAt: true },
  });

  if (terminalById) {
    console.log('=== TERMINAL BY ID 30ee57a1-996d-49b6-a641-21bac38e0b0a ===');
    console.log('ID:', terminalById.id);
    console.log('Device Identifier:', terminalById.deviceIdentifier);
    console.log('Auth Code:', terminalById.authCode);
    console.log('Status:', terminalById.status);
    console.log('Created:', terminalById.createdAt.toISOString());
    console.log('Connected At:', terminalById.connectedAt?.toISOString());
    console.log('Disconnected At:', terminalById.disconnectedAt?.toISOString());
    console.log('Last Heartbeat:', terminalById.lastHeartbeatAt?.toISOString());
    console.log('');
  } else {
    console.log('Terminal ID 30ee57a1-996d-49b6-a641-21bac38e0b0a NOT FOUND in database');
    console.log('');
  }

  const terminalByDeviceId = await prisma.gpsTerminal.findUnique({
    where: { deviceIdentifier: '18940726930' },
    select: { id: true, deviceIdentifier: true, authCode: true, status: true, connectedAt: true, disconnectedAt: true, lastHeartbeatAt: true, createdAt: true },
  });

  if (terminalByDeviceId) {
    console.log('=== TERMINAL BY deviceIdentifier 18940726930 ===');
    console.log('ID:', terminalByDeviceId.id);
    console.log('Device Identifier:', terminalByDeviceId.deviceIdentifier);
    console.log('Auth Code:', terminalByDeviceId.authCode);
    console.log('Status:', terminalByDeviceId.status);
    console.log('Created:', terminalByDeviceId.createdAt.toISOString());
    console.log('Connected At:', terminalByDeviceId.connectedAt?.toISOString());
    console.log('Disconnected At:', terminalByDeviceId.disconnectedAt?.toISOString());
    console.log('Last Heartbeat:', terminalByDeviceId.lastHeartbeatAt?.toISOString());
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
