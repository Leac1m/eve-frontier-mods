export type ExtensionType = "paid-gate" | "corpse-gate";

export type ExtensionEntry = {
  id: string;
  title: string;
  summary: string;
  type: ExtensionType;
  imageUrl: string;
  githubUrl: string;
  contractUrl: string;
  tags: string[];
  guidedSteps: string[];
  requiredEnv: string[];
  source: "catalog" | "community";
  chainBacked: boolean;
  chainObjectCount: number;
  chainObjectType?: string;
};

export type SubmissionFormData = {
  title: string;
  summary: string;
  type: ExtensionType;
  imageUrl: string;
  githubUrl: string;
  contractUrl: string;
  guidedCommand: string;
};
