import type { BioTemplate } from "./types";

export const developer: BioTemplate = {
  id: "developer",
  name: "Developer",
  category: "tech",
  description: "Dark, monospace and to the point. Show off projects, repos and where to reach you.",
  profile: { displayName: "Your Name", bio: "Full-stack developer. Shipping side projects in public." },
  theme: {
    background: { type: "solid", color: "#0b1220" },
    text: { color: "#e2e8f0", muted: "#94a3b8", accent: "#22c55e" },
    font: { heading: "jetbrains-mono", body: "jetbrains-mono" },
    // Outline: transparent fill, so the label is checked against the page background.
    button: { style: "outline", radius: 6, bg: "#00000000", fg: "#22c55e", border: "#22c55e" },
    avatar: { shape: "square" },
    layout: { width: "narrow", spacing: "compact" },
  },
  blocks: [
    { type: "heading", text: "// projects" },
    {
      type: "link",
      title: "Featured project",
      url: "https://example.com/featured-project",
      highlight: true,
      placeholder: true,
    },
    { type: "link", title: "Open-source repo", url: "https://example.com/repo", placeholder: true },
    { type: "link", title: "Dev blog", url: "https://example.com/blog", placeholder: true },
    { type: "heading", text: "// find me" },
    {
      type: "social",
      items: [
        { platform: "github", handle: "" },
        { platform: "linkedin", handle: "" },
        { platform: "x", handle: "" },
        { platform: "email", handle: "" },
      ],
    },
    { type: "text", text: "Open to freelance work. Replies within 24 hours." },
  ],
};
