'use client';

import { useState } from 'react';
import { useContractQuery, useContractTx } from '@dedot/react';
import { useWallet } from '@dedot/react-wallet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, DollarSign, TrendingUp } from 'lucide-react';

interface StakingRewardsProps {
  stakingContract: any;
}

export default function StakingRewards({ stakingContract }: StakingRewardsProps) {
  const { selectedAccount } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Transaction hooks
  const claimRewardsTx = useContractTx(stakingContract, 'claimRewards');

  // Query hooks
  const { data: rewardRate, isLoading: isLoadingRewardRate } = useContractQuery(
    stakingContract,
    'getRewardRate',
    []
  );

  const { data: totalRewards, isLoading: isLoadingTotalRewards } = useContractQuery(
    stakingContract,
    'getTotalRewards',
    []
  );

  const { data: userRewards, isLoading: isLoadingUserRewards } = useContractQuery(
    stakingContract,
    'getUserRewards',
    selectedAccount?.address ? [selectedAccount.address] : null
  );

  const handleClaimRewards = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const tx = claimRewardsTx.tx();
      const hash = await tx.signAndSend(selectedAccount?.address);
      setResult({ type: 'claimRewards', hash });
    } catch (err: any) {
      setError(`Error claiming rewards: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: bigint) => {
    return `${(Number(amount) / 1e18).toFixed(4)} W3PI`;
  };

  const formatRate = (rate: bigint) => {
    const percentage = (Number(rate) / 1e18) * 100;
    return `${percentage.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Staking Rewards
          </CardTitle>
          <CardDescription>
            Manage and claim your staking rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Reward Rate */}
          <div className="space-y-2">
            <Label>Current Reward Rate</Label>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {rewardRate ? formatRate(rewardRate) : 'Loading...'}
              </div>
              <div className="text-sm text-gray-600">Annual Percentage Rate</div>
            </div>
          </div>

          {/* Total Rewards */}
          <div className="space-y-2">
            <Label>Total Rewards Distributed</Label>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {totalRewards ? formatAmount(totalRewards) : 'Loading...'}
              </div>
            </div>
          </div>

          {/* User Rewards */}
          <div className="space-y-2">
            <Label>Your Available Rewards</Label>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {userRewards ? formatAmount(userRewards) : 'Loading...'}
              </div>
            </div>
          </div>

          {/* Claim Rewards */}
          <div className="space-y-4">
            <h3 className="font-medium">Claim Rewards</h3>
            <Button
              onClick={handleClaimRewards}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Claim Rewards
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
            <p><strong>Rewards System:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Rewards are calculated automatically</li>
              <li>Claim rewards without unstaking</li>
              <li>Reward rate may change over time</li>
              <li>Rewards are distributed proportionally</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
