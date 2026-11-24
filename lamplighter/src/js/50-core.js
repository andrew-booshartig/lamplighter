/* ═══════════════════════════ 50 · app shell: settings, theme, router, mini-player ═══════════════════════════ */
const Settings = {
  data: Object.assign({ theme: 'auto', reduceMotion: false, volumeCap: 0.9, onboarded: false, hpChecked: false, noiseShift: -5, showLab: false, setupSeen: false }, store.get('settings', {})),
  get(k) { return this.data[k]; },
  set(k, v) { this.data[k] = v; store.set('settings', this.data); if (k === 'theme' || k === 'reduceMotion') applyTheme(); if (k === 'volumeCap') AudioCore.setCap(v); },
};
/* personal noise comfort: shifts the noise-bed level of every BUILT-IN preset (your own saved presets keep their own levels) */
function shiftNoise(cfg) {
  const c = Object.assign({}, cfg); const sh = Settings.get('noiseShift') || 0;
  if (sh && c.noiseType && c.noiseType !== 'none' && c.mode !== 'noise' && isNum(c.noiseDb)) c.noiseDb = clamp(c.noiseDb + sh, -40, -3);
  return c;
}
function applyTheme() {
  const t = Settings.get('theme'); const light = t === 'light' || (t === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches);
  document.documentElement.dataset.theme = light ? 'light' : 'dark';
  document.documentElement.classList.toggle('reduce-motion', !!Settings.get('reduceMotion'));
  Viz.refreshColors();
}
if (window.matchMedia) { try { matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => { if (Settings.get('theme') === 'auto') applyTheme(); }); } catch (e) { /* older Safari */ } }

/* The app is organised in five places and a gear (src/js/2z-sections-core.js): Timeline, Traditions, Library, Notebook and Practice, with Setup as the small gear. Each page sits under one tab of one place
   (or under that place’s More); the addresses (#/path/library, #/atlas, #/meditate, #/start …) are the same as before the reorganisations, and an empty or unknown address opens the Timeline.
   The sound pages (the old Gateway: guided sits, tone studio, presets, plain-English learning and, if switched on, the lab tools) are in Practice. */
const NAV = SECTIONS.map((s) => ({ id: s.id, label: s.label, short: s.short || s.label, icon: s.icon, href: s.href, gear: !!s.gear }));
const GATEWAY_TABS = [['gateway', 'Overview'], ['meditate', 'Meditate'], ['studio', 'Studio'], ['presets', 'Presets'], ['learn', 'Learn'], ['experiments', 'Experiments', true], ['journal', 'Journal', true]];
const navOf = (route, parts) => (secLocate(secKey(parts || [route])) || { sec: SECTIONS[0] }).sec.id;
/* the pages that draw no row of tabs of their own get the row of their place from the router (the others, such as the Library and the Atlas, draw it themselves) */
const SEC_PLAIN = ['gateway', 'meditate', 'studio', 'presets', 'learn', 'experiments', 'journal', 'setup'];
function subnavHTML(route, parts) {
  if (!SEC_PLAIN.includes(route)) return '';
  return secNavHTML(secLocate(secKey(parts || [route])), { lab: !!Settings.get('showLab') });
}

