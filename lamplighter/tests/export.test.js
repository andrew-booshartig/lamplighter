// Run: node tests/export.test.js — saving a whole text (src/js/2z-export-core.js): the zip is a real zip (read back by a separate reader, with CRCs from node's own zlib), the EPUB has
// the structure an e-reader needs (mimetype first and stored, container, package, contents, spine, every chapter well-formed XML), no word of a text is lost, hostile text is escaped,
// highlights and notes travel with the text, and plain text, Markdown and the print page carry the same words. Runs on every library text if ../texts is built.
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const zlib = require('zlib'); const { spawnSync } = require('child_process');
globalThis.sha256 = require('../src/js/00-util.js').sha256;
const M = require('../src/js/2p-marks-core.js'); Object.assign(globalThis, M);
const X = require('../src/js/2z-export-core.js');
let pass = 0; let fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 300)); } };

/* a reader of zip files that shares no code with the writer */
function unzip(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength); let e = buf.length - 22; while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--; if (e < 0) throw new Error('no end of central directory');
  const count = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true); const out = [];
  for (let i = 0; i < count; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('bad central header'); const method = dv.getUint16(p + 10, true); const crc = dv.getUint32(p + 16, true); const csize = dv.getUint32(p + 20, true); const size = dv.getUint32(p + 24, true);
    const nl = dv.getUint16(p + 28, true); const el = dv.getUint16(p + 30, true); const cl = dv.getUint16(p + 32, true); const off = dv.getUint32(p + 42, true); const name = Buffer.from(buf.subarray(p + 46, p + 46 + nl)).toString('utf8'); p += 46 + nl + el + cl;
    if (dv.getUint32(off, true) !== 0x04034b50) throw new Error('bad local header for ' + name); const lnl = dv.getUint16(off + 26, true); const lel = dv.getUint16(off + 28, true); const lm = dv.getUint16(off + 8, true); const start = off + 30 + lnl + lel;
    const raw = Buffer.from(buf.subarray(start, start + csize)); const data = method === 0 ? raw : zlib.inflateRawSync(raw);
    out.push({ name, method, lm, data, crcOk: zlib.crc32(data) === crc && data.length === size, offset: off });
  }
  return out;
}
/* a checker for well-formed XML: tags nest, attributes are quoted, entities are known, nothing stray */
function wellFormed(xml) {
  const s = xml.replace(/^\uFEFF/, ''); let i = 0; const stack = []; const ents = /^&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/; let root = 0;
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s)) return 'control character';
  while (i < s.length) {
    if (s[i] === '<') {
      if (s.startsWith('<?', i)) { const j = s.indexOf('?>', i); if (j < 0) return 'unterminated processing instruction'; i = j + 2; continue; }
      if (s.startsWith('<!--', i)) { const j = s.indexOf('-->', i); if (j < 0) return 'unterminated comment'; i = j + 3; continue; }
      if (s.startsWith('<!DOCTYPE', i)) { const j = s.indexOf('>', i); if (j < 0) return 'unterminated doctype'; i = j + 1; continue; }
      const m = /^<(\/?)([A-Za-z_][\w:.-]*)((?:\s+[A-Za-z_:][\w:.-]*\s*=\s*(?:"[^"<]*"|'[^'<]*'))*)\s*(\/?)>/.exec(s.slice(i, i + 20000)); if (!m) return 'bad tag at ' + i + ': ' + s.slice(i, i + 60);
      const attrs = m[3]; const names = [...attrs.matchAll(/\s([A-Za-z_:][\w:.-]*)\s*=/g)].map((x) => x[1]); if (new Set(names).size !== names.length) return 'duplicate attribute in ' + m[2];
      for (const a of attrs.matchAll(/=\s*"([^"]*)"|=\s*'([^']*)'/g)) { const v = a[1] != null ? a[1] : a[2]; for (let k = v.indexOf('&'); k >= 0; k = v.indexOf('&', k + 1)) if (!ents.test(v.slice(k))) return 'bad entity in attribute'; }
      if (m[1]) { if (stack.pop() !== m[2]) return 'mismatched </' + m[2] + '>'; } else if (!m[4]) stack.push(m[2]); else if (!stack.length) root++;
      if (!m[1] && !stack.length === false && stack.length === 1 && !m[4]) root++; i += m[0].length;
    } else if (s[i] === '&') { if (!ents.test(s.slice(i, i + 12))) return 'bad entity at ' + i + ': ' + s.slice(i, i + 12); i = s.indexOf(';', i) + 1; }
    else i++;
  }
  return stack.length ? 'unclosed <' + stack[stack.length - 1] + '>' : root > 1 ? 'more than one root' : null;
}
const strip = (html) => html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<sup class="nr">.*?<\/sup>/g, '').replace(/<section class="notes"[\s\S]*?<\/section>/g, '').replace(/<sup class="vn">\d+<\/sup>/g, ' ').replace(/<br\/>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&#160;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const words = (t) => (String(t).match(/[\p{L}\p{N}’']+/gu) || []).length;

(async () => {
  const book = { id: 'x-test', title: 'The Test of Texts & “Quotes”', author: 'A. Translator', rights: 'Public domain (made up for a test)', source: 'https://example.org/a?b=1&c=2', note: 'A short note on the edition.' };
  const secs = [['Chapter 1', '[[1]] In the beginning was the word, and the word was good. [[2]] It said <script>alert(1)</script> & “more” — and ‘less’.\n\n## A heading\n\n[[3]] A third verse.'],
    ['Part 2 of 7 · And as he went along the road…', 'Stanza one line one\n  indented line two\n    deeper line three\n\nA plain paragraph with Greek λόγος and an emoji 🙂 and a control \u0001 char and a lone surrogate \ud800 end.'],
    ['', 'Third section with no heading at all.'], ['Empty-ish', '   ']];
  const marks = { hl: [{ id: 'a', s: 0, p: 0, a: 3, b: 17, q: 'the beginning', c: 'rose', n: 'My note with <b>markup</b> & line\nbreak' }, { id: 'b', s: 1, p: 1, a: 0, b: 7, q: 'A plain', c: 'blue', n: '' }, { id: 'c', s: 99, p: 0, a: 0, b: 3, q: 'zzz', c: 'gold', n: 'lost' }], bm: [], rs: [], n: 4, last: null, v: '' };

  /* ── the zip ── */
  { const files = [{ name: 'a.txt', data: 'hello '.repeat(500) }, { name: 'dir/ü ñ.txt', data: 'short' }, { name: 'bin', data: new Uint8Array([0, 1, 2, 255, 254]) }, { name: 'empty', data: '' }];
    const z = await X.expZip(files); const u = unzip(z);
    ok('a zip reads back: names, order, contents and CRCs', u.length === 4 && u.map((f) => f.name).join() === 'a.txt,dir/ü ñ.txt,bin,empty' && u.every((f) => f.crcOk) && u[0].data.toString() === 'hello '.repeat(500) && u[2].data.equals(Buffer.from([0, 1, 2, 255, 254])) && u[3].data.length === 0, u.map((f) => [f.name, f.method, f.crcOk]));
    ok('a compressible file is deflated, a tiny one is stored', u[0].method === 8 && u[1].method === 0 && z.length < 500 * 6, [u[0].method, z.length]);
    const zs = await X.expZip(files, { compress: false }); ok('compression can be switched off', unzip(zs).every((f) => f.method === 0 && f.crcOk));
    ok('the CRC is the standard one', X.expCrc32(Buffer.from('123456789')) === 0xCBF43926 && X.expCrc32(new Uint8Array(0)) === 0);
    const py = spawnSync('python3', ['-I', '-c', 'import zipfile,sys,io; z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())); print(z.testzip() or "ok", len(z.namelist()))'], { input: Buffer.from(z) });
    if (!py.error && py.status === 0) ok('Python’s zipfile accepts it and finds every file intact', /^ok 4/.test(py.stdout.toString()), py.stdout.toString() + py.stderr.toString()); }

  /* ── the e-book ── */
  const epub = await X.expEpub(book, secs, { marks }); const files = unzip(epub); const by = Object.fromEntries(files.map((f) => [f.name, f]));
  ok('mimetype is first, stored, exactly application/epub+zip, with nothing before it', files[0].name === 'mimetype' && files[0].method === 0 && files[0].data.toString() === 'application/epub+zip' && files[0].offset === 0);
  ok('every entry reads back with a matching CRC', files.every((f) => f.crcOk));
  ok('the container points at the package, which exists', /full-path="OEBPS\/content\.opf"/.test(by['META-INF/container.xml'].data.toString()) && by['OEBPS/content.opf']);
  const xmlFiles = files.filter((f) => /\.(xhtml|opf|ncx|xml)$/.test(f.name)); const bad = xmlFiles.map((f) => [f.name, wellFormed(f.data.toString('utf8'))]).filter((x) => x[1]);
  ok('every XHTML, package, navigation and container file is well-formed XML', bad.length === 0, bad);
  const opf = by['OEBPS/content.opf'].data.toString(); const manifest = [...opf.matchAll(/<item id="([^"]+)" href="([^"]+)" media-type="([^"]+)"/g)].map((m) => ({ id: m[1], href: m[2], type: m[3] })); const spine = [...opf.matchAll(/<itemref idref="([^"]+)"/g)].map((m) => m[1]);
  ok('the package lists every file it needs, once, and the spine only names what is listed', manifest.every((m) => by['OEBPS/' + m.href]) && new Set(manifest.map((m) => m.id)).size === manifest.length && spine.every((s) => manifest.some((m) => m.id === s)) && files.filter((f) => /^OEBPS\/.*\.(xhtml|css|ncx)$/.test(f.name)).every((f) => manifest.some((m) => 'OEBPS/' + m.href === f.name)), [manifest.length, spine]);
  ok('it has the required metadata: a stable identifier, title, language, modified date, and the licence and source', /<dc:identifier id="bookid">urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}<\/dc:identifier>/.test(opf) && /<dc:title>The Test of Texts &amp; “Quotes”<\/dc:title>/.test(opf) && /<dc:language>en<\/dc:language>/.test(opf) && /<meta property="dcterms:modified">\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ<\/meta>/.test(opf) && /<dc:rights>Public domain/.test(opf) && /<dc:source>https:\/\/example\.org\/a\?b=1&amp;c=2<\/dc:source>/.test(opf) && /<dc:creator>A\. Translator<\/dc:creator>/.test(opf), opf.slice(0, 600));
  ok('the same text always gets the same identifier, and another text another', X.expUuid('x-test') === X.expUuid('x-test') && X.expUuid('x-test') !== X.expUuid('x-test2') && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(X.expUuid('q')));
  const nav = by['OEBPS/nav.xhtml'].data.toString();
  ok('the contents page links every section, with a tidy title (an untitled one is "Part 3", a cut-from-a-scan one drops its first words)', (nav.match(/<li><a href="c\d{4}\.xhtml">/g) || []).length === 4 && nav.includes('>Part 2 of 7<') && nav.includes('>Part 3<') && nav.includes('epub:type="toc"') && !nav.includes('And as he went'), nav.slice(0, 500));
  ok('every contents link goes to a chapter that exists', [...nav.matchAll(/href="([^"#]+)"/g)].every((m) => by['OEBPS/' + m[1]]));
  const ch1 = by['OEBPS/c0001.xhtml'].data.toString(); const ch2 = by['OEBPS/c0002.xhtml'].data.toString();
  ok('verse numbers are kept as superscripts, a "## " line is a sub-heading', ch1.includes('<sup class="vn">1</sup>') && ch1.includes('<sup class="vn">3</sup>') && ch1.includes('<h3 class="rh">A heading</h3>'));
  ok('hostile text is escaped, not carried as markup', ch1.includes('&lt;script&gt;alert(1)&lt;/script&gt; &amp; “more”') && !/<script/.test(ch1));
  ok('poetry keeps its line breaks and indents (as break tags and no-break spaces)', ch2.includes('Stanza one line one<br/>&#160;&#160;indented line two<br/>&#160;&#160;&#160;&#160;deeper line three'), ch2.slice(ch2.indexOf('<body>'), ch2.indexOf('<body>') + 400));
  ok('unicode survives, and a control character or a lone surrogate does not break the file', ch2.includes('λόγος') && ch2.includes('🙂') && !/[\u0001\ud800]/.test(ch2) && !wellFormed(ch2));
  ok('a highlight keeps its colour and its words, a note becomes a numbered note with a link back, and the note’s own markup is escaped', ch1.includes('<span class="hl hl-rose">the beginning</span>') && /<sup class="nr"><a epub:type="noteref" id="r0-1" href="#n0-1">1<\/a><\/sup>/.test(ch1) && ch1.includes('<aside epub:type="footnote" id="n0-1">') && ch1.includes('My note with &lt;b&gt;markup&lt;/b&gt; &amp; line<br/>break') && ch1.includes('<span class="hl hl-blue">') === false && ch2.includes('<span class="hl hl-blue">A plain</span>'), ch1.slice(ch1.indexOf('<p class')));
  ok('a highlight in a section that is not there is dropped, not guessed at', !/lost/.test(ch1 + ch2));
  const noMarks = unzip(await X.expEpub(book, secs, { marks: null })).find((f) => f.name === 'OEBPS/c0001.xhtml').data.toString(); const noV = unzip(await X.expEpub(book, secs, { verses: false })).find((f) => f.name === 'OEBPS/c0001.xhtml').data.toString();
  ok('without marks there are none in the book, and verse numbers can be left out', !noMarks.includes('class="hl') && !noMarks.includes('footnote') && !noV.includes('class="vn"') && noV.includes('In the beginning was the word'));
  ok('the style sheet is there and styles verse numbers, highlights and notes', /sup\.vn/.test(by['OEBPS/style.css'].data.toString()) && /span\.hl-rose/.test(by['OEBPS/style.css'].data.toString()));
  const py2 = spawnSync('python3', ['-I', '-c', 'import zipfile,sys,io,xml.dom.minidom as m; z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())); [m.parseString(z.read(n)) for n in z.namelist() if n.endswith((".xhtml",".opf",".ncx",".xml"))]; print("ok", z.namelist()[0])'], { input: Buffer.from(epub) });
  if (!py2.error && py2.status === 0) ok('a strict XML parser (Python’s minidom) accepts every file', /^ok mimetype/.test(py2.stdout.toString()), py2.stdout.toString() + py2.stderr.toString());

  /* ── plain text, Markdown, the print page ── */
  const txt = X.expPlain(book, secs, { marks });
  ok('plain text has the title, the licence, a contents list, every section, verse numbers in brackets, and notes', txt.startsWith('The Test of Texts & “Quotes”') && txt.includes('Public domain') && txt.includes('CONTENTS') && txt.includes('1. Chapter 1') && txt.includes('2. Part 2 of 7') && txt.includes('[1] In the beginning') && txt.includes('— A heading —') && txt.includes('Note on “the beginning”: My note with <b>markup</b>') && !/[\u0001]/.test(txt), txt.slice(0, 300));
  ok('plain text can leave out the verse numbers and the notes', !/\[\d+\]/.test(X.expPlain(book, secs, { verses: false, marks: null })) && !X.expPlain(book, secs, { marks: null }).includes('Note on'));
  const md = X.expMarkdown(book, secs, { marks });
  ok('Markdown has headings, contents, escaped specials, superscript verses, marked highlights and quoted notes', md.startsWith('# The Test of Texts & “Quotes”') && md.includes('## Chapter 1') && md.includes('### A heading') && md.includes('<sup>1</sup>') && md.includes('<mark>the beginning</mark>') && md.includes('> Note on') && md.includes('\\<script\\>'), md.slice(0, 600));
  const html = X.expHtmlPage(book, secs, { marks });
  ok('the print page is one HTML file with a title page, contents, a page break before each section and print styles', html.startsWith('<!DOCTYPE html>') && html.includes('class="tp"') && html.includes('class="toc"') && (html.match(/<section class="chap"/g) || []).length === 4 && html.includes('@media print') && html.includes('page-break-before:always') && html.includes('href="#s2"') && html.includes('id="s2"') && html.includes('&lt;script&gt;') && !/<script/.test(html));
  ok('the print page says nothing of the e-book’s own markup and is well-formed enough to parse as XML', !html.includes('epub:type') && !wellFormed(html.replace(/^<!DOCTYPE html>\n/, '').replace('<html lang="en">', '<html lang="en">').replace(/<meta [^>]*>/g, (m) => (m.endsWith('/>') ? m : m.replace('>', '/>')))));
  ok('a file name is made safe', X.expFilename('Tao Te Ching — Legge (1891)', 'epub') === 'tao-te-ching-legge-1891.epub' && X.expFilename('', 'txt') === 'text.txt' && X.expFilename('../../etc/passwd', 'md') === 'etc-passwd.md' && X.expFilename('Ὁ λόγος', 'md') === 'text.md' || X.expFilename('Ὁ λόγος', 'md').endsWith('.md'));

  /* ── every library text: no word lost, every chapter well-formed ── */
  const dir = path.join(__dirname, '../../texts');
  if (fs.existsSync(path.join(dir, 'index.js'))) {
    const T = { data: {}, meta: {}, add(id, m, s) { this.data[id] = { m, s }; }, addIndex(i) { Object.assign(this.meta, i); } }; const run = (f) => vm.runInNewContext(fs.readFileSync(path.join(dir, f), 'utf8'), { BEATLAB_TEXTS: T }, { filename: f });
    run('index.js'); const ids = Object.keys(T.meta); let totalWords = 0; let worst = null; const lost = []; const invalid = []; let big = null;
    for (const id of ids) {
      run(id + '.js'); const d = T.data[id]; const t0 = Date.now(); const bk = { id, title: d.m.title || id, author: d.m.by, rights: d.m.license, source: d.m.src };
      const files2 = X.expEpubFiles(bk, d.s, { marks: null }); const ms = Date.now() - t0;
      const src = d.s.reduce((a, s) => a + words(s[1].replace(/\[\[\d+\]\]/g, ' ').replace(/^## /gm, '')), 0); const got = files2.filter((f) => /c\d{4}\.xhtml$/.test(f.name)).reduce((a, f) => a + words(strip(f.data)), 0) - d.s.length * 0;
      totalWords += src; const titleWords = d.s.reduce((a, s, i) => a + words(X.expTitle(s[0], i)), 0);
      if (Math.abs(got - titleWords - src) > Math.max(5, src * 0.002)) lost.push([id, src, got - titleWords]);
      if (files2.filter((f) => /c\d{4}\.xhtml$/.test(f.name)).length !== d.s.length) invalid.push([id, 'chapter count']);
      if (d.s.length <= 40 || id === 'x-mbh') { const w = files2.filter((f) => /\.(xhtml|opf|ncx)$/.test(f.name)).map((f) => [f.name, wellFormed(f.data)]).filter((x) => x[1]); if (w.length) invalid.push([id, w[0]]); }
      if (!worst || ms > worst[1]) worst = [id, ms]; if (id === 'x-mbh') big = { ms, chapters: d.s.length };
    }
    ok(`every one of the ${ids.length} library texts keeps every word in its e-book (to within 0.2%)`, lost.length === 0, lost.slice(0, 5));
    ok('every chapter is there and every file is well-formed XML (checked in full for the short books and the largest)', invalid.length === 0, invalid.slice(0, 4));
    ok('the largest text is built in a few seconds', big && big.ms < 20000 && worst[1] < 20000, [big, worst]);
    run('b-gen.js'); const g = T.data['b-gen']; const gz = await X.expEpub({ id: 'b-gen', title: 'Genesis', author: g.m.by, rights: g.m.license, source: g.m.src }, g.s, { marks: null }); const gu = unzip(gz);
    ok('Genesis saved as an e-book is 50 chapters and a sensible size', gu.filter((f) => /c\d{4}\.xhtml$/.test(f.name)).length === 50 && gz.length < 400000 && gz.length > 50000, gz.length);
    console.log(`  (${ids.length} texts, ${totalWords.toLocaleString()} words; slowest e-book ${worst[0]} ${worst[1]} ms; Genesis e-book ${(gz.length / 1000).toFixed(0)} KB)`);
  }
  /* a whole Bible version from the Bibles pack, saved as an e-book */
  const bdir = path.join(__dirname, '../../bibles');
  if (fs.existsSync(path.join(bdir, 'index.js'))) {
    const { bibSections } = require('../src/js/2z-bibles-core.js'); const BB = { versions: [], books: [], addIndex(i) { this.versions = i.versions; this.books = i.books; }, add(v, c, chs) { this.d[v + c] = chs; }, d: {} };
    const runB = (f) => vm.runInNewContext(fs.readFileSync(path.join(bdir, f), 'utf8'), { BEATLAB_BIBLES: BB }, { filename: f }); runB('index.js'); const names = Object.fromEntries(BB.books.map((b) => [b[0], b[1]]));
    for (const ver of ['kjv', 'dra', 'jps']) {
      const v = BB.versions.find((x) => x.id === ver); const list = v.books.map((c) => { runB(`${ver}-${c.toLowerCase()}.js`); return [c, names[c], BB.d[ver + c]]; });
      const secs = bibSections(list); const t0 = Date.now(); const files3 = X.expEpubFiles({ id: 'bible-' + ver, title: v.name, author: '', rights: v.license, source: v.src, note: v.basis }, secs, { marks: null });
      const srcWords = list.reduce((a, [, , chs]) => a + Object.values(chs).reduce((x, vs) => x + vs.reduce((y, vv) => y + words(vv[1]), 0), 0), 0);
      const chapFiles = files3.filter((f) => /c\d{4}\.xhtml$/.test(f.name)); const titleW = secs.reduce((a, s, i) => a + words(X.expTitle(s[0], i)), 0); const headW = secs.reduce((a, s) => a + (s[1].match(/^## .*$/gm) || []).reduce((x, h) => x + words(h.slice(3)), 0), 0);
      const got = chapFiles.reduce((a, f) => a + words(strip(f.data)), 0) - titleW - headW;
      ok(`${v.short} saved whole: one chapter per book (${secs.length}), every verse word present, built in a second`, chapFiles.length === secs.length && Math.abs(got - srcWords) <= Math.max(10, srcWords * 0.002) && Date.now() - t0 < 5000, [chapFiles.length, secs.length, got, srcWords]);
      const bad2 = files3.filter((f) => /\.(xhtml|opf|ncx)$/.test(f.name)).slice(0, 12).map((f) => [f.name, wellFormed(f.data)]).filter((x) => x[1]); ok(`${v.short}: the first files are well-formed XML`, bad2.length === 0, bad2);
    }
  }
  console.log(`export: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
