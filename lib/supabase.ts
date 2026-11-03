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

export async function removeFiles(paths: string[], bucket = BUCKET): Promise<void> {
  if (!paths.length) return;
  const { error } = await supabase().storage.from(bucket).remove(paths);
  if (error) throw error;
  paths.forEach((p) => urlCache.delete(`${bucket}/${p}`));
}

/**
 * Shrink a site photo to a JPEG of at most `max` px on the long side before upload:
 * gallery photos can be 10+ MB (or HEIC on iPhone), which is slow on site and over
 * the bucket's size and type limits. Falls back to the original if the browser can't decode it.
 */
export async function compressPhoto(file: File, max = 2048, quality = 0.85): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality));
    if (blob) return blob;
  } catch { /* use the original */ }
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error(`${file.name} isn't a photo this browser can read. Try a JPEG or PNG.`);
  return file;
}

/** Upload site photos under a folder; returns their storage paths in the same order. */
export async function uploadPhotos(folder: string, files: File[]): Promise<string[]> {
  const out: string[] = [];
  for (const f of files) out.push(await uploadFile(`${folder}/${newId()}.jpg`, await compressPhoto(f)));
  return out;
}
