import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// next/font only works inside the Next compiler; the renderer just needs a class string.
vi.mock("./fonts", () => ({ bioFontVariables: "bio-fonts" }));

import BioRenderer from "./BioRenderer";
import { TEMPLATES } from "@/lib/bio/templates";
import { applyTemplate } from "@/lib/bio/templates/apply";
import type { Block } from "@/lib/bio/blocks";
import { DEFAULT_THEME, type ThemeInput } from "@/lib/bio/theme";
import { LINK_HUB_DARK } from "@/lib/bio/templates/link-hub";
import { contactCard } from "@/lib/bio/templates/contact-card";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

function render(blocks: Block[], mode: "public" | "preview" = "public") {
  return renderToStaticMarkup(
    <BioRenderer profile={{ displayName: "Hilal Ahmad", bio: "Hi **there**" }} theme={DEFAULT_THEME} blocks={blocks} mode={mode} />
  );
}

describe("BioRenderer", () => {
  it.each(TEMPLATES.map((t) => [t.id]))("renders template %s without empty socials or hidden embeds", (tid) => {
    const t = applyTemplate(tid)!;
    const html = renderToStaticMarkup(
      <BioRenderer profile={t.profile} theme={t.theme} blocks={t.draft.blocks} />
    );
    expect(html).toContain("bio-root");
    expect(html).not.toContain("<iframe"); // template embeds are empty + hidden
    expect(html).not.toContain('aria-label="Social links"'); // all handles empty
  });

  it("outbound links carry rel=nofollow ugc and never render unsafe schemes", () => {
    const html = render([
      { id: id(1), type: "link", title: "Site", url: "https://hila-11.com" },
      { id: id(2), type: "social", items: [{ platform: "github", handle: "Hilal-11" }, { platform: "x", handle: "javascript:alert(1)" }] },
    ]);
    expect(html).toContain('href="https://hila-11.com"');
    expect(html).toContain('rel="noopener noreferrer nofollow ugc"');
    expect(html).toContain('href="https://github.com/Hilal-11"');
    expect(html).not.toContain("javascript:");
  });

  it("escapes text and only renders the markdown-lite subset", () => {
    const html = render([{ id: id(1), type: "text", text: "<img src=x onerror=alert(1)> **bold** *it*" }]);
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>it</em>");
  });

  it("renders allowlisted embeds as sandboxed iframes (public) and placeholders (preview)", () => {
    const blocks: Block[] = [{ id: id(1), type: "embed", url: "https://youtu.be/dQw4w9WgXcQ" }];
    const pub = render(blocks, "public");
    expect(pub).toContain('src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"');
    expect(pub).toContain('sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"');
    expect(render(blocks, "preview")).not.toContain("<iframe");
    expect(render([{ id: id(2), type: "embed", url: "https://evil.com/x" }])).not.toContain("<iframe");
  });

  it("renders a downloadable vCard for filled contact cards", () => {
    const html = render([
      { id: id(1), type: "contact_card", title: "Save contact", name: "Hilal", phone: "+91 1", email: "", company: "", website: "" },
    ]);
    expect(html).toContain('href="data:text/vcard;charset=utf-8,BEGIN%3AVCARD');
    expect(html).toContain('download="Hilal.vcf"');
  });

  it("shows initials and the profile", () => {
    const html = render([]);
    expect(html).toContain(">HA<");
    expect(html).toContain("Hilal Ahmad");
  });
});

describe("BioRenderer layouts", () => {
  const links: Block[] = [
    { id: id(1), type: "social", items: [{ platform: "github", handle: "Hilal-11" }, { platform: "x", handle: "" }] },
    { id: id(2), type: "link", title: "GitHub", url: "https://github.com/Hilal-11" },
  ];
  const r = (theme: ThemeInput, blocks: Block[], extra: Partial<Parameters<typeof BioRenderer>[0]> = {}) =>
    renderToStaticMarkup(<BioRenderer profile={{ displayName: "VaveLabs", bio: "Tools" }} theme={theme} blocks={blocks} {...extra} />);

  it("card layout: @handle, profile-card socials, icon link rows and © footer", () => {
    const html = r(LINK_HUB_DARK, links, { username: "vavelabs" });
    expect(html).toContain('data-variant="card"');
    expect(html).toContain("@vavelabs");
    expect(html).toContain("All rights reserved.");
    expect(html.indexOf('aria-label="Social links"')).toBeLessThan(html.indexOf(">GitHub<"));
  });

  it("cover layout: banner, socials above the name and tap-to-call contact rows", () => {
    const blocks = contactCard.blocks.map((b, i) => ({ ...b, id: id(i + 10) })) as Block[];
    const html = r(contactCard.theme, blocks);
    expect(html).toContain('data-variant="cover"');
    expect(html).toContain('href="tel:3033334444"');
    expect(html).toContain('href="mailto:contact@company.com"');
    expect(html).toContain(">Address<");
    expect(html).toContain("Nashville, TN");
  });

  it("branding is the logo only, matched to the background", () => {
    const dark = r(LINK_HUB_DARK, []);
    const light = r(DEFAULT_THEME, []);
    expect(dark).toContain("/snaplinklogodark.svg");
    expect(light).toContain("/snaplinklogolight.svg");
    expect(dark).not.toContain("Made with Snaplnk<");
    expect(r(DEFAULT_THEME, [], { showBranding: false })).not.toContain("snaplinklogo");
  });

  it("device frame centres a phone-width card on larger screens", () => {
    const html = r(DEFAULT_THEME, [], { frame: "device" });
    expect(html).toContain("sm:max-w-[430px]");
    expect(html).toContain("sm:items-center");
    expect(r(DEFAULT_THEME, [])).not.toContain("sm:max-w-[430px]");
  });

  it("previews show empty social slots dimmed but never as links; public hides them", () => {
    const preview = r(LINK_HUB_DARK, links, { mode: "preview" });
    const pub = r(LINK_HUB_DARK, links, { mode: "public" });
    expect((preview.match(/opacity:0.55/g) ?? []).length).toBe(1);
    expect(pub).not.toContain("opacity:0.55");
    expect(pub).not.toContain('aria-label="X"');
  });
});
