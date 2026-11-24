/* Reader marks: highlights, bookmarks, progress and threads (pure logic in src/js/2p-marks-core.js) */
const M = require('../src/js/2p-marks-core.js');
let pass = 0; let fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const eq = (name, a, b) => ok(name, JSON.stringify(a) === JSON.stringify(b), { got: a, want: b });

/* ── paragraphs and verse numbers ── */
eq('blocks split on blank lines', M.textBlocks('a\n\nb\n\n\nc'), ['a', 'b', 'c']);
eq('plain block', M.blockParts('Hello'), { head: null, body: 'Hello' });
eq('heading only', M.blockParts('## Genesis 1'), { head: 'Genesis 1', body: '' });
eq('heading with body', M.blockParts('## Part 2\nIn the beginning'), { head: 'Part 2', body: 'In the beginning' });
eq('visible text drops verse numbers', M.visibleText('[[1]] In the beginning [[2]] God'), ' In the beginning  God');
const secs = [['One', '## Head\n[[1]] In the beginning, God created the heavens and the earth.\n\n[[2]] The earth was formless.'], ['Two', 'Plain paragraph here.']];
eq('paragraph lookup uses the paragraph after a heading', M.paragraphAt(secs, 0, 0), ' In the beginning, God created the heavens and the earth.');
eq('second paragraph', M.paragraphAt(secs, 0, 1), ' The earth was formless.');
ok('missing paragraph is null', M.paragraphAt(secs, 5, 0) === null && M.paragraphAt(secs, 0, 9) === null);

/* ── anchors ── */
const vis = 'the cat sat on the mat and the cat left';
eq('anchor kept when it still matches', M.resolveAnchor(vis, { a: 4, b: 7, q: 'cat' }), [4, 7]);
eq('anchor moves to the nearest copy', M.resolveAnchor(vis, { a: 30, b: 33, q: 'cat' }), [31, 34]);
eq('anchor near the start picks the first copy', M.resolveAnchor(vis, { a: 2, b: 5, q: 'cat' }), [4, 7]);
ok('anchor lost when the words are gone', M.resolveAnchor(vis, { a: 0, b: 3, q: 'dog' }) === null);

/* ── marks follow a rebuilt text (OCR clean-up: a junk paragraph dropped, a split paragraph joined, a misread word mended) ── */
{
  const before = [['Part 1', 'Intro words here.'], ['Part 2', 'PSALM TO ENLIL\n\n^THK^HKHI miH$c^dl junk\n\nOh lord who hast sent hunger every-\n\nwhere, how long until he be pacified?\n\nThe wrath of tliy heart, can anyone appease it? The utterance of thy mouth brings destruction.']];
  const after = [['Part 1', 'Intro words here.'], ['Part 2', 'PSALM TO ENLIL\n\nOh lord who hast sent hunger everywhere, how long until he be pacified?\n\nThe wrath of thy heart, can anyone appease it? The utterance of thy mouth brings destruction.']];
  const pa = (secsX, s, p) => M.paragraphAt(secsX, s, p);
  const q1 = 'The utterance of thy mouth'; const v4 = pa(before, 1, 4); const a1 = v4.indexOf(q1);
  const q2 = 'wrath of tliy heart, can anyone appease it'; const a2 = v4.indexOf(q2);
  const m = M.marksBlank();
  m.hl.push({ id: 'h1', s: 1, p: 4, a: a1, b: a1 + q1.length, q: q1, c: 'gold' });       // exact words, paragraph moved
  m.hl.push({ id: 'h2', s: 1, p: 4, a: a2, b: a2 + q2.length, q: q2, c: 'blue' });       // a word mended by the clean-up
  m.hl.push({ id: 'h3', s: 0, p: 0, a: 0, b: 5, q: 'Intro', c: 'gold' });                // still in place
  m.hl.push({ id: 'h4', s: 1, p: 1, a: 0, b: 9, q: 'miH$c^dl', c: 'rose' });            // its words are gone
  m.bm.push({ id: 'b1', s: 1, p: 4, q: v4.replace(/\s+/g, ' ').trim().slice(0, 140) });
  m.bm.push({ id: 'b2', s: 1, p: -1, q: 'Part 2' });
  const moved = M.marksRelocate(after, m); const H = Object.fromEntries(m.hl.map((h) => [h.id, h]));
  eq('three marks moved (two highlights, one bookmark)', moved, 3);
  ok('an exact quote is found in its new paragraph', H.h1.s === 1 && H.h1.p === 2 && pa(after, 1, 2).slice(H.h1.a, H.h1.b) === q1, H.h1);
  ok('a quote with a mended word is found by its other words', H.h2.p === 2 && H.h2.q === 'wrath of thy heart, can anyone appease it', H.h2);
  ok('the moved highlight now resolves exactly', M.resolveAnchor(pa(after, H.h2.s, H.h2.p), H.h2) !== null);
  ok('a mark still in place is untouched', H.h3.s === 0 && H.h3.p === 0 && H.h3.a === 0);
  ok('a mark that cannot be found is kept as it was', H.h4.s === 1 && H.h4.p === 1 && H.h4.q === 'miH$c^dl');
  ok('a paragraph bookmark follows its paragraph', m.bm[0].p === 2 && m.bm[0].q.startsWith('The wrath of thy heart'), m.bm[0]);
  ok('a section bookmark keeps its section', m.bm[1].s === 1 && m.bm[1].p === -1);
  eq('nothing moves twice', M.marksRelocate(after, m), 0);
  m.v = '3:120'; eq('the text version the marks were checked against is kept', M.marksClean(m).v, '3:120');
  eq('marks start with no version, so the first open checks them', M.marksBlank().v, '');
  eq('no text, no change', M.marksRelocate([], m), 0);
}

