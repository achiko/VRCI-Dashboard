// src/components/registry/registry-configuration-manager.tsx

'use client';

import { useState, useEffect } from 'react';
import { useContract, useContractTx } from 'typink';
import type { RegistryContractApi } from '@/lib/contracts/registry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, DollarSign, TrendingUp, RefreshCw, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface ConfigState {
    type: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
    operation?: string;
}

interface TierThresholds {
    tier1MarketCapUsd: string;
    tier1VolumeUsd: string;
    tier2MarketCapUsd: string;
    tier2VolumeUsd: string;
    tier3MarketCapUsd: string;
    tier3VolumeUsd: string;
    tier4MarketCapUsd: string;
    tier4VolumeUsd: string;
}

interface ConfigData {
    dotUsdOracle: string | null;
    tierThresholds: TierThresholds | null;
    currentUsdRate: string | null;
}

export function RegistryConfigurationManager() {
    const { contract: registryContract } = useContract<RegistryContractApi>('registry');

    const [configData, setConfigData] = useState<ConfigData>({
        dotUsdOracle: null,
        tierThresholds: null,
        currentUsdRate: null
    });
    const [configState, setConfigState] = useState<ConfigState>({ type: 'idle' });
    const [newOracleAddress, setNewOracleAddress] = useState<string>('');
    const [editingThresholds, setEditingThresholds] = useState<TierThresholds>({
        tier1MarketCapUsd: '',
        tier1VolumeUsd: '',
        tier2MarketCapUsd: '',
        tier2VolumeUsd: '',
        tier3MarketCapUsd: '',
        tier3VolumeUsd: '',
        tier4MarketCapUsd: '',
        tier4VolumeUsd: ''
    });

    const setOracleTx = useContractTx(registryContract, 'setDotUsdOracle');
    const setThresholdsTx = useContractTx(registryContract, 'setTierThresholds');

    const loadConfiguration = async () => {
        if (!registryContract) {
            setConfigState({ type: 'error', message: 'Registry contract not available' });
            return;
        }

        setConfigState({ type: 'loading', message: 'Loading configuration...' });

        try {
            const [oracleResult, thresholdsResult, usdRateResult] = await Promise.all([
                registryContract.query.getDotUsdOracle(),
                registryContract.query.getTierThresholds(),
                registryContract.query.getCurrentUsdRate()
            ]);

            console.log('USD Rate', usdRateResult);

            const oracle = oracleResult.data || null;
            const thresholds = thresholdsResult.data || null;
            const usdRate = usdRateResult.data || null;

            // Format thresholds for editing
            if (thresholds) {
                setEditingThresholds({
                    tier1MarketCapUsd: (thresholds.tier1MarketCapUsd / BigInt(1_000_000)).toString(),
                    tier1VolumeUsd: (thresholds.tier1VolumeUsd / BigInt(1_000_000)).toString(),
                    tier2MarketCapUsd: (thresholds.tier2MarketCapUsd / BigInt(1_000_000)).toString(),
                    tier2VolumeUsd: (thresholds.tier2VolumeUsd / BigInt(1_000_000)).toString(),
                    tier3MarketCapUsd: (thresholds.tier3MarketCapUsd / BigInt(1_000_000)).toString(),
                    tier3VolumeUsd: (thresholds.tier3VolumeUsd / BigInt(1_000_000)).toString(),
                    tier4MarketCapUsd: (thresholds.tier4MarketCapUsd / BigInt(1_000_000)).toString(),
                    tier4VolumeUsd: (thresholds.tier4VolumeUsd / BigInt(1_000_000)).toString()
                });
            }

            setConfigData({
                dotUsdOracle: oracle || null,
                tierThresholds: thresholds ? {
                    tier1MarketCapUsd: `$${Number(thresholds.tier1MarketCapUsd / BigInt(1_000_000)).toFixed(0)}M`,
                    tier1VolumeUsd: `$${Number(thresholds.tier1VolumeUsd / BigInt(1_000_000)).toFixed(0)}M`,
                    tier2MarketCapUsd: `$${Number(thresholds.tier2MarketCapUsd / BigInt(1_000_000)).toFixed(0)}M`,
                    tier2VolumeUsd: `$${Number(thresholds.tier2VolumeUsd / BigInt(1_000_000)).toFixed(0)}M`,
                    tier3MarketCapUsd: `$${Number(thresholds.tier3MarketCapUsd / BigInt(1_000_000)).toFixed(0)}M`,
                    tier3VolumeUsd: `$${Number(thresholds.tier3VolumeUsd / BigInt(1_000_000)).toFixed(0)}M`,
                    tier4MarketCapUsd: `$${Number(thresholds.tier4MarketCapUsd / BigInt(1_000_000)).toFixed(0)}M`,
                    tier4VolumeUsd: `$${Number(thresholds.tier4VolumeUsd / BigInt(1_000_000)).toFixed(0)}M`
                } : null,
                currentUsdRate: usdRate ? `${(Number(usdRate) / 10 ** 10).toFixed(4)} PAS per $1 USD` : null
            });

            setConfigState({
                type: 'success',
                message: 'Configuration loaded successfully'
            });

        } catch (err) {
            console.error('Error loading configuration:', err);
            setConfigState({
                type: 'error',
                message: `Failed to load configuration: ${err instanceof Error ? err.message : 'Unknown error'}`
            });
        }
    };

    const handleSetOracle = async () => {
        if (!registryContract || !newOracleAddress.trim()) {
            setConfigState({
                type: 'error',
                message: 'Please enter a valid oracle contract address',
                operation: 'oracle'
            });
            return;
        }

        setConfigState({
            type: 'loading',
            message: 'Setting DOT/USD oracle contract...',
            operation: 'oracle'
        });

        try {
            await setOracleTx.signAndSend({
                args: [newOracleAddress.trim() as `0x${string}`],
                callback: (progress) => {
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        if (progress.dispatchError) {
                            setConfigState({
                                type: 'error',
                                message: 'Transaction failed',
                                operation: 'oracle'
                            });
                        } else {
                            setConfigState({
                                type: 'success',
                                message: 'DOT/USD oracle updated successfully',
                                operation: 'oracle'
                            });
                            setNewOracleAddress('');
                            // Reload configuration
                            setTimeout(() => loadConfiguration(), 1000);
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Set oracle error:', err);
            setConfigState({
                type: 'error',
                message: `Failed to set oracle: ${err instanceof Error ? err.message : 'Unknown error'}`,
                operation: 'oracle'
            });
        }
    };

    const handleSetThresholds = async () => {
        if (!registryContract) {
            setConfigState({
                type: 'error',
                message: 'Registry contract not available',
                operation: 'thresholds'
            });
            return;
        }

        // Validate all threshold values
        const requiredFields = Object.entries(editingThresholds);
        for (const [key, value] of requiredFields) {
            if (!value || isNaN(Number(value)) || Number(value) <= 0) {
                setConfigState({
                    type: 'error',
                    message: `Invalid value for ${key.replace(/_/g, ' ')}`,
                    operation: 'thresholds'
                });
                return;
            }
        }

        setConfigState({
            type: 'loading',
            message: 'Updating tier thresholds...',
            operation: 'thresholds'
        });

        try {
            // Convert millions back to base units
            const thresholds = {
                tier1MarketCapUsd: BigInt(Number(editingThresholds.tier1MarketCapUsd) * 1_000_000),
                tier1VolumeUsd: BigInt(Number(editingThresholds.tier1VolumeUsd) * 1_000_000),
                tier2MarketCapUsd: BigInt(Number(editingThresholds.tier2MarketCapUsd) * 1_000_000),
                tier2VolumeUsd: BigInt(Number(editingThresholds.tier2VolumeUsd) * 1_000_000),
                tier3MarketCapUsd: BigInt(Number(editingThresholds.tier3MarketCapUsd) * 1_000_000),
                tier3VolumeUsd: BigInt(Number(editingThresholds.tier3VolumeUsd) * 1_000_000),
                tier4MarketCapUsd: BigInt(Number(editingThresholds.tier4MarketCapUsd) * 1_000_000),
                tier4VolumeUsd: BigInt(Number(editingThresholds.tier4VolumeUsd) * 1_000_000)
            };

            await setThresholdsTx.signAndSend({
                args: [thresholds],
                callback: (progress) => {
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        if (progress.dispatchError) {
                            setConfigState({
                                type: 'error',
                                message: 'Transaction failed',
                                operation: 'thresholds'
                            });
                        } else {
                            setConfigState({
                                type: 'success',
                                message: 'Tier thresholds updated successfully',
                                operation: 'thresholds'
                            });
                            // Reload configuration
                            setTimeout(() => loadConfiguration(), 1000);
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Set thresholds error:', err);
            setConfigState({
                type: 'error',
                message: `Failed to set thresholds: ${err instanceof Error ? err.message : 'Unknown error'}`,
                operation: 'thresholds'
            });
        }
    };

    const loadDefaultThresholds = () => {
        setEditingThresholds({
            tier1MarketCapUsd: '50',
            tier1VolumeUsd: '5',
            tier2MarketCapUsd: '250',
            tier2VolumeUsd: '25',
            tier3MarketCapUsd: '500',
            tier3VolumeUsd: '50',
            tier4MarketCapUsd: '2000',
            tier4VolumeUsd: '200'
        });
    };

    // Auto-load configuration when contract becomes available
    useEffect(() => {
        if (registryContract) {
            loadConfiguration();
        }
    }, [registryContract]);

    const isLoading = setOracleTx.inBestBlockProgress || setThresholdsTx.inBestBlockProgress;

    const getStateIcon = () => {
        switch (configState.type) {
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

    const formatAddress = (address: string) => {
        return `${address.slice(0, 8)}...${address.slice(-8)}`;
    };

    return (
        <Card className="w-full shadow-none mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Configuration Management</span>
                </CardTitle>
                <CardDescription>
                    Manage oracle contracts, tier thresholds, and system configuration (owner only)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Status Message */}
                {configState.type !== 'idle' && (
                    <div className={`p-4 rounded-lg border flex items-start space-x-3 ${configState.type === 'loading'
                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                        : configState.type === 'success'
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                            : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                        }`}>
                        {getStateIcon()}
                        <div className="flex-1">
                            <p className={`text-sm font-medium ${configState.type === 'loading'
                                ? 'text-blue-800 dark:text-blue-200'
                                : configState.type === 'success'
                                    ? 'text-green-800 dark:text-green-200'
                                    : 'text-red-800 dark:text-red-200'
                                }`}>
                                {configState.message}
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center">
                    <Button
                        onClick={loadConfiguration}
                        disabled={!registryContract || configState.type === 'loading'}
                        variant="outline"
                        size="sm"
                    >
                        {configState.type === 'loading' ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Refresh Configuration
                    </Button>
                </div>

                {/* Current Configuration Display */}
                {configData.dotUsdOracle !== null && (
                    <div className="space-y-4">
                        {/* DOT/USD Oracle */}
                        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
                            <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center space-x-2">
                                <DollarSign className="h-4 w-4" />
                                <span>DOT/USD Oracle Configuration</span>
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-green-600 dark:text-green-400">Oracle Contract:</span>
                                    <span className="text-sm font-mono text-green-900 dark:text-green-100">
                                        {configData.dotUsdOracle
                                            ? formatAddress(configData.dotUsdOracle)
                                            : 'Not configured'
                                        }
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-green-600 dark:text-green-400">Current USD Rate:</span>
                                    <span className="text-sm font-mono text-green-900 dark:text-green-100">
                                        {configData.currentUsdRate || 'Not available'}
                                    </span>
                                </div>
                                {configData.dotUsdOracle && (
                                    <div className="text-xs text-green-700 dark:text-green-300 font-mono bg-green-100 dark:bg-green-900/30 p-2 rounded">
                                        Full: {configData.dotUsdOracle}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tier Thresholds */}
                        {configData.tierThresholds && (
                            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center space-x-2">
                                    <TrendingUp className="h-4 w-4" />
                                    <span>Current Tier Thresholds</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[1, 2, 3, 4].map((tier) => (
                                        <div key={tier} className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded border border-blue-300 dark:border-blue-700">
                                            <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                                                Tier {tier}
                                            </div>
                                            <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                                                <div>Market Cap: {configData.tierThresholds?.[`tier${tier}MarketCapUsd` as keyof TierThresholds]}</div>
                                                <div>Volume: {configData.tierThresholds?.[`tier${tier}VolumeUsd` as keyof TierThresholds]}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Oracle Configuration */}
                <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center space-x-2">
                        <DollarSign className="h-4 w-4" />
                        <span>Set DOT/USD Oracle</span>
                    </h3>
                    <div className="space-y-3">
                        <Input
                            placeholder="Enter DOT/USD oracle contract address"
                            value={newOracleAddress}
                            onChange={(e) => setNewOracleAddress(e.target.value)}
                            className="font-mono text-sm"
                            disabled={isLoading}
                        />
                        <Button
                            onClick={handleSetOracle}
                            disabled={!registryContract || !newOracleAddress.trim() || isLoading}
                            className="w-full"
                        >
                            {isLoading && configState.operation === 'oracle' ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <DollarSign className="h-4 w-4 mr-2" />
                            )}
                            Set Oracle Contract
                        </Button>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded border border-green-300 dark:border-green-700">
                        <p className="text-xs text-green-800 dark:text-green-200">
                            💰 <strong>Oracle Function:</strong> Provides DOT/USD conversion rates for tier calculations. Required for accurate USD-based tier thresholds.
                        </p>
                    </div>
                </div>

                {/* Tier Thresholds Configuration */}
                <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4" />
                            <span>Update Tier Thresholds</span>
                        </h3>
                        <Button
                            onClick={loadDefaultThresholds}
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                        >
                            Load Defaults
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((tier) => (
                            <div key={tier} className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded border border-blue-300 dark:border-blue-700">
                                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
                                    Tier {tier} Thresholds
                                </h4>
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-xs text-blue-600 dark:text-blue-400">Market Cap (USD millions)</label>
                                        <Input
                                            type="number"
                                            step="1"
                                            min="0"
                                            placeholder="0"
                                            value={editingThresholds[`tier${tier}MarketCapUsd` as keyof TierThresholds]}
                                            onChange={(e) => setEditingThresholds(prev => ({
                                                ...prev,
                                                [`tier${tier}MarketCapUsd`]: e.target.value
                                            }))}
                                            className="text-xs"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-blue-600 dark:text-blue-400">Volume (USD millions)</label>
                                        <Input
                                            type="number"
                                            step="1"
                                            min="0"
                                            placeholder="0"
                                            value={editingThresholds[`tier${tier}VolumeUsd` as keyof TierThresholds]}
                                            onChange={(e) => setEditingThresholds(prev => ({
                                                ...prev,
                                                [`tier${tier}VolumeUsd`]: e.target.value
                                            }))}
                                            className="text-xs"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button
                        onClick={handleSetThresholds}
                        disabled={!registryContract || isLoading}
                        className="w-full"
                    >
                        {isLoading && configState.operation === 'thresholds' ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <TrendingUp className="h-4 w-4 mr-2" />
                        )}
                        Update Tier Thresholds
                    </Button>

                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded border border-blue-300 dark:border-blue-700">
                        <div className="text-xs text-blue-800 dark:text-blue-200">
                            <div className="font-medium mb-1">💡 Default Thresholds:</div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>Tier 1: $50M cap, $5M vol</div>
                                <div>Tier 2: $250M cap, $25M vol</div>
                                <div>Tier 3: $500M cap, $50M vol</div>
                                <div>Tier 4: $2B cap, $200M vol</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Token Data Query */}
                <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                        Enhanced Token Data Functions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded">
                            <div className="font-medium text-purple-800 dark:text-purple-200">get_enhanced_token_data(id)</div>
                            <div className="text-purple-600 dark:text-purple-400">Returns token data with tier information</div>
                        </div>
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded">
                            <div className="font-medium text-purple-800 dark:text-purple-200">get_tokens_by_tier(tier)</div>
                            <div className="text-purple-600 dark:text-purple-400">Get all tokens in specific tier</div>
                        </div>
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded">
                            <div className="font-medium text-purple-800 dark:text-purple-200">get_tokens_with_pending_changes()</div>
                            <div className="text-purple-600 dark:text-purple-400">Tokens with pending tier changes</div>
                        </div>
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded">
                            <div className="font-medium text-purple-800 dark:text-purple-200">get_current_usd_rate()</div>
                            <div className="text-purple-600 dark:text-purple-400">Current DOT/USD conversion rate</div>
                        </div>
                    </div>
                </div>

                {/* Permission Notice */}
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="text-xs text-amber-800 dark:text-amber-200">
                        <div className="font-medium mb-1">🔒 Owner Only Functions:</div>
                        <div className="space-y-1">
                            <div>• Setting DOT/USD oracle contract requires contract owner privileges</div>
                            <div>• Updating tier thresholds requires contract owner privileges</div>
                            <div>• These operations will fail if called by non-owner accounts</div>
                            <div>• Tier thresholds must be in ascending order for validation</div>
                        </div>
                    </div>
                </div>

                {/* Contract Status */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Registry Contract:</span>
                            <span className={`flex items-center space-x-2 ${registryContract ? 'text-green-600' : 'text-red-600'}`}>
                                <div className={`w-2 h-2 rounded-full ${registryContract ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span>{registryContract ? 'Connected' : 'Not Available'}</span>
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Transaction Status:</span>
                            <span className={`flex items-center space-x-2 ${isLoading ? 'text-blue-600' : 'text-gray-500'}`}>
                                {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                                <span>{isLoading ? 'Processing...' : 'Ready'}</span>
                            </span>
                        </div>
                    </div>

                    {!registryContract && (
                        <div className="flex items-center space-x-2 text-xs text-amber-600 mt-3">
                            <AlertCircle className="h-3 w-3" />
                            <span>Make sure your wallet is connected and registry contract is deployed</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}