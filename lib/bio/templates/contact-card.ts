import type { BioTemplate } from "./types";

// Warm "business card": cream page, beige cover band, large round avatar, social icons
// above the name, and contact rows (Direct / Email / Company / Address).
// Contrast note: the avatar orange is #c2410c (not a lighter #e4683f) so the white
// initials reach WCAG AA 4.5:1.
export const contactCard: BioTemplate = {
  id: "contact-card",
  name: "Contact Card",
  category: "business",
  description: "A warm digital business card: cover banner, socials and tap-to-call contact details.",
  profile: { displayName: "Hearth & Home", bio: "Visit us today at one of our four showrooms" },
  theme: {
    background: { type: "solid", color: "#fcf9f5" },
    cover: "#e9dcc8",
    text: { color: "#1f2328", muted: "#57534e", accent: "#1f2328" },
    font: { heading: "lora", body: "lora" },
    button: { style: "fill", radius: 12, bg: "#c2410c", fg: "#ffffff", border: "#c2410c" },
    avatar: { shape: "circle" },
    layout: { width: "narrow", spacing: "comfortable", variant: "cover" },
  },
  blocks: [
    {
      type: "social",
      items: [
        { platform: "instagram", handle: "" },
        { platform: "linkedin", handle: "" },
        { platform: "email", handle: "" },
      ],
    },
    {
      type: "contact_card",
      title: "Save our contact",
      name: "Hearth & Home",
      phone: "303.333.4444",
      email: "contact@company.com",
      company: "",
      website: "https://www.hearthandhome.com/",
      address: "Nashville, TN",
      placeholder: true,
    },
  ],
};
