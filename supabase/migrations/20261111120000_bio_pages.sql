-- =============================================================================
-- Bio Pages (link-in-bio) — Phase 0 foundations
--
-- Idempotent: safe to run more than once (IF NOT EXISTS / OR REPLACE /
-- DROP ... IF EXISTS before CREATE POLICY|TRIGGER).
--
-- Security model
--   * bio_pages: owners read/write their own rows through RLS, but only
--     editor-safe columns are writable by `authenticated` (column grants).
--     Publishing, suspension, username changes and sanitized CSS are written
--     by the server with the service role after validation.
--   * Anonymous (guest) Supabase users are blocked by RESTRICTIVE policies.
--   * Events / stats / reports / history are service-role only; analytics are
--     read through SECURITY DEFINER RPCs (added in Phase 6).
--   * Reserved usernames are enforced in the DB too (trigger), so a client
--     talking to PostgREST directly can't claim e.g. "admin".
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public.bio_is_real_user()
returns boolean
language sql
stable
set search_path = ''
as $$
  select auth.uid() is not null
     and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is not true
$$;

create or replace function public.bio_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Reserved usernames (mirrors lib/bio/reserved.ts — a unit test checks parity)
-- -----------------------------------------------------------------------------
create table if not exists public.bio_reserved_usernames (
  username text primary key
);

-- reserved:start
insert into public.bio_reserved_usernames (username) values
  ('api'), ('app'), ('auth'), ('bio'), ('go'), ('b'), ('u'), ('qr'), ('s'), ('l'), ('r'),
  ('dashboard'), ('signup'), ('signin'), ('login'), ('logout'), ('register'), ('callback'),
  ('pricing'), ('faq'), ('faqs'), ('docs'), ('blog'), ('blogs'), ('about'), ('terms'), ('privacy'),
  ('contact'), ('features'), ('changelog'), ('usage'), ('templates'), ('status'), ('health'),
  ('links'), ('analytics'), ('qr_codes'), ('bio_pages'), ('archived'), ('expired'), ('deleted'),
  ('tags'), ('domains'), ('profile'), ('team'), ('api_keys'), ('billing'), ('settings'), ('new'),
  ('create'), ('edit'), ('admin'), ('reports'),
  ('www'), ('mail'), ('email'), ('smtp'), ('ftp'), ('cdn'), ('static'), ('assets'), ('public'),
  ('robots'), ('sitemap'), ('favicon'), ('manifest'), ('well_known'), ('_next'), ('next'),
  ('snaplnk'), ('snaplink'), ('support'), ('help'), ('security'), ('abuse'), ('official'),
  ('staff'), ('team_snaplnk'), ('root'), ('system'), ('moderator'), ('verify'), ('verified'),
  ('null'), ('undefined'), ('anonymous'), ('guest'), ('user'), ('username'), ('me'), ('test')
on conflict (username) do nothing;
-- reserved:end

alter table public.bio_reserved_usernames enable row level security;
revoke all on public.bio_reserved_usernames from anon, authenticated;

-- -----------------------------------------------------------------------------
-- bio_pages
-- -----------------------------------------------------------------------------
create table if not exists public.bio_pages (
  id             uuid primary key default gen_random_uuid(),
  owner          uuid not null references auth.users (id) on delete cascade,
  username       text not null,
  display_name   text not null default '' check (char_length(display_name) <= 60),
  bio            text not null default '' check (char_length(bio) <= 160),
  avatar_path    text check (avatar_path is null or char_length(avatar_path) <= 512),
  theme          jsonb not null default '{}'::jsonb check (jsonb_typeof(theme) = 'object'),
  -- custom_css_raw: what the user typed (editor only, never rendered)
  -- custom_css:     server-sanitized + scoped output (the only CSS ever rendered)
  custom_css_raw text check (custom_css_raw is null or char_length(custom_css_raw) <= 20000),
  custom_css     text check (custom_css is null or char_length(custom_css) <= 10000),
  seo            jsonb not null default '{}'::jsonb check (jsonb_typeof(seo) = 'object'),
  draft          jsonb not null default '{"schema_version":1,"blocks":[]}'::jsonb
                   check (jsonb_typeof(draft) = 'object' and octet_length(draft::text) <= 262144),
  published      jsonb
                   check (published is null or (jsonb_typeof(published) = 'object' and octet_length(published::text) <= 262144)),
  is_published   boolean not null default false,
  published_at   timestamptz,
  version        integer not null default 1 check (version > 0),
  username_changed_at timestamptz,
  is_suspended   boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint bio_username_format check (username ~ '^[a-z0-9_]{3,30}$'),
  constraint bio_published_consistency check (not is_published or published is not null)
);

