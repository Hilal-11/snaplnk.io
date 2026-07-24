"use client";
import { createClient } from "@/lib/supabase/client";
import { getShortUrl, getShortUrlDisplay } from "@/lib/utils/getShortUrl";
import { useEffect, useMemo, useState } from "react";
import AnalyticsChartComponent from "@/components/dashboard/main/AnalyticsChart";
import {
  FiBarChart2,
  FiLink,
  FiMousePointer,
  FiTarget,
  FiMonitor,
  FiSmartphone,
  FiClock,
  FiActivity,
  FiEye,
  FiUsers,
  FiTablet,
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

const BAR_COLORS = ["#171717", "#404040", "#666666", "#8c8c8c", "#b3b3b3", "#d4d4d4"];

const RANGE_OPTIONS = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
] as const;

type Range = (typeof RANGE_OPTIONS)[number]["key"];

interface LinkRow {
  id: string;
  short_code: string;
  domain: string;
  title: string | null;
  original_url: string;
  clicks_count: number;
  unique_clicks_count: number;
  last_clicked_at: string | null;
  created_at: string;
  qr_code_url: string | null;
}

interface ClickEvent {
  id: string;
  link_id: string;
  country: string | null;
  country_code: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  clicked_at: string;
}

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function countryFlag(code: string | null): string {
  if (!code || code.length !== 2) return "";
  try {
    return String.fromCodePoint(
      ...code
        .toUpperCase()
        .split("")
        .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
    );
  } catch {
    return "";
  }
}

/* ---------- Stat Card ---------- */
function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center">
          <Icon size={16} className="text-neutral-700" />
        </div>
      </div>
      <p className="text-[28px] font-bold text-neutral-900 tracking-tight leading-none mb-1">
        {value}
      </p>
      <p className="text-sm text-neutral-500">{label}</p>
    </div>
  );
}

