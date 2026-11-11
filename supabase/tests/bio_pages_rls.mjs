// RLS acceptance checks for supabase/migrations/*_bio_pages.sql (Phase 0).
// Runs the migration on PGlite (Postgres in WASM) with minimal Supabase auth/storage stubs and
// checks access as owner / other user / anonymous guest / anon role / service role.
//
// Run:  npm i --no-save @electric-sql/pglite@0.2.17
//       node supabase/tests/bio_pages_rls.mjs supabase/migrations/20261111120000_bio_pages.sql
//
// The stubs approximate Supabase; re-verify against `supabase start` (local stack) before production.
// Applies the bio_pages migration to PGlite with minimal Supabase auth/storage stubs,
// then checks RLS as owner / other user / anonymous guest / anon role.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const migrationPath = process.argv[2];
let migration = readFileSync(migrationPath, "utf8");
// pgcrypto isn't bundled with this PGlite build; gen_random_uuid() is core since PG13.
migration = migration.replace(/create extension if not exists pgcrypto;/i, "-- (pgcrypto skipped in PGlite)");

const db = new PGlite();

const STUBS = `
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb ->> 'sub', '')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as
  $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as
  $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
grant usage on schema public, auth, storage to anon, authenticated, service_role;
grant select, insert, update, delete on storage.objects to authenticated;
-- Mimic Supabase defaults: everything in public is granted to API roles unless revoked.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
insert into auth.users values
  ('aaaaaaaa-0000-4000-8000-000000000001'),
  ('bbbbbbbb-0000-4000-8000-000000000002'),
  ('99999999-0000-4000-8000-000000000009');
`;

const A = "aaaaaaaa-0000-4000-8000-000000000001";
const B = "bbbbbbbb-0000-4000-8000-000000000002";
const G = "99999999-0000-4000-8000-000000000009";

const results = [];
async function as(who, fn) {
  await db.exec("reset role");
  if (who === "service") {
    await db.exec("set role service_role");
  } else if (who === "anon") {
    await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ role: "anon" })]);
    await db.exec("set role anon");
  } else {
    const sub = who === "A" ? A : who === "B" ? B : G;
    const claims = { sub, role: "authenticated", is_anonymous: who === "G" };
    await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify(claims)]);
    await db.exec("set role authenticated");
  }
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}
async function check(name, expect, fn) {
  let outcome;
  try {
    const r = await fn();
    outcome = { ok: true, value: r };
  } catch (e) {
    outcome = { ok: false, error: `${e.code ?? ""} ${e.message}`.trim() };
  }
  const pass = expect(outcome);
  results.push({ pass, name, got: outcome.ok ? JSON.stringify(outcome.value) : `ERROR ${outcome.error}` });
}
const rows = (r) => r.rows;
const errorCode = (code) => (o) => !o.ok && o.error.startsWith(code);
const denied = (o) => !o.ok && /permission denied|row-level security|42501/.test(o.error);

await db.exec(STUBS);
await db.exec(migration);
results.push({ pass: true, name: "migration applies on clean DB", got: "ok" });
await db.exec(migration);
results.push({ pass: true, name: "migration re-applies (idempotent)", got: "ok" });

const tables = rows(await db.query(
  "select tablename from pg_tables where schemaname='public' and tablename like 'bio_events%' order by 1"));
results.push({ pass: tables.length >= 4, name: "event partitions created (current, next, default)", got: tables.map((t) => t.tablename).join(", ") });

// ---------- owner A ----------
await check("A inserts own page 'alice'", (o) => o.ok, () =>
  as("A", () => db.query("insert into bio_pages (owner, username, display_name) values ($1, 'alice', 'Alice')", [A])));
await check("A cannot insert a page owned by B", denied, () =>
  as("A", () => db.query("insert into bio_pages (owner, username) values ($1, 'mallory')", [B])));
await check("A cannot claim reserved 'admin' (DB trigger)", errorCode("23514"), () =>
  as("A", () => db.query("insert into bio_pages (owner, username) values ($1, 'admin')", [A])));
await check("A cannot claim 'snaplnk_help' (substring)", errorCode("23514"), () =>
  as("A", () => db.query("insert into bio_pages (owner, username) values ($1, 'snaplnk_help')", [A])));
await check("bad format 'Bad-Name' rejected by check constraint", errorCode("23514"), () =>
  as("A", () => db.query("insert into bio_pages (owner, username) values ($1, 'Bad-Name')", [A])));
await check("A sees own page", (o) => o.ok && o.value.length === 1, () =>
  as("A", async () => rows(await db.query("select username from bio_pages"))));
await check("A updates draft/display_name", (o) => o.ok && o.value === 1, () =>
  as("A", async () => (await db.query(
    "update bio_pages set draft = '{\"schema_version\":1,\"blocks\":[]}', display_name = 'Alice B' where username='alice'")).affectedRows));
await check("A cannot set published directly", denied, () =>
  as("A", () => db.query("update bio_pages set published = draft, is_published = true where username='alice'")));
await check("A cannot un-suspend / set is_suspended", denied, () =>
  as("A", () => db.query("update bio_pages set is_suspended = false where username='alice'")));
await check("A cannot change username directly (server-only flow)", denied, () =>
  as("A", () => db.query("update bio_pages set username = 'alice2' where username='alice'")));
await check("A cannot write sanitized custom_css directly", denied, () =>
  as("A", () => db.query("update bio_pages set custom_css = 'x' where username='alice'")));
await check("A cannot reassign owner", denied, () =>
  as("A", () => db.query("update bio_pages set owner = $1 where username='alice'", [B])));

