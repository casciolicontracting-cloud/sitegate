'use client';

// Rooms tab: each room in the house holds its selections and product information
// (finishes, tile, fixtures, in-floor heating...), with manuals, spec sheets and photos.
// Suggestions (rooms from the floor plans, starter items per room type) are only added
// when a person taps them. The app records products; it never judges compliance.

import { useMemo, useState } from 'react';
import {
  CATEGORIES, CATEGORY_LABEL, DOC_KIND_LABEL, DOC_KINDS, groupByCategory, groupByLevel, ITEM_STATUS_LABEL, ITEM_STATUSES,
  itemTitle, missingStarters, normalizeUrl, ROOM_TYPE_LABEL, ROOM_TYPES, roomCounts, suggestRooms,
  type Category, type DocKind, type ItemStatus, type RoomDoc, type RoomItem, type RoomType, type SelRoom,
} from '@/lib/rooms';
import { normalizeFeatures, TRADES, type Box } from '@/lib/template';
import type { ProjectStore } from '@/lib/useProject';
import type { Sheet } from '@/lib/types';
import type { Nav } from './ProjectApp';
import { Drawer, PhotoGrid, SheetViewer, toast, toastError, useFileUrl } from './ui';

const STATUS_TONE: Record<ItemStatus, string> = { tbd: 'lock', selected: 'go', ordered: 'blue', delivered: 'warn', installed: 'ok' };
export const ItemPill = ({ s }: { s: ItemStatus }) => <span className={`pill ${STATUS_TONE[s] || 'lock'}`}>{ITEM_STATUS_LABEL[s] || s}</span>;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** One line describing the product: maker, model, colour. */
export const productLine = (i: Pick<RoomItem, 'manufacturer' | 'product' | 'colour'>) => [i.manufacturer, i.product, i.colour].filter(Boolean).join(' · ');

/** Opens a stored manual or spec sheet in a new tab through a signed link. */
export function DocLink({ doc }: { doc: RoomDoc }) {
  const url = useFileUrl(doc.path);
  const label = `${DOC_KIND_LABEL[doc.kind] || 'Document'}: ${doc.name}`;
  if (!url) return <span className="small muted">{label} (loading…)</span>;
  return <a href={url} target="_blank" rel="noreferrer" className="small">{label}</a>;
}

export const MAKER_NOTE = 'Manufacturer installation instructions can be stricter than the building code and must be followed. Keep them on site for the trade and the inspector.';

