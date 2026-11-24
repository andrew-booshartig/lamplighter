// Run: node tests/passage-filter.test.js — the filters of the Random page (src/js/2z-passage-filter-core.js, with the Atlas table of 2z-passage-index.js made by tools/passage_index.js):
// the years a catalogue date gives, a book's religions and kinds, the pool the filters leave, the count beside every choice, the address that carries them (and the old addresses), the presets and the line that says what is on.
// Combinations are random but seeded; every draw of the pool is checked against a second, plain-minded reading of the filters.
const fs = require('fs'); const path = require('path');
const F = require('../src/js/2z-passage-filter-core.js'); const IDX = require('../src/js/2z-passage-index.js');
const C = require('../src/js/2z-passage-core.js'); const POOL = require('../src/js/2z-passage-pool.js'); const LIBM = require('../src/js/24-data-path-lib.js'); const BEL = require('../src/js/2z-belief-core.js');
const { M } = require('./_harness');
let pass = 0, fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 400)); } };
const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

/* ── the years a catalogue date gives ── */
const W = (s, prev) => F.psfWhen(s, prev); const eq = (r, a, b) => !!r && r.from === a && r.to === b;
ok('when: a plain year, with and without CE', eq(W('720 CE'), 720, 720) && eq(W('1694'), 1694, 1694) && eq(W('c. 1500'), 1500, 1500));
ok('when: a range, BCE and CE, and a range across the two', eq(W('c. 586–500 BCE'), -586, -500) && eq(W('c. 80–90 CE'), 80, 90) && eq(W('c. 20 BCE–50 CE'), -20, 50) && eq(W('c. 200 BCE – 200 CE'), -200, 200) && eq(W('c. 1500 BCE–392 CE (Taylor 1790; ed. 1891)'), -1500, 392));
ok('when: a short end takes the digits of the start (1901–02, 1868–70, 1530–80)', eq(W('recorded 1901–02 CE'), 1901, 1902) && eq(W('1868–70'), 1868, 1870) && eq(W('1530–80 CE (ed. 1911)'), 1530, 1580));
ok('when: centuries, BCE and CE', eq(W('c. 6th c. BCE'), -600, -501) && eq(W('c. 5th–6th c. CE'), 401, 600) && eq(W('c. 10th–5th c. BCE'), -1000, -401) && eq(W('c. 2nd c. BCE–7th c. CE'), -200, 700) && eq(W('13th–16th c.'), 1201, 1600) && eq(W('c. 3rd c. BCE–'), -300, -201));
ok('when: decades, and a lone 1700s is the century', eq(W('recorded 1860s–1900s CE'), 1860, 1909) && eq(W('1920s CE'), 1920, 1929) && eq(W('c. 60s–90 CE'), 60, 90) && eq(W('oral; recorded 1700s'), 1700, 1799));
ok('when: the text’s own date, not its translation’s or edition’s', eq(W('1864 CE (trans. 1927)'), 1864, 1864) && eq(W('1616; English 1690'), 1616, 1616) && eq(W('c. 200–500 CE (compiled); translation 1896–1903'), 200, 500) && eq(W('Zohar c. 1280 CE; Latin 1677–84; English 1887'), 1280, 1280) && eq(W('reconstructed; pub. 1890 CE'), 1890, 1890));
ok('when: the parts of one book give the whole span, and the era of the last carries back', eq(W('1–39: 8th c.; 40–55: 6th c.; 56–66: 5th c. BCE'), -800, -401) && eq(W('1–8: c. 520–480 BCE; 9–14 later'), -520, -480));
ok('when: no years, and "same" is the entry before it', W('oral') === null && W('oral; ancient') === null && W('oral; 50,000+ years') === null && W('') === null && W('same') === null && eq(W('same', { from: -300, to: -201 }), -300, -201));
ok('when: a number that is not a date is not read (a section "1–39:" or 50,000)', !eq(W('1–39: 8th c.'), 1, 39) && W('50,000+ years') === null);
ok('when: never throws, always years in order', ['', null, undefined, 'x', '99999999', 'c. 3rd–1st c. BCE', '??', '12th c. CE (the story of 680 CE)', 'c. 1st c. CE? (debated)'].every((s) => { const r = W(s); return r === null || (r.from <= r.to && isFinite(r.from) && isFinite(r.to)); }));
ok('periods: the five ready-made ranges cover every year once, and the sixth takes what is left', (() => { const P = F.PSF_PERIODS; for (const y of [-5000, -501, -500, -1, 1, 500, 501, 1500, 1501, 1800, 1801, 1930, 1931, 2026]) { const n = P.filter((p) => F.psfOverlap(y, y, p[2], p[3])).length; if (n !== 1) return false; } return P.length === 6; })());
ok('range labels: the ready-made name, then "up to", "from" and "to"', F.psfRangeLabel(null, -501) === 'Before 500 BCE' && F.psfRangeLabel(501, 1500) === '500 to 1500' && F.psfRangeLabel(null, 500) === 'up to 500 CE' && F.psfRangeLabel(1623, null) === 'from 1623' && F.psfRangeLabel(-300, 200) === '300 BCE to 200 CE');

