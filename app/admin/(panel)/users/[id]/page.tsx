import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { FiActivity, FiArrowLeft, FiExternalLink, FiFileText, FiLink, FiMessageSquare, FiMousePointer, FiShield, FiUser } from "react-icons/fi";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserRow, listBioPages, listLinks } from "@/lib/admin/queries";
import { getShortUrlDisplay } from "@/lib/utils/getShortUrl";
import { Avatar, Badge, EmptyState, KpiCard, Panel, TableWrap, Th } from "@/components/admin/ui";
import LocalTime from "@/components/admin/LocalTime";
import UserActions from "@/components/admin/UserActions";
import LinkStatusBadge from "@/components/admin/LinkStatusBadge";

export const metadata: Metadata = { title: "User" };
export const dynamic = "force-dynamic";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm [&+&]:border-t [&+&]:border-neutral-100">
      <dt className="shrink-0 text-neutral-500">{label}</dt>
      <dd className="min-w-0 break-all text-right font-medium text-neutral-900">{children}</dd>
    </div>
  );
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const db = createAdminClient();
  const [{ data: authData }, row] = await Promise.all([db.auth.admin.getUserById(id), getUserRow(id)]);
  const u = authData?.user;
  if (!u || !row) notFound();

  const [access, links, bio, events, sessions, feedback, auditById, auditByEmail] = await Promise.all([
    db.from("user_access").select("role, is_banned, banned_at, banned_reason, last_sign_in_at, created_at").eq("user_id", id).maybeSingle(),
    listLinks({ owner: id, sort: "created", dir: "desc", page: 1, limit: 200 }),
    listBioPages({ owner: id, page: 1, limit: 50 }),
    db.from("analytics_events").select("id, type, name, path, country, device, browser, os, metadata, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(60),
    db.from("analytics_sessions").select("id, started_at, last_seen_at, pageviews, duration_sec, entry_path, exit_path, country, device, referrer").eq("user_id", id).order("started_at", { ascending: false }).limit(10),
    db.from("feedback").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
    db.from("audit_log").select("id, action, target, metadata, created_at").eq("target", id).order("created_at", { ascending: false }).limit(20),
    u.email
      ? db.from("audit_log").select("id, action, target, metadata, created_at").eq("target", u.email).order("created_at", { ascending: false }).limit(20)
      : Promise.resolve({ data: [] as { id: string; action: string; target: string | null; metadata: unknown; created_at: string }[] }),
  ]);

  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  const audit = [...(auditById.data ?? []), ...(auditByEmail.data ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const feedbackRows = (feedback.data ?? []) as Record<string, unknown>[];
  const banned = !!access.data?.is_banned;

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900">
        <FiArrowLeft size={14} /> All users
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200/80 bg-white p-5 md:flex-row md:items-center">
        <Avatar url={row.avatar_url} name={row.name} email={row.email} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold tracking-tight text-neutral-900">{row.name || row.email || "Guest"}</h1>
            {row.role === "ADMIN" && <Badge tone="dark">Admin</Badge>}
            {banned ? <Badge tone="red">Banned</Badge> : row.email_confirmed ? <Badge tone="green">Verified</Badge> : <Badge tone="orange">Unverified</Badge>}
            {row.is_anonymous && <Badge>Guest</Badge>}
          </div>
          <p className="truncate text-sm text-neutral-500">{u.email ?? "no email"}</p>
          <p className="mt-0.5 font-mono text-[11px] text-neutral-400">{u.id}</p>
          {banned && access.data?.banned_reason && <p className="mt-1 text-xs text-red-600">Ban reason: {access.data.banned_reason}</p>}
        </div>
        <UserActions userId={u.id} email={u.email ?? null} banned={banned} isAdmin={row.role === "ADMIN"} isSelf={u.id === admin.id} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Live links" value={row.live_links} icon={FiLink} hint={`${row.links} total incl. deleted`} />
        <KpiCard label="Total clicks" value={row.clicks} icon={FiMousePointer} hint="on all their links" />
        <KpiCard label="Bio pages" value={row.bio_pages} icon={FiFileText} hint={`${bio.rows.filter((b) => b.is_published).length} published`} />
        <KpiCard label="Tracked events" value={row.events} icon={FiActivity} hint="product usage" />
        <KpiCard label="Sessions" value={sessions.data?.length ?? 0} icon={FiUser} hint="most recent 10 shown" />
        <KpiCard label="Feedback" value={feedbackRows.length} icon={FiMessageSquare} hint="messages sent" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Account */}
        <Panel title="Account" className="xl:col-span-1">
          <dl>
            <Field label="Email">{u.email ?? "—"}</Field>
            <Field label="Email confirmed">{u.email_confirmed_at ? <LocalTime iso={u.email_confirmed_at} /> : "No"}</Field>
            <Field label="Phone">{u.phone || "—"}</Field>
            <Field label="Display name">{row.name ?? "—"}</Field>
            <Field label="Signed up">
              <LocalTime iso={u.created_at} />
            </Field>
            <Field label="Last sign-in">{u.last_sign_in_at ? <LocalTime iso={u.last_sign_in_at} /> : "Never"}</Field>
            <Field label="Last seen">{row.last_seen_at ? <LocalTime iso={row.last_seen_at} /> : "—"}</Field>
            <Field label="Updated">{u.updated_at ? <LocalTime iso={u.updated_at} /> : "—"}</Field>
            <Field label="Last country">{row.country ?? "—"}</Field>
            <Field label="Role">{row.role}</Field>
            <Field label="Banned">{banned ? (access.data?.banned_at ? <LocalTime iso={access.data.banned_at} /> : "Yes") : "No"}</Field>
            <Field label="Sign-in methods">
              <span className="flex flex-wrap justify-end gap-1">
                {(u.identities ?? []).length
                  ? (u.identities ?? []).map((i) => <Badge key={i.identity_id ?? i.id}>{i.provider}</Badge>)
                  : row.providers.map((p) => <Badge key={p}>{p}</Badge>)}
              </span>
            </Field>
          </dl>
          <details className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs">
            <summary className="cursor-pointer font-semibold text-neutral-700">Raw profile metadata</summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all text-[11px] text-neutral-600">
              {JSON.stringify({ user_metadata: meta, app_metadata: u.app_metadata, identities: (u.identities ?? []).map((i) => ({ provider: i.provider, created_at: i.created_at, last_sign_in_at: i.last_sign_in_at, email: i.identity_data?.email })) }, null, 2)}
            </pre>
          </details>
        </Panel>

        {/* Links */}
        <Panel title={`Links (${links.total})`} padded={false} className="xl:col-span-2" actions={<Link href={`/admin/links?owner=${u.id}`} className="text-xs font-semibold text-neutral-500 hover:text-neutral-900">Open in Links →</Link>}>
          {links.rows.length === 0 ? (
            <EmptyState icon={FiLink} title="No links" />
          ) : (
            <TableWrap>
              <thead className="border-b border-neutral-100 bg-neutral-50/60">
                <tr>
                  <Th className="pl-4">Short link</Th>
                  <Th>Destination</Th>
                  <Th>Status</Th>
                  <Th>Clicks</Th>
                  <Th>Tags</Th>
                  <Th className="pr-4">Created</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {links.rows.map((l) => (
                  <tr key={l.id} className="hover:bg-neutral-50/70">
                    <td className="py-2 pl-4 pr-3">
                      <Link href={`/admin/links/${l.id}`} className="font-semibold text-blue-600 hover:underline">
                        {getShortUrlDisplay(l.short_code)}
                      </Link>
                      {l.title && <span className="block max-w-[200px] truncate text-xs text-neutral-500">{l.title}</span>}
                    </td>
                    <td className="max-w-[260px] truncate px-3 py-2 text-neutral-600" title={l.original_url}>
                      {l.original_url}
                    </td>
                    <td className="px-3 py-2"><LinkStatusBadge l={l} /></td>
                    <td className="px-3 py-2 tabular-nums">{l.clicks_count.toLocaleString()}</td>
                    <td className="px-3 py-2 text-xs text-neutral-500">{l.tags?.join(", ") || "—"}</td>
                    <td className="py-2 pl-3 pr-4 text-xs text-neutral-500">
                      <LocalTime iso={l.created_at} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Activity timeline */}
        <Panel title="Activity timeline" subtitle="Latest 60 tracked events" padded={false} className="xl:col-span-2">
          {(events.data ?? []).length === 0 ? (
            <EmptyState icon={FiActivity} title="No tracked activity" text="Events appear once this user browses Snaplnk while signed in." />
          ) : (
            <ol className="divide-y divide-neutral-100">
              {(events.data ?? []).map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2 text-sm">
                  <Badge tone={e.type === "error" ? "red" : e.type === "pageview" ? "neutral" : "blue"}>{e.name}</Badge>
                  <span className="min-w-0 flex-1 truncate text-neutral-700">{e.path ?? "—"}</span>
                  <span className="text-xs text-neutral-400">{[e.country, e.device, e.browser].filter(Boolean).join(" · ")}</span>
                  <LocalTime iso={e.created_at} className="text-xs text-neutral-400" />
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Bio pages" padded={false}>
            {bio.rows.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-neutral-400">No bio pages.</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {bio.rows.map((b) => (
                  <li key={b.id} className="flex items-center gap-2 px-5 py-2.5 text-sm">
                    <span className="min-w-0 flex-1 truncate font-medium text-neutral-900">@{b.username}</span>
                    {b.is_suspended ? <Badge tone="red">Suspended</Badge> : b.is_published ? <Badge tone="green">Published</Badge> : <Badge>Draft</Badge>}
                    <span className="text-xs text-neutral-500">{b.blocks} blocks</span>
                    {b.is_published && (
                      <a href={`/@${b.username}`} target="_blank" rel="noopener noreferrer" aria-label="Open page" className="text-neutral-400 hover:text-neutral-900">
                        <FiExternalLink size={13} />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Recent sessions" padded={false}>
            {(sessions.data ?? []).length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-neutral-400">No sessions recorded.</p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {(sessions.data ?? []).map((s) => (
                  <li key={s.id} className="px-5 py-2 text-xs text-neutral-600">
                    <div className="flex justify-between gap-2">
                      <LocalTime iso={s.started_at} className="font-medium text-neutral-900" />
                      <span>
                        {s.pageviews} views · {Math.round(s.duration_sec / 60)}m
                      </span>
                    </div>
                    <div className="truncate text-neutral-400">
                      {s.entry_path ?? "?"} → {s.exit_path ?? "?"} {s.country ? `· ${s.country}` : ""} {s.device ? `· ${s.device}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Feedback from this user" padded={false}>
          {feedbackRows.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-neutral-400">No feedback.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {feedbackRows.map((f) => (
                <li key={String(f.id)} className="px-5 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge>{String(f.type ?? "general")}</Badge>
                    <span className="min-w-0 flex-1 truncate font-medium text-neutral-900">{String(f.title ?? "")}</span>
                    {typeof f.created_at === "string" && <LocalTime iso={f.created_at} className="text-xs text-neutral-400" />}
                  </div>
                  <p className="mt-1 line-clamp-3 text-xs text-neutral-600">{String(f.message ?? "")}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Admin actions on this user" padded={false}>
          {audit.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-neutral-400">None.</p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {audit.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                  <FiShield className="shrink-0 text-neutral-400" size={13} />
                  <Badge tone={/denied|ban|delete/.test(a.action) ? "red" : "neutral"}>{a.action}</Badge>
                  <span className="min-w-0 flex-1" />
                  <LocalTime iso={a.created_at} className="text-xs text-neutral-400" />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
