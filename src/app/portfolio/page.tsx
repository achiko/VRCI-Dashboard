'use client';

import { useState } from 'react';
import { useTypink } from 'typink';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, TrendingUp, Wallet, Settings } from 'lucide-react';

// Import Portfolio components
import PortfolioOverview from '@/components/portfolio/portfolio-overview';
import PortfolioTokenManager from '@/components/portfolio/portfolio-token-manager';
import PortfolioCompositionViewer from '@/components/portfolio/portfolio-composition-viewer';
import PortfolioFeeManager from '@/components/portfolio/portfolio-fee-manager';
import PortfolioStateManager from '@/components/portfolio/portfolio-state-manager';
import PortfolioAnalytics from '@/components/portfolio/portfolio-analytics';
import PortfolioConfigManager from '@/components/portfolio/portfolio-config-manager';

export default function PortfolioPage() {
  const { signer, connectedAccount } = useTypink();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="container mx-auto py-10">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Portfolio Dashboard</CardTitle>
          <CardDescription>Manage and monitor your decentralized investment portfolio.</CardDescription>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tokens" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Tokens
          </TabsTrigger>
          <TabsTrigger value="composition" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Composition
          </TabsTrigger>
          <TabsTrigger value="fees" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Fees
          </TabsTrigger>
          <TabsTrigger value="state" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            State
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <PortfolioOverview />
        </TabsContent>

        <TabsContent value="tokens" className="space-y-6">
          <PortfolioTokenManager />
        </TabsContent>

        <TabsContent value="composition" className="space-y-6">
          <PortfolioCompositionViewer />
        </TabsContent>

        <TabsContent value="fees" className="space-y-6">
          <PortfolioFeeManager />
        </TabsContent>

        <TabsContent value="state" className="space-y-6">
          <PortfolioStateManager />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <PortfolioAnalytics />
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <PortfolioConfigManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
