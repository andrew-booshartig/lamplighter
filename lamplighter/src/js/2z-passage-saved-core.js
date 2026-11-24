/* ═══════════════════════════ 2z · Random: saved filters, mixes and the daily draw (pure) ═══════════════════════════
   A person can name a set of filters and come back to it: "daily Christian verses with a little Buddhism mixed in". This file is the arithmetic of that, with no page in it (tests/passage-saved.test.js).
     · A SAVED FILTER is { id, name, daily, mode, pf, parts, made }: a name that is the person's own (any text; the page escapes it), the draw (Passage, One page or Two pages, and the three page options), and one or more
       PARTS, each a whole set of choices (2z-passage-filter-core.js: religions, periods, books, kinds, shelves, the pool and the shelves left out) with a weight. One part is the normal case.
     · A MIX is a saved filter with several parts. The three weights are plain words (a little, some, mostly = 1, 3 and 9), so "mostly Christianity, a little Buddhism" is nine draws in ten from the first and one from the second.
       A draw picks a part by weight from the same seeded stream as the rest of the draw, so a draw code still replays it; then a book and a passage from that part's books. A part that matches no book is said to,
       in the editor and when it is drawn, and is never skipped without a word.
     · DAILY: the draw is seeded by the date and the filter's name, so opening the filter shows the same passage all day and a new one tomorrow. Nothing is sent and nothing is scheduled.
   Where it is kept: one value in the person's own storage (passage.saved: { v: 1, last, items }), so Setup's Export all carries it and Import brings it back with everything else. */
