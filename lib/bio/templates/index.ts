// lib/bio/templates/index.ts
// Free starter templates.
//
// TODO(Phase 1): when POST /api/bio/pages is built, accept an optional `template_id`:
//   - validate with `templateIdSchema` (unknown id -> 400)
//   - create the page from applyTemplate(id): display_name, bio, theme, draft
import { z } from "zod";
import { business } from "./business";
import { creator } from "./creator";
import { developer } from "./developer";
import { minimal } from "./minimal";
import { neon } from "./neon";
import type { BioTemplate } from "./types";

export const TEMPLATES: readonly BioTemplate[] = [minimal, creator, developer, business, neon];

export function getTemplate(id: string): BioTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);

/** Validates a `template_id` request field against the known templates. */
export const templateIdSchema = z
  .string()
  .refine((id) => TEMPLATE_IDS.includes(id), { message: "Unknown template" });

export type { BioTemplate } from "./types";
