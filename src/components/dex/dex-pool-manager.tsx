'use client';

import { useState } from 'react';
import { useContract, useContractTx, useContractQuery } from 'typink';
import type { DexContractApi } from '@/lib/contracts/dex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Wallet, Plus, Loader2, RefreshCw, AlertTriangle, Info } from 'lucide-react';
import { LabelWithHelp } from '@/components/ui/field-help';
import { txToaster } from '@/utils/txToaster';
import { DEPLOYED_TOKENS, getDeployedToken } from '@/lib/token-deployments';
import { USDC_TOKEN_ADDRESS } from '@/lib/contract-addresses';

export default function DexPoolManager() {
  const { contract: dexContract } = useContract<DexContractApi>('dex');
  const [tokenA, setTokenA] = useState('');
  const [tokenB, setTokenB] = useState('');
  const [reserveA, setReserveA] = useState('');
  const [reserveB, setReserveB] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Transaction hooks
  const setPoolTx = useContractTx(dexContract, 'setPool');

  // Query hooks for verification - use dummy address when not set
  const tokenPriceAQuery = useContractQuery({
    contract: dexContract,
    fn: 'getTokenPrice',
    args: [((tokenA && tokenA.startsWith('0x') && tokenA.length === 42) ? tokenA : '0x0000000000000000000000000000000000000000') as `0x${string}`],
  });

  const tokenPriceBQuery = useContractQuery({
    contract: dexContract,
    fn: 'getTokenPrice',
    args: [((tokenB && tokenB.startsWith('0x') && tokenB.length === 42) ? tokenB : '0x0000000000000000000000000000000000000000') as `0x${string}`],
  });

  const handleSetPool = async () => {
    if (!tokenA || !tokenB || !reserveA || !reserveB) {
      setError('Please fill in all fields');
      return;
    }

    // Validate addresses
    if (!tokenA.startsWith('0x') || tokenA.length !== 42) {
      setError('Token A must be a valid hex address (0x...)');
      return;
    }

    if (!tokenB.startsWith('0x') || tokenB.length !== 42) {
      setError('Token B must be a valid hex address (0x...)');
      return;
    }

    if (tokenA.toLowerCase() === tokenB.toLowerCase()) {
      setError('Token A and Token B must be different');
      return;
    }

    // Validate reserves
    const reserveANum = BigInt(reserveA);
    const reserveBNum = BigInt(reserveB);

    if (reserveANum <= 0n) {
      setError('Reserve A must be greater than 0');
      return;
    }

    if (reserveBNum <= 0n) {
      setError('Reserve B must be greater than 0');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    const toaster = txToaster('Creating liquidity pool...');

    try {
      toaster.onTxPending();
      
      await setPoolTx.signAndSend({
        args: [tokenA as `0x${string}`, tokenB as `0x${string}`, reserveANum, reserveBNum],
        callback: (progress) => {
          toaster.onTxProgress(progress);
          if (progress.status.type === 'BestChainBlockIncluded' && !progress.dispatchError) {
            setResult({ 
              type: 'setPool', 
              hash: 'success', 
              tokenA, 
              tokenB,
              reserveA,
              reserveB,
            });
            // Clear form
            setTokenA('');
            setTokenB('');
            setReserveA('');
            setReserveB('');
            // Refresh price queries
            tokenPriceAQuery.refresh();
            tokenPriceBQuery.refresh();
          }
        }
      });
    } catch (err: any) {
      console.error('Error setting pool:', err);
      toaster.onTxError(err instanceof Error ? err : new Error('Unknown error'));
      setError(`Error setting pool: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get token symbol from address
  const getTokenSymbol = (address: string) => {
    const normalized = address.toLowerCase();
    const token = Object.values(DEPLOYED_TOKENS).find(
      (t) => 'contractAddress' in t && typeof t.contractAddress === 'string' && t.contractAddress.toLowerCase() === normalized
    );
    return token?.symbol || 'Unknown';
  };

  const formatAmount = (amount: bigint | string) => {
    const num = typeof amount === 'string' ? BigInt(amount) : amount;
    return `${(Number(num) / 1e18).toFixed(4)}`;
  };

  // Get deployed tokens for quick selection
  const deployedTokensList = Object.values(DEPLOYED_TOKENS).filter(
    (t) => 'contractAddress' in t && typeof t.contractAddress === 'string'
  );

  return (
    <div className="space-y-6">
      {/* Phase 5.1 Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Phase 5.1: Create Liquidity Pools</strong> - Set up liquidity pools for token swaps during portfolio rebalancing. 
          Each pool requires two tokens and their initial reserves. The DEX uses these pools to execute swaps when the portfolio rebalances.
        </AlertDescription>
      </Alert>

      {/* Create Pool Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Liquidity Pool
          </CardTitle>
          <CardDescription>
            Set up a new liquidity pool for token swaps (Phase 5.1)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Token Selection */}
          {deployedTokensList.length > 0 && (
            <div className="space-y-2">
              <Label>Quick Select Deployed Tokens</Label>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg max-h-40 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {deployedTokensList.map((token) => {
                    const address = 'contractAddress' in token ? token.contractAddress : '';
                    const symbol = token.symbol || 'Unknown';
                    return (
                      <button
                        key={address}
                        onClick={() => {
                          if (!tokenA) {
                            setTokenA(address);
                          } else if (!tokenB && address !== tokenA) {
                            setTokenB(address);
                          }
                        }}
                        className="px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded text-sm transition-colors"
                        title={`${token.name || symbol} - ${address}`}
                      >
                        {symbol}
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Click a token to set it as Token A or Token B. USDC address: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{USDC_TOKEN_ADDRESS}</code>
              </p>
            </div>
          )}

          {/* Set Pool Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="tokenA"
                  helpText="The contract address of the first token in the pool (Token A). Enter a valid hex address starting with 0x. This token will be paired with Token B to create a trading pair. Example: DOT token address or USDC address."
                >
                  Token A Address *
                </LabelWithHelp>
                <Input
                  id="tokenA"
                  value={tokenA}
                  onChange={(e) => setTokenA(e.target.value.trim())}
                  placeholder="0x..."
                  disabled={isLoading}
                  className="font-mono text-sm"
                />
                {tokenA && (
                  <p className="text-xs text-gray-500">
                    {getTokenSymbol(tokenA)} {tokenA.length === 42 ? '✓' : '✗ Invalid address'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="tokenB"
                  helpText={`The contract address of the second token in the pool (Token B). Enter a valid hex address starting with 0x. This token will be paired with Token A to create a trading pair. Typically USDC (${USDC_TOKEN_ADDRESS}) for testnet.`}
                >
                  Token B Address *
                </LabelWithHelp>
                <Input
                  id="tokenB"
                  value={tokenB}
                  onChange={(e) => setTokenB(e.target.value.trim())}
                  placeholder="0x..."
                  disabled={isLoading}
                  className="font-mono text-sm"
                />
                {tokenB && (
                  <p className="text-xs text-gray-500">
                    {getTokenSymbol(tokenB)} {tokenB.length === 42 ? '✓' : '✗ Invalid address'}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="reserveA"
                  helpText="The initial reserve amount for Token A in the pool. Enter the amount in the token's smallest unit (e.g., for 18 decimals, 1 token = 1000000000000000000). This represents how much Token A is available for swaps. Higher reserves provide better liquidity and lower slippage."
                >
                  Reserve A (Token A amount) *
                </LabelWithHelp>
                <Input
                  id="reserveA"
                  value={reserveA}
                  onChange={(e) => setReserveA(e.target.value)}
                  placeholder="e.g., 1000000000000000000000000"
                  type="number"
                  min="0"
                  disabled={isLoading}
                  className="font-mono text-sm"
                />
                {reserveA && !isNaN(Number(reserveA)) && (
                  <p className="text-xs text-gray-500">
                    ≈ {formatAmount(reserveA)} tokens (assuming 18 decimals)
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="reserveB"
                  helpText="The initial reserve amount for Token B in the pool. Enter the amount in the token's smallest unit (e.g., for 18 decimals, 1 token = 1000000000000000000). This represents how much Token B is available for swaps. The ratio of Reserve A to Reserve B determines the initial exchange rate."
                >
                  Reserve B (Token B amount) *
                </LabelWithHelp>
                <Input
                  id="reserveB"
                  value={reserveB}
                  onChange={(e) => setReserveB(e.target.value)}
                  placeholder="e.g., 7500000000000000000000000"
                  type="number"
                  min="0"
                  disabled={isLoading}
                  className="font-mono text-sm"
                />
                {reserveB && !isNaN(Number(reserveB)) && (
                  <p className="text-xs text-gray-500">
                    ≈ {formatAmount(reserveB)} tokens (assuming 18 decimals)
                  </p>
                )}
              </div>
            </div>

            {/* Exchange Rate Preview */}
            {reserveA && reserveB && !isNaN(Number(reserveA)) && !isNaN(Number(reserveB)) && Number(reserveA) > 0 && Number(reserveB) > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Initial Exchange Rate Preview
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <div>1 {getTokenSymbol(tokenA)} = {formatAmount((BigInt(reserveB) * BigInt(1e18)) / BigInt(reserveA))} {getTokenSymbol(tokenB)}</div>
                  <div>1 {getTokenSymbol(tokenB)} = {formatAmount((BigInt(reserveA) * BigInt(1e18)) / BigInt(reserveB))} {getTokenSymbol(tokenA)}</div>
                </div>
              </div>
            )}

            <Button
              onClick={handleSetPool}
              disabled={!tokenA || !tokenB || !reserveA || !reserveB || isLoading || setPoolTx.inBestBlockProgress}
              className="w-full"
              size="lg"
            >
              {isLoading || setPoolTx.inBestBlockProgress ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Pool...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Liquidity Pool
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          {result && result.type === 'setPool' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>Pool created successfully!</strong> {getTokenSymbol(result.tokenA)}/{getTokenSymbol(result.tokenB)} pool is now active with reserves: 
                {formatAmount(result.reserveA)} {getTokenSymbol(result.tokenA)} and {formatAmount(result.reserveB)} {getTokenSymbol(result.tokenB)}.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Pool Verification Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Pool Verification
          </CardTitle>
          <CardDescription>
            Verify pool setup and token prices (Phase 5.1)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> The DEX contract doesn't expose pool query methods, but you can verify pools by checking token prices. 
              If a pool exists, token prices should be available.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Token A Price */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <Label>Token A Price</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => tokenPriceAQuery.refresh()}
                  disabled={!tokenA || tokenPriceAQuery.isLoading}
                >
                  <RefreshCw className={`h-3 w-3 ${tokenPriceAQuery.isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              {tokenA && tokenA.startsWith('0x') && tokenA.length === 42 ? (
                tokenPriceAQuery.isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-500">Loading...</span>
                  </div>
                ) : tokenPriceAQuery.data ? (
                  <div className="space-y-1">
                    <div className="text-lg font-bold">
                      {tokenPriceAQuery.data.isOk ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Price Available
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <XCircle className="h-3 w-3 mr-1" />
                          No Price
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-mono">
                      {getTokenSymbol(tokenA)}: {tokenA.slice(0, 10)}...
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Click refresh to check price</p>
                )
              ) : (
                <p className="text-sm text-gray-500">Enter valid Token A address above</p>
              )}
            </div>

            {/* Token B Price */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <Label>Token B Price</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => tokenPriceBQuery.refresh()}
                  disabled={!tokenB || tokenPriceBQuery.isLoading}
                >
                  <RefreshCw className={`h-3 w-3 ${tokenPriceBQuery.isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              {tokenB && tokenB.startsWith('0x') && tokenB.length === 42 ? (
                tokenPriceBQuery.isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-500">Loading...</span>
                  </div>
                ) : tokenPriceBQuery.data ? (
                  <div className="space-y-1">
                    <div className="text-lg font-bold">
                      {tokenPriceBQuery.data.isOk ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Price Available
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <XCircle className="h-3 w-3 mr-1" />
                          No Price
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-mono">
                      {getTokenSymbol(tokenB)}: {tokenB.slice(0, 10)}...
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Click refresh to check price</p>
                )
              ) : (
                <p className="text-sm text-gray-500">Enter valid Token B address above</p>
              )}
            </div>
          </div>

          {/* Expected Result Info */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Phase 5.1 Verification:</strong> After creating a pool, you should be able to:
              <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                <li>Query token prices for both tokens in the pool</li>
                <li>Execute swaps between the two tokens</li>
                <li>Use the pool for portfolio rebalancing operations</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
