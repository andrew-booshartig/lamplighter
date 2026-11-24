/* ═══════════════════════════ 6zw · Word help: the underlined words and their card ═══════════════════════════
   Where the reader and the random-passage page print a text, the names and terms the Lamplighter Project's glossary can explain are underlined with dots (paraHTML does it, using the index from
   wordsFor). A tap, a click or Enter on one opens a short card: what it is, other spellings, where to read more. The card is the same everywhere because one listener on the page serves
   every screen. "Look further" opens the same box as the reader's Look up (the glossary entries for the words, then the built-in dictionary's answer (6zx-dictionary.js), then two outside links
   that open only if chosen). Nothing is fetched or sent.
   The Aa panel's "Word help" chooses the first mention of each word in a section (the default), every mention, or none (reading.prefs.help). */
const WH_IX = new Map();                                    // one index per text, built the first time that text is shown
/* the context paraHTML wants for one text, or null when Word help is off */
function wordsFor(id) {
  const mode = typeof rtGet === 'function' ? rtGet().help : 'first'; if (mode === 'off') return null;
  let ix = WH_IX.get(id);
  if (!ix) { const l = typeof LIB_BY_ID !== 'undefined' ? LIB_BY_ID[id] : null; ix = trmIndex(GLOSSARY, { id, group: l ? l.group : '' }); WH_IX.set(id, ix); if (WH_IX.size > 40) WH_IX.delete(WH_IX.keys().next().value); }
  return { ix, every: mode === 'every' };
}
/* the box behind "Look up" and the card's "Look further": what the glossary says about the words, what the built-in dictionary says (filled in when its file has loaded), then where to look further */
async function wordLookupBox(text) {
  const q0 = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 120); const g = luGloss(q0, GLOSSARY); const lk = luLinks(q0);
  const items = g.map(({ entry: e2, how }) => { const c = trmCard(e2, '');
    return `<div class="card flat" style="margin:8px 0"><b>${esc(e2[0])}</b> <span class="muted small">${esc(e2[2])} · ${esc(e2[1])}${how === 'word' ? ' · shares a word with your selection' : how === 'like' ? ' · your selection may be a misspelling of this name' : ''}</span><p style="margin:6px 0 4px">${esc(e2[3])}</p>${c.also.length ? `<p class="small t2" style="margin:0 0 4px">Also written: ${c.also.map(esc).join(', ')}.</p>` : ''}<a class="small" href="#/path/glossary?q=${encodeURIComponent(e2[0])}">In the glossary →</a></div>`; }).join('');
  const html = `<p class="small t2" style="margin-top:0">You selected <b>“${esc(q0)}”</b></p>${items || '<p class="small t2">Not in the Lamplighter Project’s glossary, which is a list of religious words and names: a word missing from it is not a sign that it is unimportant.</p>'}<div id="dkBox" class="dk-box" aria-live="polite"></div><div class="row" style="margin-top:10px">${lk.word ? ext(lk.word, 'Look up on Wiktionary') : ''}${lk.wiki ? ext(lk.wiki, 'Search Wikipedia') : ''}<a class="small" href="${srchHash('"' + q0.replace(/"/g, '').split(' ').slice(0, 8).join(' ') + '"', srchOpts({}))}">Search every text for it →</a></div><p class="hint" style="margin-top:8px">The two outside links open another site in a new tab, and only if you click them. Nothing is sent from here.</p>`;
  const done = modal({ title: 'Look up', html, actions: [{ label: 'Close', kind: 'primary', value: true }] }); const mb = document.querySelector('.modal-back');
  dictFill(document.querySelector('.modal-back #dkBox'), q0);
  if (mb) mb.addEventListener('click', (e3) => { if (e3.target.closest && e3.target.closest('a[href^="#"]')) mb.close(undefined); });
  await done;
}

