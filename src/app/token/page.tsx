// src/app/token/page.tsx

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TokenViewer } from '@/components/token/token-viewer';
import { TokenManager } from '@/components/token/token-manager';
import { TokenRoleManager } from '@/components/token/token-role-manager';
import { TokenEventMonitor } from '@/components/token/token-event-monitor';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTypink } from 'typink';
import { Search, Send, Shield, Coins, Activity, Copy } from 'lucide-react';
import { CONTRACT_ADDRESSES } from '@/providers/TypinkProvider';

const validTabs = ['query', 'manage', 'roles'] as const;
type ValidTab = typeof validTabs[number];

function TokenPageContent() {
    const { signer, connectedAccount } = useTypink();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get tab from URL, fallback to 'query'
    const urlTab = searchParams.get('tab');
    const isValidTab = (tab: string | null): tab is ValidTab => {
        return tab !== null && validTabs.includes(tab as ValidTab);
    };

    const [activeTab, setActiveTab] = useState<ValidTab>(
        isValidTab(urlTab) ? urlTab : 'query'
    );

    // Update URL when tab changes
    const updateUrl = (newTab: ValidTab) => {
        const currentParams = new URLSearchParams(searchParams.toString());
        if (newTab !== 'query') {
            currentParams.set('tab', newTab);
        } else {
            currentParams.delete('tab');
        }

        const newUrl = currentParams.toString()
            ? `/token?${currentParams.toString()}`
            : '/token';

        router.replace(newUrl, { scroll: false });
    };

    // Update active tab when URL changes
    useEffect(() => {
        const urlTab = searchParams.get('tab');
        if (isValidTab(urlTab) && urlTab !== activeTab) {
            setActiveTab(urlTab);
        } else if (!urlTab && activeTab !== 'query') {
            setActiveTab('query');
        }
    }, [searchParams, activeTab]);

    const handleTabChange = (value: string) => {
        if (isValidTab(value)) {
            setActiveTab(value);
            updateUrl(value);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className=" mx-auto p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">
                        Token Contract
                    </h1>
                    <p className="text-lg text-gray-600">
                        PSP22 fungible token with role-based access control and advanced minting/burning features
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {CONTRACT_ADDRESSES.TOKEN}
                        </span>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(CONTRACT_ADDRESSES.TOKEN);
                            }}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                            title="Copy contract address"
                        >
                            <Copy className="h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                        </button>
                    </div>
                </div>

                {/* Contract Status Banner */}
                <div className="card mb-8 bg-gradient-to-r p-4 rounded-2xl from-amber-50 to-yellow-50 border-amber-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                            <div>
                                <h3 className="text-lg font-semibold text-amber-800">Token Contract Active</h3>
                                <p className="text-sm text-amber-600">Connected to POP Testnet • PSP22 compliant with role management</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-amber-700">
                            <div className="flex items-center space-x-1">
                                <Coins className="h-4 w-4" />
                                <span>PSP22 Standard</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Shield className="h-4 w-4" />
                                <span>Role Control</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Activity className="h-4 w-4" />
                                <span>Event Tracking</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Token Interface */}
                {signer && connectedAccount ? (
                    <div className="gap-8 mb-8">
                        {/* Main Content Area */}
                        <div className="">
                            <Tabs value={activeTab} onValueChange={handleTabChange}>
                                {/* Tab Navigation */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-center mb-6">
                                    <TabsList className="mt-4 sm:mt-0 grid grid-cols-3 w-full sm:w-auto">
                                        <TabsTrigger value="query" className="flex items-center space-x-1">
                                            <Search className="h-4 w-4" />
                                            <span className="hidden sm:inline">Query</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="manage" className="flex items-center space-x-1">
                                            <Send className="h-4 w-4" />
                                            <span className="hidden sm:inline">Manage</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="roles" className="flex items-center space-x-1">
                                            <Shield className="h-4 w-4" />
                                            <span className="hidden sm:inline">Roles</span>
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                {/* Tab Content */}
                                <TabsContent value="query">
                                    <TokenViewer />
                                </TabsContent>

                                <TabsContent value="manage">
                                    <TokenManager />
                                </TabsContent>

                                <TabsContent value="roles">
                                    <TokenRoleManager />
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Event Monitor Sidebar */}
                        <div className="pt-2">
                            <div className="">
                                <TokenEventMonitor />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mb-8">
                        <div className="card text-center py-8">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                                Connect Wallet to Continue
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Connect your wallet to interact with the PSP22 token contract
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <Search className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <div className="text-sm font-medium text-gray-700">Query Token Data</div>
                                    <div className="text-xs text-gray-500 mt-1">Check balances, allowances, and metadata</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <Send className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <div className="text-sm font-medium text-gray-700">Token Operations</div>
                                    <div className="text-xs text-gray-500 mt-1">Transfer, approve, mint, and burn tokens</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <Shield className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <div className="text-sm font-medium text-gray-700">Role Management</div>
                                    <div className="text-xs text-gray-500 mt-1">Manage permissions and ownership</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PSP22 Function Categories Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="card bg-gradient-to-br p-4 rounded-2xl from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center space-x-2">
                            <Search className="h-5 w-5" />
                            <span>Query Functions</span>
                        </h3>
                        <div className="space-y-2 text-xs text-blue-700 dark:text-blue-300">
                            <div>• total_supply() → Total token supply</div>
                            <div>• balance_of(owner) → Account balance</div>
                            <div>• allowance(owner, spender) → Approved amount</div>
                            <div>• token_name() → Token name</div>
                            <div>• token_symbol() → Token symbol</div>
                            <div>• token_decimals() → Decimal places</div>
                        </div>
                    </div>

                    <div className="card p-4 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center space-x-2">
                            <Send className="h-5 w-5" />
                            <span>Transfer Functions</span>
                        </h3>
                        <div className="space-y-2 text-xs text-green-700 dark:text-green-300">
                            <div>• transfer(to, value, data) → Send tokens</div>
                            <div>• transfer_from(from, to, value, data) → Send on behalf</div>
                            <div>• approve(spender, value) → Set allowance</div>
                            <div>• increase_allowance(spender, delta) → Increase allowance</div>
                            <div>• decrease_allowance(spender, delta) → Decrease allowance</div>
                        </div>
                    </div>

                    <div className="card p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                        <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center space-x-2">
                            <Shield className="h-5 w-5" />
                            <span>Admin Functions</span>
                        </h3>
                        <div className="space-y-2 text-xs text-purple-700 dark:text-purple-300">
                            <div>• mint(value) → Mint to caller</div>
                            <div>• mint_to(to, value) → Mint to account</div>
                            <div>• burn(value) → Burn from caller</div>
                            <div>• burn_from(from, value) → Burn from account</div>
                            <div>• transfer_ownership(new_owner) → Change owner</div>
                            <div>• add/remove_authorized_minter/burner → Manage roles</div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Features Overview */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Enhanced PSP22 Token Features
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <h4 className="font-medium text-gray-700 mb-2 flex items-center space-x-2">
                                <Shield className="h-4 w-4" />
                                <span>Role-Based Access Control</span>
                            </h4>
                            <div className="space-y-1 text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                <div>• Contract owner with full administrative control</div>
                                <div>• Authorized minters can mint tokens to any account</div>
                                <div>• Authorized burners can burn tokens from any account</div>
                                <div>• Granular permission management</div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-700 mb-2 flex items-center space-x-2">
                                <Activity className="h-4 w-4" />
                                <span>Event Monitoring & Standards</span>
                            </h4>
                            <div className="space-y-1 text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                <div>• Full PSP22 standard compliance</div>
                                <div>• Real-time Transfer and Approval event tracking</div>
                                <div>• Enhanced mint/burn capabilities</div>
                                <div>• Comprehensive error handling</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PSP22 Standard Information */}
                <div className="card bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
                    <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center space-x-2">
                        <Coins className="h-5 w-5" />
                        <span>PSP22 Standard Compliance</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-amber-700">
                        <div>
                            <h4 className="font-medium mb-2">Core PSP22 Features:</h4>
                            <div className="space-y-1 text-xs">
                                <div>✅ Fungible token standard for Polkadot ecosystem</div>
                                <div>✅ Transfer and approval mechanisms</div>
                                <div>✅ Allowance system for delegated transfers</div>
                                <div>✅ Standard metadata (name, symbol, decimals)</div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2">Enhanced Extensions:</h4>
                            <div className="space-y-1 text-xs">
                                <div>✅ PSP22Mintable - Controlled token creation</div>
                                <div>✅ PSP22Burnable - Token destruction capabilities</div>
                                <div>✅ Role-based access control system</div>
                                <div>✅ Advanced error handling and validation</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TokenPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading token interface...</p>
                </div>
            </div>
        }>
            <TokenPageContent />
        </Suspense>
    );
}