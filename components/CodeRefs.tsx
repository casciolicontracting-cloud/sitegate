'use client';

// 2024 OBC clause references on tasks, checklist lines, inspections and drawing notes.
// A clause shows its number, heading and our plain-language note; tapping it opens the
// team's copy of the Building Code Compendium at that page.

import { useEffect, useRef, useState } from 'react';
import { clauseView, REFERENCE_BUCKET, VOLUME_LABEL, VOLUME_PATH, type ClauseView } from '@/lib/codeRefs';
import { OBC_COMPENDIUM } from '@/lib/obc';
import { renderPdfPage } from '@/lib/pdf';
import { fileUrl } from '@/lib/supabase';

/** Short label for chips: "9.8.4.1", "C 1.3.5.1", "SB-7". */
function shortRef(c: ClauseView) {
  if (c.vol === 2) return c.ref;
  return c.id[0] === 'C' ? `C ${c.id.slice(1)}` : c.id.slice(1);
}

export function ClauseChips({ ids, onOpen }: { ids: string[]; onOpen: (id: string) => void }) {
  const list = ids.map(clauseView).filter((c): c is ClauseView => !!c);
  if (!list.length) return null;
  return (
    <span className="clause-chips">
      {list.map((c) => (
        <button key={c.id} type="button" className="clause-chip" title={c.title || c.ref}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpen(c.id); }}>
          {shortRef(c)}
        </button>
      ))}
    </span>
  );
}

export function ClauseList({ ids, onOpen, edition }: { ids: string[]; onOpen: (id: string) => void; edition?: string }) {
  const list = ids.map(clauseView).filter((c): c is ClauseView => !!c);
  if (!list.length) return null;
  return (
    <div className="stack" style={{ gap: 6 }}>
      <span className="label">2024 Ontario Building Code</span>
      {edition && !edition.includes('2024') && (
        <p className="notice warn small">This project is set to {edition}. These references are to the 2024 Code; check the edition your permit was issued under.</p>
      )}
      {list.map((c) => (
        <button key={c.id} type="button" className="ref clause" onClick={() => onOpen(c.id)}>
          <span className="row between" style={{ gap: 8 }}>
            <span className="k">{c.ref}</span>
            <span className="small muted">Vol. {c.vol} · p. {c.page}</span>
          </span>
          {c.title && <strong>{c.title}</strong>}
          {c.covers && <span className="small">{c.covers}</span>}
        </button>
      ))}
    </div>
  );
}

