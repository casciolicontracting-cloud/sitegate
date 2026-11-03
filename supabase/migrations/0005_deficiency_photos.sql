-- Deficiencies can carry several photos (the problem, then the fix), like tasks.
-- Files live in project-files under <project_id>/deficiencies/<deficiency id>/.
-- photo_path is kept for older rows and copied into photos here.

alter table public.deficiencies add column photos text[] not null default '{}';
update public.deficiencies set photos = array[photo_path] where photo_path is not null;
