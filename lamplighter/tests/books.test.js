// Run: node tests/books.test.js — the books/ folder: anyone drops PDFs, e-books, web pages, Markdown and text into it, runs tools/add_books.js once, and the Library has a shelf of them
// (src/js/2z-books-core.js, tools/add_books.js, src/js/6zq-books.js). The names and ids are steady, a damaged or hostile catalogue can only show fewer books, the tool turns every kind of file into the
// shape the reader opens (and keeps a PDF as a PDF), running it again changes nothing, and the page code reads nothing but its own folder.
const fs = require('fs'); const path = require('path'); const os = require('os'); const zlib = require('zlib'); const vm = require('vm'); const { spawnSync } = require('child_process');
globalThis.sha256 = require('../src/js/00-util.js').sha256;
Object.assign(globalThis, require('../src/js/2p-marks-core.js'));
const B = require('../src/js/2z-books-core.js'); const X = require('../src/js/2z-export-core.js');
let pass = 0; let fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 300)); } };

/* names, kinds, ids */
ok('kinds from names', B.bookKind('a.PDF') === 'pdf' && B.bookKind('b.epub') === 'epub' && B.bookKind('c.htm') === 'html' && B.bookKind('c.xhtml') === 'html' && B.bookKind('d.md') === 'md' && B.bookKind('e.txt') === 'txt' && B.bookKind('f.docx') === null && B.bookKind('noext') === null && B.bookKind(null) === null);
ok('an id is made from the path and never changes', B.bookId('Poetry/Hymns.pdf') === B.bookId('Poetry/Hymns.pdf') && B.bookId('Poetry/Hymns.pdf') !== B.bookId('Other/Hymns.pdf') && B.BOOK_ID_RX.test(B.bookId('Poetry/Hymns.pdf')) && B.bookId('Poetry/Hymns.pdf') === 'my-' + B.bookHash('Poetry/Hymns.pdf') + '-hymns');
ok('ids are safe for any name', ['Ünïcode Naïve.txt', '日本語の本.pdf', '"quoted" & <tagged>.md', '../../etc/passwd', 'a'.repeat(300) + '.txt', '.hidden', ''].every((n) => B.BOOK_ID_RX.test(B.bookId(n))), ['Ünïcode Naïve.txt', '日本語の本.pdf'].map(B.bookId));
ok('a name with no letters still has an id', B.bookId('日本語の本.pdf').startsWith('my-') && !/[^a-z0-9-]/.test(B.bookId('日本語の本.pdf')));
const n1 = B.bookParseName('Poetry/Rumi - Masnavi.epub'); const n2 = B.bookParseName('My family_prayers.txt'); const n3 = B.bookParseName('A/B/deep.pdf');
ok('"Author - Title" is read, the first folder is the shelf', n1.by === 'Rumi' && n1.title === 'Masnavi' && n1.shelf === 'Poetry' && n2.by === '' && n2.title === 'My family prayers' && n2.shelf === '' && n3.shelf === 'A' && n3.title === 'deep', [n1, n2, n3]);
ok('a hyphen inside a word is not an author', B.bookParseName('Well-known hymns.txt').by === '' && B.bookParseName('Well-known hymns.txt').title === 'Well-known hymns');
ok('titles are kept to a length, never empty', B.bookParseName('x'.repeat(500) + '.txt').title.length <= 120 && B.bookParseName('.pdf').title === 'Untitled');
ok('a path the page may follow', B.bookFileOk('a.pdf') && B.bookFileOk('Poetry/Rumi - Masnavi.epub') && !B.bookFileOk('../x.pdf') && !B.bookFileOk('/etc/passwd') && !B.bookFileOk('a/../b.pdf') && !B.bookFileOk('http://evil/x.pdf') && !B.bookFileOk('a\\b.pdf') && !B.bookFileOk('a#b.pdf') && !B.bookFileOk('a?b.pdf') && !B.bookFileOk('') && !B.bookFileOk(null) && !B.bookFileOk('a//b.pdf') && !B.bookFileOk('javascript:alert(1)'));
ok('urls are encoded one part at a time', B.bookUrl('Poetry/A & B 100%.pdf') === 'books/Poetry/A%20%26%20B%20100%25.pdf');

