// src/providers/TypinkProvider.tsx

'use client';

import { ReactNode } from 'react';
import { TypinkProvider as BaseTypinkProvider } from 'typink';

// Passet Hub Testnet Configuration (supports ink! v6 contracts)
const PASSET_HUB_NETWORK = {
  id: "passet_hub_testnet",
  name: "Passet Hub Testnet",
  rpc: "wss://passet-hub-paseo.ibp.network",
  chainId: 420420422,
  decimals: 10,
  symbol: "PAS",
  logo: "https://parachains.info/images/parachains/1688559044_assethub.svg",
  pjsUrl: "https://blockscout-passet-hub.parity-testnet.parity.io",
  faucetUrl: "https://faucet.passet-hub.parity-testnet.parity.io",
  providers: ["wss://passet-hub-paseo.ibp.network"]
};

// Contract addresses on Passet Hub Testnet (actual deployed addresses)
const CONTRACT_ADDRESSES = {
  TOKEN: '0xf830b0c05889cbd05b13bf87bee1ca52755aafe8', // Your deployed token contract
  ORACLE: '0xa7cc4e6f7459f6a120c7907e525c7f565daaf8ac', // To be deployed
  REGISTRY: '0xa85587de037304d67fa88f5d23c1d4b820e0d4bf', // To be deployed
  PORTFOLIO: '0xc9e68f98cb0dc6d3065fe89622026ea062dc7513', // To be deployed
  STAKING: '0x02a76f98f814455a7d5c89f86f23c557c27de89c', // To be deployed
  DEX: '0x5e0631f14dd2920bb582dd0ba6daf92f76ec4894' // To be deployed
};

// Import contract metadata for TypinkProvider
import tokenMetadata from '@/contracts/metadata/token.json';
import oracleMetadata from '@/contracts/metadata/oracle.json';
import registryMetadata from '@/contracts/metadata/registry.json';
import portfolioMetadata from '@/contracts/metadata/portfolio.json';
import stakingMetadata from '@/contracts/metadata/staking.json';
import dexMetadata from '@/contracts/metadata/dex.json';

// Import new Typink-generated contract APIs for type safety
import type { TokenContractApi } from '@/lib/contracts/token';
import type { OracleContractApi } from '@/lib/contracts/oracle';
import type { RegistryContractApi } from '@/lib/contracts/registry';
import type { PortfolioContractApi } from '@/lib/contracts/portfolio';
import type { StakingContractApi } from '@/lib/contracts/staking';
import type { DexContractApi } from '@/lib/contracts/dex';

// Contract deployments configuration using new Typink system
const deployments = [
  {
    id: 'token',
    network: 'passet_hub_testnet',
    address: CONTRACT_ADDRESSES.TOKEN,
    metadata: tokenMetadata
  },
  {
    id: 'oracle',
    network: 'passet_hub_testnet', 
    address: CONTRACT_ADDRESSES.ORACLE,
    metadata: oracleMetadata
  },
  {
    id: 'registry',
    network: 'passet_hub_testnet',
    address: CONTRACT_ADDRESSES.REGISTRY,
    metadata: registryMetadata
  },
  {
    id: 'portfolio',
    network: 'passet_hub_testnet',
    address: CONTRACT_ADDRESSES.PORTFOLIO,
    metadata: portfolioMetadata
  },
  {
    id: 'staking',
    network: 'passet_hub_testnet',
    address: CONTRACT_ADDRESSES.STAKING,
    metadata: stakingMetadata
  },
  {
    id: 'dex',
    network: 'passet_hub_testnet',
    address: CONTRACT_ADDRESSES.DEX,
    metadata: dexMetadata
  }
];

const supportedNetworks = [PASSET_HUB_NETWORK];

interface TypinkProviderProps {
  children: ReactNode;
}

export function TypinkProvider({ children }: TypinkProviderProps) {
  return (
            <BaseTypinkProvider
              appName="W3PI - Web3 Portfolio Intelligence"
              deployments={deployments}
              defaultNetworkId="passet_hub_testnet"
              supportedNetworks={supportedNetworks}
              defaultCaller="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY" // Alice for testing
            >
      {children}
    </BaseTypinkProvider>
  );
}

// Export contract addresses and configurations for use in components
export { CONTRACT_ADDRESSES, PASSET_HUB_NETWORK, deployments, supportedNetworks };
