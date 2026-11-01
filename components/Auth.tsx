'use client';

// Sign-in is a name plus the shared team access code. Each device signs in
// anonymously with Supabase, then redeems the code (see migration 0002), which
// makes it a team member with access to every project.

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Mark, Toaster } from './ui';

export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    const db = supabase();
    db.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = db.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return session;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const session = useSession();
  const userId = session?.user.id;
  const [team, setTeam] = useState<boolean | undefined>(undefined);

  const check = useCallback(async () => {
    if (!userId) { setTeam(false); return; }
    const { data, error } = await supabase().rpc('is_team_member');
    setTeam(!error && data === true);
  }, [userId]);

  useEffect(() => { if (session !== undefined) void check(); }, [session, check]);

  if (session === undefined || (session && team === undefined)) return <div className="empty">Loading…</div>;
  if (!session || !team) return <AccessCode onJoined={() => setTeam(true)} />;
  return <>{children}<Toaster /></>;
}

const NAME_KEY = 'sitegate.name';

function AccessCode({ onJoined }: { onJoined: () => void }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try { setName(localStorage.getItem(NAME_KEY) || ''); } catch { /* storage blocked */ }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const db = supabase();
    try {
      try { localStorage.setItem(NAME_KEY, name.trim()); } catch { /* storage blocked */ }
      const { data: cur } = await db.auth.getSession();
      if (!cur.session) {
        const { error } = await db.auth.signInAnonymously({ options: { data: { full_name: name.trim() } } });
        if (error) {
          throw new Error(/anonymous/i.test(error.message)
            ? 'Code sign-in is not switched on yet. In Supabase, turn on Authentication → Sign In / Providers → Allow anonymous sign-ins.'
            : error.message);
        }
      }
      const { data, error } = await db.rpc('redeem_access_code', { code, full_name: name.trim() });
      if (error) throw error;
      if (data !== true) throw new Error('That access code isn’t right. Check it with the site supervisor.');
      onJoined();
    } catch (err) {
      setMsg((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="brand"><Mark />SiteGate</div>
      <p className="muted">Stage-gated checklists for Ontario custom homes, built from your drawings.</p>
      <form className="panel-box stack" onSubmit={submit}>
        <h2>Enter the job site</h2>
        <label className="field"><span>Your name</span><input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" placeholder="Shown on your sign-offs" /></label>
        <label className="field"><span>Access code</span>
          <input id="code" type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required
            autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="XXXX-XXXX-XXXX" className="mono" />
        </label>
        {msg && <p className="notice bad">{msg}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Checking…' : 'Enter'}</button>
        <p className="small muted">Ask the site supervisor for the code. You stay signed in on this device.</p>
      </form>
    </div>
  );
}

export async function signOut() {
  await supabase().auth.signOut();
}
