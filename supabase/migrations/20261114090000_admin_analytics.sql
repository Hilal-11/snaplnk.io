-- =============================================================================
-- Admin role + first-party analytics (Phase 1)
--
--  * user_access        role (USER|ADMIN) + ban flag per user. Written ONLY by the
--                       server with the service-role key (role is synced from the
--                       ADMIN_EMAILS env on every sign-in). Users may read their own row.
--                       Kept separate from public.users on purpose: that table's RLS
--                       may let users edit their own row, which must never include role.
--  * analytics_events   raw events from /api/track (+ server-side events)
--  * analytics_sessions one row per browser session, upserted by analytics_touch_session()
--  * audit_log          every admin action (and denied admin logins)
--  * error_log          client + server errors, grouped by fingerprint
--  * daily_stats        aggregates kept after raw events expire (filled by cron, Phase 3)
--  * admin_settings     retention period, exclude-admin-traffic switch
--  * click_events       raw IPs removed (privacy): column nulled + made nullable
--
-- All analytics tables are service-role only (RLS on, no policies). Idempotent.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- user_access
-- ---------------------------------------------------------------------------
create table if not exists public.user_access (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  role          text not null default 'USER' check (role in ('USER', 'ADMIN')),
  is_banned     boolean not null default false,
  banned_at     timestamptz,
  banned_reason text check (banned_reason is null or char_length(banned_reason) <= 500),
  last_sign_in_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists user_access_role_idx on public.user_access (role) where role = 'ADMIN';

alter table public.user_access enable row level security;
revoke all on public.user_access from anon, authenticated;
grant select on public.user_access to authenticated;

drop policy if exists user_access_read_own on public.user_access;
create policy user_access_read_own on public.user_access
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Every new auth user gets a USER row (role is upgraded server-side at sign-in).
create or replace function public.handle_new_user_access()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_access (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_access on auth.users;
create trigger on_auth_user_created_access
  after insert on auth.users
  for each row execute function public.handle_new_user_access();

-- Backfill existing users.
insert into public.user_access (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- analytics_events
-- ---------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id             bigint generated always as identity primary key,
  type           text not null check (type in ('pageview', 'event', 'error', 'vital')),
  name           text not null check (char_length(name) <= 64),
  user_id        uuid,
  anonymous_id   text check (anonymous_id is null or char_length(anonymous_id) <= 64),
  session_id     text check (session_id is null or char_length(session_id) <= 64),
  path           text check (path is null or char_length(path) <= 512),
  referrer       text check (referrer is null or char_length(referrer) <= 1024),
  referrer_domain text,
  utm_source     text,
  utm_medium     text,
  utm_campaign   text,
  country        text,
  city           text,
  device         text check (device is null or device in ('desktop', 'mobile', 'tablet')),
  browser        text,
  os             text,
  ip_hash        text,
  metadata       jsonb not null default '{}'::jsonb check (octet_length(metadata::text) <= 8192),
  created_at     timestamptz not null default now()
);
create index if not exists analytics_events_type_created_idx on public.analytics_events (type, created_at);
create index if not exists analytics_events_name_created_idx on public.analytics_events (name, created_at);
create index if not exists analytics_events_user_idx on public.analytics_events (user_id) where user_id is not null;
create index if not exists analytics_events_session_idx on public.analytics_events (session_id);
create index if not exists analytics_events_path_idx on public.analytics_events (path);
create index if not exists analytics_events_created_idx on public.analytics_events (created_at);

alter table public.analytics_events enable row level security;
revoke all on public.analytics_events from anon, authenticated;

-- ---------------------------------------------------------------------------
-- analytics_sessions
-- ---------------------------------------------------------------------------
create table if not exists public.analytics_sessions (
  id            text primary key check (char_length(id) <= 64),
  anonymous_id  text,
  user_id       uuid,
  started_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  pageviews     integer not null default 0 check (pageviews >= 0),
  entry_path    text,
  exit_path     text,
  duration_sec  integer not null default 0 check (duration_sec >= 0),
  country       text,
  device        text,
  referrer      text
);
create index if not exists analytics_sessions_started_idx on public.analytics_sessions (started_at);
create index if not exists analytics_sessions_last_seen_idx on public.analytics_sessions (last_seen_at);
create index if not exists analytics_sessions_user_idx on public.analytics_sessions (user_id) where user_id is not null;

alter table public.analytics_sessions enable row level security;
revoke all on public.analytics_sessions from anon, authenticated;

-- Upsert a session: first call sets entry/referrer, later calls extend it.
create or replace function public.analytics_touch_session(
  p_id text,
  p_anonymous_id text,
  p_user_id uuid,
  p_path text,
  p_pageviews integer,
  p_country text,
  p_device text,
  p_referrer text
) returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.analytics_sessions
    (id, anonymous_id, user_id, started_at, last_seen_at, pageviews, entry_path, exit_path, country, device, referrer)
  values
    (p_id, p_anonymous_id, p_user_id, now(), now(), greatest(p_pageviews, 0), p_path, p_path, p_country, p_device, p_referrer)
  on conflict (id) do update set
    last_seen_at = now(),
    user_id      = coalesce(public.analytics_sessions.user_id, excluded.user_id),
    pageviews    = public.analytics_sessions.pageviews + greatest(p_pageviews, 0),
    exit_path    = coalesce(excluded.exit_path, public.analytics_sessions.exit_path),
    duration_sec = greatest(0, extract(epoch from (now() - public.analytics_sessions.started_at))::integer)
$$;
revoke all on function public.analytics_touch_session(text, text, uuid, text, integer, text, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- audit_log
-- ---------------------------------------------------------------------------
create table if not exists public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid,
  action     text not null check (char_length(action) <= 64),
  target     text check (target is null or char_length(target) <= 256),
  metadata   jsonb not null default '{}'::jsonb,
  ip_hash    text,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);
create index if not exists audit_log_action_idx on public.audit_log (action, created_at desc);

alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;

-- ---------------------------------------------------------------------------
-- error_log
-- ---------------------------------------------------------------------------
create table if not exists public.error_log (
  id          bigint generated always as identity primary key,
  fingerprint text not null,
  source      text not null default 'client' check (source in ('client', 'server')),
  message     text not null check (char_length(message) <= 2000),
  stack       text check (stack is null or char_length(stack) <= 8000),
  path        text,
  user_id     uuid,
  user_agent  text,
  created_at  timestamptz not null default now(),
  resolved    boolean not null default false,
  resolved_at timestamptz
);
create index if not exists error_log_fingerprint_idx on public.error_log (fingerprint, created_at desc);
create index if not exists error_log_unresolved_idx on public.error_log (created_at desc) where not resolved;

alter table public.error_log enable row level security;
revoke all on public.error_log from anon, authenticated;

-- ---------------------------------------------------------------------------
-- daily_stats (aggregates that outlive raw events)
-- ---------------------------------------------------------------------------
create table if not exists public.daily_stats (
  day       date not null,
  metric    text not null,
  dimension text not null default '',
  value     bigint not null default 0,
  primary key (day, metric, dimension)
);
alter table public.daily_stats enable row level security;
revoke all on public.daily_stats from anon, authenticated;

-- ---------------------------------------------------------------------------
-- admin_settings
-- ---------------------------------------------------------------------------
create table if not exists public.admin_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
insert into public.admin_settings (key, value) values
  ('retention_days', '90'::jsonb),
  ('exclude_admin_traffic', 'true'::jsonb)
on conflict (key) do nothing;

alter table public.admin_settings enable row level security;
revoke all on public.admin_settings from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Privacy: stop keeping raw visitor IPs on link clicks.
-- The app no longer writes ip_address; existing values are erased.
-- (Guarded: click_events is created outside these migrations.)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'click_events' and column_name = 'ip_address'
  ) then
    execute 'alter table public.click_events alter column ip_address drop not null';
    execute 'update public.click_events set ip_address = null where ip_address is not null';
  end if;
end;
$$;
