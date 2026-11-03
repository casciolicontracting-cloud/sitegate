# SiteGate — notes for Claude

Construction execution app for Ontario custom home builders and site supervisors. The owner is a builder, not a developer: explain changes in plain language.

## What it does
A project starts with the drawing set. Each sheet is read by Claude (number, title, discipline, revision, topics, house features, specs, open questions). The supervisor confirms that, then the app generates a phase-by-phase plan:
- Phases joined by stage gates. A gate passes when all tasks are verified, all inspections are passed or marked not required (with a reason), and no deficiencies are open.
- Tasks: checklists (with a sub-section per confirmed room on HVAC, plumbing, electrical, drywall, flooring, trim and paint), cropped drawing views and specs read from drawings, code references, optional photos, trade notes, designer questions (RFIs), deficiencies.
- "Complete task" ticks every remaining check and verifies in one step. Only an open deficiency on the task itself stops it. Photos are optional.
- Photos (tasks and deficiencies): "Take photo" (camera) or "From gallery" (several at once). Each is shrunk to a 2048 px JPEG in the browser before upload (`compressPhoto` in `lib/supabase.ts`, also handles iPhone HEIC). Any photo can be deleted, which removes the file too. Deficiency photos live in `deficiencies.photos` (migration 0005; `photo_path` is the old single-photo column).
- Nothing is locked (owner decision, 2026-11-01): any phase or task can be done at any time. Template order (`after` tasks, `needs` inspections) is shown as "usually after" reminders only. A gate shows as passed once its own phase is complete.
- Rooms: Claude labels rooms on floor plans (name, level, kind, box) and drawing views on every sheet (topic, label, box) into `sheets.rooms` / `sheets.regions`. Confirmed rooms live in `projects.features.rooms`; edit them in the review step or on the Drawings tab.
- Inspections (municipal, ESA, TSSA, engineer, energy advisor), recorded per phase; they count toward the gate but never lock work.
- Verification records who, when, and each linked sheet's revision; a later revision flags the task for recheck.
- Progress tabs (`components/Progress.tsx`, rules in `lib/progress.ts`): Timeline (everything completed, grouped by phase or latest first), Photos (task and deficiency photos by phase), Gantt chart (planned phase dates vs actual work). Planned dates live in `projects.schedule` (migration 0004); phases without their own dates follow `TYPICAL_DAYS` from the project start and move when an earlier phase moves.

## Stack
- Next.js 15 App Router, TypeScript, React 19, plain CSS with tokens (`app/globals.css`).
- Supabase project `sitegate` (ref `eqookosrjreinlogvzll`, ca-central-1): Postgres with RLS everywhere, private bucket `project-files` (paths `<project_id>/...`). Helper functions in the `private` schema.
- Sign-in: name + one shared team access code. Each device signs in anonymously, then `redeem_access_code()` adds it to `private.team_members`, and team members count as members of every project (`private.is_member`). Sign-in checks a bcrypt hash; the code itself is also kept (migration 0006) so team members see it on the Today header with Copy and Share (`public.team_access_code()`, null for non-members). Change it with `select private.set_access_code('NEW-CODE');` in the Supabase SQL editor; never commit the code. Requires Supabase → Authentication → Allow anonymous sign-ins.
- Vercel project `sitegate` (team `cascioli-contracting`), live at https://sitegate.vercel.app.
- AI analysis: `app/api/analyze-sheet/route.ts` calls the Claude API (`ANTHROPIC_MODEL`, default `claude-sonnet-5-5`) with the sheet plus four quadrant crops and the PDF text layer, acting as the signed-in user.

## Key files
- `lib/template.ts` — phases, tasks, checklists, inspections, topics, trades, feature model, `buildPlan()`. The plan is regenerated from template + `projects.features`; progress is stored against stable task keys.
- `lib/status.ts` — `Engine`: all gate, reminder, verification and revision rules. Keep business rules here as pure functions.
- `lib/codes.ts` — section-level reference library (OBC sections, ESA, TSSA, Tarion, HCRA, OHSA).
- `lib/obc.ts` (generated from `tools/obc-spec.js`) — 2024 OBC clause references per task, inspection and checklist line: number, heading, Compendium volume + page, and our own plain-language note. `lib/obc-pages.json` maps every article in Parts 7, 8, 9, 12 and Div. C Part 1 to its page so clauses cited on drawings open too. `lib/codeRefs.ts` has the lookups; `components/CodeRefs.tsx` the UI, page viewer and the Code reference upload panel.
- `lib/useProject.ts` — loads and writes project data.
- `components/` — `Setup` (upload, read, review), `Flow`, `TaskPanel`, `Registers`, `Today`, `Progress` (Timeline, Photos, Gantt chart).
- `supabase/migrations/` — schema; add a migration for every schema change.

## Rules
- Code references point to where a requirement lives with a plain-language summary. Never present code text as authoritative and never let the app decide compliance.
- Never copy Building Code Compendium text into the repo or the app (the repo is public; the Ministry treats reproduction in a business tool as commercial use needing a licence). Clause numbers, headings, page numbers and our own summaries only. The Compendium itself lives whole and unaltered in the private `reference` storage bucket (team-only, migration 0003), uploaded from the Projects page.
- AI-read drawing data stays a suggestion until a person confirms it.
- Every new table gets RLS; run Supabase security advisors after schema changes.
- Phone-first: supervisors use this on site.

## Current status
Deployed and building, but not yet tested end to end with a real project. First priorities:
1. Run locally (`npm install`, `.env.local` from `.env.example`) and test the full flow: sign up, create a project, upload a multi-page PDF, read sheets, review, build plan, tick checks, add a photo, verify, log and close a deficiency, record an inspection, pass a gate, revise a sheet. Fix what breaks.
2. Known risks: pdf.js worker under Next.js; Vercel's 4.5 MB body limit on `/api/analyze-sheet`; canvas use of signed-URL images; rendering large sets on phones.
3. Add ESLint, typecheck in CI, and unit tests for `lib/status.ts` and `lib/template.ts`.

## Roadmap (confirm with the owner before starting each)
1. Invite trades and inspectors by email with roles (owner, supervisor, trade, viewer exist).
2. Offline-first site use (cache + sync queue, service worker).
3. Pin notes, photos and deficiencies on drawing sheets.
4. Revision compare and auto re-linking.
5. Schedule and trade notifications.
6. Template editor for the builder's own standards.
7. Per-project code edition versioning.

## Owner-side settings that may still be pending
- Supabase → Authentication → URL Configuration: Site URL `https://sitegate.vercel.app`
- Vercel → Settings → Git: connect this repo for auto-deploys
- Vercel → Environment Variables: `ANTHROPIC_API_KEY`
