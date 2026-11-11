// lib/bio/blocks.ts
// Bio page block model (schema_version 1). Shared by the API, editor and renderer.
// Blocks live in bio_pages.draft / bio_pages.published as { schema_version, blocks }.
// Every block has a stable uuid `id` so per-block analytics survive reorders and edits.
import { z } from "zod";
import { validateDestinationUrl } from "@/lib/validators/url";

export const BIO_SCHEMA_VERSION = 1 as const;
export const MAX_BLOCKS_PER_PAGE = 200; // hard ceiling; plan limits (lib/bio/plans.ts) are lower

// ---------- field helpers ----------

/** http(s) URL that passes the same checks as short-link destinations. */
const safeUrl = z
  .string()
  .trim()
  .max(2048)
  .superRefine((value, ctx) => {
    const r = validateDestinationUrl(value);
    if (!r.ok) ctx.addIssue({ code: "custom", message: r.error });
  });

/** Same as safeUrl, but "" is allowed (an empty slot the user hasn't filled yet). */
const optionalSafeUrl = z.union([z.literal(""), safeUrl]);

const blockBase = {
  id: z.uuid(),
  /** Hidden blocks stay in the draft but are never rendered publicly. */
  hidden: z.boolean().optional(),
};

// ---------- block types ----------

export const linkBlockSchema = z.object({
  ...blockBase,
  type: z.literal("link"),
  title: z.string().trim().min(1).max(80),
  url: safeUrl,
  highlight: z.boolean().optional(),
  badge: z.string().trim().min(1).max(16).optional(),
  /** Template sample link — publishing is blocked until the user replaces it. */
  placeholder: z.boolean().optional(),
  show_from: z.iso.datetime().optional(),
  show_until: z.iso.datetime().optional(),
});

export const headingBlockSchema = z.object({
  ...blockBase,
  type: z.literal("heading"),
  text: z.string().trim().min(1).max(80),
});

export const textBlockSchema = z.object({
  ...blockBase,
  type: z.literal("text"),
  /** Markdown-lite (bold, italic, links, line breaks) — rendered by a safe renderer, never as HTML. */
  text: z.string().trim().min(1).max(500),
});

export const dividerBlockSchema = z.object({
  ...blockBase,
  type: z.literal("divider"),
  style: z.enum(["line", "dashed", "dots", "space"]),
});

