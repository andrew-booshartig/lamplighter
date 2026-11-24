/* ═══════════════════════════ 2z · Your data: what this browser keeps, what each part is for, and how to remove one part and nothing else ═══════════════════════════
   Pure functions (tests/data.test.js); the page that draws them is 6zzf-data.js (Setup → Your data, #/setup/data). Nothing here touches a browser: every function that reads or removes something is handed a STORAGE object,
   and the tests hand it a pretend one (the app's own store, IndexedDB and Cache Storage). The storage object has the shape
       st.ls     { keys(), get(key, fallback), set(key, value), del(key) }       the app's own store (localStorage under the app's prefix), keys without the prefix
       st.idb    { rows(db, store), del(db, store, keys), clear(db, store), put(db, store, row) }        IndexedDB: all the rows of a store, delete some, empty it, put a row back
       st.caches { list(), delete(name) }                                       Cache Storage: [{ name, files, bytes }] and delete one
   A removal is made in three steps so it can be shown before it is done: dataSnapshot (read what is there), dataPlan (what a button would change: which keys get which new value, which rows and which caches go), dataApply (do it; it
   hands back what is needed to put it back, for the small things that can be undone). Each plan touches only the keys, rows and caches of its own part, and the tests prove it by comparing the whole storage before and after.
   The parts are the ones in DATA_GROUPS. Whatever the app keeps that is in none of them (a recent search, a filter, the place a list was left at) is "remembered choices", so Delete everything is total and honest.
   Names here begin data or DATA_ because every file of the app shares one scope. The notebook's own functions (nb…, 2z-notebook-core.js) are used for notebooks; under Node they are loaded from the file beside this one. */
