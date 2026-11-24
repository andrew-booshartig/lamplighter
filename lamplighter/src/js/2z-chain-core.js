/* ═══════════════════════════ 2z · Compare traditions, step by step: the pure parts ═══════════════════════════
   (BACKLOG D5, 18 November 2026.) Pick two traditions and see the steps between them: what happened at each step, when and where, what is said to have brought it about, and how well that is documented.
   The graph is the Atlas's own: its 500 recorded connections between traditions (the "interactions"), plus the parent each tradition is recorded to have grown from where no connection row says so
   (a "lineage" link, which has a cause only where a row is written for it as "lineage:<child>"). A chain is the FEWEST recorded steps that join the two, found by a breadth-first search that takes every link in either direction: a chain follows
   connections, not time, so its steps are not always in date order, and the page says so when they are not. Several chains can be equally short; they are ranked by how many steps have a cause written down
   (a documented one first) and then by name, so the same two traditions always give the same chain, and the others are a button away. Nothing here guesses: two traditions with no chain between them
   get "no recorded chain", which is not "no connection". The cause rows (interaction_causes.json) are found by connection id; a connection with no row has no cause recorded, and says so. A filter by
   cause keeps only the connections whose row names that cause. Everything is a pure function (tests/chain.test.js); the page is 6zzc-chain.js. Needs 2t-atlas-core.js (atlSentence) and
   2z-history-core.js (the scale of years, for the strip). */
const CHAIN_MAX = { routes: 6, found: 400, name: 80 };                                     /* chains shown for one pair; chains counted before the count is called "at least"; the longest name or address read */
const CHAIN_LINEAGE = ['derive', 'schism', 'reform', 'revive'];                              /* a connection of these kinds already says "this grew from that" */
const CHAIN_WORLD = { importance: 4, max: 8, window: 0.12, pad: 60 };                       /* the strip shows world events of this size and up, this many, and this much of the span (at least this many years) either side */
const CHAIN_KINDS = [['descent', 'What grew from what', 'Descent, splits, reforms and revivals: one tradition recorded as growing out of another.'], ['contact', 'Contact', 'Influence, carrying across, conversion, blending, conflict and the rest: one tradition meeting another.']];
/* the pairs the page offers to try, named by the Atlas's own names; every one is checked to have a chain, with a cause written for at least one step, by tests/chain.test.js */
const CHAIN_EXAMPLES = [{ a: 'judaism', b: 'christianity' }, { a: 'buddhism', b: 'japanese_buddhism' }, { a: 'christianity', b: 'protestantism' }, { a: 'judaism', b: 'islam' }, { a: 'islam', b: 'sikhism' }, { a: 'judaism', b: 'hasidism' }, { a: 'buddhism', b: 'rinzai' }];

const chainKey = (a, b) => (a < b ? a.length + ':' + a + b : b.length + ':' + b + a);
const chainYear = (y) => (typeof y === 'number' && Number.isFinite(y) && y !== 0 ? y : null);
const chainYearOf = (t) => (t >= 0 ? t + 1 : t);                                             /* the inverse of histT: a position on the line gives a year, never year 0 */
const chainClass = (l) => (l.kind === 'lineage' || CHAIN_LINEAGE.includes(l.type) ? 'descent' : 'contact');   /* a link says either that one tradition grew from another, or that two met */
const chainStr = (v) => (typeof v === 'string' ? v : Array.isArray(v) && typeof v[0] === 'string' ? v[0] : '');

/* the graph: traditions as nodes, and one edge for each pair that has any recorded connection, carrying every link between the two (the one with a cause row first, then the earliest).
   With `only` (a set of causes) a link counts only if its row names one of them, so a lineage link without a row is left out; with `kind` ("descent" or "contact") only links of that class count. */
