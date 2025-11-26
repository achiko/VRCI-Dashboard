// src/components/oracle/oracle-price-updater.tsx

'use client';

import { useState } from 'react';
import { useContract, useContractTx } from 'typink';
import type { OracleContractApi } from '@/lib/contracts/oracle';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Upload, DollarSign, TrendingUp, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { txToaster } from '@/utils/txToaster';
import { LabelWithHelp } from '@/components/ui/field-help';

export function OraclePriceUpdater() {
    const { contract: oracleContract } = useContract<OracleContractApi>('oracle');
    const [tokenAddress, setTokenAddress] = useState<string>('');
    const [price, setPrice] = useState<string>('');
    const [marketCap, setMarketCap] = useState<string>('');
    const [volume, setVolume] = useState<string>('');
    const [updateType, setUpdateType] = useState<'price' | 'market'>('price');
    const [txResult, setTxResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const toaster = txToaster();
    // Use dummy token address for testing
    const dummyTokenAddress = '0x0101010101010101010101010101010101010101010101010101010101010101';

    // Typink transaction hooks - proper usage
    const updatePriceTx = useContractTx(oracleContract, 'updatePrice');
    const updateMarketDataTx = useContractTx(oracleContract, 'updateMarketData');

    const handleUpdatePrice = async () => {
        if (!oracleContract) {
            setError('Oracle contract not available. Make sure your wallet is connected.');
            return;
        }

        if (!price || isNaN(Number(price))) {
            setError('Please enter a valid price');
            return;
        }

        setError(null);
        setTxResult(null);

        try {
            const targetAddress = tokenAddress.trim() || dummyTokenAddress;
            // Convert price to the appropriate format (assuming price in DOT units)
            const priceInPlancks = BigInt(Math.floor(Number(price) * 10 ** 10));

            console.log('Updating price:', {
                token: targetAddress,
                price: priceInPlancks.toString(),
                originalPrice: price
            });

            // Use proper signAndSend with callback
            await updatePriceTx.signAndSend({
                args: [targetAddress, priceInPlancks],
                callback: (progress) => {
                    const { status } = progress;

                    // Use txToaster for progress notifications
                    toaster.onTxProgress(progress);

                    console.log('Transaction status:', status);

                    if (status.type === 'BestChainBlockIncluded') {
                        console.log('Price update transaction included in block');
                        setTxResult({
                            type: 'price',
                            success: true,
                            txHash: progress.txHash || 'N/A',
                            tokenAddress: targetAddress,
                            price: price,
                            timestamp: new Date().toISOString()
                        });

                        // Reset form on success
                        setPrice('');
                    }
                }
            });

        } catch (err) {
            console.error('Error updating price:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(`Error: ${errorMessage}`);

            // Use txToaster for error notifications
            toaster.onTxError(err instanceof Error ? err : new Error(errorMessage));
        }
    };

    const handleUpdateMarketData = async () => {
        if (!oracleContract) {
            setError('Oracle contract not available. Make sure your wallet is connected.');
            return;
        }

        if (!marketCap || !volume || isNaN(Number(marketCap)) || isNaN(Number(volume))) {
            setError('Please enter valid market cap and volume values');
            return;
        }

        setError(null);
        setTxResult(null);

        try {
            const targetAddress = tokenAddress.trim() || dummyTokenAddress;
            // Convert values to plancks
            const marketCapInPlancks = BigInt(Math.floor(Number(marketCap) * 10 ** 10));
            const volumeInPlancks = BigInt(Math.floor(Number(volume) * 10 ** 10));

            console.log('Updating market data:', {
                token: targetAddress,
                marketCap: marketCapInPlancks.toString(),
                volume: volumeInPlancks.toString(),
                originalValues: { marketCap, volume }
            });

            // Use proper signAndSend with callback
            await updateMarketDataTx.signAndSend({
                args: [targetAddress, marketCapInPlancks, volumeInPlancks],
                callback: (progress) => {
                    const { status } = progress;

                    // Use txToaster for progress notifications
                    toaster.onTxProgress(progress);

                    console.log('Transaction status:', status);

                    if (status.type === 'BestChainBlockIncluded') {
                        console.log('Market data update transaction included in block');
                        setTxResult({
                            type: 'market',
                            success: true,
                            txHash: progress.txHash || 'N/A',
                            tokenAddress: targetAddress,
                            marketCap: marketCap,
                            volume: volume,
                            timestamp: new Date().toISOString()
                        });

                        // Reset form on success
                        setMarketCap('');
                        setVolume('');
                    }
                }
            });

        } catch (err) {
            console.error('Error updating market data:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(`Error: ${errorMessage}`);

            // Use txToaster for error notifications
            toaster.onTxError(err instanceof Error ? err : new Error(errorMessage));
        }
    };

    const isLoading = updatePriceTx.inBestBlockProgress || updateMarketDataTx.inBestBlockProgress;
    const isUpdatingPrice = updatePriceTx.inBestBlockProgress;
    const isUpdatingMarket = updateMarketDataTx.inBestBlockProgress;

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Upload className="h-5 w-5" />
                    <span>Update Oracle Data</span>
                </CardTitle>
                <CardDescription>
                    Update price feeds and market data in the oracle contract (owner only)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Token Address Input */}
                <div className="space-y-2">
                    <LabelWithHelp
                        htmlFor="update-token-address"
                        helpText="The token contract address (H160 format) for which you want to update price data. This should be the address of the token contract deployed on the network. If left blank, the system will use a dummy token address for testing purposes. Only authorized updaters or the contract owner can update prices."
                    >
                        Token Address (optional)
                    </LabelWithHelp>
                    <Input
                        id="update-token-address"
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
                                name="updateType"
                                value="price"
                                checked={updateType === 'price'}
                                onChange={(e) => setUpdateType(e.target.value as 'price')}
                                className="text-primary focus:ring-primary"
                                disabled={isLoading}
                            />
                            <span className="text-sm">Price Only</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name="updateType"
                                value="market"
                                checked={updateType === 'market'}
                                onChange={(e) => setUpdateType(e.target.value as 'market')}
                                className="text-primary focus:ring-primary"
                                disabled={isLoading}
                            />
                            <span className="text-sm">Market Data (Cap + Volume)</span>
                        </label>
                    </div>
                </div>

                {/* Price Update Form */}
                {updateType === 'price' && (
                    <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 flex items-center space-x-2">
                            <DollarSign className="h-4 w-4" />
                            <span>Update Price</span>
                        </h3>
                        <div className="space-y-2">
                            <LabelWithHelp
                                htmlFor="price"
                                helpText="The current price of the token in PAS (the native token of Passet Hub). Enter the price as a decimal number (e.g., 1.5 for 1.5 PAS per token). The price is stored internally in plancks (1 PAS = 10^10 plancks), so the value is automatically converted. This price is used for portfolio valuation and rebalancing calculations."
                            >
                                Price (in PAS tokens)
                            </LabelWithHelp>
                            <Input
                                id="price"
                                type="number"
                                step="0.0001"
                                placeholder="e.g., 1.5"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="text-sm"
                                disabled={isLoading}
                            />
                        </div>
                        <Button
                            onClick={handleUpdatePrice}
                            disabled={isLoading || !oracleContract || !price}
                            className="w-full flex items-center justify-center space-x-2"
                        >
                            {isUpdatingPrice ? (
                                <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                                <DollarSign className="h-4 w-4" />
                            )}
                            <span>{isUpdatingPrice ? 'Updating Price...' : 'Update Price'}</span>
                        </Button>
                    </div>
                )}

                {/* Market Data Update Form */}
                {updateType === 'market' && (
                    <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4" />
                            <span>Update Market Data</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <LabelWithHelp
                                    htmlFor="marketCap"
                                    helpText="The total market capitalization of the token in PAS tokens. Market cap is calculated as: price × total supply. Enter the value as a decimal number (e.g., 100000 for 100,000 PAS). This value is used by the Registry contract to determine token tiers based on market cap thresholds."
                                >
                                    Market Cap (in PAS tokens)
                                </LabelWithHelp>
                                <Input
                                    id="marketCap"
                                    type="number"
                                    step="0.01"
                                    placeholder="e.g., 100000"
                                    value={marketCap}
                                    onChange={(e) => setMarketCap(e.target.value)}
                                    className="text-sm"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <LabelWithHelp
                                    htmlFor="volume"
                                    helpText="The 24-hour trading volume of the token in PAS tokens. This represents the total amount of tokens traded in the last 24 hours. Enter the value as a decimal number (e.g., 50000 for 50,000 PAS). Volume data is used for liquidity analysis and tier calculations in the Registry contract."
                                >
                                    24h Volume (in PAS tokens)
                                </LabelWithHelp>
                                <Input
                                    id="volume"
                                    type="number"
                                    step="0.01"
                                    placeholder="e.g., 10000"
                                    value={volume}
                                    onChange={(e) => setVolume(e.target.value)}
                                    className="text-sm"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">
                            Enter values in PAS tokens (e.g., 100000 = 100,000 PAS)
                        </p>
                        <Button
                            onClick={handleUpdateMarketData}
                            disabled={isLoading || !oracleContract || !marketCap || !volume}
                            className="w-full flex items-center justify-center space-x-2"
                        >
                            {isUpdatingMarket ? (
                                <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                                <TrendingUp className="h-4 w-4" />
                            )}
                            <span>{isUpdatingMarket ? 'Updating Market Data...' : 'Update Market Data'}</span>
                        </Button>
                    </div>
                )}

                {/* Contract Status */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Oracle Contract:</span>
                            <span className={`flex items-center space-x-2 ${oracleContract ? 'text-green-600' : 'text-red-600'
                                }`}>
                                <div className={`w-2 h-2 rounded-full ${oracleContract ? 'bg-green-500' : 'bg-red-500'
                                    }`} />
                                <span>{oracleContract ? 'Connected' : 'Not Available'}</span>
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Transaction Status:</span>
                            <span className={`flex items-center space-x-2 ${isLoading ? 'text-yellow-600' : 'text-gray-600'
                                }`}>
                                {isLoading && <Loader className="h-3 w-3 animate-spin" />}
                                <span>{isLoading ? 'Processing Transaction...' : 'Ready'}</span>
                            </span>
                        </div>

                        {!oracleContract && (
                            <div className="flex items-center space-x-2 text-xs text-amber-600">
                                <AlertCircle className="h-3 w-3" />
                                <span>Make sure your wallet is connected and you are the contract owner</span>
                            </div>
                        )}

                        {isLoading && (
                            <div className="flex items-center space-x-2 text-xs text-blue-600">
                                <Loader className="h-3 w-3 animate-spin" />
                                <span>Transaction is being processed. Please wait for confirmation...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                    </div>
                )}

                {/* Success Result Display */}
                {txResult && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Update Successful!</h3>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>

                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Update Type:</span>
                                    <span className="font-medium capitalize">{txResult.type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Token:</span>
                                    <span className="font-mono text-xs">{txResult.tokenAddress.slice(0, 10)}...</span>
                                </div>
                                {txResult.type === 'price' && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">New Price:</span>
                                        <span className="font-medium">{txResult.price} PAS</span>
                                    </div>
                                )}
                                {txResult.type === 'market' && (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Market Cap:</span>
                                            <span className="font-medium">{txResult.marketCap} PAS</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Volume:</span>
                                            <span className="font-medium">{txResult.volume} PAS</span>
                                        </div>
                                    </>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Transaction:</span>
                                    <span className="font-mono text-xs">{txResult.txHash}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Time:</span>
                                    <span className="text-xs">{new Date(txResult.timestamp).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-green-600 dark:text-green-400">
                            ✅ Oracle data updated successfully! You can now query the updated values.
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}