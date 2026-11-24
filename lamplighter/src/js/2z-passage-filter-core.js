/* ═══════════════════════════ 2z · Random: the filters (pure) ═══════════════════════════
   The Random page draws from the books that pass its filters. This file is the arithmetic of that, with no page in it (tests/passage-filter.test.js): the state of the filters, the facts of every book that
   the filters ask about, the pool they leave, the count beside every choice, the address that carries them and the line that says what is on.
   Six sections, which combine: Religions and traditions (r), Periods (p, dated), Books (b), Kinds of text (k), Shelves (a) and the pool they draw from (base: "Scriptures and sources only", or everything).
   Inside a section the choices add (Buddhism and Hinduism); between sections they narrow (those, before 500 CE, and hymns). A choice never leads nowhere unseen: every choice carries the number of
   books it would give with the other sections kept, and zero is shown as zero.
   Where each fact comes from (the page says so too, and none of it is a verdict):
     · a book's religions: the Atlas ties a catalogue record, a book about a tradition, or an old source to it (tools/passage_index.js, 2z-passage-index.js); a book the Atlas ties to nothing is placed by the
       Library shelf it stands on where that shelf holds one religion (PSF_SHELF_TRAD), or by the family of its shelf (PSF_SHELF_FAMILY); the rest have no religion and are left out when one is chosen;
     · a book's years: the date the Library's own catalogue gives it, read as the years it names (psfWhen); where that gives none, the years of the Atlas record linked to it;
     · a book's kinds: the Atlas's category of the records linked to it, the kind of each Bible book (PSU_KIND), and what its shelf says it holds (outsiders' records, folk tales, a movement's own books, study aids).
   The address: ?pool=sources|all &r=t:buddhism.t:hinduism &p=~-501.1801~1930 &dated=1 &b=b-psa.b-pro &k=hym.wis &a=0.3 &t=<an old Journey tradition>; the old addresses (b, t, s, a, pool) mean what they meant. */

/* branches, schools, movements and the cults of a deity are nested under the tradition they grew from; every other kind of tradition is top of its own tree (the Atlas lists Christianity as grown from Judaism; it is
   not a part of it) */
const PSF_NEST = ['br', 'sch', 'mov', 'cult'];
/* the kinds of text a filter can name: [id, label, what it rests on] */
const PSF_KINDS = [
  ['scr', 'Scripture', 'The text records’ category “scripture or canon”, and every book on the Bible shelves.'],
  ['wis', 'Sayings and proverbs', 'The text records’ category “wisdom or ethics”, and the Bible’s books of wisdom.'],
  ['hym', 'Hymns and poems', 'The text records’ category “hymn, prayer or sacred song”, and the Psalms, laments and love poetry of the Bible.'],
  ['rit', 'Prayers and rituals', 'The text records’ categories “ritual or liturgy” and “devotional classic”, and the Bible’s prayers.'],
  ['myth', 'Myths and folk tales', 'The text records’ categories “myth or sacred epic” and “oral corpus”, and the shelves of folk tales and folklore.'],
  ['his', 'Histories and chronicles', 'The text records’ category “sacred history, chronicle or hagiography”, and the Bible’s histories.'],
  ['law', 'Laws', 'The text records’ category “religious law or discipline”, and the Torah.'],
  ['phi', 'Philosophy and mysticism', 'The text records’ categories “theology or religious philosophy”, “mysticism or esoteric teaching” and “commentary or exegesis”.'],
  ['mov', 'A movement’s own books', 'The Library’s shelves of modern movements, Spiritualism and Theosophy, and Freemasonry.'],
  ['out', 'Outsiders’ records', 'The text records’ category “ethnographic or outsider record”, and the shelves of field records and of trial and folklore collections.'],
  ['aid', 'Study aids', 'The Library’s shelf of books about religion: handbooks, histories and dictionaries.'],
];
const PSF_KIND_IDS = PSF_KINDS.map((k) => k[0]);
/* the Atlas's category of a catalogue record → a kind; a category with no kind here (inscription, calendar, divination, magic) names none */
const PSF_CAT_KIND = { scr: 'scr', wis: 'wis', hym: 'hym', rit: 'rit', dev: 'rit', myth: 'myth', ora: 'myth', his: 'his', law: 'law', eth: 'out', phi: 'phi', mys: 'phi', com: 'phi' };
/* what a shelf says it holds (LIB_STATUS in 2z-library-core.js): the shelves that are a kind of text in themselves */
const PSF_SHELF_KIND = { hb: ['scr'], dc: ['scr'], or: ['scr'], nt: ['scr'], na: ['out'], af: ['out'], pa: ['out'], si: ['out'], tb: ['out'], wi: ['out'], fu: ['out'], ta: ['myth'], tf: ['myth'], tm: ['myth'], tp: ['myth'], fi: ['myth'], mo: ['mov'], sp: ['mov'], ms: ['mov'], sc: ['aid'] };
/* the shelves that hold the books of one religion: a book the Atlas ties to nothing takes the religion of its shelf */
const PSF_SHELF_TRAD = { nt: ['christianity'], ec: ['christianity'], ju: ['judaism'], is: ['islam'], sk: ['sikhism'], ja: ['jainism'], bu: ['buddhism'], in: ['hinduism', 'vedic'], ir: ['zoroastrianism'], eg: ['egyptian'], me: ['mesopotamian'], ms: ['freemasonry'] };
/* and the families of the shelves that hold several: such a book belongs to the family, and to no one religion of it */
const PSF_SHELF_FAMILY = { hb: ['abrahamic'], dc: ['abrahamic'], or: ['abrahamic'], ps: ['abrahamic'], ds: ['abrahamic'], mo: ['abrahamic', 'esoteric'], gr: ['hellenistic', 'european'], ne: ['european'], ch: ['east_asian'], am: ['americas'], na: ['americas'], af: ['african'], pa: ['oceania'], si: ['inner_asian'], he: ['esoteric'], oc: ['esoteric'], sp: ['esoteric'],
  tm: ['americas'], tp: ['oceania'], tf: ['african', 'afro_diasporic'], fi: ['european'], fu: ['european'] };
