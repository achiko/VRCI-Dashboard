'use client';

import { useState, useEffect } from 'react';
import { useContract, useContractQuery } from 'typink';
import type { PortfolioContractApi } from '@/lib/contracts/portfolio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, PieChart, Loader2, RefreshCw } from 'lucide-react';
import { getDeployedToken, DEPLOYED_TOKENS } from '@/lib/token-deployments';

export default function PortfolioCompositionViewer() {
  const { contract: portfolioContract } = useContract<PortfolioContractApi>('portfolio');
  const [error, setError] = useState<string | null>(null);

  // Query portfolio composition
  const compositionQuery = useContractQuery({
    contract: portfolioContract,
    fn: 'getPortfolioComposition',
  });

  const loadComposition = async () => {
    if (!portfolioContract) {
      setError('Portfolio contract not available');
      return;
    }
    setError(null);
    await compositionQuery.refresh();
  };

  useEffect(() => {
    if (portfolioContract) {
      loadComposition();
    }
  }, [portfolioContract]);

  const formatValue = (value: bigint | undefined) => {
    if (!value) return 'N/A';
    return `${(Number(value) / 1e18).toFixed(4)} W3PI`;
  };

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return `${(value / 100).toFixed(2)}%`;
  };

  const formatBasisPoints = (bp: number | undefined) => {
    if (bp === undefined) return 'N/A';
    return `${bp} bp (${(bp / 100).toFixed(2)}%)`;
  };

  // Extract composition data - getPortfolioComposition returns data directly
  const compositionData = compositionQuery.data;

  const isLoading = compositionQuery.isLoading;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Portfolio Composition
              </CardTitle>
              <CardDescription>
                View current portfolio composition and token holdings (Phase 4.4 Verification)
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadComposition}
              disabled={isLoading || !portfolioContract}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading portfolio composition...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : compositionData ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Total Tokens</div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {compositionData.totalTokens || 0}
                  </div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-xs text-green-600 dark:text-green-400 mb-1">Total Value</div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {formatValue(compositionData.totalValue)}
                  </div>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">Holdings Count</div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {compositionData.holdings?.length || 0}
                  </div>
                </div>
              </div>

              {/* Token Holdings */}
              {compositionData.holdings && compositionData.holdings.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-medium">Token Holdings</h3>
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium">Token ID</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Symbol</th>
                          <th className="px-4 py-2 text-right text-sm font-medium">Amount</th>
                          <th className="px-4 py-2 text-right text-sm font-medium">Target Weight</th>
                          <th className="px-4 py-2 text-right text-sm font-medium">Fees Collected</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {compositionData.holdings.map(([tokenId, holding]: [number, any]) => {
                          // Find token symbol from deployed tokens
                          let tokenSymbol: string | undefined;
                          // We'd need to query Registry to get contract address, then match
                          // For now, just show token ID
                          
                          return (
                            <tr key={tokenId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="px-4 py-2">
                                <Badge variant="outline">{tokenId}</Badge>
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {tokenSymbol || 'Unknown'}
                              </td>
                              <td className="px-4 py-2 text-right text-sm font-mono">
                                {formatValue(holding.amount)}
                              </td>
                              <td className="px-4 py-2 text-right text-sm">
                                {formatBasisPoints(holding.targetWeightBp)}
                              </td>
                              <td className="px-4 py-2 text-right text-sm font-mono">
                                {formatValue(holding.feesCollected)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No tokens in portfolio yet. Add tokens using the Token Management tab.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No composition data available</p>
              <p className="text-sm mt-2">Click refresh to load portfolio composition</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
