import { describe, expect, it } from "vitest";
import { bioDocumentSchema, blockSchema, getPlaceholderBlocks, getRenderableBlocks, type Block } from "./blocks";
import { contrastRatio } from "./contrast";
import { getThemeContrastIssues } from "./theme";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe("blockSchema", () => {
  it.each(["javascript:alert(1)", "data:text/html,hi", "http://localhost/x", "https://user:pw@example.com", "ftp://x.com"])(
    "rejects unsafe link url %s",
    (url) => {
      expect(blockSchema.safeParse({ id: id(1), type: "link", title: "x", url }).success).toBe(false);
    }
  );

  it("rejects unknown block types and over-long text", () => {
    expect(blockSchema.safeParse({ id: id(1), type: "html", html: "<b>" }).success).toBe(false);
    expect(blockSchema.safeParse({ id: id(1), type: "text", text: "x".repeat(501) }).success).toBe(false);
  });

  it("allows an empty embed slot but not an unsafe one", () => {
    expect(blockSchema.safeParse({ id: id(1), type: "embed", url: "" }).success).toBe(true);
    expect(blockSchema.safeParse({ id: id(1), type: "embed", url: "javascript:x" }).success).toBe(false);
  });

  it("document rejects duplicate block ids", () => {
    const b = { id: id(1), type: "divider", style: "line" };
    expect(bioDocumentSchema.safeParse({ schema_version: 1, blocks: [b, b] }).success).toBe(false);
  });
});

describe("getRenderableBlocks / getPlaceholderBlocks", () => {
  const now = new Date("2026-06-01T00:00:00Z");
  const blocks: Block[] = [
    { id: id(1), type: "link", title: "a", url: "https://example.com", placeholder: true },
    { id: id(2), type: "link", title: "hidden", url: "https://example.com", placeholder: true, hidden: true },
    { id: id(3), type: "link", title: "future", url: "https://example.com", show_from: "2027-01-01T00:00:00Z" },
    { id: id(4), type: "link", title: "past", url: "https://example.com", show_until: "2026-01-01T00:00:00Z" },
    { id: id(5), type: "embed", url: "" },
    { id: id(6), type: "social", items: [{ platform: "x", handle: "" }, { platform: "github", handle: "hilal" }] },
    { id: id(7), type: "social", items: [{ platform: "x", handle: "" }] },
    { id: id(8), type: "contact_card", title: "Save", name: "", phone: "", email: "", company: "", website: "" },
  ];

  it("drops hidden, scheduled-out, empty embeds/cards and empty socials", () => {
    const r = getRenderableBlocks(blocks, now);
    expect(r.map((b) => b.id)).toEqual([id(1), id(6)]);
    const social = r[1];
    expect(social.type === "social" && social.items).toEqual([{ platform: "github", handle: "hilal" }]);
  });

  it("only visible placeholder links block publishing", () => {
    expect(getPlaceholderBlocks(blocks).map((b) => b.id)).toEqual([id(1)]);
  });
});

describe("contrast", () => {
  it("matches known WCAG ratios", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 1);
  });

  it("flags unreadable themes", () => {
    const issues = getThemeContrastIssues({
      background: { type: "solid", color: "#ffffff" },
      text: { color: "#eeeeee", muted: "#000000", accent: "#000000" },
      font: { heading: "inter", body: "inter" },
      button: { style: "fill", radius: 8, bg: "#ffffff", fg: "#fafafa", border: "#000000" },
      avatar: { shape: "circle" },
      layout: { width: "narrow", spacing: "compact" },
    });
    expect(issues.map((i) => i.pair)).toEqual(["text.color on background", "button.fg on button.bg"]);
  });
});
