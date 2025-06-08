// src/app/page.tsx

'use client';

import { WalletConnector } from '@/components/wallet-connector';
import { OraclePriceFetcher } from '@/components/oracle-price-fetcher';
import { useTypink } from 'typink';

export default function HomePage() {
  const { signer, connectedAccount } = useTypink();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              W3PI - Web3 Portfolio Intelligence
            </h1>
            <p className="text-xl text-gray-600">
              Decentralized portfolio management built with ink! smart contracts
            </p>
          </div>
          <WalletConnector />
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Network Status
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">POP Testnet Connected</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Using RPC: wss://rpc2.paseo.popnetwork.xyz
            </p>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Wallet Status
            </h3>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${signer ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-700">
                  {signer ? 'Wallet Connected' : 'Wallet Disconnected'}
                </span>
              </div>
              {connectedAccount && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">
                    Account: {connectedAccount.name}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {signer ? 'Ready for contract interactions' : 'Connect wallet to interact with contracts'}
            </p>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Smart Contracts
            </h3>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Oracle Contract</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-700">Registry Contract</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Oracle ready • Registry coming soon
            </p>
          </div>
        </div>

        {/* Oracle Price Fetcher Section */}
        {signer && connectedAccount ? (
          <div className="mb-8">
            <OraclePriceFetcher />
          </div>
        ) : (
          <div className="mb-8">
            <div className="card text-center py-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Oracle Contract Interaction
              </h2>
              <p className="text-gray-600 mb-4">
                Connect your wallet to interact with the oracle contract and fetch price data
              </p>
              <div className="text-sm text-gray-500">
                Available functions: get_price, get_market_cap, get_market_volume
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              className={`btn-primary text-left p-4 rounded-lg transition-all ${!signer ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                }`}
              disabled={!signer}
            >
              <h3 className="font-semibold mb-1">Query Oracle Price</h3>
              <p className="text-sm opacity-90">
                Get live price data from the oracle contract
              </p>
            </button>
            <button
              className="btn-outline text-left p-4 rounded-lg transition-all hover:scale-105"
            >
              <h3 className="font-semibold mb-1">View Portfolio</h3>
              <p className="text-sm text-gray-600">
                Check your token holdings and balances
              </p>
            </button>
            <button
              className="btn-outline text-left p-4 rounded-lg transition-all hover:scale-105"
            >
              <h3 className="font-semibold mb-1">Market Data</h3>
              <p className="text-sm text-gray-600">
                View comprehensive market analytics
              </p>
            </button>
            <button
              className={`btn-outline text-left p-4 rounded-lg transition-all ${!signer ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                }`}
              disabled={!signer}
            >
              <h3 className="font-semibold mb-1">Manage Tokens</h3>
              <p className="text-sm text-gray-600">
                Add or update token configurations
              </p>
            </button>
          </div>
        </div>

        {/* Contract Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Oracle Contract
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-medium">Deployed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Network:</span>
                <span className="text-gray-900">Pop Testnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Functions:</span>
                <span className="text-gray-900">3 public queries</span>
              </div>
            </div>
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600">
              Features: Price feeds, Market cap, Trading volume
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Registry Contract
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-yellow-600 font-medium">Coming Soon</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Purpose:</span>
                <span className="text-gray-900">Token Management</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Features:</span>
                <span className="text-gray-900">Portfolio tracking</span>
              </div>
            </div>
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600">
              Functions: Add tokens, Update balances, Portfolio queries
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Built with <span className="text-primary font-semibold">ink!</span> smart contracts and{' '}
            <span className="text-secondary font-semibold">Typink</span> SDK
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {signer ? 'Ready for contract interactions' : 'Connect your wallet to get started'}
          </p>
        </div>
      </div>
    </div>
  );
}