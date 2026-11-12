import type { Metadata } from "next";
import Link from "next/link";
import { FiActivity } from "react-icons/fi";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { EVENT_NAMES } from "@/lib/analytics/events";
import { PAGE_SIZE, eventsParams, parseParams, type SearchParams } from "@/lib/admin/params";
import { Badge, EmptyState, ExportButton, PageHeader, Pagination, Panel, TableWrap, Th, hrefWith, inputCls } from "@/components/admin/ui";
import LocalTime from "@/components/admin/LocalTime";

export const metadata: Metadata = { title: "Events" };
export const dynamic = "force-dynamic";

const BASE = "/admin/events";

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const p = parseParams(eventsParams, await searchParams);

  let query = createAdminClient()
    .from("analytics_events")
    .select("id, type, name, user_id, anonymous_id, session_id, path, referrer_domain, utm_source, utm_campaign, country, city, device, browser, os, metadata, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((p.page - 1) * PAGE_SIZE, p.page * PAGE_SIZE - 1);
  if (p.name) query = query.eq("name", p.name);
  if (p.type) query = query.eq("type", p.type);
  if (p.user) query = query.eq("user_id", p.user);
  if (p.session) query = query.eq("session_id", p.session);
  if (p.path) query = query.ilike("path", `${p.path.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
  const { data, count } = await query;
  const rows = data ?? [];
  const total = count ?? 0;
  const params = { name: p.name, type: p.type, path: p.path, user: p.user, session: p.session };

  return (
    <div>
      <PageHeader
        title="Events"
        subtitle="Every tracked event, newest first. IPs are stored only as a daily-rotating hash."
        actions={<ExportButton href={hrefWith("/api/admin/events/export", params)} />}
      />
      <Panel padded={false}>
        <form action={BASE} className="flex flex-wrap items-center gap-2 border-b border-neutral-100 p-3">
          <select name="name" defaultValue={p.name ?? ""} className={inputCls} aria-label="Event">
            <option value="">All events</option>
            {EVENT_NAMES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <select name="type" defaultValue={p.type ?? ""} className={inputCls} aria-label="Type">
            <option value="">Any type</option>
            <option value="pageview">pageview</option>
            <option value="event">event</option>
            <option value="error">error</option>
            <option value="vital">vital</option>
          </select>
          <input name="path" defaultValue={p.path} placeholder="Path starts with… e.g. /dashboard" className={`${inputCls} min-w-[200px] flex-1`} />
          {p.user && <input type="hidden" name="user" value={p.user} />}
          {p.session && <input type="hidden" name="session" value={p.session} />}
          <button className="h-9 rounded-lg btn-primary px-4 text-sm font-semibold text-white">Apply</button>
          {(p.name || p.type || p.path || p.user || p.session) && (
            <Link href={BASE} className="text-xs font-semibold text-neutral-500 hover:text-neutral-900">
              Clear
            </Link>
          )}
        </form>
        {rows.length === 0 ? (
          <EmptyState icon={FiActivity} title="No events" text="Events show up as soon as people use the site." />
        ) : (
          <TableWrap>
            <thead className="border-b border-neutral-100 bg-neutral-50/60">
              <tr>
                <Th className="pl-4">Event</Th>
                <Th>Path</Th>
                <Th>Who</Th>
                <Th>Where / device</Th>
                <Th>Source</Th>
                <Th>Details</Th>
                <Th className="pr-4">When</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.map((e) => (
                <tr key={e.id} className="align-top hover:bg-neutral-50/70">
                  <td className="py-2 pl-4 pr-3">
                    <Link href={hrefWith(BASE, params, { name: e.name, page: 1 })}>
                      <Badge tone={e.type === "error" ? "red" : e.type === "pageview" ? "neutral" : e.type === "vital" ? "orange" : "blue"}>{e.name}</Badge>
                    </Link>
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-2 text-neutral-700" title={e.path ?? ""}>
                    {e.path ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {e.user_id ? (
                      <Link href={`/admin/users/${e.user_id}`} className="font-semibold text-neutral-800 hover:underline">
                        user
                      </Link>
                    ) : (
                      <span className="text-neutral-400">visitor</span>
                    )}
                    <Link href={hrefWith(BASE, {}, { session: e.session_id })} className="block font-mono text-[10px] text-neutral-400 hover:text-neutral-700" title="Show this session">
                      {(e.session_id ?? "").slice(0, 10)}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-xs text-neutral-600">
                    {[e.city, e.country].filter(Boolean).join(", ") || "—"}
                    <span className="block text-neutral-400">{[e.device, e.browser, e.os].filter(Boolean).join(" · ")}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-neutral-600">{[e.referrer_domain, e.utm_source, e.utm_campaign].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="max-w-[220px] px-3 py-2">
                    {e.metadata && Object.keys(e.metadata).length > 0 ? (
                      <code className="line-clamp-2 break-all text-[10px] text-neutral-500">{JSON.stringify(e.metadata)}</code>
                    ) : (
                      <span className="text-xs text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap py-2 pl-3 pr-4 text-xs text-neutral-500">
                    <LocalTime iso={e.created_at} />
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
