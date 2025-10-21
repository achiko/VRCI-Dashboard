'use client';

import { useState } from 'react';
import { useContract, useContractTx } from 'typink';
import type { DexContractApi } from '@/lib/contracts/dex';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Wallet, Plus } from 'lucide-react';

export default function DexPoolManager() {
  const { contract: dexContract } = useContract<DexContractApi>('dex');
  const { selectedAccount } = useWallet();
  const [tokenA, setTokenA] = useState('');
  const [tokenB, setTokenB] = useState('');
  const [reserveA, setReserveA] = useState('');
  const [reserveB, setReserveB] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Transaction hooks
  const setPoolTx = useContractTx(dexContract, 'setPool');

  // Query hooks
  const { data: totalPools, isLoading: isLoadingTotalPools } = useContractQuery(
    dexContract,
    'getTotalPools',
    []
  );

  const { data: poolInfo, isLoading: isLoadingPoolInfo } = useContractQuery(
    dexContract,
    'getPoolInfo',
    tokenA && tokenB ? [tokenA, tokenB] : null
  );

  const handleSetPool = async () => {
    if (!tokenA || !tokenB || !reserveA || !reserveB) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const tx = setPoolTx.tx(tokenA, tokenB, BigInt(reserveA), BigInt(reserveB));
      const hash = await tx.signAndSend(selectedAccount?.address);
      setResult({ type: 'setPool', hash, tokenA, tokenB });
    } catch (err: any) {
      setError(`Error setting pool: ${err.message}`);
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
            <Wallet className="h-5 w-5" />
            Pool Management
          </CardTitle>
          <CardDescription>
            Manage liquidity pools and pool configurations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Pools */}
          <div className="space-y-2">
            <Label>Total Pools</Label>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {totalPools || 0}
              </div>
            </div>
          </div>

          {/* Pool Info */}
          {poolInfo && (
            <div className="space-y-2">
              <Label>Pool Information</Label>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div><strong>Token A:</strong> {poolInfo.tokenA}</div>
                  <div><strong>Token B:</strong> {poolInfo.tokenB}</div>
                  <div><strong>Reserve A:</strong> {formatAmount(poolInfo.reserveA || BigInt(0))}</div>
                  <div><strong>Reserve B:</strong> {formatAmount(poolInfo.reserveB || BigInt(0))}</div>
                </div>
              </div>
            </div>
          )}

          {/* Set Pool */}
          <div className="space-y-4">
            <h3 className="font-medium">Set Pool</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Token A</Label>
                <Input
                  value={tokenA}
                  onChange={(e) => setTokenA(e.target.value)}
                  placeholder="Enter token A address"
                />
              </div>
              <div className="space-y-2">
                <Label>Token B</Label>
                <Input
                  value={tokenB}
                  onChange={(e) => setTokenB(e.target.value)}
                  placeholder="Enter token B address"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reserve A</Label>
                <Input
                  value={reserveA}
                  onChange={(e) => setReserveA(e.target.value)}
                  placeholder="Enter reserve A amount"
                  type="number"
                />
              </div>
              <div className="space-y-2">
                <Label>Reserve B</Label>
                <Input
                  value={reserveB}
                  onChange={(e) => setReserveB(e.target.value)}
                  placeholder="Enter reserve B amount"
                  type="number"
                />
              </div>
            </div>

            <Button
              onClick={handleSetPool}
              disabled={!tokenA || !tokenB || !reserveA || !reserveB || isLoading}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Set Pool
            </Button>
          </div>

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
            <p><strong>Pool Management:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Create and manage liquidity pools</li>
              <li>Set initial reserves for trading pairs</li>
              <li>Monitor pool liquidity and reserves</li>
              <li>Admin functions for pool configuration</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
