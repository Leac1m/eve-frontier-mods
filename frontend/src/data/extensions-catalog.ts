import { ExtensionEntry } from "../types/extensions";

export const BUILT_IN_EXTENSIONS: ExtensionEntry[] = [
  {
    id: "paid-gate",
    title: "Programmable Paid Gate",
    summary:
      "Collect SUI tolls through reusable receipts, then issue jump permits from paid uses.",
    type: "paid-gate",
    imageUrl:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    githubUrl: "https://github.com/leac1m/eve-frontier-mods",
    contractUrl: "https://suiexplorer.com/",
    tags: ["toll", "economy", "gate", "revenue"],
    guidedSteps: [
      "pnpm configure-rules",
      "pnpm create-paid-gate-fee-registry",
      "pnpm purchase-paid-gate-receipt",
      "pnpm issue-paid-jump-permit",
      "pnpm withdraw-paid-gate-fees",
    ],
    requiredEnv: [
      "BUILDER_PACKAGE_ID",
      "EXTENSION_CONFIG_ID",
      "PAID_GATE_FEE_REGISTRY_ID",
      "PLAYER_A_PRIVATE_KEY",
      "PLAYER_B_PRIVATE_KEY",
    ],
    source: "catalog",
    chainBacked: false,
    chainObjectCount: 0,
  },
  {
    id: "corpse-gate",
    title: "Corpse Gate Bounty",
    summary:
      "Issue jump permits when players deposit required bounty items from storage.",
    type: "corpse-gate",
    imageUrl:
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80",
    githubUrl: "https://github.com/leac1m/eve-frontier-mods",
    contractUrl: "https://suiexplorer.com/",
    tags: ["bounty", "loot", "gates", "access-control"],
    guidedSteps: [
      "pnpm configure-rules",
      "pnpm authorise-gate-extension",
      "pnpm authorise-storage-unit-extension",
      "pnpm collect-corpse-bounty",
      "pnpm jump-with-permit",
    ],
    requiredEnv: [
      "BUILDER_PACKAGE_ID",
      "EXTENSION_CONFIG_ID",
      "PLAYER_A_PRIVATE_KEY",
      "PLAYER_B_PRIVATE_KEY",
    ],
    source: "catalog",
    chainBacked: false,
    chainObjectCount: 0,
  },
];
