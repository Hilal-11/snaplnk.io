// lib/bio/publish.ts
// Pre-publish validation. Errors block publishing; warnings are shown but allowed.
import { BLOCK_TYPE_LABELS, bioDocumentSchema, getPlaceholderBlocks, getRenderableBlocks } from "./blocks";
import { getThemeContrastIssues, themeSchema } from "./theme";
import { formatZodError } from "@/lib/api/helpers";

export type PublishIssue = { message: string; blockId?: string };
export type PublishCheck = { errors: PublishIssue[]; warnings: PublishIssue[] };

export function validateForPublish(input: { displayName: string; theme: unknown; draft: unknown }): PublishCheck {
  const errors: PublishIssue[] = [];
  const warnings: PublishIssue[] = [];

  const doc = bioDocumentSchema.safeParse(input.draft);
  if (!doc.success) {
    for (const [path, msgs] of Object.entries(formatZodError(doc.error))) {
      const idx = /^blocks\.(\d+)/.exec(path)?.[1];
      const raw = input.draft as { blocks?: { id?: string }[] };
      const blockId = idx !== undefined ? raw?.blocks?.[Number(idx)]?.id : undefined;
      errors.push({ message: `${path.replace(/^blocks\.\d+\.?/, "") || "Block"}: ${msgs[0]}`, blockId });
    }
  }

  const theme = themeSchema.safeParse(input.theme);
  if (!theme.success) errors.push({ message: "Theme is invalid — pick a preset to reset it." });

  if (!input.displayName.trim()) errors.push({ message: "Add a display name in Profile." });

  if (doc.success) {
    for (const b of getPlaceholderBlocks(doc.data.blocks)) {
      const message =
        b.type === "link"
          ? `"${b.title}" still uses a sample link. Replace its URL or hide it.`
          : `${BLOCK_TYPE_LABELS[b.type]} still has sample details. Edit them or hide the block.`;
      errors.push({ message, blockId: b.id });
    }
    if (getRenderableBlocks(doc.data.blocks).length === 0) {
      errors.push({ message: "Add at least one visible block." });
    }
  }

  if (theme.success) {
    for (const issue of getThemeContrastIssues(theme.data)) {
      warnings.push({ message: `Low contrast: ${issue.pair} is ${issue.ratio}:1 (aim for ${issue.required}:1).` });
    }
  }
  return { errors, warnings };
}
