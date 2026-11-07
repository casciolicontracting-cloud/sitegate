'use client';

import { useEffect, useState } from 'react';
import { codeRef, OBC_EDITION } from '@/lib/codes';
import { citedClauses, taskClauseIds } from '@/lib/codeRefs';
import { TOPIC_LABEL, type Box, type PlanCheck, type Topic } from '@/lib/template';
import type { ProjectStore } from '@/lib/useProject';
import type { Inspection, InspStatus, Sheet } from '@/lib/types';
import type { Nav } from './ProjectApp';
import { ClauseChips, ClauseList, ClauseViewer } from './CodeRefs';
import { productsForTask, itemTitle } from '@/lib/rooms';
import { DocLink, ItemPill, MAKER_NOTE, productLine } from './RoomsTab';
import { DrawingCrop, Drawer, fmtDate, InspPill, PhotoGrid, SheetViewer, StagedPhotos, TaskPill, toast, toastError, today } from './ui';

function CodeList({ codes }: { codes: string[] }) {
  if (!codes.length) return <p className="small muted">No code reference for this item. Follow the drawings and manufacturer instructions.</p>;
  return (
    <>
      {codes.map((c) => {
        const r = codeRef(c);
        if (!r) return null;
        return (
          <div className="ref" key={c}>
            <span className="k">{r.label}</span>
            <strong>{r.title}</strong>
            <span className="small">{r.covers}</span>
            {r.url && <a className="small" href={r.url} target="_blank" rel="noreferrer">Open source</a>}
          </div>
        );
      })}
      <p className="small muted">References point to where a requirement lives in the {OBC_EDITION} and related regulations. Confirm the exact requirement in the current text; approved drawings and manufacturer instructions may be stricter.</p>
    </>
  );
}

