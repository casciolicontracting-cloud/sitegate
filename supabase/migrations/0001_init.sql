-- SiteGate schema, row-level security and storage policies.
-- Applied to the Supabase project as migrations "init_sitegate" and
-- "private_helper_functions"; this file is the combined end state.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, company text, created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null, address text, municipality text, permit_no text, owner_name text,
  stage text not null default 'drawings' check (stage in ('drawings','review','active')),
  features jsonb not null default '{}'::jsonb,
  code_edition text not null default '2024 Ontario Building Code (O. Reg. 163/24)',
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'supervisor' check (role in ('owner','supervisor','trade','viewer')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
create index on public.project_members(user_id);

create table public.sheets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  sort int not null default 0, file_name text, page int, image_path text,
  number text default '', title text default '', discipline text default '', revision text default '',
  topics text[] not null default '{}', notes jsonb not null default '[]'::jsonb,
  questions jsonb not null default '[]'::jsonb, features jsonb not null default '{}'::jsonb,
  text_layer text,
  status text not null default 'new' check (status in ('new','analyzing','analyzed','failed','manual')),
  analyzed_at timestamptz, created_at timestamptz not null default now()
);
create index on public.sheets(project_id);

create table public.task_states (
  project_id uuid not null references public.projects(id) on delete cascade,
  task_key text not null, checks jsonb not null default '{}'::jsonb, photos text[] not null default '{}',
  assignee_contact uuid, started_at timestamptz, verified_by uuid references auth.users(id), verified_at timestamptz,
  sheet_revs jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now(),
  primary key (project_id, task_key)
);

create table public.inspections (
  project_id uuid not null references public.projects(id) on delete cascade,
  insp_key text not null,
  status text not null default 'pending' check (status in ('pending','requested','scheduled','passed','failed','na')),
  requested_on date, scheduled_on date, inspector text, notes text,
  updated_by uuid references auth.users(id) default auth.uid(), updated_at timestamptz not null default now(),
  primary key (project_id, insp_key)
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  trade text not null, company text, person text, phone text, email text, notes text,
  created_at timestamptz not null default now()
);
create index on public.contacts(project_id);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_key text, phase_key text, trade text,
  kind text not null default 'note' check (kind in ('note','question')),
  body text not null, answer text,
  created_by uuid references auth.users(id) default auth.uid(), created_at timestamptz not null default now()
);
create index on public.notes(project_id);

create table public.deficiencies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_key text, phase_key text, title text not null, trade text,
  status text not null default 'open' check (status in ('open','fixed','closed')),
  due_on date, photo_path text,
  created_by uuid references auth.users(id) default auth.uid(), created_at timestamptz not null default now(),
  closed_by uuid references auth.users(id), closed_at timestamptz
);
create index on public.deficiencies(project_id);

create table public.activity (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  actor uuid references auth.users(id) default auth.uid(),
  action text not null, detail jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index on public.activity(project_id, created_at desc);

-- Helpers live in a schema that is not exposed through the API.
create schema if not exists private;
grant usage on schema private to authenticated;

create function private.is_member(p uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.project_members m where m.project_id = p and m.user_id = (select auth.uid()));
$$;
create function private.is_project_owner(p uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.project_members m where m.project_id = p and m.user_id = (select auth.uid()) and m.role = 'owner');
$$;
create function private.add_project_owner() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.project_members(project_id, user_id, role) values (new.id, new.created_by, 'owner'); return new; end; $$;
create function private.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles(id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', '')); return new; end; $$;

revoke all on all functions in schema private from public, anon;
grant execute on function private.is_member(uuid) to authenticated;
grant execute on function private.is_project_owner(uuid) to authenticated;

create trigger projects_add_owner after insert on public.projects
  for each row when (new.created_by is not null) execute function private.add_project_owner();
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.sheets enable row level security;
alter table public.task_states enable row level security;
alter table public.inspections enable row level security;
alter table public.contacts enable row level security;
alter table public.notes enable row level security;
alter table public.deficiencies enable row level security;
alter table public.activity enable row level security;

create policy "own profile read" on public.profiles for select to authenticated using (
  id = (select auth.uid()) or exists (
    select 1 from public.project_members a join public.project_members b on a.project_id = b.project_id
    where a.user_id = (select auth.uid()) and b.user_id = profiles.id));
create policy "own profile write" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "members read projects" on public.projects for select to authenticated using (private.is_member(id) or created_by = (select auth.uid()));
create policy "create projects" on public.projects for insert to authenticated with check (created_by = (select auth.uid()));
create policy "members update projects" on public.projects for update to authenticated using (private.is_member(id)) with check (private.is_member(id));
create policy "owners delete projects" on public.projects for delete to authenticated using (private.is_project_owner(id));

create policy "members read members" on public.project_members for select to authenticated using (private.is_member(project_id));
create policy "owners manage members" on public.project_members for all to authenticated using (private.is_project_owner(project_id)) with check (private.is_project_owner(project_id));

do $$ declare t text; begin
  foreach t in array array['sheets','task_states','inspections','contacts','notes','deficiencies'] loop
    execute format('create policy "members all %1$s" on public.%1$I for all to authenticated using (private.is_member(project_id)) with check (private.is_member(project_id))', t);
  end loop;
end $$;

create policy "members read activity" on public.activity for select to authenticated using (private.is_member(project_id));
create policy "members log activity" on public.activity for insert to authenticated with check (private.is_member(project_id) and actor = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-files', 'project-files', false, 26214400, array['image/jpeg','image/png','image/webp','application/pdf']);

create policy "members read files" on storage.objects for select to authenticated
  using (bucket_id = 'project-files' and private.is_member(((storage.foldername(name))[1])::uuid));
create policy "members upload files" on storage.objects for insert to authenticated
  with check (bucket_id = 'project-files' and private.is_member(((storage.foldername(name))[1])::uuid));
create policy "members update files" on storage.objects for update to authenticated
  using (bucket_id = 'project-files' and private.is_member(((storage.foldername(name))[1])::uuid));
create policy "members delete files" on storage.objects for delete to authenticated
  using (bucket_id = 'project-files' and private.is_member(((storage.foldername(name))[1])::uuid));
