// src/components/oracle/oracle-authorization-manager.tsx

'use client';

import { useState } from 'react';
import { useContract, useContractTx } from 'typink';
import type { OracleContractApi } from '@/lib/contracts/oracle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, UserMinus, Users, Shield, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { txToaster } from '@/utils/txToaster';
import { LabelWithHelp } from '@/components/ui/field-help';
import { Badge } from '@/components/ui/badge';
import { useContractQuery } from 'typink';

export function OracleAuthorizationManager() {
    const { contract: oracleContract } = useContract<OracleContractApi>('oracle');
    const [updaterAddress, setUpdaterAddress] = useState<string>('');
    const [removeAddress, setRemoveAddress] = useState<string>('');
    const [checkAddress, setCheckAddress] = useState<string>('');
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const toaster = txToaster();

    const addUpdaterTx = useContractTx(oracleContract, 'addUpdater');
    const removeUpdaterTx = useContractTx(oracleContract, 'removeUpdater');

    const handleAddUpdater = async () => {
        if (!oracleContract || !updaterAddress.trim()) {
            setError('Please enter a valid updater address');
            return;
        }

        setError(null);
        try {
            await addUpdaterTx.signAndSend({
                args: [updaterAddress.trim()],
                callback: (progress) => {
                    toaster.onTxProgress(progress);
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        setUpdaterAddress('');
                    }
                }
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(`Error: ${errorMessage}`);
            toaster.onTxError(err instanceof Error ? err : new Error(errorMessage));
        }
    };

    const handleRemoveUpdater = async () => {
        if (!oracleContract || !removeAddress.trim()) {
            setError('Please enter a valid address to remove');
            return;
        }

        setError(null);
        try {
            await removeUpdaterTx.signAndSend({
                args: [removeAddress.trim()],
                callback: (progress) => {
                    toaster.onTxProgress(progress);
                    if (progress.status.type === 'BestChainBlockIncluded') {
                        setRemoveAddress('');
                    }
                }
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(`Error: ${errorMessage}`);
            toaster.onTxError(err instanceof Error ? err : new Error(errorMessage));
        }
    };

    const handleCheckAuthorization = async () => {
        if (!oracleContract || !checkAddress.trim()) {
            setError('Please enter a valid address to check');
            return;
        }

        setError(null);
        setIsAuthorized(null);
        try {
            const result = await oracleContract.query.isAuthorizedUpdater(checkAddress.trim());
            setIsAuthorized(result.data || false);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(`Error: ${errorMessage}`);
        }
    };

    const isLoading = addUpdaterTx.inBestBlockProgress || removeUpdaterTx.inBestBlockProgress;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5" />
                        <span>Authorization Management</span>
                    </CardTitle>
                    <CardDescription>
                        Manage authorized price updaters (owner only)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Add Updater */}
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center space-x-2 mb-3">
                            <UserPlus className="h-4 w-4" />
                            <span>Add Authorized Updater</span>
                        </h3>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <LabelWithHelp
                                    htmlFor="updaterAddress"
                                    helpText="The account address (SS58 format) that will be granted permission to update oracle prices. Authorized updaters can update token prices, market cap, and volume data without needing owner permissions. For production, you should have multiple authorized updaters to ensure price feeds remain updated. Only the contract owner can add or remove updaters."
                                >
                                    Updater Address
                                </LabelWithHelp>
                                <Input
                                    id="updaterAddress"
                                    placeholder="Enter account address (e.g., 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY)"
                                    value={updaterAddress}
                                    onChange={(e) => setUpdaterAddress(e.target.value)}
                                    className="font-mono text-sm"
                                    disabled={isLoading}
                                />
                            </div>
                            <Button
                                onClick={handleAddUpdater}
                                disabled={!oracleContract || !updaterAddress.trim() || isLoading}
                                className="w-full"
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add Updater
                            </Button>
                        </div>
                    </div>

                    {/* Remove Updater */}
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 flex items-center space-x-2 mb-3">
                            <UserMinus className="h-4 w-4" />
                            <span>Remove Authorized Updater</span>
                        </h3>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <LabelWithHelp
                                    htmlFor="removeAddress"
                                    helpText="The account address (SS58 format) that will have its update permissions revoked. Once removed, this address will no longer be able to update oracle prices. Only the contract owner can remove updaters. Make sure you have other updaters configured before removing one to avoid service disruption."
                                >
                                    Address to Remove
                                </LabelWithHelp>
                                <Input
                                    id="removeAddress"
                                    placeholder="Enter account address to remove"
                                    value={removeAddress}
                                    onChange={(e) => setRemoveAddress(e.target.value)}
                                    className="font-mono text-sm"
                                    disabled={isLoading}
                                />
                            </div>
                            <Button
                                onClick={handleRemoveUpdater}
                                disabled={!oracleContract || !removeAddress.trim() || isLoading}
                                variant="destructive"
                                className="w-full"
                            >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Remove Updater
                            </Button>
                        </div>
                    </div>

                    {/* Check Authorization */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 flex items-center space-x-2 mb-3">
                            <Shield className="h-4 w-4" />
                            <span>Check Authorization Status</span>
                        </h3>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <LabelWithHelp
                                    htmlFor="checkAddress"
                                    helpText="Enter an account address (SS58 format) to check if it has authorization to update oracle prices. This is a read-only query that doesn't require a transaction. The result will show whether the address is currently authorized as an updater."
                                >
                                    Address to Check
                                </LabelWithHelp>
                                <Input
                                    id="checkAddress"
                                    placeholder="Enter account address to check"
                                    value={checkAddress}
                                    onChange={(e) => setCheckAddress(e.target.value)}
                                    className="font-mono text-sm"
                                />
                            </div>
                            <Button
                                onClick={handleCheckAuthorization}
                                disabled={!oracleContract || !checkAddress.trim()}
                                variant="outline"
                                className="w-full"
                            >
                                <Shield className="h-4 w-4 mr-2" />
                                Check Authorization
                            </Button>

                            {/* Authorization Result */}
                            {isAuthorized !== null && (
                                <div className={`p-3 rounded-lg border ${isAuthorized
                                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                                    : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                                    }`}>
                                    <div className="flex items-center space-x-2">
                                        <CheckCircle className={`h-4 w-4 ${isAuthorized ? 'text-green-600' : 'text-gray-500'}`} />
                                        <span className={`text-sm font-medium ${isAuthorized
                                            ? 'text-green-800 dark:text-green-200'
                                            : 'text-gray-700 dark:text-gray-300'
                                            }`}>
                                            {isAuthorized
                                                ? 'Address is authorized to update prices'
                                                : 'Address is not authorized to update prices'
                                            }
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}