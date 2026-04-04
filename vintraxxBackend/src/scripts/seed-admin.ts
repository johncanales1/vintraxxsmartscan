import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'podolskyidanylo@hotmail.com';
  const password = 'home@1344';
  const hash = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: { passwordHash: hash },
    create: { email, passwordHash: hash },
  });

  console.log(`Admin seeded: ${admin.email} (id: ${admin.id})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
