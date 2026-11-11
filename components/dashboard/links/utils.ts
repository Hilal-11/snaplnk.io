import type { LinkItem, LinkStatus } from "./types";

export function formatDate(date: string | Date, withYear = true): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

export function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateString, false);
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Favicon for the destination — stored favicon first, Google's favicon service as fallback. */
export function faviconFor(link: Pick<LinkItem, "favicon_url" | "original_url">): string {
  if (link.favicon_url) return link.favicon_url;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
    hostnameOf(link.original_url)
  )}&sz=64`;
}

export function getLinkStatus(link: LinkItem): LinkStatus {
  if (link.expires_at && new Date(link.expires_at) < new Date()) return "expired";
  if (link.max_clicks !== null && link.clicks_count >= link.max_clicks) return "limit";
  if (link.archived_link) return "hidden";
  if (!link.is_active) return "disabled";
  return "active";
}

export function displayTitle(link: LinkItem): string {
  return link.title?.trim() || hostnameOf(link.original_url);
}

export async function downloadQr(qrUrl: string, fileName: string) {
  const res = await fetch(qrUrl);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = `${fileName}-qr.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

/** Native share sheet when available, clipboard otherwise. Returns "copied" if it fell back. */
export async function shareUrl(url: string, title?: string): Promise<"shared" | "copied" | "cancelled"> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: title ?? url, url });
      return "shared";
    } catch {
      return "cancelled";
    }
  }
  await navigator.clipboard.writeText(url);
  return "copied";
}

export function normalizeTag(raw: string): string {
  return raw.trim().replace(/,+$/, "").replace(/\s+/g, " ").slice(0, 40);
}
