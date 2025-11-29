'use client';

import { useState, useEffect } from 'react';
import { useTypink } from 'typink';
import { useContract, useContractQuery } from 'typink';
import type { TokenContractApi } from '@/lib/contracts/token';
import type { RegistryContractApi } from '@/lib/contracts/registry';
import { CONTRACT_ADDRESSES } from '@/providers/TypinkProvider';
import { DEPLOYED_TOKENS, getDeployedToken } from '@/lib/token-deployments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Wallet, Loader2, RefreshCw, AlertCircle, Copy, CheckCircle } from 'lucide-react';
import tokenMetadata from '@/contracts/metadata/token.json';

interface TokenBalance {
  symbol: string;
  name: string;
  contractAddress: string;
  balance: bigint;
  decimals: number;
  isLoading: boolean;
  error?: string;
}

export default function BalancePage() {
  const { signer, connectedAccount } = useTypink();
  const { contract: w3piTokenContract } = useContract<TokenContractApi>('token');
  const { contract: registryContract } = useContract<RegistryContractApi>('registry');
  
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Query Registry for token count
  const tokenCountQuery = useContractQuery({
    contract: registryContract,
    fn: 'getTokenCount',
  });

  // Get user address
  const userAddress = connectedAccount?.address;

  // Load all token balances
  const loadBalances = async () => {
    if (!userAddress) {
      setError('Please connect your wallet');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tokenBalances: TokenBalance[] = [];

      // 1. W3PI Token Balance
      if (w3piTokenContract) {
        try {
          const balanceResult = await w3piTokenContract.query.psp22BalanceOf(userAddress as `0x${string}`);
          const balance = balanceResult.data || 0n;
          
          // Get token metadata
          const nameResult = await w3piTokenContract.query.psp22MetadataTokenName();
          const symbolResult = await w3piTokenContract.query.psp22MetadataTokenSymbol();
          const decimalsResult = await w3piTokenContract.query.psp22MetadataTokenDecimals();
          
          tokenBalances.push({
            symbol: symbolResult.data || 'W3PI',
            name: nameResult.data || 'W3PI Token',
            contractAddress: CONTRACT_ADDRESSES.TOKEN,
            balance,
            decimals: Number(decimalsResult.data || 18),
            isLoading: false,
          });
        } catch (err: any) {
          console.error('Error loading W3PI balance:', err);
          tokenBalances.push({
            symbol: 'W3PI',
            name: 'W3PI Token',
            contractAddress: CONTRACT_ADDRESSES.TOKEN,
            balance: 0n,
            decimals: 18,
            isLoading: false,
            error: err.message,
          });
        }
      }

      // 2. USDC Token Info (balance querying requires contract instance creation)
      const usdcToken = DEPLOYED_TOKENS.USDC;
      if (usdcToken && 'contractAddress' in usdcToken) {
        tokenBalances.push({
          symbol: usdcToken.symbol,
          name: usdcToken.name,
          contractAddress: usdcToken.contractAddress,
          balance: 0n, // Balance querying for other tokens requires creating contract instances
          decimals: usdcToken.decimals || 18,
          isLoading: false,
          error: 'Balance query requires contract instance - feature coming soon',
        });
      }

      // 3. Registered Tokens from Registry
      if (registryContract) {
        await tokenCountQuery.refresh();
        const count = Number(tokenCountQuery.data || 0);

        for (let id = 1; id <= count; id++) {
          try {
            const tokenDataResult = await registryContract.query.getBasicTokenData(id);
            if (!tokenDataResult.data) continue;

            let tokenData: any = null;
            if ('isOk' in tokenDataResult.data && tokenDataResult.data.isOk) {
              tokenData = tokenDataResult.data.value;
            } else if ('isErr' in tokenDataResult.data && tokenDataResult.data.isErr) {
              continue;
            } else {
              tokenData = tokenDataResult.data;
            }

            if (!tokenData || !tokenData.tokenContract) continue;

            // Extract contract address
            let contractAddress: string = 'Unknown';
            if (tokenData.tokenContract) {
              if (typeof tokenData.tokenContract === 'string') {
                contractAddress = tokenData.tokenContract;
              } else if (typeof (tokenData.tokenContract as any)?.address === 'function') {
                contractAddress = (tokenData.tokenContract as any).address();
              } else if (typeof (tokenData.tokenContract as any)?.toString === 'function') {
                contractAddress = (tokenData.tokenContract as any).toString();
              } else {
                contractAddress = String(tokenData.tokenContract);
              }
            }

            // Normalize address
            const normalizedAddress = contractAddress.toLowerCase().startsWith('0x') 
              ? contractAddress.toLowerCase() 
              : `0x${contractAddress.toLowerCase()}`;

            // Find matching deployed token
            const deployedToken = Object.values(DEPLOYED_TOKENS).find(
              (t) => 'contractAddress' in t && typeof t.contractAddress === 'string' && t.contractAddress.toLowerCase() === normalizedAddress
            );

            // Skip if already added (USDC)
            if (normalizedAddress === usdcToken?.contractAddress?.toLowerCase()) {
              continue;
            }

            // Add token info (balance querying requires contract instance creation)
            // Skip if already added (e.g., USDC)
            const alreadyAdded = tokenBalances.some(
              (t) => t.contractAddress.toLowerCase() === normalizedAddress.toLowerCase()
            );
            
            if (!alreadyAdded) {
              tokenBalances.push({
                symbol: deployedToken?.symbol || `Token ${id}`,
                name: deployedToken?.name || `Token ${id}`,
                contractAddress: normalizedAddress,
                balance: 0n, // Balance query requires contract instance creation
                decimals: deployedToken?.decimals || 18,
                isLoading: false,
                error: 'Balance query requires contract instance - feature coming soon',
              });
            }
          } catch (err) {
            console.warn(`Failed to load token ${id}:`, err);
            // Continue with next token
          }
        }
      }

      setBalances(tokenBalances);
    } catch (err: any) {
      console.error('Error loading balances:', err);
      setError(`Error loading balances: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userAddress) {
      loadBalances();
    }
  }, [userAddress, w3piTokenContract, registryContract]);

  const formatBalance = (balance: bigint, decimals: number) => {
    const divisor = BigInt(10 ** decimals);
    const wholePart = balance / divisor;
    const fractionalPart = balance % divisor;
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    const trimmedFractional = fractionalStr.replace(/0+$/, '');
    
    if (trimmedFractional === '') {
      return wholePart.toString();
    }
    return `${wholePart}.${trimmedFractional}`;
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
  };

  const totalValue = balances.reduce((sum, token) => sum + token.balance, 0n);
  const tokensWithBalance = balances.filter((t) => t.balance > 0n);

  return (
    <div className="container mx-auto py-10">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8" />
            Wallet Balances
          </CardTitle>
          <CardDescription>
            View all token balances in your connected wallet
          </CardDescription>
        </CardHeader>
      </Card>

      {!userAddress && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please connect your wallet to view token balances.
          </AlertDescription>
        </Alert>
      )}

      {userAddress && (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Summary</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadBalances}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm text-blue-800 dark:text-blue-200 mb-1">Total Tokens</div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {balances.length}
                  </div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-sm text-green-800 dark:text-green-200 mb-1">Tokens with Balance</div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {tokensWithBalance.length}
                  </div>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-sm text-purple-800 dark:text-purple-200 mb-1">Wallet Address</div>
                  <div className="text-xs font-mono text-purple-900 dark:text-purple-100 break-all">
                    {userAddress}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Balances Table */}
          <Card>
            <CardHeader>
              <CardTitle>Token Balances</CardTitle>
              <CardDescription>
                All tokens including W3PI, USDC, and registered tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Loading balances...</span>
                </div>
              ) : balances.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No tokens found. Make sure tokens are registered in the Registry contract.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Contract Address</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balances.map((token, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{token.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{token.symbol}</Badge>
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatBalance(token.balance, token.decimals)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">
                              {token.contractAddress.slice(0, 10)}...{token.contractAddress.slice(-8)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyAddress(token.contractAddress)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {token.error ? (
                            <Badge variant="destructive" className="text-xs">
                              Error
                            </Badge>
                          ) : token.balance > 0n ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                              Zero
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

