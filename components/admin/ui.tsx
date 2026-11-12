// components/admin/ui.tsx — shared, server-renderable admin building blocks.
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { FiArrowDown, FiArrowUp, FiChevronLeft, FiChevronRight, FiDownload, FiInbox } from "react-icons/fi";

type Icon = ComponentType<{ size?: number; className?: string }>;
type Params = Record<string, string | number | undefined | null>;

export const inputCls =
  "h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-[border-color,box-shadow] placeholder:text-neutral-400 focus:border-brand/60 focus:shadow-[0_0_0_3px_var(--brand-soft)]";

/** Build "/path?a=1&b=2" from current params + overrides (empty values dropped). */
export function hrefWith(base: string, params: Params, overrides: Params = {}): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...params, ...overrides })) {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className = "",
  padded = true,
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={`overflow-hidden rounded-xl border border-neutral-200/80 bg-white ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>}
            {subtitle && <p className="text-xs text-neutral-400">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function formatValue(v: number, format: "number" | "duration" | "percent" = "number"): string {
  if (format === "percent") return `${v.toFixed(v % 1 ? 1 : 0)}%`;
  if (format === "duration") {
    const s = Math.round(v);
    return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
  }
  return Math.round(v).toLocaleString();
}

export function KpiCard({
  label,
  value,
  previous,
  icon: I,
  format = "number",
  lowerIsBetter,
  hint,
}: {
  label: string;
  value: number;
  previous?: number;
  icon?: Icon;
  format?: "number" | "duration" | "percent";
  lowerIsBetter?: boolean;
  hint?: string;
}) {
  let delta: number | null = null;
  if (previous !== undefined) delta = previous === 0 ? (value === 0 ? 0 : 100) : ((value - previous) / previous) * 100;
  const good = delta === null || delta === 0 ? null : lowerIsBetter ? delta < 0 : delta > 0;
  return (
    <div className="hover-lift rounded-xl border border-neutral-200/80 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-neutral-500">{label}</p>
        {I && (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
            <I size={13} />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-neutral-900">{formatValue(value, format)}</p>
      <div className="mt-1 flex items-center gap-1.5 text-[11px]">
        {delta !== null && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 font-semibold ${
              good === null ? "bg-neutral-100 text-neutral-500" : good ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            {delta > 0 ? <FiArrowUp size={10} /> : delta < 0 ? <FiArrowDown size={10} /> : null}
            {Math.abs(delta).toFixed(Math.abs(delta) >= 10 ? 0 : 1)}%
          </span>
        )}
        <span className="text-neutral-400">{hint ?? (delta !== null ? "vs previous period" : "")}</span>
      </div>
    </div>
  );
}

export function BarList({ items, empty = "No data yet", format }: { items: { label: string; value: number; href?: string }[]; empty?: string; format?: (v: number) => string }) {
  if (!items.length) return <p className="py-6 text-center text-sm text-neutral-400">{empty}</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-1.5">
      {items.map((i) => {
        const label = (
          <span className="relative z-10 min-w-0 truncate" title={i.label}>
            {i.label}
          </span>
        );
        return (
          <li key={i.label} className="relative flex items-center justify-between gap-3 overflow-hidden rounded-md px-2.5 py-1.5 text-sm">
            <span aria-hidden className="absolute inset-y-0 left-0 rounded-md bg-brand-soft" style={{ width: `${(i.value / max) * 100}%` }} />
            {i.href ? (
              <Link href={i.href} className="relative z-10 min-w-0 truncate text-neutral-800 hover:underline">
                {i.label}
              </Link>
            ) : (
              <span className="text-neutral-800">{label}</span>
            )}
            <span className="relative z-10 shrink-0 font-semibold tabular-nums text-neutral-900">{format ? format(i.value) : i.value.toLocaleString()}</span>
          </li>
        );
      })}
    </ul>
  );
}

const TONES = {
  neutral: "bg-neutral-100 text-neutral-600 border-neutral-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-100",
  red: "bg-red-50 text-red-700 border-red-100",
  orange: "bg-orange-50 text-orange-700 border-orange-100",
  blue: "bg-blue-50 text-blue-700 border-blue-100",
  dark: "bg-neutral-900 text-white border-neutral-900",
} as const;

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${TONES[tone]}`}>{children}</span>;
}

