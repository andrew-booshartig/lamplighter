// Run: node tests/sheets.test.js — the arithmetic of the reader's Sheets view (src/js/2z-sheets-core.js): a sheet is a whole number of pixels, fits the screen, keeps its proportions at every
// zoom, the sheet counts add up to the right page numbers, the right sections stay drawn and the right sheets are filled, the keys lead where they say, and a page number typed in is only
// ever a real one.
const S = require('../src/js/2z-sheets-core.js');
let pass = 0; let fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 300)); } };

/* zoom and paper */
ok('the zoom ladder rises and holds 1 in it', S.SH_ZOOMS.every((z, i, a) => i === 0 || z > a[i - 1]) && S.SH_ZOOMS.includes(1));
ok('a zoom is the nearest step of the ladder', S.shZoomClean(1.09) === 1 && S.shZoomClean(1.4) === 1.5 && S.shZoomClean(0) === 0.7 && S.shZoomClean(99) === 2.2 && S.shZoomClean(NaN) === 1 && S.shZoomClean(undefined) === 1 && S.shZoomClean('x') === 1);
ok('rubbish zoom values never leave the ladder', [NaN, undefined, null, 'x', {}, [], Infinity, -Infinity, '1.2', 1e9, -1e9].every((v) => S.SH_ZOOMS.includes(S.shZoomClean(v))));
ok('a zoom step goes one rung and stops at the ends', S.shZoomStep(1, 1) === 1.2 && S.shZoomStep(1, -1) === 0.85 && S.shZoomStep(2.2, 1) === 2.2 && S.shZoomStep(0.7, -1) === 0.7);
ok('walking up the whole ladder visits every rung once', (() => { let z = S.SH_ZOOMS[0]; const seen = [z]; for (let i = 0; i < 20; i++) { const n = S.shZoomStep(z, 1); if (n === z) break; seen.push(n); z = n; } return JSON.stringify(seen) === JSON.stringify(S.SH_ZOOMS); })());
ok('a paper is one of the known ones, else A4; names from the object prototype are not papers', S.shPaperClean('letter') === 'letter' && S.shPaperClean('book') === 'book' && ['__proto__', 'constructor', 'toString', 'nope', 3, null, undefined].every((p) => S.shPaperClean(p) === 'a4'));

/* geometry */
{
  let bad = null; let count = 0;
  for (const w of [0, NaN, 200, 280, 320, 360, 390, 414, 600, 640, 768, 820, 1024, 1280, 1440, 1920, 2560, 3840]) for (const zoom of S.SH_ZOOMS) for (const paper of Object.keys(S.SH_PAPER)) {
    const g = S.shGeometry(w, { zoom, paper }); count++;
    const ints = ['sheetW', 'sheetH', 'padX', 'padY', 'colW', 'H', 'colGap', 'stride'].every((k) => Number.isInteger(g[k]));
    const ratio = Math.abs(g.sheetH / g.sheetW - S.SH_PAPER[paper][1]) < 0.01; const text = g.colW > 0 && g.H > 0 && g.colW + 2 * g.padX === g.sheetW && g.H + 2 * g.padY === g.sheetH;
    const stride = g.stride === g.sheetH + S.SH_GAP; const readable = g.colW >= 120;
    if (!(ints && ratio && text && stride && readable)) bad = bad || { w, zoom, paper, g };
  }
  ok(`all ${count} sheet sizes are whole pixels, in proportion, with a readable text area and the gap in the stride`, !bad, bad);
  const a = S.shGeometry(1440, { zoom: 1, paper: 'a4' }); ok('on a wide screen a sheet stops at its widest and is not stretched to the screen', a.sheetW === 820 && a.sheetH === Math.round(820 * 1.414), a);
  const b = S.shGeometry(390, { zoom: 1, paper: 'a4' }); ok('on a phone the sheet fills the screen less a gutter at each side', b.sheetW === 390 - 2 * b.gut && b.gut === 10, b);
  ok('a phone sheet has narrower margins than a desktop one, as a share of the sheet', S.shGeometry(390).padX / S.shGeometry(390).sheetW < S.shGeometry(1000).padX / S.shGeometry(1000).sheetW && S.shGeometry(390).colW / S.shGeometry(390).sheetW > 0.85);
  ok('zooming in makes a sheet bigger and zooming out smaller', S.shGeometry(1200, { zoom: 1.5 }).sheetW > S.shGeometry(1200, { zoom: 1 }).sheetW && S.shGeometry(1200, { zoom: 0.7 }).sheetW < S.shGeometry(1200, { zoom: 1 }).sheetW);
  ok('no option at all gives a usable sheet', (() => { const g = S.shGeometry(1000); return g.zoom === 1 && g.sheetW > 0 && g.sheetH > g.sheetW; })());
  ok('a book sheet is taller than a letter sheet, which is shorter than an A4 sheet', S.shGeometry(900, { paper: 'book' }).sheetH > S.shGeometry(900, { paper: 'a4' }).sheetH && S.shGeometry(900, { paper: 'letter' }).sheetH < S.shGeometry(900, { paper: 'a4' }).sheetH);
}

