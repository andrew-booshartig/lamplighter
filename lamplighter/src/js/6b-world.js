/* ═══════════════════════════ 6b · The world at once: lane chart, echoes, theme heat map ═══════════════════════════
   Every station is placed by date and continent, so overlap can be seen, not just read about. Echoes say HOW two traditions
   are related (borrowing, ancestry, contact, parallel, contested). Both are used on station pages and in Day 4. */
const REGION_NAME = Object.assign({ all: 'Yours' }, Object.fromEntries(CONT));
const ERA_SHORT = { e1: 'Deep time', e2: 'Settling', e3: 'Cities', e4: 'Bronze Age', e5: 'Iron Age', e6: 'Axial Age', e7: 'Hellenistic', e8: 'Jesus & Rome', e9: 'Late antiquity', e10: 'Early Islam', e11: 'Medieval', e12: 'Contact', e13: 'Modern' };
const eraHue = (id) => ({ e1: 215, e2: 195, e3: 170, e4: 145, e5: 115, e6: 75, e7: 48, e8: 28, e9: 8, e10: 345, e11: 320, e12: 292, e13: 265, e14: 240 }[id] || 220);
const yearsLabel = (s) => (s.region === 'all' ? 'now' : s.ongoing ? fmtYear(s.y0) + ' – today' : s.y1 - s.y0 > 40 ? fmtYear(s.y0) + ' – ' + fmtYear(s.y1) : fmtYear(Math.round((s.y0 + s.y1) / 2)));

function echoCard(e) {
  const k = ECHO_KINDS[e.kind];
  const side = (s) => `<a class="echo-st" href="#/path/station/${s.id}"><span><span class="n">${stNum(s)}</span> <b>${esc(s.title)}</b></span><span class="muted small">${esc(yearsLabel(s))} · ${esc(REGION_NAME[s.region])}</span></a>`;
  const [a, b] = stNum(e.A) <= stNum(e.B) ? [e.A, e.B] : [e.B, e.A];
  return `<article class="card flat echo fade-in"><div style="margin-bottom:10px"><span class="kind" style="--k:${k.color}" title="${esc(k.desc)}">${esc(k.name)}</span></div><div class="echo-pair">${side(a)}<span class="arrow" aria-hidden="true">↔</span>${side(b)}</div><p class="small t2" style="margin:10px 0 0">${esc(e.note)}</p></article>`;
}
function echoesBlock(s, compact) {
  const list = echoesOf(s); if (!list.length) return '<p class="small t2">No catalogued connections for this station yet.</p>';
  return list.map((e) => { const o = e.A === s ? e.B : e.A; const k = ECHO_KINDS[e.kind]; return `<div class="echo-mini"><div class="spread" style="gap:8px;align-items:flex-start;flex-wrap:wrap"><a href="#/path/station/${o.id}"><b>${esc(o.title)}</b></a><span class="kind sm" style="--k:${k.color}">${esc(k.name)}</span></div><div class="small t2">${esc(e.note)}</div>${compact ? '' : `<div class="small muted">${esc(yearsLabel(o))} · ${esc(REGION_NAME[o.region])}</div>`}</div>`; }).join('');
}
function contemporariesBlock(s) {
  if (s.region === 'all') return '';
  if (s.y1 - s.y0 > 3000) return `<p class="small t2">A very long-lived tradition: it overlaps most of the Journey. See <a href="#/path/world">the world chart</a> for where it sits.</p>`;
  const list = contemporaries(s); if (!list.length) return '';
  return `<div class="eyebrow" style="margin-top:14px">Same time, other continents</div><ul class="plain">${list.map((o) => `<li><a href="#/path/station/${o.id}">${esc(o.title)}</a> <span class="muted">· ${esc(REGION_NAME[o.region])} · ${esc(yearsLabel(o))}</span></li>`).join('')}</ul>`;
}

