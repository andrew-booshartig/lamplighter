/* ═══════════════════════════ 2z · Passages: what a random passage is (pure) ═══════════════════════════
   A PAGE is a slice of a book by position. A PASSAGE is a unit the text itself marks off, and it has a reference: a verse range ("Psalm 4:1–3"), or a paragraph group under its heading with the printed page.
   This file is the arithmetic of that difference, with no page in it (tests/passage-core.test.js): reading a section's verse markers [[n]], finding the unit around a place, writing the reference, scoring a
   candidate, cleaning a section heading, and keeping a session's draws from repeating. The picker (6d-passage.js) chooses a place with the secure source and asks this file what unit surrounds it.
   One rule runs through all of it: a reference is never invented. A verse number is shown only where the text has one, a page only where the printed page was found (2z-pages-core.js), and a text with
   neither is cited by its section. */

/* visible characters: a passage of about 420 is a few verses; a page of about 1,500 is what the old "A page" length drew */
const PSU_SIZES = { passage: { min: 140, target: 420, max: 1100 }, page: { min: 900, target: 1500, max: 2300 } };
/* how long a passage is asked to be (the Random page's Short | Medium | Longer): the sizes of a run of verses (psuVerseUnit) and the target of a paragraph or a few (pickPassage), in visible characters.
   Short is a verse or two, or a few lines; Medium is what a passage always was, so every draw code made before the choice existed replays unchanged; Longer runs on to the next natural break (a speech, a psalm, a few paragraphs). */
const PSU_PASSAGE = { short: { min: 40, target: 170, max: 420, prose: 280 }, medium: Object.assign({}, PSU_SIZES.passage, { prose: 560 }), longer: { min: 500, target: 1100, max: 2600, prose: 1100 } };
const psuSizeOf = (s) => (s === 'short' || s === 'longer' ? s : 'medium');
/* how much scan damage a passage may carry (the share of its words that are marks, stray letters, glued digits or capitals inside words): a scanned book is held to a stricter standard than a typed one */
const PSU_NOISE = { typed: 0.045, scan: 0.015 };
const psuVis = (s) => String(s == null ? '' : s).replace(/\[\[\d+\]\]/g, '').replace(/\s+/g, ' ').trim();

/* ── verses ──
   A Bible chapter is a section with [[n]] before each verse. The text before verse 1 may be a title line "(A Psalm by David.)", which belongs to it; a "(ALEPH)" line between verses belongs to the verse after it;
   a "## BOOK 1" heading is not text. Blank lines are the translators' paragraph breaks. Returns { v, cum, total, n } (v[i]: n the verse number, t its text, pre a title line before it, gap the white space
   before it, pb and pa: a paragraph break before and after it, p0 and p1: the paragraphs it begins and ends in, as the reader numbers them, len, qd the opening minus closing curly quotes, sq the straight quotes) or null for a section whose verse numbers do not run upward. */
