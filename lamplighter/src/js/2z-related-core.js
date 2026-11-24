/* ═══════════════════════════ 2z · Related: one strip of links across the kinds of page ═══════════════════════════
   STRUCTURE_AUDIT.md, section D (21 November 2026): the pages did not link to each other the same way (the reader linked to nothing, the tradition hub reached no event, conflict, movement or picture). This file is the
   pure half of the fix: relatedFor(kind, id, opts) returns the groups of links for one page, built from data the app already loads (no new data file); 6zzh-related.js draws them (relatedBox) and the page foot (pgFoot).
   The rules (the maker's: clean, connected, organized; neutral):
   · The groups are ten, with these labels, in this order, on every page: Traditions, Read, In its time, Conflicts and peace, On the map, Practices, Calendars, Movements, Pictures, Your highlights and notes. A group with
     nothing in it is left out; a page with no group has no strip. The same template for every tradition.
   · Inside a group: the page's own tradition first, then its parents, then its branches, then by name; texts: a copy that can be read here first, then books about it, then by date; events: nearest in time first.
     Never by size, prominence or popularity. Five items, then "N more" with the address of the page that lists them.
   · An item says only what its destination already says: its own status word (documented, reported, disputed) or "Read here", and its own date. Nothing here carries a contact between traditions or says that one religion
     influenced another: the hub's Relationships section stays where it is. A link is made only from a record that names both ends (a tradition an event names, a text a conflict carries, the tradition a Library book is tied to).
   · opts.skip: group keys the calling page already draws in its own sections (no repetition); opts.has: addresses the page already links (an item with one of them is left out).
   · Never throws: an unknown kind or id gives [].
   The data is read from what the page has loaded (ATLD for the Atlas files, LIB_BY_ID, TXT, CALENDARS, MOVEMENTS, PATH_STATIONS, STORIES, BEATLAB_FIGN, MARKS); a caller that has not loaded a file simply gets fewer groups
   (6zzh-related.js loads what is missing, once, and completes the strip when it arrives). Tests: tests/related.test.js. */
const REL_GROUPS = [['traditions', 'Traditions'], ['read', 'Read'], ['time', 'In its time'], ['conflicts', 'Conflicts and peace'], ['map', 'On the map'], ['practices', 'Practices'], ['calendars', 'Calendars'], ['movements', 'Movements'], ['pictures', 'Pictures'], ['notes', 'Your highlights and notes']];
const REL_KINDS = ['text', 'passage', 'tradition', 'event', 'conflict', 'movement', 'calendar', 'station', 'picture', 'story', 'motif', 'site', 'note'];
const REL_MAX = 5;                              /* items a group shows before “N more” */
const REL_OPEN = 5;                             /* groups drawn open; the rest sit under one closed “More related” */
const REL_COMPACT = { width: 560, items: 3, open: 3 };      /* FA-08: at 560 px or less (a phone) a group shows three items and three groups are open; what does not fit (the other items of those groups and the other groups) sits under the same closed “More related” */
const REL_RANGE = { from: -3500, to: 1900 };    /* the History window: an event outside it has no History address */
const REL_PAD = 10;                             /* years either side of a text's own window in which an event counts as “in its time” */
/* where “N more” goes when no page lists the group's items for this one page: the page of that kind of thing */
const REL_HOME = { traditions: '#/atlas/traditions', read: '#/path/library', time: '#/history', conflicts: '#/conflicts', map: '#/atlas', practices: '#/path/practices', calendars: '#/atlas/calendars', movements: '#/traditions/movements', pictures: '#/path/gallery', notes: '#/path/marks' };
const relOwn = (o, k) => !!o && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k);
const relStr = (s) => String(s == null ? '' : s);
const relNum = (v) => (v != null && v !== '' && Number.isFinite(+v) ? +v : null);
const relByName = (a, b) => relStr(a.label).localeCompare(relStr(b.label));
const relItem = (label, href, tag, sub) => ({ label: relStr(label), href: relStr(href), tag: relStr(tag), sub: relStr(sub) });

/* ── a date a person typed into the Library (“c. 593–571 BCE”, “c. 6th c. BCE”, “1908–21 CE”) read as a window of years, or null when no honest window exists:
   wider than 100 years, a date that is only when it was written down (“recorded 1901–02”, “fieldwork …”), a composite (“sources …; final form …”), one the entry itself says is debated or older, or none a program can read.
   BCE is negative and there is no year 0. A century is its hundred years (6th c. BCE = 600 to 501 BCE). ── */
