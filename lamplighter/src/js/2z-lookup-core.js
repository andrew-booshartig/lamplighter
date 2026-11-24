/* ═══════════════════════════ 2z · Looking a word up ═══════════════════════════
   Pure functions. Select a word or a few in the reader and "Look up" says what the Lamplighter Project's own glossary of religious words and names knows about it (it works offline, and each entry is a first
   orientation, not the last word), and offers links to look further. Nothing is fetched or sent: the outside links (Wiktionary for a word, Wikipedia for a name or phrase) only
   open when the reader chooses them, and are built from the selected words alone, on two fixed sites.
   A glossary entry may also be known by other names and spellings (opts.also) and by patterns for the spellings a scan of an old book garbles (opts.like): see 2z-terms-core.js. */
const luNorm = (s) => String(s == null ? '' : s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']s\b/g, '').replace(/([a-z0-9])[’'](?=[a-z0-9])/g, '$1').replace(/[^a-z0-9]+/g, ' ').trim();      // an apostrophe between letters joins them (Ma’at, Bahá’í), and a possessive 's goes
/* a rough stem, so "Sabbaths" finds "Sabbath", "Pharisees" finds "Pharisee" and "climates" finds "climate" (not a real stemmer: both sides are stemmed the same way, which is all a match needs).
   "-es" is cut only after s, x, z, ch and sh ("boxes", "churches"); elsewhere only the "s" goes, so a word that ends in "e" keeps it. */
const luStem = (w) => {
  if (w.length <= 4) return w;
  if (/ies$/.test(w)) return w.replace(/ies$/, 'y');
  if (/(?:s|x|z|ch|sh)es$/.test(w)) return w.slice(0, -2);
  if (/[^s]s$/.test(w)) return w.slice(0, -1);
  return w;
};
const luWords = (s) => luNorm(s).split(' ').filter(Boolean);
/* every name an entry answers to: its term, then any other names and spellings it lists */
const luNames = (g) => [g && g[0]].concat(g && g[5] && Array.isArray(g[5].also) ? g[5].also : []).filter((n) => typeof n === 'string' && n);
const luKey = (name) => luWords(name).map(luStem).join(' ');
/* what the glossary knows about the selected words: entries with a name that is the whole phrase come first, then entries with a pattern that fits a garbled spelling of one word,
   then entries that share a word of four letters or more with it. glossary: [[term, tradition, language, meaning, ids, opts?], …] */
function luGloss(sel, glossary) {
  const text = String(sel == null ? '' : sel).slice(0, 160); const sw = luWords(text); if (!sw.length || sw.length > 8 || !Array.isArray(glossary)) return [];
  const whole = sw.map(luStem).join(' '); const out = []; const seen = new Set();
  for (const g of glossary) { if (!g || !g[0]) continue; if (luNames(g).some((n) => luKey(n) === whole)) { out.push({ entry: g, how: 'exact' }); seen.add(g[0]); } }
  if (sw.length === 1 && sw[0].length >= 5 && /^[^\p{L}]*\p{Lu}/u.test(text)) {
    for (const g of glossary) {
      if (!g || !g[0] || seen.has(g[0]) || !g[5] || !Array.isArray(g[5].like)) continue;
      if (g[5].like.some((src) => { try { return new RegExp('^(?:' + src + ')$').test(sw[0]); } catch (e) { return false; } })) { out.push({ entry: g, how: 'like' }); seen.add(g[0]); }
    }
  }
  const big = new Set(sw.filter((w) => w.length >= 4).map(luStem));
  if (big.size) for (const g of glossary) { if (!g || !g[0] || seen.has(g[0])) continue; if (luNames(g).some((n) => luWords(n).some((w) => w.length >= 4 && big.has(luStem(w))))) { out.push({ entry: g, how: 'word' }); seen.add(g[0]); } }
  return out.slice(0, 6);
}
/* links for looking further: Wiktionary for one word, Wikipedia's search for anything. Only letters, marks, hyphens, apostrophes and spaces are passed on; the sites are fixed. */
function luLinks(sel) {
  const t = String(sel == null ? '' : sel).replace(/\s+/g, ' ').trim().slice(0, 100); const clean = t.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''); if (!clean || !/\p{L}/u.test(clean)) return { word: '', wiki: '', text: '' };
  const one = /^[\p{L}\p{M}'’-]+$/u.test(clean);
  return { text: clean, word: one ? 'https://en.wiktionary.org/wiki/' + encodeURIComponent(clean.replace(/’/g, "'")) : '', wiki: 'https://en.wikipedia.org/w/index.php?search=' + encodeURIComponent(clean) };
}
if (typeof module !== 'undefined' && module.exports) module.exports = { luNorm, luStem, luWords, luNames, luKey, luGloss, luLinks };
