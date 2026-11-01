'use client';

import type { ProjectStore } from '@/lib/useProject';
import type { Nav } from './ProjectApp';
import { fmtDate, GatePill, InspPill, Meter, TaskPill } from './ui';

export function Today({ store, nav }: { store: ProjectStore; nav: Nav }) {
  const { data, plan, engine } = store;
  if (!data || !plan || !engine) return null;
  const prog = engine.projectProgress();
  const tasks = Object.values(plan.tasks);
  const actionable = tasks
    .map((t) => ({ t, s: engine.taskStatus(t) }))
    .filter((x) => x.s === 'review' || x.s === 'active' || x.s === 'ready');
  const order = { review: 0, active: 1, ready: 2 } as Record<string, number>;
  actionable.sort((a, b) => order[a.s] - order[b.s]);

  const insps = Object.values(plan.insps);
  const toRequest = insps.filter((i) => engine.inspStatus(i.key) === 'pending' && engine.inspReady(i));
  const upcoming = insps.filter((i) => ['requested', 'scheduled', 'failed'].includes(engine.inspStatus(i.key)));
  const openDefs = data.defs.filter((d) => d.status !== 'closed');
  const revised = tasks.flatMap((t) => engine.revisedSince(t).map((s) => ({ t, s })));
  const openQs = data.notes.filter((n) => n.kind === 'question' && !n.answer);
  // Nothing is locked, so "active" means work has started, plus the earliest phase not yet passed.
  const notPassed = plan.phases.filter((p) => engine.gateStatus(p) !== 'passed');
  const started = (p: (typeof plan.phases)[number]) =>
    p.tasks.some((t) => engine.taskStatus(t) !== 'ready') || p.insps.some((i) => engine.inspStatus(i.key) !== 'pending');
  const current = notPassed.filter((p, i) => i === 0 || started(p));

  return (
    <div className="stack-lg">
      <div className="stack">
        <span className="label">{data.project.address || data.project.municipality || 'Project'}</span>
        <h1>Today on site</h1>
      </div>

      <div className="stats">
        <div className="stat"><span className="label">Complete</span><b>{prog.pct}%</b><Meter pct={prog.pct} /><span className="small muted num">{prog.done} of {prog.total} tasks verified</span></div>
        <div className="stat"><span className="label">Ready to work</span><b>{actionable.length}</b><span className="small muted">tasks not yet complete</span></div>
        <div className={`stat ${openDefs.length ? 'alert' : ''}`}><span className="label">Open deficiencies</span><b>{openDefs.length}</b><span className="small muted">must close before gates pass</span></div>
        <div className="stat"><span className="label">Inspections</span><b>{toRequest.length + upcoming.length}</b><span className="small muted">{toRequest.length} to book · {upcoming.length} in progress</span></div>
      </div>

      {revised.length > 0 && (
        <section className="stack">
          <h2>Drawings revised after sign-off</h2>
          <div className="list">
            {revised.map(({ t, s }) => (
              <button key={t.key + s.id} className="item" onClick={() => nav.openTask(t.key)}>
                <span className="pill bad">Recheck</span>
                <div className="grow"><div className="t">{t.name}</div><div className="s">Sheet <span className="mono">{s.number}</span> is now rev {s.revision || '—'}; task was verified against rev {(data.tasks[t.key]?.sheet_revs || {})[s.id] || '—'}</div></div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="stack">
        <div className="section-head"><h2>Active phases</h2><button className="btn-link" onClick={() => nav.go('flow')}>Full plan</button></div>
        <div className="list">
          {current.length === 0 && <div className="empty">Every phase has passed its gate.</div>}
          {current.map((p) => {
            const pp = engine.phaseProgress(p);
            return (
              <button key={p.id} className="item" onClick={() => nav.go('flow', p.id)}>
                <div className="grow stack" style={{ gap: 6 }}>
                  <div className="row between"><span className="t">{p.name}</span><GatePill s={engine.gateStatus(p)} /></div>
                  <Meter pct={pp.pct} />
                  <span className="s num">{pp.done} of {pp.total} tasks verified</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {toRequest.length > 0 && (
        <section className="stack">
          <h2>Book these inspections</h2>
          <div className="list">
            {toRequest.map((i) => (
              <button key={i.key} className="item" onClick={() => nav.openInsp(i.key)}>
                <span className="pill go">{i.authority}</span>
                <div className="grow"><div className="t">{i.name}</div><div className="s">{plan.byPhase[i.phase].name} · prerequisites verified</div></div>
              </button>
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="stack">
          <h2>Inspections in progress</h2>
          <div className="list">
            {upcoming.map((i) => {
              const r = data.insps[i.key];
              return (
                <button key={i.key} className="item" onClick={() => nav.openInsp(i.key)}>
                  <InspPill s={engine.inspStatus(i.key)} />
                  <div className="grow"><div className="t">{i.name}</div><div className="s">{i.authority}{r?.scheduled_on ? ` · ${fmtDate(r.scheduled_on)}` : r?.requested_on ? ` · requested ${fmtDate(r.requested_on)}` : ''}</div></div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="stack">
        <h2>Next up</h2>
        <div className="list">
          {actionable.length === 0 && <div className="empty">Every task is complete.</div>}
          {actionable.slice(0, 12).map(({ t, s }) => (
            <button key={t.key} className="item" onClick={() => nav.openTask(t.key)}>
              <TaskPill s={s} />
              <div className="grow"><div className="t">{t.name}</div><div className="s">{t.trade} · {plan.byPhase[t.phase].short} · <span className="num">{engine.checksDone(t)}/{t.checks.length}</span> checks</div></div>
            </button>
          ))}
        </div>
      </section>

      {(openDefs.length > 0 || openQs.length > 0) && (
        <div className="row">
          {openDefs.length > 0 && <button className="btn" onClick={() => nav.go('deficiencies')}>{openDefs.length} open deficienc{openDefs.length === 1 ? 'y' : 'ies'}</button>}
          {openQs.length > 0 && <button className="btn" onClick={() => nav.go('notes')}>{openQs.length} unanswered question{openQs.length === 1 ? '' : 's'}</button>}
        </div>
      )}
    </div>
  );
}