create unique index if not exists bio_pages_username_key on public.bio_pages (username);
create index if not exists bio_pages_owner_idx on public.bio_pages (owner);
create index if not exists bio_pages_public_idx
  on public.bio_pages (username) where is_published and not is_suspended;

drop trigger if exists bio_pages_set_updated_at on public.bio_pages;
create trigger bio_pages_set_updated_at
  before update on public.bio_pages
  for each row execute function public.bio_set_updated_at();

-- Reject reserved names at the DB level (insert + username change).
create or replace function public.bio_check_username()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.bio_reserved_usernames r where r.username = new.username)
     or position('snaplnk' in new.username) > 0
     or position('snaplink' in new.username) > 0 then
    raise exception 'bio_username_reserved' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists bio_pages_check_username on public.bio_pages;
create trigger bio_pages_check_username
  before insert or update of username on public.bio_pages
  for each row execute function public.bio_check_username();

alter table public.bio_pages enable row level security;

-- Column-level privileges: clients may only touch editor-safe columns.
revoke all on public.bio_pages from anon, authenticated;
grant select, delete on public.bio_pages to authenticated;
grant insert (owner, username, display_name, bio) on public.bio_pages to authenticated;
grant update (display_name, bio, avatar_path, theme, seo, draft, version, custom_css_raw)
  on public.bio_pages to authenticated;

drop policy if exists bio_pages_owner_select on public.bio_pages;
create policy bio_pages_owner_select on public.bio_pages
  for select to authenticated
  using (owner = (select auth.uid()));

drop policy if exists bio_pages_owner_insert on public.bio_pages;
create policy bio_pages_owner_insert on public.bio_pages
  for insert to authenticated
  with check (owner = (select auth.uid()));

drop policy if exists bio_pages_owner_update on public.bio_pages;
create policy bio_pages_owner_update on public.bio_pages
  for update to authenticated
  using (owner = (select auth.uid()))
  with check (owner = (select auth.uid()));

drop policy if exists bio_pages_owner_delete on public.bio_pages;
create policy bio_pages_owner_delete on public.bio_pages
  for delete to authenticated
  using (owner = (select auth.uid()));

-- RESTRICTIVE: ANDed with the policies above — guests can do nothing.
drop policy if exists bio_pages_block_anonymous on public.bio_pages;
create policy bio_pages_block_anonymous on public.bio_pages
  as restrictive
  for all to authenticated
  using ((select public.bio_is_real_user()))
  with check ((select public.bio_is_real_user()));

-- -----------------------------------------------------------------------------
-- bio_username_history — old names redirect for 30 days after a change
-- -----------------------------------------------------------------------------
create table if not exists public.bio_username_history (
  username    text primary key,
  page_id     uuid not null references public.bio_pages (id) on delete cascade,
  released_at timestamptz not null default now()
);
create index if not exists bio_username_history_page_idx on public.bio_username_history (page_id);

alter table public.bio_username_history enable row level security;
revoke all on public.bio_username_history from anon, authenticated;

-- -----------------------------------------------------------------------------
-- bio_events — raw view/click events, monthly partitions, ~90 day retention
-- -----------------------------------------------------------------------------
create table if not exists public.bio_events (
  id              bigint generated always as identity,
  page_id         uuid not null references public.bio_pages (id) on delete cascade,
  block_id        uuid,                               -- null for page views
  type            text not null check (type in ('view', 'click')),
  country         text,
  device_type     text,
  browser         text,
  os              text,
  referrer_domain text,
  is_bot          boolean not null default false,
  visitor_hash    text not null,
  created_at      timestamptz not null default now(),
  primary key (id, created_at)                        -- PK must include the partition key
) partition by range (created_at);

create index if not exists bio_events_page_created_idx on public.bio_events (page_id, created_at);
create index if not exists bio_events_block_created_idx
  on public.bio_events (block_id, created_at) where block_id is not null;

alter table public.bio_events enable row level security;
revoke all on public.bio_events from anon, authenticated;

-- Creates the partition covering p_month's calendar month (UTC). Idempotent.
create or replace function public.bio_create_events_partition(p_month date)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_start date := date_trunc('month', p_month)::date;
  v_end   date := (date_trunc('month', p_month) + interval '1 month')::date;
  v_name  text := format('bio_events_y%sm%s', to_char(v_start, 'YYYY'), to_char(v_start, 'MM'));
begin
  execute format(
    'create table if not exists public.%I partition of public.bio_events for values from (%L) to (%L)',
    v_name, v_start::timestamptz, v_end::timestamptz
  );
  execute format('alter table public.%I enable row level security', v_name);
  return v_name;
end;
$$;

-- Ensures this month and the next exist. Call daily from cron (Phase 6).
create or replace function public.bio_ensure_event_partitions()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.bio_create_events_partition((now() at time zone 'utc')::date);
  perform public.bio_create_events_partition(((now() at time zone 'utc') + interval '1 month')::date);
