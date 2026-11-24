/* ═══════════════════════════ 6zn · The notebook: where the pages are kept, the NB API, and the page ═══════════════════════════
   Design note: NOTEBOOK.md. The pure part (Markdown, blocks, tags, clips, templates, the file shape, the list of notebooks) is 2z-notebook-core.js; tests/notebook.test.js.
   There are several notebooks (19 November 2026; before that there was one). Pages are kept in this browser's IndexedDB ('lamplighter-notebook', one record per page, the notebook it is in written on it as `nb`; a page with none is in My notebook, so
   every page made before there were several is still where it was) with a copy in memory. The list of notebooks and the small settings (the open notebook, which page collects clips in each, the last page opened) are in the app's own store
   ('notebook.books', 'notebook.settings'). A notebook's pages, tags, backlinks and search are its own; clips go to the Inbox of the open notebook.
   NB is what the rest of the app calls: NB.clip (the reader's Clip button), NB.open, NB.tags, NB.backlinks, NB.pages, NB.ready, NB.addMarkdown, NB.addThread, the notebooks (NB.books, createBook, renameBook, deleteBook, exportBook, importBook,
   movePage, copyPage) and for Setup's backup NB.dump, NB.restore, NB.wipe.
   The page is two columns and nothing else: the notebook and its pages on the left, the page on the right. A page is shown as a page; a click on a block turns that block into its Markdown, and a click away turns it back. Every change is saved. */
const NBS = {
  mem: new Map(), books: [], memOnly: false, why: '', error: '', pending: 0, _db: null, _load: null, _subs: [], sends: new Map(), sendSeq: 0,
  on(fn) { NBS._subs.push(fn); return () => { NBS._subs = NBS._subs.filter((f) => f !== fn); }; },
  emit(what) { NBS._subs.slice().forEach((f) => { try { f(what); } catch (e) { console.error(e); } }); },
  open() {
    if (!NBS._db) NBS._db = new Promise((res, rej) => {
      try {
        if (typeof indexedDB === 'undefined') throw new Error('This browser has no place to keep a notebook.');
        const r = indexedDB.open('lamplighter-notebook', 1);
        r.onupgradeneeded = () => { r.result.createObjectStore('pages', { keyPath: 'id' }); };
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error || new Error('This browser would not open its storage.')); r.onblocked = () => rej(new Error('Storage is blocked by another open copy of this page.'));
      } catch (e) { rej(e); }
    }).catch((e) => { NBS._db = null; throw e; });
    return NBS._db;
  },
  tx(mode, fn) { return NBS.open().then((db) => new Promise((res, rej) => { const t = db.transaction('pages', mode); const rq = fn(t.objectStore('pages')); t.oncomplete = () => res(rq ? rq.result : undefined); t.onerror = () => rej(t.error || new Error('storage error')); t.onabort = () => rej(t.error || new Error('This browser has no room to keep it, or does not allow it here (a private window?).')); })); },
  /* every page of every notebook, read once; if the browser will not open its storage the notebook still works, in memory, and says so. A page that has no notebook written on it (every page made before there were several) is in My notebook; nothing is written back here */
  load() {
    if (!NBS._load) NBS._load = (async () => {
      try { const rows = await NBS.tx('readonly', (s) => s.getAll()); nbCleanList(rows, Date.now()).forEach((r) => NBS.mem.set(r.id, r)); } catch (e) { NBS.memOnly = true; NBS.why = (e && e.message) || ''; }
      NBS.mend();
    })();
    return NBS._load;
  },
  /* the list of notebooks (kept in the app's own store) made to agree with the pages: My notebook when there is none, and a notebook for any page that names one the list lost, so no page is hidden */
  mend() {
    const r = nbBooksResolve(store.get('notebook.books', null), [...NBS.mem.values()], Date.now()); NBS.books = r.books;
    NBS.mem.forEach((p, id) => { if (!NBS.books.some((b) => b.id === p.nb)) NBS.mem.set(id, Object.assign({}, p, { nb: NBS.books[0].id })); });
    if (r.changed) NBS.saveBooks();
  },
  /* the list as it is kept: nothing is written while it is only My notebook under its own name (that is what no list means) */
  saveBooks() { const b = NBS.books; if (b.length === 1 && b[0].id === NB_MAIN && b[0].name === NB_MAIN_NAME) store.del('notebook.books'); else store.set('notebook.books', b); NBS.emit('books'); },
  book(id) { return NBS.books.find((b) => b.id === id) || null; },
  curId() { return nbCurOf(nbSettings(), NBS.books); },
  all() { return nbOrder([...NBS.mem.values()]); },
  count(book) { let n = 0; NBS.mem.forEach((p) => { if (p.nb === book) n++; }); return n; },
  /* a page written: held here at once, and in the browser's storage as soon as it can be. A page with no notebook stays where it was, or goes into the notebook that is open */
  async save(raw) {
    const prev = raw && NBS.mem.get(raw.id); const rec = nbClean(Object.assign({}, raw, { nb: raw && raw.nb ? raw.nb : prev ? prev.nb : NBS.curId() }), Date.now()); if (!rec) return null;
    if (!NBS.mem.has(rec.id) && (NBS.mem.size >= NB_LIMITS.total || NBS.count(rec.nb) >= NB_LIMITS.pages)) return null;
    NBS.mem.set(rec.id, rec); NBS.emit('change'); if (NBS.memOnly) return rec;
    NBS.pending++; NBS.emit('status');
    try { await NBS.tx('readwrite', (s) => s.put(rec)); NBS.error = ''; } catch (e) { NBS.error = (e && e.message) || 'The browser would not keep it.'; }
    NBS.pending--; NBS.emit('status'); return rec;
  },
  async remove(id) { NBS.mem.delete(id); NBS.emit('change'); if (NBS.memOnly) return; try { await NBS.tx('readwrite', (s) => s.delete(id)); } catch (e) { NBS.error = (e && e.message) || ''; } },
  /* every page of one notebook, in one go: how many were taken out */
  async removeBookPages(book) {
    const ids = [...NBS.mem.values()].filter((p) => p.nb === book).map((p) => p.id); ids.forEach((id) => NBS.mem.delete(id)); NBS.emit('change');
    if (!NBS.memOnly && ids.length) { try { await NBS.tx('readwrite', (s) => { ids.forEach((id) => s.delete(id)); }); } catch (e) { NBS.error = (e && e.message) || ''; } }
    return ids.length;
  },
  async clear() { NBS.mem.clear(); NBS.emit('change'); if (NBS.memOnly) return; try { await NBS.tx('readwrite', (s) => s.clear()); } catch (e) { /* nothing was there */ } },
  /* everything read again from the browser's storage (after something else changed it: Your data) */
  async reload() { NBS.mem.clear(); NBS.books = []; NBS._load = null; NBS._db = null; nbCache.clear(); await NBS.load(); NBS.emit('change'); },
};
const nbSettings = () => { const s = store.get('notebook.settings', {}); return s && typeof s === 'object' && !Array.isArray(s) ? s : {}; };
const nbSetting = (patch) => { const s = Object.assign({}, nbSettings(), patch); store.set('notebook.settings', s); return s; };
/* the page that collects the clips of a notebook: the one it names, if it is in that notebook, else that notebook's Inbox */
const nbCollectId = (book) => { const b = book || NBS.curId(); const id = nbCollectOf(nbSettings(), b); const p = id ? NBS.mem.get(id) : null; return p && p.nb === b ? id : nbInboxOf(b); };
/* the page for an id: the one kept, or (for an Inbox only) a new empty one that is kept the first time it is written */
const nbGet = (id) => NBS.mem.get(id) || (nbIsInbox(id) ? nbClean({ id, title: 'Inbox', body: '', c: Date.now(), u: Date.now() }, Date.now()) : null);
const nbDateLabel = (d) => (d || new Date()).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
function nbNewRec(tplId, title, book) {
  const t = nbTemplate(tplId, nbDateLabel()); const now = Date.now();
  return nbClean({ id: nbNewId(NBS.mem, now, randHex(3)), title: title != null ? title : (tplId === 'blank' ? '' : t.title), body: t.body, c: now, u: now, nb: book || NBS.curId() }, now);
}
/* what has been worked out about a page, kept while the page is as it is */
const nbCache = new Map();
function nbInfo(pg) { const key = pg.u + ':' + pg.body.length; let e = nbCache.get(pg.id); if (!e || e.key !== key) { e = { key, an: nbAnalyse(pg.body), refs: nbRefs(pg.body) }; nbCache.set(pg.id, e); } return e; }
const nbAllPages = () => [...NBS.mem.values()];
/* the pages of one notebook (the open one unless another is named) and, for tags and backlinks, only those */
const nbBookPages = (book) => nbPagesOf(nbAllPages(), book || NBS.curId());
const nbIndexNow = (book) => nbIndex(nbBookPages(book), (pg) => nbInfo(pg).an);
/* what to put in the question: the current station's own questions when the Journey is begun */
function nbStationQs() {
  try { if (typeof PATH === 'undefined' || typeof PATH_STATIONS === 'undefined') return []; const st = PATH.get(); if (!st.started) return []; const s = PATH_STATIONS[Math.min(st.cur, PATH_STATIONS.length - 1)]; return s && Array.isArray(s.q) ? s.q : []; } catch (e) { return []; }
}
const nbDay = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5);
const nbTitleLib = (id) => (typeof LIB_BY_ID !== 'undefined' && LIB_BY_ID[id] ? LIB_BY_ID[id].title : id);
/* a thread's passages as clips, each with a heading, and how they relate: a page of its own */
function nbThreadMd(t) {
  const out = []; if (t.note) out.push(nbNl(t.note));
  (t.items || []).forEach((it) => {
    const head = nbOneLine(it.label || nbTitleLib(it.tid), 100); out.push('### ' + nbEscMd(head));
    const c = nbClipMd({ id: it.tid, text: it.q, s: it.s, p: it.p, heading: it.sh, title: nbTitleLib(it.tid), note: it.note }); if (c) out.push(c);
  });
  if ((t.links || []).length) {
    const nm = (id) => { const it = t.items.find((x) => x.id === id); return it ? nbOneLine(it.label || nbTitleLib(it.tid), 60) : '?'; };
    out.push('## How they relate'); out.push(t.links.map((k) => '- **' + nbEscMd(nm(k.a)) + '** ↔ **' + nbEscMd(nm(k.b)) + '** (' + nbEscMd(typeof ECHO_KINDS !== 'undefined' && ECHO_KINDS[k.kind] ? ECHO_KINDS[k.kind].name : k.kind) + ')' + (k.note ? ': ' + nbEscMd(nbOneLine(k.note, 300)) : '')).join('\n'));
  }
  return out.join('\n\n');
}

