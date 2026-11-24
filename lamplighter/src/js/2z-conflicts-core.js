/* ═══════════════════════════ 2z · Conflicts and peacemaking: the pure parts (BACKLOG D8, 18 November 2026) ═══════════════════════════
   The maker: “ive even considered including sections about war and disagreements between sects. conflicts etc.” and, always, “stay as neutral as possible. i’m not building this to direct opinions. its
   only a tool for people to form their own opinions.” The page (6zzd-conflicts.js) lists wars, conflicts between religious communities and the settlements that ended or eased them, in which religion was
   among the causes that anyone gave or that a historian names, and opens each on one layout. Everything the page has to decide is here as pure functions (tests/conflicts.test.js): which entries there are,
   reading an address into a state (a value nobody knows is dropped, never trusted), writing a state back as an address, the filter by kind, region, era, tradition and kind of cause, the count beside every
   choice (what choosing it would give, with the other choices kept, so that no choice leads to an empty page), the order, and the words of a range for the dead.

   The data: tools/atlas_src/json/world_conflicts.json = { meta, entries }, laid over the events of the world by tools/build_atlas.py (merge_conflicts, check_conflicts) and built into atlas/world.js. An entry is
   an event of the History timeline (strand “conflict”: the same entries are on the line) with a conflict block:
     conflict { kind (war | sect | peace), regions [Africa, Asia, Europe, North America, Oceania, South America: the Atlas’s continents], living (1 if it runs past 1945),
                parties [{ name (what the side calls itself), also?, said (what it said the matter was, in its own words where a source gives them), said_status, src [n] }],
                causes [{ kind (religious | political | economic | mixed), status, note, src [n] }],
                casualties { low, high, unit, status, basis, low_src [n], high_src [n], note } or null with casualty_note (“Not recorded …”; a settlement: “A settlement …”),
                outcome { how, status, note, src [n] }, after { status, note, src [n] } }
   and sources [{ title, kind, grade, url?, note?, partisan?, read }]; a number in a statement is the place of a source in the entry (1 is the first). status is documented, reported or claimed, or disputed.
   The rules the page keeps (and tests/conflicts.test.js checks): each side is called by its own name; no side is called aggressor or victim; a cause is graded, never ranked; the dead are a range with a
   basis or “Not recorded”; an entry that runs past 1945 is marked and every statement in every entry carries its own label. */
const CNF_REGIONS = ['Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'];      /* the Atlas’s continents, the same words as All traditions, “Where it began” */
const CNF_KINDS = ['war', 'sect', 'peace'];
const CNF_CAUSES = ['religious', 'political', 'economic', 'mixed'];
const CNF_STATUSES = ['documented', 'reported', 'disputed'];
const CNF_LIVING = 1945;
/* eras: an entry belongs to every band its years touch (the Reconquista is in three); a band runs from `from` up to, not including, `to` (there is no year 0) */
const CNF_ERAS = [
  { id: 'a', label: 'Before 500 BCE', from: -Infinity, to: -500 }, { id: 'b', label: '500 BCE to 500 CE', from: -500, to: 500 }, { id: 'c', label: '500–1000', from: 500, to: 1000 }, { id: 'd', label: '1000–1500', from: 1000, to: 1500 },
  { id: 'e', label: '1500–1700', from: 1500, to: 1700 }, { id: 'f', label: '1700–1900', from: 1700, to: 1900 }, { id: 'g', label: '1900–1945', from: 1900, to: 1946 }, { id: 'h', label: 'After 1945', from: 1946, to: Infinity },
];
/* words the tool must not use in its own voice about a conflict (tests/conflicts.test.js scans every field; words inside a quotation, in “ ”, are a source’s own and are not counted). It is the History timeline’s list
   (HIST_LOADED, 2z-history-core.js) with the words that name a side as the one who did or suffered the wrong */
const CNF_LOADED = /\b(massacres?|genocid(?:e|es|al)|atrocit(?:y|ies)|terroris[mt]s?|fanatics?|extremis[mt]s?|barbarians?|barbaric|savages?|primitive|heathens?|infidels?|cults?|evil|brutal(?:ly|ity)?|tyrann(?:y|ical)|tyrants?|heroic|heroes|glorious|so-called|notorious|infamous|aggress(?:or|ors|ion)|victims?|perpetrators?|oppress(?:or|ors)|slaughter(?:ed)?|butcher(?:y|ed)?|ruthless|wicked|invaders?|martyrs?|martyrdom|rogue|regime)\b/i;

