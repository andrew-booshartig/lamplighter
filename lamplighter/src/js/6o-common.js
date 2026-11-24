/* ═══════════════════════════ 6o · Common ground ═══════════════════════════
   Where the traditions meet and where they differ, made only from what the library itself shows: how the traditions are historically tangled (the echoes,
   each graded), the teachings they share (curated parallel passages), the same concerns turning up across the library (a word map counted live), and the
   differences, said plainly and shown beside the likenesses. The page argues no thesis: it grades each connection and leaves what to make of it to the reader
   (the neutral-voice rule of 18 Nov 2026; tests/neutral.test.js). */
const COLL_SHORT = ['The Bible', 'Second Temple & early Christian', 'Near East & Egypt', 'Greece & Rome', 'India', 'Iran & Islam', 'China & Japan', 'Northern Europe', 'Americas, Africa & Pacific', 'Modern & study aids'];
const commonOverlap = () => { const pairs = traditionOverlap(ECHO_LINKS, TRAD_OF_STATION); return { pairs, graph: overlapGraph(pairs, TRADITIONS.map((t) => t.id)) }; };
const kindColorOf = (kinds) => { let best = ''; let n = 0; Object.entries(kinds).forEach(([k, c]) => { if (c > n) { n = c; best = k; } }); return (ECHO_KINDS[best] || { color: '#7d9bff' }).color; };

function ringSVG(pairs, sel, recent) {
  const W = 820; const H = 600; const cx = 410; const cy = 300; const R = 200; const n = TRADITIONS.length;
  const pos = {}; TRADITIONS.forEach((t, i) => { const a = (2 * Math.PI * i) / n - Math.PI / 2; pos[t.id] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), a }; });
  const near = new Set(sel ? Object.values(pairs).filter((p) => p.a === sel || p.b === sel).map((p) => (p.a === sel ? p.b : p.a)) : []);
  const arcs = Object.values(pairs).sort((x, y) => x.n - y.n).map((p) => {
    const A = pos[p.a]; const B = pos[p.b]; const mx = (A.x + B.x) / 2; const my = (A.y + B.y) / 2; const qx = cx + (mx - cx) * 0.12; const qy = cy + (my - cy) * 0.12;
    const on = !sel || p.a === sel || p.b === sel; const fresh = recent && recent.has(p.a + '|' + p.b); const w = Math.min(11, 1.2 + p.n * 1.3) + (fresh ? 3 : 0);
    return `<path${fresh ? ' class="cg-new"' : ''} d="M${A.x.toFixed(1)} ${A.y.toFixed(1)} Q${qx.toFixed(1)} ${qy.toFixed(1)} ${B.x.toFixed(1)} ${B.y.toFixed(1)}" fill="none" stroke="${kindColorOf(p.kinds)}" stroke-width="${w.toFixed(1)}" stroke-linecap="round" opacity="${fresh ? 1 : on ? (sel ? 0.85 : 0.5) : 0.06}"><title>${esc(TRAD_BY_ID[p.a].short)} ↔ ${esc(TRAD_BY_ID[p.b].short)}: ${p.n} connection${p.n === 1 ? '' : 's'}</title></path>`;
  }).join('');
  const nodes = TRADITIONS.map((t) => {
    const P = pos[t.id]; const c = Math.cos(P.a); const anchor = c > 0.03 ? 'start' : c < -0.03 ? 'end' : 'middle'; const lx = cx + (R + 20) * c; const ly = cy + (R + 20) * Math.sin(P.a) + (Math.abs(c) <= 0.25 ? (Math.sin(P.a) > 0 ? 12 : -4) : 5);
    const dim = sel && t.id !== sel && !near.has(t.id);
    return `<a href="#/path/common?t=${t.id}" aria-label="${esc(t.short)}${t.id === sel ? ' (selected)' : ''}"><circle cx="${P.x.toFixed(1)}" cy="${P.y.toFixed(1)}" r="${t.id === sel ? 12 : 9}" fill="${t.id === sel ? 'var(--accent)' : 'var(--surface2)'}" stroke="var(--accent)" stroke-width="2.5" opacity="${dim ? 0.35 : 1}"/><text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" font-size="18" font-weight="${t.id === sel ? 700 : 500}" fill="var(--text)" opacity="${dim ? 0.4 : 1}">${esc(t.short)}</text></a>`;
  }).join('');
  return `<svg class="cgsvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Each tradition on a ring, with an arc to every tradition it shares a documented or classified connection with">${arcs}${nodes}</svg>`;
}