/* how much goes on a sheet */
{
  const g = S.shGeometry(1000, { zoom: 1 }); const c18 = S.shCharsPerSheet(g, 18); const c24 = S.shCharsPerSheet(g, 24);
  ok('a sheet holds a believable amount of text, and bigger type holds less', c18 > 1200 && c18 < 5000 && c24 < c18, [c18, c24]);
  ok('rubbish type sizes still give a positive guess', [NaN, 0, -3, 'x', undefined].every((f) => S.shCharsPerSheet(g, f) >= 200));
  ok('a section has at least one sheet; a measured count wins over the guess', S.shSheets(0, 2000) === 1 && S.shSheets(4001, 2000) === 3 && S.shSheets(4001, 2000, 7) === 7 && S.shSheets(NaN, 0) === 1);
  ok('what one measured section teaches moves the guess a little, and an odd one is ignored', S.shLearn(2000, 3000, 1) === Math.round(2000 * 0.7 + 3000 * 0.3) && S.shLearn(2000, 10, 5) === 2000 && S.shLearn(2000, 0, 5) === 2000 && S.shLearn(2000, 9e6, 3) === 2000 && S.shLearn(2000, 5000, 0) === 2000);
  let c = 2000; for (let i = 0; i < 40; i++) c = S.shLearn(c, 3000, 1);
  ok('repeated measures settle on what the sheets really hold', Math.abs(c - 3000) < 5, c);
}

/* the sheet numbers: cumulative counts and the section a sheet is in */
{
  const counts = [3, 1, 4, 0, 2, 5]; const cum = S.shCum(counts);
  ok('the first sheet of each section adds up, and an empty section still takes one', JSON.stringify(cum) === JSON.stringify([0, 3, 4, 8, 9, 11, 16]));
  let bad = null; const total = cum[cum.length - 1];
  for (let g = 0; g < total; g++) { const { k, i } = S.shAt(cum, g); if (!(cum[k] + i === g && i >= 0 && k >= 0 && k < counts.length && cum[k] <= g && g < cum[k + 1])) { bad = bad || { g, k, i }; } }
  ok(`every one of the ${total} sheets is in exactly one section, at the right place in it`, !bad, bad);
  ok('a sheet past either end is held inside the text', S.shAt(cum, -5).k === 0 && S.shAt(cum, -5).i === 0 && S.shAt(cum, 999).k === 5 && S.shAt(cum, 999).i === 4 && S.shAt(cum, NaN).k === 0 && S.shAt([0], 3).k === 0);
  ok('a text of one section is one place', JSON.stringify(S.shAt(S.shCum([4]), 3)) === JSON.stringify({ k: 0, i: 3 }));
  // a large text: 30,000 sections, found fast
  const big = S.shCum(new Array(30000).fill(2)); const t0 = Date.now(); let okBig = true; for (let g = 0; g < 60000; g += 7) { const r = S.shAt(big, g); if (big[r.k] + r.i !== g) okBig = false; }
  ok('a text of 30,000 sections is searched in a blink and never wrong', okBig && Date.now() - t0 < 500, Date.now() - t0);
}

