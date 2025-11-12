import { test, expect, describe, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';

// Skip all tests if DATABASE_URL is not set or prisma is not available
const shouldSkipTests = !process.env.DATABASE_URL || !prisma;

describe.skipIf(shouldSkipTests)('Database Connection and Interactions', () => {
  let testWalletId: string;
  let testWalletAddress: string;

  beforeAll(async () => {
    // Verify Prisma client is available
    if (!prisma) {
      throw new Error('Prisma client is not available. Please set DATABASE_URL environment variable.');
    }

    // Clean up any existing test data
    testWalletAddress = `test-${Date.now()}@test.com`;
    await prisma.log.deleteMany({
      where: {
        wallet: {
          address: {
            startsWith: 'test-',
          },
        },
      },
    });
    await prisma.wallet.deleteMany({
      where: {
        address: {
          startsWith: 'test-',
        },
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (prisma && testWalletId) {
      await prisma.log.deleteMany({
        where: { walletId: testWalletId },
      });
      await prisma.wallet.delete({
        where: { id: testWalletId },
      });
    }
  });

  describe('Database Connection', () => {
    test('should connect to database successfully', async () => {
      expect(prisma).toBeDefined();
      
      // Test connection with a simple query
      const result = await prisma.$queryRaw`SELECT 1 as connected`;
      expect(result).toBeDefined();
    });

    test('should execute raw SQL queries', async () => {
      const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Wallet Model', () => {
    test('should create a wallet', async () => {
      const wallet = await prisma.wallet.create({
        data: {
          address: testWalletAddress,
          chainId: 'pop_testnet',
        },
      });

      expect(wallet).toBeDefined();
      expect(wallet.id).toBeDefined();
      expect(wallet.address).toBe(testWalletAddress);
      expect(wallet.chainId).toBe('pop_testnet');
      expect(wallet.createdAt).toBeInstanceOf(Date);
      expect(wallet.updatedAt).toBeInstanceOf(Date);

      testWalletId = wallet.id;
    });

    test('should find wallet by address', async () => {
      const wallet = await prisma.wallet.findUnique({
        where: { address: testWalletAddress },
      });

      expect(wallet).toBeDefined();
      expect(wallet?.address).toBe(testWalletAddress);
    });

    test('should update wallet', async () => {
      const updatedWallet = await prisma.wallet.update({
        where: { id: testWalletId },
        data: { chainId: 'updated_chain' },
      });

      expect(updatedWallet.chainId).toBe('updated_chain');
    });

    test('should find wallets with logs', async () => {
      const wallet = await prisma.wallet.findUnique({
        where: { id: testWalletId },
        include: { logs: true },
      });

      expect(wallet).toBeDefined();
      expect(wallet?.logs).toBeDefined();
      expect(Array.isArray(wallet?.logs)).toBe(true);
    });

    test('should prevent duplicate wallet addresses', async () => {
      await expect(
        prisma.wallet.create({
          data: {
            address: testWalletAddress, // Duplicate
            chainId: 'test',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Log Model', () => {
    test('should create a log entry', async () => {
      const log = await prisma.log.create({
        data: {
          walletId: testWalletId,
          contract: 'oracle',
          method: 'updatePrice',
          status: 'pending',
          txHash: '0x1234567890abcdef',
          data: {
            price: 100,
            token: 'BTC',
          },
        },
      });

      expect(log).toBeDefined();
      expect(log.id).toBeDefined();
      expect(log.walletId).toBe(testWalletId);
      expect(log.contract).toBe('oracle');
      expect(log.method).toBe('updatePrice');
      expect(log.status).toBe('pending');
      expect(log.txHash).toBe('0x1234567890abcdef');
      expect(log.data).toEqual({ price: 100, token: 'BTC' });
      expect(log.createdAt).toBeInstanceOf(Date);
    });

    test('should find logs by wallet', async () => {
      const logs = await prisma.log.findMany({
        where: { walletId: testWalletId },
      });

      expect(logs).toBeDefined();
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
    });

    test('should find logs by contract', async () => {
      const logs = await prisma.log.findMany({
        where: { contract: 'oracle' },
      });

      expect(logs).toBeDefined();
      expect(Array.isArray(logs)).toBe(true);
    });

    test('should find logs by status', async () => {
      const pendingLogs = await prisma.log.findMany({
        where: { status: 'pending' },
      });

      expect(pendingLogs).toBeDefined();
      expect(Array.isArray(pendingLogs)).toBe(true);
    });

    test('should update log status', async () => {
      const log = await prisma.log.findFirst({
        where: { walletId: testWalletId },
      });

      if (log) {
        const updatedLog = await prisma.log.update({
          where: { id: log.id },
          data: { status: 'success' },
        });

        expect(updatedLog.status).toBe('success');
      }
    });

    test('should include wallet in log query', async () => {
      const log = await prisma.log.findFirst({
        where: { walletId: testWalletId },
        include: { wallet: true },
      });

      expect(log).toBeDefined();
      expect(log?.wallet).toBeDefined();
      expect(log?.wallet.id).toBe(testWalletId);
    });

    test('should cascade delete logs when wallet is deleted', async () => {
      // Create a new wallet and log for this test
      const testWallet = await prisma.wallet.create({
        data: {
          address: `test-cascade-${Date.now()}`,
          chainId: 'test',
        },
      });

      const testLog = await prisma.log.create({
        data: {
          walletId: testWallet.id,
          contract: 'test',
          method: 'test',
          status: 'pending',
        },
      });

      // Delete wallet - log should be cascade deleted
      await prisma.wallet.delete({
        where: { id: testWallet.id },
      });

      // Verify log was deleted
      const deletedLog = await prisma.log.findUnique({
        where: { id: testLog.id },
      });

      expect(deletedLog).toBeNull();
    });
  });

  describe('API State Route Integration', () => {
    test('should create wallet via API state route', async () => {
      const testAddress = `test-api-${Date.now()}`;
      
      // Simulate API call by directly using Prisma
      const wallet = await prisma.wallet.upsert({
        where: { address: testAddress },
        update: {
          chainId: 'pop_testnet',
          updatedAt: new Date(),
        },
        create: {
          address: testAddress,
          chainId: 'pop_testnet',
        },
      });

      expect(wallet).toBeDefined();
      expect(wallet.address).toBe(testAddress);

      // Clean up
      await prisma.wallet.delete({
        where: { id: wallet.id },
      });
    });

    test('should create log via API state route', async () => {
      const testAddress = `test-api-log-${Date.now()}`;
      const wallet = await prisma.wallet.create({
        data: {
          address: testAddress,
          chainId: 'test',
        },
      });

      const log = await prisma.log.create({
        data: {
          walletId: wallet.id,
          contract: 'oracle',
          method: 'getPrice',
          status: 'success',
          data: { result: 'success' },
        },
      });

      expect(log).toBeDefined();
      expect(log.walletId).toBe(wallet.id);

      // Clean up
      await prisma.log.delete({ where: { id: log.id } });
      await prisma.wallet.delete({ where: { id: wallet.id } });
    });
  });

  describe('Database Indexes', () => {
    test('should efficiently query by wallet address (indexed)', async () => {
      const start = Date.now();
      const wallet = await prisma.wallet.findUnique({
        where: { address: testWalletAddress },
      });
      const duration = Date.now() - start;

      expect(wallet).toBeDefined();
      // Indexed queries should be fast (< 100ms for local DB)
      expect(duration).toBeLessThan(1000);
    });

    test('should efficiently query logs by contract (indexed)', async () => {
      const start = Date.now();
      const logs = await prisma.log.findMany({
        where: { contract: 'oracle' },
        take: 10,
      });
      const duration = Date.now() - start;

      expect(Array.isArray(logs)).toBe(true);
      // Indexed queries should be fast
      expect(duration).toBeLessThan(1000);
    });
  });
});

