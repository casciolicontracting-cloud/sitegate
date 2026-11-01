-- Shared team access code, and room / region data read from drawings.
--
-- Sign-in is a name plus one team access code. Each device signs in anonymously,
-- then redeems the code; a redeemed user joins private.team_members and is treated
-- as a member of every project. The code itself is stored only as a bcrypt hash and
-- is set outside of migrations:
--   select private.set_access_code('NEW-CODE');

create table private.team_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now()
);

create table private.access_code (
  id boolean primary key default true check (id),
  code_hash text not null,
  updated_at timestamptz not null default now()
);

create table private.code_attempts (
  id bigint generated always as identity primary key,
  user_id uuid,
  ok boolean not null,
  at timestamptz not null default now()
);
create index on private.code_attempts(at);

create function private.is_team() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.team_members t where t.user_id = (select auth.uid()));
$$;

-- Team members count as members of every project, so all existing policies apply unchanged.
create or replace function private.is_member(p uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_team()
    or exists (select 1 from public.project_members m where m.project_id = p and m.user_id = (select auth.uid()));
$$;

create function private.set_access_code(code text) returns void language sql security definer set search_path = '' as $$
  insert into private.access_code (id, code_hash) values (true, extensions.crypt(upper(trim(code)), extensions.gen_salt('bf')))
  on conflict (id) do update set code_hash = excluded.code_hash, updated_at = now();
$$;

create function public.redeem_access_code(code text, full_name text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  h text;
begin
  if uid is null then raise exception 'Not signed in'; end if;
  if (select count(*) from private.code_attempts a where not a.ok and a.at > now() - interval '10 minutes') >= 30 then
    raise exception 'Too many wrong codes. Wait 10 minutes and try again.';
  end if;
  select c.code_hash into h from private.access_code c;
  if h is null or extensions.crypt(upper(trim(code)), h) <> h then
    insert into private.code_attempts (user_id, ok) values (uid, false);
    return false;
  end if;
  insert into private.code_attempts (user_id, ok) values (uid, true);
  insert into private.team_members (user_id) values (uid) on conflict do nothing;
  insert into public.profiles (id, full_name) values (uid, nullif(trim(full_name), ''))
  on conflict (id) do update set full_name = coalesce(nullif(trim(excluded.full_name), ''), public.profiles.full_name);
  return true;
end $$;

create function public.is_team_member() returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_team();
$$;

revoke all on function private.is_team() from public, anon;
revoke all on function private.set_access_code(text) from public, anon, authenticated;
revoke all on function public.redeem_access_code(text, text) from public, anon;
revoke all on function public.is_team_member() from public, anon;
grant execute on function private.is_team() to authenticated;
grant execute on function public.redeem_access_code(text, text) to authenticated;
grant execute on function public.is_team_member() to authenticated;

create policy "team reads profiles" on public.profiles for select to authenticated using (private.is_team());

-- Rooms (name, level, kind, box) and drawing regions (topic, label, box) read from each sheet.
-- Boxes are [x0, y0, x1, y1] as fractions of the sheet image.
alter table public.sheets add column rooms jsonb not null default '[]'::jsonb;
alter table public.sheets add column regions jsonb not null default '[]'::jsonb;