const cnfOwn = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);
const cnfKey = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const cnfEnd = (en) => (en.year_end == null ? en.year_start : en.year_end);
/* the entries of the page: the events of the world that carry a conflict block with a kind, oldest first (an event of the first pilot without a kind is a timeline mark only, and is left out) */
function cnfEntries(world) {
  const ev = world && Array.isArray(world.events) ? world.events : [];
  return ev.filter((e) => e && e.conflict && CNF_KINDS.includes(e.conflict.kind)).sort((a, b) => a.year_start - b.year_start || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
const cnfById = (list) => { const m = Object.create(null); for (const e of list) m[e.id] = e; return m; };
/* the bands of years an entry touches, and the one it begins in */
const cnfEras = (en) => CNF_ERAS.filter((b) => en.year_start < b.to && cnfEnd(en) >= b.from).map((b) => b.id);
const cnfEraOf = (en) => (CNF_ERAS.find((b) => en.year_start >= b.from && en.year_start < b.to) || CNF_ERAS[CNF_ERAS.length - 1]).id;
const cnfEraLabel = (id) => (CNF_ERAS.find((b) => b.id === id) || { label: '' }).label;
const cnfLiving = (en) => !!(en && en.conflict && en.conflict.living) || cnfEnd(en) > CNF_LIVING;
/* every Atlas tradition an entry names, and every tradition above one of them in the tree (so “Christianity” finds an entry that names Lutheranism); ctx.anc(id) gives the ancestors of a tradition */
function cnfTraditions(en, ctx) {
  const anc = ctx && typeof ctx.anc === 'function' ? ctx.anc : () => []; const out = new Set();
  for (const id of en.traditions || []) { out.add(id); for (const a of anc(id) || []) out.add(a); }
  return out;
}
/* the words a search looks in: the name, the dates, the places, the sides and the summary */
const cnfText = (en) => cnfKey([en.label, en.date_label, (en.places || []).map((p) => p.name).join(' '), ((en.conflict && en.conflict.parties) || []).map((p) => p.name + ' ' + (p.also || '')).join(' '), en.summary].join(' '));

/* ── the address: k kind, r region, e era, t tradition, c kind of cause, q words, o order (new = newest first). Anything damaged is put right, never trusted. ctx.traditions is the set of ids the page offers. ── */
function cnfParse(query, ctx) {
  const x = query && typeof query === 'object' ? query : {}; const s = (k) => (cnfOwn(x, k) && typeof x[k] === 'string' ? x[k] : ''); const set = ctx && ctx.traditions instanceof Set ? ctx.traditions : null;
  return { k: CNF_KINDS.includes(s('k')) ? s('k') : '', r: CNF_REGIONS.includes(s('r')) ? s('r') : '', e: CNF_ERAS.some((b) => b.id === s('e')) ? s('e') : '', t: set && set.has(s('t')) ? s('t') : '', c: CNF_CAUSES.includes(s('c')) ? s('c') : '', q: s('q').trim().slice(0, 80), o: s('o') === 'new' ? 'new' : '' };
}
const cnfHasFilter = (st) => !!(st.k || st.r || st.e || st.t || st.c || st.q);
function cnfQuery(st) { const q = {}; ['k', 'r', 'e', 't', 'c', 'q'].forEach((k) => { if (st[k]) q[k] = st[k]; }); if (st.o === 'new') q.o = 'new'; return q; }
/* the address of the list (with the choices kept) or of one entry */
function cnfHref(st, id) { const p = new URLSearchParams(cnfQuery(st || {})).toString(); return '#/conflicts' + (id ? '/' + encodeURIComponent(id) : '') + (p ? '?' + p : ''); }
const CNF_BLANK = { k: '', r: '', e: '', t: '', c: '', q: '', o: '' };
/* the state after a change */
const cnfNext = (st, patch, ctx) => { const m = Object.assign({}, st, patch && typeof patch === 'object' ? patch : {}); return cnfParse(cnfQuery(m), ctx || { traditions: new Set(m.t ? [m.t] : []) }); };

/* does an entry match the choices? `skip` leaves one choice out, which is how the count beside each option is made */
function cnfMatch(en, st, ctx, skip) {
  const c = en && en.conflict; if (!c) return false;
  if (skip !== 'k' && st.k && c.kind !== st.k) return false;
  if (skip !== 'r' && st.r && !(c.regions || []).includes(st.r)) return false;
  if (skip !== 'e' && st.e && !cnfEras(en).includes(st.e)) return false;
  if (skip !== 't' && st.t && !cnfTraditions(en, ctx).has(st.t)) return false;
  if (skip !== 'c' && st.c && !(c.causes || []).some((x) => x.kind === st.c)) return false;
  if (skip !== 'q' && st.q && !cnfText(en).includes(cnfKey(st.q))) return false;
  return true;
}
/* the entries that match, in the order chosen */
function cnfFilter(entries, st, ctx) {
  const out = entries.filter((e) => cnfMatch(e, st, ctx)); return st.o === 'new' ? out.slice().reverse() : out;
}
/* how many entries each option of each choice would give, the other choices kept: { k, r, e, t, c: { value: n }, n: how many match now } */
function cnfCounts(entries, st, ctx) {
  const c = { k: {}, r: {}, e: {}, t: {}, c: {}, n: 0 };
  for (const en of entries) {
    if (cnfMatch(en, st, ctx)) c.n++;
    if (cnfMatch(en, st, ctx, 'k')) c.k[en.conflict.kind] = (c.k[en.conflict.kind] || 0) + 1;
    if (cnfMatch(en, st, ctx, 'r')) for (const r of en.conflict.regions || []) c.r[r] = (c.r[r] || 0) + 1;
    if (cnfMatch(en, st, ctx, 'e')) for (const e of cnfEras(en)) c.e[e] = (c.e[e] || 0) + 1;
    if (cnfMatch(en, st, ctx, 't')) for (const t of cnfTraditions(en, ctx)) c.t[t] = (c.t[t] || 0) + 1;
    if (cnfMatch(en, st, ctx, 'c')) for (const k of new Set((en.conflict.causes || []).map((x) => x.kind))) c.c[k] = (c.c[k] || 0) + 1;
  }
  return c;
}
/* the traditions to offer: every one an entry names and every one above it, with how many entries each would give, by name (ctx.name(id)) */
function cnfTraditionChoices(entries, ctx) {
  const name = ctx && typeof ctx.name === 'function' ? ctx.name : (id) => id; const seen = new Set();
  for (const en of entries) for (const t of cnfTraditions(en, ctx)) seen.add(t);
  return [...seen].map((id) => ({ id, name: name(id) })).sort((a, b) => cnfKey(a.name).localeCompare(cnfKey(b.name)) || (a.id < b.id ? -1 : 1));
}
/* the list in bands of the era each entry begins in */
function cnfGroup(list) {
  const out = []; for (const en of list) { const id = cnfEraOf(en); let g = out.find((x) => x.era === id); if (!g) { g = { era: id, label: cnfEraLabel(id), items: [] }; out.push(g); } g.items.push(en); }
  return out.sort((a, b) => CNF_ERAS.findIndex((x) => x.id === a.era) - CNF_ERAS.findIndex((x) => x.id === b.era));
}

/* ── words for numbers ── */
const cnfNum = (n) => Number(n).toLocaleString('en-US');
function cnfShort(n) { n = Number(n); if (n >= 1e6) { const m = Math.round(n / 1e5) / 10; return (Number.isInteger(m) ? String(m) : m.toFixed(1)) + ' million'; } return cnfNum(n); }
/* “4.5 to 8 million” for a row of the list, “4,500,000 to 8,000,000” in the entry; null when no range is given */
function cnfRange(cs, short) {
  if (!cs || !(cs.low > 0) || !(cs.high >= cs.low)) return null;
  if (!short) return cnfNum(cs.low) + ' to ' + cnfNum(cs.high);
  const a = cnfShort(cs.low); const b = cnfShort(cs.high); return a.endsWith(' million') && b.endsWith(' million') ? a.replace(' million', '') + ' to ' + b : a + ' to ' + b;
}
/* the sources a statement cites, as the entry’s own list numbers them: [{ n, s }] and the text “[1] [3]” */
const cnfCites = (en, src) => (Array.isArray(src) ? src : []).filter((n) => Number.isInteger(n) && n >= 1 && n <= (en.sources || []).length).map((n) => ({ n, s: en.sources[n - 1] }));
/* where an entry is on the History timeline (its window is 3500 BCE to 1900 CE: later entries are on this page only) */
const cnfOnTimeline = (en) => en.year_start >= -3500 && en.year_start <= 1900;
const cnfTimelineHref = (en) => (cnfOnTimeline(en) ? '#/history?s=' + encodeURIComponent(en.id) : '');
/* the links of one entry, both ways: the events it names (`out`) and the events that name it (`in`), each marked as an entry of this page or only an event of the timeline */
function cnfRelated(en, world) {
  const all = world && Array.isArray(world.events) ? world.events : []; const by = cnfById(all); const here = (e) => !!(e.conflict && CNF_KINDS.includes(e.conflict.kind)); const out = [];
  for (const r of en.related || []) if (by[r.id]) out.push({ dir: 'out', kind: r.kind, note: r.note || '', ev: by[r.id], here: here(by[r.id]) });
  for (const e of all) if (e !== en) for (const r of e.related || []) if (r.id === en.id) out.push({ dir: 'in', kind: r.kind, note: r.note || '', ev: e, here: here(e) });
  return out;
}
/* counts for a report: by region, era band (where it begins) and kind of cause, and how many are within living memory */
function cnfStats(entries) {
  const s = { n: entries.length, kind: {}, region: {}, era: {}, cause: {}, living: 0 }; const bump = (o, k) => { o[k] = (o[k] || 0) + 1; };
  for (const en of entries) { bump(s.kind, en.conflict.kind); (en.conflict.regions || []).forEach((r) => bump(s.region, r)); bump(s.era, cnfEraOf(en)); new Set(en.conflict.causes.map((x) => x.kind)).forEach((k) => bump(s.cause, k)); if (cnfLiving(en)) s.living++; }
  return s;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { CNF_REGIONS, CNF_KINDS, CNF_CAUSES, CNF_STATUSES, CNF_ERAS, CNF_LOADED, CNF_LIVING, CNF_BLANK, cnfEntries, cnfById, cnfEras, cnfEraOf, cnfEraLabel, cnfLiving, cnfTraditions, cnfText, cnfParse, cnfHasFilter, cnfQuery, cnfHref, cnfNext, cnfMatch, cnfFilter, cnfCounts, cnfTraditionChoices, cnfGroup, cnfNum, cnfShort, cnfRange, cnfCites, cnfOnTimeline, cnfTimelineHref, cnfRelated, cnfStats, cnfKey };
