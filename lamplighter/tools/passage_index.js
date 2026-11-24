/* The Atlas facts behind the filters of the Random page (src/js/2z-passage-index.js).
   Run: node tools/passage_index.js [--check]
   The Random page can draw from "Buddhism and Hinduism", from "the books of the Abrahamic family" or from "hymns and poems". The Library alone does not say which book belongs to which religion, so this
   tool reads what the Atlas says (../atlas, never fetched) and writes it down as a small table the page can use without loading the Atlas:
     PSF_GROUPS, PSF_FAMILIES  the Atlas's nine groups of families and its twenty families, with their names
     PSF_TRADS                 every tradition that has a readable Library book, and the tradition it is nested under: [name, family, nested under, belief labels]. A branch, a school, a movement or the cult of a
                               deity (kinds br, sch, mov, cult) is nested under the tradition it grew from; a religion, an ethnic religion, a philosophy, a new religious movement and the rest are top of their own tree,
                               so "Judaism" does not take in Christianity because the Atlas lists Christianity as grown from it
     PSF_LINKS                 book id → the traditions the Atlas ties it to: a text of its own (a catalogue record linked to this book), a book about it (tools/library_about.json), or an old source it draws on
                               (tools/library_lore.json). A book the Atlas ties to nothing has no entry (the page then falls back on the Library's own shelf, see PSF_SHELF_TRAD in 2z-passage-filter-core.js)
     PSF_CATS                  book id → the Atlas's own category of the records linked to it (scr, hym, wis…), the page's "kind of text" where there is one
     PSF_YEARS                 book id → [first year, last year] from the linked records, only for a book whose catalogue date gives no years (the page reads the date in the Library's own words first)
   The same inputs always give the same file. --check reports and does not write (and exits 1 when the file on disk is not what the Atlas and the Library now give). */
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const root = path.join(__dirname, '../..'); const out = path.join(__dirname, '../src/js/2z-passage-index.js');
const D = require('../src/js/24-data-path-lib.js'); const B = require('../src/js/2z-belief-core.js'); const F = require('../src/js/2z-passage-filter-core.js');
const args = process.argv.slice(2);
const A = {}; const run = (f, g) => vm.runInNewContext(fs.readFileSync(path.join(root, f), 'utf8'), g, { filename: f });
if (!fs.existsSync(path.join(root, 'atlas/core.js')) || !fs.existsSync(path.join(root, 'texts/index.js'))) { console.log('the atlas or texts folder was not found beside the project'); process.exit(1); }
for (const n of ['index', 'core', 'texts']) run('atlas/' + n + '.js', { BEATLAB_ATLAS: { data: A, add(k, d) { A[k] = d; } } });
let META = {}; run('texts/index.js', { BEATLAB_TEXTS: { addIndex(o) { META = o; }, meta: {}, data: {} } });
const core = A.core; const trad = {}; core.traditions.forEach((t) => { trad[t.id] = t; });
const groups = A.index.config.family_groups.groups.map((g) => [g.id, g.label, g.families]);
const fams = {}; core.families.forEach((f) => { fams[f.id] = f.name || f.label || f.id; });
const NEST = new Set(F.PSF_NEST);
const nestedUnder = (id) => { const t = trad[id]; return t && NEST.has(t.kind) && t.parent_id && trad[t.parent_id] ? t.parent_id : ''; };
/* which Library books each tradition is tied to */
const links = {}; const cats = {}; const years = {};
const readable = (id) => !!D.LIB_BY_ID[id] && !!META[id] && !D.LIB_IMAGINED_GROUPS.includes(D.LIB_BY_ID[id].group);      /* the imagined shelf is kept apart from every tradition's texts: it is tied to no religion, whatever the Atlas says about the stories */
const tie = (id, t) => { if (!readable(id) || !trad[t]) return; const a = (links[id] = links[id] || []); if (!a.includes(t)) a.push(t); };
for (const x of A.texts) {
  const ids = Array.isArray(x.libs) && x.libs.length ? x.libs : x.lib ? [x.lib] : [];
  for (const id of ids) {
    if (!readable(id)) continue; tie(id, x.tradition_id);
    if (x.category) { const c = (cats[id] = cats[id] || []); if (!c.includes(x.category)) c.push(x.category); }
    if (typeof x.year_start === 'number') { const y = (years[id] = years[id] || [Infinity, -Infinity]); y[0] = Math.min(y[0], x.year_start); y[1] = Math.max(y[1], typeof x.year_end === 'number' ? x.year_end : x.year_start); }
  }
}
for (const [t, arr] of Object.entries(core.about || {})) for (const id of arr) tie(id, t);
for (const [t, arr] of Object.entries(core.lore || {})) for (const id of arr) tie(id, t);
/* the traditions the page lists: those with a book, and the ones they are nested under */
const want = new Set(); for (const ts of Object.values(links)) for (const t of ts) for (let c = t, n = 0; c && trad[c] && n < 60; c = nestedUnder(c), n++) want.add(c);
const memo = {}; const tradOut = {};
for (const id of [...want].sort()) { const t = trad[id]; tradOut[id] = [t.name, t.family_id || '', nestedUnder(id), B.beliefOf(trad, id, memo).join(' ')]; }
const linkOut = {}; for (const id of Object.keys(links).sort()) linkOut[id] = links[id].slice().sort().join(' ');
const catOut = {}; for (const id of Object.keys(cats).sort()) catOut[id] = cats[id].slice().sort().join(' ');
const undated = new Set(); { let prev = null; for (const l of D.LIB) { const w = F.psfWhen(l.when, prev); if (w) prev = w; else undated.add(l.id); } }      /* the Library's own dates first ("same" is the entry before it): the Atlas only fills in where they give none */
const yearOut = {}; for (const id of Object.keys(years).sort()) if (undated.has(id)) yearOut[id] = years[id];
const j = (o) => JSON.stringify(o);
const body = `/* ═══════════════════════════ 2z · What the Atlas says about the Library's books (made by tools/passage_index.js; do not edit by hand) ═══════════════════════════
   The tables behind the religions, kinds and dates of the Random page's filters: ${Object.keys(tradOut).length} traditions that have a readable book, ${Object.keys(linkOut).length} books tied to at least one of them, ${Object.keys(catOut).length} books with an Atlas category. Read the
   notes at the top of the tool for what each table is and where it comes from. Run the tool again after the Atlas or the Library changes (tests/passage-filter.test.js says when the file is out of date). */
const PSF_GROUPS = ${j(groups)};
const PSF_FAMILIES = ${j(fams)};
const PSF_TRADS = ${j(tradOut)};
const PSF_LINKS = ${j(linkOut)};
const PSF_CATS = ${j(catOut)};
const PSF_YEARS = ${j(yearOut)};
if (typeof module !== 'undefined' && module.exports) module.exports = { PSF_GROUPS, PSF_FAMILIES, PSF_TRADS, PSF_LINKS, PSF_CATS, PSF_YEARS };
`;
console.log(`${Object.keys(tradOut).length} traditions, ${Object.keys(linkOut).length} of ${D.LIB.filter((l) => META[l.id]).length} readable books tied to at least one, ${Object.keys(catOut).length} with an Atlas category, ${Object.keys(yearOut).length} dated from the Atlas only`);
if (args.includes('--check')) { const now = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : ''; if (now !== body) { console.log('src/js/2z-passage-index.js is out of date: run node tools/passage_index.js'); process.exit(1); } console.log('src/js/2z-passage-index.js is up to date'); } else { fs.writeFileSync(out, body); console.log('wrote', out, `(${(body.length / 1024).toFixed(0)} KB)`); }
