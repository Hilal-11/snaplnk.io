import { listUsers } from "@/lib/admin/queries";
import { usersParams } from "@/lib/admin/params";
import { EXPORT_LIMIT, csvResponse, guardExport } from "@/lib/admin/csv";

export async function GET(request: Request) {
  const g = await guardExport("users");
  if (!g.ok) return g.response;
  const p = usersParams.parse(Object.fromEntries(new URL(request.url).searchParams));
  const { rows } = await listUsers({ ...p, page: 1, limit: EXPORT_LIMIT });
  return csvResponse(
    "users",
    rows.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      providers: u.providers,
      role: u.role,
      banned: u.is_banned,
      email_confirmed: u.email_confirmed,
      guest: u.is_anonymous,
      links: u.links,
      live_links: u.live_links,
      clicks: u.clicks,
      bio_pages: u.bio_pages,
      events: u.events,
      country: u.country,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      last_seen_at: u.last_seen_at,
    })),
    ["id", "email", "name", "providers", "role", "banned", "email_confirmed", "guest", "links", "live_links", "clicks", "bio_pages", "events", "country", "created_at", "last_sign_in_at", "last_seen_at"]
  );
}
