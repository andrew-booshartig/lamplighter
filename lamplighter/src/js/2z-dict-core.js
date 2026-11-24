/* ═══════════════════════════ 2z · The dictionary: Webster's 1913, offline ═══════════════════════════
   Pure functions, plus the small registrar that the data files call. dictionary/ (next to texts/) is built by tools/build_dictionary.py from Webster's Revised Unabridged Dictionary, 1913
   (public domain; Project Gutenberg eBook #29765): 113,000 entries in 19 script files of about a megabyte each, kept in the order of their lookup key, so a lookup loads one file (two when a spelling points
   to another word). Each file calls BEATLAB_DICT.add(id, rows) and index.js calls BEATLAB_DICT.addIndex({ chunks: [[id, first key, count], …], … }), as the texts do: it works from file:// and nothing is fetched.
   A row is a full entry [heads, syllables, part of speech, senses, synonyms, care] or a pointer [key, key it points to, what it is there] (a variant spelling, or a derived form such as an adverb).
   What it leaves out (etymologies, quotations, long notes) and why is in tools/build_dictionary.py and FACT_CHECK.md. The key is the same in Python and here: dkNorm = norm_key in the tool. */
globalThis.BEATLAB_DICT = globalThis.BEATLAB_DICT || {
  meta: null, by: {}, order: [], keep: 5,                      // the files loaded now, by id (each a Map from key to rows); at most `keep` are held, the oldest let go
  addIndex(idx) { this.meta = idx; },
  add(id, rows) {
    const by = new Map();
    for (const r of rows) { const k = Array.isArray(r[0]) ? dkNorm(r[0][0]) : r[0]; const a = by.get(k); if (a) a.push(r); else by.set(k, [r]); }
    this.by[id] = by; this.order = this.order.filter((x) => x !== id); this.order.push(id);
    while (this.order.length > this.keep) delete this.by[this.order.shift()];
    return by;
  },
  has(id) { return !!this.by[id]; },
};
/* the key a word is looked up by: no accents, æ as ae, œ as oe, lower case, anything but letters and digits as one space */
const dkNorm = (s) => String(s == null ? '' : s).replace(/[Ææ]/g, 'ae').replace(/[Œœ]/g, 'oe').replace(/ß/g, 'ss').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
/* which file holds a key: the last whose first key is not after it ('' when the key sorts before everything, or there is no index) */
function dkChunkOf(meta, key) {
  const ch = meta && meta.chunks; if (!Array.isArray(ch) || !ch.length || !key) return '';
  let lo = 0; let hi = ch.length - 1; let at = -1;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (ch[mid][1] <= key) { at = mid; lo = mid + 1; } else hi = mid - 1; }
  return at < 0 ? '' : ch[at][0];
}
/* what a word that is not an entry itself may be a form of, in the order to try: [stem, how]. Webster's own entries for odd forms (went, begot, children) are found first, as the word itself. */
const DK_HOW = { plural: 'a plural, or the -s form of a verb, of', past: 'the past tense or past participle of', ing: 'the -ing form of', archaic: 'an old-fashioned verb form (thou … -est, he … -eth) of', comp: 'the comparative of', super: 'the superlative of', adv: 'an adverb made from', noun: 'a noun made from', latin: 'the plural of', spelling: 'the British or older spelling of' };
function dkStems(w) {
  const out = []; const n = w.length;
  const add = (s, how) => { if (s && s.length >= 2 && s !== w && !out.some((o) => o[0] === s)) out.push([s, how]); };
  const one = (s) => (/([b-df-hj-np-tv-z])\1$/.test(s) ? s.slice(0, -1) : '');                          // stopp → stop
  if (n > 3 && /ies$/.test(w)) add(w.slice(0, -3) + 'y', 'plural');
  if (n > 3 && /ves$/.test(w)) { add(w.slice(0, -3) + 'f', 'plural'); add(w.slice(0, -3) + 'fe', 'plural'); }
  if (n > 3 && /(?:s|x|z|ch|sh)es$/.test(w)) add(w.slice(0, -2), 'plural');
  if (n > 2 && /[^s]s$/.test(w)) add(w.slice(0, -1), 'plural');
  if (n > 4 && /ses$/.test(w)) add(w.slice(0, -2) + 'is', 'latin');                                     // analyses → analysis
  if (n > 4 && /ices$/.test(w)) { add(w.slice(0, -4) + 'ex', 'latin'); add(w.slice(0, -4) + 'ix', 'latin'); }
  if (n > 3 && /men$/.test(w)) add(w.slice(0, -3) + 'man', 'latin');
  if (n > 3 && /i$/.test(w)) { add(w.slice(0, -1) + 'us', 'latin'); add(w.slice(0, -1) + 'o', 'latin'); }
  if (n > 3 && /ae$/.test(w)) add(w.slice(0, -1), 'latin');
  if (n > 3 && /a$/.test(w)) { add(w.slice(0, -1) + 'um', 'latin'); add(w.slice(0, -1) + 'on', 'latin'); }
  if (n > 4 && /ied$/.test(w)) add(w.slice(0, -3) + 'y', 'past');
  if (n > 3 && /ed$/.test(w)) { add(w.slice(0, -2), 'past'); add(w.slice(0, -1), 'past'); add(one(w.slice(0, -2)), 'past'); }
  if (n > 4 && /ying$/.test(w)) add(w.slice(0, -4) + 'ie', 'ing');                                       // dying → die
  if (n > 4 && /ing$/.test(w)) { add(w.slice(0, -3), 'ing'); add(w.slice(0, -3) + 'e', 'ing'); add(one(w.slice(0, -3)), 'ing'); }
  if (n > 4 && /est$/.test(w)) { add(w.slice(0, -3), 'archaic'); add(w.slice(0, -2), 'archaic'); add(one(w.slice(0, -3)), 'super'); }       // knowest → know, mayest → may
  if (n > 4 && /st$/.test(w)) add(w.slice(0, -2), 'archaic');                                            // shouldst → should
  if (n > 4 && /eth$/.test(w)) { add(w.slice(0, -3), 'archaic'); add(w.slice(0, -2), 'archaic'); }       // goeth → go, loveth → love
  if (n > 3 && /th$/.test(w)) add(w.slice(0, -2), 'archaic');                                            // maketh → make
  if (n > 4 && /iest$/.test(w)) add(w.slice(0, -4) + 'y', 'super');
  if (n > 4 && /ier$/.test(w)) add(w.slice(0, -3) + 'y', 'comp');
  if (n > 4 && /er$/.test(w)) { add(w.slice(0, -2), 'comp'); add(w.slice(0, -1), 'comp'); add(one(w.slice(0, -2)), 'comp'); }
  if (n > 4 && /est$/.test(w)) { add(w.slice(0, -3), 'super'); add(w.slice(0, -2), 'super'); }
  if (n > 5 && /ily$/.test(w)) add(w.slice(0, -3) + 'y', 'adv');
  if (n > 5 && /bly$/.test(w)) add(w.slice(0, -1) + 'e', 'adv');
  if (n > 4 && /ly$/.test(w)) { add(w.slice(0, -2), 'adv'); add(w.slice(0, -2) + 'e', 'adv'); }
  if (n > 6 && /iness$/.test(w)) add(w.slice(0, -5) + 'y', 'noun');
  if (n > 5 && /ness$/.test(w)) add(w.slice(0, -4), 'noun');
  return out;
}
/* British, older and other spellings of a word, as the 1913 (American) dictionary would spell it: colour → color, instalment → installment, judgement → judgment, realise → realize, centre → center, defence → defense,
   learnt → learned, mediaeval → medieval. Only tried when the word as typed is not there, so a real word that looks like a variant (four, more) is never changed. */
