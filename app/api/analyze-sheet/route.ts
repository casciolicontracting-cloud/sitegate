import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ROOM_KINDS, TOPICS } from '@/lib/template';

export const runtime = 'nodejs';
export const maxDuration = 120;

const DISCIPLINES = ['Architectural', 'Structural', 'Mechanical', 'Electrical', 'Plumbing', 'Site / civil', 'Energy', 'Other'];

const PROMPT = (text: string) => `You are reading one sheet from a residential construction drawing set for a custom home in Ontario, Canada.
Image 1 is the whole sheet. Images 2-5 are its top-left, top-right, bottom-left and bottom-right quadrants at higher detail.
${text ? `Text extracted from the PDF (may be partial or out of order):\n<<<\n${text.slice(0, 8000)}\n>>>\n` : 'There is no text layer; read the images.'}

Reply with only one JSON object, no prose, in this shape:
{
  "sheet_number": string, "" if none,
  "title": string,
  "discipline": one of ${JSON.stringify(DISCIPLINES)},
  "revision": string as shown in the title block or revision table (the latest), "" if none,
  "topics": array of zero or more of ${JSON.stringify(TOPICS)} that this sheet gives information about,
  "features": object containing ONLY keys you see clear evidence for on this sheet:
    {"storeys": integer above-grade storeys, "foundation": "basement"|"walkout"|"crawl"|"slab",
     "walls": "poured"|"icf"|"block", "garage": "attached"|"detached"|"none",
     "cladding": array of "brick"|"stone"|"stucco"|"siding", "roof": "asphalt"|"metal"|"other",
     "heating": "gas_forced"|"heat_pump"|"electric"|"boiler", "gas": boolean, "hrv": boolean,
     "fireplace": "none"|"gas"|"wood", "servicing": "municipal"|"septic_well", "bathrooms": integer},
  "notes": up to 15 objects {"topic": one value from the topics list, "text": a specific requirement from the sheet condensed to under 140 characters (sizes, materials, spacing, ratings, elevations, schedules), "where": detail or section reference, "" if none, "code": the Ontario Building Code clause number the sheet cites for it (e.g. "9.8.8.3"), "" if none, "box": location of that information},
  "regions": up to 12 objects, one per distinct drawing view on the sheet (floor plan, elevation, wall or building section, detail, schedule, legend, general notes block):
    {"topic": the one value from the topics list it is most useful for, "label": short name as titled on the sheet (e.g. "Typical wall section 2/A5", "Window schedule"), "box": its outline},
  "rooms": for floor plan sheets only, up to 40 objects, one per labelled room or space:
    {"name": room label as written (e.g. "Ensuite", "Bedroom 2", "Mud room"), "level": the floor it is on as titled (e.g. "Basement", "Ground floor", "Second floor"),
     "kind": one of ${JSON.stringify(ROOM_KINDS)}, "box": the room's outline}; [] for other sheets,
  "questions": up to 5 short strings naming information that is unclear, conflicting, illegible or missing that a site supervisor should raise with the designer
}
Every "box" is [x0, y0, x1, y1] in Image 1 (the whole sheet) as fractions from 0 to 1, origin at the top-left, x to the right and y down. Make it tight around the item.
Only report what is on the sheet. Do not judge Building Code compliance.`;

type Json = Record<string, unknown>;

function pickJson(text: string): Json {
  const a = text.indexOf('{');
  const b = text.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('The analysis did not return JSON.');
  return JSON.parse(text.slice(a, b + 1));
}

const oneOf = <T extends string>(v: unknown, opts: readonly T[]) => (typeof v === 'string' && (opts as readonly string[]).includes(v) ? (v as T) : undefined);

/** A valid [x0, y0, x1, y1] box within the sheet, or undefined. */
function cleanBox(v: unknown): [number, number, number, number] | undefined {
  if (!Array.isArray(v) || v.length !== 4 || !v.every((n) => typeof n === 'number' && Number.isFinite(n))) return undefined;
  const [a, b, c, d] = (v as number[]).map((n) => Math.min(1, Math.max(0, n)));
  const box: [number, number, number, number] = [Math.min(a, c), Math.min(b, d), Math.max(a, c), Math.max(b, d)];
  return box[2] - box[0] >= 0.01 && box[3] - box[1] >= 0.01 ? box.map((n) => Math.round(n * 1000) / 1000) as typeof box : undefined;
}
const isTopic = (v: unknown) => (TOPICS as readonly string[]).includes(String(v));

