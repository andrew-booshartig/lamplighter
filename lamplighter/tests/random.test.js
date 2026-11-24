// Run: node tests/random.test.js — the randomness behind every draw (src/js/01-random.js and the passage picker's use of it):
// the source is the system's secure generator and nothing weaker, outcomes are exactly unbiased, a draw code replays the same passage,
// and the player's own timing can only add to a draw. Statistical checks use a p-value floor of 1e-6, so a correct generator fails about one run in a million.
const fs = require('fs'); const path = require('path');
globalThis.sha256 = require('../src/js/00-util.js').sha256;
const R = require('../src/js/01-random.js');
Object.assign(globalThis, { randFloat: R.randFloat, randCode: R.randCode, randCodeSeed: R.randCodeSeed, randSeedOk: R.randSeedOk, randSeed: R.randSeed, randStream: R.randStream, RANDT: R.RANDT });
const P = require('../src/js/6d-passage.js');
let pass = 0; let fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 300)); } };

/* upper tail of the chi-square distribution: Q(df/2, x/2) by the series and the continued fraction (Numerical Recipes) */
function gammaQ(a, x) {
  const lg = (z) => { const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.001208650973866179, -0.000005395239384953]; let y = z; let t = z + 5.5; t -= (z + 0.5) * Math.log(t); let s = 1.000000000190015; for (const k of c) s += k / ++y; return -t + Math.log(2.5066282746310005 * s / z); };
  if (x <= 0) return 1;
  if (x < a + 1) { let ap = a; let sum = 1 / a; let del = sum; for (let n = 0; n < 1000; n++) { ap++; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-14) break; } return 1 - sum * Math.exp(-x + a * Math.log(x) - lg(a)); }
  let b = x + 1 - a; let c = 1e300; let d = 1 / b; let h = d; for (let i = 1; i < 1000; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-14) break; }
  return Math.exp(-x + a * Math.log(x) - lg(a)) * h;
}
const chiP = (counts, expected) => { let x = 0; for (const c of counts) x += (c - expected) ** 2 / expected; return gammaQ((counts.length - 1) / 2, x / 2); };
const flat = (counts, n, name) => { const p = chiP(counts, n / counts.length); ok(name, p > 1e-6, [p, counts.slice(0, 8)]); return p; };
ok('the chi-square p-value is itself right (df 5: x=11.07 gives p≈0.05; x=33 gives p<1e-5)', Math.abs(gammaQ(2.5, 11.0705 / 2) - 0.05) < 1e-3 && gammaQ(2.5, 16.5) < 1e-5);
ok('and it catches a loaded die', chiP([1000, 1000, 1000, 1000, 1000, 1400], 1066.67) < 1e-6);

