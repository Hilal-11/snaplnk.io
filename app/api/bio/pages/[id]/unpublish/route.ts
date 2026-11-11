// app/api/bio/pages/[id]/unpublish/route.ts
// POST — take the page offline (the last snapshot is kept so it can be re-published).
import { requireRealUser } from "@/lib/auth/requireUser";
import { jsonError } from "@/lib/api/helpers";
import { pageIdSchema } from "@/lib/bio/schemas";
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

  const { error } = await auth.supabase.rpc("bio_unpublish_page", { p_page_id: id.data });
  if (error) {
    if (error.code === "P0002") return jsonError(404, "Page not found");
    console.error("[unpublish] rpc", error);
    return jsonError(500, "Failed to unpublish");
  }
  return Response.json({ data: { is_published: false } });
}
