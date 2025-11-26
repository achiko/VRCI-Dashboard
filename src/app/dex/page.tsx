'use client';

import { useState } from 'react';
import { useTypink } from 'typink';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, TrendingUp, Wallet, Settings, ArrowLeftRight, Copy } from 'lucide-react';
import { CONTRACT_ADDRESSES } from '@/providers/TypinkProvider';

// Import DEX components
import DexOverview from '@/components/dex/dex-overview';
import DexSwap from '@/components/dex/dex-swap';
import DexPoolManager from '@/components/dex/dex-pool-manager';
import DexPriceViewer from '@/components/dex/dex-price-viewer';

export default function DexPage() {
  const { signer, connectedAccount } = useTypink();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="container mx-auto py-10">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">DEX Dashboard</CardTitle>
          <CardDescription>Decentralized exchange for token swaps and liquidity management.</CardDescription>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
              {CONTRACT_ADDRESSES.DEX}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(CONTRACT_ADDRESSES.DEX);
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="swap" className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Swap
          </TabsTrigger>
          <TabsTrigger value="pools" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Pools
          </TabsTrigger>
          <TabsTrigger value="prices" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Prices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DexOverview />
        </TabsContent>

        <TabsContent value="swap" className="space-y-6">
          <DexSwap />
        </TabsContent>

        <TabsContent value="pools" className="space-y-6">
          <DexPoolManager />
        </TabsContent>

        <TabsContent value="prices" className="space-y-6">
          <DexPriceViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
