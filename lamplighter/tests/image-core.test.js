/* The drawing core of the Image page (src/js/2z-image-core.js): the tilings really tile the plane, the star pattern is built by the stated rule and has the symmetry the rule gives it, each step adds what it says,
   the mandala plan, the temple grid and the four signs have the parts their captions name, and every drawing is made only of plain shapes (no pictures, no text, no figure). Run: node tests/image-core.test.js */
const fs = require('fs'); const path = require('path');
const C = require('../src/js/2z-image-core.js');
let pass = 0; let fail = 0; const ok = (n, c, x) => { if (c) pass++; else { fail++; console.log('FAIL', n, x === undefined ? '' : JSON.stringify(x).slice(0, 400)); } };
const area = (p) => { let a = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i][0] * q[1] - q[0] * p[i][1]; } return a / 2; };
const inside = (p, x, y) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > y) !== (p[j][1] > y) && x < ((p[j][0] - p[i][0]) * (y - p[i][1])) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; return c; };
const count = (s, re) => (s.match(re) || []).length;

ok('there are four tilings with an id, a name, a default angle inside the allowed range and a view window', C.IM_TILINGS.length === 4 && C.IM_TILINGS.every((t) => t.id && t.name && t.dflt >= t.min && t.dflt <= t.max && t.view.length === 4 && t.note));
for (const t of C.IM_TILINGS) {
  const P = C.imPolys(t.id);
  ok(`${t.id}: every tile is counter-clockwise and every edge is one unit long`, P.every((p) => area(p) > 0 && p.every((v, i) => Math.abs(Math.hypot(p[(i + 1) % p.length][0] - v[0], p[(i + 1) % p.length][1] - v[1]) - 1) < 1e-9)));
  const [vx, vy, vw, vh] = t.view; let bad = 0; let n = 0;
  for (let i = 0; i < 24; i++) for (let j = 0; j < 24; j++) { const x = vx + ((i + 0.37) / 24) * vw; const y = vy + ((j + 0.61) / 24) * vh; const c = P.filter((p) => inside(p, x, y)).length; n++; if (c !== 1) bad++; }
  ok(`${t.id}: the tiles cover the whole view window, each point in exactly one tile (no gaps, no overlaps)`, bad === 0, { bad, n });
}
ok('the octagon tiling is made of octagons and squares in the ratio one octagon to one square, and the hexagon tiling of hexagons only', (() => { const o = C.imPolys('oct'); return o.filter((p) => p.length === 8).length === o.filter((p) => p.length === 4).length && C.imPolys('hex').every((p) => p.length === 6) && C.imPolys('tri').every((p) => p.length === 3); })());

/* the rule: each tile gets two lines at every edge’s midpoint, at the stated angle to the edge */
const sq = [[0, 0], [1, 0], [1, 1], [0, 1]]; const h60 = C.imHankinPoly(sq, 60);
ok('a unit square at 60 degrees: four midpoints, eight lines (two from each corner region), all of positive finite length', h60.mids.length === 4 && h60.segs.length === 8 && h60.segs.every((s) => s.every(Number.isFinite) && Math.hypot(s[2] - s[0], s[3] - s[1]) > 1e-6));
ok('every line of the square at 60 degrees makes 60 degrees (or 120) with the edge it starts from', h60.segs.every(([x1, y1, x2, y2], i) => { const ang = Math.atan2(Math.abs(y2 - y1), Math.abs(x2 - x1)) * 180 / Math.PI; return [30, 60].some((a) => Math.abs(ang - a) < 1e-6); }), h60.segs);
ok('at 45 degrees the lines of a square lie on one another, and the two midpoints are joined into a diamond of four lines', (() => { const h = C.imHankinPoly(sq, 45); return h.segs.length === 4 && h.segs.every((s) => Math.abs(Math.hypot(s[2] - s[0], s[3] - s[1]) - Math.SQRT1_2) < 1e-9); })());
ok('a line that cannot meet its neighbour is not drawn (a very small angle in a square leaves gaps, never a wrong line)', (() => { const h = C.imHankinPoly(sq, 5); return h.segs.every((s) => s.every(Number.isFinite)); })());