function chainGraph(core, causes, only, kind) {
  const rows = new Map(); for (const r of (causes && Array.isArray(causes.rows) ? causes.rows : [])) if (r && typeof r.link_id === 'string' && Array.isArray(r.causes)) rows.set(r.link_id, r);
  const want = only instanceof Set && only.size ? only : null; const trad = new Map(); const edges = new Map(); const adj = new Map();
  for (const t of (core && Array.isArray(core.traditions) ? core.traditions : [])) if (t && typeof t.id === 'string') trad.set(t.id, t);
  const cls = kind === 'descent' || kind === 'contact' ? kind : ''; const said = new Set();
  const keep = (l) => (!cls || chainClass(l) === cls) && (!want || !!(l.row && l.row.causes.some((c) => c && want.has(c.cause))));
  const put = (l) => {
    const k = chainKey(l.src, l.tgt); let e = edges.get(k);
    if (!e) { e = { key: k, a: l.src < l.tgt ? l.src : l.tgt, b: l.src < l.tgt ? l.tgt : l.src, links: [] }; edges.set(k, e); for (const [x, y] of [[e.a, e.b], [e.b, e.a]]) { if (!adj.has(x)) adj.set(x, []); adj.get(x).push(y); } }
    e.links.push(l);
  };
  for (const r of (core && Array.isArray(core.interactions) ? core.interactions : [])) {
    if (!r || !trad.has(r.source_id) || !trad.has(r.target_id) || r.source_id === r.target_id) continue;
    if (CHAIN_LINEAGE.includes(r.type)) said.add(r.source_id + '>' + r.target_id);
    const l = { kind: 'interaction', id: r.id, src: r.source_id, tgt: r.target_id, type: r.type, y0: chainYear(r.year_start), y1: chainYear(r.year_end), label: r.date_label || '', iso: r.country_iso2 || '', lat: r.lat == null ? null : r.lat, lon: r.lon == null ? null : r.lon, note: r.note || '', row: rows.get(r.id) || null };
    if (keep(l)) put(l);
  }
  for (const t of trad.values()) {
    const p = t.parent_id; if (!p || p === t.id || !trad.has(p)) continue;
    if (said.has(p + '>' + t.id)) continue;
    const l = { kind: 'lineage', id: 'lineage:' + t.id, src: p, tgt: t.id, type: 'derive', y0: chainYear(t.start_year), y1: null, label: t.date_label || '', iso: '', lat: t.origin_lat == null ? null : t.origin_lat, lon: t.origin_lon == null ? null : t.origin_lon, note: '', row: rows.get('lineage:' + t.id) || null };
    if (keep(l)) put(l);
  }
  const yr = (l) => (l.y0 == null ? Infinity : l.y0);
  for (const e of edges.values()) e.links.sort((x, y) => (y.row ? 1 : 0) - (x.row ? 1 : 0) || yr(x) - yr(y) || (x.kind === y.kind ? 0 : x.kind === 'interaction' ? -1 : 1) || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));
  for (const l of adj.values()) l.sort();
  return { trad, edges, adj, rows, only: want, kind: cls };
}
const chainDegree = (g, id) => (g.adj.get(id) || []).length;
const chainEdge = (g, a, b) => g.edges.get(chainKey(a, b)) || null;

/* a link written as the Atlas writes its connections (the direction is the record's own: the sentence says who grew out of whom, or who influenced whom) */
const chainSentence = (ix, l) => atlSentence(ix, { source_id: l.src, target_id: l.tgt, type: l.type });

/* two traditions the Atlas's own parent links join: one is an ancestor of the other ("ancestor": a is above b; "descendant": a is below b), else "" */
function chainKin(traditions, a, b) {
  const by = new Map((Array.isArray(traditions) ? traditions : []).filter((t) => t && typeof t.id === 'string').map((t) => [t.id, t])); const up = (id) => { const out = []; let cur = by.get(id); while (cur && cur.parent_id && out.length < 80) { out.push(cur.parent_id); cur = by.get(cur.parent_id); } return out; };
  if (a === b || !by.has(a) || !by.has(b)) return ''; return up(b).includes(a) ? 'ancestor' : up(a).includes(b) ? 'descendant' : '';
}

