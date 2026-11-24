/* ═══════════════════════════ 2z · History with religion woven in: the pure parts ═══════════════════════════
   The maker's top priority for the Journey (18 November 2026): "visualize the timeline and understand the big picture of what was going on with mankind and what time it was and how that all played
   out and interacted, so people get a real picture of human history". One horizontal axis, one quiet row for each strand (religion, empires and states, trade and migration, science and technology,
   ideas and arts, disease and disaster, and, as a pilot of a later section, conflict), with the religious events of the Atlas drawn on the same line as the events of the world around them.

   The data model (tools/atlas_src/json/world_events.json, built by tools/build_atlas.py into atlas/world.js; the README, "World history", has it in full):
     event   { id, strand, label, year_start, year_end?, circa?, date_label, date_confidence (H M L C, as in the Atlas), status (documented | reported | disputed), places [{ name, lat, lon, country_iso2?, approx? }],
               summary (one to three plain sentences), sources [{ title, kind (primary | scholarly | dataset | reference), grade (A B C), url?, note? }], traditions [Atlas ids], texts [Library ids],
               importance 1 to 5, related [{ id, kind (part_of led_to carried shaped during compare ended), note? }], conflict? }
     conflict { parties [{ name }] (two or more), causes [{ kind (religious | political | economic | mixed), status, note }], casualties { low, high, unit, status, note } or null with casualty_note }
   The religion strand is not repeated in that file: it is the Atlas's own events (atlas/events.js), chosen by histReligion below, so the map, the tradition pages and this line tell one story.
   Everything here is a pure function (tests/history.test.js); the page is 6pw-history.js. */
const HIST_RANGE = { from: -3500, to: 1900 };                                     /* the pilot: 3500 BCE to 1900 CE */
const HIST_ZOOM = { min: 1, max: 120, step: 1.6 };                               /* the zoom is a multiple of the whole-span fit */
const HIST_KINDS = ['part_of', 'led_to', 'carried', 'shaped', 'during', 'compare', 'ended'];
const HIST_STATUSES = ['documented', 'reported', 'disputed'];
/* when atlas/world.js is not there (the data folder was built before the world’s events were added, or a copy lacks the file) the page still opens: the religion row alone, from the Atlas’s own events, and a plain
   sentence that says what is missing. The strand is the same one world_strands.json names. */
const HIST_NO_WORLD = { missing: true, meta: {}, strands: [{ id: 'religion', label: 'Religion', blurb: 'The beginnings of traditions, and the moments when states took up a faith. Drawn from the map data, so it is the same record as the map and the tradition pages.', source: 'atlas', order: 1 }], events: [] };

/* "c. 539–516 BCE", "610 CE", "c. 800 CE – 1100": a date or a window of years, in the Atlas's own style */
function histRangeLabel(ys, ye, circa) {
  const f = (y) => (y < 0 ? Math.abs(y) + ' BCE' : y < 1000 ? y + ' CE' : String(y)); const c = circa ? 'c. ' : ''; if (ye == null || ye === ys) return c + f(ys);
  if (ys < 0 && ye < 0) return c + Math.abs(ys) + '–' + f(ye); if (ys > 0 && ye > 0) return ye < 1000 ? c + ys + '–' + ye + ' CE' : ys >= 1000 ? c + ys + '–' + ye : c + ys + ' CE – ' + ye; return c + f(ys) + ' – ' + f(ye);
}
/* years are signed with no year 0 (1 BCE is -1, 1 CE is 1): the start of a year sits at t(y), so 1 BCE and 1 CE are one year apart, not two */
const histT = (y) => (y > 0 ? y - 1 : y);
function histYearLabel(y) { return y < 0 ? Math.abs(y) + ' BCE' : y < 1000 ? y + ' CE' : String(y); }
/* the place of a year on the line, in pixels, for a line that begins at year `from` and runs `ppy` pixels to the year */
const histX = (y, from, ppy) => (histT(y) - histT(from)) * ppy;
/* and back again: the year at a pixel (never year 0) */
function histYearAt(x, from, ppy) { const t = histT(from) + x / ppy; const y = Math.round(t); return y >= 0 ? y + 1 : y; }
/* pixels per year when the whole span fits `width` pixels, times the zoom */
const histPpy = (width, zoom) => (Math.max(120, width) / (histT(HIST_RANGE.to) - histT(HIST_RANGE.from))) * Math.min(HIST_ZOOM.max, Math.max(HIST_ZOOM.min, zoom || 1));

