/* ═══════════════════════════ 6zzc · Compare traditions, step by step: the page (BACKLOG D5, 18 November 2026) ═══════════════════════════
   Two pickers, a few ready-made pairs, a filter by cause, and below them the fewest recorded connections that join the two traditions as a chain of cards on a thin rail: each card says what happened (in the
   Atlas's own sentence, so the direction is the record's), when and where, what is said to have brought it about with how well that is documented, the sources with their grades and a way to read the
   Library's own copy of any that is there, and what the writer is less sure of. A thin strip above it shows the chain's span on the history timeline, with a few of the larger events of the world in the same
   years. The logic is 2z-chain-core.js; the data is atlas/causes.js (tools/atlas_src/json/interaction_causes.json) and atlas/world.js; the page registers itself as #/steps. Nothing here says more than the
   rows do: a link with no row says "How this came about is not recorded here", and two traditions with no chain say "No recorded chain", which is not "no connection". */
const CHAIN_NONE = 'How this came about is not recorded here.';
const chainName = (ix, id) => (ix.trad[id] || {}).name || id;
const chainWhen = (l) => l.label || (l.y0 != null ? atlFmtYear(l.y0) : '');
const chainPlace = (ix, l) => (l.iso && ix.countries && ix.countries[l.iso] && ix.countries[l.iso][0]) || '';
const chainCount = (g) => [...g.edges.values()].reduce((n, e) => n + e.links.length, 0);
const chainPlural = (n, one, many) => `${n} ${n === 1 ? one : many || one + 's'}`;
const chainMapHref = (l, id) => '#/atlas?' + (l.y0 != null ? 'y=' + atlSnap(l.y0) + '&' : '') + 'sel=' + encodeURIComponent(id);
const chainStatusTag = (meta, k) => { const s = (meta && meta.statuses && meta.statuses[k]) || [k, '']; return `<span class="tag hx-status st-${esc(k)}" title="${esc(s[0] + (s[1] ? ': ' + s[1] : ''))}">${esc(s[0])}</span>`; };
const chainCauseTag = (meta, k) => { const c = (meta && meta.causes && meta.causes[k]) || [k, '']; return `<span class="tag ch-cause" title="${esc(c[1] || '')}">${esc(c[0])}</span>`; };

/* the sources of one row, with their grades; a source that is a Library text has the Library's own way to read it */
function chainSourcesHTML(row, meta) {
  const g = (meta && meta.grades) || {}; const kinds = typeof histSrcKind !== 'undefined' ? histSrcKind : {}; const list = row && Array.isArray(row.sources) ? row.sources : [];
  if (!list.length) return `<p class="small t2 ch-nosrc">${esc((row && row.source_note) || 'No source is named for this step.')}</p>`;
  return `<ol class="plain ch-src">${list.map((s) => `<li><span class="tag hx-grade" title="${esc((g[s.grade] || [''])[0] + (g[s.grade] ? ': ' + g[s.grade][1] : ''))}">${esc(s.grade)}</span> ${s.url ? ext(s.url, esc(s.title)) : esc(s.title)}${s.note ? ` <span class="small muted">${esc(s.note)}</span>` : ''}<span class="small muted"> · ${esc(kinds[s.kind] || s.kind)}</span>${s.lib && typeof atlReadBtn === 'function' && typeof LIB_BY_ID !== 'undefined' && Object.prototype.hasOwnProperty.call(LIB_BY_ID, s.lib) ? ` <span class="row tight">${atlReadBtn({ lib: s.lib, title: s.title }, { quiet: true })}</span>` : ''}</li>`).join('')}</ol>`;
}

