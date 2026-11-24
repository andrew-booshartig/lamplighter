/* Passage audit. Run: node tools/audit_passages.js [--legacy] [--list-sections] [--sample N] [--seed S] [--book id] [--examples] [--examples-n N] [--worst N]
   Draws many picks from every readable book with the live picker (src/js/6d-passage.js, with the pure core src/js/2z-passage-core.js) in the two kinds the Random tab offers: a PASSAGE (a unit with a reference:
   verses, or a paragraph or few) and a PAGE. Every pick is judged by an independent, stricter classifier than the picker uses, so a weakness in the picker's own filters shows up here. It reports, per kind, how many picks look like:
   a footnote or editor's note, a glossary / index / list of entries, a bibliography or citation list, a table of contents, a heading or title page, a fragment (starts or ends mid-sentence), mostly names and numbers,
   or scan damage; for verse units whether the unit begins at a verse and ends at the end of a sentence and whether its reference (book, chapter, verse range) agrees with the verse numbers in the text; and how the
   references are made up: verses, the text's own printed numbers, a named section, a place in the book, or the title alone. Examples are printed so they can be read by eye.
   --legacy audits the old four lengths of pickPassage (320, 560, 1,500, 3,000 characters) as this tool did before. The corpus lives in ../texts (built by tools/build_texts.py). */
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const P = require('../src/js/6d-passage.js'); const C = require('../src/js/2z-passage-core.js');
const dir = path.join(__dirname, '../../texts');
const args = process.argv.slice(2); const flag = (n) => args.includes(n); const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const PER = +opt('--sample', 24); const SEED = +opt('--seed', 1); const ONLY = opt('--book', ''); const LEGACY = flag('--legacy');
const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
if (!fs.existsSync(path.join(dir, 'index.js'))) { console.log('texts folder not found at', dir); process.exit(1); }
const T = { data: {}, meta: {}, add(id, m, s) { this.data[id] = { m, s }; }, addIndex(i) { Object.assign(this.meta, i); } };
const run = (f) => vm.runInNewContext(fs.readFileSync(path.join(dir, f), 'utf8'), { BEATLAB_TEXTS: T }, { filename: f });
run('index.js'); const ids = Object.keys(T.meta).filter((id) => !ONLY || id === ONLY);