// ---------------------------------------------------------------------------
export function RoomsView({ store, nav }: { store: ProjectStore; nav: Nav }) {
  const { data } = store;
  const [adding, setAdding] = useState(false);
  const [picked, setPicked] = useState<Set<number> | null>(null);
  const [busy, setBusy] = useState(false);
  const features = useMemo(() => normalizeFeatures(data?.project.features || {}), [data?.project.features]);
  if (!data) return null;
  const rooms = data.rooms;
  const room = nav.phase ? rooms.find((r) => r.id === nav.phase) : undefined;
  if (room) return <RoomDetail store={store} nav={nav} room={room} />;

  const suggestions = suggestRooms(data.project.features, rooms);
  const sel = picked ?? new Set(suggestions.map((_, i) => i));

  async function addSuggested() {
    setBusy(true);
    try {
      for (const [i, sg] of suggestions.entries()) {
        if (!sel.has(i)) continue;
        await store.saveRoom({ name: sg.name, level: sg.level, room_type: sg.room_type, plan_room: sg.plan_room, sheet_ids: sg.sheet_ids });
      }
      store.log('rooms_added', { rooms: sel.size });
      toast(`Added ${plural(sel.size, 'room')}. Open a room to add its selections.`);
      setPicked(null);
    } catch (e) { toastError(e); } finally { setBusy(false); }
  }

  const groups = groupByLevel(rooms);
  const totals = { items: data.roomItems.length, docs: data.roomItems.reduce((n, i) => n + i.documents.length, 0) };

  return (
    <div className="stack-lg">
      <div className="section-head">
        <div className="stack" style={{ gap: 4 }}>
          <h1>Rooms</h1>
          <span className="small muted num">{plural(rooms.length, 'room')} · {plural(totals.items, 'selection')} · {plural(totals.docs, 'document')}</span>
        </div>
        {!adding && <button className="btn btn-primary" onClick={() => setAdding(true)}>Add room</button>}
      </div>
      <p className="muted small" style={{ maxWidth: '65ch' }}>Each room keeps its finishes and products: tile, flooring, fixtures, in-floor heating, appliances, with the manuals, spec sheets and photos for each.</p>

      {adding && <RoomForm store={store} levels={levelsOf(rooms, features.rooms)} onDone={(r) => { setAdding(false); if (r) nav.go('rooms', r.id); }} />}

      {suggestions.length > 0 && (
        <section className="panel-box stack">
          <div className="stack" style={{ gap: 4 }}>
            <h2>Suggested rooms</h2>
            <span className="small muted">
              {features.rooms.length ? 'From the rooms confirmed on the floor plans.' : 'From the house features. Confirm rooms on the Drawings tab for a full list.'} Untick any you don&apos;t want; nothing is added until you tap Add.
            </span>
          </div>
          <div className="checks">
            {suggestions.map((sg, i) => (
              <label key={`${sg.level}|${sg.name}|${i}`} className="check">
                <input type="checkbox" checked={sel.has(i)} onChange={() => { const n = new Set(sel); if (n.has(i)) n.delete(i); else n.add(i); setPicked(n); }} />
                <span>{sg.name}<span className="muted small"> · {ROOM_TYPE_LABEL[sg.room_type]}{sg.level ? ` · ${sg.level}` : ''}</span></span>
              </label>
            ))}
          </div>
          <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={busy || sel.size === 0} onClick={addSuggested}>
            {busy ? 'Adding…' : `Add ${plural(sel.size, 'room')}`}
          </button>
        </section>
      )}

      {rooms.length === 0 && !adding && <div className="empty panel-box">No rooms yet. Add a room, or add the suggested rooms above.</div>}

      {groups.map((g) => (
        <section key={g.level || '-'} className="stack">
          <h2>{g.level || 'No level set'}</h2>
          <div className="list">
            {g.rooms.map((r) => {
              const c = roomCounts(data.roomItems, r.id);
              return (
                <button key={r.id} className="item" onClick={() => nav.go('rooms', r.id)}>
                  <div className="grow">
                    <div className="t">{r.name}</div>
                    <div className="s num">
                      {ROOM_TYPE_LABEL[r.room_type]} · {c.items ? plural(c.items, 'selection') : 'no selections yet'}
                      {c.docs > 0 && ` · ${plural(c.docs, 'document')}`}{c.photos > 0 && ` · ${plural(c.photos, 'photo')}`}
                    </div>
                  </div>
                  <span aria-hidden="true" className="muted">›</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

const DEFAULT_LEVELS = ['Basement', 'Main floor', 'Second floor', 'Third floor', 'Exterior'];
function levelsOf(rooms: SelRoom[], plan: Array<{ level: string }>) {
  return [...new Set([...rooms.map((r) => r.level), ...plan.map((r) => r.level), ...DEFAULT_LEVELS].map((x) => x.trim()).filter(Boolean))];
}

// ---------------------------------------------------------------------------
function RoomForm({ store, room, levels, onDone }: { store: ProjectStore; room?: SelRoom; levels: string[]; onDone: (r?: SelRoom) => void }) {
  const sheets = store.data?.sheets || [];
  const [name, setName] = useState(room?.name || '');
  const [type, setType] = useState<RoomType>(room?.room_type || 'bathroom');
  const [level, setLevel] = useState(room?.level || '');
  const [notes, setNotes] = useState(room?.notes || '');
  const [sheetIds, setSheetIds] = useState<string[]>(room?.sheet_ids || []);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast('Give the room a name, e.g. "Main bathroom".', true);
    setSaving(true);
    try {
      const r = await store.saveRoom({ ...(room ? { id: room.id } : {}), name: name.trim(), room_type: type, level: level.trim(), notes: notes.trim() || null, sheet_ids: sheetIds });
      if (!room) store.log('room_added', { room: r.name });
      onDone(r);
    } catch (err) { toastError(err); } finally { setSaving(false); }
  }

  return (
    <form className="panel-box stack" onSubmit={save}>
      <h3>{room ? 'Edit room' : 'Add a room'}</h3>
      <div className="form-grid">
        <label className="field"><span>Room name</span><input id="rm-f-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Main bathroom" autoFocus={!room} /></label>
        <label className="field"><span>Room type</span>
          <select id="rm-f-type" value={type} onChange={(e) => setType(e.target.value as RoomType)}>
            {ROOM_TYPES.map((t) => <option key={t} value={t}>{ROOM_TYPE_LABEL[t]}</option>)}
          </select>
        </label>
        <label className="field"><span>Level</span>
          <input id="rm-f-level" type="text" list="rm-levels" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Second floor" />
          <datalist id="rm-levels">{levels.map((l) => <option key={l} value={l} />)}</datalist>
        </label>
      </div>
      <label className="field"><span>Notes</span><textarea id="rm-f-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Client decisions, allowances, anything the trades should know" /></label>
      {sheets.length > 0 && (
        <div className="field">
          <span>Drawing sheets for this room</span>
          <div className="topic-chips">
            {sheets.map((s) => {
              const on = sheetIds.includes(s.id);
              return (
                <button key={s.id} type="button" className={`chip ${on ? 'on' : ''}`} aria-pressed={on}
                  onClick={() => setSheetIds(on ? sheetIds.filter((x) => x !== s.id) : [...sheetIds, s.id])}>
                  {s.number || `${s.file_name || 'Sheet'} p.${s.page ?? ''}`}{s.title ? ` ${s.title}` : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="row">
        <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : room ? 'Save room' : 'Add room'}</button>
        <button type="button" className="btn btn-ghost" onClick={() => onDone()}>Cancel</button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
function RoomDetail({ store, nav, room }: { store: ProjectStore; nav: Nav; room: SelRoom }) {
  const { data } = store;
  const [editing, setEditing] = useState(false);
  const [itemId, setItemId] = useState<string | 'new' | null>(null);
  const [view, setView] = useState<{ sheet: Sheet; box?: Box } | null>(null);
  const [busy, setBusy] = useState(false);
  if (!data) return null;
  const items = data.roomItems.filter((i) => i.room_id === room.id);
  const starters = missingStarters(room.room_type, items);
  const planRoom = normalizeFeatures(data.project.features).rooms.find((r) => r.id === room.plan_room);
  const planSheet = data.sheets.find((s) => s.id === planRoom?.sheet);
  const sheets = data.sheets.filter((s) => room.sheet_ids.includes(s.id));
  const c = roomCounts(data.roomItems, room.id);

  async function addStarters(list: typeof starters) {
    setBusy(true);
    try {
      await store.addStarterItems(room.id, list);
      toast(list.length === 1 ? `${itemTitle(list[0])} added. Tap it to fill in the product.` : `${list.length} items added. Tap each one to fill in the product.`);
    } catch (e) { toastError(e); } finally { setBusy(false); }
  }

  async function del() {
    const msg = items.length
      ? `Delete ${room.name} and its ${plural(items.length, 'selection')}, with all their manuals and photos? This can't be undone.`
      : `Delete ${room.name}? This can't be undone.`;
    if (!window.confirm(msg)) return;
    try {
      await store.deleteRoom(room.id);
      store.log('room_deleted', { room: room.name });
      toast(`${room.name} deleted.`);
      nav.go('rooms');
    } catch (e) { toastError(e); }
  }

  return (
    <div className="stack-lg">
      <div className="stack" style={{ gap: 6 }}>
        <button className="btn-link small" style={{ alignSelf: 'flex-start' }} onClick={() => nav.go('rooms')}>‹ All rooms</button>
        <div className="section-head" style={{ margin: 0 }}>
          <div className="stack" style={{ gap: 4 }}>
            <h1>{room.name}</h1>
            <span className="small muted num">{ROOM_TYPE_LABEL[room.room_type]}{room.level ? ` · ${room.level}` : ''} · {plural(c.items, 'selection')} · {plural(c.docs, 'document')}</span>
          </div>
          {!editing && (
            <div className="row">
              <button className="btn btn-primary" onClick={() => setItemId('new')}>Add item</button>
              <button className="btn" onClick={() => setEditing(true)}>Edit room</button>
            </div>
          )}
        </div>
      </div>

      {editing ? (
        <div className="stack">
          <RoomForm store={store} room={room} levels={levelsOf(data.rooms, [])} onDone={() => setEditing(false)} />
          <button className="btn btn-sm btn-danger" style={{ alignSelf: 'flex-start' }} onClick={del}>Delete room</button>
        </div>
      ) : (
        (room.notes || sheets.length > 0 || (planSheet && planRoom?.box)) && (
          <section className="panel-box stack" style={{ gap: 8 }}>
            {room.notes && <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{room.notes}</p>}
            {(sheets.length > 0 || (planSheet && planRoom?.box)) && (
              <div className="row" style={{ gap: 6 }}>
                {planSheet && planRoom?.box && <button className="sheet-chip" onClick={() => setView({ sheet: planSheet, box: planRoom.box })}>View on floor plan</button>}
                {sheets.map((s) => <button key={s.id} className="sheet-chip" onClick={() => setView({ sheet: s })}>{s.number || 'Sheet'}{s.revision ? ` rev ${s.revision}` : ''}</button>)}
              </div>
            )}
          </section>
        )
      )}

      {starters.length > 0 && (
        <section className="stack" style={{ gap: 8 }}>
          <div className="section-head" style={{ margin: 0 }}>
            <h3>Quick add for this {ROOM_TYPE_LABEL[room.room_type].toLowerCase()}</h3>
            <button className="btn btn-sm" disabled={busy} onClick={() => addStarters(starters)}>Add all {starters.length}</button>
          </div>
          <div className="topic-chips">
            {starters.map((x) => (
              <button key={`${x.category}|${x.name}`} type="button" className="chip chip-add" disabled={busy} onClick={() => addStarters([x])}>
                + {itemTitle(x)}
              </button>
            ))}
          </div>
          <span className="small muted">Each one adds an empty item for you to fill in.</span>
        </section>
      )}

      {items.length === 0 && <div className="empty panel-box">No selections yet. Use quick add above, or tap Add item.</div>}

      {groupByCategory(items).map((g) => (
        <section key={g.category} className="stack" style={{ gap: 8 }}>
          <h2>{CATEGORY_LABEL[g.category]}</h2>
          <div className="list">
            {g.items.map((i) => {
              const line = productLine(i);
              const extra = [i.location, i.quantity && `qty ${i.quantity}`, i.documents.length && plural(i.documents.length, 'document'), i.photos.length && plural(i.photos.length, 'photo')].filter(Boolean).join(' · ');
              return (
                <button key={i.id} className="item" onClick={() => setItemId(i.id)}>
                  <ItemPill s={i.status} />
                  <div className="grow">
                    <div className="t">{itemTitle(i)}</div>
                    <div className="s">{line || 'Product not chosen yet'}</div>
                    {extra && <div className="s num">{extra}</div>}
                  </div>
                  <span aria-hidden="true" className="muted">›</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {itemId && <ItemDrawer store={store} room={room} itemId={itemId === 'new' ? null : itemId} onCreated={(id) => setItemId(id)} onClose={() => setItemId(null)} />}
      {view && <SheetViewer path={view.sheet.image_path} title={`${view.sheet.number} ${view.sheet.title}`} focus={view.box} onClose={() => setView(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
type Form = { category: Category; name: string; location: string; manufacturer: string; product: string; colour: string; supplier: string; quantity: string; trade: string; status: ItemStatus; url: string; notes: string };
const toForm = (i?: RoomItem): Form => ({
  category: i?.category || 'other', name: i?.name || '', location: i?.location || '', manufacturer: i?.manufacturer || '',
  product: i?.product || '', colour: i?.colour || '', supplier: i?.supplier || '', quantity: i?.quantity || '',
  trade: i?.trade || '', status: i?.status || 'tbd', url: i?.url || '', notes: i?.notes || '',
});

function ItemDrawer({ store, room, itemId, onCreated, onClose }: { store: ProjectStore; room: SelRoom; itemId: string | null; onCreated: (id: string) => void; onClose: () => void }) {
  const item = store.data?.roomItems.find((i) => i.id === itemId);
  const [form, setForm] = useState<Form>(() => toForm(item));
  const [saving, setSaving] = useState(false);
  const [docKind, setDocKind] = useState<DocKind>('manual');
  const [uploading, setUploading] = useState<string | null>(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(item));
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    setSaving(true);
    try {
      const blank = (s: string) => s.trim() || null;
      const row = {
        room_id: room.id, category: form.category, name: form.name.trim(), location: blank(form.location), manufacturer: blank(form.manufacturer),
        product: blank(form.product), colour: blank(form.colour), supplier: blank(form.supplier), quantity: blank(form.quantity),
        trade: blank(form.trade), status: form.status, url: normalizeUrl(form.url), notes: blank(form.notes),
      };
      const saved = await store.saveItem(item ? { ...row, id: item.id } : row);
      setForm(toForm(saved));
      if (!item) { onCreated(saved.id); toast('Item added. You can now attach manuals and photos.'); } else toast('Saved.');
    } catch (err) { toastError(err); } finally { setSaving(false); }
  }

  async function uploadDocs(files: File[]) {
    if (!item) return;
    setUploading(`Uploading ${plural(files.length, 'file')}…`);
    try {
      await store.addItemDocs(item.id, files, docKind);
      toast(`${DOC_KIND_LABEL[docKind]} added.`);
    } catch (e) { toastError(e); } finally { setUploading(null); }
  }

  async function removeDoc(d: RoomDoc) {
    if (!item || !window.confirm(`Delete ${d.name}? This can't be undone.`)) return;
    try { await store.deleteItemDoc(item.id, d.path); toast('Document deleted.'); } catch (e) { toastError(e); }
  }

  async function del() {
    if (!item || !window.confirm(`Delete ${itemTitle(item)}${item.documents.length + item.photos.length ? ' and its manuals and photos' : ''}? This can't be undone.`)) return;
    try { await store.deleteItem(item.id); toast('Item deleted.'); onClose(); } catch (e) { toastError(e); }
  }

  function close() {
    if (dirty && !window.confirm('Close without saving your changes?')) return;
    onClose();
  }

  return (
    <Drawer title={item ? itemTitle(item) : 'New item'} sub={`${room.name}${room.level ? ` · ${room.level}` : ''}`} pill={item && <ItemPill s={item.status} />} onClose={close}>
      <form className="stack" onSubmit={save}>
        <div className="form-grid">
          <label className="field"><span>Category</span>
            <select id="it-cat" value={form.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}</select>
          </label>
          <label className="field"><span>Item</span><input id="it-name" type="text" value={form.name} onChange={set('name')} placeholder={CATEGORY_LABEL[form.category]} /></label>
          <label className="field"><span>Where in the room</span><input id="it-loc" type="text" value={form.location} onChange={set('location')} placeholder="Shower walls to ceiling" /></label>
          <label className="field"><span>Status</span>
            <select id="it-status" value={form.status} onChange={set('status')}>{ITEM_STATUSES.map((s) => <option key={s} value={s}>{ITEM_STATUS_LABEL[s]}</option>)}</select>
          </label>
          <label className="field"><span>Manufacturer</span><input id="it-mfr" type="text" value={form.manufacturer} onChange={set('manufacturer')} /></label>
          <label className="field"><span>Product / model</span><input id="it-prod" type="text" value={form.product} onChange={set('product')} /></label>
          <label className="field"><span>Colour / finish</span><input id="it-colour" type="text" value={form.colour} onChange={set('colour')} /></label>
          <label className="field"><span>Quantity</span><input id="it-qty" type="text" value={form.quantity} onChange={set('quantity')} placeholder="85 sq ft" /></label>
          <label className="field"><span>Supplier</span><input id="it-sup" type="text" value={form.supplier} onChange={set('supplier')} /></label>
          <label className="field"><span>Trade</span>
            <select id="it-trade" value={form.trade} onChange={set('trade')}><option value="">—</option>{TRADES.map((t) => <option key={t}>{t}</option>)}</select>
          </label>
        </div>
        <label className="field"><span>Product web page</span><input id="it-url" type="text" inputMode="url" autoCapitalize="off" autoCorrect="off" value={form.url} onChange={set('url')} placeholder="https://" /></label>
        <label className="field"><span>Notes</span><textarea id="it-notes" rows={3} value={form.notes} onChange={set('notes')} placeholder="Pattern, grout colour, layout, order numbers…" /></label>
        <div className="row">
          <button className="btn btn-primary" disabled={saving || (!!item && !dirty)}>{saving ? 'Saving…' : item ? 'Save changes' : 'Add item'}</button>
          {item?.url && <a className="btn btn-sm" href={item.url} target="_blank" rel="noreferrer">Open web page</a>}
        </div>
      </form>

      {item ? (
        <>
          <section>
            <h3>Manuals and spec sheets</h3>
            {item.documents.length > 0 && (
              <div className="list">
                {item.documents.map((d) => (
                  <div key={d.path} className="item" style={{ cursor: 'default' }}>
                    <div className="grow"><DocLink doc={d} /></div>
                    <button className="btn btn-sm btn-ghost" onClick={() => removeDoc(d)} aria-label={`Delete ${d.name}`}>Delete</button>
                  </div>
                ))}
              </div>
            )}
            <div className="row">
              <select id="it-dockind" aria-label="Document type" value={docKind} onChange={(e) => setDocKind(e.target.value as DocKind)} style={{ width: 'auto' }}>
                {DOC_KINDS.map((k) => <option key={k} value={k}>{DOC_KIND_LABEL[k]}</option>)}
              </select>
              <label className="btn" aria-disabled={!!uploading}>
                {uploading || 'Upload manual / spec sheet'}
                <input id="it-doc" type="file" accept="application/pdf,image/*" multiple hidden disabled={!!uploading}
                  onChange={(e) => { const f = [...(e.target.files || [])]; e.target.value = ''; if (f.length) void uploadDocs(f); }} />
              </label>
            </div>
            <p className="notice info small" style={{ margin: 0 }}>{MAKER_NOTE}</p>
          </section>
          <section>
            <h3>Photos</h3>
            <PhotoGrid small paths={item.photos} title={itemTitle(item)} onAdd={(f) => store.addItemPhotos(item.id, f)} onDelete={(p) => store.deleteItemPhoto(item.id, p)} />
          </section>
          <section>
            <button className="btn btn-sm btn-danger" style={{ alignSelf: 'flex-start' }} onClick={del}>Delete item</button>
          </section>
        </>
      ) : <p className="small muted">Add the item first, then attach manuals, spec sheets and photos.</p>}
    </Drawer>
  );
}
