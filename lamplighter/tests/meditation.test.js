// Run: node tests/meditation.test.js — checks the guidance scripts and the breath pacer (pure functions)
global.REFS = {};
const { buildCues, pacerAt, PACERS, PLAN, PRACTICES } = require('../src/js/23-data-meditation.js');
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra); } };
const words = (s) => s.split(/\s+/).length;

for (const p of PRACTICES) for (const m of p.mins) {
  const T = Math.round(m * 60); const cues = buildCues(p.id, m); const tag = `${p.id}/${m}min`;
  ok(tag + ' has cues', cues.length >= 3, cues.length);
  ok(tag + ' sorted & inside session', cues.every((c, i) => c.t >= 0 && c.t < T - 1 && (i === 0 || c.t > cues[i - 1].t)));
  ok(tag + ' room to speak every cue', cues.every((c, i) => i === cues.length - 1 || cues[i + 1].t - c.t >= Math.ceil(words(c.text) / 2.0) + 2), JSON.stringify(cues.filter((c, i) => i < cues.length - 1 && cues[i + 1].t - c.t < Math.ceil(words(c.text) / 2.0) + 2).map((c) => c.t)));
  ok(tag + ' starts early', cues[0].t <= 10, cues[0].t);
  if (p.id !== 'ground') ok(tag + ' closes the sit near the end', cues[cues.length - 1].t >= T - 80 && /open your eyes|Notice how you feel|come up slowly|return to normal/i.test(cues[cues.length - 1].text), cues[cues.length - 1].t + ' of ' + T + ': ' + cues[cues.length - 1].text);
  ok(tag + ' no runaway prompts (silence matters)', cues.length <= 8 + T / 40, cues.length);
}
// long sits are quiet: ≥ 20 min sits get a prompt at most every ~100 s on average after the first 3 minutes
{ const c = buildCues('breath', 30); const mid = c.filter((x) => x.t > 180 && x.t < 1700); ok('30-min breath sit is mostly silent', mid.length <= 14, mid.length); }
// pacer
for (const [k, pat] of Object.entries(PACERS)) {
  const cyc = pat.steps.reduce((a, s) => a + s.dur, 0);
  const a = pacerAt(pat, 0), b = pacerAt(pat, cyc), c = pacerAt(pat, 3 * cyc + 0.01);
  ok(k + ' periodic', Math.abs(a.r - b.r) < 1e-9 && Math.abs(pacerAt(pat, 0.01).r - c.r) < 0.02);
  let mn = 9, mx = 0, maxStep = 0, prev = pacerAt(pat, 0).r; for (let t = 0; t < cyc; t += 0.05) { const r = pacerAt(pat, t).r; mn = Math.min(mn, r); mx = Math.max(mx, r); maxStep = Math.max(maxStep, Math.abs(r - prev)); prev = r; }
  ok(k + ' radius range 0.25…1', mn >= 0.249 && mx <= 1.001 && mx > 0.99 && mn < 0.27, mn + ' ' + mx);
  ok(k + ' smooth (no jumps)', maxStep < 0.06, maxStep);
  ok(k + ' slow enough to be gentle (≤ 7 breaths/min)', a.bpm <= 7.5, a.bpm);
}
ok('slow pacer is 5.45 breaths/min', Math.abs(pacerAt(PACERS.slow, 0).bpm - 60 / 11) < 1e-9);
ok('plan has 14 steps and only known practices', PLAN.length === 14 && PLAN.every((s) => PRACTICES.some((p) => p.id === s.practice)));
ok('plan builds up gradually', PLAN.every((s, i) => i === 0 || s.min >= PLAN[i - 1].min || s.min >= 5));
ok('every plan step length is offered by its practice (or scalable)', PLAN.every((s) => s.min >= 3));
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