/* one recorded link between two traditions: the Atlas's sentence, when and where, and what is written about its cause */
function chainLinkHTML(ix, l, meta, o) {
  o = o || {}; const row = l.row; const when = chainWhen(l); const place = chainPlace(ix, l); const tag = o.h || 'h3'; const nr = (meta && meta.not_recorded) || CHAIN_NONE;
  const line = [when, place, row && row.route ? 'Route: ' + row.route : ''].filter(Boolean);
  const causes = row ? `<h4 class="ch-h4">What brought it about, and how well that is documented</h4><ul class="plain ch-causes">${row.causes.map((c) => `<li>${chainCauseTag(meta, c.cause)} ${chainStatusTag(meta, c.status)} <span class="ch-note">${esc(c.note)}</span></li>`).join('')}</ul>` : `<p class="ch-none" title="${esc((meta && meta.rule) || '')}">${esc(nr)}</p>`;
  return `<div class="ch-link${o.also ? ' ch-also' : ''}" data-link="${esc(l.id)}"><${tag} class="ch-title">${esc(chainSentence(ix, l))}${l.kind === 'lineage' ? ' <span class="tag ch-lin" title="The map data records one tradition as the one this grew from, with no separate connection row.">Recorded lineage</span>' : ''}</${tag}>
    ${line.length ? `<p class="ch-when small t2">${line.map(esc).join(' · ')}</p>` : ''}${l.note && !row ? `<p class="small t2 ch-lnote">${esc(l.note)}</p>` : ''}
    ${row ? `<p class="ch-sum">${esc(row.summary)}</p>` : ''}${causes}${row ? chainSourcesHTML(row, meta) : ''}
    ${row && row.confidence === 'less sure' ? `<p class="hint ch-check">The writer is less sure of this step’s causes and asks a second reader to look at: ${esc(row.check || '')}.</p>` : ''}</div>`;
}

/* one step: a card, the first link in full and any others recorded between the same two below it */
function chainStepHTML(ix, step, meta) {
  const main = step.main; const others = step.links.slice(1); const a = chainName(ix, step.from); const b = chainName(ix, step.to);
  return `<li class="ch-step" id="chStep${step.n}" data-step-n="${step.n}"><div class="ch-card card flat"><div class="ch-sh"><span class="ch-num" aria-hidden="true">${step.n}</span><span class="ch-between small t2">Step ${step.n}: ${esc(a)} to ${esc(b)}</span></div>
    ${chainLinkHTML(ix, main, meta)}${others.length ? `<div class="ch-others"><h4 class="ch-h4">Also recorded between these two</h4>${others.map((l) => chainLinkHTML(ix, l, meta, { h: 'h5', also: true })).join('')}</div>` : ''}
    <p class="ch-acts row tight"><a class="btn sm ghost" href="${esc(chainMapHref(main, step.to))}">On the map</a>${main.y0 != null ? `<a class="btn sm ghost" href="#/history?z=8&y=${main.y0}">The world then</a>` : ''}<a class="btn sm ghost" href="#/atlas/tradition/${encodeURIComponent(step.from)}">${esc(a)}</a><a class="btn sm ghost" href="#/atlas/tradition/${encodeURIComponent(step.to)}">${esc(b)}</a></p></div></li>`;
}

/* a tradition on the rail: its name (to its page), when it began, and its family */
function chainNodeHTML(ix, id, role) {
  const t = ix.trad[id] || { name: id }; const fam = t.family_id && ix.fam && ix.fam[t.family_id] ? ix.fam[t.family_id].name : '';
  return `<li class="ch-node ch-${role}" data-node="${esc(id)}"><span class="ch-pin" aria-hidden="true"></span><a class="ch-nm" href="#/atlas/tradition/${encodeURIComponent(id)}">${esc(t.name)}</a> <span class="small muted">${[role === 'from' ? 'Where it starts' : role === 'to' ? 'Where it ends' : '', t.date_label || ''].filter(Boolean).map(esc).join(' · ')}${fam ? ' · ' + esc(fam) : ''}</span></li>`;
}

