'use client';

import { useState, useEffect } from 'react';
import { useTokens, type Token } from '@/hooks/api/useTokens';
import { useOracleQuery } from '@/hooks/api/useOracleQuery';
import { useContract, useContractTx, useContractQuery } from 'typink';
import type { RegistryContractApi } from '@/lib/contracts/registry';
import type { OracleContractApi } from '@/lib/contracts/oracle';
import { DEPLOYED_TOKENS, getDeployedToken } from '@/lib/token-deployments';
import { CONTRACT_ADDRESSES } from '@/providers/TypinkProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Loader2, RefreshCw, Database, ExternalLink, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { txToaster } from '@/utils/txToaster';
import { LabelWithHelp } from '@/components/ui/field-help';

interface TokenRegistrationStatus {
  tokenId?: number;
  isRegistered: boolean;
  hasOraclePrice: boolean;
  lastOracleUpdate?: Date;
}

export function TokenRegistrationManager() {
  const router = useRouter();
  const { data: tokens, isLoading: tokensLoading, refetch: refetchTokens } = useTokens();
  const { contract: registryContract } = useContract<RegistryContractApi>('registry');
  const { contract: oracleContract } = useContract<OracleContractApi>('oracle');
  
  const addTokenTx = useContractTx(registryContract, 'addToken');
  const updateTokenDataTx = useContractTx(oracleContract, 'updateTokenData');
  
  // Get enabled token symbols for Oracle data
  const enabledSymbols = tokens?.filter((t) => t.enabled).map((t) => t.symbol) || [];
  const { data: oracleData, isLoading: oracleLoading, refetch: refetchOracle } = useOracleQuery(
    enabledSymbols,
    {
      enabled: enabledSymbols.length > 0,
      staleTime: 60 * 1000,
    }
  );

  const [registrationStatuses, setRegistrationStatuses] = useState<Record<string, TokenRegistrationStatus>>({});
  const [isRegistering, setIsRegistering] = useState<Record<string, boolean>>({});
  const [isUpdatingPrice, setIsUpdatingPrice] = useState<Record<string, boolean>>({});

  // Query Registry for token count and check if tokens are registered
  const tokenCountQuery = useContractQuery({
    contract: registryContract,
    fn: 'getTokenCount',
  });

  // Check registration status for each token from chain
  useEffect(() => {
    if (!tokens || !registryContract) return;

    const checkStatuses = async () => {
      const statuses: Record<string, TokenRegistrationStatus> = {};
      
      for (const token of tokens) {
        if (!token.enabled) continue;
        
        const deployedToken = getDeployedToken(token.symbol);
        if (!deployedToken) {
          statuses[token.symbol] = {
            isRegistered: false,
            hasOraclePrice: false,
          };
          continue;
        }

        // Check if token is registered by querying the chain
        try {
          const tokenIdResult = await registryContract.query.getTokenIdByContract(
            deployedToken.contractAddress as `0x${string}`
          );
          
          const tokenId = tokenIdResult.data;
          const isRegistered = tokenId !== undefined && tokenId !== null;
          
          statuses[token.symbol] = {
            isRegistered,
            tokenId: isRegistered ? Number(tokenId) : undefined,
            hasOraclePrice: !!oracleData?.[token.symbol]?.price,
          };
        } catch (err) {
          // If query fails, assume not registered
          console.error(`Error checking registration for ${token.symbol}:`, err);
          statuses[token.symbol] = {
            isRegistered: false,
            hasOraclePrice: !!oracleData?.[token.symbol]?.price,
          };
        }
      }
      
      setRegistrationStatuses(statuses);
    };

    checkStatuses();
  }, [tokens, registryContract, oracleData, tokenCountQuery.data]);

  const handleRegisterToken = async (token: Token) => {
    if (!registryContract || !oracleContract) {
      alert('Contracts not available. Please connect your wallet.');
      return;
    }

    const deployedToken = getDeployedToken(token.symbol);
    if (!deployedToken) {
      alert(`No deployed contract found for ${token.symbol}. Please check TOKEN_DEPLOYMENTS.md`);
      return;
    }

    setIsRegistering((prev) => ({ ...prev, [token.symbol]: true }));
    const toaster = txToaster(`Registering ${token.symbol} in Registry...`);

    try {
      toaster.onTxPending();
      
      await addTokenTx.signAndSend({
        args: [
          deployedToken.contractAddress as `0x${string}`,
          CONTRACT_ADDRESSES.ORACLE as `0x${string}`,
        ],
        callback: async (progress) => {
          toaster.onTxProgress(progress);
          if (progress.status.type === 'BestChainBlockIncluded' && !progress.dispatchError) {
            // Extract token ID from events
            let newTokenId: number | undefined;
            for (const event of progress.events || []) {
              if (event.event && typeof event.event === 'object' && 'TokenAdded' in event.event) {
                const tokenAdded = (event.event as any).TokenAdded;
                if (tokenAdded?.token_id !== undefined) {
                  newTokenId = Number(tokenAdded.token_id);
                }
              }
            }

            // Refresh token count first
            await tokenCountQuery.refresh();
            
            // Re-check registration status for all tokens
            const tokenIdResult = await registryContract.query.getTokenIdByContract(
              deployedToken.contractAddress as `0x${string}`
            );
            const confirmedTokenId = tokenIdResult.data;
            
            setRegistrationStatuses((prev) => ({
              ...prev,
              [token.symbol]: {
                ...prev[token.symbol],
                isRegistered: true,
                tokenId: confirmedTokenId ? Number(confirmedTokenId) : newTokenId,
              },
            }));

            refetchTokens();
          }
        },
      });
    } catch (err) {
      console.error('Register token error:', err);
      toaster.onTxError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsRegistering((prev) => ({ ...prev, [token.symbol]: false }));
    }
  };

  const handleUpdateOraclePrice = async (token: Token) => {
    if (!oracleContract) {
      alert('Oracle contract not available. Please connect your wallet.');
      return;
    }

    const deployedToken = getDeployedToken(token.symbol);
    if (!deployedToken) {
      alert(`No deployed contract found for ${token.symbol}`);
      return;
    }

    const tokenData = oracleData?.[token.symbol];
    if (!tokenData?.price) {
      alert(`No price data available for ${token.symbol} from CoinMarketCap`);
      return;
    }

    setIsUpdatingPrice((prev) => ({ ...prev, [token.symbol]: true }));
    const toaster = txToaster(`Updating ${token.symbol} price in Oracle...`);

    try {
      // Convert USD price to plancks (10^10 decimals for PAS)
      // Price from CoinMarketCap is in USD, we need to convert to plancks
      const priceInPlancks = BigInt(Math.floor(tokenData.price * 10 ** 10));
      
      // Market cap and volume in plancks
      const marketCapInPlancks = tokenData.marketCap 
        ? BigInt(Math.floor(tokenData.marketCap * 10 ** 10))
        : BigInt(0);
      const volumeInPlancks = tokenData.volume24h
        ? BigInt(Math.floor(tokenData.volume24h * 10 ** 10))
        : BigInt(0);

      toaster.onTxPending();

      await updateTokenDataTx.signAndSend({
        args: [
          deployedToken.contractAddress as `0x${string}`,
          priceInPlancks,
          marketCapInPlancks,
          volumeInPlancks,
        ],
        callback: (progress) => {
          toaster.onTxProgress(progress);
          if (progress.status.type === 'BestChainBlockIncluded' && !progress.dispatchError) {
            setRegistrationStatuses((prev) => ({
              ...prev,
              [token.symbol]: {
                ...prev[token.symbol],
                hasOraclePrice: true,
                lastOracleUpdate: new Date(),
              },
            }));

            refetchOracle();
          }
        },
      });
    } catch (err) {
      console.error('Update price error:', err);
      toaster.onTxError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsUpdatingPrice((prev) => ({ ...prev, [token.symbol]: false }));
    }
  };

  const handleRefresh = () => {
    refetchTokens();
    refetchOracle();
    tokenCountQuery.refresh();
  };

  if (tokensLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading tokens...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tokensWithDeployments = tokens?.filter((t) => t.enabled && getDeployedToken(t.symbol)) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Token Registration Manager
            </CardTitle>
            <CardDescription>
              Register tokens from admin database to Registry contract and update Oracle prices using CoinMarketCap data
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={oracleLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${oracleLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This tool links admin tokens (from CoinMarketCap) to deployed contract addresses and registers them in the Registry contract. 
              It also updates Oracle prices using live CoinMarketCap data to simulate real oracle feeds on testnet.
            </AlertDescription>
          </Alert>

          {/* Registry Status */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Registry Token Count:</span>
              {tokenCountQuery.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Badge variant="outline">{tokenCountQuery.data?.toString() || '0'}</Badge>
              )}
            </div>
          </div>

          {/* Tokens Table */}
          {tokensWithDeployments.length === 0 ? (
            <Alert>
              <AlertDescription>
                No tokens with deployed contracts found. Make sure tokens in the admin database match symbols in TOKEN_DEPLOYMENTS.md
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>TOKEN</TableHead>
                    <TableHead>CONTRACT ADDRESS</TableHead>
                    <TableHead>CMC PRICE</TableHead>
                    <TableHead>REGISTRY STATUS</TableHead>
                    <TableHead>ORACLE STATUS</TableHead>
                    <TableHead className="text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokensWithDeployments.map((token) => {
                    const deployedToken = getDeployedToken(token.symbol);
                    const status = registrationStatuses[token.symbol] || {
                      isRegistered: false,
                      hasOraclePrice: false,
                    };
                    const tokenData = oracleData?.[token.symbol];
                    const isRegisteringToken = isRegistering[token.symbol] || false;
                    const isUpdatingTokenPrice = isUpdatingPrice[token.symbol] || false;

                    return (
                      <TableRow 
                        key={token.id}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => {
                          if (deployedToken?.contractAddress) {
                            router.push(`/admin/token/${deployedToken.contractAddress}`);
                          }
                        }}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{token.symbol}</div>
                            <div className="text-xs text-gray-500">{token.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-xs">
                            {deployedToken?.contractAddress.slice(0, 10)}...
                            {deployedToken?.contractAddress.slice(-8)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {tokenData?.price ? (
                            <span className="font-medium">${tokenData.price.toFixed(4)}</span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {status.isRegistered ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Registered {status.tokenId && `(ID: ${status.tokenId})`}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              <XCircle className="h-3 w-3 mr-1" />
                              Not Registered
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {status.hasOraclePrice ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Price Set
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              <XCircle className="h-3 w-3 mr-1" />
                              No Price
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!status.isRegistered && (
                              <Button
                                size="sm"
                                onClick={() => handleRegisterToken(token)}
                                disabled={isRegisteringToken || !registryContract}
                              >
                                {isRegisteringToken ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Registering...
                                  </>
                                ) : (
                                  'Register'
                                )}
                              </Button>
                            )}
                            {tokenData?.price && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateOraclePrice(token)}
                                disabled={isUpdatingTokenPrice || !oracleContract}
                              >
                                {isUpdatingTokenPrice ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  'Update Price'
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

