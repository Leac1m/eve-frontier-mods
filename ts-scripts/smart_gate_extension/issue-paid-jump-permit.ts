import "dotenv/config";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import { deriveObjectId } from "../utils/derive-object-id";
import {
    GAME_CHARACTER_B_ID,
    GATE_ITEM_ID_1,
    GATE_ITEM_ID_2,
    CLOCK_OBJECT_ID,
} from "../utils/constants";
import {
    getEnvConfig,
    handleError,
    hydrateWorldConfig,
    initializeContext,
    requireEnv,
} from "../utils/helper";
import { resolveSmartGateExtensionIdsFromEnv } from "./extension-ids";

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

async function issuePaidJumpPermit(
    ctx: ReturnType<typeof initializeContext>,
    sourceGateItemId: bigint,
    destinationGateItemId: bigint,
    characterItemId: bigint
) {
    const { client, keypair, config, address } = ctx;
    const { builderPackageId, extensionConfigId } = resolveSmartGateExtensionIdsFromEnv();

    const sourceGateId = deriveObjectId(config.objectRegistry, sourceGateItemId, config.packageId);
    const destinationGateId = deriveObjectId(
        config.objectRegistry,
        destinationGateItemId,
        config.packageId
    );
    const characterId = deriveObjectId(config.objectRegistry, characterItemId, config.packageId);

    const receiptId = await getOwnedGateReceiptId(client, address, builderPackageId);
    if (!receiptId) {
        throw new Error(
            "GateReceipt not found for this wallet. Run purchase-paid-gate-receipt first."
        );
    }

    const tx = new Transaction();
    tx.moveCall({
        target: `${builderPackageId}::paid_gate::issue_jump_permit_with_receipt`,
        arguments: [
            tx.object(extensionConfigId),
            tx.object(sourceGateId),
            tx.object(destinationGateId),
            tx.object(characterId),
            tx.object(receiptId),
            tx.object(CLOCK_OBJECT_ID),
        ],
    });

    const result = await client.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
        options: { showEffects: true, showObjectChanges: true, showEvents: true },
    });

    console.log("Paid-gate jump permit issued using GateReceipt:", receiptId);
    console.log("Transaction digest:", result.digest);
}

async function main() {
    console.log("============= Issue Paid Jump Permit ==============\n");
    try {
        const env = getEnvConfig();
        const playerKey = requireEnv("PLAYER_B_PRIVATE_KEY");
        const ctx = initializeContext(env.network, playerKey);
        await hydrateWorldConfig(ctx);

        await issuePaidJumpPermit(ctx, GATE_ITEM_ID_1, GATE_ITEM_ID_2, BigInt(GAME_CHARACTER_B_ID));
    } catch (error) {
        handleError(error);
    }
}

main();
