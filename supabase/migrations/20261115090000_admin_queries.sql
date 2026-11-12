-- =============================================================================
-- Admin dashboard queries (Phase 2)
--
-- All aggregation happens in Postgres (GROUP BY / date_trunc / window counts) —
-- the app never loads raw events into memory. Every function is SECURITY DEFINER
-- (reads auth.users + all tenants' rows) and executable ONLY by service_role, which
-- the app uses exclusively behind requireAdmin(). Idempotent (CREATE OR REPLACE).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Users: list with search / filters / sort / pagination + per-user stats
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_users(
  p_search text default null,
  p_role   text default null,      -- 'ADMIN' | 'USER'
  p_status text default null,      -- 'active' | 'banned' | 'unverified' | 'guest'
  p_sort   text default 'created', -- created | last_seen | email | links | clicks | events
  p_desc   boolean default true,
  p_limit  integer default 25,
  p_offset integer default 0
) returns table (
  id uuid, email text, name text, avatar_url text, provider text, providers text[],
  role text, is_banned boolean, email_confirmed boolean, is_anonymous boolean,
  created_at timestamptz, last_sign_in_at timestamptz, last_seen_at timestamptz,
  links bigint, live_links bigint, clicks bigint, bio_pages bigint, events bigint,
  country text, total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with base as (
    select
      u.id,
      u.email::text as email,
      coalesce(nullif(u.raw_user_meta_data ->> 'name', ''), nullif(u.raw_user_meta_data ->> 'full_name', '')) as name,
      u.raw_user_meta_data ->> 'avatar_url' as avatar_url,
      u.raw_app_meta_data ->> 'provider' as provider,
      coalesce(array(select jsonb_array_elements_text(coalesce(u.raw_app_meta_data -> 'providers', '[]'::jsonb))), '{}') as providers,
      coalesce(a.role, 'USER') as role,
      coalesce(a.is_banned, false) as is_banned,
      u.email_confirmed_at is not null as email_confirmed,
      coalesce(u.is_anonymous, false) as is_anonymous,
      u.created_at,
      u.last_sign_in_at
    from auth.users u
    left join public.user_access a on a.user_id = u.id
    where (coalesce(p_search, '') = ''
           or strpos(lower(coalesce(u.email, '')), lower(p_search)) > 0
           or strpos(lower(coalesce(u.raw_user_meta_data ->> 'name', u.raw_user_meta_data ->> 'full_name', '')), lower(p_search)) > 0
           or u.id::text = p_search)
      and (p_role is null or coalesce(a.role, 'USER') = p_role)
      and (p_status is null
           or (p_status = 'banned' and coalesce(a.is_banned, false))
           or (p_status = 'active' and not coalesce(a.is_banned, false) and not coalesce(u.is_anonymous, false))
           or (p_status = 'unverified' and u.email_confirmed_at is null and not coalesce(u.is_anonymous, false))
           or (p_status = 'guest' and coalesce(u.is_anonymous, false)))
  ),
  stats as (
    select
      b.*,
      (select count(*) from public.links l where l.owner = b.id) as links,
      (select count(*) from public.links l where l.owner = b.id and not l.is_deleted) as live_links,
      (select coalesce(sum(l.clicks_count), 0)::bigint from public.links l where l.owner = b.id) as clicks,
      (select count(*) from public.bio_pages p where p.owner = b.id) as bio_pages,
      (select count(*) from public.analytics_events e where e.user_id = b.id) as events,
      (select max(e.created_at) from public.analytics_events e where e.user_id = b.id) as last_event_at,
      (select e.country from public.analytics_events e
        where e.user_id = b.id and e.country is not null order by e.created_at desc limit 1) as country
    from base b
  )
  select
    s.id, s.email, s.name, s.avatar_url, s.provider, s.providers, s.role, s.is_banned, s.email_confirmed,
    s.is_anonymous, s.created_at, s.last_sign_in_at,
    greatest(s.last_sign_in_at, s.last_event_at) as last_seen_at,
    s.links, s.live_links, s.clicks, s.bio_pages, s.events, s.country,
    count(*) over () as total_count
  from stats s
  order by
    case when p_desc then
      case p_sort
        when 'last_seen' then extract(epoch from greatest(s.last_sign_in_at, s.last_event_at))
        when 'links' then s.links::double precision
        when 'clicks' then s.clicks::double precision
        when 'events' then s.events::double precision
        when 'email' then null
        else extract(epoch from s.created_at)
      end
    end desc nulls last,
    case when not p_desc then
      case p_sort
        when 'last_seen' then extract(epoch from greatest(s.last_sign_in_at, s.last_event_at))
        when 'links' then s.links::double precision
        when 'clicks' then s.clicks::double precision
        when 'events' then s.events::double precision
        when 'email' then null
        else extract(epoch from s.created_at)
      end
    end asc nulls last,
    case when p_sort = 'email' and not p_desc then s.email end asc,
    case when p_sort = 'email' and p_desc then s.email end desc,
    s.created_at desc
  limit least(greatest(coalesce(p_limit, 25), 1), 10000)
  offset greatest(coalesce(p_offset, 0), 0)
$$;

-- ---------------------------------------------------------------------------
-- Links: every tenant's links with owner email
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_links(
  p_search text default null,
  p_status text default null,   -- active | disabled | archived | expired | deleted
  p_owner  uuid default null,
  p_sort   text default 'created', -- created | clicks | last_click | code
  p_desc   boolean default true,
  p_limit  integer default 25,
  p_offset integer default 0
) returns table (
  id uuid, short_code text, original_url text, title text, owner uuid, owner_email text,
  clicks_count bigint, unique_clicks_count bigint, tags text[], is_active boolean, is_deleted boolean,
  archived_link boolean, is_custom_alias boolean, expires_at timestamptz, max_clicks integer,
  has_qr boolean, is_password_protected boolean, created_at timestamptz, last_clicked_at timestamptz,
  deleted_at timestamptz, total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    l.id, l.short_code::text, l.original_url::text, l.title::text, l.owner, u.email::text,
    coalesce(l.clicks_count, 0)::bigint, coalesce(l.unique_clicks_count, 0)::bigint, l.tags,
    l.is_active, l.is_deleted, l.archived_link, l.is_custom_alias, l.expires_at, l.max_clicks,
    l.qr_code_url is not null, coalesce(l.is_password_protected, false), l.created_at, l.last_clicked_at,
    l.deleted_at,
    count(*) over ()
  from public.links l
  left join auth.users u on u.id = l.owner
  where (p_owner is null or l.owner = p_owner)
    and (coalesce(p_search, '') = ''
         or strpos(lower(l.short_code), lower(p_search)) > 0
         or strpos(lower(l.original_url), lower(p_search)) > 0
         or strpos(lower(coalesce(l.title, '')), lower(p_search)) > 0
         or strpos(lower(coalesce(u.email, '')), lower(p_search)) > 0
         or exists (select 1 from unnest(coalesce(l.tags, '{}')) t where lower(t) = lower(p_search)))
    and (p_status is null
         or (p_status = 'deleted' and l.is_deleted)
         or (p_status = 'archived' and l.archived_link and not l.is_deleted)
         or (p_status = 'disabled' and not l.is_active and not l.is_deleted)
         or (p_status = 'expired' and not l.is_deleted
             and ((l.expires_at is not null and l.expires_at < now())
                  or (l.max_clicks is not null and l.clicks_count >= l.max_clicks)))
         or (p_status = 'active' and not l.is_deleted and not l.archived_link and l.is_active
             and (l.expires_at is null or l.expires_at >= now())
             and (l.max_clicks is null or l.clicks_count < l.max_clicks)))
  order by
    case when p_desc then
      case p_sort
        when 'clicks' then coalesce(l.clicks_count, 0)::double precision
        when 'last_click' then extract(epoch from l.last_clicked_at)
        when 'code' then null
        else extract(epoch from l.created_at)
      end
    end desc nulls last,
    case when not p_desc then
      case p_sort
        when 'clicks' then coalesce(l.clicks_count, 0)::double precision
        when 'last_click' then extract(epoch from l.last_clicked_at)
        when 'code' then null
        else extract(epoch from l.created_at)
      end
    end asc nulls last,
    case when p_sort = 'code' and not p_desc then l.short_code end asc,
    case when p_sort = 'code' and p_desc then l.short_code end desc,
    l.created_at desc
  limit least(greatest(coalesce(p_limit, 25), 1), 10000)
  offset greatest(coalesce(p_offset, 0), 0)
$$;

-- ---------------------------------------------------------------------------
-- One link: clicks per day + breakdowns (bots excluded, counted separately)
-- ---------------------------------------------------------------------------
create or replace function public.admin_link_stats(p_link uuid, p_days integer default 30)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with c as (
    select * from public.click_events
    where link_id = p_link and clicked_at >= now() - make_interval(days => greatest(p_days, 1))
  ),
  h as (select * from c where not coalesce(is_bot, false)),
  days as (
    select d::date as day
    from generate_series((now() - make_interval(days => greatest(p_days, 1) - 1))::date, now()::date, interval '1 day') d
  )
  select jsonb_build_object(
    'total', (select count(*) from h),
    'uniques', (select count(distinct visitor_hash) from h),
    'bots', (select count(*) from c where coalesce(is_bot, false)),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'clicks', coalesce(x.n, 0), 'uniques', coalesce(x.u, 0)) order by d.day), '[]')
              from days d
              left join (select clicked_at::date as day, count(*) n, count(distinct visitor_hash) u from h group by 1) x on x.day = d.day),
    'countries', (select coalesce(jsonb_agg(jsonb_build_object('label', k, 'value', n) order by n desc), '[]')
                  from (select coalesce(nullif(country, ''), 'Unknown') k, count(*) n from h group by 1 order by 2 desc limit 10) t),
    'devices', (select coalesce(jsonb_agg(jsonb_build_object('label', k, 'value', n) order by n desc), '[]')
                from (select coalesce(nullif(device_type, ''), 'Unknown') k, count(*) n from h group by 1 order by 2 desc limit 10) t),
    'browsers', (select coalesce(jsonb_agg(jsonb_build_object('label', k, 'value', n) order by n desc), '[]')
                 from (select coalesce(nullif(browser, ''), 'Unknown') k, count(*) n from h group by 1 order by 2 desc limit 10) t),
    'os', (select coalesce(jsonb_agg(jsonb_build_object('label', k, 'value', n) order by n desc), '[]')
           from (select coalesce(nullif(os, ''), 'Unknown') k, count(*) n from h group by 1 order by 2 desc limit 10) t),
    'referrers', (select coalesce(jsonb_agg(jsonb_build_object('label', k, 'value', n) order by n desc), '[]')
                  from (select coalesce(nullif(referrer_domain, ''), 'Direct') k, count(*) n from h group by 1 order by 2 desc limit 10) t)
  )
