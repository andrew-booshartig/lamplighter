/* ═══════════════════════════ 6v · Motifs: how the traditions tell the same stories and keep the same rites ═══════════════════════════
   Pick a motif (the flood, the descent to the underworld, the sacred meal, spells, purification, the golden rule …) and see how each tradition in the library tells it, side by side.
   The motifs are a hand-written list (2x-motifs.js) and passages are tagged by the words that usually mark a motif, so this is found by words, not by understanding; the page says so.
   It needs only a small file (similar/motifs.js) and the texts themselves, not the big similarity index. */
const MOTIFX = { data: null, loading: null };
async function motifLoad() {
  if (MOTIFX.data) return MOTIFX.data;
  if (!MOTIFX.loading) MOTIFX.loading = (async () => {
    await simScript('motifs'); const d = BEATLAB_SIM.data.motifs; const meta = (await TXT.index()) || {};
    d.stale = new Set(); d.texts.forEach((id, i) => { const m = meta[id]; if (!m || m.chars !== d.textChars[id]) d.stale.add(i); });
    d.current = d.version === simMotifVersion(); d.by = Object.fromEntries(d.motifs.map((m) => [m.id, m])); MOTIFX.data = d; return d;
  })().catch((e) => { MOTIFX.loading = null; throw e; });
  return MOTIFX.loading;
}
/* where a motif has a page of its own in the Themes, the honest note on where traditions part ways comes from there */
const MOTIF_THEME = { flood: 'flood', 'underworld-descent': 'descent', 'golden-rule': 'golden', 'animal-sacrifice': 'sacrifice', 'human-sacrifice': 'sacrifice', 'breath-spirit': 'breath', 'chaos-waters': 'creation', 'world-giant': 'creation', 'first-humans': 'creation', 'funeral-rites': 'death', 'judgment-dead': 'death', 'mystic-union': 'mystic', meditation: 'contemplation', 'one-god': 'one', 'ancestors-dead': 'ancestors', 'sacred-place': 'place', 'holy-days': 'time', 'great-mother': 'feminine', 'the-way': 'canon' };
const MOTIF_CARE = { 'human-sacrifice': 'This page gathers passages that tell of, command or look back on people being killed as offerings. They are here to be understood as part of human history, not endorsed.', martyrdom: 'This page gathers passages about believers killed for their faith and about killing done in the name of faith. They are here to be understood, from every side that appears, not endorsed.' };
const motifById = (id) => simMotifInit().find((m) => m.id === id);
function motifWords(m, text) {
  const out = []; const seen = new Set(); for (const [st, rw] of simTerms(text, true)) { if ((m.core.has(st) || m.support.has(st)) && !seen.has(st)) { seen.add(st); out.push([m.core.has(st) ? 1 : 0, rw]); } }
  return out.sort((a, b) => b[0] - a[0]).map((x) => x[1]).slice(0, 8);
}

