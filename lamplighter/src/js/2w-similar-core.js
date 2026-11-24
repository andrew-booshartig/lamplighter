/* ═══════════════════════════ 2w · Similar passages: the matching core ═══════════════════════════
   Pure functions, no page. A passage is turned into weighted words and then into a short list of numbers (latent semantic analysis, built once by
   tools/build_similar.js from every English text in the library); passages that are about the same things get close lists, even where the translators
   chose different words (ark, ship, boat; flood, deluge). This file holds the shared rules (how a text is cut into passages, how a passage becomes words)
   and the query side: embed a passage, score it against all ~320,000 others, keep the best few from other books, then re-rank them by the words they
   actually share. It is statistics, not understanding: a match means "these read alike", never "one borrowed from the other". */
globalThis.BEATLAB_SIM = globalThis.BEATLAB_SIM || { data: {}, add(name, obj) { this.data[name] = Object.assign(this.data[name] || {}, obj); } };      // a file may hold part of a set (chunks.js, chunks-2.js, chunks-3.js, chunks-4.js): the parts are joined

/* words that carry no theme: function words, and the archaic forms of older translations (thou, hath, unto) that would otherwise set one translator apart from another */
const SIM_STOP = new Set(`a about above across after again against all almost also although always am among an and another any anyone anything are around as at away
be became because become been before being below between both but by can cannot could did do does doing done down during each either else enough even ever every
for from further had has have having he her here hers herself him himself his how however i if in into is it its itself just let like made make many may me might
more most much must my myself neither never no nor not nothing now of off often on once one only or other others our ours ourselves out over own per perhaps quite
rather said same say says shall she should since so some something such than that the their theirs them themselves then there therefore these they this those though
through thus to together too toward towards under until up upon us very was we were what whatever when whence where whether which while who whom whose why will with
within without would yet you your yours yourself yourselves thou thee thy thine thyself ye hath hast doth dost art wilt shalt didst wast wert unto saith saidst
whoso whosoever whomsoever wherefore whereof wherein whereby thereof therein thereby hereby herein henceforth hence thence yea nay lo behold amen
chapter verse book part section page note notes footnote see also cf ibid etc ii iii iv vi vii viii ix xi xii xiii xiv xv xvi xvii xviii xix xx
first second third came come comes coming went go goes going gone get got give gave given giving take took taken taking put set seen saw see sees seeing
upon thereupon whereupon among amongst amid amidst besides beside beyond near nigh far long great good little small old new big`.split(/\s+/));
/* spellings of one name that texts and translators vary (the list the full-text search uses) */
const SIM_ALIASES = [
  ['yahweh', 'jehovah', 'yhwh'], ['gilgamesh', 'gilgamish'], ['utnapishtim', 'uta-napishtim', 'ut-napishtim', 'utanapishtim'], ['muhammad', 'mohammed', 'mahomet', 'muhammed'],
  ['quran', "qur'an", 'koran'], ['zoroaster', 'zarathustra', 'zarathushtra'], ['inanna', 'innini'], ['marduk', 'merodach'], ['dao', 'tao'], ['daoism', 'taoism'],
  ['laozi', 'lao tzu', 'lao-tzu', 'lao tse'], ['zhuangzi', 'chuang tzu', 'chuang-tzu'], ['confucius', 'kongzi', "k'ung"], ['krishna', 'krsna'], ['shiva', 'siva'], ['vishnu', 'visnu'],
  ['nirvana', 'nibbana'], ['dharma', 'dhamma'], ['karma', 'kamma'], ['sutra', 'sutta'], ['arhat', 'arahant'], ['moses', 'moshe'], ['neighbor', 'neighbour'], ['honor', 'honour'],
  ['savior', 'saviour'], ['favor', 'favour'], ['labor', 'labour'], ['color', 'colour'], ['judgment', 'judgement'], ['plowshare', 'ploughshare'], ['scepter', 'sceptre'], ['mold', 'mould'],
];
const SIM_ALIAS = new Map(); for (const g of SIM_ALIASES) for (const w of g) SIM_ALIAS.set(w, g[0]);
/* words that name the same thing across translators and traditions, so the statistics need not learn it from scratch. Short and plain on purpose. */
const SIM_SYNONYMS = [
  ['ark', 'ship', 'boat', 'vessel', 'raft'], ['flood', 'deluge', 'inundation'], ['dove', 'pigeon'], ['serpent', 'snake', 'dragon'], ['heaven', 'sky', 'firmament'],
  ['sea', 'ocean', 'abyss'], ['mountain', 'hill', 'summit'], ['sacrifice', 'offering', 'oblation'], ['altar', 'shrine'], ['priest', 'brahmin', 'brahman'],
  ['slay', 'kill', 'murder', 'slaughter'], ['wealth', 'riches', 'treasure'], ['enemy', 'foe', 'adversary'], ['pity', 'mercy', 'compassion'], ['sin', 'transgression', 'iniquity', 'trespass'],
  ['dead', 'corpse', 'carcass'], ['underworld', 'hades', 'sheol', 'netherworld', 'hell'], ['soul', 'spirit'], ['beginning', 'origin'],
  ['sun', 'shamash', 'helios'], ['river', 'stream'], ['fire', 'flame', 'blaze'], ['king', 'ruler', 'monarch'], ['wisdom', 'knowledge', 'understanding'],
  ['teacher', 'master', 'guru', 'rabbi'], ['disciple', 'pupil', 'student', 'follower'], ['law', 'commandment', 'precept', 'statute', 'ordinance'], ['pray', 'prayer', 'supplication', 'invocation'],
  ['virtue', 'righteousness', 'justice', 'goodness'], ['reciprocity', 'golden-rule'],
];
const SIM_SYN = new Map(); for (const g of SIM_SYNONYMS) for (const w of g) if (!SIM_SYN.has(w)) SIM_SYN.set(w, g[0]);
const simStrip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
/* a light stemmer: plurals, -ed and -ing and a trailing e, so save / saved / saving meet. Words are never cut below three letters. */
function simStem(w) {
  if (w.length <= 3) return w;
  if (w.length === 4) return w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us') && !w.endsWith('is') ? w.slice(0, -1) : w;
  let s = w;
  if (s.endsWith('ies') && s.length > 5) s = s.slice(0, -3) + 'y';
  else if (s.endsWith('sses')) s = s.slice(0, -2);
  else if (/(?:[sxz]|ch|sh)es$/.test(s) && s.length > 5) s = s.slice(0, -2);
  else if (s.endsWith('s') && !s.endsWith('ss') && !s.endsWith('us') && !s.endsWith('is')) s = s.slice(0, -1);
  if (s.endsWith('ing') && s.length > 5 && /[aeiouy]/.test(s.slice(0, -3))) s = s.slice(0, -3);
  else if (s.endsWith('ed') && s.length > 4 && /[aeiouy]/.test(s.slice(0, -2))) s = s.slice(0, -2);
  if (s.length > 4 && /([bdgklmnprt])\1$/.test(s)) s = s.slice(0, -1);
  if (s.length > 4 && s.endsWith('e')) s = s.slice(0, -1);
  return s;
}
/* a passage → its terms in order (verse numbers, heading marks and punctuation go; names are kept, lower-cased). With raw = true, [term, the word as written]. */
function simTerms(text, raw) {
  const t = simStrip(String(text).replace(/\[\[\d+\]\]/g, ' ').replace(/^#{1,3} /gm, '')).toLowerCase().replace(/[’‘`]/g, "'");
  const out = []; const re = /[a-z][a-z']*[a-z]|[a-z]/g; let m;
  while ((m = re.exec(t))) {
    const w0 = m[0].replace(/'s$/, '').replace(/'/g, ''); if (w0.length < 3 || SIM_STOP.has(w0)) continue;
    let w = SIM_ALIAS.get(w0) || w0; w = SIM_SYN.get(w) || w; w = simStem(w); if (w.length < 3 || SIM_STOP.has(w)) continue;
    out.push(raw ? [w, w0] : w);
  }
  return out;
}
/* cutting a section into passages: runs of paragraphs of about 380 to 900 characters, cut at paragraph or sentence ends. `usable(text)` says whether a stretch is clean English
   (the random-passage picker's tests). Positions are into the section's own text, so the page can show the passage again from the texts folder. */
function simCut(text, usable, o) {
  o = o || {}; const lo = o.min || 380; const hi = o.max || 900; const out = [];
  const paras = []; const re = /\n{2,}/g; let last = 0; let m;
  while ((m = re.exec(text))) { paras.push([last, m.index]); last = m.index + m[0].length; } paras.push([last, text.length]);
  let cur = null; const flush = () => { if (cur && cur.t >= lo * 0.55) out.push([cur.a, cur.b]); cur = null; };
  for (const [a, b] of paras) {
    const raw = text.slice(a, b); if (!raw.trim()) continue;
    const short = raw.replace(/\[\[\d+\]\]/g, '').trim().length < 90 && !/^#{1,3} /.test(raw);
    if (!short && !usable(raw)) { flush(); continue; }
    if (raw.length > hi * 1.4) {
      flush(); const starts = [0]; const sre = /[.!?;:”"’)\]]\s+(?=[A-Z“"‘(\[])|\[\[\d+\]\]/g; let s;
      while ((s = sre.exec(raw))) starts.push(s[0].startsWith('[[') ? s.index : s.index + s[0].length);
      let from = 0; for (let i = 1; i < starts.length; i++) { if (starts[i] - from >= (lo + hi) / 2) { out.push([a + from, a + starts[i]]); from = starts[i]; } }
      if (raw.length - from >= lo * 0.6) out.push([a + from, b]); continue;
    }
    if (cur && cur.b - cur.a + (b - a) > hi) flush();
    if (!cur) cur = { a, b, t: b - a }; else { cur.b = b; cur.t = cur.b - cur.a; }
    if (cur.t >= lo) flush();
  }
  flush(); return out.filter(([a, b]) => b - a >= 200 && usable(text.slice(a, b)));
}

/* OCR noise or a table of numbers rather than a passage: too many one- and two-letter fragments or words with stray marks in them */
const SIM_SMALL = new Set('a i of to in is it as at be by he we or no so on if my me us an do up am oh ye'.split(' '));
function simJunk(text) {
  const w = String(text).replace(/\[\[\d+\]\]/g, ' ').split(/\s+/).filter(Boolean); if (w.length < 10) return true;
  let tiny = 0; let odd = 0; for (const x of w) { const l = x.replace(/[^A-Za-z]/g, ''); if (l.length <= 2 && !SIM_SMALL.has(l.toLowerCase())) tiny++; if (/[\^~|{}<>_=*#@$\\]|\d[A-Za-z]|[A-Za-z]\d/.test(x)) odd++; }
  return tiny / w.length > 0.22 || odd / w.length > 0.12;
}

/* ── the query side ── */
function simBytes(b64) {
  if (typeof Buffer !== 'undefined') { const b = Buffer.from(b64, 'base64'); const u = new Uint8Array(b.length); u.set(b); return u; }
  const bin = atob(b64); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u;
}
const simArr = (b64, Type) => new Type(simBytes(b64).buffer);
/* a table that comes in parts (the passage vectors: the first rows q1 in chunks-2.js, the rest q2 in chunks-4.js, so that no file passes 25 MiB; a copy made before 24 November 2026 has them whole as q): the parts, joined end to end */
function simJoin(Type, ...parts) {
  const bytes = parts.filter((p) => p != null).map(simBytes); if (bytes.length === 1) return new Type(bytes[0].buffer);
  const u = new Uint8Array(bytes.reduce((n, b) => n + b.length, 0)); let o = 0; for (const b of bytes) { u.set(b, o); o += b.length; } return new Type(u.buffer);
}
/* data = the loaded files (index, terms, chunks, and the parts of chunks) → the structure everything below works on. A part of the index that did not load shows as vectors that stop short of the passages: refused here, not searched */
function simPrepare(data) {
  const info = data.index; const K = info.dims; const V = info.words; const tq = simArr(data.terms.q, Int8Array); const ts = simArr(data.terms.s, Float32Array);
  const T = new Float32Array(V * K); for (let v = 0; v < V; v++) for (let c = 0; c < K; c++) T[v * K + c] = tq[v * K + c] * ts[v];
  const vocab = new Map(); info.vocab.forEach((w, i) => vocab.set(w, i)); const ch = data.chunks;
  const textIdx = {}; info.texts.forEach((id, i) => { textIdx[id] = i; });
  const sn = simArr(ch.sn, Uint8Array); const ptr = new Uint32Array(ch.n + 1); for (let i = 0; i < ch.n; i++) ptr[i + 1] = ptr[i] + sn[i];
  const q = simJoin(Int8Array, ch.q, ch.q1, ch.q2); if (q.length !== ch.n * K) throw new Error('the similar-passages index is incomplete: ' + q.length + ' vector numbers for ' + ch.n + ' passages of ' + K + ' dimensions (a part of the index did not load)');
  return { K, V, N: ch.n, T, vocab, idf: Float32Array.from(info.idf), q, s: simArr(ch.s, Float32Array), text: simArr(ch.t, Uint16Array), sec: simArr(ch.c, Uint16Array),
    a: simArr(ch.a, Uint32Array), len: simArr(ch.l, Uint16Array), sptr: ptr, scol: simArr(ch.sc, Uint16Array), sw: simArr(ch.sw, Uint8Array), texts: info.texts, textChars: info.textChars, textIdx, built: info.built, info, mo: ch.mo ? simArr(ch.mo, Uint8Array) : null, ms: ch.ms ? simArr(ch.ms, Uint8Array) : null };
}
/* a passage → { vec: its coordinates (length 1), w: Map(word id → weight, length 1), n: how many of its words the index knows } or null */
function simEmbed(P, text) {
  const ts = simTerms(text, true); const cnt = new Map(); const raw = new Map(); for (const [t, r] of ts) { const id = P.vocab.get(t); if (id !== undefined) { cnt.set(id, (cnt.get(id) || 0) + 1); if (!raw.has(id)) raw.set(id, r); } }
  if (!cnt.size) return null; const K = P.K; const vec = new Float32Array(K); const w = new Map(); let nn = 0;
  for (const [id, f] of cnt) { const x = (1 + Math.log(f)) * P.idf[id]; w.set(id, x); nn += x * x; for (let c = 0; c < K; c++) vec[c] += x * P.T[id * K + c]; }
  nn = Math.sqrt(nn) || 1; for (const [id, x] of w) w.set(id, x / nn);
  let vn = 0; for (let c = 0; c < K; c++) vn += vec[c] * vec[c]; vn = Math.sqrt(vn) || 1; for (let c = 0; c < K; c++) vec[c] /= vn;
  const motifs = typeof simMotifScores === 'function' ? simMotifScores(text, new Set(ts.map((x) => x[0]))) : null;
  return { vec, w, n: cnt.size, raw, motifs };
}
const SIM_WSCALE = 255 * 1.5;
/* the best passages for an embedded query, from every book except those left out. Two signals are scored for every passage and blended: the meaning-space closeness (latent
   semantic analysis) and the exact overlap of their rare words (TF-IDF cosine). Each is turned into a z-score over this search, so a few very strong word matches (ark, dove, raven)
   are not drowned by a vague thematic closeness, nor the reverse. Optionally (o.prf = { k, beta, gamma }) the best k passages are taken as more evidence of what the query is about, and
   their meaning-space position and strongest words are mixed into the query for a second look: the usual remedy where the query's own words are few or differ from the matches'.
   o.skipText(textIndex) → true to leave a book out; o.perText = how many from one book (default 2); o.limit = how many to return (default 30); o.lexWeight = 0..1 (default 0.25).
   A passage that shares most of its words with the query is the same text in another edition (the Septuagint's Genesis for the Bible's): those come back flagged `dup`. */
function simSearch(P, emb, o) {
  o = o || {}; const K = P.K; const N = P.N; const M = o.pool || 300; const lw = o.lexWeight == null ? 0.25 : o.lexWeight; const rare = o.rare == null ? 0 : o.rare;
  const ok = new Uint8Array(N); let n = 0; for (let i = 0; i < N; i++) { if (o.skipText && o.skipText(P.text[i])) continue; ok[i] = 1; n++; } if (!n) return [];
  const L = new Float32Array(N); const X = new Float32Array(N); const F = new Float32Array(N);
  const scoreAll = (q, qw) => {
    let sl = 0; let sl2 = 0; let sx = 0; let sx2 = 0;
    for (let i = 0; i < N; i++) {
      if (!ok[i]) continue; let d = 0; const base = i * K; for (let c = 0; c < K; c++) d += q[c] * P.q[base + c]; d *= P.s[i];
      let x = 0; for (let p = P.sptr[i]; p < P.sptr[i + 1]; p++) { const w = qw[P.scol[p]]; if (w !== 0) x += w * P.sw[p]; } x /= SIM_WSCALE;
      L[i] = d; X[i] = x; sl += d; sl2 += d * d; sx += x; sx2 += x * x;
    }
    const ml = sl / n; const mx = sx / n; const dl = Math.sqrt(Math.max(sl2 / n - ml * ml, 1e-12)); const dx = Math.sqrt(Math.max(sx2 / n - mx * mx, 1e-12));
    for (let i = 0; i < N; i++) if (ok[i]) F[i] = (1 - lw) * ((L[i] - ml) / dl) + lw * Math.min((X[i] - mx) / dx, 12);
  };
  const qw = new Float32Array(P.V); for (const [id, x] of emb.w) qw[id] = x * (rare ? Math.pow(P.idf[id], rare) : 1);
  scoreAll(emb.vec, qw);
  // a motif the two share (the flood, the sacred meal, the golden rule …) is one more reason to read them together
  const mw = o.motifWeight == null ? 4 : o.motifWeight; const qm = emb.motifs; if (mw > 0 && qm && qm.length && P.mo) {
    const qa = new Float32Array(256); for (const [id, s] of qm) qa[id] = s / 255;
    for (let i = 0; i < N; i++) { if (!ok[i]) continue; let b = 0; for (let k = 0; k < 3; k++) { const id = P.mo[i * 3 + k]; if (id === 255) break; const v = qa[id]; if (v) b += Math.min(v, P.ms[i * 3 + k] / 255); } if (b) F[i] += mw * b; }
  }
  if (o.prf && o.prf.k) {
    const k = o.prf.k; const top = []; for (let i = 0; i < N; i++) if (ok[i] && F[i] > (top.length < k ? -1e9 : top[top.length - 1][0])) { top.push([F[i], i]); top.sort((a, b) => b[0] - a[0]); if (top.length > k) top.pop(); }
    const q2 = new Float32Array(emb.vec); const qw2 = new Float32Array(qw); const beta = o.prf.beta == null ? 0.5 : o.prf.beta; const gamma = o.prf.gamma == null ? 0.5 : o.prf.gamma;
    for (const [, i] of top) { const base = i * K; const sc = P.s[i] / k; for (let c = 0; c < K; c++) q2[c] += beta * sc * P.q[base + c]; for (let p = P.sptr[i]; p < P.sptr[i + 1]; p++) qw2[P.scol[p]] += gamma * (P.sw[p] / SIM_WSCALE) / k; }
    let vn = 0; for (let c = 0; c < K; c++) vn += q2[c] * q2[c]; vn = Math.sqrt(vn) || 1; for (let c = 0; c < K; c++) q2[c] /= vn;
    scoreAll(q2, qw2);
  }
  const hs = new Float32Array(M).fill(-1e9); const hi = new Int32Array(M).fill(-1); let min = -1e9; let minAt = 0;
  for (let i = 0; i < N; i++) { if (!ok[i]) continue; const f = F[i]; if (f > min) { hs[minAt] = f; hi[minAt] = i; min = hs[0]; minAt = 0; for (let j = 1; j < M; j++) if (hs[j] < min) { min = hs[j]; minAt = j; } } }
  const all = []; for (let j = 0; j < M; j++) if (hi[j] >= 0) all.push({ i: hi[j], score: hs[j], lsa: L[hi[j]], lex: X[hi[j]] }); all.sort((a, b) => b.score - a.score);
  const per = o.perText || 2; const lim = o.limit || 30; const seen = {}; const out = []; const dups = [];
  for (const r of all) {
    const t = P.text[r.i]; const dup = r.lex >= 0.45 || r.lsa >= 0.93;
    const item = { i: r.i, score: r.score, lsa: r.lsa, lex: r.lex, id: P.texts[t], sec: P.sec[r.i], a: P.a[r.i], len: P.len[r.i], dup };
    if (dup) { if (!dups.some((x) => x.id === item.id)) dups.push(item); continue; }
    seen[t] = (seen[t] || 0) + 1; if (seen[t] > per) continue;
    if (out.some((x) => x.id === item.id && x.sec === item.sec && Math.abs(x.a - item.a) < 1500)) continue;   // not two passages that touch
    out.push(item); if (out.length >= lim) break;
  }
  out.dups = dups.slice(0, 4); return out;
}
/* the motifs a result passage shares with the query, by name index */
function simSharedMotifs(P, emb, i) { const out = []; if (!P.mo || !emb.motifs) return out; for (let k = 0; k < 3; k++) { const id = P.mo[i * 3 + k]; if (id === 255) break; if (emb.motifs.some(([m]) => m === id)) out.push(id); } return out; }
/* lexical overlap between a query and a passage's text: the cosine of their TF-IDF word weights, and the shared words */
function simLexical(P, emb, text) {
  const cnt = new Map(); const raw = new Map(); for (const [t, r] of simTerms(text, true)) { const id = P.vocab.get(t); if (id === undefined) continue; cnt.set(id, (cnt.get(id) || 0) + 1); if (!raw.has(id)) raw.set(id, r); }
  let nn = 0; const w = new Map(); for (const [id, f] of cnt) { const x = (1 + Math.log(f)) * P.idf[id]; w.set(id, x); nn += x * x; } nn = Math.sqrt(nn) || 1;
  let dot = 0; const shared = []; for (const [id, x] of w) { const y = emb.w.get(id); if (y !== undefined) { const v = (x / nn) * y; dot += v; shared.push([v, id]); } }
  shared.sort((a, b) => b[0] - a[0]); return { lex: dot, shared: shared.map(([v, id]) => ({ id, term: P.info ? P.info.vocab[id] : '', weight: v, raw: raw.get(id) })), raw };
}
/* from a search's passages to what the page shows. A story spreads over several passages, so passages are gathered by the section they are in: a section is scored by its best passage
   plus a third of the next two (so a stretch where several passages match beats a lone lucky one, without a long section winning just by being long). Each tradition keeps its best
   two sections. o.collOf(id) → the tradition's index; o.bonus(id) → extra for a book that scholars have set beside the passage's own (the curated Parallels); o.perTrad = 2.
   A tradition may also show a third and a fourth section (o.cap = 4 in all) when each reads nearly as close as the closest match anywhere on the page (o.strong = 0.85: its region is at
   least 85% of the best region of all) and is from a book the tradition does not already show. The scores of a tradition's runners-up lie close together, so "nearly ties the second" is
   true of most of them (measured on 16 November 2026 over 82 searches: a third section within 2% of the second came to 260 extra cards, 3 more on a page of 18, and half of them were a
   second passage of a book already shown); "nearly as close as the best match of the whole page" came to 72 extra cards with a cap of three (0.9 a page) and 121 with a cap of four
   (1.5 a page; the longest page 27 cards), each from a new book. */
const SIM_SHOW = { perTrad: 2, cap: 4, strong: 0.85 };      // what the page shows; the benchmark and the tests use it too
function simGroup(res, o) {
  o = o || {}; const reg = new Map();
  for (const r of res) { const k = r.id + '#' + r.sec; let g = reg.get(k); if (!g) { g = { id: r.id, sec: r.sec, list: [] }; reg.set(k, g); } g.list.push(r); }
  const secs = [...reg.values()].map((g) => {
    g.list.sort((a, b) => b.score - a.score); const rest = g.list.slice(1, 3).map((x) => x.score); const more = rest.length ? rest.reduce((a, b) => a + b, 0) / 2 : 0;
    const bonus = o.bonus && g.list[0].score >= 3.5 ? o.bonus(g.id) : 0; g.region = g.list[0].score + 0.35 * more + bonus; g.bonus = bonus; g.best = g.list[0]; g.near = g.list.length - 1; return g;
  });
  secs.sort((a, b) => b.region - a.region); const per = o.perTrad || 2; const cap = Math.max(per, o.cap || 0); const best = secs.length ? secs[0].region : 1;
  const by = new Map(); for (const g of secs) {
    const c = o.collOf ? o.collOf(g.id) : 0; if (!by.has(c)) by.set(c, []); const l = by.get(c);
    if (l.length && g.region < 0.75 * l[0].region) continue;
    if (l.length < per || (l.length < cap && o.strong && g.region >= o.strong * best && !l.some((x) => x.id === g.id))) l.push(g);
  }
  const groups = [...by.entries()].map(([c, list]) => ({ coll: c, items: list, best: list[0].region })).sort((a, b) => b.best - a.best); const top = groups.length ? groups[0].best : 1;
  return { groups, top };
}
if (typeof module !== 'undefined' && module.exports) module.exports = { SIM_STOP, SIM_ALIAS, SIM_SYN, SIM_SHOW, simStem, simTerms, simCut, simStrip, simJoin, simPrepare, simEmbed, simSearch, simLexical, simBytes, simJunk, simGroup, simSharedMotifs };
