/* The Atlas panel's texts (BACKLOG A2, 18 November 2026): after a click on the map, every text the panel names, in its list of texts and on its timeline, either opens in the reader or says plainly
   why it cannot (listed without a copy, oral, lost, not yet deciphered, not in the Library). The five states (src/js/2t-atlas-core.js), the button and sentence (6t-atlas-dive.js), the panel for every one
   of the traditions, the Library's books about a tradition, and the hand-made record → Library matches (tools/atlas_text_aliases.json) that this round added.
   Needs the built atlas/ and texts/ folders beside the project (it says so and skips what it cannot check). Run: node tests/atlas-texts.test.js */
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const ROOT = path.join(__dirname, '..'); const dir = path.join(ROOT, 'src/js'); const proj = path.join(ROOT, '..');
let pass = 0; let fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 400)); } };
const src = (f) => fs.readFileSync(path.join(dir, f), 'utf8'); const strip = (s) => s.replace(/\nif \(typeof module !== 'undefined' && module\.exports\)[^\n]*/g, '');
const A = require(path.join(dir, '2t-atlas-core.js'));

/* ── the five states, on small made-up records ── */
const readable = new Set(['x-one', 'x-two', 'x-three']); const have = (id) => readable.has(id);
const st = (x) => A.atlTextAccess(x, have);
ok('a record with one readable file opens it: state read', st({ lib: 'x-one' }).state === 'read' && st({ lib: 'x-one' }).first === 'x-one' && st({ lib: 'x-one' }).ids.join() === 'x-one');
ok('a record held only in part says part, and still opens the file', st({ lib: 'x-one', libp: 1 }).state === 'part' && st({ lib: 'x-one', libp: 1 }).first === 'x-one');
ok('a work held as several files says parts, opens the first readable one and lists the others', st({ lib: 'x-one', libs: ['x-one', 'x-two', 'x-three'] }).state === 'parts' && st({ lib: 'x-one', libs: ['x-one', 'x-two', 'x-three'] }).ids.length === 3);
ok('several files of which only one is here count as that one file (read), not as parts', st({ lib: 'x-gone', libs: ['x-gone', 'x-two'] }).state === 'read' && st({ lib: 'x-gone', libs: ['x-gone', 'x-two'] }).first === 'x-two');
ok('the Library naming the work without a file in this copy is listed, with no readable id', st({ lib: 'x-gone' }).state === 'listed' && st({ lib: 'x-gone' }).ids.length === 0 && st({ lib: 'x-gone' }).first === 'x-gone');
ok('a record with no Library match at all is none', st({}).state === 'none' && st({ lib: '' }).state === 'none' && st({ libs: [] }).state === 'none');
ok('hostile or damaged records never throw and are none: no record, a number, a list that is not a list, ids that are not strings', [undefined, null, 5, {}, { libs: 'x-one' }, { lib: 7 }, { libs: [7, {}, null] }, { lib: '' }].every((x) => { try { return st(x).state === 'none'; } catch (e) { return false; } }));
ok('a name from the object prototype is not a readable text', A.atlTextAccess({ lib: 'constructor' }, (id) => Object.prototype.hasOwnProperty.call({}, id)).state === 'listed');
const labels = { ext: '', lost: 'Lost', frag: 'Fragments only', oral: 'Oral tradition', und: 'Not yet deciphered', rec: 'Reconstructed', dis: 'Authenticity disputed' };
const none = (status) => A.atlTextNone({ status }, labels);
ok('the sentence for nothing to open fits the reason: oral, lost, undeciphered, fragments, reconstructed, disputed, and plain "Not in the Library" for the rest', none('oral') === 'Oral tradition: no written text to read' && none('lost') === 'Lost: no text survives' && none('und') === 'Not yet deciphered: no text to read' && none('frag') === 'Fragments only: not in the Library' && none('rec') === 'Reconstructed: not in the Library' && none('dis') === 'Authenticity disputed: not in the Library' && none('ext') === 'Not in the Library' && none(undefined) === 'Not in the Library' && A.atlTextNone(null, null) === 'Not in the Library');
ok('and none of them claims a text does not exist, or passes a verdict on it', ['oral', 'lost', 'und', 'frag', 'rec', 'dis', 'ext'].every((s) => !/does not exist|no such|never existed|fake|false|myth/i.test(none(s))));

