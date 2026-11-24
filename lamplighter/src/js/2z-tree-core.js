/* ═══════════════════════════ 2z · The family tree as a branch timeline: the pure parts ═══════════════════════════
   The maker asked for the family tree "as a visual mind map: branches, where each splits off and where it ends; zoom and pan" (BACKLOG D4, 18 November 2026). Each tradition is drawn as a horizontal
   line on the same year axis as the history timeline (2z-history-core.js: no year 0, the same zoom): it begins where it forks off its parent's line and ends where the Atlas says it ended, with an
   arrowhead if it is still going. So "where it splits off" and "where it ends" are what you see, and the line's own beginning and end can be uncertain, drawn as a pale stretch.
   The order is what keeps the drawing clean: a parent's children are placed below it with the LATEST fork nearest the parent and the earliest lowest, so the short vertical link from the parent to a
   child never crosses a line (every line between them begins to the right of the link). The Atlas records one parent for a tradition where scholars agree on one; the page says so, and lists the other
   relationships beside the chosen line instead of drawing them all. Everything here is a pure function (tests/tree.test.js); the page is 6zzb-tree.js. It needs 2z-history-core.js (the scale). */
const TREE_RANGE = { from: -3500, to: 2030 };                                       /* the line: 3500 BCE to a little past today; a tradition older than 3500 BCE runs in from the left edge */
const TREE_NOW = 2026;
const TREE_ENDS = ['all', 'living', 'ended'];
const TREE_VIEW = { z: 1.6, y: 300 };                                               /* it opens on about 1400 BCE to 2000 CE, where nearly all the branching is; “Whole span” zooms out to 3500 BCE */
const treePpy = (width, zoom) => (Math.max(160, width) / (histT(TREE_RANGE.to) - histT(TREE_RANGE.from))) * Math.min(HIST_ZOOM.max, Math.max(HIST_ZOOM.min, zoom || 1));

/* one tradition's line, given its parent's line.
   fork   where the line begins: its earliest recorded start, but never before its parent's line begins (the Atlas records a start as a window, and in three cases the earliest year of the child
          comes before the parent's: the windows overlap, so the line begins where they first do)
   solid  from here it is certainly there: the stretch between fork and solid is its window of uncertainty, drawn pale
   end    where it ends (null: still going); tail  the latest the end could be (a pale stretch beyond the end); handoff  its record says it gave way to a successor (status H)
   early  the child's own earliest year is before its parent's: the page says so, and does not call it a mistake */
function treeLine(t, parent) {
  const s0 = t.start_year; const s1 = t.start_year_latest != null ? Math.max(t.start_year_latest, s0) : s0; const floor = parent ? parent.fork : -Infinity; const fork = Math.max(s0, floor); const solid = Math.max(s1, fork);
  const e0 = t.end_year != null ? t.end_year : null; const e1 = t.end_year_latest != null && e0 != null ? Math.max(t.end_year_latest, e0) : e0; const living = t.status === 'L' && e0 == null;
  const end = living ? null : Math.max(e0 == null ? solid : e0, solid); const tail = !living && e1 != null && e1 > end ? e1 : null;
  return { fork, solid, end, tail, living, handoff: t.status === 'H', early: !!(parent && parent.start != null && s0 < parent.start), start: s0 };
}
/* the sentence that explains an `early` line, in the page's own words */
function treeEarlyNote(t, p) {
  const w = (x) => histRangeLabel(x.start_year, x.start_year_latest != null && x.start_year_latest > x.start_year ? x.start_year_latest : null, false);
  return `Its earliest recorded start (${histYearLabel(t.start_year)}) is earlier than that of its parent, ${p.name} (${histYearLabel(p.start_year)}). The map data records a start as a window, and the two windows overlap (${w(t)} and ${w(p)}), so the line begins where they first do. This is not a mistake in the data; it says the beginning is uncertain.`;
}

/* the trees of the Atlas: every tradition that has a recorded parent or branches, with its line, how many are below it, and how far its descendants reach.
   `traditions` is the Atlas's list (id, name, parent_id, start_year, start_year_latest, end_year, end_year_latest, status). A name that is not a real parent is a root; a chain that loops is cut. */
