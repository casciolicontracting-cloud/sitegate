// Rooms tab: room types, selection categories, starter suggestions and the rules that
// link a room's products to plan tasks. Pure functions only (unit tested in rooms.test.ts).
//
// Suggestions (starter items, rooms from the floor plans) only ever add what a person
// taps; nothing here decides whether a product or installation complies with code.

import { roomLabel, type Features, type Room as PlanRoom, type RoomKind } from './template';

export const ROOM_TYPES = [
  'bathroom', 'ensuite', 'powder', 'kitchen', 'bedroom', 'living', 'dining', 'office',
  'laundry', 'hall', 'basement', 'garage', 'mechanical', 'exterior', 'other',
] as const;
export type RoomType = (typeof ROOM_TYPES)[number];
export const ROOM_TYPE_LABEL: Record<RoomType, string> = {
  bathroom: 'Bathroom', ensuite: 'Ensuite', powder: 'Powder room', kitchen: 'Kitchen', bedroom: 'Bedroom',
  living: 'Living / family', dining: 'Dining', office: 'Office / den', laundry: 'Laundry / mudroom',
  hall: 'Hall / stair / foyer', basement: 'Basement', garage: 'Garage', mechanical: 'Mechanical',
  exterior: 'Exterior', other: 'Other',
};

export const CATEGORIES = [
  'floor_tile', 'wall_tile', 'shower_tile', 'waterproofing', 'floor_heating', 'thermostat',
  'flooring', 'paint', 'trim', 'countertop', 'cabinetry', 'plumbing', 'lighting', 'electrical',
  'ventilation', 'appliance', 'hardware', 'windows_doors', 'exterior', 'other',
] as const;
export type Category = (typeof CATEGORIES)[number];
export const CATEGORY_LABEL: Record<Category, string> = {
  floor_tile: 'Floor tile', wall_tile: 'Wall tile', shower_tile: 'Shower tile & grout',
  waterproofing: 'Shower waterproofing / membrane', floor_heating: 'In-floor heating', thermostat: 'Thermostat / controls',
  flooring: 'Flooring', paint: 'Paint', trim: 'Trim & doors', countertop: 'Countertop', cabinetry: 'Cabinets / vanity',
  plumbing: 'Plumbing fixtures', lighting: 'Lighting', electrical: 'Electrical devices', ventilation: 'Exhaust / ventilation',
  appliance: 'Appliances', hardware: 'Hardware & accessories', windows_doors: 'Windows & doors', exterior: 'Exterior finish', other: 'Other',
};

export const ITEM_STATUSES = ['tbd', 'selected', 'ordered', 'delivered', 'installed'] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];
export const ITEM_STATUS_LABEL: Record<ItemStatus, string> = {
  tbd: 'To choose', selected: 'Selected', ordered: 'Ordered', delivered: 'On site', installed: 'Installed',
};

export const DOC_KINDS = ['manual', 'install', 'spec', 'warranty'] as const;
export type DocKind = (typeof DOC_KINDS)[number];
export const DOC_KIND_LABEL: Record<DocKind, string> = {
  manual: 'Manual', install: 'Installation guide', spec: 'Spec sheet', warranty: 'Warranty',
};

export interface RoomDoc { path: string; name: string; kind: DocKind }

