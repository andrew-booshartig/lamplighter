// Run: node tests/about.test.js — the lists of books on a tradition's page (the books ABOUT it, and the OLD SOURCES a revived religion draws on):
// the pure lookup, and the Atlas file against tools/library_about.json, tools/library_lore.json and the Library
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const { ABOUT_KIND, aboutIds, aboutLine } = require('../src/js/2z-about-core.js');
let pass = 0, fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 300)); } };

/* the pure part */
const libById = Object.setPrototypeOf({ 'a-x': { id: 'a-x', title: 'X', when: 'recorded 1850 CE', tr: 'fld' }, 'x-y': { id: 'x-y', title: 'Y', when: '1924 CE', tr: 'sec' }, 'v-z': { id: 'v-z', title: 'Z', when: '1919 CE', tr: 'spi' } }, null);
ok('a tradition lists its books in the Atlas file’s order', JSON.stringify(aboutIds({ herero: ['x-y', 'a-x'] }, 'herero', libById)) === '["x-y","a-x"]');
ok('an id the Library does not have is left out, not shown broken', JSON.stringify(aboutIds({ herero: ['a-x', 'nope'] }, 'herero', libById)) === '["a-x"]');
ok('an id that is not a string is left out', JSON.stringify(aboutIds({ a: [1, null, {}, 'a-x'] }, 'a', libById)) === '["a-x"]');
ok('no list for an unknown tradition, a missing map, a missing Library, or a value that is not a list', aboutIds({ a: ['a-x'] }, 'b', libById).length === 0 && aboutIds(undefined, 'a', libById).length === 0 && aboutIds(null, 'a', libById).length === 0 && aboutIds({ a: ['a-x'] }, 'a', undefined).length === 0 && aboutIds({ a: 'a-x' }, 'a', libById).length === 0);
ok('names that every object inherits are not traditions', ['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf'].every((k) => aboutIds({}, k, libById).length === 0));
ok('the small line gives the kind and then the date', aboutLine(libById['a-x']) === 'Field record · recorded 1850 CE' && aboutLine(libById['x-y']) === 'Study or history · 1924 CE');
ok('a book of another kind still gives its date, and nothing known gives an empty line', aboutLine(libById['v-z']) === '1919 CE' && aboutLine({}) === '' && aboutLine(undefined) === '');
ok('only the two kinds of book are named', Object.keys(ABOUT_KIND).join() === 'fld,sec');
ok('the lookup returns a new list each time (a caller may sort it)', (() => { const m = { a: ['a-x', 'x-y'] }; const r = aboutIds(m, 'a', libById); r.reverse(); return m.a[0] === 'a-x'; })());

/* the data: the two maps in tools/ against the Library, and the built Atlas file against both */
const root = path.join(__dirname, '../..');
const libsrc = fs.readFileSync(path.join(__dirname, '../src/js/24-data-path-lib.js'), 'utf8');
const libOrder = new Map(); for (const m of libsrc.matchAll(/'([a-z]-[a-z0-9-]+)\|/g)) if (!libOrder.has(m[1])) libOrder.set(m[1], libOrder.size);
let core = null; const coreFile = path.join(root, 'atlas/core.js');
if (!fs.existsSync(coreFile)) console.log('note: atlas/ is not next to the project, so the built Atlas file was not checked');
else { const A = {}; vm.runInNewContext(fs.readFileSync(coreFile, 'utf8'), { BEATLAB_ATLAS: { add: (n, d) => { A[n] = d; } } }); core = A.core; }
const tradIds = core ? new Set(core.traditions.map((t) => t.id)) : null;
const MAPS = [['library_about.json', 'about', 300], ['library_lore.json', 'lore', 5]];      /* file, key in the Atlas core file, a floor for how many traditions have a list */
const found = {};
for (const [file, key, floor] of MAPS) {
  const fp = path.join(__dirname, '../tools', file);
  if (!fs.existsSync(fp)) { console.log('note: tools/' + file + ' is not there'); continue; }
  const J = JSON.parse(fs.readFileSync(fp, 'utf8')); const entries = Object.entries(J).filter(([k]) => !k.startsWith('_'));
  const pairs = entries.flatMap(([k, v]) => (Array.isArray(v) ? v : [v]).map((t) => [k, t]));
  ok(`tools/${file} maps real Library entries`, pairs.every(([k]) => libOrder.has(k)), pairs.filter(([k]) => !libOrder.has(k)).slice(0, 5));
  ok(`each book in tools/${file} names at least one tradition (a repeat within one book is harmless: build_atlas.py drops it)`, entries.every(([, v]) => Array.isArray(v) && v.length >= 1 && v.every((t) => typeof t === 'string' && t)), entries.filter(([, v]) => !Array.isArray(v) || !v.length).slice(0, 5));
  if (!core) continue;
  ok(`every tradition that tools/${file} names is in the Atlas (a typo would silently drop its books)`, pairs.every(([, t]) => tradIds.has(t)), pairs.filter(([, t]) => !tradIds.has(t)).slice(0, 5));
  const m = core[key];
  if (!m) { console.log(`note: atlas/core.js was built before the "${key}" lists existed; run python3 -I tools/build_atlas.py`); continue; }
  const inJson = new Set(pairs.map(([k, t]) => k + '>' + t)); const flat = Object.entries(m).flatMap(([t, ids]) => ids.map((i) => [t, i])); found[key] = flat.length + ' links on ' + Object.keys(m).length + ' traditions';
  ok(`every tradition in the Atlas file’s "${key}" lists is a real tradition`, Object.keys(m).every((t) => tradIds.has(t)), Object.keys(m).filter((t) => !tradIds.has(t)).slice(0, 5));
  ok(`every book in the Atlas file’s "${key}" lists is a Library entry`, flat.every(([, i]) => libOrder.has(i)), flat.filter(([, i]) => !libOrder.has(i)).slice(0, 5));
  ok(`every "${key}" link in the Atlas file comes from tools/${file}`, flat.every(([t, i]) => inJson.has(i + '>' + t)), flat.filter(([t, i]) => !inJson.has(i + '>' + t)).slice(0, 5));
  ok(`each "${key}" list is in Library order and names a book once`, Object.values(m).every((ids) => ids.length && new Set(ids).size === ids.length && ids.every((i, n) => n === 0 || libOrder.get(ids[n - 1]) < libOrder.get(i))));
  ok(`at least ${floor} traditions have a "${key}" list`, Object.keys(m).length >= floor, Object.keys(m).length);
}
if (core && core.about && core.lore) {
  const both = Object.keys(core.lore).flatMap((t) => (core.lore[t] || []).filter((i) => (core.about[t] || []).includes(i)).map((i) => t + '>' + i));
  ok('no book is listed as both an old source and a book about the same tradition', both.length === 0, both.slice(0, 5));
}
console.log(Object.entries(found).map(([k, v]) => `${k}: ${v}`).join('; ') && `(${Object.entries(found).map(([k, v]) => `${k}: ${v}`).join('; ')})`);
console.log(`about: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