/* a word in a book's title says what it is where nothing else does: [kind, the words, words that cancel it, placed wherever the book stands (true) or only where no category names a kind (false)] */
const PSF_TITLE_KIND = [
  ['myth', /\b(?:tales?|legends?|myths?|sagas?|fables?|stories|birth-stories|mabinogion|epic)\b/i, null, true],
  ['hym', /\b(?:hymns?|psalms?|songs?|odes?|poems?|poetry|rub[aá]iy[aá]t)\b/i, /\bexpositions? on\b|\bcommentar/i, false],
  ['rit', /\b(?:liturg\w+|rituals?|devotions|prayers?|rites)\b/i, null, false],
  ['law', /\b(?:laws?|institutes|statutes?|edicts?|declaration|bill of rights|constitutions)\b/i, null, false],
  ['wis', /\b(?:sayings|proverbs|maxims|aphorisms|meditations|table[- ]talk)\b/i, null, false],
  ['his', /\b(?:chronicles?|annals|church histor(?:y|ies)|records of)\b/i, null, false],
];
function psfTitleKinds(title, has) {
  const t = String(title == null ? '' : title).replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' '); const out = [];
  PSF_TITLE_KIND.forEach(([k, re, no, always]) => { if ((always || !has) && re.test(t) && !(no && no.test(t))) out.push(k); });
  return out;
}
const PSF_BELIEFS = ['one', 'many', 'spirit', 'inner'];      /* the four quick choices (2z-belief-core.js has their names) */
/* the ready-made periods: [id, label, first year, last year]; a year is negative for BCE and null is open; each is a range of whole years, so the five do not overlap */
const PSF_PERIODS = [
  ['p0', 'Before 500 BCE', null, -501], ['p1', '500 BCE to 500 CE', -500, 500], ['p2', '500 to 1500', 501, 1500], ['p3', '1500 to 1800', 1501, 1800], ['p4', '1800 to 1930', 1801, 1930], ['p5', 'After 1930', 1931, null],
];
/* the quick choices above the sections: [id, label, what they set] (anything set by hand afterwards is "Custom") */
const PSF_PRESETS = [
  ['sources', 'Scriptures and sources', { base: 'sources' }],
  ['all', 'Everything', { base: 'all' }],
  ['tales', 'Stories and folk tales', { base: 'all', k: ['myth'] }],
  ['poems', 'Poems and hymns', { base: 'all', k: ['hym'] }],
  ['sayings', 'Sayings and wisdom', { base: 'all', k: ['wis'] }],
];
const PSF_SECTIONS = ['r', 'p', 'b', 'k', 'a'];

/* ── the years a catalogue date gives ──
   The Library writes a date in its own words: "c. 586–500 BCE", "720 CE", "recorded 1860s–1900s CE", "c. 5th–6th c. CE", "1864 CE (trans. 1927)", "1616; English 1690". psfWhen reads the first date a
   string gives (the text's own, not its translation's or its edition's) as { from, to } in whole years (BCE negative), or null where it gives none ("oral"). "same" is the entry before it. */
