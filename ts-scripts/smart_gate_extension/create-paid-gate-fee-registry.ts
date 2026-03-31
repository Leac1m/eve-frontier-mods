import "dotenv/config";
import { Transaction } from "@mysten/sui/transactions";
import { MODULES } from "../utils/config";
import { deriveObjectId } from "../utils/derive-object-id";
import { GAME_CHARACTER_ID, GATE_ITEM_ID_1 } from "../utils/constants";
import {
    getEnvConfig,
    handleError,
    hydrateWorldConfig,
    initializeContext,
    requireEnv,
} from "../utils/helper";
import { requireBuilderPackageId } from "./extension-ids";
import { getOwnerCap as getGateOwnerCap } from "../helpers/gate";

type ObjectChangeSummary = {
    type?: string;
    objectType?: string;
    objectId?: string;
};

function extractCreatedSharedObjectId(
    objectChanges: readonly ObjectChangeSummary[] | null | undefined,
    objectType: string
): string | null {
    const created = objectChanges?.find(
        (change) => change.type === "created" && change.objectType === objectType
    );
    return created?.objectId ?? null;
}

async function createPaidGateFeeRegistry(
    ctx: ReturnType<typeof initializeContext>,
    gateItemId: bigint,
    characterItemId: bigint
) {
    const { client, keypair, config, address } = ctx;
    const builderPackageId = requireBuilderPackageId();

    const characterId = deriveObjectId(config.objectRegistry, characterItemId, config.packageId);
    const gateId = deriveObjectId(config.objectRegistry, gateItemId, config.packageId);

    const gateOwnerCapId = await getGateOwnerCap(gateId, client, config, address);
    if (!gateOwnerCapId) {
        throw new Error(`OwnerCap not found for gate ${gateId}`);
    }

    const tx = new Transaction();

    const [gateOwnerCap, returnReceipt] = tx.moveCall({
        target: `${config.packageId}::${MODULES.CHARACTER}::borrow_owner_cap`,
        typeArguments: [`${config.packageId}::${MODULES.GATE}::Gate`],
        arguments: [tx.object(characterId), tx.object(gateOwnerCapId)],
    });

    tx.moveCall({
        target: `${builderPackageId}::paid_gate::create_fee_registry`,
        arguments: [tx.object(gateId), gateOwnerCap],
    });

    tx.moveCall({
        target: `${config.packageId}::${MODULES.CHARACTER}::return_owner_cap`,
        typeArguments: [`${config.packageId}::${MODULES.GATE}::Gate`],
        arguments: [tx.object(characterId), gateOwnerCap, returnReceipt],
    });

    const result = await client.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
        options: { showEffects: true, showObjectChanges: true },
    });

    const registryType = `${builderPackageId}::paid_gate::FeeRegistry`;
    const feeRegistryId = extractCreatedSharedObjectId(result.objectChanges, registryType);

    console.log("FeeRegistry created for gate:", gateId);
    if (feeRegistryId) {
        console.log("FeeRegistry ID:", feeRegistryId);
        console.log("Set in .env as PAID_GATE_FEE_REGISTRY_ID for next steps.");
    } else {
        console.log(
            "FeeRegistry ID not found in object changes. Inspect tx in explorer:",
            result.digest
        );
    }
    console.log("Transaction digest:", result.digest);
}

async function main() {
    console.log("============= Create Paid Gate Fee Registry ==============\n");
    try {
        const env = getEnvConfig();
        const playerKey = requireEnv("PLAYER_B_PRIVATE_KEY");
        const ctx = initializeContext(env.network, playerKey);
        await hydrateWorldConfig(ctx);

        await createPaidGateFeeRegistry(ctx, GATE_ITEM_ID_1, BigInt(GAME_CHARACTER_ID));
    } catch (error) {
        handleError(error);
    }
}

main();