const Pages = {};
/* after every page is drawn: the browser tab says where you are (it used to say “The Lamplighter Project” everywhere), and on a phone the tab strip is scrolled so the current tab is in view */
const UI_LAST = { hash: '' };      /* the page the person was on before Setup, for the feedback report */
function uiAfterRender(navId) {
  try {
    const cur = document.querySelector('#main .psubs [aria-current="page"], #main .gtabs [aria-current="page"], #main .ptabs [aria-current="page"], #main .smore-menu [aria-current="page"]'); const sec = (NAV.find((n) => n.id === navId) || {}).label;
    document.title = [cur && cur.textContent.trim(), sec].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).concat('Lamplighter').join(' · ');
    document.querySelectorAll('#main .ptabs, #main .psubs').forEach((bar) => { const a = bar.querySelector('[aria-current="page"]'); if (a && bar.scrollWidth > bar.clientWidth + 2) bar.scrollLeft = Math.max(0, a.offsetLeft - (bar.clientWidth - a.offsetWidth) / 2); });
  } catch (e) { /* a page without tabs */ }
  /* each of these is a step of its own, so one that cannot run (a page with no tab strips or no headings) never takes the title or the scrolling above with it */
  try { document.querySelectorAll('#main .ptabs, #main .psubs').forEach(uiTabFade); } catch (e) { /* no tab strips */ }
  try { uiHeadingLevels(document.getElementById('main')); } catch (e) { /* no page */ }
  try { if (navId !== 'setup') UI_LAST.hash = location.hash; } catch (e) { /* not in a page */ }
}
/* a tab strip that holds more than fits fades out at the edge that has more, and stops fading when it is scrolled to that end (the strips are one swipeable row at every width) */
function uiTabFade(bar) {
  const paint = () => { const more = bar.scrollWidth > bar.clientWidth + 2; bar.classList.toggle('more-r', more && bar.scrollLeft + bar.clientWidth < bar.scrollWidth - 2); bar.classList.toggle('more-l', more && bar.scrollLeft > 2); };
  paint(); if (!bar.dataset.fade) { bar.dataset.fade = '1'; bar.addEventListener('scroll', paint, { passive: true }); }
}
/* heading levels never jump by more than one inside a page: a card title that is an h3 straight under the h1 is announced as a level 2, and nothing changes in how it looks */
function uiHeadingLevels(root) {
  if (!root) return;
  let prev = 0;
  root.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((h) => {
    if (!h.getClientRects().length) return;
    const own = +h.tagName[1]; const want = prev === 0 ? own : Math.min(own, prev + 1);
    if (want !== own) h.setAttribute('aria-level', String(want)); else h.removeAttribute('aria-level');
    prev = want;
  });
}
/* the page the app opens on gets one quiet line after its tabs: “where you left off” when there is saved progress (pathResumeHTML in 69-path.js gives nothing at all when there is none), and until then, for someone
   who has not read anything yet, “New here? Find your way” (the newcomer page, #/start; AA-05 of the alpha audit: a friend told “a library” landed on a timeline with no obvious first step). Not a control: a sentence. */
