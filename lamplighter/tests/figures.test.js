/* Pictures from the original editions: src/js/2z-figures-core.js, the reader's use of them (6k-reader.js), saving them in an e-book or web page (2z-export-core.js), and their data (texts/fig-<id>.js, texts/figs.js,
   made by tools/texts_figures.py). Run: node tests/figures.test.js */
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const ROOT = path.join(__dirname, '..', '..'); const SRC = path.join(__dirname, '..', 'src', 'js');
globalThis.sha256 = require('../src/js/00-util.js').sha256; Object.assign(globalThis, require('../src/js/2p-marks-core.js')); const F = require('../src/js/2z-figures-core.js'); Object.assign(globalThis, F); const X = require('../src/js/2z-export-core.js');
let pass = 0; let fail = 0; const notes = []; const ok = (n, c, x) => { if (c) pass++; else { fail++; console.log('FAIL', n, x !== undefined ? JSON.stringify(x).slice(0, 400) : ''); } };
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/* ── what is accepted ── */
const good = [1, 0, PNG, 300, 200, 'A card', 'The Fool'];
const cl = F.figClean([[2, 1, GIF, 10, 10, '', ''], good, [0, -1, PNG, 5, 5, 'x', 'y']], 3);
ok('good entries are kept and put in book order (section, then paragraph; -1 comes before the first paragraph)', cl.length === 3 && cl[0][0] === 0 && cl[0][1] === -1 && cl[1][0] === 1 && cl[2][0] === 2, cl.map((f) => f.slice(0, 2)));
const bad = [[0, 0, 'javascript:alert(1)', 1, 1, '', ''], [0, 0, 'data:text/html;base64,PHNjcmlwdD4=', 1, 1, '', ''], [0, 0, 'data:image/svg+xml;base64,PHN2Zy8+', 1, 1, '', ''], [0, 0, 'data:image/png;base64,AAAA"onerror="x', 1, 1, '', ''], [0, 0, 'https://example.org/a.png', 1, 1, '', ''],
  [-1, 0, PNG, 1, 1, '', ''], [5, 0, PNG, 1, 1, '', ''], [0, 0.5, PNG, 1, 1, '', ''], [0, -2, PNG, 1, 1, '', ''], [0, 0, PNG, 0, 1, '', ''], [0, 0, PNG, 1, -3, '', ''], [0, 0, 7, 1, 1, '', ''], 'x', null, []];
