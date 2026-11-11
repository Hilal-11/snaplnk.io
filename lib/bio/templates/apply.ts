// lib/bio/templates/apply.ts
import { BIO_SCHEMA_VERSION, bioDocumentSchema, type BioDocument } from "@/lib/bio/blocks";
import { themeSchema, type Theme } from "@/lib/bio/theme";
import { getTemplate } from "./index";

export type AppliedTemplate = {
  profile: { displayName: string; bio: string };
  theme: Theme;
  draft: BioDocument;
};

/**
 * Returns a fresh, validated copy of a template ready to store on a new page.
 * The template is deep-cloned and every block gets a new crypto.randomUUID() id,
 * so no two pages (or two calls) ever share block ids. Returns null for unknown ids.
 */
export function applyTemplate(id: string): AppliedTemplate | null {
  const template = getTemplate(id);
  if (!template) return null;

  const copy = structuredClone(template);
  const draft = bioDocumentSchema.parse({
    schema_version: BIO_SCHEMA_VERSION,
    blocks: copy.blocks.map((b) => ({ ...b, id: crypto.randomUUID() })),
  });

  return {
    profile: copy.profile,
    theme: themeSchema.parse(copy.theme),
    draft,
  };
}
