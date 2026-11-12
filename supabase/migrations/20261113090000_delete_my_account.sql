-- =============================================================================
-- Self-service account deletion (Settings → Danger zone)
--
-- One transaction: either everything is deleted or nothing is. Removes the
-- caller's click events, links, feedback and bio pages (bio_* tables cascade),
-- then the auth user. Optional tables are skipped if they don't exist.
-- Cloudinary QR images are removed by the API route *after* this succeeds.
-- Idempotent (CREATE OR REPLACE).
-- =============================================================================

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if to_regclass('public.click_events') is not null then
    execute 'delete from public.click_events where link_id in (select id from public.links where owner = $1)'
      using v_uid;
  end if;

  if to_regclass('public.links') is not null then
    execute 'delete from public.links where owner = $1' using v_uid;
  end if;

  if to_regclass('public.feedback') is not null then
    execute 'delete from public.feedback where user_id = $1' using v_uid;
  end if;

  if to_regclass('public.bio_pages') is not null then
    execute 'delete from public.bio_pages where owner = $1' using v_uid;
  end if;

  if to_regclass('public.users') is not null then
    execute 'delete from public.users where id = $1' using v_uid;
  end if;

  delete from auth.users where id = v_uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
