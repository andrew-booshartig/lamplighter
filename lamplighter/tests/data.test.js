/* Your data (src/js/2z-data-core.js, the pure part; the page is src/js/6zzf-data.js): what this browser keeps, what each part is for, and one button for each part that removes exactly that part and nothing else.
   The deletion logic takes a storage object, so it is run here against a pretend one: the app's own store, IndexedDB (notebook pages, texts of your own, PDFs) and Cache Storage (offline copies). Every button is
   proved by comparing the whole storage before and after. Run: node tests/data.test.js */
const fs = require('fs'); const path = require('path');
const D = require('../src/js/2z-data-core.js'); const N = require('../src/js/2z-notebook-core.js');
let pass = 0; let fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra !== undefined ? JSON.stringify(extra).slice(0, 700) : ''); } };
const eq = (name, a, b) => ok(name, JSON.stringify(a) === JSON.stringify(b), { got: a, want: b });
const J = (x) => JSON.parse(JSON.stringify(x));

/* ── a pretend browser: the app's own store, three IndexedDB databases and Cache Storage ── */
function fake(seed) {
  const ls = new Map(Object.entries(seed.ls || {}).map(([k, v]) => [k, J(v)])); const dbs = {}; Object.entries(seed.idb || {}).forEach(([k, rows]) => { dbs[k] = new Map(rows.map((r) => [r.id, r])); });
  const caches = new Map(Object.entries(seed.caches || {}).map(([k, v]) => [k, J(v)])); const calls = [];
  const rowsOf = (db, s) => dbs[db + '/' + s] || (dbs[db + '/' + s] = new Map());
  return {
    ls: { keys: () => [...ls.keys()], get: (k, d) => (ls.has(k) ? J(ls.get(k)) : d), set: (k, v) => { ls.set(k, J(v)); calls.push('ls.set ' + k); }, del: (k) => { ls.delete(k); calls.push('ls.del ' + k); } },
    idb: { rows: async (db, s) => [...rowsOf(db, s).values()].map((r) => Object.assign({}, r)), del: async (db, s, keys) => { keys.forEach((k) => rowsOf(db, s).delete(k)); calls.push('idb.del ' + db + ' ' + keys.length); }, clear: async (db, s) => { rowsOf(db, s).clear(); calls.push('idb.clear ' + db); }, put: async (db, s, r) => { rowsOf(db, s).set(r.id, r); } },
    caches: { list: async () => [...caches.entries()].map(([name, c]) => ({ name, files: c.files, bytes: c.bytes })), delete: async (n) => { calls.push('caches.delete ' + n); return caches.delete(n); } },
    dump() { return { ls: Object.fromEntries([...ls.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))), idb: Object.fromEntries(Object.entries(dbs).map(([k, m]) => [k, Object.fromEntries([...m.entries()].map(([id, r]) => [id, Object.assign({}, r)]))])), caches: Object.fromEntries([...caches.entries()]) }; }, calls,
  };
}
/* what changed between two dumps: the keys of the app's store, the rows of each store, the caches */
function diff(a, b) {
  const ls = [...new Set([...Object.keys(a.ls), ...Object.keys(b.ls)])].filter((k) => JSON.stringify(a.ls[k]) !== JSON.stringify(b.ls[k])).sort();
  const idb = []; [...new Set([...Object.keys(a.idb), ...Object.keys(b.idb)])].forEach((s) => { const x = a.idb[s] || {}; const y = b.idb[s] || {}; [...new Set([...Object.keys(x), ...Object.keys(y)])].forEach((id) => { if (JSON.stringify(x[id]) !== JSON.stringify(y[id])) idb.push(s + ':' + id); }); }); idb.sort();
  const caches = [...new Set([...Object.keys(a.caches), ...Object.keys(b.caches)])].filter((k) => JSON.stringify(a.caches[k]) !== JSON.stringify(b.caches[k])).sort();
  return { ls, idb, caches };
}

