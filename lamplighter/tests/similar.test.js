/* Find similar passages: the shared rules (src/js/2w-similar-core.js) on small cases, then the built index in ../similar/ against the real texts.
   Run: node tests/similar.test.js     (the index is made by: node tools/build_similar.js) */
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const ROOT = path.join(__dirname, '..', '..'); const C = require('../src/js/2w-similar-core.js'); const PSG = require('../src/js/6d-passage.js'); const LIB = require('../src/js/24-data-path-lib.js');
/* the page's search always scores motifs (simEmbed calls simMotifScores, which the page has as a global), so every search below must too, as tools/similar_bench.js does. Until 24 November 2026 these two lines sat in the motifs block at
   the end of this file, so the Noah and the ark search below ran without the motif bonus that the page always adds: Gilgamesh XI was then the second Near East section by 0.03 (7.50 against 7.47) and any rebuild of the index flipped it (rank 100 of 2,139 sections
   became 131 to 175 in three trial rebuilds of 24 November 2026 with 454, 446 and 445 texts), while with the motif bonus it is shown first or second, rank 8 to 27, in the installed index and in every rebuild */
globalThis.simTerms = C.simTerms; globalThis.simMotifScores = require('../src/js/2x-motifs.js').simMotifScores;
let pass = 0; let fail = 0; const warn = [];
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra !== undefined ? JSON.stringify(extra).slice(0, 300) : ''); } };

/* ── words ── */
ok('stems meet: save, saved and saving; gods and god; flooded and flood', C.simStem('saving') === C.simStem('saved') && C.simStem('gods') === C.simStem('god') && C.simTerms('flooded flood floods').every((t) => t === C.simTerms('flood')[0]));
ok('archaic words and verse numbers carry no weight: thou, hath and unto go; [[12]] goes', C.simTerms('[[12]] Thou hast said unto thee that he hath come').join(' ') === 'come' || !C.simTerms('thou hath unto').length);
ok('translators’ different words for one thing meet: ark, ship and boat; flood and deluge', C.simTerms('the ark')[0] === C.simTerms('a ship')[0] && C.simTerms('a boat')[0] === C.simTerms('the vessel')[0] && C.simTerms('flood')[0] === C.simTerms('the deluge')[0]);
ok('spelling variants of a name meet: Gilgamesh and Gilgamish, Tao and Dao', C.simTerms('Gilgamish')[0] === C.simTerms('Gilgamesh')[0] && C.simTerms('Tao')[0] === C.simTerms('Dao')[0]);
ok('with raw = true each term comes with the word as written', JSON.stringify(C.simTerms('The ships sailed', true)) === JSON.stringify([['ship', 'ships'], ['sail', 'sailed']]), C.simTerms('The ships sailed', true));
ok('noise is spotted: OCR gibberish and a table of numbers, not a real passage', C.simJunk('cd o d M U co d pq co d 5 -H CJ -a H o K r-n K d o • *—H xx yy zz ab cd ef gh ij') && C.simJunk('1 2 3 4 5 6 7 8 9 10 11 12 13 14') && !C.simJunk('In the beginning God created the heavens and the earth. The earth was formless and empty, and darkness was on the face of the deep.'));
{ const text = 'First paragraph with enough words to stand as a passage of its own, telling a short story about a river and a boat that went down it in the morning light.\n\nSecond paragraph, also long enough, about the people on the bank who watched the boat go by and wondered where it would end up that day, if anywhere at all.\n\n' + 'Third. '.repeat(120);
  const cuts = C.simCut(text, () => true); ok('a section is cut into passages whose positions are inside the section and that do not overlap', cuts.length >= 2 && cuts.every(([a, b], i) => a >= 0 && b <= text.length && b > a && (i === 0 || a >= cuts[i - 1][1])), cuts); }

