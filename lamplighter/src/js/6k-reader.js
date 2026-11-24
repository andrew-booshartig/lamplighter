/* ═══════════════════════════ 6k · The reader: sections, progress, bookmarks and highlights ═══════════════════════════
   Opens any text in the library, three ways: one section at a time, as one long scroll, or in pages that turn (6ka-paged.js). Tracking is by section: a section counts as read when you reach its end (or tick it), and the
   book counts as read when every section is. Select words to highlight them in a colour, add a note, copy them with a citation,
   or add them to a thread. Everything is kept in this browser. */
const RD_DWELL = 6000;
const RD_PANES = [['contents', 'Contents'], ['find', 'Find'], ['marks', 'Highlights'], ['about', 'About']];      // the tabs of the reader's sheet: the list of sections, find in this text, highlights notes and bookmarks, and the text's own card
const rdCss = (n) => String(n).replace(/[^A-Za-z0-9_-]/g, '');

/* ═══ SA-01 and SA-14 of STRUCTURE_AUDIT.md (21 November 2026) ═══
   SA-01: the reader was the page people spend longest on and it named no religion and linked to nothing around it (the Random card of the same book did). Under the title it now says which religion the book is tied to, in the
   chips of the Random card's context row (psgTies in 6d-passage.js: what the records tie the book to, else the religion of its Library shelf, else the family of the shelf; nothing where none is known, and nothing is guessed);
   each chip opens that religion's page. At most RD_WHO_SHOWN are drawn; “+N” opens the sheet's About tab, where the strip of related things lists them all (relatedBox, 6zzh-related.js, guarded: the strip may not be in the build).
   SA-14: the bar said three counters on one line (“Page 1 of 69 · Section 1 of 5 · Part 1 of 5”). It says one, the page, and the name of the place; the section and the part are in the About tab (“Where you are”). */
const RD_WHO_SHOWN = 3;
const RD_WHO_WHY = { atlas: 'the records tie this book to it', shelf: 'the Library shelf this book stands on holds this religion’s books; no record ties the book to one religion', family: 'the family of the Library shelf this book stands on; no record ties the book to one religion' };
function rdWhoHTML(id, l) {
  if (!l || typeof psgTies !== 'function') return '';
  let units = []; try { units = psgTies(id, l.group) || []; } catch (e) { units = []; } if (!units.length) return '';
  const kind0 = units[0].kind; const muted = kind0 === 'shelf' ? ' psgx-fam' : '';      /* a chip that is only the religion of the book's shelf is as muted as the family chip (FINAL_AUDIT.md FA-04) */
  const chip = (name, href, why) => `<a class="chip psgx-rc${muted}" href="${esc(href)}" title="${esc(name + ': its page (' + why + ')')}">${esc(name)}</a>`;
  const one = (u) => {
    if (u.kind === 'family') return `<a class="chip psgx-rc psgx-fam" href="${esc(u.href)}" title="${esc('The religions of this family: ' + RD_WHO_WHY.family)}">${esc(u.name)}</a>`;
    const why = RD_WHO_WHY[u.kind] || RD_WHO_WHY.atlas;
    return u.branch ? `${chip(u.rootName, u.rootHref, why)}<span class="psgx-ar" aria-hidden="true">›</span>${chip(u.name, u.href, why)}` : chip(u.name, u.href, why);
  };
  const shown = units.slice(0, RD_WHO_SHOWN); const rest = units.slice(RD_WHO_SHOWN); const more = (list, cls) => (list.length ? `<button type="button" class="chip psgx-n rdwho-n ${cls}" data-rdsheet="about" title="${esc('Also: ' + list.map((x) => x.name).join(', ') + '. Opens About this text.')}">+${list.length} more</button>` : '');
  /* on a phone the row is one chip and “+N more” (the style sheet hides the units after the first below 560 px and swaps the two buttons), so the text is not pushed down by two lines of 40 px chips */
  /* where the row comes from, in words (FA-04): nothing when the records tie the book to the religion; “From its shelf:” when only the religion of its Library shelf is known; “The religions this text is filed with:” for the family of its shelf */
  const from = typeof PSG_TIE_LABEL !== 'undefined' && PSG_TIE_LABEL[kind0] ? `<span class="small muted rdwho-from">${esc(PSG_TIE_LABEL[kind0])}</span>` : '';
  const said = kind0 === 'family' ? 'The religions this text is filed with' : kind0 === 'shelf' ? 'The religion of the Library shelf this text stands on' : 'The religion this text is tied to';
  return `<div class="rdwho" role="group" aria-label="${esc(said)}">${from}${shown.map((u, k) => `<span class="rdwho-u${k ? ' rdwho-x' : ''}">${one(u)}</span>`).join('')}${more(rest, 'rdwho-nw')}${more(units.slice(1), 'rdwho-nn')}</div>`;
}
/* where a reader is, said in the bar once: the name of the section without the counters the builder wrote into it (“Chapter IV · part 2 of 5 · The opening…” is “Chapter IV”; a bare “Part 3” is nothing), and the counters kept for the About tab */
function rdPlaceOf(title, k, n) {
  const t = expTitle(title, k); const m = RD_PART.exec(t); const head = m ? String(m[1] != null ? m[1] : '').trim() : t;
  return { name: (/^Part \d+$/.test(head) ? '' : head).slice(0, 60), section: n > 1 ? `Section ${k + 1} of ${n}` : '', part: m ? `part ${m[2] || m[4]} of ${m[3] || m[5]}` : '' };
}

/* one section → paragraphs with highlights and bookmark buttons. tm: the Word help context for this text, from wordsFor(id), or nothing; the first mention of each word is counted within the section */
function readerSection(text, i, marks, find, englishOnly, tm, figs, brk, pgm) {
  let hidden = 0; let lost = 0;
  /* a page break goes before the first paragraph drawn on a new page (brk: {page(p) → the page number of paragraph p, prev → the page already reached, html(page) → the break}); outside the numbered
     blocks, like the pictures, so no highlight, bookmark or search result moves. A paragraph that is not drawn (empty, or in another language) passes its break on to the next one. */
  let reached = brk ? brk.prev : 0; const pgbrk = (p) => { if (!brk) return ''; const g = brk.page(p); if (!(g > reached)) return ''; reached = g; return g > 1 ? brk.html(g) : ''; };
  /* the printed pages (pgm: { rows(p) → [[offset, label], ...], lead(label) → a break, or null where pages are laid out in columns, inline(label) → an empty marker }, see 2z-pages-core.js): a page that begins at the
     start of a paragraph is a break before it (where the text scrolls), one that begins inside is a marker at that place; the marks of a paragraph that is not drawn pass to the next one that is */
  let carry = [];
  const pgmOf = (p, drawn, vis) => {
    if (!pgm) return { lead: '', pm: null }; const ms = pgm.rows(p);
    if (!drawn) { ms.forEach((m) => carry.push(m[1])); return { lead: '', pm: null }; }
    let lead = ''; const pm = []; carry.forEach((lab) => { if (pgm.lead) lead += pgm.lead(lab); else pm.push([0, pgm.inline(lab)]); }); carry = [];
    ms.forEach(([off, lab]) => { const o = off > 0 && off <= 12 && vis != null && !/\s/.test(vis.slice(0, off)) ? 0 : off; if (o === 0 && pgm.lead) lead += pgm.lead(lab); else pm.push([o, pgm.inline(lab)]); }); return { lead, pm: pm.length ? pm : null };      // a page the matcher put inside the first word of a paragraph (2.5% of the marks: after an opening quote, a drop capital) begins with that paragraph
  };
  const bm = new Set(marks.bm.filter((b) => b.s === i && b.p >= 0).map((b) => b.p));
  const terms = tm ? { ix: tm.ix, seen: tm.every ? null : new Set() } : null;
  /* the pictures of the printed book go between paragraphs, outside the numbered blocks, so no highlight or bookmark moves (figs: this section's entries from texts/fig, see 2z-figures-core.js) */
  const fig = (p) => (figs && figs.length ? figs.filter((f) => f[1] === p).map((f) => figHTML(f)).join('') : '');
  const blks = textBlocks(text); const lnCtx = typeof lnSection === 'function' ? lnSection(blks) : null;      // whether the section is an index: its lines are then read with looser rules (2z-lines-core.js)
  const html = fig(-1) + blks.map((blk, p) => {
    const { head, body } = blockParts(blk); let out = head != null ? `<h4 class="rh" dir="auto">${paraHTML(head, { find })}</h4>` : '';
    if (!body.trim()) { pgmOf(p, false); return out + fig(p); }
    if (englishOnly && !lnCtx && isOtherLanguage(body)) { hidden++; pgmOf(p, false); return out + fig(p); }      // (in an index the headwords are names and terms with few English words in them, and a line is never left out for that: "Aboriginal deities, i. xxxvi, 6; n. 126,")
    const vis = visibleText(body); const hls = [];
    marks.hl.forEach((h) => { if (h.s !== i || h.p !== p) return; const r = resolveAnchor(vis, h); if (r) hls.push({ id: h.id, a: r[0], b: r[1], c: h.c, n: h.n }); else lost++; });
    const pr = pgmOf(p, true, vis); const ln = typeof lnRows === 'function' ? lnRows(vis, lnCtx) : null;      // a line of a contents page or an index, drawn on a line of its own (2z-lines-core.js): the entries are found in the visible text and marked by empty tags, so no offset moves
    return pr.lead + pgbrk(p) + out + `<div class="pw${bm.has(p) ? ' bm' : ''}" data-p="${p}"><button class="pbm" type="button" data-bm="${p}" aria-pressed="${bm.has(p)}" aria-label="Bookmark this paragraph" title="Bookmark this paragraph">${icon('bookmark')}</button><p dir="auto" data-p="${p}"${ln ? ' class="ln"' : ''}>${paraHTML(body, { find, hls, terms, pm: ln ? lnPm(ln, pr.pm) : pr.pm })}</p></div>` + fig(p);
  }).join('') + (carry.length ? carry.map((lab) => (pgm.lead ? pgm.lead(lab) : pgm.inline(lab))).join('') : '');
  return { html, hidden, lost };
}
/* the words of a paragraph as the page shows them, without verse numbers */
function rdDomText(el) { const c = el.cloneNode(true); $$('.vn', c).forEach((x) => x.remove()); return c.textContent; }
function rdOffsetIn(el, node, off) {
  const r = document.createRange(); r.selectNodeContents(el); r.setEnd(node, off); const f = r.cloneContents(); $$('.vn', f).forEach((x) => x.remove()); return f.textContent.length;
}
/* a copied quotation: the words, the title and section, the edition and where the text is from (2z-source-core.js), so a passage can be traced back to its page */
function rdCitation(id, heading, quote, page) { const l = LIB_BY_ID[id]; const meta = BEATLAB_TEXTS.meta || {}; return provCite(id, l ? l.title : id, heading, quote, meta[id] || {}, { entry: typeof origEntry === 'function' ? origEntry(globalThis.BEATLAB_ORIG || {}, id, meta) : null, page }); }      // page: the printed page the quotation begins on, where the text has them ('p. 214')
async function rdCopy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fall through */ }
  try { const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch (e) { return false; }
}
/* the highlight that a selection is exactly (AA-12 of ALPHA_AUDIT.md): the same paragraph and the same span, or for a selection over several paragraphs the same pieces. A note on it goes on that highlight and does not make a second one on the same words.
   `sec` is the section the reader is in (a piece may not name one). Returns the highlight that holds the note (the first piece of a group), or null when the words are not highlighted yet. */
function rdSameHighlight(hls, pieces, sec) {
  if (!Array.isArray(hls) || !Array.isArray(pieces) || !pieces.length) return null;
  const at = (h, pc) => h.s === (pc.s != null ? pc.s : sec) && h.p === pc.p && h.a === pc.a && h.b === pc.b;
  if (pieces.length === 1) return hls.find((h) => !h.g && at(h, pieces[0])) || null;
  const first = hls.find((h) => h.g && at(h, pieces[0])); if (!first) return null;
  const group = hls.filter((h) => h.g === first.g);
  return group.length === pieces.length && pieces.every((pc) => group.some((h) => at(h, pc))) ? first : null;
}
/* the verses a selection covers (AA-11 of ALPHA_AUDIT.md): [first, last], or null when they cannot be known. `at(piece, x)` is the verse number in effect at offset x of the piece's paragraph, from the numbers the text carries, or null;
   the first is asked at the start of the selection and the last at its last character. Every piece must be in one section, and a range that runs backwards is not a range. */
function rdVerseSpan(pieces, at) {
  if (!Array.isArray(pieces) || !pieces.length || pieces.some((pc) => pc.s !== pieces[0].s)) return null;
  const f = pieces[0]; const l = pieces[pieces.length - 1]; const v1 = at(f, f.a); const v2 = at(l, Math.max(l.a, l.b - 1));
  return Number.isInteger(v1) && Number.isInteger(v2) && v1 >= 1 && v2 >= v1 ? [v1, v2] : null;
}
async function rdNoteBox(title, value) {
  return modal({ title, html: `<label class="small t2" for="rdNoteIn">Your note stays in this browser.</label><textarea class="input" id="rdNoteIn" rows="5" maxlength="${MARK_LIMITS.note}" style="width:100%;margin-top:8px">${esc(value || '')}</textarea>`, actions: [{ label: 'Cancel', kind: 'ghost', value: null }, { label: 'Save', kind: 'primary', collect: (back) => $('#rdNoteIn', back).value.trim() }] });
}

/* print a finished HTML page (the whole text laid out for paper) without putting fifteen million characters into the app's own page: it goes into a hidden frame, which is printed */
function printHTML(html) {
  const f = document.createElement('iframe'); f.setAttribute('aria-hidden', 'true'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
  f.onload = () => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { toast('Printing is not available here. Choose “Web page (.html)” instead, open it in a browser and print from there.', 'warn', 6000); } setTimeout(() => f.remove(), 120000); };
  f.srcdoc = html; document.body.appendChild(f);
}

