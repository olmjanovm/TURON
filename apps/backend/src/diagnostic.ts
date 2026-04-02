import { prisma } from './lib/prisma.js';

async function check() {
  const user = await prisma.user.findFirst();
  console.log('User role found:', user?.role);
}

check().catch(console.error);