ok('everything else is dropped: scripts, html, svg, quote tricks, outside addresses, bad numbers, wrong shapes', F.figClean(bad, 3).length === 0 && F.figClean(null).length === 0 && F.figClean('no').length === 0 && F.figClean({}).length === 0, F.figClean(bad, 3).length);
ok('a long description or caption is cut, a missing one becomes empty', (() => { const x = F.figClean([[0, 0, PNG, 4, 4, 'a'.repeat(900), 'b'.repeat(2000)], [0, 1, PNG, 4, 4]], 1); return x[0][5].length === 400 && x[0][6].length === 800 && x[1][5] === '' && x[1][6] === ''; })());
ok('the picture’s kind and bytes are read from its address (a PNG starts with its signature)', F.figMime([0, 0, PNG]) === 'png' && F.figExt([0, 0, PNG]) === 'png' && F.figExt([0, 0, GIF]) === 'gif' && F.figExt([0, 0, 'data:image/jpeg;base64,AA==']) === 'jpg' && Array.from(F.figBytes([0, 0, PNG]).slice(0, 4)).join() === '137,80,78,71');
const h = F.figHTML([0, 0, PNG, 300, 200, '"><script>alert(1)</script>', 'Caption <b>&</b>']);
ok('a picture is a figure with its description as alt text and its caption beneath, everything escaped, drawn when scrolled to', /^<figure class="rfig"><img src="data:image\/png;base64,/.test(h) && h.indexOf('<script') < 0 && h.indexOf('<b>') < 0 && /loading="lazy"/.test(h) && /<figcaption dir="auto">Caption &lt;b&gt;&amp;&lt;\/b&gt;<\/figcaption>/.test(h) && /width="300" height="200"/.test(h), h.slice(0, 300));
ok('with no description the caption is the alt text; with neither there is still alt text', /alt="Only a caption"/.test(F.figHTML([0, 0, PNG, 1, 1, '', 'Only a caption'])) && /alt="Picture from the original edition"/.test(F.figHTML([0, 0, PNG, 1, 1, '', ''])) && F.figHTML([0, 0, PNG, 1, 1, '', '']).indexOf('<figcaption') < 0);
ok('the XHTML form closes its tag and names the file in place of the data address', (() => { const x = F.figHTML([0, 0, PNG, 1, 1, 'd', 'c'], { xml: true, src: 'images/f1.png' }); return /<figure class="fg"><img src="images\/f1\.png" width="1" height="1" alt="d"\/>/.test(x) && x.indexOf('data:') < 0 && x.indexOf('loading') < 0; })());

/* ── the reader draws them between paragraphs and moves nothing ── */
const rsrc = fs.readFileSync(path.join(SRC, '6k-reader.js'), 'utf8'); const a = rsrc.indexOf('function readerSection('); const b = rsrc.indexOf('/* the words of a paragraph as the page shows them');
const readerSection = new Function('textBlocks', 'blockParts', 'visibleText', 'resolveAnchor', 'paraHTML', 'icon', 'figHTML', rsrc.slice(a, b) + '\nreturn readerSection;')(textBlocks, blockParts, visibleText, resolveAnchor, paraHTML, () => '', F.figHTML);
const text = 'First paragraph of the section.\n\n## A heading\n\nSecond paragraph here.\n\n## Only a heading\n\nThird paragraph.'; const marks = { bm: [], hl: [] };
const plain = readerSection(text, 3, marks, '', false, null); const withf = readerSection(text, 3, marks, '', false, null, [[3, -1, PNG, 9, 9, 'before all', ''], [3, 0, PNG, 9, 9, 'after first', 'C1'], [3, 2, PNG, 9, 9, 'after the heading-only block', ''], [3, 3, GIF, 9, 9, 'last', '']]);
const pnums = (html) => (html.match(/<p dir="auto" data-p="\d+">/g) || []).join('');
ok('with pictures the paragraphs, their numbers and their words are exactly what they were', pnums(withf.html) === pnums(plain.html) && withf.html.replace(/<figure[\s\S]*?<\/figure>/g, '') === plain.html, [pnums(plain.html), pnums(withf.html)]);
ok('each picture comes right after the block it follows (one before everything, one after a heading-only block), and none is inside a paragraph', (() => { const html = withf.html; const order = [...html.matchAll(/<figure|<div class="pw[^"]*" data-p="(\d+)"/g)].map((m) => (m[1] === undefined ? 'F' : m[1])).join(''); return order === 'F0F2FF4'; })() && !/<p[^>]*>[^<]*<figure/.test(withf.html));
ok('a picture after a block that is only a heading is still shown', /after the heading-only block/.test(withf.html));
ok('the reader loads the picture list with the text and cleans it against the text’s sections', /Promise\.all\(\[TXT\.load\(id\), TXT\.figs\(id\), TXT\.pages\(id\)\]\)/.test(rsrc) && /figClean\(figsRaw, n\)/.test(rsrc) && (rsrc.match(/figsOf\(figsAll,/g) || []).length === 2 && /id="xFigs"/.test(rsrc));
ok('the loader reads texts/figs.js first and a picture file only for a text that has pictures', /figs\(id\) \{ return TXT\.script\('figs'\)\.then\(\(\) => \(globalThis\.BEATLAB_FIGN \|\| \{\}\)\[id\] \? TXT\.script\('fig-' \+ id\)/.test(fs.readFileSync(path.join(SRC, '6c-texts.js'), 'utf8')));
ok('the reader and the Library show a text’s pictures only while the text is the one they were placed in (figs.js records its characters and sections)', /fz\[2\] !== m\.chars/.test(fs.readFileSync(path.join(SRC, '6k-reader.js'), 'utf8')) && /n\[2\] !== mm\.chars/.test(fs.readFileSync(path.join(SRC, '6c-texts.js'), 'utf8')));
ok('the Library marks the texts that keep the printed book’s pictures, with their number', /TXT\.script\('figs'\)\.then\(\(\) => \{ const N = globalThis\.BEATLAB_FIGN/.test(fs.readFileSync(path.join(SRC, '6c-texts.js'), 'utf8')) && /figchip/.test(fs.readFileSync(path.join(SRC, '6c-texts.js'), 'utf8')));
ok('the figures core makes no request of its own', !/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|createElement\(\s*['"]script/.test(fs.readFileSync(path.join(SRC, '2z-figures-core.js'), 'utf8')));

/* ── saving ── */
const secs = [['One', 'Alpha paragraph.\n\nBeta paragraph.'], ['Two', 'Gamma paragraph.\n\nDelta paragraph.']]; const book = { id: 'x-test', title: 'Test', author: 'A', rights: 'PD', source: 'https://example.org' };
const figs = F.figClean([[0, 0, PNG, 40, 30, 'Alpha picture', 'Plate 1'], [1, -1, GIF, 20, 10, '', 'Frontispiece of two']], 2);
const base = X.expEpubFiles(book, secs, {}); const files = X.expEpubFiles(book, secs, { figs });
ok('with no pictures a saved e-book is as before (no image files, no image entries in the package)', base.every((f) => !/images\//.test(f.name)) && !/image\//.test(base.find((f) => f.name === 'OEBPS/content.opf').data));
const img1 = files.find((f) => f.name === 'OEBPS/images/f1.png'); const img2 = files.find((f) => f.name === 'OEBPS/images/f2.gif'); const opf = files.find((f) => f.name === 'OEBPS/content.opf').data; const c1 = files.find((f) => f.name === 'OEBPS/c0001.xhtml').data; const c2 = files.find((f) => f.name === 'OEBPS/c0002.xhtml').data;
ok('an e-book holds each picture as a file, stored as it is, listed in the package with its type', img1 && img2 && img1.store === true && Array.from(img1.data.slice(0, 4)).join() === '137,80,78,71' && /<item id="img1" href="images\/f1\.png" media-type="image\/png"\/>/.test(opf) && /<item id="img2" href="images\/f2\.gif" media-type="image\/gif"\/>/.test(opf), files.map((f) => f.name));
ok('in the chapters each picture is after its paragraph (or first), as XHTML, with its caption', c1.indexOf('Alpha paragraph.') < c1.indexOf('images/f1.png') && c1.indexOf('images/f1.png') < c1.indexOf('Beta paragraph.') && /<img src="images\/f1\.png" width="40" height="30" alt="Alpha picture"\/>/.test(c1) && /<figcaption dir="auto">Plate 1<\/figcaption>/.test(c1) && c2.indexOf('images/f2.gif') < c2.indexOf('Gamma paragraph.'), [c1.slice(0, 600)]);
const page = X.expHtmlPage(book, secs, { figs }); const plainTxt = X.expPlain(book, secs, { figs }); const md = X.expMarkdown(book, secs, { figs });
ok('a web page carries the pictures inside it; plain text and Markdown note each by its caption where it was', page.indexOf(PNG) > page.indexOf('Alpha paragraph.') && page.indexOf(PNG) < page.indexOf('Beta paragraph.') && plainTxt.indexOf('[Picture: Alpha picture]') > plainTxt.indexOf('Alpha paragraph.') && plainTxt.indexOf('[Picture: Alpha picture]') < plainTxt.indexOf('Beta paragraph.') && /\[Picture: Frontispiece of two\]/.test(plainTxt) && md.indexOf('*[Picture: Alpha picture]*') > md.indexOf('Alpha paragraph.') && md.indexOf('*[Picture: Alpha picture]*') < md.indexOf('Beta paragraph.'), [plainTxt.slice(300, 700)]);
ok('without pictures plain text, Markdown and the page are unchanged', X.expPlain(book, secs, { figs: [] }) === X.expPlain(book, secs, {}) && X.expMarkdown(book, secs, { figs: [] }) === X.expMarkdown(book, secs, {}) && X.expHtmlPage(book, secs, { figs: [] }) === X.expHtmlPage(book, secs, {}));

/* ── the data ── */
const idx = path.join(ROOT, 'texts', 'figs.js');
if (!fs.existsSync(idx)) { console.log(`figures: ${pass} passed, ${fail} failed (texts/figs.js not built: run python3 -I tools/texts_figures.py; the data checks were skipped)`); process.exit(fail ? 1 : 0); }
globalThis.BEATLAB_TEXTS = { meta: {}, data: {}, add() {}, addIndex(o) { Object.assign(this.meta, o); } }; vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'texts', 'index.js'), 'utf8')); vm.runInThisContext(fs.readFileSync(idx, 'utf8'));
const meta = BEATLAB_TEXTS.meta; const N = globalThis.BEATLAB_FIGN; const ids = Object.keys(N); let total = 0; const problems = []; const bigFiles = [];
const dims = (u) => { const b = F.figBytes([0, 0, u]); if (b[0] === 0x89) return [(b[16] << 24 | b[17] << 16 | b[18] << 8 | b[19]) >>> 0, (b[20] << 24 | b[21] << 16 | b[22] << 8 | b[23]) >>> 0]; if (b[0] === 0xff && b[1] === 0xd8) { let i = 2; while (i < b.length - 9) { if (b[i] !== 0xff) { i++; continue; } const m = b[i + 1]; if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return [b[i + 7] << 8 | b[i + 8], b[i + 5] << 8 | b[i + 6]]; i += 2 + (b[i + 2] << 8 | b[i + 3]); } } if (b[0] === 0x47) return [b[6] | b[7] << 8, b[8] | b[9] << 8]; return null; };
for (const id of ids) {
  const f = path.join(ROOT, 'texts', 'fig-' + id + '.js'); if (!fs.existsSync(f)) { problems.push(id + ': no picture file'); continue; }
  const size = fs.statSync(f).size; total += size; if (size > 24 * 1048576) bigFiles.push(id + ' ' + (size / 1048576).toFixed(1) + ' MB');
  delete globalThis.BEATLAB_FIGS; vm.runInThisContext(fs.readFileSync(f, 'utf8')); const raw = (globalThis.BEATLAB_FIGS || {})[id];
  if (!raw || !raw.length) { problems.push(id + ': empty'); continue; }
  const m = meta[id]; if (!m) { problems.push(id + ': not in the index'); continue; }
  const clean = F.figClean(raw, m.n); if (clean.length !== raw.length) problems.push(id + ': ' + (raw.length - clean.length) + ' entries rejected');
  if (N[id][0] !== raw.length) problems.push(id + ': figs.js says ' + N[id][0] + ' pictures, the file has ' + raw.length);
  for (const e of raw.slice(0, 6)) { const d = dims(e[2]); if (!d || d[0] !== e[3] || d[1] !== e[4]) problems.push(id + ': size mismatch ' + JSON.stringify(d) + ' vs ' + e[3] + 'x' + e[4]); }
  if (!raw.every((e) => e[5] || e[6])) problems.push(id + ': a picture with no description and no caption');
  if (raw.some((e) => !e[6] && /^[A-Za-zÀ-ɏ]{1,2}\.?$/.test(String(e[5]).trim()))) problems.push(id + ': a decorated first letter kept as a picture');
}
ok('every text listed in figs.js has a picture file whose entries are all valid, counted right, sized right, and described', problems.length === 0, problems.slice(0, 8));
ok('no picture file is over 24 MiB (a free static host takes 25)', bigFiles.length === 0, bigFiles);
const stray = fs.readdirSync(path.join(ROOT, 'texts')).filter((f) => /^fig-.+\.js$/.test(f)).map((f) => f.slice(4, -3)).filter((i) => !N[i] || !meta[i]);
ok('no picture file is left over: each texts/fig-<id>.js belongs to a text that is listed in figs.js and in the Library', stray.length === 0, stray);
/* The Library is a collection of all human religion: no picture is left out because of what a book records (the exclusion that earlier notes called the maker's rule was never his and was withdrawn on 17 November 2026); a book is left out of the plates only for a reason of rights */
{ const tp = fs.readFileSync(path.join(__dirname, '..', 'tools', 'texts_plates.py'), 'utf8'); const tf = fs.readFileSync(path.join(__dirname, '..', 'tools', 'texts_figures.py'), 'utf8'); const lo = tp.slice(tp.indexOf('LEFT_OUT = {'), tp.indexOf('}\n', tp.indexOf('LEFT_OUT = {')) + 1); const ids2 = [...lo.matchAll(/^\s+'([a-z0-9-]+)':/gm)].map((m) => m[1]);
  ok('no picture is left out because of what a book records (ceremonies, sacred objects): the plate tool leaves out only books whose pictures have unclear rights, and neither tool skips a text for a note about living peoples', ids2.join() === 'm-goet' && !/CEREMONY_NOTE/.test(tp + tf) && !/records a ceremony of a people who are living today/.test(tp.replace(/#[^\n]*/g, '') + tf.replace(/#[^\n]*/g, '').replace(/\([^)]*withdrawn[^)]*\)/g, '')), ids2); }
const outdated = ids.filter((i) => N[i][2] && meta[i] && (N[i][2] !== meta[i].chars || (N[i][3] && N[i][3] !== meta[i].n)));
if (outdated.length) notes.push(`${outdated.length} text(s) were rebuilt since their pictures were placed, so the reader hides those pictures until tools/texts_figures.py is rerun for them: ${outdated.slice(0, 8).join(', ')}`);
ok('the pictures are kept to a sensible size: all together under 300 MB', total < 300 * 1048576, (total / 1048576).toFixed(1) + ' MB');
const ph = []; for (const id of ids.slice(0, 5)) { delete globalThis.BEATLAB_FIGS; vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'texts', 'fig-' + id + '.js'), 'utf8')); const raw = globalThis.BEATLAB_FIGS[id]; const tf = path.join(ROOT, 'texts', id + '.js'); const t = fs.readFileSync(tf, 'utf8'); const dec = new vm.Script('(' + 'function(){ let r; const BEATLAB_TEXTS = { add(i, m, s) { r = s; } }; ' + t + '; return r; })()'); const secsT = dec.runInThisContext(); for (const e of raw) { const nb = textBlocks(secsT[e[0]][1]).length; if (e[1] >= nb) ph.push(id + ' ' + e[0] + '.' + e[1] + ' of ' + nb); } }
ok('in the first texts checked, each picture’s paragraph exists in its section', ph.length === 0, ph.slice(0, 6));
notes.forEach((n) => console.log('NOTE', n));
console.log(`figures: ${pass} passed, ${fail} failed (${ids.length} texts with pictures, ${ids.reduce((n, i) => n + N[i][0], 0)} pictures, ${(total / 1048576).toFixed(1)} MB)`);
process.exit(fail ? 1 : 0);
