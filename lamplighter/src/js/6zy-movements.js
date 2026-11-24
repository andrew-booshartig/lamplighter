/* ═══════════════════════════ 6zy · High-control groups and contested movements (Traditions → High-control groups) ═══════════════════════════
   One card per movement, in labelled parts: what the group says about itself; what independent sources document (each claim with a grade and a numbered source); legal outcomes with dates;
   the group's reply; the harm that is documented, stated plainly; its texts (and whether anything is readable here: almost none is, because the scriptures are post-1930 and owned by the
   movements); how sure we are; and where to look further. Data and the rules: 2z-data-movements.js. The page reproduces no scripture and no recruiting material, and says "cult" nowhere as a verdict.
   The first reading against sources (22 November 2026, MOV_READ in the data file): a claim that has been read carries a small mark (“Found in the page read”, “Part of it in the page read”, “Not in the page read”, and “Corrected after reading”); a claim with no mark has not been read; each card says in one line how far the reading got, and the page says it once in total, in the same form (movReadSay), with a visible key under that count saying what each mark means (FINAL_AUDIT.md FA-01: a mark says what the reading did, and a claim not in the page read is not thereby wrong).
   Above the cards is a box for the reader (movAskHTML, 18 November 2026): ten questions to ask any group before joining or giving time or money, and where to turn if you are worried about someone.
   Order of the page (UX-20, 18 November 2026): the title and one line, the ten questions, one quiet “How this page works” (what the page means and why it does not say “cult”, the first-set caveat, the grades), one honest line about review, then Find or filter, then the cards.
   movementsPageHTML(query) builds the whole body (pure, so the tests can render it); movementsWire(body, query) attaches the search box and scrolls to an opened card (Pages.traditions, 6zz-traditions.js, calls both). */
