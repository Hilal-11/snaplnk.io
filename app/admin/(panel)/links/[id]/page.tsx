import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { FiArrowLeft, FiCpu, FiExternalLink, FiMousePointer, FiUsers } from "react-icons/fi";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { linkStats } from "@/lib/admin/queries";
import { getShortUrl, getShortUrlDisplay } from "@/lib/utils/getShortUrl";
import { PUBLIC_LINK_COLUMNS } from "@/config/linkColumns";
import { Badge, BarList, EmptyState, KpiCard, Panel, RangeTabs, TableWrap, Th } from "@/components/admin/ui";
import { DailyChart } from "@/components/admin/charts";
import LocalTime from "@/components/admin/LocalTime";
import LinkStatusBadge from "@/components/admin/LinkStatusBadge";

export const metadata: Metadata = { title: "Link" };
export const dynamic = "force-dynamic";

const rangeSchema = z.object({ range: z.enum(["7d", "30d", "90d"]).catch("30d") });

type LinkRecord = {
  id: string;
  owner: string;
  title: string | null;
  original_url: string;
  short_code: string;
  is_custom_alias: boolean;
  qr_code_url: string | null;
  clicks_count: number;
  unique_clicks_count: number;
  tags: string[] | null;
  is_active: boolean;
  is_deleted: boolean;
  archived_link: boolean;
  expires_at: string | null;
  max_clicks: number | null;
  is_password_protected: boolean;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
  last_clicked_at: string | null;
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm [&+&]:border-t [&+&]:border-neutral-100">
      <dt className="shrink-0 text-neutral-500">{label}</dt>
      <dd className="min-w-0 break-all text-right font-medium text-neutral-900">{children}</dd>
    </div>
  );
}

export default async function AdminLinkDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const sp = await searchParams;
  const { range } = rangeSchema.parse({ range: Array.isArray(sp.range) ? sp.range[0] : sp.range });
  const days = Number.parseInt(range, 10);

  const db = createAdminClient();
  const { data } = await db.from("links").select(PUBLIC_LINK_COLUMNS).eq("id", id).maybeSingle();
  const link = data as unknown as LinkRecord | null;
  if (!link) notFound();

  const [stats, owner, recent] = await Promise.all([
    linkStats(id, days),
    db.auth.admin.getUserById(link.owner),
    db
      .from("click_events")
      .select("id, clicked_at, country, city, region, device_type, browser, os, referrer_domain, is_bot")
      .eq("link_id", id)
      .order("clicked_at", { ascending: false })
      .limit(50),
  ]);
  const ownerEmail = owner.data.user?.email ?? link.owner;

  return (
    <div className="space-y-6">
      <Link href="/admin/links" className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900">
        <FiArrowLeft size={14} /> All links
      </Link>

      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200/80 bg-white p-5 md:flex-row md:items-start">
        {link.qr_code_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={link.qr_code_url} alt="QR code" className="h-24 w-24 shrink-0 rounded-lg border border-neutral-200 bg-white p-1" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <a href={getShortUrl(link.short_code)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xl font-bold text-blue-600 hover:underline">
              {getShortUrlDisplay(link.short_code)} <FiExternalLink size={14} />
            </a>
            <LinkStatusBadge l={link} />
            {link.is_custom_alias && <Badge>Custom alias</Badge>}
            {link.is_password_protected && <Badge tone="orange">Password</Badge>}
          </div>
          {link.title && <p className="mt-0.5 font-medium text-neutral-900">{link.title}</p>}
          <p className="mt-0.5 break-all text-sm text-neutral-600">↳ {link.original_url}</p>
          <p className="mt-1 text-xs text-neutral-500">
            Owner:{" "}
            <Link href={`/admin/users/${link.owner}`} className="font-semibold text-neutral-800 hover:underline">
              {ownerEmail}
            </Link>
          </p>
        </div>
        <RangeTabs base={`/admin/links/${id}`} current={range} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label={`Clicks (${range})`} value={stats.total} icon={FiMousePointer} hint="humans only" />
        <KpiCard label={`Unique visitors (${range})`} value={stats.uniques} icon={FiUsers} />
        <KpiCard label={`Bot hits (${range})`} value={stats.bots} icon={FiCpu} hint="excluded from counts" />
        <KpiCard label="All-time clicks" value={link.clicks_count} icon={FiMousePointer} hint={`${link.unique_clicks_count} unique`} />
      </div>

      <Panel title="Clicks per day">
        <DailyChart data={stats.daily} series={[{ key: "clicks", label: "Clicks" }, { key: "uniques", label: "Unique visitors" }]} height={220} />
      </Panel>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Panel title="Countries">
          <BarList items={stats.countries} />
        </Panel>
        <Panel title="Referrers">
          <BarList items={stats.referrers} />
        </Panel>
        <Panel title="Devices">
          <BarList items={stats.devices} />
        </Panel>
        <Panel title="Browsers">
          <BarList items={stats.browsers} />
        </Panel>
        <Panel title="Operating systems">
          <BarList items={stats.os} />
        </Panel>
        <Panel title="Details">
          <dl>
            <Row label="Created">
              <LocalTime iso={link.created_at} />
            </Row>
            <Row label="Updated">
              <LocalTime iso={link.updated_at} />
            </Row>
            <Row label="Last click">{link.last_clicked_at ? <LocalTime iso={link.last_clicked_at} /> : "Never"}</Row>
            <Row label="Expires">{link.expires_at ? <LocalTime iso={link.expires_at} /> : "Never"}</Row>
            <Row label="Click limit">{link.max_clicks ?? "None"}</Row>
            <Row label="Tags">{link.tags?.join(", ") || "—"}</Row>
            <Row label="UTM">{[link.utm_source, link.utm_medium, link.utm_campaign].filter(Boolean).join(" · ") || "—"}</Row>
            <Row label="Archived">{link.archived_at ? <LocalTime iso={link.archived_at} /> : "No"}</Row>
            <Row label="Deleted">{link.deleted_at ? <LocalTime iso={link.deleted_at} /> : "No"}</Row>
            <Row label="Link ID">
              <span className="font-mono text-[11px]">{link.id}</span>
            </Row>
          </dl>
        </Panel>
      </div>

      <Panel title="Recent clicks" subtitle="Latest 50, newest first · raw IPs are never stored" padded={false}>
        {(recent.data ?? []).length === 0 ? (
          <EmptyState icon={FiMousePointer} title="No clicks yet" />
        ) : (
          <TableWrap>
            <thead className="border-b border-neutral-100 bg-neutral-50/60">
              <tr>
                <Th className="pl-4">When</Th>
                <Th>Location</Th>
                <Th>Device</Th>
                <Th>Browser / OS</Th>
                <Th className="pr-4">Referrer</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(recent.data ?? []).map((c) => (
                <tr key={c.id} className={c.is_bot ? "text-neutral-400" : ""}>
                  <td className="py-2 pl-4 pr-3 text-xs">
                    <LocalTime iso={c.clicked_at} /> {c.is_bot && <Badge>bot</Badge>}
                  </td>
                  <td className="px-3 py-2">{[c.city, c.region, c.country].filter((x) => x && x !== "Unknown").join(", ") || "—"}</td>
                  <td className="px-3 py-2 capitalize">{c.device_type ?? "—"}</td>
                  <td className="px-3 py-2">{[c.browser, c.os].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="py-2 pl-3 pr-4">{c.referrer_domain ?? "Direct"}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </div>
  );
}
