import { bcs } from "@mysten/sui/bcs";
import { deriveObjectID } from "@mysten/sui/utils";

const TenantItemId = bcs.struct("TenantItemId", {
  id: bcs.u64(),
  tenant: bcs.string(),
});

export function deriveObjectId(
  registryId: string,
  itemId: number | bigint,
  packageId: string,
  tenant: string,
): string {
  const key = {
    id: BigInt(itemId),
    tenant,
  };

  const serializedKey = TenantItemId.serialize(key).toBytes();
  const typeTag = `${packageId}::in_game_id::TenantItemId`;
  return deriveObjectID(registryId, typeTag, serializedKey);
}
