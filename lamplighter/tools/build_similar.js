#!/usr/bin/env node
/* Build the passage-similarity index: similar/index.js, similar/terms.js and similar/chunks.js (split by tools/split_similar.py into chunks.js, chunks-2.js, chunks-3.js and chunks-4.js, each under 25 MiB), and similar/motifs.js, next to Lamplighter.html (like texts/ and atlas/).
   Run from anywhere:  node tools/build_similar.js [--dims 64] [--stats]

   What it does, in plain terms. Every readable English text in texts/ is cut into passages of a paragraph or so (about 230,000 of them on 16 November 2026). Each passage becomes a list of
   weighted words (TF-IDF: a word counts for more the rarer it is across the library). A statistical step called latent semantic analysis (a truncated singular
   value decomposition of that passage-by-word table) then finds the main directions in which passages and words vary together, so that words used in the same
   kinds of places (ark, ship, boat, flood, deluge, dove, raven) land near each other and each passage becomes a short list of numbers. Two passages that are about
   the same things end up close together, even where the translators chose different words. No neural network, no server and nothing leaves the machine: it is the
   classic statistical method, computed once here, and the page does a dot product against it.
   Modern scholarship in the folder (z-*, and every book on a shelf-only Library group) and the Theosophical Secret Doctrine and Kybalion are left out, so the index compares scriptures with scriptures. */
'use strict';
const fs = require('fs'); const vm = require('vm'); const path = require('path');
const L = require('../src/js/2w-similar-core.js'); const MO = require('../src/js/2x-motifs.js'); const P = require('../src/js/6d-passage.js');
const ROOT = path.resolve(__dirname, '..', '..'); const args0 = process.argv.slice(2); const outFlag = args0.indexOf('--out'); const OUT = outFlag >= 0 ? path.resolve(args0[outFlag + 1]) : path.join(ROOT, 'similar');
const args = process.argv.slice(2); const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const K = +opt('dims', 64); const KX = K + 1; const OVER = +opt('over', 12); const R = KX + OVER; const SPARSE = +opt('sparse', 20); const POWER = +opt('power', 3);      /* the randomised SVD's oversampling and power steps: more of either makes the basis steadier from one build to the next (--over 20 --power 5), at a few minutes more */ const STATS = args.includes('--stats');
const MINDF = +opt('mindf', 5); const MAXDF = +opt('maxdf', 0.25);
// left out of the index: the study aids (z-), Blavatsky and the Kybalion, the freedom-of-conscience texts (f-) and the occult, Masonic, field-record and folklore and witchcraft shelves (h- m- v- k- a- l- w- t-: grimoires, lodge histories, folk-tale collections,
// collectors' accounts and witch-hunters' treatises that quote scripture or retell it, so their closest matches would crowd out the traditions' own writing; add them back only after running tools/similar_bench.js). Measured on 16 November 2026 with the 94
// books of those five shelves in against out: 179 of the 760 best-ten places over the benchmark's 76 questions went to them (a- field records 70, v- 38, k- 34, h- 29, m- 8) and 65 questions had one; best-ten 13 → 12, best-25 21 → 20, mean
// reciprocal rank 0.084 → 0.071, shown 16 → 19; the index grew from 330 texts and 250,717 passages (52 MB) to 424 and 332,523 (69 MB). These are arguments about religion, not a tradition's own
// writing, and Williams and Spinoza quote the Bible so closely and so often that, with them in, the Bible passages' closest matches were their quotations and the real
// parallels in other traditions fell out of the shown set (tools/similar_bench.js: 26% of the curated pairs shown without them, 22% with them)
// also left out: a book that is another translation or edition of a work the index already holds (tools/similar_skip.json, id → why; found with tools/similar_dups.js). A result group shows its two best
// sections (and up to two more, only from other books, see SIM_SHOW in src/js/2w-similar-core.js), and two translations of one verse would take both places.
let EXTRA_SKIP = {}; try { EXTRA_SKIP = JSON.parse(fs.readFileSync(path.join(__dirname, 'similar_skip.json'), 'utf8')); } catch (e) { /* none listed */ }
const EXTRA_RE = Object.keys(EXTRA_SKIP).filter((k) => /^\/.+\/$/.test(k)).map((k) => new RegExp(k.slice(1, -1)));              // (a key written /like this/ is a pattern; any other key is one book's id)
// Which Library group a text is filed under decides too (added 17 November 2026: the library session had begun to give scholarship an x- id, so the first letter no longer says what a book is).
// A shelf-only group (LIB_SHELF_ONLY in src/js/24-data-path-lib.js: study aids, occult, Masonic, field records, folklore, folk tales, the imagined shelf) is never indexed. Two groups hold both a tradition's
// own writings and later books about or out of it, ec (early Christian writings and the later Christian classics) and mo (modern and revival traditions): from those only the ids in tools/similar_include.json go in.
const LIBM = require('../src/js/24-data-path-lib.js'); const SHELF_ONLY = new Set(LIBM.LIB_SHELF_ONLY); const groupOf = (id) => (LIBM.LIB_BY_ID[id] || {}).group;
let INCLUDE = {}; try { INCLUDE = JSON.parse(fs.readFileSync(path.join(__dirname, 'similar_include.json'), 'utf8')); } catch (e) { /* none listed */ }
const MIXED = Object.keys(INCLUDE).filter((g) => g !== '_note'); const MIXED_IN = new Set(MIXED.flatMap((g) => INCLUDE[g]));
const SKIP = (id) => /^[zfhmvkalwt]-/.test(id) || id === 'x-blv' || id === 'x-kyb' || Object.prototype.hasOwnProperty.call(EXTRA_SKIP, id) || EXTRA_RE.some((r) => r.test(id))
  || SHELF_ONLY.has(groupOf(id)) || (MIXED.includes(groupOf(id)) && !MIXED_IN.has(id));