/* which sections stay drawn */
{
  ok('the window is the section and one each side, held inside the text', JSON.stringify(S.shWindow(5, 20, 1)) === '[4,5,6]' && JSON.stringify(S.shWindow(0, 20, 1)) === '[0,1]' && JSON.stringify(S.shWindow(19, 20, 1)) === '[18,19]' && JSON.stringify(S.shWindow(0, 1, 1)) === '[0]');
  ok('a window of none is the section itself, and rubbish is held in the text', JSON.stringify(S.shWindow(3, 9, 0)) === '[3]' && S.shWindow(-4, 9, 1).every((x) => x >= 0 && x < 9) && S.shWindow(99, 9, 1).every((x) => x >= 0 && x < 9) && S.shWindow(2, 0, 1).length <= 1);
}

/* which sheets are filled */
{
  const g = S.shGeometry(1000, { zoom: 1 }); const top = 16; const st = g.stride;
  ok('a screen at the top of a section needs its first sheet, and nothing past the screen', JSON.stringify(S.shVisible(top, 10, g, 0, 600, 0)) === '[0]');
  ok('scrolling brings the next sheet in once its top is on the screen', S.shVisible(top, 10, g, st, 600, 0).join() === '1' && S.shVisible(top, 10, g, st - 100, 600, 0).join() === '0,1');
  ok('a reach fills sheets a little before they are seen', S.shVisible(top, 10, g, 0, 600, st).join() === '0,1' && S.shVisible(top, 10, g, 3 * st, 600, st).join() === '2,3,4');
  ok('a screen above or below the section needs no sheet', S.shVisible(top + 5 * st, 3, g, 0, 600, 0).length === 0 && S.shVisible(top, 3, g, 20 * st, 600, 0).length === 0 && S.shVisible(top, 0, g, 0, 600, 0).length === 0);
  ok('a tall screen fills several sheets, in order, once each, none past the last', (() => { const v = S.shVisible(top, 4, g, 0, 5 * st, 0); return v.join() === '0,1,2,3'; })());
  ok('the sheet being read is the one the top third of the screen is on', S.shReading(0, 900, g, top) === 0 && S.shReading(st, 900, g, top) === 1 && S.shReading(st * 2 + 400, 900, g, top) === 2 && S.shReading(-300, 900, g, top) === 0);
}

/* keys */
{
  const key = (k, mods = {}) => S.shKey(Object.assign({ key: k, shiftKey: false, ctrlKey: false, altKey: false, metaKey: false }, mods));
  ok('space and page down go on, shift-space and page up go back', key(' ') === 'next' && key('PageDown') === 'next' && key(' ', { shiftKey: true }) === 'prev' && key('PageUp') === 'prev');
  ok('home, end, brackets and g lead to the first, last, next section, previous section and the go-to box', key('Home') === 'first' && key('End') === 'last' && key(']') === 'nextSec' && key('[') === 'prevSec' && key('g') === 'goto');
  ok('control home and control end go to the very start and end', key('Home', { ctrlKey: true }) === 'start' && key('End', { ctrlKey: true }) === 'finish');
  ok('the arrows, letters and the browser’s own shortcuts are left alone', ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'a', 'f', 'Enter', 'Escape', 'Tab'].every((k) => key(k) === null) && key('c', { ctrlKey: true }) === null && key('f', { metaKey: true }) === null && key('PageDown', { altKey: true }) === null && key('g', { shiftKey: true }) === null && key('ArrowDown', { ctrlKey: true }) === null);
  ok('no event at all is no key', S.shKey(null) === null && S.shKey(undefined) === null);
}

/* the page number as it is typed */
{
  ok('a typed page is a number from 1 to the last, with a hash or spaces allowed', S.shParsePage('12', 40) === 12 && S.shParsePage(' #7 ', 40) === 7 && S.shParsePage('40', 40) === 40 && S.shParsePage('1', 40) === 1);
  ok('a typed page that is not a page is nothing at all', ['0', '41', '-3', '1.5', '1e3', 'abc', '', ' ', '12abc', '<b>', '１２', '9999999', null, undefined, {}, [], '١٢'].every((s) => S.shParsePage(s, 40) === null));
  ok('a text of no sheets still has a first page', S.shParsePage('1', 0) === 1 && S.shParsePage('2', 0) === null);
}

console.log(`sheets: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
