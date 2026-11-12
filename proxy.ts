import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAccessRule } from "@/lib/bio/proxyRules";
import { adminRouteRule } from "@/lib/admin/proxyRules";
import { evaluateAdminAccess } from "@/lib/admin/access";
import { ADMIN_COOKIE, getAdminEmails } from "@/lib/admin/config";
import { getAdminSecret, verifyAdminSession } from "@/lib/admin/session";

export async function proxy(request: NextRequest) {
  // If Supabase falls back to the Site URL (callback missing from its Redirect URLs list),
  // the visitor lands on "/?code=…". Finish the sign-in instead of silently dropping it.
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/" && (searchParams.has("code") || searchParams.has("token_hash") || searchParams.has("error_code"))) {
    const to = request.nextUrl.clone();
    to.pathname = "/auth/callback";
    return NextResponse.redirect(to);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isRealUser = !!user && !user.is_anonymous;

  // Admin area — layer 1 of 3 (the /admin layout and every admin API/action re-check).
  const adminRule = adminRouteRule(request.nextUrl.pathname);
  if (adminRule) {
    const noindex = (res: NextResponse) => {
      res.headers.set("X-Robots-Tag", "noindex, nofollow");
      return res;
    };
    if (adminRule === "admin-login") return noindex(supabaseResponse);

    const decision = evaluateAdminAccess({
      user,
      adminEmails: getAdminEmails(),
      storedRole: typeof user?.app_metadata?.role === "string" ? user.app_metadata.role : null,
      sessionValid: user
        ? await verifyAdminSession(request.cookies.get(ADMIN_COOKIE)?.value, user.id, getAdminSecret())
        : false,
    });
    if (decision !== "ok") {
      // Non-admins never learn that admin APIs exist.
      if (adminRule === "admin-api") return new NextResponse("Not Found", { status: 404 });
      const to = decision === "forbidden" ? "/" : "/admin/login";
      return noindex(NextResponse.redirect(new URL(to, request.url)));
    }
    return noindex(supabaseResponse);
  }

  // Bio Pages / dashboard access (defense in depth — handlers re-check with requireRealUser)
  const rule = getAccessRule(request.nextUrl.pathname, request.method);
  if (rule === "real-user-api" && !isRealUser) {
    return NextResponse.json(
      { error: user ? "Sign in required" : "Unauthorized" },
      { status: user ? 403 : 401 }
    );
  }
  if (rule === "real-user-page" && !isRealUser) {
    const url = request.nextUrl.clone();
    url.pathname = "/signup";
    url.search = "";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Protected routes — redirect to login if not authenticated
  const protectedPaths = ["/templates/template"];
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from login page
  if (request.nextUrl.pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};