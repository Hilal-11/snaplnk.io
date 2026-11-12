import type { Metadata } from "next";
import Link from "next/link";
import {
  FiActivity,
  FiAlertTriangle,
  FiBarChart2,
  FiClock,
  FiDownload,
  FiEye,
  FiGlobe,
  FiLink,
  FiLogIn,
  FiMousePointer,
  FiRepeat,
  FiShield,
  FiUser,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { getBreakdown, getOverview, getTimeseries, listUsers } from "@/lib/admin/queries";
import { parseParams, rangeParams, rangeWindow, type SearchParams } from "@/lib/admin/params";
import { createAdminClient } from "@/lib/supabase/admin";
import { Avatar, Badge, BarList, KpiCard, PageHeader, Panel, RangeTabs } from "@/components/admin/ui";
import { DailyChart } from "@/components/admin/charts";
import LocalTime from "@/components/admin/LocalTime";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const { range } = parseParams(rangeParams, await searchParams);
  const { from, to } = rangeWindow(range);

  const [o, series, pages, referrers, countries, devices, clickCountries, topLinks, recentUsers, audit] = await Promise.all([
    getOverview(from, to),
    getTimeseries(from, to),
    getBreakdown(from, to, "page"),
    getBreakdown(from, to, "referrer"),
    getBreakdown(from, to, "country"),
    getBreakdown(from, to, "device"),
    getBreakdown(from, to, "click_country"),
    getBreakdown(from, to, "top_links"),
    listUsers({ sort: "created", dir: "desc", page: 1, limit: 6 }),
    createAdminClient().from("audit_log").select("id, action, target, created_at").order("created_at", { ascending: false }).limit(6),
  ]);
  const c = o.current;
  const p = o.previous;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        subtitle="Everything happening on Snaplnk. Admin traffic is excluded; % change compares with the previous period."
        actions={<RangeTabs base="/admin" current={range} />}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total users" value={c.users_total} previous={p.users_total} icon={FiUsers} />
        <KpiCard label="New users" value={c.new_users} previous={p.new_users} icon={FiUserPlus} />
        <KpiCard label="Active users" value={c.active_users} previous={p.active_users} icon={FiActivity} />
        <KpiCard label="Page views" value={c.pageviews} previous={p.pageviews} icon={FiEye} />
        <KpiCard label="Unique visitors" value={c.visitors} previous={p.visitors} icon={FiGlobe} />
        <KpiCard label="Sessions" value={c.sessions} previous={p.sessions} icon={FiLogIn} />
        <KpiCard label="Avg. session" value={c.avg_session_sec} previous={p.avg_session_sec} icon={FiClock} format="duration" />
        <KpiCard label="Bounce rate" value={c.bounce_rate} previous={p.bounce_rate} icon={FiRepeat} format="percent" lowerIsBetter />
        <KpiCard label="Links created" value={c.links_created} previous={p.links_created} icon={FiLink} />
        <KpiCard label="Link clicks" value={c.clicks} previous={p.clicks} icon={FiMousePointer} />
        <KpiCard label="QR downloads" value={c.qr_downloads} previous={p.qr_downloads} icon={FiDownload} />
        <KpiCard label="Errors" value={c.errors} previous={p.errors} icon={FiAlertTriangle} lowerIsBetter />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "DAU", value: o.dau, hint: "users active, last 24h" },
          { label: "WAU", value: o.wau, hint: "last 7 days" },
          { label: "MAU", value: o.mau, hint: "last 30 days" },
          { label: "Live links", value: o.totals.links, hint: "all time" },
          { label: "All-time clicks", value: o.totals.clicks, hint: "all links" },
          { label: "Bio pages", value: o.totals.bio_pages, hint: `${o.totals.published_bio_pages} published` },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-neutral-200/80 bg-white px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{k.label}</p>
            <p className="text-xl font-bold tabular-nums text-neutral-900">{k.value.toLocaleString()}</p>
            <p className="text-[11px] text-neutral-400">{k.hint}</p>
          </div>
        ))}
      </div>

      <Panel title="Traffic over time" subtitle="UTC days · pick a series">
        <DailyChart
          data={series}
          series={[
            { key: "pageviews", label: "Page views" },
            { key: "visitors", label: "Visitors" },
            { key: "signups", label: "Sign-ups" },
            { key: "links", label: "Links created" },
            { key: "clicks", label: "Link clicks" },
          ]}
        />
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title="Top pages">
          <BarList items={pages} />
        </Panel>
        <Panel title="Referrers">
          <BarList items={referrers} />
        </Panel>
        <Panel title="Visitor countries">
          <BarList items={countries} />
        </Panel>
        <Panel title="Devices">
          <BarList items={devices} />
        </Panel>
        <Panel title="Link clicks by country">
          <BarList items={clickCountries} />
        </Panel>
        <Panel title="Most-clicked links" actions={<Link href="/admin/links?sort=clicks" className="text-xs font-semibold text-neutral-500 hover:text-neutral-900">All links →</Link>}>
          <BarList items={topLinks.map((l) => ({ ...l, label: `/${l.label}`, href: `/admin/links?q=${encodeURIComponent(l.label)}` }))} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="Newest users"
          padded={false}
          actions={<Link href="/admin/users" className="text-xs font-semibold text-neutral-500 hover:text-neutral-900">All users →</Link>}
        >
          {recentUsers.rows.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-neutral-400">No users yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {recentUsers.rows.map((u) => (
                <li key={u.id}>
                  <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-neutral-50">
                    <Avatar url={u.avatar_url} name={u.name} email={u.email} size={30} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-neutral-900">{u.name || u.email}</span>
                      <span className="block truncate text-xs text-neutral-500">{u.email}</span>
                    </span>
                    {u.role === "ADMIN" && <Badge tone="dark">Admin</Badge>}
                    <span className="text-xs tabular-nums text-neutral-500">{u.links} links</span>
                    <LocalTime iso={u.created_at} className="hidden text-xs text-neutral-400 sm:block" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Recent admin activity"
          padded={false}
          actions={<Link href="/admin/audit" className="text-xs font-semibold text-neutral-500 hover:text-neutral-900">Audit log →</Link>}
        >
          {(audit.data ?? []).length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-neutral-400">No admin activity yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {(audit.data ?? []).map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                  <FiShield className="shrink-0 text-neutral-400" size={14} />
                  <Badge tone={/denied|rate|ban|delete/.test(a.action) ? "red" : "neutral"}>{a.action}</Badge>
                  <span className="min-w-0 flex-1 truncate text-neutral-600">{a.target ?? "—"}</span>
                  <LocalTime iso={a.created_at} className="text-xs text-neutral-400" />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <p className="flex items-center gap-1.5 text-[11px] text-neutral-400">
        <FiBarChart2 size={12} /> Figures refresh every 60 seconds. <FiUser size={12} /> Times shown in your local timezone.
      </p>
    </div>
  );
}
