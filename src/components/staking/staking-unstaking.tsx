'use client';

import { useState } from 'react';
import { useContract, useContractTx, useContractQuery } from 'typink';
import type { StakingContractApi } from '@/lib/contracts/staking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, TrendingDown } from 'lucide-react';

export default function StakingUnstaking() {
  const { contract: stakingContract } = useContract<StakingContractApi>('staking');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Transaction hooks
  const requestUnstakeTx = useContractTx(stakingContract, 'requestUnstake');
  const claimUnstakedTx = useContractTx(stakingContract, 'claimUnstaked');

  // State for unstaking data
  // Note: These methods don't exist in Staking contract API
  const [unstakingRequests, setUnstakingRequests] = useState<any>(null);
  const [unstakingPeriod, setUnstakingPeriod] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const handleRequestUnstake = async () => {
    if (!amount) {
      setError('Please enter an amount');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      await requestUnstakeTx.signAndSend({
        args: [BigInt(amount)],
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            if (progress.dispatchError) {
              setError('Transaction failed');
            } else {
              setResult({ type: 'requestUnstake', hash: 'success', amount });
            }
          }
        }
      });
    } catch (err: any) {
      setError(`Error requesting unstake: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimUnstaked = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      await claimUnstakedTx.signAndSend({
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            if (progress.dispatchError) {
              setError('Transaction failed');
            } else {
              setResult({ type: 'claimUnstaked', hash: 'success' });
            }
          }
        }
      });
    } catch (err: any) {
      setError(`Error claiming unstaked tokens: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: bigint) => {
    return `${(Number(amount) / 1e18).toFixed(4)} W3PI`;
  };

  const formatPeriod = (period: bigint) => {
    const days = Number(period) / (24 * 60 * 60);
    return `${days.toFixed(1)} days`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Unstaking Management
          </CardTitle>
          <CardDescription>
            Request unstaking and claim your tokens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Unstaking Period */}
          <div className="space-y-2">
            <Label>Unstaking Period</Label>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {unstakingPeriod ? formatPeriod(unstakingPeriod) : 'Loading...'}
              </div>
              <div className="text-sm text-gray-600">Waiting period before claiming</div>
            </div>
          </div>

          {/* Unstaking Requests */}
          <div className="space-y-2">
            <Label>Your Unstaking Requests</Label>
            <div className="bg-gray-50 p-4 rounded-lg">
              {isLoadingData ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : unstakingRequests && unstakingRequests.length > 0 ? (
                <div className="space-y-2">
                  {unstakingRequests.map((request: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div>
                        <div className="font-medium">{formatAmount(request.amount)}</div>
                        <div className="text-sm text-gray-600">
                          Requested: {new Date(Number(request.requestTime)).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {request.canClaim ? 'Ready to claim' : 'Waiting...'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-gray-500">No unstaking requests</span>
              )}
            </div>
          </div>

          {/* Request Unstake */}
          <div className="space-y-4">
            <h3 className="font-medium">Request Unstake</h3>
            <div className="space-y-2">
              <Label>Amount to Unstake</Label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount to unstake"
                type="number"
              />
            </div>
            <Button
              onClick={handleRequestUnstake}
              disabled={!amount || isLoading}
              className="flex items-center gap-2"
            >
              <TrendingDown className="h-4 w-4" />
              Request Unstake
            </Button>
          </div>

          {/* Claim Unstaked */}
          <div className="space-y-4">
            <h3 className="font-medium">Claim Unstaked Tokens</h3>
            <Button
              onClick={handleClaimUnstaked}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Claim Unstaked
            </Button>
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
            <p><strong>Unstaking Process:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Request unstaking to start the waiting period</li>
              <li>Wait for the unstaking period to complete</li>
              <li>Claim your tokens after the waiting period</li>
              <li>You can request multiple unstaking amounts</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
