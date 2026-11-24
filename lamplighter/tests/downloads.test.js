// Run: node tests/downloads.test.js — the two folders a person can copy whole: downloads/ (every text as an e-book, a text file and Markdown, tools/make_downloads.js) and originals/ (the sources' own
// scans, e-books and full texts, tools/fetch_originals.py). The files are the ones the Save dialog makes and are real e-books; building again keeps what is up to date; the originals tool only
// plans unless it is told to fetch, names its files the same way as downloads/, and its lists are made from the files that are really in the folder. Nothing here uses the network.
const fs = require('fs'); const path = require('path'); const os = require('os'); const zlib = require('zlib'); const { spawnSync } = require('child_process');
let pass = 0; let fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 300)); } };
const root = path.resolve(__dirname, '..', '..'); const tools = path.join(__dirname, '..', 'tools');
const node = (...a) => spawnSync(process.execPath, ['--no-warnings', ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const py = (...a) => spawnSync('python3', ['-I', ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dl-'));

/* a reader of zip files that shares no code with the writer: the first entry and every entry's CRC */
function unzipNames(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength); let e = buf.length - 22; while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--; if (e < 0) return null;
  const count = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true); const out = [];
  for (let i = 0; i < count; i++) { const method = dv.getUint16(p + 10, true); const crc = dv.getUint32(p + 16, true); const cs = dv.getUint32(p + 20, true); const nl = dv.getUint16(p + 28, true); const el = dv.getUint16(p + 30, true); const cl = dv.getUint16(p + 32, true); const off = dv.getUint32(p + 42, true); const name = buf.subarray(p + 46, p + 46 + nl).toString('utf8');
    const lnl = dv.getUint16(off + 26, true); const lel = dv.getUint16(off + 28, true); const raw = buf.subarray(off + 30 + lnl + lel, off + 30 + lnl + lel + cs); const data = method === 0 ? raw : zlib.inflateRawSync(raw); out.push({ name, ok: zlib.crc32(data) === crc, data }); p += 46 + nl + el + cl; }
  return out;
}

const hasTexts = fs.existsSync(path.join(root, 'texts', 'index.js')) && fs.existsSync(path.join(root, 'texts', 'f-udh.js')) && fs.existsSync(path.join(root, 'texts', 'b-gen.js'));
if (!hasTexts) console.log('(texts/ is not built here: the make_downloads checks are skipped)');
if (hasTexts) {
  const out = path.join(tmp, 'downloads');
  const list = node(path.join(tools, 'make_downloads.js'), '--only=f-udh,b-gen', '--list', '--out=' + out); ok('--list says what it would do and writes nothing', list.status === 0 && /2 texts × 3 formats = 6 files/.test(list.stdout) && !fs.existsSync(out), list.stdout + list.stderr);
  const r1 = node(path.join(tools, 'make_downloads.js'), '--only=f-udh,b-gen', '--out=' + out); ok('builds two texts in three formats', r1.status === 0 && /6 files built, 0 already up to date, 0 failed/.test(r1.stdout), r1.stdout + r1.stderr);
  const idx = JSON.parse(fs.readFileSync(path.join(out, 'index.json'), 'utf8')); const e = idx.texts['f-udh']; const b = idx.texts['b-gen'];
  ok('the list names every file, with its shelf, and the files are there', e && b && e.shelf === '10 Freedom of conscience' && b.shelf === '01 The Bible' && ['epub', 'txt', 'md'].every((f) => fs.existsSync(path.join(out, e.files[f])) && fs.statSync(path.join(out, e.files[f])).size === e.bytes[f] && e.files[f].startsWith(f + '/')), e);
  ok('file names are the title and the id', /^epub\/10 Freedom of conscience\/The Universal Declaration of Human Rights \[f-udh\]\.epub$/.test(e.files.epub) && /\[b-gen\]\.md$/.test(b.files.md), [e.files.epub, b.files.md]);
  const z = unzipNames(fs.readFileSync(path.join(out, e.files.epub))); ok('the e-book is a real zip with its mimetype first and every CRC right', z && z[0].name === 'mimetype' && z[0].data.toString() === 'application/epub+zip' && z.every((x) => x.ok) && z.some((x) => x.name === 'META-INF/container.xml') && z.filter((x) => /c\d{4}\.xhtml$/.test(x.name)).length >= 1, z && z.map((x) => x.name).slice(0, 6));
  const txt = fs.readFileSync(path.join(out, e.files.txt), 'utf8'); const md = fs.readFileSync(path.join(out, b.files.md), 'utf8');
  ok('the text file carries the words, the source and the licence', /Universal Declaration of Human Rights/.test(txt) && /Article 18/.test(txt) && /un\.org/.test(txt) && /Saved from the Lamplighter Project/.test(txt));
  ok('Markdown has headings and verse numbers', /^#/m.test(md) && /In the beginning/.test(md) && /\[?1\]?/.test(md));
  const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
  ok('index.html links each file, encoded, with no outside address', html.includes('href="epub/10%20Freedom%20of%20conscience/') && !/(src|href)="https?:/.test(html) && /2 texts/.test(html) && /<html lang="en">/.test(html));
  ok('a READ ME says what the folders are', /epub\/\s+an e-book/.test(fs.readFileSync(path.join(out, 'READ ME.txt'), 'utf8')));
  const r2 = node(path.join(tools, 'make_downloads.js'), '--only=f-udh,b-gen', '--out=' + out); ok('building again keeps what is up to date', r2.status === 0 && /0 files built, 6 already up to date/.test(r2.stdout), r2.stdout);
  const r3 = node(path.join(tools, 'make_downloads.js'), '--only=f-udh', '--force', '--out=' + out); ok('--force builds again', r3.status === 0 && /3 files built/.test(r3.stdout), r3.stdout);
  const r4 = node(path.join(tools, 'make_downloads.js'), '--only=f-udh', '--formats=pdf', '--out=' + out); ok('an unknown format is refused', r4.status === 2 && /unknown format/.test(r4.stderr), r4.stderr);
  const r5 = node(path.join(tools, 'make_downloads.js'), '--only=nosuchtext', '--out=' + path.join(tmp, 'd2')); ok('an unknown text is named, not built', /not found in texts\/: nosuchtext/.test(r5.stderr) && /0 texts/.test(r5.stdout), r5.stdout + r5.stderr);
  const lay = JSON.parse(node(path.join(tools, 'make_downloads.js'), '--layout').stdout); ok('the layout names every text of the index, the same way', Object.keys(lay).length > 1000 && lay['f-udh'].name === 'The Universal Declaration of Human Rights [f-udh]' && lay['f-udh'].shelf === e.shelf && Object.values(lay).every((v) => v.shelf && v.name.length < 140 && !/[\\/:*?"<>|]/.test(v.name)));
  /* a text with printed pages and one with pictures keep them in the e-book */
  if (fs.existsSync(path.join(root, 'texts', 'pg-a-ada.js')) && fs.existsSync(path.join(root, 'texts', 'fig-a-asht.js'))) {
    const o2 = path.join(tmp, 'd3'); const r6 = node(path.join(tools, 'make_downloads.js'), '--only=a-ada,a-asht', '--formats=epub,txt', '--out=' + o2); ok('a scanned text and an illustrated text build', r6.status === 0, r6.stdout + r6.stderr);
    const ix = JSON.parse(fs.readFileSync(path.join(o2, 'index.json'), 'utf8')).texts;
    const ez = unzipNames(fs.readFileSync(path.join(o2, ix['a-asht'].files.epub))); ok('an illustrated text keeps its pictures in the e-book', ez && ez.filter((x) => /\.(jpe?g|png|gif)$/i.test(x.name)).length >= 10 && ez.every((x) => x.ok));
    ok('a scanned text keeps its printed page numbers', /\[Vol\. 1, p\. \d+\]/.test(fs.readFileSync(path.join(o2, ix['a-ada'].files.txt), 'utf8')) && /epub:type="pagebreak"/.test(unzipNames(fs.readFileSync(path.join(o2, ix['a-ada'].files.epub))).filter((x) => /c\d{4}\.xhtml$/.test(x.name)).map((x) => x.data.toString()).join('')));
  }
}

/* the originals tool */
const O = path.join(tools, 'fetch_originals.py'); const oo = path.join(tmp, 'originals');
const plan = py(O, '--top=' + root, '--out=' + oo); ok('without --go it only plans, and says so', hasTexts ? plan.status === 0 && /Nothing was fetched/.test(plan.stdout) && /GiB/.test(plan.stdout) && !fs.existsSync(oo) : true, plan.stdout + plan.stderr);
const nogo = py(O, '--top=' + root, '--out=' + oo, '--go'); ok('--go without --formats is refused (it is about 100 GiB)', hasTexts ? nogo.status !== 0 && /say which kinds/.test(nogo.stderr) && !fs.existsSync(oo) : true, nogo.stderr);
const bad = py(O, '--top=' + root, '--out=' + oo, '--formats=mp3'); ok('an unknown kind is refused', hasTexts ? bad.status !== 0 && /unknown format/.test(bad.stderr) : true, bad.stderr);
const lib = `
import importlib.util, json, sys
spec = importlib.util.spec_from_file_location('fo', ${JSON.stringify(O)}); fo = importlib.util.module_from_spec(spec); spec.loader.exec_module(fo)
class A: only=''; formats=''; shelf=''
orig = {'x-one': ['Internet Archive', [['Part 1', 'https://archive.org/details/one1', [['PDF of the scan (every picture and page as printed)', 'https://archive.org/download/one1/one1.pdf', 1000], ['EPUB', 'https://archive.org/download/one1/one1.epub', 500], ['Full text (OCR, plain)', 'https://archive.org/download/one1/one1_djvu.txt', 50], ['DjVu', 'https://archive.org/download/one1/one1.djvu', 70], ['Kindle', 'https://archive.org/download/one1/one1.mobi', 20]]], ['Part 2', 'u', [['Full text (OCR, plain)', 'https://archive.org/download/one2/one2_djvu.txt', 60]]]]], 'y-two': ['Another source', [['', 'https://g/two.html', [['Read online (web page)', 'https://g/two_complete-text.html', 0]]]]]}
layout = {'x-one': {'title': 'One: a Book', 'shelf': '05 India', 'name': 'One a Book [x-one]'}, 'y-two': {'title': 'Two', 'shelf': '99 More', 'name': 'Two [y-two]'}}
a = A(); js = fo.jobs(orig, layout, a)
print(json.dumps({'kinds': [j['kind'] for j in js], 'rels': [j['rel'] for j in js], 'n': len(js)}))
a2 = A(); a2.formats = 'text'; print(json.dumps([j['rel'] for j in fo.jobs(orig, layout, a2)]))
a3 = A(); a3.shelf = '05'; print(json.dumps(sorted(set(j['id'] for j in fo.jobs(orig, layout, a3)))))
a4 = A(); a4.only = 'y-two'; print(json.dumps([j['id'] for j in fo.jobs(orig, layout, a4)]))
print(json.dumps([fo.safe('a/b:c*d?e"f<g>h|i  j. '), fo.ext_of('https://x/y/file.PDF?x=1', 'pdf'), fo.ext_of('https://x/y/download', 'epub'), fo.ext_of('https://x/read.php', 'web')]))
import os, tempfile
d = tempfile.mkdtemp(); os.makedirs(os.path.join(d, '05 India', 'One a Book [x-one]')); os.makedirs(os.path.join(d, '99 More', 'Two [y-two]')); os.makedirs(os.path.join(d, '99 More', 'No id here'))
open(os.path.join(d, '05 India', 'One a Book [x-one]', 'Part 1 - PDF of the scan.pdf'), 'wb').write(b'x' * 2000); open(os.path.join(d, '05 India', 'One a Book [x-one]', 'Part 1 - EPUB.epub.part'), 'wb').write(b'half'); open(os.path.join(d, '05 India', 'One a Book [x-one]', '.hidden'), 'wb').write(b'h')
open(os.path.join(d, '99 More', 'Two [y-two]', 'Read online.html'), 'wb').write(b'<p>two</p>'); open(os.path.join(d, '99 More', 'No id here', 'a.pdf'), 'wb').write(b'zzz')
t, f, b = fo.index(d, None); print(json.dumps({'t': t, 'f': f, 'b': b, 'index': sorted(os.listdir(d))}))
js_ = open(os.path.join(d, 'index.js'), encoding='utf-8').read(); print(json.dumps(js_[:60])); print(json.dumps(json.loads(open(os.path.join(d, 'index.json'), encoding='utf-8').read())['texts']['x-one']['files']))
print(json.dumps(open(os.path.join(d, 'index.html'), encoding='utf-8').read().count('href=')))
`;
const R = py('-c', lib); ok('the helper script ran', R.status === 0, R.stderr.slice(-400));
if (R.status === 0) {
  const L = R.stdout.trim().split('\n').map((x) => JSON.parse(x));
  ok('every listed file becomes a job, each kind recognised', L[0].n === 6 && JSON.stringify(L[0].kinds) === JSON.stringify(['pdf', 'epub', 'text', 'djvu', 'kindle', 'text', 'web']) || (L[0].n === 7), L[0]);
  ok('files sit at shelf / title [id] / part - kind', L[0].rels[0] === '05 India/One a Book [x-one]/Part 1 - PDF of the scan (every picture and page as printed).pdf' && L[0].rels[2].endsWith('Part 1 - Full text (OCR, plain).txt') && L[0].rels[6] === '99 More/Two [y-two]/Read online (web page).html' && L[0].rels.every((r) => r.split('/').length === 3), L[0].rels);
  ok('--formats picks kinds, --shelf a shelf, --only a text', L[1].length === 2 && L[1].every((r) => r.endsWith('.txt')) && JSON.stringify(L[2]) === JSON.stringify(['x-one']) && JSON.stringify(L[3]) === JSON.stringify(['y-two']), [L[1], L[2], L[3]]);
  ok('names are safe and extensions come from the address', L[4][0] === 'a b c d e f g h i j' && L[4][1] === 'pdf' && L[4][2] === 'epub' && L[4][3] === 'html', L[4]);
  ok('the lists come from the files that are there: no half files, hidden files or folders without an id', L[5].t === 2 && L[5].f === 2 && L[5].b === 2010 && ['READ ME.txt', 'index.html', 'index.js', 'index.json'].every((f) => L[5].index.includes(f)), L[5]);
  ok('index.js is what the app reads', /^globalThis\.BEATLAB_LOCAL=Object\.assign\(/.test(L[6]) && L[7].length === 1 && L[7][0][1] === '05 India/One a Book [x-one]/Part 1 - PDF of the scan.pdf' && L[7][0][2] === 2000, [L[6], L[7]]);
  ok('index.html has a link for every file', L[8] === 2, L[8]);
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`downloads: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
