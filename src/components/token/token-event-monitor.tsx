// src/components/token/token-event-monitor.tsx

'use client';

import { useState, useCallback } from 'react';
import { useContract, useWatchContractEvent } from 'typink';
import type { TokenContractApi } from '@/lib/contracts/token';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Send, Users, Plus, Minus, Crown, Clock, RefreshCw, Minimize2, Maximize2 } from 'lucide-react';

interface ContractEvent {
    id: string;
    eventName: string;
    timestamp: Date;
    blockNumber?: number;
    data: any;
    args?: any;
}

export function TokenEventMonitor() {
    const { contract: tokenContract } = useContract<TokenContractApi>('token');
    const [events, setEvents] = useState<ContractEvent[]>([]);
    const [isMonitoring, setIsMonitoring] = useState(true);
    const [eventCount, setEventCount] = useState(0);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Helper function to process events
    const processEvent = useCallback((events: any[], eventName: string) => {
        if (!isMonitoring) return;

        events.forEach(event => {
            const newEvent: ContractEvent = {
                id: `${Date.now()}-${Math.random()}-${eventName}`,
                eventName: eventName,
                timestamp: new Date(),
                blockNumber: event.blockNumber,
                data: event.event?.data || event.data,
                args: event.event?.args || event.args
            };

            setEvents(prev => [newEvent, ...prev].slice(0, 20)); // Keep last 20 events
            setEventCount(prev => prev + 1);
        });
    }, [isMonitoring]);

    // Event watchers for PSP22 events
    useWatchContractEvent(
        tokenContract,
        'Transfer',
        useCallback((events) => processEvent(events, 'Transfer'), [processEvent]),
        isMonitoring
    );

    useWatchContractEvent(
        tokenContract,
        'Approval',
        useCallback((events) => processEvent(events, 'Approval'), [processEvent]),
        isMonitoring
    );

    const clearEvents = () => {
        setEvents([]);
        setEventCount(0);
    };

    const toggleMonitoring = () => {
        setIsMonitoring(!isMonitoring);
    };

    const formatEventData = (event: ContractEvent) => {
        try {
            if (event.args) {
                return JSON.stringify(event.args, null, 2);
            }
            if (event.data) {
                return JSON.stringify(event.data, null, 2);
            }
            return 'No event data';
        } catch {
            return 'Unable to format event data';
        }
    };

    const getEventIcon = (eventName: string) => {
        switch (eventName) {
            case 'Transfer':
                return <Send className="h-3 w-3 text-blue-600" />;
            case 'Approval':
                return <Users className="h-3 w-3 text-green-600" />;
            default:
                return <Activity className="h-3 w-3 text-gray-600" />;
        }
    };

    const getEventColor = (eventName: string) => {
        switch (eventName) {
            case 'Transfer':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Approval':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatTokenAmount = (amount: string | number | bigint) => {
        try {
            const amountBigInt = BigInt(amount.toString());
            const formatted = (Number(amountBigInt) / 10 ** 12).toFixed(6);
            return `${formatted} tokens`;
        } catch {
            return amount.toString();
        }
    };

    const formatAddress = (address: any) => {
        try {
            let addressStr = '';
            if (typeof address === 'string') {
                addressStr = address;
            } else if (address && typeof address.address === 'function') {
                addressStr = address.address();
            } else if (address && typeof address === 'object' && address.address) {
                addressStr = address.address;
            } else {
                addressStr = String(address);
            }

            if (!addressStr || addressStr.length < 10) {
                return addressStr || 'Unknown';
            }

            return `${addressStr.slice(0, 6)}...${addressStr.slice(-4)}`;
        } catch {
            return 'Invalid Address';
        }
    };

    const getEventDescription = (event: ContractEvent) => {
        switch (event.eventName) {
            case 'Transfer':
                const transferData = event.args || event.data;
                if (transferData) {
                    const from = transferData.from ? formatAddress(transferData.from) : 'Mint';
                    const to = transferData.to ? formatAddress(transferData.to) : 'Burn';
                    const value = transferData.value || transferData.amount || '0';
                    return `${from} → ${to}: ${formatTokenAmount(value)}`;
                }
                return 'Token transfer';
            case 'Approval':
                const approvalData = event.args || event.data;
                if (approvalData) {
                    const owner = approvalData.owner ? formatAddress(approvalData.owner) : 'Unknown';
                    const spender = approvalData.spender ? formatAddress(approvalData.spender) : 'Unknown';
                    const amount = approvalData.amount || approvalData.value || '0';
                    return `${owner} approved ${spender}: ${formatTokenAmount(amount)}`;
                }
                return 'Token approval';
            default:
                return 'Unknown event';
        }
    };

    return (
        <Card className="w-full shadow-none">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4" />
                        <span>Token Events</span>
                        <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                    </div>
                    <div className="flex items-center space-x-1">
                        <Badge variant="outline" className="text-xs">
                            {eventCount}
                        </Badge>
                        <Button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                        >
                            {isCollapsed ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                        </Button>
                    </div>
                </CardTitle>
                {!isCollapsed && (
                    <CardDescription className="text-xs">
                        Real-time PSP22 token events
                    </CardDescription>
                )}
            </CardHeader>

            {!isCollapsed && (
                <CardContent className="pt-0 space-y-3">
                    {/* Controls */}
                    <div className="flex items-center justify-between">
                        <Button
                            onClick={toggleMonitoring}
                            variant={isMonitoring ? "destructive" : "default"}
                            size="sm"
                            className="text-xs h-7"
                        >
                            {isMonitoring ? 'Pause' : 'Resume'}
                        </Button>
                        <Button
                            onClick={clearEvents}
                            variant="outline"
                            size="sm"
                            disabled={events.length === 0}
                            className="text-xs h-7"
                        >
                            Clear
                        </Button>
                    </div>

                    {/* Contract Status */}
                    <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Contract:</span>
                            <span className={`flex items-center space-x-1 ${tokenContract ? 'text-green-600' : 'text-red-600'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${tokenContract ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span>{tokenContract ? 'Connected' : 'Disconnected'}</span>
                            </span>
                        </div>
                    </div>

                    {/* Events List */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {events.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">
                                <Activity className="h-6 w-6 mx-auto mb-1 opacity-50" />
                                <p className="text-xs">
                                    {isMonitoring ? 'Waiting for token events...' : 'Monitoring paused'}
                                </p>
                            </div>
                        ) : (
                            events.map((event) => (
                                <div
                                    key={event.id}
                                    className="p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center space-x-1">
                                            {getEventIcon(event.eventName)}
                                            <span className="text-xs font-medium truncate">
                                                {event.eventName}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {event.timestamp.toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit'
                                            })}
                                        </span>
                                    </div>

                                    <div className="mb-2">
                                        <Badge className={`text-xs ${getEventColor(event.eventName)}`}>
                                            {event.eventName}
                                        </Badge>
                                    </div>

                                    {/* Event Description */}
                                    <div className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                                        {getEventDescription(event)}
                                    </div>

                                    {/* Expandable Event Data */}
                                    <details className="mt-1">
                                        <summary className="cursor-pointer text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                                            Raw Data
                                        </summary>
                                        <pre className="mt-1 p-1 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto max-h-16">
                                            {formatEventData(event)}
                                        </pre>
                                    </details>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Event Types Legend */}
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                        <div className="grid grid-cols-2 gap-1 text-xs text-blue-700 dark:text-blue-300">
                            <div className="flex items-center space-x-1">
                                <Send className="h-2 w-2 text-blue-600" />
                                <span>Transfer</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Users className="h-2 w-2 text-green-600" />
                                <span>Approval</span>
                            </div>
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            PSP22 standard events
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}