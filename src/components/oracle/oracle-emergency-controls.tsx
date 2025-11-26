// src/components/oracle/oracle-emergency-controls.tsx

'use client';

import { useEffect, useState } from 'react';
import { useContract, useContractTx } from 'typink';
import type { OracleContractApi } from '@/lib/contracts/oracle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Play, Pause, Shield, DollarSign } from 'lucide-react';
import { txToaster } from '@/utils/txToaster';
import { LabelWithHelp } from '@/components/ui/field-help';

export function OracleEmergencyControls() {
    const { contract: oracleContract } = useContract<OracleContractApi>('oracle');
    const [tokenAddress, setTokenAddress] = useState<string>('');
    const [emergencyPrice, setEmergencyPrice] = useState<string>('');
    const [emergencyMarketCap, setEmergencyMarketCap] = useState<string>('');
    const [emergencyVolume, setEmergencyVolume] = useState<string>('');
    const [isPaused, setIsPaused] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const toaster = txToaster();

    const pauseUpdatesTx = useContractTx(oracleContract, 'pauseUpdates');
    const resumeUpdatesTx = useContractTx(oracleContract, 'resumeUpdates');
    const emergencyPriceOverrideTx = useContractTx(oracleContract, 'emergencyPriceOverride');

    const checkPauseStatus = async () => {
        if (!oracleContract) return;

        try {
            const result = await oracleContract.query.isPaused();
            setIsPaused(result.data || false);
        } catch (err) {
            console.error('Error checking pause status:', err);
        }
    };

    const handlePauseUpdates = async () => {
        if (!oracleContract) {
            setError('Oracle contract not available');
            return;
        }

        setError(null);
        try {
            await pauseUpdatesTx.signAndSend({
                args: [],
                callback: (progress) => {
                    toaster.onTxProgress(progress);
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        setIsPaused(true);
                    }
                }
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(`Error: ${errorMessage}`);
            toaster.onTxError(err instanceof Error ? err : new Error(errorMessage));
        }
    };

    const handleResumeUpdates = async () => {
        if (!oracleContract) {
            setError('Oracle contract not available');
            return;
        }

        setError(null);
        try {
            await resumeUpdatesTx.signAndSend({
                args: [],
                callback: (progress) => {
                    toaster.onTxProgress(progress);
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        setIsPaused(false);
                    }
                }
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(`Error: ${errorMessage}`);
            toaster.onTxError(err instanceof Error ? err : new Error(errorMessage));
        }
    };

    const handleEmergencyOverride = async () => {
        if (!oracleContract || !tokenAddress.trim() || !emergencyPrice) {
            setError('Please enter token address and price');
            return;
        }

        setError(null);
        try {
            const priceInPlancks = BigInt(Math.floor(Number(emergencyPrice) * 10 ** 10));
            const marketCapInPlancks = emergencyMarketCap
                ? BigInt(Math.floor(Number(emergencyMarketCap) * 10 ** 10))
                : BigInt(0);
            const volumeInPlancks = emergencyVolume
                ? BigInt(Math.floor(Number(emergencyVolume) * 10 ** 10))
                : BigInt(0);

            await emergencyPriceOverrideTx.signAndSend({
                args: [tokenAddress.trim(), priceInPlancks, marketCapInPlancks, volumeInPlancks],
                callback: (progress) => {
                    toaster.onTxProgress(progress);
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        setTokenAddress('');
                        setEmergencyPrice('');
                        setEmergencyMarketCap('');
                        setEmergencyVolume('');
                    }
                }
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(`Error: ${errorMessage}`);
            toaster.onTxError(err instanceof Error ? err : new Error(errorMessage));
        }
    };

    const isLoading = pauseUpdatesTx.inBestBlockProgress ||
        resumeUpdatesTx.inBestBlockProgress ||
        emergencyPriceOverrideTx.inBestBlockProgress;

    // Check pause status on component mount
    useEffect(() => {
        checkPauseStatus();
    }, [oracleContract]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <span>Emergency Controls</span>
                    </CardTitle>
                    <CardDescription>
                        Emergency functions for oracle management (owner only)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Pause Status */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                <span className="text-sm font-medium">
                                    Oracle Status: {isPaused ? 'PAUSED' : 'ACTIVE'}
                                </span>
                            </div>
                            <Button
                                onClick={checkPauseStatus}
                                variant="outline"
                                size="sm"
                            >
                                Refresh Status
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {isPaused
                                ? 'All price updates are currently paused'
                                : 'Oracle is accepting price updates normally'
                            }
                        </p>
                    </div>

                    {/* Pause/Resume Controls */}
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 flex items-center space-x-2 mb-3">
                            <Shield className="h-4 w-4" />
                            <span>Pause/Resume Updates</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Button
                                onClick={handlePauseUpdates}
                                disabled={!oracleContract || isPaused || isLoading}
                                variant="destructive"
                                className="flex items-center justify-center space-x-2"
                            >
                                <Pause className="h-4 w-4" />
                                <span>Pause All Updates</span>
                            </Button>
                            <Button
                                onClick={handleResumeUpdates}
                                disabled={!oracleContract || !isPaused || isLoading}
                                className="flex items-center justify-center space-x-2"
                            >
                                <Play className="h-4 w-4" />
                                <span>Resume Updates</span>
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Use pause to temporarily disable all price updates during emergencies
                        </p>
                    </div>

                    {/* Emergency Price Override */}
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 flex items-center space-x-2 mb-3">
                            <DollarSign className="h-4 w-4" />
                            <span>Emergency Price Override</span>
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <LabelWithHelp
                                    htmlFor="emergencyTokenAddress"
                                    helpText="The token contract address (H160 format) for which you want to override price data. This emergency override bypasses all validation checks including staleness, deviation limits, and update intervals. Use only when normal price updates fail or immediate correction is needed. Only the contract owner can execute this function."
                                >
                                    Token Address
                                </LabelWithHelp>
                                <Input
                                    id="emergencyTokenAddress"
                                    placeholder="Enter token address"
                                    value={tokenAddress}
                                    onChange={(e) => setTokenAddress(e.target.value)}
                                    className="font-mono text-sm"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <LabelWithHelp
                                        htmlFor="emergencyPrice"
                                        helpText="Emergency price override value in PAS tokens. This bypasses all validation checks. Enter as a decimal number (e.g., 1.5 for 1.5 PAS per token). This is required for emergency overrides. Use with extreme caution as it can set any price regardless of previous values or market conditions."
                                    >
                                        Price (PAS) *
                                    </LabelWithHelp>
                                    <Input
                                        id="emergencyPrice"
                                        type="number"
                                        step="0.0001"
                                        placeholder="e.g., 1.5"
                                        value={emergencyPrice}
                                        onChange={(e) => setEmergencyPrice(e.target.value)}
                                        disabled={isLoading}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="emergencyMarketCap" className="text-sm font-medium">
                                        Market Cap (PAS)
                                    </label>
                                    <Input
                                        id="emergencyMarketCap"
                                        type="number"
                                        step="0.01"
                                        placeholder="Optional"
                                        value={emergencyMarketCap}
                                        onChange={(e) => setEmergencyMarketCap(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <LabelWithHelp
                                        htmlFor="emergencyVolume"
                                        helpText="Optional emergency 24h volume override in PAS tokens. If provided, this will override the volume value. Enter as a decimal number (e.g., 10000 for 10,000 PAS). This is optional - if left empty, the volume will not be updated in the emergency override."
                                    >
                                        24h Volume (PAS)
                                    </LabelWithHelp>
                                    <Input
                                        id="emergencyVolume"
                                        type="number"
                                        step="0.01"
                                        placeholder="Optional"
                                        value={emergencyVolume}
                                        onChange={(e) => setEmergencyVolume(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded border border-red-300 dark:border-red-700">
                                <p className="text-xs text-red-800 dark:text-red-200">
                                    ⚠️ <strong>WARNING:</strong> Emergency override bypasses all validation checks.
                                    Use only in critical situations when normal price updates are compromised.
                                </p>
                            </div>
                            <Button
                                onClick={handleEmergencyOverride}
                                disabled={!oracleContract || !tokenAddress.trim() || !emergencyPrice || isLoading}
                                variant="destructive"
                                className="w-full"
                            >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Execute Emergency Override
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