/** Opens the Compendium at a clause's page, rendered in the app. */
export function ClauseViewer({ id, onClose }: { id: string; onClose: () => void }) {
  const c = clauseView(id);
  const [page, setPage] = useState(c?.page || 1);
  const [pages, setPages] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [url, setUrl] = useState<string | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  useEffect(() => {
    if (!c) return;
    fileUrl(VOLUME_PATH[c.vol], REFERENCE_BUCKET).then((u) => { if (u) setUrl(u); else setState('missing'); });
  }, [c?.vol]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!c || !url || !canvas.current || !box.current) return;
    let live = true;
    setState((s) => (s === 'ready' ? s : 'loading'));
    const width = Math.min(box.current.clientWidth - 16, 900) * zoom;
    renderPdfPage(`obc-2024-vol${c.vol}`, url, page, canvas.current, width)
      .then((n) => { if (live) { setPages(n); setState('ready'); } })
      .catch(() => { if (live) setState('error'); });
    return () => { live = false; };
  }, [url, page, zoom, c?.vol]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!c) return null;
  return (
    <div className="viewer" role="dialog" aria-label={c.ref}>
      <div className="viewer-bar">
        <div className="grow" style={{ minWidth: 0 }}>
          <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.ref} {c.title}</strong>
          <span className="small" style={{ opacity: 0.75 }}>{VOLUME_LABEL[c.vol]} · page {page}{pages ? ` of ${pages}` : ''}</span>
        </div>
        <button className="btn btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous page">‹</button>
        <button className="btn btn-sm" onClick={() => setPage((p) => (pages ? Math.min(pages, p + 1) : p + 1))} aria-label="Next page">›</button>
        <button className="btn btn-sm" onClick={() => setZoom((z) => (z >= 2 ? 1 : z + 0.5))} aria-label="Zoom">{Math.round(zoom * 100)}%</button>
        <button className="btn btn-sm" onClick={onClose}>Close</button>
      </div>
      <div className="viewer-img" ref={box} style={{ padding: 8 }}>
        {state === 'missing' && (
          <p className="notice warn" style={{ margin: 12 }}>
            The {OBC_COMPENDIUM} isn&apos;t uploaded yet. Add both volumes under Code reference on the Projects page, then tap the clause again.
            Until then: {c.ref} is in {VOLUME_LABEL[c.vol]}, page {c.page}.
          </p>
        )}
        {state === 'error' && <p className="notice bad" style={{ margin: 12 }}>Couldn&apos;t open the Compendium. Check your connection and try again.</p>}
        {state === 'loading' && <p className="muted" style={{ padding: 12, color: '#cbd5e1' }}>Opening page {page}…</p>}
        <canvas ref={canvas} style={{ display: state === 'ready' ? 'block' : 'none', margin: '0 auto', background: '#fff' }} />
        {url && state === 'ready' && (
          <p className="small" style={{ textAlign: 'center', padding: 12 }}>
            <a href={`${url}#page=${page}`} target="_blank" rel="noreferrer" style={{ color: '#93c5fd' }}>Open the whole volume</a>
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Team-wide reference library: the two volumes of the 2024 Building Code Compendium.
 * Each volume is stored whole and unaltered in private storage, as the Ministry's
 * terms require for sharing it with a group.
 */
export function CodeBooks() {
  const [have, setHave] = useState<Record<1 | 2, boolean> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null);

  async function refresh() {
    const { supabase } = await import('@/lib/supabase');
    const { data, error } = await supabase().storage.from(REFERENCE_BUCKET).list('obc-2024');
    if (error) { setHave({ 1: false, 2: false }); return; }
    const names = new Set((data || []).map((f) => f.name));
    setHave({ 1: names.has('vol1.pdf'), 2: names.has('vol2.pdf') });
  }
  useEffect(() => { void refresh(); }, []);

  async function upload(vol: 1 | 2, file: File) {
    setMsg(null);
    setBusy(`Checking ${file.name}…`);
    try {
      if (!/pdf$/i.test(file.type) && !/\.pdf$/i.test(file.name)) throw new Error('Choose the Compendium PDF.');
      // Make sure it is the right volume before it becomes everyone's reference.
      const text = await firstPagesText(file, 5);
      if (!/2024 Building Code Compendium/i.test(text)) throw new Error(`${file.name} doesn't look like the 2024 Building Code Compendium.`);
      const isVol2 = /Volume 2/i.test(text);
      if ((vol === 2) !== isVol2) throw new Error(`${file.name} looks like Volume ${isVol2 ? 2 : 1}. Upload it in the Volume ${isVol2 ? 2 : 1} slot.`);
      setBusy(`Uploading ${VOLUME_LABEL[vol]} (${Math.round(file.size / 1e6)} MB)…`);
      const { uploadFile } = await import('@/lib/supabase');
      await uploadFile(VOLUME_PATH[vol], new Blob([file], { type: 'application/pdf' }), REFERENCE_BUCKET);
      setMsg({ text: `${VOLUME_LABEL[vol]} uploaded. Code references in every task now open to the right page.`, bad: false });
      await refresh();
    } catch (e) {
      setMsg({ text: (e as Error).message, bad: true });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="panel-box stack">
      <div className="section-head" style={{ margin: 0 }}>
        <h2>Code reference</h2>
        <span className="small muted">{OBC_COMPENDIUM}</span>
      </div>
      <p className="small muted" style={{ maxWidth: '70ch' }}>
        Tasks point to the exact 2024 Ontario Building Code clauses that apply, with a plain-language note on what each covers.
        Upload your copy of the Compendium once and tapping a clause opens it at that page. Each volume is kept whole and private to your team.
      </p>
      <div className="list">
        {([1, 2] as const).map((v) => (
          <div key={v} className="item" style={{ cursor: 'default' }}>
            <span className={`pill ${have?.[v] ? 'ok' : 'lock'}`}>{have === null ? 'Checking' : have[v] ? 'Uploaded' : 'Not uploaded'}</span>
            <div className="grow"><div className="t">{VOLUME_LABEL[v]}</div></div>
            <label className="btn btn-sm" aria-disabled={!!busy}>
              {have?.[v] ? 'Replace' : 'Upload'}
              <input id={`obc-vol${v}`} type="file" accept="application/pdf" hidden disabled={!!busy}
                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void upload(v, f); }} />
            </label>
          </div>
        ))}
      </div>
      {busy && <p className="notice info">{busy}</p>}
      {msg && <p className={`notice ${msg.bad ? 'bad' : 'info'}`}>{msg.text}</p>}
    </section>
  );
}

async function firstPagesText(file: File, n: number): Promise<string> {
  const lib = await import('pdfjs-dist');
  if (!lib.GlobalWorkerOptions.workerSrc) {
    lib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  }
  const doc = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  let text = '';
  for (let i = 1; i <= Math.min(n, doc.numPages); i++) {
    const tc = await (await doc.getPage(i)).getTextContent();
    text += tc.items.map((it) => ('str' in it ? it.str : '')).join(' ') + '\n';
  }
  await doc.destroy();
  return text;
}
