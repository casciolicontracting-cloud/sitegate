'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { removeFiles, supabase, uploadPhotos } from './supabase';
import { buildPlan, type Plan } from './template';
import { Engine } from './status';
import type { Contact, Deficiency, Inspection, Note, Profile, Project, ProjectBundle, Sheet, TaskState } from './types';

export interface ProjectStore {
  data: ProjectBundle | null;
  plan: Plan | null;
  engine: Engine | null;
  loading: boolean;
  error: string | null;
  userId: string | null;
  reload: () => Promise<void>;
  updateProject: (patch: Partial<Project>) => Promise<void>;
  upsertSheet: (s: Partial<Sheet> & { id: string }) => Promise<void>;
  setSheetLocal: (s: Sheet) => void;
  deleteSheet: (id: string) => Promise<void>;
  saveTask: (key: string, patch: Partial<TaskState>) => Promise<void>;
  /** Tick every remaining check and verify, in one step. */
  completeTask: (key: string) => Promise<void>;
  saveInsp: (key: string, patch: Partial<Inspection>) => Promise<void>;
  addNote: (n: Partial<Note>) => Promise<void>;
  updateNote: (id: string, patch: Partial<Note>) => Promise<void>;
  addDef: (d: Partial<Deficiency>) => Promise<Deficiency>;
  updateDef: (id: string, patch: Partial<Deficiency>) => Promise<void>;
  /** Photos from the camera or gallery, compressed and uploaded. */
  addTaskPhotos: (key: string, files: File[]) => Promise<void>;
  deleteTaskPhoto: (key: string, path: string) => Promise<void>;
  addDefPhotos: (id: string, files: File[]) => Promise<void>;
  deleteDefPhoto: (id: string, path: string) => Promise<void>;
  saveContact: (c: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  log: (action: string, detail?: Record<string, unknown>) => void;
}

function fail(e: { message: string } | null) {
  if (e) throw new Error(e.message);
}

export function useProject(projectId: string): ProjectStore {
  const [data, setData] = useState<ProjectBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const dataRef = useRef<ProjectBundle | null>(null);
  dataRef.current = data;

  const reload = useCallback(async () => {
    const db = supabase();
    try {
      const { data: auth } = await db.auth.getUser();
      setUserId(auth.user?.id || null);
      const [p, sh, ts, ins, co, no, de, prof] = await Promise.all([
        db.from('projects').select('*').eq('id', projectId).single(),
        db.from('sheets').select('*').eq('project_id', projectId).order('sort'),
        db.from('task_states').select('*').eq('project_id', projectId),
        db.from('inspections').select('*').eq('project_id', projectId),
        db.from('contacts').select('*').eq('project_id', projectId).order('trade'),
        db.from('notes').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        db.from('deficiencies').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        // Team members can see every profile; row-level security limits this to people they work with.
        db.from('profiles').select('id, full_name, company'),
      ]);
      fail(p.error);
      setData({
        project: p.data as Project,
        sheets: (sh.data || []) as Sheet[],
        tasks: Object.fromEntries(((ts.data || []) as TaskState[]).map((t) => [t.task_key, t])),
        insps: Object.fromEntries(((ins.data || []) as Inspection[]).map((i) => [i.insp_key, i])),
        contacts: (co.data || []) as Contact[],
        notes: (no.data || []) as Note[],
        defs: (de.data || []) as Deficiency[],
        profiles: Object.fromEntries(((prof.data || []) as Profile[]).map((x) => [x.id, x])),
      });
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    reload();
    const onFocus = () => { if (document.visibilityState === 'visible') reload(); };
    document.addEventListener('visibilitychange', onFocus);
    return () => document.removeEventListener('visibilitychange', onFocus);
  }, [reload]);

  const patch = useCallback((fn: (d: ProjectBundle) => ProjectBundle) => {
    setData((d) => (d ? fn(d) : d));
  }, []);

  const log = useCallback((action: string, detail: Record<string, unknown> = {}) => {
    void supabase().from('activity').insert({ project_id: projectId, action, detail, actor: userId || undefined }).then(() => {});
  }, [projectId, userId]);

  const plan = useMemo(() => (data ? buildPlan(data.project.features) : null), [data]);
  const engine = useMemo(() => (data && plan ? new Engine(plan, data) : null), [data, plan]);

  const store: ProjectStore = {
    data, plan, engine, loading, error, userId, reload, log,

    async updateProject(p) {
      patch((d) => ({ ...d, project: { ...d.project, ...p } }));
      const { error } = await supabase().from('projects').update(p).eq('id', projectId);
      fail(error);
    },

    async upsertSheet(s) {
      patch((d) => {
        const i = d.sheets.findIndex((x) => x.id === s.id);
        const sheets = [...d.sheets];
        if (i >= 0) sheets[i] = { ...sheets[i], ...s } as Sheet; else sheets.push(s as Sheet);
        return { ...d, sheets };
      });
      const { error } = await supabase().from('sheets').upsert({ ...s, project_id: projectId });
      fail(error);
    },

    setSheetLocal(s) {
      patch((d) => ({ ...d, sheets: d.sheets.map((x) => (x.id === s.id ? s : x)) }));
    },

    async deleteSheet(id) {
      const path = dataRef.current?.sheets.find((s) => s.id === id)?.image_path;
      patch((d) => ({ ...d, sheets: d.sheets.filter((s) => s.id !== id) }));
      const { error } = await supabase().from('sheets').delete().eq('id', id);
      fail(error);
      if (path) await supabase().storage.from('project-files').remove([path]);
    },

    async saveTask(key, p) {
      const cur = dataRef.current?.tasks[key];
      const next: TaskState = {
        project_id: projectId, task_key: key, checks: {}, photos: [], assignee_contact: null, started_at: null,
        verified_by: null, verified_at: null, sheet_revs: {}, ...cur, ...p, updated_at: new Date().toISOString(),
      };
      patch((d) => ({ ...d, tasks: { ...d.tasks, [key]: next } }));
      const { error } = await supabase().from('task_states').upsert(next);
      fail(error);
    },

    async completeTask(key) {
      if (!plan || !engine) return;
      const t = plan.tasks[key];
      const issues = engine.completeIssues(t);
      if (issues.length) throw new Error(issues.join('. '));
      const now = new Date().toISOString();
      const checks = { ...(dataRef.current?.tasks[key]?.checks || {}), ...Object.fromEntries(t.checks.map((c) => [c.id, true])) };
      const sheetRevs = Object.fromEntries(engine.linkedSheets(t).map((s) => [s.id, s.revision || '']));
      await store.saveTask(key, {
        checks, started_at: dataRef.current?.tasks[key]?.started_at || now, verified_at: now, verified_by: userId, sheet_revs: sheetRevs,
      });
      log('task_verified', { task: key });
    },

    async saveInsp(key, p) {
      const cur = dataRef.current?.insps[key];
      const next: Inspection = {
        project_id: projectId, insp_key: key, status: 'pending', requested_on: null, scheduled_on: null, inspector: null,
        notes: null, updated_by: userId, ...cur, ...p, updated_at: new Date().toISOString(),
      };
      patch((d) => ({ ...d, insps: { ...d.insps, [key]: next } }));
      const { error } = await supabase().from('inspections').upsert(next);
      fail(error);
    },

    async addNote(n) {
      const { data: row, error } = await supabase().from('notes').insert({ ...n, project_id: projectId }).select('*').single();
      fail(error);
      patch((d) => ({ ...d, notes: [row as Note, ...d.notes] }));
    },

    async updateNote(id, p) {
      patch((d) => ({ ...d, notes: d.notes.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
      const { error } = await supabase().from('notes').update(p).eq('id', id);
      fail(error);
    },

    async addDef(x) {
      const { data: row, error } = await supabase().from('deficiencies').insert({ ...x, project_id: projectId }).select('*').single();
      fail(error);
      patch((d) => ({ ...d, defs: [row as Deficiency, ...d.defs] }));
      return row as Deficiency;
    },

    async updateDef(id, p) {
      patch((d) => ({ ...d, defs: d.defs.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
      const { error } = await supabase().from('deficiencies').update(p).eq('id', id);
      fail(error);
    },

    async addTaskPhotos(key, files) {
      const paths = await uploadPhotos(`${projectId}/photos/${key}`, files);
      const st = dataRef.current?.tasks[key];
      await store.saveTask(key, { photos: [...(st?.photos || []), ...paths], started_at: st?.started_at || new Date().toISOString() });
    },

    async deleteTaskPhoto(key, path) {
      await store.saveTask(key, { photos: (dataRef.current?.tasks[key]?.photos || []).filter((p) => p !== path) });
      await removeFiles([path]);
    },

    async addDefPhotos(id, files) {
      const paths = await uploadPhotos(`${projectId}/deficiencies/${id}`, files);
      const d = dataRef.current?.defs.find((x) => x.id === id);
      await store.updateDef(id, { photos: [...(d?.photos || []), ...paths] });
    },

    async deleteDefPhoto(id, path) {
      const d = dataRef.current?.defs.find((x) => x.id === id);
      // Clear the old single-photo column too, so a deleted photo never comes back.
      await store.updateDef(id, { photos: (d?.photos || []).filter((p) => p !== path), ...(d?.photo_path === path ? { photo_path: null } : {}) });
      await removeFiles([path]);
    },

    async saveContact(c) {
      const { data: row, error } = await supabase().from('contacts').upsert({ ...c, project_id: projectId }).select('*').single();
      fail(error);
      patch((d) => {
        const exists = d.contacts.some((x) => x.id === (row as Contact).id);
        return { ...d, contacts: exists ? d.contacts.map((x) => (x.id === (row as Contact).id ? (row as Contact) : x)) : [...d.contacts, row as Contact] };
      });
    },

    async deleteContact(id) {
      patch((d) => ({ ...d, contacts: d.contacts.filter((x) => x.id !== id) }));
      const { error } = await supabase().from('contacts').delete().eq('id', id);
      fail(error);
    },
  };
  return store;
}