const log = (...a) => console.log(((Date.now() - T0) / 1000).toFixed(1).padStart(6) + 's', ...a); const T0 = Date.now();

/* ── 1. the texts, cut into passages, each a list of term ids ── */
globalThis.BEATLAB_TEXTS = { meta: {}, data: {}, add(id, meta, secs) { this.data[id] = { meta, secs }; }, addIndex(o) { Object.assign(this.meta, o); } };
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'texts', 'index.js'), 'utf8'));
const meta = BEATLAB_TEXTS.meta; const ids = Object.keys(meta).filter((i) => !SKIP(i)).sort();
const termId = new Map(); const termStr = []; const termDf = []; const termTexts = [];
const seenText = new Set(); let dupSkipped = 0; const chunkMo = []; const chunkText = []; const chunkSec = []; const chunkA = []; const chunkB = []; const chunkTerms = [];
for (let ti = 0; ti < ids.length; ti++) {
  const id = ids[ti]; vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'texts', id + '.js'), 'utf8')); const { meta: m, secs } = BEATLAB_TEXTS.data[id]; delete BEATLAB_TEXTS.data[id];
  const scan = /scan|OCR/i.test(`${m.note || ''} ${m.license || ''}`); const n = secs.length; let lo = 0; let hi = n - 1; if (scan && n >= 6) { lo = 1; hi = n - 2; } else if (scan && n >= 3) lo = 1;
  const notes = P.psgNumberedAreNotes(secs);
  for (let si = lo; si <= hi; si++) {
    const text = secs[si][1];
    const cuts = L.simCut(text, (raw) => P.psgUsable(raw) && !(notes && /^\s*[\[(]?\d{1,3}\s?[.)]\s/.test(raw)) && !L.simJunk(raw));
    for (const [a, b] of cuts) {
      const ts = L.simTerms(text.slice(a, b)); if (ts.length < 8) continue;
      const fp = ts.join(' '); if (seenText.has(fp)) { dupSkipped++; continue; } seenText.add(fp);   // the same passage filed under two entries (one volume under two titles) is kept once
      chunkMo.push(MO.simMotifScores(text.slice(a, b), new Set(ts)));
      const row = new Int32Array(ts.length);
      for (let j = 0; j < ts.length; j++) { let t = termId.get(ts[j]); if (t === undefined) { t = termStr.length; termId.set(ts[j], t); termStr.push(ts[j]); termDf.push(0); termTexts.push(new Set()); } row[j] = t; }
      chunkText.push(ti); chunkSec.push(si); chunkA.push(a); chunkB.push(b); chunkTerms.push(row);
    }
  }
}
const N = chunkTerms.length; log(`${ids.length} texts, ${N} passages (${dupSkipped} repeats left out), ${termStr.length} distinct words`);
if (args.includes('--per-text')) { const cnt = new Array(ids.length).fill(0); for (const t of chunkText) cnt[t]++; console.log('passages per text, most first:\n' + ids.map((id, i) => [id, cnt[i]]).sort((a, b) => b[1] - a[1]).map(([id, n]) => `  ${id} ${n}`).join('\n')); }      // (a way to see which books take the room: no file of the index may reach 25 MiB, and since 24 November 2026 the passage vectors are split over two files, so about 480,000 passages fit before the fattest file, chunks.js, does)

