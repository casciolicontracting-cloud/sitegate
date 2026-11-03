// Progress views: the completion timeline, the photo list and the Gantt schedule.
// Pure functions of the plan + project data, like lib/status.ts.

import type { Plan, PlanPhase } from './template';
import type { Engine } from './status';
import type { ProjectBundle } from './types';

// ---- dates (local calendar days as 'YYYY-MM-DD') ------------------------

export function dayOf(iso: string): string {
  if (iso.length === 10) return iso;
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const toDate = (day: string) => new Date(day + 'T12:00:00');
export function addDays(day: string, n: number): string {
  const d = toDate(day);
  d.setDate(d.getDate() + n);
  return dayOf(d.toISOString());
}
/** Whole days from a to b (b later is positive). */
export function daysBetween(a: string, b: string): number {
  return Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86400000);
}
const minDay = (xs: string[]) => xs.reduce((m, x) => (x < m ? x : m));
const maxDay = (xs: string[]) => xs.reduce((m, x) => (x > m ? x : m));

// ---- timeline -----------------------------------------------------------

export interface Completion {
  at: string; // ISO timestamp
  phase: string;
  kind: 'task' | 'insp' | 'def' | 'gate';
  key: string; // task key, inspection key, deficiency id or phase id
  title: string;
  detail: string;
  who: string | null;
}

/** Everything completed on the project: tasks verified, inspections cleared, deficiencies closed, gates passed. */
export function completions(plan: Plan, data: ProjectBundle, engine: Engine): Completion[] {
  const name = (id: string | null | undefined) => (id ? data.profiles[id]?.full_name || null : null);
  const out: Completion[] = [];
  for (const t of Object.values(plan.tasks)) {
    const st = data.tasks[t.key];
    if (st?.verified_at) out.push({ at: st.verified_at, phase: t.phase, kind: 'task', key: t.key, title: t.name, detail: t.trade, who: name(st.verified_by) });
  }
  for (const i of Object.values(plan.insps)) {
    const st = data.insps[i.key];
    if (st && (st.status === 'passed' || st.status === 'na')) {
      out.push({ at: st.updated_at, phase: i.phase, kind: 'insp', key: i.key,
        title: `${i.name}: ${st.status === 'passed' ? 'inspection passed' : 'marked not required'}`,
        detail: [i.authority, st.inspector].filter(Boolean).join(' · '), who: name(st.updated_by) });
    }
  }
  for (const d of data.defs) {
    if (d.status === 'closed' && d.closed_at && d.phase_key && plan.byPhase[d.phase_key]) {
      out.push({ at: d.closed_at, phase: d.phase_key, kind: 'def', key: d.id, title: `Deficiency closed: ${d.title}`, detail: d.trade || '', who: name(d.closed_by) });
    }
  }
  // A gate passes on the day of the last completion in its phase.
  for (const p of plan.phases) {
    if (!engine.gatePassed(p.id)) continue;
    const mine = out.filter((c) => c.phase === p.id).map((c) => c.at);
    if (mine.length) out.push({ at: mine.reduce((m, x) => (x > m ? x : m)), phase: p.id, kind: 'gate', key: p.id, title: `${p.name} gate passed`, detail: 'Every task verified, inspections cleared, no open deficiencies', who: null });
  }
  return out.sort((a, b) => a.at.localeCompare(b.at) || (a.kind === 'gate' ? 1 : 0) - (b.kind === 'gate' ? 1 : 0));
}

// ---- photos -------------------------------------------------------------

export interface PhotoItem {
  path: string;
  phase: string;
  kind: 'task' | 'def';
  key: string; // task key or deficiency id
  title: string;
  at: string | null; // when known
}

export function photoItems(plan: Plan, data: ProjectBundle): PhotoItem[] {
  const out: PhotoItem[] = [];
  for (const t of Object.values(plan.tasks)) {
    for (const path of data.tasks[t.key]?.photos || []) out.push({ path, phase: t.phase, kind: 'task', key: t.key, title: t.name, at: null });
  }
  for (const d of data.defs) {
    if (d.photo_path && d.phase_key && plan.byPhase[d.phase_key]) {
      out.push({ path: d.photo_path, phase: d.phase_key, kind: 'def', key: d.id, title: `Deficiency: ${d.title}`, at: d.created_at });
    }
  }
  return out;
}

// ---- schedule -----------------------------------------------------------

export interface PhaseDates { start: string; end: string } // inclusive days
export interface Schedule { start?: string; phases?: Record<string, PhaseDates> }

/** Typical calendar days per phase for a custom home; a starting point the supervisor adjusts. */
export const TYPICAL_DAYS: Record<string, number> = {
  pre: 30, site: 10, found: 21, frame: 28, env: 21, mep: 21, ins: 7, dry: 21, ext: 35, int: 42, fin: 14,
};

export interface PlannedPhase extends PhaseDates { custom: boolean }

/** First day anything happened on site, for a project without a start date. */
export function firstActivity(data: ProjectBundle): string | null {
  const days = [
    ...Object.values(data.tasks).flatMap((t) => [t.started_at, t.verified_at]),
    ...Object.values(data.insps).filter((i) => i.status !== 'pending').map((i) => i.updated_at),
  ].filter((x): x is string => !!x).map(dayOf);
  return days.length ? minDay(days) : null;
}

export function projectStart(data: ProjectBundle): string {
  return data.project.schedule?.start || firstActivity(data) || dayOf(data.project.created_at);
}

/**
 * Planned dates for every phase. A phase with its own dates keeps them; the rest
 * start the day after the phases they follow end and run their typical length,
 * so moving one phase moves everything after it.
 */
export function plannedDates(plan: Plan, data: ProjectBundle): Record<string, PlannedPhase> {
  const own = data.project.schedule?.phases || {};
  const start = projectStart(data);
  const out: Record<string, PlannedPhase> = {};
  for (const p of plan.phases) {
    const o = own[p.id];
    if (o?.start && o?.end) { out[p.id] = { start: o.start, end: o.end < o.start ? o.start : o.end, custom: true }; continue; }
    const deps = p.requires.map((r) => out[r]?.end).filter((x): x is string => !!x);
    const s = deps.length ? addDays(maxDay(deps), 1) : start;
    out[p.id] = { start: s, end: addDays(s, (TYPICAL_DAYS[p.id] || 14) - 1), custom: false };
  }
  return out;
}

export interface ActualPhase { start: string; end: string | null } // end null while still going

/** When work on a phase really started and (if its gate passed) finished. */
export function actualDates(p: PlanPhase, data: ProjectBundle, engine: Engine): ActualPhase | null {
  const starts: string[] = [];
  const ends: string[] = [];
  for (const t of p.tasks) {
    const st = data.tasks[t.key];
    if (!st) continue;
    if (st.started_at) starts.push(dayOf(st.started_at));
    if (st.verified_at) { starts.push(dayOf(st.verified_at)); ends.push(dayOf(st.verified_at)); }
  }
  for (const i of p.insps) {
    const st = data.insps[i.key];
    if (st && st.status !== 'pending') { starts.push(dayOf(st.updated_at)); ends.push(dayOf(st.updated_at)); }
  }
  if (!starts.length) return null;
  return { start: minDay(starts), end: engine.gatePassed(p.id) && ends.length ? maxDay(ends) : null };
}
