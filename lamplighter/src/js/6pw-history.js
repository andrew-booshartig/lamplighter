/* ═══════════════════════════ 6pw · History with religion woven in: the page ═══════════════════════════
   One horizontal line from 3500 BCE to 1900 CE, one quiet row for each strand, the religious events of the Atlas on the same line as the events of the world around them. A mark opens its entry beside
   the line: its date and how sure it is, where, what is documented, reported or disputed, its sources with their grades, the texts to read beside it, its links to other events and to the
   traditions, and what else was happening then. The strands can be put away, the line zoomed and scrolled, and the whole thing read as a plain dated list instead. The logic is in 2z-history-core.js
   and the data is built into atlas/world.js. The page registers itself as #/history; the place in the menu is the sections table's (2z-sections-core.js), which this file does not touch. */
const HIST_LAB = 132;       /* the width of the strand's name at the left of a row, which stays put as the line scrolls (narrower on a phone) */
const histLab = (w) => (w > 0 && w < 600 ? 84 : HIST_LAB);
const HIST_LANE = 30;       /* the height of one lane of marks and their names */
const histCap = (ppy, id) => (id === 'religion' ? 6 : ppy < 0.3 ? 5 : ppy < 0.8 ? 9 : 40);      /* how many lanes a row may use: the religion row stays at six (its long "adopted by a ruler or state" bars would make it a wall); the world's rows have few at the whole span (a calm poster of the largest events) and more as the line is zoomed in, because empires that overlap in time can only be drawn side by side in more lanes, never by zooming */
const histLabelW = (s) => Math.ceil(String(s).length * 6.3) + 8;      /* about how wide a name is at 11.5 pixels */
const histWorldOf = () => (typeof ATLD !== 'undefined' && ATLD.get('world')) || { meta: {}, strands: [], events: [] };

