'use client';

import { useState } from 'react';
import { useContract } from 'typink';
import type { PortfolioContractApi } from '@/lib/contracts/portfolio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, TrendingUp, BarChart3 } from 'lucide-react';

export default function PortfolioAnalytics() {
  const { contract: portfolioContract } = useContract<PortfolioContractApi>('portfolio');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Query hooks for portfolio analytics
  const { data: analytics, isLoading: isLoadingAnalytics } = useContractQuery(
    portfolioContract,
    'getPortfolioAnalytics',
    []
  );

  const { data: performance, isLoading: isLoadingPerformance } = useContractQuery(
    portfolioContract,
    'getTokenPerformance',
    []
  );

  const { data: historicalData, isLoading: isLoadingHistorical } = useContractQuery(
    portfolioContract,
    'getHistoricalData',
    []
  );

  const formatValue = (value: bigint) => {
    return `${(Number(value) / 1e18).toFixed(4)} W3PI`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const isLoadingAny = isLoadingAnalytics || isLoadingPerformance || isLoadingHistorical;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Portfolio Analytics
          </CardTitle>
          <CardDescription>
            Performance analytics and historical data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingAny ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Analytics Overview */}
              {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatValue(analytics.totalValue || BigInt(0))}
                    </div>
                    <div className="text-sm text-gray-600">Total Value</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatPercentage(analytics.performance || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Performance</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {analytics.tradeCount || 0}
                    </div>
                    <div className="text-sm text-gray-600">Trade Count</div>
                  </div>
                </div>
              )}

              {/* Token Performance */}
              {performance && (
                <div className="space-y-4">
                  <h3 className="font-medium">Token Performance</h3>
                  <div className="space-y-2">
                    {performance.map((token: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="font-medium">Token {token.tokenId}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatValue(token.balance)}</div>
                          <div className="text-sm text-gray-600">
                            {formatPercentage(token.performance || 0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historical Data */}
              {historicalData && (
                <div className="space-y-4">
                  <h3 className="font-medium">Historical Data</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div><strong>Data Points:</strong> {historicalData.length}</div>
                      <div><strong>Time Range:</strong> {historicalData.startTime} - {historicalData.endTime}</div>
                      <div><strong>Average Value:</strong> {formatValue(historicalData.averageValue || BigInt(0))}</div>
                    </div>
                  </div>
                </div>
              )}
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
            <p><strong>Portfolio Analytics:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Real-time performance tracking</li>
              <li>Historical data analysis</li>
              <li>Token-specific performance metrics</li>
              <li>Integration with Registry tier analytics</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
