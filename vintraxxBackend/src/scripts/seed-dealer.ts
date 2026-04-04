import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'john@vintraxx.com';
  const password = 'dealer123';
  const hash = await bcrypt.hash(password, 12);

  const dealer = await prisma.user.upsert({
    where: { email },
    update: { 
      passwordHash: hash,
      isDealer: true,
      pricePerLaborHour: 150,
    },
    create: { 
      email, 
      passwordHash: hash,
      isDealer: true,
      pricePerLaborHour: 150,
    },
  });

  console.log(`Dealer seeded: ${dealer.email} (id: ${dealer.id}, isDealer: ${dealer.isDealer})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
