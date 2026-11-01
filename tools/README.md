# Code reference tools

`obc-spec.js` is the source for `lib/obc.ts`: which 2024 OBC clauses apply to each task,
inspection and checklist line, with our own plain-language note on what each clause covers.

The generator reads a page-by-page text dump of the 2024 Building Code Compendium (not kept
in this repo, because the Ministry's terms only allow sharing each volume whole and unaltered),
looks up each clause's heading and page, checks that every checklist prefix matches exactly
one check in `lib/template.ts`, and writes `lib/obc.ts` and `lib/obc-pages.json`.
Ask Claude to regenerate when the template or the Compendium edition changes.
