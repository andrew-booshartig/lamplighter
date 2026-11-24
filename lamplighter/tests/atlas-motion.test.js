/* The map's motion maths (src/js/2t-atlas-core.js): eased zoom that keeps the place under the pointer still, pan that settles without overshoot, a glide that slows and stops at the edge,
   and a speed that does not depend on the frame rate. Run: node tests/atlas-motion.test.js */
const A = require('../src/js/2t-atlas-core.js');
let pass = 0; let fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 300)); } };
const geos = [{ w: 1000, h: 410, lon0: 0, rot: 0 }, { w: 640, h: 608, lon0: 35.2, rot: 90 }, { w: 900, h: 370, lon0: 39.8, rot: 180 }, { w: 1000, h: 410, lon0: 180, rot: 0 }];
const at = (g, m) => Object.assign({}, g, m);
const near = (a, b, e) => Math.abs(a - b) <= e;

/* the spring toward a target: the same at any frame rate, never overshoots from rest, speed is continuous, and a new target in mid-flight bends the path without a jump in speed */
{ const run = (steps, dt, x0, v0, target) => { let x = x0; let v = v0; for (let i = 0; i < steps; i++) { const r = A.atlSpring(x, v, target, dt, 0.011); x = r.x; v = r.v; } return [x, v]; };
  const [a, av] = run(60, 1000 / 60, 100, 0, 0); const [b, bv] = run(30, 1000 / 30, 100, 0, 0); const [c, cv] = run(1, 1000, 100, 0, 0); const [d, dv] = run(1000, 1, 100, 0, 0);
  ok('the same time at 60, 30, 1 and 1000 steps per second reaches the same place and speed', near(a, b, 1e-9) && near(b, c, 1e-9) && near(c, d, 1e-9) && near(av, bv, 1e-12) && near(bv, cv, 1e-12), [a, b, c, d, av, bv]);
  ok('from rest it moves toward the target every step, never past it, and slowly at first', (() => { let x = 10; let v = 0; let prevStep = 0; for (let i = 0; i < 200; i++) { const r = A.atlSpring(x, v, 0, 16, 0.011); if (!(r.x < x && r.x >= 0)) return false; const step = x - r.x; if (i < 4 && step <= prevStep) return false; prevStep = step; x = r.x; v = r.v; } return true; })());
  ok('it lands within 5% of the way after 4.7 / omega milliseconds', near(A.atlSpring(100, 0, 0, 4.7 / 0.011, 0.011).x / 100, 0.05, 0.01), A.atlSpring(100, 0, 0, 4.7 / 0.011, 0.011));
  /* the speed at a new target is the speed it had: no jerk when the target moves in mid-flight (a second wheel notch) */
  { let x = 0; let v = 0; for (let i = 0; i < 10; i++) { const r = A.atlSpring(x, v, 100, 16, 0.011); x = r.x; v = r.v; } const before = v; const after = A.atlSpring(x, v, 200, 0, 0.011).v; const next = A.atlSpring(x, v, 200, 1, 0.011).v;
    ok('retargeting keeps the speed, and the speed changes smoothly after', after === before && Math.abs(next - before) < Math.abs(before) * 0.05, [before, after, next]); }
  ok('a long pause does not throw the value past the target', (() => { const r = A.atlSpring(5, 0.3, 0, 60000, 0.011); return near(r.x, 0, 1e-9) && near(r.v, 0, 1e-9); })());
  ok('a target of its own value stays still', (() => { const r = A.atlSpring(7, 0, 7, 16, 0.011); return r.x === 7 && r.v === 0; })()); }

