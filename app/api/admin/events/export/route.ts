import { createAdminClient } from "@/lib/supabase/admin";
import { eventsParams } from "@/lib/admin/params";
import { EXPORT_LIMIT, csvResponse, guardExport } from "@/lib/admin/csv";

export async function GET(request: Request) {
  const g = await guardExport("events");
  if (!g.ok) return g.response;
  const p = eventsParams.parse(Object.fromEntries(new URL(request.url).searchParams));

  let query = createAdminClient()
    .from("analytics_events")
    .select("id, type, name, user_id, anonymous_id, session_id, path, referrer_domain, utm_source, utm_medium, utm_campaign, country, city, device, browser, os, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(EXPORT_LIMIT);
  if (p.name) query = query.eq("name", p.name);
  if (p.type) query = query.eq("type", p.type);
  if (p.user) query = query.eq("user_id", p.user);
  if (p.session) query = query.eq("session_id", p.session);
  if (p.path) query = query.ilike("path", `${p.path.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
  const { data } = await query;

  return csvResponse(
    "events",
    (data ?? []).map((e) => ({ ...e, metadata: JSON.stringify(e.metadata ?? {}) })),
    ["id", "created_at", "type", "name", "path", "user_id", "anonymous_id", "session_id", "referrer_domain", "utm_source", "utm_medium", "utm_campaign", "country", "city", "device", "browser", "os", "metadata"]
  );
}