/* ───────── the API ───────── */
/* a clip just made can be sent to another notebook from the toast that says where it went: what is needed to do it is held here for a while */
const nbSendKeep = (md, rec) => { const tok = ++NBS.sendSeq; NBS.sends.set(tok, { md, pageId: rec.id, nb: rec.nb }); if (NBS.sends.size > 12) NBS.sends.delete(NBS.sends.keys().next().value); return tok; };
/* where a clip goes: the page a caller names, else the page that collects clips in the notebook named (a.nb) or open */
function nbClipTarget(a) {
  const named = typeof a.to === 'string' && a.to ? NBS.mem.get(a.to) || (nbIsInbox(a.to) && NBS.book(nbInboxBook(a.to)) ? nbGet(a.to) : null) : null; if (named) return named;
  const bk = typeof a.nb === 'string' && NBS.book(a.nb) ? a.nb : NBS.curId(); return nbGet(nbCollectId(bk)) || nbGet(nbInboxOf(bk));
}
const nbBookNameOf = (id) => { const b = NBS.book(id); return b ? b.name : NB_MAIN_NAME; };
const nbPlural = (n, one, many) => n.toLocaleString() + ' ' + (n === 1 ? one : many || one + 's');
const NB = {
  ready: () => NBS.load(),
  /* the notebooks, with how many pages each holds, and which is open */
  async books() { await NBS.load(); const counts = nbBookCounts(nbAllPages()); const cur = NBS.curId(); return NBS.books.map((b) => ({ id: b.id, name: b.name, pages: counts.get(b.id) || 0, current: b.id === cur })); },
  async current() { await NBS.load(); const b = NBS.book(NBS.curId()); return { id: b.id, name: b.name }; },
  async setCurrent(id) { await NBS.load(); if (!NBS.book(id)) return false; if (NBS.curId() !== id) nbSetting({ cur: id }); NBS.emit('book'); return true; },
  async createBook(name, o) {
    await NBS.load(); const nm = nbBookName(name); if (!nm) return { ok: false, error: 'A notebook needs a name.' };
    if (NBS.books.length >= NB_LIMITS.books) return { ok: false, error: `You can have ${NB_LIMITS.books} notebooks at most.` };
    const now = Date.now(); const id = nbBookNew(new Set(NBS.books.map((b) => b.id)), now, randHex(2)); const book = { id, name: nbBookNameUnique(nm, NBS.books), c: now };
    NBS.books = NBS.books.concat([book]); NBS.saveBooks(); if (!(o && o.stay)) nbSetting({ cur: id }); return { ok: true, id, name: book.name };
  },
  async renameBook(id, name) {
    await NBS.load(); const b = NBS.book(id); const nm = nbBookName(name); if (!b || !nm) return { ok: false, error: 'A notebook needs a name.' };
    const unique = nbBookNameUnique(nm, NBS.books, id); NBS.books = NBS.books.map((x) => (x.id === id ? Object.assign({}, x, { name: unique }) : x)); NBS.saveBooks(); return { ok: true, name: unique };
  },
  /* a notebook and every page in it are deleted (never the last one: there is always a notebook); gives how many pages went */
  async deleteBook(id) {
    await NBS.load(); const b = NBS.book(id); if (!b) return { ok: false, error: 'That notebook is not here.' };
    if (NBS.books.length < 2) return { ok: false, only: true, error: 'This is your only notebook. Make another first, or rename this one.' };
    const pages = nbBookCounts(nbAllPages()).get(id) || 0; await NBS.removeBookPages(id); nbCache.clear();
    NBS.books = NBS.books.filter((x) => x.id !== id); NBS.saveBooks();
    let st = nbCollectPut(nbSettings(), id, ''); if (st.cur === id) st.cur = NBS.books[0].id; if (typeof st.last === 'string' && !NBS.mem.has(st.last) && !nbIsInbox(st.last)) delete st.last; store.set('notebook.settings', st);
    NBS.emit('book'); return { ok: true, pages };
  },
  /* one notebook as one file: the app's own JSON (its name, and every page with its id, title, words and times). Markdown files of its pages are exportAll */
  exportBook(id) {
    const b = NBS.book(id || NBS.curId()); if (!b) return false; const file = nbBookFile(b, nbAllPages(), Date.now());
    download(nbFileName(b.name + ' notebook ' + isoDay(), null, 'json'), JSON.stringify(file, null, 2), 'application/json'); return true;
  },
  /* a notebook file brought in as a new notebook of its own (never into one that is here): its name, a number after it if that name is used; pages keep their ids where free */
  async importBook(f, o) {
    const say = (m, k, ms) => { if (!(o && o.silent)) toast(m, k, ms); };
    try {
      await NBS.load(); if (!f || !(f.size <= NB_LIMITS.bookFile)) throw new Error('That file is too large to be a notebook.');
      let parsed; try { parsed = JSON.parse(await f.text()); } catch (e) { throw new Error('That file could not be read as a notebook.'); }
      const read = nbBookRead(parsed, Date.now()); if (!read.ok) throw new Error(read.error);
      if (NBS.books.length >= NB_LIMITS.books) throw new Error(`You can have ${NB_LIMITS.books} notebooks at most.`);
      if (NBS.mem.size + read.pages.length > NB_LIMITS.total) throw new Error('There is no room for that many more pages.');
      const now = Date.now(); const plan = nbBookPlan(read, NBS.books, new Set([...NBS.mem.keys()]), now, randHex(2));
      NBS.books = NBS.books.concat([plan.book]); NBS.saveBooks(); for (const r of plan.pages) await NBS.save(r); nbSetting({ cur: plan.book.id });
      say(`Brought in the notebook <b>${esc(plan.book.name)}</b> (${nbPlural(plan.pages.length, 'page')}).`, 'good', 4200); return { ok: true, id: plan.book.id, name: plan.book.name, pages: plan.pages.length };
    } catch (e) { say(esc((e && e.message) || 'That file could not be brought in.'), 'bad', 6000); return { ok: false, error: (e && e.message) || '' }; }
  },
  /* a page moved to another notebook (an Inbox cannot be moved), or copied there as a new page */
  async movePage(id, to) {
    await NBS.load(); const r = NBS.mem.get(id); if (!r || nbIsInbox(id) || !NBS.book(to) || r.nb === to) return { ok: false };
    if (NBS.count(to) >= NB_LIMITS.pages) return { ok: false, full: true };
    const saved = await NBS.save(Object.assign({}, r, { nb: to })); if (!saved) return { ok: false };
    const st = nbSettings(); if (nbCollectOf(st, r.nb) === id) store.set('notebook.settings', nbCollectPut(st, r.nb, '')); return { ok: true, pageId: id, nb: to };
  },
  async copyPage(id, to) {
    await NBS.load(); const r = nbGet(id); if (!r || !NBS.book(to) || (nbIsInbox(id) && !r.body.trim())) return { ok: false };
    if (NBS.count(to) >= NB_LIMITS.pages || NBS.mem.size >= NB_LIMITS.total) return { ok: false, full: true };
    const copy = nbCopyRec(r, to, NBS.mem, Date.now(), randHex(3)); const saved = copy && await NBS.save(copy); return saved ? { ok: true, pageId: saved.id, nb: to } : { ok: false };
  },
  /* the pages of the open notebook (or every notebook: { all: true }), the tags and the places a book is linked from, the same way */
  async pages(o) { await NBS.load(); const list = o && o.all ? NBS.all() : nbOrder(nbBookPages()); return list.map((r) => ({ id: r.id, title: nbTitleOf(r), updated: r.u, clips: nbInfo(r).refs.length, nb: r.nb })); },
  async tags(o) { await NBS.load(); return (o && o.all ? nbIndex(nbAllPages(), (pg) => nbInfo(pg).an) : nbIndexNow()).tags; },
  async backlinks(id, s, p, o) { await NBS.load(); return nbBacklinks(o && o.all ? nbAllPages() : nbBookPages(), id, s, p, (pg) => nbInfo(pg).refs); },
  /* a clip from a place in a book: the quotation and a citation that links back, added to the page that collects clips in the open notebook (its Inbox unless a page is marked), or to the page `to` names, or to the notebook `nb` names */
  async clip(c) {
    const a = c || {}; const silent = !!a.silent; const say = (m, k, ms) => { if (!silent) toast(m, k, ms); };
    const s = a.s != null ? a.s : typeof a.section === 'number' ? a.section : 0; const p = a.p != null ? a.p : a.paragraph; const heading = a.heading || a.sh || (typeof a.section === 'string' ? a.section : '');
    const clip = { id: a.id, text: a.text, s, p, heading, page: a.page, title: a.title || nbTitleLib(a.id), note: a.note };
    const md = nbClipMd(clip); if (!md) { say('There was nothing to clip.', 'bad', 2400); return { ok: false }; }
    await NBS.load();
    const rec = nbClipTarget(a); const name = nbTitleOf(rec); const bname = nbBookNameOf(rec.nb); const href = '#/notebook/' + encodeURIComponent(rec.id); const where = `<b>${esc(name)}</b> in <b>${esc(bname)}</b>`;
    if (nbHasClip(rec.body, clip)) { say(`That passage is already in ${where}. <a href="${href}">Open</a>`, '', 4200); return { ok: true, added: false, pageId: rec.id, title: name, nb: rec.nb, notebook: bname, href }; }
    const body = nbAppend(rec.body, md); if (body.length > NB_LIMITS.body) { say(`<b>${esc(name)}</b> is full (a page holds ${NB_LIMITS.body.toLocaleString()} characters). Choose another page to collect clips.`, 'bad', 5000); return { ok: false, full: true }; }
    const saved = await NBS.save(Object.assign({}, rec, { body, u: Date.now() }));
    if (!saved) { say('The clip could not be kept.', 'bad', 3000); return { ok: false }; }
    const tok = nbSendKeep(md, saved); say(`Clipped to ${where}. <a href="${href}">Open</a> · <button type="button" class="nbk-tlink" data-nbsend="${tok}">Change</button>`, 'good', 6400);
    return { ok: true, added: true, pageId: rec.id, title: name, nb: rec.nb, notebook: bname, href, send: tok };
  },
  /* a clip just made, taken out of where it went and put in another notebook (its collecting page, else its Inbox): `to` is { book } or { name } for a new notebook. If the words were changed where they were, they are copied and stay there too */
  async sendClip(tok, to) {
    await NBS.load(); const s = NBS.sends.get(+tok); if (!s) return { ok: false, gone: true };
    let bk = to && typeof to.book === 'string' ? to.book : ''; if (!bk && to && to.name) { const r = await NB.createBook(to.name, { stay: true }); if (!r.ok) { toast(esc(r.error), 'bad', 4000); return r; } bk = r.id; }
    if (!NBS.book(bk) || bk === s.nb) return { ok: false };
    const dest = nbGet(nbCollectId(bk)) || nbGet(nbInboxOf(bk)); const there = nbRemoveClip(dest.body, s.md) != null; const body = there ? dest.body : nbAppend(dest.body, s.md);
    if (body.length > NB_LIMITS.body) { toast(`<b>${esc(nbTitleOf(dest))}</b> is full.`, 'bad', 4000); return { ok: false, full: true }; }
    const saved = there ? dest : await NBS.save(Object.assign({}, dest, { body, u: Date.now() })); if (!saved) { toast('The clip could not be kept.', 'bad', 3000); return { ok: false }; }
    const from = NBS.mem.get(s.pageId); let moved = false; if (from) { const left = nbRemoveClip(from.body, s.md); if (left != null) { await NBS.save(Object.assign({}, from, { body: left, u: Date.now() })); moved = true; } }
    NBS.sends.delete(+tok); const href = '#/notebook/' + encodeURIComponent(saved.id);
    toast(`${moved ? 'Moved' : 'Copied'} to <b>${esc(nbTitleOf(saved))}</b> in <b>${esc(nbBookNameOf(bk))}</b>. <a href="${href}">Open</a>${moved ? '' : ' It had been changed where it was, so it is still there too.'}`, 'good', 5200);
    return { ok: true, moved, pageId: saved.id, nb: bk };
  },
  /* Markdown added to the end of a page (the page that collects clips in the open notebook, or the page `to` names), or as a new page called `title` when to is 'new' */
  async addMarkdown(md, o) {
    const a = o || {}; await NBS.load(); const text = nbNl(md).trim(); if (!text) return { ok: false }; const bk = typeof a.nb === 'string' && NBS.book(a.nb) ? a.nb : NBS.curId();
    let rec; if (a.to === 'new') { rec = nbNewRec('blank', nbTitleClean(a.title) || 'Untitled', bk); rec.body = nbJoin(nbBlocks(text)); } else { const r0 = nbClipTarget({ to: a.to, nb: bk }); rec = Object.assign({}, r0, { body: nbAppend(r0.body, text) }); }
    if (rec.body.length > NB_LIMITS.body) { if (!a.silent) toast(`<b>${esc(nbTitleOf(rec))}</b> is full (a page holds ${NB_LIMITS.body.toLocaleString()} characters).`, 'bad', 5000); return { ok: false, full: true }; }
    const saved = await NBS.save(Object.assign({}, rec, { u: Date.now() })); if (!saved) { if (!a.silent) toast(`A notebook holds ${NB_LIMITS.pages.toLocaleString()} pages at most.`, 'bad', 4000); return { ok: false }; }
    const href = '#/notebook/' + encodeURIComponent(saved.id); if (!a.silent) toast(`Added to <b>${esc(nbTitleOf(saved))}</b> in <b>${esc(nbBookNameOf(saved.nb))}</b>. <a href="${href}">Open</a>`, 'good', 5200); return { ok: true, pageId: saved.id, title: nbTitleOf(saved), nb: saved.nb, href };
  },
  addThread(t) { return NB.addMarkdown(nbThreadMd(t || {}), { to: 'new', title: (t && t.title) || 'Passage set' }); },
  /* NB.open(), NB.open(pageId), NB.open({ tag }), NB.open({ page, block }) */
  open(t) {
    let h = '#/notebook'; if (typeof t === 'string' && t) h += '/' + encodeURIComponent(t); else if (t && t.tag) h += '/tag/' + encodeURIComponent(String(t.tag).toLowerCase()); else if (t && t.page) h += '/' + encodeURIComponent(t.page) + (Number.isInteger(t.block) ? '?b=' + t.block : '');
    if (location.hash === h) Router.render(); else location.hash = h;
  },
  /* Setup's backup, restore and delete-everything: the dump is every page of every notebook (each says which); restore adds the pages of a backup and the notebooks it names, and replaces a page that has the same id; it never removes one.
     A page with no notebook written on it (a backup made before there were several) is put in My notebook */
  async dump() { await NBS.load(); return NBS.all().map((r) => ({ id: r.id, title: r.title, body: r.body, c: r.c, u: r.u, nb: r.nb })); },
  async restore(list) {
    await NBS.load(); const now = Date.now(); const recs = nbCleanList(list, now); let n = 0;
    NBS.books = nbBooksMerge(NBS.books, store.get('notebook.books', null)); NBS.books = nbBooksResolve(NBS.books, recs, now).books;
    for (const rec of recs) { if (await NBS.save(rec)) n++; }
    NBS.books = nbBooksResolve(NBS.books, nbAllPages(), now).books; NBS.saveBooks(); return n;
  },
  async wipe() { await NBS.load(); await NBS.clear(); nbCache.clear(); NBS.sends.clear(); store.del('notebook.settings'); store.del('notebook.books'); NBS.books = []; NBS.mend(); },
  reload: () => NBS.reload(),
  exportPage(id) { const r = NBS.mem.get(id); if (!r) return false; download(nbFileName(nbTitleOf(r), null), nbToMd(r), 'text/markdown;charset=utf-8'); return true; },
  /* the pages of a notebook (the open one unless `book` is given) as Markdown: one file, or a zip of them */
  async exportAll(book) {
    await NBS.load(); const all = nbOrder(nbPagesOf(nbAllPages(), book || NBS.curId())).filter((r) => !nbIsInbox(r.id) || r.body.trim()); if (!all.length) { toast('There is nothing to export yet.', '', 2400); return false; }
    if (all.length === 1) return NB.exportPage(all[0].id);
    const used = new Set(); const files = all.map((r) => ({ name: nbFileName(nbTitleOf(r), used), data: nbToMd(r) }));
    download('lamplighter-notebook-' + isoDay() + '.zip', await expZip(files), 'application/zip'); return true;
  },
  /* pages from files into the open notebook: .md, .markdown and .txt, or a zip of them; nothing here is ever replaced */
  async importFiles(files) {
    await NBS.load(); const now = Date.now(); const incoming = []; let skippedFiles = 0; const bk = NBS.curId();
    for (const f of Array.from(files || [])) {
      if (!f || f.size > NB_LIMITS.file * 40) { skippedFiles++; continue; }
      try {
        if (/\.zip$/i.test(f.name)) {
          const buf = new Uint8Array(await f.arrayBuffer()); const list = ownZipList(buf).filter((e) => /\.(md|markdown|txt)$/i.test(e.name) && !/(^|\/)(__MACOSX|\.)/.test(e.name) && e.size <= NB_LIMITS.file);
          for (const e of list.slice(0, NB_LIMITS.pages)) incoming.push(nbFromMd(new TextDecoder('utf-8').decode(await ownZipRead(buf, e, ownInflate)), e.name, now));
        } else if (/\.(md|markdown|txt)$/i.test(f.name) && f.size <= NB_LIMITS.file) incoming.push(nbFromMd(await f.text(), f.name, now)); else skippedFiles++;
      } catch (e) { skippedFiles++; }
    }
    const plan = nbPlanImport(nbBookPages(bk), incoming, now, randHex(2), NBS.mem.keys()); for (const r of plan.add) await NBS.save(Object.assign({}, r, { nb: bk }));
    const bits = [`${plan.add.length} page${plan.add.length === 1 ? '' : 's'} added to ${esc(nbBookNameOf(bk))}`]; if (plan.skipped) bits.push(`${plan.skipped} already here`); if (skippedFiles) bits.push(`${skippedFiles} file${skippedFiles === 1 ? '' : 's'} could not be read`);
    toast(bits.join('; ') + '.', plan.add.length ? 'good' : '', 4200); return { added: plan.add.length, skipped: plan.skipped, unreadable: skippedFiles };
  },
};

