import { test, expect, describe } from 'vitest';
import { GET } from '@/app/api/oracle/route';

describe('/api/oracle', () => {
  describe('GET /api/oracle', () => {
    test('should return token data for valid symbols using CoinGecko fallback', async () => {
      // Mock fetch to use CoinGecko (free API, no key needed)
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async (url: string) => {
        if (typeof url === 'string' && url.includes('coingecko.com')) {
          return {
            ok: true,
            json: async () => ({
              bitcoin: {
                usd: 43250.50,
                usd_market_cap: 850000000000,
                usd_24h_vol: 25000000000,
              },
              ethereum: {
                usd: 2650.75,
                usd_market_cap: 320000000000,
                usd_24h_vol: 12000000000,
              },
            }),
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      }) as any;

      try {
        const url = new URL('http://localhost:3000/api/oracle?symbols=BTC,ETH');
        const request = new Request(url.toString());

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.BTC).toBeDefined();
        expect(data.data.ETH).toBeDefined();
        expect(data.data.BTC.price).toBeGreaterThan(0);
        expect(data.data.ETH.price).toBeGreaterThan(0);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test('should return error when symbols parameter is missing', async () => {
      const url = new URL('http://localhost:3000/api/oracle');
      const request = new Request(url.toString());

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('symbols parameter is required');
    });

    test('should return error when symbols parameter is empty', async () => {
      const url = new URL('http://localhost:3000/api/oracle?symbols=');
      const request = new Request(url.toString());

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(['symbols parameter is required', 'At least one symbol is required']).toContain(data.error);
    });

    test('should return error when no token data is found', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async () => ({
        ok: false,
        status: 404,
      })) as any;

      try {
        const url = new URL('http://localhost:3000/api/oracle?symbols=INVALIDTOKEN123');
        const request = new Request(url.toString());

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error).toContain('No token data found');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test('should handle fetch errors gracefully', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async () => {
        throw new Error('Network error');
      }) as any;

      try {
        const url = new URL('http://localhost:3000/api/oracle?symbols=BTC');
        const request = new Request(url.toString());

        const response = await GET(request);
        const data = await response.json();

        // When all fetchers fail, we get 404 (no data found) which is correct behavior
        expect([404, 500]).toContain(response.status);
        expect(data.success).toBe(false);
        // Error could be either "No token data found" or "Network error"
        expect(data.error).toBeDefined();
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test('should handle multiple symbols with whitespace', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async (url: string) => {
        if (typeof url === 'string' && url.includes('coingecko.com')) {
          return {
            ok: true,
            json: async () => ({
              bitcoin: { usd: 43250.50, usd_market_cap: 850000000000, usd_24h_vol: 25000000000 },
            }),
          } as Response;
        }
        return { ok: false } as Response;
      }) as any;

      try {
        const url = new URL('http://localhost:3000/api/oracle?symbols=BTC%2C%20ETH%2C%20DOT');
        const request = new Request(url.toString());

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
