function parseOptionalPositiveInt(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export const appEnv = {
  worldPackageId: import.meta.env.VITE_EVE_WORLD_PACKAGE_ID || "",
  builderPackageId: import.meta.env.VITE_BUILDER_PACKAGE_ID || "",
  extensionConfigId: import.meta.env.VITE_EXTENSION_CONFIG_ID || "",
  objectRegistryId: import.meta.env.VITE_OBJECT_REGISTRY_ID || "",
  feeRegistryId: import.meta.env.VITE_PAID_GATE_FEE_REGISTRY_ID || "",
  tenant: import.meta.env.VITE_TENANT || "dev",
  sourceGateItemId: parseOptionalPositiveInt(import.meta.env.VITE_SOURCE_GATE_ITEM_ID),
  destinationGateItemId: parseOptionalPositiveInt(
    import.meta.env.VITE_DESTINATION_GATE_ITEM_ID,
  ),
  characterItemId: parseOptionalPositiveInt(import.meta.env.VITE_CHARACTER_ITEM_ID),
  objectId: import.meta.env.VITE_OBJECT_ID || "",
};
