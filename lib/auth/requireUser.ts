// lib/auth/requireUser.ts
// Route-handler guard: resolves a signed-in, NON-anonymous user or returns the
// error Response to send back. Guests (Supabase anonymous sign-in) get 403.
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { jsonError } from "@/lib/api/helpers";

export type RequireUserResult =
  | { ok: true; user: User; supabase: SupabaseClient }
  | { ok: false; response: Response };

export async function requireRealUser(): Promise<RequireUserResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { ok: false, response: jsonError(401, "Unauthorized") };
  if (user.is_anonymous) return { ok: false, response: jsonError(403, "Sign in required") };
  return { ok: true, user, supabase };
}
