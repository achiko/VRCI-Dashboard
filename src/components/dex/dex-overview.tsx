'use client';

import { useState } from 'react';
import { useContractQuery } from '@dedot/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Info, TrendingUp, Wallet, ArrowLeftRight } from 'lucide-react';

interface DexOverviewProps {
  dexContract: any;
}

export default function DexOverview({ dexContract }: DexOverviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Query hooks for DEX overview
  const { data: totalPools, isLoading: isLoadingTotalPools } = useContractQuery(
    dexContract,
    'getTotalPools',
    []
  );

  const { data: totalLiquidity, isLoading: isLoadingTotalLiquidity } = useContractQuery(
    dexContract,
    'getTotalLiquidity',
    []
  );

  const { data: totalVolume, isLoading: isLoadingTotalVolume } = useContractQuery(
    dexContract,
    'getTotalVolume',
    []
  );

  const { data: isPaused, isLoading: isLoadingPaused } = useContractQuery(
    dexContract,
    'isPaused',
    []
  );

  const { data: feeRate, isLoading: isLoadingFeeRate } = useContractQuery(
    dexContract,
    'getFeeRate',
    []
  );

  const formatAmount = (amount: bigint) => {
    return `${(Number(amount) / 1e18).toFixed(4)}`;
  };

  const formatRate = (rate: bigint) => {
    const percentage = (Number(rate) / 1e18) * 100;
    return `${percentage.toFixed(2)}%`;
  };

  const isLoadingAny = isLoadingTotalPools || isLoadingTotalLiquidity || isLoadingTotalVolume || 
                      isLoadingPaused || isLoadingFeeRate;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            DEX Overview
          </CardTitle>
          <CardDescription>
            Current DEX status and key metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingAny ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total Pools */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Total Pools</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {totalPools || 0}
                </div>
                <p className="text-sm text-gray-600">
                  Active trading pools
                </p>
              </div>

              {/* Total Liquidity */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Total Liquidity</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {totalLiquidity ? formatAmount(totalLiquidity) : 'N/A'}
                </div>
                <p className="text-sm text-gray-600">
                  Total liquidity across all pools
                </p>
              </div>

              {/* Total Volume */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Total Volume</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {totalVolume ? formatAmount(totalVolume) : 'N/A'}
                </div>
                <p className="text-sm text-gray-600">
                  Total trading volume
                </p>
              </div>

              {/* Fee Rate */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Fee Rate</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {feeRate ? formatRate(feeRate) : 'N/A'}
                </div>
                <p className="text-sm text-gray-600">
                  Trading fee percentage
                </p>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {isPaused ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <span className="font-medium">Status</span>
                </div>
                <div className={`text-lg font-bold ${isPaused ? 'text-red-600' : 'text-green-600'}`}>
                  {isPaused ? 'Paused' : 'Active'}
                </div>
                <p className="text-sm text-gray-600">
                  DEX system status
                </p>
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
            <p><strong>DEX Features:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Token swaps with automatic price discovery</li>
              <li>Liquidity pool management</li>
              <li>Fee collection and distribution</li>
              <li>Integration with Oracle price feeds</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
