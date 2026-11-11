// app/api/bio/username-check/route.ts
// GET ?u=name -> { status: "available" | "taken" | "reserved" | "invalid", message? }
import { requireRealUser } from "@/lib/auth/requireUser";
import { jsonError } from "@/lib/api/helpers";
import { checkUsername } from "@/lib/bio/reserved";
import { limitBio, tooManyRequests } from "@/lib/bio/ratelimit";

export async function GET(request: Request) {
  const auth = await requireRealUser();
  if (!auth.ok) return auth.response;
  const rl = await limitBio("check", auth.user.id);
  if (!rl.allowed) return tooManyRequests(rl);

  const raw = new URL(request.url).searchParams.get("u") ?? "";
  const local = checkUsername(raw);
  if (local.status !== "ok") {
    return Response.json({ status: local.status, username: local.username, message: local.message });
  }

  const { data, error } = await auth.supabase.rpc("bio_username_status", { p_username: local.username });
  if (error) {
    console.error("[username-check]", error);
    return jsonError(500, "Couldn't check that username");
  }
  const status = data as "available" | "taken" | "reserved" | "invalid";
  const message =
    status === "taken" ? "That username is taken" : status === "reserved" ? "That username is reserved" : undefined;
  return Response.json(
    { status, username: local.username, message },
    { headers: { "Cache-Control": "private, max-age=10" } }
  );
}