/* ───────── the page ───────── */
let nbkFilter = '';      /* the words in the list's search box, kept while moving from page to page */
let nbkAll = false;      /* the list and its search take in every notebook, not only the open one */
const nbpDecode = (s) => { try { return decodeURIComponent(String(s == null ? '' : s)); } catch (e) { return String(s == null ? '' : s); } };
const nbpTyping = (el) => !!(el && el.closest && el.closest('input,textarea,select,[contenteditable="true"]'));
function nbpRoute(parts) {
  const a = parts && parts[0]; if (!a) return { view: 'list' }; if (a === 'new') return { view: 'new' };
  if (a === 'tag') return { view: 'tag', tag: nbpDecode(parts[1]).toLowerCase() }; return { view: 'page', id: nbpDecode(a) };
}
const nbpRowHtml = (r, cur, showBook) => { const n = nbInfo(r).refs.length; const on = r.id === cur; return `<a class="nbk-row${on ? ' on' : ''}" href="#/notebook/${encodeURIComponent(r.id)}"${on ? ' aria-current="page"' : ''}><span class="nbk-row-main"><span class="nbk-row-t">${esc(nbTitleOf(r))}</span>${showBook ? `<span class="nbk-row-b">${esc(nbBookNameOf(r.nb))}</span>` : ''}</span>${n ? `<span class="nbk-row-n" title="${n} clip${n === 1 ? '' : 's'}">${n}</span>` : ''}</a>`; };
/* the pages of the open notebook (its Inbox always), or of every notebook when the search is set to take them all in */
function nbpListHtml(cur, book) {
  let have; if (nbkAll) have = nbAllPages().filter(nbCountable); else { have = nbBookPages(book); const ib = nbInboxOf(book); if (!have.some((r) => r.id === ib)) have.push(nbGet(ib)); }
  const q = nbkFilter.trim(); const rows = q ? nbSearch(have, q) : nbOrder(have);
  if (!rows.length) return `<p class="nbk-none">${nbkAll ? 'No page in any notebook has those words.' : 'No page has those words.'}${q[0] === '#' ? '' : ' Press Enter to look for a tag.'}</p>`;
  const bare = !q && !nbkAll && !nbBookPages(book).some((r) => !nbIsInbox(r.id) || r.body.trim());      /* nothing written yet: a phone shows this list first and no page, so the list says how to begin */
  return `<div class="nbk-list">${rows.map((r) => nbpRowHtml(r, cur, nbkAll)).join('')}</div>${bare ? '<p class="nbk-hint nbk-railhint">Nothing here yet. Select words in any text and choose <b>Clip to notebook</b>, or press + above to start a page.</p>' : ''}`;
}
function nbpTagsHtml(cur) {
  const tags = nbIndexNow().tags; if (!tags.length) return '<p class="nbk-hint nbk-taghint">Type #word anywhere on a page to tag it.</p>'; const row = (t) => `<a class="nbk-row nbk-tagrow${cur === t.tag ? ' on' : ''}" href="#/notebook/tag/${encodeURIComponent(t.tag)}"${cur === t.tag ? ' aria-current="page"' : ''}><span class="nbk-row-t">#${esc(t.tag)}</span><span class="nbk-row-n" title="${t.count} clip${t.count === 1 ? '' : 's'} and notes in ${t.pages} page${t.pages === 1 ? '' : 's'}">${t.count}</span></a>`;
  return `<h3 class="nbk-label">Tags</h3><div class="nbk-list">${tags.slice(0, 12).map(row).join('')}${tags.length > 12 ? `<details class="nbk-more"><summary>${tags.length - 12} more</summary>${tags.slice(12).map(row).join('')}</details>` : ''}</div>`;
}
/* the places the older parts of the app keep what was gathered; shown only when the place's own tabs do not already lead to them */
function nbpReadingHtml() {
  try {
    const loc = typeof secLocate === 'function' ? secLocate('path/marks') : null; if (loc && loc.sec.id === 'notebook') return '';
    const tot = typeof MARKS !== 'undefined' ? MARKS.totals() : { hl: 0, bm: 0 }; const th = typeof THREADS !== 'undefined' ? THREADS.all().length : 0;
    const row = (href, name, n) => `<a class="nbk-row" href="${href}"><span class="nbk-row-t">${name}</span>${n ? `<span class="nbk-row-n">${n}</span>` : ''}</a>`;
    return `<h3 class="nbk-label">From my reading</h3><div class="nbk-list">${row('#/path/marks?k=hl', 'Highlights and notes', tot.hl)}${row('#/path/marks?k=bm', 'Bookmarks', tot.bm)}${row('#/path/threads', 'Passage sets', th)}</div>`;
  } catch (e) { return ''; }
}
const nbpMenuItem = (act, label, o) => `<button type="button" class="nbk-mi" role="menuitem" data-act="${act}"${o && o.on ? ' aria-checked="true"' : ''}${o && o.disabled ? ' disabled' : ''}>${o && o.on != null ? `<span class="nbk-tick" aria-hidden="true">${o.on ? '✓' : ''}</span>` : ''}${esc(label)}</button>`;

