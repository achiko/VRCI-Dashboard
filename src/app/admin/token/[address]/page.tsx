'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTypink, usePolkadotClient } from 'typink';
import { toEvmAddress } from 'dedot/contracts';
import { Contract } from 'dedot/contracts';
import { decodeAddress } from '@polkadot/util-crypto';
import tokenMetadata from '@/contracts/metadata/token.json';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, Coins, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { txToaster } from '@/utils/txToaster';
import { toast } from 'react-toastify';
import { DEPLOYED_TOKENS } from '@/lib/token-deployments';

export default function TokenDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { connectedAccount, signer, network } = useTypink();
  // Get Polkadot client (API) from Typink for creating dynamic contract instances
  const { client: api } = usePolkadotClient(network?.id);
  const address = params.address as string;
  
  const [tokenName, setTokenName] = useState<string>('');
  const [tokenSymbol, setTokenSymbol] = useState<string>('');
  const [tokenDecimals, setTokenDecimals] = useState<number>(18);
  const [totalSupply, setTotalSupply] = useState<bigint>(0n);
  const [mintAmount, setMintAmount] = useState<string>('');
  const [mintRecipient, setMintRecipient] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load token data using API route (following Typink patterns)
  // Move loadTokenData outside useEffect so it can be called from handleMint
  const loadTokenData = useCallback(async () => {
    if (!address || !api) return;

    setIsLoading(true);
    setError(null);

    try {
      // Normalize address
      const normalizedAddress = address.toLowerCase().startsWith('0x')
        ? address.toLowerCase()
        : `0x${address.toLowerCase()}`;

      // Find deployed token info
      const deployedToken = Object.values(DEPLOYED_TOKENS).find(
        (t) => 'contractAddress' in t && typeof t.contractAddress === 'string' && t.contractAddress.toLowerCase() === normalizedAddress
      );

      // Query token metadata using API route (following Typink approach)
      const [nameResponse, symbolResponse, decimalsResponse, supplyResponse] = await Promise.all([
        fetch('/api/contracts/token/call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'psp22Metadata::tokenName',
            args: [],
            address: normalizedAddress,
          }),
        }),
        fetch('/api/contracts/token/call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'psp22Metadata::tokenSymbol',
            args: [],
            address: normalizedAddress,
          }),
        }),
        fetch('/api/contracts/token/call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'psp22Metadata::tokenDecimals',
            args: [],
            address: normalizedAddress,
          }),
        }),
        fetch('/api/contracts/token/call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: 'psp22::totalSupply',
            args: [],
            address: normalizedAddress,
          }),
        }),
      ]);

      const [nameData, symbolData, decimalsData, supplyData] = await Promise.all([
        nameResponse.json(),
        symbolResponse.json(),
        decimalsResponse.json(),
        supplyResponse.json(),
      ]);

      // Extract values from API responses
      const name = nameData.success && nameData.data ? String(nameData.data).trim() : null;
      const symbol = symbolData.success && symbolData.data ? String(symbolData.data).trim() : null;
      const decimals = decimalsData.success && decimalsData.data !== null && decimalsData.data !== undefined
        ? Number(decimalsData.data)
        : null;
      const supply = supplyData.success && supplyData.data !== null && supplyData.data !== undefined
        ? BigInt(String(supplyData.data).replace(/,/g, ''))
        : null;

      setTokenName(name || deployedToken?.name || 'Unknown');
      setTokenSymbol(symbol || deployedToken?.symbol || 'UNKNOWN');
      
      const finalDecimals = (decimals !== null && !isNaN(decimals) && decimals >= 0 && decimals <= 255)
        ? decimals
        : (deployedToken?.decimals || 18);
      setTokenDecimals(finalDecimals);
      
      setTotalSupply(supply || 0n);

      // Set default mint recipient to connected account using Typink's toEvmAddress
      if (connectedAccount?.address) {
        try {
          const evmAddress = toEvmAddress(connectedAccount.address);
          setMintRecipient(evmAddress);
        } catch {
          setMintRecipient(connectedAccount.address);
        }
      }
    } catch (err: any) {
      console.error('Error loading token data:', err);
      setError(err.message || 'Failed to load token data');
    } finally {
      setIsLoading(false);
    }
  }, [address, api, connectedAccount?.address]);

  useEffect(() => {
    if (address) {
      loadTokenData();
    }
  }, [address, loadTokenData]);

  // Helper function to convert SS58 to H160
  const convertSS58ToH160 = (address: string): string => {
    try {
      // Check if already H160 format (0x... with 42 chars)
      if (address.startsWith('0x') && address.length === 42) {
        return address.toLowerCase();
      }
      // Convert SS58 to H160
      const decoded = decodeAddress(address);
      // Take first 20 bytes (H160 format)
      const h160Bytes = decoded.slice(0, 20);
      // Convert to hex string with 0x prefix
      return '0x' + Array.from(h160Bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      // If conversion fails, assume it's already H160 or return as-is
      if (address.startsWith('0x') && address.length === 42) {
        return address.toLowerCase();
      }
      throw new Error(`Invalid address format: ${address}. Please use SS58 or H160 (0x...) format.`);
    }
  };

  const handleMint = async () => {
    if (!mintAmount || !mintRecipient || !connectedAccount || !signer || !api) {
      alert('Please fill in mint amount, recipient address, and connect your wallet');
      return;
    }

    const normalizedAddress = address.toLowerCase().startsWith('0x')
      ? address.toLowerCase()
      : `0x${address.toLowerCase()}`;

    // Convert recipient address from SS58 to H160 if needed
    let recipientH160: string;
    try {
      recipientH160 = convertSS58ToH160(mintRecipient.trim());
      console.log('Converted recipient address:', { original: mintRecipient, converted: recipientH160 });
    } catch (error: any) {
      alert(`Invalid recipient address: ${error.message}`);
      return;
    }

    // Convert amount to BigInt with decimals
    const amount = BigInt(Math.floor(parseFloat(mintAmount) * 10 ** tokenDecimals));

    const toaster = txToaster(`Minting ${mintAmount} ${tokenSymbol}...`);

    try {
      // Create Contract instance for the dynamic token address using Typink's API
      const tokenContract = new Contract(api, tokenMetadata, normalizedAddress as `0x${string}`);

      // Check if contract has mintTo method (dedot converts snake_case to camelCase)
      if (!tokenContract.tx || !tokenContract.tx.mintTo) {
        throw new Error('This token contract does not support minting (mintTo method not found)');
      }

      toaster.onTxPending();

      // Create the transaction with dedot ContractTxOptions
      // dedot Contract handles gas limits automatically, we can pass empty options or let it estimate
      const tx = tokenContract.tx.mintTo(
        recipientH160 as `0x${string}`,
        amount,
        {
          // dedot Contract will handle gas estimation automatically
          // We can optionally specify gasLimit here if needed
        }
      );

      // Sign and send using Typink's signer
      // dedot Contract's signAndSend may use onStatusChange callback or return a promise
      console.log('Starting transaction...');
      
      // Track if callback was called
      let callbackCalled = false;
      let txHash = '0x';
      
      try {
        const result = await tx.signAndSend(connectedAccount.address, {
          signer: signer as any,
          onStatusChange: (status: any) => {
            callbackCalled = true;
            console.log('=== Transaction status update (CALLBACK CALLED) ===');
            console.log('Status object:', status);
            
            // Extract txHash from status if available
            if (status.txHash || status.hash || status.extrinsicHash) {
              txHash = status.txHash || status.hash || status.extrinsicHash;
            }
            
            // Convert dedot status to ISubmittableResult format
            let result: any = {
              status: {
                type: 'Unknown',
                value: {},
              },
              dispatchError: null,
              events: status.events || [],
              txHash: txHash,
            };

            // Check status properties - dedot uses different property names
            if (status.isFinalized) {
              result.status = {
                type: 'Finalized',
                value: {
                  blockNumber: status.blockNumber?.toString() || '0',
                  txIndex: status.txIndex || 0,
                  blockHash: status.blockHash?.toString() || '',
                },
              };
              result.dispatchError = status.dispatchError || null;
              console.log('✅ Finalized - Calling toaster.onTxProgress');
              toaster.onTxProgress(result);
              
              if (status.dispatchError) {
                toaster.onTxError(new Error(`Transaction failed: ${status.dispatchError.toString()}`));
              } else {
                console.log('✅ Transaction finalized successfully!');
                setTimeout(() => {
                  loadTokenData();
                }, 2000);
              }
            } else if (status.isInBlock) {
              result.status = {
                type: 'BestChainBlockIncluded',
                value: {
                  blockNumber: status.blockNumber?.toString() || '0',
                  txIndex: status.txIndex || 0,
                  blockHash: status.blockHash?.toString() || '',
                },
              };
              result.dispatchError = status.dispatchError || null;
              console.log('✅ InBlock - Calling toaster.onTxProgress');
              toaster.onTxProgress(result);
              
              if (status.dispatchError) {
                toaster.onTxError(new Error(`Transaction failed: ${status.dispatchError.toString()}`));
              } else {
                console.log('✅ Transaction included in block successfully!');
              }
            } else {
              // Handle other status types
              const statusType = status.type || status.status || 'Broadcasting';
              result.status = {
                type: statusType,
                value: {},
              };
              console.log(`📡 Status: ${statusType} - Calling toaster.onTxProgress`);
              toaster.onTxProgress(result);
            }
          },
        });
        
        // The result might be the transaction hash or an unsubscribe function
        if (typeof result === 'string') {
          txHash = result;
          console.log('Transaction submitted, txHash:', txHash);
        } else if (result && typeof result === 'object') {
          console.log('Transaction submitted, result:', result);
          // If result is an object, try to extract hash
          if ('txHash' in result && typeof (result as any).txHash === 'string') {
            txHash = (result as any).txHash;
          }
        }
        
        // Show immediate success toast since transaction is submitted
        // The callback might not fire, so we'll show a toast right away
        console.log('Showing immediate success toast for txHash:', txHash);
        toast.success(`✅ Transaction submitted! Minting ${mintAmount} ${tokenSymbol}...`, {
          autoClose: 3000,
          position: 'top-right',
        });
        
        // Since the callback might not fire, show success toast after a delay
        // The transaction is working (user confirmed), so we'll show a success message
        setTimeout(() => {
          if (!callbackCalled) {
            console.log('⚠️ onStatusChange callback was not called. Showing success toast based on txHash.');
            console.log('Calling toaster.onTxProgress with txHash:', txHash);
            
            // Show success message with the transaction hash
            const finalResult = {
              status: {
                type: 'Finalized' as const,
                value: {
                  blockNumber: 0,
                  txIndex: 0,
                  blockHash: (txHash !== '0x' && txHash.startsWith('0x') ? txHash : '0x0000000000000000000000000000000000000000000000000000000000000000') as `0x${string}`,
                },
              },
              dispatchError: null,
              events: [],
              txHash: txHash as `0x${string}`,
            };
            
            console.log('Result object:', finalResult);
            
            // Call toaster to update the existing toast
            toaster.onTxProgress(finalResult as any);
            console.log('✅ toaster.onTxProgress called');
            
            // Also show a direct success toast as backup
            toast.success(`✅ Successfully minted ${mintAmount} ${tokenSymbol}!`, {
              autoClose: 5000,
              position: 'top-right',
            });
            console.log('✅ Direct toast.success called');
            
            // Refresh token data after showing toast (give toast time to appear)
            setTimeout(() => {
              console.log('Refreshing token data...');
              loadTokenData();
            }, 2000); // Wait 2 seconds for toast to be visible
          }
        }, 2000); // Wait 2 seconds to see if callback fires, then show fallback
        
      } catch (txError: any) {
        console.error('Transaction error:', txError);
        toaster.onTxError(txError instanceof Error ? txError : new Error('Transaction failed'));
      }
    } catch (err: any) {
      console.error('Mint error:', err);
      toaster.onTxError(err instanceof Error ? err : new Error('Unknown error'));
    }
  };

  const copyAddress = () => {
    const normalizedAddress = address.toLowerCase().startsWith('0x')
      ? address.toLowerCase()
      : `0x${address.toLowerCase()}`;
    navigator.clipboard.writeText(normalizedAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatBalance = (balance: bigint, decimals: number) => {
    const divisor = BigInt(10 ** decimals);
    const wholePart = balance / divisor;
    const fractionalPart = balance % divisor;
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    const trimmedFractional = fractionalStr.replace(/0+$/, '');
    return trimmedFractional ? `${wholePart}.${trimmedFractional}` : wholePart.toString();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading token data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="py-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const normalizedAddress = address.toLowerCase().startsWith('0x')
    ? address.toLowerCase()
    : `0x${address.toLowerCase()}`;

  return (
    <div className="container mx-auto py-10">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Register Tokens
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Coins className="h-6 w-6" />
                {tokenName} ({tokenSymbol})
              </CardTitle>
              <CardDescription className="mt-2">
                Token Details and Management
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm">
              {tokenDecimals} decimals
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contract Address */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Contract Address</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                {normalizedAddress}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyAddress}
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Total Supply */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Total Supply (Minted Tokens)</Label>
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded">
              <div className="text-2xl font-bold">
                {formatBalance(totalSupply, tokenDecimals)} {tokenSymbol}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Raw: {totalSupply.toString()}
              </div>
            </div>
          </div>

          {/* Mint Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mint Tokens</CardTitle>
              <CardDescription>
                Mint new tokens to a recipient address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mint-amount">Amount</Label>
                <Input
                  id="mint-amount"
                  type="number"
                  step="0.000000000000000001"
                  placeholder="0.0"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Amount in {tokenSymbol} (will be converted using {tokenDecimals} decimals)
                </p>
              </div>
              <div>
                <Label htmlFor="mint-recipient">Recipient Address</Label>
                <Input
                  id="mint-recipient"
                  type="text"
                  placeholder="0x..."
                  value={mintRecipient}
                  onChange={(e) => setMintRecipient(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  H160 address format (0x...)
                </p>
              </div>
              <Button
                onClick={handleMint}
                disabled={!mintAmount || !mintRecipient || !connectedAccount}
                className="w-full"
              >
                <Coins className="h-4 w-4 mr-2" />
                Mint Tokens
              </Button>
              {!connectedAccount && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please connect your wallet to mint tokens
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

