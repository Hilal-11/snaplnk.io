// app/api/account/delete/route.ts
// POST { confirm: "DELETE" } — permanently deletes the signed-in user's account and data.
// The database work is one atomic RPC (delete_my_account); QR images on Cloudinary are
// cleaned up afterwards, best-effort, so a Cloudinary hiccup can never leave a half-deleted account.
import { z } from "zod";
import { requireRealUser } from "@/lib/auth/requireUser";
import { jsonError, readJson } from "@/lib/api/helpers";
import { deleteFromCloudinary } from "@/lib/utils/cloudinary";
import { limitBio, tooManyRequests } from "@/lib/bio/ratelimit";

const bodySchema = z.object({ confirm: z.literal("DELETE") });

export async function POST(request: Request) {
  const auth = await requireRealUser();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  const rl = await limitBio("publish", user.id);
  if (!rl.allowed) return tooManyRequests(rl);

  const body = await readJson(request);
  if (!body.ok) return body.response;
  if (!bodySchema.safeParse(body.data).success) {
    return jsonError(400, 'Type "DELETE" to confirm.');
  }

  // Collect QR image ids before the rows disappear.
  const { data: qrRows } = await supabase
    .from("links")
    .select("qr_code_public_id")
    .eq("owner", user.id)
    .not("qr_code_public_id", "is", null);

  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    // PGRST202 / 42883: the function isn't in the database yet.
    if (error.code === "PGRST202" || error.code === "42883") {
      return jsonError(501, "Account deletion isn't set up yet. Apply the delete_my_account migration.");
    }
    console.error("[account delete]", error);
    return jsonError(500, "We couldn't delete your account. Nothing was removed — please try again or contact support.");
  }

  const ids = (qrRows ?? []).map((r) => r.qr_code_public_id as string).filter(Boolean);
  const cleanup = await Promise.allSettled(ids.map((id) => deleteFromCloudinary(id)));
  const failed = cleanup.filter((r) => r.status === "rejected").length;
  if (failed) console.error(`[account delete] ${failed}/${ids.length} Cloudinary deletions failed`);

  // Clear the session cookies (the user no longer exists).
  await supabase.auth.signOut().catch(() => undefined);
  return Response.json({ data: { deleted: true } });
}