export function EmptyState({ icon: I = FiInbox, title, text }: { icon?: Icon; title: string; text?: string }) {
  return (
    <div className="relative isolate overflow-hidden px-6 py-14 text-center">
      <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-grid mask-fade-radial" />
      <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl btn-primary">
        <I size={18} />
      </span>
      <p className="text-sm font-semibold text-neutral-900">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-sm text-xs text-neutral-500">{text}</p>}
    </div>
  );
}

/** Column header that toggles sort/dir via the URL. */
export function SortHeader({
  label,
  field,
  base,
  params,
  className = "",
}: {
  label: string;
  field: string;
  base: string;
  params: Params & { sort?: string; dir?: string };
  className?: string;
}) {
  const active = params.sort === field;
  const nextDir = active && params.dir === "desc" ? "asc" : "desc";
  return (
    <th className={`px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-500 ${className}`}>
      <Link href={hrefWith(base, params, { sort: field, dir: nextDir, page: 1 })} className={`inline-flex items-center gap-1 hover:text-neutral-900 ${active ? "text-neutral-900" : ""}`}>
        {label}
        {active && (params.dir === "desc" ? <FiArrowDown size={11} /> : <FiArrowUp size={11} />)}
      </Link>
    </th>
  );
}

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <th className={`px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-500 ${className}`}>{children}</th>;
}

export function Pagination({ page, total, pageSize, base, params }: { page: number; total: number; pageSize: number; base: string; params: Params }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const btn = "flex h-8 items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-4 py-3 text-xs text-neutral-500">
      <span className="tabular-nums">
        {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}
      </span>
      <div className="flex items-center gap-1.5">
        {page > 1 ? (
          <Link href={hrefWith(base, params, { page: page - 1 })} className={btn}>
            <FiChevronLeft size={13} /> Prev
          </Link>
        ) : (
          <span className={`${btn} opacity-40`}>
            <FiChevronLeft size={13} /> Prev
          </span>
        )}
        <span className="px-1 tabular-nums">
          {page} / {pages}
        </span>
        {page < pages ? (
          <Link href={hrefWith(base, params, { page: page + 1 })} className={btn}>
            Next <FiChevronRight size={13} />
          </Link>
        ) : (
          <span className={`${btn} opacity-40`}>
            Next <FiChevronRight size={13} />
          </span>
        )}
      </div>
    </div>
  );
}

export function ExportButton({ href }: { href: string }) {
  return (
    <a href={href} className="flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
      <FiDownload size={14} /> Export CSV
    </a>
  );
}

export function RangeTabs({ base, current, params = {} }: { base: string; current: string; params?: Params }) {
  const opts = [
    { key: "today", label: "Today" },
    { key: "7d", label: "7 days" },
    { key: "30d", label: "30 days" },
    { key: "90d", label: "90 days" },
  ];
  return (
    <div className="flex gap-0.5 rounded-lg border border-neutral-200 bg-white p-0.5">
      {opts.map((o) => (
        <Link
          key={o.key}
          href={hrefWith(base, params, { range: o.key })}
          className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
            current === o.key ? "btn-primary text-white" : "text-neutral-500 hover:text-neutral-900"
          }`}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}

/** Table wrapper with horizontal scroll on small screens. */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function initials(name: string | null | undefined, email?: string | null): string {
  const src = (name || email || "?").trim();
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function Avatar({ url, name, email, size = 32 }: { url?: string | null; name?: string | null; email?: string | null; size?: number }) {
  if (url && /^https:\/\//.test(url)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" width={size} height={size} referrerPolicy="no-referrer" className="shrink-0 rounded-full border border-neutral-200 object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full btn-primary text-[11px] font-semibold" style={{ width: size, height: size }}>
      {initials(name, email)}
    </span>
  );
}
