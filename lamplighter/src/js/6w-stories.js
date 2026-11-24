/* ═══════════════════════════ 6w · Stories across the world (Traditions → Compare traditions → Stories) ═══════════════════════════
   Pick a story that turns up in many places (the flood, the garden and the serpent, the sacred meal, the golden rule …) and watch its versions appear on the map as the years pass, joined by
   the links scholars draw between them: borrowing, shared ancestry, contact, independent parallels and the disputed ones. A version is dated by when it was first written down, which is often
   long after the story began, and the page says so. Data: 2y-data-stories.js. The map is the Atlas's own (its coastlines and projection). */
const STORY_KIND = { written: ['Written', 'First written down about this time'], recorded: ['Written down late', 'Set down long after the story began, from oral tradition, often by outsiders'], found: ['Dug up', 'Something found in the ground or in a cave, dated by the dig or the lab'], reading: ['Later reading', 'A later interpretation of the story'] };
const STORY_FAMILIAR = { flood: 'Noah’s ark', beginning: 'In the beginning', giant: 'The first giant', birth: 'The Christmas story', rising: 'Easter and the resurrection', golden: 'The Golden Rule', teacher: 'The wandering teacher', meal: 'Communion', end: 'Revelation', garden: 'Eden and the serpent', conscience: 'Freedom of religion', plants: 'Wine, incense and sacred plants', sound: 'Sacred sound', image: 'Sacred images' };
const stFmt = (e) => atlFmtYear(e.y, e.kind !== 'reading' && /about|c\.|around|early|late|debated|roughly/i.test(e.yNote || ''));

