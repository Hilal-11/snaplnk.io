// components/bio/BioRenderer.tsx
// Pure, server-safe renderer shared by the public page (/@username) and the
// editor/template previews. No hooks, no fetching, no cookies, no raw HTML.
//
// Layout variants (theme.layout.variant):
//   classic — centred avatar + full-width buttons
//   cover   — banner, large avatar, socials above the name, contact rows
//   card    — profile card + icon link rows + footer
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import {
  FaBehance,
  FaDribbble,
  FaEnvelope,
  FaFacebook,
  FaFigma,
  FaGithub,
  FaGlobe,
  FaInstagram,
  FaLinkedin,
  FaMessage,
  FaMusic,
  FaPhone,
  FaSpotify,
  FaTelegram,
  FaTiktok,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import {
  FiArrowUpRight,
  FiBookOpen,
  FiCalendar,
  FiDownload,
  FiGlobe,
  FiLink,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPlay,
  FiShoppingBag,
} from "react-icons/fi";
import { getRenderableBlocks, type Block, type BlockOfType, type LinkIcon, type SocialPlatform } from "@/lib/bio/blocks";
import { BIO_FONT_VARS } from "@/lib/bio/fonts";
import { isDarkTheme, type ThemeInput } from "@/lib/bio/theme";
import { parseEmbed } from "@/lib/bio/embeds";
import { socialUrl, SOCIAL_LABELS } from "@/lib/bio/socials";
import { vCardDataUri } from "@/lib/bio/vcard";
import { bioFontVariables } from "./fonts";

const OUTBOUND_REL = "noopener noreferrer nofollow ugc";
type IconType = React.ComponentType<{ size?: number; className?: string }>;
type Variant = "classic" | "cover" | "card";
type Mode = "public" | "preview";

const SOCIAL_ICONS: Record<SocialPlatform, IconType> = {
  instagram: FaInstagram,
  x: FaXTwitter,
  youtube: FaYoutube,
  linkedin: FaLinkedin,
  github: FaGithub,
  tiktok: FaTiktok,
  facebook: FaFacebook,
  whatsapp: FaWhatsapp,
  telegram: FaTelegram,
  email: FiMail,
  phone: FaPhone,
  website: FaGlobe,
};

const LINK_ICONS: Record<Exclude<LinkIcon, "auto">, IconType> = {
  link: FiLink,
  globe: FiGlobe,
  github: FaGithub,
  spotify: FaSpotify,
  behance: FaBehance,
  dribbble: FaDribbble,
  figma: FaFigma,
  youtube: FaYoutube,
  instagram: FaInstagram,
  x: FaXTwitter,
  linkedin: FaLinkedin,
  mail: FaEnvelope,
  message: FaMessage,
  music: FaMusic,
  shop: FiShoppingBag,
  calendar: FiCalendar,
  book: FiBookOpen,
};

/** Icon key for a link: explicit choice, else inferred from the destination host. */
export function linkIconKey(block: BlockOfType<"link">): Exclude<LinkIcon, "auto"> {
  if (block.icon && block.icon !== "auto") return block.icon;
  let host = "";
  try {
    host = new URL(block.url).hostname.replace(/^www./, "");
  } catch {
    return "link";
  }
  const rules: [RegExp, Exclude<LinkIcon, "auto">][] = [
    [/github.com$/, "github"],
    [/spotify.com$/, "spotify"],
    [/behance.net$/, "behance"],
    [/dribbble.com$/, "dribbble"],
    [/figma.com$/, "figma"],
    [/(youtube.com|youtu.be)$/, "youtube"],
    [/instagram.com$/, "instagram"],
    [/(x.com|twitter.com)$/, "x"],
    [/linkedin.com$/, "linkedin"],
  ];
  return rules.find(([re]) => re.test(host))?.[1] ?? "link";
}

const WIDTH = { narrow: 420, normal: 520, wide: 640 } as const;
const GAP = { compact: 10, comfortable: 12, airy: 16 } as const;

export type BioRendererProps = {
  profile: { displayName: string; bio: string };
  theme: ThemeInput;
  blocks: readonly Block[];
  /** "preview" renders embeds as placeholders and shows empty social slots dimmed. */
  mode?: Mode;
  /** "device": full-bleed on phones, centred card on larger screens (public page). */
  frame?: "none" | "device";
  username?: string;
  showBranding?: boolean;
  /** Block ids to visually flag in the editor preview. */
  flaggedBlockIds?: readonly string[];
};

function fontStack(id: keyof typeof BIO_FONT_VARS) {
  const mono = id.includes("mono");
  const serif = id === "lora" || id === "dm-serif-display";
  return `var(${BIO_FONT_VARS[id]}), ${mono ? "ui-monospace, monospace" : serif ? "Georgia, serif" : "ui-sans-serif, system-ui, sans-serif"}`;
}

function initials(name: string) {
  const parts = name.replace(/[^\p{L}\p{N}\s]/gu, " ").trim().split(/\s+/).filter(Boolean);
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
  frame = "none",
  username,
  showBranding = true,
  flaggedBlockIds = [],
}: BioRendererProps) {
  const variant: Variant = theme.layout.variant ?? "classic";
  const dark = isDarkTheme(theme);
  const bg =
    theme.background.type === "solid"
      ? theme.background.color
      : `linear-gradient(${theme.background.angle}deg, ${theme.background.from}, ${theme.background.to})`;

  const rootStyle = {
    "--bio-text": theme.text.color,
    "--bio-muted": theme.text.muted,
    "--bio-accent": theme.text.accent,
    "--bio-btn-bg": theme.button.bg,
    "--bio-btn-fg": theme.button.fg,
    "--bio-btn-border": theme.button.border,
    "--bio-btn-radius": `${theme.button.radius}px`,
    "--bio-gap": `${GAP[theme.layout.spacing]}px`,
    "--bio-tile": `color-mix(in srgb, ${theme.text.color} ${dark ? 10 : 7}%, transparent)`,
    background: bg,
    color: theme.text.color,
    fontFamily: fontStack(theme.font.body),
  } as CSSProperties;

  const headingFont: CSSProperties = { fontFamily: fontStack(theme.font.heading) };
  const visible = getRenderableBlocks(blocks, new Date(), { keepEmptySocials: mode === "preview" });
  const flagged = new Set(flaggedBlockIds);
  const ctx: Ctx = { mode, variant, headingFont, dark };

  // Cover layout lifts a leading social row above the name (as on a business card).
  const headerSocial = variant === "cover" && visible[0]?.type === "social" ? visible[0] : null;
  const body = headerSocial ? visible.slice(1) : visible;

  const page = (
    <main className="mx-auto flex w-full flex-col" style={{ maxWidth: frame === "device" ? undefined : WIDTH[theme.layout.width] }}>
      <ProfileHeader
        theme={theme}
        profile={profile}
        username={username}
        ctx={ctx}
        socials={variant === "card" && visible[0]?.type === "social" ? visible[0] : headerSocial}
      />

      <div
        className={`flex w-full flex-col ${variant === "cover" ? "px-6 pb-6" : "px-5"} ${variant === "classic" ? "mt-8" : "mt-4"}`}
        style={{ gap: "var(--bio-gap)" }}
      >
        {(variant === "card" && visible[0]?.type === "social" ? visible.slice(1) : body).map((b) => (
          <div
            key={b.id}
            data-block-id={b.id}
            data-block-type={b.type}
            className={flagged.has(b.id) ? "rounded-lg outline-2 outline-offset-4 outline-dashed outline-orange-500" : undefined}
          >
            <BlockView block={b} ctx={ctx} />
          </div>
        ))}
      </div>

      <footer className="mt-auto flex flex-col items-center gap-3 px-5 pb-8 pt-10">
        {variant === "card" && (
          <p className="text-[11px]" style={{ color: "var(--bio-muted)" }}>
            © {new Date().getFullYear()} {profile.displayName || (username ? `@${username}` : "")}. All rights reserved.
          </p>
        )}
        {showBranding && (
          <Link
            href="/"
            aria-label="Made with Snaplnk"
            title="Made with Snaplnk"
            className="opacity-80 transition-[opacity,transform] hover:scale-110 hover:opacity-100"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dark ? "/snaplinklogodark.svg" : "/snaplinklogolight.svg"}
              alt="Snaplnk"
              width={22}
              height={22}
            />
          </Link>
        )}
      </footer>
    </main>
  );

  const card = (
    <div
      className={`bio-root ${bioFontVariables} relative flex w-full flex-col ${
        frame === "device"
          ? "min-h-screen sm:min-h-[min(860px,calc(100vh-4rem))] sm:max-w-[430px] sm:overflow-hidden sm:rounded-[2rem] sm:border sm:shadow-[0_40px_100px_-30px_rgba(0,0,0,0.55)]"
          : "min-h-full"
      }`}
      style={{ ...rootStyle, borderColor: dark ? "rgb(255 255 255 / 0.08)" : "rgb(0 0 0 / 0.06)" }}
      data-button-style={theme.button.style}
      data-variant={variant}
    >
      {page}
    </div>
  );

  if (frame !== "device") return card;

  // Desktop backdrop: the theme's own background, dimmed, with a soft glow — the page sits in the centre.
  return (
    <div className="relative isolate flex min-h-screen w-full items-stretch justify-center sm:items-center sm:px-4 sm:py-8" style={{ background: bg }}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 hidden sm:block"
        style={{
          background: dark
            ? "radial-gradient(ellipse 60% 50% at 50% 0%, rgb(255 255 255 / 0.08), transparent 70%), rgb(0 0 0 / 0.35)"
            : "radial-gradient(ellipse 60% 50% at 50% 0%, rgb(255 255 255 / 0.9), transparent 70%), rgb(15 23 42 / 0.06)",
        }}
      />
      {card}
    </div>
  );
}