function relWindow(when) {
  const s = relStr(when).replace(/\s+/g, ' ').trim(); if (!s || s.includes(':')) return null;      /* “1–39: 8th c.; 40–55: 6th c.”: a date for each part */
  const par = [...s.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]);      /* a bracket may carry a version's date (“trans. 1859”, “English 1651”), never a second date for the text or a doubt about this one */
  if (par.some((p) => /\b(?:debated|disputed|doubtful|uncertain|older|oral|composite|compiled|final|written|texts?)\b/i.test(p) || (/\d/.test(p) && !/\b(?:trans\w*|pub\w*|printed|edition|ed\.|English|Latin|first)\b/i.test(p)))) return null;
  const h = s.replace(/\([^)]*\)/g, ' ').split(';')[0].trim();      /* what stands before the first semicolon must be a date and nothing else: no “recorded”, “fieldwork”, “sources”, an author's name, “oral”, “manuscripts” */
  if (/[A-Za-z]/.test(h.replace(/\b(?:c|circa|about|BCE|CE|BC|AD|centur(?:y|ies))\b\.?|\d+(?:st|nd|rd|th)|\d+s\b/gi, ''))) return null;
  const bce = /\bBCE\b|\bBC\b/i.test(h); const ce = /\bCE\b|\bAD\b/i.test(h); if (bce && ce) return null;      /* from BCE to CE: a long span, or two things */
  let from = null; let to = null; let m;
  if ((m = /(\d{1,2})(?:st|nd|rd|th)\s*(?:[–-]\s*(\d{1,2})(?:st|nd|rd|th))?\s*c(?:entur(?:y|ies))?\b/i.exec(h))) {
    const a = +m[1]; const b = m[2] ? +m[2] : a; const cen = (n) => (bce ? [-(n * 100), -((n - 1) * 100 + 1)] : [(n - 1) * 100 + 1, n * 100]); const A = cen(a); const B = cen(b); from = Math.min(A[0], B[0]); to = Math.max(A[1], B[1]);
  } else if ((m = /(?:^|[^\d])(\d{1,4})(s?)\s*(?:BCE|CE)?\s*[–-]\s*(\d{1,4})(s?)\b/i.exec(h))) {
    const a = +m[1]; let b = +m[3]; if (!bce && b < a && m[3].length < m[1].length) b = +(m[1].slice(0, m[1].length - m[3].length) + m[3]);      /* 1908–21 is 1908 to 1921 */
    const lo = Math.min(a, b); const hi = Math.max(a, b) + (m[4] && !bce ? 9 : 0); from = bce ? -hi : lo; to = bce ? -lo : hi;
  } else if ((m = /(?:^|[^\d])(\d{1,4})(s?)\b/.exec(h))) { const y = +m[1]; from = bce ? -y : y; to = bce ? -y : y + (m[2] && !bce ? 9 : 0); }
  if (from == null || to == null || !Number.isFinite(from) || !Number.isFinite(to) || from === 0 || to === 0 || to - from > 100) return null;
  return { from, to, mid: Math.round((from + to) / 2), span: to - from, circa: /\b(?:c\.|circa|about)\s/i.test(s) };
}
const relInHistory = (w) => !!w && w.from >= REL_RANGE.from && w.to <= REL_RANGE.to;

/* ── the religions of a book, first the one it is shown under: the same rule as the Random card's chips (psgTies in 6d-passage.js, which calls this): what the Atlas ties it to (the religion of its shelf first, then the wider
   religions before their branches, then by name), else what its shelf holds, else the family of its shelf. Each as { sel, kind: 'atlas' | 'shelf' | 'family', root, rootName, id, name, href, rootHref, branch } ── */
function relTies(id, group) {
  const T = typeof PSF_TRADS !== 'undefined' ? PSF_TRADS : {}; const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const grp = group != null ? group : (typeof LIB_BY_ID !== 'undefined' && LIB_BY_ID && own(LIB_BY_ID, id) ? LIB_BY_ID[id].group : '');
  const rootOf = (t) => { let c = t; for (let n = 0; n < 60 && own(T, c) && T[c][2] && own(T, T[c][2]); n++) c = T[c][2]; return c; };
  const unit = (t, kind) => { const r = rootOf(t); return { kind, id: t, name: T[t][0], root: r, rootName: T[r][0], sel: 't:' + r, href: '#/atlas/tradition/' + t, rootHref: '#/atlas/tradition/' + r, branch: r !== t }; };
  const shelf = (typeof PSF_SHELF_TRAD !== 'undefined' && own(PSF_SHELF_TRAD, grp) ? PSF_SHELF_TRAD[grp] : []).filter((t) => own(T, t));
  const tied = String(typeof PSF_LINKS !== 'undefined' && own(PSF_LINKS, id) ? PSF_LINKS[id] : '').split(' ').filter((t) => t && own(T, t));
  if (tied.length) { tied.sort((a, b) => (shelf.includes(b) ? 1 : 0) - (shelf.includes(a) ? 1 : 0) || (T[a][2] ? 1 : 0) - (T[b][2] ? 1 : 0) || String(T[a][0]).localeCompare(String(T[b][0]))); return tied.map((t) => unit(t, 'atlas')); }
  if (shelf.length) return shelf.map((t) => unit(t, 'shelf'));
  const F = typeof PSF_FAMILIES !== 'undefined' ? PSF_FAMILIES : {}; const fam = (typeof PSF_SHELF_FAMILY !== 'undefined' && own(PSF_SHELF_FAMILY, grp) ? PSF_SHELF_FAMILY[grp] : []).filter((f) => own(F, f));
  return fam.map((f) => ({ kind: 'family', id: f, name: F[f], root: f, rootName: F[f], sel: 'f:' + f, href: '#/atlas/traditions?f=' + f, rootHref: '#/atlas/traditions?f=' + f, branch: false }));
}

