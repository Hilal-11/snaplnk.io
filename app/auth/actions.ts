"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { friendlyAuthError } from "@/lib/authErrors";
import { safeNext } from "@/lib/safeNext";
import { after } from "next/server";
import { syncUserAccess } from "@/lib/admin/sync";
import { trackServerEvent } from "@/lib/analytics/server";

/**
 * Origin for auth redirect links. Prefer the origin the user is actually on (so links work
 * on localhost, preview and production alike), falling back to the configured site URL.
 * Whatever this returns must be allowed in Supabase → Authentication → URL Configuration.
 */
async function getURL(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin && /^https?:\/\/[^/]+$/.test(origin)) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host && /^[a-z0-9.:-]+$/i.test(host)) {
    const proto = h.get("x-forwarded-proto") ?? (/^(localhost|127\.)/.test(host) ? "http" : "https");
    return `${proto}://${host}`;
  }
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000";
  return (url.startsWith("http") ? url : `https://${url}`).replace(/\/+$/, "");
}

// ── Email + Password ───────────────────────────────────────────────────────
export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };

  const supabase = await createClient();
  const next = safeNext(formData.get("next"), "/dashboard/links");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await getURL()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    console.error("[signUp]", error.code, error.message);
    return { error: friendlyAuthError(error.message) };
  }

  // Email already registered: Supabase returns a user with no identities (and sends no email).
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    return { error: "An account with this email already exists. Sign in instead." };
  }

  // "Confirm email" is turned off in Supabase → the user is signed in right away.
  if (data.session && data.user) {
    const access = await syncUserAccess(data.user);
    if (access.banned) {
      await supabase.auth.signOut();
      return { error: "This account has been suspended." };
    }
    const userId = data.user.id;
    after(() => trackServerEvent(null, "signup", { userId, path: "/signup", metadata: { provider: "email" } }));
    redirect(next);
  }

  return { success: `We sent a confirmation link to ${email}. Open it in this browser to finish signing up.` };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: friendlyAuthError(error.message) };

  // Promote/demote from ADMIN_EMAILS and refuse banned accounts.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const access = await syncUserAccess(user);
    if (access.banned) {
      await supabase.auth.signOut();
      return { error: "This account has been suspended." };
    }
    after(() => trackServerEvent(null, "login", { userId: user.id, path: "/signup", metadata: { provider: "email" } }));
  }
  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/signup");
}

// ── OAuth ──────────────────────────────────────────────────────────────────
export async function signInWithGithub(next?: unknown) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${await getURL()}/auth/callback?next=${encodeURIComponent(safeNext(next))}`,
    },
  });
  if (error) return { error: error.message };
  if (data.url) redirect(data.url);
}

export async function signInWithGoogle(next?: unknown) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await getURL()}/auth/callback?next=${encodeURIComponent(safeNext(next))}`,
    },
  });
  if (error) return { error: error.message };
  if (data.url) redirect(data.url);
}