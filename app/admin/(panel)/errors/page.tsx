import type { Metadata } from "next";
import Link from "next/link";
import { FiAlertTriangle } from "react-icons/fi";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { errorGroups } from "@/lib/admin/queries";
import { PAGE_SIZE, errorsParams, parseParams, type SearchParams } from "@/lib/admin/params";
import { Badge, EmptyState, PageHeader, Pagination, Panel } from "@/components/admin/ui";
import LocalTime from "@/components/admin/LocalTime";
import ResolveButton from "@/components/admin/ResolveButton";

export const metadata: Metadata = { title: "Errors" };
export const dynamic = "force-dynamic";

const BASE = "/admin/errors";

export default async function AdminErrorsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const p = parseParams(errorsParams, await searchParams);
  const resolved = p.view === "resolved";
  const { rows, total } = await errorGroups(resolved, p.page);

  return (
    <div>
      <PageHeader
        title="Errors"
        subtitle="Client and server errors grouped by fingerprint (same message + first stack frame)."
        actions={
          <div className="flex gap-0.5 rounded-lg border border-neutral-200 bg-white p-0.5">
            {(["open", "resolved"] as const).map((v) => (
              <Link key={v} href={`${BASE}?view=${v}`} className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${p.view === v ? "btn-primary text-white" : "text-neutral-500 hover:text-neutral-900"}`}>
                {v}
              </Link>
            ))}
          </div>
        }
      />
      <Panel padded={false}>
        {rows.length === 0 ? (
          <EmptyState icon={FiAlertTriangle} title={resolved ? "No resolved errors" : "No open errors 🎉"} />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {rows.map((g) => (
              <li key={g.fingerprint} className="px-5 py-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="red">{g.occurrences.toLocaleString()}×</Badge>
                      <Badge>{g.source}</Badge>
                      <span className="text-xs text-neutral-500">
                        {g.users} user{g.users === 1 ? "" : "s"} · last <LocalTime iso={g.last_seen} /> · first <LocalTime iso={g.first_seen} />
                      </span>
                    </div>
                    <p className="mt-1.5 break-words font-mono text-sm text-neutral-900">{g.message}</p>
                    <p className="mt-1 flex flex-wrap gap-1 text-xs">
                      {g.paths.map((path) => (
                        <span key={path} className="rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] text-neutral-600">
                          {path}
                        </span>
                      ))}
                    </p>
                    {g.sample_stack && (
                      <details className="mt-2 text-xs">
                        <summary className="cursor-pointer font-semibold text-neutral-500">Stack trace</summary>
                        <pre className="mt-1 max-h-56 overflow-auto rounded-lg bg-neutral-50 p-3 text-[11px] text-neutral-600">{g.sample_stack}</pre>
                      </details>
                    )}
                  </div>
                  <ResolveButton fingerprint={g.fingerprint} resolved={resolved} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <Pagination page={p.page} total={total} pageSize={PAGE_SIZE} base={BASE} params={{ view: p.view }} />
      </Panel>
    </div>
  );
}
