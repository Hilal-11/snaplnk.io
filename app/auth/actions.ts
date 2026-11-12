"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { safeNext } from "@/lib/safeNext";
import { after } from "next/server";
import { syncUserAccess } from "@/lib/admin/sync";
import { trackServerEvent } from "@/lib/analytics/server";

const getURL = () => {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000";
  return url.startsWith("http") ? url : `https://${url}`;
};

// ── Email + Password ───────────────────────────────────────────────────────
export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const next = safeNext(formData.get("next"), "/dashboard/links");
  const { error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      emailRedirectTo: `${getURL()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: error.message };
  return { success: "Check your email to confirm your account." };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });
  if (error) return { error: error.message };

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
      redirectTo: `${getURL()}/auth/callback?next=${encodeURIComponent(safeNext(next))}`,
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
      redirectTo: `${getURL()}/auth/callback?next=${encodeURIComponent(safeNext(next))}`,
    },
  });
  if (error) return { error: error.message };
  if (data.url) redirect(data.url);
}