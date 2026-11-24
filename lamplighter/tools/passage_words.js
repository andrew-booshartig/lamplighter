/* The word list behind the Random quality gate (src/js/2z-passage-words.js).
   Run: node tools/passage_words.js [--min N] [--check]
   The gate (2z-passage-core.js, psuGate) tells a page of scanned text that is damaged ("fhould", "combnft", "confefled": the long s read as an f) from a clean one by the share of its words that are known English
   words. The list is built from the Library's own typed texts (every readable book that is not a scan, in ../texts), never fetched: a word is kept when it is found in at least N of those books (default 50).
   The file is sorted and written with a shared-prefix count in front of each word (a base-36 digit), so it stays small; the decoder is in the file itself. --check only reports the size and does not write. */
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const dir = path.join(__dirname, '../../texts'); const out = path.join(__dirname, '../src/js/2z-passage-words.js');
const args = process.argv.slice(2); const MIN = +(args.includes('--min') ? args[args.indexOf('--min') + 1] : 50);
if (!fs.existsSync(path.join(dir, 'index.js'))) { console.log('texts folder not found at', dir); process.exit(1); }
const T = { data: {}, meta: {}, add(id, m, s) { this.data[id] = { m, s }; }, addIndex(i) { Object.assign(this.meta, i); } };
const run = (f) => vm.runInNewContext(fs.readFileSync(path.join(dir, f), 'utf8'), { BEATLAB_TEXTS: T }, { filename: f });
run('index.js');
const typed = Object.keys(T.meta).filter((id) => !/scan|OCR/i.test(`${T.meta[id].note || ''} ${T.meta[id].license || ''}`));
const df = new Map();
for (const id of typed) {
  run(id + '.js'); const d = T.data[id]; if (!d) continue; const seen = new Set();
  for (const [, t] of d.s) for (const w of String(t).replace(/\[\[\d+\]\]/g, ' ').toLowerCase().match(/[a-z]{3,}/g) || []) if (!seen.has(w)) { seen.add(w); df.set(w, (df.get(w) || 0) + 1); }
  delete T.data[id];
}
const words = [...df].filter(([, k]) => k >= MIN).map(([w]) => w).sort();
let prev = ''; const coded = words.map((w) => { let p = 0; while (p < prev.length && p < w.length && p < 35 && prev[p] === w[p]) p++; prev = w; return p.toString(36) + w.slice(p); }).join(' ');
const body = `/* ═══════════════════════════ 2z · The word list of the Random quality gate (made by tools/passage_words.js; do not edit by hand) ═══════════════════════════
   ${words.length} lower-case words found in at least ${MIN} of the ${typed.length} typed (not scanned) books of the Library. Used by psuGate in 2z-passage-core.js to tell damaged scan text from clean text. Each entry is a base-36 digit
   (how many letters it shares with the entry before) and the rest of the word. */
const PSU_WORDS = (() => { const s = new Set(); let prev = ''; for (const e of ${JSON.stringify(coded)}.split(' ')) { const w = prev.slice(0, parseInt(e[0], 36)) + e.slice(1); s.add(w); prev = w; } return s; })();
if (typeof module !== 'undefined' && module.exports) module.exports = { PSU_WORDS };
`;
console.log(`${typed.length} typed books, ${df.size} distinct words, ${words.length} kept (found in ${MIN} or more books), ${(body.length / 1024).toFixed(0)} KB`);
if (!args.includes('--check')) { fs.writeFileSync(out, body); console.log('wrote', out); }
