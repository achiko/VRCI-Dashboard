'use client';

import { useState, useEffect } from 'react';
import { useTypink, useContract, useContractQuery } from 'typink';
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
import { decodeAddress } from '@polkadot/util-crypto';

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

  // Get user address and convert to H160 if needed
  const rawUserAddress = connectedAccount?.address;
  
  // Helper function to convert SS58 to H160
  const convertSS58ToH160 = (ss58Address: string): string => {
    try {
      // Check if already H160 format (0x...)
      if (ss58Address.startsWith('0x') && ss58Address.length === 42) {
        return ss58Address.toLowerCase();
      }
      // Convert SS58 to H160
      const decoded = decodeAddress(ss58Address);
      // Take first 20 bytes (H160 format)
      const h160Bytes = decoded.slice(0, 20);
      // Convert to hex string with 0x prefix
      return '0x' + Array.from(h160Bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      // If conversion fails, return as-is (might already be H160)
      return ss58Address;
    }
  };
  
  const userAddress = rawUserAddress ? convertSS58ToH160(rawUserAddress) : undefined;

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
          
          const w3piDecimals = Number(decimalsResult.data);
          const validW3piDecimals = (!isNaN(w3piDecimals) && w3piDecimals >= 0 && w3piDecimals <= 255) 
            ? w3piDecimals 
            : 18;
          
          tokenBalances.push({
            symbol: symbolResult.data || 'W3PI',
            name: nameResult.data || 'W3PI Token',
            contractAddress: CONTRACT_ADDRESSES.TOKEN,
            balance,
            decimals: validW3piDecimals,
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

      // 2. USDC Balance - Query using API route
      const usdcToken = DEPLOYED_TOKENS.USDC;
      if (usdcToken && 'contractAddress' in usdcToken) {
        try {
          const response = await fetch(`/api/contracts/token/call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              method: 'psp22::balanceOf',
              args: [userAddress],
              address: usdcToken.contractAddress,
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data !== undefined && data.data !== null) {
              // Handle different response formats from Polkadot.js ContractPromise
              let balance = 0n;
              
              // Polkadot.js often returns numbers as strings with commas
              if (typeof data.data === 'string') {
                const cleaned = data.data.replace(/,/g, '').trim();
                if (cleaned && !isNaN(Number(cleaned))) {
                  balance = BigInt(cleaned);
                }
              } else if (typeof data.data === 'number') {
                balance = BigInt(data.data);
              } else if (typeof data.data === 'object' && data.data !== null) {
                // Handle object responses (e.g., { Ok: "123456" } or { value: "123456" })
                if ('Ok' in data.data && data.data.Ok) {
                  const okValue = data.data.Ok;
                  balance = typeof okValue === 'string' 
                    ? BigInt(okValue.replace(/,/g, ''))
                    : BigInt(okValue);
                } else if ('value' in data.data) {
                  const value = data.data.value;
                  balance = typeof value === 'string'
                    ? BigInt(value.replace(/,/g, ''))
                    : BigInt(value);
                } else {
                  // Try to extract number from object
                  const str = JSON.stringify(data.data);
                  const match = str.match(/\d+/);
                  if (match) {
                    balance = BigInt(match[0]);
                  }
                }
              }
              
              tokenBalances.push({
                symbol: usdcToken.symbol,
                name: usdcToken.name,
                contractAddress: usdcToken.contractAddress,
                balance,
                decimals: usdcToken.decimals || 18,
                isLoading: false,
              });
            } else {
              // No error, just zero balance
              tokenBalances.push({
                symbol: usdcToken.symbol,
                name: usdcToken.name,
                contractAddress: usdcToken.contractAddress,
                balance: 0n,
                decimals: usdcToken.decimals || 18,
                isLoading: false,
              });
            }
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(errorData.error || `API request failed: ${response.status}`);
          }
        } catch (err: any) {
          console.error('Error loading USDC balance:', err);
          tokenBalances.push({
            symbol: usdcToken.symbol,
            name: usdcToken.name,
            contractAddress: usdcToken.contractAddress,
            balance: 0n,
            decimals: usdcToken.decimals || 18,
            isLoading: false,
            error: err.message || 'Failed to query balance',
          });
        }
      }

      // 3. Registered Tokens from Registry
      console.log('registryContract', registryContract);
      if (registryContract) {
        await tokenCountQuery.refresh();
        const count = Number(tokenCountQuery.data || 0);

        for (let id = 1; id <= count; id++) {
          try {
            console.log('id', id);
            // Get basic token data for contract address first
            const tokenDataResult = await registryContract.query.getBasicTokenData(id);
            console.log('tokenDataResult', tokenDataResult);
            if (!tokenDataResult.data) continue;

            let tokenData: any = null;
            if ('isOk' in tokenDataResult.data && tokenDataResult.data.isOk) {
              tokenData = tokenDataResult.data.value;
            } else if ('isErr' in tokenDataResult.data && tokenDataResult.data.isErr) {
              continue;
            } else {
              tokenData = tokenDataResult.data;
            }

            console.log('tokenData', tokenData);

            if (!tokenData || !tokenData.tokenContract) continue;

            // Extract contract address from AccountId32 object
            let contractAddress: string = 'Unknown';
            if (tokenData.tokenContract) {
              if (typeof tokenData.tokenContract === 'string') {
                contractAddress = tokenData.tokenContract;
              } else if (tokenData.tokenContract && typeof tokenData.tokenContract === 'object') {
                // Handle AccountId32 object - it has a 'raw' property with the address
                const accountId = tokenData.tokenContract as any;
                
                if (accountId.raw) {
                  // AccountId32.raw is a 32-byte address (66 hex chars with 0x)
                  // Extract last 20 bytes (40 hex chars) for EVM address format
                  const rawAddress = accountId.raw;
                  if (typeof rawAddress === 'string') {
                    if (rawAddress.startsWith('0x') && rawAddress.length === 66) {
                      // 32-byte address: extract last 20 bytes (40 hex chars)
                      contractAddress = '0x' + rawAddress.slice(-40);
                    } else {
                      contractAddress = rawAddress;
                    }
                  } else {
                    contractAddress = String(rawAddress);
                  }
                } else if (typeof accountId.address === 'function') {
                  contractAddress = accountId.address();
                } else if (typeof accountId.toString === 'function') {
                  contractAddress = accountId.toString();
                } else {
                  contractAddress = String(tokenData.tokenContract);
                }
              } else {
                contractAddress = String(tokenData.tokenContract);
              }
            }

            // Normalize address
            const normalizedAddress = contractAddress.toLowerCase().startsWith('0x') 
              ? contractAddress.toLowerCase() 
              : `0x${contractAddress.toLowerCase()}`;

            // Find matching deployed token (this will override name/symbol if found)
            const deployedToken = Object.values(DEPLOYED_TOKENS).find(
              (t) => 'contractAddress' in t && typeof t.contractAddress === 'string' && t.contractAddress.toLowerCase() === normalizedAddress
            );
            
            // Query token metadata directly from the token contract using Typink (like W3PI)
            // Typink automatically unwraps Option<String> types
            let tokenName = `Token ${id}`;
            let tokenSymbol = `TKN${id}`;
            let tokenDecimals = 18;
            
            // Query token metadata and balance using Typink's contract query system (exactly like W3PI)
            // Create the contract instance once and reuse it for both metadata and balance queries
            let tokenContract: any = null;
            try {
              if (w3piTokenContract) {
                // Use Typink's contract query system directly (same as W3PI)
                // Access the underlying API and create a contract instance with the token address
                // Typink contracts use dedot's ContractApi internally
                // Try multiple ways to access the API
                let contractApi = (w3piTokenContract as any).api;
                
                // If api is not directly available, try accessing it through other properties
                if (!contractApi) {
                  contractApi = (w3piTokenContract as any).contractApi;
                }
                if (!contractApi) {
                  contractApi = (w3piTokenContract as any)._api;
                }
                if (!contractApi && (w3piTokenContract as any).query) {
                  // If query exists, try to get API from the query object
                  contractApi = (w3piTokenContract as any).query.api;
                }
                
                const contractAddress = normalizedAddress as `0x${string}`;
                
                if (contractApi) {
                  // Import Contract from dedot (what Typink uses under the hood)
                  const { Contract } = await import('dedot/contracts');
                  
                  // Create a new contract instance with the token address and metadata
                  // This is exactly how Typink creates contracts internally
                  tokenContract = new Contract(contractApi, tokenMetadata, contractAddress);
                  
                  if (tokenContract && tokenContract.query) {
                    // Query metadata using the same pattern as W3PI
                    // Typink/dedot automatically unwraps Option<String> types
                    const nameResult = await tokenContract.query.psp22MetadataTokenName();
                    const symbolResult = await tokenContract.query.psp22MetadataTokenSymbol();
                    const decimalsResult = await tokenContract.query.psp22MetadataTokenDecimals();
                    
                    // Typink automatically extracts the value from Option<String>
                    if (nameResult?.data) {
                      tokenName = String(nameResult.data).trim();
                    }
                    if (symbolResult?.data) {
                      tokenSymbol = String(symbolResult.data).trim();
                    }
                    if (decimalsResult?.data !== undefined) {
                      const parsedDecimals = Number(decimalsResult.data);
                      if (!isNaN(parsedDecimals) && parsedDecimals >= 0 && parsedDecimals <= 255) {
                        tokenDecimals = parsedDecimals;
                      }
                    }
                  } else {
                    console.warn(`Token contract instance created but query not available for token ${id}`);
                  }
                } else {
                  console.warn(`Contract API not available for token ${id}. w3piTokenContract keys:`, Object.keys(w3piTokenContract || {}));
                }
              } else {
                console.warn(`W3PI token contract not available for token ${id}`);
              }
            } catch (metadataErr) {
              console.warn(`Failed to fetch metadata for token ${id} using Typink:`, metadataErr);
              // If Typink fails, the defaults (Token ${id}, TKN${id}) will be used
            }
            
            // Use deployed token name/symbol if available, otherwise use queried metadata
            const finalName = deployedToken?.name || tokenName;
            const finalSymbol = deployedToken?.symbol || tokenSymbol;
            // Ensure decimals is always a valid number (0-255), default to 18
            const rawDecimals = deployedToken?.decimals ?? tokenDecimals;
            const finalDecimals = (typeof rawDecimals === 'number' && !isNaN(rawDecimals) && rawDecimals >= 0 && rawDecimals <= 255)
              ? rawDecimals
              : 18;

            // Skip if already added (USDC)
            if (normalizedAddress === usdcToken?.contractAddress?.toLowerCase()) {
              continue;
            }

            // Skip if already added (e.g., USDC)
            const alreadyAdded = tokenBalances.some(
              (t) => t.contractAddress.toLowerCase() === normalizedAddress.toLowerCase()
            );
            
            if (!alreadyAdded) {
              // Query balance - try Typink contract instance first, fallback to API route
              let balance = 0n;
              let balanceError: string | undefined = undefined;
              
              try {
                // First, try using the contract instance we created for metadata
                if (tokenContract && tokenContract.query) {
                  const balanceResult = await tokenContract.query.psp22BalanceOf(userAddress as `0x${string}`);
                  balance = balanceResult.data || 0n;
                } else {
                  // Fallback: use API route if contract instance is not available
                  throw new Error('Contract instance not available, using API route');
                }
              } catch (typinkErr: any) {
                // If Typink fails, use API route as fallback
                console.log(`[Token ${id}] Typink failed, using API route.`);
                console.log(`[Token ${id}] User address (H160): ${userAddress}`);
                console.log(`[Token ${id}] User address (original SS58): ${rawUserAddress}`);
                console.log(`[Token ${id}] Token address: ${normalizedAddress}`);
                
                // Try with H160 first, then SS58 if H160 returns 0
                let addressToTry = userAddress;
                let response: Response;
                let responseData: any;
                
                try {
                  response = await fetch(`/api/contracts/token/call`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      method: 'psp22::balanceOf',
                      args: [addressToTry],
                      address: normalizedAddress,
                    }),
                  });
                  
                  responseData = await response.json();
                  console.log(`[Token ${id}] API response with H160 (${addressToTry}):`, JSON.stringify(responseData, null, 2));
                  console.log(`[Token ${id}] API response data type:`, typeof responseData.data);
                  console.log(`[Token ${id}] API response data value:`, responseData.data);
                  
                  // If balance is 0 and we have SS58 address, try with SS58
                  if (response.ok && responseData.success && responseData.data === 0 && rawUserAddress && !rawUserAddress.startsWith('0x')) {
                    console.log(`[Token ${id}] Balance is 0 with H160, trying with SS58 address: ${rawUserAddress}`);
                    addressToTry = rawUserAddress;
                    
                    response = await fetch(`/api/contracts/token/call`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        method: 'psp22::balanceOf',
                        args: [addressToTry],
                        address: normalizedAddress,
                      }),
                    });
                    
                    responseData = await response.json();
                    console.log(`[Token ${id}] API response with SS58 (${addressToTry}):`, JSON.stringify(responseData, null, 2));
                  }
                  
                  if (response.ok) {
                    if (responseData.success && responseData.data !== undefined && responseData.data !== null) {
                      // Parse balance from API response
                      let parsedBalance: bigint | null = null;
                      
                      if (typeof responseData.data === 'string') {
                        const cleaned = responseData.data.replace(/,/g, '').trim();
                        if (cleaned && !isNaN(Number(cleaned))) {
                          parsedBalance = BigInt(cleaned);
                        }
                      } else if (typeof responseData.data === 'number') {
                        parsedBalance = BigInt(responseData.data);
                      } else if (typeof responseData.data === 'object' && responseData.data !== null) {
                        // Handle object responses - log the structure
                        console.log(`[Token ${id}] Response data structure:`, JSON.stringify(responseData.data, null, 2));
                        
                        // Try to extract BigInt/U256 value from various formats
                        const extractBigInt = (obj: any): bigint | null => {
                          if (obj === null || obj === undefined) return null;
                          
                          // Direct BigInt string representation
                          if (typeof obj === 'string') {
                            const cleaned = obj.replace(/,/g, '').trim();
                            if (cleaned && !isNaN(Number(cleaned))) {
                              return BigInt(cleaned);
                            }
                          }
                          
                          // Number (unlikely for large balances, but possible)
                          if (typeof obj === 'number') {
                            return BigInt(obj);
                          }
                          
                          // Object with Ok/Some/value
                          if (typeof obj === 'object') {
                            // Try Ok variant
                            if ('Ok' in obj && obj.Ok !== null && obj.Ok !== undefined) {
                              return extractBigInt(obj.Ok);
                            }
                            if ('ok' in obj && obj.ok !== null && obj.ok !== undefined) {
                              return extractBigInt(obj.ok);
                            }
                            
                            // Try Some variant
                            if ('Some' in obj && obj.Some !== null && obj.Some !== undefined) {
                              return extractBigInt(obj.Some);
                            }
                            if ('some' in obj && obj.some !== null && obj.some !== undefined) {
                              return extractBigInt(obj.some);
                            }
                            
                            // Try value property
                            if ('value' in obj && obj.value !== null && obj.value !== undefined) {
                              return extractBigInt(obj.value);
                            }
                            
                            // Try data property
                            if ('data' in obj && obj.data !== null && obj.data !== undefined) {
                              return extractBigInt(obj.data);
                            }
                            
                            // Try to find any numeric string property
                            for (const key in obj) {
                              if (key !== 'isOk' && key !== 'isErr' && typeof obj[key] === 'string') {
                                const cleaned = obj[key].replace(/,/g, '').trim();
                                if (cleaned && !isNaN(Number(cleaned)) && cleaned.length > 0) {
                                  return BigInt(cleaned);
                                }
                              }
                            }
                          }
                          
                          return null;
                        };
                        
                        parsedBalance = extractBigInt(responseData.data);
                      }
                      
                      if (parsedBalance !== null) {
                        balance = parsedBalance;
                        console.log(`[Token ${id}] Parsed balance: ${balance.toString()}`);
                      } else {
                        console.warn(`[Token ${id}] Could not parse balance from response:`, responseData.data);
                        balanceError = 'Could not parse balance from API response';
                      }
                    } else {
                      console.warn(`[Token ${id}] API returned success but no data:`, responseData);
                      balanceError = 'API returned no balance data';
                    }
                  } else {
                    balanceError = responseData.error || `API request failed: ${response.status}`;
                    console.error(`[Token ${id}] API error:`, balanceError);
                  }
                } catch (apiErr: any) {
                  balanceError = apiErr.message || 'Failed to query balance via API route';
                  console.error(`[Token ${id}] Error loading balance via API route:`, apiErr);
                }
              }
              
              tokenBalances.push({
                symbol: finalSymbol,
                name: finalName,
                contractAddress: normalizedAddress,
                balance,
                decimals: finalDecimals,
                isLoading: false,
                ...(balanceError && { error: balanceError }),
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
    // Ensure decimals is a valid number, default to 18 if invalid
    const validDecimals = (typeof decimals === 'number' && !isNaN(decimals) && decimals >= 0 && decimals <= 255) 
      ? decimals 
      : 18;
    
    const divisor = BigInt(10 ** validDecimals);
    const wholePart = balance / divisor;
    const fractionalPart = balance % divisor;
    const fractionalStr = fractionalPart.toString().padStart(validDecimals, '0');
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