const PSF_DATE = /(^|[^\w,.])(?:(\d{1,2})(?:st|nd|rd|th)(?:\s*c(?:\.|entury)?)?|(\d{2,4})s(?![a-z])|(\d{1,4})(?![\d,]))(?:\s*(BCE|BC|CE|AD)\b)?(?:\s*[–—-]\s*(?:(\d{1,2})(?:st|nd|rd|th)(?:\s*c(?:\.|entury)?)?|(\d{2,4})s(?![a-z])|(\d{1,4})(?![\d,]))(?:\s*(BCE|BC|CE|AD)\b)?)?/g;
const PSF_EDITION = /^\s*(?:English|Latin|Greek|Chinese|French|German|Waite|Mathers|Summers|published|printed|pub\.|trans|translation|revised|enlarged|this (?:ed|edition|selection)|third edition|\d{4}\s+ed\.)/i;
function psfSpan(cent, dec, num, era, lone) {
  let lo; let hi;
  if (cent != null) { const c = +cent; lo = (c - 1) * 100 + 1; hi = c * 100; } else if (dec != null) { lo = +dec; hi = lo + (lone && /^\d\d00$/.test(dec) ? 99 : 9); } else { lo = +num; hi = lo; }
  return era === 'B' ? [-hi, -lo] : [lo, hi];
}
function psfClause(clause, inherit) {
  const re = new RegExp(PSF_DATE.source, 'g'); const eraOf = (e) => (e ? (/^B/.test(e) ? 'B' : 'C') : ''); let m;
  while ((m = re.exec(clause))) {
    if (m[4] != null && !m[5] && /^\s*:/.test(clause.slice(re.lastIndex, re.lastIndex + 3))) continue;      /* "1–39: 8th c." is a part of a book, not a year */
    const hasEnd = m[6] != null || m[7] != null || m[8] != null; const eraA = eraOf(m[5]); const eraB = eraOf(m[9]);
    const eraStart = eraA || (hasEnd ? (eraB || inherit || 'C') : (inherit || 'C')); const eraEnd = hasEnd ? (eraB || eraA || inherit || 'C') : eraStart;
    const a = psfSpan(m[2], m[3], m[4], eraStart, !hasEnd); if (!hasEnd) return a;
    let endNum = m[8]; if (endNum != null && m[4] != null && endNum.length < m[4].length && eraStart !== 'B' && eraEnd !== 'B') endNum = m[4].slice(0, m[4].length - endNum.length) + endNum;      /* "1901–02", "1530–80" */
    const b = psfSpan(m[6], m[7], endNum, eraEnd, false);
    return [Math.min(a[0], b[0]), Math.max(a[1], b[1])];
  }
  return null;
}
function psfWhen(str, prev) {
  const s = String(str == null ? '' : str).replace(/\s+/g, ' ').trim(); if (!s) return null;
  if (/^same$/i.test(s)) return prev || null;
  const inherit = /\b(?:BCE|BC)\b/.test(s) && !/\b(?:CE|AD)\b/.test(s) ? 'B' : ''; const clauses = s.split(';');
  if (/^\s*\d+[–-]\d+:/.test(clauses[0])) {      /* "1–39: 8th c.; 40–55: 6th c.; 56–66: 5th c. BCE": the parts of one book, each with its date */
    let lo = Infinity; let hi = -Infinity; clauses.forEach((c) => { if (!/^\s*\d+[–-]\d+:/.test(c)) return; const r = psfClause(c, inherit); if (r) { lo = Math.min(lo, r[0]); hi = Math.max(hi, r[1]); } });
    if (lo <= hi) return { from: lo, to: hi };
  }
  let r = null;
  for (const c of clauses) { if (PSF_EDITION.test(c)) continue; r = psfClause(c, inherit); if (r) break; }      /* the text's own date first: not "English 1690", "pub. 1910" */
  if (!r) for (const c of clauses) { r = psfClause(c, inherit); if (r) break; }
  return r ? { from: r[0], to: r[1] } : null;
}
/* a year written for a person: 500 BCE, 1623 */
const psfYear = (n) => (n < 0 ? `${-n} BCE` : n < 1000 ? `${n} CE` : String(n));
const psfSame = (r, a, b) => !!r && (r[0] == null ? a == null : r[0] === a) && (r[1] == null ? b == null : r[1] === b);
function psfRangeLabel(a, b) {
  const chip = PSF_PERIODS.find((p) => psfSame([p[2], p[3]], a, b)); if (chip) return chip[1];
  if (a == null) return `up to ${psfYear(b)}`; if (b == null) return `from ${psfYear(a)}`; return a === b ? psfYear(a) : `${psfYear(a)} to ${psfYear(b)}`;
}
const psfOverlap = (y0, y1, a, b) => (a == null || y1 >= a) && (b == null || y0 <= b);

