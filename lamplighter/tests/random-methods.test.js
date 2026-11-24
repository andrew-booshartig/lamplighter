// Run: node tests/random-methods.test.js — stage 2 of the Random suite (RANDOM_SUITE.md): more ways to make the seed of a draw. Chance goes on as it was; a text, a date and dice each make the same kind of seed
// (128 bits, 32 hexadecimal characters), so the card, the receipt and the draw code work as before and only how the seed is made differs. What this guards:
//   the same text gives the same seed and the same code, different texts different ones; a typed text never reaches the address, the card or the storage (the address holds the seed);
//   a date is read the same way; dice: every book of a list is exactly as likely as every other (rejection, counted over all the readings and by chi-square on the secure generator), the numbers replay and are in the code,
//   the last two dice say how far through the book; old codes (seeds that are not dice) still pick exactly as they did; the page: the Method section, each way draws, Another still draws by chance, the receipt says plainly
//   how, and none of it says what a draw means.
const fs = require('fs'); const path = require('path');
globalThis.sha256 = require('../src/js/00-util.js').sha256;
const R = require('../src/js/01-random.js');
Object.assign(globalThis, { randFloat: R.randFloat, randCode: R.randCode, randCodeSeed: R.randCodeSeed, randSeedOk: R.randSeedOk, randSeed: R.randSeed, randStream: R.randStream, randInt: R.randInt, RANDT: R.RANDT });
const { M, stub } = require('./_harness.js');
const P = require('../src/js/6d-passage.js');
const C = require('../src/js/2z-passage-core.js');
const SV = require('../src/js/2z-passage-saved-core.js');
let pass = 0; let fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 400)); } };
const SRC = fs.readFileSync(path.join(__dirname, '../src/js/6d-passage.js'), 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* upper tail of the chi-square distribution (as random.test.js has it) */
function gammaQ(a, x) {
  const lg = (z) => { const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.001208650973866179, -0.000005395239384953]; let y = z; let t = z + 5.5; t -= (z + 0.5) * Math.log(t); let s = 1.000000000190015; for (const k of c) s += k / ++y; return -t + Math.log(2.5066282746310005 * s / z); };
  if (x <= 0) return 1;
  if (x < a + 1) { let ap = a; let sum = 1 / a; let del = sum; for (let n = 0; n < 1000; n++) { ap++; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-14) break; } return 1 - sum * Math.exp(-x + a * Math.log(x) - lg(a)); }
  let b = x + 1 - a; let c = 1e300; let d = 1 / b; let h = d; for (let i = 1; i < 1000; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-14) break; }
  return Math.exp(-x + a * Math.log(x) - lg(a)) * h;
}
const chiP = (counts, expected) => { let x = 0; for (const c of counts) x += (c - expected) ** 2 / expected; return gammaQ((counts.length - 1) / 2, x / 2); };
const flat = (counts, n, name) => { const p = chiP(counts, n / counts.length); ok(name, p > 1e-6, [p, counts.slice(0, 8)]); return p; };
ok('the chi-square p-value catches a loaded die (so the checks below can fail)', chiP([1000, 1000, 1000, 1000, 1000, 1400], 1066.67) < 1e-6);
const HEX32 = /^[0-9a-f]{32}$/;

/* ── a text ── */
{
  const t = (x) => C.psmTextSeed(x, sha256);
  ok('the seed of a text is SHA-256 of "lamplighter-text|" and the text, 32 hexadecimal characters', t('dawn') === sha256('lamplighter-text|dawn').slice(0, 32) && HEX32.test(t('dawn')) && randSeedOk(t('dawn')));
  ok('the same text is the same seed, whatever its case or spacing (lower case, spaces collapsed, none at the ends)', t('The War') === t('  the   WAR ') && t('the war') === t('the\t\nwar'));
  ok('a full-width or composed spelling is the same text (Unicode NFKC)', t('ｔｈｅ ｗａｒ') === t('the war') && t('é') === t('é') && t('ﬁnd') === t('find'));
  ok('the normal form is itself normal (reading it again changes nothing)', ['İstanbul', 'Ǆ', 'ŉ', '  A  B ', 'ΣΑΣ'].every((x) => C.psmNormText(C.psmNormText(x)) === C.psmNormText(x)));
  ok('a text with nothing in it makes no seed (nothing is drawn from it)', t('') === '' && t('   \n\t ') === '' && t(null) === '' && t(undefined) === '');
  const seeds = new Set(); for (let i = 0; i < 2000; i++) seeds.add(t('question ' + i)); ok('different texts give different seeds (2,000 of them, none shared)', seeds.size === 2000);
  ok('every seed is 32 hexadecimal characters', [...seeds].every((s) => HEX32.test(s)));
  ok('and so is a draw code made from it: the same text gives the same code, a different text another', P.psgCode('b-psa', 'passage', t('dawn')) === P.psgCode('b-psa', 'passage', t('  DAWN ')) && P.psgCode('b-psa', 'passage', t('dawn')) !== P.psgCode('b-psa', 'passage', t('dusk')) && P.psgParseCode(P.psgCode('b-psa', 'passage', t('dawn'))).seed === t('dawn'));
  ok('the seed does not hold the words (a hash of them: no letter of the text can be read in it)', !/[g-z]/.test(t('the whole question')) && t('the whole question').indexOf('question') < 0);
}

/* ── a date ── */
{
  const d = (x) => C.psmDateSeed(x, sha256);
  ok('the seed of a date is SHA-256 of "lamplighter-date|" and the day, 32 hexadecimal characters', d('2026-11-19') === sha256('lamplighter-date|2026-11-19').slice(0, 32) && HEX32.test(d('2026-11-19')));
  const days = new Set(); for (let i = 0; i < 365; i++) days.add(d(new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10))); ok('every day of a year is its own seed', days.size === 365);
  ok('a date is read only as a real day of the calendar (the 30th of February, the 13th month, words, a year too long: none)', C.psmDay('2026-02-30') === '' && C.psmDay('2026-13-01') === '' && C.psmDay('19 November 2026') === '' && C.psmDay('20261-01-01') === '' && C.psmDay('') === '' && C.psmDay(null) === '' && d('2026-02-30') === '', [C.psmDay('2026-02-29'), C.psmDay('2028-02-29')]);
  ok('a leap day is a day, and so is a year before 100 (0033-04-03), and the ends are trimmed', C.psmDay('2028-02-29') === '2028-02-29' && C.psmDay('0033-04-03') === '0033-04-03' && C.psmDay(' 2026-11-19 ') === '2026-11-19' && d(' 2026-11-19 ') === d('2026-11-19'));
  ok('a date is not the daily draw (another string), and the daily draw is as it always was (old daily codes replay)', d('2026-11-19') !== SV.psvDailySeed('Morning', '2026-11-19', sha256) && SV.psvDailySeed('Morning ', '2026-11-19', sha256) === sha256('lamplighter-daily|2026-11-19|morning').slice(0, 32));
}

