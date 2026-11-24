/* ═══════════════════════════ 2z · Word help: finding glossary words in a page of text ═══════════════════════════
   Pure functions. The reader and the random-passage page underline the names and terms the glossary can explain, and a tap opens a short card (6zw-words.js). This file is the finding: it
   indexes the glossary once, then reads one paragraph and says which words in it are which entry. Nothing here touches the page or the network.
   A glossary entry is [term, tradition(s), language, meaning, [tradition ids], opts?], and opts may hold:
     also  other names and spellings of the same thing, each found exactly as the term is ("Ormazd" for Ahura Mazda);
     like  patterns (regular-expression text) for the spellings a scan garbles. They are tried only on a capitalised word of five letters or more, against its lower-case, accent-free form.
           A scan of West's Pahlavi Texts prints Auharmazd thirty different ways (Atharmazd, Athaymazd, Adhaymazd…) and no list of spellings would keep up;
     at    the library groups (ir, in, nt…) or text ids where the whole entry applies; absent means everywhere. It is for entries about ordinary English words that carry a particular
           meaning in some books ("climate", "apostleship"), so that a chapter of the Bible is never marked up for them;
     plain ordinary English words that are this entry's name only in the texts listed in `in` (West's "the resurrection" for the Frashegird, "fiend" for a daeva). One card then serves
           both the foreign name, wherever it turns up, and the translator's English, only where it means this;
     see   the terms of other entries worth reading next;
     mark  false keeps the entry out of the text altogether (it is for the Glossary page and Look up only): De, Li and Me are written in lower case in the translations, and the capitalised forms are a French
           word, a surname and a pronoun.
   The first mention of each entry in a section is the one marked (or every mention, as the reader chooses), and words inside a highlight are left to the highlight. */
if (typeof luNorm === 'undefined' && typeof require === 'function') Object.assign(globalThis, require('./2z-lookup-core.js'));   // alone in a node test; in the page the lookup core is already there
const TRM_MODES = { first: 'First mention', every: 'Every mention', off: 'Off' };
const TRM_MAXW = 4;                                   // the longest name found: four words
const TRM_GAP = /^[\s\-‐‑]+$/;                        // two words are one name only if nothing but spaces or a hyphen lies between them
const TRM_TOK = /[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}]+)*/gu;      // a word, letters and digits together (B29, K35), with an inner apostrophe (Zarathustra’s)
const trmOpts = (g) => (g && g.length > 5 && g[5] && typeof g[5] === 'object' ? g[5] : {});
const trmList = (v) => (Array.isArray(v) ? v.filter((s) => typeof s === 'string' && s.trim()) : []);
/* is this text one of those named (by library group or by text id)? ctx: { id, group } of the text being read */
const trmIn = (list, ctx) => !!(ctx && (list.includes(ctx.id) || list.includes(ctx.group)));
/* does the entry apply in this text? */
const trmApplies = (g, ctx) => { const at = trmList(trmOpts(g).at); return !at.length || trmIn(at, ctx); };
/* every name the entry answers to in this text: its own names and spellings, and its plain English words where they apply */
const trmNamesIn = (g, ctx) => luNames(g).concat(trmIn(trmList(trmOpts(g).in), ctx) ? trmList(trmOpts(g).plain) : []);

/* the index for one text: every name an applicable entry answers to, as stemmed words → the entry's place in the glossary */
function trmIndex(glossary, ctx) {
  const names = new Map(); const pats = []; let maxW = 1; let count = 0;
  (Array.isArray(glossary) ? glossary : []).forEach((g, k) => {
    if (!g || typeof g[0] !== 'string' || trmOpts(g).mark === false || !trmApplies(g, ctx)) return; count++;
    const where = trmList(trmOpts(g).at).length > 0; const plain = trmIn(trmList(trmOpts(g).in), ctx) ? trmList(trmOpts(g).plain) : [];
    trmNamesIn(g, ctx).forEach((nm) => {
      const ws = luWords(nm).map(luStem); if (!ws.length || ws.length > TRM_MAXW) return;
      if (ws.join('').length <= 3 && !where && !plain.includes(nm)) return;                 // a name of three letters or fewer (De, Me, Ka, Om) is only marked where the entry says where: elsewhere it is mostly a different word
      if (!names.has(ws.join(' '))) names.set(ws.join(' '), k); if (ws.length > maxW) maxW = ws.length;
    });
    trmList(trmOpts(g).like).forEach((src) => { try { pats.push({ re: new RegExp('^(?:' + src + ')$'), k }); } catch (e) { /* a bad pattern is skipped (tests/terms.test.js names it) */ } });
  });
  return { names, pats, maxW, count };
}