/* ── a book's facts ──
   lib: the Library list ({ id, title, group, when }); o: { readable(l), coll(group) → the collection's number, src(l) (in "Scriptures and sources" for a passage), pg(l) (on the shelves of scriptures and sources, scans
   included, for a page), idx (the tables of 2z-passage-index.js), kinds (PSU_KIND), shelfBelief (SHELF_BELIEF of 2z-belief-core.js) }. Each fact: { id, title, group, c, y0, y1, s, p, rs, ks }.
   rs is the set of what the book can be chosen by under Religions: 't:<tradition>' (itself and what it is nested under), 'f:<family>', 'g:<group of families>', 'b:<belief label>'. */
function psfGenre(g) {
  const k = []; const s = String(g || '');
  if (/psalm|lament|love poetry|hymn/.test(s)) k.push('hym'); if (/prayer/.test(s)) k.push('rit'); if (/wisdom/.test(s)) k.push('wis'); if (/wisdom poetry/.test(s) && !k.includes('hym')) k.push('hym');
  if (/\blaw\b/.test(s)) k.push('law'); if (/histor/.test(s)) k.push('his');
  return k;
}
function psfFacts(lib, o) {
  const x = o || {}; const idx = x.idx || {}; const trads = idx.PSF_TRADS || {}; const links = idx.PSF_LINKS || {}; const cats = idx.PSF_CATS || {}; const yrs = idx.PSF_YEARS || {}; const kindTab = x.kinds || {}; const sb = x.shelfBelief || {};
  const famGroup = {}; (idx.PSF_GROUPS || []).forEach((g) => g[2].forEach((f) => { famGroup[f] = g[0]; }));
  const out = []; let prev = null;
  for (const l of lib) {
    const w = psfWhen(l.when, prev); if (w) prev = w;
    if (x.readable && !x.readable(l)) continue;
    let direct = String(links[l.id] || '').split(' ').filter((t) => t && trads[t]); if (!direct.length) direct = (PSF_SHELF_TRAD[l.group] || []).filter((t) => trads[t]);
    const rs = new Set(); const addFam = (f) => { if (!f) return; rs.add('f:' + f); if (famGroup[f]) rs.add('g:' + famGroup[f]); };
    for (const t of direct) {
      for (let c = t, n = 0; c && trads[c] && n < 60; c = trads[c][2], n++) rs.add('t:' + c);
      addFam(trads[t][1]); String(trads[t][3] || '').split(' ').forEach((b) => { if (PSF_BELIEFS.includes(b)) rs.add('b:' + b); });
    }
    if (!direct.length) { (PSF_SHELF_FAMILY[l.group] || []).forEach(addFam); (sb[l.group] || []).forEach((b) => { if (PSF_BELIEFS.includes(b)) rs.add('b:' + b); }); }
    const ks = new Set(PSF_SHELF_KIND[l.group] || []); String(cats[l.id] || '').split(' ').forEach((c) => { if (PSF_CAT_KIND[c]) ks.add(PSF_CAT_KIND[c]); }); psfGenre(kindTab[l.id]).forEach((k) => ks.add(k)); psfTitleKinds(l.title, ks.size > 0).forEach((k) => ks.add(k));
    let y0 = null; let y1 = null; if (w) { y0 = w.from; y1 = w.to; } else if (yrs[l.id]) { y0 = yrs[l.id][0]; y1 = yrs[l.id][1]; }
    out.push({ id: l.id, title: l.title, group: l.group, c: x.coll ? x.coll(l.group) : -1, y0, y1, s: !!(x.src && x.src(l)), p: !!(x.pg && x.pg(l)), rs, ks: PSF_KIND_IDS.filter((k) => ks.has(k)) });
  }
  return out;
}

/* ── the state ──
   { base: 'sources' | 'all', r: ['t:buddhism', 'g:abrahamic', 'f:dharmic', 'b:one'], p: [[from, to]], dated: false, b: [book ids], k: [kind ids], a: [collection numbers], x: an old Journey tradition's id or '' }
   x is what the old address ?t= named: the books at that tradition's stations (the page supplies them). It is kept out of the saved state and out of the new sections, and shows as a choice that can be taken off. */
