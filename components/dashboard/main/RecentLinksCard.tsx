import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDistanceToNow } from "date-fns";
import {
  FiExternalLink,
  FiBarChart2,
  FiGlobe,
  FiMapPin,
} from "react-icons/fi";
import RecentLinkActions from "./RecentLinkActions";

export default async function RecentLinksCard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: links } = await supabase
    .from("links")
    .select(
      "id, title, original_url, short_code, domain, favicon_url, qr_code_url, qr_code_public_id, clicks_count, created_at"
    )
    .eq("owner", user!.id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(3);

  // pull the most recent click's location per link, for the "last seen from" line
  const linkIds = links?.map((l) => l.id) ?? [];
  const { data: recentClicks } = linkIds.length
    ? await supabase
        .from("click_events")
        .select("link_id, country, city, clicked_at")
        .in("link_id", linkIds)
        .order("clicked_at", { ascending: false })
    : { data: [] };

  const lastLocationByLink = new Map<string, { country: string; city: string }>();
  recentClicks?.forEach((c) => {
    if (!lastLocationByLink.has(c.link_id)) {
      lastLocationByLink.set(c.link_id, { country: c.country, city: c.city });
    }
  });

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-neutral-900">Recent Links</p>
        <Link
          href="/dashboard/links"
          className="text-xs font-semibold text-neutral-500 hover:text-neutral-900"
        >
          View all
        </Link>
      </div>

      <div className="space-y-4 flex-1">
        {links?.length === 0 && (
          <p className="text-xs text-neutral-400 text-center py-8">
            No links yet — create your first one above.
          </p>
        )}

        {links?.map((link) => {
          const location = lastLocationByLink.get(link.id);
          const shortUrl = `http://${link.domain}/${link.short_code}`;

          return (
            <div
              key={link.id}
              className="rounded-lg bg-neutral-100 border border-neutral-200 p-3 hover:border-neutral-200 hover:bg-neutral-50/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Favicon */}
                {link.favicon_url ? (
                  <img
                    src={link.favicon_url}
                    alt=""
                    className="w-9 h-9 rounded-full border border-neutral-200 flex-shrink-0 object-cover mt-0.5"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FiGlobe className="text-neutral-400 text-sm" />
                  </span>
                )}

                <div className="flex-1 min-w-0">
                  
                  <a  href={shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-neutral-900 hover:text-blue-600 hover:underline truncate block"
                  >
                    {link.title || shortUrl}
                  </a>

                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-neutral-500">
                    <span className="flex items-center gap-1 font-medium">
                      <FiBarChart2 className="text-[11px]" />
                      {link.clicks_count} clicks
                    </span>

                    {location && (
                      <span className="flex items-center gap-1">
                        <FiMapPin className="text-[11px]" />
                        {location.city !== "Unknown" ? `${location.city}, ` : ""}
                        {location.country}
                      </span>
                    )}

                    <span>
                      {formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>

              <RecentLinkActions
                shortUrl={shortUrl}
                originalUrl={link.original_url}
                qrCodeUrl={link.qr_code_url}
                title={link.title || shortUrl}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