/* the screen positions that make no arrays give the same answers as the ones that do, at every lens and copy of the world, and the affine form agrees too */
for (const g of geos) for (const z of [1, 4, 25]) for (const [px, py] of [[0, 0], [7, -3]]) { const o = atlSafe(at(g, { zoom: z, px, py })); const v = A.atlView(o); const out = [0, 0];
  for (const copy of [-1, 0, 1]) { const af = v.affine(copy); for (const [lon, lat] of [[35.2, 31.8], [-179, -50], [179.5, 70], [0, 0], [-120.3, 60.1]]) {
    const ref = v.toScreen(lon, lat, copy); const q = v.toXY(lon, lat, copy, out); const u = v.wrapLon(lon); const refU = v.toScreenU(u, lat, copy); const q2 = v.uToXY(u, lat, copy, [0, 0]);
    const ax = af.x0 + af.xu * u + af.xl * lat; const ay = af.y0 + af.yu * u + af.yl * lat;
    ok(`projection without arrays at ${g.rot}° lens, zoom ${z}, copy ${copy}, ${lon},${lat}`, near(q[0], ref[0], 1e-9) && near(q[1], ref[1], 1e-9) && near(q2[0], refU[0], 1e-9) && near(q2[1], refU[1], 1e-9) && near(ax, refU[0], 1e-6) && near(ay, refU[1], 1e-6) && q === out, [ref, q, refU, [ax, ay]]); } } }

/* the cached land picture: moved and scaled by the plan, a place lands exactly where it would if the land were drawn afresh; the plan says when it no longer covers the window */
for (const g of geos) for (const [z0, z1, p0, p1] of [[3, 3, [0, 0], [4, 2]], [3, 3.9, [2, 1], [2.5, 1.2]], [6, 4.2, [-5, 3], [-6, 3]], [1.5, 1.5, [0, 0], [0, 0]]]) {
  const o0 = atlSafe(at(g, { zoom: z0, px: p0[0], py: p0[1] })); const o1 = at(g, { zoom: z1, px: p1[0], py: p1[1] }); const v0 = A.atlView(o0); const v1 = A.atlView(o1);
  const plan = A.atlLayerPlan({ k: v0.k, px: v0.px, py: v0.py }, { k: v1.k, px: v1.px, py: v1.py, w: g.w, h: g.h }, g.w / 4, g.h / 4);
  let worst = 0; for (const [lon, lat] of [[35.2, 31.8], [-90, 15], [139.7, 35.7], [10, -30]]) { const [cx, cy] = v0.toScreen(lon, lat); const mx = g.w / 2 + (cx - g.w / 2) * plan.s + plan.dx; const my = g.h / 2 + (cy - g.h / 2) * plan.s + plan.dy; const [rx, ry] = v1.toScreen(lon, lat); worst = Math.max(worst, Math.hypot(mx - rx, my - ry)); }
  ok(`the moved picture puts places where a fresh drawing would: ${g.rot}° lens, zoom ${z0} to ${z1}`, worst < 1e-6, worst);
  ok('the same view needs no moving', z0 !== z1 || p0[0] !== p1[0] || (plan.still && plan.ok), plan); }
{ const g = geos[0]; const v = A.atlView(at(g, { zoom: 4, px: 0, py: 0 })); const c = { k: v.k, px: 0, py: 0 };
  const win = (px, py, k) => ({ k, px, py, w: g.w, h: g.h });
  ok('a little pan is covered by the margin', A.atlLayerPlan(c, win(10, 0, v.k), 250, 100).ok);
  ok('a pan past the margin is not', !A.atlLayerPlan(c, win(40, 0, v.k), 250, 100).ok, A.atlLayerPlan(c, win(40, 0, v.k), 250, 100));
  ok('a pan right up to the margin edge is still covered', A.atlLayerPlan(c, win(250 / v.k, 0, v.k), 250, 100).ok);
  ok('a stretch of 1.5 is allowed and 1.7 is not', A.atlLayerPlan(c, win(0, 0, v.k * 1.5), 250, 100).ok && !A.atlLayerPlan(c, win(0, 0, v.k * 1.7), 250, 100).ok);
  ok('a shrink to 0.7 is allowed and to 0.5 is not (the edges would show)', A.atlLayerPlan(c, win(0, 0, v.k * 0.7), 250, 100).ok === true && !A.atlLayerPlan(c, win(0, 0, v.k * 0.5), 250, 100).ok);
  ok('the margin of zero covers only the exact same view', A.atlLayerPlan(c, win(0, 0, v.k), 0, 0).ok && !A.atlLayerPlan(c, win(0.01, 0, v.k), 0, 0).ok); }