/* the marks and rows of the line for one zoom: which events are named, and which are placed in which lane. The most important are placed first; a crowded row shows fewer marks, never a wall of them. */
function histLayout(all, strands, hidden, ppy, selId) {
  const lmin = histLabelMin(ppy); const from = HIST_RANGE.from; const rows = [];
  for (const s of strands) {
    if (hidden.includes(s.id)) continue; const evs = all.filter((e) => e.strand === s.id);
    const boxes = evs.map((e) => { const x0 = histX(e.year_start, from, ppy); const xe = e.year_end != null ? histX(Math.min(e.year_end, HIST_RANGE.to), from, ppy) : e.window_end != null ? histX(e.window_end, from, ppy) : x0; const lab = e.importance >= lmin || e.id === selId; return { x0, xe, lab, x1: Math.max(xe + 4, x0 + 12, lab ? x0 + histLabelW(e.label) : 0) }; });
    const pk = histPlace(boxes, evs.map((e) => (e.id === selId ? 99 : e.importance)), 8, histCap(ppy, s.id)); rows.push({ s, evs, boxes, lane: pk.lane, lanes: pk.lanes, drawn: pk.lane.filter((l) => l >= 0).length });
  }
  return rows;
}
function histMarkHTML(e, b, lane, selId) {
  const span = e.year_end != null && b.xe - b.x0 >= 8; const win = !span && e.window_end != null && b.xe - b.x0 >= 8; const w = span || win ? Math.round(b.xe - b.x0) : 9; const name = `${e.label}, ${e.date_label}`;
  return `<button type="button" class="hx-mk ${span ? 'hx-span' : 'hx-pt'}${win ? ' hx-win' : ''}${e.strand === 'religion' ? ' hx-rel' : ''}${b.lab ? ' hx-l' : ''}" data-id="${esc(e.id)}" style="left:${b.x0.toFixed(1)}px;top:${lane * HIST_LANE + 6}px;width:${w}px" aria-label="${esc(name)}" title="${esc(name)}" aria-pressed="${e.id === selId ? 'true' : 'false'}"><i class="hx-sh"></i>${win ? '<i class="hx-wb"></i>' : ''}<span class="hx-lb">${esc(e.label)}</span></button>`;
}
/* the whole line as HTML: the axis, the eras, faint lines at the round years, and a row for each strand that is showing */
function histChartHTML(all, world, st, ppy, eras, lab0) {
  const lab = lab0 || HIST_LAB;
  const from = HIST_RANGE.from; const to = HIST_RANGE.to; const span = (histT(to) - histT(from)) * ppy; const rows = histLayout(all, world.strands || [], st.hidden, ppy, st.sel); const tk = histTicks(from, to, ppy, 76);
  const counts = histCounts(all); const bands = (eras || []).filter((b) => b.end > from && b.start < to).map((b) => { const x0 = histX(Math.max(b.start, from), from, ppy); const x1 = histX(Math.min(b.end, to), from, ppy); return `<span class="hx-era" style="left:${x0.toFixed(1)}px;width:${Math.max(0, x1 - x0).toFixed(1)}px" title="${esc(b.label + ': ' + b.blurb)}"><i>${esc(b.label)}</i></span>`; }).join('');
  const axis = tk.minor.concat(tk.major).map((t) => `<span class="hx-tk${t.label ? '' : ' hx-mn'}" style="left:${histX(t.y, from, ppy).toFixed(1)}px"><i></i>${t.label ? `<b>${esc(t.label)}</b>` : ''}</span>`).join('');
  const grid = tk.major.map((t) => `<i class="hx-gl" style="left:${(lab + histX(t.y, from, ppy)).toFixed(1)}px"></i>`).join('');
  const body = rows.map((r) => `<section class="hx-row" data-strand="${esc(r.s.id)}" aria-label="${esc(r.s.label)}" style="height:${r.lanes * HIST_LANE + 14}px"><div class="hx-rl" style="width:${lab}px"><b>${esc(r.s.label)}</b><span class="small muted">${r.drawn < r.evs.length ? r.drawn + ' of ' + r.evs.length : r.evs.length}${r.s.pilot ? ' · pilot' : ''}</span></div><div class="hx-lane">${r.evs.map((e, i) => (r.lane[i] < 0 ? '' : histMarkHTML(e, r.boxes[i], r.lane[i], st.sel))).join('')}</div></section>`).join('');
  const reach = all.reduce((m, e) => Math.max(m, histX(e.year_start, from, ppy) + histLabelW(e.label)), 0);      /* the line is as long as its last name, so nothing is cut off at the right */
  return `<div class="hx-canvas" style="width:${Math.ceil(lab + Math.max(span, reach) + 16)}px"><div class="hx-axis" aria-hidden="true"><div class="hx-axl" style="margin-left:${lab}px">${axis}</div></div><div class="hx-eras" aria-hidden="true" style="margin-left:${lab}px">${bands}</div><div class="hx-grid" aria-hidden="true">${grid}</div>${body || '<p class="hx-none t2">Every strand is put away. Choose one above.</p>'}</div>`;
}
/* the same events as a plain list in date order, for a phone, a screen reader, or anyone who likes lists */
function histListHTML(all, world, st) {
  const sb = Object.fromEntries((world.strands || []).map((s) => [s.id, s])); const shown = all.filter((e) => !st.hidden.includes(e.strand) && (e.strand !== 'religion' || e.importance >= 4 || e.id === st.sel));
  return `<ol class="hx-ol plain">${shown.map((e) => `<li><button type="button" class="hx-li" data-id="${esc(e.id)}" aria-pressed="${e.id === st.sel ? 'true' : 'false'}"><span class="hx-lw"><b>${esc(e.date_label)}</b></span><span class="hx-lt"><span class="tag">${esc((sb[e.strand] || {}).label || e.strand)}</span> ${esc(e.label)}</span></button></li>`).join('')}</ol>${all.length > shown.length ? `<p class="small muted">The list leaves out the smaller religious moments (the map data has them all); the line shows them when you zoom in.</p>` : ''}`;
}
/* a text of the Library named by an event: the same way in, or the same plain sentence, as everywhere else (atlReadBtn) */
function histTextRow(id) {
  const l = typeof LIB_BY_ID !== 'undefined' ? LIB_BY_ID[id] : null; if (!l) return '';
  return `<li><div><b>${esc(l.title)}</b></div><span class="row tight">${typeof atlReadBtn === 'function' ? atlReadBtn({ title: l.title, lib: id }, { quiet: true }) : ''}</span></li>`;
}
const histSrcKind = { primary: 'A record from the time', scholarly: 'A scholarly work', dataset: 'A research database', reference: 'A reference summary' };
/* a note of the data's own (tools/atlas_src/json/world_meta.json), with its pointer to the feedback box in Setup made a link (UX-17: a visitor to a single-file app cannot edit a developer's file) */
const HIST_REPORT = 'Setup, then Tell the maker what to change';
const histNoteHTML = (s) => esc(s).replace(HIST_REPORT, `<a href="#/setup?fb=1">${HIST_REPORT}</a>`);
function histSourcesHTML(e, meta) {
  const g = (meta && meta.grades) || {}; if (!(e.sources || []).length) return '';
  return `<div class="hx-sec"><h4>Sources</h4><ol class="plain hx-src">${e.sources.map((s) => `<li><span class="tag hx-grade" title="${esc((g[s.grade] || [''])[0] + (g[s.grade] ? ': ' + g[s.grade][1] : ''))}">${esc(s.grade)}</span> ${s.url ? ext(s.url, esc(s.title)) : esc(s.title)}${s.note ? ` <span class="small muted">${esc(s.note)}</span>` : ''}<div class="small muted">${esc(histSrcKind[s.kind] || s.kind)}</div></li>`).join('')}</ol>${(meta && meta.review === 'unchecked') || e.review === 'unchecked' ? `<p class="hint">${histNoteHTML((meta && meta.review_note) || 'The sources are named but not yet re-read against this entry.')}</p>` : ''}</div>`;
}
function histConflictHTML(e, meta) {
  const c = e.conflict; if (!c) return ''; const st = (meta && meta.statuses) || {}; const ck = (meta && meta.causes) || {};
  const cs = c.casualties ? `<p><b>${esc(Number(c.casualties.low).toLocaleString('en-US'))} to ${esc(Number(c.casualties.high).toLocaleString('en-US'))}</b> ${esc(c.casualties.unit)} <span class="tag">${esc((st[c.casualties.status] || [c.casualties.status])[0])}</span><span class="small muted"> ${esc(c.casualties.note || '')}</span></p>` : `<p class="t2">No range is given. ${esc(c.casualty_note || '')}</p>`;
  return `<div class="hx-sec hx-conf"><h4>Parties</h4><ul class="plain">${c.parties.map((p) => `<li>${esc(p.name)}</li>`).join('')}</ul><h4>Causes, and how well each is documented</h4>${meta && meta.cause_note ? `<p class="hint">${esc(meta.cause_note)}</p>` : ''}<ul class="plain hx-causes">${c.causes.map((x) => `<li><span class="tag" title="${esc(ck[x.kind] || '')}">${esc(x.kind)}</span> <span class="tag">${esc((st[x.status] || [x.status])[0])}</span> ${esc(x.note)}</li>`).join('')}</ul><h4>The dead</h4>${cs}${c.kind ? `<p class="small cnf-full"><a href="#/conflicts/${esc(e.id)}">The full entry, with what each side said and its sources, on the Conflicts page</a></p>` : ''}</div>`;
}
/* the entry of one event, beside the line */
function histPanelHTML(e, ctx) {
  const { world, all, byId, ix, st } = ctx; const meta = world.meta || {}; const strand = (world.strands || []).find((s) => s.id === e.strand) || { label: e.strand }; const sts = meta.statuses || {}; const conf = (meta.confidence || {})[e.date_confidence] || '';
  const rel = histRelated(e, byId, all).filter((r) => r.ev); const rk = meta.relations || {};
  const around = histAround(all, e, { order: (world.strands || []).map((s) => s.id) }); const strandOf = (id) => (world.strands || []).find((s) => s.id === id) || { label: id }; const grouped = []; around.forEach((x) => { const g = grouped[grouped.length - 1]; if (g && g.id === x.strand) g.list.push(x); else grouped.push({ id: x.strand, list: [x] }); }); const trads = (e.traditions || []).filter((t) => ix && ix.trad[t]);
  const ysnap = typeof atlSnap === 'function' ? atlSnap(e.year_start) : e.year_start;
  const isRel = e.strand === 'religion'; const tr = isRel && trads.length ? ix.trad[trads[0]] : null;
  const where = (e.places || []).map((p) => p.name).join(' · ');
  const li = (x) => `<li><button type="button" class="hx-li hx-sm" data-id="${esc(x.id)}"><span class="hx-lw"><b>${esc(x.date_label)}</b></span><span class="hx-lt">${esc(x.label)}</span></button></li>`;
  return `<div class="hx-ph"><span class="tag hx-strand">${esc(strand.label)}</span>${e.status ? `<span class="tag hx-status st-${esc(e.status)}" title="${esc((sts[e.status] || ['', ''])[1])}">${esc((sts[e.status] || [e.status])[0])}</span>` : ''}<button type="button" class="btn sm ghost hx-x" data-hx-clear aria-label="Close this entry">${icon('x')}</button></div>
    <h2 class="hx-h" id="hxTitle" tabindex="-1">${esc(e.label)}</h2>
    <div class="hx-when"><b>${esc(e.date_label)}</b>${conf ? ` <span class="muted small">${esc(conf)}</span>` : ''}</div>${where ? `<div class="small t2">${esc(where)}</div>` : ''}
    ${isRel ? `<p class="hx-sum">${esc(e.detail ? e.detail + '. ' : '')}${tr ? esc(tr.summary || '') : ''}</p>` : `<p class="hx-sum">${esc(e.summary)}</p>`}
    ${isRel ? '<p class="hint">From the map data. Its dates are scholars’ estimates, with their uncertainty, on the tradition’s page.</p>' : ''}
    ${histConflictHTML(e, meta)}
    ${(e.texts || []).length ? `<div class="hx-sec"><h4>Texts to read beside this</h4><ul class="plain hx-texts">${e.texts.map(histTextRow).join('')}</ul></div>` : ''}
    <div class="hx-sec hx-go row tight">${trads.map((t) => `<a class="btn sm${isRel ? ' primary' : ''}" href="#/atlas/tradition/${esc(t)}">${esc(ix.trad[t].name)}</a>`).join('')}<a class="btn sm ghost" href="#/atlas?y=${ysnap}${trads[0] ? '&sel=' + esc(trads[0]) : ''}">The religions on the map in ${esc(histYearLabel(e.year_start))}</a>${isRel && trads[0] ? `<a class="btn sm ghost" href="#/atlas/texts?t=${esc(trads[0])}">Its texts in the catalogue</a>` : ''}</div>
    ${rel.length ? `<div class="hx-sec"><h4>Connected</h4><ul class="plain hx-rel">${rel.map((r) => `<li><span class="muted">${esc((rk[r.kind] || [r.kind, r.kind])[r.dir === 'out' ? 0 : 1])}</span> <button type="button" class="hx-lk" data-id="${esc(r.ev.id)}">${esc(r.ev.label)}</button> <span class="small muted">${esc(r.ev.date_label)}</span>${r.note ? `<div class="small t2">${esc(r.note)}</div>` : ''}</li>`).join('')}</ul></div>` : ''}
    ${grouped.length ? `<div class="hx-sec"><h4>What else was happening</h4>${grouped.map((g) => `<h5 class="hx-gh">${esc(strandOf(g.id).label)}</h5><ol class="plain hx-ol">${g.list.map(li).join('')}</ol>`).join('')}</div>` : ''}
    ${histSourcesHTML(e, meta)}
    ${typeof relatedBox === 'function' ? relatedBox('event', e.id, isRel ? { skip: ['traditions'], has: ['#/atlas?y=' + ysnap], trad: trads[0], year: e.year_start } : { skip: ['traditions', 'read', 'conflicts'], has: ['#/atlas?y=' + ysnap] }) : ''}`;      /* the Related strip is the last block of an entry; it leaves out what the entry draws itself: the religion buttons, “Texts to read beside this”, the link to a conflict's full entry and, above, its own button to the map at that year (the strip's “On the map” address, FA-05), so a strip is drawn only for what the entry lacks. An event of the religion row (L-05 of FINAL_AUDIT.md) is not in the world's file: it says which religion it concerns and its year (trad, year), the same core builds its strip, and the page skips only the religion button it draws itself, so the texts the records tie to that religion and the wars that name it are what the strip adds */
}
/* the one quiet chip that says which religion's events the line keeps and takes the choice away (#/history?t=<id>, which a religion's page opens from “In its time, N more”). The events kept are those that name the religion
   or one below it in the family tree, as on the Conflicts page, and the words say so. */
