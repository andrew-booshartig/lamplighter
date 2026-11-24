#!/usr/bin/env node
/* Add books and PDFs: drop files in the books/ folder beside Lamplighter.html, run this once, open the page.

   books/                          the folder (made, with a short READ ME, if it is not there)
     My family prayers.txt         a file straight in books/ is on the shelf "Added by you"
     Poetry/                       the first folder a file sits in is its shelf
       Rumi - Masnavi.epub         "Author - Title" is read as an author and a title; any other name is the title
       Hymns.pdf                   a PDF is listed and opened in the browser's own PDF viewer
   books/index.js                  the catalogue the page reads (made by this tool; do not edit)
   books/_made/<id>.js             each text book turned into a library text, so the reader, search, marks and Save work on it (made by this tool)

   .txt, .md, .html and .epub files become texts (the same conversion as Setup's "add a text of your own", src/js/2z-own-core.js); .pdf files are kept as they are. Nothing is uploaded or fetched,
   and the books never leave the folder: copy books/ to take every book with you. Run again after adding, renaming or removing files: ids come from the file's path, so marks and bookmarks
   stay with a book that is only updated.

   Run:  node tools/add_books.js [--top=DIR] [--dry]
         --top=DIR  the project folder that holds Lamplighter.html (default: the folder above lamplighter/)       --dry  list what would be made and change nothing */