/* the thin strip: the chain's span on the history timeline's own years, the steps as numbered dots, and the larger events of the world in the same years (named below it, with a way to open each) */
function chainStripHTML(strip, world) {
  if (!strip) return '';
  const strands = Object.fromEntries(((world && world.strands) || []).map((s) => [s.id, s.label])); const at = (x) => Math.max(0, Math.min(100, x)).toFixed(2);
  return `<figure class="ch-strip" aria-label="${esc('The chain on the timeline, from ' + histYearLabel(strip.from) + ' to ' + histYearLabel(strip.to))}"><div class="ch-axis" aria-hidden="true">${strip.ticks.map((t) => `<span class="ch-tk" style="left:${at(t.x)}%"><i></i><b>${esc(t.label)}</b></span>`).join('')}</div>
    <div class="ch-track">${strip.steps.map((s) => (s.w > 0.4 ? `<span class="ch-bar" style="left:${at(s.x)}%;width:${at(s.w)}%" aria-hidden="true"></span>` : '')).join('')}${strip.steps.map((s) => `<button type="button" class="ch-dot" data-step="${s.n}" style="left:${at(s.x)}%" aria-label="${esc('Step ' + s.n + (s.y1 != null ? ', ' + histRangeLabel(s.y0, s.y1, false) : ', ' + histYearLabel(s.y0)))}">${s.n}</button>`).join('')}</div>
    ${strip.world.length ? `<div class="ch-wtrack" aria-hidden="true">${strip.world.map((e) => `<span class="ch-wt" style="left:${at(e.x)}%" title="${esc(e.label + ', ' + e.date)}"></span>`).join('')}</div>` : ''}
    <figcaption class="small t2">${esc(histYearLabel(strip.from))} to ${esc(histYearLabel(strip.to))}. The numbered dots are the steps; the small marks below are events of the world, listed here.</figcaption></figure>
    ${strip.world.length ? `<div class="ch-world"><h4 class="ch-h4">What else was happening</h4><ul class="plain">${strip.world.map((e) => `<li><span class="ch-wy">${esc(e.date || histYearLabel(e.y))}</span> <a href="#/history?s=${encodeURIComponent(e.id)}&y=${e.y}&z=8">${esc(e.label)}</a>${strands[e.strand] ? ` <span class="small muted">${esc(strands[e.strand])}</span>` : ''}</li>`).join('')}</ul></div>` : ''}`;
}

/* the heading over a chain: how many steps, over what years, how many have a cause written down, whether others are as short */
function chainSumHTML(ix, chain, res, st, g) {
  const n = chain.steps.length; const a = chainName(ix, chain.nodes[0]); const b = chainName(ix, chain.nodes[n]); const span = chain.span;
  const when = span ? `Recorded from ${histYearLabel(span.from)}${span.to !== span.from ? ' to ' + histYearLabel(span.to) : ''}. ` : '';
  const cov = chain.withCause === n ? `Every step has a cause written down here. ` : chain.withCause ? `${chain.withCause} of ${n} steps have a cause written down here; ${n - chain.withCause === 1 ? 'the other says' : 'the others say'} that it is not recorded. ` : `No step has a cause written down here yet; each says that it is not recorded. `;
  const many = res.total > 1 ? `<div class="small t2 ch-routes"><span>${esc(res.capped ? 'At least ' + res.total : String(res.total))} chains are equally short. This is ${st.r + 1} of the ${res.routes.length} shown, the ones with the most causes written down first.</span><span class="row tight"><button type="button" class="btn sm ghost" data-route="-1">Previous</button><button type="button" class="btn sm ghost" data-route="1">Next</button></span></div>` : '';
  const flt = g.only || g.kind ? `<p class="small t2">Following only ${[g.kind === 'descent' ? 'what grew from what' : g.kind === 'contact' ? 'contact between traditions' : '', g.only ? 'connections whose cause is ' + [...g.only].map((k) => esc(k)).join(' or ') : ''].filter(Boolean).join(', and ')}.</p>` : '';
  return `<section class="ch-head" aria-label="The chain"><h2 class="ch-h" id="chTitle" tabindex="-1">${esc(a)} to ${esc(b)}: ${esc(chainPlural(n, 'step'))}</h2>
    <p class="ch-lede">${esc(when + cov)}A chain is the fewest recorded connections that join the two. It follows connections, not time.</p>${flt}${many}
    ${chain.ordered ? '' : '<p class="hint">The steps are not all in date order: a chain follows recorded connections, which can run back in time (for example from a tradition to the one it grew from, and on to a sibling).</p>'}</section>`;
}

/* when nothing joins them: said plainly, with what is recorded for each, and the way on */
function chainNoneHTML(ix, g, gAll, a, b, nAll) {
  const da = chainDegree(g, a); const db = chainDegree(g, b); const links = chainCount(g); const all = chainCount(gAll);
  const fil = g.only || g.kind ? `<p>${nAll ? `Without the filter there is a chain of ${chainPlural(nAll, 'step')}. <button type="button" class="btn sm ghost" data-clear>Follow every connection</button>` : 'Without the filter there is none either.'}</p>` : '';
  return `<section class="card ch-empty"><h2 class="ch-h" id="chTitle" tabindex="-1">No recorded chain</h2><p>The map data records no chain of connections that joins ${esc(chainName(ix, a))} and ${esc(chainName(ix, b))}${g.only || g.kind ? ' by the choices above' : ''}. That is not the same as saying there is none: ${g.only || g.kind ? `${links} of its ${all} recorded links count under these choices` : `it holds ${links} recorded links among ${g.trad.size} traditions`}, and a link may exist that nobody has written down.</p>
    <p class="small t2">${esc(chainName(ix, a))} has ${chainPlural(da, 'recorded link')}; ${esc(chainName(ix, b))} has ${chainPlural(db, 'recorded link')}.</p>${fil}</section>`;
}

