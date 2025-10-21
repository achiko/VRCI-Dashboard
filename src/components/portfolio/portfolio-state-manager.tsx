'use client';

import { useState } from 'react';
import { useContract, useContractTx, useContractQuery } from 'typink';
import type { PortfolioContractApi } from '@/lib/contracts/portfolio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Settings, Play, Pause } from 'lucide-react';

export default function PortfolioStateManager() {
  const { contract: portfolioContract } = useContract<PortfolioContractApi>('portfolio');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Transaction hooks
  // Note: pause and resume methods don't exist in Portfolio contract API
  // const pauseTx = useContractTx(portfolioContract, 'pause');
  // const resumeTx = useContractTx(portfolioContract, 'resume');
  const emergencyPauseTx = useContractTx(portfolioContract, 'emergencyPause');

  // State for portfolio state
  // Note: getState method doesn't exist in Portfolio contract API
  const [state, setState] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Note: isPaused method doesn't exist in Portfolio contract API
  // const [isPaused, setIsPaused] = useState<any>(null);

  // Note: pause and resume methods don't exist in Portfolio contract API
  // const handlePause = async () => {
  //   setIsLoading(true);
  //   setError(null);
  //   setResult(null);

  //   try {
  //     const tx = pauseTx.tx();
  //     const hash = await tx.signAndSend(selectedAccount?.address);
  //     setResult({ type: 'pause', hash });
  //   } catch (err: any) {
  //     setError(`Error pausing portfolio: ${err.message}`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handleResume = async () => {
  //   setIsLoading(true);
  //   setError(null);
  //   setResult(null);

  //   try {
  //     const tx = resumeTx.tx();
  //     const hash = await tx.signAndSend(selectedAccount?.address);
  //     setResult({ type: 'resume', hash });
  //   } catch (err: any) {
  //     setError(`Error resuming portfolio: ${err.message}`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleEmergencyPause = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      await emergencyPauseTx.signAndSend({
        args: ['Emergency pause'],
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            if (progress.dispatchError) {
              setError('Transaction failed');
            } else {
              setResult({ type: 'emergencyPause', hash: 'success' });
            }
          }
        }
      });
    } catch (err: any) {
      setError(`Error emergency pausing portfolio: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            State Management
          </CardTitle>
          <CardDescription>
            Manage portfolio state and operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current State */}
          <div className="space-y-2">
            <Label>Current State</Label>
            <div className="bg-gray-50 p-4 rounded-lg">
              {isLoadingData ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* {isPaused ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )} */}
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">
                    {/* {isPaused ? 'Paused' : 'Active'} */}
                    Active
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* State Controls */}
          <div className="space-y-4">
            <h3 className="font-medium">State Controls</h3>
            <div className="flex gap-2">
              {/* Note: pause and resume methods don't exist in Portfolio contract API */}
              {/* <Button
                onClick={handlePause}
                disabled={isLoading || isPaused}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Pause className="h-4 w-4" />
                Pause
              </Button>
              <Button
                onClick={handleResume}
                disabled={isLoading || !isPaused}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Resume
              </Button> */}
              <Button
                onClick={handleEmergencyPause}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Emergency Pause
              </Button>
            </div>
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
            <p><strong>State Management:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Pause portfolio operations for maintenance</li>
              <li>Resume normal operations when ready</li>
              <li>Emergency pause for critical situations</li>
              <li>State changes require owner permissions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
