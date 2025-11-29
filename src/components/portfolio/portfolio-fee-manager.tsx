'use client';

import { useState, useEffect } from 'react';
import { useContract, useContractTx, useContractQuery } from 'typink';
import type { PortfolioContractApi } from '@/lib/contracts/portfolio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, DollarSign, Settings, Loader2, RefreshCw } from 'lucide-react';
import { LabelWithHelp } from '@/components/ui/field-help';
import { txToaster } from '@/utils/txToaster';

export default function PortfolioFeeManager() {
  const { contract: portfolioContract } = useContract<PortfolioContractApi>('portfolio');
  const [buyFeeBp, setBuyFeeBp] = useState('');
  const [sellFeeBp, setSellFeeBp] = useState('');
  const [streamingFeeBp, setStreamingFeeBp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Transaction hooks
  const setFeeConfigTx = useContractTx(portfolioContract, 'setFeeConfig');

  // Query current fee configuration
  const feeConfigQuery = useContractQuery({
    contract: portfolioContract,
    fn: 'getFeeConfig',
  });

  // Load current fee configuration
  useEffect(() => {
    if (feeConfigQuery.data) {
      const config = feeConfigQuery.data;
      setBuyFeeBp(String(config.buyFeeBp || ''));
      setSellFeeBp(String(config.sellFeeBp || ''));
      setStreamingFeeBp(String(config.streamingFeeBp || ''));
    }
  }, [feeConfigQuery.data]);

  const handleSetFeeConfiguration = async () => {
    if (!buyFeeBp || !sellFeeBp || !streamingFeeBp) {
      setError('Please enter all fee values');
      return;
    }

    const buyFee = parseInt(buyFeeBp);
    const sellFee = parseInt(sellFeeBp);
    const streamingFee = parseInt(streamingFeeBp);

    if (isNaN(buyFee) || buyFee < 0 || buyFee > 10000) {
      setError('Buy fee must be between 0 and 10000 basis points');
      return;
    }

    if (isNaN(sellFee) || sellFee < 0 || sellFee > 10000) {
      setError('Sell fee must be between 0 and 10000 basis points');
      return;
    }

    if (isNaN(streamingFee) || streamingFee < 0 || streamingFee > 10000) {
      setError('Streaming fee must be between 0 and 10000 basis points');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    const toaster = txToaster('Setting fee configuration...');

    try {
      toaster.onTxPending();
      
      await setFeeConfigTx.signAndSend({
        args: [{
          buyFeeBp: buyFee,
          sellFeeBp: sellFee,
          streamingFeeBp: streamingFee,
        }],
        callback: (progress) => {
          toaster.onTxProgress(progress);
          if (progress.status.type === 'BestChainBlockIncluded' && !progress.dispatchError) {
            setResult({ 
              type: 'setFeeConfiguration', 
              hash: 'success',
              buyFeeBp: buyFee,
              sellFeeBp: sellFee,
              streamingFeeBp: streamingFee,
            });
            feeConfigQuery.refresh();
          }
        },
      });
    } catch (err: any) {
      console.error('Error setting fee configuration:', err);
      toaster.onTxError(err instanceof Error ? err : new Error('Unknown error'));
      setError(`Error setting fee configuration: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const currentConfig = feeConfigQuery.data;
  const formatBasisPoints = (bp: number) => {
    return `${(bp / 100).toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
                Fee Configuration
          </CardTitle>
          <CardDescription>
                Configure buy, sell, and streaming fees for the portfolio (Phase 4.3)
          </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => feeConfigQuery.refresh()}
              disabled={feeConfigQuery.isLoading}
            >
              {feeConfigQuery.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Fee Configuration */}
          {currentConfig && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3">
                Current Fee Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Buy Fee</div>
                  <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {formatBasisPoints(currentConfig.buyFeeBp)}
                  </div>
                  <div className="text-xs text-blue-500 dark:text-blue-400">
                    {currentConfig.buyFeeBp} basis points
                  </div>
                </div>
                <div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Sell Fee</div>
                  <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {formatBasisPoints(currentConfig.sellFeeBp)}
                  </div>
                  <div className="text-xs text-blue-500 dark:text-blue-400">
                    {currentConfig.sellFeeBp} basis points
                  </div>
                </div>
                <div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Streaming Fee</div>
                  <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {formatBasisPoints(currentConfig.streamingFeeBp)}
                  </div>
                  <div className="text-xs text-blue-500 dark:text-blue-400">
                    {currentConfig.streamingFeeBp} basis points (annual)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Set Fee Configuration */}
          <div className="space-y-4">
            <h3 className="font-medium">Set Fee Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="buyFeeBp"
                  helpText="Buy fee in basis points (1 bp = 0.01%). This fee is charged when users buy/mint W3PI tokens by depositing assets into the portfolio. Example: 55 = 0.55%. Enter a value between 0 and 10000."
                >
                  Buy Fee (basis points) *
                </LabelWithHelp>
                <Input
                  id="buyFeeBp"
                  value={buyFeeBp}
                  onChange={(e) => setBuyFeeBp(e.target.value)}
                  placeholder="e.g., 55 (for 0.55%)"
                  type="number"
                  min="0"
                  max="10000"
                  disabled={isLoading}
                />
                {buyFeeBp && !isNaN(parseInt(buyFeeBp)) && (
                  <p className="text-xs text-gray-500">
                    = {formatBasisPoints(parseInt(buyFeeBp))}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="sellFeeBp"
                  helpText="Sell fee in basis points (1 bp = 0.01%). This fee is charged when users sell/burn W3PI tokens by withdrawing assets from the portfolio. Example: 95 = 0.95%. Enter a value between 0 and 10000."
                >
                  Sell Fee (basis points) *
                </LabelWithHelp>
                <Input
                  id="sellFeeBp"
                  value={sellFeeBp}
                  onChange={(e) => setSellFeeBp(e.target.value)}
                  placeholder="e.g., 95 (for 0.95%)"
                  type="number"
                  min="0"
                  max="10000"
                  disabled={isLoading}
                />
                {sellFeeBp && !isNaN(parseInt(sellFeeBp)) && (
                  <p className="text-xs text-gray-500">
                    = {formatBasisPoints(parseInt(sellFeeBp))}
                  </p>
                )}
              </div>

            <div className="space-y-2">
                <LabelWithHelp
                  htmlFor="streamingFeeBp"
                  helpText="Streaming fee in basis points (1 bp = 0.01%). This is an annual fee charged continuously based on portfolio value. Example: 195 = 1.95% annual. Enter a value between 0 and 10000. This fee is calculated and collected over time."
                >
                  Streaming Fee (basis points) *
                </LabelWithHelp>
              <Input
                  id="streamingFeeBp"
                  value={streamingFeeBp}
                  onChange={(e) => setStreamingFeeBp(e.target.value)}
                  placeholder="e.g., 195 (for 1.95% annual)"
                type="number"
                min="0"
                  max="10000"
                  disabled={isLoading}
                />
                {streamingFeeBp && !isNaN(parseInt(streamingFeeBp)) && (
                  <p className="text-xs text-gray-500">
                    = {formatBasisPoints(parseInt(streamingFeeBp))} annual
                  </p>
                )}
              </div>
            </div>

            {/* Recommended Values */}
            <Alert>
              <AlertDescription>
                <strong>Recommended values from Real World Scenario:</strong> Buy: 55 bp (0.55%), Sell: 95 bp (0.95%), Streaming: 195 bp (1.95% annual)
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleSetFeeConfiguration}
              disabled={!buyFeeBp || !sellFeeBp || !streamingFeeBp || isLoading || setFeeConfigTx.inBestBlockProgress}
              className="w-full"
            >
              {isLoading || setFeeConfigTx.inBestBlockProgress ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting Fee Configuration...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
              Set Fee Configuration
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          {result && result.type === 'setFeeConfiguration' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Fee configuration updated successfully:
                <ul className="list-disc list-inside mt-2 text-sm">
                  <li>Buy Fee: {formatBasisPoints(result.buyFeeBp)} ({result.buyFeeBp} bp)</li>
                  <li>Sell Fee: {formatBasisPoints(result.sellFeeBp)} ({result.sellFeeBp} bp)</li>
                  <li>Streaming Fee: {formatBasisPoints(result.streamingFeeBp)} ({result.streamingFeeBp} bp annual)</li>
                </ul>
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
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
            <h4 className="text-sm font-medium mb-2">Fee Structure Information</h4>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p><strong>Buy Fee:</strong> Charged when users deposit assets and mint W3PI tokens</p>
              <p><strong>Sell Fee:</strong> Charged when users withdraw assets and burn W3PI tokens</p>
              <p><strong>Streaming Fee:</strong> Annual fee calculated continuously based on portfolio value</p>
              <p className="mt-2 text-amber-600 dark:text-amber-400">
                <strong>Note:</strong> All fees are in basis points (1 bp = 0.01%). Maximum is 10000 bp (100%).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
