/* ═══════════════════════════ 6u · Find similar passages ═══════════════════════════
   From any passage (a random one, a selection in the reader, words you type) to the passages of other books and traditions that read most like it: the same words,
   the same things happening, set side by side. The matching is statistical and was computed once, offline, from every English text in the library
   (tools/build_similar.js → the similar/ folder); nothing is sent anywhere. It finds likeness, not borrowing: where scholars have written about a connection, the note says
   so, and where they have not, the page says that a match is only a match. */
const SIMX = { P: null, loading: null, _s: {}, lastQuery: '' };
const simScript = (name) => {
  if (!SIMX._s[name]) SIMX._s[name] = new Promise((res, rej) => {
    const s = document.createElement('script'); s.charset = 'utf-8'; s.src = 'similar/' + name + '.js'; s.onload = () => res(); s.onerror = () => { delete SIMX._s[name]; rej(new Error('missing similar/' + name + '.js')); }; document.head.appendChild(s);
  });
  return SIMX._s[name];
};
/* the index is about 66 MB (four of the seven files hold the passages: chunks-2.js and chunks-4.js the two halves of the vectors), loaded the first time it is wanted and then kept */
async function simLoad() {
  if (SIMX.P) return SIMX.P;
  if (!SIMX.loading) SIMX.loading = (async () => {
    await simScript('index'); await Promise.all([simScript('terms'), simScript('chunks'), simScript('chunks-2').catch(() => null), simScript('chunks-3').catch(() => null), simScript('chunks-4').catch(() => null)]);      // the big index is in four files so that every free host can hold it (none reaches 25 MiB); an unsplit copy has it all in chunks.js
    const incomplete = () => { for (const n of ['chunks-2', 'chunks-3', 'chunks-4']) delete SIMX._s[n]; return new Error(loadFailText('The similar-passages index is incomplete: one of the files in the similar folder did not load.')); };
    const ck = BEATLAB_SIM.data.chunks; if (!ck || !['n', 'sn', 'sc', 'sw'].every((k) => ck[k] != null) || (ck.q == null && ck.q1 == null)) throw incomplete();
    const meta = (await TXT.index()) || {}; let P; try { P = simPrepare(BEATLAB_SIM.data); } catch (e) { throw incomplete(); }      // simPrepare refuses vectors that stop short of the passages (a part such as chunks-4.js missing)
    P.stale = new Set(); P.texts.forEach((id, i) => { const m = meta[id]; if (!m || m.chars !== P.textChars[id]) P.stale.add(i); });   // a text changed since the index was built: leave it out rather than show the wrong words
    BEATLAB_SIM.data.chunks = null; BEATLAB_SIM.data.terms = null; SIMX.P = P; return P;
  })().catch((e) => { SIMX.loading = null; throw e; });
  return SIMX.loading;
}
const simCollOf = (id) => srchCollOf(id);
const simCollName = (i) => (LIB_COLLECTIONS[i] ? LIB_COLLECTIONS[i][0] : 'Other');
/* pairs that scholars have set side by side (the curated Parallels): so a statistical match that is also a known one carries what is known */
let SIM_PAIRS = null;
function simPairs() {
  if (SIM_PAIRS) return SIM_PAIRS; SIM_PAIRS = {};
  (typeof PARALLELS !== 'undefined' ? PARALLELS : []).forEach((p) => (p.links || []).forEach(([a, b, kind, note]) => {
    const x = p.items[a - 1][0]; const y = p.items[b - 1][0]; if (x === y) return; const key = [x, y].sort().join('|');
    if (!SIM_PAIRS[key]) SIM_PAIRS[key] = { p: p.id, title: p.title, kind, note };
  }));
  return SIM_PAIRS;
}
const SIM_KIND = { borrowing: 'Likely borrowed', ancestry: 'Common ancestry', contact: 'Contact', parallel: 'Independent parallel', contested: 'Debated' };

/* a passage (any words) → the best passages of other books, grouped by tradition: each tradition's two closest sections, and up to two more, each from another book, when they are nearly as
   close as the best match of all (SIM_SHOW, in 2w-similar-core.js). o: { from: the book it came from (left out, with its tradition unless o.same), same, perTrad } */
