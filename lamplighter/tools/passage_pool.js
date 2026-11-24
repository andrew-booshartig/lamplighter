/* The two lists behind "Scriptures and sources" on the Random page (src/js/2z-passage-pool.js).
   Run: node tools/passage_pool.js [--check] [--about N]
   "Scriptures and sources" is the default pool of the Random page. Scriptures and primary sources are what it is for, so it leaves out the study shelf, field records, folklore and the like (the shelves named in
   LIB_SHELF_ONLY) and, in the shelves that remain, the books where a pick is too often an editor's voice and not the text. Two lists say which, both made here from the Library's own catalogue and texts (../texts),
   never fetched, and neither a verdict on any book: the book stays in "Everything", on its shelf and by name.
     PSU_ANNOTATED  the catalogue note of the edition says that an introduction, notes, footnotes or a commentary are inside it, and its section headings do not mark where (under 5% of its text sits in sections
                    named introduction, notes, appendix and the like). Where the headings do mark the matter the picker already skips it, and the book stays in.
     PSU_ABOUT      the edition does not say so, but the picks themselves do: in 24 passages drawn from the book (with the gate of 2z-passage-core.js already applied), a mean of --about (default 0.18) or more
                    phrases in every hundred words are about the text and not the text: "the passage", "this tablet", "the translation", "the word". Measured on the picks the page itself would show.
     READ_OUT       a short list made by reading draws (below): books where an editor's or a translator's voice, or a record of customary law, came up again and again in the draws, and no rule above caught it.
   The first two are measured, the third read, not guessed; a draw from either kind of book was a translator's or editor's note about one time in three (reading 120 draws, 18 November 2026). --check reports and does not write. */
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const dir = path.join(__dirname, '../../texts'); const out = path.join(__dirname, '../src/js/2z-passage-pool.js');
const P = require('../src/js/6d-passage.js'); const C = require('../src/js/2z-passage-core.js'); const D = require('../src/js/24-data-path-lib.js');
const args = process.argv.slice(2); const ABOUT = +(args.includes('--about') ? args[args.indexOf('--about') + 1] : 0.18);
if (!fs.existsSync(path.join(dir, 'index.js'))) { console.log('texts folder not found at', dir); process.exit(1); }
const T = { data: {}, meta: {}, add(id, m, s) { this.data[id] = { m, s }; }, addIndex(i) { Object.assign(this.meta, i); } };
const run = (f) => vm.runInNewContext(fs.readFileSync(path.join(dir, f), 'utf8'), { BEATLAB_TEXTS: T }, { filename: f });
run('index.js');
const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const AB = /\b(?:the|this|that|these|those|our) (?:texts?|passages?|readings?|translations?|expressions?|inscriptions?|documents?|MS|manuscripts?|obverse|reverse|stanzas?|versions?|editions?|colophon|sentences?|clauses?|phrases?|roots?|sections?|verses?|original)\b/gi;
const aboutOf = (text) => { const c = String(text).replace(/\[\[\d+\]\]/g, ' ').replace(/\s+/g, ' '); const w = Math.max((c.match(/[A-Za-z]+/g) || []).length, 1); return (c.match(AB) || []).length / w * 100; };
/* books read through (draws of 18 November 2026 read one by one) in which the page found more often than not an editor's note, a translator's introduction or a record of rules, and not the text; each with the plain reason */
const READ_OUT = {
  'x-gil': 'the edition is mostly the editor’s study of the tablets', 'x-pop': 'a retelling with the author’s comparisons and study', 'x-shy': 'transliteration lines and commentary are printed with the translation',
  'x-lgd': 'the editor’s commentary on each legend is printed with it', 'x-pta': 'the editors’ long introduction is a third of the book, with nothing to mark it',
};
const shelfOnly = new Set(D.LIB_SHELF_ONLY); const annotated = []; const about = []; const kept = []; const stat = {};
for (const l of D.LIB) {
  const m = T.meta[l.id]; if (!m || shelfOnly.has(l.group) || /scan|OCR/i.test(`${m.note || ''} ${m.license || ''}`)) continue;      // a machine-read scan is not in the default pool at all (psgInSources), so it needs no list
  run(l.id + '.js'); const d = T.data[l.id]; if (!d) continue;
  const mat = P.psgMatterSections(d.s); let tot = 0; let mk = 0; d.s.forEach((s, i) => { const L = String(s[1]).length; tot += L; if (mat.has(i)) mk += L; });
  if (C.psuNotesSay(m.note)) { if (mk / Math.max(tot, 1) < 0.05) { annotated.push(l.id); delete T.data[l.id]; continue; } kept.push(l.id); }
  const isVerse = d.s.reduce((a, x) => a + (/\[\[\d+\]\]/.test(x[1]) ? String(x[1]).length : 0), 0) / Math.max(tot, 1) >= 0.6;      // a Bible: verse texts are always the text
  if (tot >= 20000 && !isVerse) {
    const rng = mulberry(l.id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 91)); let n = 0; let sum = 0;
    for (let i = 0; i < 24; i++) { const u = P.psgPickUnit(d.s, d.m, rng, { mode: 'passage' }); if (!u) continue; n++; sum += aboutOf(u.text); }
    if (n >= 8 && sum / n >= ABOUT) about.push(l.id);
  }
  delete T.data[l.id];
}
annotated.sort(); about.sort();
const scanOf = (id) => T.meta[id] && /scan|OCR/i.test(`${T.meta[id].note || ''} ${T.meta[id].license || ''}`);
for (const id of Object.keys(READ_OUT)) if (scanOf(id) || !T.meta[id] || annotated.includes(id) || about.includes(id)) { console.log('read-out entry not needed (a scan, not in the Library, or already left out by a rule above): ' + id); delete READ_OUT[id]; }
const body = `/* ═══════════════════════════ 2z · Editions left out of "Scriptures and sources" (made by tools/passage_pool.js; do not edit by hand) ═══════════════════════════
   Two lists of books that stay in "Everything", on their shelves and by name (the tool says how each is made). PSU_ANNOTATED: ${annotated.length} editions whose catalogue note says an introduction, notes or a commentary are inside
   them and whose section headings do not mark where. PSU_READ_OUT: ${Object.keys(READ_OUT).length} read through and left out, each with its reason. PSU_ABOUT: ${about.length} more whose picks are about the text, not the text (a mean of ${ABOUT} or more phrases like "the passage" or "this tablet" per hundred words). */
const PSU_ANNOTATED = new Set(${JSON.stringify(annotated.join(' '))}.split(' '));
const PSU_ABOUT = new Set(${JSON.stringify(about.join(' '))}.split(' '));
const PSU_READ_OUT = ${JSON.stringify(READ_OUT)};
if (typeof module !== 'undefined' && module.exports) module.exports = { PSU_ANNOTATED, PSU_ABOUT, PSU_READ_OUT };
`;
const left = new Set([...annotated, ...about, ...Object.keys(READ_OUT)]); const byShelf = {};
for (const l of D.LIB) { if (!T.meta[l.id] || shelfOnly.has(l.group)) continue; const s = (byShelf[l.group] = byShelf[l.group] || { all: 0, out: 0 }); s.all++; if (left.has(l.id) || scanOf(l.id)) s.out++; }
console.log(`${annotated.length} annotated editions (the catalogue says notes are inside, the headings do not mark them), ${about.length} more whose picks talk about the text; ${kept.length} annotated editions stay in because their headings mark the matter`);
console.log('books in the default pool, by shelf (machine-read scans are not in it): ' + Object.entries(byShelf).map(([g, s]) => `${g} ${s.all - s.out}/${s.all}`).join(', '));
if (!args.includes('--check')) { fs.writeFileSync(out, body); console.log('wrote', out); }