/** A room in the Rooms tab (table public.rooms). */
export interface SelRoom {
  id: string;
  project_id: string;
  name: string;
  room_type: RoomType;
  level: string;
  plan_room: string | null; // projects.features.rooms[].id this room matches
  sheet_ids: string[];
  notes: string | null;
  sort: number;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** A selection / product in a room (table public.room_items). */
export interface RoomItem {
  id: string;
  room_id: string;
  project_id: string;
  category: Category;
  name: string;
  location: string | null;
  manufacturer: string | null;
  product: string | null;
  colour: string | null;
  supplier: string | null;
  quantity: string | null;
  trade: string | null;
  status: ItemStatus;
  url: string | null;
  notes: string | null;
  documents: RoomDoc[];
  photos: string[];
  sort: number;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Starter { category: Category; name: string }
const s = (category: Category, name = ''): Starter => ({ category, name });

const FINISHED: Starter[] = [s('flooring'), s('trim', 'Doors & trim'), s('paint'), s('lighting')];
const BATH: Starter[] = [
  s('floor_tile'), s('wall_tile'), s('shower_tile'), s('waterproofing', 'Shower waterproofing'), s('floor_heating'),
  s('thermostat', 'Floor heat thermostat'), s('cabinetry', 'Vanity'), s('countertop', 'Vanity top'), s('plumbing', 'Toilet'),
  s('plumbing', 'Shower fixtures'), s('plumbing', 'Faucet'), s('ventilation', 'Exhaust fan'), s('lighting'),
  s('hardware', 'Accessories'), s('paint'),
];

/** Quick-add suggestions per room type. Each one adds an empty item for the user to fill in. */
export const STARTERS: Record<RoomType, Starter[]> = {
  bathroom: BATH,
  ensuite: BATH,
  powder: [s('floor_tile'), s('cabinetry', 'Vanity'), s('plumbing', 'Toilet'), s('plumbing', 'Faucet'), s('ventilation', 'Exhaust fan'), s('lighting'), s('hardware', 'Accessories'), s('paint')],
  kitchen: [
    s('cabinetry', 'Cabinets'), s('countertop'), s('wall_tile', 'Backsplash'), s('plumbing', 'Sink'), s('plumbing', 'Faucet'),
    s('appliance', 'Range / cooktop'), s('appliance', 'Fridge'), s('appliance', 'Dishwasher'), s('ventilation', 'Range hood'),
    s('hardware', 'Cabinet hardware'), s('lighting'), s('flooring'), s('paint'),
  ],
  bedroom: [...FINISHED, s('hardware', 'Closet system')],
  living: [...FINISHED, s('other', 'Fireplace')],
  dining: FINISHED,
  office: FINISHED,
  laundry: [s('floor_tile'), s('cabinetry'), s('plumbing', 'Laundry sink'), s('appliance', 'Washer'), s('appliance', 'Dryer'), s('ventilation', 'Dryer vent'), s('lighting'), s('paint')],
  hall: [...FINISHED, s('other', 'Stairs & railing')],
  basement: [...FINISHED, s('floor_heating')],
  garage: [s('windows_doors', 'Garage door'), s('electrical', 'Door opener'), s('lighting'), s('electrical', 'EV charger')],
  mechanical: [
    s('appliance', 'Furnace / heat pump'), s('appliance', 'Water heater'), s('ventilation', 'HRV / ERV'),
    s('thermostat', 'Main thermostat'), s('plumbing', 'Water treatment / softener'), s('electrical', 'Panel'),
  ],
  exterior: [s('exterior', 'Cladding'), s('exterior', 'Roofing'), s('windows_doors', 'Windows'), s('windows_doors', 'Front door'), s('lighting', 'Exterior lights'), s('exterior', 'Soffit, fascia & eaves')],
  other: [],
};

const key = (category: string, name: string) => `${category}|${name.trim().toLowerCase()}`;

/** Starter items for a room type that the room doesn't have yet (same category and name). */
export function missingStarters(type: RoomType, items: Pick<RoomItem, 'category' | 'name'>[]): Starter[] {
  const have = new Set(items.map((i) => key(i.category, i.name)));
  return (STARTERS[type] || []).filter((x) => !have.has(key(x.category, x.name)));
}

/** What the item is, for lists: its own name or its category. */
export const itemTitle = (i: Pick<RoomItem, 'category' | 'name'>) => i.name.trim() || CATEGORY_LABEL[i.category] || 'Item';

/** Room type for a room confirmed from the floor plans. */
export function typeForPlanRoom(r: Pick<PlanRoom, 'name' | 'kind' | 'level'>): RoomType {
  const n = r.name.toLowerCase();
  if (/ensuite|en-suite/.test(n)) return 'ensuite';
  if (/powder/.test(n)) return 'powder';
  if (/mud/.test(n)) return 'laundry';
  if (/exterior|outside|porch|deck/.test(n)) return 'exterior';
  const map: Record<RoomKind, RoomType> = {
    kitchen: 'kitchen', bathroom: 'bathroom', bedroom: 'bedroom', living: 'living', dining: 'dining', office: 'office',
    laundry: 'laundry', hall: 'hall', mechanical: 'mechanical', storage: 'other', garage: 'garage', other: 'other',
  };
  const t = map[r.kind] || 'other';
  if ((t === 'living' || t === 'other') && /basement|lower/i.test(r.level) && /rec|family|basement/.test(n)) return 'basement';
  return t;
}

export interface RoomSuggestion { name: string; level: string; room_type: RoomType; plan_room: string | null; sheet_ids: string[]; why: string }

/**
 * Rooms the user may want to add: every room confirmed from the floor plans that isn't
 * in the Rooms tab yet. With no confirmed rooms, a starter set from the house features
 * (kitchen, one per bathroom, laundry, mechanical, garage, exterior).
 */
export function suggestRooms(f: Partial<Features>, existing: Pick<SelRoom, 'name' | 'level' | 'plan_room'>[]): RoomSuggestion[] {
  const linked = new Set(existing.map((r) => r.plan_room).filter(Boolean));
  const named = new Set(existing.map((r) => `${r.level.trim().toLowerCase()}|${r.name.trim().toLowerCase()}`));
  const has = (name: string, level: string) => named.has(`${level.trim().toLowerCase()}|${name.trim().toLowerCase()}`);
  const plan = Array.isArray(f.rooms) ? f.rooms : [];
  if (plan.length) {
    return plan
      .filter((r) => !linked.has(r.id) && !has(r.name, r.level))
      .map((r) => ({ name: r.name, level: r.level, room_type: typeForPlanRoom(r), plan_room: r.id, sheet_ids: r.sheet ? [r.sheet] : [], why: `Floor plans: ${roomLabel(r)}` }));
  }
  const out: RoomSuggestion[] = [];
  const add = (name: string, level: string, room_type: RoomType) => {
    if (!has(name, level)) out.push({ name, level, room_type, plan_room: null, sheet_ids: [], why: 'Typical for this house' });
  };
  add('Kitchen', 'Main floor', 'kitchen');
  const baths = Math.max(0, Math.min(10, Math.round(Number(f.bathrooms ?? 0))));
  for (let n = 1; n <= baths; n++) add(`Bathroom ${n}`, '', 'bathroom');
  add('Laundry', '', 'laundry');
  add('Mechanical room', f.foundation === 'basement' || f.foundation === 'walkout' ? 'Basement' : '', 'mechanical');
  if (f.garage && f.garage !== 'none') add('Garage', '', 'garage');
  add('Exterior', 'Exterior', 'exterior');
  return out;
}

/** Rooms grouped by level, levels in the order they first appear (by sort). */
export function groupByLevel<R extends Pick<SelRoom, 'level' | 'sort' | 'name'>>(rooms: R[]): Array<{ level: string; rooms: R[] }> {
  const sorted = [...rooms].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));
  const out: Array<{ level: string; rooms: R[] }> = [];
  for (const r of sorted) {
    const lv = r.level.trim();
    let g = out.find((x) => x.level.toLowerCase() === lv.toLowerCase());
    if (!g) out.push((g = { level: lv, rooms: [] }));
    g.rooms.push(r);
  }
  // Rooms without a level go last.
  return [...out.filter((g) => g.level), ...out.filter((g) => !g.level)];
}