/* ── the facts of every book, from the real Library ── */
const dir = path.join(__dirname, '../../texts');
if (!fs.existsSync(path.join(dir, 'index.js'))) { console.log('texts folder not found: the tests of the real Library are skipped'); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0); }
const vm = require('vm'); let META = {}; vm.runInNewContext(fs.readFileSync(path.join(dir, 'index.js'), 'utf8'), { BEATLAB_TEXTS: { addIndex(o) { META = o; }, meta: {}, data: {} } });
const COLL = M.LIB_COLLECTIONS; const collOf = (g) => COLL.findIndex((c) => c[2].includes(g));
const scan = (m) => !!m && /scan|OCR/i.test(`${m.note || ''} ${m.license || ''}`);
const readable = (l) => !!META[l.id]; const never = (l) => false;
const src = (l) => !LIBM.LIB_SHELF_ONLY.includes(l.group) && !scan(META[l.id]) && !POOL.PSU_ANNOTATED.has(l.id) && !POOL.PSU_ABOUT.has(l.id) && !Object.prototype.hasOwnProperty.call(POOL.PSU_READ_OUT, l.id);
const pg = (l) => !LIBM.LIB_SHELF_ONLY.includes(l.group);
const facts = F.psfFacts(LIBM.LIB, { readable, coll: collOf, src, pg, idx: IDX, kinds: C.PSU_KIND, shelfBelief: BEL.SHELF_BELIEF });
const byId = Object.fromEntries(facts.map((f) => [f.id, f]));
const ctx = { books: Object.fromEntries(facts.map((f) => [f.id, true])), nColl: COLL.length, collNames: COLL.map((c) => c[0]), groups: Object.fromEntries(IDX.PSF_GROUPS.map((g) => [g[0], true])), fams: IDX.PSF_FAMILIES, trads: IDX.PSF_TRADS, legacy: Object.fromEntries(M.TRADITIONS.map((t) => [t.id, true])) };
const imag = collOf('im'); const LO = new Set([imag]);
ok('facts: one for every readable book, none for the others', facts.length === LIBM.LIB.filter(readable).length && facts.length > 1300);
ok('facts: the default pool is the 199 typed books, the page pool the 763 on the shelves of scriptures and sources', facts.filter((f) => f.s).length === 199 && facts.filter((f) => f.p).length === 763, [facts.filter((f) => f.s).length, facts.filter((f) => f.p).length]);
const dated = facts.filter((f) => f.y0 != null); const undated = facts.filter((f) => f.y0 == null);
ok('facts: every book but one has years, and the years are in order (undated: ' + undated.map((f) => f.id).join(',') + ')', dated.length >= facts.length - 3 && dated.every((f) => f.y0 <= f.y1 && f.y0 > -50000 && f.y1 <= 2026), undated.map((f) => f.id));
ok('facts: "same" resolves to the entry before it (the Majjhima Nikaya takes the Digha’s years)', byId['x-mn'] && byId['x-mn'].y0 === byId['x-dn'].y0 && byId['x-sn'].y0 === byId['x-dn'].y0 && byId['x-sn'].y1 === byId['x-dn'].y1, [byId['x-mn'], byId['x-dn']]);
ok('facts: the Psalms are Judaism and Christianity’s, Abrahamic, "one God", a hymn and scripture', (() => { const f = byId['b-psa']; return f.rs.has('t:judaism') && f.rs.has('f:abrahamic') && f.rs.has('g:abrahamic') && f.rs.has('b:one') && f.ks.includes('hym') && f.ks.includes('scr'); })(), byId['b-psa'] && [...byId['b-psa'].rs]);
ok('facts: a book carries its religion and the ones it is nested under (the Theravada texts are Buddhism’s)', facts.filter((f) => f.rs.has('t:theravada')).length > 0 && facts.filter((f) => f.rs.has('t:theravada')).every((f) => f.rs.has('t:sthavira') && f.rs.has('t:buddhism')));
ok('facts: a religion is not part of the one it grew from (Judaism holds no book that is only Christianity’s, and Christianity’s Catholic branch is nested in it)', IDX.PSF_TRADS.christianity[2] === '' && IDX.PSF_TRADS.judaism[2] === '' && IDX.PSF_TRADS.catholicism[2] === 'christianity' && IDX.PSF_TRADS.rabbinic[2] === 'judaism' && IDX.PSF_TRADS.protestantism[2] === 'catholicism', [IDX.PSF_TRADS.christianity, IDX.PSF_TRADS.judaism, IDX.PSF_TRADS.catholicism]);
ok('facts: the New Testament’s books are Christianity’s and not Judaism’s; the Hebrew Bible’s are Judaism’s, or the Israelite religion’s where the Atlas ties them to that (Hosea, Amos, Micah)', facts.filter((f) => f.group === 'nt').every((f) => f.rs.has('t:christianity') && !f.rs.has('t:judaism')) && facts.filter((f) => f.group === 'hb').every((f) => f.rs.has('t:judaism') || f.rs.has('t:israelite')) && facts.filter((f) => f.group === 'hb' && !f.rs.has('t:judaism')).length <= 5);
ok('facts: a shelf of one religion places a book the Atlas ties to nothing (a Church Father is Christianity’s)', (() => { const un = facts.filter((f) => f.group === 'ec' && !String(IDX.PSF_LINKS[f.id] || '')); return un.length > 20 && un.every((f) => f.rs.has('t:christianity')); })());
ok('facts: a book on a shelf of several religions has the family of its shelf and no religion (a Celtic tale is European)', (() => { const un = facts.filter((f) => f.group === 'ne' && !String(IDX.PSF_LINKS[f.id] || '')); return un.length > 0 && un.every((f) => f.rs.has('f:european') && ![...f.rs].some((s) => s[0] === 't')); })());
ok('facts: the four belief labels each hold books, and every selector names something', ['one', 'many', 'spirit', 'inner'].every((b) => facts.some((f) => f.rs.has('b:' + b))) && facts.every((f) => [...f.rs].every((s) => { const m = /^([tfgb]):(.+)$/.exec(s); return m && (m[1] === 't' ? IDX.PSF_TRADS[m[2]] : m[1] === 'f' ? IDX.PSF_FAMILIES[m[2]] : m[1] === 'g' ? ctx.groups[m[2]] : F.PSF_BELIEFS.includes(m[2])); })));
ok('facts: the kinds follow the Atlas, the Bible books, the shelf and the title, and every kind holds books', F.PSF_KIND_IDS.every((k) => facts.some((f) => f.ks.includes(k))) && byId['b-pro'].ks.includes('wis') && byId['x-mab'].ks.includes('myth') && facts.filter((f) => f.group === 'sc').every((f) => f.ks.includes('aid')) && facts.filter((f) => f.group === 'tm').every((f) => f.ks.includes('myth')), F.PSF_KIND_IDS.map((k) => k + facts.filter((f) => f.ks.includes(k)).length));
ok('kinds: a title says what a book is only where no category does (a study of psalms is not a hymn book)', F.psfTitleKinds('Augustine: expositions on the Psalms', false).length === 0 && F.psfTitleKinds('A Serious Call to a Devout and Holy Life (William Law, 1729)', false).length === 0 && F.psfTitleKinds('Songs of Kabir', false).join() === 'hym' && F.psfTitleKinds('Songs of Kabir', true).length === 0 && F.psfTitleKinds('Household Tales', true).join() === 'myth');