/* the whole pattern, and its symmetry: the tilings are mirror-symmetric about the vertical line through the centre of a tile, and the rule is too */
const key = (s) => [[s[0], s[1]], [s[2], s[3]]].map((p) => p.map((v) => Math.round(v * 1000) / 1000 + 0).join(',')).sort().join('>');
for (const [id, th, lim] of [['oct', 67, 3.2], ['hex', 60, 3], ['square', 60, 1.0001], ['oct', 45, 3.2]]) {
  const h = C.imHankin(id, th); const near = h.segs.filter((s) => s.every((v) => Math.abs(v) < lim)); const set = new Set(near.map(key));
  const mirrored = near.map((s) => [-s[0], s[1], -s[2], s[3]]); const lost = mirrored.filter((m) => !set.has(key(m)));
  ok(`${id} at ${th}: the pattern is its own mirror image about the vertical axis through a tile’s centre (${near.length} lines near the centre)`, near.length > 20 && lost.length === 0, lost.slice(0, 2));
}
ok('the angle is kept inside the allowed range, an unknown tiling falls back to squares, and a missing angle uses the default', C.imHankin('oct', 5).theta === 12 && C.imHankin('oct', 99).theta === 78 && C.imHankin('zzz', 60).tiling.id === 'square' && C.imHankin('hex').theta === 60);
ok('the whole pattern has the pieces each step shows: edges without repeats, midpoints, rays and finished lines, all finite', C.IM_TILINGS.every((t) => { const h = C.imHankin(t.id); return h.edges.length > 20 && h.mids.length === h.edges.length && h.rays.length >= h.segs.length / 2 && h.segs.length > 50 && [...h.edges, ...h.rays, ...h.segs].every((s) => s.every(Number.isFinite)); }));

