"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Series = { key: string; label: string };

function shortDay(d: string) {
  const date = new Date(`${String(d).slice(0, 10)}T00:00:00Z`);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

/** Multi-series daily chart with series toggles (data keys must exist on every row). */
export function DailyChart<T extends { day: string }>({ data, series, height = 260 }: { data: T[]; series: Series[]; height?: number }) {
  const [active, setActive] = useState(series[0]?.key);
  const s = series.find((x) => x.key === active) ?? series[0];
  const total = data.reduce((n, r) => n + Number((r as Record<string, unknown>)[s.key] ?? 0), 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {series.map((x) => {
          const sum = data.reduce((n, r) => n + Number((r as Record<string, unknown>)[x.key] ?? 0), 0);
          return (
            <button
              key={x.key}
              type="button"
              onClick={() => setActive(x.key)}
              className={`rounded-lg border px-2.5 py-1.5 text-left transition-colors ${
                x.key === s.key ? "border-brand/60 bg-brand-soft" : "border-neutral-200 bg-white hover:border-neutral-300"
              }`}
            >
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-neutral-500">{x.label}</span>
              <span className="block text-sm font-bold tabular-nums text-neutral-900">{sum.toLocaleString()}</span>
            </button>
          );
        })}
      </div>
      <div style={{ height }} className="text-brand">
        {total === 0 ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-neutral-200 text-sm text-neutral-400">
            No {s.label.toLowerCase()} in this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickFormatter={shortDay} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip labelFormatter={(d) => shortDay(String(d))} formatter={(v) => [Number(v).toLocaleString(), s.label]} />
              <Area type="monotone" dataKey={s.key} stroke="currentColor" strokeWidth={2} fill={`url(#grad-${s.key})`} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