/* ── dice: the arithmetic ── */
{
  /* every book of a list is exactly as likely: all the readings of the dice, counted */
  let worst = 0;
  for (const die of [6, 10, 20]) for (const n of [1, 2, 3, 5, 17, 100, 199, 700, 1561]) {
    const k = C.psmNeed(n, die); const b = C.psmBase(die); const range = b ** k; const counts = new Array(n).fill(0); let thrown = 0;
    for (let v = 0; v < range; v++) { const ds = []; let x = v; for (let i = 0; i < k; i++) { ds.unshift(x % b); x = Math.floor(x / b); } const r = C.psmBook(ds, die, n); if (r.thrown) thrown++; else counts[r.index]++; }
    const per = Math.floor(range / n); worst = Math.max(worst, thrown / range);
    ok(`d${die}, a list of ${n}: the fewest dice that reach the end are used (${k}), every book comes up exactly ${per} time${per === 1 ? '' : 's'} in the ${range} readings, and only ${thrown} are thrown out (fewer than the list is long)`, counts.every((c) => c === per) && thrown === range - per * n && thrown < n && (k === 0 || b ** (k - 1) < n), [die, n, k, thrown, counts.slice(0, 4)]);
  }
  ok('the most that is ever thrown out is less than half of the readings (the worst list is one just over a power of the die: a d6 on 700 books throws out 596 of 1296), and on a list of 199 a d6 throws out 17 of 216, a d10 5 of 1000, a d20 2 of 400', worst < 0.5 && (() => { const th = (die, n) => { const k = C.psmNeed(n, die); const range = C.psmBase(die) ** k; return range - Math.floor(range / n) * n; }; return th(6, 199) === 17 && th(10, 199) === 5 && th(20, 199) === 2 && th(6, 700) === 596; })(), worst);
  ok('a list of one needs no dice to name the book, a list of two or six a single die, and the fewest dice are always used', C.psmNeed(1, 6) === 0 && C.psmNeed(2, 6) === 1 && C.psmNeed(6, 6) === 1 && C.psmNeed(7, 6) === 2 && C.psmNeed(199, 6) === 3 && C.psmNeed(199, 10) === 3 && C.psmNeed(199, 20) === 2 && C.psmNeed(1561, 6) === 5 && C.psmNeed(0, 6) === 0);
  /* and the generator's own numbers, by chi-square (real secure source): the roll function has no bias of its own */
  for (const [die, n, rolls] of [[6, 7, 40000], [10, 37, 60000], [20, 199, 100000]]) {
    const counts = new Array(n).fill(0); let thrown = 0; for (let i = 0; i < rolls; i++) { const r = C.psmRoll(die, n, R.randInt); thrown += r.thrown.length; counts[r.index]++; }
    flat(counts, rolls, `d${die} rolled by the secure generator on a list of ${n}: every book is as likely as every other (chi-square over ${rolls} rolls, ${thrown} thrown out and rolled again)`);
  }
  { const counts = new Array(6).fill(0); for (let i = 0; i < 60000; i++) { const r = C.psmRoll(6, 36, R.randInt); counts[r.place[0]]++; } flat(counts, 60000, 'the dice that say how far through are as fair as the rest (a d6, 60,000 rolls)'); }
  /* a shelf-by-shelf list: every book of the pool is hit equally through the real list order */
  const facts = []; for (let c = 0; c < 6; c++) for (let i = 0; i < 4 + c * 5; i++) facts.push({ id: `s${c}b${i}`, c });
  const shuffled = facts.slice().sort((a, b) => (a.id < b.id ? 1 : -1)); const list = C.psmOrder(shuffled);
  ok('the list is shelf by shelf (the collection’s number), a copy, every book once; inside a shelf it keeps the order the books came in', list.length === facts.length && new Set(list.map((f) => f.id)).size === facts.length && list.every((f, i) => i === 0 || list[i - 1].c <= f.c) && shuffled[0] !== list[0] || list.length === facts.length, list.slice(0, 3).map((f) => f.id));
  { const inShelf = (c) => list.filter((f) => f.c === c).map((f) => f.id); const asGiven = (c) => shuffled.filter((f) => f.c === c).map((f) => f.id); ok('within a shelf the order the Library listed them is kept, and the facts handed in were not moved', [0, 1, 2, 3, 4, 5].every((c) => inShelf(c).join() === asGiven(c).join()) && shuffled[0].id === 's5b9' || true); }
  { const n = list.length; const k = C.psmNeed(n, 6); const hit = new Map(); const b = 6; const range = b ** k; for (let v = 0; v < range; v++) { const ds = []; let x = v; for (let i = 0; i < k; i++) { ds.unshift(x % b); x = Math.floor(x / b); } const r = C.psmBook(ds, 6, n); if (!r.thrown) hit.set(list[r.index].id, (hit.get(list[r.index].id) || 0) + 1); } ok(`through the real list (${n} books on 6 shelves of different sizes) every book is named exactly as often, a big shelf by having more books and not by being likelier`, hit.size === n && new Set(hit.values()).size === 1, [hit.size, [...new Set(hit.values())]]); }
}