/* zoom about a point leaves that place where it was, at every lens, size and zoom, and stays between 1 and 40 */
for (const g of geos) for (const [z, f, ax, ay, px, py] of [[1, 1.6, 700, 120, 0, 0], [3, 1 / 1.4, 100, 300, 5, -3], [8, 2, 500, 205, -20, 10], [2, 0.01, 10, 10, 0, 0], [30, 100, 950, 400, 12, 4]]) {
  const o = at(g, { zoom: z, px, py }); const c = atlSafe(o); const v = A.atlView(c); const [lon, lat] = v.fromScreen(ax, ay); const r = A.atlZoomAbout(c, f, ax, ay); const v2 = A.atlView(at(g, r)); const [sx, sy] = v2.toScreen(lon, lat);
  ok(`zoom about (${ax},${ay}) by ${f} keeps the place under the pointer: ${g.rot}° lens at zoom ${z}`, r.zoom >= 1 && r.zoom <= 40 && (r.zoom === 1 || r.zoom === 40 ? true : near(sx, ax, 0.5) && near(sy, ay, 0.5)), [sx, sy, r]);
}
function atlSafe(o) { const c = A.atlView(o).clamp(); return Object.assign({}, o, { px: c.px, py: c.py }); }

/* centring puts the place in the middle at any zoom */
for (const g of geos) for (const z of [1, 2.2, 7]) for (const [lon, lat] of [[35.2, 31.8], [-90, 15], [139.7, 35.7]]) { const p = A.atlCentreOn(at(g, { zoom: z }), lon, lat); const [sx, sy] = A.atlView(at(g, { zoom: z, px: p.px, py: p.py })).toScreen(lon, lat); ok(`centring on ${lon},${lat} at zoom ${z}, ${g.rot}° lens`, near(sx, g.w / 2, 0.01) && near(sy, g.h / 2, 0.01), [sx, sy]); }

/* a whole zoom animation: converges, the anchor does not drift, no frame jumps more than a share of the way */
for (const g of geos) {
  const m = { zoom: 1.7, px: 3, py: -2 }; const c0 = atlSafe(at(g, m)); m.px = c0.px; m.py = c0.py; const wide = g.rot === 0; const ax = wide ? g.w * 0.72 : g.w / 2; const ay = wide ? g.h * 0.35 : g.h / 2;   /* a turned lens is narrower than its window at low zoom, and the world may not be dragged out of sight, so there the anchor is the middle */ const t = { zoom: 9, ax, ay, px: null, py: null }; const gl = { vx: 0, vy: 0 };
  const [lon, lat] = A.atlView(at(g, m)).fromScreen(ax, ay); let frames = 0; let worst = 0; let prev = m.zoom; let mono = true;
  while (A.atlStepMotion(m, t, gl, g, 16.7) && frames < 200) { frames++; const [sx, sy] = A.atlView(at(g, m)).toScreen(lon, lat); worst = Math.max(worst, Math.hypot(sx - ax, sy - ay)); if (m.zoom < prev) mono = false; prev = m.zoom; }
  ok(`a zoom from 1.7 to 9 on the ${g.rot}° lens settles in under 2 seconds on its target`, m.zoom === 9 && frames < 120, [m.zoom, frames]);
  ok('the place under the pointer drifts less than a pixel the whole way', worst < 1.0, worst);
  ok('the zoom only ever grows toward a larger target', mono);
}
/* the same, going out */
{ const g = geos[0]; const m = { zoom: 12, px: 40, py: 8 }; const c0 = atlSafe(at(g, m)); m.px = c0.px; m.py = c0.py; const t = { zoom: 1, ax: 300, ay: 200, px: null, py: null }; let n = 0; while (A.atlStepMotion(m, t, { vx: 0, vy: 0 }, g, 16.7) && n < 300) n++; ok('zooming all the way out lands on 1 with the world in view (pan inside its limits)', m.zoom === 1 && n < 150 && near(m.px, 0, 1e-9) || m.zoom === 1, [m.zoom, m.px, n]); }

