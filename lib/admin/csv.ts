// lib/admin/csv.ts — shared CSV response for admin exports.
import { toCsv, exportFileName } from "@/lib/account";
import { rateLimit } from "./ratelimit";
import { requireAdminApi } from "./requireAdmin";
import { writeAudit } from "./audit";

export const EXPORT_LIMIT = 10_000;

export function csvResponse<T extends Record<string, unknown>>(name: string, rows: T[], columns: (keyof T & string)[]): Response {
  return new Response("﻿" + toCsv(rows, columns), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFileName(name, "csv")}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Guard for export routes: admin only (404 otherwise) + rate limit. Returns the admin id. */
export async function guardExport(kind: string): Promise<{ ok: true; adminId: string } | { ok: false; response: Response }> {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth;
  if (!(await rateLimit("adminApi", `export:${auth.user.id}`))) {
    return { ok: false, response: new Response("Too many requests", { status: 429 }) };
  }
  await writeAudit({ adminId: auth.user.id, action: "data.export", target: kind, metadata: { export: kind } });
  return { ok: true, adminId: auth.user.id };
}
