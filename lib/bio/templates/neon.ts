import type { BioTemplate } from "./types";

export const neon: BioTemplate = {
  id: "neon",
  name: "Neon Night",
  category: "music",
  description: "Dark and electric for artists and DJs. Streaming links up top, tour dates one tap away.",
  profile: { displayName: "Artist Name", bio: "New single out now. On tour this summer." },
  theme: {
    background: { type: "gradient", from: "#0a0a0f", to: "#1e1038", angle: 180 },
    text: { color: "#f8fafc", muted: "#a5b4fc", accent: "#22d3ee" },
    font: { heading: "space-grotesk", body: "space-grotesk" },
    button: { style: "shadow", radius: 14, bg: "#111827", fg: "#22d3ee", border: "#22d3ee66" },
    avatar: { shape: "circle" },
    layout: { width: "normal", spacing: "comfortable" },
  },
  blocks: [
    // Spotify player slot — hidden until the user pastes a track/album URL.
    { type: "embed", url: "", hidden: true },
    {
      type: "link",
      title: "Listen on Spotify",
      url: "https://example.com/spotify",
      highlight: true,
      placeholder: true,
    },
    { type: "link", title: "Apple Music", url: "https://example.com/apple-music", placeholder: true },
    { type: "link", title: "Tour dates", url: "https://example.com/tour", badge: "New", placeholder: true },
    { type: "link", title: "Merch", url: "https://example.com/merch", placeholder: true },
    {
      type: "social",
      items: [
        { platform: "instagram", handle: "" },
        { platform: "youtube", handle: "" },
        { platform: "x", handle: "" },
      ],
    },
  ],
};
