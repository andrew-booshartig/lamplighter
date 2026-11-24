// Run: node tests/stats.test.js   — compares src/js/10-stats.js and sha256 against independent references (tests/refs.py, node:crypto)
const assert = require('node:assert');
const crypto = require('node:crypto');
const Stats = require('../src/js/10-stats.js');
const { sha256 } = require('../src/js/00-util.js');

let pass = 0, fail = 0;
function near(name, got, want, tol = 1e-6) {
  const ok = Math.abs(got - want) <= tol * Math.max(1, Math.abs(want));
  if (ok) pass++; else { fail++; console.log(`FAIL ${name}: got ${got}, want ${want}`); }
}
function eq(name, got, want) { try { assert.deepStrictEqual(got, want); pass++; } catch (e) { fail++; console.log(`FAIL ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); } }

// t distribution
near('tTwoP(4.2426,4)', Stats.tTwoP(4.242640687, 4), 0.013235599564944689, 1e-7);
near('tTwoP(2,10)', Stats.tTwoP(2.0, 10), 0.07338803477074496, 1e-7);
near('tTwoP(.5,3)', Stats.tTwoP(0.5, 3), 0.651447964848159, 1e-7);
near('tQ(.975,4)', Stats.tQuantile(0.975, 4), 2.7764451051978014, 1e-7);
near('tQ(.975,10)', Stats.tQuantile(0.975, 10), 2.228138851986313, 1e-7);
near('tQ(.975,29)', Stats.tQuantile(0.975, 29), 2.0452296421328064, 1e-7);
// normal
near('normQ(.975)', Stats.normQuantile(0.975), 1.9599639845400534, 1e-9);
near('normCDF(1.3)', Stats.normCDF(1.3), 0.9031995154143897, 1e-12);
near('normCDF(-2.5)', Stats.normCDF(-2.5), 0.006209665325776159, 1e-10);
// binomial
near('P(X>=10|20,.25)', Stats.binomUpper(10, 20, 0.25), 0.01386441694376117, 1e-9);
near('P(X>=30|100,.25)', Stats.binomUpper(30, 100, 0.25), 0.14954104656657347, 1e-9);
near('2sided(10|20,.25)', Stats.binomTwoSided(10, 20, 0.25), 0.017035628882695164, 1e-9);
near('2sided(3|25,.2)', Stats.binomTwoSided(3, 25, 0.2), 0.45395792867412427, 1e-9);
near('2sided(60|100,.5)', Stats.binomTwoSided(60, 100, 0.5), 0.05688793364098078, 1e-9);
eq('nForBinom', Stats.nForBinom(0.25, 0.40), 57);
// one-sample t (paired differences 1..5)
const t1 = Stats.oneSampleT([1, 2, 3, 4, 5]);
near('t1.t', t1.t, 4.242640687119285, 1e-9); near('t1.p', t1.p, 0.013235599564944689, 1e-7); near('t1.dz', t1.dz, 3 / Math.sqrt(2.5), 1e-9);
near('t1.ci.lo', t1.ci[0], 3 - 2.7764451051978014 * Math.sqrt(2.5 / 5), 1e-7);
// Welch
const w = Stats.welch([5.1, 4.9, 5.6, 5.8, 6.0, 5.5, 5.3], [4.5, 4.8, 5.0, 4.2, 4.9, 5.1]);
near('welch.t', w.t, 3.5126412800148885, 1e-9); near('welch.df', w.df, 10.985019525479457, 1e-9); near('welch.p', w.p, 0.004870766530123749, 1e-6);
// Wilcoxon
near('wilcoxon [1..5]', Stats.wilcoxon([1, 2, 3, 4, 5]).p, 0.0625, 1e-12);
near('wilcoxon [1,-2,3,4,5]', Stats.wilcoxon([1, -2, 3, 4, 5]).p, 0.1875, 1e-12);
near('wilcoxon ties', Stats.wilcoxon([2, 2, -1, 3, 3, 3, -4, 5]).p, 0.1796875, 1e-12);
near('wilcoxon 10', Stats.wilcoxon([0.5, -0.2, 1.1, 0.9, -0.4, 0.7, 1.3, 0.2, 0.6, -0.1]).p, 0.041015625, 1e-12);
eq('wilcoxon zero-drop', Stats.wilcoxon([0, 0, 1, 2, 3, 4, 5]).n, 5);
// Spearman
const sp = Stats.spearman([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [1, 3, 2, 5, 4, 7, 6, 9, 8, 10]);
near('spearman r', sp.r, 0.9515151515151515, 1e-12); near('spearman p', sp.p, 2.2798549183189465e-05, 1e-5);
// d-prime, Holm
near('dprime', Stats.dprime(8, 2, 1, 9), 1.8446621568568151, 1e-9);
const hp = Stats.holm([0.01, 0.04, 0.03]); near('holm0', hp[0], 0.03); near('holm1', hp[1], 0.06); near('holm2', hp[2], 0.06);
// basics
near('median', Stats.median([5, 1, 3, 2]), 2.5); near('sd', Stats.sd([2, 4, 4, 4, 5, 5, 7, 9]), Math.sqrt(32 / 7), 1e-12);
near('quantile', Stats.quantile([1, 2, 3, 4], 0.25), 1.75);
const wl = Stats.wilson(8, 20); near('wilson lo', wl[0], 0.2188, 1e-3); near('wilson hi', wl[1], 0.6134, 1e-3);
// SHA-256
for (const s of ['abc', 'beatlab:12345:salt', 'x'.repeat(1000), '', 'é☃ unicode', 'a'.repeat(55), 'a'.repeat(56), 'a'.repeat(64)]) eq('sha256 ' + s.slice(0, 12), sha256(s), crypto.createHash('sha256').update(s).digest('hex'));

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