/* ── what the page has loaded ── */
function relData(o) {
  const x = o && o.data && typeof o.data === 'object' ? o.data : {}; const A = typeof ATLD !== 'undefined' && ATLD ? ATLD : null; const g = (n) => (A && typeof A.get === 'function' ? A.get(n) || null : null);
  const ix = x.ix || (A && A.ix) || null; const world = x.world || g('world');
  return {
    ix, world: world && Array.isArray(world.events) ? world : null, core: (ix && ix.core) || null, sites: Array.isArray(x.sites) ? x.sites : (g('sites') || []), texts: Array.isArray(x.texts) ? x.texts : (g('texts') || []),
    lib: x.lib || (typeof LIB_BY_ID !== 'undefined' ? LIB_BY_ID : {}), has: x.has || ((id) => typeof TXT !== 'undefined' && TXT && typeof TXT.has === 'function' && !!TXT.has(id)),
    cals: x.cals || (typeof CALENDARS !== 'undefined' ? CALENDARS : []), movs: x.movs || (typeof MOVEMENTS !== 'undefined' ? MOVEMENTS : []), stations: x.stations || (typeof PATH_STATIONS !== 'undefined' ? PATH_STATIONS : []),
    stories: x.stories || (typeof STORY_BY_ID !== 'undefined' ? STORY_BY_ID : {}), figs: x.figs || (typeof BEATLAB_FIGN !== 'undefined' && BEATLAB_FIGN ? BEATLAB_FIGN : {}),
    marks: x.marks || (() => { try { return typeof MARKS !== 'undefined' && MARKS && typeof MARKS.all === 'function' ? MARKS.all() : {}; } catch (e) { return {}; } }),
  };
}
const relIsCnf = (e) => !!(e && e.conflict && (typeof CNF_KINDS !== 'undefined' ? CNF_KINDS : ['war', 'sect', 'peace']).includes(e.conflict.kind));      /* an entry of the Conflicts and peacemaking page */
const relIsWar = (e) => relIsCnf(e) || !!(e && e.strand === 'conflict');      /* …and a war of the timeline's own conflict strand that has no entry of its own: both are “Conflicts and peace” */
/* the inverse maps, built once for one copy of the world's events and kept: tradition to its events, tradition to its conflicts and wars, Library text to the events that carry it, id to event */
const REL_CACHE = typeof WeakMap === 'function' ? new WeakMap() : null;
function relInv(world) {
  const w = world && Array.isArray(world.events) ? world : null; const none = { ev: Object.create(null), cn: Object.create(null), tx: Object.create(null), by: Object.create(null) }; if (!w) return none;
  let c = REL_CACHE && REL_CACHE.get(w); if (c) return c; c = { ev: Object.create(null), cn: Object.create(null), tx: Object.create(null), by: Object.create(null) };
  for (const e of w.events) {
    if (!e || typeof e.id !== 'string') continue; c.by[e.id] = e; const m = relIsWar(e) ? c.cn : c.ev;
    for (const t of Array.isArray(e.traditions) ? e.traditions : []) (m[t] = m[t] || []).push(e);
    for (const t of Array.isArray(e.texts) ? e.texts : []) (c.tx[t] = c.tx[t] || []).push(e);
  }
  if (REL_CACHE) REL_CACHE.set(w, c); return c;
}

