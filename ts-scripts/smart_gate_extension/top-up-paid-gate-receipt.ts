import "dotenv/config";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import { deriveObjectId } from "../utils/derive-object-id";
import { GAME_CHARACTER_B_ID } from "../utils/constants";
import {
    getEnvConfig,
    handleError,
    hydrateWorldConfig,
    initializeContext,
    requireEnv,
} from "../utils/helper";
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

async function topUpPaidGateReceipt(
    ctx: ReturnType<typeof initializeContext>,
    characterItemId: bigint,
    paymentMist: number
) {
    const { client, keypair, config, address } = ctx;
    const { builderPackageId, extensionConfigId } = resolveSmartGateExtensionIdsFromEnv();

    const registryId = requireEnv("PAID_GATE_FEE_REGISTRY_ID");
    const characterId = deriveObjectId(config.objectRegistry, characterItemId, config.packageId);

    const receiptId = await getOwnedGateReceiptId(client, address, builderPackageId);
    if (!receiptId) {
        throw new Error(
            "GateReceipt not found for this wallet. Run purchase-paid-gate-receipt first."
        );
    }

    const tx = new Transaction();
    const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(paymentMist)]);

    tx.moveCall({
        target: `${builderPackageId}::paid_gate::top_up_gate_receipt`,
        arguments: [
            tx.object(extensionConfigId),
            tx.object(registryId),
            tx.object(characterId),
            tx.object(receiptId),
            paymentCoin,
        ],
    });

    const result = await client.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
        options: { showEffects: true, showObjectChanges: true },
    });

    console.log("GateReceipt topped up:", receiptId);
    console.log("Transaction digest:", result.digest);
}

async function main() {
    console.log("============= Top Up Paid Gate Receipt ==============\n");
    try {
        const env = getEnvConfig();
        const playerKey = requireEnv("PLAYER_B_PRIVATE_KEY");
        const paymentMist = Number(process.env.PAID_GATE_TOPUP_MIST || DEFAULT_PAYMENT_MIST);
        if (!Number.isInteger(paymentMist) || paymentMist <= 0) {
            throw new Error("PAID_GATE_TOPUP_MIST must be a positive integer");
        }

        const ctx = initializeContext(env.network, playerKey);
        await hydrateWorldConfig(ctx);

        await topUpPaidGateReceipt(ctx, BigInt(GAME_CHARACTER_B_ID), paymentMist);
    } catch (error) {
        handleError(error);
    }
}

main();
