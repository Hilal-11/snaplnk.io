// app/api/bio/pages/[id]/publish/route.ts
// POST — validate the saved draft and publish it atomically (bio_publish_page RPC).
// Returns 422 with structured { errors, warnings } when something blocks publishing.
import { requireRealUser } from "@/lib/auth/requireUser";
import { jsonError } from "@/lib/api/helpers";
import { pageIdSchema } from "@/lib/bio/schemas";
import { validateForPublish } from "@/lib/bio/publish";
import { limitBio, tooManyRequests } from "@/lib/bio/ratelimit";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { id: rawId } = await params;
  const id = pageIdSchema.safeParse(rawId);
  if (!id.success) return jsonError(404, "Page not found");

  const auth = await requireRealUser();
  if (!auth.ok) return auth.response;
  const rl = await limitBio("publish", auth.user.id);
  if (!rl.allowed) return tooManyRequests(rl);

  const { data: page, error } = await auth.supabase
    .from("bio_pages")
    .select("id, username, display_name, theme, draft, version, is_suspended")
    .eq("id", id.data)
    .eq("owner", auth.user.id)
    .maybeSingle();
  if (error) {
    console.error("[publish] load", error);
    return jsonError(500, "Failed to publish");
  }
  if (!page) return jsonError(404, "Page not found");
  if (page.is_suspended) return jsonError(403, "This page is suspended and can't be published.");

  // Re-validate everything server-side; never trust what the editor already checked.
  const check = validateForPublish({ displayName: page.display_name, theme: page.theme, draft: page.draft });
  if (check.errors.length) {
    return Response.json({ error: "Fix these issues before publishing", ...check }, { status: 422 });
  }

  // Atomic snapshot, guarded by the exact draft version we just validated.
  const { data: publishedAt, error: rpcError } = await auth.supabase.rpc("bio_publish_page", {
    p_page_id: page.id,
    p_version: page.version,
  });
  if (rpcError) {
    if (rpcError.code === "P0002") {
      return jsonError(409, "The page changed while publishing. Please try again.");
    }
    console.error("[publish] rpc", rpcError);
    return jsonError(500, "Failed to publish");
  }

  // TODO(Phase 6 caching): purge Redis key bio:{username} + revalidateTag once the read cache exists.
  return Response.json({
    data: { published_at: publishedAt, username: page.username },
    warnings: check.warnings,
  });
}
