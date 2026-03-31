import { ExtensionEntry, SubmissionFormData } from "../types/extensions";

const COMMUNITY_STORAGE_KEY = "eve-frontier-community-extensions";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function getCommunityExtensions(): ExtensionEntry[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(COMMUNITY_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as ExtensionEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveCommunityExtension(
  formData: SubmissionFormData,
): ExtensionEntry {
  const idBase = slugify(formData.title) || "community-extension";
  const id = `${idBase}-${Date.now()}`;

  const entry: ExtensionEntry = {
    id,
    title: formData.title.trim(),
    summary: formData.summary.trim(),
    type: formData.type,
    imageUrl: formData.imageUrl.trim(),
    githubUrl: formData.githubUrl.trim(),
    contractUrl: formData.contractUrl.trim(),
    tags: ["community"],
    guidedSteps: [formData.guidedCommand.trim()],
    requiredEnv: [],
    source: "community",
    chainBacked: false,
    chainObjectCount: 0,
  };

  const current = getCommunityExtensions();
  const next = [entry, ...current];

  if (typeof window !== "undefined") {
    window.localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(next));
  }

  return entry;
}
