// src/components/registry/registry-token-viewer.tsx

'use client';

import { useState } from 'react';
import { useContract } from 'typink';
import { ContractId } from '@/contracts/deployments';
import type { RegistryContractApi } from '@/contracts/types/registry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Package, TrendingUp, DollarSign, Layers, RefreshCw, AlertCircle } from 'lucide-react';

export function RegistryTokenViewer() {
    const { contract: registryContract } = useContract<RegistryContractApi>(ContractId.REGISTRY);
    const [tokenId, setTokenId] = useState<string>('');
    const [queryType, setQueryType] = useState<'enriched' | 'basic' | 'count'>('enriched');
    const [isQuerying, setIsQuerying] = useState(false);
    const [queryResult, setQueryResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGetEnrichedData = async () => {
        if (!registryContract || !tokenId.trim()) {
            setError('Please enter a valid token ID');
            return;
        }

        setIsQuerying(true);
        setError(null);
        setQueryResult(null);

        try {
            const tokenIdNum = parseInt(tokenId);
            if (isNaN(tokenIdNum) || tokenIdNum <= 0) {
                setError('Token ID must be a positive number');
                return;
            }

            const result = await registryContract.query.getTokenData(tokenIdNum);
            console.log('Enriched token data result:', result);

            // Handle Result<T, E> type from Rust
            let data: any = null;
            if (result.data) {
                if ('isOk' in result.data && result.data.isOk) {
                    data = result.data.value;
                } else if ('isErr' in result.data && result.data.isErr) {
                    setError('Contract returned an error');
                    return;
                } else {
                    data = result.data;
                }
            }

            console.log('Extracted data:', data);
            console.log('Data type:', typeof data);
            console.log('Data keys:', data ? Object.keys(data) : 'null');

            if (data && typeof data === 'object') {
                // Create a clean object with proper string conversions
                console.log('data', data);
                const cleanData = {
                    tokenContract: (data as any).tokenContract?.address() || '',
                    oracleContract: (data as any).oracleContract?.address() || '',
                    balance: (data as any).balance?.toString() || '0',
                    weightInvestment: Number((data as any).weightInvestment) || 0,
                    tier: Number((data as any).tier) || 0,
                    marketCap: (data as any).marketCap?.toString() || '0',
                    marketVolume: (data as any).marketVolume?.toString() || '0',
                    price: (data as any).price?.toString() || '0'
                };

                console.log('Clean data:', cleanData);

                setQueryResult({
                    type: 'enriched',
                    data: cleanData,
                    tokenId: tokenIdNum,
                    success: true
                });
            } else {
                setError('Token not found or no data available');
            }
        } catch (err) {
            console.error('Error querying enriched token data:', err);
            setError(`Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
        } finally {
            setIsQuerying(false);
        }
    };

    const handleGetBasicData = async () => {
        if (!registryContract || !tokenId.trim()) {
            setError('Please enter a valid token ID');
            return;
        }

        setIsQuerying(true);
        setError(null);
        setQueryResult(null);

        try {
            const tokenIdNum = parseInt(tokenId);
            if (isNaN(tokenIdNum) || tokenIdNum <= 0) {
                setError('Token ID must be a positive number');
                return;
            }

            const result = await registryContract.query.getBasicTokenData(tokenIdNum);
            console.log('Basic token data result:', result);

            // Handle Result<T, E> type from Rust
            let data: any = null;
            if (result.data) {
                if ('isOk' in result.data && result.data.isOk) {
                    data = result.data.value;
                } else if ('isErr' in result.data && result.data.isErr) {
                    setError('Contract returned an error');
                    return;
                } else {
                    data = result.data;
                }
            }

            if (data && typeof data === 'object') {
                // Create a clean object with proper string conversions
                const cleanData = {
                    tokenContract: (data as any).tokenContract?.address() || '',
                    oracleContract: (data as any).oracleContract?.address() || '',
                    balance: (data as any).balance?.toString() || '0',
                    weightInvestment: Number((data as any).weightInvestment) || 0,
                    tier: Number((data as any).tier) || 0
                };

                setQueryResult({
                    type: 'basic',
                    data: cleanData,
                    tokenId: tokenIdNum,
                    success: true
                });
            } else {
                setError('Token not found');
            }
        } catch (err) {
            console.error('Error querying basic token data:', err);
            setError(`Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
        } finally {
            setIsQuerying(false);
        }
    };

    const handleGetTokenCount = async () => {
        if (!registryContract) {
            setError('Registry contract not available');
            return;
        }

        setIsQuerying(true);
        setError(null);
        setQueryResult(null);

        try {
            const result = await registryContract.query.getTokenCount();
            console.log('Token count result:', result);

            setQueryResult({
                type: 'count',
                count: result.data || 0,
                success: true
            });
        } catch (err) {
            console.error('Error querying token count:', err);
            setError(`Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
        } finally {
            setIsQuerying(false);
        }
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 8)}...${address.slice(-8)}`;
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Registry Token Data</span>
                </CardTitle>
                <CardDescription>
                    Query registered token information and portfolio data
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Query Type Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-medium">Query Type</label>
                    <div className="flex flex-wrap gap-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name="queryType"
                                value="enriched"
                                checked={queryType === 'enriched'}
                                onChange={(e) => setQueryType(e.target.value as 'enriched')}
                                className="text-primary focus:ring-primary"
                            />
                            <span className="text-sm">Enriched Data (with Oracle)</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name="queryType"
                                value="basic"
                                checked={queryType === 'basic'}
                                onChange={(e) => setQueryType(e.target.value as 'basic')}
                                className="text-primary focus:ring-primary"
                            />
                            <span className="text-sm">Basic Data Only</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name="queryType"
                                value="count"
                                checked={queryType === 'count'}
                                onChange={(e) => setQueryType(e.target.value as 'count')}
                                className="text-primary focus:ring-primary"
                            />
                            <span className="text-sm">Token Count</span>
                        </label>
                    </div>
                </div>

                {/* Token ID Input (for individual queries) */}
                {queryType !== 'count' && (
                    <div className="space-y-2">
                        <label htmlFor="tokenId" className="text-sm font-medium">
                            Token ID
                        </label>
                        <Input
                            id="tokenId"
                            type="number"
                            min="1"
                            placeholder="Enter token ID (e.g., 1, 2, 3...)"
                            value={tokenId}
                            onChange={(e) => setTokenId(e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                            Enter the ID of the token you want to query
                        </p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                    {queryType === 'enriched' && (
                        <Button
                            onClick={handleGetEnrichedData}
                            disabled={isQuerying || !registryContract || !tokenId.trim()}
                            className="flex items-center justify-center space-x-2"
                        >
                            {isQuerying ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <TrendingUp className="h-4 w-4" />
                            )}
                            <span>Get Enriched Token Data</span>
                        </Button>
                    )}

                    {queryType === 'basic' && (
                        <Button
                            onClick={handleGetBasicData}
                            disabled={isQuerying || !registryContract || !tokenId.trim()}
                            variant="outline"
                            className="flex items-center justify-center space-x-2"
                        >
                            {isQuerying ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <Package className="h-4 w-4" />
                            )}
                            <span>Get Basic Token Data</span>
                        </Button>
                    )}

                    {queryType === 'count' && (
                        <Button
                            onClick={handleGetTokenCount}
                            disabled={isQuerying || !registryContract}
                            variant="secondary"
                            className="flex items-center justify-center space-x-2"
                        >
                            {isQuerying ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                            <span>Get Total Token Count</span>
                        </Button>
                    )}
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
                                {queryResult.type === 'enriched' ? 'Enriched Data' :
                                    queryResult.type === 'basic' ? 'Basic Data' : 'Token Count'}
                            </div>
                        </div>

                        {/* Token Count Result */}
                        {queryResult.type === 'count' && (
                            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                                        {queryResult.count}
                                    </div>
                                    <div className="text-sm text-purple-600 dark:text-purple-400">
                                        Total Registered Tokens
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Basic Token Data */}
                        {queryResult.type === 'basic' && queryResult.data && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">Token Contract</div>
                                        <div className="text-xs font-mono text-blue-900 dark:text-blue-100 break-all">
                                            {queryResult.data.tokenContract}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
                                        <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-2">Oracle Contract</div>
                                        <div className="text-xs font-mono text-green-900 dark:text-green-100 break-all">
                                            {queryResult.data.oracleContract}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                                        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Balance</div>
                                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                            {queryResult.data.balance && queryResult.data.balance !== '0' ?
                                                `${(Number(queryResult.data.balance) / 10 ** 10).toFixed(4)} PAS` :
                                                '0 PAS'
                                            }
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                                        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Weight Investment</div>
                                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                            {queryResult.data.weightInvestment || 0}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                                        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Tier</div>
                                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                            {queryResult.data.tier || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Enriched Token Data */}
                        {queryResult.type === 'enriched' && queryResult.data && (
                            <div className="space-y-4">
                                {/* Contract Addresses */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">Token Contract</div>
                                        <div className="text-xs font-mono text-blue-900 dark:text-blue-100 break-all">
                                            {queryResult.data.tokenContract}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
                                        <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-2">Oracle Contract</div>
                                        <div className="text-xs font-mono text-green-900 dark:text-green-100 break-all">
                                            {queryResult.data.oracleContract}
                                        </div>
                                    </div>
                                </div>

                                {/* Portfolio Data */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Balance</div>
                                            <DollarSign className="h-4 w-4 text-yellow-500" />
                                        </div>
                                        <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                                            {queryResult.data.balance && queryResult.data.balance !== '0' ?
                                                `${(Number(queryResult.data.balance) / 10 ** 10).toFixed(4)} PAS` :
                                                '0 PAS'
                                            }
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Weight Investment</div>
                                            <TrendingUp className="h-4 w-4 text-purple-500" />
                                        </div>
                                        <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                            {queryResult.data.weightInvestment || 0}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Tier</div>
                                            <Layers className="h-4 w-4 text-indigo-500" />
                                        </div>
                                        <div className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
                                            {queryResult.data.tier || 0}
                                        </div>
                                    </div>
                                </div>

                                {/* Market Data from Oracle */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                        <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-2">Live Price</div>
                                        <div className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                                            {queryResult.data.price && queryResult.data.price !== '0' ?
                                                `${(Number(queryResult.data.price) / 10 ** 10).toFixed(4)} PAS` :
                                                'No price data'
                                            }
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-lg border border-teal-200 dark:border-teal-800">
                                        <div className="text-sm text-teal-600 dark:text-teal-400 font-medium mb-2">Market Cap</div>
                                        <div className="text-lg font-bold text-teal-900 dark:text-teal-100">
                                            {queryResult.data.marketCap && queryResult.data.marketCap !== '0' ?
                                                `${(Number(queryResult.data.marketCap) / 10 ** 10).toFixed(2)} PAS` :
                                                'No market cap data'
                                            }
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                                        <div className="text-sm text-cyan-600 dark:text-cyan-400 font-medium mb-2">24h Volume</div>
                                        <div className="text-lg font-bold text-cyan-900 dark:text-cyan-100">
                                            {queryResult.data.marketVolume && queryResult.data.marketVolume !== '0' ?
                                                `${(Number(queryResult.data.marketVolume) / 10 ** 10).toFixed(2)} PAS` :
                                                'No volume data'
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Additional Info */}
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                <div>✅ Query executed successfully</div>
                                {queryResult.tokenId && <div>🏷️ Token ID: {queryResult.tokenId}</div>}
                                <div>⏱️ Network: Pop Testnet</div>
                                {queryResult.type === 'enriched' && (
                                    <div>📊 Data includes live oracle prices and market data</div>
                                )}
                            </div>
                        </div>

                        {/* Raw JSON for debugging */}
                        <details className="mt-4">
                            <summary className="text-sm font-medium cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                                🔧 Raw Response Data (for developers)
                            </summary>
                            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs border">
                                <pre className="overflow-x-auto">
                                    {JSON.stringify(queryResult, (key, value) =>
                                        typeof value === 'bigint' ? value.toString() : value, 2
                                    )}
                                </pre>
                            </div>
                        </details>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}