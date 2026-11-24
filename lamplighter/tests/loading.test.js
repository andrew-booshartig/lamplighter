/* A smooth first visit on a phone (the maker, 24 November 2026: "i refuse to use facebook on a phone. what can we do to optimize? make it smooth"). Measured on the live site, a cold first visit downloads about 2.4 MB
   (the page 1.5 MB compressed, then the map and the catalogue 0.9 MB) and the screen stayed blank until all of it had arrived, because the whole app is one inline script. Two changes, kept here:
   1. a loading screen (the mark, the name, “Loading…”) sits in the page before that script, so it is painted as soon as the first part of the page arrives (checked in a real browser on a connection slowed to
      300 KB/s: first paint at 0.9 s, the page finished at 15.5 s). The app removes it when it builds its own page (the body is replaced). After nine seconds it says the first visit downloads the app and the
      next is much faster. If the app has not taken over when the page is ready (a browser too old to read the script, or an error before the page was built) it says so instead of promising more waiting. Without
      JavaScript it hides itself (!important, because the screen’s own style is inline), so the “needs JavaScript” line shows. It has no animation (the project promises nothing flashes);
   2. Find similar says, on a web address and before the first search, that the first search downloads the index (the size is one constant, SIM_INDEX_MB, kept within 3 MB of the real folder).
   No browser is needed. Run: node tests/loading.test.js */
