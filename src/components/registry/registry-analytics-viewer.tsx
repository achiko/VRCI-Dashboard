// src/components/registry/registry-analytics-viewer.tsx

'use client';

import { useState, useEffect } from 'react';
import { useContract, useContractTx } from 'typink';
import type { RegistryContractApi } from '@/lib/contracts/registry';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Clock, RefreshCw, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface AnalyticsState {
    type: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
}

interface TierDistribution {
    tier: number;
    tierName: string;
    count: number;
    percentage: number;
}

interface AnalyticsData {
    tierDistribution: TierDistribution[];
    activeTier: number;
    activeTierName: string;
    lastTierChange: number | null;
    shouldShiftTier: number | null;
    shouldShiftTierName: string | null;
    tokensByTier: { [key: number]: number[] };
    pendingChanges: Array<{
        tokenId: number;
        currentTier: number;
        pendingTier: number;
        changeTime: number;
    }>;
    gracePeriodDays: number;
    gracePeriodHours: number;
}

export function RegistryAnalyticsViewer() {
    const { contract: registryContract } = useContract<RegistryContractApi>('registry');

    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [analyticsState, setAnalyticsState] = useState<AnalyticsState>({ type: 'idle' });

    const shiftTierTx = useContractTx(registryContract, 'shiftActiveTier');

    const tierNames = ['None', 'Tier1', 'Tier2', 'Tier3', 'Tier4'];

    const loadAnalytics = async () => {
        if (!registryContract) {
            setAnalyticsState({ type: 'error', message: 'Registry contract not available' });
            return;
        }

        setAnalyticsState({ type: 'loading', message: 'Loading analytics data...' });

        try {
            // Load all analytics data in parallel
            const [
                distributionResult,
                activeTierResult,
                lastChangeResult,
                shouldShiftResult,
                pendingChangesResult,
                tokenCountResult,
                gracePeriodDaysResult,
                gracePeriodHoursResult
            ] = await Promise.all([
                registryContract.query.getTierDistribution(),
                registryContract.query.getActiveTier(),
                registryContract.query.getLastTierChange(),
                registryContract.query.shouldShiftTier(),
                registryContract.query.getTokensWithPendingChanges(),
                registryContract.query.getTokenCount(),
                registryContract.query.getGracePeriodDays(),
                registryContract.query.getGracePeriodHours()
            ]);

            const totalTokens = tokenCountResult.data || 0;
            const distribution = distributionResult.data || [];
            const activeTier = activeTierResult.data || 0;
            const lastChange = lastChangeResult.data || null;
            const shouldShift = shouldShiftResult.data || null;
            const pendingChanges = pendingChangesResult.data || [];
            const gracePeriodDays = gracePeriodDaysResult.data || 0;
            const gracePeriodHours = gracePeriodHoursResult.data || 0;

            // Format tier distribution with percentages
            const tierDistribution: TierDistribution[] = distribution.map(([tier, count]) => ({
                tier: Number(tier),
                tierName: tierNames[Number(tier)] || `${tier}`,
                count,
                percentage: totalTokens > 0 ? Math.round((count / totalTokens) * 100) : 0
            }));

            // Load tokens by tier
            const tokensByTier: { [key: number]: number[] } = {};
            for (let tier = 0; tier <= 4; tier++) {
                try {
                    const tokensResult = await registryContract.query.getTokensByTier(tier as any);
                    tokensByTier[tier] = tokensResult.data || [];
                } catch {
                    tokensByTier[tier] = [];
                }
            }

            setAnalyticsData({
                tierDistribution,
                activeTier: Number(activeTier),
                activeTierName: tierNames[Number(activeTier)] || `${activeTier}`,
                lastTierChange: lastChange ? Number(lastChange) : null,
                shouldShiftTier: shouldShift ? Number(shouldShift) : null,
                shouldShiftTierName: shouldShift ? tierNames[Number(shouldShift)] || `Tier${shouldShift}` : null,
                tokensByTier,
                gracePeriodDays: Number(gracePeriodDays),
                gracePeriodHours: Number(gracePeriodHours),
                pendingChanges: pendingChanges.map(([tokenId, currentTier, pendingTier, changeTime]) => ({
                    tokenId,
                    currentTier: Number(currentTier),
                    pendingTier: Number(pendingTier),
                    changeTime: Number(changeTime),
                })),
            });

            setAnalyticsState({
                type: 'success',
                message: `Analytics loaded • ${totalTokens} tokens analyzed`
            });

        } catch (err) {
            console.error('Error loading analytics:', err);
            setAnalyticsState({
                type: 'error',
                message: `Failed to load analytics: ${err instanceof Error ? err.message : 'Unknown error'}`
            });
        }
    };

    const handleShiftTier = async () => {
        if (!registryContract || !analyticsData?.shouldShiftTier) {
            return;
        }

        try {
            await shiftTierTx.signAndSend({
                args: [analyticsData.shouldShiftTier as any, "manual_override"],
                callback: (progress) => {
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        if (progress.dispatchError) {
                            setAnalyticsState({
                                type: 'error',
                                message: 'Failed to shift tier'
                            });
                        } else {
                            setAnalyticsState({
                                type: 'success',
                                message: 'Tier shift executed successfully'
                            });
                            // Reload analytics after tier shift
                            setTimeout(() => loadAnalytics(), 1000);
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Shift tier error:', err);
            setAnalyticsState({
                type: 'error',
                message: `Failed to shift tier: ${err instanceof Error ? err.message : 'Unknown error'}`
            });
        }
    };

    // Auto-load analytics when contract becomes available
    useEffect(() => {
        if (registryContract) {
            loadAnalytics();
        }
    }, [registryContract]);

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    const getStateIcon = () => {
        switch (analyticsState.type) {
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
                    <BarChart3 className="h-5 w-5" />
                    <span>Tier Analytics & Distribution</span>
                </CardTitle>
                <CardDescription>
                    View tier distribution, active tier status, and manage tier transitions
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Status Message */}
                {analyticsState.type !== 'idle' && (
                    <div className={`p-4 rounded-lg border flex items-start space-x-3 ${analyticsState.type === 'loading'
                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                        : analyticsState.type === 'success'
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                            : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                        }`}>
                        {getStateIcon()}
                        <div className="flex-1">
                            <p className={`text-sm font-medium ${analyticsState.type === 'loading'
                                ? 'text-blue-800 dark:text-blue-200'
                                : analyticsState.type === 'success'
                                    ? 'text-green-800 dark:text-green-200'
                                    : 'text-red-800 dark:text-red-200'
                                }`}>
                                {analyticsState.message}
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center">
                    <Button
                        onClick={loadAnalytics}
                        disabled={!registryContract || analyticsState.type === 'loading'}
                        variant="outline"
                        size="sm"
                    >
                        {analyticsState.type === 'loading' ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Refresh Analytics
                    </Button>
                </div>

                {analyticsData && (
                    <>
                        {/* Active Tier Status */}
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center space-x-2">
                                <TrendingUp className="h-4 w-4" />
                                <span>Active Tier Status</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                        {analyticsData.activeTierName}
                                    </div>
                                    <div className="text-sm text-blue-600 dark:text-blue-400">Current Active Tier</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                        {analyticsData.gracePeriodDays}d
                                    </div>
                                    <div className="text-sm text-blue-600 dark:text-blue-400">Grace Period</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                        {analyticsData.lastTierChange
                                            ? formatTimestamp(analyticsData.lastTierChange)
                                            : 'Never'
                                        }
                                    </div>
                                    <div className="text-sm text-blue-600 dark:text-blue-400">Last Change</div>
                                </div>
                                <div className="text-center">
                                    <div className={`text-lg font-bold ${analyticsData.shouldShiftTier
                                        ? 'text-orange-600'
                                        : 'text-green-600'
                                        }`}>
                                        {analyticsData.shouldShiftTier
                                            ? `→ ${analyticsData.shouldShiftTierName}`
                                            : 'Stable'
                                        }
                                    </div>
                                    <div className="text-sm text-blue-600 dark:text-blue-400">80% Rule Status</div>
                                </div>
                            </div>

                            {/* Tier Shift Action */}
                            {analyticsData.shouldShiftTier && (
                                <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/30 rounded border border-orange-300 dark:border-orange-700">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-medium text-orange-800 dark:text-orange-200">
                                                Tier Shift Recommended
                                            </div>
                                            <div className="text-xs text-orange-600 dark:text-orange-400">
                                                80% of tokens qualify for {analyticsData.shouldShiftTierName}
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleShiftTier}
                                            disabled={shiftTierTx.inBestBlockProgress}
                                            size="sm"
                                            variant="outline"
                                        >
                                            {shiftTierTx.inBestBlockProgress ? (
                                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                            ) : (
                                                <TrendingUp className="h-3 w-3 mr-1" />
                                            )}
                                            Execute Shift
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tier Distribution */}
                        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center space-x-2">
                                <BarChart3 className="h-4 w-4" />
                                <span>Tier Distribution</span>
                            </h3>
                            <div className="space-y-3">
                                {analyticsData.tierDistribution.map((tier) => {
                                    return (
                                        <div key={tier.tierName} className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-3 h-3 rounded-full ${tier.tier === 0 ? 'bg-gray-400' :
                                                    tier.tier === 1 ? 'bg-green-500' :
                                                        tier.tier === 2 ? 'bg-blue-500' :
                                                            tier.tier === 3 ? 'bg-purple-500' :
                                                                'bg-orange-500'
                                                    }`} />
                                                <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                                                    {tier.tierName}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <div className="text-sm text-purple-600 dark:text-purple-400">
                                                    {tier.count} tokens ({tier.percentage}%)
                                                </div>
                                                <div className="w-16 bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                                                    <div
                                                        className="bg-purple-600 h-2 rounded-full transition-all"
                                                        style={{ width: `${tier.percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Tokens by Tier */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {analyticsData.tierDistribution
                                .filter(tier => tier.count > 0)
                                .map((tier) => (
                                    <div key={tier.tier} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                                        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                                            {tier.tierName} Tokens ({tier.count})
                                        </h4>
                                        <div className="flex flex-wrap gap-1">
                                            {analyticsData.tokensByTier[tier.tier]?.slice(0, 10).map((tokenId) => (
                                                <span
                                                    key={tokenId}
                                                    className="px-2 py-1 bg-white dark:bg-gray-700 text-xs rounded border"
                                                >
                                                    #{tokenId}
                                                </span>
                                            ))}
                                            {analyticsData.tokensByTier[tier.tier]?.length > 10 && (
                                                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-xs rounded">
                                                    +{analyticsData.tokensByTier[tier.tier].length - 10} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>

                        {/* Pending Tier Changes */}
                        {analyticsData.pendingChanges.length > 0 && (
                            <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-3 flex items-center space-x-2">
                                    <Clock className="h-4 w-4" />
                                    <span>Pending Tier Changes ({analyticsData.pendingChanges.length})</span>
                                </h3>
                                <div className="space-y-2">
                                    {analyticsData.pendingChanges.slice(0, 5).map((change) => (
                                        <div key={change.tokenId} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium">Token #{change.tokenId}</span>
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    {tierNames[change.currentTier]} → {tierNames[change.pendingTier]}
                                                </span>
                                            </div>
                                            <span className="text-xs text-yellow-600 dark:text-yellow-400">
                                                Grace period: {formatTimestamp(change.changeTime)}
                                            </span>
                                        </div>
                                    ))}
                                    {analyticsData.pendingChanges.length > 5 && (
                                        <div className="text-xs text-yellow-600 dark:text-yellow-400 text-center">
                                            +{analyticsData.pendingChanges.length - 5} more pending changes
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 80% Rule Explanation */}
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                                80% Tier Shift Rule
                            </h4>
                            <div className="space-y-1 text-xs text-amber-700 dark:text-amber-300">
                                <div>• Active tier shifts automatically when 80%+ of tokens qualify for a higher tier</div>
                                <div>• Minimum 5 tokens required for automatic tier shifts</div>
                                <div>• Individual token tier changes have a 90-day grace period</div>
                                <div>• Manual tier shifts can be executed by contract owner</div>
                            </div>
                        </div>
                    </>
                )}

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