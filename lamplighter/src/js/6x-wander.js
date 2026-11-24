/* ═══════════════════════════ 6x · Wander: follow a passage from tradition to tradition ═══════════════════════════
   Start anywhere (a random passage, or one you bring) and the page offers the closest passages in other traditions, one for each; choose one and it becomes the new starting point.
   The trail you leave is a path across the world's books, each step dated, and it can be kept as a thread. The hops are found by the same statistics as Find similar
   (shared words, shared motifs), so a hop is a place to start reading, not a claim that the two are connected. */
/* a rough year for a library entry's "when" (for ordering and for the strip of dates): "c. 1200–1000 BCE", "2nd c. CE", "1782 (texts 4th–15th c.)" */
function libYear(when) {
  const s = String(when || ''); let m = /^\s*(?:c\.\s*)?(\d{4})\b(?!\s*[–-]?\s*\d)/.exec(s); if (m) return +m[1];
  m = /(\d+)0s\s*CE/.exec(s); if (m) return +m[1] * 10;
  m = /(\d{1,3}(?:,\d{3})+|\d+)(?:\s*[–-]\s*(?:\d{1,3}(?:,\d{3})+|\d+))?\s*(BCE|CE)/.exec(s);
  if (m && !/(?:st|nd|rd|th)\s*c/i.test(s.slice(m.index, m.index + m[0].length + 4))) { const n = +m[1].replace(/,/g, ''); return m[2] === 'BCE' ? -n : n; }
  m = /(\d+)(?:st|nd|rd|th)(?:\s*[–-]\s*\d+(?:st|nd|rd|th))?\s*c\.?(?:\s*(BCE|CE))?/i.exec(s); if (m) { const n = +m[1]; return /BCE/i.test(s) ? -(n * 100 - 50) : (n - 1) * 100 + 50; }
  m = /\b(1[0-9]{3}|20[0-2][0-9])\b/.exec(s); if (m) return +m[1];
  m = /(\d{1,3}(?:,\d{3})+|\d+)\+?\s*years/i.exec(s); if (m) return -(+m[1].replace(/,/g, ''));
  return null;
}
const WANDER_HUES = [210, 280, 30, 150, 12, 180, 330, 60, 100];       // one colour per tradition, as on the map
const wanderColl = (id) => { const c = srchCollOf(id); return c < 0 ? 0 : c; };
const wanderChip = (id) => { const c = wanderColl(id); return `<span class="wd-chip" style="--h:${WANDER_HUES[c % WANDER_HUES.length]}">${esc(simCollName(c))}</span>`; };
const wanderWhen = (id) => { const l = LIB_BY_ID[id]; return l && l.when ? l.when : ''; };

async function wanderRandomStart(meta) {
  const readable = LIB.filter((l) => meta[l.id] && !/^z-/.test(l.id)); const colls = [...new Set(readable.map((l) => wanderColl(l.id)))];
  for (let tries = 0; tries < 12; tries++) {
    const c = colls[Math.floor(psgRand() * colls.length)]; const pool = readable.filter((l) => wanderColl(l.id) === c); const l = pool[Math.floor(psgRand() * pool.length)];
    const got = await TXT.scan(l.id, (t) => { const p = pickPassage(t.secs, t.meta, psgRand, { target: 700 }); return p ? { sec: p.si, len: p.text.length, text: srchOwnStr(psgClean(p.text)), heading: srchOwnStr(String(p.heading)), meta: t.meta } : null; });      // looked at and let go (TXT.scan, 6c-texts.js); what is kept is a copy of the passage's own words
    if (got) return { id: l.id, sec: got.sec, a: 0, len: got.len, text: got.text, heading: got.heading, meta: got.meta, via: null };
  }
  return null;
}

