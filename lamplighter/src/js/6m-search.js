/* ═══════════════════════════ 6m · Search every text ═══════════════════════════
   Streams through the texts folder (four at a time) and shows passages as they are found. Each text is looked at and let go (TXT.scan in 6c-texts.js: on a web address it is fetched and read as data, so nothing holds it afterwards;
   a text that was already open stays open), and what is kept of a hit is a copy of its own words. The search of every text asks first on a website (it downloads the whole library) and from a file (the engine keeps every text it loads
   as a script, so it can use several GB: AA-01 of ALPHA_AUDIT.md), and on a browser that says how much memory the page uses it stops before the tab does (TXT.heapOver) and offers a shelf at a time.
   Quote a phrase, use OR or |, drop a word with -, and select passages to make a thread from them. Nothing is uploaded or stored but your recent queries. */
const SRCH = { token: 0, okAll: false };      // okAll: the person said yes to downloading every text, so the question is not asked again in this visit
const SRCH_EXAMPLES = ['compassion', '"love your enemies"', 'flood', 'shepherd', 'stranger|guest', '"no compulsion"', 'Marduk', 'resurrection|rebirth', 'peace -war'];
const SRCH_PAGE = 20;      // passages on the page to begin with, and how many more each "More" adds (UX-06 of UX_AUDIT.md: the page was 45,500 px high with every text's cards in it)
/* how many of the texts' cards cover `shown` passages: a card shows its first three passages (its other hits are behind its own "Show more"), and the card that crosses the limit is drawn whole */
const srchCardCount = (list, shown) => { let n = 0; let seen = 0; while (n < list.length && seen < shown) { seen += Math.min(3, (list[n][1].hits && list[n][1].hits.length) || 1); n++; } return n; };
const srchOpts = (query) => {
  const saved0 = store.get('search.opts', {}); const saved = saved0 && typeof saved0 === 'object' ? saved0 : {}; const pick = (k, d) => (query[k] != null && query[k] !== '' ? query[k] : (saved[k] != null ? saved[k] : d));
  return { c: String(query.c != null ? query.c : ''), m: pick('m', 'para') === 'sect' ? 'sect' : 'para', w: String(pick('w', '0')) === '1', e: String(pick('e', '1')) !== '0', a: String(pick('a', '1')) !== '0' };
};
const srchHash = (q, o) => '#/path/search?' + new URLSearchParams(Object.assign({ q }, o.c !== '' ? { c: o.c } : {}, o.m === 'sect' ? { m: 'sect' } : {}, o.w ? { w: '1' } : {}, o.e ? {} : { e: '0' }, o.a ? {} : { a: '0' }));
const srchCollOf = (id) => { const l = LIB_BY_ID[id]; if (l && /^u-/.test(id)) return LIB_COLLECTIONS.length; const i = l ? LIB_COLLECTIONS.findIndex((c) => c[2].includes(l.group)) : -1; return i; };      // a text of your own is a shelf of its own, after the collections
const srchCollName = (c) => (LIB_COLLECTIONS[c] ? LIB_COLLECTIONS[c][0] : (+c === LIB_COLLECTIONS.length ? 'My own texts' : 'Other'));
const srchRecent = () => { const r = store.get('search.recent', []); return (Array.isArray(r) ? r : []).filter((x) => x && typeof x.q === 'string' && x.q).slice(0, 10); };
const srchRemember = (q) => { const r = srchRecent().filter((x) => x.q !== q); r.unshift({ q, t: Date.now() }); store.set('search.recent', r.slice(0, 10)); };
const srchLink = (id, h) => '#/path/read/' + id + '?' + new URLSearchParams({ s: h.s, p: h.p, f: h.f || '' });
/* what to scan: every text in the folder, or one collection, or only the texts you have started */
function srchIds(meta, o) {
  const own = (typeof OWN !== 'undefined' ? OWN.list() : []).filter((e) => meta[e.id]).map((e) => e.id);
  if (o.c === 'own') return own;
  let list = LIB.filter((l) => meta[l.id]);
  if (o.c === 'mine') { const m = MARKS.all(); list = list.filter((l) => m[l.id] && (m[l.id].last || (m[l.id].rs || []).length)); return list.map((l) => l.id).concat(own.filter((id) => m[id] && (m[id].last || (m[id].rs || []).length))); }
  else if (o.c !== '' && LIB_COLLECTIONS[+o.c]) { const gs = LIB_COLLECTIONS[+o.c][2]; list = list.filter((l) => gs.includes(l.group)); return list.map((l) => l.id); }
  const lo = libLeftOut(); return list.filter((l) => !lo.has(libCollOf(l.group))).map((l) => l.id).concat(own);          // “All texts” leaves out the areas the reader left out (to begin with, the imagined shelf); choose one by name to search it
}
/* a hit's words are cut out of a paragraph, which was cut out of the whole section of its text, and the engine keeps that whole section alive for as long as the hit is: a search that kept every text's hits would keep
   every text. These are copies that stand on their own (AA-01 of ALPHA_AUDIT.md). */
