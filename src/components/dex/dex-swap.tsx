'use client';

import { useState } from 'react';
import { useContract, useContractTx } from 'typink';
import type { DexContractApi } from '@/lib/contracts/dex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, ArrowLeftRight, TrendingUp } from 'lucide-react';

export default function DexSwap() {
  const { contract: dexContract } = useContract<DexContractApi>('dex');
  const { selectedAccount } = useWallet();
  const [fromToken, setFromToken] = useState('');
  const [toToken, setToToken] = useState('');
  const [amount, setAmount] = useState('');
  const [path, setPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Transaction hooks
  const swapTx = useContractTx(dexContract, 'swap');

  // Query hooks
  const { data: swapQuote, isLoading: isLoadingQuote } = useContractQuery(
    dexContract,
    'getSwapQuote',
    fromToken && toToken && amount ? [fromToken, toToken, BigInt(amount)] : null
  );

  const handleSwap = async () => {
    if (!fromToken || !toToken || !amount) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const pathArray = path ? path.split(',').map(p => p.trim()) : [fromToken, toToken];
      const tx = swapTx.tx(fromToken, toToken, BigInt(amount), pathArray);
      const hash = await tx.signAndSend(selectedAccount?.address);
      setResult({ type: 'swap', hash, fromToken, toToken, amount });
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
                <Label>From Token</Label>
                <Input
                  value={fromToken}
                  onChange={(e) => setFromToken(e.target.value)}
                  placeholder="Enter token address"
                />
              </div>
              <div className="space-y-2">
                <Label>To Token</Label>
                <Input
                  value={toToken}
                  onChange={(e) => setToToken(e.target.value)}
                  placeholder="Enter token address"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount to swap"
                type="number"
              />
            </div>

            <div className="space-y-2">
              <Label>Swap Path (optional)</Label>
              <Input
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
