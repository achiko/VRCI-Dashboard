// src/components/registry/registry-event-monitor.tsx

'use client';

import { useState, useCallback } from 'react';
import { useContract, useWatchContractEvent } from 'typink';
import type { RegistryContractApi } from '@/lib/contracts/registry';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Activity, Trash2, AlertCircle, CheckCircle2, Info, TrendingUp, RefreshCw, Settings, Minimize2, Maximize2 } from 'lucide-react';

interface ContractEvent {
    id: string;
    eventName: string;
    timestamp: Date;
    blockNumber?: number;
    data: any;
    args?: any;
}

export function RegistryEventMonitor() {
    const { contract: registryContract } = useContract<RegistryContractApi>('registry');
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

            setEvents(prev => [newEvent, ...prev].slice(0, 30)); // Keep last 30 events for sidebar
            setEventCount(prev => prev + 1);
        });
    }, [isMonitoring]);

    // Specific event watchers for better type safety
    useWatchContractEvent(
        registryContract,
        'TokenAdded',
        useCallback((events) => processEvent(events, 'TokenAdded'), [processEvent]),
        isMonitoring
    );

    useWatchContractEvent(
        registryContract,
        'TokenUpdated',
        useCallback((events) => processEvent(events, 'TokenUpdated'), [processEvent]),
        isMonitoring
    );

    useWatchContractEvent(
        registryContract,
        'TokenRemoved',
        useCallback((events) => processEvent(events, 'TokenRemoved'), [processEvent]),
        isMonitoring
    );

    useWatchContractEvent(
        registryContract,
        'TokenTierChanged',
        useCallback((events) => processEvent(events, 'TokenTierChanged'), [processEvent]),
        isMonitoring
    );

    useWatchContractEvent(
        registryContract,
        'ActiveTierShifted',
        useCallback((events) => processEvent(events, 'ActiveTierShifted'), [processEvent]),
        isMonitoring
    );

    useWatchContractEvent(
        registryContract,
        'RoleGranted',
        useCallback((events) => processEvent(events, 'RoleGranted'), [processEvent]),
        isMonitoring
    );

    useWatchContractEvent(
        registryContract,
        'RoleRevoked',
        useCallback((events) => processEvent(events, 'RoleRevoked'), [processEvent]),
        isMonitoring
    );

    useWatchContractEvent(
        registryContract,
        'GracePeriodStarted',
        useCallback((events) => processEvent(events, 'GracePeriodStarted'), [processEvent]),
        isMonitoring
    );

    useWatchContractEvent(
        registryContract,
        'TierThresholdsUpdated',
        useCallback((events) => processEvent(events, 'TierThresholdsUpdated'), [processEvent]),
        isMonitoring
    );

    useWatchContractEvent(
        registryContract,
        'OperationFailed',
        useCallback((events) => processEvent(events, 'OperationFailed'), [processEvent]),
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
            case 'TokenAdded':
                return <CheckCircle2 className="h-3 w-3 text-green-600" />;
            case 'TokenUpdated':
                return <RefreshCw className="h-3 w-3 text-blue-600" />;
            case 'TokenRemoved':
                return <Trash2 className="h-3 w-3 text-red-600" />;
            case 'TokenTierChanged':
                return <TrendingUp className="h-3 w-3 text-purple-600" />;
            case 'ActiveTierShifted':
                return <Activity className="h-3 w-3 text-orange-600" />;
            case 'RoleGranted':
            case 'RoleRevoked':
                return <Info className="h-3 w-3 text-indigo-600" />;
            case 'GracePeriodStarted':
                return <Clock className="h-3 w-3 text-yellow-600" />;
            case 'TierThresholdsUpdated':
                return <Settings className="h-3 w-3 text-gray-600" />;
            case 'OperationFailed':
                return <AlertCircle className="h-3 w-3 text-red-600" />;
            default:
                return <AlertCircle className="h-3 w-3 text-gray-600" />;
        }
    };

    const getEventColor = (eventName: string) => {
        switch (eventName) {
            case 'TokenAdded':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'TokenUpdated':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'TokenRemoved':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'TokenTierChanged':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'ActiveTierShifted':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'RoleGranted':
            case 'RoleRevoked':
                return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'GracePeriodStarted':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'TierThresholdsUpdated':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'OperationFailed':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <Card className="w-full shadow-none">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4" />
                        <span>Event Monitor</span>
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
                        Real-time contract events
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
                            <span className={`flex items-center space-x-1 ${registryContract ? 'text-green-600' : 'text-red-600'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${registryContract ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span>{registryContract ? 'Connected' : 'Disconnected'}</span>
                            </span>
                        </div>
                    </div>

                    {/* Events List */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {events.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">
                                <Activity className="h-6 w-6 mx-auto mb-1 opacity-50" />
                                <p className="text-xs">
                                    {isMonitoring ? 'Waiting for events...' : 'Monitoring paused'}
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

                                    <Badge className={`text-xs ${getEventColor(event.eventName)}`}>
                                        {event.eventName}
                                    </Badge>

                                    {/* Expandable Event Data */}
                                    <details className="mt-1">
                                        <summary className="cursor-pointer text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                                            Data
                                        </summary>
                                        <pre className="mt-1 p-1 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto max-h-20">
                                            {formatEventData(event)}
                                        </pre>
                                    </details>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Quick Legend */}
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded">
                        <div className="grid grid-cols-2 gap-1 text-xs text-amber-700 dark:text-amber-300">
                            <div className="flex items-center space-x-1">
                                <CheckCircle2 className="h-2 w-2 text-green-600" />
                                <span>Added</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <RefreshCw className="h-2 w-2 text-blue-600" />
                                <span>Updated</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <TrendingUp className="h-2 w-2 text-purple-600" />
                                <span>Tier</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Activity className="h-2 w-2 text-orange-600" />
                                <span>Shift</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}