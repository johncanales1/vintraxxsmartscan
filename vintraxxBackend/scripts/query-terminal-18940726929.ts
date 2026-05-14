import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const terminal = await prisma.gpsTerminal.findUnique({
    where: { deviceIdentifier: '18940726929' },
    select: { id: true, deviceIdentifier: true, status: true, ownerUserId: true },
  });

  if (!terminal) {
    console.log('Terminal 18940726929 not found in database');
    return;
  }

  console.log('=== TERMINAL 18940726929 ===');
  console.log('ID:', terminal.id);
  console.log('Device Identifier:', terminal.deviceIdentifier);
  console.log('Status:', terminal.status);
  console.log('Owner User ID:', terminal.ownerUserId);
  
  if (terminal.status === 'REVOKED') {
    console.log('\n✓ Terminal is REVOKED - this explains the warnings');
    console.log('✓ This is a separate terminal from 18940726930');
    console.log('✓ It should NOT interfere with terminal 18940726930 operations');
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
