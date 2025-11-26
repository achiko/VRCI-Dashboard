// src/components/oracle/oracle-advanced-data-manager.tsx

'use client';

import { useState } from 'react';
import { useContract, useContractTx } from 'typink';
import type { OracleContractApi } from '@/lib/contracts/oracle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { txToaster } from '@/utils/txToaster';
import { LabelWithHelp } from '@/components/ui/field-help';

export function OracleAdvancedDataManager() {
    const { contract: oracleContract } = useContract<OracleContractApi>('oracle');
    const [tokenAddress, setTokenAddress] = useState<string>('');
    const [price, setPrice] = useState<string>('');
    const [marketCap, setMarketCap] = useState<string>('');
    const [volume, setVolume] = useState<string>('');
    const [updateType, setUpdateType] = useState<'complete' | 'market'>('complete');
    const [error, setError] = useState<string | null>(null);

    // Use dummy token address for testing - should match the one in oracle contract
    const dummyTokenAddress = '0x0101010101010101010101010101010101010101010101010101010101010101';

    const updateTokenDataTx = useContractTx(oracleContract, 'updateTokenData');
    const updateMarketDataTx = useContractTx(oracleContract, 'updateMarketData');

    const handleCompleteUpdate = async () => {
        if (!oracleContract) {
            setError('Oracle contract not available');
            return;
        }

        if (!price || !marketCap || !volume) {
            setError('Please fill in all fields for complete update');
            return;
        }

        // Validate input values
        if (isNaN(Number(price)) || Number(price) <= 0) {
            setError('Price must be a positive number');
            return;
        }
        if (isNaN(Number(marketCap)) || Number(marketCap) < 0) {
            setError('Market cap must be a non-negative number');
            return;
        }
        if (isNaN(Number(volume)) || Number(volume) < 0) {
            setError('Volume must be a non-negative number');
            return;
        }

        setError(null);
        const toaster = txToaster('Submitting complete token data update...');
        
        try {
            const targetAddress = tokenAddress.trim() || dummyTokenAddress;
            const priceInPlancks = BigInt(Math.floor(Number(price) * 10 ** 10));
            const marketCapInPlancks = BigInt(Math.floor(Number(marketCap) * 10 ** 10));
            const volumeInPlancks = BigInt(Math.floor(Number(volume) * 10 ** 10));

            console.log('Submitting complete update:', {
                token: targetAddress,
                price: priceInPlancks.toString(),
                marketCap: marketCapInPlancks.toString(),
                volume: volumeInPlancks.toString()
            });

            toaster.onTxPending();

            await updateTokenDataTx.signAndSend({
                args: [targetAddress, priceInPlancks, marketCapInPlancks, volumeInPlancks],
                callback: (progress) => {
                    toaster.onTxProgress(progress);
                    if (progress.status.type === 'BestChainBlockIncluded' && !progress.dispatchError) {
                        setPrice('');
                        setMarketCap('');
                        setVolume('');
                    }
                }
            });
        } catch (err) {
            console.error('Complete update error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(`Error: ${errorMessage}`);
            toaster.onTxError(err instanceof Error ? err : new Error(errorMessage));
        }
    };

    const handleMarketDataUpdate = async () => {
        if (!oracleContract) {
            setError('Oracle contract not available');
            return;
        }

        if (!marketCap || !volume) {
            setError('Please fill in market cap and volume for market data update');
            return;
        }

        // Validate input values
        if (isNaN(Number(marketCap)) || Number(marketCap) < 0) {
            setError('Market cap must be a non-negative number');
            return;
        }
        if (isNaN(Number(volume)) || Number(volume) < 0) {
            setError('Volume must be a non-negative number');
            return;
        }

        setError(null);
        const toaster = txToaster('Submitting market data update...');
        
        try {
            const targetAddress = tokenAddress.trim() || dummyTokenAddress;
            const marketCapInPlancks = BigInt(Math.floor(Number(marketCap) * 10 ** 10));
            const volumeInPlancks = BigInt(Math.floor(Number(volume) * 10 ** 10));

            console.log('Submitting market data update:', {
                token: targetAddress,
                marketCap: marketCapInPlancks.toString(),
                volume: volumeInPlancks.toString()
            });

            toaster.onTxPending();

            await updateMarketDataTx.signAndSend({
                args: [targetAddress, marketCapInPlancks, volumeInPlancks],
                callback: (progress) => {
                    toaster.onTxProgress(progress);
                    if (progress.status.type === 'BestChainBlockIncluded' && !progress.dispatchError) {
                        setMarketCap('');
                        setVolume('');
                    }
                }
            });
        } catch (err) {
            console.error('Market data update error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(`Error: ${errorMessage}`);
            toaster.onTxError(err instanceof Error ? err : new Error(errorMessage));
        }
    };

    const isLoading = updateTokenDataTx.inBestBlockProgress || updateMarketDataTx.inBestBlockProgress;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Database className="h-5 w-5" />
                        <span>Advanced Data Management</span>
                    </CardTitle>
                    <CardDescription>
                        Comprehensive token data updates with validation (owner/authorized only)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Token Address Input */}
                    <div className="space-y-2">
                        <LabelWithHelp
                            htmlFor="advancedTokenAddress"
                            helpText="The token contract address (H160 format) for which you want to update comprehensive data. This should be the address of the token contract deployed on the network. If left blank, the system will use a dummy token address for testing. Advanced updates allow you to set price, market cap, and volume in a single transaction."
                        >
                            Token Address (optional)
                        </LabelWithHelp>
                        <Input
                            id="advancedTokenAddress"
                            placeholder="Enter token address or leave blank for dummy token"
                            value={tokenAddress}
                            onChange={(e) => setTokenAddress(e.target.value)}
                            className="font-mono text-sm"
                            disabled={isLoading}
                        />
                        <div className="text-xs text-gray-500 space-y-1">
                            <p>💡 Leave blank to update the dummy token with sample data</p>
                            <p className="font-mono bg-gray-50 p-1 rounded">
                                Dummy: {dummyTokenAddress.slice(0, 20)}...
                            </p>
                        </div>
                    </div>

                    {/* Update Type Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium">Update Type</label>
                        <div className="flex space-x-4">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="advancedUpdateType"
                                    value="complete"
                                    checked={updateType === 'complete'}
                                    onChange={(e) => setUpdateType(e.target.value as 'complete')}
                                    className="text-primary focus:ring-primary"
                                    disabled={isLoading}
                                />
                                <span className="text-sm">Complete Token Data</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="advancedUpdateType"
                                    value="market"
                                    checked={updateType === 'market'}
                                    onChange={(e) => setUpdateType(e.target.value as 'market')}
                                    className="text-primary focus:ring-primary"
                                    disabled={isLoading}
                                />
                                <span className="text-sm">Market Data Only</span>
                            </label>
                        </div>
                    </div>

                    {/* Complete Token Data Update */}
                    {updateType === 'complete' && (
                        <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 flex items-center space-x-2">
                                <Database className="h-4 w-4" />
                                <span>Complete Token Data Update</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <LabelWithHelp
                                        htmlFor="completePrice"
                                        helpText="The current price of the token in PAS (native token of Passet Hub). Enter as a decimal number (e.g., 1.5 for 1.5 PAS per token). This is required for complete token data updates. The price is stored internally in plancks (1 PAS = 10^10 plancks)."
                                    >
                                        Price (PAS) *
                                    </LabelWithHelp>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="completePrice"
                                            type="number"
                                            step="0.0001"
                                            min="0"
                                            placeholder="e.g., 1.5"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <LabelWithHelp
                                        htmlFor="completeMarketCap"
                                        helpText="The total market capitalization of the token in PAS tokens. Market cap = price × total supply. Enter as a decimal number (e.g., 100000 for 100,000 PAS). This is required for complete token data updates and is used by the Registry contract for tier calculations."
                                    >
                                        Market Cap (PAS) *
                                    </LabelWithHelp>
                                    <div className="relative">
                                        <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="completeMarketCap"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="e.g., 100000"
                                            value={marketCap}
                                            onChange={(e) => setMarketCap(e.target.value)}
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <LabelWithHelp
                                        htmlFor="completeVolume"
                                        helpText="The 24-hour trading volume of the token in PAS tokens. This represents the total amount of tokens traded in the last 24 hours. Enter as a decimal number (e.g., 10000 for 10,000 PAS). This is required for complete token data updates and is used for liquidity analysis."
                                    >
                                        24h Volume (PAS) *
                                    </LabelWithHelp>
                                    <div className="relative">
                                        <BarChart3 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="completeVolume"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="e.g., 10000"
                                            value={volume}
                                            onChange={(e) => setVolume(e.target.value)}
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded border border-blue-300 dark:border-blue-700">
                                <p className="text-xs text-blue-800 dark:text-blue-200">
                                    📊 <strong>Complete Update:</strong> Updates price, market cap, and volume atomically with full validation checks.
                                </p>
                            </div>
                            <Button
                                onClick={handleCompleteUpdate}
                                disabled={!oracleContract || !price || !marketCap || !volume || isLoading}
                                className="w-full"
                            >
                                <Database className="h-4 w-4 mr-2" />
                                {isLoading ? 'Updating...' : 'Update Complete Token Data'}
                            </Button>
                        </div>
                    )}

                    {/* Market Data Only Update */}
                    {updateType === 'market' && (
                        <div className="space-y-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center space-x-2">
                                <TrendingUp className="h-4 w-4" />
                                <span>Market Data Update</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <LabelWithHelp
                                        htmlFor="marketMarketCap"
                                        helpText="The total market capitalization of the token in PAS tokens. Market cap = price × total supply. Enter as a decimal number (e.g., 100000 for 100,000 PAS). This is required for market data updates and is used by the Registry contract for tier calculations."
                                    >
                                        Market Cap (PAS) *
                                    </LabelWithHelp>
                                    <div className="relative">
                                        <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="marketMarketCap"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="e.g., 100000"
                                            value={marketCap}
                                            onChange={(e) => setMarketCap(e.target.value)}
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <LabelWithHelp
                                        htmlFor="marketVolume"
                                        helpText="The 24-hour trading volume of the token in PAS tokens. This represents the total amount of tokens traded in the last 24 hours. Enter as a decimal number (e.g., 10000 for 10,000 PAS). This is required for market data updates and is used for liquidity analysis."
                                    >
                                        24h Volume (PAS) *
                                    </LabelWithHelp>
                                    <div className="relative">
                                        <BarChart3 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="marketVolume"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="e.g., 10000"
                                            value={volume}
                                            onChange={(e) => setVolume(e.target.value)}
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded border border-green-300 dark:border-green-700">
                                <p className="text-xs text-green-800 dark:text-green-200">
                                    📈 <strong>Market Data Only:</strong> Updates only market cap and volume. Requires existing price data for the token.
                                </p>
                            </div>
                            <Button
                                onClick={handleMarketDataUpdate}
                                disabled={!oracleContract || !marketCap || !volume || isLoading}
                                className="w-full"
                            >
                                <TrendingUp className="h-4 w-4 mr-2" />
                                {isLoading ? 'Updating...' : 'Update Market Data'}
                            </Button>
                        </div>
                    )}

                    {/* Validation Information */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
                            Validation Rules Applied
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-400">
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                    <span>Price deviation limits enforced</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span>Minimum update interval respected</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Authorization checks performed</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    <span>Timestamp automatically set</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Fill Options */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
                            Quick Fill Sample Data
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <Button
                                onClick={() => {
                                    setPrice('1.25');
                                    setMarketCap('125000');
                                    setVolume('12500');
                                }}
                                variant="outline"
                                size="sm"
                                disabled={isLoading}
                            >
                                Low Cap Token
                            </Button>
                            <Button
                                onClick={() => {
                                    setPrice('5.50');
                                    setMarketCap('550000');
                                    setVolume('55000');
                                }}
                                variant="outline"
                                size="sm"
                                disabled={isLoading}
                            >
                                Mid Cap Token
                            </Button>
                            <Button
                                onClick={() => {
                                    setPrice('25.75');
                                    setMarketCap('2575000');
                                    setVolume('257500');
                                }}
                                variant="outline"
                                size="sm"
                                disabled={isLoading}
                            >
                                High Cap Token
                            </Button>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                            Click to fill the form with sample data for testing
                        </p>
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