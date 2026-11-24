/* Stress test: every Religion route is rendered with hostile and malformed input (markup, regex characters, prototype names, enormous or
   unicode strings, numbers that are not numbers), with saved data of the wrong shape, and the search and similarity code is run on the same
   strings. Nothing may throw, nothing may echo markup, nothing may hang. Run: node tests/fuzz.test.js */
const { M, render, badText, stub } = require('./_harness.js'); const C = require('../src/js/2w-similar-core.js');
let pass = 0; let fail = 0; const ok = (n, c, x) => { if (c) pass++; else { fail++; if (fail < 40) console.log('FAIL', n, x === undefined ? '' : JSON.stringify(x).slice(0, 300)); } };
/* a stand-in for a DOM element that, like the real one, turns whatever is assigned to .value into a string */
const mkEl = () => { let v = ''; return { get value() { return v; }, set value(x) { v = String(x == null ? '' : x); }, checked: false, innerHTML: '', textContent: '', style: {}, dataset: {}, addEventListener() {}, removeEventListener() {}, click() {}, focus() {}, select() {}, scrollIntoView() {}, insertAdjacentHTML() {}, querySelector: () => mkEl(), closest: () => null }; };
const R = (parts, q) => { const cache = {}; globalThis.__q = new Proxy(cache, { get: (t, k) => (typeof k === 'string' ? (t[k] || (t[k] = mkEl())) : undefined) }); stub.value = ''; return render(parts, q); };
const POISON = ['<script>alert(1)</script>', '"><img src=x onerror=alert(1)>', "'; DROP TABLE users; --", '__proto__', 'constructor', 'toString', 'hasOwnProperty', '../../etc/passwd', '%00', '\u0000', '(((', '[[[', '\\', '*', '+', '?', '|', 'a|b||c|', '"unclosed phrase', '-', '-"x"', ' ', '\n\t', 'x'.repeat(60000), 'é'.repeat(2000), '‮שלום', '😀'.repeat(300), '-1', '1e999', 'NaN', 'Infinity', '0', '99999999999', '[object Object]', 'null', 'undefined', '{{r:x}}', '${1+1}', '`${process.exit()}`', '<svg onload=alert(1)>', 'javascript:alert(1)', '&lt;b&gt;', '%3Cscript%3E', 'a'.repeat(100) + '(' + 'a+'.repeat(40) + ')+$'];
const KEYS = ['q', 'k', 'r', 'b', 'c', 'm', 'w', 'e', 'a', 't', 'theme', 'era', 'day', 'id', 'x', 'y', 'from', 'to', 'tab', 's', 'p', 'n', 'i', 'l', 'v', 'ref', 'kind', 'sort', 'tr', 'g'];
const tabs = M.PATH_TABS.map((t) => t[0]); const detail = ['station', 'read', 'tradition', 'thread', 'motif'];
const REAL = /<script|<img[^>]*src=x|<svg[^>]*onload/i;
const self = (p) => /undefined|\[object|NaN|null/.test(p); /* strings that legitimately carry these words themselves */
let renders = 0; const t0 = Date.now();
const once = (parts, query, label) => { renders++; let r; stub.value = ''; try { r = R(parts, query); } catch (e) { ok(label + ' does not throw', false, String(e && e.stack || e).split('\n').slice(0, 3).join(' | ')); return; }
  const html = r.head + r.body; ok(label + ' echoes no live markup', !REAL.test(html), html.match(/.{40}(<script>alert|<img src=x|<svg onload|onerror=alert).{20}/)); };

/* 1. every route, with every poison in every query key at once */
for (const tab of tabs) for (const p of POISON) { const q = {}; KEYS.forEach((k) => { q[k] = p; }); once([tab], q, `route ${tab} with ${JSON.stringify(p.slice(0, 24))}`); }
/* 2. detail pages with a poisoned id */
for (const d of detail) for (const p of POISON) once([d, p], { q: p }, `page ${d}/${JSON.stringify(p.slice(0, 20))}`);
/* 3. nonsense paths and no path */
for (const parts of [[], [''], ['zzz'], ['station'], ['station', ''], ['read'], ['tradition'], ['thread'], ['motif'], ['today', 'extra', 'parts'], [undefined], [null], [123]]) once(parts, {}, `path ${JSON.stringify(parts)}`);
/* 4. the output for a poisoned query is not worse than for none: no "undefined", "[object" or "NaN" unless the input itself spelled it */
for (const tab of tabs) { const base = R([tab], {}); for (const p of POISON) { if (self(p)) continue; const q = { q: p, k: p, r: p, b: p }; let r; stub.value = ''; try { r = R([tab], q); } catch (e) { continue; } const html = r.body; if (badText(html) && !badText(base.body)) ok(`route ${tab} shows no undefined or NaN for ${JSON.stringify(p.slice(0, 20))}`, false, html.match(/.{30}(undefined|\[object|NaN|>null<).{30}/)); } }

/* 5. saved data of the wrong shape: the app must start, not crash */
const BAD = [null, [], 'text', 7, true, {}, { cur: 'abc', days: 5, notes: 'x', read: [], started: 99 }, { cur: 99999, days: null, notes: null, read: null, started: '' }, { cur: -4, days: { s001: 'nope' }, notes: [1, 2], read: 1, rule: {} }, { started: '2026-13-45', cur: 1e9 }, { threads: 'x' }, [{ id: 1 }], { a: { b: { c: {} } } }];
const keys = ['path.state', 'path.threads', 'path.marks', 'path.intentions', 'search.recent', 'search.opts', 'common.words', 'int.state', 'path.year'];
for (const k of keys) for (const v of BAD) { M.store.set(k, v); }
for (const v of BAD) { M.store.set('path.state', v); for (const tab of ['today', 'timeline', 'notebook', 'library', 'common', 'wander', 'threads', 'marks', 'intentions', 'year', 'search', 'similar']) { let r; stub.value = ''; try { r = R([tab], {}); } catch (e) { ok(`route ${tab} copes with saved path.state ${JSON.stringify(v).slice(0, 40)}`, false, String(e).slice(0, 160)); continue; } ok(`route ${tab} shows something with saved path.state ${JSON.stringify(v).slice(0, 30)}`, r.body.length > 100, r.body.length); } }
for (const k of keys) for (const v of BAD) { M.store.set(k, v); let bad = null; for (const tab of ['today', 'timeline', 'notebook', 'threads', 'marks', 'intentions', 'year', 'search', 'common', 'library']) { try { R([tab], {}); } catch (e) { bad = `${tab}: ${String(e).slice(0, 100)}`; break; } } ok(`app copes with saved ${k} = ${JSON.stringify(v).slice(0, 30)}`, bad === null, bad); }
M.store.set('path.state', { started: '2026-11-14', cur: 3, days: {}, notes: {}, read: {}, rule: '' }); keys.forEach((k) => M.store.del(k));

/* 6. search: any string compiles, never throws, and a search over a large text cannot run away */
const big = ('In the beginning God created the heavens and the earth, and the earth was without form. ').repeat(20000).slice(0, 1500000); let slow = 0;
for (const p of POISON) { let cq; try { cq = M.compileQuery(p, { whole: false, alias: true, mode: 'para' }); cq = M.compileQuery(p, { whole: true, alias: false, mode: 'sect' }); } catch (e) { ok(`search compiles ${JSON.stringify(p.slice(0, 24))}`, false, String(e).slice(0, 120)); continue; }
  const t = Date.now(); try { cq.terms.forEach((x) => { x.re.lastIndex = 0; x.re.test(big); }); } catch (e) { ok('search runs', false, String(e).slice(0, 100)); } if (Date.now() - t > 1500) { slow++; ok(`search of 1.5 MB for ${JSON.stringify(p.slice(0, 24))} finishes in 1.5 s`, false, Date.now() - t); } }
ok('search: no poisoned query ran past 1.5 seconds', slow === 0, slow);

/* 7. similarity words and cutting */
for (const p of POISON) { try { const t = C.simTerms(p); ok('simTerms returns a list for ' + JSON.stringify(p.slice(0, 20)), Array.isArray(t)); C.simJunk(p); const cuts = C.simCut(p + '\n\n' + p, () => true); ok('simCut returns well-formed ranges for ' + JSON.stringify(p.slice(0, 20)), Array.isArray(cuts) && cuts.every((c) => c[0] >= 0 && c[1] >= c[0])); } catch (e) { ok('similarity code copes with ' + JSON.stringify(p.slice(0, 24)), false, String(e).slice(0, 120)); } }

/* 8. a random walk over routes, queries and saved data */
let seed = 20261114; const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; const pick = (a) => a[Math.floor(rnd() * a.length)];
for (let i = 0; i < 600; i++) { const parts = rnd() < 0.3 ? [pick(detail), pick(POISON.concat(M.PATH_STATIONS.map((s) => s.id), M.TRADITIONS.map((t) => t.id), M.LIB.map((l) => l.id)))] : [pick(tabs)]; const q = {}; for (let j = 0; j < 1 + Math.floor(rnd() * 4); j++) q[pick(KEYS)] = pick(POISON.concat(['1', '2', '3', 'e5', 'common', 'flood', 'b-gen', 's010', 'judaism'])); if (rnd() < 0.2) M.store.set('path.state', pick(BAD)); else M.store.set('path.state', { started: '2026-11-14', cur: Math.floor(rnd() * 136), days: {}, notes: {}, read: {}, rule: '' }); once(parts, q, `walk ${i}: ${parts.join('/')} ${JSON.stringify(q).slice(0, 60)}`); }

/* 9. the Atlas pages (map, traditions, stories, texts, calendars, maps of the world) with the same hostile input; the data files are not loaded here, so these are the pages' own handling of the address */
const renderAtlas = (parts, query) => { const cache = {}; globalThis.__q = new Proxy(cache, { get: (t, k) => (typeof k === 'string' ? (t[k] || (t[k] = mkEl())) : undefined) }); const body = { innerHTML: '', querySelector: () => stub, addEventListener() {} }; const root = { innerHTML: '', querySelector: (sel) => (sel === '#pbody' || sel === '#abody' ? body : stub), addEventListener() {}, removeEventListener() {} }; const clean = M.Pages.atlas.mount(root, parts, query); if (typeof clean === 'function') clean(); return root.innerHTML + body.innerHTML; };
const atabs = ['map', 'traditions', 'stories', 'texts', 'calendars', 'cosmos', 'about']; let atlasRenders = 0;
for (const tab of atabs) for (const p of POISON) { const q = {}; KEYS.concat(['f', 'g', 'sel', 'y', 'z', 'lat', 'lon', 'zoom', 'st', 'story', 'cal', 'sys', 'site', 'text']).forEach((k) => { q[k] = p; }); atlasRenders++; let html = ''; try { html = renderAtlas([tab], q); } catch (e) { ok(`atlas ${tab} with ${JSON.stringify(p.slice(0, 24))} does not throw`, false, String(e && e.stack || e).split('\n').slice(0, 3).join(' | ')); continue; } ok(`atlas ${tab} echoes no live markup for ${JSON.stringify(p.slice(0, 20))}`, !REAL.test(html)); }
for (const parts of [[], [''], ['zzz'], ['__proto__'], ['constructor'], ['map', 'x', 'y']]) { atlasRenders++; try { renderAtlas(parts, {}); ok('atlas path ' + JSON.stringify(parts), true); } catch (e) { ok('atlas path ' + JSON.stringify(parts) + ' does not throw', false, String(e).slice(0, 160)); } }
console.log(`fuzz: ${pass} passed, ${fail} failed (${renders + atlasRenders} screens rendered in ${((Date.now() - t0) / 1000).toFixed(1)} s)`); process.exit(fail ? 1 : 0);
