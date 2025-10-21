'use client';

import { useState } from 'react';
import { useContract } from '@dedot/react';
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

export default function PortfolioPage() {
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Contract connection
  const portfolioContract = useContract(selectedPortfolio);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Management</h1>
          <p className="text-gray-600 mt-2">
            Manage token portfolios with automated rebalancing and fee collection
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-600" />
          <span className="text-sm text-gray-600">Portfolio System</span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
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
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <PortfolioOverview portfolioContract={portfolioContract} />
        </TabsContent>

        <TabsContent value="tokens" className="space-y-6">
          <PortfolioTokenManager portfolioContract={portfolioContract} />
        </TabsContent>

        <TabsContent value="composition" className="space-y-6">
          <PortfolioCompositionViewer portfolioContract={portfolioContract} />
        </TabsContent>

        <TabsContent value="fees" className="space-y-6">
          <PortfolioFeeManager portfolioContract={portfolioContract} />
        </TabsContent>

        <TabsContent value="state" className="space-y-6">
          <PortfolioStateManager portfolioContract={portfolioContract} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <PortfolioAnalytics portfolioContract={portfolioContract} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
