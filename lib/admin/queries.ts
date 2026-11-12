// lib/admin/queries.ts
// Typed server-side data access for the admin dashboard. Only call from code that has
// passed requireAdmin()/requireAdminApi(). Heavy aggregates are cached for 60s.
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { PAGE_SIZE } from "./params";

export type AdminUserRow = {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  provider: string | null;
  providers: string[];
  role: "ADMIN" | "USER";
  is_banned: boolean;
  email_confirmed: boolean;
  is_anonymous: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  last_seen_at: string | null;
  links: number;
  live_links: number;
  clicks: number;
  bio_pages: number;
  events: number;
  country: string | null;
  total_count: number;
};

export type AdminLinkRow = {
  id: string;
  short_code: string;
  original_url: string;
  title: string | null;
  owner: string | null;
  owner_email: string | null;
  clicks_count: number;
  unique_clicks_count: number;
  tags: string[] | null;
  is_active: boolean;
  is_deleted: boolean;
  archived_link: boolean;
  is_custom_alias: boolean;
  expires_at: string | null;
  max_clicks: number | null;
  has_qr: boolean;
  is_password_protected: boolean;
  created_at: string;
  last_clicked_at: string | null;
  deleted_at: string | null;
  total_count: number;
};

export type AdminBioRow = {
  id: string;
  username: string;
  display_name: string;
  owner: string;
  owner_email: string | null;
  is_published: boolean;
  is_suspended: boolean;
  blocks: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  total_count: number;
};

export type ErrorGroup = {
  fingerprint: string;
  message: string;
  source: string;
  occurrences: number;
  users: number;
  first_seen: string;
  last_seen: string;
  paths: string[];
  sample_stack: string | null;
  total_count: number;
};

export type Labelled = { label: string; value: number };
export type PeriodStats = {
  users_total: number;
  new_users: number;
  active_users: number;
  pageviews: number;
  visitors: number;
  sessions: number;
  avg_session_sec: number;
  bounce_rate: number;
  links_created: number;
  clicks: number;
  unique_clickers: number;
  qr_downloads: number;
  bio_published: number;
  errors: number;
};
export type Overview = {
  current: PeriodStats;
  previous: PeriodStats;
  dau: number;
  wau: number;
  mau: number;
  totals: { links: number; clicks: number; bio_pages: number; published_bio_pages: number; open_errors: number };
};
export type DailyPoint = { day: string; pageviews: number; visitors: number; signups: number; links: number; clicks: number };
export type LinkStats = {
  total: number;
  uniques: number;
  bots: number;
  daily: { day: string; clicks: number; uniques: number }[];
  countries: Labelled[];
  devices: Labelled[];
  browsers: Labelled[];
  os: Labelled[];
  referrers: Labelled[];
};

const num = <T extends Record<string, unknown>>(row: T, keys: (keyof T)[]): T => {
  const out = { ...row };
  for (const k of keys) out[k] = Number(row[k] ?? 0) as T[keyof T];
  return out;
};

function unwrap<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`[admin] ${what}: ${res.error.message}`);
  return res.data as T;
}

// ---------------------------------------------------------------- users
export async function listUsers(p: {
  q?: string;
  role?: string;
  status?: string;
  sort: string;
  dir: "asc" | "desc";
  page: number;
  limit?: number;
}) {
  const limit = p.limit ?? PAGE_SIZE;
  const rows = unwrap(
    await createAdminClient().rpc("admin_list_users", {
      p_search: p.q ?? null,
      p_role: p.role ?? null,
      p_status: p.status ?? null,
      p_sort: p.sort,
      p_desc: p.dir === "desc",
      p_limit: limit,
      p_offset: (p.page - 1) * limit,
    }),
    "list users"
  ) as AdminUserRow[];
  const data = rows.map((r) => num(r, ["links", "live_links", "clicks", "bio_pages", "events", "total_count"]));
  return { rows: data, total: data[0]?.total_count ?? 0 };
}

export async function getUserRow(id: string): Promise<AdminUserRow | null> {
  const { rows } = await listUsers({ q: id, sort: "created", dir: "desc", page: 1, limit: 1 });
  return rows.find((r) => r.id === id) ?? null;
}