function histTChipHTML(name, kin) {
  const what = `Events that name ${name}${kin ? ' or a branch of it' : ''}`;
  return `<button type="button" class="hx-chip hx-tchip" data-hx-tclear aria-label="${esc(what + '. Press to show every event again.')}">${esc(what)}${icon('x')}</button>`;
}
/* one line under the strand chips: the line stops at 1900, and the conflicts and settlements after it are on the Conflicts page (SA-06); nothing when there are none */
function histStopHTML(late) {
  if (!late || !late.length) return '';
  return `<p class="small t2 hx-stop">The timeline stops at ${esc(histYearLabel(HIST_RANGE.to))}. Later conflicts and settlements are on the <a href="#/conflicts?o=new">Conflicts and peace</a> page.</p>`;
}
/* what the panel says before anything is chosen (FINAL_AUDIT.md FA-02, 22 November 2026): the count once, in one sentence (all the events, how many are of the world and how many of religion), what a line is, the three-way key, and one quiet note;
   the history of who has read what is on Methods and standards and is linked once from here, so this panel no longer prints the data's review note (the entry of one event still does, under its sources) or any word of the work's own */
function histIntroHTML(world, all) {
  const meta = world.meta || {}; const sts = meta.statuses || {}; const n = all.filter((e) => e.strand !== 'religion').length; const rel = all.length - n;
  const lead = world.missing ? 'Choose an event to read it. The line shown is religion, taken from the map data: the beginnings of traditions and the moments a state took up a faith. The events of the wider world are not in this copy yet: the file atlas/world.js was not found next to Lamplighter.html, so the other lines are missing.'
    : `${all.length} events are on this timeline: ${n} of the world, written here, and ${rel} of religion, from the map data. Each line is one kind of event; the top line is religion, so you can read what was happening in the world around each faith as it began and spread.`;
  const note = (meta.selection_note ? esc(meta.selection_note) + ' ' : '') + `See <a href="#/methods/labels">How far each part has been read</a>. Found a mistake? <a href="#/setup?fb=1">${HIST_REPORT}</a>.`;
  return `<h2 class="hx-h">Choose an event</h2><p class="hx-sum">${esc(lead)}</p>
    ${Object.keys(sts).length ? `<div class="hx-sec"><h4>How sure is it?</h4><ul class="plain hx-causes">${Object.entries(sts).map(([k, v]) => `<li><span class="tag hx-status st-${esc(k)}">${esc(v[0])}</span> ${esc(v[1])}</li>`).join('')}</ul></div>` : ''}
    ${world.missing ? '' : `<p class="hint">${note}</p>`}`;
}

