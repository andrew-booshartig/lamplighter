/* ═══════════════════════════ 2z · Drawing core for the Image page: star patterns, a mandala plan, a temple grid, four early Buddhist signs ═══════════════════════════
   Pure geometry and SVG text: no DOM, no files, no pictures from anywhere. Everything on the Image page that is a picture is drawn here by the app from a rule, so there is nothing to license and nothing
   that belongs to a living tradition’s restricted material. The drawings show how a thing is made, not a particular monument:
   • Star patterns: the “polygons in contact” method (E. H. Hankin, 1925; later set out by others). Take a tiling, mark the middle of each edge, draw two lines inward from each mark at the same angle to the edge,
     and stop each line where it meets a line from the next edge. A modern way to analyse and draw the patterns, not a claim about how any craftsman worked.
   • Mandala plan: only the architecture that many Tibetan Buddhist mandalas share (a palace with four gates inside rings of lotus, vajra and fire). The centre is left empty on purpose.
   • Temple grid: the square grids of 8 × 8 and 9 × 9 cells that Sanskrit building texts lay out under a temple, with the central cells that belong to Brahma.
   • Four early Buddhist signs: wheel, empty seat under a tree, footprints, mound. Plain diagrams, not copies of any carving.
   Colours come from CSS classes (im-*), so the drawings follow the light and dark themes. */
const IM_RAD = Math.PI / 180;
const imR2 = (n) => Math.round(n * 100) / 100;
const imPol = (cx, cy, r, deg) => [imR2(cx + r * Math.cos(deg * IM_RAD)), imR2(cy + r * Math.sin(deg * IM_RAD))];
const imRot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];

