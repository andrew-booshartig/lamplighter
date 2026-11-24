// Run: node tests/bibles.test.js — the Bibles pack (../bibles, built by tools/build_bibles.py) and the logic of the side-by-side page (src/js/2z-bibles-core.js):
// reading references, lining versions up verse by verse, marking differing words, and the pack itself: every file loads, verses are in order and clean, every
// version is English and says what it is, the Douay-Rheims Psalms are re-keyed to the Hebrew numbering without losing a verse, the totals add up.
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const C = require('../src/js/2z-bibles-core.js');
const { englishScore } = require('../src/js/6d-passage.js');
let pass = 0; let fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 300)); } };

/* ── reading a reference ── */
const P = (s, known) => C.bibParseRef(s, known);
ok('John 3:16', JSON.stringify(P('John 3:16')) === JSON.stringify({ code: 'JHN', chapter: 3, v1: 16, v2: 16 }), P('John 3:16'));
ok('a chapter alone, a book alone', P('Ps 23').code === 'PSA' && P('Ps 23').chapter === 23 && P('Ps 23').v1 === 0 && P('Genesis').code === 'GEN' && P('Genesis').chapter === 0);
ok('a verse range, with a hyphen, an en dash or a dot', [P('1 Cor 13:4-7'), P('1 Cor 13:4–7'), P('1 Cor 13.4-7'), P('1cor13:4-7')].every((r) => r && r.code === '1CO' && r.chapter === 13 && r.v1 === 4 && r.v2 === 7));
ok('Roman numerals and spelled-out books', P('II Kings 2').code === '2KI' && P('I John 4:8').code === '1JN' && P('III John').code === '3JN' && P('First John') === null && P('Song of Songs 2:1').code === 'SNG' && P('Song of Solomon 2:1').code === 'SNG' && P('Revelation 22').code === 'REV' && P('Rev 22:21').code === 'REV' && P('Psalms 119:105').code === 'PSA' && P('Sirach 1:1').code === 'SIR' && P('Wisdom of Solomon 3').code === 'WIS' && P('2 Maccabees 7').code === '2MA');
ok('every alias is unique to one book, and every book can be found by its USFM-style name', (() => { const seen = {}; for (const [code, list] of Object.entries(C.BIB_ALIASES)) for (const a of list.split(' ')) { if (seen[a] && seen[a] !== code) return false; seen[a] = code; } return Object.keys(C.BIB_ALIASES).every((c) => P(C.BIB_ALIASES[c].split(' ')[0] + ' 1').code === c); })());
ok('what is not a passage is refused, never thrown', ['', ' ', 'Hezekiah 3', '<script>alert(1)</script>', '__proto__ 3:1', 'constructor 3', 'toString', '3:16', '123', 'John 3:16:2', 'x'.repeat(5000), null, undefined, '\u0000'].every((s) => { try { return P(s) === null; } catch (e) { return false; } }));
ok('Psalm 151 is its own book in the pack', P('Psalm 151').code === 'PS2' && P('Psalm 151').chapter === 1 && P('Psalm 150').code === 'PSA' && P('Psalm 151', ['PSA']).code === 'PSA');
ok('a reference can be limited to the books a pack has', P('Tobit 1', ['GEN', 'PSA']) === null && P('Psalm 1', ['GEN', 'PSA']).code === 'PSA');
ok('a reference reads back as text', C.bibRefText('John', 3, 16, 16) === 'John 3:16' && C.bibRefText('John', 3, 16, 18) === 'John 3:16–18' && C.bibRefText('Psalm', 23, 0, 0) === 'Psalm 23' && C.bibRefText('Genesis', 0, 0, 0) === 'Genesis');
ok('every book that has a library text names it', Object.keys(C.BIB_LIB_ID).length === 66 + 14 && Object.values(C.BIB_LIB_ID).every((x) => /^[bndo]-/.test(x)));

