import { describe, expect, it } from "vitest";
import { socialUrl } from "./socials";
import { parseEmbed } from "./embeds";
import { buildVCard } from "./vcard";
import { validateForPublish } from "./publish";
import { hasUnpublishedChanges, parseSnapshot, stableStringify } from "./snapshot";
import { createPageSchema, updatePageSchema } from "./schemas";
import { createDefaultBlock, parseDocumentLenient, type BlockType } from "./blocks";
import { DEFAULT_THEME } from "./theme";
import { applyTemplate } from "./templates/apply";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe("socialUrl", () => {
  it.each([
    ["instagram", "@hilal.dev", "https://instagram.com/hilal.dev"],
    ["x", "hilal_11", "https://x.com/hilal_11"],
    ["youtube", "hilal", "https://youtube.com/@hilal"],
    ["github", "https://github.com/Hilal-11", "https://github.com/Hilal-11"],
    ["whatsapp", "+91 98765-43210", "https://wa.me/919876543210"],
    ["phone", "+91 98765 43210", "tel:+919876543210"],
    ["email", "me@example.com", "mailto:me@example.com"],
    ["website", "example.com", "https://example.com/"],
  ] as const)("%s %s -> %s", (p, h, url) => {
    expect(socialUrl(p, h)).toBe(url);
  });

  it.each([
    ["instagram", ""],
    ["instagram", "bad handle!"],
    ["x", "javascript:alert(1)"],
    ["github", "http://localhost/x"],
    ["email", "not-an-email"],
    ["email", "a@b.c\n"],
    ["phone", "123"],
    ["website", "javascript:alert(1)"],
  ] as const)("rejects %s %j", (p, h) => {
    expect(socialUrl(p, h)).toBeNull();
  });
});

describe("parseEmbed", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?si=abc", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
    ["https://youtube.com/shorts/dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
    ["https://vimeo.com/76979871", "https://player.vimeo.com/video/76979871"],
    ["https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=x", "https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC"],
    ["https://open.spotify.com/intl-de/album/4aawyAB9vmqN3uQ7FjRGTy", "https://open.spotify.com/embed/album/4aawyAB9vmqN3uQ7FjRGTy"],
  ])("%s", (url, src) => {
    expect(parseEmbed(url)?.src).toBe(src);
  });

  it("builds an encoded SoundCloud player url", () => {
    expect(parseEmbed("https://soundcloud.com/artist/track-name")?.src).toBe(
      "https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fartist%2Ftrack-name&visual=false"
    );
  });

  it.each([
    "",
    "javascript:alert(1)",
    "https://evil.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=short",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ\"><script>",
    "https://open.spotify.com/track/../../x",
    "https://vimeo.com/channels/staffpicks",
    "https://soundcloud.com/a/<b>",
  ])("rejects %j", (url) => {
    expect(parseEmbed(url)).toBeNull();
  });
});

describe("buildVCard", () => {
  it("escapes separators and newlines", () => {
    const v = buildVCard({
      id: id(1),
      type: "contact_card",
      title: "Save",
      name: "Doe, John; Jr",
      phone: "+1",
      email: "j@x.io",
      company: "A\nB",
      website: "",
    });
    expect(v).toContain("FN:Doe\\, John\\; Jr");
    expect(v).toContain("ORG:A\\nB");
    expect(v.startsWith("BEGIN:VCARD")).toBe(true);
  });
});