const srchOwnStr = (s) => (typeof s === 'string' && s.length > 12 ? JSON.parse(JSON.stringify(s)) : s);
const srchOwn = (r) => { r.hits.forEach((h) => { h.q = srchOwnStr(h.q); h.heading = srchOwnStr(h.heading); h.f = srchOwnStr(h.f); }); return r; };
/* `info` (optional) is filled in: { done: how many texts were scanned, stopped: true when the memory guard stopped the scan, so the results are only those found so far } */
async function srchRun(cq, ids, o, token, onUpdate, info) {
  const res = new Map(); let k = 0; let done = 0; const st = info || {}; st.stopped = false; st.done = 0;
  const work = async () => {
    while (k < ids.length && SRCH.token === token && !st.stopped) {
      const id = ids[k++];
      const r = await TXT.scan(id, (t) => srchOwn(searchSections(t.secs, cq, { maxHits: 30, skip: o.e && textMayHaveOriginals(id) ? isOtherLanguage : null })));
      if (SRCH.token !== token) return;
      if (r && r.count) res.set(id, r);
      done++; st.done = done; onUpdate(done, res);
      if (!st.stopped && done < ids.length && TXT.heapOver()) st.stopped = true;      // the page is near what the engine allows: no more texts; the hits so far are kept
      await new Promise((r2) => setTimeout(r2, 0));
    }
  };
  await Promise.all([work(), work(), work(), work()]);
  return res;
}
/* the search of every text stopped by the memory guard: one plain line, and a button for each shelf, so the rest can be searched a shelf at a time. From a file the engine gives the memory back only when the page is loaded again, so the line says so. */
const srchStopLine = (done, total, loc) => `Stopped after ${methN(done)} of ${methN(total)} texts to keep your browser running; search one shelf for the rest.${copyWhere(loc) === 'file' ? ' Choosing a shelf loads the page again, which frees the memory this search used.' : ''}`;
const srchStopHTML = (q, o, done, total, loc) => `<div class="callout warn" id="srStopBox" role="status">${icon('warn')}<div><p class="t2" style="margin:0 0 8px;max-width:72ch">${esc(srchStopLine(done, total, loc))}</p><div class="row tight">${LIB_COLLECTIONS.map((c, i) => `<a class="chip" data-srgo href="${srchHash(q, Object.assign({}, o, { c: String(i) }))}">${esc(c[0])}</a>`).join('')}</div></div></div>`;
/* from a file the engine keeps every text it has loaded as a script until the page is loaded again, so on a page that is already full a new search is given a fresh page: the address is set, then the page is loaded again (the search starts from the address).
   False, and nothing done, when the page has room (the link or the call then simply goes on). */
