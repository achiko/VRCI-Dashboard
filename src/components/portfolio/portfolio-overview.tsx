'use client';

import { useState } from 'react';
import { useContract } from 'typink';
import type { PortfolioContractApi } from '@/lib/contracts/portfolio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Info, TrendingUp, Wallet, Clock } from 'lucide-react';

export default function PortfolioOverview() {
  const { contract: portfolioContract } = useContract<PortfolioContractApi>('portfolio');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Query hooks for portfolio overview
  const { data: owner, isLoading: isLoadingOwner } = useContractQuery(
    portfolioContract,
    'getOwner',
    []
  );

  const { data: state, isLoading: isLoadingState } = useContractQuery(
    portfolioContract,
    'getState',
    []
  );

  const { data: deploymentTimestamp, isLoading: isLoadingDeployment } = useContractQuery(
    portfolioContract,
    'getDeploymentTimestamp',
    []
  );

  const { data: totalTokensHeld, isLoading: isLoadingTokens } = useContractQuery(
    portfolioContract,
    'getTotalTokensHeld',
    []
  );

  const { data: tokenIds, isLoading: isLoadingTokenIds } = useContractQuery(
    portfolioContract,
    'getTokenIds',
    []
  );

  const { data: totalValue, isLoading: isLoadingValue } = useContractQuery(
    portfolioContract,
    'getTotalValue',
    []
  );

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp));
    return date.toLocaleString();
  };

  const formatValue = (value: bigint) => {
    return `${(Number(value) / 1e18).toFixed(4)} W3PI`;
  };

  const isLoadingAny = isLoadingOwner || isLoadingState || isLoadingDeployment || 
                      isLoadingTokens || isLoadingTokenIds || isLoadingValue;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Portfolio Overview
          </CardTitle>
          <CardDescription>
            Current portfolio status and key metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingAny ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Owner */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Owner</span>
                </div>
                <div className="text-sm font-mono text-gray-700 break-all">
                  {owner || 'N/A'}
                </div>
              </div>

              {/* State */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">State</span>
                </div>
                <div className="text-sm font-mono text-gray-700">
                  {state || 'N/A'}
                </div>
              </div>

              {/* Deployment */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Deployed</span>
                </div>
                <div className="text-sm text-gray-700">
                  {deploymentTimestamp ? formatTimestamp(deploymentTimestamp) : 'N/A'}
                </div>
              </div>

              {/* Total Tokens */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Total Tokens</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {totalTokensHeld || 0}
                </div>
              </div>

              {/* Total Value */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Total Value</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {totalValue ? formatValue(totalValue) : 'N/A'}
                </div>
              </div>

              {/* Token IDs */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Token IDs</span>
                </div>
                <div className="text-sm">
                  {tokenIds ? `${tokenIds.length} tokens` : 'N/A'}
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
            <p><strong>Portfolio Features:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Automated token management and rebalancing</li>
              <li>Fee collection and distribution</li>
              <li>Real-time value tracking</li>
              <li>Integration with Registry tier system</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
