import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/lib/api/types';

// DELETE /api/whitelist/[id] - Remove a whitelisted address
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    if (!prisma) {
      return NextResponse.json(
        { success: false, error: 'Database not configured. Please set DATABASE_URL environment variable.' },
        { status: 503 }
      );
    }

    const { id } = await params;

    await prisma.whitelist.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Whitelist entry deleted successfully' },
    });
  } catch (error) {
    console.error('Error deleting whitelist entry:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete whitelist entry',
      },
      { status: 500 }
    );
  }
}

