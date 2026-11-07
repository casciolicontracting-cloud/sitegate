'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useProject } from '@/lib/useProject';
import { Setup } from './Setup';
import { Today } from './Today';
import { FlowChart, PhaseView } from './Flow';
import { InspPanel, TaskPanel } from './TaskPanel';
import { ContactsView, DeficienciesView, DrawingsView, InspectionsView, NotesView } from './Registers';
import { GanttView, PhotosView, TimelineView } from './Progress';
import { RoomsView } from './RoomsTab';
import { Mark } from './ui';

export type Tab = 'today' | 'flow' | 'gantt' | 'timeline' | 'photos' | 'rooms' | 'drawings' | 'inspections' | 'deficiencies' | 'notes' | 'contacts';

export interface Nav {
  tab: Tab;
  phase: string | null; // sub-selection: phase id (Plan), trade (Deficiencies) or room id (Rooms)
  go: (tab: Tab, phase?: string | null) => void;
  openTask: (key: string) => void;
  openInsp: (key: string) => void;
}

const TABS: Array<[Tab, string]> = [
  ['today', 'Today'], ['flow', 'Plan'], ['gantt', 'Gantt chart'], ['timeline', 'Timeline'], ['photos', 'Photos'],
  ['rooms', 'Rooms'], ['drawings', 'Drawings'], ['inspections', 'Inspections'],
  ['deficiencies', 'Deficiencies'], ['notes', 'Notes & questions'], ['contacts', 'Contacts'],
];

export function ProjectApp({ id }: { id: string }) {
  const store = useProject(id);
  // Start from the URL hash (this only renders in the browser, after sign-in), so a refresh or
  // shared link lands in the same place: #flow-phase-<phase id>, #deficiencies-trade-<trade>, #rooms-room-<room id>.
  const [start] = useState(() => {
    const [t, sub] = window.location.hash.slice(1).split(/-(?:phase|trade|room)-/);
    return TABS.some(([k]) => k === t) ? { tab: t as Tab, sub: sub ? decodeURIComponent(sub) : null } : { tab: 'today' as Tab, sub: null };
  });
  const [tab, setTab] = useState<Tab>(start.tab);
  const [phase, setPhase] = useState<string | null>(start.sub);
  const [panel, setPanel] = useState<{ kind: 'task' | 'insp'; key: string } | null>(null);

  useEffect(() => {
    const h = !phase ? tab : tab === 'flow' ? `${tab}-phase-${phase}` : tab === 'deficiencies' ? `${tab}-trade-${encodeURIComponent(phase)}` : tab === 'rooms' ? `${tab}-room-${phase}` : tab;
    history.replaceState(null, '', `#${h}`);
  }, [tab, phase]);

  const nav: Nav = {
    tab, phase,
    go: useCallback((t: Tab, ph: string | null = null) => { setTab(t); setPhase(ph); window.scrollTo({ top: 0 }); }, []),
    openTask: useCallback((key: string) => setPanel({ kind: 'task', key }), []),
    openInsp: useCallback((key: string) => setPanel({ kind: 'insp', key }), []),
  };

  const { data, engine, plan } = store;
  const active = data?.project.stage === 'active';
  const openDefs = data?.defs.filter((d) => d.status !== 'closed').length || 0;
  const openQs = data?.notes.filter((n) => n.kind === 'question' && !n.answer).length || 0;

  return (
    <>
      <header className="topbar">
        <div className="wrap">
          <Link href="/" className="brand" aria-label="All projects"><Mark /></Link>
          <span className="proj grow">{data?.project.name || 'Loading…'}</span>
          {active && engine && <span className="small num" style={{ opacity: 0.8 }}>{engine.projectProgress().pct}% complete</span>}
        </div>
      </header>
      {active && (
        <nav className="tabs" aria-label="Project sections">
          <div className="wrap" role="tablist">
            {TABS.map(([k, label]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => nav.go(k)}>
                {label}
                {k === 'deficiencies' && openDefs > 0 && <span className="count num">{openDefs}</span>}
                {k === 'notes' && openQs > 0 && <span className="count num">{openQs}</span>}
              </button>
            ))}
          </div>
        </nav>
      )}
      <main className="wrap">
        {store.loading && !data && <div className="empty">Loading project…</div>}
        {store.error && !data && <div className="notice bad">Couldn&apos;t load this project: {store.error}</div>}
        {data && !active && <Setup store={store} />}
        {data && active && engine && plan && (
          <>
            {tab === 'today' && <Today store={store} nav={nav} />}
            {tab === 'flow' && (phase && plan.byPhase[phase] ? <PhaseView store={store} nav={nav} phaseId={phase} /> : <FlowChart store={store} nav={nav} />)}
            {tab === 'gantt' && <GanttView store={store} nav={nav} />}
            {tab === 'timeline' && <TimelineView store={store} nav={nav} />}
            {tab === 'photos' && <PhotosView store={store} nav={nav} />}
            {tab === 'rooms' && <RoomsView store={store} nav={nav} />}
            {tab === 'drawings' && <DrawingsView store={store} nav={nav} />}
            {tab === 'inspections' && <InspectionsView store={store} nav={nav} />}
            {tab === 'deficiencies' && <DeficienciesView store={store} nav={nav} />}
            {tab === 'notes' && <NotesView store={store} nav={nav} />}
            {tab === 'contacts' && <ContactsView store={store} />}
          </>
        )}
      </main>
      {panel && data && plan && engine && panel.kind === 'task' && plan.tasks[panel.key] && (
        <TaskPanel store={store} nav={nav} taskKey={panel.key} onClose={() => setPanel(null)} />
      )}
      {panel && data && plan && engine && panel.kind === 'insp' && plan.insps[panel.key] && (
        <InspPanel store={store} nav={nav} inspKey={panel.key} onClose={() => setPanel(null)} />
      )}
    </>
  );
}
