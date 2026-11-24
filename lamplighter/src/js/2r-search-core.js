/* ═══════════════════════════ 2r · Full-text search: the matching core ═══════════════════════════
   Pure functions, no page. A query is words, "exact phrases", alternatives (love|mercy or love OR mercy) and -excluded words. Matching ignores case,
   accents and the transliteration marks of Sanskrit and Pali, punctuation, and verse numbers, so "Uta-Napishtim", "uta napishtim" and "Utā-Napishtim" are
   the same. A few spelling variants (Jehovah/Yahweh, Gilgamish/Gilgamesh, honour/honor) are searched together unless that is switched off.
   Words must be found in the same paragraph (or, looser, the same section); a hit is a paragraph. Nothing is indexed or stored: the page scans the texts
   one by one, which takes about a second for the whole library. */
const SEARCH_SEP = '[\\s\\d\\[\\]"\'“”‘’(),.;:!?…—–*_/-]{1,14}';
/* the letters of a word: Latin with its accents, and the other scripts a text of your own may be in (Greek, Cyrillic, Armenian, Hebrew, Arabic, the Indian scripts, Georgian, Ethiopic) */
const SEARCH_WORDCH = 'A-Za-z0-9\\u00C0-\\u024F\\u1E00-\\u1EFF\\u0370-\\u03FF\\u1F00-\\u1FFF\\u0400-\\u052F\\u0530-\\u058F\\u0590-\\u05FF\\u0600-\\u06FF\\u0750-\\u077F\\uFB1D-\\uFDFF\\uFE70-\\uFEFF\\u0900-\\u0DFF\\u10A0-\\u10FF\\u1200-\\u137F';
const SEARCH_MARKS = '\\u0591-\\u05C7\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06ED';      // Hebrew points and cantillation, Arabic vowels and recitation signs: a word is the same with or without them
const SEARCH_WORD1 = new RegExp('[' + SEARCH_WORDCH + SEARCH_MARKS + ']');
const SEARCH_ACCENT = { a: 'aàáâãäåāăąǎ', c: 'cçćč', d: 'dḍđð', e: 'eèéêëēěęė', g: 'gğ', h: 'hḥ', i: 'iìíîïīĩı', l: 'lḷł', m: 'mṃṁ', n: 'nñńňṅṇ', o: 'oòóôõöōőø', r: 'rṛřṝ', s: 'sśšşṣß', t: 'tṭţ', u: 'uùúûüūůű', y: 'yýÿ', z: 'zźżž' };
/* spellings of one name or word; each group is searched together. Only variant spellings, never different ideas. */
const SEARCH_ALIASES = [
  ['yahweh', 'jehovah', 'yhwh'], ['gilgamesh', 'gilgamish'], ['utnapishtim', 'uta-napishtim', 'ut-napishtim', 'utanapishtim'], ['muhammad', 'mohammed', 'mahomet', 'muhammed'],
  ['quran', "qur'an", 'koran'], ['zoroaster', 'zarathustra', 'zarathushtra'], ['inanna', 'innini'], ['marduk', 'merodach'], ['dao', 'tao'], ['daoism', 'taoism'], ['daode jing', 'tao te ching', 'tao teh king'],
  ['laozi', 'lao tzu', 'lao-tzu', 'lao tse'], ['zhuangzi', 'chuang tzu', 'chuang-tzu'], ['confucius', 'kongzi', "k'ung"], ['krishna', 'krsna'], ['shiva', 'siva'], ['vishnu', 'visnu'], ['nirvana', 'nibbana'],
  ['dharma', 'dhamma'], ['karma', 'kamma'], ['sutra', 'sutta'], ['arhat', 'arahant'], ['moses', 'moshe'], ['hebrews', 'hebrew'], ['neighbor', 'neighbour'], ['honor', 'honour'], ['savior', 'saviour'],
  ['favor', 'favour'], ['labor', 'labour'], ['color', 'colour'], ['judgment', 'judgement'], ['plowshare', 'ploughshare'], ['scepter', 'sceptre'], ['mold', 'mould'],
];
/* letters that are the same letter for searching: Greek and Cyrillic with every accent and breathing (built from the Unicode tables, so each base letter gathers all its accented forms), the Greek final sigma, the five Hebrew final forms, and the Arabic and Persian spellings of alef, yeh and kaf */
const SEARCH_EQUIV = (() => {
  const groups = Object.create(null); const put = (b, ch) => { (groups[b] = groups[b] || new Set([b])).add(ch); };
  const fold = (lo, hi) => { for (let c = lo; c <= hi; c++) { const ch = String.fromCharCode(c).toLowerCase(); const b = ch.normalize('NFD').replace(/[̀-ͯ]/g, ''); if (b && b !== ch && b.length === 1) put(b, ch); } };
  fold(0x0370, 0x03FF); fold(0x1F00, 0x1FFF); fold(0x0400, 0x04FF);
  [['σ', 'ς'], ['כ', 'ך'], ['מ', 'ם'], ['נ', 'ן'], ['פ', 'ף'], ['צ', 'ץ'], ['ا', 'ٱ'], ['ا', 'أ'], ['ا', 'إ'], ['ا', 'آ'], ['ي', 'ى'], ['ي', 'ی'], ['ك', 'ک']].forEach(([b, ch]) => put(b, ch));
  const out = Object.create(null); for (const b of Object.keys(groups)) { const str = [...groups[b]].join(''); groups[b].forEach((x) => { out[x] = str; }); }
  return out;
})();
const stripMarks = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(new RegExp('[' + SEARCH_MARKS + ']', 'g'), '');
const searchKey = (s) => stripMarks(s).toLowerCase().replace(/[’‘`]/g, "'").replace(/\s+/g, ' ').trim();
const ALIAS_OF = Object.create(null); /* no prototype: a search for “constructor” or “__proto__” must not find Object's own members */ SEARCH_ALIASES.forEach((g) => g.forEach((w) => { ALIAS_OF[searchKey(w)] = g; }));
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* one word or phrase → regex source that tolerates accents, case, punctuation and verse numbers between words */
function termSource(term) {
  const t = searchKey(term); let out = '';
  for (const ch of t) {
    if (ch === ' ') out += SEARCH_SEP;
    else if (ch === '-') out += '[\\s\\-‐‑–—]*';
    else if (ch === "'") out += "['’‘`]?";
    else if (SEARCH_ACCENT[ch]) out += '[' + SEARCH_ACCENT[ch] + ']';
    else if (SEARCH_EQUIV[ch]) out += '[' + SEARCH_EQUIV[ch] + ']' + (/[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F]/.test(ch) ? '[' + SEARCH_MARKS + ']*' : '');
    else if (/[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\uFB1D-\uFDFF\uFE70-\uFEFF]/.test(ch)) out += escapeRe(ch) + '[' + SEARCH_MARKS + ']*';
    else out += escapeRe(ch);
  }
  return out;
}
/* "love your enemies" -peace mercy|pity forgive OR pardon → { terms: [{ label, alts: [..] }], not: [...] } */
function parseQuery(raw) {
  const q = String(raw || '').trim().slice(0, 400); /* a longer pasted string cannot be a search: the regular-expression engine refuses a pattern that large */ const terms = []; const not = []; if (!q) return { terms, not, raw: q };
  const toks = []; const re = /(-?)"([^"]+)"|(\S+)/g; let m;
  while ((m = re.exec(q))) { if (m[2] != null) toks.push({ neg: m[1] === '-', text: m[2].trim(), phrase: true }); else if (m[3] === 'OR' || m[3] === '|') toks.push({ or: true }); else toks.push({ neg: m[3][0] === '-' && m[3].length > 1, text: m[3][0] === '-' && m[3].length > 1 ? m[3].slice(1) : m[3], phrase: false }); }
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i]; if (t.or) continue; if (!t.text) continue;
    if (t.neg) { not.push(t.text); continue; }
    const alts = t.text.split('|').map((x) => x.trim()).filter(Boolean);
    while (toks[i + 1] && toks[i + 1].or && toks[i + 2] && !toks[i + 2].neg && toks[i + 2].text) { alts.push(...toks[i + 2].text.split('|').map((x) => x.trim()).filter(Boolean)); i += 2; }
    terms.push({ label: t.text, alts, phrase: !!t.phrase });
  }
  return { terms: terms.slice(0, 8), not: not.slice(0, 5), raw: q };
}
/* compiled query: a regex per term (and per excluded word). opts: whole (whole words only), alias (spelling variants, default on), mode ('para' | 'sect') */
function compileQuery(raw, opts = {}) {
  const pq = parseQuery(raw); const whole = !!opts.whole; const useAlias = opts.alias !== false; const aliasUsed = new Set();
  const tail = whole ? '(?![' + SEARCH_WORDCH + '])' : '';
  const build = (alts) => {
    const all = []; alts.forEach((a) => { all.push(a); if (useAlias) { const g = ALIAS_OF[searchKey(a)]; if (g) g.forEach((w) => { if (searchKey(w) !== searchKey(a)) { all.push(w); aliasUsed.add(w); } }); } });
    const uniq = [...new Set(all.map(searchKey))].filter(Boolean); if (!uniq.length) return null;
    const src = '(^|[^' + SEARCH_WORDCH + '])(' + uniq.map(termSource).join('|') + ')' + tail;
    try { return new RegExp(src, 'gi'); } catch (e) { return null; }
  };
  const terms = pq.terms.map((t) => ({ label: t.label, phrase: t.phrase, re: build(t.alts) })).filter((t) => t.re);
  const not = pq.not.map((w) => build([w])).filter(Boolean);
  return { terms, not, mode: opts.mode === 'sect' ? 'sect' : 'para', raw: pq.raw, aliases: [...aliasUsed], whole, empty: !terms.length };
}
/* first match of a term in text from a position: { a, b } of the term itself (not the boundary character) */
function termFind(re, text, from = 0) {
  re.lastIndex = from; const m = re.exec(text); if (!m) return null; const a = m.index + m[1].length; return { a, b: a + m[2].length };
}
const termHas = (re, text) => { re.lastIndex = 0; return re.test(text); };
/* the excerpt of a paragraph around a hit: from the start of its sentence to the end of the sentence that carries the last matched word, in about `max` characters */
function excerptAround(vis, a, b, max = 360) {
  let s = a; const back = vis.slice(Math.max(0, a - 180), a); const k = back.search(/[.!?]["”’')\]]*\s+[^.!?]*$/);
  if (k >= 0) { const m = back.slice(k).match(/^[.!?]["”’')\]]*\s+/); s = Math.max(0, a - 180) + k + m[0].length; } else if (a <= 180) s = Math.max(0, vis.search(/\S/));
  const endOf = (from) => { const m = vis.slice(from, from + 260).match(/^[^.!?]*[.!?]["”’')\]]*/); return m ? from + m[0].length : Math.min(vis.length, from + 120); };
  let e = endOf(b); // the end of the sentence that holds the last matched word, then more sentences while the excerpt is still short
  while (e - s < 70 && e < vis.length) { const nx = endOf(e); if (nx - s > max) break; e = nx; }
  return { s, e, text: vis.slice(s, e).trim(), lead: vis.slice(s, e).length - vis.slice(s, e).trimStart().length };
}
/* an excerpt as safe HTML with every query term marked */
function snippetHTML(text, cq) {
  const ranges = [];
  cq.terms.forEach((t) => { let from = 0; let f; let guard = 0; while ((f = termFind(t.re, text, from)) && guard++ < 50) { let e = f.b; if (!cq.whole) while (e < text.length && SEARCH_WORD1.test(text[e])) e++; ranges.push([f.a, e]); from = Math.max(e, from + 1); } });
  ranges.sort((x, y) => x[0] - y[0]); let out = ''; let pos = 0;
  ranges.forEach(([a, b]) => { if (a < pos) { if (b > pos) { out += '<mark>' + MARK_ESC(text.slice(pos, b)) + '</mark>'; pos = b; } return; } out += MARK_ESC(text.slice(pos, a)) + '<mark>' + MARK_ESC(text.slice(a, b)) + '</mark>'; pos = b; });
  return out + MARK_ESC(text.slice(pos));
}
/* search one text (an array of [heading, text] sections). opts: skip(body) → true to ignore a paragraph (e.g. not English), maxHits, count (count only, no excerpts) */
function searchSections(secs, cq, opts = {}) {
  const maxHits = opts.maxHits == null ? 25 : opts.maxHits; const hits = []; let count = 0; let sections = 0;
  if (cq.empty) return { count, hits, sections };
  for (let s = 0; s < secs.length; s++) {
    const raw = secs[s][1]; let ok = true;
    for (const t of cq.terms) { if (!termHas(t.re, raw)) { ok = false; break; } }
    if (!ok) continue;
    if (cq.mode === 'sect') { for (const n of cq.not) { if (termHas(n, raw)) { ok = false; break; } } }
    if (!ok) continue;
    const blocks = textBlocks(raw); let secHit = false;
    if (cq.mode === 'sect') {
      // every word is somewhere in the section: the hit is the paragraph that has the first word
      for (let p = 0; p < blocks.length; p++) {
        const body = blockParts(blocks[p]).body; if (!body.trim() || (opts.skip && opts.skip(body))) continue; const vis = visibleText(body); const f = termFind(cq.terms[0].re, vis); if (!f) continue;
        count++; secHit = true; if (hits.length < maxHits && !opts.count) { const ex = excerptAround(vis, f.a, f.b); hits.push({ s, p, a: f.a, b: f.b, q: ex.text, qa: ex.s + ex.lead, heading: secs[s][0], f: vis.slice(f.a, f.b), n: 1 }); } break;
      }
      if (secHit) sections++; continue;
    }
    for (let p = 0; p < blocks.length; p++) {
      const body = blockParts(blocks[p]).body; if (!body.trim()) continue;
      const vis = visibleText(body); let first = null; let last = null; let good = true;
      for (const t of cq.terms) { const f = termFind(t.re, vis); if (!f) { good = false; break; } if (!first) first = f; if (!last || f.b > last.b) last = f; if (f.a < first.a) first = f; }
      if (!good) continue;
      if (cq.not.some((n) => termHas(n, vis))) continue;
      if (opts.skip && opts.skip(body)) continue;
      count++; secHit = true;
      if (hits.length < maxHits && !opts.count) {
        const lo = Math.min(first.a, termFind(cq.terms[0].re, vis).a); const ex = excerptAround(vis, lo, Math.min(vis.length, Math.max(last.b, lo + 1)));
        const f0 = termFind(cq.terms[0].re, vis); hits.push({ s, p, a: ex.s + ex.lead, b: ex.s + ex.lead + ex.text.length, q: ex.text, heading: secs[s][0], f: vis.slice(f0.a, f0.b), n: 1 });
      }
    }
    if (secHit) sections++;
  }
  return { count, hits, sections };
}
/* search several texts' worth of results into one ordered list (the page streams texts in one at a time; this is the same thing in one go, for tests and small sets) */
function searchAll(texts, cq, opts = {}) { const out = []; Object.keys(texts).forEach((id) => { const r = searchSections(texts[id].secs || texts[id], cq, opts); if (r.count) out.push(Object.assign({ id }, r)); }); return out; }
/* occurrences of a query per 100,000 characters in a set of texts: used by the "common ground" word map */
function termDensity(secs, cq) {
  let chars = 0; let n = 0;
  secs.forEach((sec) => { const t = sec[1]; chars += t.length; cq.terms.forEach((term) => { let from = 0; let f; let guard = 0; while ((f = termFind(term.re, t, from)) && guard++ < 100000) { n++; from = Math.max(f.b, from + 1); } }); });
  return { n, chars };
}
/* the books whose title has the words that were typed: the words together first, then in order, then anywhere, a short title before a long one. (The passage search looks inside the texts, so someone who types the name of a book gets passages that mention it; this puts the book itself first.) Only books that can be read here are offered. */
function searchBooks(lib, meta, q, max = 8) {
  if (!meta || /\||\bOR\b/.test(q)) return [];
  const words = searchKey(String(q).replace(/["“”()]/g, ' ')).split(/\s+/).filter((w) => w.length > 1 && w[0] !== '-');
  if (!words.length || words.length > 6) return [];
  const phrase = words.join(' '); const hits = [];
  lib.forEach((l) => { if (!meta[l.id]) return; const hay = searchKey(l.title); if (!words.every((w) => hay.includes(w))) return; const at = words.map((w) => hay.indexOf(w)); const inOrder = at.every((v, i) => i === 0 || v > at[i - 1]); hits.push([l, hay.includes(phrase) ? 0 : inOrder ? 1 : 2, hay.length]); });
  return hits.sort((a, b) => a[1] - b[1] || a[2] - b[2]).slice(0, max).map((h) => h[0]);
}
if (typeof module !== 'undefined' && module.exports) module.exports = { SEARCH_ALIASES, searchKey, termSource, parseQuery, compileQuery, termFind, excerptAround, snippetHTML, searchSections, searchAll, termDensity, searchBooks };