/* ── tilings: every polygon is listed counter-clockwise (interior on the left of each edge); edge length 1 ── */
const IM_TILINGS = [
  { id: 'square', name: 'Squares', dflt: 60, min: 12, max: 78, view: [0.5, 0.5, 6, 6], note: 'One shape: the square.' },
  { id: 'hex', name: 'Hexagons', dflt: 60, min: 12, max: 78, view: [1, 0.6, 6, 5.2], note: 'One shape: the regular hexagon.' },
  { id: 'tri', name: 'Triangles', dflt: 60, min: 12, max: 78, view: [1.4, 0.6, 6, 5.2], note: 'One shape: the equilateral triangle.' },
  { id: 'oct', name: 'Octagons and squares', dflt: 67, min: 12, max: 78, view: [-0.6, -0.6, 7.3, 7.3], note: 'Two shapes: the octagon and the small square between four of them.' },
];
const IM_TILING_BY_ID = Object.fromEntries(IM_TILINGS.map((t) => [t.id, t]));
function imPolys(id) {
  const out = []; const reg = (cx, cy, n, r, a0) => { const p = []; for (let k = 0; k < n; k++) { const a = (a0 + (360 / n) * k) * IM_RAD; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return p; };
  if (id === 'square') { for (let i = -1; i < 9; i++) for (let j = -1; j < 9; j++) out.push([[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]]); }
  else if (id === 'hex') { for (let i = -2; i < 8; i++) for (let j = -2; j < 7; j++) out.push(reg(1.5 * i, Math.sqrt(3) * (j + (((i % 2) + 2) % 2) / 2), 6, 1, 0)); }
  else if (id === 'tri') { const h = Math.sqrt(3) / 2; for (let j = -1; j < 8; j++) for (let i = -8; i < 9; i++) { const o = j / 2; out.push([[i + o, j * h], [i + 1 + o, j * h], [i + 0.5 + o, (j + 1) * h]]); out.push([[i + 1 + o, j * h], [i + 1.5 + o, (j + 1) * h], [i + 0.5 + o, (j + 1) * h]]); } }
  else if (id === 'oct') { const p = 1 + Math.SQRT2; const R = 1 / (2 * Math.sin(Math.PI / 8)); for (let i = -1; i < 4; i++) for (let j = -1; j < 4; j++) { out.push(reg(i * p, j * p, 8, R, 22.5)); out.push(reg((i + 0.5) * p, (j + 0.5) * p, 4, Math.SQRT1_2, 0)); } }
  return out;
}
/* ── “polygons in contact”: for one polygon, the lines that start at each edge’s midpoint and stop where they meet the neighbour edge’s line ── */
function imHankinPoly(poly, thetaDeg) {
  const th = thetaDeg * IM_RAD; const n = poly.length; const mids = []; const dirA = []; const dirB = [];
  for (let i = 0; i < n; i++) {
    const a = poly[i]; const b = poly[(i + 1) % n]; const e = [b[0] - a[0], b[1] - a[1]]; const L = Math.hypot(e[0], e[1]); const u = [e[0] / L, e[1] / L];
    mids.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); dirA.push(imRot(u, th)); dirB.push(imRot([-u[0], -u[1]], -th));
  }
  const segs = []; const rays = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n; const p = mids[i]; const q = mids[j]; const d = dirA[i]; const f = dirB[j]; const cr = d[0] * f[1] - d[1] * f[0]; const w = [q[0] - p[0], q[1] - p[1]];
    const L = Math.hypot(w[0], w[1]);
    if (Math.abs(cr) < 1e-9) {
      /* the two lines are parallel: if they are the same line, join the two midpoints; if not, they never meet */
      const same = Math.abs(w[0] * d[1] - w[1] * d[0]) < 1e-7 && w[0] * d[0] + w[1] * d[1] > 0;
      if (same) { segs.push([p[0], p[1], q[0], q[1]]); rays.push([p[0], p[1], q[0], q[1]]); } else { rays.push([p[0], p[1], p[0] + d[0] * L * 0.5, p[1] + d[1] * L * 0.5]); rays.push([q[0], q[1], q[0] + f[0] * L * 0.5, q[1] + f[1] * L * 0.5]); }
      continue;
    }
    const t = (w[0] * f[1] - w[1] * f[0]) / cr; const s = (w[0] * d[1] - w[1] * d[0]) / cr;
    if (t > 1e-9 && s > 1e-9) { const x = [p[0] + d[0] * t, p[1] + d[1] * t]; segs.push([p[0], p[1], x[0], x[1]]); segs.push([q[0], q[1], x[0], x[1]]); rays.push([p[0], p[1], p[0] + d[0] * t * 1.35, p[1] + d[1] * t * 1.35]); rays.push([q[0], q[1], q[0] + f[0] * s * 1.35, q[1] + f[1] * s * 1.35]); }
    else { rays.push([p[0], p[1], p[0] + d[0] * L * 0.5, p[1] + d[1] * L * 0.5]); rays.push([q[0], q[1], q[0] + f[0] * L * 0.5, q[1] + f[1] * L * 0.5]); }
  }
  return { mids, segs, rays };
}
/* the whole pattern for a tiling at an angle: edges (without repeats), midpoints, rays, and the finished segments */
function imHankin(tilingId, thetaDeg) {
  const t = IM_TILING_BY_ID[tilingId] || IM_TILINGS[0]; const theta = Math.max(t.min, Math.min(t.max, +thetaDeg || t.dflt)); const polys = imPolys(t.id);
  const edges = new Map(); const mids = new Map(); const segs = []; const rays = []; const key = (a, b) => [a, b].map((v) => v.map((x) => Math.round(x * 500)).join(',')).sort().join('|');
  for (const poly of polys) {
    const n = poly.length; for (let i = 0; i < n; i++) { const a = poly[i]; const b = poly[(i + 1) % n]; const k = key(a, b); if (!edges.has(k)) edges.set(k, [a[0], a[1], b[0], b[1]]); }
    const h = imHankinPoly(poly, theta); h.mids.forEach((m) => mids.set(m.map((x) => Math.round(x * 500)).join(','), m)); segs.push(...h.segs); rays.push(...h.rays);
  }
  return { tiling: t, theta, edges: [...edges.values()], mids: [...mids.values()], rays, segs, polygons: polys.length };
}
const IM_STAR_STEPS = [
  'Start with a tiling: a floor made of one kind of regular shape, or two. There is no pattern yet.',
  'Mark the middle of every edge of every tile.',
  'From each mark, draw two lines inward, each at the same angle to the edge. Change the angle and the whole picture changes.',
  'Stop each line where it meets a line coming from the next edge. These stopping points are the whole trick.',
  'Take the floor away and draw what is left as bands. That is the pattern.',
];
function imStarSVG(o) {
  o = o || {}; const step = Math.max(1, Math.min(IM_STAR_STEPS.length, o.step | 0 || 5)); const h = imHankin(o.tiling || 'oct', o.theta); const v = h.tiling.view; const f = (n) => imR2(n);
  const L = (a, c, w) => `<line class="${c}" x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(a[2])}" y2="${f(a[3])}"${w ? ` stroke-width="${w}"` : ''}/>`;
  const edges = h.edges.map((e) => L(e, step >= 4 ? 'im-m' : 'im-t')).join(''); let body = '';
  if (step <= 3) body += edges; else if (step === 4) body += `<g opacity=".35">${edges}</g>`;
  if (step >= 2 && step <= 3) body += h.mids.map((m) => `<circle class="im-fa" cx="${f(m[0])}" cy="${f(m[1])}" r=".05"/>`).join('');
  if (step === 3) body += h.rays.map((r) => L(r, 'im-a im-dash')).join('');
  if (step === 4) body += h.segs.map((s) => L(s, 'im-a', '.045')).join('');
  if (step >= 5) body += `<g stroke-linecap="round">${h.segs.map((s) => L(s, 'im-band', '.15')).join('')}${h.segs.map((s) => L(s, 'im-core', '.075')).join('')}</g>`;
  const label = `${h.tiling.name}, lines at ${Math.round(h.theta)} degrees: step ${step} of ${IM_STAR_STEPS.length}. ${IM_STAR_STEPS[step - 1]}`;
  return `<svg class="im-svg" viewBox="${v.join(' ')}" role="img" aria-label="${label}"><rect class="im-bg" x="${v[0]}" y="${v[1]}" width="${v[2]}" height="${v[3]}"/><g fill="none" stroke-width=".025">${body}</g></svg>`;
}

