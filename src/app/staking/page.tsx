'use client';

import { useState } from 'react';
import { useTypink } from 'typink';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, TrendingUp, Wallet, Settings, Clock, Copy } from 'lucide-react';
import { CONTRACT_ADDRESSES } from '@/providers/TypinkProvider';

// Import Staking components
import StakingOverview from '@/components/staking/staking-overview';
import StakingManager from '@/components/staking/staking-manager';
import StakingRewards from '@/components/staking/staking-rewards';
import StakingUnstaking from '@/components/staking/staking-unstaking';
import StakingConfiguration from '@/components/staking/staking-configuration';

export default function StakingPage() {
  const { signer, connectedAccount } = useTypink();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="container mx-auto py-10">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Staking Dashboard</CardTitle>
          <CardDescription>Manage your token staking and rewards.</CardDescription>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
              {CONTRACT_ADDRESSES.STAKING}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(CONTRACT_ADDRESSES.STAKING);
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              title="Copy contract address"
            >
              <Copy className="h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
            </button>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="space-y-6">
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
          <StakingOverview />
        </TabsContent>

        <TabsContent value="stake" className="space-y-6">
          <StakingManager />
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <StakingRewards />
        </TabsContent>

        <TabsContent value="unstake" className="space-y-6">
          <StakingUnstaking />
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <StakingConfiguration />
        </TabsContent>
      </Tabs>
    </div>
  );
}