const DK_SPELL = { grey: 'gray', plough: 'plow', cheque: 'check', programme: 'program', manoeuvre: 'maneuver', moustache: 'mustache', draught: 'draft', tyre: 'tire', kerb: 'curb', jewellery: 'jewelry', storey: 'story', pyjamas: 'pajamas', artefact: 'artifact', mould: 'mold', smoulder: 'smolder', whilst: 'while', amongst: 'among', amidst: 'amid', knelt: 'kneel', connexion: 'connection', reflexion: 'reflection', inflexion: 'inflection', aluminium: 'aluminum', fulfil: 'fulfill', enrol: 'enroll', skilful: 'skillful', wilful: 'willful', sceptic: 'skeptic', sceptical: 'skeptical', gaol: 'jail', ageing: 'aging', towards: 'toward', afterwards: 'afterward', backwards: 'backward', upwards: 'upward' };
function dkVariants(w) {
  const out = []; const add = (s) => { if (s && s.length >= 2 && s !== w && !out.includes(s)) out.push(s); };
  if (DK_SPELL[w]) add(DK_SPELL[w]);
  if (w.length >= 5) {
    if (/our(s|ed|ing|able|ful|less|ite)?$/.test(w)) add(w.replace(/our(s|ed|ing|able|ful|less|ite)?$/, 'or$1'));
    if (/is(e|es|ed|ing|ation|ations)$/.test(w) && w.length >= 6) add(w.replace(/is(e|es|ed|ing|ation|ations)$/, 'iz$1'));
    if (/ys(e|es|ed|ing)$/.test(w)) add(w.replace(/ys(e|es|ed|ing)$/, 'yz$1'));
    if (/[^aeiou]res?$/.test(w)) add(w.replace(/re(s?)$/, 'er$1'));
    if (/ences?$/.test(w)) add(w.replace(/ence(s?)$/, 'ense$1'));
    if (/lments?$/.test(w)) add(w.replace(/lment(s?)$/, 'llment$1'));
    if (/gements?$/.test(w)) add(w.replace(/gement(s?)$/, 'gment$1'));
    if (/ogues?$/.test(w)) add(w.replace(/ogue(s?)$/, 'og$1'));
    if (/^(learn|spell|burn|dream|leap|spill|smell|spoil)t$/.test(w)) add(w.slice(0, -1) + 'ed');
    if (/ae/.test(w)) add(w.replace(/ae/g, 'e'));
    if (/oe/.test(w) && !/oe[ds]?$/.test(w)) add(w.replace(/oe/g, 'e'));
  }
  return out;
}
/* the keys to try for a typed or selected word, best first: [{ key, how }] with how 'exact' for the word itself (then the words run together), and for the others what the typed word would be of the key.
   A possessive goes (God's, fathers’); more than four words, or nothing, gives []. A phrase has only its last word changed. */
