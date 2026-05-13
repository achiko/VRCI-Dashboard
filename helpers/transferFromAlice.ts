import { ApiPromise, WsProvider } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import { BN } from "@polkadot/util";
import type { AccountInfo } from "@polkadot/types/interfaces";
import { cryptoWaitReady } from "@polkadot/util-crypto";

// ============================================================================
// CONFIGURE HERE
// ============================================================================
const RECIPIENT_ADDRESS = "5GKTbD7t2HX6c1NBR9EuRz35v9Gw3VEQJSxaUcJGqZ5BE3NA";
const AMOUNT_DOT = "10"; // human-readable amount, converted to planck using chain decimals
const RPC_URL = "ws://localhost:9944";
// ============================================================================

async function main() {
  await cryptoWaitReady();

  const provider = new WsProvider(RPC_URL);
  const api = await ApiPromise.create({ provider });

  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version(),
  ]);
  console.log(`Connected to ${chain} via ${nodeName} v${nodeVersion}`);

  const decimals = api.registry.chainDecimals[0] ?? 10;
  const symbol = api.registry.chainTokens[0] ?? "DOT";
  const [whole, frac = ""] = AMOUNT_DOT.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const amountPlanck = new BN(whole + fracPadded);

  const keyring = new Keyring({ type: "sr25519" });
  const alice = keyring.addFromUri("//Alice");
  console.log(`Sender (Alice): ${alice.address}`);
  console.log(`Recipient:      ${RECIPIENT_ADDRESS}`);
  console.log(`Amount:         ${AMOUNT_DOT} ${symbol} (${amountPlanck.toString()} planck, ${decimals} decimals)`);

  const { data: senderBalance } = await api.query.system.account(
    alice.address,
  ) as AccountInfo;
  console.log(`Alice free balance before: ${senderBalance.free.toString()}`);

  const tx = api.tx.balances.transferKeepAlive(RECIPIENT_ADDRESS, amountPlanck);

  const blockHash = await new Promise<string>((resolve, reject) => {
    tx.signAndSend(alice, ({ status, dispatchError, txHash }) => {
      if (dispatchError) {
        if (dispatchError.isModule) {
          const decoded = api.registry.findMetaError(dispatchError.asModule);
          reject(new Error(`${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`));
        } else {
          reject(new Error(dispatchError.toString()));
        }
        return;
      }
      if (status.isInBlock) {
        console.log(`Included in block ${status.asInBlock.toHex()} (tx ${txHash.toHex()})`);
      }
      if (status.isFinalized) {
        resolve(status.asFinalized.toHex());
      }
    }).catch(reject);
  });

  console.log(`Finalized at block ${blockHash}`);

  const { data: recipientBalance } = await api.query.system.account(
    RECIPIENT_ADDRESS,
  ) as AccountInfo;
  console.log(`Recipient free balance after: ${recipientBalance.free.toString()}`);

  await api.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
