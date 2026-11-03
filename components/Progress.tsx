'use client';

// Timeline of completed work, photo gallery and Gantt chart, each grouped by phase.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ProjectStore } from '@/lib/useProject';
import type { PlanPhase } from '@/lib/template';
import {
  actualDates, addDays, completions, dayOf, daysBetween, photoItems, plannedDates, projectStart, TYPICAL_DAYS,
  type Completion, type PhotoItem, type Schedule,
} from '@/lib/progress';
import { BUCKET, supabase } from '@/lib/supabase';
import type { Nav } from './ProjectApp';
import { fmtDate, GatePill, Meter, SheetViewer, StoredImage, toast, toastError, today } from './ui';

const KIND_LABEL: Record<Completion['kind'], string> = { task: 'Task', insp: 'Inspection', def: 'Deficiency', gate: 'Gate' };
const KIND_TONE: Record<Completion['kind'], string> = { task: 'ok', insp: 'blue', def: 'warn', gate: 'ok' };

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' });
}

// ---- Timeline -----------------------------------------------------------

export function TimelineView({ store, nav }: { store: ProjectStore; nav: Nav }) {
  const { data, plan, engine } = store;
  const [order, setOrder] = useState<'phase' | 'latest'>('phase');
  const all = useMemo(() => (data && plan && engine ? completions(plan, data, engine) : []), [data, plan, engine]);
  if (!data || !plan || !engine) return null;

  const open = (c: Completion) => {
    if (c.kind === 'task') nav.openTask(c.key);
    else if (c.kind === 'insp') nav.openInsp(c.key);
    else if (c.kind === 'def') nav.go('deficiencies');
    else nav.go('flow', c.key);
  };
  const row = (c: Completion, showPhase: boolean) => (
    <button key={c.kind + c.key + c.at} className="item tl-item" onClick={() => open(c)}>
      <span className="tl-date small num"><b>{fmtDate(c.at)}</b><span className="muted">{fmtTime(c.at)}</span></span>
      <span className={`tl-dot ${KIND_TONE[c.kind]}`} aria-hidden="true" />
      <div className="grow">
        <div className="t">{c.title}</div>
        <div className="s">
          {[KIND_LABEL[c.kind], showPhase ? plan.byPhase[c.phase]?.short : null, c.detail, c.who ? `by ${c.who}` : null].filter(Boolean).join(' · ')}
        </div>
      </div>
    </button>
  );

  return (
    <div className="stack-lg">
      <div className="row between">
        <div className="stack" style={{ gap: 4 }}>
          <h1>Timeline</h1>
          <span className="small muted">{all.length} item{all.length === 1 ? '' : 's'} completed: tasks verified, inspections cleared, deficiencies closed and gates passed.</span>
        </div>
        <div className="seg" role="group" aria-label="Order">
          <button aria-pressed={order === 'phase'} onClick={() => setOrder('phase')}>By phase</button>
          <button aria-pressed={order === 'latest'} onClick={() => setOrder('latest')}>Latest first</button>
        </div>
      </div>

      {all.length === 0 && <div className="empty panel-box">Nothing completed yet. Verified tasks, passed inspections and closed deficiencies show up here as they happen.</div>}

      {all.length > 0 && order === 'latest' && <div className="list">{[...all].reverse().map((c) => row(c, true))}</div>}

      {all.length > 0 && order === 'phase' && plan.phases.map((p) => {
        const mine = all.filter((c) => c.phase === p.id);
        const prog = engine.phaseProgress(p);
        return (
          <section key={p.id} className="stack">
            <div className="section-head" style={{ margin: 0 }}>
              <h2>{p.name}</h2>
              <span className="row small muted num"><GatePill s={engine.gateStatus(p)} />{prog.done} of {prog.total} tasks</span>
            </div>
            {mine.length ? <div className="list">{mine.map((c) => row(c, false))}</div> : <p className="small muted">Nothing completed in this phase yet.</p>}
          </section>
        );
      })}
    </div>
  );
}

// ---- Photos -------------------------------------------------------------