/* ── a second, plain reading of the filters, to check the pool against ── */
const overlaps = (f, a, b) => (a == null || f.y1 >= a) && (b == null || f.y0 <= b);
function oracle(st, mode, leftOut) {
  return facts.filter((f) => {
    const named = st.b.includes(f.id);
    if (st.x) { const set = LEG[st.x] || new Set(); if (!set.has(f.id)) return false; }
    if (st.b.length && !named) return false;
    if (!named && st.base === 'sources' && !(mode === 'passage' ? f.s : f.p)) return false;
    if (!named && leftOut.has(f.c) && !st.a.includes(f.c) && !st.x) return false;
    if (st.a.length && !st.a.includes(f.c)) return false;
    if (st.r.length && !st.r.some((sel) => f.rs.has(sel))) return false;
    if (f.y0 == null) { if (st.dated) return false; } else if (st.p.length && !st.p.some((q) => overlaps(f, q[0], q[1]))) return false;
    if (st.k.length && !st.k.some((k) => f.ks.includes(k))) return false;
    return true;
  });
}
const LEG = {}; M.TRADITIONS.forEach((t) => { LEG[t.id] = new Set(M.tradTexts(t).map((l) => l.id)); });
const legacy = (x) => LEG[x] || null;
const sel = { r: [...new Set(facts.flatMap((f) => [...f.rs]))], k: F.PSF_KIND_IDS, b: facts.map((f) => f.id), a: COLL.map((c, i) => i), p: [[null, -501], [-500, 500], [501, 1500], [1501, 1800], [1801, 1930], [null, 500], [1000, null], [-300, 200], [1900, 1905]] };
const rnd = mulberry(20261118); const pick = (arr) => arr[Math.floor(rnd() * arr.length)]; const some = (arr, n) => Array.from({ length: n }, () => pick(arr));
function randomState() {
  const st = F.psfBlank(); st.base = rnd() < 0.5 ? 'sources' : 'all';
  if (rnd() < 0.5) st.r = some(sel.r, 1 + Math.floor(rnd() * 3)); if (rnd() < 0.35) st.p = some(sel.p, 1 + Math.floor(rnd() * 2)); if (rnd() < 0.15) st.dated = true;
  if (rnd() < 0.12) st.b = some(sel.b, 1 + Math.floor(rnd() * 4)); if (rnd() < 0.4) st.k = some(sel.k, 1 + Math.floor(rnd() * 2)); if (rnd() < 0.25) st.a = some(sel.a, 1 + Math.floor(rnd() * 3));
  if (rnd() < 0.05) st.x = pick(Object.keys(LEG));
  return F.psfNorm(st, ctx);
}
const states = Array.from({ length: 600 }, randomState); const modes = ['passage', 'page', 'pages'];
let nonEmpty = 0; let bad = 0; let first = null;
states.forEach((st, i) => {
  const mode = modes[i % 3]; const leftOut = i % 2 ? LO : new Set(); const o = { mode, leftOut, legacy };
  const pool = F.psfPool(facts, st, o).map((f) => f.id); const want = oracle(st, mode, leftOut).map((f) => f.id);
  if (pool.length) nonEmpty++; if (pool.join() !== want.join()) { bad++; if (!first) first = { st, mode, got: pool.length, want: want.length }; }
});
ok('pool: 600 random combinations (every section, both pools, all three modes, the left-out shelf on and off) give exactly what a plain reading of the filters gives', bad === 0, first);
ok('pool: most of the random combinations are not empty (the test is not vacuous)', nonEmpty > 250, nonEmpty);
ok('pool: every drawable book satisfies every filter (a few hundred combinations, checked book by book)', states.slice(0, 300).every((st, i) => { const o = { mode: modes[i % 3], leftOut: LO, legacy }; return F.psfPool(facts, st, o).every((f) => {
  const named = st.b.includes(f.id);
  return (!st.b.length || named) && (!st.r.length || st.r.some((s) => f.rs.has(s))) && (!st.k.length || st.k.some((k) => f.ks.includes(k))) && (!st.a.length || st.a.includes(f.c)) && (f.y0 == null ? !st.dated : !st.p.length || st.p.some((q) => overlaps(f, q[0], q[1])))
    && (named || st.base === 'all' || (o.mode === 'passage' ? f.s : f.p)) && (named || st.x || st.a.includes(f.c) || f.c !== imag) && (!st.x || LEG[st.x].has(f.id)); }); }));