type Ctx = { mode: Mode; variant: Variant; headingFont: CSSProperties; dark: boolean };

function avatarRadius(shape: ThemeInput["avatar"]["shape"]) {
  return shape === "circle" ? "9999px" : shape === "rounded" ? "24%" : "8px";
}

function ProfileHeader({
  theme,
  profile,
  username,
  ctx,
  socials,
}: {
  theme: ThemeInput;
  profile: BioRendererProps["profile"];
  username?: string;
  ctx: Ctx;
  socials: Block | null;
}) {
  const name = profile.displayName || "Your Name";
  const avatar = (size: number, extra: CSSProperties = {}) => (
    <div
      className="bio-avatar flex shrink-0 items-center justify-center font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        borderRadius: avatarRadius(theme.avatar.shape),
        background: "var(--bio-btn-bg)",
        color: "var(--bio-btn-fg)",
        ...ctx.headingFont,
        ...extra,
      }}
      aria-hidden
    >
      {initials(name)}
    </div>
  );

  if (ctx.variant === "cover") {
    return (
      <header className="flex flex-col items-center">
        <div
          className="h-28 w-full"
          style={{ background: theme.cover ?? `color-mix(in srgb, ${theme.text.color} 10%, transparent)` }}
          aria-hidden
        />
        <div className="-mt-[72px]">{avatar(144, { border: "none" })}</div>
        {socials?.type === "social" && (
          <div className="mt-5">
            <SocialRow block={socials} ctx={ctx} size="lg" />
          </div>
        )}
        <h1 className="bio-name mt-3 px-6 text-center text-[26px] font-bold tracking-tight" style={ctx.headingFont}>
          {name}
        </h1>
        {profile.bio && (
          <p className="bio-bio mt-4 w-full px-6 text-left text-[17px] leading-relaxed" style={{ color: "var(--bio-text)" }}>
            {profile.bio}
          </p>
        )}
      </header>
    );
  }

  if (ctx.variant === "card") {
    return (
      <header className="px-5 pt-10">
        <div
          className="flex flex-col items-center px-5 py-6 text-center"
          style={{
            background: "var(--bio-btn-bg)",
            border: "1px solid var(--bio-btn-border)",
            borderRadius: "calc(var(--bio-btn-radius) + 4px)",
          }}
        >
          {avatar(64, {
            border: "2px solid var(--bio-btn-border)",
            boxShadow: `0 0 0 3px ${ctx.dark ? "rgb(255 255 255 / 0.12)" : "rgb(0 0 0 / 0.06)"}`,
            background: ctx.dark ? "#000000" : "#0a0a0a",
            color: "#ffffff",
          })}
          <h1 className="bio-name mt-3 text-lg font-bold tracking-tight" style={ctx.headingFont}>
            {name}
          </h1>
          {username && (
            <p className="text-xs" style={{ color: "var(--bio-muted)" }}>
              @{username}
            </p>
          )}
          {profile.bio && (
            <p className="bio-bio mt-2.5 text-[13px] leading-relaxed" style={{ color: "var(--bio-muted)" }}>
              {profile.bio}
            </p>
          )}
          {socials?.type === "social" && (
            <div className="mt-4">
              <SocialRow block={socials} ctx={ctx} size="chip" />
            </div>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="flex flex-col items-center px-5 pt-12">
      {avatar(96, { border: "1px solid var(--bio-btn-border)" })}
      <h1 className="bio-name mt-4 text-center text-2xl font-bold tracking-tight" style={ctx.headingFont}>
        {name}
      </h1>
      {profile.bio && (
        <p className="bio-bio mt-1.5 max-w-sm text-center text-[15px] leading-relaxed" style={{ color: "var(--bio-muted)" }}>
          {profile.bio}
        </p>
      )}
    </header>
  );
}

function SocialRow({ block, ctx, size }: { block: BlockOfType<"social">; ctx: Ctx; size: "lg" | "chip" | "md" }) {
  const box = size === "chip" ? "h-7 w-7" : size === "lg" ? "h-9 w-9" : "h-11 w-11";
  const icon = size === "chip" ? 12 : size === "lg" ? 24 : 20;
  return (
    <nav aria-label="Social links" className={`bio-social flex flex-wrap items-center justify-center ${size === "chip" ? "gap-1.5" : "gap-3"}`}>
      {block.items.map((item, i) => {
        const href = socialUrl(item.platform, item.handle);
        const Icon = SOCIAL_ICONS[item.platform];
        const cls = `flex ${box} items-center justify-center rounded-full transition-transform hover:-translate-y-0.5 hover:scale-110`;
        const style: CSSProperties = {
          color: "var(--bio-text)",
          ...(size === "chip" ? { background: "var(--bio-tile)" } : {}),
        };
        if (!href) {
          // Empty slot: only drawn in previews, dimmed, never a link.
          return ctx.mode === "preview" ? (
            <span key={`${item.platform}-${i}`} className={cls} style={{ ...style, opacity: 0.55 }} aria-hidden>
              <Icon size={icon} />
            </span>
          ) : null;
        }
        const external = href.startsWith("http");
        return (
          <a
            key={`${item.platform}-${i}`}
            href={href}
            rel={external ? OUTBOUND_REL : undefined}
            aria-label={SOCIAL_LABELS[item.platform]}
            title={SOCIAL_LABELS[item.platform]}
            className={cls}
            style={style}
          >
            <Icon size={icon} />
          </a>
        );
      })}
    </nav>
  );
}

function BlockView({ block, ctx }: { block: Block; ctx: Ctx }) {
  const align = ctx.variant === "cover" ? "text-left" : "text-center";
  switch (block.type) {
    case "link": {
      if (ctx.variant === "card") {
        const Icon = LINK_ICONS[linkIconKey(block)];
        return (
          <a href={block.url} rel={OUTBOUND_REL} className="bio-link group flex w-full items-center gap-3 px-3.5 py-3 text-left text-sm font-semibold" data-highlight={block.highlight ? "" : undefined}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ background: "var(--bio-tile)" }}>
              <Icon size={13} />
            </span>
            <span className="min-w-0 flex-1 truncate">{block.title}</span>
            {block.badge && (
              <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: "var(--bio-accent)", color: "var(--bio-btn-bg)" }}>
                {block.badge}
              </span>
            )}
            <FiArrowUpRight size={15} className="shrink-0 opacity-50 transition-[opacity,transform] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
          </a>
        );
      }
      return (
        <a
          href={block.url}
          rel={OUTBOUND_REL}
          className="bio-link relative flex min-h-14 w-full items-center justify-center px-12 py-3.5 text-center text-[15px] font-semibold"
          data-highlight={block.highlight ? "" : undefined}
        >
          <span className="truncate">{block.title}</span>
          {block.badge && (
            <span className="absolute right-3 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: "var(--bio-accent)", color: "var(--bio-btn-bg)" }}>
              {block.badge}
            </span>
          )}
        </a>
      );
    }

    case "heading":
      return (
        <h2
          className={`bio-heading pt-3 ${align} text-sm font-bold uppercase tracking-[0.12em]`}
          style={{ ...ctx.headingFont, color: "var(--bio-accent)" }}
        >
          {block.text}
        </h2>
      );

    case "text":
      return (
        <p className={`bio-text ${align} text-[15px] leading-relaxed`} style={{ color: "var(--bio-muted)" }}>
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
        <div className="py-1">
          <SocialRow block={block} ctx={ctx} size={ctx.variant === "card" ? "chip" : "md"} />
        </div>
      );

    case "embed":
      return <EmbedView block={block} mode={ctx.mode} />;

    case "contact_card":
      return ctx.variant === "cover" ? <ContactRows block={block} /> : <ContactButton block={block} />;
  }
}