/* a tradition chosen on its own: what the Atlas records for it, each a way into a pair */
function chainAloneHTML(ix, g, a, meta) {
  const near = (g.adj.get(a) || []).map((id) => ({ id, e: chainEdge(g, a, id) })).filter((x) => x.e).sort((x, y) => chainEvidence(y.e) - chainEvidence(x.e) || (x.id < y.id ? -1 : 1));
  if (!near.length) return `<section class="card ch-empty"><h2 class="ch-h" id="chTitle" tabindex="-1">${esc(chainName(ix, a))}</h2><p>The map data records no connection for ${esc(chainName(ix, a))}, and no tradition it grew from or that grew from it. Pick another to try.</p></section>`;
  return `<section class="card ch-near"><h2 class="ch-h" id="chTitle" tabindex="-1">${esc(chainName(ix, a))}: ${esc(chainPlural(near.length, 'recorded link'))}</h2><p class="small t2">Choose the second tradition above, or open one of these.</p>
    <ul class="plain">${near.map((x) => { const l = x.e.links[0]; const k = l.row ? l.row.causes.map((c) => chainCauseTag(meta, c.cause)).join(' ') : ''; return `<li><a href="#/steps?a=${encodeURIComponent(a)}&b=${encodeURIComponent(x.id)}">${esc(chainSentence(ix, l))}</a> <span class="small muted">${esc(chainWhen(l))}</span> ${k}</li>`; }).join('')}</ul></section>`;
}

/* the whole result for the two chosen (or the one) */
function chainResultHTML(ix, g, gAll, st, meta, world, events) {
  if (!st.a) return '';
  if (!st.b) return chainAloneHTML(ix, g, st.a, meta);
  const res = chainRoutes(g, st.a, st.b);
  if (res.state === 'same') return `<section class="card ch-empty"><h2 class="ch-h" id="chTitle" tabindex="-1">Choose two different traditions</h2><p>${esc(chainName(ix, st.a))} is the same tradition at both ends. Pick another for one of them.</p></section>`;
  if (res.state !== 'ok') { const all = g.only || g.kind ? chainRoutes(gAll, st.a, st.b) : null; return chainNoneHTML(ix, g, gAll, st.a, st.b, all && all.state === 'ok' ? all.dist : 0); }
  const r = Math.min(st.r, res.routes.length - 1); const chain = chainBuild(g, res.routes[r].nodes); if (!chain) return chainNoneHTML(ix, g, gAll, st.a, st.b, 0);
  const s2 = Object.assign({}, st, { r }); const strip = chainStrip(chain, events); const kin = !st.k ? chainKin(ix.core.traditions, st.a, st.b) : '';
  const kinHint = kin && chain.steps.some((s) => chainClass(s.main) !== 'descent') ? `<p class="hint ch-kin">${esc(chainName(ix, st.a))} is recorded as ${kin === 'ancestor' ? 'an ancestor' : 'a descendant'} of ${esc(chainName(ix, st.b))}, but the shortest chain goes through contact. <button type="button" class="btn sm ghost" data-kind="descent">Show only what grew from what</button></p>` : '';
  return `${chainSumHTML(ix, chain, res, s2, g)}${kinHint}${chainStripHTML(strip, world)}<ol class="ch-chain" aria-label="The steps">${chain.nodes.map((id, i) => chainNodeHTML(ix, id, i === 0 ? 'from' : i === chain.nodes.length - 1 ? 'to' : 'via') + (i < chain.steps.length ? chainStepHTML(ix, chain.steps[i], meta) : '')).join('')}</ol>`;
}