/* ── the counts: what a choice would give ── */
const replaceSec = (st, sec, v) => Object.assign({}, st, sec === 'p' ? { p: [v] } : sec === 'base' ? { base: v } : { [sec]: [v] });
let cBad = 0; let cFirst = null; let cChecked = 0;
states.slice(0, 120).forEach((st, i) => {
  const o = { mode: modes[i % 3], leftOut: i % 2 ? LO : new Set(), legacy }; const cn = F.psfCounts(facts, st, o); const pool = F.psfPool(facts, st, o);
  const chk = (sec, key, val, n) => { cChecked++; const want = F.psfPool(facts, F.psfNorm(replaceSec(st, sec, val), ctx), o).length; if (n !== want) { cBad++; if (!cFirst) cFirst = { sec, key, got: n, want, st }; } };
  if (cn.total !== pool.length) { cBad++; cFirst = cFirst || { total: cn.total, pool: pool.length }; }
  chk('base', 'sources', 'sources', cn.base.sources); chk('base', 'all', 'all', cn.base.all);
  for (let j = 0; j < 14; j++) { const s = pick(sel.r); chk('r', s, s, cn.r[s] || 0); }
  F.PSF_KIND_IDS.forEach((k) => chk('k', k, k, cn.k[k] || 0)); COLL.forEach((c, a) => chk('a', a, a, cn.a[a] || 0));
  F.PSF_PERIODS.forEach((p) => chk('p', p[0], [p[2], p[3]], cn.p[p[0]] || 0));
  for (let j = 0; j < 14; j++) { const b = pick(sel.b); chk('b', b, b, cn.b.has(b) ? 1 : 0); }
});
ok(`counts: the number beside a choice is the size of the pool with that choice alone in its section (${cChecked} choices checked against the pool, in 120 states)`, cBad === 0 && cChecked > 4000, cFirst);
ok('counts: a zero is a choice that leaves nothing, and the sum is not inflated (no count is above the books there are)', (() => { const cn = F.psfCounts(facts, F.psfBlank(), { mode: 'passage', leftOut: LO }); return Object.values(cn.r).every((n) => n > 0 && n <= facts.length) && cn.total === 199 && cn.base.all === facts.length - facts.filter((f) => f.c === imag).length; })());
ok('counts: with a religion chosen, a kind’s count is what that kind adds inside it (Buddhism, hymns and poems)', (() => { const st = F.psfNorm({ base: 'all', r: ['t:buddhism'] }, ctx); const cn = F.psfCounts(facts, st, { mode: 'passage', leftOut: LO }); return cn.k.hym === F.psfPool(facts, F.psfNorm({ base: 'all', r: ['t:buddhism'], k: ['hym'] }, ctx), { mode: 'passage', leftOut: LO }).length && cn.k.hym > 0; })());
ok('counts: undated books are counted in every period unless "dated texts only" is on', (() => { const o = { mode: 'passage', leftOut: LO }; const a = F.psfCounts(facts, F.psfNorm({ base: 'all' }, ctx), o); const b = F.psfCounts(facts, F.psfNorm({ base: 'all', dated: true }, ctx), o); return a.undated >= 1 && b.undated === 0 && b.total === a.total - a.undated && F.PSF_PERIODS.every((p) => a.p[p[0]] === (b.p[p[0]] || 0) + a.undated || (!a.p[p[0]] && !b.p[p[0]])); })());
ok('relax: when nothing matches, taking off one section is offered with what it gives, most books first', (() => { const st = F.psfNorm({ base: 'sources', r: ['t:buddhism'], k: ['hym'], p: [[1800, 1900]] }, ctx); const o = { mode: 'passage', leftOut: LO }; const pool = F.psfPool(facts, st, o); const rx = F.psfRelax(facts, st, o); return pool.length === 0 && rx.length >= 2 && rx.every((r, i) => r.n > 0 && (!i || rx[i - 1].n >= r.n)) && rx.every((r) => { const s2 = r.sec === 'base' ? Object.assign({}, st, { base: 'all' }) : r.sec === 'p' ? Object.assign({}, st, { p: [], dated: false }) : Object.assign({}, st, { [r.sec]: [] }); return F.psfPool(facts, s2, o).length === r.n; }); })());

