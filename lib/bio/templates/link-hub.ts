import type { BioTemplate } from "./types";
import type { ThemeInput } from "@/lib/bio/theme";

// Minimal "link hub": a profile card (logo, name, @handle, bio, social chips) and
// link rows with an icon tile and an external-link arrow. Ships dark; the light
// version is offered as a design preset (LINK_HUB_LIGHT).

export const LINK_HUB_DARK: ThemeInput = {
  background: { type: "solid", color: "#050505" },
  text: { color: "#fafafa", muted: "#a1a1aa", accent: "#fafafa" },
  font: { heading: "geist", body: "geist" },
  button: { style: "fill", radius: 14, bg: "#101010", fg: "#fafafa", border: "#232323" },
  avatar: { shape: "rounded" },
  layout: { width: "normal", spacing: "compact", variant: "card" },
};

export const LINK_HUB_LIGHT: ThemeInput = {
  background: { type: "solid", color: "#f2f3f5" },
  text: { color: "#0a0a0a", muted: "#52525b", accent: "#0a0a0a" },
  font: { heading: "geist", body: "geist" },
  button: { style: "fill", radius: 14, bg: "#ffffff", fg: "#0a0a0a", border: "#e4e4e7" },
  avatar: { shape: "rounded" },
  layout: { width: "normal", spacing: "compact", variant: "card" },
};

export const linkHub: BioTemplate = {
  id: "link-hub",
  name: "Link Hub",
  category: "creator",
  description: "Sleek profile card with icon link rows. Dark by default, with a light version in Design.",
  profile: { displayName: "VaveLabs", bio: "Designing digital tools, UI kits, and web templates." },
  theme: LINK_HUB_DARK,
  blocks: [
    {
      type: "social",
      items: [
        { platform: "instagram", handle: "" },
        { platform: "youtube", handle: "" },
        { platform: "tiktok", handle: "" },
        { platform: "x", handle: "" },
      ],
    },
    { type: "link", title: "GitHub", url: "https://example.com/github", icon: "github", placeholder: true },
    { type: "link", title: "Playlist", url: "https://example.com/playlist", icon: "spotify", placeholder: true },
    { type: "link", title: "Behance", url: "https://example.com/behance", icon: "behance", placeholder: true },
    { type: "link", title: "Contact", url: "https://example.com/contact", icon: "message", placeholder: true },
  ],
};
