// lib/bio/schemas.ts
// Request schemas for /api/bio/* (shared by client forms and route handlers).
import { z } from "zod";
import { bioDocumentSchema } from "./blocks";
import { themeSchema } from "./theme";
import { checkUsername } from "./reserved";
import { TEMPLATE_IDS } from "./templates";

export const usernameField = z.string().transform((v, ctx) => {
  const r = checkUsername(v);
  if (r.status !== "ok") {
    ctx.addIssue({ code: "custom", message: r.message });
    return z.NEVER;
  }
  return r.username;
});

export const createPageSchema = z.object({
  username: usernameField,
  template_id: z
    .string()
    .optional()
    .refine((id) => id === undefined || id === "blank" || TEMPLATE_IDS.includes(id), { message: "Unknown template" }),
});

/** Autosave payload. `expected_version` guards against overwriting another tab's edits. */
export const updatePageSchema = z
  .object({
    expected_version: z.number().int().positive(),
    display_name: z.string().trim().max(60).optional(),
    bio: z.string().trim().max(160).optional(),
    theme: themeSchema.optional(),
    draft: bioDocumentSchema.optional(),
  })
  .refine((v) => v.display_name !== undefined || v.bio !== undefined || v.theme || v.draft, {
    message: "Nothing to update",
  });

export const pageIdSchema = z.uuid();

/** Columns an owner may read (never select("*")). */
export const OWNER_PAGE_COLUMNS =
  "id, username, display_name, bio, avatar_path, theme, draft, published, is_published, published_at, version, is_suspended, created_at, updated_at";

export type OwnerPageRow = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_path: string | null;
  theme: unknown;
  draft: unknown;
  published: unknown;
  is_published: boolean;
  published_at: string | null;
  version: number;
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
};
