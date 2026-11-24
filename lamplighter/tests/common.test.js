/* Common ground: every figure on the page comes from the echoes and the traditions, so test the arithmetic and the honesty of what it says */
const fs = require('fs'); const path = require('path');
global.REFS = {}; const { PRACTICES } = require('../src/js/23-data-meditation.js'); global.PRACTICES = PRACTICES;
const dir = path.join(__dirname, '../src/js');
const files = fs.readdirSync(dir).filter((f) => /^(24|25|26|27|28|29|2[a-z])-/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8').replace(/\nif \(typeof module !== 'undefined' && module\.exports\)[^\n]*/g, '')).join('\n');
const M = new Function(src + '\nreturn { TRADITIONS, TRAD_OF_STATION, ECHO_LINKS, ECHO_KINDS, traditionOverlap, overlapGraph, kindShares, COMMON_GROUPS, COMMON_CONCEPTS, COMMON_DIFFERENCES, PARALLELS, compileQuery, termFind };')();
let pass = 0; let fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 300)); } };
const ids = M.TRADITIONS.map((t) => t.id);
const pairs = M.traditionOverlap(M.ECHO_LINKS, M.TRAD_OF_STATION); const g = M.overlapGraph(pairs, ids);

ok('pairs are between two different real traditions, counted once each', Object.values(pairs).every((p) => p.a < p.b && ids.includes(p.a) && ids.includes(p.b) && p.n === p.links.length && Object.values(p.kinds).reduce((a, b) => a + b, 0) === p.n));
ok('a pair’s links are really echoes between stations of those two traditions', Object.values(pairs).every((p) => p.links.every((e) => { const ta = M.TRAD_OF_STATION[e.A.id] || []; const tb = M.TRAD_OF_STATION[e.B.id] || []; return (ta.includes(p.a) && tb.includes(p.b)) || (ta.includes(p.b) && tb.includes(p.a)); })));
ok('every echo between stations of different traditions appears in at least one pair', M.ECHO_LINKS.every((e) => { const ta = M.TRAD_OF_STATION[e.A.id] || []; const tb = M.TRAD_OF_STATION[e.B.id] || []; const cross = ta.some((a) => tb.some((b) => a !== b)); return !cross || Object.values(pairs).some((p) => p.links.includes(e)); }));
ok('the graph is connected: any tradition can be reached from any other', g.connected === true);
ok('no tradition stands alone, and no two are far apart', g.minDegree >= 2 && g.diameter >= 1 && g.diameter <= 4, [g.minDegree, g.diameter]);
ok('the figures are consistent', g.pairsLinked === Object.keys(pairs).length && g.pairsPossible === 171 && g.avg >= 1 && g.avg <= g.diameter && Object.values(g.degree).every((d) => d >= 0 && d <= 18));
/* the graph code on cases with a known answer */
{ const mk = (a, b) => ({ a, b, n: 1, kinds: {}, links: [] }); const line = { 'a|b': mk('a', 'b'), 'b|c': mk('b', 'c'), 'c|d': mk('c', 'd') }; const r = M.overlapGraph(line, ['a', 'b', 'c', 'd']);
  ok('a chain of four has diameter 3, is connected, and its ends have one link', r.diameter === 3 && r.connected && r.degree.a === 1 && r.degree.b === 2 && r.minDegree === 1);
  const split = M.overlapGraph({ 'a|b': mk('a', 'b') }, ['a', 'b', 'c']); ok('an isolated tradition is reported, not hidden', split.connected === false && split.minDegree === 0);
  const tr = M.traditionOverlap([{ A: { id: 'x' }, B: { id: 'y' }, kind: 'contact' }, { A: { id: 'x' }, B: { id: 'x2' }, kind: 'parallel' }], { x: ['t1'], x2: ['t1'], y: ['t2', 't1'] });
  ok('an echo within one tradition is not an overlap between two, and a station in two traditions links to each', Object.keys(tr).join() === 't1|t2' && tr['t1|t2'].n === 1 && tr['t1|t2'].kinds.contact === 1, tr); }
/* where the overlap comes from */
const sh = M.kindShares(M.ECHO_LINKS); const total = sh.reduce((a, x) => a + x.n, 0);
ok('every echo falls in exactly one group and the groups add up', total === M.ECHO_LINKS.length && Math.abs(sh.reduce((a, x) => a + x.pct, 0) - 100) <= 2 && sh.map((x) => x.id).join() === 'history,convergence,disputed');
ok('the groups use only the five kinds, each in one group', (() => { const all = M.COMMON_GROUPS.flatMap((x) => x.kinds); return all.length === 5 && new Set(all).size === 5 && all.every((k) => M.ECHO_KINDS[k]); })());
ok('both shared history and independent convergence are real shares of the data', sh[0].n > 0 && sh[1].n > 0);
/* the word map */
ok('twelve concepts, each searchable and with its own distinct words', M.COMMON_CONCEPTS.length === 12 && new Set(M.COMMON_CONCEPTS.map((c) => c.id)).size === 12 && M.COMMON_CONCEPTS.every((c) => !M.compileQuery(c.q, { whole: true, alias: false }).empty && c.label.length > 3));
ok('concept words match whole words in text and not parts of other words', (() => { const cq = M.compileQuery(M.COMMON_CONCEPTS.find((c) => c.id === 'peace').q, { whole: true, alias: false }); return !!M.termFind(cq.terms[0].re, 'a time of peace') && !M.termFind(cq.terms[0].re, 'the peaceable kingdom'); })());
/* honesty */
ok('the page names five real differences', M.COMMON_DIFFERENCES.length === 5 && M.COMMON_DIFFERENCES.every(([h, t]) => h && t.length > 60));
const view = fs.readFileSync(path.join(dir, '6o-common.js'), 'utf8');
ok('the page says overlap is not sameness (in its text, not only in a comment) and does not claim the traditions are the same', /Where they really differ/.test(view) && /These differences are real[^<]*Overlap is not sameness/.test(view) && !/(are all the same|all religions are the same|are one and the same)/i.test(view));
ok('there are curated common-ground teachings from several traditions', M.PARALLELS.filter((p) => p.theme === 'Common ground').length >= 9 && [...new Set(M.PARALLELS.filter((p) => p.theme === 'Common ground').flatMap((p) => p.items.map((i) => i[0].split('-')[0])))].length >= 4);
console.log(`common: ${pass} passed, ${fail} failed (${Object.keys(pairs).length} linked pairs, diameter ${g.diameter}, ${sh.map((x) => x.name + ' ' + x.pct + '%').join(', ')})`);
process.exit(fail ? 1 : 0);