/* under Node (the tests) the filters' own file sits beside this one; in the app both are part of the one script */
if (typeof module !== 'undefined' && module.exports) Object.assign(globalThis, require('./2z-passage-filter-core.js'));
const PSV_KEY = 'passage.saved';
const PSV_WEIGHTS = [['little', 'a little', 1], ['some', 'some', 3], ['mostly', 'mostly', 9]];
const PSV_MODES = ['passage', 'page', 'pages'];
const PSV_MAX = { filters: 60, parts: 6, name: 60 };
/* a name as the person typed it, made safe to keep: control characters and runs of space become one space, no longer than a name may be */
const psvName = (v) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, PSV_MAX.name).trim();
/* two names are the same name when they differ only in capitals, accents-as-typed and width (NFKC) */
const psvKey = (v) => psvName(v).normalize('NFKC').toLowerCase();
const psvWeight = (w) => PSV_WEIGHTS.find((q) => q[0] === w) || PSV_WEIGHTS[1];
/* the share of each part as whole percentages that add up to 100 (the largest remainders take the odd ones) */
function psvPercent(parts) {
  const ws = parts.map((p) => psvWeight(p.w)[2]); const tot = ws.reduce((a, b) => a + b, 0) || 1; const ex = ws.map((w) => w * 100 / tot); const out = ex.map(Math.floor);
  let left = 100 - out.reduce((a, b) => a + b, 0); const order = ex.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let k = 0; left > 0 && order.length; k = (k + 1) % order.length) { out[order[k][1]]++; left--; }
  return out;
}
const psvState = (s, ctx) => psfNorm(Object.assign({}, s && typeof s === 'object' ? s : {}, { x: '' }), ctx);      /* the old Journey link (?t=) is never kept */
const psvPart = (p, ctx) => { const x = p && typeof p === 'object' ? p : {}; return { w: PSV_WEIGHTS.some((q) => q[0] === x.w) ? x.w : 'some', s: psvState(x.s, ctx) }; };
function psvFilter(f, ctx) {
  if (!f || typeof f !== 'object' || Array.isArray(f)) return null; const name = psvName(f.name); if (!name) return null;
  const parts = (Array.isArray(f.parts) ? f.parts : []).slice(0, PSV_MAX.parts).map((p) => psvPart(p, ctx)); if (!parts.length) return null;
  const pf = f.pf && typeof f.pf === 'object' ? f.pf : {};
  return { id: typeof f.id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(f.id) ? f.id : '', name, daily: f.daily === true, mode: PSV_MODES.includes(f.mode) ? f.mode : 'passage', pf: { front: pf.front !== false, back: pf.back !== false, clean: pf.clean === true }, parts, made: typeof f.made === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(f.made) ? f.made : '' };
}
const psvNextId = (items) => { for (let n = 1; ; n++) { const id = 'f' + n.toString(36); if (!items.some((g) => g.id === id)) return id; } };
/* whatever was kept, made safe: junk dropped, every choice that no longer exists dropped from its part, an id and a name of its own for each (a name that repeats gets " 2", so nothing the person made is lost), the last one used only if it is there */
function psvClean(v, ctx) {
  const raw = v && typeof v === 'object' && !Array.isArray(v) ? v : { items: Array.isArray(v) ? v : [] }; const items = []; const keys = new Set();
  for (const f of Array.isArray(raw.items) ? raw.items : []) {
    if (items.length >= PSV_MAX.filters) break; const g = psvFilter(f, ctx); if (!g) continue;
    if (!g.id || items.some((h) => h.id === g.id)) g.id = psvNextId(items);
    let name = g.name; for (let n = 2; keys.has(psvKey(name)); n++) name = psvName(g.name.slice(0, PSV_MAX.name - String(n).length - 1) + ' ' + n); keys.add(psvKey(name)); g.name = name; items.push(g);
  }
  return { v: 1, last: typeof raw.last === 'string' && items.some((g) => g.id === raw.last) ? raw.last : '', items };
}
const psvBlank = () => ({ v: 1, last: '', items: [] });
const psvFind = (data, ref) => { const s = String(ref == null ? '' : ref); return data.items.find((g) => g.id === s) || data.items.find((g) => psvKey(g.name) === psvKey(s)) || null; };
const psvCopy = (data) => JSON.parse(JSON.stringify(data));
/* the operations: each returns { data } (a new value) or { error: 'name' (empty), 'taken' (another filter has it), 'full', 'none', 'last' (the last part cannot be taken off), 'parts' (too many) } */
function psvSaveAs(data, name, state, o) {
  const x = o || {}; const nm = psvName(name); if (!nm) return { error: 'name' }; const d = psvCopy(data); const same = d.items.find((g) => psvKey(g.name) === psvKey(nm));
  const f = { id: same ? same.id : psvNextId(d.items), name: nm, daily: x.daily === true, mode: PSV_MODES.includes(x.mode) ? x.mode : 'passage', pf: { front: !x.pf || x.pf.front !== false, back: !x.pf || x.pf.back !== false, clean: !!(x.pf && x.pf.clean === true) }, parts: [{ w: 'some', s: psvState(state, x.ctx) }], made: typeof x.day === 'string' ? x.day : '' };
  if (same) { if (!x.replace) return { error: 'taken' }; d.items[d.items.indexOf(same)] = f; } else { if (d.items.length >= PSV_MAX.filters) return { error: 'full' }; d.items.push(f); }
  d.last = f.id; return { data: d, filter: f };
}
function psvRename(data, id, name) { const nm = psvName(name); if (!nm) return { error: 'name' }; const d = psvCopy(data); const f = d.items.find((g) => g.id === id); if (!f) return { error: 'none' }; if (d.items.some((g) => g.id !== id && psvKey(g.name) === psvKey(nm))) return { error: 'taken' }; f.name = nm; return { data: d }; }
function psvDelete(data, id) { const d = psvCopy(data); d.items = d.items.filter((g) => g.id !== id); if (d.last === id) d.last = ''; return { data: d }; }
const psvSetLast = (data, id) => { const d = psvCopy(data); d.last = d.items.some((g) => g.id === id) ? id : ''; return d; };
function psvChange(data, id, fn) { const d = psvCopy(data); const f = d.items.find((g) => g.id === id); if (!f) return { error: 'none' }; const e = fn(f); return e ? { error: e } : { data: d }; }
const psvSetDaily = (data, id, on) => psvChange(data, id, (f) => { f.daily = !!on; });
const psvSetMode = (data, id, mode, pf) => psvChange(data, id, (f) => { f.mode = PSV_MODES.includes(mode) ? mode : f.mode; if (pf) f.pf = { front: pf.front !== false, back: pf.back !== false, clean: pf.clean === true }; });
const psvPartAdd = (data, id, state, w, ctx) => psvChange(data, id, (f) => { if (f.parts.length >= PSV_MAX.parts) return 'parts'; f.parts.push(psvPart({ w, s: state }, ctx)); return ''; });
const psvPartSet = (data, id, i, state, ctx) => psvChange(data, id, (f) => { if (!f.parts[i]) return 'none'; f.parts[i].s = psvState(state, ctx); return ''; });
const psvPartWeight = (data, id, i, w) => psvChange(data, id, (f) => { if (!f.parts[i]) return 'none'; f.parts[i].w = PSV_WEIGHTS.some((q) => q[0] === w) ? w : f.parts[i].w; return ''; });
const psvPartRemove = (data, id, i) => psvChange(data, id, (f) => { if (!f.parts[i]) return 'none'; if (f.parts.length < 2) return 'last'; f.parts.splice(i, 1); return ''; });
/* what a part holds, in the person's own words for it: the choices it makes, or the pool when it makes none */
function psvLabel(state, names) { const sm = psfSummary(state, names); return sm.parts.length ? sm.parts.map((p) => p.text).join(' · ') : sm.base; }
/* the parts of a filter with what each one holds now: [{ i, w, word, weight, pct, label, n }]; n is the number of books (0: it matches nothing, and the editor says so) */
function psvPlan(filter, facts, o) {
  const pct = psvPercent(filter.parts); const x = o || {};
  return filter.parts.map((p, i) => ({ i, w: p.w, word: psvWeight(p.w)[1], weight: psvWeight(p.w)[2], pct: pct[i], label: psvLabel(p.s, x.names), n: psfPool(facts, p.s, x).length }));
}
/* an unbiased whole number below n from a stream of floats (the same rejection sampling as the rest of Random) */
function psvBelow(rng, n) { if (!(n > 1)) return 0; const lim = Math.floor(4294967296 / n) * n; let x; do { x = Math.floor(rng() * 4294967296); } while (x >= lim); return x % n; }
/* the part a draw comes from: by weight, from the draw's own stream; one part takes no number from the stream at all, so a plain filter draws exactly as it always did */
function psvPick(parts, rng) {
  if (parts.length < 2) return 0; const ws = parts.map((p) => psvWeight(p.w)[2]); let r = psvBelow(rng, ws.reduce((a, b) => a + b, 0));
  for (let i = 0; i < ws.length; i++) { r -= ws[i]; if (r < 0) return i; }
  return parts.length - 1;
}
/* the seed of today's draw: the date and the filter's name through the same hash as every seed (32 hexadecimal characters), so it is the same all day, differs from day to day and from filter to filter, and its code replays */
function psvDailySeed(name, day, hash) { return String(hash(`lamplighter-daily|${day}|${psvKey(name)}`)).toLowerCase().replace(/[^0-9a-f]/g, '0').slice(0, 32).padEnd(32, '0'); }
/* the line the card carries when it came from a saved filter: o = { name, today, i, n, label, word } */
function psvLine(o) {
  const q = `“${psvName(o.name)}”`; const head = o.today ? `Today’s passage from ${q}` : `From your filter ${q}`;
  return o.n > 1 ? `${head}: part ${o.i + 1} of ${o.n}, ${o.label} (${o.word}).` : `${head}.`;
}
/* what the person is told when a name is refused */
const PSV_ERRORS = { name: 'Give it a name.', taken: 'A saved filter has that name already.', full: `You can keep ${PSV_MAX.filters} saved filters. Delete one first.`, none: 'That saved filter is not there any more.', last: 'A saved filter keeps at least one part.', parts: `A saved filter has at most ${PSV_MAX.parts} parts.` };
if (typeof module !== 'undefined' && module.exports) module.exports = { PSV_KEY, PSV_WEIGHTS, PSV_MODES, PSV_MAX, PSV_ERRORS, psvState, psvName, psvKey, psvWeight, psvPercent, psvPart, psvFilter, psvNextId, psvClean, psvBlank, psvFind, psvSaveAs, psvRename, psvDelete, psvSetLast, psvSetDaily, psvSetMode, psvPartAdd, psvPartSet, psvPartWeight, psvPartRemove, psvLabel, psvPlan, psvBelow, psvPick, psvDailySeed, psvLine };
