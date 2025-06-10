// src/components/registry/registry-grace-period-manager.tsx

'use client';

import { useState, useEffect } from 'react';
import { useContract, useContractTx } from 'typink';
import { ContractId } from '@/contracts/deployments';
import type { RegistryContractApi } from '@/contracts/types/registry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Shield, AlertTriangle, Settings, CheckCircle, XCircle, Loader2, AlertCircle, Calendar, Timer } from 'lucide-react';

interface GracePeriodState {
    type: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
    operation?: string;
}

interface GracePeriodInfo {
    currentPeriodMs: number;
    currentPeriodDays: number;
    currentPeriodHours: number;
    minPeriodMs: bigint | number;  // Handle both types
    maxPeriodMs: bigint | number;  // Handle both types
}

interface TokenGraceStatus {
    tokenId: number;
    endTime: number | null;
    remaining: number | null;
    expired: boolean;
}

export function RegistryGracePeriodManager() {
    const { contract: registryContract } = useContract<RegistryContractApi>(ContractId.REGISTRY);

    const [gracePeriodInfo, setGracePeriodInfo] = useState<GracePeriodInfo | null>(null);
    const [tokenGraceStatuses, setTokenGraceStatuses] = useState<TokenGraceStatus[]>([]);
    const [newPeriodDays, setNewPeriodDays] = useState<string>('');
    const [checkTokenId, setCheckTokenId] = useState<string>('');
    const [overrideTokenId, setOverrideTokenId] = useState<string>('');
    const [overrideTier, setOverrideTier] = useState<string>('');
    const [overrideReason, setOverrideReason] = useState<string>('');
    const [gracePeriodState, setGracePeriodState] = useState<GracePeriodState>({ type: 'idle' });

    const setGracePeriodTx = useContractTx(registryContract, 'setGracePeriod');
    const emergencyOverrideTx = useContractTx(registryContract, 'emergencyTierOverride');
    const emergencyOverrideToCalculatedTx = useContractTx(registryContract, 'emergencyTierOverrideToCalculated');
    const clearPendingTx = useContractTx(registryContract, 'clearPendingTierChange');

    const loadGracePeriodInfo = async () => {
        if (!registryContract) {
            setGracePeriodState({ type: 'error', message: 'Registry contract not available' });
            return;
        }

        setGracePeriodState({ type: 'loading', message: 'Loading grace period configuration...' });

        try {
            const [periodResult, daysResult, hoursResult, limitsResult] = await Promise.all([
                registryContract.query.getGracePeriod(),
                registryContract.query.getGracePeriodDays(),
                registryContract.query.getGracePeriodHours(),
                registryContract.query.getGracePeriodLimits()
            ]);

            const currentPeriodMs = periodResult.data || 0;
            const currentPeriodDays = daysResult.data || 0;
            const currentPeriodHours = hoursResult.data || 0;
            const limits = limitsResult.data || [0, 0];

            setGracePeriodInfo({
                currentPeriodMs: Number(currentPeriodMs),
                currentPeriodDays: Number(currentPeriodDays),
                currentPeriodHours: Number(currentPeriodHours),
                minPeriodMs: Number(limits[0]),  // Convert BigInt to number
                maxPeriodMs: Number(limits[1])   // Convert BigInt to number
            });

            setGracePeriodState({
                type: 'success',
                message: `Grace period: ${currentPeriodDays} days (${currentPeriodHours} hours)`
            });

        } catch (err) {
            console.error('Error loading grace period info:', err);
            setGracePeriodState({
                type: 'error',
                message: `Failed to load grace period info: ${err instanceof Error ? err.message : 'Unknown error'}`
            });
        }
    };

    const loadTokenGraceStatus = async (tokenId: number) => {
        if (!registryContract) return null;

        try {
            const [endTimeResult, remainingResult, expiredResult] = await Promise.all([
                registryContract.query.getGracePeriodEndTime(tokenId),
                registryContract.query.getGracePeriodRemaining(tokenId),
                registryContract.query.isGracePeriodExpired(tokenId)
            ]);

            return {
                tokenId,
                endTime: endTimeResult.data ? Number(endTimeResult.data) : null,
                remaining: remainingResult.data ? Number(remainingResult.data) : null,
                expired: expiredResult.data || false
            };
        } catch (err) {
            console.error(`Error loading grace status for token ${tokenId}:`, err);
            return null;
        }
    };

    const handleSetGracePeriod = async () => {
        if (!registryContract || !newPeriodDays.trim()) {
            setGracePeriodState({
                type: 'error',
                message: 'Please enter a valid number of days',
                operation: 'set'
            });
            return;
        }

        const days = parseInt(newPeriodDays);
        if (isNaN(days) || days < 1) {
            setGracePeriodState({
                type: 'error',
                message: 'Days must be a positive number',
                operation: 'set'
            });
            return;
        }

        const periodMs = days * 24 * 60 * 60 * 1000;

        setGracePeriodState({
            type: 'loading',
            message: `Setting grace period to ${days} days...`,
            operation: 'set'
        });

        try {
            await setGracePeriodTx.signAndSend({
                args: [BigInt(periodMs)],
                callback: (progress) => {
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        if (progress.dispatchError) {
                            setGracePeriodState({
                                type: 'error',
                                message: 'Transaction failed',
                                operation: 'set'
                            });
                        } else {
                            setGracePeriodState({
                                type: 'success',
                                message: `Grace period updated to ${days} days`,
                                operation: 'set'
                            });
                            setNewPeriodDays('');
                            setTimeout(() => loadGracePeriodInfo(), 1000);
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Set grace period error:', err);
            setGracePeriodState({
                type: 'error',
                message: `Failed to set grace period: ${err instanceof Error ? err.message : 'Unknown error'}`,
                operation: 'set'
            });
        }
    };

    const handleCheckTokenGrace = async () => {
        if (!checkTokenId.trim()) {
            setGracePeriodState({
                type: 'error',
                message: 'Please enter a token ID',
                operation: 'check'
            });
            return;
        }

        const tokenId = parseInt(checkTokenId);
        if (isNaN(tokenId) || tokenId <= 0) {
            setGracePeriodState({
                type: 'error',
                message: 'Token ID must be a positive number',
                operation: 'check'
            });
            return;
        }

        setGracePeriodState({
            type: 'loading',
            message: `Checking grace period status for token ${tokenId}...`,
            operation: 'check'
        });

        const status = await loadTokenGraceStatus(tokenId);
        if (status) {
            setTokenGraceStatuses(prev => {
                const filtered = prev.filter(s => s.tokenId !== tokenId);
                return [status, ...filtered];
            });

            setGracePeriodState({
                type: 'success',
                message: `Grace period status loaded for token ${tokenId}`,
                operation: 'check'
            });
        } else {
            setGracePeriodState({
                type: 'error',
                message: `Failed to load grace period status for token ${tokenId}`,
                operation: 'check'
            });
        }
    };

    const handleEmergencyOverride = async () => {
        if (!registryContract || !overrideTokenId.trim() || !overrideTier.trim() || !overrideReason.trim()) {
            setGracePeriodState({
                type: 'error',
                message: 'Please fill in all fields for emergency override',
                operation: 'override'
            });
            return;
        }

        const tokenId = parseInt(overrideTokenId);
        const tier = parseInt(overrideTier);

        if (isNaN(tokenId) || tokenId <= 0 || isNaN(tier) || tier < 0 || tier > 4) {
            setGracePeriodState({
                type: 'error',
                message: 'Invalid token ID or tier value',
                operation: 'override'
            });
            return;
        }

        setGracePeriodState({
            type: 'loading',
            message: `Executing emergency override for token ${tokenId}...`,
            operation: 'override'
        });

        try {
            await emergencyOverrideTx.signAndSend({
                args: [tokenId, tier as any, overrideReason.trim()],
                callback: (progress) => {
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        if (progress.dispatchError) {
                            setGracePeriodState({
                                type: 'error',
                                message: 'Emergency override failed',
                                operation: 'override'
                            });
                        } else {
                            setGracePeriodState({
                                type: 'success',
                                message: `Emergency override successful for token ${tokenId}`,
                                operation: 'override'
                            });
                            setOverrideTokenId('');
                            setOverrideTier('');
                            setOverrideReason('');
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Emergency override error:', err);
            setGracePeriodState({
                type: 'error',
                message: `Emergency override failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
                operation: 'override'
            });
        }
    };

    const handleOverrideToCalculated = async () => {
        if (!registryContract || !overrideTokenId.trim() || !overrideReason.trim()) {
            setGracePeriodState({
                type: 'error',
                message: 'Please enter token ID and reason',
                operation: 'calculated'
            });
            return;
        }

        const tokenId = parseInt(overrideTokenId);
        if (isNaN(tokenId) || tokenId <= 0) {
            setGracePeriodState({
                type: 'error',
                message: 'Token ID must be a positive number',
                operation: 'calculated'
            });
            return;
        }

        setGracePeriodState({
            type: 'loading',
            message: `Overriding to calculated tier for token ${tokenId}...`,
            operation: 'calculated'
        });

        try {
            await emergencyOverrideToCalculatedTx.signAndSend({
                args: [tokenId, overrideReason.trim()],
                callback: (progress) => {
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        if (progress.dispatchError) {
                            setGracePeriodState({
                                type: 'error',
                                message: 'Override to calculated tier failed',
                                operation: 'calculated'
                            });
                        } else {
                            setGracePeriodState({
                                type: 'success',
                                message: `Successfully overridden token ${tokenId} to calculated tier`,
                                operation: 'calculated'
                            });
                            setOverrideTokenId('');
                            setOverrideReason('');
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Override to calculated tier error:', err);
            setGracePeriodState({
                type: 'error',
                message: `Override failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
                operation: 'calculated'
            });
        }
    };

    // Auto-load grace period info when contract becomes available
    useEffect(() => {
        if (registryContract) {
            loadGracePeriodInfo();
        }
    }, [registryContract]);

    const formatTime = (ms: number | bigint) => {
        const msNum = Number(ms);
        const days = Math.floor(msNum / (24 * 60 * 60 * 1000));
        const hours = Math.floor((msNum % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((msNum % (60 * 60 * 1000)) / (60 * 1000));

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    const isLoading = setGracePeriodTx.inBestBlockProgress ||
        emergencyOverrideTx.inBestBlockProgress ||
        emergencyOverrideToCalculatedTx.inBestBlockProgress ||
        clearPendingTx.inBestBlockProgress;

    const getStateIcon = () => {
        switch (gracePeriodState.type) {
            case 'loading':
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
                    <Clock className="h-5 w-5" />
                    <span>Grace Period Management</span>
                </CardTitle>
                <CardDescription>
                    Manage tier change grace periods and emergency overrides (owner only)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Status Message */}
                {gracePeriodState.type !== 'idle' && (
                    <div className={`p-4 rounded-lg border flex items-start space-x-3 ${gracePeriodState.type === 'loading'
                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                        : gracePeriodState.type === 'success'
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                            : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                        }`}>
                        {getStateIcon()}
                        <div className="flex-1">
                            <p className={`text-sm font-medium ${gracePeriodState.type === 'loading'
                                ? 'text-blue-800 dark:text-blue-200'
                                : gracePeriodState.type === 'success'
                                    ? 'text-green-800 dark:text-green-200'
                                    : 'text-red-800 dark:text-red-200'
                                }`}>
                                {gracePeriodState.message}
                            </p>
                        </div>
                    </div>
                )}

                {/* Current Grace Period Info */}
                {gracePeriodInfo && (
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center space-x-2">
                            <Settings className="h-4 w-4" />
                            <span>Current Grace Period Configuration</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                    {gracePeriodInfo.currentPeriodDays}
                                </div>
                                <div className="text-sm text-blue-600 dark:text-blue-400">Days</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                    {gracePeriodInfo.currentPeriodHours}
                                </div>
                                <div className="text-sm text-blue-600 dark:text-blue-400">Hours</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                    {Math.floor(Number(gracePeriodInfo.minPeriodMs) / (24 * 60 * 60 * 1000))}
                                </div>
                                <div className="text-sm text-blue-600 dark:text-blue-400">Min Days</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                    {Math.floor(Number(gracePeriodInfo.maxPeriodMs) / (24 * 60 * 60 * 1000))}
                                </div>
                                <div className="text-sm text-blue-600 dark:text-blue-400">Max Days</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Set Grace Period */}
                <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Update Grace Period</span>
                    </h3>
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <label htmlFor="newPeriodDays" className="text-sm font-medium">
                                Grace Period (Days) *
                            </label>
                            <Input
                                id="newPeriodDays"
                                type="number"
                                min="1"
                                max="365"
                                placeholder="Enter number of days (e.g., 90)"
                                value={newPeriodDays}
                                onChange={(e) => setNewPeriodDays(e.target.value)}
                                disabled={isLoading}
                            />
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Time tokens have to adjust before tier changes take effect
                            </p>
                        </div>
                        <Button
                            onClick={handleSetGracePeriod}
                            disabled={!registryContract || !newPeriodDays.trim() || isLoading}
                            className="w-full"
                        >
                            {isLoading && gracePeriodState.operation === 'set' ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Settings className="h-4 w-4 mr-2" />
                            )}
                            Update Grace Period
                        </Button>
                    </div>
                </div>

                {/* Check Token Grace Status */}
                <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-200 flex items-center space-x-2">
                        <Timer className="h-4 w-4" />
                        <span>Check Token Grace Period Status</span>
                    </h3>
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <label htmlFor="checkTokenId" className="text-sm font-medium">
                                Token ID *
                            </label>
                            <Input
                                id="checkTokenId"
                                type="number"
                                min="1"
                                placeholder="Enter token ID to check"
                                value={checkTokenId}
                                onChange={(e) => setCheckTokenId(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <Button
                            onClick={handleCheckTokenGrace}
                            disabled={!registryContract || !checkTokenId.trim() || isLoading}
                            variant="outline"
                            className="w-full"
                        >
                            {isLoading && gracePeriodState.operation === 'check' ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Timer className="h-4 w-4 mr-2" />
                            )}
                            Check Grace Period Status
                        </Button>
                    </div>

                    {/* Grace Status Results */}
                    {tokenGraceStatuses.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200">
                                Recent Grace Period Checks
                            </h4>
                            {tokenGraceStatuses.slice(0, 5).map((status) => (
                                <div key={status.tokenId} className="p-3 bg-white dark:bg-gray-800 rounded border">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-medium">Token #{status.tokenId}</div>
                                            {status.endTime ? (
                                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                                    Grace ends: {formatTimestamp(status.endTime)}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                                    No active grace period
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            {status.remaining !== null && status.remaining > 0 ? (
                                                <div className="text-sm font-medium text-orange-600">
                                                    {formatTime(status.remaining)} left
                                                </div>
                                            ) : status.expired ? (
                                                <div className="text-sm font-medium text-red-600">
                                                    Expired
                                                </div>
                                            ) : (
                                                <div className="text-sm font-medium text-gray-500">
                                                    No grace period
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Emergency Override */}
                <div className="space-y-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Emergency Tier Override</span>
                    </h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-2">
                                <label htmlFor="overrideTokenId" className="text-sm font-medium">
                                    Token ID *
                                </label>
                                <Input
                                    id="overrideTokenId"
                                    type="number"
                                    min="1"
                                    placeholder="Token ID"
                                    value={overrideTokenId}
                                    onChange={(e) => setOverrideTokenId(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="overrideTier" className="text-sm font-medium">
                                    New Tier *
                                </label>
                                <Input
                                    id="overrideTier"
                                    type="number"
                                    min="0"
                                    max="4"
                                    placeholder="0-4"
                                    value={overrideTier}
                                    onChange={(e) => setOverrideTier(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="overrideReason" className="text-sm font-medium">
                                    Reason *
                                </label>
                                <Input
                                    id="overrideReason"
                                    placeholder="Override reason"
                                    value={overrideReason}
                                    onChange={(e) => setOverrideReason(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Button
                                onClick={handleEmergencyOverride}
                                disabled={!registryContract || !overrideTokenId || !overrideTier || !overrideReason || isLoading}
                                variant="destructive"
                            >
                                {isLoading && gracePeriodState.operation === 'override' ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                )}
                                Override to Specific Tier
                            </Button>
                            <Button
                                onClick={handleOverrideToCalculated}
                                disabled={!registryContract || !overrideTokenId || !overrideReason || isLoading}
                                variant="outline"
                            >
                                {isLoading && gracePeriodState.operation === 'calculated' ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Shield className="h-4 w-4 mr-2" />
                                )}
                                Override to Calculated Tier
                            </Button>
                        </div>
                    </div>
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded border border-red-300 dark:border-red-700">
                        <p className="text-xs text-red-800 dark:text-red-200">
                            ⚠️ <strong>Emergency Override:</strong> Bypasses grace period and immediately applies tier changes. Use only when necessary.
                        </p>
                    </div>
                </div>

                {/* Grace Period Explanation */}
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                        Grace Period System
                    </h4>
                    <div className="space-y-1 text-xs text-amber-700 dark:text-amber-300">
                        <div>• Tokens have a grace period before tier changes take effect</div>
                        <div>• Default grace period is 90 days, configurable by contract owner</div>
                        <div>• Emergency overrides bypass grace periods for immediate changes</div>
                        <div>• Grace periods prevent sudden tier changes from affecting portfolios</div>
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