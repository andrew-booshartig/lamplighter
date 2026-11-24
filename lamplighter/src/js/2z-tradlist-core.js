/* ═══════════════════════════ 2z · All traditions: the overview, the filters and the order of the list ═══════════════════════════
   The Atlas holds 793 traditions. The page that lists them (Traditions → Browse → All traditions, #/atlas/traditions) opens on a short overview, the nine big families with a count and a sentence each, and
   “Show all” opens the whole list with simple filters: belief, family, where it began, when it began, practised today or ended, kind, and whether there is something to read here; a search by name; and an
   order (A to Z, oldest first, most texts). Everything the page has to decide is here, as pure functions (tests/tradlist.test.js): reading an address into a state (a value nobody knows is dropped, never trusted),
   writing a state back as an address, the facts of every tradition, the filter, the order, and the count shown beside every choice (what you would get by choosing it, with the other filters kept), so that no
   choice leads to an empty page. The address keeps the names the older list used (q name, b belief, g family group, f family, s status, k kind, n page) and adds r (where it began), e (when it began),
   x (something to read here), o (order) and all (the whole list). A belief label is a way to find a tradition, not a verdict (2z-belief-core.js). “Where it began” is the continent of the country where the Atlas
   puts a tradition’s beginning; “when” is its earliest recorded year, so each band is approximate, as the dates are.
   What counts as something to read here: a text of the tradition’s own that is in the Library (a catalogue record linked to a Library text), an old source it draws on, or a book about it, and the Library holds it
   in this copy. A text on a shelf of the tradition it grew from is not counted (Christianity’s Bible does not make every denomination “have a text”): the page of the tradition lists those under “Study it”. */
const TRL_PER = 100;                       /* rows shown first, and added by each “Show more” */
const TRL_MAX_PAGES = 40;
const TRL_KEY = 'tradlist.last';           /* the last choice, kept on this device (never the search words) */
const TRL_REGIONS = ['Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'];
/* when it began: bands of years by the earliest year the Atlas gives; a band starts at `from` and runs up to, not including, `to` (there is no year 0) */
const TRL_ERAS = [
  { id: 'b1000', label: 'Before 1000 BCE', from: -Infinity, to: -1000 }, { id: '-1000', label: '1000–1 BCE', from: -1000, to: 1 }, { id: '1', label: '1–500 CE', from: 1, to: 500 }, { id: '500', label: '500–1000 CE', from: 500, to: 1000 },
  { id: '1000', label: '1000–1500', from: 1000, to: 1500 }, { id: '1500', label: '1500–1800', from: 1500, to: 1800 }, { id: '1800', label: '1800–1900', from: 1800, to: 1900 }, { id: '1900', label: '1900–1945', from: 1900, to: 1945 },
  { id: '1945', label: '1945 to today', from: 1945, to: Infinity },
];
const TRL_SORTS = [['az', 'A to Z'], ['old', 'Oldest first'], ['texts', 'Most texts']];
/* the Atlas gives four statuses; the page offers two choices and shows the four */
const TRL_STATUS_NAME = { L: 'Practised today', R: 'Revived in modern times', X: 'Ended', H: 'Became another tradition' };
const TRL_STATUS_CHOICES = [['now', 'Practised today'], ['ended', 'No longer practised']];
/* the kinds of tradition (the Atlas’s own list, in its order) in a few words, for the line under a name */
const TRL_KIND_SHORT = { rel: 'Religion', br: 'Major branch', sch: 'School, sect or denomination', mov: 'Movement or revival', eth: 'Ethnic or Indigenous', phil: 'Philosophy', myst: 'Mystery cult', esot: 'Esoteric current', nrm: 'New religious movement', syn: 'Syncretic', cult: 'Cult of a deity', arch: 'Archaeological horizon' };
/* a sentence for each of the Atlas’s nine groups of families, from the descriptions of its families (the same groups colour the map) */
const TRL_GROUP_LINE = {
  deep_past: 'Burials, ochre, figurines, cave art and monuments from before writing. What people believed is inferred from what they left.',
  ancient_worlds: 'The gods and rites of Mesopotamia, Egypt, Greece, Rome and pre-Christian Europe, and the mystery religions and philosophical schools of late antiquity.',
  abrahamic: 'Judaism, Christianity, Islam and the Bahá’í Faith, with their branches, schools and offshoots.',
  iranian: 'Zoroastrianism and the related traditions of the Iranian world: Manichaeism, Mandaeism, Yazidism and Yarsanism.',
  indian: 'Hinduism, Buddhism, Jainism, Sikhism and the Indigenous traditions of South and Himalayan Asia.',
  east_inner_asia: 'Chinese, Korean, Japanese and Vietnamese traditions, the shamanic and Arctic religions of Inner Asia and Siberia, and the local religions of Southeast Asia.',
  africa: 'Indigenous religions of Africa, and the religions that Africans and their descendants formed in the Americas.',
  americas_oceania: 'Indigenous religions of the Americas, of Australia and of the Pacific.',
  modern_currents: 'Hermetic, Theosophical and Spiritualist currents, modern Paganism, new religious movements and humanist traditions.',
};

