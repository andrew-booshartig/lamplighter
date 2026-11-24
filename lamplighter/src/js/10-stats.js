/* ═══════════════════════════ 10 · statistics ═══════════════════════════
   Pure functions (no DOM). Cross-checked against reference values in tests/stats.test.js */
const Stats = (() => {
  const sum = (a) => a.reduce((s, x) => s + x, 0);
  const mean = (a) => (a.length ? sum(a) / a.length : NaN);
  const variance = (a) => { if (a.length < 2) return NaN; const m = mean(a); return sum(a.map((x) => (x - m) ** 2)) / (a.length - 1); };
  const sd = (a) => Math.sqrt(variance(a));
  const median = (a) => { if (!a.length) return NaN; const s = a.slice().sort((x, y) => x - y); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  const quantile = (a, q) => { if (!a.length) return NaN; const s = a.slice().sort((x, y) => x - y); const pos = (s.length - 1) * q; const lo = Math.floor(pos); const hi = Math.ceil(pos); return s[lo] + (s[hi] - s[lo]) * (pos - lo); };
  const min = (a) => Math.min(...a); const max = (a) => Math.max(...a);

  /* ── special functions ── */
  function lgamma(x) {
    const g = 7;
    const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
    x -= 1; let a = c[0]; const t = x + g + 0.5;
    for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
  function betacf(a, b, x) {
    const MAXIT = 400, EPS = 3e-15, FPMIN = 1e-300;
    const qab = a + b, qap = a + 1, qam = a - 1;
    let c = 1, d = 1 - (qab * x) / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d; let hh = d;
    for (let m = 1; m <= MAXIT; m++) {
      const m2 = 2 * m;
      let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; hh *= d * c;
      aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; const del = d * c; hh *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return hh;
  }
  /* regularized incomplete beta I_x(a,b) */
  function betai(a, b, x) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
  }
  /* regularized lower incomplete gamma P(a,x) */
  function gammaP(a, x) {
    if (x <= 0) return 0;
    if (x < a + 1) {
      let ap = a, s = 1 / a, del = s;
      for (let n = 0; n < 1000; n++) { ap += 1; del *= x / ap; s += del; if (Math.abs(del) < Math.abs(s) * 1e-16) break; }
      return s * Math.exp(-x + a * Math.log(x) - lgamma(a));
    }
    let b = x + 1 - a, c = 1 / 1e-300, d = 1 / b, hh = d;
    for (let i = 1; i < 1000; i++) {
      const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
      c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
      d = 1 / d; const del = d * c; hh *= del; if (Math.abs(del - 1) < 1e-16) break;
    }
    return 1 - Math.exp(-x + a * Math.log(x) - lgamma(a)) * hh;
  }
  const normCDF = (z) => { const p = gammaP(0.5, (z * z) / 2); return z >= 0 ? 0.5 * (1 + p) : 0.5 * (1 - p); };
  function normQuantile(p) {
    if (p <= 0) return -Infinity; if (p >= 1) return Infinity;
    let lo = -40, hi = 40;
    for (let i = 0; i < 100; i++) { const mid = (lo + hi) / 2; if (normCDF(mid) < p) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }
  function tCDF(t, df) { const x = df / (df + t * t); const p = 0.5 * betai(df / 2, 0.5, x); return t > 0 ? 1 - p : p; }
  const tTwoP = (t, df) => betai(df / 2, 0.5, df / (df + t * t));
  function tQuantile(p, df) {
    let lo = -1e4, hi = 1e4;
    for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (tCDF(mid, df) < p) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }

  /* ── binomial ── */
  const logChoose = (n, k) => lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1);
  function binomPMF(k, n, p) {
    if (k < 0 || k > n) return 0; if (p <= 0) return k === 0 ? 1 : 0; if (p >= 1) return k === n ? 1 : 0;
    return Math.exp(logChoose(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
  }
  const binomUpper = (k, n, p) => (k <= 0 ? 1 : k > n ? 0 : betai(k, n - k + 1, p)); /* P(X ≥ k) */
  const binomLower = (k, n, p) => (k < 0 ? 0 : k >= n ? 1 : 1 - binomUpper(k + 1, n, p)); /* P(X ≤ k) */
  function binomTwoSided(k, n, p) { /* "minimum likelihood" two-sided exact p */
    const pk = binomPMF(k, n, p); let s = 0;
    for (let i = 0; i <= n; i++) { const pi = binomPMF(i, n, p); if (pi <= pk * (1 + 1e-7)) s += pi; }
    return Math.min(1, s);
  }
  function wilson(k, n, z = 1.96) {
    if (!n) return [NaN, NaN];
    const p = k / n; const den = 1 + (z * z) / n; const c = (p + (z * z) / (2 * n)) / den;
    const hw = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / den;
    return [c - hw, c + hw];
  }
  function nForBinom(p0, p1, alpha = 0.05, power = 0.8) { /* one-sided trials needed to detect p1 vs chance p0 */
    const za = normQuantile(1 - alpha), zb = normQuantile(power);
    return Math.ceil(Math.pow((za * Math.sqrt(p0 * (1 - p0)) + zb * Math.sqrt(p1 * (1 - p1))) / (p1 - p0), 2));
  }

  /* ── t-tests ── */
  function oneSampleT(d, mu0 = 0) {
    const n = d.length; const m = mean(d); const s = sd(d);
    if (n < 2) return { n, mean: m, sd: NaN, se: NaN, t: NaN, df: n - 1, p: NaN, ci: [NaN, NaN], dz: NaN };
    const se = s / Math.sqrt(n); const df = n - 1;
    if (s === 0) return { n, mean: m, sd: 0, se: 0, t: m === mu0 ? 0 : Infinity, df, p: m === mu0 ? 1 : 0, ci: [m, m], dz: m === mu0 ? 0 : Infinity };
    const t = (m - mu0) / se; const tc = tQuantile(0.975, df);
    return { n, mean: m, sd: s, se, t, df, p: tTwoP(t, df), ci: [m - tc * se, m + tc * se], dz: (m - mu0) / s };
  }
  function welch(a, b) {
    const na = a.length, nb = b.length; const ma = mean(a), mb = mean(b); const va = variance(a), vb = variance(b);
    const se2 = va / na + vb / nb; const se = Math.sqrt(se2); const t = (ma - mb) / se;
    const df = (se2 * se2) / ((va / na) ** 2 / (na - 1) + (vb / nb) ** 2 / (nb - 1));
    const tc = tQuantile(0.975, df); const sp = Math.sqrt(((na - 1) * va + (nb - 1) * vb) / (na + nb - 2));
    return { na, nb, ma, mb, diff: ma - mb, se, t, df, p: tTwoP(t, df), ci: [ma - mb - tc * se, ma - mb + tc * se], d: (ma - mb) / sp };
  }
  const minDetectableDz = (n, alpha = 0.05, power = 0.8) => (n < 3 ? NaN : (tQuantile(1 - alpha / 2, n - 1) + tQuantile(power, n - 1)) / Math.sqrt(n));

  /* ── rank-based ── */
  function rankAvg(a) {
    const n = a.length; const idx = a.map((v, i) => i).sort((i, j) => a[i] - a[j]); const r = new Array(n); let i = 0; let tie = 0;
    while (i < n) { let j = i; while (j + 1 < n && a[idx[j + 1]] === a[idx[i]]) j++; const rk = (i + j) / 2 + 1; for (let k = i; k <= j; k++) r[idx[k]] = rk; const t = j - i + 1; tie += t * t * t - t; i = j + 1; }
    return { r, tie };
  }
  function wilcoxon(d) { /* signed-rank, exact permutation p (incl. ties) for n ≤ 25, normal approx beyond */
    const x = d.filter((v) => v !== 0); const n = x.length;
    if (n === 0) return { n: 0, p: 1, W: 0, exact: true };
    const { r: rank, tie } = rankAvg(x.map(Math.abs));
    const Wp = sum(x.map((v, i) => (v > 0 ? rank[i] : 0)));
    const total = (n * (n + 1)) / 2; const mu = total / 2;
    if (n <= 25) {
      const r2 = rank.map((r) => Math.round(r * 2)); const S = sum(r2); const dp = new Float64Array(S + 1); dp[0] = 1;
      for (const r of r2) for (let s = S; s >= r; s--) dp[s] += dp[s - r];
      const w2 = Math.round(Wp * 2); const mu2 = S / 2; let tail = 0;
      for (let s = 0; s <= S; s++) if (Math.abs(s - mu2) >= Math.abs(w2 - mu2) - 1e-9) tail += dp[s];
      return { n, W: Wp, p: Math.min(1, tail / Math.pow(2, n)), exact: true };
    }
    const varW = (n * (n + 1) * (2 * n + 1)) / 24 - tie / 48;
    const z = (Math.abs(Wp - mu) - 0.5) / Math.sqrt(varW);
    return { n, W: Wp, p: Math.min(1, 2 * (1 - normCDF(Math.max(0, z)))), exact: false };
  }
  function pearson(x, y) {
    const n = x.length; const mx = mean(x), my = mean(y); let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; }
    return sxx && syy ? sxy / Math.sqrt(sxx * syy) : NaN;
  }
  function spearman(x, y) {
    const n = x.length; if (n < 4) return { n, r: NaN, p: NaN };
    const r = pearson(rankAvg(x).r, rankAvg(y).r); if (!isFinite(r)) return { n, r: NaN, p: NaN };
    if (Math.abs(r) >= 1) return { n, r, p: 0 };
    const t = r * Math.sqrt((n - 2) / (1 - r * r));
    return { n, r, p: tTwoP(t, n - 2) };
  }
  function holm(ps) {
    const m = ps.length; const order = ps.map((p, i) => [p, i]).sort((a, b) => a[0] - b[0]); const adj = new Array(m); let prev = 0;
    order.forEach(([p, i], k) => { prev = Math.max(prev, Math.min(1, (m - k) * p)); adj[i] = prev; });
    return adj;
  }
  function dprime(H, M, FA, CR) {
    const hr = (H + 0.5) / (H + M + 1), far = (FA + 0.5) / (FA + CR + 1);
    return normQuantile(hr) - normQuantile(far);
  }
  const movingAvg = (a, w = 3) => a.map((_, i) => { const s = a.slice(Math.max(0, i - w + 1), i + 1).filter(isFinite); return s.length ? mean(s) : NaN; });

  return { sum, mean, variance, sd, median, quantile, min, max, lgamma, betai, gammaP, normCDF, normQuantile, tCDF, tTwoP, tQuantile,
    binomPMF, binomUpper, binomLower, binomTwoSided, wilson, nForBinom, oneSampleT, welch, minDetectableDz, wilcoxon, rankAvg, pearson, spearman, holm, dprime, movingAvg };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Stats;
