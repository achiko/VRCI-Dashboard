import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ContractPromise } from '@polkadot/api-contract';
import { getPolkadotClient } from '@/lib/polkadotClient';
import { contractTxSchema } from '@/lib/api/schemas';
import type { ApiResponse } from '@/lib/api/types';

/**
 * POST /api/contracts/[name]/tx
 * Generic contract write (transaction) operation
 * 
 * Note: This endpoint prepares the transaction but does not sign it.
 * The actual signing should be done on the client side using the wallet.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
): Promise<NextResponse<ApiResponse<{ txHash?: string; extrinsic?: unknown }>>> {
  try {
    const { name } = await params;
    const body = await request.json();

    // Validate request body
    const validationResult = contractTxSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${validationResult.error.issues.map((e) => e.message).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const { method, args = [], signer, value, address } = validationResult.data;

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

    // Get contract address from request body or environment
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

    if (!signer) {
      return NextResponse.json(
        { success: false, error: 'Signer address is required for transactions' },
        { status: 400 }
      );
    }

    // Connect to Polkadot
    const api = await getPolkadotClient();
    const contract = new ContractPromise(api, metadata, contractAddress);

    // Find the method in metadata - try multiple formats
    // First try exact match, then try camelCase variations
    let message = contract.abi.messages.find((m) => m.identifier === method);
    
    if (!message) {
      // Try camelCase version (e.g., "mintTo" -> "mintTo")
      message = contract.abi.messages.find((m) => {
        const camelCase = m.identifier.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        return camelCase === method || m.identifier === method;
      });
    }
    
    if (!message) {
      // Try snake_case version (e.g., "mintTo" -> "mint_to")
      message = contract.abi.messages.find((m) => {
        const snakeCase = method.replace(/([A-Z])/g, '_$1').toLowerCase();
        return m.identifier === snakeCase || m.identifier === method;
      });
    }
    
    if (!message) {
      const availableMethods = contract.abi.messages.map((m) => m.identifier).slice(0, 20);
      return NextResponse.json(
        { 
          success: false, 
          error: `Method ${method} not found. Available methods: ${availableMethods.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Build the transaction
    // Create WeightV2 using registry
    const gasLimit = api.registry.createType('WeightV2', {
      refTime: 100000000000,
      proofSize: 1000000,
    }) as any; // Type assertion needed for Polkadot.js compatibility

    const storageDepositLimit = null;
    
    // Create the extrinsic (unsigned transaction)
    const txOptions: {
      gasLimit: any;
      storageDepositLimit: null;
      value?: string;
    } = {
      gasLimit,
      storageDepositLimit,
    };
    
    if (value) {
      txOptions.value = value;
    }

    const extrinsic = contract.tx[method](
      txOptions,
      ...args
    );

    // Return the extrinsic for client-side signing
    // In a real implementation, you might want to sign it server-side if you have the key
    return NextResponse.json({
      success: true,
      data: {
        extrinsic: extrinsic.toJSON(),
        // Note: txHash will be available after the transaction is signed and submitted
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