/* ── 2. the vocabulary: words that occur in at least 5 passages and in at least 2 texts (a word found in one book cannot tell two books apart) ── */
for (let i = 0; i < N; i++) { const seen = new Set(chunkTerms[i]); for (const t of seen) { termDf[t]++; termTexts[t].add(chunkText[i]); } }
const keep = []; for (let t = 0; t < termStr.length; t++) if (termDf[t] >= MINDF && termTexts[t].size >= 2 && termDf[t] <= N * MAXDF) keep.push(t);
keep.sort((a, b) => termStr[a] < termStr[b] ? -1 : 1); const newId = new Int32Array(termStr.length).fill(-1); keep.forEach((t, i) => { newId[t] = i; });
const V = keep.length; const vocab = keep.map((t) => termStr[t]); const idf = new Float32Array(V); keep.forEach((t, i) => { idf[i] = Math.log((N + 1) / (termDf[t] + 1)) + 1; });
log(`${V} words in the vocabulary`); { const tally = {}; chunkMo.forEach((l) => { if (l[0]) { const id = MO.simMotifInit()[l[0][0]].id; tally[id] = (tally[id] || 0) + 1; } }); const tagged = chunkMo.filter((l) => l.length).length; log(`${tagged} passages (${(100 * tagged / N).toFixed(0)}%) carry a motif; strongest-motif counts: ` + Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(', ')); }

/* ── 3. the passage-by-word table, TF-IDF weighted, each row of length 1 (compressed sparse rows) ── */
const rowPtr = new Int32Array(N + 1); const cols = []; const vals = [];
for (let i = 0; i < N; i++) {
  const c = new Map(); for (const t of chunkTerms[i]) { const j = newId[t]; if (j >= 0) c.set(j, (c.get(j) || 0) + 1); }
  let norm = 0; const ent = []; for (const [j, f] of c) { const w = (1 + Math.log(f)) * idf[j]; ent.push([j, w]); norm += w * w; }
  norm = Math.sqrt(norm) || 1; ent.sort((a, b) => a[0] - b[0]); for (const [j, w] of ent) { cols.push(j); vals.push(w / norm); } rowPtr[i + 1] = cols.length;
}
const colIdx = Int32Array.from(cols); const val = Float32Array.from(vals); log(`${colIdx.length} nonzero entries`);
if (STATS) process.exit(0);

