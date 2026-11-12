// lib/bio/theme.ts
// Bio page theme tokens (stored in bio_pages.theme). Rendered as CSS variables on .bio-root.
import { z } from "zod";
import { BIO_FONT_IDS } from "./fonts";
import { WCAG_AA_NORMAL, composite, contrastRatio, mix, parseHex, relativeLuminance } from "./contrast";

/** #rrggbb or #rrggbbaa (alpha used for translucent "soft" buttons). */
export const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/, "Use a hex colour like #111111")
  .transform((v) => v.toLowerCase());

const opaqueHex = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use an opaque hex colour like #111111")
  .transform((v) => v.toLowerCase());

const fontId = z.enum(BIO_FONT_IDS);

export const themeSchema = z.object({
  background: z.discriminatedUnion("type", [
    z.object({ type: z.literal("solid"), color: opaqueHex }),
    z.object({
      type: z.literal("gradient"),
      from: opaqueHex,
      to: opaqueHex,
      angle: z.number().int().min(0).max(360),
    }),
  ]),
  text: z.object({
    color: opaqueHex,
    muted: opaqueHex,
    accent: opaqueHex,
  }),
  font: z.object({ heading: fontId, body: fontId }),
  button: z.object({
    style: z.enum(["fill", "outline", "soft", "shadow"]),
    /** px; 999 = fully rounded pill */
    radius: z.number().int().min(0).max(999),
    bg: hexColor,
    fg: opaqueHex,
    border: hexColor,
  }),
  avatar: z.object({ shape: z.enum(["circle", "rounded", "square"]) }),
  layout: z.object({
    width: z.enum(["narrow", "normal", "wide"]),
    spacing: z.enum(["compact", "comfortable", "airy"]),
    /** classic = centred buttons · cover = banner + big avatar + contact rows · card = profile card + link rows */
    variant: z.enum(["classic", "cover", "card"]).default("classic"),
  }),
  /** Banner colour for the "cover" layout. */
  cover: opaqueHex.optional(),
});

export type Theme = z.infer<typeof themeSchema>;
/** Input shape (before lowercase transforms) — what template files are written in. */
export type ThemeInput = z.input<typeof themeSchema>;

export type ContrastIssue = { pair: string; ratio: number; required: number };

/** Opaque colours the page background can take (gradients sampled at start, middle, end). */
function backgroundSamples(theme: ThemeInput) {
  const bg = theme.background;
  if (bg.type === "solid") return [parseHex(bg.color)];
  return [0, 0.5, 1].map((t) => mix(bg.from, bg.to, t));
}

/**
 * Every text/background pair that falls below WCAG AA (4.5:1).
 * Empty array = readable. Used by template tests now and the theme editor warnings (Phase 4).
 */
export function getThemeContrastIssues(theme: ThemeInput, required = WCAG_AA_NORMAL): ContrastIssue[] {
  const issues: ContrastIssue[] = [];
  const check = (pair: string, fg: string, bg: ReturnType<typeof parseHex>) => {
    const ratio = contrastRatio(fg, bg);
    if (ratio < required) issues.push({ pair, ratio: Math.round(ratio * 100) / 100, required });
  };

  backgroundSamples(theme).forEach((bg, i) => {
    const where = theme.background.type === "gradient" ? ` @ gradient sample ${i}` : "";
    check(`text.color on background${where}`, theme.text.color, bg);
    check(`text.muted on background${where}`, theme.text.muted, bg);
    check(`text.accent on background${where}`, theme.text.accent, bg);
    // Button label sits on the button fill, which may be translucent over the page.
    const buttonBg = composite(parseHex(theme.button.bg), bg);
    check(`button.fg on button.bg${where}`, theme.button.fg, buttonBg);
  });
  return issues;
}

/** Theme for blank pages: the light "Link Hub" card look. */
export const DEFAULT_THEME: ThemeInput = {
  background: { type: "solid", color: "#f2f3f5" },
  text: { color: "#0a0a0a", muted: "#52525b", accent: "#0a0a0a" },
  font: { heading: "geist", body: "geist" },
  button: { style: "fill", radius: 14, bg: "#ffffff", fg: "#0a0a0a", border: "#e4e4e7" },
  avatar: { shape: "rounded" },
  layout: { width: "normal", spacing: "compact", variant: "card" },
};

/** True when the page background is dark (picks light logo / dim backdrop). */
export function isDarkTheme(theme: ThemeInput): boolean {
  const samples = backgroundSamples(theme);
  const avg = samples.reduce((n, c) => n + relativeLuminance(c), 0) / samples.length;
  return avg < 0.2;
}

/** Parses a stored theme, falling back to DEFAULT_THEME if it is missing or invalid. */
export function parseThemeOrDefault(value: unknown): Theme {
  const r = themeSchema.safeParse(value);
  return r.success ? r.data : themeSchema.parse(DEFAULT_THEME);
}
