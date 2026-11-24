/* ═══════════════════════════ 6gs · My shelves: the page, the shelve box, and the stored copy ═════════════════════════
   What belongs on which shelf, and the numbers, is in 2z-shelves-core.js (tested). Here: where the choices are kept (store 'lib.shelves'; the log of days is 'reader.days'), the small Shelve button that the
   Library and the reader carry, the box it opens (a shelf, "I have read this", the reader's own lists), and the page #/path/shelves with the shelves, the last twelve weeks and what the reading adds up to. */
const SHELVES = {
  key: 'lib.shelves', daysKey: 'reader.days',
  get() { return shfClean(store.get(SHELVES.key, null)); },
  upd(fn) { const s = SHELVES.get(); const r = fn(s); store.set(SHELVES.key, s); return r; },
  days() { return shfDaysClean(store.get(SHELVES.daysKey, {})); },
  log(chars, now) { if (!(chars > 0)) return; const d = SHELVES.days(); shfDayAdd(d, chars, now); store.set(SHELVES.daysKey, d); },
};
/* a book is marked read or not (the Library's tick, the reader's, the box's), and the day is kept so the year can be counted */
function shfMarkRead(id, on) { PATH.upd((s) => { if (on) s.read[id] = true; else delete s.read[id]; }); SHELVES.upd((s) => { shfDone(s, id, !!on); }); }
/* everything the shelves need to know about the reader, read once */
function shfContext() {
  let all = {}; try { all = MARKS.all(); } catch (e) { /* no marks yet */ } const cache = {};
  return { read: PATH.get().read, shelves: SHELVES.get(), marksOf: (id) => { if (!(id in cache)) cache[id] = all[id] ? marksClean(all[id]) : null; return cache[id]; } };
}
const shelfOf = (id, ctx) => shfStatus(id, ctx.shelves, ctx.read, ctx.marksOf(id));
const SHELF_LABEL = Object.assign({ none: 'Shelve' }, SHF_STATUS);
/* the small button on a book: it says which shelf the book is on, and opens the box to change it */
function shelfBtnHTML(id, ctx) {
  const st = shelfOf(id, ctx); const l = LIB_BY_ID[id]; const lists = shfListsOf(ctx.shelves, id).length; const t = l ? l.title : id;
  return `<button type="button" class="shv-btn" data-shelve="${id}" data-st="${st}" aria-haspopup="dialog" aria-label="${esc(st === 'none' ? `Put ${t} on a shelf` : `${t}: ${SHELF_LABEL[st]}. Change its shelf`)}" title="${esc(st === 'none' ? 'Put this book on a shelf or a list' : 'Change the shelf or the lists this book is on')}">${icon(st === 'finished' ? 'check' : 'bookmark')}<span>${esc(SHELF_LABEL[st])}</span>${lists ? `<span class="shv-n" aria-hidden="true">+${lists}</span>` : ''}</button>`;
}
/* the strip at the top of the Library: the shelves with their counts */
function shelvesStripHTML(ctx) {
  const ids = LIB.map((l) => l.id); const g = shfGroups(ids, ctx.shelves, ctx.read, ctx.marksOf); const n = ctx.shelves.lists.length;
  const chip = (s, label, c) => `<a class="chip" href="#/path/shelves?s=${s}">${label} <span class="muted">${c}</span></a>`;
  return `<nav class="lib-shelves" aria-label="My shelves"><span class="lib-shelves-t">My shelves</span>${chip('reading', 'Reading now', g.reading.length)}${chip('want', 'Want to read', g.want.length)}${chip('finished', 'Finished', g.finished.length)}${n ? chip('lists', 'My lists', n) : ''}<a class="small" href="#/path/shelves">Your reading and stats →</a></nav>`;
}

