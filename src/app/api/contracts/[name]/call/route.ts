import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ContractPromise } from '@polkadot/api-contract';
import { getPolkadotClient } from '@/lib/polkadotClient';
import { contractCallSchema } from '@/lib/api/schemas';
import type { ApiResponse } from '@/lib/api/types';

/**
 * POST /api/contracts/[name]/call
 * Generic contract read (query) operation
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const { name } = await params;
    const body = await request.json();

    // Validate request body
    const validationResult = contractCallSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${validationResult.error.issues.map((e) => e.message).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const { method, args = [], address } = validationResult.data;

    // Load contract metadata
    const metadataPath = path.join(
      process.cwd(),
      'src',
      'contracts',
      'metadata',
      `${name}.json`
    );

    if (!fs.existsSync(metadataPath)) {
      return NextResponse.json(
        { success: false, error: `Contract ${name} not found` },
        { status: 404 }
      );
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

    // Get contract address from environment or use provided address
    const contractAddress =
      address ||
      process.env[`NEXT_PUBLIC_${name.toUpperCase()}_ADDRESS`] ||
      '';

    if (!contractAddress) {
      return NextResponse.json(
        { success: false, error: 'Contract address not found' },
        { status: 400 }
      );
    }

    // Connect to Polkadot
    const api = await getPolkadotClient();
    const contract = new ContractPromise(api, metadata, contractAddress);

    // Find the method in metadata
    const message = contract.abi.messages.find((m) => m.identifier === method);
    if (!message) {
      return NextResponse.json(
        { success: false, error: `Method ${method} not found` },
        { status: 400 }
      );
    }

    // Execute the query
    // For queries, gasLimit is optional and can be omitted
    const result = await contract.query[method](
      contractAddress,
      {},
      ...args
    );

    if (result.result.isErr) {
      return NextResponse.json(
        {
          success: false,
          error: `Contract error: ${result.result.asErr.toString()}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.output?.toJSON() || result.output?.toString(),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

