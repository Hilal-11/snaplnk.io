// lib/admin/audit.ts
// Append-only audit trail of admin actions (and denied admin logins). Never throws.
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { hashIp } from "@/lib/analytics/hash";

export type AuditAction =
  | "admin.login"
  | "admin.login_denied"
  | "admin.login_rate_limited"
  | "admin.logout"
  | "user.ban"
  | "user.unban"
  | "user.delete"
  | "error.resolve"
  | "settings.update"
  | "data.export";

export async function writeAudit(entry: {
  adminId: string | null;
  action: AuditAction;
  target?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}): Promise<void> {
  if (!hasServiceRole()) return;
  try {
    await createAdminClient()
      .from("audit_log")
      .insert({
        admin_id: entry.adminId,
        action: entry.action,
        target: entry.target?.slice(0, 256) ?? null,
        metadata: entry.metadata ?? {},
        ip_hash: hashIp(entry.ip),
      });
  } catch (err) {
    console.error("[audit] write failed", err);
  }
}
