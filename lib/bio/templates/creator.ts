import type { BioTemplate } from "./types";

// Contrast note: the brief's gradient end #db2777 gave white text only ~4.6:1 and the muted
// colour failed AA there, so the end stop is darkened to #be185d (pink-700). The soft button
// fill is 10% white — at 15% the white label drops below 4.5:1 on the purple end.
export const creator: BioTemplate = {
  id: "creator",
  name: "Creator",
  category: "creator",
  description: "Bold gradient for YouTubers, streamers and influencers. Built to drive clicks to new drops.",
  profile: { displayName: "Your Name", bio: "Videos every Friday. Tech, travel and everything in between." },
  theme: {
    background: { type: "gradient", from: "#7c3aed", to: "#be185d", angle: 160 },
    text: { color: "#ffffff", muted: "#fce7f3", accent: "#ffffff" },
    font: { heading: "poppins", body: "poppins" },
    button: { style: "soft", radius: 999, bg: "#ffffff1a", fg: "#ffffff", border: "#ffffff4d" },
    avatar: { shape: "circle" },
    layout: { width: "normal", spacing: "airy" },
  },
  blocks: [
    {
      type: "link",
      title: "New video out now",
      url: "https://example.com/latest-video",
      highlight: true,
      badge: "New",
      placeholder: true,
    },
    // Empty slot for a YouTube/Spotify embed — hidden until the user pastes a URL.
    { type: "embed", url: "", hidden: true },
    { type: "link", title: "Join the community", url: "https://example.com/community", placeholder: true },
    { type: "link", title: "Shop my merch", url: "https://example.com/shop", placeholder: true },
    { type: "link", title: "Work with me", url: "https://example.com/work-with-me", placeholder: true },
    {
      type: "social",
      items: [
        { platform: "youtube", handle: "" },
        { platform: "instagram", handle: "" },
        { platform: "x", handle: "" },
        { platform: "telegram", handle: "" },
      ],
    },
  ],
};
