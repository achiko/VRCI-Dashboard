'use client';

import { useState } from 'react';
import { useContract, useContractTx, useContractQuery } from 'typink';
import type { PortfolioContractApi } from '@/lib/contracts/portfolio';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Plus, Minus, Wallet } from 'lucide-react';

export default function PortfolioTokenManager() {
  const { contract: portfolioContract } = useContract<PortfolioContractApi>('portfolio');
  const [tokenId, setTokenId] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Transaction hooks
  // Note: Some methods don't exist in Portfolio contract API
  const addTokenHoldingTx = useContractTx(portfolioContract, 'addTokenHolding');
  // const removeTokenTx = useContractTx(portfolioContract, 'removeToken');
  // const depositTx = useContractTx(portfolioContract, 'deposit');
  // const withdrawTx = useContractTx(portfolioContract, 'withdraw');

  // State for token data
  // Note: These methods don't exist in Portfolio contract API
  const [tokenIds, setTokenIds] = useState<any>(null);
  const [tokenHolding, setTokenHolding] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const handleAddToken = async () => {
    if (!tokenId || !amount) {
      setError('Please enter a token ID and amount');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      await addTokenHoldingTx.signAndSend({
        args: [parseInt(tokenId), BigInt(amount), 1000], // 1000 = 10% weight
        callback: (progress) => {
          if (progress.status.type === 'BestChainBlockIncluded') {
            if (progress.dispatchError) {
              setError('Transaction failed');
            } else {
              setResult({ type: 'addToken', hash: 'success', tokenId: parseInt(tokenId) });
            }
          }
        }
      });
    } catch (err: any) {
      setError(`Error adding token: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Note: These methods don't exist in Portfolio contract API
  // const handleRemoveToken = async () => {
  //   if (!tokenId) {
  //     setError('Please enter a token ID');
  //     return;
  //   }

  //   setIsLoading(true);
  //   setError(null);
  //   setResult(null);

  //   try {
  //     const tx = removeTokenTx.tx(parseInt(tokenId));
  //     const hash = await tx.signAndSend(selectedAccount?.address);
  //     setResult({ type: 'removeToken', hash, tokenId: parseInt(tokenId) });
  //   } catch (err: any) {
  //     setError(`Error removing token: ${err.message}`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handleDeposit = async () => {
  //   if (!tokenId || !amount) {
  //     setError('Please enter token ID and amount');
  //     return;
  //   }

  //   setIsLoading(true);
  //   setError(null);
  //   setResult(null);

  //   try {
  //     const tx = depositTx.tx(parseInt(tokenId), BigInt(amount));
  //     const hash = await tx.signAndSend(selectedAccount?.address);
  //     setResult({ type: 'deposit', hash, tokenId: parseInt(tokenId), amount });
  //   } catch (err: any) {
  //     setError(`Error depositing: ${err.message}`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handleWithdraw = async () => {
  //   if (!tokenId || !amount) {
  //     setError('Please enter token ID and amount');
  //     return;
  //   }

  //   setIsLoading(true);
  //   setError(null);
  //   setResult(null);

  //   try {
  //     const tx = withdrawTx.tx(parseInt(tokenId), BigInt(amount));
  //     const hash = await tx.signAndSend(selectedAccount?.address);
  //     setResult({ type: 'withdraw', hash, tokenId: parseInt(tokenId), amount });
  //   } catch (err: any) {
  //     setError(`Error withdrawing: ${err.message}`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Token Management
          </CardTitle>
          <CardDescription>
            Add, remove, deposit, and withdraw tokens from the portfolio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Token IDs */}
          <div className="space-y-2">
            <Label>Current Token IDs</Label>
            <div className="bg-gray-50 p-4 rounded-lg">
              {isLoadingData ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : tokenIds ? (
                <div className="flex flex-wrap gap-2">
                  {tokenIds.map((id: number) => (
                    <span key={id} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {id}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-gray-500">No tokens</span>
              )}
            </div>
          </div>

          {/* Token Operations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Add/Remove Token */}
            <div className="space-y-4">
              <h3 className="font-medium">Add/Remove Tokens</h3>
              <div className="space-y-2">
                <Label>Token ID</Label>
                <Input
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  placeholder="Enter token ID"
                  type="number"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAddToken}
                  disabled={!tokenId || isLoading}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Token
                </Button>
                {/* Note: removeToken method doesn't exist in Portfolio contract API */}
                {/* <Button
                  onClick={handleRemoveToken}
                  disabled={!tokenId || isLoading}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Minus className="h-4 w-4" />
                  Remove Token
                </Button> */}
              </div>
            </div>

            {/* Deposit/Withdraw - Methods don't exist in Portfolio contract API */}
            {/* <div className="space-y-4">
              <h3 className="font-medium">Deposit/Withdraw</h3>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  type="number"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleDeposit}
                  disabled={!tokenId || !amount || isLoading}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Deposit
                </Button>
                <Button
                  onClick={handleWithdraw}
                  disabled={!tokenId || !amount || isLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Minus className="h-4 w-4" />
                  Withdraw
                </Button>
              </div>
            </div> */}
          </div>

          {/* Token Holding Info */}
          {tokenId && (
            <div className="space-y-2">
              <Label>Token Holding Info</Label>
              <div className="bg-gray-50 p-4 rounded-lg">
                {isLoadingData ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                ) : tokenHolding ? (
                  <div className="space-y-2">
                    <div><strong>Token ID:</strong> {tokenHolding.tokenId}</div>
                    <div><strong>Balance:</strong> {tokenHolding.balance?.toString() || 'N/A'}</div>
                    <div><strong>Weight:</strong> {tokenHolding.weight || 'N/A'}</div>
                  </div>
                ) : (
                  <span className="text-gray-500">No holding data</span>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                {result.type} transaction submitted: {result.hash}
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
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Token Management:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Add tokens to the portfolio for automated management</li>
              <li>Deposit tokens to increase portfolio value</li>
              <li>Withdraw tokens when needed</li>
              <li>All operations require owner permissions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
