import {
  getAssemblyWithOwner,
  getObjectWithJson,
  getObjectsByType,
  getOwnedObjectsByPackage,
  getOwnedObjectsByType,
} from "@evefrontier/dapp-kit";
import { BUILT_IN_EXTENSIONS } from "./data/extensions-catalog";
import { appEnv } from "./config/env";
import type { ExtensionEntry } from "./types/extensions";

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

export type AssemblySummary = {
  id: string;
  name: string;
  state: string;
  type: string;
  ownerName: string;
};

async function fetchTypeObjectCount(objectType: string): Promise<number> {
  if (!objectType) return 0;
  const result = await getObjectsByType(objectType, { first: 50 });
  const nodes = result.data?.objects?.nodes as
    | Array<{ address?: string | null }>
    | undefined;
  return nodes?.length || 0;
}

export async function fetchChainBackedExtensions(): Promise<ExtensionEntry[]> {
  const paidType = appEnv.builderPackageId
    ? `${appEnv.builderPackageId}::paid_gate::FeeRegistry`
    : "";
  const corpseSignalType = appEnv.worldPackageId
    ? `${appEnv.worldPackageId}::gate::JumpPermit`
    : "";

  const [paidCount, corpseCount] = await Promise.all([
    fetchTypeObjectCount(paidType),
    fetchTypeObjectCount(corpseSignalType),
  ]);

  return BUILT_IN_EXTENSIONS.map((extension) => {
    if (extension.id === "paid-gate") {
      return {
        ...extension,
        chainBacked: paidCount > 0,
        chainObjectCount: paidCount,
        chainObjectType: paidType || undefined,
      };
    }

    return {
      ...extension,
      chainBacked: corpseCount > 0,
      chainObjectCount: corpseCount,
      chainObjectType: corpseSignalType || undefined,
    };
  });
}

export async function fetchOwnedAssemblySummaries(
  walletAddress: string,
  worldPackageId: string,
): Promise<AssemblySummary[]> {
  if (!walletAddress || !worldPackageId) return [];

  const assemblyType = `${worldPackageId}::assembly::Assembly`;
  const assemblyIds = await fetchOwnedObjectIdsByType(
    walletAddress,
    assemblyType,
  );

  const summaries = await Promise.all(
    assemblyIds.slice(0, 8).map(async (id): Promise<AssemblySummary | null> => {
      const result = await getAssemblyWithOwner(id);
      const contents = result.moveObject?.contents?.json;
      if (!contents) return null;

      return {
        id,
        name: String(contents.name || "Assembly"),
        state: String(contents.state || "unknown"),
        type: String(result.moveObject?.contents?.type?.repr || assemblyType),
        ownerName: result.assemblyOwner?.name || "Unknown",
      };
    }),
  );

  return summaries.filter((entry): entry is AssemblySummary => Boolean(entry));
}

export async function fetchOwnedGateReceiptId(
  walletAddress: string,
  builderPackageId: string,
): Promise<string | null> {
  if (!walletAddress || !builderPackageId) return null;
  const type = `${builderPackageId}::paid_gate::GateReceipt`;
  const ids = await fetchOwnedObjectIdsByType(walletAddress, type);
  return ids[0] || null;
}
