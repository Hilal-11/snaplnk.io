"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdminAction } from "@/lib/admin/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/admin/audit";

const schema = z.object({ fingerprint: z.string().regex(/^[a-f0-9]{8,64}$/), resolved: z.boolean() });

/** Marks every occurrence of an error group resolved (or reopens it). */
export async function setErrorResolved(input: { fingerprint: string; resolved: boolean }): Promise<{ ok: boolean }> {
  const admin = await requireAdminAction();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { error } = await createAdminClient()
    .from("error_log")
    .update({ resolved: parsed.data.resolved, resolved_at: parsed.data.resolved ? new Date().toISOString() : null })
    .eq("fingerprint", parsed.data.fingerprint);
  if (error) return { ok: false };
  await writeAudit({ adminId: admin.id, action: "error.resolve", target: parsed.data.fingerprint, metadata: { resolved: parsed.data.resolved } });
  revalidatePath("/admin/errors");
  revalidateTag("admin-stats", "max");
  return { ok: true };
}
