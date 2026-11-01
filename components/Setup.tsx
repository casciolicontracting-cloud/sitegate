'use client';

// Project onboarding: 1) upload the drawing set, 2) Claude reads each sheet,
// 3) the supervisor reviews the sheet register and house features, 4) the plan
// is generated. Nothing from the drawings is used until a person confirms it.

import { useEffect, useMemo, useRef, useState } from 'react';
import { renderFile } from '@/lib/pdf';
import { aiEnabled, analyzeSheet } from '@/lib/analyze';
import { newId, uploadFile } from '@/lib/supabase';
import { aggregateFeatures } from '@/lib/status';
import { buildPlan, DEFAULT_FEATURES, normalizeFeatures, TOPICS, TOPIC_LABEL, type Features } from '@/lib/template';
import type { ProjectStore } from '@/lib/useProject';
import type { Sheet } from '@/lib/types';
import { finalizeRooms, RoomsEditor } from './Rooms';
import { SheetViewer, StoredImage, toast, toastError } from './ui';

const DISCIPLINES = ['Architectural', 'Structural', 'Mechanical', 'Electrical', 'Plumbing', 'Site / civil', 'Energy', 'Other'];

export function Setup({ store }: { store: ProjectStore }) {
  const p = store.data!.project;
  return (
    <div className="stack-lg">
      <div className="stack">
        <div className="steps-bar">
          <span className={p.stage === 'drawings' ? 'on' : ''}>1 · Upload &amp; read drawings</span>
          <span className={p.stage === 'review' ? 'on' : ''}>2 · Review &amp; confirm</span>
          <span>3 · Construction plan</span>
        </div>
      </div>
      {p.stage === 'drawings' ? <UploadStep store={store} /> : <ReviewStep store={store} />}
    </div>
  );
}

// ---------------------------------------------------------------------------

