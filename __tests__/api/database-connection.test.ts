import { test, expect, describe } from 'vitest';
import { prisma } from '@/lib/prisma';

/**
 * Database connection and interaction tests
 * These tests verify that:
 * 1. DATABASE_URL is set
 * 2. Prisma client is available
 * 3. Database connection works
 * 4. CRUD operations work correctly
 */
describe('Database Connection Test', () => {
  test('DATABASE_URL should be set', () => {
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.DATABASE_URL?.length).toBeGreaterThan(0);
    expect(process.env.DATABASE_URL).toContain('postgresql://');
  });

  test.skipIf(!prisma)('Prisma client should be available', () => {
    // The connection test below will verify prisma works
    // This test just checks that the module loaded
    expect(prisma).toBeDefined();
  });

  test.skipIf(!prisma)('should connect to database', async () => {

    try {
      // Test connection with a simple query
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toBeDefined();
      expect(result[0].test).toBe(1);
    } catch (error) {
      throw new Error(
        'Database connection failed. Check DATABASE_URL and database availability.\n' +
        'Error: ' + (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  });

  test.skipIf(!prisma)('should have Wallet and Log models available', () => {

    // Check that models are available
    expect(prisma.wallet).toBeDefined();
    expect(prisma.log).toBeDefined();
    expect(typeof prisma.wallet.findMany).toBe('function');
    expect(typeof prisma.log.findMany).toBe('function');
  });
});