/* a dialog that asks which notebook: one of the others, or a new one with a name. Gives { book } or { name }, or null when it is cancelled */
async function nbpChoose(o) {
  const others = NBS.books.filter((b) => b.id !== o.exclude); const counts = nbBookCounts(nbAllPages()); const room = NBS.books.length < NB_LIMITS.books;
  if (!others.length && !room) { toast('There is no other notebook to choose.', '', 2600); return null; }
  const rows = others.map((b, i) => `<label class="nbk-pickrow"><input type="radio" name="nbkPick" value="${esc(b.id)}"${i === 0 ? ' checked' : ''}><span class="nbk-pick-t">${esc(b.name)}</span><span class="nbk-pick-n">${nbPlural(counts.get(b.id) || 0, 'page')}</span></label>`).join('');
  const fresh = room ? `<label class="nbk-pickrow"><input type="radio" name="nbkPick" value="__new"${others.length ? '' : ' checked'}><span class="nbk-pick-t">A new notebook</span><input class="input nbk-pickname" id="nbkPickName" type="text" maxlength="${NB_LIMITS.bookName}" placeholder="Name" aria-label="Name of the new notebook" autocomplete="off"></label>` : '';
  const pm = modal({ title: o.title, html: `${o.intro ? `<p class="small t2">${o.intro}</p>` : ''}<div class="nbk-pick" role="radiogroup" aria-label="Notebook">${rows}${fresh}</div>`, actions: [{ label: 'Cancel', kind: 'ghost', value: null }, { label: o.ok || 'Choose', kind: 'primary', collect: (b) => { const r = b.querySelector('input[name="nbkPick"]:checked'); if (!r) return null; if (r.value === '__new') return { name: ((b.querySelector('#nbkPickName') || {}).value || '').trim() || 'New notebook' }; return { book: r.value }; } }] });
  const nm = document.getElementById('nbkPickName'); if (nm) nm.addEventListener('focus', () => { const r = nm.closest('label').querySelector('input[type=radio]'); if (r) r.checked = true; });
  return (await pm) || null;
}
/* asks for a name (a new notebook, a rename): the name, or null */
async function nbpAsk(o) {
  const pm = modal({ title: o.title, html: `<label class="small t2" for="nbkAskName">${o.label}</label><input class="input nbk-askname" id="nbkAskName" type="text" maxlength="${NB_LIMITS.bookName}" value="${esc(o.value || '')}" autocomplete="off" spellcheck="true" style="width:100%;margin-top:6px">`, actions: [{ label: 'Cancel', kind: 'ghost', value: null }, { label: o.ok, kind: 'primary', collect: (b) => ((b.querySelector('#nbkAskName') || {}).value || '').trim() || null }] });
  const inp = document.getElementById('nbkAskName'); if (inp) { inp.focus(); inp.select(); inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); const ok = inp.closest('.modal').querySelector('button.primary'); if (ok) ok.click(); } }); }
  return (await pm) || null;
}
/* deleting a notebook: says how many pages go, offers to export it first, asks once more. Gives true when it is gone */
async function nbpDeleteBook(id) {
  const b = NBS.book(id); if (!b) return false;
  if (NBS.books.length < 2) { toast('This is your only notebook, so it cannot be deleted. Make another first, or rename this one.', '', 5200); return false; }
  const pages = nbBookCounts(nbAllPages()).get(id) || 0; const clips = nbBookPages(id).reduce((n, r) => n + nbInfo(r).refs.length, 0);
  const pm = modal({ title: `Delete “${esc(b.name)}”?`, html: `<p>The notebook <b>${esc(b.name)}</b> will be deleted from this browser, with ${pages ? `its ${nbPlural(pages, 'page')}${clips ? ` and ${nbPlural(clips, 'clip')}` : ''}` : 'nothing in it'}. This cannot be undone.</p><p class="small t2">Export saves it as one .json file that this app can read back (this notebook’s menu, Import a notebook file).</p><p><button type="button" class="btn sm" id="nbkDelExport">${icon('download')}Export this notebook first</button></p>`, actions: [{ label: 'Cancel', kind: 'ghost', value: false }, { label: 'Delete notebook', kind: 'danger', value: true }] });
  const ex = document.getElementById('nbkDelExport'); if (ex) ex.addEventListener('click', () => { NB.exportBook(id); ex.textContent = 'Saved: look in your downloads'; ex.disabled = true; });
  if (!(await pm)) return false;
  const r = await NB.deleteBook(id); if (!r.ok) { toast(esc(r.error || 'It could not be deleted.'), 'bad', 4000); return false; }
  toast(`Deleted <b>${esc(b.name)}</b>${r.pages ? ` and its ${nbPlural(r.pages, 'page')}` : ''}.`, '', 3200); return true;
}
/* the “Change” in the toast that says where a clip went: choose another notebook, and the clip is sent there */
async function nbpSendClip(tok) {
  const s = NBS.sends.get(+tok); if (!s) { toast('That clip can no longer be sent from here. Open its page and use Move to another notebook.', '', 4200); return; }
  const pick = await nbpChoose({ title: 'Send this clip to…', exclude: s.nb, ok: 'Send', intro: `It leaves ${esc(nbBookNameOf(s.nb))} and goes to the page that collects clips in the notebook you choose (its Inbox unless you set another).` }); if (!pick) return;
  await NB.sendClip(tok, pick);
}
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') document.addEventListener('click', (e) => { const b = e.target && e.target.closest && e.target.closest('[data-nbsend]'); if (b) { e.preventDefault(); nbpSendClip(b.dataset.nbsend); } });
/* the open notebook is shown again: the list, or the page of the address */
const nbpGoList = () => { if (location.hash === '#/notebook') Router.render(); else location.hash = '#/notebook'; };

