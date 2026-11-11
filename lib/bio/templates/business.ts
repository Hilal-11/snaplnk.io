import type { BioTemplate } from "./types";

export const business: BioTemplate = {
  id: "business",
  name: "Local Business",
  category: "business",
  description: "For shops, cafés and studios: WhatsApp, menu, directions and a contact card in one place.",
  profile: { displayName: "Your Business", bio: "Fresh, local and family-run since 2010." },
  theme: {
    background: { type: "solid", color: "#f8fafc" },
    text: { color: "#1f2937", muted: "#4b5563", accent: "#0f766e" },
    font: { heading: "dm-serif-display", body: "inter" },
    button: { style: "shadow", radius: 14, bg: "#ffffff", fg: "#1f2937", border: "#e2e8f0" },
    avatar: { shape: "rounded" },
    layout: { width: "normal", spacing: "comfortable" },
  },
  blocks: [
    {
      type: "link",
      title: "Chat on WhatsApp",
      url: "https://wa.me/910000000000",
      highlight: true,
      placeholder: true,
    },
    { type: "link", title: "View our menu", url: "https://example.com/menu", placeholder: true },
    { type: "link", title: "Find us on Google Maps", url: "https://example.com/maps", placeholder: true },
    {
      type: "contact_card",
      title: "Save our contact",
      name: "",
      phone: "",
      email: "",
      company: "",
      website: "",
    },
    { type: "text", text: "Open Mon-Sat, 10am-7pm" },
    {
      type: "social",
      items: [
        { platform: "instagram", handle: "" },
        { platform: "facebook", handle: "" },
        { platform: "whatsapp", handle: "" },
        { platform: "phone", handle: "" },
      ],
    },
  ],
};