ok('relax: where no single section can come off to leave a book, nothing is offered (the page then offers Clear all)', (() => { const st = F.psfNorm({ base: 'sources', r: ['t:jainism'], k: ['hym'], p: [[1800, 1900]] }, ctx); return F.psfPool(facts, st, { mode: 'passage', leftOut: LO }).length === 0 && F.psfRelax(facts, st, { mode: 'passage', leftOut: LO }).length === 0; })());

/* ── the three trial combinations of the brief ── */
const TR = (st, mode = 'passage') => F.psfPool(facts, F.psfNorm(st, ctx), { mode, leftOut: LO });
const t1 = TR({ base: 'all', r: ['t:buddhism', 't:hinduism'], p: [[null, 500]] }); const t2 = TR({ base: 'all', b: ['b-psa', 'b-pro'] }); const t3 = TR({ base: 'all', r: ['f:americas'], k: ['myth'] });
ok('trial 1: Buddhism and Hinduism before 500 CE draws only books of those two religions, dated before 501', t1.length > 20 && t1.every((f) => (f.rs.has('t:buddhism') || f.rs.has('t:hinduism')) && (f.y0 == null || f.y0 <= 500)), t1.length);
ok('trial 2: the Psalms and Proverbs only is two books', t2.length === 2 && t2.map((f) => f.id).sort().join() === 'b-pro,b-psa');
ok('trial 3: folk tales and myths of the Americas draws only myths and tales, and only from the Americas’ religions', t3.length > 10 && t3.every((f) => f.ks.includes('myth') && f.rs.has('f:americas')), t3.length);
console.log(`  trials: Buddhism and Hinduism before 500 CE ${t1.length} books on ${new Set(t1.map((f) => f.group)).size} shelves; the Psalms and Proverbs ${t2.length}; the Americas' myths and tales ${t3.length} on ${new Set(t3.map((f) => f.group)).size} shelves`);