/* ── the card ── */
let whCard = null; let whFrom = null; let whTimer = 0;
function whClose(back) {
  clearTimeout(whTimer);
  if (whCard) { whCard.remove(); whCard = null; }
  if (whFrom) { whFrom.removeAttribute('aria-expanded'); if (back && whFrom.isConnected && whFrom.focus) whFrom.focus({ preventScroll: true }); whFrom = null; }
}
function whOpen(span) {
  const g = GLOSSARY[+span.dataset.k]; if (!g) return; whClose(false);
  const shown = (span.textContent || '').replace(/\s+/g, ' ').trim(); const c = trmCard(g, shown);
  const chips = c.ids.filter((id) => typeof TRAD_BY_ID !== 'undefined' && TRAD_BY_ID[id]).map((id) => `<a class="chip" href="#/path/tradition/${esc(id)}">${esc(TRAD_BY_ID[id].short)}</a>`).join(' ');
  const see = c.see.map((t) => `<a href="#/path/glossary?q=${encodeURIComponent(t)}">${esc(t)}</a>`).join(', ');
  const el = document.createElement('div'); el.className = 'tcard'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Word help: ' + c.term); el.tabIndex = -1;
  el.innerHTML = `<div class="tc-head"><div><b class="tc-term">${esc(c.term)}</b><div class="small muted">${esc(c.lang)} · ${esc(c.kin)}</div></div><button class="btn sm ghost" type="button" data-tcx aria-label="Close">${icon('x')}</button></div>
    ${c.variant ? `<p class="small t2 tc-var">This page prints it “${esc(shown)}”. Old translations and scans of them spell names in many ways.</p>` : ''}
    <p class="tc-body">${esc(c.meaning)}</p>${c.also.length ? `<p class="small t2" style="margin:0 0 6px">Also written: ${c.also.map(esc).join(', ')}.</p>` : ''}${see ? `<p class="small t2" style="margin:0 0 6px">See also: ${see}.</p>` : ''}
    <div class="row tight tc-links">${chips}<a class="small" href="#/path/glossary?q=${encodeURIComponent(c.term)}">In the glossary →</a><button class="btn sm ghost" type="button" data-tcmore="${esc(shown)}">Look further…</button><button class="btn sm ghost" type="button" data-tcask title="Ask an AI about this word: it copies a ready-made, neutral question and opens the AI’s own site in a new tab. Nothing is sent from here.">${icon('sparkle')}Ask an AI</button></div>`;
  document.body.appendChild(el); whCard = el; whFrom = span; span.setAttribute('aria-expanded', 'true');
  const vw = window.innerWidth || 1024; const vh = window.innerHeight || 768;
  if (vw > 760) {                                                        // beside the word on a wide screen; on a narrow one the sheet sits above the bottom bar (CSS)
    const r = (span.getClientRects && span.getClientRects()[0]) || span.getBoundingClientRect(); const w = Math.min(420, vw - 24); const hgt = el.offsetHeight || 220;
    const left = Math.max(12, Math.min(r.left, vw - w - 12)); let top = r.bottom + 8; if (top + hgt > vh - 12) top = Math.max(12, r.top - hgt - 8);
    el.style.left = left + 'px'; el.style.top = top + 'px';
  } else {                                                              // on a phone the sheet must not hide the word it explains: scroll the page just enough (pages that turn do not scroll)
    const r = (span.getClientRects && span.getClientRects()[0]) || span.getBoundingClientRect(); const over = r.bottom - (el.getBoundingClientRect().top - 12);
    if (over > 0 && !(document.body && document.body.dataset && (document.body.dataset.rdmode === 'page' || document.body.dataset.rdmode === 'sheet')) && window.scrollBy) window.scrollBy(0, over);
  }
  if (el.focus) el.focus({ preventScroll: true });
}
/* what the card's "Ask an AI" hands to the panel: the sentence the word is in, the word, and where it is read, as far as the page says (the reader's address, or the nearest link to a text; a heading in the reader) */
function whAskContext(span) {
  if (!span) return null; const word = (span.textContent || '').replace(/\s+/g, ' ').trim(); if (!word) return null;
  let sentence = word; const p = span.closest ? span.closest('p') : null;
  if (p && p.querySelectorAll) { try {
    const all = Array.from(p.querySelectorAll('.gt')); const ix = all.indexOf(span); const c = p.cloneNode(true); c.querySelectorAll('.vn').forEach((n) => n.remove()); const mine = c.querySelectorAll('.gt')[ix];
    if (mine) { mine.textContent = '\u0001' + mine.textContent + '\u0002'; const t = c.textContent.replace(/\s+/g, ' '); const i = t.indexOf('\u0001'); const j = t.indexOf('\u0002');
      if (i >= 0 && j > i) { let a = 0; for (const m of ['. ', '? ', '! ', '” ', '; ']) { const k = t.lastIndexOf(m, i); if (k >= 0 && k + m.length > a) a = k + m.length; } let b = t.length; for (const m of ['. ', '? ', '! ', '” ', '; ']) { const k = t.indexOf(m, j); if (k >= 0 && k + 1 < b) b = k + 1; }
        sentence = t.slice(a, b).replace(/[\u0001\u0002]/g, '').trim() || word; if (sentence.length > 520) { const w = t.slice(Math.max(0, i - 240), Math.min(t.length, j + 240)).replace(/[\u0001\u0002]/g, '').trim(); sentence = w; } } }
  } catch (e) { sentence = word; } }
  let id = ''; const m = /^#\/path\/read\/([A-Za-z0-9_-]+)/.exec(typeof location !== 'undefined' ? location.hash || '' : ''); if (m) id = m[1];
  if (!id && span.parentElement) { let box = span.parentElement; for (let k = 0; k < 7 && box && !id; k++, box = box.parentElement) { const a = box.querySelector ? box.querySelector('a[href^="#/path/read/"]') : null; const mm = a ? /^#\/path\/read\/([A-Za-z0-9_-]+)/.exec(a.getAttribute('href') || '') : null; if (mm) id = mm[1]; } }
  const known = id && typeof LIB_BY_ID !== 'undefined' && LIB_BY_ID[id]; const sec = span.closest ? span.closest('.rdsec') : null; const hd = sec && sec.querySelector ? sec.querySelector('.rtitle') : null; const heading = hd ? (hd.textContent || '').replace(/\s+/g, ' ').trim() : '';
  const cite = known && typeof rdCitation === 'function' ? rdCitation(id, heading, sentence, '').split('\n').slice(1).join('\n') : '';
  return { text: sentence, focus: word, cite, label: sentence === word ? 'The word' : 'The word, in the sentence it is in' };
}
function whOnClick(e) {
  const hit = e.target && e.target.closest ? e.target : null; if (!hit) return;
  const inCard = hit.closest('.tcard'); const t = hit.closest('.gt');
  if (inCard) {
    if (hit.closest('[data-tcx]')) { whClose(true); return; }
    const more = hit.closest('[data-tcmore]'); if (more) { const q = more.dataset.tcmore; whClose(false); wordLookupBox(q); return; }
    if (hit.closest('[data-tcask]')) { const ctx = whAskContext(whFrom); whClose(false); if (ctx && typeof askOpen === 'function') askOpen(ctx); return; }
    if (hit.closest('a[href^="#"]')) whClose(false);
    return;
  }
  if (whCard && !t) whClose(false);                                       // a click anywhere else puts the card away
  if (!t) return;
  clearTimeout(whTimer); const sel = window.getSelection ? window.getSelection() : null; if (sel && !sel.isCollapsed) return;
  if (t === whFrom) { whClose(true); return; }                            // the same word again closes it
  if (e.detail > 1) return;                                               // a double-click is selecting the word
  const mouse = e.pointerType === 'mouse' || (e.pointerType === undefined && e.detail > 0);
  if (mouse) whTimer = setTimeout(() => { if (t.isConnected) whOpen(t); }, 220); else whOpen(t);       // a mouse waits a moment so that a double-click can select the word instead
}
function whOnKey(e) {
  if (e.key === 'Escape' && whCard) { e.preventDefault(); whClose(true); return; }
  if ((e.key !== 'Enter' && e.key !== ' ') || e.altKey || e.ctrlKey || e.metaKey) return;
  const t = e.target && e.target.closest ? e.target.closest('.gt') : null; if (t) { e.preventDefault(); whOpen(t); }
}
if (typeof document !== 'undefined' && document.addEventListener && !globalThis.__whWired) {
  globalThis.__whWired = true;
  document.addEventListener('click', whOnClick); document.addEventListener('keydown', whOnKey);
  if (typeof window !== 'undefined' && window.addEventListener) {
    ['hashchange', 'rt:change', 'rl:change', 'resize'].forEach((n) => window.addEventListener(n, () => whClose(false)));
    window.addEventListener('scroll', () => { if (whCard && (window.innerWidth || 1024) > 760) whClose(false); }, { passive: true });
  }
}