if (typeof module !== 'undefined' && module.exports && typeof nbClean === 'undefined') Object.assign(globalThis, require('./2z-notebook-core.js'));
const DATA_DBS = { notebook: { db: 'lamplighter-notebook', store: 'pages' }, own: { db: 'beatlab-own', store: 'texts' }, pdfs: { db: 'lamplighter-pdfs', store: 'pdfs' } };
const DATA_CACHE_PREFIX = 'beatlab-data-';      /* the libraries saved for offline use; the app's own page (beatlab-shell-…) is the app, not a copy of the Library, and is not one of them */
const DATA_UNDO_MS = 8000;
const dataObj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
const dataArr = (x) => (Array.isArray(x) ? x : []);
const dataInt = (x) => { const n = Math.round(+x); return Number.isFinite(n) && n > 0 ? n : 0; };
const dataNum = (n) => String(dataInt(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const dataPlural = (n, one, many) => dataNum(n) + ' ' + (dataInt(n) === 1 ? one : many || one + 's');
/* a size in plain words */
function dataBytes(n) { n = Math.max(0, +n || 0); if (n < 1000) return n + ' bytes'; if (n < 1e6) return Math.max(1, Math.round(n / 1e3)) + ' KB'; if (n < 1e9) return (n < 1e7 ? (n / 1e6).toFixed(1) : String(Math.round(n / 1e6))) + ' MB'; return (n / 1e9).toFixed(2) + ' GB'; }
/* "a, b and c" from a list of phrases (empty ones left out) */
const dataAnd = (list) => { const l = list.filter(Boolean); return l.length < 2 ? l.join('') : l.slice(0, -1).join(', ') + ' and ' + l[l.length - 1]; };

/* ── the parts, and the keys of the app’s own store each one owns ── */
const DATA_KEYS = {
  threads: ['reader.threads', 'reader.lastThread'], shelves: ['lib.shelves', 'reader.days'], kept: ['passage.kept'], saved: ['passage.saved'],
  presets: ['presets'], experiments: ['experiments', 'abx'], guesses: ['guess.series'], journal: ['journal', 'phq2'], sits: ['sessionlog', 'meditation.log'], intentions: ['intentions'], journey: ['path.state'],
  gather: ['gather.services', 'gather.circles', 'gather.board', 'gather.known', 'gather.me'],
  prefs: ['settings', 'reading.prefs', 'reader.layout', 'reader.size', 'reader.sheet', 'reader.stop', 'reader.eng', 'reader.hlc', 'reader.cpm', 'reader.listen', 'speech.voice', 'meditation.prefs', 'studio', 'ask.ai', 'bibles.prefs'],
};
const DATA_MARKS_KEY = 'reader.marks'; const DATA_OWN_KEY = 'own.index'; const DATA_BOOKS_KEY = 'notebook.books'; const DATA_BOOKSET_KEY = 'notebook.settings';
const DATA_PREF_DEFAULTS = { theme: 'auto', reduceMotion: false, volumeCap: 0.9, noiseShift: -5, showLab: false };      /* what Setup’s preferences are before anyone changes them (50-core.js holds the same; tests/data.test.js compares them) */
const DATA_PREFS_KEEP = ['onboarded', 'hpChecked'];      /* in "settings" but not preferences: that the welcome was shown, and that the headphone check passed */
/* every key some part owns, and so the keys that are left (remembered choices) */
const dataOwned = () => new Set([].concat(...Object.values(DATA_KEYS), [DATA_MARKS_KEY, DATA_OWN_KEY, DATA_BOOKS_KEY, DATA_BOOKSET_KEY]));
const dataRemembered = (keys) => { const own = dataOwned(); return keys.filter((k) => !own.has(k)).sort(); };

/* ── reading marks: bookmarks, highlights and progress share one value, a record for each text ── */
function dataMarkStats(raw) {
  const m = dataObj(raw); const s = { hl: 0, notes: 0, bm: 0, rs: 0, places: 0, hlTexts: 0, bmTexts: 0, rsTexts: 0, per: [] };
  Object.keys(m).forEach((id) => {
    const r = dataObj(m[id]); const h = dataArr(r.hl); const b = dataArr(r.bm); const p = dataArr(r.rs); const n = h.filter((x) => x && typeof x.n === 'string' && x.n.trim()).length;
    s.hl += h.length; s.notes += n; s.bm += b.length; s.rs += p.length; if (r.last && typeof r.last === 'object') s.places++;
    if (h.length) s.hlTexts++; if (b.length) s.bmTexts++; if (p.length || (r.last && typeof r.last === 'object')) s.rsTexts++;
    if (h.length || b.length) s.per.push({ id, hl: h.length, bm: b.length, notes: n });
  });
  s.per.sort((a, b) => (b.hl + b.bm) - (a.hl + a.bm) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)); return s;
}
/* the marks with some of each text's lists emptied; a text left with nothing is dropped, one that still has something is otherwise as it was */
function dataMarksWithout(raw, fields) {
  const m = dataObj(raw); const out = {};
  Object.keys(m).forEach((id) => {
    const r = Object.assign({}, dataObj(m[id])); fields.forEach((f) => { r[f] = f === 'last' ? null : []; });
    if (dataArr(r.hl).length || dataArr(r.bm).length || dataArr(r.rs).length || r.last) out[id] = r;
  });
  return out;
}
const dataMarksOmit = (raw, id) => { const m = Object.assign({}, dataObj(raw)); delete m[id]; return m; };

/* ── notebooks, from the rows of the notebook’s store and the list kept in the app’s own store ── */
const dataRowBook = (r) => (nbIsInbox(r.id) ? nbInboxBook(r.id) : nbBookIdOk(r.nb) ? r.nb : NB_MAIN);
const dataClips = (body) => (String(body || '').match(/\]\(#\/path\/read\//g) || []).length;
function dataNotebooks(snap) {
  const rows = dataArr(snap.notebook).filter((r) => r && nbIdOk(r.id)).map((r) => ({ id: r.id, nb: dataRowBook(r), title: String(r.title || ''), len: String(r.body || '').length, clips: dataClips(r.body) }));
  const books = nbBooksResolve(snap.ls[DATA_BOOKS_KEY], rows.map((r) => ({ nb: r.nb })), 0).books;
  return books.map((b) => { const mine = rows.filter((r) => r.nb === b.id); return { id: b.id, name: b.name, ids: mine.map((r) => r.id), pages: mine.filter((r) => !nbIsInbox(r.id) || r.len > 0).length, clips: mine.reduce((n, r) => n + r.clips, 0), chars: mine.reduce((n, r) => n + r.len, 0) }; });
}
/* the list of notebooks and the settings with one notebook taken out (the only one is kept, empty) */
function dataBooksWithout(snap, id) {
  const all = dataNotebooks(snap); const left = all.filter((b) => b.id !== id).map((b) => ({ id: b.id, name: b.name, c: 0 })); const keepList = left.length ? left : all.map((b) => ({ id: b.id, name: b.name, c: 0 }));
  const raw = dataArr(snap.ls[DATA_BOOKS_KEY]).filter((b) => b && nbBookIdOk(b.id)); const withC = keepList.map((b) => { const o = raw.find((x) => x.id === b.id); return Object.assign({ id: b.id, name: b.name }, o && Number.isFinite(+o.c) ? { c: +o.c } : {}); });
  const plain = withC.length === 1 && withC[0].id === NB_MAIN && withC[0].name === NB_MAIN_NAME;
  const st = dataObj(snap.ls[DATA_BOOKSET_KEY]); let ns = nbCollectPut(st, id, ''); if (left.length) { if (ns.cur === id) ns.cur = left[0].id; } else delete ns.cur; if (typeof ns.last === 'string') { const gone = all.find((b) => b.id === id); if (gone && gone.ids.includes(ns.last)) delete ns.last; }
  return { books: plain ? undefined : withC, settings: Object.keys(ns).length ? ns : undefined };
}

/* ── the offline copies ── */
const dataCopies = (snap) => dataArr(snap.caches).filter((c) => c && typeof c.name === 'string' && c.name.startsWith(DATA_CACHE_PREFIX));

/* ── reading what is kept ── */
async function dataSnapshot(st) {
  const ls = {}; for (const k of st.ls.keys()) ls[k] = st.ls.get(k, null);
  const rows = async (k) => { try { return dataArr(await st.idb.rows(DATA_DBS[k].db, DATA_DBS[k].store)); } catch (e) { return []; } };
  const notebook = (await rows('notebook')).map((r) => ({ id: r && r.id, nb: r && r.nb, title: r && r.title, body: r && r.body }));
  const own = (await rows('own')).filter((r) => r && typeof r.id === 'string').map((r) => ({ id: r.id }));
  const pdfs = (await rows('pdfs')).filter((r) => r && typeof r.id === 'string').map((r) => ({ id: r.id, title: String(r.title || r.name || r.id), name: String(r.name || ''), by: String(r.by || ''), size: Math.max(0, +r.size || (r.blob && +r.blob.size) || 0) }));
  let caches = []; try { caches = dataArr(await st.caches.list()).map((c) => ({ name: String(c.name), files: dataInt(c.files), bytes: c.bytes == null ? null : Math.max(0, +c.bytes || 0) })); } catch (e) { caches = []; }
  return { ls, notebook, own, pdfs, caches };
}

/* ── what there is: groups of rows, each with a plain count (dataSummary), and for each row the plan its button makes (dataPlan) ── */
const DATA_GROUPS = [
  { id: 'notebooks', title: 'Notebooks' },
  { id: 'reading', title: 'Reading' },
  { id: 'texts', title: 'Texts and files you added' },
  { id: 'practice', title: 'Practice and Journey' },
  { id: 'settings', title: 'Preferences and saved copies' },
];
const DATA_WHAT = {
  bookmarks: 'Places you marked in a text, so you can come back to them. Made with the bookmark button in the reader.',
  highlights: 'Words you coloured in a text, and the notes you wrote on them.',
  progress: 'Which sections you marked as read, and where you left off in each text.',
  shelves: 'The shelves you put books on, your own lists, and the counts of what you read each day that Library → My shelves shows.',
  threads: 'The sets of passages you laid side by side, with how they relate (Notebook → Passage sets).',
  kept: 'Passages you kept from Random, so you can come back to them.',
  saved: 'The Random filters and mixes you saved and named, and the daily draw.',
  presets: 'Sound presets you made yourself (the built-in ones are part of the app).',
  experiments: 'Blinded tone trials and the answers you gave in Practice → Experiments.',
  guesses: 'Your guesses about which tone was which, kept so a series can be looked at later.',
  journal: 'Daily check-ins and mood questions you wrote in Practice → Journal.',
  sits: 'The sound sessions you played and the meditations you sat.',
  intentions: 'Your goals and your rule of life (Practice → Ways to worship → Intentions).',
  journey: 'The days of the Journey you marked, the notes you wrote under each station, the books you ticked there as read, and your rule of life there.',
  gather: 'What you set up under Worship together: services you wrote, circles, the board, the people you know there, and your name with the signing key made for shared packs.',
  prefs: 'Theme, reduced motion, the lab tools switch, the volume ceiling and noise shift, your reading settings (type size, theme, layout, voice for reading aloud) and other choices about how the app looks and sounds.',
  remembered: 'Small things the app keeps so it can open where you left it: recent searches, filter choices, how lists were arranged, counts it worked out.',
  offline: 'The libraries you saved in this browser so the app opens with no connection (Setup → Take it with you). The app’s own folders on this computer are not these copies.',
};
/* the count of each part, as a number (for "is there anything") and as plain words */
function dataCounts(snap) {
  const ls = snap.ls; const k = {}; const ms = dataMarkStats(ls[DATA_MARKS_KEY]);
  k.bookmarks = { n: ms.bm, text: ms.bm ? dataPlural(ms.bm, 'bookmark') + ' in ' + dataPlural(ms.bmTexts, 'text') : '' };
  k.highlights = { n: ms.hl, text: ms.hl ? dataPlural(ms.hl, 'highlight') + (ms.notes ? ', ' + dataPlural(ms.notes, 'with a note', 'with notes') : '') + ' in ' + dataPlural(ms.hlTexts, 'text') : '' };
  k.progress = { n: ms.rs + ms.places, text: ms.rs + ms.places ? dataAnd([ms.rs ? dataPlural(ms.rs, 'section') + ' marked read' : '', ms.places ? 'your place in ' + dataPlural(ms.places, 'text') : '']) : '' };
  const sh = dataObj(ls['lib.shelves']); const days = Object.keys(dataObj(ls['reader.days'])).length; const lists = dataArr(sh.lists).length; const onShelves = Object.keys(dataObj(sh.set)).length; const done = Object.keys(dataObj(sh.done)).length;
  k.shelves = { n: lists + onShelves + done + days, text: lists + onShelves + done + days ? dataAnd([lists ? dataPlural(lists, 'list') : '', onShelves ? dataPlural(onShelves, 'book') + ' on shelves' : '', done ? dataPlural(done, 'book') + ' marked read' : '', days ? dataPlural(days, 'reading day') : '']) : '' };
  const th = dataArr(ls['reader.threads']); const thp = th.reduce((n, t) => n + dataArr(dataObj(t).items).length, 0); k.threads = { n: th.length, text: th.length ? dataPlural(th.length, 'passage set') + ' with ' + dataPlural(thp, 'passage') : '' };
  const kp = dataArr(ls['passage.kept']); k.kept = { n: kp.length, text: kp.length ? dataPlural(kp.length, 'kept passage') : '' };
  const sv = dataArr(dataObj(ls['passage.saved']).items); k.saved = { n: sv.length, text: sv.length ? dataPlural(sv.length, 'saved filter') : '' };
  const pr = dataArr(ls.presets); k.presets = { n: pr.length, text: pr.length ? dataPlural(pr.length, 'preset') : '' };
  const ex = dataArr(ls.experiments); const ab = dataArr(ls.abx); k.experiments = { n: ex.length + ab.length, text: ex.length + ab.length ? dataAnd([ex.length ? dataPlural(ex.length, 'experiment') : '', ab.length ? dataPlural(ab.length, 'comparison trial') : '']) : '' };
  const gs = dataArr(ls['guess.series']); k.guesses = { n: gs.length, text: gs.length ? dataPlural(gs.length, 'series of guesses', 'series of guesses') : '' };
  const jn = Object.keys(dataObj(ls.journal)).length; const ph = dataArr(ls.phq2).length; k.journal = { n: jn + ph, text: jn + ph ? dataAnd([jn ? dataPlural(jn, 'journal entry', 'journal entries') : '', ph ? dataPlural(ph, 'mood check-in') : '']) : '' };
  const sl = dataArr(ls.sessionlog).length; const ml = dataArr(ls['meditation.log']).length; k.sits = { n: sl + ml, text: sl + ml ? dataAnd([sl ? dataPlural(sl, 'sound session') : '', ml ? dataPlural(ml, 'meditation') : '']) : '' };
  const it = dataObj(ls.intentions); const goals = dataArr(it.goals).length; const rule = it.rule ? 1 : 0; k.intentions = { n: goals + rule, text: goals + rule ? dataAnd([goals ? dataPlural(goals, 'goal') : '', rule ? 'a rule of life' : '']) : '' };
  const ps = dataObj(ls['path.state']); const pdays = Object.values(dataObj(ps.days)).reduce((n, a) => n + dataArr(a).length, 0); const pnotes = Object.keys(dataObj(ps.notes)).length; const pread = Object.keys(dataObj(ps.read)).length; const prule = typeof ps.rule === 'string' && ps.rule.trim() ? 1 : 0;
  k.journey = { n: pdays + pnotes + pread + prule + (typeof ps.started === 'string' ? 1 : 0), text: pdays + pnotes + pread + prule + (typeof ps.started === 'string' ? 1 : 0) ? dataAnd([pdays ? dataPlural(pdays, 'day') + ' marked' : '', pnotes ? dataPlural(pnotes, 'note') : '', pread ? dataPlural(pread, 'book') + ' ticked as read' : '', prule ? 'a rule of life' : '', !pdays && !pnotes && !pread && !prule ? 'the Journey begun' : '']) : '' };
  const gsv = dataArr(ls['gather.services']).length; const gci = dataArr(ls['gather.circles']).length; const gbd = Object.keys(dataObj(ls['gather.board'])).length; const gkn = Object.keys(dataObj(ls['gather.known'])).length; const me = dataObj(ls['gather.me']); const key = me.pub || me.priv || me.name ? 1 : 0;
  k.gather = { n: gsv + gci + gbd + gkn + key, text: gsv + gci + gbd + gkn + key ? dataAnd([gsv ? dataPlural(gsv, 'service') : '', gci ? dataPlural(gci, 'circle') : '', gbd ? dataPlural(gbd, 'board entry', 'board entries') : '', gkn ? dataPlural(gkn, 'person') + ' known' : '', key ? 'your name and key' : '']) : '' };
  const st = dataObj(ls.settings); const setN = Object.keys(st).filter((x) => !DATA_PREFS_KEEP.includes(x)).length; const others = DATA_KEYS.prefs.filter((x) => x !== 'settings' && ls[x] != null).length;
  k.prefs = { n: setN + others, text: setN + others ? dataPlural(setN + others, 'choice') + ' saved' : '' };
  const rem = dataRemembered(Object.keys(ls)); k.remembered = { n: rem.length, text: rem.length ? dataPlural(rem.length, 'small thing') : '' };
  const cp = dataCopies(snap); const files = cp.reduce((n, c) => n + c.files, 0); const known = cp.filter((c) => c.bytes != null); const bytes = known.reduce((n, c) => n + c.bytes, 0);
  k.offline = { n: cp.length ? Math.max(1, files) : 0, text: cp.length ? dataPlural(files, 'saved file') + (known.length ? ', ' + dataBytes(bytes) : '') : '', bytes: known.length ? bytes : null };
  return { k, marks: ms };
}
/* the rows to draw. kind: what the button is called; item rows (a notebook, a text of your own, a PDF) each have a button; a row with nothing in it says so and has no button */
function dataSummary(snap) {
  const c = dataCounts(snap); const g = (id) => ({ id, title: DATA_GROUPS.find((x) => x.id === id).title, rows: [] }); const G = Object.fromEntries(DATA_GROUPS.map((x) => [x.id, g(x.id)]));
  const part = (grp, id, label, o) => { const x = c.k[id]; G[grp].rows.push(Object.assign({ id, label, what: DATA_WHAT[id], n: x.n, text: x.text || 'None', undo: true, empty: !x.n }, o || {})); };
  const nbs = dataNotebooks(snap);
  nbs.forEach((b) => G.notebooks.rows.push({ id: 'book:' + b.id, label: b.name, what: '', n: b.pages, text: b.pages ? dataPlural(b.pages, 'page') + (b.clips ? ', ' + dataPlural(b.clips, 'clip') : '') : 'No pages', undo: false, empty: nbs.length === 1 && !b.pages && !b.ids.length, item: 'notebook', bookId: b.id, only: nbs.length === 1 }));
  part('reading', 'bookmarks', 'Bookmarks'); part('reading', 'highlights', 'Highlights and notes'); part('reading', 'progress', 'Reading progress'); part('reading', 'shelves', 'My shelves and lists'); part('reading', 'threads', 'Passage sets'); part('reading', 'kept', 'Kept passages (Random)'); part('reading', 'saved', 'Saved Random filters and mixes');
  const own = dataArr(snap.ls[DATA_OWN_KEY]).filter((e) => e && typeof e.id === 'string');
  own.forEach((e) => G.texts.rows.push({ id: 'own:' + e.id, label: String(e.title || e.id), what: '', n: 1, text: (dataInt(e.n) ? dataPlural(e.n, 'section') + ', ' : '') + dataPlural(dataInt(e.chars), 'character'), undo: false, empty: false, item: 'own', textId: e.id }));
  snap.pdfs.forEach((p) => G.texts.rows.push({ id: 'pdf:' + p.id, label: p.title, what: '', n: 1, text: 'PDF, ' + dataBytes(p.size), size: p.size, undo: false, empty: false, item: 'pdf', pdfId: p.id }));
  if (!own.length && !snap.pdfs.length) G.texts.rows.push({ id: 'none:texts', label: 'No texts or PDFs of your own', what: '', n: 0, text: '', undo: false, empty: true, item: 'none' });
  part('practice', 'presets', 'Presets'); part('practice', 'experiments', 'Experiments'); part('practice', 'guesses', 'Guesses'); part('practice', 'journal', 'Journal entries'); part('practice', 'sits', 'Sessions and meditations'); part('practice', 'intentions', 'Intentions'); part('practice', 'journey', 'Journey progress and notes'); part('practice', 'gather', 'Worship together');
  part('settings', 'prefs', 'Preferences', { reset: true }); part('settings', 'remembered', 'Remembered choices'); part('settings', 'offline', 'Offline copies of the Library', { undo: false, size: c.k.offline.bytes });
  return { groups: DATA_GROUPS.map((x) => G[x.id]), counts: c };
}

/* one line for the top of Setup: what is kept, in a few plain counts */
function dataHeadline(snap) {
  const c = dataCounts(snap); const nbs = dataNotebooks(snap); const pages = nbs.reduce((n, b) => n + b.pages, 0); const own = dataArr(snap.ls[DATA_OWN_KEY]).length; const pdfs = dataArr(snap.pdfs).length; const off = c.k.offline;
  const bits = [pages ? dataPlural(nbs.length, 'notebook') + ' with ' + dataPlural(pages, 'page') : '', c.k.highlights.n ? dataPlural(c.k.highlights.n, 'highlight') : '', c.k.bookmarks.n ? dataPlural(c.k.bookmarks.n, 'bookmark') : '', own ? dataPlural(own, 'text') + ' of your own' : '', pdfs ? dataPlural(pdfs, 'PDF') : '', off.n ? 'the Library saved for offline use' + (off.bytes != null ? ' (' + dataBytes(off.bytes) + ')' : '') : ''].filter(Boolean);
  return bits.length ? 'Kept here: ' + dataAnd(bits) + '.' : 'Nothing is kept here yet.';
}
/* ── what a button does: the new value of each key of the app’s own store (undefined: the key goes), the rows of IndexedDB that go, the caches that go. Only its own part’s. ── */
function dataKeysPlan(keys) { const ls = {}; keys.forEach((k) => { ls[k] = undefined; }); return ls; }
function dataPlan(id, snap) {
  const ls = snap.ls; const P = (o) => Object.assign({ id, ls: {}, idb: [], caches: [], undo: true }, o);
  if (id === 'bookmarks') { const m = dataMarksWithout(ls[DATA_MARKS_KEY], ['bm']); return P({ ls: { [DATA_MARKS_KEY]: Object.keys(m).length ? m : undefined } }); }
  if (id === 'highlights') { const m = dataMarksWithout(ls[DATA_MARKS_KEY], ['hl']); return P({ ls: { [DATA_MARKS_KEY]: Object.keys(m).length ? m : undefined } }); }
  if (id === 'progress') { const m = dataMarksWithout(ls[DATA_MARKS_KEY], ['rs', 'last']); return P({ ls: { [DATA_MARKS_KEY]: Object.keys(m).length ? m : undefined } }); }
  if (DATA_KEYS[id] && id !== 'prefs') return P({ ls: dataKeysPlan(DATA_KEYS[id]) });
  if (id === 'prefs') {
    const keep = {}; const s = dataObj(ls.settings); DATA_PREFS_KEEP.forEach((x) => { if (s[x] !== undefined) keep[x] = s[x]; });
    const p = dataKeysPlan(DATA_KEYS.prefs); p.settings = Object.keys(keep).length ? keep : undefined; return P({ ls: p });
  }
  if (id === 'remembered') return P({ ls: dataKeysPlan(dataRemembered(Object.keys(ls))) });
  if (id === 'offline') return P({ undo: false, caches: dataCopies(snap).map((c) => c.name) });
  if (id.startsWith('book:')) {
    const bid = id.slice(5); const b = dataNotebooks(snap).find((x) => x.id === bid); if (!b) return P({ undo: false, none: true });
    const after = dataBooksWithout(snap, bid); return P({ undo: false, ls: { [DATA_BOOKS_KEY]: after.books, [DATA_BOOKSET_KEY]: after.settings }, idb: b.ids.length ? [{ db: DATA_DBS.notebook.db, store: DATA_DBS.notebook.store, del: b.ids }] : [] });
  }
  if (id.startsWith('own:')) {
    const tid = id.slice(4); const list = dataArr(ls[DATA_OWN_KEY]); if (!list.some((e) => e && e.id === tid)) return P({ undo: false, none: true });
    const left = list.filter((e) => !(e && e.id === tid)); const marks = dataMarksOmit(ls[DATA_MARKS_KEY], tid);
    return P({ undo: false, ls: { [DATA_OWN_KEY]: left.length ? left : undefined, [DATA_MARKS_KEY]: Object.keys(marks).length ? marks : undefined }, idb: [{ db: DATA_DBS.own.db, store: DATA_DBS.own.store, del: [tid] }] });
  }
  if (id.startsWith('pdf:')) { const pid = id.slice(4); if (!snap.pdfs.some((p) => p.id === pid)) return P({ undo: false, none: true }); return P({ undo: false, idb: [{ db: DATA_DBS.pdfs.db, store: DATA_DBS.pdfs.store, del: [pid] }] }); }
  if (id === 'everything') return P({ undo: false, ls: dataKeysPlan(Object.keys(ls)), idb: Object.values(DATA_DBS).map((d) => ({ db: d.db, store: d.store, clear: true })), caches: dataCopies(snap).map((c) => c.name) });
  return P({ undo: false, none: true });
}
/* do a plan. Returns what is needed to put the keys of the app’s own store back (a plan that can be undone only changes those) */
async function dataApply(plan, st) {
  const restore = { ls: {} };
  if (plan.none) return { restore, did: false };
  for (const k of Object.keys(plan.ls)) { restore.ls[k] = st.ls.get(k, undefined); if (plan.ls[k] === undefined) st.ls.del(k); else st.ls.set(k, plan.ls[k]); }
  for (const o of plan.idb) { if (o.clear) await st.idb.clear(o.db, o.store); else if (o.del && o.del.length) await st.idb.del(o.db, o.store, o.del); }
  for (const n of plan.caches) await st.caches.delete(n);
  return { restore, did: true };
}
async function dataUndo(restore, st) { for (const k of Object.keys((restore && restore.ls) || {})) { if (restore.ls[k] === undefined) st.ls.del(k); else st.ls.set(k, restore.ls[k]); } }
/* read, plan, do: a button */
async function dataDelete(id, st) { const snap = await dataSnapshot(st); const plan = dataPlan(id, snap); const r = await dataApply(plan, st); return Object.assign({ plan }, r); }

const DATA_TITLES = { threads: ['Remove all your passage sets?', 'Remove passage sets'], shelves: ['Remove your shelves and lists?', 'Remove shelves and lists'], kept: ['Remove your kept passages?', 'Remove kept passages'], saved: ['Remove your saved Random filters and mixes?', 'Remove saved filters'], presets: ['Remove your presets?', 'Remove presets'], experiments: ['Remove your experiments?', 'Remove experiments'], guesses: ['Remove your guesses?', 'Remove guesses'], journal: ['Remove your journal entries?', 'Remove journal entries'], sits: ['Remove your session and meditation history?', 'Remove the history'], intentions: ['Remove your intentions?', 'Remove intentions'], journey: ['Reset your Journey progress and notes?', 'Reset the Journey'], gather: ['Remove what you set up under Worship together?', 'Remove it'] };
/* ── what each confirmation says: lines of plain words (the page puts them in a dialog, escaped) that name exactly what goes and whether it can be undone ── */
function dataConfirm(id, snap) {
  const sum = dataSummary(snap); const rows = sum.groups.flatMap((g) => g.rows); const row = rows.find((r) => r.id === id); const plan = dataPlan(id, snap); const c = sum.counts.k;
  const tail = plan.undo ? 'You can undo it for about eight seconds afterwards; after that it cannot be undone. Export all (below) saves a copy first.' : 'This cannot be undone. Export all (below) saves a copy first.';
  const disk = 'Nothing is deleted from your computer’s disk: the app’s own folders and any file you added from your computer stay where they are.';
  if (id === 'everything') {
    const lines = []; sum.groups.forEach((g) => g.rows.forEach((r) => { if (r.n && !r.item) lines.push(r.label + ': ' + r.text); else if (r.n && r.item === 'notebook') lines.push('Notebook “' + r.label + '”: ' + r.text); else if (r.item === 'own') lines.push('Your text “' + r.label + '”: ' + r.text); else if (r.item === 'pdf') lines.push('Your PDF “' + r.label + '”: ' + r.text.replace(/^PDF, /, '')); }));
    return { title: 'Delete everything?', intro: lines.length ? 'This removes all of this from this browser:' : 'There is nothing stored here to delete.', lines, notes: ['Your PDFs and the offline copies of the Library go too. Export all leaves PDFs out because they can be large, so save the ones you want first (each has a Save a copy button above).', disk, 'This cannot be undone.'], yes: 'Delete everything', danger: true, empty: !lines.length };
  }
  if (id === 'bookmarks') return { title: 'Remove all your bookmarks?', intro: 'This removes ' + (c.bookmarks.text || 'no bookmarks') + ' from this browser.', lines: [], notes: ['Your highlights, notes and reading progress are not touched.', tail], yes: 'Remove bookmarks', danger: true };
  if (id === 'highlights') return { title: 'Remove all your highlights and notes?', intro: 'This removes ' + (c.highlights.text || 'no highlights') + ' from this browser.', lines: [], notes: ['Your bookmarks and reading progress are not touched.', tail], yes: 'Remove highlights and notes', danger: true };
  if (id === 'progress') return { title: 'Reset your reading progress?', intro: 'This removes ' + (c.progress.text || 'no progress') + ' from this browser, so every text looks unread and opens at its beginning.', lines: [], notes: ['Your bookmarks, highlights and notes are not touched.', tail], yes: 'Reset progress', danger: true };
  if (id === 'prefs') return { title: 'Reset your preferences to their defaults?', intro: 'This puts ' + (c.prefs.text || 'no choices') + ' back as they were when you first opened the app: theme, reading settings, volume ceiling and the rest.', lines: [], notes: ['Nothing you wrote or saved is touched.', tail], yes: 'Reset to defaults', danger: true };
  if (id === 'remembered') return { title: 'Forget the small things the app remembers?', intro: 'This removes ' + (c.remembered.text || 'nothing') + ': recent searches, filter choices, list arrangements and counts it worked out.', lines: [], notes: ['Nothing you wrote or saved is touched.', tail], yes: 'Forget them', danger: true };
  if (id === 'offline') return { title: 'Remove the offline copies of the Library?', intro: 'This removes ' + (c.offline.text || 'no saved files') + ' from this browser: the libraries you saved so the app opens with no connection.', lines: [], notes: ['Your own data is not touched, and the app itself still opens. You can save the libraries again from Setup → Take it with you.', disk, 'This cannot be undone.'], yes: 'Remove the copies', danger: true };
  if (id.startsWith('book:')) { const b = dataNotebooks(snap).find((x) => 'book:' + x.id === id); const only = dataNotebooks(snap).length === 1; return { title: (only ? 'Delete every page of “' : 'Delete the notebook “') + (b ? b.name : '') + '”?', intro: b ? (only ? 'This deletes ' : 'The notebook and ') + (b.pages ? dataPlural(b.pages, 'page') + (b.clips ? ' and ' + dataPlural(b.clips, 'clip') : '') : 'nothing in it') + ' from this browser.' : 'That notebook is not here.', lines: [], notes: ['Its Inbox goes with it. Your other notebooks are not touched.', 'Export it first (the Export button on its row) if you want a copy that this app can read back.', 'This cannot be undone.'], yes: only ? 'Delete the pages' : 'Delete notebook', danger: true }; }
  if (id.startsWith('own:')) { const r = row; return { title: 'Remove this text?', intro: '“' + (r ? r.label : '') + '” will be removed from this browser, with the highlights, notes, bookmarks and reading progress you made in it.', lines: [], notes: ['Passages from it that you put in the notebook, a passage set or a shelf stay there, but their links will no longer open it.', disk, 'This cannot be undone. Export all (below) saves a copy first: it includes your own texts.'], yes: 'Remove the text', danger: true }; }
  if (id.startsWith('pdf:')) { const r = row; return { title: 'Remove this PDF?', intro: '“' + (r ? r.label : '') + '” (' + (r ? r.text.replace(/^PDF, /, '') : '') + ') will be removed from this browser.', lines: [], notes: ['The file you added it from is not touched, and nothing is deleted from your computer’s disk. Export all does not hold PDFs, so use Save a copy on its row first if you want one.', 'This cannot be undone.'], yes: 'Remove the PDF', danger: true }; }
  if (row) {
    const t = DATA_TITLES[id] || ['Remove this?', 'Remove']; const extra = id === 'gather' ? ['It includes your name and the signing key made for shared packs.'] : id === 'shelves' ? ['Your highlights, bookmarks and reading progress are not touched.'] : ['Nothing else is touched.'];
    return { title: t[0], intro: 'This removes ' + (row.text || 'nothing') + ' from this browser.', lines: [], notes: extra.concat([tail]), yes: t[1], danger: true };
  }
  return { title: 'Remove this?', intro: '', lines: [], notes: [], yes: 'Remove', danger: true };
}

/* ── Export all and Import: one file that holds the app’s own store, the texts you added and every page of every notebook; PDFs are not in it (they can be large; each can be saved from its row) ── */
function dataBackupMake(info, all, own, notebook) {
  const d = { app: info.name, version: info.version, exportedAt: info.exportedAt, data: all }; if (dataArr(own).length) d.own = own; if (dataArr(notebook).length) d.notebook = notebook; return d;
}
/* the parts of a backup (the page has already made the app's own test, backupOk: it names the app and holds data): the keys of the app's own store, the texts you added, the pages of the notebooks, and whether it lists notebooks (one made before there were several does not) */
function dataBackupRead(d) {
  const o = dataObj(d); const data = dataObj(o.data); return { data, own: dataArr(o.own), notebook: dataArr(o.notebook), hasBooks: Object.prototype.hasOwnProperty.call(data, DATA_BOOKS_KEY) };
}
if (typeof module !== 'undefined' && module.exports) module.exports = { DATA_DBS, DATA_CACHE_PREFIX, DATA_UNDO_MS, DATA_KEYS, DATA_GROUPS, DATA_WHAT, DATA_MARKS_KEY, DATA_OWN_KEY, DATA_BOOKS_KEY, DATA_BOOKSET_KEY, DATA_PREFS_KEEP, DATA_PREF_DEFAULTS, dataHeadline, dataBytes, dataPlural, dataAnd, dataOwned, dataRemembered, dataMarkStats, dataMarksWithout, dataNotebooks, dataCopies, dataSnapshot, dataCounts, dataSummary, dataPlan, dataApply, dataUndo, dataDelete, dataConfirm, dataBackupMake, dataBackupRead };