function psuVerseParse(raw) {
  const text = String(raw == null ? '' : raw); const mk = []; const re = /\[\[(\d{1,4})\]\]/g; let m;
  while ((m = re.exec(text))) mk.push({ n: +m[1], s: m.index, e: m.index + m[0].length });
  if (mk.length < 2) return null;
  for (let i = 1; i < mk.length; i++) if (mk[i].n <= mk[i - 1].n) return null;           // the numbers must run upward, or a reference built from them could be wrong
  const lead = text.slice(0, mk[0].s).replace(/^\s*##[^\n]*\n?/gm, '').trim();
  const brk = []; const bre = /\n{2,}/g; while ((m = bre.exec(text))) brk.push(m.index);                // where the blank lines are: the reader numbers paragraphs by them
  const paraAt = (pos) => { let lo = 0; let hi = brk.length; while (lo < hi) { const mid = (lo + hi) >> 1; if (brk[mid] < pos) lo = mid + 1; else hi = mid; } return lo; };
  const v = []; let carry = '';
  for (let i = 0; i < mk.length; i++) {
    let body = text.slice(mk[i].e, i + 1 < mk.length ? mk[i + 1].s : text.length); let gapAfter = ''; let nextPre = '';
    if (i + 1 < mk.length) {
      const tm = /(\n{2,}[ \t]*)(\([^()\n]{1,200}\)|##[^\n]*)\s*$/.exec(body);
      if (tm) { gapAfter = tm[1]; nextPre = tm[2].startsWith('##') ? '' : tm[2]; body = body.slice(0, tm.index).replace(/\s+$/, ''); }
      else { gapAfter = /\s*$/.exec(body)[0]; body = body.replace(/\s+$/, ''); }
    } else body = body.replace(/(?:\n{2,}[ \t]*##[^\n]*)+\s*$/, '').replace(/\s+$/, '');      // a heading after the last verse is not part of it
    const t = body.replace(/^\s+/, ''); const t0 = mk[i].e + (body.length - t.length);
    v.push({ n: mk[i].n, t, pre: i === 0 ? (lead && lead.length <= 300 ? lead : '') : carry, gapAfter, p0: paraAt(mk[i].s), p1: paraAt(Math.max(t0, t0 + t.length - 1)) });
    carry = nextPre;
  }
  const cum = [0];
  for (let i = 0; i < v.length; i++) {
    const x = v[i]; x.gap = i ? v[i - 1].gapAfter : ''; x.pb = i === 0 || /\n[ \t]*\n/.test(x.gap); x.pa = i + 1 === v.length || /\n[ \t]*\n/.test(x.gapAfter);
    x.len = psuVis((x.pre ? x.pre + ' ' : '') + x.t).length + 1; x.qd = (x.t.match(/“/g) || []).length - (x.t.match(/”/g) || []).length; x.sq = (x.t.match(/"/g) || []).length; cum.push(cum[i] + x.len);
  }
  return { v, cum, total: cum[cum.length - 1], n: v.length };
}
/* the text of verses a..b as the chapter has it: verse numbers, line breaks and paragraph breaks, and a title before the first verse */
function psuVerseText(P, a, b) {
  let out = '';
  for (let i = a; i <= b; i++) { const x = P.v[i]; out += (i > a ? x.gap : '') + (x.pre ? x.pre + '\n' : '') + '[[' + x.n + ']] ' + x.t; }
  return out.trim();
}
/* the verse a character offset falls in: with offsets drawn uniformly over the chapter's text, every character is equally likely to be where a draw lands */
function psuVerseAt(P, r) { let lo = 0; let hi = P.n - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (P.cum[m + 1] > r) hi = m; else lo = m + 1; } return lo; }

/* how a verse begins and ends */
const psuEnds = (t) => /[.!?…]["”’)\]]*$/.test(String(t).replace(/\s+$/, ''));
const psuLower = (t) => /^[“"‘'(\[]*[a-z]/.test(psuVis(t));
const PSU_LEAN = /^[“"‘']*(?:And|But|Then|So|For|Therefore|Now|Yet|Also|Thus|Because|Moreover|Nevertheless|However)\b/;       // opens by leaning on what came before it
const PSU_PRON = /^[“"‘']*(?:He|She|They|It|His|Her|Their|Him|Them|This|These|Those|That)\b/;
/* is a cut between verse i and verse i + 1 at the edge of a sentence? (before the first verse and after the last always is) */
function psuCut(P, i) { if (i < 0 || i + 1 >= P.n) return true; return psuEnds(P.v[i].t) && !psuLower(P.v[i + 1].t); }
/* the quotation depth where verse i begins, counted within its paragraph (a speech that goes on into the next paragraph opens again there, which is how these texts print it) */
function psuDepth(P, i) { if (!i || P.v[i].pb) return 0; let d = 0; for (let k = i - 1; k >= 0; k--) { d += P.v[k].qd; if (P.v[k].pb) break; } return d; }
/* the straight quotation marks of a unit come in pairs (the texts that use them), and the curly ones are counted: q > 0 leaves a speech open at the end, q < 0 closes one the unit never opened */
function psuQuotes(P, a, b) { let q = 0; let s = 0; for (let i = a; i <= b; i++) { q += P.v[i].qd; s += P.v[i].sq; } return { q, even: s % 2 === 0 }; }

/* the unit around verse L: verses a..b, from the edge of a sentence to the edge of a sentence, between o.min and o.max characters, preferring the translators' own paragraph edges and a length near o.target.
   A unit that starts inside a speech opened earlier in its paragraph, or stops with a speech still open in the middle of a paragraph, is allowed only at a cost, so a whole speech is chosen where there is one
   (the prophets speak for chapters). o.from: do not begin before this verse ("Read on"). Returns { a, b, cost, len } or null. Deterministic: the same place always gives the same unit, so a draw code replays. */
function psuVerseUnit(P, L, o) {
  const z = o || PSU_SIZES.passage; const from = z.from || 0; const len = (a, b) => P.cum[b + 1] - P.cum[a] - 1;
  const lo = Math.max(0, L - 60, from); const hi = Math.min(P.n - 1, L + 60); let best = null;
  for (let a = L; a >= lo; a--) {
    if (len(a, L) > z.max) break;
    if (!psuCut(P, a - 1) || (a === 0 && psuLower(P.v[0].t))) continue;      // a chapter that begins in the middle of a sentence ("but Jesus went to the Mount of Olives") is not a place to begin
    const inside = psuDepth(P, a) !== 0;
    for (let b = L; b <= hi; b++) {
      const n = len(a, b); if (n > z.max) break; if (n < z.min) continue;
      if (!psuCut(P, b)) continue;
      const qs = psuQuotes(P, a, b); if (!qs.even) continue;
      const first = P.v[a].t; let cost = Math.abs(Math.log(n / z.target)) * 2.2 + (P.v[a].pb ? 0 : 1.3) + (P.v[b].pa ? 0 : 1.3);
      const torn = inside || qs.q < 0 || (qs.q > 0 && !P.v[b].pa); if (inside) cost += 3; if (qs.q < 0) cost += 3; else if (qs.q > 0 && !P.v[b].pa) cost += 3;
      if (PSU_LEAN.test(first)) cost += P.v[a].pb ? 0.1 : 0.35; else if (PSU_PRON.test(first)) cost += P.v[a].pb ? 0.05 : 0.2;
      if (a === 0) cost -= 0.4;                                                       // the start of a chapter or a psalm is a natural start
      if (b === P.n - 1) cost -= 0.25;                                                // and so is its end
      if (!best || cost < best.cost - 1e-9) best = { a, b, cost, len: n, torn };
    }
  }
  return best;
}

/* ── references ── */
const psuDash = (a, b) => (a === b ? String(a) : a + '–' + b);
const psuBookName = (title) => String(title == null ? '' : title).replace(/\s+\([^)]*\)\s*$/, '').replace(/\s+/g, ' ').trim();
/* "Psalm 4" → { name: 'Psalm', num: 4 }; "Chapter 6" → { name: 'Chapter', num: 6 }; "Susanna (Daniel 13, Greek)" → { name: the whole heading, num: 0 } */
function psuHeadNum(h) { const s = String(h == null ? '' : h).replace(/\s+/g, ' ').trim(); const m = /^(.*?)\s*(\d{1,3})$/.exec(s); return m && !/\(/.test(m[1]) ? { name: m[1], num: +m[2] } : { name: s, num: 0 }; }
/* the reference of a verse range: { kind, main, cite, short, book, chapter, from, to }. title: the Library title; heading: the chapter's section heading; tag: a word for an edition whose numbers differ from the usual ones */
function psuRefVerses(o) {
  const h = psuHeadNum(o.heading); const nm = /^(?:chapter|ch\.?|section)?$/i.test(h.name) ? psuBookName(o.title) : h.name;
  const where = h.num ? `${nm} ${h.num}:${psuDash(o.from, o.to)}` : `${psuBookName(o.title)} ${psuDash(o.from, o.to)}`; const tag = o.tag ? ` (${o.tag})` : '';
  return { kind: 'verses', main: where + tag, cite: where + tag, short: where, book: h.num ? nm : psuBookName(o.title), chapter: h.num, from: o.from, to: o.to };
}
/* the words for a section, readable: the segments of a split heading without "part 2 of 5" and without the first-words tail the splitter adds, digits stuck to a capitalised word (a note mark), and a sensible length */
function psuHeadSegs(h) { return String(h == null ? '' : h).split(' · ').map((s) => s.trim()).filter((s, i, a) => s && !/^part \d+ of \d+$/i.test(s) && !(/…$/.test(s) && i === a.length - 1 && a.length > 1) && !a.slice(0, i).some((x) => x.toLowerCase() === s.toLowerCase())); }      // a segment said twice is said once
/* a heading printed in capitals is read as a title: "SURA VII.-AL ARAF [LXXXVII.]" → "Sura VII.-Al Araf [LXXXVII.]" (Roman numerals stay) */
const PSU_ROMAN = /^(?=[MDCLXVI])M{0,3}(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3})$/;
function psuUnshout(s) {
  const letters = s.replace(/[^A-Za-z]/g, ''); if (letters.length < 6 || letters.replace(/[^A-Z]/g, '').length / letters.length < 0.85) return s;
  return s.replace(/[A-Za-z][A-Za-z’']*/g, (w) => (PSU_ROMAN.test(w) && w.length <= 7 ? w : w.charAt(0) + w.slice(1).toLowerCase()));
}
function psuHeading(h, max) {
  const lim = max || 90; let s = psuHeadSegs(h).map((x) => psuUnshout(x.replace(/\b([A-Z]{3,})\d{1,2}(?=[\s.\-–—\[,;:]|$)/g, '$1').replace(/_+/g, '').replace(/\[\d{1,4}\]/g, '').replace(/\s+/g, ' ').trim())).join(' · ');
  if (s.length > lim) { s = s.slice(0, lim - 1); const k = s.lastIndexOf(' '); s = (k > lim * 0.6 ? s.slice(0, k) : s).replace(/[\s·,;:.\-–—]+$/, '') + '…'; }
  return s;
}
const psuShortTitle = (title) => { const t = String(title == null ? '' : title).replace(/\s+/g, ' ').trim(); const k = t.indexOf(' ('); return k >= 6 ? t.slice(0, k) : t; };
/* the reference of a passage in a book without verse numbers: the title, the section (its name, or its place in the book: o.section of o.sections), and the printed page(s) where they are known (o.pages: "p. 214" or "pp. 214–215") */
const PSU_GENERIC = /^(?:text|the text|main text|body|translation|contents?|part \d+|section \d+|chapter)$/i;      // a heading that says nothing about where in the book we are
/* the numbers a text prints before its sayings or verses, said as a reference: "no. 347", "nos. 347–348" */
const psuNumbers = (a, b) => (a && b && b !== a ? `nos. ${a}–${b}` : a ? `no. ${a}` : '');
function psuRefProse(o) {
  const title = psuShortTitle(o.title); const sec = Math.floor(+o.section); const of = Math.floor(+o.sections);
  let head = psuHeading(o.heading); if (PSU_GENERIC.test(head)) head = '';
  const pm = /(?:^| · )part (\d+) of (\d+)(?: · |$)/i.exec(String(o.heading == null ? '' : o.heading));      // a long section is cut into parts: its name is the name of where it begins, so a later part says which part it is
  if (head && pm && +pm[1] >= 2) head += ` · part ${pm[1]} of ${pm[2]}`;
  const place = head || (sec >= 1 && of > 1 && sec <= of ? `section ${sec} of ${of}` : '');      // a section with no name of its own is cited by its place in the book
  const nums = String(o.nums || '').trim();
  const pg = String(o.pages || '').trim().replace(/^Vol\. (\d+), /, (m, n) => (new RegExp('\\bVol(?:ume|\\.)?\\s*' + n + '\\b', 'i').test(place) ? '' : m)); const where = [place, nums, pg].filter(Boolean).join(', ');      // "Vol. 1" is not said twice
  return { kind: pg ? 'page' : place || nums ? 'section' : 'book', main: title, sub: where, cite: [title, place, nums, pg].filter(Boolean).join(', '), short: [title.length > 26 ? title.slice(0, 25).replace(/\s+\S*$/, '') + '…' : title, pg || nums || (place ? place.slice(0, 22) : '')].filter(Boolean).join(' · ') };
}
/* the line under the reference: where the text sits in the Library, said plainly (shelf, kind of text, date), never a verdict */
function psuContext(o) { return [o.shelf, o.genre, o.when].map((x) => String(x == null ? '' : x).replace(/\s+/g, ' ').trim()).filter(Boolean).join(' · '); }
/* a Library shelf's long name, short: "Hebrew Bible · Old Testament (39 books)" → "Hebrew Bible" */
const psuShelfName = (label) => String(label == null ? '' : label).split(/ · |: /)[0].replace(/\s+\([^)]*\)\s*$/, '').trim();

/* ── what kind of text it is, in a few plain words, for the line of context under a passage (the Bible books are the ones a verse reference is made for) ── */
const PSU_KIND = (() => {
  const o = {}; const set = (w, ids) => ids.split(' ').forEach((id) => { o[id] = w; });
  set('law and narrative (Torah)', 'b-gen b-exo b-lev b-num b-deu'); set('historical narrative', 'b-jos b-jdg b-1sa b-2sa b-1ki b-2ki b-1ch b-2ch b-ezr b-neh o-1es d-1ma d-2ma'); set('a short story', 'b-rut b-est d-tob d-jdt d-sus d-bel o-3ma');
  set('wisdom poetry', 'b-job'); set('a psalm', 'b-psa o-ps151'); set('wisdom sayings', 'b-pro'); set('wisdom writing', 'b-ecc d-wis d-sir'); set('love poetry', 'b-sos'); set('a lament', 'b-lam');
  set('a prophetic book', 'b-isa b-jer b-eze b-hos b-joe b-amo b-oba b-mic b-nah b-hab b-zep b-hag b-zec b-mal d-bar'); set('stories and visions', 'b-dan'); set('a prophetic story', 'b-jon');
  set('a gospel', 'n-mat n-mar n-luk n-joh'); set('a history of the early community', 'n-act'); set('an apocalypse', 'n-rev o-2es p-4ez'); set('a prayer', 'o-pma'); set('a letter', 'd-lje'); set('a prayer and a hymn', 'd-pat'); set('additions to a story', 'd-aes'); set('a philosophical essay', 'o-4ma');
  set('a letter', 'n-rom n-1co n-2co n-gal n-eph n-php n-col n-1th n-2th n-1ti n-2ti n-tit n-phm n-heb n-jas n-1pe n-2pe n-1jo n-2jo n-3jo n-jud');
  return o;
})();
/* "a psalm; its heading names David": the kind of text, and for a psalm the person its own heading names (the heading is the text's, not a claim of this app's) */
function psuKind(id, lead) {
  const k = Object.prototype.hasOwnProperty.call(PSU_KIND, id) ? PSU_KIND[id] : ''; if (!k) return '';
  if (k === 'a psalm') {
    const names = []; const re = /\b(?:by|of|for) (David|Asaph|Solomon|Moses|Heman|Ethan)\b|\bsons? of Korah\b|\bKorah\b/g; const L = String(lead || ''); let m;
    while ((m = re.exec(L))) { const n = m[1] || 'the sons of Korah'; if (!names.includes(n)) names.push(n); }
    return names.length ? `${k}; its heading names ${names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0]}` : k;
  }
  return k;
}

/* ── scoring: is this a whole thought that reads on its own? ──
   Returns { score (0 to 1), flags, ok, noise }. A flag names a fault: starts-lower, ends-open, quote-open, short, long, noisy, lists, numbers. It gates a draw, chooses between cuts and is the audit tool's second opinion. */
function psuNoise(text) {
  const toks = psuVis(text).split(' ').filter(Boolean); if (toks.length < 6) return 0; let bad = 0;
  for (const t of toks) {
    if (/[¬•°^~|{}<>@#©§¶\\_]/.test(t)) bad++;                                                        // marks a scan leaves
    else if (/^[^A-Za-z]*[A-Za-z][^A-Za-z]*$/.test(t) && !/^[^A-Za-z]*[aAIOo&][^A-Za-z]*$/.test(t) && !/^\(?[A-Za-z]\)[.,;:]*$/.test(t) && !/^[A-Z]\.$/.test(t)) bad++;     // a stray single letter (not an initial, nor the "(i)" or "b)" that numbers a verse or a list)
    else if (/[a-z][A-Z]/.test(t) && !/^(?:Mc|Mac|O’|O')/.test(t)) bad++;                           // a capital in the middle of a word
    else if (/[A-Za-z]\d|\d[A-Za-z]/.test(t) && !/^\d+(?:st|nd|rd|th|s|d)\b/.test(t)) bad++;        // digits glued to letters
    else if (/(.)\1{3,}/.test(t)) bad++;                                                              // aaaa
  }
  return bad / toks.length;
}
function psuAssess(text, o) {
  const x = o || {}; const t = String(text == null ? '' : text); const c = psuVis(t); const flags = []; const verse = /\[\[\d+\]\]/.test(t);
  if (psuLower(c)) flags.push('starts-lower');
  const stanza = !verse && t.trim().split('\n').filter((l) => l.trim()).length >= 3;
  if (!psuEnds(c) && !stanza && !x.chapterEnd) flags.push('ends-open');
  const oq = (t.match(/“/g) || []).length; const cq = (t.match(/”/g) || []).length; if (oq !== cq && !(oq === cq + 1 && /^“/.test(c))) flags.push('quote-open');
  if (c.length < (x.min || 60)) flags.push('short'); if (c.length > (x.max || 4000) * 1.6) flags.push('long');
  const noise = psuNoise(c); if (noise > (x.scan ? PSU_NOISE.scan : PSU_NOISE.typed)) flags.push('noisy');
  const words = c.split(' ').filter(Boolean); const caps = words.filter((w, i) => i && /^[A-Z]/.test(w) && !/[.!?]$/.test(words[i - 1])).length / Math.max(words.length, 1);
  if (words.length > 14 && caps > 0.34) flags.push('lists');
  const nums = words.filter((w) => /^\d+[.,]?$/.test(w)).length / Math.max(words.length, 1); if (words.length > 14 && nums > 0.12) flags.push('numbers');
  const w = { 'starts-lower': 0.35, 'ends-open': 0.3, 'quote-open': 0.2, short: 0.25, long: 0.1, noisy: 0.35, lists: 0.5, numbers: 0.5 };
  let score = 1; for (const f of flags) score -= w[f] || 0.2; score = Math.max(0, Math.min(1, score - Math.min(noise * 4, 0.2)));
  return { score, flags, ok: !flags.length, noise };
}

/* ── the quality gate ──
   Before a passage is shown it is read once more, as a newcomer would read it. These are the faults that make a pick not worth reading, each with a reason word so the audit and the tests can say why a candidate was
   passed over: ocr (a share of its words are not words: the long s read as an f, "combnft", "confefled"), marks (stray signs a scan leaves), head (a running head or page number in the text), foot (a footnote letter
   stuck to the first word), starts-lower (it begins in the middle of a sentence), thin (not sentence-like prose), list (names or things in a row, with few of the small words real sentences are made of), names (mostly
   capitalised names, numbers or abbreviations), places (a note on geography, archaeology or a bibliography), note (an editor's or scholar's voice). A passage that has none of them is let through. A reference is
   never invented and the gate never decides what a text is about: it judges only whether a stretch of words reads as the text itself. The word list is built from the Library's own typed texts (2z-passage-words.js). */
const PSU_FUNC = new Set('the of and to in a that is was he for it with as his on be at by this had not are but from or an they which you were her all she there would their we him been has when who will no if so said what its than them can do did thy thou thee shall unto upon these those then into out up one my me your our how where why because while though whom also only very more most such each every both any some other another many much'.split(' '));
let PSU_WORDS_NODE = null;
const psuLex = () => (typeof PSU_WORDS !== 'undefined' ? PSU_WORDS : PSU_WORDS_NODE || (PSU_WORDS_NODE = require('./2z-passage-words.js').PSU_WORDS));
const PSU_ENDINGS = [[/ies$/, 'y'], [/(?:es|s)$/, ''], [/ed$/, ''], [/ed$/, 'e'], [/ing$/, ''], [/ing$/, 'e'], [/([a-z])\1(?:ed|ing|er|est)$/, '$1'], [/ly$/, ''], [/ness$/, ''], [/less$/, ''], [/ful$/, ''], [/er$/, ''], [/est$/, ''], [/eth$/, ''], [/th$/, '']];
/* is this lower-case word one of the Library's own words (or one of them with a common ending)? */
function psuKnown(w) { const L = psuLex(); if (L.has(w)) return true; for (const [re, rep] of PSU_ENDINGS) if (re.test(w) && L.has(w.replace(re, rep))) return true; return false; }
/* an unknown word that becomes a known one when some of its f's are read as s's: "fhould", "himfelf", "bleffed" */
function psuLongS(w) {
  const at = []; for (let i = 0; i < w.length; i++) if (w[i] === 'f') at.push(i); if (!at.length || at.length > 4) return false;
  for (let m = 1; m < (1 << at.length); m++) { let s = ''; let k = 0; for (let i = 0; i < w.length; i++) s += w[i] === 'f' && ((m >> k++) & 1) ? 's' : w[i]; if (psuKnown(s)) return true; }
  return false;
}
/* the share of a passage's lower-case words (three letters or more; names and capitals are left alone) that are not words of the Library, and how many of those are a long s misread */
function psuOcr(c) {
  let n = 0; let bad = 0; let longS = 0;
  for (const t of c.match(/[A-Za-z’']+/g) || []) {
    if (/^[A-Z]/.test(t)) continue; let w = t.toLowerCase().replace(/^['’]+/, ''); const ap = w.search(/['’]/); if (ap >= 0) w = w.slice(0, ap); if (w.length < 3) continue;
    n++; if (!psuKnown(w)) { bad++; if (psuLongS(w)) longS++; }
  }
  return { n, bad, longS, ratio: n ? bad / n : 0 };
}
/* a symbol that is not punctuation sitting in or against a word, as a machine reads a smudge: "z¢s" for "the". A pound sign before a figure ("£5") or a section sign before a number ("§ 12") is not a stray, and neither is a square bracket
   (a translator's own insertion: "[a] spirit", "[being] essence"). */
const PSU_STRAY = /[\p{L}][£§|~^][\p{L}]|[\p{L}][¢¤¬■□◊]|[¢¤¬■□◊][\p{L}]/u;
/* a word a machine has misread as a non-word. A plain edit of one letter gives a dozen neighbours to "ove" in the Library's word list (dove, love, move, over, one, ore, owe…), so "the one neighbour" never holds. What is meant is
   the neighbour the print itself explains: one letter that a machine mistakes for another (b for h, c for e, u or v for n) or a few that it runs together (li for h, tb for th, rn for m, ii for u), landing on one of the very common words
   ("ove" is "one", "tbe" and "thc" and "tlie" are "the", "aud" is "and", "yoii" is "you", "hirn" is "him"). A word with exactly one such reading, that is not a word of the Library, is an OCR error. Real words of other languages that
   look like one ("mau", "ber", "vor") are left alone. */
const PSU_COMMON = new Set('the of and to in a that is was he for it with as his on be at by this had not are but from or an they which you were her all she there would their we him been has when who will no if so said what its than them can do did thy thou thee shall unto upon these those then into out up one my me your our how where why because while though whom also only very more most such each every both any some other another many much have man men now thus yet nor eye eyes hath doth saith shalt wilt art'.split(' '));
const PSU_CONFUSE = { b: 'h', c: 'e', u: 'n', v: 'n' };
const PSU_CONFUSE_RUN = [['li', 'h'], ['tb', 'th'], ['rn', 'm'], ['ii', 'u']];
const PSU_NOT_ERRORS = new Set(['mau', 'ber', 'vor']);
/* the one common word a non-word is a misreading of, or '' (none, or more than one) */
function psuNear(w) {
  const out = new Set();
  for (let i = 0; i < w.length; i++) { const t = PSU_CONFUSE[w[i]]; if (t) { const s = w.slice(0, i) + t + w.slice(i + 1); if (PSU_COMMON.has(s)) out.add(s); } }
  for (const [a, b] of PSU_CONFUSE_RUN) { let at = w.indexOf(a); while (at >= 0) { const s = w.slice(0, at) + b + w.slice(at + a.length); if (PSU_COMMON.has(s)) out.add(s); at = w.indexOf(a, at + 1); } }
  return out.size === 1 ? [...out][0] : '';
}
/* the words of a passage that are misreadings: [{ w: 'ove', as: 'one' }] (lower-case words of three to ten letters; capitals are names and are left alone) */
function psuOcrNear(c) {
  const out = [];
  for (const t of String(c).match(/[A-Za-z]+/g) || []) { if (t.length < 3 || t.length > 10 || /^[A-Z]/.test(t)) continue; const w = t.toLowerCase(); if (PSU_NOT_ERRORS.has(w) || psuKnown(w)) continue; const as = psuNear(w); if (as) out.push({ w, as }); }
  return out;
}
/* the marks of an edition read by a machine or by a scholar's hand */
const PSU_MARKS = /[{}|^~<>@#\\]|[a-z]-\d{1,3}\s+[a-z]{2}|[.!?]["”’)]?\s+\d{1,3}\s+\d{1,3}\.\s|\b(?!(?:Mc|Mac|De|Di|La|Le|Von|Van|Mt|Ft)[A-Z])[A-Z][a-z]+[A-Z][a-z]+\b|[a-z]{4,}\.\s+(?!(?:and|but|or|so|nor|yet|for)\b)[a-z]{2,}\b/;
const PSU_SACRED = new Set('LORD GOD YAHWEH JEHOVAH ALLAH ADONAI ELOHIM HIS HIM THE HE AMEN ALMIGHTY SELAH AND OF'.split(' '));
/* a running head or a page number that has got into the text: in capitals in the middle of a sentence, or ahead of the first word */
function psuHead(c) {
  const mid = /(?:[a-z,;:)]|\b(?:and|or|the|of))\s+((?:[A-Z]{3,}[.,]?\s+){1,6}[A-Z]{3,}[.,]?)(?=\s+(?:\d{1,4}\s+)?[a-z])/g; let m;
  while ((m = mid.exec(c))) { const ws = m[1].replace(/[.,]/g, '').split(/\s+/); if (ws.length >= 2 && !ws.every((x) => PSU_SACRED.has(x))) return true; }
  return /^(?:(?:[A-Z]{2,}[.,;]?|\d{1,4}[.,]?|[IVXL]{1,5}\.?|[—-])\s+){2,7}(?=[a-z(“"‘'])/.test(c) && /[A-Z]{3,}/.test(c.slice(0, 40));
}
/* the words of a scholar talking about the text, and the signs of a citation */
const PSU_VOICE = /\b(?:probably|perhaps|apparently|presumably|evidently|doubtless|conjectur\w+|it (?:is|seems|appears) (?:clear|evident|certain|probable|possible|doubtful|likely)|seems? to|appears? to|we may (?:also |further |here |now )?(?:note|remark|suppose|add|compare|conclude)|I (?:think|believe|suppose|do not (?:find|know)|cannot|am inclined)|so-called|the (?:translator|editor|author|writer|commentator)s?|scholars?|critics?|commentators?|it may be|may have been|might have been|would seem|would appear|has been (?:suggested|proposed|argued|shown|noted|translated|explained)|is (?:explained|derived|rendered|translated|supposed)|see (?:above|below|also|p\.|note|vol)|note \d|footnote)\b|\b(?:pp?\.|vv?\.|vols?\.|ch\.|chap\.|cf\.|ibid\.?|viz\.|sq\.|ff\.|fol\.|MSS?\.|Cod\.|eds?\.|trans\.|Skr\.|Sk\.|Pers\.|Av\.|Pahl\.|Gr\.|Lat\.|Heb\.|Syr\.|Eth\.|Bab\.|Assyr\.|Sum\.|Akk\.|b\.c\.|b\.o\.|i\.e\.|op\.|loc\.|cit\.)(?=\s|$)|\bA\.H\.|\bB\.C\.|\bA\.D\./gi;
const PSU_PLACES = /\b(?:miles?|leagues?|latitude|longitude|degrees?|northward|southward|eastward|westward|north-west|north-east|south-west|south-east|rivers?|lakes?|valleys?|mountains?|coast|harbou?r|villages?|provinces?|districts?|caravan|frontier|boundary|situated|bounded|excavat\w+|strat(?:um|a)|deposits?|gravel|glacial|geological|skeletons?|skulls?|cemeter\w+|potsherds?|flints?|implements?|tumuli|mounds?|barrows?|specimens?|species|genus|inches|diameter|breadth|bibliograph\w+|catalogue|papyri|ostracon)\b/gi;
/* is this passage worth showing? { ok, why: [reason words] } — o.scan: a scanned book is held to the stricter standard */
function psuGate(text, o) {
  const x = o || {}; const raw = String(text == null ? '' : text); const c = psuVis(raw); const why = [];
  const words = c.match(/[A-Za-z][A-Za-z’'-]*/g) || []; const n = words.length; if (n < 8) return { ok: true, why };
  const verse = !!x.verse;      // a run of verses is judged only as a list of names or things; the rest of the gate is for text that has no verse numbers
  if (!verse) {
    const oc = psuOcr(c); if (oc.n >= 12 && (oc.ratio > (x.scan ? 0.15 : 0.17) || (oc.longS >= 3 && oc.ratio > 0.08))) why.push('ocr');
    if (PSU_MARKS.test(c)) why.push('marks');
    if (PSU_STRAY.test(c)) why.push('symbol');
    if (x.scan && psuOcrNear(c).length) why.push('ocr-word');
    if (psuHead(c)) why.push('head');
    if (/^\s*[a-h](?=[A-Z][a-z]{2})/m.test(raw)) why.push('foot');
    if (!x.page && /^[\s“"‘'(\[*†‡§¶.,;:—-]*[a-z]/.test(c.replace(/^['’‘"]\s+/, ''))) why.push('starts-lower');      // a printed page begins wherever the print does, so a page is not asked to begin a sentence (x.page)
  }
  const sentences = Math.max((c.match(/[.!?]["”’)\]]*(?:\s|$)/g) || []).length, 0); const stanza = !/\[\[\d+\]\]/.test(raw) && raw.trim().split('\n').filter((l) => l.trim()).length >= 3;
  if (!verse && !stanza && ((sentences < 2 && n >= 30) || n / Math.max(sentences, 1) > 70)) why.push('thin');
  let fn = 0; let caps = 0; let dig = 0; let prevEnd = true;
  for (const t of c.split(' ')) {
    const l = t.replace(/[^A-Za-z]/g, ''); if (/\d/.test(t) && !(prevEnd && /^[\[(]?\d{1,4}[.):\]]$/.test(t))) dig++;      // the number a saying or a verse begins with is its numbering, not a figure in the text
    if (l) { if (PSU_FUNC.has(l.toLowerCase())) fn++; if (/^[“"‘'(\[]*[A-Z]/.test(t) && !prevEnd && l.length >= 2) caps++; }
    prevEnd = /[.!?]["”’)\]]*$/.test(t);
  }
  if (n >= 25 && fn / n < 0.28) why.push('list');
  if (n >= 20 && (caps / n > (verse ? 0.2 : 0.24) || (caps / n > 0.15 && dig / n > 0.03))) why.push('names');
  if (verse) return { ok: !why.length, why };
  if (n >= 30 && (c.match(PSU_PLACES) || []).length / n * 100 > 6) why.push('places');
  if (n >= 40 && (c.match(PSU_VOICE) || []).length / n * 100 >= 3) why.push('note');
  else if (n >= 25 && (c.match(/\b[A-Z][a-z]{1,6}\.\s+[ivxlc\d]{1,6}[,.:]\s*\d{1,3}\b/gi) || []).length >= 2) why.push('note');      // sigla of a scholar's citations: "Yas. I, 65", "Gen. xv. 2"
  return { ok: !why.length, why };
}
/* a text's italics are marked with underscores (_who_), and a few scans leave other marks: the words are shown without them */
const psuStrip = (t) => String(t == null ? '' : t).replace(/(^|[^A-Za-z0-9_])_{1,2}([^_\n]{1,160}?)_{1,2}(?=$|[^A-Za-z0-9_])/g, '$1$2').replace(/_+/g, '');
/* does the Library's own note on an edition say that an introduction, notes or a commentary are in it? */
const PSU_NOTES_SAY = /\b(?:introductions?|footnotes?|notes|commentar(?:y|ies)|annotat\w+|critical apparatus|prolegomena)\b/i;
const psuNotesSay = (note) => PSU_NOTES_SAY.test(String(note == null ? '' : note));
/* the line under the reference: the shelf and the date as the Library catalogue holds them, the same for every text and with no judgement in it ("From the Hebrew Bible shelf, c. 10th–2nd c. BCE (collected).") */
function psuFrom(o) {
  const shelf = psuShelfName(o && o.shelf); if (!shelf) return ''; let when = String(o && o.when != null ? o.when : '').replace(/\s+/g, ' ').trim();
  when = when.replace(/^(\d{3,4})\s*[–-]\s*(\d{3,4})(?= |$)/, '$1 to $2');
  return `From the ${shelf} shelf${when ? ', ' + when : ''}.`;
}

/* ── pages: a page of a book as it is printed ──
   A PASSAGE is cut by structure and read twice (the gate above). A PAGE is not: it is the page of the book, everything on it, an editor's note and a damaged line too, and it is cited by its printed number. A scanned text
   keeps where each printed page begins (2z-pages-core.js: [section, paragraph, offset, label] in reading order), so a page runs from one mark to the next and is told by its label; a label in roman numerals (xii)
   is front matter. A text with no marks is cut into a window of about a page at paragraph edges. What a page may be is a choice (front matter, glossaries and appendixes can be left out; the clean test can be asked for);
   the rest of this block is arithmetic, with no page in it (tests/passage-core.test.js). */
const PSU_LEAF = { one: { count: 1, min: 400, target: 2200, max: 7000 }, two: { count: 2, min: 800, target: 4400, max: 12000 } };
const psuRoman = (label) => /^~?(?:[1-9]\d?:)?[ivxlcdm]{1,12}$/.test(String(label == null ? '' : label));
/* the pages of a text from its marks (flat: [[section, paragraph, offset, label], ...] in reading order): each runs to the next mark; e is where it ends, or null to the end of its section (a page does not cross a section) */
function psuLeaves(flat) {
  const out = []; if (!Array.isArray(flat)) return out;
  for (let i = 0; i < flat.length; i++) { const f = flat[i]; const nx = flat[i + 1]; if (!Array.isArray(f) || f.length < 4) continue; out.push({ s: f[0], p: f[1], o: f[2], label: String(f[3]), roman: psuRoman(f[3]), e: nx && nx[0] === f[0] ? { s: nx[0], p: nx[1], o: nx[2] } : null }); }
  return out;
}
/* the part of a paragraph whose visible text (the paragraph without its [[n]] verse markers) lies from `from` to `to` characters in; a marker inside the part is kept, one at the very end belongs to the next */
function psuSliceVisible(raw, from, to) {
  let out = ''; let pos = 0;
  for (const part of String(raw == null ? '' : raw).split(/(\[\[\d+\]\])/)) {
    if (/^\[\[\d+\]\]$/.test(part)) { if (pos >= from && pos < to) out += part; continue; }
    const a = Math.max(from - pos, 0); const b = Math.min(to - pos, part.length); if (b > a) out += part.slice(a, b); pos += part.length;
  }
  return out;
}
/* the text of `count` printed pages from page k (secs: [[heading, text]]): whole paragraphs, and the part of the first and of the last that lies on the page, as { text, s, p, pe } (the section and the paragraphs
   it begins and ends in, as the reader numbers them); null if the pages are not one after the other in one section, or hold no text */
function psuLeafText(secs, leaves, k, count) {
  const first = leaves[k]; if (!first || !secs[first.s]) return null; let last = first;
  for (let j = 1; j < count; j++) { const a = leaves[k + j - 1]; const b = leaves[k + j]; if (!b || !a.e || a.e.s !== b.s || a.e.p !== b.p || a.e.o !== b.o) return null; last = b; }
  const paras = String(secs[first.s][1]).split(/\n{2,}/); const end = last.e; const lastP = end ? end.p : paras.length - 1; const parts = [];
  for (let p = first.p; p <= lastP && p < paras.length; p++) {
    if (end && p === end.p && end.o === 0) break;      // the next page begins with this paragraph
    const from = p === first.p ? first.o : 0; const to = end && p === end.p ? end.o : Infinity;
    const piece = from > 0 || to !== Infinity ? psuSliceVisible(paras[p], from, to) : paras[p]; if (piece.trim()) parts.push([p, piece]);
  }
  return parts.length ? { text: parts.map((x) => x[1]).join('\n\n'), s: first.s, p: parts[0][0], pe: parts[parts.length - 1][0] } : null;
}
/* "p. 214", "pp. 214–215", "Vol. 2, p. 33" from the labels of the first and the last page (vols: the volumes' own names, where the text has them); a ~ (a number inferred from those around it) is not shown */
const PSU_LABEL = /^~?(?:([1-9]\d?):)?([1-9]\d{0,4}|[ivxlcdm]{1,12})$/;
function psuLeafCite(la, lb, vols) {
  const a = PSU_LABEL.exec(String(la == null ? '' : la)); if (!a) return ''; const b = lb ? PSU_LABEL.exec(String(lb)) : null;
  const vn = (n) => (Array.isArray(vols) && typeof vols[n - 1] === 'string' && vols[n - 1] ? vols[n - 1] : 'Vol. ' + n); const pre = a[1] ? vn(+a[1]) + ', ' : '';
  return b && b[2] !== a[2] && (b[1] || '') === (a[1] || '') ? `${pre}pp. ${a[2]}–${b[2]}` : `${pre}p. ${a[2]}`;
}
/* a window of text about `z.target` characters long from paragraph p of a section's paragraphs (paras), grown forward to the target and then, if the section ends first, backward, between whole paragraphs; null if it
   comes out under z.min or over z.max */
function psuParaWindow(paras, p, z) {
  let a = p; let b = p; let t = paras[p] || ''; const len = (x) => psuVis(x).length;
  while (len(t) < z.target && b + 1 < paras.length) { b++; t += '\n\n' + paras[b]; }
  while (len(t) < z.target * 0.6 && a > 0) { a--; t = paras[a] + '\n\n' + t; }
  const n = len(t); return n >= z.min && n <= z.max ? { text: t, p: a, pe: b } : null;
}

/* ── ways to make the seed (stage 2 of RANDOM_SUITE.md; tests/random-methods.test.js) ──
   Chance, the page's own draw, makes its seed from fresh secure bytes. The other ways make the same kind of seed, 128 bits as 32 hexadecimal characters, from something the person gives: a TEXT or a DATE
   (hashed with SHA-256, so the same text gives the same seed on any device) or DICE (the numbers are packed into the seed itself, so the draw code holds them). Nothing here looks at what a text means or at
   what a date is: that is the whole of the design. A way of drawing is a tool, and what the card says of it is the same for every draw of that way (psmHow). */
const PSM_DICE = [6, 10, 20];
const psmHex = (s, hash) => String(hash(String(s))).toLowerCase().replace(/[^0-9a-f]/g, '0').slice(0, 32).padEnd(32, '0');      // the same shape as the daily seed (psvDailySeed): 32 hexadecimal characters
/* the text as it is read: Unicode NFKC (a full-width "Ａ" is "A", a ligature is its letters), lower case, every run of white space one space, none at the ends */
const psmNormText = (t) => String(t == null ? '' : t).normalize('NFKC').toLowerCase().normalize('NFKC').replace(/\s+/g, ' ').trim();
const psmTextSeed = (t, hash) => { const n = psmNormText(t); return n ? psmHex('lamplighter-text|' + n, hash) : ''; };      // '' for a text with nothing in it
/* a day written YYYY-MM-DD that is a day of the calendar (and not, say, 2026-02-30), or '' */
function psmDay(s) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s == null ? '' : s).trim()); if (!m) return ''; const t = new Date(0); t.setUTCFullYear(+m[1], +m[2] - 1, +m[3]); return t.getUTCFullYear() === +m[1] && t.getUTCMonth() === +m[2] - 1 && t.getUTCDate() === +m[3] ? m[0] : ''; }
const psmDateSeed = (day, hash) => { const d = psmDay(day); return d ? psmHex('lamplighter-date|' + d, hash) : ''; };
/* ── dice ──
   A die is a d6, a d10 or a d20. The faces are read as the digits of a number: a d6 shows 1 to 6 and a d20 1 to 20 (the face minus 1 is the digit); a d10 shows 0 to 9, and a face marked 10 counts as 0.
   The list is the books the choices leave in a fixed order (psmOrder). The first dice, as many as it takes to pass the end of the list, are one number in the die's base; that number divided by the length of the
   list leaves the book's place on it, and the numbers at the very top, where a whole list no longer fits, are thrown out and rolled again (the step the secure draw uses: no book is likelier than another).
   Two more dice say how far through the book the place is. */
const psmBase = (die) => (PSM_DICE.includes(+die) ? +die : 0);
function psmDigit(face, die) {
  const b = psmBase(die); const t = typeof face === 'number' ? String(face) : String(face == null ? '' : face).trim(); const f = /^\d{1,2}$/.test(t) ? +t : NaN; if (!b || !Number.isInteger(f)) return -1;
  if (b === 10) return f <= 10 ? f % 10 : -1; return f >= 1 && f <= b ? f - 1 : -1;
}
const psmFace = (digit, die) => (psmBase(die) === 10 ? digit : digit + 1);      // the number a die shows for a digit
/* how many dice name a book on a list of n: the fewest whose numbers reach the end of the list; none for a list of one */
function psmNeed(n, die) { const b = psmBase(die); if (!b || !(n > 1)) return 0; let k = 1; let r = b; while (r < n && k < 12) { r *= b; k++; } return k; }
const PSM_PLACE = 2;      // the dice that say how far through the book: two (two d10 are a percentile, 00 to 99)
const psmNum = (ds, b) => ds.reduce((v, d) => v * b + d, 0);
/* the book the first dice (their digits ds) name on a list of n: { value, range, limit, thrown, index } (index is -1 for a number thrown out), or null if the dice are not the right number */
function psmBook(ds, die, n) {
  const b = psmBase(die); const k = psmNeed(n, die); if (!b || !(n >= 1) || !Array.isArray(ds) || ds.length !== k) return null;
  const range = b ** k; const limit = Math.floor(range / n) * n; const value = psmNum(ds, b); return { value, range, limit, thrown: value >= limit, index: value < limit ? value % n : -1 };
}
/* how far through the book the last two dice say, from 0 (its start) to just under 1: read as a number over the most two dice can make, so 47 of a percentile is 0.47 */
const psmPlaceOf = (ds, die) => { const b = psmBase(die); return b && Array.isArray(ds) && ds.length === PSM_PLACE ? psmNum(ds, b) / b ** PSM_PLACE : 0; };
/* the seed of a dice draw holds the numbers: d1ce, the die, how many dice name the book, their digits, the two of the place, and zeros after; so a draw code carries them and any device reads them back */
function psmDiceSeed(die, book, place) {
  const b = psmBase(die); const ok = (a, len) => Array.isArray(a) && (len == null ? a.length <= 8 : a.length === len) && a.every((d) => Number.isInteger(d) && d >= 0 && d < b);
  if (!b || !ok(book) || !ok(place, PSM_PLACE)) return '';
  return [0xd1, 0xce, b, book.length].concat(book, place).map((x) => x.toString(16).padStart(2, '0')).join('').padEnd(32, '0');
}
/* a seed read back as dice: { die, book, place } (digits), or null for any seed that is not one, or is out of shape */
function psmDiceFromSeed(seed) {
  const s = String(seed == null ? '' : seed).toLowerCase(); if (!/^d1ce[0-9a-f]{28}$/.test(s)) return null;
  const by = s.match(/../g).map((h) => parseInt(h, 16)); const die = by[2]; if (!PSM_DICE.includes(die)) return null; const k = by[3]; if (k > 8) return null;
  const book = by.slice(4, 4 + k); const place = by.slice(4 + k, 4 + k + PSM_PLACE);
  if (book.concat(place).some((d) => d >= die) || by.slice(4 + k + PSM_PLACE).some((x) => x !== 0)) return null;
  return { die, book, place };
}
/* dice rolled by the secure generator: below(b) gives a uniform whole number in [0, b) (randInt of 01-random.js). The numbers thrown out are kept, to be shown.
   { die, n (the books on the list), book, place (digits), thrown (the digits of each throw-out), index (the book's place on the list, from 0), seed, typed: false } or null */
function psmRoll(die, n, below) {
  const b = psmBase(die); if (!b || !(n >= 1)) return null; const k = psmNeed(n, die); const thrown = []; let book = null; let r = null;
  for (let t = 0; t < 2000 && !book; t++) { const ds = Array.from({ length: k }, () => below(b)); r = psmBook(ds, die, n); if (r.thrown) thrown.push(ds); else book = ds; }
  if (!book) return null;
  const place = Array.from({ length: PSM_PLACE }, () => below(b));
  return { die: b, n, book, place, thrown, index: r.index, seed: psmDiceSeed(b, book, place), typed: false };
}
/* the numbers a person typed, as whole numbers: a d6's may be run together (2 4 1 3 5 or 24135); the others are told apart by a space or a comma */
function psmParseFaces(str, die) { const toks = String(str == null ? '' : str).match(/\d+/g) || []; return psmBase(die) === 6 ? toks.join('').split('').map(Number) : toks.map(Number); }
/* typed numbers as a draw: the same result as psmRoll, or { error: 'die' | 'count' (need, k, have) | 'face' (at, face) | 'thrown' (value, limit, k) } with what is wrong */
function psmTyped(faces, die, n) {
  const b = psmBase(die); if (!b || !(n >= 1)) return { error: 'die' }; const k = psmNeed(n, die); const need = k + PSM_PLACE;
  if (!Array.isArray(faces) || faces.length !== need) return { error: 'count', need, k, have: Array.isArray(faces) ? faces.length : 0 };
  const ds = faces.map((f) => psmDigit(f, die)); const bad = ds.indexOf(-1); if (bad >= 0) return { error: 'face', at: bad, face: faces[bad] };
  const book = ds.slice(0, k); const place = ds.slice(k); const r = psmBook(book, die, n); if (r.thrown) return { error: 'thrown', value: r.value, limit: r.limit, k };
  return { die: b, n, book, place, thrown: [], index: r.index, seed: psmDiceSeed(b, book, place), typed: true };
}
/* the list dice count along: shelf by shelf (the collection's number), and within a shelf in the order the Library lists the books, which is how the Books section shows them; a copy, the facts are not moved */
function psmOrder(facts) { return (Array.isArray(facts) ? facts : []).map((f, i) => [f, i]).sort((u, v) => (u[0].c - v[0].c) || (u[1] - v[1])).map((x) => x[0]); }
/* what the card says of how a draw by one of these ways was made, in plain words and the same for every draw of that way: it names the way and the rule, shows every number, and never says what a draw means.
   src: 'text' | 'date' | 'daily' | 'dice' | 'replay-text' | 'replay-date' | 'replay-dice'; o.dice: { die, book, place, n, index, thrown, typed } (n and index are not known to a replay) */
function psmHow(src, o) {
  const d = (o && o.dice) || null; const faces = (a) => a.map((q) => psmFace(q, d.die)).join(' ');
  if (src === 'text') return 'Drawn from a text you typed, used as a seed. The same text with the same choices gives the same passage on any device. The meaning of the words played no part: the passage was chosen by arithmetic (SHA-256) from the letters of the text, as it would be from any other string. The text itself is not kept, sent or put in the address.';
  if (src === 'date') return 'Drawn from a date you chose, used as a seed. The same date with the same choices gives the same passage on any device. Nothing but the digits of the date played a part: the passage was chosen by arithmetic (SHA-256), as it would be from any other string. The date is not kept or put in the address.';
  if (src === 'replay-text') return 'Replayed from a draw code made from a text used as a seed. The same text with the same choices gives this passage again; the text itself is not in the code.';
  if (src === 'replay-date') return 'Replayed from a draw code made from a date used as a seed. The same date with the same choices gives this passage again; the date itself is not in the code.';
  if (src === 'daily') return 'Drawn from today’s date and the name of a saved filter, used as a seed: the same all day, and a new one tomorrow. Nothing but those two strings played a part.';
  if (src === 'replay-dice' && d) return `Replayed from a draw code that holds dice numbers: a d${d.die}; the dice that name the book ${d.book.length ? faces(d.book) : '(none: one book)'}; the two that say how far through it ${faces(d.place)}. The same numbers give the same passage.`;
  if (src === 'dice' && d) {
    const b = psmBase(d.die); const who = d.typed ? 'the numbers you typed' : 'numbers rolled by the secure random generator'; let s = `Drawn from dice: a d${d.die}, ${who}.`;
    if (d.n > 1) s += ` The ${d.book.length === 1 ? 'first die' : 'first ' + d.book.length + ' dice'} (${faces(d.book)}) read as one number in base ${b}: ${psmNum(d.book, b)}. The list the choices leave has ${d.n} books, so the book is number ${d.index + 1} on it.`;
    else s += ' The choices leave one book, so no dice were needed to name it.';
    if (d.thrown && d.thrown.length) s += ` Thrown out and rolled again (too near the top of the range, where the first books of the list would be favoured): ${d.thrown.slice(0, 6).map(faces).join(', ')}${d.thrown.length > 6 ? ` and ${d.thrown.length - 6} more` : ''}.`;
    return `${s} The last two dice (${faces(d.place)}) say the place is ${Math.round(psmPlaceOf(d.place, d.die) * 100)} hundredths of the way through the book. The same numbers give the same passage.`;
  }
  return '';
}

/* ── no repeats ──
   A unit is { id, si, from, to } (verse numbers, or paragraph numbers); two overlap if they are in the same section and their ranges meet. A session remembers what it has shown. */
const psuOverlap = (a, b) => !!a && !!b && a.id === b.id && a.si === b.si && a.from <= b.to && b.from <= a.to;
function psuSeenAny(seen, u) { for (let i = seen.length - 1; i >= 0; i--) if (psuOverlap(seen[i], u)) return true; return false; }

if (typeof module !== 'undefined' && module.exports) module.exports = { PSU_PASSAGE, psuSizeOf, PSU_STRAY, PSU_COMMON, psuNear, psuOcrNear, PSU_LEAF, psuRoman, psuLeaves, psuSliceVisible, psuLeafText, psuLeafCite, psuParaWindow, psuKnown, psuLongS, psuOcr, psuHead, psuGate, psuStrip, psuNotesSay, psuFrom, PSU_NOTES_SAY, PSU_SIZES, PSU_NOISE, psuNumbers, psuVis, psuVerseParse, psuVerseText, psuVerseAt, psuEnds, psuLower, psuCut, psuDepth, psuQuotes, psuVerseUnit, psuDash, psuBookName, psuHeadNum, psuRefVerses, psuHeadSegs, psuHeading, psuShortTitle, psuRefProse, psuContext, psuShelfName, psuKind, PSU_KIND, psuNoise, psuAssess, psuOverlap, psuSeenAny, PSM_DICE, PSM_PLACE, psmHex, psmNormText, psmTextSeed, psmDay, psmDateSeed, psmBase, psmDigit, psmFace, psmNeed, psmNum, psmBook, psmPlaceOf, psmDiceSeed, psmDiceFromSeed, psmRoll, psmParseFaces, psmTyped, psmOrder, psmHow };
