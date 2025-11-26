// src/components/registry/registry-token-manager.tsx

'use client';

import { useState } from 'react';
import { useContract, useContractTx } from 'typink';
import type { RegistryContractApi } from '@/lib/contracts/registry';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddressInput } from '@/components/address-input.dedot';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, Package, DollarSign, TrendingUp, Layers, Trash2, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface ManagementState {
    type: 'idle' | 'pending' | 'success' | 'error';
    message?: string;
    operation?: string;
}

export function RegistryTokenManager() {
    const { contract: registryContract } = useContract<RegistryContractApi>('registry');

    // Form states
    const [tokenContract, setTokenContract] = useState<string>('');
    const [oracleContract, setOracleContract] = useState<string>('');
    const [updateTokenId, setUpdateTokenId] = useState<string>('');
    const [removeTokenId, setRemoveTokenId] = useState<string>('');
    const [balance, setBalance] = useState<string>('');
    const [weightInvestment, setWeightInvestment] = useState<string>('');
    const [tier, setTier] = useState<string>('');
    const [managementType, setManagementType] = useState<'add' | 'update' | 'remove'>('add');
    const [managementState, setManagementState] = useState<ManagementState>({ type: 'idle' });

    // Contract transactions
    const addTokenTx = useContractTx(registryContract, 'addToken');
    const updateTokenTx = useContractTx(registryContract, 'updateToken');
    const removeTokenTx = useContractTx(registryContract, 'removeToken');

    const resetForm = () => {
        setTokenContract('');
        setOracleContract('');
        setUpdateTokenId('');
        setRemoveTokenId('');
        setBalance('');
        setWeightInvestment('');
        setTier('');
        setManagementState({ type: 'idle' });
    };

    const validateTokenId = (id: string): number | null => {
        const tokenIdNum = parseInt(id);
        if (isNaN(tokenIdNum) || tokenIdNum <= 0) {
            return null;
        }
        return tokenIdNum;
    };

    const validateAddress = (address: string): boolean => {
        return address.trim().length > 0 && address.trim() !== '0'.repeat(48);
    };

    const handleAddToken = async () => {
        if (!registryContract || !tokenContract.trim() || !oracleContract.trim()) {
            setManagementState({
                type: 'error',
                message: 'Please enter valid token and oracle contract addresses',
                operation: 'add'
            });
            return;
        }

        if (!validateAddress(tokenContract) || !validateAddress(oracleContract)) {
            setManagementState({
                type: 'error',
                message: 'Contract addresses must be valid and non-zero',
                operation: 'add'
            });
            return;
        }

        setManagementState({
            type: 'pending',
            message: 'Adding new token to registry...',
            operation: 'add'
        });

        try {
            await addTokenTx.signAndSend({
                args: [tokenContract.trim() as `0x${string}`, oracleContract.trim() as `0x${string}`],
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
                                operation: 'add'
                            });
                        } else {
                            // Success - extract token ID from events if possible
                            const events = progress.events || [];
                            let newTokenId = null;

                            for (const event of events) {
                                if (event.event && 'TokenAdded' in event.event) {
                                    newTokenId = (event.event as any).TokenAdded?.token_id;
                                    break;
                                }
                            }

                            setManagementState({
                                type: 'success',
                                message: newTokenId
                                    ? `Token successfully added with ID: ${newTokenId}`
                                    : 'Token successfully added to registry',
                                operation: 'add'
                            });

                            // Reset form on success
                            setTokenContract('');
                            setOracleContract('');
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Add token error:', err);
            let errorMessage = 'Unknown error occurred';

            if (err instanceof Error) {
                if (err.message.includes('TokenAlreadyExists')) {
                    errorMessage = 'This token contract is already registered';
                } else if (err.message.includes('Unauthorized')) {
                    errorMessage = 'You do not have permission to add tokens';
                } else if (err.message.includes('ZeroAddress')) {
                    errorMessage = 'Contract addresses cannot be zero';
                } else {
                    errorMessage = err.message;
                }
            }

            setManagementState({
                type: 'error',
                message: errorMessage,
                operation: 'add'
            });
        }
    };

    const handleUpdateToken = async () => {
        if (!registryContract || !updateTokenId.trim() || !balance || !weightInvestment || !tier) {
            setManagementState({
                type: 'error',
                message: 'Please fill in all fields for token update',
                operation: 'update'
            });
            return;
        }

        const tokenIdNum = validateTokenId(updateTokenId);
        if (!tokenIdNum) {
            setManagementState({
                type: 'error',
                message: 'Token ID must be a positive number',
                operation: 'update'
            });
            return;
        }

        if (isNaN(Number(balance)) || Number(balance) < 0) {
            setManagementState({
                type: 'error',
                message: 'Balance must be a non-negative number',
                operation: 'update'
            });
            return;
        }

        if (isNaN(Number(weightInvestment)) || Number(weightInvestment) < 0 || Number(weightInvestment) > 10000) {
            setManagementState({
                type: 'error',
                message: 'Weight investment must be between 0 and 10000',
                operation: 'update'
            });
            return;
        }

        if (isNaN(Number(tier)) || Number(tier) < 0 || Number(tier) > 5) {
            setManagementState({
                type: 'error',
                message: 'Tier must be between 0 and 5',
                operation: 'update'
            });
            return;
        }

        setManagementState({
            type: 'pending',
            message: `Updating token ID ${tokenIdNum} data...`,
            operation: 'update'
        });

        try {
            const balanceInPlancks = BigInt(Math.floor(Number(balance) * 10 ** 10));
            const weightInvestmentNum = parseInt(weightInvestment);
            
            await updateTokenTx.signAndSend({
                args: [tokenIdNum, balanceInPlancks, weightInvestmentNum],
                callback: (progress) => {
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        if (progress.dispatchError) {
                            let errorMessage = 'Transaction failed';
                            if (progress.dispatchError.type === 'Module') {
                                const decoded = progress.dispatchError.value;
                                errorMessage = `Module error: ${decoded.index}:${decoded.error}`;
                            }

                            setManagementState({
                                type: 'error',
                                message: errorMessage,
                                operation: 'update'
                            });
                        } else {
                            setManagementState({
                                type: 'success',
                                message: `Token ID ${tokenIdNum} successfully updated`,
                                operation: 'update'
                            });

                            // Reset form on success
                            setUpdateTokenId('');
                            setBalance('');
                            setWeightInvestment('');
                            setTier('');
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Update token error:', err);
            let errorMessage = 'Unknown error occurred';

            if (err instanceof Error) {
                if (err.message.includes('TokenNotFound')) {
                    errorMessage = 'Token not found in registry';
                } else if (err.message.includes('Unauthorized')) {
                    errorMessage = 'You do not have permission to update tokens';
                } else if (err.message.includes('InvalidWeight')) {
                    errorMessage = 'Invalid weight investment value (must be ≤ 10000)';
                } else if (err.message.includes('InvalidTier')) {
                    errorMessage = 'Invalid tier value (must be ≤ 5)';
                } else {
                    errorMessage = err.message;
                }
            }

            setManagementState({
                type: 'error',
                message: errorMessage,
                operation: 'update'
            });
        }
    };

    const handleRemoveToken = async () => {
        if (!registryContract || !removeTokenId.trim()) {
            setManagementState({
                type: 'error',
                message: 'Please enter a valid token ID to remove',
                operation: 'remove'
            });
            return;
        }

        const tokenIdNum = validateTokenId(removeTokenId);
        if (!tokenIdNum) {
            setManagementState({
                type: 'error',
                message: 'Token ID must be a positive number',
                operation: 'remove'
            });
            return;
        }

        setManagementState({
            type: 'pending',
            message: `Removing token ID ${tokenIdNum} from registry...`,
            operation: 'remove'
        });

        try {
            await removeTokenTx.signAndSend({
                args: [tokenIdNum],
                callback: (progress) => {
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        if (progress.dispatchError) {
                            let errorMessage = 'Transaction failed';
                            if (progress.dispatchError.type === 'Module') {
                                const decoded = progress.dispatchError.value;
                                errorMessage = `Module error: ${decoded.index}:${decoded.error}`;
                            }

                            setManagementState({
                                type: 'error',
                                message: errorMessage,
                                operation: 'remove'
                            });
                        } else {
                            setManagementState({
                                type: 'success',
                                message: `Token ID ${tokenIdNum} successfully removed from registry`,
                                operation: 'remove'
                            });

                            // Reset form on success
                            setRemoveTokenId('');
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Remove token error:', err);
            let errorMessage = 'Unknown error occurred';

            if (err instanceof Error) {
                if (err.message.includes('TokenNotFound')) {
                    errorMessage = 'Token not found in registry';
                } else if (err.message.includes('Unauthorized')) {
                    errorMessage = 'You do not have permission to remove tokens';
                } else {
                    errorMessage = err.message;
                }
            }

            setManagementState({
                type: 'error',
                message: errorMessage,
                operation: 'remove'
            });
        }
    };

    const isLoading = addTokenTx.inBestBlockProgress || updateTokenTx.inBestBlockProgress || removeTokenTx.inBestBlockProgress;

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

    return (
        <Card className="w-full shadow-none mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Token Management</span>
                </CardTitle>
                <CardDescription>
                    Add new tokens, update existing data, or remove tokens (requires appropriate permissions)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Management Type Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-medium">Management Operation</label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { value: 'add', label: 'Add Token', icon: Plus, color: 'green' },
                            { value: 'update', label: 'Update Token', icon: Edit, color: 'blue' },
                            { value: 'remove', label: 'Remove Token', icon: Trash2, color: 'red' }
                        ].map(({ value, label, icon: Icon, color }) => (
                            <label key={value} className={`flex items-center space-x-2 cursor-pointer p-3 rounded-lg border transition-all ${managementType === value
                                ? `border-${color}-300 bg-${color}-50 dark:bg-${color}-900/20`
                                : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                                }`}>
                                <input
                                    type="radio"
                                    name="managementType"
                                    value={value}
                                    checked={managementType === value}
                                    onChange={(e) => {
                                        setManagementType(e.target.value as 'add' | 'update' | 'remove');
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

                {/* Add Token Form */}
                {managementType === 'add' && (
                    <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center space-x-2">
                            <Plus className="h-4 w-4" />
                            <span>Add New Token</span>
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="tokenContract" className="text-sm font-medium">
                                    Token Contract Address *
                                </label>
                                <AddressInput
                                    placeholder="Enter token contract address (e.g., 0x... or 5GrwvaEF5zXb26...)"
                                    value={tokenContract}
                                    onChange={setTokenContract}
                                    className="font-mono text-sm"
                                    disabled={isLoading}
                                    format="both"
                                    withIdentityLookup={false}
                                    withIdentitySearch={false}
                                />
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    The contract address of the token to be registered (hexadecimal or SS58 format)
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="oracleContract" className="text-sm font-medium">
                                    Oracle Contract Address *
                                </label>
                                <AddressInput
                                    placeholder="Enter oracle contract address (e.g., 0x... or 5GrwvaEF5zXb26...)"
                                    value={oracleContract}
                                    onChange={setOracleContract}
                                    className="font-mono text-sm"
                                    disabled={isLoading}
                                    format="both"
                                    withIdentityLookup={false}
                                    withIdentitySearch={false}
                                />
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    The oracle contract that provides price data for this token (hexadecimal or SS58 format)
                                </p>
                            </div>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded border border-green-300 dark:border-green-700">
                            <p className="text-xs text-green-800 dark:text-green-200">
                                📦 <strong>Add Token:</strong> Registers a new token with its oracle. Initial balance, weight, and tier will be set to 0 and can be updated later.
                            </p>
                        </div>
                        <Button
                            onClick={handleAddToken}
                            disabled={!registryContract || !tokenContract.trim() || !oracleContract.trim() || isLoading}
                            className="w-full"
                        >
                            {isLoading && managementState.operation === 'add' ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Plus className="h-4 w-4 mr-2" />
                            )}
                            {isLoading && managementState.operation === 'add' ? 'Adding Token...' : 'Add Token to Registry'}
                        </Button>
                    </div>
                )}

                {/* Update Token Form */}
                {managementType === 'update' && (
                    <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 flex items-center space-x-2">
                            <Edit className="h-4 w-4" />
                            <span>Update Token Data</span>
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="updateTokenId" className="text-sm font-medium">
                                    Token ID *
                                </label>
                                <Input
                                    id="updateTokenId"
                                    type="number"
                                    min="1"
                                    placeholder="Enter token ID to update"
                                    value={updateTokenId}
                                    onChange={(e) => setUpdateTokenId(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="balance" className="text-sm font-medium">
                                        Balance (PAS) *
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="balance"
                                            type="number"
                                            step="0.0001"
                                            min="0"
                                            placeholder="0.0000"
                                            value={balance}
                                            onChange={(e) => setBalance(e.target.value)}
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="weightInvestment" className="text-sm font-medium">
                                        Weight (0-10000) *
                                    </label>
                                    <div className="relative">
                                        <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="weightInvestment"
                                            type="number"
                                            min="0"
                                            max="10000"
                                            placeholder="0"
                                            value={weightInvestment}
                                            onChange={(e) => setWeightInvestment(e.target.value)}
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="tier" className="text-sm font-medium">
                                        Tier (0-5) *
                                    </label>
                                    <div className="relative">
                                        <Layers className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="tier"
                                            type="number"
                                            min="0"
                                            max="5"
                                            placeholder="0"
                                            value={tier}
                                            onChange={(e) => setTier(e.target.value)}
                                            className="pl-10"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Fill Options */}
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded border border-blue-300 dark:border-blue-700">
                            <div className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-2">Quick Fill Sample Data:</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <Button
                                    onClick={() => {
                                        setBalance('50.25');
                                        setWeightInvestment('1000');
                                        setTier('1');
                                    }}
                                    variant="outline"
                                    size="sm"
                                    disabled={isLoading}
                                    className="text-xs"
                                >
                                    Tier 1 (Small)
                                </Button>
                                <Button
                                    onClick={() => {
                                        setBalance('150.75');
                                        setWeightInvestment('2500');
                                        setTier('2');
                                    }}
                                    variant="outline"
                                    size="sm"
                                    disabled={isLoading}
                                    className="text-xs"
                                >
                                    Tier 2 (Medium)
                                </Button>
                                <Button
                                    onClick={() => {
                                        setBalance('500.00');
                                        setWeightInvestment('5000');
                                        setTier('3');
                                    }}
                                    variant="outline"
                                    size="sm"
                                    disabled={isLoading}
                                    className="text-xs"
                                >
                                    Tier 3 (Large)
                                </Button>
                            </div>
                        </div>

                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded border border-blue-300 dark:border-blue-700">
                            <p className="text-xs text-blue-800 dark:text-blue-200">
                                📝 <strong>Update Token:</strong> Modify portfolio data for an existing token. Weight represents investment allocation, tier indicates risk/priority level.
                            </p>
                        </div>
                        <Button
                            onClick={handleUpdateToken}
                            disabled={!registryContract || !updateTokenId || !balance || !weightInvestment || !tier || isLoading}
                            className="w-full"
                        >
                            {isLoading && managementState.operation === 'update' ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Edit className="h-4 w-4 mr-2" />
                            )}
                            {isLoading && managementState.operation === 'update' ? 'Updating Token...' : 'Update Token Data'}
                        </Button>
                    </div>
                )}

                {/* Remove Token Form */}
                {managementType === 'remove' && (
                    <div className="space-y-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 flex items-center space-x-2">
                            <Trash2 className="h-4 w-4" />
                            <span>Remove Token</span>
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="removeTokenId" className="text-sm font-medium">
                                    Token ID to Remove *
                                </label>
                                <Input
                                    id="removeTokenId"
                                    type="number"
                                    min="1"
                                    placeholder="Enter token ID to remove"
                                    value={removeTokenId}
                                    onChange={(e) => setRemoveTokenId(e.target.value)}
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    This will permanently remove the token from the registry
                                </p>
                            </div>
                        </div>
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded border border-red-300 dark:border-red-700">
                            <p className="text-xs text-red-800 dark:text-red-200">
                                ⚠️ <strong>Warning:</strong> This action will permanently remove the token and all its data from the registry. This cannot be undone.
                            </p>
                        </div>
                        <Button
                            onClick={handleRemoveToken}
                            disabled={!registryContract || !removeTokenId.trim() || isLoading}
                            variant="destructive"
                            className="w-full"
                        >
                            {isLoading && managementState.operation === 'remove' ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            {isLoading && managementState.operation === 'remove' ? 'Removing Token...' : 'Remove Token from Registry'}
                        </Button>
                    </div>
                )}

                {/* Clear Form Button */}
                {(tokenContract || oracleContract || updateTokenId || removeTokenId || balance || weightInvestment || tier) && (
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

                {/* Contract Status & Permissions */}
                <div className="space-y-4">
                    <Separator />
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
                            {isLoading && (
                                <div className="mt-2">
                                    <Progress value={33} className="w-full h-2" />
                                </div>
                            )}
                        </div>

                        {!registryContract && (
                            <div className="flex items-center space-x-2 text-xs text-amber-600 mt-3">
                                <AlertCircle className="h-3 w-3" />
                                <span>Make sure your wallet is connected and registry contract is deployed</span>
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="text-xs text-amber-800 dark:text-amber-200">
                            <div className="font-medium mb-1">⚡ Permission Requirements:</div>
                            <div className="space-y-1">
                                <div>• <strong>Add/Remove Tokens:</strong> Requires TokenManager role or contract owner</div>
                                <div>• <strong>Update Token Data:</strong> Requires TokenUpdater role or contract owner</div>
                                <div>• Unauthorized operations will fail with clear error messages</div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}