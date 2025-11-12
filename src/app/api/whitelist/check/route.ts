import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/lib/api/types';

// GET /api/whitelist/check?address=xxx - Check if an address is whitelisted
export async function GET(request: Request): Promise<NextResponse<ApiResponse<{ whitelisted: boolean }>>> {
  try {
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database not configured. Please set DATABASE_URL environment variable.' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    const whitelistEntry = await prisma.whitelist.findUnique({
      where: { address: address.trim() },
    });

    return NextResponse.json({
      success: true,
      data: { whitelisted: !!whitelistEntry },
    });
  } catch (error) {
    console.error('Error checking whitelist:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check whitelist',
      },
      { status: 500 }
    );
  }
}