// ---------------------------------------------------------------- links
export async function listLinks(p: {
  q?: string;
  status?: string;
  owner?: string;
  sort: string;
  dir: "asc" | "desc";
  page: number;
  limit?: number;
}) {
  const limit = p.limit ?? PAGE_SIZE;
  const rows = unwrap(
    await createAdminClient().rpc("admin_list_links", {
      p_search: p.q ?? null,
      p_status: p.status ?? null,
      p_owner: p.owner ?? null,
      p_sort: p.sort,
      p_desc: p.dir === "desc",
      p_limit: limit,
      p_offset: (p.page - 1) * limit,
    }),
    "list links"
  ) as AdminLinkRow[];
  const data = rows.map((r) => num(r, ["clicks_count", "unique_clicks_count", "total_count"]));
  return { rows: data, total: data[0]?.total_count ?? 0 };
}

export async function linkStats(linkId: string, days: number): Promise<LinkStats> {
  return unwrap(await createAdminClient().rpc("admin_link_stats", { p_link: linkId, p_days: days }), "link stats") as LinkStats;
}

// ---------------------------------------------------------------- bio pages
export async function listBioPages(p: { q?: string; status?: string; owner?: string; page: number; limit?: number }) {
  const limit = p.limit ?? PAGE_SIZE;
  const rows = unwrap(
    await createAdminClient().rpc("admin_list_bio_pages", {
      p_search: p.q ?? null,
      p_status: p.status ?? null,
      p_owner: p.owner ?? null,
      p_limit: limit,
      p_offset: (p.page - 1) * limit,
    }),
    "list bio pages"
  ) as AdminBioRow[];
  const data = rows.map((r) => num(r, ["blocks", "total_count"]));
  return { rows: data, total: data[0]?.total_count ?? 0 };
}

// ---------------------------------------------------------------- errors
export async function errorGroups(resolved: boolean, page: number) {
  const rows = unwrap(
    await createAdminClient().rpc("admin_error_groups", { p_resolved: resolved, p_limit: PAGE_SIZE, p_offset: (page - 1) * PAGE_SIZE }),
    "error groups"
  ) as ErrorGroup[];
  const data = rows.map((r) => num(r, ["occurrences", "users", "total_count"]));
  return { rows: data, total: data[0]?.total_count ?? 0 };
}

// ---------------------------------------------------------------- overview (cached 60s)
export const getOverview = unstable_cache(
  async (from: string, to: string): Promise<Overview> =>
    unwrap(await createAdminClient().rpc("admin_overview", { p_from: from, p_to: to }), "overview") as Overview,
  ["admin-overview"],
  { revalidate: 60, tags: ["admin-stats"] }
);

export const getTimeseries = unstable_cache(
  async (from: string, to: string): Promise<DailyPoint[]> => {
    const rows = unwrap(await createAdminClient().rpc("admin_timeseries", { p_from: from, p_to: to }), "timeseries") as DailyPoint[];
    return rows.map((r) => num(r, ["pageviews", "visitors", "signups", "links", "clicks"]));
  },
  ["admin-timeseries"],
  { revalidate: 60, tags: ["admin-stats"] }
);

export const BREAKDOWN_DIMS = [
  "page",
  "referrer",
  "country",
  "device",
  "browser",
  "os",
  "utm",
  "event",
  "click_country",
  "click_referrer",
  "click_device",
  "click_browser",
  "top_links",
] as const;
export type BreakdownDim = (typeof BREAKDOWN_DIMS)[number];

export const getBreakdown = unstable_cache(
  async (from: string, to: string, dim: BreakdownDim, limit = 8): Promise<Labelled[]> => {
    const rows = unwrap(
      await createAdminClient().rpc("admin_breakdown", { p_from: from, p_to: to, p_dim: dim, p_limit: limit }),
      `breakdown ${dim}`
    ) as Labelled[];
    return rows.map((r) => ({ label: r.label, value: Number(r.value) }));
  },
  ["admin-breakdown"],
  { revalidate: 60, tags: ["admin-stats"] }
);
