import { describe, expect, it } from 'vitest';
import {
  CATEGORIES, docFileName, groupByCategory, groupByLevel, itemFolder, missingStarters, nextSort, normalizeUrl,
  productsForTask, ROOM_TYPES, roomCounts, STARTERS, suggestRooms, typeForPlanRoom,
} from './rooms';
import type { Room } from './template';

const room = (id: string, room_type: (typeof ROOM_TYPES)[number], extra: Record<string, unknown> = {}) =>
  ({ id, room_type, name: id, level: '', sort: 0, plan_room: null, ...extra });
const item = (room_id: string, category: (typeof CATEGORIES)[number], name = '', extra: Record<string, unknown> = {}) =>
  ({ id: `${room_id}-${category}-${name}`, room_id, category, name, sort: 0, documents: [], photos: [], ...extra });

describe('starters', () => {
  it('every starter uses a known category, with no duplicates per room type', () => {
    for (const t of ROOM_TYPES) {
      const keys = STARTERS[t].map((s) => `${s.category}|${s.name}`);
      expect(new Set(keys).size).toBe(keys.length);
      for (const s of STARTERS[t]) expect(CATEGORIES).toContain(s.category);
    }
  });

  it('a bathroom suggests tile, waterproofing, in-floor heating, vanity, toilet and exhaust fan', () => {
    const cats = STARTERS.bathroom.map((s) => s.category);
    for (const c of ['floor_tile', 'wall_tile', 'waterproofing', 'floor_heating', 'thermostat', 'cabinetry', 'plumbing', 'ventilation']) expect(cats).toContain(c);
  });

  it('hides starters the room already has (same category and name, any case)', () => {
    const left = missingStarters('bathroom', [{ category: 'floor_tile', name: '' }, { category: 'plumbing', name: 'toilet ' }]);
    expect(left.some((s) => s.category === 'floor_tile')).toBe(false);
    expect(left.some((s) => s.name === 'Toilet')).toBe(false);
    expect(left.some((s) => s.name === 'Faucet')).toBe(true);
    expect(missingStarters('other', [])).toEqual([]);
  });
});

describe('suggestRooms', () => {
  const plan: Room[] = [
    { id: 'second-floor-ensuite', name: 'Ensuite', level: 'Second floor', kind: 'bathroom', sheet: 's1' },
    { id: 'main-floor-kitchen', name: 'Kitchen', level: 'Main floor', kind: 'kitchen' },
  ];

  it('suggests confirmed floor-plan rooms not yet added, linked to the plan room', () => {
    const out = suggestRooms({ rooms: plan }, [{ name: 'Kitchen', level: 'Main floor', plan_room: null }]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ name: 'Ensuite', room_type: 'ensuite', plan_room: 'second-floor-ensuite', sheet_ids: ['s1'] });
    expect(suggestRooms({ rooms: plan }, [{ name: 'Renamed', level: '', plan_room: 'second-floor-ensuite' }, { name: 'kitchen', level: 'main floor', plan_room: null }])).toEqual([]);
  });

  it('falls back to the house features when no rooms are confirmed', () => {
    const out = suggestRooms({ rooms: [], bathrooms: 2, garage: 'none', foundation: 'basement' }, []);
    const names = out.map((r) => r.name);
    expect(names).toEqual(['Kitchen', 'Bathroom 1', 'Bathroom 2', 'Laundry', 'Mechanical room', 'Exterior']);
    expect(out.find((r) => r.name === 'Mechanical room')?.level).toBe('Basement');
    expect(suggestRooms({ bathrooms: 1, garage: 'attached' }, []).map((r) => r.name)).toContain('Garage');
  });
});

describe('typeForPlanRoom', () => {
  it('maps floor-plan kinds and names to room types', () => {
    expect(typeForPlanRoom({ name: 'Powder room', kind: 'bathroom', level: 'Main' })).toBe('powder');
    expect(typeForPlanRoom({ name: 'Bath 2', kind: 'bathroom', level: 'Second' })).toBe('bathroom');
    expect(typeForPlanRoom({ name: 'Mudroom', kind: 'other', level: 'Main' })).toBe('laundry');
    expect(typeForPlanRoom({ name: 'Rec room', kind: 'living', level: 'Basement' })).toBe('basement');
    expect(typeForPlanRoom({ name: 'Closet', kind: 'storage', level: 'Main' })).toBe('other');
  });
});

