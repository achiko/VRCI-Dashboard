'use client';

import { useState } from 'react';
import { useContract } from '@dedot/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, TrendingUp, Wallet, Settings, Clock } from 'lucide-react';

// Import Staking components
import StakingOverview from '@/components/staking/staking-overview';
import StakingManager from '@/components/staking/staking-manager';
import StakingRewards from '@/components/staking/staking-rewards';
import StakingUnstaking from '@/components/staking/staking-unstaking';
import StakingConfiguration from '@/components/staking/staking-configuration';

export default function StakingPage() {
  const [selectedStaking, setSelectedStaking] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Contract connection
  const stakingContract = useContract(selectedStaking);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staking Management</h1>
          <p className="text-gray-600 mt-2">
            Stake W3PI tokens and earn rewards with flexible unstaking options
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-600" />
          <span className="text-sm text-gray-600">Staking System</span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="stake" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Stake
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Rewards
          </TabsTrigger>
          <TabsTrigger value="unstake" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Unstake
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <StakingOverview stakingContract={stakingContract} />
        </TabsContent>

        <TabsContent value="stake" className="space-y-6">
          <StakingManager stakingContract={stakingContract} />
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <StakingRewards stakingContract={stakingContract} />
        </TabsContent>

        <TabsContent value="unstake" className="space-y-6">
          <StakingUnstaking stakingContract={stakingContract} />
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <StakingConfiguration stakingContract={stakingContract} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