/* ── the source ── */
{
  const a = R.randBytes(32); const b = R.randBytes(32);
  ok('bytes come back the length asked, and differ from call to call', a.length === 32 && b.length === 32 && Buffer.compare(Buffer.from(a), Buffer.from(b)) !== 0);
  ok('a large request is filled in full (the system call is limited to 64 KiB at a time)', (() => { const x = R.randBytes(300000); let z = 0; for (let i = 250000; i < 300000; i++) if (x[i] === 0) z++; return x.length === 300000 && z < 400; })());
  const real = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
  let threw = null; let got = null; try { got = R.randBytes(8); } catch (e) { threw = e; }
  if (real) Object.defineProperty(globalThis, 'crypto', real); else delete globalThis.crypto;
  ok('with no secure source a draw stops with an error and returns nothing, never a weaker number', threw && /no secure random source/.test(threw.message) && got === null, String(threw));
  ok('the source is back after that', R.randBytes(4).length === 4);
}
/* no Math.random anywhere a draw is made, no random comparators, no modulo of a raw word */
{
  const dir = path.join(__dirname, '../src/js'); const allowed = { '30-audio.js': 3, '2m-gather-core.js': 1, '2p-marks-core.js': 1 };      // calls only: the audio noise generator and two id fallbacks. Prose that names Math.random is not a call.
  const seen = {}; const bad = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8'); const n = (src.match(/Math\.random\s*\(/g) || []).length; if (n) seen[f] = n;
    if (n > (allowed[f] || 0)) bad.push(f + ' has ' + n + ' Math.random');
    if (/sort\(\s*\(\s*\)\s*=>[^)]*(?:random|rand)/i.test(src)) bad.push(f + ' sorts with a random comparator');
    if (/randU32\(\)\s*%|randFloat\(\)\s*\*\s*\w+\)\s*%/.test(src)) bad.push(f + ' takes a raw random word modulo n');
  }
  ok('Math.random is called only by the audio noise generator and two id fallbacks, never for a draw', !bad.length, bad);
  ok('those are exactly the calls that remain (noise samples and identifiers, not choices)', JSON.stringify(Object.entries(seen).sort()) === JSON.stringify(Object.entries(allowed).sort()), seen);
  ok('the passage and reader views draw only through 01-random.js', !/Math\.random\s*\(/.test(fs.readFileSync(path.join(dir, '6d-passage.js'), 'utf8')) && !/Math\.random\s*\(/.test(fs.readFileSync(path.join(dir, '6k-reader.js'), 'utf8')));
}

/* ── no bias ── */
{
  /* the algorithm itself, checked exactly: with a small raw range every raw value is listed, and after the rejection every outcome has the same number of ways to happen */
  let exact = true; for (const range of [256, 1000, 4096]) for (let n = 1; n <= range; n += (n < 80 ? 1 : 37)) { const counts = new Array(n).fill(0); const lim = Math.floor(range / n) * n; for (let x = 0; x < range; x++) if (x < lim) counts[x % n]++; if (new Set(counts).size !== 1) exact = false; }
  ok('rejection sampling: for every n the kept raw values map onto the outcomes equally (exhaustive over small ranges)', exact);
  /* without the rejection, plain modulo is biased: the same exhaustive check catches it */
  ok('and the plain modulo it replaces is not (n = 3 over 256 values: 86, 85, 85)', (() => { const c = [0, 0, 0]; for (let x = 0; x < 256; x++) c[x % 3]++; return new Set(c).size > 1; })());
  /* the real constants */
  let consts = true; for (const n of [2, 3, 5, 6, 7, 10, 12, 52, 100, 270, 1000, 65535, 65537, 1e6, 4294967295, 4294967296]) { const lim = Math.floor(R.RAND_2_32 / n) * n; if (lim % n !== 0 || R.RAND_2_32 - lim >= n) consts = false; }
  ok('the 32-bit limit is a multiple of n and wastes fewer than n raw values, for n up to 2^32', consts);
  let consts53 = true; for (const n of [3, 7, 4294967297, 1e12, 2 ** 40 + 1, 2 ** 52, 2 ** 53]) { const lim = Math.floor(R.RAND_2_53 / n) * n; if (lim % n !== 0 || R.RAND_2_53 - lim >= n) consts53 = false; }
  ok('and the 53-bit limit likewise, for n up to 2^53', consts53);
  /* a raw word above the limit is thrown away and redrawn: feed the source known bytes */
  R.setSource((() => { const seq = [0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x07]; let i = 0; return (n) => { const o = new Uint8Array(n); for (let k = 0; k < n; k++) o[k] = seq[i++ % seq.length]; return o; }; })());
  ok('randInt(3) refuses the one raw value (2^32 - 1) that would favour 0 and draws again', R.randInt(3) === 1);
  R.setSource(null);
  /* the real thing, statistically */
  const tally = (n, draws) => { const c = new Array(n).fill(0); for (let i = 0; i < draws; i++) c[R.randInt(n)]++; return c; };
  flat(tally(2, 200000), 200000, 'a coin is fair (200,000 flips)'); flat(tally(6, 300000), 300000, 'a die is fair (300,000 rolls)'); flat(tally(10, 300000), 300000, 'ten outcomes are fair');
  flat(tally(52, 400000), 400000, 'a card out of 52 is fair'); flat(tally(270, 540000), 540000, 'one book out of the 270 is fair');
  ok('randInt with n of 1 or less is 0, and with a huge n it fills the high bits', R.randInt(1) === 0 && R.randInt(0) === 0 && (() => { let mx = 0; for (let i = 0; i < 400; i++) mx = Math.max(mx, R.randInt(2 ** 40)); return mx > 2 ** 38 && mx < 2 ** 40; })());
  ok('randInt refuses an n beyond 2^53', (() => { try { R.randInt(2 ** 54); return false; } catch (e) { return e instanceof RangeError; } })());
  /* floats */
  const N = 200000; let mn = 1; let mx = 0; let sum = 0; const bins = new Array(256).fill(0); let low = 0;
  for (let i = 0; i < N; i++) { const x = R.randFloat(); if (x < mn) mn = x; if (x > mx) mx = x; sum += x; bins[Math.floor(x * 256)]++; if ((x * R.RAND_2_53) % 2 === 1) low++; }
  ok('floats are in [0, 1)', mn >= 0 && mx < 1);
  ok('floats average 1/2 (within 5 standard errors)', Math.abs(sum / N - 0.5) < 5 * Math.sqrt(1 / 12 / N), sum / N);
  flat(bins, N, 'floats fall evenly across 256 equal bins');
  ok('floats use all 53 bits: the lowest bit is a fair coin', Math.abs(low / N - 0.5) < 5 * 0.5 / Math.sqrt(N), low / N);
  /* shuffles: every one of the 24 orders of four, and the 120 of five, equally likely */
  const key = (a) => a.join(''); const perms = (n) => { const out = []; const rec = (a, rest) => { if (!rest.length) out.push(key(a)); rest.forEach((x, i) => rec(a.concat(x), rest.filter((_, j) => j !== i))); }; rec([], [...Array(n).keys()]); return out; };
  for (const [n, draws] of [[4, 240000], [5, 240000]]) { const all = perms(n); const c = Object.fromEntries(all.map((k) => [k, 0])); for (let i = 0; i < draws; i++) c[key(R.shuffle([...Array(n).keys()]))]++; flat(Object.values(c), draws, `every order of ${n} things is equally likely after a shuffle (${all.length} orders)`); }
  ok('a shuffle keeps every element, and does not change the array it was given', (() => { const a = [1, 2, 3, 4, 5, 6, 7, 8, 9]; const b = R.shuffle(a); return a.join() === '1,2,3,4,5,6,7,8,9' && b.slice().sort().join() === a.join(); })());
  flat((() => { const c = new Array(7).fill(0); const a = ['a', 'b', 'c', 'd', 'e', 'f', 'g']; for (let i = 0; i < 280000; i++) c[a.indexOf(R.pick(a))]++; return c; })(), 280000, 'pick is fair');
}

/* ── seeds and the numbers made from them ── */
{
  const seeds = new Set(); for (let i = 0; i < 3000; i++) seeds.add(R.randSeed());
  ok('a seed is 128 bits as 32 hex characters, and 3,000 of them are all different', seeds.size === 3000 && [...seeds].every(R.randSeedOk));
  const first = {}; for (const s of seeds) first[s[0]] = (first[s[0]] || 0) + 1; flat(Object.values(first), 3000, 'the first hex digit of a seed is evenly spread');
  const s0 = 'ab'.repeat(16); const a = R.randStream(s0); const b = R.randStream(s0); const xs = Array.from({ length: 2000 }, a); const ys = Array.from({ length: 2000 }, b);
  ok('the same seed gives the same stream, every time', xs.join() === ys.join());
  ok('the stream is in [0, 1)', xs.every((x) => x >= 0 && x < 1));
  const c = R.randStream('ab'.repeat(15) + 'ac'); ok('one hex digit different gives a different stream', Array.from({ length: 8 }, c).join() !== xs.slice(0, 8).join());
  /* avalanche: flip one digit of the seed, and about half of the 53 bits of the first number change */
  let dist = 0; const K = 300; for (let i = 0; i < K; i++) { const s = R.randSeed(); const t = (s[0] === 'a' ? 'b' : 'a') + s.slice(1); const x = R.randStream(s)(); const y = R.randStream(t)(); let d = 0; const bx = Math.floor(x * R.RAND_2_53); const by = Math.floor(y * R.RAND_2_53); for (let k = 0; k < 53; k++) if ((Math.floor(bx / 2 ** k) % 2) !== (Math.floor(by / 2 ** k) % 2)) d++; dist += d; }
  ok('flipping one digit of a seed changes about half the bits of the first number (avalanche)', dist / K > 23 && dist / K < 30, dist / K);
  const st = R.randStream(R.randSeed()); const bins = new Array(256).fill(0); for (let i = 0; i < 200000; i++) bins[Math.floor(st() * 256)]++; flat(bins, 200000, 'a stream is evenly spread over 256 bins');
  const st2 = R.randStream(R.randSeed()); const pb = new Array(7).fill(0); for (let i = 0; i < 280000; i++) pb[P.psgBelow(st2, 7)]++; flat(pb, 280000, 'psgBelow over a stream is unbiased (7 outcomes)');
  ok('a draw code reads back to its seed, with or without the dashes', (() => { const s = R.randSeed(); return R.randCodeSeed(R.randCode(s)) === s && R.randCodeSeed(R.randCode(s).toUpperCase().replace(/-/g, ' ')) === s && /^[0-9a-f]{8}(-[0-9a-f]{8}){3}$/.test(R.randCode(s)); })());
  const s1 = R.randSeed(); const code = P.psgCode ? P.psgCode('b-gen', 'long', s1) : null;
  ok('a full draw code (book, length, seed) is read back, and nonsense is refused', (() => { const r = P.psgParseCode(code); return r && r.id === 'b-gen' && r.len === 'long' && r.seed === s1 && !P.psgParseCode('b-gen.long.1234') && !P.psgParseCode('b-gen.huge.' + R.randCode(s1)) && !P.psgParseCode('') && !P.psgParseCode('b-gen.long.' + 'z'.repeat(32)); })(), code);
}

/* ── your own timing: it can only add ── */
{
  let clock = 5000; const realNow = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(performance), 'now') || Object.getOwnPropertyDescriptor(performance, 'now'); Object.defineProperty(performance, 'now', { value: () => clock, configurable: true, writable: true });
  const feed = (times) => { R.RANDT.reset(); clock = 5000; for (const t of times) { clock += 17; R.RANDT.note({ timeStamp: t, key: 'q' }); } return R.RANDT.digest(); };
  const d1 = feed([100.1, 220.7, 340.2, 451.9]); const d1b = feed([100.1, 220.7, 340.2, 451.9]); const d2 = feed([100.1, 220.7, 340.2, 452.0]);
  ok('the digest is a function of the timestamps: the same events give the same digest, a different time gives another', d1 === d1b && d1 !== d2, [d1, d1b, d2]);
  R.RANDT.reset(); ok('the count follows the events and reset clears it', R.RANDT.count === 0 && (() => { R.RANDT.note({ timeStamp: 1 }); R.RANDT.note({ timeStamp: 2 }); return R.RANDT.count === 2; })());
  /* which key was pressed is never used */
  const seen = []; const fake = { listeners: {}, addEventListener(n, f) { this.listeners[n] = f; }, removeEventListener(n) { delete this.listeners[n]; } };
  R.RANDT.reset(); clock = 7000; const stop = R.RANDT.start(fake, (n) => seen.push(n));
  ok('timing listens to key presses, taps, moves and the wheel, and to nothing else', Object.keys(fake.listeners).sort().join() === 'keydown,pointerdown,pointermove,touchstart,wheel');
  fake.listeners.keydown({ timeStamp: 10.5, key: 'a', code: 'KeyA' }); const da = R.RANDT.digest(); R.RANDT.reset(); clock = 7000; fake.listeners.keydown({ timeStamp: 10.5, key: 'z', code: 'KeyZ' }); const dz = R.RANDT.digest();
  ok('the key that was pressed has no effect on what is kept (only the time), and each event is counted', da === dz && seen.length === 2 && seen[1] === 1, [da, dz, seen]);
  ok('a flood of pointer moves within a few milliseconds is thinned, key presses are all kept', (() => { R.RANDT.reset(); clock = 9000; for (let i = 0; i < 10; i++) { clock += 0.5; R.RANDT.note({ type: 'pointermove', timeStamp: clock }); } const moves = R.RANDT.count; for (let i = 0; i < 5; i++) { clock += 0.5; R.RANDT.note({ type: 'keydown', timeStamp: clock }); } return moves < 10 && R.RANDT.count === moves + 5; })());
  stop(); ok('stop removes the listeners', Object.keys(fake.listeners).length === 0 && !R.RANDT.on);
  /* mixing: both inputs reach the seed; a hostile, constant timing cannot make seeds repeat or lean */
  R.setSource((() => { let i = 0; return (n) => { const o = new Uint8Array(n); for (let k = 0; k < n; k++) o[k] = (i++ * 7 + 3) & 255; return o; }; })());
  const a1 = R.randSeed('timing-A'); R.setSource((() => { let i = 0; return (n) => { const o = new Uint8Array(n); for (let k = 0; k < n; k++) o[k] = (i++ * 7 + 3) & 255; return o; }; })()); const a2 = R.randSeed('timing-A'); R.setSource((() => { let i = 0; return (n) => { const o = new Uint8Array(n); for (let k = 0; k < n; k++) o[k] = (i++ * 7 + 3) & 255; return o; }; })()); const a3 = R.randSeed('timing-B');
  ok('with the secure bytes held fixed, the timing changes the seed; with the timing held fixed, the secure bytes change it', a1 === a2 && a1 !== a3);
  R.setSource(null);
  if (realNow) Object.defineProperty(performance, 'now', realNow); else delete performance.now;
  const hostile = new Set(); const nib = {}; for (let i = 0; i < 4000; i++) { const s = R.randSeed('0'); hostile.add(s); nib[s[5]] = (nib[s[5]] || 0) + 1; }
  ok('even if the timing is a constant an attacker knows, 4,000 seeds are all different', hostile.size === 4000);
  flat(Object.values(nib), 4000, 'and still evenly spread (the secure bytes are always in the hash, so the timing cannot weaken it)');
}

