// lib/bio/templates/index.ts
// Free starter templates (Blank is offered by the UI on top of these).
import { z } from "zod";
import type { ThemeInput } from "@/lib/bio/theme";
import { contactCard } from "./contact-card";
import { LINK_HUB_LIGHT, linkHub } from "./link-hub";
import type { BioTemplate } from "./types";

export const TEMPLATES: readonly BioTemplate[] = [linkHub, contactCard];

export function getTemplate(id: string): BioTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);

/** Validates a `template_id` request field against the known templates. */
export const templateIdSchema = z
  .string()
  .refine((id) => TEMPLATE_IDS.includes(id), { message: "Unknown template" });

/** One-click looks in the Design tab (template themes + variants). */
export const THEME_PRESETS: readonly { id: string; name: string; theme: ThemeInput }[] = [
  { id: "link-hub-dark", name: "Link Hub Dark", theme: linkHub.theme },
  { id: "link-hub-light", name: "Link Hub Light", theme: LINK_HUB_LIGHT },
  { id: "contact-card", name: "Contact Card", theme: contactCard.theme },
];

export type { BioTemplate } from "./types";
