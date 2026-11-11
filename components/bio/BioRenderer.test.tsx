import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

// next/font only works inside the Next compiler; the renderer just needs a class string.
vi.mock("./fonts", () => ({ bioFontVariables: "bio-fonts" }));

import BioRenderer from "./BioRenderer";
import { TEMPLATES } from "@/lib/bio/templates";
import { applyTemplate } from "@/lib/bio/templates/apply";
import type { Block } from "@/lib/bio/blocks";
import { DEFAULT_THEME } from "@/lib/bio/theme";

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
    expect(html).not.toContain('data-block-type="contact_card"'); // empty card hidden
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
    expect(html).not.toContain("<img");
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