export function PhotosView({ store, nav }: { store: ProjectStore; nav: Nav }) {
  const { data, plan } = store;
  const [phase, setPhase] = useState<string>('all');
  const [view, setView] = useState<PhotoItem | null>(null);
  const [dates, setDates] = useState<Record<string, string>>({});
  const items = useMemo(() => (data && plan ? photoItems(plan, data) : []), [data, plan]);

  // Photos don't store a date, so read it from storage (one listing per task or deficiency folder).
  const folders = useMemo(() => [...new Set(items.map((i) => i.path.slice(0, i.path.lastIndexOf('/'))))], [items]);
  useEffect(() => {
    let live = true;
    Promise.all(folders.map(async (f) => {
      const { data: files } = await supabase().storage.from(BUCKET).list(f, { limit: 1000 });
      return (files || []).map((x) => [`${f}/${x.name}`, x.created_at] as const);
    })).then((rows) => { if (live) setDates(Object.fromEntries(rows.flat().filter(([, at]) => !!at)) as Record<string, string>); });
    return () => { live = false; };
  }, [folders.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  async function del(i: PhotoItem) {
    if (!window.confirm('Delete this photo? This can\'t be undone.')) return;
    try {
      await (i.kind === 'task' ? store.deleteTaskPhoto(i.key, i.path) : store.deleteDefPhoto(i.key, i.path));
      setView(null);
      toast('Photo deleted.');
    } catch (e) { toastError(e); }
  }

  if (!data || !plan) return null;
  const dated = items.map((i) => ({ ...i, at: i.at || dates[i.path] || null }))
    .sort((a, b) => (a.at || '9').localeCompare(b.at || '9'));
  const phases = plan.phases.filter((p) => dated.some((i) => i.phase === p.id));
  const shown = phase === 'all' ? phases : phases.filter((p) => p.id === phase);

  return (
    <div className="stack-lg">
      <div className="stack" style={{ gap: 4 }}>
        <h1>Photos</h1>
        <span className="small muted">{items.length} photo{items.length === 1 ? '' : 's'} from tasks and deficiencies, sorted by phase. Add photos from any task.</span>
      </div>

      {phases.length > 1 && (
        <div className="topic-chips" role="group" aria-label="Phase">
          <button className={`chip ${phase === 'all' ? 'on' : ''}`} onClick={() => setPhase('all')}>All phases</button>
          {phases.map((p) => (
            <button key={p.id} className={`chip ${phase === p.id ? 'on' : ''}`} onClick={() => setPhase(p.id)}>
              {p.short} <span className="num">{dated.filter((i) => i.phase === p.id).length}</span>
            </button>
          ))}
        </div>
      )}

      {items.length === 0 && <div className="empty panel-box">No photos yet. Open a task and tap Add photo; it will show here under that task&apos;s phase.</div>}

      {shown.map((p) => {
        const mine = dated.filter((i) => i.phase === p.id);
        return (
          <section key={p.id} className="stack">
            <div className="section-head" style={{ margin: 0 }}>
              <h2>{p.name}</h2>
              <span className="small muted num">{mine.length} photo{mine.length === 1 ? '' : 's'}</span>
            </div>
            <div className="gallery">
              {mine.map((i) => (
                <figure key={i.path} className="shot">
                  <button type="button" onClick={() => setView(i)} aria-label={`Open photo: ${i.title}`}>
                    <StoredImage path={i.path} alt={i.title} />
                  </button>
                  <figcaption>
                    <button type="button" className="btn-link small" onClick={() => (i.kind === 'task' ? nav.openTask(i.key) : nav.go('deficiencies'))}>{i.title}</button>
                    {i.at && <span className="small muted num">{fmtDate(i.at)}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        );
      })}

      {view && (
        <SheetViewer path={view.path} title={`${view.title}${view.at ? ` · ${fmtDate(view.at)}` : ''}`} onClose={() => setView(null)}
          actions={<button className="btn btn-sm btn-danger" onClick={() => void del(view)}>Delete</button>} />
      )}
    </div>
  );
}

// ---- Gantt chart --------------------------------------------------------

const DAY_PX = { week: 22, month: 7 } as const;
const LATE = (end: string, done: boolean) => !done && end < today();

export function GanttView({ store, nav }: { store: ProjectStore; nav: Nav }) {
  const { data, plan, engine } = store;
  const [scale, setScale] = useState<keyof typeof DAY_PX>('month');
  const [edit, setEdit] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  // Open with today in view, a little in from the left.
  useEffect(() => {
    const g = box.current, t = g?.querySelector<HTMLElement>('.g-today'), l = g?.querySelector<HTMLElement>('.g-head .g-label');
    if (g && t && l) g.scrollLeft = Math.max(0, t.offsetLeft - (g.clientWidth - l.offsetWidth) / 4);
  }, [scale, !!data]);
  if (!data || !plan || !engine) return null;

  const planned = plannedDates(plan, data);
  const now = today();
  const rows = plan.phases.map((p) => ({ p, plan: planned[p.id], actual: actualDates(p, data, engine), prog: engine.phaseProgress(p), gate: engine.gateStatus(p) }));
  const insps = plan.phases.flatMap((p) => p.insps.map((i) => ({ p: p.id, i, st: data.insps[i.key] })))
    .map(({ p, i, st }) => ({ p, name: i.name, status: st?.status || 'pending', day: st?.status === 'passed' || st?.status === 'na' ? dayOf(st.updated_at) : st?.scheduled_on || null }))
    .flatMap((m) => (m.day ? [{ ...m, day: m.day }] : []));

  const days = [...rows.flatMap((r) => [r.plan.start, r.plan.end, r.actual?.start, r.actual?.end]), now].filter((x): x is string => !!x);
  // Start on the 1st of a month so the month labels never crowd each other.
  const from = addDays(days.reduce((m, x) => (x < m ? x : m)), -3).slice(0, 8) + '01';
  const to = addDays(days.reduce((m, x) => (x > m ? x : m)), 7);
  const px = DAY_PX[scale];
  const width = (daysBetween(from, to) + 1) * px;
  const x = (day: string) => daysBetween(from, day) * px;
  const span = (a: string, b: string) => ({ left: x(a), width: Math.max(px, (daysBetween(a, b) + 1) * px) });

  // Header ticks: months, plus week starts in week view.
  const ticks: Array<{ day: string; label: string; major: boolean }> = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const dt = new Date(d + 'T12:00:00');
    if (dt.getDate() === 1 || d === from) ticks.push({ day: d, label: dt.toLocaleDateString('en-CA', { month: 'short', year: dt.getMonth() === 0 || d === from ? 'numeric' : undefined }), major: true });
    else if (scale === 'week' && dt.getDay() === 1) ticks.push({ day: d, label: String(dt.getDate()), major: false });
  }

  async function save(schedule: Schedule, msg: string) {
    setBusy(true);
    try { await store.updateProject({ schedule }); toast(msg); setEdit(null); } catch (e) { toastError(e); } finally { setBusy(false); }
  }
  const sched = data.project.schedule || {};
  const startEdit = (p: PlanPhase) => { setEdit(p.id); setDraft({ start: planned[p.id].start, end: planned[p.id].end }); };
  const editing = edit ? plan.byPhase[edit] : null;
  const late = rows.filter((r) => LATE(r.plan.end, r.gate === 'passed'));

  return (
    <div className="stack-lg">
      <div className="row between">
        <div className="stack" style={{ gap: 4 }}>
          <h1>Gantt chart</h1>
          <span className="small muted">Planned dates per phase against what&apos;s actually happened. Tap a phase to change its dates; later phases move with it.</span>
        </div>
        <div className="seg" role="group" aria-label="Zoom">
          <button aria-pressed={scale === 'week'} onClick={() => setScale('week')}>Weeks</button>
          <button aria-pressed={scale === 'month'} onClick={() => setScale('month')}>Months</button>
        </div>
      </div>

      <div className="row">
        <label className="field" style={{ maxWidth: 200 }}>
          <span>Project start</span>
          <input type="date" value={projectStart(data)} disabled={busy}
            onChange={(e) => { if (e.target.value) void save({ ...sched, start: e.target.value }, 'Start date saved.'); }} />
        </label>
        {late.length > 0 && <p className="notice warn small grow">{late.length} phase{late.length === 1 ? ' is' : 's are'} past the planned end: {late.map((r) => r.p.short).join(', ')}.</p>}
      </div>

      <div className="gantt" ref={box} style={{ ['--gantt-w' as string]: `${width}px` }}>
        <div className="g-row g-head">
          <div className="g-label label">Phase</div>
          <div className="g-track">
            {ticks.map((t) => <span key={t.day} className={`g-tick ${t.major ? 'major' : ''}`} style={{ left: x(t.day) }}>{t.label}</span>)}
          </div>
        </div>
        {rows.map((r) => {
          const done = r.gate === 'passed';
          const tone = done ? 'ok' : LATE(r.plan.end, done) ? 'warn' : 'go';
          return (
            <div key={r.p.id} className={`g-row ${edit === r.p.id ? 'on' : ''}`}>
              <button className="g-label" onClick={() => startEdit(r.p)}>
                <span className="t">{r.p.short}</span>
                <span className="small muted num">{r.prog.pct}%</span>
              </button>
              <div className="g-track" onClick={() => startEdit(r.p)}>
                {ticks.filter((t) => t.major).map((t) => <i key={t.day} className="g-grid" style={{ left: x(t.day) }} />)}
                <span className={`g-bar ${tone}`} style={span(r.plan.start, r.plan.end)} title={`Planned ${fmtDate(r.plan.start)} to ${fmtDate(r.plan.end)}`}>
                  <i style={{ width: `${r.prog.pct}%` }} />
                  <em>{r.prog.pct}%</em>
                </span>
                {r.actual && <span className="g-actual" style={span(r.actual.start, r.actual.end || now)} title={`Actual ${fmtDate(r.actual.start)} to ${r.actual.end ? fmtDate(r.actual.end) : 'now'}`} />}
                {insps.filter((m) => m.p === r.p.id).map((m) => (
                  <span key={m.name} className={`g-insp ${m.status === 'passed' || m.status === 'na' ? 'ok' : ''}`} style={{ left: x(m.day) + px / 2 }} title={`${m.name}: ${m.status === 'passed' ? 'passed' : m.status === 'na' ? 'not required' : 'scheduled'} ${fmtDate(m.day)}`} />
                ))}
                <i className="g-today" style={{ left: x(now) + px / 2 }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="row small muted gantt-key">
        <span><i className="k-bar" /> Planned (fill = tasks verified)</span>
        <span><i className="k-actual" /> Actual work</span>
        <span><i className="k-insp" /> Inspection</span>
        <span><i className="k-today" /> Today</span>
      </div>

      {editing && (
        <section className="panel-box stack">
          <div className="section-head" style={{ margin: 0 }}>
            <h2>{editing.name}</h2>
            <button className="btn-link" onClick={() => nav.go('flow', editing.id)}>Open phase</button>
          </div>
          <div className="row">
            <label className="field"><span>Planned start</span><input type="date" value={draft.start} onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))} /></label>
            <label className="field"><span>Planned finish</span><input type="date" value={draft.end} min={draft.start} onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))} /></label>
            {draft.start && draft.end && <span className="small muted num">{daysBetween(draft.start, draft.end) + 1} days</span>}
          </div>
          {(() => {
            const a = rows.find((r) => r.p.id === editing.id)?.actual;
            return a ? <p className="small muted">Actual: started {fmtDate(a.start)}{a.end ? `, finished ${fmtDate(a.end)}` : ', still in progress'}.</p> : null;
          })()}
          <div className="row">
            <button className="btn btn-primary" disabled={busy || !draft.start || !draft.end || draft.end < draft.start}
              onClick={() => void save({ ...sched, phases: { ...(sched.phases || {}), [editing.id]: draft } }, 'Dates saved.')}>Save dates</button>
            {planned[editing.id].custom && (
              <button className="btn" disabled={busy} onClick={() => {
                const rest = { ...(sched.phases || {}) };
                delete rest[editing.id];
                void save({ ...sched, phases: rest }, `Back to the typical ${TYPICAL_DAYS[editing.id] || 14} days.`);
              }}>Use typical length</button>
            )}
            <button className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
          </div>
        </section>
      )}

      <div className="list">
        {rows.map((r) => (
          <button key={r.p.id} className="item" onClick={() => startEdit(r.p)}>
            <div className="grow">
              <div className="t">{r.p.name}</div>
              <div className="s num">
                Planned {fmtDate(r.plan.start)} – {fmtDate(r.plan.end)}{r.plan.custom ? '' : ' (typical)'}
                {r.actual && ` · Actual ${fmtDate(r.actual.start)} – ${r.actual.end ? fmtDate(r.actual.end) : 'now'}`}
              </div>
              <Meter pct={r.prog.pct} />
            </div>
            {LATE(r.plan.end, r.gate === 'passed')
              ? <span className="pill warn">{daysBetween(r.plan.end, now)} days late</span>
              : !r.actual && r.gate !== 'passed' ? <span className="pill lock">Not started</span> : <GatePill s={r.gate} />}
          </button>
        ))}
      </div>
    </div>
  );
}