describe('grouping and counts', () => {
  it('groups rooms by level in sort order, rooms without a level last', () => {
    const g = groupByLevel([
      room('a', 'kitchen', { level: 'Main floor', sort: 2 }), room('b', 'bedroom', { level: 'Second floor', sort: 3 }),
      room('c', 'other', { level: '', sort: 0 }), room('d', 'dining', { level: 'main floor', sort: 4 }),
    ]);
    expect(g.map((x) => x.level)).toEqual(['Main floor', 'Second floor', '']);
    expect(g[0].rooms.map((r) => r.id)).toEqual(['a', 'd']);
  });

  it('groups items by category in the standard order', () => {
    const g = groupByCategory([item('r', 'plumbing', 'Toilet'), item('r', 'floor_tile'), item('r', 'plumbing', 'Faucet')]);
    expect(g.map((x) => x.category)).toEqual(['floor_tile', 'plumbing']);
    expect(g[1].items.map((i) => i.name)).toEqual(['Faucet', 'Toilet']);
  });

  it('counts items, documents and photos per room', () => {
    const items = [
      item('r1', 'floor_heating', '', { documents: [{ path: 'a', name: 'a.pdf', kind: 'manual' }, { path: 'b', name: 'b.pdf', kind: 'install' }], photos: ['p'] }),
      item('r1', 'paint'), item('r2', 'paint'),
    ];
    expect(roomCounts(items, 'r1')).toEqual({ items: 2, docs: 2, photos: 1 });
    expect(roomCounts(items, 'none')).toEqual({ items: 0, docs: 0, photos: 0 });
  });
});

describe('helpers', () => {
  it('nextSort, normalizeUrl, itemFolder and docFileName', () => {
    expect(nextSort([])).toBe(1);
    expect(nextSort([{ sort: 4 }, { sort: 2 }])).toBe(5);
    expect(normalizeUrl('  ')).toBeNull();
    expect(normalizeUrl('schluter.com/ditra-heat')).toBe('https://schluter.com/ditra-heat');
    expect(normalizeUrl('http://x.ca')).toBe('http://x.ca');
    expect(itemFolder('p', 'r', 'i')).toBe('p/rooms/r/i');
    expect(docFileName('DITRA-HEAT Install Handbook (2024).PDF', 'abcdef1234')).toBe('ditra-heat-install-handbook-2024-abcdef12.pdf');
    expect(docFileName('???', 'abcdef1234')).toBe('document-abcdef12.pdf');
  });
});

describe('productsForTask', () => {
  const rooms = [
    room('bath1', 'bathroom', { plan_room: 'second-floor-main-bath', sort: 1 }),
    room('ens', 'ensuite', { sort: 2 }), room('kit', 'kitchen', { sort: 3 }), room('bed', 'bedroom', { sort: 4 }),
  ];
  const items = [
    item('bath1', 'floor_tile'), item('bath1', 'floor_heating'), item('ens', 'wall_tile'),
    item('kit', 'appliance', 'Fridge'), item('bed', 'flooring'), item('bed', 'paint'), item('kit', 'plumbing', 'Sink'),
  ];

  it('a bathroom task for a confirmed room shows that room only, all categories', () => {
    const out = productsForTask({ key: 'n-bath-1', room: { id: 'second-floor-main-bath' } }, rooms, items);
    expect(out.map((g) => g.room.id)).toEqual(['bath1']);
    expect(out[0].items).toHaveLength(2);
  });

  it('a bathroom task without a linked room shows every bathroom-type room', () => {
    expect(productsForTask({ key: 'n-bath-2' }, rooms, items).map((g) => g.room.id)).toEqual(['bath1', 'ens']);
    expect(productsForTask({ key: 'n-bath-2', room: { id: 'unlinked' } }, rooms, items).map((g) => g.room.id)).toEqual(['bath1', 'ens']);
  });

  it('trade tasks show their categories across rooms', () => {
    const floor = productsForTask({ key: 'n-floor' }, rooms, items);
    expect(floor.map((g) => [g.room.id, g.items.map((i) => i.category)])).toEqual([['bath1', ['floor_tile', 'floor_heating']], ['bed', ['flooring']]]);
    expect(productsForTask({ key: 'm-plumb' }, rooms, items).map((g) => g.room.id)).toEqual(['kit']);
    expect(productsForTask({ key: 'n-kitchen' }, rooms, items)[0].items).toHaveLength(2);
  });

  it('tasks without a rule show nothing', () => {
    expect(productsForTask({ key: 'f-pour' }, rooms, items)).toEqual([]);
  });
});