const MOV_OV_CLASS = { courts: 'record', reported: 'reported', contested: 'alleged' };
const MOV_KEYS = ['k', 's', 'o', 'q'];
const movHas = (o, k) => typeof k === 'string' && k in o;
/* the address of a view: every filter kept, one changed (a hostile value never gets this far: movFilters keeps only the values the page knows) */
function movFilters(query) {
  const x = query && typeof query === 'object' ? query : {};
  return { k: movHas(MOV_HARM, x.k) ? x.k : '', s: movHas(MOV_STATUS, x.s) ? x.s : '', o: movHas(MOV_OVERALL, x.o) ? x.o : '', q: typeof x.q === 'string' ? x.q.trim().slice(0, 80) : '', r: typeof x.r === 'string' && movHas(MOV_BY_ID, x.r) ? x.r : '' };
}
const movHref = (f, patch) => { const g = Object.assign({}, f, patch); const p = MOV_KEYS.filter((k) => g[k]).map((k) => k + '=' + encodeURIComponent(g[k])); return '#/traditions/movements' + (p.length ? '?' + p.join('&') : ''); };
function movFilter(f) {
  const q = f.q.toLowerCase();
  return MOVEMENTS.filter((m) => (!f.k || m.harm.some((h) => h.type === f.k)) && (!f.s || m.status === f.s) && (!f.o || m.overall === f.o) && (!q || [m.name, m.also, m.founder, m.what].join(' ').toLowerCase().includes(q)));
}
const movGradeTag = (g) => `<span class="tag mov-g-${g}" title="${esc(MOV_GRADES[g][1])}">${esc(MOV_GRADES[g][0])}</span>`;
/* the mark of the first reading on one claim (none when it has not been read) and the one line that says how far it got on a card and on the whole page */
const movFxTag = () => `<span class="tag mov-r mov-r-fx" title="${esc(MOV_READ.fx[1])}">${esc(MOV_READ.fx[0])}</span>`;
const movReadTag = (c) => (c.r && MOV_READ.marks[c.r] ? `<span class="tag mov-r mov-r-${c.r}" title="${esc(MOV_READ.marks[c.r][1])}">${esc(MOV_READ.marks[c.r][0])}</span>` : '') + (c.r && c.fx ? ' ' + movFxTag() : '');      /* a space between the two tags, so they do not run together where they sit in a line of text (the list of groups not yet written up) */
const movReadSay = (k) => (k.unread === k.total ? 'Not yet read against sources.' : `Read against sources on ${MOV_READ.date}: ${k.total - k.unread} of ${k.total} claims read: ${k.ok} found in the page read, ${k.part} in part, ${k.nf} not in the page read; ${k.fx} of the ${k.total - k.unread} read were corrected to match the source; ${k.unread} not yet read.`);
/* the key to the marks, in plain words, printed under the page-level count (not only in tooltips, which a phone never shows): what each mark says the reading did, and that a claim not in the page read is not thereby wrong */
const movReadKeyHTML = () => `<div class="small t2 mov-key" role="group" aria-label="What the reading found" style="max-width:76ch;margin:6px 0 12px"><p style="margin:0"><b>What the marks mean.</b> ${['ok', 'part', 'nf'].map((k) => `${movReadTag({ r: k })}: ${esc(MOV_READ.marks[k][2])}`).join(' ')} ${movFxTag()}: ${esc(MOV_READ.fx[2])} A claim with no mark has not been read.</p></div>`;
const movReadAll = () => MOVEMENTS.reduce((a, m) => { const k = movReadCounts(m); Object.keys(a).forEach((x) => { a[x] += k[x]; }); return a; }, { total: 0, ok: 0, part: 0, nf: 0, fx: 0, unread: 0 });
const movOverallTag = (o) => `<span class="tag mov-g-${MOV_OV_CLASS[o]}" title="${esc(MOV_OVERALL[o][1])}">${esc(MOV_OVERALL[o][0])}</span>`;
/* one claim: its grade, the numbers of its sources, and who says it when it is only alleged or is a former member’s account */
function movClaimHTML(order, c, head) {
  const refs = (c.s || []).map((id) => `<sup class="mov-ref" title="${esc(MOV_SOURCES[id].cite)}" aria-label="source ${order.indexOf(id) + 1}">${order.indexOf(id) + 1}</sup>`).join('');
  return `<li class="mov-claim"><div class="mov-ctop">${movGradeTag(c.g)}${movReadTag(c)}${head || ''}${refs}</div><p>${esc(c.t)}</p>${c.by ? `<p class="small muted">Said by: ${esc(c.by)}.</p>` : ''}</li>`;
}
const movList = (order, claims, head) => (claims.length ? `<ul class="mov-claims">${claims.map((c) => movClaimHTML(order, c, head ? head(c) : '')).join('')}</ul>` : '');
function movSourceHTML(id, n) {
  const s = MOV_SOURCES[id]; const k = MOV_SRC_KINDS[s.kind];
  return `<li><span class="mov-n">${n}</span><div><span class="tag" title="${esc(k[1])}">${esc(k[0])}</span> ${esc(s.cite)} ${ext(s.url, s.link === 'direct' ? 'Open' : 'Search for it')}</div></li>`;
}
function movTextHTML(t) {
  const lib = (t.lib || []).filter((id) => typeof LIB_BY_ID !== 'undefined' && LIB_BY_ID[id]);
  return `<li><b>${esc(t.title)}</b> <span class="small muted">${esc(t.by)}, ${esc(t.year)}. ${esc(t.publisher)}.</span><div class="small t2">${esc(t.rights)}.${t.note ? ' ' + esc(t.note) : ''}</div>${t.here && lib.length ? `<div class="row tight" style="margin-top:6px">${lib.map((id) => `<a class="btn sm primary" href="#/path/read/${esc(id)}">Read: ${esc(LIB_BY_ID[id].title.split(/[:,(]/)[0].slice(0, 36))}</a>`).join('')}</div>` : '<div class="small" style="margin-top:4px"><span class="tag">Not readable here</span></div>'}</li>`;
}
function movCardHTML(m, open) {
  const order = movSourceIds(m); const st = MOV_STATUS[m.status]; const rv = MOV_REVIEW[m.review];
  const books = (m.books || []).filter((b) => typeof LIB_BY_ID !== 'undefined' && LIB_BY_ID[b]);
  const links = `<div class="row tight" style="margin-top:10px">${m.atlas ? `<a class="btn sm primary" href="#/atlas/tradition/${esc(m.atlas)}">${icon('globe')}Its tradition page</a><a class="btn sm" href="#/atlas/texts?t=${esc(m.atlas)}">${icon('book')}Its texts in the Text catalogue</a>` : ''}${!m.atlas && m.atlasNear ? `<a class="btn sm" href="#/atlas/tradition/${esc(m.atlasNear)}">${icon('globe')}Nearest tradition page: ${esc(m.atlasNearName || m.atlasNear)}</a>` : ''}${books.map((b) => `<a class="btn sm ghost" href="#/path/read/${esc(b)}">${icon('book')}Read: ${esc(LIB_BY_ID[b].title.split(/[:,(]/)[0].slice(0, 28))}</a>`).join('')}</div>`;
  const atlasLine = !m.atlas ? `<p class="small muted" style="margin-top:8px">${esc(m.atlasNote)}</p>` : '';
  return `<details class="card flat rite mov" id="mov-${esc(m.id)}"${open ? ' open' : ''}><summary><span class="rite-sum"><span class="rite-name">${esc(m.name)}</span><span class="rite-meta"><span class="tag" title="${esc(st[1])}">${esc(st[0])}</span>${movOverallTag(m.overall)}<span class="small muted">${esc(m.founded.y)}</span></span></span><span class="small t2" style="display:block;margin-top:4px">${esc(m.what)}</span></summary>
    <div class="rite-body mov-body">
      <div class="callout warn mov-review">${icon('info')}<div><b>${esc(rv[0])}.</b> ${esc(rv[1])}<p class="small mov-readline" style="margin:6px 0 0">${esc(movReadSay(movReadCounts(m)))}</p></div></div>
      <h4>At a glance</h4>
      <p><b>Also known as:</b> ${esc(m.also)}</p><p><b>Founder or leader:</b> ${esc(m.founder)}</p><p><b>Where:</b> ${esc(m.where)}</p>
      ${movList(order, [m.founded], () => '<span class="mov-lab">Founded, and how the date is known</span>')}
      ${movList(order, [m.now], () => '<span class="mov-lab">Now</span>')}
      ${movList(order, m.size, () => '<span class="mov-lab">Size</span>')}
      <h4>What the group says about itself</h4>${movList(order, m.self)}
      <h4>What independent sources document</h4>${movList(order, m.facts)}
      <h4>Legal outcomes</h4>${m.legal.length ? movList(order, m.legal, (c) => `<span class="mov-lab">${esc(c.d)}</span><span class="small muted">${esc(c.where)}</span>`) : `<p class="small t2">${esc(m.legalNote || 'None cited.')}</p>`}
      <h4>The group’s response</h4>${m.response.length ? movList(order, m.response) : '<p class="small t2">None cited.</p>'}
      <h4>Harm that is documented</h4>${m.harm.length ? movList(order, m.harm, (c) => `<span class="tag mov-type">${esc(MOV_HARM[c.type])}</span>`) : ''}${m.harmNote ? `<p class="small t2">${esc(m.harmNote)}</p>` : ''}
      <h4>Its texts</h4><ul class="mov-texts">${m.texts.map(movTextHTML).join('')}</ul>
      <h4>How sure we are: ${movOverallTag(m.overall)}</h4><p>${esc(m.sure)}</p>
      <div class="callout" style="margin:10px 0">${icon('heart')}<div>${esc(m.care)}</div></div>
      ${links}${atlasLine}
      <h4>Sources, and where to look further</h4><ol class="mov-src">${order.map((id, i) => movSourceHTML(id, i + 1)).join('')}</ol>
      ${typeof relatedBox === 'function' ? relatedBox('movement', m.id, { skip: ['traditions', 'read'] }) : ''}
    </div></details>`;      /* the card already links its tradition page and its texts, so the strip leaves those two groups out (FINAL_AUDIT.md FA-06); with nothing left it is not drawn */
}
function movChips(f, key, label, items) {
  return `<div class="row tight" role="group" aria-label="${esc(label)}" style="margin:6px 0"><span class="small muted mov-chiplab">${esc(label)}</span><a class="chip${f[key] ? '' : ' on'}" href="${esc(movHref(f, { [key]: '', r: '' }))}">All</a>${items.map(([k, n]) => `<a class="chip${f[key] === k ? ' on' : ''}" href="${esc(movHref(f, { [key]: k, r: '' }))}">${esc(n)}</a>`).join('')}</div>`;
}
/* the box for the reader at the top of the page: ten questions to ask any group, where they come from, and where to turn if you are worried about someone (MOV_ASK, MOV_HELP). It is a tool for the reader and never a verdict on a group;
   an outside link is made by ext(), so it opens in a new tab only when clicked and passes nothing on */
function movAskHTML() {
  const A = MOV_ASK; const W = A.worried;
  const help = (h) => `<li><div class="mov-help-top">${h.url ? ext(h.url, esc(h.name)) : `<b>${esc(h.name)}</b>`}<span class="tag" title="Its point of view">${esc(h.view)}</span></div><p class="small t2">${esc(h.line)}</p></li>`;
  return `<section class="card flat mov-ask" aria-labelledby="movAskH"><h3 id="movAskH">${esc(A.title)}</h3>${A.intro.map((p) => `<p class="small t2">${esc(p)}</p>`).join('')}
    <ol class="mov-asks">${A.questions.map((x) => `<li><b>${esc(x.q)}</b><span class="small t2">${esc(x.look)}</span></li>`).join('')}</ol>
    <p class="small t2">${esc(A.after)}</p>
    <details class="mov-yard"><summary>Where these questions come from</summary><p class="small t2">${esc(A.from)}</p><ol class="mov-src">${A.sources.map((id, i) => movSourceHTML(id, i + 1)).join('')}</ol></details>
    <details class="mov-yard mov-worried"><summary>${esc(W.title)}</summary>${W.points.map((p) => `<p class="small t2">${esc(p)}</p>`).join('')}<p class="small t2">${esc(W.helpIntro)}</p><ul class="mov-help">${W.help.map(help).join('')}</ul><p class="small muted">${esc(W.note)}</p></details></section>`;
}
/* the whole body of the page. On a phone (under 760 px) the ten questions open closed, under one quiet line, so the first card is on the screen after one scroll; on a laptop they are open as they were (FINAL_AUDIT.md L-06; nothing is removed:
   one tap opens them). opts.phone says it to a test; without it the screen decides. */
function movementsPageHTML(query, opts) {
  const f = movFilters(query); const list = movFilter(f); const T = MOV_TERM;
  const phone = opts && typeof opts === 'object' && 'phone' in opts ? !!opts.phone : typeof matchMedia === 'function' && !!matchMedia('(max-width: 760px)').matches;
  const harmUsed = Object.entries(MOV_HARM).filter(([k]) => MOVEMENTS.some((m) => m.harm.some((h) => h.type === k)));
  const groups = Object.entries(MOV_OVERALL).map(([k, v]) => [k, v, list.filter((m) => m.overall === k)]).filter(([, , l]) => l.length);
  const unchecked = MOVEMENTS.filter((m) => m.review !== 'checked').length; const all = movReadAll(); const filtered = !!(f.k || f.s || f.o || f.q);
  const yard = (y) => `<details class="mov-yard"><summary>${esc(y.name)}</summary><p class="small t2">${esc(y.note)}</p><ul>${y.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul><p class="small muted">Source: ${esc(MOV_SOURCES[y.src].cite)} ${ext(MOV_SOURCES[y.src].url, MOV_SOURCES[y.src].link === 'direct' ? 'Open' : 'Search for it')}</p></details>`;
  return `<h2 class="start-h">${esc(T.title)}</h2>
    <p class="t2 small mov-lede">${esc(T.line)}</p>
    ${phone ? `<details class="mov-how" id="movAskD"><summary>Ten questions to ask any group</summary>${movAskHTML()}</details>` : movAskHTML()}
    <details class="mov-how" id="movHow"><summary>How this page works</summary>
    <section class="card flat mov-term"><h3>What this page means, and why it does not say “cult”</h3>${T.why.map((p) => `<p class="small t2">${esc(p)}</p>`).join('')}
      <h4>Yardsticks that scholars and support groups use</h4>${T.yardsticks.map(yard).join('')}${T.caution.map((p) => `<p class="small t2">${esc(p)}</p>`).join('')}</section>
    <div class="callout warn" style="margin:14px 0;max-width:76ch">${icon('info')}<div><b>How far this has been checked.</b> Every claim below names its source and carries a tag for what it rests on. On ${esc(MOV_READ.date)} the claims were read against pages that could be opened: court and official documents where one opened, and otherwise encyclopedia pages that cite them; the books named were not re-read, and several court sites refused the reading tool. A claim that was read carries a mark, and a card says in one line how many of its claims were read and what came of it; a claim with no mark has not been read. A claim about a living person rests on a court record, an official report or at least two independent sources; otherwise it says “alleged” and by whom. Check a claim against its source before relying on it.</div></div>
    <div class="row tight small" style="margin:8px 0" aria-label="What the tags mean"><span class="muted">What a claim rests on:</span>${Object.keys(MOV_GRADES).map(movGradeTag).join('')}</div>
    <p class="small t2" style="max-width:76ch;margin-top:2px">The tag says what kind of source a claim rests on, not how bad the thing is. A court record is the firmest ground; a former member’s account is real evidence but one side; the group’s own words are shown as its claim.</p></details>
    <p class="small t2 mov-first"><b>First set: ${MOVEMENTS.length} movements, ${unchecked} still under review.</b> ${esc(movReadSay(all))} Check a claim against its source before relying on it.</p>
    ${movReadKeyHTML()}
    <details class="mov-filter"${filtered ? ' open' : ''}><summary>Find or filter</summary>
    <form class="tfind mov-find" id="movFind" role="search"><input class="input" type="search" id="movFindQ" value="${esc(f.q)}" placeholder="Find a movement by name…" aria-label="Find a movement by name" autocomplete="off"><button class="btn primary" type="submit">${icon('search')}Find</button></form>
    ${movChips(f, 'k', 'Documented harm', harmUsed.map(([k, n]) => [k, n]))}${movChips(f, 's', 'Now', Object.entries(MOV_STATUS).map(([k, v]) => [k, v[0]]))}${movChips(f, 'o', 'How settled', Object.entries(MOV_OVERALL).map(([k, v]) => [k, v[0]]))}</details>
    <p class="small muted" style="margin:8px 0" aria-live="polite">${list.length === MOVEMENTS.length ? `All ${list.length} movements` : `${list.length} of ${MOVEMENTS.length} movements`}${f.k || f.s || f.o || f.q ? ` · <a href="#/traditions/movements">clear the filters</a>` : ''}</p>
    ${groups.length ? groups.map(([k, v, l]) => `<h3 class="mov-gh">${esc(v[0])} <span class="small muted">${esc(v[1])}</span></h3><div class="stack sm">${l.map((m) => movCardHTML(m, f.r === m.id)).join('')}</div>`).join('') : '<div class="card flat"><p class="small t2">No movement matches these filters. <a href="#/traditions/movements">Clear the filters</a>.</p></div>'}
    <section class="card flat mov-texts-note"><h3>Their texts</h3><p class="small t2">Nothing from these movements’ scriptures or recruiting material is reproduced here, and almost none of it can be read in the Library: most of it was published after 1930 and belongs to the movements. Each card names the books and their publishers. Where an older text that a movement draws on is public, the card links to it.</p></section>
    <section class="card flat mov-pending"><h3>Not yet written up</h3><p class="small t2">These groups are in the map data, or are often asked about. They are not yet written up because their sources have not been read. Each line gives how the group began, which is a matter of record, then what is on the public record or claimed, and by whom; each line was read against pages that could be opened on ${esc(MOV_READ.date)} (an encyclopedia page, and for some lines a court opinion or a news report), and the mark says what that found. Nothing is hidden: this is the list.</p><ul class="mov-pend">${MOV_PENDING.map((p) => `<li><b>${p.atlas ? `<a href="#/atlas/tradition/${esc(p.atlas)}">${esc(p.name)}</a>` : esc(p.name)}</b> <span class="small t2">${esc(p.why)}</span> ${movReadTag(p)}${p.unf ? `<span class="small muted mov-unf" style="display:block;margin-top:2px">The page read did not mention: ${esc(p.unf)}. The line above stays as written.</span>` : ''}</li>`).join('')}</ul></section>`;
}
function movementsWire(body, query) {
  const f = body.querySelector('#movFind');
  if (f) f.addEventListener('submit', (e) => { e.preventDefault(); const q = body.querySelector('#movFindQ').value.trim().slice(0, 80); location.hash = movHref(movFilters(query), { q, r: '' }); });
  const r = movFilters(query).r;
  if (r && typeof document !== 'undefined' && document.getElementById) { const el = document.getElementById('mov-' + r); if (el && el.scrollIntoView) setTimeout(() => el.scrollIntoView({ block: 'start' }), 50); }
}
if (typeof module !== 'undefined' && module.exports) module.exports = {};
