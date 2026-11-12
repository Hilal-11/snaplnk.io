// lib/admin/sync.ts
// Runs on every sign-in (email/password, OAuth callback, admin login):
//   * promotes the account to ADMIN if its *verified* email is in ADMIN_EMAILS,
//     demotes it to USER if it was removed from the list
//   * mirrors the role into app_metadata (not user-editable) so proxy.ts can check it
//     without a DB round-trip
//   * reports whether the account is banned, so callers can refuse the sign-in
import type { User } from "@supabase/supabase-js";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { getAdminEmails } from "./config";
import { roleFor } from "./access";

export type AccessState = { role: "ADMIN" | "USER"; banned: boolean };

export async function syncUserAccess(user: User): Promise<AccessState> {
  const role = roleFor(user, getAdminEmails());
  if (!hasServiceRole()) return { role: "USER", banned: false }; // fail closed for admin
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("user_access")
      .upsert(
        { user_id: user.id, role, last_sign_in_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      )
      .select("role, is_banned")
      .single();
    if (error) throw error;

    if (user.app_metadata?.role !== role) {
      await admin.auth.admin.updateUserById(user.id, { app_metadata: { ...user.app_metadata, role } });
    }
    return { role: data.role === "ADMIN" ? "ADMIN" : "USER", banned: !!data.is_banned };
  } catch (err) {
    console.error("[access sync] failed", err);
    return { role: "USER", banned: false };
  }
}

/** Current stored role + ban flag (service role read). */
export async function readUserAccess(userId: string): Promise<AccessState | null> {
  if (!hasServiceRole()) return null;
  try {
    const { data } = await createAdminClient()
      .from("user_access")
      .select("role, is_banned")
      .eq("user_id", userId)
      .maybeSingle();
    return data ? { role: data.role === "ADMIN" ? "ADMIN" : "USER", banned: !!data.is_banned } : null;
  } catch {
    return null;
  }
}