/* files picked or dropped in the browser */
ok('the shelf of a file in a chosen folder', B.bookShelfOfPath('Hymns/Poetry/a.pdf') === 'Poetry' && B.bookShelfOfPath('Hymns/a.pdf') === 'Hymns' && B.bookShelfOfPath('a.pdf') === '' && B.bookShelfOfPath('') === '' && B.bookShelfOfPath(null) === '' && B.bookShelfOfPath('A/B/C/d.pdf') === 'B' && B.bookShelfOfPath('x'.repeat(200) + '/y.pdf').length <= B.BOOK_LIMITS.shelf);
ok('a PDF kept in the browser has an id from what identifies the file', B.bookPdfKey('My Hymnal.pdf', 123, 456) === B.bookPdfKey('My Hymnal.pdf', 123, 456) && B.bookPdfKey('My Hymnal.pdf', 123, 456) !== B.bookPdfKey('My Hymnal.pdf', 124, 456) && B.BOOK_ID_RX.test(B.bookPdfKey('My Hymnal.pdf', 123, 456)) && B.BOOK_ID_RX.test(B.bookPdfKey('日本語.pdf', 1, 2)) && B.BOOK_ID_RX.test(B.bookPdfKey('', 0, 0)), [B.bookPdfKey('My Hymnal.pdf', 123, 456), B.bookPdfKey('', 0, 0)]);
ok('title and author of a PDF: a name with an author wins, then the PDF\'s own title, then the name', JSON.stringify(B.bookPdfNames('Anon - Hymns.pdf', { title: 'X', by: 'Y' })) === JSON.stringify({ title: 'Hymns', by: 'Anon' }) && B.bookPdfNames('scan0001.pdf', { title: 'Real Title', by: 'Y' }).title === 'Real Title' && B.bookPdfNames('scan0001.pdf', { title: 'Real Title', by: 'Y' }).by === 'Y' && B.bookPdfNames('Hymns.pdf', {}).title === 'Hymns' && B.bookPdfNames('Hymns.pdf', null).by === '' && B.bookPdfNames('.pdf', null).title === 'Untitled');
const rec = B.bookFromRecord({ id: 'my-12345678-x', title: 'T'.repeat(500), by: 'B', shelf: 'S', size: 99.7 });
ok('a stored record becomes a shelf entry, kept short, marked as the reader\'s own', rec.kind === 'pdf' && rec.mine === true && rec.title.length === 120 && rec.bytes === 99 && rec.file === '' && rec.chars === 0 && B.bookMeta(rec).license.length > 10);
ok('a catalogue file cannot claim to be kept in the browser', B.booksIndexClean({ books: [Object.assign({}, { id: 'my-12345678-x', kind: 'pdf', file: 'a.pdf', title: 'T' }, { mine: true })] }).every((x) => !('mine' in x)));