async function pathWanderView(root, query) {
  const body = root.querySelector('#pbody'); const trail = []; let options = []; let busy = false; let token = 0;
  body.innerHTML = `<p class="t2 small" style="max-width:74ch">Start anywhere and follow a passage across the world’s books. Each step offers the closest passages in other traditions, one from each, with the words or the theme that brought them together; choose one and keep going. The trail you leave can be kept as a passage set. The hops are found by statistics, so each is a place to start reading, not a claim that two passages are connected.</p>
    <section class="card flat" style="margin:14px 0"><div class="row" style="gap:10px;flex-wrap:wrap"><button class="btn primary dice" id="wdStart" type="button">${icon('dice')}Begin somewhere new</button><button class="btn ghost" id="wdBack" type="button" hidden>← One step back</button><button class="btn ghost" id="wdKeep" type="button" hidden>${icon('threads')}Keep this trail</button></div></section>
    <div id="wdTrail" aria-label="Where you have been"></div><div id="wdNow" aria-live="polite"></div><div id="wdNext"></div>`;
  const now = $('#wdNow', body); const next = $('#wdNext', body); const tr = $('#wdTrail', body);
  const era = (id) => { const w = wanderWhen(id); return w ? `<span class="muted small">${esc(w)}</span>` : ''; };
  const renderTrail = () => {
    $('#wdBack', body).hidden = trail.length < 2; $('#wdKeep', body).hidden = trail.length < 2;
    tr.innerHTML = trail.length ? `<div class="wd-trail" role="list">${trail.map((s, i) => `<span class="wd-step${i === trail.length - 1 ? ' on' : ''}" role="listitem" style="--h:${WANDER_HUES[wanderColl(s.id) % WANDER_HUES.length]}" title="${esc(wanderWhen(s.id))}"><b>${esc((LIB_BY_ID[s.id] || { title: s.id }).title.slice(0, 26))}</b></span>`).join('<span class="wd-arrow" aria-hidden="true">→</span>')}</div>` : '';
  };
  const renderNow = () => {
    const s = trail[trail.length - 1]; if (!s) { now.innerHTML = ''; return; } const l = LIB_BY_ID[s.id] || { title: s.id }; const m = s.meta || {};
    const via = s.via ? `<div class="small" style="margin-top:6px"><span class="muted">What brought you here</span> ${s.via.words.map((w) => `<span class="sim-w">${esc(w.join(' ↔ '))}</span>`).join('')}${s.via.motifs.map((mid) => `<a class="chip" href="#/path/motif/${esc(simMotifInit()[mid].id)}">${esc(simMotifInit()[mid].name)}</a>`).join(' ')}</div>` : '';
    now.innerHTML = `<article class="card glow fade-in wd-now"><div class="row" style="gap:8px;flex-wrap:wrap">${wanderChip(s.id)}${era(s.id)}</div><h2 style="font-size:24px;margin:6px 0 2px">${esc(l.title)}</h2><div class="small muted">${esc(s.heading)}${m.by ? ' · ' + esc(String(m.by).slice(0, 80)) : ''}</div>
      <p class="sim-ex" style="font-size:16px">${simExcerpt(s.text, s.via ? s.via.words.flat() : [], 720)}</p>${via}
      <div class="row tight" style="margin-top:8px"><a class="btn sm" href="#/path/read/${s.id}?s=${s.sec}">Open in the reader</a><a class="btn sm ghost" href="#/path/similar?b=${s.id}&q=${encodeURIComponent(s.text.slice(0, 700))}">Everything like this</a></div></article>`;
  };
  const renderNext = () => {
    if (!options.length) { next.innerHTML = trail.length ? '<p class="t2 small">Nothing close enough in another tradition. Try “Begin somewhere new”.</p>' : ''; return; }
    next.innerHTML = `<h3 style="margin:18px 0 8px;font-size:16px">Where to next</h3><div class="wd-opts">${options.map((o, i) => `<button class="card flat wd-opt" type="button" data-hop="${i}" style="--h:${WANDER_HUES[wanderColl(o.id) % WANDER_HUES.length]}"><div class="row" style="gap:8px;flex-wrap:wrap">${wanderChip(o.id)}${era(o.id)}</div><b style="display:block;margin:4px 0 2px">${esc((LIB_BY_ID[o.id] || { title: o.id }).title)}</b><span class="small muted">${esc(o.heading.slice(0, 60))}</span><span class="sim-ex wd-ex" style="display:block;margin-top:6px;font-size:14px">${simExcerpt(o.text, o.via.words.flat(), 190)}</span>${o.via.words.length ? `<span class="small" style="display:block;margin-top:6px"><span class="muted">in common</span> ${o.via.words.slice(0, 3).map((w) => `<span class="sim-w">${esc(w.join(' ↔ '))}</span>`).join('')}</span>` : ''}</button>`).join('')}</div>`;
  };
  const findNext = async () => {
    const s = trail[trail.length - 1]; if (!s) return; const my = ++token; next.innerHTML = '<p class="t2 small" role="status">Looking for where this leads…</p>'; busy = true;
    try {
      const r = await simRun(s.text, { from: s.id, perTrad: 2 }); if (my !== token) return;
      if (r.error) { options = []; renderNext(); return; }
      const visitedT = new Set(trail.map((x) => x.id)); const visitedC = new Set(trail.map((x) => wanderColl(x.id)));
      let cands = []; for (const g of r.groups) for (const it of g.items) { if (visitedT.has(it.id)) continue; cands.push({ it, g, fresh: !visitedC.has(g.coll) }); }
      cands = [...cands.filter((c) => c.fresh), ...cands.filter((c) => !c.fresh)]; const seenC = new Set(); const pick = [];
      for (const c of cands) { if (seenC.has(c.g.coll)) continue; seenC.add(c.g.coll); pick.push(c); if (pick.length >= 6) break; }
      const out = []; const qraw = r.emb.raw || new Map();
      for (const c of pick) { const ps = await simPassage(r.P, c.it).catch(() => null); if (!ps) continue; const shared = simSharedWords(r.P, r.emb, ps.text, qraw); out.push({ id: c.it.id, sec: c.it.sec, a: c.it.a, len: c.it.len, text: psgClean(ps.text), heading: ps.heading, meta: ps.meta, via: { words: shared, motifs: simSharedMotifs(r.P, r.emb, c.it.i) } }); }
      if (SIMX.drop) { SIMX.drop.forEach((id) => TXT.unload(id)); SIMX.drop = null; }
      if (my !== token) return; options = out; renderNext();
    } catch (e) { next.innerHTML = /missing similar/.test(e.message) ? `<section class="card flat"><div class="callout warn">${icon('warn')}<div>${loadFailText('The <b>similar</b> folder was not found next to Lamplighter.html. Build it with <code>node tools/build_similar.js</code>.')}</div></div></section>` : `<p class="t2 small">Could not look further: ${esc(e.message)}</p>`; } finally { busy = false; }
  };
  const go = async (step) => { trail.push(step); renderTrail(); renderNow(); options = []; renderNext(); await findNext(); };
  const begin = async (seed) => {
    if (busy) return; trail.length = 0; renderTrail(); now.innerHTML = '<p class="t2 small" role="status">Choosing a place to begin…</p>'; next.innerHTML = '';
    try { const meta = (await TXT.index()) || {}; const s = seed || await wanderRandomStart(meta); if (!s) { now.innerHTML = `<section class="card flat"><p class="t2">${loadFailText('The texts folder was not found, so there is nothing to wander through yet.')}</p></section>`; return; } await go(s); }
    catch (e) { now.innerHTML = `<section class="card flat"><p class="t2">Could not begin: ${esc(e.message)}</p></section>`; }
  };
  body.addEventListener('click', async (e) => {
    if (e.target.closest('#wdStart')) { begin(null); return; }
    if (e.target.closest('#wdBack')) { if (trail.length > 1) { trail.pop(); renderTrail(); renderNow(); options = []; renderNext(); findNext(); } return; }
    if (e.target.closest('#wdKeep')) {
      const t = threadNew('Wander: ' + trail.map((s) => (LIB_BY_ID[s.id] || { title: s.id }).title.split(/[:,(]/)[0]).slice(0, 4).join(' → '));
      trail.forEach((s) => threadAddItem(t, { tid: s.id, s: s.sec, p: 0, a: 0, b: s.text.length, q: s.text, label: (LIB_BY_ID[s.id] || { title: s.id }).title, sh: s.heading })); THREADS.add(t);
      toast(`Kept as a passage set. <a href="#/path/thread/${t.id}">Open it →</a>`, 'good', 6000); return;
    }
    const h = e.target.closest('[data-hop]'); if (h && !busy) { const o = options[+h.dataset.hop]; if (o) { go(o); window.scrollTo({ top: body.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' }); } }
  });
  if (query.q && query.b && LIB_BY_ID[query.b]) { const meta = (await TXT.index()) || {}; begin({ id: query.b, sec: 0, a: 0, len: query.q.length, text: psgClean(query.q).slice(0, 900), heading: 'The passage you brought', meta: meta[query.b] || {}, via: null }); }
}
if (typeof module !== 'undefined' && module.exports) module.exports = { libYear };
