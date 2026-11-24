/* ═══════════════════════════ 6zq · Books and PDFs: the books/ folder, and PDFs kept in this browser ═══════════════════════════
   Two ways onto the shelf "Your books and PDFs" in the Library, one list. (1) A folder named books/ beside this page (tools/add_books.js, 2z-books-core.js): its catalogue, books/index.js, is read once,
   and every book in it joins the Library. A book that is text opens in the reader like any library text (books/_made/<id>.js is loaded the way texts/<id>.js is), so marks, notes, search and Save work
   on it. (2) PDFs picked or dropped, alone or as a whole folder, on "Your own texts" (6zf-freedom.js): each is kept in this browser, in a small database of its own, and joins the same shelf. A PDF opens in
   the browser's own PDF viewer. When there is no books/ folder and no PDF kept, nothing here does anything. Nothing is fetched from anywhere but this page's own folder, and nothing is uploaded. */
const BOOKS_DB = {
  _open: null,
  open() {
    if (!BOOKS_DB._open) BOOKS_DB._open = new Promise((res, rej) => { try { const r = indexedDB.open('lamplighter-pdfs', 1); r.onupgradeneeded = () => { r.result.createObjectStore('pdfs', { keyPath: 'id' }); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error || new Error('this browser is not keeping files here')); } catch (e) { rej(e); } });
    return BOOKS_DB._open;
  },
  tx(mode, fn) { return BOOKS_DB.open().then((db) => new Promise((res, rej) => { const t = db.transaction('pdfs', mode); const rq = fn(t.objectStore('pdfs')); t.oncomplete = () => res(rq && rq.result); t.onerror = () => rej(t.error || new Error('storage failed')); t.onabort = () => rej(t.error || new Error('storage failed')); })); },
  all: () => BOOKS_DB.tx('readonly', (s) => s.getAll()), get: (id) => BOOKS_DB.tx('readonly', (s) => s.get(id)), put: (r) => BOOKS_DB.tx('readwrite', (s) => s.put(r)), del: (id) => BOOKS_DB.tx('readwrite', (s) => s.delete(id)),
};
const BOOKS = {
  list: [], by: Object.create(null), _p: null,
  /* read the catalogue (through the same loader that reads texts/index.js) and the PDFs kept here, and add them to the Library; once, and never an error */
  load() {
    if (!BOOKS._p) BOOKS._p = TXT.script('../books/index').then(() => BOOKS.register(booksIndexClean(globalThis.BEATLAB_BOOKS)), () => { /* no books folder: that is how it starts */ })
      .then(() => BOOKS_DB.all().then((rows) => BOOKS.register((rows || []).filter((r) => r && BOOK_ID_RX.test(r.id) && r.blob).map(bookFromRecord)), () => { /* no storage here */ }));
    return BOOKS._p;
  },
  register(list) {
    if (!list || !list.length) return;
    if (!TR.mine) TR.mine = { n: 'A book you put in the books folder beside this page, or a PDF you added.', q: '' };
    if (!LIB_GROUPS.some((g) => g[0] === 'my')) LIB_GROUPS.push(['my', 'Your books and PDFs']);
    if (!LIB_COLLECTIONS.some((c) => c[2].includes('my'))) LIB_COLLECTIONS.push(['Your books and PDFs', 'Books and PDFs you put in the books folder beside this page, and PDFs you added here. They stay on this computer; nothing is uploaded.', ['my']]);
    let added = 0;
    for (const b of list) {
      if (LIB_BY_ID[b.id]) continue;
      const l = bookLibEntry(b); LIB.push(l); LIB_BY_ID[b.id] = l; BEATLAB_TEXTS.meta[b.id] = Object.assign({}, bookMeta(b), BEATLAB_TEXTS.meta[b.id] || {}); BOOKS.by[b.id] = b; BOOKS.list.push(b); added++;
    }
    /* the Library draws its shelves as soon as it opens, which can be before this arrived: draw a page that lists them again, once */
    if (added) { try { if (typeof Router !== 'undefined' && typeof document !== 'undefined' && document.getElementById('main') && /^#\/path\/(library|passage|search|shelves|imagined)/.test(location.hash)) { const r = Router.render(); if (r && typeof r.catch === 'function') r.catch(() => {}); } } catch (e) { /* the page is not up yet: the first draw will have them */ } }
  },
  /* a PDF picked or dropped: kept in this browser (as the file itself), listed on the shelf. shelf: the folder it came in, or '' */
  async addPdf(file, shelf) {
    if (file.size > 300e6) throw new Error('is larger than 300 MB');
    const head = new Uint8Array(await file.slice(0, 200000).arrayBuffer()); const tail = new Uint8Array(await file.slice(Math.max(0, file.size - 400000)).arrayBuffer());
    let h = ''; for (let i = 0; i < Math.min(1024, head.length); i++) h += String.fromCharCode(head[i]);
    if (!h.includes('%PDF-')) throw new Error('does not look like a PDF');
    const u8 = new Uint8Array(head.length + tail.length); u8.set(head, 0); u8.set(tail, head.length);
    const names = bookPdfNames(file.name, bookPdfInfo(u8)); const rec = { id: bookPdfKey(file.name, file.size, file.lastModified), name: file.name, title: names.title, by: names.by, shelf: bookStr(shelf, BOOK_LIMITS.shelf), size: file.size, t: Date.now(), blob: file };
    await BOOKS_DB.put(rec); BOOKS.register([bookFromRecord(rec)]); return rec;
  },
  /* a book taken off the Library's lists and out of memory (its file, if it was a PDF kept here, is removed by removePdf, or by Setup → Your data, which removes the file and then calls this) */
  forget(id) {
    const i = LIB.findIndex((l) => l.id === id); if (i >= 0) LIB.splice(i, 1); delete LIB_BY_ID[id]; delete BEATLAB_TEXTS.meta[id]; delete BOOKS.by[id]; BOOKS.list = BOOKS.list.filter((x) => x.id !== id);
  },
  async removePdf(id) {
    const b = BOOKS.by[id]; if (!b || !b.mine) return; await BOOKS_DB.del(id); BOOKS.forget(id);
  },
};
/* Random never draws the app's own example books (the shelf "Examples", made by Lamplighter) or a PDF, whose only text is a line saying it is a PDF (6d-passage.js, psgNever) */
BOOKS.noDraw = (id) => { const b = BOOKS.by[id]; return !!b && (b.kind === 'pdf' || (b.by === 'Lamplighter' && b.shelf === 'Examples')); };
/* the Library asks for the index of texts when it opens: books come with it */
const booksIndexOrig = TXT.index;
TXT.index = function () { return booksIndexOrig.call(TXT).then((m) => BOOKS.load().then(() => m)); };
/* a book's own script is books/_made/<id>.js (the loader's folder is texts/, so the way there goes up and across) */
const booksScriptOrig = TXT.script; const booksUnloadOrig = TXT.unload;
TXT.script = function (name) { return BOOKS.by[name] && !BOOKS.by[name].mine ? booksScriptOrig.call(TXT, '../books/_made/' + name) : booksScriptOrig.call(TXT, name); };
TXT.unload = function (id) {
  booksUnloadOrig.call(TXT, id);
  if (BOOKS.by[id]) { delete TXT._scripts['../books/_made/' + id]; try { document.querySelectorAll('script[src$="_made/' + id + '.js"]').forEach((el) => el.remove()); } catch (e) { /* not in a page */ } }
};
if (typeof document !== 'undefined' && document.head && document.createElement) BOOKS.load();      /* at start, so the shelf is there when the Library opens */
const booksSize = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
/* a PDF: its own page, with the file one tap away and, if asked, shown right here */
async function booksPdfView(root, b) {
  const body = root.querySelector('#pbody'); if (!body) return; let url = b.mine ? '' : bookUrl(b.file); let name = '';
  const back = `<div class="small" style="margin-bottom:10px"><a href="#/path/library">← Library</a> · Your books and PDFs${b.shelf ? ' · ' + esc(b.shelf) : ''}</div>`;
  document.title = b.title + ' · Lamplighter';
  if (b.mine) {
    let rec = null; try { rec = await BOOKS_DB.get(b.id); } catch (e) { rec = null; } if (root.isConnected === false) return;
    if (!rec || !rec.blob) { body.innerHTML = `${back}<section class="card"><h2 style="font-size:24px">${esc(b.title)}</h2><div class="callout warn">${icon('warn')}<div>This PDF is no longer in this browser’s storage (the browser’s site data was cleared). Add the file again on <a href="#/path/own">Your own texts</a>.</div></div></section>`; return; }
    url = URL.createObjectURL(rec.blob); name = rec.name || 'book.pdf'; if (typeof pathOnLeave === 'function') pathOnLeave(() => URL.revokeObjectURL(url));
  }
  body.innerHTML = `${back}<section class="card"><h2 style="font-size:24px">${esc(b.title)}</h2>${b.by ? `<p class="t2" style="margin:2px 0 8px">${esc(b.by)}</p>` : ''}
      <p class="t2 small" style="max-width:62ch">A PDF file (${booksSize(b.bytes)}) ${b.mine ? 'kept in this browser' : 'from the books folder'}. It opens in your browser’s own PDF viewer, which has its own page controls and search. It stays on this computer; nothing is uploaded.</p>
      <div class="row"><a class="btn primary" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open the PDF ↗</a><button class="btn" type="button" id="bkShow">Show it here</button><a class="btn ghost" href="${esc(url)}" download="${esc(name)}">Save a copy</a></div>
      <div id="bkFrame"></div></section>`;
  const show = body.querySelector('#bkShow'); if (show) show.addEventListener('click', () => { const f = body.querySelector('#bkFrame'); if (f) f.innerHTML = `<iframe title="${esc(b.title)}" src="${esc(url)}" style="width:100%;height:78vh;border:1px solid var(--line);border-radius:8px;margin-top:12px"></iframe>`; show.hidden = true; });
}
const booksReadOrig = pathReadView;
pathReadView = function (root, id, query) {
  if (!/^my-/.test(String(id))) return booksReadOrig(root, id, query);
  BOOKS.load().then(() => { if (root.isConnected === false) return; const b = BOOKS.by[id]; if (b && b.kind === 'pdf') booksPdfView(root, b); else booksReadOrig(root, id, query); });
};
/* "Your own texts": the PDFs kept here, with Open and Remove */
function booksOwnListHTML() {
  const mine = BOOKS.list.filter((b) => b.mine); if (!mine.length) return '';
  return `<h2 style="font-size:18px;margin:18px 0 8px">Your PDFs <span class="muted small">(${mine.length})</span></h2><div class="grid auto-lg">${mine.map((b) => `<article class="card flat"><b>${esc(b.title)}</b><div class="small muted" style="margin:2px 0 8px">${b.by ? esc(b.by) + ' · ' : ''}${b.shelf ? esc(b.shelf) + ' · ' : ''}${booksSize(b.bytes)}</div><div class="row tight"><a class="btn sm primary" href="#/path/read/${esc(b.id)}">Open</a><button class="btn sm ghost" type="button" data-pdf-del="${esc(b.id)}">Remove</button></div></article>`).join('')}</div><p class="hint" style="margin-top:8px">A PDF is kept in this browser and is not part of Setup → Export all: keep the file itself.</p>`;
}
/* the files of a drop, with the files inside any folder dropped (the entries must be asked for before anything is awaited); each file knows its path in lampPath */
async function booksCollectDropped(dt) {
  const files = Array.from((dt && dt.files) || []); const items = dt && dt.items ? Array.from(dt.items) : [];
  const entries = items.map((i) => (i && i.webkitGetAsEntry ? i.webkitGetAsEntry() : null)).filter(Boolean);
  if (!entries.some((e) => e.isDirectory)) return files;
  const out = []; let left = 5000;
  const walk = async (en, path) => {
    if (left <= 0) return;
    if (en.isFile) { const f = await new Promise((res, rej) => en.file(res, rej)); try { Object.defineProperty(f, 'lampPath', { value: path + f.name }); } catch (e) { /* the path is only for the shelf */ } out.push(f); left--; }
    else if (en.isDirectory) { const rd = en.createReader(); let batch; do { batch = await new Promise((res, rej) => rd.readEntries(res, rej)); for (const c of batch) await walk(c, path + en.name + '/'); } while (batch.length && left > 0); }
  };
  for (const en of entries) await walk(en, '');
  return out;
}
const booksShelfOfFile = (f) => bookShelfOfPath(f.webkitRelativePath || f.lampPath || '');
