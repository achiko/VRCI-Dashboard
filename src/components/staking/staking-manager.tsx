'use client';

import { useState } from 'react';
import { useContract, useContractTx } from 'typink';
import type { StakingContractApi } from '@/lib/contracts/staking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Wallet, TrendingUp } from 'lucide-react';

export default function StakingManager() {
  const { contract: stakingContract } = useContract<StakingContractApi>('staking');
  const { selectedAccount } = useWallet();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Transaction hooks
  const stakeTx = useContractTx(stakingContract, 'stake');

  // Query hooks
  const { data: stakeInfo, isLoading: isLoadingStakeInfo } = useContractQuery(
    stakingContract,
    'getStakeInfo',
    selectedAccount?.address ? [selectedAccount.address] : null
  );

  const { data: totalStaked, isLoading: isLoadingTotalStaked } = useContractQuery(
    stakingContract,
    'getTotalStaked',
    []
  );

  const handleStake = async () => {
    if (!amount) {
      setError('Please enter an amount');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const tx = stakeTx.tx(BigInt(amount));
      const hash = await tx.signAndSend(selectedAccount?.address);
      setResult({ type: 'stake', hash, amount });
    } catch (err: any) {
      setError(`Error staking: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: bigint) => {
    return `${(Number(amount) / 1e18).toFixed(4)} W3PI`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Staking Manager
          </CardTitle>
          <CardDescription>
            Stake W3PI tokens and manage your staking position
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Stake Info */}
          <div className="space-y-2">
            <Label>Your Stake Info</Label>
            <div className="bg-gray-50 p-4 rounded-lg">
              {isLoadingStakeInfo ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : stakeInfo ? (
                <div className="space-y-2">
                  <div><strong>Staked Amount:</strong> {formatAmount(stakeInfo.amount || BigInt(0))}</div>
                  <div><strong>Stake Time:</strong> {stakeInfo.stakeTime || 'N/A'}</div>
                  <div><strong>Rewards:</strong> {formatAmount(stakeInfo.rewards || BigInt(0))}</div>
                </div>
              ) : (
                <span className="text-gray-500">No stake information</span>
              )}
            </div>
          </div>

          {/* Total Staked */}
          <div className="space-y-2">
            <Label>Total Staked in System</Label>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {totalStaked ? formatAmount(totalStaked) : 'Loading...'}
              </div>
            </div>
          </div>

          {/* Stake Tokens */}
          <div className="space-y-4">
            <h3 className="font-medium">Stake Tokens</h3>
            <div className="space-y-2">
              <Label>Amount to Stake</Label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount to stake"
                type="number"
              />
            </div>
            <Button
              onClick={handleStake}
              disabled={!amount || isLoading}
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Stake Tokens
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
            <p><strong>Staking:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Stake W3PI tokens to earn rewards</li>
              <li>Minimum staking period applies</li>
              <li>Rewards are calculated automatically</li>
              <li>Unstaking requires a waiting period</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
