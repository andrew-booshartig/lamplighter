// Run: node tests/random-scroll.test.js — the Random page does not move when the card changes (the maker, 19 November 2026: "when i click for another random selection, i don't want the page to reset to the top").
// The fault it guards: a draw swapped the card for one line, "Turning to ...", the page became as short as the screen, the browser moved its scroll to 0, and the new card came in at the top of a page that had been scrolled
// away from it. The page now keeps the card on show until the new one is ready, swaps it in one step, and holds what the person was looking at (holdView / psgHoldDelta in 6d-passage.js).
// Two parts: the arithmetic (psgHoldDelta, pure), and the page itself, drawn against a small model of a browser (a window that scrolls and clamps its scroll when the document gets shorter, a card whose height changes
// with what is in it, a Recent row that grows, the controls under the card), driven by the real handlers: Another, Space, N, R, B, Previous, Next, the Recent row, a card much longer than the screen, a draw asked for
// from the controls, a message in place of the card, and the keyboard focus. The test fails if the draw code scrolls the window to the top, shows the one-line placeholder in place of a card, or leaves the card's top edge off the screen.
const fs = require('fs'); const path = require('path');
const { M, stub } = require('./_harness.js');
const P = require('../src/js/6d-passage.js');
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra === '' ? '' : JSON.stringify(extra).slice(0, 400)); } };
const SRC = fs.readFileSync(path.join(__dirname, '../src/js/6d-passage.js'), 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── the arithmetic ── */
{ const H = P.psgHoldDelta;
  ok('a card whose top edge is in view stays where it is: nothing to do when the swap did not move it, and the page is put back when it did (the browser had clamped it)', H({ mode: 'card', r0: { top: 93 }, r1: { top: 93 } }) === 0 && H({ mode: 'card', r0: { top: 93 }, r1: { top: 150 } }) === 57 && H({ mode: 'card', r0: { top: 20 }, r1: { top: 20 } }) === 0);
  ok('a new card after the person had scrolled into the old one starts at the top of the screen (12 px under it), never above it and never at the top of the page', H({ mode: 'card', r0: { top: -307 }, r1: { top: -307 } }) === -319 && H({ mode: 'card', r0: { top: -2900 }, r1: { top: -2900 } }) === -2912 && H({ mode: 'card', r0: { top: -40 }, r1: { top: -40 }, gap: 20 }) === -60);
  ok('if the browser had already brought the top edge into view, there is nothing to do', H({ mode: 'card', r0: { top: -307 }, r1: { top: 20 } }) === 0 && H({ mode: 'card', r0: { top: -307 }, r1: { top: 0 } }) === 0);
  ok('the same card made longer (Read on) or drawn again (word help) is held exactly where it was, even when its top is above the screen', H({ mode: 'card', same: true, r0: { top: -307 }, r1: { top: -307 } }) === 0 && H({ mode: 'card', same: true, r0: { top: -307 }, r1: { top: -200 } }) === 107 && H({ mode: 'card', same: true, r0: { top: -307 }, r1: { top: -400 } }) === -93);
  ok('below the card, what the person looks at is held: the block under it that was on the screen, or, with none, the card’s bottom edge', H({ mode: 'below', a: { before: 300, after: 346 } }) === 46 && H({ mode: 'below', a: { before: 300, after: 300 } }) === 0 && H({ mode: 'below', r0: { bottom: -50 }, r1: { bottom: 30 } }) === 80);
  ok('at the controls their top edge is held, whatever the card does', H({ mode: 'controls', c0: 120, c1: 120 }) === 0 && H({ mode: 'controls', c0: 120, c1: 166 }) === 46 && H({ mode: 'controls', c0: 120, c1: 80 }) === -40);
  ok('a measurement that is missing or not a number counts as no change, never NaN', [H({}), H({ mode: 'card' }), H({ mode: 'below' }), H({ mode: 'controls' }), H({ mode: 'card', r0: { top: NaN }, r1: { top: undefined } }), H({ mode: 'controls', c0: 'x', c1: null })].every((v) => v === 0));
}

/* ── the source: the old way is gone ── */
{ const turning = SRC.indexOf('const turning = '); const lines = SRC.split('\n');
  const placeholders = lines.map((l, i) => [i, l]).filter(([, l]) => /Turning to \$\{/.test(l));
  ok('the one-line placeholder "Turning to …" exists in one place only, the helper that keeps the card on show when there is one (a draw never swaps a card for it)', placeholders.length === 1 && /const turning = /.test(placeholders[0][1]) && turning > 0 && /if \(hasCard\(\)\) \{ if \(out\.classList\) out\.classList\.add\('psgx-busy'\); return; \}/.test(SRC), placeholders.map(([i]) => i));
  ok('no code of the page scrolls the window to the top: no scrollTo, no scrollTop, no window.scroll, no scrollIntoView except the parallels and the editor of saved filters, which the person asked for', !/scrollTo\s*\(/.test(SRC) && !/scrollTop\s*=/.test(SRC) && !/window\.scroll\(/.test(SRC) && (SRC.match(/scrollIntoView\(/g) || []).length === 2 && /sm\.scrollIntoView\(\{ block: 'start'/.test(SRC) && /d\.scrollIntoView\(\{ block: 'center'/.test(SRC) && /scrollBy/.test(SRC));
  ok('the address changes by replaceState (no hashchange, so the router does not draw the page again and scroll it to the top: Router.render ends with scrollTo(0, 0))', /history\.replaceState\(null, '', '#\/path\/passage'/.test(SRC) && !/location\.hash\s*=\s*'#\/path\/passage/.test(SRC.replace(/location\.hash = '#\/path\/similar[^;]*;/, '')));
  ok('every message put in the card’s place goes through the same care (put), and a card is shown by show(), which holds the view; Read on and word help are the same card (show(p, true))', (SRC.match(/\bput\(/g) || []).length >= 6 && /show\(p, true\); enrich\(p, t\.secs\)/.test(SRC) && /if \(cur\) show\(cur, true\)/.test(SRC) && /const held = holdView\(same\)/.test(SRC) && /renderHist\(\); psgSetHash\(psgCode\(p\.id, p\.rc\.len, p\.rc\.seed\), addrQS\(\)\); held\(\);/.test(SRC));
  ok('the keyboard focus goes to the same control of the new card without scrolling (preventScroll), so a person who pressed Another with Enter can press it again', /el\.focus\(\{ preventScroll: true \}\)/.test(SRC));
  const css = fs.readFileSync(path.join(__dirname, '../src/css/app.css'), 'utf8');
  ok('the card that is on show dims a little while the next one is made (after a moment, so a quick draw never flickers) and stays still for a person who asked for less motion', /#psOut\.psgx-busy \.psgx\{opacity:\.55;transition:opacity \.2s ease \.18s\}/.test(css) && /html\.reduce-motion #psOut\.psgx-busy \.psgx\{transition:none\}/.test(css));
}

/* ── the page, against a model of a browser ── */
(async () => {
  M.TXT._scripts.index = Promise.resolve();
  const BT = globalThis.BEATLAB_TEXTS;
  const paragraph = (k) => `Paragraph ${k} of the old book says that the people had waited a long time for the rain, and when at last the first clouds came up over the hills the old man went out and stood in the road. He said nothing to anyone. His daughter, who had followed him, took his hand, and together they watched the dark edge of the storm move slowly across the valley toward the village where the others were already beginning to gather ${k}.`;
  BT.add('b-lev', { title: 'Leviticus', by: 'World English Bible', license: 'Public domain', src: '', chars: 30000, n: 6 }, [0, 1, 2, 3, 4, 5].map((c) => ['Chapter ' + (c + 1), Array.from({ length: 10 }, (_, i) => paragraph(c * 10 + i)).join('\n\n')]));
  BT.add('b-num', { title: 'Numbers', by: 'World English Bible', license: 'Public domain', src: '', chars: 30000, n: 6 }, [0, 1, 2, 3, 4, 5].map((c) => ['Chapter ' + (c + 1), Array.from({ length: 10 }, (_, i) => paragraph(100 + c * 10 + i)).join('\n\n')]));
  M.store.del('passage.src'); M.store.del('passage.srcv'); M.store.del('passage.prefs');
  M.store.set('passage.filters', { base: 'all', r: [], p: [], dated: false, b: [], k: [], a: [] }); M.store.set('passage.saved', { v: 1, last: '', items: [] });

  /* the model: a document with the card, the Recent row, the controls and the kept passages, one under the other (the single column of a narrow screen); a window that scrolls, clamps when the document is shorter, and records every call */
  const VH = 800; const sim = { y: 0, cardTop: 93, cardH: 900, histH: 0, sideH: 700, nextH: 900, calls: [], html: [], focus: [] };
  const docH = () => sim.cardTop + sim.cardH + sim.histH + 22 + sim.sideH + 120;
  const clampY = () => { sim.y = Math.max(0, Math.min(sim.y, docH() - VH)); };
  const rect = (top, h) => ({ top: top - sim.y, bottom: top + h - sim.y, height: h, left: 0, right: 600, width: 600 });
  const focusEl = { focus(o) { sim.focus.push(o); } };
  const outEl = { _h: '', act: false, classList: { _c: new Set(), add(c) { this._c.add(c); }, remove(c) { this._c.delete(c); }, contains(c) { return this._c.has(c); } },
    get innerHTML() { return this._h; }, set innerHTML(v) { sim.html.push(String(v)); this._h = String(v); sim.cardH = /<article/.test(this._h) ? sim.nextH : /Turning to/.test(this._h) ? 24 : 110; clampY(); },
    setAttribute() {}, removeAttribute() {}, getBoundingClientRect() { return rect(sim.cardTop, sim.cardH); }, contains(x) { return !!x && x.inCard === true; }, querySelector(s) { if (s === '.psg') return /<article/.test(this._h) ? {} : null; if (s === '#psGo') return focusEl; return null; } };
  const histEl = { get innerHTML() { return this._h || ''; }, set innerHTML(v) { this._h = String(v); sim.histH = /psgx-hist/.test(this._h) ? 46 : 0; clampY(); }, getBoundingClientRect() { return rect(sim.cardTop + sim.cardH, sim.histH); } };
  const simEl = { innerHTML: '', _sim: null, addEventListener() {}, removeEventListener() {}, getBoundingClientRect() { return rect(sim.cardTop + sim.cardH + sim.histH, 0); } };
  const sideEl = { getBoundingClientRect() { return rect(sim.cardTop + sim.cardH + sim.histH + 22, sim.sideH); } };
  const keptEl = { innerHTML: '', getBoundingClientRect() { return rect(sim.cardTop + sim.cardH + sim.histH + 22 + sim.sideH, 0); } };
  const W = M.window; const D = M.document;
  W.innerHeight = VH;
  W.scrollBy = (a, b) => { const dy = typeof a === 'object' && a ? a.top : b; sim.calls.push(['scrollBy', dy]); sim.y += dy; clampY(); };
  W.scrollTo = (a, b) => { sim.calls.push(['scrollTo', typeof a === 'object' && a ? a.left : a, typeof a === 'object' && a ? a.top : b]); sim.y = typeof a === 'object' && a ? a.top : b; clampY(); };
  const DL = {}; D.addEventListener = (ev, fn) => { (DL[ev] = DL[ev] || []).push(fn); }; D.removeEventListener = () => {}; D.activeElement = null;
  const L = {}; const root = { innerHTML: '', isConnected: true, querySelector: (s) => (s === '#pbody' ? pbody : stub), addEventListener(ev, fn, cap) { (L[ev] = L[ev] || []).push({ fn, cap: !!cap }); }, removeEventListener() {} };
  const pbody = { innerHTML: '', querySelector: () => stub, addEventListener() {} };
  globalThis.__q = { '#psOut': outEl, '#psHist': histEl, '#psSim': simEl, '#psSide': sideEl, '#psKept': keptEl, '#psB': { innerHTML: '' }, '#psHow': { innerHTML: '' }, '#psRand': { setAttribute() {} } };
  const fire = async (ev, e) => { const ls = L[ev] || []; ls.filter((x) => x.cap).forEach((x) => x.fn(e)); for (const x of ls.filter((y) => !y.cap)) await x.fn(e); await sleep(45); };
  const mk = (props, inSide) => { const el = Object.assign({ dataset: {}, inCard: !inSide, closest(s) { if (s === '#psSide') return inSide ? el : null; const m = /^\[data-([a-z]+)\]$/.exec(s); if (m && el.dataset[m[1]] !== undefined) return el; return null; } }, props); return el; };
  const press = (act) => fire('click', { target: mk({ dataset: { psg: act }, id: act === 'next' ? 'psGo' : '' }) });
  const preset = (id) => fire('click', { target: mk({ dataset: { preset: id } }, true) });
  const recent = (i) => fire('click', { target: mk({ dataset: { hist: String(i) } }) });
  const key = async (k, code) => { const e = { key: k, code: code || '', target: { closest: () => null }, defaultPrevented: false, ctrlKey: false, metaKey: false, altKey: false, preventDefault() { this.defaultPrevented = true; } }; (DL.keydown || []).forEach((f) => f(e)); await sleep(60); return e; };
  const refOf = () => (/id="psRef">([^<]*)</.exec(outEl.innerHTML) || [])[1] || '';
  const cardTop = () => Math.round(sim.cardTop - sim.y);
  const cleanup = M.Pages.path.mount(root, ['passage'], { m: 'passage' }); await sleep(120);
  ok('the model is drawn: the first card is on show and the one-line placeholder was shown only before it (nothing was on show yet)', /<article/.test(outEl.innerHTML) && sim.html.length >= 1 && sim.html.filter((h) => /Turning to/.test(h)).length <= 1 && !/Turning to/.test(outEl.innerHTML), sim.html.map((h) => h.slice(0, 40)));
  await press('next'); await press('next');      // two draws more: the Recent row exists and Previous is there

  /* the scenario: the person is at y, the next card is nextH tall, and does something */
  const run = async (name, y, nextH, act, o = {}) => {
    sim.y = y; clampY(); sim.nextH = nextH; D.activeElement = o.focus || null;
    const before = { y: Math.round(sim.y), top: cardTop(), ref: refOf(), side: Math.round(sim.cardTop + sim.cardH + sim.histH + 22 - sim.y) }; sim.calls.length = 0; sim.html.length = 0; sim.focus.length = 0;
    await act(); await sleep(150);
    const after = { y: Math.round(sim.y), top: cardTop(), ref: refOf(), side: Math.round(sim.cardTop + sim.cardH + sim.histH + 22 - sim.y) };
    D.activeElement = null;
    return { name, before, after, calls: sim.calls.slice(), html: sim.html.slice(), focus: sim.focus.slice() };
  };
  const noTop = (r) => r.calls.every((c) => !(c[0] === 'scrollTo' && (c[2] === 0 || c[2] === undefined)));
  const noPlaceholder = (r) => r.html.every((h) => !/Turning to/.test(h));
  const intoCard = (r) => r.after.y > 0 && r.after.top >= 0 && r.after.top <= 24;
  const swaps = (r) => r.html.filter((h) => /<article/.test(h)).length;      // the stub draws the same passage for the same seed, so a new card is told by its swap, not by its words
  const GOOD = (r, name) => ok(`${name}: the page is not sent to the top (no scrollTo, the scroll is not 0), the card on show is not swapped for the placeholder, the new card comes in with one swap and its top edge is on the screen`, noTop(r) && noPlaceholder(r) && intoCard(r) && swaps(r) === 1, [r.before, r.after, r.calls, r.html.map((h) => h.slice(0, 30))]);

  /* scrolled into a long card: the person has read down it (the bar is at the bottom of the screen) and presses Another */
  GOOD(await run('Another (button), scrolled 400 px into the card', 400, 500, () => press('next')), 'Another (button), scrolled 400 px into the card');
  GOOD(await run('Space, scrolled 400 px', 400, 1500, () => key(' ', 'Space')), 'Space, scrolled 400 px');
  GOOD(await run('N, scrolled 400 px', 400, 700, () => key('n')), 'N, scrolled 400 px');
  GOOD(await run('R, scrolled 400 px', 400, 700, () => key('r')), 'R, scrolled 400 px');
  GOOD(await run('Another from this book (button), scrolled 400 px', 400, 800, () => press('book')), 'Another from this book (button), scrolled 400 px');
  GOOD(await run('B, scrolled 400 px', 400, 800, () => key('b')), 'B, scrolled 400 px');
  GOOD(await run('Previous (button), scrolled 400 px', 400, 600, () => press('back')), 'Previous (button), scrolled 400 px');
  GOOD(await run('Next (button), scrolled 400 px', 400, 1100, () => press('fwd')), 'Next (button), scrolled 400 px');
  GOOD(await run('the left arrow (Previous), scrolled 400 px', 400, 600, () => key('ArrowLeft')), 'the left arrow (Previous), scrolled 400 px');
  GOOD(await run('the right arrow (Next), scrolled 400 px', 400, 1100, () => key('ArrowRight')), 'the right arrow (Next), scrolled 400 px');
  { const r = await run('a chip of the Recent row, scrolled 400 px', 400, 650, () => recent(0)); GOOD(r, 'a chip of the Recent row, scrolled 400 px'); }
  /* a card much longer than the screen: five and four screens tall, read down to the middle of it */
  sim.y = 0; sim.nextH = 4000; await press('next');
  GOOD(await run('a card much longer than the screen, read to the middle', 2200, 4400, () => press('next')), 'a card much longer than the screen, read to the middle');
  GOOD(await run('the same, deeper still, with Space', 3500, 900, () => key(' ', 'Space')), 'the same, deeper still, with Space');
  /* the top edge of the card is in view: it stays where it is, taller or shorter */
  { const r = await run('at the top of the page, the next card taller', 0, 1800, () => press('next')); ok('at the top of the page the card stays where it is when the next card is taller (nothing scrolls)', r.after.y === 0 && r.after.top === 93 && noTop(r) && noPlaceholder(r) && swaps(r) === 1, [r.before, r.after, r.calls]); }
  { const r = await run('a little way down, card top still in view, the next card taller', 40, 1800, () => key('n')); ok('with the top edge of the card in view, it stays at the same place on the screen', r.after.top === r.before.top && noTop(r) && noPlaceholder(r), [r.before, r.after, r.calls]); }
  { sim.sideH = 0; const r = await run('the next card is short, the document is shorter than the screen would need', 60, 80, () => press('next')); sim.sideH = 700; ok('when the next card is so short that the browser has to move the page, the card’s top edge is still on the screen and nothing is sent to the top by the page’s own code', r.after.top >= 0 && r.after.top <= VH && noTop(r) && noPlaceholder(r), [r.before, r.after, r.calls]); }
  /* the old fault, directly: with the placeholder in, this is what the browser would have done */
  { sim.cardH = 2000; sim.y = 400; clampY(); const before = sim.y; outEl.innerHTML = '<p class="t2 small">Turning to Leviticus…</p>'; ok('the model reproduces the old fault: a one-line placeholder in place of the card makes the document shorter and the browser moves the scroll (here from 400 to the end of what is left; to 0 on a page with nothing under the card), which is why the card now stays on show', before === 400 && sim.y < before, [before, sim.y]); sim.nextH = 900; await press('next'); }

  /* a draw asked for from the controls: they stay where they are while the card above them changes height */
  { sim.y = 0; clampY(); sim.nextH = 900; await press('next'); const y0 = Math.round(sim.cardTop + sim.cardH + sim.histH + 22 - 120);
    const r = await run('a quick choice pressed with the controls on the screen', y0, 450, () => preset('sources'));
    ok('at the controls: pressing a quick choice draws a new card above, and the controls do not move on the screen (they stay 120 px from the top), the page is not sent to the top, nothing is swapped for the placeholder', Math.abs(r.after.side - 120) <= 1 && r.after.y > 0 && noTop(r) && noPlaceholder(r) && swaps(r) === 1, [r.before, r.after, r.calls]);
    const r2 = await run('a quick choice, the next card taller', Math.round(sim.cardTop + sim.cardH + sim.histH + 22 - 120), 1700, () => preset('all'));
    ok('and the same when the new card is much taller', Math.abs(r2.after.side - 120) <= 1 && noTop(r2) && noPlaceholder(r2), [r2.before, r2.after]); }
  /* the Method section (stage 2 of the Random suite): a draw by a text, a date or dice is asked for from the controls, so it holds them exactly as a quick choice does (Enter in a box runs the same functions: tests/random-methods.test.js) */
  { Object.assign(globalThis.__q, { '#psMxText': { value: 'the same words each time' }, '#psMxDate': { value: '2026-11-19' }, '#psMxNums': { value: '1 2 3' }, '#psMxMsg': { textContent: '' }, '#psMxNeed': { textContent: '' }, '#psMxLast': { textContent: '' } });
    const meth = (k, extra) => fire('click', { target: mk({ dataset: Object.assign({ meth: k }, extra || {}) }, true) });
    await press('free');      // let go of "this book only" (Another from this book, above, pinned one): the list the dice count along is the two books
    for (const [name, act] of [['a text', () => meth('text')], ['a date', () => meth('date')], ['dice rolled for me', () => meth('roll')], ['dice typed in', () => meth('typed')]]) {
      sim.y = 0; clampY(); sim.nextH = 900; await press('next'); const y0 = Math.round(sim.cardTop + sim.cardH + sim.histH + 22 - 120);
      const r = await run(`a draw by ${name} with the controls on the screen`, y0, 450, act);
      ok(`at the controls: a draw by ${name} puts a new card above and the controls do not move on the screen (120 px from the top), the page is not sent to the top, nothing is swapped for the placeholder`, Math.abs(r.after.side - 120) <= 1 && r.after.y > 0 && noTop(r) && noPlaceholder(r) && swaps(r) === 1, [r.before, r.after, r.calls, r.html.map((h) => h.slice(0, 40))]);
      const r2 = await run(`${name}, the next card taller`, Math.round(sim.cardTop + sim.cardH + sim.histH + 22 - 120), 1700, act);
      ok(`and the same when the new card is much taller (${name})`, Math.abs(r2.after.side - 120) <= 1 && noTop(r2) && noPlaceholder(r2) && swaps(r2) === 1, [r2.before, r2.after]);
    }
    { sim.y = 400; clampY(); const r = await run('a draw by a text asked for from the card’s own bar is not possible (the way is chosen in the controls); Another after a text is a draw by chance', 400, 700, () => press('next')); ok('Another after a draw by a text goes on as before: the card stays, the page is not sent to the top', intoCard(r) && noTop(r) && noPlaceholder(r) && swaps(r) === 1, [r.before, r.after]); } }
  /* the same card made longer, or drawn again: held exactly. (The "Read on" button runs show(p, true); it is driven here through the model by calling a key that does not exist, so the check is on the arithmetic above and the source test.) */

  /* a message in the card's place (nothing matches the filters): it is put in one step and the page is not sent to the top */
  { M.store.set('passage.filters', { base: 'all', r: ['t:no-such'], p: [], dated: false, b: [], k: [], a: [] }); sim.y = 400; clampY(); sim.html.length = 0; sim.calls.length = 0; sim.nextH = 900; await key('n'); await sleep(100);
    ok('a message put in the card’s place (nothing matches) is one swap, the one-line placeholder is not used, and the page is not sent to the top', sim.html.every((h) => !/Turning to/.test(h)) && sim.calls.every((c) => !(c[0] === 'scrollTo')) , sim.html.map((h) => h.slice(0, 50)));
    M.store.set('passage.filters', { base: 'all', r: [], p: [], dated: false, b: [], k: [], a: [] }); }

  /* the keyboard focus: a person who pressed Another with Enter has the focus on the new Another */
  { const act = { id: 'psGo', dataset: { psg: 'next' }, inCard: true }; const r = await run('Another pressed with the keyboard (the focus is on the button)', 400, 700, () => press('next'), { focus: act }); ok('the keyboard focus goes to the same button of the new card, and does not scroll the page (preventScroll)', r.focus.length === 1 && r.focus[0] && r.focus[0].preventScroll === true && intoCard(r), [r.focus, r.after]); }
  { const r = await run('Another pressed with the mouse (nothing in the card has the focus)', 400, 700, () => press('next')); ok('nothing is focused when nothing was: the page does not take the focus', r.focus.length === 0 && intoCard(r)); }

  /* a first draw on an empty page may show the one-line placeholder; and no layout at all (the plain stub of the other tests) does not break the page */
  { delete globalThis.__q; globalThis.__q = { '#psOut': { innerHTML: '', setAttribute() {}, removeAttribute() {} }, '#psKept': { innerHTML: '' }, '#psB': { innerHTML: '' }, '#psHist': { innerHTML: '' }, '#psRand': { setAttribute() {} } };
    const root2 = { innerHTML: '', isConnected: true, querySelector: (s) => (s === '#pbody' ? pbody : stub), addEventListener() {}, removeEventListener() {} }; const c2 = M.Pages.path.mount(root2, ['passage'], { m: 'passage' }); await sleep(100);
    ok('with no layout at all (a page without getBoundingClientRect, as in the other tests) the card is still drawn and nothing is thrown', /<article/.test(globalThis.__q['#psOut'].innerHTML)); if (typeof c2 === 'function') c2(); }
  if (typeof cleanup === 'function') cleanup(); globalThis.__q = null; M.store.del('passage.filters'); M.store.del('passage.saved'); M.store.del('passage.src'); M.store.del('passage.srcv');
  console.log(`random scroll: ${pass} passed, ${fail} failed`);
  if (fail) process.exit(1);
})().catch((e) => { console.log('ERROR', e && e.stack || e); process.exit(1); });
