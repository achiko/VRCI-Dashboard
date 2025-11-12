// Conditional Prisma import to handle cases where client isn't generated
let PrismaClient: any;
let prisma: any;

try {
  const prismaModule = require('@prisma/client');
  PrismaClient = prismaModule.PrismaClient;

  const globalForPrisma = globalThis as unknown as {
    prisma: any;
  };

  // Only create Prisma client if DATABASE_URL is available
  if (process.env.DATABASE_URL && PrismaClient) {
    prisma =
      globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });

    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
  }
} catch (error) {
  // Prisma client not available (e.g., during build without DATABASE_URL)
  console.warn('Prisma client not available:', error instanceof Error ? error.message : 'Unknown error');
  prisma = undefined;
}

export { prisma };