function srchFresh(hash) { if (copyWhere() !== 'file' || !TXT.heapOver()) return false; location.hash = hash; location.reload(); return true; }
/* how many texts a search covered, said with the count Methods and standards uses (methCounts: the Library's texts this copy can read; a text of your own is not one of them): "1,444 of the 1,448 readable texts" */
function srchCoverage(meta, ids) {
  const all = methCounts({ lib: LIB, readable: Object.keys(meta || {}) }).readable || 0; const seen = methCounts({ lib: LIB, readable: ids }).readable || 0; const own = Math.max(0, ids.length - seen);
  return { all, seen, own, text: `${methN(seen)} of the ${methN(all)} readable texts${own ? ` and ${methN(own)} more added to this copy` : ''}` };
}
/* the search of every text would download the whole library on a website, and from a file it would use several GB of memory (the engine keeps every text it loads as a script): one calm line first (AA-01). "Search this shelf" is the first
   button (the shelf of the book the search began in, else The Bible); "Search everything" goes on, and the question is not asked again in this visit. A server on this computer (localhost) never asks. `loc` is for a test. */
function srchAskHTML(meta, ids, query, loc) {
  const bible = Math.max(0, LIB_COLLECTIONS.findIndex((c) => /^The Bible/.test(c[0]))); const sh = LIB_COLLECTIONS[+query.sh] ? +query.sh : bible;
  const chars = ids.reduce((a, id) => a + (/^u-/.test(id) ? 0 : ((meta[id] && meta[id].chars) || 0)), 0);
  const shelf = `“Search this shelf” looks only in <b>${esc(LIB_COLLECTIONS[sh][0])}</b>.`;
  const line = copyWhere(loc) === 'file' ? `Searching every text from a folder can use several GB of memory; search this shelf first? ${shelf}` : `Searching every text downloads ${txtSizeLabel(chars)} when you use this on the web. ${shelf}`;
  return { shelf: sh, html: `<div class="card flat" id="srAsk" role="group" aria-label="Before searching every text"><p class="t2" style="margin:0 0 10px;max-width:70ch">${line}</p><div class="row"><button class="btn primary" type="button" data-srask="shelf">Search this shelf</button><button class="btn" type="button" data-srask="all">Search everything</button></div></div>` };
}

