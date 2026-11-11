// lib/bio/contrast.ts
// WCAG 2.x contrast helpers for user-selected themes. Pure functions, no DOM.

export type RGBA = { r: number; g: number; b: number; a: number };

const HEX_RE = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i;

export function parseHex(hex: string): RGBA {
  const m = HEX_RE.exec(hex.trim());
  if (!m) throw new Error(`Invalid hex colour: ${hex}`);
  const n = Number.parseInt(m[1], 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
    a: m[2] ? Number.parseInt(m[2], 16) / 255 : 1,
  };
}

/** Alpha-composite `top` over an opaque `bottom`. */
export function composite(top: RGBA, bottom: RGBA): RGBA {
  const a = top.a;
  return {
    r: Math.round(top.r * a + bottom.r * (1 - a)),
    g: Math.round(top.g * a + bottom.g * (1 - a)),
    b: Math.round(top.b * a + bottom.b * (1 - a)),
    a: 1,
  };
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(c: RGBA): number {
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

/** Contrast ratio (1..21). Translucent foreground is composited over the background first. */
export function contrastRatio(fg: string | RGBA, bg: string | RGBA): number {
  const b = typeof bg === "string" ? parseHex(bg) : bg;
  const opaqueBg = b.a < 1 ? composite(b, { r: 255, g: 255, b: 255, a: 1 }) : b;
  const f0 = typeof fg === "string" ? parseHex(fg) : fg;
  const f = f0.a < 1 ? composite(f0, opaqueBg) : f0;
  const l1 = relativeLuminance(f);
  const l2 = relativeLuminance(opaqueBg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export const WCAG_AA_NORMAL = 4.5;

/** Linear interpolation between two opaque colours (t in 0..1) — used to sample gradients. */
export function mix(a: string, b: string, t: number): RGBA {
  const x = parseHex(a);
  const y = parseHex(b);
  return {
    r: Math.round(x.r + (y.r - x.r) * t),
    g: Math.round(x.g + (y.g - x.g) * t),
    b: Math.round(x.b + (y.b - x.b) * t),
    a: 1,
  };
}
