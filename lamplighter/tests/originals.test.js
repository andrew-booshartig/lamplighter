/* The original edition of each text (src/js/2z-originals-core.js) and its data (texts/originals.js, made by tools/texts_originals.py).
   Run: node tests/originals.test.js */
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const ROOT = path.join(__dirname, '..', '..'); const C = require('../src/js/2z-originals-core.js');
let pass = 0; let fail = 0; const notes = [];
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra !== undefined ? JSON.stringify(extra).slice(0, 400) : ''); } };

/* ── the pure functions ── */
ok('only https addresses are links: http, javascript:, data:, file: and rubbish are not', C.origUrlOk('https://archive.org/details/x') && !C.origUrlOk('http://archive.org/') && !C.origUrlOk('javascript:alert(1)') && !C.origUrlOk('data:text/html,hi') && !C.origUrlOk('file:///etc/passwd') && !C.origUrlOk('not a url') && !C.origUrlOk(null));
ok('sizes read plainly: none, kilobytes, megabytes with one decimal under 10, whole above, gigabytes', C.origBytes(0) === '' && C.origBytes(500) === '1 KB' && C.origBytes(204800) === '200 KB' && C.origBytes(1572864) === '1.5 MB' && C.origBytes(52428800) === '50 MB' && C.origBytes(3 * 1073741824) === '3.0 GB', [C.origBytes(500), C.origBytes(204800), C.origBytes(1572864), C.origBytes(52428800), C.origBytes(3 * 1073741824)]);
ok('a format label tells its kind: EPUB, Kindle, PDF, plain text, web page', C.origKind('EPUB, with pictures (for any e-reader or app)') === 'epub' && C.origKind('Kindle (KF8)') === 'kindle' && C.origKind('Kindle (AZW3)') === 'kindle' && C.origKind('PDF of the scan (every picture and page as printed)') === 'pdf' && C.origKind('Plain text') === 'text' && C.origKind('Full text (OCR, plain)') === 'text' && C.origKind('Web page (HTML; the pictures load from the site)') === 'web' && C.origKind('Read online (web page)') === 'web' && C.origKind('DjVu') === 'djvu');
const ALL = {
  'x-one': ['Project Gutenberg', [['', 'https://www.gutenberg.org/ebooks/2017', [['EPUB, with pictures', 'https://www.gutenberg.org/ebooks/2017.epub3.images', 124888], ['Plain text', 'https://www.gutenberg.org/ebooks/2017.txt.utf-8', 88619], ['Bad', 'http://example.org/insecure', 5], ['Worse', 'javascript:alert(1)', 5]]]]],
  'x-two': ['Internet Archive', [['Volume 1', 'https://archive.org/details/a', [['PDF of the scan', 'https://archive.org/download/a/a.pdf', 41943040]]], ['Volume 2', 'https://archive.org/details/b', []]]],
  'x-none': ['Nowhere', [['', 'ftp://example.org/x', []]]],
};
const META = { 'x-one': { src: 'https://www.gutenberg.org/ebooks/2017' }, 'x-two': { src: 'https://archive.org/details/a' }, 'x-fall': { src: 'https://example.org/aino-folk-tales.html' }, 'x-bad': { src: 'javascript:alert(1)' }, 'x-none': {} };
const e1 = C.origEntry(ALL, 'x-one', META); const e2 = C.origEntry(ALL, 'x-two', META);
ok('an entry keeps its https files and drops the others', e1 && e1.source === 'Project Gutenberg' && e1.parts.length === 1 && e1.parts[0].files.length === 2 && e1.parts[0].files.every((f) => f.url.startsWith('https://')), e1);
ok('a text made of volumes keeps each volume that has a page or a file', e2 && e2.parts.length === 2 && e2.parts[0].label === 'Volume 1' && e2.parts[1].page === 'https://archive.org/details/b' && e2.parts[1].files.length === 0, e2);
ok('with nothing in the data the text’s own src becomes a plain link; an unsafe or missing src gives nothing', (() => { const f = C.origEntry(ALL, 'x-fall', META); return f && f.source === 'example.org' && f.parts[0].page === META['x-fall'].src && f.parts[0].files.length === 0; })() && C.origEntry(ALL, 'x-bad', META) === null && C.origEntry(ALL, 'x-none', META) === null && C.origEntry(ALL, 'nope', META) === null && C.origEntry(null, 'x-one', null) === null);
ok('an id cannot reach into Object.prototype (constructor, __proto__, toString give nothing)', ['constructor', '__proto__', 'toString', 'hasOwnProperty'].every((k) => C.origEntry({}, k, {}) === null));
const h1 = C.origHTML(e1); const h2 = C.origHTML(e2, { short: true });
ok('the block names the source and every link opens in a new tab without leaking the page (noopener noreferrer)', /The original edition/.test(h1) && /from Project Gutenberg/.test(h1) && (h1.match(/<a /g) || []).length === 3 && (h1.match(/target="_blank" rel="noopener noreferrer"/g) || []).length === 3, h1);
ok('it shows the size of each file and labels each volume; the short form leaves out the explanation', /124888|122 KB/.test(h1) === true && /122 KB/.test(h1) && /40 MB/.test(h2) && /Volume 1/.test(h2) && /Volume 2/.test(h2) && !/need a connection/.test(h2) && /need a connection/.test(h1), [h1.slice(0, 300), h2.slice(0, 300)]);
ok('titles and labels are escaped, and the block is empty for no entry', C.origHTML({ source: '<b>x</b>', parts: [{ label: '"><script>', page: 'https://archive.org/details/q', files: [] }] }).indexOf('<script>') < 0 && C.origHTML(null) === '' && C.origEsc('<&>"\'') === '&lt;&amp;&gt;&quot;&#39;');
const files = C.origFiles(ALL, META, ['x-one', 'x-two', 'x-fall', 'nope'], null, (i) => 'T ' + i);
ok('the file list covers every text that has files, with its title, and can be limited by kind', files.length === 3 && C.origFiles(ALL, META, ['x-one', 'x-two'], ['pdf'], null).length === 1 && C.origFiles(ALL, META, ['x-one', 'x-two'], ['epub', 'text'], null).length === 2 && C.origFiles(ALL, META, ['x-one'], [], null).length === 0, files.map((f) => f.id + ':' + f.kind));
ok('the address list is one address per line, ending in a newline, and empty for nothing', C.origUrlList(files) === files.map((f) => f.url).join('\n') + '\n' && C.origUrlList([]) === '');
ok('the CSV quotes commas and quotes, and has a header', (() => { const c = C.origCsv([{ id: 'a', title: 'A, "B"', source: 'S', part: '', label: 'EPUB', bytes: 5, url: 'https://x.org/a' }]).split('\n'); return c[0] === 'id,title,source,part,format,bytes,url' && c[1] === 'a,"A, ""B""",S,,EPUB,5,https://x.org/a'; })());