const RD_BIG_OK = new Set();      // the big texts the person has said yes to in this visit, so the size notice (AA-21) is not shown again for them
function pathReadView(root, id, query) {
  const body = root.querySelector('#pbody'); const l = LIB_BY_ID[id];
  const reading = (on, mode) => { try { if (document.body && document.body.dataset) { if (on) { document.body.dataset.reading = '1'; if (mode) document.body.dataset.rdmode = mode; document.body.dataset.rdbar = rlGet().bar; } else { delete document.body.dataset.reading; delete document.body.dataset.rdmode; delete document.body.dataset.rdbar; } } if (typeof rtThemeColor === 'function') rtThemeColor(); } catch (e) { /* no page */ } };      // rdbar: how the bars are kept (always, as I read, hidden), for the style sheet
  if (l) { reading(true); pathOnLeave(() => reading(false)); }
  if (!l) { body.innerHTML = '<div class="card"><p>No such text. <a href="#/path/library">Back to the library</a></p></div>'; return; }
  const own = !!l && /^u-/.test(id);
  const back = `<div class="small" style="margin-bottom:10px"><a href="${own ? '#/path/own' : '#/path/library'}">← ${own ? 'Your own texts' : 'Library'}</a> · ${own ? 'Added by you' : esc((LIB_GROUPS.find((g) => g[0] === l.group) || [0, ''])[1])} · <a href="#/path/marks">Highlights and notes</a></div>`;
  body.innerHTML = `${back}<section class="card"><h2 style="font-size:24px">${esc(l.title)}</h2><p class="t2" id="rdState">Loading the text…</p></section>`;
  const failMsg = () => (copyWhere() !== 'file' && BEATLAB_TEXTS.indexed && !BEATLAB_TEXTS.meta[id] ? 'The full text for this entry is not here: it has no public-domain or openly licensed copy to include.' : loadFailText('The full text for this entry was not found. Full texts live in a <b>texts</b> folder next to <b>Lamplighter.html</b>; it is missing, or this text has no public-domain or openly licensed copy to include.'));      // from a file the folder is the thing to look at; on a web address a text the index does not list has no copy, and one it lists that did not come is a lost connection (AA-07 of ALPHA_AUDIT.md)
  const fail = () => { if (own) { body.innerHTML = `${back}<section class="card"><h2 style="font-size:24px">${esc(l.title)}</h2><div class="callout warn">${icon('warn')}<div>This text is no longer in this browser’s storage (the browser’s site data was cleared, or storage is not allowed here). If you exported a backup from Setup, importing it puts it back; or add the text again on <a href="#/path/own">Your own texts</a>.</div></div></section>`; return; } body.innerHTML = `${back}<section class="card"><h2 style="font-size:24px">${esc(l.title)}</h2><div class="callout warn">${icon('warn')}<div>${failMsg()}</div></div><p class="small t2" style="margin-top:12px">${esc(TR[l.tr].n)}</p>${TR[l.tr].q ? `<p class="small">${ext(libSearchURL(l), 'Search for a translation')}</p>` : ''}</section>`; };
  /* a big text on a website says its size first, and opens when the person says so (AA-21 of ALPHA_AUDIT.md); from a file or localhost, and for a text that is open already, nothing is asked */
  { const m0 = (BEATLAB_TEXTS.meta || {})[id]; if (!own && !RD_BIG_OK.has(id) && !BEATLAB_TEXTS.data[id] && txtIsBig(m0)) {
    body.innerHTML = `${back}<section class="card"><h2 style="font-size:24px">${esc(l.title)}</h2><p class="t2" id="rdBig" style="max-width:62ch"><b>Large text: ${txtSizeLabel(m0.chars)}.</b> On the web it is downloaded when it opens, which can take a while on a slow connection.</p><div class="row"><button class="btn primary" type="button" data-rdbig>Open anyway</button><a class="btn ghost" href="${own ? '#/path/own' : '#/path/library'}">Back to the library</a></div></section>`;
    const go = body.querySelector('[data-rdbig]'); if (go) go.addEventListener('click', () => { RD_BIG_OK.add(id); Router.render(); }); reading(false); return; } }
  Promise.all([TXT.load(id), TXT.figs(id), TXT.pages(id)]).then(([t, figsRaw, pgsRaw]) => {
    if (root.isConnected === false) return; // the reader moved on while this loaded
    if (!t) { reading(false); return fail(); }
    document.title = l.title + ' · Lamplighter';
    const st = PATH.get(); const secs = t.secs; const n = secs.length; const m = t.meta;
    const fz = (globalThis.BEATLAB_FIGN || {})[id]; const figsAll = fz && fz[2] && (fz[2] !== m.chars || (fz[3] && fz[3] !== n)) ? [] : figClean(figsRaw, n);      /* the printed book's pictures (texts/fig-<id>.js), unless the text was rebuilt since they were placed (they are fixed to its paragraphs) */ let find = (query.f || '').trim().slice(0, RDF_MAX); const size = store.get('reader.size', 18);
    let marks = MARKS.get(id);
    const pgx = pgsRaw ? pgmClean(pgsRaw.rows, n) : null; const hasPrinted = !!(pgx && pgx.flat.length); const printedGrade = hasPrinted ? pgsRaw.grade : ''; const pgVols = hasPrinted && pgsRaw.vols > 1 ? Array.from({ length: pgsRaw.vols }, (_, v) => 'Vol. ' + (v + 1)) : [];      // the printed page numbers of a scanned text, found from the scan (2z-pages-core.js)
    const ver = `${n}:${m.chars || 0}`;                            // the text as built; a rebuild changes it
    if ((marks.hl.length || marks.bm.length) && marks.v !== ver) {  // a rebuilt text can move paragraphs: find any mark that is no longer where it was, once per build
      const moved = MARKS.upd(id, (mm) => { const k = marksRelocate(secs, mm); mm.v = ver; return k; });
      marks = MARKS.get(id);
      if (moved) toast(`${moved === 1 ? 'One' : moved} of your highlights or bookmarks in this book moved with the text after a clean-up.`, 'good');
    }
    const hasS = query.s != null && query.s !== '';
    const fm = provInfo(id, (BEATLAB_TEXTS.meta || {})[id], null).kind === 'scan' ? rdFront(secs) : null;      // a scan that begins with a title page, an imprint and noise: where its text begins (2z-reader-core.js)
    const autoStart = !!fm && !hasS && (query.p == null || query.p === '') && !query.h && !(marks.last && marks.last.s < n);      // nothing says where to open (no address, no saved place): at the beginning of the text, not of the title page; "Front matter" in the contents goes back to it
    const i = clamp(hasS ? parseInt(query.s, 10) || 0 : (marks.last && marks.last.s < n ? marks.last.s : 0), 0, n - 1);
    const wantP = query.p != null && query.p !== '' ? parseInt(query.p, 10) : (autoStart ? fm.p : (!hasS && marks.last && marks.last.s === i ? marks.last.p : -1));
    const landRaw = hasS && query.r != null && query.r !== '';
    const asked = query.m === 'page' || query.m === 'sheet' || query.m === 'scroll' || query.m === 'section' ? query.m : (query.w === '1' ? 'scroll' : '');
    const mode = asked || (landRaw ? 'section' : rlGet().mode);       // how it is read: one section at a time, as one long scroll, or in pages that turn
    const whole = mode === 'scroll'; const isSheets = mode === 'sheet'; const paged = mode === 'page' || isSheets; const cont = whole || paged;   // cont: the text carries on without leaving the page
    reading(true, mode); if (asked && !landRaw && rlGet().mode !== asked) rlSet({ mode: asked }, true);      // a link that asks for a way of reading makes it the reader's own
    const modeQ = (m2) => (m2 === 'scroll' ? { w: '1' } : m2 === 'page' ? { m: 'page' } : m2 === 'sheet' ? { m: 'sheet' } : rlGet().mode !== 'section' ? { m: 'section' } : {});
    const link = (s, extra = {}) => '#/path/read/' + id + '?' + new URLSearchParams(Object.assign({ s, f: find }, modeQ(mode), extra));
    /* arriving by "random page": the page that was drawn is marked, with a note on how to find its context */
    const landing = !cont && landRaw; const landEnd = landing && query.e != null && query.e !== '' ? Math.max(wantP, parseInt(query.e, 10) || wantP) : wantP;
    const landSeed = landing && randSeedOk(query.d) ? query.d : '';
    const landHTML = () => !landing ? '' : `<section class="card flat rdland" id="rdLand" style="margin:12px 0"><div class="eyebrow">A random page</div><p class="small t2" style="margin:4px 0 8px;max-width:70ch">You landed in <b>section ${i + 1} of ${n}${psgHeadSegs(secs[i][0]).length ? ' · ' + esc(psgHeadSegs(secs[i][0]).join(' · ').slice(0, 80)) : ''}</b>. The page that was drawn is marked in the margin below. It was cut from the middle of the book, so scroll up and down for what comes before and after, or use <b>Previous</b> and <b>Next</b> for the neighbouring sections.</p><div class="row"><a class="btn primary dice" href="#/path/read-random">${icon('dice')}A page from any book</a><a class="btn dice" href="#/path/read-random?b=${id}">Another page from this book</a><a class="btn ghost" href="${link(i, { p: '', r: '' })}">Start of this section</a>${landSeed ? `<a class="btn ghost" href="#/path/passage?code=${psgCode(id, 'long', landSeed)}">Read it on its own</a>` : ''}</div>${landSeed ? `<details><summary>How this page was drawn</summary><div class="small t2" style="line-height:1.6">Drawn with the system’s secure random generator: one shelf of the Library at random, then one book on it, then a clean stretch of text in that book. Draw code <code style="word-break:break-all">${esc(psgCode(id, 'long', landSeed))}</code></div></details>` : ''}</section>`;
    const mayHave = textMayHaveOriginals(id); const eng = mayHave && store.get('reader.eng', true);
    const skipOther = (b) => eng && isOtherLanguage(b); let fres = rdFindAll(secs, find, { max: 400, skip: skipOther }); let cur = -1;      // the matches for what is being found, and the one being shown
    const save = (fn) => { MARKS.upd(id, (mm) => { mm.n = n; return fn(mm); }); marks = MARKS.get(id); };
    const sec = cont ? { hidden: 0 } : readerSection(secs[i][1], i, marks, find, eng, wordsFor(id), figsOf(figsAll, i));
    const prog = () => progressOf(marks, n);
    const progHTML = () => { const p = prog(); return `<div class="rdprog"><div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p.pct}" aria-label="Sections read"><i style="width:${p.pct}%"></i></div><span class="small t2">${p.done} of ${p.total} section${p.total === 1 ? '' : 's'} read${p.done && p.done < p.total ? ` · <a href="${link(firstUnread(marks, n))}">first unread</a>` : ''}</span></div>`; };
    const hlCount = () => marks.hl.length; const bmCount = () => marks.bm.length;
    const secBm = () => marks.bm.some((b) => b.s === i && b.p === -1);
    /* page breaks in the views that scroll (by section, scroll): at each new page of the reader's own count a line, and the number unless the reader chose a line alone. A page is about 300 words and is not the printed page: a tap on the number says so, and says where the printed page is (pageCard). */
    const pgBreakHTML = (g) => (rlGet().div === 'line' ? '<div class="pgbrk pgbrk-line" role="separator" aria-hidden="true"></div>' : `<button type="button" class="pgbrk" data-pgbrk="${g}" aria-label="Page ${g}. Where is this in the original book?" title="Page ${g} of ${totalPages.toLocaleString()}. Tap to see where this is in the original book."><span>Page ${g}</span></button>`);
    const printedTitle = (lab) => `${pgmShort(lab, pgVols)}${pgmParse(lab) && pgmParse(lab).inferred ? ' (inferred)' : ''}`;
    const printedBreakHTML = (lab) => (rlGet().div === 'line' ? '<div class="pgbrk pgbrk-line" role="separator" aria-hidden="true"></div>' : `<button type="button" class="pgbrk pgbrk-print${pgmParse(lab).inferred ? ' inf' : ''}" data-pgp="${esc(lab)}" aria-label="${esc(printedTitle(lab))} of the printed edition. Where is this in the original book?" title="${esc(printedTitle(lab))} of the printed edition. Tap for the details."><span>${esc(printedTitle(lab))}</span></button>`);
    const printedInlineHTML = (lab) => (rlGet().div === 'line' ? '<span class="pgm pgm-tick" aria-hidden="true"></span>' : `<span class="pgm${pgmParse(lab).inferred ? ' inf' : ''}" data-pgp="${esc(lab)}" data-t="${esc(printedTitle(lab))}" role="button" tabindex="0" aria-label="${esc(printedTitle(lab))} of the printed edition begins here" title="${esc(printedTitle(lab))} of the printed edition begins here. Tap for the details."></span>`);
    const pgmFor = (k) => (hasPrinted && rlGet().div !== 'off' ? { rows: (p) => pgmIn(pgx.map, k, p), lead: paged ? null : printedBreakHTML, inline: printedInlineHTML } : null);
    const brkFor = (k) => { if (paged || hasPrinted || rlGet().div === 'off') return null; const pm = pages.pageMap(k); return { page: (p) => (pm[p] != null ? pm[p] : pm[pm.length - 1]), prev: pages.lastPage(k), html: pgBreakHTML }; };
    const secHTML = (k) => { const b = brkFor(k); let lead = ''; if (b) { const g0 = b.page(0); if (g0 > b.prev) { lead = g0 > 1 ? b.html(g0) : ''; b.prev = g0; } }      // a section that starts a new page has its break above its title
      const s2 = readerSection(secs[k][1], k, marks, find, eng, wordsFor(id), figsOf(figsAll, k), b, pgmFor(k)); return `${paged && k === 0 ? whoRow : ''}${paged && imagLead ? imagNote : ''}${paged && k === 0 ? provNote : ''}${lead}<h3 class="rtitle" dir="auto">${esc(typeof lnTitle === 'function' ? lnTitle(secs[k][0]) : secs[k][0])}</h3>${s2.html}${s2.lost ? `<p class="small muted">${s2.lost} highlight${s2.lost === 1 ? '' : 's'} in this section could not be placed because the text has changed. They are kept in <a href="#/path/marks?t=${id}">Highlights and notes</a>.</p>` : ''}<div class="rdend" aria-hidden="true"></div>`; };
    const articleHTML = () => `<div class="rdsec on" data-s="${i}" id="rds-${i}">${secHTML(i)}</div>`;
    const pages = rdPages(secs); const totalPages = pages.total;       // a page, for finding your place: about a printed page of text
    save((mm) => { mm.last = { s: i, p: Math.max(0, wantP), t: Date.now(), f: Math.round(rdShare(pages.paraOff(i, Math.max(0, wantP)), pages.cum[n]) * 10000) / 10000 }; });
    const imagLead = libImagined(id) ? 'Imagined · ' : '';      // fiction is labelled wherever it is read, in every view (a text of the imagined shelf)
    const imagNote = '<div class="rd-imagined rd-imagined-in" role="note"><b>Imagined</b> · a work of the imagination, never meant as scripture. <a href="#/path/imagined">About this shelf</a></div>';
    const here0 = rdPlaceOf(secs[i][0], i, n); const first0 = `Page ${pages.pageAt(i, Math.max(0, wantP)).toLocaleString()} of ${totalPages.toLocaleString()}${here0.name ? ' · ' + here0.name : ''}`;      // the bar's second line before the first scroll: one counter (SA-14), the page, and the name of the place
    const relAbout = typeof relatedBox === 'function' ? relatedBox('text', id, {}) : '';      // the full strip of related things, in the sheet's About tab (6zzh-related.js)
    const relEnd = !paged && (whole || i === n - 1) && typeof relatedBox === 'function' ? relatedBox('text', id, { skip: ['traditions', 'time', 'conflicts'] }) : '';      // and once at the end of the text, never on every page of a long one: under the last section's Previous / Mark read (the row of religions is already under the title; the events are in the About tab's strip, and the two never list the same ones: L-12)
    const whoRow = rdWhoHTML(id, l);      // SA-01: the religion this text is tied to, under the title (nothing when none is known)
    let prov = provInfo(id, (BEATLAB_TEXTS.meta || {})[id], null); const provNote = provStripHTML(prov, hasPrinted);      // a scanned text says so, and where its original pages are (6kp-source.js); the scans of a text of several volumes are filled in when texts/originals.js arrives
    const slimBar = `<div class="rdtop" id="rdTop" role="toolbar" aria-label="Reader"><a class="rdb" href="#/path/library" aria-label="Back to the Library" title="Back to the Library">←</a><button class="rdtt" type="button" data-rdsheet="info" aria-label="This text: contents, find, details"><b>${esc(l.title)}</b><span id="rdSub">${imagLead}${isSheets ? 'PDF sheets' : paged ? 'Book pages' : whole ? 'Scroll' : first0}</span></button><span class="rdbtns"><button class="rdb" type="button" data-rdact="views" aria-haspopup="menu" aria-expanded="false" aria-label="How it is read: change the view" title="How it is read: change the view (v)">${icon('layers')}</button><button class="rdb rdx" type="button" data-rdsheet="marks" aria-label="Highlights, notes and bookmarks" title="Highlights, notes and bookmarks (m)">${icon('pen')}</button><button class="rdb rdx" type="button" id="rdListenBtn" data-rdact="listen" aria-label="Read aloud" title="Read aloud (l)" hidden>${icon('headphones')}</button><button class="rdb" type="button" data-rdsheet="contents" aria-label="Contents" title="Contents (c)">${icon('list')}</button><button class="rdb" type="button" data-rdsheet="find" aria-label="Find in this text" title="Find in this text">${icon('search')}</button><button class="rdb rdbbm" type="button" data-rdact="bookmark" aria-pressed="false" aria-label="Bookmark this place" title="Bookmark this place">${icon('bookmark')}</button><button class="rdb" type="button" data-rtopen aria-label="Reading settings: theme, type and spacing" title="Reading settings (a)">Aa</button>${document.fullscreenEnabled ? `<button class="rdb rdx" type="button" id="rdFsBtn" data-rdact="fullscreen" aria-label="Full screen" title="Full screen (z)">${icon('expand')}</button>` : ''}<button class="rdb rdx" type="button" id="rdHideBtn" data-rdact="hidebar" aria-label="Hide the bars" title="Hide the bars (h)">${icon('chevup')}</button><button class="rdb" type="button" data-rdact="more" aria-haspopup="menu" aria-expanded="false" aria-label="More" title="More">${icon('more')}</button></span><div class="rdmeter" id="rdMeter" role="progressbar" aria-label="How far through this text" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div></div>`;
    const appNav = `<nav class="rdnav small" aria-label="The rest of the Lamplighter Project">${(typeof NAV !== 'undefined' ? NAV : []).map((x) => `<a href="${x.href || '#/' + x.id}">${esc(x.label)}</a>`).join('')}</nav>`;
    const moreMenu = `<div class="rdmore" id="rdMore" role="menu" aria-label="More" hidden></div>`;
    const pagedHTML = `<div class="pgrun${imagLead ? ' imag' : ''}" aria-hidden="true">${imagLead ? '<span class="pgimag">Imagined · never meant as scripture</span>' : ''}<span id="pgRunT"></span></div><div class="pgview" id="pgView"><div class="pgclip reader" id="pgClip"><div class="pgcols" id="pgCols"></div></div><button class="pgedge prev" type="button" data-pgturn="-1" aria-label="Previous page" tabindex="-1">‹</button><button class="pgedge next" type="button" data-pgturn="1" aria-label="Next page" tabindex="-1">›</button></div><div class="pgfoot" aria-hidden="true"><span id="pgFootL"></span><span id="pgFootR"></span></div><svg class="pgrib" id="pgRib" viewBox="0 0 22 34" aria-hidden="true" hidden><path d="M0 0h22v34l-11-9-11 9z" fill="currentColor"/></svg><div class="pgend card" id="pgEnd" role="dialog" aria-label="End of the text" hidden><b>End of ${esc(l.title)}</b><p class="small t2" style="margin:6px 0 12px">You have reached the last page.</p><div class="row" style="justify-content:center"><a class="btn primary" href="#/path/library">Back to the Library</a><a class="btn dice" href="#/path/read-random?b=${id}">${icon('dice')}Another page from this book</a><button class="btn ghost" type="button" data-pgclose>Keep reading</button></div></div><div class="sr-only-live" id="pgLive" role="status" aria-live="polite"></div>`;
    const findBarHTML = `<div class="rdfindbar" id="rdFindBar" role="group" aria-label="Matches" hidden><button class="rdb" id="rdFbPrev" type="button" aria-label="Previous match" title="Previous match">↑</button><span class="small" id="rdFindBarT"></span><button class="rdb" id="rdFbNext" type="button" aria-label="Next match" title="Next match">↓</button><button class="rdb" id="rdFbClear" type="button" aria-label="Clear the search" title="Clear the search">${icon('x')}</button></div>`;
    const barExtras = `<button class="rdtab" id="rdTab" type="button" data-rdact="showbar" aria-label="Show the bars" title="Show the bars (h)" hidden><i></i></button>${paged ? '' : '<div class="rdref" id="rdRef" aria-hidden="true" hidden><span id="rdRefL"></span><span id="rdRefR"></span></div>'}`;      // the tab that brings the bars back, and (where the text scrolls in the page itself) a thin line that keeps the section and page in view while they are away
    body.innerHTML = `${slimBar}${barExtras}${paged ? '' : whoRow}${libImagined(id) ? '<div class="rd-imagined" role="note"><b>Imagined</b> · a work of the imagination, never meant as scripture. <a href="#/path/imagined">About this shelf</a></div>' : ''}${provNote}${moreMenu}${findBarHTML}<div class="rdsheet" id="rdSheet" role="dialog" aria-label="Contents, find, highlights and about this text" hidden><div class="rdsheet-in"><div class="rdsh-top"><div class="spread" style="align-items:center"><b>${esc(READER_NAME)}</b><button class="btn sm ghost" type="button" data-sheetclose aria-label="Close">${icon('x')}</button></div><div class="rdtabs" role="tablist" aria-label="This text">${RD_PANES.map(([pid, nm]) => `<button type="button" class="rdtabb" role="tab" id="rdTab-${pid}" data-rdpane="${pid}" aria-selected="${pid === 'contents'}" aria-controls="rdPane-${pid}" tabindex="${pid === 'contents' ? 0 : -1}">${nm}</button>`).join('')}</div></div>
      <div class="rdpane" id="rdPane-contents" role="tabpanel" aria-labelledby="rdTab-contents"><div id="rdProg" class="rdpane-prog">${progHTML()}</div><div class="toclist rdtoc" id="rdToc"><div id="rdTocList"></div></div></div>
      <div class="rdpane" id="rdPane-find" role="tabpanel" aria-labelledby="rdTab-find" hidden><div class="rdfindrow"><input class="input" id="rdFind" type="search" placeholder="Find in this text…" value="${esc(find)}" aria-label="Find in this text" autocomplete="off" spellcheck="false"><button class="btn sm ghost" id="rdFindPrev" type="button" aria-label="Previous match" title="Previous match (Shift+Enter)">↑</button><button class="btn sm ghost" id="rdFindNext" type="button" aria-label="Next match" title="Next match (Enter)">↓</button></div>
        <div class="small t2" id="rdFindN" role="status" aria-live="polite" style="margin-top:6px"></div><div class="rhits" id="rdHits"></div></div>
      <div class="rdpane" id="rdPane-marks" role="tabpanel" aria-labelledby="rdTab-marks" hidden><div id="rdMarks"><div class="rdpane-h">Highlights, notes and bookmarks <span id="rdMarkN">(${marks.hl.length + marks.bm.length})</span></div><div class="toclist" id="rdMarksList"></div></div><div class="small t2" id="rdMine" style="margin-top:10px">${marksLine()}</div></div>
      <div class="rdpane" id="rdPane-about" role="tabpanel" aria-labelledby="rdTab-about" hidden><section class="card flat rdabout"><div class="spread" style="align-items:flex-start;gap:12px;flex-wrap:wrap"><div><div class="eyebrow">${esc(m.by || '')}</div><h2 style="font-size:26px;margin:4px 0">${esc(l.title)}</h2><div class="small muted">${esc(l.when)} · ${m.chars < 1000 ? m.chars : (m.chars / 1000).toFixed(0) + 'k'} characters · ${n} section${n === 1 ? '' : 's'}</div><div class="small t2 rdwhere" id="rdWhere"></div></div>
        <label class="chk"><input type="checkbox" data-read="${id}"${st.read[id] ? ' checked' : ''}><span class="small">I have read this</span></label>${shelfBtnHTML(id, shfContext())}</div>
      <div class="hint" id="rdLic" style="margin-top:10px">${esc(m.license || '')}${m.src ? ` · ${ext(m.src, 'source')}` : ''}${m.note ? `<br>${esc(m.note)}` : ''}</div>
      <div id="rdOrig" style="margin-top:10px"></div>
      <div class="row" style="margin-top:14px">${n > 1 ? `${cont ? '' : `<a class="btn sm ${i ? '' : 'ghost'}" href="${link(Math.max(0, i - 1))}" aria-label="Previous section">← Previous</a>`}<select class="select" id="rdSec" style="width:auto;max-width:300px" aria-label="Section">${secs.map((s, k) => `<option value="${k}"${k === i ? ' selected' : ''}>${marks.rs.includes(k) ? '✓ ' : ''}${esc(s[0].slice(0, 70))}</option>`).join('')}</select>${cont ? '' : `<a class="btn sm ${i < n - 1 ? '' : 'ghost'}" href="${link(Math.min(n - 1, i + 1))}" aria-label="Next section">Next →</a>`}` : ''}
        <span class="row tight" style="margin-left:auto"><button class="btn sm" id="rdSave" type="button" title="Save this whole text as an e-book, plain text, Markdown or a printable page">${icon('download')}Save…</button>${RT_BUTTON}<button class="btn sm ghost" id="rdMinus" aria-label="Smaller text">A−</button><button class="btn sm ghost" id="rdPlus" aria-label="Larger text">A+</button></span></div>
      <details class="toc rdhow" id="rdHow"><summary>How to read: <span id="rdHowNow">${esc(rlViewNow(mode))}</span></summary>${rlViewsHTML(mode)}</details>
      <div class="row" style="margin-top:10px">
        ${cont ? '' : `<button class="btn sm ghost" id="rdBmSec" type="button" aria-pressed="${secBm()}">${icon('bookmark')}<span>${secBm() ? 'Bookmarked' : 'Bookmark section'}</span></button>`}<a class="btn sm ghost dice" href="#/path/passage?b=${id}" title="A random passage from this book, on the Random page">${icon('dice')}Random from this book</a><a class="btn sm ghost dice" href="#/path/read-random?b=${id}" title="Jump to a random page of this book, and read around it">${icon('dice')}Another page from this book</a><a class="btn sm ghost dice" href="#/path/read-random" title="Jump to a random page of a random book, and read around it">${icon('dice')}A page from any book</a></div>
      </section>
    ${relAbout ? `<section class="rdrel" id="rdRelAbout" aria-label="Related">${relAbout}</section>` : ''}
    ${mayHave && (cont || sec.hidden || !eng) ? `<div class="small t2" style="margin:12px 0 -6px"><label class="chk"><input type="checkbox" id="rdEng"${eng ? ' checked' : ''}><span>English only</span></label>${sec.hidden ? ` <span class="muted">${sec.hidden} original-language line${sec.hidden === 1 ? '' : 's'} hidden in this section</span>` : ''}</div>` : ''}</div></div></div>
    ${landHTML()}
    ${paged ? `<article class="rdpaged rtsurface" id="rdText" aria-label="${esc(l.title)}">${pagedHTML}</article>` : `<article class="card reader fade-in${whole ? ' rdwhole' : ''}" id="rdText" style="font-size:${size}px">${whole ? '<div id="rdTopS"></div><div id="rdSecs"></div><div id="rdBotS"></div>' : articleHTML()}</article>`}
    ${cont ? `<div class="rdbar" id="rdBar" role="group" aria-label="Where you are in this text"><span class="rdpg" id="rdPage">Page 1 of ${totalPages.toLocaleString()}</span><span class="small t2" id="rdLeft" style="white-space:nowrap"></span><input type="range" id="rdSlide" min="1" max="${totalPages}" value="1" aria-label="Page"><label class="small" style="white-space:nowrap">Go to page <input class="input" id="rdGoPage" type="number" min="1" max="${totalPages}" style="width:5.6em"></label></div><button class="rdback" id="rdBack" type="button" hidden></button>` : '<div id="rdEnd" aria-hidden="true"></div>'}
    <div class="row rdfoot"${cont ? ' hidden' : ''}><label class="chk"><input type="checkbox" id="rdSecRead"${marks.rs.includes(i) ? ' checked' : ''}><span class="small">This section is read</span></label>
      <span class="row tight" style="margin-left:auto">${n > 1 ? `<a class="btn" href="${link(Math.max(0, i - 1))}">← Previous</a><span class="muted small">${i + 1} of ${n}</span>${i < n - 1 ? `<a class="btn primary" id="rdDone" href="${link(i + 1)}">Mark read &amp; next →</a>` : `<button class="btn primary" id="rdDoneLast" type="button">Mark read</button>`}` : '<button class="btn primary" id="rdDoneLast" type="button">Mark read</button>'}</span></div>
    ${relEnd ? `<section class="rdrel rdrel-end" id="rdRelEnd" aria-label="Related"${whole ? ' hidden' : ''}>${relEnd}</section>` : ''}
    <p class="small muted" id="rdHint" style="margin-top:6px">${cont ? 'Page numbers in the bar are a guide to where you are (about 300 words each), the same on every screen. ' : ''}A section counts as read when you reach its end here, or when you tick it. Select any words to highlight them, add a note, copy them with a citation, or put them in a passage set.</p>`;

    function marksLine() { const a = marks.hl.length; const b = marks.bm.length; return a || b ? `You have ${a} highlight${a === 1 ? '' : 's'} and ${b} bookmark${b === 1 ? '' : 's'} in this text. <a href="#/path/marks?t=${id}">See them</a>` : 'No highlights or bookmarks in this text yet.'; }
    const art = $('#rdText', body);
    const secIdx = (el) => { const w = el && el.closest ? el.closest('[data-s]') : null; return w ? +w.dataset.s : i; };      // the section a paragraph or highlight is in
    const renderArticle = () => { refreshMarks(); if (paged) { pg.refresh(); } else if (whole) { $$('.rdsec', art).forEach((d) => { d.innerHTML = secHTML(+d.dataset.s); }); } else art.innerHTML = articleHTML(); $('#rdMine', body).innerHTML = marksLine(); };
    const refreshProg = () => { $('#rdProg', body).innerHTML = progHTML(); const sel = $('#rdSec', body); if (sel) Array.from(sel.options).forEach((o, k) => { o.textContent = (marks.rs.includes(k) ? '✓ ' : '') + secs[k][0].slice(0, 70); }); const sr = $('#rdSecRead', body); if (sr && !whole) sr.checked = marks.rs.includes(i); };

    /* reading progress: mark a section, and the whole book when the last one is done */
    const markSection = (on, quiet, k = i) => {
      const fresh = on && !marks.rs.includes(k); save((mm) => { rsSet(mm, k, on); }); refreshProg();
      if (fresh && !cont && secs[k]) SHELVES.log(Math.min(secs[k][1].length, SHF_JUMP), Date.now());      // a section read in the one-at-a-time view is the reading of that day (the other views are counted as the place moves)
      if (on && prog().done >= n && !PATH.get().read[id]) { shfMarkRead(id, true); const c = $('[data-read]', body); if (c) c.checked = true; if (!quiet) toast(`You have read all of “${esc(l.title)}”. It is marked as read in the library.`, 'good', 5200); }
    };
    if (!whole) $('#rdSecRead', body).addEventListener('change', (e) => markSection(e.target.checked));
    const done = $('#rdDone', body); if (done && !whole) done.addEventListener('click', () => { if (!marks.rs.includes(i)) markSection(true); });
    const doneLast = $('#rdDoneLast', body); if (doneLast && !whole) doneLast.addEventListener('click', () => { markSection(true); });
    let reached = false; let marked = marks.rs.includes(i); const t0 = Date.now(); let timer = null;
    const maybeAuto = () => { if (marked || !reached) return; const wait = RD_DWELL - (Date.now() - t0); if (wait > 0) { if (!timer) timer = setTimeout(() => { timer = null; maybeAuto(); }, wait + 50); return; } marked = true; markSection(true); };
    let io = null;
    if (!cont && typeof IntersectionObserver !== 'undefined') { io = new IntersectionObserver((es) => { es.forEach((e) => { reached = e.isIntersecting; maybeAuto(); }); }, { threshold: 0 }); io.observe($('#rdEnd', body)); }

    /* contents: one row to a section, with what the scan's OCR left in the title taken away (rdTocLabel), the long sections of a scan that were cut into parts grouped under their heading (rdTocRows), and, for a scan
       that begins with a title page and an imprint, a first row "Front matter" (rdFront): the section's own row then goes to where the text begins */
    const tocRows = rdTocRows(secs.map((s) => s[0]));
    const fillToc = () => {
      const list = $('#rdTocList', body); if (!list) return; const bms = new Set(marks.bm.map((b) => b.s)); const hls = {}; marks.hl.forEach((h) => { hls[h.s] = (hls[h.s] || 0) + 1; }); const here = curSec();
      const tags = (k) => `${bms.has(k) ? ` <span class="tag">${icon('bookmark')}</span>` : ''}${hls[k] ? ` <span class="tag">${hls[k]} highlight${hls[k] === 1 ? '' : 's'}</span>` : ''}`;
      const front = fm ? `<a href="${link(0)}" data-jump="0" class="rdfm" title="The title page, the imprint and the pages before the text begins"><span class="ck"></span><span class="tcl"><span class="tct">Front matter</span><span class="tch">title page, imprint, and what comes before the text</span></span></a>` : '';
      list.innerHTML = front + tocRows.map((r) => {
        const k = r.k; const read = marks.rs.includes(k); const at = fm && k === 0 ? fm.p : -1;
        return `${r.group ? `<div class="tocg">${esc(r.group)}</div>` : ''}<a href="${link(k, at >= 0 ? { p: at } : {})}" data-jump="${k}"${at >= 0 ? ` data-jp="${at}"` : ''} title="${esc(r.title)}"${k === here ? ' aria-current="page"' : ''} class="${read ? 'rd' : ''}${r.part ? ' tcp' : ''}"><span class="ck">${read ? '✓' : ''}</span><span class="tcl"><span class="tct">${esc(r.label.slice(0, 140))}</span>${r.hint ? `<span class="tch">${esc(r.hint)}</span>` : ''}</span>${tags(k)}</a>`;
      }).join('');
      const cur = $('[aria-current]', list); if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'center' });
    };
    /* the tabs of the sheet: only the one chosen is shown, so the list of sections is what opens, and the card of the text is one tap away */
    let pane = 'contents';
    const showPane = (name) => {
      pane = RD_PANES.some((x) => x[0] === name) ? name : 'contents';
      RD_PANES.forEach(([x]) => { const tb = $('#rdTab-' + x, body); const pn = $('#rdPane-' + x, body); if (tb && tb.setAttribute) { tb.setAttribute('aria-selected', String(x === pane)); tb.tabIndex = x === pane ? 0 : -1; } if (pn) pn.hidden = x !== pane; });
      if (pane === 'contents') fillToc(); else if (pane === 'marks') fillMarks();
    };
    const tabsEl = $('.rdtabs', body);
    if (tabsEl) {
      tabsEl.addEventListener('click', (e) => { const b = e.target.closest ? e.target.closest('[data-rdpane]') : null; if (b) showPane(b.dataset.rdpane); });
      tabsEl.addEventListener('keydown', (e) => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; const b = e.target.closest ? e.target.closest('[data-rdpane]') : null; if (!d || !b) return; e.preventDefault(); const ix = RD_PANES.findIndex((x) => x[0] === b.dataset.rdpane); const nx = RD_PANES[(ix + d + RD_PANES.length) % RD_PANES.length][0]; showPane(nx); const nb = $('#rdTab-' + nx, body); if (nb && nb.focus) nb.focus(); });
    }

    /* header controls */
    const engBox = $('#rdEng', body); if (engBox && engBox.addEventListener) engBox.addEventListener('change', () => { store.set('reader.eng', engBox.checked); Router.render(); });
    const sel = $('#rdSec', body); if (sel) sel.addEventListener('change', () => { if (cont) { jumpTo(+sel.value); const sh = $('#rdSheet', body); if (sh) sh.hidden = true; } else location.hash = link(+sel.value); });
    /* finding is below, with the rest of what the sheet does */
    const bump = (d) => { const v = rtSizeStep(store.get('reader.size', 18), d); rtSetSize(v); if (!paged) art.style.fontSize = v + 'px'; };
    $('#rdMinus', body).addEventListener('click', () => bump(-1)); $('#rdPlus', body).addEventListener('click', () => bump(1));
    const bmSec = $('#rdBmSec', body); if (bmSec && !whole) bmSec.addEventListener('click', () => { const on = (save((mm) => bmToggle(mm, i, -1, secs[i][0], 0, secs[i][0])), secBm()); const b = $('#rdBmSec', body); b.setAttribute('aria-pressed', on); b.querySelector('span').textContent = on ? 'Bookmarked' : 'Bookmark section'; $('#rdMine', body).innerHTML = marksLine(); });

    /* bookmarks on paragraphs */
    art.addEventListener('click', (e) => {
      const b = e.target.closest('.pbm'); if (!b) return; const p = +b.dataset.bm; const pw = b.closest('.pw'); const sI = secIdx(b);
      const snip = paragraphAt(secs, sI, p) || ''; save((mm) => bmToggle(mm, sI, p, snip, 0, secs[sI][0])); const on = marks.bm.some((x) => x.s === sI && x.p === p);
      b.setAttribute('aria-pressed', on); pw.classList.toggle('bm', on); $('#rdMine', body).innerHTML = marksLine(); refreshMarks(); toast(on ? 'Bookmarked. Find it again in Highlights and notes.' : 'Bookmark removed.', '', 1800);
    });

    /* selecting words: highlight, note, copy, thread */
    const nbOk = typeof NB !== 'undefined' && !!NB && typeof NB.clip === 'function';      // the Notebook (6zn-notebook.js) gives the Clip button something to call; without it the button stays hidden
    /* the tools for selected words (UX-25 of UX_AUDIT.md): the first row is what is done most (Highlight in the last colour used, Colours for the others, Note, Clip to notebook), and the rest are behind "⋯" */
    const hlc = () => { const c = store.get('reader.hlc', 'gold'); return HL_IDS.includes(c) ? c : 'gold'; };      // the colour of the last highlight made: the one the Highlight button uses
    const hlName = (c) => (HL_COLORS.find((x) => x[0] === c) || [0, 'Gold'])[1];
    const bar = h(`<div class="selbar" role="toolbar" aria-label="Highlight and note tools" hidden><div class="selq" id="selQ"></div><div class="small t2 selnb" id="selNb" hidden></div><div class="row tight selmain"><button class="btn sm selhl" type="button" id="selHl" data-hc="${hlc()}" title="Highlight these words in ${esc(hlName(hlc()))}; Colours has the others"><span class="hlsw hl-${hlc()}" aria-hidden="true"></span>Highlight</button><button class="btn sm ghost" type="button" id="selColBtn" data-sa="colours" aria-expanded="false" aria-controls="selColours">Colours</button><button class="btn sm" type="button" data-sa="note">${icon('pen')}Note</button><button class="btn sm" type="button" data-sa="clip" title="Clip this passage to your notebook; it keeps the place it came from"${nbOk ? '' : ' hidden'}>${icon('bookmark')}Clip to notebook</button><button class="btn sm ghost" type="button" id="selMoreBtn" data-sa="more" aria-expanded="false" aria-controls="selMore" aria-label="More: passage set, copy, look up, ask an AI, listen" title="More: passage set, copy, look up, ask an AI, listen">⋯</button><button class="btn sm ghost" type="button" data-sa="remove" hidden>${icon('trash')}Remove</button><button class="btn sm ghost" type="button" data-sa="close" aria-label="Close">${icon('x')}</button></div><div class="row tight selcolours" id="selColours" role="group" aria-label="Highlight colours" hidden>${HL_COLORS.map(([k, nm]) => `<button class="hlsw hl-${rdCss(k)}" type="button" data-hc="${rdCss(k)}" aria-label="${esc(nm)} highlight" title="${esc(nm)}"></button>`).join('')}</div><div class="row tight selmore" id="selMore" role="group" aria-label="More" hidden><button class="btn sm ghost" type="button" data-sa="thread">${icon('threads')}Add to a passage set</button><button class="btn sm ghost" type="button" data-sa="copy">${icon('copy')}Copy</button><button class="btn sm ghost" type="button" data-sa="lookup" title="What the glossary says, and where to look further">${icon('book')}Look up</button><button class="btn sm ghost" type="button" data-sa="ask" title="Ask an AI about this passage: it copies a ready-made, neutral question and opens the AI’s own site in a new tab. Nothing is sent from here.">${icon('sparkle')}Ask an AI</button>${prov.kind === 'scan' ? `<button class="btn sm ghost" type="button" data-sa="orig" title="Find this passage on its page in the original scan">${icon('learn')}Original page</button>` : ''}<button class="btn sm ghost" type="button" data-sa="listen" title="Read aloud from here">${icon('headphones')}Listen</button><button class="btn sm ghost" type="button" data-sa="search" title="Search every text for these words">${icon('search')}Search</button><button class="btn sm ghost" type="button" data-sa="similar" title="Find passages in other books that read like this">${icon('swap')}Similar</button><button class="btn sm ghost" type="button" data-sa="cite" title="Cite this passage in Chicago, BibTeX or RIS form: for a paper, Zotero, EndNote or LaTeX">${icon('list')}Cite</button></div></div>`);
    document.body.appendChild(bar);
    let pending = null; // { kind: 'new', pieces } or { kind: 'hl', id }
    /* the rows under the first one, the other colours and the other tools, open one at a time and shut again with the bar */
    const collapseBar = () => { const cb = $('#selColours', bar); const mb = $('#selMore', bar); if (cb) cb.hidden = true; if (mb) mb.hidden = true; ['#selColBtn', '#selMoreBtn'].forEach((q) => { const b2 = $(q, bar); if (b2 && b2.setAttribute) b2.setAttribute('aria-expanded', 'false'); }); };
    const toggleRow = (rowSel, btnSel) => { const row = $(rowSel, bar); const btn = $(btnSel, bar); if (!row) return; const on = !!row.hidden; collapseBar(); row.hidden = !on; if (btn && btn.setAttribute) btn.setAttribute('aria-expanded', String(on)); };
    let barQ = null;      // the words the bar was last shown for: the rows under the first one shut only for new words, so a selectionchange that fires after a tap does not close the ⋯ row that was just opened
    const hideBar = () => { bar.hidden = true; pending = null; barQ = null; collapseBar(); };
    const showBar = (p, text, mode) => {
      pending = p; $('#selQ', bar).textContent = text.length > 110 ? text.slice(0, 107) + '…' : text; $('[data-sa="remove"]', bar).hidden = mode !== 'hl'; const fresh = bar.hidden || text !== barQ || mode === 'hl'; barQ = text; if (fresh) collapseBar();
      const hb = $('#selHl', bar); if (hb && hb.dataset) { const c = hlc(); hb.dataset.hc = c; hb.hidden = mode === 'hl'; hb.title = `Highlight these words in ${hlName(c)}; Colours has the others`; const sw = hb.querySelector ? hb.querySelector('.hlsw') : null; if (sw) sw.className = 'hlsw hl-' + c; }      // the Highlight button wears the colour of the last highlight; on a highlight already made the colours are open, to recolour it
      if (mode === 'hl' && fresh) toggleRow('#selColours', '#selColBtn');
      bar.hidden = false; paintNb();
    };
    /* where this passage is already in the reader's notebook (NB.backlinks): a line under the quote with a link to each page, or nothing. The links are the notebook's own addresses (#/…) and nothing else. */
    let nbSeq = 0; const paintNb = () => {
      const box = $('#selNb', bar); if (!box) return; box.hidden = true; if (typeof NB === 'undefined' || !NB || typeof NB.backlinks !== 'function' || !pending) return; const mine = ++nbSeq; const sp = spotOf();
      Promise.resolve().then(() => NB.backlinks(id, sp.s, sp.p)).then((list) => { if (mine !== nbSeq || bar.hidden || !Array.isArray(list)) return; const seen = new Set(); const links = list.filter((x) => x && typeof x.href === 'string' && /^#\//.test(x.href) && !seen.has(x.pageId || x.href) && seen.add(x.pageId || x.href)).slice(0, 4); if (!links.length) return; box.innerHTML = 'In your notebook: ' + links.map((x) => `<a href="${esc(x.href)}">${esc(String(x.title || 'a page').slice(0, 60))}</a>`).join(', '); box.hidden = false; }).catch(() => { /* the notebook is not ready: no line */ });
    };
    function readSelection() {
      const s = window.getSelection ? window.getSelection() : null; if (!s || !s.rangeCount || s.isCollapsed) return null;
      const r = s.getRangeAt(0); if (!art.contains(r.commonAncestorContainer)) return null;
      const pieces = [];
      $$('p[data-p]', art).filter((el) => r.intersectsNode(el)).slice(0, 40).forEach((el) => {
        const full = rdDomText(el); let a = 0; let b = full.length;
        if (el.contains(r.startContainer)) a = rdOffsetIn(el, r.startContainer, r.startOffset);
        if (el.contains(r.endContainer)) b = rdOffsetIn(el, r.endContainer, r.endOffset);
        while (a < b && /\s/.test(full[a])) a++; while (b > a && /\s/.test(full[b - 1])) b--;
        if (b > a) pieces.push({ s: secIdx(el), p: +el.dataset.p, a, b, q: full.slice(a, b) });
      });
      return pieces.length ? pieces : null;
    }
    const onSel = debounce(() => { const pcs = readSelection(); if (pcs) showBar({ kind: 'new', pieces: pcs }, pcs.map((x) => x.q).join(' … '), 'new'); else if (pending && pending.kind === 'new') hideBar(); }, 140);
    document.addEventListener('selectionchange', onSel);
    art.addEventListener('click', (e) => {
      const hl = e.target.closest('.hl'); if (!hl) return; const s = window.getSelection ? window.getSelection() : null; if (s && !s.isCollapsed) return;
      const h1 = marks.hl.find((x) => x.id === hl.dataset.h); if (!h1) return; showBar({ kind: 'hl', id: h1.id }, (h1.n ? h1.n + ' — ' : '') + h1.q, 'hl');
    });
    bar.addEventListener('mousedown', (e) => { if (!e.target.closest('textarea,input')) e.preventDefault(); });
    const gid = () => 'g' + uid().slice(-8);
    const quoteOf = () => (pending.kind === 'new' ? pending.pieces.map((x) => x.q).join('\n\n') : (marks.hl.find((x) => x.id === pending.id) || { q: '' }).q);
    const spotOf = () => { if (pending.kind === 'new') { const f = pending.pieces[0]; return { s: f.s, p: f.p, a: f.a, b: f.b }; } const h1 = marks.hl.find((x) => x.id === pending.id); return h1 ? { s: h1.s, p: h1.p, a: h1.a, b: h1.b } : { s: i, p: 0, a: 0, b: 1 }; };
    /* the verse numbers of the words that were selected, for Cite (AA-11 of ALPHA_AUDIT.md): the verse in effect at the start of the selection and at its last character, read from the numbers the text carries (the sup.vn in the page);
       the numbers are not in the offsets, so a number's place is the text before it. Only in a Bible, only when the selection is in one section, and only when a number is found in that section: otherwise null, and the citation names the chapter */
    const citeVerses = (cur) => {
      if (!cur || provKind(id, (BEATLAB_TEXTS.meta || {})[id]) !== 'bible') return null;
      const h1 = cur.kind === 'hl' ? marks.hl.find((x) => x.id === cur.id) : null; const pieces = cur.kind === 'new' ? cur.pieces : (h1 ? [{ s: h1.s, p: h1.p, a: h1.a, b: h1.b }] : null);
      const nums = $$('sup.vn', art);
      return rdVerseSpan(pieces, (pc, x) => {
        const el = $$('p[data-p]', art).find((e) => secIdx(e) === pc.s && +e.dataset.p === pc.p); if (!el) return null; let best = null;
        nums.forEach((vn) => { if (secIdx(vn) !== pc.s) return; if (el.compareDocumentPosition(vn) & 2) best = vn; else if (el.contains(vn) && rdOffsetIn(el, vn.parentNode, Array.prototype.indexOf.call(vn.parentNode.childNodes, vn)) <= x) best = vn; });
        const n = best ? parseInt(best.textContent, 10) : NaN; return n >= 1 ? n : null;
      });
    };
    const clearSel = () => { try { window.getSelection().removeAllRanges(); } catch (e) { /* ignore */ } };
    const addHighlights = (pieces, color, note) => { const g = pieces.length > 1 ? gid() : undefined; save((mm) => { pieces.forEach((pc, k) => { const sI = pc.s != null ? pc.s : i; hlAdd(mm, { s: sI, p: pc.p, a: pc.a, b: pc.b, q: pc.q, c: color, g, sh: secs[sI][0], n: k === 0 ? note : '' }); }); }); };
    bar.addEventListener('click', async (e) => {
      const hc = e.target.closest('[data-hc]'); const sa = e.target.closest('[data-sa]'); if (!pending || (!hc && !sa)) return; const cur = pending;
      if (hc) { if (cur.kind === 'new') { addHighlights(cur.pieces, hc.dataset.hc); store.set('reader.hlc', hc.dataset.hc); } else save((mm) => { hlUpdate(mm, cur.id, { c: hc.dataset.hc }); }); clearSel(); hideBar(); renderArticle(); return; }
      const a = sa.dataset.sa;
      if (a === 'close') { clearSel(); hideBar(); return; }
      if (a === 'colours') { toggleRow('#selColours', '#selColBtn'); return; }
      if (a === 'more') { toggleRow('#selMore', '#selMoreBtn'); return; }
      collapseBar();
      if (a === 'lookup') { const q0 = quoteOf(); clearSel(); hideBar(); lookupDialog(q0); return; }
      if (a === 'ask') { const q0 = quoteOf(); const sp0 = spotOf(); const cite0 = rdCitation(id, secs[sp0.s][0], q0, hasPrinted ? pgmShort(pgmAt(pgx.flat, sp0.s, sp0.p, sp0.a), pgVols) : '').split('\n').slice(1).join('\n'); clearSel(); hideBar(); askOpen({ text: q0, cite: cite0, label: 'The words you selected' }); return; }      // the citation is the lines after the quote
      if (a === 'clip') { if (!nbOk) return; const sp = spotOf(); await NB.clip({ id, text: quoteOf(), s: sp.s, p: sp.p, heading: secs[sp.s][0], page: hasPrinted ? pgmShort(pgmAt(pgx.flat, sp.s, sp.p, sp.a), pgVols) : '' }); clearSel(); hideBar(); return; }      // the Notebook shows its own toast and keeps the place; the same quote from the same place is not added twice
      if (a === 'orig') { const q0 = quoteOf(); clearSel(); hideBar(); provOpenScan(prov, q0); return; }
      if (a === 'listen') { clearSel(); hideBar(); ls.toggle(listenFrom()); return; }
      if (a === 'similar') { const q = quoteOf().replace(/\s+/g, ' ').trim(); clearSel(); hideBar(); location.hash = '#/path/similar?b=' + id + '&q=' + encodeURIComponent(q.slice(0, 700)); return; }
      if (a === 'search') { const words = quoteOf().replace(/\s+/g, ' ').trim().replace(/"/g, '').split(' '); clearSel(); hideBar(); location.hash = srchHash('"' + words.slice(0, 8).join(' ') + '"', srchOpts({})) + (srchCollOf(id) >= 0 ? '&sh=' + srchCollOf(id) : ''); return; }      // sh: the shelf of this book, which a website offers as "Search this shelf" before it searches every text (AA-01); it changes nothing else
      if (a === 'cite') { const sp0 = spotOf(); const pg0 = hasPrinted ? pgmShort(pgmAt(pgx.flat, sp0.s, sp0.p, sp0.a), pgVols) : ''; const vs = citeVerses(cur); clearSel(); hideBar(); if (typeof citeOpen === 'function') citeOpen({ id, heading: secs[sp0.s][0], page: pg0, printed: hasPrinted, verses: vs ? citeBibleRef(l.title, secs[sp0.s][0], vs[0], vs[1]) : '' }); return; }      // the Cite dialog (6zzg-cite.js): the edition, this section and, where the text has them, the printed page
      if (a === 'copy') { const q = quoteOf(); const sp0 = spotOf(); const ok = await rdCopy(rdCitation(id, secs[sp0.s][0], q, hasPrinted ? pgmShort(pgmAt(pgx.flat, sp0.s, sp0.p, sp0.a), pgVols) : '')); toast(ok ? 'Copied with a citation.' : 'Copying is not available here; select the text and copy it.', ok ? 'good' : 'bad', 2200); return; }
      if (a === 'remove') { const h1 = marks.hl.find((x) => x.id === cur.id); if (h1 && h1.n && !(await confirmBox('Remove this highlight?', '<p>It has a note, which will be deleted with it.</p>', 'Remove', 'danger'))) return; save((mm) => { hlRemove(mm, cur.id); }); hideBar(); renderArticle(); return; }
      if (a === 'note') {
        const tgt = cur.kind === 'hl' ? (marks.hl.find((x) => x.id === cur.id) || null) : rdSameHighlight(marks.hl, cur.pieces, i);      // words that are highlighted already (the same sentence selected again) take the note on that highlight (AA-12)
        if (cur.kind === 'hl' && !tgt) return;
        const existing = tgt ? tgt.n : ''; const v = await rdNoteBox(tgt ? 'Note on this highlight' : 'Highlight with a note', existing); if (v == null) return;
        if (tgt) save((mm) => { hlUpdate(mm, tgt.id, { n: v }); }); else addHighlights(cur.pieces, 'gold', v);
        clearSel(); hideBar(); renderArticle(); return;
      }
      if (a === 'thread') { const sp = spotOf(); const q = quoteOf(); await addToThread({ tid: id, s: sp.s, p: sp.p, a: sp.a, b: sp.b, q, sh: secs[sp.s][0] }); }
    });
    const lookupDialog = (text) => wordLookupBox(text);      // the box lives in 6zw-words.js, where the word card uses it too
    let helpNow = rtGet().help; const onHelp = () => { const h2 = rtGet().help; if (h2 !== helpNow) { helpNow = h2; renderArticle(); } };      // Word help changed in the Aa panel: draw the text again
    window.addEventListener('rt:change', onHelp);
    const onKeys = (e) => { if (cont) return; if (e.altKey || e.metaKey || e.ctrlKey || e.shiftKey || palTyping(e.target) || document.querySelector('.modal-back,.overlay,.pal-back')) return; if (e.key === 'ArrowRight' && i < n - 1) { location.hash = link(i + 1); } else if (e.key === 'ArrowLeft' && i > 0) { location.hash = link(i - 1); } };
    document.addEventListener('keydown', onKeys);
    pathOnLeave(() => { document.removeEventListener('keydown', onKeys); document.removeEventListener('selectionchange', onSel); bar.remove(); if (io) io.disconnect(); if (timer) clearTimeout(timer); window.removeEventListener('scroll', onScroll); window.removeEventListener('rt:change', onHelp); });

    /* remember where you were */
    let lastP = Math.max(0, wantP); let lastS = i; let sc = 0;
    const share = (s2, p2) => Math.round(rdShare(pages.paraOff(s2, p2), pages.cum[n]) * 10000) / 10000;       // how far through the whole text a place is
    let trkF = share(i, Math.max(0, wantP)); let trkT = Date.now();      // where the reader was and when, to count how far they move through the text each day
    const remember = (sI, p) => { if (p !== lastP || sI !== lastS) { lastP = p; lastS = sI; const now = Date.now(); const f = share(sI, p); if (cont) SHELVES.log(shfAdvance(trkF, trkT, f, now, pages.cum[n]), now); trkF = f; trkT = now; save((mm) => { mm.last = { s: sI, p, t: now, f }; }); } };
    const onScroll = () => { if (sc || paged) return; sc = setTimeout(() => { sc = 0; const pw = $$('.pw', art).find((el) => el.getBoundingClientRect().bottom > 90); if (!pw) return; remember(secIdx(pw), +pw.dataset.p); }, 1200); };
    window.addEventListener('scroll', onScroll, { passive: true });


    /* ── pages that turn ── the engine is in 6ka-paged.js; what it needs from here is handed over */
    const cl = (el) => (el && el.classList ? el.classList : { add() {}, remove() {}, contains: () => false, toggle() {} });
    const pg = paged ? (isSheets ? rdSheets : rdPaged)({
      art, secs, n, pages, k: i, secHTML, toast,
      isBm: (k2, p2) => marks.bm.some((b) => b.s === k2 && b.p === p2),
      isRead: (k2) => marks.rs.includes(k2),
      markRead: (k2) => { if (!marks.rs.includes(k2)) markSection(true, false, k2); },
      remember: (k2, p2) => remember(k2, p2),
      onMove: (w) => pagedMoved(w),
      menu: () => toggleChrome(), hideMenu: () => hideChrome(), menuIdle: () => (!sheet || sheet.hidden) && !moreOpen(),
    }) : null;
    const pagedMoved = (w) => {
      updateTop(); const pgv = pages.pageAt(w.k, w.p);
      const e1 = $('#rdPage', body); if (e1) e1.textContent = `Page ${pgv.toLocaleString()} of ${totalPages.toLocaleString()} · ${expTitle(secs[w.k][0], w.k).slice(0, 44)}`;
      const sl = $('#rdSlide', body); if (sl && document.activeElement !== sl) sl.value = pgv;
      const tc = $('#rdTocList', body); if (tc && tc.querySelectorAll) $$('a[data-jump]', tc).forEach((a) => { if (+a.dataset.jump === w.k) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    };

    /* ── reading aloud (6kl-listen.js): what it needs from here ── */
    const ls = rdListen({
      body, art, toast,
      reveal: (rg) => { if (paged) { pg.revealRange(rg); } else { const r = rg.getBoundingClientRect(); if (r && (r.top < 90 || r.bottom > innerHeight - 170) && window.scrollTo) window.scrollTo({ top: (window.scrollY || 0) + r.top - innerHeight * 0.28, behavior: 'smooth' }); } },
      layoutChanged: () => { if (paged) setTimeout(() => pg.relayout(), 0); },
      advance: (lastEl) => {      // the first paragraph of the next section, or null at the end of the text, or 'route' when the next section is a new address
        const k0 = secIdx(lastEl); const first1 = (k3) => $(`#rds-${k3} p[data-p]`, art);
        if (paged) { if (k0 >= n - 1) return null; pg.goto(k0 + 1, 0); return first1(k0 + 1); }
        if (whole) { const all = $$('p[data-p]', art); const ix = all.indexOf(lastEl); if (ix >= 0 && ix + 1 < all.length) return all[ix + 1]; if (k0 >= n - 1) return null; jumpWhole(k0 + 1, 0); return first1(k0 + 1); }
        if (k0 >= n - 1) return null; location.hash = link(k0 + 1, { l: '1' }); return 'route';
      },
    });
    pathOnLeave(() => ls.destroy());
    { const lb = $('#rdListenBtn', body); if (lb && ls.ok) lb.hidden = false; }
    const listenFrom = () => {      // from the words selected, else from the top of the screen
      const sl = window.getSelection ? window.getSelection() : null; let el = null;
      if (sl && sl.rangeCount && !sl.isCollapsed && art.contains(sl.anchorNode)) { const nd = sl.anchorNode.nodeType === 3 ? sl.anchorNode.parentElement : sl.anchorNode; el = nd && nd.closest ? nd.closest('p[data-p]') : null; }
      if (!el) { const pw = topPw(); el = pw && pw.querySelector ? pw.querySelector('p[data-p]') : null; } return el;
    };

    /* ── the whole text: one scroll, sections drawn as you reach them ──
       The sections near you are on the page; the ones you scroll toward are added below (or above), and the ones far behind are let go, so a text of fifteen
       million characters scrolls as lightly as a short one. Pages are a guide to where you are: about a printed page of text each, the same on every screen. */
    let first = 0; let last = -1; const seen = {}; let tickTimer = null;
    const secsBox = whole ? $('#rdSecs', art) : null; const topS = whole ? $('#rdTopS', art) : null; const botS = whole ? $('#rdBotS', art) : null;
    const mkSec = (k) => { const d = document.createElement('div'); d.className = 'rdsec on'; d.dataset.s = k; d.id = 'rds-' + k; d.innerHTML = secHTML(k); return d; };
    const appendSec = () => { if (last >= n - 1) return false; last++; secsBox.appendChild(mkSec(last)); return true; };
    const prependSec = () => { if (first <= 0) return false; first--; const before = document.documentElement.scrollHeight; secsBox.insertBefore(mkSec(first), secsBox.firstChild); window.scrollBy(0, document.documentElement.scrollHeight - before); return true; };
    const topPw = () => (paged ? pg.topPw() : $$('.pw', art).find((el) => el.getBoundingClientRect().bottom > 90));
    const visSec = () => { const el = $$('.rdsec', art).find((d) => d.getBoundingClientRect().bottom > 90); return el ? +el.dataset.s : first; };
    const curSec = () => (paged ? pg.where().k : whole ? visSec() : i);
    const trim = () => { let g = 0; while (last - first + 1 > 7 && g++ < 6) { const mid = visSec(); if (mid - first > last - mid) { const el = secsBox.firstElementChild; const hh = el.offsetHeight; el.remove(); first++; window.scrollBy(0, -hh); } else { secsBox.lastElementChild.remove(); last--; } } };
    const fill = () => { let g = 0; while (g++ < 8 && last < n - 1 && botS.getBoundingClientRect().top < innerHeight + 1500) appendSec(); g = 0; while (g++ < 8 && first > 0 && topS.getBoundingClientRect().bottom > -1500) prependSec(); trim(); };
    const pageAt = pages.pageAt; const locate = pages.locate;
    const tick = () => {
      if (!whole || root.isConnected === false) return; fill();
      const relEl = $('#rdRelEnd', body); if (relEl) relEl.hidden = last < n - 1;      // the strip at the end of the text shows once the last section is on the page
      const pw = topPw(); if (pw) { const k = secIdx(pw); const pg = pageAt(k, +pw.dataset.p); const e1 = $('#rdPage', body); if (e1) e1.textContent = `Page ${pg.toLocaleString()} of ${totalPages.toLocaleString()} · ${expTitle(secs[k][0], k).slice(0, 44)}`; const sl = $('#rdSlide', body); if (sl && document.activeElement !== sl) sl.value = pg; }
      const now = Date.now(); let waiting = false;      // a section counts as read when you are at its end after being in it a while, not when you scroll past
      $$('.rdsec', art).forEach((d) => { const k = +d.dataset.s; const r = d.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight && !seen[k]) seen[k] = now; const end = d.querySelector('.rdend'); if (!end || marks.rs.includes(k) || !seen[k]) return; const er = end.getBoundingClientRect(); if (er.top > 0 && er.top < innerHeight) { if (now - seen[k] >= Math.min(RD_DWELL, Math.max(1500, secs[k][1].length / 40))) markSection(true, false, k); else waiting = true; } });
      if (waiting && !tickTimer) tickTimer = setTimeout(() => { tickTimer = null; tick(); }, 1200);
    };
    const jumpWhole = (k, p) => {
      k = clamp(k, 0, n - 1); secsBox.innerHTML = ''; first = k; last = k - 1; appendSec(); window.scrollTo(0, 0);
      const place = () => { if (root.isConnected === false) return; let t = $('#rds-' + k, art); if (p != null && p >= 0) { const pw = $(`#rds-${k} .pw[data-p="${p}"]`, art); if (pw) t = pw; } if (t && t.scrollIntoView) { t.scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); } };
      place(); fill(); place(); setTimeout(() => { place(); tick(); }, 90); tick();
    };
    const jumpTo = (k, p) => { if (cont) trail(); if (paged) pg.goto(k, p); else jumpWhole(k, p); if (cont) showBack(); };
    let wraf = 0; const onWholeScroll = () => { if (wraf) return; wraf = requestAnimationFrame(() => { wraf = 0; tick(); }); };
    if (cont) {
      if (whole) { window.addEventListener('scroll', onWholeScroll, { passive: true }); pathOnLeave(() => { window.removeEventListener('scroll', onWholeScroll); if (tickTimer) clearTimeout(tickTimer); }); }
      const slide = $('#rdSlide', body); const gop = $('#rdGoPage', body);
      if (slide) { slide.addEventListener('input', () => { const e1 = $('#rdPage', body); if (e1) e1.textContent = `Page ${(+slide.value).toLocaleString()} of ${totalPages.toLocaleString()}`; }); slide.addEventListener('change', () => { const w = locate(+slide.value); jumpTo(w.k, w.p); }); }
      if (gop) gop.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const pg = parseInt(gop.value, 10); if (pg >= 1) { const w = locate(pg); jumpTo(w.k, w.p); gop.value = ''; } } });
      const jumpFrom = (a) => { const pp = a.dataset.jp != null && a.dataset.jp !== '' ? +a.dataset.jp : undefined; jumpTo(+a.dataset.jump, pp); const sh = $('#rdSheet', body); if (sh) sh.hidden = true; };
      art.addEventListener('click', (e) => { const nl = e.target.closest('a[data-jump]'); if (nl) { e.preventDefault(); jumpFrom(nl); } });
      for (const sel2 of ['#rdTocList', '#rdMarksList']) { const tl = $(sel2, body); if (tl) tl.addEventListener('click', (e) => { const a = e.target.closest('a[data-jump]'); if (a) { e.preventDefault(); jumpFrom(a); } }); }
    }
    /* changing how it is read keeps the place: the section and paragraph at the top of the screen */
    const switchMode = (m2) => { if (m2 === mode || !RL_MODES[m2]) return; rlStopSet(mode); rlStopSet(m2);      // the switch is kept as it was when leaving Scroll, and as chosen when entering it
      const pw = topPw(); const k2 = pw ? secIdx(pw) : i; const p2 = pw ? +pw.dataset.p : (wantP >= 0 ? wantP : ''); rlSet({ mode: m2 }, true); location.hash = '#/path/read/' + id + '?' + new URLSearchParams(Object.assign({ s: k2, f: find }, p2 !== '' ? { p: p2 } : {}, modeQ(m2))); };
    const onRlChange = (e) => { const d = e.detail; if (!d || !d.patch) return; if (d.patch.mode) switchMode(d.patch.mode); else { if (d.patch.div != null && !paged) renderArticle(); if (d.patch.bar != null) applyBar(false); } };      // the view, the page breaks and the bars can be changed from the Aa panel, the menu and the keys
    window.addEventListener('rl:change', onRlChange); pathOnLeave(() => { window.removeEventListener('rl:change', onRlChange); if (pg) pg.destroy(); });
    /* "keep the screen on while reading": the browser's screen wake lock, asked for while the page is showing and let go when the setting is off or the reader is left */
    let wake = null;
    const wakeSet = async () => {
      try {
        if (rlGet().awake && navigator.wakeLock && document.visibilityState === 'visible') { if (!wake) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } }
        else if (wake) { const w0 = wake; wake = null; await w0.release(); }
      } catch (e) { wake = null; }
    };
    document.addEventListener('visibilitychange', wakeSet); window.addEventListener('rl:change', wakeSet); wakeSet();
    pathOnLeave(() => { document.removeEventListener('visibilitychange', wakeSet); window.removeEventListener('rl:change', wakeSet); try { if (wake) wake.release(); } catch (e) { /* already gone */ } wake = null; });
    /* the places jumped from, so one tap goes back (as Kindle's "Go back to page …") */
    let trailL = []; let trailT = null;
    const trail = () => { const pw = topPw(); if (!pw) return; trailL = trailPush(trailL, { k: secIdx(pw), p: +pw.dataset.p }, 6); };
    const backChip = $('#rdBack', body);
    const showBack = () => { if (!backChip || trailL.length === 0) return; const t0b = trailL[trailL.length - 1]; backChip.hidden = false; backChip.textContent = `↩ Back to page ${pages.pageAt(t0b.k, t0b.p).toLocaleString()}`; clearTimeout(trailT); trailT = setTimeout(() => { backChip.hidden = true; }, 9000); };
    if (backChip) backChip.addEventListener('click', () => { const t0b = trailL.pop(); backChip.hidden = true; if (!t0b) return; if (paged) pg.goto(t0b.k, t0b.p); else jumpWhole(t0b.k, t0b.p); });

    /* ── saving the whole text: an e-book, plain text, Markdown, or a page to print or save as a PDF ── */
    const exportDialog = async () => {
      const nm = marks.hl.length; const hasMark = nm > 0; const origBlock = origHTML(origEntry(await TXT.orig(), id, BEATLAB_TEXTS.meta), { short: true });
      const opt = (v, t, d, chk) => `<label class="chk" style="align-items:flex-start;margin:6px 0"><input type="radio" name="xf" value="${v}"${chk ? ' checked' : ''}><span><b>${t}</b><br><span class="small t2">${d}</span></span></label>`;
      const html = `<p class="small t2" style="margin-top:0">Save <b>${esc(l.title)}</b> whole: ${n} section${n === 1 ? '' : 's'}, ${m.chars < 1000 ? m.chars : (m.chars / 1000).toFixed(0) + 'k'} characters. It is built here in your browser; nothing is uploaded.</p>
        ${opt('epub', 'E-book (EPUB)', 'For any e-reader or reading app: Kobo, Apple Books, Google Play Books, Android readers, Calibre; for a Kindle, use Send to Kindle or convert it with Calibre. Has a contents page.', true)}
        ${opt('pdf', 'Print, or save as a PDF', 'Opens a print-ready page (a title page, contents, each section on a new page). Choose Save as PDF in the print window to keep a PDF.', false)}
        ${opt('txt', 'Plain text (.txt)', 'The words alone, readable anywhere.', false)}${opt('md', 'Markdown (.md)', 'For notes apps and writers; keeps headings and verse numbers.', false)}${opt('html', 'Web page (.html)', 'One file that opens in any browser, with the same print styles.', false)}
        <div class="stack sm" style="margin-top:10px"><label class="chk"><input type="checkbox" id="xMarks"${hasMark ? ' checked' : ' disabled'}><span class="small">Include my highlights and notes${hasMark ? ` (${nm} highlight${nm === 1 ? '' : 's'}): highlights keep their colour, notes become numbered notes at the end of each section` : ' (you have none in this text yet)'}</span></label>
        <label class="chk"><input type="checkbox" id="xVerses" checked><span class="small">Keep verse numbers</span></label>${hasPrinted ? '<label class="chk"><input type="checkbox" id="xPages" checked><span class="small">Keep the printed page numbers (as [p. 214], where each page begins; in an e-book also as page breaks for the reading app)</span></label>' : ''}${figsAll.length ? `<label class="chk"><input type="checkbox" id="xFigs" checked><span class="small">Include the ${figsAll.length} picture${figsAll.length === 1 ? '' : 's'} from the printed book (in the e-book and the web page; a plain text or Markdown file notes each by its caption)</span></label>` : ''}${mayHave ? '<label class="chk"><input type="checkbox" id="xEng"><span class="small">Leave out lines in other languages (only when not including highlights, which would move; the pictures and printed page numbers are then left out too)</span></label>' : ''}</div>
        ${origBlock ? `<div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--line)">${origBlock}<p class="small t2" style="margin:6px 0 0">Or take the original file and read it in any app you like. These links leave the Lamplighter Project and open the source’s website; they need a connection.</p></div>` : ''}`;
      const c = await modal({ title: 'Save this text', html, actions: [{ label: 'Cancel', kind: 'ghost', value: null }, { label: 'Save', kind: 'primary', collect: (back) => ({ fmt: (back.querySelector('input[name="xf"]:checked') || {}).value || 'epub', marks: !!(back.querySelector('#xMarks') && back.querySelector('#xMarks').checked), verses: !!(back.querySelector('#xVerses') && back.querySelector('#xVerses').checked), pages: !!(back.querySelector('#xPages') && back.querySelector('#xPages').checked), figs: !!(back.querySelector('#xFigs') && back.querySelector('#xFigs').checked), eng: !!(back.querySelector('#xEng') && back.querySelector('#xEng').checked) }) }] });
      if (!c) return; const wait = () => new Promise((r) => setTimeout(r, 30)); toast('Building it…', '', 1500); await wait();
      try {
        let use = secs; if (c.eng && !c.marks) use = secs.map(([hh, tt]) => [hh, textBlocks(tt).filter((b) => !isOtherLanguage(blockParts(b).body)).join('\n\n')]);
        const book = { id, title: l.title, author: m.by || '', rights: m.license || '', source: m.src || '', note: m.note || '' }; const o = { marks: c.marks ? marks : null, verses: c.verses }; if (c.figs && !(c.eng && !c.marks)) o.figs = figsAll; if (hasPrinted && c.pages && !(c.eng && !c.marks)) o.pages = { map: pgx.map, vols: pgVols };      // (leaving out other-language lines moves the paragraphs the pictures and the printed pages are fixed to)
        if (c.fmt === 'epub') download(expFilename(l.title, 'epub'), await expEpub(book, use, o), 'application/epub+zip');
        else if (c.fmt === 'txt') download(expFilename(l.title, 'txt'), expPlain(book, use, o), 'text/plain;charset=utf-8');
        else if (c.fmt === 'md') download(expFilename(l.title, 'md'), expMarkdown(book, use, o), 'text/markdown;charset=utf-8');
        else if (c.fmt === 'html') download(expFilename(l.title, 'html'), expHtmlPage(book, use, o), 'text/html;charset=utf-8');
        else { printHTML(expHtmlPage(book, use, o)); return; }
        toast('Saved. Look in your downloads.', 'good', 3200);
      } catch (e) { toast('Could not save that: ' + e.message, 'bad', 5000); }
    };
    const saveBtn = $('#rdSave', body); if (saveBtn) saveBtn.addEventListener('click', exportDialog);
    TXT.orig().then((all) => {
      const el = $('#rdOrig', body); if (!el) return; const entry = origEntry(all, id, BEATLAB_TEXTS.meta); const mt = (BEATLAB_TEXTS.meta || {})[id];
      prov = provInfo(id, mt, entry); el.innerHTML = provCardHTML(id, mt, entry, printedGrade); const lic = $('#rdLic', body); if (lic) lic.hidden = true;      // the card says what the old licence line said, and more
      provWireCard(el, prov, () => { const pw = typeof topPw === 'function' ? topPw() : null; return pw ? rdDomText(pw) : ''; });
    });      // the original edition: the files the source offers (a plain link when texts/originals.js is missing)

    /* ── reading without the page around it ──
       The app's own header and menus are hidden while a text is open, so the first thing on the screen is the text. One slim bar keeps what a reader needs (back, the title and
       where you are, contents, find, reading settings, save); it slides away as you read down and returns when you scroll up or tap the text. Everything that was in the old header
       card is in the sheet it opens. */
    const topBar = $('#rdTop', body); const sheet = $('#rdSheet', body); let lastY = 0; let braf = 0;
    let sheetFrom = null;      // what had focus before the sheet opened, so closing it returns there
    const openSheet = (what) => {
      if (!sheet) return; if (sheet.hidden) sheetFrom = document.activeElement; sheet.hidden = false; paintFindBar(); const sc = $('.rdsheet-in', sheet); if (sc) sc.scrollTop = 0;
      const name = what === 'find' ? 'find' : what === 'marks' ? 'marks' : what === 'source' || what === 'about' ? 'about' : 'contents';      // the list of sections opens first (the title, the c key and the Contents button); the card of the text is the About tab
      showPane(name);
      if (what === 'find') { const f = $('#rdFind', body); if (f && f.focus) setTimeout(() => f.focus(), 40); }
      else if (what === 'source') { const so = $('#rdOrig', body); if (so && so.scrollIntoView) setTimeout(() => so.scrollIntoView({ block: 'start' }), 30); }      // where the text comes from and the original pages
      else { const tb = $('#rdTab-' + name, body); if (tb && tb.focus) setTimeout(() => tb.focus(), 40); }
    };
    const closeSheet = () => { if (!sheet || sheet.hidden) return; sheet.hidden = true; paintFindBar(); if (sheetFrom && sheetFrom.isConnected && sheetFrom.focus) { try { sheetFrom.focus(); } catch (e) { /* gone */ } } sheetFrom = null; };
    const markItems = () => [...marks.hl.map((h) => ({ k: 'hl', s: h.s, p: h.p, a: h.a, q: h.q, n: h.n, c: h.c, id: h.id })), ...marks.bm.map((b) => ({ k: 'bm', s: b.s, p: b.p, a: -1, q: b.q || '', n: b.n || '', c: '', id: b.id, sh: b.sh }))].sort((x, y) => x.s - y.s || x.p - y.p || (x.a || 0) - (y.a || 0));
    const fillMarks = () => {
      const list = $('#rdMarksList', body); const cnt = $('#rdMarkN', body); const items = markItems(); if (cnt) cnt.textContent = `(${items.length})`; if (!list) return;
      list.innerHTML = items.length ? items.map((it) => `<a href="${link(it.s, { p: it.p >= 0 ? it.p : '', h: it.k === 'hl' ? it.id : '' })}" data-jump="${it.s}" data-jp="${it.p >= 0 ? it.p : ''}" class="rdmk"><span class="rdmkc hl-${it.k === 'hl' && HL_IDS.includes(it.c) ? it.c : 'gold'}">${it.k === 'bm' ? icon('bookmark') : ''}</span><span><b>${esc(expTitle(secs[it.s] ? secs[it.s][0] : '', it.s).slice(0, 60))}</b> <span class="muted small">${it.k === 'bm' ? 'bookmark' : 'highlight'}</span><br><span class="small">${esc((it.q || '').replace(/\s+/g, ' ').slice(0, 140))}</span>${it.n ? `<br><span class="small t2"><i>${esc(String(it.n).replace(/\s+/g, ' ').slice(0, 140))}</i></span>` : ''}</span></a>`).join('') : '<p class="small t2" style="margin:6px 0">Nothing yet. Select words in the text to highlight them or add a note, or tap the bookmark by a paragraph.</p>';
    };
    const refreshMarks = () => { if (pane === 'marks' && sheet && !sheet.hidden) fillMarks(); else { const cnt = $('#rdMarkN', body); if (cnt) cnt.textContent = `(${marks.hl.length + marks.bm.length})`; } };
    const cpmNow = () => (pg ? pg.cpm() : rdCpm(store.get('reader.cpm', RD_CPM.def)));
    const hereParas = () => { if (paged) { const w = pg.where(); return pg.parasOn(w.page).map((p2) => ({ k: w.k, p: p2 })); } const pw = topPw(); return pw ? [{ k: secIdx(pw), p: +pw.dataset.p }] : []; };
    const isBmAt = (h2) => marks.bm.some((b) => b.s === h2.k && b.p === h2.p);
    const updateTop = () => {
      const pw = topPw(); if (!pw || !pw.dataset) return; const k = secIdx(pw); const p = +pw.dataset.p; const pgv = pages.pageAt(k, p); const pct = clamp(Math.round(100 * pages.paraOff(k, p) / Math.max(1, pages.cum[n])), 0, 100);
      const pl = rdPlaceOf(secs[k][0], k, n); const secT = pl.name; const prLab = hasPrinted ? pgmAt(pgx.flat, k, p, 0) : ''; const pageT = `${prLab ? pgmShort(prLab, pgVols) + ' · reader page' : 'Page'} ${pgv.toLocaleString()} of ${totalPages.toLocaleString()}`;      // with the printed page when the text has it: "p. 214 · reader page 12 of 340"
      const sub = $('#rdSub', body); if (sub) sub.textContent = `${imagLead}${pageT}${secT ? ' · ' + secT : ''}`; const tt = $('.rdtt', body); if (tt && tt.setAttribute) tt.setAttribute('title', `${pageT} (${pct}%)${secT ? ' · ' + secT : ''}`);      // SA-14: one counter in the bar, the page, and the name of the place, so a place can be named; “Section 3 of 41” and “part 2 of 5” are in the About tab (#rdWhere)
      const rl = $('#rdRefL', body); const rr = $('#rdRefR', body); if (rl) rl.textContent = secT; if (rr) rr.textContent = `${pageT} · ${pct}%`;
      const wh = $('#rdWhere', body); if (wh) wh.textContent = `Where you are: ${[pl.section ? pl.section + (pl.part ? ` (${pl.part})` : '') : pl.part, pageT, `${pct}% through the text`].filter(Boolean).join(' · ')}.`;
      const mi = $('#rdMeter i', body); if (mi) mi.style.width = pct + '%'; const mb = $('#rdMeter', body); if (mb) mb.setAttribute('aria-valuenow', String(pct));
      const lf = $('#rdLeft', body); if (lf) lf.textContent = rdFmtLeft(rdMinutes(pages.cum[n] - pages.paraOff(k, p), cpmNow()), ' in text');
      const bb = $('.rdbbm', body); if (bb && bb.setAttribute) bb.setAttribute('aria-pressed', String(hereParas().some(isBmAt)));
    };
    /* a bookmark for this place: the paragraphs on the screen (pages), or the one at the top (scrolling) */
    const bmHere = () => {
      const here = hereParas(); if (!here.length) return; const on = here.filter(isBmAt);
      if (on.length) { save((mm) => { on.forEach((h2) => bmToggle(mm, h2.k, h2.p, '', 0, '')); }); toast('Bookmark removed.', '', 1800); }
      else { const h2 = here[0]; save((mm) => bmToggle(mm, h2.k, h2.p, paragraphAt(secs, h2.k, h2.p) || '', 0, secs[h2.k][0])); toast('Bookmarked. Find it again under Highlights and notes.', '', 2200); }
      $$('.pw', art).forEach((el) => { const sI = secIdx(el); const o2 = marks.bm.some((b) => b.s === sI && b.p === +el.dataset.p); cl(el).toggle('bm', o2); const bt = el.querySelector('.pbm'); if (bt) bt.setAttribute('aria-pressed', String(o2)); });
      const mn = $('#rdMine', body); if (mn) mn.innerHTML = marksLine(); refreshMarks(); if (paged) pg.touch(); else updateTop();
    };
    /* the bar's own menu, and what its buttons do */
    const moreEl = $('#rdMore', body); const moreOpen = () => !!(moreEl && !moreEl.hidden);
    const closeMore = () => { if (moreEl) { moreEl.hidden = true; $$('[data-rdact="more"],[data-rdact="views"]', body).forEach((mb2) => { if (mb2 && mb2.setAttribute) mb2.setAttribute('aria-expanded', 'false'); }); } };
    /* every feature of the reader is in this menu, whatever the width of the screen and however the bar is kept: the buttons in the bar are shortcuts to some of them. ['', 'Heading'] is a heading, [action, label, checked] an item (a checked one is the view in use) */
    const viewItems = () => [['@views', 'How to read']];      // the chooser (rlViewsHTML) goes in where this stands (it has a label, or the menu's filter for empty ones would drop it)
    const moreItems = () => [
      ['', 'How to read'], ...viewItems(),
      ['', 'In this text'], ['contents', 'Contents'], ['find', 'Find in this text'], ['marks', 'Highlights, notes and bookmarks'], ['bookmark', 'Bookmark this place'], cont ? ['goto', 'Go to a page…'] : ['', ''], hasPrinted ? ['printed', 'Go to a printed page (p. 214)…'] : ['', ''], ['source', 'This text: details and the original edition'],
      ['', 'Reading'], ['aa', 'Reading settings: theme, type, spacing'], ls.ok ? ['listen', ls.on() ? 'Stop reading aloud' : 'Read aloud'] : ['', ''], document.fullscreenEnabled ? ['fullscreen', document.fullscreenElement ? 'Leave full screen' : 'Full screen'] : ['', ''], [barPref() === 'show' ? 'hidebar' : 'keepbar', barPref() === 'show' ? 'Hide the bars' : 'Keep the bars shown'],
      ['', 'More'], ['save', 'Save this text…'], ['shortcuts', 'Keyboard shortcuts'], ['random', 'Another page from this book'], ['library', 'Back to the Library'],
    ].filter((x) => x[1]);
    /* L-08 of FINAL_AUDIT.md: the bar's buttons are pictures with a tooltip, and a phone shows no tooltip. The same picture stands beside the same words in this menu, so every button in the bar can be found by name here without a caption in the bar (nothing taller). The pictures are the bar's own (icon('list') for Contents and so on); Aa and the arrow are letters there too. */
    const RD_MORE_ICON = { contents: 'list', find: 'search', marks: 'pen', bookmark: 'bookmark', listen: 'headphones', fullscreen: 'expand', hidebar: 'chevup' };
    const rdMoreIco = (a) => `<span class="rdmi-i${a === 'aa' || a === 'library' ? ' rdmi-g' : ''}" aria-hidden="true">${RD_MORE_ICON[a] ? icon(RD_MORE_ICON[a]) : a === 'aa' ? 'Aa' : a === 'library' ? '←' : ''}</span>`;
    const openMore = (only) => {
      if (!moreEl) return; const items = only === 'views' ? [['', 'How to read'], ...viewItems()] : moreItems();
      moreEl.innerHTML = items.map(([a, t, on]) => (a === '@views' ? rlViewsHTML(mode, true) : a === '' ? `<div class="rdmh" role="presentation">${t === 'How to read' ? `<span class="rdmi-i" aria-hidden="true">${icon('layers')}</span>` : ''}${esc(t)}</div>` : `<button type="button" role="menuitem" class="rdmi" data-rdact="${a}">${rdMoreIco(a)}${esc(t)}</button>`)).join('');
      moreEl.classList.toggle('rdviews', only === 'views'); moreEl.hidden = false; const mb2 = $(only === 'views' ? '[data-rdact="views"]' : '[data-rdact="more"]', body); if (mb2 && mb2.setAttribute) mb2.setAttribute('aria-expanded', 'true');
      const f1 = $('.rdmi[aria-checked="true"]', moreEl) || $('.rdmi', moreEl); if (f1 && f1.focus) f1.focus();
    };
    const rdAct = (a) => {
      if (a === 'more' || a === 'views') { const was = moreOpen() && !!moreEl.classList.contains('rdviews') === (a === 'views'); closeMore(); if (!was) openMore(a === 'views' ? 'views' : undefined); return; }
      closeMore();
      if (a === 'contents') openSheet('contents');
      else if (a === 'source') openSheet('source');
      else if (a === 'aa') rtPanel();
      else if (a === 'goto') goToPage();
      else if (a === 'printed') goPrinted();
      else if (a === 'hidebar') setBar('hide');
      else if (a === 'keepbar') setBar('show');
      else if (a === 'showbar') showChrome();
      else if (a === 'bookmark') bmHere();
      else if (a === 'save') { const sv = $('#rdSave', body); if (sv) sv.click(); }
      else if (a === 'marks') openSheet('marks');
      else if (a === 'find') openSheet('find');
      else if (a === 'listen') ls.toggle(listenFrom());
      else if (a === 'shortcuts') rdShortcuts();
      else if (a === 'random') location.hash = '#/path/read-random?b=' + id;
      else if (a === 'library') location.hash = '#/path/library';
      else if (a === 'fullscreen') { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) { toast('Full screen is not available here.', 'warn', 2400); } }
    };
    /* the bars: kept on the screen, or slid away as the text is read down, or put away until asked for. It is the reader's choice (rlGet().bar), made in the Aa panel, the menu, the button in the bar or with h.
       Whatever it is, a small tab at the top edge brings the bars back, every feature is in the menu and under a key, and a thin line keeps the section and page in view while the bars are away. */
    const barEl = $('#rdBar', body); const tabEl = $('#rdTab', body); const refEl = $('#rdRef', body); const hideBtn = $('#rdHideBtn', body);
    const barPref = () => rlGet().bar; const pinned = () => barPref() === 'show';
    const chromeShown = () => !!topBar && !cl(topBar).contains('rdhide');
    const paintBarBtn = () => { if (!hideBtn || !hideBtn.setAttribute) return; const on = pinned(); hideBtn.dataset.rdact = on ? 'hidebar' : 'keepbar'; hideBtn.setAttribute('aria-label', on ? 'Hide the bars' : 'Keep the bars shown'); hideBtn.setAttribute('title', on ? 'Hide the bars (h)' : 'Keep the bars shown (h)'); hideBtn.innerHTML = icon(on ? 'chevup' : 'pin'); };
    const paintChrome = (on, now) => {
      closeMore(); const els = [topBar, barEl]; if (now) { els.forEach((e) => cl(e).add('rdnow')); setTimeout(() => els.forEach((e) => cl(e).remove('rdnow')), 80); }
      els.forEach((e) => { if (on) cl(e).remove('rdhide'); else cl(e).add('rdhide'); }); if (tabEl) tabEl.hidden = on; if (refEl) refEl.hidden = on; paintBarBtn();
    };
    const showChrome = () => paintChrome(true);
    const hideChrome = (now) => { if (!pinned()) paintChrome(false, now); };      // kept bars are not put away by a page turn or a tap
    const toggleChrome = () => { if (!pinned()) paintChrome(!chromeShown()); };
    /* the choice changed, or the reader has opened: the bars go as it says, and a page laid out inside the bars is measured again */
    const applyBar = (first) => {
      const pref = barPref(); try { if (document.body && document.body.dataset) document.body.dataset.rdbar = pref; } catch (e) { /* no page */ }
      if (pref === 'hide' || (pref === 'auto' && paged)) paintChrome(false, first); else paintChrome(true, first);
      if (paged && !first && pg) setTimeout(() => pg.relayout(), 0);
    };
    const setBar = (v) => { rlSet({ bar: v }); };      // rlSet tells whatever listens (rl:change), this reader included
    const goToPage = () => { if (isSheets && pg) { pg.act('goto'); return; } showChrome(); const gp = $('#rdGoPage', body); if (gp && gp.focus) setTimeout(() => gp.focus(), 60); };
    const pgViewEl = isSheets ? $('#pgView', art) : null; const barY = () => (pgViewEl ? pgViewEl.scrollTop || 0 : window.scrollY || 0);      // sheets scroll inside their own box; the other views scroll the page
    /* a printed page asked for by its number: the place where it begins (a text of several volumes asks which volume when the number is in more than one) */
    const goPrinted = async () => {
      const box = `<label class="small t2" for="rdPrN">The page number printed in the book (${esc(l.title)}${pgVols.length ? ', with a volume: 2:214' : ''}). A number, “p. 214” or a roman number is fine.</label><input class="input" id="rdPrN" type="text" inputmode="text" autocomplete="off" style="width:100%;margin-top:8px" placeholder="214">`;
      const v = await modal({ title: 'Go to a printed page', html: box, actions: [{ label: 'Cancel', kind: 'ghost', value: null }, { label: 'Go', kind: 'primary', collect: (back) => ($('#rdPrN', back) || {}).value || '' }] });
      if (v == null) return; const ask = pgmAsk(v); if (!ask) { toast('Type a page number as printed in the book, such as 214, p. 214 or xii.', 'warn', 3200); return; }
      let hits = pgmFind(pgx.flat, ask); if (!hits.length) { toast(`No marker for ${pgmShort(ask.num)} in this text. A page may have no printed number, or lie in a part this text does not include.`, 'warn', 4200); return; }
      if (hits.length > 1 && !ask.vol) { const pick = await modal({ title: 'Which volume?', html: `<p class="small t2" style="margin-top:0">${esc(pgmShort(ask.num))} is in ${hits.length} places.</p>`, actions: [{ label: 'Cancel', kind: 'ghost', value: null }, ...hits.slice(0, 8).map((h, k) => ({ label: `${esc(pgmShort(h[3], pgVols))} · section ${h[0] + 1}`, value: k }))] }); if (pick == null) return; hits = [hits[pick]]; }
      const h0 = hits[0]; if (cont) jumpTo(h0[0], h0[1]); else location.hash = link(h0[0], { p: h0[1] });
    };
    const onBarScroll = () => { if (braf) return; braf = requestAnimationFrame(() => { braf = 0; const y = barY(); if (topBar && sheet && sheet.hidden && bar.hidden) { const d = y - lastY; const pref = barPref(); if (pref === 'auto') { if (y < 90 || d < -10) { if (!chromeShown()) paintChrome(true); } else if (d > 10 && chromeShown()) paintChrome(false); } else if (pref === 'hide' && d > 10 && chromeShown()) paintChrome(false); } lastY = y; updateTop(); }); };
    window.addEventListener('scroll', onBarScroll, { passive: true }); if (pgViewEl) pgViewEl.addEventListener('scroll', onBarScroll, { passive: true }); pathOnLeave(() => window.removeEventListener('scroll', onBarScroll));
    body.addEventListener('click', (e) => {
      const sm = e.target.closest('.rd-src-m'); if (sm) { const box = sm.closest('.rd-source'); if (box) { const on = box.classList.toggle('open'); sm.setAttribute('aria-expanded', on ? 'true' : 'false'); sm.textContent = on ? 'Less' : 'More'; } return; }      /* L-08: the one line about a machine-read scan opens to the whole note and the link to the original pages (a phone only; 6kp-source.js) */
      const sb = e.target.closest('[data-rdsheet]'); if (sb) { openSheet(sb.dataset.rdsheet); return; }
      if (e.target.closest('[data-sheetclose]') || e.target === sheet) { closeSheet(); return; }
      const rs = e.target.closest('[data-rdstyle]'); if (rs) { closeMore(); switchMode(rlPick(rs.dataset.rdstyle, mode)); return; }      // a style of the chooser: Scroll comes back stopping at each section or not, as the reader left it
      const rp = e.target.closest('[data-rdstop]'); if (rp) { closeMore(); switchMode(mode === 'section' ? 'scroll' : 'section'); return; }
      const ra = e.target.closest('[data-rdact]'); if (ra) { rdAct(ra.dataset.rdact); return; }
      if (!e.target.closest('#rdMore')) closeMore();
      const jl = e.target.closest('a[data-jump]'); if (jl && !whole) closeSheet();
    });
    if (!paged) art.addEventListener('click', (e) => {          // a tap on the text itself brings the bar back or sends it away
      if (e.target.closest('a,button,input,textarea,select,.hl,.pbm,.selbar')) return; const s2 = window.getSelection ? window.getSelection() : null; if (s2 && !s2.isCollapsed) return; toggleChrome();
    });
    const onSheetKey = (e) => {
      if (e.key === 'Escape' && sheet && !sheet.hidden) { closeSheet(); return; }
      if (e.key === 'Tab' && sheet && !sheet.hidden) {      // Tab stays inside the sheet while it is open
        const f2 = $$('button,a[href],input,select,summary,textarea', sheet).filter((x) => !x.disabled && x.offsetParent !== null); if (!f2.length) return;
        const a0 = f2[0]; const z0 = f2[f2.length - 1]; if (e.shiftKey && (document.activeElement === a0 || !sheet.contains(document.activeElement))) { e.preventDefault(); z0.focus(); } else if (!e.shiftKey && document.activeElement === z0) { e.preventDefault(); a0.focus(); }
      }
      if (moreEl && !moreEl.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Escape' || e.key === 'Tab')) {
        const items = $$('.rdmi', moreEl); const at = items.indexOf(document.activeElement);
        if (e.key === 'Escape') { e.preventDefault(); closeMore(); const mb3 = $('[data-rdact="more"]', body); if (mb3 && mb3.focus) mb3.focus(); }
        else if (e.key === 'Tab') closeMore();
        else if (items.length) { e.preventDefault(); items[(at + (e.key === 'ArrowDown' ? 1 : items.length - 1) + (at < 0 && e.key === 'ArrowUp' ? 1 : 0)) % items.length].focus(); }
      }
    };
    document.addEventListener('keydown', onSheetKey); pathOnLeave(() => document.removeEventListener('keydown', onSheetKey));
    updateTop(); applyBar(true);

    /* ── finding words: a list of matches, stepping from one to the next, and the current match marked on the page ── */
    const findN = $('#rdFindN', body); const hitsBox = $('#rdHits', body); const fbar = $('#rdFindBar', body); const findIn = $('#rdFind', body);
    function paintFindBar() {
      if (!fbar) return; const on = find.length >= 2 && fres.hits.length > 0 && (!sheet || sheet.hidden); fbar.hidden = !on;
      if (on) { const t2 = $('#rdFindBarT', fbar); if (t2) t2.textContent = `“${find.slice(0, 24)}” · ${cur >= 0 ? cur + 1 : '–'} of ${fres.hits.length}${fres.capped ? '+' : ''}`; }
    }
    const paintHits = () => {
      const hs = fres.hits;
      if (findN) findN.textContent = !find ? '' : find.length < 2 ? 'Type at least two letters.' : hs.length ? `${hs.length}${fres.capped ? '+' : ''} match${hs.length === 1 ? '' : 'es'} in ${fres.sections} section${fres.sections === 1 ? '' : 's'}${cur >= 0 ? ` · showing ${cur + 1}` : ''}` : 'No matches.';
      if (hitsBox) hitsBox.innerHTML = hs.slice(0, 200).map((h, ix) => `<a href="#" data-hit="${ix}"${ix === cur ? ' aria-current="true"' : ''}><b>${esc(expTitle(secs[h.k][0], h.k).slice(0, 40))}</b> ${esc(h.pre)}<mark>${esc(h.mt)}</mark>${esc(h.post)}</a>`).join('') + (hs.length > 200 ? '<p class="small t2" style="margin:6px 4px">The first 200 are listed; step through the rest with Next.</p>' : '');
      paintFindBar();
    };
    const hitMark = (h) => { const pw = $(`#rds-${h.k} .pw[data-p="${h.p}"]`, art); const mks = pw ? $$('mark', pw) : []; return mks[h.n] || null; };
    const showHit = (reveal) => {
      $$('mark.cur', art).forEach((m2) => cl(m2).remove('cur')); const h = fres.hits[cur]; if (!h) return null; const m2 = hitMark(h);
      if (m2) { cl(m2).add('cur'); if (reveal) { if (paged) pg.reveal(m2); else if (m2.scrollIntoView) m2.scrollIntoView({ block: 'center' }); } } return m2;
    };
    const gotoHit = (ix) => {
      if (ix < 0 || ix >= fres.hits.length) return; cur = ix; const h = fres.hits[ix]; paintHits();
      if (!cont) { if (h.k === i) showHit(true); else location.hash = link(h.k, { p: h.p, f: find }); return; }
      if ($(`#rds-${h.k} .pw[data-p="${h.p}"]`, art)) { showHit(true); return; }
      if (paged) { pg.goto(h.k, h.p); showHit(true); } else { jumpWhole(h.k, h.p); setTimeout(() => showHit(true), 160); }
    };
    const stepHit = (dir) => { if (find.length >= 2 && fres.hits.length) gotoHit(rdFindStep(fres.hits.length, cur, dir)); };
    /* a new search (or none): find the matches, draw them on the page, and go to the first one at or after where the reader is */
    const runFind = (q) => {
      q = (q || '').trim().slice(0, RDF_MAX); if (q === find) return; find = q; fres = rdFindAll(secs, find, { max: 400, skip: skipOther }); cur = -1;
      renderArticle(); paintHits();
      if (fres.hits.length) { const pw = topPw(); const at = rdFindNear(fres.hits, pw ? secIdx(pw) : i, pw ? +pw.dataset.p : 0); if (cont || fres.hits[at].k === i) gotoHit(at); }      // one section at a time: typing does not carry the reader to another section; Enter, Next or a click on a match does
      try { const pw2 = topPw(); history.replaceState(null, '', '#/path/read/' + id + '?' + new URLSearchParams(Object.assign({ s: pw2 ? secIdx(pw2) : i, f: find }, pw2 ? { p: pw2.dataset.p } : {}, modeQ(mode)))); } catch (e) { /* the address stays as it was */ }
    };
    const clearFind = () => { if (findIn) findIn.value = ''; runFind(''); };
    if (findIn) {
      findIn.addEventListener('input', debounce(() => runFind(findIn.value), 240));
      findIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); if (findIn.value.trim().slice(0, RDF_MAX) !== find) runFind(findIn.value); else stepHit(e.shiftKey ? -1 : 1); } });
    }
    const fp = $('#rdFindPrev', body); const fn = $('#rdFindNext', body); if (fp) fp.addEventListener('click', () => stepHit(-1)); if (fn) fn.addEventListener('click', () => { if (findIn && findIn.value.trim().slice(0, RDF_MAX) !== find) runFind(findIn.value); else stepHit(1); });
    if (hitsBox) hitsBox.addEventListener('click', (e) => { const a = e.target.closest('a[data-hit]'); if (!a) return; e.preventDefault(); closeSheet(); gotoHit(+a.dataset.hit); });
    if (fbar) fbar.addEventListener('click', (e) => { if (e.target.closest('#rdFbPrev')) stepHit(-1); else if (e.target.closest('#rdFbNext')) stepHit(1); else if (e.target.closest('#rdFbClear')) clearFind(); });

    /* ── the reader's keys: one letter each, ignored while typing or with a dialog open ── */
    function rdShortcuts() {
      const row = (k, t) => `<tr><td>${k.split(' ').map((x) => `<kbd class="kbd2">${esc(x)}</kbd>`).join(' ')}</td><td>${esc(t)}</td></tr>`;
      modal({ title: 'Reader keyboard shortcuts', html: `<table class="stat-table kbtable">${isSheets ? row('Space PgDn', 'Next sheet') + row('Shift+Space PgUp', 'Previous sheet') + row('↑ ↓', 'Scroll a little') + row('Home End', 'First or last sheet of the section') + row('[ ]', 'Previous or next section') + row('Ctrl+Home Ctrl+End', 'Start or end of the text') + row('g', 'Go to a page') : paged ? row('→ ↓ Space PgDn', 'Next page') + row('← ↑ Shift+Space PgUp', 'Previous page') + row('Home End', 'First or last page of the section') + row('[ ]', 'Previous or next section') + row('Ctrl+Home Ctrl+End', 'Start or end of the text') : cont ? '' : row('← →', 'Previous or next section')}
        ${row('f', 'Find in this text')}${row('n N', 'Next or previous match')}${row('c', 'Contents')}${row('m', 'Highlights, notes and bookmarks')}${row('b', 'Bookmark this place')}${row('a', 'Reading settings (type, theme, view)')}${row('+ -', 'Larger or smaller text')}${row('t', 'Next reading theme')}${row('v', 'Change how it is read: scroll, book pages or PDF sheets')}${row('l', 'Read aloud, or stop')}${row('z', 'Full screen')}${row('h', 'Keep the bars shown, or put them away')}${hasPrinted ? row('p', 'Go to a printed page') : ''}${row('Esc', 'Close a panel, or clear the search')}${row('?', 'This list')}${row('/ Ctrl+K', 'Search every text, or jump anywhere')}</table>`, actions: [{ label: 'Close', kind: 'primary', value: true }] });
    }
    /* a tap on a page break: where this is. The reader's page is its own count (about 300 words) and not the printed page, which the texts do not keep, so the card says so and gives the way to the printed
       page: the scan, searched at the words that follow the break (a scanned text), the source's web edition (a typed one), or chapter and verse (a Bible). It can also copy the place as a reference. */
    const pageCard = async (btn) => {
      const g = +btn.dataset.pgbrk; const k = secIdx(btn); let nx = btn.nextElementSibling; while (nx && !(nx.classList && nx.classList.contains('pw'))) nx = nx.nextElementSibling;
      const words = nx ? rdDomText(nx.querySelector('p') || nx) : ''; const heading = expTitle(secs[k][0], k);
      const ref = rdRef({ title: l.title, by: m.by, section: k + 1, sections: n, heading, page: g, pages: totalPages, kind: prov.kind, src: prov.src });
      const row = (a, b) => `<dt>${a}</dt><dd>${b}</dd>`; const scans = prov.scans.length > 0;
      const web = prov.pageNumbers === 'web' && prov.src ? ` <a href="${esc(prov.src)}" target="_blank" rel="noopener noreferrer">Open the source ↗</a>` : '';
      const html = `<dl class="src-dl">${row('Text', esc(l.title) + (m.by ? `<br><span class="small t2">${esc(m.by)}</span>` : ''))}${row('Section', `${n > 1 ? `${k + 1} of ${n} · ` : ''}${esc(heading)}`)}${prov.kind === 'bible' ? '' : row('Reader page', `${g.toLocaleString()} of ${totalPages.toLocaleString()}. A page here is about 300 words, the same on every screen. It is not the printed page.`)}${row('Original page', esc(rdPageNote(prov.pageNumbers)) + web)}</dl>`;
      const c = await modal({ title: prov.kind === 'bible' ? 'Where this is' : `Page ${g.toLocaleString()} of ${totalPages.toLocaleString()}`, html, actions: [{ label: 'Close', kind: 'ghost', value: null }, { label: 'Copy reference', kind: scans ? '' : 'primary', value: 'copy' }, ...(scans ? [{ label: 'Open the scan at this passage ↗', kind: 'primary', value: 'scan' }] : [])] });
      if (c === 'copy') { const ok = await rdCopy(ref); toast(ok ? 'Copied the reference.' : 'Copying is not available here.', ok ? 'good' : 'bad', 2200); } else if (c === 'scan') provOpenScan(prov, words);
    };
    /* a tap on a printed page's mark (a break, or the small marker inside a paragraph): which page of which edition, how it was found, and the way to the scan */
    const printedCard = async (el) => {
      const lab = el.dataset.pgp; const pp = pgmParse(lab); if (!pp) return; const k = secIdx(el); const pw = el.closest('.pw') || (() => { let x = el.nextElementSibling; while (x && !(x.classList && x.classList.contains('pw'))) x = x.nextElementSibling; return x; })();
      const pnum = pw ? +pw.dataset.p : 0; let words = ''; try { if (el.classList.contains('pgm') && pw) { const r = document.createRange(); r.setStartAfter(el); const pe = pw.querySelector('p'); r.setEndAfter(pe.lastChild); words = r.toString(); } else if (pw) words = rdDomText(pw.querySelector('p') || pw); } catch (e2) { words = pw ? rdDomText(pw) : ''; }
      const heading = expTitle(secs[k][0], k); const short = pgmShort(lab, pgVols); const readerPg = pages.pageAt(k, pnum);
      const ref = rdRef({ title: l.title, by: m.by, section: k + 1, sections: n, heading, page: readerPg, pages: totalPages, printed: short, kind: prov.kind, src: prov.src });
      const row = (a, b2) => `<dt>${a}</dt><dd>${b2}</dd>`; const scans = prov.scans.length > 0; const note = pgmNote(printedGrade);
      const html = `<dl class="src-dl">${row('Text', esc(l.title) + (m.by ? `<br><span class="small t2">${esc(m.by)}</span>` : ''))}${row('Section', `${n > 1 ? `${k + 1} of ${n} · ` : ''}${esc(heading)}`)}${row('Printed page', `<b>${esc(short)}</b> of the printed edition. ${esc(prov.kind !== 'scan' ? 'The number is the one the book’s web edition marks at this place; it follows the printed book.' : pgmKind(lab) === 'read from the page' ? 'The number was read from the page of the scan by the Internet Archive.' : 'The page has no number the Archive could read; this one follows from the numbers around it.')}${note ? ' ' + esc(note) : ''}`)}${row('Reader page', `${readerPg.toLocaleString()} of ${totalPages.toLocaleString()}. The reader’s own count, about 300 words a page; it is not the printed page.`)}${row('In the original', scans ? 'The scan has every page as printed. Open it at this passage to check the page and its number.' : prov.pageNumbers === 'web' ? 'The source’s web edition keeps the printed page numbers.' + (prov.src ? ` <a href="${esc(prov.src)}" target="_blank" rel="noopener noreferrer">Open the source ↗</a>` : '') : esc(rdPageNote(prov.pageNumbers)))}</dl>`;
      const c = await modal({ title: esc(short) + ' · printed edition', html, actions: [{ label: 'Close', kind: 'ghost', value: null }, { label: 'Copy reference', kind: scans ? '' : 'primary', value: 'copy' }, ...(scans ? [{ label: 'Open the scan at this passage ↗', kind: 'primary', value: 'scan' }] : [])] });
      if (c === 'copy') { const ok = await rdCopy(ref); toast(ok ? 'Copied the reference.' : 'Copying is not available here.', ok ? 'good' : 'bad', 2200); } else if (c === 'scan') provOpenScan(prov, words);
    };
    art.addEventListener('click', (e) => { const b = e.target.closest ? e.target.closest('.pgbrk[data-pgbrk]') : null; if (b) { e.preventDefault(); pageCard(b); return; } const q = e.target.closest ? e.target.closest('[data-pgp]') : null; if (q) { e.preventDefault(); printedCard(q); } });
    art.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('.pgm[data-pgp]')) { e.preventDefault(); printedCard(e.target.closest('.pgm[data-pgp]')); } });
    const themeIds = RT_THEMES.map((t2) => t2.id); const styleIds = RL_STYLES.map((x) => x[0]);
    const onReaderKey = (e) => {
      if (e.defaultPrevented || e.altKey || root.isConnected === false) return;
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F') && cont && !document.querySelector('.modal-back,.overlay,.pal-back')) { e.preventDefault(); openSheet('find'); return; }      // the browser's own find cannot see a text that is drawn a part at a time
      if (e.ctrlKey || e.metaKey || palTyping(e.target) || document.querySelector('.modal-back,.overlay,.pal-back')) return;
      const k2 = e.key;
      if (k2 === 'Escape') { if (moreOpen()) closeMore(); else if (sheet && !sheet.hidden) { /* the sheet closes itself */ } else if (document.querySelector('.rtpanel')) { /* so does the panel */ } else if (find) clearFind(); return; }
      if ((sheet && !sheet.hidden) || document.querySelector('.rtpanel') || (e.target && e.target.closest && e.target.closest('button,a,summary,select') && (k2 === ' ' || k2 === 'Enter'))) return;
      if (k2 === 'f' && !e.shiftKey) { e.preventDefault(); openSheet('find'); } else if (k2 === 'n' || k2 === 'N') { e.preventDefault(); stepHit(k2 === 'N' ? -1 : 1); }
      else if (k2 === 'c') { e.preventDefault(); openSheet('contents'); } else if (k2 === 'm') { e.preventDefault(); openSheet('marks'); } else if (k2 === 'b') { e.preventDefault(); bmHere(); }
      else if (k2 === 'a') { e.preventDefault(); rtPanel(); } else if (k2 === '+' || k2 === '=') { e.preventDefault(); bump(1); } else if (k2 === '-' || k2 === '_') { e.preventDefault(); bump(-1); }
      else if (k2 === 't') { e.preventDefault(); const nx = themeIds[(themeIds.indexOf(rtGet().theme) + 1) % themeIds.length]; rtSet({ theme: nx }); toast(RT_THEME_BY_ID[nx].name, '', 1200); }
      else if (k2 === 'v') { e.preventDefault(); const nx = styleIds[(styleIds.indexOf(rlStyleOf(mode)) + 1) % styleIds.length]; toast(RL_STYLES.find((x) => x[0] === nx)[1], '', 1200); switchMode(rlPick(nx, mode)); }
      else if (k2 === 'h') { e.preventDefault(); setBar(pinned() ? 'hide' : 'show'); } else if (k2 === 'p' && hasPrinted) { e.preventDefault(); goPrinted(); } else if (k2 === 'z') { e.preventDefault(); rdAct('fullscreen'); } else if (k2 === 'l') { e.preventDefault(); ls.toggle(listenFrom()); } else if (k2 === '?') { e.preventDefault(); rdShortcuts(); }
    };
    document.addEventListener('keydown', onReaderKey); pathOnLeave(() => document.removeEventListener('keydown', onReaderKey));

    /* go to a bookmark, highlight or search hit */
    const target = wantP >= 0 && (query.p != null || query.h != null || (!hasS && marks.last && marks.last.p > 0)) ? $(`.pw[data-p="${wantP}"]`, art) : null;
    const hlTarget = query.h ? $(`.hl[data-h="${rdCss(query.h)}"]`, art) : null; const mk = $('mark', art);
    const to = hlTarget || target || mk;
    if (landing && wantP >= 0) for (let q = wantP; q <= landEnd && q < wantP + 40; q++) { const pw = $(`.pw[data-p="${q}"]`, art); if (pw && pw.classList) pw.classList.add('landing'); }
    /* the router scrolls to the top once a page's mount returns, which can be after a text that was already loaded has drawn: so scroll now, and again a moment later */
    const toPlace = () => { if (!to || !to.scrollIntoView || root.isConnected === false) return; to.scrollIntoView({ block: landing || autoStart ? 'start' : 'center' }); if ((landing || autoStart) && window.scrollBy) window.scrollBy(0, autoStart ? -90 : -120); };
    if (!cont && to && to.scrollIntoView) { toPlace(); setTimeout(toPlace, 90); if ((target || hlTarget) && !autoStart) (hlTarget || target).classList.add('flash'); }
    if (paged) {
      pg.goto(i, wantP >= 0 ? wantP : null);
      const t3 = (query.h ? $(`.hl[data-h="${rdCss(query.h)}"]`, art) : null) || (find ? $('mark', art) : null); if (t3 && pg.reveal) { pg.reveal(t3); cl(t3).add('flash'); }
      if (isSheets) { if (!store.get('reader.sheetsHint', false)) { store.set('reader.sheetsHint', true); toast(pinned() ? 'Scroll to read, page after page. The bars stay on; the arrow in the top bar puts them away.' : 'Scroll to read, page after page. Tap the text, or the tab at the top, for the bars; the buttons below zoom the sheet.', '', 6000); } }
      else if (!store.get('reader.pagedHint', false)) { store.set('reader.pagedHint', true); toast(pinned() ? 'Tap the sides to turn the page, or swipe. The bars stay on; the arrow in the top bar puts them away.' : 'Tap the sides to turn the page, or swipe. Tap the middle, or the tab at the top, for the bars.', '', 6000); }
    } else if (whole) { jumpWhole(i, wantP >= 0 ? wantP : null); if (hlTarget || find) setTimeout(() => { const t2 = $('mark', art) || $(`.hl[data-h="${rdCss(query.h || '')}"]`, art); if (t2 && t2.scrollIntoView) t2.scrollIntoView({ block: 'center' }); }, 160); }
    if (query.l === '1' && ls.ok) setTimeout(() => { if (root.isConnected !== false) ls.start(listenFrom()); }, 500);      // the previous section ended while it was being read aloud
    if (fres.hits.length) { cur = fres.hits.findIndex((h) => h.k === i && h.p === wantP); if (cur < 0 && !cont) cur = fres.hits.findIndex((h) => h.k === i); paintHits(); if (cur >= 0 && !whole) showHit(false); } else paintHits();
  }, fail);
}
