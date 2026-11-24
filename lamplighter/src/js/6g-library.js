/* ═══════════════════════════ 6g · The Library, organised ═══════════════════════════
   Every text in its collection, each collection split into shelves (groups). Every readable book has a Read button and a random-passage button. */
const LIB_COLLECTIONS = [
  ['The Bible', 'The Hebrew Bible, the deuterocanon, the Orthodox and Ethiopian extras, and the New Testament.', ['hb', 'dc', 'or', 'nt']],
  ['Second Temple and early Christian writings', 'Enoch and the pseudepigrapha, the Dead Sea Scrolls, Nag Hammadi and the Church Fathers, and the Talmud and Jewish tradition that grew up beside them.', ['ps', 'ds', 'ec', 'ju']],
  ['The ancient Near East and Egypt', 'Sumer, Babylon, Ugarit and the Nile.', ['me', 'eg']],
  ['Greece and Rome', 'Poets, philosophers, mystery cults and Stoics.', ['gr']],
  ['India', 'Vedic and Hindu texts, the Buddhist canon and later schools, Jain and Sikh scripture.', ['in', 'bu', 'ja', 'sk']],
  ['Iran and Islam', 'Zoroastrian and Manichaean texts, the Qur’an, Hadith and the Sufis.', ['ir', 'is']],
  ['China and Japan', 'Confucian, Daoist and Shinto sources.', ['ch']],
  ['Northern Europe', 'Norse, Celtic and Finnish sources.', ['ne']],
  ['The Americas, Africa and the Pacific', 'Maya, Nahua, Inca, Native North American, African and Pacific traditions.', ['am', 'na', 'af', 'pa']],
  ['Freedom of conscience', 'The Cyrus Cylinder, Asoka’s edicts, Williams, Spinoza, Locke, Madison, Mill, the Virginia Statute, the Bill of Rights and the Universal Declaration: arguments and laws on who may decide what a person believes.', ['fr']],
  ['Occult and esoteric', 'Hermetic and alchemical writings, the Rosicrucian manifestos, ceremonial magic and grimoires, the tarot, Theosophy, Spiritualism and New Thought. Historically important and often unreliable as history: read them as sources on what people believed and practised.', ['he', 'oc', 'sp']],
  ['Freemasonry and initiatory orders', 'The Old Charges, the first Grand Lodge Constitutions and the main Masonic histories and philosophies. The printed exposures of the rituals are here too, labelled as exposures.', ['ms']],
  ['Shamanic and tribal traditions', 'Field records of shamanic, animist and tribal religion in Siberia and the Arctic, Africa, Australia, the Pacific, the Americas and Southeast Asia, written by early observers. Read them beside living communities’ own accounts.', ['si', 'tb']],
  ['Folklore, witchcraft and the fairy faith', 'Collections of folk belief and folk tale from Britain, Ireland and the rest of Europe, studies of folklore and custom, and the documents of the witch hunts and of demonology: trials, treatises and histories. Read them as sources on what people believed and told, and on what collectors and accusers made of it, and not as evidence that the beliefs were true.', ['fi', 'fu', 'wi']],
  ['Folk tales beyond Europe', 'Folk tales and legends from Asia and the Middle East, Africa and the Caribbean, the Americas, the Pacific and Australia, collected between 1868 and 1924. Most were gathered by outsiders (missionaries, officials, scholars and writers) who chose, translated and often rewrote them; some are by members of the communities themselves. Read them as sources on what was told and on what the collector made of it, and read the communities’ own published versions beside them.', ['ta', 'tf', 'tm', 'tp']],
  ['Modern movements and study aids', 'Quakers, Bahá’í, Theosophy, and the books scholars use to read all of the above.', ['mo', 'sc']],
  ['The imagined shelf', 'Works of the imagination by known authors: an epic poem (Dante), an epic of the fall (Milton), an allegory (Bunyan) and three tales of horror (Lovecraft). They were written as literature and never offered as scripture or revelation, which is why they are kept apart from every tradition’s texts. They are here because readers have taken religious meaning from them or built on them: Dante’s hell, Milton’s Satan, a pilgrim’s road to a city in the sky, a book of forbidden names. They are not sources for what anyone believed or did. Left out of searches, random passages and the Journey unless you ask for them.', ['im']],
];