end;
$$;

revoke all on function public.bio_create_events_partition(date) from public, anon, authenticated;
revoke all on function public.bio_ensure_event_partitions() from public, anon, authenticated;

select public.bio_ensure_event_partitions();

-- Safety net: events outside every monthly partition land here instead of failing.
-- Should stay empty; the cron creates partitions a month ahead.
create table if not exists public.bio_events_default
  partition of public.bio_events default;
alter table public.bio_events_default enable row level security;

-- -----------------------------------------------------------------------------
-- bio_daily_stats — aggregates the dashboard reads
-- (spec used PRIMARY KEY (page_id, block_id, day), but block_id is NULL for
--  page-level rows and PK columns can't be NULL -> surrogate key + UNIQUE NULLS NOT DISTINCT)
-- -----------------------------------------------------------------------------
create table if not exists public.bio_daily_stats (
  id       bigint generated always as identity primary key,
  page_id  uuid not null references public.bio_pages (id) on delete cascade,
  block_id uuid,                                      -- null = page-level row
  day      date not null,
  views    integer not null default 0 check (views >= 0),
  clicks   integer not null default 0 check (clicks >= 0),
  uniques  integer not null default 0 check (uniques >= 0),
  constraint bio_daily_stats_key unique nulls not distinct (page_id, block_id, day)
);
create index if not exists bio_daily_stats_page_day_idx on public.bio_daily_stats (page_id, day);

alter table public.bio_daily_stats enable row level security;
revoke all on public.bio_daily_stats from anon, authenticated;

-- -----------------------------------------------------------------------------
-- bio_reports — "report this page"
-- -----------------------------------------------------------------------------
create table if not exists public.bio_reports (
  id            uuid primary key default gen_random_uuid(),
  page_id       uuid not null references public.bio_pages (id) on delete cascade,
  reason        text not null check (char_length(reason) <= 64),
  details       text check (details is null or char_length(details) <= 2000),
  reporter_hash text,
  status        text not null default 'open' check (status in ('open', 'reviewed', 'actioned', 'dismissed')),
  created_at    timestamptz not null default now()
);
create index if not exists bio_reports_status_idx on public.bio_reports (status, created_at);

alter table public.bio_reports enable row level security;
revoke all on public.bio_reports from anon, authenticated;

-- -----------------------------------------------------------------------------
-- bio_subscribers — email capture (v1.1). Owners can read/delete their own
-- page's subscribers; inserts happen server-side (rate limit + captcha).
-- -----------------------------------------------------------------------------
create table if not exists public.bio_subscribers (
  id           uuid primary key default gen_random_uuid(),
  page_id      uuid not null references public.bio_pages (id) on delete cascade,
  email        text not null check (char_length(email) <= 254),
  consent_text text not null default '' check (char_length(consent_text) <= 500),
  consented_at timestamptz not null default now(),
  unique (page_id, email)
);

alter table public.bio_subscribers enable row level security;
revoke all on public.bio_subscribers from anon, authenticated;
grant select, delete on public.bio_subscribers to authenticated;

drop policy if exists bio_subscribers_owner_select on public.bio_subscribers;
create policy bio_subscribers_owner_select on public.bio_subscribers
  for select to authenticated
  using (exists (select 1 from public.bio_pages p
                 where p.id = page_id and p.owner = (select auth.uid())));

drop policy if exists bio_subscribers_owner_delete on public.bio_subscribers;
create policy bio_subscribers_owner_delete on public.bio_subscribers
  for delete to authenticated
  using (exists (select 1 from public.bio_pages p
                 where p.id = page_id and p.owner = (select auth.uid())));

drop policy if exists bio_subscribers_block_anonymous on public.bio_subscribers;
create policy bio_subscribers_block_anonymous on public.bio_subscribers
  as restrictive
  for all to authenticated
  using ((select public.bio_is_real_user()))
  with check ((select public.bio_is_real_user()));

-- -----------------------------------------------------------------------------
-- Storage: bio-assets bucket, one folder per user: {auth.uid()}/...
-- Public read (published avatars/images). Server re-encodes uploads (Phase 3).
-- No SVG: only raster MIME types are allowed.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bio-assets', 'bio-assets', true, 5242880,
        array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists bio_assets_owner_insert on storage.objects;
create policy bio_assets_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'bio-assets'
    and (select public.bio_is_real_user())
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists bio_assets_owner_update on storage.objects;
create policy bio_assets_owner_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'bio-assets'
    and (select public.bio_is_real_user())
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'bio-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists bio_assets_owner_delete on storage.objects;
create policy bio_assets_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'bio-assets'
    and (select public.bio_is_real_user())
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
