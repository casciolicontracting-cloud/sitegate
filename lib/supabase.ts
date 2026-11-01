'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
  }
  client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
  return client;
}

export const BUCKET = 'project-files';

const urlCache = new Map<string, { url: string; exp: number }>();

/** Signed URL for a private file, cached for most of its lifetime. */
export async function fileUrl(path: string | null | undefined, bucket = BUCKET): Promise<string | null> {
  if (!path) return null;
  const key = `${bucket}/${path}`;
  const hit = urlCache.get(key);
  if (hit && hit.exp > Date.now()) return hit.url;
  const { data, error } = await supabase().storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error || !data) return null;
  urlCache.set(key, { url: data.signedUrl, exp: Date.now() + 50 * 60 * 1000 });
  return data.signedUrl;
}

export async function uploadFile(path: string, blob: Blob, bucket = BUCKET): Promise<string> {
  const { error } = await supabase().storage.from(bucket).upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: true });
  if (error) throw error;
  urlCache.delete(`${bucket}/${path}`);
  return path;
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}
