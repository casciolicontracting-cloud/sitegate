'use client';

import { FLOW_ROWS, type PlanPhase } from '@/lib/template';
import type { ProjectStore } from '@/lib/useProject';
import type { Nav } from './ProjectApp';
import { GatePill, InspPill, Meter, TaskPill } from './ui';

export function FlowChart({ store, nav }: { store: ProjectStore; nav: Nav }) {
  const { plan, engine } = store;
  if (!plan || !engine) return null;
  const splitStart = FLOW_ROWS.findIndex((r) => r.length > 1);
  const laneId = FLOW_ROWS[splitStart][1];
  const mergeRow = FLOW_ROWS.findIndex((r, i) => i > splitStart && r.some((id) => plan.byPhase[id]?.requires.includes(laneId)));
  const lastRow = FLOW_ROWS.length - 1;

  const node = (p: PlanPhase, cls: string, style?: React.CSSProperties) => {
    const g = engine.gateStatus(p);
    const pp = engine.phaseProgress(p);
    const insp = p.insps.length;
    const inspDone = p.insps.filter((i) => engine.inspCleared(i.key)).length;
    return (
      <button key={p.id} className={`node ${g} ${cls}`} style={style} onClick={() => nav.go('flow', p.id)}>
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <h3>{p.name}</h3>
        </div>
        <Meter pct={pp.pct} />
        <div className="meta">
          <span className="num">{pp.done}/{pp.total} tasks{insp ? ` · ${inspDone}/${insp} insp.` : ''}</span>
          <GatePill s={g} />
        </div>
        {p.id === laneId && <span className="lane-note">Runs alongside the interior once the envelope gate passes</span>}
      </button>
    );
  };

  return (
    <div className="stack-lg">
      <div className="stack">
        <h1>Construction plan</h1>
        <p className="muted" style={{ maxWidth: '65ch' }}>
          Each phase ends at a gate. A gate passes when every task is verified, every inspection is passed or marked not required,
          and no deficiencies are open. Passing a gate unlocks the phases that depend on it.
        </p>
      </div>
      <div className="flow" style={{ gridTemplateRows: `repeat(${FLOW_ROWS.length}, auto)` }}>
        {FLOW_ROWS.flatMap((row, r) => row.map((id) => {
          const p = plan.byPhase[id];
          if (!p) return null;
          const last = r === lastRow ? ' last' : '';
          if (id === laneId) return node(p, 'lane', { gridRow: `${r + 1} / ${mergeRow + 1}`, gridColumn: 2 });
          const inSplit = r >= splitStart && r < mergeRow;
          return node(p, (inSplit ? 'main' : 'span2') + last, { gridRow: r + 1, gridColumn: inSplit ? 1 : '1 / -1' });
        }))}
      </div>
    </div>
  );
}

