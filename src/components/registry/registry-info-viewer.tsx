// src/components/registry/registry-info-viewer.tsx

'use client';

import { useState, useEffect } from 'react';
import { useContract, useContractQuery, useTypink } from 'typink';
import type { RegistryContractApi } from '@/lib/contracts/registry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, User, Package, CheckCircle, RefreshCw, AlertCircle, Shield, Crown, Users, Loader2, XCircle } from 'lucide-react';
import { RegistryTokensList } from './registry-tokens-list';

interface InfoState {
    type: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
}

interface RegistryInfo {
    owner: string;
    tokenCount: number;
    lastUpdated: Date;
}

interface RoleCheckResult {
    account: string;
    roles: {
        tokenManager: boolean;
        tokenUpdater: boolean;
        isOwner: boolean;
    };
}

export function RegistryInfoViewer() {
    const { contract: registryContract } = useContract<RegistryContractApi>('registry');
    const { connectedAccount } = useTypink();

    // State management
    const [checkAccountAddress, setCheckAccountAddress] = useState<string>('');
    const [roleCheckResult, setRoleCheckResult] = useState<RoleCheckResult | null>(null);
    const [roleState, setRoleState] = useState<InfoState>({ type: 'idle' });

    // Use Typink hooks for contract queries
    const ownerQuery = useContractQuery({
        contract: registryContract,
        fn: 'getOwner'
    });
    
    const tokenCountQuery = useContractQuery({
        contract: registryContract,
        fn: 'getTokenCount'
    });

    const loadRegistryInfo = async () => {
        await Promise.all([
            ownerQuery.refresh(),
            tokenCountQuery.refresh()
        ]);
    };

    const checkAccountRoles = async (accountAddress?: string) => {
        if (!registryContract) {
            setRoleState({ type: 'error', message: 'Registry contract not available' });
            return;
        }

        const targetAccount = accountAddress || connectedAccount?.address;
        if (!targetAccount) {
            setRoleState({ type: 'error', message: 'No account address provided' });
            return;
        }

        setRoleState({ type: 'loading', message: `Checking roles for account...` });

        try {
            // Check roles in parallel
            const [tokenManagerResult, tokenUpdaterResult] = await Promise.all([
                registryContract.query.hasRole('TokenManager', targetAccount as `0x${string}`),
                registryContract.query.hasRole('TokenUpdater', targetAccount as `0x${string}`)
            ]);

            const owner = ownerQuery.data || '';
            const isOwner = owner.toLowerCase() === targetAccount.toLowerCase();

            const roles = {
                tokenManager: tokenManagerResult.data || false,
                tokenUpdater: tokenUpdaterResult.data || false,
                isOwner
            };

            setRoleCheckResult({
                account: targetAccount,
                roles
            });

            const roleCount = Object.values(roles).filter(Boolean).length;
            setRoleState({
                type: 'success',
                message: `Role check complete • ${roleCount} permission${roleCount !== 1 ? 's' : ''} found`
            });

        } catch (err) {
            console.error('Error checking roles:', err);
            setRoleState({
                type: 'error',
                message: `Failed to check roles: ${err instanceof Error ? err.message : 'Unknown error'}`
            });
        }
    };

    // Auto-check current account roles when account changes
    useEffect(() => {
        if (registryContract && connectedAccount?.address) {
            checkAccountRoles();
        }
    }, [registryContract, connectedAccount?.address]);

    // Extract data from Typink query results
    const ownerData = ownerQuery.data;
    const tokenCountData = tokenCountQuery.data;
    const registryInfo = ownerData && tokenCountData ? {
        owner: ownerData,
        tokenCount: Number(tokenCountData),
        lastUpdated: new Date()
    } : null;

    const formatAddress = (address: string) => {
        return `${address.slice(0, 8)}...${address.slice(-8)}`;
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const getStateIcon = (state: InfoState) => {
        switch (state.type) {
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
        <div className="space-y-6">
            {/* Registry General Info */}
            <Card className="w-full shadow-none mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Info className="h-5 w-5" />
                        <span>Registry Information</span>
                    </CardTitle>
                    <CardDescription>
                        Contract details, statistics, and operational status
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Status Message */}
                    {(ownerQuery.isLoading || tokenCountQuery.isLoading) && (
                        <div className="p-4 rounded-lg border flex items-start space-x-3 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                    Loading registry information...
                                </p>
                            </div>
                        </div>
                    )}

                    {(ownerQuery.error || tokenCountQuery.error) && (
                        <div className="p-4 rounded-lg border flex items-start space-x-3 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                    {ownerQuery.error?.message || tokenCountQuery.error?.message || 'Failed to load registry information'}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <Button
                            onClick={loadRegistryInfo}
                            disabled={!registryContract || ownerQuery.isLoading || tokenCountQuery.isLoading}
                            variant="outline"
                            size="sm"
                        >
                            {(ownerQuery.isLoading || tokenCountQuery.isLoading) ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Refresh Info
                        </Button>
                        {registryInfo?.lastUpdated && (
                            <span className="text-xs text-gray-500">
                                Last updated: {formatTime(registryInfo.lastUpdated)}
                            </span>
                        )}
                    </div>

                    {registryInfo && (
                        <>
                            {/* Contract Owner */}
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-200 flex items-center space-x-2 mb-3">
                                    <Crown className="h-4 w-4" />
                                    <span>Contract Owner</span>
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Owner Address:</span>
                                        <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                                            {formatAddress(registryInfo.owner)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                        Full: {registryInfo.owner}
                                    </div>
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded text-xs text-purple-700 dark:text-purple-300">
                                        <div className="font-medium mb-1">Owner Privileges:</div>
                                        <div className="space-y-1 text-xs">
                                            <div>• Grant and revoke all roles</div>
                                            <div>• Add and remove tokens</div>
                                            <div>• Update token data</div>
                                            <div>• Full contract administration</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Token Statistics */}
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 flex items-center space-x-2 mb-3">
                                    <Package className="h-4 w-4" />
                                    <span>Token Registry Statistics</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-blue-900 dark:text-blue-100">
                                            {registryInfo.tokenCount}
                                        </div>
                                        <div className="text-sm text-blue-600 dark:text-blue-400">
                                            Total Registered Tokens
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                            {registryInfo.tokenCount > 0 ? `1-${registryInfo.tokenCount}` : 'None'}
                                        </div>
                                        <div className="text-sm text-blue-600 dark:text-blue-400">
                                            Available Token ID Range
                                        </div>
                                    </div>
                                </div>
                                {registryInfo.tokenCount === 0 && (
                                    <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900/30 rounded text-xs text-blue-700 dark:text-blue-300">
                                        📝 No tokens have been registered yet. Use the Token Management tab to add tokens to the registry.
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Registered Tokens List */}
                    {registryInfo && registryInfo.tokenCount > 0 && (
                        <div className="mt-6">
                            <RegistryTokensList />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Role & Permissions Checker */}
            <Card className="w-full shadow-none mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Shield className="h-5 w-5" />
                        <span>Role & Permissions</span>
                    </CardTitle>
                    <CardDescription>
                        Check account roles and permissions for registry operations
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Status Message */}
                    {roleState.type !== 'idle' && (
                        <div className={`p-4 rounded-lg border flex items-start space-x-3 ${roleState.type === 'loading'
                                ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                                : roleState.type === 'success'
                                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                            }`}>
                            {getStateIcon(roleState)}
                            <div className="flex-1">
                                <p className={`text-sm font-medium ${roleState.type === 'loading'
                                        ? 'text-blue-800 dark:text-blue-200'
                                        : roleState.type === 'success'
                                            ? 'text-green-800 dark:text-green-200'
                                            : 'text-red-800 dark:text-red-200'
                                    }`}>
                                    {roleState.message}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Current Account Roles */}
                    {roleCheckResult && roleCheckResult.account === connectedAccount?.address && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center space-x-2 mb-3">
                                <User className="h-4 w-4" />
                                <span>Your Current Permissions</span>
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Account:</span>
                                    <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                                        {connectedAccount?.name} ({formatAddress(roleCheckResult.account)})
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className={`p-3 rounded-lg border text-center ${roleCheckResult.roles.isOwner
                                            ? 'bg-purple-100 border-purple-300 dark:bg-purple-900/30 dark:border-purple-700'
                                            : 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600'
                                        }`}>
                                        <Crown className={`h-5 w-5 mx-auto mb-1 ${roleCheckResult.roles.isOwner ? 'text-purple-600' : 'text-gray-400'
                                            }`} />
                                        <div className={`text-xs font-medium ${roleCheckResult.roles.isOwner ? 'text-purple-800 dark:text-purple-200' : 'text-gray-600 dark:text-gray-400'
                                            }`}>
                                            Owner
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {roleCheckResult.roles.isOwner ? 'Full access' : 'No access'}
                                        </div>
                                    </div>
                                    <div className={`p-3 rounded-lg border text-center ${roleCheckResult.roles.tokenManager
                                            ? 'bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700'
                                            : 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600'
                                        }`}>
                                        <Package className={`h-5 w-5 mx-auto mb-1 ${roleCheckResult.roles.tokenManager ? 'text-blue-600' : 'text-gray-400'
                                            }`} />
                                        <div className={`text-xs font-medium ${roleCheckResult.roles.tokenManager ? 'text-blue-800 dark:text-blue-200' : 'text-gray-600 dark:text-gray-400'
                                            }`}>
                                            Token Manager
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {roleCheckResult.roles.tokenManager ? 'Add/Remove tokens' : 'Cannot manage tokens'}
                                        </div>
                                    </div>
                                    <div className={`p-3 rounded-lg border text-center ${roleCheckResult.roles.tokenUpdater
                                            ? 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700'
                                            : 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600'
                                        }`}>
                                        <RefreshCw className={`h-5 w-5 mx-auto mb-1 ${roleCheckResult.roles.tokenUpdater ? 'text-green-600' : 'text-gray-400'
                                            }`} />
                                        <div className={`text-xs font-medium ${roleCheckResult.roles.tokenUpdater ? 'text-green-800 dark:text-green-200' : 'text-gray-600 dark:text-gray-400'
                                            }`}>
                                            Token Updater
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {roleCheckResult.roles.tokenUpdater ? 'Update token data' : 'Cannot update tokens'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Custom Account Role Check */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="checkAccountAddress" className="text-sm font-medium flex items-center space-x-2">
                                <Users className="h-4 w-4" />
                                <span>Check Another Account's Roles</span>
                            </label>
                            <Input
                                id="checkAccountAddress"
                                placeholder="Enter account address to check roles"
                                value={checkAccountAddress}
                                onChange={(e) => setCheckAccountAddress(e.target.value)}
                                className="font-mono text-sm"
                                disabled={roleState.type === 'loading'}
                            />
                            <p className="text-xs text-gray-500">
                                Enter any account address to check their registry permissions
                            </p>
                        </div>

                        <Button
                            onClick={() => checkAccountRoles(checkAccountAddress.trim())}
                            disabled={!registryContract || !checkAccountAddress.trim() || roleState.type === 'loading'}
                            variant="outline"
                            className="w-full"
                        >
                            {roleState.type === 'loading' ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Shield className="h-4 w-4 mr-2" />
                            )}
                            Check Account Roles
                        </Button>

                        {/* Custom Account Results */}
                        {roleCheckResult && roleCheckResult.account !== connectedAccount?.address && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
                                    Role Check Results
                                </h4>
                                <div className="space-y-3">
                                    <div className="text-xs text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded">
                                        Account: {roleCheckResult.account}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div className={`p-2 rounded text-center ${roleCheckResult.roles.isOwner ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            Owner: {roleCheckResult.roles.isOwner ? '✅' : '❌'}
                                        </div>
                                        <div className={`p-2 rounded text-center ${roleCheckResult.roles.tokenManager ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            Token Manager: {roleCheckResult.roles.tokenManager ? '✅' : '❌'}
                                        </div>
                                        <div className={`p-2 rounded text-center ${roleCheckResult.roles.tokenUpdater ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            Token Updater: {roleCheckResult.roles.tokenUpdater ? '✅' : '❌'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Role Definitions */}
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-3">
                            Registry Role Definitions
                        </h4>
                        <div className="space-y-2 text-xs text-amber-700 dark:text-amber-300">
                            <div><strong>Owner:</strong> Contract deployer with full administrative privileges</div>
                            <div><strong>TokenManager:</strong> Can add new tokens and remove existing tokens</div>
                            <div><strong>TokenUpdater:</strong> Can update balance, weight, and tier data for existing tokens</div>
                            <div className="pt-2 border-t border-amber-200 dark:border-amber-700">
                                <strong>Note:</strong> Owner always has all permissions regardless of role assignments
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
        </div>
    );
}