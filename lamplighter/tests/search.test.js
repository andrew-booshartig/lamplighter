/* Full-text search: the matching core (src/js/2r-search-core.js) on small cases, then the whole texts folder */
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const dir = path.join(__dirname, '../src/js');
const load = (names, ret) => new Function(names.map((f) => fs.readFileSync(path.join(dir, f), 'utf8').replace(/\nif \(typeof module !== 'undefined' && module\.exports\)[^\n]*/g, '')).join('\n') + '\nreturn {' + ret + '};')();
const S = load(['2p-marks-core.js', '2r-search-core.js'], 'parseQuery,compileQuery,searchSections,snippetHTML,termSource,searchKey,termDensity,excerptAround,paragraphAt,SEARCH_ALIASES,termFind,searchBooks');
let pass = 0; let fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra !== undefined ? JSON.stringify(extra).slice(0, 300) : ''); } };
const run = (secs, q, o) => S.searchSections(secs, S.compileQuery(q, o), o || {});

/* ── finding a book by the words of its title ── */
{ const lib = [{ id: 'a', title: 'Infancy Gospels (Thomas, Pseudo-Matthew, Arabic)' }, { id: 'b', title: 'Gospel of Thomas' }, { id: 'c', title: 'Gospel of John' }, { id: 'd', title: 'Gospel Thomas Notes' }]; const meta = { a: 1, b: 1, c: 1, d: 1 };
  const r = S.searchBooks(lib, meta, 'gospel thomas');
  ok('a book whose title has the typed words together comes first, then in order, and a long title after a short one', r.map((l) => l.id).join() === 'd,b,a', r.map((l) => l.id));
  ok('only books that can be read here are offered; an OR query or an empty one finds no title', S.searchBooks(lib, { b: 1 }, 'gospel').map((l) => l.id).join() === 'b' && S.searchBooks(lib, meta, 'gospel|thomas').length === 0 && S.searchBooks(lib, meta, '  ').length === 0 && S.searchBooks(lib, null, 'gospel').length === 0);
  ok('a title match ignores accents and capitals, and the list is capped', S.searchBooks([{ id: 'x', title: 'Épître aux Romains' }], { x: 1 }, 'EPITRE romains').length === 1 && S.searchBooks(Array.from({ length: 30 }, (_, i) => ({ id: 'k' + i, title: 'Book ' + i })), Object.fromEntries(Array.from({ length: 30 }, (_, i) => ['k' + i, 1])), 'book').length === 8); }

/* ── the query language ── */
{ const p = S.parseQuery('love "your enemies" -hate mercy|pity forgive OR pardon');
  ok('words, quoted phrases, exclusions and alternatives are parsed', p.terms.length === 4 && p.terms[1].phrase && p.terms[1].alts[0] === 'your enemies' && p.not[0] === 'hate' && p.terms[2].alts.join() === 'mercy,pity' && p.terms[3].alts.join() === 'forgive,pardon', p);
  ok('an empty or blank query has no terms', S.parseQuery('   ').terms.length === 0 && S.compileQuery('').empty);
  ok('a query is limited to eight terms', S.parseQuery('a b c d e f g h i j k').terms.length === 8); }
['(((', '[', '*', '\\', '?', '+++', '"', '""', '-', '|', 'a|', '|a', 'OR', '.*', '$^', '{1,2}', '(?<=x)'].forEach((q) => { let ok1 = true; try { run([['x', 'Some text (with) [brackets] and * stars.']], q); } catch (e) { ok1 = false; } ok('hostile query “' + q + '” does not throw', ok1); });