function treeBuild(traditions) {
  const by = Object.create(null); const kids = Object.create(null); const parentOf = Object.create(null);
  for (const t of traditions || []) if (t && typeof t.id === 'string' && Number.isFinite(t.start_year)) by[t.id] = t;
  for (const id in by) { const p = by[id].parent_id; if (p && p !== id && by[p]) { let q = p; let loop = false; for (let i = 0; i < 64 && q; i++) { if (q === id) { loop = true; break; } q = (by[q] || {}).parent_id; } if (!loop) { parentOf[id] = p; (kids[p] = kids[p] || []).push(id); } } }
  const line = Object.create(null); const depth = Object.create(null); const order = []; const allRoots = Object.keys(by).filter((id) => !parentOf[id]);
  const stack = allRoots.map((id) => [id, 0]).reverse();
  while (stack.length) { const [id, d] = stack.pop(); const pl = parentOf[id] ? line[parentOf[id]] : null; line[id] = treeLine(by[id], pl); depth[id] = d; order.push(id); for (const k of kids[id] || []) stack.push([k, d + 1]); }
  const size = Object.create(null); const reach = Object.create(null);
  for (let i = order.length - 1; i >= 0; i--) { const id = order[i]; const ks = kids[id] || []; size[id] = ks.reduce((n, k) => n + 1 + size[k], 0); reach[id] = Math.max(line[id].tail != null ? line[id].tail : line[id].end == null ? TREE_NOW : line[id].end, ...ks.map((k) => reach[k])); }
  for (const id in kids) kids[id].sort((a, b) => line[b].fork - line[a].fork || by[a].name.localeCompare(by[b].name) || (a < b ? -1 : 1));      /* the latest fork nearest the parent: no link ever crosses a line */
  const trees = allRoots.filter((id) => (kids[id] || []).length).sort((a, b) => size[b] - size[a] || line[a].fork - line[b].fork || by[a].name.localeCompare(by[b].name));
  const alone = allRoots.filter((id) => !(kids[id] || []).length).sort((a, b) => line[a].fork - line[b].fork || by[a].name.localeCompare(by[b].name));
  return { by, kids, parentOf, line, depth, size, reach, trees, alone };
}
/* the way to a tradition: its ancestors, the root first, and itself last */
function treeWay(model, id) { const out = []; let q = model.by[id] ? id : ''; for (let i = 0; i < 64 && q; i++) { out.unshift(q); q = model.parentOf[q]; } return out; }
/* everything below a tradition, depth first */
function treeBelow(model, id) { const out = []; const go = (x) => { for (const k of model.kids[x] || []) { out.push(k); go(k); } }; if (model.by[id]) go(id); return out; }

/* a filter over the whole tree: `pred(tradition)` says whether one matches. A tradition is shown if it matches or something below it does; and, while a filter is on, the way to every match is held open
   so the matches are not hidden. With no filter everything is shown and nothing is forced open. */
function treeFilter(model, pred) {
  if (!pred) return { has: null, force: null, hits: 0 };
  const has = new Set(); const force = new Set(); let hits = 0; const post = [];
  const walk = (id) => { post.push(id); for (const k of model.kids[id] || []) walk(k); };
  for (const r of model.trees) walk(r);
  for (let i = post.length - 1; i >= 0; i--) { const id = post[i]; const self = !!pred(model.by[id]); if (self) hits++; const below = (model.kids[id] || []).some((k) => has.has(k)); if (self || below) has.add(id); if (below) force.add(id); }
  return { has, force, hits, alone: model.alone.filter((id) => pred(model.by[id])) };
}

/* the rows and links of the chart for what is open: a row for each tradition shown, in the order a reader goes down the tree, and a link from each child to its parent at the year it forks.
   `st` = { open: Set of ids held open, has, force } (has and force from treeFilter). A closed tradition shows how many are below it and, faintly, how far they reach. */
function treeLayout(model, st) {
  const rows = []; const conns = []; const open = (st && st.open) || new Set(); const has = st && st.has; const force = st && st.force; const memo = Object.create(null);
  const shown = (id) => (model.kids[id] || []).filter((k) => !has || has.has(k));
  const below = (id) => { if (memo[id] === undefined) memo[id] = shown(id).reduce((n, k) => n + 1 + below(k), 0); return memo[id]; };
  const walk = (id, depth, parentRow) => {
    const ks = shown(id); const isOpen = ks.length > 0 && (open.has(id) || !!(force && force.has(id))); const L = model.line[id]; const row = rows.length;
    rows.push({ id, depth, row, parentRow, fork: L.fork, solid: L.solid, end: L.end, tail: L.tail, living: L.living, handoff: L.handoff, early: L.early, nKids: ks.length, nBelow: below(id), open: isOpen, reach: isOpen ? null : model.reach[id] });
    if (parentRow >= 0) conns.push({ id, x: L.fork, from: parentRow, to: row });
    if (isOpen) for (const k of ks) walk(k, depth + 1, row);
  };
  for (const r of model.trees) if (!has || has.has(r)) walk(r, 0, -1);
  return { rows, conns };
}

