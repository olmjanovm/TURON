import { PrismaClient } from '@prisma/client';

// Use a global variable to store the PrismaClient instance in development
// to avoid creating new connections on every hot-reload.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Test connection on startup (optional but helpful for logs)
if (process.env.NODE_ENV === 'production') {
  prisma.$connect()
    .then(() => console.log('[Prisma] Database connected successfully.'))
    .catch((err) => console.error('[Prisma] CRITICAL: Database connection failed.', err));
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