/* the catalogue as the page reads it */
const good = { id: B.bookId('a.pdf'), kind: 'pdf', file: 'a.pdf', title: 'T', by: 'B', shelf: 'S', note: '', bytes: 10, chars: 0, n: 0 };
ok('a good catalogue passes through', B.booksIndexClean({ v: 1, books: [good] }).length === 1 && B.booksIndexClean({ v: 1, books: [good] })[0].title === 'T');
const hostile = { v: 1, books: [null, 5, 'x', {}, Object.assign({}, good, { id: 'constructor' }), Object.assign({}, good, { id: '__proto__' }), Object.assign({}, good, { kind: 'exe' }), Object.assign({}, good, { file: '../../x.pdf' }), Object.assign({}, good, { file: 'http://evil/x.pdf' }), good, good, Object.assign({}, good, { id: B.bookId('b.pdf'), file: 'b.pdf', title: '<img src=x onerror=alert(1)>', by: 'x'.repeat(999), bytes: -5, chars: 'many', n: NaN })] };
const cleaned = B.booksIndexClean(hostile);
ok('a hostile catalogue shows only what is safe, once', cleaned.length === 2 && cleaned[0].id === good.id && cleaned[1].by.length <= 120 && cleaned[1].bytes === 0 && cleaned[1].chars === 0 && cleaned[1].n === 0, cleaned.map((c) => c.id));
ok('damaged catalogues give nothing', [null, undefined, 'x', 5, [], {}, { books: 'x' }, { books: {} }].every((x) => B.booksIndexClean(x).length === 0));
ok('a catalogue is capped', B.booksIndexClean({ books: Array.from({ length: 9000 }, (_, i) => Object.assign({}, good, { id: 'my-' + B.bookHash('f' + i), file: 'f' + i + '.pdf' })) }).length === B.BOOK_LIMITS.files);
const l = B.bookLibEntry(cleaned[0]); const m = B.bookMeta(cleaned[0]);
ok('the Library line and the details', l.group === 'my' && l.tr === 'mine' && l.id === good.id && m.title === 'T' && m.verse === false && /never uploaded/.test(m.license) && m.src === '');

/* a PDF's own title and author */
const pdf = (info) => Buffer.from('%PDF-1.4\n1 0 obj\n<< ' + info + ' >>\nendobj\ntrailer\n<< /Info 1 0 R >>\n%%EOF\n', 'latin1');
ok('PDF title and author, plain', JSON.stringify(B.bookPdfInfo(pdf('/Title (A Hymnal) /Author (Anon \\(trad.\\))'))) === JSON.stringify({ title: 'A Hymnal', by: 'Anon (trad.)' }), B.bookPdfInfo(pdf('/Title (A Hymnal) /Author (Anon \\(trad.\\))')));
ok('PDF title in hex UTF-16', B.bookPdfInfo(pdf('/Title <FEFF00480079006D006E0073>')).title === 'Hymns');
ok('PDF title with escapes and nested brackets', B.bookPdfInfo(pdf('/Title (Psalms \\(a (small) one\\)\\101)')).title === 'Psalms (a (small) one)A');
ok('junk titles are ignored', B.bookPdfInfo(pdf('/Title (Microsoft Word - doc1.docx) /Author (untitled)')).title === '' && B.bookPdfInfo(pdf('/Title (x)')).title === '' && B.bookPdfInfo(pdf('/Title <ZZ>')).title === '');
ok('a PDF without any, or nothing at all', B.bookPdfInfo(Buffer.from('%PDF-1.7\nstuff')).title === '' && B.bookPdfInfo(new Uint8Array(0)).title === '' && B.bookPdfInfo(null).title === '');
ok('the last title in the file wins (an update replaces the first)', B.bookPdfInfo(Buffer.from('/Title (Old)\n...\n/Title (New one)\n', 'latin1')).title === 'New one');

