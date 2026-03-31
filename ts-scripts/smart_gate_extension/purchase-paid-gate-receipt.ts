import "dotenv/config";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import { deriveObjectId } from "../utils/derive-object-id";
import { GAME_CHARACTER_ID } from "../utils/constants";
import { getEnvConfig, handleError, hydrateWorldConfig, initializeContext, requireEnv } from "../utils/helper";
import { resolveSmartGateExtensionIdsFromEnv } from "./extension-ids";

const DEFAULT_PAYMENT_MIST = 10000;

async function getOwnedGateReceiptId(
    client: SuiJsonRpcClient,
    owner: string,
    builderPackageId: string
): Promise<string | null> {
    const type = `${builderPackageId}::paid_gate::GateReceipt`;
    const res = await client.getOwnedObjects({
        owner,
        filter: { StructType: type },
        limit: 1,
    });
    const first = res.data?.[0]?.data;
    return first?.objectId ?? null;
}

async function purchasePaidGateReceipt(
    ctx: ReturnType<typeof initializeContext>,
    characterItemId: bigint,
    paymentMist: number
) {
    const { client, keypair, config, address } = ctx;
    const { builderPackageId, extensionConfigId } = resolveSmartGateExtensionIdsFromEnv();

    const registryId = requireEnv("PAID_GATE_FEE_REGISTRY_ID");
    const characterId = deriveObjectId(config.objectRegistry, characterItemId, config.packageId);

    const tx = new Transaction();
    const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(paymentMist)]);

    const receipt = tx.moveCall({
        target: `${builderPackageId}::paid_gate::purchase_gate_receipt`,
        arguments: [
            tx.object(extensionConfigId),
            tx.object(registryId),
            tx.object(characterId),
            paymentCoin,
        ],
    });

    tx.transferObjects([receipt], tx.pure.address(address));

    const result = await client.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
        options: { showEffects: true, showObjectChanges: true },
    });

    const receiptId = await getOwnedGateReceiptId(client, address, builderPackageId);
    if (receiptId) {
        console.log("GateReceipt ID:", receiptId);
    } else {
        console.log("GateReceipt was not found via owner lookup yet.");
    }
    console.log("Transaction digest:", result.digest);
}

async function main() {
    console.log("============= Purchase Paid Gate Receipt ==============\n");
    try {
        const env = getEnvConfig();
        const playerKey = requireEnv("PLAYER_A_PRIVATE_KEY");
        const paymentMist = Number(process.env.PAID_GATE_PAYMENT_MIST || DEFAULT_PAYMENT_MIST);
        if (!Number.isInteger(paymentMist) || paymentMist <= 0) {
            throw new Error("PAID_GATE_PAYMENT_MIST must be a positive integer");
        }

        const ctx = initializeContext(env.network, playerKey);
        await hydrateWorldConfig(ctx);

        await purchasePaidGateReceipt(ctx, BigInt(GAME_CHARACTER_ID), paymentMist);
    } catch (error) {
        handleError(error);
    }
}

main();
