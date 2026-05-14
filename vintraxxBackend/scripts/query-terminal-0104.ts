import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const terminal = await prisma.gpsTerminal.findUnique({
    where: { deviceIdentifier: '18940726930' },
    select: { id: true, deviceIdentifier: true, parameters: true },
  });

  if (!terminal) {
    console.log('Terminal not found');
    return;
  }

  console.log('=== TERMINAL 18940726930 PARAMETERS ===');
  console.log('ID:', terminal.id);
  console.log('Device Identifier:', terminal.deviceIdentifier);
  console.log('\n=== PARAMETERS (from 0x0104 response) ===');
  console.log(JSON.stringify(terminal.parameters, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