$$;

-- ---------------------------------------------------------------------------
-- Overview KPIs for a period + the previous period of equal length
-- ---------------------------------------------------------------------------
create or replace function public.admin_period_stats(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'users_total', (select count(*) from auth.users where created_at < p_to and not coalesce(is_anonymous, false)),
    'new_users', (select count(*) from auth.users where created_at >= p_from and created_at < p_to and not coalesce(is_anonymous, false)),
    'active_users', (select count(*) from (
        select user_id from public.analytics_events where user_id is not null and created_at >= p_from and created_at < p_to
        union
        select id from auth.users where last_sign_in_at >= p_from and last_sign_in_at < p_to and not coalesce(is_anonymous, false)
      ) a),
    'pageviews', (select count(*) from public.analytics_events where type = 'pageview' and created_at >= p_from and created_at < p_to),
    'visitors', (select count(distinct anonymous_id) from public.analytics_events where type = 'pageview' and created_at >= p_from and created_at < p_to),
    'sessions', (select count(*) from public.analytics_sessions where started_at >= p_from and started_at < p_to),
    'avg_session_sec', (select coalesce(round(avg(duration_sec)), 0) from public.analytics_sessions where started_at >= p_from and started_at < p_to),
    'bounce_rate', (select coalesce(round(100.0 * avg((pageviews <= 1)::int), 1), 0) from public.analytics_sessions where started_at >= p_from and started_at < p_to),
    'links_created', (select count(*) from public.links where created_at >= p_from and created_at < p_to),
    'clicks', (select count(*) from public.click_events where not coalesce(is_bot, false) and clicked_at >= p_from and clicked_at < p_to),
    'unique_clickers', (select count(distinct visitor_hash) from public.click_events where not coalesce(is_bot, false) and clicked_at >= p_from and clicked_at < p_to),
    'qr_downloads', (select count(*) from public.analytics_events where name = 'qr_download' and created_at >= p_from and created_at < p_to),
    'bio_published', (select count(*) from public.analytics_events where name = 'bio_page_publish' and created_at >= p_from and created_at < p_to),
    'errors', (select count(*) from public.error_log where created_at >= p_from and created_at < p_to)
  )
