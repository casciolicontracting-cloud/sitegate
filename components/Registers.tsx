'use client';

import { useEffect, useState } from 'react';
import { aiEnabled, analyzeSheet } from '@/lib/analyze';
import { renderFile } from '@/lib/pdf';
import { newId, uploadFile } from '@/lib/supabase';
import { collectRooms } from '@/lib/status';
import { normalizeFeatures, roomLabel, TOPICS, TOPIC_LABEL, TRADES, type Room } from '@/lib/template';
import { finalizeRooms, RoomsEditor } from './Rooms';
import type { ProjectStore } from '@/lib/useProject';
import type { Contact, Deficiency, Sheet } from '@/lib/types';
import type { Nav } from './ProjectApp';
import { fmtDate, InspPill, PhotoGrid, SheetViewer, StagedPhotos, StoredImage, toast, toastError } from './ui';

// ---------------------------------------------------------------------------
export function DrawingsView({ store, nav }: { store: ProjectStore; nav: Nav }) {
  const { data, plan, engine } = store;
  const [view, setView] = useState<Sheet | null>(null);
  const [edit, setEdit] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[] | null>(null); // local edits, null when not editing
  const [aiOn, setAiOn] = useState(false);
  useEffect(() => { aiEnabled().then(setAiOn); }, []);
  if (!data || !plan || !engine) return null;

  async function findLocations() {
    const list = data!.sheets;
    let failed = 0;
    for (let i = 0; i < list.length; i++) {
      setBusy(`Claude is reading sheet ${i + 1} of ${list.length}…`);
      try { store.setSheetLocal(await analyzeSheet(list[i], undefined, true)); } catch { failed++; }
    }
    setBusy(null);
    toast(failed ? `${failed} sheet${failed === 1 ? '' : 's'} could not be read. Try again later.` : 'Rooms and drawing views found. Check the rooms below, then save them.', failed > 0);
  }
  const sheets = data.sheets;
  const saved = normalizeFeatures(data.project.features).rooms;

  async function saveRooms() {
    const final = finalizeRooms(rooms || []);
    const baths = final.filter((r) => r.kind === 'bathroom').length;
    try {
      await store.updateProject({ features: { ...data!.project.features, rooms: final, ...(baths ? { bathrooms: baths } : {}) } });
      store.log('rooms_updated', { rooms: final.length });
      toast(`Saved ${final.length} room${final.length === 1 ? '' : 's'}. The plan now has a section for each.`);
      setRooms(null);
    } catch (e) { toastError(e); }
  }
  const save = (s: Sheet, p: Partial<Sheet>) => store.upsertSheet({ ...s, ...p }).catch(toastError);

  async function addSheets(files: FileList) {
    let sort = sheets.reduce((m, s) => Math.max(m, s.sort), 0);
    try {
      for (const f of Array.from(files)) {
        const pages = await renderFile(f, (n, t) => setBusy(`Rendering ${f.name} ${n}/${t}`));
        for (const pg of pages) {
          const id = newId();
          const path = await uploadFile(`${data!.project.id}/sheets/${id}.jpg`, pg.image);
          await store.upsertSheet({ id, sort: ++sort, file_name: f.name, page: pg.page, image_path: path, text_layer: pg.text || null,
            number: '', title: '', discipline: '', revision: '', topics: [], notes: [], questions: [], features: {}, status: 'manual' } as Partial<Sheet> & { id: string });
        }
      }
      toast('Sheets added. Fill in their number, revision and topics.');
    } catch (e) { toastError(e); } finally { setBusy(null); }
  }

  async function replace(s: Sheet, file: File, rev: string) {
    setBusy(`Uploading revision for ${s.number}`);
    try {
      const [pg] = await renderFile(file);
      const path = await uploadFile(`${data!.project.id}/sheets/${s.id}-${newId().slice(0, 8)}.jpg`, pg.image);
      await store.upsertSheet({ ...s, image_path: path, revision: rev || s.revision });
      store.log('sheet_revised', { sheet: s.number, revision: rev });
      toast(`${s.number || 'Sheet'} updated to rev ${rev || s.revision}. Tasks verified against the old revision are flagged.`);
    } catch (e) { toastError(e); } finally { setBusy(null); }
  }

  return (
    <div className="stack-lg">
      <div className="section-head">
        <div className="stack" style={{ gap: 4 }}><h1>Drawings</h1><span className="muted small num">{sheets.length} sheets · topics link sheets to tasks</span></div>
        <div className="row">
        {aiOn && sheets.length > 0 && (
          <button className="btn" disabled={!!busy} onClick={findLocations}>Find rooms and views with Claude</button>
        )}
        <label className="btn">
          {busy || 'Add sheets'}
          <input id="add-sheets" type="file" accept="application/pdf,image/*" multiple hidden disabled={!!busy} onChange={(e) => { if (e.target.files) addSheets(e.target.files); e.target.value = ''; }} />
        </label>
        </div>
      </div>
      <section className="panel-box stack">
        <div className="section-head" style={{ margin: 0 }}>
          <h2>Rooms <span className="muted small num">· {saved.length}</span></h2>
          {rooms === null && (
            <button className="btn btn-sm" onClick={() => setRooms(saved.length ? saved : collectRooms(sheets))}>{saved.length ? 'Edit rooms' : 'Set up rooms'}</button>
          )}
        </div>
        {rooms === null ? (
          <p className="small muted">
            {saved.length ? saved.map(roomLabel).join(' · ') : 'No rooms yet. Rooms add a section per room to the HVAC, plumbing, electrical, drywall, flooring, trim and paint checklists.'}
          </p>
        ) : (
          <>
            <p className="small muted">Pre-filled from the floor plans where Claude labelled rooms. Renaming a room starts its checklist section over.</p>
            <RoomsEditor rooms={rooms} sheets={sheets} onChange={setRooms} />
            <div className="row">
              <button className="btn btn-primary" onClick={saveRooms}>Save rooms</button>
              {saved.length > 0 && <button className="btn" onClick={() => setRooms(collectRooms(sheets))}>Reload from drawings</button>}
              <button className="btn btn-ghost" onClick={() => setRooms(null)}>Cancel</button>
            </div>
          </>
        )}
      </section>
      <div className="sheets">
        {sheets.map((s) => {
          const tasks = Object.values(plan.tasks).filter((t) => s.topics.some((x) => t.topics.includes(x as never)));
          return (
            <div key={s.id} className="sheet">
              <button className="img" onClick={() => setView(s)} aria-label={`Open ${s.number}`}><StoredImage path={s.image_path} alt={s.title || 'Sheet'} /></button>
              <div className="body">
                {edit === s.id ? (
                  <div className="stack" style={{ gap: 8 }}>
                    <div className="row">
                      <label className="field" style={{ flex: 1 }}><span>No.</span><input id={`dn-${s.id}`} type="text" defaultValue={s.number} onBlur={(e) => save(s, { number: e.target.value })} /></label>
                      <label className="field" style={{ width: 80 }}><span>Rev</span><input id={`dr-${s.id}`} type="text" defaultValue={s.revision} onBlur={(e) => e.target.value !== s.revision && save(s, { revision: e.target.value })} /></label>
                    </div>
                    <label className="field"><span>Title</span><input id={`dt-${s.id}`} type="text" defaultValue={s.title} onBlur={(e) => save(s, { title: e.target.value })} /></label>
                    <div className="topic-chips">
                      {TOPICS.map((t) => {
                        const on = s.topics.includes(t);
                        return <button key={t} type="button" className={`chip ${on ? 'on' : ''}`} onClick={() => save(s, { topics: on ? s.topics.filter((x) => x !== t) : [...s.topics, t] })}>{TOPIC_LABEL[t]}</button>;
                      })}
                    </div>
                    <label className="btn btn-sm">
                      Upload revised sheet
                      <input id={`rv-${s.id}`} type="file" accept="application/pdf,image/*" hidden onChange={(e) => {
                        const f = e.target.files?.[0]; e.target.value = '';
                        if (!f) return;
                        const input = document.getElementById(`dr-${s.id}`) as HTMLInputElement | null;
                        replace(s, f, input?.value || s.revision);
                      }} />
                    </label>
                    <span className="small muted">Set the new revision above first, then upload.</span>
                    <button className="btn btn-sm" onClick={() => setEdit(null)}>Done</button>
                  </div>
                ) : (
                  <>
                    <div className="row between"><strong className="mono">{s.number || '—'}</strong>{s.revision && <span className="pill blue">Rev {s.revision}</span>}</div>
                    <span className="small">{s.title || <span className="muted">{s.file_name} p.{s.page}</span>}</span>
                    <div className="topic-chips">{s.topics.map((t) => <span key={t} className="chip on">{TOPIC_LABEL[t as keyof typeof TOPIC_LABEL] || t}</span>)}</div>
                    <span className="small muted num">Linked to {tasks.length} task{tasks.length === 1 ? '' : 's'}</span>
                    {s.notes?.length > 0 && <details className="small"><summary>{s.notes.length} specs read from this sheet</summary><ul style={{ paddingLeft: 18, margin: '6px 0 0' }}>{s.notes.map((n, i) => <li key={i}>{n.text}{n.where ? <span className="muted"> ({n.where})</span> : null}</li>)}</ul></details>}
                    <button className="btn btn-sm" onClick={() => setEdit(s.id)}>Edit / revise</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {view && <SheetViewer path={view.image_path} title={`${view.number} ${view.title}`} onClose={() => setView(null)} />}
      {sheets.length === 0 && <div className="empty">No sheets yet. Add the drawing set to link tasks to drawings.</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
export function InspectionsView({ store, nav }: { store: ProjectStore; nav: Nav }) {
  const { data, plan, engine } = store;
  if (!data || !plan || !engine) return null;
  return (
    <div className="stack-lg">
      <div className="stack">
        <h1>Inspections and hold points</h1>
        <p className="muted" style={{ maxWidth: '65ch' }}>The permit holder must notify the municipality at each required stage. Electrical inspections go through ESA via your licensed electrician. Work isn&apos;t covered until its inspection passes.</p>
      </div>
      {plan.phases.filter((p) => p.insps.length).map((p) => (
        <section key={p.id} className="stack">
          <h2>{p.name}</h2>
          <div className="list">
            {p.insps.map((i) => {
              const r = data.insps[i.key];
              const s = engine.inspStatus(i.key);
              return (
                <button key={i.key} className="item" onClick={() => nav.openInsp(i.key)}>
                  <InspPill s={s} />
                  <div className="grow">
                    <div className="t">{i.name}</div>
                    <div className="s">{i.authority}{r?.scheduled_on ? ` · scheduled ${fmtDate(r.scheduled_on)}` : r?.requested_on ? ` · requested ${fmtDate(r.requested_on)}` : s === 'pending' ? (engine.inspReady(i) ? ' · ready to book' : ' · prerequisites not done') : ''}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
export function DeficienciesView({ store, nav }: { store: ProjectStore; nav: Nav }) {
  const { data, plan, userId } = store;
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const [title, setTitle] = useState('');
  const [trade, setTrade] = useState('');
  const [phase, setPhase] = useState('');
  const [due, setDue] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [logging, setLogging] = useState(false);
  if (!data || !plan) return null;
  const list = data.defs.filter((d) => filter === 'all' || d.status !== 'closed');

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !phase) return toast('Add a description and the phase it belongs to.', true);
    setLogging(true);
    try {
      const d = await store.addDef({ title: title.trim(), trade: trade || null, phase_key: phase, due_on: due || null, status: 'open' });
      if (files.length) await store.addDefPhotos(d.id, files);
      setTitle(''); setDue(''); setFiles([]);
    } catch (err) { toastError(err); } finally { setLogging(false); }
  }
  const setStatus = (d: Deficiency, status: Deficiency['status']) => store.updateDef(d.id, {
    status, closed_at: status === 'closed' ? new Date().toISOString() : null, closed_by: status === 'closed' ? userId : null,
  }).catch(toastError);

  return (
    <div className="stack-lg">
      <div className="section-head">
        <h1>Deficiencies</h1>
        <div className="toggles">
          <button aria-pressed={filter === 'open'} onClick={() => setFilter('open')}>Open</button>
          <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All</button>
        </div>
      </div>
      <p className="muted small" style={{ maxWidth: '65ch' }}>A deficiency stays open until the trade marks it fixed and you verify and close it. Open deficiencies hold their phase gate.</p>
      <form className="panel-box stack" onSubmit={add}>
        <div className="form-grid">
          <label className="field" style={{ gridColumn: '1 / -1' }}><span>What&apos;s wrong</span><input id="d-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Missing brick ties at north wall, second course" /></label>
          <label className="field"><span>Phase</span><select id="d-phase" value={phase} onChange={(e) => setPhase(e.target.value)}><option value="">Choose…</option>{plan.phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label className="field"><span>Trade</span><select id="d-trade" value={trade} onChange={(e) => setTrade(e.target.value)}><option value="">—</option>{TRADES.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label className="field"><span>Due</span><input id="d-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} /></label>
        </div>
        <div className="field"><span>Photos</span><StagedPhotos files={files} onChange={setFiles} /></div>
        <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={logging}>{logging ? (files.length ? 'Uploading photos…' : 'Logging…') : 'Log deficiency'}</button>
      </form>
      <div className="list">
        {list.length === 0 && <div className="empty">{filter === 'open' ? 'No open deficiencies.' : 'None logged yet.'}</div>}
        {list.map((d) => (
          <div key={d.id} className="item" style={{ cursor: 'default', alignItems: 'flex-start' }}>
            <span className={`pill ${d.status === 'closed' ? 'ok' : d.status === 'fixed' ? 'warn' : 'bad'}`}>{d.status === 'open' ? 'Open' : d.status === 'fixed' ? 'Fixed' : 'Closed'}</span>
            <div className="grow stack" style={{ gap: 4 }}>
              <span className="t">{d.title}</span>
              <span className="s">
                {[d.phase_key && plan.byPhase[d.phase_key]?.name, d.trade, d.due_on && `due ${fmtDate(d.due_on)}`, `logged ${fmtDate(d.created_at)}`].filter(Boolean).join(' · ')}
                {d.task_key && plan.tasks[d.task_key] && <> · <button className="btn-link" onClick={() => nav.openTask(d.task_key!)}>{plan.tasks[d.task_key].name}</button></>}
              </span>
              <PhotoGrid small paths={d.photos || []} title={`Deficiency: ${d.title}`}
                onAdd={(f) => store.addDefPhotos(d.id, f)} onDelete={(p) => store.deleteDefPhoto(d.id, p)} />
              <div className="row">
                {d.status === 'open' && <button className="btn btn-sm" onClick={() => setStatus(d, 'fixed')}>Mark fixed</button>}
                {d.status === 'fixed' && <><button className="btn btn-sm btn-ok" onClick={() => setStatus(d, 'closed')}>Verify and close</button><button className="btn btn-sm" onClick={() => setStatus(d, 'open')}>Not fixed</button></>}
                {d.status === 'closed' && <button className="btn btn-sm btn-ghost" onClick={() => setStatus(d, 'open')}>Reopen</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
export function NotesView({ store, nav }: { store: ProjectStore; nav: Nav }) {
  const { data, plan } = store;
  const [trade, setTrade] = useState('');
  const [answering, setAnswering] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  if (!data || !plan) return null;
  const notes = data.notes.filter((n) => !trade || n.trade === trade);
  const trades = [...new Set(data.notes.map((n) => n.trade).filter(Boolean))] as string[];
  const questions = notes.filter((n) => n.kind === 'question');
  const tradeNotes = notes.filter((n) => n.kind === 'note');
  const who = (id: string | null) => (id && data.profiles[id]?.full_name) || 'Team member';

  const row = (n: (typeof notes)[number]) => (
    <div key={n.id} className="item" style={{ cursor: 'default', alignItems: 'flex-start' }}>
      {n.kind === 'question' && <span className={`pill ${n.answer ? 'ok' : 'warn'}`}>{n.answer ? 'Answered' : 'Open'}</span>}
      <div className="grow stack" style={{ gap: 4 }}>
        <span>{n.body}</span>
        <span className="s">
          {[n.trade, who(n.created_by), fmtDate(n.created_at)].filter(Boolean).join(' · ')}
          {n.task_key && plan.tasks[n.task_key] && <> · <button className="btn-link" onClick={() => nav.openTask(n.task_key!)}>{plan.tasks[n.task_key].name}</button></>}
        </span>
        {n.answer && <span className="small"><strong>Answer:</strong> {n.answer}</span>}
        {n.kind === 'question' && !n.answer && (answering === n.id ? (
          <form className="row" onSubmit={(e) => { e.preventDefault(); if (!answer.trim()) return; store.updateNote(n.id, { answer: answer.trim() }).catch(toastError); setAnswering(null); setAnswer(''); }}>
            <input id={`ans-${n.id}`} type="text" style={{ flex: 1, minWidth: 180 }} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Designer's answer" />
            <button className="btn btn-sm">Save</button>
          </form>
        ) : <button className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => { setAnswering(n.id); setAnswer(''); }}>Record answer</button>)}
      </div>
    </div>
  );

  return (
    <div className="stack-lg">
      <div className="section-head">
        <h1>Notes and questions</h1>
        <select id="n-trade" value={trade} onChange={(e) => setTrade(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All trades</option>{trades.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <p className="muted small" style={{ maxWidth: '65ch' }}>Add notes from any task. Questions track drawing clarifications (RFIs) until the answer is recorded; problems with the work belong in Deficiencies.</p>
      <section className="stack"><h2>Questions for the designer</h2><div className="list">{questions.length ? questions.map(row) : <div className="empty">No questions.</div>}</div></section>
      <section className="stack"><h2>Trade notes</h2><div className="list">{tradeNotes.length ? tradeNotes.map(row) : <div className="empty">No notes yet. Open a task to add one.</div>}</div></section>
    </div>
  );
}

// ---------------------------------------------------------------------------
export function ContactsView({ store }: { store: ProjectStore }) {
  const { data } = store;
  const blank = { trade: '', company: '', person: '', phone: '', email: '', notes: '' };
  const [form, setForm] = useState<Partial<Contact>>(blank);
  if (!data) return null;
  const set = (k: keyof Contact) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.trade) return toast('Choose a trade or role.', true);
    await store.saveContact(form).catch(toastError);
    setForm(blank);
  }

  return (
    <div className="stack-lg">
      <h1>Contacts</h1>
      <form className="panel-box stack" onSubmit={save}>
        <h3>{form.id ? 'Edit contact' : 'Add a trade, inspector or consultant'}</h3>
        <div className="form-grid">
          <label className="field"><span>Trade / role</span><select id="c-trade" value={form.trade || ''} onChange={set('trade')}><option value="">Choose…</option>{TRADES.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label className="field"><span>Company</span><input id="c-co" type="text" value={form.company || ''} onChange={set('company')} /></label>
          <label className="field"><span>Contact person</span><input id="c-person" type="text" value={form.person || ''} onChange={set('person')} /></label>
          <label className="field"><span>Phone</span><input id="c-phone" type="tel" value={form.phone || ''} onChange={set('phone')} /></label>
          <label className="field"><span>Email</span><input id="c-email" type="email" value={form.email || ''} onChange={set('email')} /></label>
          <label className="field"><span>Notes (licence, permit or account no.)</span><input id="c-notes" type="text" value={form.notes || ''} onChange={set('notes')} /></label>
        </div>
        <div className="row">
          <button className="btn btn-primary">{form.id ? 'Save changes' : 'Add contact'}</button>
          {form.id && <button type="button" className="btn btn-ghost" onClick={() => setForm(blank)}>Cancel</button>}
        </div>
      </form>
      <div className="list">
        {data.contacts.length === 0 && <div className="empty">No contacts yet. Add your subcontractors, building inspector and ESA inspector.</div>}
        {data.contacts.map((c) => (
          <div key={c.id} className="item" style={{ cursor: 'default' }}>
            <div className="grow">
              <div className="t">{c.company || c.person}</div>
              <div className="s">{c.trade}{c.person && c.company ? ` · ${c.person}` : ''}</div>
              <div className="s">{[c.phone, c.email, c.notes].filter(Boolean).join(' · ')}</div>
            </div>
            <div className="row">
              {c.phone && <a className="btn btn-sm" href={`tel:${c.phone}`}>Call</a>}
              <button className="btn btn-sm" onClick={() => setForm(c)}>Edit</button>
              <button className="btn btn-sm btn-ghost" onClick={() => store.deleteContact(c.id).catch(toastError)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