Pages.notebook = {
  async mount(root, parts, query) {
    const route = nbpRoute(parts); const loc = typeof secLocate === 'function' ? secLocate('notebook') : null; const ownTabs = typeof SEC_PLAIN !== 'undefined' && SEC_PLAIN.includes('notebook');
    const head = loc ? secHeadHTML(loc, { compact: true }) + (ownTabs ? '' : secNavHTML(loc, { lab: !!Settings.get('showLab') })) : '';
    root.innerHTML = `${head}<div class="nbk" id="nbk" data-view="${route.view === 'list' ? 'list' : 'page'}"><nav class="nbk-rail" id="nbkRail" aria-label="Notebook pages"></nav><section class="nbk-main" id="nbkMain"></section></div>`;
    const host = root.querySelector('#nbk'); const rail = root.querySelector('#nbkRail'); const main = root.querySelector('#nbkMain');
    await NBS.load();
    let alive = true; const cleanups = [];
    const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); cleanups.push(() => t.removeEventListener(ev, fn, o)); };

    /* which page is open: the one asked for; with no page asked for, the last one opened (a phone shows the list instead) */
    let rec = null; let blocks = []; let editing = -1; let dirty = false; let saveTimer = 0; let menuOpen = '';
    if (query && typeof query.nb === 'string' && NBS.book(query.nb) && query.nb !== NBS.curId()) nbSetting({ cur: query.nb });      /* #/notebook?nb=<id> opens that notebook */
    if (route.view === 'page') { rec = nbGet(route.id); if (rec && NBS.book(rec.nb) && rec.nb !== NBS.curId()) nbSetting({ cur: rec.nb }); }      /* a page of another notebook opens that notebook */
    const bookId = NBS.curId(); const book = NBS.book(bookId) || { id: bookId, name: NB_MAIN_NAME };
    if (route.view === 'list') { const last = nbSettings().last; const lp = typeof last === 'string' ? nbGet(last) : null; rec = lp && lp.nb === bookId ? lp : null; if (!rec) { const all = nbOrder(nbBookPages(bookId)).filter((r) => !nbIsInbox(r.id) || r.body.trim()); rec = all[0] || null; } }
    if (rec) blocks = nbBlocks(rec.body);
    const curId = rec ? rec.id : '';

    /* ── the notebook and its list of pages on the left ── */
    const drawRail = () => {
      const counts = nbBookCounts(nbAllPages());
      rail.innerHTML = `<div class="nbk-books"><span class="nbk-menuwrap nbk-bkwrap"><button class="nbk-bk" type="button" id="nbkBookBtn" aria-haspopup="menu" aria-expanded="false" aria-label="Notebook: ${esc(book.name)}. Choose another notebook" title="Choose a notebook"><span class="nbk-bk-name">${esc(book.name)}</span><span class="nbk-bk-n" aria-hidden="true">${counts.get(bookId) || 0}</span>${icon('chevron')}</button>
          <div class="nbk-menu nbk-bookmenu" id="nbkBookMenu" role="menu" aria-label="Notebooks" hidden>${NBS.books.map((b) => `<button type="button" class="nbk-mi nbk-bkrow" role="menuitemradio" aria-checked="${b.id === bookId}" data-book="${esc(b.id)}"><span class="nbk-tick" aria-hidden="true">${b.id === bookId ? '✓' : ''}</span><span class="nbk-bk-t">${esc(b.name)}</span><span class="nbk-bk-c" title="${nbPlural(counts.get(b.id) || 0, 'page')}">${counts.get(b.id) || 0}</span></button>`).join('')}<hr class="nbk-sep">${nbpMenuItem('new-book', 'New notebook…', { disabled: NBS.books.length >= NB_LIMITS.books })}</div></span>
        <span class="nbk-menuwrap"><button class="nbk-ib" type="button" id="nbkRailBtn" aria-haspopup="menu" aria-expanded="false" aria-label="This notebook: rename, export, import, delete" title="This notebook">${icon('more')}</button><div class="nbk-menu" id="nbkRailMenu" role="menu" hidden>${nbpMenuItem('rename-book', 'Rename this notebook…')}${nbpMenuItem('export-book', 'Export this notebook (one .json file)')}${nbpMenuItem('export-all', 'Export its pages as Markdown files (.zip)')}${typeof citeNotebook === 'function' ? nbpMenuItem('bibliography', 'Export bibliography…') : ''}${nbpMenuItem('import-book', 'Import a notebook file…')}${nbpMenuItem('import', 'Import Markdown files…')}${nbpMenuItem('delete-book', 'Delete this notebook…', { disabled: NBS.books.length < 2 })}</div></span></div>
        <div class="nbk-rail-head"><h2 class="nbk-rail-title">Pages</h2><div class="nbk-tools"><a class="nbk-ib" href="#/notebook/new" title="New page (n)" aria-label="New page">${icon('plus')}</a></div></div>
        <input class="nbk-find" id="nbkFind" type="search" placeholder="Find a page or #tag" aria-label="Find a page or a tag" autocomplete="off" spellcheck="false" value="${esc(nbkFilter)}">
        <button type="button" class="chip nbk-all" id="nbkAll" aria-pressed="${nbkAll ? 'true' : 'false'}" title="Look in every notebook, not only this one">All notebooks</button>
        <div id="nbkList">${nbpListHtml(curId, bookId)}</div><div id="nbkTags">${nbpTagsHtml(route.view === 'tag' ? route.tag : '')}</div><div id="nbkReading">${nbpReadingHtml()}</div>
        <input type="file" id="nbkImport" accept=".md,.markdown,.txt,.zip,text/markdown,text/plain,application/zip" multiple hidden><input type="file" id="nbkImportBook" accept=".json,application/json" hidden>`;
    };
    const refreshRail = () => { if (!alive) return; const l = rail.querySelector('#nbkList'); if (l) l.innerHTML = nbpListHtml(curId, bookId); const t = rail.querySelector('#nbkTags'); if (t) t.innerHTML = nbpTagsHtml(route.view === 'tag' ? route.tag : ''); };

    /* ── saving ── */
    const setStatus = () => {
      const el = main.querySelector('#nbkStatus'); if (!el) return;
      const bad = NBS.error ? 'Not saved: ' + NBS.error : NBS.memOnly ? 'Not kept after this tab closes' : '';
      el.textContent = bad || (dirty || NBS.pending ? 'Saving…' : 'Saved'); el.classList.toggle('bad', !!bad);
      el.title = NBS.memOnly ? 'This browser would not give the notebook a place to keep pages' + (NBS.why ? ' (' + NBS.why + ')' : '') + '. Export your pages to keep them.' : '';
    };
    const flush = async () => { clearTimeout(saveTimer); if (!dirty || !rec) return; dirty = false; const r = rec; setStatus(); await NBS.save(r); nbSetting({ last: r.id }); refreshRail(); setStatus(); };
    let warned = false;
    const changed = () => {
      rec = Object.assign({}, rec, { body: nbJoin(blocks), u: Date.now() }); dirty = true; setStatus(); clearTimeout(saveTimer); saveTimer = setTimeout(flush, 500);
      if (rec.body.length > NB_LIMITS.body && !warned) { warned = true; toast(`This page has passed ${NB_LIMITS.body.toLocaleString()} characters, the most a page holds: the end of it will not be kept. Move some of it to another page.`, 'warn', 9000); }
    };
    const unsub = NBS.on((what) => { if (what === 'status') setStatus(); }); cleanups.push(unsub);

    /* ── a page: its title, its blocks ── */
    const bodyEl = () => main.querySelector('#nbkBody');
    const blockEl = (i) => main.querySelector(`.nbk-b[data-i="${i}"]`);
    const blocksHtml = () => blocks.map((b, i) => `<div class="nbk-b" data-i="${i}" tabindex="0">${nbBlockHtml(b)}</div>`).join('')
      + `<div class="nbk-add" id="nbkAdd" tabindex="0" title="Click to write here">${blocks.some((b) => b.trim()) ? '' : '<span class="nbk-hint">Click here and start writing. Select words in any text and choose <b>Clip to notebook</b> to bring a passage here, with a link back to where it is.</span>'}</div>`;
    const drawBlocks = () => { const b = bodyEl(); if (b) b.innerHTML = blocksHtml(); };
    const autosize = (ta) => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
    const editBlock = (i, atStart) => {
      finishEdit(); if (i < 0 || i >= blocks.length) return; const el = blockEl(i); if (!el) return; editing = i; el.classList.add('is-editing');
      el.innerHTML = `<textarea class="nbk-ed" rows="1" spellcheck="true" aria-label="Edit this block as Markdown. Escape stops editing.">${esc(blocks[i])}</textarea>`;
      const ta = el.querySelector('textarea'); autosize(ta); ta.focus(); const at = atStart ? 0 : ta.value.length; ta.setSelectionRange(at, at);
    };
    /* the block being edited is read back: as it is (drawn in place, so a click on the next block still lands), or emptied, or split into several (drawn again). Gives how many blocks it is now */
    function finishEdit() {
      if (editing < 0) return 1; const i = editing; editing = -1; const el = blockEl(i); const ta = el && el.querySelector('textarea'); if (!ta) return 1;
      const parts = nbBlocks(ta.value);
      if (parts.length === 1) { el.classList.remove('is-editing'); el.innerHTML = nbBlockHtml(parts[0]); if (parts[0] !== blocks[i]) { blocks[i] = parts[0]; changed(); } return 1; }
      blocks.splice(i, 1, ...parts); changed(); drawBlocks(); return parts.length;
    }
    const addBlockAfter = (j) => { finishEdit(); blocks.splice(Math.min(j + 1, blocks.length), 0, ''); drawBlocks(); editBlock(Math.min(j + 1, blocks.length - 1)); };
    const focusBlock = (i) => { const el = blockEl(i); if (el) el.focus(); };
    const onEditKey = (e) => {
      const ta = e.target; if (!ta || ta.tagName !== 'TEXTAREA' || editing < 0) return; const i = editing; const v = ta.value; const pos = ta.selectionStart; const collapsed = ta.selectionEnd === pos;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finishEdit(); focusBlock(Math.min(i, blocks.length - 1)); return; }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); const n = finishEdit(); addBlockAfter(i + n - 1); return; }
      if (e.key === 'Enter' && !e.shiftKey && !e.altKey && collapsed && (pos === v.length || v[pos] === '\n')) {
        const ls = v.lastIndexOf('\n', pos - 1) + 1; const m = v.slice(ls, pos).match(/^([ \t]*)([-*+]|\d{1,9}[.)])[ \t]+(\[[ xX]\][ \t]+)?(.*)$/);
        if (m) { e.preventDefault(); if (!m[4].trim()) ta.setRangeText('', ls, pos, 'end'); else { const mk = /\d/.test(m[2]) ? (parseInt(m[2], 10) + 1) + m[2].slice(-1) : m[2]; ta.setRangeText('\n' + m[1] + mk + ' ' + (m[3] ? '[ ] ' : ''), pos, pos, 'end'); } autosize(ta); return; }
      }
      if (!collapsed || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (e.key === 'ArrowUp' && v.lastIndexOf('\n', pos - 1) === -1 && i > 0) { e.preventDefault(); finishEdit(); editBlock(Math.min(i - 1, blocks.length - 1)); return; }
      if (e.key === 'ArrowDown' && v.indexOf('\n', pos) === -1) { e.preventDefault(); const n = finishEdit(); if (i + n < blocks.length) editBlock(i + n, true); else focusBlock(Math.max(0, blocks.length - 1)); return; }
      if (e.key === 'Backspace' && !v && i > 0) { e.preventDefault(); finishEdit(); editBlock(Math.min(i - 1, blocks.length - 1)); }
    };
    const closeMenus = () => { main.querySelectorAll('.nbk-menu').forEach((m) => { m.hidden = true; }); rail.querySelectorAll('.nbk-menu').forEach((m) => { m.hidden = true; }); host.querySelectorAll('[aria-haspopup]').forEach((b) => b.setAttribute('aria-expanded', 'false')); menuOpen = ''; };
    const toggleMenu = (btn, menu) => { const open = menu.hidden; closeMenus(); if (open) { menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); menuOpen = menu.id; const first = menu.querySelector('button:not([disabled])'); if (first) first.focus(); } };

    const pageHtml = () => {
      const collecting = nbCollectId(bookId) === rec.id; const isInbox = nbIsInbox(rec.id);
      return `<article class="nbk-page" data-id="${esc(rec.id)}"><div class="nbk-top"><a class="nbk-back" href="#/notebook">← ${esc(book.name)}</a><span class="nbk-status" id="nbkStatus" role="status" aria-live="polite">Saved</span>
        <span class="nbk-menuwrap"><button class="nbk-ib" type="button" id="nbkPageBtn" aria-haspopup="menu" aria-expanded="false" aria-label="This page: add a question, export, move, delete" title="This page">${icon('more')}</button><div class="nbk-menu" id="nbkPageMenu" role="menu" hidden>
          ${nbpMenuItem('question', 'Add today’s question')}${nbpMenuItem('collect', isInbox ? 'Clips arrive here' : 'Collect clips here', { on: collecting, disabled: isInbox && collecting })}${nbpMenuItem('export', 'Export this page (.md)')}${typeof rdCopy === 'function' ? nbpMenuItem('copy', 'Copy as Markdown') : ''}${typeof citeNotebook === 'function' ? nbpMenuItem('cite', 'Cite the sources on this page…') : ''}${isInbox ? '' : nbpMenuItem('move', 'Move to another notebook…')}${nbpMenuItem('copy-to', 'Copy to another notebook…')}${isInbox ? '' : nbpMenuItem('delete', 'Delete this page…')}</div></span></div>
        <input class="nbk-title" id="nbkTitle" value="${esc(rec.title)}" placeholder="${isInbox ? 'Inbox' : 'Untitled'}" aria-label="Page title" maxlength="${NB_LIMITS.title}" autocomplete="off" spellcheck="true">
        ${isInbox && !nbIndexNow().tags.length ? '<p class="nbk-hint nbk-taghint">Type #word anywhere on this page to tag it. Clips and pages with the same tag are gathered under Tags.</p>' : ''}<div class="nbk-body" id="nbkBody">${blocksHtml()}</div>${typeof relatedBox === 'function' ? ((r) => (r ? `<section class="rdrel nbk-rel" aria-label="Related">${r}</section>` : ''))(relatedBox('note', rec.id, {})) : ''}</article>`;      /* the strip of related things (the religions and books this page clips from), after the page and not in the editor: drawn once with the page, guarded (6zzh-related.js) */
    };
    const drawPage = () => {
      main.innerHTML = pageHtml(); setStatus();
      const ti = main.querySelector('#nbkTitle');
      on(ti, 'input', () => { rec = Object.assign({}, rec, { title: ti.value, u: Date.now() }); dirty = true; setStatus(); clearTimeout(saveTimer); saveTimer = setTimeout(flush, 500); });
      on(ti, 'keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); if (blocks.length) focusBlock(0); else { blocks.push(''); drawBlocks(); editBlock(0); } } else if (e.key === 'Escape') ti.blur(); });
      on(ti, 'blur', () => { flush(); });
      const body = main.querySelector('#nbkBody');
      on(body, 'click', (e) => {
        if (e.target.closest('a,input,textarea,button')) return; const sel = window.getSelection && window.getSelection(); if (sel && !sel.isCollapsed && body.contains(sel.anchorNode)) return;
        const b = e.target.closest('.nbk-b'); if (b) { const i = +b.dataset.i; if (editing !== i) editBlock(i); } else if (e.target.closest('.nbk-add')) { finishEdit(); blocks.push(''); drawBlocks(); editBlock(blocks.length - 1); }
      });
      on(body, 'keydown', (e) => {
        if (e.target.tagName === 'TEXTAREA') return onEditKey(e);
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList) { if (e.target.classList.contains('nbk-b')) { e.preventDefault(); editBlock(+e.target.dataset.i); } else if (e.target.id === 'nbkAdd') { e.preventDefault(); finishEdit(); blocks.push(''); drawBlocks(); editBlock(blocks.length - 1); } }
      });
      on(body, 'focusout', (e) => { if (e.target && e.target.tagName === 'TEXTAREA') setTimeout(() => { if (alive && editing >= 0 && !(document.activeElement && document.activeElement.tagName === 'TEXTAREA')) finishEdit(); }, 0); });
      on(body, 'input', (e) => { if (e.target.tagName === 'TEXTAREA') autosize(e.target); });
      on(body, 'change', (e) => { const c = e.target.closest && e.target.closest('input.nbk-chk'); if (!c) return; const b = c.closest('.nbk-b'); const i = +b.dataset.i; const t = nbToggleTask(blocks[i], +c.dataset.line); if (t != null) { blocks[i] = t; changed(); b.innerHTML = nbBlockHtml(t); } });
      const pb = main.querySelector('#nbkPageBtn'); const pm = main.querySelector('#nbkPageMenu'); on(pb, 'click', (e) => { e.stopPropagation(); toggleMenu(pb, pm); });
      on(pm, 'click', async (e) => {
        const b = e.target.closest('button[data-act]'); if (!b) return; const act = b.dataset.act; closeMenus(); finishEdit();
        if (act === 'question') { const q = nbQuestion(nbDay(), nbStationQs()); blocks.push(nbQuestionMd(q), ''); changed(); drawBlocks(); editBlock(blocks.length - 1); }
        else if (act === 'collect') { store.set('notebook.settings', nbCollectPut(nbSettings(), bookId, nbCollectId(bookId) === rec.id ? '' : rec.id)); drawPage(); toast(nbCollectId(bookId) === rec.id ? `Clips now go to <b>${esc(nbTitleOf(rec))}</b> in <b>${esc(book.name)}</b>.` : `Clips go to the Inbox of <b>${esc(book.name)}</b> again.`, '', 2600); }
        else if (act === 'export') { await flush(); NB.exportPage(rec.id); }
        else if (act === 'cite') { await flush(); citeNotebook([rec.body], { title: 'Sources cited on this page', name: nbTitleOf(rec) }); }
        else if (act === 'copy') { const ok = await rdCopy(nbToMd(rec)); toast(ok ? 'Copied as Markdown.' : 'Copying is not available here.', ok ? 'good' : 'bad', 2200); }
        else if (act === 'move' || act === 'copy-to') {
          const mv = act === 'move'; await flush();
          const pick = await nbpChoose({ title: mv ? 'Move this page to…' : 'Copy this page to…', exclude: mv ? rec.nb : '', ok: mv ? 'Move' : 'Copy' }); if (!pick) return;
          let to = pick.book; if (!to) { const r0 = await NB.createBook(pick.name, { stay: true }); if (!r0.ok) { toast(esc(r0.error), 'bad', 4000); return; } to = r0.id; }
          const r1 = mv ? await NB.movePage(rec.id, to) : await NB.copyPage(rec.id, to);
          if (!r1.ok) { toast(r1.full ? 'That notebook is full.' : 'It could not be done.', 'bad', 3000); return; }
          toast(`${mv ? 'Moved' : 'Copied'} to <b>${esc(nbBookNameOf(to))}</b>. <a href="#/notebook/${encodeURIComponent(r1.pageId)}">Open</a>`, 'good', 4200);
          if (mv) { clearTimeout(saveTimer); dirty = false; location.hash = '#/notebook'; }
        }
        else if (act === 'delete') {
          if (await confirmBox('Delete this page?', `<p>“${esc(nbTitleOf(rec))}” will be deleted from this browser. Export it first if you want a copy. This cannot be undone.</p>`, 'Delete', 'danger')) { const id = rec.id; clearTimeout(saveTimer); dirty = false; if (nbCollectOf(nbSettings(), bookId) === id) store.set('notebook.settings', nbCollectPut(nbSettings(), bookId, '')); if (nbSettings().last === id) nbSetting({ last: '' }); await NBS.remove(id); nbCache.delete(id); location.hash = '#/notebook'; }
        }
      });
      const want = parseInt(query && query.b, 10); if (Number.isInteger(want) && want >= 0) setTimeout(() => { const el = alive && blockEl(want); if (el) { el.scrollIntoView({ block: 'center' }); el.classList.add('nbk-flash'); setTimeout(() => el.classList.remove('nbk-flash'), 2400); } }, 80);
      if (route.view === 'page' && query && query.t === '1') { ti.focus(); ti.select(); }
    };

    /* ── the other things the right-hand side can show ── */
    const drawEmpty = (msg) => { main.innerHTML = `<div class="nbk-page nbk-empty"><a class="nbk-back" href="#/notebook">← Pages</a><h2 class="nbk-h">${esc(msg || 'Your notebook is empty.')}</h2><p class="nbk-sub">Pages are plain Markdown kept in this browser. Select words in any text and choose <b>Clip to notebook</b>: the passage comes here with a link back to the exact place. Or start a page of your own. Type #word anywhere on a page to tag it; pages with the same tag are gathered together.</p><p><a class="btn primary" href="#/notebook/new">${icon('plus')}New page</a></p>${NBS.memOnly ? '<p class="nbk-warn">This browser would not give the notebook a place to keep pages, so they will be lost when the tab closes. Export them to keep them.</p>' : ''}</div>`; };
    const drawNew = () => {
      main.innerHTML = `<div class="nbk-page nbk-new"><a class="nbk-back" href="#/notebook">← Pages</a><h2 class="nbk-h">New page</h2><p class="nbk-sub">Start from a template, or from a blank page.</p><div class="nbk-tpls">${NB_TEMPLATES.map((t) => `<button type="button" class="nbk-tpl" data-t="${t.id}"><b>${esc(t.name)}</b><span>${esc(t.blurb)}</span></button>`).join('')}</div></div>`;
      const box = main.querySelector('.nbk-tpls'); const btns = [...box.querySelectorAll('button')];
      on(box, 'click', async (e) => { const b = e.target.closest('button[data-t]'); if (!b) return; const r = nbNewRec(b.dataset.t, undefined, bookId); if (!(await NBS.save(r))) { toast(`A notebook holds ${NB_LIMITS.pages.toLocaleString()} pages at most.`, 'bad', 4000); return; } nbSetting({ last: r.id }); location.hash = '#/notebook/' + encodeURIComponent(r.id) + '?t=1'; });
      on(box, 'keydown', (e) => { const k = btns.indexOf(document.activeElement); if (k < 0) return; if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); btns[(k + 1) % btns.length].focus(); } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); btns[(k + btns.length - 1) % btns.length].focus(); } else if (e.key === 'Escape') location.hash = '#/notebook'; });
      if (btns[0]) btns[0].focus();
    };
    const drawTag = () => {
      const ix = nbIndexNow(); const groups = ix.by.get(route.tag) || []; const n = groups.reduce((a, g) => a + g.items.length, 0);
      main.innerHTML = `<div class="nbk-page nbk-tagpage"><a class="nbk-back" href="#/notebook">← Pages</a><h2 class="nbk-h">#${esc(route.tag)}</h2><p class="nbk-sub">${n ? `${n} clip${n === 1 ? '' : 's'} and note${n === 1 ? '' : 's'} in ${groups.length} page${groups.length === 1 ? '' : 's'}.` : 'Nothing carries this tag yet. Write it in a note or under a clip, for example #' + esc(route.tag) + '.'}</p>
        <details class="nbk-how"><summary>How a tag marks things</summary><p>A tag marks the note or clip it is written in. Written in a heading, it marks everything under that heading. On a line of its own it marks the block above it, or, at the very top of a page, the whole page.</p></details>
        ${groups.map((g) => `<section class="nbk-group"><h3 class="nbk-gt"><a href="#/notebook/${encodeURIComponent(g.page.id)}">${esc(nbTitleOf(g.page))}</a></h3>${g.items.slice(0, 200).map((it) => `<article class="nbk-hit">${it.heading ? `<div class="nbk-hit-h">${esc(it.heading)}</div>` : ''}<div class="nbk-hit-b">${nbBlockHtml(it.text, { readonly: true })}</div><a class="nbk-hit-o" href="#/notebook/${encodeURIComponent(g.page.id)}?b=${it.i}">Open in the page</a></article>`).join('')}${g.items.length > 200 ? `<p class="nbk-sub">${g.items.length - 200} more in this page.</p>` : ''}</section>`).join('')}</div>`;
    };

    /* ── draw it all ── */
    drawRail();
    if (route.view === 'new') drawNew();
    else if (route.view === 'tag') drawTag();
    else if (rec) { if (route.view === 'page' || route.view === 'list') drawPage(); }
    else if (route.view === 'page') drawEmpty('That page is not here any more.');
    else drawEmpty(NBS.books.length > 1 ? book.name + ' is empty.' : '');
    if (route.view === 'page' && rec) nbSetting({ last: rec.id });
    { const pg = main.querySelector('.nbk-page'); const ae = document.activeElement; if (pg && route.view !== 'list' && !(ae && ae.matches && ae.matches('input,textarea'))) { pg.setAttribute('tabindex', '-1'); try { pg.focus({ preventScroll: true }); } catch (e) { /* no focus */ } } }

    /* ── the list, its search, its menu ── */
    const find = rail.querySelector('#nbkFind');
    const refind = debounce(() => { nbkFilter = find.value; const l = rail.querySelector('#nbkList'); if (l) l.innerHTML = nbpListHtml(curId, bookId); }, 120); on(find, 'input', refind);
    on(find, 'keydown', (e) => {
      if (e.key === 'Escape') { find.value = ''; nbkFilter = ''; refind(); find.blur(); return; }
      if (e.key === 'Enter') { const q = find.value.trim(); if (q[0] === '#' && q.length > 1) { nbkFilter = ''; location.hash = '#/notebook/tag/' + encodeURIComponent(q.slice(1).toLowerCase()); return; } const first = rail.querySelector('#nbkList .nbk-row'); if (first) location.hash = first.getAttribute('href'); }
      if (e.key === 'ArrowDown') { const first = rail.querySelector('#nbkList .nbk-row'); if (first) { e.preventDefault(); first.focus(); } }
    });
    on(rail, 'keydown', (e) => {
      if (!e.target.classList || !e.target.classList.contains('nbk-row')) return; const rows = [...rail.querySelectorAll('.nbk-row')]; const k = rows.indexOf(e.target);
      if (e.key === 'ArrowDown') { e.preventDefault(); if (rows[k + 1]) rows[k + 1].focus(); } else if (e.key === 'ArrowUp') { e.preventDefault(); if (k > 0) rows[k - 1].focus(); else find.focus(); } else if (e.key === 'Home') { e.preventDefault(); rows[0].focus(); } else if (e.key === 'End') { e.preventDefault(); rows[rows.length - 1].focus(); }
    });
    const bb = rail.querySelector('#nbkBookBtn'); const bm = rail.querySelector('#nbkBookMenu'); on(bb, 'click', (e) => { e.stopPropagation(); toggleMenu(bb, bm); });
    on(bm, 'click', async (e) => {
      const r = e.target.closest('button[data-book]'); if (r) { closeMenus(); if (r.dataset.book !== bookId) { await flush(); await NB.setCurrent(r.dataset.book); nbpGoList(); } return; }
      const b = e.target.closest('button[data-act]'); if (!b || b.disabled) return; closeMenus();
      if (b.dataset.act === 'new-book') { await flush(); const nm = await nbpAsk({ title: 'New notebook', label: 'Name', ok: 'Create' }); if (!nm) return; const r2 = await NB.createBook(nm); if (!r2.ok) { toast(esc(r2.error), 'bad', 4000); return; } toast(`Made the notebook <b>${esc(r2.name)}</b>.`, 'good', 2600); nbpGoList(); }
    });
    const rb = rail.querySelector('#nbkRailBtn'); const rm = rail.querySelector('#nbkRailMenu'); on(rb, 'click', (e) => { e.stopPropagation(); toggleMenu(rb, rm); });
    const imp = rail.querySelector('#nbkImport'); const impBook = rail.querySelector('#nbkImportBook');
    on(rm, 'click', async (e) => {
      const b = e.target.closest('button[data-act]'); if (!b || b.disabled) return; const act = b.dataset.act; closeMenus(); await flush();
      if (act === 'export-all') { try { await NB.exportAll(bookId); } catch (err) { toast('The export failed: ' + esc(err.message), 'bad'); } }
      else if (act === 'bibliography') { citeNotebook(nbBookPages(bookId).map((pg) => pg.body), { title: 'Bibliography of ' + book.name, name: book.name }); }
      else if (act === 'export-book') { NB.exportBook(bookId); toast(`Saved <b>${esc(book.name)}</b> as one file. Look in your downloads.`, 'good', 3200); }
      else if (act === 'import') imp.click(); else if (act === 'import-book') impBook.click();
      else if (act === 'rename-book') { const nm = await nbpAsk({ title: 'Rename this notebook', label: 'Name', value: book.name, ok: 'Rename' }); if (!nm) return; const r2 = await NB.renameBook(bookId, nm); if (r2.ok) { toast(`Renamed to <b>${esc(r2.name)}</b>.`, 'good', 2400); Router.render(); } else toast(esc(r2.error), 'bad', 3000); }
      else if (act === 'delete-book') { if (await nbpDeleteBook(bookId)) nbpGoList(); }
    });
    on(imp, 'change', async () => { const files = imp.files; if (!files || !files.length) return; try { await NB.importFiles(files); } catch (err) { toast('The import failed: ' + esc(err.message), 'bad'); } imp.value = ''; if (alive) Router.render(); });
    on(impBook, 'change', async () => { const f = impBook.files && impBook.files[0]; if (!f) return; const r2 = await NB.importBook(f); impBook.value = ''; if (r2.ok && alive) nbpGoList(); });
    const allBtn = rail.querySelector('#nbkAll'); on(allBtn, 'click', () => { nbkAll = !nbkAll; allBtn.setAttribute('aria-pressed', nbkAll ? 'true' : 'false'); const l = rail.querySelector('#nbkList'); if (l) l.innerHTML = nbpListHtml(curId, bookId); });

    /* ── leaving it alone: a click elsewhere or Escape closes a menu; n makes a new page; every change is saved when the page is left ── */
    on(document, 'click', (e) => { if (menuOpen && !e.target.closest('.nbk-menuwrap')) closeMenus(); });
    on(document, 'keydown', (e) => {
      if (e.key === 'Escape' && menuOpen) { const id = menuOpen; closeMenus(); const b = host.querySelector(id === 'nbkRailMenu' ? '#nbkRailBtn' : id === 'nbkBookMenu' ? '#nbkBookBtn' : '#nbkPageBtn'); if (b) b.focus(); return; }
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey && !nbpTyping(e.target) && !document.querySelector('.modal-back,.overlay,.pal-back')) { e.preventDefault(); location.hash = '#/notebook/new'; }
    });
    const onHide = () => { finishEdit(); flush(); }; on(window, 'pagehide', onHide); on(document, 'visibilitychange', () => { if (document.hidden) onHide(); });
    return () => { alive = false; try { finishEdit(); } catch (e) { /* the page is already gone */ } flush(); cleanups.forEach((f) => { try { f(); } catch (e) { /* ignore */ } }); };
  },
};