/* the box a book's Shelve button opens. Changes are kept as they are made. */
async function shelveBox(id) {
  const l = LIB_BY_ID[id]; if (!l) return false;
  const ctx0 = shfContext(); const st0 = shelfOf(id, ctx0); const ex = ctx0.shelves.set[id];
  const choice = ['reading', 'aside', 'want'].includes(st0) ? st0 : (ex ? ex.s : 'none'); const cv = lcCover(id, Math.max(0, libCollOf(l.group)), l.title);
  const opts = [['none', 'Not on a shelf', 'A book you have begun stays on Reading now.'], ['want', 'Want to read', 'Keep it for later. It moves to Reading now when you begin it.'], ['reading', 'Reading now', 'You are in the middle of it. Reading past the first screen puts a book here by itself.'], ['aside', 'Put down', 'Set it aside. It comes back to Reading now if you read in it again.']];
  const listsHTML = () => { const s = SHELVES.get(); return s.lists.length ? s.lists.map((x) => `<label class="chk shv-list"><input type="checkbox" data-shvlist="${esc(x.id)}"${x.ids.includes(id) ? ' checked' : ''}><span>${esc(x.name)} <span class="small muted">${x.ids.length}</span></span></label>`).join('') : '<p class="small muted" style="margin:0">No lists yet. A list is your own set of books, such as “For the seminar”.</p>'; };
  const html = `<div class="shv-box"><div class="shv-head"><span class="bk-mini big" style="${lcCoverStyle(cv)}" aria-hidden="true"><span>${esc(cv.glyph)}</span></span><div><b>${esc(l.title)}</b><div class="small muted">${esc(l.when)}</div><div class="small shv-now" id="shvNow" role="status" aria-live="polite"></div></div></div>
    <div class="shv-radios" role="radiogroup" aria-label="Shelf">${opts.map(([v, n, d]) => `<label class="shv-opt"><input type="radio" name="shvSt" value="${v}"${v === choice ? ' checked' : ''}><span><b>${n}</b>${d ? `<span class="small muted">${d}</span>` : ''}</span></label>`).join('')}</div>
    <label class="chk shv-fin"><input type="checkbox" id="shvRead"${ctx0.read[id] ? ' checked' : ''}><span><b>I have read this book</b> <span class="small muted">· it goes to Finished</span></span></label>
    <div class="eyebrow" style="margin:14px 0 6px">My lists</div><div id="shvLists">${listsHTML()}</div>
    <div class="row tight" style="margin-top:8px"><input class="input" id="shvNew" maxlength="${SHF_LIMITS.name}" placeholder="New list, e.g. “For the seminar”" aria-label="Name for a new list" style="flex:1;min-width:160px"><button class="btn sm" id="shvNewGo" type="button">Add list</button></div></div>`;
  const done = modal({ title: 'Shelve this book', html, actions: [{ label: 'Done', kind: 'primary', value: true }] });
  const backs = document.querySelectorAll ? Array.from(document.querySelectorAll('.modal-back')) : []; const back = backs[backs.length - 1]; if (!back) return done;
  const now = () => { const c = shfContext(); const st = shelfOf(id, c); const n = shfListsOf(c.shelves, id).length; const el = $('#shvNow', back); if (el) el.textContent = `On: ${st === 'none' ? 'no shelf' : SHELF_LABEL[st]}${n ? ` · ${n} list${n === 1 ? '' : 's'}` : ''}`; };
  back.addEventListener('change', (e) => {
    const t = e.target; if (!t || !t.matches) return;
    if (t.matches('[name="shvSt"]')) SHELVES.upd((s) => { shfSet(s, id, t.value === 'none' ? '' : t.value); });
    else if (t.id === 'shvRead') shfMarkRead(id, t.checked);
    else if (t.dataset && t.dataset.shvlist) { const ok = SHELVES.upd((s) => shfListToggle(s, t.dataset.shvlist, id, t.checked)); if (!ok) { t.checked = !t.checked; toast(`A list holds up to ${SHF_LIMITS.perList} books.`, 'warn'); } }
    now();
  });
  const addList = () => { const inp = $('#shvNew', back); const nm = inp ? inp.value.trim() : ''; if (!nm) return; const made = SHELVES.upd((s) => { const x = shfListNew(s, nm, Date.now(), 'l' + uid()); if (x) shfListToggle(s, x.id, id, true); return x; }); if (!made) { toast(`You can keep up to ${SHF_LIMITS.lists} lists.`, 'warn'); return; } inp.value = ''; $('#shvLists', back).innerHTML = listsHTML(); now(); };
  $('#shvNewGo', back).addEventListener('click', addList); $('#shvNew', back).addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addList(); } });
  now(); return done;
}
/* after the box closes: the button, the filter marks and the tick on whatever page the book is on, in place */
function shelfRefresh(root, id) {
  const body = root.querySelector ? root.querySelector('#pbody') : null; if (body && body._shDraw && body.querySelector('.shv-page')) { body._shDraw(); return; }
  const ctx = shfContext();
  $$(`[data-shelve="${id}"]`, root).forEach((b) => { b.outerHTML = shelfBtnHTML(id, ctx); });
  $$(`[data-lib="${id}"]`, root).forEach((el) => { el.dataset.shelf = shelfOf(id, ctx); });
  $$(`[data-read="${id}"]`, root).forEach((c) => { const on = !!ctx.read[id]; if (c.checked !== on) { c.checked = on; c.dispatchEvent(new Event('change', { bubbles: true })); } });
  if (typeof root._libApply === 'function') root._libApply();
  const nb = root.querySelector ? root.querySelector(`[data-shelve="${id}"]`) : null; if (nb && nb.focus) nb.focus();
}