/* ── leaving areas out (the rules are in 2z-leaveout-core.js): the saved choice, the control that sets it, and its wiring. Used by the Library list, the passage picker, the reader's random page and the search box */
let LO_OPEN = false;                                                                     // the control stays open for the one redraw that follows a change
const libLeftOutRaw = () => store.get(LEFTOUT_KEY, null);
const libLeftOut = () => leftOutSet(libLeftOutRaw(), LIB_COLLECTIONS, LIB_IMAGINED_GROUPS);
const libCollOf = (g) => LIB_COLLECTIONS.findIndex((c) => c[2].includes(g));
const libLeftOutId = (id) => { const l = LIB_BY_ID[id]; return !!l && libLeftOut().has(libCollOf(l.group)); };
function leftOutAllLabel() { const s = libLeftOut(); if (!s.size) return 'All texts'; if (!leftOutChosen(libLeftOutRaw(), LIB_COLLECTIONS)) return 'All texts (not the imagined shelf)'; return `All texts (without the ${s.size} area${s.size === 1 ? '' : 's'} you left out)`; }
function leftOutControl() {
  const out = libLeftOut(); const open = LO_OPEN; LO_OPEN = false;
  return `<details class="card flat leftout" id="loBox"${open ? ' open' : ''} style="margin:12px 0"><summary><b>Leave areas out</b> <span class="muted small" id="loSum">${esc(leftOutSummary(out.size, leftOutChosen(libLeftOutRaw(), LIB_COLLECTIONS)))}</span></summary>
    <p class="small t2" style="max-width:70ch">Tick an area to leave it out of random passages, “all texts” searches and (once you have chosen) the Library’s list. Nothing is deleted: you can still tick it in the passage picker, search it by name and open its books.</p>
    <div class="row tight">${LIB_COLLECTIONS.map(([name], i) => `<label class="chk area"><input type="checkbox" data-leaveout="${i}"${out.has(i) ? ' checked' : ''}><span>${esc(name)}</span></label>`).join('')}</div>
    <div class="row tight" style="margin-top:6px"><button class="btn sm ghost" type="button" data-lo="wider">Scriptures and sources only</button><button class="btn sm ghost" type="button" data-lo="none">Leave nothing out</button><button class="btn sm ghost" type="button" data-lo="reset">Back to the default</button></div></details>`;
}
function leftOutWire(scope, onChange) {
  const box = scope.querySelector('#loBox'); if (!box) return;
  const synced = () => { const s = libLeftOut(); $$('[data-leaveout]', box).forEach((b) => { b.checked = s.has(+b.dataset.leaveout); }); const sum = box.querySelector('#loSum'); if (sum) sum.textContent = leftOutSummary(s.size, leftOutChosen(libLeftOutRaw(), LIB_COLLECTIONS)); LO_OPEN = true; onChange(); };
  box.addEventListener('change', (e) => { const d = e.target && e.target.dataset; if (!d || d.leaveout === undefined) return; store.set(LEFTOUT_KEY, leftOutWith(libLeftOutRaw(), LIB_COLLECTIONS, LIB_IMAGINED_GROUPS, +d.leaveout, e.target.checked)); synced(); });
  box.addEventListener('click', (e) => {
    const d = e.target && e.target.dataset; if (!d || d.lo === undefined) return;
    if (d.lo === 'wider') store.set(LEFTOUT_KEY, leftOutWider(LIB_COLLECTIONS, LIB_SHELF_ONLY, LIB_IMAGINED_GROUPS)); else if (d.lo === 'none') store.set(LEFTOUT_KEY, []); else store.del(LEFTOUT_KEY);
    synced();
  });
}

/* ── the Library page: a search at the top, a way to jump to any collection, "continue reading", and every collection as shelves of books with covers (or, if preferred, a plain list).
   A shelf (group) is closed to a strip of covers until opened; each says what kind of text it holds (2z-library-core.js: LIB_STATUS). The hooks the tests and 6c-texts.js use are kept: #txtNote, #libQ, #libG, #libFull,
   #libUnread, #libCount, [data-lib], [data-rd], [data-read], [data-gfull], [data-gcount], .collwrap, .acc[data-grp]. ── */