/* ── 4. latent semantic analysis by a randomised truncated SVD (Halko, Martinsson and Tropp): find a small orthonormal basis Q for the range of X, then the SVD of the small matrix QᵀX ── */
function mulX(M, r) { const Y = new Float32Array(N * r); for (let i = 0; i < N; i++) { const o = i * r; for (let p = rowPtr[i]; p < rowPtr[i + 1]; p++) { const w = val[p]; const m = colIdx[p] * r; for (let c = 0; c < r; c++) Y[o + c] += w * M[m + c]; } } return Y; }
function mulXt(Y, r) { const Z = new Float32Array(V * r); for (let i = 0; i < N; i++) { const o = i * r; for (let p = rowPtr[i]; p < rowPtr[i + 1]; p++) { const w = val[p]; const m = colIdx[p] * r; for (let c = 0; c < r; c++) Z[m + c] += w * Y[o + c]; } } return Z; }
function orthonormalise(M, rows, r) {          // modified Gram–Schmidt on the columns
  for (let j = 0; j < r; j++) {
    for (let i = 0; i < j; i++) { let d = 0; for (let a = 0; a < rows; a++) d += M[a * r + i] * M[a * r + j]; for (let a = 0; a < rows; a++) M[a * r + j] -= d * M[a * r + i]; }
    let nn = 0; for (let a = 0; a < rows; a++) nn += M[a * r + j] * M[a * r + j]; nn = Math.sqrt(nn) || 1; for (let a = 0; a < rows; a++) M[a * r + j] /= nn;
  }
}
let seed = 12345; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
let Om = new Float32Array(V * R); for (let i = 0; i < Om.length; i++) Om[i] = gauss();
let Y = mulX(Om, R); orthonormalise(Y, N, R); log('range found');
for (let q = 0; q < POWER; q++) { let Z = mulXt(Y, R); orthonormalise(Z, V, R); Y = mulX(Z, R); orthonormalise(Y, N, R); log(`power step ${q + 1}`); }
const Z = mulXt(Y, R);                         // Z = XᵀQ  (V × R), so B = Zᵀ
const G = new Float64Array(R * R); for (let v = 0; v < V; v++) { const o = v * R; for (let a = 0; a < R; a++) { const za = Z[o + a]; if (za === 0) continue; for (let b = a; b < R; b++) G[a * R + b] += za * Z[o + b]; } }
for (let a = 0; a < R; a++) for (let b = 0; b < a; b++) G[a * R + b] = G[b * R + a];
function jacobiEigen(A, n) {                   // symmetric eigen-decomposition, cyclic Jacobi
  const Vm = new Float64Array(n * n); for (let i = 0; i < n; i++) Vm[i * n + i] = 1;
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i * n + j] ** 2; if (off < 1e-20) break;
    for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
      const apq = A[p * n + q]; if (Math.abs(apq) < 1e-30) continue; const th = (A[q * n + q] - A[p * n + p]) / (2 * apq); const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)); const c = 1 / Math.sqrt(t * t + 1); const s = t * c;
      for (let k = 0; k < n; k++) { const akp = A[k * n + p]; const akq = A[k * n + q]; A[k * n + p] = c * akp - s * akq; A[k * n + q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = A[p * n + k]; const aqk = A[q * n + k]; A[p * n + k] = c * apk - s * aqk; A[q * n + k] = s * apk + c * aqk; }
      for (let k = 0; k < n; k++) { const vkp = Vm[k * n + p]; const vkq = Vm[k * n + q]; Vm[k * n + p] = c * vkp - s * vkq; Vm[k * n + q] = s * vkp + c * vkq; }
    }
  }
  const ev = []; for (let i = 0; i < n; i++) ev.push([A[i * n + i], i]); ev.sort((a, b) => b[0] - a[0]); return { ev, Vm };
}
const { ev, Vm } = jacobiEigen(G, R); log('top singular values: ' + ev.slice(0, 5).map((e) => Math.sqrt(Math.max(e[0], 0)).toFixed(2)).join(' ') + ' … ' + Math.sqrt(Math.max(ev[KX - 1][0], 0)).toFixed(2) + ' (the first is dropped: it is only the average passage)');
const Vk = new Float32Array(V * K);            // right singular vectors: Z · U_B · Σ⁻¹ (the first one skipped)
for (let c = 0; c < K; c++) { const [lam, idx] = ev[c + 1]; const sg = Math.sqrt(Math.max(lam, 1e-12)); for (let v = 0; v < V; v++) { let a = 0; for (let b = 0; b < R; b++) a += Z[v * R + b] * Vm[b * R + idx]; Vk[v * K + c] = a / sg; } }
const D = mulX(Vk, K); log('passages projected');                              // each passage's coordinates: X · V_k
for (let i = 0; i < N; i++) { let nn = 0; for (let c = 0; c < K; c++) nn += D[i * K + c] ** 2; nn = Math.sqrt(nn) || 1; for (let c = 0; c < K; c++) D[i * K + c] /= nn; }

/* ── 5. write: small integers, so the page can hold them (int8 with a scale per row), as base64 inside script files that work from file:// ── */
function quant(M, rows, k) { const q = new Int8Array(rows * k); const sc = new Float32Array(rows); for (let i = 0; i < rows; i++) { let mx = 0; for (let c = 0; c < k; c++) mx = Math.max(mx, Math.abs(M[i * k + c])); const s = mx / 127 || 1; sc[i] = s; for (let c = 0; c < k; c++) q[i * k + c] = Math.round(M[i * k + c] / s); } return { q, sc }; }
const b64 = (ta) => Buffer.from(ta.buffer, ta.byteOffset, ta.byteLength).toString('base64');
fs.mkdirSync(OUT, { recursive: true });
const tq = quant(Vk, V, K); const dq = quant(D, N, K);
const spN = new Uint8Array(N); const spC = []; const spW = [];
for (let i = 0; i < N; i++) { const ent = []; for (let p = rowPtr[i]; p < rowPtr[i + 1]; p++) ent.push([colIdx[p], val[p]]); ent.sort((a, b) => b[1] - a[1]); const top = ent.slice(0, SPARSE); spN[i] = top.length; for (const [c, w] of top) { spC.push(c); spW.push(Math.min(255, Math.round(w * 255 * 1.5))); } }
const moId = new Uint8Array(N * 3).fill(255); const moSc = new Uint8Array(N * 3); chunkMo.forEach((l, i) => l.forEach(([id, s], k) => { moId[i * 3 + k] = id; moSc[i * 3 + k] = s; }));
const sparse = { n: Uint8Array.from(spN), c: Uint16Array.from(spC), w: Uint8Array.from(spW) };
const textChars = {}; ids.forEach((id) => { textChars[id] = meta[id].chars; });
const info = { version: 1, built: new Date().toISOString().slice(0, 10), dims: K, passages: N, words: V, texts: ids, textChars, vocab, idf: Array.from(idf, (x) => +x.toFixed(3)),
  motifs: MO.simMotifInit().map((m) => m.id), motifVersion: MO.simMotifVersion(), note: 'Latent semantic analysis of TF-IDF passage vectors, plus motif tags. See tools/build_similar.js.' };
