import {
  getObjectWithJson,
  getOwnedObjectsByPackage,
  getOwnedObjectsByType,
} from "@evefrontier/dapp-kit";

function extractObjectIds(result: unknown): string[] {
  const nodes =
    ((result as { data?: { address?: { objects?: { nodes?: unknown[] } } } })
      .data?.address?.objects?.nodes as
      | Array<{ address?: string | null }>
      | undefined) || [];

  return nodes
    .map((node) => node.address || "")
    .filter((address): address is string => Boolean(address));
}

export async function fetchObjectData(objectId: string) {
  const result = await getObjectWithJson(objectId);
  return result.data?.object?.asMoveObject?.contents?.json || null;
}

export async function fetchOwnedObjectIdsByType(
  walletAddress: string,
  objectType: string,
): Promise<string[]> {
  if (!walletAddress || !objectType) return [];
  const result = await getOwnedObjectsByType(walletAddress, objectType);
  return extractObjectIds(result);
}

export async function fetchOwnedObjectIdsByPackage(
  walletAddress: string,
  packageId: string,
): Promise<string[]> {
  if (!walletAddress || !packageId) return [];
  const result = await getOwnedObjectsByPackage(walletAddress, packageId);
  return extractObjectIds(result);
}
