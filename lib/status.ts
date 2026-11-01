// Stage-gate logic. Pure functions of the plan + project data, so the same
// rules can later run on the server (e.g. to block an API write) unchanged.

import type { Plan, PlanPhase, PlanTask, PlanInsp, Features } from './template';
import type { ProjectBundle, Sheet, InspStatus } from './types';

export type TaskStatus = 'locked' | 'ready' | 'active' | 'review' | 'verified';
export type GateStatus = 'locked' | 'open' | 'ready' | 'passed';

export const TASK_LABEL: Record<TaskStatus, string> = {
  locked: 'Waiting', ready: 'Ready', active: 'In progress', review: 'Ready to verify', verified: 'Verified',
};
export const GATE_LABEL: Record<GateStatus, string> = {
  locked: 'Locked', open: 'In progress', ready: 'Gate ready', passed: 'Gate passed',
};
export const INSP_LABEL: Record<InspStatus, string> = {
  pending: 'Not requested', requested: 'Requested', scheduled: 'Scheduled', passed: 'Passed', failed: 'Failed', na: 'Not required',
};

export interface Blocker { kind: 'phase' | 'task' | 'insp' | 'def'; key: string; label: string }

export class Engine {
  constructor(public plan: Plan, public data: ProjectBundle) {}
  private gateCache = new Map<string, boolean>();

  inspStatus(key: string): InspStatus {
    return this.data.insps[key]?.status || 'pending';
  }
  inspCleared(key: string): boolean {
    const s = this.inspStatus(key);
    return s === 'passed' || s === 'na';
  }
  isVerified(key: string): boolean {
    return !!this.data.tasks[key]?.verified_at;
  }

  phaseUnlocked(p: PlanPhase): boolean {
    return p.requires.every((r) => this.gatePassed(r));
  }

  openDefsFor(phase: string, taskKey?: string) {
    return this.data.defs.filter((d) => d.status !== 'closed' && d.phase_key === phase && (!taskKey || d.task_key === taskKey));
  }

  gatePassed(phaseId: string): boolean {
    if (this.gateCache.has(phaseId)) return this.gateCache.get(phaseId)!;
    const p = this.plan.byPhase[phaseId];
    const ok = !!p && this.phaseUnlocked(p) && p.tasks.every((t) => this.isVerified(t.key))
      && p.insps.every((i) => this.inspCleared(i.key)) && this.openDefsFor(phaseId).length === 0;
    this.gateCache.set(phaseId, ok);
    return ok;
  }

  gateStatus(p: PlanPhase): GateStatus {
    if (!this.phaseUnlocked(p)) return 'locked';
    if (this.gatePassed(p.id)) return 'passed';
    const tasksDone = p.tasks.every((t) => this.isVerified(t.key));
    const inspsDone = p.insps.every((i) => this.inspCleared(i.key));
    return tasksDone && inspsDone ? 'ready' : 'open';
  }

  taskBlockers(t: PlanTask): Blocker[] {
    const out: Blocker[] = [];
    const p = this.plan.byPhase[t.phase];
    for (const r of p.requires) if (!this.gatePassed(r)) out.push({ kind: 'phase', key: r, label: `${this.plan.byPhase[r].name} gate` });
    for (const a of t.after) if (!this.isVerified(a)) out.push({ kind: 'task', key: a, label: this.plan.tasks[a]?.name || a });
    for (const n of t.needs) if (!this.inspCleared(n)) out.push({ kind: 'insp', key: n, label: `${this.plan.insps[n]?.name || n} inspection` });
    return out;
  }

  checksDone(t: PlanTask): number {
    const c = this.data.tasks[t.key]?.checks || {};
    return t.checks.filter((_, i) => c[String(i)]).length;
  }

  photoOk(t: PlanTask): boolean {
    return !t.photo || (this.data.tasks[t.key]?.photos?.length || 0) > 0;
  }

  taskStatus(t: PlanTask): TaskStatus {
    if (this.isVerified(t.key)) return 'verified';
    if (this.taskBlockers(t).length) return 'locked';
    const done = this.checksDone(t);
    if (done === t.checks.length && this.photoOk(t)) return 'review';
    if (done > 0 || this.data.tasks[t.key]?.started_at || (this.data.tasks[t.key]?.photos?.length || 0) > 0) return 'active';
    return 'ready';
  }

