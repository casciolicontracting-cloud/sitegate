'use client';

import { useEffect, useState, type ReactNode } from 'react';
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
  if (session === undefined) return <div className="empty">Loading…</div>;
  if (!session) return <SignIn />;
  return <>{children}<Toaster /></>;
}

function SignIn() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const db = supabase();
    try {
      if (mode === 'in') {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await db.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) setMsg({ text: `Check ${email} for a confirmation link, then sign in.`, bad: false });
      }
    } catch (err) {
      setMsg({ text: (err as Error).message, bad: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="brand"><Mark />SiteGate</div>
      <p className="muted">Stage-gated checklists for Ontario custom homes, built from your drawings.</p>
      <form className="panel-box stack" onSubmit={submit}>
        <h2>{mode === 'in' ? 'Sign in' : 'Create your account'}</h2>
        {mode === 'up' && (
          <label className="field"><span>Your name</span><input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" /></label>
        )}
        <label className="field"><span>Email</span><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
        <label className="field"><span>Password</span><input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} /></label>
        {msg && <p className={`notice ${msg.bad ? 'bad' : 'info'}`}>{msg.text}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Working…' : mode === 'in' ? 'Sign in' : 'Create account'}</button>
        <button type="button" className="btn-link" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setMsg(null); }}>
          {mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}
        </button>
      </form>
    </div>
  );
}

export async function signOut() {
  await supabase().auth.signOut();
}