const psfBlank = () => ({ base: 'sources', r: [], p: [], dated: false, b: [], k: [], a: [], x: '', lo: null });      /* lo: the collections this filter leaves out, or null for the ones the Library leaves out (a saved filter keeps its own) */
const PSF_SEL = /^([tfgb]):([A-Za-z0-9_-]{1,80})$/;
const psfUniq = (a) => a.filter((v, i) => a.indexOf(v) === i);
const psfPlural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
/* a state made safe: only choices that exist (ctx: { books: {id: true}, nColl, groups, fams, trads, legacy }), once each, ranges the right way round */
function psfNorm(st, ctx) {
  const s = st && typeof st === 'object' ? st : {}; const c = ctx || {}; const out = psfBlank(); const arr = (v) => (Array.isArray(v) ? v : []);
  out.base = s.base === 'all' ? 'all' : 'sources';
  out.r = psfUniq(arr(s.r).filter((v) => { const m = typeof v === 'string' ? PSF_SEL.exec(v) : null; if (!m) return false; if (!c.trads) return true; const own = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k); return m[1] === 't' ? own(c.trads, m[2]) : m[1] === 'f' ? own(c.fams, m[2]) : m[1] === 'g' ? own(c.groups, m[2]) : PSF_BELIEFS.includes(m[2]); }));      /* a name like __proto__ or constructor is not a tradition */
  const rg = []; arr(s.p).forEach((v) => { if (!Array.isArray(v)) return; let a = Number.isInteger(v[0]) ? v[0] : null; let b = Number.isInteger(v[1]) ? v[1] : null; if (a == null && b == null) return; if (a != null && b != null && a > b) [a, b] = [b, a]; if (!rg.some((q) => q[0] === a && q[1] === b)) rg.push([a, b]); });
  out.p = rg.sort((u, v) => (u[0] == null ? -Infinity : u[0]) - (v[0] == null ? -Infinity : v[0]) || (u[1] == null ? Infinity : u[1]) - (v[1] == null ? Infinity : v[1])).slice(0, 12);
  out.dated = s.dated === true;
  out.b = psfUniq(arr(s.b).filter((v) => typeof v === 'string' && (!c.books || c.books[v] === true))).slice(0, 400);
  out.k = psfUniq(arr(s.k).filter((v) => PSF_KIND_IDS.includes(v)));
  out.a = psfUniq(arr(s.a).filter((v) => Number.isInteger(v) && v >= 0 && (c.nColl == null || v < c.nColl))).sort((u, v) => u - v);
  out.x = typeof s.x === 'string' && s.x && (!c.legacy || c.legacy[s.x] === true) ? s.x : '';
  out.lo = Array.isArray(s.lo) ? psfUniq(s.lo.filter((v) => Number.isInteger(v) && v >= 0 && (c.nColl == null || v < c.nColl))).sort((u, v) => u - v) : null;
  return out;
}
const psfScoped = (st) => !!(st.r.length || st.p.length || st.dated || st.b.length || st.k.length || st.a.length || st.x || st.lo);
const psfActive = (st) => PSF_SECTIONS.filter((k) => (k === 'p' ? st.p.length || st.dated : st[k].length)).length + (st.x ? 1 : 0);
/* the choices of a preset on a blank state; which preset a state is (sources, all, tales, poems, sayings), or 'custom' */
function psfPreset(id, ctx) { const p = PSF_PRESETS.find((q) => q[0] === id); return p ? psfNorm(Object.assign(psfBlank(), p[2]), ctx) : null; }
function psfPresetOf(st) {
  const s = psfNorm(st, null);
  for (const [id, , def] of PSF_PRESETS) { const d = Object.assign(psfBlank(), def); if (s.base === d.base && s.lo === null && !s.r.length && !s.p.length && !s.dated && !s.b.length && !s.a.length && !s.x && s.k.length === d.k.length && s.k.every((k, i) => k === d.k[i])) return id; }
  return 'custom';
}
const psfEqual = (u, v) => JSON.stringify(psfNorm(u, null)) === JSON.stringify(psfNorm(v, null));

/* ── the pool ──
   o: { mode: 'passage' | 'page' | 'pages' (a passage draws from clean typed editions, a page from the same shelves with their scans), leftOut: Set of collection numbers the reader has left out, legacy(x) → Set of book ids }.
   A book is in the pool when it passes every section that has a choice in it, AND the pool it is drawn from; a book named under Books is always in the pool (named books are drawn from wherever they sit), and
   a shelf ticked under Shelves, or named by an old address, is drawn from even when it is left out (the imagined shelf, to begin with). */