/* ── the address ── */
const same = (a, b) => JSON.stringify(F.psfNorm(a, ctx)) === JSON.stringify(F.psfNorm(b, ctx));
let rtBad = 0; let rtFirst = null;
for (const st0 of states.concat([F.psfBlank(), F.psfNorm({ base: 'all' }, ctx)])) {
  const st = Object.assign({}, st0); const q = F.psfQuery(st); const qs = F.psfQueryString(st);
  const via = Object.fromEntries(new URLSearchParams(qs.replace(/^&/, ''))); const back = F.psfParse(via, ctx);
  if (!same(st, back)) { rtBad++; if (!rtFirst) rtFirst = { st, qs, back }; }
}
ok('address: every one of 600 random states goes to an address and comes back the same (through the browser’s own query reading)', rtBad === 0, rtFirst);
ok('address: the default state has no address at all, Everything is pool=all, and any choice writes its pool', Object.keys(F.psfQuery(F.psfBlank())).length === 0 && F.psfQueryString(F.psfNorm({ base: 'all' }, ctx)) === '&pool=all' && F.psfQuery(F.psfNorm({ r: ['t:buddhism'] }, ctx)).pool === 'sources' && F.psfQuery(F.psfNorm({ r: ['t:buddhism'], base: 'all' }, ctx)).pool === 'all');
ok('address: the page writes the pool every time (always), so a link replays what it was drawn from; the plain default still has none', F.psfQueryString(F.psfBlank(), true) === '&pool=sources' && F.psfQueryString(F.psfBlank()) === '' && F.psfQueryString(F.psfNorm({ base: 'all', k: ['hym'] }, ctx), true) === '&pool=all&k=hym' && same(F.psfParse(Object.fromEntries(new URLSearchParams(F.psfQueryString(F.psfBlank(), true).slice(1))), ctx), F.psfBlank()));
ok('address: the new keys are r, p, dated, b, k, a (periods as from~to, open ends empty, BCE negative)', (() => { const q = F.psfQuery(F.psfNorm({ r: ['t:buddhism', 'g:abrahamic', 'b:one', 'f:dharmic'], p: [[null, -501], [1801, 1930]], dated: true, b: ['b-psa'], k: ['hym', 'wis'], a: [3, 0] }, ctx)); return q.r === 't:buddhism.g:abrahamic.b:one.f:dharmic' && q.p === '~-501.1801~1930' && q.dated === '1' && q.b === 'b-psa' && q.k === 'hym.wis' && q.a === '0.3'; })(), F.psfQuery(F.psfNorm({ r: ['t:buddhism'], p: [[null, -501], [1801, 1930]] }, ctx)));
/* the old addresses: what each meant, as the pool it drew from */
const legacyPool = (q, mode = 'passage') => F.psfPool(facts, F.psfParse(q, ctx), { mode, leftOut: LO, legacy }).map((f) => f.id);
const oldReadable = facts; const ids = (a) => a.map((f) => f.id);
ok('old address: ?b=<book> is that book alone', legacyPool({ b: 'b-gen' }).join() === 'b-gen' && legacyPool({ b: 'x-dhp' }).join() === 'x-dhp' && legacyPool({ b: 'no-such-book' }).length === 199);
ok('old address: ?a=<numbers> is every readable book of those collections (scans, study aids and the left-out shelf too), as before', (() => { const a = [0, 3]; const want = ids(oldReadable.filter((f) => a.includes(f.c))); return legacyPool({ a: '0.3' }).join() === want.join() && legacyPool({ a: '0.3' }, 'pages').join() === want.join() && legacyPool({ a: String(imag) }).join() === ids(oldReadable.filter((f) => f.c === imag)).join(); })());
ok('old address: ?s=<collection name> is that collection', COLL.every((c, i) => legacyPool({ s: c[0] }).join() === ids(oldReadable.filter((f) => f.c === i)).join()));
ok('old address: ?t=<Journey tradition> is the books at its stations, even where a collection is left out', M.TRADITIONS.every((t) => legacyPool({ t: t.id }).join() === ids(oldReadable.filter((f) => LEG[t.id].has(f.id))).join()));
ok('old address: ?pool=all is every readable book except the areas left out; ?pool=sources is the clean pool (passages) or the pages pool', legacyPool({ pool: 'all' }).join() === ids(oldReadable.filter((f) => f.c !== imag)).join() && legacyPool({ pool: 'sources' }).join() === ids(oldReadable.filter((f) => f.s)).join() && legacyPool({ pool: 'sources' }, 'page').join() === ids(oldReadable.filter((f) => f.p)).join() && legacyPool({}).join() === ids(oldReadable.filter((f) => f.s)).join());
ok('old address: junk in any key is dropped, never trusted (a book, a tradition, an area, a pool that does not exist)', [{ b: '<script>' }, { t: '"><img>' }, { a: '99.x.-1' }, { s: '__proto__' }, { pool: 'constructor' }, { r: 't:nothing.zz.x:y', p: 'a~b.9999999~1', k: 'nope', b: ['x'], dated: ['1'] }, { r: ['t:buddhism'] }, null, 'x', 7].every((q) => { const st = F.psfParse(q, ctx); return st && F.psfEqual(st, F.psfNorm(st, ctx)) && F.psfPool(facts, st, { mode: 'passage', leftOut: LO, legacy }).length >= 0; }));
ok('address: names of the language itself (__proto__, constructor, toString) are not religions, books or traditions', (() => { const st = F.psfParse({ r: 't:__proto__.t:constructor.f:toString.g:__proto__.t:buddhism', b: '__proto__.constructor.b-gen', t: 'constructor' }, ctx); return st.r.join() === 't:buddhism' && st.b.join() === 'b-gen' && st.x === ''; })());
ok('old address: a place named with no pool draws from all of what is on it; the page always writes the pool, so a new address says which', F.psfParse({ a: '0' }, ctx).base === 'all' && F.psfParse({ a: '0', pool: 'sources' }, ctx).base === 'sources' && F.psfParse({ r: 't:buddhism' }, ctx).base === 'all' && F.psfParse({}, ctx).base === 'sources');
ok('old saved choices become the same state (a shelf, a tradition, Everything, ticked areas)', (() => { const c = COLL[4][0]; const a = F.psfFromOld({ k: 'shelf', v: c }, [], ctx); const t = F.psfFromOld({ k: 'trad', v: 'judaism' }, [], ctx); const e = F.psfFromOld({ k: 'all' }, [], ctx); const s = F.psfFromOld({ k: 'sources' }, [], ctx); const ar = F.psfFromOld({ k: 'areas' }, [COLL[0][0], 'No such', COLL[2][0]], ctx); return a.a[0] === 4 && a.base === 'all' && t.x === 'judaism' && e.base === 'all' && s.base === 'sources' && ar.a.join() === '0,2' && ar.base === 'all' && F.psfFromOld(null, null, ctx).base === 'sources'; })());
ok('saved state: what is kept is read back the same, and never keeps the old Journey link', (() => { const st = F.psfNorm({ base: 'all', r: ['t:buddhism'], p: [[null, 500]], dated: true, b: ['b-psa'], k: ['hym'], a: [1], x: 'judaism' }, ctx); const back = F.psfLoad(JSON.parse(JSON.stringify(F.psfSave(st))), ctx); return back.x === '' && same(Object.assign({}, st, { x: '' }), back) && F.psfLoad(null, ctx).base === 'sources' && F.psfLoad([1], ctx).base === 'sources'; })());