/* the words of a paragraph that are glossary entries, in reading order and not overlapping: [{ a, b, k }] (character range in the text, glossary place).
   o.seen: a Set of entries already marked in this section (first mention only: it is added to); o.skip: ranges [a, b] to leave alone, such as highlights. */
function trmFind(text, ix, o) {
  const out = []; if (!ix || !ix.names || typeof text !== 'string' || text.length < 3) return out;
  const seen = o && o.seen instanceof Set ? o.seen : null; const skip = o && Array.isArray(o.skip) ? o.skip : [];
  const cache = new Map(); const toks = []; const re = new RegExp(TRM_TOK.source, 'gu'); let m;
  while ((m = re.exec(text))) {
    const raw = m[0]; let nm = cache.get(raw); if (nm === undefined) { nm = luNorm(raw); cache.set(raw, nm); }
    toks.push({ a: m.index, b: m.index + raw.length, raw, nm, w: nm && nm.indexOf(' ') < 0 ? luStem(nm) : '' });
  }
  const inSkip = (a, b) => skip.some((r) => a < r[1] && b > r[0]);
  for (let i = 0; i < toks.length;) {
    let hit = null;
    for (let n = Math.min(ix.maxW, toks.length - i); n >= 1 && !hit; n--) {
      const ws = []; let ok = true;
      for (let j = 0; j < n && ok; j++) { const t = toks[i + j]; if (!t.w || (j && !TRM_GAP.test(text.slice(toks[i + j - 1].b, t.a)))) ok = false; else ws.push(t.w); }
      if (!ok) continue; const k = ix.names.get(ws.join(' '));
      if (k !== undefined && !(n === 1 && ws[0].length <= 3 && !/^\p{Lu}/u.test(toks[i].raw))) hit = { k, n };      // a very short name (Om) counts only when written with a capital
    }
    if (!hit && ix.pats.length) { const t = toks[i]; if (t.nm.length >= 5 && t.nm.indexOf(' ') < 0 && /^\p{Lu}/u.test(t.raw)) { const p = ix.pats.find((q) => q.re.test(t.nm)); if (p) hit = { k: p.k, n: 1 }; } }
    if (!hit) { i++; continue; }
    const last = toks[i + hit.n - 1]; const a = toks[i].a; const b = /['’]s$/i.test(last.raw) ? last.b - 2 : last.b;      // "Zaratust’s": the name is marked, not the 's
    if (!inSkip(a, b) && !(seen && seen.has(hit.k))) { out.push({ a, b, k: hit.k }); if (seen) seen.add(hit.k); }
    i += hit.n;
  }
  return out;
}

/* what the card shows for an entry. shown: the words as the page prints them, so the card can say when that is only a variant spelling. */
function trmCard(g, shown) {
  const o = trmOpts(g); const mine = luNames(g).concat(trmList(o.plain)).map(luKey); const key = shown ? luKey(shown) : '';
  return { term: g[0], kin: g[1], lang: g[2], meaning: g[3], ids: Array.isArray(g[4]) ? g[4] : [], also: trmList(o.also).slice(0, 10), see: trmList(o.see).slice(0, 4), variant: !!key && !mine.includes(key) };
}
if (typeof module !== 'undefined' && module.exports) module.exports = { TRM_MODES, TRM_MAXW, TRM_TOK, trmOpts, trmList, trmIn, trmApplies, trmNamesIn, trmIndex, trmFind, trmCard };