/* what the count says when the memory guard stops it (AA-01): a count over some of the texts would be a different count, so nothing is kept; from a file the browser holds on to each text it reads, from a web address or a local server it does not */
const cgStopLine = (done, total, loc) => `Stopped after ${methN(done)} of ${methN(total)} texts to keep your browser running, so nothing was kept: the count needs every text.${copyWhere(loc) === 'file' ? ' From a folder the browser holds on to each text it reads, which a web address or a local server does not; reloading the page frees the memory.' : ''}`;
function pathCommonView(root, query) {
  const body = root.querySelector('#pbody'); const { pairs, graph } = commonOverlap(); const sel = TRAD_BY_ID[query.t] ? query.t : '';
  const shares = kindShares(ECHO_LINKS); const ids = TRADITIONS.map((t) => t.id);
  const commonPars = PARALLELS.filter((p) => p.theme === 'Common ground');
  const panel = () => {
    if (!sel) {
      const top = Object.values(pairs).sort((a, b) => b.n - a.n).slice(0, 6);
      return `<h3 style="margin:0 0 8px">Choose a tradition</h3><p class="small t2">Select any name on the ring to see everything it shares with the others. The thicker the arc, the more connections. The strongest links:</p><ul class="plain">${top.map((p) => `<li><a href="#/path/common?t=${p.a}">${esc(TRAD_BY_ID[p.a].short)}</a> ↔ <a href="#/path/common?t=${p.b}">${esc(TRAD_BY_ID[p.b].short)}</a> <span class="muted small">· ${p.n} connections</span></li>`).join('')}</ul>`;
    }
    const t = TRAD_BY_ID[sel]; const mine = Object.values(pairs).filter((p) => p.a === sel || p.b === sel).sort((a, b) => b.n - a.n);
    return `<h3 style="margin:0 0 4px">${esc(t.name)}</h3><p class="small t2">${esc(t.blurb)}</p><p class="small"><b>${mine.length}</b> of the other ${ids.length - 1} traditions share a classified connection with this one.</p>
      <div class="stack sm">${mine.map((p) => { const o = p.a === sel ? p.b : p.a; return `<details class="cgrow"><summary><a href="#/path/common?t=${o}"><b>${esc(TRAD_BY_ID[o].short)}</b></a> <span class="muted small">· ${p.n} connection${p.n === 1 ? '' : 's'}</span> ${Object.entries(p.kinds).map(([k, c]) => `${kindChip(k)}${c > 1 ? `<span class="muted small">×${c}</span>` : ''}`).join(' ')}</summary><ul class="plain cgecho">${p.links.map((e) => `<li><div class="small"><a href="#/path/station/${e.A.id}">${esc(e.A.title)}</a> ↔ <a href="#/path/station/${e.B.id}">${esc(e.B.title)}</a> ${kindChip(e.kind)}</div><div class="small t2">${esc(e.note)}</div></li>`).join('')}</ul></details>`; }).join('') || '<p class="t2 small">No classified connections yet.</p>'}</div>
      <p class="small" style="margin-top:10px"><a href="#/path/tradition/${t.id}">Open the ${esc(t.short)} page →</a> · <a href="#/path/common">Clear</a></p>`;
  };
  const cached0 = store.get('common.words', null); /* the saved count is used only if it has the shape this page draws */
  const cached = cached0 && typeof cached0 === 'object' && cached0.rows && typeof cached0.rows === 'object' && Object.values(cached0.rows).every((r) => Array.isArray(r) && r.every((v) => typeof v === 'number')) ? cached0 : null;
  /* a time-lapse of the ring: the year of a connection is when the later end first appears */
  const cgKeys = [[-100000, 0], [-10000, 0.18], [-3000, 0.36], [-500, 0.52], [1, 0.64], [1000, 0.78], [1500, 0.88], [2026, 1]];
  const cgPos = (y) => { for (let i = 1; i < cgKeys.length; i++) if (y <= cgKeys[i][0]) return cgKeys[i - 1][1] + ((y - cgKeys[i - 1][0]) / (cgKeys[i][0] - cgKeys[i - 1][0])) * (cgKeys[i][1] - cgKeys[i - 1][1]); return 1; };
  const cgYear = (p) => { for (let i = 1; i < cgKeys.length; i++) if (p <= cgKeys[i][1]) return Math.round(cgKeys[i - 1][0] + ((p - cgKeys[i - 1][1]) / (cgKeys[i][1] - cgKeys[i - 1][1])) * (cgKeys[i][0] - cgKeys[i - 1][0])); return 2026; };
  const cgDated = ECHO_LINKS.map((e) => ({ e, y: Math.max(Number.isFinite(e.A.y0) ? e.A.y0 : -1e5, Number.isFinite(e.B.y0) ? e.B.y0 : -1e5) })).sort((a, b) => a.y - b.y);
  const cgState = { p: 1, timer: 0 };
  body.innerHTML = `<section class="card glow fade-in" style="margin-top:14px"><div class="eyebrow">Common ground</div>
      <h2 style="font-size:26px;margin:4px 0 8px">Where the traditions meet, and where they differ</h2>
      <p class="t2" style="max-width:74ch;font-size:16px">Some traditions borrowed from, answered and argued with each other for thousands of years, and the library records those connections and how well each is documented. Where traditions had no known contact, some asked the same questions about suffering, death and how to treat a stranger and gave similar answers, and some gave different ones. This page shows the likenesses and the differences side by side, using only the library’s own data.</p>
      <div class="grid c4" style="margin-top:14px"><div class="card flat stat-tile"><b>${ids.length}</b><span class="small t2">traditions</span></div><div class="card flat stat-tile"><b>${ECHO_LINKS.length}</b><span class="small t2">classified connections between them</span></div><div class="card flat stat-tile"><b>${graph.minDegree}+</b><span class="small t2">others each one is directly linked to</span></div><div class="card flat stat-tile"><b>${graph.connected ? graph.diameter : '–'}</b><span class="small t2">steps at most between any two</span></div></div>
      <p class="small t2" style="margin-top:10px">${graph.connected ? `Every one of the ${ids.length} traditions can be reached from every other by following connections, and no two are more than ${graph.diameter} steps apart.` : 'Not every tradition is linked yet.'} ${graph.pairsLinked} of the ${graph.pairsPossible} possible pairs are linked directly.</p></section>
    <section class="card fade-in" style="margin-top:16px"><div class="card-title"><h3>Where they really differ</h3></div>
      <div class="grid c2">${COMMON_DIFFERENCES.map(([h2, t]) => `<div class="card flat"><b>${esc(h2)}</b><p class="small t2" style="margin:4px 0 0">${esc(t)}</p></div>`).join('')}</div>
      <p class="t2" style="max-width:74ch;margin-top:14px">These differences are real, and for many people their own tradition’s answer is true and the others’ are not. Overlap is not sameness, and nothing here asks anyone to give up what they hold. Below, the library shows how the traditions are connected in their history and where they say similar things, each connection labelled by how well it is documented; what to make of it is for the reader.</p></section>
    <section class="card fade-in" style="margin-top:16px"><div class="card-title"><h3>${icon('swap')}Who is connected to whom</h3></div><div class="cg-wrap"><div class="cg-ring">${ringSVG(pairs, sel)}</div><div class="cg-panel">${panel()}</div></div>
      <div class="cg-watch" id="cgWatch"><div class="row" style="gap:10px;flex-wrap:wrap;align-items:center"><button class="btn sm primary" id="cgPlay" type="button">${icon('play')}<span>Watch the connections form</span></button><button class="btn sm" id="cgAll" type="button">Show them all</button><b id="cgYear" class="cg-year"></b><span class="small muted" id="cgCount"></span></div><input class="atl-slider" id="cgSlider" type="range" min="0" max="1000" value="1000" step="1" aria-label="Year" style="margin-top:8px"><ol class="plain cg-ticker" id="cgTick" aria-live="polite"></ol><p class="hint" style="margin:4px 0 0">Each connection appears when the later of its two stories or traditions first appears, so the web grows as history does. Press play, or drag the slider.</p></div>
      <div class="row tight small" style="margin-top:8px">${Object.entries(ECHO_KINDS).map(([k, v]) => `<span class="kind sm" style="--k:${v.color}">${esc(v.name)}</span>`).join('')}<span class="muted">Arc colour is the commonest kind of connection; width is how many.</span></div></section>
    <section class="card fade-in" style="margin-top:16px"><div class="card-title"><h3>${icon('heart')}Kinds of overlap</h3></div>
      <div class="stack sm">${shares.map((g) => `<div class="echo-bar"><span class="small"><b>${esc(g.name)}</b></span><div class="bar"><i style="width:${g.pct}%"></i></div><span class="mono small">${g.n}</span><span class="small t2 desc">${esc(g.text)}</span></div>`).join('')}</div>
      <p class="t2" style="max-width:74ch;margin-top:12px">By the library’s own grading, <b>${shares[0].pct}%</b> of these connections are shared history (one tradition borrowed from, grew out of or met another) and <b>${shares[1].pct}%</b> are independent parallels (similar ideas where no contact is known). Why such parallels arise is argued: some read them as a sign of common human concerns, others as coincidence or as contact nobody has recorded. The other <b>${shares[2].pct}%</b> are disputed, and the library says so each time.</p></section>
    <section class="fade-in" style="margin-top:22px"><div class="card-title"><h3 style="font-size:20px">Teachings found in several traditions</h3><a class="small" href="#/path/parallels">All parallel passages →</a></div>
      <p class="t2 small" style="max-width:74ch">Passages from different traditions set side by side, in their own words. Each has a cautious note on how the evidence says they relate: some are borrowed, some are independent, and the page says which.</p>
      <div class="grid c2">${commonPars.map((p) => `<a class="card flat thcard" href="#/path/parallels?p=${p.id}"><b>${esc(p.title)}</b><div class="small t2">${esc(p.blurb)}</div><div class="small muted" style="margin-top:6px">${[...new Set(p.items.map((i) => tradName(i[0])))].slice(0, 4).map(esc).join(' · ')}</div></a>`).join('')}</div></section>
    <section class="card fade-in" style="margin-top:22px"><div class="card-title"><h3>${icon('search')}The same concerns, across the whole library</h3></div>
      <p class="t2 small" style="max-width:74ch">How often these words appear in the English texts of each collection, counted live across every text in the library. Darker means more per page, compared within a row. <b>Translators choose their own words</b>, so this shows that the concerns are voiced in every part of the library, not that each tradition means the same thing by them.</p>
      <div id="cgWords">${cached ? '' : '<p class="small muted">Not counted yet.</p>'}</div>
      <div class="row" style="margin-top:10px"><button class="btn primary" id="cgScan" type="button">${icon('search')}${cached ? 'Count again' : 'Count them across the library'}</button><span class="small muted" id="cgProg">${cached ? `Counted ${new Date(cached.t).toLocaleDateString()} across ${cached.n} texts.` : 'About five seconds.'}</span></div></section>
    <section class="card fade-in" style="margin-top:22px"><div class="card-title"><h3>${icon('lotus')}Bring it to the table</h3></div>
      <div class="row"><a class="btn primary" href="#/gather/services">Plan a gathering with readings from several traditions</a><a class="btn" href="#/path/parallels?p=golden-rule">Read the reciprocity rule in six traditions</a><a class="btn ghost" href="${srchHash('"love your neighbor"|"love your neighbour"', srchOpts({}))}">Search every text for “love your neighbor”</a><a class="btn ghost" href="#/path/threads">Make your own passage set</a><a class="btn ghost" href="#/atlas">${icon('globe')}Watch the traditions spread and meet on the map</a><a class="btn ghost" href="#/atlas/cosmos">How different peoples drew the world</a></div></section>${typeof storyLookCloser === 'function' ? storyLookCloser() : ''}`;      /* SA-12: the story invitation is one quiet card at the end of the page, not above its content */
  const drawWords = (data) => {
    const el = $('#cgWords', body); if (!data) return;
    const cols = COLL_SHORT.length;
    el.innerHTML = `<div class="table-wrap"><table class="wmap"><tr><th></th>${COLL_SHORT.map((c) => `<th><span>${esc(c)}</span></th>`).join('')}<th>Where</th></tr>${COMMON_CONCEPTS.map((c) => { const row = data.rows[c.id] || []; const max = Math.max(...row, 0.0001); const present = row.filter((v) => v >= 0.5).length; return `<tr><td><b>${esc(c.label)}</b></td>${COLL_SHORT.map((nm, i) => { const v = row[i] || 0; const a = v <= 0 ? 0 : Math.max(0.12, Math.min(1, v / max)); return `<td class="wcell" style="--a:${a.toFixed(2)}" title="${esc(nm)}: ${v.toFixed(1)} per 100,000 characters">${v >= 0.5 ? (v >= 10 ? Math.round(v) : v.toFixed(1)) : '·'}</td>`; }).join('')}<td class="small">${present} of ${cols}</td></tr>`; }).join('')}</table></div><p class="hint">Occurrences per 100,000 characters of English text. “·” means fewer than 0.5.</p>`;
  };
  if (cached) drawWords(cached);
  /* the time-lapse itself */
  const cgDraw = () => {
    const yr = cgYear(cgState.p); const upto = cgDated.filter((x) => x.y <= yr); const lastN = 8;
    const ps = traditionOverlap(upto.map((x) => x.e), TRAD_OF_STATION); const recent = new Set(); const newest = upto.filter((x) => cgPos(yr) - cgPos(x.y) < 0.06 && cgPos(yr) - cgPos(x.y) >= 0);
    newest.forEach((x) => { const ta = TRAD_OF_STATION[x.e.A.id] || []; const tb = TRAD_OF_STATION[x.e.B.id] || []; ta.forEach((a) => tb.forEach((b) => { if (a !== b) recent.add([a, b].sort().join('|')); })); });
    const ring = $('.cg-ring', body); if (ring) ring.innerHTML = ringSVG(ps, sel, recent);
    $('#cgYear', body).textContent = yr >= 2020 ? 'Today' : atlFmtYear(yr); $('#cgCount', body).textContent = `${upto.length} of ${cgDated.length} connections · ${Object.keys(ps).length} of ${Object.keys(pairs).length} linked pairs`;
    $('#cgTick', body).innerHTML = upto.slice(-lastN).reverse().map((x) => { const k = ECHO_KINDS[x.e.kind] || {}; return `<li><span class="st-dot" style="background:${k.color || '#7d9bff'}"></span><span class="small"><b>${esc(x.y <= -1e5 ? 'Earliest' : atlFmtYear(x.y))}</b> ${esc(x.e.A.title)} <span class="muted">↔</span> ${esc(x.e.B.title)} <span class="muted">· ${esc(k.name || '')}</span></span></li>`; }).join('');
    $('#cgSlider', body).value = Math.round(cgState.p * 1000);
  };
  const cgPlay = (on) => { clearInterval(cgState.timer); $('#cgPlay', body).querySelector('span').textContent = on ? 'Pause' : 'Watch the connections form'; if (!on) { cgState.timer = 0; return; } if (cgState.p >= 0.999) cgState.p = 0; let last = Date.now(); cgState.timer = setInterval(() => { if (!document.body.contains(body)) { clearInterval(cgState.timer); return; } const dt = (Date.now() - last) / 1000; last = Date.now(); cgState.p = Math.min(1, cgState.p + dt / 30); cgDraw(); if (cgState.p >= 1) cgPlay(false); }, 40); };
  $('#cgPlay', body).addEventListener('click', () => cgPlay(!cgState.timer));
  $('#cgAll', body).addEventListener('click', () => { cgPlay(false); cgState.p = 1; cgDraw(); });
  $('#cgSlider', body).addEventListener('input', (e) => { cgPlay(false); cgState.p = e.target.value / 1000; cgDraw(); });
  cgDraw();
  const scan = $('#cgScan', body);
  if (scan) scan.addEventListener('click', async () => {
    scan.disabled = true; const prog = $('#cgProg', body); prog.textContent = 'Opening the texts…'; const token = ++SRCH.token; pathOnLeave(() => { SRCH.token++; });
    const meta = await TXT.index(); if (!meta) { prog.textContent = loadFailText('The texts folder was not found.'); scan.disabled = false; return; }
    const ids2 = LIB.filter((l) => meta[l.id]).map((l) => l.id); const cqs = COMMON_CONCEPTS.map((c) => compileQuery(c.q, { whole: true, alias: false }));
    const sums = COMMON_CONCEPTS.map(() => COLL_SHORT.map(() => 0)); const chars = COLL_SHORT.map(() => 0); let k = 0; let done = 0; let stopped = false;
    const work = async () => {      // each text is looked at and let go (TXT.scan, 6c-texts.js), and the count stops before the page runs out of memory (TXT.heapOver)
      while (k < ids2.length && SRCH.token === token && !stopped) {
        const id = ids2[k++]; const ci = srchCollOf(id);
        try { await TXT.scan(id, (t) => { if (ci < 0) return; chars[ci] += t.secs.reduce((a, s) => a + s[1].length, 0); cqs.forEach((cq, j) => { sums[j][ci] += termDensity(t.secs, cq).n; }); }); } catch (e) { /* a text that cannot be read is left out of the count */ }
        done++; if (done < ids2.length && TXT.heapOver()) stopped = true;
        if (done % 6 === 0 || done === ids2.length) { prog.textContent = `Counting… ${done} of ${ids2.length} texts`; } await new Promise((r) => setTimeout(r, 0));
      }
    };
    await Promise.all([work(), work(), work(), work()]); if (SRCH.token !== token) return;
    if (stopped) { prog.textContent = cgStopLine(done, ids2.length); scan.disabled = false; return; }      // half a count would not be a count: the words are counted in every text or not at all, and nothing is saved
    const rows = {}; COMMON_CONCEPTS.forEach((c, j) => { rows[c.id] = COLL_SHORT.map((_, i) => (chars[i] ? (sums[j][i] * 1e5) / chars[i] : 0)); });
    const data = { t: Date.now(), n: ids2.length, rows }; store.set('common.words', data); drawWords(data); prog.textContent = `Counted just now across ${ids2.length} texts.`; scan.disabled = false; scan.lastChild.textContent = 'Count again';
  });
}
