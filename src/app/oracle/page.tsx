// src/app/oracle/page.tsx

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OraclePriceFetcher } from '@/components/oracle/oracle-price-fetcher';
import { OraclePriceUpdater } from '@/components/oracle/oracle-price-updater';
import { OracleConfigManager } from '@/components/oracle/oracle-config-manager';
import { OracleAuthorizationManager } from '@/components/oracle/oracle-authorization-manager';
import { OracleEmergencyControls } from '@/components/oracle/oracle-emergency-controls';
import { OracleInfoViewer } from '@/components/oracle/oracle-info-viewer';
import { OracleAdvancedDataManager } from '@/components/oracle/oracle-advanced-data-manager';
import { OracleDotUsdManager } from '@/components/oracle/oracle-dot-usd-manager';
import OracleDotTokenManager from '@/components/oracle/oracle-dot-token-manager';
import OracleValidationConfigViewer from '@/components/oracle/oracle-validation-config-viewer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTypink } from 'typink';
import { Search, Upload, BarChart3, Settings, Shield, Clock, Database, Users, AlertTriangle, Info, DollarSign } from 'lucide-react';

const validTabs = ['query', 'update', 'advanced', 'dot-usd', 'dot-token', 'validation', 'config', 'auth', 'emergency', 'info'] as const;
type ValidTab = typeof validTabs[number];