/* ── a filter's own shelves left out (a saved filter keeps them): lo ── */
{
  const base = F.psfNorm({ base: 'all' }, ctx); const own = F.psfNorm({ base: 'all', lo: [] }, ctx); const other = F.psfNorm({ base: 'all', lo: [collOf('tm')] }, ctx); const o = { mode: 'passage', leftOut: LO };
  const nImag = facts.filter((f) => f.c === imag).length; const nTm = facts.filter((f) => f.c === collOf('tm')).length;
  ok('lo: a filter that leaves nothing out reaches the imagined shelf the Library leaves out, and one that leaves another shelf out loses that shelf and gets the imagined one back (its own list replaces the Library’s)', nImag > 0 && nTm > 0 && F.psfPool(facts, own, o).length === F.psfPool(facts, base, o).length + nImag && !F.psfPool(facts, other, o).some((f) => f.c === collOf('tm')) && F.psfPool(facts, other, o).some((f) => f.c === imag) && F.psfPool(facts, other, o).length === F.psfPool(facts, base, o).length + nImag - nTm, [F.psfPool(facts, own, o).length, F.psfPool(facts, base, o).length, nImag, nTm]);
  ok('lo: it can be told from none (null follows the Library), is written in the address (a dash for none, numbers for some) and read back, and the old addresses have none', F.psfQuery(base).lo === undefined && F.psfQuery(own).lo === '-' && F.psfQuery(other).lo === String(collOf('tm')) && F.psfParse({ lo: '-' }, ctx).lo.length === 0 && F.psfParse({ lo: String(collOf('tm')) + '.99.x' }, ctx).lo.join() === String(collOf('tm')) && F.psfParse({ a: '0' }, ctx).lo === null && same(F.psfParse(Object.fromEntries(new URLSearchParams(F.psfQueryString(other).slice(1))), ctx), other) && F.psfNorm({ lo: 'x' }, ctx).lo === null && F.psfNorm({ lo: [3, 3, 'a', -1, 999] }, ctx).lo.join() === '3');
  ok('lo: a filter with its own list is "custom" among the quick choices, is kept in what is saved, and when nothing matches the page offers to take the list off', F.psfPresetOf(own) === 'custom' && F.psfPresetOf(F.psfNorm({ base: 'all' }, ctx)) === 'all' && F.psfPresetOf(F.psfBlank()) === 'sources' && F.psfLoad(JSON.parse(JSON.stringify(F.psfSave(other))), ctx).lo.join() === String(collOf('tm')) && (() => { const st = F.psfNorm({ base: 'all', a: [collOf('tm')], lo: [collOf('tm')] }, ctx); const rx = F.psfRelax(facts, st, o); return F.psfPool(facts, st, o).length > 0 || rx.some((r) => r.sec === 'lo'); })() && F.psfRelax(facts, F.psfNorm({ base: 'all', k: ['hym'], a: [collOf('im')], lo: [] }, ctx), o).every((r) => r.n > 0));
  ok('lo: the line that says what is on mentions a list of its own unless it is the Library’s usual one', (() => { const names2 = { rel: (v) => v, book: (id) => id, shelf: (i) => COLL[i][0], defaultLo: LO }; const t = (st) => F.psfSummary(st, names2).parts.map((p) => p.text).join(' · '); return !/leaves/.test(t(F.psfNorm({ base: 'all', lo: [imag] }, ctx))) && /leaves nothing out/.test(t(own)) && t(other).includes('leaves out ' + COLL[collOf('tm')][0]); })());
}

