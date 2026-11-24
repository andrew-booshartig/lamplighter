// Run: node tests/texts.test.js — validates the built text library in ../../texts (skipped if the folder is absent)
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const dir = path.join(__dirname, '../../texts'); const lib = fs.readFileSync(path.join(__dirname, '../src/js/24-data-path-lib.js'), 'utf8');
if (!fs.existsSync(path.join(dir, 'index.js'))) { console.log('texts folder not built; skipping (run tools/build_texts.py)'); process.exit(0); }
const ids = new Set([...lib.matchAll(/'([a-z]-[a-z0-9-]+)\|[^|]+\|([a-z]+)\|/g)].map((m) => m[1]));
const groups = Object.fromEntries([...lib.matchAll(/'([a-z]-[a-z0-9-]+)\|[^|]+\|([a-z]+)\|/g)].map((m) => [m[1], m[2]]));
let pass = 0, fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, x); } };
const T = { data: {}, meta: {}, add(id, m, s) { this.data[id] = { m, s }; }, addIndex(i) { Object.assign(this.meta, i); } };
const run = (f) => vm.runInNewContext(fs.readFileSync(path.join(dir, f), 'utf8'), { BEATLAB_TEXTS: T }, { filename: f });
run('index.js'); const idx = T.meta; const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'index.js' && f !== 'originals.js' && f !== 'figs.js' && f !== 'pgs.js' && !/^(fig|pg)-/.test(f));      // (originals.js, figs.js, fig-<id>.js, pgs.js and pg-<id>.js are sidecars, not texts: see tests/originals.test.js, tests/figures.test.js and tests/pages.test.js)
ok('index lists every text file and nothing else', files.length === Object.keys(idx).length && files.every((f) => idx[f.slice(0, -3)]), files.filter((f) => !idx[f.slice(0, -3)]).slice(0, 5));
let chars = 0;
for (const f of files) {
  const id = f.slice(0, -3); run(f); const d = T.data[id];
  ok(id + ' is a library entry', ids.has(id));
  /* the Universal Declaration of Human Rights is a United Nations document that keeps the UN's own terms of use; it is the one text here that is not public domain or CC0, and its licence line says so */
  ok(id + ' loads with a title, translator and licence', d && d.m.title && d.m.by && (/Public domain|CC0/.test(d.m.license) || (id === 'f-udh' && /^A United Nations document/.test(d.m.license))) && (d.m.src ? /^https:/.test(d.m.src) : /; a typed copy of the printed edition$/.test(d.m.license)), d && d.m);      // a typed copy of a reading edition names its printed edition and carries no address (Global Grey's terms: no branding in hosted files)
  ok(id + ' has non-empty sections with headings', d.s.length > 0 && d.s.every((s) => s[0].length > 0 && s[1].trim().length > 20), d.s.filter((s) => !s[0] || s[1].trim().length <= 20).map((s) => s[0]).slice(0, 3));
  ok(id + ' index matches the file', idx[id].n === d.s.length && idx[id].chars === d.s.reduce((a, s) => a + s[1].length, 0));
  // a real tag closes within a few hundred characters; a stray '<' from OCR ('<a head)' for '(a head)') is not markup
  const html = /<\/?(?:a|b|i|em|strong|span|br|p|div|sup|sub|u|font|j)\b[^>]{0,300}>/; const usfm = /\\(?:w|f|v|c|p|q\d?|wj|add) |\\\+?[a-z]+\*/;
  const bad = d.s.filter((s) => html.test(s[1]) || (/World English Bible/.test(d.m.by) && usfm.test(s[1])));
  ok(id + ' has no leftover markup', bad.length === 0, bad.map((s) => s[0]).slice(0, 2));
  const all = d.s.map((s) => s[1]).join('\n\n');
  ok(id + ' carries no scanner or e-text notices', !/scanned by Google|Hosted by Google|A public domain book is one|books\s*\.\s*google|^Produced by /im.test(all.slice(0, 4000)) && !/scanned by Google|Hosted by Google/.test(all));
  ok(id + ' has no runs of OCR noise (non-Latin script read as Latin)', !/scan/.test(d.m.license) || !/(?:\S*[\^$#%{}|\\~@£]\S*\s+){5}/.test(all), (all.match(/(?:\S*[\^$#%{}|\\~@£]\S*\s+){5}/) || [''])[0].slice(0, 80));
  ok(id + ' title has no stray escapes', !/\\/.test(d.m.title), d.m.title);
  const seen = new Set(); const dup = d.s.filter((s) => { if (s[1].length < 1000 || !/part \d+ of \d+/i.test(s[0])) return false; const k = s[1].slice(0, 600) + '\u0000' + s[1].slice(-600); return seen.has(k) || !seen.add(k); });   /* both ends, so a liturgy that repeats its opening psalms in two places (the Breviary, the festival prayers) is not mistaken for a repeated part */
  ok(id + ' has no section repeated whole (a chunking slip once overwrote one part with its neighbour)', dup.length === 0, dup.map((s) => s[0]).slice(0, 2));
  chars += idx[id].chars;
}
/* errors fixed in November 2026: keep them fixed */
const load = (id) => { run(id + '.js'); return T.data[id]; };
const size = (id) => load(id).s.reduce((a, s) => a + s[1].length, 0);
ok('The Cloud of Unknowing is whole (a stray "<b" in the scan once cut 60% of it)', size('e-cld') > 200000, size('e-cld'));
ok('the Kathavatthu half of the Abhidhamma manual is whole', size('x-abh') > 1500000, size('x-abh'));
ok('Hatha Yoga Pradipika is all but free of Devanagari read as Latin (286 traces before, a handful of short lines left)', (load('x-hyp').s.map((s) => s[1]).join(' ').match(/\^[A-Z]{2}|HKHI|\$c\^|\^[a-z]\^/g) || []).length <= 10);
ok('Prose Edda chapters are named, not a list of contents', (() => { const h = load('x-pre').s.map((s) => s[0]); return h.includes('CHAPTER I. GEFJUN’S PLOWING.') && h.includes('CHAPTER XVI. RAGNAROK.') && !load('x-pre').s.some((s) => /^Gefjun’s Plowing\s+\d+$/.test(s[1].trim())); })());
ok('Langdon’s psalms have readable section titles', load('x-sps').s.every((s) => !/[\\|^■]/.test(s[0])), load('x-sps').s.map((s) => s[0]).filter((h) => /[\\|^■]/.test(h)));
ok('common OCR misreadings are mended in scans', !/\b(?:tlie|tliat|wliich|witli)\b/.test(load('x-brah').s.map((s) => s[1]).join(' ')));
const must = Object.keys(groups).filter((i) => ['hb', 'nt', 'dc'].includes(groups[i]));
ok('every Hebrew Bible, New Testament and deuterocanon entry has its full text', must.every((i) => idx[i]), must.filter((i) => !idx[i]));
ok('Genesis opens correctly', (() => { run('b-gen.js'); return /In the beginning, God created the heavens and the earth/.test(T.data['b-gen'].s[0][1]); })());
ok('Psalms has 150 psalms', (() => { run('b-psa.js'); return T.data['b-psa'].s.length === 150; })());
ok('1 Enoch parts cover chapters 1–108', ['p-1en-w', 'p-1en-s', 'p-1en-a', 'p-1en-d', 'p-1en-e'].every((i) => { run(i + '.js'); return T.data[i]; }));
/* the wider shelves (occult, Masonic, shamanic and tribal): every catalogued book has its text, except those for which no readable public-domain edition has been found */
const WIDER_GROUPS = ['he', 'oc', 'sp', 'ms', 'si', 'tb', 'fi', 'fu', 'wi', 'ta', 'tf', 'tm', 'tp']; const WIDER_PENDING = ['h-emer'];
const wider = Object.keys(groups).filter((i) => WIDER_GROUPS.includes(groups[i]));
ok('every wider-shelf book has its text (except the one still being looked for)', wider.every((i) => WIDER_PENDING.includes(i) || idx[i]), wider.filter((i) => !WIDER_PENDING.includes(i) && !idx[i]));
ok('the pending book is really pending (remove them from WIDER_PENDING once their texts exist)', WIDER_PENDING.every((i) => ids.has(i) && !idx[i]), WIDER_PENDING.filter((i) => idx[i]));
const chrome = /Back to top|Global Grey|Download ebook|Free PDF/;
const dirty = wider.filter((i) => idx[i]).filter((i) => { run(i + '.js'); return T.data[i].s.some((s) => chrome.test(s[1]) || chrome.test(s[0])); });
ok('no wider-shelf text carries a website’s menu or link text', dirty.length === 0, dirty);
ok('the Voice of the Silence opens with its preface and ends with its footnotes', (() => { run('v-voice.js'); const s = T.data['v-voice'].s; return /^The following pages are derived/.test(s[0][1]) && s[s.length - 1][0] === 'Footnotes'; })());
ok('Morals and Dogma ends with Pike’s last words, not the 1909 digest-index that follows them in the Gutenberg file', (() => { run('k-pike.js'); const s = T.data['k-pike'].s; return /GLORIA DEI EST CELARE VERBUM\. AMEN\.\s*$/.test(s[s.length - 1][1]) && !s.some((x) => /DIGEST/.test(x[1].slice(0, 400))); })());
ok('Magus and the History of Spiritualism carry both books or volumes', ['m-magus', 'v-doyle'].every((i) => { run(i + '.js'); const h = T.data[i].s.map((s) => s[0]); return h.some((x) => /^(Book|Volume) 1 · /.test(x)) && h.some((x) => /^(Book|Volume) 2 · /.test(x)); }));
/* the folklore and witchcraft shelves: the books whose headings were set by hand keep them, and none opens on a contents list or carries a website's formatting note */
const heads = (id) => { run(id + '.js'); return T.data[id].s.map((s) => s[0]); };
ok('Scot’s Discoverie has Nicholson’s preface first and all sixteen books', (() => { const h = heads('w-scot'); return /^Nicholson/.test(h[0]) && [...Array(16).keys()].every((n) => h.some((x) => x.startsWith('The Discoverie of Witchcraft · Book ' + (n + 1)))); })());
ok('the Malleus has the Bull, then Part 1, Part 2 and Part 3 by question, down to Part 3 question 35', (() => { const h = heads('w-mall'); return h[0] === 'The Bull of Innocent VIII' && h.some((x) => /^Part 1 · Question I · /.test(x)) && h.some((x) => /^Part 2 · Chapter I · /.test(x)) && h.some((x) => /^Part 3 · Question XXXV · /.test(x)); })());
ok('Guazzo’s Compendium has its three books by chapter', ['Book 1 · Chapter I · ', 'Book 2 · Chapter I · ', 'Book 3 · Chapter I · '].every((p) => heads('w-guaz').some((x) => x.startsWith(p))));
ok('Daemonologie has the preface, the three books and Newes from Scotland', heads('w-king').join('|') === 'The Preface. to the Reader|First Booke|Seconde Booke|Thirde Booke|Newes from Scotland', heads('w-king'));
ok('Household Tales has its 200 tales and ten legends, beginning with the Frog-King', (() => { const h = heads('l-grim'); return h[0] === '1 The Frog-King, or Iron Henry' && h.filter((x) => /^\d{1,3} /.test(x)).length === 200 && h.filter((x) => /^Legend \d/.test(x)).length === 10; })());
ok('the Mythology of the British Islands is cut into its twenty-five chapters', heads('l-squi').filter((x) => /^Chapter [IVXL]+ · /.test(x)).length === 25);
ok('none of the shelf’s books opens on a contents list, and none keeps a note on how a website formatted it', ['l-grim', 'l-dase', 'l-fjel', 'l-jaco', 'l-jac2', 'l-squi', 'l-rhys', 'w-king', 'w-math', 'w-scot', 'w-mall', 'w-guaz'].every((i) => { run(i + '.js'); const s = T.data[i].s; return !/^\s*CONTENTS\b/i.test(s[0][1].slice(0, 200)) && !/^(?:The )?Contents$/i.test(s[0][0]) && !s.some((x) => /formatted using the text from/.test(x[1])); }));
ok('the witch-hunters’ own books each say, in their credit, that their claims are not evidence', ['w-scot', 'w-king', 'w-pott', 'w-hopk', 'w-math', 'w-mall', 'w-guaz'].every((i) => { run(i + '.js'); return /not evidence that witchcraft worked/.test(T.data[i].m.note || ''); }), 'note field');
/* the folk tales beyond Europe: the collections are cut at their tales, with no contents or illustration list left as a section, and each credit says whose version it is */
const FT_SPLIT = ['t-day', 't-sanf', 't-steel', 't-kunos', 't-wadd', 't-ozak', 't-lumm', 't-zitk', 't-mcla', 't-rass', 't-ditt', 't-west'];
ok('the folk-tale collections are cut at their tales, with no contents or illustration list as a section', FT_SPLIT.every((i) => { const h = heads(i); return h.length >= 9 && !h.some((x) => /^(?:list of |table of )?(?:contents|illustrations?):?$/i.test(x)); }), FT_SPLIT.filter((i) => heads(i).length < 9));
ok('Old Indian Legends opens with Iktomi and the Ducks, Folk-Tales of Bengal with Life’s Secret, Tales of the Punjab with its preface', heads('t-zitk')[0] === 'Iktomi and the Ducks' && heads('t-day').includes('Life\'s Secret') && heads('t-steel')[0] === 'Preface');
ok('the five folk-tale collections moved off the field-records shelf, and are in their new groups', (() => { const g = (id) => (lib.match(new RegExp("'" + id + '\\|[^|]+\\|([a-z]+)\\|')) || [])[1]; return g('a-zuni') === 'tm' && g('a-aust') === 'tp' && g('a-aino') === 'ta' && g('a-kaff') === 'tf' && g('a-blee') === 'tf'; })());
ok('Uncle Remus and the Arabian Nights say whose voice or version they are', (() => { run('t-remus.js'); run('t-lang.js'); return /white Georgia journalist/.test(T.data['t-remus'].m.note) && /not a literal translation/.test(T.data['t-lang'].m.note); })());
ok('every folk-tale credit says how the tales were gathered', ['ta', 'tf', 'tm', 'tp'].every((g) => Object.keys(groups).filter((i) => groups[i] === g).every((i) => { run(i + '.js'); return /collection of tales|Written in English by a member|Read it as a source on what/.test(T.data[i].m.note || '') || i.startsWith('a-'); })));
ok('texts are substantial', chars > 20e6, chars);
console.log(`${files.length} texts, ${(chars / 1e6).toFixed(1)} MB; ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
