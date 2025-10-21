'use client';

import { useState } from 'react';
import { useContractQuery } from '@dedot/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Info, Settings } from 'lucide-react';

interface OracleValidationConfigViewerProps {
  oracleContract: any;
}

export default function OracleValidationConfigViewer({ oracleContract }: OracleValidationConfigViewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Query hooks for validation configuration
  const { data: validationConfig, isLoading: isLoadingConfig } = useContractQuery(
    oracleContract,
    'getValidationConfig',
    []
  );

  const { data: maxDeviation, isLoading: isLoadingDeviation } = useContractQuery(
    oracleContract,
    'getMaxDeviation',
    []
  );

  const { data: stalenessThreshold, isLoading: isLoadingStaleness } = useContractQuery(
    oracleContract,
    'getStalenessThreshold',
    []
  );

  const { data: minUpdateInterval, isLoading: isLoadingInterval } = useContractQuery(
    oracleContract,
    'getMinUpdateInterval',
    []
  );

  const formatBasisPoints = (bp: number) => {
    return `${(bp / 100).toFixed(2)}%`;
  };

  const formatSeconds = (seconds: bigint) => {
    const secs = Number(seconds);
    if (secs < 60) return `${secs} seconds`;
    if (secs < 3600) return `${Math.floor(secs / 60)} minutes`;
    return `${Math.floor(secs / 3600)} hours`;
  };

  const isLoadingAny = isLoadingConfig || isLoadingDeviation || isLoadingStaleness || isLoadingInterval;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Validation Configuration
          </CardTitle>
          <CardDescription>
            Current validation settings for price updates and data integrity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingAny ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Max Deviation */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Maximum Deviation</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {maxDeviation ? formatBasisPoints(maxDeviation) : 'N/A'}
                </div>
                <p className="text-sm text-gray-600">
                  Maximum allowed price change between updates
                </p>
              </div>

              {/* Staleness Threshold */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Staleness Threshold</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {stalenessThreshold ? formatSeconds(stalenessThreshold) : 'N/A'}
                </div>
                <p className="text-sm text-gray-600">
                  Time after which price data is considered stale
                </p>
              </div>

              {/* Min Update Interval */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Min Update Interval</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {minUpdateInterval ? formatSeconds(minUpdateInterval) : 'N/A'}
                </div>
                <p className="text-sm text-gray-600">
                  Minimum time between price updates
                </p>
              </div>

              {/* Complete Config Object */}
              {validationConfig && (
                <div className="col-span-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Complete Configuration</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-gray-700 overflow-x-auto">
                      {JSON.stringify(validationConfig, (key, value) =>
                        typeof value === 'bigint' ? value.toString() : value, 2
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Information */}
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Validation Rules:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Price changes cannot exceed the maximum deviation</li>
              <li>Updates must respect the minimum interval</li>
              <li>Stale data triggers automatic tier adjustments</li>
              <li>All rules apply to both individual tokens and DOT/USD price</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