/* what each cause carried: every row, by cause, each a way into its pair */
function chainBrowseHTML(groups, meta) {
  if (!groups.length) return '';
  return `<section class="ch-browse"><h2 class="ch-h2">What each cause carried</h2><p class="small t2">Every connection the map data has a cause written for, by cause. Open one to see its step.</p>${groups.map((g) => `<details class="ch-bg"><summary><b>${esc(g.label)}</b> <span class="small muted">${g.items.length}</span> <span class="small t2">${esc(g.text)}</span></summary><ul class="plain">${g.items.map((it) => `<li><a href="#/steps?a=${encodeURIComponent(it.a)}&b=${encodeURIComponent(it.b)}">${esc(it.sentence)}</a> <span class="small muted">${esc(it.label)}</span> ${chainStatusTag(meta, it.status)} <span class="small t2">${esc(it.note)}</span></li>`).join('')}</ul></details>`).join('')}</section>`;
}

/* before anything is chosen: what the page does, what the three ways of being sure mean, and the review state */
/* the one sentence that says what the page is, directly under the title and above the pickers (UX-36) */
const chainLedeHTML = () => '<p class="ch-lede ch-top">Choose two traditions and the page finds the fewest recorded connections between them, step by step.</p>';
/* the rest of the explanation, for a visitor who has not chosen a pair yet, under one quiet line: what each step says, how many links have a written cause, and the three ways of being sure */
function chainIntroHTML(meta, nRows, nLinks) {
  const sts = (meta && meta.statuses) || {};
  return `<details class="ch-intro ch-how"><summary class="small">How this works: what each step says and how sure it is</summary><p class="ch-lede" style="margin-top:8px">For each step it says what happened and when, what is said to have brought it about, and how well that is documented, with the sources. ${nRows ? `Causes are written for ${nRows} of the map data’s ${nLinks} recorded links so far; the rest say that the cause is not recorded here.` : 'The file of causes was not found, so every step says that its cause is not recorded here.'}</p>
    ${Object.keys(sts).length ? `<ul class="plain hx-causes ch-ways">${Object.entries(sts).map(([k, v]) => `<li>${chainStatusTag(meta, k)} ${esc(v[1])}</li>`).join('')}</ul>` : ''}</details>`;
}

/* the pickers, the ready-made pairs and the cause filter (rendered once; the result below them changes) */
function chainPickHTML(ix, st, groups, examples, meta) {
  const names = ix.core.traditions.filter((t) => t && t.name).slice().sort((x, y) => x.name.localeCompare(y.name));
  const val = (id) => (id ? chainName(ix, id) : '');
  return `<form class="ch-form" id="chForm" autocomplete="off" role="search" aria-label="Choose two traditions"><div class="ch-pick"><label for="chA">From</label><input class="input" id="chA" list="chNames" value="${esc(val(st.a))}" placeholder="A tradition, for example Buddhism" maxlength="80" spellcheck="false"></div>
    <button type="button" class="btn ghost sm ch-swap" id="chSwap" aria-label="Swap the two traditions" title="Swap the two">⇄</button>
    <div class="ch-pick"><label for="chB">To</label><input class="input" id="chB" list="chNames" value="${esc(val(st.b))}" placeholder="Another, for example Japanese Buddhism" maxlength="80" spellcheck="false"></div>
    <button type="submit" class="btn primary">Show the steps</button></form>
    <datalist id="chNames">${names.map((t) => `<option value="${esc(t.name)}"></option>`).join('')}</datalist><div class="ch-fb small" id="chFb" role="status" aria-live="polite"></div>
    ${examples.length ? `<div class="ch-ex"><span class="small t2">Try:</span>${examples.map((e, i) => `<button type="button" class="hx-chip" data-eg="${i}">${esc(chainName(ix, e.a) + ' to ' + chainName(ix, e.b))}</button>`).join('')}</div>` : ''}
    <div class="ch-fil ch-kinds" role="group" aria-label="Kinds of connection to follow"><span class="small t2">Follow:</span><button type="button" class="hx-chip" data-kind="" aria-pressed="${!st.k}">Any connection</button>${CHAIN_KINDS.map(([k, label, text]) => `<button type="button" class="hx-chip" data-kind="${k}" aria-pressed="${st.k === k}" title="${esc(text)}">${esc(label)}</button>`).join('')}</div>
    ${groups.length ? `<div class="ch-fil" role="group" aria-label="Follow only connections carried by"><span class="small t2">Follow only what was carried by:</span>${groups.map((g) => `<button type="button" class="hx-chip" data-cause="${esc(g.cause)}" aria-pressed="${st.c.includes(g.cause)}" title="${esc(g.text)}">${esc(g.label)} <span class="muted">${g.items.length}</span></button>`).join('')}</div>` : ''}
    <p class="ch-clr"><button type="button" class="btn sm ghost" id="chClear" data-clear${st.c.length || st.k ? '' : ' hidden'}>Clear the choices above</button></p>`;
}

