// src/components/registry/registry-tier-manager.tsx

'use client';

import { useState } from 'react';
import { useContract, useContractTx } from 'typink';
import type { RegistryContractApi } from '@/lib/contracts/registry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, RefreshCw, Clock, TrendingUp, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface TierState {
    type: 'idle' | 'pending' | 'success' | 'error';
    message?: string;
    operation?: string;
    data?: any;
}

export function RegistryTierManager() {
    const { contract: registryContract } = useContract<RegistryContractApi>('registry');

    const [tokenId, setTokenId] = useState<string>('');
    const [tierOperation, setTierOperation] = useState<'calculate' | 'update' | 'refresh' | 'process'>('calculate');
    const [tierState, setTierState] = useState<TierState>({ type: 'idle' });

    const updateTierTx = useContractTx(registryContract, 'updateTokenTier');
    const refreshAllTiersTx = useContractTx(registryContract, 'refreshAllTiers');
    const processGracePeriodsTx = useContractTx(registryContract, 'processGracePeriods');

    const validateTokenId = (id: string): number | null => {
        const tokenIdNum = parseInt(id);
        if (isNaN(tokenIdNum) || tokenIdNum <= 0) {
            return null;
        }
        return tokenIdNum;
    };

    const handleCalculateTier = async () => {
        if (!registryContract || !tokenId.trim()) {
            setTierState({ type: 'error', message: 'Please enter a valid token ID', operation: 'calculate' });
            return;
        }

        const tokenIdNum = validateTokenId(tokenId);
        if (!tokenIdNum) {
            setTierState({ type: 'error', message: 'Token ID must be a positive number', operation: 'calculate' });
            return;
        }

        setTierState({ type: 'pending', message: `Calculating tier for token ID ${tokenIdNum}...`, operation: 'calculate' });

        try {
            const result = await registryContract.query.calculateTokenTier(tokenIdNum);

            if (result.data?.isOk) {
                const tier = result.data.value;
                const tierName = tier || 'Unknown';

                setTierState({
                    type: 'success',
                    message: `Token ID ${tokenIdNum} calculated tier: ${tierName}`,
                    operation: 'calculate',
                    data: { tokenId: tokenIdNum, tier, tierName }
                });
            } else {
                setTierState({ type: 'error', message: 'Failed to calculate tier', operation: 'calculate' });
            }
        } catch (err) {
            console.error('Calculate tier error:', err);
            setTierState({
                type: 'error',
                message: `Failed to calculate tier: ${err instanceof Error ? err.message : 'Unknown error'}`,
                operation: 'calculate'
            });
        }
    };

    const handleUpdateTier = async () => {
        if (!registryContract || !tokenId.trim()) {
            setTierState({ type: 'error', message: 'Please enter a valid token ID', operation: 'update' });
            return;
        }

        const tokenIdNum = validateTokenId(tokenId);
        if (!tokenIdNum) {
            setTierState({ type: 'error', message: 'Token ID must be a positive number', operation: 'update' });
            return;
        }

        setTierState({ type: 'pending', message: `Updating tier for token ID ${tokenIdNum}...`, operation: 'update' });

        try {
            await updateTierTx.signAndSend({
                args: [tokenIdNum],
                callback: (progress) => {
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        if (progress.dispatchError) {
                            setTierState({
                                type: 'error',
                                message: 'Transaction failed',
                                operation: 'update'
                            });
                        } else {
                            setTierState({
                                type: 'success',
                                message: `Token ID ${tokenIdNum} tier updated successfully`,
                                operation: 'update'
                            });
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Update tier error:', err);
            setTierState({
                type: 'error',
                message: `Failed to update tier: ${err instanceof Error ? err.message : 'Unknown error'}`,
                operation: 'update'
            });
        }
    };

    const handleRefreshAllTiers = async () => {
        if (!registryContract) {
            setTierState({ type: 'error', message: 'Registry contract not available', operation: 'refresh' });
            return;
        }

        setTierState({ type: 'pending', message: 'Refreshing all token tiers...', operation: 'refresh' });

        try {
            await refreshAllTiersTx.signAndSend({
                args: [],
                callback: (progress) => {
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        if (progress.dispatchError) {
                            setTierState({
                                type: 'error',
                                message: 'Transaction failed',
                                operation: 'refresh'
                            });
                        } else {
                            setTierState({
                                type: 'success',
                                message: 'All token tiers refreshed successfully',
                                operation: 'refresh'
                            });
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Refresh all tiers error:', err);
            setTierState({
                type: 'error',
                message: `Failed to refresh tiers: ${err instanceof Error ? err.message : 'Unknown error'}`,
                operation: 'refresh'
            });
        }
    };

    const handleProcessGracePeriods = async () => {
        if (!registryContract) {
            setTierState({ type: 'error', message: 'Registry contract not available', operation: 'process' });
            return;
        }

        setTierState({ type: 'pending', message: 'Processing grace periods...', operation: 'process' });

        try {
            await processGracePeriodsTx.signAndSend({
                args: [],
                callback: (progress) => {
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        if (progress.dispatchError) {
                            setTierState({
                                type: 'error',
                                message: 'Transaction failed',
                                operation: 'process'
                            });
                        } else {
                            setTierState({
                                type: 'success',
                                message: 'Grace periods processed successfully',
                                operation: 'process'
                            });
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Process grace periods error:', err);
            setTierState({
                type: 'error',
                message: `Failed to process grace periods: ${err instanceof Error ? err.message : 'Unknown error'}`,
                operation: 'process'
            });
        }
    };

    const executeOperation = () => {
        switch (tierOperation) {
            case 'calculate':
                return handleCalculateTier();
            case 'update':
                return handleUpdateTier();
            case 'refresh':
                return handleRefreshAllTiers();
            case 'process':
                return handleProcessGracePeriods();
        }
    };

    const isLoading = updateTierTx.inBestBlockProgress || refreshAllTiersTx.inBestBlockProgress || processGracePeriodsTx.inBestBlockProgress;

    const getStateIcon = () => {
        switch (tierState.type) {
            case 'pending':
                return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'error':
                return <XCircle className="h-4 w-4 text-red-600" />;
            default:
                return null;
        }
    };

    return (
        <Card className="w-full shadow-none mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Layers className="h-5 w-5" />
                    <span>Tier Management</span>
                </CardTitle>
                <CardDescription>
                    Calculate, update, and manage token tiers and grace periods
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Operation Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-medium">Tier Operation</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                            { value: 'calculate', label: 'Calculate Tier', icon: TrendingUp },
                            { value: 'update', label: 'Update Tier', icon: RefreshCw },
                            { value: 'refresh', label: 'Refresh All', icon: Layers },
                            { value: 'process', label: 'Process Grace', icon: Clock }
                        ].map(({ value, label, icon: Icon }) => (
                            <label key={value} className="flex items-center space-x-2 cursor-pointer p-2 rounded border hover:bg-gray-50 dark:hover:bg-gray-800">
                                <input
                                    type="radio"
                                    name="tierOperation"
                                    value={value}
                                    checked={tierOperation === value}
                                    onChange={(e) => {
                                        setTierOperation(e.target.value as any);
                                        setTierState({ type: 'idle' });
                                    }}
                                    className="text-primary focus:ring-primary"
                                />
                                <Icon className="h-3 w-3" />
                                <span className="text-xs">{label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Token ID Input for single token operations */}
                {(tierOperation === 'calculate' || tierOperation === 'update') && (
                    <div className="space-y-2">
                        <label htmlFor="tokenId" className="text-sm font-medium">
                            Token ID
                        </label>
                        <Input
                            id="tokenId"
                            type="number"
                            min="1"
                            placeholder="Enter token ID"
                            value={tokenId}
                            onChange={(e) => {
                                setTokenId(e.target.value);
                                setTierState({ type: 'idle' });
                            }}
                            disabled={isLoading}
                        />
                        <p className="text-xs text-gray-500">
                            {tierOperation === 'calculate'
                                ? 'Calculate the tier for this token based on current market data'
                                : 'Manually update the tier for this token'
                            }
                        </p>
                    </div>
                )}

                {/* Execute Button */}
                <Button
                    onClick={executeOperation}
                    disabled={
                        isLoading ||
                        !registryContract ||
                        ((tierOperation === 'calculate' || tierOperation === 'update') && !tokenId.trim())
                    }
                    className="w-full"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        {
                            calculate: <TrendingUp className="h-4 w-4 mr-2" />,
                            update: <RefreshCw className="h-4 w-4 mr-2" />,
                            refresh: <Layers className="h-4 w-4 mr-2" />,
                            process: <Clock className="h-4 w-4 mr-2" />
                        }[tierOperation]
                    )}
                    {isLoading
                        ? {
                            calculate: 'Calculating...',
                            update: 'Updating...',
                            refresh: 'Refreshing...',
                            process: 'Processing...'
                        }[tierOperation]
                        : {
                            calculate: 'Calculate Token Tier',
                            update: 'Update Token Tier',
                            refresh: 'Refresh All Tiers',
                            process: 'Process Grace Periods'
                        }[tierOperation]
                    }
                </Button>

                {/* Status Message */}
                {tierState.type !== 'idle' && (
                    <div className={`p-4 rounded-lg border flex items-start space-x-3 ${tierState.type === 'pending'
                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                            : tierState.type === 'success'
                                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                                : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                        }`}>
                        {getStateIcon()}
                        <div className="flex-1">
                            <p className={`text-sm font-medium ${tierState.type === 'pending'
                                    ? 'text-blue-800 dark:text-blue-200'
                                    : tierState.type === 'success'
                                        ? 'text-green-800 dark:text-green-200'
                                        : 'text-red-800 dark:text-red-200'
                                }`}>
                                {tierState.message}
                            </p>
                        </div>
                    </div>
                )}

                {/* Results Display */}
                {tierState.type === 'success' && tierState.data && tierOperation === 'calculate' && (
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-3">
                            Tier Calculation Result
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs text-purple-600 dark:text-purple-400">Token ID</div>
                                <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                    {tierState.data.tokenId}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-purple-600 dark:text-purple-400">Calculated Tier</div>
                                <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                    {tierState.data.tierName}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Operation Descriptions */}
                <div className="space-y-3">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                            Tier Management Operations
                        </h4>
                        <div className="space-y-1 text-xs text-amber-700 dark:text-amber-300">
                            <div><strong>Calculate Tier:</strong> Query-only operation to see what tier a token would have based on current market data</div>
                            <div><strong>Update Tier:</strong> Manually recalculate and update a token's tier (requires permissions)</div>
                            <div><strong>Refresh All:</strong> Batch update all token tiers - gas intensive operation</div>
                            <div><strong>Process Grace:</strong> Apply pending tier changes for tokens with expired grace periods</div>
                        </div>
                    </div>
                </div>

                {/* Contract Status */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Registry Contract:</span>
                        <span className={`flex items-center space-x-2 ${registryContract ? 'text-green-600' : 'text-red-600'}`}>
                            <div className={`w-2 h-2 rounded-full ${registryContract ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span>{registryContract ? 'Connected' : 'Not Available'}</span>
                        </span>
                    </div>

                    {!registryContract && (
                        <div className="flex items-center space-x-2 text-xs text-amber-600 mt-2">
                            <AlertCircle className="h-3 w-3" />
                            <span>Make sure your wallet is connected and registry contract is deployed</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}