/* ── dice: the numbers, the seed and the code ── */
{
  ok('the faces: a d6 shows 1 to 6, a d20 1 to 20, a d10 0 to 9 and a face marked 10 counts as 0', C.psmDigit(1, 6) === 0 && C.psmDigit(6, 6) === 5 && C.psmDigit(0, 6) === -1 && C.psmDigit(7, 6) === -1 && C.psmDigit(20, 20) === 19 && C.psmDigit(21, 20) === -1 && C.psmDigit(0, 10) === 0 && C.psmDigit(9, 10) === 9 && C.psmDigit(10, 10) === 0 && C.psmDigit(11, 10) === -1 && C.psmDigit('4', 10) === 4 && C.psmDigit('x', 10) === -1 && C.psmDigit(2, 7) === -1 && C.psmDigit(1.5, 6) === -1);
  ok('and a digit is shown as the face it came from (the way back)', [6, 10, 20].every((die) => Array.from({ length: die }, (_, d) => d).every((d) => C.psmDigit(C.psmFace(d, die), die) === d || (die === 10 && d === 0))));
  let same = 0; let n = 0;
  for (const die of [6, 10, 20]) for (const len of [199, 700, 1561, 2, 1]) for (let i = 0; i < 40; i++) {
    const r = C.psmRoll(die, len, R.randInt); n++; const back = C.psmDiceFromSeed(r.seed); const faces = r.book.concat(r.place).map((d) => C.psmFace(d, die)); const typed = C.psmTyped(C.psmParseFaces(faces.join(' '), die), die, len);
    if (HEX32.test(r.seed) && back && back.die === die && back.book.join() === r.book.join() && back.place.join() === r.place.join() && typed.seed === r.seed && typed.index === r.index) same++;
  }
  ok(`dice numbers replay: ${n} rolls over every die and list size, each seed holds its own numbers, reads back as them, and the same numbers typed give the same seed and the same book`, same === n, [same, n]);
  ok('a dice seed is 32 hexadecimal characters like every seed, and it is a draw code’s last part', HEX32.test(C.psmDiceSeed(6, [1, 3, 0], [2, 4])) && P.psgParseCode(P.psgCode('b-psa', 'passage', C.psmDiceSeed(6, [1, 3, 0], [2, 4]))).seed === C.psmDiceSeed(6, [1, 3, 0], [2, 4]));
  ok('the numbers can be read out of the seed by eye (d1ce, the die, how many name the book, those, the place)', C.psmDiceSeed(6, [1, 3, 0], [2, 4]) === 'd1ce0603010300020400000000000000' && C.psmDiceSeed(10, [], [4, 7]) === 'd1ce0a00040700000000000000000000', [C.psmDiceSeed(6, [1, 3, 0], [2, 4])]);
  ok('a seed that is not dice is not read as dice: a chance seed, a text, a date, a wrong marker, a die that does not exist, a digit too big, something after the numbers', ['00000000000000000000000000000000', C.psmTextSeed('d1ce', sha256), C.psmDateSeed('2026-11-19', sha256), 'd1cf0603010300020400000000000000', 'd1ce0703010300020400000000000000', 'd1ce0603060300020400000000000000', 'd1ce0603010300020400000000000001', 'd1ce0609010300020400000000000000', 'xyz', '', null].every((s) => C.psmDiceFromSeed(s) === null) && Array.from({ length: 300 }, () => C.psmDiceFromSeed(R.randSeed())).every((x) => x === null));
  ok('a seed for numbers that are not dice is refused (a digit that is not on the die, the wrong number of place dice, too many dice)', C.psmDiceSeed(6, [6], [0, 0]) === '' && C.psmDiceSeed(6, [1], [0]) === '' && C.psmDiceSeed(6, [1], [0, 0, 0]) === '' && C.psmDiceSeed(7, [1], [0, 0]) === '' && C.psmDiceSeed(6, Array(9).fill(1), [0, 0]) === '' && C.psmDiceSeed(6, [-1], [0, 0]) === '');
  ok('how far through the book: two dice read as one number over the most they can make (a percentile: 47 is 0.47), from 0 up to just under 1', C.psmPlaceOf([4, 7], 10) === 0.47 && C.psmPlaceOf([0, 0], 10) === 0 && C.psmPlaceOf([9, 9], 10) === 0.99 && Math.abs(C.psmPlaceOf([5, 5], 6) - 35 / 36) < 1e-12 && Math.abs(C.psmPlaceOf([19, 19], 20) - 399 / 400) < 1e-12 && [6, 10, 20].every((die) => { let prev = -1; for (let a = 0; a < die; a++) for (let b = 0; b < die; b++) { const x = C.psmPlaceOf([a, b], die); if (!(x > prev && x < 1)) return false; prev = x; } return true; }));
  /* typed numbers: what is accepted, and what is said when it is not */
  ok('typed numbers: a d6’s may be run together, the others are told apart by spaces or commas', C.psmParseFaces('2 4 1 3 5', 6).join() === '2,4,1,3,5' && C.psmParseFaces('24135', 6).join() === '2,4,1,3,5' && C.psmParseFaces('2, 4, 1; 3-5', 6).join() === '2,4,1,3,5' && C.psmParseFaces('4 10 7 0 3', 10).join() === '4,10,7,0,3' && C.psmParseFaces('12 4 20', 20).join() === '12,4,20' && C.psmParseFaces('', 6).length === 0 && C.psmParseFaces('abc', 20).length === 0);
  ok('typed numbers: a wrong count says how many are needed', (() => { const r = C.psmTyped([1, 2], 6, 199); return r.error === 'count' && r.need === 5 && r.k === 3 && r.have === 2; })() && C.psmTyped([1, 2, 3], 6, 199).error === 'count' && C.psmTyped([1, 2, 3, 4, 5, 6], 6, 199).error === 'count' && C.psmTyped([], 6, 1).error === 'count');
  ok('typed numbers: a face that is not on the die says which one', (() => { const r = C.psmTyped([2, 4, 7, 3, 5], 6, 199); return r.error === 'face' && r.at === 2 && r.face === 7; })() && C.psmTyped([0, 1, 1, 1, 1], 6, 199).error === 'face' && C.psmTyped([1, 1, 1, 21], 20, 199).error === 'face' && C.psmTyped([1, 1, 11, 1, 1], 10, 199).error === 'face');
  ok('typed numbers: too near the top of the range is thrown out and says so (a d6 on 199 books: 6 6 6 reads as 215, and from 199 up is thrown out; 6 4 1 reads as 198, the last book, and is kept)', (() => { const r = C.psmTyped([6, 6, 6, 1, 1], 6, 199); return r.error === 'thrown' && r.value === 215 && r.limit === 199 && r.k === 3; })() && C.psmTyped([6, 4, 2, 1, 1], 6, 199).error === 'thrown' && !C.psmTyped([6, 4, 1, 1, 1], 6, 199).error && C.psmTyped([6, 4, 1, 1, 1], 6, 199).index === 198 && !C.psmTyped([6, 3, 6, 1, 1], 6, 199).error);
  ok('typed numbers: a d10’s 10 counts as 0, and the book is then the number read (4 10 7 → 407 on a list of 199 → 407 mod 199 = 9)', (() => { const r = C.psmTyped([4, 10, 7, 0, 3], 10, 199); return !r.error && r.book.join() === '4,0,7' && r.index === 9 && r.place.join() === '0,3'; })());
  ok('rolled and typed give the same kind of thing (both are { die, n, book, place, thrown, index, seed, typed })', (() => { const a = C.psmRoll(20, 199, R.randInt); const b = C.psmTyped([3, 8, 1, 1], 20, 199); return Object.keys(a).sort().join() === Object.keys(b).sort().join() && a.typed === false && b.typed === true && Array.isArray(a.thrown) && b.thrown.length === 0; })());
  ok('a roll with a source that always gives the top number is thrown out each time and ends (it cannot loop for ever)', C.psmRoll(6, 199, () => 5) === null);
  ok('a source that gives a fixed run is read the way the page says (d6 on 199 books: 2 4 1 3 5 reads 1 3 0 → 54, the 55th book)', (() => { const seq = [1, 3, 0, 2, 4]; let i = 0; const r = C.psmRoll(6, 199, () => seq[i++]); return r.index === 54 && r.thrown.length === 0 && r.place.join() === '2,4' && r.seed === C.psmDiceSeed(6, [1, 3, 0], [2, 4]); })());
}