async function atlasStoriesView(root, id, query) {
  const body = $('#abody', root);
  try { await ATLD.open(); await ATLD.need('land'); } catch (e) { body.innerHTML = `<div class="card"><div class="callout warn">${icon('warn')}<div>The map data was not found. It lives in an <b>atlas</b> folder next to Lamplighter.html.</div></div></div>`; return; }
  if (!id || !STORY_BY_ID[id]) { storiesIndex(body); return; }
  if (typeof TXT !== 'undefined' && TXT && typeof TXT.index === 'function') { try { await TXT.index(); } catch (e) { /* the page still draws: a title is a link only where the copy is known to be here */ } }
  const story = STORY_BY_ID[id]; const ix = ATLD.ix; const stops = ix.cfg.slider_scale.stops; const entries = storyEntries(story).sort((a, b) => a.y - b.y); const byId = Object.fromEntries(entries.map((e) => [e.id, e]));
  const links = story.links.map(([a, b, kind, note]) => ({ a: byId[a], b: byId[b], kind, note })).filter((l) => l.a && l.b);
  const ymin = entries[0].y; const ymax = entries[entries.length - 1].y; const span = Math.max(ymax - ymin, 100);
  const p0 = atlYearPos(atlSnap(ymin - span * 0.04), stops); const p1 = atlYearPos(Math.min(2026, ymax + Math.max(40, span * 0.02)), stops);
  const posOf = (y) => (atlYearPos(y, stops) - p0) / (p1 - p0); const yearOf = (v) => atlPosYear(p0 + v * (p1 - p0), stops);
  const light = () => document.documentElement.dataset.theme === 'light';
  body.innerHTML = `<div class="small" style="margin-bottom:10px"><a href="#/atlas/stories">← All stories</a></div>
    <section class="card glow fade-in"><div class="eyebrow">${esc(STORY_FAMILIAR[id] || '')}</div><h2 style="font-size:28px;margin:4px 0">${esc(story.name)}</h2><p style="max-width:70ch;font-size:16px;margin:8px 0">${esc(story.blurb)}</p>
      <p class="small t2" style="max-width:74ch;margin:6px 0 0">${esc(story.note)}</p></section>
    <section class="card flat" style="margin-top:14px;padding:14px 16px"><div class="st-wrap" id="stWrap"><canvas id="stMap" role="img" aria-label="${esc('Map of the versions of ' + story.name + ' as they appear over time. The same versions are listed below.')}"></canvas><div class="atl-tip" id="stTip" hidden></div><div class="atl-readout"><b id="stYear"></b><span class="small" id="stWhat"></span></div></div>
      <input class="atl-slider" id="stSlider" type="range" min="0" max="1000" step="1" value="0" aria-label="Year" style="margin-top:10px">
      <div class="row atl-transport"><button class="btn sm primary" id="stPlay" type="button">${icon('play')}<span>Watch it travel</span></button><button class="btn sm" id="stReset" type="button">⏮</button><button class="btn sm" id="stAll" type="button">Show all</button><label class="chk" style="margin-left:6px"><input type="checkbox" id="stLinks" checked><span class="small">Show the links</span></label></div>
      <div class="row tight" style="margin-top:10px" id="stKey">${Object.entries(ECHO_KINDS).filter(([k]) => links.some((l) => l.kind === k)).map(([k, v]) => `<span class="small"><i class="st-key" style="background:${v.color}"></i>${esc(v.name)}</span>`).join('')}<span class="small muted">· ● written · ○ written down late${story.entries.some((e) => e[7] === 'found') ? ' · ■ dug up' : ''}${story.entries.some((e) => e[7] === 'reading') ? ' · ◆ later reading' : ''}</span></div>
      <p class="hint" style="margin-top:8px">Each version is placed where it was told or first written and dated by when it was first written down. Stories are older than their first record. Click a version to read about it.</p></section>
    <div id="stSel" aria-live="polite"></div>
    <section class="card flat" style="margin-top:16px"><div class="card-title"><h3>The versions, in order</h3><span class="muted small">${entries.length} versions</span></div><ol class="plain st-list" id="stList">${entries.map((e) => stRow(e)).join('')}</ol></section>
    ${typeof relatedBox === 'function' ? relatedBox('story', story.id, { skip: ['traditions', 'read'] }) : ''}`;      /* SA-02/05, FA-06: where the versions were told; the religions and texts they rest on are links in the list of versions above, so the strip leaves them out; it draws itself when its data has arrived */
  /* ── the map ── */
  const wrap = $('#stWrap', body); const cv = $('#stMap', body); const ctx = cv.getContext('2d'); const land = document.createElement('canvas'); const lctx = land.getContext('2d'); const tip = $('#stTip', body);
  let W = 0; let H = 0; let dpr = 1; let v = null; let cur = 0; let sel = ''; let playing = false; let timer = 0; let showLinks = true; let hits = []; let landDirty = true; let alive = true; let lastPlay = 0;
  const lens = { lon0: 20, rot: 0 };
  const resize = () => { const w = Math.max(280, Math.round(wrap.getBoundingClientRect().width)); if (w === W && cv.width) return; W = w; H = Math.round(Math.min(560, Math.max(260, W * 0.46))); dpr = Math.min(2, window.devicePixelRatio || 1); wrap.style.height = H + 'px'; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; land.width = W * dpr; land.height = H * dpr; v = atlView({ w: W, h: H, lon0: lens.lon0, rot: 0, zoom: 1 }); landDirty = true; };
  const drawLand = () => {
    const pal = light() ? { sea: '#dbe7f3', land: '#f4efe2', edge: '#9aa7b8', grid: 'rgba(60,80,110,.12)' } : { sea: '#0b1322', land: '#243149', edge: '#4a5b78', grid: 'rgba(160,185,230,.10)' };
    lctx.setTransform(dpr, 0, 0, dpr, 0, 0); lctx.clearRect(0, 0, W, H); lctx.fillStyle = pal.sea; lctx.fillRect(0, 0, W, H);
    lctx.strokeStyle = pal.grid; lctx.lineWidth = 1; for (let la = -40; la <= 80; la += 20) { const [x1, y1] = v.toScreenU(-179.9, la, 0); const [x2, y2] = v.toScreenU(179.9, la, 0); lctx.beginPath(); lctx.moveTo(Math.round(x1) + 0.5, Math.round(y1) + 0.5); lctx.lineTo(Math.round(x2) + 0.5, Math.round(y2) + 0.5); lctx.stroke(); }
    const rings = atlLand('l110') || []; lctx.fillStyle = pal.land; lctx.strokeStyle = pal.edge; lctx.lineWidth = 0.7;
    for (const ring of rings) {
      let prev = null; const n = ring.length / 2; const us = new Float32Array(n); const la = new Float32Array(n);
      for (let i = 0; i < ring.length; i += 2) { let u = v.wrapLon(ring[i]); if (prev != null) { while (u - prev > 180) u -= 360; while (u - prev < -180) u += 360; } prev = u; us[i / 2] = u; la[i / 2] = ring[i + 1]; }
      for (let c = -1; c <= 1; c++) { lctx.beginPath(); for (let i = 0; i < n; i++) { const [x, y] = v.toScreenU(us[i], la[i], c); i ? lctx.lineTo(x, y) : lctx.moveTo(x, y); } lctx.closePath(); lctx.fill(); lctx.stroke(); }
    }
    landDirty = false;
  };
  const pt = (e) => v.toScreen(e.lon, e.lat);
  const arcPts = (A, B) => { const [x1, y1] = pt(A); const [x2, y2] = pt(B); const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2; const dx = x2 - x1; const dy = y2 - y1; const d = Math.hypot(dx, dy) || 1; const bend = Math.min(70, d * 0.22); return { x1, y1, x2, y2, cx: mx - (dy / d) * bend, cy: my + (dx / d) * bend - bend * 0.3 }; };
  const quad = (p, t) => { const u = 1 - t; return [u * u * p.x1 + 2 * u * t * p.cx + t * t * p.x2, u * u * p.y1 + 2 * u * t * p.cy + t * t * p.y2]; };
  const draw = () => {
    if (!alive) return; if (landDirty) drawLand(); const pos = cur; const yr = yearOf(pos);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.drawImage(land, 0, 0, W, H); hits = [];
    const vis = entries.filter((e) => e.y <= yr + 1e-6);
    if (showLinks) for (const l of links) {
      if (l.a.y > yr || l.b.y > yr) continue; const k = ECHO_KINDS[l.kind]; const P = arcPts(l.a, l.b); const appear = Math.max(posOf(l.a.y), posOf(l.b.y)); const t = (pos - appear) / 0.07; const sel2 = sel && (l.a.id === sel || l.b.id === sel);
      ctx.beginPath(); ctx.moveTo(P.x1, P.y1); ctx.quadraticCurveTo(P.cx, P.cy, P.x2, P.y2); ctx.strokeStyle = k.color; ctx.globalAlpha = sel2 ? 0.95 : 0.5; ctx.lineWidth = sel2 ? 2.8 : l.kind === 'borrowing' ? 2.2 : 1.4; ctx.setLineDash(l.kind === 'contested' || l.kind === 'parallel' ? [5, 4] : []); ctx.stroke(); ctx.setLineDash([]);
      if (t >= 0 && t <= 1 && (l.kind === 'borrowing' || l.kind === 'ancestry' || l.kind === 'contact')) { const from = l.a.y <= l.b.y ? 0 : 1; const [px, py] = quad(P, from ? 1 - t : t); ctx.globalAlpha = 1; ctx.fillStyle = k.color; ctx.beginPath(); ctx.arc(px, py, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1; ctx.font = '600 11.5px ' + getComputedStyle(document.body).fontFamily; ctx.textBaseline = 'middle';
    const newest = vis.slice(-3).map((e) => e.id);
    for (const e of vis) {
      const [x, y] = pt(e); const age = pos - posOf(e.y); const fresh = age >= 0 && age < 0.06; const on = e.id === sel;
      if (fresh) { ctx.beginPath(); ctx.arc(x, y, 7 + (1 - age / 0.06) * 18, 0, Math.PI * 2); ctx.strokeStyle = '#ffc65a'; ctx.globalAlpha = 1 - age / 0.06; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1; }
      ctx.beginPath(); if (e.kind === 'reading') { ctx.moveTo(x, y - 7); ctx.lineTo(x + 7, y); ctx.lineTo(x, y + 7); ctx.lineTo(x - 7, y); ctx.closePath(); } else if (e.kind === 'found') { const q = on ? 7 : 5.5; ctx.rect(x - q, y - q, q * 2, q * 2); } else ctx.arc(x, y, on ? 8 : 6.5, 0, Math.PI * 2);
      if (e.kind === 'recorded') { ctx.fillStyle = light() ? '#f4efe2' : '#0b1322'; ctx.fill(); ctx.lineWidth = 2.4; ctx.strokeStyle = on ? '#ffc65a' : '#9db8ff'; ctx.stroke(); } else { ctx.fillStyle = on ? '#ffc65a' : '#7d9bff'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = light() ? '#fff' : '#0b1322'; ctx.stroke(); }
      hits.push([x, y, e]);
      if (on || newest.includes(e.id)) { const label = e.name.length > 30 ? e.name.slice(0, 29) + '…' : e.name; const tw = ctx.measureText(label).width; const lx = x + 11 + tw > W - 4 ? x - 11 - tw : x + 11; ctx.lineWidth = 3; ctx.strokeStyle = light() ? 'rgba(255,255,255,.9)' : 'rgba(5,10,20,.85)'; ctx.strokeText(label, lx, y); ctx.fillStyle = light() ? '#101a2c' : '#f1f5ff'; ctx.fillText(label, lx, y); }
    }
    $('#stYear', body).textContent = atlFmtYear(atlSnap(yr)); $('#stWhat', body).textContent = vis.length ? `${vis.length} of ${entries.length} versions so far` : 'before the first version';
    $$('.st-row', body).forEach((r) => r.classList.toggle('late', byId[r.dataset.e].y > yr));
  };
  const setPos = (p) => { cur = Math.max(0, Math.min(1, p)); $('#stSlider', body).value = Math.round(cur * 1000); draw(); };
  const select = (eid, jump) => {
    sel = eid || ''; const e = byId[sel]; const box = $('#stSel', body);
    if (!e) { box.innerHTML = ''; draw(); return; }
    if (jump && e.y > yearOf(cur)) setPos(posOf(e.y) + 0.001); else draw();
    const rel = links.filter((l) => l.a === e || l.b === e); const kd = STORY_KIND[e.kind];
    box.innerHTML = `<section class="card glow fade-in st-sel" style="margin-top:14px"><div class="row" style="gap:8px;flex-wrap:wrap"><span class="tag">${esc(kd[0])}</span><span class="small muted">${esc(e.trad)} · ${esc(e.place)}</span></div><h3 style="font-size:22px;margin:6px 0 2px">${esc(e.name)}</h3><div class="small"><b>${esc(stFmt(e))}</b> <span class="muted">${esc(e.yNote)}</span></div>
      <p style="max-width:70ch;margin:10px 0;font-size:15.5px;line-height:1.55">${esc(e.line)}</p>
      ${e.surprise ? `<div class="sim-note"><b>Wait a minute.</b> ${esc(e.surprise)}</div>` : ''}
      ${rel.length ? `<div style="margin-top:10px"><div class="small muted" style="margin-bottom:4px">How it connects</div>${rel.map((l) => { const o = l.a === e ? l.b : l.a; const k = ECHO_KINDS[l.kind]; return `<div class="st-rel"><span class="st-dot" style="background:${k.color}"></span><div class="small"><b>${esc(k.name)}</b> with <a href="#" data-pick="${o.id}">${esc(o.name)}</a> <span class="muted">(${esc(stFmt(o))})</span><div class="t2">${esc(l.note)}</div></div></div>`; }).join('')}</div>` : ''}
      <div class="row tight" style="margin-top:12px">${e.book && TXT.has(e.book) ? `<a class="btn sm primary" href="#/path/read/${e.book}">Read it in the library</a>` : ''}${stTie(e) ? `<a class="btn sm" href="${esc(stTie(e).href)}">Tradition page: ${esc(stTie(e).name)}</a>` : ''}${e.search ? `<a class="btn sm" href="#/path/search?q=${encodeURIComponent(e.search)}">Search the library for “${esc(e.search)}”</a>` : ''}${e.book ? `<a class="btn sm ghost" href="#/path/similar?b=${e.book}&q=${encodeURIComponent(e.line)}">Passages that read like this</a>` : ''}</div></section>`;
    $$('[data-pick]', box).forEach((a) => a.addEventListener('click', (ev) => { ev.preventDefault(); select(a.dataset.pick, true); }));
    $$('.st-row', body).forEach((r) => r.classList.toggle('on', r.dataset.e === sel));
  };
  const nearest = (mx, my) => { let best = null; let bd = 1e9; for (const h of hits) { const d = Math.hypot(h[0] - mx, h[1] - my); if (d <= 14 && d < bd) { bd = d; best = h; } } return best; };
  cv.addEventListener('pointermove', (ev) => { const r = cv.getBoundingClientRect(); const h = nearest(ev.clientX - r.left, ev.clientY - r.top); if (!h) { tip.hidden = true; cv.style.cursor = 'default'; return; } cv.style.cursor = 'pointer'; tip.innerHTML = `<b>${esc(h[2].name)}</b><div class="small">${esc(stFmt(h[2]))} · ${esc(h[2].place)}</div>`; tip.hidden = false; tip.style.left = Math.min(W - tip.offsetWidth - 6, Math.max(6, h[0] + 14)) + 'px'; tip.style.top = Math.max(6, h[1] - 10 - tip.offsetHeight / 2) + 'px'; });
  cv.addEventListener('pointerleave', () => { tip.hidden = true; });
  cv.addEventListener('click', (ev) => { const r = cv.getBoundingClientRect(); const h = nearest(ev.clientX - r.left, ev.clientY - r.top); if (h) select(h[2].id, false); });
  $('#stSlider', body).addEventListener('input', (ev) => { play(false); setPos(ev.target.value / 1000); });
  const play = (on) => { playing = on; clearInterval(timer); const b = $('#stPlay', body); b.querySelector('span').textContent = on ? 'Pause' : 'Watch it travel'; if (on) { if (cur >= 0.999) setPos(0); lastPlay = Date.now(); timer = setInterval(() => { const dt = (Date.now() - lastPlay) / 1000; lastPlay = Date.now(); setPos(cur + dt / 32); if (cur >= 1) play(false); }, 33); } };
  $('#stPlay', body).addEventListener('click', () => play(!playing));
  $('#stReset', body).addEventListener('click', () => { play(false); setPos(0); });
  $('#stAll', body).addEventListener('click', () => { play(false); setPos(1); });
  $('#stLinks', body).addEventListener('change', (ev) => { showLinks = ev.target.checked; draw(); });
  body.addEventListener('click', (ev) => { if (ev.target.closest('a')) return; const b = ev.target.closest('[data-e]'); if (b && b.closest('.st-list')) select(b.dataset.e, true); });      /* a link in a row opens its page; anywhere else in the row shows the version on the map */
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { requestAnimationFrame(() => { if (alive) { const w0 = W; resize(); if (W !== w0) draw(); } }); }) : null; if (ro) ro.observe(wrap);
  const themeObs = new MutationObserver(() => { landDirty = true; draw(); }); themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  Atlas_leave(() => { alive = false; clearInterval(timer); if (ro) ro.disconnect(); themeObs.disconnect(); });
  resize(); const first = byId[query.e]; if (first) { setPos(posOf(first.y) + 0.002); select(first.id, false); } else { setPos(1); }
  window.__stories = { story, entries, links, setPos, select, play, draw, state: () => ({ cur, sel, year: yearOf(cur), playing }) };
}
/* SA-05: the religion the records tie a version's Library book to: the first of the Random card's chips (relTies in 2z-related-core.js), a page of its own (a family has only a list, so it is left out). Nothing is guessed for a version without a book. */
function stTie(e) {
  if (!e || !e.book || typeof relTies !== 'function') return null; let ties = []; try { ties = relTies(e.book); } catch (err) { ties = []; }
  const u = ties.find((x) => x && x.kind !== 'family' && x.href); return u ? { name: u.name, href: u.href } : null;
}
/* a version in the list: the button that shows it on the map holds only its date; its title is the link that opens the text in the reader (where the copy is here), its religion the link to that religion's page, plain anchors beside the button, never inside it */
function stRow(e) {
  const kd = STORY_KIND[e.kind]; const read = e.book && typeof TXT !== 'undefined' && TXT && typeof TXT.has === 'function' && TXT.has(e.book) ? e.book : ''; const tie = stTie(e);
  const title = read ? `<a class="st-read" href="#/path/read/${esc(read)}" title="Open this text in the reader"><b>${esc(e.name)}</b></a>` : `<b>${esc(e.name)}</b>`;
  return `<li class="st-row" data-e="${esc(e.id)}"><button type="button" class="st-btn st-pick" data-e="${esc(e.id)}" aria-label="${esc('Show ' + e.name + ' on the map, ' + stFmt(e))}"><span class="st-when"><b>${esc(stFmt(e))}</b><span class="small muted">${esc(kd[0])}</span></span></button><div class="st-what"><div class="st-head">${title}<span class="small muted st-place"><span class="st-sep"> · </span>${esc(e.place)}</span></div><span class="small t2 st-line">${esc(e.line.length > 150 ? e.line.slice(0, 148) + '…' : e.line)}${tie ? ` <span class="st-tie"><span class="st-sep">· </span><span class="muted">Tradition:</span> <a href="${esc(tie.href)}">${esc(tie.name)}</a></span>` : ''}</span></div></li>`;
}
/* a small invitation, for the top of other pages: one story you may know and a reason to ask where it came from (or one of the "wait a minute" surprises) */
function storyLookCloser() {
  const all = STORIES.flatMap((s) => storyEntries(s).filter((e) => e.surprise).map((e) => ({ s, e }))); const ordinary = STORIES.filter((s) => ['flood', 'garden', 'birth', 'rising', 'golden', 'meal', 'end', 'beginning'].includes(s.id));
  const pickSurprise = randFloat() < 0.3 && all.length; const it = pickSurprise ? all[randInt(all.length)] : null; const st = it ? null : ordinary[randInt(ordinary.length)];
  const head = it ? 'Wait a minute…' : 'Where did this story come from?'; const text = it ? it.e.surprise : st.hook; const href = it ? `#/atlas/stories/${it.s.id}?e=${it.e.id}` : `#/atlas/stories/${st.id}`; const name = it ? it.e.name : STORY_FAMILIAR[st.id];
  return `<aside class="card flat lc-card" aria-label="Look closer"><div class="eyebrow">Look closer · ${esc(name)}</div><b class="lc-head">${esc(head)}</b><p class="small t2" style="margin:4px 0 8px;max-width:78ch">${esc(text)}</p><div class="row tight"><a class="btn sm primary" href="${href}">Watch it travel the world</a><button class="btn sm ghost" type="button" data-lc-next>Another</button><a class="btn sm ghost" href="#/atlas/stories">All stories</a></div></aside>`;
}
if (typeof document !== 'undefined' && !globalThis.__lcWired) { globalThis.__lcWired = true; document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-lc-next]'); if (!b) return; const card = b.closest('.lc-card'); if (card) card.outerHTML = storyLookCloser(); }); }
/* the front page: stories you know, and the surprises */
function storiesIndex(body) {
  const surprises = STORIES.flatMap((s) => storyEntries(s).filter((e) => e.surprise).map((e) => ({ s, e })));
  body.innerHTML = `<p class="t2 small" style="max-width:76ch">Start with a story you know and see where else it was told, and when. Each story is shown as versions on a map that you can watch appear over time, from the oldest written record to the newest, with the links scholars draw between them: where one was borrowed from another, where two grew from a shared root, where they meet by coincidence, and where the experts disagree.</p>
    <div class="grid auto-lg" style="margin-top:14px">${STORIES.map((s) => { const es = storyEntries(s); const ys = es.map((e) => e.y); return `<a class="card pcard fade-in" href="#/atlas/stories/${s.id}" style="text-decoration:none;color:inherit"><div class="eyebrow">${esc(STORY_FAMILIAR[s.id] || '')}</div><h3 style="margin:2px 0 6px">${esc(s.name)}</h3><p class="small t2" style="margin:0 0 8px">${esc(s.hook)}</p><div class="small muted">${es.length} versions · ${esc(atlFmtYear(Math.min(...ys)))} to ${esc(atlFmtYear(Math.max(...ys)))}</div></a>`; }).join('')}</div>
    <h2 style="margin:26px 0 8px;font-size:20px">Wait a minute…</h2><div class="grid auto-lg">${surprises.map(({ s, e }) => `<a class="card flat sim-note" href="#/atlas/stories/${s.id}?e=${e.id}" style="text-decoration:none;color:inherit;display:block"><b>${esc(e.name)}</b> <span class="muted small">· ${esc(s.name)}</span><div class="small" style="margin-top:4px">${esc(e.surprise)}</div></a>`).join('')}</div>
    <p class="hint" style="margin-top:16px">These pages are careful about what is known. The dates are when versions were first written down, which can be long after the stories began; recorded oral traditions are marked; things dug up are dated by the dig or the lab; and where scholars disagree the page says so instead of picking a side.</p>`;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { STORY_KIND, STORY_FAMILIAR };
