// lib/supabase/admin.ts
// Service-role client. Bypasses RLS — use ONLY in server code that has already passed
// requireAdmin(), or in trusted server pipelines (/api/track, sign-in sync, cron).
// SUPABASE_SERVICE_ROLE_KEY is never prefixed NEXT_PUBLIC_, so it never reaches the browser.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function hasServiceRole(): boolean {
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY && !!process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function createAdminClient(): SupabaseClient {
  if (typeof window !== "undefined") throw new Error("createAdminClient() is server-only");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  cached ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}