async function pathMotifsView(root, query) {
  const body = root.querySelector('#pbody'); const kind = SIM_MOTIF_KINDS[query.k] ? query.k : '';
  body.innerHTML = `<p class="t2 small" style="max-width:74ch">Recurring stories and images (motifs): the same stories, rites and ways of living turn up in places that never met. Choose one to see how each tradition in the library tells it or keeps it, side by side, from the flood to the sacred meal, from spells and lamps to the golden rule. Passages are picked because they use a theme’s usual words, so they are starting points for reading, not proof that two traditions mean the same thing. Where they part ways matters as much as where they rhyme, and each page says so where it can.</p>
    <div class="row tight" style="margin:12px 0" role="group" aria-label="Type of recurring story or image"><a class="chip${kind ? '' : ' on'}" href="#/path/motifs">Everything</a>${Object.entries(SIM_MOTIF_KINDS).map(([k, n]) => `<a class="chip${kind === k ? ' on' : ''}" href="#/path/motifs?k=${k}">${esc(n)}</a>`).join('')}</div><div id="mtOut"><p class="t2 small" role="status">Opening the recurring stories and images…</p></div>${typeof storyLookCloser === 'function' ? storyLookCloser() : ''}`;      /* SA-12: the story invitation is one quiet card under the list, not above it */
  const out = $('#mtOut', body);
  try {
    const d = await motifLoad(); const ms = simMotifInit().filter((m) => d.by[m.id] && d.by[m.id].n && (!kind || m.kind === kind));
    const groups = Object.entries(SIM_MOTIF_KINDS).filter(([k]) => !kind || kind === k).map(([k, n]) => [n, ms.filter((m) => m.kind === k)]).filter(([, l]) => l.length);
    out.innerHTML = groups.map(([n, l]) => `<h2 style="margin:22px 0 10px;font-size:18px">${esc(n)}</h2><div class="grid auto-lg">${l.map((m) => { const x = d.by[m.id]; return `<a class="card pcard fade-in" href="#/path/motif/${m.id}" style="text-decoration:none;color:inherit"><h3 style="margin:0 0 4px">${esc(m.name)}</h3><p class="small t2" style="margin:0 0 8px">${esc(m.line)}</p><div class="small muted">${x.n.toLocaleString('en-US')} passage${x.n === 1 ? '' : 's'} in ${x.books} book${x.books === 1 ? '' : 's'}</div></a>`; }).join('')}</div>`).join('') + (d.current ? '' : '<p class="hint">The list of recurring stories and images was changed after the index was built. Rebuild it with <code>node tools/build_similar.js</code> so the passages match.</p>');
  } catch (e) { out.innerHTML = `<section class="card flat"><div class="callout warn">${icon('warn')}<div>${loadFailText('The <b>similar</b> folder was not found next to Lamplighter.html, so the recurring stories and images cannot be shown yet. It is built from the texts folder with <code>node tools/build_similar.js</code> (about a minute).')}</div></div></section>`; }
}