// ---------- other user B ----------
await check("B inserts own page 'bob'", (o) => o.ok, () =>
  as("B", () => db.query("insert into bio_pages (owner, username) values ($1, 'bob')", [B])));
await check("B cannot take username 'alice' (unique)", errorCode("23505"), () =>
  as("B", () => db.query("insert into bio_pages (owner, username) values ($1, 'alice')", [B])));
await check("B cannot see A's page", (o) => o.ok && o.value.length === 0, () =>
  as("B", async () => rows(await db.query("select id from bio_pages where username='alice'"))));
await check("B update of A's page affects 0 rows", (o) => o.ok && o.value === 0, () =>
  as("B", async () => (await db.query("update bio_pages set display_name='pwned' where username='alice'")).affectedRows));
await check("B delete of A's page affects 0 rows", (o) => o.ok && o.value === 0, () =>
  as("B", async () => (await db.query("delete from bio_pages where username='alice'")).affectedRows));

// ---------- anonymous guest G (signed in anonymously) ----------
await check("guest cannot create a page", denied, () =>
  as("G", () => db.query("insert into bio_pages (owner, username) values ($1, 'guesty')", [G])));
await check("guest sees no pages", (o) => o.ok && o.value.length === 0, () =>
  as("G", async () => rows(await db.query("select id from bio_pages"))));

// ---------- anon role (no session) ----------
await check("anon role cannot read bio_pages", denied, () =>
  as("anon", () => db.query("select id from bio_pages")));
await check("anon role cannot read reserved list", denied, () =>
  as("anon", () => db.query("select * from bio_reserved_usernames")));

// ---------- service-only tables ----------
for (const t of ["bio_events", "bio_daily_stats", "bio_reports", "bio_username_history"]) {
  await check(`authenticated cannot read ${t}`, denied, () => as("A", () => db.query(`select * from ${t}`)));
  await check(`authenticated cannot insert ${t}`, denied, () =>
    as("A", () => db.query(`insert into ${t} default values`)));
}
await check("authenticated cannot call partition function", denied, () =>
  as("A", () => db.query("select public.bio_ensure_event_partitions()")));

// ---------- service role ----------
const alice = rows(await db.query("select id from bio_pages where username='alice'"))[0].id;
await check("service can publish (snapshot)", (o) => o.ok && o.value === 1, () =>
  as("service", async () => (await db.query(
    "update bio_pages set published = draft, is_published = true, published_at = now(), version = version + 1 where id = $1", [alice])).affectedRows));
await check("is_published without snapshot is rejected", errorCode("23514"), () =>
  as("service", () => db.query("update bio_pages set published = null where id = $1", [alice])));
await check("service inserts a view event (routed to a partition)", (o) => o.ok && /bio_events_y/.test(o.value), () =>
  as("service", async () => {
    await db.query("insert into bio_events (page_id, type, visitor_hash) values ($1, 'view', 'h')", [alice]);
    return rows(await db.query("select tableoid::regclass::text as part from bio_events limit 1"))[0].part;
  }));
await check("daily_stats: duplicate page-level row (block_id null) rejected", errorCode("23505"), () =>
  as("service", async () => {
    await db.query("insert into bio_daily_stats (page_id, day, views) values ($1, current_date, 1)", [alice]);
    await db.query("insert into bio_daily_stats (page_id, day, views) values ($1, current_date, 1)", [alice]);
  }));

// ---------- subscribers ----------
await as("service", () => db.query("insert into bio_subscribers (page_id, email) values ($1, 'fan@example.com')", [alice]));
await check("owner A can read own subscribers", (o) => o.ok && o.value.length === 1, () =>
  as("A", async () => rows(await db.query("select email from bio_subscribers"))));
await check("B cannot read A's subscribers", (o) => o.ok && o.value.length === 0, () =>
  as("B", async () => rows(await db.query("select email from bio_subscribers"))));
await check("A cannot insert subscribers directly", denied, () =>
  as("A", () => db.query("insert into bio_subscribers (page_id, email) values ($1, 'x@y.z')", [alice])));

// ---------- storage ----------
await check("bucket bio-assets exists, no SVG allowed", (o) => o.ok && !o.value.allowed_mime_types.includes("image/svg+xml"), () =>
  db.query("select * from storage.buckets where id='bio-assets'").then((r) => r.rows[0]));
await check("A uploads into own folder", (o) => o.ok, () =>
  as("A", () => db.query("insert into storage.objects (bucket_id, name) values ('bio-assets', $1)", [`${A}/avatar.webp`])));
await check("A cannot upload into B's folder", denied, () =>
  as("A", () => db.query("insert into storage.objects (bucket_id, name) values ('bio-assets', $1)", [`${B}/avatar.webp`])));
await check("A cannot upload to bucket root", denied, () =>
  as("A", () => db.query("insert into storage.objects (bucket_id, name) values ('bio-assets', 'avatar.webp')")));
await check("guest cannot upload even into own folder", denied, () =>
  as("G", () => db.query("insert into storage.objects (bucket_id, name) values ('bio-assets', $1)", [`${G}/a.webp`])));

// ---------- cascade ----------
await check("deleting the page cascades events/stats/subscribers", (o) => o.ok && o.value === "0/0/0", () =>
  as("A", async () => {
    await db.query("delete from bio_pages where id = $1", [alice]);
    await db.exec("reset role");
    const c = async (t) => rows(await db.query(`select count(*)::int n from ${t} where page_id = $1`, [alice]))[0].n;
    return `${await c("bio_events")}/${await c("bio_daily_stats")}/${await c("bio_subscribers")}`;
  }));

let failed = 0;
for (const r of results) {
  if (!r.pass) failed++;
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.pass ? "" : `\n      got: ${r.got}`}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
