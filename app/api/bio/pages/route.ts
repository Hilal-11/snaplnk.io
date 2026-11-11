// app/api/bio/pages/route.ts
// GET  — list the signed-in user's bio pages
// POST — create a page { username, template_id? }
import { requireRealUser } from "@/lib/auth/requireUser";
import { formatZodError, jsonError, readJson } from "@/lib/api/helpers";
import { createPageSchema, OWNER_PAGE_COLUMNS, type OwnerPageRow } from "@/lib/bio/schemas";
import { applyTemplate } from "@/lib/bio/templates/apply";
import { BIO_SCHEMA_VERSION } from "@/lib/bio/blocks";
import { DEFAULT_THEME, themeSchema } from "@/lib/bio/theme";
import { getPlanLimits } from "@/lib/bio/plans";
import { hasUnpublishedChanges } from "@/lib/bio/snapshot";
import { limitBio, tooManyRequests } from "@/lib/bio/ratelimit";

export async function GET() {
  const auth = await requireRealUser();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from("bio_pages")
    .select(OWNER_PAGE_COLUMNS)
    .eq("owner", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/bio/pages]", error);
    return jsonError(500, "Failed to load bio pages");
  }

  const pages = ((data ?? []) as OwnerPageRow[]).map((p) => ({
    ...p,
    has_unpublished_changes: p.is_published ? hasUnpublishedChanges(p, p.published) : false,
  }));
  return Response.json({ data: pages, limits: { maxPages: getPlanLimits(null).maxPages } }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: Request) {
  const auth = await requireRealUser();
  if (!auth.ok) return auth.response;
  const { user, supabase } = auth;

  const rl = await limitBio("create", user.id);
  if (!rl.allowed) return tooManyRequests(rl);

  const body = await readJson(request);
  if (!body.ok) return body.response;
  const parsed = createPageSchema.safeParse(body.data);
  if (!parsed.success) {
    return jsonError(400, "Invalid request", { details: formatZodError(parsed.error) });
  }
  const { username, template_id } = parsed.data;

  // Plan limit (server-side; the UI only mirrors it).
  const limits = getPlanLimits(null);
  const { count, error: countError } = await supabase
    .from("bio_pages")
    .select("id", { count: "exact", head: true })
    .eq("owner", user.id);
  if (countError) {
    console.error("[POST /api/bio/pages] count", countError);
    return jsonError(500, "Failed to create page");
  }
  if ((count ?? 0) >= limits.maxPages) {
    return jsonError(403, `Your plan includes ${limits.maxPages} bio page${limits.maxPages === 1 ? "" : "s"}. Upgrade to Pro for more.`);
  }

  const applied =
    template_id && template_id !== "blank"
      ? applyTemplate(template_id)
      : {
          profile: { displayName: "", bio: "" },
          theme: themeSchema.parse(DEFAULT_THEME),
          draft: { schema_version: BIO_SCHEMA_VERSION, blocks: [] },
        };
  if (!applied) return jsonError(400, "Unknown template");

  // 1) Insert (only owner/username/profile are insertable by clients — see migration).
  //    Uniqueness and reserved names are enforced by the DB; no racy pre-check.
  const { data: created, error: insertError } = await supabase
    .from("bio_pages")
    .insert({
      owner: user.id,
      username,
      display_name: applied.profile.displayName,
      bio: applied.profile.bio,
    })
    .select("id")
    .single();

  if (insertError || !created) {
    if (insertError?.code === "23505") return jsonError(409, "That username is already taken");
    if (insertError?.code === "23514") return jsonError(400, "That username is reserved or invalid");
    console.error("[POST /api/bio/pages] insert", insertError);
    return jsonError(500, "Failed to create page");
  }

  // 2) Apply theme + starter blocks.
  const { data: page, error: updateError } = await supabase
    .from("bio_pages")
    .update({ theme: applied.theme, draft: applied.draft })
    .eq("id", created.id)
    .eq("owner", user.id)
    .select(OWNER_PAGE_COLUMNS)
    .single();

  if (updateError || !page) {
    console.error("[POST /api/bio/pages] apply template", updateError);
    // Roll back so the username isn't left claimed by an empty page.
    await supabase.from("bio_pages").delete().eq("id", created.id).eq("owner", user.id);
    return jsonError(500, "Failed to create page");
  }

  return Response.json({ data: page }, { status: 201 });
}
