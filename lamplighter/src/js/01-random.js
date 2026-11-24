/* ═══════════════════════════ 01 · Randomness ═══════════════════════════
   Every draw in the Lamplighter Project that is meant to be random (a passage, a book, a shuffle, the targets in the lab) comes from this file.

   1. The source is crypto.getRandomValues: in every current browser the operating system's cryptographically secure generator, the one
      that makes encryption keys. Math.random is never used for a draw (tests/random.test.js scans the source for it). If a browser has no
      secure source the draw stops with an error. There is no weaker fallback.
   2. No bias. A number in [0, n) is made by rejection sampling: raw values from the part of the range that does not divide evenly by n are
      thrown away and drawn again, so no outcome is even slightly likelier than another (the usual `random % n` favours the small
      numbers; so does sorting with a random comparator, which is not used either). Shuffles are Fisher–Yates over those unbiased numbers.
   3. Draw codes. A passage is drawn from a 128-bit seed, stretched into as many numbers as the pick needs by SHA-256 in counter mode. The
      seed is shown with the passage as a draw code, and the same code with the same book and length gives the same passage again, so a
      draw can be replayed and checked rather than taken on trust.
   4. Your own timing (optional, the TempleOS idea). The Holy Spirit oracle in TempleOS took the low bits of the time of the last key or
      mouse event, a few at a time, and read them as words and verses. Here the times of your own key presses, taps and pointer moves can be
      hashed together with 32 fresh secure bytes into the seed. Because the secure bytes are always in the hash, your timing can only add
      to a draw; it cannot make it less random, and nothing is stored. Only times are used, never which key was pressed.
   This is cryptographically secure randomness, checked by the tests in this repository. It is not a certified gaming-lab generator. */
const RAND_2_32 = 4294967296;
const RAND_2_53 = 9007199254740992;
let randSource = null;        // tests only: a function (n) => Uint8Array that stands in for the system source
function randBytes(n) {
  const out = new Uint8Array(n);
  if (randSource) { const b = randSource(n); for (let i = 0; i < n; i++) out[i] = b[i]; return out; }
  const c = (typeof globalThis !== 'undefined' && globalThis.crypto) || (typeof self !== 'undefined' && self.crypto) || null;
  if (!c || typeof c.getRandomValues !== 'function') throw new Error('This browser has no secure random source, so nothing was drawn. The Lamplighter Project will not use a weaker one.');
  for (let i = 0; i < n; i += 65536) c.getRandomValues(out.subarray(i, Math.min(n, i + 65536)));
  return out;
}
const randWord = (b, o) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
function randU32() { return randWord(randBytes(4), 0); }
function randU53() { const b = randBytes(8); return (randWord(b, 0) >>> 11) * RAND_2_32 + randWord(b, 4); }      // 21 + 32 bits
/* a uniform float in [0, 1) with all 53 bits of a double filled in */
function randFloat() { const b = randBytes(8); return ((randWord(b, 0) >>> 5) * 67108864 + (randWord(b, 4) >>> 6)) / RAND_2_53; }
/* rejection sampling: draw() gives a raw uniform integer in [0, range); the largest multiple of n that fits is kept, the rest is redrawn */
function uniformBelow(n, draw, range) { const lim = Math.floor(range / n) * n; let x; do { x = draw(); } while (x >= lim); return x % n; }
function randInt(n) { // uniform integer in [0, n), for n up to 2^53
  n = Math.floor(n); if (!(n > 1)) return 0;
  if (n > RAND_2_53) throw new RangeError('randInt: n is too large');
  return n <= RAND_2_32 ? uniformBelow(n, randU32, RAND_2_32) : uniformBelow(n, randU53, RAND_2_53);
}
function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = randInt(i + 1); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function pick(arr) { return arr[randInt(arr.length)]; }
const randShuffle = (arr) => shuffle(arr);      // for call sites where a local name hides `shuffle` or `pick`
const randPick = (arr) => pick(arr);
function randHex(nBytes = 8) { return Array.from(randBytes(nBytes), (b) => b.toString(16).padStart(2, '0')).join(''); }

/* ── draw codes: a seed, and the stream of numbers made from it ── */
/* 128-bit seed as 32 hex characters: SHA-256 of 32 fresh secure bytes and whatever else is given (the digest of the player's timing) */
function randSeed(extra) { return sha256(`beatlab-seed|${randHex(32)}|${extra == null ? '' : extra}`).slice(0, 32); }
/* a function that returns floats in [0, 1) from the seed, the same ones every time: SHA-256(seed ‖ counter) four floats at a time */
function randStream(seed) {
  let ctr = 0; let buf = []; const s = String(seed);
  return function next() {
    if (!buf.length) { const h = sha256(`${s}:${ctr++}`); for (let i = 0; i < 4; i++) buf.push(((parseInt(h.slice(i * 16, i * 16 + 8), 16) >>> 5) * 67108864 + (parseInt(h.slice(i * 16 + 8, i * 16 + 16), 16) >>> 6)) / RAND_2_53); }
    return buf.shift();
  };
}
const randSeedOk = (s) => /^[0-9a-f]{32}$/.test(String(s));
/* a code people can read out and type: 4 groups of 8 */
const randCode = (seed) => String(seed).replace(/(.{8})(?=.)/g, '$1-');
const randCodeSeed = (code) => String(code).toLowerCase().replace(/[^0-9a-f]/g, '');

/* ── your own timing ── */
const RANDT = (() => {
  const CAP = 256; let ev = []; let n = 0; let last = -1e9; let detach = null; let live = false;
  const now = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
  /* the time of an event, to the microsecond, as the browser gives it (browsers round this, so only some of the low digits carry anything) */
  function note(e) {
    const t = now(); if (e && e.type === 'pointermove' && t - last < 3) return; last = t;     // a flood of pointer moves is thinned; key presses and taps are always kept
    const stamp = e && typeof e.timeStamp === 'number' ? e.timeStamp : t;
    ev.push(Math.round(t * 1000).toString(36) + '.' + Math.round(stamp * 1000).toString(36)); if (ev.length > CAP) ev.shift(); n++;
  }
  return {
    note,
    get on() { return live; },
    get count() { return n; },
    digest() { return sha256('timing|' + n + '|' + ev.join(',')); },
    reset() { ev = []; n = 0; last = -1e9; },
    /* listen to times only, on a document or element; returns the function that stops */
    start(el, onTick) {
      if (live || !el || !el.addEventListener) return () => {};
      const names = ['keydown', 'pointerdown', 'pointermove', 'touchstart', 'wheel']; const f = (e) => { note(e); if (onTick) onTick(n); };
      names.forEach((x) => el.addEventListener(x, f, { passive: true })); live = true;
      detach = () => { names.forEach((x) => el.removeEventListener(x, f)); live = false; detach = null; };
      return detach;
    },
    stop() { if (detach) detach(); },
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = { randShuffle, randPick, randBytes, randU32, randU53, randFloat, randInt, uniformBelow, shuffle, pick, randHex, randSeed, randStream, randSeedOk, randCode, randCodeSeed, RANDT, RAND_2_32, RAND_2_53, setSource(f) { randSource = f; } };