function worldChart(query) {
  const theme = THEMES[query.theme] ? query.theme : ''; const links = query.links && (query.links === 'all' || ECHO_KINDS[query.links]) ? query.links : '';
  const tap = typeof matchMedia === 'function' && matchMedia('(pointer:coarse),(max-width:760px)').matches;      /* AA-17 (alpha audit): on a touch screen or a phone the bars are 40 px apart (28 high and a gap of 12) and each has a 40 px tap area that no neighbour takes (a bar under 40 px wide is given room at its sides, and the next bar in its row starts after that room); a mouse keeps the 24 px pitch */
  const LEFT = 112, TOP = 58, ROW = tap ? 28 : 20, GAP = tap ? 12 : 4; const W = LEFT + TIME_AXIS_W + 30;
  const lanes = REGION_ORDER.map(([k, name]) => {
    const rows = []; const placed = [];
    PATH_STATIONS.filter((s) => s.region === k).sort((a, b) => a.y0 - b.y0 || a.y1 - b.y1).forEach((s) => { const x0 = LEFT + axisX(s.y0); const x1 = Math.max(LEFT + axisX(s.y1), x0 + 16); const hw = tap ? Math.max(0, 40 - (x1 - x0)) / 2 : 0; let r = rows.findIndex((end) => x0 - hw >= end + 3); if (r < 0) { r = rows.length; rows.push(0); } rows[r] = x1 + hw; placed.push({ s, x0, x1, r, hw }); });
    return { k, name, placed, nrows: Math.max(1, rows.length) };
  });
  let y = TOP; lanes.forEach((l) => { l.y = y; l.h = l.nrows * (ROW + GAP) + 16; y += l.h; }); const H = y + 14;
  const shown = (s) => !theme || s.themes.includes(theme); const pos = {}; lanes.forEach((l) => l.placed.forEach((p) => { pos[p.s.id] = { x: (p.x0 + p.x1) / 2, y: l.y + 8 + p.r * (ROW + GAP) + ROW / 2 }; }));
  const bands = ERAS.slice(0, 13).map((e, i) => { const x0 = LEFT + axisX(Math.max(e.y0, -100000)); const x1 = LEFT + axisX(Math.min(e.y1, 2030)); return `<rect x="${x0}" y="${TOP - 18}" width="${x1 - x0}" height="${H - TOP + 18}" fill="${i % 2 ? 'rgba(127,140,170,.07)' : 'rgba(127,140,170,.02)'}"/><text class="wera" x="${x0 + 5}" y="${TOP - 24}" style="fill:hsl(${eraHue(e.id)},70%,68%)">${esc(ERA_SHORT[e.id])}</text>`; }).join('');
  const ticks = [-100000, -10000, -3000, -1000, 1, 1000, 2000].map((t) => `<line x1="${LEFT + axisX(t)}" x2="${LEFT + axisX(t)}" y1="${TOP - 12}" y2="${TOP - 4}" stroke="currentColor" opacity=".4"/><text class="wtick" x="${LEFT + axisX(t)}" y="${TOP - 14}" text-anchor="middle" dy="-2">${t < 0 ? Math.abs(t) / 1000 + (Math.abs(t) >= 1000 ? 'k' : '') + ' BCE' : t === 1 ? '1 CE' : t}</text>`).join('');
  const laneRows = lanes.map((l, i) => `<rect x="0" y="${l.y}" width="${W}" height="${l.h}" fill="${i % 2 ? 'rgba(127,140,170,.045)' : 'transparent'}"/><text class="wlane" x="10" y="${l.y + 22}">${esc(l.name)}</text><text class="wtick" x="10" y="${l.y + 36}">${l.placed.length} station${l.placed.length === 1 ? '' : 's'}</text>`).join('');
  const arcs = links ? ECHO_LINKS.filter((e) => (links === 'all' || e.kind === links) && (!theme || shown(e.A) || shown(e.B))).map((e) => { const a = pos[e.A.id], b = pos[e.B.id]; if (!a || !b) return ''; const dy = Math.abs(a.y - b.y) < 8 ? 34 : 0; return `<path d="M${a.x} ${a.y} C ${a.x} ${a.y - 36 - dy}, ${b.x} ${b.y - 36 - dy}, ${b.x} ${b.y}" fill="none" stroke="${ECHO_KINDS[e.kind].color}" stroke-width="1.6" opacity=".6"><title>${esc(e.A.title)} ↔ ${esc(e.B.title)} (${esc(ECHO_KINDS[e.kind].name)})</title></path>`; }).join('') : '';
  const bars = lanes.map((l) => l.placed.map(({ s, x0, x1, r, hw }) => { const by = l.y + 8 + r * (ROW + GAP); const w = x1 - x0; const dim = !shown(s); const hue = eraHue(s.era);
    return `<a href="#/path/station/${s.id}" class="wlink"><title>${stNum(s)}. ${esc(s.title)} · ${esc(yearsLabel(s))}</title>${tap ? `<rect class="whit" x="${(x0 - hw).toFixed(2)}" y="${by - GAP / 2}" width="${(w + 2 * hw).toFixed(2)}" height="${ROW + GAP}" fill="transparent"/>` : ''}<rect class="wbar" x="${x0}" y="${by}" width="${w}" height="${ROW}" rx="6" fill="hsl(${hue},60%,${dim ? 40 : 52}%)" opacity="${dim ? 0.16 : 0.95}"/>${w >= 22 ? `<text class="wnum" x="${x0 + 6}" y="${by + ROW / 2 + 4}" opacity="${dim ? 0.2 : 1}">${stNum(s)}</text>` : ''}${s.ongoing ? `<path d="M${x1 - 1} ${by + 3} l9 ${ROW / 2 - 3} l-9 ${ROW / 2 - 3}z" fill="hsl(${hue},60%,52%)" opacity="${dim ? 0.16 : 0.95}"/>` : ''}</a>`; }).join('')).join('');
  return `<div class="worldwrap"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Every station placed by date and continent">${laneRows}${bands}${ticks}${arcs}${bars}</svg></div>`;
}
const REGION_ORDER = [...CONT, ['all', 'Yours']];

