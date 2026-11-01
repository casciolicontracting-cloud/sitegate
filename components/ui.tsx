'use client';

import { useEffect, useState } from 'react';
import { fileUrl } from '@/lib/supabase';
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

export function SheetViewer({ path, title, onClose }: { path: string | null; title: string; onClose: () => void }) {
  const url = useFileUrl(path);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="viewer" role="dialog" aria-label={title}>
      <div className="viewer-bar">
        <strong className="grow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</strong>
        <button className="btn btn-sm" onClick={() => setZoom((z) => Math.max(1, z / 1.5))} aria-label="Zoom out">−</button>
        <span className="num small">{Math.round(zoom * 100)}%</span>
        <button className="btn btn-sm" onClick={() => setZoom((z) => Math.min(6, z * 1.5))} aria-label="Zoom in">+</button>
        <button className="btn btn-sm" onClick={onClose}>Close</button>
      </div>
      <div className="viewer-img">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url ? <img src={url} alt={title} style={{ width: `${zoom * 100}%` }} /> : <p className="muted" style={{ padding: 20 }}>Loading sheet…</p>}
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