const clean = (t) => String(t).replace(/\[\[\d+\]\]/g, ' ').replace(/\s+/g, ' ').trim();
/* the judge: independent of the picker. Returns a list of problems. */
function judge(text, secHeading, scan) {
  const c = clean(text); const out = [];
  const words = c.match(/[A-Za-z’'-]+/g) || []; const nW = words.length || 1;
  const sentences = c.split(/(?<=[.!?”"’)])\s+(?=[A-Z“"‘(\[])/).filter((s) => s.length > 1);
  const caps = words.filter((w) => /^[A-Z]/.test(w)).length;
  const longSentences = sentences.filter((s) => s.split(/\s+/).length >= 6).length;
  const colonEntries = (c.match(/(?:^|[.;]\s)[A-Z][\w’'-]+(?: [A-Z][\w’'-]+){0,3}(?: —| –| -|:|, (?:n|v|adj)\.) /g) || []).length;   // "Term — meaning." entries, one per sentence
  const lines = String(text).split('\n').filter((l) => l.trim());
  const shortLines = lines.filter((l) => clean(l).length < 70).length;
  const semicolons = (c.match(/;/g) || []).length;
  const digitsRef = (c.match(/\b\d{1,4}(?:[:.,–-]\d{1,4})+\b/g) || []).length;       // 12:4, 12.4, 1966-67
  const parens = (c.match(/\([^)]{0,60}\)/g) || []).length;
  const years = (c.match(/\b1[0-9]{3}\b|\b20[0-2][0-9]\b/g) || []).length;
  const commasPerWord = (c.match(/,/g) || []).length / nW;
  if (/^(footnote|notes?\b|n\.|\d+\s?[.)] ?(?:see|cf|ibid|the Greek|the Hebrew|Heb\.|Gr\.|Lat\.))/i.test(c) || /\b(?:ibid|op\. ?cit|loc\. ?cit|cf\.|q\.v\.|s\.v\.|viz\.|i\.e\.|e\.g\.)/i.test(c) && /\b(?:ibid|op\. ?cit|loc\. ?cit|cf\.|q\.v\.|s\.v\.)/i.test(c)) out.push('note');
  if (/\b(?:vol|vols)\. ?[IVX\d]|\bpp?\. ?\d|\bed\. |\beds\. |\btrans\. |\bLondon,|\bNew York,|\bOxford,|\bLeipzig|\bParis, \d|\bBerlin, \d|\b(?:Press|Verlag), \d{4}/.test(c) && (years >= 1 || digitsRef >= 2)) out.push('citation');
  if ((years >= 3 && parens >= 3) || (digitsRef >= 4 && nW < 160)) out.push('citation');
  if (colonEntries >= 4 || (shortLines >= 4 && shortLines / lines.length > 0.8 && lines.every((l) => !/[.!?]["”’)]?$/.test(l.trim())) && sentences.length < 3 && !/\[\[\d+\]\]/.test(text)) ) out.push('glossary');
  if (/^(?:[A-Z][\w’'-]+(?: [A-Z][\w’'-]+)*,? (?:\d{1,4}(?:[-–,] ?\d{1,4})*[,;]? ?){2,})/.test(c)) out.push('index');
  if (nW > 25 && caps / nW > 0.45 && longSentences < 2) out.push('names');                                  // lists of proper names
  if (longSentences === 0 && nW >= 20 && semicolons <= 1 && !/\[\[\d+\]\]/.test(text) && shortLines < lines.length) out.push('no-sentences');
  if (/^(?:contents|table of contents|index|glossary|bibliography|abbreviations|list of|errata|preface to the|publisher|copyright|printed (?:in|by)|all rights|transcriber|produced by|this e-?text|project gutenberg)/i.test(c) || /\b(?:project gutenberg|public domain in the|e-?text|html version|scanned by|proofread)/i.test(c)) out.push('front-or-back-matter');
  if (/^(?:index|glossary|bibliography|abbreviations|contents|notes?|footnotes|appendix|list of|errata|general index|index of|select(?:ed)? bibliography|further reading|sources|references|works cited|chronolog|table of|genealog|maps?|illustrations)\b/i.test(secHeading || '')) out.push('section:' + String(secHeading).trim().split(/\s+/)[0].toLowerCase());
  if (/^[a-z]/.test(c)) out.push('starts-mid-sentence');
  const last = c.replace(/\s*\[\[\d+\]\]\s*$/, '');
  if (!/[.!?”"’)\]:;]$/.test(last) && !/\n/.test(text.trim())) out.push('ends-mid-sentence');
  if (digitsRef >= 3 && nW < 80) out.push('refs');
  if (commasPerWord > 0.17 && semicolons >= 3 && longSentences <= 2 && nW > 30) out.push('list-like');
  if (scan && C.psuNoise(c) > C.PSU_NOISE.scan * 1.7) out.push('scan-damage');                              // twice the picker's own limit: a pick the picker let through, the best of a bad book excepted
  return out;
}
/* a verse unit: it must begin at a verse (after an optional title), end where a sentence ends, hold its verses in order, and be cited by the numbers it holds */
function judgeVerses(u, ref, raw) {
  const out = []; const t = u.text; const nums = (t.match(/\[\[(\d+)\]\]/g) || []).map((x) => +x.slice(2, -2));
  if (!nums.length || !/^(?:\([^\n]{0,300}\)\n)?\[\[\d+\]\]/.test(t)) out.push('verse-start');
  if (nums.some((n, i) => i && n <= nums[i - 1])) out.push('verse-order');
  if (!/[.!?…]["”’)\]]*$/.test(t.replace(/\s+$/, '')) && !raw.endsWith(t)) out.push('verse-end');
  const m = /(\d+)(?:–(\d+))?(?: \([^)]*\))?$/.exec(ref.main); if (!m || +m[1] !== nums[0] || +(m[2] || m[1]) !== nums[nums.length - 1]) out.push('ref-mismatch');
  if (/^[a-z]/.test(clean(t))) out.push('verse-lower');
  const o = (t.match(/“/g) || []).length; const c = (t.match(/”/g) || []).length; if (c > o) out.push('speech-begun-earlier');
  return out;
}
const MODES = LEGACY ? [['short', 320], ['medium', 560], ['long', 1500], ['longer', 3000]] : [['passage', 560], ['page', 1500]];
const tally = {}; const ex = {}; const perBook = {}; const lens = {}; let grand = 0; const refKinds = {}; const kinds = {};
for (const [m] of MODES) { tally[m] = {}; ex[m] = {}; lens[m] = []; refKinds[m] = {}; kinds[m] = {}; }
const noPick = [];
for (const id of ids) {
  run(id + '.js'); const d = T.data[id]; const rng = mulberry(id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), SEED * 7919)); const scan = /scan|OCR/i.test(`${d.m.note || ''} ${d.m.license || ''}`);
  const lib = { title: T.meta[id].title }; let got = 0;
  for (const [mode, target] of MODES) for (let i = 0; i < PER; i++) {
    const p = LEGACY ? P.pickPassage(d.s, d.m, rng, { target }) : P.psgPickUnit(d.s, d.m, rng, { mode });
    if (!p) continue; got++; grand++;
    const c = clean(p.text); lens[mode].push(c.length / target); p.id = id; if (LEGACY) p.kind = 'prose';
    const probs = judge(p.text, p.heading, scan); let ref = null;
    if (!LEGACY) {
      ref = P.psgRefOf(p, lib, T.meta[id], ''); kinds[mode][p.kind] = (kinds[mode][p.kind] || 0) + 1;
      if (p.kind === 'verses') probs.push(...judgeVerses(p, ref, String(d.s[p.si][1])));
      const rk = p.kind === 'verses' ? 'verses' : p.nums ? 'printed numbers' : ref.kind === 'section' && /^section \d+ of \d+/.test(ref.sub) ? 'place in the book' : ref.kind === 'section' ? 'named section' : 'title only';
      refKinds[mode][rk] = (refKinds[mode][rk] || 0) + 1;
      if (p.kind !== 'verses') { const full = C.psuHeading(p.heading, 400); if (/…$/.test(full) || /\bpart \d+ of \d+/i.test(full)) probs.push('ref-garbled'); }      // the section's name still carries the builder's first-words tail (a long name cut at 90 characters is not that)
    }
    for (const k of probs) { tally[mode][k] = (tally[mode][k] || 0) + 1; (ex[mode][k] = ex[mode][k] || []).push({ id, ref: ref ? ref.cite : '', heading: p.heading, text: c.slice(0, 260) + (c.length > 260 ? ' …' + c.slice(-80) : ''), len: c.length }); (perBook[id] = perBook[id] || {})[k] = (perBook[id][k] || 0) + 1; }
    if (probs.length) tally[mode]._any = (tally[mode]._any || 0) + 1;
    tally[mode]._n = (tally[mode]._n || 0) + 1;
  }
  if (!got) noPick.push(id);
}
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : '-');
console.log(`\n${ids.length} books, ${grand} ${LEGACY ? 'passages' : 'passages and pages'} judged (${PER} per book per kind, seed ${SEED})`);
for (const [mode, target] of MODES) {
  const t = tally[mode]; const n = t._n || 0; const ls = lens[mode].sort((a, b) => a - b); const med = ls.length ? ls[Math.floor(ls.length / 2)] : 0;
  console.log(`\n── ${mode} (target ${target}): ${n} picks, ${pct(t._any || 0, n)} flagged, median length ${(med * target) | 0} chars (${med.toFixed(2)}× target), 10th pct ${((ls[Math.floor(ls.length * 0.1)] || 0) * target) | 0}`);
  for (const k of Object.keys(t).filter((x) => !x.startsWith('_')).sort((a, b) => t[b] - t[a])) console.log(`   ${k.padEnd(24)} ${String(t[k]).padStart(5)}  ${pct(t[k], n)}`);
  if (!LEGACY) { console.log(`   what was drawn: ${Object.entries(kinds[mode]).map(([k, v]) => `${k} ${pct(v, n)}`).join(', ')}`); console.log(`   how it is cited: ${Object.entries(refKinds[mode]).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v, n)}`).join(', ')}`); }
}
if (flag('--examples')) for (const [mode] of MODES) { console.log(`\n══ ${mode} examples`); for (const k of Object.keys(ex[mode])) { console.log(`  [${k}]`); for (const e of ex[mode][k].slice(0, +opt('--examples-n', 3))) console.log(`    ${e.id} · ${e.ref || e.heading} · ${e.len}\n      ${e.text.replace(/\n/g, ' ⏎ ')}`); } }
const worst = Object.entries(perBook).map(([id, o]) => [id, Object.values(o).reduce((a, b) => a + b, 0), o]).sort((a, b) => b[1] - a[1]).slice(0, +opt('--worst', 15));
console.log('\nbooks with the most flagged picks:'); for (const [id, n, o] of worst) console.log(`   ${id.padEnd(8)} ${String(n).padStart(4)}  ${JSON.stringify(o)}`);
if (noPick.length) console.log('\nbooks that gave no passage at all:', noPick.join(', '));
if (flag('--list-sections')) {
  const re = /^(?:index|glossary|bibliography|abbreviations|contents|notes?|footnotes|appendix|list of|errata|general index|index of|select|further reading|sources|references|works cited|chronolog|table of|genealog|maps?|illustrations|preface|introduction|foreword|prolegomena|editor|translator|colophon|addenda|addendum|corrigenda|supplement)\b/i; const seen = {};
  for (const id of ids) { run(id + '.js'); for (const [h, t] of T.data[id].s) { const k = String(h).replace(/\bpart \d+ of \d+\b/i, '').replace(/[\d.]+/g, '#').trim().toLowerCase(); if (re.test(h)) { (seen[k] = seen[k] || { n: 0, chars: 0, ids: new Set() }); seen[k].n++; seen[k].chars += t.length; seen[k].ids.add(id); } } }
  console.log('\nsection headings that look like back/front matter:'); for (const [k, v] of Object.entries(seen).sort((a, b) => b[1].chars - a[1].chars).slice(0, 80)) console.log(`   ${String(v.chars).padStart(8)} chars · ${String(v.n).padStart(3)}× · ${v.ids.size} books · ${k.slice(0, 60)}`);
}