function pathWorldView(root, query) {
  const st = PATH.get(); const eraSel = ERA_BY_ID[query.era] && query.era !== 'e14' ? query.era : (st.started ? PATH_STATIONS[Math.min(st.cur, PATH_STATIONS.length - 1)].era : 'e6'); const era = ERA_BY_ID[eraSel];
  const hash = (o) => '#/path/world?' + new URLSearchParams(Object.assign({ era: eraSel, theme: query.theme || '', links: query.links || '' }, o));
  const list = PATH_STATIONS.filter((s) => s.era === era.id);
  const kinds = Object.entries(ECHO_KINDS);
  root.querySelector('#pbody').innerHTML = `<p class="t2 small" style="max-width:74ch">Every station placed by date and continent. Deep time is compressed and recent centuries stretched, so the overlap in each age is visible. Bars are numbered stations; an arrow means a living tradition. Pick a theme to light up where it appears across the world, and turn on connections to see how stations are related.</p>
    <div class="row" style="margin:12px 0"><select class="select" id="wTheme" style="width:auto" aria-label="Highlight a theme"><option value="">All themes</option>${Object.entries(THEMES).map(([k, t]) => `<option value="${k}"${query.theme === k ? ' selected' : ''}>${esc(t.name)}</option>`).join('')}</select>
      <select class="select" id="wLinks" style="width:auto" aria-label="Show connections"><option value="">No connections</option><option value="all"${query.links === 'all' ? ' selected' : ''}>All connections</option>${kinds.map(([k, v]) => `<option value="${k}"${query.links === k ? ' selected' : ''}>${esc(v.name)}</option>`).join('')}</select><span class="small muted">scroll sideways ›</span></div>
    ${worldChart(query)}
    <div class="row tight" style="margin-top:10px">${kinds.map(([k, v]) => `<span class="kind sm" style="--k:${v.color}" title="${esc(v.desc)}">${esc(v.name)}</span>`).join('')}</div>
    <h2 style="margin:26px 0 8px">One age, every continent</h2><div class="row tight" style="margin-bottom:14px">${ERAS.slice(0, 13).map((e) => `<a class="chip" href="${hash({ era: e.id })}" aria-pressed="${e.id === eraSel}">${esc(ERA_SHORT[e.id])}</a>`).join('')}</div>
    <section class="card fade-in"><div class="eyebrow">${esc(era.span)}</div><h3 style="margin:4px 0 8px;font-size:1.25rem">${esc(era.name)}</h3><p class="t2">${esc(era.blurb)}</p>${snapHTML(era)}<div class="stack sm" style="margin-top:14px">${list.map((s) => stationRow(s, st)).join('')}</div></section>
    <h2 style="margin:26px 0 8px">Which themes, when</h2><p class="t2 small" style="max-width:74ch">How many stations in each age touch each theme. A column that lights up across many rows is an age of great overlap; a row that lights up across many columns is an idea that never goes away. Click a cell to follow that thread through one age.</p>${heatMap()}`;
  const go = () => { location.hash = hash({ theme: $('#wTheme', root).value, links: $('#wLinks', root).value }); };
  $('#wTheme', root).addEventListener('change', go); $('#wLinks', root).addEventListener('change', go);
}

