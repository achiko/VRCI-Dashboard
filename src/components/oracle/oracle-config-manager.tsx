// src/components/oracle/oracle-config-manager.tsx

'use client';

import { useState } from 'react';
import { useContract, useContractTx } from 'typink';
import type { OracleContractApi } from '@/lib/contracts/oracle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Shield, Clock, Percent, Save } from 'lucide-react';
import { txToaster } from '@/utils/txToaster';
import { LabelWithHelp } from '@/components/ui/field-help';

export function OracleConfigManager() {
    const { contract: oracleContract } = useContract<OracleContractApi>('oracle');
    const [maxDeviation, setMaxDeviation] = useState<string>('');
    const [stalenessThreshold, setStalenessThreshold] = useState<string>('');
    const [minUpdateInterval, setMinUpdateInterval] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const toaster = txToaster();

    const setMaxDeviationTx = useContractTx(oracleContract, 'setMaxDeviation');
    const setStalenessThresholdTx = useContractTx(oracleContract, 'setStalenessThreshold');
    const setMinUpdateIntervalTx = useContractTx(oracleContract, 'setMinUpdateInterval');

    const handleSetMaxDeviation = async () => {
        if (!oracleContract || !maxDeviation) {
            setError('Please enter a valid deviation percentage');
            return;
        }

        setError(null);
        try {
            const deviationBp = parseInt(maxDeviation) * 100; // Convert percentage to basis points
            await setMaxDeviationTx.signAndSend({
                args: [deviationBp],
                callback: (progress) => {
                    toaster.onTxProgress(progress);
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        setMaxDeviation('');
                    }
                }
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(`Error: ${errorMessage}`);
            toaster.onTxError(err instanceof Error ? err : new Error(errorMessage));
        }
    };

    const handleSetStalenessThreshold = async () => {
        if (!oracleContract || !stalenessThreshold) {
            setError('Please enter a valid staleness threshold');
            return;
        }

        setError(null);
        try {
            const thresholdSeconds = BigInt(parseInt(stalenessThreshold));
            await setStalenessThresholdTx.signAndSend({
                args: [thresholdSeconds],
                callback: (progress) => {
                    toaster.onTxProgress(progress);
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        setStalenessThreshold('');
                    }
                }
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(`Error: ${errorMessage}`);
            toaster.onTxError(err instanceof Error ? err : new Error(errorMessage));
        }
    };

    const handleSetMinUpdateInterval = async () => {
        if (!oracleContract || !minUpdateInterval) {
            setError('Please enter a valid update interval');
            return;
        }

        setError(null);
        try {
            const intervalSeconds = BigInt(parseInt(minUpdateInterval));
            await setMinUpdateIntervalTx.signAndSend({
                args: [intervalSeconds],
                callback: (progress) => {
                    toaster.onTxProgress(progress);
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        setMinUpdateInterval('');
                    }
                }
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(`Error: ${errorMessage}`);
            toaster.onTxError(err instanceof Error ? err : new Error(errorMessage));
        }
    };

    const isLoading = setMaxDeviationTx.inBestBlockProgress ||
        setStalenessThresholdTx.inBestBlockProgress ||
        setMinUpdateIntervalTx.inBestBlockProgress;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Settings className="h-5 w-5" />
                        <span>Validation Configuration</span>
                    </CardTitle>
                    <CardDescription>
                        Configure oracle validation rules and limits (owner only)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Max Deviation */}
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 flex items-center space-x-2 mb-3">
                            <Percent className="h-4 w-4" />
                            <span>Maximum Price Deviation</span>
                        </h3>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <LabelWithHelp
                                    htmlFor="maxDeviation"
                                    helpText="The maximum allowed price deviation in basis points (1 basis point = 0.01%). This prevents sudden large price changes that could indicate errors or manipulation. For example, 2000 basis points = 20% maximum change. If a price update would change the price by more than this percentage, it will be rejected. This protects against accidental large updates or malicious price manipulation."
                                >
                                    Maximum Deviation (basis points)
                                </LabelWithHelp>
                                <Input
                                    id="maxDeviation"
                                    type="number"
                                    step="0.1"
                                    placeholder="e.g., 2000 (for 20%)"
                                    value={maxDeviation}
                                    onChange={(e) => setMaxDeviation(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <Button
                                onClick={handleSetMaxDeviation}
                                disabled={!oracleContract || !maxDeviation || isLoading}
                                className="w-full"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Set Max Deviation
                            </Button>
                        </div>
                    </div>

                    {/* Staleness Threshold */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 flex items-center space-x-2 mb-3">
                            <Clock className="h-4 w-4" />
                            <span>Staleness Threshold</span>
                        </h3>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <LabelWithHelp
                                    htmlFor="stalenessThreshold"
                                    helpText="The time in seconds after which price data is considered stale. If the last update was more than this threshold ago, the price is marked as stale. For example, 3600 seconds = 1 hour. Stale prices may be rejected by other contracts or trigger warnings. This helps ensure price data is kept up-to-date and prevents using outdated information for critical operations."
                                >
                                    Staleness Threshold (seconds)
                                </LabelWithHelp>
                                <Input
                                    id="stalenessThreshold"
                                    type="number"
                                    placeholder="e.g., 3600 (1 hour)"
                                    value={stalenessThreshold}
                                    onChange={(e) => setStalenessThreshold(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <Button
                                onClick={handleSetStalenessThreshold}
                                disabled={!oracleContract || !stalenessThreshold || isLoading}
                                className="w-full"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Set Staleness Threshold
                            </Button>
                        </div>
                    </div>

                    {/* Min Update Interval */}
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center space-x-2 mb-3">
                            <Shield className="h-4 w-4" />
                            <span>Minimum Update Interval</span>
                        </h3>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <LabelWithHelp
                                    htmlFor="minUpdateInterval"
                                    helpText="The minimum time in seconds that must pass between price updates for the same token. This prevents spam updates and ensures price updates are meaningful. For example, 60 seconds means you can only update a token's price once per minute. This helps prevent rapid-fire updates that could be used to manipulate prices or waste gas fees."
                                >
                                    Minimum Update Interval (seconds)
                                </LabelWithHelp>
                                <Input
                                    id="minUpdateInterval"
                                    type="number"
                                    placeholder="e.g., 60 (1 minute)"
                                    value={minUpdateInterval}
                                    onChange={(e) => setMinUpdateInterval(e.target.value)}
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-gray-500">
                                    Minimum time between updates to prevent spam (60 = 1 minute, 300 = 5 minutes)
                                </p>
                            </div>
                            <Button
                                onClick={handleSetMinUpdateInterval}
                                disabled={!oracleContract || !minUpdateInterval || isLoading}
                                className="w-full"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Set Update Interval
                            </Button>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}