function cleanFeatures(raw: unknown): Json {
  const x = (raw && typeof raw === 'object' ? raw : {}) as Json;
  const out: Json = {};
  const int = (v: unknown, lo: number, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : undefined);
  const set = (k: string, v: unknown) => { if (v !== undefined) out[k] = v; };
  set('storeys', int(x.storeys, 1, 4));
  set('bathrooms', int(x.bathrooms, 0, 10));
  set('foundation', oneOf(x.foundation, ['basement', 'walkout', 'crawl', 'slab'] as const));
  set('walls', oneOf(x.walls, ['poured', 'icf', 'block'] as const));
  set('garage', oneOf(x.garage, ['attached', 'detached', 'none'] as const));
  set('roof', oneOf(x.roof, ['asphalt', 'metal', 'other'] as const));
  set('heating', oneOf(x.heating, ['gas_forced', 'heat_pump', 'electric', 'boiler'] as const));
  set('fireplace', oneOf(x.fireplace, ['none', 'gas', 'wood'] as const));
  set('servicing', oneOf(x.servicing, ['municipal', 'septic_well'] as const));
  if (typeof x.gas === 'boolean') out.gas = x.gas;
  if (typeof x.hrv === 'boolean') out.hrv = x.hrv;
  if (Array.isArray(x.cladding)) {
    const c = x.cladding.filter((v): v is string => ['brick', 'stone', 'stucco', 'siding'].includes(String(v)));
    if (c.length) out.cladding = [...new Set(c)];
  }
  return out;
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI analysis is not set up. Add ANTHROPIC_API_KEY in the Vercel project settings, or enter sheet details manually.' }, { status: 501 });

  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Sign in again to analyze drawings.' }, { status: 401 });

  let body: { sheetId?: string; images?: string[]; text?: string; locationsOnly?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Bad request.' }, { status: 400 }); }
  const images = (body.images || []).filter((s) => typeof s === 'string' && s.length > 100).slice(0, 5);
  if (!body.sheetId || !images.length) return NextResponse.json({ error: 'Missing sheet or images.' }, { status: 400 });

  // Act as the signed-in user so row-level security decides access to the sheet.
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: sheet, error: sheetErr } = await db.from('sheets').select('id, project_id').eq('id', body.sheetId).single();
  if (sheetErr || !sheet) return NextResponse.json({ error: 'Sheet not found, or you are not on this project.' }, { status: 404 });

  const content = [
    ...images.map((data) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } })),
    { type: 'text', text: PROMPT(body.text || '') },
  ];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens: 10000, messages: [{ role: 'user', content }] }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    await db.from('sheets').update({ status: 'failed' }).eq('id', sheet.id);
    return NextResponse.json({ error: `Claude API error ${res.status}. ${detail.slice(0, 300)}` }, { status: 502 });
  }
  const msg = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = (msg.content || []).filter((c) => c.type === 'text').map((c) => c.text || '').join('');

  let parsed: Json;
  try { parsed = pickJson(text); } catch (e) {
    await db.from('sheets').update({ status: 'failed' }).eq('id', sheet.id);
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }

  const topics = Array.isArray(parsed.topics) ? parsed.topics.filter((t): t is string => (TOPICS as readonly string[]).includes(String(t))) : [];
  const notes = Array.isArray(parsed.notes) ? parsed.notes.slice(0, 15).flatMap((n) => {
    const o = (n || {}) as Json;
    const topic = String(o.topic || '');
    const t = String(o.text || '').slice(0, 200).trim();
    const box = cleanBox(o.box);
    const code = String(o.code || '').replace(/[^0-9A-Za-z. -]/g, '').slice(0, 30).trim();
    return t && isTopic(topic) ? [{ topic, text: t, where: String(o.where || '').slice(0, 80), keep: true, ...(box ? { box } : {}), ...(code ? { code } : {}) }] : [];
  }) : [];
  const questions = Array.isArray(parsed.questions) ? parsed.questions.slice(0, 5).map((q) => String(q).slice(0, 240)).filter(Boolean) : [];
  const regions = Array.isArray(parsed.regions) ? parsed.regions.slice(0, 12).flatMap((r) => {
    const o = (r || {}) as Json;
    const box = cleanBox(o.box);
    const label = String(o.label || '').slice(0, 80).trim();
    return box && label && isTopic(o.topic) ? [{ topic: String(o.topic), label, box }] : [];
  }) : [];
  const rooms = Array.isArray(parsed.rooms) ? parsed.rooms.slice(0, 40).flatMap((r) => {
    const o = (r || {}) as Json;
    const name = String(o.name || '').slice(0, 60).trim();
    const box = cleanBox(o.box);
    return name ? [{ name, level: String(o.level || '').slice(0, 40).trim(), kind: oneOf(o.kind, ROOM_KINDS) || 'other', ...(box ? { box } : {}) }] : [];
  }) : [];

  const full = {
    number: String(parsed.sheet_number || '').slice(0, 40),
    title: String(parsed.title || '').slice(0, 160),
    discipline: oneOf(parsed.discipline, DISCIPLINES) || 'Other',
    revision: String(parsed.revision || '').slice(0, 40),
    topics: [...new Set(topics)],
    notes,
    questions,
    regions,
    rooms,
    features: cleanFeatures(parsed.features),
    status: 'analyzed',
    analyzed_at: new Date().toISOString(),
  };
  // A locations-only re-read keeps the sheet details a person already confirmed.
  const update = body.locationsOnly ? { notes, regions, rooms, analyzed_at: full.analyzed_at } : full;
  const { data: saved, error: upErr } = await db.from('sheets').update(update).eq('id', sheet.id).select('*').single();
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
  return NextResponse.json({ sheet: saved });
}

export async function GET() {
  return NextResponse.json({ enabled: !!process.env.ANTHROPIC_API_KEY });
}