/* ── the built data: every one of the records ── */
const adir = path.join(proj, 'atlas'); const tdir = path.join(proj, 'texts');
if (!fs.existsSync(path.join(adir, 'texts.js')) || !fs.existsSync(path.join(tdir, 'index.js'))) { console.log('atlas-texts: the atlas/ or texts/ folder is not next to the project (run tools/build_atlas.py); the checks on the real data were skipped'); console.log(`atlas texts: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0); }
globalThis.BEATLAB_ATLAS = { data: {}, add(n, d) { this.data[n] = d; } }; ['index', 'core', 'places', 'texts', 'sites', 'events'].forEach((n) => vm.runInThisContext(fs.readFileSync(path.join(adir, n + '.js'), 'utf8')));
globalThis.BEATLAB_TEXTS = { meta: {}, addIndex(i) { Object.assign(this.meta, i); } }; vm.runInThisContext(fs.readFileSync(path.join(tdir, 'index.js'), 'utf8'));
const D = BEATLAB_ATLAS.data; const cfg = D.index.config; const core = D.core; const ix = A.atlIndex(core); A.atlSetGroups(ix, cfg.family_groups.groups); ix.cfg = cfg; ix.codes = D.index.codes; ix.core = core;
const L = require(path.join(dir, '24-data-path-lib.js')); const byId = Object.fromEntries(D.texts.map((x) => [x.id, x])); const TXTS = { has: (id) => !!BEATLAB_TEXTS.meta[id] };
const states = D.texts.map((x) => A.atlTextAccess(x, TXTS.has)); const count = (s) => states.filter((a) => a.state === s).length;
ok('every one of the 2,307 records is in exactly one of the five states, and the states add up', D.texts.length === 2307 && ['read', 'part', 'parts', 'listed', 'none'].reduce((n, s) => n + count(s), 0) === D.texts.length);
ok('the matching reaches well beyond the 198 records the README once counted: more than 520 records open a text in the Library, and about 1,700 say plainly that none is held', count('read') + count('part') + count('parts') > 520 && count('none') > 1650 && count('none') < 1800, [count('read'), count('part'), count('parts'), count('listed'), count('none')]);
ok('every record that opens a text opens a Library id that the Library defines and that is in the texts folder', states.every((a, i) => !a.ids.length || a.ids.every((id) => L.LIB_BY_ID[id] && TXTS.has(id))), D.texts.filter((x, i) => states[i].ids.some((id) => !L.LIB_BY_ID[id] || !TXTS.has(id))).map((x) => x.id));
ok('a record the Library lists without a readable copy (the "listed" state) names a Library entry', states.every((a) => a.state !== 'listed' || L.LIB_BY_ID[a.first]), states.filter((a) => a.state === 'listed' && !L.LIB_BY_ID[a.first]).map((a) => a.first));
ok('the records marked as held only in part are all records that have a Library id', D.texts.every((x) => !x.libp || x.lib));

/* the 24 records this round matched by hand (tools/atlas_text_aliases.json, "Round 24") */
const NEW = { 'ludlul-bel-nemeqi-poem-of-the-righteous-sufferer': ['x-lud', 1], 'fama-fraternitatis': ['h-fama'], 'confessio-fraternitatis': ['h-fama'], 'three-books-of-occult-philosophy-agrippa': ['h-agri', 1], 'enochian-angelic-conversations-john-dee-and-edward-kelley': ['h-dee'], 'walam-olum': ['x-wol'], 'the-mahatma-letters': ['v-mahat'], 'the-ghost-dance-religion-james-mooney': ['a-ghos'], 'the-philosophy-of-the-teachings-of-islam': ['x-ahq'], 'the-sufi-message-inayat-khan': ['x-ink', 1], 'gallic-war-book-6-julius-caesar': ['x-cae'], 'targum-pseudo-jonathan': ['e-tgo', 1], 'nineteen-letters-and-horeb-s-r-hirsch': ['x-hir', 1], 'church-history-eusebius': ['e-eus'], 'stromata-clement-of-alexandria': ['e-clx'], 'corpus-of-pseudo-dionysius-the-areopagite': ['e-pdy', 1], 'apocalypse-of-paul-visio-pauli': ['e-a09'], 'diatessaron-tatian': ['e-a09'], 'fountain-of-knowledge-john-of-damascus': ['e-m09', 1], 'aranyakas-aitareya-kaushitaki-taittiriya': ['x-uai', 1], 'first-and-second-apologies-of-justin-martyr': ['e-jus'], 'arabic-infancy-gospel': ['e-inf'], 'divine-comedy-dante': ['i-dan'], 'the-pilgrim-s-progress-john-bunyan': ['i-bun', 1] };
ok('the 24 records matched by hand in this round each open the Library text named for them, and exactly those held in part say so', Object.entries(NEW).every(([k, [lid, part]]) => byId[k] && byId[k].lib === lid && !!byId[k].libp === !!part && A.atlTextAccess(byId[k], TXTS.has).first === lid), Object.entries(NEW).filter(([k, [lid, part]]) => !(byId[k] && byId[k].lib === lid && !!byId[k].libp === !!part)).map(([k]) => k));
ok('records that merely share words with a Library title are still not linked (Genesis Rabbah is not Genesis; the Kashf al-Mahjub of al-Sijistani is not Hujwiri’s; Unaipon’s tales are not Parker’s; the Gita As It Is is not a public-domain Gita)', ['genesis-rabbah', 'kashf-al-mahjub-abu-ya-qub-al-sijistani', 'legendary-tales-of-the-australian-aborigines-david-unaipon', 'bhagavad-gita-as-it-is-prabhupada', 'the-book-of-the-law-liber-al-vel-legis', 'coptic-apocalypse-of-peter', 'targum-jonathan-to-the-prophets'].every((k) => byId[k] && !byId[k].lib), ['genesis-rabbah', 'kashf-al-mahjub-abu-ya-qub-al-sijistani', 'legendary-tales-of-the-australian-aborigines-david-unaipon', 'bhagavad-gita-as-it-is-prabhupada', 'the-book-of-the-law-liber-al-vel-legis', 'coptic-apocalypse-of-peter', 'targum-jonathan-to-the-prophets'].filter((k) => !byId[k] || byId[k].lib));

/* ── the panel itself: the button, the sentence and the whole panel for every tradition (6t-atlas-dive.js against a stub page) ── */
const six = strip(src('6zz-traditions.js')); const bi = six.indexOf('function tradBooksHTML'); const bj = six.indexOf('/* where it came from'); const booksSrc = bi > 0 && bj > bi ? six.slice(six.lastIndexOf('/* a list of Library books', bi), bj) : '';
ok('the shared list of Library books (tradBooksHTML, tradAboutHTML, tradLoreHTML in 6zz-traditions.js) is where the panel expects it', booksSrc.includes('const tradAboutHTML') && booksSrc.includes('const tradLoreHTML'));
const prefix = `
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (n) => '<svg data-i="' + n + '"></svg>'; const LIB_BY_ID = LIBX.LIB_BY_ID; const libImagined = LIBX.libImagined; const TXT = TXTX; const ATLD = { ix: IXX };
const ATL_CONF = { H: 'well documented', M: 'scholarly consensus', L: 'rough estimate', C: 'contested' }; const atlDate = (r) => r.date_label || '';
const atlTimelineSVG = () => '<svg class="atl-tl"></svg>'; const atlPracticeBridges = () => ''; const srchHash = (q) => '#/path/search?q=' + encodeURIComponent(q); const srchOpts = () => ({});
const atlTextCat = (ix, c) => ((ix.codes.text_category || {})[c] || c || '').replace(/\\/.*/, '').replace(/ \\(.*/, ''); const GLOSSARY = []; const stNum = () => 1;
`;
const S = new Function('LIBX', 'TXTX', 'IXX', prefix + strip(src('2t-atlas-core.js')) + '\n' + strip(src('2z-about-core.js')) + '\n' + booksSrc + '\n' + strip(src('6t-atlas-dive.js')) + '\nreturn { atlDiveHTML, atlReadBtn, atlTextsSummary };')(L, TXTS, ix);
const panel = (id) => { const t = ix.trad[id]; const tl = A.atlTraditionTimeline(ix, D.events, id, 36); const texts = D.texts.filter((x) => x.tradition_id === id); const prac = (ix.tpOf[id] || []).map((p) => ix.practiceBy[p]).filter(Boolean); const rows = (ix.byTrad[id] || []).slice().sort((a, b) => a.year_start - b.year_start); return S.atlDiveHTML({ ix, t, tl, all: false, texts, prac, rows, color: '#7d9bff', pt: null, curY: 100 }); };
const btn = (k) => S.atlReadBtn(byId[k]);
ok('a readable record shows a plain "Read here" link to the reader; a partial one says "Read part here"; a many-file work says "Read first part" and offers all its parts', /href="#\/path\/read\/b-psa"[^>]*>Read here</.test(btn('psalms')) || /href="#\/path\/read\/b-psa"[^>]*>Read here</.test(S.atlReadBtn(D.texts.find((x) => x.lib === 'b-psa'))), btn('psalms'));
const partRec = D.texts.find((x) => x.libp && A.atlTextAccess(x, TXTS.has).state === 'part'); const manyRec = D.texts.find((x) => A.atlTextAccess(x, TXTS.has).state === 'parts');
ok('a partial record: "Read part here" with its note; a many-file record: "Read first part" and "All N parts"', /Read part here/.test(S.atlReadBtn(partRec)) && /title="The Library holds only part of this work"/.test(S.atlReadBtn(partRec)) && /Read first part/.test(S.atlReadBtn(manyRec)) && new RegExp('All ' + A.atlTextAccess(manyRec, TXTS.has).ids.length + ' parts').test(S.atlReadBtn(manyRec)));
ok('a record with nothing to open is never left silent: it says why, in a sentence, with no link and no button', D.texts.filter((x, i) => states[i].state === 'none').every((x) => { const h = S.atlReadBtn(x); return /^<span class="small muted dv-none"[^>]*>[^<]{10,}<\/span>$/.test(h) && !/<a |<button/.test(h); }));
ok('an oral tradition’s record says so ("Oral tradition: no written text to read"), not merely that the Library lacks it', /Oral tradition: no written text to read/.test(btn('dreaming-narratives-and-songlines')) && !/<a /.test(btn('dreaming-narratives-and-songlines')));
ok('a record of a work the Library lists but holds no copy of points to the Library’s entry, which says where to read it', (() => { const x = D.texts.find((r, i) => states[i].state === 'listed'); return !x || (/href="#\/path\/library\?q=/.test(S.atlReadBtn(x)) && /Where to read it/.test(S.atlReadBtn(x))); })());
ok('a text of the imagined shelf opens, and is labelled Imagined at once (the Divine Comedy; Part One of the Pilgrim’s Progress)', ['divine-comedy-dante', 'the-pilgrim-s-progress-john-bunyan'].every((k) => /href="#\/path\/read\/i-/.test(btn(k)) && /class="tag imagined"/.test(btn(k))) && !/imagined/i.test(btn('psalms')));
ok('the quiet form of the button is used on a timeline and the full form in the list', /class="btn sm ghost"/.test(S.atlReadBtn(byId['fama-fraternitatis'], { quiet: true })) && /class="btn sm primary"/.test(S.atlReadBtn(byId['fama-fraternitatis'])));
ok('the sentence at the top of a list of texts is plain, also for none: all, some, none, one, and the books about it', S.atlTextsSummary([byId['fama-fraternitatis']], 0) === '1 of its 1 catalogued text can be read here.' && /^None of its 2 catalogued texts is in the Library\.$/.test(S.atlTextsSummary([byId['legendary-tales-of-the-australian-aborigines-david-unaipon'], byId['songs-of-central-australia-t-g-h-strehlow']], 0)) && /^Its one catalogued text is not in the Library\./.test(S.atlTextsSummary([byId['songs-of-central-australia-t-g-h-strehlow']], 0)) && /The Library also holds 3 books about it, below\.$/.test(S.atlTextsSummary([byId['fama-fraternitatis']], 3)) && S.atlTextsSummary([], 4) === '');

/* the panel of every one of the 793 traditions */
let rowsChecked = 0; let panels = 0; const bad = []; const silent = []; const links = []; let emptyOk = true;
for (const id of Object.keys(ix.trad)) {
  const h = panel(id); panels++;
  if (/undefined|\[object|NaN|>null</.test(h)) bad.push(id);
  const items = h.split('<li class="dv-it ').slice(1).map((s) => s.slice(0, s.indexOf('</li>')));
  for (const it of items) { if (!/^k-text/.test(it)) { if (/dv-act/.test(it)) silent.push(id + ' act on a row that is not a text'); continue; } rowsChecked++; if (!/<\/button><div class="dv-act">/.test(it)) silent.push(id); else { const act = it.slice(it.indexOf('<div class="dv-act">')); if (!/<a class="btn sm (ghost|primary)" href="#\/path\/(read|library)/.test(act) && !/dv-none/.test(act)) silent.push(id + ' empty act'); if (/data-jump|data-sel|data-dive/.test(act)) links.push(id); } }
  const texts = D.texts.filter((x) => x.tradition_id === id); const lore = ix.core.lore && ix.core.lore[id] || []; const about = ix.core.about && ix.core.about[id] || [];
  if (texts.length && !/class="small dv-sumtx">/.test(h)) emptyOk = false;
  if (!texts.length && !/No texts are catalogued for this tradition/.test(h)) emptyOk = false;
  if (!texts.length && !about.length && !lore.length && !/the Library holds no book about it/.test(h)) emptyOk = false;
}
ok('the panel is made for every one of the 793 traditions, with no stray "undefined", "[object" or "NaN"', panels === 793 && bad.length === 0, bad.slice(0, 5));
ok(`every Text row on every timeline (${rowsChecked} rows) is followed by a way into the reader or a plain sentence, and a row that is not a text has neither`, rowsChecked > 1500 && silent.length === 0, silent.slice(0, 8));
ok('the links on the timeline are plain addresses: they carry none of the attributes the panel’s own click handler acts on, so the browser follows them', links.length === 0, links.slice(0, 5));
ok('a tradition with catalogued texts opens its list with the plain count; one with none says so, and says too when the Library holds no book about it either', emptyOk);

/* some real panels */
const pj = panel('judaism');
ok('Judaism: the timeline’s Psalms, Exodus and Genesis rows open b-psa, b-exo and b-gen, and the sentence says how many of its texts can be read', ['b-psa', 'b-exo', 'b-gen'].every((id) => new RegExp('class="dv-it k-text[^"]*"[^>]*>(?:(?!</li>).)*dv-act(?:(?!</li>).)*href="#/path/read/' + id + '"').test(pj)) && /\d+ of its \d+ catalogued texts can be read here/.test(pj), pj.slice(0, 200));
const pz = panel('zuni_religion');
ok('the Zuni, whose Library holds books about them and no catalogued text: no empty "Texts 0", the books are listed with their way into the reader, and the sentence says no texts are catalogued', /Texts <span class="muted">3<\/span>/.test(pz) && /Books about it in the Library/.test(pz) && /href="#\/path\/read\//.test(pz) && /No texts are catalogued for this tradition\./.test(pz) && !/the Library holds no book about it/.test(pz));
const pa = panel('aboriginal_australian');
ok('the Dreaming: two of five texts are oral and say so, two are not in the Library and say so, one opens, and the seven books about it are listed', /Oral tradition: no written text to read/.test(pa) && (pa.match(/Not in the Library/g) || []).length >= 2 && /1 of its 5 catalogued texts can be read here/.test(pa) && /Books about it in the Library <span class="muted">7<\/span>/.test(pa));
const pc = panel('catholicism'); ok('Catholicism: the Divine Comedy is a Text row that opens i-dan with the Imagined label', /href="#\/path\/read\/i-dan"/.test(pc) && /class="tag imagined"/.test(pc));
const pr = panel('rosicrucianism'); ok('Rosicrucianism: both manifestos open the one Library file that holds them', (pr.match(/href="#\/path\/read\/h-fama"/g) || []).length >= 2);

/* ── how it is wired ── */
const dive = src('6p-atlas.js'); const handler = dive.slice(dive.indexOf("dv.addEventListener('click'"), dive.indexOf('const onDocKey'));
ok('the panel’s click handler stops the browser only for the family links (data-sel); a link to the reader is left to the browser', handler.length > 200 && (handler.match(/preventDefault/g) || []).length === 1 && /data-sel|dataset\.sel/.test(handler.slice(0, handler.indexOf('preventDefault') + 20)));
const pages = src('6q-atlas-pages.js'); ok('the tradition page and the text catalogue use the same button and sentence as the panel (one function, atlReadBtn)', /const readable = atlReadBtn/.test(pages) && /\$\{atlReadBtn\(x\)\}/.test(pages));
console.log(`atlas texts: ${pass} passed, ${fail} failed (${D.texts.length} records, ${panels} panels, ${rowsChecked} Text rows on timelines)`); process.exit(fail ? 1 : 0);
