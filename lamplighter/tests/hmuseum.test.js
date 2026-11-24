// Run: node tests/hmuseum.test.js — The Hermetic Museum (h-museum) is a typed copy of the 1893 edition (tools/texts_hmuseum.py), cut into its twenty-two tracts, with the printed pages found from two scans of it.
// The first copy was the machine-read text of one scan: it lacked four printed pages (volume 2, 179 to 182) and misread italics ("z¢s earth" for "its earth", "ove thing" for "one thing", "ze" for "i.e."); the maker found
// the errors on a Random card (18 November 2026). This guards what the swap fixed, and what it must not undo: that the text counts as typed (the words "scan" and "OCR" in its note or licence would make the app call it machine-read),
// that every tract and every page the scans lack is there, that the known misreadings are gone, that the printed pages count upward through the text, and that the page finder and the original-files card still point at the printed edition.
// Skipped if the texts folder is absent.
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let pass = 0, fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 600)); } };
const root = path.join(__dirname, '..'); const dir = path.join(root, '..', 'texts');
if (!fs.existsSync(path.join(dir, 'h-museum.js'))) { console.log('texts folder not built; skipping'); process.exit(0); }
const T = { meta: {}, data: {}, addIndex(i) { Object.assign(this.meta, i); }, add(id, m, s) { this.data[id] = { m, s }; } };
const ctx = { BEATLAB_TEXTS: T, globalThis: { } }; ctx.globalThis = ctx;
vm.runInNewContext(fs.readFileSync(path.join(dir, 'index.js'), 'utf8'), ctx); vm.runInNewContext(fs.readFileSync(path.join(dir, 'h-museum.js'), 'utf8'), ctx);
vm.runInNewContext(fs.readFileSync(path.join(dir, 'pg-h-museum.js'), 'utf8'), ctx); vm.runInNewContext(fs.readFileSync(path.join(dir, 'pgs.js'), 'utf8'), ctx); vm.runInNewContext(fs.readFileSync(path.join(dir, 'originals.js'), 'utf8'), ctx);
const meta = T.meta['h-museum']; const d = T.data['h-museum']; const secs = d.s; const all = secs.map((s) => s[1]).join('\n\n');

/* what the app takes it for: typed, not machine-read (6d-passage.js and 2z-source-core.js decide from the licence line and the note) */
ok('the licence line says a typed copy of the printed edition', /; a typed copy of the printed edition$/.test(meta.license), meta.license);
ok('neither the note nor the licence contains "scan" or "OCR" (the app would call the text machine-read)', !/scan|ocr/i.test(meta.note + ' ' + meta.license), (meta.note + meta.license).match(/scan|ocr/i));
ok('its source is the address of the printed edition at the Internet Archive', /^https:\/\/archive\.org\/details\/[A-Za-z0-9._-]+$/.test(meta.src), meta.src);
ok('the credit line says the translator is not named (Waite’s preface says another hand made it, he revised it)', /translator is not named/.test(meta.by) && /Waite/.test(meta.by), meta.by);
ok('the note says what is not here (plates), what remains imperfect (typing slips) and where the page numbers come from', /plates are not here/.test(meta.note) && /typing slips/.test(meta.note) && /page numbers/.test(meta.note));
ok('the entry’s n and chars are those of the file', meta.n === secs.length && meta.chars === secs.reduce((a, s) => a + s[1].length, 0), [meta.n, secs.length, meta.chars]);

/* the whole book: two prefaces, tracts I to XI in each volume, the one footnote */
const tracts = new Set(); secs.forEach(([t]) => { const m = /^Volume ([12]) · ([IVX]+)\. /.exec(t); if (m) tracts.add(m[1] + m[2]); });
ok('all twenty-two tracts are there as sections (eleven in each volume)', tracts.size === 22, [...tracts]);
ok('both prefaces are there', secs.some(([t]) => /^Volume 1 · Preface to the English edition/.test(t)) && secs.some(([t]) => /^Volume 1 · Preface to the original edition/.test(t)));
ok('the Three Treatises of Philalethes are three sections, not one', ['I. The Metamorphosis of Metals', 'II. A Short Vade Mecum', 'III. The Fount of Chemical Truth'].every((x) => secs.some(([t]) => t.includes(x))));
ok('no section is longer than 60,000 characters (the Library cuts long ones into parts) and none is empty', secs.every(([, b]) => b.length > 30 && b.length <= 60000), secs.filter(([, b]) => b.length > 60000).map(([t]) => t));
ok('the whole is about the size of the printed volumes (1.2 to 1.4 million characters)', meta.chars > 1.2e6 && meta.chars < 1.4e6, meta.chars);

/* the passages that differ between the typed copy and the scans */
ok('the passage on a Random card reads “its earth” and “one thing” (the scan had “z¢s earth” and “ove thing”)', all.includes('The seed must be cast into its earth, and there grow') && all.includes('generation out of one thing, viz., that first Matter'));
ok('the four printed pages the first scan lacks (volume 2, 179 to 182) are there', all.includes('put my talent out at usury') && all.includes('Of the Furnace, or Athanor of the Sages') && all.includes('Concerning the Size, Form, Material, and Mode of Securing the Vessel'));
ok('the three printed pages the second scan lacks (volume 2, 195 to 197) are there', all.includes('You now possess the incombustible red Sulphur') && all.includes('The Multiplication of the Stone'));
ok('the captions of the Lambspring emblems, which neither scan can read, are there', /TWO FISHES ARE SWIMMING IN OUR SEA/i.test(all) && /The Sea as the Body, the two Fishes are Soul and Spirit/.test(all));
ok('the spelling of the print is kept (“shewn”, “Phœnix”), not tidied', /\bshewn\b/.test(all) && /Phœnix/.test(all) && !/Phoenix/.test(all));
const garbles = [/z¢s/, /\bove thing/, /\boze thing/, /\bTue Go/i, /\bI\]\.—/, /\bfs wi 2\b/, /\btbe\b/];
ok('the misreadings the scan had are gone', garbles.every((g) => !g.test(all)), garbles.filter((g) => g.test(all)).map(String));

