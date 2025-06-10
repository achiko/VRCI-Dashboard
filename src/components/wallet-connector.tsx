// src/components/wallet-connector.tsx

'use client';

import { useState, useEffect } from 'react';
import { useTypink, formatBalance, useBalances } from 'typink';
import { Wallet, LogOut, User, CheckCircle, ChevronDown, Copy, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

export function WalletConnector() {
    const {
        accounts,
        connectedAccount,
        setConnectedAccount,
        disconnect,
        signer,
        network,
        wallets,
        connectWallet,
        connectedWallet
    } = useTypink();

    // Get balances for all accounts
    const addresses = accounts?.map(account => account.address) || [];
    const balances = useBalances(addresses);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [justConnected, setJustConnected] = useState(false);

    // Format address for display
    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    // Auto-select first account when accounts become available
    useEffect(() => {
        if (accounts && accounts.length > 0 && !connectedAccount) {
            console.log('Auto-selecting first account:', accounts[0]);
            setConnectedAccount(accounts[0]);
        }
    }, [accounts, connectedAccount, setConnectedAccount]);

    // Show connection success feedback
    useEffect(() => {
        if (signer && connectedAccount && isConnecting) {
            console.log('Connection successful!');
            setJustConnected(true);
            setIsConnecting(false);
            setTimeout(() => setJustConnected(false), 3000); // Show success for 3 seconds
        }
    }, [signer, connectedAccount, isConnecting]);

    // Reset connecting state if connection fails
    useEffect(() => {
        if (!signer && isConnecting) {
            // If we're connecting but no signer after some time, reset
            const timeout = setTimeout(() => {
                console.log('Connection timeout, resetting...');
                setIsConnecting(false);
            }, 10000); // 10 second timeout

            return () => clearTimeout(timeout);
        }
    }, [signer, isConnecting]);

    const handleConnect = () => {
        setIsWalletModalOpen(true);
    };

    const handleWalletSelect = async (walletId: string) => {
        try {
            console.log('Connecting to wallet:', walletId);
            setIsConnecting(true);
            await connectWallet(walletId);
            setIsWalletModalOpen(false);

            // Don't set isConnecting to false here, let the useEffect handle it
            console.log('Wallet connection initiated...');
        } catch (err) {
            console.error('Failed to connect wallet:', err);
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            await disconnect();
            setIsDropdownOpen(false);
            setIsConnecting(false);
            setJustConnected(false);
        } catch (err) {
            console.error('Failed to disconnect wallet:', err);
        }
    };

    const handleAccountSwitch = (account: any) => {
        setConnectedAccount(account);
        setIsDropdownOpen(false);
    };

    const copyAddress = (address: string) => {
        navigator.clipboard.writeText(address);
        // You could add a toast notification here
    };

    

    // Show connect button when not connected
    if (!signer || !connectedAccount) {
        return (
            <>
                <Button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className={` ${isConnecting ? 'opacity-75 cursor-not-allowed' : ''
                        }`}
                >
                    <Wallet className="h-4 w-4" />
                    <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
                    {isConnecting && (
                        <div className="loading-spinner h-4 w-4" />
                    )}
                </Button>

                {/* Debug Info */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="absolute top-full left-0 mt-2 p-2 bg-yellow-100 border rounded text-xs">
                        <div>Signer: {signer ? '✅' : '❌'}</div>
                        <div suppressHydrationWarning>Account: {connectedAccount ? '✅' : '❌'}</div>
                        <div>Accounts: {accounts?.length || 0}</div>
                        <div>Connecting: {isConnecting ? '⏳' : '✅'}</div>
                    </div>
                )}

                {/* Wallet Selection Modal */}
                {isWalletModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Connect to your wallet
                                </h2>
                                <button
                                    onClick={() => setIsWalletModalOpen(false)}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="space-y-2">
                                {wallets.map((wallet) => (
                                    <button
                                        key={wallet.id}
                                        onClick={() => handleWalletSelect(wallet.id)}
                                        disabled={!wallet.installed}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${wallet.installed
                                                ? 'border-gray-200 hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:hover:border-primary-600 dark:hover:bg-primary-900/20'
                                                : 'border-gray-200 bg-gray-50 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <img src={wallet.logo} alt={wallet.name} className="w-8 h-8 rounded-full" />
                                            <div className="text-left">
                                                <div className={`font-medium ${wallet.installed
                                                        ? 'text-gray-900 dark:text-gray-100'
                                                        : 'text-gray-500 dark:text-gray-400'
                                                    }`}>
                                                    {wallet.installed ? wallet.name : `Get ${wallet.name}`}
                                                </div>
                                                {wallet.installed && (
                                                    <div className="text-xs text-gray-500">
                                                        Ready to connect
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {!wallet.installed && (
                                            <ExternalLink className="h-4 w-4 text-gray-400" />
                                        )}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-4 text-xs text-gray-500 text-center">
                                Don't have a wallet? Install one of the above extensions.
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    // Get current account balance
    const currentBalance = connectedAccount ? balances[connectedAccount.address] : null;

    // Show connected wallet info with success animation
    return (
        <div className="relative">
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center space-x-3 bg-white dark:bg-gray-800 border rounded-lg px-4 py-2 transition-all duration-300 ${justConnected
                        ? 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20 animate-pulse-glow'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
            >
                <div className="flex items-center space-x-2">
                    <CheckCircle className={`h-4 w-4 ${justConnected ? 'text-green-600' : 'text-green-500'}`} />
                    {connectedWallet && (
                        <img src={connectedWallet.logo} alt={connectedWallet.name} className="w-4 h-4" />
                    )}
                </div>
                <div className="text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {connectedAccount?.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {currentBalance ? formatBalance(currentBalance.free || 0, network) : '0'}
                    </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    {/* Connected Wallet Info */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
                        <div className="flex items-center justify-center mb-3">
                            {connectedWallet && (
                                <div className="flex items-center space-x-2">
                                    <img src={connectedWallet.logo} alt={connectedWallet.name} className="w-6 h-6" />
                                    <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                                        {connectedWallet.name} - v{connectedWallet.version}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Current Account */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                            Current Account
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Name:</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {connectedAccount?.name}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Address:</span>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                                        {formatAddress(connectedAccount?.address)}
                                    </span>
                                    <button
                                        onClick={() => copyAddress(connectedAccount?.address)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        <Copy className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Balance:</span>
                                <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                                    {currentBalance ? formatBalance(currentBalance.free || 0, network) : '0'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Network:</span>
                                <div className="flex items-center space-x-2">
                                    <img src={network?.logo} alt={network?.name} className="w-4 h-4 rounded-full" />
                                    <span className="text-sm text-gray-900 dark:text-gray-100">
                                        {network?.name}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Other Accounts */}
                    {accounts && accounts.length > 1 && (
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                                Switch Account ({accounts.length} available)
                            </h4>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {accounts.map((account) => {
                                    const accountBalance = balances[account.address];
                                    return (
                                        <button
                                            key={account.address}
                                            onClick={() => handleAccountSwitch(account)}
                                            className={`w-full text-left px-3 py-2 text-xs rounded transition-colors ${account.address === connectedAccount?.address
                                                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900 dark:text-primary-300 border border-primary-200 dark:border-primary-700'
                                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="font-medium">{account.name}</div>
                                                    <div className="font-mono text-xs opacity-75">{formatAddress(account.address)}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-mono">
                                                        {accountBalance ? formatBalance(accountBalance.free || 0, network) : '0'}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="p-4">
                        <button
                            onClick={handleDisconnect}
                            className="w-full flex items-center justify-center space-x-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors py-2 px-4 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Disconnect Wallet</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Backdrop to close dropdown */}
            {isDropdownOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                />
            )}
        </div>
    );
}