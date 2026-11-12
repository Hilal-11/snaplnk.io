import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/utils/baseUrl";

// Public marketing pages only. /admin, /dashboard and /api are intentionally excluded.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getBaseUrl();
  return ["", "/pricing", "/faqs", "/privacy", "/signup"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.6,
  }));
}
