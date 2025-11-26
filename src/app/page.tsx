// src/app/page.tsx

'use client';

import { NetworkStatusCard } from '@/components/cards/network-status-card';
import { WalletStatusCard } from '@/components/cards/wallet-status-card';
import { ContractsStatusCard } from '@/components/cards/contracts-status-card';
import { QuickActionsSection } from '@/components/sections/quick-actions-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useTypink } from 'typink';

export default function HomePage() {
  const { signer, connectedAccount } = useTypink();
  const USDC_ADDRESS = '0xd81f336aa2d51efaf4466d764e1c75ef29044c55';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className=" mx-auto p-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            W3PI - Web3 Portfolio Intelligence
          </h1>
          <p className="text-xl text-gray-600">
            Decentralized portfolio management built with ink! smart contracts
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <NetworkStatusCard />
          <WalletStatusCard />
          <ContractsStatusCard />
        </div>

        {/* Reference Contracts */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">
                USDC Testnet Reference
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">USDC Contract Address</p>
                <p className="font-mono text-sm break-all text-gray-900">{USDC_ADDRESS}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigator.clipboard.writeText(USDC_ADDRESS)}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Address
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <QuickActionsSection />

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Built with <span className="text-primary font-semibold">ink!</span> smart contracts and{' '}
            <span className="text-secondary font-semibold">Typink</span> SDK
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {signer ? (
              <>
                Connected as {connectedAccount?.name} •
                <span className="text-green-600"> Ready for transactions</span>
              </>
            ) : (
              'Connect your wallet to get started'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}