const fs = require('fs'); const path = require('path');
const lp = path.join(__dirname, '..'); const top = path.join(lp, '..');
let pass = 0; let fail = 0; const ok = (n, c, x) => { if (c) pass++; else { fail++; console.log('FAIL', n, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } };
const build = fs.readFileSync(path.join(lp, 'build.py'), 'utf8'); const core = fs.readFileSync(path.join(lp, 'src/js/50-core.js'), 'utf8'); const sim = fs.readFileSync(path.join(lp, 'src/js/6u-similar.js'), 'utf8');

const splashAt = build.indexOf('<div id="splash"'); const bigScriptAt = build.indexOf('<script>\n(function () {{');
ok('the page template has a loading screen after the noscript line and before the big script, so it can be painted before the app has arrived', splashAt > build.indexOf('<noscript>') && splashAt > 0 && splashAt < bigScriptAt, [splashAt, bigScriptAt]);
const splash = build.slice(splashAt, build.indexOf('</div></div>', splashAt) + 12);
ok('it is a status message with the mark, the name and “Loading…”, in the theme’s own colours (the variables, so a light theme gets a light screen), covering the page', /role="status"/.test(splash) && /data:image\/svg\+xml,\{favicon\}/.test(splash) && />The Lamplighter Project</.test(splash) && />Loading…</.test(splash) && /background:var\(--bg\)/.test(splash) && /color:var\(--text2\)/.test(splash) && /position:fixed;inset:0/.test(splash), splash.slice(0, 200));
ok('it names no web address and has no animation, transition or flashing (the project promises none), and nothing in it needs a request', !/https?:|www\./.test(splash) && !/animation|transition|@keyframes|blink/i.test(splash) && !/<link|<script|<iframe/.test(splash));
ok('the note has a fixed height (three lines), so the mark does not jump when a longer message replaces “Loading…”', /id="splashNote" style="[^"]*min-height:4\.5em/.test(splash), splash);
ok('without JavaScript the loading screen hides itself (a style inside noscript in the head, with !important because the screen’s own display is inline), so the “needs JavaScript” line is not covered', /<noscript><style>#splash\{\{display:none!important\}\}<\/style><\/noscript>\n<\/head>/.test(build));
ok('the app replaces the whole body when it builds its own page, which removes the loading screen with nothing to clean up', /document\.body\.innerHTML = `<button type="button" class="skip" id="skipLink">/.test(core));
ok('and it does so synchronously inside boot(), which runs when the page is ready, so a page that is still showing the loading screen after that has failed to start', /function boot\(\) \{\s*applyTheme\(\); AudioCore\.setCap\(Settings\.get\('volumeCap'\)\);\s*buildShell\(\);/.test(core));

/* the built page: where things sit, and what the two small scripts do when they are run against a stand-in for the page */
{ const built = path.join(top, 'Lamplighter.html');
  if (fs.existsSync(built)) {
    const h = fs.readFileSync(built, 'utf8'); const a = h.indexOf('<div id="splash"'); const b = h.indexOf('<script>\n(function () {', a);
    ok('the built page has it too: before the big script, in the first 400 KB of the page at most (so it paints after a small part has arrived), and the page size is still under 5 MB', a > 0 && b > a && a < 400 * 1024 && h.length < 5 * 1024 * 1024, [a, b, h.length]);
    ok('and the hiding rule for a browser without JavaScript is in the built head', h.indexOf('<noscript><style>#splash{display:none!important}</style></noscript>') > 0 && h.indexOf('<noscript><style>#splash{display:none!important}</style></noscript>') < h.indexOf('</head>'));
    const t0 = h.indexOf('<script>setTimeout(function () {', a); const timerBody = h.slice(t0 + 8, h.indexOf('</script>', t0));
    const f0 = h.lastIndexOf("<script>document.addEventListener('DOMContentLoaded', function () {"); const failBody = h.slice(f0 + 8, h.indexOf('</script>', f0));
    ok('the “could not start” script comes after the app’s own script and the app asks for the page-ready event first, so the app takes over the page before this script looks', f0 > b && h.indexOf("document.addEventListener('DOMContentLoaded', boot)") > b && h.indexOf("document.addEventListener('DOMContentLoaded', boot)") < f0, [b, f0]);
    ok('both small scripts name no web address and use nothing outside the page (no request, no storage)', !/https?:|fetch|XMLHttpRequest|localStorage|sessionStorage|import\(/.test(timerBody + failBody), timerBody + failBody);
    /* a stand-in for the page: the loading screen is there (or not), and the scripts' timers and listeners are caught */
    const stage = (present) => { const attrs = {}; const handlers = {}; const timers = [];
      const splashEl = present ? { getAttribute: (k) => (k in attrs ? attrs[k] : null), setAttribute: (k, v) => { attrs[k] = String(v); } } : null; const noteEl = present ? { textContent: 'Loading…' } : null;
      const doc = { getElementById: (id) => (id === 'splash' ? splashEl : id === 'splashNote' ? noteEl : null), addEventListener: (ev, fn) => { handlers[ev] = fn; } };
      new Function('document', 'setTimeout', timerBody)(doc, (fn, ms) => { timers.push({ fn, ms }); });
      new Function('document', failBody)(doc);
      return { attrs, handlers, timers, noteEl, run: (name) => { if (name === 'timer') timers[0].fn(); else handlers.DOMContentLoaded(); } }; };
    { const s = stage(true);
      ok('on a slow load: one timer, at nine seconds, and when it fires the note says the first visit downloads the app and the next is faster', s.timers.length === 1 && s.timers[0].ms === 9000 && (s.run('timer'), /^Still loading\. The first visit downloads the app/.test(s.noteEl.textContent) && /the next visit is much faster\.$/.test(s.noteEl.textContent)), [s.timers.length, s.noteEl.textContent]); }
    { const s = stage(true); s.run('ready');
      ok('when the page is ready and the loading screen is still there (the app did not start), it says the app could not start, that the browser may be too old, and what to try; it marks the screen as failed', /^The app could not start in this browser, which may be too old\./.test(s.noteEl.textContent) && /phone’s own browser/.test(s.noteEl.textContent) && /Safari, Chrome, Edge or Firefox/.test(s.noteEl.textContent) && s.attrs['data-failed'] === '1', [s.noteEl.textContent, s.attrs]);
      s.run('timer');
      ok('and the nine-second message does not then overwrite that message with a promise of more waiting', /^The app could not start/.test(s.noteEl.textContent), s.noteEl.textContent); }
    { const s = stage(false); let threw = false; try { s.run('ready'); s.run('timer'); } catch (e) { threw = true; }
      ok('when the app has taken over (no loading screen any more), neither script does anything or throws', !threw && s.noteEl === null); }
  } }

/* ── Find similar ── */
const mb = +(sim.match(/^const SIM_INDEX_MB = (\d+);/m) || [])[1];
ok('Find similar names the size of its first download as one constant, shown only on a web address, only before the index is loaded, with the reason (it is kept for next time) and the kindest way to get it', mb > 0 && /\$\{typeof location !== 'undefined' && \/\^https\?:\$\/\.test\(location\.protocol\) && !SIMX\.P \? `<p class="small muted" id="smSize" style="margin:10px 0 0">The first search downloads the index, about \$\{SIM_INDEX_MB\} MB; your browser keeps it for next time\. On a mobile connection, Wi-Fi is kinder\.<\/p>` : ''\}/.test(sim), mb);
ok('and the note goes when a search starts', /const sz = \$\('#smSize', body\); if \(sz\) sz\.remove\(\);/.test(sim));
{ const dir = path.join(top, 'similar');
  if (fs.existsSync(dir)) { const total = fs.readdirSync(dir).filter((f) => /\.js$/.test(f)).reduce((n, f) => n + fs.statSync(path.join(dir, f)).size, 0) / 1048576;
    ok('the size the page names is the size of the index folder to within 3 MB (it was rebuilt on 24 November 2026: 63.3 MiB, 66.3 MB)', Math.abs(mb - total) <= 3, [mb, total]); } }

console.log(`first visit: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
