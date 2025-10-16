// src/components/registry/registry-role-manager.tsx

'use client';

import { useState } from 'react';
import { useContract, useContractTx } from 'typink';
import type { RegistryContractApi } from '@/lib/contracts/registry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, UserPlus, UserMinus, Crown, Package, RefreshCw, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface RoleManagementState {
    type: 'idle' | 'pending' | 'success' | 'error';
    message?: string;
    operation?: string;
}

type Role = 'TokenManager' | 'TokenUpdater';

export function RegistryRoleManager() {
    const { contract: registryContract } = useContract<RegistryContractApi>('registry');

    // Form states
    const [selectedRole, setSelectedRole] = useState<Role>('TokenManager');
    const [targetAccount, setTargetAccount] = useState<string>('');
    const [operationType, setOperationType] = useState<'grant' | 'revoke'>('grant');
    const [managementState, setManagementState] = useState<RoleManagementState>({ type: 'idle' });

    // Contract transactions
    const grantRoleTx = useContractTx(registryContract, 'grantRole');
    const revokeRoleTx = useContractTx(registryContract, 'revokeRole');

    const resetForm = () => {
        setTargetAccount('');
        setManagementState({ type: 'idle' });
    };

    const validateAddress = (address: string): boolean => {
        return address.trim().length > 0 && address.trim() !== '0'.repeat(48);
    };

    const handleGrantRole = async () => {
        if (!registryContract || !targetAccount.trim()) {
            setManagementState({
                type: 'error',
                message: 'Please enter a valid account address',
                operation: 'grant'
            });
            return;
        }

        if (!validateAddress(targetAccount)) {
            setManagementState({
                type: 'error',
                message: 'Account address must be valid and non-zero',
                operation: 'grant'
            });
            return;
        }

        setManagementState({
            type: 'pending',
            message: `Granting ${selectedRole} role to account...`,
            operation: 'grant'
        });

        try {
            await grantRoleTx.signAndSend({
                args: [selectedRole, targetAccount.trim() as `0x${string}`],
                callback: (progress) => {
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        if (progress.dispatchError) {
                            let errorMessage = 'Transaction failed';
                            if (progress.dispatchError.type === 'Module') {
                                const decoded = progress.dispatchError.value;
                                errorMessage = `Module error: ${decoded.index}:${decoded.error}`;
                            } else {
                                errorMessage = `Error: ${progress.dispatchError.type}`;
                            }

                            setManagementState({
                                type: 'error',
                                message: errorMessage,
                                operation: 'grant'
                            });
                        } else {
                            setManagementState({
                                type: 'success',
                                message: `Successfully granted ${selectedRole} role to account`,
                                operation: 'grant'
                            });

                            // Reset form on success
                            setTargetAccount('');
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Grant role error:', err);
            let errorMessage = 'Unknown error occurred';

            if (err instanceof Error) {
                if (err.message.includes('Unauthorized')) {
                    errorMessage = 'You do not have permission to grant roles (owner only)';
                } else if (err.message.includes('ZeroAddress')) {
                    errorMessage = 'Account address cannot be zero';
                } else {
                    errorMessage = err.message;
                }
            }

            setManagementState({
                type: 'error',
                message: errorMessage,
                operation: 'grant'
            });
        }
    };

    const handleRevokeRole = async () => {
        if (!registryContract || !targetAccount.trim()) {
            setManagementState({
                type: 'error',
                message: 'Please enter a valid account address',
                operation: 'revoke'
            });
            return;
        }

        if (!validateAddress(targetAccount)) {
            setManagementState({
                type: 'error',
                message: 'Account address must be valid and non-zero',
                operation: 'revoke'
            });
            return;
        }

        setManagementState({
            type: 'pending',
            message: `Revoking ${selectedRole} role from account...`,
            operation: 'revoke'
        });

        try {
            await revokeRoleTx.signAndSend({
                args: [selectedRole, targetAccount.trim() as `0x${string}`],
                callback: (progress) => {
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        if (progress.dispatchError) {
                            let errorMessage = 'Transaction failed';
                            if (progress.dispatchError.type === 'Module') {
                                const decoded = progress.dispatchError.value;
                                errorMessage = `Module error: ${decoded.index}:${decoded.error}`;
                            } else {
                                errorMessage = `Error: ${progress.dispatchError.type}`;
                            }

                            setManagementState({
                                type: 'error',
                                message: errorMessage,
                                operation: 'revoke'
                            });
                        } else {
                            setManagementState({
                                type: 'success',
                                message: `Successfully revoked ${selectedRole} role from account`,
                                operation: 'revoke'
                            });

                            // Reset form on success
                            setTargetAccount('');
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Revoke role error:', err);
            let errorMessage = 'Unknown error occurred';

            if (err instanceof Error) {
                if (err.message.includes('Unauthorized')) {
                    errorMessage = 'You do not have permission to revoke roles (owner only)';
                } else {
                    errorMessage = err.message;
                }
            }

            setManagementState({
                type: 'error',
                message: errorMessage,
                operation: 'revoke'
            });
        }
    };

    const executeOperation = () => {
        if (operationType === 'grant') {
            return handleGrantRole();
        } else {
            return handleRevokeRole();
        }
    };

    const isLoading = grantRoleTx.inBestBlockProgress || revokeRoleTx.inBestBlockProgress;

    const getStateIcon = () => {
        switch (managementState.type) {
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
                    <Shield className="h-5 w-5" />
                    <span>Role Management</span>
                </CardTitle>
                <CardDescription>
                    Grant or revoke registry permissions (owner only)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Operation Type Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-medium">Operation Type</label>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { value: 'grant', label: 'Grant Role', icon: UserPlus, color: 'green' },
                            { value: 'revoke', label: 'Revoke Role', icon: UserMinus, color: 'red' }
                        ].map(({ value, label, icon: Icon, color }) => (
                            <label key={value} className={`flex items-center space-x-2 cursor-pointer p-3 rounded-lg border transition-all ${operationType === value
                                ? `border-${color}-300 bg-${color}-50 dark:bg-${color}-900/20`
                                : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                                }`}>
                                <input
                                    type="radio"
                                    name="operationType"
                                    value={value}
                                    checked={operationType === value}
                                    onChange={(e) => {
                                        setOperationType(e.target.value as 'grant' | 'revoke');
                                        setManagementState({ type: 'idle' });
                                    }}
                                    className="text-primary focus:ring-primary"
                                    disabled={isLoading}
                                />
                                <Icon className="h-4 w-4" />
                                <span className="text-sm font-medium">{label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Role Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-medium">Role to {operationType === 'grant' ? 'Grant' : 'Revoke'}</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            { value: 'TokenManager', label: 'Token Manager', icon: Package, description: 'Can add and remove tokens' },
                            { value: 'TokenUpdater', label: 'Token Updater', icon: RefreshCw, description: 'Can update token data' }
                        ].map(({ value, label, icon: Icon, description }) => (
                            <label key={value} className={`flex items-start space-x-3 cursor-pointer p-3 rounded-lg border transition-all ${selectedRole === value
                                ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700'
                                : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                                }`}>
                                <input
                                    type="radio"
                                    name="selectedRole"
                                    value={value}
                                    checked={selectedRole === value}
                                    onChange={(e) => {
                                        setSelectedRole(e.target.value as Role);
                                        setManagementState({ type: 'idle' });
                                    }}
                                    className="text-primary focus:ring-primary mt-1"
                                    disabled={isLoading}
                                />
                                <Icon className="h-4 w-4 mt-0.5" />
                                <div>
                                    <div className="text-sm font-medium">{label}</div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">{description}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Target Account Input */}
                <div className="space-y-2">
                    <label htmlFor="targetAccount" className="text-sm font-medium">
                        Target Account Address *
                    </label>
                    <Input
                        id="targetAccount"
                        placeholder="Enter account address (e.g., 5GrwvaEF5zXb26...)"
                        value={targetAccount}
                        onChange={(e) => {
                            setTargetAccount(e.target.value);
                            setManagementState({ type: 'idle' });
                        }}
                        className="font-mono text-sm"
                        disabled={isLoading}
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        The account that will {operationType === 'grant' ? 'receive' : 'lose'} the {selectedRole} role
                    </p>
                </div>

                {/* Status Message */}
                {managementState.type !== 'idle' && (
                    <div className={`p-4 rounded-lg border flex items-start space-x-3 ${managementState.type === 'pending'
                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                        : managementState.type === 'success'
                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                            : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                        }`}>
                        {getStateIcon()}
                        <div className="flex-1">
                            <p className={`text-sm font-medium ${managementState.type === 'pending'
                                ? 'text-blue-800 dark:text-blue-200'
                                : managementState.type === 'success'
                                    ? 'text-green-800 dark:text-green-200'
                                    : 'text-red-800 dark:text-red-200'
                                }`}>
                                {managementState.message}
                            </p>
                        </div>
                    </div>
                )}

                {/* Action Button */}
                <Button
                    onClick={executeOperation}
                    disabled={!registryContract || !targetAccount.trim() || isLoading}
                    className="w-full"
                    variant={operationType === 'revoke' ? 'destructive' : 'default'}
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : operationType === 'grant' ? (
                        <UserPlus className="h-4 w-4 mr-2" />
                    ) : (
                        <UserMinus className="h-4 w-4 mr-2" />
                    )}
                    {isLoading
                        ? `${operationType === 'grant' ? 'Granting' : 'Revoking'} Role...`
                        : `${operationType === 'grant' ? 'Grant' : 'Revoke'} ${selectedRole} Role`
                    }
                </Button>

                {/* Clear Form Button */}
                {targetAccount && (
                    <div className="flex justify-center">
                        <Button
                            onClick={resetForm}
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                        >
                            Clear Form
                        </Button>
                    </div>
                )}

                {/* Role Definitions */}
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-3 flex items-center space-x-2">
                        <Crown className="h-4 w-4" />
                        <span>Role Definitions</span>
                    </h4>
                    <div className="space-y-2 text-xs text-amber-700 dark:text-amber-300">
                        <div><strong>TokenManager:</strong> Can add new tokens to the registry and remove existing tokens</div>
                        <div><strong>TokenUpdater:</strong> Can update balance, weight investment, and tier data for existing tokens</div>
                        <div className="pt-2 border-t border-amber-200 dark:border-amber-700">
                            <strong>Important:</strong> Only the contract owner can grant or revoke roles. The owner always has all permissions regardless of role assignments.
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