function uiHomeLine(root) {
  try {
    if (root.querySelector('.resume') || root.querySelector('.newhere')) return;
    const html = (typeof pathResumeHTML === 'function' ? pathResumeHTML() : '') || '<p class="small muted newhere">New here? <a href="#/start">Find your way</a></p>';
    const bars = [...root.children].filter((c) => c.matches && c.matches('.secbar, .psubs')); const at = bars[bars.length - 1] || root.querySelector('.page-head');
    if (at) at.insertAdjacentHTML('afterend', html); else root.insertAdjacentHTML('afterbegin', html);
  } catch (e) { /* a page without tabs */ }
}
const Router = {
  cleanup: null, current: null,
  go(path) { location.hash = '#/' + path; },
  parse() { const raw = location.hash.replace(/^#\/?/, ''); const [p, q] = raw.split('?'); return { parts: p.split('/').filter(Boolean), query: Object.fromEntries(new URLSearchParams(q || '')) }; },
  async render() {
    const parsed = Router.parse(); const stem = typeof secRedirect === 'function' ? secRedirect(parsed.parts) : ''; if (stem) { location.replace(stem); return; }      /* a stem with nothing of its own (#/traditions/belief) opens the page it belongs to; the address is replaced, so Back does not return to the stem (AA-27) */
    const parts = secRoute(parsed.parts, (k) => Object.prototype.hasOwnProperty.call(Pages, k)); const id = parts[0]; const query = parsed.query;      /* an empty address and one nobody knows open the page the app opens on (History, the first tab of the Timeline); a place whose own page is not built yet opens the page that stands in for it (2z-sections-core.js) */
    if (Router.cleanup) { try { Router.cleanup(); } catch (e) { console.error(e); } Router.cleanup = null; }
    const shell = $('#main'); if (!shell) return;      /* no page to draw into (a render that runs before the shell is built, or after the body was rebuilt): nothing to do, and no error (AA-25) */
    shell.innerHTML = '<div id="view"></div><p class="main-foot"><a href="#/methods">Methods and standards</a></p>'; const root = $('#view', shell);      /* the line at the foot of every page on a phone, where the sidebar’s footer is not shown */ Router.current = id; document.body.dataset.page = id;
    const navId = navOf(id, parts); $$('.nav a').forEach((a) => { if (a.dataset.id === navId) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    try { Router.cleanup = (await Pages[id].mount(root, parts.slice(1), query)) || null; } catch (e) { console.error(e); root.innerHTML = `<div class="card"><h2>Something went wrong</h2><p class="muted">${esc(e.message)}</p></div>`; }
    const tabs = subnavHTML(id, parts); if (tabs) { const head = root.querySelector('.page-head'); if (head) head.insertAdjacentHTML('afterend', tabs); else root.insertAdjacentHTML('afterbegin', tabs); }      /* the pages that draw no tabs of their own (Sound, Setup) get the row of their place under their title */
    if (parts.join('/') === secRoute([], (k) => Object.prototype.hasOwnProperty.call(Pages, k)).join('/')) uiHomeLine(root);      /* on the page the app opens on: where you left off */
    uiAfterRender(navId); window.scrollTo(0, 0); Mini.refresh();
  },
};

/* ───────────── mini player ───────────── */
const Mini = (() => {
  let el, timer;
  function build() {
    el = h(`<div class="mini" id="mini" role="region" aria-label="Now playing"><span class="pulse"></span><div class="info"><b id="miniName">—</b><span id="miniSub">—</span></div>
      <button class="btn icon ghost" id="miniPause" aria-label="Pause">${icon('pause')}</button><button class="btn icon" id="miniStop" aria-label="Stop">${icon('stop')}</button></div>`);
    document.body.appendChild(el);
    $('#miniStop', el).addEventListener('click', () => Engine.stop());
    $('#miniPause', el).addEventListener('click', async () => { if (Engine.state === 'playing') await Engine.pause(); else await Engine.resume(); Mini.refresh(); });
    el.addEventListener('click', (e) => { if (!e.target.closest('button')) Router.go('studio'); });
    Engine.on('state', refresh); Engine.on('started', refresh);
  }
  function refresh() {
    if (!el) return; const playing = Engine.state === 'playing' || Engine.state === 'paused';
    el.classList.toggle('show', playing && Router.current !== 'studio' && !document.querySelector('.overlay'));
    if (!playing) { clearInterval(timer); timer = null; return; }
    const upd = () => {
      const cfg = Engine.cfg; if (!cfg) return; const beat = Engine.currentBeat(); const t = Engine.position(); const tot = Engine.duration();
      $('#miniName', el).textContent = Engine.meta.name || 'Custom tone';
      const detail = cfg.mode === 'control' ? `${cfg.carrier} Hz tone` : cfg.mode === 'noise' ? 'noise' : `${bandOf(beat).name} · ${fmt.hz(beat, 2)} Hz`;
      $('#miniSub', el).textContent = `${detail} · ${fmt.time(t)}${isFinite(tot) ? ' / ' + fmt.time(tot) : ''}`;
      $('#miniPause', el).innerHTML = icon(Engine.state === 'paused' ? 'play' : 'pause');
    };
    upd(); if (!timer) timer = setInterval(upd, 500);
  }
  return { build, refresh };
})();

/* ───────────── shell ───────────── */
const navItems = () => NAV.filter((n) => !n.lab || Settings.get('showLab'));
const betaOn = () => typeof FEEDBACK_BETA !== 'undefined' && FEEDBACK_BETA;
/* the dot on the gear says “the box for telling the maker what to change is in here”: it shows while the pre-release switch is on, and goes for good once Setup has been opened (AA-15; setupSeen is kept in the settings) */
const gearDot = () => betaOn() && !Settings.get('setupSeen');
const gearName = (n) => (gearDot() ? `${n.label}, with the box to tell the maker what to change` : n.label);
function navSeenSetup() {
  if (Settings.get('setupSeen')) return; Settings.set('setupSeen', true);
  document.querySelectorAll('.nav-gear').forEach((g) => { g.classList.remove('nav-beta'); g.setAttribute('aria-label', 'Setup'); g.setAttribute('title', 'Setup'); });
}
/* the menu: the six places are links with their names, and Setup is a small gear at the end (on a phone it is the last item of the bar, with its short name under it, and the dot of the pre-release sits on it
   until Setup has been opened once, since the box for telling the maker what to change is in Setup). What a place keeps under its “More” is in the strip of that place, not here. */
const navInner = () => navItems().map((n) => (n.gear
  ? `<a href="${n.href}" data-id="${n.id}" class="nav-gear${gearDot() ? ' nav-beta' : ''}" aria-label="${gearName(n)}" title="${gearName(n)}">${icon(n.icon)}<span class="lbl-short">${n.short || n.label}</span></a>`
  : `<a href="${n.href}" data-id="${n.id}">${icon(n.icon)}<span class="lbl-full">${n.label}</span><span class="lbl-short">${n.short || n.label}</span></a>`)).join('');
function refreshNav() { const n = $('.nav'); if (n) n.innerHTML = navInner(); Router.render(); }
function buildShell() {
  document.body.innerHTML = `<button type="button" class="skip" id="skipLink">Skip to content</button><div class="app"><aside class="side"><div class="brand"><div class="logo">${LOGO_SVG}</div><div>Lamplighter${typeof FEEDBACK_BETA !== 'undefined' && FEEDBACK_BETA ? `<a class="beta-pill" href="#/setup?fb=1" title="This is ${feedbackStageA()}: tell the maker what to change">${FEEDBACK_STAGE}</a>` : ''}<small>religion &amp; stillness</small></div></div>
    <nav class="nav" aria-label="Main">${navInner()}</nav>
    <div class="side-foot">Every claim says how well sourced it is. Everything stays in your browser. <a href="#/methods">Methods and standards</a></div></aside><main class="main" id="main" tabindex="-1"></main></div>`;
  const skip = document.getElementById('skipLink'); if (skip) skip.addEventListener('click', () => { const m = document.getElementById('main'); if (m) { m.focus(); m.scrollIntoView(); } });
  /* the “More” of a place (a details element in its strip): a tap outside it, a tap on one of its pages, or Escape closes it */
  document.addEventListener('click', (e) => { const t = e.target; document.querySelectorAll('details.smore[open]').forEach((d) => { const inside = t.closest && t.closest('details.smore') === d; if (!inside || (t.closest && t.closest('.smore-menu a'))) d.removeAttribute('open'); }); });
  document.addEventListener('keydown', (e) => { if (e.key !== 'Escape') return; const d = document.querySelector('details.smore[open]'); if (d) { d.removeAttribute('open'); const s = d.querySelector('summary'); if (s) s.focus(); } });
  Mini.build();
}

/* after-session prompt: invite a quick journal entry */
Engine.on('ended', (meta) => {
  if (meta && !meta.demo && !meta.experiment && !meta.meditation && Settings.get('showLab')) toast(`Session complete. <a href="#/journal">Log how you feel →</a>`, 'good', 9000);
});

/* ───────────── first-run onboarding ───────────── */
async function onboarding() {
  if (Settings.get('onboarded')) return;
  /* three short lines, one button, and one line of safety. The full note about the sound and light features is where they start (Practice → Sound → Headphone check); the headphone check itself is no longer a button of this dialog. */
  await modal({
    title: 'Welcome to the Lamplighter Project',
    html: `<p class="t2">A free place to study human religion, to worship and study with others, and to sit in stillness. Works offline once you save it (Setup, Take it with you). Nothing leaves your browser.</p>
      <ul class="t2"><li><b>Timeline</b> and <b>Traditions</b>: religion in time and place.</li><li><b>Library</b>, <b>Random</b> and <b>Notebook</b>: the texts in English, and your own notes.</li><li><b>Practice</b>: ways to worship, guided sits and sound.</li></ul>
      ${typeof FEEDBACK_BETA !== 'undefined' && FEEDBACK_BETA ? `<p class="t2"><b>This is ${feedbackStageA()}.</b> The gear has a box to tell the maker what to change.</p>` : ''}
      ${typeof offAppNote === 'function' && typeof navigator !== 'undefined' ? offAppNote(navigator.userAgent) : ''}
      <p class="small muted">The sound and light features are not medical advice: stop if anything feels uncomfortable.</p>`,
    actions: [{ label: 'Start exploring', kind: 'primary', value: true }],
  });
  Settings.set('onboarded', true);
}

/* ───────────── global keyboard ───────────── */
window.addEventListener('keydown', (e) => {
  if (e.key === ' ' && Router.current === 'studio' && !e.target.closest('input,textarea,select,button,[contenteditable]') && !document.querySelector('.modal-back,.overlay')) { e.preventDefault(); Pages.studio.toggle && Pages.studio.toggle(); }
});

/* ───────────── boot ───────────── */
function boot() {
  applyTheme(); AudioCore.setCap(Settings.get('volumeCap'));
  buildShell(); window.addEventListener('hashchange', () => Router.render()); Router.render(); onboarding();
  window.addEventListener('beforeunload', () => { try { Engine.stop(0.05); } catch (e) { /* noop */ } });
}
