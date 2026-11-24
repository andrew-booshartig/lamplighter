/* ═══════════════════════════ 2z · Books and PDFs in the books/ folder ═══════════════════════════
   Pure functions, no page in them (tests/books.test.js). A folder named books/ beside Lamplighter.html is a shelf anyone can add to: drop PDFs, e-books (.epub), web pages (.html), Markdown (.md)
   and plain text (.txt) into it, in folders if you like (each first folder is a shelf), then run `node tools/add_books.js` once. The tool writes books/index.js (this catalogue) and, for every
   book that is text, books/_made/<id>.js in the same shape as a library text, so the reader, its marks, search and Save all work on it. A PDF is listed and opened in the browser's own PDF viewer.
   The folder travels whole: copy books/ and every book comes with it. Nothing is uploaded; the page only ever reads its own folder.
   The catalogue is `globalThis.BEATLAB_BOOKS = { v: 1, books: [{ id, kind, file, title, by, shelf, note, bytes, chars, n }] }`; booksIndexClean makes sure a damaged or hostile one can only show fewer books. */
const BOOK_KINDS = ['pdf', 'epub', 'html', 'md', 'txt'];
const BOOK_LIMITS = { title: 120, by: 120, shelf: 60, note: 400, files: 5000 };
const BOOK_ID_RX = /^my-[0-9a-f]{8}(?:-[a-z0-9-]{1,18})?$/;
const bookStr = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f\u2028\u2029]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
/* what a file is, from its name */
function bookKind(name) {
  const n = String(name || '').toLowerCase();
  if (/\.pdf$/.test(n)) return 'pdf'; if (/\.epub$/.test(n)) return 'epub'; if (/\.(html?|xhtml)$/.test(n)) return 'html'; if (/\.(md|markdown)$/.test(n)) return 'md'; if (/\.(txt|text)$/.test(n)) return 'txt';
  return null;
}
/* a short number from a name: the same name always gives the same id, so marks and bookmarks stay with a book when the catalogue is made again */
function bookHash(s) {
  let h = 0x811c9dc5; const u = new TextEncoder().encode(String(s == null ? '' : s).normalize('NFC'));
  for (let i = 0; i < u.length; i++) { h ^= u[i]; h = Math.imul(h, 16777619) >>> 0; }
  return h.toString(16).padStart(8, '0');
}
const bookSlug = (s) => String(s == null ? '' : s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+/, '').slice(0, 18).replace(/-+$/, '');
/* the id of the book at a path inside books/ (forward slashes) */
function bookId(rel) {
  const base = String(rel == null ? '' : rel).split('/').pop().replace(/\.[A-Za-z0-9]{1,8}$/, ''); const slug = bookSlug(base);
  return 'my-' + bookHash(rel) + (slug ? '-' + slug : '');
}
/* "Author - Title.pdf" is read as an author and a title; any other name is the title. The first folder is the shelf. */
function bookParseName(rel) {
  const parts = String(rel == null ? '' : rel).split(/[\\/]+/).filter(Boolean); const file = parts.pop() || '';
  const shelf = parts.length ? bookStr(parts[0], BOOK_LIMITS.shelf) : '';
  const base = bookStr(file.replace(/\.[A-Za-z0-9]{1,8}$/, '').replace(/_+/g, ' '), 300);
  const m = /^(.{2,}?)\s+[-–—]\s+(.{2,})$/.exec(base);
  return { title: bookStr(m ? m[2] : base, BOOK_LIMITS.title) || 'Untitled', by: m ? bookStr(m[1], BOOK_LIMITS.by) : '', shelf };
}
/* a path the page may follow: inside books/, no ".." and no scheme */
const bookFileOk = (f) => typeof f === 'string' && f.length > 0 && f.length < 400 && !/^[\/\\]|[\\:?#]|(^|\/)\.\.?(\/|$)|[\u0000-\u001f]/.test(f) && !f.split('/').some((p) => !p);
const bookUrl = (file) => 'books/' + String(file).split('/').map(encodeURIComponent).join('/');
/* the catalogue as the page may use it */
function booksIndexClean(raw) {
  const list = raw && typeof raw === 'object' && Array.isArray(raw.books) ? raw.books : []; const seen = new Set(); const out = [];
  for (const b of list.slice(0, BOOK_LIMITS.files)) {
    if (!b || typeof b !== 'object') continue; const id = String(b.id || ''); if (!BOOK_ID_RX.test(id) || seen.has(id)) continue;
    if (!BOOK_KINDS.includes(b.kind) || !bookFileOk(b.file)) continue; seen.add(id);
    out.push({ id, kind: b.kind, file: b.file, title: bookStr(b.title, BOOK_LIMITS.title) || 'Untitled', by: bookStr(b.by, BOOK_LIMITS.by), shelf: bookStr(b.shelf, BOOK_LIMITS.shelf), note: bookStr(b.note, BOOK_LIMITS.note), bytes: Math.max(0, Math.floor(+b.bytes) || 0), chars: Math.max(0, Math.floor(+b.chars) || 0), n: Math.max(0, Math.floor(+b.n) || 0) });
  }
  return out;
}
/* the Library line and the text's details for a book */
const bookLibEntry = (b) => ({ id: b.id, title: b.title, group: 'my', when: b.shelf || 'Added by you', tr: 'mine' });
const bookMeta = (b) => ({ title: b.title, by: b.by || 'Added by you', license: 'A book you put in the books folder. Its rights are those of whoever holds them; it stays on this computer and is never uploaded.', src: '', verse: false, note: b.note || (b.kind === 'pdf' ? 'A PDF file. Open it to read it in your browser’s own PDF viewer.' : ''), n: b.n, chars: b.chars });
const bookShelves = (list) => Array.from(new Set(list.map((b) => b.shelf || ''))).sort((a, b) => (a === '' ? -1 : b === '' ? 1 : a.localeCompare(b)));

/* files picked or dropped in the browser (a folder gives each file a path such as "Hymns/Poetry/a.pdf"): the shelf is the folder it sits in below the one that was chosen, or that folder itself when there is only one level */
function bookShelfOfPath(path) {
  const segs = String(path == null ? '' : path).split('/').filter(Boolean); if (segs.length < 2) return '';
  return bookStr(segs.length >= 3 ? segs[1] : segs[0], BOOK_LIMITS.shelf);
}
/* a PDF kept in the browser: its id comes from what identifies the file (name, size, date), so adding the same file again is the same book */
const bookPdfKey = (name, size, mtime) => 'my-' + bookHash(String(name) + '|' + (Math.floor(+size) || 0) + '|' + (Math.floor(+mtime) || 0)) + (bookSlug(String(name).replace(/\.[A-Za-z0-9]{1,8}$/, '')) ? '-' + bookSlug(String(name).replace(/\.[A-Za-z0-9]{1,8}$/, '')) : '');
/* what a PDF's name and its own details make of its title and author (a file name of the form "Author - Title" wins; then the PDF's own title; then the name) */
function bookPdfNames(name, info) {
  const nm = bookParseName(name); const i = info || {};
  return { title: (nm.by || nm.title === 'Untitled' ? nm.title : (i.title || nm.title)) || 'Untitled', by: nm.by || i.by || '' };
}
/* the Library entry of a book kept in the browser, from its stored record */
const bookFromRecord = (r) => ({ id: r.id, kind: 'pdf', file: '', title: bookStr(r.title, BOOK_LIMITS.title) || 'Untitled', by: bookStr(r.by, BOOK_LIMITS.by), shelf: bookStr(r.shelf, BOOK_LIMITS.shelf), note: '', bytes: Math.max(0, Math.floor(+r.size) || 0), chars: 0, n: 0, mine: true });
/* the title and author a PDF names for itself (its Info dictionary), when it has a plain one: best effort, from the bytes alone, and null for a PDF that keeps them in a packed object */
function bookPdfInfo(u8) {
  if (!u8 || !u8.length) return { title: '', by: '' };
  const lat = (a) => { let s = ''; for (let i = 0; i < a.length; i += 8192) s += String.fromCharCode.apply(null, a.subarray(i, Math.min(a.length, i + 8192))); return s; };
  const text = lat(u8.subarray(Math.max(0, u8.length - 400000))) + '\n' + lat(u8.subarray(0, Math.min(u8.length, 200000)));
  const decode = (bytes) => {
    if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) { let s = ''; for (let i = 2; i + 1 < bytes.length; i += 2) s += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]); return s; }
    let s = ''; for (const c of bytes) s += String.fromCharCode(c); return s;
  };
  const grab = (key) => {
    const at = text.lastIndexOf('/' + key); if (at < 0) return ''; let i = at + key.length + 1; while (/\s/.test(text[i] || '')) i++;
    if (text[i] === '(') {
      const out = []; let depth = 1; i++;
      for (; i < text.length && depth > 0 && out.length < 2000; i++) {
        const c = text[i];
        if (c === '\\') { const d = text[++i]; if (d === 'n') out.push(10); else if (d === 'r') out.push(13); else if (d === 't') out.push(9); else if (d === 'b') out.push(8); else if (d === 'f') out.push(12); else if (/[0-7]/.test(d)) { let o = d; while (o.length < 3 && /[0-7]/.test(text[i + 1] || '')) o += text[++i]; out.push(parseInt(o, 8) & 255); } else if (d !== '\n' && d !== '\r') out.push(d.charCodeAt(0) & 255); }
        else if (c === '(') { depth++; out.push(40); } else if (c === ')') { depth--; if (depth > 0) out.push(41); } else out.push(c.charCodeAt(0) & 255);
      }
      return bookStr(decode(out), BOOK_LIMITS.title);
    }
    if (text[i] === '<' && text[i + 1] !== '<') { const j = text.indexOf('>', i); if (j < 0) return ''; const hex = text.slice(i + 1, j).replace(/\s+/g, ''); if (!/^[0-9a-fA-F]*$/.test(hex) || hex.length > 4000) return ''; const out = []; for (let k = 0; k + 1 < hex.length; k += 2) out.push(parseInt(hex.slice(k, k + 2), 16)); return bookStr(decode(out), BOOK_LIMITS.title); }
    return '';
  };
  const title = grab('Title'); const by = grab('Author');
  const sane = (s) => (s && s.length > 1 && !/^(untitled|microsoft word|\.pdf)/i.test(s) && !/\.(docx?|indd|tex|qxd|pmd|rtf)$/i.test(s) && !/[�]/.test(s) ? s : '');
  return { title: sane(title), by: sane(by) };
}
if (typeof module !== 'undefined' && module.exports) module.exports = { bookShelfOfPath, bookPdfKey, bookPdfNames, bookFromRecord, BOOK_KINDS, BOOK_LIMITS, BOOK_ID_RX, bookStr, bookKind, bookHash, bookSlug, bookId, bookParseName, bookFileOk, bookUrl, booksIndexClean, bookLibEntry, bookMeta, bookShelves, bookPdfInfo };
