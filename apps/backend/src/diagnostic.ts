import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findFirst({
    include: { roles: true }
  });
  console.log('User roles found:', !!user?.roles);
}

check().catch(console.error);
