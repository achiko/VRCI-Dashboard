// src/components/registry/registry-token-viewer.tsx

'use client';

import { useState } from 'react';
import { useContract } from 'typink';
import type { RegistryContractApi } from '@/lib/contracts/registry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Package, TrendingUp, DollarSign, Layers, RefreshCw, AlertCircle, CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';

interface QueryState {
    type: 'idle' | 'pending' | 'success' | 'error';
    message?: string;
    data?: any;
}

export function RegistryTokenViewer() {
    const { contract: registryContract } = useContract<RegistryContractApi>('registry');
    const [tokenId, setTokenId] = useState<string>('');
    const [contractAddress, setContractAddress] = useState<string>('');
    const [queryType, setQueryType] = useState<'enriched' | 'basic' | 'count' | 'exists' | 'byContract'>('enriched');
    const [queryState, setQueryState] = useState<QueryState>({ type: 'idle' });

    const resetQuery = () => {
        setQueryState({ type: 'idle' });
    };

    const validateTokenId = (id: string): number | null => {
        const tokenIdNum = parseInt(id);
        if (isNaN(tokenIdNum) || tokenIdNum <= 0) {
            return null;
        }
        return tokenIdNum;
    };

    const handleGetEnrichedData = async () => {
        if (!registryContract || !tokenId.trim()) {
            setQueryState({ type: 'error', message: 'Please enter a valid token ID' });
            return;
        }

        const tokenIdNum = validateTokenId(tokenId);
        if (!tokenIdNum) {
            setQueryState({ type: 'error', message: 'Token ID must be a positive number' });
            return;
        }

        setQueryState({ type: 'pending', message: 'Fetching enriched token data with live oracle prices...' });

        try {
            const result = await registryContract.query.getTokenData(tokenIdNum);

            let data: any = null;
            if (result.data) {
                if ('isOk' in result.data && result.data.isOk) {
                    data = result.data.value;
                } else if ('isErr' in result.data && result.data.isErr) {
                    const errorValue = result.data.err;
                    let errorMessage = 'Unknown error';
                    if (typeof errorValue === 'object' && errorValue !== null) {
                        if ('TokenNotFound' in errorValue) errorMessage = 'Token not found in registry';
                        else if ('Unauthorized' in errorValue) errorMessage = 'Unauthorized access';
                        else if ('UnauthorizedRole' in errorValue) errorMessage = 'Insufficient role permissions';
                    }
                    setQueryState({ type: 'error', message: errorMessage });
                    return;
                } else {
                    data = result.data;
                }
            }

            if (data && typeof data === 'object') {
                console.log('Tier*', data)
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

                // Check grace period status
                try {
                    const [endTimeResult, remainingResult, expiredResult] = await Promise.all([
                        registryContract.query.getGracePeriodEndTime(tokenIdNum),
                        registryContract.query.getGracePeriodRemaining(tokenIdNum),
                        registryContract.query.isGracePeriodExpired(tokenIdNum)
                    ]);

                    const graceInfo = {
                        endTime: endTimeResult.data || null,
                        remaining: remainingResult.data || null,
                        expired: expiredResult.data || false
                    };

                    setQueryState({
                        type: 'success',
                        message: `Successfully fetched enriched data for token ID ${tokenIdNum}`,
                        data: {
                            type: 'enriched',
                            data: cleanData,
                            tokenId: tokenIdNum,
                            graceInfo
                        }
                    });
                } catch {
                    // Fallback without grace info if query fails
                    setQueryState({
                        type: 'success',
                        message: `Successfully fetched enriched data for token ID ${tokenIdNum}`,
                        data: { type: 'enriched', data: cleanData, tokenId: tokenIdNum }
                    });
                }
            } else {
                setQueryState({ type: 'error', message: 'Token not found or no data available' });
            }
        } catch (err) {
            console.error('Error querying enriched token data:', err);
            setQueryState({
                type: 'error',
                message: `Failed to fetch enriched data: ${err instanceof Error ? err.message : 'Unknown error'}`
            });
        }
    };

    const handleGetBasicData = async () => {
        if (!registryContract || !tokenId.trim()) {
            setQueryState({ type: 'error', message: 'Please enter a valid token ID' });
            return;
        }

        const tokenIdNum = validateTokenId(tokenId);
        if (!tokenIdNum) {
            setQueryState({ type: 'error', message: 'Token ID must be a positive number' });
            return;
        }

        setQueryState({ type: 'pending', message: 'Fetching basic token data...' });

        try {
            const result = await registryContract.query.getBasicTokenData(tokenIdNum);

            let data: any = null;
            if (result.data) {
                if ('isOk' in result.data && result.data.isOk) {
                    data = result.data.value;
                } else if ('isErr' in result.data && result.data.isErr) {
                    const errorValue = result.data.err;
                    let errorMessage = 'Unknown error';
                    if (typeof errorValue === 'object' && errorValue !== null) {
                        if ('TokenNotFound' in errorValue) errorMessage = 'Token not found in registry';
                    }
                    setQueryState({ type: 'error', message: errorMessage });
                    return;
                } else {
                    data = result.data;
                }
            }

            if (data && typeof data === 'object') {
                const cleanData = {
                    tokenContract: (data as any).tokenContract?.address() || '',
                    oracleContract: (data as any).oracleContract?.address() || '',
                    balance: (data as any).balance?.toString() || '0',
                    weightInvestment: Number((data as any).weightInvestment) || 0,
                    tier: Number((data as any).tier) || 0
                };

                setQueryState({
                    type: 'success',
                    message: `Successfully fetched basic data for token ID ${tokenIdNum}`,
                    data: { type: 'basic', data: cleanData, tokenId: tokenIdNum }
                });
            } else {
                setQueryState({ type: 'error', message: 'Token not found' });
            }
        } catch (err) {
            console.error('Error querying basic token data:', err);
            setQueryState({
                type: 'error',
                message: `Failed to fetch basic data: ${err instanceof Error ? err.message : 'Unknown error'}`
            });
        }
    };

    const handleGetTokenCount = async () => {
        if (!registryContract) {
            setQueryState({ type: 'error', message: 'Registry contract not available' });
            return;
        }

        setQueryState({ type: 'pending', message: 'Fetching total token count...' });

        try {
            const result = await registryContract.query.getTokenCount();
            const count = result.data || 0;

            setQueryState({
                type: 'success',
                message: `Registry currently has ${count} registered token${count !== 1 ? 's' : ''}`,
                data: { type: 'count', count }
            });
        } catch (err) {
            console.error('Error querying token count:', err);
            setQueryState({
                type: 'error',
                message: `Failed to fetch token count: ${err instanceof Error ? err.message : 'Unknown error'}`
            });
        }
    };

    const handleCheckTokenExists = async () => {
        if (!registryContract || !tokenId.trim()) {
            setQueryState({ type: 'error', message: 'Please enter a valid token ID' });
            return;
        }

        const tokenIdNum = validateTokenId(tokenId);
        if (!tokenIdNum) {
            setQueryState({ type: 'error', message: 'Token ID must be a positive number' });
            return;
        }

        setQueryState({ type: 'pending', message: `Checking if token ID ${tokenIdNum} exists...` });

        try {
            const result = await registryContract.query.tokenExists(tokenIdNum);
            const exists = result.data || false;

            setQueryState({
                type: 'success',
                message: `Token ID ${tokenIdNum} ${exists ? 'exists' : 'does not exist'} in the registry`,
                data: { type: 'exists', exists, tokenId: tokenIdNum }
            });
        } catch (err) {
            console.error('Error checking token existence:', err);
            setQueryState({
                type: 'error',
                message: `Failed to check token existence: ${err instanceof Error ? err.message : 'Unknown error'}`
            });
        }
    };

    const handleGetTokenByContract = async () => {
        if (!registryContract || !contractAddress.trim()) {
            setQueryState({ type: 'error', message: 'Please enter a valid contract address' });
            return;
        }

        setQueryState({ type: 'pending', message: 'Searching for token by contract address...' });

        try {
            const result = await registryContract.query.getTokenIdByContract(contractAddress.trim() as `0x${string}`);
            const tokenId = result.data;

            if (tokenId !== null && tokenId !== undefined) {
                setQueryState({
                    type: 'success',
                    message: `Found token ID ${tokenId} for contract address`,
                    data: { type: 'byContract', tokenId, contractAddress: contractAddress.trim() }
                });
            } else {
                setQueryState({
                    type: 'success',
                    message: 'No token found for this contract address',
                    data: { type: 'byContract', tokenId: null, contractAddress: contractAddress.trim() }
                });
            }
        } catch (err) {
            console.error('Error querying token by contract:', err);
            setQueryState({
                type: 'error',
                message: `Failed to search by contract: ${err instanceof Error ? err.message : 'Unknown error'}`
            });
        }
    };

    const executeQuery = () => {
        switch (queryType) {
            case 'enriched':
                return handleGetEnrichedData();
            case 'basic':
                return handleGetBasicData();
            case 'count':
                return handleGetTokenCount();
            case 'exists':
                return handleCheckTokenExists();
            case 'byContract':
                return handleGetTokenByContract();
        }
    };

    const getStateIcon = () => {
        switch (queryState.type) {
            case 'pending':
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
                    <Package className="h-5 w-5" />
                    <span>Registry Token Query</span>
                </CardTitle>
                <CardDescription>
                    Query registered token information and portfolio data
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Query Type Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-medium">Query Type</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {[
                            { value: 'enriched', label: 'Enriched Data', icon: TrendingUp },
                            { value: 'basic', label: 'Basic Data', icon: Package },
                            { value: 'count', label: 'Token Count', icon: Search },
                            { value: 'exists', label: 'Check Exists', icon: CheckCircle },
                            { value: 'byContract', label: 'By Contract', icon: Search }
                        ].map(({ value, label, icon: Icon }) => (
                            <label key={value} className="flex items-center space-x-2 cursor-pointer p-2 rounded border hover:bg-gray-50 dark:hover:bg-gray-800">
                                <input
                                    type="radio"
                                    name="queryType"
                                    value={value}
                                    checked={queryType === value}
                                    onChange={(e) => {
                                        setQueryType(e.target.value as any);
                                        resetQuery();
                                    }}
                                    className="text-primary focus:ring-primary"
                                />
                                <Icon className="h-3 w-3" />
                                <span className="text-xs">{label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Input Fields */}
                <div className="space-y-4">
                    {(queryType !== 'count') && (
                        <div className="space-y-2">
                            {queryType === 'byContract' ? (
                                <>
                                    <label htmlFor="contractAddress" className="text-sm font-medium">
                                        Token Contract Address
                                    </label>
                                    <Input
                                        id="contractAddress"
                                        placeholder="Enter token contract address"
                                        value={contractAddress}
                                        onChange={(e) => {
                                            setContractAddress(e.target.value);
                                            resetQuery();
                                        }}
                                        className="font-mono text-sm"
                                        disabled={queryState.type === 'pending'}
                                    />
                                    <p className="text-xs text-gray-500">
                                        Find the token ID associated with this contract address
                                    </p>
                                </>
                            ) : (
                                <>
                                    <label htmlFor="tokenId" className="text-sm font-medium">
                                        Token ID
                                    </label>
                                    <Input
                                        id="tokenId"
                                        type="number"
                                        min="1"
                                        placeholder="Enter token ID (e.g., 1, 2, 3...)"
                                        value={tokenId}
                                        onChange={(e) => {
                                            setTokenId(e.target.value);
                                            resetQuery();
                                        }}
                                        disabled={queryState.type === 'pending'}
                                    />
                                    <p className="text-xs text-gray-500">
                                        {queryType === 'exists'
                                            ? 'Check if this token ID is registered'
                                            : 'Enter the ID of the token you want to query'
                                        }
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    {/* Query Button */}
                    <Button
                        onClick={executeQuery}
                        disabled={
                            queryState.type === 'pending' ||
                            !registryContract ||
                            (queryType !== 'count' && (
                                queryType === 'byContract'
                                    ? !contractAddress.trim()
                                    : !tokenId.trim()
                            ))
                        }
                        className="w-full"
                    >
                        {queryState.type === 'pending' ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Search className="h-4 w-4 mr-2" />
                        )}
                        {queryState.type === 'pending'
                            ? 'Querying...'
                            : {
                                enriched: 'Get Enriched Data',
                                basic: 'Get Basic Data',
                                count: 'Get Token Count',
                                exists: 'Check Token Exists',
                                byContract: 'Find by Contract'
                            }[queryType]
                        }
                    </Button>
                </div>

                {/* Status Message */}
                {queryState.type !== 'idle' && (
                    <div className={`p-4 rounded-lg border flex items-start space-x-3 ${queryState.type === 'pending'
                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                        : queryState.type === 'success'
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                            : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                        }`}>
                        {getStateIcon()}
                        <div className="flex-1">
                            <p className={`text-sm font-medium ${queryState.type === 'pending'
                                ? 'text-blue-800 dark:text-blue-200'
                                : queryState.type === 'success'
                                    ? 'text-green-800 dark:text-green-200'
                                    : 'text-red-800 dark:text-red-200'
                                }`}>
                                {queryState.message}
                            </p>
                        </div>
                    </div>
                )}

                {/* Results Display */}
                {queryState.type === 'success' && queryState.data && (
                    <div className="space-y-4">
                        {/* Token Count Result */}
                        {queryState.data.type === 'count' && (
                            <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-purple-900 dark:text-purple-100">
                                        {queryState.data.count}
                                    </div>
                                    <div className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                                        Total Registered Tokens
                                    </div>
                                    {queryState.data.count > 0 && (
                                        <div className="text-xs text-purple-500 dark:text-purple-400 mt-2">
                                            Valid Token IDs: 1 to {queryState.data.count}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Token Existence Result */}
                        {queryState.data.type === 'exists' && (
                            <div className={`p-4 rounded-lg border ${queryState.data.exists
                                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                                : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                                }`}>
                                <div className="flex items-center space-x-3">
                                    <CheckCircle className={`h-5 w-5 ${queryState.data.exists ? 'text-green-600' : 'text-gray-500'
                                        }`} />
                                    <div>
                                        <div className={`font-medium ${queryState.data.exists
                                            ? 'text-green-800 dark:text-green-200'
                                            : 'text-gray-700 dark:text-gray-300'
                                            }`}>
                                            Token ID {queryState.data.tokenId}: {queryState.data.exists ? 'EXISTS' : 'NOT FOUND'}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            {queryState.data.exists
                                                ? 'This token is registered and can be queried for data'
                                                : 'This token ID has not been registered yet'
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Token by Contract Result */}
                        {queryState.data.type === 'byContract' && (
                            <div className="space-y-3">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">Contract Address</div>
                                    <div className="text-xs font-mono text-blue-900 dark:text-blue-100 break-all">
                                        {queryState.data.contractAddress}
                                    </div>
                                </div>
                                {queryState.data.tokenId !== null ? (
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                        <div className="text-lg font-bold text-green-900 dark:text-green-100">
                                            Token ID: {queryState.data.tokenId}
                                        </div>
                                        <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                                            Found in registry
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                                        <div className="text-gray-700 dark:text-gray-300 font-medium">
                                            No Token Found
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            This contract address is not registered in the token registry
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Token Data Results (Basic and Enriched) */}
                        {(queryState.data.type === 'basic' || queryState.data.type === 'enriched') && queryState.data.data && (
                            <div className="space-y-4">
                                {/* Contract Addresses */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">Token Contract</div>
                                        <div className="text-xs font-mono text-blue-900 dark:text-blue-100 break-all">
                                            {queryState.data.data.tokenContract}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
                                        <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-2">Oracle Contract</div>
                                        <div className="text-xs font-mono text-green-900 dark:text-green-100 break-all">
                                            {queryState.data.data.oracleContract}
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
                                            {queryState.data.data.balance && queryState.data.data.balance !== '0' ?
                                                `${(Number(queryState.data.data.balance) / 10 ** 10).toFixed(4)} PAS` :
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
                                            {queryState.data.data.weightInvestment || 0}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Tier</div>
                                            <Layers className="h-4 w-4 text-indigo-500" />
                                        </div>
                                        <div className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
                                            {queryState.data.data.tier || 0}
                                        </div>
                                    </div>
                                </div>

                                {/* Market Data (Enriched only) */}
                                {queryState.data.type === 'enriched' && (
                                    <div className="space-y-3">
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Live Market Data (from Oracle)
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                                <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-2">Live Price</div>
                                                <div className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                                                    {queryState.data.data.price && queryState.data.data.price !== '0' ?
                                                        `${(Number(queryState.data.data.price) / 10 ** 10).toFixed(4)} PAS` :
                                                        'No price data'
                                                    }
                                                </div>
                                            </div>
                                            <div className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-lg border border-teal-200 dark:border-teal-800">
                                                <div className="text-sm text-teal-600 dark:text-teal-400 font-medium mb-2">Market Cap</div>
                                                <div className="text-lg font-bold text-teal-900 dark:text-teal-100">
                                                    {queryState.data.data.marketCap && queryState.data.data.marketCap !== '0' ?
                                                        `${(Number(queryState.data.data.marketCap) / 10 ** 10).toFixed(2)} PAS` :
                                                        'No market cap data'
                                                    }
                                                </div>
                                            </div>
                                            <div className="p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                                                <div className="text-sm text-cyan-600 dark:text-cyan-400 font-medium mb-2">24h Volume</div>
                                                <div className="text-lg font-bold text-cyan-900 dark:text-cyan-100">
                                                    {queryState.data.data.marketVolume && queryState.data.data.marketVolume !== '0' ?
                                                        `${(Number(queryState.data.data.marketVolume) / 10 ** 10).toFixed(2)} PAS` :
                                                        'No volume data'
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {queryState.data.graceInfo && (
                                    <div className="space-y-3">
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Grace Period Status
                                        </div>
                                        <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <Clock className="h-4 w-4 text-amber-600" />
                                                    <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                                        Grace Period
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    {queryState.data.graceInfo.remaining !== null && Number(queryState.data.graceInfo.remaining) > 0 ? (
                                                        <div className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                                            {Math.floor(Number(queryState.data.graceInfo.remaining) / (24 * 60 * 60 * 1000))}d {Math.floor((Number(queryState.data.graceInfo.remaining) % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))}h remaining
                                                        </div>
                                                    ) : queryState.data.graceInfo.expired ? (
                                                        <div className="text-sm font-medium text-red-600">
                                                            Grace period expired
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm font-medium text-gray-500">
                                                            No active grace period
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {queryState.data.graceInfo.endTime && (
                                                <div className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                                                    Ends: {new Date(Number(queryState.data.graceInfo.endTime)).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}   