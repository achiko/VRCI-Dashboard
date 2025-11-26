'use client';

import { useState } from 'react';
import { useContract, useContractQuery } from 'typink';
import type { OracleContractApi } from '@/lib/contracts/oracle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Info, Copy } from 'lucide-react';
import { LabelWithHelp } from '../ui/field-help';

export default function OracleDotTokenManager() {
  const { contract: oracleContract } = useContract<OracleContractApi>('oracle');
  const [tokenAddress, setTokenAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Query hooks
  const { data: dotTokenAddress, isLoading: isLoadingAddress } = useContractQuery({
    contract: oracleContract,
    fn: 'getDotTokenAddress',
  });

  const { data: isDotToken, isLoading: isLoadingCheck } = useContractQuery({
    contract: oracleContract,
    fn: 'isDotToken',
    args: tokenAddress ? [tokenAddress as `0x${string}`] : ['0x0000000000000000000000000000000000000000' as `0x${string}`],
  });

  const handleCheckDotToken = async () => {
    if (!tokenAddress) {
      setError('Please enter a token address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!oracleContract) {
        setError('Contract not available');
        return;
      }
      const result = await oracleContract.query.isDotToken(tokenAddress as `0x${string}`);
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

  const formatAddress = (address: unknown): string => {
    if (!address) return '';
    if (typeof address === 'string') return address;
    if (typeof (address as any)?.address === 'function') {
      return (address as any).address();
    }
    if (typeof (address as any)?.toString === 'function') {
      return (address as any).toString();
    }
    return '';
  };

  const formattedDotTokenAddress = formatAddress(dotTokenAddress);

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
                value={formattedDotTokenAddress}
                readOnly
                className="font-mono text-sm"
                placeholder="Loading..."
              />
              {formattedDotTokenAddress && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => navigator.clipboard.writeText(formattedDotTokenAddress)}
                  className="h-8 w-8"
                  aria-label="Copy DOT token address"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
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
            <LabelWithHelp
              htmlFor="dot-token-check"
              helpText="Enter a token contract address (H160 format, 0x...) to check if it is the DOT token configured in the oracle. The DOT token is used for USD price feeds in registry tier calculations. This is a read-only query that doesn't require a transaction."
            >
              Check if Token is DOT Token
            </LabelWithHelp>
            <div className="flex gap-2">
              <Input
                id="dot-token-check"
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