/* how much a step has behind it: 2 if one of its links has a documented cause, 1 if one has any cause row, else 0 */
function chainEvidence(e) { let s = 0; for (const l of e.links) { if (!l.row) continue; s = Math.max(s, 1); if (l.row.causes.some((c) => c && c.status === 'documented')) return 2; } return s; }

/* the fewest steps from a to b, and every chain of that length (up to a count), best first.
   state: ok · same (a is b) · missing (not a tradition of the Atlas) · none (no recorded chain) */
function chainRoutes(g, a, b, max) {
  const lim = Math.max(1, Math.min(CHAIN_MAX.routes, Math.floor(max) || CHAIN_MAX.routes)); const out = (state, extra) => Object.assign({ state, dist: state === 'same' ? 0 : -1, routes: [], total: 0, capped: false }, extra || {});
  if (!g.trad.has(a) || !g.trad.has(b)) return out('missing');
  if (a === b) return out('same');
  const dist = new Map([[a, 0]]); let frontier = [a]; let hit = false;
  while (frontier.length && !hit) { const next = []; for (const u of frontier) for (const v of g.adj.get(u) || []) if (!dist.has(v)) { dist.set(v, dist.get(u) + 1); next.push(v); if (v === b) hit = true; } frontier = next; }
  if (!hit) return out('none');
  const paths = []; let capped = false;
  const back = (v, tail) => { if (capped) return; if (v === a) { paths.push([a].concat(tail)); if (paths.length >= CHAIN_MAX.found) capped = true; return; } for (const u of g.adj.get(v) || []) if (dist.get(u) === dist.get(v) - 1) back(u, [v].concat(tail)); };
  back(b, []);
  const score = (p) => { let s = 0; for (let i = 0; i + 1 < p.length; i++) s += chainEvidence(g.edges.get(chainKey(p[i], p[i + 1]))); return s; };
  const ranked = paths.map((nodes) => ({ nodes, score: score(nodes), name: nodes.join('\n') })).sort((x, y) => y.score - x.score || (x.name < y.name ? -1 : x.name > y.name ? 1 : 0));
  return { state: 'ok', dist: dist.get(b), routes: ranked.slice(0, lim).map((r) => ({ nodes: r.nodes, score: r.score })), total: paths.length, capped };
}

/* one chain laid out as steps: each joins two neighbours on the chain, with every link between them (the first is the one the card leads with).
   span is the first to the last year any step gives; ordered says whether the steps' own years never go back; withCause counts the steps that have a cause row */
function chainBuild(g, nodes) {
  if (!Array.isArray(nodes) || nodes.length < 2) return null; const steps = [];
  for (let i = 0; i + 1 < nodes.length; i++) { const e = chainEdge(g, nodes[i], nodes[i + 1]); if (!e || !e.links.length) return null; steps.push({ n: i + 1, from: nodes[i], to: nodes[i + 1], links: e.links, main: e.links[0] }); }
  const ys = []; for (const s of steps) for (const y of [s.main.y0, s.main.y1]) if (y != null) ys.push(y);
  let ordered = true; for (let i = 1; i < steps.length; i++) { const p = steps[i - 1].main.y0; const c = steps[i].main.y0; if (p != null && c != null && c < p) ordered = false; }
  return { nodes: nodes.slice(), steps, span: ys.length ? { from: Math.min(...ys), to: Math.max(...ys) } : null, ordered, withCause: steps.filter((s) => s.links.some((l) => l.row)).length };
}

/* the causes a step names, over all its links, each once (in the order the data gives) */
function chainCauses(step) { const seen = new Set(); const out = []; for (const l of step.links) if (l.row) for (const c of l.row.causes) if (c && !seen.has(c.cause)) { seen.add(c.cause); out.push(c.cause); } return out; }

