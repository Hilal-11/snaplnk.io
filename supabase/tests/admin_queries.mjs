// Acceptance checks for supabase/migrations/*_admin_queries.sql on PGlite.
// Run:  npm i --no-save @electric-sql/pglite@0.2.17
//       node supabase/tests/admin_queries.mjs supabase/migrations
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] ?? "supabase/migrations";
const files = [
  "20261111120000_bio_pages.sql",
  "20261112100000_bio_pages_rpc.sql",
  "20261114090000_admin_analytics.sql",
  "20261115090000_admin_queries.sql",
];
const db = new PGlite();
const A = "aaaaaaaa-0000-4000-8000-000000000001";
const B = "bbbbbbbb-0000-4000-8000-000000000002";
const L1 = "11111111-0000-4000-8000-000000000001";
const L2 = "22222222-0000-4000-8000-000000000002";

await db.exec(`
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
create table auth.users (
  id uuid primary key, email varchar(255), raw_user_meta_data jsonb default '{}', raw_app_meta_data jsonb default '{}',
  created_at timestamptz default now(), last_sign_in_at timestamptz, email_confirmed_at timestamptz, is_anonymous boolean default false
);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'sub', '')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as
  $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
create function storage.foldername(name text) returns text[] language sql immutable as $$ select array[]::text[] $$;
grant usage on schema public, auth, storage to anon, authenticated, service_role;
create table public.links (
  id uuid primary key, owner uuid, original_url text, short_code text, domain text, is_custom_alias boolean default false,
  title text, description text, tags text[], is_active boolean default true, expires_at timestamptz, max_clicks integer,
  is_password_protected boolean default false, clicks_count integer default 0, unique_clicks_count integer default 0,
  last_clicked_at timestamptz, qr_code_url text, created_at timestamptz default now(), archived_link boolean default false,
  deleted_at timestamptz, is_deleted boolean default false
);
create table public.click_events (
  id bigserial primary key, link_id uuid, ip_address text, referrer_domain text, country text, device_type text,
  browser text, os text, is_bot boolean default false, visitor_hash text, clicked_at timestamptz default now()
);
insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, created_at, last_sign_in_at, email_confirmed_at) values
  ('${A}', 'alice@example.com', '{"full_name":"Alice Doe","avatar_url":"https://x/a.png"}', '{"provider":"google","providers":["google"]}', now() - interval '20 days', now() - interval '1 hour', now() - interval '20 days'),
  ('${B}', 'bob@example.com', '{"name":"Bob"}', '{"provider":"email","providers":["email"]}', now() - interval '2 days', null, null);
insert into public.links (id, owner, original_url, short_code, title, tags, clicks_count, qr_code_url, created_at) values
  ('${L1}', '${A}', 'https://alice.dev', 'abc1234', 'Portfolio', '{work}', 5, 'https://qr', now() - interval '3 days'),
  ('${L2}', '${A}', 'https://old.dev', 'old0000', null, null, 1, null, now() - interval '40 days');
update public.links set is_deleted = true where id = '${L2}';
insert into public.click_events (link_id, referrer_domain, country, device_type, browser, os, visitor_hash, is_bot, clicked_at) values
  ('${L1}', 'twitter.com', 'IN', 'mobile', 'Chrome', 'Android', 'v1', false, now() - interval '1 day'),
  ('${L1}', null, 'IN', 'desktop', 'Firefox', 'Windows', 'v2', false, now() - interval '2 hours'),
  ('${L1}', null, 'US', 'desktop', 'Chrome', 'macOS', 'v2', false, now() - interval '1 hour'),
  ('${L1}', null, null, null, 'Googlebot', null, 'bot', true, now() - interval '1 hour');
`);
for (const f of files) await db.exec(readFileSync(join(dir, f), "utf8").replace(/create extension if not exists pgcrypto;/i, ""));
await db.exec(readFileSync(join(dir, files[3]), "utf8")); // idempotent
await db.exec(`
insert into public.user_access (user_id, role) values ('${A}', 'ADMIN') on conflict (user_id) do update set role = 'ADMIN';
insert into public.analytics_events (type, name, user_id, anonymous_id, path, referrer_domain, country, device, created_at) values
  ('pageview', 'page_view', '${A}', 'anon1', '/pricing?utm=1', 'google.com', 'IN', 'mobile', now() - interval '1 hour'),
  ('pageview', 'page_view', null, 'anon2', '/', null, 'US', 'desktop', now() - interval '2 hours'),
  ('pageview', 'page_view', null, 'anon2', '/pricing', null, 'US', 'desktop', now() - interval '2 hours'),
  ('event', 'qr_download', '${A}', 'anon1', '/dashboard', null, 'IN', 'mobile', now() - interval '3 hours'),
  ('pageview', 'page_view', null, 'anon3', '/', null, 'DE', 'desktop', now() - interval '10 days');
insert into public.analytics_sessions (id, anonymous_id, started_at, pageviews, duration_sec) values
  ('s1', 'anon1', now() - interval '1 hour', 1, 0), ('s2', 'anon2', now() - interval '2 hours', 2, 120);
insert into public.error_log (fingerprint, message, path, created_at) values
  ('fp1', 'Boom', '/a', now() - interval '2 hours'), ('fp1', 'Boom', '/b', now() - interval '1 hour'), ('fp2', 'Other', '/c', now());
`);

const results = [];
const check = async (name, fn) => {
  try {
    results.push([(await fn()) ? "PASS" : "FAIL", name]);
  } catch (e) {
    results.push(["FAIL", `${name} — ${e.message}`]);
  }
};
const q = async (sql, params = []) => (await db.query(sql, params)).rows;
const asUser = async (sql) => {
  await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: A, role: "authenticated" })]);
  await db.exec("set role authenticated");
  try {
    await db.query(sql);
    return false;
  } catch (e) {
    return /permission denied/.test(e.message);
  } finally {
    await db.exec("reset role");
  }
};

