// app/api/track/route.ts
// First-party analytics intake. Always answers 204 quickly; work happens after the
// response (after()). Drops: invalid/oversized payloads, bots, DNT/GPC visitors,
// rate-limited clients and (by default) admin traffic. Never stores raw IPs.
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/admin/ratelimit";
import { isAdminEmail } from "@/lib/admin/config";
import { EVENT_TYPE, MAX_BODY_BYTES, domainOf, trackBatchSchema, utmFrom } from "@/lib/analytics/events";
import { errorFingerprint, requestContext } from "@/lib/analytics/server";

const noContent = () => new Response(null, { status: 204 });

let excludeAdminCache: { value: boolean; at: number } | null = null;
async function excludeAdminTraffic(): Promise<boolean> {
  if (excludeAdminCache && Date.now() - excludeAdminCache.at < 60_000) return excludeAdminCache.value;
  try {
    const { data } = await createAdminClient().from("admin_settings").select("value").eq("key", "exclude_admin_traffic").maybeSingle();
    const value = data ? data.value !== false : true;
    excludeAdminCache = { value, at: Date.now() };
    return value;
  } catch {
    return true;
  }
}

export async function POST(request: Request) {
  try {
    if (!hasServiceRole()) return noContent();

    const declared = Number(request.headers.get("content-length") ?? "0");
    if (declared > MAX_BODY_BYTES) return noContent();
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return noContent();

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return noContent();
    }
    const parsed = trackBatchSchema.safeParse(json);
    if (!parsed.success) return noContent();

    const ctx = requestContext(request);
    if (ctx.isBot || ctx.optOut) return noContent();
    if (!(await rateLimit("track", ctx.ipHash ?? parsed.data.anonymousId))) return noContent();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const isAdmin = !!user && user.app_metadata?.role === "ADMIN" && isAdminEmail(user.email);
    if (isAdmin && (await excludeAdminTraffic())) return noContent();

    const batch = parsed.data;
    const userId = user && !user.is_anonymous ? user.id : null;

    after(async () => {
      try {
        const db = createAdminClient();
        const rows = batch.events.map((e) => ({
          type: EVENT_TYPE[e.name] ?? "event",
          name: e.name,
          user_id: userId,
          anonymous_id: batch.anonymousId,
          session_id: batch.sessionId,
          path: e.path ?? null,
          referrer: e.referrer ?? null,
          referrer_domain: domainOf(e.referrer),
          ...utmFrom(e.path),
          country: ctx.country,
          city: ctx.city,
          device: ctx.device,
          browser: ctx.browser,
          os: ctx.os,
          ip_hash: ctx.ipHash,
          metadata: e.metadata,
          // Client clocks can be wrong: accept only timestamps within the last hour.
          created_at:
            e.ts && Math.abs(Date.now() - e.ts) < 3_600_000 ? new Date(e.ts).toISOString() : new Date().toISOString(),
        }));
        const { error } = await db.from("analytics_events").insert(rows);
        if (error) console.error("[track] insert", error);

        const errors = batch.events.filter((e) => e.name === "client_error");
        if (errors.length) {
          await db.from("error_log").insert(
            errors.map((e) => {
              const message = String(e.metadata.message ?? "Unknown error").slice(0, 2000);
              const stack = typeof e.metadata.stack === "string" ? e.metadata.stack.slice(0, 8000) : null;
              return {
                fingerprint: errorFingerprint(message, stack),
                source: "client",
                message,
                stack,
                path: e.path ?? null,
                user_id: userId,
                user_agent: ctx.userAgent,
              };
            })
          );
        }

        const views = batch.events.filter((e) => e.name === "page_view");
        const lastPath = [...batch.events].reverse().find((e) => e.path)?.path ?? null;
        const firstReferrer = batch.events.find((e) => e.referrer)?.referrer ?? null;
        await db.rpc("analytics_touch_session", {
          p_id: batch.sessionId,
          p_anonymous_id: batch.anonymousId,
          p_user_id: userId,
          p_path: lastPath,
          p_pageviews: views.length,
          p_country: ctx.country,
          p_device: ctx.device,
          p_referrer: domainOf(firstReferrer),
        });
      } catch (err) {
        console.error("[track] background write failed", err);
      }
    });

    return noContent();
  } catch (err) {
    console.error("[track]", err);
    return noContent();
  }
}