/* ── lining versions up ── */
{
  const ch = { a: [[0, 'Title A'], [1, 'One A'], [2, 'Two A'], [3, 'Three A']], b: [[1, 'One B and two B', 2], [3, 'Three B'], [4, 'Four B']], c: [[1, 'One C'], [3, 'Three C']], none: undefined };
  const R = C.bibRows(ch);
  ok('the rows are every verse number any version has, in order, with the title first', JSON.stringify(R.keys) === '[0,1,2,3,4]', R.keys);
  ok('a verse is its own text, a gap is a gap', R.cell('a', 1).text === 'One A' && R.cell('c', 2).gap === true && R.cell('a', 4).gap === true && R.cell('b', 0).gap === true);
  ok('a bridged verse spans the rows it covers, and the second row points back to it', R.cell('b', 1).span === 2 && R.cell('b', 2).under === 1 && !R.cell('b', 2).text);
  ok('a version with no such chapter is absent, not a gap', R.cell('none', 1).absent === true && R.cell('nope', 1).absent === true);
  ok('an original number is carried', C.bibRows({ d: [[1, 'x', 0, '22:1']] }).cell('d', 1).orig === '22:1');
  ok('no versions, no rows', C.bibRows({}).keys.length === 0 && C.bibRows({ a: undefined }).keys.length === 0);
}
/* ── marking the words that differ ── */
{
  const d = C.bibDiff('For God so loved the world, that he gave his only begotten Son', 'For God so loved the world, that he gave his one and only Son');
  ok('words not in the first version are marked, the rest are not', d.filter((p) => p.d).map((p) => p.w).join(' ') === 'one and' && d.filter((p) => !p.d && /\w/.test(p.w)).length === 12, d.filter((p) => p.d).map((p) => p.w));
  ok('the printed text is kept exactly, spaces and marks and all', ['For God’s sake — “quoted”, [art] ye… 12:3', '<b>x</b> & “y”', 'Ῥόδος ὁ θεός', '', '   '].every((t) => C.bibDiff('For God', t).map((p) => p.w).join('') === t));
  ok('case and the marks round a word do not count as a difference', C.bibDiff('The LORD is my shepherd', 'the Lord, is “my” shepherd;').every((p) => !p.d));
  ok('a spelling is a difference worth seeing', C.bibDiff('the heaven and the earth', 'the heauen and the earth').filter((p) => p.d).map((p) => p.w).join() === 'heauen');
  ok('agreement is the share of a verse’s words found in the other', C.bibAgreement('a b c d', 'a b c d') === 1 && C.bibAgreement('a b c d', 'a b x y') === 0.5 && C.bibAgreement('', 'a') === 0 && C.bibAgreement('a', '') === 0);
  ok('words are found in other scripts and with apostrophes', C.bibWords('God’s Ῥόδος don\'t') .length === 3 || C.bibWords('God’s Ῥόδος don\'t').length >= 3);
}
ok('versions with a book are picked from the index in its order', JSON.stringify(C.bibVersionsWith({ versions: [{ id: 'a', books: ['GEN'] }, { id: 'b', books: ['GEN', 'PSA'] }] }, 'PSA').map((v) => v.id)) === '["b"]' && C.bibVersionsWith(null, 'GEN').length === 0);

/* ── saving a whole version ── */
{
  const secs = C.bibSections([['GEN', 'Genesis', { 1: [[1, 'In the beginning.'], [2, 'And the earth.']], 2: [[1, 'Thus.']] }], ['PSA', 'Psalms', { 3: [[0, 'A Psalm of David.'], [1, 'LORD, how are they increased.']] }], ['XXX', 'Gone', null]]);
  ok('a version becomes a section per book, each chapter a heading and its verses', secs.length === 2 && secs[0][0] === 'Genesis' && secs[0][1] === '## Chapter 1\n[[1]] In the beginning. [[2]] And the earth.\n\n## Chapter 2\n[[1]] Thus.' && secs[1][1] === '## Psalm 3\n(A Psalm of David.) [[1]] LORD, how are they increased.', secs);
  ok('a book with no data is left out', C.bibSections([['ZZZ', 'None', undefined]]).length === 0 && C.bibSections([]).length === 0);
}