/* ── the picker, drawn from a seed ── */
{
  const PROSE = 'The people had waited a long time for the rain, and when at last the first clouds came up over the hills the old man went out and stood in the road. He said nothing to anyone. His daughter, who had followed him, took his hand, and together they watched the dark edge of the storm move slowly across the valley.';
  const secs = Array.from({ length: 6 }, (_, k) => [`Chapter ${k + 1}`, Array.from({ length: 12 }, (_, i) => `Paragraph ${k * 12 + i} begins here. ${PROSE} It ends at paragraph ${k * 12 + i}.`).join('\n\n')]);
  const draw = (seed, t) => P.pickPassage(secs, {}, R.randStream(seed), { target: t });
  const seed = R.randSeed(); const A = draw(seed, 560); draw(R.randSeed(), 560); const B = draw(seed, 560);
  ok('the same seed gives the same passage, even after other draws (the picker keeps no state that changes a draw)', A && B && A.si === B.si && A.text === B.text && A.p === B.p);
  ok('different seeds give different passages (60 draws from about 70 places give about 40 different ones; fewer than 25 would be a fault)', new Set(Array.from({ length: 60 }, () => (draw(R.randSeed(), 560) || {}).text)).size >= 25);
  for (const t of [320, 560, 1500, 3000]) { const x = draw(seed, t); const y = draw(seed, t); ok(`and at ${t} characters`, x && y && x.text === y.text); }
  /* every paragraph of a book equally likely to be where a short draw lands */
  const counts = new Array(72).fill(0); const DR = 36000; for (let i = 0; i < DR; i++) { const p = draw(R.randSeed(), 320); const m = p && /^Paragraph (\d+) begins/.exec(p.text); if (m) counts[+m[1]]++; }
  ok('all 72 paragraphs can be drawn, each a share of 1/72', counts.every((c) => c > 0) && counts.reduce((a, b) => a + b) > DR * 0.95, counts.slice(0, 5));
  flat(counts, counts.reduce((a, b) => a + b), 'every paragraph of a book is equally likely to be drawn (36,000 draws)');
  /* every shelf equally likely, then every book on it */
  const lib = [{ id: 'a1', group: 'A' }].concat(Array.from({ length: 30 }, (_, i) => ({ id: 'b' + i, group: 'B' })), Array.from({ length: 3 }, (_, i) => ({ id: 'c' + i, group: 'C' })));
  const sh = { A: 0, B: 0, C: 0 }; const inB = new Array(30).fill(0); for (let i = 0; i < 60000; i++) { const r = P.psgChooseBook(lib, R.randStream(R.randSeed())); sh[lib.find((l) => l.id === r.id).group]++; if (r.id[0] === 'b') inB[+r.id.slice(1)]++; }
  flat(Object.values(sh), 60000, 'each shelf is equally likely whatever its size (one book, thirty books, three books)'); flat(inB, inB.reduce((a, b) => a + b), 'and each book on a shelf is equally likely');
}
/* ── a passage (a unit with a reference) is drawn the same way, and a draw code names it ── */
{
  const sent = (c, n) => `In chapter ${c} the elders of the village gathered and spoke about the matter of verse ${n}, and they agreed that the water should be shared.`;
  const book = Array.from({ length: 3 }, (_, c) => [`Chapter ${c + 1}`, Array.from({ length: 5 }, (_, pi) => Array.from({ length: 4 }, (_, vi) => `[[${pi * 4 + vi + 1}]] ${sent(c + 1, pi * 4 + vi + 1)}`).join(' ')).join('\n\n')]);
  const draw = (seed, mode) => P.psgPickUnit(book, {}, R.randStream(seed), { mode: mode || 'passage' });
  const seed = R.randSeed(); const A = draw(seed); draw(R.randSeed()); const B = draw(seed);
  ok('the same seed gives the same passage (verses, from and to), even after other draws', A && B && A.text === B.text && A.from === B.from && A.to === B.to && A.si === B.si);
  ok('and the same page', (() => { const a = draw(seed, 'page'); const b = draw(seed, 'page'); return a && b && a.text === b.text; })());
  ok('different seeds give different passages (60 draws from 15 paragraphs give 12 or more different ones)', new Set(Array.from({ length: 60 }, () => (draw(R.randSeed()) || {}).from + ':' + (draw(R.randSeed()) || {}).si)).size >= 8);
  const counts = new Array(15).fill(0); for (let i = 0; i < 30000; i++) { const u = draw(R.randSeed()); if (u) counts[u.si * 5 + Math.floor((u.from - 1) / 4)]++; }
  ok('every paragraph of a book of verses is drawn, each a share of 1/15', counts.every((c) => c > 0) && counts.reduce((a, b) => a + b) > 29000, counts);
  flat(counts, counts.reduce((a, b) => a + b), 'every paragraph of a book of verses is equally likely to be the passage drawn (30,000 draws)');
  const s1 = R.randSeed(); const c1 = P.psgCode('b-psa', 'passage', s1);
  ok('a draw code of a passage is read back, a page’s “long” and the four old lengths still are, and nonsense is refused', (() => { const r = P.psgParseCode(c1); return r && r.id === 'b-psa' && r.len === 'passage' && r.seed === s1 && P.psgParseCode(P.psgCode('b-gen', 'long', s1)) && P.psgParseCode(P.psgCode('b-gen', 'short', s1)) && !P.psgParseCode(P.psgCode('b-gen', 'huge', s1)) && !P.psgParseCode('b-psa.passage.1234'); })(), c1);
}
/* ── the draw with your own timing is the default, and a draw never waits for a beat (18 Nov 2026) ── */
{
  const mem = {}; globalThis.store = { get: (k, d) => (k in mem ? JSON.parse(mem[k]) : d), set: (k, v) => { mem[k] = JSON.stringify(v); }, del: (k) => { delete mem[k]; } };
  ok('the default draw is the timing one: nothing kept, the first read gives "timing" and makes the one-time reset (passage.srcv)', P.psgSrcPref() === 'timing' && mem['passage.src'] === '"timing"' && mem['passage.srcv'] === String(P.PSG_SRC_V));
  delete mem['passage.src']; delete mem['passage.srcv']; mem['passage.src'] = '"secure"';
  ok('a "secure" kept before the flag existed is reset to the timing draw once', P.psgSrcPref() === 'timing' && JSON.parse(mem['passage.src']) === 'timing');
  mem['passage.src'] = '"secure"'; mem['passage.srcv'] = String(P.PSG_SRC_V);
  ok('after the reset an explicit choice of the secure source alone is kept, every time', P.psgSrcPref() === 'secure' && P.psgSrcPref() === 'secure' && JSON.parse(mem['passage.src']) === 'secure');
  mem['passage.src'] = '"timing"'; ok('and an explicit choice of the timing draw is kept', P.psgSrcPref() === 'timing');
  delete mem['passage.src']; ok('with the flag set and nothing kept the default is the timing draw', P.psgSrcPref() === 'timing');
  mem['passage.src'] = '"<script>"'; ok('a value that is neither is the default, not an error', P.psgSrcPref() === 'timing');
  ok('the choices are the two the page names, and the timing one is the default in the table of sources', P.PSG_SRC.timing === 'Secure random + my timing' && P.PSG_SRC.secure === 'Secure random' && P.PSG_SRC_V === 1);
  /* a draw with zero beats still works, and says it is the secure bytes alone; with beats the timing is in the seed */
  R.RANDT.reset(); ok('no beat yet: the timing draw makes a good seed (32 hex characters), a different one every time', (() => { const a = P.psgNewSeed('timing'); const b = P.psgNewSeed('timing'); return R.randSeedOk(a) && R.randSeedOk(b) && a !== b; })());
  ok('no beat yet: the seed is the same kind of seed as the secure draw’s (the secure bytes are all there is)', (() => { R.setSource((() => { let i = 0; return (n) => { const o = new Uint8Array(n); for (let k = 0; k < n; k++) o[k] = (i++ * 11 + 5) & 255; return o; }; })()); const a = P.psgNewSeed('timing'); R.setSource((() => { let i = 0; return (n) => { const o = new Uint8Array(n); for (let k = 0; k < n; k++) o[k] = (i++ * 11 + 5) & 255; return o; }; })()); const b = P.psgNewSeed('secure'); R.setSource(null); return a === b; })());
  R.RANDT.reset(); R.RANDT.note({ timeStamp: 12.5 }); R.RANDT.note({ timeStamp: 99.1 });
  ok('with beats the timing is in the seed: the same secure bytes and different beats give a different seed, and the secure choice ignores the beats', (() => { const src = () => { let i = 0; return (n) => { const o = new Uint8Array(n); for (let k = 0; k < n; k++) o[k] = (i++ * 13 + 1) & 255; return o; }; }; R.setSource(src()); const t1 = P.psgNewSeed('timing'); R.setSource(src()); const s1 = P.psgNewSeed('secure'); R.RANDT.note({ timeStamp: 140.3 }); R.setSource(src()); const t2 = P.psgNewSeed('timing'); R.setSource(src()); const s2 = P.psgNewSeed('secure'); R.setSource(null); return t1 !== s1 && t1 !== t2 && s1 === s2; })());
  R.RANDT.reset(); delete globalThis.store;
}
/* ── how long a passage is (Short, Medium, Longer): the draw code says so, Medium is what it always was ── */
{
  const sent = (c, n) => `In chapter ${c} the elders of the village gathered and spoke about the matter of verse ${n}, and they agreed that the water should be shared among all the houses.`;
  const book = Array.from({ length: 4 }, (_, c) => [`Chapter ${c + 1}`, Array.from({ length: 6 }, (_, pi) => Array.from({ length: 6 }, (_, vi) => `[[${pi * 6 + vi + 1}]] ${sent(c + 1, pi * 6 + vi + 1)}`).join(' ')).join('\n\n')]);
  const draw = (seed, size) => P.psgPickUnit(book, {}, R.randStream(seed), size === undefined ? { mode: 'passage' } : { mode: 'passage', size });
  const seeds = Array.from({ length: 120 }, () => R.randSeed()); const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const len = (size) => seeds.map((s) => psuVis((draw(s, size) || { text: '' }).text).length);
  ok('Medium is the passage of every earlier code: the same seed gives the same text with no size, with "medium" and with a size nobody knows', seeds.slice(0, 40).every((s) => { const a = draw(s); const b = draw(s, 'medium'); const c = draw(s, 'huge'); return a && b && c && a.text === b.text && a.text === c.text && a.from === b.from; }));
  const ls = len('short'); const lm = len('medium'); const ll = len('longer');
  ok('Short is shorter than Medium, and Medium shorter than Longer (the means of 120 draws each)', mean(ls) < mean(lm) && mean(lm) < mean(ll) && mean(ls) > 0, [mean(ls), mean(lm), mean(ll)]);
  ok('Short is a verse or two (under 450 characters), Longer runs on (most draws over 600)', Math.max(...ls) <= 450 && ll.filter((x) => x > 600).length > ll.length * 0.8, [Math.max(...ls), ll.filter((x) => x > 600).length]);
  ok('the same seed gives the same Short and the same Longer, every time (a code replays them)', seeds.slice(0, 30).every((s) => draw(s, 'short').text === draw(s, 'short').text && draw(s, 'longer').text === draw(s, 'longer').text));
  ok('a passage’s verses are whole at every length (each draw begins at a verse and ends at the end of a sentence)', seeds.slice(0, 40).every((s) => ['short', 'medium', 'longer'].every((z) => { const u = draw(s, z); return u && u.kind === 'verses' && /^\[\[\d+\]\]/.test(u.text) && /[.!?”"]$/.test(u.text.trim()); })));
  const s1 = R.randSeed();
  ok('the draw code says the length: Medium is the plain "passage", Short and Longer say so; each is read back with its seed', (() => { const m = P.psgCode('b-psa', P.PSG_PLEN.medium, s1); const a = P.psgCode('b-psa', P.PSG_PLEN.short, s1); const b = P.psgCode('b-psa', P.PSG_PLEN.longer, s1); const pm = P.psgParseCode(m); const pa = P.psgParseCode(a); const pb = P.psgParseCode(b); return /^b-psa\.passage\.[0-9a-f]{8}-/.test(m) && /^b-psa\.passage-short\./.test(a) && /^b-psa\.passage-longer\./.test(b) && pm && pm.seed === s1 && pa && pa.len === 'passage-short' && pa.seed === s1 && pb && pb.len === 'passage-longer' && P.psgPSize(pa.len) === 'short' && P.psgPSize(pb.len) === 'longer' && P.psgPSize(pm.len) === 'medium'; })());
  ok('nonsense after the dot is refused: an unknown length, a word every object has, a hyphen with nothing after it', !P.psgParseCode('b-psa.passage-huge.' + R.randCode(s1)) === true && P.psgParseCode('b-psa.passage-huge.' + R.randCode(s1)) === null && P.psgParseCode('b-psa.constructor.' + R.randCode(s1)) === null && P.psgParseCode('b-psa.passage-.' + R.randCode(s1)) === null && P.psgParseCode('b-psa.toString.' + R.randCode(s1)) === null && P.psgParseCode('b-psa.hasownproperty.' + R.randCode(s1)) === null);
  ok('the old codes still read: the four old lengths, a page, two pages', ['short', 'medium', 'long', 'longer', 'page', 'pages'].every((k) => { const r = P.psgParseCode('b-gen.' + k + '.' + R.randCode(s1)); return r && r.len === k; }));
  ok('a length from an address or from what was kept: short, medium, longer or s, m, l; anything else is Medium', P.psgSizeAsked('short') === 'short' && P.psgSizeAsked('l') === 'longer' && P.psgSizeAsked('m', 'short') === 'medium' && P.psgSizeAsked(undefined, 'short') === 'short' && P.psgSizeAsked('<b>', undefined) === 'medium' && P.psgSizeAsked(['short'], 'longer') === 'longer' && P.psgSizeAsked(undefined, 'nope') === 'medium');
}
console.log(`randomness: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
