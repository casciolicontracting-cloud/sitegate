-- Planned dates for the Gantt chart: { start: 'YYYY-MM-DD', phases: { <phase id>: { start, end } } }.
-- Phases without their own dates follow typical durations from the project start (lib/progress.ts).
-- Covered by the existing projects policies (members read and update).

alter table public.projects add column schedule jsonb not null default '{}'::jsonb;
