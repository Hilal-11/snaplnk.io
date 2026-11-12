import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { after } from "next/server";
import { safeNext } from "@/lib/safeNext";
import { syncUserAccess } from "@/lib/admin/sync";
import { trackServerEvent } from "@/lib/analytics/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Promote/demote from ADMIN_EMAILS and refuse banned accounts.
        const access = await syncUserAccess(user);
        if (access.banned) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/signup?error=banned`);
        }
        const isNew = Date.now() - new Date(user.created_at).getTime() < 10 * 60_000;
        after(() =>
          trackServerEvent(request, isNew ? "signup" : "login", {
            userId: user.id,
            path: "/auth/callback",
            metadata: { provider: String(user.app_metadata?.provider ?? "email") },
          })
        );
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/signup?error=auth`);
}
