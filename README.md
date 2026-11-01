# SiteGate

A construction execution app for Ontario custom homes. Each project starts with the
drawing set: SiteGate splits it into sheets, reads each sheet with Claude, and after the
site supervisor confirms what was read, builds a phase-by-phase plan with stage gates,
checklists, Ontario Building Code references, inspections, deficiencies and trade notes.

**Stack:** Next.js 15 (App Router, TypeScript) on Vercel · Supabase (Postgres, Auth, Storage) · Claude API for drawing analysis · pdf.js in the browser.

## How it works

1. **Project setup** – name, address, municipality, permit number.
2. **Upload drawings** – PDFs are rendered to page images in the browser (pdf.js) and stored in Supabase Storage. The PDF text layer is kept when present.
3. **Read with Claude** – `POST /api/analyze-sheet` sends the whole sheet plus four quadrant crops and the text layer to Claude, which returns sheet number, title, discipline, revision, topics, house features, key specs ("notes"), labelled rooms and drawing views (with their location on the sheet) and questions for the designer. Tasks show cropped pictures of the views and rooms that apply to them. Runs as the signed-in user, so row-level security applies.
4. **Review** – the supervisor corrects the sheet register, topics and house features. Nothing read by AI is used until confirmed here.
5. **Plan** – `lib/template.ts` + confirmed features → phases, tasks and inspections (`buildPlan`). Tasks link to sheets by shared topics; specs read from those sheets appear on the task as "From the drawings".
6. **Execution** – `lib/status.ts` (`Engine`) enforces the stage gates:
   - **Nothing is locked.** Any phase or task can be worked on at any time. Earlier steps (`after`) and inspections (`needs`) show as "usually after" reminders.
   - **Complete task** ticks every remaining check and verifies in one tap; only an open deficiency on the task stops it. Photos are optional. Verification records who, when, and the revision of every linked sheet.
   - A **gate** passes when all tasks are verified, all inspections are passed or marked not required (with a reason), and no deficiencies are open in the phase.
   - If a linked sheet's revision changes after verification, the task is flagged for recheck.

## Code layout

| Path | What it is |
| --- | --- |
| `lib/template.ts` | Phases, tasks, checklists, inspections, topics, trades, feature model, `buildPlan` |
| `lib/codes.ts` | OBC / ESA / TSSA / Tarion / HCRA reference library (pointers + plain-language scope, versioned by edition) |
| `lib/obc.ts` | 2024 OBC clause references per task, checklist line and inspection, with Compendium page numbers (generated from `tools/obc-spec.js`) |
| `components/CodeRefs.tsx` | Clause lists and chips, the in-app Compendium page viewer, and the Code reference upload panel |
| `lib/status.ts` | Stage-gate engine and feature aggregation from analyzed sheets |
| `lib/useProject.ts` | Loads a project bundle from Supabase; all writes go through here |
| `lib/pdf.ts` | PDF/image rendering and analysis crops (browser) |
| `app/api/analyze-sheet/route.ts` | Server route that calls Claude and saves the sheet analysis |
| `components/Setup.tsx` | Upload → read → review → build plan |
| `components/Flow.tsx` | Flow chart of phases and the per-phase sequence with gate |
| `components/TaskPanel.tsx` | Task detail (drawings, checklist, photos, codes, notes, deficiencies, sign-off) and inspection record |
| `components/Registers.tsx` | Drawings, inspections, deficiencies, notes/questions, contacts |
| `supabase/migrations/` | Database schema, row-level security and storage policies |

## Data model (Supabase)

`projects`, `project_members` (owner / supervisor / trade / viewer), `sheets`, `task_states`
(keyed by template task key), `inspections` (keyed by template inspection key), `contacts`,
`notes` (notes and designer questions), `deficiencies`, `activity` (change log), `profiles`.
Files live in the private `project-files` bucket under `<project_id>/…`. Every table has RLS:
only project members can read or write a project's data.

Plan structure is **not** stored; it is regenerated from the template and `projects.features`,
so improving the template improves every project. State is stored against stable task keys.

## Environment variables

See `.env.example`.

| Name | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + local | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel + local | Supabase publishable key (safe in the browser) |
| `ANTHROPIC_API_KEY` | Vercel only | Enables drawing analysis. Without it, sheet details are entered manually |
| `ANTHROPIC_MODEL` | optional | Defaults to `claude-sonnet-5-5` |

Sign-in is a name plus one shared team access code (see `supabase/migrations/0002_access_code_and_rooms.sql`).
In Supabase → Authentication, turn on **Allow anonymous sign-ins**. Change the code in the SQL editor with
`select private.set_access_code('NEW-CODE');`.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

## Important limits of this beta

- Code references are pointers to the relevant section with a summary of what it covers. They are not the code text, and the app never decides compliance. A qualified person confirms requirements.
- AI-read specs and features are suggestions until the supervisor confirms them.
- No offline mode yet; the app needs a connection.
- Single role in practice: any project member can do everything except delete the project. Inviting members is not built yet (add rows to `project_members`).

## Roadmap

- Invite trades and inspectors by email, with role-based permissions
- Offline-first for site use (local cache + sync)
- Pin notes, photos and deficiencies to locations on a sheet
- Drawing revision compare (old vs new) and automatic re-link
- Schedule with dates and trade notifications
- Template editor so the company's own standards become checklists
- Inspection booking integrations per municipality
