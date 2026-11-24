/* ═══════════════════════════ 6p · The Atlas map: time slider, flat map, play ═══════════════════════════
   One slider from 340,000 BCE to 2026. Every presence row active at the slider year is drawn: country-level rows as large soft blobs, place rows as
   sharper points, sized by prominence and coloured (and shaped) by family group. Rows fade in across their uncertain start and fade out after they end.
   Arcs show the interactions active at that year. Plain canvas, no libraries, no network: the data and the coastlines are in the atlas/ folder. */
const ATLD = {
  base: 'atlas/', _s: {},
  script(name) {
    if (!ATLD._s[name]) ATLD._s[name] = new Promise((res, rej) => { const s = document.createElement('script'); s.charset = 'utf-8'; s.src = ATLD.base + name + '.js'; s.onload = () => res(); s.onerror = () => { delete ATLD._s[name]; rej(new Error('missing ' + name)); }; document.head.appendChild(s); });
    return ATLD._s[name];
  },
  async need(...names) { await Promise.all(names.map((n) => (BEATLAB_ATLAS.data[n] ? null : ATLD.script(n)))); return names.map((n) => BEATLAB_ATLAS.data[n]); },
  get: (n) => BEATLAB_ATLAS.data[n],
  ix: null,
  /* index + core loaded and indexed once */
  async open() {
    if (ATLD.ix) return ATLD.ix; await ATLD.need('index', 'core'); const ix = atlIndex(ATLD.get('core')); atlSetGroups(ix, ATLD.get('index').config.family_groups.groups); ix.cfg = ATLD.get('index').config; ix.codes = ATLD.get('index').codes; ATLD.ix = ix; return ix;
  },
  async places() { await ATLD.need('places'); const d = ATLD.get('places'); if (!d._by) d._by = Object.fromEntries(d.map((p) => [p.id, p])); return d._by; },
};
/* land rings decoded from delta-encoded integers into [lon, lat, lon, lat …] */
function atlLand(level) {
  const d = ATLD.get('land'); if (!d) return null; const L = d[level]; if (!L) return null;
  if (!L._dec) L._dec = L.rings.map((flat) => { const out = new Float32Array(flat.length); let x = 0; let y = 0; for (let i = 0; i < flat.length; i += 2) { x += flat[i]; y += flat[i + 1]; out[i] = x * L.unit; out[i + 1] = y * L.unit; } return out; });
  return L._dec;
}
/* ── colours and shapes: each family group has its own hue and its own shape, so colour is never the only cue ── */
const ATL_GROUP_STYLE = {
  deep_past: { h: 28, s: 14, shape: 'square' }, ancient_worlds: { h: 38, s: 78, shape: 'diamond' }, abrahamic: { h: 218, s: 88, shape: 'circle' }, iranian: { h: 176, s: 62, shape: 'triup' },
  indian: { h: 14, s: 90, shape: 'tridown' }, east_inner_asia: { h: 136, s: 56, shape: 'hex' }, africa: { h: 330, s: 78, shape: 'plus' }, americas_oceania: { h: 268, s: 72, shape: 'star' }, modern_currents: { h: 66, s: 74, shape: 'cross' },
};
function atlPalette(ix, light) {
  const fam = {}; ix.groups.forEach((g) => { const st = ATL_GROUP_STYLE[g.id] || { h: 200, s: 60, shape: 'circle' }; const n = g.families.length; g.families.forEach((f, i) => { const l = (light ? 40 : 62) + (i - (n - 1) / 2) * (n > 1 ? 9 : 0); fam[f] = { color: `hsl(${st.h} ${st.s}% ${Math.max(28, Math.min(80, l))}%)`, shape: st.shape, group: g.id }; }); });
  return { fam, ocean: light ? '#cfe0f0' : '#0b1527', land: light ? '#f4eedf' : '#26334f', landEdge: light ? 'rgba(60,70,90,.45)' : 'rgba(170,190,230,.38)', grid: light ? 'rgba(40,60,100,.10)' : 'rgba(150,170,220,.09)', text: light ? '#1a2336' : '#e8edf8', halo: light ? '#ffffff' : '#0a111d' };
}
function atlShape(ctx, shape, x, y, r) {
  ctx.beginPath();
  switch (shape) {
    case 'square': ctx.rect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7); break;
    case 'diamond': ctx.moveTo(x, y - r * 1.2); ctx.lineTo(x + r * 1.2, y); ctx.lineTo(x, y + r * 1.2); ctx.lineTo(x - r * 1.2, y); ctx.closePath(); break;
    case 'triup': ctx.moveTo(x, y - r * 1.15); ctx.lineTo(x + r * 1.05, y + r * 0.85); ctx.lineTo(x - r * 1.05, y + r * 0.85); ctx.closePath(); break;
    case 'tridown': ctx.moveTo(x, y + r * 1.15); ctx.lineTo(x + r * 1.05, y - r * 0.85); ctx.lineTo(x - r * 1.05, y - r * 0.85); ctx.closePath(); break;
    case 'hex': for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i; ctx.lineTo(x + r * 1.05 * Math.cos(a), y + r * 1.05 * Math.sin(a)); } ctx.closePath(); break;
    case 'plus': { const t = r * 0.42; ctx.moveTo(x - t, y - r); ctx.lineTo(x + t, y - r); ctx.lineTo(x + t, y - t); ctx.lineTo(x + r, y - t); ctx.lineTo(x + r, y + t); ctx.lineTo(x + t, y + t); ctx.lineTo(x + t, y + r); ctx.lineTo(x - t, y + r); ctx.lineTo(x - t, y + t); ctx.lineTo(x - r, y + t); ctx.lineTo(x - r, y - t); ctx.lineTo(x - t, y - t); ctx.closePath(); break; }
    case 'star': for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + Math.PI / 5 * i; const rr = i % 2 ? r * 0.5 : r * 1.25; ctx.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); } ctx.closePath(); break;
    case 'cross': { const t = r * 0.3; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.rect(-r, -t, r * 2, t * 2); ctx.rect(-t, -r, t * 2, r * 2); ctx.restore(); break; }
    default: ctx.arc(x, y, r, 0, Math.PI * 2);
  }
}
/* the sentence form of a date, with its uncertainty always visible */
const ATL_CONF = { H: 'well documented', M: 'scholarly consensus', L: 'rough estimate', C: 'contested' };
const ATL_PROM = ['', 'small community or diaspora', 'minority', 'significant minority', 'large minority', 'majority'];
const atlDate = (r) => r.date_label || (r.start_year != null ? atlFmtYear(r.start_year, r.start_circa) : '');

