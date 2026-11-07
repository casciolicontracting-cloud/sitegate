-- Rooms tab: each room in the house holds its selections and product information
-- (finishes, tile, fixtures, in-floor heating...) with manuals, spec sheets and photos.
--
-- rooms       one row per room. plan_room links it to a room confirmed from the floor
--             plans (projects.features.rooms[].id) so tasks can show that room's products.
-- room_items  one row per selection / product in a room.
--             documents: [{ "path", "name", "kind": manual | install | spec | warranty }]
--             photos:    storage paths, like deficiencies.photos (0005)
--
-- Files live in project-files under <project_id>/rooms/<room id>/<item id>/..., which the
-- existing storage policies (first folder = project id, members only) already cover.
-- Same access rule as the other project tables: project members (and the team) read and write.

create function private.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
revoke all on function private.touch_updated_at() from public, anon;

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  room_type text not null default 'other' check (room_type in (
    'bathroom','ensuite','powder','kitchen','bedroom','living','dining','office',
    'laundry','hall','basement','garage','mechanical','exterior','other')),
  level text not null default '',
  plan_room text,
  sheet_ids uuid[] not null default '{}',
  notes text,
  sort int not null default 0,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, project_id)
);
create index on public.rooms(project_id, sort);
create index on public.rooms(created_by);

create table public.room_items (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  category text not null default 'other' check (category in (
    'floor_tile','wall_tile','shower_tile','waterproofing','floor_heating','thermostat',
    'flooring','paint','trim','countertop','cabinetry','plumbing','lighting','electrical',
    'ventilation','appliance','hardware','windows_doors','exterior','other')),
  name text not null default '',
  location text,
  manufacturer text,
  product text,
  colour text,
  supplier text,
  quantity text,
  trade text,
  status text not null default 'tbd' check (status in ('tbd','selected','ordered','delivered','installed')),
  url text check (url is null or url ~* '^https?://'),
  notes text,
  documents jsonb not null default '[]'::jsonb check (jsonb_typeof(documents) = 'array'),
  photos text[] not null default '{}',
  sort int not null default 0,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- An item always belongs to a room in the same project.
  foreign key (room_id, project_id) references public.rooms(id, project_id) on delete cascade
);
create index on public.room_items(room_id, project_id);
create index on public.room_items(project_id);
create index on public.room_items(created_by);

create trigger rooms_touch before update on public.rooms
  for each row execute function private.touch_updated_at();
create trigger room_items_touch before update on public.room_items
  for each row execute function private.touch_updated_at();

alter table public.rooms enable row level security;
alter table public.room_items enable row level security;

create policy "members all rooms" on public.rooms for all to authenticated
  using (private.is_member(project_id)) with check (private.is_member(project_id));
create policy "members all room_items" on public.room_items for all to authenticated
  using (private.is_member(project_id)) with check (private.is_member(project_id));

revoke all on public.rooms, public.room_items from anon;
grant select, insert, update, delete on public.rooms, public.room_items to authenticated;
