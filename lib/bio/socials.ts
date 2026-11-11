// lib/bio/socials.ts
// Turns a social handle (or a pasted profile URL) into a safe outbound URL.
import type { SocialPlatform } from "./blocks";
import { validateDestinationUrl } from "@/lib/validators/url";

export const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  x: "X",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  github: "GitHub",
  tiktok: "TikTok",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  email: "Email",
  phone: "Phone",
  website: "Website",
};

export const SOCIAL_PLACEHOLDERS: Record<SocialPlatform, string> = {
  instagram: "username",
  x: "username",
  youtube: "channel handle",
  linkedin: "profile name",
  github: "username",
  tiktok: "username",
  facebook: "page name",
  whatsapp: "+91 98765 43210",
  telegram: "username",
  email: "you@example.com",
  phone: "+91 98765 43210",
  website: "https://example.com",
};

const HANDLE_RE = /^[A-Za-z0-9._-]{1,64}$/;
const EMAIL_RE = /^[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[A-Za-z]{2,}$/;

const TEMPLATES: Partial<Record<SocialPlatform, (h: string) => string>> = {
  instagram: (h) => `https://instagram.com/${h}`,
  x: (h) => `https://x.com/${h}`,
  youtube: (h) => `https://youtube.com/@${h}`,
  linkedin: (h) => `https://linkedin.com/in/${h}`,
  github: (h) => `https://github.com/${h}`,
  tiktok: (h) => `https://tiktok.com/@${h}`,
  facebook: (h) => `https://facebook.com/${h}`,
  telegram: (h) => `https://t.me/${h}`,
};

/** Returns the outbound URL for a social item, or null if it is empty/invalid (rendered as nothing). */
export function socialUrl(platform: SocialPlatform, rawHandle: string): string | null {
  const value = rawHandle.trim();
  if (!value) return null;

  if (platform === "email") return EMAIL_RE.test(value) ? `mailto:${value}` : null;

  if (platform === "phone" || platform === "whatsapp") {
    const digits = value.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
    const bare = digits.replace(/^\+/, "");
    if (bare.length < 6 || bare.length > 15) return null;
    return platform === "phone" ? `tel:${digits}` : `https://wa.me/${bare}`;
  }

  // A full URL pasted in: accept it only if it passes the normal URL safety checks.
  if (/^https?:\/\//i.test(value)) {
    const r = validateDestinationUrl(value);
    return r.ok ? r.url : null;
  }
  if (platform === "website") {
    const r = validateDestinationUrl(`https://${value}`);
    return r.ok ? r.url : null;
  }

  const handle = value.replace(/^@+/, "");
  const build = TEMPLATES[platform];
  return build && HANDLE_RE.test(handle) ? build(handle) : null;
}
