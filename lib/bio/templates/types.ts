// lib/bio/templates/types.ts
import type { BlockInput } from "@/lib/bio/blocks";
import type { ThemeInput } from "@/lib/bio/theme";

export type BioTemplate = {
  id: string;
  name: string;
  category: string;
  description: string;
  profile: { displayName: string; bio: string };
  theme: ThemeInput;
  /** Blocks without ids — applyTemplate assigns fresh uuids on every use. */
  blocks: BlockInput[];
};