function psfPrep(st, o) {
  const x = o || {}; return { base: st.base, mode: x.mode || 'passage', r: st.r, p: st.p, dated: !!st.dated, b: new Set(st.b), nb: st.b.length, k: new Set(st.k), a: new Set(st.a), xs: st.x && x.legacy ? (x.legacy(st.x) || new Set()) : st.x ? new Set() : null, leftOut: st.lo ? new Set(st.lo) : x.leftOut || null };
}
/* skip: leave one section out of the test (to count what a choice in it would add); as: treat the book's own shelf as ticked; named: treat the book as named */
function psfIn(f, P, skip, as, named) {
  if (P.xs && !P.xs.has(f.id)) return false;
  const nm = !!named || P.b.has(f.id);
  if (skip !== 'b' && P.nb && !nm) return false;
  if (!nm && P.base === 'sources' && !(P.mode === 'passage' ? f.s : f.p)) return false;
  const tick = !!as || P.a.has(f.c);
  if (!nm && !tick && !P.xs && P.leftOut && P.leftOut.has(f.c)) return false;
  if (skip !== 'a' && P.a.size && !P.a.has(f.c)) return false;
  if (skip !== 'r' && P.r.length) { let hit = false; for (const sel of P.r) if (f.rs.has(sel)) { hit = true; break; } if (!hit) return false; }
  if (skip !== 'p') { if (f.y0 == null) { if (P.dated) return false; } else if (P.p.length && !P.p.some((q) => psfOverlap(f.y0, f.y1, q[0], q[1]))) return false; }
  if (skip !== 'k' && P.k.size) { let hit = false; for (const k of f.ks) if (P.k.has(k)) { hit = true; break; } if (!hit) return false; }
  return true;
}
const psfPool = (F, st, o) => { const P = psfPrep(st, o); return F.filter((f) => psfIn(f, P)); };
/* what each choice would give: { total, base: { sources, all }, r: { 't:buddhism': n }, p: { p0: n }, k: { hym: n }, a: { 0: n }, b: Set of the books that would give a draw, undated: books with no date in the pool }.
   A count is the size of the pool if that choice alone stood in its section and every other section stayed as it is, so it is what choosing it adds, and zero means choosing it would leave nothing. */
function psfCounts(F, st, o) {
  const P = psfPrep(st, o); const out = { total: 0, base: { sources: 0, all: 0 }, r: {}, p: {}, k: {}, a: {}, b: new Set(), undated: 0 };
  const chips = PSF_PERIODS.map((q) => [q[0], q[2], q[3]]);
  const Ps = Object.assign({}, P, { base: 'sources' }); const Pa = Object.assign({}, P, { base: 'all' });
  for (const f of F) {
    if (psfIn(f, P)) { out.total++; if (f.y0 == null) out.undated++; }
    if (psfIn(f, Ps)) out.base.sources++; if (psfIn(f, Pa)) out.base.all++;
    if (psfIn(f, P, 'r')) f.rs.forEach((sel) => { out.r[sel] = (out.r[sel] || 0) + 1; });
    if (psfIn(f, P, 'k')) f.ks.forEach((k) => { out.k[k] = (out.k[k] || 0) + 1; });
    if (psfIn(f, P, 'a', true)) out.a[f.c] = (out.a[f.c] || 0) + 1;
    if (psfIn(f, P, 'b', false, true)) out.b.add(f.id);
    if (psfIn(f, P, 'p')) for (const [id, a, b] of chips) if (f.y0 == null ? !P.dated : psfOverlap(f.y0, f.y1, a, b)) out.p[id] = (out.p[id] || 0) + 1;
  }
  return out;
}
/* when the pool is empty: what taking one section off would give, most books first (a section off, the others kept) */
function psfRelax(F, st, o) {
  const out = []; const n = (s) => psfPool(F, s, o).length;
  PSF_SECTIONS.forEach((k) => { if (k === 'p' ? !(st.p.length || st.dated) : !st[k].length) return; const s = Object.assign({}, st, k === 'p' ? { p: [], dated: false } : { [k]: [] }); const m = n(s); if (m > 0) out.push({ sec: k, n: m }); });
  if (st.x) { const m = n(Object.assign({}, st, { x: '' })); if (m > 0) out.push({ sec: 'x', n: m }); }
  if (st.lo) { const m = n(Object.assign({}, st, { lo: null })); if (m > 0) out.push({ sec: 'lo', n: m }); }
  if (st.base === 'sources') { const m = n(Object.assign({}, st, { base: 'all' })); if (m > 0) out.push({ sec: 'base', n: m }); }
  return out.sort((u, v) => v.n - u.n);
}
/* how many books a religion (or family, group or belief) holds whatever else is chosen, for the order of the tree */
function psfHeld(F) { const h = {}; for (const f of F) f.rs.forEach((sel) => { h[sel] = (h[sel] || 0) + 1; }); return h; }
/* the tree of religions: groups of families → families → religions, each with the religions nested under it; a node is { sel, label, held, kids }. Only what holds a book is in it. */
function psfTree(idx, held) {
  const trads = idx.PSF_TRADS || {}; const fams = idx.PSF_FAMILIES || {}; const kids = {}; const rootsOf = {};
  Object.keys(trads).forEach((id) => { const t = trads[id]; if (!(held['t:' + id] > 0)) return; if (t[2] && trads[t[2]]) (kids[t[2]] = kids[t[2]] || []).push(id); else (rootsOf[t[1]] = rootsOf[t[1]] || []).push(id); });
  const order = (a) => a.sort((u, v) => (held['t:' + v] || 0) - (held['t:' + u] || 0) || trads[u][0].localeCompare(trads[v][0]));
  const node = (id) => ({ sel: 't:' + id, id, label: trads[id][0], held: held['t:' + id] || 0, kids: order(kids[id] || []).map(node) });
  return (idx.PSF_GROUPS || []).map((g) => ({ sel: 'g:' + g[0], id: g[0], label: g[1], held: held['g:' + g[0]] || 0, families: g[2].filter((f) => held['f:' + f] > 0).map((f) => ({ sel: 'f:' + f, id: f, label: fams[f] || f, held: held['f:' + f] || 0, roots: order((rootsOf[f] || []).slice()).map(node) })) })).filter((g) => g.held > 0);
}

