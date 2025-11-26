'use client';

import { useState, useEffect } from 'react';
import { useContract, useContractQuery } from 'typink';
import type { RegistryContractApi } from '@/lib/contracts/registry';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, RefreshCw, Package, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { getDeployedToken, DEPLOYED_TOKENS } from '@/lib/token-deployments';

interface TokenData {
  tokenId: number;
  contractAddress: string;
  symbol?: string;
  name?: string;
  balance?: bigint;
  weightInvestment?: number;
  tier?: string;
}

export function RegistryTokensList() {
  const { contract: registryContract } = useContract<RegistryContractApi>('registry');
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tokenCountQuery = useContractQuery({
    contract: registryContract,
    fn: 'getTokenCount',
  });

  const loadTokens = async () => {
    if (!registryContract) {
      setError('Registry contract not available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Refresh token count first
      await tokenCountQuery.refresh();
      const count = Number(tokenCountQuery.data || 0);

      if (count === 0) {
        setTokens([]);
        setIsLoading(false);
        return;
      }

      // Query each token ID from 1 to count
      const tokenPromises: Promise<TokenData | null>[] = [];
      
      for (let tokenId = 1; tokenId <= count; tokenId++) {
        tokenPromises.push(
          (async () => {
            try {
              // Get basic token data
              const basicDataResult = await registryContract.query.getBasicTokenData(tokenId);
              
              if (!basicDataResult.data) {
                return null;
              }

              // Handle Result type
              let tokenData: any = null;
              if ('isOk' in basicDataResult.data && basicDataResult.data.isOk) {
                tokenData = basicDataResult.data.value;
              } else if ('isErr' in basicDataResult.data && basicDataResult.data.isErr) {
                console.warn(`Token ${tokenId} query error:`, basicDataResult.data.err);
                return null;
              } else {
                tokenData = basicDataResult.data;
              }

              if (!tokenData) {
                return null;
              }

              // Try to get enhanced data for tier info
              let tier: string | undefined;
              try {
                const enhancedResult = await registryContract.query.getEnhancedTokenData(tokenId);
                if (enhancedResult.data && 'isOk' in enhancedResult.data && enhancedResult.data.isOk) {
                  const enhanced = enhancedResult.data.value;
                  if (enhanced?.tier) {
                    tier = String(enhanced.tier);
                  }
                }
              } catch (err) {
                // Enhanced query failed, continue without tier
                console.warn(`Failed to get enhanced data for token ${tokenId}:`, err);
              }

              // Extract contract address - it's an AccountId32 object, need to call .address() or convert
              let contractAddress: string = 'Unknown';
              if (tokenData.tokenContract) {
                // Handle AccountId32 object - it might have .address() method or be directly convertible
                if (typeof tokenData.tokenContract === 'string') {
                  contractAddress = tokenData.tokenContract;
                } else if (typeof (tokenData.tokenContract as any)?.address === 'function') {
                  contractAddress = (tokenData.tokenContract as any).address();
                } else if (typeof (tokenData.tokenContract as any)?.toString === 'function') {
                  contractAddress = (tokenData.tokenContract as any).toString();
                } else {
                  // Try to convert H160/AccountId32 to string
                  contractAddress = String(tokenData.tokenContract);
                }
              }

              // Normalize address for comparison (remove 0x prefix if needed, convert to lowercase)
              const normalizedAddress = contractAddress.toLowerCase().startsWith('0x') 
                ? contractAddress.toLowerCase() 
                : `0x${contractAddress.toLowerCase()}`;

              let symbol: string | undefined;
              let name: string | undefined;

              // Find matching deployed token by contract address
              for (const [sym, deployed] of Object.entries(DEPLOYED_TOKENS)) {
                if (deployed.contractAddress.toLowerCase() === normalizedAddress) {
                  symbol = deployed.symbol;
                  name = deployed.name;
                  break;
                }
              }

              return {
                tokenId,
                contractAddress: normalizedAddress,
                symbol,
                name,
                balance: tokenData.balance ? BigInt(tokenData.balance) : undefined,
                weightInvestment: tokenData.weightInvestment ? Number(tokenData.weightInvestment) : undefined,
                tier,
              };
            } catch (err) {
              console.error(`Error loading token ${tokenId}:`, err);
              return null;
            }
          })()
        );
      }

      const results = await Promise.all(tokenPromises);
      const validTokens = results.filter((t): t is TokenData => t !== null);
      
      setTokens(validTokens);
    } catch (err) {
      console.error('Error loading tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tokens');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (registryContract && tokenCountQuery.data !== undefined) {
      loadTokens();
    }
  }, [registryContract, tokenCountQuery.data]);

  const formatAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: bigint | undefined) => {
    if (!balance) return 'N/A';
    const num = Number(balance) / 1e18;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const formatWeight = (weight: number | undefined) => {
    if (weight === undefined) return 'N/A';
    return `${(weight / 100).toFixed(2)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Registered Tokens
            </CardTitle>
            <CardDescription>
              View all tokens registered in the Registry contract
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadTokens}
            disabled={isLoading || !registryContract}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && tokens.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>Loading registered tokens...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No tokens registered yet</p>
            <p className="text-sm mt-2">Use the Token Management tab to register tokens</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TOKEN ID</TableHead>
                  <TableHead>SYMBOL</TableHead>
                  <TableHead>NAME</TableHead>
                  <TableHead>CONTRACT ADDRESS</TableHead>
                  <TableHead className="text-right">BALANCE</TableHead>
                  <TableHead className="text-right">WEIGHT</TableHead>
                  <TableHead>TIER</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.tokenId}>
                    <TableCell>
                      <Badge variant="outline">{token.tokenId}</Badge>
                    </TableCell>
                    <TableCell>
                      {token.symbol ? (
                        <span className="font-medium">{token.symbol}</span>
                      ) : (
                        <span className="text-gray-400">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {token.name ? (
                        <span className="text-sm">{token.name}</span>
                      ) : (
                        <span className="text-gray-400 text-sm">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-xs">
                        {formatAddress(token.contractAddress)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatBalance(token.balance)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatWeight(token.weightInvestment)}
                    </TableCell>
                    <TableCell>
                      {token.tier ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {token.tier}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

