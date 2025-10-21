'use client';

import { useState } from 'react';
import { useContractQuery } from '@dedot/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Info, TrendingUp, Wallet, Clock, DollarSign } from 'lucide-react';

interface StakingOverviewProps {
  stakingContract: any;
}

export default function StakingOverview({ stakingContract }: StakingOverviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Query hooks for staking overview
  const { data: totalStaked, isLoading: isLoadingTotalStaked } = useContractQuery(
    stakingContract,
    'getTotalStaked',
    []
  );

  const { data: totalRewards, isLoading: isLoadingTotalRewards } = useContractQuery(
    stakingContract,
    'getTotalRewards',
    []
  );

  const { data: stakingPeriod, isLoading: isLoadingStakingPeriod } = useContractQuery(
    stakingContract,
    'getStakingPeriod',
    []
  );

  const { data: unstakingPeriod, isLoading: isLoadingUnstakingPeriod } = useContractQuery(
    stakingContract,
    'getUnstakingPeriod',
    []
  );

  const { data: rewardRate, isLoading: isLoadingRewardRate } = useContractQuery(
    stakingContract,
    'getRewardRate',
    []
  );

  const { data: isPaused, isLoading: isLoadingPaused } = useContractQuery(
    stakingContract,
    'isPaused',
    []
  );

  const formatAmount = (amount: bigint) => {
    return `${(Number(amount) / 1e18).toFixed(4)} W3PI`;
  };

  const formatPeriod = (period: bigint) => {
    const days = Number(period) / (24 * 60 * 60);
    return `${days.toFixed(1)} days`;
  };

  const formatRate = (rate: bigint) => {
    const percentage = (Number(rate) / 1e18) * 100;
    return `${percentage.toFixed(2)}%`;
  };

  const isLoadingAny = isLoadingTotalStaked || isLoadingTotalRewards || isLoadingStakingPeriod || 
                      isLoadingUnstakingPeriod || isLoadingRewardRate || isLoadingPaused;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Staking Overview
          </CardTitle>
          <CardDescription>
            Current staking status and key metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingAny ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total Staked */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Total Staked</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {totalStaked ? formatAmount(totalStaked) : 'N/A'}
                </div>
                <p className="text-sm text-gray-600">
                  Total tokens staked in the system
                </p>
              </div>

              {/* Total Rewards */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Total Rewards</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {totalRewards ? formatAmount(totalRewards) : 'N/A'}
                </div>
                <p className="text-sm text-gray-600">
                  Total rewards distributed
                </p>
              </div>

              {/* Reward Rate */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Reward Rate</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {rewardRate ? formatRate(rewardRate) : 'N/A'}
                </div>
                <p className="text-sm text-gray-600">
                  Annual percentage rate
                </p>
              </div>

              {/* Staking Period */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Staking Period</span>
                </div>
                <div className="text-lg font-bold text-orange-600">
                  {stakingPeriod ? formatPeriod(stakingPeriod) : 'N/A'}
                </div>
                <p className="text-sm text-gray-600">
                  Minimum staking duration
                </p>
              </div>

              {/* Unstaking Period */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-red-600" />
                  <span className="font-medium">Unstaking Period</span>
                </div>
                <div className="text-lg font-bold text-red-600">
                  {unstakingPeriod ? formatPeriod(unstakingPeriod) : 'N/A'}
                </div>
                <p className="text-sm text-gray-600">
                  Time to wait before claiming
                </p>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {isPaused ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <span className="font-medium">Status</span>
                </div>
                <div className={`text-lg font-bold ${isPaused ? 'text-red-600' : 'text-green-600'}`}>
                  {isPaused ? 'Paused' : 'Active'}
                </div>
                <p className="text-sm text-gray-600">
                  Staking system status
                </p>
              </div>
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
            <p><strong>Staking Features:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Stake W3PI tokens to earn rewards</li>
              <li>Flexible unstaking with waiting periods</li>
              <li>Automatic reward distribution</li>
              <li>Emergency pause functionality</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