/* tick marks: a labelled mark at round years, spaced so the labels never touch (at least `gap` pixels apart), and small unlabelled marks between them when there is room */
function histTicks(y0, y1, ppy, gap) {
  const steps = [10, 25, 50, 100, 250, 500, 1000, 2000]; const step = steps.find((s) => s * ppy >= (gap || 70)) || 2000; const minor = step / 5;
  const mk = (st, label) => { const out = []; for (let m = Math.ceil(y0 / st) * st; m <= y1; m += st) { const y = m === 0 ? 1 : m; if (label || m % step) out.push({ y, label: label ? histYearLabel(y) : '' }); } return out; };
  return { step, major: mk(step, true), minor: minor * ppy >= 9 ? mk(minor, false) : [] };
}

/* lanes, by priority: the most important events are placed first, each in the first lane where it touches nothing already placed (with `gap` pixels between); one that fits in none of the
   `maxLanes` lanes is left out at this zoom, and comes back as the line is zoomed in and there is room. `boxes` are { x0, x1 } in pixels, `priority` a number for each box. Returns the lane of each
   box (-1 for one left out) and how many lanes are used, so a crowded row stays a few lines high instead of a wall of marks. */
function histPlace(boxes, priority, gap, maxLanes) {
  const g = gap == null ? 6 : gap; const cap = maxLanes || Infinity; const lanes = []; const lane = new Array(boxes.length).fill(-1);
  const order = boxes.map((b, i) => i).sort((a, b) => (priority[b] || 0) - (priority[a] || 0) || boxes[a].x0 - boxes[b].x0 || a - b);
  for (const i of order) { const b = boxes[i]; for (let l = 0; l < cap; l++) { const row = lanes[l] || (lanes[l] = []); if (row.every((j) => boxes[j].x1 + g <= b.x0 || b.x1 + g <= boxes[j].x0)) { row.push(i); lane[i] = l; break; } } }
  return { lane, lanes: Math.max(1, lanes.length) };
}
/* how important an event must be for its name to be written beside its mark at this zoom: only the largest at the whole span, everything when close */
function histLabelMin(ppy) { return ppy < 0.3 ? 5 : ppy < 0.6 ? 4 : ppy < 1.2 ? 3 : ppy < 2.5 ? 2 : 1; }

/* ── the religion strand, taken from the Atlas's own events ──
   The beginnings of traditions (importance 4 or 5), the moments a ruler or state took up a tradition (importance 4 or 5), and the endings recorded as major. `events` are the Atlas's, in its short keys
   (k kind, r ref, t tradition, ys, ye, l label, d date label, i importance, la, lo, c country). A moment that repeats a tradition in one year is shown once. */