/* noise, with the Library’s own test of a token that is not a word (2z-passage-core.js): the scan text had 0.25%; the typed copy has about 0.04% */
let core = null; try { core = require(path.join(root, 'src/js/2z-passage-core.js')); } catch (e) { console.log('(passage core not loadable here; skipping the noise check)'); }
if (core && core.psuNoise) {
  const noise = core.psuNoise(all); ok('tokens with stray marks, stray letters, capitals inside words or digits glued to letters are under 0.1% (the scan text had 0.25%)', noise < 0.001, noise);
  ok('the words the Library’s word list does not know are under 3.8% of the lower-case words (with the word list as built on 19 Nov 2026 from 395 typed books: 3.6%; the first list measured the scan text at 3.3% and this one at about 4% on the same words; the floor is real alchemical vocabulary: quicksilver, coction, tincture)', core.psuOcr(core.psuVis(all)).ratio < 0.038, core.psuOcr(core.psuVis(all)).ratio);
}

/* the printed pages: found from the scans, counting upward through the text */
const rows = ctx.BEATLAB_PAGES['h-museum']; const idx = ctx.BEATLAB_PAGEN['h-museum'];
ok('the page marks are there, with the index line the reader checks (marks, characters, sections, grade, two volumes)', Array.isArray(rows) && Array.isArray(idx) && idx[1] === meta.chars && idx[2] === meta.n && idx[3] === 'a' && idx[4] === 2, idx);
const labels = []; rows.forEach(([k, p, m]) => m.forEach(([o, l]) => labels.push({ k, p, o, l, v: +/(\d):/.exec(l)[1], n: +/:(\d+)/.exec(l)[1] })));
ok('there are at least 600 printed pages marked, in both volumes (the scan text had 616, with four pages of volume 2 missing from the text)', labels.length >= 600 && labels.some((x) => x.v === 1) && labels.some((x) => x.v === 2), labels.length);
labels.sort((a, b) => a.k - b.k || a.p - b.p || a.o - b.o);
let upward = true; let bad = null; for (let i = 1; i < labels.length; i++) { const a = labels[i - 1], b = labels[i]; if (b.v < a.v || (b.v === a.v && b.n <= a.n)) { upward = false; bad = [a.l, b.l]; break; } }
ok('the printed pages count upward through the text (volume 1, then volume 2), none twice', upward, bad);
const have = new Set(labels.map((x) => x.v + ':' + x.n)); const want = [];
for (let n = 178; n <= 184; n++) want.push('2:' + n); for (let n = 194; n <= 199; n++) want.push('2:' + n);
ok('the pages around the holes of both scans are all marked (volume 2: 178 to 184, 194 to 199)', want.every((w) => have.has(w)), want.filter((w) => !have.has(w)));
ok('every mark lies inside its paragraph', labels.every((x) => secs[x.k] && x.o >= 0 && x.o <= (secs[x.k][1].split(/\n{2,}/)[x.p] || '').length), labels.filter((x) => !secs[x.k] || x.o > (secs[x.k][1].split(/\n{2,}/)[x.p] || '').length).slice(0, 3));
const at = (lab) => { const x = labels.find((y) => y.l === lab); const para = secs[x.k][1].split(/\n{2,}/)[x.p]; return para.slice(x.o, x.o + 60); };
ok('a page starts where the printed page starts (2:179, 2:180, 2:196)', /^God, and put my talent/.test(at('2:179')) && /^is pure enough/.test(at('2:180')) && /^your substance insoluble/.test(at('2:196')), [at('2:179'), at('2:180'), at('2:196')]);

/* the page finder and the original-files card keep pointing at the printed edition: the scans’ addresses stay in the scan spec that texts_pages.py and texts_originals.py read */
const orig = ctx.BEATLAB_ORIG['h-museum'];
ok('the original-files card lists the two volumes of the printed edition, each with its page images', Array.isArray(orig) && orig[1].length === 2 && orig[1].every((part) => /archive\.org\/details\/india\.history\.resource\.\d+/.test(part[1]) && part[2].some((f) => /PDF/.test(f[0]))), orig && orig[1].map((p) => p[1]));

/* the tool is in place, and a full rebuild of the Library goes through it */
const tool = path.join(root, 'tools/texts_hmuseum.py'); const bt = fs.readFileSync(path.join(root, 'tools/build_texts.py'), 'utf8');
ok('tools/texts_hmuseum.py exists and build_texts.py calls it after the other typed texts', fs.existsSync(tool) && /import texts_hmuseum/.test(bt) && bt.indexOf('import texts_hmuseum') > bt.indexOf('import texts_gg'));
ok('the scan spec stays in texts_shelf.py (it holds the scans’ addresses for the page tools)', /'h-museum': G\(\['india\.history\.resource\.84871', 'india\.history\.resource\.84873'\]/.test(fs.readFileSync(path.join(root, 'tools/texts_shelf.py'), 'utf8')));
console.log(`hmuseum: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
