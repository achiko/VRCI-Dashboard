import { NextResponse } from 'next/server';
import { getPolkadotClient } from '@/lib/polkadotClient';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/lib/api/types';

interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  services: {
    api: 'up' | 'down';
    database: 'up' | 'down';
    polkadot: 'up' | 'down';
  };
  uptime: number;
}

/**
 * GET /api/health
 * System heartbeat and version info
 */
export async function GET(): Promise<NextResponse<ApiResponse<HealthData>>> {
  const startTime = Date.now();
  const services: {
    api: 'up' | 'down';
    database: 'up' | 'down';
    polkadot: 'up' | 'down';
  } = {
    api: 'up',
    database: 'down',
    polkadot: 'down',
  };

  // Check database connection
  if (prisma) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      services.database = 'up';
    } catch (error) {
      console.error('Database health check failed:', error);
    }
  }

  // Check Polkadot connection
  try {
    const api = await getPolkadotClient();
    await api.rpc.system.health();
    services.polkadot = 'up';
  } catch (error) {
    console.error('Polkadot health check failed:', error);
  }

  const allServicesUp = Object.values(services).every((status) => status === 'up');
  const status = allServicesUp ? 'healthy' : services.database === 'down' ? 'unhealthy' : 'degraded';

  const healthData: HealthData = {
    status,
    version: process.env.npm_package_version || '0.1.0',
    timestamp: new Date().toISOString(),
    services,
    uptime: Date.now() - startTime,
  };

  const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

  return NextResponse.json(
    { success: true, data: healthData },
    { status: statusCode }
  );
}