/* ── the address ── */
const psfEnc = (v) => encodeURIComponent(v).replace(/%3A/g, ':').replace(/%7E/g, '~');
/* a state as the parts of an address (the keys it uses; none for the plain default, unless `always`: the page writes the pool every time, so a link says what it was drawn from whatever the person who opens it has kept) */
function psfQuery(st, always) {
  const s = psfNorm(st, null); const q = {};
  if (always || psfScoped(s) || s.base === 'all') q.pool = s.base;
  if (s.r.length) q.r = s.r.join('.');
  if (s.p.length) q.p = s.p.map((v) => (v[0] == null ? '' : v[0]) + '~' + (v[1] == null ? '' : v[1])).join('.');
  if (s.dated) q.dated = '1';
  if (s.b.length) q.b = s.b.join('.');
  if (s.k.length) q.k = s.k.join('.');
  if (s.a.length) q.a = s.a.join('.');
  if (s.x) q.t = s.x;
  if (s.lo) q.lo = s.lo.length ? s.lo.join('.') : '-';
  return q;
}
const psfQueryString = (st, always) => Object.entries(psfQuery(st, always)).map(([k, v]) => `&${k}=${psfEnc(v)}`).join('');
/* an address read into a state. ctx: { books, nColl, collNames, groups, fams, trads, legacy }. The old addresses mean what they meant: ?b= a book, ?t= an old Journey tradition's books, ?s= a collection by name,
   ?a= collections by number, ?pool=all everything, and, without a pool, a place named draws from all of what is on it (the new page always writes the pool). */
