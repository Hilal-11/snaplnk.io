import type { Metadata } from "next";
import Link from "next/link";
import { FiMessageSquare, FiStar } from "react-icons/fi";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { PAGE_SIZE, pageOnlyParams, parseParams, type SearchParams } from "@/lib/admin/params";
import { Badge, EmptyState, PageHeader, Pagination, Panel } from "@/components/admin/ui";
import LocalTime from "@/components/admin/LocalTime";

export const metadata: Metadata = { title: "Feedback" };
export const dynamic = "force-dynamic";

type FeedbackRow = {
  id: string | number;
  user_id: string | null;
  type: string | null;
  title: string | null;
  message: string | null;
  rating: number | null;
  page_url: string | null;
  created_at: string | null;
};

export default async function AdminFeedbackPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const p = parseParams(pageOnlyParams, await searchParams);
  const db = createAdminClient();
  const { data, count } = await db
    .from("feedback")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((p.page - 1) * PAGE_SIZE, p.page * PAGE_SIZE - 1);
  const rows = (data ?? []) as FeedbackRow[];

  // Resolve submitter emails for this page only.
  const ids = Array.from(new Set(rows.map((r) => r.user_id).filter((x): x is string => !!x)));
  const emails = new Map<string, string>();
  await Promise.all(
    ids.map(async (id) => {
      const { data: u } = await db.auth.admin.getUserById(id);
      if (u.user?.email) emails.set(id, u.user.email);
    })
  );

  return (
    <div>
      <PageHeader title="Feedback" subtitle={`${(count ?? 0).toLocaleString()} message${count === 1 ? "" : "s"} sent from the dashboard.`} />
      <Panel padded={false}>
        {rows.length === 0 ? (
          <EmptyState icon={FiMessageSquare} title="No feedback yet" />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {rows.map((f) => (
              <li key={String(f.id)} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={f.type === "bug" ? "red" : f.type === "feature" ? "blue" : "neutral"}>{f.type ?? "general"}</Badge>
                  {f.rating && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-orange-600">
                      <FiStar size={11} /> {f.rating}/5
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate font-semibold text-neutral-900">{f.title}</span>
                  {f.created_at && <LocalTime iso={f.created_at} className="text-xs text-neutral-400" />}
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-neutral-700">{f.message}</p>
                <p className="mt-1.5 text-xs text-neutral-500">
                  {f.user_id ? (
                    <Link href={`/admin/users/${f.user_id}`} className="font-semibold hover:underline">
                      {emails.get(f.user_id) ?? f.user_id}
                    </Link>
                  ) : (
                    "Unknown user"
                  )}
                  {f.page_url && <span className="font-mono"> · {f.page_url}</span>}
                </p>
              </li>
            ))}
          </ul>
        )}
        <Pagination page={p.page} total={count ?? 0} pageSize={PAGE_SIZE} base="/admin/feedback" params={{}} />
      </Panel>
    </div>
  );
}
