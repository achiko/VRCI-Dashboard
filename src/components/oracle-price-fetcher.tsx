// src/components/oracle-price-fetcher.tsx

'use client';

import { useState } from 'react';
import { useContract } from 'typink';
import { ContractId } from '@/contracts/deployments';
// Import your generated types from dedot CLI
import type { OracleContractApi } from '@/contracts/types/oracle';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, DollarSign, RefreshCw, Search, AlertCircle } from 'lucide-react';
import { formatBalance } from 'typink';

export function OraclePriceFetcher() {
    const { contract: oracleContract } = useContract<OracleContractApi>(ContractId.ORACLE);
    const [tokenAddress, setTokenAddress] = useState<string>('');
    const [isQuerying, setIsQuerying] = useState(false);
    const [queryResult, setQueryResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Use dummy token address for testing (as configured in oracle contract)
    const dummyTokenAddress = '0x0101010101010101010101010101010101010101010101010101010101010101';

    const handleGetPrice = async () => {
        if (!oracleContract) {
            setError('Oracle contract not available. Make sure your wallet is connected.');
            return;
        }

        setIsQuerying(true);
        setError(null);
        setQueryResult(null);

        try {
            console.log('Querying oracle contract for price...');
            const targetAddress = tokenAddress.trim() || dummyTokenAddress;
            console.log('Token address:', targetAddress);

            // Query the oracle contract for price
            const priceResult = await oracleContract.query.getPrice(targetAddress);

            console.log('Price query result:', priceResult);
            console.log('Result type:', typeof priceResult);
            console.log('Result keys:', Object.keys(priceResult));

            // Handle BigInt serialization properly
            console.log('Price data type:', typeof priceResult.data);
            console.log('Price data value:', priceResult.data);

            // Try accessing the data property directly
            const price = priceResult.data;

            setQueryResult({
                price: price,
                formattedPrice: price ? formatBalance(price, { decimals: 10, symbol: 'PAS' }) : 'No price data available',
                rawPrice: price?.toString() || 'null',
                success: true,
                queryType: 'price',
                // Store serializable version of result for debugging
                resultInfo: {
                    hasData: priceResult.data !== undefined,
                    dataType: typeof priceResult.data,
                    dataValue: priceResult.data?.toString() || 'null'
                }
            });

        } catch (err) {
            console.error('Error querying oracle:', err);
            setError(`Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
        } finally {
            setIsQuerying(false);
        }
    };

    const handleGetMarketData = async () => {
        if (!oracleContract) {
            setError('Oracle contract not available. Make sure your wallet is connected.');
            return;
        }

        setIsQuerying(true);
        setError(null);
        setQueryResult(null);

        try {
            console.log('Querying oracle contract for comprehensive market data...');
            const targetAddress = tokenAddress.trim() || dummyTokenAddress;

            // Query multiple oracle functions in parallel
            const [priceResult, marketCapResult, volumeResult] = await Promise.all([
                oracleContract.query.getPrice(targetAddress),
                oracleContract.query.getMarketCap(targetAddress),
                oracleContract.query.getMarketVolume(targetAddress)
            ]);

            console.log('Market data results received');
            console.log('Price result data:', priceResult.data);
            console.log('MarketCap result data:', marketCapResult.data);
            console.log('Volume result data:', volumeResult.data);

            // Extract data directly from results and handle BigInt properly
            const price = priceResult.data;
            const marketCap = marketCapResult.data;
            const volume = volumeResult.data;

            setQueryResult({
                price: price,
                marketCap: marketCap,
                volume: volume,
                formattedPrice: price
                    ? formatBalance(price, { decimals: 10, symbol: 'PAS' })
                    : 'No price data',
                formattedMarketCap: marketCap
                    ? formatBalance(marketCap, { decimals: 10, symbol: 'PAS' })
                    : 'No market cap data',
                formattedVolume: volume
                    ? formatBalance(volume, { decimals: 10, symbol: 'PAS' })
                    : 'No volume data',
                rawPrice: price?.toString() || 'null',
                rawMarketCap: marketCap?.toString() || 'null',
                rawVolume: volume?.toString() || 'null',
                success: true,
                queryType: 'comprehensive',
                // Store serializable debug info
                resultInfo: {
                    price: {
                        hasData: priceResult.data !== undefined,
                        dataType: typeof priceResult.data,
                        dataValue: priceResult.data?.toString() || 'null'
                    },
                    marketCap: {
                        hasData: marketCapResult.data !== undefined,
                        dataType: typeof marketCapResult.data,
                        dataValue: marketCapResult.data?.toString() || 'null'
                    },
                    volume: {
                        hasData: volumeResult.data !== undefined,
                        dataType: typeof volumeResult.data,
                        dataValue: volumeResult.data?.toString() || 'null'
                    }
                }
            });

        } catch (err) {
            console.error('Error querying oracle:', err);
            setError(`Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
        } finally {
            setIsQuerying(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Oracle Price Data</span>
                </CardTitle>
                <CardDescription>
                    Query live price feeds from the oracle contract
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Token Address Input */}
                <div className="space-y-2">
                    <label htmlFor="token-address" className="text-sm font-medium">
                        Token Address (optional)
                    </label>
                    <Input
                        id="token-address"
                        placeholder="Enter token address or leave blank for dummy token"
                        value={tokenAddress}
                        onChange={(e) => setTokenAddress(e.target.value)}
                        className="font-mono text-sm"
                    />
                    <div className="text-xs text-gray-500 space-y-1">
                        <p>💡 Leave blank to use the dummy token with sample data</p>
                        <p className="font-mono bg-gray-50 p-1 rounded">
                            Dummy: {dummyTokenAddress.slice(0, 20)}...
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        onClick={handleGetPrice}
                        disabled={isQuerying || !oracleContract}
                        className="flex items-center justify-center space-x-2 flex-1"
                    >
                        {isQuerying ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                            <DollarSign className="h-4 w-4" />
                        )}
                        <span>Get Price Only</span>
                    </Button>

                    <Button
                        onClick={handleGetMarketData}
                        disabled={isQuerying || !oracleContract}
                        variant="outline"
                        className="flex items-center justify-center space-x-2 flex-1"
                    >
                        {isQuerying ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                            <Search className="h-4 w-4" />
                        )}
                        <span>Get All Market Data</span>
                    </Button>
                </div>

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

                        {!oracleContract && (
                            <div className="flex items-center space-x-2 text-xs text-amber-600">
                                <AlertCircle className="h-3 w-3" />
                                <span>Make sure your wallet is connected and contract is deployed</span>
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

                {/* Results Display */}
                {queryResult && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Query Results</h3>
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {queryResult.queryType === 'comprehensive' ? 'Full Market Data' : 'Price Only'}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Price Card */}
                            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Token Price</div>
                                    <DollarSign className="h-4 w-4 text-blue-500" />
                                </div>
                                <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                    {queryResult.formattedPrice}
                                </div>
                                <div className="text-xs text-blue-500 dark:text-blue-300 font-mono mt-1">
                                    Raw: {queryResult.rawPrice}
                                </div>
                            </div>

                            {/* Market Cap Card */}
                            {queryResult.queryType === 'comprehensive' && (
                                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm text-green-600 dark:text-green-400 font-medium">Market Cap</div>
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                    </div>
                                    <div className="text-lg font-bold text-green-900 dark:text-green-100">
                                        {queryResult.formattedMarketCap}
                                    </div>
                                    <div className="text-xs text-green-500 dark:text-green-300 font-mono mt-1">
                                        Raw: {queryResult.rawMarketCap}
                                    </div>
                                </div>
                            )}

                            {/* Volume Card */}
                            {queryResult.queryType === 'comprehensive' && (
                                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">24h Volume</div>
                                        <RefreshCw className="h-4 w-4 text-purple-500" />
                                    </div>
                                    <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                        {queryResult.formattedVolume}
                                    </div>
                                    <div className="text-xs text-purple-500 dark:text-purple-300 font-mono mt-1">
                                        Raw: {queryResult.rawVolume}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Additional Info */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                <div>✅ Query executed successfully</div>
                                <div>🔍 Token: {tokenAddress.trim() || dummyTokenAddress}</div>
                                <div>⏱️ Network: Pop Testnet</div>
                            </div>
                        </div>

                        {/* Raw JSON for debugging */}
                        <details className="mt-4">
                            <summary className="text-sm font-medium cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                                🔧 Raw Response Data (for developers)
                            </summary>
                            <div className="mt-2 space-y-2">
                                <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs border">
                                    <div className="font-semibold mb-2">Serializable Debug Info:</div>
                                    <pre className="overflow-x-auto">
                                        {JSON.stringify(queryResult.resultInfo || queryResult, null, 2)}
                                    </pre>
                                </div>
                                <div className="text-xs text-gray-500">
                                    💡 BigInt values are converted to strings for display. Raw values contain the actual BigInt data.
                                </div>
                            </div>
                        </details>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}