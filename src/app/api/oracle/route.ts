import { NextResponse } from 'next/server';
import { fetchOracleData } from '@/lib/api/oracle-fetchers';
import { oracleResponseSchema } from '@/lib/api/oracle-schemas';
import type { ApiResponse } from '@/lib/api/types';
import type { OracleTokenData } from '@/lib/api/oracle-schemas';

/**
 * GET /api/oracle
 * Fetch live token data (price, market cap, volume, ATH/ATL) from external APIs
 * 
 * Query Parameters:
 * - symbols: Comma-separated list of token symbols (e.g., "BTC,ETH,DOT")
 * 
 * Returns normalized token data from CoinMarketCap (primary) with fallbacks to
 * cryptorates.ai and cryptoprices.cc
 */
export async function GET(request: Request): Promise<NextResponse<ApiResponse<Record<string, OracleTokenData>>>> {
  try {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');

    if (!symbolsParam) {
      return NextResponse.json(
        { success: false, error: 'symbols parameter is required' },
        { status: 400 }
      );
    }

    // Parse symbols from comma-separated string
    const symbols = symbolsParam
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (symbols.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one symbol is required' },
        { status: 400 }
      );
    }

    // Get CoinMarketCap API key from environment (server-side only)
    const cmcApiKey = process.env.CMC_API_KEY;

    // Fetch data with fallback chain
    const tokenData = await fetchOracleData(symbols, cmcApiKey);

    // Validate response with Zod
    const validationResult = oracleResponseSchema.safeParse({
      success: true,
      data: tokenData,
    });

    if (!validationResult.success) {
      console.error('Oracle response validation failed:', validationResult.error);
      return NextResponse.json(
        {
          success: false,
          error: `Data validation failed: ${validationResult.error.issues.map((e) => e.message).join(', ')}`,
        },
        { status: 500 }
      );
    }

    // Check if we got any data
    if (Object.keys(tokenData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No token data found for the provided symbols' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tokenData,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Oracle API error:', error);
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

