#!/usr/bin/env node
/* Word help coverage: which glossary entries a text actually uses, which entries it never uses, and which capitalised words in it nothing explains yet.
   Usage:  node tools/audit_terms.js x-pah x-bun x-ave          (one or more text ids; no ids = the Persia and Zoroastrian group)
           node tools/audit_terms.js x-pah --unknown 80          (how many unexplained words to list; default 40)
           node tools/audit_terms.js x-pah --entries             (also list every entry with its mention count)
   It uses the same finder as the reader (src/js/2z-terms-core.js), every mention counted, so the numbers are what a reader would meet.
   "Unexplained" words are capitalised words that no entry matches and, when the system word list is present (/usr/share/dict/words), that are not ordinary English; scan noise shows up there too,
   and a long run of one garbled spelling is the sign that an entry needs a `like` pattern. Nothing is written. */
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const SRC = path.join(__dirname, '../src/js/');
Object.assign(globalThis, require(SRC + '2z-lookup-core.js'));
const T = require(SRC + '2z-terms-core.js');
const { GLOSSARY } = require(SRC + '2o-glossary.js');
const TEXTS = path.join(__dirname, '../../texts/');
const args = process.argv.slice(2); const flag = (n) => args.indexOf('--' + n);
const numAfter = (n, d) => { const i = flag(n); return i >= 0 && /^\d+$/.test(args[i + 1] || '') ? +args[i + 1] : d; };
const showEntries = flag('entries') >= 0; const TOPN = numAfter('unknown', 40);
const ids0 = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1] === '--unknown'));

/* the library group of each text (the data file lists "id|title|group|date|route" lines) */
const libSrc = fs.readFileSync(SRC + '24-data-path-lib.js', 'utf8'); const groupOf = {};
for (const m of libSrc.matchAll(/'([a-z]-[a-z0-9]+)\|(?:[^'\\]|\\.)*?\|([a-z]{2})\|/g)) groupOf[m[1]] = m[2];
const ids = ids0.length ? ids0 : Object.keys(groupOf).filter((id) => groupOf[id] === 'ir');
if (!fs.existsSync(TEXTS + 'index.js')) { console.error('No texts folder next to the project (looked in ' + TEXTS + ')'); process.exit(2); }

let dict = null; try { dict = new Set(fs.readFileSync('/usr/share/dict/words', 'utf8').split('\n').map((w) => luNorm(w))); } catch (e) { /* no word list: every unmatched capitalised word is listed */ }
const english = (w) => !!dict && (dict.has(w) || dict.has(luStem(w)) || dict.has(w.replace(/(ed|ing|ly|ness)$/, '')) || dict.has(w.replace(/ies$/, 'y')) || dict.has(w.replace(/es$/, '')));
const roman = (w) => /^[ivxlcdm]+$/.test(w);

const total = new Map(); let allParas = 0; let allTokens = 0; const unknown = new Map(); const shown = new Map();
const matched = new Map();   // entry place → texts that mention it
for (const id of ids) {
  const file = TEXTS + id + '.js'; if (!fs.existsSync(file)) { console.error('no such text: ' + id); continue; }
  let got = null; vm.runInNewContext(fs.readFileSync(file, 'utf8'), { BEATLAB_TEXTS: { add(i, meta, secs) { got = secs; }, addIndex() {} } }, { filename: file });
  const ix = T.trmIndex(GLOSSARY, { id, group: groupOf[id] || '' }); let paras = 0; let hits = 0; let secsWith = 0; const per = new Map();
  for (const [, body] of got) {
    let any = false;
    for (const blk of String(body).split(/\n{2,}/)) {
      const vis = blk.replace(/^## /, '').replace(/\[\[\d+\]\]/g, ''); if (!vis.trim()) continue; paras++;
      const found = T.trmFind(vis, ix, {}); found.forEach((f) => { hits++; any = true; per.set(f.k, (per.get(f.k) || 0) + 1); total.set(f.k, (total.get(f.k) || 0) + 1); if (!matched.has(f.k)) matched.set(f.k, new Set()); matched.get(f.k).add(id); const nm = vis.slice(f.a, f.b); const e = shown.get(f.k) || new Map(); e.set(nm, (e.get(nm) || 0) + 1); shown.set(f.k, e); });
      const hit = new Set(found.map((f) => f.a));
      const re = new RegExp(T.TRM_TOK ? T.TRM_TOK.source : /[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}]+)*/u.source, 'gu'); let m;
      while ((m = re.exec(vis))) {
        allTokens++; const raw = m[0]; if (!/^\p{Lu}/u.test(raw) || raw.length < 4) continue;
        if (found.some((f) => m.index >= f.a && m.index < f.b)) continue;
        const w = luNorm(raw); if (!w || w.includes(' ') || roman(w) || /\d/.test(w) || english(w)) continue;
        const e = unknown.get(w) || { n: 0, forms: new Map() }; e.n++; e.forms.set(raw, (e.forms.get(raw) || 0) + 1); unknown.set(w, e);
      }
    }
    if (any) secsWith++;
  }
  allParas += paras;
  console.log(`${id.padEnd(8)} ${String(got.length).padStart(5)} sections, ${String(paras).padStart(6)} paragraphs: ${String(hits).padStart(6)} marked words every time, ${per.size} different entries, ${secsWith} sections with at least one`);
}
const never = GLOSSARY.map((g, k) => [g, k]).filter(([g, k]) => !total.has(k) && (!g[5] || !g[5].at || g[5].at.length) );
console.log(`\n${total.size} of ${GLOSSARY.length} entries are used in these texts; ${GLOSSARY.length - total.size} are not (most of the older entries belong to other traditions).`);
const persia = GLOSSARY.map((g, k) => [g, k]).filter(([g]) => g[4].includes('persia'));
const persiaNever = persia.filter(([, k]) => !total.has(k));
console.log(`Persia entries not met in these texts (${persiaNever.length} of ${persia.length}): ${persiaNever.map(([g]) => g[0]).join(', ') || 'none'}`);
if (showEntries) {
  console.log('\nentry · times marked (every mention) · how the page prints it');
  [...total.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(String(n).padStart(6) + '  ' + GLOSSARY[k][0].padEnd(28) + [...shown.get(k).entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([f, c]) => f + '×' + c).join('  ')));
}
const rows = [...unknown.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, TOPN);
console.log(`\n${unknown.size} different capitalised words are not explained and not ordinary English. The ${rows.length} commonest:`);
rows.forEach(([w, e]) => console.log(String(e.n).padStart(6) + '  ' + [...e.forms.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([f, c]) => f + '×' + c).join('  ')));
