"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FiTrendingUp } from "react-icons/fi";

interface DailyPoint {
  click_date: string;
  count: number;
}

export default function AnalyticsChart() {
  const [data, setData] = useState<DailyPoint[]>([]);
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics/overview?range=${range}`)
      .then((r) => r.json())
      .then((json) => setData(json.data ?? []))
      .finally(() => setLoading(false));
  }, [range]);

  const totalInRange = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] h-full">
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-sm font-semibold text-neutral-900">Click Analytics</p>
          <p className="text-xs text-neutral-400 mt-0.5">
            Traffic across all your links
          </p>
        </div>
        <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5">
          {(["7d", "30d", "90d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                range === r
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mt-4 mb-2">
        <p className="text-3xl font-bold text-neutral-900 tracking-tight">
          {totalInRange.toLocaleString()}
        </p>
        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
          <FiTrendingUp className="text-[13px]" />
          clicks in range
        </span>
      </div>

      <div className="h-64 mt-4">
        {loading ? (
          <div className="w-full h-full rounded-lg bg-neutral-100 animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#000000" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#000000" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="click_date"
                tickFormatter={(d) => new Date(d).toLocaleDateString("en", { month: "short", day: "numeric" })}
                tick={{ fontSize: 11, fill: "#a3a3a3" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: "#a3a3a3" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e5e5e5",
                  fontSize: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#000000"
                strokeWidth={2}
                fill="url(#clickGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}