function psfParse(q, ctx) {
  const x = q && typeof q === 'object' ? q : {}; const c = ctx || {}; const own = (k) => Object.prototype.hasOwnProperty.call(x, k) && typeof x[k] === 'string'; const list = (k) => (own(k) ? x[k].split('.').filter(Boolean) : []);
  const raw = psfBlank();
  raw.r = list('r'); raw.b = list('b'); raw.k = list('k'); raw.a = list('a').filter((v) => /^\d{1,3}$/.test(v)).map(Number);
  if (own('s') && c.collNames) { const i = c.collNames.indexOf(x.s); if (i >= 0) raw.a.push(i); }
  raw.p = list('p').map((v) => { const m = /^(-?\d{1,6})?~(-?\d{1,6})?$/.exec(v); return m ? [m[1] != null ? +m[1] : null, m[2] != null ? +m[2] : null] : null; }).filter(Boolean);
  raw.dated = own('dated') && x.dated === '1';
  if (own('t') && c.legacy && c.legacy[x.t] === true) raw.x = x.t;
  if (own('lo')) raw.lo = x.lo === '-' ? [] : list('lo').filter((v) => /^\d{1,3}$/.test(v)).map(Number);
  const s = psfNorm(raw, c); const pool = own('pool') && (x.pool === 'all' || x.pool === 'sources') ? x.pool : '';
  s.base = pool ? pool : psfScoped(s) ? 'all' : 'sources';
  return s;
}
const PSF_KEYS = ['pool', 'r', 'p', 'dated', 'b', 'k', 'a', 's', 't', 'lo', 'f'];
const psfTouched = (q) => !!q && typeof q === 'object' && PSF_KEYS.some((k) => Object.prototype.hasOwnProperty.call(q, k));
/* what is kept between visits (never the old Journey link): and read back */
const psfSave = (st) => { const s = psfNorm(st, null); return { base: s.base, r: s.r, p: s.p, dated: s.dated, b: s.b, k: s.k, a: s.a, lo: s.lo }; };
const psfLoad = (v, ctx) => psfNorm(v && typeof v === 'object' && !Array.isArray(v) ? Object.assign({}, v, { x: '' }) : {}, ctx);
/* the choice an earlier version kept as passage.scope / passage.areas, as a state: { k: 'shelf', v: name } | { k: 'trad', v: id } | { k: 'all' } | { k: 'sources' } | { k: 'areas' } with the names of the areas */
function psfFromOld(scope, areaNames, ctx) {
  const c = ctx || {}; const s = psfBlank(); const sc = scope && typeof scope === 'object' ? scope : {}; const names = Array.isArray(areaNames) ? areaNames : []; const at = (n) => (c.collNames ? c.collNames.indexOf(n) : -1);
  if (sc.k === 'shelf' && at(sc.v) >= 0) { s.a = [at(sc.v)]; s.base = 'all'; } else if (sc.k === 'trad' && c.legacy && c.legacy[sc.v] === true) { s.x = sc.v; s.base = 'all'; } else if (sc.k === 'all') s.base = 'all';
  else if (names.length || sc.k === 'areas') { s.a = names.map(at).filter((n) => n >= 0); if (s.a.length) s.base = 'all'; }
  return psfNorm(s, c);
}

/* ── what is on, in a line ──
   o: { rel(sel) → the name, book(id) → a short title, shelf(n) → a shelf's name }. Returns { base, parts: [{ sec, text }] }; the page joins them with " · " and adds how many books match. */
function psfSummary(st, o) {
  const s = psfNorm(st, null); const x = o || {}; const parts = []; const names = (a, f) => a.map(f).filter(Boolean);
  if (s.r.length) parts.push({ sec: 'r', text: names(s.r, (v) => (x.rel ? x.rel(v) : v)).join(', ') });
  if (s.p.length) parts.push({ sec: 'p', text: s.p.map((v) => psfRangeLabel(v[0], v[1])).join(', ') });
  if (s.dated) parts.push({ sec: 'p', text: 'dated texts only' });
  if (s.b.length) parts.push({ sec: 'b', text: s.b.length <= 3 && x.book ? names(s.b, x.book).join(', ') : `${s.b.length} books` });
  if (s.k.length) parts.push({ sec: 'k', text: s.k.map((k) => (PSF_KINDS.find((q) => q[0] === k) || [0, k])[1].toLowerCase()).join(', ') });
  if (s.a.length) parts.push({ sec: 'a', text: s.a.length <= 2 && x.shelf ? names(s.a, x.shelf).join(', ') : `${s.a.length} shelves` });
  if (s.x) parts.push({ sec: 'x', text: x.legacy ? x.legacy(s.x) : s.x });
  if (s.lo && !(x.defaultLo && psfUniq(s.lo).join() === [...x.defaultLo].sort((u, v) => u - v).join())) parts.push({ sec: 'lo', text: s.lo.length ? `leaves out ${s.lo.length === 1 && x.shelf ? x.shelf(s.lo[0]) : psfPlural(s.lo.length, 'area')}` : 'leaves nothing out' });
  return { base: s.base === 'all' ? 'Everything' : 'Scriptures and sources', parts };
}
if (typeof module !== 'undefined' && module.exports) module.exports = { PSF_NEST, PSF_KINDS, PSF_KIND_IDS, PSF_TITLE_KIND, psfTitleKinds, PSF_CAT_KIND, PSF_SHELF_KIND, PSF_SHELF_TRAD, PSF_SHELF_FAMILY, PSF_BELIEFS, PSF_PERIODS, PSF_PRESETS, PSF_SECTIONS, PSF_KEYS, psfWhen, psfYear, psfRangeLabel, psfOverlap, psfGenre, psfFacts, psfBlank, psfNorm, psfScoped, psfActive, psfPreset, psfPresetOf, psfEqual, psfPrep, psfIn, psfPool, psfCounts, psfRelax, psfHeld, psfTree, psfQuery, psfQueryString, psfParse, psfTouched, psfSave, psfLoad, psfFromOld, psfSummary };
