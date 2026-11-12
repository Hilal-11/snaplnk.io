import type { Metadata } from "next";
import Link from "next/link";
import { FiExternalLink, FiFileText, FiSearch } from "react-icons/fi";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { listBioPages } from "@/lib/admin/queries";
import { PAGE_SIZE, bioParams, parseParams, type SearchParams } from "@/lib/admin/params";
import { Badge, EmptyState, PageHeader, Pagination, Panel, TableWrap, Th, inputCls } from "@/components/admin/ui";
import LocalTime from "@/components/admin/LocalTime";

export const metadata: Metadata = { title: "Bio pages" };
export const dynamic = "force-dynamic";

const BASE = "/admin/bio-pages";

export default async function AdminBioPagesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const p = parseParams(bioParams, await searchParams);
  const { rows, total } = await listBioPages(p);
  const params = { q: p.q, status: p.status };

  return (
    <div>
      <PageHeader title="Bio pages" subtitle={`${total.toLocaleString()} page${total === 1 ? "" : "s"} across all users.`} />
      <Panel padded={false}>
        <form action={BASE} className="flex flex-wrap items-center gap-2 border-b border-neutral-100 p-3">
          <label className="relative min-w-[220px] flex-1">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
            <input name="q" defaultValue={p.q} placeholder="Search username, name or owner email" className={`${inputCls} w-full pl-8`} />
          </label>
          <select name="status" defaultValue={p.status ?? ""} className={inputCls} aria-label="Status">
            <option value="">Any status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="suspended">Suspended</option>
          </select>
          <button className="h-9 rounded-lg btn-primary px-4 text-sm font-semibold text-white">Apply</button>
        </form>
        {rows.length === 0 ? (
          <EmptyState icon={FiFileText} title="No bio pages" />
        ) : (
          <TableWrap>
            <thead className="border-b border-neutral-100 bg-neutral-50/60">
              <tr>
                <Th className="pl-4">Page</Th>
                <Th>Owner</Th>
                <Th>Status</Th>
                <Th>Blocks</Th>
                <Th>Published</Th>
                <Th className="pr-4">Updated</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.map((b) => (
                <tr key={b.id} className="hover:bg-neutral-50/70">
                  <td className="py-2.5 pl-4 pr-3">
                    <span className="flex items-center gap-1.5 font-semibold text-neutral-900">
                      @{b.username}
                      {b.is_published && !b.is_suspended && (
                        <a href={`/@${b.username}`} target="_blank" rel="noopener noreferrer" aria-label="Open public page" className="text-neutral-400 hover:text-neutral-900">
                          <FiExternalLink size={12} />
                        </a>
                      )}
                    </span>
                    {b.display_name && <span className="block max-w-[220px] truncate text-xs text-neutral-500">{b.display_name}</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/users/${b.owner}`} className="block max-w-[220px] truncate text-neutral-700 hover:underline">
                      {b.owner_email ?? b.owner}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    {b.is_suspended ? <Badge tone="red">Suspended</Badge> : b.is_published ? <Badge tone="green">Published</Badge> : <Badge>Draft</Badge>}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{b.blocks}</td>
                  <td className="px-3 py-2.5 text-xs text-neutral-500">{b.published_at ? <LocalTime iso={b.published_at} /> : "—"}</td>
                  <td className="py-2.5 pl-3 pr-4 text-xs text-neutral-500">
                    <LocalTime iso={b.updated_at} />
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
        <Pagination page={p.page} total={total} pageSize={PAGE_SIZE} base={BASE} params={params} />
      </Panel>
    </div>
  );
}
