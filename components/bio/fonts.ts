// components/bio/fonts.ts
// next/font loaders for bio-page fonts. next/font downloads these at build time and
// self-hosts them, so visitors' browsers never request fonts from Google at runtime.
// Import `bioFontVariables` only in bio-page routes (public page + builder preview),
// so the rest of the app doesn't pay for these fonts.
import { DM_Serif_Display, Inter, JetBrains_Mono, Poppins, Space_Grotesk } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-bio-inter", display: "swap" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-bio-poppins",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-bio-jetbrains-mono", display: "swap" });
const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bio-dm-serif-display",
  display: "swap",
});
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-bio-space-grotesk", display: "swap" });

/** className that defines every --font-bio-* variable (see lib/bio/fonts.ts BIO_FONT_VARS). */
export const bioFontVariables = [
  inter.variable,
  poppins.variable,
  jetbrainsMono.variable,
  dmSerifDisplay.variable,
  spaceGrotesk.variable,
].join(" ");