/* ── what matches ── */
const secs = [['One', 'Gilgamish said unto Uta-Napishtim, the remote.\n\nAnother paragraph about nothing at all.'], ['Two', '[[1]] Love your enemies, bless those who curse you. [[2]] Do good to those who hate you.\n\n[[3]] The glove fits and she loved the lovely day.'], ['Three', 'Jehovah spoke, and the neighbour listened. Honour thy father.\n\nElsewhere the savior came.']];
ok('case and accents are ignored', run(secs, 'utā NAPISHTIM').count === 1 && run(secs, 'UTA-NAPISHTIM').count === 1);
ok('a hyphen may be a hyphen, a space or nothing', run(secs, 'Uta Napishtim').count === 1 && run(secs, 'UtaNapishtim').count === 1 && run(secs, 'uta-napishtim').count === 1);
ok('a phrase runs across punctuation and verse numbers', run([['x', '[[1]] and God said [[2]] let there be, light']], '"God said let there be light"').count === 1);
ok('word endings are included by default (love finds loved and lovely)', run(secs, 'love').hits.filter((h) => h.s === 1).length >= 2 && run(secs, 'love').count === 2);
ok('whole words only: love no longer finds glove, loved or lovely', run(secs, 'love', { whole: true }).count === 1 && run(secs, 'love', { whole: true }).hits[0].q.startsWith('Love your enemies'));
ok('a word must start at a word boundary (love does not find glove)', !run([['x', 'The glove fits.']], 'love').count);
ok('words must share a paragraph by default', run(secs, 'enemies glove').count === 0 && run(secs, 'enemies bless').count === 1);
ok('…or just a section, in the looser mode', run(secs, 'enemies glove', { mode: 'sect' }).count === 1 && run(secs, 'enemies lovely', { mode: 'sect' }).count === 1);
ok('an excluded word removes the paragraph', run(secs, 'enemies -bless').count === 0 && run(secs, 'enemies -glove').count === 1);
ok('alternatives find either word', run(secs, 'napishtim|glove').count === 2 && run(secs, 'napishtim OR glove').count === 2);
ok('spelling variants are searched together (Yahweh finds Jehovah; honor, savior and neighbor find their British forms)', run(secs, 'yahweh').count === 1 && run(secs, 'honor').count === 1 && run(secs, 'savior').count === 1 && run(secs, 'neighbor').count === 1 && run(secs, 'gilgamesh').count === 1);
ok('…unless that is switched off', run(secs, 'yahweh', { alias: false }).count === 0 && S.compileQuery('yahweh', { alias: false }).aliases.length === 0 && S.compileQuery('yahweh').aliases.includes('jehovah'));
ok('apostrophes of either kind match', run([['x', 'the Qur’an and the Qur\'an']], "qur'an").count === 1);
ok('a hit is a paragraph and the heading, position and offsets are right', (() => { const r = run(secs, 'enemies'); const h = r.hits[0]; const para = S.paragraphAt(secs, h.s, h.p); return h.s === 1 && h.p === 0 && h.heading === 'Two' && para.slice(h.a, h.b) === h.q && h.f.toLowerCase() === 'enemies'; })());
ok('a short sentence is given a little context', run(secs, 'enemies').hits[0].q === 'Love your enemies, bless those who curse you.  Do good to those who hate you.', run(secs, 'enemies').hits[0].q);
ok('a long sentence is the whole excerpt, not the paragraph around it', (() => { const long = [['L', 'The first sentence is here and it goes on for a good while so that it is long enough to stand alone, truly. The needle sentence is here and it also goes on for a good while so that it is long enough to stand alone, truly. The last sentence closes it out and is also fairly long, so that nothing else is needed at all.']]; const h = run(long, 'needle').hits[0]; return h.q.startsWith('The needle sentence') && h.q.endsWith('truly.'); })());
ok('verse numbers never appear in excerpts', !/\[\[|\]\]/.test(run(secs, 'enemies hate').hits[0].q));
ok('the paragraph filter can skip paragraphs (e.g. not English)', run(secs, 'enemies', { skip: (b) => /enemies/.test(b) }).count === 0);
ok('count-only mode counts without excerpts', (() => { const r = run(secs, 'love', { count: true }); return r.count === 2 && r.hits.length === 0; })());
ok('the number of stored excerpts is capped but the count is not', (() => { const many = [['m', Array.from({ length: 60 }, (_, i) => 'Paragraph ' + i + ' has the word shepherd in it.').join('\n\n')]]; const r = run(many, 'shepherd', { maxHits: 10 }); return r.count === 60 && r.hits.length === 10; })());
ok('a heading line is never a hit by itself', run([['H', '## Shepherd\nThe shepherd keeps the sheep.']], 'shepherd').count === 1);
ok('sections are counted once however many paragraphs match', run([['a', 'shepherd one.\n\nshepherd two.\n\nnothing.']], 'shepherd').sections === 1 && run([['a', 'shepherd one.\n\nshepherd two.']], 'shepherd').count === 2);

