/* ═══════════════════════════ 2z · Bibles side by side: the pure parts ═══════════════════════════
   The Bibles pack (../bibles/, built by tools/build_bibles.py) holds many public-domain English Bibles verse by verse, one file per version per book.
   A chapter is a list of verses [number, text(, last number if the verse is a bridge, original reference if renumbered)]; verse 0 is a Psalm title.
   Everything here is data and arithmetic with no page in it: reading a reference ("John 3:16", "Ps 23", "1 Cor 13:4-7"), lining the versions up verse by verse
   (a verse a version leaves out is a gap, a bridged verse spans its rows), and marking the words that differ from the first version.
   Chapter and verse numbers in the pack follow the King James and the Hebrew; the Douay-Rheims Psalms, which the Vulgate numbers differently, have been re-keyed to match
   (their own numbers are kept and shown). A chapter listed under "d" is one whose verse numbers do not line up with the other Bibles: the page says so. */
const BIB_MAX_VERSIONS = 6;
/* the book codes (USFM) and the library text each one is also available as, in the World English Bible */
const BIB_LIB_ID = {
  GEN: 'b-gen', EXO: 'b-exo', LEV: 'b-lev', NUM: 'b-num', DEU: 'b-deu', JOS: 'b-jos', JDG: 'b-jdg', RUT: 'b-rut', '1SA': 'b-1sa', '2SA': 'b-2sa', '1KI': 'b-1ki', '2KI': 'b-2ki', '1CH': 'b-1ch', '2CH': 'b-2ch', EZR: 'b-ezr', NEH: 'b-neh',
  EST: 'b-est', JOB: 'b-job', PSA: 'b-psa', PRO: 'b-pro', ECC: 'b-ecc', SNG: 'b-sos', ISA: 'b-isa', JER: 'b-jer', LAM: 'b-lam', EZK: 'b-eze', DAN: 'b-dan', HOS: 'b-hos', JOL: 'b-joe', AMO: 'b-amo', OBA: 'b-oba', JON: 'b-jon', MIC: 'b-mic',
  NAM: 'b-nah', HAB: 'b-hab', ZEP: 'b-zep', HAG: 'b-hag', ZEC: 'b-zec', MAL: 'b-mal', MAT: 'n-mat', MRK: 'n-mar', LUK: 'n-luk', JHN: 'n-joh', ACT: 'n-act', ROM: 'n-rom', '1CO': 'n-1co', '2CO': 'n-2co', GAL: 'n-gal', EPH: 'n-eph', PHP: 'n-php',
  COL: 'n-col', '1TH': 'n-1th', '2TH': 'n-2th', '1TI': 'n-1ti', '2TI': 'n-2ti', TIT: 'n-tit', PHM: 'n-phm', HEB: 'n-heb', JAS: 'n-jas', '1PE': 'n-1pe', '2PE': 'n-2pe', '1JN': 'n-1jo', '2JN': 'n-2jo', '3JN': 'n-3jo', JUD: 'n-jud', REV: 'n-rev',
  TOB: 'd-tob', JDT: 'd-jdt', ESG: 'd-aes', WIS: 'd-wis', SIR: 'd-sir', BAR: 'd-bar', '1MA': 'd-1ma', '2MA': 'd-2ma', '1ES': 'o-1es', MAN: 'o-pma', PS2: 'o-ps151', '3MA': 'o-3ma', '2ES': 'o-2es', '4MA': 'o-4ma',
};
/* how people write a book: all lower case, letters and digits only. A leading Roman numeral is turned into a digit first. */
const BIB_ALIASES = {
  GEN: 'genesis gen ge gn', EXO: 'exodus exod ex exo', LEV: 'leviticus lev le lv', NUM: 'numbers num nu nm nb', DEU: 'deuteronomy deut dt de', JOS: 'joshua josh jos jsh', JDG: 'judges judg jdg jg jdgs', RUT: 'ruth rth ru',
  '1SA': '1samuel 1sam 1sa 1sm 1s', '2SA': '2samuel 2sam 2sa 2sm 2s', '1KI': '1kings 1kgs 1ki 1k', '2KI': '2kings 2kgs 2ki 2k', '1CH': '1chronicles 1chron 1chr 1ch', '2CH': '2chronicles 2chron 2chr 2ch', EZR: 'ezra ezr ez',
  NEH: 'nehemiah neh ne', EST: 'esther esth est es', JOB: 'job jb', PSA: 'psalms psalm pss ps psa psm pslm', PRO: 'proverbs prov pro prv pr', ECC: 'ecclesiastes eccles eccl ecc ec qoh qoheleth', SNG: 'songofsolomon songofsongs song sos so canticles canticleofcanticles cant',
  ISA: 'isaiah isa is', JER: 'jeremiah jer je jr', LAM: 'lamentations lam la', EZK: 'ezekiel ezek eze ezk', DAN: 'daniel dan da dn', HOS: 'hosea hos ho', JOL: 'joel joe jl', AMO: 'amos amo am', OBA: 'obadiah obad oba ob', JON: 'jonah jon jnh',
  MIC: 'micah mic mc', NAM: 'nahum nah na', HAB: 'habakkuk hab hb', ZEP: 'zephaniah zeph zep zp', HAG: 'haggai hag hg', ZEC: 'zechariah zech zec zc', MAL: 'malachi mal ml',
  MAT: 'matthew matt mat mt', MRK: 'mark mrk mar mk mr', LUK: 'luke luk lk', JHN: 'john joh jhn jn', ACT: 'acts act ac', ROM: 'romans rom ro rm', '1CO': '1corinthians 1cor 1co', '2CO': '2corinthians 2cor 2co', GAL: 'galatians gal ga',
  EPH: 'ephesians eph ep', PHP: 'philippians phil php pp', COL: 'colossians col co', '1TH': '1thessalonians 1thess 1thes 1th', '2TH': '2thessalonians 2thess 2thes 2th', '1TI': '1timothy 1tim 1ti', '2TI': '2timothy 2tim 2ti',
  TIT: 'titus tit ti', PHM: 'philemon philem phlm phm', HEB: 'hebrews heb', JAS: 'james jas jam jm', '1PE': '1peter 1pet 1pe 1pt', '2PE': '2peter 2pet 2pe 2pt', '1JN': '1john 1jn 1jo 1j', '2JN': '2john 2jn 2jo 2j', '3JN': '3john 3jn 3jo 3j',
  JUD: 'jude jud', REV: 'revelation rev re revelations apocalypse apoc',
  TOB: 'tobit tob tb', JDT: 'judith jdt jth', ESG: 'estherapocrypha esthergreek additionstoesther addesther', WIS: 'wisdomofsolomon wisdom wis ws', SIR: 'sirach ecclesiasticus sir ecclus wisdomofsirach', BAR: 'baruch bar', S3Y: 'prayerofazariah songofthethreeyoungmen songofthreechildren azariah',
  SUS: 'susanna sus', BEL: 'belandthedragon bel', '1MA': '1maccabees 1macc 1mac 1ma', '2MA': '2maccabees 2macc 2mac 2ma', '3MA': '3maccabees 3macc 3mac 3ma', '4MA': '4maccabees 4macc 4mac 4ma', '1ES': '1esdras 1esd 1es',
  '2ES': '2esdras 2esd 2es', MAN: 'prayerofmanasseh manasseh man', PS2: 'extrapsalm',
};
const BIB_ALIAS_MAP = (() => { const m = Object.create(null); for (const [code, list] of Object.entries(BIB_ALIASES)) for (const a of list.split(' ')) if (!(a in m)) m[a] = code; return m; })();
/* "John 3:16", "Ps 23", "1 Cor 13:4-7", "II Kings 2", "Song of Songs 2:1" → { code, chapter, v1, v2 } (chapter and verses may be 0 when not given), or null */
function bibParseRef(text, knownCodes) {
  let s = String(text == null ? '' : text).slice(0, 80).trim().replace(/[–—]/g, '-'); if (!s) return null;
  const m = /^((?:[1-4]|i{1,3}|iv)?\.?\s*[a-z][a-z .']*?)\s*(?:(\d{1,3})(?:\s*[:.,]\s*(\d{1,3})(?:\s*-\s*(\d{1,3}))?)?)?\s*$/i.exec(s); if (!m) return null;
  let name = m[1].toLowerCase().replace(/\./g, ' ').replace(/'/g, '').trim(); name = name.replace(/^(iii|ii|iv|i)\b\s*/, (x, r) => ({ i: '1', ii: '2', iii: '3', iv: '4' }[r] + ' ')).replace(/[^a-z0-9]/g, '');
  const code = BIB_ALIAS_MAP[name]; if (!code || (knownCodes && !knownCodes.includes(code))) return null;
  let ch = m[2] ? +m[2] : 0; let bk = code; if (code === 'PSA' && ch === 151 && (!knownCodes || knownCodes.includes('PS2'))) { bk = 'PS2'; ch = 1; }      // Psalm 151 is a book of its own in the pack
  const v1 = m[3] ? +m[3] : 0; const v2 = m[4] ? Math.max(+m[4], v1) : v1;
  return { code: bk, chapter: ch, v1, v2 };
}
const bibRefText = (name, ch, v1, v2) => `${name}${ch ? ' ' + ch : ''}${v1 ? ':' + v1 + (v2 && v2 > v1 ? '–' + v2 : '') : ''}`;

/* the rows of a chapter laid out for several versions. chapters = { verId: [[n, text, end?, orig?], ...] or undefined }.
   Returns { keys: [0?, 1, 2, ...], cell(verId, key) → { text, orig, span } | { gap: true } | { under: n } } */
function bibRows(chapters) {
  const by = {}; const keys = new Set();
  for (const [id, vs] of Object.entries(chapters)) {
    if (!vs) continue; const m = new Map();
    for (const v of vs) { m.set(v[0], v); keys.add(v[0]); if (v[2] && v[2] > v[0]) for (let k = v[0] + 1; k <= v[2]; k++) keys.add(k); }
    by[id] = m;
  }
  const list = [...keys].sort((a, b) => a - b);
  const cell = (id, key) => {
    const m = by[id]; if (!m) return { gap: true, absent: true };
    const v = m.get(key); if (v) return { text: v[1], orig: v[3] || '', span: v[2] && v[2] > key ? v[2] : 0 };
    for (const w of m.values()) if (w[2] && w[0] < key && key <= w[2]) return { under: w[0] };
    return { gap: true };
  };
  return { keys: list, cell };
}
/* words as they are compared: lower case letters and digits, with the old u/v and i/j and spellings left alone (a spelling is a difference worth seeing) */
const bibWords = (t) => (String(t).toLowerCase().match(/[a-z0-9À-ɏ']+/g) || []).map((w) => w.replace(/^'+|'+$/g, ''));
/* which words of `text` are not found in `ref`: [{ w: 'word as printed', d: true|false }, ...] for the page to wrap; the printed words and spaces are kept */
function bibDiff(ref, text) {
  const have = new Set(bibWords(ref)); const out = []; const re = /([A-Za-z0-9À-ɏ']+)|([^A-Za-z0-9À-ɏ']+)/g; let m;
  const src = String(text);
  while ((m = re.exec(src))) { if (m[1]) { const k = m[1].toLowerCase().replace(/^'+|'+$/g, ''); out.push({ w: m[1], d: !!k && !have.has(k) }); } else out.push({ w: m[2], d: false }); }
  return out;
}
/* how much of a verse differs from the first version's: a share of its words (for ordering and for saying "these two agree") */
function bibAgreement(ref, text) { const a = bibWords(ref); const b = bibWords(text); if (!a.length || !b.length) return 0; const s = new Set(a); const n = b.filter((w) => s.has(w)).length; return n / b.length; }
/* the whole chapter as running text for one version: "¹In the beginning …" as [{ n, text }] in order, titles first */
const bibChapterRuns = (vs) => (vs || []).map((v) => ({ n: v[0], text: v[1], end: v[2] || 0, orig: v[3] || '' }));
/* which of the versions have a given book, in the order of the index */
const bibVersionsWith = (index, code) => (index && index.versions || []).filter((v) => v.books.includes(code));
/* a whole version as sections for saving (see 2z-export-core.js): one section per book, each chapter a heading and a run of verses. list: [[code, name, chapters], ...] where chapters = { n: [[verse, text, ...], ...] } */
function bibSections(list) {
  return list.filter((b) => b && b[2]).map(([code, name, chs]) => {
    const label = code === 'PSA' ? 'Psalm' : 'Chapter';
    return [name, Object.keys(chs).map(Number).sort((a, b) => a - b).map((c) => { const vs = chs[c] || []; const title = vs.filter((v) => v[0] === 0).map((v) => v[1]).join(' '); const body = vs.filter((v) => v[0] >= 1).map((v) => `[[${v[0]}]] ${v[1]}`).join(' '); return `## ${label} ${c}\n${title ? '(' + title + ') ' : ''}${body}`; }).join('\n\n')];
  });
}
if (typeof module !== 'undefined' && module.exports) module.exports = { bibSections, BIB_MAX_VERSIONS, BIB_LIB_ID, BIB_ALIASES, BIB_ALIAS_MAP, bibParseRef, bibRefText, bibRows, bibWords, bibDiff, bibAgreement, bibChapterRuns, bibVersionsWith };