/* a typed name → a tradition: its id, its exact name (case, accents and punctuation ignored), else the one name that begins with it, else the one that contains it; several → no answer and a few suggestions */
const chainNorm = (s) => [...String(s == null ? '' : s).slice(0, CHAIN_MAX.name).normalize('NFD')].filter((c) => { const k = c.codePointAt(0); return k < 0x300 || k > 0x36f; }).join('').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
function chainFind(traditions, text) {
  const raw = String(text == null ? '' : text).trim().slice(0, CHAIN_MAX.name); const q = chainNorm(raw); const list = (Array.isArray(traditions) ? traditions : []).filter((t) => t && typeof t.id === 'string' && typeof t.name === 'string');
  if (!q) return { id: '', options: [] };
  const byId = list.find((t) => t.id === raw); if (byId) return { id: byId.id, options: [] };
  const norm = list.map((t) => [t, chainNorm(t.name)]); const exact = norm.filter(([, n]) => n === q); if (exact.length === 1) return { id: exact[0][0].id, options: [] };
  const starts = norm.filter(([, n]) => n.startsWith(q)); const has = norm.filter(([, n]) => n.includes(q)); const pool = exact.length ? exact : starts.length ? starts : has;
  if (pool.length === 1) return { id: pool[0][0].id, options: [] };
  return { id: '', options: pool.sort((x, y) => x[1].length - y[1].length || (x[1] < y[1] ? -1 : x[1] > y[1] ? 1 : 0)).slice(0, 6).map(([t]) => t.id) };
}

/* the address: two traditions, which of the equally short chains, and the causes to follow (all by default; nothing is written when it is all the default) */
function chainState(query, ids, kinds) {
  const q = query && typeof query === 'object' && !Array.isArray(query) ? query : {}; const list = Array.isArray(kinds) ? kinds : [];
  const pick = (v) => { const s = chainStr(v).slice(0, CHAIN_MAX.name); return ids instanceof Set && ids.has(s) ? s : ''; };
  const kd = chainStr(q.k); const r = Number.parseInt(chainStr(q.r), 10); const c = []; for (const k of chainStr(q.c).slice(0, 400).split(',')) if (list.includes(k) && !c.includes(k)) c.push(k);
  c.sort((x, y) => list.indexOf(x) - list.indexOf(y));
  let a = pick(q.a); let b = pick(q.b); if (!a && b) { a = b; b = ''; }                         /* a second tradition on its own is a first */
  return { a, b, r: Number.isInteger(r) && r > 0 && r < CHAIN_MAX.routes ? r : 0, c, k: kd === 'descent' || kd === 'contact' ? kd : '' };
}
function chainQueryString(st) {
  const p = []; if (st.a) p.push('a=' + encodeURIComponent(st.a)); if (st.b) p.push('b=' + encodeURIComponent(st.b)); if (st.r) p.push('r=' + st.r); if (st.k) p.push('k=' + st.k); if (st.c && st.c.length) p.push('c=' + st.c.map(encodeURIComponent).join(','));
  return p.join('&');
}

/* what each cause carried: every connection that has a row, grouped by cause in the data's own order, oldest first (a connection with two causes is in both groups) */
function chainBrowse(ix, causes) {
  const meta = (causes && causes.meta && causes.meta.causes) || {}; const rows = (causes && Array.isArray(causes.rows)) ? causes.rows : []; const inter = new Map((ix && ix.core && Array.isArray(ix.core.interactions) ? ix.core.interactions : []).map((r) => [r.id, r]));
  const about = (id) => {
    if (inter.has(id)) { const r = inter.get(id); return { id, a: r.source_id, b: r.target_id, y0: chainYear(r.year_start), label: r.date_label || '', sentence: atlSentence(ix, r) }; }
    const t = id.startsWith('lineage:') && ix && ix.trad ? ix.trad[id.slice(8)] : null; if (!t || !t.parent_id || !ix.trad[t.parent_id]) return null;
    return { id, a: t.parent_id, b: t.id, y0: chainYear(t.start_year), label: t.date_label || '', sentence: atlSentence(ix, { source_id: t.parent_id, target_id: t.id, type: 'derive' }) };
  };
  const out = [];
  for (const kind of Object.keys(meta)) {
    const items = [];
    for (const row of rows) { const c = row.causes.find((x) => x && x.cause === kind); const r = c ? about(row.link_id) : null; if (!c || !r) continue; items.push(Object.assign(r, { status: c.status, note: c.note })); }
    items.sort((x, y) => (x.y0 == null ? Infinity : x.y0) - (y.y0 == null ? Infinity : y.y0) || (x.id < y.id ? -1 : 1));
    if (items.length) out.push({ cause: kind, label: meta[kind][0], text: meta[kind][1], items });
  }
  return out;
}