/* ── the page ── */
Pages.history = {
  async mount(root, parts, query) {
    const loc = typeof secLocate === 'function' ? secLocate('history') : null;
    root.innerHTML = `${loc ? secHeadHTML(loc, { compact: true }) : '<div class="page-head fade-in"><div><h1>History, with religion woven in</h1><p>What was happening in the world while each faith began and spread: empires, trade, ideas, plagues and wars on one line of time, with the religion from the map data on top.</p></div></div>'}${loc ? secNavHTML(loc, {}) : ''}<div id="hxbody"><div class="card"><p class="t2" id="hxLoad">Opening the timeline…</p></div></div>`;
    const body = root.querySelector('#hxbody'); let ix; let world;
    try { [world] = await Promise.all([ATLD.need('world').then(() => ATLD.get('world'), () => null), ATLD.need('events'), TXT.index()]); ix = await ATLD.open(); } catch (e) { body.innerHTML = `<div class="card"><div class="callout warn">${icon('warn')}<div>The timeline’s data was not found. It lives in the <b>atlas</b> folder next to <b>Lamplighter.html</b> (the same place as the map).</div></div></div>`; return; }
    if (!root.isConnected) return;
    if (!world || !Array.isArray(world.strands) || !Array.isArray(world.events)) world = HIST_NO_WORLD;                 /* no world.js: the religion row alone, and the page says so */
    const strands = world.strands || []; const eras = (ix.cfg && ix.cfg.eras && ix.cfg.eras.bands) || [];
    const all = histMerge(world, ATLD.get('events') || []); const byId = histById(all);
    /* SA-06: the line's window ends in 1900, so an address that names a conflict or settlement after it (22 of them, 1905 to 2005) opens that entry's own page, not an empty panel; the address is replaced, so Back does not return here */
    const late = histLate(world); const lateHit = query && typeof query.s === 'string' ? late.find((e) => e.id === query.s) : null;
    if (lateHit) { location.replace('#/conflicts/' + encodeURIComponent(lateHit.id)); return; }
    const tradIds = new Set(Object.keys((ix && ix.trad) || {})); const anc = (t) => (typeof atlLineage === 'function' ? atlLineage(ix, t).slice(1) : []);
    const st = histState(query, new Set(all.map((e) => e.id)), strands.map((s) => s.id), tradIds);
    /* a religion's events (t): the events that name it or one below it; the whole list when none is chosen. The chip names the choice and takes it away; the strand counts, the line, the list and “In view” all follow it. */
    let vis = null; let visT = ''; const shown = () => { if (!st.t) return all; if (!vis || visT !== st.t) { vis = histForTradition(all, st.t, anc); visT = st.t; } return vis; };
    const tName = () => (ix.trad[st.t] || {}).name || st.t; const tChip = () => histTChipHTML(tName(), !!(ix.kids && (ix.kids[st.t] || []).length));
    const counts = histCounts(shown());
    /* on a phone the marks of the line are 9 px wide, too small for a finger (UX-11), so the page opens on its list; Line is one tap away, and the address remembers a choice of Line (v=line) */
    const phone = typeof matchMedia === 'function' && matchMedia('(max-width: 760px)').matches; if (phone && !(query && (query.v === 'line' || query.v === 'list'))) st.view = 'list';
    body.innerHTML = `<div class="hx">
      <div class="hx-bar"><div class="hx-strands" role="group" aria-label="Strands: choose which rows to show">${strands.map((s) => `<button type="button" class="hx-chip" data-strand="${esc(s.id)}" aria-pressed="${!st.hidden.includes(s.id)}" title="${esc(s.blurb)}"><i class="hx-sw hx-sw-${esc(s.id)}"></i>${esc(s.label)} <span class="muted hx-n">${counts[s.id] || 0}</span></button>`).join('')}</div>
        <div class="hx-tools"><div class="hx-seg" role="group" aria-label="Way of looking"><button type="button" class="hx-chip" data-view="line" aria-pressed="${st.view === 'line'}">Line</button><button type="button" class="hx-chip" data-view="list" aria-pressed="${st.view === 'list'}">List</button></div>
          <div class="hx-zoom" role="group" aria-label="Zoom"><button type="button" class="btn sm ghost" data-zoom="out" aria-label="Zoom out">−</button><button type="button" class="btn sm ghost" data-zoom="in" aria-label="Zoom in">+</button><button type="button" class="btn sm ghost" data-zoom="all">Whole span</button><select class="select hx-era-sel" id="hxEra" aria-label="Go to an era"><option value="">Go to…</option>${eras.filter((b) => b.end > HIST_RANGE.from && b.start < HIST_RANGE.to).map((b) => `<option value="${esc(b.id)}">${esc(b.label)}</option>`).join('')}</select></div></div></div>
      <div class="hx-filt" id="hxFilt"${st.t ? '' : ' hidden'}>${st.t ? tChip() : ''}</div>${histStopHTML(late)}
      <div class="hx-in small t2" id="hxIn"></div>
      <div class="hx-main"><div class="hx-left"><div class="hx-chart" id="hxChart" tabindex="0" role="region" aria-label="Timeline from 3500 BCE to 1900 CE. It scrolls sideways; plus and minus zoom. Each mark opens its entry. A list of the same events is under “List”."></div><div class="hx-listwrap" id="hxList" hidden></div></div>
        <aside class="hx-panel" id="hxPanel" aria-label="Entry"></aside></div><div class="sr-only-live" id="hxLive" aria-live="polite"></div></div>`;
    const chart = body.querySelector('#hxChart'); const panel = body.querySelector('#hxPanel'); const listEl = body.querySelector('#hxList'); const inEl = body.querySelector('#hxIn'); const live = body.querySelector('#hxLive'); const hx = body.querySelector('.hx'); const filt = body.querySelector('#hxFilt');
    let alive = true; const cleanups = []; const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); cleanups.push(() => t.removeEventListener(ev, fn, o)); }; let timer = 0; let urlTimer = 0; let ro = null;
    const lab = () => histLab(chart.clientWidth); const laneW = () => Math.max(260, chart.clientWidth - lab()); const ppy = () => histPpy(laneW(), st.z); const calm = () => typeof prefersReducedMotion === 'function' && prefersReducedMotion();
    const centreYear = () => histYearAt(chart.scrollLeft + laneW() / 2, HIST_RANGE.from, ppy());
    const urlSync = () => { try { let q = histQueryString(st); if (phone && st.view === 'line') q += (q ? '&' : '') + 'v=line'; history.replaceState(null, '', '#/history' + (q ? '?' + q : '')); } catch (e) { /* file:// in some browsers */ } };
    const urlSoon = () => { clearTimeout(urlTimer); urlTimer = setTimeout(urlSync, 150); };
    const showIn = () => { const w = laneW(); const a = histYearAt(chart.scrollLeft, HIST_RANGE.from, ppy()); const b = histYearAt(chart.scrollLeft + w, HIST_RANGE.from, ppy()); const n = shown().filter((e) => !st.hidden.includes(e.strand) && (e.year_end == null ? e.year_start : e.year_end) >= a && e.year_start <= b).length; const drawn = chart.querySelectorAll('.hx-mk').length; const left = shown().filter((e) => !st.hidden.includes(e.strand)).length - drawn; inEl.textContent = `In view: ${histYearLabel(Math.max(a, HIST_RANGE.from))} to ${histYearLabel(Math.min(b, HIST_RANGE.to))} · ${n} event${n === 1 ? '' : 's'}${left > 0 && st.view === 'line' ? ` · ${left} more appear as you zoom in` : ''}`; };
    const scrollToYear = (y, smooth) => { const left = st.z <= 1.001 ? 0 : Math.max(0, histX(y, HIST_RANGE.from, ppy()) - laneW() / 2); if (smooth && !calm() && chart.scrollTo) chart.scrollTo({ left, behavior: 'smooth' }); else chart.scrollLeft = left; };
    const drawPanel = () => { const e = st.sel ? byId[st.sel] : null; panel.innerHTML = e ? histPanelHTML(e, { world, all, byId, ix, st }) : histIntroHTML(world, all); panel.classList.toggle('open', !!e); };
    const noneHTML = () => `<p class="hx-none t2">No event on the timeline names ${esc(tName())} yet.</p>`;
    const drawList = () => { listEl.innerHTML = st.t && !shown().length ? noneHTML() : histListHTML(shown(), world, st); };
    const drawChart = (keepYear) => { const y = keepYear != null ? keepYear : st.y; const f = document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('hx-mk') ? document.activeElement.dataset.id : ''; chart.innerHTML = st.t && !shown().length ? noneHTML() : histChartHTML(shown(), world, st.t ? Object.assign({}, st, { hidden: st.hidden.concat(strands.map((s) => s.id).filter((id) => !shown().some((e) => e.strand === id))) }) : st, ppy(), eras, lab()); scrollToYear(y, false); showIn(); if (f) { const m = markOf(f); (m || chart).focus({ preventScroll: true }); } };      /* the mark that had the focus keeps it across a zoom (or the line itself does if that mark is not drawn at this zoom) */
    const view = () => { const list = st.view === 'list'; chart.hidden = list; listEl.hidden = !list; if (list) drawList(); else drawChart(); $$('[data-view]', hx).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === st.view))); };
    const markOf = (id) => chart.querySelector('.hx-mk[data-id="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]');
    const refreshCounts = () => { const c = histCounts(shown()); hx.querySelectorAll('.hx-strands .hx-chip').forEach((b) => { const n = b.querySelector('.hx-n'); if (n) n.textContent = String(c[b.dataset.strand] || 0); }); };
    const clearT = (year) => { if (!st.t) return; st.t = ''; vis = null; visT = ''; filt.hidden = true; filt.innerHTML = ''; refreshCounts(); if (st.view === 'line') drawChart(year != null ? year : st.y); else drawList(); };      /* the religion's choice goes; the rest of the state (zoom, year, strands, way of looking, the chosen event) stays as it was */
    const select = (id, o) => {
      o = o || {}; const e = id ? byId[id] : null; st.sel = e ? e.id : '';
      if (e && st.hidden.includes(e.strand)) { st.hidden = st.hidden.filter((x) => x !== e.strand); $$('[data-strand]', hx).forEach((b) => b.setAttribute('aria-pressed', String(!st.hidden.includes(b.dataset.strand)))); if (st.view === 'line') drawChart(e.year_start); }
      if (e && st.t && !shown().includes(e)) clearT(e.year_start);      /* choosing an event the religion's filter leaves out (a link in the panel) takes the filter away, as it puts a strand back, so the chosen event is always on the line */
      drawPanel(); $$('.hx-mk[aria-pressed="true"],.hx-li[aria-pressed="true"]', hx).forEach((b) => b.setAttribute('aria-pressed', 'false'));
      if (e) { const m = markOf(e.id); if (m) { m.setAttribute('aria-pressed', 'true'); if (o.scroll) { const x = lab() + histX(e.year_start, HIST_RANGE.from, ppy()); if (x < chart.scrollLeft + lab() || x > chart.scrollLeft + chart.clientWidth - 80) scrollToYear(e.year_start, true); } } $$('.hx-li[data-id="' + e.id + '"]', listEl).forEach((b) => b.setAttribute('aria-pressed', 'true')); live.textContent = `${e.label}, ${e.date_label}`; if (o.focusPanel) { const h = panel.querySelector('#hxTitle'); if (h) h.focus({ preventScroll: true }); } if (window.matchMedia && matchMedia('(max-width: 1219px)').matches && panel.scrollIntoView) panel.scrollIntoView({ block: 'nearest', behavior: calm() ? 'auto' : 'smooth' }); }
      urlSync();
    };
    const setZoom = (z, anchorYear) => { const nz = Math.min(HIST_ZOOM.max, Math.max(HIST_ZOOM.min, z)); if (nz === st.z) return; const y = anchorYear != null ? anchorYear : centreYear(); st.z = Math.round(nz * 100) / 100; st.y = y; if (st.view === 'line') drawChart(y); urlSync(); };
    view(); drawPanel(); if (st.sel) { const e = byId[st.sel]; if (e && st.view === 'line') scrollToYear(e.year_start, false); select(st.sel); }
    /* a shared link with an entry chosen (UX-34): on a phone the entry is under the line, 1,400 px down, and the router puts the page back at the top the moment this function returns, so the entry is brought into view just after that */
    if (st.sel && byId[st.sel]) setTimeout(() => { try { if (alive && panel.isConnected && matchMedia('(max-width: 1219px)').matches) panel.scrollIntoView({ block: 'start', behavior: 'auto' }); } catch (e) { /* no scrolling here */ } }, 90);

    /* the buttons: strands, ways of looking, zoom, era, a mark, a row of the list, a link inside an entry, close */
    on(hx, 'click', (ev) => {
      const t = ev.target; const strand = t.closest('[data-strand]'); const vw = t.closest('[data-view]'); const zm = t.closest('[data-zoom]'); const pick = t.closest('[data-id]'); const clr = t.closest('[data-hx-clear]'); const tclr = t.closest('[data-hx-tclear]');
      if (tclr) { clearT(); urlSync(); const f = hx.querySelector('.hx-strands .hx-chip'); if (f) f.focus(); return; }      /* the chip's own ✕: every event again, and the focus goes to the first strand chip (the chip it was on is gone) */
      if (strand && !strand.closest('.hx-row')) { const id = strand.dataset.strand; st.hidden = st.hidden.includes(id) ? st.hidden.filter((x) => x !== id) : st.hidden.concat(id); if (st.sel && byId[st.sel] && st.hidden.includes(byId[st.sel].strand)) st.sel = ''; strand.setAttribute('aria-pressed', String(!st.hidden.includes(id))); view(); drawPanel(); urlSync(); return; }
      if (vw) { st.view = vw.dataset.view; view(); if (st.view === 'line') scrollToYear(st.sel && byId[st.sel] ? byId[st.sel].year_start : st.y, false); urlSync(); return; }
      if (zm) { const k = zm.dataset.zoom; if (k === 'all') { setZoom(1, centreYear()); st.y = -300; if (st.view === 'line') scrollToYear(-300, false); urlSync(); } else setZoom(k === 'in' ? st.z * HIST_ZOOM.step : st.z / HIST_ZOOM.step); return; }
      if (clr) { select(''); return; }
      if (pick && pick.dataset.id && byId[pick.dataset.id]) { ev.preventDefault(); select(pick.dataset.id, { scroll: true, focusPanel: !!pick.closest('.hx-panel') || pick.classList.contains('hx-li') }); }
    });
    on(hx.querySelector('#hxEra'), 'change', (ev) => { const b = eras.find((x) => x.id === ev.target.value); ev.target.value = ''; if (!b) return; const a = Math.max(b.start, HIST_RANGE.from); const z = Math.min(b.end, HIST_RANGE.to); const fit = (histT(HIST_RANGE.to) - histT(HIST_RANGE.from)) / Math.max(1, histT(z) - histT(a)); st.z = Math.min(HIST_ZOOM.max, Math.max(HIST_ZOOM.min, Math.round(fit * 0.85 * 100) / 100)); st.y = Math.round((a + z) / 2) || 1; if (st.view === 'line') drawChart(st.y); urlSync(); });
    on(chart, 'scroll', () => { clearTimeout(timer); timer = setTimeout(() => { if (!alive) return; st.y = centreYear(); showIn(); urlSoon(); }, 90); }, { passive: true });
    on(chart, 'wheel', (ev) => { if (!(ev.ctrlKey || ev.metaKey)) return; ev.preventDefault(); const r = chart.getBoundingClientRect(); const y = histYearAt(chart.scrollLeft + Math.max(0, ev.clientX - r.left - lab()), HIST_RANGE.from, ppy()); setZoom(st.z * Math.exp(-Math.max(-200, Math.min(200, ev.deltaY)) * 0.004), y); }, { passive: false });
    on(chart, 'keydown', (ev) => {
      const k = ev.key; const t = ev.target; if (k === '+' || k === '=') { ev.preventDefault(); setZoom(st.z * HIST_ZOOM.step); return; } if (k === '-' || k === '_') { ev.preventDefault(); setZoom(st.z / HIST_ZOOM.step); return; } if (k === 'Escape' && st.sel) { select(''); return; }
      const mk = t.closest && t.closest('.hx-mk'); if (!mk || !(k === 'ArrowLeft' || k === 'ArrowRight' || k === 'Home' || k === 'End')) return;
      const row = [...mk.closest('.hx-lane').querySelectorAll('.hx-mk')].sort((a, b) => parseFloat(a.style.left) - parseFloat(b.style.left) || a.dataset.id.localeCompare(b.dataset.id)); const i = row.indexOf(mk); const to = k === 'Home' ? row[0] : k === 'End' ? row[row.length - 1] : row[i + (k === 'ArrowRight' ? 1 : -1)]; if (to) { ev.preventDefault(); to.focus(); to.scrollIntoView({ block: 'nearest', inline: 'center' }); }
    });
    if (typeof ResizeObserver === 'function') { let w0 = chart.clientWidth; ro = new ResizeObserver(() => { clearTimeout(timer); timer = setTimeout(() => { if (!alive || st.view !== 'line' || !chart.clientWidth || chart.clientWidth === w0) return; w0 = chart.clientWidth; drawChart(st.y); }, 140); }); ro.observe(chart); }
    return () => { alive = false; clearTimeout(timer); clearTimeout(urlTimer); if (ro) ro.disconnect(); cleanups.forEach((f) => { try { f(); } catch (e) { /* gone already */ } }); };
  },
};
