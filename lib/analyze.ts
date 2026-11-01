'use client';

// Sends one sheet to /api/analyze-sheet and returns the saved, analyzed sheet.

import { analysisImages } from './pdf';
import { fileUrl, supabase } from './supabase';
import type { Sheet } from './types';

export async function aiEnabled(): Promise<boolean> {
  try {
    const j = await fetch('/api/analyze-sheet').then((r) => r.json());
    return !!j.enabled;
  } catch {
    return false;
  }
}

/** `locationsOnly` re-reads rooms, drawing views and spec locations without touching confirmed sheet details. */
export async function analyzeSheet(s: Sheet, image?: Blob, locationsOnly = false): Promise<Sheet> {
  const { data: sess } = await supabase().auth.getSession();
  const src = image || (await fileUrl(s.image_path));
  if (!src) throw new Error('Sheet image missing');
  const images = await analysisImages(src);
  const r = await fetch('/api/analyze-sheet', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${sess.session?.access_token}` },
    body: JSON.stringify({ sheetId: s.id, images, text: s.text_layer || '', locationsOnly }),
  });
  const j = await r.json().catch(() => ({ error: `Analysis failed (${r.status})` }));
  if (!r.ok) throw new Error(j.error || `Analysis failed (${r.status})`);
  return j.sheet as Sheet;
}