function heatMap() {
  const eras = ERAS.slice(0, 13); const keys = Object.keys(THEMES); const cell = (k, e) => PATH_STATIONS.filter((s) => s.era === e.id && s.themes.includes(k)).length;
  const max = Math.max(...keys.flatMap((k) => eras.map((e) => cell(k, e))));
  return `<div class="table-wrap"><table class="heat"><tr><th></th>${eras.map((e) => `<th title="${esc(e.name)} · ${esc(e.span)}"><span>${esc(ERA_SHORT[e.id])}</span></th>`).join('')}<th>All</th></tr>${keys.map((k) => { const row = eras.map((e) => cell(k, e)); return `<tr><th scope="row"><a href="#/path/timeline?theme=${k}">${esc(THEMES[k].name)}</a></th>${row.map((n, i) => `<td${n ? ` style="background:rgba(125,155,255,${(0.14 + 0.62 * n / max).toFixed(2)})"` : ''}>${n ? `<a href="#/path/timeline?theme=${k}&era=${eras[i].id}">${n}</a>` : ''}</td>`).join('')}<td class="tot">${row.reduce((a, b) => a + b, 0)}</td></tr>`; }).join('')}</table></div>`;
}

function pathEchoesView(root, query) {
  const kind = ECHO_KINDS[query.kind] ? query.kind : ''; const theme = THEMES[query.theme] ? query.theme : '';
  const all = ECHO_LINKS.slice().sort((a, b) => Math.min(stNum(a.A), stNum(a.B)) - Math.min(stNum(b.A), stNum(b.B)));
  const list = all.filter((e) => (!kind || e.kind === kind) && (!theme || e.A.themes.includes(theme) || e.B.themes.includes(theme)));
  const n = all.length; const cnt = (k) => all.filter((e) => e.kind === k).length; const pct = (x) => Math.round((100 * x) / n);
  const same = cnt('borrowing') + cnt('ancestry'); const hash = (o) => '#/path/echoes?' + new URLSearchParams(Object.assign({ kind, theme }, o));
  root.querySelector('#pbody').innerHTML = `<section class="card glow fade-in"><div class="card-title"><h3>${icon('swap')}How the world’s traditions overlap, and how we know</h3></div>
      <p class="t2" style="max-width:76ch">"They look alike" can mean five different things. Each of the ${n} connections here is sorted by how strong the evidence is, so you can see how much of the overlap comes from one historical stream and how much from people everywhere arriving at similar ideas.</p>
      <div class="stack sm" style="margin:12px 0">${Object.entries(ECHO_KINDS).map(([k, v]) => `<div class="echo-bar"><span class="kind sm" style="--k:${v.color}">${esc(v.name)}</span><div class="bar"><i style="width:${pct(cnt(k))}%;background:${v.color}"></i></div><span class="mono small">${cnt(k)}</span><span class="small t2 desc">${esc(v.desc)}</span></div>`).join('')}</div>
      <div class="callout">${icon('info')}<div><b>What this suggests.</b> ${pct(same)}% of these overlaps trace to one stream (documented borrowing or shared ancestry), and ${pct(cnt('contact'))}% to contact between peoples. About ${pct(cnt('parallel'))}% are independent parallels, ideas that arise separately: the breath that is also spirit, descent and return, reciprocity, a creation from darkness, the Word that makes worlds. Those are the best evidence for what you suspect: a common set of human experiences. They are weaker evidence for a common historical source, and which of them reflect a shared reality is the question this Journey leaves to you. The ${pct(cnt('contested'))}% contested are claims worth knowing and not worth leaning on.</div></div></section>
    <div class="row" style="margin:16px 0"><div class="row tight">${[['', 'All kinds'], ...Object.entries(ECHO_KINDS).map(([k, v]) => [k, v.name])].map(([k, nm]) => `<a class="chip" href="${hash({ kind: k })}" aria-pressed="${kind === k}">${esc(nm)}</a>`).join('')}</div><select class="select" id="eTheme" style="width:auto" aria-label="Filter by theme"><option value="">All themes</option>${Object.entries(THEMES).map(([k, t]) => `<option value="${k}"${theme === k ? ' selected' : ''}>${esc(t.name)}</option>`).join('')}</select><span class="muted small">${list.length} shown</span></div>
    <div class="stack sm">${list.length ? list.map(echoCard).join('') : '<p class="t2">No connections match.</p>'}</div>`;
  $('#eTheme', root).addEventListener('change', () => { location.hash = hash({ theme: $('#eTheme', root).value }); });
}
