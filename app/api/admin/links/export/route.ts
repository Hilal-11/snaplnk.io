import { listLinks } from "@/lib/admin/queries";
import { linksParams } from "@/lib/admin/params";
import { EXPORT_LIMIT, csvResponse, guardExport } from "@/lib/admin/csv";
import { getShortUrl } from "@/lib/utils/getShortUrl";

export async function GET(request: Request) {
  const g = await guardExport("links");
  if (!g.ok) return g.response;
  const p = linksParams.parse(Object.fromEntries(new URL(request.url).searchParams));
  const { rows } = await listLinks({ ...p, page: 1, limit: EXPORT_LIMIT });
  return csvResponse(
    "all-links",
    rows.map((l) => ({
      id: l.id,
      short_url: getShortUrl(l.short_code),
      destination: l.original_url,
      title: l.title,
      owner_email: l.owner_email,
      owner_id: l.owner,
      clicks: l.clicks_count,
      unique_clicks: l.unique_clicks_count,
      tags: l.tags ?? [],
      active: l.is_active,
      archived: l.archived_link,
      deleted: l.is_deleted,
      has_qr: l.has_qr,
      expires_at: l.expires_at,
      max_clicks: l.max_clicks,
      created_at: l.created_at,
      last_clicked_at: l.last_clicked_at,
    })),
    ["id", "short_url", "destination", "title", "owner_email", "owner_id", "clicks", "unique_clicks", "tags", "active", "archived", "deleted", "has_qr", "expires_at", "max_clicks", "created_at", "last_clicked_at"]
  );
}