'use strict';
const fs = require('fs'); const path = require('path'); const zlib = require('zlib');
const SRC = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const opt = (n) => { const a = argv.find((x) => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : null; };
if (argv.includes('--help') || argv.includes('-h')) { console.log(fs.readFileSync(__filename, 'utf8').match(/\/\*([\s\S]*?)\*\//)[1].replace(/^ {3}/gm, '')); process.exit(0); }
const DRY = argv.includes('--dry');
const TOP = path.resolve(opt('top') || path.join(SRC, '..'));
const BOOKS = path.join(TOP, 'books'); const MADE = path.join(BOOKS, '_made');
const B = require(path.join(SRC, 'src/js/2z-books-core.js')); const O = require(path.join(SRC, 'src/js/2z-own-core.js'));

const README = `Your books and PDFs
===================

Put books here and they appear in the Library, on a shelf called "Your books and PDFs".

  What you can add     .pdf   .epub   .html   .md   .txt
  Shelves              the first folder a file is in names its shelf (Poetry/Hymns.pdf is on the shelf "Poetry")
  Names                "Author - Title.epub" is read as an author and a title; any other name is the title
  After adding         double-click  Add books.command  (beside Lamplighter.html), or run  node tools/add_books.js  (both need Node.js), then open Lamplighter.html again.
                       You can also add books without any tool: in the app, Texts -> My reading -> "Your own texts" takes files, PDFs and whole folders.

Text books (.txt .md .html .epub) open in the reader like any library text: you can highlight them, take notes, search them and save them as an e-book.
A PDF opens in your browser's own PDF viewer.

This folder travels whole: copy books/ and every book comes with it. Nothing is uploaded anywhere.
Only add books you have the right to keep and share. The files in _made/ and index.js are made by the tool; you can delete them and run it again.
`;

const walk = (dir, rel = '') => {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.name.startsWith('.') || (rel === '' && ['_made', 'index.js', 'READ ME.txt'].includes(e.name))) continue;
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) out.push(...walk(path.join(dir, e.name), r)); else if (e.isFile()) out.push(r);
  }
  return out;
};
const decodeText = (buf) => { let b = buf; if (b.length >= 3 && b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) b = b.subarray(3); try { return new TextDecoder('utf-8', { fatal: true }).decode(b); } catch (e) { return new TextDecoder('windows-1252').decode(b); } };

(async () => {
  if (!fs.existsSync(BOOKS)) { if (DRY) { console.log('no books/ folder in ' + TOP + ' (it would be made)'); return; } fs.mkdirSync(BOOKS, { recursive: true }); }
  if (!DRY && !fs.existsSync(path.join(BOOKS, 'READ ME.txt'))) fs.writeFileSync(path.join(BOOKS, 'READ ME.txt'), README, 'utf8');
  const files = walk(BOOKS); const catalog = []; const made = {}; const skipped = []; const problems = [];
  for (const rel of files) {
    const kind = B.bookKind(rel); if (!kind) { skipped.push(rel); continue; }
    if (!B.bookFileOk(rel)) { problems.push(rel + ': the name has a character the page cannot follow (a colon, backslash, ? or #): rename it'); continue; }
    const full = path.join(BOOKS, rel); const buf = fs.readFileSync(full); const id = B.bookId(rel); const nm = B.bookParseName(rel);
    let title = nm.title; let by = nm.by; let secs = null; let chars = 0; let note = '';
    try {
      if (kind === 'pdf') {
        const info = B.bookPdfInfo(buf); if (nm.title === 'Untitled' || (!nm.by && info.title)) title = info.title || title; if (!by) by = info.by;
        secs = [[title, 'This book is a PDF file. Open it from the Library; it opens in your browser’s own PDF viewer.']];
      } else if (kind === 'epub') {
        const u8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength); const list = O.ownZipList(u8);
        const read = async (name) => { const e = list.find((x) => x.name === name); if (!e) return null; return new TextDecoder('utf-8').decode(await O.ownZipRead(u8, e, (raw) => zlib.inflateRawSync(Buffer.from(raw)))); };
        const r = await O.ownEpubSections(list, read); secs = r.secs; chars = r.chars; if (!by) by = r.by || ''; if (nm.title === 'Untitled') title = r.title || title;
      } else {
        const r = O.ownFromText(decodeText(buf), kind, rel); secs = r.secs; chars = r.chars; if (nm.title === 'Untitled') title = r.title || title;
      }
    } catch (e) { problems.push(rel + ': ' + e.message); continue; }
    secs = (secs || []).map((s) => [O.ownStr(s[0], 140), String(s[1])]).filter((s) => s[1].trim());
    if (!secs.length) { problems.push(rel + ': no readable text found'); continue; }
    if (kind !== 'pdf' && chars > O.OWN_MAX_CHARS) { problems.push(rel + ': too long to keep as a text (' + chars + ' characters; the most is ' + O.OWN_MAX_CHARS + ')'); continue; }
    if (kind === 'pdf') chars = 0;
    const entry = { id, kind, file: rel, title: B.bookStr(title, B.BOOK_LIMITS.title) || 'Untitled', by: B.bookStr(by, B.BOOK_LIMITS.by), shelf: nm.shelf, note, bytes: buf.length, chars, n: kind === 'pdf' ? 0 : secs.length };
    if (catalog.some((c) => c.id === id)) { problems.push(rel + ': another file has the same id (rename one)'); continue; }
    catalog.push(entry); made[id] = { meta: B.bookMeta(entry), secs };
  }
  const bySh = {}; catalog.forEach((c) => { (bySh[c.shelf || 'Added by you'] = bySh[c.shelf || 'Added by you'] || []).push(c); });
  console.log(catalog.length + ' book' + (catalog.length === 1 ? '' : 's') + ' (' + catalog.filter((c) => c.kind === 'pdf').length + ' PDF, ' + catalog.filter((c) => c.kind !== 'pdf').length + ' text) on ' + Object.keys(bySh).length + ' shelf' + (Object.keys(bySh).length === 1 ? '' : 'es') + ' in ' + BOOKS);
  Object.keys(bySh).sort().forEach((s) => console.log('  ' + s + ': ' + bySh[s].map((c) => c.title + (c.kind === 'pdf' ? ' (PDF)' : '')).join('; ')));
  if (skipped.length) console.log('left alone (not a book type): ' + skipped.slice(0, 12).join(', ') + (skipped.length > 12 ? ' and ' + (skipped.length - 12) + ' more' : ''));
  problems.forEach((p) => console.log('PROBLEM ' + p));
  if (DRY) return;
  fs.mkdirSync(MADE, { recursive: true });
  const keep = new Set();
  for (const c of catalog) { keep.add(c.id + '.js'); const m = made[c.id]; fs.writeFileSync(path.join(MADE, c.id + '.js'), 'BEATLAB_TEXTS.add(' + JSON.stringify(c.id) + ',' + JSON.stringify(m.meta) + ',' + JSON.stringify(m.secs) + ');\n', 'utf8'); }
  for (const f of fs.readdirSync(MADE)) if (/^my-.*\.js$/.test(f) && !keep.has(f)) fs.unlinkSync(path.join(MADE, f));
  fs.writeFileSync(path.join(BOOKS, 'index.js'), 'globalThis.BEATLAB_BOOKS=' + JSON.stringify({ v: 1, books: catalog }) + ';\n', 'utf8');
  console.log('wrote books/index.js and ' + catalog.length + ' file' + (catalog.length === 1 ? '' : 's') + ' in books/_made/. Open Lamplighter.html: the books are in the Library, on "Your books and PDFs".');
  if (problems.length) process.exitCode = 1;
})();