const trlOwn = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);
const trlKey = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const trlEraOf = (y) => (typeof y === 'number' && isFinite(y) ? (TRL_ERAS.find((e) => y >= e.from && y < e.to) || TRL_ERAS[TRL_ERAS.length - 1]).id : '');
const trlStatusClass = (c) => (c === 'L' || c === 'R' ? 'now' : c === 'X' || c === 'H' ? 'ended' : '');
const trlStatusOf = (v) => (v === 'now' || v === 'L' || v === 'R' ? 'now' : v === 'ended' || v === 'X' || v === 'H' ? 'ended' : '');      /* the older codes still open the page */
const trlFilterNoQ = (st) => !!(st.b || st.g || st.f || st.r || st.e || st.s || st.k || st.x);
const trlHasFilter = (st) => !!st.q || trlFilterNoQ(st);
/* what the address may name: ctx = { beliefs: [ids], groups: [ids], fam: { id: family }, kinds: { code: label } } */
const trlCtx = (ix, beliefs) => ({ beliefs: (beliefs || []).map((b) => b.id), groups: ix.groups.map((g) => g.id), fam: ix.fam, kinds: ix.codes.tradition_kind });
/* the state: { q, b, g, f, r, e, s, k, x, o, all, n }. all is “the whole list is shown”: it is true whenever there is a filter, a chosen order or a second page */
function trlParse(query, ctx) {
  const x = query && typeof query === 'object' ? query : {}; const s = (k) => (trlOwn(x, k) && typeof x[k] === 'string' ? x[k] : ''); const c = ctx || {}; const has = (a, v) => Array.isArray(a) && v !== '' && a.includes(v);
  const st = { q: s('q').trim().slice(0, 80), b: has(c.beliefs, s('b')) ? s('b') : '', g: has(c.groups, s('g')) ? s('g') : '', f: trlOwn(c.fam, s('f')) ? s('f') : '', r: TRL_REGIONS.includes(s('r')) ? s('r') : '', e: TRL_ERAS.some((e) => e.id === s('e')) ? s('e') : '',
    s: trlStatusOf(s('s')), k: trlOwn(c.kinds, s('k')) ? s('k') : '', x: s('x') === '1', o: TRL_SORTS.some((o) => o[0] === s('o')) ? s('o') : '', all: false, n: 1 };
  if (st.f) st.g = '';      /* a family is narrower than its group */
  const n = parseInt(s('n'), 10); if (Number.isInteger(n) && n >= 1) st.n = Math.min(n, TRL_MAX_PAGES);
  st.all = s('all') === '1' || trlHasFilter(st) || !!st.o || st.n > 1;
  return st;
}
/* a state as the parts of an address, leaving out what is the default */
function trlQuery(st) {
  const q = {}; ['q', 'b', 'g', 'f', 'r', 'e', 's', 'k'].forEach((k) => { if (st[k]) q[k] = st[k]; }); if (st.x) q.x = '1'; if (st.o) q.o = st.o;
  if (st.n > 1) q.n = String(st.n); else if (st.all && !trlHasFilter(st) && !st.o) q.all = '1';
  return q;
}
const trlHref = (st) => { const p = new URLSearchParams(trlQuery(st)).toString(); return '#/atlas/traditions' + (p ? '?' + p : ''); };
/* the address carries something this page reads (an empty address, or one with only unknown parts, shows the last choice, or the overview) */
const trlTouched = (query) => !!query && typeof query === 'object' && ['q', 'b', 'g', 'f', 'r', 'e', 's', 'k', 'x', 'o', 'all', 'n'].some((k) => Object.prototype.hasOwnProperty.call(query, k));
const TRL_BLANK = { q: '', b: '', g: '', f: '', r: '', e: '', s: '', k: '', x: false, o: '', all: false, n: 1 };
/* the state after a change: choosing a family drops the group and the other way about, any change but “more” starts again at the first page, and the list stays open (only the overview’s own way back closes it) */
function trlNext(st, patch, ctx) {
  const p = patch && typeof patch === 'object' ? patch : {}; const m = Object.assign({}, st, p);
  if (p.f) m.g = ''; if (p.g) m.f = ''; if (!('n' in p)) m.n = 1;
  const r = trlParse(trlQuery(m), ctx); if (st && st.all && p.all !== false) r.all = true;
  return r;
}
/* the choices cleared and the order kept, in the whole list (what “Clear filters” does) */
const trlCleared = (st, ctx) => trlNext(st, { q: '', b: '', g: '', f: '', r: '', e: '', s: '', k: '', x: false, all: true }, ctx);