/* ── what the page shows for a search: passages gathered into sections and traditions (made-up passages, so no index is needed) ── */
{
  const mk = (id, sec, score) => ({ id, sec, score, a: 0, len: 300 });      // one passage per section, so a section's region is its score
  const collOf = (id) => ({ x: 4, e: 1, n: 0, m: 2 })[id[0]];
  const res = [mk('x-a', 0, 10), mk('x-b', 0, 9.5), mk('x-c', 0, 9.2), mk('x-d', 0, 8.9), mk('x-e', 0, 8.8),        // five close sections of one tradition: its best two, then a third and a fourth, never a fifth
    mk('e-a', 0, 9.9), mk('e-b', 0, 9.8), mk('e-b', 1, 9.6), mk('e-c', 0, 9.0), mk('e-c', 1, 8.9), mk('e-d', 0, 8.55), mk('e-f', 0, 8.2),   // other sections of a book already shown (9.6, 8.9) are passed over for the next book
    mk('n-a', 0, 8.9), mk('n-b', 0, 8.6), mk('n-c', 0, 8.45),                                                         // a third just under 85% of the best match of all (10)
    mk('m-a', 0, 8.9), mk('m-b', 0, 8.6), mk('m-c', 0, 8.51), mk('m-d', 0, 8.45)];                                    // a third just over it, and a fourth just under
  const ids = (G, c) => G.groups.find((g) => g.coll === c).items.map((x) => x.id + '#' + x.sec).join(' ');
  const two = C.simGroup(res, { collOf, perTrad: 2 });
  ok('given no margin, each tradition keeps its best two sections', ids(two, 4) === 'x-a#0 x-b#0' && ids(two, 1) === 'e-a#0 e-b#0' && ids(two, 0) === 'n-a#0 n-b#0' && ids(two, 2) === 'm-a#0 m-b#0', [ids(two, 4), ids(two, 1), ids(two, 0), ids(two, 2)]);
  ok('the page’s rule is two sections, up to four in all, and a margin of 15% of the best match of all', C.SIM_SHOW.perTrad === 2 && C.SIM_SHOW.cap === 4 && C.SIM_SHOW.strong === 0.85, C.SIM_SHOW);
  const G = C.simGroup(res, Object.assign({}, C.SIM_SHOW, { collOf }));
  ok('a third and a fourth section are added when each is within 15% of the best match of all, and a fifth never', ids(G, 4) === 'x-a#0 x-b#0 x-c#0 x-d#0', ids(G, 4));
  ok('a section just under the margin is left out, one just over it is kept', ids(G, 0) === 'n-a#0 n-b#0' && ids(G, 2) === 'm-a#0 m-b#0 m-c#0', [ids(G, 0), ids(G, 2)]);
  ok('a third or fourth is never another section of a book the tradition already shows: the next book is taken instead', ids(G, 1) === 'e-a#0 e-b#0 e-c#0 e-d#0', ids(G, 1));
  ok('the best match of all and the order of the traditions do not change', G.top === 10 && G.groups.map((g) => g.coll).join(',') === two.groups.map((g) => g.coll).join(','), [G.top, G.groups.map((g) => g.coll)]);
}

/* ── the passage vectors in two parts (q1 in chunks-2.js and q2 in chunks-4.js, so that no file reaches 25 MiB; a copy made before 24 November 2026 has them whole as q): joined end to end, and a part that did not load is refused (a made-up index of six passages) ── */
{
  const K = 4; const N = 6; const q = Int8Array.from({ length: N * K }, (_, i) => ((i * 7) % 100) - 50); const b64 = (a) => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
  const data = (qs) => ({ index: { dims: K, words: 1, vocab: ['a'], idf: [1], texts: ['t-x'], textChars: { 't-x': 1 }, built: 'x' }, terms: { q: b64(new Int8Array(K)), s: b64(new Float32Array(1)) },
    chunks: Object.assign({ n: N, sn: b64(new Uint8Array(N)), sc: b64(new Uint16Array(0)), sw: b64(new Uint8Array(0)), s: b64(new Float32Array(N)), t: b64(new Uint16Array(N)), c: b64(new Uint16Array(N)), a: b64(new Uint32Array(N)), l: b64(new Uint16Array(N)) }, qs) });
  const whole = C.simPrepare(data({ q: b64(q) })); const halves = C.simPrepare(data({ q1: b64(q.slice(0, 3 * K)), q2: b64(q.slice(3 * K)) }));
  ok('the passage vectors come whole in one file or in two parts, and join end to end into the same table', whole.q.length === N * K && halves.q.length === N * K && halves.q.every((v, i) => v === q[i] && v === whole.q[i]), [whole.q.length, halves.q.length]);
  let refused = ''; try { C.simPrepare(data({ q1: b64(q.slice(0, 3 * K)) })); } catch (e) { refused = String(e.message); }
  ok('a part of the vectors that did not load is refused, not searched: fewer vector numbers than passages × dimensions throws', /incomplete/.test(refused), refused);
  ok('simJoin joins parts of any kind of table (two parts of a 16-bit table, with a part that is not there between them) and nothing else', (() => { const u = Uint16Array.from([1, 2, 3, 4, 5]); const j = C.simJoin(Uint16Array, b64(u.slice(0, 2)), undefined, b64(u.slice(2))); return j.length === 5 && j.every((v, i) => v === u[i]); })());
}