/* ── the page ── */
const shfWhen = (t) => (t ? mkDate(t) : '');
function shelfCardHTML(l, ctx, meta, o) {
  const id = l.id; const cv = lcCover(id, Math.max(0, libCollOf(l.group)), l.title); const m = ctx.marksOf(id); const mm = meta && meta[id]; const st = shelfOf(id, ctx);
  const frac = shfFraction(id, ctx.read, m, mm && mm.n); const pct = Math.round(frac * 100); const imag = libImagined(id); const ex = ctx.shelves.set[id];
  const line = st === 'finished' ? `Finished${ctx.shelves.done[id] ? ' ' + shfWhen(ctx.shelves.done[id]) : ''}` : st === 'reading' ? `${pct}% through${m && m.last ? ' · last read ' + shfWhen(m.last.t) : ''}` : st === 'want' ? (ex && ex.t ? `Added ${shfWhen(ex.t)}` : '') : st === 'aside' ? (ex && ex.t ? `Put down ${shfWhen(ex.t)}` : 'Put down') : '';
  const cover = `<${mm ? 'a' : 'div'} class="bk-cover"${mm ? ` href="#/path/read/${id}"` : ''} style="${lcCoverStyle(cv)}" aria-label="${esc(l.title)}"><span class="bk-glyph" aria-hidden="true">${cv.glyph}</span><span class="bk-name">${esc(cv.name)}</span>${cv.by ? `<span class="bk-by">${esc(cv.by)}</span>` : '<span></span>'}<span class="bk-prog" aria-hidden="true"><i style="width:${pct}%"></i></span></${mm ? 'a' : 'div'}>`;
  const where = !mm ? `<details class="bk-where"><summary>where to read it</summary><div class="t2 small" style="max-width:46ch">${esc(TR[l.tr].n)}</div></details>` : '';
  return `<article class="bk${mm ? '' : ' off'}" data-lib="${id}" data-shelf="${st}">${cover}<div class="bk-meta"><b class="bk-t">${esc(cv.name)}</b><span class="small muted">${esc(l.when)}</span>${line ? `<span class="small shv-line">${esc(line)}</span>` : ''}
    ${imag ? '<div class="bk-tags"><span class="tag imagined" title="A work of the imagination, never meant as scripture">Imagined</span></div>' : ''}<div class="rdcell">${mm ? `<a class="btn sm ${st === 'finished' ? '' : 'primary'}" href="#/path/read/${id}">${st === 'reading' ? 'Continue' : st === 'finished' ? 'Read again' : 'Read'}</a>` : ''}${o && o.unlist ? `<button class="btn sm ghost icon" type="button" data-unlist="${id}" aria-label="Take ${esc(l.title)} off this list" title="Take it off this list">${icon('x')}</button>` : ''}</div><div class="bk-shelf">${shelfBtnHTML(id, ctx)}</div>${where}</div></article>`;
}
function shelvesGridHTML(ids, ctx, meta, o) { return `<div class="bk-grid shv-books">${ids.map((id) => shelfCardHTML(LIB_BY_ID[id], ctx, meta, o)).join('')}</div>`; }
const SHELF_EMPTY = {
  reading: 'Nothing here yet. A book appears on Reading now as soon as you read past its first screen, or when you choose it with the Shelve button.',
  want: 'Nothing saved yet. On any book in the Library, tap Shelve and choose Want to read, and it will wait for you here.',
  finished: 'No finished books yet. A book is Finished when you reach the end of it in the reader, or tick “I have read this”.',
  aside: 'Nothing is put down.',
};
function shelvesWeeksHTML(w, cpm) {
  const dayTitle = (c) => { const d = new Date(c.d + 'T12:00:00'); const nm = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }); return c.future ? nm : `${nm}: ${c.c ? 'about ' + shfRound(c.c / SHF_CHARS_PER_WORD).toLocaleString() + ' words' : 'no reading'}`; };
  const cap = `${w.active30} of the last 30 days${w.run > 1 ? `, ${w.run} days in a row` : ''}`;
  return `<section class="card flat shv-weeks"><div class="card-title"><h3>The last ${w.weeks} weeks</h3><span class="small muted">${esc(cap)}</span></div>
    <div class="shv-gridwrap"><div class="shv-days" aria-hidden="true"><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span><span></span></div>
    <div class="shv-grid" role="img" aria-label="${esc(`Reading in the last ${w.weeks} weeks: ${w.activeAll} days with reading. ${cap}.`)}" style="--cols:${w.weeks}">${w.cells.map((c) => `<i class="l${c.lvl}${c.future ? ' fut' : ''}" title="${esc(dayTitle(c))}"></i>`).join('')}</div></div>
    <div class="shv-legend small muted" aria-hidden="true"><span>Less</span><i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i><span>More</span></div>
    <p class="small muted" style="margin:6px 0 0">${w.activeAll ? `Each square is a day. It counts how far you moved through a text, not how long a page was open: a jump to another place, or pages flipped past, are not counted.` : 'Each square is a day. It fills in as you read; nothing yet.'}</p></section>`;
}
function shelvesBreadthHTML(st) {
  const row = (c) => { const f = c.readable ? Math.round(100 * c.finished / c.readable) : 0; const s2 = c.readable ? Math.round(100 * c.started / c.readable) : 0; const txt = c.readable ? `${c.finished} finished${c.started ? ` · ${c.started} begun` : ''} of ${c.readable}` : 'none to read here';
    return `<li><span class="nm">${esc(c.name)}</span><span class="shv-meter" role="img" aria-label="${esc(`${c.name}: ${txt}`)}"><i class="f" style="width:${f}%"></i><i class="s" style="width:${Math.min(100 - f, s2)}%"></i></span><span class="small muted ct">${esc(txt)}</span></li>`; };
  const real = st.byColl.filter((c) => !c.imagined); const imag = st.byColl.filter((c) => c.imagined);
  return `<section class="card flat shv-breadth"><div class="card-title"><h3>Across the traditions</h3></div><p class="small t2" style="max-width:70ch">You have begun or finished a text on <b>${st.traditions.touched} of the Library’s ${st.traditions.of}</b> shelves (fiction is not counted). The bars show, for each collection, the share of its readable texts you have finished and begun.</p>
    <ul class="shv-colls">${real.map(row).join('')}</ul>${imag.length ? `<details class="shv-imag"><summary class="small">The imagined shelves (works of fiction, kept apart)</summary><ul class="shv-colls">${imag.map(row).join('')}</ul></details>` : ''}</section>`;
}
function pathShelvesView(root, query) {
  const body = root.querySelector('#pbody');
  const draw = () => {
    const ctx = shfContext(); const meta = (typeof BEATLAB_TEXTS !== 'undefined' && BEATLAB_TEXTS.indexed) ? BEATLAB_TEXTS.meta : null; const cpm = store.get('reader.cpm', RD_CPM.def);
    const st = shfStats({ lib: LIB, collections: LIB_COLLECTIONS, imagined: LIB_IMAGINED_GROUPS, meta, marksOf: ctx.marksOf, read: ctx.read, shelves: ctx.shelves, cpm, now: Date.now() });
    const w = shfWeeks(SHELVES.days(), Date.now(), 12); const g = st.groups; const lists = ctx.shelves.lists;
    const order = ['reading', 'want', 'finished', 'aside']; const cnt = { reading: g.reading.length, want: g.want.length, finished: g.finished.length, aside: g.aside.length, lists: lists.length };
    const tab = (query.s === 'lists' || order.includes(query.s)) ? query.s : (order.find((k) => cnt[k]) || 'reading'); const curList = lists.find((x) => x.id === query.l) || lists[0];
    const tabs = [['reading', 'Reading now'], ['want', 'Want to read'], ['finished', 'Finished'], ...(cnt.aside || tab === 'aside' ? [['aside', 'Put down']] : []), ['lists', 'My lists']];
    const yrs = Object.keys(st.years).sort((a, b) => b - a);
    const tile = (n, label, sub) => `<div class="shv-tile"><b>${n}</b><span>${label}</span>${sub ? `<small>${sub}</small>` : ''}</div>`;
    const yr = new Date().getFullYear();
    let shelf = '';
    if (tab === 'lists') {
      shelf = `<div class="row tight shv-listbar">${lists.map((x) => `<a class="chip" href="#/path/shelves?s=lists&l=${esc(x.id)}" aria-pressed="${curList && curList.id === x.id}">${esc(x.name)} <span class="muted">${x.ids.filter((id) => LIB_BY_ID[id]).length}</span></a>`).join('')}<button class="btn sm" type="button" data-newlist>${icon('plus')}New list</button></div>`;
      if (curList) { const ids = curList.ids.filter((id) => LIB_BY_ID[id]); shelf += `<div class="spread shv-listhead"><h3>${esc(curList.name)}</h3><span class="row tight"><button class="btn sm ghost" type="button" data-rnlist="${esc(curList.id)}">${icon('pen')}Rename</button><button class="btn sm ghost" type="button" data-dellist="${esc(curList.id)}">${icon('trash')}Delete list</button></span></div>${ids.length ? shelvesGridHTML(ids, ctx, meta, { unlist: true }) : '<p class="t2">This list is empty. On any book, tap Shelve and tick this list.</p>'}`; }
      else shelf += '<p class="t2" style="margin-top:12px">A list is your own set of books: a course, a question you are following, a year’s reading. Make one here, or from the Shelve button on any book. A book can be on any number of lists, whatever shelf it is on.</p>';
    } else shelf = g[tab].length ? shelvesGridHTML(g[tab], ctx, meta) : `<p class="t2" style="margin:14px 0;max-width:64ch">${SHELF_EMPTY[tab]} <a href="#/path/library">Open the Library</a></p>`;
    body.innerHTML = `<div class="shv-page"><p class="t2 small" style="max-width:74ch;margin:0 0 12px">Your books as you read them: what you are reading, what you want to read, what you have finished, and your own lists. It is worked out from your reading in this browser, and kept only here; the Setup backup includes it.</p>
      <div class="shv-tiles">${tile(st.counts.finished, st.counts.finished === 1 ? 'book finished' : 'books finished', yrs.includes(String(yr)) ? `${st.years[yr]} in ${yr}` : '')}${tile(st.counts.reading, 'reading now', st.counts.want ? `${st.counts.want} to read next` : '')}${tile(shfRound(st.words).toLocaleString(), 'words read (about)', st.chars ? `${shfHours(st.minutes)} at your pace` : (meta ? '' : 'needs the texts folder'))}${tile(w.active30, w.active30 === 1 ? 'day read in 30' : 'days read in 30', w.run > 1 ? `${w.run} days in a row` : (w.active7 ? `${w.active7} this week` : ''))}</div>
      ${shelvesWeeksHTML(w, cpm)}
      <nav class="shv-tabs" aria-label="Shelves">${tabs.map(([k, n]) => `<a class="chip" href="#/path/shelves?s=${k}" aria-pressed="${tab === k}">${n} <span class="muted">${cnt[k]}</span></a>`).join('')}</nav>
      <section class="shv-shelf" aria-live="polite">${shelf}</section>
      ${shelvesBreadthHTML(st)}
      <p class="small muted shv-foot">Words are an estimate: six characters to a word, counted over the part of each text you are through. Time is at your own reading pace (${Math.round(cpm / 6)} words a minute, learned from your reading and set in the reader). ${yrs.length ? `Finished by year: ${yrs.slice(0, 4).map((y) => `${y} · ${st.years[y]}`).join(', ')}${st.undated ? `; ${st.undated} marked before dates were kept` : ''}. ` : ''}</p>
      <div class="row"><button class="btn sm" type="button" data-shexport>${icon('download')}Keep my shelves as text (Markdown)</button></div></div>`;
    const pg = body.querySelector('.shv-page'); if (!pg) return;
    pg.addEventListener('click', async (e) => {
      const t = e.target; const q = (sel) => (t.closest ? t.closest(sel) : null);
      if (q('[data-shexport]')) { const c = shfContext(); const ids = LIB.map((l) => l.id); download('lamplighter-my-shelves.md', shfMarkdown(c.shelves, shfGroups(ids, c.shelves, c.read, c.marksOf), titleOf, mkDate), 'text/markdown'); return; }
      const un = q('[data-unlist]'); if (un && curList) { SHELVES.upd((s) => { shfListToggle(s, curList.id, un.dataset.unlist, false); }); draw(); return; }
      if (q('[data-newlist]')) { const v = await shelfNameBox('New list', ''); if (v) { const made = SHELVES.upd((s) => shfListNew(s, v, Date.now(), 'l' + uid())); if (made) location.hash = `#/path/shelves?s=lists&l=${made.id}`; else toast(`You can keep up to ${SHF_LIMITS.lists} lists.`, 'warn'); } return; }
      const rn = q('[data-rnlist]'); if (rn) { const l0 = lists.find((x) => x.id === rn.dataset.rnlist); const v = l0 ? await shelfNameBox('Rename this list', l0.name) : null; if (v) { SHELVES.upd((s) => { shfListRename(s, l0.id, v); }); draw(); } return; }
      const dl = q('[data-dellist]'); if (dl) { const l0 = lists.find((x) => x.id === dl.dataset.dellist); if (l0 && await confirmBox('Delete this list?', `<p>“${esc(l0.name)}” will be deleted. The books are not: they stay where they are on your shelves and in the Library.</p>`, 'Delete', 'danger')) { SHELVES.upd((s) => { shfListRemove(s, l0.id); }); location.hash = '#/path/shelves?s=lists'; } }
    });
  };
  body._shDraw = draw; draw();
  if (typeof BEATLAB_TEXTS !== 'undefined' && !BEATLAB_TEXTS.indexed) TXT.index().then(() => { if (body._shDraw === draw && body.querySelector('.shv-page')) draw(); });
}
async function shelfNameBox(title, value) {
  return modal({ title, html: `<label class="small t2" for="shvName">Name</label><input class="input" id="shvName" maxlength="${SHF_LIMITS.name}" value="${esc(value)}" style="width:100%" placeholder="e.g. “For the seminar”" autocomplete="off">`, actions: [{ label: 'Cancel', kind: 'ghost', value: null }, { label: 'Save', kind: 'primary', collect: (back) => $('#shvName', back).value.trim() || null }] });
}
