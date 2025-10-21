'use client';

import { useState } from 'react';
import { useContractQuery } from '@dedot/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, TrendingUp, DollarSign } from 'lucide-react';

interface DexPriceViewerProps {
  dexContract: any;
}

export default function DexPriceViewer({ dexContract }: DexPriceViewerProps) {
  const [tokenAddress, setTokenAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Query hooks
  const { data: tokenPrice, isLoading: isLoadingPrice } = useContractQuery(
    dexContract,
    'getTokenPrice',
    tokenAddress ? [tokenAddress] : null
  );

  const { data: totalLiquidity, isLoading: isLoadingLiquidity } = useContractQuery(
    dexContract,
    'getTotalLiquidity',
    []
  );

  const { data: totalVolume, isLoading: isLoadingVolume } = useContractQuery(
    dexContract,
    'getTotalVolume',
    []
  );

  const { data: feeRate, isLoading: isLoadingFeeRate } = useContractQuery(
    dexContract,
    'getFeeRate',
    []
  );

  const handleGetPrice = async () => {
    if (!tokenAddress) {
      setError('Please enter a token address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const result = await dexContract.query.getTokenPrice(tokenAddress);
      setResult({
        tokenAddress,
        price: result
      });
    } catch (err: any) {
      setError(`Error getting token price: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: bigint) => {
    return `${(Number(amount) / 1e18).toFixed(4)}`;
  };

  const formatRate = (rate: bigint) => {
    const percentage = (Number(rate) / 1e18) * 100;
    return `${percentage.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Price Viewer
          </CardTitle>
          <CardDescription>
            View token prices and market data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Market Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {totalLiquidity ? formatAmount(totalLiquidity) : 'Loading...'}
              </div>
              <div className="text-sm text-gray-600">Total Liquidity</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {totalVolume ? formatAmount(totalVolume) : 'Loading...'}
              </div>
              <div className="text-sm text-gray-600">Total Volume</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {feeRate ? formatRate(feeRate) : 'Loading...'}
              </div>
              <div className="text-sm text-gray-600">Fee Rate</div>
            </div>
          </div>

          {/* Token Price Lookup */}
          <div className="space-y-4">
            <h3 className="font-medium">Token Price Lookup</h3>
            <div className="space-y-2">
              <Label>Token Address</Label>
              <Input
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder="Enter token address"
              />
            </div>
            <Button
              onClick={handleGetPrice}
              disabled={!tokenAddress || isLoading}
              className="flex items-center gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Get Price
            </Button>
          </div>

          {/* Price Result */}
          {result && (
            <div className="space-y-2">
              <Label>Token Price</Label>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-xl font-bold text-green-600">
                  {formatAmount(result.price || BigInt(0))}
                </div>
                <div className="text-sm text-gray-600">
                  Price for token: {result.tokenAddress}
                </div>
              </div>
            </div>
          )}

          {/* Query Result */}
          {tokenPrice && (
            <div className="space-y-2">
              <Label>Current Price</Label>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-xl font-bold text-blue-600">
                  {formatAmount(tokenPrice || BigInt(0))}
                </div>
                <div className="text-sm text-gray-600">
                  Real-time price for token: {tokenAddress}
                </div>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Information */}
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Price Data:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Real-time token price calculations</li>
              <li>Market liquidity and volume tracking</li>
              <li>Fee rate information</li>
              <li>Integration with Oracle price feeds</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
