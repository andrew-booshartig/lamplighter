/* ═══════════════════════════ 6c · The text library: full copies, read inside the app ═══════════════════════════
   Texts live in a `texts/` folder next to Lamplighter.html (built by tools/build_texts.py from public-domain and openly
   licensed sources). Each text is a script file that calls BEATLAB_TEXTS.add(id, meta, sections) when loaded, so it works
   offline from file:// and nothing is fetched from the internet. If the folder is missing the Library simply shows
   where to read each text instead. */
globalThis.BEATLAB_TEXTS = globalThis.BEATLAB_TEXTS || {
  data: {}, meta: {}, indexed: false,
  add(id, meta, secs) { this.data[id] = { meta, secs }; this.meta[id] = Object.assign(this.meta[id] || {}, meta); },
  addIndex(idx) { Object.assign(this.meta, idx); this.indexed = true; },
};
const TXT = {
  base: 'texts/', _scripts: {},
  script(name) {
    if (!TXT._scripts[name]) TXT._scripts[name] = new Promise((res, rej) => {
      const s = document.createElement('script'); s.charset = 'utf-8'; s.src = TXT.base + name + '.js'; s.onload = () => res(); s.onerror = () => { delete TXT._scripts[name]; rej(new Error('missing ' + name)); }; document.head.appendChild(s);
    });
    return TXT._scripts[name];
  },
  index() { return TXT.script('index').then(() => TXT.packs()).then(() => BEATLAB_TEXTS.meta, () => null); },
  /* optional packs (tools/make_release.py): a trimmed copy's index lists the packs that may sit beside it (BEATLAB_TEXTS.packs = { slug: collection name }); each one that is there
     adds its texts to the index (texts/pack-<slug>.js), and one that is not is skipped and remembered in TXT.packsMissing, so the Library can say what this copy leaves out */
  packs() {
    if (!TXT._packs) {
      const all = BEATLAB_TEXTS.packs || {}; TXT.packsMissing = [];
      TXT._packs = Promise.all(Object.keys(all).map((slug) => TXT.script('pack-' + slug).then(() => null, () => { TXT.packsMissing.push(all[slug]); }))).then(() => null);
    }
    return TXT._packs;
  },
  /* the original files each text came from (texts/originals.js, see 2z-originals-core.js): {} when the file is not there, so the reader falls back to the plain source link */
  orig() { return TXT.script('originals').then(() => globalThis.BEATLAB_ORIG || {}, () => ({})); },
  /* the pictures of the printed book (texts/fig-<id>.js, listed in texts/figs.js; see 2z-figures-core.js): [] for a text without any, or when the files are not there */
  figs(id) { return TXT.script('figs').then(() => (globalThis.BEATLAB_FIGN || {})[id] ? TXT.script('fig-' + id).then(() => (globalThis.BEATLAB_FIGS || {})[id] || [], () => []) : [], () => []); },
  /* the printed pages of a scanned text (texts/pg-<id>.js, listed in texts/pgs.js; see 2z-pages-core.js): { rows, grade, vols } for a text that has them and has not been rebuilt since, else null */
  pages(id) {
    return TXT.script('pgs').then(() => { const e = (globalThis.BEATLAB_PAGEN || {})[id]; const m = (BEATLAB_TEXTS.meta || {})[id]; return pgmFits(e, m) ? TXT.script('pg-' + id).then(() => { const rows = (globalThis.BEATLAB_PAGES || {})[id]; return rows ? { rows, grade: e[3], vols: e[4] || 0 } : null; }, () => null) : null; }, () => null);
  },
  has(id) { return !!BEATLAB_TEXTS.meta[id]; },
  async load(id) { if (!BEATLAB_TEXTS.data[id]) { if (/^u-/.test(id) && typeof OWN !== 'undefined') await OWN.load(id); else { await TXT.script(id); TXT.hold(id); } } return BEATLAB_TEXTS.data[id]; },
  /* the texts this page has loaded as scripts, and their characters: the engine keeps each one for as long as the page is open (memStop in 2z-source-core.js), and taking the script out again does not change that, so a text is counted once and stays counted */
  held: {}, hold(id) { const m = BEATLAB_TEXTS.meta[id]; if (m && m.chars > 0) TXT.held[id] = m.chars; }, heldChars() { let n = 0; for (const k in TXT.held) n += TXT.held[k]; return n; },
  /* the words of a text fetched and read as data, and NOT kept (AA-01 of ALPHA_AUDIT.md). Taking a <script> out of the page again does not let a text go: the browser keeps the script's source and every string in it, and a search of
     every text took the page to 4.4 GB. A fetched file is only a string that nothing holds once it has been parsed. Only on a web address: a page opened from a file cannot fetch its neighbours, a text of your own is in the
     browser's storage and a book has its own folder. Those (and any file that is not of the usual shape) answer null, and the text is loaded the usual way. */
  async fetchOnce(id) {
    if (typeof fetch !== 'function' || copyWhere() === 'file' || /^u-/.test(id) || (typeof BOOKS !== 'undefined' && BOOKS.by && BOOKS.by[id])) return null;
    try { const r = await fetch(TXT.base + id + '.js'); return r.ok ? txtParse(await r.text(), id) : null; } catch (e) { return null; }
  },
  /* look at a text and let it go: fn({ meta, secs }) is run and its answer returned; nothing is kept, except a text that was already loaded (the reader, Random or Find similar has it open) stays as it was. The all-texts search uses it. */
  async scan(id, fn) {
    const open = BEATLAB_TEXTS.data[id]; let t = open || await TXT.fetchOnce(id); let loaded = false;
    if (!t) { try { t = await TXT.load(id); loaded = !!t; } catch (e) { t = null; } }
    try { return t ? fn(t) : null; } finally { if (loaded) TXT.unload(id); }
  },
  /* let go of a text that was only loaded to be searched, so a full-library search does not keep 140 MB in memory. This lets go on a web address and on localhost (fetchOnce); from a file it only takes the text out of the page: the engine
     keeps a script's source and strings for as long as the page is open, and a frame of its own for each text frees none of it (measured, 21 Nov 2026; see memStop in 2z-source-core.js). So a loop over many texts asks TXT.heapOver() after each one. */
  unload(id) { delete BEATLAB_TEXTS.data[id]; delete TXT._scripts[id]; try { document.querySelectorAll('script[src$="' + TXT.base + id + '.js"]').forEach((el) => el.remove()); } catch (e) { /* not in a page */ } },
  /* how much memory the page uses, where the browser says (performance.memory: Chrome, Edge, Brave; a normal one freezes it), and whether a scan of many texts should stop now: that reading, or the texts held as scripts (memOver, 2z-source-core.js). A test puts its own stand-in in mem. */
  mem() { return typeof performance !== 'undefined' && performance.memory ? performance.memory : null; },
  heapOver() { return memOver(TXT.mem(), TXT.heldChars()); },
};

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/* a block in another language (Greek, Sanskrit, Gaelic or Nahuatl originals printed beside their English translations) */
function isOtherLanguage(blk) {
  const t = psgClean(String(blk).replace(/^## /, '')); if (t.length < 12) return false;
  const ns = t.replace(/\s/g, ''); const latin = (ns.match(/[A-Za-z]/g) || []).length; const letters = (ns.match(/\p{L}/gu) || []).length;
  if (letters > 6 && latin / letters < 0.6) return true;
  return t.length >= 40 && englishScore(t) < 0.12;
}
/* the World English Bible books (ids b- n- d- o-) are one language throughout, and their name lists would trip the test */
const textMayHaveOriginals = (id) => !/^[bndou]-/.test(id);      // a text of your own (u-) may be in any language and is never filtered
/* plain text → reader HTML (used where there are no marks: kept passages, service readings). tm: the Word help context for the text, from wordsFor(id) (6zw-words.js), or nothing */
const readerHTML = (text, find, tm) => { const terms = tm ? { ix: tm.ix, seen: tm.every ? null : new Set() } : null; return textBlocks(text).map((blk) => { const { head, body } = blockParts(blk); return (head != null ? `<h4 class="rh">${paraHTML(head, { find })}</h4>` : '') + (body.trim() ? `<p>${paraHTML(body, { find, terms })}</p>` : ''); }).join(''); };
/* Library hooks: once the index script has loaded, light up "Read" buttons and counts */
function libAttachTexts(root) {
  TXT.index().then((meta) => {
    const note = $('#txtNote', root); if (!note) return;
    if (meta && typeof libContinueFill === 'function') libContinueFill(root, meta);
    if (!meta) { $$('.bk', root).forEach((c) => { c.classList.add('off'); }); note.innerHTML =`${icon('info')} ${loadFailText('Full texts are kept in a <b>texts</b> folder next to Lamplighter.html. It was not found.')} Entries below show where to read each text instead.`; return; }
    const have = LIB.filter((l) => meta[l.id] && l.group !== 'sc'); const total = LIB.filter((l) => l.group !== 'sc').length; const mb = have.reduce((a, l) => a + (meta[l.id].chars || 0), 0) / 1e6;
    const sch = LIB.filter((l) => l.group === 'sc'); const schHave = sch.filter((l) => meta[l.id]); const schMb = schHave.reduce((a, l) => a + (meta[l.id].chars || 0), 0) / 1e6;      /* the books about religion (scholarship) are counted on their own, so the figures here add up to the number of books the page lists */
    note.innerHTML = `<b>${have.length} of ${total}</b> texts can be read here (${mb.toFixed(1)} MB of text)${sch.length ? `, and ${schHave.length === sch.length ? 'all ' + sch.length : schHave.length + ' of ' + sch.length} books of scholarship (${schMb.toFixed(1)} MB)` : ''}. A book whose cover opens is in the app; a dimmed one has no public-domain or openly licensed translation to include, and shows where to read it.${TXT.packsMissing && TXT.packsMissing.length ? ` <b>This copy leaves out:</b> ${TXT.packsMissing.map(esc).join(', ')}. Each is an optional pack: unzip it next to Lamplighter.html to add it.` : ''}`;
    $$('[data-rd]', root).forEach((td) => {
      const id = td.dataset.rd; const m = meta[id]; const card = td.closest('.bk');
      if (!m) { if (card) { card.classList.add('off'); const cv0 = card.querySelector('[data-cover]'); if (cv0) { cv0.setAttribute('role', 'button'); cv0.setAttribute('tabindex', '0'); cv0.title = 'No public-domain or openly licensed English translation is included: open “where to read it” below'; } } return; }
      if (card) {      // a book on a shelf: the cover opens it; its source, the small buttons and its progress go below
        const cv = card.querySelector('[data-cover]'); if (cv) { cv.href = '#/path/read/' + id; cv.title = (m.by || '') + ' · ' + Math.max(1, Math.round(m.chars / 1000)) + 'k characters'; const f = typeof libFraction === 'function' ? libFraction(id, m.n) : 0; const bar = cv.querySelector('.bk-prog i'); if (bar && f > 0) bar.style.width = Math.round(f * 100) + '%'; }
        const tags = card.querySelector('[data-tags]'); if (tags && typeof provInfo === 'function') { const pi = provInfo(id, m, null); const b = provBadge(pi); if (b) tags.insertAdjacentHTML('beforeend', `<span class="tag src-${pi.kind}" title="${esc(provNotice(pi))}">${esc(b)}</span>`); }
        td.insertAdjacentHTML('afterbegin', `<a class="btn sm primary" href="#/path/read/${id}">Read</a><a class="btn sm ghost icon dice" href="#/path/passage?b=${id}" title="A random passage from this book" aria-label="A random passage from this book">${icon('dice')}</a>${libRowProgress(id, m.n)}`); card.dataset.full = '1'; return;
      }
      td.insertAdjacentHTML('afterbegin', `<a class="btn sm primary" href="#/path/read/${id}">Read</a><a class="btn sm ghost dice" href="#/path/passage?b=${id}" title="A random passage from this book">${icon('dice')}Random</a><span class="tag" title="${esc(m.by || '')}">${Math.max(1, Math.round(m.chars / 1000))}k characters</span>${libRowProgress(id, m.n)}`); td.closest('tr').dataset.full = '1';
    });
    TXT.script('figs').then(() => { const N = globalThis.BEATLAB_FIGN || {}; $$('[data-rd]', root).forEach((td) => { const n = N[td.dataset.rd]; const mm = meta[td.dataset.rd]; if (n && n[0] && !(n[2] && mm && mm.chars && n[2] !== mm.chars) && !td.querySelector('.figchip')) td.insertAdjacentHTML('beforeend', `<span class="small muted figchip" title="The printed book's pictures are kept with this text and shown in the reader">${n[0]} picture${n[0] === 1 ? '' : 's'}</span>`); }); }, () => { /* no pictures kept */ });
    TXT.script('pgs').then(() => { const N = globalThis.BEATLAB_PAGEN || {}; $$('[data-rd]', root).forEach((td) => { const e = N[td.dataset.rd]; const mm = meta[td.dataset.rd]; if (pgmFits(e, mm) && !td.querySelector('.pgchip')) td.insertAdjacentHTML('beforeend', `<span class="small muted figchip pgchip" title="The printed book’s page numbers are marked in the text, so a passage can be cited by its page">printed page numbers</span>`); }); }, () => { /* no printed pages kept */ });      // which texts have the printed book’s page numbers marked (2z-pages-core.js)
    $$('[data-sfull]', root).forEach((el) => { const n = $$('[data-lib]', el.closest('.subshelf')).filter((x) => x.dataset.full).length; el.textContent = n ? `${n} readable` : ''; });      // the parts of a big shelf (6g-library.js)
    $$('[data-gfull]', root).forEach((el) => { const g = el.dataset.gfull; const n = LIB.filter((l) => l.group === g && meta[l.id]).length; el.textContent = n ? `${n} readable` : ''; });
    const only = $('#libFull', root); const unread = $('#libUnread', root); const started = $('#libStarted', root); const want = $('#libWant', root); const count = $('#libCount', root);
    $$('[data-lib]', root).forEach((el) => { const mm = meta[el.dataset.lib]; if (mm && typeof libFraction === 'function' && libFraction(el.dataset.lib, mm.n) > 0) el.dataset.started = '1'; });      // a book with a saved place or sections read
    const apply = () => {
      let shown = 0; $$('[data-lib]', root).forEach((tr) => { const rd = tr.querySelector('[data-read]'); const hide = (only && only.checked && !tr.dataset.full) || (unread && unread.checked && rd && rd.checked) || (started && started.checked && !(tr.dataset.started && !(rd && rd.checked))) || (want && want.checked && tr.dataset.shelf !== 'want'); tr.hidden = !!hide; if (!hide) shown++; });
      $$('.subshelf', root).forEach((a) => { a.hidden = !a.querySelector('[data-lib]:not([hidden])'); });
      $$('.acc[data-grp]', root).forEach((a) => { a.hidden = !a.querySelector('[data-lib]:not([hidden])'); });
      $$('.collwrap', root).forEach((w) => { w.hidden = !w.querySelector('.acc[data-grp]:not([hidden])'); });
      if (count) count.textContent = `${shown} shown`;
    };
    [only, unread, started, want].forEach((c) => { if (c) c.addEventListener('change', apply); });
    root._libApply = apply;      // the Shelve box (6gs-shelves.js) calls it when a book changes shelf, so a filter still holds
    root.addEventListener('change', (e) => { if (e.target.closest && e.target.closest('[data-read]')) apply(); });
    apply();
  });
}