$$;

create or replace function public.admin_overview(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'current', public.admin_period_stats(p_from, p_to),
    'previous', public.admin_period_stats(p_from - (p_to - p_from), p_from),
    'dau', (select count(distinct user_id) from public.analytics_events where user_id is not null and created_at >= p_to - interval '1 day' and created_at < p_to),
    'wau', (select count(distinct user_id) from public.analytics_events where user_id is not null and created_at >= p_to - interval '7 days' and created_at < p_to),
    'mau', (select count(distinct user_id) from public.analytics_events where user_id is not null and created_at >= p_to - interval '30 days' and created_at < p_to),
    'totals', jsonb_build_object(
      'links', (select count(*) from public.links where not is_deleted),
      'clicks', (select coalesce(sum(clicks_count), 0) from public.links),
      'bio_pages', (select count(*) from public.bio_pages),
      'published_bio_pages', (select count(*) from public.bio_pages where is_published),
      'open_errors', (select count(*) from public.error_log where not resolved)
    )
  )
$$;

-- Daily series for charts (UTC days).
create or replace function public.admin_timeseries(p_from timestamptz, p_to timestamptz)
returns table (day date, pageviews bigint, visitors bigint, signups bigint, links bigint, clicks bigint)
language sql
stable
security definer
set search_path = ''
as $$
  with d as (
    select g::date as day from generate_series(p_from::date, (p_to - interval '1 second')::date, interval '1 day') g
  ),
  pv as (
    select created_at::date as day, count(*) n, count(distinct anonymous_id) v
    from public.analytics_events where type = 'pageview' and created_at >= p_from and created_at < p_to group by 1
  ),
  su as (select created_at::date as day, count(*) n from auth.users
         where created_at >= p_from and created_at < p_to and not coalesce(is_anonymous, false) group by 1),
  lk as (select created_at::date as day, count(*) n from public.links where created_at >= p_from and created_at < p_to group by 1),
  ck as (select clicked_at::date as day, count(*) n from public.click_events
         where not coalesce(is_bot, false) and clicked_at >= p_from and clicked_at < p_to group by 1)
  select d.day, coalesce(pv.n, 0), coalesce(pv.v, 0), coalesce(su.n, 0), coalesce(lk.n, 0), coalesce(ck.n, 0)
  from d
  left join pv on pv.day = d.day
  left join su on su.day = d.day
  left join lk on lk.day = d.day
  left join ck on ck.day = d.day
  order by d.day