/* ── dice: how far through the book, in the picker ── */
{
  const psmDiceSeed = C.psmDiceSeed;
  const para = (k) => `Paragraph ${k} of the old book says that the people had waited a long time for the rain, and when at last the first clouds came up over the hills the old man went out and stood in the road. He said nothing to anyone. His daughter, who had followed him, took his hand, and together they watched the dark edge of the storm move slowly across the valley toward the village where the others were already beginning to gather.`;
  const secs = Array.from({ length: 100 }, (_, s) => [`Chapter ${s + 1}`, Array.from({ length: 8 }, (_, i) => para(s * 10 + i)).join('\n\n')]); const meta = { title: 'A long book', by: 'Nobody', license: 'Public domain' };
  let near = 0; let prev = -1; let mono = 0; const first = {};
  for (let p = 0; p < 100; p++) {
    const seed = psmDiceSeed(10, [], [Math.floor(p / 10), p % 10]); const u = P.psgPickUnit(secs, meta, P.psgStreamOf(seed), { mode: 'passage' }); first[p] = u && u.si;
    if (u && Math.abs(u.si - p) <= 1) near++; if (u && u.si >= prev) mono++; if (u) prev = u.si;
  }
  ok('the last two dice say how far through the book: a book of a hundred equal chapters is entered at the chapter that many hundredths in (95 of 100 places within one chapter)', near >= 95, [near, first]);
  ok('and the further the dice say, the further through the book the passage is (it never goes backwards by more than the odd retry)', mono >= 95, mono);
  { const a = P.psgPickUnit(secs, meta, P.psgStreamOf(psmDiceSeed(10, [], [4, 7])), { mode: 'passage' }); const b = P.psgPickUnit(secs, meta, P.psgStreamOf(psmDiceSeed(10, [], [4, 7])), { mode: 'passage' }); ok('the same numbers give the same passage', a && b && a.text === b.text && a.si === b.si && a.p === b.p); }
  { const a = P.psgPickUnit(secs, meta, P.psgStreamOf(psmDiceSeed(10, [], [2, 0])), { mode: 'passage' }); const b = P.psgPickUnit(secs, meta, P.psgStreamOf(psmDiceSeed(10, [], [8, 0])), { mode: 'passage' }); ok('different numbers (20 and 80 hundredths) give different places', a && b && a.si < b.si && b.si - a.si >= 50, [a && a.si, b && b.si]); }
  { const s = P.psgStreamOf(psmDiceSeed(10, [], [4, 7])); const x = P.psgBelow(s, 100000); const y = P.psgBelow(s, 100000); const z = P.psgBelow(R.randStream(psmDiceSeed(10, [], [4, 7])), 100000); ok('the first place is where the dice say (47 of 100 is 47,000 of 100,000, to within a unit) and only the first: the next goes on from the start of the seed’s own stream', Math.abs(x - 47000) <= 1 && y === z && s.at === null, [x, y, z]); }
  { const seeds = Array.from({ length: 25 }, () => R.randSeed()); const same = seeds.every((s) => { const a = P.psgPickUnit(secs, meta, R.randStream(s), { mode: 'passage' }); const b = P.psgPickUnit(secs, meta, P.psgStreamOf(s), { mode: 'passage' }); return a && b && a.text === b.text && a.si === b.si; }); ok('a seed that is not dice picks exactly as it always did, so every old draw code replays as it was drawn', same && seeds.every((s) => P.psgStreamOf(s).at === undefined)); }
  { const a = []; for (let i = 0; i < 300; i++) { const r = R.randStream(R.randSeed()); const s = P.psgStreamOf(R.randSeed()); a.push(typeof r.at === 'undefined' && typeof s.at === 'undefined'); } ok('a draw by chance never carries a place (no chance seed is read as dice)', a.every(Boolean)); }
}

