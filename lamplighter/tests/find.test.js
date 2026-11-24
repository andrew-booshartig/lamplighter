// Run: node tests/find.test.js — finding words inside one text (src/js/2z-find-core.js): hits come in reading order with the paragraph and which occurrence in it, the match is the same one
// the reader's own highlighting draws (so the list and the page agree), stepping wraps round, and nothing odd in the query can break it. Runs on every library text if ../texts is built.
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const M = require('../src/js/2p-marks-core.js'); Object.assign(globalThis, M);
const F = require('../src/js/2z-find-core.js');
let pass = 0; let fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 300)); } };
const secs = [['One', '[[1]] In the beginning God made light.\n\n[[2]] And God saw the light, that it was good; and God divided.'], ['Two', '## A heading\n\nLight and dark; the LIGHT shone.\n\nNothing here.'], ['Three', 'No match.\n\nGod again, and God once more.']];
{
  const r = F.rdFindAll(secs, 'god');
  ok('every occurrence is found, in reading order, without regard to case', r.hits.map((h) => `${h.k}.${h.p}.${h.n}`).join(' ') === '0.0.0 0.1.0 0.1.1 2.1.0 2.1.1', r.hits.map((h) => `${h.k}.${h.p}.${h.n}`));
}
{
  const r = F.rdFindAll(secs, 'god');
  ok('the list is in reading order: section, then paragraph, then occurrence', r.hits.every((h, i) => i === 0 || h.k > r.hits[i - 1].k || (h.k === r.hits[i - 1].k && (h.p > r.hits[i - 1].p || (h.p === r.hits[i - 1].p && h.n === r.hits[i - 1].n + 1)))));
  ok('the count is five: one in the first paragraph, two in the second, two in the last section', r.hits.length === 5 && r.hits.filter((h) => h.k === 0 && h.p === 1).length === 2 && r.hits.filter((h) => h.k === 2).length === 2, r.hits.map((h) => `${h.k}.${h.p}.${h.n}`));
  ok('the numbers say which block of the section (a heading is a block of its own) and which occurrence in it', F.rdFindAll(secs, 'LIGHT').hits.filter((h) => h.k === 1).map((h) => `${h.p}.${h.n}`).join(',') === '1.0,1.1', F.rdFindAll(secs, 'LIGHT').hits.filter((h) => h.k === 1));
  ok('the words around a hit are there, and the match keeps the case of the text', (() => { const h = F.rdFindAll(secs, 'light').hits.find((x) => x.k === 1 && x.n === 1); return h && h.mt === 'LIGHT' && h.pre.endsWith('the ') && h.post.startsWith(' shone'); })());
  ok('verse numbers are not part of what is searched: a phrase across one is found, a number alone is not', F.rdFindAll([['x', 'in the [[5]]beginning']], 'the beginning').hits.length === 1 && F.rdFindAll([['x', 'a [[12]] b']], '12').hits.length === 0 && F.rdFindAll(secs, '[[1]]').hits.length === 0);
  ok('the first paragraph of the first section shows the match as printed (no brackets in the snippet)', !/\[\[/.test(F.rdFindAll(secs, 'God').hits.map((h) => h.pre + h.mt + h.post).join('')));
}
{
  ok('a query under two letters finds nothing, and so do empty, spaces and non-strings', ['', ' ', 'a', null, undefined, 5, {}, []].every((q) => F.rdFindAll(secs, q).hits.length === 0));
  ok('regular-expression characters in a query are plain letters', ['.', '(', '[', '\\', '.*', '^', '$', '+?', '(?<', '{1,2}', '|'].every((q) => { try { return Array.isArray(F.rdFindAll(secs, q + q).hits); } catch (e) { return false; } }) && F.rdFindAll([['x', 'a.b (c) [d]']], '(c)').hits.length === 1 && F.rdFindAll([['x', 'axb']], 'a.b').hits.length === 0);
  ok('runs of spaces in the query count as one', F.rdFindAll(secs, '  God    saw ').hits.length === 1);
  ok('a query as long as a book is harmless (it is cut to a phrase)', F.rdFindAll(secs, 'x'.repeat(100000)).hits.length === 0 && F.rdFindAll(secs, 'God'.repeat(100000)).q.length === F.RDF_MAX);
  ok('hostile text comes back as data, not markup in the numbers', F.rdFindAll([['x', '<script>alert(1)</script> hello']], 'hello').hits.every((h) => typeof h.k === 'number' && typeof h.p === 'number' && typeof h.n === 'number'));
}
{
  const big = [['x', Array.from({ length: 50 }, () => 'aa aa aa').join('\n\n')]];
  const r = F.rdFindAll(big, 'aa', { max: 20 });
  ok('the list is capped at the limit asked for, and says so', r.hits.length === 20 && r.capped === true && F.rdFindAll(big, 'aa', { max: 99999 }).hits.length === 150 && F.rdFindAll(big, 'aa').capped === false);
  ok('lines left out by the caller (other languages that are hidden) are not hits', F.rdFindAll([['x', 'alpha beta\n\ngamma beta']], 'beta', { skip: (b) => b.startsWith('gamma') }).hits.length === 1);
  ok('hits are counted by paragraph and section for the summary', (() => { const q = F.rdFindAll(secs, 'god'); return q.paragraphs === 3 && q.sections === 2; })(), F.rdFindAll(secs, 'god'));
}
{
  ok('stepping goes forward and back and wraps round', F.rdFindStep(5, 0, 1) === 1 && F.rdFindStep(5, 4, 1) === 0 && F.rdFindStep(5, 0, -1) === 4 && F.rdFindStep(5, 2, -1) === 1 && F.rdFindStep(1, 0, 1) === 0 && F.rdFindStep(1, 0, -1) === 0);
  ok('with no hit chosen yet, forward gives the first and back gives the last; with none it gives -1', F.rdFindStep(5, -1, 1) === 0 && F.rdFindStep(5, -1, -1) === 4 && F.rdFindStep(0, -1, 1) === -1 && F.rdFindStep(0, 3, -1) === -1);
  const hs = [{ k: 0, p: 1 }, { k: 0, p: 5 }, { k: 2, p: 0 }];
  ok('the nearest hit is the first at or after the place, or the first if the place is past them all', F.rdFindNear(hs, 0, 0) === 0 && F.rdFindNear(hs, 0, 2) === 1 && F.rdFindNear(hs, 1, 0) === 2 && F.rdFindNear(hs, 2, 0) === 2 && F.rdFindNear(hs, 3, 0) === 0 && F.rdFindNear([], 0, 0) === -1);
}
/* the list and the page agree: for words in real texts, the number of marks the reader draws in a paragraph is the number of hits the list gives for it */
const dir = path.join(__dirname, '../../texts');
if (fs.existsSync(path.join(dir, 'index.js'))) {
  const T = { data: {}, meta: {}, add(id, m, s) { this.data[id] = { m, s }; }, addIndex(i) { Object.assign(this.meta, i); } }; const run = (f) => vm.runInNewContext(fs.readFileSync(path.join(dir, f), 'utf8'), { BEATLAB_TEXTS: T }, { filename: f });
  run('index.js'); const ids = Object.keys(T.meta).filter((id) => !id.startsWith('x-mbh')); const queries = ['love', 'the lord', 'light', 'and he said', 'peace', 'where', 'ye', 'Brahman'];
  let checked = 0; const bad = []; let hitsTotal = 0; let t0 = Date.now();
  for (const id of ids.filter((x, i) => i % 3 === 0)) {
    run(id + '.js'); const s = T.data[id].s;
    for (const q of queries.slice(0, 5)) {
      const r = F.rdFindAll(s, q, { max: 60 }); hitsTotal += r.hits.length; const byP = {}; r.hits.forEach((h) => { const key = h.k + '.' + h.p; byP[key] = (byP[key] || 0) + 1; });
      if (r.capped) continue;
      for (const key of Object.keys(byP).slice(0, 4)) { const [k, p] = key.split('.').map(Number); const body = blockParts(textBlocks(s[k][1])[p]).body; const marks = (paraHTML(body, { find: q }).match(/<mark>/g) || []).length; checked++; if (marks !== byP[key]) bad.push([id, q, k, p, marks, byP[key]]); }
    }
  }
  ok(`in ${checked} paragraphs of real texts the number of hits for a paragraph is the number of marks the reader draws there`, bad.length === 0 && checked > 50, bad.slice(0, 3));
  console.log(`  (${hitsTotal} hits over ${ids.length / 3 | 0} texts in ${Date.now() - t0} ms)`);
  const mbh = 'x-mbh'; if (T.meta[mbh]) { run(mbh + '.js'); const t1 = Date.now(); const r = F.rdFindAll(T.data[mbh].s, 'zzzzqq'); const dt = Date.now() - t1; ok(`a search that finds nothing in the longest text (15 million characters) takes under 2 seconds (${dt} ms)`, r.hits.length === 0 && dt < 2000, dt); }
}
console.log(`find: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
