'use client';

import { useState } from 'react';
import { useContract } from 'typink';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, TrendingUp, Wallet, Settings, ArrowLeftRight } from 'lucide-react';

// Import DEX components
import DexOverview from '@/components/dex/dex-overview';
import DexSwap from '@/components/dex/dex-swap';
import DexPoolManager from '@/components/dex/dex-pool-manager';
import DexPriceViewer from '@/components/dex/dex-price-viewer';

export default function DexPage() {
  const [selectedDex, setSelectedDex] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Contract connection
  const dexContract = useContract(selectedDex);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">DEX Management</h1>
          <p className="text-gray-600 mt-2">
            Decentralized exchange for token swaps and liquidity management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-600" />
          <span className="text-sm text-gray-600">DEX System</span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
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
