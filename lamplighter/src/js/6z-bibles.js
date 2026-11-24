/* ═══════════════════════════ 6z · Bibles side by side ═══════════════════════════
   Texts → Compare passages → Bibles side by side. Pick a passage ("John 3:16", "Psalm 23", or a book and chapter), choose up to six versions, and read them verse by verse in
   columns (or each as running text), with the words that differ from the first version marked. Click a verse number to see that verse in every version at once.
   The versions are in the Bibles pack (../bibles/ next to Lamplighter.html, built by tools/build_bibles.py): public domain, verses only. */
globalThis.BEATLAB_BIBLES = globalThis.BEATLAB_BIBLES || {
  versions: [], books: [], data: {},
  add(ver, code, chs, extra) { (this.data[ver] = this.data[ver] || {})[code] = { chs, notes: (extra && extra.n) || {}, diff: new Set((extra && extra.d) || []) }; },
  addIndex(i) { this.versions = i.versions || []; this.books = i.books || []; },
};
const BIB = {
  base: 'bibles/', _scripts: {},
  script(name) {
    if (!BIB._scripts[name]) BIB._scripts[name] = new Promise((res, rej) => {
      const s = document.createElement('script'); s.charset = 'utf-8'; s.src = BIB.base + name + '.js'; s.onload = () => res(); s.onerror = () => { delete BIB._scripts[name]; rej(new Error('missing ' + name)); }; document.head.appendChild(s);
    });
    return BIB._scripts[name];
  },
  index() { return BIB.script('index').then(() => (BEATLAB_BIBLES.versions.length ? BEATLAB_BIBLES : null), () => null); },
  async book(ver, code) { const d = BEATLAB_BIBLES.data; if (!(d[ver] && d[ver][code])) await BIB.script(ver + '-' + code.toLowerCase()); return d[ver] && d[ver][code] || null; },
};
const BIB_DEFAULT = ['kjv', 'web', 'bsb', 'dra'];
const BIB_GROUPS = { ot: 'Old Testament', nt: 'New Testament', dc: 'Apocrypha and deuterocanon' };

