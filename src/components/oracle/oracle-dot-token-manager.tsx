'use client';

import { useState } from 'react';
import { useContract } from 'typink';
import type { OracleContractApi } from '@/lib/contracts/oracle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Info } from 'lucide-react';

export default function OracleDotTokenManager() {
  const { contract: oracleContract } = useContract<OracleContractApi>('oracle');
  const [tokenAddress, setTokenAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Query hooks
  const { data: dotTokenAddress, isLoading: isLoadingAddress } = useContractQuery(
    oracleContract,
    'getDotTokenAddress',
    []
  );

  const { data: isDotToken, isLoading: isLoadingCheck } = useContractQuery(
    oracleContract,
    'isDotToken',
    tokenAddress ? [tokenAddress] : null
  );

  const handleCheckDotToken = async () => {
    if (!tokenAddress) {
      setError('Please enter a token address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const result = await oracleContract.query.isDotToken(tokenAddress);
      setResult({
        isDotToken: result,
        tokenAddress: tokenAddress
      });
    } catch (err: any) {
      setError(`Error checking DOT token: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            DOT Token Management
          </CardTitle>
          <CardDescription>
            Manage and verify DOT token configuration for USD price feeds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current DOT Token Address */}
          <div className="space-y-2">
            <Label>Current DOT Token Address</Label>
            <div className="flex items-center gap-2">
              <Input
                value={dotTokenAddress || ''}
                readOnly
                className="font-mono text-sm"
                placeholder="Loading..."
              />
              {isLoadingAddress ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : dotTokenAddress ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
          </div>

          {/* Check if Token is DOT Token */}
          <div className="space-y-2">
            <Label>Check if Token is DOT Token</Label>
            <div className="flex gap-2">
              <Input
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder="Enter token address (0x...)"
                className="font-mono text-sm"
              />
              <Button
                onClick={handleCheckDotToken}
                disabled={!tokenAddress || isLoading}
                variant="outline"
              >
                {isLoading ? 'Checking...' : 'Check'}
              </Button>
            </div>
          </div>

          {/* Results */}
          {result && (
            <Alert className={result.isDotToken ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription className="flex items-center gap-2">
                {result.isDotToken ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span>
                  Token {result.tokenAddress} is {result.isDotToken ? '' : 'not '}the DOT token
                </span>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Information */}
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>DOT Token:</strong> The token used for USD price feeds in registry tier calculations</p>
            <p><strong>Purpose:</strong> Enables automatic tier updates based on market conditions</p>
            <p><strong>Integration:</strong> Connected to Registry contract for real-time tier management</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