function histReligion(events, range) {
  const r = range || HIST_RANGE; const out = []; const seen = new Set();
  for (const e of events || []) {
    if (!e || e.ys == null || e.ys < r.from || e.ys > r.to || !e.t) continue; const adopted = e.k === 'presence' && /adopted by a ruler or state/.test(e.l || '');
    const keep = (e.k === 'tradition_start' && e.i >= 4) || (adopted && e.i >= 4) || (e.k === 'tradition_end' && e.i >= 4); if (!keep) continue;
    const key = e.k + '|' + e.t + '|' + e.ys + '|' + (adopted ? e.l : ''); if (seen.has(key)) continue; seen.add(key);
    const m = /^(.*?)(?: \((.*?)\.?\))?\s*$/.exec(e.l || ''); const label = (m && m[1] ? m[1] : e.l || '').replace(/\.$/, ''); const detail = m && m[2] ? m[2].replace(/\.$/, '') : '';
    const importance = e.k === 'tradition_start' ? (e.i >= 5 ? 5 : 4) : adopted ? (e.i >= 5 ? 3 : 2) : 2;
    const start = e.k === 'tradition_start';      /* its two years are the scholars' window for the beginning (the Atlas fades a beginning in across it), so it is drawn as a point with a pale window, and dated as a window */
    out.push({ id: 'r-' + e.k + '-' + e.t + '-' + e.ys + (adopted ? '-' + out.length : ''), strand: 'religion', label, detail, kind: e.k, year_start: e.ys, year_end: !start && e.ye != null && e.ye > e.ys ? e.ye : null, window_end: start && e.ye != null && e.ye > e.ys ? e.ye : null,
      date_label: start ? histRangeLabel(e.ys, e.ye, /^c\./.test(e.d || '')) : e.d || histYearLabel(e.ys), importance, traditions: [e.t], lat: e.la == null ? null : e.la, lon: e.lo == null ? null : e.lo });
  }
  return out.sort((a, b) => a.year_start - b.year_start || b.importance - a.importance || a.id.localeCompare(b.id));
}
/* the whole line: the world's events (world.js) and the religious ones, in date order, each once. An event outside the pilot's span or of an unknown strand is left out rather than drawn wrong. */
function histMerge(world, atlasEvents, range) {
  const r = range || HIST_RANGE; const strands = new Set(((world && world.strands) || []).map((s) => s.id)); const seen = new Set(); const all = [];
  for (const e of (world && world.events) || []) { if (!e || seen.has(e.id) || !strands.has(e.strand) || e.strand === 'religion' || e.year_start < r.from || e.year_start > r.to) continue; seen.add(e.id); all.push(e); }
  for (const e of histReligion(atlasEvents, r)) if (strands.has('religion') && !seen.has(e.id)) { seen.add(e.id); all.push(e); }
  return all.sort((a, b) => a.year_start - b.year_start || b.importance - a.importance || (a.id < b.id ? -1 : 1));
}
const histById = (all) => { const m = Object.create(null); for (const e of all) m[e.id] = e; return m; };

/* what else was happening: from each other strand, the few events nearest in time that matter (those that overlap this one, or begin close to it; an event lasting centuries counts only if it begins
   nearby), so the answer is a picture across the strands and not one long list from the busiest. `opt.order` is the strands in their order, `opt.perStrand` how many from each (2). */
function histAround(all, ev, opt) {
  const o = opt || {}; const per = o.perStrand || 2; const min = o.minImportance || 3; const end = ev.year_end == null ? ev.year_start : ev.year_end; const pad = o.span || Math.max(30, Math.round((end - ev.year_start) / 2));
  const lo = ev.year_start - pad; const hi = end + pad; const last = (e) => (e.year_end == null ? e.year_start : e.year_end);
  const dist = (e) => (last(e) < ev.year_start ? ev.year_start - last(e) : e.year_start > end ? e.year_start - end : 0);
  const by = new Map(); (o.order || []).forEach((s) => by.set(s, []));
  for (const e of all) { if (e.id === ev.id || e.importance < min || (e.strand === ev.strand && !o.sameStrand) || (o.strands && !o.strands.has(e.strand)) || last(e) < lo || e.year_start > hi) continue; if (!(e.year_start >= lo || last(e) - e.year_start <= 400)) continue; if (!by.has(e.strand)) by.set(e.strand, []); by.get(e.strand).push(e); }
  const out = []; for (const list of by.values()) out.push(...list.sort((a, b) => dist(a) - dist(b) || b.importance - a.importance || a.year_start - b.year_start).slice(0, per).sort((a, b) => a.year_start - b.year_start));
  return out;
}
/* the links of one event, both ways: the ones it names (`out`) and the ones that name it (`in`) */
function histRelated(ev, byId, all) {
  const out = []; for (const r of ev.related || []) if (byId[r.id]) out.push({ dir: 'out', kind: r.kind, note: r.note || '', ev: byId[r.id] });
  for (const e of all) if (e !== ev) for (const r of e.related || []) if (r.id === ev.id) out.push({ dir: 'in', kind: r.kind, note: r.note || '', ev: e });
  return out;
}
/* counts for the strand buttons */
function histCounts(all) { const c = Object.create(null); for (const e of all) c[e.strand] = (c[e.strand] || 0) + 1; return c; }