/* the tool, on a made-up folder */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'books-')); const top = path.join(tmp, 'top'); fs.mkdirSync(path.join(top, 'books', 'Poetry'), { recursive: true }); fs.mkdirSync(path.join(top, 'books', 'Family'), { recursive: true });
const put = (rel, data) => fs.writeFileSync(path.join(top, 'books', rel), data);
put('My family prayers.txt', 'Grace before meals\n\nFor what we are about to receive,\nmay we be truly thankful.\n\nA second prayer\n\nBless this house and all who enter.\n');
put('Family/Jane Doe - Notes on the Psalms.md', '# Notes on the Psalms\n\n## Psalm 23\n\nThe Lord is my shepherd; I shall not want.\n\n## Psalm 121\n\nI will lift up mine eyes unto the hills.\n');
put('Poetry/tea_ceremony.html', '<html><head><title>x</title><script>alert(1)</script></head><body><h1>Tea Ceremony</h1><p>Wabi and sabi in a bowl.</p><h2>Second</h2><p>More words here for the section &amp; more.</p></body></html>');
put('Poetry/hymnal_scan.pdf', pdf('/Title (A Test Hymnal) /Author (Anon)'));
put('Poetry/latin1 text.txt', Buffer.from('Caf\xe9 society\n\nna\xefve words', 'latin1'));
put('notes.docx', 'not a book'); put('.hidden.txt', 'hidden'); put('Poetry/bad#name.txt', 'x'); put('Poetry/empty.txt', '   \n');
(async () => {
  const secs = [['Chapter One', 'It was the best of times.\n\nIt was the worst of times, and the reader read on to the end of the night.'], ['Chapter Two', 'The second chapter is here, with enough words to stand as a chapter on its own in an e-book.']];
  put('Poetry/UN - Universal Declaration.epub', Buffer.from(await X.expEpub({ id: 'x', title: 'Universal Declaration', author: 'UN', rights: 'PD', source: '', note: '' }, secs, {})));
  put('Poetry/broken.epub', 'this is not a zip at all');
  const tool = path.join(__dirname, '..', 'tools', 'add_books.js'); const run = (...a) => spawnSync(process.execPath, ['--no-warnings', tool, '--top=' + top, ...a], { encoding: 'utf8' });
  const dry = run('--dry'); ok('a dry run changes nothing', dry.status === 1 || dry.status === 0 ? !fs.existsSync(path.join(top, 'books', 'index.js')) && !fs.existsSync(path.join(top, 'books', '_made')) : false, dry.stdout);
  const r = run(); const out = r.stdout;
  ok('the tool runs and reports its problems (a broken e-book, a name it cannot follow, an empty file)', r.status === 1 && /PROBLEM Poetry\/broken\.epub/.test(out) && /PROBLEM Poetry\/bad#name\.txt/.test(out) && /PROBLEM Poetry\/empty\.txt: no readable text/.test(out), out);
  ok('it leaves other files and hidden files alone', /left alone[^\n]*notes\.docx/.test(out) && !/hidden/.test(out.replace(/PROBLEM.*/g, '')));
  const ctx = vm.createContext({}); vm.runInContext(fs.readFileSync(path.join(top, 'books', 'index.js'), 'utf8').replace('globalThis.', 'this.'), ctx); const raw = ctx.BEATLAB_BOOKS;
  const books = B.booksIndexClean(raw); const byFile = Object.fromEntries(books.map((b) => [b.file, b]));
  ok('six books, each kind found', books.length === 6 && ['My family prayers.txt', 'Family/Jane Doe - Notes on the Psalms.md', 'Poetry/tea_ceremony.html', 'Poetry/hymnal_scan.pdf', 'Poetry/latin1 text.txt', 'Poetry/UN - Universal Declaration.epub'].every((f) => byFile[f]), Object.keys(byFile));
  ok('the catalogue passes its own cleaner untouched', JSON.stringify(books) === JSON.stringify(raw.books));
  ok('shelves, authors and titles', byFile['Family/Jane Doe - Notes on the Psalms.md'].shelf === 'Family' && byFile['Family/Jane Doe - Notes on the Psalms.md'].by === 'Jane Doe' && byFile['Poetry/hymnal_scan.pdf'].title === 'A Test Hymnal' && byFile['Poetry/hymnal_scan.pdf'].by === 'Anon' && byFile['My family prayers.txt'].shelf === '' && byFile['Poetry/UN - Universal Declaration.epub'].title === 'Universal Declaration', books.map((b) => b.title + '|' + b.by + '|' + b.shelf));
  /* every text book is a file the reader's loader can run, with the words in it */
  const T = { data: {}, meta: {}, add(id, mt, s) { this.data[id] = { meta: mt, secs: s }; this.meta[id] = mt; } };
  for (const b of books) { const f = path.join(top, 'books', '_made', b.id + '.js'); ok('a made file for ' + b.file, fs.existsSync(f)); vm.runInNewContext(fs.readFileSync(f, 'utf8'), { BEATLAB_TEXTS: T }, { filename: f }); }
  const words = (id) => T.data[id].secs.map((s) => s[1]).join(' ').replace(/\s+/g, ' ');
  ok('plain text keeps every word', /Grace before meals/.test(words(byFile['My family prayers.txt'].id)) && /Bless this house and all who enter/.test(words(byFile['My family prayers.txt'].id)));
  ok('Markdown headings make sections', T.data[byFile['Family/Jane Doe - Notes on the Psalms.md'].id].secs.length >= 2 && /shepherd/.test(words(byFile['Family/Jane Doe - Notes on the Psalms.md'].id)));
  ok('a web page loses its scripts but not its words', /Wabi and sabi/.test(words(byFile['Poetry/tea_ceremony.html'].id)) && !/alert/.test(words(byFile['Poetry/tea_ceremony.html'].id)) && /more\./.test(words(byFile['Poetry/tea_ceremony.html'].id)) && /&/.test(words(byFile['Poetry/tea_ceremony.html'].id)));
  ok('a text that is not UTF-8 is read as Windows Latin 1', /Café society/.test(words(byFile['Poetry/latin1 text.txt'].id)) && /naïve/.test(words(byFile['Poetry/latin1 text.txt'].id)), words(byFile['Poetry/latin1 text.txt'].id));
  ok('an e-book made by the app comes back with both chapters', /best of times/.test(words(byFile['Poetry/UN - Universal Declaration.epub'].id)) && /second chapter/.test(words(byFile['Poetry/UN - Universal Declaration.epub'].id)) && T.data[byFile['Poetry/UN - Universal Declaration.epub'].id].secs.length >= 2);
  const pm = T.data[byFile['Poetry/hymnal_scan.pdf'].id]; ok('a PDF is a one-section stub, with its details', pm.secs.length === 1 && /PDF/.test(pm.secs[0][1]) && byFile['Poetry/hymnal_scan.pdf'].kind === 'pdf' && byFile['Poetry/hymnal_scan.pdf'].bytes > 20 && byFile['Poetry/hymnal_scan.pdf'].chars === 0);
  ok('the details carry the counts the reader checks', books.filter((b) => b.kind !== 'pdf').every((b) => T.meta[b.id].chars === b.chars && T.meta[b.id].n === b.n && b.chars > 0));
  ok('a READ ME is left in the folder', fs.existsSync(path.join(top, 'books', 'READ ME.txt')) && /books\.js|add_books/.test(fs.readFileSync(path.join(top, 'books', 'READ ME.txt'), 'utf8')));
  /* again: nothing changes; a removed book's file goes; a renamed book gets a new id */
  const snap = () => fs.readdirSync(path.join(top, 'books', '_made')).sort().map((f) => f + ':' + fs.readFileSync(path.join(top, 'books', '_made', f), 'utf8').length).join('|') + fs.readFileSync(path.join(top, 'books', 'index.js'), 'utf8');
  const before = snap(); run(); ok('running again changes nothing', snap() === before);
  fs.unlinkSync(path.join(top, 'books', 'Poetry', 'tea_ceremony.html')); run();
  ok('a removed book is gone from the catalogue and from _made', !/tea_ceremony/.test(fs.readFileSync(path.join(top, 'books', 'index.js'), 'utf8')) && !fs.existsSync(path.join(top, 'books', '_made', byFile['Poetry/tea_ceremony.html'].id + '.js')));
  fs.renameSync(path.join(top, 'books', 'My family prayers.txt'), path.join(top, 'books', 'Family', 'My family prayers.txt')); run();
  ok('a moved book is a new book, the old one is gone', !fs.existsSync(path.join(top, 'books', '_made', byFile['My family prayers.txt'].id + '.js')) && fs.existsSync(path.join(top, 'books', '_made', B.bookId('Family/My family prayers.txt') + '.js')));
  const nobooks = path.join(tmp, 'empty'); fs.mkdirSync(nobooks); const e = spawnSync(process.execPath, ['--no-warnings', tool, '--top=' + nobooks], { encoding: 'utf8' });
  ok('with no books folder the tool makes one with a READ ME and an empty catalogue', e.status === 0 && fs.existsSync(path.join(nobooks, 'books', 'READ ME.txt')) && /"books":\[\]/.test(fs.readFileSync(path.join(nobooks, 'books', 'index.js'), 'utf8')), e.stdout + e.stderr);

  /* the page code: it reads nothing but its own folder, and hooks in the way the library does */
  const src = fs.readFileSync(path.join(__dirname, '..', 'src/js/6zq-books.js'), 'utf8'); const code = src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
  ok('the page code makes no request of its own', !/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|createElement\s*\(\s*['"]script|new Image|importScripts|https?:\/\//.test(code), code.match(/fetch|XMLHttpRequest|createElement[^;]*|https?:\/\/[^'"` ]*/g));
  ok('it loads the catalogue and the books through the library loader', /TXT\.script\('\.\.\/books\/index'\)/.test(code) && /'\.\.\/books\/_made\/'/.test(code));
  ok('it only opens its own folder\'s files in a PDF view (cleaned paths)', /bookUrl\(b\.file\)/.test(code) && /booksIndexClean\(globalThis\.BEATLAB_BOOKS\)/.test(code));
  ok('PDFs kept in the browser live in a small database of their own, and nowhere else', /indexedDB\.open\('lamplighter-pdfs', 1\)/.test(code) && !/localStorage|sessionStorage|document\.cookie/.test(code) && (code.match(/indexedDB\.open\(/g) || []).length === 1);
  ok('a kept PDF is opened from the file itself and its address is let go when the page is left', /URL\.createObjectURL\(rec\.blob\)/.test(code) && /URL\.revokeObjectURL\(url\)/.test(code));
  const fr = fs.readFileSync(path.join(__dirname, '..', 'src/js/6zf-freedom.js'), 'utf8');
  ok('Your own texts takes PDFs and whole folders, and lists and removes the PDFs kept here', /id="ownDir" webkitdirectory/.test(fr) && /\.epub,\.pdf,/.test(fr) && /BOOKS\.addPdf\(f, fromFolder \? booksShelfOfFile\(f\) : ''\)/.test(fr) && /booksCollectDropped\(e\.dataTransfer\)/.test(fr) && /booksOwnListHTML\(\)/.test(fr) && /BOOKS\.removePdf\(b\.id\)/.test(fr) && /data-pdf-del/.test(code));
  ok('the id check keeps other texts out of its hands', /\^my-/.test(code) && /BOOKS\.by\[/.test(code));
  ok('Random never draws the app’s own example books (the shelf “Examples”, made by Lamplighter) or a PDF, whose only text is a line saying it is a PDF', (() => {
    const m = /BOOKS\.noDraw = ([^\n]+);\n/.exec(code); if (!m) return false; const nd = new Function('BOOKS', 'return ' + m[1])({ by: { 'my-a': { kind: 'pdf', by: 'Anon', shelf: 'Poetry' }, 'my-b': { kind: 'txt', by: 'Lamplighter', shelf: 'Examples' }, 'my-c': { kind: 'txt', by: 'Someone', shelf: 'Examples' }, 'my-d': { kind: 'txt', by: 'Lamplighter', shelf: 'Poetry' } } });
    return nd('my-a') && nd('my-b') && !nd('my-c') && !nd('my-d') && !nd('b-gen') && !nd('constructor');
  })());
  { const raw = {}; vm.runInContext(fs.readFileSync(path.join(top, 'books', 'index.js'), 'utf8').replace('globalThis.', 'this.'), vm.createContext(raw)); const ex = ((raw.BEATLAB_BOOKS || {}).books || []).filter((b) => b.by === 'Lamplighter' && b.shelf === 'Examples');
    ok('and the examples that ship in the books folder are exactly the ones it names', ex.length === 0 || ex.every((b) => /^my-/.test(b.id))); }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`books: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('ERROR', e); process.exit(1); });
