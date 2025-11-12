import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { ApiResponse } from '@/lib/api/types';

const whitelistCreateSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  note: z.string().optional(),
  addedBy: z.string().optional(),
});

// GET /api/whitelist - List all whitelisted addresses
export async function GET(): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database not configured. Please set DATABASE_URL environment variable.' },
        { status: 503 }
      );
    }

    const whitelist = await prisma.whitelist.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: whitelist,
    });
  } catch (error) {
    console.error('Error fetching whitelist:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch whitelist',
      },
      { status: 500 }
    );
  }
}

// POST /api/whitelist - Add a new whitelisted address
export async function POST(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database not configured. Please set DATABASE_URL environment variable.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validationResult = whitelistCreateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${validationResult.error.issues.map((e) => e.message).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const { address, note, addedBy } = validationResult.data;

    // Check if address already exists
    const existing = await prisma.whitelist.findUnique({
      where: { address: address.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Address ${address.trim()} is already whitelisted` },
        { status: 409 }
      );
    }

    const whitelistEntry = await prisma.whitelist.create({
      data: {
        address: address.trim(),
        note,
        addedBy,
      },
    });

    return NextResponse.json({
      success: true,
      data: whitelistEntry,
    });
  } catch (error) {
    console.error('Error creating whitelist entry:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create whitelist entry',
      },
      { status: 500 }
    );
  }
}