/* ── one religion's events (#/history?t=<id>, which a religion's page opens from its “In its time, N more”): the events that name it, and, as the Conflicts page does (cnfTraditions), the events that name a tradition below it in
   the family tree, so “Christianity” finds an event that names Lutheranism. anc(id) gives the traditions above one (the page passes atlLineage without the tradition itself). ── */
function histNames(e, anc) {
  const up = typeof anc === 'function' ? anc : () => []; const out = new Set();
  for (const id of e && Array.isArray(e.traditions) ? e.traditions : []) { if (typeof id !== 'string') continue; out.add(id); for (const a of up(id) || []) out.add(a); }
  return out;
}
/* the events that name tradition `t` or one below it, in the order given; with no `t` the very same list comes back (nothing changes when no religion is chosen) */
const histForTradition = (list, t, anc) => (t ? list.filter((e) => histNames(e, anc).has(t)) : list);
/* the conflicts and settlements dated after the line's last year: the Conflicts page lists them, the line cannot draw them (SA-06). Oldest first. */
const histLate = (world) => ((world && Array.isArray(world.events) ? world.events : []).filter((e) => e && e.id && e.year_start > HIST_RANGE.to && e.conflict && ['war', 'sect', 'peace'].includes(e.conflict.kind)).sort((a, b) => a.year_start - b.year_start || (a.id < b.id ? -1 : 1)));

/* ── the address: where the line is, what is chosen, which strands are put away, the way of looking (line or list) and which religion's events are kept. Anything damaged is put right, never trusted. `tradIds` is the set of the
   Atlas's tradition ids; without it (or for an id it does not hold) no religion is chosen. ── */
function histState(q, ids, strandIds, tradIds) {
  const query = q && typeof q === 'object' ? q : {}; const num = (v, d) => (v != null && v !== '' && Number.isFinite(+v) ? +v : d);
  const y = Math.round(Math.min(HIST_RANGE.to, Math.max(HIST_RANGE.from, num(query.y, -300)))); const z = Math.min(HIST_ZOOM.max, Math.max(HIST_ZOOM.min, num(query.z, 1)));
  const ok = new Set(strandIds || []); const hidden = String(query.h || '').split(',').filter((s, i, a) => ok.has(s) && a.indexOf(s) === i);
  const sel = typeof query.s === 'string' && ids && ids.has(query.s) ? query.s : '';
  const t = typeof query.t === 'string' && tradIds && typeof tradIds.has === 'function' && tradIds.has(query.t) ? query.t : '';
  return { y: y === 0 ? 1 : y, z: Math.round(z * 100) / 100, sel, hidden, view: query.v === 'list' ? 'list' : 'line', t };
}
function histQueryString(st) { const q = new URLSearchParams(); if (st.z > 1) { q.set('z', String(st.z)); q.set('y', String(st.y)); } if (st.sel) q.set('s', st.sel); if (st.t) q.set('t', st.t); if (st.hidden.length) q.set('h', st.hidden.join(',')); if (st.view === 'list') q.set('v', 'list'); return q.toString(); }

/* the lines of the pilot that carry words of accusation or praise are caught by tests/history.test.js; this is the list that test uses and the page's own note names */
const HIST_LOADED = /\b(massacres?|genocides?|atrocit(?:y|ies)|terroris[mt]s?|fanatics?|barbarians?|savages?|primitive|heathens?|infidels?|cults?|evil|brutal(?:ly)?|tyrann(?:y|ical)|tyrants?|heroic|glorious|so-called|notorious|infamous)\b/i;
if (typeof module !== 'undefined' && module.exports) module.exports = { HIST_RANGE, HIST_ZOOM, HIST_KINDS, HIST_STATUSES, HIST_NO_WORLD, HIST_LOADED, histT, histYearLabel, histRangeLabel, histX, histYearAt, histPpy, histTicks, histPlace, histLabelMin, histReligion, histMerge, histById, histAround, histRelated, histCounts, histNames, histForTradition, histLate, histState, histQueryString };
