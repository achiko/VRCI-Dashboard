'use client';

import { useEffect, useState } from 'react';
import { useTypink } from 'typink';
import { useWhitelistCheck } from '@/hooks/api/useWhitelist';
import { ConnectWallet } from '@/components/connect-wallet.dedot';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Wallet, XCircle } from 'lucide-react';

interface WalletAuthGuardProps {
  children: React.ReactNode;
}

export function WalletAuthGuard({ children }: WalletAuthGuardProps) {
  const { signer, connectedAccount } = useTypink();
  const [isChecking, setIsChecking] = useState(false);
  const address = connectedAccount?.address;

  const { data: isWhitelisted, isLoading: isCheckingWhitelist, refetch } = useWhitelistCheck(address);

  useEffect(() => {
    if (address) {
      setIsChecking(true);
      refetch().finally(() => setIsChecking(false));
    }
  }, [address, refetch]);

  // Not connected - show connect wallet UI
  if (!signer || !connectedAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to access the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectWallet />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Checking whitelist status
  if (isCheckingWhitelist || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
            <CardTitle className="text-2xl">Verifying Access</CardTitle>
            <CardDescription>
              Checking if your wallet is authorized...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Not whitelisted - show access denied
  if (isWhitelisted === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
              <XCircle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>
              Your wallet address is not whitelisted for platform access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <div className="mt-2">
                  <p className="font-medium">Connected Wallet:</p>
                  <p className="font-mono text-sm break-all mt-1">{address}</p>
                </div>
                <p className="mt-4">
                  Please contact an administrator to whitelist your wallet address.
                </p>
              </AlertDescription>
            </Alert>
            <div className="text-center text-sm text-muted-foreground">
              <p>If you believe this is an error, please contact support.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Whitelisted - show children
  return <>{children}</>;
}