/* the world around a chain: the larger events of the history timeline (not the religion strand, which the steps already are) in the span of the chain and a margin either side */
function chainWindow(span) {
  if (!span) return null; const t0 = histT(span.from); const t1 = histT(span.to); const len = Math.max(1, t1 - t0); const pad = Math.max(CHAIN_WORLD.pad, Math.round(len * CHAIN_WORLD.window));
  const a = t0 - pad; const b = t1 + pad; return { from: chainYearOf(a), to: chainYearOf(b), t0: a, t1: b };
}
function chainWorld(events, win, max) {
  if (!win || !Array.isArray(events)) return []; const mid = (win.t0 + win.t1) / 2; const n = Math.max(1, Math.floor(max) || CHAIN_WORLD.max);
  const near = events.filter((e) => e && e.strand !== 'religion' && typeof e.year_start === 'number' && histT(e.year_start) <= win.t1 && histT(e.year_end == null ? e.year_start : e.year_end) >= win.t0);
  const len = win.t1 - win.t0; const dur = (e) => histT(e.year_end == null ? e.year_start : e.year_end) - histT(e.year_start); const short = near.filter((e) => dur(e) <= len * 4); const base = short.length >= 3 ? short : near;      /* an event that lasts far longer than the span is not what was happening “then” */
  const big = base.filter((e) => (e.importance || 0) >= CHAIN_WORLD.importance); const pool = big.length >= 4 ? big : base.filter((e) => (e.importance || 0) >= CHAIN_WORLD.importance - 1);
  return pool.sort((x, y) => (y.importance || 0) - (x.importance || 0) || Math.abs(histT(x.year_start) - mid) - Math.abs(histT(y.year_start) - mid) || (x.id < y.id ? -1 : 1)).slice(0, n).sort((x, y) => x.year_start - y.year_start || (x.id < y.id ? -1 : 1));
}
/* the strip: positions in percent along the window (so it fits any width), the steps as dots or short bars, the world's events as small ticks, and a few labelled years */
function chainStrip(chain, events) {
  const win = chain && chain.span ? chainWindow(chain.span) : null; if (!win) return null; const span = win.t1 - win.t0; const at = (y) => Math.max(0, Math.min(100, ((histT(y) - win.t0) / span) * 100));
  const steps = chain.steps.map((s) => (s.main.y0 == null ? null : { n: s.n, x: at(s.main.y0), w: s.main.y1 != null && s.main.y1 > s.main.y0 ? Math.max(0, at(s.main.y1) - at(s.main.y0)) : 0, y0: s.main.y0, y1: s.main.y1 })).filter(Boolean);
  const world = chainWorld(events, win, CHAIN_WORLD.max).map((e) => ({ id: e.id, x: at(e.year_start), y: e.year_start, label: e.label, date: e.date_label || '', strand: e.strand }));
  const tk = histTicks(win.from, win.to, 520 / span, 84); const ticks = tk.major.filter((m) => m.y >= win.from && m.y <= win.to).map((m) => ({ x: at(m.y), label: m.label }));
  return { from: win.from, to: win.to, steps, world, ticks };
}
if (typeof module !== 'undefined' && module.exports) module.exports = { CHAIN_MAX, CHAIN_LINEAGE, CHAIN_WORLD, CHAIN_EXAMPLES, chainKey, chainYear, chainYearOf, chainGraph, chainDegree, chainEdge, chainKin, chainClass, CHAIN_KINDS, chainEvidence, chainSentence, chainRoutes, chainBuild, chainCauses, chainNorm, chainFind, chainState, chainQueryString, chainBrowse, chainWindow, chainWorld, chainStrip };
