-- Show the team access code inside the app so it's easy to share.
-- The code is kept alongside its hash; only signed-in team members can read it
-- (public.team_access_code() returns null for anyone else). Sign-in still checks the hash.

alter table private.access_code add column code text;

create or replace function private.set_access_code(code text) returns void language sql security definer set search_path = '' as $$
  insert into private.access_code (id, code_hash, code) values (true, extensions.crypt(upper(trim(code)), extensions.gen_salt('bf')), upper(trim(code)))
  on conflict (id) do update set code_hash = excluded.code_hash, code = excluded.code, updated_at = now();
$$;
revoke all on function private.set_access_code(text) from public, anon, authenticated;

create function public.team_access_code() returns text language sql stable security definer set search_path = '' as $$
  select c.code from private.access_code c where private.is_team();
$$;
revoke all on function public.team_access_code() from public, anon;
grant execute on function public.team_access_code() to authenticated;
