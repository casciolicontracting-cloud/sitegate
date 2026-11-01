# SiteGate — notes for Claude

Construction execution app for Ontario custom home builders and site supervisors. The owner is a builder, not a developer: explain changes in plain language.

## What it does
A project starts with the drawing set. Each sheet is read by Claude (number, title, discipline, revision, topics, house features, specs, open questions). The supervisor confirms that, then the app generates a phase-by-phase plan:
- Phases joined by stage gates. A gate passes when all tasks are verified, all inspections are passed or marked not required (with a reason), and no deficiencies are open.
- Tasks: checklists (with a sub-section per confirmed room on HVAC, plumbing, electrical, drywall, flooring, trim and paint), cropped drawing views and specs read from drawings, code references, optional photos, trade notes, designer questions (RFIs), deficiencies.
- "Complete task" ticks every remaining check and verifies in one step. Only unfinished earlier steps, required inspections and open deficiencies on the task block it. Photos are optional.
- Rooms: Claude labels rooms on floor plans (name, level, kind, box) and drawing views on every sheet (topic, label, box) into `sheets.rooms` / `sheets.regions`. Confirmed rooms live in `projects.features.rooms`; edit them in the review step or on the Drawings tab.
- Hold-point inspections (municipal, ESA, TSSA, engineer, energy advisor).
- Verification records who, when, and each linked sheet's revision; a later revision flags the task for recheck.

## Stack
- Next.js 15 App Router, TypeScript, React 19, plain CSS with tokens (`app/globals.css`).
- Supabase project `sitegate` (ref `eqookosrjreinlogvzll`, ca-central-1): Postgres with RLS everywhere, private bucket `project-files` (paths `<project_id>/...`). Helper functions in the `private` schema.
- Sign-in: name + one shared team access code. Each device signs in anonymously, then `redeem_access_code()` adds it to `private.team_members`, and team members count as members of every project (`private.is_member`). The code is stored only as a bcrypt hash; change it with `select private.set_access_code('NEW-CODE');` in the Supabase SQL editor. Requires Supabase → Authentication → Allow anonymous sign-ins.
- Vercel project `sitegate` (team `cascioli-contracting`), live at https://sitegate.vercel.app.
- AI analysis: `app/api/analyze-sheet/route.ts` calls the Claude API (`ANTHROPIC_MODEL`, default `claude-sonnet-5-5`) with the sheet plus four quadrant crops and the PDF text layer, acting as the signed-in user.

## Key files
- `lib/template.ts` — phases, tasks, checklists, inspections, topics, trades, feature model, `buildPlan()`. The plan is regenerated from template + `projects.features`; progress is stored against stable task keys.
- `lib/status.ts` — `Engine`: all gate, blocker, verification and revision rules. Keep business rules here as pure functions.
- `lib/codes.ts` — code reference library.
- `lib/useProject.ts` — loads and writes project data.
- `components/` — `Setup` (upload, read, review), `Flow`, `TaskPanel`, `Registers`, `Today`.
- `supabase/migrations/` — schema; add a migration for every schema change.

## Rules
- Code references point to where a requirement lives with a plain-language summary. Never present code text as authoritative and never let the app decide compliance.
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
