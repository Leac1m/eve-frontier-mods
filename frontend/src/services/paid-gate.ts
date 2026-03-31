import type { DAppKit } from "@mysten/dapp-kit-core";
import { Transaction } from "@mysten/sui/transactions";
import { appEnv } from "../config/env";
import { deriveObjectId } from "../utils/derive-object-id";

function requireConfig(value: string, name: string): string {
  if (!value) {
    throw new Error(`${name} is required in frontend .env`);
  }
  return value;
}

function requireItemId(value: number | null, name: string): number {
  if (!value) {
    throw new Error(`${name} is required in frontend .env`);
  }
  return value;
}

function buildIssuePaidPermitTransaction(receiptId: string): Transaction {
  const builderPackageId = requireConfig(
    appEnv.builderPackageId,
    "VITE_BUILDER_PACKAGE_ID",
  );
  const extensionConfigId = requireConfig(
    appEnv.extensionConfigId,
    "VITE_EXTENSION_CONFIG_ID",
  );
  const objectRegistryId = requireConfig(
    appEnv.objectRegistryId,
    "VITE_OBJECT_REGISTRY_ID",
  );
  const worldPackageId = requireConfig(
    appEnv.worldPackageId,
    "VITE_EVE_WORLD_PACKAGE_ID",
  );

  const sourceGateItemId = requireItemId(
    appEnv.sourceGateItemId,
    "VITE_SOURCE_GATE_ITEM_ID",
  );
  const destinationGateItemId = requireItemId(
    appEnv.destinationGateItemId,
    "VITE_DESTINATION_GATE_ITEM_ID",
  );
  const characterItemId = requireItemId(
    appEnv.characterItemId,
    "VITE_CHARACTER_ITEM_ID",
  );

  const sourceGateId = deriveObjectId(
    objectRegistryId,
    sourceGateItemId,
    worldPackageId,
    appEnv.tenant,
  );
  const destinationGateId = deriveObjectId(
    objectRegistryId,
    destinationGateItemId,
    worldPackageId,
    appEnv.tenant,
  );
  const characterId = deriveObjectId(
    objectRegistryId,
    characterItemId,
    worldPackageId,
    appEnv.tenant,
  );

  const tx = new Transaction();
  tx.moveCall({
    target: `${builderPackageId}::paid_gate::issue_jump_permit_with_receipt`,
    arguments: [
      tx.object(extensionConfigId),
      tx.object(sourceGateId),
      tx.object(destinationGateId),
      tx.object(characterId),
      tx.object(receiptId),
      tx.object("0x6"),
    ],
  });

  return tx;
}

export async function executeIssuePaidPermit(
  dAppKit: DAppKit,
  receiptId: string,
): Promise<string> {
  const tx = buildIssuePaidPermitTransaction(receiptId);
  const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
  if (result.$kind === "Transaction") {
    return result.Transaction.digest;
  }
  return result.FailedTransaction.digest;
}
