import type { Metadata } from "next";
import { FiActivity, FiAlertTriangle, FiEye, FiLink, FiShield, FiUsers } from "react-icons/fi";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import LocalTime from "@/components/admin/LocalTime";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

const DAY = 86_400_000;

/** ISO lower bounds for the KPI windows (kept out of render for the React compiler). */
function windows() {
  const now = Date.now();
  return { since7: new Date(now - 7 * DAY).toISOString(), since1: new Date(now - DAY).toISOString() };
}

export default async function AdminOverviewPage() {
  await requireAdmin(); // layer 3: pages re-check too
  const db = createAdminClient();
  const { since7, since1 } = windows();

  const [users, admins, links, views7, views24, events7, errors, audit] = await Promise.all([
    db.from("user_access").select("user_id", { count: "exact", head: true }),
    db.from("user_access").select("user_id", { count: "exact", head: true }).eq("role", "ADMIN"),
    db.from("links").select("id", { count: "exact", head: true }).eq("is_deleted", false),
    db.from("analytics_events").select("id", { count: "exact", head: true }).eq("type", "pageview").gte("created_at", since7),
    db.from("analytics_events").select("id", { count: "exact", head: true }).eq("type", "pageview").gte("created_at", since1),
    db.from("analytics_events").select("id", { count: "exact", head: true }).gte("created_at", since7),
    db.from("error_log").select("id", { count: "exact", head: true }).eq("resolved", false),
    db.from("audit_log").select("id, action, target, created_at").order("created_at", { ascending: false }).limit(10),
  ]);

  const kpis = [
    { label: "Users", value: users.count, icon: FiUsers, hint: `${admins.count ?? 0} admin` },
    { label: "Live links", value: links.count, icon: FiLink, hint: "not deleted" },
    { label: "Page views (24h)", value: views24.count, icon: FiEye, hint: `${(views7.count ?? 0).toLocaleString()} in 7 days` },
    { label: "Events (7d)", value: events7.count, icon: FiActivity, hint: "all tracked events" },
    { label: "Open errors", value: errors.count, icon: FiAlertTriangle, hint: "unresolved" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Overview</h1>
      <p className="mt-1 text-sm text-neutral-500">Live numbers straight from the database. Admin traffic is excluded from tracking.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="hover-lift rounded-xl border border-neutral-200/80 bg-white p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
              <k.icon size={14} />
            </span>
            <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight text-neutral-900">{(k.value ?? 0).toLocaleString()}</p>
            <p className="text-xs font-medium text-neutral-700">{k.label}</p>
            <p className="text-[11px] text-neutral-400">{k.hint}</p>
          </div>
        ))}
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-neutral-200/80 bg-white">
        <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-3.5">
          <FiShield className="text-neutral-500" />
          <h2 className="text-sm font-semibold text-neutral-900">Recent admin activity</h2>
        </div>
        {(audit.data ?? []).length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-neutral-500">No admin activity yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {(audit.data ?? []).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2.5 text-sm">
                <span
                  className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold ${
                    a.action.includes("denied") || a.action.includes("rate") ? "bg-red-50 text-red-700" : "bg-neutral-100 text-neutral-700"
                  }`}
                >
                  {a.action}
                </span>
                <span className="min-w-0 flex-1 truncate text-neutral-600">{a.target ?? "—"}</span>
                <LocalTime iso={a.created_at} className="text-xs text-neutral-400" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
