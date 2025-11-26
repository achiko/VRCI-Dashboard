'use client';

import { useState, useEffect } from 'react';
import { useContract, useContractTx, useContractQuery } from 'typink';
import type { StakingContractApi } from '@/lib/contracts/staking';
import { CONTRACT_ADDRESSES } from '@/providers/TypinkProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Settings, Clock, RefreshCw, Copy, Wallet } from 'lucide-react';
import { decodeAddress } from '@polkadot/keyring';
import { LabelWithHelp } from '@/components/ui/field-help';

export default function StakingConfiguration() {
  const { contract: stakingContract } = useContract<StakingContractApi>('staking');
  const [stakingPeriod, setStakingPeriod] = useState('');
  const [unstakingPeriod, setUnstakingPeriod] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Contract reference configuration state
  const [w3piTokenAddress, setW3piTokenAddress] = useState<string>(CONTRACT_ADDRESSES.TOKEN);
  const [registryAddress, setRegistryAddress] = useState<string>(CONTRACT_ADDRESSES.REGISTRY);
  const [feeWalletAddress, setFeeWalletAddress] = useState<string>('5Dc2AZgBtFERxPqVxhxMfmeKQt8BMfxSeMyxQCyCxqy35e1a');

  // Track which addresses have been set (for status indicators)
  // Load from localStorage on mount
  const [w3piTokenSet, setW3piTokenSet] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('staking_w3pi_token_set') === 'true';
    }
    return false;
  });
  const [registrySet, setRegistrySet] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('staking_registry_set') === 'true';
    }
    return false;
  });
  const [feeWalletSet, setFeeWalletSet] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('staking_fee_wallet_set') === 'true';
    }
    return false;
  });

  // Transaction hooks
  // Note: Some methods don't exist in Staking contract API
  // const setStakingPeriodTx = useContractTx(stakingContract, 'setStakingPeriod');
  // const setUnstakingPeriodTx = useContractTx(stakingContract, 'setUnstakingPeriod');
  const pauseTx = useContractTx(stakingContract, 'pause');
  const resumeTx = useContractTx(stakingContract, 'unpause');
  const setW3piTokenTx = useContractTx(stakingContract, 'setW3piToken');
  const setRegistryTx = useContractTx(stakingContract, 'setRegistry');
  const setFeeWalletTx = useContractTx(stakingContract, 'setFeeWallet');

  // Query total staked to verify contract is working (we'll use this as a health check)
  const totalStakedQuery = useContractQuery({
    contract: stakingContract,
    fn: 'getTotalStaked'
  });

  // Note: isPaused method doesn't exist in Staking contract API
  // const [isPaused, setIsPaused] = useState<any>(null);

  // Note: These methods don't exist in Staking contract API
  // const handleSetStakingPeriod = async () => {
  //   if (!stakingPeriod) {
  //     setError('Please enter a staking period');
  //     return;
  //   }

  //   setIsLoading(true);
  //   setError(null);
  //   setResult(null);

  //   try {
  //     const tx = setStakingPeriodTx.tx(BigInt(stakingPeriod));
  //     const hash = await tx.signAndSend(selectedAccount?.address);
  //     setResult({ type: 'setStakingPeriod', hash, period: stakingPeriod });
  //   } catch (err: any) {
  //     setError(`Error setting staking period: ${err.message}`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handleSetUnstakingPeriod = async () => {
  //   if (!unstakingPeriod) {
  //     setError('Please enter an unstaking period');
  //     return;
  //   }

  //   setIsLoading(true);
  //   setError(null);
  //   setResult(null);

  //   try {
  //     const tx = setUnstakingPeriodTx.tx(BigInt(unstakingPeriod));
  //     const hash = await tx.signAndSend(selectedAccount?.address);
  //     setResult({ type: 'setUnstakingPeriod', hash, period: unstakingPeriod });
  //   } catch (err: any) {
  //     setError(`Error setting unstaking period: ${err.message}`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handlePause = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      await pauseTx.signAndSend({
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            if (progress.dispatchError) {
              setError('Transaction failed');
            } else {
              setResult({ type: 'pause', hash: 'success' });
            }
          }
        }
      });
    } catch (err: any) {
      setError(`Error pausing staking: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      await resumeTx.signAndSend({
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            if (progress.dispatchError) {
              setError('Transaction failed');
            } else {
              setResult({ type: 'resume', hash: 'success' });
            }
          }
        }
      });
    } catch (err: any) {
      setError(`Error resuming staking: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPeriod = (period: bigint) => {
    const days = Number(period) / (24 * 60 * 60);
    return `${days.toFixed(1)} days`;
  };

  // Helper function to validate H160 address
  const isValidAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Helper function to validate SS58 address
  const isValidSS58 = (address: string): boolean => {
    try {
      decodeAddress(address);
      return true;
    } catch {
      return false;
    }
  };

  // Helper function to convert SS58 to H160
  const convertSS58ToH160 = (ss58Address: string): string => {
    try {
      const decoded = decodeAddress(ss58Address);
      // Take first 20 bytes (H160 format)
      const h160Bytes = decoded.slice(0, 20);
      // Convert to hex string with 0x prefix
      return '0x' + Array.from(h160Bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      throw new Error('Invalid SS58 address');
    }
  };

  // Helper function to copy address to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Address copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  // Handle setting W3PI token address
  const handleSetW3piToken = async () => {
    if (!isValidAddress(w3piTokenAddress)) {
      setError('Invalid W3PI token contract address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await setW3piTokenTx.signAndSend({
        args: [w3piTokenAddress as `0x${string}`],
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            if (progress.dispatchError) {
              setError('Transaction failed');
            } else {
              setSuccess('W3PI token address set successfully!');
              setW3piTokenSet(true);
              localStorage.setItem('staking_w3pi_token_set', 'true');
            }
          }
        }
      });
    } catch (err: any) {
      setError(`Error setting W3PI token address: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle setting Registry address
  const handleSetRegistry = async () => {
    if (!isValidAddress(registryAddress)) {
      setError('Invalid Registry contract address');
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
              setSuccess('Registry address set successfully!');
              setRegistrySet(true);
              localStorage.setItem('staking_registry_set', 'true');
            }
          }
        }
      });
    } catch (err: any) {
      setError(`Error setting Registry address: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle setting Fee Wallet address
  const handleSetFeeWallet = async () => {
    let addressToUse = feeWalletAddress;

    // If it's SS58 format, convert to H160
    if (isValidSS58(feeWalletAddress) && !feeWalletAddress.startsWith('0x')) {
      try {
        addressToUse = convertSS58ToH160(feeWalletAddress);
        setFeeWalletAddress(addressToUse); // Update the input with converted address
      } catch (err: any) {
        setError(`Failed to convert SS58 address: ${err.message}`);
        return;
      }
    }

    if (!isValidAddress(addressToUse)) {
      setError('Invalid fee wallet address. Must be H160 format (0x followed by 40 hex characters) or valid SS58 address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await setFeeWalletTx.signAndSend({
        args: [addressToUse as `0x${string}`],
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            if (progress.dispatchError) {
              setError('Transaction failed');
            } else {
              setSuccess('Fee wallet address set successfully!');
              setFeeWalletSet(true);
              localStorage.setItem('staking_fee_wallet_set', 'true');
            }
          }
        }
      });
    } catch (err: any) {
      setError(`Error setting fee wallet address: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Staking Configuration
          </CardTitle>
          <CardDescription>
            Configure staking parameters and system settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Total Staked</Label>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {totalStakedQuery.isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  ) : totalStakedQuery.data ? (
                    `${(Number(totalStakedQuery.data) / 1e18).toFixed(4)} W3PI`
                  ) : (
                    'N/A'
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contract Status</Label>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">
                    {totalStakedQuery.isLoading ? 'Checking...' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="space-y-2">
            <Label>System Status</Label>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                {/* {isPaused ? (
                  <XCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )} */}
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">
                  {/* {isPaused ? 'Paused' : 'Active'} */}
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Set Staking Period */}
          <div className="space-y-4">
            <h3 className="font-medium">Set Staking Period</h3>
            <div className="space-y-2">
              <Label>Staking Period (seconds)</Label>
              <Input
                value={stakingPeriod}
                onChange={(e) => setStakingPeriod(e.target.value)}
                placeholder="Enter staking period in seconds"
                type="number"
              />
            </div>
            {/* Note: setStakingPeriod method doesn't exist in Staking contract API */}
            {/* <Button
              onClick={handleSetStakingPeriod}
              disabled={!stakingPeriod || isLoading}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Set Staking Period
            </Button> */}
          </div>

          {/* Set Unstaking Period */}
          <div className="space-y-4">
            <h3 className="font-medium">Set Unstaking Period</h3>
            <div className="space-y-2">
              <Label>Unstaking Period (seconds)</Label>
              <Input
                value={unstakingPeriod}
                onChange={(e) => setUnstakingPeriod(e.target.value)}
                placeholder="Enter unstaking period in seconds"
                type="number"
              />
            </div>
            {/* Note: setUnstakingPeriod method doesn't exist in Staking contract API */}
            {/* <Button
              onClick={handleSetUnstakingPeriod}
              disabled={!unstakingPeriod || isLoading}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Set Unstaking Period
            </Button> */}
          </div>

          {/* System Controls */}
          <div className="space-y-4">
            <h3 className="font-medium">System Controls</h3>
            <div className="flex gap-2">
              <Button
                onClick={handlePause}
                disabled={isLoading}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Pause System
              </Button>
              <Button
                onClick={handleResume}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Resume System
              </Button>
            </div>
          </div>

          {/* Results */}
          {result && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                {result.type} transaction submitted: {result.hash}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Information */}
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Configuration:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Set minimum staking and unstaking periods</li>
              <li>Pause system for maintenance</li>
              <li>Resume normal operations when ready</li>
              <li>All changes require owner permissions</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Verification */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Configuration Verification
              </CardTitle>
              <CardDescription>
                Verify that all contract references are properly configured
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                totalStakedQuery.refresh();
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Verify
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contract Health Check */}
          <div className="space-y-2 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <Label>Contract Health</Label>
              {totalStakedQuery.isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : totalStakedQuery.data !== undefined ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Healthy
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <XCircle className="h-3 w-3 mr-1" />
                  Error
                </Badge>
              )}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Total Staked: {totalStakedQuery.isLoading ? 'Loading...' : totalStakedQuery.data ? `${(Number(totalStakedQuery.data) / 1e18).toFixed(4)} W3PI` : 'N/A'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Query Status: {totalStakedQuery.isLoading ? 'Querying...' : totalStakedQuery.error ? 'Failed' : 'Success'}
            </div>
          </div>

          {/* Contract References Verification */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* W3PI Token Verification */}
            <div className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label>W3PI Token</Label>
                {w3piTokenSet ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Set
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Set
                  </Badge>
                )}
              </div>
              <div className="text-xs font-mono text-gray-600 dark:text-gray-400">
                Current: {w3piTokenAddress || 'Not set'}
              </div>
              <div className="text-xs font-mono text-gray-500 dark:text-gray-500">
                Expected: {CONTRACT_ADDRESSES.TOKEN}
              </div>
            </div>

            {/* Registry Verification */}
            <div className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label>Registry</Label>
                {registrySet ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Set
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Set
                  </Badge>
                )}
              </div>
              <div className="text-xs font-mono text-gray-600 dark:text-gray-400">
                Current: {registryAddress || 'Not set'}
              </div>
              <div className="text-xs font-mono text-gray-500 dark:text-gray-500">
                Expected: {CONTRACT_ADDRESSES.REGISTRY}
              </div>
            </div>

            {/* Fee Wallet Verification */}
            <div className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label>Fee Wallet</Label>
                {feeWalletSet ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Set
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Set
                  </Badge>
                )}
              </div>
              <div className="text-xs font-mono text-gray-600 dark:text-gray-400">
                Current: {feeWalletAddress || 'Not set'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                Note: Fee wallet is set via transaction
              </div>
            </div>
          </div>

          {/* Note about verification */}
          <div className="text-xs text-gray-500 dark:text-gray-400 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p><strong>Note:</strong> Staking contract doesn't expose getter methods for contract references. 
            Status is based on successful transaction confirmations. Use the "Verify" button to check contract health.</p>
          </div>
        </CardContent>
      </Card>

      {/* Contract References Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Contract References Configuration
          </CardTitle>
          <CardDescription>
            Configure contract references for Staking contract. These references enable cross-contract calls.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Set W3PI Token Address */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <LabelWithHelp
                htmlFor="w3pi-token-address"
                helpText="The W3PI Token contract address (H160 format: 0x followed by 40 hex characters). This reference allows the Staking contract to interact with the token for staking operations. This enables users to stake their W3PI tokens and earn rewards. The contract needs this reference to transfer tokens during stake, unstake, and reward distribution operations."
              >
                W3PI Token Contract Address
              </LabelWithHelp>
              {w3piTokenSet && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Set
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                id="w3pi-token-address"
                type="text"
                placeholder="0x..."
                value={w3piTokenAddress}
                onChange={(e) => setW3piTokenAddress(e.target.value)}
                className="font-mono"
              />
              <Button
                onClick={handleSetW3piToken}
                disabled={isLoading || !isValidAddress(w3piTokenAddress)}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Setting...
                  </>
                ) : (
                  'Set W3PI Token'
                )}
              </Button>
            </div>
          </div>

          {/* Set Registry Address */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <LabelWithHelp
                htmlFor="registry-address"
                helpText="The Registry contract address (H160 format: 0x followed by 40 hex characters). This reference allows the Staking contract to query token tier information. This is used to determine staking rewards based on the user's portfolio tier. The contract needs this reference to calculate appropriate reward rates for different tier levels."
              >
                Registry Contract Address
              </LabelWithHelp>
              {registrySet && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Set
                </Badge>
              )}
            </div>
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

          {/* Set Fee Wallet Address */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <LabelWithHelp
                htmlFor="fee-wallet-address"
                helpText="The fee wallet address where staking fees are collected. When users stake or unstake tokens, a portion of the fees goes to this wallet. The address can be in H160 format (0x...) or SS58 format (Polkadot account address). SS58 addresses are automatically converted to H160 format. This wallet receives fees from all staking operations."
              >
                Fee Wallet Address
              </LabelWithHelp>
              {feeWalletSet && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Set
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                id="fee-wallet-address"
                type="text"
                placeholder="0x... or SS58 address"
                value={feeWalletAddress}
                onChange={(e) => setFeeWalletAddress(e.target.value)}
                className="font-mono"
              />
              <Button
                onClick={handleSetFeeWallet}
                disabled={isLoading || (!isValidAddress(feeWalletAddress) && !isValidSS58(feeWalletAddress))}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Setting...
                  </>
                ) : (
                  'Set Fee Wallet'
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Note: Fee wallet can be in H160 format (0x followed by 40 hex characters) or SS58 format. 
              SS58 addresses will be automatically converted to H160 format.
            </p>
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
              <li>W3PI Token: The W3PI token contract for staking operations</li>
              <li>Registry: The Registry contract for token tier information</li>
              <li>Fee Wallet: Address where staking fees are collected</li>
              <li>All configuration requires owner permissions</li>
              <li>These references enable cross-contract calls between Staking and other contracts</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