describe("validateForPublish", () => {
  it("blocks template pages until sample links are replaced", () => {
    const t = applyTemplate("link-hub")!;
    const r = validateForPublish({ displayName: "Hilal", theme: t.theme, draft: t.draft });
    expect(r.errors.filter((e) => e.blockId)).toHaveLength(4);
  });

  it("passes once links are real", () => {
    const t = applyTemplate("link-hub")!;
    const blocks = t.draft.blocks.map((b) =>
      b.type === "link" ? { ...b, url: "https://hila-11.com", placeholder: undefined } : b
    );
    const r = validateForPublish({ displayName: "Hilal", theme: t.theme, draft: { ...t.draft, blocks } });
    expect(r.errors).toEqual([]);
  });

  it("requires a name and at least one visible block, and reports bad blocks by id", () => {
    const r = validateForPublish({
      displayName: " ",
      theme: DEFAULT_THEME,
      draft: { schema_version: 1, blocks: [{ id: id(9), type: "link", title: "x", url: "javascript:1" }] },
    });
    const messages = r.errors.map((e) => e.message).join(" | ");
    expect(messages).toMatch(/display name/i);
    expect(r.errors.some((e) => e.blockId === id(9))).toBe(true);
  });

  it("blocks the contact-card template until its sample details are edited", () => {
    const t = applyTemplate("contact-card")!;
    const r = validateForPublish({ displayName: "Hearth", theme: t.theme, draft: t.draft });
    expect(r.errors.some((e) => /sample details/.test(e.message))).toBe(true);
    const blocks = t.draft.blocks.map((b) => (b.type === "contact_card" ? { ...b, placeholder: undefined } : b));
    expect(validateForPublish({ displayName: "Hearth", theme: t.theme, draft: { ...t.draft, blocks } }).errors).toEqual([]);
  });
});

describe("snapshot", () => {
  it("stableStringify ignores key order and undefined", () => {
    expect(stableStringify({ b: 1, a: { d: [1, { y: 2, x: 1 }], c: undefined } })).toBe(
      stableStringify({ a: { d: [1, { x: 1, y: 2 }] }, b: 1 })
    );
  });

  it("detects unpublished changes", () => {
    const page = { display_name: "A", bio: "", avatar_path: null, theme: DEFAULT_THEME, draft: { schema_version: 1, blocks: [] } };
    const published = { schema_version: 1, profile: { bio: "", display_name: "A", avatar_path: null }, theme: DEFAULT_THEME, doc: page.draft };
    expect(hasUnpublishedChanges(page, published)).toBe(false);
    expect(hasUnpublishedChanges({ ...page, bio: "new" }, published)).toBe(true);
    expect(hasUnpublishedChanges(page, null)).toBe(true);
  });

  it("parseSnapshot drops invalid blocks and falls back to the default theme", () => {
    const s = parseSnapshot({
      profile: { display_name: "A", bio: "b" },
      theme: { nope: true },
      doc: { blocks: [{ id: id(1), type: "html", html: "<script>" }, { id: id(2), type: "divider", style: "line" }] },
    });
    expect(s.doc.blocks.map((b) => b.id)).toEqual([id(2)]);
    expect(s.theme.background).toEqual(DEFAULT_THEME.background);
  });
});

describe("api schemas", () => {
  it("createPageSchema normalizes usernames and rejects bad templates", () => {
    expect(createPageSchema.parse({ username: "@Hilal_11", template_id: "link-hub" })).toEqual({
      username: "hilal_11",
      template_id: "link-hub",
    });
    expect(createPageSchema.safeParse({ username: "admin" }).success).toBe(false);
    expect(createPageSchema.safeParse({ username: "hilal", template_id: "nope" }).success).toBe(false);
    expect(createPageSchema.safeParse({ username: "hilal", template_id: "blank" }).success).toBe(true);
  });

  it("updatePageSchema needs a version and at least one field", () => {
    expect(updatePageSchema.safeParse({ bio: "x" }).success).toBe(false);
    expect(updatePageSchema.safeParse({ expected_version: 1 }).success).toBe(false);
    expect(updatePageSchema.safeParse({ expected_version: 1, bio: "x" }).success).toBe(true);
  });
});

describe("editor helpers", () => {
  it.each(["link", "heading", "text", "divider", "social", "embed", "contact_card"] as BlockType[])(
    "createDefaultBlock(%s) is valid",
    (type) => {
      const doc = parseDocumentLenient({ blocks: [createDefaultBlock(type)] });
      expect(doc.blocks).toHaveLength(1);
    }
  );
});
