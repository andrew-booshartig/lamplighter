/* ═══════════════════════════ 6e · Timelines by tradition, the master timeline, and links ═══════════════════════════
   Everything here is derived from the same station data as the rest of the Journey and the timelines, plus the dated milestones and links in 2l. */
const tradStations = (t) => t.stations.map((n) => PATH_STATIONS[n - 1]).filter(Boolean);
const tradTexts = (t) => [...new Set(tradStations(t).flatMap((s) => s.read))].map((id) => LIB_BY_ID[id]).filter(Boolean);
const evYear = (e) => (e[2] ? 'c. ' : '') + fmtYear(e[0]);
const firstSentence = (s) => { const m = String(s).match(/^.*?[.!?](?=\s+[A-Z“"‘(]|$)/); return (m ? m[0] : s).trim(); };
const LIVING = new Set(['judaism', 'christianity', 'persia', 'islam', 'hindu', 'buddhism', 'jain-sikh', 'china', 'mesoamerica', 'native-america', 'africa', 'oceania', 'modern']);
const tradSpan = (t) => { const ys = tradStations(t).map((s) => s.y0).concat(t.events.map((e) => e[0])); const a = Math.min(...ys); const end = Math.max(...tradStations(t).map((s) => (s.ongoing ? s.y0 : s.y1)).concat(t.events.map((e) => e[0]))); return { a, label: `${fmtYear(a)} – ${LIVING.has(t.id) ? 'today' : fmtYear(end)}` }; };
const tradChip = (id) => `<a class="chip" href="#/path/tradition/${id}">${esc(TRAD_BY_ID[id].short)}</a>`;
const linkList = (links) => `<ul class="linklist">${links.map(([label, url, note]) => `<li>${ext(url, esc(label))}<span class="small t2"> ${esc(note)}</span></li>`).join('')}</ul>`;

/* one merged, dated list: the stations plus the milestones, optionally for a single tradition */
function chronicleItems(tradId) {
  const items = []; const seen = new Set();
  PATH_STATIONS.forEach((s) => { if (s.region === 'all') return; const tr = TRAD_OF_STATION[s.id] || []; if (tradId && !tr.includes(tradId)) return; items.push({ y: s.y0, kind: 'station', s, trads: tr }); });
  TRADITIONS.forEach((t) => { if (tradId && t.id !== tradId) return; t.events.forEach((e) => { const k = e[0] + e[1]; if (seen.has(k)) { const it = items.find((x) => x.kind === 'event' && x.key === k); if (it && !it.trads.includes(t.id)) it.trads.push(t.id); return; } seen.add(k); items.push({ y: e[0], kind: 'event', e, key: k, trads: [t.id] }); }); });
  return items.sort((a, b) => a.y - b.y || (a.kind === 'station' ? -1 : 1));
}
function tlRow(it, showTrads) {
  const when = it.kind === 'station' ? yearsLabel(it.s) : evYear(it.e);
  const body = it.kind === 'station' ? `<a href="#/path/station/${it.s.id}"><b>${esc(it.s.title)}</b></a><span class="tl-kind">station ${stNum(it.s)}</span><div class="small t2">${esc(firstSentence(it.s.blurb))}</div>` : `<span>${esc(it.e[1])}</span>`;
  return `<li class="tl-${it.kind}"><span class="tl-when">${esc(when)}</span><span class="tl-dot"></span><div class="tl-body">${body}${showTrads && it.trads.length ? `<div class="row tight" style="margin-top:6px">${it.trads.map(tradChip).join('')}</div>` : ''}</div></li>`;
}

function pathTraditionsView(root) {
  const list = TRADITIONS.slice().sort((a, b) => tradSpan(a).a - tradSpan(b).a);
  root.querySelector('#pbody').innerHTML = `<p class="t2 small" style="max-width:72ch">The Journey, one tradition at a time: ${TRADITIONS.length} traditions, each with a timeline of its stations and key events, its texts in English, how it connects to the others, and where to read further. Ordered by when each begins. A station can belong to more than one, because traditions overlap.</p>
    <div class="grid auto-lg">${list.map((t) => { const sp = tradSpan(t); const texts = tradTexts(t).length; return `<a class="card pcard fade-in" href="#/path/tradition/${t.id}"><div class="top"><h3>${esc(t.name)}</h3></div><div class="small muted">${esc(sp.label)}</div><div class="blurb">${esc(firstSentence(t.blurb))}</div><div class="foot"><span class="tag">${t.stations.length} stations</span><span class="tag">${texts} texts</span><span class="tag" data-trread="${t.id}"></span></div></a>`; }).join('')}</div>
    <div class="row" style="margin-top:18px"><a class="btn" href="#/path/chronicle">Open the master timeline</a><a class="btn ghost" href="#/path/links">All reading links</a></div>`;
  TXT.index().then((meta) => { if (!meta) return; $$('[data-trread]', root).forEach((el) => { const t = TRAD_BY_ID[el.dataset.trread]; const n = tradTexts(t).filter((l) => meta[l.id]).length; if (n) el.textContent = `${n} readable`; }); });
}

/* SA-03: the Journey's view of a group and the religion's own page (the hub) are two pages for one thing, so each names the other. Nine of the nineteen views name one tradition of the map data (ATL_FROM_PATH[..].sel) and link its page,
   “The full page for X”, with the name the records give it (“Ancient Greek religion” for the Greece and Rome view); the other ten name a family or a group of families and link the list of its religions. The hub, the map panel and the station pages call this page the Journey (“Journey →”, “Journey for”); a stop on it is a station. */
const pathAtlasOwn = (pid) => (typeof ATL_FROM_PATH !== 'undefined' && ATL_FROM_PATH && Object.prototype.hasOwnProperty.call(ATL_FROM_PATH, pid) ? ATL_FROM_PATH[pid] : null);
const pathAtlasId = (pid) => { const m = pathAtlasOwn(pid); return m && m.sel ? m.sel : ''; };
function pathHubLinkHTML(pid) {
  const m = pathAtlasOwn(pid); if (!m) return '';
  if (m.sel) { const ix = typeof ATLD !== 'undefined' && ATLD ? ATLD.ix : null; const name = ix && ix.trad && ix.trad[m.sel] ? ix.trad[m.sel].name : ''; return `<a class="btn ghost" href="#/atlas/tradition/${esc(m.sel)}" data-hub="${esc(m.sel)}">The full page${name ? ' for ' + esc(name) : ''}</a>`; }
  const q = m.f ? 'f=' + encodeURIComponent(m.f) : m.g ? 'g=' + encodeURIComponent(m.g) : ''; return q ? `<a class="btn ghost" href="#/atlas/traditions?${q}">Traditions in this ${m.f ? 'family' : 'group'}</a>` : '';
}
function pathTraditionView(root, id) {
  const t = TRAD_BY_ID[id]; const body = root.querySelector('#pbody');
  if (!t) { body.innerHTML = '<div class="card"><p>No such tradition. <a href="#/path/traditions">Back to all traditions</a></p></div>'; return; }
  const sts = tradStations(t); const texts = tradTexts(t); const sp = tradSpan(t); const items = chronicleItems(t.id); const hubId = pathAtlasId(id);
  // connections: echoes from this tradition's stations to stations that belong to other traditions
  const conn = {}; sts.forEach((s) => echoesOf(s).forEach((e) => { const o = e.A === s ? e.B : e.A; (TRAD_OF_STATION[o.id] || []).forEach((tid) => { if (tid === t.id || (TRAD_OF_STATION[s.id] || []).includes(tid) && sts.includes(o)) return; (conn[tid] = conn[tid] || []).push({ s, o, e }); }); }));
  const connRows = Object.entries(conn).sort((a, b) => b[1].length - a[1].length).slice(0, 8);
  body.innerHTML = `<div class="small" style="margin-bottom:10px"><a href="#/path/traditions">← Journey by tradition</a></div>
    <section class="card glow fade-in"><div class="eyebrow">Journey · ${esc(sp.label)} · ${sts.length} stations · ${texts.length} texts</div><h2 style="font-size:28px;margin:6px 0">${esc(t.name)}</h2><p style="max-width:70ch">${esc(t.blurb)}</p>
      <div class="row" style="margin-top:12px"><a class="btn primary" href="#/path/station/${sts[0].id}">Start at station ${stNum(sts[0])}</a>${pathHubLinkHTML(id)}<a class="btn dice" href="#/path/passage?t=${t.id}">${icon('dice')}Random from this tradition</a><a class="btn ghost" href="#/path/chronicle?t=${t.id}">On the master timeline</a>${typeof atlasLinkFor === 'function' ? `<a class="btn ghost" href="${atlasLinkFor(t.id)}">${icon('globe')}Open the map</a>` : ''}</div></section>
    <section class="card fade-in" style="margin-top:16px"><div class="card-title"><h3>${icon('clock')}Timeline</h3><span class="small muted">stations and milestones, in order</span></div><ol class="tline">${items.map((it) => tlRow(it, false)).join('')}</ol></section>
    <div class="grid c2" style="margin-top:16px"><section class="card fade-in"><div class="card-title"><h3>${icon('learn')}Texts in the Library</h3></div>${texts.length ? `<ul class="plain tradtexts">${texts.map((l) => `<li><b>${esc(l.title)}</b> <span class="muted small">· ${esc(l.when)}</span><span class="rdcell" data-rd="${l.id}"></span></li>`).join('')}</ul>` : '<p class="t2 small">No written texts survive for this tradition in the Journey. The work is weighing evidence; the stations say how.</p>'}</section>
      <section class="card fade-in"><div class="card-title"><h3>${icon('swap')}How it connects to others</h3></div>${connRows.length ? `<ul class="plain">${connRows.map(([tid, arr]) => `<li><a href="#/path/tradition/${tid}"><b>${esc(TRAD_BY_ID[tid].short)}</b></a> <span class="muted small">· ${arr.length} echo${arr.length === 1 ? '' : 's'}</span><div class="small t2">${arr.slice(0, 2).map((x) => `${esc(x.s.title)} ↔ ${esc(x.o.title)}`).join('; ')}</div></li>`).join('')}</ul><a class="small more-link" href="#/path/echoes">All shared ideas →</a>` : '<p class="t2 small">No classified connections yet.</p>'}</section></div>
    <section class="card fade-in" style="margin-top:16px"><div class="card-title"><h3>${icon('link')}Read and explore further</h3></div>${linkList(t.links)}<div class="small t2" style="margin-top:8px">Looking for something broader? <a href="#/path/links">General reference sites</a>. Links open in a new tab; they go to reference and text sites, and the Lamplighter Project does not track what you click.</div></section>
    ${typeof relatedBox === 'function' && hubId ? relatedBox('tradition', hubId, { skip: ['read'] }) : ''}`;      /* SA-02/03: the strip of what the records hold for the one religion this view names (nine views); its Texts the view draws itself above */
  const hubA = body.querySelector('a[data-hub]'); if (hubA && typeof ATLD !== 'undefined' && ATLD && typeof ATLD.open === 'function') ATLD.open().then((ix) => { const n = ix && ix.trad && ix.trad[hubA.dataset.hub] ? ix.trad[hubA.dataset.hub].name : ''; if (n && hubA.isConnected !== false) hubA.textContent = 'The full page for ' + n; }).catch(() => null);      /* the name arrives with the map data, if it was not loaded yet */
  TXT.index().then((meta) => { if (!meta) return; $$('.tradtexts [data-rd]', root).forEach((el) => { const lid = el.dataset.rd; if (!meta[lid]) return; el.insertAdjacentHTML('afterbegin', `<a class="btn sm primary" href="#/path/read/${lid}">Read</a><a class="btn sm ghost dice" href="#/path/passage?b=${lid}" title="A random passage from this book">${icon('dice')}Random</a>`); }); });
}

function pathChronicleView(root, query) {
  const tid = TRAD_BY_ID[query.t] ? query.t : ''; const kind = query.k === 'stations' || query.k === 'events' ? query.k : '';
  const items = chronicleItems(tid).filter((it) => !kind || (kind === 'stations') === (it.kind === 'station'));
  let html = ''; let last = '';
  items.forEach((it) => { const era = ERAS.find((e) => it.y >= e.y0 && it.y < e.y1) || ERAS[ERAS.length - 1]; if (era.id !== last) { if (last) html += '</ol>'; html += `<h3 class="tl-era" id="era-${era.id}">${esc(era.name)} <span class="muted small">${esc(era.span)}</span></h3><ol class="tline">`; last = era.id; } html += tlRow(it, !tid); });
  if (last) html += '</ol>';
  const nSt = items.filter((x) => x.kind === 'station').length;
  const q = (o) => { const p = new URLSearchParams(); Object.entries(Object.assign({ t: tid, k: kind }, o)).forEach(([k, v]) => { if (v) p.set(k, v); }); const s = p.toString(); return '#/path/chronicle' + (s ? '?' + s : ''); };
  root.querySelector('#pbody').innerHTML = `<p class="t2 small" style="max-width:72ch">Every station and dated milestone in one list, from the first burials to now. Stations link to their weekly lessons; milestones are the dated events that fill the gaps. Dates are approximate scholarly ones; “c.” marks the uncertain ones.</p>
    <div class="row" style="margin:12px 0"><select class="select" id="chT" style="width:auto;max-width:280px" aria-label="Tradition"><option value="">All traditions</option>${TRADITIONS.map((t) => `<option value="${t.id}"${tid === t.id ? ' selected' : ''}>${esc(t.name)}</option>`).join('')}</select>
      <select class="select" id="chK" style="width:auto" aria-label="What to show"><option value="">Stations and milestones</option><option value="stations"${kind === 'stations' ? ' selected' : ''}>Stations only</option><option value="events"${kind === 'events' ? ' selected' : ''}>Milestones only</option></select><span class="muted small">${items.length} entries · ${nSt} stations</span></div>
    <nav class="row tight" aria-label="Jump to an era" style="margin-bottom:8px">${ERAS.filter((e) => e.id !== 'e14').map((e) => `<a class="chip" href="#" data-jump="era-${e.id}">${esc(ERA_SHORT[e.id] || e.name)}</a>`).join('')}</nav>${html || '<p class="t2">Nothing matches.</p>'}`;
  const go = () => { location.hash = q({ t: $('#chT', root).value, k: $('#chK', root).value }); };
  $('#chT', root).addEventListener('change', go); $('#chK', root).addEventListener('change', go);
  root.addEventListener('click', (e) => { const j = e.target.closest('[data-jump]'); if (!j) return; e.preventDefault(); const el = $('#' + j.dataset.jump, root); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
}

function pathLinksView(root) {
  root.querySelector('#pbody').innerHTML = `<p class="t2 small" style="max-width:72ch">Where to read and look further: encyclopedias, text archives and scholarly projects, grouped by tradition. These are reference and primary-source sites, not sales pages. Links open in a new tab and the Lamplighter Project does not track what you click. Some sites block automated checks, so if one fails to load, search for its name.</p>
    ${LINKS_GENERAL.map((g) => `<section class="card fade-in" style="margin-top:14px"><div class="card-title"><h3>${esc(g.title)}</h3></div>${linkList(g.links)}</section>`).join('')}
    <h2 style="margin:26px 0 8px">By tradition</h2><div class="grid auto-lg">${TRADITIONS.map((t) => `<section class="card fade-in"><div class="card-title"><h3><a href="#/path/tradition/${t.id}">${esc(t.name)}</a></h3></div>${linkList(t.links)}</section>`).join('')}</div>`;
}