  /** Why the Verify button is disabled, if it is. */
  verifyIssues(t: PlanTask): string[] {
    const out: string[] = [];
    const b = this.taskBlockers(t);
    if (b.length) out.push(`Waiting on ${b.map((x) => x.label).join(', ')}`);
    const done = this.checksDone(t);
    if (done < t.checks.length) out.push(`${t.checks.length - done} checklist item${t.checks.length - done === 1 ? '' : 's'} left`);
    if (!this.photoOk(t)) out.push('Photo evidence required');
    const defs = this.openDefsFor(t.phase, t.key);
    if (defs.length) out.push(`${defs.length} open deficienc${defs.length === 1 ? 'y' : 'ies'}`);
    return out;
  }

  inspReady(i: PlanInsp): boolean {
    return this.phaseUnlocked(this.plan.byPhase[i.phase]) && i.after.every((a) => this.isVerified(a));
  }

  linkedSheets(t: { topics: readonly string[] }): Sheet[] {
    return this.data.sheets.filter((s) => s.topics.some((x) => t.topics.includes(x as never)));
  }

  drawingNotes(t: { topics: readonly string[] }) {
    return this.data.sheets.flatMap((s) => (s.notes || [])
      .filter((n) => n.keep !== false && t.topics.includes(n.topic as never))
      .map((n) => ({ ...n, sheet: s })));
  }

  /** Sheets revised since this task was verified. */
  revisedSince(t: PlanTask): Sheet[] {
    const st = this.data.tasks[t.key];
    if (!st?.verified_at) return [];
    const revs = st.sheet_revs || {};
    return this.linkedSheets(t).filter((s) => s.id in revs && (revs[s.id] || '') !== (s.revision || ''));
  }

  phaseProgress(p: PlanPhase) {
    const done = p.tasks.filter((t) => this.isVerified(t.key)).length;
    return { done, total: p.tasks.length, pct: p.tasks.length ? Math.round((done / p.tasks.length) * 100) : 0 };
  }

  projectProgress() {
    const all = Object.values(this.plan.tasks);
    const done = all.filter((t) => this.isVerified(t.key)).length;
    return { done, total: all.length, pct: all.length ? Math.round((done / all.length) * 100) : 0 };
  }
}

/** Merge per-sheet AI findings into one feature set for the review step. */
export function aggregateFeatures(sheets: Sheet[], base: Features): Features {
  const f: Features = { ...base, cladding: [...base.cladding] };
  const seen: Partial<Record<keyof Features, boolean>> = {};
  const cladding = new Set<Features['cladding'][number]>();
  let anyCladding = false;
  for (const s of sheets) {
    const x = s.features || {};
    if (typeof x.storeys === 'number') { f.storeys = seen.storeys ? Math.max(f.storeys, x.storeys) : x.storeys; seen.storeys = true; }
    if (typeof x.bathrooms === 'number') { f.bathrooms = seen.bathrooms ? Math.max(f.bathrooms, x.bathrooms) : x.bathrooms; seen.bathrooms = true; }
    if (x.foundation) {
      const rank = { walkout: 4, basement: 3, crawl: 2, slab: 1 } as const;
      if (!seen.foundation || rank[x.foundation] > rank[f.foundation]) f.foundation = x.foundation;
      seen.foundation = true;
    }
    if (x.garage) {
      const rank = { attached: 3, detached: 2, none: 1 } as const;
      if (!seen.garage || rank[x.garage] > rank[f.garage]) f.garage = x.garage;
      seen.garage = true;
    }
    if (Array.isArray(x.cladding) && x.cladding.length) { anyCladding = true; x.cladding.forEach((c) => cladding.add(c)); }
    if (x.walls && !seen.walls) { f.walls = x.walls; seen.walls = true; }
    if (x.roof && !seen.roof) { f.roof = x.roof; seen.roof = true; }
    if (x.heating && !seen.heating) { f.heating = x.heating; seen.heating = true; }
    if (typeof x.hrv === 'boolean') { f.hrv = seen.hrv ? f.hrv || x.hrv : x.hrv; seen.hrv = true; }
    if (typeof x.gas === 'boolean') { f.gas = seen.gas ? f.gas || x.gas : x.gas; seen.gas = true; }
    if (x.fireplace && x.fireplace !== 'none') { f.fireplace = x.fireplace; seen.fireplace = true; }
    if (x.servicing === 'septic_well') { f.servicing = 'septic_well'; seen.servicing = true; }
  }
  if (anyCladding) f.cladding = [...cladding];
  if (!seen.gas && seen.heating) f.gas = f.heating === 'gas_forced' || f.heating === 'boiler' || f.fireplace === 'gas';
  return f;
}
