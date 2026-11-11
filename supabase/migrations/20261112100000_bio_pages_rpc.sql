-- =============================================================================
-- Bio Pages — publish / unpublish / public read / username availability
--
-- No service-role key is used by the app, so privileged operations are
-- SECURITY DEFINER functions that check ownership themselves:
--   * bio_publish_page      owner snapshots draft+profile+theme -> published (atomic,
--                           guarded by the draft version so a stale tab can't publish)
--   * bio_unpublish_page    owner takes the page offline (snapshot kept for re-publish)
--   * bio_get_public_page   anyone: published, non-suspended pages only, snapshot only
--   * bio_username_status   real users: available | taken | reserved | invalid
-- Idempotent (CREATE OR REPLACE).
-- =============================================================================

create or replace function public.bio_publish_page(p_page_id uuid, p_version integer)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_at timestamptz;
begin
  if not public.bio_is_real_user() then
    raise exception 'bio_not_allowed' using errcode = '42501';
  end if;

  update public.bio_pages p
     set published = jsonb_build_object(
           'schema_version', 1,
           'profile', jsonb_build_object(
             'display_name', p.display_name,
             'bio', p.bio,
             'avatar_path', p.avatar_path
           ),
           'theme', p.theme,
           'doc', p.draft
         ),
         is_published = true,
         published_at = now()
   where p.id = p_page_id
     and p.owner = auth.uid()
     and p.version = p_version
     and not p.is_suspended
  returning p.published_at into v_at;

  if v_at is null then
    -- not the owner, missing, suspended, or the draft changed since validation
    raise exception 'bio_publish_conflict' using errcode = 'P0002';
  end if;
  return v_at;
end;
$$;

create or replace function public.bio_unpublish_page(p_page_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.bio_is_real_user() then
    raise exception 'bio_not_allowed' using errcode = '42501';
  end if;

  update public.bio_pages
     set is_published = false
   where id = p_page_id and owner = auth.uid();

  if not found then
    raise exception 'bio_not_found' using errcode = 'P0002';
  end if;
end;
$$;

-- Public read path: only the immutable published snapshot, never the draft.
create or replace function public.bio_get_public_page(p_username text)
returns table (id uuid, username text, published jsonb, published_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.published, p.published_at
    from public.bio_pages p
   where p.username = lower(p_username)
     and p.is_published
     and not p.is_suspended
   limit 1
$$;

-- Availability without exposing other users' rows (RLS hides them from a plain select).
create or replace function public.bio_username_status(p_username text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v text := lower(trim(p_username));
begin
  if not public.bio_is_real_user() then
    raise exception 'bio_not_allowed' using errcode = '42501';
  end if;
  if v !~ '^[a-z0-9_]{3,30}$' then
    return 'invalid';
  end if;
  if exists (select 1 from public.bio_reserved_usernames r where r.username = v)
     or position('snaplnk' in v) > 0 or position('snaplink' in v) > 0 then
    return 'reserved';
  end if;
  if exists (select 1 from public.bio_pages p where p.username = v)
     or exists (select 1 from public.bio_username_history h
                 where h.username = v and h.released_at > now() - interval '30 days') then
    return 'taken';
  end if;
  return 'available';
end;
$$;

revoke all on function public.bio_publish_page(uuid, integer) from public, anon;
revoke all on function public.bio_unpublish_page(uuid) from public, anon;
revoke all on function public.bio_username_status(text) from public, anon;
revoke all on function public.bio_get_public_page(text) from public;

grant execute on function public.bio_publish_page(uuid, integer) to authenticated;
grant execute on function public.bio_unpublish_page(uuid) to authenticated;
grant execute on function public.bio_username_status(text) to authenticated;
grant execute on function public.bio_get_public_page(text) to anon, authenticated;