async function pathBiblesView(root, query) {
  const body = root.querySelector('#pbody');
  body.innerHTML = '<p class="t2 small">Opening the Bibles…</p>';
  const idx = await BIB.index();
  if (!idx) { body.innerHTML = `<section class="card"><div class="callout warn">${icon('warn')}<div>${loadFailText('The <b>bibles</b> folder was not found next to Lamplighter.html, so there are no Bible versions to show yet. Keep the two together and reload.')} (The Library’s own Bible, the World English Bible, still opens in the reader.)</div></div></section>`; return; }
  if (root.isConnected === false) return;
  const vers = idx.versions; const V = Object.assign(Object.create(null), Object.fromEntries(vers.map((v) => [v.id, v]))); const books = idx.books; const BK = Object.assign(Object.create(null), Object.fromEntries(books.map((b) => [b[0], b])));      // no prototype: a version called "constructor" is not a version
  const prefs = store.get('bibles.prefs', {}) || {};
  const chosenFromQ = typeof query.v === 'string' ? query.v.split(',').filter((x) => V[x]) : null;
  const st = { code: 'PSA', ch: 23, v1: 0, v2: 0, vs: (chosenFromQ && chosenFromQ.length ? chosenFromQ : (Array.isArray(prefs.vs) ? prefs.vs.filter((x) => V[x]) : BIB_DEFAULT.filter((x) => V[x]))).slice(0, BIB_MAX_VERSIONS), mode: query.m === 'cols' || (query.m !== 'verse' && prefs.mode === 'cols') ? 'cols' : 'verse', diff: query.d != null ? query.d === '1' : !!prefs.diff };
  if (!st.vs.length) st.vs = vers.slice(0, 3).map((v) => v.id);
  const setRef = (r) => { if (!r) return false; st.code = r.code; st.ch = r.chapter || 1; st.v1 = r.v1; st.v2 = r.v2; return true; };
  const known = books.map((b) => b[0]);
  if (query.r) setRef(bibParseRef(query.r, known)); else if (prefs.ref) setRef(bibParseRef(prefs.ref, known));
  const nm = (code) => (code === 'PSA' ? 'Psalm' : BK[code][1]);
  const nChap = () => (BK[st.code] ? BK[st.code][3] : 1);
  st.ch = clamp(st.ch, 1, nChap());
  body.innerHTML = `<p class="t2 small" style="max-width:74ch">Many English Bibles, side by side. Type a passage such as <b>John 3:16</b> or <b>Psalm 23</b>, or choose a book and chapter, and pick up to ${BIB_MAX_VERSIONS} versions. They are all in the public domain (verses only: the notes, cross-references and headings of the printed editions are left out), from the Geneva Bible of 1599 and the King James to the Berean and Open English Bibles, with the Catholic Douay-Rheims and the Jewish Tanakhs of 1853 and 1917. ${vers.length} versions, ${(vers.reduce((a, v) => a + v.verses, 0) / 1e6).toFixed(1)} million verses.</p>
    <section class="card flat" style="margin:14px 0"><div class="row"><input class="input" id="bbRef" style="max-width:240px" placeholder="John 3:16, Psalm 23, 1 Cor 13…" aria-label="Passage" autocomplete="off"><button class="btn primary" id="bbGo" type="button">Show</button>
      <select class="select" id="bbBook" style="width:auto;max-width:230px" aria-label="Book">${Object.entries(BIB_GROUPS).map(([g, n]) => `<optgroup label="${esc(n)}">${books.filter((b) => b[2] === g).map((b) => `<option value="${b[0]}">${esc(b[1])}</option>`).join('')}</optgroup>`).join('')}</select>
      <select class="select" id="bbCh" style="width:auto" aria-label="Chapter"></select><button class="btn sm ghost" id="bbPrev" type="button" aria-label="Previous chapter">← Previous</button><button class="btn sm ghost" id="bbNext" type="button" aria-label="Next chapter">Next →</button>${RT_BUTTON}<button class="btn sm" id="bbSave" type="button" style="margin-left:auto" title="Save a whole version as an e-book, plain text or a printable page">${icon('download')}Save a version…</button></div>
      <div class="row" id="bbChips" style="margin-top:10px;gap:6px"></div><div class="hint" id="bbChipNote" style="margin-top:4px"></div>
      <div class="row" style="margin-top:8px"><span class="seg" role="group" aria-label="Layout"><button type="button" data-bbm="verse" aria-pressed="${st.mode === 'verse'}">Verse by verse</button><button type="button" data-bbm="cols" aria-pressed="${st.mode === 'cols'}">Whole chapter in columns</button></span>
        <label class="chk"><input type="checkbox" id="bbDiff"${st.diff ? ' checked' : ''}><span class="small">Mark words that differ from the first version</span></label></div></section>
    <div id="bbOut" aria-live="polite"></div><div id="bbOne" style="margin-top:16px"></div>
    <details class="card flat" style="margin-top:18px"><summary style="margin:0"><b>About these versions</b></summary><div class="small t2" style="line-height:1.6;margin-top:8px;max-width:74ch">
      <ul style="margin:0 0 8px 18px;padding:0">${vers.map((v) => `<li><b>${esc(v.name)}</b> (${esc(v.short)}): ${esc(v.basis)}. ${v.books.length} books${v.books.length < 66 ? ', so not every book is here' : ''}. ${ext(v.src, 'source')}</li>`).join('')}</ul>
      <p><b>Numbering.</b> Chapters and verses follow the King James and the Hebrew. The Douay-Rheims follows the Vulgate, which numbers many Psalms differently (and counts a Psalm’s title as a verse), so its Psalms are set here under the Hebrew numbers, with its own verse numbers shown in grey. Where a version divides a chapter differently from the others, the page says so. A verse a version leaves out (as the older Greek-based Bibles do, and the modern ones do for a few New Testament verses) is a gap, not an error. The Jewish Tanakhs print a Psalm’s title as part of verse 1, as do the Geneva, Webster, Young and Majority Standard Bibles.</p>
      <p><b>What they are not.</b> Verses only. To read a book with its introduction and notes, use a full edition from the source link. All of these are public domain; the words are as the source prints them.</p></div></details>`;
  const out = $('#bbOut', root); const one = $('#bbOne', root);
  const chips = $('#bbChips', root); const note = $('#bbChipNote', root);
  const bookSel = $('#bbBook', root); const chSel = $('#bbCh', root); const refIn = $('#bbRef', root);
  const urlOf = () => '#/path/bibles?' + new URLSearchParams({ r: bibRefText(nm(st.code), st.ch, st.v1, st.v2), v: st.vs.join(','), m: st.mode, d: st.diff ? '1' : '0' });
  const sync = () => { try { history.replaceState(null, '', urlOf()); } catch (e) { /* not in a page */ } store.set('bibles.prefs', { vs: st.vs, mode: st.mode, diff: st.diff, ref: bibRefText(nm(st.code), st.ch, st.v1, st.v2) }); };
  const paintControls = () => {
    bookSel.value = st.code; chSel.innerHTML = Array.from({ length: nChap() }, (_, i) => `<option value="${i + 1}"${i + 1 === st.ch ? ' selected' : ''}>${st.code === 'PSA' ? 'Psalm' : 'Chapter'} ${i + 1}</option>`).join('');
    refIn.value = bibRefText(nm(st.code), st.ch, st.v1, st.v2);
    const have = new Set(bibVersionsWith(idx, st.code).map((v) => v.id));
    chips.innerHTML = vers.map((v) => `<button class="chip${st.vs.includes(v.id) ? ' on' : ''}" type="button" data-bv="${v.id}" aria-pressed="${st.vs.includes(v.id)}"${have.has(v.id) ? '' : ' disabled'} title="${esc(v.name)}: ${esc(v.basis)}${have.has(v.id) ? '' : ' (no ' + esc(BK[st.code][1]) + ' in this version)'}">${esc(v.short)}</button>`).join('');
    note.textContent = st.vs.length >= BIB_MAX_VERSIONS ? `Up to ${BIB_MAX_VERSIONS} at once. Click a verse number to see that verse in every version.` : `${st.vs.length} of up to ${BIB_MAX_VERSIONS} chosen. Click a verse number to see that verse in every version.`;
    $$('[data-bbm]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.bbm === st.mode)));
  };
  const diffHTML = (ref, text) => bibDiff(ref, text).map((p) => (p.d ? `<mark class="bbd">${esc(p.w)}</mark>` : esc(p.w))).join('');
  const verseNo = (k, orig) => `<button class="bbnum" type="button" data-vn="${k}" title="Show verse ${k} in every version">${k === 0 ? 'title' : k}</button>${orig ? `<span class="bbo" title="Its own number in this version">${esc(orig)}</span>` : ''}`;
  let token = 0;
  const render = async () => {
    const my = ++token; paintControls(); sync(); one.innerHTML = '';
    const sel = st.vs.filter((id) => V[id].books.includes(st.code));
    if (!sel.length) { out.innerHTML = '<section class="card flat"><p class="t2">None of the chosen versions has this book. Choose another version above.</p></section>'; return; }
    out.innerHTML = `<p class="t2 small">Opening ${esc(BK[st.code][1])}…</p>`;
    let loaded; try { loaded = await Promise.all(sel.map((id) => BIB.book(id, st.code))); } catch (e) { out.innerHTML = `<section class="card flat"><p class="t2">${loadFailText('Could not open that book: ' + esc(e.message) + '. Is the bibles folder complete?')}</p></section>`; return; }
    if (my !== token || root.isConnected === false) return;
    const chapters = {}; const notes = []; const differs = [];
    sel.forEach((id, i) => { const b = loaded[i]; chapters[id] = b && b.chs[String(st.ch)] || null; if (b && b.notes[String(st.ch)]) notes.push([id, b.notes[String(st.ch)]]); if (b && b.diff.has(st.ch)) differs.push(id); });
    const present = sel.filter((id) => chapters[id]); const missing = sel.filter((id) => !chapters[id]);
    const title = `${esc(nm(st.code))} ${st.ch}`;
    const lib = BIB_LIB_ID[st.code]; const web = lib && LIB_BY_ID[lib];
    const head = `<div class="spread" style="align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:8px"><h2 style="font-size:22px;margin:0">${title}${st.v1 ? ':' + st.v1 + (st.v2 > st.v1 ? '–' + st.v2 : '') : ''}</h2><span class="row tight"><button class="btn sm ghost" id="bbCopy" type="button">Copy the passage</button>${web ? `<a class="btn sm ghost" href="#/path/read/${lib}?s=${st.ch - 1}">Read it in the reader (WEB) →</a>` : ''}</span></div>`;
    const notesHTML = (notes.length ? notes.map(([id, t]) => `<div class="callout" style="margin:0 0 8px">${icon('info')}<div><b>${esc(V[id].short)}.</b> ${esc(t)}</div></div>`).join('') : '') + (differs.length ? `<div class="callout" style="margin:0 0 8px">${icon('info')}<div>${differs.map((id) => esc(V[id].short)).join(', ')} number${differs.length === 1 ? 's' : ''} or divide${differs.length === 1 ? 's' : ''} the verses of this chapter differently from the other Bibles, so some rows may not line up exactly. Read down a column to follow that version.</div></div>` : '') + (missing.length ? `<div class="hint" style="margin:0 0 8px">${missing.map((id) => esc(V[id].short)).join(', ')} ha${missing.length === 1 ? 's' : 've'} no ${st.code === 'PSA' ? 'Psalm' : 'chapter'} ${st.ch} here.</div>` : '');
    if (!present.length) { out.innerHTML = `<section class="card flat">${head}${notesHTML}<p class="t2">This chapter is not in the chosen versions.</p></section>`; return; }
    const first = present[0]; const cols = present.length;
    if (st.mode === 'cols') {
      out.innerHTML = `<section class="card flat rtsurface">${head}${notesHTML}<div class="bbcols" style="--cols:${cols}">${present.map((id) => `<div class="bbcol"><h4 class="bbh" title="${esc(V[id].name)}">${esc(V[id].short)}</h4><div class="reader">${bibChapterRuns(chapters[id]).map((r) => { const refTxt = id === first ? '' : (chapters[first].find((v) => v[0] === r.n) || [0, ''])[1]; return `<p class="bbp${r.n >= st.v1 && r.n <= (st.v2 || st.v1) && st.v1 ? ' hit' : ''}" data-v="${r.n}"><button class="bbnum" type="button" data-vn="${r.n}">${r.n === 0 ? 'title' : r.n}${r.end ? '–' + r.end : ''}</button>${r.orig ? `<span class="bbo">${esc(r.orig)}</span>` : ''} ${st.diff && refTxt ? diffHTML(refTxt, r.text) : esc(r.text)}</p>`; }).join('')}</div></div>`).join('')}</div></section>`;
    } else {
      const rows = bibRows(Object.fromEntries(present.map((id) => [id, chapters[id]]))); const titleless = present.filter((id) => !rows.cell(id, 0).text && rows.keys.includes(0));
      out.innerHTML = `<section class="card flat rtsurface">${head}${notesHTML}<div class="bbgrid" style="--cols:${cols}"><div class="bbrow bbhead" aria-hidden="true"><span></span>${present.map((id) => `<span class="bbh" title="${esc(V[id].name)}">${esc(V[id].short)}</span>`).join('')}</div>${rows.keys.map((k) => {
        const ref = rows.cell(first, k); const hit = st.v1 && k >= st.v1 && k <= (st.v2 || st.v1);
        return `<div class="bbrow${hit ? ' hit' : ''}" data-v="${k}"><span class="bbn">${verseNo(k, '')}</span>${present.map((id) => { const c = rows.cell(id, k);
          if (c.text) return `<div class="bbcell" data-ver="${id}"><span class="bbv">${esc(V[id].short)}</span> ${c.orig ? `<span class="bbo" title="Its own number in this version">${esc(c.orig)}</span> ` : ''}${st.diff && id !== first && ref.text ? diffHTML(ref.text, c.text) : esc(c.text)}${c.span ? ` <span class="bbo">(verses ${k}–${c.span})</span>` : ''}</div>`;
          if (c.under) return `<div class="bbcell gap" data-ver="${id}"><span class="bbv">${esc(V[id].short)}</span> <span class="muted small">with verse ${c.under}</span></div>`;
          return `<div class="bbcell gap" data-ver="${id}"><span class="bbv">${esc(V[id].short)}</span> <span class="muted small">${k === 0 && titleless.includes(id) ? 'title is part of verse 1' : 'not in this version'}</span></div>`; }).join('')}</div>`; }).join('')}</div></section>`;
    }
    const target = st.v1 ? $(`[data-v="${st.v1}"]`, out) : null; if (target && target.scrollIntoView) setTimeout(() => { if (root.isConnected !== false) target.scrollIntoView({ block: 'center' }); }, 60);
    out._data = { present, chapters };
  };
  const showVerse = async (k) => {
    one.innerHTML = `<p class="t2 small">Collecting verse ${k} from every version…</p>`;
    const all = bibVersionsWith(idx, st.code); let loaded; try { loaded = await Promise.all(all.map((v) => BIB.book(v.id, st.code))); } catch (e) { one.innerHTML = `<p class="t2">${esc(e.message)}</p>`; return; }
    const rows = all.map((v, i) => { const b = loaded[i]; const vs = b && b.chs[String(st.ch)]; const hit = vs && (vs.find((x) => x[0] === k) || vs.find((x) => x[2] && x[0] < k && k <= x[2])); return { v, hit }; });
    const ref = (rows.find((r) => r.hit) || {}).hit; const got = rows.filter((r) => r.hit);
    const label = bibRefText(nm(st.code), st.ch, k, 0);
    one.innerHTML = `<section class="card glow fade-in rtsurface"><div class="spread" style="gap:10px;flex-wrap:wrap"><h3 style="margin:0">${esc(label)} in ${got.length} version${got.length === 1 ? '' : 's'}</h3><span class="row tight"><button class="btn sm ghost" id="bbOneCopy" type="button">Copy all</button><button class="btn sm ghost" id="bbOneClose" type="button" aria-label="Close">${icon('x')}</button></span></div>
      <div class="stack sm" style="margin-top:10px">${got.map((r) => `<div class="bbone"><b>${esc(r.v.short)}</b> <span class="muted small">${esc(r.v.name)}</span><div class="reader" style="font-size:${store.get('reader.size', 18)}px">${r.hit[3] ? `<span class="bbo">${esc(r.hit[3])}</span> ` : ''}${esc(r.hit[1])}</div></div>`).join('') || '<p class="t2">No version has that verse.</p>'}</div>
      <div class="hint" style="margin-top:8px">Versions without this verse: ${rows.filter((r) => !r.hit).map((r) => esc(r.v.short)).join(', ') || 'none'}.</div></section>`;
    one._text = `${label}\n\n` + got.map((r) => `${r.v.short}: ${r.hit[1]}`).join('\n\n');
    one.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };
  /* a whole version, saved: an e-book (EPUB), plain text, Markdown, or a page to print or save as a PDF */
  const saveVersion = async () => {
    const opt = (v, t, d, chk) => `<label class="chk" style="align-items:flex-start;margin:6px 0"><input type="radio" name="bf" value="${v}"${chk ? ' checked' : ''}><span><b>${t}</b><br><span class="small t2">${d}</span></span></label>`;
    const html = `<p class="small t2" style="margin-top:0">Which version?</p><select class="select" id="bvSel" style="width:100%;margin-bottom:8px">${vers.map((v) => `<option value="${v.id}"${v.id === st.vs[0] ? ' selected' : ''}>${esc(v.name)} (${v.books.length} books)</option>`).join('')}</select>
      ${opt('epub', 'E-book (EPUB)', 'For any e-reader or reading app. One chapter of contents per book.', true)}${opt('pdf', 'Print, or save as a PDF', 'A print-ready page; choose Save as PDF in the print window.', false)}${opt('txt', 'Plain text (.txt)', 'The words alone.', false)}${opt('md', 'Markdown (.md)', 'Headings and verse numbers.', false)}${opt('html', 'Web page (.html)', 'One file for any browser.', false)}
      <label class="chk" style="margin-top:8px"><input type="checkbox" id="bvNums" checked><span class="small">Keep verse numbers</span></label><p class="small t2">It is built here in your browser; nothing is uploaded. Verses only, as in the pack.</p>`;
    const c = await modal({ title: 'Save a whole Bible version', html, actions: [{ label: 'Cancel', kind: 'ghost', value: null }, { label: 'Save', kind: 'primary', collect: (b) => ({ id: b.querySelector('#bvSel').value, fmt: (b.querySelector('input[name="bf"]:checked') || {}).value || 'epub', verses: !!b.querySelector('#bvNums').checked }) }] });
    if (!c || !V[c.id]) return; const v = V[c.id];
    try {
      toast(`Collecting ${v.short}…`, '', 2500); const list = []; for (const code of v.books) { const b = await BIB.book(v.id, code); if (b) list.push([code, BK[code] ? BK[code][1] : code, b.chs]); }
      const secs = bibSections(list); const book = { id: 'bible-' + v.id, title: v.name, author: '', rights: v.license, source: v.src, note: `${v.basis}. ${v.books.length} books, verses only.` }; const o = { marks: null, verses: c.verses };
      if (c.fmt === 'epub') download(expFilename(v.name, 'epub'), await expEpub(book, secs, o), 'application/epub+zip');
      else if (c.fmt === 'txt') download(expFilename(v.name, 'txt'), expPlain(book, secs, o), 'text/plain;charset=utf-8');
      else if (c.fmt === 'md') download(expFilename(v.name, 'md'), expMarkdown(book, secs, o), 'text/markdown;charset=utf-8');
      else if (c.fmt === 'html') download(expFilename(v.name, 'html'), expHtmlPage(book, secs, o), 'text/html;charset=utf-8');
      else { printHTML(expHtmlPage(book, secs, o)); return; }
      toast('Saved. Look in your downloads.', 'good', 3200);
    } catch (e) { toast('Could not save that: ' + e.message, 'bad', 5000); }
  };
  const copyText = async (txt, msg) => { try { await navigator.clipboard.writeText(txt); toast(msg, 'good'); } catch (e) { toast('Could not copy here. Select the text instead.', 'warn'); } };
  root.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-bv]'); if (chip && !chip.disabled) { const id = chip.dataset.bv; if (st.vs.includes(id)) { if (st.vs.length > 1) st.vs = st.vs.filter((x) => x !== id); } else if (st.vs.length >= BIB_MAX_VERSIONS) { toast(`Up to ${BIB_MAX_VERSIONS} versions at once. Remove one first, or click a verse number to see it in all of them.`, 'warn'); return; } else st.vs.push(id); render(); return; }
    const m = e.target.closest('[data-bbm]'); if (m) { st.mode = m.dataset.bbm; render(); return; }
    const vn = e.target.closest('[data-vn]'); if (vn) { showVerse(+vn.dataset.vn); return; }
    if (e.target.closest('#bbGo')) { go(); return; }
    if (e.target.closest('#bbPrev')) { if (st.ch > 1) { st.ch--; st.v1 = st.v2 = 0; render(); } else { const i = books.findIndex((b) => b[0] === st.code); if (i > 0) { st.code = books[i - 1][0]; st.ch = nChap(); st.v1 = st.v2 = 0; render(); } } return; }
    if (e.target.closest('#bbNext')) { if (st.ch < nChap()) { st.ch++; st.v1 = st.v2 = 0; render(); } else { const i = books.findIndex((b) => b[0] === st.code); if (i >= 0 && i < books.length - 1) { st.code = books[i + 1][0]; st.ch = 1; st.v1 = st.v2 = 0; render(); } } return; }
    if (e.target.closest('#bbSave')) { saveVersion(); return; }
    if (e.target.closest('#bbOneClose')) { one.innerHTML = ''; return; }
    if (e.target.closest('#bbOneCopy')) { copyText(one._text || '', 'Copied.'); return; }
    if (e.target.closest('#bbCopy')) { const d = out._data; if (!d) return; const t = `${bibRefText(nm(st.code), st.ch, st.v1, st.v2)}\n\n` + d.present.map((id) => `${V[id].short}:\n` + (d.chapters[id] || []).filter((v) => !st.v1 || (v[0] >= st.v1 && v[0] <= (st.v2 || st.v1))).map((v) => `${v[0] ? v[0] + ' ' : ''}${v[1]}`).join('\n')).join('\n\n'); copyText(t, 'Copied.'); }
  });
  const go = () => { const r = bibParseRef(refIn.value, known); if (!r) { toast('That is not a passage I know. Try John 3:16, Psalm 23 or 1 Cor 13.', 'warn'); return; } setRef(r); st.ch = clamp(st.ch, 1, nChap()); render(); };
  root.addEventListener('keydown', (e) => { if (e.target.id === 'bbRef' && e.key === 'Enter') { e.preventDefault(); go(); } });
  root.addEventListener('change', (e) => {
    if (e.target.id === 'bbBook') { st.code = e.target.value; st.ch = 1; st.v1 = st.v2 = 0; render(); }
    else if (e.target.id === 'bbCh') { st.ch = +e.target.value; st.v1 = st.v2 = 0; render(); }
    else if (e.target.id === 'bbDiff') { st.diff = e.target.checked; render(); }
  });
  render();
}
