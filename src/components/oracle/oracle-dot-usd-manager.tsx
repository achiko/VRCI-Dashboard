// src/components/oracle/oracle-dot-usd-manager.tsx

'use client';

import { useState, useEffect } from 'react';
import { useContract, useContractTx } from 'typink';
import type { OracleContractApi } from '@/lib/contracts/oracle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Clock, AlertTriangle, RefreshCw, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { txToaster } from '@/utils/txToaster';
import { Badge } from '@/components/ui/badge';
import { useContractQuery } from 'typink';
import { LabelWithHelp } from '@/components/ui/field-help';

export function OracleDotUsdManager() {
    const { contract: oracleContract } = useContract<OracleContractApi>('oracle');
    const [dotPrice, setDotPrice] = useState<string>('');
    const [emergencyPrice, setEmergencyPrice] = useState<string>('');
    const [currentPrice, setCurrentPrice] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<number | null>(null);
    const [isStale, setIsStale] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    const updateDotUsdPriceTx = useContractTx(oracleContract, 'updateDotUsdPrice');
    const emergencyDotPriceOverrideTx = useContractTx(oracleContract, 'emergencyDotPriceOverride');

    // Query hooks for verification
    const dotPriceQuery = useContractQuery({
        contract: oracleContract,
        fn: 'getDotUsdPrice'
    });

    const dotPriceStaleQuery = useContractQuery({
        contract: oracleContract,
        fn: 'isDotPriceStale'
    });

    const dotPriceLastUpdateQuery = useContractQuery({
        contract: oracleContract,
        fn: 'getDotPriceLastUpdate'
    });

    const toaster = txToaster();

    const loadDotPriceData = async () => {
        if (!oracleContract) return;

        try {
            const [priceResult, lastUpdateResult, staleResult] = await Promise.all([
                oracleContract.query.getDotUsdPrice(),
                oracleContract.query.getDotPriceLastUpdate(),
                oracleContract.query.isDotPriceStale()
            ]);

            setCurrentPrice(priceResult.data ? (Number(priceResult.data) / 1_000_000_000).toFixed(2) : null);
            setLastUpdate(lastUpdateResult.data ? Number(lastUpdateResult.data) : null);
            setIsStale(staleResult.data || false);
        } catch (err) {
            console.error('Error loading DOT price data:', err);
        }
    };

    const SCALE_DECIMALS = 18;

    const convertToScaledBigInt = (value: string): bigint => {
        const sanitized = value.trim();
        const isNegative = sanitized.startsWith('-');
        if (isNegative) {
            throw new Error('Price cannot be negative');
        }

        const [wholePart, decimalPart = ''] = sanitized.split('.');
        const normalizedDecimals = decimalPart.padEnd(SCALE_DECIMALS, '0').slice(0, SCALE_DECIMALS);

        const whole = BigInt(wholePart || '0') * BigInt(10) ** BigInt(SCALE_DECIMALS);
        const decimals = BigInt(normalizedDecimals || '0');
        return whole + decimals;
    };

    const handleUpdateDotPrice = async () => {
        if (!oracleContract || !dotPrice) {
            setError('Please enter a valid DOT price');
            return;
        }

        const priceNum = Number(dotPrice);
        if (isNaN(priceNum) || priceNum <= 0) {
            setError('Price must be a positive number');
            return;
        }

        setError(null);
        try {
            const scaledPrice = convertToScaledBigInt(dotPrice);

            await updateDotUsdPriceTx.signAndSend({
                args: [scaledPrice],
                callback: (progress) => {
                    toaster.onTxProgress(progress);
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        setDotPrice('');
                        loadDotPriceData();
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
        if (!oracleContract || !emergencyPrice) {
            setError('Please enter a valid emergency price');
            return;
        }

        const priceNum = Number(emergencyPrice);
        if (isNaN(priceNum) || priceNum <= 0) {
            setError('Price must be a positive number');
            return;
        }

        setError(null);
        try {
            const scaledPrice = convertToScaledBigInt(emergencyPrice);

            await emergencyDotPriceOverrideTx.signAndSend({
                args: [scaledPrice],
                callback: (progress) => {
                    toaster.onTxProgress(progress);
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        setEmergencyPrice('');
                        loadDotPriceData();
                    }
                }
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(`Error: ${errorMessage}`);
            toaster.onTxError(err instanceof Error ? err : new Error(errorMessage));
        }
    };

    const isLoading = updateDotUsdPriceTx.inBestBlockProgress || emergencyDotPriceOverrideTx.inBestBlockProgress;

    useEffect(() => {
        loadDotPriceData();
    }, [oracleContract]);

    return (
        <div className="space-y-6">
            {/* Current DOT Price Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5" />
                        <span>DOT/USD Price Feed</span>
                    </CardTitle>
                    <CardDescription>
                        Manage DOT price in USD for registry tier calculations
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-between items-center">
                        <Button
                            onClick={loadDotPriceData}
                            disabled={!oracleContract}
                            variant="outline"
                            size="sm"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh Data
                        </Button>
                    </div>

                    {/* Current Price Display */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Current Price</div>
                                <DollarSign className="h-4 w-4 text-blue-500" />
                            </div>
                            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                {currentPrice ? `$${currentPrice}` : 'No data'}
                            </div>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm text-green-600 dark:text-green-400 font-medium">Last Update</div>
                                <Clock className="h-4 w-4 text-green-500" />
                            </div>
                            <div className="text-lg font-bold text-green-900 dark:text-green-100">
                                {lastUpdate ? new Date(lastUpdate).toLocaleString() : 'Never'}
                            </div>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Status</div>
                                <div className={`w-3 h-3 rounded-full ${isStale ? 'bg-red-500' : 'bg-green-500'}`}></div>
                            </div>
                            <div className={`text-lg font-bold ${isStale ? 'text-red-900 dark:text-red-100' : 'text-green-900 dark:text-green-100'}`}>
                                {isStale ? 'Stale' : 'Fresh'}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Update DOT Price */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5" />
                        <span>Update DOT Price</span>
                    </CardTitle>
                    <CardDescription>
                        Update the DOT/USD price feed (authorized updaters only)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <LabelWithHelp
                                    htmlFor="dotPrice"
                                    helpText="The DOT/USD price is critical for all USD-denominated calculations in the system. It's used by the Registry contract to convert USD thresholds to plancks for tier calculations. Enter the current market price of DOT in USD (e.g., 6.50 for $6.50). The price is stored with 9 decimal places internally (1 USD = 10^9 units). This should be updated regularly (hourly or daily) by authorized price updaters."
                                >
                                    DOT Price in USD
                                </LabelWithHelp>
                                <Input
                                    id="dotPrice"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="e.g., 6.50"
                                    value={dotPrice}
                                    onChange={(e) => setDotPrice(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded border border-blue-300 dark:border-blue-700">
                                <p className="text-xs text-blue-800 dark:text-blue-200">
                                    💡 <strong>Info:</strong> This price is used to convert USD thresholds to plancks for tier calculations in the registry contract.
                                </p>
                            </div>

                            <Button
                                onClick={handleUpdateDotPrice}
                                disabled={!oracleContract || !dotPrice || isLoading}
                                className="w-full"
                            >
                                <DollarSign className="h-4 w-4 mr-2" />
                                {isLoading ? 'Updating...' : 'Update DOT Price'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Emergency Override */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <span>Emergency DOT Price Override</span>
                    </CardTitle>
                    <CardDescription>
                        Emergency override for DOT price (owner only)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <LabelWithHelp
                                    htmlFor="emergencyPrice"
                                    helpText="Emergency price override allows the contract owner to bypass all validation checks and set a DOT/USD price directly. Use this only when normal price updates fail or when immediate price correction is needed. This function bypasses staleness checks, deviation limits, and update intervals. Only the contract owner can execute this function."
                                >
                                    Emergency DOT Price (USD)
                                </LabelWithHelp>
                                <Input
                                    id="emergencyPrice"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="e.g., 6.50"
                                    value={emergencyPrice}
                                    onChange={(e) => setEmergencyPrice(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded border border-red-300 dark:border-red-700">
                                <p className="text-xs text-red-800 dark:text-red-200">
                                    ⚠️ <strong>WARNING:</strong> Emergency override bypasses all validation checks. Use only when normal price updates fail.
                                </p>
                            </div>

                            <Button
                                onClick={handleEmergencyOverride}
                                disabled={!oracleContract || !emergencyPrice || isLoading}
                                variant="destructive"
                                className="w-full"
                            >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Execute Emergency Override
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Fill Options */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Quick Fill Sample Prices</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <Button
                            onClick={() => setDotPrice('5.00')}
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                        >
                            $5.00
                        </Button>
                        <Button
                            onClick={() => setDotPrice('6.50')}
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                        >
                            $6.50
                        </Button>
                        <Button
                            onClick={() => setDotPrice('8.00')}
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                        >
                            $8.00
                        </Button>
                        <Button
                            onClick={() => setDotPrice('10.25')}
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                        >
                            $10.25
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Verification Section - Step 2.3 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5" />
                        <span>Oracle Functionality Verification</span>
                    </CardTitle>
                    <CardDescription>
                        Verify that the Oracle contract is functioning correctly (Step 2.3)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-between items-center">
                        <Button
                            onClick={() => {
                                dotPriceQuery.refresh();
                                dotPriceStaleQuery.refresh();
                                dotPriceLastUpdateQuery.refresh();
                                loadDotPriceData();
                            }}
                            disabled={!oracleContract}
                            variant="outline"
                            size="sm"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Verify Oracle
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* DOT/USD Price Verification */}
                        <div className="space-y-2 p-4 border rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">DOT/USD Price</span>
                                {dotPriceQuery.isLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                ) : dotPriceQuery.data ? (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Available
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Not Set
                                    </Badge>
                                )}
                            </div>
                            <div className="text-xs font-mono text-gray-600 dark:text-gray-400">
                                {dotPriceQuery.isLoading ? 'Loading...' : 
                                 dotPriceQuery.data ? 
                                    `$${(Number(dotPriceQuery.data) / 1_000_000_000).toFixed(2)}` : 
                                    'No price data'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                                Status: {dotPriceQuery.isLoading ? 'Querying...' : 
                                        dotPriceQuery.error ? 'Error' : 
                                        dotPriceQuery.data ? 'Success' : 'No data'}
                            </div>
                        </div>

                        {/* Price Staleness Check */}
                        <div className="space-y-2 p-4 border rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Price Staleness</span>
                                {dotPriceStaleQuery.isLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                ) : dotPriceStaleQuery.data === false ? (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Fresh
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Stale
                                    </Badge>
                                )}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                {dotPriceStaleQuery.isLoading ? 'Loading...' : 
                                 dotPriceStaleQuery.data === false ? 
                                    'Price data is fresh and up-to-date' : 
                                    'Price data may be outdated'}
                            </div>
                        </div>

                        {/* Last Update Time */}
                        <div className="space-y-2 p-4 border rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Last Update</span>
                                {dotPriceLastUpdateQuery.isLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                ) : dotPriceLastUpdateQuery.data ? (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        <Clock className="h-3 w-3 mr-1" />
                                        Updated
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                        <Clock className="h-3 w-3 mr-1" />
                                        Never
                                    </Badge>
                                )}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                {dotPriceLastUpdateQuery.isLoading ? 'Loading...' : 
                                 dotPriceLastUpdateQuery.data ? 
                                    new Date(Number(dotPriceLastUpdateQuery.data)).toLocaleString() : 
                                    'No update timestamp'}
                            </div>
                        </div>

                        {/* Oracle Health Status */}
                        <div className="space-y-2 p-4 border rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Oracle Health</span>
                                {dotPriceQuery.isLoading || dotPriceStaleQuery.isLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                ) : dotPriceQuery.data && dotPriceStaleQuery.data === false ? (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Healthy
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Needs Attention
                                    </Badge>
                                )}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                {dotPriceQuery.isLoading || dotPriceStaleQuery.isLoading ? 'Checking...' : 
                                 dotPriceQuery.data && dotPriceStaleQuery.data === false ? 
                                    'Oracle is functioning correctly' : 
                                    'Oracle may need price update or configuration'}
                            </div>
                        </div>
                    </div>

                    {/* Verification Summary */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                            Verification Summary (Step 2.3)
                        </p>
                        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                            <li>✓ Get current DOT/USD price: {dotPriceQuery.data ? 'Success' : 'Not available'}</li>
                            <li>✓ Check price staleness: {dotPriceStaleQuery.data !== undefined ? 'Success' : 'Not available'}</li>
                            <li>✓ Get last update time: {dotPriceLastUpdateQuery.data ? 'Success' : 'Not available'}</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
            )}
        </div>
    );
}