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

function resolveWithdrawAmount(): number | null {
    const raw = process.env.PAID_GATE_WITHDRAW_MIST;
    if (!raw) return null;

    const amount = Number(raw);
    if (!Number.isInteger(amount) || amount <= 0) {
        throw new Error("PAID_GATE_WITHDRAW_MIST must be a positive integer");
    }

    return amount;
}

async function withdrawPaidGateFees(
    ctx: ReturnType<typeof initializeContext>,
    gateItemId: bigint,
    characterItemId: bigint,
    amountMist: number | null
) {
    const { client, keypair, config, address } = ctx;
    const builderPackageId = requireBuilderPackageId();

    const registryId = requireEnv("PAID_GATE_FEE_REGISTRY_ID");
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

    const amountArg = tx.pure.option("u64", amountMist);

    const withdrawnCoin = tx.moveCall({
        target: `${builderPackageId}::paid_gate::withdraw_fees`,
        arguments: [tx.object(registryId), gateOwnerCap, amountArg],
    });

    tx.transferObjects([withdrawnCoin], tx.pure.address(address));

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

    console.log("Paid-gate fees withdrawn from registry:", registryId);
    console.log("Amount (mist):", amountMist ?? "ALL");
    console.log("Transaction digest:", result.digest);
}

async function main() {
    console.log("============= Withdraw Paid Gate Fees ==============\n");
    try {
        const env = getEnvConfig();
        const playerKey = requireEnv("PLAYER_A_PRIVATE_KEY");
        const ctx = initializeContext(env.network, playerKey);
        await hydrateWorldConfig(ctx);

        const amountMist = resolveWithdrawAmount();
        await withdrawPaidGateFees(ctx, GATE_ITEM_ID_1, BigInt(GAME_CHARACTER_ID), amountMist);
    } catch (error) {
        handleError(error);
    }
}

main();