/* ---------- Top Links Table ---------- */
function TopLinksTable({ links }: { links: LinkRow[] }) {
  const topLinks = links
    .filter((l) => l.clicks_count > 0)
    .sort((a, b) => b.clicks_count - a.clicks_count)
    .slice(0, 10);

  if (topLinks.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200/80 bg-white p-8 text-center">
        <FiBarChart2 size={28} className="text-neutral-300 mx-auto mb-3" />
        <p className="text-sm text-neutral-500">No click data yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-neutral-100">
        <p className="text-sm font-semibold text-neutral-900">Top Performing Links</p>
        <p className="text-xs text-neutral-400 mt-0.5">
          Your most clicked links ranked by total clicks
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="py-3 pl-5 pr-2 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide w-10">
                #
              </th>
              <th className="py-3 px-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Link
              </th>
              <th className="py-3 px-3 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wide w-20">
                <div className="flex items-center justify-center gap-1">
                  <FiEye size={11} /> Clicks
                </div>
              </th>
              <th className="py-3 px-3 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wide w-20">
                <div className="flex items-center justify-center gap-1">
                  <FiUsers size={11} /> Unique
                </div>
              </th>
              <th className="py-3 pl-3 pr-5 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide w-28">
                Last Click
              </th>
            </tr>
          </thead>
          <tbody>
            {topLinks.map((link, idx) => {
              const fullUrl = getShortUrl(link.short_code);
              const shortUrl = getShortUrlDisplay(link.short_code);
              return (
                <tr
                  key={link.id}
                  className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors"
                >
                  <td className="py-3.5 pl-5 pr-2 align-middle">
                    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-neutral-100 text-xs font-bold text-neutral-500">
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 align-middle min-w-[200px]">
                    <div className="flex items-center gap-2.5">
                      <div className="min-w-0 flex-1">
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-neutral-900 hover:text-neutral-600 transition-colors truncate block"
                        >
                          {link.title || shortUrl}
                        </a>
                        <p className="text-xs text-neutral-400 truncate">
                          {link.original_url}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 align-middle text-center">
                    <span className="font-bold text-neutral-900">
                      {link.clicks_count.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 align-middle text-center">
                    <span className="text-neutral-500">
                      {link.unique_clicks_count.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3.5 pl-3 pr-5 align-middle text-right">
                    {link.last_clicked_at ? (
                      <span className="text-xs text-neutral-500 whitespace-nowrap">
                        {timeAgo(link.last_clicked_at)}
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Device Breakdown ---------- */
function DeviceBreakdown({ events }: { events: ClickEvent[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((e) => {
      const d = e.device_type;
      if (!d || d === "Desktop") counts["Desktop"] = (counts["Desktop"] || 0) + 1;
      else counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [events]);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1_rgba(25,28,33,0.08)] h-full flex items-center justify-center">
        <p className="text-sm text-neutral-400">No device data yet.</p>
      </div>
    );
  }

  const deviceIcons: Record<string, React.ReactNode> = {
    Desktop: <FiMonitor size={15} />,
    Mobile: <FiSmartphone size={15} />,
    Tablet: <FiTablet size={15} />,
  };

  const chartData = data.map((d) => ({
    ...d,
    pct: Math.round((d.value / total) * 100),
    icon: d.name in deviceIcons ? deviceIcons[d.name] : <FiActivity size={15} />,
  }));

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] h-full">
      <div className="mb-4">
        <p className="text-sm font-semibold text-neutral-900">Device Breakdown</p>
        <p className="text-xs text-neutral-400 mt-0.5">Clicks by device type</p>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 48, bottom: 0, left: 0 }}
          >
            <CartesianGrid horizontal={false} stroke="#f0f0f0" />
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              tick={({ x, y, payload }) => {
                const nx = typeof x === "number" ? x - 2 : Number(x) - 2;
                return (
                  <g transform={`translate(${nx},${y})`}>
                    <foreignObject x={-80} y={-10} width={80} height={20} style={{ overflow: "visible" }}>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 h-full">
                        {deviceIcons[payload.value] || <FiActivity size={15} />}
                        <span>{payload.value}</span>
                      </div>
                    </foreignObject>
                  </g>
                );
              }}
              axisLine={false}
              tickLine={false}
              width={0}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e5e5e5",
                fontSize: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28} minPointSize={4}>
              {chartData.map((_, idx) => (
                <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-neutral-100">
        {chartData.map((d, idx) => (
          <div key={d.name} className="text-center">
            <p className="text-lg font-bold text-neutral-900">{d.pct}%</p>
            <p className="text-xs text-neutral-500">{d.value.toLocaleString()} clicks</p>
            <p className="text-[10px] text-neutral-400">{d.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Country Breakdown ---------- */
function CountryBreakdown({ events }: { events: ClickEvent[] }) {
  const data = useMemo(() => {
    const counts: Record<string, { value: number; code: string | null }> = {};
    events.forEach((e) => {
      const name = e.country || "Unknown";
      if (!counts[name]) counts[name] = { value: 0, code: e.country_code };
      counts[name].value++;
    });
    return Object.entries(counts)
      .map(([name, info]) => ({ name, value: info.value, code: info.code }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [events]);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] h-full flex items-center justify-center">
        <p className="text-sm text-neutral-400">No geographic data yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] h-full">
      <div className="mb-4">
        <p className="text-sm font-semibold text-neutral-900">Top Countries</p>
        <p className="text-xs text-neutral-400 mt-0.5">Clicks by location</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {data.map((d, idx) => {
          const pct = Math.round((d.value / total) * 100);
          const barColor = BAR_COLORS[idx % BAR_COLORS.length];
          return (
            <div
              key={d.name}
              className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 flex flex-col items-center text-center hover:border-neutral-200 hover:bg-white transition-all"
            >
              <span className="text-2xl leading-none mb-2">
                {countryFlag(d.code) || "🌍"}
              </span>
              <p className="text-xs font-medium text-neutral-700 truncate max-w-full">
                {d.name}
              </p>
              <p className="text-lg font-bold text-neutral-900 mt-1">
                {d.value.toLocaleString()}
              </p>
              <div className="w-full mt-2 h-1 rounded-full bg-neutral-200 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">{pct}% of clicks</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Hourly Activity Chart ---------- */
function HourlyActivity({ events }: { events: ClickEvent[] }) {
  const data = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: 0,
      label:
        i === 0
          ? "12AM"
          : i < 12
            ? `${i}AM`
            : i === 12
              ? "12PM"
              : `${i - 12}PM`,
    }));
    events.forEach((e) => {
      const h = new Date(e.clicked_at).getHours();
      hours[h].count++;
    });
    return hours;
  }, [events]);

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]">
      <div className="mb-4">
        <p className="text-sm font-semibold text-neutral-900">Click Activity by Hour</p>
        <p className="text-xs text-neutral-400 mt-0.5">
          When your audience clicks throughout the day
        </p>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="hourlyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#171717" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#171717" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#f5f5f5" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#a3a3a3" }}
              axisLine={false}
              tickLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#a3a3a3" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
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
              stroke="#171717"
              strokeWidth={2}
              fill="url(#hourlyGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ---------- Browser Breakdown ---------- */
function BrowserBreakdown({ events }: { events: ClickEvent[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((e) => {
      const b = e.browser || "Unknown";
      counts[b] = (counts[b] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [events]);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] h-full flex items-center justify-center">
        <p className="text-sm text-neutral-400">No browser data yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] h-full">
      <div className="mb-3">
        <p className="text-sm font-semibold text-neutral-900">Browser Breakdown</p>
        <p className="text-xs text-neutral-400 mt-0.5">Clicks by browser</p>
      </div>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 36, bottom: 0, left: 0 }}
          >
            <CartesianGrid horizontal={false} stroke="#f5f5f5" />
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 11, fill: "#525252", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e5e5e5",
                fontSize: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
              {data.map((_, idx) => (
                <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3 pt-3 border-t border-neutral-100">
        {data.map((d, idx) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: BAR_COLORS[idx % BAR_COLORS.length] }}
            />
            <span className="text-xs text-neutral-600">{d.name}</span>
            <span className="text-xs font-semibold text-neutral-900">
              {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>("30d");
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [events, setEvents] = useState<ClickEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError("Please sign in"); return; }

        const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
        const since = new Date();
        since.setDate(since.getDate() - days);

        const { data: linksData, error: linksErr } = await supabase
          .from("links")
          .select(
            "id, short_code, domain, title, original_url, clicks_count, unique_clicks_count, last_clicked_at, created_at, qr_code_url"
          )
          .eq("owner", user.id)
          .eq("is_deleted", false)
          .order("clicks_count", { ascending: false });

        if (linksErr) throw linksErr;
        const linksResult = linksData || [];
        setLinks(linksResult);

        const linkIds = linksResult.map((l) => l.id);
        if (linkIds.length > 0) {
          const { data: eventsData, error: eventsErr } = await supabase
            .from("click_events")
            .select("*")
            .in("link_id", linkIds)
            .gte("clicked_at", since.toISOString())
            .order("clicked_at", { ascending: false })
            .limit(5000);

          if (eventsErr) throw eventsErr;
          setEvents(eventsData || []);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load analytics");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [range]);

  const totalLinks = links.length;
  const totalClicks = links.reduce((s, l) => s + (l.clicks_count || 0), 0);
  const activeLinks = links.filter((l) => {
    const expired = l.last_clicked_at && new Date(l.last_clicked_at) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return !expired;
  }).length;
  const totalQrCodes = links.filter((l) => l.qr_code_url).length;

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-full mx-auto">
          <h1 className="text-xl font-semibold text-neutral-900 mb-6">Analytics</h1>
          <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center">
            <FiBarChart2 size={28} className="text-neutral-400 mx-auto mb-3" />
            <p className="text-neutral-700 font-semibold text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-neutral-900">Analytics</h1>
          <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5">
            {RANGE_OPTIONS.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  range === r.key
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {r.key}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin text-neutral-400">
              <FiBarChart2 size={28} />
            </div>
            <p className="mt-4 text-sm text-neutral-500">Loading analytics...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={FiLink}
                label="Total Links"
                value={totalLinks.toLocaleString()}
              />
              <StatCard
                icon={FiMousePointer}
                label="Total Clicks"
                value={totalClicks.toLocaleString()}
              />
              <StatCard
                icon={FiActivity}
                label="Active Links"
                value={activeLinks.toLocaleString()}
              />
              <StatCard
                icon={FiTarget}
                label="QR Codes"
                value={totalQrCodes.toLocaleString()}
              />
            </div>

            <div className="mb-6">
              <AnalyticsChartComponent />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <DeviceBreakdown events={events} />
              <CountryBreakdown events={events} />
            </div>

            <div className="mb-6">
              <HourlyActivity events={events} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
              <div className="lg:col-span-2">
                <BrowserBreakdown events={events} />
              </div>
              <div className="lg:col-span-3">
                <TopLinksTable links={links} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
