/* ═══════════════════════════ 6kr · Reading settings: the "Aa" panel ═══════════════════════════
   One panel for how the reading surface looks, used by the reader, the random passage page and the Bibles page: a theme (colours), the type face, size, line spacing, width,
   alignment, letter spacing and how verse numbers show, with an "Easy reading" starting point. The choices are kept in this browser (reading.prefs and reader.size) and apply
   at once to everything that is read: the style sheet comes from rtCss in 2z-reading-core.js, which only ever builds from fixed lists. A button with data-rtopen opens it.
   Inside the reader the panel also holds how the text is laid out (scroll, pages or sections; one page or two; the page turn, taps and margins) and the screen filters
   (dimming and a warm light), kept as reader.layout and built from the lists in 2z-pager-core.js. */
const READER_NAME = 'This text';      // the title of the reader's sheet (Contents, Find, Highlights, About); it was “Reading Room”, a working name that told a newcomer nothing; change it here and it changes everywhere it is shown
const RT_KEY = 'reading.prefs';
const rtGet = () => rtClean(store.get(RT_KEY, null));
const rtSizeNow = () => rtSize(store.get('reader.size', RT_SIZE.def));
/* the browser's own bar (on a phone, the strip at the top) takes the page colour while a text is open, and goes back to the app's afterwards */
function rtThemeColor() {
  if (typeof document === 'undefined' || !document.querySelector || !document.body) return;
  const m = document.querySelector('meta[name="theme-color"]'); if (!m) return;
  if (!m.dataset.app) m.dataset.app = m.getAttribute('content') || '';
  const th = RT_THEME_BY_ID[rtGet().theme]; const on = !!(document.body.dataset && document.body.dataset.reading) && th && th.bg;
  m.setAttribute('content', on ? th.bg : m.dataset.app);
}
function rtApply() {
  if (typeof document === 'undefined' || !document.head || !document.createElement) return;
  let el = document.getElementById('rt-style'); if (!el) { el = document.createElement('style'); el.id = 'rt-style'; document.head.appendChild(el); }
  el.textContent = rtCss(rtGet(), rtSizeNow());
  if (document.querySelectorAll) document.querySelectorAll('.reader[style*="font-size"]').forEach((r) => { r.style.fontSize = rtSizeNow() + 'px'; });
  rlApplyLight(); rtThemeColor(); rlTell('rt:change');
}
/* ── how the text is laid out, and the screen filters ── */
const RL_KEY = 'reader.layout';
const rlGet = () => rlClean(store.get(RL_KEY, null));
function rlTell(name, detail) { try { if (typeof window !== 'undefined' && window.dispatchEvent && typeof CustomEvent !== 'undefined') window.dispatchEvent(new CustomEvent(name, { detail: detail || null })); } catch (e) { /* no page */ } }
function rlApplyLight() {
  if (typeof document === 'undefined' || !document.body || !document.createElement || !document.getElementById) return;
  const p = rlGet(); const L = rlLight(p.dim, p.warm); let el = document.getElementById('rdLight');
  if (!L.dim && !L.warm) { if (el) el.hidden = true; return; }
  if (!el) { el = document.createElement('div'); el.id = 'rdLight'; el.setAttribute('aria-hidden', 'true'); el.innerHTML = '<i class="ld"></i><i class="lw"></i>'; document.body.appendChild(el); }
  el.hidden = false; if (el.firstChild) el.firstChild.style.background = L.dim; if (el.lastChild) el.lastChild.style.background = L.warm;
}
function rlSet(patch, quiet) { const before = rlGet(); const next = rlClean(Object.assign({}, before, patch)); store.set(RL_KEY, next); rlApplyLight(); if (!quiet) rlTell('rl:change', { patch, before, next }); return next; }
const rlInReader = () => typeof document !== 'undefined' && !!(document.body && document.body.dataset && document.body.dataset.reading);
function rtSet(patch) { store.set(RT_KEY, rtClean(Object.assign(rtGet(), patch))); rtApply(); }
function rtSetSize(v) { store.set('reader.size', rtSize(v)); rtApply(); }
/* ── how it is read: the chooser ──
   Three styles in plain words (Scroll, Book pages, PDF sheets), each with a small drawing and one line, and for Scroll a switch that stops it at the end of each section (the old "By section"). The same markup is in the
   bar's view menu, the reader's sheet and this panel; a click on [data-rdstyle] or [data-rdstop] is handled by whoever holds it (the reader, or this panel). reader.stop remembers the switch, so choosing Scroll
   again from Book pages comes back the way the reader had it. */