function OraclePageContent() {
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
            ? `/oracle?${currentParams.toString()}`
            : '/oracle';

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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-6xl mx-auto p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">
                        Oracle Contract
                    </h1>
                    <p className="text-lg text-gray-600">
                        Complete price feeds and market data management
                    </p>
                </div>

                {/* Contract Status Banner */}
                <div className="card mb-8 bg-gradient-to-r p-4 rounded-2xl from-green-50 to-emerald-50 border-green-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <div>
                                <h3 className="text-lg font-semibold text-green-800">Oracle Contract Active</h3>
                                <p className="text-sm text-green-600">Connected to POP Testnet • All functions available</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-green-700">
                            <div className="flex items-center space-x-1">
                                <Shield className="h-4 w-4" />
                                <span>Secure</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>Real-time</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Oracle Interface */}
                {signer && connectedAccount ? (
                    <div className="mb-8">
                        <Tabs value={activeTab} onValueChange={handleTabChange}>
                            {/* Tab Navigation */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-center mb-6">
                                <TabsList className="mt-4 sm:mt-0 grid grid-cols-5 lg:grid-cols-10 w-full sm:w-auto">
                                    <TabsTrigger value="query" className="flex items-center space-x-1 text-xs">
                                        <Search className="h-3 w-3" />
                                        <span className="hidden sm:inline">Query</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="update" className="flex items-center space-x-1 text-xs">
                                        <Upload className="h-3 w-3" />
                                        <span className="hidden sm:inline">Update</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="advanced" className="flex items-center space-x-1 text-xs">
                                        <Database className="h-3 w-3" />
                                        <span className="hidden sm:inline">Advanced</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="dot-usd" className="flex items-center space-x-1 text-xs">
                                        <DollarSign className="h-3 w-3" />
                                        <span className="hidden sm:inline">DOT/USD</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="dot-token" className="flex items-center space-x-1 text-xs">
                                        <DollarSign className="h-3 w-3" />
                                        <span className="hidden sm:inline">DOT Token</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="validation" className="flex items-center space-x-1 text-xs">
                                        <Settings className="h-3 w-3" />
                                        <span className="hidden sm:inline">Validation</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="config" className="flex items-center space-x-1 text-xs">
                                        <Settings className="h-3 w-3" />
                                        <span className="hidden sm:inline">Config</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="auth" className="flex items-center space-x-1 text-xs">
                                        <Users className="h-3 w-3" />
                                        <span className="hidden sm:inline">Auth</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="emergency" className="flex items-center space-x-1 text-xs">
                                        <AlertTriangle className="h-3 w-3" />
                                        <span className="hidden sm:inline">Emergency</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="info" className="flex items-center space-x-1 text-xs">
                                        <Info className="h-3 w-3" />
                                        <span className="hidden sm:inline">Info</span>
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            {/* Tab Content */}
                            <TabsContent value="query">
                                <OraclePriceFetcher />
                            </TabsContent>

                            <TabsContent value="update">
                                <OraclePriceUpdater />
                            </TabsContent>

                            <TabsContent value="advanced">
                                <OracleAdvancedDataManager />
                            </TabsContent>

                            <TabsContent value="dot-usd">
                                <OracleDotUsdManager />
                            </TabsContent>

                            <TabsContent value="dot-token">
                                <OracleDotTokenManager />
                            </TabsContent>

                            <TabsContent value="validation">
                                <OracleValidationConfigViewer />
                            </TabsContent>

                            <TabsContent value="config">
                                <OracleConfigManager />
                            </TabsContent>

                            <TabsContent value="auth">
                                <OracleAuthorizationManager />
                            </TabsContent>

                            <TabsContent value="emergency">
                                <OracleEmergencyControls />
                            </TabsContent>

                            <TabsContent value="info">
                                <OracleInfoViewer />
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : (
                    <div className="mb-8">
                        <div className="card text-center py-8">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                                Connect Wallet to Continue
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Connect your wallet to interact with the oracle contract
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mt-6">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <Search className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <div className="text-xs font-medium text-gray-700">Query</div>
                                    <div className="text-xs text-gray-500 mt-1">Price data</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <div className="text-xs font-medium text-gray-700">Update</div>
                                    <div className="text-xs text-gray-500 mt-1">Token prices</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <Database className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <div className="text-xs font-medium text-gray-700">Advanced</div>
                                    <div className="text-xs text-gray-500 mt-1">Bulk updates</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <DollarSign className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <div className="text-xs font-medium text-gray-700">DOT/USD</div>
                                    <div className="text-xs text-gray-500 mt-1">Rate feed</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <Settings className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <div className="text-xs font-medium text-gray-700">Config</div>
                                    <div className="text-xs text-gray-500 mt-1">Validation</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <Users className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <div className="text-xs font-medium text-gray-700">Auth</div>
                                    <div className="text-xs text-gray-500 mt-1">Updaters</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <AlertTriangle className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <div className="text-xs font-medium text-gray-700">Emergency</div>
                                    <div className="text-xs text-gray-500 mt-1">Controls</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <Info className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <div className="text-xs font-medium text-gray-700">Info</div>
                                    <div className="text-xs text-gray-500 mt-1">Contract details</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Function Categories Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="card bg-gradient-to-br p-4 rounded-2xl from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center space-x-2">
                            <Search className="h-5 w-5" />
                            <span>Query Functions</span>
                        </h3>
                        <div className="space-y-2 text-xs text-blue-700 dark:text-blue-300">
                            <div>• get_price(token) → Option&lt;u128&gt;</div>
                            <div>• get_market_cap(token) → Option&lt;u128&gt;</div>
                            <div>• get_market_volume(token) → Option&lt;u128&gt;</div>
                            <div>• get_token_data(token) → Option&lt;TokenPriceData&gt;</div>
                            <div>• is_price_stale(token) → bool</div>
                            <div>• get_last_update_time(token) → Option&lt;u64&gt;</div>
                        </div>
                    </div>

                    <div className="card p-4 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center space-x-2">
                            <Upload className="h-5 w-5" />
                            <span>Update Functions</span>
                        </h3>
                        <div className="space-y-2 text-xs text-green-700 dark:text-green-300">
                            <div>• update_price(token, price) → Result&lt;(), Error&gt;</div>
                            <div>• update_market_data(token, cap, vol) → Result&lt;(), Error&gt;</div>
                            <div>• update_token_data(token, price, cap, vol) → Result&lt;(), Error&gt;</div>
                            <div>• emergency_price_override(...) → Result&lt;(), Error&gt;</div>
                        </div>
                    </div>

                    <div className="card p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
                        <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-3 flex items-center space-x-2">
                            <DollarSign className="h-5 w-5" />
                            <span>DOT/USD Functions</span>
                        </h3>
                        <div className="space-y-2 text-xs text-orange-700 dark:text-orange-300">
                            <div>• update_dot_usd_price(price) → Result&lt;(), Error&gt;</div>
                            <div>• get_dot_usd_price() → Option&lt;u128&gt;</div>
                            <div>• is_dot_price_stale() → bool</div>
                            <div>• get_dot_price_last_update() → Option&lt;u64&gt;</div>
                            <div>• emergency_dot_price_override(price) → Result&lt;(), Error&gt;</div>
                            <div>• get_dot_token_address() → AccountId</div>
                        </div>
                    </div>

                    <div className="card p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                        <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center space-x-2">
                            <Settings className="h-5 w-5" />
                            <span>Admin Functions</span>
                        </h3>
                        <div className="space-y-2 text-xs text-purple-700 dark:text-purple-300">
                            <div>• add_updater(account) → Result&lt;(), Error&gt;</div>
                            <div>• remove_updater(account) → Result&lt;(), Error&gt;</div>
                            <div>• set_validation_config(...) → Result&lt;(), Error&gt;</div>
                            <div>• pause_updates() → Result&lt;(), Error&gt;</div>
                            <div>• resume_updates() → Result&lt;(), Error&gt;</div>
                        </div>
                    </div>
                </div>

                {/* Technical Documentation */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Technical Specifications
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <h4 className="font-medium text-gray-700 mb-2">Data Types</h4>
                            <div className="space-y-1 text-xs font-mono bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                <div>TokenPriceData {'{'}price: u128, market_cap: u128, volume_24h: u128, timestamp: u64{'}'}</div>
                                <div>ValidationConfig {'{'}max_deviation_bp: u32, staleness_threshold: u64, min_update_interval: u64{'}'}</div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-700 mb-2">Storage Format</h4>
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Token Decimals:</span>
                                    <span className="text-gray-900">10 (PAS)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Price Unit:</span>
                                    <span className="text-gray-900">Plancks (1 PAS = 10^10 plancks)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">DOT/USD Scale:</span>
                                    <span className="text-gray-900">9 decimals (1 USD = 10^9 units)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Timestamp:</span>
                                    <span className="text-gray-900">Block timestamp (milliseconds)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Framework:</span>
                                    <span className="text-gray-900">ink! v5.1.0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function OraclePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading oracle interface...</p>
            </div>
        </div>}>
            <OraclePageContent />
        </Suspense>
    );
}