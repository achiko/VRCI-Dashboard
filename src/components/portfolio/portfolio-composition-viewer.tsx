'use client';

import { useState } from 'react';
import { useContract } from 'typink';
import type { PortfolioContractApi } from '@/lib/contracts/portfolio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Info, TrendingUp, PieChart } from 'lucide-react';

export default function PortfolioCompositionViewer() {
  const { contract: portfolioContract } = useContract<PortfolioContractApi>('portfolio');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Query hooks for portfolio composition
  const { data: composition, isLoading: isLoadingComposition } = useContractQuery(
    portfolioContract,
    'getPortfolioComposition',
    []
  );

  const { data: tokenIds, isLoading: isLoadingTokenIds } = useContractQuery(
    portfolioContract,
    'getTokenIds',
    []
  );

  const { data: totalValue, isLoading: isLoadingTotalValue } = useContractQuery(
    portfolioContract,
    'getTotalValue',
    []
  );

  const formatValue = (value: bigint) => {
    return `${(Number(value) / 1e18).toFixed(4)} W3PI`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const isLoadingAny = isLoadingComposition || isLoadingTokenIds || isLoadingTotalValue;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Portfolio Composition
          </CardTitle>
          <CardDescription>
            Current portfolio composition and token distribution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingAny ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Total Value */}
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {totalValue ? formatValue(totalValue) : 'N/A'}
                </div>
                <p className="text-sm text-gray-600">Total Portfolio Value</p>
              </div>

              {/* Composition Data */}
              {composition && (
                <div className="space-y-4">
                  <h3 className="font-medium">Token Holdings</h3>
                  <div className="space-y-2">
                    {composition.tokens?.map((token: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="font-medium">Token {token.tokenId}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatValue(token.balance)}</div>
                          <div className="text-sm text-gray-600">
                            {formatPercentage(token.weight || 0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Token IDs */}
              <div className="space-y-2">
                <h3 className="font-medium">Token IDs</h3>
                <div className="flex flex-wrap gap-2">
                  {tokenIds?.map((id: number) => (
                    <span key={id} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {id}
                    </span>
                  ))}
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
            <p><strong>Portfolio Composition:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Real-time token distribution and weights</li>
              <li>Automatic rebalancing based on market conditions</li>
              <li>Integration with Registry tier system</li>
              <li>Performance tracking and analytics</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