async function pathMotifView(root, id, query) {
  const body = root.querySelector('#pbody'); const m = motifById(id);
  if (!m) { body.innerHTML = '<div class="card"><p>No such recurring story or image. <a href="#/path/motifs">Back to the list</a></p></div>'; return; }
  const theme = MOTIF_THEME[id] && typeof THEMES !== 'undefined' ? THEMES[MOTIF_THEME[id]] : null;
  body.innerHTML = `<div class="small" style="margin-bottom:10px"><a href="#/path/motifs">← All recurring stories and images</a> · ${esc(SIM_MOTIF_KINDS[m.kind])}</div>
    <section class="card glow fade-in"><div class="eyebrow">${esc(SIM_MOTIF_KINDS[m.kind])}</div><h2 style="font-size:28px;margin:4px 0">${esc(m.name)}</h2><p style="max-width:68ch;font-size:16px;margin:8px 0">${esc(m.line)}</p>
      ${MOTIF_CARE[id] ? `<div class="callout" style="margin-top:10px">${icon('info')}<div>${esc(MOTIF_CARE[id])}</div></div>` : ''}
      ${theme ? `<div class="sim-note" style="margin-top:12px"><b>Where traditions part ways.</b> ${esc(theme.differs || theme.line)}</div>` : ''}
      <div class="row" style="margin-top:12px"><button class="btn dice" id="mtShuffle" type="button">${icon('dice')}Show others</button><a class="btn ghost" href="#/path/motifs">Another story or image</a></div></section>
    <div id="mtOut" aria-live="polite" style="margin-top:14px"><p class="t2 small" role="status">Gathering the passages…</p></div>
    ${typeof relatedBox === 'function' ? relatedBox('motif', id, {}) : ''}`;      /* SA-02: only a motif that is also a story (the flood, the garden …) has groups; any other draws nothing */
  const out = $('#mtOut', body); let cards = []; let seed = 0;
  const pick = async (shuffle) => {
    out.innerHTML = '<p class="t2 small" role="status">Opening the passages…</p>'; out.setAttribute('aria-busy', 'true');
    try {
      const d = await motifLoad(); const x = d.by[id]; const meta = (await TXT.index()) || {};
      if (!x || !x.items.length) { out.innerHTML = '<section class="card flat"><p class="t2">No passages in the library were tagged with this story or image.</p></section>'; return; }
      const byColl = new Map(); for (const [t, sec, a, len, sc] of x.items) { if (d.stale.has(t)) continue; const tid = d.texts[t]; if (tid === 'p-lxx') continue; /* the Septuagint repeats the Bible's stories */ const c = simCollOf(tid); if (!byColl.has(c)) byColl.set(c, []); byColl.get(c).push({ id: tid, sec, a, len, score: sc }); }
      const chosen = []; for (const [c, list] of byColl) {
        const pool = list.slice(0, shuffle ? 8 : 3); const first = shuffle ? randShuffle(pool) : pool; const seenT = new Set(); const take = [];
        for (const it of first) { if (seenT.has(it.id)) continue; seenT.add(it.id); take.push(it); if (take.length >= 2) break; }
        take.forEach((it) => chosen.push({ c, it, best: list[0].score }));
      }
      chosen.sort((a, b) => b.best - a.best || a.c - b.c);
      cards = []; for (const ch of chosen) { const ps = await simPassage(null, ch.it).catch(() => null); if (!ps) continue; const words = motifWords(m, ps.text); cards.push({ g: simCollName(ch.c), it: Object.assign({}, ch.it, { region: ch.it.score, near: 0 }), top: 255, ps, shared: words.map((w) => [w]), words, pair: null, label: 'Words that marked it' }); }
      if (SIMX.drop) { SIMX.drop.forEach((tid) => TXT.unload(tid)); SIMX.drop = null; }
      if (!cards.length) { out.innerHTML = `<section class="card flat"><p class="t2">${loadFailText('The passages could not be opened from the texts folder.')}</p></section>`; return; }
      const traditions = new Set(cards.map((c) => c.g)).size;
      out.innerHTML = `<div class="spread" style="align-items:baseline;gap:10px;flex-wrap:wrap"><h2 style="font-size:20px;margin:6px 0">How ${traditions} tradition${traditions === 1 ? '' : 's'} ${m.kind === 'rite' || m.kind === 'conduct' ? 'keep or teach this' : 'tell this'}</h2><span class="muted small">${x.n.toLocaleString('en-US')} passages in ${x.books} books carry this story or image; the strongest are shown</span></div>
        ${simGroupsHTML(cards, '')}<p class="hint" style="margin-top:12px"><b>Found by words.</b> These passages use the words that usually mark this story or image (marked above), so some only touch it. A match across traditions can mean a story travelled, or that people far apart told the same kind of story; the passages alone cannot say which. Press “Show others” for more.</p>${d.current ? '' : '<p class="hint">The list of recurring stories and images was changed after the index was built. Rebuild it with <code>node tools/build_similar.js</code>.</p>'}`;
      out._cards = cards; out.querySelectorAll('[data-sim="side"]').forEach((b) => b.remove());
    } catch (e) { out.innerHTML = `<section class="card flat"><div class="callout warn">${icon('warn')}<div>${loadFailText('The <b>similar</b> folder was not found next to Lamplighter.html. It is built from the texts folder with <code>node tools/build_similar.js</code>.')}</div></div></section>`; } finally { out.removeAttribute('aria-busy'); }
  };
  $('#mtShuffle', body).addEventListener('click', () => pick(true));
  out.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sim]'); if (!b || !out._cards) return; const c = out._cards[+b.dataset.i]; if (!c) return;
    if (b.dataset.sim === 'more') { location.hash = '#/path/similar?b=' + c.it.id + '&q=' + encodeURIComponent(psgClean(c.ps.text).slice(0, 700)); }
  });
  pick(false);
}
if (typeof module !== 'undefined' && module.exports) module.exports = { MOTIF_THEME };
