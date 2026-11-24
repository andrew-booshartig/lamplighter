// Run: node tests/leaveout.test.js — leaving whole Library collections out of random passages, search and the Library's list (src/js/2z-leaveout-core.js, with its control in 6g-library.js)
const fs = require('fs'); const path = require('path');
const C = require('../src/js/2z-leaveout-core.js');
const { M, render, badText } = require('./_harness');
let pass = 0, fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, x); } };

/* ── the pure rules, on a small made-up library */
const colls = [['Bible', '', ['hb', 'nt']], ['Occult', '', ['he', 'oc']], ['Folk tales', '', ['ta', 'tf']], ['The imagined shelf', '', ['im']], ['Study aids', '', ['mo', 'sc']]];
const IM = ['im']; const SHELF = ['he', 'oc', 'ta', 'tf', 'sc'];
ok('nothing saved: only the imagined shelf is left out', [...C.leftOutSet(null, colls, IM)].join() === '3' && [...C.leftOutSet(undefined, colls, IM)].join() === '3' && [...C.leftOutSet('junk', colls, IM)].join() === '3' && [...C.leftOutSet({}, colls, IM)].join() === '3');
ok('a saved choice replaces the default completely (an empty choice leaves nothing out)', [...C.leftOutSet(['Occult'], colls, IM)].join() === '1' && C.leftOutSet([], colls, IM).size === 0);
ok('saved names that are not collections are dropped, repeats are folded, and non-strings are ignored', C.leftOutClean(['Occult', 'No such', 'Occult', 7, null], colls).join() === 'Occult' && C.leftOutClean('x', colls) === null);
ok('leaving one out and bringing it back, from the default and from a saved choice', C.leftOutWith(null, colls, IM, 1, true).join() === 'Occult,The imagined shelf' && C.leftOutWith(null, colls, IM, 3, false).length === 0 && C.leftOutWith(['Occult'], colls, IM, 2, true).join() === 'Occult,Folk tales' && C.leftOutWith(['Occult', 'Folk tales'], colls, IM, 1, false).join() === 'Folk tales');
ok('saved names follow the library’s order, so the saved list is the same however it was built', C.leftOutWith(['Folk tales'], colls, IM, 1, true).join() === 'Occult,Folk tales');
ok('“scriptures and sources only” leaves out every collection made only of wider shelves or the imagined shelf, and nothing else', C.leftOutWider(colls, SHELF, IM).join() === 'Occult,Folk tales,The imagined shelf');
ok('a choice has been made only when something array-shaped is saved', C.leftOutChosen([], colls) && C.leftOutChosen(['Occult'], colls) && !C.leftOutChosen(null, colls) && !C.leftOutChosen('x', colls));
ok('the summary says how many, and says so when it is only the default', C.leftOutSummary(0, true) === 'nothing left out' && /^1 area left out/.test(C.leftOutSummary(1, true)) && /^3 areas left out/.test(C.leftOutSummary(3, true)) && /imagined shelf, until you change it/.test(C.leftOutSummary(1, false)) && !/until you change it/.test(C.leftOutSummary(1, true)));

/* ── the live library */
const K = M.LEFTOUT_KEY; const N = M.LIB_COLLECTIONS.length;
const idx = (g) => M.LIB_COLLECTIONS.findIndex((c) => c[2].includes(g)); const nameOf = (g) => M.LIB_COLLECTIONS[idx(g)][0];
const imIdx = idx('im'); const ftIdx = idx('ta');
ok('every collection is a collection by name once, so a saved name can find it', new Set(M.LIB_COLLECTIONS.map((c) => c[0])).size === N && ftIdx >= 0 && imIdx >= 0 && nameOf('ta') === 'Folk tales beyond Europe');
M.store.del(K);
ok('by default the imagined shelf, and only it, is left out', M.libLeftOut().size === 1 && M.libLeftOut().has(imIdx));
const meta = Object.fromEntries(M.LIB.map((l) => [l.id, { n: 1 }]));
const imId = M.LIB.find((l) => l.group === 'im').id; const ftId = M.LIB.find((l) => l.group === 'ta').id; const bibleId = 'b-gen';
const ids = (c = '') => M.srchIds(meta, { c });
ok('search by default: “All texts” leaves out the imagined shelf only', !ids().includes(imId) && ids().includes(ftId) && ids().includes(bibleId) && M.leftOutAllLabel() === 'All texts (not the imagined shelf)');
M.store.set(K, ['Folk tales beyond Europe']);
ok('search after leaving the folk tales out: they are gone from “All texts”, the imagined shelf is back in, and the label says how many', !ids().some((i) => M.LIB.find((l) => l.id === i && l.group === 'ta')) && ids().includes(imId) && ids().includes(bibleId) && /without the 1 area you left out/.test(M.leftOutAllLabel()));
ok('search: choosing a left-out area by name still searches it, and only it', ids(String(ftIdx)).length === M.LIB.filter((l) => ['ta', 'tf', 'tm', 'tp'].includes(l.group)).length && ids(String(ftIdx)).includes(ftId));
ok('libLeftOutId knows which books are left out', M.libLeftOutId(ftId) && !M.libLeftOutId(bibleId) && !M.libLeftOutId(imId) && M.libLeftOutId('no-such-id') === false);
M.store.set(K, []);
ok('after “leave nothing out” everything is searched and the label is plain', ids().includes(imId) && ids().includes(ftId) && M.leftOutAllLabel() === 'All texts');