/* the five steps */
const st = (n, tiling = 'oct') => C.imStarSVG({ tiling, theta: 67, step: n });
ok('there are five steps, each with a sentence of its own', C.IM_STAR_STEPS.length === 5 && new Set(C.IM_STAR_STEPS).size === 5 && C.IM_STAR_STEPS.every((s) => s.length > 30));
ok('step 1 has the tiling only: no marks, no rays, no pattern', count(st(1), /class="im-t"/g) > 20 && count(st(1), /im-fa/g) === 0 && count(st(1), /im-dash/g) === 0 && count(st(1), /im-band/g) === 0);
ok('step 2 adds the midpoints, as dots', count(st(2), /<circle class="im-fa"/g) > 20 && count(st(2), /im-dash/g) === 0);
ok('step 3 adds the rays as dashed lines', count(st(3), /im-dash/g) > 20 && count(st(3), /<circle class="im-fa"/g) > 20);
ok('step 4 has the finished lines over a faint tiling, and no dashes', count(st(4), /class="im-a"/g) > 20 && /opacity=".35"/.test(st(4)) && count(st(4), /im-dash/g) === 0);
ok('step 5 is the pattern alone, drawn as bands: a wide stroke with a narrow one on top, and no tiling lines left', count(st(5), /class="im-band"/g) > 20 && count(st(5), /class="im-band"/g) === count(st(5), /class="im-core"/g) && count(st(5), /class="im-t"/g) === 0 && count(st(5), /class="im-m"/g) === 0);
ok('a step outside the range is held inside it, and no step given means the finished pattern', count(C.imStarSVG({ tiling: 'oct', step: 99 }), /class="im-band"/g) > 20 && /step 1 of 5/.test(C.imStarSVG({ tiling: 'oct', step: -3, theta: 67 })) && /step 5 of 5/.test(C.imStarSVG({})));
ok('each drawing says in words what it shows, for a screen reader: the tiling, the angle, the step and the sentence', /^<svg [^>]*role="img" aria-label="Octagons and squares, lines at 67 degrees: step 3 of 5\. From each mark/.test(st(3)));
ok('every tiling draws at every step with no stray values in the markup', C.IM_TILINGS.every((t) => [1, 2, 3, 4, 5].every((n) => { const s = C.imStarSVG({ tiling: t.id, step: n }); return !/NaN|undefined|Infinity/.test(s) && /^<svg/.test(s) && /<\/svg>$/.test(s); })));

/* the mandala plan */
const M = (n) => C.imMandalaSVG(n);
ok('the mandala plan has six steps, each with a sentence, and the third says why the centre is empty', C.IM_MANDALA_STEPS.length === 6 && C.IM_MANDALA_STEPS.every((s) => s.length > 30) && /left empty/.test(C.IM_MANDALA_STEPS[2]) && /teacher and a rite/.test(C.IM_MANDALA_STEPS[2]));
ok('step 1 is a square palace and a point; step 2 adds four gates; step 3 adds the diagonals and an empty circle', count(M(1), /<rect class="im-t"/g) === 1 && count(M(2), /rotate\(/g) === 4 && count(M(3), /<line class="im-t"/g) === 2 && count(M(3), /im-bgfill/g) === 1 && count(M(1), /rotate\(/g) === 0);
ok('step 4 adds sixteen lotus petals, step 5 sixteen crossed marks between two rings, step 6 a ring of flames of forty-eight points', count(M(4), /im-fp/g) === 16 && count(M(3), /im-fp/g) === 0 && count(M(5), /<path class="im-t" fill="none" d="M/g) === 16 && count(M(6), /<polygon/g) === 1 && /points="([^"]+)"/.exec(M(6))[1].split(' ').length === 48 && count(M(5), /<polygon/g) === 0);
ok('each step only adds: the picture is never shorter than the one before', [1, 2, 3, 4, 5].every((n) => M(n + 1).length > M(n).length));
ok('no figure is drawn at the centre of the mandala: at every step the only things near the centre are a circle and a point, and every petal and mark lies well outside it', [1, 2, 3, 4, 5, 6].every((n) => { const s = M(n); return !/<ellipse|<image|<text/.test(s) && (s.match(/<path[^>]* d="M([\d.\-]+) ([\d.\-]+)/g) || []).every((p) => { const m = /M([\d.\-]+) ([\d.\-]+)/.exec(p); return Math.hypot(+m[1] - 200, +m[2] - 200) > 100; }); }));

/* the temple grid */
const G = (n, s) => C.imGridSVG(n, s);
ok('the grid has four steps with a sentence each; 8 divisions give 64 cells and 9 give 81, and the centre is 2 × 2 and 3 × 3', C.IM_GRID_STEPS.length === 4 && /64 cells/.test(C.IM_GRID_STEPS[1]) && /81/.test(C.IM_GRID_STEPS[1]) && /seat of Brahma/.test(C.IM_GRID_STEPS[2]));
ok('step 2 draws the inner lines (n − 1 each way); step 3 marks the centre block (100 wide for 3 cells of 33.3, 75 wide for 2 cells of 37.5); step 4 marks the outer ring (4n − 4 cells)', count(G(9, 2), /class="im-m"/g) === 16 && count(G(8, 2), /class="im-m"/g) === 14 && /class="im-fa" opacity=".5"[^>]*width="100"/.test(G(9, 3)) && /class="im-fa" opacity=".5"[^>]*width="75"/.test(G(8, 3)) && count(G(9, 4), /opacity=".16"/g) === 32 && count(G(8, 4), /opacity=".16"/g) === 28 && count(G(9, 1), /<line/g) === 0);
ok('any size other than 9 is drawn as 8, and a missing step is the finished plan', /8 by 8 cells/.test(G(7, 4)) && /9 by 9 cells/.test(G(9)) && /step 4 of 4/.test(G(9)));

/* the four signs */
ok('there are four early Buddhist signs, each drawn with a caption for a screen reader, and an unknown name draws nothing', C.IM_SIGNS.map((s) => s[0]).join() === 'wheel,throne,feet,stupa' && C.IM_SIGNS.every(([k, cap]) => { const s = C.imSign(k); return /^<svg class="im-sign"/.test(s) && s.includes(`aria-label="${cap}, drawn as a plain diagram"`) && count(s, /<(circle|line|rect|path|ellipse)/g) >= 4; }) && C.imSign('god') === '');
ok('the wheel has eight spokes, the footprints are two soles with ten toes, the seat has a tree of three crowns', count(C.imSign('wheel'), /<line/g) === 8 && count(C.imSign('feet'), /<ellipse/g) === 2 && count(C.imSign('feet'), /<circle/g) === 12 && count(C.imSign('throne'), /<circle/g) === 3);

/* nothing but plain shapes, and nothing that could be a picture from somewhere */
const all = [];
for (const t of C.IM_TILINGS) for (let n = 1; n <= 5; n++) all.push(C.imStarSVG({ tiling: t.id, step: n }));
for (let n = 1; n <= 6; n++) all.push(C.imMandalaSVG(n)); for (const k of [8, 9]) for (let n = 1; n <= 4; n++) all.push(C.imGridSVG(k, n)); for (const [k] of C.IM_SIGNS) all.push(C.imSign(k));
const tags = new Set(); all.forEach((s) => (s.match(/<([a-z]+)[ >\/]/g) || []).forEach((t) => tags.add(t.slice(1, -1).replace(/[ >\/]/g, ''))));
ok('every drawing is made only of svg, rect, circle, line, path, polygon, ellipse and g: no image, text, link, script or style', [...tags].every((t) => ['svg', 'rect', 'circle', 'line', 'path', 'polygon', 'ellipse', 'g'].includes(t)), [...tags]);
ok('no drawing mentions an address, a file or an embedded picture (not even the svg namespace address: inline svg does not need it)', all.every((s) => !/https?:|\.(png|jpe?g|gif|webp|svg)\b|data:|xlink|href|<image|<use|<script|<style|<foreignObject|url\(/i.test(s)));
const src = fs.readFileSync(path.join(__dirname, '../src/js/2z-image-core.js'), 'utf8');
ok('the core is pure: no document, window, fetch, storage or timers', !/\b(document|window|fetch|localStorage|sessionStorage|setTimeout|setInterval|XMLHttpRequest|Image\()\b/.test(src.replace(/\/\*[\s\S]*?\*\//g, '')));
console.log(`image core: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