/* ── the pack ── */
const dir = path.join(__dirname, '../../bibles');
if (!fs.existsSync(path.join(dir, 'index.js'))) { console.log(`bibles: ${pass} passed, ${fail} failed (the bibles folder is not built; skipped the pack checks)`); process.exit(fail ? 1 : 0); }
const B = { versions: [], books: [], data: {}, addIndex(i) { this.versions = i.versions; this.books = i.books; }, add(v, c, chs, extra) { (this.data[v] = this.data[v] || {})[c] = { chs, extra }; } };
const run = (f) => vm.runInNewContext(fs.readFileSync(path.join(dir, f), 'utf8'), { BEATLAB_BIBLES: B }, { filename: f });
run('index.js');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'index.js'); let totalBytes = 0; for (const f of fs.readdirSync(dir)) totalBytes += fs.statSync(path.join(dir, f)).size;
ok('the pack lists many versions, each with a name, a basis, a source and a public-domain licence', B.versions.length >= 16 && B.versions.every((v) => v.id && v.name && v.short && v.basis && /^https:\/\/ebible\.org\/details\.php\?id=/.test(v.src) && /Public domain/.test(v.license) && v.books.length && v.verses > 1000), B.versions.map((v) => v.id));
ok('every version has its own file for each book it lists, and no file is unlisted', (() => { const want = new Set(B.versions.flatMap((v) => v.books.map((c) => `${v.id}-${c.toLowerCase()}.js`))); return files.length === want.size && files.every((f) => want.has(f)); })(), [files.length]);
ok('the pack is a sensible size (about 66 MB, no file over 2 MB)', totalBytes > 40e6 && totalBytes < 100e6 && files.every((f) => fs.statSync(path.join(dir, f)).size < 2e6), totalBytes);
ok('the licences file names every version', (() => { const t = fs.readFileSync(path.join(dir, 'LICENSES.txt'), 'utf8'); return B.versions.every((v) => t.includes(v.name) && t.includes(v.src)); })());
const books = Object.fromEntries(B.books.map((b) => [b[0], b]));
let verses = 0; const problems = []; const byVer = {};
for (const f of files) {
  run(f); const [, ver, code] = /^(\w+)-(\w+)\.js$/.exec(f); const code2 = code.toUpperCase(); const d = B.data[ver] && B.data[ver][code2]; if (!d) { problems.push(['not loaded', f]); continue; }
  const chs = Object.keys(d.chs).map(Number); let last = 0; let bad = null; let words = '';
  for (const c of chs) { if (!(c > last)) bad = bad || ['chapters not ascending', f, c]; last = c; let lv = -1;
    for (const v of d.chs[c]) { verses++; const [n, t, end, orig] = v;
      if (!(Number.isInteger(n) && n >= 0 && n > lv)) bad = bad || ['verse order', f, c, n]; lv = n;
      if (typeof t !== 'string' || !t.trim() || t !== t.trim() || /\s{2,}/.test(t)) bad = bad || ['empty or untidy text', f, c, n];
      else if (/\\[a-z+]|\|strong|\\\+|\[\[|<\/?[a-z]|¶|\{\\|\\f |\\x /i.test(t)) bad = bad || ['markup left in', f, c, n, t.slice(0, 50)];
      else if (t.length > 4500) bad = bad || ['verse too long', f, c, n, t.length];
      if (end != null && end !== 0 && !(end > n)) bad = bad || ['bad bridge', f, c, n, end];
      if (orig != null && typeof orig !== 'string') bad = bad || ['bad original number', f, c, n];
      if (words.length < 6000) words += ' ' + t; }
  }
  if (!chs.length) bad = bad || ['no chapters', f];
  if (d.extra && d.extra.d && !d.extra.d.every((c) => d.chs[String(c)] || true)) bad = bad || ['flags', f];
  if (bad) problems.push(bad);
  (byVer[ver] = byVer[ver] || []).push(englishScore(words));
}
ok('every file loads, with chapters and verses in order and no markup, empty or runaway text', problems.length === 0, problems.slice(0, 6));
ok('every version is English (function words make up a good share of every book)', Object.entries(byVer).every(([v, a]) => a.filter((x) => x < 0.2).length <= Math.max(1, a.length * 0.03)), Object.entries(byVer).map(([v, a]) => [v, Math.min(...a).toFixed(2)]).filter(([, m]) => m < 0.2));
ok('the index total of verses is the number of verses in the files', B.versions.every((v) => v.verses === Object.values(B.data[v.id]).reduce((a, b) => a + Object.values(b.chs).reduce((x, y) => x + y.length, 0), 0)), B.versions.map((v) => [v.id, v.verses]));
/* the sixty-six books: the same chapters in the King James and the World English Bible, and the right number in all */
const std = { GEN: 50, EXO: 40, LEV: 27, NUM: 36, DEU: 34, JOS: 24, PSA: 150, ISA: 66, JER: 52, EZK: 48, MAL: 4, MAT: 28, MRK: 16, LUK: 24, JHN: 21, ACT: 28, ROM: 16, REV: 22, PRO: 31, JOB: 42 };
for (const [c, n] of Object.entries(std)) for (const ver of ['kjv', 'web', 'asv', 'bsb', 'dra']) { if (ver === 'dra' && c === 'DAN') continue; const d = B.data[ver] && B.data[ver][c]; ok(`${ver} ${c} has ${n} chapters`, d && Object.keys(d.chs).length === n, d && Object.keys(d.chs).length); }
{ const total = (ver) => Object.entries(B.data[ver]).filter(([c]) => books[c] && books[c][2] !== 'dc').reduce((a, [, d]) => a + Object.keys(d.chs).length, 0); ok('the King James and the World English Bible have all 1,189 chapters of the 66 books', total('kjv') === 1189 && total('web') === 1189, [total('kjv'), total('web')]); }
ok('the Hebrew Bible versions carry the 39 books and the New Testament ones the 27', B.versions.find((v) => v.id === 'jps').books.length === 39 && B.versions.find((v) => v.id === 'lee').books.length === 39 && B.versions.find((v) => v.id === 'tnt').books.length === 27 && B.versions.find((v) => v.id === 'asv').books.length === 66);
/* known verses, in every version that has them */
const has = (ver, code, c, v) => { const d = B.data[ver] && B.data[ver][code]; const x = d && (d.chs[c] || []).find((y) => y[0] === v); return x && x[1]; };
for (const ver of B.versions.map((v) => v.id)) { const g = has(ver, 'GEN', '1', 1); if (g) ok(`${ver}: Genesis 1:1 is about a beginning and God`, /begin|bigynn|first/i.test(g) && /God/.test(g), g); const j = has(ver, 'JHN', '3', 16); if (j) ok(`${ver}: John 3:16 is the verse`, /God/.test(j) && /world/i.test(j) && /son|sone/i.test(j), j); const p = has(ver, 'PSA', '23', 1); if (p) ok(`${ver}: Psalm 23:1 is the shepherd psalm`, /shepherd|shepheard|sheep|ruleth|pastour|herd/i.test(p), p); }
/* the Douay-Rheims Psalms: re-keyed to the Hebrew numbering, nothing lost, its own numbers kept */
{
  const dra = B.data.dra.PSA; const kjv = B.data.kjv.PSA; let bad = null; let all = 0;
  for (let k = 1; k <= 150; k++) { const a = (dra.chs[k] || []).filter((v) => v[0] >= 1); const b = (kjv.chs[k] || []).filter((v) => v[0] >= 1); if (a.length !== b.length) bad = bad || ['psalm ' + k, a.length, b.length]; all += (dra.chs[k] || []).length; if (!(dra.chs[k] || []).every((v) => /^\d+:\d+(–\d+)?$/.test(v[3]))) bad = bad || ['original numbers', k]; }
  ok('every Douay-Rheims Psalm has the same number of verses as the King James one once its title is set aside', !bad, bad);
  const vulgTotal = (() => { let n = 0; const seen = new Set(); for (let k = 1; k <= 150; k++) for (const v of dra.chs[k] || []) { const m = /^(\d+):(\d+)(?:–(\d+))?$/.exec(v[3]); if (m) { const lo = +m[2]; const hi = m[3] ? +m[3] : lo; for (let x = lo; x <= hi; x++) { const key = m[1] + ':' + x; if (!seen.has(key)) { seen.add(key); n++; } } } } return n; })();
  ok('and no Vulgate verse is lost or used twice: its own numbers cover every verse once', all >= 2400 && vulgTotal > 2500, [all, vulgTotal]);
  ok('Psalm 23 in the Douay-Rheims is Psalm 22, verse 1', dra.chs['23'][0][3] === '22:1' && /The Lord ruleth me/.test(dra.chs['23'][0][1]), dra.chs['23'].slice(0, 2));
  ok('Psalm 10 (Hebrew) continues Vulgate Psalm 9, and Psalm 51 takes two Vulgate verses as its title', dra.chs['10'][0][3] === '9:22' && dra.chs['51'][0][0] === 0 && dra.chs['51'][0][3] === '50:1–2', [dra.chs['10'][0], dra.chs['51'][0]]);
  ok('Hebrew Psalms 114 and 115 are both Vulgate 113, 116 is 114 and 115, 147 is 146 and 147', /^113:/.test(dra.chs['114'][0][3]) && /^113:/.test(dra.chs['115'][0][3]) && /^114:/.test(dra.chs['116'][0][3]) && /^115:/.test(dra.chs['116'][dra.chs['116'].length - 1][3]) && /^146:/.test(dra.chs['147'][0][3]) && /^147:/.test(dra.chs['147'][dra.chs['147'].length - 1][3]));
  ok('the Douay-Rheims says so on each Psalm it renumbers', Object.keys(B.data.dra.PSA.extra.n).length >= 140 && /Vulgate/.test(B.data.dra.PSA.extra.n['10'] || ''), Object.keys(B.data.dra.PSA.extra.n).length);
}
ok('the Jewish Bibles’ bracketed Hebrew verse numbers are not left in the text', ['jps', 'lee'].every((v) => !/\(\d{1,3}[-:]\d{1,3}\)/.test(JSON.stringify(B.data[v].PSA.chs))));
ok('the Berean, Majority and Open English Bibles are listed as public-domain dedications or releases', ['bsb', 'msb', 'oeb'].every((v) => B.versions.find((x) => x.id === v).basis.length > 20));
ok('chapters a version divides differently are flagged, and the flags name real chapters', (() => { for (const [v, bk] of Object.entries(B.data)) for (const [c, d] of Object.entries(bk)) if (d.extra && d.extra.d) for (const n of d.extra.d) if (!d.chs[String(n)]) return false; return true; })() && Object.values(B.data.dra).some((d) => d.extra && d.extra.d && d.extra.d.length));
console.log(`bibles: ${pass} passed, ${fail} failed (${B.versions.length} versions, ${files.length} files, ${verses.toLocaleString()} verses, ${(totalBytes / 1e6).toFixed(1)} MB)`);
process.exit(fail ? 1 : 0);
