/* ═══════════════════════════ 6zz · Traditions: browse by belief, one belief, and the family tree ═══════════════════════════
   The place to study a religion as a whole. Three pages: Browse by belief (the four ways people have understood the sacred, with the way into each), one belief (its best known traditions, the shelves of
   the Library that hold their texts, and the whole list), and the Family tree (every tradition of the Atlas that has a recorded parent or children, as nested lists that open one at a time).
   A tradition's own page is the Atlas page for it (#/atlas/tradition/<id>), which is where the texts, the map, the calendar and the roots and branches of that one religion are together.
   The list of all the traditions (#/atlas/traditions: the overview of the nine families, the filters and the list) is drawn by 6zza-tradlist.js, with its rules in 2z-tradlist-core.js; Browse by belief below is unchanged and links to it. */
const trimTo = (s, n) => { s = String(s || '').trim(); if (s.length <= n) return s; const cut = s.slice(0, n); return cut.slice(0, Math.max(cut.lastIndexOf(' '), n - 30)).replace(/[,;:(\s]+$/, '') + '…'; };
/* one tradition as a card: its name and date, a line about it, what kind it is, and the other beliefs it is described under */
function traditionCardHTML(ix, t, memo) {
  const r = beliefOf(ix.trad, t.id, memo); const kind = (ix.codes.tradition_kind[t.kind] || t.kind || '').replace(/ \(.*/, ''); const status = ix.codes.tradition_status[t.status] || '';
  return `<a class="card trcard fade-in" href="#/atlas/tradition/${t.id}"><div class="tc-top"><b>${esc(t.name)}</b><span class="small muted">${esc(atlDate(t))}</span></div><p class="small t2">${esc(trimTo(t.summary, 190))}</p><div class="small muted">${esc(kind)}${status ? ' · ' + esc(status) : ''}${r.length > 1 ? ' · also ' + r.slice(1).map((x) => esc(beliefName(x).toLowerCase())).join(', ') : ''}</div><span class="door-go">Open its page →</span></a>`;
}
Pages.traditions = {
  async mount(root, parts, query) {
    const view = parts[0] === 'belief' ? 'belief' : parts[0] === 'tree' ? 'tree' : parts[0] === 'movements' ? 'movements' : 'browse';
    const loc = secLocate(view === 'tree' ? 'traditions/tree' : view === 'belief' ? 'traditions/belief' : view === 'movements' ? 'traditions/movements' : 'traditions');
    root.innerHTML = `${secHeadHTML(loc, {})}${secNavHTML(loc, {})}<div id="tbody"></div>`;
    const body = root.querySelector('#tbody');
    try { if (view === 'belief') await traditionsBelief(body, parts[1]); else if (view === 'tree') await (typeof treeBranchView === 'function' ? treeBranchView(body, query) : traditionsTree(body, query)); else if (view === 'movements') { body.innerHTML = movementsPageHTML(query); movementsWire(body, query); } else await traditionsBrowse(body); }
    catch (e) { console.error(e); body.innerHTML = `<div class="card"><h2>Something went wrong</h2><p class="muted">${esc(e.message)}</p></div>`; }
  },
};

/* ── Browse by belief ── */
async function traditionsBrowse(body) {
  const ix = await ATLD.open(); const memo = {}; const all = ix.core.traditions; const n = (b) => all.filter((t) => beliefOf(ix.trad, t.id, memo).includes(b)).length;
  const pick = ['christianity', 'islam', 'judaism', 'hinduism', 'buddhism', 'sikhism', 'bahai', 'daoism', 'shinto', 'jainism', 'zoroastrianism'].filter((i) => ix.trad[i]);
  const deep = BELIEFS.find((b) => b.id === 'deep');
  body.innerHTML = `<h2 class="start-h">Choose a way in</h2>
    <p class="t2 small start-sub">There are ${all.length} traditions in the map data, from the first burials to new movements of today. Start with the kind of belief you feel most drawn to, or most curious about. Each one opens its best known traditions, their texts, and the whole list. A way to find your bearings, not a ruling: many traditions belong under two ideas, and every page says so.</p>
    <div class="bcards">${BELIEFS.filter((b) => b.id !== 'deep').map((b) => beliefCardHTML(b, n(b.id))).join('')}</div>
    <div class="tfind-row"><form class="tfind" id="trFind" role="search"><input class="input" type="search" id="trFindQ" placeholder="Find a religion, school or movement by name…" aria-label="Find a tradition by name" autocomplete="off"><button class="btn primary" type="submit">${icon('search')}Find</button></form></div>
    <h3 class="start-h">The ones most often asked about</h3>
    <div class="row tight">${pick.map((i) => `<a class="chip" href="#/atlas/tradition/${i}">${esc(ix.trad[i].name)}</a>`).join('')}</div>
    <h3 class="start-h">Other ways in</h3>
    <div class="grid c3"><a class="card flat door2" href="#/traditions/tree"><b>${icon('tree')} The family tree</b><span class="small t2">Where each religion came from and what grew out of it.</span></a>
      <a class="card flat door2" href="#/atlas"><b>${icon('globe')} The traditions map</b><span class="small t2">Move through time and watch religions spread, branch, meet and fade.</span></a>
      <a class="card flat door2" href="#/path/common"><b>${icon('swap')} Common ground</b><span class="small t2">What the traditions share, and where they part.</span></a></div>
    <section class="card flat bdeep fade-in" style="margin-top:16px"><div class="card-title"><h3>${icon('clock')}${esc(deep.label)}</h3><span class="tag">${esc(deep.term)}</span></div><p class="small t2" style="max-width:70ch">${esc(deep.line)} <a href="#/traditions/belief/deep">See the ${n('deep')} horizons →</a></p></section>`;
  const f = body.querySelector('#trFind'); if (f) f.addEventListener('submit', (e) => { e.preventDefault(); const q = body.querySelector('#trFindQ').value.trim(); location.hash = '#/atlas/traditions' + (q ? '?q=' + encodeURIComponent(q) : ''); });
}

/* ── one belief ── */
async function traditionsBelief(body, id) {
  const b = BELIEFS.find((x) => x.id === id);
  if (!b) { body.innerHTML = '<div class="card"><p>There is no such belief. <a href="#/traditions">Back to Browse by belief</a></p></div>'; return; }
  const ix = await ATLD.open(); const memo = {}; const all = ix.core.traditions.filter((t) => beliefOf(ix.trad, t.id, memo).includes(b.id)); const firstN = all.filter((t) => beliefOf(ix.trad, t.id, memo)[0] === b.id).length;
  const featured = (BELIEF_FEATURED[b.id] || []).map((i) => ix.trad[i]).filter(Boolean);
  const shelves = LIB_GROUPS.filter(([g]) => shelfBelief(g) === b.id || shelfAlso(g).includes(b.id)); const nOf = (g) => LIB.filter((l) => l.group === g).length;
  const i = BELIEFS.findIndex((x) => x.id === b.id); const prev = BELIEFS[(i + BELIEFS.length - 1) % BELIEFS.length]; const next = BELIEFS[(i + 1) % BELIEFS.length];
  body.innerHTML = `<div class="small" style="margin-bottom:10px"><a href="#/traditions">← Browse by belief</a></div>
    <section class="card glow fade-in bhead" data-b="${b.id}"><div class="eyebrow">${esc(b.term)}</div><h2>${icon(b.icon)} ${esc(b.label)}</h2><p class="bh-line">${esc(b.line)}</p><div class="callout">${icon('info')}<div>${esc(b.care)}</div></div>
      <div class="row" style="margin-top:12px"><a class="btn primary" href="#/atlas/traditions?b=${b.id}">All ${all.length} traditions →</a><a class="btn" href="#/traditions/tree?b=${b.id}">${icon('tree')}Their family tree</a></div>
      <p class="hint" style="margin-top:10px">${firstN} of the ${all.length} are listed first under this belief; the rest are also described this way.</p></section>
    <h3 class="start-h">Well-known traditions</h3>
    <div class="tcards">${featured.map((t) => traditionCardHTML(ix, t, memo)).join('')}</div>
    ${shelves.length ? `<h3 class="start-h">Read their texts</h3><p class="t2 small start-sub">The shelves of the Library that hold the texts of these traditions, in English.</p><div class="grid c3">${shelves.map(([g, name]) => { const first = shelfBelief(g) === b.id; return `<a class="card flat door2" href="#/path/library?g=${g}&a=belief"><b>${esc(name)}</b><span class="small t2">${nOf(g)} texts${first ? '' : ' · also found under ' + esc(beliefName(shelfBelief(g)).toLowerCase())}</span></a>`; }).join('')}</div>` : ''}
    <div class="row" style="margin-top:22px;justify-content:space-between"><a class="btn ghost" href="#/traditions/belief/${prev.id}">← ${esc(prev.label)}</a><a class="btn ghost" href="#/traditions/belief/${next.id}">${esc(next.label)} →</a></div>`;
}

/* ── the family tree ── */
async function traditionsTree(body, query) {
  const ix = await ATLD.open(); const memo = {}; const trad = ix.trad; const kids = ix.kids;
  const bel = BELIEFS.some((x) => x.id === query.b) ? query.b : ''; const q = (query.q || '').trim().toLowerCase(); const openId = trad[query.open] ? query.open : ''; const openSet = new Set(openId ? atlLineage(ix, openId) : []);
  const nDesc = {}; const count = (id) => { if (nDesc[id] === undefined) { let n = 0; (kids[id] || []).forEach((k) => { n += 1 + count(k); }); nDesc[id] = n; } return nDesc[id]; };
  const self = (id) => (!bel || beliefOf(trad, id, memo).includes(bel)) && (!q || trad[id].name.toLowerCase().includes(q) || (trad[id].name_original || '').toLowerCase().includes(q));
  const hasM = {}; const has = (id) => { if (hasM[id] === undefined) hasM[id] = self(id) || (kids[id] || []).some(has); return hasM[id]; };
  const byYear = (a, b) => (trad[a].start_year == null ? 0 : trad[a].start_year) - (trad[b].start_year == null ? 0 : trad[b].start_year) || trad[a].name.localeCompare(trad[b].name);
  const tag = (id, parentFirst) => { const f = beliefOf(trad, id, memo)[0]; return f !== parentFirst ? `<span class="tag tbel" data-b="${f}">${esc(beliefName(f))}</span>` : ''; };
  const node = (id, parentFirst) => {
    const t = trad[id]; const ks = (kids[id] || []).filter(has).sort(byYear); const first = beliefOf(trad, id, memo)[0]; const hit = id === openId;
    const label = `<span class="tn"><a href="#/atlas/tradition/${id}">${esc(t.name)}</a> <span class="muted small">${esc(atlDate(t))}</span> ${tag(id, parentFirst)}</span>`;
    if (!ks.length) return `<li${hit ? ' class="tree-hit" id="tree-hit"' : ''}>${label}</li>`;
    const open = openSet.has(id) || !!q; return `<li${hit ? ' class="tree-hit" id="tree-hit"' : ''}><details${open ? ' open' : ''}><summary>${label}<span class="tag">${count(id)} branch${count(id) === 1 ? '' : 'es'}</span></summary><ul class="tree-ul">${ks.map((k) => node(k, first)).join('')}</ul></details></li>`;
  };
  const roots = ix.core.traditions.filter((t) => !t.parent_id && (kids[t.id] || []).length).map((t) => t.id).sort((a, b) => count(b) - count(a)).filter(has);
  const alone = ix.core.traditions.filter((t) => !t.parent_id && !(kids[t.id] || []).length && self(t.id)).sort((a, b) => (a.start_year == null ? 0 : a.start_year) - (b.start_year == null ? 0 : b.start_year) || a.name.localeCompare(b.name));
  body.innerHTML = `<p class="t2 small" style="max-width:74ch">Where each tradition came from and what grew out of it, as the map data records it. A tradition has one recorded parent, where scholars agree on one, so Islam, for example, appears as its own root although it drew on Jewish, Christian and Arabian sources. Each tradition’s page lists the other relationships the tree leaves out: borrowing, conflict and merging. Open a branch to see what is under it.</p>
    <div class="row" style="margin:12px 0"><input class="input" id="tfQ" type="search" placeholder="Find a name in the tree…" value="${esc(query.q || '')}" style="max-width:280px" aria-label="Find a name in the tree">
      <select class="select" id="tfB" style="width:auto;max-width:280px" aria-label="Belief"><option value="">Any belief</option>${BELIEFS.map((x) => `<option value="${x.id}"${bel === x.id ? ' selected' : ''}>${esc(x.label)} (${esc(x.term)})</option>`).join('')}</select>
      <span class="muted small">${roots.length} families with branches${alone.length ? ` · ${alone.length} standing alone` : ''}</span></div>
    ${roots.length ? `<ul class="tree-ul tree-top">${roots.map((r) => node(r, '')).join('')}</ul>` : '<div class="card flat"><p class="t2">Nothing in the tree matches. Try fewer letters, or any belief.</p></div>'}
    ${alone.length ? `<details class="card flat tree-alone" style="margin-top:16px"><summary><b>Standing alone</b> <span class="muted small">${alone.length} traditions with no recorded parent and no recorded branches</span></summary><div class="row tight" style="margin-top:10px">${alone.map((t) => `<a class="chip" href="#/atlas/tradition/${t.id}">${esc(t.name)}</a>`).join('')}</div></details>` : ''}`;
  const go = debounce(() => { location.hash = '#/traditions/tree?' + new URLSearchParams({ q: body.querySelector('#tfQ').value, b: body.querySelector('#tfB').value }); }, 300);
  body.querySelector('#tfQ').addEventListener('input', go); body.querySelector('#tfB').addEventListener('change', go);
  const hitEl = body.querySelector('#tree-hit'); if (hitEl && hitEl.scrollIntoView) setTimeout(() => hitEl.scrollIntoView({ block: 'center' }), 60);
}

/* ── the page of one tradition (the Atlas page, #/atlas/tradition/<id>): the belief it is described under, the way to study it as a whole, and its roots and branches ── */
/* the nineteen traditions of the Journey that this Atlas tradition belongs to: the first, going up from it, that the Journey names (an exception below, or the one whose Atlas link is that tradition), else the one for the family of the nearest ancestor that has one */
const PATH_EXTRA = { sikhism: 'jain-sikh', roman: 'greece-rome', etruscan: 'greece-rome', minoan: 'greece-rome', italic: 'greece-rome', thracian: 'greece-rome', mithraism: 'gnostic', hermeticism: 'gnostic', neoplatonism: 'gnostic',
  aztec_religion: 'mesoamerica', inca_religion: 'mesoamerica', andean_religion: 'mesoamerica', mixtec_religion: 'mesoamerica', olmec: 'mesoamerica', chavin_religion: 'mesoamerica', caral_religion: 'mesoamerica' };
const PATH_NORTH = ['norse', 'celtic', 'germanic', 'finnic', 'slavic', 'baltic', 'sami', 'irish_celtic', 'druidism'];      /* the European family is not all Northern Europe: Greece, Rome and the Mediterranean are the Journey’s Greece and Rome */
function pathTraditionOf(ix, id) {
  const t = ix.trad[id]; if (!t) return null; const lin = atlLineage(ix, id); const entries = Object.entries(ATL_FROM_PATH); let hit = null;
  for (const x of lin) { if (PATH_EXTRA[x]) { hit = PATH_EXTRA[x]; break; } const e = entries.find(([, m]) => m.sel === x); if (e) { hit = e[0]; break; } }
  if (!hit) for (const x of lin) { const f = ix.trad[x].family_id; if (f === 'european') continue; const e = entries.find(([, m]) => m.f && m.f === f); if (e) { hit = e[0]; break; } }
  if (!hit && PATH_NORTH.some((x) => lin.includes(x))) hit = 'north-europe';
  if (!hit) { const g = entries.find(([, m]) => m.g && m.g === ix.famGroup[t.family_id]); if (g) hit = g[0]; }
  return hit ? TRAD_BY_ID[hit] || null : null;
}
/* “Often described as One God (monotheism), and also …”: a way to find a tradition, said as that and no more */
function tradBeliefLineHTML(ix, id) {
  const r = beliefOf(ix.trad, id, {}); const link = (b) => `<a href="#/traditions/belief/${b}">${esc(beliefFull(b))}</a>`;
  return `<p class="hub-bel small">${icon('compass')}<span>Often described as ${link(r[0])}${r.length > 1 ? ', and also as ' + r.slice(1).map(link).join(' and ') : ''}. <span class="muted">A way to find it, not a verdict.</span></span></p>`;
}
/* the buttons that scroll to the parts of the page that this tradition has */
function tradHubNavHTML(o) {
  /* a jump button carries the name of the section it jumps to (SA-07: “Timeline” was five things, so the section is “Dated records”; B1 #16: the jump to the presence rows was “Where it spread” beside the Study card's “Presence over time ↓”, one target with two names, so of the three map buttons two names are kept, “Show on the map” and “Presence over time”; B1 #8: the section is the catalogue's records) */
  const items = [['hub-study', 'Study it'], ['hub-roots', 'Roots and branches'], o.timeline && ['hub-timeline', 'Dated records'], o.spread && ['hub-spread', 'Presence over time'], o.texts && ['hub-texts', 'Texts in the catalogue'], o.prac && ['hub-practices', 'Practices'], o.cal && ['hub-cal', 'Calendar'], o.sites && ['hub-sites', 'Sites']].filter(Boolean);
  return `<nav class="hubnav" aria-label="On this page">${items.map(([id, n]) => `<button type="button" class="chip" data-jump="${id}">${esc(n)}</button>`).join('')}</nav>`;
}
/* everything the Lamplighter Project holds about the tradition, in one place: its texts, its stations, its map, its tree, its calendar, how it is practised and how to worship together */
function tradStudyHTML(ix, t, o) {
  const aboutN = o.about || 0; const loreN = o.lore || 0; const shelves = shelvesOfTradition(ix.trad, t.id).map((g) => LIB_GROUPS.find((x) => x[0] === g)).filter(Boolean); const nBooks = shelves.reduce((a, [g]) => a + LIB.filter((l) => l.group === g).length, 0); const pt = pathTraditionOf(ix, t.id);
  const card = (ic, title, line, links) => `<div class="card flat hubcard"><b>${icon(ic)}${esc(title)}</b><span class="small t2">${line}</span><span class="hubcard-links">${links}</span></div>`;
  const cards = [
    card('book', 'Texts to read', aboutN || loreN ? `${[loreN ? loreN + ' old source text' + (loreN === 1 ? '' : 's') + ' it draws on' : '', aboutN ? aboutN + ' book' + (aboutN === 1 ? '' : 's') + ' about it' : ''].filter(Boolean).join(' and ')} in the Library${nBooks ? `, and ${nBooks} text${nBooks === 1 ? '' : 's'} in English on ${shelves.length === 1 ? 'one shelf' : shelves.length + ' shelves'} it belongs to` : ''}.` : nBooks ? `${nBooks} text${nBooks === 1 ? '' : 's'} in English on ${shelves.length === 1 ? 'one shelf' : shelves.length + ' shelves'} of the Library.` : `None of its own in the Library yet. ${o.texts ? `The catalogue below lists ${o.texts} that are known.` : 'Many oral traditions have none written down.'}`, (loreN ? '<button type="button" class="chip" data-jump="hub-lore">Old sources ↓</button>' : '') + (aboutN ? '<button type="button" class="chip" data-jump="hub-about">Books about it ↓</button>' : '') + shelves.map(([g, name]) => `<a class="chip" href="#/path/library?g=${g}&a=belief">${esc(name.replace(/\s*\(.*$/, ''))}</a>`).join('')),
    pt ? card('path', 'In the Journey', `${pt.stations.length} station${pt.stations.length === 1 ? '' : 's'} under “${esc(pt.short || pt.name)}”, with the timeline and how it connects to others.`, `<a class="chip" href="#/path/tradition/${pt.id}" title="The Journey for ${esc(pt.short || pt.name)}: its stations, timeline and readings">Journey →</a>`) : '',
    card('globe', 'Where it spread', `Watch it begin, spread and change on the map${o.rows ? `, from ${o.rows} dated record${o.rows === 1 ? '' : 's'}` : ''}.`, `<a class="chip" href="${atlLink(t)}">Show on the map →</a>${o.spread ? '<button type="button" class="chip" data-jump="hub-spread">Presence over time ↓</button>' : ''}`),
    card('tree', 'Roots and branches', 'What it grew from and what grew from it.', `<button type="button" class="chip" data-jump="hub-roots">Jump to it ↓</button><a class="chip" href="#/traditions/tree?open=${t.id}">Family tree →</a>`),
    o.cal ? card('clock', 'Calendar and holy days', 'How it keeps time, and when its holy days fall.', '<button type="button" class="chip" data-jump="hub-cal">Jump to it ↓</button><a class="chip" href="#/atlas/calendars">All calendars →</a>') : '',
    card('lotus', 'How it is practised', o.prac ? 'The ways of reaching toward the divine recorded for it, and the practices to try.' : 'Practices to try, and the rites and customs of the traditions.', `${o.prac ? '<button type="button" class="chip" data-jump="hub-practices">Jump to it ↓</button>' : ''}<a class="chip" href="#/path/practices">Ways to worship →</a>`),
    card('heart', 'Worship together', 'Build an order of service or start a study circle with others: no accounts, no server.', '<a class="chip" href="#/gather/services">Services →</a><a class="chip" href="#/gather/circles">Circles →</a>'),
  ].filter(Boolean).join('');
  return `<section class="card fade-in hubin" id="hub-study" style="margin-top:16px"><div class="card-title"><h3>Study ${esc(t.name)} as a whole</h3></div><div class="hubcards">${cards}</div></section>`;
}
/* a list of Library books under a tradition's catalogue of its own texts: the books ABOUT it (a field record, a study, a history) or the OLD SOURCES a revival draws on.
   `ids` come from aboutIds(); `o` = { id (the anchor the jump buttons use), head, hint } */
function tradBooksHTML(ids, o) {
  if (!ids.length) return '';
  const rank = (x) => (TXT.has(x) ? 0 : 1); const order = ids.slice().sort((a, b) => rank(a) - rank(b)); const cap = 8;      /* the ones that can be read here come first */
  const row = (x) => { const l = LIB_BY_ID[x]; const line = aboutLine(l); return `<li><div class="spread" style="gap:8px;flex-wrap:wrap"><div><b>${esc(l.title)}</b>${line ? `<div class="small muted">${esc(line)}</div>` : ''}</div><span class="row tight">${TXT.has(x) ? `<a class="btn sm primary" href="#/path/read/${x}">Read here</a>` : `<a class="btn sm ghost" href="#/path/library?q=${encodeURIComponent(l.title)}">In the Library</a>`}</span></div></li>`; };
  return `<div class="hub-about" id="${o.id}"><div class="mt-h">${esc(o.head)} <span class="muted">${ids.length}</span></div><ul class="plain atl-texts">${order.slice(0, cap).map(row).join('')}</ul>${order.length > cap ? `<details class="atl-more"><summary class="small">The other ${order.length - cap}</summary><ul class="plain atl-texts">${order.slice(cap).map(row).join('')}</ul></details>` : ''}<p class="hint">${esc(o.hint)}</p></div>`;
}
const tradAboutHTML = (ids) => tradBooksHTML(ids, { id: 'hub-about', head: 'Books about it in the Library', hint: 'Written about the tradition, not by it: most are by outsiders, often in the colonial or missionary period, so each gives its author’s view. For many peoples they are nearly all there is to read; read them beside the people’s own accounts where those exist.' });
const tradLoreHTML = (ids) => tradBooksHTML(ids, { id: 'hub-lore', head: 'The old sources its revival draws on', hint: 'A revived or reconstructed religion is made today from older writings. These are those writings, held in the Library: source material, not scripture written by the revival itself, and how its practitioners read and use them varies.' });
/* where it came from and what grew out of it, as three short columns */
function tradRootsHTML(ix, t) {
  const anc = atlLineage(ix, t.id).slice(1).reverse(); const yr = (x) => (ix.trad[x].start_year == null ? 0 : ix.trad[x].start_year); const kids = (ix.kids[t.id] || []).slice().sort((a, b) => yr(a) - yr(b)); const n = atlDescendants(ix, t.id).length;
  const node = (x, cls, extra) => `<a class="mt-node${cls || ''}" href="#/atlas/tradition/${x}"><b>${esc(ix.trad[x].name)}</b><span>${esc(atlDate(ix.trad[x]))}${extra || ''}</span></a>`;
  /* SA-13: a tradition with no branches draws no third column: the page says so once, in its one “Not recorded for this tradition: … branches.” line at the foot (6q-atlas-pages.js), not here as well */
  return `<section class="card flat fade-in" id="hub-roots" style="margin-top:16px"><div class="card-title"><h3>${icon('tree')}Roots and branches</h3><a class="small" href="#/traditions/tree?open=${t.id}">Open in the family tree →</a></div>
    <div class="mtree"><div class="mt-col"><div class="mt-h">Where it came from</div>${anc.length ? anc.map((x) => node(x)).join('<span class="mt-arrow" aria-hidden="true">↓</span>') : '<p class="small t2">A root: no parent tradition is recorded.</p>'}</div>
      <div class="mt-col mt-self"><div class="mt-h">This tradition</div><div class="mt-node here"><b>${esc(t.name)}</b><span>${esc(atlDate(t))}</span></div></div>
      ${kids.length ? `<div class="mt-col"><div class="mt-h">What grew from it${n ? ` <span class="muted">${kids.length} branch${kids.length === 1 ? '' : 'es'}, ${n} in all</span>` : ''}</div>${kids.slice(0, 14).map((x) => { const d = atlDescendants(ix, x).length; return node(x, ' sm', d ? ' · ' + d + ' below' : ''); }).join('') + (kids.length > 14 ? `<a class="small more-link" href="#/traditions/tree?open=${t.id}">${kids.length - 14} more in the family tree</a>` : '')}</div>` : ''}</div>
    <p class="hint">The map data records one parent for a tradition, where scholars agree on one. Borrowing, conflict and merging are listed under Relationships below.</p></section>`;
}