/* ── the page ── */
Pages.steps = {
  async mount(root, parts, query) {
    const loc = typeof secLocate === 'function' ? secLocate('steps') : null;
    root.innerHTML = `${loc ? secHeadHTML(loc, { compact: true }) : '<div class="page-head fade-in"><div><h1>Compare traditions, step by step</h1><p>Pick two traditions and see the fewest recorded connections between them: what happened at each step, what is said to have brought it about, and how well that is documented.</p></div></div>'}${loc ? secNavHTML(loc, {}) : ''}<div id="chbody"><div class="card"><p class="t2">Opening the connections…</p></div></div>`;
    const body = root.querySelector('#chbody'); let ix; let causes = null; let world = null;
    try { ix = await ATLD.open(); } catch (e) { body.innerHTML = `<div class="card"><div class="callout warn">${icon('warn')}<div>The connections were not found. They live in the <b>atlas</b> folder next to <b>Lamplighter.html</b> (the same place as the map).</div></div></div>`; return; }
    try { await Promise.all([ATLD.need('causes').catch(() => null), ATLD.need('world').catch(() => null), typeof TXT !== 'undefined' ? TXT.index().catch(() => null) : null]); } catch (e) { /* the causes, the world and the texts are each optional */ }
    if (!root.isConnected) return;
    causes = ATLD.get('causes') || null; world = ATLD.get('world') || null; const meta = (causes && causes.meta) || {}; const events = world && Array.isArray(world.events) ? world.events : [];
    const core = ix.core; const ids = new Set(core.traditions.map((t) => t.id)); const kinds = Object.keys(meta.causes || {}); const st = chainState(query, ids, kinds);
    const groups = causes ? chainBrowse(ix, causes) : []; const examples = CHAIN_EXAMPLES.filter((e) => ids.has(e.a) && ids.has(e.b)); const gAll = chainGraph(core, causes);
    body.innerHTML = `<div class="ch">${chainLedeHTML()}${meta.review === 'unchecked' ? `<details class="ch-review"><summary class="small">${esc(meta.second_reading && meta.second_reading.read && meta.second_reading.read.length ? (causes && causes.rows && meta.second_reading.read.length >= causes.rows.length ? 'The causes of ' + causes.rows.length + ' connections were written by hand, and every one has been read a second time against its sources by another reader; none has been read by a specialist.' : 'The causes were written by hand, and ' + meta.second_reading.read.length + ' of the connections they cover have been read a second time against their sources by another reader; the rest were read by the author only.') : 'The causes were written by hand and read by the author only; no one else has yet checked them against their sources.')}</summary><p class="hint">${esc(meta.review_note || 'The causes were written by hand and have not yet been checked against their sources.')}</p></details>` : ''}<div id="chPick">${chainPickHTML(ix, st, groups, examples, meta)}</div><div class="ch-out" id="chOut" aria-live="polite"></div><div id="chRest"></div></div>`;
    const out = body.querySelector('#chOut'); const rest = body.querySelector('#chRest'); const fb = body.querySelector('#chFb'); const inA = body.querySelector('#chA'); const inB = body.querySelector('#chB'); const ch = body.querySelector('.ch');
    let alive = true; const cleanups = []; const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); cleanups.push(() => t.removeEventListener(ev, fn, o)); };
    const urlSync = () => { try { const q = chainQueryString(st); history.replaceState(null, '', '#/steps' + (q ? '?' + q : '')); } catch (e) { /* file:// in some browsers */ } };
    const graphFor = () => (st.c.length || st.k ? chainGraph(core, causes, st.c.length ? new Set(st.c) : null, st.k) : gAll);
    const draw = (focus) => {
      const g = graphFor(); out.innerHTML = chainResultHTML(ix, g, gAll, st, meta, world, events);
      rest.innerHTML = st.a ? '' : chainIntroHTML(meta, causes ? causes.rows.length : 0, chainCount(gAll)) + chainBrowseHTML(groups, meta);
      $$('[data-cause]', ch).forEach((b) => b.setAttribute('aria-pressed', String(st.c.includes(b.dataset.cause)))); $$('[data-kind]', ch).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.kind === st.k)));
      const clr = body.querySelector('#chClear'); if (clr) clr.hidden = !(st.c.length || st.k);
      urlSync(); if (focus) { const h = out.querySelector('#chTitle'); if (h) h.focus({ preventScroll: false }); }
    };
    const read = (el, was) => { const v = el.value.trim(); if (!v) return { id: '', options: [] }; if (was && chainName(ix, was) === v) return { id: was, options: [] }; return chainFind(core.traditions, v); };
    const go = (focus) => {
      const a = read(inA, st.a); const b = read(inB, st.b); fb.innerHTML = '';
      const bad = [[inA, a], [inB, b]].filter(([el, f]) => el.value.trim() && !f.id);
      if (bad.length) { const [el, f] = bad[0]; fb.innerHTML = f.options.length ? `“${esc(el.value.trim())}” could be any of: ${f.options.map((id) => `<button type="button" class="hx-chip" data-pick="${esc(id)}" data-into="${el === inA ? 'a' : 'b'}">${esc(chainName(ix, id))}</button>`).join(' ')}` : `“${esc(el.value.trim())}” is not a tradition in the map data. Start typing and choose one from the list.`; return; }
      st.a = a.id; st.b = b.id; st.r = 0; if (!st.a && st.b) { st.a = st.b; st.b = ''; inB.value = ''; }                    /* a second tradition on its own is a first */
      if (st.a) inA.value = chainName(ix, st.a); if (st.b) inB.value = chainName(ix, st.b); draw(focus);
    };
    draw(false);
    on(ch, 'submit', (ev) => { ev.preventDefault(); go(true); });
    on(ch, 'click', (ev) => {
      const t = ev.target; const kd = t.closest('[data-kind]'); const eg = t.closest('[data-eg]'); const ca = t.closest('[data-cause]'); const rt = t.closest('[data-route]'); const sp = t.closest('[data-step]'); const pk = t.closest('[data-pick]'); const cl = t.closest('[data-clear]'); const sw = t.closest('#chSwap');
      if (kd) { st.k = kd.dataset.kind === 'descent' || kd.dataset.kind === 'contact' ? kd.dataset.kind : ''; st.r = 0; draw(false); return; }
      if (eg) { const e = examples[+eg.dataset.eg]; if (!e) return; inA.value = chainName(ix, e.a); inB.value = chainName(ix, e.b); st.a = e.a; st.b = e.b; st.r = 0; fb.innerHTML = ''; draw(true); return; }
      if (ca) { const k = ca.dataset.cause; st.c = st.c.includes(k) ? st.c.filter((x) => x !== k) : kinds.filter((x) => st.c.includes(x) || x === k); st.r = 0; if (st.a) draw(false); else { urlSync(); $$('[data-cause]', ch).forEach((b) => b.setAttribute('aria-pressed', String(st.c.includes(b.dataset.cause)))); } return; }
      if (cl) { st.c = []; st.k = ''; st.r = 0; draw(false); return; }
      if (rt) { const res = chainRoutes(graphFor(), st.a, st.b); const n = Math.max(1, res.routes.length); st.r = (st.r + (+rt.dataset.route) + n) % n; draw(false); return; }
      if (sp) { const el = body.querySelector('#chStep' + sp.dataset.step); if (el) el.scrollIntoView({ block: 'center', behavior: typeof prefersReducedMotion === 'function' && prefersReducedMotion() ? 'auto' : 'smooth' }); return; }
      if (pk) { (pk.dataset.into === 'a' ? inA : inB).value = chainName(ix, pk.dataset.pick); fb.innerHTML = ''; go(true); return; }
      if (sw) { const x = inA.value; inA.value = inB.value; inB.value = x; const s = st.a; st.a = st.b; st.b = s; if (inA.value.trim() && inB.value.trim()) go(true); }
    });
    return () => { alive = false; cleanups.forEach((f) => { try { f(); } catch (e) { /* gone already */ } }); };
  },
};
