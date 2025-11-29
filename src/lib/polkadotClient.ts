import { ApiPromise, WsProvider } from '@polkadot/api';

let api: ApiPromise | null = null;

export interface PolkadotClientConfig {
  rpcUrl?: string;
}

/**
 * Get or create a Polkadot API client instance
 * Uses singleton pattern to reuse connection
 */
export const getPolkadotClient = async (config?: PolkadotClientConfig): Promise<ApiPromise> => {
  // If API exists and is connected, return it
  if (api && api.isConnected) {
    return api;
  }

  // Use Passet Hub Testnet RPC URL (same as TypinkProvider)
  const rpcUrl = config?.rpcUrl || 
    process.env.NEXT_PUBLIC_RPC_URL || 
    'wss://passet-hub-paseo.ibp.network';
  
  const provider = new WsProvider(rpcUrl);
  api = await ApiPromise.create({ provider });
  
  // Wait for API to be ready
  await api.isReady;

  return api;
};

/**
 * Disconnect the Polkadot client
 */
export const disconnectPolkadotClient = async (): Promise<void> => {
  if (api) {
    await api.disconnect();
    api = null;
  }
};

