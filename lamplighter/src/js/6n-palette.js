/* ═══════════════════════════ 6n · Search and jump (press / or Ctrl/⌘-K anywhere) ═══════════════════════════
   One box that finds a text, station, tradition, word, parallel passage, passage set or page by name, and, first of all, searches every text for what you typed (a single word can also be defined from the built-in dictionary).
   Arrow keys to move, Enter to go, Esc to close. Everything comes from data already in the page. */
function palItems() {
  const out = [];
  const add = (kind, label, sub, href, extra) => out.push({ kind, label, sub: sub || '', href, hay: searchKey(label + ' ' + (sub || '') + (extra ? ' ' + extra : '')), lab: searchKey(label) });      // extra: other names the item is found by
  /* every page of the app, under the place and the tab it is in (2z-sections-core.js); the lab tools only when they are switched on */
  const lab = typeof Settings !== 'undefined' && !!Settings.get('showLab');
  SECTIONS.forEach((sec) => sec.tabs.filter((t) => !t.lab || lab).forEach((t) => { add('Page', t.label, sec.label, t.href, t.find); (t.subs || []).forEach(([k, n, f]) => { if (k !== t.keys[0]) add('Page', n, sec.label === t.label ? sec.label : sec.label + ' · ' + t.label, secHref(k), f); }); }));      // a tab named like its place (Setup, Random) says its place once: “Setup · Your data”, not “Setup · Setup”
  BELIEFS.forEach((b) => add('Page', b.label, 'Traditions · ' + b.term, '#/traditions/belief/' + b.id, b.term + ' belief browse find'));      /* typing “monotheism” or “animism” finds the belief */
  add('Page', 'Preferences', 'Setup', '#/setup', 'settings backup export import delete data theme volume level reduce motion larger text');      /* SA-08: one name for the page, Setup; its first chip is Preferences. The old long row of this page (it listed backup, export and settings) is this one, under the chip's name; “settings” and “backup” stay as find words */
  /* SA-03 and SA-09: a religion has two pages and each has its own kind. “Tradition” is the religion's own page (793 of them, #/atlas/tradition/<id>); “Journey” is the Journey's view of its group (19, #/path/tradition/<id>, below). The word “Atlas” is no kind of thing. */
  if (typeof ATLD !== 'undefined' && ATLD.ix) ATLD.ix.core.traditions.forEach((t) => add('Tradition', t.name, [t.name_original, atlDate(t)].filter(Boolean).join(' · '), '#/atlas/tradition/' + t.id));
  add('Action', 'New passage set', 'Keep passages side by side', '#/path/threads', 'new thread compare passages'); add('Action', 'Common ground', 'Where the traditions overlap', '#/path/common'); if (typeof FEEDBACK_BETA !== 'undefined' && FEEDBACK_BETA) add('Action', 'Feedback on this ' + FEEDBACK_STAGE, 'Tell the maker what to change', '#/setup?fb=1', 'send report bug problem suggestion idea');
  const meta = (BEATLAB_TEXTS && BEATLAB_TEXTS.meta) || {};
  LIB.forEach((l) => add('Text', l.title, l.when + (meta[l.id] ? '' : ' · not in the texts folder'), meta[l.id] ? '#/path/read/' + l.id : '#/path/library?q=' + encodeURIComponent(l.title)));
  if (typeof OWN !== 'undefined') OWN.list().forEach((e) => add('Text', e.title, 'Added by you', '#/path/read/' + e.id));
  PATH_STATIONS.forEach((s, i) => add('Station', s.title, 'Station ' + (i + 1), '#/path/station/' + s.id));
  TRADITIONS.forEach((t) => add('Journey', t.name, 'Stations and readings on the Journey', '#/path/tradition/' + t.id));
  GLOSSARY.forEach((g) => add('Word', g[0], g[3].slice(0, 70), '#/path/glossary?q=' + encodeURIComponent(g[0]), luNames(g).slice(1).join(' ')));
  (typeof PARALLELS !== 'undefined' ? PARALLELS : []).forEach((p) => add('Parallel', p.title, p.theme, '#/path/parallels?p=' + p.id));
  THREADS.all().forEach((t) => add('Passage set', t.title, t.items.length + ' passages', '#/path/thread/' + t.id, 'thread'));
  return out;
}
function palRank(items, q) {
  const k = searchKey(q); if (!k) return [];
  const words = k.split(' ');
  const scored = items.map((it) => { let s = 0; if (it.lab === k) s = 100; else if (it.lab.startsWith(k)) s = 60; else if (it.lab.includes(' ' + k)) s = 45; else if (words.every((w) => it.lab.includes(w))) s = 30; else if (words.every((w) => it.hay.includes(w))) s = 12; return { it, s }; }).filter((x) => x.s > 0);
  scored.sort((a, b) => b.s - a.s || a.it.label.length - b.it.label.length);
  const cap = {}; const out = []; scored.forEach(({ it, s }) => { cap[it.kind] = (cap[it.kind] || 0) + 1; if (cap[it.kind] <= 5 && out.length < 14) out.push(Object.assign({}, it, { strong: s >= 60 })); });      /* strong: the label is what was typed, or starts with it */
  return out;
}
let PAL = null;
function openPalette(prefill) {
  if (PAL) { PAL.input.focus(); if (prefill != null) { PAL.input.value = prefill; PAL.input.dispatchEvent(new Event('input')); } return; }
  const back = h(`<div class="pal-back" role="dialog" aria-modal="true" aria-label="Search and jump"><div class="pal"><input class="pal-in" id="palQ" type="text" role="combobox" aria-expanded="true" aria-controls="palList" aria-autocomplete="list" placeholder="Search every text, or jump to a text, station, tradition, word…" autocomplete="off" spellcheck="false"><ul class="pal-list" id="palList" role="listbox"></ul><div class="pal-foot"><span><kbd class="kbd2">↑↓</kbd> move</span><span><kbd class="kbd2">Enter</kbd> go</span><span><kbd class="kbd2">Esc</kbd> close</span><span class="muted">Quote a phrase for an exact search</span></div></div></div>`);
  document.body.appendChild(back); const input = $('#palQ', back); const list = $('#palList', back); let items = null; let rows = []; let at = 0; const opener = document.activeElement;
  const close = () => { back.remove(); document.removeEventListener('keydown', onKey, true); PAL = null; if (opener && opener.focus) { try { opener.focus(); } catch (e) { /* gone */ } } };
  const go = (href) => { close(); if (location.hash === href) Router.render(); else location.hash = href; };
  const paint = () => {
    const q = input.value.trim(); if (!items && q) items = palItems();
    const found = q ? palRank(items, q) : [];
    const strong = found.filter((x) => x.strong).slice(0, 3);      // a book, a station or an action that is what was typed comes first, so Enter opens it; “Search every text” follows
    rows = []; strong.forEach((x) => rows.push(x)); if (q) rows.push({ kind: 'Search', label: `Search every text for “${q}”`, sub: 'Full text, all collections', href: srchHash(q, srchOpts({})) });
    if (q && /^\p{L}[\p{L}'’-]{1,30}$/u.test(q)) rows.push({ kind: 'Dictionary', label: `Define “${q}”`, sub: 'Webster’s 1913, offline', href: '#/path/glossary?q=' + encodeURIComponent(q) });      // one word: the Glossary page shows the dictionary's answer
    found.forEach((x) => { if (!strong.includes(x)) rows.push(x); });
    if (!q) { const recent = srchRecent().slice(0, 5); recent.forEach((r) => rows.push({ kind: 'Recent', label: r.q, sub: 'Recent search', href: srchHash(r.q, srchOpts({})) })); rows.push({ kind: 'Action', label: 'Common ground', sub: 'Where the traditions overlap', href: '#/path/common' }, { kind: 'Action', label: 'Parallel passages', sub: 'Passages side by side', href: '#/path/parallels' }, { kind: 'Action', label: 'Random', sub: 'A passage from any text', href: '#/path/passage' }, { kind: 'Action', label: 'Highlights and notes', sub: 'Highlights, notes, progress', href: '#/path/marks' }); }
    at = Math.min(at, rows.length - 1); if (at < 0) at = 0;
    list.innerHTML = rows.map((r, i) => `<li role="option" id="pal${i}" data-i="${i}" aria-selected="${i === at}" class="pal-row${i === at ? ' on' : ''}"><span class="pal-kind">${esc(r.kind)}</span><span class="pal-l">${esc(r.label)}</span><span class="pal-s">${esc(r.sub)}</span></li>`).join('') || '<li class="pal-empty">Nothing to jump to. Press Enter to search the texts.</li>';
    input.setAttribute('aria-activedescendant', rows.length ? 'pal' + at : '');
  };
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (rows.length) { at = (at + (e.key === 'ArrowDown' ? 1 : rows.length - 1)) % rows.length; paint(); const el = $('.on', list); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' }); } return; }
    if (e.key === 'Enter') { e.preventDefault(); const r = rows[at]; if (r) go(r.href); else if (input.value.trim()) go(srchHash(input.value.trim(), srchOpts({}))); }
  };
  document.addEventListener('keydown', onKey, true);
  input.addEventListener('input', () => { at = 0; paint(); });
  list.addEventListener('click', (e) => { const li = e.target.closest('[data-i]'); if (li && rows[+li.dataset.i]) go(rows[+li.dataset.i].href); });
  list.addEventListener('mousemove', (e) => { const li = e.target.closest('[data-i]'); if (li && +li.dataset.i !== at) { at = +li.dataset.i; $$('.pal-row', list).forEach((x, i) => { x.classList.toggle('on', i === at); x.setAttribute('aria-selected', i === at); }); } });
  back.addEventListener('mousedown', (e) => { if (e.target === back) close(); });
  PAL = { input, close }; if (prefill) input.value = prefill; paint(); input.focus(); if (prefill) input.select();
  if (typeof ATLD !== 'undefined' && !ATLD.ix) ATLD.open().then(() => { if (PAL) { items = null; paint(); } }).catch(() => {});
}
function palHelp() {
  modal({ title: 'Keyboard shortcuts', html: `<table class="stat-table kbtable"><tr><td><kbd class="kbd2">/</kbd> or <kbd class="kbd2">Ctrl</kbd>/<kbd class="kbd2">⌘</kbd> <kbd class="kbd2">K</kbd></td><td>Search every text, or jump to anything</td></tr><tr><td><kbd class="kbd2">←</kbd> <kbd class="kbd2">→</kbd></td><td>Previous or next section in the reader</td></tr><tr><td>Select words</td><td>Highlight, note, thread, copy, or search for them</td></tr><tr><td><kbd class="kbd2">?</kbd></td><td>This list</td></tr></table>`, actions: [{ label: 'Close', kind: 'primary', value: true }] });
}
/* is the person typing somewhere? then shortcuts stay out of the way */
const palTyping = (t) => !!(t && t.closest && t.closest('input,textarea,select,[contenteditable="true"]'));
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey) return;
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); openPalette(); return; }
    if (e.metaKey || e.ctrlKey || palTyping(e.target) || document.querySelector('.modal-back,.overlay,.pal-back')) return;
    if (e.key === '/') { e.preventDefault(); openPalette(); } else if (e.key === '?') { e.preventDefault(); palHelp(); }
  });
}