const LIB_VIEWS = { shelf: 'Shelf', list: 'List' };
const LIB_EAGER = 240;      /* AA-20: how many books the page draws at once in the shelves it opens by itself (a search, a shelf in the address); every other shelf draws when it opens */
function pathLibraryView(root, query) {
  let st = PATH.get(); const q = (query.q || '').toLowerCase(); const gf = query.g || ''; let sctx = shfContext();      // sctx: which shelf each book is on (6gs-shelves.js); both are read again when a shelf is drawn later (AA-20), so a tick made since the page was drawn shows
  const view = LIB_VIEWS[query.v] ? query.v : (LIB_VIEWS[store.get('lib.view', 'shelf')] ? store.get('lib.view', 'shelf') : 'shelf'); const sortMode = LC_SORTS[query.o] ? query.o : 'time';
  const rows = LIB.filter((l) => (!gf || l.group === gf) && (!q || (l.title + ' ' + l.when + ' ' + ((LIB_GROUPS.find((g) => g[0] === l.group) || [0, ''])[1])).toLowerCase().includes(q)));
  const gname = Object.fromEntries(LIB_GROUPS); const lastRead = (() => { const o = {}; try { const all = MARKS.all(); Object.keys(all).forEach((id) => { if (all[id] && all[id].last) o[id] = all[id].last.t || 0; }); } catch (e) { /* no marks */ } return o; })();
  const prog = (g) => { const [a, b] = PATH.readCount(st, g); return `<span class="stat rd" data-gcount="${g}">${a}/${b} read</span>`; };
  const where = (l) => `<details class="bk-where"><summary>where to read it</summary><div class="t2 small" style="max-width:46ch">${esc(TR[l.tr].n)}</div>${TR[l.tr].q ? `<div class="small" style="margin-top:4px">${ext(libSearchURL(l), 'search for a translation')}</div>` : ''}</details>`;
  const table = (list) => `<div class="table-wrap"><table class="stat-table libtable libcheck"><tr><th></th><th>Text</th><th>Date</th><th>Station</th><th>Translation</th></tr>${list.map((l) => { const sid = LIB_STATION[l.id]; return `<tr data-lib="${l.id}" data-shelf="${shelfOf(l.id, sctx)}"><td><input type="checkbox" data-read="${l.id}"${st.read[l.id] ? ' checked' : ''} aria-label="Mark ${esc(l.title)} as read"></td><td><b>${esc(l.title)}</b>${libImagined(l.id) ? ' <span class="tag imagined" title="A work of the imagination, never meant as scripture">Imagined</span>' : ''}<div class="rdcell" data-rd="${l.id}"></div><div style="margin-top:6px">${shelfBtnHTML(l.id, sctx)}</div></td><td class="small">${esc(l.when)}</td><td class="small">${sid ? `<a href="#/path/station/${sid}">${stNum(PATH_STATION_BY_ID[sid])}</a>` : '·'}</td><td class="small"><details><summary>where</summary><div class="t2" style="max-width:46ch">${esc(TR[l.tr].n)}</div>${TR[l.tr].q ? `<div style="margin-top:4px">${ext(libSearchURL(l), 'search')}</div>` : ''}</details></td></tr>`; }).join('')}</table></div>`;
  const cover = (l) => lcCover(l.id, Math.max(0, libCollOf(l.group)), l.title);
  const card = (l) => { const cv = cover(l); const sid = LIB_STATION[l.id]; const imag = libImagined(l.id);
    return `<article class="bk" data-lib="${l.id}" data-shelf="${shelfOf(l.id, sctx)}"><a class="bk-cover" data-cover="${l.id}" style="${lcCoverStyle(cv)}" aria-label="${esc(l.title)}"><span class="bk-glyph" aria-hidden="true">${cv.glyph}</span><span class="bk-name">${esc(cv.name)}</span>${cv.by ? `<span class="bk-by">${esc(cv.by)}</span>` : '<span></span>'}<span class="bk-prog" aria-hidden="true"><i></i></span></a>
      <div class="bk-meta"><b class="bk-t">${esc(cv.name)}</b><span class="small muted">${esc(l.when)}${sid ? ` · <a href="#/path/station/${sid}">Station ${stNum(PATH_STATION_BY_ID[sid])}</a>` : ''}</span>
      <div class="bk-tags" data-tags="${l.id}">${imag ? '<span class="tag imagined" title="A work of the imagination, never meant as scripture">Imagined</span>' : ''}</div>
      <div class="rdcell" data-rd="${l.id}"></div>
      <div class="bk-shelf">${shelfBtnHTML(l.id, sctx)}</div>
      <label class="chk bk-read"><input type="checkbox" data-read="${l.id}"${st.read[l.id] ? ' checked' : ''} aria-label="Mark ${esc(l.title)} as read"><span class="small">Mark as read</span></label>${where(l)}</div></article>`; };
  /* AA-20 (alpha audit): the books of a shelf are drawn when the shelf opens, not with the page: all 1,450 together were about 55,000 elements, 95 ms here and four to eight times that on a phone. A shut shelf holds one hidden stub per book
     (its id, its shelf, whether it can be read here, and a tick if it is read) so the filters, the counts and the “N shown” total still see every book; opening it (a click, the keyboard, anything that adds the class open) draws the covers,
     fills them in as the page's were (libAttachTexts, 6c-texts.js) and applies the filters again. A search or a shelf in the address opens its shelves at once, LIB_EAGER books at most; the rest are drawn as they come near the screen. */
  const lazyLists = []; let eagerLeft = query.draw === 'all' ? Infinity : LIB_EAGER;      // ?draw=all in the address draws every shelf at once, as the page did before (the tests use it; so can anyone who wants to print the whole Library)
  const listNow = (list) => (view === 'list' ? table(list) : `<div class="bk-grid">${list.map(card).join('')}</div>`);
  const fullAt = (id) => (typeof BEATLAB_TEXTS !== 'undefined' && BEATLAB_TEXTS.indexed && BEATLAB_TEXTS.meta[id] ? ' data-full="1"' : '');
  const stub = (l) => `<span class="bk-ph" data-lib="${l.id}" data-shelf="${shelfOf(l.id, sctx)}"${fullAt(l.id)}>${st.read[l.id] ? `<input type="checkbox" data-read="${l.id}" checked tabindex="-1" aria-hidden="true">` : ''}</span>`;
  const listHTML = (list, open) => { if ((open || query.draw === 'all') && list.length <= eagerLeft) { eagerLeft -= list.length; return listNow(list); } lazyLists.push(list); return `<div class="bk-lazy" data-lazy="${lazyLists.length - 1}">${list.map(stub).join('')}</div>`; };
  /* a big shelf is shown as named parts (2z-subshelves-core.js): each closed to a strip of covers until opened, open at once when there is a search, since a part with no match is left out */
  const partHTML = (g, p) => { const sOn = !!q; const n = p.items.filter((l) => st.read[l.id]).length; const strip = p.items.slice(0, 6).map((l) => `<i class="bk-mini" style="${lcCoverStyle(cover(l))}" aria-hidden="true"></i>`).join('');
    return `<section class="subshelf${sOn ? ' open' : ''}" data-sub="${g}/${p.id}"><button type="button" class="sub-head" aria-expanded="${sOn}"><span class="t"><b>${esc(p.name)}</b><span>${p.items.length} text${p.items.length === 1 ? '' : 's'}</span></span><span class="sub-strip" aria-hidden="true">${strip}</span><span class="stat good" data-sfull></span><span class="stat rd" data-scount>${n}/${p.items.length} read</span>${icon('chevron')}</button><div class="sub-body"><p class="sub-blurb small t2">${esc(p.blurb)}</p>${listHTML(p.items, sOn)}</div></section>`; };
  const shelfBody = (g, list, open) => { const sp = typeof lsubSplit === 'function' ? lsubSplit(g, list) : null; return sp ? `<div class="subshelves">${sp.map((p) => partHTML(g, p)).join('')}</div>` : listHTML(list, open); };
  const group = (g) => {
    const list = lcSort(rows.filter((l) => l.group === g), sortMode, { last: lastRead }); if (!list.length) return ''; const on = !!(q || gf); const stt = lcStatus(g);
    const strip = list.slice(0, 7).map((l) => { const cv = cover(l); return `<i class="bk-mini" style="${lcCoverStyle(cv)}" aria-hidden="true"></i>`; }).join('');
    return `<section class="acc${on ? ' open' : ''}" data-grp="${g}"><button type="button" class="lib-head" aria-expanded="${on}"><span class="t"><b>${esc(gname[g])}</b><span>${list.length} text${list.length === 1 ? '' : 's'}${stt ? ` · <em class="lib-kind">${esc(stt.label)}</em>` : ''}${arrange === 'belief' && shelfAlso(g).length ? ` · <em class="lib-also">also ${shelfAlso(g).map((b) => esc(beliefName(b).toLowerCase())).join(', ')}</em>` : ''}</span><span class="lib-strip" aria-hidden="true">${strip}</span></span><span class="stat good" data-gfull="${g}"></span>${prog(g)}${icon('chevron')}</button><div class="body">${stt ? `<p class="lib-status small t2"><b>${esc(stt.label)}.</b> ${esc(stt.text)}</p>` : ''}${shelfBody(g, list, on)}</div></section>`; };
  const loSet = libLeftOut(); const loFold = leftOutChosen(libLeftOutRaw(), LIB_COLLECTIONS) && !q && !gf; const folded = [];          // once a choice is saved, the left-out collections are folded away (a search or a chosen shelf still shows them)
  const shortName = (n) => n.replace(/^The /, '').replace(/ and (early Christian writings|study aids|initiatory orders)/, '').replace(/, (Africa and the Pacific|witchcraft and the fairy faith)/, '').replace(/^./, (c) => c.toUpperCase()).slice(0, 30);
  const jump = [];
  const byColl = () => LIB_COLLECTIONS.map(([name, blurb, gs], ci) => { if (loFold && loSet.has(ci)) { folded.push(name); return ''; } const inner = gs.map(group).join(''); const imag = gs.every((g) => LIB_IMAGINED_GROUPS.includes(g)); if (inner) jump.push([ci, name, rows.filter((l) => gs.includes(l.group)).length]); return inner ? `<div class="collwrap" id="coll-${ci}"><div class="coll"><h2>${esc(name)}${imag ? ' <span class="tag imagined">Imagined</span>' : ''}</h2><details class="coll-about"><summary class="small">About this shelf</summary><p>${esc(blurb)}${imag ? ` <a href="#/path/imagined">What each one draws on in the real traditions →</a>` : ''}</p></details></div>${inner}</div>` : ''; }).join('');
  const byBelief = () => LIB_BELIEF_ORDER.map((b) => { const meta = BELIEF_BY_ID_LABEL[b]; const gs = shelvesOfBelief(LIB_GROUPS, b).filter((g) => { if (loFold && loSet.has(libCollOf(g))) { const nm = LIB_COLLECTIONS[libCollOf(g)][0]; if (!folded.includes(nm)) folded.push(nm); return false; } return true; });
    const inner = gs.map(group).join(''); if (inner) jump.push(['b-' + b, meta.label, rows.filter((l) => gs.includes(l.group)).length]); const imag = b === 'imag';
    return inner ? `<div class="collwrap" id="coll-b-${b}"><div class="coll"><h2>${esc(beliefFull(b))}${imag ? ' <span class="tag imagined">Imagined</span>' : ''}</h2><details class="coll-about"><summary class="small">About this shelf</summary><p>${esc(meta.line)}${imag ? ` <a href="#/path/imagined">What each one draws on in the real traditions →</a>` : ''}</p>${meta.care ? `<p class="small muted">${esc(meta.care)}</p>` : ''}</details></div>${inner}</div>` : ''; }).join('');
  const arrange = query.a === 'belief' || query.a === 'collection' ? query.a : (store.get('lib.arrange', 'belief') === 'collection' ? 'collection' : 'belief');      /* by belief (One God, Many gods, Spirit in all things, Inner paths: 2z-belief-core.js) or by region and era (the collections above) */
  const colls = arrange === 'belief' ? byBelief() : byColl();
  const viewBtns = Object.entries(LIB_VIEWS).map(([k, n]) => `<button type="button" data-libview="${k}" aria-pressed="${view === k}">${n}</button>`).join('');
  /* The first screen is the books. Under the page's title there is one quiet row (Filter and sort, Random, Add your own books) and then the shelves. Every filter, sort, count, chip, shelf list and note sits under
     "Filter and sort", shut until the reader opens it (the choice is remembered in lib.opts). The one search box is the page's own header (it searches every text); a title filter in the address (?q=) still works and says so. */
  const optsOpen = store.get('lib.opts', false) === true; const active = [q ? `matching “${esc(query.q)}”` : '', gf ? esc(gname[gf] || gf) : ''].filter(Boolean).join(' · ');
  const quick = `<div class="lib-quick"><button type="button" class="lib-optsbtn" data-libopts aria-expanded="${optsOpen}" aria-controls="libOpts"><span>Filter and sort</span>${icon('chevron')}</button><span class="lib-quick-sum small muted"><span id="libSum">${active}</span>${q || gf ? ' <a href="#/path/library">Show all</a>' : ''}</span><span class="lib-quick-links"><a href="#/path/passage" title="A random passage from any text">${icon('dice')}Random</a><a href="#/path/own" title="Put your own PDFs, e-books and text files, or a whole folder of them, on a shelf here">${icon('upload')}Add your own books</a></span></div>`;
  const panel = `<div class="lib-opts" id="libOpts"${optsOpen ? '' : ' hidden'}>
    <div class="lib-bar"><select class="select" id="libG" style="width:auto;max-width:280px" aria-label="Filter by shelf"><option value="">${arrange === 'belief' ? 'All shelves' : 'All collections'}</option>${(arrange === 'belief' ? LIB_BELIEF_ORDER.map((b) => [beliefName(b), shelvesOfBelief(LIB_GROUPS, b)]) : LIB_COLLECTIONS.map(([n, , gs]) => [n, gs])).map(([n, gs]) => `<optgroup label="${esc(n)}">${gs.map((g) => `<option value="${g}"${gf === g ? ' selected' : ''}>${esc(gname[g])}</option>`).join('')}</optgroup>`).join('')}</select>
      <label class="chip tog"><input type="checkbox" id="libFull"><span>Readable here</span></label><label class="chip tog"><input type="checkbox" id="libUnread"><span>Unread</span></label><label class="chip tog"><input type="checkbox" id="libStarted"><span>In progress</span></label><label class="chip tog"><input type="checkbox" id="libWant"><span>Want to read</span></label>
      <select class="select" id="libSort" style="width:auto" aria-label="Sort each shelf">${['time', 'az', 'recent'].map((k) => `<option value="${k}"${sortMode === k ? ' selected' : ''}>${LC_SORTS[k]}</option>`).join('')}</select>
      <span class="seg" role="group" aria-label="How to show the books">${viewBtns}</span><span class="lib-arrange" role="group" aria-label="How to arrange the library"><span class="muted small">Arrange by</span><span class="seg">${[['belief', 'Belief'], ['collection', 'Region and era']].map(([k, n]) => `<button type="button" data-libarr="${k}" aria-pressed="${arrange === k}">${n}</button>`).join('')}</span></span><span class="muted small" id="libCount">${rows.length} shown</span></div>
    <div class="hint lib-note" id="txtNote">Checking for the texts folder…</div>
    ${jump.length > 1 && !q && !gf ? `<nav class="lib-jump" aria-label="Jump to ${arrange === 'belief' ? 'a belief' : 'a collection'}">${jump.map(([ci, n, c]) => `<button type="button" class="chip" data-jumpc="${ci}">${esc(shortName(n))} <span class="muted">${c}</span></button>`).join('')}</nav>` : ''}
    ${shelvesStripHTML(sctx)}
    <details class="lib-about"><summary>How the Library works</summary><p class="t2 small" style="max-width:72ch">${LIB.length} texts in chronological order within each shelf. Tick what you have read. Where a public-domain or openly licensed <b>English translation</b> exists, the full text opens in the reader here; every other entry names a standard translation to look for. Each shelf says what kind of text it holds: nothing is left out for being unverified or not canon, it is kept, labelled and explained. There are also <b>2,307</b> recorded texts from every tradition, dated and placed, whether or not a translation can be read here: <a href="#/atlas/texts">browse every recorded text →</a></p></details>
    ${leftOutControl()}
  </div>`;
  root.querySelector('#pbody').innerHTML = `<div class="lib2">${quick}${panel}
    ${libContinueHTML()}
    ${colls || (folded.length ? '' : '<p class="t2">Nothing matches. Try a shorter search.</p>')}${folded.length ? `<p class="hint" id="loFolded">Left out of this list: ${folded.map(esc).join(', ')}. Open <b>Filter and sort</b> above, then <b>Leave areas out</b>, to bring them back.</p>` : ''}</div>`;
  const go = debounce(() => { location.hash = `#/path/library?${new URLSearchParams({ q: query.q || '', g: $('#libG').value, o: $('#libSort').value, v: view, a: arrange })}`; }, 350);
  $('#libG', root).addEventListener('change', go); const so = $('#libSort', root); if (so) so.addEventListener('change', go);
  const L2 = root.querySelector('.lib2'); if (L2) L2.addEventListener('click', (e) => {
    const ob = e.target.closest && e.target.closest('[data-libopts]'); if (ob) { const box = root.querySelector('#libOpts'); if (box) { const on = !!box.hidden; box.hidden = !on; ob.setAttribute('aria-expanded', String(on)); store.set('lib.opts', on); } return; }
    const vb = e.target.closest && e.target.closest('[data-libview]'); if (vb) { store.set('lib.view', vb.dataset.libview); location.hash = `#/path/library?${new URLSearchParams({ q: query.q || '', g: gf, o: sortMode, v: vb.dataset.libview, a: arrange })}`; return; }
    const ab = e.target.closest && e.target.closest('[data-libarr]'); if (ab) { store.set('lib.arrange', ab.dataset.libarr); location.hash = `#/path/library?${new URLSearchParams({ q: query.q || '', g: gf, o: sortMode, v: view, a: ab.dataset.libarr })}`; return; }
    const sh = e.target.closest && e.target.closest('.sub-head'); if (sh) { const on = sh.parentElement.classList.toggle('open'); sh.setAttribute('aria-expanded', on); return; }
    const jb = e.target.closest && e.target.closest('[data-jumpc]'); if (jb) { const t = root.querySelector('#coll-' + jb.dataset.jumpc); if (t && t.scrollIntoView) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
  /* the line beside Filter and sort says what is narrowing the list while the panel is shut: the address's own filters and any of the four ticks */
  const paintSum = () => { const el = $('#libSum', root); if (!el) return; const bits = []; if (query.q) bits.push(`matching “${query.q}”`); if (gf) bits.push(gname[gf] || gf); [['#libFull', 'Readable here'], ['#libUnread', 'Unread'], ['#libStarted', 'In progress'], ['#libWant', 'Want to read']].forEach(([s, n]) => { const c = $(s, root); if (c && c.checked) bits.push(n); }); el.textContent = bits.join(' · '); };
  if (L2) L2.addEventListener('change', paintSum);
  libAttachTexts(root);
  if (L2 && L2.querySelectorAll) {      /* AA-20: what a shut shelf's stubs cannot know until the list of readable texts has loaded, and the drawing of a shelf when it opens */
    const shut = (el) => !!el.closest('.acc:not(.open), .subshelf:not(.open)');
    const drawOne = (lz) => {
      if (lz.hasAttribute('data-done') || shut(lz)) return; const list = lazyLists[+lz.dataset.lazy]; if (!list) return;
      lz.setAttribute('data-done', '1'); st = PATH.get(); sctx = shfContext();
      lz.innerHTML = '<div id="txtNote" hidden></div>' + listNow(list); const note = lz.firstChild;
      libAttachTexts(lz);      // the same fill as the page's own: the Read buttons, the covers' links and bars, the pictures and the page numbers; the hidden note is only what that function looks for, and goes when it has run
      if (typeof TXT !== 'undefined') TXT.index().then(() => { if (note && note.parentNode) note.parentNode.removeChild(note); if (typeof root._libApply === 'function') root._libApply(); });
    };
    const drawIn = (scope) => Array.from(scope.querySelectorAll('.bk-lazy')).forEach(drawOne);
    if (typeof MutationObserver === 'function') new MutationObserver((ms) => ms.forEach((m) => { const t = m.target; if (t.classList && t.classList.contains('open') && (t.classList.contains('acc') || t.classList.contains('subshelf'))) drawIn(t); })).observe(L2, { subtree: true, attributes: true, attributeFilter: ['class'] });
    const openLazy = Array.from(L2.querySelectorAll('.bk-lazy')).filter((lz) => !shut(lz));      // shelves a search or the address opened, past the first LIB_EAGER books
    if (openLazy.length) { if (typeof IntersectionObserver === 'function') { const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); drawOne(e.target); } }), { rootMargin: '900px 0px' }); openLazy.forEach((lz) => io.observe(lz)); } else openLazy.forEach(drawOne); }
    if (typeof TXT !== 'undefined') TXT.index().then((meta) => {
      if (!meta) return; $$('.bk-ph', root).forEach((s) => { if (meta[s.dataset.lib]) s.dataset.full = '1'; });      // “readable here” for the books of a shut shelf, for the filter and for the parts' counts
      $$('[data-sfull]', root).forEach((el) => { const n = $$('[data-lib]', el.closest('.subshelf')).filter((x) => x.dataset.full).length; el.textContent = n ? `${n} readable` : ''; });
      if (typeof root._libApply === 'function') root._libApply();
    });
  }
  leftOutWire(root, () => pathLibraryView(root, query));
}