/* ── items ── */
const relShort = (s, n) => { s = relStr(s).split(';')[0].trim(); return s.length <= n ? s : s.slice(0, n).replace(/\s+\S*$/, '') + '…'; };
const relTrad = (D, id) => { const t = D.ix && relOwn(D.ix.trad, id) ? D.ix.trad[id] : null; return t ? relItem(t.name, '#/atlas/tradition/' + id, '', relShort(t.date_label, 48)) : null; };
/* how a tie was made, in plain words (L-02): a religion the map data ties the book to says nothing; one that only comes from the shelf the book stands on (a religion, or a family of them) says it is filed there, which is a method, not a claim about the book */
const relUnit = (u) => relItem(u.name, u.href, '', u.kind === 'family' || u.kind === 'shelf' ? 'filed with its texts' : u.branch ? 'a branch of ' + u.rootName : '');
const relYearOf = (e) => relNum(e && e.year_start);
const relEvRef = (D, e) => { const y = relYearOf(e); return y == null ? '' : '#/atlas?y=' + (typeof atlSnap === 'function' ? atlSnap(y) : y); };
/* an event on the History timeline, or a conflict entry on its own page: its own status word and its own date */
const relEvent = (e, entry) => relItem(e.label, entry && relIsCnf(e) ? '#/conflicts/' + encodeURIComponent(e.id) : (relYearOf(e) != null && e.year_start >= REL_RANGE.from && e.year_start <= REL_RANGE.to ? '#/history?s=' + encodeURIComponent(e.id) : (relIsCnf(e) ? '#/conflicts/' + encodeURIComponent(e.id) : '')), e.status, e.date_label);
const relNearest = (list, ref) => list.slice().sort((a, b) => Math.abs(a.year_start - ref) - Math.abs(b.year_start - ref) || a.year_start - b.year_start || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
const relCentre = (y) => '#/history?y=' + Math.round(Math.min(REL_RANGE.to, Math.max(REL_RANGE.from, y))) + '&z=8';
/* a Library book: a copy that can be read here, or where to look for it */
function relText(D, id) {
  const l = D.lib && relOwn(D.lib, id) ? D.lib[id] : null; if (!l) return null; const ok = !!D.has(id);
  return Object.assign(relItem(l.title, ok ? '#/path/read/' + id : '#/path/library?q=' + encodeURIComponent(l.title), ok ? 'Read here' : 'Where to read it', relShort(l.when, 48)), { _ok: ok, _id: id });
}
/* books in the order the page says: a copy to read first, then (as given) own texts, books about it, old sources; then by date, then by title */
function relTexts(D, groups) {
  const seen = new Set(); const out = [];
  groups.forEach((ids, rank) => (ids || []).forEach((id) => { if (seen.has(id)) return; seen.add(id); const it = relText(D, id); if (it) { const w = relWindow(D.lib[id].when); out.push(Object.assign(it, { _rank: rank, _y: w ? w.from : Infinity })); } }));
  return out.sort((a, b) => (a._ok ? 0 : 1) - (b._ok ? 0 : 1) || a._rank - b._rank || a._y - b._y || a.label.localeCompare(b.label));
}
const relMovReview = (m) => (typeof MOV_REVIEW !== 'undefined' && MOV_REVIEW && relOwn(MOV_REVIEW, m.review) ? MOV_REVIEW[m.review][0] : relStr(m.review));
const relUp = (ix, id) => { const out = []; let c = id; while (c && ix && relOwn(ix.trad, c) && out.length < 60) { out.push(c); c = ix.trad[c].parent_id; } return out; };
/* the books with plates, as { id, title, n }, and the ones tied to a tradition (by the Atlas, as a book's religion chips are) */
function relPlates(D) { return Object.keys(D.figs || {}).filter((b) => Array.isArray(D.figs[b]) && D.figs[b][0] > 0 && D.lib && relOwn(D.lib, b)).map((b) => ({ id: b, title: D.lib[b].title, n: D.figs[b][0] | 0 })); }
const relPlate = (b) => relItem(b.title, '#/path/gallery/' + encodeURIComponent(b.id), '', b.n + (b.n === 1 ? ' picture' : ' pictures'));
function relMarksOf(D, ids) {
  let all; try { all = D.marks(); } catch (e) { all = {}; } const out = [];
  [...new Set(ids)].forEach((id) => { const m = relOwn(all, id) ? all[id] : null; const hl = m && Array.isArray(m.hl) ? m.hl.length : 0; const bm = m && Array.isArray(m.bm) ? m.bm.length : 0; if (!hl && !bm) return; const l = D.lib && relOwn(D.lib, id) ? D.lib[id] : null; if (!l) return;
    out.push(relItem(l.title, '#/path/marks?k=' + (hl ? 'hl' : 'bm') + '&t=' + encodeURIComponent(id), '', [hl ? hl + (hl === 1 ? ' highlight' : ' highlights') : '', bm ? bm + (bm === 1 ? ' bookmark' : ' bookmarks') : ''].filter(Boolean).join(', '))); });
  return out.sort(relByName);
}
/* the traditions of several books at once: the Atlas's own ties first, then the religion of a shelf, then a family; a religion before its branches; then by name */
function relTiesOf(ids) {
  const seen = new Set(); const out = []; (ids || []).forEach((id) => relTies(id).forEach((u) => { const k = u.kind + ':' + u.id; if (!seen.has(k)) { seen.add(k); out.push(u); } }));
  const rank = { atlas: 0, shelf: 1, family: 2 }; return out.sort((a, b) => rank[a.kind] - rank[b.kind] || (a.branch ? 1 : 0) - (b.branch ? 1 : 0) || relStr(a.name).localeCompare(relStr(b.name)));
}
/* events in the window of a text's own date (and the ones that name it), nearest first */
function relInTime(D, w, ids) {
  const inv = relInv(D.world); const hit = new Map(); (ids || []).forEach((id) => (inv.tx[id] || []).forEach((e) => { if (!relIsWar(e)) hit.set(e.id, e); }));
  if (w && relInHistory(w)) for (const e of D.world ? D.world.events : []) { if (!e || relIsWar(e) || hit.has(e.id)) continue; const y = relYearOf(e); if (y == null) continue; const end = relNum(e.year_end) != null ? +e.year_end : y; if (y <= w.to + REL_PAD && end >= w.from - REL_PAD) hit.set(e.id, e); }
  return relNearest([...hit.values()], w ? w.mid : (hit.size ? [...hit.values()][0].year_start : 0));
}

/* ── the groups of each kind: { group key: { items, more (an address), note } }, every item from a record that names both ends ── */
/* a religion-strand event of the History timeline (the top line, "Islam emerges"; L-05 of FINAL_AUDIT.md). Its id, r-<kind>-<religion>-<year>, is made by histReligion from the map data and is not in world.js, so the page says which religion it concerns (opts.trad) and the year it is dated (opts.year).
   The same strip as a world event's, from the same records: the religion, the texts the records tie to it and the wars that name it, nearest the event first. Nothing is drawn for a religion the map data does not hold, for an id that is not one of these, or for a group with no items. */
function relReligionEvent(D, id, o) {
  const t = o && typeof o.trad === 'string' ? o.trad : ''; const ix = D.ix; if (!/^r-/.test(id) || !t || !ix || !relOwn(ix.trad, t)) return {};
  const y = o && relNum(o.year) != null ? +o.year : null; const out = { traditions: { items: [relTrad(D, t)] } };
  const tr = REL_BUILD.tradition(D, t); if (tr.read) out.read = tr.read;
  const cn = relInv(D.world).cn[t] || []; if (cn.length) out.conflicts = { items: relNearest(cn, y == null ? cn[0].year_start : y).map((e) => relEvent(e, true)), more: '#/conflicts?t=' + encodeURIComponent(t) };
  return out;
}
const REL_BUILD = {
  text(D, id) {
    const l = D.lib && relOwn(D.lib, id) ? D.lib[id] : null; if (!l) return {}; const out = {}; const w = relWindow(l.when); const inv = relInv(D.world);
    out.traditions = { items: relTies(id).map(relUnit) };
    const ev = relInTime(D, w, [id]); if (ev.length) out.time = { items: ev.map((e) => relEvent(e)), more: w && relInHistory(w) ? relCentre(w.mid) : '#/history', note: w && relInHistory(w) ? 'The text’s own date: ' + l.when : '' };
    const cn = (inv.tx[id] || []).filter(relIsWar); if (cn.length) out.conflicts = { items: relNearest(cn, w ? w.mid : cn[0].year_start).map((e) => relEvent(e, true)) };
    const rows = D.texts.filter((x) => x && (x.lib === id || (Array.isArray(x.libs) && x.libs.includes(id)))); if (rows.length) out.map = { items: rows.map((x) => relItem(x.title, '#/atlas?pin=tx:' + x.id, '', relShort(x.date_label, 48))), more: '#/atlas/texts' };
    const f = D.figs && relOwn(D.figs, id) && Array.isArray(D.figs[id]) && D.figs[id][0] > 0 ? D.figs[id][0] | 0 : 0; if (f) out.pictures = { items: [relPlate({ id, title: 'Pictures printed in this book', n: f })] };
    const mk = relMarksOf(D, [id]); if (mk.length) { mk[0].label = 'Your highlights and notes in this text'; out.notes = { items: mk }; }
    return out;
  },
  tradition(D, id) {
    const ix = D.ix; if (!ix || !relOwn(ix.trad, id)) return {}; const t = ix.trad[id]; const out = {}; const ref = relNum(t.start_year_latest) != null ? +t.start_year_latest : (relNum(t.start_year) != null ? +t.start_year : 1); const inv = relInv(D.world);
    const par = relUp(ix, id).slice(1).map((p) => Object.assign(relTrad(D, p), { sub: 'parent' })); const kids = (ix.kids[id] || []).map((k) => Object.assign(relTrad(D, k), { sub: 'branch' })).sort(relByName);
    out.traditions = { items: par.concat(kids), more: '#/traditions/tree?open=' + id };
    const core = D.core || {}; const own = D.texts.filter((x) => x && x.tradition_id === id).flatMap((x) => [x.lib].concat(Array.isArray(x.libs) ? x.libs : [])).filter(Boolean);
    const about = (relOwn(core.about, id) ? core.about[id] : []) || []; const lore = (relOwn(core.lore, id) ? core.lore[id] : []) || [];
    const rd = relTexts(D, [own, about, lore]); if (rd.length) out.read = { items: rd, more: '#/atlas/tradition/' + id };
    const ev = inv.ev[id] || []; if (ev.length) out.time = { items: relNearest(ev, ref).map((e) => relEvent(e)), more: '#/history?t=' + encodeURIComponent(id) + '&y=' + Math.round(Math.min(REL_RANGE.to, Math.max(REL_RANGE.from, ref))) };
    const cn = inv.cn[id] || []; if (cn.length) out.conflicts = { items: relNearest(cn, ref).map((e) => relEvent(e, true)), more: '#/conflicts?t=' + encodeURIComponent(id) };
    const st = D.sites.filter((s) => s && s.tradition_id === id); if (st.length) out.map = { items: st.map((s) => relItem(s.name, '#/atlas?pin=st:' + s.id, '', s.type)).sort(relByName), more: '#/atlas?y=' + (typeof atlSnap === 'function' ? atlSnap(ref) : ref) + '&sel=' + id };
    const pr = (ix.tpOf && relOwn(ix.tpOf, id) ? ix.tpOf[id] : []).map((p) => ix.practiceBy[p]).filter(Boolean); if (pr.length) out.practices = { items: pr.map((p) => relItem(p.name, '#/atlas?p=' + p.id + '&y=2026', '', p.category)).sort(relByName) };
    const chain = relUp(ix, id); const cs = D.cals.filter((c) => c && Array.isArray(c.used) && c.used.some((u) => chain.includes(u))); if (cs.length) out.calendars = { items: cs.map((c) => relItem(c.name, '#/atlas/calendars/' + c.id, '', relShort(relStr(c.role).split('. ')[0], 60))).sort(relByName) };
    const mv = D.movs.filter((m) => m && m.atlas === id); if (mv.length) out.movements = { items: mv.map((m) => relItem(m.name, '#/traditions/movements?s=' + m.id, relMovReview(m), relStr(typeof MOV_TERM !== 'undefined' && MOV_TERM ? MOV_TERM.title : 'High-control groups and contested movements'))).sort(relByName) };      /* the card's own review label, and the name of the page it is on */
    const mine = new Set([...own, ...about, ...lore]); const pl = relPlates(D).filter((b) => mine.has(b.id) || relTies(b.id).some((u) => u.id === id)); if (pl.length) out.pictures = { items: pl.sort((a, b) => a.title.localeCompare(b.title)).map(relPlate) };
    let marked = []; try { marked = Object.keys(D.marks()); } catch (e) { /* no stored marks */ }
    const mk = relMarksOf(D, marked.filter((b) => mine.has(b) || (D.lib && relOwn(D.lib, b) && relTies(b).some((u) => u.id === id)))); if (mk.length) out.notes = { items: mk };      /* only the books the reader has marked are asked about */
    return out;
  },
  event(D, id, o) {
    const e = relInv(D.world).by[id]; if (!e) return relReligionEvent(D, id, o); const out = {}; const ts = (e.traditions || []).map((t) => relTrad(D, t)).filter(Boolean).sort(relByName); if (ts.length) out.traditions = { items: ts };
    const rd = relTexts(D, [e.texts || []]); if (rd.length) out.read = { items: rd };
    if (relIsCnf(e)) out.conflicts = { items: [relEvent(e, true)] };
    const seen = new Set(); const pl = (e.places || []).filter((p) => p && p.name && !seen.has(p.name) && seen.add(p.name)); const ref = relEvRef(D, e); if (pl.length && ref) out.map = { items: pl.map((p) => relItem(p.name, ref, '', 'the map at that time')) };
    return out;
  },
  conflict(D, id) {
    const e = relInv(D.world).by[id]; if (!e || !relIsCnf(e)) return {}; const out = REL_BUILD.event(D, id); delete out.conflicts;
    out.time = { items: [e.year_start >= REL_RANGE.from && e.year_start <= REL_RANGE.to ? relItem('On the History timeline', '#/history?s=' + encodeURIComponent(e.id), e.status, e.date_label) : relItem('Not on the History timeline', '', '', 'its window ends in 1900')] };
    return out;
  },
  movement(D, id) {
    const m = D.movs.find((x) => x && x.id === id); if (!m) return {}; const out = {}; const ts = []; const a = relTrad(D, m.atlas); const n = relTrad(D, m.atlasNear);
    if (a) ts.push(a); if (n && m.atlasNear !== m.atlas) ts.push(Object.assign(n, { sub: 'the nearest religion on the map: the map data has no record of this group' })); if (ts.length) out.traditions = { items: ts };
    const rd = relTexts(D, [m.books || []]); if (rd.length) out.read = { items: rd };
    const cn = m.atlas ? relInv(D.world).cn[m.atlas] || [] : []; if (cn.length) out.conflicts = { items: relNearest(cn, cn[0].year_start).map((e) => relEvent(e, true)), more: '#/conflicts?t=' + encodeURIComponent(m.atlas) };
    return out;
  },
  calendar(D, id) {
    const c = D.cals.find((x) => x && x.id === id); if (!c || !D.ix) return {}; const out = {}; const used = (c.used || []).filter((u) => relOwn(D.ix.trad, u)); const seen = new Set(used);
    const kin = []; used.forEach((u) => (typeof atlDescendants === 'function' ? atlDescendants(D.ix, u) : []).forEach((k) => { if (!seen.has(k)) { seen.add(k); kin.push(k); } }));
    /* FA-07: the traditions that name the calendar are the list; the ones below them in the family tree are one line that counts them and links the tree (172 of them under the Hebrew calendar made a friend read “uses it”), and the events are listed for context only */
    const own = used.map((u) => Object.assign(relTrad(D, u), { sub: 'names it' })).sort(relByName); const rest = kin.filter((k) => relTrad(D, k));
    const tree = used.length ? '#/traditions/tree?open=' + used[0] : '';
    if (own.length) out.traditions = { items: own, more: tree, tail: rest.length && tree ? { text: 'and ' + rest.length + (rest.length === 1 ? ' tradition that is a branch of ' : ' traditions that are branches of ') + (used.length === 1 ? 'it' : 'these') + ':', link: 'see the list', href: tree } : null };
    const y = relNum(c.since); if (y != null && D.world) { const ev = relNearest(D.world.events.filter((e) => e && !relIsWar(e) && relYearOf(e) != null && e.year_start >= y), y); if (ev.length) out.time = { items: ev.map((e) => relEvent(e)), more: relCentre(y), note: 'Events dated after this calendar came into use, nearest first. Listed for context, not as connected.' }; }
    return out;
  },
  station(D, id) {
    const s = D.stations.find((x) => x && x.id === id); if (!s) return {}; const out = {}; const reads = (s.read || []).filter((r) => D.lib && relOwn(D.lib, r));
    const ts = relTiesOf(reads).map(relUnit); if (ts.length) out.traditions = { items: ts };
    const rd = relTexts(D, [reads]); if (rd.length) out.read = { items: rd };
    const y0 = relNum(s.y0); const y1 = relNum(s.y1); const w = y0 != null && y1 != null && y1 >= y0 ? (y1 - y0 <= 100 ? { from: y0, to: y1, mid: Math.round((y0 + y1) / 2), span: y1 - y0 } : null) : relWindow(s.when);      /* the station's own years where it has them; most stations span long ages and get no group */
    const ev = w ? relInTime(D, w, []) : []; if (ev.length) out.time = { items: ev.map((e) => relEvent(e)), more: relCentre(w.mid), note: 'The station’s own date: ' + relStr(s.when) };
    const mk = relMarksOf(D, reads); if (mk.length) out.notes = { items: mk };
    return out;
  },
  picture(D, id) {
    const l = D.lib && relOwn(D.lib, id) ? D.lib[id] : null; if (!l) return {}; const out = {}; const us = relTies(id); if (us.length) out.traditions = { items: us.map(relUnit) };
    const rd = relTexts(D, [[id]]); if (rd.length) out.read = { items: rd };
    const first = us.find((u) => u.kind !== 'family'); const same = first ? relPlates(D).filter((b) => b.id !== id && relTies(b.id).some((u) => u.id === first.id)) : [];
    if (same.length) out.pictures = { items: same.sort((a, b) => a.title.localeCompare(b.title)).map(relPlate) };
    return out;
  },
  story(D, id) {
    const s = D.stories && relOwn(D.stories, id) ? D.stories[id] : null; if (!s) return {}; const out = {}; const es = s.entries.map((a) => ({ book: a[10], place: a[3], name: a[1], y: a[6] })); const books = es.map((e) => e.book).filter((b) => b && D.lib && relOwn(D.lib, b));
    const ts = relTiesOf(books).map(relUnit); if (ts.length) out.traditions = { items: ts };
    const rd = relTexts(D, [books]); if (rd.length) out.read = { items: rd };
    const mp = es.filter((e) => relNum(e.y) != null).sort((a, b) => a.y - b.y).map((e) => relItem(e.place || e.name, '#/atlas?y=' + (typeof atlSnap === 'function' ? atlSnap(e.y) : e.y), '', e.name)); if (mp.length) out.map = { items: mp };
    return out;
  },
  motif(D, id) { return D.stories && relOwn(D.stories, id) ? REL_BUILD.story(D, id) : {}; },
  site(D, id) {
    const s = D.sites.find((x) => x && x.id === id); if (!s || !D.ix || !relOwn(D.ix.trad, s.tradition_id)) return {}; const out = {}; const t = relTrad(D, s.tradition_id); out.traditions = { items: [t] };
    const tr = REL_BUILD.tradition(D, s.tradition_id); if (tr.read) out.read = tr.read;
    const other = D.sites.filter((x) => x && x.tradition_id === s.tradition_id && x.id !== id).map((x) => relItem(x.name, '#/atlas?pin=st:' + x.id, '', x.type)).sort(relByName); if (other.length) out.map = { items: other, more: tr.map ? tr.map.more : '' };
    return out;
  },
  /* a notebook page: its id is the page's own; opts.texts says which Library books it clips from (the notebook keeps its pages in the browser's database, which a pure core cannot read) */
  note(D, id, o) {
    const ids = (o && Array.isArray(o.texts) ? o.texts : []).filter((b) => D.lib && relOwn(D.lib, b)); if (!ids.length) return {}; const out = {};
    const ts = relTiesOf(ids).map(relUnit); if (ts.length) out.traditions = { items: ts }; const rd = relTexts(D, [ids]); if (rd.length) out.read = { items: rd }; return out;
  },
};
REL_BUILD.passage = REL_BUILD.text;

/* a spec { items, more, note, tail } as a group: no repeated link (and none the page already draws: `has`, a Set of addresses), at most REL_MAX items, “N more” for the rest, a note under the heading, a `tail` line after the list
   ({ text, link, href }: the calendar's “and N traditions that are branches of these: see the list”). Returns null for nothing. */
function relGroup(key, label, spec, has) {
  if (!spec || !Array.isArray(spec.items)) return null; const seen = new Set(); const all = [];
  for (const it of spec.items) { if (!it || !it.label) continue; const k = it.href ? it.href : 'x:' + it.label; if (seen.has(k) || (has && it.href && has.has(it.href))) continue; seen.add(k); all.push({ label: it.label, href: it.href, tag: it.tag, sub: it.sub }); }
  if (!all.length) return null; const g = { key, label, items: all.slice(0, REL_MAX), more: all.length > REL_MAX ? { n: all.length - REL_MAX, href: spec.more || REL_HOME[key] } : null };
  if (spec.note) g.note = spec.note; if (spec.tail && spec.tail.text && spec.tail.href) g.tail = { text: relStr(spec.tail.text), link: relStr(spec.tail.link), href: relStr(spec.tail.href) }; return g;
}
/* the groups for one page, in the fixed order, empty ones left out. opts.skip: group keys the page already draws itself; opts.has: addresses the page already links (an item with one of them is left out, and a group left empty is not drawn). */
function relatedFor(kind, id, opts) {
  try {
    const o = opts && typeof opts === 'object' ? opts : {}; if (!REL_KINDS.includes(kind) || id == null || id === '') return [];
    const skip = new Set(Array.isArray(o.skip) ? o.skip : []); const has = new Set((Array.isArray(o.has) ? o.has : []).filter((h) => typeof h === 'string' && h)); const spec = REL_BUILD[kind](relData(o), relStr(id), o) || {};
    return REL_GROUPS.filter(([k]) => !skip.has(k) && spec[k]).map(([k, label]) => relGroup(k, label, spec[k], has)).filter(Boolean);
  } catch (e) { return []; }
}
if (typeof module !== 'undefined' && module.exports) module.exports = { REL_GROUPS, REL_KINDS, REL_MAX, REL_OPEN, REL_COMPACT, REL_RANGE, REL_HOME, REL_BUILD, relWindow, relInHistory, relTies, relData, relInv, relIsCnf, relIsWar, relGroup, relatedFor };