/** Items grouped by category in the standard category order. */
export function groupByCategory<I extends Pick<RoomItem, 'category' | 'sort' | 'name'>>(items: I[]): Array<{ category: Category; items: I[] }> {
  return CATEGORIES
    .map((category) => ({ category, items: items.filter((i) => i.category === category).sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name)) }))
    .filter((g) => g.items.length > 0);
}

/** Item and document counts for one room. */
export function roomCounts(items: Pick<RoomItem, 'room_id' | 'documents' | 'photos'>[], roomId: string) {
  const mine = items.filter((i) => i.room_id === roomId);
  return {
    items: mine.length,
    docs: mine.reduce((n, i) => n + (i.documents?.length || 0), 0),
    photos: mine.reduce((n, i) => n + (i.photos?.length || 0), 0),
  };
}

/** Next sort value after the existing ones. */
export const nextSort = (rows: Array<{ sort: number }>) => rows.reduce((m, r) => Math.max(m, r.sort), 0) + 1;

/** "https://" added to a typed web address; null when blank. */
export function normalizeUrl(u: string | null | undefined): string | null {
  const t = (u || '').trim();
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

/** Storage folder for an item's files (the bucket's policies key on the first folder = project id). */
export const itemFolder = (projectId: string, roomId: string, itemId: string) => `${projectId}/rooms/${roomId}/${itemId}`;

/** A safe storage file name for an uploaded document, keeping its extension. */
export function docFileName(original: string, id: string): string {
  const ext = (original.match(/\.([a-z0-9]{1,5})$/i)?.[1] || 'pdf').toLowerCase();
  const base = original.replace(/\.[^.]*$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'document';
  return `${base}-${id.slice(0, 8)}.${ext}`;
}

// ---- products on plan tasks ---------------------------------------------

/** Which categories each plan task shows, by task key prefix. 'all' shows every item in the task's rooms. */
const TASK_PRODUCTS: Array<{ prefix: string; categories: Category[] | 'all'; types?: RoomType[] }> = [
  { prefix: 'n-bath-', categories: 'all', types: ['bathroom', 'ensuite', 'powder'] },
  { prefix: 'n-kitchen', categories: 'all', types: ['kitchen'] },
  { prefix: 'n-floor', categories: ['flooring', 'floor_tile', 'floor_heating'] },
  { prefix: 'n-trim', categories: ['trim', 'hardware'] },
  { prefix: 'n-paint', categories: ['paint'] },
  { prefix: 'm-plumb', categories: ['plumbing'] },
  { prefix: 'z-plumb', categories: ['plumbing', 'appliance'] },
  { prefix: 'm-elec', categories: ['electrical', 'lighting', 'floor_heating', 'thermostat'] },
  { prefix: 'm-hvac', categories: ['ventilation', 'floor_heating', 'thermostat'] },
  { prefix: 'm-hrv', categories: ['ventilation'] },
  { prefix: 'z-hvac', categories: ['ventilation', 'thermostat'] },
  { prefix: 'd-hang', categories: ['waterproofing'] },
  { prefix: 'e-windows', categories: ['windows_doors'] },
  { prefix: 'e-doors', categories: ['windows_doors'] },
  { prefix: 'x-', categories: ['exterior'] },
];

export interface TaskProducts<R, I> { room: R; items: I[] }

/**
 * Products for the rooms a plan task touches. A task for one confirmed room (a bathroom)
 * shows that room's items; otherwise items of the task's categories across all rooms.
 */
export function productsForTask<R extends Pick<SelRoom, 'id' | 'room_type' | 'plan_room' | 'sort' | 'name'>, I extends Pick<RoomItem, 'room_id' | 'category' | 'sort' | 'name'>>(
  task: { key: string; room?: { id: string } },
  rooms: R[],
  items: I[],
): TaskProducts<R, I>[] {
  const rule = TASK_PRODUCTS.find((r) => task.key.startsWith(r.prefix));
  if (!rule) return [];
  let scope = rooms;
  if (task.room) {
    const exact = rooms.filter((r) => r.plan_room === task.room!.id);
    scope = exact.length ? exact : rule.types ? rooms.filter((r) => rule.types!.includes(r.room_type)) : rooms;
  } else if (rule.types && rule.categories === 'all') {
    scope = rooms.filter((r) => rule.types!.includes(r.room_type));
  }
  const want = (i: I) => rule.categories === 'all' || rule.categories.includes(i.category);
  return [...scope]
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name))
    .map((room) => ({ room, items: items.filter((i) => i.room_id === room.id && want(i)).sort((a, b) => a.sort - b.sort) }))
    .filter((g) => g.items.length > 0);
}
