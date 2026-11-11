import { describe, expect, it } from "vitest";
import { bioDocumentSchema, blockSchema, getPlaceholderBlocks, getRenderableBlocks } from "@/lib/bio/blocks";
import { getThemeContrastIssues, themeSchema } from "@/lib/bio/theme";
import { BIO_PLANS, PRO_ONLY_BLOCK_TYPES } from "@/lib/bio/plans";
import { TEMPLATES, getTemplate, templateIdSchema } from "./index";
import { applyTemplate } from "./apply";

const DUMMY_ID = "00000000-0000-4000-8000-000000000000";

describe("template registry", () => {
  it("ships all 5 starter templates", () => {
    expect(TEMPLATES.map((t) => t.id)).toEqual(["minimal", "creator", "developer", "business", "neon"]);
  });

  it("has unique ids", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getTemplate / templateIdSchema reject unknown ids", () => {
    expect(getTemplate("nope")).toBeUndefined();
    expect(templateIdSchema.safeParse("nope").success).toBe(false);
    expect(applyTemplate("nope")).toBeNull();
  });
});

describe.each(TEMPLATES.map((t) => [t.id, t] as const))("template %s", (_id, template) => {
  it("theme validates against themeSchema", () => {
    const r = themeSchema.safeParse(template.theme);
    expect(r.success, JSON.stringify(r.error?.issues)).toBe(true);
  });

  it("every block validates against blockSchema", () => {
    for (const b of template.blocks) {
      const r = blockSchema.safeParse({ ...b, id: DUMMY_ID });
      expect(r.success, `${b.type}: ${JSON.stringify(r.error?.issues)}`).toBe(true);
    }
  });

  it("all text/background pairs pass WCAG AA (4.5:1)", () => {
    expect(getThemeContrastIssues(template.theme)).toEqual([]);
  });

  it("uses no Pro-only features and fits the Free plan", () => {
    expect(template.blocks.length).toBeLessThanOrEqual(BIO_PLANS.free.maxBlocks);
    expect(template.blocks.some((b) => PRO_ONLY_BLOCK_TYPES.includes(b.type))).toBe(false);
    expect(Object.keys(template)).not.toContain("custom_css");
    expect(Object.keys(template.theme)).not.toContain("custom_css");
  });

  it("marks every sample link as placeholder on an example.com / sample URL", () => {
    for (const b of template.blocks) {
      if (b.type === "link") expect(b.placeholder, b.title).toBe(true);
      if (b.type === "embed") expect(b.url).toBe("");
    }
  });

  it("uses no images or external assets", () => {
    expect(JSON.stringify(template)).not.toMatch(/\.(png|jpe?g|webp|gif|svg)\b|avatar_?url|image/i);
  });

  it("applyTemplate returns a valid document with fresh, unique ids each call", () => {
    const a = applyTemplate(template.id)!;
    const b = applyTemplate(template.id)!;
    expect(bioDocumentSchema.safeParse(a.draft).success).toBe(true);
    const idsA = a.draft.blocks.map((x) => x.id);
    const idsB = b.draft.blocks.map((x) => x.id);
    expect(new Set(idsA).size).toBe(idsA.length);
    expect(idsA.some((id) => idsB.includes(id))).toBe(false);
    expect(a.draft.blocks.length).toBe(template.blocks.length);
  });

  it("applyTemplate deep-clones (mutating the result never touches the template)", () => {
    const a = applyTemplate(template.id)!;
    a.profile.displayName = "changed";
    a.theme.text.color = "#000000";
    expect(template.profile.displayName).not.toBe("changed");
    expect(getTemplate(template.id)!.theme.text.color).toBe(template.theme.text.color);
  });

  it("cannot be published until placeholders are replaced", () => {
    const a = applyTemplate(template.id)!;
    const links = a.draft.blocks.filter((b) => b.type === "link" && !b.hidden);
    expect(getPlaceholderBlocks(a.draft.blocks)).toHaveLength(links.length);
  });

  it("renders no empty social handles or empty embeds publicly", () => {
    const a = applyTemplate(template.id)!;
    const rendered = getRenderableBlocks(a.draft.blocks);
    for (const b of rendered) {
      if (b.type === "social") expect(b.items.every((i) => i.handle.length > 0)).toBe(true);
      if (b.type === "embed") expect(b.url).not.toBe("");
      expect(b.hidden).not.toBe(true);
    }
  });
});