$$;

-- Top-N breakdowns for the overview / traffic.
create or replace function public.admin_breakdown(p_from timestamptz, p_to timestamptz, p_dim text, p_limit integer default 10)
returns table (label text, value bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 10), 1), 100);
begin
  if p_dim in ('page', 'referrer', 'country', 'device', 'browser', 'os', 'utm') then
    return query
      select k, count(*)::bigint
      from (
        select case p_dim
                 when 'page' then split_part(coalesce(path, '/'), '?', 1)
                 when 'referrer' then coalesce(nullif(referrer_domain, ''), 'Direct')
                 when 'country' then coalesce(nullif(country, ''), 'Unknown')
                 when 'device' then coalesce(nullif(device, ''), 'Unknown')
                 when 'browser' then coalesce(nullif(browser, ''), 'Unknown')
                 when 'os' then coalesce(nullif(os, ''), 'Unknown')
                 when 'utm' then coalesce(nullif(utm_campaign, ''), nullif(utm_source, ''), '(none)')
               end as k
        from public.analytics_events
        where type = 'pageview' and created_at >= p_from and created_at < p_to
      ) t
      group by k order by 2 desc limit v_limit;
  elsif p_dim = 'event' then
    return query
      select name, count(*)::bigint from public.analytics_events
      where created_at >= p_from and created_at < p_to and type <> 'pageview'
      group by name order by 2 desc limit v_limit;
  elsif p_dim in ('click_country', 'click_referrer', 'click_device', 'click_browser') then
    return query
      select k, count(*)::bigint
      from (
        select case p_dim
                 when 'click_country' then coalesce(nullif(country, ''), 'Unknown')
                 when 'click_referrer' then coalesce(nullif(referrer_domain, ''), 'Direct')
                 when 'click_device' then coalesce(nullif(device_type, ''), 'Unknown')
                 else coalesce(nullif(browser, ''), 'Unknown')
               end as k
        from public.click_events
        where not coalesce(is_bot, false) and clicked_at >= p_from and clicked_at < p_to
      ) t
      group by k order by 2 desc limit v_limit;
  elsif p_dim = 'top_links' then
    return query
      select l.short_code::text, count(*)::bigint
      from public.click_events c join public.links l on l.id = c.link_id
      where not coalesce(c.is_bot, false) and c.clicked_at >= p_from and c.clicked_at < p_to
      group by l.short_code order by 2 desc limit v_limit;
  else
    raise exception 'unknown dimension %', p_dim using errcode = '22023';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Bio pages across all users
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_bio_pages(
  p_search text default null,
  p_status text default null,  -- published | draft | suspended
  p_owner uuid default null,
  p_limit integer default 25,
  p_offset integer default 0
) returns table (
  id uuid, username text, display_name text, owner uuid, owner_email text, is_published boolean,
  is_suspended boolean, blocks integer, published_at timestamptz, created_at timestamptz,
  updated_at timestamptz, total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.display_name, p.owner, u.email::text, p.is_published, p.is_suspended,
         coalesce(jsonb_array_length(p.draft -> 'blocks'), 0), p.published_at, p.created_at, p.updated_at,
         count(*) over ()
  from public.bio_pages p
  left join auth.users u on u.id = p.owner
  where (p_owner is null or p.owner = p_owner)
    and (coalesce(p_search, '') = ''
         or strpos(p.username, lower(p_search)) > 0
         or strpos(lower(p.display_name), lower(p_search)) > 0
         or strpos(lower(coalesce(u.email, '')), lower(p_search)) > 0)
    and (p_status is null
         or (p_status = 'published' and p.is_published and not p.is_suspended)
         or (p_status = 'draft' and not p.is_published)
         or (p_status = 'suspended' and p.is_suspended))
  order by p.updated_at desc
  limit least(greatest(coalesce(p_limit, 25), 1), 10000)
  offset greatest(coalesce(p_offset, 0), 0)
$$;

-- ---------------------------------------------------------------------------
-- Errors grouped by fingerprint
-- ---------------------------------------------------------------------------
create or replace function public.admin_error_groups(
  p_resolved boolean default false,
  p_limit integer default 25,
  p_offset integer default 0
) returns table (
  fingerprint text, message text, source text, occurrences bigint, users bigint,
  first_seen timestamptz, last_seen timestamptz, paths text[], sample_stack text, total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    e.fingerprint,
    (array_agg(e.message order by e.created_at desc))[1],
    (array_agg(e.source order by e.created_at desc))[1],
    count(*),
    count(distinct e.user_id),
    min(e.created_at),
    max(e.created_at),
    (array_agg(distinct coalesce(e.path, '?')))[1:10],
    (array_agg(e.stack order by e.created_at desc) filter (where e.stack is not null))[1],
    count(*) over ()
  from public.error_log e
  where e.resolved = coalesce(p_resolved, false)
  group by e.fingerprint
  order by max(e.created_at) desc
  limit least(greatest(coalesce(p_limit, 25), 1), 500)
  offset greatest(coalesce(p_offset, 0), 0)
$$;

-- ---------------------------------------------------------------------------
-- Lock everything down: service_role only.
-- ---------------------------------------------------------------------------
do $$
declare f text;
begin
  foreach f in array array[
    'public.admin_list_users(text, text, text, text, boolean, integer, integer)',
    'public.admin_list_links(text, text, uuid, text, boolean, integer, integer)',
    'public.admin_link_stats(uuid, integer)',
    'public.admin_period_stats(timestamptz, timestamptz)',
    'public.admin_overview(timestamptz, timestamptz)',
    'public.admin_timeseries(timestamptz, timestamptz)',
    'public.admin_breakdown(timestamptz, timestamptz, text, integer)',
    'public.admin_list_bio_pages(text, text, uuid, integer, integer)',
    'public.admin_error_groups(boolean, integer, integer)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end;
$$;