/* ── showing hits ── */
ok('matched words are marked and everything else is escaped', S.snippetHTML('Love your <b>enemies</b> & friends', S.compileQuery('love enemies')) === '<mark>Love</mark> your &lt;b&gt;<mark>enemies</mark>&lt;/b&gt; &amp; friends');
ok('a marked word is shown whole, endings included, unless whole words were asked for', S.snippetHTML('the shepherds keep a shepherd', S.compileQuery('shepherd')) === 'the <mark>shepherds</mark> keep a <mark>shepherd</mark>' && S.snippetHTML('the shepherds keep a shepherd', S.compileQuery('shepherd', { whole: true })) === 'the shepherds keep a <mark>shepherd</mark>');
ok('a phrase is marked as one piece', S.snippetHTML('so love your enemies, then', S.compileQuery('"love your enemies"')) === 'so <mark>love your enemies</mark>, then');
ok('density counts occurrences per text', (() => { const d = S.termDensity([['a', 'peace and peaceful peace.'], ['b', 'war']], S.compileQuery('peace', { whole: true })); return d.n === 2 && d.chars === 25 + 3; })());

/* ── the results page: results first, the options and tips under one button, twenty passages and More (UX-06 of UX_AUDIT.md) ── */
{ const src = fs.readFileSync(path.join(dir, '6m-search.js'), 'utf8'); const css = fs.readFileSync(path.join(__dirname, '../src/css/app.css'), 'utf8');
  const cardCount = new Function(src.slice(src.indexOf('const SRCH_PAGE'), src.indexOf('const srchOpts')) + '\nreturn { SRCH_PAGE, srchCardCount };')();
  const mk = (...hits) => hits.map((n) => ['t', { hits: Array.from({ length: n }, () => 0), count: n }]);
  ok('the page begins with twenty passages, and a click on More adds twenty', cardCount.SRCH_PAGE === 20 && /shown \+= SRCH_PAGE/.test(src) && /let facet = ''; let shown = SRCH_PAGE;/.test(src));
  ok('a card shows three passages, so seven full cards cover twenty, and the card that crosses the limit is drawn whole', cardCount.srchCardCount(mk(...Array(30).fill(5)), 20) === 7 && cardCount.srchCardCount(mk(...Array(30).fill(5)), 21) === 7 && cardCount.srchCardCount(mk(...Array(30).fill(5)), 22) === 8);
  ok('texts with fewer hits fill the page more slowly, nothing is drawn past the end, and an empty result draws no card', cardCount.srchCardCount(mk(...Array(40).fill(1)), 20) === 20 && cardCount.srchCardCount(mk(2, 1, 1), 20) === 3 && cardCount.srchCardCount([], 20) === 0 && cardCount.srchCardCount(mk(3, 3), 0) === 0);
  const body = src.slice(src.indexOf('body.innerHTML = `<form class="srform"'), src.indexOf('const submit = (extra'));
  ok('the query box comes first, then one button, Filters and search tips, and the tips, the scope, the options and Leave areas out are all inside the panel it opens', body.indexOf('id="srForm"') < body.indexOf('data-sropts') && body.indexOf('data-sropts') < body.indexOf('id="srOpts"') && /Filters and search tips/.test(body) && ['Put <b>"quotes"</b>', 'id="srC"', 'id="srM"', 'id="srW"', 'id="srE"', 'id="srA"', '${leftOutControl()}'].every((x) => body.indexOf(x) > body.indexOf('id="srOpts"') && body.indexOf(x) < body.indexOf('id="srState"')));
  ok('results follow at once: the progress line, the books, the collections and the cards come after the panel, so the first passages are on the first screen', body.indexOf('id="srState"') > body.indexOf('id="srOpts"') && body.indexOf('id="srResults"') > body.indexOf('id="srState"') && body.indexOf('id="srMore"') > body.indexOf('id="srResults"'));
  ok('the panel is shut unless an option is on (a scope, the section mode, whole words, or English only or spelling variants switched off), and says how many are', /const optsN = \(o\.c !== '' \? 1 : 0\) \+ \(o\.m === 'sect' \? 1 : 0\) \+ \(o\.w \? 1 : 0\) \+ \(o\.e \? 0 : 1\) \+ \(o\.a \? 0 : 1\); const optsOpen = optsN > 0;/.test(src) && /aria-expanded="\$\{optsOpen\}" aria-controls="srOpts"/.test(src) && /id="srOpts"\$\{optsOpen \? '' : ' hidden'\}/.test(src) && /\$\{optsN \? `<span class="small muted">\$\{optsN\} on<\/span>` : ''\}/.test(src));
  ok('every address still works: the query, the scope and the options are read from it and written back by the same function, and the progress line is kept', /const srchHash = \(q, o\) => '#\/path\/search\?' \+ new URLSearchParams\(Object\.assign\(\{ q \}, o\.c !== '' \? \{ c: o\.c \} : \{\}/.test(src) && /Searching… \$\{doneN\} of \$\{ids\.length\} texts/.test(src) && /\['srC', 'srM', 'srW', 'srE', 'srA'\]\.forEach/.test(src));
  ok('the texts a person opened to see all their hits stay open when the list is drawn again', /const opened = new Set\(\)/.test(src) && /opened\.add\(mo\.dataset\.more\)/.test(src) && /srcard\$\{opened\.has\(id\) \? ' open' : ''\}/.test(src));
  ok('the button and the panel are styled, and the panel can be hidden', /\.sr-optsbtn\{/.test(css) && /\.sr-opts\{[^}]*border:1px solid var\(--line\)/.test(css) && /\.sr-opts\[hidden\]\{display:none\}/.test(css) && /\.sr-more\{/.test(css)); }

/* ── the whole texts folder ── */
const tdir = path.join(__dirname, '../../texts');
if (!fs.existsSync(path.join(tdir, 'index.js'))) { console.log(`search: ${pass} passed, ${fail} failed (texts folder not built; skipped the corpus checks)`); process.exit(fail ? 1 : 0); }
globalThis.BEATLAB_TEXTS = { data: {}, meta: {}, add(id, m, s) { this.data[id] = { meta: m, secs: s }; }, addIndex(i) { Object.assign(this.meta, i); } };
vm.runInThisContext(fs.readFileSync(path.join(tdir, 'index.js'), 'utf8')); const ids = Object.keys(BEATLAB_TEXTS.meta);
const lookup = {}; const scan = (q, o) => { const cq = S.compileQuery(q, o); const out = {}; ids.forEach((id) => { if (!BEATLAB_TEXTS.data[id]) vm.runInThisContext(fs.readFileSync(path.join(tdir, id + '.js'), 'utf8')); const r = S.searchSections(BEATLAB_TEXTS.data[id].secs, cq, o || {}); if (r.count) out[id] = r; }); return out; };
const t0 = Date.now();
const love = scan('"love your enemies"'); ok('“love your enemies” is found in Matthew and Luke', love['n-mat'] && love['n-luk'], Object.keys(love));
const light = scan('"let there be light"'); ok('“let there be light” is found in Genesis and the Septuagint', light['b-gen'] && light['p-lxx'], Object.keys(light));
const gil = scan('Gilgamesh'); ok('Gilgamesh also finds the Gilgamish spelling in the Epic', gil['x-gil'] && gil['x-gil'].count > 10, gil['x-gil'] && gil['x-gil'].count);
const mar = scan('Marduk'); ok('Marduk is found in the Babylonian creation text', !!mar['x-enu']);
const nas = scan('"then was not non-existent"'); ok('the Rigveda creation hymn is found across its OCR punctuation', !!nas['x-rig'], Object.keys(nas));
const pat = scan('Uta-Napishtim|Utnapishtim|Ziusudra|Ziudsuddu'); ok('the flood hero is found in Gilgamesh and the Sumerian epic', pat['x-gil'] && pat['x-par'], Object.keys(pat));
const mer = scan('compassion|mercy', { whole: true }); ok('compassion or mercy appears in a majority of the library', Object.keys(mer).length > ids.length * 0.5, [Object.keys(mer).length, ids.length]);
const non = scan('zzzqqxxnotaword'); ok('a nonsense word finds nothing', Object.keys(non).length === 0);
ok('every hit’s offsets point at its excerpt in its own text', (() => { let bad = 0; let n = 0; Object.entries(love).concat(Object.entries(mer)).forEach(([id, r]) => r.hits.forEach((h) => { n++; const para = S.paragraphAt(BEATLAB_TEXTS.data[id].secs, h.s, h.p); if (para == null || para.slice(h.a, h.b) !== h.q) bad++; })); return n > 50 && bad === 0 ? true : [n, bad]; })());
const hostile = (() => { let thrown = 0; ['(((', '[[1]]', '"', '*', '\\u', '.*+?'].forEach((q) => { try { scan(q, { maxHits: 1 }); } catch (e) { thrown++; } }); return thrown; })(); ok('hostile queries run over every text without errors', hostile === 0, hostile);
{ /* texts in other scripts, as a person may add to the reader: a word is found whole, with or without Hebrew points and Arabic marks, and English search is unchanged */
  const heb = [['שער', 'בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ.\n\nוְהָאָרֶץ הָיְתָה תֹהוּ וָבֹהוּ.']]; const ar = [['باب', 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ.\n\nٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ.']];
  const gr = [['Α', 'Ἐν ἀρχῇ ἦν ὁ λόγος, καὶ ὁ λόγος ἦν πρὸς τὸν θεόν.']]; const ru = [['Глава', 'В начале было Слово, и Слово было у Бога, и Слово было Бог.']];
  ok('Hebrew: a word without the points is found in the pointed text, and the pointed word in the pointed text', run(heb, 'אלהים').count === 1 && run(heb, 'אֱלֹהִים').count === 1 && run(heb, 'הארץ').count === 1 && run(heb, 'ארץ').count === 0 && run(heb, 'בראשית').count === 1);      // the second paragraph has the word with a prefix letter (ve-ha-aretz): a different word start
  ok('Arabic: the word without the vowel and recitation marks is found in the marked text', run(ar, 'الرحمن').count === 1 && run(ar, 'الرحيم').count === 1 && run(ar, 'رب').count === 1);
  ok('Greek, with its accents and breathings: found with or without them', run(gr, 'λογος').count === 1 && run(gr, 'ἐν ἀρχῇ').count === 1 && run(gr, 'θεον').count === 1);
  ok('Cyrillic is matched whole and without regard to case', run(ru, 'слово').count === 1 && run(ru, 'БОГУ').count === 0 && run(ru, 'бога').count === 1);
  ok('whole-word search in another script does not match inside a longer word', run(heb, 'ארץ', { whole: true }).count === 0 && run(heb, 'הארץ', { whole: true }).count === 1 && run(ru, 'Бог', { whole: true }).count === 1 && run(ru, 'Бо', { whole: true }).count === 0);
  ok('a mark in the middle of a query is ignored, as in the text', S.searchKey('אֱלֹהִים') === 'אלהים' && S.searchKey('ٱلرَّحْمَٰنِ') === 'ٱلرحمن');
  const sn = S.snippetHTML('בְּרֵאשִׁית בָּרָא אֱלֹהִים', S.compileQuery('אלהים')); ok('a marked word in a snippet is wrapped whole, points and all', /<mark>אֱלֹהִים<\/mark>/.test(sn), sn);
  ok('English is unchanged: accents, case, spelling variants and exclusions still behave', run([['x', 'Utā-Napishtim told the flood story. Jehovah spoke.']], 'uta napishtim').count === 1 && run([['x', 'Jehovah spoke']], 'yahweh').count === 1 && run([['x', 'peace and war']], 'peace -war').count === 0 && run([['x', 'Café life']], 'cafe').count === 1);
}
const ms = Date.now() - t0; ok('all of that — about ten scans of 140 MB — finished in a sensible time', ms < 120000, ms);
console.log(`search: ${pass} passed, ${fail} failed (${ids.length} texts, ${(ms / 1000).toFixed(1)} s for the corpus scans)`);
process.exit(fail ? 1 : 0);