async function simRun(text, o) {
  o = o || {}; const P = await simLoad(); const emb = simEmbed(P, text);
  if (!emb || emb.n < 3) return { error: 'few', P };
  const own = o.from && P.textIdx[o.from] != null ? P.textIdx[o.from] : -1; const ownColl = o.from ? simCollOf(o.from) : -1;
  const res = simSearch(P, emb, { skipText: (t) => P.stale.has(t) || t === own || (!o.same && ownColl >= 0 && simCollOf(P.texts[t]) === ownColl) || (ownColl === 0 && P.texts[t] === 'p-lxx'), pool: 4000, perText: 100000, limit: 4000 });
  const pairs = simPairs(); const G = simGroup(res, Object.assign({}, SIM_SHOW, { collOf: simCollOf, perTrad: o.perTrad || SIM_SHOW.perTrad, bonus: o.from ? (id) => (pairs[[o.from, id].sort().join('|')] ? 1.2 : 0) : null }));
  const groups = G.groups.map((g) => ({ coll: g.coll, name: simCollName(g.coll), items: g.items.map((x) => Object.assign({}, x.best, { region: x.region, near: x.near })), best: g.best })).filter((g) => g.best >= 0.42 * G.top);
  return { P, emb, groups, top: G.top, dups: res.dups || [], stale: P.stale.size, n: P.N };
}
/* fetch the words of one result from the texts folder (it is only loaded if it was not already) */
async function simPassage(P, r) {
  const loaded = !!BEATLAB_TEXTS.data[r.id]; const t = await TXT.load(r.id); if (!t) return null;
  const sec = t.secs[r.sec]; if (!sec) return null; const text = (' ' + String(sec[1]).slice(r.a, r.a + r.len)).slice(1); if (!text.trim()) return null;   // a copy, so the big text is not held by a slice of it
  if (!loaded) SIMX.drop = (SIMX.drop || new Set()).add(r.id);
  return { text, heading: String(sec[0]), meta: t.meta };
}
function simDots(score, top) { const r = score / (top || 1); const n = r >= 0.78 ? 3 : r >= 0.55 ? 2 : 1; return `<span class="sim-dots" role="img" aria-label="Closeness ${n} of 3">${'●'.repeat(n)}<span class="sim-off">${'●'.repeat(3 - n)}</span></span>`; }
function simMark(html, words) {
  const ws = [...new Set(words.filter((w) => w && w.length > 2))].slice(0, 10); if (!ws.length) return html;
  return html.replace(new RegExp('\\b(' + ws.map(escRe).join('|') + ')\\b', 'gi'), '<mark class="sim-hit">$1</mark>');
}
function simExcerpt(text, words, max) {
  let t = psgClean(text); if (t.length > (max || 560)) { const cut = t.slice(0, max || 560); const k = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '), cut.lastIndexOf('? ')); t = (k > 200 ? cut.slice(0, k + 1) : cut.replace(/\s+\S*$/, '')) + ' …'; }
  return simMark(esc(t), words);
}
/* "flood", "ark ↔ ship" */
function simSharedWords(P, emb, resText, queryRaw) {
  const l = simLexical(P, emb, resText); const out = []; const seen = new Set();
  for (const s of l.shared) { if (out.length >= 6) break; const a = (queryRaw.get(s.id) || '').toLowerCase(); const b = (s.raw || '').toLowerCase(); const k = a + '|' + b; if (!b || seen.has(k)) continue; seen.add(k); out.push(a && a !== b ? [a, b] : [b]); }
  return out;
}
async function simBuildCards(r, from) {
  const cards = []; const P = r.P; const qraw = r.emb.raw || new Map();
  for (const g of r.groups) for (const it of g.items) {
    const ps = await simPassage(P, it).catch(() => null); if (!ps) continue;
    const shared = simSharedWords(P, r.emb, ps.text, qraw); const words = shared.flatMap((w) => w);
    cards.push({ g: g.name, it, top: r.top, ps, shared, words, motifs: simSharedMotifs(P, r.emb, it.i), pair: from ? simPairs()[[from, it.id].sort().join('|')] : null });
  }
  return cards;
}
function simCardHTML(c, i) {
  const l = LIB_BY_ID[c.it.id] || { title: c.it.id }; const m = c.ps.meta || {};
  return `<article class="card flat sim-card" data-i="${i}"><div class="spread" style="gap:10px;align-items:flex-start"><div style="min-width:0"><h4 style="margin:0"><a href="#/path/read/${c.it.id}?s=${c.it.sec}">${esc(l.title)}</a></h4><div class="small muted">${esc(c.ps.heading)}${m.by ? ' · ' + esc(String(m.by).slice(0, 70)) : ''}</div></div>${simDots(c.it.region, c.top)}</div>
    <p class="sim-ex">${simExcerpt(c.ps.text, c.words)}</p>
    ${c.shared.length ? `<div class="small"><span class="muted">${c.label || 'Words in common'}</span> ${c.shared.map((w) => `<span class="sim-w">${esc(w.join(' ↔ '))}</span>`).join('')}</div>` : ''}
    ${c.motifs && c.motifs.length ? `<div class="small"><span class="muted">Same story or image</span> ${c.motifs.map((mid) => `<a class="chip" href="#/path/motif/${esc(simMotifInit()[mid].id)}">${esc(simMotifInit()[mid].name)}</a>`).join(' ')}</div>` : ''}
    ${c.pair ? `<div class="sim-note"><b>${esc(SIM_KIND[c.pair.kind] || c.pair.kind)}.</b> ${esc(c.pair.note)} <a href="#/path/parallels?p=${c.pair.p}">See the curated pair →</a></div>` : ''}
    <div class="row tight" style="margin-top:8px"><button class="btn sm" type="button" data-sim="side" data-i="${i}">Side by side</button><button class="btn sm ghost" type="button" data-sim="more" data-i="${i}">Find similar to this</button><a class="btn sm ghost" href="#/path/wander?b=${c.it.id}&q=${encodeURIComponent(psgClean(c.ps.text).slice(0, 600))}">Wander from here</a><a class="btn sm ghost" href="#/path/read/${c.it.id}?s=${c.it.sec}">Open in the reader</a></div></article>`;
}
function simGroupsHTML(cards, from) {
  const order = []; cards.forEach((c, i) => { let g = order.find((x) => x.name === c.g); if (!g) { g = { name: c.g, list: [] }; order.push(g); } g.list.push([c, i]); });
  return order.map((g) => `<section class="sim-group"><h3 class="sim-gh">${esc(g.name)}</h3><div class="stack sm">${g.list.map(([c, i]) => simCardHTML(c, i)).join('')}</div></section>`).join('');
}
const SIM_HOW = '<p class="hint" style="margin-top:12px"><b>How these are found.</b> Every passage in the library was turned into numbers from the words it uses, and your passage is compared with about 300,000 others, from the scriptures of every tradition here. Matches share words and themes. Each tradition shows its two closest passages, and up to two more, each from another book, when they are nearly as close as the best match on the page. That does not mean one borrowed from the other: many stories turn up in places that never met. Where scholars have written about a link, the note says so; where they have not, treat a match as an invitation to read both.</p>';
/* the results panel: run, show a card per match, wire the buttons. box = the element to fill; text = the passage; o = { from, same } */
async function simShow(box, text, o) {
  o = o || {}; box.innerHTML = '<p class="t2 small" role="status">Looking through the library…</p>'; box.setAttribute('aria-busy', 'true');
  try {
    let loadingNote = false; if (!SIMX.P) { box.innerHTML = '<p class="t2 small" role="status">Opening the similarity index (about 66 MB, once)…</p>'; loadingNote = true; }
    const r = await simRun(text, o);
    if (r.error) { box.innerHTML = '<section class="card flat"><p class="t2">That passage has too few distinctive words to compare. Try a longer one, or describe the story in a sentence or two.</p></section>'; return; }
    if (!r.groups.length) { box.innerHTML = '<section class="card flat"><p class="t2">Nothing in the other traditions reads close enough to this one to show. Try a longer passage or other words.</p></section>' + SIM_HOW; return; }
    box.innerHTML = '<p class="t2 small" role="status">Opening the closest passages…</p>';
    const cards = await simBuildCards(r, o.from);
    if (SIMX.drop) { SIMX.drop.forEach((id) => TXT.unload(id)); SIMX.drop = null; }          // the passages are held; the books they came from need not be
    if (!cards.length) { box.innerHTML = `<section class="card flat"><p class="t2">${loadFailText('The matching passages could not be opened from the texts folder.')}</p></section>`; return; }
    const dup = r.dups.length ? `<p class="small muted">The same passage also stands in ${r.dups.map((d) => `<a href="#/path/read/${d.id}?s=${d.sec}">${esc((LIB_BY_ID[d.id] || { title: d.id }).title)}</a>`).join(', ')} (left out above).</p>` : '';
    const stale = r.stale ? `<p class="hint">${r.stale} text${r.stale === 1 ? ' has' : 's have'} changed since the index was built and ${r.stale === 1 ? 'is' : 'are'} left out. Rebuild it with <code>node tools/build_similar.js</code>.</p>` : '';
    box.innerHTML = `<div class="spread" style="align-items:baseline;gap:10px;flex-wrap:wrap"><h2 style="font-size:20px;margin:6px 0">Passages that read like this</h2><span class="muted small">${cards.length} from ${r.groups.length} tradition${r.groups.length === 1 ? '' : 's'}${o.same ? '' : ', other than its own'}, closest first</span></div>
      ${simGroupsHTML(cards, o.from)}${dup}${SIM_HOW}${stale}`;
    box._sim = { cards, r, text, o };
  } catch (e) {
    box.innerHTML = /missing similar/.test(e.message)
      ? `<section class="card flat"><div class="callout warn">${icon('warn')}<div>${loadFailText('The <b>similar</b> folder was not found next to Lamplighter.html, so there is nothing to compare against yet. It is built from the texts folder with <code>node tools/build_similar.js</code> (about a minute).')}</div></div></section>`
      : `<section class="card flat"><p class="t2">Could not compare: ${esc(e.message)}</p></section>`;
  } finally { box.removeAttribute('aria-busy'); }
}
/* clicks inside a results panel */
function simWire(box, onMore) {
  box.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sim]'); if (!b || !box._sim) return; const c = box._sim.cards[+b.dataset.i]; if (!c) return;
    if (b.dataset.sim === 'side') simSideBySide(box._sim, c);
    else if (b.dataset.sim === 'more') onMore(c);
  });
}
/* two passages next to each other, the shared words marked in both */
function simSideBySide(sim, c) {
  const from = sim.o.from; const lf = from ? LIB_BY_ID[from] : null; const lt = LIB_BY_ID[c.it.id] || { title: c.it.id };
  const col = (title, sub, text) => `<div class="sim-col"><h4 style="margin:0">${esc(title)}</h4><div class="small muted">${esc(sub)}</div><div class="sim-ex" style="margin-top:8px">${simMark(esc(psgClean(text)), c.words)}</div></div>`;
  modal({ title: 'Side by side', html: `<div class="sim-side">${col(lf ? lf.title : 'Your passage', lf && sim.o.heading ? sim.o.heading : '', sim.text)}${col(lt.title, c.ps.heading, c.ps.text)}</div>
    ${c.shared.length ? `<p class="small" style="margin-top:10px"><span class="muted">Words in common</span> ${c.shared.map((w) => `<span class="sim-w">${esc(w.join(' ↔ '))}</span>`).join('')}</p>` : ''}
    ${c.pair ? `<div class="sim-note"><b>${esc(SIM_KIND[c.pair.kind] || c.pair.kind)}.</b> ${esc(c.pair.note)}</div>` : '<p class="hint">A statistical match only says these read alike. It is not a claim that either borrowed from the other.</p>'}`, actions: [{ label: 'Close', kind: 'primary', value: true }] });
  const mm = document.querySelectorAll('.modal-back .modal'); if (mm.length) mm[mm.length - 1].classList.add('sim-wide');
}

