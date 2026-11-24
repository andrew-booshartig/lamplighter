#!/usr/bin/env node
/* Which books in the similar index are translations or editions of one another? Within each Library group, a sample of passages from every book is matched against the passages of the other books of
   that group (by the index's own meaning-space coordinates); a pair is listed when many of one book's sampled passages have their best match in the other with a cosine of at least TAU.
   Translations differ in wording, so run it with a TAU of 0.75 or even 0.65 as well as the default 0.85. The pairs it lists are candidates to read, not verdicts: books about one subject, or one inside
   another (a sutta and the Nikaya that holds it), come up too. The books to leave out of the index are written by hand in tools/similar_skip.json (id → why), which build_similar.js reads.
   Usage:  node tools/similar_dups.js [index-folder (default ../similar)] [passages sampled per book (50)] [TAU (0.85)]      Read-only: nothing is written. */
'use strict';
const fs = require('fs'); const vm = require('vm'); const path = require('path');
const C = require('../src/js/2w-similar-core.js'); const LIB = require('../src/js/24-data-path-lib.js');
const ROOT = path.resolve(__dirname, '..', '..');
const DIR = path.resolve(process.argv[2] || path.join(ROOT, 'similar')); const SAMPLE = +(process.argv[3] || 50); const TAU = +(process.argv[4] || 0.85);
globalThis.BEATLAB_TEXTS = { meta: {}, data: {}, add(id, meta, secs) { this.data[id] = { meta, secs }; }, addIndex(o) { Object.assign(this.meta, o); } };
for (const n of ['index', 'terms', 'chunks', 'chunks-2', 'chunks-3', 'chunks-4']) if (fs.existsSync(path.join(DIR, n + '.js'))) vm.runInThisContext(fs.readFileSync(path.join(DIR, n + '.js'), 'utf8'));
const P = C.simPrepare(BEATLAB_SIM.data); const K = P.K; const N = P.N;
const group = (ti) => { const l = LIB.LIB_BY_ID[P.texts[ti]]; return l ? l.group : '?'; };
const byText = new Map(); for (let i = 0; i < N; i++) { const t = P.text[i]; if (!byText.has(t)) byText.set(t, []); byText.get(t).push(i); }
const byGroup = new Map(); for (const [t] of byText) { const g = group(t); if (!byGroup.has(g)) byGroup.set(g, []); byGroup.get(g).push(t); }
const pairs = [];
for (const [g, texts] of byGroup) {
  if (texts.length < 2) continue; const pool = []; for (const t of texts) for (const r of byText.get(t)) pool.push(r);
  for (const t of texts) {
    const rows = byText.get(t); if (rows.length < 5) continue; const step = Math.max(1, Math.floor(rows.length / SAMPLE)); const sample = []; for (let k = 0; k < rows.length && sample.length < SAMPLE; k += step) sample.push(rows[k]);
    const hits = new Map(); let n = 0; let sum = 0;
    for (const i of sample) {
      let best = -1; let bt = -1; const bi = i * K;
      for (const j of pool) { if (P.text[j] === t) continue; let d = 0; const bj = j * K; for (let c = 0; c < K; c++) d += P.q[bi + c] * P.q[bj + c]; d *= P.s[i] * P.s[j]; if (d > best) { best = d; bt = P.text[j]; } }
      n++; sum += best; if (best >= TAU) hits.set(bt, (hits.get(bt) || 0) + 1);
    }
    for (const [u, h] of hits) pairs.push({ a: P.texts[t], b: P.texts[u], g, frac: h / n });
  }
}
pairs.sort((x, y) => y.frac - x.frac);
console.log('index', path.basename(DIR), '|', P.texts.length, 'texts |', N, 'passages | sample', SAMPLE, 'per book | TAU', TAU);
const title = (id) => { const l = LIB.LIB_BY_ID[id]; return l ? l.title.slice(0, 54) : '?'; };
for (const p of pairs.filter((x) => x.frac >= 0.12).slice(0, 80)) console.log((p.frac * 100).toFixed(0).padStart(3) + '%  ' + p.a.padEnd(9) + '→ ' + p.b.padEnd(9) + p.g + '  ' + title(p.a) + '  ~  ' + title(p.b));
