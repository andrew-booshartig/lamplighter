#!/usr/bin/env node
/* A yardstick for the passage-similarity matching: the curated Parallel passages (src/js/2q-data-parallels.js), pairs that scholars have set side by side, each used as a
   question: given this passage, do the matching passages of the other book come back? Every curated link is asked in both directions (116 questions).
   The curated pairs are NOT given to the matcher as a hint here (the page's small prior for them is switched off), so this measures the statistics alone.
   Run:  node tools/similar_bench.js [--dir similar] [--ctx 0] [--json '{"lexWeight":0.25}']
   Reports, for the questions where the partner's book is in another tradition (what the page shows by default):
     shown   the partner's book is among the sections the page puts on screen: the best two of its tradition, or a third and a fourth from other books when they are within 15% of the best
             match of all (SIM_SHOW in src/js/2w-similar-core.js; until 16 November 2026 it was the best two only, and on the index of that day the extra two made no difference: 19 of 76 either way)
     top10   the partner's book is among the ten best sections overall      mrr  mean reciprocal rank of the partner's best section */
'use strict';
const fs = require('fs'); const vm = require('vm'); const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..'); const C = require('../src/js/2w-similar-core.js'); globalThis.simTerms = C.simTerms; globalThis.simMotifScores = require('../src/js/2x-motifs.js').simMotifScores; const LIB = require('../src/js/24-data-path-lib.js'); const { PARALLELS } = require('../src/js/2q-data-parallels.js');
const args = process.argv.slice(2); const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const DIR = path.resolve(opt('dir', path.join(ROOT, 'similar'))); const CTX = +opt('ctx', 0); const O = JSON.parse(opt('json', '{}')); const QUIET = args.includes('--quiet');
const SHOW = opt('show', '');      // --show <set id>: print the groups the page would show for that curated set's questions (for example --show our-father)
const LEAVE = opt('leave', '') ? new Set(JSON.parse(fs.readFileSync(path.resolve(opt('leave', '')), 'utf8'))) : null;      // --leave <json list of ids>: ask as if those books were not in the index (cheaper than rebuilding it; the vectors were still made with them)
const CROWD = opt('crowd', '') ? new Set(JSON.parse(fs.readFileSync(path.resolve(opt('crowd', '')), 'utf8'))) : null; const crowd = { places: 0, hit: 0, q: 0, byGroup: {}, byId: {} };      // --crowd <json list of ids>: how many of the ten best sections of each cross-tradition question went to those books (a share well above their share of the passages means they crowd out the rest)
globalThis.BEATLAB_TEXTS = { meta: {}, data: {}, add(id, meta, secs) { this.data[id] = { meta, secs }; }, addIndex(o) { Object.assign(this.meta, o); } };
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'texts', 'index.js'), 'utf8'));
for (const n of ['index', 'terms', 'chunks', 'chunks-2', 'chunks-3', 'chunks-4']) if (fs.existsSync(path.join(DIR, n + '.js'))) vm.runInThisContext(fs.readFileSync(path.join(DIR, n + '.js'), 'utf8'));      // chunks.js is split into four files, each under 25 MiB
const P = C.simPrepare(BEATLAB_SIM.data); P.info = BEATLAB_SIM.data.index;
const load = (id) => { if (!BEATLAB_TEXTS.data[id]) vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'texts', id + '.js'), 'utf8')); return BEATLAB_TEXTS.data[id]; };
const COLLS = [['hb', 'dc', 'or', 'nt'], ['ps', 'ds', 'ec', 'ju'], ['me', 'eg'], ['gr'], ['in', 'bu', 'ja', 'sk'], ['ir', 'is'], ['ch'], ['ne'], ['am', 'na', 'af', 'pa']];
const coll = (id) => { const l = LIB.LIB_BY_ID[id]; return COLLS.findIndex((c) => c.includes(l && l.group)); };
const norm = (s) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\[\[\d+\]\]/g, ' ').replace(/\s+/g, ' ');
const locate = (id, phrase, len) => { if (!BEATLAB_TEXTS.meta[id]) return null; const { secs } = load(id); const ph = norm(phrase).toLowerCase(); for (const s of secs) { const t = norm(s[1]); const i = t.toLowerCase().indexOf(ph); if (i >= 0) return t.slice(i, i + Math.max(len, CTX)); } return null; };
const qs = [];
for (const p of PARALLELS) for (const [a, b, kind] of p.links || []) {
  const A = p.items[a - 1]; const B = p.items[b - 1]; if (A[0] === B[0] || A[0] === 'p-lxx' || B[0] === 'p-lxx') continue;   // a translation of the same book is not a parallel to find
  for (const [X, Y] of [[A, B], [B, A]]) { const text = locate(X[0], X[1], X[3] || 420); if (!text) { qs.push({ skip: 'not found', set: p.id, from: X[0], to: Y[0], kind }); continue; } qs.push({ set: p.id, from: X[0], to: Y[0], text, kind, cross: coll(X[0]) !== coll(Y[0]) }); }
}
const stats = { n: 0, shown: 0, top10: 0, top25: 0, mrr: 0, same: 0, sameShown: 0, skipped: 0 }; const miss = [];
for (const q of qs) {
  if (q.skip) { stats.skipped++; continue; } const emb = C.simEmbed(P, q.text); if (!emb) { stats.skipped++; continue; }
  const own = P.textIdx[q.from]; const oc = coll(q.from); const same = !q.cross;
  const res = C.simSearch(P, emb, Object.assign({ skipText: (t) => t === own || (!same && coll(P.texts[t]) === oc) || P.texts[t] === 'p-lxx' || (LEAVE && LEAVE.has(P.texts[t])), pool: 4000, perText: 100000, limit: 4000 }, O));
  const G = C.simGroup(res, Object.assign({}, C.SIM_SHOW, { collOf: coll })); const shown = new Set(G.groups.filter((g) => g.best >= 0.42 * G.top).flatMap((g) => g.items.map((x) => x.id)));
  if (SHOW && q.set === SHOW) console.log(`${q.from}→${q.to}${same ? ' (same tradition)' : ''}: ` + G.groups.map((g) => `{${g.coll}: ` + g.items.map((x) => x.id + '#' + x.sec + ' ' + x.region.toFixed(1)).join(', ') + '}').join(' '));
  const secs = new Map(); for (const r of res) { const k = r.id + '#' + r.sec; if (!secs.has(k) || secs.get(k).score < r.score) secs.set(k, r); } const ranked = [...secs.values()].sort((a, b) => b.score - a.score);
  const rank = ranked.findIndex((r) => r.id === q.to);
  if (same) { stats.same++; if (shown.has(q.to)) stats.sameShown++; continue; }
  stats.n++; if (shown.has(q.to)) stats.shown++; if (rank >= 0 && rank < 10) stats.top10++; if (rank >= 0 && rank < 25) stats.top25++; if (rank >= 0) stats.mrr += 1 / (rank + 1); else if (!QUIET) miss.push(q.set + ' ' + q.from + '→' + q.to);
  if (CROWD) { const top = ranked.slice(0, 10); crowd.places += top.length; const h = top.filter((r) => CROWD.has(r.id)); crowd.hit += h.length; if (h.length) crowd.q++; for (const r of top) { const g = (LIB.LIB_BY_ID[r.id] || {}).group || '?'; crowd.byGroup[g] = (crowd.byGroup[g] || 0) + 1; if (CROWD.has(r.id)) crowd.byId[r.id] = (crowd.byId[r.id] || 0) + 1; } }
  if (!shown.has(q.to) && !QUIET) miss.push(`${q.set}: ${q.from}→${q.to} (rank ${rank < 0 ? 'none' : rank + 1})`);
}
const pc = (x) => (100 * x / stats.n).toFixed(0) + '%';
console.log(`questions ${stats.n} cross-tradition (${stats.same} within one tradition, ${stats.skipped} not resolved) | shown ${stats.shown} (${pc(stats.shown)}) | top10 ${stats.top10} (${pc(stats.top10)}) | top25 ${stats.top25} (${pc(stats.top25)}) | mrr ${(stats.mrr / stats.n).toFixed(3)} | options ${JSON.stringify(O)} ctx ${CTX}`);
if (CROWD) console.log(`best-ten places: ${crowd.hit} of ${crowd.places} (${(100 * crowd.hit / crowd.places).toFixed(0)}%) went to the ${CROWD.size} listed books; ${crowd.q} of ${stats.n} questions had one; by Library group: ` + Object.entries(crowd.byGroup).sort((a, b) => b[1] - a[1]).map(([g, n]) => g + ' ' + n).join(', '));
if (CROWD && args.includes('--by-book')) console.log('best-ten places by listed book: ' + Object.entries(crowd.byId).sort((a, b) => b[1] - a[1]).map(([id, n]) => id + ' ' + n).join(', '));
if (!QUIET && args.includes('--misses')) console.log(miss.join('\n'));
module.exports = stats;