export function PhaseView({ store, nav, phaseId }: { store: ProjectStore; nav: Nav; phaseId: string }) {
  const { plan, engine, data } = store;
  if (!plan || !engine || !data) return null;
  const p = plan.byPhase[phaseId];
  const g = engine.gateStatus(p);
  const pp = engine.phaseProgress(p);
  const defs = engine.openDefsFor(p.id);
  const dependents = plan.phases.filter((x) => x.requires.includes(p.id));
  const tradeNotes = data.notes.filter((n) => n.phase_key === p.id);

  return (
    <div className="stack-lg">
      <div className="phase-head">
        <button className="btn-link" style={{ alignSelf: 'flex-start' }} onClick={() => nav.go('flow')}>← Construction plan</button>
        <div className="row between"><h1>{p.name}</h1><GatePill s={g} /></div>
        <p className="muted">{p.summary}</p>
        <Meter pct={pp.pct} />
        {g === 'locked' && (
          <p className="notice warn">Locked until {p.requires.filter((r) => !engine.gatePassed(r)).map((r) => plan.byPhase[r].name).join(' and ')} pass{p.requires.length === 1 ? 'es' : ''} its gate.</p>
        )}
      </div>

      <section className="stack">
        <h2>Sequence</h2>
        <div className="steps">
          {p.items.map((it, idx) => {
            if (it.kind === 'task') {
              const s = engine.taskStatus(it);
              const revised = engine.revisedSince(it).length > 0;
              const dfs = engine.openDefsFor(p.id, it.key).length;
              return (
                <div className="step" key={it.key}>
                  <span className={`dot ${s}`}>{s === 'verified' ? '✓' : idx + 1}</span>
                  <button className="step-card" onClick={() => nav.openTask(it.key)}>
                    <div className="row between"><strong>{it.name}</strong><TaskPill s={s} /></div>
                    <span className="small muted">
                      {it.trade} · <span className="num">{engine.checksDone(it)}/{it.checks.length}</span> checks
                      {it.photo ? ' · photo required' : ''}
                      {engine.linkedSheets(it).length ? ` · ${engine.linkedSheets(it).length} sheet${engine.linkedSheets(it).length === 1 ? '' : 's'}` : ''}
                    </span>
                    {s === 'locked' && <span className="small muted">Waiting on {engine.taskBlockers(it).map((b) => b.label).join(', ')}</span>}
                    {(revised || dfs > 0) && (
                      <span className="row" style={{ gap: 6 }}>
                        {revised && <span className="pill bad">Drawing revised</span>}
                        {dfs > 0 && <span className="pill bad">{dfs} deficienc{dfs === 1 ? 'y' : 'ies'}</span>}
                      </span>
                    )}
                  </button>
                </div>
              );
            }
            const st = engine.inspStatus(it.key);
            return (
              <div className="step" key={it.key}>
                <span className={`dot insp ${st}`}><span>{st === 'passed' ? '✓' : '!'}</span></span>
                <button className="step-card insp" onClick={() => nav.openInsp(it.key)}>
                  <div className="row between"><strong>Hold point: {it.name}</strong><InspPill s={st} /></div>
                  <span className="small muted">{it.authority} inspection{st === 'pending' && engine.inspReady(it) ? ' · ready to book' : ''}</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="gate-box">
        <div className="row between"><h3><span className="gate-mark" />Gate: {p.short} complete</h3><GatePill s={g} /></div>
        <ul className="small">
          <li><Tick ok={pp.done === pp.total} /> All {pp.total} tasks verified <span className="muted num">({pp.done} done)</span></li>
          {p.insps.map((i) => <li key={i.key}><Tick ok={engine.inspCleared(i.key)} /> {i.name} — {i.authority}</li>)}
          <li><Tick ok={defs.length === 0} /> No open deficiencies {defs.length ? <span className="muted num">({defs.length} open)</span> : null}</li>
        </ul>
        {dependents.length > 0 && <p className="small muted">Passing this gate unlocks: {dependents.map((d) => d.name).join(', ')}.</p>}
      </section>

      {tradeNotes.length > 0 && (
        <section className="stack">
          <h2>Trade notes in this phase</h2>
          <div className="list">
            {tradeNotes.map((n) => (
              <button key={n.id} className="item" onClick={() => n.task_key && plan.tasks[n.task_key] && nav.openTask(n.task_key)}>
                <span className={`pill ${n.kind === 'question' ? (n.answer ? 'ok' : 'warn') : 'blue'}`}>{n.kind === 'question' ? 'Question' : 'Note'}</span>
                <div className="grow"><div className="t" style={{ fontWeight: 500 }}>{n.body}</div><div className="s">{n.trade}{n.task_key && plan.tasks[n.task_key] ? ` · ${plan.tasks[n.task_key].name}` : ''}</div></div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Tick({ ok }: { ok: boolean }) {
  return <span aria-label={ok ? 'Done' : 'Not done'} style={{ color: ok ? 'var(--ok)' : 'var(--lock)', fontWeight: 700, width: 14, display: 'inline-block' }}>{ok ? '✓' : '○'}</span>;
}
