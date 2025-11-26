'use client';

import { useState, useEffect } from 'react';
import { useContract, useContractQuery } from 'typink';
import type { PortfolioContractApi } from '@/lib/contracts/portfolio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, TrendingUp, BarChart3, Loader2, RefreshCw, DollarSign, Target } from 'lucide-react';

export default function PortfolioAnalytics() {
  const { contract: portfolioContract } = useContract<PortfolioContractApi>('portfolio');
  const [error, setError] = useState<string | null>(null);

  // Query index value and performance
  const currentIndexValueQuery = useContractQuery({
    contract: portfolioContract,
    fn: 'getCurrentIndexValue',
  });

  const indexPerformanceQuery = useContractQuery({
    contract: portfolioContract,
    fn: 'getIndexPerformance',
  });

  const indexBaseMetricsQuery = useContractQuery({
    contract: portfolioContract,
    fn: 'getIndexBaseMetrics',
  });

  const loadAnalytics = async () => {
    if (!portfolioContract) {
      setError('Portfolio contract not available');
      return;
    }
    setError(null);
    await Promise.all([
      currentIndexValueQuery.refresh(),
      indexPerformanceQuery.refresh(),
      indexBaseMetricsQuery.refresh(),
    ]);
  };

  useEffect(() => {
    if (portfolioContract) {
      loadAnalytics();
    }
  }, [portfolioContract]);

  const formatValue = (value: bigint | undefined) => {
    if (!value) return 'N/A';
    // Index value is in plancks, convert to USD (assuming $100 base)
    const usdValue = Number(value) / 1e10; // 10 decimals for PAS
    return `$${usdValue.toFixed(2)}`;
  };

  const formatPerformance = (bp: number | undefined) => {
    if (bp === undefined) return 'N/A';
    const percentage = bp / 100;
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  };

  const isLoading = currentIndexValueQuery.isLoading || indexPerformanceQuery.isLoading || indexBaseMetricsQuery.isLoading;

  // Extract data
  let currentIndexValue: bigint | undefined;
  if (currentIndexValueQuery.data) {
    currentIndexValue = currentIndexValueQuery.data;
  }

  let performance: number | undefined;
  if (indexPerformanceQuery.data) {
    if ('isOk' in indexPerformanceQuery.data && indexPerformanceQuery.data.isOk) {
      performance = indexPerformanceQuery.data.value;
    } else if ('isErr' in indexPerformanceQuery.data && indexPerformanceQuery.data.isErr) {
      const err = indexPerformanceQuery.data.err;
      if (typeof err === 'object' && err !== null && 'BaseValueNotSet' in err) {
        setError('Base portfolio value not initialized. Please initialize it first.');
      }
    } else {
      performance = indexPerformanceQuery.data as any;
    }
  }

  let baseMetrics: [bigint, bigint, bigint, boolean] | undefined;
  if (indexBaseMetricsQuery.data) {
    baseMetrics = indexBaseMetricsQuery.data;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Portfolio Analytics
              </CardTitle>
              <CardDescription>
                Index value, performance metrics, and analytics (Phase 4.4 Verification)
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAnalytics}
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
              <span className="ml-3 text-gray-600">Loading analytics...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6">
              {/* Index Value */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                      Current Index Value
                    </h3>
                  </div>
                  {currentIndexValue && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                      {formatValue(currentIndexValue)}
                    </Badge>
                  )}
                </div>
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {formatValue(currentIndexValue)}
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                  Index value relative to $100 baseline
                </p>
              </div>

              {/* Performance */}
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                      Index Performance
                    </h3>
                  </div>
                  {performance !== undefined && (
                    <Badge 
                      variant="outline" 
                      className={
                        performance >= 0 
                          ? 'bg-green-100 text-green-700 border-green-300'
                          : 'bg-red-100 text-red-700 border-red-300'
                      }
                    >
                      {formatPerformance(performance)}
                    </Badge>
                  )}
                </div>
                <div className={`text-3xl font-bold ${performance !== undefined && performance >= 0 ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                  {formatPerformance(performance)}
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  Performance in basis points relative to $100 baseline
                </p>
              </div>

              {/* Base Metrics */}
              {baseMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      <div className="text-xs text-purple-600 dark:text-purple-400">Base Portfolio Value</div>
                    </div>
                    <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
                      {formatValue(baseMetrics[1])}
                    </div>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-orange-600" />
                      <div className="text-xs text-orange-600 dark:text-orange-400">Index Base Value</div>
                    </div>
                    <div className="text-xl font-bold text-orange-900 dark:text-orange-100">
                      {formatValue(baseMetrics[0])}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Index Tracking</div>
                    <div className="text-lg font-bold">
                      {baseMetrics[3] ? (
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                          <XCircle className="h-3 w-3 mr-1" />
                          Disabled
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Last Update</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {baseMetrics[2] ? new Date(Number(baseMetrics[2])).toLocaleString() : 'Never'}
                    </div>
                  </div>
                </div>
              )}

              {/* Expected Result Info */}
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Phase 4.4 Verification:</strong> After initialization, you should see:
                  <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                    <li>Portfolio composition with all added tokens</li>
                    <li>Index value starting at $100.00</li>
                    <li>Performance at 0% (0 basis points)</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