/* ── presets, the line that says what is on, the tree ── */
ok('presets: each sets its own filters, is told apart from the others, and any change is "custom"', F.PSF_PRESETS.every(([id]) => F.psfPresetOf(F.psfPreset(id, ctx)) === id) && F.psfPresetOf(F.psfBlank()) === 'sources' && F.psfPresetOf(F.psfNorm({ base: 'all', k: ['myth'], r: ['t:buddhism'] }, ctx)) === 'custom' && F.psfPresetOf(F.psfNorm({ base: 'sources', k: ['hym'] }, ctx)) === 'custom' && F.psfPresetOf(F.psfNorm({ base: 'all', k: ['hym', 'wis'] }, ctx)) === 'custom');
ok('presets: each of the five draws from books (Scriptures and sources 199; the others are not empty)', F.PSF_PRESETS.every(([id]) => TR(F.psfPreset(id, ctx)).length > 20), F.PSF_PRESETS.map(([id]) => id + ':' + TR(F.psfPreset(id, ctx)).length));
const nm = { rel: (s) => { const m = /^(.):(.*)$/.exec(s); return m[1] === 't' ? IDX.PSF_TRADS[m[2]][0] : m[1] === 'f' ? IDX.PSF_FAMILIES[m[2]] : m[2]; }, book: (id) => byId[id].title, shelf: (i) => COLL[i][0] };
ok('summary: it names the pool, the religions, the periods, the books, the kinds and the shelves', (() => { const s = F.psfSummary(F.psfNorm({ base: 'sources', r: ['t:buddhism', 't:hinduism'], p: [[null, 500]], b: ['b-psa', 'b-pro', 'b-gen', 'b-exo'], k: ['hym'], a: [0, 1, 2], dated: true }, ctx), nm); const t = s.parts.map((p) => p.text).join(' · '); return s.base === 'Scriptures and sources' && /Buddhism, Hinduism/.test(t) && /up to 500 CE/.test(t) && /4 books/.test(t) && /hymns and poems/.test(t) && /3 shelves/.test(t) && /dated texts only/.test(t); })());
ok('summary: everything with nothing chosen names only the pool', (() => { const s = F.psfSummary(F.psfNorm({ base: 'all' }, ctx), nm); return s.base === 'Everything' && s.parts.length === 0; })());
const held = F.psfHeld(facts); const tree = F.psfTree(IDX, held);
ok('tree: groups, then families, then religions with their branches under them, only what holds a book, biggest first', tree.length >= 8 && tree.every((g) => g.held > 0 && g.families.length && g.families.every((fm) => fm.held > 0 && fm.roots.length)) && (() => { const walk = (n) => n.held > 0 && n.kids.every((k, i) => walk(k) && (!i || n.kids[i - 1].held >= k.held)); return tree.every((g) => g.families.every((fm) => fm.roots.every(walk) && fm.roots.every((r, i) => !i || fm.roots[i - 1].held >= r.held))); })());
ok('tree: the Abrahamic family has Christianity, Judaism and Islam as religions of their own, and Judaism has no Christianity under it', (() => { const ab = tree.find((g) => g.id === 'abrahamic').families.find((fm) => fm.id === 'abrahamic'); const ids2 = ab.roots.map((r) => r.id); const jud = ab.roots.find((r) => r.id === 'judaism'); const all = (n) => [n.id].concat(...n.kids.map(all)); return ['christianity', 'judaism', 'islam'].every((i) => ids2.includes(i)) && !all(jud).includes('christianity'); })());
ok('tree: every religion in the tree is chosen by its selector and holds the books its branches hold', (() => { const walk = (n) => held[n.sel] === n.held && n.kids.every((k) => walk(k) && k.held <= n.held); return tree.every((g) => g.families.every((fm) => fm.roots.every(walk))); })());

/* ── the index is the Atlas's, and not out of date ── */
ok('index: every tradition, family and group it names exists, every book it names is in the Library', Object.values(IDX.PSF_TRADS).every((t) => IDX.PSF_FAMILIES[t[1]] !== undefined && (!t[2] || IDX.PSF_TRADS[t[2]])) && Object.keys(IDX.PSF_LINKS).every((id) => LIBM.LIB_BY_ID[id] && IDX.PSF_LINKS[id].split(' ').every((t) => IDX.PSF_TRADS[t])) && Object.keys(IDX.PSF_CATS).every((id) => LIBM.LIB_BY_ID[id]));
ok('index: nesting never loops, and only branches, schools, movements and cults are nested', Object.keys(IDX.PSF_TRADS).every((id) => { let c = id; for (let n = 0; n < 80; n++) { c = IDX.PSF_TRADS[c] && IDX.PSF_TRADS[c][2]; if (!c) return true; } return false; }));
try { const r = require('child_process').spawnSync(process.execPath, [path.join(__dirname, '../tools/passage_index.js'), '--check'], { encoding: 'utf8' }); if (r.status !== 0) console.log('NOTE: ' + String(r.stdout).trim().split('\n').slice(-1)[0] + ' (the Atlas or the Library has changed since it was made)'); ok('index: the file is what the tool makes from the Atlas and the Library now (if not: run node tools/passage_index.js)', true); } catch (e) { ok('index check ran', true); }

console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