/* ── a browser that has some of everything ── */
const MARKS = {
  'b-gen': { hl: [{ id: 'h1', s: 0, p: 1, a: 0, b: 5, q: 'words', n: 'a note' }, { id: 'h2', s: 0, p: 2, a: 0, b: 4, q: 'more' }], bm: [{ id: 'm1', s: 0, p: 1, q: 'x', n: '' }], rs: [0, 1, 2], n: 10, last: { s: 2, p: 0, t: 5, f: 0.2 }, v: 'a' },
  'b-mark': { hl: [], bm: [{ id: 'm2', s: 1, p: -1, q: '', n: 'n' }, { id: 'm3', s: 2, p: 0, q: 'y', n: '' }], rs: [], n: 16, last: null, v: 'a' },
  'u-own1': { hl: [{ id: 'h3', s: 0, p: 0, a: 0, b: 3, q: 'own', n: '' }], bm: [], rs: [0], n: 3, last: { s: 0, p: 0, t: 1, f: 0.1 }, v: '' },
  'x-only': { hl: [], bm: [], rs: [4], n: 8, last: null, v: '' },
};
const WORLD = () => ({
  ls: {
    'reader.marks': MARKS, 'reader.threads': [{ id: 't1', title: 'One', items: [{ id: 'i1' }, { id: 'i2' }] }, { id: 't2', title: 'Two', items: [] }], 'reader.lastThread': 't1',
    'lib.shelves': { set: { 'b-gen': { s: 'want', t: 1 } }, done: { 'b-mark': 5 }, lists: [{ id: 'l1', name: 'My list', ids: ['b-gen'] }] }, 'reader.days': { '2026-11-01': 5000, '2026-11-02': 800 },
    'passage.kept': [{ id: 'k1' }, { id: 'k2' }, { id: 'k3' }], 'passage.saved': { v: 1, last: '', items: [{ id: 's1', name: 'Psalms' }] },
    presets: [{ id: 'p1', name: 'Mine' }], experiments: [{ id: 'e1' }], abx: [{ t: 1 }, { t: 2 }], 'guess.series': [{ id: 'g1' }], journal: { '2026-11-01': 'note', '2026-11-02': 'again' }, phq2: [{ t: 1, a: 1, b: 2, score: 3 }],
    sessionlog: [{ t: 1, name: 'a' }, { t: 2, name: 'b' }], 'meditation.log': [{ id: 'x1' }], intentions: { goals: [{ id: 'g' }], rule: 'rise early' },
    'path.state': { started: 'x', cur: 3, days: { s1: [1, 2], s2: [1] }, notes: { 's1.d1': 'a note' }, read: { 'b-gen': true }, rule: 'a rule', prompts: true },
    'gather.services': [{ id: 'sv1' }], 'gather.circles': [{ id: 'c1' }, { id: 'c2' }], 'gather.board': { a: 1 }, 'gather.known': { k: 1 }, 'gather.me': { name: 'Me', pub: 'p', priv: 'q' },
    settings: { theme: 'light', reduceMotion: true, onboarded: true, hpChecked: true, volumeCap: 0.5 }, 'reading.prefs': { size: 20 }, 'reader.layout': { w: 1 }, 'reader.size': 18, 'speech.voice': { uri: 'x' }, studio: { cfg: {} }, 'ask.ai': 'gemini',
    'search.recent': ['flood'], 'lib.view': 'grid', 'common.words': { t: 1 }, 'tradlist.last': { q: '' }, 'passage.filters': { a: 1 }, 'lib.leftout': ['x'], 'some.future.key': { hello: 1 },
    'own.index': [{ id: 'u-own1', title: 'My prayers', by: 'me', chars: 52000, n: 3, t: 1 }, { id: 'u-own2', title: 'Family book', by: '', chars: 800, n: 1, t: 2 }],
    'notebook.books': [{ id: 'main', name: 'My notebook', c: 1 }, { id: 'kwork', name: 'Work', c: 2 }, { id: 'kstudy', name: 'Study', c: 3 }], 'notebook.settings': { cur: 'kwork', last: 'nw1', collect: { main: 'n2', kwork: 'nw2', kstudy: 'ns1' } },
  },
  idb: {
    'lamplighter-notebook/pages': [
      { id: 'inbox', title: 'Inbox', body: '> q\n>\n> — [Gen](#/path/read/b-gen?s=0&p=1)', c: 1, u: 2 }, { id: 'n1', title: 'Study notes', body: '#flood', c: 1, u: 2 }, { id: 'n2', title: 'Reading log', body: 'log', c: 1, u: 2, nb: 'main' },
      { id: 'inbox-kwork', title: 'Inbox', body: '> a\n>\n> — [Mark](#/path/read/b-mark?s=1&p=1)\n\n> b\n>\n> — [Mark](#/path/read/b-mark?s=1&p=2)', c: 1, u: 2, nb: 'kwork' }, { id: 'nw1', title: 'Work one', body: 'w', c: 1, u: 2, nb: 'kwork' }, { id: 'nw2', title: 'Work two', body: 'w2', c: 1, u: 2, nb: 'kwork' },
      { id: 'ns1', title: 'Study page', body: 's', c: 1, u: 2, nb: 'kstudy' },
    ],
    'beatlab-own/texts': [{ id: 'u-own1', title: 'My prayers', secs: [['A', 'words']] }, { id: 'u-own2', title: 'Family book', secs: [['A', 'more']] }],
    'lamplighter-pdfs/pdfs': [{ id: 'my-aaaa-one', title: 'First PDF', name: 'one.pdf', size: 3500000, blob: { size: 3500000 }, t: 1 }, { id: 'my-bbbb-two', title: 'Second PDF', name: 'two.pdf', size: 12000, t: 2 }],
  },
  caches: { 'beatlab-data-v1': { files: 3000, bytes: 1500000000 }, 'beatlab-data-runtime': { files: 40, bytes: 900000 }, 'beatlab-shell-abc': { files: 6, bytes: 4000000 }, 'someone-elses-cache': { files: 1, bytes: 5 } },
});
(async () => {
  const st0 = fake(WORLD()); const snap = await D.dataSnapshot(st0); const sum = D.dataSummary(snap); const rows = sum.groups.flatMap((g) => g.rows); const byId = Object.fromEntries(rows.map((r) => [r.id, r]));

  /* ── what is listed: every kind, with a plain count and what it is for ── */
  eq('the groups are Notebooks, Reading, Texts and files you added, Practice and Journey, Preferences and saved copies', sum.groups.map((g) => g.title), ['Notebooks', 'Reading', 'Texts and files you added', 'Practice and Journey', 'Preferences and saved copies']);
  eq('every part is listed, each notebook, each text of your own and each PDF on a row of its own', rows.map((r) => r.id), ['book:main', 'book:kwork', 'book:kstudy', 'bookmarks', 'highlights', 'progress', 'shelves', 'threads', 'kept', 'saved', 'own:u-own1', 'own:u-own2', 'pdf:my-aaaa-one', 'pdf:my-bbbb-two', 'presets', 'experiments', 'guesses', 'journal', 'sits', 'intentions', 'journey', 'gather', 'prefs', 'remembered', 'offline']);
  eq('counts are plain words: bookmarks', byId.bookmarks.text, '3 bookmarks in 2 texts');
  eq('highlights, with how many carry a note', byId.highlights.text, '3 highlights, 1 with a note in 2 texts');
  eq('progress', byId.progress.text, '5 sections marked read and your place in 2 texts');
  eq('shelves', byId.shelves.text, '1 list, 1 book on shelves, 1 book marked read and 2 reading days');
  eq('passage sets', byId.threads.text, '2 passage sets with 2 passages');
  eq('kept passages and saved filters', [byId.kept.text, byId.saved.text], ['3 kept passages', '1 saved filter']);
  eq('presets, experiments, guesses, journal, sessions, intentions', [byId.presets.text, byId.experiments.text, byId.guesses.text, byId.journal.text, byId.sits.text, byId.intentions.text], ['1 preset', '1 experiment and 2 comparison trials', '1 series of guesses', '2 journal entries and 1 mood check-in', '2 sound sessions and 1 meditation', '1 goal and a rule of life']);
  eq('the Journey and Worship together', [byId.journey.text, byId.gather.text], ['3 days marked, 1 note, 1 book ticked as read and a rule of life', '1 service, 2 circles, 1 board entry, 1 person known and your name and key']);
  eq('notebooks: pages and clips (an Inbox with nothing in it is not a page)', [byId['book:main'].text, byId['book:kwork'].text, byId['book:kstudy'].text], ['3 pages, 1 clip', '3 pages, 2 clips', '1 page']);
  eq('your own texts and PDFs, with sizes', [byId['own:u-own1'].text, byId['own:u-own2'].text, byId['pdf:my-aaaa-one'].text, byId['pdf:my-bbbb-two'].text], ['3 sections, 52,000 characters', '1 section, 800 characters', 'PDF, 3.5 MB', 'PDF, 12 KB']);
  eq('offline copies: only the saved libraries count (not the app’s own page, not another site’s cache), with their size', [byId.offline.text, byId.offline.size], ['3,040 saved files, 1.50 GB', 1500900000]);
  ok('preferences count what is set (the welcome and the headphone check are not preferences); the small things are the keys no part owns', byId.prefs.text === '9 choices saved' && byId.remembered.n === 7 && byId.remembered.text === '7 small things', [byId.prefs, byId.remembered]);
  ok('every part says what it is for, in a sentence', rows.filter((r) => !r.item).every((r) => typeof r.what === 'string' && r.what.length > 30) && Object.keys(D.DATA_WHAT).every((k) => D.DATA_WHAT[k].length > 30));
  ok('a part with nothing in it says None and is marked empty (the page leaves its button off)', (() => { const e = D.dataSummary({ ls: {}, notebook: [], own: [], pdfs: [], caches: [] }); const r = e.groups.flatMap((g) => g.rows); return r.filter((x) => !x.item && x.id !== 'book:main').every((x) => x.empty && x.text === 'None') && r.find((x) => x.id === 'book:main').empty === true && r.some((x) => x.id === 'none:texts'); })());
  ok('which parts can be undone: the small ones; not a notebook, a text, a PDF or the offline copies', rows.filter((r) => r.undo).map((r) => r.id).join() === 'bookmarks,highlights,progress,shelves,threads,kept,saved,presets,experiments,guesses,journal,sits,intentions,journey,gather,prefs,remembered' && rows.filter((r) => !r.undo).map((r) => r.id).join() === 'book:main,book:kwork,book:kstudy,own:u-own1,own:u-own2,pdf:my-aaaa-one,pdf:my-bbbb-two,offline');
  ok('by text: the marks are counted for each text, the most first', D.dataMarkStats(MARKS).per.map((p) => p.id + ':' + p.hl + ':' + p.bm).join() === 'b-gen:2:1,b-mark:0:2,u-own1:1:0');

  /* ── every button removes its own part and nothing else ── */
  const marksExp = ['reader.marks'];
  const PREF_KEYS = ['ask.ai', 'reader.layout', 'reader.size', 'reading.prefs', 'settings', 'speech.voice', 'studio'];
  const EXPECT = {
    bookmarks: { ls: marksExp, idb: [], caches: [] }, highlights: { ls: marksExp, idb: [], caches: [] }, progress: { ls: marksExp, idb: [], caches: [] },
    shelves: { ls: ['lib.shelves', 'reader.days'] }, threads: { ls: ['reader.lastThread', 'reader.threads'] }, kept: { ls: ['passage.kept'] }, saved: { ls: ['passage.saved'] }, presets: { ls: ['presets'] }, experiments: { ls: ['abx', 'experiments'] }, guesses: { ls: ['guess.series'] },
    journal: { ls: ['journal', 'phq2'] }, sits: { ls: ['meditation.log', 'sessionlog'] }, intentions: { ls: ['intentions'] }, journey: { ls: ['path.state'] }, gather: { ls: ['gather.board', 'gather.circles', 'gather.known', 'gather.me', 'gather.services'] },
    prefs: { ls: PREF_KEYS }, remembered: { ls: ['common.words', 'lib.leftout', 'lib.view', 'passage.filters', 'search.recent', 'some.future.key', 'tradlist.last'] },
    offline: { caches: ['beatlab-data-runtime', 'beatlab-data-v1'] },
    'book:kwork': { ls: ['notebook.books', 'notebook.settings'], idb: ['lamplighter-notebook/pages:inbox-kwork', 'lamplighter-notebook/pages:nw1', 'lamplighter-notebook/pages:nw2'] },
    'book:kstudy': { ls: ['notebook.books', 'notebook.settings'], idb: ['lamplighter-notebook/pages:ns1'] },
    'book:main': { ls: ['notebook.books', 'notebook.settings'], idb: ['lamplighter-notebook/pages:inbox', 'lamplighter-notebook/pages:n1', 'lamplighter-notebook/pages:n2'] },
    'own:u-own1': { ls: ['own.index', 'reader.marks'], idb: ['beatlab-own/texts:u-own1'] }, 'own:u-own2': { ls: ['own.index'], idb: ['beatlab-own/texts:u-own2'] },
    'pdf:my-aaaa-one': { idb: ['lamplighter-pdfs/pdfs:my-aaaa-one'] }, 'pdf:my-bbbb-two': { idb: ['lamplighter-pdfs/pdfs:my-bbbb-two'] },
  };
  for (const id of Object.keys(EXPECT)) {
    const st = fake(WORLD()); const before = st.dump(); const r = await D.dataDelete(id, st); const d = diff(before, st.dump()); const want = Object.assign({ ls: [], idb: [], caches: [] }, EXPECT[id]);
    ok('“' + id + '” removes its own part and nothing else: the same keys, rows and caches change that should, and no others', JSON.stringify(d) === JSON.stringify(want) && r.did === true, [d, want]);
  }
  /* the changes inside shared values are exactly the part’s */
  { const st = fake(WORLD()); await D.dataDelete('bookmarks', st); const m = st.dump().ls['reader.marks'];
    ok('bookmarks: every text keeps its highlights, reading progress and place; only the bookmarks are gone; a text left with nothing is dropped', m['b-gen'].bm.length === 0 && m['b-gen'].hl.length === 2 && m['b-gen'].rs.join() === '0,1,2' && m['b-gen'].last.s === 2 && m['b-gen'].n === 10 && !m['b-mark'] && m['u-own1'].hl.length === 1 && m['x-only'].rs.join() === '4', m);
    const st2 = fake(WORLD()); await D.dataDelete('highlights', st2); const m2 = st2.dump().ls['reader.marks']; ok('highlights: only the highlights and their notes are gone; bookmarks and progress stay', m2['b-gen'].hl.length === 0 && m2['b-gen'].bm.length === 1 && m2['b-gen'].rs.length === 3 && m2['b-mark'].bm.length === 2 && m2['u-own1'].rs.join() === '0' && m2['u-own1'].last && !('hl' in m2['u-own1'] && m2['u-own1'].hl.length), m2);
    const st3 = fake(WORLD()); await D.dataDelete('progress', st3); const m3 = st3.dump().ls['reader.marks']; ok('progress: the sections marked read and the places are gone; bookmarks and highlights stay; a text with only progress is dropped', m3['b-gen'].rs.length === 0 && m3['b-gen'].last === null && m3['b-gen'].hl.length === 2 && m3['b-gen'].bm.length === 1 && !m3['x-only'] && m3['b-mark'].bm.length === 2, m3);
    const st4 = fake({ ls: { 'reader.marks': { a: { hl: [], bm: [{ id: 'm', s: 0 }], rs: [], last: null } } } }); await D.dataDelete('bookmarks', st4); ok('when nothing is left in the marks the key goes too', !st4.dump().ls['reader.marks'] && Object.keys(st4.dump().ls).length === 0); }
  { const st = fake(WORLD()); await D.dataDelete('prefs', st); const l = st.dump().ls; ok('preferences go back to defaults, but that the welcome was shown and the headphone check was passed is kept; nothing else is touched', JSON.stringify(l.settings) === JSON.stringify({ onboarded: true, hpChecked: true }) && !('reading.prefs' in l) && !('ask.ai' in l) && l['reader.marks'] && l['lib.shelves'] && l['own.index'] && l['search.recent'], l.settings);
    const st2 = fake({ ls: { settings: { theme: 'dark' } } }); await D.dataDelete('prefs', st2); ok('with nothing to keep, the settings key itself goes', !('settings' in st2.dump().ls)); }
  { const st = fake(WORLD()); await D.dataDelete('book:kwork', st); const d = st.dump(); ok('a notebook is deleted with its Inbox and every page; the list of notebooks and the settings forget it, the open notebook moves on, the others keep their pages and their collecting pages', JSON.stringify(d.ls['notebook.books'].map((b) => b.id)) === '["main","kstudy"]' && d.ls['notebook.settings'].cur === 'main' && JSON.stringify(d.ls['notebook.settings'].collect) === '{"main":"n2","kstudy":"ns1"}' && !('last' in d.ls['notebook.settings']) && Object.keys(d.idb['lamplighter-notebook/pages']).sort().join() === 'inbox,n1,n2,ns1', [d.ls['notebook.books'], d.ls['notebook.settings'], Object.keys(d.idb['lamplighter-notebook/pages'])]);
    const st2 = fake(WORLD()); await D.dataDelete('book:main', st2); const d2 = st2.dump(); ok('the first notebook’s pages include those with no notebook written on them (every page made before there were several); deleting it takes them, and leaves the rest', Object.keys(d2.idb['lamplighter-notebook/pages']).sort().join() === 'inbox-kwork,ns1,nw1,nw2' && d2.ls['notebook.books'].map((b) => b.id).join() === 'kwork,kstudy' && d2.ls['notebook.settings'].collect.main === undefined, d2.ls['notebook.settings']);
    const one = fake({ ls: { 'notebook.settings': { collect: 'n2', last: 'n1' } }, idb: { 'lamplighter-notebook/pages': [{ id: 'inbox', title: 'Inbox', body: 'x', c: 1, u: 1 }, { id: 'n1', title: 'One', body: 'a', c: 1, u: 1 }, { id: 'n2', title: 'Two', body: 'b', c: 1, u: 1 }] } });
    const s1 = await D.dataSnapshot(one); const sm = D.dataSummary(s1); ok('with one notebook (rows from before there were several), it is My notebook with its pages, and its button deletes the pages', sm.groups[0].rows.length === 1 && sm.groups[0].rows[0].label === 'My notebook' && sm.groups[0].rows[0].only === true && sm.groups[0].rows[0].text === '3 pages' && /Delete every page/.test(D.dataConfirm('book:main', s1).title));
    await D.dataDelete('book:main', one); const dd = one.dump(); ok('the only notebook is emptied, not removed: its pages go, no list of notebooks is kept for it, and the settings that pointed at its pages go', Object.keys(dd.idb['lamplighter-notebook/pages']).length === 0 && !('notebook.books' in dd.ls) && !('notebook.settings' in dd.ls), dd.ls); }
  { const st = fake(WORLD()); await D.dataDelete('own:u-own1', st); const d = st.dump(); ok('a text of your own goes with its words, its entry in the list and the marks you made in it; the other text, its marks and everyone else’s marks stay', Object.keys(d.idb['beatlab-own/texts']).join() === 'u-own2' && d.ls['own.index'].map((e) => e.id).join() === 'u-own2' && !d.ls['reader.marks']['u-own1'] && d.ls['reader.marks']['b-gen'].hl.length === 2, d.ls['own.index']);
    await D.dataDelete('own:u-own2', st); ok('and with the last one gone the list goes too', !('own.index' in st.dump().ls)); }
  { const st = fake(WORLD()); await D.dataDelete('pdf:my-aaaa-one', st); ok('a PDF is one row: the other PDF, the texts and every key are untouched', Object.keys(st.dump().idb['lamplighter-pdfs/pdfs']).join() === 'my-bbbb-two' && JSON.stringify(st.dump().ls) === JSON.stringify(fake(WORLD()).dump().ls)); }
  { const st = fake(WORLD()); await D.dataDelete('offline', st); const d = st.dump(); ok('the offline copies are the caches that hold the saved libraries: the app’s own page and another site’s cache are left, and so is every key and row', Object.keys(d.caches).sort().join() === 'beatlab-shell-abc,someone-elses-cache' && JSON.stringify(d.ls) === JSON.stringify(fake(WORLD()).dump().ls)); }
  ok('a part that is not there changes nothing', await (async () => { const st = fake(WORLD()); const b = st.dump(); const r1 = await D.dataDelete('book:nope', st); const r2 = await D.dataDelete('own:nope', st); const r3 = await D.dataDelete('pdf:nope', st); const r4 = await D.dataDelete('nonsense', st); return JSON.stringify(b) === JSON.stringify(st.dump()) && [r1, r2, r3, r4].every((r) => r.did === false) && st.calls.length === 0; })());
  ok('a part that is empty changes nothing (no write, no delete)', await (async () => { const st = fake({ ls: { 'search.recent': ['x'] } }); const r = await D.dataDelete('bookmarks', st); const r2 = await D.dataDelete('presets', st); return JSON.stringify(st.dump().ls) === JSON.stringify({ 'search.recent': ['x'] }) && !st.calls.some((c) => /idb|caches/.test(c)) && r.did === true && r2.did === true; })());
  /* the parts together are everything */
  { const st = fake(WORLD()); for (const id of Object.keys(EXPECT)) await D.dataDelete(id, st); const d = st.dump(); eq('after every part is removed, only the welcome and headphone flags and the app’s own page and another site’s cache are left: the parts add up to everything', [Object.keys(d.ls), d.ls.settings, Object.keys(d.idb).map((k) => Object.keys(d.idb[k]).length).join(), Object.keys(d.caches).sort()], [['settings'], { onboarded: true, hpChecked: true }, '0,0,0', ['beatlab-shell-abc', 'someone-elses-cache']]); }
  { const st = fake(WORLD()); const r = await D.dataDelete('everything', st); const d = st.dump(); eq('delete everything: no key of the app’s store, no row in any of the three databases (notebook pages, texts of your own, PDFs), and the offline copies; the app’s own page and another site’s cache are left', [Object.keys(d.ls), Object.values(d.idb).map((m) => Object.keys(m).length), Object.keys(d.caches).sort(), r.plan.undo], [[], [0, 0, 0], ['beatlab-shell-abc', 'someone-elses-cache'], false]);
    ok('and it clears all three stores by name, so a database that has nothing in it is not made', st.calls.filter((c) => c.startsWith('idb.clear')).sort().join() === 'idb.clear beatlab-own,idb.clear lamplighter-notebook,idb.clear lamplighter-pdfs'); }
  /* a key nobody knows is removed by the small things and by everything, and by nothing else */
  { const st = fake({ ls: { 'brand.new.key': 1, 'reader.marks': MARKS } }); const sn = await D.dataSnapshot(st); ok('a key no part owns is a small thing, so Delete everything is total even for what the app starts keeping later', D.dataCounts(sn).k.remembered.n === 1 && D.dataPlan('everything', sn).ls['brand.new.key'] === undefined && D.dataPlan('bookmarks', sn).ls['brand.new.key'] === undefined && 'brand.new.key' in D.dataPlan('remembered', sn).ls); }
  ok('no key is owned by two parts', (() => { const all = [].concat(...Object.values(D.DATA_KEYS)).concat([D.DATA_MARKS_KEY, D.DATA_OWN_KEY, D.DATA_BOOKS_KEY, D.DATA_BOOKSET_KEY]); return new Set(all).size === all.length; })());
  ok('every key the app’s code uses is either owned by a part or a small thing (nothing is invisible): the keys read from the source are all known', (() => { const dir = path.join(__dirname, '../src/js'); const keys = new Set(); fs.readdirSync(dir).filter((f) => f.endsWith('.js')).forEach((f) => { const t = fs.readFileSync(path.join(dir, f), 'utf8'); for (const m of t.matchAll(/store\.(?:get|set|del)\(\s*'([A-Za-z0-9_.]+)'/g)) keys.add(m[1]); }); const own = D.dataOwned(); const mine = [...keys].filter((k) => own.has(k)); return keys.size > 40 && mine.length > 25 && [...own].every((k) => keys.has(k) || ['reading.prefs', 'reader.layout', 'speech.voice', 'lib.shelves', 'reader.days', 'reader.marks', 'reader.threads', 'own.index', 'passage.saved'].includes(k)); })());

  /* ── undo, for the small things ── */
  for (const id of ['bookmarks', 'highlights', 'progress', 'shelves', 'threads', 'kept', 'saved', 'presets', 'experiments', 'guesses', 'journal', 'sits', 'intentions', 'journey', 'gather', 'prefs', 'remembered']) {
    const st = fake(WORLD()); const before = st.dump(); const r = await D.dataDelete(id, st); await D.dataUndo(r.restore, st); ok('“' + id + '” is put back exactly as it was by its undo (the whole storage is the same again)', JSON.stringify(st.dump()) === JSON.stringify(before) && r.plan.undo === true);
  }
  ok('the other parts say they cannot be undone, and keep nothing to restore', await (async () => { for (const id of ['book:kwork', 'own:u-own1', 'pdf:my-aaaa-one', 'offline', 'everything']) { const p = D.dataPlan(id, snap); if (p.undo !== false) return false; } return true; })());
  ok('an undo window of about eight seconds', D.DATA_UNDO_MS === 8000);

  /* ── what each confirmation says ── */
  const C = (id) => D.dataConfirm(id, snap); const text = (c) => [c.title, c.intro].concat(c.lines, c.notes).join(' | ');
  ok('each confirmation names exactly what goes (its count) and says whether it can be undone: a small part “can undo it for about eight seconds … after that it cannot be undone”, a large one “cannot be undone”', rows.filter((r) => !r.empty).every((r) => { const c = C(r.id); const t = text(c); return c.title.endsWith('?') && c.yes && c.danger === true && (r.undo ? /undo it for about eight seconds afterwards; after that it cannot be undone/.test(t) : /cannot be undone/.test(t)); }), rows.filter((r) => !r.empty && !/cannot be undone/.test(text(C(r.id)))).map((r) => r.id));
  ok('the counts are in the sentence', /3 bookmarks in 2 texts/.test(text(C('bookmarks'))) && /3 highlights, 1 with a note in 2 texts/.test(text(C('highlights'))) && /2 passage sets with 2 passages/.test(text(C('threads'))) && /3,040 saved files, 1\.50 GB/.test(text(C('offline'))) && /3 pages and 2 clips/.test(text(C('book:kwork'))) && /“My prayers”/.test(text(C('own:u-own1'))) && /3\.5 MB/.test(text(C('pdf:my-aaaa-one'))));
  ok('a notebook’s says its Inbox goes with it and that the others are not touched; a text of your own says its marks go too and that links to it will no longer open it; a PDF says Export all does not hold it', /Inbox goes with it/.test(text(C('book:kwork'))) && /Your other notebooks are not touched/.test(text(C('book:kwork'))) && /highlights, notes, bookmarks and reading progress you made in it/.test(text(C('own:u-own1'))) && /links will no longer open it/.test(text(C('own:u-own1'))) && /Export all does not hold PDFs/.test(text(C('pdf:my-aaaa-one'))));
  ok('the offline copies’ says the app itself still opens, nothing on disk is deleted, and where to save them again', /app itself still opens/.test(text(C('offline'))) && /Nothing is deleted from your computer’s disk/.test(text(C('offline'))) && /Take it with you/.test(text(C('offline'))));
  { const e = C('everything'); const t = text(e); ok('delete everything lists every category that holds something, with its count: bookmarks, highlights, notebooks, your texts, your PDFs, presets, the offline copies, preferences…', ['Bookmarks: 3 bookmarks in 2 texts', 'Highlights and notes: 3 highlights', 'Notebook “My notebook”: 3 pages, 1 clip', 'Notebook “Work”: 3 pages, 2 clips', 'Notebook “Study”: 1 page', 'Your text “My prayers”', 'Your text “Family book”', 'Your PDF “First PDF”: 3.5 MB', 'Your PDF “Second PDF”: 12 KB', 'Presets: 1 preset', 'Offline copies of the Library: 3,040 saved files, 1.50 GB', 'Preferences: 9 choices saved', 'Remembered choices: 7 small things', 'Worship together'].every((x) => t.includes(x)), t);
    ok('and says the PDFs and the offline copies go too, that Export all leaves PDFs out for size, that nothing on disk is deleted, and that it cannot be undone', /PDFs and the offline copies of the Library go too/.test(t) && /Export all leaves PDFs out because they can be large/.test(t) && /Nothing is deleted from your computer’s disk/.test(t) && /This cannot be undone/.test(t) && e.title === 'Delete everything?' && e.yes === 'Delete everything');
    const none = D.dataConfirm('everything', { ls: {}, notebook: [], own: [], pdfs: [], caches: [] }); ok('with nothing stored it says so', none.empty === true && /nothing stored/.test(none.intro)); }

  /* ── Export all and Import ── */
  { const bk = D.dataBackupMake({ name: 'The Lamplighter Project', version: 'v', exportedAt: 't' }, st0.dump().ls, [{ id: 'u1' }], [{ id: 'n1', nb: 'main' }, { id: 'nw1', nb: 'kwork' }]);
    ok('Export all holds the app’s own store (with the list of notebooks), the texts you added and every page of every notebook, each saying which; PDFs are not in it', Object.keys(bk).sort().join() === 'app,data,exportedAt,notebook,own,version' && bk.data['notebook.books'].length === 3 && bk.notebook.some((p) => p.nb === 'kwork') && !JSON.stringify(bk).includes('blob'));
    ok('empty parts are left out of it, and a backup is read back into its parts', Object.keys(D.dataBackupMake({ name: 'x', version: 'v', exportedAt: 't' }, {}, [], [])).sort().join() === 'app,data,exportedAt,version' && JSON.stringify(D.dataBackupRead(bk).notebook.length) === '2' && D.dataBackupRead(bk).hasBooks === true && D.dataBackupRead({ data: { a: 1 } }).hasBooks === false && D.dataBackupRead(null).data && Object.keys(D.dataBackupRead(null).data).length === 0 && D.dataBackupRead({ data: [] }).own.length === 0); }
  /* ── the source ── */
  { const core = fs.readFileSync(path.join(__dirname, '../src/js/2z-data-core.js'), 'utf8'); const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
    ok('the core makes no request, uses no browser storage and draws nothing: it is handed its storage', !/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB|(?<!st\.)caches\.(open|keys|delete)|document\.|window\.|navigator\.|innerHTML|eval|Function\()/.test(strip(core)), strip(core).match(/\b(fetch|localStorage|indexedDB|document\.|window\.|navigator\.|innerHTML)/));
    ok('every top-level name in it begins data or DATA_ (the whole app shares one scope)', [...core.matchAll(/^(?:const|let|var|function|async function|class) ([A-Za-z_$][\w$]*)/gm)].every((m) => /^(data|DATA_)/.test(m[1])), [...core.matchAll(/^(?:const|let|var|function|async function|class) ([A-Za-z_$][\w$]*)/gm)].filter((m) => !/^(data|DATA_)/.test(m[1])).map((m) => m[1]));
    ok('the CommonJS line is one line that begins the way the build expects, so it is dropped from the browser bundle, and what it exports exists', /\nif \(typeof module !== 'undefined' && module\.exports\) module\.exports = \{[^\n]*\};?\s*$/.test(core) && core.match(/module\.exports = \{([^}]*)\}/)[1].split(',').map((x) => x.trim()).filter(Boolean).every((n) => typeof D[n] !== 'undefined'));
    ok('no raw invisible or line-separator character hides in the file', ![0x2028, 0x2029, 0x200b, 0x200e, 0x200f, 0xfeff, 0xa0, 0x300].some((c) => core.includes(String.fromCharCode(c)))); }
})().then(() => { console.log(`data: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0); }).catch((e) => { console.log('FAIL the data tests stopped:', e && e.stack ? e.stack : e); process.exit(1); });