/* ── the app uses it, and does not go online by itself ── */
const rd = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', '6k-reader.js'), 'utf8'); const fr = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', '6zf-freedom.js'), 'utf8'); const core = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', '2z-originals-core.js'), 'utf8'); const tx = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', '6c-texts.js'), 'utf8');
ok('the reader shows the original edition in the details (the source card, which holds the original files) and in the Save dialog', /id="rdOrig"/.test(rd) && /TXT\.orig\(\)/.test(rd) && /provCardHTML\(/.test(rd) && /origHTML\(/.test(rd) && /origHTML\(entry\)/.test(fs.readFileSync(path.join(__dirname, '../src/js/6kp-source.js'), 'utf8')) && /origEntry\(/.test(rd));
ok('the Freedom page can save the list of original links by kind of file', /id="origUrls"/.test(fr) && /id="origCsv"/.test(fr) && /origFiles\(/.test(fr) && /ORIG_KINDS/.test(fr));
ok('each kind of file on the Freedom page shows what it comes to before anyone chooses it (a list of every EPUB runs to many gigabytes)', /\$\{ORIG_KINDS\[c\.dataset\.ok\]\} · \$\{t \? origBytes\(t\)/.test(fr));
ok('the loader reads texts/originals.js on demand and falls back to nothing', /orig\(\) \{ return TXT\.script\('originals'\)/.test(tx));
ok('the core makes no request of its own: no fetch, XMLHttpRequest, WebSocket, sendBeacon or script loading', !/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|createElement\(\s*['"]script/.test(core));

/* ── the data ── */
const side = path.join(ROOT, 'texts', 'originals.js');
if (!fs.existsSync(side)) { console.log(`originals: ${pass} passed, ${fail} failed (texts/originals.js not built: run python3 -I tools/texts_originals.py; the data checks were skipped)`); process.exit(fail ? 1 : 0); }
globalThis.BEATLAB_TEXTS = { meta: {}, data: {}, add() {}, addIndex(o) { Object.assign(this.meta, o); } };
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'texts', 'index.js'), 'utf8')); vm.runInThisContext(fs.readFileSync(side, 'utf8'));
const meta = BEATLAB_TEXTS.meta; const data = globalThis.BEATLAB_ORIG; const ids = Object.keys(meta); const have = ids.filter((i) => data[i]);
const missing = ids.filter((i) => !data[i]);
if (missing.length) notes.push(`${missing.length} text(s) have no entry yet (${missing.slice(0, 6).join(', ')}${missing.length > 6 ? ', …' : ''}): rerun python3 -I tools/texts_originals.py`);
const stale = Object.keys(data).filter((i) => !meta[i]);
ok('most texts in the index have an entry (a text added since the last run is only a note, and the reader falls back to the text’s own source link; rerun the tool when texts are added)', have.length >= 0.5 * ids.length, [have.length, ids.length]);
ok('no entry is for a text that is gone', stale.length === 0, stale.slice(0, 8));
const bad = []; const hostsOk = /^(www\.gutenberg\.org|archive\.org|ebible\.org|en\.wikisource\.org|ws-export\.wmcloud\.org|suttacentral\.net|www\.archives\.gov|press-pubs\.uchicago\.edu|www\.un\.org|law\.lis\.virginia\.gov)$/;
for (const id of have) { const e = C.origEntry(data, id, meta); const raw = data[id]; if (!e) { bad.push(id + ': no usable entry'); continue; }
  const urls = raw[1].flatMap((p) => [p[1]].concat((p[2] || []).map((f) => f[1])));
  for (const u of urls) { if (!C.origUrlOk(u)) bad.push(id + ': not https ' + u); else if (!hostsOk.test(new URL(u).hostname)) bad.push(id + ': host ' + new URL(u).hostname); }
  for (const p of raw[1]) for (const f of (p[2] || [])) if (!(f[2] >= 0) || typeof f[0] !== 'string' || !f[0]) bad.push(id + ': bad file entry ' + JSON.stringify(f).slice(0, 60)); }
ok('every link is https on a known source, every file has a label and a size', bad.length === 0, bad.slice(0, 8));
const pgBad = []; for (const id of have) { const m = /gutenberg\.org\/ebooks\/(\d+)$/.exec(meta[id].src || ''); if (!m) continue; const first = data[id][1][0]; if (!first || !String(first[1]).endsWith('/ebooks/' + m[1])) pgBad.push(id + ' ' + (first && first[1])); for (const f of (first ? first[2] : [])) if (!new RegExp('/ebooks/' + m[1] + '\\.(epub3\\.images|kf8\\.images|html\\.images|txt\\.utf-8)$').test(f[1])) pgBad.push(id + ' ' + f[1]); }
ok('a Project Gutenberg text points at its own ebook number and the four standard files', pgBad.length === 0, pgBad.slice(0, 6));
const iaBad = []; for (const id of have) { const m = /archive\.org\/details\/([^/?#]+)/.exec(meta[id].src || ''); if (!m) continue; const first = data[id][1][0]; if (!first || !String(first[1]).endsWith('/details/' + m[1])) iaBad.push(id + ' ' + (first && first[1])); for (const f of (first ? first[2] : [])) if (f[1].indexOf('/download/' + encodeURIComponent(m[1]) + '/') < 0) iaBad.push(id + ' ' + f[1]); }
ok('an Internet Archive text points at its own item, and its files are inside that item', iaBad.length === 0, iaBad.slice(0, 6));
const withFiles = have.filter((i) => data[i][1].some((p) => (p[2] || []).length));
ok('most texts have at least one file to download (the rest only a page link)', withFiles.length >= 0.8 * have.length, [withFiles.length, have.length]);
const pgThin = have.filter((i) => data[i][0] === 'Project Gutenberg').filter((i) => data[i][1].some((p) => !(p[2] || []).some((f) => C.origKind(f[0]) === 'epub') || !(p[2] || []).some((f) => C.origKind(f[0]) === 'text'))).map((i) => i);
ok('every Project Gutenberg book offers an EPUB and plain text (a probe that failed leaves a gap: rerun the tool)', pgThin.length === 0, pgThin.slice(0, 8));
notes.forEach((n) => console.log('NOTE', n));
console.log(`originals: ${pass} passed, ${fail} failed (${have.length} of ${ids.length} texts, ${withFiles.length} with files)`);
process.exit(fail ? 1 : 0);