/* ── a generic mandala plan: only the architecture many Tibetan Buddhist mandalas share; the centre is empty on purpose ── */
const IM_MANDALA_STEPS = [
  'The palace: a square plan, seen from above, with a point at its centre.',
  'Four gates, one on the middle of each side, drawn as a porch with a crossbar. The palace faces all four directions.',
  'Diagonals from the corners divide the palace into four quarters, and a circle is drawn around the centre. In a real mandala this is where figures are placed; here it is left empty, because placing them is the work of a teacher and a rite, and differs from mandala to mandala.',
  'A ring of lotus petals around the palace: the palace stands on a lotus.',
  'A ring of crossed vajras (diamond-like thunderbolt sceptres, drawn here as plain crosses) round the lotus.',
  'The outermost ring: fire, drawn as a ring of flames. Many mandalas have more rings than these, and they differ in their order.',
];
function imMandalaSVG(step) {
  step = Math.max(1, Math.min(IM_MANDALA_STEPS.length, step | 0 || IM_MANDALA_STEPS.length)); const c = 200; const f = imR2; const P = (r, a) => imPol(c, c, r, a); const h = 70; let g = '';
  if (step >= 6) { const pts = []; for (let k = 0; k < 48; k++) pts.push(P(k % 2 ? 195 : 180, k * 7.5)); g += `<polygon class="im-t" fill="none" points="${pts.map((p) => p.join(',')).join(' ')}"/><circle class="im-m" cx="${c}" cy="${c}" r="178" fill="none"/>`; }
  if (step >= 5) { g += `<circle class="im-m" cx="${c}" cy="${c}" r="176" fill="none"/><circle class="im-m" cx="${c}" cy="${c}" r="156" fill="none"/>`; for (let k = 0; k < 16; k++) { const a = k * 22.5; const p = P(166, a); const q1 = P(166 + 7, a); const q2 = P(166 - 7, a); const t1 = imPol(p[0], p[1], 7, a + 90); const t2 = imPol(p[0], p[1], -7, a + 90); g += `<path class="im-t" fill="none" d="M${q1.join(' ')}L${q2.join(' ')}M${t1.join(' ')}L${t2.join(' ')}"/><circle class="im-fa" cx="${p[0]}" cy="${p[1]}" r="2"/>`; } }
  if (step >= 4) { g += `<circle class="im-m" cx="${c}" cy="${c}" r="152" fill="none"/>`; for (let k = 0; k < 16; k++) { const a = k * 22.5; g += `<path class="im-t im-fp" d="M${P(112, a - 8).join(' ')}Q${P(138, a - 13).join(' ')} ${P(150, a).join(' ')}Q${P(138, a + 13).join(' ')} ${P(112, a + 8).join(' ')}Z"/>`; } }
  if (step >= 3) { g += `<line class="im-t" x1="${c - h}" y1="${c - h}" x2="${c + h}" y2="${c + h}"/><line class="im-t" x1="${c + h}" y1="${c - h}" x2="${c - h}" y2="${c + h}"/><circle class="im-a im-bgfill" cx="${c}" cy="${c}" r="34" stroke-width="1.5"/>`; }
  g += `<rect class="im-t" x="${c - h}" y="${c - h}" width="${h * 2}" height="${h * 2}" fill="none" stroke-width="1.8"/>`;
  if (step >= 2) { for (let k = 0; k < 4; k++) { g += `<g transform="rotate(${k * 90} ${c} ${c})"><rect class="im-t" x="${c - 17}" y="${c - h - 17}" width="34" height="17" fill="none"/><rect class="im-t" x="${c - 26}" y="${c - h - 24}" width="52" height="7" fill="none"/></g>`; } }
  g += `<circle class="im-fa" cx="${c}" cy="${c}" r="3"/>`;
  return `<svg class="im-svg" viewBox="0 0 400 400" role="img" aria-label="A generic mandala plan, step ${step} of ${IM_MANDALA_STEPS.length}. ${IM_MANDALA_STEPS[step - 1]}"><rect class="im-bg" x="0" y="0" width="400" height="400"/><g stroke-width="1.2" stroke-linejoin="round">${g}</g></svg>`;
}

