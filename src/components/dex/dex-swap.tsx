'use client';

import { useState } from 'react';
import { useContract, useContractTx, useContractQuery } from 'typink';
import type { DexContractApi } from '@/lib/contracts/dex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, ArrowLeftRight, TrendingUp } from 'lucide-react';
import { LabelWithHelp } from '@/components/ui/field-help';

export default function DexSwap() {
  const { contract: dexContract } = useContract<DexContractApi>('dex');
  const [fromToken, setFromToken] = useState('');
  const [toToken, setToToken] = useState('');
  const [amount, setAmount] = useState('');
  const [path, setPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Transaction hooks
  const swapTx = useContractTx(dexContract, 'swap');

  // State for swap data
  const [swapQuote, setSwapQuote] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const handleSwap = async () => {
    if (!fromToken || !toToken || !amount) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const pathArray = path ? path.split(',').map(p => p.trim() as `0x${string}`) : [fromToken as `0x${string}`, toToken as `0x${string}`];
      await swapTx.signAndSend({
        args: [fromToken as `0x${string}`, toToken as `0x${string}`, BigInt(amount), pathArray],
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            if (progress.dispatchError) {
              setError('Transaction failed');
            } else {
              setResult({ type: 'swap', hash: 'success', fromToken, toToken, amount });
            }
          }
        }
      });
    } catch (err: any) {
      setError(`Error swapping tokens: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: bigint) => {
    return `${(Number(amount) / 1e18).toFixed(4)}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Token Swap
          </CardTitle>
          <CardDescription>
            Swap tokens using the decentralized exchange
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Swap Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="fromToken"
                  helpText="The token contract address (H160 format: 0x...) you want to swap FROM. This is the token you're selling/exchanging. The token must be supported by the DEX and have sufficient liquidity. Enter the full contract address of the token you want to swap."
                >
                  From Token
                </LabelWithHelp>
                <Input
                  id="fromToken"
                  value={fromToken}
                  onChange={(e) => setFromToken(e.target.value)}
                  placeholder="Enter token address"
                />
              </div>
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="toToken"
                  helpText="The token contract address (H160 format: 0x...) you want to swap TO. This is the token you're buying/receiving. The token must be supported by the DEX and have sufficient liquidity. Enter the full contract address of the token you want to receive."
                >
                  To Token
                </LabelWithHelp>
                <Input
                  id="toToken"
                  value={toToken}
                  onChange={(e) => setToToken(e.target.value)}
                  placeholder="Enter token address"
                />
              </div>
            </div>

            <div className="space-y-2">
              <LabelWithHelp
                htmlFor="swapAmount"
                helpText="The amount of tokens to swap from the 'From Token'. Enter the amount in the token's native units (e.g., if the token has 18 decimals, enter 1.0 for 1 token). The DEX will calculate how much of the 'To Token' you'll receive based on current exchange rates and liquidity pools."
              >
                Amount
              </LabelWithHelp>
              <Input
                id="swapAmount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount to swap"
                type="number"
              />
            </div>

            <div className="space-y-2">
              <LabelWithHelp
                htmlFor="swapPath"
                helpText="Optional swap path for multi-hop swaps. If you want to swap through intermediate tokens, enter a comma-separated list of token addresses. For example: '0xTokenA,0xTokenB' would swap From Token → TokenA → TokenB → To Token. If left empty, the DEX will attempt a direct swap or find the best path automatically."
              >
                Swap Path (optional)
              </LabelWithHelp>
              <Input
                id="swapPath"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="Enter swap path (comma-separated)"
              />
            </div>

            <Button
              onClick={handleSwap}
              disabled={!fromToken || !toToken || !amount || isLoading}
              className="flex items-center gap-2"
            >
              <ArrowLeftRight className="h-4 w-4" />
              Execute Swap
            </Button>
          </div>

          {/* Swap Quote */}
          {swapQuote && (
            <div className="space-y-2">
              <Label>Swap Quote</Label>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-xl font-bold text-green-600">
                  {formatAmount(swapQuote.expectedOutput || BigInt(0))}
                </div>
                <div className="text-sm text-gray-600">Expected output</div>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                {result.type} transaction submitted: {result.hash}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Information */}
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Token Swapping:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Swap tokens with automatic price discovery</li>
              <li>Specify custom swap paths for better rates</li>
              <li>Get quotes before executing swaps</li>
              <li>Integration with Oracle price feeds</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