export function TaskPanel({ store, nav, taskKey, onClose }: { store: ProjectStore; nav: Nav; taskKey: string; onClose: () => void }) {
  const { data, plan, engine, userId } = store;
  const [viewSheet, setViewSheet] = useState<{ sheet: Sheet; focus?: Box } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteKind, setNoteKind] = useState<'note' | 'question'>('note');
  const [defTitle, setDefTitle] = useState('');
  const [defFiles, setDefFiles] = useState<File[]>([]);
  const [logging, setLogging] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [clause, setClause] = useState<string | null>(null);
  if (!data || !plan || !engine) return null;
  const t = plan.tasks[taskKey];
  const st = data.tasks[taskKey];
  const status = engine.taskStatus(t);
  const verified = !!st?.verified_at;
  const before = engine.usuallyAfter(t);
  const sheets = engine.linkedSheets(t);
  const views = engine.drawingViews(t);
  const roomSheet = engine.sheetById(t.room?.sheet);
  const dwgNotes = engine.drawingNotes(t);
  const issues = engine.completeIssues(t);
  const revised = engine.revisedSince(t);
  const notes = data.notes.filter((n) => n.task_key === taskKey);
  const defs = data.defs.filter((d) => d.task_key === taskKey);
  const contacts = data.contacts.filter((c) => c.trade === t.trade);
  const products = productsForTask(t, data.rooms, data.roomItems);
  const checks = st?.checks || {};
  const left = t.checks.length - engine.checksDone(t);
  const who = (id: string | null) => (id && data.profiles[id]?.full_name) || 'a team member';
  const open = (sheet: Sheet, focus?: Box) => setViewSheet({ sheet, focus });

  const setChecks = (ids: string[], on: boolean) => {
    if (verified) return;
    const next = { ...checks, ...Object.fromEntries(ids.map((id) => [id, on])) };
    store.saveTask(taskKey, { checks: next, started_at: st?.started_at || new Date().toISOString() }).catch(toastError);
  };

  async function complete() {
    setCompleting(true);
    try {
      await store.completeTask(taskKey);
      toast(`${t.name} complete.`);
    } catch (e) { toastError(e); } finally { setCompleting(false); }
  }

  async function reopen() {
    await store.saveTask(taskKey, { verified_at: null, verified_by: null });
    store.log('task_reopened', { task: taskKey });
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    await store.addNote({ task_key: taskKey, phase_key: t.phase, trade: t.trade, kind: noteKind, body: noteText.trim() }).catch(toastError);
    setNoteText('');
  }

  async function addDef(e: React.FormEvent) {
    e.preventDefault();
    if (!defTitle.trim()) return;
    setLogging(true);
    try {
      const d = await store.addDef({ task_key: taskKey, phase_key: t.phase, trade: t.trade, title: defTitle.trim(), status: 'open' });
      if (defFiles.length) await store.addDefPhotos(d.id, defFiles);
      setDefTitle(''); setDefFiles([]);
    } catch (err) { toastError(err); } finally { setLogging(false); }
  }

  const checkRow = (c: PlanCheck) => (
    <label key={c.id} className={`check ${checks[c.id] ? 'done' : ''}`}>
      <input type="checkbox" checked={!!checks[c.id]} disabled={verified} onChange={() => setChecks([c.id], !checks[c.id])} />
      <span>{c.text} <ClauseChips ids={c.clauses} onOpen={setClause} /></span>
    </label>
  );

  return (
    <Drawer title={t.name} sub={`${plan.byPhase[t.phase].name} · ${t.trade}`} pill={<TaskPill s={status} />} onClose={onClose}>
      {before.length > 0 && !verified && (
        <div className="notice info">
          Usually done after these, but you can go ahead:
          <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
            {before.map((b) => (
              <li key={b.key}>
                {b.kind === 'task' ? <button className="btn-link" onClick={() => nav.openTask(b.key)}>{b.label}</button>
                  : <button className="btn-link" onClick={() => nav.openInsp(b.key)}>{b.label}</button>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {revised.length > 0 && (
        <div className="notice bad">
          Verified against an older revision of {revised.map((s) => `${s.number || 'a sheet'} (now rev ${s.revision || '—'})`).join(', ')}. Recheck the work and reopen if it no longer matches.
        </div>
      )}

      {!verified && (
        <section className="panel-box">
          <button className="btn btn-ok" style={{ alignSelf: 'flex-start' }} disabled={issues.length > 0 || completing} onClick={complete}>
            {completing ? 'Completing…' : left > 0 ? `Complete task (${left} check${left === 1 ? '' : 's'} left)` : 'Complete task'}
          </button>
          {issues.length > 0
            ? <ul className="small muted" style={{ margin: 0, paddingLeft: 18 }}>{issues.map((x) => <li key={x}>{x}</li>)}</ul>
            : <p className="small muted">Ticks every remaining check and signs the task off under your name, with the drawing revisions it was checked against.</p>}
        </section>
      )}

      <section>
        <div className="section-head" style={{ margin: 0 }}><h3>Drawings</h3><span className="small muted">Linked by topic</span></div>
        {t.room?.box && roomSheet && (
          <DrawingCrop path={roomSheet.image_path} box={t.room.box} label={`${t.room.name} on ${roomSheet.number || 'plan'}`} onOpen={() => open(roomSheet, t.room!.box)} />
        )}
        {views.length > 0 && (
          <div className="crops">
            {views.map((v, i) => (
              <DrawingCrop key={i} path={v.sheet.image_path} box={v.box} label={`${v.label} · ${v.sheet.number || 'sheet'}`} onOpen={() => open(v.sheet, v.box)} />
            ))}
          </div>
        )}
        {sheets.length === 0 ? <p className="small muted">No sheets are tagged for {t.topics.map((x) => TOPIC_LABEL[x as Topic]).join(', ')}. Tag sheets on the Drawings tab.</p> : (
          <div className="row">
            {sheets.map((s) => (
              <button key={s.id} className="sheet-chip" onClick={() => open(s)}>{s.number || 'Sheet'}{s.revision ? ` · Rev ${s.revision}` : ''}</button>
            ))}
          </div>
        )}
        {dwgNotes.length > 0 && (
          <div className="stack" style={{ gap: 6 }}>
            <span className="label">From the drawings</span>
            {dwgNotes.map((n, i) => (
              <div key={i} className="from-dwg">
                {n.text}{' '}
                <button className="btn-link mono" onClick={() => open(n.sheet, n.box)}>{n.sheet.number || 'sheet'}{n.where ? ` · ${n.where}` : ''}</button>
                <ClauseChips ids={citedClauses(`${n.text} ${n.where || ''} ${n.code || ''}`)} onOpen={setClause} />
              </div>
            ))}
            <span className="small muted">Read from the sheets by Claude. Confirm against the drawing before building to it.</span>
          </div>
        )}
      </section>

      <section>
        <div className="section-head" style={{ margin: 0 }}><h3>Checklist</h3><span className="small muted num">{engine.checksDone(t)}/{t.checks.length}</span></div>
        <div className="checks">{t.checks.filter((c) => !c.group).map(checkRow)}</div>
        {t.groups.map((g) => {
          const items = t.checks.filter((c) => c.group === g.id);
          const done = engine.checksDone(t, g.id);
          const sheet = engine.sheetById(g.room.sheet);
          return (
            <div key={g.id} className="room-group">
              <div className="room-group-head">
                <div className="stack" style={{ gap: 2 }}>
                  <h4>{g.label}</h4>
                  <span className="small muted num">{done}/{items.length}</span>
                </div>
                <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                  {sheet && g.room.box && (
                    <span className="room-thumb"><DrawingCrop path={sheet.image_path} box={g.room.box} label={sheet.number || 'Plan'} onOpen={() => open(sheet, g.room.box)} /></span>
                  )}
                  {!verified && done < items.length && (
                    <button className="btn btn-sm" onClick={() => setChecks(items.map((c) => c.id), true)}>Room done</button>
                  )}
                </div>
              </div>
              <div className="checks">{items.map(checkRow)}</div>
            </div>
          );
        })}
      </section>

      {products.length > 0 && (
        <section>
          <div className="section-head" style={{ margin: 0 }}><h3>Selections</h3><span className="small muted">From the Rooms tab</span></div>
          {products.map(({ room, items }) => (
            <div key={room.id} className="stack" style={{ gap: 6 }}>
              <button className="btn-link" style={{ alignSelf: 'flex-start' }} onClick={() => { onClose(); nav.go('rooms', room.id); }}>{room.name}{room.level ? ` · ${room.level}` : ''}</button>
              <div className="list">
                {items.map((i) => (
                  <div key={i.id} className="item" style={{ cursor: 'default', alignItems: 'flex-start' }}>
                    <ItemPill s={i.status} />
                    <div className="grow stack" style={{ gap: 2 }}>
                      <span className="t">{itemTitle(i)}</span>
                      <span className="s">{productLine(i) || 'Product not chosen yet'}{i.location ? ` · ${i.location}` : ''}</span>
                      {i.documents.map((d) => <DocLink key={d.path} doc={d} />)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {products.some((g) => g.items.some((i) => i.documents.length)) && <p className="small muted" style={{ margin: 0 }}>{MAKER_NOTE}</p>}
        </section>
      )}

      <section>
        <div className="section-head" style={{ margin: 0 }}><h3>Photos</h3><span className="small muted">Optional</span></div>
        <PhotoGrid paths={st?.photos || []} title={t.name}
          onAdd={(files) => store.addTaskPhotos(taskKey, files)} onDelete={(p) => store.deleteTaskPhoto(taskKey, p)} />
      </section>

      <section>
        <h3>Code and standards</h3>
        <ClauseList ids={taskClauseIds(t)} onOpen={setClause} edition={data.project.code_edition} />
        <CodeList codes={t.codes} />
      </section>

      <section>
        <h3>Responsible trade</h3>
        {contacts.length === 0 ? <p className="small muted">No {t.trade.toLowerCase()} contact yet. <button className="btn-link" onClick={() => nav.go('contacts')}>Add one</button></p> : (
          <select id={`assign-${taskKey}`} value={st?.assignee_contact || ''} onChange={(e) => store.saveTask(taskKey, { assignee_contact: e.target.value || null }).catch(toastError)}>
            <option value="">Not assigned</option>
            {contacts.map((c) => <option key={c.id} value={c.id}>{[c.company, c.person].filter(Boolean).join(' – ')}</option>)}
          </select>
        )}
      </section>

      <section>
        <h3>Deficiencies</h3>
        {defs.map((d) => (
          <div key={d.id} className="ref">
            <div className="row between">
              <span className="grow">{d.title}</span>
              <span className={`pill ${d.status === 'closed' ? 'ok' : d.status === 'fixed' ? 'warn' : 'bad'}`}>{d.status === 'open' ? 'Open' : d.status === 'fixed' ? 'Fixed, to verify' : 'Closed'}</span>
            </div>
            <PhotoGrid small paths={d.photos || []} title={`Deficiency: ${d.title}`}
              onAdd={(files) => store.addDefPhotos(d.id, files)} onDelete={(p) => store.deleteDefPhoto(d.id, p)} />
          </div>
        ))}
        <form className="stack" style={{ gap: 8 }} onSubmit={addDef}>
          <div className="row">
            <input id={`def-${taskKey}`} type="text" className="grow" style={{ flex: 1, minWidth: 180 }} placeholder="Describe a deficiency" value={defTitle} onChange={(e) => setDefTitle(e.target.value)} />
            <button className="btn" disabled={logging}>{logging ? 'Logging…' : 'Log deficiency'}</button>
          </div>
          <StagedPhotos files={defFiles} onChange={setDefFiles} />
        </form>
      </section>

      <section>
        <h3>Trade notes</h3>
        {notes.map((n) => (
          <div key={n.id} className="ref">
            <span className="small muted">{n.kind === 'question' ? 'Question' : 'Note'} · {who(n.created_by)} · {fmtDate(n.created_at)}</span>
            <span>{n.body}</span>
            {n.answer && <span className="small"><strong>Answer:</strong> {n.answer}</span>}
          </div>
        ))}
        <form className="stack" onSubmit={addNote}>
          <textarea id={`note-${taskKey}`} placeholder={`Note for ${t.trade.toLowerCase()}, or a question for the designer`} value={noteText} onChange={(e) => setNoteText(e.target.value)} />
          <div className="row">
            <div className="toggles">
              <button type="button" aria-pressed={noteKind === 'note'} onClick={() => setNoteKind('note')}>Note</button>
              <button type="button" aria-pressed={noteKind === 'question'} onClick={() => setNoteKind('question')}>Question / RFI</button>
            </div>
            <button className="btn">Add</button>
          </div>
        </form>
      </section>

      {verified && (
        <section className="panel-box">
          <h3>Sign-off</h3>
          <p>Completed by {who(st!.verified_by)} on {fmtDate(st!.verified_at)}.</p>
          <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => reopen().catch(toastError)}>Reopen task</button>
        </section>
      )}

      {clause && <ClauseViewer id={clause} onClose={() => setClause(null)} />}
      {viewSheet && (
        <SheetViewer path={viewSheet.sheet.image_path} title={`${viewSheet.sheet.number} ${viewSheet.sheet.title}`} focus={viewSheet.focus} onClose={() => setViewSheet(null)} />
      )}
    </Drawer>
  );
}

export function InspPanel({ store, nav, inspKey, onClose }: { store: ProjectStore; nav: Nav; inspKey: string; onClose: () => void }) {
  const { data, plan, engine } = store;
  const [notes, setNotes] = useState(data?.insps[inspKey]?.notes || '');
  const [clause, setClause] = useState<string | null>(null);
  if (!data || !plan || !engine) return null;
  const i = plan.insps[inspKey];
  const rec = data.insps[inspKey];
  const s = engine.inspStatus(inspKey);
  const ready = engine.inspReady(i);
  const inspectors = data.contacts.filter((c) => /inspector/i.test(c.trade));

  async function set(status: InspStatus, extra: Partial<Inspection> = {}) {
    await store.saveInsp(inspKey, { status, notes: notes || null, ...extra });
    store.log('inspection_' + status, { inspection: inspKey });
    if (status === 'failed') {
      await store.addDef({ title: `Failed inspection: ${i.name}${notes ? ` — ${notes}` : ''}`, phase_key: i.phase, task_key: i.after[0] || null, trade: plan!.tasks[i.after[0]]?.trade || null, status: 'open' });
      toast('Logged as a deficiency. Fix, then request a re-inspection.');
    }
  }

  return (
    <Drawer title={i.name} sub={`${plan.byPhase[i.phase].name} · ${i.authority} inspection`} pill={<InspPill s={s} />} onClose={onClose}>
      {!ready && s === 'pending' && (
        <div className="notice info">Usually booked once this work is complete: {i.after.map((a) => (
          <button key={a} className="btn-link" onClick={() => nav.openTask(a)} style={{ marginRight: 8 }}>{plan.tasks[a]?.name}</button>
        ))}</div>
      )}
      <section>
        <h3>How to book</h3>
        <p>{i.howTo}</p>
        {data.project.permit_no && <p className="small">Permit no. <span className="mono">{data.project.permit_no}</span>{data.project.municipality ? ` · ${data.project.municipality}` : ''}</p>}
        {inspectors.length > 0 && <div className="small">{inspectors.map((c) => <div key={c.id}>{c.trade}: {[c.person, c.company, c.phone, c.email].filter(Boolean).join(' · ')}</div>)}</div>}
      </section>
      <section>
        <h3>Record</h3>
        <div className="form-grid">
          <label className="field"><span>Requested on</span><input id="i-req" type="date" value={rec?.requested_on || ''} onChange={(e) => store.saveInsp(inspKey, { requested_on: e.target.value || null, status: s === 'pending' ? 'requested' : s }).catch(toastError)} /></label>
          <label className="field"><span>Scheduled for</span><input id="i-sch" type="date" value={rec?.scheduled_on || ''} onChange={(e) => store.saveInsp(inspKey, { scheduled_on: e.target.value || null, status: ['pending', 'requested'].includes(s) ? 'scheduled' : s }).catch(toastError)} /></label>
          <label className="field"><span>Inspector</span><input id="i-who" type="text" defaultValue={rec?.inspector || ''} onBlur={(e) => e.target.value !== (rec?.inspector || '') && store.saveInsp(inspKey, { inspector: e.target.value || null }).catch(toastError)} /></label>
        </div>
        <label className="field"><span>Result notes / reason not required</span><textarea id="i-notes" value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
        <div className="row">
          {s === 'pending' && <button className="btn btn-primary" onClick={() => set('requested', { requested_on: today() }).catch(toastError)}>Mark requested today</button>}
          <button className="btn btn-ok" onClick={() => set('passed').catch(toastError)}>Passed</button>
          <button className="btn" onClick={() => set('failed').catch(toastError)}>Failed</button>
          <button className="btn btn-ghost" onClick={() => { if (!notes.trim()) return toast('Add a reason it isn’t required.', true); set('na').catch(toastError); }}>Not required</button>
          {s !== 'pending' && <button className="btn btn-ghost" onClick={() => set('pending').catch(toastError)}>Reset</button>}
        </div>
      </section>
      <section>
        <h3>Code and standards</h3>
        <ClauseList ids={i.clauses} onOpen={setClause} edition={data.project.code_edition} />
        <CodeList codes={i.codes} />
      </section>
      {clause && <ClauseViewer id={clause} onClose={() => setClause(null)} />}
    </Drawer>
  );
}