/* ── the built index ── */
const dir = path.join(ROOT, 'similar');
if (!fs.existsSync(path.join(dir, 'chunks.js'))) { console.log(`similar: ${pass} passed, ${fail} failed (similar/ not built: run node tools/build_similar.js; the index tests were skipped)`); process.exit(fail ? 1 : 0); }
globalThis.BEATLAB_TEXTS = { meta: {}, data: {}, add(id, meta, secs) { this.data[id] = { meta, secs }; }, addIndex(o) { Object.assign(this.meta, o); } };
vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'texts', 'index.js'), 'utf8'));
['index', 'terms', 'chunks', 'chunks-2', 'chunks-3', 'chunks-4'].filter((n) => fs.existsSync(path.join(dir, n + '.js'))).forEach((n) => vm.runInThisContext(fs.readFileSync(path.join(dir, n + '.js'), 'utf8')));      // chunks.js is split into four files, each under 25 MiB (the vectors in two halves: chunks-2.js and chunks-4.js)
const t0 = Date.now(); const P = C.simPrepare(BEATLAB_SIM.data); const prepMs = Date.now() - t0; P.info = BEATLAB_SIM.data.index;
const meta = BEATLAB_TEXTS.meta; const stale = new Set(); P.texts.forEach((id, i) => { if (!meta[id] || meta[id].chars !== P.textChars[id]) stale.add(i); });
if (stale.size) warn.push(`${stale.size} text(s) changed since the index was built (${[...stale].slice(0, 6).map((i) => P.texts[i]).join(', ')}): rebuild with node tools/build_similar.js`);
ok('the index is built from the library: between 150,000 and 350,000 passages over 200 or more texts (about 320,000 over 445 on 24 November 2026; 296,000 over 419 on 17 November), a vocabulary of 25,000 to 50,000 words, 64 dimensions', P.N > 150000 && P.N < 350000 && P.texts.length >= 200 && P.V > 25000 && P.V < 50000 && P.K === 64, [P.N, P.texts.length, P.V, P.K]);
{ const sizes = fs.readdirSync(dir).filter((f) => /\.js$/.test(f)).map((f) => [f, fs.statSync(path.join(dir, f)).size]);
  ok('no file of the index is 25 MiB or more (a free static host refuses it: when a rebuild grows past it, split further in tools/split_similar.py)', sizes.length >= 6 && sizes.every(([, s]) => s < 25 * 1048576), sizes.filter(([, s]) => s >= 25 * 1048576)); }
