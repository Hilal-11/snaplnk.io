"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { requireAdminAction } from "@/lib/admin/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/admin/audit";
import { rateLimit } from "@/lib/admin/ratelimit";
import { deleteFromCloudinary } from "@/lib/utils/cloudinary";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

const BAN_FOREVER = "876000h"; // ~100 years: Supabase blocks sign-in and token refresh

async function ip(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || null;
}

/** Shared guard: admin only, rate limited, never against yourself or another admin. */
async function guardTarget(userId: string) {
  const admin = await requireAdminAction();
  if (!(await rateLimit("adminApi", `act:${admin.id}`))) return { error: "Too many actions. Slow down a little." } as const;
  if (userId === admin.id) return { error: "You can't do this to your own account." } as const;
  const db = createAdminClient();
  const { data: access } = await db.from("user_access").select("role").eq("user_id", userId).maybeSingle();
  if (access?.role === "ADMIN") return { error: "This is an admin account. Remove it from ADMIN_EMAILS first." } as const;
  const { data, error } = await db.auth.admin.getUserById(userId);
  if (error || !data.user) return { error: "User not found." } as const;
  return { admin, db, target: data.user } as const;
}

const banSchema = z.object({ userId: z.uuid(), reason: z.string().trim().max(500).optional() });

export async function banUser(input: { userId: string; reason?: string }): Promise<ActionResult> {
  const parsed = banSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const g = await guardTarget(parsed.data.userId);
  if ("error" in g) return { ok: false, error: g.error as string };

  const { error } = await g.db.from("user_access").upsert(
    {
      user_id: g.target.id,
      is_banned: true,
      banned_at: new Date().toISOString(),
      banned_reason: parsed.data.reason || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) return { ok: false, error: "Couldn't ban this user." };
  // Also ban at the auth level so existing sessions can't refresh.
  const { error: authErr } = await g.db.auth.admin.updateUserById(g.target.id, { ban_duration: BAN_FOREVER });
  if (authErr) console.error("[admin ban] auth ban failed", authErr);

  await writeAudit({
    adminId: g.admin.id,
    action: "user.ban",
    target: g.target.email ?? g.target.id,
    metadata: { userId: g.target.id, reason: parsed.data.reason ?? null, authBan: !authErr },
    ip: await ip(),
  });
  revalidatePath(`/admin/users/${g.target.id}`);
  revalidatePath("/admin/users");
  return { ok: true, message: "User banned. They're signed out and can't sign back in." };
}

export async function unbanUser(input: { userId: string }): Promise<ActionResult> {
  const parsed = banSchema.pick({ userId: true }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const g = await guardTarget(parsed.data.userId);
  if ("error" in g) return { ok: false, error: g.error as string };

  const { error } = await g.db
    .from("user_access")
    .update({ is_banned: false, banned_at: null, banned_reason: null, updated_at: new Date().toISOString() })
    .eq("user_id", g.target.id);
  if (error) return { ok: false, error: "Couldn't unban this user." };
  await g.db.auth.admin.updateUserById(g.target.id, { ban_duration: "none" });

  await writeAudit({ adminId: g.admin.id, action: "user.unban", target: g.target.email ?? g.target.id, metadata: { userId: g.target.id }, ip: await ip() });
  revalidatePath(`/admin/users/${g.target.id}`);
  revalidatePath("/admin/users");
  return { ok: true, message: "User unbanned." };
}

const deleteSchema = z.object({ userId: z.uuid(), confirm: z.string().trim() });

/** Permanently deletes a user and everything they own. Requires typing their email (or id). */
export async function deleteUser(input: { userId: string; confirm: string }): Promise<ActionResult> {
  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const g = await guardTarget(parsed.data.userId);
  if ("error" in g) return { ok: false, error: g.error as string };
  const expected = (g.target.email ?? g.target.id).toLowerCase();
  if (parsed.data.confirm.toLowerCase() !== expected) return { ok: false, error: "Confirmation text doesn't match." };

  const id = g.target.id;
  // Gather QR images first; then remove rows children-first (click_events → links), then the auth user.
  const { data: links } = await g.db.from("links").select("id, qr_code_public_id").eq("owner", id);
  const linkIds = (links ?? []).map((l) => l.id as string);
  if (linkIds.length) {
    const { error: ceErr } = await g.db.from("click_events").delete().in("link_id", linkIds);
    if (ceErr) return { ok: false, error: "Couldn't delete this user's click history. Nothing else was removed." };
  }
  const { error: lErr } = await g.db.from("links").delete().eq("owner", id);
  if (lErr) return { ok: false, error: "Couldn't delete this user's links." };
  await g.db.from("feedback").delete().eq("user_id", id);
  await g.db.from("bio_pages").delete().eq("owner", id);
  const { error: uErr } = await g.db.auth.admin.deleteUser(id);
  if (uErr) return { ok: false, error: `Links were removed but the account couldn't be deleted: ${uErr.message}` };

  const qr = (links ?? []).map((l) => l.qr_code_public_id as string | null).filter((x): x is string => !!x);
  await Promise.allSettled(qr.map((pid) => deleteFromCloudinary(pid)));

  await writeAudit({
    adminId: g.admin.id,
    action: "user.delete",
    target: g.target.email ?? id,
    metadata: { userId: id, links: linkIds.length },
    ip: await ip(),
  });
  revalidatePath("/admin/users");
  revalidateTag("admin-stats", "max");
  return { ok: true, message: "User and all their data were deleted." };
}
