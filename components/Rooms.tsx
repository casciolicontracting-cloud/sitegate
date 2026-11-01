'use client';

// Room list editor, used in the review step and on the Drawings tab. Rooms read
// from the floor plans are suggestions until saved here.

import { useState } from 'react';
import { newId } from '@/lib/supabase';
import { ROOM_KINDS, ROOM_KIND_LABEL, roomId, type Box, type Room } from '@/lib/template';
import type { Sheet } from '@/lib/types';
import { SheetViewer } from './ui';

/** Final room ids from name + level, so checklist progress stays attached to the room. */
export function finalizeRooms(rooms: Room[]): Room[] {
  const seen = new Set<string>();
  return rooms.filter((r) => r.name.trim()).map((r) => {
    const base = roomId(r.name.trim(), r.level.trim());
    let id = base;
    for (let n = 2; seen.has(id); n++) id = `${base}-${n}`;
    seen.add(id);
    return { ...r, id, name: r.name.trim(), level: r.level.trim() };
  });
}

export function RoomsEditor({ rooms, sheets, onChange }: { rooms: Room[]; sheets: Sheet[]; onChange: (rooms: Room[]) => void }) {
  const [view, setView] = useState<{ sheet: Sheet; box: Box } | null>(null);
  const set = (i: number, patch: Partial<Room>) => onChange(rooms.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <>
      <div className="room-list">
        {rooms.map((r, i) => {
          const sheet = sheets.find((s) => s.id === r.sheet);
          return (
            <div className="room-row" key={r.id}>
              <input id={`rm-name-${i}`} type="text" aria-label="Room name" placeholder="Room name" value={r.name} onChange={(e) => set(i, { name: e.target.value })} />
              <input id={`rm-level-${i}`} type="text" aria-label="Level" placeholder="Level (e.g. Second floor)" value={r.level} onChange={(e) => set(i, { level: e.target.value })} />
              <select id={`rm-kind-${i}`} aria-label="Room type" value={r.kind} onChange={(e) => set(i, { kind: e.target.value as Room['kind'] })}>
                {ROOM_KINDS.map((k) => <option key={k} value={k}>{ROOM_KIND_LABEL[k]}</option>)}
              </select>
              <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                {sheet && r.box && <button type="button" className="btn btn-sm" onClick={() => setView({ sheet, box: r.box! })}>View</button>}
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange(rooms.filter((_, j) => j !== i))}>Remove</button>
              </div>
            </div>
          );
        })}
      </div>
      <button type="button" className="btn btn-sm" style={{ alignSelf: 'flex-start' }}
        onClick={() => onChange([...rooms, { id: `new-${newId()}`, name: '', level: rooms.at(-1)?.level || '', kind: 'bedroom' }])}>Add room</button>
      {view && <SheetViewer path={view.sheet.image_path} title={view.sheet.number || 'Floor plan'} focus={view.box} onClose={() => setView(null)} />}
    </>
  );
}
