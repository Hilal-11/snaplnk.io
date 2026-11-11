// components/bio/BioRenderer.tsx
// Pure, server-safe renderer shared by the public page (/@username) and the
// editor/template previews. No hooks, no fetching, no cookies, no raw HTML.
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import {
  FaEnvelope,
  FaFacebook,
  FaGithub,
  FaGlobe,
  FaInstagram,
  FaLinkedin,
  FaPhone,
  FaTelegram,
  FaTiktok,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { FiDownload, FiPlay } from "react-icons/fi";
import { getRenderableBlocks, type Block, type BlockOfType, type SocialPlatform } from "@/lib/bio/blocks";
import { BIO_FONT_VARS } from "@/lib/bio/fonts";
import type { ThemeInput } from "@/lib/bio/theme";
import { parseEmbed } from "@/lib/bio/embeds";
import { socialUrl, SOCIAL_LABELS } from "@/lib/bio/socials";
import { vCardDataUri } from "@/lib/bio/vcard";
import { bioFontVariables } from "./fonts";

const OUTBOUND_REL = "noopener noreferrer nofollow ugc";

const SOCIAL_ICONS: Record<SocialPlatform, React.ComponentType<{ size?: number }>> = {
  instagram: FaInstagram,
  x: FaXTwitter,
  youtube: FaYoutube,
  linkedin: FaLinkedin,
  github: FaGithub,
  tiktok: FaTiktok,
  facebook: FaFacebook,
  whatsapp: FaWhatsapp,
  telegram: FaTelegram,
  email: FaEnvelope,
  phone: FaPhone,
  website: FaGlobe,
};

const WIDTH = { narrow: 420, normal: 520, wide: 640 } as const;
const GAP = { compact: 8, comfortable: 12, airy: 16 } as const;

export type BioRendererProps = {
  profile: { displayName: string; bio: string };
  theme: ThemeInput;
  blocks: readonly Block[];
  /** "preview" renders embeds as placeholders (lighter) — use for editor and template cards. */
  mode?: "public" | "preview";
  showBranding?: boolean;
  /** Block ids to visually flag in the editor preview. */
  flaggedBlockIds?: readonly string[];
};

function fontStack(id: keyof typeof BIO_FONT_VARS, mono = false) {
  return `var(${BIO_FONT_VARS[id]}), ${mono ? "ui-monospace, monospace" : "ui-sans-serif, system-ui, sans-serif"}`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** Markdown-lite: **bold**, *italic*, line breaks. Everything else is plain text. */
function renderInline(text: string): ReactNode[] {
  return text.split("\n").flatMap((line, li) => {
    const nodes: ReactNode[] = [];
    const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let k = 0;
    while ((m = re.exec(line))) {
      if (m.index > last) nodes.push(line.slice(last, m.index));
      nodes.push(m[1] ? <strong key={`${li}-${k++}`}>{m[1]}</strong> : <em key={`${li}-${k++}`}>{m[2]}</em>);
      last = m.index + m[0].length;
    }
    if (last < line.length) nodes.push(line.slice(last));
    return li === 0 ? nodes : [<br key={`br-${li}`} />, ...nodes];
  });
}

export default function BioRenderer({
  profile,
  theme,
  blocks,
  mode = "public",
  showBranding = true,
  flaggedBlockIds = [],
}: BioRendererProps) {
  const bg =
    theme.background.type === "solid"
      ? theme.background.color
      : `linear-gradient(${theme.background.angle}deg, ${theme.background.from}, ${theme.background.to})`;

  const isMonoHeading = theme.font.heading.includes("mono");
  const isMonoBody = theme.font.body.includes("mono");

  const rootStyle = {
    "--bio-text": theme.text.color,
    "--bio-muted": theme.text.muted,
    "--bio-accent": theme.text.accent,
    "--bio-btn-bg": theme.button.bg,
    "--bio-btn-fg": theme.button.fg,
    "--bio-btn-border": theme.button.border,
    "--bio-btn-radius": `${theme.button.radius}px`,
    "--bio-gap": `${GAP[theme.layout.spacing]}px`,
    background: bg,
    color: theme.text.color,
    fontFamily: fontStack(theme.font.body, isMonoBody),
  } as CSSProperties;

  const headingFont: CSSProperties = { fontFamily: fontStack(theme.font.heading, isMonoHeading) };
  const avatarRadius = theme.avatar.shape === "circle" ? "9999px" : theme.avatar.shape === "rounded" ? "22%" : "8px";
  const visible = getRenderableBlocks(blocks);
  const flagged = new Set(flaggedBlockIds);

  return (
    <div className={`bio-root ${bioFontVariables} min-h-full w-full`} style={rootStyle} data-button-style={theme.button.style}>
      <main className="mx-auto flex flex-col items-center px-5 pt-12 pb-10" style={{ maxWidth: WIDTH[theme.layout.width] }}>
        {/* Profile */}
        <div
          className="bio-avatar flex h-24 w-24 items-center justify-center text-3xl font-semibold"
          style={{
            borderRadius: avatarRadius,
            background: "var(--bio-btn-bg)",
            color: "var(--bio-btn-fg)",
            border: "1px solid var(--bio-btn-border)",
            ...headingFont,
          }}
          aria-hidden
        >
          {initials(profile.displayName)}
        </div>
        <h1 className="bio-name mt-4 text-center text-2xl font-bold tracking-tight" style={headingFont}>
          {profile.displayName || "Your Name"}
        </h1>
        {profile.bio && (
          <p className="bio-bio mt-1.5 max-w-sm text-center text-[15px] leading-relaxed" style={{ color: "var(--bio-muted)" }}>
            {profile.bio}
          </p>
        )}

        {/* Blocks */}
        <div className="mt-8 flex w-full flex-col" style={{ gap: "var(--bio-gap)" }}>
          {visible.map((b) => (
            <div
              key={b.id}
              data-block-id={b.id}
              data-block-type={b.type}
              className={flagged.has(b.id) ? "rounded-lg outline-2 outline-offset-4 outline-dashed outline-amber-500" : undefined}
            >
              <BlockView block={b} mode={mode} headingFont={headingFont} />
            </div>
          ))}
        </div>

        {showBranding && (
          <Link
            href="/"
            className="mt-12 text-xs font-medium opacity-70 transition-opacity hover:opacity-100"
            style={{ color: "var(--bio-muted)" }}
          >
            Made with Snaplnk
          </Link>
        )}
      </main>
    </div>
  );
}

function BlockView({
  block,
  mode,
  headingFont,
}: {
  block: Block;
  mode: "public" | "preview";
  headingFont: CSSProperties;
}) {
  switch (block.type) {
    case "link":
      return (
        <a
          href={block.url}
          rel={OUTBOUND_REL}
          className="bio-link relative flex min-h-14 w-full items-center justify-center px-12 py-3.5 text-center text-[15px] font-semibold"
          data-highlight={block.highlight ? "" : undefined}
        >
          <span className="truncate">{block.title}</span>
          {block.badge && (
            <span
              className="absolute right-3 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ background: "var(--bio-accent)", color: "var(--bio-btn-bg)" }}
            >
              {block.badge}
            </span>
          )}
        </a>
      );

    case "heading":
      return (
        <h2 className="bio-heading pt-3 text-center text-sm font-bold uppercase tracking-[0.12em]" style={{ ...headingFont, color: "var(--bio-accent)" }}>
          {block.text}
        </h2>
      );

    case "text":
      return (
        <p className="bio-text text-center text-[15px] leading-relaxed" style={{ color: "var(--bio-muted)" }}>
          {renderInline(block.text)}
        </p>
      );

    case "divider":
      if (block.style === "space") return <div className="h-4" aria-hidden />;
      return (
        <hr
          className="mx-auto my-1 w-1/2 border-0 border-t-2"
          style={{
            borderTopStyle: block.style === "dots" ? "dotted" : block.style === "dashed" ? "dashed" : "solid",
            borderColor: "var(--bio-muted)",
            opacity: 0.45,
          }}
        />
      );

    case "social":
      return (
        <nav aria-label="Social links" className="bio-social flex flex-wrap items-center justify-center gap-2 py-1">
          {block.items.map((item, i) => {
            const href = socialUrl(item.platform, item.handle);
            if (!href) return null;
            const Icon = SOCIAL_ICONS[item.platform];
            const external = href.startsWith("http");
            return (
              <a
                key={`${item.platform}-${i}`}
                href={href}
                rel={external ? OUTBOUND_REL : undefined}
                aria-label={SOCIAL_LABELS[item.platform]}
                title={SOCIAL_LABELS[item.platform]}
                className="flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:-translate-y-0.5 hover:scale-110"
                style={{ color: "var(--bio-text)" }}
              >
                <Icon size={20} />
              </a>
            );
          })}
        </nav>
      );

    case "embed":
      return <EmbedView block={block} mode={mode} />;

    case "contact_card":
      return (
        <a
          href={vCardDataUri(block)}
          download={`${(block.name || block.company || "contact").replace(/[^\w-]+/g, "_")}.vcf`}
          className="bio-link flex min-h-14 w-full items-center justify-center gap-2 px-6 py-3.5 text-[15px] font-semibold"
        >
          <FiDownload size={16} />
          {block.title}
        </a>
      );
  }
}

function EmbedView({ block, mode }: { block: BlockOfType<"embed">; mode: "public" | "preview" }) {
  const embed = parseEmbed(block.url);
  if (!embed) return null;
  const box: CSSProperties = embed.aspectRatio ? { aspectRatio: embed.aspectRatio } : { height: embed.height };

  if (mode === "preview") {
    return (
      <div
        className="bio-embed flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-semibold capitalize"
        style={{ ...box, background: "var(--bio-btn-bg)", color: "var(--bio-btn-fg)", border: "1px solid var(--bio-btn-border)" }}
      >
        <FiPlay /> {embed.provider} embed
      </div>
    );
  }
  return (
    <div className="bio-embed w-full overflow-hidden rounded-xl" style={box}>
      <iframe
        src={embed.src}
        title={`${embed.provider} embed`}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write"
        className="h-full w-full border-0"
      />
    </div>
  );
}
