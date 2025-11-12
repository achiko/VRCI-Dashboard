// Conditional Prisma import to handle cases where client isn't generated
let PrismaClient: any;
let prisma: any;

try {
  // Try to import Prisma Client from custom output location
  const prismaModule = require('../generated/client');
  PrismaClient = prismaModule.PrismaClient;

  if (!PrismaClient) {
    throw new Error('PrismaClient not found in @prisma/client module. Run: bunx prisma generate');
  }

  const globalForPrisma = globalThis as unknown as {
    prisma: any;
  };

  // Only create Prisma client if DATABASE_URL is available
  if (process.env.DATABASE_URL) {
    prisma =
      globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });

    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
  } else {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('DATABASE_URL not set, Prisma client will not be initialized');
    }
  }
} catch (error) {
  // Prisma client not available (e.g., during build without DATABASE_URL or client not generated)
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Prisma client not available:', errorMessage);
  }
  prisma = undefined;
}

export { prisma };

