// Run: node tests/pager.test.js — the pager's rules (src/js/2z-pager-core.js): the layout settings are fixed lists, a screen of text is laid out in whole pixels, every turn leads
// somewhere real and walking the whole text forward and back visits every screen once, taps, swipes, keys and the wheel mean what they should, and the reading-time estimate learns a
// reader's pace without being thrown by an odd page.
const P = require('../src/js/2z-pager-core.js');
let pass = 0; let fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 300)); } };

/* settings */
ok('the defaults are one section at a time, an automatic spread, a slide, side taps, normal margins, no dimming', JSON.stringify(P.rlClean(null)) === JSON.stringify(P.RL_DEFAULT) && P.RL_DEFAULT.mode === 'section' && P.RL_DEFAULT.spread === 'auto' && P.RL_DEFAULT.anim === 'slide' && P.RL_DEFAULT.tap === 'sides' && P.RL_DEFAULT.dim === 0 && P.RL_DEFAULT.warm === 0);
ok('the page breaks are numbered and the bars are kept on the screen until the reader says otherwise', P.RL_DEFAULT.div === 'num' && P.RL_DEFAULT.bar === 'show' && Object.keys(P.RL_DIV).join() === 'num,line,off' && Object.keys(P.RL_BAR).join() === 'show,auto,hide');
ok('a page-break or bar choice is kept when it is on the list and dropped when it is not', P.rlClean({ div: 'line', bar: 'hide' }).div === 'line' && P.rlClean({ div: 'line', bar: 'hide' }).bar === 'hide' && P.rlClean({ div: 'off', bar: 'auto' }).div === 'off' && P.rlClean({ div: 'big', bar: 'sometimes' }).div === 'num' && P.rlClean({ div: 'big', bar: 'sometimes' }).bar === 'show' && P.rlClean({ div: 7, bar: null }).bar === 'show');
ok('a wrong-shaped setting becomes the defaults', [undefined, null, 5, 'x', [], {}, { mode: 3 }].every((v) => JSON.stringify(P.rlClean(v)) === JSON.stringify(P.RL_DEFAULT)));
ok('a valid choice is kept, an invalid one dropped, other keys ignored', (() => { const c = P.rlClean({ mode: 'page', spread: 'double', anim: 'fade', tap: 'wide', margin: 'wide', dim: 30, warm: 12, awake: true, wheel: false, junk: '<script>' }); return c.mode === 'page' && c.spread === 'double' && c.anim === 'fade' && c.tap === 'wide' && c.margin === 'wide' && c.dim === 30 && c.warm === 12 && c.awake === true && c.wheel === false && !('junk' in c); })() && P.rlClean({ mode: 'nope' }).mode === 'section');
ok('names from the object prototype are not choices', ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf'].every((k) => { const c = P.rlClean({ mode: k, spread: k, anim: k, tap: k, margin: k, div: k, bar: k }); return c.mode === 'section' && c.spread === 'auto' && c.anim === 'slide' && c.tap === 'sides' && c.margin === 'normal' && c.div === 'num' && c.bar === 'show'; }));
ok('the screen filters are whole numbers inside their limits, whatever is stored', P.rlClean({ dim: 999, warm: -5 }).dim === P.RL_LIGHT_MAX && P.rlClean({ dim: 999, warm: -5 }).warm === 0 && P.rlClean({ dim: 'x', warm: NaN }).dim === 0 && P.rlClean({ dim: 12.6 }).dim === 13 && typeof P.rlClean({ awake: 'yes' }).awake === 'boolean' && P.rlClean({ awake: 'yes' }).awake === false);
ok('the screen filters become colours only from numbers: off is empty, on is an rgba the page can use', (() => { const a = P.rlLight(0, 0); const b = P.rlLight(40, 30); const c = P.rlLight('}</style>', 'x'); return a.dim === '' && a.warm === '' && /^rgba\(0,0,0,0\.40\)$/.test(b.dim) && /^rgba\(255,147,41,0\.17\)$/.test(b.warm) && c.dim === '' && c.warm === ''; })());
ok('the margins are pixel numbers that grow from narrow to wide', P.RL_MARGIN.narrow[1] < P.RL_MARGIN.normal[1] && P.RL_MARGIN.normal[1] < P.RL_MARGIN.wide[1]);

/* spread */
ok('a phone shows one page, in either direction', P.pgSpread('auto', 390, 844) === 1 && P.pgSpread('auto', 844, 390) === 1 && P.pgSpread('auto', 0, 0) === 1);
ok('a tablet on its side or a computer shows two, but a tall tablet or a narrow window shows one', P.pgSpread('auto', 1180, 820) === 2 && P.pgSpread('auto', 1440, 900) === 2 && P.pgSpread('auto', 820, 1180) === 1 && P.pgSpread('auto', 1000, 900) === 1 && P.pgSpread('auto', 900, 500) === 1);
ok('asking for one page always gives one, asking for two gives two only when there is room', P.pgSpread('single', 2000, 900) === 1 && P.pgSpread('double', 900, 1200) === 2 && P.pgSpread('double', 500, 800) === 1 && P.pgSpread('nonsense', 1400, 800) === 2 && P.pgSpread('__proto__', 400, 800) === 1);

/* geometry: whole pixels, never wider than the screen, centred, never narrower than something readable */
{
  let bad = null; let count = 0;
  for (const w of [280, 320, 360, 390, 414, 600, 768, 820, 1024, 1280, 1440, 1920, 2560, 3840]) for (const cols of [1, 2]) for (const colMax of [300, 520, 660, 820]) for (const margin of [0, 14, 28, 56]) for (const gap of [16, 40, 64]) {
    const g = P.pgGeometry(w, cols, colMax, margin, gap); count++;
    const ints = [g.colW, g.gap, g.clipW, g.left].every(Number.isInteger);
    const fits = g.clipW <= Math.max(w, g.cols * 120 + (g.cols - 1) * g.gap) && g.left >= 0 && g.left + g.clipW <= Math.max(w, g.clipW);
    const sum = g.clipW === g.cols * g.colW + (g.cols - 1) * g.gap; const readable = g.colW >= 120 && g.colW <= Math.max(colMax, 160);
    const centred = g.clipW > w || Math.abs(g.left - (w - g.clipW) / 2) <= 0.5;
    if (!(ints && fits && sum && readable && centred)) { bad = bad || { w, cols, colMax, margin, gap, g }; }
  }
  ok(`all ${count} layouts are whole pixels, centred, readable and sum to the clip width`, !bad, bad);
  const a = P.pgGeometry(1440, 2, 660, 28, 56); ok('two 660px pages fit side by side on a wide screen with the gap between them', a.cols === 2 && a.colW === 660 && a.clipW === 660 * 2 + 56 && a.left === Math.floor((1440 - a.clipW) / 2), a);
  const b = P.pgGeometry(390, 1, 660, 28, 40); ok('on a phone the page is the screen less the margins', b.colW === 390 - 56 && b.clipW === b.colW && b.left === 28, b);
  ok('rubbish input gives a usable page, not NaN', (() => { const g = P.pgGeometry(NaN, 7, 'x', -4, 'y'); return [g.colW, g.clipW, g.gap, g.left, g.cols].every((v) => Number.isInteger(v) && v >= 0) && g.cols === 1 && g.colW >= 120; })());
  ok('the slide distance is a whole number of screens (page times clip plus gap)', P.pgShift(0, a) === 0 && P.pgShift(3, a) === 3 * (a.clipW + a.gap) && P.pgShift(-2, a) === 0 && P.pgShift(2.6, a) === 3 * (a.clipW + a.gap));
}
/* page count and the page a paragraph is on, for a made-up layout of n columns */
{
  for (const cols of [1, 2]) for (const n of [1, 2, 3, 4, 5, 9, 10, 17]) {
    const g = P.pgGeometry(1500, cols, 600, 28, 50); const scrollW = n * g.colW + (n - 1) * g.gap;
    const want = Math.ceil(n / cols);
    ok(`${n} columns in a ${cols}-column spread are ${want} screens`, P.pgPageCount(scrollW, g) === want, [P.pgPageCount(scrollW, g), want]);
    let allOn = true; for (let c = 0; c < n; c++) for (const off of [-0.4, 0, 3, g.colW / 2, g.colW - 1, g.colW]) { const x = c * (g.colW + g.gap) + off; if (P.pgPageOfX(x, g) !== Math.floor(c / cols)) allOn = false; }
    ok(`every point from the left edge to the right edge of each of ${n} columns maps to the screen that shows it (${cols}-column)`, allOn);
  }
  const g = P.pgGeometry(1000, 1, 500, 28, 40); ok('a few pixels of rounding in the measured width never add or lose a screen', [-3, -1, 0, 1, 2].every((d) => P.pgPageCount(5 * g.colW + 4 * g.gap + d, g) === 5) && P.pgPageCount(0, g) === 1 && P.pgPageCount(NaN, g) === 1);
}

/* turning: from the start, forward visits every screen once, then stops; back from the end does the same in reverse */
{
  const pages = [3, 1, 5, 2, 4]; const n = pages.length; const total = pages.reduce((a, b) => a + b, 0);
  let k = 0; let pg = 0; const seen = [`${k}.${pg}`]; let steps = 0;
  for (;;) { const t = P.pgTurn(k, pg, pages[k], n, 1); if (!t) break; k = t.k; pg = t.page; seen.push(`${k}.${pg}`); if (++steps > 100) break; }
  ok('turning forward from the first page visits every screen once and stops at the last', seen.length === total && new Set(seen).size === total && k === n - 1 && pg === pages[n - 1] - 1, [seen.length, total]);
  ok('turning forward at the last page of the text goes nowhere', P.pgTurn(n - 1, pages[n - 1] - 1, pages[n - 1], n, 1) === null);
  seen.length = 0; k = n - 1; pg = pages[k] - 1; seen.push(`${k}.${pg}`); steps = 0;
  for (;;) { const t = P.pgTurn(k, pg, pages[k], n, -1); if (!t) break; k = t.k; pg = t.page === 'last' ? pages[t.k] - 1 : t.page; seen.push(`${k}.${pg}`); if (++steps > 100) break; }
  ok('turning back from the last page visits every screen once and stops at the first', seen.length === total && new Set(seen).size === total && k === 0 && pg === 0, [seen.length, total]);
  ok('turning back at the first page goes nowhere, and back from a later section asks for that section’s last screen', P.pgTurn(0, 0, 3, n, -1) === null && JSON.stringify(P.pgTurn(2, 0, 5, n, -1)) === JSON.stringify({ k: 1, page: 'last' }));
  ok('a text of one section and one screen cannot be turned', P.pgTurn(0, 0, 1, 1, 1) === null && P.pgTurn(0, 0, 1, 1, -1) === null);
}

/* taps */
{
  const W = 1000; const H = 800; const z = (x, y, m) => P.pgZone(x, y, W, H, m);
  ok('side taps: left third back, right third forward, middle the menu', z(100, 400, 'sides') === 'prev' && z(299, 400, 'sides') === 'prev' && z(500, 400, 'sides') === 'menu' && z(701, 400, 'sides') === 'next' && z(950, 10, 'sides') === 'next');
  ok('"most turns forward": a thin left strip goes back, the top strip is the menu, everything else goes forward', z(100, 400, 'wide') === 'prev' && z(219, 400, 'wide') === 'prev' && z(500, 400, 'wide') === 'next' && z(900, 400, 'wide') === 'next' && z(500, 50, 'wide') === 'menu' && z(100, 50, 'wide') === 'menu');
  ok('with taps off, or a screen of no size, a tap is only the menu', z(100, 400, 'off') === 'menu' && P.pgZone(5, 5, 0, 0, 'sides') === 'menu' && z(100, 400, 'nonsense') === 'prev');
  let covered = true; for (let x = 0; x <= W; x += 20) for (let y = 0; y <= H; y += 20) for (const m of ['sides', 'wide', 'off']) if (!['prev', 'next', 'menu'].includes(z(x, y, m))) covered = false;
  ok('every point of the screen means something in every tap setting', covered);
}
/* swipes */
{
  const s = P.pgSwipe;
  ok('a long drag left goes forward, a long drag right goes back', s(-300, 5, 400, 1000) === 'next' && s(300, -5, 400, 1000) === 'prev');
  ok('a quick short flick turns the page, a slow short drag springs back', s(-60, 4, 90, 1000) === 'next' && s(60, 4, 90, 1000) === 'prev' && s(-60, 4, 900, 1000) === 'snap' && s(120, 0, 800, 1000) === 'snap');
  ok('a mostly vertical drag, or a tiny movement, is not a page turn', s(-40, 90, 200, 1000) === 'none' && s(5, 0, 50, 1000) === 'none' && s(0, 0, 0, 1000) === 'none' && s(-100, 90, 200, 1000) === 'none');
  ok('a drag past a fifth of a narrow screen turns the page', s(-90, 0, 700, 400) === 'next' && s(-70, 0, 700, 400) === 'snap');
}
/* keys */
{
  const k = (key, o = {}) => P.pgKey(Object.assign({ key, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false }, o));
  ok('right, down, Page Down and Space go forward; left, up, Page Up and Shift+Space go back', ['ArrowRight', 'ArrowDown', 'PageDown', ' '].every((x) => k(x) === 'next') && ['ArrowLeft', 'ArrowUp', 'PageUp'].every((x) => k(x) === 'prev') && k(' ', { shiftKey: true }) === 'prev');
  ok('Home and End go to the section’s ends, Ctrl+Home and Ctrl+End to the text’s, [ and ] to the neighbouring sections', k('Home') === 'first' && k('End') === 'last' && k('Home', { ctrlKey: true }) === 'start' && k('End', { ctrlKey: true }) === 'finish' && k(']') === 'nextSec' && k('[') === 'prevSec');
  ok('other keys, and keys with Ctrl, Alt or the command key held, are left alone', ['a', 'Enter', 'Tab', 'Escape', 'f', '1'].every((x) => k(x) === null) && k('ArrowRight', { ctrlKey: true }) === null && k('ArrowRight', { altKey: true }) === null && k('ArrowRight', { metaKey: true }) === null && k('ArrowRight', { shiftKey: true }) === null && P.pgKey(null) === null);
}
/* wheel */
{
  ok('one flick of a wheel turns one page; small movement does not', P.pgWheel(80, 0, 0, 1000) === 1 && P.pgWheel(-80, 0, 0, 1000) === -1 && P.pgWheel(10, 0, 0, 1000) === 0 && P.pgWheel(0, 0, 0, 1000) === 0);
  ok('the trackpad’s trailing events after a turn are ignored, then the next gesture counts', P.pgWheel(120, 0, 1000, 1200) === 0 && P.pgWheel(120, 0, 1000, 1600) === 1);
  ok('a sideways wheel turns pages too', P.pgWheel(0, 90, 0, 1000) === 1 && P.pgWheel(2, -90, 0, 1000) === -1);
}

/* reading time */
{
  ok('the default pace is an easy 225 words a minute and pace is held between sensible limits', P.RD_CPM.def === 1350 && P.rdCpm(undefined) === 1350 && P.rdCpm('x') === 1350 && P.rdCpm(-5) === 1350 && P.rdCpm(1) === P.RD_CPM.min && P.rdCpm(1e9) === P.RD_CPM.max && P.rdCpm(2000) === 2000);
  ok('a steady stretch moves the estimate toward that pace, by a fifth', Math.abs(P.rdSpeed(1350, 2000, 60000) - (1350 * 0.8 + 2000 * 0.2)) < 1e-9);
  ok('stretches that cannot be reading change nothing: too short, too long, skimming, or hardly moving', [[1800, 800], [1800, 300000], [20000, 20000], [10, 600000], [0, 30000], [-5, 30000], [1800, 0], [NaN, 30000]].every(([c, ms]) => P.rdSpeed(1350, c, ms) === 1350));
  let v = 1350; for (let i = 0; i < 60; i++) v = P.rdSpeed(v, 3000, 60000); ok('after many pages at 3,000 characters a minute the estimate has settled near it', Math.abs(v - 3000) < 40, v);
  v = 1350; for (let i = 0; i < 200; i++) v = P.rdSpeed(v, 100000, 3000); ok('an absurd pace never moves it past the limits', v === 1350);
  ok('minutes are characters over pace, never negative', Math.abs(P.rdMinutes(13500, 1350) - 10) < 1e-9 && P.rdMinutes(-4, 1350) === 0 && P.rdMinutes(NaN, 1350) === 0 && P.rdMinutes(1350, 'x') === 1);
  ok('time left reads naturally', P.rdFmtLeft(0.2) === 'Less than a minute left' && P.rdFmtLeft(1) === '1 min left' && P.rdFmtLeft(7.4) === '7 min left' && P.rdFmtLeft(59.6) === '1 h left' && P.rdFmtLeft(80) === '1 h 20 min left' && P.rdFmtLeft(180) === '3 h left' && P.rdFmtLeft(11100) === '185 h left' && P.rdFmtLeft(NaN) === '' && P.rdFmtLeft(-1) === '' && P.rdFmtLeft(8, ' in section') === '8 min left in section');
  ok('the share of a text read stays between none and all', P.rdShare(0, 100) === 0 && P.rdShare(50, 100) === 0.5 && P.rdShare(500, 100) === 1 && P.rdShare(-5, 100) === 0 && P.rdShare(5, 0) === 0);
  ok('the footer names the screen and the time left in the section, and drops the time when unknown', P.pgFootText(2, 14, 8) === 'Page 3 of 14 · 8 min left in section' && P.pgFootText(0, 1, NaN) === 'Page 1 of 1' && P.pgFootText(-3, 0, 0.3) === 'Page 1 of 1 · Less than a minute left in section');
  ok('characters on a page is the section over its screens, at least one', P.pgCharsPerPage(9000, 6) === 1500 && P.pgCharsPerPage(0, 0) === 1 && P.pgCharsPerPage(100, 0) === 100);
}
/* the trail of places jumped from */
{
  let t = []; t = P.trailPush(t, { k: 1, p: 2 }); t = P.trailPush(t, { k: 1, p: 2 }); t = P.trailPush(t, { k: 4, p: 0 });
  ok('the trail keeps places in order and does not repeat the same place', t.length === 2 && t[1].k === 4 && t[0].p === 2);
  for (let i = 0; i < 30; i++) t = P.trailPush(t, { k: i, p: i }, 8);
  ok('the trail keeps only the last few places, and does not change the list it was given', t.length === 8 && t[7].k === 29 && (() => { const a = [{ k: 1, p: 1 }]; P.trailPush(a, { k: 2, p: 2 }); return a.length === 1; })());
}

/* how to read: plain names, one line each, three styles and a switch (C1, 18 November 2026: the maker could not tell By section from Scroll) */
{
  ok('the four saved modes keep their names in storage, and the plain names are not the old ones', JSON.stringify(Object.keys(P.RL_MODES)) === JSON.stringify(['section', 'scroll', 'page', 'sheet']) && !Object.values(P.RL_MODES).some((n) => /^(By section|Pages|Sheets)$/.test(n)), P.RL_MODES);
  ok('there are three styles to choose from, each with a plain name and one line that says what it is like', P.RL_STYLES.length === 3 && P.RL_STYLES.every(([id, nm, line]) => ['scroll', 'page', 'sheet'].includes(id) && /^[A-Z][A-Za-z ]{3,18}$/.test(nm) && line.length >= 25 && line.length <= 90 && /[.:]/.test(line)) && new Set(P.RL_STYLES.map((x) => x[1])).size === 3, P.RL_STYLES);
  ok('Scroll, Book pages and PDF sheets are the names, and no description leans on a word the others need to explain', ['Scroll', 'Book pages', 'PDF sheets'].every((n, i) => P.RL_STYLES[i][1] === n) && !P.RL_STYLES.some((x) => /section/i.test(x[2]) && x[0] !== 'scroll'));
  ok('the switch is for Scroll only, in plain words: stop at the end of each section, one section at a time with Previous and Next', /^Stop at the end of each section$/.test(P.RL_STOP[0]) && /Previous and Next/.test(P.RL_STOP[1]));
  ok('what the chooser says is what happens (UX-15): Scroll’s own line promises no stop and no next section, and the switch has a line for each state, on stopping at a section with Previous and Next, off letting the next section follow', !/next section|follows on/i.test(P.RL_STYLES[0][2]) && /^Read straight down/.test(P.RL_STYLES[0][2]) && P.RL_STOP.length === 3 && /^On: .*Previous and Next/.test(P.RL_STOP[1]) && /^Off: .*next section follows on/.test(P.RL_STOP[2]) && P.RL_STOP.slice(1).every((x) => x.length >= 25 && x.length <= 80), P.RL_STOP);
  ok('every mode belongs to one style, and a style with the switch gives the mode back: a saved layout keeps working', Object.keys(P.RL_MODES).every((m) => P.rlModeFor(P.rlStyleOf(m), m === 'section') === m), Object.keys(P.RL_MODES).map((m) => [m, P.rlStyleOf(m), P.rlModeFor(P.rlStyleOf(m), m === 'section')]));
  ok('section and scroll are the one style (the old By section is Scroll with the switch on), pages and sheets each their own', P.rlStyleOf('section') === 'scroll' && P.rlStyleOf('scroll') === 'scroll' && P.rlStyleOf('page') === 'page' && P.rlStyleOf('sheet') === 'sheet');
  ok('choosing a style gives a mode that is on the list, and the switch only matters to Scroll', ['scroll', 'page', 'sheet'].every((st) => [true, false].every((sw) => P.RL_MODES[P.rlModeFor(st, sw)])) && P.rlModeFor('page', true) === 'page' && P.rlModeFor('sheet', true) === 'sheet' && P.rlModeFor('scroll', true) === 'section' && P.rlModeFor('scroll', false) === 'scroll');
  ok('anything odd falls back to Scroll, and a saved layout from before still cleans to the same mode', P.rlStyleOf('nope') === 'scroll' && P.rlStyleOf(undefined) === 'scroll' && P.rlModeFor('nope', true) === 'section' && ['section', 'scroll', 'page', 'sheet'].every((m) => P.rlClean({ mode: m }).mode === m));
}
console.log(`pager: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