/* the facts of every tradition, in the order of the Atlas. o = { beliefOf, aboutIds, texts (the catalogue records, or none), have (id → is the text in this copy), libById } */
function trlFacts(ix, o) {
  o = o || {}; const memo = {}; const have = typeof o.have === 'function' ? o.have : () => false; const libById = o.libById || null; const of = typeof o.beliefOf === 'function' ? o.beliefOf : () => ['inner'];
  const lib = (m, id) => (typeof o.aboutIds === 'function' ? o.aboutIds(m, id, libById) : []);
  const own = Object.create(null); (o.texts || []).forEach((x) => { const e = own[x.tradition_id] || (own[x.tradition_id] = { n: 0, ids: [] }); e.n++; (Array.isArray(x.libs) && x.libs.length ? x.libs : x.lib ? [x.lib] : []).forEach((i) => { if (typeof i === 'string' && (!libById || libById[i])) e.ids.push(i); }); });
  return ix.core.traditions.map((t) => {
    const e = own[t.id] || { n: 0, ids: [] }; const lore = lib(ix.core.lore, t.id); const about = lib(ix.core.about, t.id).filter((x) => !lore.includes(x));
    const held = new Set(e.ids.concat(lore, about)); let read = 0; held.forEach((i) => { if (have(i)) read++; });
    const c = ix.countries && ix.countries[t.origin_country_iso2];
    return { id: t.id, name: t.name, key: trlKey(t.name), y: typeof t.start_year === 'number' ? t.start_year : 0, bel: of(ix.trad, t.id, memo), g: ix.famGroup[t.family_id] || '', f: t.family_id || '', r: c && TRL_REGIONS.includes(c[1]) ? c[1] : '', e: trlEraOf(t.start_year),
      s: trlStatusClass(t.status), sc: t.status || '', k: t.kind || '', n: e.n + about.length + lore.length, read };
  });
}
/* does a tradition pass every filter but the one named in `skip` (a facet: b, fam, r, e, s, k, x)? The name search is separate: see trlIds */
function trlMatch(r, st, skip) {
  return (skip === 'b' || !st.b || r.bel.includes(st.b)) && (skip === 'fam' || ((!st.g || r.g === st.g) && (!st.f || r.f === st.f))) && (skip === 'r' || !st.r || r.r === st.r) && (skip === 'e' || !st.e || r.e === st.e)
    && (skip === 's' || !st.s || r.s === st.s) && (skip === 'k' || !st.k || r.k === st.k) && (skip === 'x' || !st.x || r.read > 0);
}
/* the traditions the name search finds: o.ids is the answer of the Atlas’s search (best first); without it a plain match on the name decides */
const trlIds = (F, st, o) => (!st.q ? null : o && Array.isArray(o.ids) ? new Set(o.ids) : new Set(F.filter((r) => r.key.includes(trlKey(st.q))).map((r) => r.id)));
const trlCmp = (a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
/* the order: A to Z, oldest first, most texts; with a name typed and no order chosen, the best match first (o.ids is in that order) */
function trlSort(list, st, o) {
  const by = st.o || (st.q ? 'match' : 'az'); const out = list.slice();
  if (by === 'match' && o && Array.isArray(o.ids)) { const rank = new Map(); o.ids.forEach((id, i) => { if (!rank.has(id)) rank.set(id, i); }); return out.sort((a, b) => (rank.has(a.id) ? rank.get(a.id) : 1e9) - (rank.has(b.id) ? rank.get(b.id) : 1e9) || trlCmp(a, b)); }
  if (by === 'old') return out.sort((a, b) => a.y - b.y || trlCmp(a, b));
  if (by === 'texts') return out.sort((a, b) => b.n - a.n || trlCmp(a, b));
  return out.sort(trlCmp);
}
function trlFilter(F, st, o) { const ids = trlIds(F, st, o); return trlSort(F.filter((r) => (!ids || ids.has(r.id)) && trlMatch(r, st)), st, o); }
/* how many each choice would give, with the other filters kept: { b: {one: 212}, g: {}, f: {}, r: {}, e: {}, s: {}, k: {}, x: n, total } (a facet ignores its own choice, so every other value is shown with its true count) */
function trlCounts(F, st, o) {
  const ids = trlIds(F, st, o); const out = { b: {}, g: {}, f: {}, r: {}, e: {}, s: {}, k: {}, x: 0, total: 0 }; const add = (m, k) => { if (k !== '' && k != null) m[k] = (m[k] || 0) + 1; };
  F.forEach((r) => {
    if (ids && !ids.has(r.id)) return;
    if (trlMatch(r, st)) out.total++;
    if (trlMatch(r, st, 'b')) r.bel.forEach((b) => add(out.b, b));
    if (trlMatch(r, st, 'fam')) { add(out.g, r.g); add(out.f, r.f); }
    if (trlMatch(r, st, 'r')) add(out.r, r.r); if (trlMatch(r, st, 'e')) add(out.e, r.e); if (trlMatch(r, st, 's')) add(out.s, r.s); if (trlMatch(r, st, 'k')) add(out.k, r.k);
    if (trlMatch(r, st, 'x') && r.read > 0) out.x++;
  });
  return out;
}
/* the overview: each group of families of the Atlas, in the Atlas’s order, with its count and its sentence */
const trlOverview = (F, ix, lines) => ix.groups.map((g) => ({ id: g.id, label: g.label, line: (lines && lines[g.id]) || '', n: F.filter((r) => r.g === g.id).length }));
/* the last choice: kept when it was a choice (a filter, an order, or “Show all”), forgotten when the person went back to the overview, left alone when the list is only a search */
function trlRemember(store, st) {
  try {
    if (!store) return;
    if (!st.all) { store.del(TRL_KEY); return; }
    if (st.q && !trlFilterNoQ(st) && !st.o) return;
    store.set(TRL_KEY, trlQuery(Object.assign({}, st, { q: '', n: 1 })));
  } catch (e) { /* nowhere to keep it: the page still works */ }
}
function trlRecall(store, ctx) {
  try { const v = store && store.get(TRL_KEY, null); if (!v || typeof v !== 'object' || Array.isArray(v)) return null; const st = trlParse(v, ctx); return st.all ? st : null; } catch (e) { return null; }
}
/* the date shown in a row: when it began, in the Atlas’s words, without the “years ago” and without the end (the end is on the tradition’s own page) */
function trlWhen(t, fmt) {
  const lab = String((t && t.date_label) || '').replace(/\s*\(~[^)]*\)/g, '').split(' → ')[0].trim();
  return lab || (t && typeof t.start_year === 'number' && typeof fmt === 'function' ? fmt(t.start_year, t.start_circa) : '');
}
if (typeof module !== 'undefined' && module.exports) module.exports = { TRL_PER, TRL_MAX_PAGES, TRL_KEY, TRL_REGIONS, TRL_ERAS, TRL_SORTS, TRL_STATUS_NAME, TRL_STATUS_CHOICES, TRL_KIND_SHORT, TRL_GROUP_LINE, TRL_BLANK, trlOwn, trlKey, trlEraOf, trlStatusClass, trlStatusOf, trlHasFilter, trlFilterNoQ, trlCtx, trlParse, trlQuery, trlHref, trlTouched, trlNext, trlCleared, trlFacts, trlMatch, trlIds, trlSort, trlFilter, trlCounts, trlOverview, trlRemember, trlRecall, trlWhen };
