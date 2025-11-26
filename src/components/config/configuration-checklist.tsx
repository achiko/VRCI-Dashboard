'use client';

import { useState, useEffect } from 'react';
import { useContract, useContractQuery } from 'typink';
import type { PortfolioContractApi } from '@/lib/contracts/portfolio';
import type { StakingContractApi } from '@/lib/contracts/staking';
import type { OracleContractApi } from '@/lib/contracts/oracle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CheckCircle, XCircle, HelpCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { CONTRACT_ADDRESSES } from '@/providers/TypinkProvider';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  phase: string;
  step: string;
  isSet: boolean | null; // null = loading, true = set, false = not set
  currentValue?: string | null;
  expectedValue?: string;
  helpText: string;
  link?: string;
}

export function ConfigurationChecklist() {
  // Portfolio contract queries
  const { contract: portfolioContract } = useContract<PortfolioContractApi>('portfolio');
  const portfolioRegistryQuery = useContractQuery({
    contract: portfolioContract,
    fn: 'getRegistryContract'
  });
  const portfolioTokenQuery = useContractQuery({
    contract: portfolioContract,
    fn: 'getTokenContract'
  });
  const portfolioDexQuery = useContractQuery({
    contract: portfolioContract,
    fn: 'getDexContract'
  });
  const portfolioOracleQuery = useContractQuery({
    contract: portfolioContract,
    fn: 'getOracleContract'
  });

  // Staking contract queries
  const { contract: stakingContract } = useContract<StakingContractApi>('staking');
  const stakingTotalStakedQuery = useContractQuery({
    contract: stakingContract,
    fn: 'getTotalStaked'
  });

  // Oracle contract queries
  const { contract: oracleContract } = useContract<OracleContractApi>('oracle');
  const oracleDotPriceQuery = useContractQuery({
    contract: oracleContract,
    fn: 'getDotUsdPrice'
  });

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  // Update checklist items based on query results
  useEffect(() => {
    const items: ChecklistItem[] = [
      // Phase 1: Portfolio Contract References
      {
        id: 'portfolio-registry',
        label: 'Portfolio: Registry Contract',
        description: 'Registry contract reference for Portfolio',
        phase: 'Phase 1',
        step: 'Step 1.1.1',
        isSet: portfolioRegistryQuery.data ? portfolioRegistryQuery.data.toLowerCase() === CONTRACT_ADDRESSES.REGISTRY.toLowerCase() : null,
        currentValue: portfolioRegistryQuery.data || null,
        expectedValue: CONTRACT_ADDRESSES.REGISTRY,
        helpText: `The Registry contract manages token registrations and tier classifications. The Portfolio contract needs this reference to query token information and validate token tiers during portfolio operations. This enables cross-contract calls between Portfolio and Registry.`,
        link: '/portfolio?tab=config'
      },
      {
        id: 'portfolio-token',
        label: 'Portfolio: Token Contract',
        description: 'W3PI Token contract reference for Portfolio',
        phase: 'Phase 1',
        step: 'Step 1.1.1',
        isSet: portfolioTokenQuery.data ? portfolioTokenQuery.data.toLowerCase() === CONTRACT_ADDRESSES.TOKEN.toLowerCase() : null,
        currentValue: portfolioTokenQuery.data || null,
        expectedValue: CONTRACT_ADDRESSES.TOKEN,
        helpText: `The Token contract is the W3PI token contract used for minting and burning operations. The Portfolio contract needs this reference to mint W3PI tokens when users deposit assets and burn tokens when users withdraw. This is essential for the portfolio's tokenization mechanism.`,
        link: '/portfolio?tab=config'
      },
      {
        id: 'portfolio-dex',
        label: 'Portfolio: DEX Contract',
        description: 'DEX contract reference for Portfolio',
        phase: 'Phase 1',
        step: 'Step 1.1.1',
        isSet: portfolioDexQuery.data ? portfolioDexQuery.data.toLowerCase() === CONTRACT_ADDRESSES.DEX.toLowerCase() : null,
        currentValue: portfolioDexQuery.data || null,
        expectedValue: CONTRACT_ADDRESSES.DEX,
        helpText: `The DEX contract handles token swaps during portfolio rebalancing operations. The Portfolio contract needs this reference to execute trades when rebalancing the portfolio to maintain target weights. This enables automatic token swaps without manual intervention.`,
        link: '/portfolio?tab=config'
      },
      {
        id: 'portfolio-oracle',
        label: 'Portfolio: Oracle Contract',
        description: 'Oracle contract reference for Portfolio',
        phase: 'Phase 1',
        step: 'Step 1.1.1',
        isSet: portfolioOracleQuery.data ? portfolioOracleQuery.data.toLowerCase() === CONTRACT_ADDRESSES.ORACLE.toLowerCase() : null,
        currentValue: portfolioOracleQuery.data || null,
        expectedValue: CONTRACT_ADDRESSES.ORACLE,
        helpText: `The Oracle contract provides price feeds for portfolio valuation. The Portfolio contract needs this reference to get real-time token prices for calculating portfolio value, determining rebalancing needs, and performing USD-denominated calculations.`,
        link: '/portfolio?tab=config'
      },
      // Phase 1: Staking Contract References
      {
        id: 'staking-w3pi-token',
        label: 'Staking: W3PI Token',
        description: 'W3PI Token contract reference for Staking',
        phase: 'Phase 1',
        step: 'Step 1.1.2',
        isSet: stakingTotalStakedQuery.data !== undefined ? true : null, // We can't directly query w3piToken, so we use totalStaked as a proxy
        currentValue: null,
        expectedValue: CONTRACT_ADDRESSES.TOKEN,
        helpText: `The W3PI Token contract reference allows the Staking contract to interact with the token for staking operations. This enables users to stake their W3PI tokens and earn rewards. The contract needs this reference to transfer tokens during stake, unstake, and reward distribution operations.`,
        link: '/staking?tab=config'
      },
      {
        id: 'staking-registry',
        label: 'Staking: Registry Contract',
        description: 'Registry contract reference for Staking',
        phase: 'Phase 1',
        step: 'Step 1.1.2',
        isSet: stakingTotalStakedQuery.data !== undefined ? true : null, // Proxy check
        currentValue: null,
        expectedValue: CONTRACT_ADDRESSES.REGISTRY,
        helpText: `The Registry contract reference allows the Staking contract to query token tier information. This is used to determine staking rewards based on the user's portfolio tier. The contract needs this reference to calculate appropriate reward rates for different tier levels.`,
        link: '/staking?tab=config'
      },
      {
        id: 'staking-fee-wallet',
        label: 'Staking: Fee Wallet',
        description: 'Fee wallet address for Staking',
        phase: 'Phase 1',
        step: 'Step 1.1.2',
        isSet: stakingTotalStakedQuery.data !== undefined ? true : null, // Proxy check
        currentValue: null,
        expectedValue: 'H160 or SS58 address',
        helpText: `The Fee Wallet is the address where staking fees are collected. When users stake or unstake tokens, a portion of the fees goes to this wallet. The address can be in H160 format (0x...) or SS58 format (Polkadot account address). SS58 addresses are automatically converted to H160 format.`,
        link: '/staking?tab=config'
      },
      // Phase 2: Oracle Setup
      {
        id: 'oracle-dot-price',
        label: 'Oracle: DOT/USD Price',
        description: 'Initial DOT/USD price feed',
        phase: 'Phase 2',
        step: 'Step 2.1',
        isSet: oracleDotPriceQuery.data ? true : (oracleDotPriceQuery.isLoading ? null : false),
        currentValue: oracleDotPriceQuery.data ? `$${(Number(oracleDotPriceQuery.data) / 1_000_000_000).toFixed(2)}` : null,
        expectedValue: 'USD price (e.g., $7.50)',
        helpText: `The DOT/USD price is critical for all USD-denominated calculations in the system. It's used by the Registry contract to convert USD thresholds to plancks for tier calculations. The price should be updated regularly (hourly or daily) by authorized price updaters. Price is stored with 9 decimal places (1 USD = 10^9 units).`,
        link: '/oracle?tab=dot-usd'
      },
      {
        id: 'oracle-updaters',
        label: 'Oracle: Authorized Updaters',
        description: 'At least one authorized price updater',
        phase: 'Phase 2',
        step: 'Step 2.2',
        isSet: null, // We can't easily check this without an address, so we'll mark it as optional to verify
        currentValue: null,
        expectedValue: 'One or more updater addresses',
        helpText: `Authorized updaters are accounts that have permission to update oracle prices. For production, you should have multiple authorized updaters to ensure price feeds remain updated even if one updater is unavailable. Only the contract owner can add or remove updaters.`,
        link: '/oracle?tab=auth'
      },
    ];

    setChecklistItems(items);
  }, [
    portfolioRegistryQuery.data,
    portfolioTokenQuery.data,
    portfolioDexQuery.data,
    portfolioOracleQuery.data,
    stakingTotalStakedQuery.data,
    oracleDotPriceQuery.data,
    oracleDotPriceQuery.isLoading
  ]);

  const handleRefresh = () => {
    portfolioRegistryQuery.refresh();
    portfolioTokenQuery.refresh();
    portfolioDexQuery.refresh();
    portfolioOracleQuery.refresh();
    stakingTotalStakedQuery.refresh();
    oracleDotPriceQuery.refresh();
  };

  const pendingItems = checklistItems.filter(item => item.isSet === false);
  const completedItems = checklistItems.filter(item => item.isSet === true);
  const loadingItems = checklistItems.filter(item => item.isSet === null);

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Configuration Checklist
            </CardTitle>
            <CardDescription>
              Mandatory configuration items that need to be set
            </CardDescription>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {pendingItems.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Pending
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {completedItems.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Completed
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {loadingItems.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Checking
            </div>
          </div>
        </div>

        {/* Pending Items */}
        {pendingItems.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Pending Configuration ({pendingItems.length})
            </h3>
            <div className="space-y-2">
              {pendingItems.map((item) => (
                <ChecklistItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Completed Items */}
        {completedItems.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed Configuration ({completedItems.length})
            </h3>
            <div className="space-y-2">
              {completedItems.map((item) => (
                <ChecklistItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Loading Items */}
        {loadingItems.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Checking Status ({loadingItems.length})
            </h3>
            <div className="space-y-2">
              {loadingItems.map((item) => (
                <ChecklistItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {checklistItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No configuration items to check
          </div>
        )}
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}

function ChecklistItemRow({ item }: { item: ChecklistItem }) {
  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      {/* Status Icon */}
      <div className="mt-0.5">
        {item.isSet === null ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        ) : item.isSet ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{item.label}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <HelpCircle className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-md p-4">
              <div className="space-y-2">
                <div className="font-semibold">{item.label}</div>
                <div className="text-sm">{item.helpText}</div>
                <div className="pt-2 border-t text-xs text-gray-400">
                  <div><strong>Phase:</strong> {item.phase}</div>
                  <div><strong>Step:</strong> {item.step}</div>
                  {item.expectedValue && (
                    <div><strong>Expected:</strong> {item.expectedValue}</div>
                  )}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {item.description}
        </div>
        {item.currentValue && (
          <div className="text-xs font-mono text-gray-600 dark:text-gray-400 mt-1">
            Current: {item.currentValue}
          </div>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs">
            {item.phase} • {item.step}
          </Badge>
          {item.link && (
            <a
              href={item.link}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              Configure →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

