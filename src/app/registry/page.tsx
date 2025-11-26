// src/app/registry/page.tsx

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RegistryTokenViewer } from '@/components/registry/registry-token-viewer';
import { RegistryTokenManager } from '@/components/registry/registry-token-manager';
import { RegistryInfoViewer } from '@/components/registry/registry-info-viewer';
import { RegistryTierManager } from '@/components/registry/registry-tier-manager';
import { RegistryAnalyticsViewer } from '@/components/registry/registry-analytics-viewer';
import { RegistryConfigurationManager } from '@/components/registry/registry-configuration-manager';
import { RegistryEventMonitor } from '@/components/registry/registry-event-monitor';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTypink } from 'typink';
import { Search, Edit, Info, Layers, BarChart3, Settings, Shield, Clock, Package, Activity, Copy } from 'lucide-react';
import { CONTRACT_ADDRESSES } from '@/providers/TypinkProvider';
import { RegistryRoleManager } from '@/components/registry/registry-role-manager';
import { RegistryGracePeriodManager } from '@/components/registry/grace-period-manager';

const validTabs = ['query', 'manage', 'info', 'tiers', 'analytics', 'config', 'roles', 'grace'] as const;
type ValidTab = typeof validTabs[number];

function RegistryPageContent() {
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
            ? `/registry?${currentParams.toString()}`
            : '/registry';

        router.replace(newUrl, { scroll: false });
    };

    // Update active tab when URL changes (e.g., browser back/forward)
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="mx-auto p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">
                        Registry Contract
                    </h1>
                    <p className="text-lg text-gray-600">
                        Portfolio token management with advanced tier system and cross-contract integration
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {CONTRACT_ADDRESSES.REGISTRY}
                        </span>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(CONTRACT_ADDRESSES.REGISTRY);
                            }}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                            title="Copy contract address"
                        >
                            <Copy className="h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                        </button>
                    </div>
                </div>

                {/* Contract Status Banner */}
                <div className="card mb-8 bg-gradient-to-r p-4 rounded-2xl from-emerald-50 to-green-50 border-emerald-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                            <div>
                                <h3 className="text-lg font-semibold text-emerald-800">Registry Contract Active</h3>
                                <p className="text-sm text-emerald-600">Connected to POP Testnet • Advanced tier management ready</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-emerald-700">
                            <div className="flex items-center space-x-1">
                                <Package className="h-4 w-4" />
                                <span>Token Registry</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Layers className="h-4 w-4" />
                                <span>Tier System</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Shield className="h-4 w-4" />
                                <span>Oracle Integration</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Registry Interface */}
                {signer && connectedAccount ? (
                    <div className=" gap-8 mb-8">
                        {/* Main Content Area */}
                        <div className="">
                           
                            <Tabs value={activeTab} onValueChange={handleTabChange}>
                                {/* Tab Navigation */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-center mb-6">
                                    <TabsList className="mt-4 sm:mt-0 grid grid-cols-4 sm:grid-cols-8 w-full sm:w-auto">
                                        <TabsTrigger value="query" className="flex items-center space-x-1">
                                            <Search className="h-4 w-4" />
                                            <span className="hidden sm:inline">Query</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="manage" className="flex items-center space-x-1">
                                            <Edit className="h-4 w-4" />
                                            <span className="hidden sm:inline">Manage</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="tiers" className="flex items-center space-x-1">
                                            <Layers className="h-4 w-4" />
                                            <span className="hidden sm:inline">Tiers</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="analytics" className="flex items-center space-x-1">
                                            <BarChart3 className="h-4 w-4" />
                                            <span className="hidden sm:inline">Analytics</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="config" className="flex items-center space-x-1">
                                            <Settings className="h-4 w-4" />
                                            <span className="hidden sm:inline">Config</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="info" className="flex items-center space-x-1">
                                            <Info className="h-4 w-4" />
                                            <span className="hidden sm:inline">Info</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="roles" className="flex items-center space-x-1">
                                            <Shield className="h-4 w-4" />
                                            <span>Roles</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="grace" className="flex items-center space-x-1">
                                            <Clock className="h-4 w-4" />
                                            <span className="hidden sm:inline">Grace</span>
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                {/* Tab Content */}
                                <TabsContent value="query">
                                    <RegistryTokenViewer />
                                </TabsContent>

                                <TabsContent value="manage">
                                    <RegistryTokenManager />
                                </TabsContent>

                                <TabsContent value="tiers">
                                    <RegistryTierManager />
                                </TabsContent>

                                <TabsContent value="analytics">
                                    <RegistryAnalyticsViewer />
                                </TabsContent>

                                <TabsContent value="config">
                                    <RegistryConfigurationManager />
                                </TabsContent>

                                <TabsContent value="info">
                                    <RegistryInfoViewer />
                                </TabsContent>

                                <TabsContent value="roles">
                                    <RegistryRoleManager />
                                </TabsContent>

                                <TabsContent value="grace">
                                    <RegistryGracePeriodManager />
                                </TabsContent>
                            </Tabs>
                        </div>

                         {/* Event Monitor Sidebar */}
                         <div className="pt-2">
                            <div className="">
                                <RegistryEventMonitor />
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
                                Connect your wallet to interact with the advanced registry features
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <Search className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <div className="text-sm font-medium text-gray-700">Query Tokens</div>
                                    <div className="text-xs text-gray-500 mt-1">View registered tokens with live oracle data</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <Edit className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <div className="text-sm font-medium text-gray-700">Manage Tokens</div>
                                    <div className="text-xs text-gray-500 mt-1">Add new tokens and update portfolio data</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <Layers className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <div className="text-sm font-medium text-gray-700">Tier Management</div>
                                    <div className="text-xs text-gray-500 mt-1">Calculate and update token tiers</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <BarChart3 className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <div className="text-sm font-medium text-gray-700">Analytics</div>
                                    <div className="text-xs text-gray-500 mt-1">View tier distribution and trends</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <Settings className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <div className="text-sm font-medium text-gray-700">Configuration</div>
                                    <div className="text-xs text-gray-500 mt-1">Manage oracles and tier thresholds</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <Info className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <div className="text-sm font-medium text-gray-700">Registry Info</div>
                                    <div className="text-xs text-gray-500 mt-1">Contract details and permissions</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <Shield className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <div className="text-sm font-medium text-gray-700">Role Manager</div>
                                    <div className="text-xs text-gray-500 mt-1">Manage roles and permissions</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <Clock className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <div className="text-sm font-medium text-gray-700">Grace Period</div>
                                    <div className="text-xs text-gray-500 mt-1">Manage tier change grace periods</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Enhanced Function Categories Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="card bg-gradient-to-br p-4 rounded-2xl from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800">
                        <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200 mb-3 flex items-center space-x-2">
                            <Search className="h-5 w-5" />
                            <span>Query Functions</span>
                        </h3>
                        <div className="space-y-2 text-xs text-emerald-700 dark:text-emerald-300">
                            <div>• get_token_data(id) → Enhanced data with tiers</div>
                            <div>• get_enhanced_token_data(id) → Full tier info</div>
                            <div>• get_tokens_by_tier(tier) → Tier-filtered tokens</div>
                            <div>• get_tier_distribution() → Token count per tier</div>
                        </div>
                    </div>

                    <div className="card p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center space-x-2">
                            <Layers className="h-5 w-5" />
                            <span>Tier Management</span>
                        </h3>
                        <div className="space-y-2 text-xs text-blue-700 dark:text-blue-300">
                            <div>• calculate_token_tier(id) → Calculate tier</div>
                            <div>• update_token_tier(id) → Manual tier update</div>
                            <div>• refresh_all_tiers() → Batch tier refresh</div>
                            <div>• process_grace_periods() → Apply pending changes</div>
                        </div>
                    </div>

                    <div className="card p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                        <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center space-x-2">
                            <Settings className="h-5 w-5" />
                            <span>Configuration</span>
                        </h3>
                        <div className="space-y-2 text-xs text-purple-700 dark:text-purple-300">
                            <div>• set_dot_usd_oracle(oracle) → Set price oracle</div>
                            <div>• set_tier_thresholds(thresholds) → Update limits</div>
                            <div>• shift_active_tier(tier, reason) → Execute tier shift</div>
                            <div>• get_current_usd_rate() → Live conversion rate</div>
                        </div>
                    </div>
                </div>

                {/* Advanced Features Overview */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Advanced Registry Features
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <h4 className="font-medium text-gray-700 mb-2 flex items-center space-x-2">
                                <Layers className="h-4 w-4" />
                                <span>Tier System</span>
                            </h4>
                            <div className="space-y-1 text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                <div>• 5-tier classification (None, Tier1-4)</div>
                                <div>• Market cap & volume based thresholds</div>
                                <div>• 90-day grace period for tier changes</div>
                                <div>• 80% rule for automatic tier shifts</div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-700 mb-2 flex items-center space-x-2">
                                <BarChart3 className="h-4 w-4" />
                                <span>Analytics & Monitoring</span>
                            </h4>
                            <div className="space-y-1 text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                <div>• Real-time tier distribution tracking</div>
                                <div>• Pending tier changes monitoring</div>
                                <div>• Active tier shift recommendations</div>
                                <div>• USD conversion rate tracking</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RegistryPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading registry interface...</p>
            </div>
        </div>}>
            <RegistryPageContent />
        </Suspense>
    );
}