const RL_ICONS = {
  scroll: '<rect x="6" y="2" width="16" height="20" rx="2.5"/><path d="M10 8h8M10 12h8M10 16h5M25 8v8m-2-2 2 2 2-2"/>',
  page: '<rect x="2" y="4" width="11" height="16" rx="2"/><rect x="15" y="4" width="11" height="16" rx="2"/><path d="M5 9h5M5 12.5h5M18 9h5M18 12.5h5"/>',
  sheet: '<rect x="9" y="2" width="15" height="17" rx="2" opacity=".5"/><rect x="4" y="5" width="15" height="17" rx="2"/><path d="M8 11h7M8 15h7"/>',
};
const rlIcon = (id) => `<svg class="rdvi" viewBox="0 0 28 24" width="28" height="24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${RL_ICONS[id] || ''}</svg>`;
const rlStopPref = () => store.get('reader.stop', true) !== false;      // does Scroll stop at the end of each section? (yes until the reader says otherwise: it was the reader's first view)
const rlStopSet = (mode) => { if (mode === 'section' || mode === 'scroll') store.set('reader.stop', mode === 'section'); };
/* the mode a click on a style leads to: the style already chosen stays as it is (Scroll is not turned into By section by a second click), another comes back with the switch as it was left */
const rlPick = (style, current) => (rlStyleOf(current) === style ? current : rlModeFor(style, rlStopPref()));
/* the way it is read now, in a few words: "Scroll, one section at a time", "Book pages" */
const rlViewNow = (mode) => { const st = rlStyleOf(mode); const nm = (RL_STYLES.find((x) => x[0] === st) || [0, ''])[1]; return st === 'scroll' && mode === 'section' ? nm + ', one section at a time' : nm; };
function rlViewsHTML(mode, menu) {
  const st = rlStyleOf(mode); const stop = mode === 'section';
  const row = ([id, nm, line]) => `<button type="button" class="rdvw${menu ? ' rdmi' : ''}" role="${menu ? 'menuitemradio' : 'radio'}" aria-checked="${st === id}" data-rdstyle="${id}">${rlIcon(id)}<span class="rdvt"><b>${esc(nm)}</b><span>${esc(line)}</span></span></button>`;
  const sw = `<button type="button" class="rdvs${menu ? ' rdmi' : ''}" role="${menu ? 'menuitemcheckbox' : 'switch'}" aria-checked="${stop}" data-rdstop><span class="rdsw" aria-hidden="true"></span><span class="rdvt"><b>${esc(RL_STOP[0])}</b><span>${esc(stop ? RL_STOP[1] : RL_STOP[2])}</span></span></button>`;      // the line says what the switch does now: on, one section at a time; off, the next section follows
  return `<div class="rdvws" role="${menu ? 'group' : 'radiogroup'}" aria-label="How to read">${RL_STYLES.map((r) => row(r) + (r[0] === 'scroll' && st === 'scroll' ? sw : '')).join('')}</div>`;
}
function rtPanel() {
  const open = document.querySelector('.rtpanel'); if (open) { open.remove(); return; }
  const el = document.createElement('div'); el.className = 'rtpanel'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Reading settings');
  const seg = (key, label, items, cur, attr = 'rt') => `<div class="rtrow"><span class="rtlab">${esc(label)}</span><span class="seg" role="group" aria-label="${esc(label)}">${items.map(([v, n]) => `<button type="button" data-${attr}="${key}" data-v="${v}" aria-pressed="${cur === v}">${esc(n)}</button>`).join('')}</span></div>`;
  const draw = (focus) => {
    const p = rtGet(); const sz = rtSizeNow(); const lay = rlGet(); const inRd = rlInReader(); const liveMode = (document.body && document.body.dataset && document.body.dataset.rdmode) || lay.mode;
    el.innerHTML = `<div class="spread" style="align-items:center;margin-bottom:8px"><b>Reading settings</b><button class="btn sm ghost" type="button" data-rtclose aria-label="Close">${icon('x')}</button></div>
      <div class="rtrow"><span class="rtlab">Theme</span><span class="rtsws" role="group" aria-label="Theme">${RT_THEMES.map((t) => `<button type="button" class="rtsw${t.bg ? '' : ' auto'}" data-rt="theme" data-v="${t.id}" aria-pressed="${p.theme === t.id}" aria-label="${esc(t.name)}" title="${esc(t.name)}"${t.bg ? ` style="background:${t.bg};color:${t.fg};border-color:${t.accent}"` : ''}>${t.bg ? 'Aa' : '◐'}</button>`).join('')}</span><span class="small t2" id="rtThemeName">${esc(RT_THEME_BY_ID[p.theme].name)}</span></div>
      <div class="rtrow"><span class="rtlab">Size</span><span class="row tight" style="flex:1;align-items:center"><button class="btn sm ghost" type="button" data-rtsz="-1" aria-label="Smaller text">A−</button><input type="range" id="rtSize" min="${RT_SIZE.min}" max="${RT_SIZE.max}" value="${sz}" aria-label="Text size" style="flex:1;min-width:90px;accent-color:var(--accent)"><button class="btn sm ghost" type="button" data-rtsz="1" aria-label="Larger text">A+</button><span class="small t2" style="min-width:3em;text-align:right">${sz}px</span></span></div>
      <div class="row tight" style="margin:2px 0 10px"><button class="btn sm" type="button" data-rtact="easy" title="A clear sans-serif, generous spacing, left-aligned text, a soft background and a narrower column: a starting point that suits many people who find reading tiring. What helps varies, so every setting can still be changed.">Easy reading</button><button class="btn sm ghost" type="button" data-rtact="reset">Back to the usual</button></div>
      ${inRd ? `<div class="rtgroup">How to read</div>${rlViewsHTML(liveMode)}
      ${seg('bar', 'Top and bottom bars', Object.entries(RL_BAR), lay.bar, 'rl')}<div class="hint" style="margin:-4px 0 6px">The bars hold every feature: contents, find, bookmarks, view, settings and the rest. Keep them shown, let them slide away as you read down, or put them away (a small tab at the top brings them back; so does the h key).</div>
      ${liveMode === 'section' || liveMode === 'scroll' ? `${seg('div', 'Page breaks', Object.entries(RL_DIV), lay.div, 'rl')}<div class="hint" style="margin:-4px 0 6px">A line, with the page number, where each page begins. In a scanned text whose printed page numbers have been found it is the printed page (p. 214), with a small marker where a page begins inside a paragraph; in any other it is the reader’s own page of about 300 words, which is not the printed page. Tap one for the details and the way to the original.</div>` : ''}
      ${liveMode === 'page' ? `${seg('spread', 'Pages across', Object.entries(RL_SPREAD), lay.spread, 'rl')}${seg('anim', 'Page turn', Object.entries(RL_ANIM), lay.anim, 'rl')}${seg('tap', 'Taps', Object.entries(RL_TAP), lay.tap, 'rl')}${seg('margin', 'Margins', Object.entries(RL_MARGIN).map(([k, v]) => [k, v[0]]), lay.margin, 'rl')}
      <div class="rtrow"><label class="chk"><input type="checkbox" data-rlchk="wheel"${lay.wheel ? ' checked' : ''}><span class="small">Mouse wheel and trackpad turn pages</span></label></div>` : ''}
      ${liveMode === 'sheet' ? '<div class="hint" style="margin:-4px 0 6px">PDF sheets scroll like a PDF. Zoom, paper size and Go to page are in the bar over the sheets; the space bar and Page Down move a sheet at a time.</div>' : ''}
      <div class="rtgroup">Look</div>` : ''}
      ${seg('font', 'Type', RT_FONTS.map((f) => [f.id, f.name]), p.font)}
      ${seg('line', 'Line spacing', Object.entries(RT_LINE).map(([k, v]) => [k, v[0]]), p.line)}${seg('space', 'Letter spacing', Object.entries(RT_SPACE).map(([k, v]) => [k, v[0]]), p.space)}${seg('width', 'Width', Object.entries(RT_WIDTH).map(([k, v]) => [k, v[0]]), p.width)}${seg('align', 'Alignment', Object.entries(RT_ALIGN), p.align)}${seg('verses', 'Verse numbers', Object.entries(RT_VERSES), p.verses)}
      ${seg('help', 'Word help', Object.entries(RT_HELP), p.help)}<div class="hint" style="margin:-4px 0 6px">Underlines names and terms the glossary can explain, such as <span class="gt" style="pointer-events:none">Ahura Mazda</span>. Tap one for a short note.</div>
      <div class="reader card flat rtsample" style="margin:10px 0 8px;padding:10px 14px;max-width:none;font-size:${Math.min(sz, 26)}px"><p style="margin:0"><sup class="vn">18</sup>But the path of the just is as the shining light, that shineth more and more unto the perfect day.</p></div>
      ${inRd ? `<div class="rtgroup">Light</div>
      <div class="rtrow"><span class="rtlab">Dim</span><input type="range" id="rlDim" min="0" max="${RL_LIGHT_MAX}" value="${lay.dim}" aria-label="Dim the screen" style="flex:1;min-width:120px;accent-color:var(--accent)"></div>
      <div class="rtrow"><span class="rtlab">Warm light</span><input type="range" id="rlWarm" min="0" max="${RL_LIGHT_MAX}" value="${lay.warm}" aria-label="Warm light, less blue" style="flex:1;min-width:120px;accent-color:var(--accent)"></div>
      <div class="rtrow"><label class="chk"><input type="checkbox" data-rlchk="awake"${lay.awake ? ' checked' : ''}><span class="small">Keep the screen on while reading</span></label></div>` : ''}
      <div class="hint" style="margin-top:6px">Kept in this browser. The type and colours apply to the reader, random passages and the Bibles page.</div>`;
    if (focus) { const b = el.querySelector(`[data-rt="${focus[0]}"][data-v="${focus[1]}"]`) || el.querySelector(focus[2] || 'button'); if (b && b.focus) b.focus(); }
  };
  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-rtclose]')) { el.remove(); return; }
    const sty = e.target.closest('[data-rdstyle]'); if (sty) { rlSet({ mode: rlPick(sty.dataset.rdstyle, rlGet().mode) }); draw(); const again = el.querySelector(`[data-rdstyle="${sty.dataset.rdstyle}"]`); if (again && again.focus) again.focus(); return; }
    const stp = e.target.closest('[data-rdstop]'); if (stp) { rlSet({ mode: rlModeFor('scroll', stp.getAttribute('aria-checked') !== 'true') }); draw(); const again = el.querySelector('[data-rdstop]'); if (again && again.focus) again.focus(); return; }
    const lb = e.target.closest('[data-rl]'); if (lb) { rlSet({ [lb.dataset.rl]: lb.dataset.v }); draw(); const again = el.querySelector(`[data-rl="${lb.dataset.rl}"][data-v="${lb.dataset.v}"]`); if (again && again.focus) again.focus(); return; }
    const b = e.target.closest('[data-rt]'); if (b) { rtSet({ [b.dataset.rt]: b.dataset.v }); draw([b.dataset.rt, b.dataset.v]); return; }
    const z = e.target.closest('[data-rtsz]'); if (z) { rtSetSize(rtSizeStep(rtSizeNow(), +z.dataset.rtsz)); draw([0, 0, `[data-rtsz="${z.dataset.rtsz}"]`]); return; }
    const a = e.target.closest('[data-rtact]'); if (a) { if (a.dataset.rtact === 'easy') { store.set(RT_KEY, rtClean(Object.assign({}, RT_EASY, { help: rtGet().help }))); rtSetSize(Math.max(rtSizeNow(), RT_SIZE_EASY)); } else { store.set(RT_KEY, rtClean(null)); rtSetSize(RT_SIZE.def); } rtApply(); draw([0, 0, `[data-rtact="${a.dataset.rtact}"]`]); }
  });
  el.addEventListener('change', (e) => { const c = e.target.closest ? e.target.closest('[data-rlchk]') : null; if (c) rlSet({ [c.dataset.rlchk]: !!c.checked }); });
  el.addEventListener('input', (e) => { if (e.target.id === 'rlDim' || e.target.id === 'rlWarm') { rlSet({ [e.target.id === 'rlDim' ? 'dim' : 'warm']: +e.target.value }, true); return; } if (e.target.id === 'rtSize') { rtSetSize(e.target.value); const sp = e.target.parentElement.querySelector('span'); if (sp) sp.textContent = rtSizeNow() + 'px'; const s = el.querySelector('.rtsample'); if (s) s.style.fontSize = Math.min(rtSizeNow(), 26) + 'px'; } });
  const onKey = (e) => { if (e.key === 'Escape') { el.remove(); } };
  document.addEventListener('keydown', onKey); const mo = new MutationObserver(() => { if (!el.isConnected) { document.removeEventListener('keydown', onKey); mo.disconnect(); } }); draw(); document.body.appendChild(el); mo.observe(document.body, { childList: true });
  const first = el.querySelector('[aria-pressed="true"]') || el.querySelector('button'); if (first && first.focus) first.focus();
}
if (typeof document !== 'undefined' && document.addEventListener && !globalThis.__rtWired) {
  globalThis.__rtWired = true;
  document.addEventListener('click', (e) => { const t = e.target && e.target.closest ? e.target.closest('[data-rtopen]') : null; if (t) { e.preventDefault(); rtPanel(); } });
  if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('hashchange', () => { const p = document.querySelector('.rtpanel'); if (p) p.remove(); });
}
rtApply();
const RT_BUTTON = '<button class="btn sm ghost" type="button" data-rtopen aria-label="Reading settings: theme, type and spacing" title="Reading settings: theme, type, size and spacing">Aa</button>';
