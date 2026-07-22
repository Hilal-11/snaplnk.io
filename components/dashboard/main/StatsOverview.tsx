import { createClient } from "@/lib/supabase/server";
import StatCard from "./StatCard";

// Builds a 10-point sparkline from daily counts, oldest -> newest.
// Missing days are filled with 0 so the line stays continuous.
function buildSparkline(rows: { day: string; count: number }[], days = 10) {
  const map = new Map(rows.map((r) => [r.day, r.count]));
  const out: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push(map.get(key) ?? 0);
  }
  return out;
}

function pctChange(series: number[]) {
  const last = series[series.length - 1] ?? 0;
  const prev = series[series.length - 2] ?? 0;
  if (prev === 0) return last > 0 ? 100 : 0;
  return Math.round(((last - prev) / prev) * 1000) / 10;
}

export default async function StatsOverview() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: links }, { data: dailyLinks }, { data: dailyClicks }, { data: dailyQr }, { data: dailyBio }] =
    await Promise.all([
      supabase
        .from("links")
        .select("clicks_count, qr_code_url")
        .eq("owner", user!.id)
        .eq("is_deleted", false),
      // Daily created-link counts, last 10 days — swap table/column names for your schema
      supabase.rpc("daily_link_counts", { p_owner: user!.id, p_days: 10 }),
      supabase.rpc("daily_click_counts", { p_owner: user!.id, p_days: 10 }),
      supabase.rpc("daily_qr_counts", { p_owner: user!.id, p_days: 10 }),
      supabase.rpc("daily_bio_page_counts", { p_owner: user!.id, p_days: 10 }),
    ]);

  const totalLinks = links?.length ?? 0;
  const totalClicks = links?.reduce((sum, l) => sum + (l.clicks_count || 0), 0) ?? 0;
  const totalQr = links?.filter((l) => l.qr_code_url).length ?? 0;
  const totalBio = 0; // wire up once bio_pages table/query is available

  const linksSpark = buildSparkline(dailyLinks ?? []);
  const clicksSpark = buildSparkline(dailyClicks ?? []);
  const qrSpark = buildSparkline(dailyQr ?? []);
  const bioSpark = buildSparkline(dailyBio ?? []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Total Links Create"
        value={totalLinks.toLocaleString()}
        change={pctChange(linksSpark)}
        sparkline={linksSpark.some((v) => v > 0) ? linksSpark : [0, 0, 0, 0, 0, 0, 0, 0, 0, 1]}
        rangeMin={0}
        rangeMax={Math.max(...linksSpark, 100)}
      />
      <StatCard
        label="Total Clicks"
        value={totalClicks.toLocaleString()}
        change={pctChange(clicksSpark)}
        sparkline={clicksSpark.some((v) => v > 0) ? clicksSpark : [0, 0, 0, 0, 0, 0, 0, 0, 0, 1]}
        rangeMin={0}
        rangeMax={Math.max(...clicksSpark, 1000)}
      />
      <StatCard
        label="Total QR Codes"
        value={totalQr.toLocaleString()}
        change={pctChange(qrSpark)}
        sparkline={qrSpark.some((v) => v > 0) ? qrSpark : [0, 0, 0, 0, 0, 0, 0, 0, 0, 1]}
        rangeMin={0}
        rangeMax={Math.max(...qrSpark, 100)}
      />
      <StatCard
        label="Total Bio Pages"
        value={totalBio.toLocaleString()}
        change={0}
        sparkline={[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]}
        rangeMin={0}
        rangeMax={100}
      />
    </div>
  );
}