import type { Metadata } from "next";
import Link from "next/link";
import { FiLink, FiLock, FiSearch } from "react-icons/fi";
import { TbQrcode } from "react-icons/tb";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { listLinks } from "@/lib/admin/queries";
import LinkStatusBadge from "@/components/admin/LinkStatusBadge";
import { PAGE_SIZE, linksParams, parseParams, type SearchParams } from "@/lib/admin/params";
import { getShortUrlDisplay } from "@/lib/utils/getShortUrl";
import { EmptyState, ExportButton, PageHeader, Pagination, Panel, SortHeader, TableWrap, Th, hrefWith, inputCls } from "@/components/admin/ui";
import LocalTime from "@/components/admin/LocalTime";

export const metadata: Metadata = { title: "Links" };
export const dynamic = "force-dynamic";

const BASE = "/admin/links";

export default async function AdminLinksPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const p = parseParams(linksParams, await searchParams);
  const { rows, total } = await listLinks(p);
  const params = { q: p.q, status: p.status, owner: p.owner, sort: p.sort, dir: p.dir };

  return (
    <div>
      <PageHeader
        title="Links"
        subtitle={`${total.toLocaleString()} link${total === 1 ? "" : "s"} across all users, including archived and deleted ones.`}
        actions={<ExportButton href={hrefWith("/api/admin/links/export", params)} />}
      />

      <Panel padded={false}>
        <form action={BASE} className="flex flex-wrap items-center gap-2 border-b border-neutral-100 p-3">
          <label className="relative min-w-[220px] flex-1">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
            <input name="q" defaultValue={p.q} placeholder="Search short code, URL, title, owner email or exact tag" className={`${inputCls} w-full pl-8`} />
          </label>
          <select name="status" defaultValue={p.status ?? ""} className={inputCls} aria-label="Status">
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
            <option value="archived">Archived</option>
            <option value="expired">Expired</option>
            <option value="deleted">Deleted</option>
          </select>
          {p.owner && <input type="hidden" name="owner" value={p.owner} />}
          <input type="hidden" name="sort" value={p.sort} />
          <input type="hidden" name="dir" value={p.dir} />
          <button className="h-9 rounded-lg btn-primary px-4 text-sm font-semibold text-white">Apply</button>
          {(p.q || p.status || p.owner) && (
            <Link href={BASE} className="text-xs font-semibold text-neutral-500 hover:text-neutral-900">
              Clear{p.owner ? " (incl. owner filter)" : ""}
            </Link>
          )}
        </form>

        {rows.length === 0 ? (
          <EmptyState icon={FiLink} title="No links match" text="Try a different search or status." />
        ) : (
          <TableWrap>
            <thead className="border-b border-neutral-100 bg-neutral-50/60">
              <tr>
                <SortHeader label="Short link" field="code" base={BASE} params={params} className="pl-4" />
                <Th>Destination</Th>
                <Th>Owner</Th>
                <Th>Status</Th>
                <SortHeader label="Clicks" field="clicks" base={BASE} params={params} />
                <SortHeader label="Last click" field="last_click" base={BASE} params={params} />
                <SortHeader label="Created" field="created" base={BASE} params={params} className="pr-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.map((l) => (
                <tr key={l.id} className="hover:bg-neutral-50/70">
                  <td className="py-2.5 pl-4 pr-3">
                    <Link href={`/admin/links/${l.id}`} className="flex items-center gap-1.5 font-semibold text-blue-600 hover:underline">
                      {getShortUrlDisplay(l.short_code)}
                      {l.has_qr && <TbQrcode className="text-neutral-400" size={13} aria-label="Has QR" />}
                      {l.is_password_protected && <FiLock className="text-neutral-400" size={12} aria-label="Password protected" />}
                    </Link>
                    {l.title && <span className="block max-w-[220px] truncate text-xs text-neutral-500">{l.title}</span>}
                    {l.tags && l.tags.length > 0 && <span className="block max-w-[220px] truncate text-[11px] text-neutral-400">#{l.tags.join(" #")}</span>}
                  </td>
                  <td className="max-w-[280px] truncate px-3 py-2.5 text-neutral-600" title={l.original_url}>
                    {l.original_url}
                  </td>
                  <td className="px-3 py-2.5">
                    {l.owner ? (
                      <Link href={`/admin/users/${l.owner}`} className="block max-w-[200px] truncate text-neutral-700 hover:underline">
                        {l.owner_email ?? l.owner}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <LinkStatusBadge l={l} />
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">
                    {l.clicks_count.toLocaleString()}
                    <span className="block text-[11px] text-neutral-400">{l.unique_clicks_count.toLocaleString()} unique</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-neutral-500">{l.last_clicked_at ? <LocalTime iso={l.last_clicked_at} /> : "Never"}</td>
                  <td className="py-2.5 pl-3 pr-4 text-xs text-neutral-500">
                    <LocalTime iso={l.created_at} />
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
