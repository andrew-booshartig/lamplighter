/* ═══════════════════════════ 6j · Glossary view (Library → More → Glossary, #/path/glossary) ═══════════════════════════
   The words and names the texts use, in plain English. A word is found by any of its spellings (Ormazd, Hormazd and Ahura Mazda are one entry), and the same entries are what the reader's
   underlined words and its Look up explain (6zw-words.js). A search of two letters or more also asks the built-in dictionary (6zx-dictionary.js), so any English word can be looked up here.
   The page opens on its words: one sentence, the search, a row of letters to jump to, and the list from the first word. The filter by tradition and the notes on how the list works sit under two quiet buttons,
   and the keys to one book's notes (West's abbreviations, manuscript letters and helpers) are not words of the religions, so they sit apart, under "Keys used in the notes", after Z. Every entry is still here. */
const GLOSS_KEY = /^(?:abbreviations|manuscript letters)\b|\bin [^\s]+’s notes$/i;
const glossIsKey = (g) => GLOSS_KEY.test(String(g && g[0] || ''));
const glossLetter = (g) => g[0].replace(/[^A-Za-z]/g, '').charAt(0).toUpperCase() || '#';
function pathGlossaryView(root, query) {
  const q = (query.q || '').trim().toLowerCase(); const t = query.t || '';
  const list = GLOSSARY.filter((g) => (!t || g[4].includes(t)) && (!q || (luNames(g).join(' ') + ' ' + g[1] + ' ' + g[2] + ' ' + g[3]).toLowerCase().includes(q) || luNames(g).some((n) => luKey(n) === luKey(q)))).slice().sort((a, b) => a[0].localeCompare(b[0], 'en', { sensitivity: 'base' }));
  const words = list.filter((g) => !glossIsKey(g)); const keys = list.filter(glossIsKey); const letters = [...new Set(words.map(glossLetter))];
  let last = '';
  const entry = (g) => { const also = luNames(g).slice(1); return `<dt>${esc(g[0])} <span class="muted small">${esc(g[2])}</span></dt><dd>${esc(g[3])}${also.length ? ` <span class="small t2">Also written: ${also.slice(0, 10).map(esc).join(', ')}.</span>` : ''} <span class="small">${g[4].map((id) => `<a class="chip" href="#/path/tradition/${id}">${esc(TRAD_BY_ID[id].short)}</a>`).join(' ')}</span></dd>`; };
  const wordsHTML = words.map((g) => { const l = glossLetter(g); const head = l !== last ? `<div class="gl-letter" id="gl-${l}">${l}</div>` : ''; last = l; return head + entry(g); }).join('');
  const keysHTML = keys.length ? `<details class="gl-keys card flat" id="gl-keys"${q ? ' open' : ''}><summary><b>Keys used in the notes</b> <span class="muted small">(${keys.length}: the short forms, manuscript letters and helpers that one book’s footnotes name)</span></summary><dl class="gloss">${keys.map(entry).join('')}</dl></details>` : '';
  root.querySelector('#pbody').innerHTML = `<p class="lede">${GLOSSARY.length - GLOSSARY.filter(glossIsKey).length} words and names you will meet in the texts, in plain English: a first orientation, not the last word.</p>
    <div class="row" style="margin:0 0 10px"><input class="input" id="glQ" type="search" placeholder="Search words and meanings…" value="${esc(query.q || '')}" style="max-width:280px" aria-label="Search the glossary">${q || t ? `<span class="muted small">${list.length} shown</span>` : ''}</div>
    <nav class="gl-az" aria-label="Jump to a letter">${letters.map((l) => `<button type="button" class="gl-azb" data-gljump="${l}">${l}</button>`).join('')}${keys.length ? '<button type="button" class="gl-azb gl-azk" data-gljump="keys">Keys</button>' : ''}</nav>
    <div class="gl-quick"><button type="button" class="gl-pbtn" data-glp="glTrad" aria-expanded="${!!t}" aria-controls="glTrad"><span>By tradition</span>${icon('chevron')}</button><button type="button" class="gl-pbtn" data-glp="glHow" aria-expanded="false" aria-controls="glHow"><span>About this list</span>${icon('chevron')}</button>${t ? `<span class="muted small">${esc((TRAD_BY_ID[t] || { short: t }).short)}</span>` : ''}</div>
    <div class="gl-pane" id="glTrad"${t ? '' : ' hidden'}><div class="row tight"><a class="chip" href="#/path/glossary" aria-pressed="${!t}">All</a>${GLOSS_TRADS.map((id) => `<a class="chip" href="#/path/glossary?t=${id}" aria-pressed="${t === id}">${esc(TRAD_BY_ID[id].short)}</a>`).join('')}</div></div>
    <div class="gl-pane" id="glHow" hidden><p class="t2 small" style="max-width:72ch;margin:0">Each is a first orientation, not the last word: most have disputed or tradition-specific senses. Words belong to their communities, so where you can, learn them from the people who use them. In the reader, names and terms listed here are underlined with dots: tap one for its note (Aa → Word help turns that on or off). Type any other English word to see Webster’s 1913 dictionary on it, here and offline.</p></div>
    <div id="glDict" class="dk-box" data-dklink="0" aria-live="polite" ${(query.q || '').trim().length >= 2 ? '' : 'hidden'}></div>
    <div class="card flat"><dl class="gloss">${wordsHTML || '<p class="t2">No word matches.</p>'}</dl></div>${keysHTML}`;
  const go = debounce(() => { location.hash = `#/path/glossary?${new URLSearchParams(Object.assign({}, t ? { t } : {}, { q: $('#glQ', root).value }))}`; }, 350);
  $('#glQ', root).addEventListener('input', go);
  root.addEventListener('click', (e) => {
    const pb = e.target.closest && e.target.closest('[data-glp]'); if (pb) { const pane = root.querySelector('#' + pb.dataset.glp); if (pane) { const on = !!pane.hidden; pane.hidden = !on; pb.setAttribute('aria-expanded', String(on)); } return; }
    const jb = e.target.closest && e.target.closest('[data-gljump]'); if (!jb) return;
    const how = typeof prefersReducedMotion === 'function' && prefersReducedMotion() ? 'auto' : 'smooth';      /* the jump glides unless the reader asked for no motion */
    const k = jb.dataset.gljump; if (k === 'keys') { const d = root.querySelector('#gl-keys'); if (d) { d.open = true; if (d.scrollIntoView) d.scrollIntoView({ behavior: how, block: 'start' }); } return; }
    const el = root.querySelector('#gl-' + k); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: how, block: 'start' });
  });
  if ((query.q || '').trim().length >= 2) dictFill($('#glDict', root), (query.q || '').trim());
}