/* a passage widened to the lines around it (about `target` characters), so a story is compared as a story and not by a few lines of it */
function simContext(secText, text, target) {
  const t = String(text); const at = secText ? secText.indexOf(t.slice(0, Math.min(80, t.length))) : -1; if (at < 0 || t.length >= target) return t;
  let a = at; let b = at + t.length; const want = target - t.length;
  while (b - at - t.length < want / 2 && b < secText.length) { const n = secText.indexOf('\n\n', b + 2); b = n < 0 ? secText.length : n; }
  while (at - a < want / 2 && a > 0) { const n = secText.lastIndexOf('\n\n', a - 2); a = n < 0 ? 0 : n; }
  return secText.slice(a, b).trim();
}

/* ── the page: Texts → Compare passages → Find similar ── */
const SIM_EXAMPLES = [
  ['A flood and a boat', 'A man is warned by a god that a great flood is coming, so he builds a boat, takes his family and the animals aboard, and afterwards sends out birds to find dry land.'],
  ['The golden rule', 'Do to others as you would have them do to you. What is hateful to you, do not do to your neighbour. Love your neighbour as yourself. Do not hurt others in ways that you yourself would find hurtful.'],   /* the first wording, "treat others as you would want them to treat you…", is nearly all everyday words that count for nothing: two words were left and the page refused it (tests/similar.test.js now runs every example) */
  ['Love your enemies', 'Do not return hatred for hatred; answer harm with kindness, because hatred never ends by hatred.'],
  ['Before the world', 'In the beginning there was only water and darkness, and then the world was divided and made.'],
  ['The soul after death', 'After death the soul goes down into the world below, where the dead are judged and the living may not go.'],
  ['A giant made into a world', 'The gods killed a great being and made the sky from his skull and the earth from his body.'],
];
function pathSimilarView(root, query) {
  const body = root.querySelector('#pbody'); const from = query.b && LIB_BY_ID[query.b] ? query.b : ''; const q0 = String(query.q || '').slice(0, 900);
  body.innerHTML = `<p class="t2 small" style="max-width:74ch">Paste a passage, or describe a story or an idea in your own words, and see which passages of other books and traditions read most like it: the same words, the same events, side by side. ${from ? `Your passage came from <b>${esc(LIB_BY_ID[from].title)}</b>, so that book and its tradition are left out. ` : ''}It is found by statistics over every English text in the library, not by anyone’s judgement, so a match is a place to start reading, not proof of a link.</p>
    <section class="card flat" style="margin:14px 0"><label class="small t2" for="smQ">A passage, or a few sentences about a story or idea</label>
      <textarea class="input" id="smQ" rows="4" maxlength="900" style="width:100%;margin-top:4px" placeholder="e.g. a man is warned of a flood, builds a boat and sends out a dove">${esc(q0)}</textarea>
      <div class="row" style="margin-top:8px;gap:10px;flex-wrap:wrap"><button class="btn primary" id="smGo" type="button">${icon('search')}Find similar passages</button>
        <label class="chk"><input type="checkbox" id="smSame"><span class="small">Include ${from ? 'its own tradition' : 'every tradition'}</span></label></div>
      <div class="row tight" style="margin-top:10px"><span class="small muted">Try</span>${SIM_EXAMPLES.map(([n, t], i) => `<button class="chip" type="button" data-ex="${i}">${esc(n)}</button>`).join('')}</div></section>
    <div id="smOut" aria-live="polite"></div>`;
  const out = $('#smOut', body); const ta = $('#smQ', body);
  const go = () => { const t = ta.value.trim(); if (!t) { out.innerHTML = '<p class="t2 small">Type or paste something first.</p>'; return; } SIMX.lastQuery = t; simShow(out, t, { from, same: $('#smSame', body).checked }); };
  $('#smGo', body).addEventListener('click', go); ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); go(); } });
  body.addEventListener('click', (e) => { const ex = e.target.closest('[data-ex]'); if (ex) { ta.value = SIM_EXAMPLES[+ex.dataset.ex][1]; $('#smSame', body).checked = false; go(); } });
  simWire(out, (c) => { ta.value = psgClean(c.ps.text).slice(0, 700); location.hash = '#/path/similar?b=' + c.it.id + '&q=' + encodeURIComponent(ta.value); });
  if (q0.trim()) go();
}
if (typeof module !== 'undefined' && module.exports) module.exports = { simPairs };