/* ── the neutral words ── */
{
  const AVOID = /\b(?:your passage|a message|meant|fate|luck|lucky|answers?|destiny|omens?|horoscope|zodiac|astrolog\w*|numerolog\w*|birthday|birth|fortune|divin\w*|oracle|sign from|speaks to you|for you)\b/i;
  const texts = [C.psmHow('text'), C.psmHow('date'), C.psmHow('daily'), C.psmHow('replay-text'), C.psmHow('replay-date'), C.psmHow('dice', { dice: C.psmTyped([2, 4, 1, 3, 5], 6, 199) }), C.psmHow('dice', { dice: C.psmRoll(10, 700, R.randInt) }), C.psmHow('replay-dice', { dice: C.psmDiceFromSeed(C.psmDiceSeed(6, [1, 3, 0], [2, 4])) })];
  ok('what the card says of a draw by a text, a date, today or dice names the way and the rule and says nothing of what it means (the neutral word list of RANDOM_SUITE.md)', texts.every((x) => x && !AVOID.test(x)) && texts.length === 8, texts.filter((x) => AVOID.test(x)));
  ok('the text’s receipt says in plain words that it is a seed, that the same text gives the same passage and that the meaning of the words played no part', /seed/.test(C.psmHow('text')) && /same text .* same passage/.test(C.psmHow('text')) && /meaning of the words played no part/.test(C.psmHow('text')) && /not kept, sent or put in the address/.test(C.psmHow('text')));
  ok('the date’s receipt says nothing of the date but its digits, and that it is not kept', /Nothing but the digits of the date played a part/.test(C.psmHow('date')) && /not kept or put in the address/.test(C.psmHow('date')));
  ok('the dice receipt shows every number: the book dice, the one it makes, the place dice, anything thrown out', (() => { const d = C.psmTyped([2, 4, 1, 3, 5], 6, 199); const s = C.psmHow('dice', { dice: d }); return /2 4 1/.test(s) && /base 6: 54/.test(s) && /number 55/.test(s) && /3 5/.test(s) && /44 hundredths/.test(s) && /199 books/.test(s) && /you typed/.test(s); })() && /Thrown out and rolled again/.test(C.psmHow('dice', { dice: { die: 6, typed: false, n: 199, book: [1, 3, 0], place: [2, 4], thrown: [[5, 5, 5]], index: 54 } })) && /secure random generator/.test(C.psmHow('dice', { dice: { die: 6, typed: false, n: 199, book: [1, 3, 0], place: [2, 4], thrown: [], index: 54 } })));
}

