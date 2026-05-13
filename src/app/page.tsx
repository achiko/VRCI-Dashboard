// src/app/page.tsx

'use client';

import { useTypink } from 'typink';
import { NetworkStatusCard } from '@/components/cards/network-status-card';
import { WalletStatusCard } from '@/components/cards/wallet-status-card';
import { ContractsStatusCard } from '@/components/cards/contracts-status-card';
import { QuickActionsSection } from '@/components/sections/quick-actions-section';
import {
  IndexHeroCard,
  IndexPerformanceChart,
  PortfolioCompositionChart,
  TierStatusCard,
  QuickStatsRow,
} from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { USDC_TOKEN_ADDRESS } from '@/lib/contract-addresses';
import { Copy, BookOpen, MessageCircle, Github } from 'lucide-react';

export default function HomePage() {
  const { signer, connectedAccount } = useTypink();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                W3PI Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Web3 Portfolio Intelligence • Decentralized Index Fund
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Docs
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Discord
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Github className="h-4 w-4" />
                GitHub
              </Button>
            </div>
          </div>
        </header>

        {/* Index Hero Card - Main Value Display */}
        <section className="mb-8">
          <IndexHeroCard />
        </section>

        {/* Quick Stats Row */}
        <section className="mb-8">
          <QuickStatsRow />
        </section>

        {/* Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <IndexPerformanceChart />
          <PortfolioCompositionChart />
        </section>

        {/* Tier Status and Connection Cards */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <TierStatusCard />
          <div className="lg:col-span-2 space-y-6">
            {/* Status Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NetworkStatusCard />
              <WalletStatusCard />
              <ContractsStatusCard />
            </div>

            {/* USDC Reference */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-gray-800">
                  USDC Testnet Reference
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Contract Address</p>
                  <p className="font-mono text-xs break-all text-gray-900">{USDC_TOKEN_ADDRESS}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(USDC_TOKEN_ADDRESS)}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-8">
          <QuickActionsSection />
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-500">
                Built with <span className="text-indigo-600 font-semibold">ink!</span> smart contracts and{' '}
                <span className="text-purple-600 font-semibold">Typink</span> SDK
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {signer ? (
                  <>
                    Connected as <span className="font-medium">{connectedAccount?.name}</span> •
                    <span className="text-green-600"> Ready for transactions</span>
                  </>
                ) : (
                  'Connect your wallet to interact with the index'
                )}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>VRCI Global</span>
              <span>•</span>
              <span>Swiss Trust</span>
              <span>•</span>
              <span>3-of-5 Multisig</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
