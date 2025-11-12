import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { walletCreateSchema, logCreateSchema } from '@/lib/api/schemas';
import type { ApiResponse } from '@/lib/api/types';

/**
 * GET /api/state
 * Get off-chain state (wallets, logs, etc.)
 */
export async function GET(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database not configured. Please set DATABASE_URL environment variable.' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'wallets';
    const walletId = searchParams.get('walletId');
    const contract = searchParams.get('contract');

    switch (type) {
      case 'wallets': {
        const wallets = await prisma.wallet.findMany({
          include: {
            logs: {
              take: 10,
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json({ success: true, data: wallets });
      }

      case 'logs': {
        const logs = await prisma.log.findMany({
          where: {
            ...(walletId && { walletId }),
            ...(contract && { contract }),
          },
          include: {
            wallet: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        });
        return NextResponse.json({ success: true, data: logs });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/state
 * Create off-chain state (wallets, logs, etc.)
 */
export async function POST(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database not configured. Please set DATABASE_URL environment variable.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { type } = body;

    switch (type) {
      case 'wallet': {
        const validationResult = walletCreateSchema.safeParse(body);
        if (!validationResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: `Validation error: ${validationResult.error.issues.map((e) => e.message).join(', ')}`,
            },
            { status: 400 }
          );
        }

        const wallet = await prisma.wallet.upsert({
          where: { address: validationResult.data.address },
          update: {
            chainId: validationResult.data.chainId,
            updatedAt: new Date(),
          },
          create: validationResult.data,
        });

        return NextResponse.json({ success: true, data: wallet });
      }

      case 'log': {
        const validationResult = logCreateSchema.safeParse(body);
        if (!validationResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: `Validation error: ${validationResult.error.issues.map((e) => e.message).join(', ')}`,
            },
            { status: 400 }
          );
        }

        const log = await prisma.log.create({
          data: validationResult.data,
          include: {
            wallet: true,
          },
        });

        return NextResponse.json({ success: true, data: log });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

