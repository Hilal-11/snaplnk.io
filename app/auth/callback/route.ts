// app/auth/callback/route.ts
// Finishes every sign-in that comes back from Supabase:
//   • OAuth (Google/GitHub) and email links in PKCE mode  → ?code=…
//   • email links using the token-hash template            → ?token_hash=…&type=…
//   • errors Supabase reports (expired/used link, cancel)  → ?error=…&error_code=…
// Failures go back to /signup with a specific `reason`, and are logged server-side.
import type { EmailOtpType, User } from "@supabase/supabase-js";
import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safeNext";
import { syncUserAccess } from "@/lib/admin/sync";
import { trackServerEvent } from "@/lib/analytics/server";
import { authFailureReason } from "@/lib/authErrors";

const OTP_TYPES: readonly EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNext(searchParams.get("next"));
  const supabase = await createClient();

  const fail = (reason: string) => {
    const to = new URL("/signup", origin);
    to.searchParams.set("error", "auth");
    to.searchParams.set("reason", reason);
    if (next !== "/dashboard") to.searchParams.set("next", next);
    return NextResponse.redirect(to);
  };

  const finish = async (user: User) => {
    // Promote/demote from ADMIN_EMAILS and refuse banned accounts.
    const access = await syncUserAccess(user);
    if (access.banned) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/signup?error=banned", origin));
    }
    const isNew = Date.now() - new Date(user.created_at).getTime() < 10 * 60_000;
    after(() =>
      trackServerEvent(request, isNew ? "signup" : "login", {
        userId: user.id,
        path: "/auth/callback",
        metadata: { provider: String(user.app_metadata?.provider ?? "email") },
      })
    );
    return NextResponse.redirect(new URL(next, origin));
  };

  const currentUser = async () => (await supabase.auth.getUser()).data.user;

  // 1) Supabase reported an error (expired/used link, cancelled OAuth, …).
  const reported = searchParams.get("error_code") ?? searchParams.get("error");
  if (reported) {
    console.warn("[auth/callback] provider error:", reported, searchParams.get("error_description"));
    const user = await currentUser(); // e.g. link opened twice in the same browser
    return user ? finish(user) : fail(authFailureReason(reported));
  }

  // 2) Exchange the code / verify the token hash.
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  let failure: { code?: string; message: string } | null = null;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) failure = { code: error.code, message: error.message };
  } else if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) failure = { code: error.code, message: error.message };
  } else {
    const user = await currentUser();
    return user ? finish(user) : fail("missing_code");
  }

  // A failed exchange can still leave a valid session (code reused by a double click
  // or an email scanner in the same browser) — if so, carry on.
  const user = await currentUser();
  if (user) return finish(user);

  console.error("[auth/callback] sign-in failed:", failure?.code, failure?.message);
  return fail(authFailureReason(failure?.code ?? failure?.message ?? "unknown"));
}