/* ── the temple grid: 8 × 8 or 9 × 9 cells; the centre belongs to Brahma ── */
const IM_GRID_STEPS = [
  'A square: the plot, laid out with the directions.',
  'The square is divided the same number of times each way. With 8 divisions there are 64 cells, with 9 there are 81.',
  'The cells at the centre are the seat of Brahma. The sanctuary that holds the god’s image is placed here, over the middle of the plan.',
  'The cells along the edge are the outer ring, where the texts place the powers of the directions. A plan like this is a diagram of the whole world, folded into the floor of one building.',
];
function imGridSVG(n, step) {
  n = n === 9 ? 9 : 8; step = Math.max(1, Math.min(IM_GRID_STEPS.length, step | 0 || IM_GRID_STEPS.length)); const s = 300 / n; const o = 30; const k = n === 9 ? 3 : 2; const c0 = (n - k) / 2; let g = '';
  if (step >= 4) { for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i === 0 || j === 0 || i === n - 1 || j === n - 1) g += `<rect class="im-fa" opacity=".16" x="${imR2(o + i * s)}" y="${imR2(o + j * s)}" width="${imR2(s)}" height="${imR2(s)}"/>`; }
  if (step >= 3) g += `<rect class="im-fa" opacity=".5" x="${imR2(o + c0 * s)}" y="${imR2(o + c0 * s)}" width="${imR2(k * s)}" height="${imR2(k * s)}"/>`;
  if (step >= 2) for (let i = 1; i < n; i++) g += `<line class="im-m" x1="${imR2(o + i * s)}" y1="${o}" x2="${imR2(o + i * s)}" y2="${o + 300}"/><line class="im-m" x1="${o}" y1="${imR2(o + i * s)}" x2="${o + 300}" y2="${imR2(o + i * s)}"/>`;
  g += `<rect class="im-t" x="${o}" y="${o}" width="300" height="300" fill="none" stroke-width="2"/>`;
  return `<svg class="im-svg" viewBox="0 0 360 360" role="img" aria-label="A temple plan grid of ${n} by ${n} cells, step ${step} of ${IM_GRID_STEPS.length}. ${IM_GRID_STEPS[step - 1]}"><rect class="im-bg" x="0" y="0" width="360" height="360"/><g stroke-width="1">${g}</g></svg>`;
}

