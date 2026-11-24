// Run: node tests/listen.test.js — reading aloud, the parts that need no speaker (src/js/2z-listen-core.js; the voice ranking, the pauses and the engine are in tests/voice.test.js): the settings are short fixed lists, a paragraph is cut into chunks that cover
// every word once and in order (so the words spoken are the words on the page, never changed), no chunk is longer than the limit, sentence ends are found without breaking on
// abbreviations, and the voice list puts English voices first. Runs on real paragraphs from every library text if ../texts is built.
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const M = require('../src/js/2p-marks-core.js'); Object.assign(globalThis, M);
const L = require('../src/js/2z-listen-core.js');
let pass = 0; let fail = 0; const ok = (n, c, x = '') => { if (c) pass++; else { fail++; console.log('FAIL', n, typeof x === 'string' ? x : JSON.stringify(x).slice(0, 400)); } };
const strip = (s) => String(s).replace(/\s+/g, '');
/* what a set of chunks must satisfy for a text */
function check(t, max) {
  const cs = L.lsChunks(t, max); const M2 = Math.max(60, max || 240);
  const inOrder = cs.every((c, i) => c.a >= 0 && c.b <= t.length && c.a < c.b && (i === 0 || c.a >= cs[i - 1].b));
  const covers = strip(cs.map((c) => t.slice(c.a, c.b)).join('')) === strip(t);
  const longest = Math.max(0, ...cs.map((c) => t.slice(c.a, c.b).length)); const tooLong = cs.filter((c) => { const w = t.slice(c.a, c.b); return w.length > M2 && /\s/.test(w.trim()); });
  const trimmed = cs.every((c) => !/^\s|\s$/.test(t.slice(c.a, c.b)));
  return { cs, inOrder, covers, tooLong, trimmed, longest };
}
{ /* settings */
  ok('the defaults are a little slower than talking (0.85×, as in the guided practices), the device’s own best voice, no sleep timer', JSON.stringify(L.lsClean(null)) === JSON.stringify(L.LS_DEFAULT) && L.LS_DEFAULT.rate === 0.85 && L.LS_DEFAULT.voice === '' && L.LS_DEFAULT.sleep === 'off');
  ok('a wrong-shaped setting becomes the defaults', [undefined, null, 5, 'x', [], {}, { rate: 'x' }].every((v) => JSON.stringify(L.lsClean(v)) === JSON.stringify(L.LS_DEFAULT)));
  ok('speed snaps to the nearest speed offered, inside the range', L.lsClean({ rate: 1.2 }).rate === 1.15 && L.lsClean({ rate: 99 }).rate === 2 && L.lsClean({ rate: -3 }).rate === 0.7 && L.lsClean({ rate: 1.5 }).rate === 1.5 && L.LS_RATES.every((r) => r >= 0.5 && r <= 3));
  ok('a sleep choice must be on the list, and names from the object prototype are not', L.lsClean({ sleep: '30' }).sleep === '30' && L.lsClean({ sleep: 'section' }).sleep === 'section' && L.lsClean({ sleep: 'nope' }).sleep === 'off' && ['__proto__', 'constructor', 'toString'].every((k) => L.lsClean({ sleep: k }).sleep === 'off'));
  ok('the voice is kept as a short string only', L.lsClean({ voice: 'com.apple.voice.compact.en-US.Samantha' }).voice.startsWith('com.apple') && L.lsClean({ voice: 'x'.repeat(5000) }).voice.length === 200 && L.lsClean({ voice: 5 }).voice === '');
  ok('a timer is minutes from now; none and end-of-section have no clock time', L.lsSleepAt('30', 1000) === 1000 + 30 * 60000 && L.lsSleepAt('off', 5) === null && L.lsSleepAt('section', 5) === null && L.lsSleepAt('__proto__', 5) === null);
}
{ /* cutting a paragraph */
  const t = 'In the beginning God created the heavens and the earth. The earth was formless and empty. Darkness was on the surface of the deep.';
  const r = check(t); ok('three sentences make three chunks that cover the words in order', r.cs.length === 3 && r.inOrder && r.covers && r.trimmed, r.cs);
  ok('the words spoken are the words on the page, spacing tidied', L.lsSpeak(t, r.cs[1]) === 'The earth was formless and empty.');
  const qt = 'He said to them all, “Go now and do not delay.” Then he went away, and he did not look back at all, ever.'; const a = check(qt); ok('a closing quote after a full stop stays with its sentence', a.cs.length === 2 && qt.slice(a.cs[0].a, a.cs[0].b) === 'He said to them all, “Go now and do not delay.”', a.cs);
  const ab = 'As Gen. 1:1 says, God made all things. See Dr. Smith and St. Paul on this, for they wrote at length about it.'; const b = check(ab); ok('a full stop after an abbreviation or a lone capital is not the end of a sentence', b.cs.length === 2 && ab.slice(b.cs[0].a, b.cs[0].b).endsWith('all things.'), b.cs.map((c) => ab.slice(c.a, c.b)));
  const sh = check('Amen. So it was, from the first day to the last, and it is so now.'); ok('a very short sentence goes with the next', sh.cs.length === 1 && sh.covers, sh.cs);
  const long = ('word, ' .repeat(120)).trim(); const lg = check(long, 100); ok('a sentence longer than the limit is cut at commas, each piece within it', lg.cs.length > 3 && lg.tooLong.length === 0 && lg.covers && lg.inOrder, [lg.cs.length, lg.longest]);
  const nosp = 'x'.repeat(1000); const ns = check(nosp, 100); ok('a stretch with no break at all is cut hard so nothing is too long, and loses no letters', ns.cs.length >= 10 && ns.cs.every((c) => c.b - c.a <= 100) && ns.covers, ns.cs.length);
  ok('empty text, spaces and newlines make no chunks, and odd input does not throw', [L.lsChunks(''), L.lsChunks('   \n\n '), L.lsChunks(null), L.lsChunks(undefined), L.lsChunks(5)].every((x) => Array.isArray(x)) && L.lsChunks('').length === 0 && L.lsChunks('  \n ').length === 0);
  ok('text with no full stop is one chunk', L.lsChunks('and so on without end').length === 1);
  { const w = 'May I be safe. May I be well. May I be at ease.'; const j0 = L.lsChunks(w, 240, 0).map((c) => w.slice(c.a, c.b)); const j24 = L.lsChunks(w, 240).map((c) => w.slice(c.a, c.b));
    ok('a guided practice can ask for no joining, so each short phrase is a piece of its own with a pause after it, and a reading still joins very short sentences by default', j0.join('|') === 'May I be safe.|May I be well.|May I be at ease.' && j24.length === 2 && L.lsChunks(w, 240, 24).length === 2, [j0, j24]); }
  const mx = check('Short. Another short one here. And a third, a bit longer than the others were, to be sure of it all.', 60); ok('the limit has a floor, so a tiny limit still works', mx.covers && mx.inOrder);
  const verse = 'Yahweh said to Moses, “Go to Pharaoh and say to him: ‘Let my people go, that they may serve me.’” But he would not listen. And Moses and Aaron went in before him!'; const vv = check(verse); ok('quotes inside quotes, colons and exclamations are handled and cover every word', vv.covers && vv.inOrder && vv.cs.length >= 2, vv.cs.map((c) => verse.slice(c.a, c.b)));
}
{ /* voices */
  const V = (name, lang, local, uri) => ({ name, lang, localService: local, voiceURI: uri || name });
  const list = [V('Anna', 'de-DE', true), V('Daniel', 'en-GB', true), V('Samantha', 'en-US', true), V('Alex (Enhanced)', 'en-US', true), V('Google US English', 'en-US', false), V('Kyoko', 'ja-JP', true), null, { name: 'bad' }];
  const vs = L.lsVoices(list);
  ok('English voices come first, the better names and enhanced kinds ahead, the rest after, and broken entries are dropped', vs.length === 6 && vs.slice(0, 4).every((v) => /^en/.test(v.lang)) && vs[0].name === 'Alex (Enhanced)' && vs.slice(4).every((v) => !/^en/.test(v.lang)), vs.map((v) => v.name));
  ok('the chosen voice is used if it is still there, otherwise the best English one, otherwise any', L.lsPickVoice(list, 'Daniel').name === 'Daniel' && L.lsPickVoice(list, 'gone').name === 'Alex (Enhanced)' && L.lsPickVoice([V('Anna', 'de-DE', true)], '').name === 'Anna' && L.lsPickVoice([], '') === null && L.lsPickVoice(null, '') === null);
  ok('a voice with no language is not given an English score', L.lsVoiceScore(V('x', '', true)) === 0 && L.lsVoiceScore(null) === -1);
}
/* real paragraphs from the library */
const dir = path.join(__dirname, '../../texts');
if (fs.existsSync(path.join(dir, 'index.js'))) {
  const T = { data: {}, meta: {}, add(id, m, s) { this.data[id] = { m, s }; }, addIndex(i) { Object.assign(this.meta, i); } }; const run = (f) => vm.runInNewContext(fs.readFileSync(path.join(dir, f), 'utf8'), { BEATLAB_TEXTS: T }, { filename: f });
  run('index.js'); const ids = Object.keys(T.meta); let paras = 0; let chunksN = 0; const bad = []; let longest = 0; let t0 = Date.now(); const lens = [];
  for (const id of ids) {
    run(id + '.js'); const s = T.data[id].s; let c = 0;
    for (let k = 0; k < s.length; k += 3) { const blocks = textBlocks(s[k][1]); for (let p = 0; p < blocks.length; p += 7) { const body = visibleText(blockParts(blocks[p]).body || ''); if (body.trim().length < 5) continue; const r = check(body, 240); paras++; chunksN += r.cs.length; longest = Math.max(longest, r.longest); lens.push(...r.cs.map((q) => q.b - q.a)); if (!(r.inOrder && r.covers && r.trimmed && r.tooLong.length === 0)) bad.push([id, k, p, !r.inOrder, !r.covers, r.tooLong.length]); } }
    delete T.data[id];
  }
  ok(`${paras.toLocaleString()} real paragraphs from ${ids.length} texts are cut into ${chunksN.toLocaleString()} chunks that keep every word once, in order, trimmed, and within the limit`, bad.length === 0 && paras > 1000, bad.slice(0, 4));
  lens.sort((a, b) => a - b); console.log(`  (chunk length: median ${lens[lens.length >> 1]}, 95th ${lens[Math.floor(lens.length * 0.95)]}, longest ${longest}; ${Date.now() - t0} ms)`);
}
console.log(`listen: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
