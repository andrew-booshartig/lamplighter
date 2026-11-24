/* Tap targets, second round (AA-17 of ALPHA_AUDIT.md, 21 November 2026). The first round (tests/tap.test.js) gave every control a 40 px area by padding or an invisible ::after; hit-tested in the pane at 375 px, seven pages still had
   controls under 40 px because neighbours took the area: the family tree (rows 28 px apart), Step by step (lists of links), the World chart (bars 24 px apart), the High-control groups' sources, the Text catalogue's rows, the
   Random filters and the Calendars' reference lists. Here: the World chart on a phone, and the style sheet's block for the lists. (The tree's rows are in tests/tree.test.js.) No browser is needed.
   Run: node tests/tap-second.test.js */
const fs = require('fs'); const path = require('path');
const { render } = require('./_harness');
const css = fs.readFileSync(path.join(__dirname, '../src/css/app.css'), 'utf8'); const plain = css.replace(/\/\*[\s\S]*?\*\//g, '');
let pass = 0; let fail = 0; const ok = (n, c, x) => { if (c) pass++; else { fail++; console.log('FAIL', n, x === undefined ? '' : JSON.stringify(x).slice(0, 400)); } };
const count = (h, re) => (h.match(re) || []).length;

/* ── the World chart on a phone ── */
const mouse = render(['world'], {}).body; global.matchMedia = (q) => ({ matches: /pointer:coarse|max-width:760px/.test(q) }); const touch = render(['world'], {}).body; delete global.matchMedia;
const bars = (h) => (h.match(/<rect class="wbar" x="[\d.]+" y="[\d.]+" width="[\d.]+" height="\d+"/g) || []).map((s) => { const m = s.match(/x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="(\d+)"/); return { x: +m[1], y: +m[2], w: +m[3], h: +m[4] }; });
const hits = (h) => (h.match(/<rect class="whit" x="[\d.]+" y="[\d.]+" width="[\d.]+" height="\d+"/g) || []).map((s) => { const m = s.match(/x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="(\d+)"/); return { x: +m[1], y: +m[2], w: +m[3], h: +m[4] }; });
const bm = bars(mouse); const bt = bars(touch); const ht = hits(touch);
ok('with a mouse the chart is as before: 20 px bars 24 px apart and no hit rectangle', bm.length > 100 && count(mouse, /class="whit"/g) === 0 && bm.every((b) => b.h === 20), [bm.length, bm[0]]);
ok('on a touch screen or a phone every bar has a hit rectangle, the bars are 28 px high, and the same bars are drawn', bt.length === bm.length && ht.length === bt.length && bt.every((b) => b.h === 28), [bt.length, bm.length, ht.length]);
ok('each hit rectangle is 40 px high (the bar and a gap of 12) and at least 40 px wide, and holds its bar', ht.every((r, i) => r.h === 40 && r.w >= 39.9 && r.x <= bt[i].x + 0.06 && r.x + r.w >= bt[i].x + bt[i].w - 0.06 && r.y <= bt[i].y && r.y + r.h >= bt[i].y + bt[i].h), ht.filter((r, i) => !(r.h === 40 && r.w >= 39.9)).slice(0, 3));
const overlap = []; { const byRow = {}; ht.forEach((r) => { (byRow[r.y] = byRow[r.y] || []).push(r); }); Object.values(byRow).forEach((row) => { row.sort((a, b) => a.x - b.x); for (let i = 1; i < row.length; i++) if (row[i].x < row[i - 1].x + row[i - 1].w - 0.06) overlap.push([row[i - 1], row[i]]); }); }
ok('no two hit rectangles in one row of a lane overlap (a short bar is given room at its sides, and the next bar in the row starts after that room)', overlap.length === 0, overlap.slice(0, 2));
ok('the chart is taller on a phone (more rows are needed once the bars have room), and the numbers in the bars stay in the middle of them', /height="(\d+)"/.test(touch) && +touch.match(/<svg viewBox="0 0 [\d.]+ (\d+)"/)[1] > +mouse.match(/<svg viewBox="0 0 [\d.]+ (\d+)"/)[1] && (touch.match(/class="wnum" x="[\d.]+" y="([\d.]+)"/) || [])[1] - bt[0].y === 18);

/* ── the lists of links and the other rules of the block ── */
const at = plain.indexOf('/* ═══ AA-17') >= 0 ? plain.indexOf('@media (pointer:coarse),(max-width:760px){', plain.indexOf('.cite-link::after') + 10) : plain.indexOf('@media (pointer:coarse),(max-width:760px){', plain.length - 4000);
const blockText = (() => { const s = plain.lastIndexOf('@media (pointer:coarse),(max-width:760px){'); let d = 0; for (let j = plain.indexOf('{', s); j < plain.length; j++) { if (plain[j] === '{') d++; else if (plain[j] === '}') { d--; if (d === 0) return plain.slice(s, j + 1); } } return ''; })();
ok('the block for the second round is inside the same query as the first (a coarse pointer or under 760 px), so a mouse on a wide window is not touched', blockText.includes('.ch-bg li>a') && blockText.includes('.tr-canvas{padding-bottom:8px}'));
ok('a link with text on its line (a source at the end of a citation, a title followed by its dates, a name and its description) is an inline-block 40 px high: 11 px above and below its line', /\.ch-bg li>a,\.ch-src li>a,\.mov-src li>div>a,\.mov-yard p>a,\.atl-text \.small>a\{display:inline-block;max-width:100%;padding-block:11px\}/.test(blockText));
ok('a source with a label, a link and a note is a two-column grid: the label and the link side by side (the link 40 px high), the note under the link', /\.sk-src li,\.ch-world li\{display:grid;grid-template-columns:auto minmax\(0,1fr\)/.test(blockText) && /\.sk-src li>a,\.ch-world li>a\{grid-column:2;grid-row:1;justify-self:start;padding-block:11px\}/.test(blockText) && /\.sk-src li>\.muted,\.ch-world li>\.muted\{grid-column:2;grid-row:2\}/.test(blockText));
ok('the two links at the top of a help card and the link in the Random hint are padded 10 and 12 px above and below', /\.mov-help-top>a\{padding-block:10px\}/.test(blockText) && /\.psgx-hint>a\{padding-block:12px\}/.test(blockText));
ok('the step-by-step strip: the track is 40 px, its dots have a 40 px area (9 px beyond the circle: the ::after starts inside the 2 px border) and a chain name is 40 px high', /\.ch-track\{height:40px\}/.test(blockText) && /\.ch-dot::after\{content:"";position:absolute;inset:-11px\}/.test(blockText) && /\.ch-node\{padding-block:0;min-height:40px\} \.ch-nm\{padding-block:9px\}/.test(blockText));
ok('every selector of the block names a class that a source draws (nothing in the block is left over from a name that was changed)', ['ch-bg', 'ch-src', 'mov-src', 'mov-yard', 'atl-text', 'mov-help-top', 'psgx-hint', 'sk-src', 'ch-world', 'ch-track', 'ch-dot', 'ch-node', 'ch-nm', 'tr-canvas'].every((c) => fs.readdirSync(path.join(__dirname, '../src/js')).some((f) => f.endsWith('.js') && fs.readFileSync(path.join(__dirname, '../src/js', f), 'utf8').includes(c))));

console.log(`tap, second round: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