/* the Library's list folds away what was left out, once a choice is saved, and shows it again when it is searched for or chosen by name */
const colWraps = (h) => (h.match(/class="collwrap"/g) || []).length;
M.store.del(K); const dflt = render(['library'], { a: 'collection' }).body;
ok('Library by default: every collection is listed, the imagined shelf too, and nothing is folded away', colWraps(dflt) === N && !dflt.includes('id="loFolded"') && dflt.includes('id="loBox"') && dflt.includes('Leave areas out'));
M.store.set(K, ['Folk tales beyond Europe', 'Occult and esoteric']); const folded = render(['library'], { a: 'collection' }).body;
ok('Library with two collections left out: they are folded away and named in one line, the rest are listed', colWraps(folded) === N - 2 && !folded.includes('data-grp="ta"') && !folded.includes('data-grp="oc"') && folded.includes('data-grp="hb"') && (folded.match(/id="loFolded">[^<]*/) || [''])[0].includes('Folk tales beyond Europe') && (folded.match(/id="loFolded">[^<]*/) || [''])[0].includes('Occult and esoteric'), (folded.match(/id="loFolded">[^<]*/) || [''])[0]);
ok('Library: a shelf chosen by name, or a title searched for, still shows a left-out collection', render(['library'], { a: 'collection', g: 'ta' }).body.includes('data-grp="ta"') && render(['library'], { a: 'collection', q: 'bengal' }).body.includes('data-grp="ta"'));
ok('Library: the control lists every collection with the left-out ones ticked, and offers the three presets', (folded.match(/data-leaveout="\d+"/g) || []).length === N && new RegExp('data-leaveout="' + ftIdx + '" checked').test(folded) && !new RegExp('data-leaveout="' + idx('hb') + '" checked').test(folded) && ['wider', 'none', 'reset'].every((p) => folded.includes('data-lo="' + p + '"')) && !badText(folded));
M.store.set(K, []); const none = render(['library'], { a: 'collection' }).body;
ok('Library with nothing left out: everything is listed and no line about folded collections', colWraps(none) === N && !none.includes('id="loFolded"'));
M.store.del(K);

/* the search page and the passage picker carry the same control, and the scope box names what “All texts” means now */
const sp = render(['search']).body;
ok('search page: has the control, and the scope box says “All texts (not the imagined shelf)” by default', sp.includes('id="loBox"') && sp.includes('>All texts (not the imagined shelf)</option>') && (sp.match(/data-leaveout="\d+"/g) || []).length === N);
M.store.set(K, ['Folk tales beyond Europe']);
ok('search page: after a choice the scope box says how many areas are left out, and every collection is still there to choose by name', /All texts \(without the 1 area you left out\)<\/option>/.test(render(['search']).body) && M.LIB_COLLECTIONS.every((c) => render(['search']).body.includes('>' + c[0].replace(/&/g, '&amp;') + '</option>')));
M.store.del(K);

(async () => {
  const wrap = () => ({ innerHTML: '', setAttribute() {}, removeAttribute() {} });
  const picker = async () => {
    M.TXT._scripts.index = Promise.resolve();
    const pbody = { innerHTML: '', querySelector: () => ({ addEventListener() {}, setAttribute() {}, textContent: '', style: {}, innerHTML: '' }), addEventListener() {} };
    const root = { innerHTML: '', querySelector: (s) => (s === '#pbody' ? pbody : { addEventListener() {}, setAttribute() {}, textContent: '', style: {}, innerHTML: '' }), addEventListener() {}, removeEventListener() {} };
    globalThis.__q = { '#psOut': wrap(), '#psKept': wrap(), '#psB': wrap(), '#psPool': { textContent: '' }, '#psRand': { setAttribute() {} } };
    M.Pages.path.mount(root, ['passage'], {}); await new Promise((r) => setTimeout(r, 60)); globalThis.__q = null; return pbody.innerHTML;
  };
  M.store.del(K); M.store.del('passage.areas');
  const h0 = await picker();
  ok('passage picker: carries the control, and marks no area as left out beyond the imagined shelf', h0.includes('id="loBox"') && (h0.match(/· left out/g) || []).length <= 1 && /to begin with, the imagined shelf/.test(h0), (h0.match(/· left out/g) || []).length);
  M.store.set(K, ['The Bible', 'Freedom of conscience']); const h1 = await picker();
  ok('passage picker: an area left out is marked on its box, and the legend says what none-ticked means', (h1.match(/· left out/g) || []).length >= 1 && /none ticked means every area except the ones you have left out/.test(h1));
  M.store.del(K);

  /* the source: every place that draws a random book or searches "all texts" reads the one saved choice, not a rule of its own */
  const src = (f) => fs.readFileSync(path.join(__dirname, '../src/js', f), 'utf8');
  ok('no draw or search still decides on its own which area to skip: they all use the saved choice', !/!libImagined\(l\.id\)\)\.map\(\(l\) => l\.id\)\.concat\(own\)/.test(src('6m-search.js')) && !/!libImagined\(l\.id\)\)\.map\(\(l\) => l\.id\)\);/.test(src('6d-passage.js')) && /leftOut: libLeftOut\(\)/.test(src('6d-passage.js')) && /lo\.has\(libCollOf\(l\.group\)\)/.test(src('6m-search.js')));
  ok('the saved choice is kept under one name and holds collection names, not positions', M.LEFTOUT_KEY === 'lib.leftout' && /store\.set\(LEFTOUT_KEY, leftOutWith\(/.test(src('6g-library.js')));
  console.log(`leave out: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