fs.writeFileSync(path.join(OUT, 'index.js'), 'BEATLAB_SIM.add("index",' + JSON.stringify(info) + ');\n');
fs.writeFileSync(path.join(OUT, 'terms.js'), 'BEATLAB_SIM.add("terms",{"q":"' + b64(tq.q) + '","s":"' + b64(tq.sc) + '"});\n');
const tbl = { text: Uint16Array.from(chunkText), sec: Uint16Array.from(chunkSec), a: Uint32Array.from(chunkA), len: Uint16Array.from(chunkB.map((b, i) => b - chunkA[i])) };
if (ids.length > 65535) throw new Error('more than 65,535 texts: widen the text column');
if (chunkSec.some((s) => s > 65535) || chunkB.some((b, i) => b - chunkA[i] > 65535)) throw new Error('a section or passage is too long for 16 bits');
fs.writeFileSync(path.join(OUT, 'chunks.js'), 'BEATLAB_SIM.add("chunks",{"n":' + N + ',"sn":"' + b64(sparse.n) + '","sc":"' + b64(sparse.c) + '","sw":"' + b64(sparse.w) + '","mo":"' + b64(moId) + '","ms":"' + b64(moSc) + '","q":"' + b64(dq.q) + '","s":"' + b64(dq.sc) + '","t":"' + b64(tbl.text) + '","c":"' + b64(tbl.sec) + '","a":"' + b64(tbl.a) + '","l":"' + b64(tbl.len) + '"});\n');
{ // the best passages of each motif, up to three from any one book, for the Motifs page (small: it does not need the big index)
  const out = MO.simMotifInit().map((m) => { const list = []; for (let i = 0; i < N; i++) for (let k = 0; k < 3; k++) if (moId[i * 3 + k] === m.idx) { list.push([moSc[i * 3 + k], i]); break; }
    list.sort((a, b) => b[0] - a[0] || a[1] - b[1]); const per = {}; const top = []; for (const [s, i] of list) { const t = chunkText[i]; per[t] = (per[t] || 0) + 1; if (per[t] > 3) continue; top.push([t, chunkSec[i], chunkA[i], chunkB[i] - chunkA[i], s]); if (top.length >= 150) break; }
    return { id: m.id, n: list.length, books: new Set(list.map(([, i]) => chunkText[i])).size, items: top }; });
  fs.writeFileSync(path.join(OUT, 'motifs.js'), 'BEATLAB_SIM.add("motifs",' + JSON.stringify({ version: MO.simMotifVersion(), built: info.built, texts: ids, textChars, motifs: out }) + ');\n'); }
try { require('child_process').execFileSync('python3', ['-I', path.join(__dirname, 'split_similar.py'), OUT], { stdio: 'inherit' }); } catch (e) { log('could not split chunks.js into parts (python3 tools/split_similar.py): ' + e.message); process.exitCode = 1; }      // four files, each under 25 MiB, for free static hosts
for (const f of ['index', 'terms', 'chunks', 'chunks-2', 'chunks-3', 'chunks-4', 'motifs']) { const p = path.join(OUT, f + '.js'); if (!fs.existsSync(p)) continue; const size = fs.statSync(p).size; log(`similar/${f}.js ${(size / 1e6).toFixed(1)} MB (${(size / 1048576).toFixed(1)} MiB)${size >= 25 * 1048576 ? '   <-- 25 MiB OR MORE: a free static host refuses it' : ''}`); if (size >= 25 * 1048576) process.exitCode = 1; }
