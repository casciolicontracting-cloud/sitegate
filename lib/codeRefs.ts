// Looking up 2024 OBC clauses: the curated library in lib/obc.ts, plus a page index
// of every article in Parts 7, 8, 9, 12 and Division C Part 1 so that any clause
// cited on a drawing can be opened in the Compendium too.

import PAGES from './obc-pages.json';
import { CLAUSES, type Clause } from './obc';
import type { PlanTask } from './template';

/** Private storage for the team's copy of the Compendium (each volume whole and unaltered). */
export const REFERENCE_BUCKET = 'reference';
export const VOLUME_PATH: Record<1 | 2, string> = { 1: 'obc-2024/vol1.pdf', 2: 'obc-2024/vol2.pdf' };
export const VOLUME_LABEL: Record<1 | 2, string> = { 1: 'Volume 1 (the Code)', 2: 'Volume 2 (Supplementary Standards)' };

export interface ClauseView extends Clause {
  id: string;
  curated: boolean; // has our plain-language note
}

const pages = PAGES as Record<string, number>;

export function clauseView(id: string): ClauseView | null {
  const c = CLAUSES[id];
  if (c) return { ...c, id, curated: true };
  const page = pages[id];
  if (!page) return null;
  return { id, ref: `Div. ${id[0]} ${id.slice(1)}.`, title: '', covers: '', vol: 1, page, curated: false };
}

/** Clause ids for a task: its own, then each checklist line's, without repeats. */
export function taskClauseIds(t: PlanTask): string[] {
  return [...new Set([...t.clauses, ...t.checks.flatMap((c) => c.clauses)])];
}

/**
 * Clause numbers written on a drawing note, e.g. "PER OBC 9.8.4.1" or "SEE DIV. C 1.3.5".
 * Only numbers that exist in the Compendium index are returned.
 */
export function citedClauses(text: string): string[] {
  const out = new Set<string>();
  const re = /(Div(?:ision)?\.?\s*([BC])\s*)?\b((?:1|7|8|9|12)\.\d{1,2}\.\d{1,2}(?:\.\d{1,2})?)\.?(?!\d)/gi;
  for (const m of text.matchAll(re)) {
    const div = (m[2] || '').toUpperCase() || (m[3].startsWith('1.') ? 'C' : 'B');
    const id = `${div}${m[3]}`;
    if (CLAUSES[id] || pages[id]) out.add(id);
  }
  return [...out];
}
