import type { Metadata } from "next";
import Link from "next/link";
import { FiSearch, FiUsers } from "react-icons/fi";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { listUsers } from "@/lib/admin/queries";
import { PAGE_SIZE, parseParams, usersParams, type SearchParams } from "@/lib/admin/params";
import { Avatar, Badge, EmptyState, ExportButton, PageHeader, Pagination, Panel, SortHeader, TableWrap, Th, hrefWith, inputCls } from "@/components/admin/ui";
import LocalTime from "@/components/admin/LocalTime";

export const metadata: Metadata = { title: "Users" };
export const dynamic = "force-dynamic";

const BASE = "/admin/users";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const p = parseParams(usersParams, await searchParams);
  const { rows, total } = await listUsers(p);
  const params = { q: p.q, role: p.role, status: p.status, sort: p.sort, dir: p.dir };

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${total.toLocaleString()} account${total === 1 ? "" : "s"} — everything stored about each one is on their profile.`}
        actions={<ExportButton href={hrefWith("/api/admin/users/export", params)} />}
      />

      <Panel padded={false}>
        <form action={BASE} className="flex flex-wrap items-center gap-2 border-b border-neutral-100 p-3">
          <label className="relative min-w-[220px] flex-1">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
            <input name="q" defaultValue={p.q} placeholder="Search email, name or user ID" className={`${inputCls} w-full pl-8`} />
          </label>
          <select name="role" defaultValue={p.role ?? ""} className={inputCls} aria-label="Role">
            <option value="">All roles</option>
            <option value="ADMIN">Admins</option>
            <option value="USER">Users</option>
          </select>
          <select name="status" defaultValue={p.status ?? ""} className={inputCls} aria-label="Status">
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
            <option value="unverified">Unverified email</option>
            <option value="guest">Guests</option>
          </select>
          <input type="hidden" name="sort" value={p.sort} />
          <input type="hidden" name="dir" value={p.dir} />
          <button className="h-9 rounded-lg btn-primary px-4 text-sm font-semibold text-white">Apply</button>
          {(p.q || p.role || p.status) && (
            <Link href={BASE} className="text-xs font-semibold text-neutral-500 hover:text-neutral-900">
              Clear
            </Link>
          )}
        </form>

        {rows.length === 0 ? (
          <EmptyState icon={FiUsers} title="No users match" text="Try a different search or filter." />
        ) : (
          <TableWrap>
            <thead className="border-b border-neutral-100 bg-neutral-50/60">
              <tr>
                <SortHeader label="User" field="email" base={BASE} params={params} className="pl-4" />
                <Th>Sign-in</Th>
                <Th>Status</Th>
                <SortHeader label="Links" field="links" base={BASE} params={params} />
                <SortHeader label="Clicks" field="clicks" base={BASE} params={params} />
                <Th>Bio</Th>
                <SortHeader label="Events" field="events" base={BASE} params={params} />
                <Th>Country</Th>
                <SortHeader label="Joined" field="created" base={BASE} params={params} />
                <SortHeader label="Last seen" field="last_seen" base={BASE} params={params} className="pr-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-50/70">
                  <td className="py-2.5 pl-4 pr-3">
                    <Link href={`/admin/users/${u.id}`} className="flex min-w-0 items-center gap-2.5">
                      <Avatar url={u.avatar_url} name={u.name} email={u.email} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate font-medium text-neutral-900 hover:underline">{u.name || u.email || "Guest"}</span>
                          {u.role === "ADMIN" && <Badge tone="dark">Admin</Badge>}
                        </span>
                        <span className="block max-w-[240px] truncate text-xs text-neutral-500">{u.email ?? u.id}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="flex flex-wrap gap-1">
                      {(u.providers.length ? u.providers : [u.provider ?? (u.is_anonymous ? "guest" : "email")]).map((pv) => (
                        <Badge key={pv}>{pv}</Badge>
                      ))}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {u.is_banned ? (
                      <Badge tone="red">Banned</Badge>
                    ) : u.is_anonymous ? (
                      <Badge tone="neutral">Guest</Badge>
                    ) : u.email_confirmed ? (
                      <Badge tone="green">Active</Badge>
                    ) : (
                      <Badge tone="orange">Unverified</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">
                    {u.live_links}
                    {u.links !== u.live_links && <span className="text-xs text-neutral-400"> / {u.links}</span>}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{u.clicks.toLocaleString()}</td>
                  <td className="px-3 py-2.5 tabular-nums">{u.bio_pages}</td>
                  <td className="px-3 py-2.5 tabular-nums">{u.events.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-neutral-600">{u.country ?? "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-neutral-500">
                    <LocalTime iso={u.created_at} />
                  </td>
                  <td className="py-2.5 pl-3 pr-4 text-xs text-neutral-500">{u.last_seen_at ? <LocalTime iso={u.last_seen_at} /> : "Never"}</td>
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
