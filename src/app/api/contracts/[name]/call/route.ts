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
    
    // Helper function to convert H160 (20 bytes) to AccountId (32 bytes)
    // For EVM-compatible chains, H160 addresses are padded with zeros
    const convertH160ToAccountId = (h160Address: string): string => {
      // If already 32 bytes (66 hex chars with 0x), return as-is
      if (h160Address.startsWith('0x') && h160Address.length === 66) {
        return h160Address;
      }
      // If H160 (20 bytes = 42 hex chars with 0x), pad with zeros
      if (h160Address.startsWith('0x') && h160Address.length === 42) {
        return '0x000000000000000000000000' + h160Address.slice(2);
      }
      // Otherwise return as-is (might be SS58 or already AccountId)
      return h160Address;
    };
    
    // Convert address arguments from H160 to AccountId if needed
    const convertedArgs = args.map((arg: any) => {
      if (typeof arg === 'string' && arg.startsWith('0x') && arg.length === 42) {
        // This is an H160 address, convert to AccountId
        return convertH160ToAccountId(arg);
      }
      return arg;
    });

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
    
    // Ensure API is ready
    if (!api.isConnected) {
      await api.isReady;
    }
    
    const contract = new ContractPromise(api, metadata, contractAddress);

    // Find the method in RAW metadata (not contract.abi.messages)
    // contract.abi.messages doesn't have 'label' property, only 'identifier' and 'method'
    // We need to search the raw metadata.spec.messages which has 'label'
    const rawMessages = metadata.spec?.messages || [];
    
    // Convert method name to metadata label format if needed
    // Input: "psp22::balanceOf" -> Find: "PSP22::balance_of"
    // Input: "psp22Metadata::tokenName" -> Find: "PSP22Metadata::token_name"
    let labelToFind = method;
    if (method.includes('::')) {
      const [prefix, methodName] = method.split('::');
      // Convert prefix: "psp22" -> "PSP22", "psp22Metadata" -> "PSP22Metadata"
      let prefixCapitalized: string;
      if (prefix.startsWith('psp22')) {
        // Replace "psp22" with "PSP22", keep the rest as-is (e.g., "Metadata")
        prefixCapitalized = prefix.replace(/^psp22/, 'PSP22');
      } else {
        // Fallback: capitalize first letter
        prefixCapitalized = prefix.charAt(0).toUpperCase() + prefix.slice(1);
      }
      
      // Convert method name from camelCase to snake_case
      const snakeCaseMethod = methodName
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase();
      
      labelToFind = `${prefixCapitalized}::${snakeCaseMethod}`;
    }
    
    // Find message in raw metadata by label
    const rawMessage = rawMessages.find((m: any) => m.label === labelToFind);
    
    if (!rawMessage) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Method ${method} not found. Available labels: ${rawMessages.slice(0, 20).map((m: any) => m.label || 'N/A').filter((id: string) => id !== 'N/A').join(', ')}` 
        },
        { status: 400 }
      );
    }
    
    // Convert label to ContractPromise method format
    // Label: "PSP22::balance_of" -> ContractPromise: "psp22::balanceOf"
    const label = rawMessage.label;
    const contractPromiseMethod = label
      .replace(/^PSP22/, 'psp22')
      .replace(/^PSP22Metadata/, 'psp22Metadata')
      .replace(/^PSP22Mintable/, 'psp22Mintable')
      .replace(/^PSP22Burnable/, 'psp22Burnable')
      .replace(/_([a-z])/g, (_: string, letter: string) => letter.toUpperCase());
    
    // Execute the query using ContractPromise method
    // TODO: callerAddress is hardcoded and needs investigation.
    const callerAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
    const gasLimit = api.registry.createType('WeightV2', {
      refTime: 100000000000,
      proofSize: 1000000,
    }) as any;
    
    const queryMethod = (contract.query as any)[contractPromiseMethod];
    if (!queryMethod || typeof queryMethod !== 'function') {
      const availableMethods = Object.keys(contract.query || {}).filter(k => typeof contract.query[k] === 'function');
      return NextResponse.json(
        {
          success: false,
          error: `Method ${contractPromiseMethod} not found on contract.query. Available methods: ${availableMethods.slice(0, 15).join(', ')}`,
        },
        { status: 500 }
      );
    }
    
    const result = await queryMethod(
      callerAddress,
      { gasLimit },
      ...convertedArgs
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

    // Handle different output formats
    let outputData: unknown;
    if (result.output) {
      // Try toJSON first (for complex types)
      try {
        const jsonData = result.output.toJSON();
        
        // Helper function to recursively extract string from Option<String>
        // Typink automatically unwraps Option<String> to just the string value
        // ContractPromise returns { Ok: "value" } or null, so we need to extract it
        const extractStringValue = (data: any): any => {
          if (data === null || data === undefined) {
            return null;
          }
          
          // If it's already a string, return it (this is what Typink returns)
          if (typeof data === 'string') {
            return data;
          }
          
          // If it's a number, return it as-is (for decimals)
          if (typeof data === 'number') {
            return data;
          }
          
          // If it's an object, try to extract the value from Option<String>
          if (data && typeof data === 'object' && !Array.isArray(data)) {
            // Check for Ok/Some variants (case-insensitive)
            // ContractPromise returns { Ok: "value" } for Option<String>
            if ('Ok' in data) {
              const okValue = data.Ok;
              // If Ok is null, it means Option::None
              if (okValue === null || okValue === undefined) {
                return null;
              }
              // Recursively extract (in case of nested Option)
              return extractStringValue(okValue);
            }
            if ('ok' in data) {
              const okValue = data.ok;
              if (okValue === null || okValue === undefined) {
                return null;
              }
              return extractStringValue(okValue);
            }
            if ('Some' in data) {
              const someValue = data.Some;
              if (someValue === null || someValue === undefined) {
                return null;
              }
              return extractStringValue(someValue);
            }
            if ('some' in data) {
              const someValue = data.some;
              if (someValue === null || someValue === undefined) {
                return null;
              }
              return extractStringValue(someValue);
            }
            
            // If it's an object with a single key-value pair, extract the value
            const keys = Object.keys(data);
            if (keys.length === 1) {
              const value = data[keys[0]];
              // Skip if the key is something like "isOk" or "isErr"
              if (keys[0] !== 'isOk' && keys[0] !== 'isErr' && keys[0] !== 'value') {
                return extractStringValue(value);
              }
            }
            
            // If we can't extract, return null (not the object)
            // This ensures we don't return [object Object]
            return null;
          }
          
          return data;
        };
        
        outputData = extractStringValue(jsonData);
      } catch {
        // If toJSON fails, try toString
        try {
          const str = result.output.toString();
          // Try to parse as number or BigInt
          if (str && !isNaN(Number(str))) {
            outputData = str;
          } else {
            outputData = str;
          }
        } catch {
          outputData = result.output;
        }
      }
    } else {
      outputData = null;
    }

    return NextResponse.json({
      success: true,
      data: outputData,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
