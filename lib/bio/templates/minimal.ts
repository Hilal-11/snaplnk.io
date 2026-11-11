import type { BioTemplate } from "./types";

export const minimal: BioTemplate = {
  id: "minimal",
  name: "Minimal",
  category: "personal",
  description: "Clean, light and distraction-free. Works for any profession.",
  profile: { displayName: "Your Name", bio: "Designer & maker. Building things on the internet." },
  theme: {
    background: { type: "solid", color: "#fafafa" },
    text: { color: "#111111", muted: "#525252", accent: "#111111" },
    font: { heading: "inter", body: "inter" },
    button: { style: "fill", radius: 12, bg: "#111111", fg: "#ffffff", border: "#111111" },
    avatar: { shape: "circle" },
    layout: { width: "narrow", spacing: "comfortable" },
  },
  blocks: [
    { type: "link", title: "My portfolio", url: "https://example.com/portfolio", highlight: true, placeholder: true },
    { type: "link", title: "Latest article", url: "https://example.com/blog", placeholder: true },
    { type: "link", title: "Join my newsletter", url: "https://example.com/newsletter", placeholder: true },
    { type: "link", title: "Book a chat", url: "https://example.com/contact", placeholder: true },
    { type: "divider", style: "line" },
    {
      type: "social",
      items: [
        { platform: "instagram", handle: "" },
        { platform: "x", handle: "" },
        { platform: "linkedin", handle: "" },
        { platform: "github", handle: "" },
      ],
    },
  ],
};
