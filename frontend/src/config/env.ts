export type TestPlayerId = "A" | "B";

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return fallback;
}

function parsePlayer(value: string | undefined, fallback: TestPlayerId): TestPlayerId {
  if (!value) return fallback;
  const normalized = value.trim().toUpperCase();
  return normalized === "B" ? "B" : "A";
}

function parseOptionalPositiveInt(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export const appEnv = {
  worldPackageId: import.meta.env.VITE_EVE_WORLD_PACKAGE_ID || "",
  builderPackageId: import.meta.env.VITE_BUILDER_PACKAGE_ID || "",
  showTestPlayerSelector: parseBool(
    import.meta.env.VITE_SHOW_TEST_PLAYER_SELECTOR,
    true,
  ),
  defaultTestPlayer: parsePlayer(import.meta.env.VITE_DEFAULT_TEST_PLAYER, "A"),
  testPlayerAddresses: {
    A: import.meta.env.VITE_TEST_PLAYER_A_ADDRESS || "",
    B: import.meta.env.VITE_TEST_PLAYER_B_ADDRESS || "",
  },
  testPlayerCharacterItemIds: {
    A: parseOptionalPositiveInt(import.meta.env.VITE_TEST_PLAYER_A_CHARACTER_ITEM_ID),
    B: parseOptionalPositiveInt(import.meta.env.VITE_TEST_PLAYER_B_CHARACTER_ITEM_ID),
  },
  objectId: import.meta.env.VITE_OBJECT_ID || "",
};