function ContactButton({ block }: { block: BlockOfType<"contact_card"> }) {
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

/** Business-card rows: round icon, small label, bold value. Values link where it makes sense. */
function ContactRows({ block }: { block: BlockOfType<"contact_card"> }) {
  const rows: { label: string; value: string; href?: string; icon: IconType }[] = [];
  if (block.phone) rows.push({ label: "Direct", value: block.phone, href: `tel:${block.phone.replace(/[^\d+]/g, "")}`, icon: FiPhone });
  if (block.email) rows.push({ label: "Email", value: block.email, href: `mailto:${block.email}`, icon: FiMail });
  if (block.website)
    rows.push({ label: "Company", value: block.website.replace(/^https?:\/\//, ""), href: block.website, icon: FiGlobe });
  if (block.company && !block.website) rows.push({ label: "Company", value: block.company, icon: FiGlobe });
  if (block.address) rows.push({ label: "Address", value: block.address, icon: FiMapPin });

  return (
    <ul className="flex flex-col gap-4">
      {rows.map((r) => {
        const inner = (
          <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--bio-tile)" }}>
              <r.icon size={15} />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px]" style={{ color: "var(--bio-muted)" }}>
                {r.label}
              </span>
              <span className="block truncate text-[16px] font-bold">{r.value}</span>
            </span>
          </>
        );
        return (
          <li key={r.label}>
            {r.href ? (
              <a
                href={r.href}
                rel={r.href.startsWith("http") ? OUTBOUND_REL : undefined}
                className="flex items-center gap-3.5 rounded-lg transition-opacity hover:opacity-80"
              >
                {inner}
              </a>
            ) : (
              <div className="flex items-center gap-3.5">{inner}</div>
            )}
          </li>
        );
      })}
      <li>
        <a
          href={vCardDataUri(block)}
          download={`${(block.name || block.company || "contact").replace(/[^\w-]+/g, "_")}.vcf`}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold underline-offset-4 hover:underline"
          style={{ color: "var(--bio-accent)" }}
        >
          <FiDownload size={13} /> {block.title}
        </a>
      </li>
    </ul>
  );
}

function EmbedView({ block, mode }: { block: BlockOfType<"embed">; mode: Mode }) {
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
