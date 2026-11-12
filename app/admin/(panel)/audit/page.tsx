import type { Metadata } from "next";
import Link from "next/link";
import { FiShield } from "react-icons/fi";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { PAGE_SIZE, auditParams, parseParams, type SearchParams } from "@/lib/admin/params";
import { Badge, EmptyState, PageHeader, Pagination, Panel, TableWrap, Th, inputCls } from "@/components/admin/ui";
import LocalTime from "@/components/admin/LocalTime";

export const metadata: Metadata = { title: "Audit log" };
export const dynamic = "force-dynamic";

const ACTIONS = [
  "admin.login",
  "admin.login_denied",
  "admin.login_rate_limited",
  "admin.logout",
  "user.ban",
  "user.unban",
  "user.delete",
  "error.resolve",
  "settings.update",
  "data.export",
];

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const p = parseParams(auditParams, await searchParams);
  let query = createAdminClient()
    .from("audit_log")
    .select("id, admin_id, action, target, metadata, ip_hash, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((p.page - 1) * PAGE_SIZE, p.page * PAGE_SIZE - 1);
  if (p.action) query = query.eq("action", p.action);
  const { data, count } = await query;
  const rows = data ?? [];

  return (
    <div>
      <PageHeader title="Audit log" subtitle="Read-only record of every admin action and admin sign-in attempt." />
      <Panel padded={false}>
        <form action="/admin/audit" className="flex flex-wrap items-center gap-2 border-b border-neutral-100 p-3">
          <select name="action" defaultValue={p.action ?? ""} className={inputCls} aria-label="Action">
            <option value="">All actions</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <button className="h-9 rounded-lg btn-primary px-4 text-sm font-semibold text-white">Apply</button>
        </form>
        {rows.length === 0 ? (
          <EmptyState icon={FiShield} title="Nothing logged yet" />
        ) : (
          <TableWrap>
            <thead className="border-b border-neutral-100 bg-neutral-50/60">
              <tr>
                <Th className="pl-4">When</Th>
                <Th>Action</Th>
                <Th>Target</Th>
                <Th>By</Th>
                <Th>Details</Th>
                <Th className="pr-4">IP hash</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.map((a) => (
                <tr key={a.id} className="align-top">
                  <td className="whitespace-nowrap py-2 pl-4 pr-3 text-xs text-neutral-500">
                    <LocalTime iso={a.created_at} />
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={/denied|rate|ban|delete/.test(a.action) ? "red" : "neutral"}>{a.action}</Badge>
                  </td>
                  <td className="max-w-[240px] truncate px-3 py-2 text-neutral-700">{a.target ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">
                    {a.admin_id ? (
                      <Link href={`/admin/users/${a.admin_id}`} className="font-semibold text-neutral-800 hover:underline">
                        admin
                      </Link>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="max-w-[260px] px-3 py-2">
                    {a.metadata && Object.keys(a.metadata).length > 0 ? (
                      <code className="line-clamp-2 break-all text-[10px] text-neutral-500">{JSON.stringify(a.metadata)}</code>
                    ) : (
                      <span className="text-xs text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="py-2 pl-3 pr-4 font-mono text-[10px] text-neutral-400">{a.ip_hash ? a.ip_hash.slice(0, 12) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
        <Pagination page={p.page} total={count ?? 0} pageSize={PAGE_SIZE} base="/admin/audit" params={{ action: p.action }} />
      </Panel>
    </div>
  );
}