/* ── the map page ── */
async function atlasMapView(root, query) {
  const body = $('#abody', root);
  /* the map comes first: the page's head is one line (the place's name, as on the History page), at once and before the data loads, and the "Look closer" card, which used to sit above the map and push it down the screen, comes last, under the map and its list (SA-12) */
  const lead = root.querySelector('.page-head'); if (lead && lead.classList) lead.classList.add('compact');
  body.innerHTML = '<div class="card"><p class="t2" id="atlLoad">Opening the map…</p></div>';
  let ix; try { ix = await ATLD.open(); await ATLD.need('land'); } catch (e) { body.innerHTML = `<div class="card"><div class="callout warn">${icon('warn')}<div>The map data was not found. It lives in an <b>atlas</b> folder next to <b>Lamplighter.html</b> (the same place as <b>texts</b>).</div></div></div>`; return; }
  if (root.isConnected === false) return;
  const cfg = ix.cfg; const stops = cfg.slider_scale.stops; const bands = cfg.eras.bands; const core = ix.core; const MAXY = stops[stops.length - 1].year; const MINY = stops[0].year;
  const places = await ATLD.places(); const light = () => document.documentElement.dataset.theme === 'light'; let pal = atlPalette(ix, light());
  /* state, restored from the address */
  const num = (v, d) => (v != null && v !== '' && Number.isFinite(+v) ? +v : d);
  /* a lens may open zoomed in: east-up is a tall, narrow world, so it starts closer */
  const lensZoom = (id) => (ATL_LENSES.find((l) => l.id === id) || {}).zoom || 1;
  const st = { y: atlSnap(clamp(num(query.y, 800), MINY, MAXY)), sel: ix.trad[query.sel] ? query.sel : '', group: ix.groups.some((g) => g.id === query.g) ? query.g : '', family: ix.fam[query.f] ? query.f : '', practice: ix.practiceBy[query.p] ? query.p : '', q: '', lens: ATL_LENSES.find((l) => l.id === query.lens) ? query.lens : 'modern',
    zoom: clamp(num(query.z, lensZoom(ATL_LENSES.find((l) => l.id === query.lens) ? query.lens : 'modern')), 1, 40), px: num(query.cx, 0), py: num(query.cy, 0), speed: 1, playing: false, arcs: query.arcs !== '0', events: query.ev !== '0', sites: query.sites === '1', pin: null, story: false, storyAt: -1 };
  if (query.pin) { const [k, id] = String(query.pin).split(':'); st.pin = { k, id }; }
  let allow = null; let relSet = null; let allowVer = 0; const recompute = () => { allowVer++; allow = atlFilterSet(ix, { group: st.group, family: st.family, practice: st.practice, q: st.q }); relSet = st.sel ? new Set([st.sel, ...atlLineage(ix, st.sel), ...atlDescendants(ix, st.sel)]) : null; };
  recompute();
  const lensOf = () => ATL_LENSES.find((l) => l.id === st.lens) || ATL_LENSES[0];
  const pos = () => atlYearPos(st.y, stops); const windowYears = () => { const p = pos(); return Math.max(20, Math.abs(atlPosYear(Math.min(1, p + 0.05), stops) - atlPosYear(Math.max(0, p - 0.05), stops))); };

  body.innerHTML = `<div class="atl-wrap">
    <section class="card atl-mapcard">
      <div class="row atl-tools"><label class="small t2" for="atlLens">View</label><select class="select" id="atlLens" style="width:auto;max-width:300px" aria-label="Way of looking at the world">${ATL_LENSES.map((l) => `<option value="${l.id}"${l.id === st.lens ? ' selected' : ''}>${esc(l.name)}</option>`).join('')}</select>
        <span class="row tight"><label class="chk"><input type="checkbox" id="atlArcs"${st.arcs ? ' checked' : ''}><span class="small">Links</span></label><label class="chk"><input type="checkbox" id="atlEv"${st.events ? ' checked' : ''}><span class="small">Events</span></label><label class="chk"><input type="checkbox" id="atlSites"${st.sites ? ' checked' : ''}><span class="small">Sites</span></label></span>
        <span class="row tight" style="margin-left:auto"><button class="btn sm ghost" id="atlZoomOut" type="button" aria-label="Zoom out">−</button><button class="btn sm ghost" id="atlZoomIn" type="button" aria-label="Zoom in">+</button><button class="btn sm ghost" id="atlReset" type="button">Reset view</button><button class="btn sm ghost" id="atlShare" type="button" title="Copy a link to this exact view">${icon('link')}Share</button></span></div>
      <div class="small t2" id="atlLensNote" style="margin:2px 0 8px"></div>
      <div class="atl-canvaswrap" id="atlWrap" tabindex="0" role="application" aria-label="Map of the world's religions at the chosen year. Left and right arrows change the year. Plus and minus zoom. The list beside the map says what is on it."><canvas id="atlMap"></canvas><div class="atl-tip" id="atlTip" hidden></div><div class="atl-readout"><b id="atlYear"></b><span id="atlEra" class="small"></span></div></div>
      <div class="atl-time"><div class="atl-bands" id="atlBands" aria-hidden="true"></div><canvas id="atlDens" height="54" aria-hidden="true"></canvas>
        <input class="atl-slider" id="atlSlider" type="range" min="0" max="10000" step="1" aria-label="Year">
        <div class="row atl-transport"><button class="btn sm" id="atlBack" type="button" aria-label="Step back">⏮</button><button class="btn sm primary" id="atlPlay" type="button" aria-label="Play">${icon('play')}<span>Play</span></button><button class="btn sm" id="atlFwd" type="button" aria-label="Step forward">⏭</button>
          <label class="small t2" for="atlSpeed">Speed</label><select class="select" id="atlSpeed" style="width:auto" aria-label="Playback speed"><option value="0.25">¼×</option><option value="0.5">½×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option></select>
          <button class="btn sm" id="atlStory" type="button" title="Stop at the biggest moments in turn">${icon('sparkle')}Story</button><span class="small muted" id="atlHint">Click a mark for that tradition’s timeline, texts and beliefs. Arrow keys step through time. Drag the map; scroll to zoom.</span></div><div id="atlCal" class="atl-cal small" style="margin-top:6px"></div></div>
      <div class="atl-filters" style="margin-top:12px"><div class="row tight" id="atlChips" role="group" aria-label="Family groups"></div>
        <div class="row" style="margin-top:8px"><select class="select" id="atlFam" aria-label="Family" style="width:auto;max-width:260px"></select><select class="select" id="atlPrac" aria-label="Practice" style="width:auto;max-width:260px"></select>
          <div class="atl-find" style="flex:1;min-width:200px;max-width:340px"><input class="input" id="atlQ" type="search" placeholder="Find a tradition…" aria-label="Find a tradition" autocomplete="off" style="width:100%"><div class="atl-sugg" id="atlSugg" hidden></div></div><button class="btn sm ghost" id="atlClearF" type="button" hidden>Clear filters</button></div></div>
      <p class="hint" style="margin-top:8px">The map shows where each tradition was found and roughly how strongly, not borders and not headcounts. Size is the approximate share of the local population (1 small community, 5 majority). Pale, fading marks are uncertain beginnings or endings. Dates are scholars’ estimates.</p>
    </section>
    <aside class="atl-side" id="atlSide"></aside>${typeof storyLookCloser === 'function' ? storyLookCloser() : ''}</div>
    <div class="sr-only-live" id="atlLive" aria-live="polite"></div>`;
  const cv = $('#atlMap', body); const ctx = cv.getContext('2d'); const wrap = $('#atlWrap', body); const tip = $('#atlTip', body); const slider = $('#atlSlider', body);
  const land = document.createElement('canvas'); const lctx = land.getContext('2d'); const blobL = document.createElement('canvas'); const bctx = blobL.getContext('2d');   /* blobL: the soft country-level blobs, drawn at half size (they are blurs, so nobody can tell) and laid over the map in one piece */ let W = 0; let H = 0; let dpr = 1; let hits = []; let queued = false; let landDirty = true; let ready = false; let sideTimer = null; let liveTimer = null;
  let landHard = true; let landForce = false; let landStamp = null; let landMx = 0; let landMy = 0; let landMxD = 0; let landMyD = 0; let settleTimer = 0; let warmTimer = 0; let sideWired = false; let fontFam = '';
  const bodyFont = () => fontFam || (fontFam = getComputedStyle(document.body).fontFamily);   /* read once, not on every frame: reading it forces the page to work out its styles */
  const sprite = new Map();
  let visKey = ''; let visVal = null;      /* the rows on the map depend on the year and the filters, not on pan or zoom, so they are worked out once per year */
  const ringCache = { lon0: null, by: {} };   /* the coastlines, unwrapped around the centre longitude once for each level of detail, with their bounding boxes */
  const BLOB_SIZES = [8, 11, 16, 23, 32, 45, 64, 91, 128, 181];
  const marks = new Map();   /* one small picture for each shape, colour and size of mark: copying a picture is far cheaper than filling and outlining a path, and a frame has about a thousand marks */
  const markSprite = (f, rad) => {
    const key = f.color + '|' + f.shape + '|' + rad; let o = marks.get(key); if (o) return o; const m = Math.ceil(rad * 1.3 + 2); const px = Math.ceil(m * 2 * dpr); let c = null; let g = null;
    if (typeof OffscreenCanvas === 'function') { try { c = new OffscreenCanvas(px, px); g = c.getContext('2d'); } catch (e) { c = g = null; } }
    if (!g) { c = document.createElement('canvas'); c.width = c.height = px; g = c.getContext('2d'); }
    g.setTransform(px / (m * 2), 0, 0, px / (m * 2), 0, 0); atlShape(g, f.shape, m, m, rad); g.fillStyle = f.color; g.fill(); g.lineWidth = 1; g.strokeStyle = pal.halo; g.globalAlpha = 0.9; g.stroke();
    o = { cv: c.transferToImageBitmap ? c.transferToImageBitmap() : c, w: m * 2 }; marks.set(key, o); return o;   /* a bitmap, not a canvas: browsers copy a bitmap straight to the screen, but must take a snapshot of a canvas every time */
  };
  const clearMarks = () => { for (const o of marks.values()) { if (o.cv && o.cv.close) { try { o.cv.close(); } catch (e) { /* already closed */ } } } marks.clear(); };
  const blobSprite = (color, R) => { const key = color + '|' + R; let c = sprite.get(key); if (c) return c; c = document.createElement('canvas'); c.width = c.height = R * 2; const g = c.getContext('2d'); const gr = g.createRadialGradient(R, R, 0, R, R, R); gr.addColorStop(0, color.replace('hsl(', 'hsla(').replace(')', ' / .62)')); gr.addColorStop(0.55, color.replace('hsl(', 'hsla(').replace(')', ' / .28)')); gr.addColorStop(1, color.replace('hsl(', 'hsla(').replace(')', ' / 0)')); g.fillStyle = gr; g.fillRect(0, 0, R * 2, R * 2); sprite.set(key, c); return c; };
  /* ── motion: the live view eases toward its targets, a drag glides on when let go, and nothing is redrawn more than once a frame ── */
  const mo = { raf: 0, last: 0, t: { zoom: st.zoom, ax: 0, ay: 0, px: null, py: null, vz: 0, vpx: 0, vpy: 0 }, g: { vx: 0, vy: 0 } };
  const calm = () => (typeof prefersReducedMotion === 'function' && prefersReducedMotion());   /* reduced motion: every move lands at once */
  const geo = () => { const l = lensOf(); return { w: W, h: H, lon0: l.lon0, rot: l.rot }; };
  const rest = () => { mo.t.vz = mo.t.vpx = mo.t.vpy = 0; };   /* the springs have no speed left */
  const stopMotion = () => { mo.g.vx = mo.g.vy = 0; mo.t.px = mo.t.py = null; mo.t.zoom = st.zoom; rest(); };
  function frame(now) {
    mo.raf = 0; if (!alive) return; const dt = mo.last ? Math.min(48, now - mo.last) : 16; mo.last = now;
    const m = { zoom: st.zoom, px: st.px, py: st.py }; const moving = atlStepMotion(m, mo.t, mo.g, geo(), dt);
    if (m.zoom !== st.zoom || m.px !== st.px || m.py !== st.py) { st.zoom = m.zoom; st.px = m.px; st.py = m.py; landDirty = true; }
    queued = false; draw();
    if (moving) mo.raf = requestAnimationFrame(frame); else { mo.last = 0; urlSync(); }
  }
  const kick = () => { if (!mo.raf && alive) { mo.last = 0; mo.raf = requestAnimationFrame(frame); } };
  const view = () => { const l = lensOf(); const v = atlView({ w: W, h: H, lon0: l.lon0, rot: l.rot, zoom: st.zoom, px: st.px, py: st.py }); const c = v.clamp(); st.px = c.px; st.py = c.py; return atlView({ w: W, h: H, lon0: l.lon0, rot: l.rot, zoom: st.zoom, px: st.px, py: st.py }); };

  /* ── size, land layer ── */
  const resize = (force) => { const r = wrap.getBoundingClientRect(); const w2 = Math.max(280, Math.round(r.width)); if (!force && w2 === W && cv.width) return; const h2 = Math.round(clamp(w2 * (lensOf().rot === 90 ? 0.95 : 0.41), 260, 700)); dpr = Math.min(2, window.devicePixelRatio || 1); wrap.style.height = h2 + 'px'; W = w2; H = h2; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; let mf = 0.25; while (mf > 0.02 && (cv.width * (1 + 2 * mf)) * (cv.height * (1 + 2 * mf)) > 1.6e7) mf *= 0.7; landMxD = Math.round(cv.width * mf); landMyD = Math.round(cv.height * mf); landMx = landMxD / dpr; landMy = landMyD / dpr; land.width = cv.width + 2 * landMxD; land.height = cv.height + 2 * landMyD; blobL.width = Math.max(1, Math.round(cv.width / 2)); blobL.height = Math.max(1, Math.round(cv.height / 2)); fontFam = ''; clearMarks(); landDirty = true; landHard = true; if (ready) { queued = false; draw(); } else schedule(); };
  const ringsFor = (lvl, v) => {
    if (ringCache.lon0 !== v.lon0) { ringCache.lon0 = v.lon0; ringCache.by = {}; }
    if (ringCache.by[lvl]) return ringCache.by[lvl];
    /* unwrap each ring around the centre longitude so a ring is never torn across the seam; this depends only on the level and the centre, so it is done once, not on every pan */
    const src = atlLand(lvl) || []; const list = src.map((ring) => {
      let prev = null; const n = ring.length / 2; const us = new Float32Array(n); const la = new Float32Array(n); let minU = 1e9; let maxU = -1e9; let minLa = 1e9; let maxLa = -1e9;
      for (let i = 0; i < ring.length; i += 2) { let u = v.wrapLon(ring[i]); if (prev != null) { while (u - prev > 180) u -= 360; while (u - prev < -180) u += 360; } prev = u; us[i / 2] = u; la[i / 2] = ring[i + 1]; if (u < minU) minU = u; if (u > maxU) maxU = u; if (ring[i + 1] < minLa) minLa = ring[i + 1]; if (ring[i + 1] > maxLa) maxLa = ring[i + 1]; }
      return { us, la, minU, maxU, minLa, maxLa };
    });
    ringCache.by[lvl] = list; return list;
  };
  /* the finer coastlines are unwrapped a moment after the map opens, so the first zoom past 3 does not stop to do it */
  const warmRings = () => { clearTimeout(warmTimer); warmTimer = setTimeout(() => { if (alive && atlLand('l50')) ringsFor('l50', view()); }, 700); };
  /* ── the land picture: drawn once for a view, on a canvas that reaches a quarter of the window past it on every side, and then only moved and scaled while the map pans and zooms (paintLand). A new one is drawn
        when the moved one would show an edge or look stretched, and again a moment after the motion stops, so a map at rest is always sharp. Drawing the coastlines is the slow part of a frame; moving a picture is not. ── */
  const rasterLand = (v) => {
    lctx.setTransform(dpr, 0, 0, dpr, landMxD, landMyD); const X0 = -landMx; const Y0 = -landMy; const WW = W + 2 * landMx; const HH = H + 2 * landMy;
    lctx.clearRect(X0, Y0, WW, HH); lctx.fillStyle = light() ? '#f3f6fa' : '#070c15'; lctx.fillRect(X0, Y0, WW, HH);
    lctx.save(); lctx.beginPath(); v.outline().forEach(([x, y], i) => (i ? lctx.lineTo(x, y) : lctx.moveTo(x, y))); lctx.closePath(); lctx.clip(); lctx.fillStyle = pal.ocean; lctx.fillRect(X0, Y0, WW, HH);
    lctx.strokeStyle = pal.grid; lctx.lineWidth = 1; const snap = (n) => Math.round(n) + 0.5;
    for (let la = -60; la <= 80; la += 20) { const [x1, y1] = v.toScreen(v.lon0 - 179.99, la); const [x2, y2] = v.toScreen(v.lon0 + 179.99, la); lctx.beginPath(); lctx.moveTo(snap(x1), snap(y1)); lctx.lineTo(snap(x2), snap(y2)); lctx.stroke(); }
    for (let lo = -150; lo <= 180; lo += 30) { const [x1, y1] = v.toScreen(v.lon0 + lo, ATLAS_LAT.max); const [x2, y2] = v.toScreen(v.lon0 + lo, ATLAS_LAT.min); lctx.beginPath(); lctx.moveTo(snap(x1), snap(y1)); lctx.lineTo(snap(x2), snap(y2)); lctx.stroke(); }
    lctx.fillStyle = pal.land; lctx.strokeStyle = pal.landEdge; lctx.lineWidth = 0.8;
    const rings = ringsFor(v.zoom >= 3 && atlLand('l50') ? 'l50' : 'l110', v);
    for (let c = -1; c <= 1; c++) {
      const af = v.affine(c);
      for (const rg of rings) {
        const us = rg.us; const la = rg.la; if (us.length < 2) continue;
        /* a ring (or a copy of the world) that lies wholly off the canvas is not drawn: at high zoom that is nearly all of them */
        const x1 = af.x0 + af.xu * rg.minU + af.xl * rg.maxLa; const y1 = af.y0 + af.yu * rg.minU + af.yl * rg.maxLa; const x2 = af.x0 + af.xu * rg.maxU + af.xl * rg.minLa; const y2 = af.y0 + af.yu * rg.maxU + af.yl * rg.minLa;
        if (Math.max(x1, x2) < X0 - 2 || Math.min(x1, x2) > X0 + WW + 2 || Math.max(y1, y2) < Y0 - 2 || Math.min(y1, y2) > Y0 + HH + 2) continue;
        lctx.beginPath(); lctx.moveTo(af.x0 + af.xu * us[0] + af.xl * la[0], af.y0 + af.yu * us[0] + af.yl * la[0]);
        for (let i = 1; i < us.length; i++) lctx.lineTo(af.x0 + af.xu * us[i] + af.xl * la[i], af.y0 + af.yu * us[i] + af.yl * la[i]);
        lctx.closePath(); lctx.fill(); lctx.stroke();
      }
    }
    lctx.restore(); landStamp = { k: v.k, px: v.px, py: v.py }; landDirty = false; landHard = false; landForce = false;
  };
  const paintLand = (v) => {
    const cur = { k: v.k, px: v.px, py: v.py, w: W, h: H };
    let plan = landStamp && !landHard && !landForce ? atlLayerPlan(landStamp, cur, landMx, landMy) : null;
    if (!plan || !plan.ok) { rasterLand(v); plan = atlLayerPlan(landStamp, cur, landMx, landMy); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (plan.still) ctx.drawImage(land, -landMxD, -landMyD);
    else {
      const hw = W / 2; const hh = H / 2; let tx = dpr * (hw + (-landMx - hw) * plan.s + plan.dx); let ty = dpr * (hh + (-landMy - hh) * plan.s + plan.dy);
      if (Math.abs(plan.s - 1) < 1e-9) { tx = Math.round(tx); ty = Math.round(ty); }   /* a pure pan lands on whole pixels, so the coastlines do not blur */
      ctx.setTransform(plan.s, 0, 0, plan.s, tx, ty); ctx.drawImage(land, 0, 0);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    clearTimeout(settleTimer); settleTimer = 0;
    if (!plan.still) settleTimer = setTimeout(() => { settleTimer = 0; if (alive) { landForce = true; schedule(); } }, 160);
  };

  /* ── the scene ── */
  const siteList = () => ATLD.get('sites');
  const eventsList = () => ATLD.get('events');
  function draw() {
    const v = view(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); paintLand(v);
    ctx.save(); ctx.beginPath(); v.outline().forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.clip();
    const win = windowYears(); const fade = Math.max(2, win * 0.02); const vkey = st.y + '|' + allowVer; if (vkey !== visKey || !visVal) { visVal = atlVisible(core, st.y, fade, allow ? (r) => allow.has(r.tradition_id) : null); visKey = vkey; } const vis = visVal; hits = [];
    const dim = (rt) => (st.sel && !relSet.has(rt) ? 0.2 : 1);
    const blobs = []; const pts = [];
    for (const { r, a } of vis) { (r.place_id ? pts : blobs).push({ r, a }); }
    const copies = [-1, 0, 1]; const P = [0, 0]; const inView = (x, y, m) => x > -m && x < W + m && y > -m && y < H + m;
    // country-level rows: large soft blobs
    bctx.setTransform(dpr / 2, 0, 0, dpr / 2, 0, 0); bctx.clearRect(0, 0, W, H); let nb = 0;
    for (const { r, a } of blobs) {
      const f = pal.fam[ix.trad[r.tradition_id].family_id]; const deg = [0, 2.4, 3.6, 5.4, 8, 11.5][r.prominence] || 3; const R = clamp(deg * v.k, 10, 170); const sp = blobSprite(f.color, BLOB_SIZES.find((n) => n >= R) || 181);   /* the size follows the zoom smoothly: a sprite of the next size up is scaled down to it */ const al = a * dim(r.tradition_id);
      for (const c of copies) { v.toXY(r.lon, r.lat, c, P); const x = P[0]; const y = P[1]; if (!inView(x, y, R)) continue; bctx.globalAlpha = Math.min(1, al * 0.9); bctx.drawImage(sp, x - R, y - R, R * 2, R * 2); nb++; hits.push([x, y, Math.min(R * 0.5, 26), r, true]); }
    }
    ctx.globalAlpha = 1; if (nb) ctx.drawImage(blobL, 0, 0, W, H);
    // optional layers under the points
    if (st.sites && siteList()) { ctx.fillStyle = pal.text; for (const s of siteList()) { if (s.year_start > st.y || (s.year_end != null && s.year_end < st.y)) continue; if (allow && s.tradition_id && !allow.has(s.tradition_id)) continue; for (const c of copies) { v.toXY(s.lon, s.lat, c, P); const x = P[0]; const y = P[1]; if (!inView(x, y, 6)) continue; ctx.globalAlpha = 0.75; ctx.fillRect(x - 2, y - 2, 4, 4); hits.push([x, y, 6, s, 'site']); } } ctx.globalAlpha = 1; }
    // interactions as arcs
    if (st.arcs) {
      const act = atlInteractionsAt(core, st.y, Math.max(3, win * 0.01)).filter((r) => (!allow || allow.has(r.source_id) || allow.has(r.target_id)) && (!st.sel || r.source_id === st.sel || r.target_id === st.sel || (relSet && (relSet.has(r.source_id) && relSet.has(r.target_id))))).slice(0, st.sel ? 300 : 160);
      const G = cfg.interaction_groups; const kind = (t) => (G.lineage.types.includes(t) ? 'lineage' : G.exchange.types.includes(t) ? 'exchange' : 'pressure');
      for (const r of act) {
        const s = ix.trad[r.source_id]; if (!s || s.origin_lat == null || r.lat == null) continue; const k = kind(r.type); const du = v.wrapLon(r.lon) - v.wrapLon(s.origin_lon); const c = du > 180 ? -1 : du < -180 ? 1 : 0;
        const [x1, y1] = v.toScreen(s.origin_lon, s.origin_lat, 0); const [x2, y2] = v.toScreen(r.lon, r.lat, c); if (!inView(x1, y1, 400) && !inView(x2, y2, 400)) continue;
        const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2; const d = Math.hypot(x2 - x1, y2 - y1); const nx = -(y2 - y1) / (d || 1); const ny = (x2 - x1) / (d || 1); const bend = Math.min(90, d * 0.25);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx + nx * bend, my + ny * bend - bend * 0.3, x2, y2);
        ctx.strokeStyle = k === 'lineage' ? (light() ? '#2a54d9' : '#9db8ff') : k === 'exchange' ? (light() ? '#0a8f7d' : '#4fe3c8') : (light() ? '#c03340' : '#ff7d8a'); ctx.lineWidth = k === 'pressure' ? 2.2 : 1.4; ctx.setLineDash(k === 'exchange' ? [5, 4] : k === 'pressure' ? [] : []); ctx.globalAlpha = st.sel ? 0.9 : 0.5; ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(x2, y2, 2.6, 0, Math.PI * 2); ctx.fillStyle = ctx.strokeStyle; ctx.fill();
      }
    }
    // place rows: sharper points with shapes
    pts.sort((p, q) => p.r.prominence - q.r.prominence);
    for (const { r, a } of pts) {
      const f = pal.fam[ix.trad[r.tradition_id].family_id]; const rad = 2.6 + 1.5 * r.prominence; const al = a * dim(r.tradition_id); const selected = st.sel === r.tradition_id;
      for (const c of copies) {
        v.toXY(r.lon, r.lat, c, P); const x = P[0]; const y = P[1]; if (!inView(x, y, rad + 14)) continue;
        const pulse = atlPulse(r, st.y, Math.max(3, win * 0.03)); if (pulse > 0) { ctx.beginPath(); ctx.arc(x, y, rad + 4 + (1 - pulse) * 22, 0, Math.PI * 2); ctx.strokeStyle = f.color; ctx.globalAlpha = pulse * 0.8; ctx.lineWidth = 2; ctx.stroke(); }
        ctx.globalAlpha = Math.min(1, al); if (selected) { ctx.beginPath(); ctx.arc(x, y, rad + 6, 0, Math.PI * 2); ctx.strokeStyle = pal.text; ctx.lineWidth = 2; ctx.stroke(); }
        const mk = markSprite(f, rad); ctx.drawImage(mk.cv, x - mk.w / 2, y - mk.w / 2, mk.w, mk.w); ctx.globalAlpha = 1;
        hits.push([x, y, rad + 3, r, false]);
      }
    }
    // major moments close to this year, as small outlined diamonds
    if (st.events && eventsList()) {
      const minImp = Math.max(4, atlMinImportance(win * 10, cfg.event_density.rules)); let n = 0; ctx.lineWidth = 1.5; ctx.strokeStyle = light() ? '#6a2fe0' : '#ffd36e';
      for (const e of eventsList()) { if (e.i < minImp || e.la == null || e.ys > st.y || e.ys < st.y - win * 0.04) continue; if (allow && e.t && !allow.has(e.t)) continue; if (n > 40) break; n++; for (const c of copies) { v.toXY(e.lo, e.la, c, P); const x = P[0]; const y = P[1]; if (!inView(x, y, 8)) continue; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x + 4.5, y); ctx.lineTo(x, y + 6); ctx.lineTo(x - 4.5, y); ctx.closePath(); ctx.stroke(); hits.push([x, y, 8, e, 'event']); } }
    }
    // a pinned text or site ("show on map")
    if (st.pinPos) { for (const c of copies) { const [x, y] = v.toScreen(st.pinPos.lon, st.pinPos.lat, c); if (!inView(x, y, 30)) continue; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.strokeStyle = '#ff3d71'; ctx.lineWidth = 3; ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fillStyle = '#ff3d71'; ctx.fill(); ctx.font = '600 12px ' + bodyFont(); ctx.lineWidth = 3; ctx.strokeStyle = pal.halo; ctx.strokeText(st.pinPos.label, x + 13, y + 4); ctx.fillStyle = pal.text; ctx.fillText(st.pinPos.label, x + 13, y + 4); } }
    // labels for the most prominent traditions when zoomed in
    const labA = clamp((st.zoom - 1.55) / 0.5, 0, 1);   /* the names fade in between zoom 1.55 and 2.05 instead of appearing all at once */
    if (labA > 0) {
      const seen = new Set(); const boxes = []; const cap = Math.min(70, Math.round((W * H / 9000) * Math.sqrt(st.zoom / 1.8))); ctx.font = '600 11.5px ' + bodyFont(); ctx.textBaseline = 'middle'; ctx.globalAlpha = labA;
      const cand = vis.filter((o) => (!st.sel || relSet.has(o.r.tradition_id))).sort((p, q) => q.r.prominence - p.r.prominence || p.r.id.localeCompare(q.r.id)).slice(0, 300);
      for (const { r } of cand) {
        if (seen.has(r.tradition_id) || boxes.length >= cap) continue; const [x, y] = v.toScreen(r.lon, r.lat, 0); if (!inView(x, y, -6)) continue; const name = ix.trad[r.tradition_id].name; const tw = ctx.measureText(name).width; const bx = [x + 8, y - 8, tw + 4, 16];
        if (boxes.some((b) => bx[0] < b[0] + b[2] && bx[0] + bx[2] > b[0] && bx[1] < b[1] + b[3] && bx[1] + bx[3] > b[1])) continue; boxes.push(bx); seen.add(r.tradition_id);
        ctx.lineWidth = 3; ctx.strokeStyle = pal.halo; ctx.strokeText(name, x + 10, y); ctx.fillStyle = pal.text; ctx.fillText(name, x + 10, y);
      }
    }
    ctx.restore();
  }
  function schedule() { if (queued) return; queued = true; const run = () => { if (!queued) return; queued = false; if (alive) draw(); }; requestAnimationFrame(run); setTimeout(run, 80); }
  let alive = true;

  /* ── time ── */
  const eraBar = () => { $('#atlBands', body).innerHTML = bands.map((b) => `<span style="left:${(atlYearPos(b.start, stops) * 100).toFixed(2)}%;width:${((atlYearPos(b.end, stops) - atlYearPos(b.start, stops)) * 100).toFixed(2)}%" title="${esc(b.label)}: ${esc(b.blurb)}"><i>${esc(b.label)}</i></span>`).join(''); };
  const dens = $('#atlDens', body); let densData = null;
  const drawDensity = () => {
    const w2 = Math.max(200, Math.round(dens.getBoundingClientRect().width)); const dw = Math.round(w2 * dpr); const dh = Math.round(54 * dpr); if (dens.width !== dw || dens.height !== dh) { dens.width = dw; dens.height = dh; dens.style.height = '54px'; } const g = dens.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w2, 54);
    if (!densData) densData = atlDensity(ix, stops, 160, allow ? (r) => allow.has(r.tradition_id) : null); const { groups, data, max } = densData; const bw = w2 / 160;
    for (let b = 0; b < 160; b++) { let yb = 54; for (let gi = 0; gi < groups.length; gi++) { const n = data[gi][b]; if (!n) continue; const hgt = (n / Math.max(1, max)) * 50; const st2 = ATL_GROUP_STYLE[groups[gi]] || { h: 200, s: 60 }; g.fillStyle = `hsl(${st2.h} ${st2.s}% ${light() ? 46 : 60}%)`; g.globalAlpha = 0.9; g.fillRect(b * bw, yb - hgt, bw + 0.5, hgt); yb -= hgt; } }
    g.globalAlpha = 1; const x = pos() * w2; g.fillStyle = pal.text; g.fillRect(x - 1, 0, 2, 54);
  };
  const setYear = (y, opt = {}) => {
    const ny = atlSnap(clamp(y, MINY, MAXY), y >= st.y ? 1 : -1); if (ny === st.y && !opt.force) return; st.y = ny; slider.value = Math.round(pos() * 10000); slider.setAttribute('aria-valuetext', atlFmtYear(st.y)); $('#atlYear', body).textContent = atlFmtYear(st.y);
    const era = atlEraOf(st.y, bands); $('#atlEra', body).textContent = era.label; schedule(); drawDensity(); soonSide(); soonLive(); urlSoon();
    const cal = $('#atlCal', body); if (cal && typeof calChips === 'function') cal.innerHTML = calChips(st.y);
  };
  const stepKey = (dir, big) => setYear(atlNudge(st.y, dir * (big ? 0.02 : 0.0025), stops));

  /* ── the side panel and the text list (what a screen reader reads, and what everyone can scan) ── */
  const famName = (id) => (ix.fam[id] || {}).name || id;
  const swatch = (gid) => { const s = ATL_GROUP_STYLE[gid] || { h: 200, s: 60 }; return `<span class="atl-sw" style="background:hsl(${s.h} ${s.s}% 56%)" aria-hidden="true"></span>`; };
  const nowOnMap = () => { const rows = atlPresent(core, st.y).filter((r) => !allow || allow.has(r.tradition_id)); const by = {}; rows.forEach((r) => { const o = by[r.tradition_id] || (by[r.tradition_id] = { id: r.tradition_id, p: 0, n: 0, places: [] }); o.p = Math.max(o.p, r.prominence); o.n++; if (o.places.length < 4) o.places.push(atlPlaceName(places, ix.countries, r)); }); return { rows, list: Object.values(by).sort((a, b) => b.p - a.p || b.n - a.n || ix.trad[a.id].name.localeCompare(ix.trad[b.id].name)) }; };
  function fillFilters() {
    const { list } = nowOnMap(); const counts = {}; list.forEach((o) => { const g = atlGroupOf(ix, o.id); counts[g] = (counts[g] || 0) + 1; });
    $('#atlChips', body).innerHTML = ix.groups.map((g) => `<button class="chip" type="button" data-grp="${g.id}" aria-pressed="${st.group === g.id}">${swatch(g.id)}${esc(g.label)} <span class="muted">${counts[g.id] || 0}</span></button>`).join('');
    const fam = $('#atlFam', body); const fams = core.families.filter((f) => !st.group || ix.groups.find((g) => g.id === st.group).families.includes(f.id)); const fh = '<option value="">Every family</option>' + fams.map((f) => `<option value="${f.id}"${st.family === f.id ? ' selected' : ''}>${esc(f.name)}</option>`).join(''); if (fam.dataset.h !== fh) { fam.innerHTML = fh; fam.dataset.h = fh; }
    const pr = $('#atlPrac', body); if (!pr.options.length) { pr.innerHTML = '<option value="">Any practice</option>' + core.practices.slice().sort((a, b) => a.name.localeCompare(b.name)).map((p) => `<option value="${p.id}">Who used: ${esc(p.name)}</option>`).join(''); } pr.value = st.practice;
    $('#atlClearF', body).hidden = !(st.group || st.family || st.practice || st.q);
  }
  function side() {
    const { rows, list } = nowOnMap(); fillFilters();
    const win = windowYears(); const evs = atlMoments(eventsList() || [], st.y - win * 0.05, st.y + win * 0.05, atlMinImportance(win * 10, cfg.event_density.rules), st.y, 8);
    $('#atlSide', body).innerHTML = `<section class="card flat atl-card"><div class="card-title"><h3>On the map now</h3><span class="muted small">${list.length} tradition${list.length === 1 ? '' : 's'} · ${rows.length} place${rows.length === 1 ? '' : 's'}</span></div><ol class="plain atl-list" id="atlList">${list.slice(0, 12).map((o) => listItem(o)).join('') || '<li class="t2 small">Nothing at this year with these filters.</li>'}</ol>${list.length > 12 ? `<details class="atl-more"><summary class="small">All ${list.length}</summary><ol class="plain atl-list">${list.slice(12, 400).map((o) => listItem(o)).join('')}</ol>${list.length > 400 ? `<p class="small muted">The first 400 are listed.</p>` : ''}</details>` : ''}</section>
      <section class="card flat atl-card"><div class="card-title"><h3>Moments around this time</h3></div>${evs.length ? `<ul class="plain atl-events">${evs.map((e) => `<li><b>${esc(atlFmtYear(e.ys))}</b> ${esc(e.l)}${e.i >= 5 ? ' <span class="tag">major</span>' : ''}</li>`).join('')}</ul>` : '<p class="small t2">No major moments in this window. Zoom the slider in on one era to see more.</p>'}</section>
      <section class="card flat atl-card"><div class="card-title"><h3>Reading the map</h3></div><div class="small t2">${[['arc-line', 'Grew out of, split from or reformed'], ['arc-ex', 'Influence, blending, exchange'], ['arc-pr', 'Conflict, suppression, conversion']].map(([c, t]) => `<div class="row tight"><i class="atl-key ${c}"></i>${esc(t)}</div>`).join('')}</div><p class="hint" style="margin-top:8px">Each family group has its own colour and its own shape, so colour is never the only cue. Gold outlines are major moments.</p></section>`;
    const cal = $('#atlCal', body); if (cal) cal.innerHTML = typeof calChips === 'function' ? calChips(st.y) : '';
  }
  const listItem = (o) => { const t = ix.trad[o.id]; const g = atlGroupOf(ix, o.id); return `<li><a href="#" data-sel="${o.id}">${swatch(g)}<b>${esc(t.name)}</b></a> <span class="muted small">${esc(o.places.filter(Boolean).slice(0, 2).join(', ')) || ''}${o.n > 2 ? ` +${o.n - 2}` : ''} · ${esc(ATL_PROM[o.p])}</span></li>`; };
  const soonSide = () => { if (sideTimer) return; sideTimer = setTimeout(() => { sideTimer = null; if (alive) { side(); wireSide(); diveNow(); } }, st.playing ? 260 : 60); };
  const soonLive = () => { clearTimeout(liveTimer); liveTimer = setTimeout(() => { if (!alive) return; const { rows, list } = nowOnMap(); const top = list.slice(0, 5).map((o) => ix.trad[o.id].name).join(', '); $('#atlLive', body).textContent = `${atlFmtYear(st.y)}. ${list.length} traditions in ${rows.length} places. Most prominent: ${top || 'none'}.`; }, st.playing ? 2500 : 700); };

  /* ── address bar state (no page reload: replaceState) ── */
  const urlSync = () => { const q = new URLSearchParams(); q.set('y', st.y); if (st.sel) q.set('sel', st.sel); if (st.group) q.set('g', st.group); if (st.family) q.set('f', st.family); if (st.practice) q.set('p', st.practice); if (st.lens !== 'modern') q.set('lens', st.lens); if (Math.abs(st.zoom - lensZoom(st.lens)) > 0.01 || st.px || st.py) { q.set('z', st.zoom.toFixed(2)); q.set('cx', st.px.toFixed(1)); q.set('cy', st.py.toFixed(1)); } if (!st.arcs) q.set('arcs', '0'); if (!st.events) q.set('ev', '0'); if (st.sites) q.set('sites', '1'); if (st.pin) q.set('pin', st.pin.k + ':' + st.pin.id); try { history.replaceState(null, '', '#/atlas?' + q); } catch (e) { /* file:// in some browsers */ } };
  let urlTimer = 0; const urlSoon = () => { if (urlTimer) return; urlTimer = setTimeout(() => { urlTimer = 0; urlSync(); }, st.playing ? 600 : 150); };   /* browsers limit how often the address may change, and a play-through changes the year every frame */

  /* ── wiring ── */
  /* one listener for the whole list, set once: the list is rebuilt as the year moves, and a listener on each of its names would be thrown away and set again every time */
  function wireSide() { if (sideWired) return; sideWired = true; const s = $('#atlSide', body); s.addEventListener('click', (e) => { const a = e.target.closest('[data-sel]'); if (!a || !s.contains(a)) return; e.preventDefault(); select(a.dataset.sel, { focus: true }); }); }
  function wireFilters() {
    $('#atlChips', body).addEventListener('click', (e) => { const b = e.target.closest('[data-grp]'); if (!b) return; st.group = st.group === b.dataset.grp ? '' : b.dataset.grp; if (st.group && st.family && !ix.groups.find((g) => g.id === st.group).families.includes(st.family)) st.family = ''; refilter(); });
    $('#atlFam', body).addEventListener('change', (e) => { st.family = e.target.value; refilter(); }); $('#atlPrac', body).addEventListener('change', (e) => { st.practice = e.target.value; refilter(); });
    $('#atlClearF', body).addEventListener('click', () => { st.group = st.family = st.practice = st.q = ''; $('#atlQ', body).value = ''; refilter(); });
    const q = $('#atlQ', body); const sg = $('#atlSugg', body);
    q.addEventListener('input', () => { const v = q.value.trim(); if (v.length < 2) { sg.hidden = true; return; } const m = atlSearch(ix, v, 7); sg.innerHTML = m.map((t) => `<button type="button" class="atl-sg" data-pick="${t.id}">${esc(t.name)} <span class="muted small">${esc(atlDate(t))}</span></button>`).join('') + `<button type="button" class="atl-sg" data-filterq="${esc(v)}">Only show traditions matching “${esc(v)}”</button>`; sg.hidden = false; });
    sg.addEventListener('click', (e) => { const p = e.target.closest('[data-pick]'); const f = e.target.closest('[data-filterq]'); if (p) { const t = ix.trad[p.dataset.pick]; sg.hidden = true; q.value = ''; select(t.id); setYear(Math.max(t.start_year_latest != null ? t.start_year_latest : t.start_year, MINY)); } else if (f) { st.q = f.dataset.filterq; sg.hidden = true; refilter(); } });
  }
  function refilter() { recompute(); densData = null; drawDensity(); schedule(); side(); wireSide(); urlSync(); soonLive(); }
  let siteOff = false;      /* L-01: the panel of a pinned site that names no tradition stays until the reader closes it or chooses something else on the map */
  function select(id, o) { st.sel = id; if (!id) siteOff = true; recompute(); schedule(); side(); wireSide(); urlSync(); dive(o); }
  function focusOn(lon, lat, zoom) {
    const z = clamp(Math.max(mo.t.zoom, zoom), 1, 40); const p = atlCentreOn(Object.assign(geo(), { zoom: z }), lon, lat); mo.g.vx = mo.g.vy = 0; mo.t.zoom = z; mo.t.ax = W / 2; mo.t.ay = H / 2; mo.t.px = p.px; mo.t.py = p.py;
    if (calm()) { st.zoom = z; st.px = p.px; st.py = p.py; mo.t.px = mo.t.py = null; rest(); landDirty = true; schedule(); urlSync(); } else kick();
  }

  slider.addEventListener('input', () => setYear(atlPosYear(slider.value / 10000, stops), { force: true }));
  slider.addEventListener('keydown', (e) => { const k = e.key; if (k === 'ArrowLeft' || k === 'ArrowDown') { e.preventDefault(); stepKey(-1); } else if (k === 'ArrowRight' || k === 'ArrowUp') { e.preventDefault(); stepKey(1); } else if (k === 'PageDown') { e.preventDefault(); stepKey(-1, true); } else if (k === 'PageUp') { e.preventDefault(); stepKey(1, true); } else if (k === 'Home') { e.preventDefault(); setYear(MINY); } else if (k === 'End') { e.preventDefault(); setYear(MAXY); } });
  $('#atlBack', body).addEventListener('click', () => stepKey(-1)); $('#atlFwd', body).addEventListener('click', () => stepKey(1));
  let timer = 0; let last = 0; let playRaf = 0; const loop = () => { playRaf = 0; if (!st.playing || !alive) return; tick(); if (st.playing) playRaf = requestAnimationFrame(loop); }; const playBtn = $('#atlPlay', body);
  const tick = () => { if (!st.playing || !alive) return; const now = performance.now(); const dt = Math.min(0.12, (now - last) / 1000); last = now; const p = pos() + dt * st.speed / 45; if (p >= 1) { setYear(MAXY); play(false); return; } setYear(atlNudge(st.y, p - pos(), stops)); };
  const play = (on) => { st.playing = on; st.story = false; playBtn.querySelector('span').textContent = on ? 'Pause' : 'Play'; playBtn.setAttribute('aria-label', on ? 'Pause' : 'Play'); clearInterval(timer); cancelAnimationFrame(playRaf); playRaf = 0; if (on) { if (st.y >= MAXY) setYear(MINY); last = performance.now(); playRaf = requestAnimationFrame(loop); } };
  playBtn.addEventListener('click', () => play(!st.playing));
  $('#atlSpeed', body).addEventListener('change', (e) => { st.speed = +e.target.value; });
  /* story mode: stop at each of the biggest moments in turn */
  let story = null; let storyTimer = null; const storyCard = document.createElement('div'); storyCard.className = 'atl-story'; storyCard.hidden = true; wrap.appendChild(storyCard);
  const storyStep = (dir) => { if (!story) return; st.storyAt = clamp(st.storyAt + dir, 0, story.length - 1); const e = story[st.storyAt]; setYear(e.ys); if (e.la != null) { focusOn(e.lo, e.la, 2); } if (e.t && ix.trad[e.t]) { st.sel = e.t; recompute(); } storyCard.hidden = false; storyCard.innerHTML = `<div class="small muted">Moment ${st.storyAt + 1} of ${story.length} · ${esc(atlFmtYear(e.ys))}</div><b>${esc(e.l)}</b>${e.d ? `<div class="small t2">${esc(e.d)}</div>` : ''}<div class="row tight" style="margin-top:8px"><button class="btn sm" data-sp type="button">← Previous</button><button class="btn sm primary" data-sn type="button">Next →</button><button class="btn sm ghost" data-sx type="button">End story</button></div>`; $('[data-sp]', storyCard).addEventListener('click', () => storyStep(-1)); $('[data-sn]', storyCard).addEventListener('click', () => storyStep(1)); $('[data-sx]', storyCard).addEventListener('click', endStory); schedule(); side(); wireSide(); };
  const endStory = () => { story = null; st.storyAt = -1; storyCard.hidden = true; };
  $('#atlStory', body).addEventListener('click', async () => { if (story) { endStory(); return; } play(false); await ATLD.need('events'); story = atlStory(ATLD.get('events')); st.storyAt = story.findIndex((e) => e.ys >= st.y) - 1; storyStep(1); });
  $('#atlLens', body).addEventListener('change', (e) => { st.lens = e.target.value; st.px = st.py = 0; st.zoom = lensZoom(st.lens); stopMotion(); $('#atlLensNote', body).textContent = lensOf().blurb; resize(true); urlSync(); warmRings(); });
  $('#atlArcs', body).addEventListener('change', (e) => { st.arcs = e.target.checked; schedule(); urlSync(); });
  $('#atlEv', body).addEventListener('change', async (e) => { st.events = e.target.checked; if (st.events) await ATLD.need('events'); schedule(); urlSync(); });
  $('#atlSites', body).addEventListener('change', async (e) => { st.sites = e.target.checked; if (st.sites) await ATLD.need('sites'); schedule(); urlSync(); });
  const zoomNow = (f, cx, cy) => { const r = atlZoomAbout(Object.assign(geo(), { zoom: st.zoom, px: st.px, py: st.py }), f, cx == null ? W / 2 : cx, cy == null ? H / 2 : cy); st.zoom = r.zoom; st.px = r.px; st.py = r.py; mo.t.zoom = st.zoom; rest(); landDirty = true; schedule(); };
  const zoomBy = (f, cx, cy) => { mo.g.vx = mo.g.vy = 0; mo.t.zoom = clamp(mo.t.zoom * f, 1, 40); mo.t.ax = cx == null ? W / 2 : cx; mo.t.ay = cy == null ? H / 2 : cy; if (calm()) { zoomNow(mo.t.zoom / st.zoom, mo.t.ax, mo.t.ay); urlSync(); } else kick(); };
  $('#atlZoomIn', body).addEventListener('click', () => zoomBy(1.6)); $('#atlZoomOut', body).addEventListener('click', () => zoomBy(1 / 1.6));
  $('#atlReset', body).addEventListener('click', () => { mo.g.vx = mo.g.vy = 0; mo.t.zoom = lensZoom(st.lens); mo.t.ax = W / 2; mo.t.ay = H / 2; mo.t.px = 0; mo.t.py = 0; if (calm()) { st.zoom = mo.t.zoom; st.px = st.py = 0; mo.t.px = mo.t.py = null; rest(); landDirty = true; schedule(); urlSync(); } else kick(); });
  $('#atlShare', body).addEventListener('click', async () => { urlSync(); const ok = await rdCopy(location.href); toast(ok ? 'Link to this view copied.' : 'Copy the address from the address bar.', ok ? 'good' : '', 2200); });
  wrap.addEventListener('wheel', (e) => { e.preventDefault(); const r = cv.getBoundingClientRect(); const d = clamp(e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY, -240, 240); zoomBy(Math.exp(-d * (e.ctrlKey ? 0.01 : 0.0016)), e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  const ptrs = new Map(); let drag = null; let pinch = null;
  cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture && cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); stopMotion(); if (ptrs.size === 1) drag = { x: e.clientX, y: e.clientY, px: st.px, py: st.py, moved: 0, s: [] }; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: st.zoom }; drag = null; } });
  cv.addEventListener('pointermove', (e) => {
    const r = cv.getBoundingClientRect(); const mx = e.clientX - r.left; const my = e.clientY - r.top;
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); const f = (pinch.z * d / pinch.d) / st.zoom; zoomNow(f, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top); return; }
    if (drag && ptrs.size === 1) { const v = view(); const dx = e.clientX - drag.x; const dy = e.clientY - drag.y; drag.moved = Math.max(drag.moved, Math.hypot(dx, dy)); if (drag.moved > 3) { st.px = drag.px - dx / v.k; st.py = drag.py - dy / v.k; landDirty = true; schedule(); tip.hidden = true; drag.s.push({ t: e.timeStamp, x: st.px, y: st.py }); while (drag.s.length > 2 && e.timeStamp - drag.s[0].t > 100) drag.s.shift(); } return; }
    hover(mx, my);
  });
  /* a drag let go while still moving keeps going and slows: its velocity over the last 100 ms, in degrees of the plane per millisecond, if the finger or mouse was still moving at release */
  const glideFrom = (d, now) => { if (!d || d.moved <= 3 || calm() || !d.s || d.s.length < 2) return null; const a = d.s[0]; const b = d.s[d.s.length - 1]; const dt = b.t - a.t; if (dt < 16 || now - b.t > 80) return null; let vx = (b.x - a.x) / dt; let vy = (b.y - a.y) / dt; const k = view().k; const sp = Math.hypot(vx, vy) * k; if (sp < 0.15) return null; if (sp > 4) { vx *= 4 / sp; vy *= 4 / sp; } return [vx, vy]; };
  const endPtr = (e) => { const wasDrag = drag && drag.moved <= 3 && ptrs.size === 1; ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (wasDrag) { const r = cv.getBoundingClientRect(); click(e.clientX - r.left, e.clientY - r.top); } if (!ptrs.size) { const gl = glideFrom(drag, e.timeStamp); drag = null; if (gl) { mo.g.vx = gl[0]; mo.g.vy = gl[1]; kick(); } else urlSync(); } };
  cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr); cv.addEventListener('pointerleave', () => { tip.hidden = true; });
  const nearest = (mx, my) => { let best = null; let bd = 1e9; for (const h of hits) { const d = Math.hypot(h[0] - mx, h[1] - my); if (d <= h[2] + 3 && d / (h[2] + 3) < bd) { bd = d / (h[2] + 3); best = h; } } return best; };
  function hover(mx, my) {
    const h = nearest(mx, my); if (!h) { tip.hidden = true; cv.style.cursor = 'grab'; return; } cv.style.cursor = 'pointer'; let html = '';
    if (h[4] === 'site') html = `<b>${esc(h[3].name)}</b><div class="small">${esc(h[3].date_label)} · site</div>`;
    else if (h[4] === 'event') html = `<b>${esc(h[3].l)}</b><div class="small">${esc(h[3].d || atlFmtYear(h[3].ys))} · moment</div>`;
    else { const r = h[3]; const t = ix.trad[r.tradition_id]; html = `<b>${esc(t.name)}</b><div class="small">${esc(atlPlaceName(places, ix.countries, r))} · ${esc(r.date_label || '')}</div><div class="small muted">${esc(ATL_PROM[r.prominence])}${r.auto ? ' · origin' : ''}${r.note && !r.auto ? ' · ' + esc(r.note.slice(0, 90)) : ''}</div><div class="small atl-cue">Click for its timeline, texts and beliefs</div>`; }
    tip.innerHTML = html; tip.hidden = false; const tw = tip.offsetWidth; tip.style.left = Math.min(W - tw - 6, Math.max(6, mx + 14)) + 'px'; tip.style.top = Math.max(6, my - 10 - tip.offsetHeight / 2) + 'px';
  }
  function click(mx, my) { const h = nearest(mx, my); if (!h) { if (st.sel) select(''); return; } if (h[4] === 'site' || h[4] === 'event') { if (h[3].tradition_id || h[3].t) select(h[3].tradition_id || h[3].t); return; } select(h[3].tradition_id); }
  wrap.addEventListener('keydown', (e) => {
    if (e.target !== wrap) return; const k = e.key;
    if (k === 'ArrowLeft') { e.preventDefault(); e.shiftKey ? panBy(-60, 0) : stepKey(-1, e.altKey); } else if (k === 'ArrowRight') { e.preventDefault(); e.shiftKey ? panBy(60, 0) : stepKey(1, e.altKey); } else if (k === 'ArrowUp' && e.shiftKey) { e.preventDefault(); panBy(0, -60); } else if (k === 'ArrowDown' && e.shiftKey) { e.preventDefault(); panBy(0, 60); }
    else if (k === '+' || k === '=') { e.preventDefault(); zoomBy(1.4); } else if (k === '-' || k === '_') { e.preventDefault(); zoomBy(1 / 1.4); } else if (k === ' ') { e.preventDefault(); play(!st.playing); } else if (k === 'Escape') { select(''); }
  });
  const panBy = (dx, dy) => { const k = view().k; mo.g.vx = mo.g.vy = 0; mo.t.px = (mo.t.px != null ? mo.t.px : st.px) + dx / k; mo.t.py = (mo.t.py != null ? mo.t.py : st.py) + dy / k; if (calm()) { st.px = mo.t.px; st.py = mo.t.py; mo.t.px = mo.t.py = null; rest(); landDirty = true; schedule(); urlSync(); } else kick(); };
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { requestAnimationFrame(() => { if (alive) { const w0 = W; resize(); if (W !== w0) drawDensity(); } }); }) : null; if (ro) ro.observe(wrap);
  const onTheme = () => { pal = atlPalette(ix, light()); sprite.clear(); clearMarks(); fontFam = ''; landDirty = true; landHard = true; drawDensity(); schedule(); }; const themeObs = new MutationObserver(onTheme); themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  Atlas_leave(() => { alive = false; clearTimeout(settleTimer); clearTimeout(warmTimer); cancelAnimationFrame(mo.raf); cancelAnimationFrame(playRaf); clearTimeout(urlTimer); clearInterval(timer); clearTimeout(sideTimer); clearTimeout(liveTimer); if (ro) ro.disconnect(); themeObs.disconnect(); });


  /* ── the "dive in" panel: a click on the map opens that tradition's timeline, beliefs and texts beside it ── */
  const dv = document.createElement('aside'); dv.className = 'atl-dive'; dv.id = 'atlDive'; dv.hidden = true; dv.setAttribute('aria-label', 'Details of the chosen tradition'); document.body.appendChild(dv);
  let diveTl = null; let diveAll = false; let diveAt = -1; let diveAtYear = null; let diveToken = 0; const diveWide = () => !!(window.matchMedia && window.matchMedia('(min-width: 1240px)').matches); let diveMin = !diveWide(); /* beside the map there is room for all of it; below, it starts as a slim bar */
  const closeDive = () => { diveToken++; diveTl = null; dv.hidden = true; dv.innerHTML = ''; dv.removeAttribute('data-id'); document.body.classList.remove('atl-dive-open'); };
  async function dive(o) {
    o = o || {}; const id = st.sel; const onSite = !!(st.pin && st.pin.k === 'st');      /* opened on a site pin: the panel names the site, and can say what the records tie it to (the strip of a site) */
    if (!id && onSite && !siteOff) { await diveSite(o); return; }      /* no religion chosen: a pin on a site that names none gets a panel for the site itself (L-01) */
    if (!id || !ix.trad[id]) { closeDive(); return; }
    const tk = ++diveToken; const keep = dv.dataset.id === id ? dv.scrollTop : 0;
    try { await Promise.all([ATLD.need('events', 'texts', ...(onSite ? ['sites'] : [])), TXT.index()]); } catch (e) { /* the panel still opens with what it has */ }
    if (!alive || tk !== diveToken || st.sel !== id) return;
    const t = ix.trad[id]; diveTl = atlTraditionTimeline(ix, ATLD.get('events') || [], id, diveAll ? 0 : ATL_DIVE_MAX); diveAt = -1; diveAtYear = null;
    const pinSite = onSite ? (ATLD.get('sites') || []).find((x) => x.id === st.pin.id) : null;      /* the pin stays when another tradition is chosen on the map: its strip belongs only to the site's own religion */
    const texts = (ATLD.get('texts') || []).filter((x) => x.tradition_id === id); const rows = (ix.byTrad[id] || []).slice().sort((a, b) => a.year_start - b.year_start);
    const prac = (ix.tpOf[id] || []).map((p) => ix.practiceBy[p]).filter(Boolean); const fam = pal.fam[t.family_id];
    dv.dataset.id = id; dv.innerHTML = atlDiveHTML({ ix, t, tl: diveTl, all: diveAll, texts, prac, rows, color: fam ? fam.color : '#7d9bff', pt: atlPathTradFor(ix, id), curY: st.y, siteId: pinSite && pinSite.tradition_id === id ? pinSite.id : '', site: pinSite && pinSite.tradition_id === id ? pinSite : null });
    dv.hidden = false; dv.classList.toggle('min', diveMin && !diveWide()); const mb = $('[data-dive-min]', dv); if (mb) mb.setAttribute('aria-expanded', String(!diveMin)); dv.setAttribute('aria-label', 'Details: ' + t.name);
    document.body.classList.add('atl-dive-open'); dv.scrollTop = keep; diveNow();
    if (o.focus) { const h = $('#dvTitle', dv); if (h) h.focus(); }
    const lv = $('#atlLive', body); if (lv) lv.textContent = `Details open for ${t.name}: ${diveTl.total} dated record${diveTl.total === 1 ? '' : 's'}, ${texts.length} text${texts.length === 1 ? '' : 's'}.`;
  }
  /* the panel of a pinned site that the records tie to no religion (L-01): its title, where and when, the record's own note, and the plain sentence that no tradition is recorded */
  async function diveSite(o) {
    const tk = ++diveToken; try { await ATLD.need('sites'); } catch (e) { closeDive(); return; }
    if (!alive || tk !== diveToken || st.sel || siteOff) return;
    const s = (ATLD.get('sites') || []).find((x) => x.id === st.pin.id); if (!s || (s.tradition_id && ix.trad[s.tradition_id])) { closeDive(); return; }      /* a site with a religion opens that religion's panel (resolvePin chooses it) */
    diveTl = null; dv.dataset.id = 'st:' + s.id; dv.innerHTML = atlSiteHTML({ ix, s }); dv.hidden = false; dv.classList.toggle('min', diveMin && !diveWide()); const mb = $('[data-dive-min]', dv); if (mb) mb.setAttribute('aria-expanded', String(!diveMin)); dv.setAttribute('aria-label', 'Details: ' + s.name);
    document.body.classList.add('atl-dive-open'); dv.scrollTop = 0; if (o && o.focus) { const h = $('#dvTitle', dv); if (h) h.focus(); }
    const lv = $('#atlLive', body); if (lv) lv.textContent = `Details open for ${s.name}: a site on the map.`;
  }
  const diveNowIdx = () => (!diveTl ? -1 : diveAt >= 0 && diveAtYear === st.y && diveTl.items[diveAt] ? diveAt : atlDiveNowIndex(diveTl.items, st.y));
  function diveNow() {
    if (dv.hidden || !diveTl) return; const i = diveNowIdx();
    $$('.dv-it.now', dv).forEach((el) => { if (+el.dataset.i !== i) { el.classList.remove('now'); const b0 = $('button', el); if (b0) b0.removeAttribute('aria-current'); } });
    const nx = i >= 0 ? $('.dv-it[data-i="' + i + '"]', dv) : null; if (nx && !nx.classList.contains('now')) { nx.classList.add('now'); $('button', nx).setAttribute('aria-current', 'true'); }
    const nl = $('#dvNow', dv); if (nl) { const it = i >= 0 ? diveTl.items[i] : null; const tx = it ? atlFmtYear(it.y) + ' · ' + it.label : diveTl.items.length ? 'Before its first record, ' + atlFmtYear(diveTl.items[0].y) : ''; if (nl.textContent !== tx) nl.textContent = tx; }
  }
  function jump(i) {
    const it = diveTl && diveTl.items[i]; if (!it) return; play(false); if (story) endStory();
    setYear(it.y, { force: true }); diveAt = i; diveAtYear = st.y; if (it.lat != null && it.lon != null) focusOn(it.lon, it.lat, 2.4); else { landDirty = true; schedule(); }
    diveNow(); const row = $('.dv-it[data-i="' + i + '"]', dv); if (row && row.scrollIntoView) row.scrollIntoView({ block: 'nearest' }); const lv = $('#atlLive', body); if (lv) lv.textContent = atlFmtYear(it.y) + ': ' + it.label;
  }
  function diveStep(dir) {
    if (!diveTl || !diveTl.items.length) return; const n = diveTl.items.length; const exact = diveAt >= 0 && diveAtYear === st.y; const cur = exact ? diveAt : atlDiveNowIndex(diveTl.items, st.y);
    jump(clamp(dir > 0 ? cur + 1 : exact ? cur - 1 : (cur >= 0 && diveTl.items[cur].y < st.y ? cur : cur - 1), 0, n - 1));
  }
  dv.addEventListener('click', (e) => {
    const b = e.target.closest('button,a'); if (!b || !dv.contains(b)) return;
    if (b.dataset.sel) { e.preventDefault(); select(b.dataset.sel, { focus: true }); return; }
    if (b.hasAttribute('data-dive-close')) { select(''); return; }
    if (b.hasAttribute('data-dive-min') || b.hasAttribute('data-dive-more')) { diveMin = !diveMin; dv.classList.toggle('min', diveMin); const m = $('[data-dive-min]', dv); if (m) m.setAttribute('aria-expanded', String(!diveMin)); return; }
    if (!diveTl) return;
    if (b.hasAttribute('data-dive-start')) { jump(Math.max(0, diveTl.items.findIndex((x) => x.kind === 'tradition_start'))); return; }
    if (b.dataset.jump != null) { jump(+b.dataset.jump); return; }
    if (b.dataset.diveStep) { diveStep(+b.dataset.diveStep); return; }
    if (b.dataset.dv) { if (diveMin) { diveMin = false; dv.classList.remove('min'); const m = $('[data-dive-min]', dv); if (m) m.setAttribute('aria-expanded', 'true'); } const el = document.getElementById(b.dataset.dv); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start' }); return; }
    if (b.hasAttribute('data-dive-all') || b.hasAttribute('data-dive-few')) { diveAll = b.hasAttribute('data-dive-all'); dive(); }
  });
  const onDocKey = (e) => { if (e.key === 'Escape' && !dv.hidden && !document.querySelector('.modal-back,.pal-back') && !(e.target.closest && e.target.closest('input,select,textarea'))) select(''); };
  document.addEventListener('keydown', onDocKey);
  Atlas_leave(() => { document.removeEventListener('keydown', onDocKey); closeDive(); dv.remove(); });

  /* ── a text or site pinned from the Library ("Show on map") ── */
  const resolvePin = async () => {
    if (!st.pin) return; await ATLD.need('texts', 'sites'); const list = st.pin.k === 'tx' ? ATLD.get('texts') : ATLD.get('sites'); const it = list.find((x) => x.id === st.pin.id); if (!it) return;
    st.pinPos = { lon: it.lon, lat: it.lat, label: it.title || it.name }; if (query.y == null) setYear(Math.round(((it.year_start || 0) + (it.year_end != null ? it.year_end : it.year_start || 0)) / 2) || it.year_start, { force: true }); focusOn(it.lon, it.lat, 3); if (it.tradition_id && ix.trad[it.tradition_id]) { st.sel = it.tradition_id; recompute(); }
  };

  $('#atlLensNote', body).textContent = lensOf().blurb; wireFilters(); eraBar(); resize(true); setYear(st.y, { force: true }); side(); wireSide(); drawDensity(); draw(); ready = true; warmRings(); if (st.sel) dive(); resolvePin().then(() => { schedule(); side(); wireSide(); if ((st.sel || (st.pin && st.pin.k === 'st')) && !dv.dataset.id) dive(); });
  if (query.sites === '1') ATLD.need('sites').then(schedule); ATLD.need('events').then(() => { if (alive) { schedule(); soonSide(); } });
  window.__atlas = { st, ix, setYear, select, hits: () => hits, draw: () => { landDirty = false; draw(); }, drawAll: () => { landDirty = true; landHard = true; draw(); } }; /* handy for the console and the browser tests */
}
let ATLAS_LEAVE = [];
const Atlas_leave = (fn) => { ATLAS_LEAVE.push(fn); };