function pathSearchView(root, query) {
  const body = root.querySelector('#pbody'); const q = (query.q || '').trim(); const o = srchOpts(query); const cq = compileQuery(q, { whole: o.w, alias: o.a, mode: o.m });
  const recent = srchRecent(); const token = ++SRCH.token;
  pathOnLeave(() => { SRCH.token++; });
  const scopeOpts = `<option value=""${o.c === '' ? ' selected' : ''}>${leftOutAllLabel()}</option>${LIB_COLLECTIONS.map((c, i) => `<option value="${i}"${o.c === String(i) ? ' selected' : ''}>${esc(c[0])}</option>`).join('')}<option value="mine"${o.c === 'mine' ? ' selected' : ''}>Only texts I have started</option>${typeof OWN !== 'undefined' && OWN.list().length ? `<option value="own"${o.c === 'own' ? ' selected' : ''}>Only my own texts</option>` : ''}`;
  const optsN = (o.c !== '' ? 1 : 0) + (o.m === 'sect' ? 1 : 0) + (o.w ? 1 : 0) + (o.e ? 0 : 1) + (o.a ? 0 : 1); const optsOpen = optsN > 0;      // the options are shut unless one of them is on (an address can carry a scope or a setting)
  body.innerHTML = `<form class="srform" id="srForm" role="search"><input class="input" id="srQ" type="search" name="q" value="${esc(q)}" placeholder="Search all texts…  e.g. “love your enemies”, compassion|mercy" aria-label="Search all texts" autocomplete="off"><button class="btn primary" type="submit">${icon('search')}Search</button></form>
    <div class="sr-optsrow"><button type="button" class="sr-optsbtn" data-sropts aria-expanded="${optsOpen}" aria-controls="srOpts"><span>Filters and search tips</span>${icon('chevron')}</button>${optsN ? `<span class="small muted">${optsN} on</span>` : ''}</div>
    <div class="sr-opts" id="srOpts"${optsOpen ? '' : ' hidden'}><p class="t2 small" style="max-width:76ch;margin:0">Search every text in the library at once, in English. It ignores case, accents, punctuation and verse numbers, and treats a few spellings of one name as the same (Jehovah and Yahweh, Gilgamish and Gilgamesh). Put <b>"quotes"</b> around an exact phrase, use <b>OR</b> or <b>|</b> between alternatives, and a minus sign (<b>-war</b>) to leave a word out. An area you have left out (to begin with, the imagined shelf, which is fiction) is searched only when you choose it in the box below; <b>Leave areas out</b> changes which.</p>
    <div class="row" style="margin:12px 0 10px">
      <select class="select" id="srC" style="width:auto;max-width:280px" aria-label="Where to search">${scopeOpts}</select>
      <select class="select" id="srM" style="width:auto" aria-label="How close the words must be"><option value="para"${o.m === 'para' ? ' selected' : ''}>Words in the same paragraph</option><option value="sect"${o.m === 'sect' ? ' selected' : ''}>Words in the same section</option></select>
      <label class="chk"><input type="checkbox" id="srW"${o.w ? ' checked' : ''}><span class="small">Whole words only</span></label>
      <label class="chk"><input type="checkbox" id="srE"${o.e ? ' checked' : ''}><span class="small">English only</span></label>
      <label class="chk"><input type="checkbox" id="srA"${o.a ? ' checked' : ''}><span class="small">Spelling variants</span></label></div>
    ${leftOutControl()}</div>
    <div id="srState"></div><div id="srBooks"></div><div id="srFacets" class="row tight" style="margin:8px 0"></div><div id="srResults"></div><div id="srMore"></div>
    <div class="srbar card" id="srBar" hidden><span id="srSel" class="small"></span><span class="row tight"><button class="btn primary sm" id="srThread" type="button">${icon('threads')}Add to a passage set</button><button class="btn sm ghost" id="srClear" type="button">Clear</button></span></div>`;
  const optsBtn = $('[data-sropts]', body); if (optsBtn) optsBtn.addEventListener('click', () => { const box = $('#srOpts', body); if (!box) return; const on = !!box.hidden; box.hidden = !on; optsBtn.setAttribute('aria-expanded', String(on)); });
  const submit = (extra = {}) => {
    const nq = $('#srQ', body).value.trim(); const no = { c: $('#srC', body).value, m: $('#srM', body).value, w: $('#srW', body).checked, e: $('#srE', body).checked, a: $('#srA', body).checked, ...extra };
    store.set('search.opts', { m: no.m, w: no.w ? '1' : '0', e: no.e ? '1' : '0', a: no.a ? '1' : '0' }); location.hash = srchHash(nq, no);
  };
  $('#srForm', body).addEventListener('submit', (e) => { e.preventDefault(); submit(); });
  ['srC', 'srM', 'srW', 'srE', 'srA'].forEach((id) => $('#' + id, body).addEventListener('change', () => { if ($('#srQ', body).value.trim()) submit(); }));
  leftOutWire(body, () => Router.render());
  const state = $('#srState', body);
  if (!q || cq.empty) {
    state.innerHTML = `<div class="card flat"><div class="card-title"><h3>Try</h3></div><div class="row tight">${SRCH_EXAMPLES.map((x) => `<a class="chip" href="${srchHash(x, o)}">${esc(x)}</a>`).join('')}</div>
      ${recent.length ? `<div class="card-title" style="margin-top:14px"><h3>Recent</h3><button class="btn sm ghost" id="srForget" type="button">Clear</button></div><div class="row tight">${recent.map((x) => `<a class="chip" href="${srchHash(x.q, o)}">${esc(x.q)}</a>`).join('')}</div>` : ''}
      <p class="hint" style="margin-top:14px">Quotes for an exact phrase, OR between alternatives, <b>-word</b> to leave one out. Search a phrase from any text you are reading, then select passages from different traditions and add them to a passage set to compare them.</p></div>`;
    const f = $('#srForget', body); if (f) f.addEventListener('click', () => { store.set('search.recent', []); Router.render(); });
    return;
  }
  srchRemember(q);
  state.innerHTML = '<p class="t2" id="srStatus">Opening the texts…</p>';
  TXT.index().then(async (meta) => {
    if (SRCH.token !== token || root.isConnected === false) return;
    if (!meta) { state.innerHTML = `<div class="callout warn">${icon('warn')}<div>${loadFailText('The texts folder was not found, so there is nothing to search. Full texts live in a <b>texts</b> folder next to <b>Lamplighter.html</b>.')}</div></div>`; return; }
    const bk = searchBooks(LIB, meta, q); const bkBox = $('#srBooks', body);
    if (bk.length && bkBox) bkBox.innerHTML = `<section class="lib-cont srbooks"><div class="card-title"><h3>Books</h3><span class="small muted">with your words in their titles</span></div><div class="cont-row">${bk.map((l) => { const cv = lcCover(l.id, Math.max(0, libCollOf(l.group)), l.title); return `<a class="contcard" href="#/path/read/${l.id}"><span class="bk-mini big" style="${lcCoverStyle(cv)}" aria-hidden="true"><span>${esc(cv.glyph)}</span></span><span class="cc-t"><b>${esc(l.title)}</b><span class="small muted">${esc(tradName(l.id))}</span><span class="small muted">${esc(l.when)}</span></span></a>`; }).join('')}</div></section>`;
    const ids = srchIds(meta, o); const t0 = Date.now();
    if (!ids.length) { state.innerHTML = `<p class="t2">${o.c === 'mine' ? 'You have not started any texts yet. Open one from the <a href="#/path/library">library</a>.' : o.c === 'own' ? 'You have not added any texts of your own yet. <a href="#/path/own">Add one</a>.' : 'No texts to search here.'}</p>`; return; }
    if (srchAskFirst(o.c, SRCH.okAll)) {
      const ask = srchAskHTML(meta, ids, query); state.innerHTML = ask.html;
      state.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-srask]'); if (!b) return; if (b.dataset.srask === 'all') { SRCH.okAll = true; Router.render(); } else { const to = srchHash(q, Object.assign({}, o, { c: String(ask.shelf) })); if (!srchFresh(to)) location.hash = to; } });
      return;
    }
    const cover = srchCoverage(meta, ids); const stop = { stopped: false, done: 0 };      // cover: how many texts this covers, as Methods counts them; stop: set by the memory guard
    let facet = ''; let shown = SRCH_PAGE; const opened = new Set();      // opened: the texts whose other hits were asked for, kept when the list is drawn again (a click on More draws it again)
     let order = store.get('search.order', 'lib'); let result = new Map(); let finished = false; let doneN = 0; const picked = new Map(); const hitsOf = new Map();
    const hitKey = (id, i) => id + ':' + i;
    const draw = () => {
      let list = [...result.entries()]; const byColl = {}; list.forEach(([id, r]) => { const c = srchCollOf(id); byColl[c] = (byColl[c] || 0) + r.count; });
      const total = list.reduce((a, [, r]) => a + r.count, 0);
      $('#srFacets', body).innerHTML = Object.keys(byColl).length > 1 ? `<a class="chip" href="#" data-facet="" aria-pressed="${facet === ''}">Everything ${total}</a>${Object.keys(byColl).sort((a, b) => a - b).map((c) => `<a class="chip" href="#" data-facet="${c}" aria-pressed="${facet === c}">${esc(srchCollName(c))} ${byColl[c]}</a>`).join('')}` : '';
      if (facet !== '') list = list.filter(([id]) => String(srchCollOf(id)) === facet);
      if (order === 'hits') list.sort((a, b) => b[1].count - a[1].count); else { const at = (id) => { const i = LIB.findIndex((l) => l.id === id); return i < 0 ? 1e9 : i; }; list.sort((a, b) => at(a[0]) - at(b[0])); }
      const sections = list.reduce((a, [, r]) => a + r.sections, 0); const n = list.reduce((a, [, r]) => a + r.count, 0);
      const pct = Math.round(100 * doneN / ids.length);
      $('#srStatus', body).innerHTML = finished
        ? `${n ? `<b>${n}</b> passage${n === 1 ? '' : 's'} in <b>${list.length}</b> text${list.length === 1 ? '' : 's'}` : 'No passages found'}${facet !== '' ? ' in this collection' : ''} · ${stop.stopped ? `stopped after ${methN(stop.done)} of ${methN(ids.length)} texts` : `searched ${cover.text}`} in ${((Date.now() - t0) / 1000).toFixed(1)} s${cq.aliases.length ? ` · also matched <span class="muted">${cq.aliases.map(esc).join(', ')}</span>` : ''}`
        : `Searching… ${doneN} of ${ids.length} texts · ${n} passage${n === 1 ? '' : 's'} so far`;
      const bar = $('#srProg', body); if (bar) bar.style.width = pct + '%';
      const stopBox = $('#srStop', body); if (stopBox) stopBox.innerHTML = finished && stop.stopped ? srchStopHTML(q, o, stop.done, ids.length) : '';
      const nCards = srchCardCount(list, shown); const cards = list.slice(0, nCards).map(([id, r]) => {
        const l = LIB_BY_ID[id]; hitsOf.set(id, r.hits);
        const li = r.hits.map((h, i) => `<li class="srhit${i >= 3 ? ' extra' : ''}" data-hit="${hitKey(id, i)}"><label class="chk" title="Select to add to a passage set"><input type="checkbox" class="sr-pick" data-pick="${hitKey(id, i)}"${picked.has(hitKey(id, i)) ? ' checked' : ''} aria-label="Select this passage"></label><div><div class="small muted">${esc(h.heading.length > 70 ? h.heading.slice(0, 69) + '…' : h.heading)}</div><div class="sr-q">${snippetHTML(h.q, cq)}</div><div class="row tight small"><a href="${srchLink(id, h)}">Open in the reader →</a><button class="btn sm ghost" type="button" data-sh="${hitKey(id, i)}">${icon('threads')}Passage set</button><button class="btn sm ghost" type="button" data-cp="${hitKey(id, i)}">${icon('copy')}Copy</button></div></div></li>`).join('');
        return `<article class="card flat srcard${opened.has(id) ? ' open' : ''}" data-tid="${id}"><div class="spread" style="gap:10px;flex-wrap:wrap"><div><b><a href="#/path/read/${id}?${new URLSearchParams({ f: r.hits[0] ? r.hits[0].f : '', s: r.hits[0] ? r.hits[0].s : 0, p: r.hits[0] ? r.hits[0].p : 0 })}">${esc(l ? l.title : id)}</a></b>${libImagined(id) ? ' <span class="tag imagined">Imagined</span>' : ''} <span class="muted small">· ${esc(tradName(id))}${l ? ' · ' + esc(l.when) : ''}</span></div><span class="tag">${r.count} passage${r.count === 1 ? '' : 's'}${r.sections > 1 ? ` in ${r.sections} sections` : ''}</span></div><ul class="plain srhits">${li}</ul>${r.hits.length > 3 && !opened.has(id) ? `<button class="btn sm ghost" type="button" data-more="${id}">Show ${r.hits.length - 3} more${r.count > r.hits.length ? ` (of ${r.count})` : ''}</button>` : ''}</article>`;
      }).join('');
      $('#srResults', body).innerHTML = `${n ? `<div class="row tight small" style="margin:0 0 8px"><span class="muted">Order</span><a class="chip" href="#" data-order="lib" aria-pressed="${order === 'lib'}">By collection</a><a class="chip" href="#" data-order="hits" aria-pressed="${order === 'hits'}">Most passages</a>${finished ? `<button class="btn sm ghost" id="srExport" type="button" style="margin-left:auto">${icon('download')}Copy as Markdown</button>` : ''}</div>` : ''}${cards}${finished && !n ? `<div class="card flat"><p class="t2">Nothing matched. Try fewer words, <b>OR</b> between alternatives, a different spelling, or “Words in the same section”. ${o.e ? 'You can also switch off “English only”.' : ''}</p></div>` : ''}`;
      $('#srMore', body).innerHTML = list.length > nCards ? `<div class="sr-more"><button class="btn" id="srShowMore" type="button">More</button><span class="small muted">${nCards} of ${list.length} texts shown${finished ? '' : ' so far'}</span></div>` : '';
      const sb = $('#srBar', body); sb.hidden = !picked.size; $('#srSel', body).textContent = `${picked.size} passage${picked.size === 1 ? '' : 's'} selected`;
    };
    state.innerHTML = `<div class="rdprog" style="margin:6px 0"><div class="bar" aria-hidden="true"><i id="srProg" style="width:0%"></i></div></div><p class="t2" id="srStatus"></p><div id="srStop"></div>`;
    let timer = null; const soon = () => { if (!timer) timer = setTimeout(() => { timer = null; if (SRCH.token === token) draw(); }, 160); };
    const asItem = (key) => { const [id, i] = [key.slice(0, key.lastIndexOf(':')), +key.slice(key.lastIndexOf(':') + 1)]; const h = (hitsOf.get(id) || [])[i]; return h ? { tid: id, s: h.s, p: h.p, a: h.a, b: h.b, q: h.q, sh: h.heading } : null; };
    body.addEventListener('click', async (e) => {
      const go = e.target.closest('[data-srgo]'); if (go && srchFresh(go.getAttribute('href'))) { e.preventDefault(); return; }      // a shelf chosen after a stop, from a file: on a fresh page
      const fc = e.target.closest('[data-facet]'); if (fc) { e.preventDefault(); facet = fc.dataset.facet; shown = SRCH_PAGE; draw(); return; }
      const od = e.target.closest('[data-order]'); if (od) { e.preventDefault(); order = od.dataset.order; store.set('search.order', order); draw(); return; }
      const mo = e.target.closest('[data-more]'); if (mo) { mo.closest('.srcard').classList.add('open'); opened.add(mo.dataset.more); mo.remove(); return; }
      if (e.target.closest('#srShowMore')) { shown += SRCH_PAGE; draw(); return; }
      const sh = e.target.closest('[data-sh]'); if (sh) { const it = asItem(sh.dataset.sh); if (it) await addToThread(it); return; }
      const cp = e.target.closest('[data-cp]'); if (cp) { const it = asItem(cp.dataset.cp); if (it) { const ok = await rdCopy(rdCitation(it.tid, it.sh, it.q)); toast(ok ? 'Copied with a citation.' : 'Copying is not available here.', ok ? 'good' : 'bad', 2000); } return; }
      if (e.target.closest('#srClear')) { picked.clear(); draw(); return; }
      if (e.target.closest('#srThread')) { const items = [...picked.keys()].map(asItem).filter(Boolean); if (items.length) { const tid = await addManyToThread(items); if (tid) { picked.clear(); draw(); } } return; }
      if (e.target.closest('#srExport')) { const md = [`# Search: ${q}\n`]; [...result.entries()].forEach(([id, r]) => { md.push(`\n## ${titleOf(id)} (${r.count})\n`); r.hits.forEach((h) => md.push(`- *${h.heading}*: “${h.q.replace(/\s+/g, ' ')}”`)); }); const ok = await rdCopy(md.join('\n') + '\n'); toast(ok ? 'Results copied as Markdown.' : 'Copying is not available here.', ok ? 'good' : 'bad', 2200); }
    });
    body.addEventListener('change', (e) => { const pk = e.target.closest('[data-pick]'); if (!pk) return; if (pk.checked) picked.set(pk.dataset.pick, true); else picked.delete(pk.dataset.pick); const sb = $('#srBar', body); sb.hidden = !picked.size; $('#srSel', body).textContent = `${picked.size} passage${picked.size === 1 ? '' : 's'} selected`; });
    draw();
    result = await srchRun(cq, ids, o, token, (d, r) => { doneN = d; result = r; soon(); }, stop);
    if (SRCH.token !== token) return;
    finished = true; doneN = ids.length; if (timer) { clearTimeout(timer); timer = null; } draw(); const p = $('#srProg', body); if (p) p.parentElement.hidden = true;
  });
}