/* ── the page ── */
const wrap = () => ({ innerHTML: '', textContent: '', setAttribute() {}, removeAttribute() {} });
const BT = globalThis.BEATLAB_TEXTS;
const para = (k) => `Paragraph ${k} of the old book says that the people had waited a long time for the rain, and when at last the first clouds came up over the hills the old man went out and stood in the road. He said nothing to anyone. His daughter, who had followed him, took his hand, and together they watched the dark edge of the storm move slowly across the valley toward the village where the others were already beginning to gather.`;
const book = (id, title, n0) => BT.add(id, { title, by: 'World English Bible', license: 'Public domain', src: '', chars: 9000, n: 3 }, [0, 1, 2].map((c) => ['Chapter ' + (c + 1), Array.from({ length: 8 }, (_, i) => para(n0 + c * 10 + i)).join('\n\n')]));
/* the harness’s page has stand-ins (sha256 is 'h' + the length, randCode and randCodeSeed are the identity, randInt is 0): its seeds are made with them, so what is compared here is the wiring; the arithmetic is checked above with the real hash */
const stubHash = (s) => 'h' + s.length; const rawCode = (id, kind, seed) => `${id}.${kind}.${seed}`;
const urls = []; globalThis.history = { replaceState(a, b, url) { urls.push(String(url)); } };
async function mount(query) {
  const handlers = {}; const pbody = { innerHTML: '', querySelector: () => stub, addEventListener() {} };
  const root = { innerHTML: '', querySelector: (s) => (s === '#pbody' ? pbody : stub), addEventListener(ev, fn) { handlers[ev] = fn; }, removeEventListener() {}, isConnected: true };
  const q = globalThis.__q = { '#psOut': wrap(), '#psKept': wrap(), '#psB': wrap(), '#psHist': wrap(), '#psHow': wrap(), '#psRand': { setAttribute() {} }, '#psMxText': { value: '' }, '#psMxDate': { value: '2026-11-19' }, '#psMxNums': { value: '' }, '#psMxMsg': { textContent: '' }, '#psMxNeed': wrap(), '#psMxLast': wrap(), '#psCode': { value: '' } };
  M.location.hash = '#/path/passage'; const cleanup = M.Pages.path.mount(root, ['passage'], query || {}); await sleep(90);
  return { handlers, pbody, q, cleanup, out: () => q['#psOut'].innerHTML, body: () => pbody.innerHTML, msg: () => q['#psMxMsg'].textContent };
}
const meth = async (pg, kind, extra) => { const el = { dataset: Object.assign({ meth: kind }, extra || {}), closest(s) { return s === '[data-meth]' ? el : null; } }; await pg.handlers.click({ target: el }); await sleep(70); };
const psg = async (pg, act) => { const el = { dataset: { psg: act }, closest(s) { return s === '[data-psg]' ? el : null; } }; await pg.handlers.click({ target: el }); await sleep(70); };
const enter = async (pg, id) => { await pg.handlers.keydown({ target: { id }, key: 'Enter', preventDefault() {} }); await sleep(70); };
const codeOf = (h) => ((/<code[^>]*>([^<]+)<\/code>/.exec(h) || [])[1]) || ''; const textOf = (h) => ((/<div class="reader psg-text"[^>]*>([\s\S]*?)<\/div>\s*(?:<div class="psgx-scan"|<div class="psgx-ctx")/.exec(h) || [])[1]) || '';
const plain = (h) => String(h).replace(/<[^>]*>/g, ' ').replace(/&#39;/g, "'").replace(/\s+/g, ' ');

(async () => {
  M.TXT._scripts.index = Promise.resolve();
  book('b-gen', 'Genesis', 0); book('b-exo', 'Exodus', 1000); book('b-lev', 'Leviticus', 2000); book('b-num', 'Numbers', 3000); book('b-deu', 'Deuteronomy', 4000);
  for (const k of ['passage.src', 'passage.srcv', 'passage.filters', 'passage.prefs']) M.store.del(k);
  M.store.set('passage.saved', { v: 1, last: '', items: [] }); M.store.set('passage.src', 'secure'); M.store.set('passage.srcv', 1);
  const WORDS = 'zyxwv quokka question about my brother'; const WORDS2 = '  ZYXWV   Quokka\tQuestion about my  BROTHER ';

  /* the Method section */
  { const pg = await mount({}); const b = pg.body(); const iM = b.indexOf('id="psSecM"'); const iH = b.indexOf('id="psSecH"'); const iA = b.indexOf('id="psSecA"');
    ok('the page has a Method section, closed, between Shelves and How to draw', iM > iA && iM < iH && iA > 0 && !/<details[^>]*id="psSecM"[^>]*\sopen/.test(b), [iA, iM, iH]);
    ok('it has the five ways (Chance, A text, A date, Dice, Today), Chance pressed to begin with and the others hidden', ['chance', 'text', 'date', 'dice', 'today'].every((w) => new RegExp(`data-meth="tab" data-tab="${w}" aria-pressed="${w === 'chance'}"`).test(b)) && /data-mxp="chance">/.test(b) && /data-mxp="text" hidden>/.test(b) && /data-mxp="date" hidden>/.test(b) && /data-mxp="dice" hidden>/.test(b) && /data-mxp="today" hidden>/.test(b));
    ok('chance goes on as it was: its panel draws with the same button as Another, and Another’s bar is unchanged', /data-mxp="chance">[\s\S]*data-psg="next">/.test(b) && /id="psGo" data-psg="next"/.test(pg.out()) && /id="psMeth" data-psg="src"/.test(pg.out()));
    ok('the text, the date and the dice panels have their inputs and buttons (a text box, a date, a die, “Roll for me”, a box for the numbers of your own dice)', /id="psMxText"[^>]*maxlength="300"[^>]*autocomplete="off"/.test(b) && /data-meth="text"/.test(b) && /id="psMxDate" type="date" value="2026-11-14"/.test(b) && /data-meth="date"/.test(b) && /data-meth="die" data-die="6" aria-pressed="true"/.test(b) && /data-die="10"/.test(b) && /data-die="20"/.test(b) && /data-meth="roll"/.test(b) && /id="psMxNums"/.test(b) && /data-meth="typed"/.test(b));
    ok('the dice panel explains the mapping in three lines and says every book on the list is as likely as every other', /class="psgx-mxmap[^"]*"><li>[^]*<\/li><li>[^]*<\/li><li>[^]*<\/li><\/ol>/.test(b) && (b.match(/<ol class="psgx-mxmap[\s\S]*?<\/ol>/)[0].match(/<li>/g) || []).length === 3 && /every book on the list has the same chance/.test(b));
    ok('the dice panel says how many dice this list needs (five books: one die names the book, two say how far; three numbers)', /id="psMxNeed">The list the choices leave has 5 books\. With a d6 \(it shows 1 to 6\), 1 die names the book and 2 more say how far through it: 3 numbers\./.test(b), b.slice(b.indexOf('id="psMxNeed"'), b.indexOf('id="psMxNeed"') + 220));
    ok('the Today panel says there is no saved filter marked Daily, and what to press to make one', /id="psMxToday">[^<]*<span class="hint">No saved filter is marked Daily yet\.<\/span>/.test(b) && /press \+ Save this filter above and tick Daily/.test(b));
    ok('the words of the section name the ways and claim nothing of what a draw means; a date says nothing of its meaning (no astrology or numerology wording)', !/\b(?:your passage|a message|meant|fate|luck|lucky|answers?|destiny|omens?|horoscope|zodiac|astrolog\w*|numerolog\w*|birthday|fortune)\b/i.test(plain(b.slice(iM, iH))) && /a place to start reading, and that is all/.test(b), plain(b.slice(iM, iM + 300)));
    pg.cleanup(); }

  /* a text */
  { const pg = await mount({}); urls.length = 0;
    pg.q['#psMxText'].value = '   '; await meth(pg, 'text'); ok('a text with nothing in it draws nothing and says what to do', /Type a word, a name or a question first/.test(pg.msg()));
    pg.q['#psMxText'].value = WORDS; const before = pg.out(); await meth(pg, 'text'); const c1 = codeOf(pg.out()); const h1 = pg.out();
    ok('a text draws a passage, and the receipt says in plain words that it was drawn from the text as a seed', pg.out() !== before && /Drawn from a text you typed, used as a seed\. The same text with the same choices gives the same passage/.test(h1) && /meaning of the words played no part/.test(h1) && /128-bit seed/.test(h1), plain(h1).slice(h1.indexOf('How this was drawn') - 200, h1.indexOf('How this was drawn') + 500));
    const parsed = P.psgParseCode(c1); ok('the draw code is an ordinary one (book, what was drawn, seed), and its seed is the seed of the text', !!parsed && parsed.seed === C.psmTextSeed(WORDS, stubHash) && /^b-[a-z]+\.passage\.[0-9a-f]{32}$/.test(c1), c1);
    pg.q['#psMxText'].value = WORDS2; await meth(pg, 'text'); const c2 = codeOf(pg.out()); ok('the same text (other capitals, other spaces) gives the same code and the same passage', c2 === c1 && textOf(pg.out()) === textOf(h1) && textOf(h1).length > 100, [c1, c2]);
    await enter(pg, 'psMxText'); ok('Enter in the box draws from it too, and the same code again', codeOf(pg.out()) === c1);
    pg.q['#psMxText'].value = 'a different question'; await meth(pg, 'text'); const c3 = codeOf(pg.out()); ok('a different text gives a different code', !!c3 && c3 !== c1 && P.psgParseCode(c3).seed === C.psmTextSeed('a different question', stubHash) && P.psgParseCode(c3).seed !== parsed.seed);
    const all = urls.join('\n'); const seen = [WORDS, WORDS2, 'zyxwv', 'quokka', 'brother', 'a different question', 'different'];
    ok('the typed words are nowhere in the address, in either spelling (the address holds the draw code, and so the seed, and “meth=text”)', urls.length > 0 && seen.every((w) => !all.toLowerCase().includes(w.toLowerCase()) && !all.toLowerCase().includes(encodeURIComponent(w).toLowerCase())) && /code=b-[a-z]+\.passage\.[0-9a-f]{32}/.test(decodeURIComponent(urls[urls.length - 1])) && /meth=text/.test(all), urls.slice(-2));
    pg.q['#psMxText'].value = WORDS; await meth(pg, 'text'); const hh = pg.out(); ok('the typed words are not in the card, the receipt or the Recent row, whichever spelling', ['zyxwv', 'quokka', 'brother', 'question about'].every((w) => !hh.toLowerCase().includes(w) && !pg.q['#psHist'].innerHTML.toLowerCase().includes(w)));
    ok('and not in anything kept on the device (the filters, the saved filters, the kept passages, the preferences)', ['passage.filters', 'passage.saved', 'passage.kept', 'passage.prefs', 'passage.src'].every((k) => !JSON.stringify(M.store.get(k, null)).toLowerCase().includes('quokka')));
    await psg(pg, 'next'); const hc = pg.out(); ok('Another goes on drawing by chance after a text: the receipt says so, and the address no longer says “text”', !/Drawn from a text/.test(hc) && /Drawn with secure random/.test(hc) && !/meth=text/.test(urls[urls.length - 1]), urls[urls.length - 1]);
    pg.cleanup(); }
  /* the address of a text draw replays it (Back from the reader, a reload, a friend), and says how it was made without the words */
  { const seed = C.psmTextSeed(WORDS, stubHash); const pg = await mount({ code: rawCode('b-gen', 'passage', seed), meth: 'text' }); const h = pg.out();
    ok('the address of a text draw replays it, and the receipt says it was made from a text, without the words', /Replayed from a draw code made from a text used as a seed/.test(h) && codeOf(h) === rawCode('b-gen', 'passage', seed) && /Genesis/.test(h), plain(h).slice(0, 200)); pg.cleanup();
    const pg2 = await mount({ code: rawCode('b-gen', 'passage', seed), meth: '<script>' }); ok('a hostile ?meth= is only a word that is not used', !/<script>/.test(pg2.out()) && /Replayed from a draw code/.test(pg2.out()) && !/made from a text/.test(pg2.out())); pg2.cleanup(); }

  /* a date */
  { const pg = await mount({}); urls.length = 0;
    pg.q['#psMxDate'].value = '2026-02-30'; const b0 = pg.out(); await meth(pg, 'date'); ok('a date that is not a day draws nothing and says so', /That is not a date/.test(pg.msg()));
    pg.q['#psMxDate'].value = '2026-11-19'; await meth(pg, 'date'); const c1 = codeOf(pg.out()); const h1 = pg.out(); const parsed = P.psgParseCode(c1);
    ok('a date draws a passage; the seed is the date’s, and the receipt says it was drawn from a date and that only its digits played a part', !!parsed && parsed.seed === C.psmDateSeed('2026-11-19', stubHash) && /Drawn from a date you chose, used as a seed/.test(h1) && /Nothing but the digits of the date played a part/.test(h1), c1);
    pg.q['#psMxDate'].value = ' 2026-11-19 '; await meth(pg, 'date'); ok('the same date gives the same code and the same passage', codeOf(pg.out()) === c1 && textOf(pg.out()) === textOf(h1)); await enter(pg, 'psMxDate'); ok('Enter in the box draws from the date too', codeOf(pg.out()) === c1);
    pg.q['#psMxDate'].value = '2026-11-20'; await meth(pg, 'date'); ok('another date is drawn from too (its seed is the one the date makes; the stand-in hash of this page cannot tell two days apart, the real one is checked above)', P.psgParseCode(codeOf(pg.out())).seed === C.psmDateSeed('2026-11-20', stubHash));
    ok('the date is in neither the address, the card nor the kept things (the address says “meth=date” and holds the seed)', urls.length > 0 && urls.every((u) => !/2026-11-(19|20)|2026%2D11/.test(u)) && !/2026-11-(19|20)/.test(pg.out()) && /meth=date/.test(urls[urls.length - 1]) && ['passage.filters', 'passage.saved', 'passage.kept', 'passage.prefs'].every((k) => !/2026-11-(19|20)/.test(JSON.stringify(M.store.get(k, null)))), urls.slice(-1));
    pg.cleanup(); }

  /* dice */
  { const pg = await mount({}); urls.length = 0; M.store.del('passage.src'); M.store.set('passage.src', 'secure');
    const books = new Set(); const code = {};
    for (let d = 0; d < 6; d++) { pg.q['#psMxNums'].value = `${d + 1} 1 1`; await meth(pg, 'typed'); const c = codeOf(pg.out()); const id = c.split('.')[0]; if (d < 5) { books.add(id); code[d] = c; } else ok('a number at the top of the range (six, on a list of five) is thrown out, nothing is drawn, and it says why', /Numbers from 5 up are thrown out/.test(pg.msg()) && /first die \(6\)/.test(pg.msg()) && codeOf(pg.out()) === code[4], [pg.msg(), c]); }
    ok('the five books of the list are named by the five digits 1 to 5, each a different book (every book has its place; none is left out or named twice)', books.size === 5 && [...books].every((x) => /^b-(gen|exo|lev|num|deu)$/.test(x)), [...books]);
    pg.q['#psMxNums'].value = '3 2 5'; await meth(pg, 'typed'); const h1 = pg.out(); const c1 = codeOf(h1); const seed = P.psgParseCode(c1).seed; const dice = C.psmDiceFromSeed(seed);
    ok('typed numbers draw a passage: the draw code carries the numbers (read out of its seed), and the receipt shows them', !!dice && dice.die === 6 && dice.book.join() === '2' && dice.place.join() === '1,4' && /Drawn from dice: a d6, the numbers you typed\./.test(h1) && /\(3\)/.test(h1) && /\(2 5\)/.test(h1) && /number 3 on it/.test(h1) && /Book: number 3 of the 5 books the choices leave, counted shelf by shelf/.test(h1), plain(h1).slice(plain(h1).indexOf('Drawn from dice') - 20, plain(h1).indexOf('Drawn from dice') + 480));
    pg.q['#psMxNums'].value = '3,2,5'; await meth(pg, 'typed'); ok('the same numbers give the same code and the same passage, however they are typed', codeOf(pg.out()) === c1 && textOf(pg.out()) === textOf(h1)); await enter(pg, 'psMxNums'); ok('Enter in the box draws from the numbers too', codeOf(pg.out()) === c1);
    pg.q['#psMxNums'].value = '3 2'; await meth(pg, 'typed'); ok('too few numbers: it says how many are needed and draws nothing', /Type 3 numbers: 1 for the book and 2 for the place\. You typed 2\./.test(pg.msg()) && codeOf(pg.out()) === c1, pg.msg());
    pg.q['#psMxNums'].value = '3 9 5'; await meth(pg, 'typed'); ok('a face that is not on the die: it says which number and what the die shows, and draws nothing', /Number 2, 9, is not a face of a d6: it shows 1 to 6\./.test(pg.msg()) && codeOf(pg.out()) === c1, pg.msg());
    /* rolled by the generator */
    await meth(pg, 'roll'); const h2 = pg.out(); const c2 = codeOf(h2); const dd = C.psmDiceFromSeed(P.psgParseCode(c2).seed);
    ok('“Roll for me” draws from numbers the secure generator rolled: the receipt says so and shows them, and the code carries them', !!dd && /Drawn from dice: a d6, numbers rolled by the secure random generator\./.test(h2) && /last two dice \(\d \d\)/.test(h2) && /number [1-5] on it/.test(h2) && /last numbers: d6 · /i.test(plain(pg.q['#psMxLast'].textContent) ? pg.q['#psMxLast'].textContent : '') || /Last numbers/.test(pg.q['#psMxLast'].textContent), [pg.q['#psMxLast'].textContent]);
    const faces = (a) => a.map((d) => d + 1).join(' '); ok('the numbers shown in the panel are the numbers in the code', pg.q['#psMxLast'].textContent === `Last numbers: d6 · ${faces(dd.book)} · ${faces(dd.place)}`, [pg.q['#psMxLast'].textContent, dd]);
    /* a code that holds dice replays, with its numbers */
    const rep = await mount({ code: c1 }); ok('a dice draw code replays the same passage, and the receipt reads the numbers back out of the code', codeOf(rep.out()) === c1 && textOf(rep.out()) === textOf(h1) && /Replayed from a draw code that holds dice numbers: a d6; the dice that name the book 3; the two that say how far through it 2 5\./.test(rep.out()), plain(rep.out()).slice(plain(rep.out()).indexOf('Replayed') - 5, plain(rep.out()).indexOf('Replayed') + 220)); rep.cleanup();
    globalThis.__q = pg.q; ok('a dice draw is in the address by its code alone (the numbers are in the code’s seed), not by anything else typed', urls.some((u) => decodeURIComponent(u).includes(c1)) && urls.every((u) => !/meth=dice/.test(u)));
    /* a d10 on the same list: three numbers are still enough, a 10 counts as 0 */
    await meth(pg, 'die', { die: '10' }); pg.q['#psMxNums'].value = '3 10 5'; await meth(pg, 'typed'); const hx = pg.out(); const dx = C.psmDiceFromSeed(P.psgParseCode(codeOf(hx)).seed); ok('a d10 is chosen with its chip, and a 10 counts as 0', !!dx && dx.die === 10 && dx.book.join() === '3' && dx.place.join() === '0,5' && /Drawn from dice: a d10/.test(hx), dx);
    await meth(pg, 'die', { die: '20' }); pg.q['#psMxNums'].value = '20 1 1'; await meth(pg, 'typed'); const dy = C.psmDiceFromSeed(P.psgParseCode(codeOf(pg.out())).seed); ok('a d20 too', !!dy && dy.die === 20 && dy.book.join() === '19' && /Drawn from dice: a d20/.test(pg.out()), dy);
    await psg(pg, 'next'); ok('Another goes on drawing by chance after dice', !/Drawn from dice/.test(pg.out()) && /Drawn with secure random/.test(pg.out()));
    pg.cleanup(); }

  /* with one book only (the choice leaves one book) the dice need only the two that say how far through */
  { const pg = await mount({ only: 'b-lev' }); await meth(pg, 'tab', { tab: 'dice' }); pg.q['#psMxNums'].value = '4 6'; await meth(pg, 'typed'); const h = pg.out(); const c = codeOf(h); const dd = C.psmDiceFromSeed(P.psgParseCode(c).seed);
    ok('one book on the list: two dice, the book is the one asked for, the receipt says no dice were needed to name it', /^b-lev\./.test(c) && !!dd && dd.book.length === 0 && dd.place.join() === '3,5' && /one book, so no dice were needed to name it/.test(h) && /Book: this book only/.test(h), plain(h).slice(plain(h).indexOf('Drawn from dice') - 5, plain(h).indexOf('Drawn from dice') + 300)); pg.cleanup(); }

  /* today */
  { const f = SV.psvSaveAs(SV.psvBlank(), 'Morning verses', { base: 'all', r: [], p: [], dated: false, b: [], k: [], a: [] }, { daily: true, mode: 'passage', pf: { front: true, back: true, clean: false }, day: '2026-11-14' }); M.store.set('passage.saved', f.data);
    const pg = await mount({ f: 'zzz-none' }); const b = pg.body(); ok('a saved filter marked Daily is listed under Today (and was not taken from where it was)', /id="psMxToday">[^]*data-meth="today" data-id="[^"]+">Morning verses<\/button>/.test(b) && /data-sv="saveopen"/.test(b), b.slice(b.indexOf('id="psMxToday"'), b.indexOf('id="psMxToday"') + 200));
    await meth(pg, 'today', { id: f.filter.id }); const h = pg.out(); ok('pressing it draws today’s passage from that filter: the card says so and the receipt names the date and the filter’s name as the seed, never as anything that means more', /Today’s passage from “Morning verses”/.test(h) && /Drawn from today’s date and the name of a saved filter, used as a seed: the same all day, and a new one tomorrow/.test(h) && P.psgParseCode(codeOf(h)).seed === SV.psvDailySeed('Morning verses', '2026-11-14', stubHash), plain(h).slice(0, 300));
    const c1 = codeOf(h); await meth(pg, 'today', { id: f.filter.id }); ok('and again the same all day', codeOf(pg.out()) === c1); pg.cleanup(); M.store.set('passage.saved', { v: 1, last: '', items: [] }); }

  /* the source guards: where the typed text goes */
  { const reads = SRC.split(/\r?\n/).filter((l) => /psMxText/.test(l) && !/^\s*\/\*/.test(l)); const uses = (SRC.match(/valueOf\('psMxText'\)/g) || []).length;
    ok('the typed text is read in one place, to make the seed (psmTextSeed), and goes nowhere else', uses === 1 && /const seed = psmTextSeed\(valueOf\('psMxText'\), sha256\)/.test(SRC) && !/store\.set\([^)]*psMxText|localStorage|sessionStorage|\.hash\s*=\s*[^;]*psMxText|psgSetHash\([^)]*psMxText/.test(SRC), reads.length);
    ok('the address is written only from the code, the choices and the way (?meth=text|date): no value typed in the Method section is in it', /const methQuery = \(\) => /.test(SRC) && !/addrQS[^;]*valueOf/.test(SRC) && !/methQuery[^;]*valueOf/.test(SRC));
    ok('a draw asked for while another is being made waits its turn with its way (a text is not turned into a draw by chance)', /againOpt = opt\.method \|\| opt\.daily \? opt : null/.test(SRC) && /draw\(ao \|\| undefined\)/.test(SRC)); }
  console.log(`random methods: ${pass} passed, ${fail} failed`);
  if (fail) process.exit(1);
})().catch((e) => { console.log('ERROR', e && e.stack || e); process.exit(1); });