function UploadStep({ store }: { store: ProjectStore }) {
  const { data } = store;
  const pid = data!.project.id;
  const sheets = data!.sheets;
  const [progress, setProgress] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [aiOn, setAiOn] = useState<boolean | null>(null);
  const [running, setRunning] = useState(false);
  const stopRef = useRef(false);
  const blobs = useRef(new Map<string, Blob>());
  const [view, setView] = useState<Sheet | null>(null);

  useEffect(() => {
    aiEnabled().then(setAiOn);
  }, []);

  async function ingest(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => /pdf|image\//.test(f.type) || /\.(pdf|png|jpe?g|webp)$/i.test(f.name));
    if (!list.length) return toast('Choose PDF or image files of the drawings.', true);
    let sort = sheets.reduce((m, s) => Math.max(m, s.sort), 0);
    try {
      for (const file of list) {
        setProgress(`Reading ${file.name}…`);
        const pages = await renderFile(file, (n, t) => setProgress(`Rendering ${file.name}: page ${n} of ${t}`));
        for (const pg of pages) {
          const id = newId();
          setProgress(`Uploading ${file.name} page ${pg.page}…`);
          const path = await uploadFile(`${pid}/sheets/${id}.jpg`, pg.image);
          blobs.current.set(id, pg.image);
          await store.upsertSheet({
            id, sort: ++sort, file_name: file.name, page: pg.page, image_path: path, text_layer: pg.text || null,
            number: '', title: '', discipline: '', revision: '', topics: [], notes: [], questions: [], features: {}, status: 'new',
          } as Partial<Sheet> & { id: string });
        }
      }
      store.log('drawings_uploaded', { files: list.map((f) => f.name) });
      toast(`Added ${list.length} file${list.length === 1 ? '' : 's'}.`);
    } catch (e) {
      toastError(e);
    } finally {
      setProgress(null);
    }
  }

  async function analyzeAll(only?: Sheet[]) {
    const todo = (only || sheets).filter((s) => s.status !== 'analyzed' && s.status !== 'manual');
    if (!todo.length) return;
    stopRef.current = false;
    setRunning(true);
    let done = 0;
    for (const s of todo) {
      if (stopRef.current) break;
      setProgress(`Claude is reading sheet ${done + 1} of ${todo.length}${s.file_name ? ` (${s.file_name} p.${s.page})` : ''}…`);
      store.setSheetLocal({ ...s, status: 'analyzing' });
      try {
        store.setSheetLocal(await analyzeSheet(s, blobs.current.get(s.id)));
      } catch (e) {
        store.setSheetLocal({ ...s, status: 'failed' });
        toastError(e);
        if (String(e).includes('not set up') || String(e).includes('401')) break;
      }
      done++;
    }
    setRunning(false);
    setProgress(null);
  }

  const counts = useMemo(() => ({
    total: sheets.length,
    analyzed: sheets.filter((s) => s.status === 'analyzed').length,
    failed: sheets.filter((s) => s.status === 'failed').length,
    pending: sheets.filter((s) => s.status === 'new' || s.status === 'failed').length,
  }), [sheets]);

  return (
    <div className="stack-lg">
      <div className="stack">
        <h1>Upload the drawing set</h1>
        <p className="muted" style={{ maxWidth: '65ch' }}>
          Add the permit drawings: architectural, structural, mechanical, site and grading. PDFs are split into sheets.
          Claude then reads each sheet for its number, revision, specifications and features of the house, and you confirm everything before the plan is built.
        </p>
      </div>

      <label
        className={`drop ${over ? 'over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (!progress) ingest(e.dataTransfer.files); }}
      >
        <strong>Drop drawing PDFs or images here</strong>
        <span className="muted small">or</span>
        <span className="btn btn-primary">Choose files</span>
        <input id="drawing-files" type="file" accept="application/pdf,image/*" multiple hidden disabled={!!progress}
          onChange={(e) => { if (e.target.files) ingest(e.target.files); e.target.value = ''; }} />
        {progress && <span className="notice info">{progress}</span>}
      </label>

      {sheets.length > 0 && (
        <div className="stack">
          <div className="section-head">
            <h2>{counts.total} sheet{counts.total === 1 ? '' : 's'} <span className="muted small num">· {counts.analyzed} read</span></h2>
            <div className="row">
              {aiOn && !running && counts.pending > 0 && (
                <button className="btn btn-primary" onClick={() => analyzeAll()}>Read {counts.pending} sheet{counts.pending === 1 ? '' : 's'} with Claude</button>
              )}
              {running && <button className="btn" onClick={() => { stopRef.current = true; }}>Stop after this sheet</button>}
              <button className="btn" disabled={running || !!progress} onClick={() => store.updateProject({ stage: 'review' }).catch(toastError)}>
                Continue to review
              </button>
            </div>
          </div>
          {aiOn === false && (
            <p className="notice warn">AI drawing analysis isn&apos;t switched on for this deployment, so you&apos;ll enter sheet details in the next step. To turn it on, add an <span className="mono">ANTHROPIC_API_KEY</span> in the Vercel project settings.</p>
          )}
          <div className="sheets">
            {sheets.map((s) => (
              <div className="sheet" key={s.id}>
                <button className="img" onClick={() => setView(s)} aria-label={`Open ${s.number || s.file_name}`}>
                  <StoredImage path={s.image_path} alt={s.title || s.file_name || 'Sheet'} />
                </button>
                <div className="body">
                  <div className="row between">
                    <strong className="mono">{s.number || '—'}</strong>
                    <SheetStatus s={s} />
                  </div>
                  <span className="small">{s.title || <span className="muted">{s.file_name} · page {s.page}</span>}</span>
                  {s.revision && <span className="small muted">Rev {s.revision}</span>}
                  <div className="row">
                    {s.status === 'failed' && aiOn && !running && <button className="btn btn-sm" onClick={() => analyzeAll([s])}>Retry</button>}
                    <button className="btn btn-sm btn-ghost" disabled={running} onClick={() => store.deleteSheet(s.id).catch(toastError)}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {view && <SheetViewer path={view.image_path} title={view.number ? `${view.number} ${view.title}` : view.file_name || 'Sheet'} onClose={() => setView(null)} />}
    </div>
  );
}

function SheetStatus({ s }: { s: Sheet }) {
  const map = { new: ['lock', 'Not read'], analyzing: ['go', 'Reading…'], analyzed: ['ok', 'Read'], failed: ['bad', 'Failed'], manual: ['blue', 'Manual'] } as const;
  const [tone, label] = map[s.status];
  return <span className={`pill ${tone}`}>{label}</span>;
}

// ---------------------------------------------------------------------------

function ReviewStep({ store }: { store: ProjectStore }) {
  const { data } = store;
  const sheets = data!.sheets;
  const suggested = useMemo(() => aggregateFeatures(sheets, normalizeFeatures({ ...DEFAULT_FEATURES, ...data!.project.features })), [sheets, data]);
  const [f, setF] = useState<Features>(suggested);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<Sheet | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) => setExpanded((cur) => { const n = new Set(cur); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const questions = sheets.flatMap((s) => (s.questions || []).map((q) => ({ q, s })));
  const [keepQ, setKeepQ] = useState<Record<string, boolean>>(() => Object.fromEntries(questions.map((x, i) => [String(i), true])));
  const plan = useMemo(() => buildPlan(f), [f]);
  const taskCount = Object.keys(plan.tasks).length;
  const inspCount = Object.keys(plan.insps).length;

  const saveSheet = (s: Sheet, patch: Partial<Sheet>) => store.upsertSheet({ ...s, ...patch }).catch(toastError);

  async function generate() {
    setBusy(true);
    try {
      const rooms = finalizeRooms(f.rooms);
      const baths = rooms.filter((r) => r.kind === 'bathroom').length;
      await store.updateProject({ features: { ...f, rooms, bathrooms: baths || f.bathrooms }, stage: 'active' });
      const keep = questions.filter((_, i) => keepQ[String(i)]);
      for (const { q, s } of keep) {
        await store.addNote({ kind: 'question', body: q, task_key: 'pre-drawings', phase_key: 'pre', trade: 'Designer / architect',
          answer: null }).catch(() => {});
        void s;
      }
      store.log('plan_generated', { features: f, tasks: taskCount, inspections: inspCount });
      toast('Construction plan created.');
    } catch (e) {
      toastError(e);
      setBusy(false);
    }
  }

  const sel = <K extends keyof Features>(k: K, opts: Array<[Features[K], string]>) => (
    <div className="toggles" role="group">
      {opts.map(([v, l]) => (
        <button key={String(v)} type="button" aria-pressed={f[k] === v} onClick={() => setF({ ...f, [k]: v })}>{l}</button>
      ))}
    </div>
  );

  return (
    <div className="stack-lg">
      <div className="stack">
        <h1>Review what was read from the drawings</h1>
        <p className="muted" style={{ maxWidth: '65ch' }}>
          Check the sheet register and the house features. The features decide which phases, tasks and inspections go into the plan, and the topics on each sheet decide which tasks link to it.
          Anything Claude read is a suggestion until you confirm it here.
        </p>
      </div>

      <section className="stack">
        <h2>Sheet register</h2>
        <div className="scroll-x panel-box" style={{ padding: 0 }}>
          <table className="review-table">
            <thead><tr><th style={{ width: 90 }}>Sheet</th><th style={{ width: 110 }}>No.</th><th>Title</th><th style={{ width: 150 }}>Discipline</th><th style={{ width: 80 }}>Rev</th><th>Applies to</th></tr></thead>
            <tbody>
              {sheets.map((s) => (
                <tr key={s.id}>
                  <td><button className="btn btn-sm" onClick={() => setView(s)}>View</button></td>
                  <td><input id={`no-${s.id}`} type="text" defaultValue={s.number} onBlur={(e) => e.target.value !== s.number && saveSheet(s, { number: e.target.value, status: s.status === 'new' ? 'manual' : s.status })} /></td>
                  <td><input id={`ti-${s.id}`} type="text" defaultValue={s.title} placeholder={`${s.file_name} p.${s.page}`} onBlur={(e) => e.target.value !== s.title && saveSheet(s, { title: e.target.value })} /></td>
                  <td>
                    <select id={`di-${s.id}`} value={s.discipline || ''} onChange={(e) => saveSheet(s, { discipline: e.target.value })}>
                      <option value="">—</option>{DISCIPLINES.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </td>
                  <td><input id={`re-${s.id}`} type="text" defaultValue={s.revision} onBlur={(e) => e.target.value !== s.revision && saveSheet(s, { revision: e.target.value })} /></td>
                  <td>
                    <div className="topic-chips">
                      {TOPICS.map((t) => {
                        const on = s.topics.includes(t);
                        if (!on && s.topics.length > 0 && !expanded.has(s.id)) return null;
                        return <button key={t} type="button" className={`chip ${on ? 'on' : ''}`} onClick={() => saveSheet(s, { topics: on ? s.topics.filter((x) => x !== t) : [...s.topics, t] })}>{TOPIC_LABEL[t]}</button>;
                      })}
                      {s.topics.length > 0 && (
                        <button type="button" className="chip" onClick={() => toggleExpand(s.id)}>{expanded.has(s.id) ? 'Show selected' : 'Edit topics'}</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel-box stack">
        <h2>House features</h2>
        <p className="muted small">Pre-filled from the drawings where Claude found evidence. Adjust anything that&apos;s wrong.</p>
        <div className="form-grid">
          <label className="field"><span>Storeys above grade</span><input id="f-storeys" type="number" min={1} max={4} value={f.storeys} onChange={(e) => setF({ ...f, storeys: Number(e.target.value) })} /></label>
          <label className="field"><span>Bathrooms (incl. powder rooms)</span><input id="f-baths" type="number" min={0} max={10} value={f.bathrooms} onChange={(e) => setF({ ...f, bathrooms: Number(e.target.value) })} /></label>
        </div>
        <div className="field"><span>Foundation</span>{sel('foundation', [['basement', 'Full basement'], ['walkout', 'Walkout'], ['crawl', 'Crawl space'], ['slab', 'Slab on grade']])}</div>
        <div className="field"><span>Foundation walls</span>{sel('walls', [['poured', 'Poured concrete'], ['icf', 'ICF'], ['block', 'Block']])}</div>
        <div className="field"><span>Garage</span>{sel('garage', [['attached', 'Attached'], ['detached', 'Detached'], ['none', 'None']])}</div>
        <div className="field"><span>Exterior cladding</span>
          <div className="toggles">
            {(['brick', 'stone', 'stucco', 'siding'] as const).map((c) => (
              <button key={c} type="button" aria-pressed={f.cladding.includes(c)} onClick={() => setF({ ...f, cladding: f.cladding.includes(c) ? f.cladding.filter((x) => x !== c) : [...f.cladding, c] })}>{c[0].toUpperCase() + c.slice(1)}</button>
            ))}
          </div>
        </div>
        <div className="field"><span>Roofing</span>{sel('roof', [['asphalt', 'Asphalt shingle'], ['metal', 'Metal'], ['other', 'Other']])}</div>
        <div className="field"><span>Heating</span>{sel('heating', [['gas_forced', 'Gas forced air'], ['heat_pump', 'Heat pump'], ['boiler', 'Boiler / radiant'], ['electric', 'Electric']])}</div>
        <div className="field"><span>Natural gas or propane on site</span>{sel('gas', [[true, 'Yes'], [false, 'No']])}</div>
        <div className="field"><span>HRV / ERV</span>{sel('hrv', [[true, 'Yes'], [false, 'No']])}</div>
        <div className="field"><span>Fireplace</span>{sel('fireplace', [['none', 'None'], ['gas', 'Gas'], ['wood', 'Wood-burning']])}</div>
        <div className="field"><span>Water and sewage</span>{sel('servicing', [['municipal', 'Municipal services'], ['septic_well', 'Septic and well']])}</div>
      </section>

      <section className="panel-box stack">
        <h2>Rooms</h2>
        <p className="muted small">
          {f.rooms.length ? 'Read from the floor plans. ' : 'No rooms were read yet. Add them here, or leave this empty to skip room sections. '}
          Each room gets its own section in the HVAC, plumbing, electrical, drywall, flooring, trim and paint checklists, and each bathroom becomes its own task.
        </p>
        <RoomsEditor rooms={f.rooms} sheets={sheets} onChange={(rooms) => setF({ ...f, rooms })} />
      </section>

      {questions.length > 0 && (
        <section className="panel-box stack">
          <h2>Questions for the designer</h2>
          <p className="muted small">Claude flagged these as unclear or missing. Checked items are saved as open questions on the project.</p>
          <div className="checks">
            {questions.map(({ q, s }, i) => (
              <label key={i} className="check">
                <input type="checkbox" checked={!!keepQ[String(i)]} onChange={(e) => setKeepQ({ ...keepQ, [String(i)]: e.target.checked })} />
                <span>{q} <span className="mono muted">{s.number || `${s.file_name} p.${s.page}`}</span></span>
              </label>
            ))}
          </div>
        </section>
      )}

      <section className="panel-box row between">
        <div className="stack" style={{ gap: 2 }}>
          <strong>Ready to build the plan</strong>
          <span className="muted small num">{plan.phases.length} phases · {taskCount} tasks · {inspCount} inspections and hold points</span>
        </div>
        <div className="row">
          <button className="btn" disabled={busy} onClick={() => store.updateProject({ stage: 'drawings' }).catch(toastError)}>Back to drawings</button>
          <button className="btn btn-primary" disabled={busy} onClick={generate}>{busy ? 'Building…' : 'Build construction plan'}</button>
        </div>
      </section>
      {view && <SheetViewer path={view.image_path} title={view.number ? `${view.number} ${view.title}` : view.file_name || 'Sheet'} onClose={() => setView(null)} />}
    </div>
  );
}