function dkForms(word) {
  const key = dkNorm(String(word == null ? '' : word).slice(0, 120).replace(/[’'](?:s)?(?=\s|$)/gi, '')); if (!key || key.length > 60) return [];
  const words = key.split(' '); if (words.length > 4) return [];
  const out = []; const seen = new Set(); const add = (k, how) => { if (k && !seen.has(k)) { seen.add(k); out.push({ key: k, how }); } };
  add(key, 'exact'); if (words.length > 1) add(words.join(''), 'exact');
  const head = words.slice(0, -1).join(' '); const pre = head ? head + ' ' : ''; const last = words[words.length - 1];
  for (const [s, how] of dkStems(last)) add(pre + s, how);
  for (const v of dkVariants(last)) { add(pre + v, 'spelling'); for (const [s, how] of dkStems(v)) add(pre + s, how); }      // a variant spelling, then the forms of that
  return out;
}
const dkShape = (r) => ({ heads: Array.isArray(r[0]) ? r[0] : [String(r[0])], syl: r[1] || '', pos: r[2] || '', senses: Array.isArray(r[3]) ? r[3] : [], syn: r[4] || '', care: !!r[5] });
async function dkRecs(key, meta, load) { const id = dkChunkOf(meta, key); if (!id) return []; const by = await load(id); return (by && by.get(key)) || []; }
/* the dictionary's answer for one word: { key, how, entries: [{ heads, syl, pos, senses, syn, care }], via: [{ key, to, kind }] } or null. load(id) gives the Map of that file (a script tag in the app, the disk in a test).
   A pointer row (a variant spelling or a derived form) is followed to the entries it points to, and kept in `via` so that the box can say so. */
async function dkFind(word, meta, load) {
  for (const c of dkForms(word)) {
    const recs = await dkRecs(c.key, meta, load); if (!recs.length) continue;
    const entries = []; const via = []; const seen = new Set();
    for (const r of recs) {
      if (Array.isArray(r[0])) { if (!seen.has(r)) { seen.add(r); entries.push(dkShape(r)); } continue; }
      via.push({ key: String(r[0]), to: String(r[1]), kind: String(r[2] || '') });
      for (const t of await dkRecs(String(r[1]), meta, load)) if (Array.isArray(t[0]) && !seen.has(t)) { seen.add(t); entries.push(dkShape(t)); }
    }
    if (entries.length) return { key: c.key, how: c.how, entries, via };
  }
  return null;
}
/* a selection of a few words: the whole phrase if the dictionary has it, else each of its words that is not a small common one (at most three) */
const DK_SMALL = new Set('a an the of and or to in on at by for with from is are was were be been it he she they we you i his her their our my that this as but not no so if then than who whom whose which what shall will do doth hath'.split(' '));
async function dkFindText(text, meta, load) {
  const t = String(text == null ? '' : text).replace(/\s+/g, ' ').trim(); const words = t.split(' ').filter(Boolean); if (!words.length || words.length > 4) return [];
  const whole = await dkFind(t, meta, load); if (whole || words.length === 1) return whole ? [{ text: t, res: whole }] : [];
  const out = []; for (const w of words) { if (out.length >= 3) break; const k = dkNorm(w); if (k.length < 3 || DK_SMALL.has(k)) continue; const r = await dkFind(w, meta, load); if (r) out.push({ text: w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''), res: r }); }
  return out;
}
/* the abbreviations of 1913, in words: usage labels in square brackets, and what the subject labels in round brackets stand for (the hover text) */
const DK_USE = { obs: 'obsolete', r: 'rare', rare: 'rare', archaic: 'archaic', colloq: 'colloquial', poetic: 'poetic', 'prov. eng': 'provincial English', scot: 'Scottish', eng: 'English', 'u. s': 'U.S.', slang: 'slang', low: 'low', vulgar: 'vulgar', obsolescent: 'going out of use' };
const DK_SUBJ = { 'anat': 'anatomy', 'arch': 'architecture', 'astron': 'astronomy', 'bot': 'botany', 'chem': 'chemistry', 'com': 'commerce', 'eccl': 'the church', 'geol': 'geology', 'geom': 'geometry', 'gram': 'grammar', 'her': 'heraldry',
  'math': 'mathematics', 'mech': 'mechanics', 'med': 'medicine', 'metaph': 'metaphysics', 'mil': 'military', 'min': 'mineralogy', 'mus': 'music', 'mythol': 'mythology', 'naut': 'nautical', 'philos': 'philosophy', 'phys': 'physics',
  'physiol': 'physiology', 'print': 'printing', 'rhet': 'rhetoric', 'theol': 'theology', 'zoöl': 'zoology', 'far': 'farriery (the care of horses)', 'anc. geog': 'ancient geography', 'r. c. ch': 'the Roman Catholic Church', 'eng. law': 'English law', 'civil law': 'civil law' };
const dkLabKey = (s) => String(s).toLowerCase().replace(/&amp;/g, '&').replace(/\.+$/, '').replace(/\s+/g, ' ').trim();
/* a sense as safe HTML: its subject labels at the front in italics (with what they stand for as the hover text), usage labels in square brackets spelled out. esc is the page's escaper. */
function dkMarkup(text, esc) {
  let s = String(text == null ? '' : text); const m = s.match(/^((?:\([^()]{1,60}\)\s*)+)/); let head = '';
  if (m) { s = s.slice(m[1].length); head = (m[1].match(/\(([^()]{1,60})\)/g) || []).map((x) => x.slice(1, -1)).map((l) => { const t = DK_SUBJ[dkLabKey(l)]; return `<i class="dk-lab"${t ? ` title="${esc(t)}"` : ''}>${esc(l)}</i>`; }).join(' ') + ' '; }
  const body = esc(s).replace(/\[([^\]]{1,60})\]/g, (all, inner) => { const u = DK_USE[dkLabKey(inner)]; return `<i class="dk-use">${u || '[' + inner + ']'}</i>`; });
  return head + body;
}
/* the headwords a sense points to ("Past tense of Begin.", "See Thou."), to be offered as links: at most four, never the entry's own */
function dkRefs(text, own) {
  const t = String(text == null ? '' : text); const out = []; const mine = new Set((Array.isArray(own) ? own : []).map(dkNorm));
  const add = (w) => { w = String(w || '').replace(/[’']s$/, '').replace(/[.,;:]+$/, ''); if (w.length >= 2 && !mine.has(dkNorm(w)) && !out.some((o) => dkNorm(o) === dkNorm(w))) out.push(w); };
  const f = t.match(/^(?:[A-Z]\w+ (?:tense|participle|case)|Plural|Singular|Verbal noun|\d(?:st|nd|rd) person [a-z ]+?|[A-Z][a-z]+ form)(?: and [a-z ]+?)? (?:of|for|from) ([A-Z][\w’'-]*)/); if (f) add(f[1]);
  for (const x of t.matchAll(/\b(?:See|Same as|Cf\.)\s+(?!under\b|the\b|Note\b|Syn\b|also\b)([A-Z][\w’'-]*)/g)) add(x[1]);
  return out.slice(0, 4);
}
if (typeof module !== 'undefined' && module.exports) module.exports = { dkNorm, dkChunkOf, dkStems, dkVariants, DK_SPELL, dkForms, dkFind, dkFindText, dkShape, dkMarkup, dkRefs, DK_HOW, DK_USE, DK_SUBJ };
