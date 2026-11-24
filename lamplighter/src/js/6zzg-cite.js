/* ═══════════════════════════ 6zzg · Cite: the dialog ═══════════════════════════
   The rules are in 2z-cite-core.js (a record, and Chicago, BibTeX and RIS from it); this draws the one small dialog "Cite" and wires the buttons that open it. There is no new place or tab: it opens from the reader's
   selection bar (under ⋯), from the source card of a text (reader About, and "About this text" on the Random card), from the Random card's row of actions, from a notebook page ("Cite the sources on this page") and
   the notebook's own menu ("Export bibliography"), and for the app itself from Methods and standards and from Setup. A button anywhere with data-citeopen="<id>" (a whole text) or data-citeapp opens it, by one
   listener, so the source card needs no wiring of its own.
   The dialog is modal() (a name for a screen reader, Tab kept inside, focus given back): a three-way switch (Chicago, BibTeX, RIS; the last choice is kept in the page's settings as citeFormat, an existing store),
   the citation to read, Copy, and Download (.bib, .ris or .txt, named lamplighter-cite-<key>). For a scan one honest line says it is machine-read (provNotice); the day it was read comes from the clock when the
   person opens the dialog and is never stored. Nothing is sent anywhere. */
const citeMeta = () => (typeof BEATLAB_TEXTS !== 'undefined' && BEATLAB_TEXTS.meta) || {};
const citePlacesNow = (() => { let set = null; let n = -1; return () => { const m = citeMeta(); const k = Object.keys(m).length; if (!set || k !== n) { set = citePlaces(m); n = k; } return set; }; })();
function citeFormatNow() { try { const f = typeof Settings !== 'undefined' ? Settings.get('citeFormat') : ''; return CITE_FORMATS.some((x) => x[0] === f) ? f : 'chicago'; } catch (e) { return 'chicago'; } }
function citeFormatSet(f) { try { if (typeof Settings !== 'undefined') Settings.set('citeFormat', f); } catch (e) { /* the settings are not there: the choice is for this dialog only */ } }
/* the record for a text of the Library (or one of your own), at the place given: o { heading, page, verses, link } */
function citeBuild(id, o, now) {
  const l = typeof LIB_BY_ID !== 'undefined' ? LIB_BY_ID[id] : null; const m = citeMeta()[id]; if (!l && !m) return null; const x = o || {};
  const entry = typeof origEntry === 'function' ? origEntry(globalThis.BEATLAB_ORIG || {}, id, citeMeta()) : null; const meta = m || {};
  const bible = provKind(id, meta) === 'bible'; const verses = x.verses || (bible && x.heading ? citeBibleRef(l ? l.title : id, x.heading) : '');
  return citeRecord(id, meta, { title: l ? l.title : id, heading: bible ? '' : x.heading, verses, page: x.page, link: x.link, entry, release: typeof APP !== 'undefined' ? APP.release : null, now: now || new Date(), places: citePlacesNow() });
}
/* the dialog. o: { id, heading, page, verses, printed } for a passage or a whole text; { app: true }; { ids: [...], title, name } for a bibliography */
async function citeOpen(o) {
  const x = o || {}; const now = new Date(); let recs; let title; let passage = false;
  if (!x.app && (Array.isArray(x.ids) ? x.ids : [x.id]).some((id) => id && !citeMeta()[id]) && typeof TXT !== 'undefined' && TXT && typeof TXT.index === 'function') { try { await TXT.index(); } catch (e) { /* no texts folder beside the page: the Library's own titles still serve */ } }      // the editions of the texts are in the texts index, which a page like the notebook may not have loaded yet
  if (x.app) { recs = [citeAppRecord(typeof APP !== 'undefined' ? APP : {}, now)]; title = 'Cite this app'; }
  else if (Array.isArray(x.ids)) { recs = x.ids.map((id) => citeBuild(id, {}, now)).filter(Boolean); title = x.title || 'Bibliography'; }
  else { const r = citeBuild(x.id, x, now); recs = r ? [r] : []; passage = !!(r && (x.heading || x.verses || x.page)); title = passage ? 'Cite this passage' : 'Cite this text'; }
  if (!recs.length) { if (typeof toast === 'function') toast('No texts are cited here yet. Clip a passage from a text first, and it will be listed.', 'warn', 4200); return Promise.resolve(null); }
  const one = recs.length === 1 ? recs[0] : null; let fmt = citeFormatNow();
  const scan = one && one.kind === 'scan' ? (() => { try { const info = provInfo(one.id, citeMeta()[one.id] || {}, typeof origEntry === 'function' ? origEntry(globalThis.BEATLAB_ORIG || {}, one.id, citeMeta()) : null); const pn = globalThis.BEATLAB_PAGEN; const known = x.printed != null ? !!x.printed : one.pages ? true : pn && pn[one.id] ? true : null; return known == null ? `Machine-read from a scan of the printed book${info.host ? ' (' + info.host + ')' : ''}, so some words are wrong. Every original page is in the scan.` : provNotice(info, known); } catch (e) { return ''; } })() : '';      // whether the text has its printed pages marked is not always known here: then the line does not say either way
  const edition = one && one.note && one.kind !== 'app' ? one.note : '';
  const build = () => {
    if (fmt === 'bibtex') { const t = citeBibliography(recs, 'bibtex'); return { text: t, view: t }; }
    if (fmt === 'ris') { const t = citeBibliography(recs, 'ris'); return { text: t, view: t.replace(/\r\n/g, '\n') }; }
    if (one) { const n = citeChicago(one, 'note'); const b = citeChicago(one, 'bib'); return { note: n, bib: b, text: 'Note:\n' + n.text + '\n\nBibliography:\n' + b.text + '\n' }; }
    const t = citeBibliography(recs, 'chicago'); return { text: t + '\n', list: citeChicagoList(recs).map((c) => c.html) };
  };
  const names = CITE_FORMATS.map(([k, nm]) => `<button type="button" role="radio" data-fmt="${k}" aria-checked="${k === fmt}" aria-pressed="${k === fmt}">${nm}</button>`).join('');
  const html = `<div class="cite">${recs.length > 1 ? `<p class="small t2" style="margin:0 0 8px">${recs.length} texts, listed as one entry for each work, sorted by author or title.</p>` : one && one.section && one.kind !== 'app' ? `<p class="small t2" style="margin:0 0 8px">${esc(one.title)}${one.section ? ', ' + esc(one.section) : ''}${one.pages ? ', p. ' + esc(one.pages) : ''}</p>` : ''}
    <div class="seg sm" role="radiogroup" aria-label="Citation format" id="citeSeg">${names}</div>
    <div id="citeView" class="cite-view" aria-live="polite"></div>
    <div class="row tight cite-go"><button type="button" class="btn primary" id="citeCopy">Copy</button><button type="button" class="btn" id="citeDl">Download</button><span class="small muted" id="citeSaved" role="status"></span></div>
    ${scan ? `<p class="small t2 cite-note">${esc(scan)}</p>` : ''}${edition ? `<p class="small muted cite-note">Edition as the Library records it: ${esc(edition)}</p>` : ''}</div>`;
  const done = modal({ title: esc(title), html, actions: [{ label: 'Close', kind: 'ghost', value: true }] });      // the title may be a notebook's name: modal() puts a title into the page as it is given, so it is escaped here
  const all = document.querySelectorAll('.modal-back'); const back = all[all.length - 1]; if (!back) return done;
  const view = back.querySelector('#citeView'); const saved = back.querySelector('#citeSaved');
  const paint = () => {
    const b = build(); back.querySelectorAll('[data-fmt]').forEach((e) => { const on = e.dataset.fmt === fmt; e.setAttribute('aria-checked', String(on)); e.setAttribute('aria-pressed', String(on)); });
    if (fmt === 'chicago') view.innerHTML = one ? `<div class="cite-blk"><div class="cite-lbl">Note</div><p class="cite-txt" dir="auto">${b.note.html}</p><button type="button" class="btn sm ghost" data-copy="note">Copy the note</button></div><div class="cite-blk"><div class="cite-lbl">Bibliography entry</div><p class="cite-txt" dir="auto">${b.bib.html}</p><button type="button" class="btn sm ghost" data-copy="bib">Copy the entry</button></div>` : `<div class="cite-blk cite-scroll"><div class="cite-lbl">Bibliography</div>${b.list.map((h) => `<p class="cite-txt" dir="auto">${h}</p>`).join('')}</div>`;
    else view.innerHTML = `<label class="cite-lbl" for="citeOut">${fmt === 'bibtex' ? 'BibTeX' : 'RIS'}</label><textarea class="input cite-out" id="citeOut" readonly rows="${Math.min(14, Math.max(7, b.view.split('\n').length + 1))}" spellcheck="false" dir="ltr">${esc(b.view)}</textarea>`;
    if (saved) saved.textContent = '';
  };
  const copy = async (text, what) => {
    let ok = false; const b = build();
    if (what && fmt === 'chicago' && one && typeof ClipboardItem === 'function' && navigator.clipboard && navigator.clipboard.write) { try { const c = what === 'note' ? b.note : b.bib; await navigator.clipboard.write([new ClipboardItem({ 'text/plain': new Blob([c.text], { type: 'text/plain' }), 'text/html': new Blob([c.html], { type: 'text/html' }) })]); ok = true; } catch (e) { ok = false; } }      // pasted into a word processor the titles are in italics
    if (!ok) ok = typeof rdCopy === 'function' ? await rdCopy(text) : false;
    if (saved) saved.textContent = ok ? 'Copied.' : 'Could not copy here: select the text and copy it.'; if (typeof toast === 'function') toast(ok ? 'Copied.' : 'Copying is not available here. Select the text and copy it.', ok ? 'good' : 'warn', 2200); return ok;
  };
  back.addEventListener('click', (e) => {
    const f = e.target.closest ? e.target.closest('[data-fmt]') : null; if (f) { fmt = f.dataset.fmt; citeFormatSet(fmt); paint(); return; }
    const c = e.target.closest ? e.target.closest('[data-copy]') : null; if (c) { const b = build(); copy(c.dataset.copy === 'note' ? b.note.text : b.bib.text, c.dataset.copy); return; }
    if (e.target.closest && e.target.closest('#citeCopy')) { copy(build().text, ''); return; }
    if (e.target.closest && e.target.closest('#citeDl')) {
      const b = build(); const key = one ? citeKeys([one])[0] : (x.name ? String(x.name).normalize('NFD').replace(/\p{M}/gu, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 40) : '') || 'bibliography';
      const file = citeFile(fmt, key); download(file.name, b.text, file.mime + ';charset=utf-8'); if (saved) saved.textContent = 'Saved ' + file.name + '. Look in your downloads.'; if (typeof toast === 'function') toast('Saved <b>' + esc(file.name) + '</b>. Look in your downloads.', 'good', 3000);
    }
  });
  paint(); const cp = back.querySelector('#citeCopy'); if (cp) cp.focus();
  return done;
}
/* the buttons: one listener for every data-citeopen (a whole text) and data-citeapp (the app) on the page, wherever it was drawn */
if (typeof document !== 'undefined' && document && typeof document.addEventListener === 'function') {
  document.addEventListener('click', (e) => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    const a = t.closest('[data-citeapp]'); if (a) { e.preventDefault(); citeOpen({ app: true }); return; }
    const w = t.closest('[data-citeopen]'); if (w) { e.preventDefault(); citeOpen({ id: w.dataset.citeopen, printed: w.dataset.printed === '1' }); }
  });
}
/* the sources a notebook page (or a notebook) cites: one entry per text, from the places its clips link back to (citeIdsIn) */
function citeNotebook(bodies, o) { const ids = citeIdsIn((Array.isArray(bodies) ? bodies : [bodies]).join('\n')); return citeOpen({ ids, title: (o && o.title) || 'Sources cited in the notebook', name: o && o.name }); }
if (typeof module !== 'undefined' && module.exports) module.exports = {};
