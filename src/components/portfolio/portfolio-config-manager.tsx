'use client';

import { useState, useEffect } from 'react';
import { useContract, useContractTx, useContractQuery } from 'typink';
import type { PortfolioContractApi } from '@/lib/contracts/portfolio';
import { CONTRACT_ADDRESSES } from '@/providers/TypinkProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Settings, RefreshCw, Copy } from 'lucide-react';

export default function PortfolioConfigManager() {
  const { contract: portfolioContract } = useContract<PortfolioContractApi>('portfolio');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state for contract addresses
  const [registryAddress, setRegistryAddress] = useState<string>(CONTRACT_ADDRESSES.REGISTRY);
  const [tokenAddress, setTokenAddress] = useState<string>(CONTRACT_ADDRESSES.TOKEN);
  const [dexAddress, setDexAddress] = useState<string>(CONTRACT_ADDRESSES.DEX);
  const [oracleAddress, setOracleAddress] = useState<string>(CONTRACT_ADDRESSES.ORACLE);

  // Current contract references (from queries)
  const [currentRegistry, setCurrentRegistry] = useState<string | null>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [currentDex, setCurrentDex] = useState<string | null>(null);
  const [currentOracle, setCurrentOracle] = useState<string | null>(null);

  // Transaction hooks
  const setRegistryTx = useContractTx(portfolioContract, 'setRegistryContract');
  const setTokenTx = useContractTx(portfolioContract, 'setTokenContract');
  const setDexTx = useContractTx(portfolioContract, 'setDexContract');
  const setOracleTx = useContractTx(portfolioContract, 'setOracleContract');

  // Query hooks for current references
  const registryQuery = useContractQuery({
    contract: portfolioContract,
    fn: 'getRegistryContract'
  });

  const tokenQuery = useContractQuery({
    contract: portfolioContract,
    fn: 'getTokenContract'
  });

  const dexQuery = useContractQuery({
    contract: portfolioContract,
    fn: 'getDexContract'
  });

  const oracleQuery = useContractQuery({
    contract: portfolioContract,
    fn: 'getOracleContract'
  });

  // Update current references when queries complete
  useEffect(() => {
    if (registryQuery.data) {
      setCurrentRegistry(registryQuery.data || null);
    }
    if (tokenQuery.data) {
      setCurrentToken(tokenQuery.data || null);
    }
    if (dexQuery.data) {
      setCurrentDex(dexQuery.data || null);
    }
    if (oracleQuery.data) {
      setCurrentOracle(oracleQuery.data || null);
    }
  }, [registryQuery.data, tokenQuery.data, dexQuery.data, oracleQuery.data]);

  // Helper function to validate H160 address
  const isValidAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Helper function to copy address to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Address copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  // Handle setting registry contract
  const handleSetRegistry = async () => {
    if (!isValidAddress(registryAddress)) {
      setError('Invalid registry contract address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await setRegistryTx.signAndSend({
        args: [registryAddress as `0x${string}`],
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            if (progress.dispatchError) {
              setError('Transaction failed');
            } else {
              setSuccess('Registry contract reference set successfully!');
              registryQuery.refresh();
            }
          }
        }
      });
    } catch (err: any) {
      setError(`Error setting registry contract: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle setting token contract
  const handleSetToken = async () => {
    if (!isValidAddress(tokenAddress)) {
      setError('Invalid token contract address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await setTokenTx.signAndSend({
        args: [tokenAddress as `0x${string}`],
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            if (progress.dispatchError) {
              setError('Transaction failed');
            } else {
              setSuccess('Token contract reference set successfully!');
              tokenQuery.refresh();
            }
          }
        }
      });
    } catch (err: any) {
      setError(`Error setting token contract: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle setting DEX contract
  const handleSetDex = async () => {
    if (!isValidAddress(dexAddress)) {
      setError('Invalid DEX contract address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await setDexTx.signAndSend({
        args: [dexAddress as `0x${string}`],
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            if (progress.dispatchError) {
              setError('Transaction failed');
            } else {
              setSuccess('DEX contract reference set successfully!');
              dexQuery.refresh();
            }
          }
        }
      });
    } catch (err: any) {
      setError(`Error setting DEX contract: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle setting oracle contract
  const handleSetOracle = async () => {
    if (!isValidAddress(oracleAddress)) {
      setError('Invalid oracle contract address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await setOracleTx.signAndSend({
        args: [oracleAddress as `0x${string}`],
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            if (progress.dispatchError) {
              setError('Transaction failed');
            } else {
              setSuccess('Oracle contract reference set successfully!');
              oracleQuery.refresh();
            }
          }
        }
      });
    } catch (err: any) {
      setError(`Error setting oracle contract: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh all queries
  const handleRefresh = () => {
    registryQuery.refresh();
    tokenQuery.refresh();
    dexQuery.refresh();
    oracleQuery.refresh();
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Contract References Configuration
              </CardTitle>
              <CardDescription>
                Configure contract references for Portfolio contract. These references enable cross-contract calls.
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
        <CardContent className="space-y-6">
          {/* Current References Display */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Current Contract References</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Registry Contract */}
              <div className="space-y-2">
                <Label>Registry Contract</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg font-mono text-sm">
                    {registryQuery.isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : currentRegistry ? (
                      <span className="flex items-center gap-2">
                        {currentRegistry}
                        <button
                          onClick={() => copyToClipboard(currentRegistry)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </span>
                    ) : (
                      <span className="text-gray-400">Not set</span>
                    )}
                  </div>
                  {currentRegistry && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>

              {/* Token Contract */}
              <div className="space-y-2">
                <Label>Token Contract (W3PI)</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg font-mono text-sm">
                    {tokenQuery.isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : currentToken ? (
                      <span className="flex items-center gap-2">
                        {currentToken}
                        <button
                          onClick={() => copyToClipboard(currentToken)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </span>
                    ) : (
                      <span className="text-gray-400">Not set</span>
                    )}
                  </div>
                  {currentToken && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>

              {/* DEX Contract */}
              <div className="space-y-2">
                <Label>DEX Contract</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg font-mono text-sm">
                    {dexQuery.isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : currentDex ? (
                      <span className="flex items-center gap-2">
                        {currentDex}
                        <button
                          onClick={() => copyToClipboard(currentDex)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </span>
                    ) : (
                      <span className="text-gray-400">Not set</span>
                    )}
                  </div>
                  {currentDex && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>

              {/* Oracle Contract */}
              <div className="space-y-2">
                <Label>Oracle Contract</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg font-mono text-sm">
                    {oracleQuery.isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : currentOracle ? (
                      <span className="flex items-center gap-2">
                        {currentOracle}
                        <button
                          onClick={() => copyToClipboard(currentOracle)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </span>
                    ) : (
                      <span className="text-gray-400">Not set</span>
                    )}
                  </div>
                  {currentOracle && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Forms */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-medium text-lg">Set Contract References</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure contract references. All addresses must be valid H160 format (0x followed by 40 hex characters).
            </p>

            {/* Registry Contract Form */}
            <div className="space-y-2">
              <Label htmlFor="registry-address">Registry Contract Address</Label>
              <div className="flex gap-2">
                <Input
                  id="registry-address"
                  type="text"
                  placeholder="0x..."
                  value={registryAddress}
                  onChange={(e) => setRegistryAddress(e.target.value)}
                  className="font-mono"
                />
                <Button
                  onClick={handleSetRegistry}
                  disabled={isLoading || !isValidAddress(registryAddress)}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Setting...
                    </>
                  ) : (
                    'Set Registry'
                  )}
                </Button>
              </div>
            </div>

            {/* Token Contract Form */}
            <div className="space-y-2">
              <Label htmlFor="token-address">Token Contract Address (W3PI)</Label>
              <div className="flex gap-2">
                <Input
                  id="token-address"
                  type="text"
                  placeholder="0x..."
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  className="font-mono"
                />
                <Button
                  onClick={handleSetToken}
                  disabled={isLoading || !isValidAddress(tokenAddress)}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Setting...
                    </>
                  ) : (
                    'Set Token'
                  )}
                </Button>
              </div>
            </div>

            {/* DEX Contract Form */}
            <div className="space-y-2">
              <Label htmlFor="dex-address">DEX Contract Address</Label>
              <div className="flex gap-2">
                <Input
                  id="dex-address"
                  type="text"
                  placeholder="0x..."
                  value={dexAddress}
                  onChange={(e) => setDexAddress(e.target.value)}
                  className="font-mono"
                />
                <Button
                  onClick={handleSetDex}
                  disabled={isLoading || !isValidAddress(dexAddress)}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Setting...
                    </>
                  ) : (
                    'Set DEX'
                  )}
                </Button>
              </div>
            </div>

            {/* Oracle Contract Form */}
            <div className="space-y-2">
              <Label htmlFor="oracle-address">Oracle Contract Address</Label>
              <div className="flex gap-2">
                <Input
                  id="oracle-address"
                  type="text"
                  placeholder="0x..."
                  value={oracleAddress}
                  onChange={(e) => setOracleAddress(e.target.value)}
                  className="font-mono"
                />
                <Button
                  onClick={handleSetOracle}
                  disabled={isLoading || !isValidAddress(oracleAddress)}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Setting...
                    </>
                  ) : (
                    'Set Oracle'
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Information */}
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 border-t pt-4">
            <p><strong>About Contract References:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Registry Contract: Manages token registrations and tier classifications</li>
              <li>Token Contract: The W3PI token contract for minting/burning operations</li>
              <li>DEX Contract: Handles token swaps during portfolio rebalancing</li>
              <li>Oracle Contract: Provides price feeds for portfolio valuation</li>
              <li>All configuration requires owner permissions</li>
              <li>These references enable cross-contract calls between Portfolio and other contracts</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