export const SOCIAL_PLATFORMS = [
  "instagram", "x", "youtube", "linkedin", "github", "tiktok", "facebook",
  "whatsapp", "telegram", "email", "phone", "website",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const socialBlockSchema = z.object({
  ...blockBase,
  type: z.literal("social"),
  items: z
    .array(
      z.object({
        platform: z.enum(SOCIAL_PLATFORMS),
        /** Handle or full URL; "" = not filled in yet (rendered as nothing). Normalised in Phase 7. */
        handle: z.string().trim().max(256),
      })
    )
    .max(12),
});

export const embedBlockSchema = z.object({
  ...blockBase,
  type: z.literal("embed"),
  /** Provider allowlist (YouTube/Vimeo/Spotify/SoundCloud) is enforced by parseEmbed in Phase 7. */
  url: optionalSafeUrl,
});

export const contactCardBlockSchema = z.object({
  ...blockBase,
  type: z.literal("contact_card"),
  title: z.string().trim().min(1).max(80),
  name: z.string().trim().max(80),
  phone: z.string().trim().max(32),
  email: z.union([z.literal(""), z.email().max(254)]),
  company: z.string().trim().max(80),
  website: optionalSafeUrl,
});

export const blockSchema = z.discriminatedUnion("type", [
  linkBlockSchema,
  headingBlockSchema,
  textBlockSchema,
  dividerBlockSchema,
  socialBlockSchema,
  embedBlockSchema,
  contactCardBlockSchema,
]);

export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block["type"];
export type BlockOfType<T extends BlockType> = Extract<Block, { type: T }>;

/** A block before it has been given an id (templates, palette defaults). */
export type BlockInput = Block extends infer B ? (B extends Block ? Omit<B, "id"> : never) : never;

export const bioDocumentSchema = z
  .object({
    schema_version: z.literal(BIO_SCHEMA_VERSION),
    blocks: z.array(blockSchema).max(MAX_BLOCKS_PER_PAGE),
  })
  .superRefine((doc, ctx) => {
    const seen = new Set<string>();
    doc.blocks.forEach((b, i) => {
      if (seen.has(b.id)) {
        ctx.addIssue({ code: "custom", path: ["blocks", i, "id"], message: "Duplicate block id" });
      }
      seen.add(b.id);
    });
  });

export type BioDocument = z.infer<typeof bioDocumentSchema>;

// ---------- publish / render helpers (pure) ----------

/**
 * Blocks that must be fixed before publishing: template sample links still marked placeholder.
 * TODO(Phase 5): call this from POST /api/bio/pages/[id]/publish and return them as blocking errors.
 */
export function getPlaceholderBlocks(blocks: readonly Block[]): Block[] {
  return blocks.filter((b) => b.type === "link" && b.placeholder === true && !b.hidden);
}

/**
 * What the public page should render: hidden blocks, empty embeds, empty contact cards,
 * out-of-schedule links and empty social handles are dropped. Social blocks with no
 * filled items disappear entirely.
 */
export function getRenderableBlocks(blocks: readonly Block[], now: Date = new Date()): Block[] {
  const out: Block[] = [];
  for (const b of blocks) {
    if (b.hidden) continue;
    switch (b.type) {
      case "embed":
        if (!b.url) continue;
        break;
      case "social": {
        const items = b.items.filter((i) => i.handle.length > 0);
        if (items.length === 0) continue;
        out.push({ ...b, items });
        continue;
      }
      case "contact_card":
        if (!b.name && !b.phone && !b.email && !b.company && !b.website) continue;
        break;
      case "link":
        if (b.show_from && new Date(b.show_from) > now) continue;
        if (b.show_until && new Date(b.show_until) <= now) continue;
        break;
    }
    out.push(b);
  }
  return out;
}

// ---------- editor helpers ----------

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  link: "Link",
  heading: "Heading",
  text: "Text",
  divider: "Divider",
  social: "Social icons",
  embed: "Embed",
  contact_card: "Contact card",
};

/** A sensible new block for the editor palette (fresh uuid). */
export function createDefaultBlock(type: BlockType): Block {
  const id = crypto.randomUUID();
  switch (type) {
    case "link":
      return { id, type, title: "New link", url: "https://example.com", placeholder: true };
    case "heading":
      return { id, type, text: "New section" };
    case "text":
      return { id, type, text: "Write something about yourself." };
    case "divider":
      return { id, type, style: "line" };
    case "social":
      return {
        id,
        type,
        items: [
          { platform: "instagram", handle: "" },
          { platform: "x", handle: "" },
        ],
      };
    case "embed":
      return { id, type, url: "" };
    case "contact_card":
      return { id, type, title: "Save my contact", name: "", phone: "", email: "", company: "", website: "" };
  }
}

/** Safe parse of a stored document: invalid blocks are dropped instead of failing the page. */
export function parseDocumentLenient(value: unknown): BioDocument {
  const raw = (value && typeof value === "object" ? value : {}) as { blocks?: unknown };
  const blocks: Block[] = [];
  const seen = new Set<string>();
  if (Array.isArray(raw.blocks)) {
    for (const b of raw.blocks.slice(0, MAX_BLOCKS_PER_PAGE)) {
      const r = blockSchema.safeParse(b);
      if (r.success && !seen.has(r.data.id)) {
        seen.add(r.data.id);
        blocks.push(r.data);
      }
    }
  }
  return { schema_version: BIO_SCHEMA_VERSION, blocks };
}
