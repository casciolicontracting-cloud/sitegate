'use client';

import { useEffect, useRef, useState } from 'react';
import { fileUrl } from '@/lib/supabase';
import type { Box } from '@/lib/template';
import type { GateStatus, TaskStatus } from '@/lib/status';
import { GATE_LABEL, INSP_LABEL, TASK_LABEL } from '@/lib/status';
import type { InspStatus } from '@/lib/types';

// ---- toast -------------------------------------------------------------
type ToastMsg = { text: string; bad?: boolean; id: number };
let push: ((m: ToastMsg) => void) | null = null;
export function toast(text: string, bad = false) {
  push?.({ text, bad, id: Date.now() });
}
export function toastError(e: unknown) {
  toast(e instanceof Error ? e.message : String(e), true);
}
export function Toaster() {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  useEffect(() => {
    push = (m) => setMsg(m);
    return () => { push = null; };
  }, []);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), msg.bad ? 6000 : 2800);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  return <div role="status" className={`toast ${msg.bad ? 'bad' : ''}`}>{msg.text}</div>;
}

// ---- brand -------------------------------------------------------------
export function Mark() {
  return (
    <svg viewBox="0 0 512 512" aria-hidden="true">
      <path d="M256 92 L404 240 L256 388 L108 240 Z" fill="none" stroke="#e8642c" strokeWidth="40" strokeLinejoin="round" />
      <path d="M188 244 L236 292 L326 196" fill="none" stroke="currentColor" strokeWidth="40" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---- pills -------------------------------------------------------------
const TASK_TONE: Record<TaskStatus, string> = { locked: 'lock', ready: 'go', active: 'go', review: 'warn', verified: 'ok' };
const GATE_TONE: Record<GateStatus, string> = { locked: 'lock', open: 'go', ready: 'warn', passed: 'ok' };
const INSP_TONE: Record<InspStatus, string> = { pending: 'lock', requested: 'go', scheduled: 'blue', passed: 'ok', failed: 'bad', na: 'lock' };

export const TaskPill = ({ s }: { s: TaskStatus }) => <span className={`pill ${TASK_TONE[s]}`}>{TASK_LABEL[s]}</span>;
export const GatePill = ({ s }: { s: GateStatus }) => <span className={`pill ${GATE_TONE[s]}`}>{GATE_LABEL[s]}</span>;
export const InspPill = ({ s }: { s: InspStatus }) => <span className={`pill ${INSP_TONE[s]}`}>{INSP_LABEL[s]}</span>;

export function Meter({ pct }: { pct: number }) {
  return <div className="meter" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${pct}%` }} /></div>;
}

// ---- private images -----------------------------------------------------
export function useFileUrl(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    setUrl(null);
    fileUrl(path).then((u) => { if (live) setUrl(u); });
    return () => { live = false; };
  }, [path]);
  return url;
}

export function StoredImage({ path, alt, className }: { path: string | null | undefined; alt: string; className?: string }) {
  const url = useFileUrl(path);
  if (!url) return <span className="muted small">{path ? 'Loading…' : 'No image'}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}

/** Widen a box a little so a crop shows its surroundings, and keep it on the sheet. */
function padBox([x0, y0, x1, y1]: Box, pad = 0.02): Box {
  return [Math.max(0, x0 - pad), Math.max(0, y0 - pad), Math.min(1, x1 + pad), Math.min(1, y1 + pad)];
}

/**
 * A cropped view of part of a stored sheet image. The full image is positioned inside
 * a clipped frame, so no canvas work (or extra upload) is needed.
 */
export function DrawingCrop({ path, box, label, onOpen }: { path: string | null; box: Box; label: string; onOpen: () => void }) {
  const url = useFileUrl(path);
  const [ratio, setRatio] = useState<number | null>(null); // sheet width / height
  const [x0, y0, x1, y1] = padBox(box);
  const w = x1 - x0, h = y1 - y0;
  return (
    <button type="button" className="crop" onClick={onOpen} aria-label={`Open drawing: ${label}`}>
      <span className="crop-frame" style={{ aspectRatio: ratio ? `${w * ratio} / ${h}` : '4 / 3' }}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" loading="lazy" onLoad={(e) => setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
            style={{ width: `${100 / w}%`, height: `${100 / h}%`, left: `${(-x0 / w) * 100}%`, top: `${(-y0 / h) * 100}%` }} />
        ) : <span className="muted small" style={{ padding: 8 }}>Loading…</span>}
      </span>
      <span className="crop-label small">{label}</span>
    </button>
  );
}

export function SheetViewer({ path, title, focus, onClose }: { path: string | null; title: string; focus?: Box; onClose: () => void }) {
  const url = useFileUrl(path);
  const fb = focus ? padBox(focus) : null;
  const [zoom, setZoom] = useState(fb ? Math.min(6, Math.max(1, 0.9 / Math.max(fb[2] - fb[0], fb[3] - fb[1]))) : 1);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  // Open scrolled to the focus area.
  const onImg = (img: HTMLImageElement) => {
    const el = scroller.current;
    if (!el || !fb) return;
    el.scrollLeft = fb[0] * img.clientWidth - 12;
    el.scrollTop = fb[1] * img.clientHeight - 12;
  };
  return (
    <div className="viewer" role="dialog" aria-label={title}>
      <div className="viewer-bar">
        <strong className="grow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</strong>
        <button className="btn btn-sm" onClick={() => setZoom((z) => Math.max(1, z / 1.5))} aria-label="Zoom out">−</button>
        <span className="num small">{Math.round(zoom * 100)}%</span>
        <button className="btn btn-sm" onClick={() => setZoom((z) => Math.min(6, z * 1.5))} aria-label="Zoom in">+</button>
        <button className="btn btn-sm" onClick={onClose}>Close</button>
      </div>
      <div className="viewer-img" ref={scroller}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url ? <img src={url} alt={title} style={{ width: `${zoom * 100}%` }} onLoad={(e) => onImg(e.currentTarget)} /> : <p className="muted" style={{ padding: 20 }}>Loading sheet…</p>}
      </div>
    </div>
  );
}

export function fmtDate(s: string | null | undefined) {
  if (!s) return '';
  const d = new Date(s.length === 10 ? s + 'T12:00:00' : s);
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
