// lib/bio/fonts.ts
// Curated bio-page font list (ids only — pure, safe to import anywhere).
// The actual next/font loaders live in components/bio/fonts.ts.

export const BIO_FONT_IDS = [
  "geist",
  "geist-mono",
  "inter",
  "poppins",
  "jetbrains-mono",
  "dm-serif-display",
  "space-grotesk",
  "lora",
] as const;

export type BioFontId = (typeof BIO_FONT_IDS)[number];

export const BIO_FONT_LABELS: Record<BioFontId, string> = {
  geist: "Geist",
  "geist-mono": "Geist Mono",
  inter: "Inter",
  poppins: "Poppins",
  "jetbrains-mono": "JetBrains Mono",
  "dm-serif-display": "DM Serif Display",
  "space-grotesk": "Space Grotesk",
  lora: "Lora",
};

/** CSS custom property each font is exposed as (set by components/bio/fonts.ts). */
export const BIO_FONT_VARS: Record<BioFontId, string> = {
  geist: "--font-geist-sans",
  "geist-mono": "--font-geist-mono",
  inter: "--font-bio-inter",
  poppins: "--font-bio-poppins",
  "jetbrains-mono": "--font-bio-jetbrains-mono",
  "dm-serif-display": "--font-bio-dm-serif-display",
  "space-grotesk": "--font-bio-space-grotesk",
  lora: "--font-bio-lora",
};
