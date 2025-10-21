'use client';

import { useState } from 'react';
import { useContractQuery, useContractTx } from '@dedot/react';
import { useWallet } from '@dedot/react-wallet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Settings, Play, Pause } from 'lucide-react';

interface PortfolioStateManagerProps {
  portfolioContract: any;
}

export default function PortfolioStateManager({ portfolioContract }: PortfolioStateManagerProps) {
  const { selectedAccount } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Transaction hooks
  const pauseTx = useContractTx(portfolioContract, 'pause');
  const resumeTx = useContractTx(portfolioContract, 'resume');
  const emergencyPauseTx = useContractTx(portfolioContract, 'emergencyPause');

  // Query hooks
  const { data: state, isLoading: isLoadingState } = useContractQuery(
    portfolioContract,
    'getState',
    []
  );

  const { data: isPaused, isLoading: isLoadingPaused } = useContractQuery(
    portfolioContract,
    'isPaused',
    []
  );

  const handlePause = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const tx = pauseTx.tx();
      const hash = await tx.signAndSend(selectedAccount?.address);
      setResult({ type: 'pause', hash });
    } catch (err: any) {
      setError(`Error pausing portfolio: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const tx = resumeTx.tx();
      const hash = await tx.signAndSend(selectedAccount?.address);
      setResult({ type: 'resume', hash });
    } catch (err: any) {
      setError(`Error resuming portfolio: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergencyPause = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const tx = emergencyPauseTx.tx();
      const hash = await tx.signAndSend(selectedAccount?.address);
      setResult({ type: 'emergencyPause', hash });
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
              {isLoadingState ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <div className="flex items-center gap-2">
                  {isPaused ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <span className="font-medium">
                    {isPaused ? 'Paused' : 'Active'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* State Controls */}
          <div className="space-y-4">
            <h3 className="font-medium">State Controls</h3>
            <div className="flex gap-2">
              <Button
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
              </Button>
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
