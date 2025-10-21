'use client';

import { useState } from 'react';
import { useContract, useContractTx, useContractQuery } from 'typink';
import type { PortfolioContractApi } from '@/lib/contracts/portfolio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, DollarSign, Settings } from 'lucide-react';

export default function PortfolioFeeManager() {
  const { contract: portfolioContract } = useContract<PortfolioContractApi>('portfolio');
  const [feeRate, setFeeRate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Transaction hooks
  const setFeeConfigTx = useContractTx(portfolioContract, 'setFeeConfig');
  // Note: collectFees method doesn't exist in Portfolio contract API
  // const collectFeesTx = useContractTx(portfolioContract, 'collectFees');

  // State for fee data
  // Note: These methods don't exist in the actual Portfolio contract API
  const [feeConfiguration, setFeeConfiguration] = useState<any>(null);
  const [collectedFees, setCollectedFees] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const handleSetFeeConfiguration = async () => {
    if (!feeRate) {
      setError('Please enter a fee rate');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      await setFeeConfigTx.signAndSend({
        args: [{
          buyFeeBp: parseFloat(feeRate) * 100,
          sellFeeBp: parseFloat(feeRate) * 100,
          streamingFeeBp: parseFloat(feeRate) * 100
        }],
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            if (progress.dispatchError) {
              setError('Transaction failed');
            } else {
              setResult({ type: 'setFeeConfiguration', hash: 'success', feeRate });
            }
          }
        }
      });
    } catch (err: any) {
      setError(`Error setting fee configuration: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Note: collectFees method doesn't exist in Portfolio contract API
  // const handleCollectFees = async () => {
  //   setIsLoading(true);
  //   setError(null);
  //   setResult(null);

  //   try {
  //     const tx = collectFeesTx.tx();
  //     const hash = await tx.signAndSend(selectedAccount?.address);
  //     setResult({ type: 'collectFees', hash });
  //   } catch (err: any) {
  //     setError(`Error collecting fees: ${err.message}`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const formatAmount = (amount: bigint) => {
    return `${(Number(amount) / 1e18).toFixed(4)} W3PI`;
  };

  const formatRate = (rate: number) => {
    return `${(rate * 100).toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Fee Management
          </CardTitle>
          <CardDescription>
            Configure and manage portfolio fees
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Fee Configuration */}
          <div className="space-y-2">
            <Label>Current Fee Configuration</Label>
            <div className="bg-gray-50 p-4 rounded-lg">
              {isLoadingData ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : feeConfiguration ? (
                <div className="space-y-2">
                  <div><strong>Fee Rate:</strong> {formatRate(feeConfiguration.feeRate || 0)}</div>
                  <div><strong>Collected Fees:</strong> {formatAmount(feeConfiguration.collectedFees || BigInt(0))}</div>
                  <div><strong>Last Collection:</strong> {feeConfiguration.lastCollection || 'Never'}</div>
                </div>
              ) : (
                <span className="text-gray-500">No fee configuration</span>
              )}
            </div>
          </div>

          {/* Set Fee Configuration */}
          <div className="space-y-4">
            <h3 className="font-medium">Set Fee Configuration</h3>
            <div className="space-y-2">
              <Label>Fee Rate (0.01 = 1%)</Label>
              <Input
                value={feeRate}
                onChange={(e) => setFeeRate(e.target.value)}
                placeholder="Enter fee rate (e.g., 0.01 for 1%)"
                type="number"
                step="0.01"
                min="0"
                max="1"
              />
            </div>
            <Button
              onClick={handleSetFeeConfiguration}
              disabled={!feeRate || isLoading}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Set Fee Configuration
            </Button>
          </div>

          {/* Collect Fees - Method doesn't exist in Portfolio contract API */}
          {/* <div className="space-y-4">
            <h3 className="font-medium">Collect Fees</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Available Fees</div>
                  <div className="text-sm text-gray-600">
                    {collectedFees ? formatAmount(collectedFees) : 'Loading...'}
                  </div>
                </div>
                <Button
                  onClick={handleCollectFees}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  Collect Fees
                </Button>
              </div>
            </div>
          </div> */}

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
            <p><strong>Fee Management:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Configure fee rates for portfolio operations</li>
              <li>Collect accumulated fees from trading activities</li>
              <li>Automatic fee calculation based on portfolio performance</li>
              <li>Integration with Registry tier system for dynamic fees</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