/* moving about the tree with the keyboard (the usual tree pattern): up and down go to the row above and below, right opens a closed branch and then goes into it, left closes an open branch and then goes
   to its parent, home and end go to the first and last row. Returns the row to focus and the set of open branches (a new set, the old one is not changed). */
function treeKey(rows, focusId, key, open) {
  const o = new Set(open || []); const i = Math.max(0, rows.findIndex((r) => r.id === focusId)); const r = rows[i]; if (!r) return { focus: '', open: o };
  if (key === 'ArrowDown') return { focus: (rows[i + 1] || r).id, open: o };
  if (key === 'ArrowUp') return { focus: (rows[i - 1] || r).id, open: o };
  if (key === 'Home') return { focus: rows[0].id, open: o };
  if (key === 'End') return { focus: rows[rows.length - 1].id, open: o };
  if (key === 'ArrowRight') { if (r.nKids && !r.open) { o.add(r.id); return { focus: r.id, open: o }; } if (r.nKids && r.open && rows[i + 1]) return { focus: rows[i + 1].id, open: o }; return { focus: r.id, open: o }; }
  if (key === 'ArrowLeft') { if (r.open) { o.delete(r.id); return { focus: r.id, open: o }; } if (r.parentRow >= 0 && rows[r.parentRow]) return { focus: rows[r.parentRow].id, open: o }; return { focus: r.id, open: o }; }
  return { focus: r.id, open: o };
}

/* ── the address: the tradition to open the way to (and mark), which branches are open, the filters, the zoom and centre, and the way of looking. Damaged or hostile input is put right. ── */
function treeState(q, ids, famIds, beliefIds) {
  const query = q && typeof q === 'object' ? q : {}; const num = (v, d) => (v != null && v !== '' && Number.isFinite(+v) ? +v : d); const str = (v) => (typeof v === 'string' ? v : '');
  const y = Math.round(Math.min(TREE_RANGE.to, Math.max(TREE_RANGE.from, num(query.y, TREE_VIEW.y)))); const z = Math.min(HIST_ZOOM.max, Math.max(HIST_ZOOM.min, num(query.z, TREE_VIEW.z)));
  const ok = (v, set) => (set && set.has && set.has(v) ? v : ''); const idset = ids && ids.has ? ids : new Set();
  const x = str(query.x).split(',').filter((s, i, a) => idset.has(s) && a.indexOf(s) === i).slice(0, 80);
  return { way: ok(str(query.open), idset), open: x, q: str(query.q).trim().slice(0, 80), b: ok(str(query.b), beliefIds ? new Set(beliefIds) : null), f: ok(str(query.f), famIds ? new Set(famIds) : null), e: TREE_ENDS.includes(query.e) ? query.e : 'all', z: Math.round(z * 100) / 100, y: y === 0 ? 1 : y, v: query.v === 'list' ? 'list' : 'line' };
}
function treeQueryString(st) { const q = new URLSearchParams(); if (st.way) q.set('open', st.way); if (st.open.length) q.set('x', st.open.join(',')); if (st.q) q.set('q', st.q); if (st.b) q.set('b', st.b); if (st.f) q.set('f', st.f); if (st.e !== 'all') q.set('e', st.e); if (st.z !== TREE_VIEW.z || st.y !== TREE_VIEW.y) { q.set('z', String(st.z)); q.set('y', String(st.y)); } if (st.v === 'list') q.set('v', 'list'); return q.toString(); }
if (typeof module !== 'undefined' && module.exports) module.exports = { TREE_RANGE, TREE_NOW, TREE_ENDS, TREE_VIEW, treePpy, treeLine, treeEarlyNote, treeBuild, treeWay, treeBelow, treeFilter, treeLayout, treeKey, treeState, treeQueryString };