await check("list_users returns everyone with stats", async () => {
  const r = await q("select * from public.admin_list_users()");
  const a = r.find((x) => x.id === A);
  return r.length === 2 && Number(a.total_count) === 2 && a.name === "Alice Doe" && a.role === "ADMIN"
    && Number(a.links) === 2 && Number(a.live_links) === 1 && Number(a.clicks) === 6 && Number(a.events) === 2
    && a.country === "IN" && a.providers[0] === "google" && a.email_confirmed === true;
});
await check("list_users search / filters / sort / paging", async () => {
  const s = await q("select email from public.admin_list_users('BOB')");
  const unverified = await q("select email from public.admin_list_users(null, null, 'unverified')");
  const admins = await q("select email from public.admin_list_users(null, 'ADMIN')");
  const byClicksAsc = await q("select email from public.admin_list_users(null, null, null, 'clicks', false)");
  const page2 = await q("select email, total_count from public.admin_list_users(null, null, null, 'email', false, 1, 1)");
  return s.length === 1 && s[0].email === "bob@example.com" && unverified[0].email === "bob@example.com"
    && admins.length === 1 && byClicksAsc[0].email === "bob@example.com"
    && page2.length === 1 && page2[0].email === "bob@example.com" && Number(page2[0].total_count) === 2;
});
await check("list_users by id (detail page)", async () => (await q(`select id from public.admin_list_users('${B}')`)).length === 1);
await check("list_links with owner email + status filters", async () => {
  const all = await q("select * from public.admin_list_links()");
  const deleted = await q("select short_code from public.admin_list_links(null, 'deleted')");
  const active = await q("select short_code from public.admin_list_links(null, 'active')");
  const byTag = await q("select short_code from public.admin_list_links('work')");
  const byOwner = await q(`select short_code from public.admin_list_links(null, null, '${B}')`);
  return all.length === 2 && all[0].owner_email === "alice@example.com" && deleted[0].short_code === "old0000"
    && active.length === 1 && active[0].short_code === "abc1234" && byTag.length === 1 && byOwner.length === 0;
});
await check("link_stats excludes bots and builds breakdowns", async () => {
  const [{ s }] = await q(`select public.admin_link_stats('${L1}', 7) s`);
  return s.total === 3 && s.uniques === 2 && s.bots === 1 && s.daily.length === 7
    && s.countries[0].label === "IN" && s.countries[0].value === 2 && s.referrers.some((r) => r.label === "Direct");
});
await check("overview: current vs previous + DAU/WAU/MAU + totals", async () => {
  const [{ o }] = await q("select public.admin_overview(now() - interval '7 days', now()) o");
  const c = o.current;
  return c.pageviews === 3 && c.visitors === 2 && c.sessions === 2 && c.bounce_rate === 50 && c.avg_session_sec === 60
    && c.new_users === 1 && c.links_created === 1 && c.clicks === 3 && c.qr_downloads === 1 && c.errors === 3
    && o.previous.pageviews === 1 && o.dau === 1 && o.totals.links === 1 && o.totals.open_errors === 3;
});
await check("timeseries has one row per day with counts", async () => {
  const r = await q("select * from public.admin_timeseries(now() - interval '7 days', now())");
  const total = r.reduce((n, x) => n + Number(x.pageviews), 0);
  return r.length >= 7 && r.length <= 8 && total === 3;
});
await check("breakdowns: pages strip query, referrers default Direct, clicks, top links", async () => {
  const pages = await q("select * from public.admin_breakdown(now() - interval '7 days', now(), 'page')");
  const refs = await q("select * from public.admin_breakdown(now() - interval '7 days', now(), 'referrer')");
  const cc = await q("select * from public.admin_breakdown(now() - interval '7 days', now(), 'click_country')");
  const tl = await q("select * from public.admin_breakdown(now() - interval '7 days', now(), 'top_links')");
  return pages[0].label === "/pricing" && Number(pages[0].value) === 2 && refs.some((r) => r.label === "Direct")
    && cc[0].label === "IN" && tl[0].label === "abc1234" && Number(tl[0].value) === 3;
});
await check("breakdown rejects unknown dimensions", async () => {
  try {
    await q("select * from public.admin_breakdown(now() - interval '1 day', now(), 'password_hash')");
    return false;
  } catch {
    return true;
  }
});
await check("error groups aggregate by fingerprint", async () => {
  const r = await q("select * from public.admin_error_groups(false)");
  const g = r.find((x) => x.fingerprint === "fp1");
  return r.length === 2 && Number(g.occurrences) === 2 && g.paths.length === 2;
});
await check("bio pages list (empty ok)", async () => Array.isArray(await q("select * from public.admin_list_bio_pages()")));
for (const fn of [
  "select * from public.admin_list_users()",
  "select * from public.admin_list_links()",
  `select public.admin_link_stats('${L1}', 7)`,
  "select public.admin_overview(now() - interval '7 days', now())",
  "select * from public.admin_timeseries(now() - interval '7 days', now())",
  "select * from public.admin_breakdown(now() - interval '7 days', now(), 'page')",
  "select * from public.admin_list_bio_pages()",
  "select * from public.admin_error_groups()",
]) {
  await check(`regular users cannot call: ${fn.slice(0, 48)}…`, () => asUser(fn));
}

for (const [s, n] of results) console.log(s.padEnd(5), n);
const passed = results.filter((r) => r[0] === "PASS").length;
console.log(`\n${passed}/${results.length} passed`);
process.exit(passed === results.length ? 0 : 1);