/* ── rendering ── */
const raw = '[[1]] In the beginning God made the heaven & the earth.';
const vv = M.visibleText(raw);
const a = vv.indexOf('God made'); const html = M.paraHTML(raw, { hls: [{ id: 'h1', a, b: a + 8, c: 'green', n: 'note "x"' }] });
ok('verse number becomes a superscript', html.startsWith('<sup class="vn">1</sup>'));
ok('highlight wraps exactly the words', html.includes('<span class="hl hl-green has-note" data-h="h1" title="note &quot;x&quot;">God made</span>'), html);
ok('ampersand escaped', html.includes('&amp; the earth'));
eq('highlights do not change the visible words', html.replace(/<sup[^>]*>\d+<\/sup>/g, '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&'), vv);
const html2 = M.paraHTML(raw, { find: 'the', hls: [{ id: 'h1', a, b: a + 8, c: 'gold' }] });
ok('search hits are marked', (html2.match(/<mark>/g) || []).length === 3, html2);
ok('markup is never produced from text', !M.paraHTML('<b>x</b> [[3]] y', {}).includes('<b>'));
// a highlight across a verse number is split around it but covers both sides
const raw2 = '[[1]] alpha beta [[2]] gamma delta';
const v2 = M.visibleText(raw2); const x = v2.indexOf('beta'); const y = v2.indexOf('gamma') + 5;
const h3 = M.paraHTML(raw2, { hls: [{ id: 'z', a: x, b: y, c: 'blue' }] });
ok('highlight spanning a verse number', (h3.match(/class="hl hl-blue/g) || []).length === 2 && h3.includes('<sup class="vn">2</sup>'), h3);
eq('…and still reads the same', h3.replace(/<[^>]+>/g, ''), '1 alpha beta 2 gamma delta');
// overlapping highlights: the later one is on top
const h4 = M.paraHTML('abcdef', { hls: [{ id: '1', a: 0, b: 4, c: 'gold' }, { id: '2', a: 2, b: 6, c: 'rose' }] });
ok('later highlight wins the overlap', h4.includes('data-h="1">ab<') && h4.includes('data-h="2">cd<'), h4);
ok('unknown colour falls back to gold', M.paraHTML('abc', { hls: [{ id: '1', a: 0, b: 3, c: 'pink' }] }).includes('hl-gold'));

/* ── highlights ── */
const m = M.marksBlank();
const h1 = M.hlAdd(m, { s: 0, p: 0, a: 1, b: 10, q: 'In the be', c: 'blue', n: 'beginning' }, 5);
ok('highlight added', h1 && m.hl.length === 1 && h1.c === 'blue' && h1.t === 5);
ok('empty or backwards ranges are refused', !M.hlAdd(m, { s: 0, p: 0, a: 5, b: 5, q: 'x' }) && !M.hlAdd(m, { s: 0, p: 0, a: 1, b: 4, q: '  ' }) && m.hl.length === 1);
const g1 = M.hlAdd(m, { s: 0, p: 1, a: 0, b: 5, q: 'first', g: 'grp' }); const g2 = M.hlAdd(m, { s: 0, p: 2, a: 0, b: 6, q: 'second', g: 'grp' });
ok('colour defaults to gold', g1.c === 'gold');
M.hlUpdate(m, g1.id, { c: 'violet' });
ok('recolouring a group recolours every piece', g2.c === 'violet' && h1.c === 'blue');
M.hlUpdate(m, h1.id, { n: 'x'.repeat(5000) });
ok('notes are capped', h1.n.length === M.MARK_LIMITS.note);
ok('removing one piece removes the group', M.hlRemove(m, g2.id) === 2 && m.hl.length === 1);
ok('removing unknown id does nothing', M.hlRemove(m, 'nope') === 0);
const big = M.hlAdd(m, { s: 0, p: 0, a: 0, b: 9999, q: 'q'.repeat(9000) });
ok('quotes are capped', big.q.length === M.MARK_LIMITS.quote);

/* ── bookmarks, progress ── */
ok('bookmark toggles on', M.bmToggle(m, 2, 3, 'A snippet   of\n text', 9) === true && m.bm.length === 1 && m.bm[0].q === 'A snippet of text');
ok('bookmark toggles off', M.bmToggle(m, 2, 3, 'x') === false && m.bm.length === 0);
M.bmToggle(m, 4, null, 'section'); ok('section bookmark has p = -1', m.bm[0].p === -1);
M.rsSet(m, 3, true); M.rsSet(m, 1, true); M.rsSet(m, 3, true);
eq('read sections kept sorted and unique', m.rs, [1, 3]);
eq('progress', M.progressOf(m, 8), { done: 2, total: 8, pct: 25 });
M.rsSet(m, 1, false); eq('unread', m.rs, [3]);
eq('progress ignores sections beyond the text', M.progressOf({ rs: [0, 9] }, 5), { done: 1, total: 5, pct: 20 });
eq('first unread', M.firstUnread({ rs: [0, 1, 3] }, 6), 2);
eq('first unread when all read', M.firstUnread({ rs: [0, 1] }, 2), 1);
const cleaned = M.marksClean({ hl: [{ id: 'a', s: 0, p: 0, a: 0, b: 3, q: 'abc' }, { id: 'bad' }, null], bm: [{ id: 'b', s: 1 }, 'x'], rs: [2, 2, -1, 'z', 5], n: 99999999, last: { s: 3, p: 1, t: 7 } });
ok('cleaning drops malformed marks', cleaned.hl.length === 1 && cleaned.bm.length === 1);
eq('cleaning read list', cleaned.rs, [2, 5]);
ok('cleaning bounds the counts', cleaned.n === 100000 && cleaned.last.s === 3);
eq('cleaning junk gives a blank', M.marksClean('junk'), M.marksBlank());

/* ── threads ── */
const t = M.threadNew('Floods');
ok('thread starts empty', t.items.length === 0 && t.title === 'Floods');
ok('untitled thread gets a name', M.threadNew('   ').title === '   ' || M.threadNew('').title === 'Untitled thread');
const i1 = M.threadAddItem(t, { tid: 'x-gil', s: 1, p: 2, a: 0, b: 20, q: 'Utnapishtim said', label: 'Gilgamesh' });
const i2 = M.threadAddItem(t, { tid: 'b-gen', s: 5, p: 0, a: 0, b: 20, q: 'God said to Noah' });
ok('items added', i1 && i2 && t.items.length === 2);
ok('bad ids and empty quotes are refused', !M.threadAddItem(t, { tid: '../x', q: 'ok' }) && !M.threadAddItem(t, { tid: 'x-gil', q: '  ' }) && t.items.length === 2);
const t2 = M.threadNew('cap'); for (let k = 0; k < 20; k++) M.threadAddItem(t2, { tid: 'x-gil', q: 'q' + k });
ok('a thread holds at most 12 passages', t2.items.length === 12);
ok('link between two items', M.threadLink(t, i1.id, i2.id, 'borrowing', 'retold') && t.links.length === 1);
ok('re-linking replaces the link', M.threadLink(t, i2.id, i1.id, 'parallel', '') && t.links.length === 1 && t.links[0].kind === 'parallel');
ok('bad links refused', !M.threadLink(t, i1.id, i1.id, 'parallel') && !M.threadLink(t, i1.id, 'nope', 'parallel') && !M.threadLink(t, i1.id, i2.id, 'invented'));
ok('move down', M.threadMove(t, i1.id, 1) && t.items[1].id === i1.id && !M.threadMove(t, i1.id, 1));
M.threadRemoveItem(t, i1.id);
ok('removing a passage removes its links', t.items.length === 1 && t.links.length === 0);

/* ── finding a passage again from a phrase ── */
const texts = [['Gen 1', '## Gen 1\n[[1]] In the beginning, God created the heavens and the earth. [[2]] The earth was formless and empty.\n\n[[3]] God said, "Let there be light," and there was light.'], ['Gen 2', 'Then the man   and his wife\nwere both naked. They were not ashamed. And more words follow here without any stop at all, going on for some time yet.']];
const r1 = M.resolveSpot(texts, 'in the beginning', 600);
ok('phrase found (case-insensitive)', r1 && r1.s === 0 && r1.p === 0 && r1.q.startsWith('In the beginning'), r1);
ok('passage runs on to the end of a sentence near the length', r1.q.endsWith('empty.'), r1.q);
const r2 = M.resolveSpot(texts, 'let there be light', 20);
ok('passage in the next paragraph', r2 && r2.p === 1 && r2.q.startsWith('Let there be light'), r2);
ok('whitespace differences do not matter', M.resolveSpot(texts, 'the man and his wife', 40).s === 1);
ok('anchor offsets point at the quote', (() => { const v = M.paragraphAt(texts, r1.s, r1.p); return v.slice(r1.a, r1.b) === r1.q; })());
ok('missing phrase is null', M.resolveSpot(texts, 'no such words', 100) === null);
ok('empty phrase is null', M.resolveSpot(texts, '   ', 100) === null);

console.log(`marks: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
