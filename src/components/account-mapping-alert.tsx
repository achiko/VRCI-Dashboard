"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { txToaster } from "@/utils/txToaster";
import { AlertTriangle, Link2, Loader2 } from "lucide-react";
import { useCheckMappedAccount, useTx, useTypink } from "typink";

export function AccountMappingAlert() {
  const { connectedAccount } = useTypink();
  const { isMapped, isLoading, error, evmAddress, refresh } =
    useCheckMappedAccount();
  const mapAccountTx = useTx((tx) => tx.revive.mapAccount);

  if (!connectedAccount?.address || isMapped === true) return null;
  if (isMapped === undefined && !error) return null;

  const handleMapAccount = async () => {
    const toaster = txToaster("Mapping account...");

    try {
      await mapAccountTx.signAndSend({
        callback: (result) => {
          toaster.onTxProgress(result);

          const isIncluded =
            result.status.type === "BestChainBlockIncluded" ||
            result.status.type === "Finalized";

          if (isIncluded && !result.dispatchError) {
            refresh().catch(console.error);
          }
        },
      });
    } catch (e) {
      toaster.onTxError(e instanceof Error ? e : new Error(String(e)));
    }
  };

  return (
    <Alert className="border-amber-200 bg-amber-50 text-amber-950">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Account mapping required</AlertTitle>
      <AlertDescription className="gap-3 sm:flex sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p>
            Your wallet needs a one-time Revive mapping before it can call
            contracts.
          </p>
          {evmAddress ? (
            <p className="font-mono text-xs text-amber-800 break-all">
              Revive address: {evmAddress}
            </p>
          ) : null}
          {error ? (
            <p className="text-xs text-destructive">
              Could not check mapping status: {error.message}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleMapAccount}
          disabled={isLoading || mapAccountTx.inProgress}
          className="mt-2 shrink-0 sm:mt-0"
        >
          {mapAccountTx.inProgress ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
          Map account
        </Button>
      </AlertDescription>
    </Alert>
  );
}
