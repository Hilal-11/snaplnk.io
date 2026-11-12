import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/utils/baseUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/dashboard", "/auth/"] }],
    sitemap: `${getBaseUrl()}/sitemap.xml`,
  };
}