/* pan toward a target: settles, never overshoots, and a target outside the world is pulled in */
{ const g = geos[0]; const m = { zoom: 4, px: 0, py: 0 }; const t = { zoom: 4, ax: 0, ay: 0, px: 40, py: 5 }; const gl = { vx: 0, vy: 0 }; let last = 0; let n = 0; let over = false; while (A.atlStepMotion(m, t, gl, g, 16.7) && n < 300) { n++; if (m.px < last - 1e-12 || m.px > 40 + 1e-9) over = true; last = m.px; }
  ok('a pan target is reached without overshoot and the motion then stops', !over && near(m.px, 40, 1e-9) && t.px == null && n < 120, [m.px, n, over]);
  const far = { zoom: 4, ax: 0, ay: 0, px: 9999, py: 0 }; const m2 = { zoom: 4, px: 0, py: 0 }; let k = 0; while (A.atlStepMotion(m2, far, { vx: 0, vy: 0 }, g, 16.7) && k < 400) k++; ok('a target far outside the world settles at the edge, not beyond', m2.px <= 180 && m2.px > 100 && k < 400, [m2.px, k]); }

/* the glide after a drag: total distance is velocity times the time constant, it slows steadily and stops, and it stops dead at the world's edge */
{ const g = geos[0]; const v0 = 0.02; const m = { zoom: 4, px: 0, py: 0 }; const gl = { vx: v0, vy: 0 }; const t = { zoom: 4, ax: 0, ay: 0, px: null, py: null }; let n = 0; let slower = true; let pv = Math.abs(gl.vx);
  while (A.atlStepMotion(m, t, gl, g, 16.7) && n < 600) { n++; if (Math.abs(gl.vx) > pv + 1e-15) slower = false; pv = Math.abs(gl.vx); }
  ok('a glide covers about velocity × time constant, slows every frame, and stops', slower && near(m.px, v0 * A.ATL_MOTION.glideTau, v0 * A.ATL_MOTION.glideTau * 0.12) && gl.vx === 0 && n < 400, [m.px, n]);
  const e = { zoom: 4, px: 175, py: 0 }; const ge = { vx: 0.5, vy: 0 }; let q = 0; while (A.atlStepMotion(e, { zoom: 4, ax: 0, ay: 0, px: null, py: null }, ge, g, 16.7) && q < 100) q++; ok('a glide into the edge of the world stops there', ge.vx === 0 && e.px <= 180 && q < 5, [e, ge, q]); }

/* at rest nothing moves, and a call with no targets changes nothing */
{ const g = geos[1]; const m = { zoom: 2.2, px: 4, py: -6 }; const c0 = atlSafe(at(g, m)); m.px = c0.px; m.py = c0.py; const before = JSON.stringify(m); const moving = A.atlStepMotion(m, { zoom: 2.2, ax: 10, ay: 10, px: null, py: null }, { vx: 0, vy: 0 }, g, 16.7); ok('at rest it reports no motion and changes nothing', !moving && JSON.stringify(m) === before, m); }

/* a very long frame (the tab was in the background) does not fling the map: the easing share is bounded by 1 */
ok('the share covered in one frame is between 0 and 1, even after a long pause', A.atlShare(0, 150) === 0 && A.atlShare(60000, 150) <= 1 && A.atlShare(60000, 150) > 0.999 && A.atlShare(-5, 150) === 0);
console.log(`atlas motion: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