ok('the passage vectors are whole: a row of 64 numbers for every passage, joined from the two halves (chunks-2.js and chunks-4.js)', P.q.length === P.N * P.K, [P.q.length, P.N * P.K]);
ok('every passage points into a real section of a real text', (() => { const seen = new Set(); for (let i = 0; i < P.N; i += 97) { const id = P.texts[P.text[i]]; if (!meta[id]) return false; if (P.a[i] < 0 || P.len[i] < 150 || P.len[i] > 4000) return false; seen.add(id); } return seen.size > 100; })());
ok('the index loads in well under a second once the files are read', prepMs < 1500, prepMs);
const load = (id) => { if (!BEATLAB_TEXTS.data[id]) vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'texts', id + '.js'), 'utf8')); return BEATLAB_TEXTS.data[id]; };
ok('a stored passage is still the passage it was cut from (checked in Genesis, the Qur’an and the Mahabharata)', ['b-gen', 'x-qur', 'x-mbh'].every((id) => { if (stale.has(P.textIdx[id])) return true; const ti = P.textIdx[id]; let n = 0; for (let i = 0; i < P.N && n < 20; i++) { if (P.text[i] !== ti) continue; const sec = load(id).secs[P.sec[i]]; if (!sec) return false; const tx = String(sec[1]).slice(P.a[i], P.a[i] + P.len[i]); if (tx.length !== P.len[i] || !C.simTerms(tx).length) return false; n++; } return n > 0; }));
const find = (id, phrase, len) => { const { secs } = load(id); for (let si = 0; si < secs.length; si++) { const i = secs[si][1].indexOf(phrase); if (i >= 0) return secs[si][1].slice(i, i + len); } return null; };
const collOfGroup = { hb: 0, dc: 0, or: 0, nt: 0, ps: 1, ds: 1, ec: 1, me: 2, eg: 2, gr: 3, in: 4, bu: 4, ja: 4, sk: 4, ir: 5, is: 5, ch: 6, ne: 7, am: 8, na: 8, af: 8, pa: 8 };
const coll = (id) => { const l = LIB.LIB_BY_ID[id]; return l ? collOfGroup[l.group] : -1; };
/* what the page shows for a passage: sections grouped by tradition, the passage's own tradition left out, books that scholars have set beside it given a small prior (the curated Parallels) */
const PAR = require('../src/js/2q-data-parallels.js').PARALLELS; const pairKey = (a, b) => [a, b].sort().join('|'); const PAIRS = new Set(); PAR.forEach((p) => (p.links || []).forEach(([a, b]) => PAIRS.add(pairKey(p.items[a - 1][0], p.items[b - 1][0]))));
const near = (text, fromId) => { const emb = C.simEmbed(P, text); const own = fromId ? P.textIdx[fromId] : -1; const oc = fromId ? coll(fromId) : -1;
  const t = Date.now(); const res = C.simSearch(P, emb, { skipText: (x) => stale.has(x) || x === own || (oc >= 0 && coll(P.texts[x]) === oc) || P.texts[x] === 'p-lxx', pool: 4000, perText: 100000, limit: 4000 }); const ms = Date.now() - t;
  const G = C.simGroup(res, Object.assign({}, C.SIM_SHOW, { collOf: coll, bonus: fromId ? (id) => (PAIRS.has(pairKey(fromId, id)) ? 1.2 : 0) : null })); const groups = G.groups.filter((g) => g.best >= 0.42 * G.top);
  const top = new Set(groups.flatMap((g) => g.items.map((x) => x.id))); return { res, top, ms, emb, groups, best: G.top }; };
{
  const noahArk = near(find('b-gen', 'Make a ship of gopher wood', 520), 'b-gen'); const noahDove = near(find('b-gen', 'He himself sent out a dove', 520), 'b-gen');
  ok('Noah and the ark: the Babylonian flood story (Gilgamesh XI) is the closest in the Near East', noahArk.top.has('x-gil') && noahDove.top.has('x-gil'), [[...noahArk.top], [...noahDove.top]]);
  const flood = near('A man is warned by a god that a great flood is coming, so he builds a boat, takes his family and the animals aboard, and afterwards sends out birds to find dry land.', '');
  ok('described in plain words, the same story finds Noah’s flood in Genesis', flood.top.has('b-gen'), [...flood.top]);
  const creation = near(find('b-gen', 'In the beginning, God created', 520), 'b-gen'); ok('Genesis 1: other traditions’ accounts of a beginning turn up (Vedic, Hermetic, Chinese, Norse, Japanese, Maori, Maya)', ['x-rig', 'x-yaj', 'x-ath', 'x-brah', 'x-herm', 'x-yi', 'x-lie', 'x-dao', 'x-poe', 'x-pre', 'x-nih', 'x-ran', 'x-pop', 'x-enu', 'x-gil'].filter((x) => creation.top.has(x)).length >= 2, [...creation.top]);
  const swords = near(find('b-isa', 'beat their swords into plowshares', 420), 'b-isa'); ok('swords into ploughshares: one of the two curated partners is shown, the Great Law of Peace’s buried weapons or Mozi on impartial care (the Great Law dropped out of the shown set when four texts were added on 14 Nov 2026; the benchmark overall rose from about 21% to 25%)', swords.top.has('x-glp') || swords.top.has('x-moz'), [...swords.top]);
  const tiamat = near(find('x-enu', 'Tiamat', 520), 'x-enu'); ok('Marduk and Tiamat: Genesis and the Norse and Japanese beginnings', tiamat.top.has('b-gen') && (tiamat.top.has('x-poe') || tiamat.top.has('x-nih')), [...tiamat.top]);
  const rule = near(find('n-mat', 'whatever you desire for men to do to you', 260), 'n-mat');
  const ruleSecs = new Map(); for (const r of rule.res) { const k = r.id + '#' + r.sec; if (!ruleSecs.has(k) || ruleSecs.get(k).score < r.score) ruleSecs.set(k, r); }
  const ruleBest = [...ruleSecs.values()].sort((a, b) => b.score - a.score).slice(0, 15).map((r) => r.id);
  /* the page shows the two best sections of each tradition's collection (and up to two more, each from another book, when they are nearly as close as the best match of all), so as books are added the Talmud can fall out of the shown set while still ranking among the best matches (on 16 November 2026 it ranked 9th, but the two Early Christian places went to Benedict and Tertullian, whose passages match the narrow gate of the same verses): the book is accepted if it is shown or among the fifteen best sections */
  ok('the golden rule finds at least one of the traditions that say it (Dhammapada, Talmud, Analects, Mahabharata, Mozi), shown or among the fifteen best sections', ['x-dhp', 'e-tal', 'x-ana', 'x-mbh', 'x-moz', 'x-kn', 'x-dn'].some((x) => rule.top.has(x) || ruleBest.includes(x)), [[...rule.top], ruleBest]);
  ok('a passage is never matched with its own book or tradition (Genesis finds nothing in the Bible)', [noahArk, creation, swords].every((r) => r.res.every((x) => coll(x.id) !== 0)));
  ok('each tradition shows its two best sections and at most two more, each from another book and within 15% of the best match of all; the closest tradition comes first, the closest section first', [noahArk, flood, creation, rule].every((r) => r.groups.every((g) => g.items.length <= C.SIM_SHOW.cap && g.items.slice(2).every((x, k) => x.region >= C.SIM_SHOW.strong * r.best && g.items.slice(0, 2 + k).every((y) => y.id !== x.id)) && g.items.every((x, i) => i === 0 || x.region <= g.items[i - 1].region)) && r.groups.every((g, i) => i === 0 || g.best <= r.groups[i - 1].best)));
  ok('a search of about 320,000 passages takes well under a second', Math.max(noahArk.ms, flood.ms, creation.ms) < 800, [noahArk.ms, flood.ms, creation.ms]);
  const dup = C.simSearch(P, C.simEmbed(P, find('b-gen', 'Make a ship of gopher wood', 520)), { skipText: (x) => P.texts[x] === 'b-gen', pool: 2500, limit: 50 });
  ok('the same passage in another edition (the Septuagint’s Genesis) is flagged as a repeat, not offered as a match', (dup.dups || []).some((d) => d.id === 'p-lxx') && dup.every((r) => !r.dup), (dup.dups || []).map((d) => d.id));
  ok('an empty or wordless query is refused', C.simEmbed(P, 'the of and') === null && C.simEmbed(P, '') === null);
  ok('each match carries the words it shares, as the words the passages use', (() => { const tx = find('x-gil', 'brought out a dove', 420) || ''; const emb = C.simEmbed(P, find('b-gen', 'He himself sent out a dove', 520)); const l = C.simLexical(P, emb, tx); return l.shared.length >= 2 && l.shared.some((s) => /dove|raven|swallow/i.test(s.raw)); })());
}
/* ── the page's own examples ("Try: A flood and a boat, The golden rule, …"): each has to be a passage the page accepts and answers ── */
{
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', '6u-similar.js'), 'utf8');
  const at = src.indexOf('const SIM_EXAMPLES = '); const end = src.indexOf('\n];', at);
  const examples = at >= 0 && end > at ? new Function('return ' + src.slice(at + 'const SIM_EXAMPLES = '.length, end + 2))() : [];
  const MIN_TERMS = 3;      // simRun in 6u-similar.js answers "too few distinctive words" for fewer
  ok('the page still refuses a passage of fewer than three known words (the examples below are held to that rule)', /emb\.n < 3/.test(src));
  ok('the page groups its results with the shared rule SIM_SHOW, the one these tests and the benchmark use', /simGroup\(res, Object\.assign\(\{\}, SIM_SHOW,/.test(src));
  ok('the page offers at least five examples, each a name and a text of at most 900 characters (the size of the box), names all different', examples.length >= 5 && examples.every((e) => Array.isArray(e) && e.length === 2 && e[0] && e[1] && e[1].length <= 900) && new Set(examples.map((e) => e[0])).size === examples.length, examples.map((e) => e[0]));
  const few = []; const thin = []; const sizes = [];
  for (const [name, text] of examples) { const emb = C.simEmbed(P, text); if (!emb || emb.n < MIN_TERMS) { few.push(name + ':' + (emb ? emb.n : 0)); continue; } const r = near(text, ''); sizes.push(r.groups.map((g) => g.items.length).join('')); if (r.groups.length < 3 || r.top.size < 5) thin.push(name + ':' + r.groups.length + ' traditions, ' + r.top.size + ' books'); }
  ok('the extra sections are at work on real searches: across the examples some tradition shows three or four sections (on 16 November 2026 three of the six examples did), none five', sizes.some((s) => /[34]/.test(s)) && sizes.every((s) => !/[5-9]/.test(s)), sizes);
  ok('every example has at least three words the index knows (the golden rule, first worded in everyday words, left two and the page answered only “too few distinctive words”)', examples.length >= 5 && !few.length, few);
  ok('every example finds something to show: passages from at least three traditions in at least five books', examples.length >= 5 && !thin.length, thin);
}
/* ── motifs ── */
{
  const MO = require('../src/js/2x-motifs.js'); globalThis.simTerms = C.simTerms; globalThis.simMotifScores = MO.simMotifScores; const ms = MO.simMotifInit();
  ok('the motif list is well formed: unique ids, known kinds, every motif can be started by a core word or a phrase, at least 55 of them', ms.length >= 55 && new Set(ms.map((m) => m.id)).size === ms.length && ms.every((m) => MO.SIM_MOTIF_KINDS[m.kind] && m.name && m.line && (m.core.size || m.phrases.length) && m.min >= 4), ms.filter((m) => !(m.core.size || m.phrases.length)).map((m) => m.id));
  const tag = (text) => MO.simMotifScores(text).map(([i]) => ms[i].id);
  ok('Noah’s flood is tagged as the flood; a passage on the golden rule as the golden rule; the first lines of Genesis as water and darkness before the world', tag(find('b-gen', 'He himself sent out a dove', 420)).includes('flood') && tag('Therefore whatever you desire for men to do to you, do the same to them; do not do to others what you would not want done to yourself.').includes('golden-rule') && tag(find('b-gen', 'In the beginning, God created', 420)).includes('chaos-waters'));
  ok('ordinary narrative is not tagged: a paragraph of Joseph’s dealings with his brothers carries no motif', tag(find('b-gen', 'Joseph said to them, “What deed is this that you have done', 500) || 'Joseph said to his brothers, come near to me, and they came near, and he said, I am Joseph your brother, whom you sold into Egypt.').length === 0);
  const d = BEATLAB_SIM.data.index; ok('the index was built from the same motif list (otherwise rebuild: node tools/build_similar.js)', d.motifVersion === MO.simMotifVersion(), [d.motifVersion, MO.simMotifVersion()]);
  const cnt = {}; for (let i = 0; i < P.N; i++) { const id = P.mo[i * 3]; if (id !== 255) cnt[id] = (cnt[id] || 0) + 1; }
  ok('every motif finds passages in the library, none finds more than a tenth of it (a motif that is everywhere says nothing)', ms.filter((m) => m.id !== 'trickster').every((m) => (cnt[m.idx] || 0) >= 5 && cnt[m.idx] < P.N / 10), ms.filter((m) => (cnt[m.idx] || 0) < 5 || cnt[m.idx] >= P.N / 10).map((m) => m.id + ':' + (cnt[m.idx] || 0)));
  const flood = Object.entries(cnt).length; ok('between 5 and 20 percent of passages carry a motif', (() => { let n = 0; for (let i = 0; i < P.N; i++) if (P.mo[i * 3] !== 255) n++; return n / P.N > 0.05 && n / P.N < 0.2; })());
  const ex = C.simEmbed(P, find('b-gen', 'He himself sent out a dove', 520)); ok('a search reports the motif a result shares with the query', ex.motifs && ex.motifs.length > 0);
}
/* the size the page tells a visitor on a web address that the first search downloads (SIM_INDEX_MB in 6u-similar.js, shown before the first search) is the size of the index folder to within 3 MB: change the
   constant when the index is rebuilt (it was rebuilt on 24 November 2026: 66.3 MB, 63.3 MiB, seven files) */
{ const mb = +(fs.readFileSync(path.join(__dirname, '../src/js/6u-similar.js'), 'utf8').match(/^const SIM_INDEX_MB = (\d+);/m) || [])[1]; const dir = path.join(ROOT, 'similar');
  const total = fs.readdirSync(dir).filter((f) => /\.js$/.test(f)).reduce((n, f) => n + fs.statSync(path.join(dir, f)).size, 0) / 1048576;
  ok('the size Find similar names for its first download (SIM_INDEX_MB) is the size of the index folder to within 3 MB', mb > 0 && Math.abs(mb - total) <= 3, [mb, total]); }
warn.forEach((w) => console.log('NOTE', w));
console.log(`similar: ${pass} passed, ${fail} failed (${P.N} passages, ${P.texts.length} texts, built ${P.built})`);
process.exit(fail ? 1 : 0);
