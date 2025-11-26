// src/components/token/token-manager.tsx

'use client';

import { useState } from 'react';
import { useContract, useContractTx } from 'typink';
import type { TokenContractApi } from '@/lib/contracts/token';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Users, Plus, Minus, TrendingUp, TrendingDown, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { LabelWithHelp } from '@/components/ui/field-help';

interface ManagementState {
    type: 'idle' | 'pending' | 'success' | 'error';
    message?: string;
    operation?: string;
}

export function TokenManager() {
    const { contract: tokenContract } = useContract<TokenContractApi>('token');

    // Form states
    const [recipient, setRecipient] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [spender, setSpender] = useState<string>('');
    const [allowanceAmount, setAllowanceAmount] = useState<string>('');
    const [mintAmount, setMintAmount] = useState<string>('');
    const [burnAmount, setBurnAmount] = useState<string>('');
    const [mintRecipient, setMintRecipient] = useState<string>('');
    const [burnTarget, setBurnTarget] = useState<string>('');
    const [operationType, setOperationType] = useState<'transfer' | 'approve' | 'mint' | 'burn'>('transfer');
    const [managementState, setManagementState] = useState<ManagementState>({ type: 'idle' });

    // Contract transactions
    const transferTx = useContractTx(tokenContract, 'psp22Transfer');
    const approveTx = useContractTx(tokenContract, 'psp22Approve');
    const mintTx = useContractTx(tokenContract, 'psp22MintableMint');
    const mintToTx = useContractTx(tokenContract, 'mintTo');
    const burnTx = useContractTx(tokenContract, 'psp22BurnableBurn');
    const burnFromTx = useContractTx(tokenContract, 'burnFrom');

    const resetForm = () => {
        setRecipient('');
        setAmount('');
        setSpender('');
        setAllowanceAmount('');
        setMintAmount('');
        setBurnAmount('');
        setMintRecipient('');
        setBurnTarget('');
        setManagementState({ type: 'idle' });
    };

    const validateAmount = (amount: string): bigint | null => {
        const num = parseFloat(amount);
        if (isNaN(num) || num <= 0) {
            return null;
        }
        return BigInt(Math.floor(num * 10 ** 12));
    };

    const validateAddress = (address: string): boolean => {
        return address.trim().length > 0;
    };

    const handleTransfer = async () => {
        if (!tokenContract || !recipient.trim() || !amount.trim()) {
            setManagementState({
                type: 'error',
                message: 'Please enter valid recipient and amount',
                operation: 'transfer'
            });
            return;
        }

        const amountInTokens = validateAmount(amount);
        if (!amountInTokens || !validateAddress(recipient)) {
            setManagementState({
                type: 'error',
                message: 'Invalid amount or recipient address',
                operation: 'transfer'
            });
            return;
        }

        setManagementState({
            type: 'pending',
            message: `Transferring ${amount} tokens to ${recipient.slice(0, 8)}...`,
            operation: 'transfer'
        });

        try {
            await transferTx.signAndSend({
                args: [recipient.trim() as `0x${string}`, amountInTokens, new Uint8Array(0)],
                callback: (progress) => {
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        if (progress.dispatchError) {
                            setManagementState({
                                type: 'error',
                                message: 'Transfer failed',
                                operation: 'transfer'
                            });
                        } else {
                            setManagementState({
                                type: 'success',
                                message: `Successfully transferred ${amount} tokens`,
                                operation: 'transfer'
                            });
                            setRecipient('');
                            setAmount('');
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Transfer error:', err);
            setManagementState({
                type: 'error',
                message: `Transfer failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
                operation: 'transfer'
            });
        }
    };

    const handleApprove = async () => {
        if (!tokenContract || !spender.trim() || !allowanceAmount.trim()) {
            setManagementState({
                type: 'error',
                message: 'Please enter valid spender and amount',
                operation: 'approve'
            });
            return;
        }

        const amountInTokens = validateAmount(allowanceAmount);
        if (!amountInTokens || !validateAddress(spender)) {
            setManagementState({
                type: 'error',
                message: 'Invalid amount or spender address',
                operation: 'approve'
            });
            return;
        }

        setManagementState({
            type: 'pending',
            message: `Approving ${allowanceAmount} tokens for ${spender.slice(0, 8)}...`,
            operation: 'approve'
        });

        try {
            await approveTx.signAndSend({
                args: [spender.trim() as `0x${string}`, amountInTokens],
                callback: (progress) => {
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        if (progress.dispatchError) {
                            setManagementState({
                                type: 'error',
                                message: 'Approval failed',
                                operation: 'approve'
                            });
                        } else {
                            setManagementState({
                                type: 'success',
                                message: `Successfully approved ${allowanceAmount} tokens`,
                                operation: 'approve'
                            });
                            setSpender('');
                            setAllowanceAmount('');
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Approve error:', err);
            setManagementState({
                type: 'error',
                message: `Approval failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
                operation: 'approve'
            });
        }
    };

    const handleMint = async () => {
        if (!tokenContract || !mintAmount.trim()) {
            setManagementState({
                type: 'error',
                message: 'Please enter valid mint amount',
                operation: 'mint'
            });
            return;
        }

        const amountInTokens = validateAmount(mintAmount);
        if (!amountInTokens) {
            setManagementState({
                type: 'error',
                message: 'Invalid mint amount',
                operation: 'mint'
            });
            return;
        }

        setManagementState({
            type: 'pending',
            message: mintRecipient.trim()
                ? `Minting ${mintAmount} tokens to ${mintRecipient.slice(0, 8)}...`
                : `Minting ${mintAmount} tokens to your account...`,
            operation: 'mint'
        });

        try {
            if (mintRecipient.trim()) {
                await mintToTx.signAndSend({
                    args: [mintRecipient.trim() as `0x${string}`, amountInTokens],
                    callback: (progress) => {
                        if (progress.status.type === 'BestChainBlockIncluded') {
                            if (progress.dispatchError) {
                                setManagementState({
                                    type: 'error',
                                    message: 'Mint failed',
                                    operation: 'mint'
                                });
                            } else {
                                setManagementState({
                                    type: 'success',
                                    message: `Successfully minted ${mintAmount} tokens`,
                                    operation: 'mint'
                                });
                                setMintAmount('');
                                setMintRecipient('');
                            }
                        }
                    }
                });
            } else {
                await mintTx.signAndSend({
                    args: [amountInTokens],
                    callback: (progress) => {
                        if (progress.status.type === 'BestChainBlockIncluded') {
                            if (progress.dispatchError) {
                                setManagementState({
                                    type: 'error',
                                    message: 'Mint failed',
                                    operation: 'mint'
                                });
                            } else {
                                setManagementState({
                                    type: 'success',
                                    message: `Successfully minted ${mintAmount} tokens`,
                                    operation: 'mint'
                                });
                                setMintAmount('');
                            }
                        }
                    }
                });
            }
        } catch (err) {
            console.error('Mint error:', err);
            setManagementState({
                type: 'error',
                message: `Mint failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
                operation: 'mint'
            });
        }
    };

    const handleBurn = async () => {
        if (!tokenContract || !burnAmount.trim()) {
            setManagementState({
                type: 'error',
                message: 'Please enter valid burn amount',
                operation: 'burn'
            });
            return;
        }

        const amountInTokens = validateAmount(burnAmount);
        if (!amountInTokens) {
            setManagementState({
                type: 'error',
                message: 'Invalid burn amount',
                operation: 'burn'
            });
            return;
        }

        setManagementState({
            type: 'pending',
            message: burnTarget.trim()
                ? `Burning ${burnAmount} tokens from ${burnTarget.slice(0, 8)}...`
                : `Burning ${burnAmount} tokens from your account...`,
            operation: 'burn'
        });

        try {
            if (burnTarget.trim()) {
                await burnFromTx.signAndSend({
                    args: [burnTarget.trim() as `0x${string}`, amountInTokens],
                    callback: (progress) => {
                        if (progress.status.type === 'BestChainBlockIncluded') {
                            if (progress.dispatchError) {
                                setManagementState({
                                    type: 'error',
                                    message: 'Burn failed',
                                    operation: 'burn'
                                });
                            } else {
                                setManagementState({
                                    type: 'success',
                                    message: `Successfully burned ${burnAmount} tokens`,
                                    operation: 'burn'
                                });
                                setBurnAmount('');
                                setBurnTarget('');
                            }
                        }
                    }
                });
            } else {
                await burnTx.signAndSend({
                    args: [amountInTokens],
                    callback: (progress) => {
                        if (progress.status.type === 'BestChainBlockIncluded') {
                            if (progress.dispatchError) {
                                setManagementState({
                                    type: 'error',
                                    message: 'Burn failed',
                                    operation: 'burn'
                                });
                            } else {
                                setManagementState({
                                    type: 'success',
                                    message: `Successfully burned ${burnAmount} tokens`,
                                    operation: 'burn'
                                });
                                setBurnAmount('');
                            }
                        }
                    }
                });
            }
        } catch (err) {
            console.error('Burn error:', err);
            setManagementState({
                type: 'error',
                message: `Burn failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
                operation: 'burn'
            });
        }
    };

    const executeOperation = () => {
        switch (operationType) {
            case 'transfer':
                return handleTransfer();
            case 'approve':
                return handleApprove();
            case 'mint':
                return handleMint();
            case 'burn':
                return handleBurn();
        }
    };

    const isLoading = transferTx.inBestBlockProgress || approveTx.inBestBlockProgress ||
        mintTx.inBestBlockProgress || mintToTx.inBestBlockProgress ||
        burnTx.inBestBlockProgress || burnFromTx.inBestBlockProgress;

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
                    <Send className="h-5 w-5" />
                    <span>Token Operations</span>
                </CardTitle>
                <CardDescription>
                    Transfer, approve, mint, and burn tokens (requires appropriate permissions)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Operation Type Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-medium">Operation Type</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { value: 'transfer', label: 'Transfer', icon: Send, color: 'blue' },
                            { value: 'approve', label: 'Approve', icon: Users, color: 'green' },
                            { value: 'mint', label: 'Mint', icon: Plus, color: 'purple' },
                            { value: 'burn', label: 'Burn', icon: Minus, color: 'red' }
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
                                        setOperationType(e.target.value as any);
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

                {/* Transfer Form */}
                {operationType === 'transfer' && (
                    <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 flex items-center space-x-2">
                            <Send className="h-4 w-4" />
                            <span>Transfer Tokens</span>
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <LabelWithHelp
                                    htmlFor="recipient"
                                    helpText="The recipient address (H160 format: 0x...) that will receive the tokens. This can be any valid account address on the network. The tokens will be transferred from your account to this address. Make sure the recipient address is correct as transfers are irreversible."
                                >
                                    Recipient Address *
                                </LabelWithHelp>
                                <Input
                                    id="recipient"
                                    placeholder="Enter recipient address"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    className="font-mono text-sm"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <LabelWithHelp
                                    htmlFor="amount"
                                    helpText="The amount of W3PI tokens to transfer. Enter the amount as a decimal number (e.g., 100.5 for 100.5 tokens). The token has 12 decimals, so 1 token = 1,000,000,000,000 (10^12) base units. Make sure you have sufficient balance in your account to cover the transfer."
                                >
                                    Amount (tokens) *
                                </LabelWithHelp>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.000001"
                                    min="0"
                                    placeholder="0.000000"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleTransfer}
                            disabled={!tokenContract || !recipient.trim() || !amount.trim() || isLoading}
                            className="w-full"
                        >
                            {isLoading && managementState.operation === 'transfer' ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Send className="h-4 w-4 mr-2" />
                            )}
                            Transfer Tokens
                        </Button>
                    </div>
                )}

                {/* Approve Form */}
                {operationType === 'approve' && (
                    <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>Approve Allowance</span>
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <LabelWithHelp
                                    htmlFor="spender"
                                    helpText="The spender address (H160 format: 0x...) that will be allowed to spend your tokens. This is typically a contract address (like DEX, Portfolio, or Staking contracts) that needs permission to transfer tokens on your behalf. The spender can transfer up to the allowance amount you set."
                                >
                                    Spender Address *
                                </LabelWithHelp>
                                <Input
                                    id="spender"
                                    placeholder="Enter spender address"
                                    value={spender}
                                    onChange={(e) => setSpender(e.target.value)}
                                    className="font-mono text-sm"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <LabelWithHelp
                                    htmlFor="allowanceAmount"
                                    helpText="The maximum amount of tokens the spender can transfer from your account. Enter as a decimal number (e.g., 1000 for 1,000 tokens). The spender can transfer tokens up to this amount without requiring additional approvals. Set to 0 to revoke an existing allowance. This is useful for DeFi protocols that need to move tokens on your behalf."
                                >
                                    Allowance Amount (tokens) *
                                </LabelWithHelp>
                                <Input
                                    id="allowanceAmount"
                                    type="number"
                                    step="0.000001"
                                    min="0"
                                    placeholder="0.000000"
                                    value={allowanceAmount}
                                    onChange={(e) => setAllowanceAmount(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleApprove}
                            disabled={!tokenContract || !spender.trim() || !allowanceAmount.trim() || isLoading}
                            className="w-full"
                        >
                            {isLoading && managementState.operation === 'approve' ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Users className="h-4 w-4 mr-2" />
                            )}
                            Approve Allowance
                        </Button>
                    </div>
                )}

                {/* Mint Form */}
                {operationType === 'mint' && (
                    <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-200 flex items-center space-x-2">
                            <Plus className="h-4 w-4" />
                            <span>Mint Tokens</span>
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <LabelWithHelp
                                    htmlFor="mintAmount"
                                    helpText="The amount of new W3PI tokens to mint (create). Enter as a decimal number (e.g., 1000 for 1,000 tokens). Minting increases the total supply of tokens. Only accounts with minting permissions (typically the Portfolio contract or admin) can mint tokens. Minting is used when users deposit assets into portfolios."
                                >
                                    Amount (tokens) *
                                </LabelWithHelp>
                                <Input
                                    id="mintAmount"
                                    type="number"
                                    step="0.000001"
                                    min="0"
                                    placeholder="0.000000"
                                    value={mintAmount}
                                    onChange={(e) => setMintAmount(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <LabelWithHelp
                                    htmlFor="mintRecipient"
                                    helpText="Optional recipient address (H160 format: 0x...) for the minted tokens. If left empty, tokens will be minted to your account. If specified, tokens will be minted directly to this address. This is useful for minting tokens to specific accounts or contracts."
                                >
                                    Recipient Address (optional)
                                </LabelWithHelp>
                                <Input
                                    id="mintRecipient"
                                    placeholder="Leave empty to mint to your account"
                                    value={mintRecipient}
                                    onChange={(e) => setMintRecipient(e.target.value)}
                                    className="font-mono text-sm"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleMint}
                            disabled={!tokenContract || !mintAmount.trim() || isLoading}
                            className="w-full"
                        >
                            {isLoading && managementState.operation === 'mint' ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Plus className="h-4 w-4 mr-2" />
                            )}
                            Mint Tokens
                        </Button>
                    </div>
                )}

                {/* Burn Form */}
                {operationType === 'burn' && (
                    <div className="space-y-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 flex items-center space-x-2">
                            <Minus className="h-4 w-4" />
                            <span>Burn Tokens</span>
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <LabelWithHelp
                                    htmlFor="burnAmount"
                                    helpText="The amount of W3PI tokens to burn (destroy). Enter as a decimal number (e.g., 100 for 100 tokens). Burning permanently removes tokens from circulation, reducing the total supply. Only accounts with burning permissions (typically the Portfolio contract or admin) can burn tokens. Burning is used when users withdraw assets from portfolios."
                                >
                                    Amount (tokens) *
                                </LabelWithHelp>
                                <Input
                                    id="burnAmount"
                                    type="number"
                                    step="0.000001"
                                    min="0"
                                    placeholder="0.000000"
                                    value={burnAmount}
                                    onChange={(e) => setBurnAmount(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <LabelWithHelp
                                    htmlFor="burnTarget"
                                    helpText="Optional target address (H160 format: 0x...) to burn tokens from. If left empty, tokens will be burned from your account. If specified, tokens will be burned from this address. You must have permission to burn from the target address (typically requires being the owner or having a burn allowance)."
                                >
                                    Target Address (optional)
                                </LabelWithHelp>
                                <Input
                                    id="burnTarget"
                                    placeholder="Leave empty to burn from your account"
                                    value={burnTarget}
                                    onChange={(e) => setBurnTarget(e.target.value)}
                                    className="font-mono text-sm"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleBurn}
                            disabled={!tokenContract || !burnAmount.trim() || isLoading}
                            variant="destructive"
                            className="w-full"
                        >
                            {isLoading && managementState.operation === 'burn' ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Minus className="h-4 w-4 mr-2" />
                            )}
                            Burn Tokens
                        </Button>
                    </div>
                )}

                {/* Clear Form Button */}
                {(recipient || amount || spender || allowanceAmount || mintAmount || burnAmount || mintRecipient || burnTarget) && (
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
                <div className="space-y-3">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Token Contract:</span>
                                <span className={`flex items-center space-x-2 ${tokenContract ? 'text-green-600' : 'text-red-600'}`}>
                                    <div className={`w-2 h-2 rounded-full ${tokenContract ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <span>{tokenContract ? 'Connected' : 'Not Available'}</span>
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

                        {!tokenContract && (
                            <div className="flex items-center space-x-2 text-xs text-amber-600 mt-3">
                                <AlertCircle className="h-3 w-3" />
                                <span>Make sure your wallet is connected and token contract is deployed</span>
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="text-xs text-amber-800 dark:text-amber-200">
                            <div className="font-medium mb-1">⚡ Permission Requirements:</div>
                            <div className="space-y-1">
                                <div>• <strong>Transfer/Approve:</strong> Available to all token holders</div>
                                <div>• <strong>Mint:</strong> Requires authorized minter role or owner</div>
                                <div>• <strong>Burn:</strong> Requires authorized burner role or owner for burnFrom</div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}