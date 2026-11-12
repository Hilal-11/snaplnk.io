// Acceptance checks for supabase/migrations/*_admin_analytics.sql on PGlite.
// Run:  npm i --no-save @electric-sql/pglite@0.2.17
//       node supabase/tests/admin_analytics.mjs supabase/migrations/20261114090000_admin_analytics.sql
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const sql = readFileSync(process.argv[2], "utf8");
const db = new PGlite();
const A = "aaaaaaaa-0000-4000-8000-000000000001";
const B = "bbbbbbbb-0000-4000-8000-000000000002";
const C = "cccccccc-0000-4000-8000-000000000003";

await db.exec(`
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth; create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'sub', '')::uuid $$;
grant usage on schema public, auth to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
insert into auth.users values ('${A}'), ('${B}');
-- existing table created outside migrations, with raw IPs and NOT NULL
create table public.click_events (id bigserial primary key, link_id uuid, ip_address text not null, visitor_hash text);
insert into public.click_events (ip_address, visitor_hash) values ('203.0.113.7', 'h1'), ('198.51.100.2', 'h2');
`);
await db.exec(sql);
await db.exec(sql); // idempotent
await db.exec(`insert into auth.users values ('${C}')`); // trigger path

const results = [];
const check = async (name, fn) => {
  try {
    results.push([(await fn()) ? "PASS" : "FAIL", name]);
  } catch (e) {
    results.push(["FAIL", `${name} — ${e.message}`]);
  }
};
async function as(sub, q, params = []) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify(sub ? { sub, role: "authenticated" } : { role: "anon" })]);
  await db.exec(sub ? "set role authenticated" : "set role anon");
  try {
    return await db.query(q, params);
  } finally {
    await db.exec("reset role");
  }
}
const denied = async (sub, q) => {
  try {
    await as(sub, q);
    return false;
  } catch (e) {
    return /permission denied|row-level security/.test(e.message);
  }
};

await check("backfill: existing users get a USER row", async () =>
  (await db.query(`select count(*)::int n from public.user_access where role = 'USER'`)).rows[0].n === 3);
await check("trigger: new auth user gets a row", async () =>
  (await db.query(`select 1 from public.user_access where user_id = '${C}'`)).rows.length === 1);
await check("user reads only their own access row", async () => {
  const r = await as(A, "select user_id from public.user_access");
  return r.rows.length === 1 && r.rows[0].user_id === A;
});
await check("user cannot promote themselves", () => denied(A, `update public.user_access set role = 'ADMIN' where user_id = '${A}'`));
await check("user cannot insert access rows", () => denied(A, `insert into public.user_access (user_id, role) values ('${A}', 'ADMIN')`));
await check("anon cannot read access rows", () => denied(null, "select * from public.user_access"));
for (const t of ["analytics_events", "analytics_sessions", "audit_log", "error_log", "daily_stats", "admin_settings"]) {
  await check(`authenticated cannot read ${t}`, () => denied(A, `select * from public.${t}`));
  await check(`anon cannot insert ${t}`, () => denied(null, `insert into public.${t} default values`));
}
await check("users cannot call analytics_touch_session", () =>
  denied(A, "select public.analytics_touch_session('s1', 'a', null, '/', 1, null, null, null)"));
await check("service upserts a session and accumulates pageviews", async () => {
  await db.query("select public.analytics_touch_session('s1', 'anon1', null, '/', 1, 'IN', 'mobile', 'google.com')");
  await db.query(`select public.analytics_touch_session('s1', 'anon1', '${A}', '/pricing', 2, 'IN', 'mobile', null)`);
  const r = (await db.query("select * from public.analytics_sessions where id = 's1'")).rows[0];
  return r.pageviews === 3 && r.entry_path === "/" && r.exit_path === "/pricing" && r.user_id === A && r.referrer === "google.com";
});
await check("event metadata size is capped", async () => {
  try {
    await db.query("insert into public.analytics_events (type, name, metadata) values ('event', 'x', jsonb_build_object('k', repeat('a', 9000)))");
    return false;
  } catch {
    return true;
  }
});
await check("raw IPs erased from click_events, column now nullable", async () => {
  const r = (await db.query("select count(*)::int n from public.click_events where ip_address is not null")).rows[0].n;
  await db.query("insert into public.click_events (visitor_hash) values ('h3')");
  return r === 0;
});
await check("default admin settings seeded", async () =>
  (await db.query("select count(*)::int n from public.admin_settings")).rows[0].n === 2);

for (const [s, n] of results) console.log(s.padEnd(5), n);
const passed = results.filter((r) => r[0] === "PASS").length;
console.log(`\n${passed}/${results.length} passed`);
process.exit(passed === results.length ? 0 : 1);