/* ── four early Buddhist signs, as plain diagrams ── */
const IM_SIGNS = [['wheel', 'The wheel of the teaching'], ['throne', 'An empty seat under a tree'], ['feet', 'Footprints'], ['stupa', 'A mound over relics']];
function imSign(name) {
  let g = '';
  if (name === 'wheel') { g = '<circle class="im-t" cx="40" cy="40" r="31" fill="none"/><circle class="im-t" cx="40" cy="40" r="6" fill="none"/>'; for (let k = 0; k < 8; k++) { const a = imPol(40, 40, 6, k * 45); const b = imPol(40, 40, 31, k * 45); g += `<line class="im-t" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`; } }
  else if (name === 'throne') g = '<circle class="im-t" cx="30" cy="26" r="12" fill="none"/><circle class="im-t" cx="50" cy="26" r="12" fill="none"/><circle class="im-t" cx="40" cy="17" r="13" fill="none"/><line class="im-t" x1="40" y1="30" x2="40" y2="54"/><rect class="im-t" x="20" y="54" width="40" height="9" fill="none"/><line class="im-t" x1="24" y1="63" x2="24" y2="70"/><line class="im-t" x1="56" y1="63" x2="56" y2="70"/>';
  else if (name === 'feet') { for (const x of [27, 53]) { g += `<ellipse class="im-t" cx="${x}" cy="46" rx="11" ry="22" fill="none"/><circle class="im-t" cx="${x}" cy="46" r="5" fill="none"/>`; for (let k = 0; k < 5; k++) g += `<circle class="im-t" cx="${x - 8 + k * 4}" cy="${16 + Math.abs(k - 2) * 1.6}" r="1.8" fill="none"/>`; } }
  else if (name === 'stupa') g = '<rect class="im-t" x="12" y="62" width="56" height="7" fill="none"/><path class="im-t" fill="none" d="M18 62A22 22 0 0 1 62 62Z"/><rect class="im-t" x="34" y="32" width="12" height="9" fill="none"/><line class="im-t" x1="40" y1="32" x2="40" y2="8"/><line class="im-t" x1="31" y1="16" x2="49" y2="16"/><line class="im-t" x1="33" y1="21" x2="47" y2="21"/><line class="im-t" x1="35" y1="26" x2="45" y2="26"/>';
  else return '';
  const cap = (IM_SIGNS.find((s) => s[0] === name) || [])[1] || name;
  return `<svg class="im-sign" viewBox="0 0 80 80" role="img" aria-label="${cap}, drawn as a plain diagram"><g stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${g}</g></svg>`;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { IM_TILINGS, IM_TILING_BY_ID, imPolys, imHankinPoly, imHankin, IM_STAR_STEPS, imStarSVG, IM_MANDALA_STEPS, imMandalaSVG, IM_GRID_STEPS, imGridSVG, IM_SIGNS, imSign };
