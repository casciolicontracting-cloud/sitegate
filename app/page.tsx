'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RequireAuth, signOut } from '@/components/Auth';
import { Mark, fmtDate, toastError } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/lib/types';

const STAGE_LABEL = { drawings: 'Uploading drawings', review: 'Reviewing drawings', active: 'Under construction' } as const;

export default function Home() {
  return <RequireAuth><Projects /></RequireAuth>;
}

function Projects() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', municipality: '', permit_no: '', owner_name: '' });

  useEffect(() => {
    supabase().from('projects').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) toastError(error.message);
      setProjects((data || []) as Project[]);
    });
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data: auth } = await supabase().auth.getUser();
      const { data, error } = await supabase().from('projects')
        .insert({ ...form, created_by: auth.user?.id, stage: 'drawings' }).select('id').single();
      if (error) throw error;
      router.push(`/projects/${data.id}`);
    } catch (err) {
      toastError(err);
      setBusy(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <header className="topbar">
        <div className="wrap">
          <Link href="/" className="brand"><Mark />SiteGate</Link>
          <span className="grow" />
          <button className="btn btn-sm btn-ghost" onClick={signOut}>Sign out</button>
        </div>
      </header>
      <main className="wrap stack-lg">
        <div className="section-head">
          <h1>Projects</h1>
          {!creating && <button className="btn btn-primary" onClick={() => setCreating(true)}>New project</button>}
        </div>

        {creating && (
          <form className="panel-box stack" onSubmit={create}>
            <h2>New project</h2>
            <p className="muted small">Next you&apos;ll upload the drawing set. SiteGate reads each sheet and builds the construction plan from it.</p>
            <div className="form-grid">
              <label className="field"><span>Project name</span><input id="p-name" type="text" value={form.name} onChange={set('name')} placeholder="190 Woodview – Custom Home" required /></label>
              <label className="field"><span>Site address</span><input id="p-address" type="text" value={form.address} onChange={set('address')} /></label>
              <label className="field"><span>Municipality</span><input id="p-muni" type="text" value={form.municipality} onChange={set('municipality')} placeholder="City of Hamilton" /></label>
              <label className="field"><span>Building permit no.</span><input id="p-permit" type="text" value={form.permit_no} onChange={set('permit_no')} /></label>
              <label className="field"><span>Owner / client</span><input id="p-owner" type="text" value={form.owner_name} onChange={set('owner_name')} /></label>
            </div>
            <div className="row">
              <button className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create and upload drawings'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
            </div>
          </form>
        )}

        {projects === null ? <div className="empty">Loading projects…</div> : projects.length === 0 && !creating ? (
          <div className="panel-box empty stack" style={{ alignItems: 'center' }}>
            <h2>No projects yet</h2>
            <p>Start a project, upload its drawings, and SiteGate builds the phase-by-phase plan with stage gates and OBC references.</p>
            <button className="btn btn-primary" onClick={() => setCreating(true)}>New project</button>
          </div>
        ) : (
          <div className="list">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="item" style={{ textDecoration: 'none' }}>
                <div className="grow">
                  <div className="t">{p.name}</div>
                  <div className="s">{[p.address, p.municipality, p.permit_no && `Permit ${p.permit_no}`].filter(Boolean).join(' · ') || 'No address yet'}</div>
                </div>
                <div className="stack" style={{ alignItems: 'flex-end', gap: 4 }}>
                  <span className={`pill ${p.stage === 'active' ? 'go' : 'blue'}`}>{STAGE_LABEL[p.stage]}</span>
                  <span className="s muted small">Started {fmtDate(p.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
