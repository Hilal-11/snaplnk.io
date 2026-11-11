// app/api/bio/pages/[id]/route.ts
// GET    — one page (owner)
// PATCH  — autosave { expected_version, display_name?, bio?, theme?, draft? } (409 if stale)
// DELETE — delete the page (events, stats and subscribers cascade)
import { requireRealUser } from "@/lib/auth/requireUser";
import { formatZodError, jsonError, readJson } from "@/lib/api/helpers";
import { OWNER_PAGE_COLUMNS, pageIdSchema, updatePageSchema } from "@/lib/bio/schemas";
import { getPlanLimits } from "@/lib/bio/plans";
import { limitBio, tooManyRequests } from "@/lib/bio/ratelimit";

type Params = { params: Promise<{ id: string }> };

async function resolveId(params: Params["params"]) {
  const { id } = await params;
  return pageIdSchema.safeParse(id);
}

export async function GET(_req: Request, { params }: Params) {
  const id = await resolveId(params);
  if (!id.success) return jsonError(404, "Page not found");
  const auth = await requireRealUser();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from("bio_pages")
    .select(OWNER_PAGE_COLUMNS)
    .eq("id", id.data)
    .eq("owner", auth.user.id)
    .maybeSingle();
  if (error) {
    console.error("[GET bio page]", error);
    return jsonError(500, "Failed to load page");
  }
  if (!data) return jsonError(404, "Page not found");
  return Response.json({ data }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request, { params }: Params) {
  const id = await resolveId(params);
  if (!id.success) return jsonError(404, "Page not found");
  const auth = await requireRealUser();
  if (!auth.ok) return auth.response;

  const rl = await limitBio("write", auth.user.id);
  if (!rl.allowed) return tooManyRequests(rl);

  const body = await readJson(request, { maxBytes: 300 * 1024 });
  if (!body.ok) return body.response;
  const parsed = updatePageSchema.safeParse(body.data);
  if (!parsed.success) return jsonError(400, "Invalid page data", { details: formatZodError(parsed.error) });

  const { expected_version, ...fields } = parsed.data;
  if (fields.draft && fields.draft.blocks.length > getPlanLimits(null).maxBlocks) {
    return jsonError(403, `Your plan allows up to ${getPlanLimits(null).maxBlocks} blocks per page.`);
  }

  // Optimistic concurrency: only update if nobody saved since this tab loaded.
  const { data, error } = await auth.supabase
    .from("bio_pages")
    .update({ ...fields, version: expected_version + 1 })
    .eq("id", id.data)
    .eq("owner", auth.user.id)
    .eq("version", expected_version)
    .select("version, updated_at")
    .maybeSingle();

  if (error) {
    console.error("[PATCH bio page]", error);
    return jsonError(500, "Failed to save");
  }
  if (!data) {
    const { data: exists } = await auth.supabase
      .from("bio_pages")
      .select("version")
      .eq("id", id.data)
      .eq("owner", auth.user.id)
      .maybeSingle();
    if (!exists) return jsonError(404, "Page not found");
    return jsonError(409, "This page was edited in another tab.", { details: { version: exists.version } });
  }
  return Response.json({ data });
}

export async function DELETE(_req: Request, { params }: Params) {
  const id = await resolveId(params);
  if (!id.success) return jsonError(404, "Page not found");
  const auth = await requireRealUser();
  if (!auth.ok) return auth.response;

  const rl = await limitBio("write", auth.user.id);
  if (!rl.allowed) return tooManyRequests(rl);

  const { data, error } = await auth.supabase
    .from("bio_pages")
    .delete()
    .eq("id", id.data)
    .eq("owner", auth.user.id)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("[DELETE bio page]", error);
    return jsonError(500, "Failed to delete page");
  }
  if (!data) return jsonError(404, "Page not found");
  // TODO(Phase 3): remove the owner's bio-assets storage files once image uploads exist.
  return Response.json({ data: { id: data.id } });
}
